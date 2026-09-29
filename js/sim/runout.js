/**
 * Runout planner. Every pocket in the plan is one the simulator actually makes
 * at the listed tip and speed. If the layout has no full legal runout, the plan
 * stops and says so — it does not invent a pocket.
 *
 * 8-ball thinks like a player: find problem balls first, find a ball that can
 * open them, run one side then the other, and keep a key ball for the 8.
 * Easy / medium / hard are different complete patterns, not one hard line.
 */
import * as P from './physics.js';
import * as TC from './tableCal.js';
import { pathClear } from './solver.js';

const POCKETS = ['TL', 'TR', 'BL', 'BR', 'TM', 'BM'];
const TIPS = [{ v: 0, h: 0 }, { v: 0.75, h: 0 }, { v: -0.75, h: 0 }];
const STYLES = {
  easy: { id: 'easy', label: 'Easy', maxCut: 34, sideFirst: true, reserveKey: true, thinOk: false },
  medium: { id: 'medium', label: 'Medium', maxCut: 48, sideFirst: true, reserveKey: true, thinOk: true },
  hard: { id: 'hard', label: 'Hard', maxCut: 70, sideFirst: false, reserveKey: false, thinOk: true }
};

const solid = (id) => Number(id) >= 1 && Number(id) <= 7;
const stripe = (id) => Number(id) >= 9 && Number(id) <= 15;

export function groupChoices(balls) {
  const ids = balls.filter((b) => b.id !== 'cue' && b.id !== 8).map((b) => b.id);
  return { solids: ids.some(solid), stripes: ids.some(stripe) };
}

function simOpt(table) {
  return TC.isNine(table) ? { record: false, maxTime: 14 } : { record: false, maxTime: 14, table };
}

function pocketedOnly(res, id, pocket) {
  if (res.scratch) return false;
  if (!res.firstHit || String(res.firstHit.ob) !== String(id)) return false;
  const pots = res.pocketed.filter((p) => p.id !== 'cue');
  return pots.length === 1 && String(pots[0].id) === String(id) && pots[0].pocket === pocket;
}

function cueRailsBefore(res) {
  const t = res.firstHit ? res.firstHit.t : Infinity;
  return res.events.filter((e) => e.type === 'cushion' && e.ball === 'cue' && e.t < t - 1e-4).length;
}

function cutOf(cue, ob, pocket, Rd) {
  const g = P.ghostAim(cue, ob, pocket, Rd);
  const dx = g.ghost.x - cue.x;
  const dy = g.ghost.y - cue.y;
  const nx = ob.x - g.ghost.x;
  const ny = ob.y - g.ghost.y;
  const dl = Math.hypot(dx, dy) || 1;
  const nl = Math.hypot(nx, ny) || 1;
  const cos = Math.max(-1, Math.min(1, (dx * nx + dy * ny) / (dl * nl)));
  const deg = (Math.acos(cos) * 180) / Math.PI;
  const fullness = 1 - Math.sin((deg * Math.PI) / 180);
  const lateral = (g.ghost.x - ob.x) * -dy / dl + (g.ghost.y - ob.y) * dx / dl;
  const side = deg < 0.8 ? 'center' : lateral > 0 ? 'right' : 'left';
  return { deg, fullness, side, ghost: g.ghost, aim: g.aim };
}

function cutWord(fullness) {
  if (fullness >= 0.93) return 'Full';
  if (fullness >= 0.68) return '¾';
  if (fullness >= 0.4) return '½';
  if (fullness >= 0.18) return '¼';
  return 'Thin';
}

