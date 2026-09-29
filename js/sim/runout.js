/**
 * Runout planner. Every pocket in the plan is one the simulator actually makes
 * at the listed tip and speed. If the layout has no full legal runout, the plan
 * stops and says so — it does not invent a pocket.
 *
 * 8-ball: group balls in any order, 8 last. 9-ball and 10-ball: lowest ball first.
 */
import * as P from './physics.js';
import * as TC from './tableCal.js';
import { pathClear } from './solver.js';

const POCKETS = ['TL', 'TR', 'BL', 'BR', 'TM', 'BM'];
const SPEED = [1.5, 2.25, 3, 4];
const TIPS = [{ v: 0, h: 0 }, { v: 0.75, h: 0 }, { v: -0.75, h: 0 }];

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

/** Try to pocket `id` in `pocket`. Returns the simulation plus the aim that worked, or null. */
function tryPocket(layout, id, pocket, table, speed, tip) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const g = P.ghostAim(cue, ob, pocket, Rd);
  if (!pathClear(layout, cue, g.ghost, ['cue', id], Rd * 2) || !pathClear(layout, ob, { x: P.PHYS_POCKETS.find((p) => p.key === pocket).x, y: P.PHYS_POCKETS.find((p) => p.key === pocket).y }, [id, 'cue'], Rd * 2)) return null;
  const aim0 = g.aim - tip.h * P.SQUIRT_DEG_PER_TIP;
  const shotBase = { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h };
  for (const aim of [aim0, aim0 - 1.2, aim0 + 1.2]) {
    const res = P.simulate(layout, { ...shotBase, aim }, simOpt(table));
    if (pocketedOnly(res, id, pocket) && cueRailsBefore(res) === 0) return { res, aim, speed, tip };
  }
  return null;
}

function score(hit, layout, nextId) {
  const cue = hit.res.final.find((b) => b.id === 'cue');
  if (!cue || !cue.on) return -1;
  let s = 10 - Math.abs(hit.tip.v) - Math.abs(hit.tip.h);
  s -= Math.abs(hit.speed - 2) * 0.3;
  if (!nextId) return s;
  const nxt = layout.find((b) => String(b.id) === String(nextId));
  // nxt is still in the BEFORE layout; use its position (it didn't move if we only pocketed `id`)
  if (!nxt) return s;
  const d = Math.hypot(cue.x - nxt.x, cue.y - nxt.y);
  if (d > 8 && d < 45) s += 6;
  if (cue.x > 6 && cue.x < 94 && cue.y > 6 && cue.y < 44) s += 3;
  return s;
}

function clustered(layout, id, r) {
  const b = layout.find((q) => String(q.id) === String(id));
  if (!b) return false;
  return layout.some((o) => o !== b && o.id !== 'cue' && Math.hypot(o.x - b.x, o.y - b.y) < r * 2 + 0.35);
}

/** Balls that may be hit now. 8-ball: any group ball, then the 8. Never 1-then-2-then-3. */
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

