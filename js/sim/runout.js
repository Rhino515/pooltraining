/**
 * Runout planner. Every pocket in the plan is one the simulator actually makes
 * at the listed tip and speed. If the layout has no full legal runout, the plan
 * stops and says so — it does not invent a pocket.
 *
 * 8-ball thinks in patterns: problem balls first, a ball that can break them out,
 * one side of the table then the other, and a key ball kept for shape on the 8.
 * Several complete patterns are ranked Easy, Medium, Hard.
 * 9-ball and 10-ball still play the lowest ball first.
 */
import * as P from './physics.js';
import * as TC from './tableCal.js';
import { pathClear, candidatePots } from './solver.js';
import { aimFromPoints, fullnessWord } from '../games/aimView.js';

const POCKETS = ['TL', 'TR', 'BL', 'BR', 'TM', 'BM'];
const LABELS = ['Easy', 'Medium', 'Hard'];

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

function pkOf(key) {
  return P.PHYS_POCKETS.find((p) => p.key === key);
}

function normLayout(layout) {
  return layout.map((b) => ({
    id: b.id === 'cue' || b.id === 0 || b.id === '0' ? 'cue' : Number(b.id),
    x: +b.x,
    y: +b.y
  }));
}

function alive(res) {
  return res.final.filter((b) => b.on).map((b) => ({ id: b.id === 'cue' ? 'cue' : Number(b.id), x: b.x, y: b.y }));
}

function cueOf(balls) {
  return balls.find((b) => b.id === 'cue');
}

function ballSide(b) {
  return b.x < 50 ? 'head' : 'foot';
}

/** Balls that may be hit now. 8-ball: any group ball, then the 8. */
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

function runIds(balls, game, group) {
  const ids = balls.filter((b) => b.id !== 'cue').map((b) => Number(b.id)).filter((n) => n >= 1 && n <= 15);
  if (game === 9 || game === 10) return ids.filter((n) => n <= game);
  const mine = ids.filter((n) => (group === 'stripes' ? stripe(n) : solid(n)));
  if (ids.includes(8)) mine.push(8);
  return mine;
}