function tryPocket(layout, id, pocket, table, speed, tip) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const cut = cutOf(cue, ob, pocket, Rd);
  const pk = P.PHYS_POCKETS.find((p) => p.key === pocket);
  if (!pathClear(layout, cue, cut.ghost, ['cue', id], Rd * 2) || !pathClear(layout, ob, { x: pk.x, y: pk.y }, [id, 'cue'], Rd * 2)) return null;
  const aim0 = cut.aim - tip.h * P.SQUIRT_DEG_PER_TIP;
  const shotBase = { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h };
  for (const aim of [aim0, aim0 - 1.2, aim0 + 1.2]) {
    const res = P.simulate(layout, { ...shotBase, aim }, simOpt(table));
    if (pocketedOnly(res, id, pocket) && cueRailsBefore(res) === 0) {
      return { res, aim, speed, tip, pocket, cut: cut.deg, fullness: cut.fullness, side: cut.side, ghost: cut.ghost };
    }
  }
  return null;
}

function clustered(layout, id, r) {
  const b = layout.find((q) => String(q.id) === String(id));
  if (!b) return false;
  return layout.some((o) => o !== b && o.id !== 'cue' && Math.hypot(o.x - b.x, o.y - b.y) < r * 2 + 0.35);
}

function legalNow(balls, game, group) {
  const ids = balls.filter((b) => b.id !== 'cue').map((b) => Number(b.id)).filter((n) => n >= 1 && n <= 15);
  if (game === 9 || game === 10) {
    const left = ids.filter((n) => n <= game).sort((a, b) => a - b);
    return left.length ? [left[0]] : [];
  }
  const mine = ids.filter((n) => (group === 'stripes' ? stripe(n) : solid(n)));
  if (mine.length) return mine;
  return ids.includes(8) ? [8] : [];
}

function nearestGap(balls, id, r) {
  const b = balls.find((x) => String(x.id) === String(id));
  if (!b) return 99;
  let g = 99;
  for (const o of balls) {
    if (String(o.id) === String(id) || o.id === 'cue') continue;
    g = Math.min(g, Math.hypot(o.x - b.x, o.y - b.y) - 2 * r);
  }
  return g;
}

function ballSide(b) {
  if (!b) return 'center';
  if (b.x < 40) return 'head';
  if (b.x > 60) return 'foot';
  return 'center';
}

function sideName(s) {
  return s === 'head' ? 'head (left)' : s === 'foot' ? 'foot (right)' : 'middle';
}

function visiblePockets(layout, id, table) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  const Rd = TC.diagramRadius(table);
  if (!cue || !ob) return [];
  const out = [];
  for (const pocket of POCKETS) {
    const cut = cutOf(cue, ob, pocket, Rd);
    const pk = P.PHYS_POCKETS.find((p) => p.key === pocket);
    if (pathClear(layout, ob, { x: pk.x, y: pk.y }, [id, 'cue'], Rd * 2)) out.push({ pocket, cut: cut.deg, fullness: cut.fullness });
  }
  return out;
}

function hitsFor(layout, id, table, maxCut) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return [];
  const Rd = TC.diagramRadius(table);
  const ranked = POCKETS
    .map((pocket) => ({ pocket, ...cutOf(cue, ob, pocket, Rd) }))
    .sort((a, b) => a.deg - b.deg);
  const hits = [];
  for (const row of ranked) {
    if (maxCut != null && row.deg > maxCut && hits.length) continue;
    for (const speed of [2.25, 3]) {
      const hit = tryPocket(layout, id, row.pocket, table, speed, { v: 0, h: 0 });
      if (hit) {
        hits.push(hit);
        break;
      }
    }
    if (hits.length >= 4) break;
  }
  if (!hits.length) {
    for (const row of ranked) {
      for (const speed of [2, 2.25, 3, 4]) {
        for (const tip of TIPS) {
          const hit = tryPocket(layout, id, row.pocket, table, speed, tip);
          if (hit) hits.push(hit);
        }
        if (hits.length) break;
      }
      if (hits.length >= 2) break;
    }
  }
  return hits;
}

/** Any pocket the simulator can actually make, no cut cap. */
function anyHits(layout, id, table) {
  return hitsFor(layout, id, table, null);
}