function bestFor(layout, id, nextId, table) {
  for (const pocket of POCKETS) {
    for (const speed of [2.25, 3.5]) {
      const hit = tryPocket(layout, id, pocket, table, speed, { v: 0, h: 0 });
      if (hit) return { ...hit, pocket };
    }
  }
  for (const pocket of POCKETS) {
    for (const speed of [2.25, 4]) {
      for (const tip of TIPS) {
        const hit = tryPocket(layout, id, pocket, table, speed, tip);
        if (hit) return { ...hit, pocket };
      }
    }
  }
  return null;
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

/** Move a tied-up ball. The step is a breakout, not a claimed pocket. */
function tryBreakout(layout, id, table) {
  const cue = layout.find((b) => b.id === 'cue');
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const before = nearestGap(layout, id, Rd);
  const base = P.aimAt(cue, ob);
  let best = null;
  let bestGain = 0.9;
  for (const off of [0, -18, 18, -34, 34]) {
    for (const speed of [3.25, 4.5]) {
      for (const tip of [{ v: 0, h: 0 }, { v: 0.75, h: 0 }]) {
        const aim = base + off - tip.h * P.SQUIRT_DEG_PER_TIP;
        const res = P.simulate(layout, { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h, aim }, { ...simOpt(table), maxTime: 8 });
        if (res.scratch || !res.firstHit || String(res.firstHit.ob) !== String(id)) continue;
        const fin = res.final.find((b) => String(b.id) === String(id));
        if (!fin || !fin.on) continue;
        const moved = Math.hypot(fin.x - ob.x, fin.y - ob.y);
        const after = res.final.filter((b) => b.on).map((b) => ({ id: b.id, x: b.x, y: b.y }));
        const gain = moved + Math.max(0, nearestGap(after, id, Rd) - before) * 3;
        if (moved < 2 || gain <= bestGain) continue;
        bestGain = gain;
        best = { res, aim, speed, tip };
      }
    }
  }
  return best;
}

function pushShot(steps, balls, id, hit, game, r, breakout) {
  const cueEnd = hit.res.final.find((b) => b.id === 'cue');
  const tipWord = hit.tip.v > 0.2 ? 'follow' : hit.tip.v < -0.2 ? 'draw' : 'center';
  const side = hit.tip.h > 0.2 ? ' right' : hit.tip.h < -0.2 ? ' left' : '';
  const speedLabel = `SPEED ${hit.speed.toFixed(2)}`;
  const text = breakout
    ? `Breakout: hit the ${id}-ball · ${tipWord}${side} · ${speedLabel}. Moves it out of the cluster.`
    : `${id === 8 ? '8-ball' : `${id}-ball`} → ${hit.pocket} · ${tipWord}${side} · ${speedLabel}`;
  steps.push({
    n: steps.length + 1,
    ball: id,
    pocket: breakout ? null : hit.pocket,
    aim: hit.aim,
    speed: hit.speed,
    vTips: hit.tip.v,
    hTips: hit.tip.h,
    balls: balls.map((b) => ({ ...b })),
    zone: cueEnd && cueEnd.on ? { x: cueEnd.x, y: cueEnd.y, r: 4.5 } : null,
    key: false,
    cluster: breakout || clustered(balls, id, r),
    breakout: !!breakout,
    text
  });
}

/**
 * @returns {{ complete:boolean, note:string, steps:Array, game:number, group:string|null }}
 */
export function planRunout(layout, { game, group = null, table } = {}) {
  const tbl = table?.lengthIn ? table : TC.spec(table || TC.DEFAULT_FT);
  let balls = layout.map((b) => ({ id: b.id === 'cue' || b.id === 0 ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  const steps = [];
  const r = TC.diagramRadius(tbl);
  if (!balls.some((b) => b.id === 'cue')) {
    return { complete: false, note: 'Place the cue ball first.', steps, game, group };
  }
  if (game === 8 && group !== 'solids' && group !== 'stripes') {
    const ids = balls.map((b) => Number(b.id));
    const hasS = ids.some(solid);
    const hasT = ids.some(stripe);
    if (hasS && hasT) return { complete: false, note: 'Choose solids or stripes.', steps, game, group: null };
    group = hasT ? 'stripes' : 'solids';
  }
  let note = '';
  let breakouts = 0;
  for (let n = 0; n < 16; n++) {
    const legal = legalNow(balls, game, group);
    if (!legal.length) break;
    let chosen = null;
    for (const id of legal) {
      const hit = bestFor(balls, id, null, tbl);
      if (!hit) continue;
      const open = clustered(balls, id, r) ? 0 : 1;
      if (!chosen || open > chosen.open) chosen = { id, hit, open };
    }
    if (chosen) {
      const leftAfter = legal.filter((id) => String(id) !== String(chosen.id));
      pushShot(steps, balls, chosen.id, chosen.hit, game, r, false);
      if (game === 8 && leftAfter.length === 0 && Number(chosen.id) !== 8) steps[steps.length - 1].key = true;
      if (steps[steps.length - 1].key) steps[steps.length - 1].text += ' · key ball';
      balls = chosen.hit.res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
      continue;
    }
    if (breakouts >= 3) {
      note = game === 8
        ? 'No full runout. A ball in your group is tied up and a breakout does not free it.'
        : `No full runout. The ${legal[0]}-ball stays tied up.`;
      break;
    }
    const problem = legal.slice().sort((a, b) => nearestGap(balls, a, r) - nearestGap(balls, b, r))[0];
    const br = tryBreakout(balls, problem, tbl);
    if (!br) {
      note = steps.length
        ? (game === 8
          ? 'No full runout. Nothing else in your group can be pocketed, and a breakout does not free a ball.'
          : `No full runout. No pocket the simulator can reach for the ${legal[0]}-ball.`)
        : (game === 8
          ? 'No runout. Nothing in your group can be pocketed, and a breakout does not free a ball.'
          : `No legal runout from here. No pocket the simulator can reach for the ${legal[0]}-ball.`);
      break;
    }
    breakouts++;
    pushShot(steps, balls, problem, br, game, r, true);
    balls = br.res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  }
  const stuck = legalNow(balls, game, group).length > 0;
  if (!note && stuck && steps.length) {
    note = game === 8
      ? 'No full runout. The shots above are the ones the table can actually make.'
      : 'No full runout. The shots above are the ones the table can actually make.';
  }
  const gameName = game === 8 ? '8-ball' : game === 10 ? '10-ball' : '9-ball';
  return {
    complete: steps.length > 0 && !note,
    note: note || (steps.length ? `${gameName} runout — ${steps.length} shot${steps.length === 1 ? '' : 's'}.` : 'No balls left to run.'),
    steps,
    game,
    group
  };
}