function clustered(layout, id, r) {
  const b = layout.find((q) => String(q.id) === String(id));
  if (!b) return false;
  return layout.some((o) => o !== b && o.id !== 'cue' && Math.hypot(o.x - b.x, o.y - b.y) < r * 2 + 0.35);
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

/** Straight shot the cue can see: clear to the ghost and clear from the ball to the pocket. */
function geomOpen(layout, id, pocket, Rd) {
  const cue = cueOf(layout);
  const ob = layout.find((b) => String(b.id) === String(id));
  const pk = pkOf(pocket);
  if (!cue || !ob || !pk) return null;
  const g = P.ghostAim(cue, ob, pocket, Rd);
  if (!pathClear(layout, cue, g.ghost, ['cue', id], Rd * 2)) return null;
  if (!pathClear(layout, ob, { x: pk.x, y: pk.y }, [id, 'cue'], Rd * 2)) return null;
  const a = aimFromPoints(cue, g.ghost, ob, Rd);
  const len = Math.hypot(cue.x - g.ghost.x, cue.y - g.ghost.y) + Math.hypot(ob.x - pk.x, ob.y - pk.y);
  return { pocket, ghost: g.ghost, aim: g.aim, cut: a.theta, fullness: a.fullness, hitSide: a.side, len, ob };
}

function canSee(layout, id, Rd) {
  return POCKETS.some((pk) => geomOpen(layout, id, pk, Rd));
}

function problemIds(balls, ids, Rd) {
  return ids.filter((id) => id !== 8 && (clustered(balls, id, Rd) || !canSee(balls, id, Rd)) || (id === 8 && !canSee(balls, id, Rd)));
}

/**
 * A key ball is a group ball whose natural stop / follow / draw leaves a shot on the 8.
 * Chosen before the run, from the balls, not from "whatever is left".
 */
function findKeyBall(balls, group, Rd) {
  const eight = balls.find((b) => b.id === 8);
  if (!eight) return null;
  const mine = balls.filter((b) => (group === 'stripes' ? stripe(b.id) : solid(b.id)));
  let best = null;
  for (const ob of mine) {
    for (const pocket of POCKETS) {
      const pk = pkOf(pocket);
      if (!pathClear(balls, ob, { x: pk.x, y: pk.y }, [ob.id, 'cue'], Rd * 2)) continue;
      const dx = pk.x - ob.x;
      const dy = pk.y - ob.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L;
      const uy = dy / L;
      const ghost = { x: ob.x - ux * 2 * Rd, y: ob.y - uy * 2 * Rd };
      const spots = [ghost, { x: ghost.x + ux * 14, y: ghost.y + uy * 14 }, { x: ghost.x - ux * 12, y: ghost.y - uy * 12 }];
      for (const spot of spots) {
        if (spot.x < 3 || spot.x > 97 || spot.y < 3 || spot.y > 47) continue;
        if (balls.some((b) => b !== ob && b.id !== 'cue' && Math.hypot(b.x - spot.x, b.y - spot.y) < Rd * 2)) continue;
        const lay = balls.filter((b) => b !== ob && b.id !== 'cue').concat([{ id: 'cue', x: spot.x, y: spot.y }]);
        let shape = null;
        for (const pk8 of POCKETS) {
          const g = geomOpen(lay, 8, pk8, Rd);
          if (g && (!shape || g.fullness > shape.fullness)) shape = g;
        }
        if (!shape || shape.fullness < 0.18) continue;
        let score = shape.fullness * 10 - shape.len * 0.04;
        if (clustered(balls, ob.id, Rd)) score -= 1.5;
        if (!best || score > best.score) best = { id: ob.id, score };
      }
    }
  }
  return best ? best.id : null;
}

function layoutKey(layout) {
  return layout.map((b) => `${b.id}@${b.x.toFixed(2)},${b.y.toFixed(2)}`).sort().join(';');
}

/** Try to pocket `id` in `pocket`. Returns the simulation plus the aim that worked, or null. */
function tryPocket(layout, id, pocket, table, speed, tip, budget) {
  if (budget.n > budget.cap) return null;
  const cue = cueOf(layout);
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const g = P.ghostAim(cue, ob, pocket, Rd);
  const pk = pkOf(pocket);
  if (!pathClear(layout, cue, g.ghost, ['cue', id], Rd * 2) || !pathClear(layout, ob, { x: pk.x, y: pk.y }, [id, 'cue'], Rd * 2)) return null;
  const aim0 = g.aim - tip.h * P.SQUIRT_DEG_PER_TIP;
  const shotBase = { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h };
  for (const aim of [aim0, aim0 - 1.2, aim0 + 1.2]) {
    if (budget.n > budget.cap) return null;
    budget.n++;
    const res = P.simulate(layout, { ...shotBase, aim }, simOpt(table));
    if (pocketedOnly(res, id, pocket) && cueRailsBefore(res) === 0) {
      const ghost = res.firstHit?.cueAt && Number.isFinite(res.firstHit.cueAt.x) ? { x: res.firstHit.cueAt.x, y: res.firstHit.cueAt.y } : g.ghost;
      return { res, aim, speed, tip, ghost };
    }
  }
  return null;
}

function cachedTry(layout, id, pocket, table, speed, tip, cache, budget) {
  const key = `${layoutKey(layout)}|${id}|${pocket}|${speed}|${tip.v}|${tip.h}|${table.ft || ''}`;
  if (cache.has(key)) return cache.get(key);
  const hit = tryPocket(layout, id, pocket, table, speed, tip, budget);
  cache.set(key, hit);
  return hit;
}

function firstWorking(layout, id, pocket, table, profile, cache, budget) {
  for (const tip of profile.tips) {
    for (const speed of profile.speeds) {
      const hit = cachedTry(layout, id, pocket, table, speed, tip, cache, budget);
      if (hit) return hit;
    }
  }
  return null;
}

function pocketOrder(id, hinted) {
  const pref = [];
  for (const c of hinted) {
    if (String(c.ob) === String(id) && !pref.includes(c.pocket)) pref.push(c.pocket);
  }
  return pref.concat(POCKETS.filter((p) => !pref.includes(p)));
}

function shotsFor(layout, ids, table, profile, Rd, cache, budget, hinted) {
  const out = [];
  for (const id of ids) {
    const geoms = [];
    for (const pocket of pocketOrder(id, hinted)) {
      const g = geomOpen(layout, id, pocket, Rd);
      if (!g) continue;
      geoms.push(g);
    }
    geoms.sort((a, b) => (a.cut > 95 ? 1 : 0) - (b.cut > 95 ? 1 : 0) || b.fullness - a.fullness || a.len - b.len);
    const found = [];
    for (const g of geoms) {
      const hit = firstWorking(layout, id, g.pocket, table, profile, cache, budget);
      if (!hit) continue;
      const dec = decorate(layout, id, g, hit, Rd);
      if (dec.cut > profile.maxCut || dec.fullness + 1e-6 < profile.minFull) continue;
      found.push(dec);
    }
    out.push(...found);
  }
  return out;
}

function decorate(layout, id, geom, hit, Rd) {
  const cue = cueOf(layout);
  const ob = layout.find((b) => String(b.id) === String(id));
  const a = aimFromPoints(cue, hit.ghost, ob, Rd);
  return {
    id: Number(id),
    pocket: geom.pocket,
    hit,
    fullness: a.fullness,
    cut: a.theta,
    hitSide: a.side,
    len: geom.len,
    obX: ob.x,
    problem: false,
    lead: false
  };
}

function helpsProblems(before, shot, problems, Rd) {
  if (!problems.length) return false;
  const next = alive(shot.hit.res);
  const cue = cueOf(next);
  if (!cue) return false;
  return problems.some((pid) => {
    if (String(pid) === String(shot.id)) return false;
    const b = next.find((q) => String(q.id) === String(pid));
    if (!b) return false;
    const was = canSee(before, pid, Rd);
    const now = canSee(next, pid, Rd);
    if (!was && now) return true;
    if (clustered(before, pid, Rd) && Math.hypot(cue.x - b.x, cue.y - b.y) < 26) return true;
    return false;
  });
}

function followShape(before, shot, game, group, problems, Rd) {
  const next = alive(shot.hit.res);
  const legal = legalNow(next, game, group);
  if (!legal.length) return 14;
  let bonus = 0;
  const opened = legal.filter((id) => canSee(next, id, Rd) && !canSee(before, id, Rd));
  if (opened.length) bonus += 12;
  if (problems.some((id) => legal.some((n) => String(n) === String(id)) && canSee(next, id, Rd) && !canSee(before, id, Rd))) bonus += 8;
  if (legal.includes(8) && canSee(next, 8, Rd)) bonus += 7;
  else if (game === 8 && before.some((b) => b.id === 8) && !legal.includes(8)) bonus += 4;
  return bonus;
}

function rankShots(shots, balls, profile, keyBall, problems, game, group, Rd) {
  const cue = cueOf(balls);
  const cueSide = cue ? ballSide(cue) : 'head';
  const alternatives = shots.some((s) => !s.problem);
  const keyAlt = keyBall != null && shots.some((s) => s.id !== keyBall && !s.problem);
  return shots.map((sh) => {
    const shape = followShape(balls, sh, game, group, problems, Rd);
    let s = sh.fullness * 8 - Math.abs(sh.speed - 2.25) * 0.35 - sh.len * 0.02 + shape;
    const same = (sh.obX < 50 ? 'head' : 'foot') === cueSide;
    if (profile.mode === 'side') s += same ? 6 : 0;
    if (profile.mode === 'opposite') s += same ? 0 : 7;
    if (profile.mode === 'lead') s += sh.lead ? 10 : 0;
    else if (sh.lead) s += 4;
    if (sh.problem && alternatives) s -= 28;
    if (profile.saveKey && keyAlt && sh.id === keyBall) s -= 36;
    if (problems.length && sh.id === keyBall && !sh.lead && shape < 8) s -= 5;
    s -= Math.abs(sh.hit.tip.v) * 0.35 + Math.abs(sh.hit.tip.h) * 0.5;
    return { sh, s };
  }).sort((a, b) => b.s - a.s);
}

function cutLabelOf(side, fullness) {
  const frac = fullnessWord(fullness);
  if (frac === 'Full' || side === 'center') return frac;
  const word = side === 'right' ? 'Right' : 'Left';
  return frac === 'Thin' ? `${word} Thin` : `${word} ${frac} ball`;
}

function tipWord(tip) {
  const base = tip.v > 0.2 ? 'follow' : tip.v < -0.2 ? 'draw' : 'center';
  const side = tip.h > 0.2 ? ' right' : tip.h < -0.2 ? ' left' : '';
  return base + side;
}

function pushShot(steps, balls, shot, Rd, keyBall, breakout) {
  const id = Number(shot.id);
  const hit = shot.hit;
  const cue = cueOf(balls);
  const ob = balls.find((b) => String(b.id) === String(id));
  const cueEnd = hit.res.final.find((b) => b.id === 'cue');
  const a = cue && ob && hit.ghost ? aimFromPoints(cue, hit.ghost, ob, Rd) : null;
  const fullness = a ? a.fullness : (shot.fullness || 0);
  const cut = a ? a.theta : (shot.cut || 0);
  const hitSide = a ? a.side : (shot.hitSide || 'center');
  const cutLabel = cutLabelOf(hitSide, fullness);
  const speedLabel = `SPEED ${Number(hit.speed).toFixed(2)}`;
  const tip = tipWord(hit.tip);
  const isKey = !breakout && keyBall != null && id === Number(keyBall);
  const name = id === 8 ? '8-ball' : `${id}-ball`;
  const text = breakout
    ? `Breakout: ${name} · ${cutLabel} · ${tip} · ${speedLabel} · opens the cluster`
    : `${name} → ${shot.pocket} · ${cutLabel} · ${tip} · ${speedLabel}${isKey ? ' · key ball into the 8' : ''}`;
  steps.push({
    ball: id,
    pocket: breakout ? null : shot.pocket,
    aim: hit.aim,
    speed: hit.speed,
    vTips: hit.tip.v,
    hTips: hit.tip.h,
    cut,
    fullness,
    hitSide,
    ghost: hit.ghost ? { x: hit.ghost.x, y: hit.ghost.y } : null,
    cutLabel,
    balls: balls.map((b) => ({ ...b })),
    zone: cueEnd && cueEnd.on ? { x: cueEnd.x, y: cueEnd.y, r: 4.5 } : null,
    key: isKey,
    cluster: breakout || clustered(balls, id, Rd),
    breakout: !!breakout,
    text
  });
}

function tryBreakout(layout, id, table, cache, budget) {
  const cue = cueOf(layout);
  const ob = layout.find((b) => String(b.id) === String(id));
  if (!cue || !ob) return null;
  const Rd = TC.diagramRadius(table);
  const before = nearestGap(layout, id, Rd);
  const base = P.aimAt(cue, ob);
  let best = null;
  let bestGain = 0.9;
  for (const off of [0, -20, 20, -36, 36]) {
    for (const speed of [3.25, 4.5]) {
      for (const tip of [{ v: 0, h: 0 }, { v: 0.75, h: 0 }]) {
        const key = `${layoutKey(layout)}|br|${id}|${off}|${speed}|${tip.v}`;
        let packed = cache.get(key);
        if (packed === undefined) {
          if (budget.n > budget.cap) packed = null;
          else {
            budget.n++;
            const aim = base + off - tip.h * P.SQUIRT_DEG_PER_TIP;
            const res = P.simulate(layout, { V: P.speedToV0(speed, table), vTips: tip.v, hTips: tip.h, aim }, { ...simOpt(table), maxTime: 8 });
            packed = null;
            if (!(res.scratch || !res.firstHit || String(res.firstHit.ob) !== String(id))) {
              const fin = res.final.find((b) => String(b.id) === String(id));
              if (fin && fin.on) {
                const moved = Math.hypot(fin.x - ob.x, fin.y - ob.y);
                const after = alive(res);
                const gain = moved + Math.max(0, nearestGap(after, id, Rd) - before) * 3;
                const ghost = res.firstHit.cueAt && Number.isFinite(res.firstHit.cueAt.x) ? { x: res.firstHit.cueAt.x, y: res.firstHit.cueAt.y } : null;
                packed = { gain, moved, hit: { res, aim, speed, tip, ghost } };
              }
            }
          }
          cache.set(key, packed);
        }
        if (!packed || packed.moved < 2 || packed.gain <= bestGain) continue;
        bestGain = packed.gain;
        best = packed.hit;
      }
    }
  }
  return best;
}

/**
 * One greedy pattern. alt picks the second-best shot the first time there is a choice,
 * so a second pattern can exist without a full search.
 */
function runPattern(start, game, group, table, profile, Rd, cache, budget, keyBall, problems0, alt, hinted0, lockFirst) {
  let balls = start.map((b) => ({ ...b }));
  const steps = [];
  let breakouts = 0;
  let altUsed = !alt;
  let hinted = hinted0 || [];
  for (let n = 0; n < 16; n++) {
    const legal = legalNow(balls, game, group);
    if (!legal.length) break;
    const probs = problemIds(balls, legal.filter((id) => id !== 8), Rd);
    let shots = shotsFor(balls, legal, table, profile, Rd, cache, budget, hinted);
    hinted = [];
    for (const sh of shots) {
      sh.problem = probs.includes(sh.id) || clustered(balls, sh.id, Rd);
      sh.lead = helpsProblems(balls, sh, problems0.length ? problems0 : probs, Rd);
    }
    if (shots.length) {
      let ranked = rankShots(shots, balls, profile, keyBall, probs, game, group, Rd);
      let pick = ranked[0].sh;
      if (lockFirst && steps.length === 0) {
        const locked = shots.find((sh) => sh.id === lockFirst.id && sh.pocket === lockFirst.pocket);
        if (locked) pick = locked;
      } else if (!altUsed && ranked.length > 1 && (ranked[1].sh.id !== pick.id || ranked[1].sh.pocket !== pick.pocket)) {
        pick = ranked[1].sh;
        altUsed = true;
      }
      pushShot(steps, balls, pick, Rd, keyBall, false);
      balls = alive(pick.hit.res);
      continue;
    }
    if (breakouts >= 3 || budget.n > budget.cap) break;
    const problem = legal.slice().sort((a, b) => nearestGap(balls, a, Rd) - nearestGap(balls, b, Rd))[0];
    const br = tryBreakout(balls, problem, table, cache, budget);
    if (!br) break;
    breakouts++;
    pushShot(steps, balls, { id: problem, pocket: null, hit: br }, Rd, keyBall, true);
    balls = alive(br.res);
  }
  const stuck = legalNow(balls, game, group).length > 0;
  return { steps, complete: steps.length > 0 && !stuck && !breakoutsStuck(balls, game, group) };
}

function breakoutsStuck(balls, game, group) {
  return legalNow(balls, game, group).length > 0;
}

function signature(steps) {
  return steps.map((s) => `${s.ball}:${s.pocket || 'x'}:${s.breakout ? 1 : 0}`).join('|');
}

function difficulty(steps, complete, keyBall) {
  if (!steps.length) return 999;
  let shot = 0;
  for (const st of steps) {
    shot += (1 - (st.fullness || 0)) * 4;
    shot += Math.abs((st.speed || 2.25) - 2.25) * 0.25;
    if (st.breakout) shot += 1.4;
    if ((st.fullness || 0) < 0.18) shot += 2.2;
    else if ((st.fullness || 0) < 0.4) shot += 0.8;
    if (Math.abs(st.hTips) > 0.2) shot += 0.7;
  }
  const avg = shot / steps.length;
  const made = steps.filter((st) => !st.breakout).length;
  const keyIdx = steps.findIndex((st) => st.key);
  const burned = keyBall != null && keyIdx >= 0 && keyIdx < steps.length - 2 ? 1.5 : 0;
  if (!complete) return 70 - made * 7 + avg + burned;
  return avg + burned;
}

function nameList(ids) {
  const names = ids.map((id) => (id === 8 ? 'the 8' : `the ${id}`));
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function buildNote(label, steps, complete, problems, keyBall, game) {
  const gameName = game === 8 ? '8-ball' : game === 10 ? '10-ball' : '9-ball';
  const bits = [];
  if (problems.length) bits.push(`Problem balls: ${nameList(problems)} ${problems.length > 1 ? 'are' : 'is'} tied up or ${problems.length > 1 ? 'have' : 'has'} no open pocket`);
  if (keyBall != null) bits.push(`Key ball: the ${keyBall}, for shape on the 8`);
  if (!complete) {
    const head = bits.length ? `${bits.join('. ')}. ` : '';
    return steps.length
      ? `No full runout. ${head}The shots above are the ones the simulator can actually make.`
      : `No full runout. ${head || 'No pocket the simulator can reach from here.'}`;
  }
  const head = bits.length ? `${bits.join('. ')}. ` : '';
  return `${head}${label} ${gameName} runout — ${steps.length} shot${steps.length === 1 ? '' : 's'}.`;
}

function blankPlan(game, group, note, problems, keyBall) {
  return { label: 'Easy', steps: [], note, problems, keyBall, complete: false, game, group };
}

const PROFILES = [
  { minFull: 0.4, maxCut: 48, speeds: [2.25, 3, 3.5], tips: [{ v: 0, h: 0 }], mode: 'side', saveKey: true },
  { minFull: 0.18, maxCut: 64, speeds: [2.25, 3, 3.5, 4], tips: [{ v: 0, h: 0 }, { v: 0.75, h: 0 }, { v: -0.75, h: 0 }], mode: 'lead', saveKey: true },
  { minFull: 0.05, maxCut: 80, speeds: [2.25, 3, 4, 1.5], tips: [{ v: 0, h: 0 }, { v: 0.75, h: 0 }, { v: -0.75, h: 0 }, { v: 0, h: 0.5 }, { v: 0, h: -0.5 }], mode: 'opposite', saveKey: false }
];

/**
 * @returns {Array<{label:string, steps:Array, note:string, problems:Array, keyBall:number|null, complete:boolean, game:number, group:string|null}>}
 */
export function planRunoutOptions(layout, { game, group = null, table } = {}) {
  const tbl = table?.lengthIn ? table : TC.spec(table || TC.DEFAULT_FT);
  const balls = normLayout(layout || []);
  const Rd = TC.diagramRadius(tbl);
  if (!balls.some((b) => b.id === 'cue')) {
    return [blankPlan(game, group, 'Place the cue ball first.', [], null)];
  }
  if (game === 8 && group !== 'solids' && group !== 'stripes') {
    const ids = balls.map((b) => Number(b.id));
    const hasS = ids.some(solid);
    const hasT = ids.some(stripe);
    if (hasS && hasT) return [blankPlan(game, null, 'Choose solids or stripes.', [], null)];
    group = hasT && !hasS ? 'stripes' : 'solids';
  }
  const ids = runIds(balls, game, group).filter((id) => id !== 8);
  const problems = problemIds(balls, game === 8 ? ids.concat(balls.some((b) => b.id === 8) ? [8] : []) : runIds(balls, game, group), Rd);
  const keyBall = game === 8 ? findKeyBall(balls, group, Rd) : null;
  const cache = new Map();
  const budget = { n: 0, cap: 640 };
  let hinted = [];
  try { hinted = candidatePots(balls, 72); } catch { hinted = []; }
  const found = [];
  const seen = new Set();
  const keep = (pattern) => {
    if (!pattern.steps.length) return;
    const sig = signature(pattern.steps);
    if (seen.has(sig)) return;
    seen.add(sig);
    found.push(pattern);
  };
  PROFILES.forEach((profile, i) => {
    keep(runPattern(balls, game, group, tbl, profile, Rd, cache, budget, keyBall, problems, false, hinted));
    if (i === 1 && found.filter((p) => p.complete).length < 2) {
      keep(runPattern(balls, game, group, tbl, profile, Rd, cache, budget, keyBall, problems, true, hinted));
    }
  });
  if (found.filter((p) => p.complete).length < 3) {
    keep(runPattern(balls, game, group, tbl, PROFILES[0], Rd, cache, budget, keyBall, problems, true, hinted));
    keep(runPattern(balls, game, group, tbl, PROFILES[2], Rd, cache, budget, keyBall, problems, true, hinted));
  }
  if (found.filter((p) => p.complete).length < 3 && budget.n < budget.cap) {
    const legal = legalNow(balls, game, group);
    const wide = shotsFor(balls, legal, tbl, PROFILES[2], Rd, cache, budget, hinted);
    for (const sh of wide) sh.problem = problems.includes(sh.id) || clustered(balls, sh.id, Rd);
    const ranked = rankShots(wide, balls, PROFILES[2], keyBall, problems, game, group, Rd);
    const used = new Set(found.map((p) => p.steps[0] ? `${p.steps[0].ball}:${p.steps[0].pocket || 'x'}` : ''));
    for (const row of ranked) {
      if (found.filter((p) => p.complete).length >= 3 || budget.n > budget.cap) break;
      const key = `${row.sh.id}:${row.sh.pocket}`;
      if (used.has(key)) continue;
      used.add(key);
      keep(runPattern(balls, game, group, tbl, PROFILES[1], Rd, cache, budget, keyBall, problems, false, hinted, row.sh));
    }
  }
  let use = found.filter((p) => p.complete);
  if (!use.length) use = found;
  use.sort((a, b) => difficulty(a.steps, a.complete, keyBall) - difficulty(b.steps, b.complete, keyBall));
  use = use.slice(0, 3);
  if (!use.length) {
    return [blankPlan(game, group, buildNote('Easy', [], false, problems, keyBall, game), problems, keyBall)];
  }
  return use.map((p, i) => {
    const label = LABELS[i] || 'Hard';
    return {
      label,
      steps: p.steps,
      note: buildNote(label, p.steps, p.complete, problems, keyBall, game),
      problems,
      keyBall,
      complete: p.complete,
      game,
      group
    };
  });
}

/** Existing callers get the easiest plan. */
export function planRunout(layout, opt) {
  return planRunoutOptions(layout, opt)[0];
}