function tryBreakout(layout, id, table) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const before = nearestGap(layout, id, Rd);
  const base = P.aimAt(cue, ob);
  let best = null;
  let bestGain = 0.4;
  for (const off of [0, -12, 12, -22, 22, -34, 34, -48, 48]) {
    for (const speed of [2.75, 3.25, 4.5]) {
      for (const tip of [{ v: 0, h: 0 }, { v: 0.75, h: 0 }, { v: -0.5, h: 0 }]) {
        const aim = base + off - tip.h * P.SQUIRT_DEG_PER_TIP;
        const res = P.simulate(layout, { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h, aim }, { ...simOpt(table), maxTime: 8 });
        if (res.scratch || !res.firstHit || String(res.firstHit.ob) !== String(id)) continue;
        const fin = res.final.find((b) => String(b.id) === String(id));
        if (!fin || !fin.on) continue;
        const moved = Math.hypot(fin.x - ob.x, fin.y - ob.y);
        const after = res.final.filter((b) => b.on).map((b) => ({ id: b.id, x: b.x, y: b.y }));
        const gain = moved + Math.max(0, nearestGap(after, id, Rd) - before) * 3;
        if (moved < 1 || gain <= bestGain) continue;
        bestGain = gain;
        const cut = cutOf(cue, ob, 'TM', Rd);
        best = { res, aim, speed, tip, pocket: null, cut: cut.deg, fullness: cut.fullness, side: cut.side, ghost: cut.ghost };
      }
    }
  }
  return best;
}

function problemsOf(layout, ids, table, r) {
  const out = [];
  for (const id of ids) {
    const tied = clustered(layout, id, r);
    const vis = visiblePockets(layout, id, table);
    const noPocket = vis.length === 0;
    if (tied || noPocket) {
      out.push({
        id,
        tied,
        noPocket,
        reason: tied && noPocket ? 'tied up, no pocket' : tied ? 'tied / cluster' : 'no visible pocket'
      });
    }
  }
  return out;
}

function keyScoreAfter(layout, hit, table) {
  const next = hit.res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  const eight = next.find((b) => Number(b.id) === 8);
  const cue = next.find((b) => b.id === 'cue');
  if (!eight || !cue) return -1;
  const Rd = TC.diagramRadius(table);
  let best = 0;
  for (const pocket of POCKETS) {
    const cut = cutOf(cue, eight, pocket, Rd);
    const pk = P.PHYS_POCKETS.find((p) => p.key === pocket);
    if (!pathClear(next, eight, { x: pk.x, y: pk.y }, [8, 'cue'], Rd * 2)) continue;
    const s = 40 - cut.deg + (cut.fullness * 20);
    if (s > best) best = s;
  }
  return best;
}

function findKeyIds(layout, groupIds, table) {
  const keys = [];
  for (const id of groupIds) {
    const hits = hitsFor(layout, id, table, 50);
    let best = -1;
    for (const hit of hits) {
      const s = keyScoreAfter(layout, hit, table);
      if (s > best) best = s;
    }
    if (best > 18) keys.push({ id, score: best });
  }
  keys.sort((a, b) => b.score - a.score);
  return keys.map((k) => k.id);
}

function majoritySide(layout, ids) {
  const counts = { head: 0, foot: 0, center: 0 };
  for (const id of ids) {
    const b = layout.find((x) => String(x.id) === String(id));
    counts[ballSide(b)]++;
  }
  if (counts.head >= counts.foot && counts.head > 0) return 'head';
  if (counts.foot > 0) return 'foot';
  return 'center';
}

function rateHit(hit, layout, style, ctx) {
  const cueEnd = hit.res.final.find((b) => b.id === 'cue');
  let s = 80 - hit.cut * 1.35;
  s -= Math.abs(hit.speed - 2.25) * 4;
  s -= (Math.abs(hit.tip.v) + Math.abs(hit.tip.h)) * 8;
  if (hit.fullness >= 0.68) s += 18;
  else if (hit.fullness >= 0.4) s += 8;
  else if (!style.thinOk) s -= 25;
  const ob = layout.find((b) => String(b.id) === String(ctx.id));
  if (ob) {
    const d = Math.hypot((layout.find((b) => b.id === 'cue')?.x || 0) - ob.x, (layout.find((b) => b.id === 'cue')?.y || 0) - ob.y);
    if (d > 55) s -= 10;
    if (d < 12) s -= 4;
    if (style.sideFirst && ctx.wantSide && ballSide(ob) === ctx.wantSide) s += 16;
    if (style.sideFirst && ctx.wantSide && ballSide(ob) !== ctx.wantSide && ballSide(ob) !== 'center') s -= 10;
  }
  if (ctx.problems.has(Number(ctx.id)) || ctx.problems.has(String(ctx.id))) s += 22;
  if (style.reserveKey && ctx.keys.has(Number(ctx.id)) && ctx.left > 1) s -= 28;
  if (ctx.left === 1 && Number(ctx.id) !== 8) s += keyScoreAfter(layout, hit, ctx.table) * 0.35;
  if (ctx.problems.size && cueEnd && cueEnd.on) {
    for (const pid of ctx.problems) {
      const pb = layout.find((b) => String(b.id) === String(pid));
      if (!pb) continue;
      const d = Math.hypot(cueEnd.x - pb.x, cueEnd.y - pb.y);
      if (d > 8 && d < 28) s += 10;
    }
  }
  if (cueEnd && cueEnd.on && cueEnd.x > 6 && cueEnd.x < 94 && cueEnd.y > 6 && cueEnd.y < 44) s += 4;
  return s;
}

function pickShot(layout, legal, style, table, keys, problems) {
  const wantSide = style.sideFirst ? majoritySide(layout, legal.filter((id) => Number(id) !== 8)) : null;
  const ctxBase = {
    table,
    wantSide,
    keys: new Set(keys),
    problems: new Set(problems.map((p) => p.id)),
    left: legal.filter((id) => Number(id) !== 8).length
  };
  let best = null;
  for (const id of legal) {
    const hits = hitsFor(layout, id, table, style.maxCut);
    const pool = hits.length ? hits : anyHits(layout, id, table);
    for (const hit of pool) {
      let s = rateHit(hit, layout, style, { ...ctxBase, id });
      // Prefer an open makeable ball that leaves you on a problem (make, then break out).
      if (ctxBase.problems.size && !ctxBase.problems.has(Number(id)) && !ctxBase.problems.has(String(id))) {
        const cueEnd = hit.res.final.find((b) => b.id === 'cue');
        if (cueEnd && cueEnd.on) {
          for (const pid of ctxBase.problems) {
            const pb = layout.find((b) => String(b.id) === String(pid));
            if (!pb) continue;
            const d = Math.hypot(cueEnd.x - pb.x, cueEnd.y - pb.y);
            if (d < 22) s += 14;
          }
        }
      }
      if (!best || s > best.s) best = { id, hit, s };
    }
  }
  return best;
}

function pushShot(steps, balls, id, hit, r, breakout) {
  const cueEnd = hit.res.final.find((b) => b.id === 'cue');
  const tipWord = hit.tip.v > 0.2 ? 'follow' : hit.tip.v < -0.2 ? 'draw' : 'center';
  const sideSpin = hit.tip.h > 0.2 ? ' right' : hit.tip.h < -0.2 ? ' left' : '';
  const speedLabel = `SPEED ${hit.speed.toFixed(2)}`;
  const frac = cutWord(hit.fullness ?? 1);
  const cutLabel = frac === 'Full' ? 'Full ball' : `${hit.side === 'center' ? '' : hit.side === 'right' ? 'Right ' : 'Left '}${frac} ball`;
  const text = breakout
    ? `Breakout: hit the ${id}-ball · ${cutLabel} · ${tipWord}${sideSpin} · ${speedLabel}. Opens the cluster.`
    : `${id === 8 ? '8-ball' : `${id}-ball`} → ${hit.pocket} · ${cutLabel} · ${tipWord}${sideSpin} · ${speedLabel}`;
  steps.push({
    n: steps.length + 1,
    ball: id,
    pocket: breakout ? null : hit.pocket,
    aim: hit.aim,
    speed: hit.speed,
    vTips: hit.tip.v,
    hTips: hit.tip.h,
    cut: hit.cut ?? 0,
    fullness: hit.fullness ?? 1,
    hitSide: hit.side || 'center',
    ghost: hit.ghost ? { x: hit.ghost.x, y: hit.ghost.y } : null,
    cutLabel,
    balls: balls.map((b) => ({ ...b })),
    zone: cueEnd && cueEnd.on ? { x: cueEnd.x, y: cueEnd.y, r: 4.5 } : null,
    key: false,
    cluster: breakout || clustered(balls, id, r),
    breakout: !!breakout,
    text
  });
}

function planWithStyle(layout, { game, group, table }, style, forbidFirst = null) {
  const tbl = table?.lengthIn ? table : TC.spec(table || TC.DEFAULT_FT);
  let balls = layout.map((b) => ({ id: b.id === 'cue' || b.id === 0 ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  const steps = [];
  const r = TC.diagramRadius(tbl);
  if (!balls.some((b) => b.id === 'cue')) {
    return { complete: false, note: 'Place the cue ball first.', steps, game, group, style: style.id, problems: [], keyBall: null };
  }
  if (game === 8 && group !== 'solids' && group !== 'stripes') {
    const ids = balls.map((b) => Number(b.id));
    const hasS = ids.some(solid);
    const hasT = ids.some(stripe);
    if (hasS && hasT) return { complete: false, note: 'Choose solids or stripes.', steps, game, group: null, style: style.id, problems: [], keyBall: null };
    group = hasT ? 'stripes' : 'solids';
  }
  const startLegal = legalNow(balls, game, group).filter((id) => Number(id) !== 8);
  const problems = game === 8 ? problemsOf(balls, startLegal, tbl, r) : [];
  const keys = game === 8 ? findKeyIds(balls, startLegal, tbl) : [];
  const keyBall = keys[0] || null;
  let note = '';
  let breakouts = 0;
  for (let n = 0; n < 16; n++) {
    const legal = legalNow(balls, game, group);
    if (!legal.length) break;
    const banned = n === 0 && forbidFirst != null ? new Set([String(forbidFirst)]) : new Set();
    const allowed = legal.filter((id) => !banned.has(String(id)));
    const pickFrom = allowed.length ? allowed : legal;
    const liveProblems = game === 8 ? problemsOf(balls, pickFrom.filter((id) => Number(id) !== 8), tbl, r) : [];
    let chosen = pickShot(balls, pickFrom, style, tbl, keys, liveProblems);
    if (!chosen) chosen = pickShot(balls, pickFrom, STYLES.hard, tbl, keys, liveProblems);
    if (chosen) {
      const leftAfter = legal.filter((id) => String(id) !== String(chosen.id));
      pushShot(steps, balls, chosen.id, chosen.hit, r, false);
      if (game === 8 && leftAfter.length === 0 && Number(chosen.id) !== 8) {
        steps[steps.length - 1].key = true;
        steps[steps.length - 1].text += ' · key ball into the 8';
      }
      if (liveProblems.length && !liveProblems.some((p) => String(p.id) === String(chosen.id))) {
        steps[steps.length - 1].text += ' · opener into the cluster';
      }
      balls = chosen.hit.res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
      continue;
    }
    if (breakouts >= 5) {
      note = steps.length
        ? 'Pattern so far is playable. Next is a breakout on the remaining tied ball — stay on that side and open it, then finish.'
        : 'Start with a breakout on the tied ball, then the table opens.';
      break;
    }
    const problemIds = [
      ...liveProblems.map((p) => p.id),
      ...pickFrom.slice().sort((a, b) => nearestGap(balls, a, r) - nearestGap(balls, b, r))
    ].filter((id, i, arr) => arr.findIndex((x) => String(x) === String(id)) === i);
    let br = null;
    let brId = problemIds[0];
    for (const pid of problemIds) {
      const hit = tryBreakout(balls, pid, tbl);
      if (hit) { br = hit; brId = pid; break; }
    }
    if (!br) {
      note = steps.length
        ? 'Make the shots above first. That leaves you on the cluster — break it out, then the rest of the run is there.'
        : 'No direct pocket from here. Play a breakout on the tied ball first; after it opens there is a run.';
      break;
    }
    breakouts++;
    pushShot(steps, balls, brId, br, r, true);
    balls = br.res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  }
  const stuck = legalNow(balls, game, group).length > 0;
  if (!note && stuck && steps.length) {
    note = 'Make these first. Then break out the remaining tied ball and the rest of the run is there.';
  }
  const gameName = game === 8 ? '8-ball' : game === 10 ? '10-ball' : '9-ball';
  const bits = [];
  if (game === 8 && problems.length) {
    bits.push('Problems: ' + problems.map((p) => `${p.id} (${p.reason})`).join(', '));
  }
  if (game === 8 && keyBall) bits.push(`Key ball for the 8: ${keyBall}`);
  if (game === 8 && startLegal.length) {
    const side = majoritySide(layout.map((b) => ({ id: b.id === 'cue' || b.id === 0 ? 'cue' : Number(b.id), x: b.x, y: b.y })), startLegal);
    if (style.sideFirst && side !== 'center') bits.push(`Pattern: ${sideName(side)} first, then the other side, then the 8`);
  }
  const headline = note || (steps.length ? `${gameName} · ${style.label} · ${steps.length} shot${steps.length === 1 ? '' : 's'}` : 'No balls left to run.');
  const extra = bits.length ? ` — ${bits.join('. ')}.` : steps.length ? '.' : '';
  const hardness = steps.reduce((n, st) => n + (st.breakout ? 18 : 0) + (st.cut || 0) + (st.fullness < 0.4 ? 12 : 0), 0);
  return {
    complete: steps.length > 0 && !note,
    note: note ? note : headline + extra,
    steps,
    game,
    group,
    style: style.id,
    label: style.label,
    problems,
    keyBall,
    hardness
  };
}

function sameRoute(a, b) {
  if (!a || !b || a.steps.length !== b.steps.length) return false;
  return a.steps.every((s, i) => String(s.ball) === String(b.steps[i].ball) && String(s.pocket) === String(b.steps[i].pocket) && !!s.breakout === !!b.steps[i].breakout);
}

/**
 * Several complete patterns, easiest first. Always at least the easy attempt.
 */
export function planRunoutOptions(layout, opts = {}) {
  const plans = [];
  for (const style of [STYLES.easy, STYLES.medium, STYLES.hard]) {
    const plan = planWithStyle(layout, opts, style, null);
    if (!plans.some((p) => sameRoute(p, plan))) plans.push(plan);
  }
  if (plans[0]?.steps?.length) {
    const first = plans[0].steps[0].ball;
    const extra = planWithStyle(layout, opts, STYLES.medium, first);
    if (extra.steps.length && !plans.some((p) => sameRoute(p, extra))) plans.push(extra);
  }
  plans.sort((a, b) => {
    if (!!b.complete !== !!a.complete) return a.complete ? -1 : 1;
    return (a.hardness || 0) - (b.hardness || 0);
  });
  const labels = ['Easy', 'Medium', 'Hard'];
  plans.forEach((p, i) => {
    p.label = labels[i] || `Option ${i + 1}`;
    p.style = i === 0 ? 'easy' : i === 1 ? 'medium' : 'hard';
  });
  return plans;
}

export function planRunout(layout, opts = {}) {
  const style = STYLES[opts.style] || STYLES.easy;
  const plans = planRunoutOptions(layout, opts);
  return plans.find((p) => p.style === style.id) || plans[0] || planWithStyle(layout, opts, style, null);
}
