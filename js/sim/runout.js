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

function orderFor(balls, game, group) {
  const ids = balls.filter((b) => b.id !== 'cue').map((b) => Number(b.id));
  if (game === 9 || game === 10) {
    const max = game;
    return ids.filter((n) => n >= 1 && n <= max).sort((a, b) => a - b);
  }
  const mine = ids.filter((n) => (group === 'stripes' ? stripe(n) : solid(n)));
  mine.sort((a, b) => a - b);
  if (ids.includes(8)) mine.push(8);
  return mine;
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

function bestFor(layout, id, nextId, table) {
  let best = null;
  let bestS = -1e9;
  for (const pocket of POCKETS) {
    for (const speed of SPEED) {
      for (const tip of TIPS) {
        const hit = tryPocket(layout, id, pocket, table, speed, tip);
        if (!hit) continue;
        const s = score(hit, layout, nextId);
        if (s > bestS) { bestS = s; best = { ...hit, pocket }; }
      }
    }
  }
  return best;
}

function clustered(layout, id, r) {
  const b = layout.find((q) => String(q.id) === String(id));
  if (!b) return false;
  return layout.some((o) => o !== b && o.id !== 'cue' && Math.hypot(o.x - b.x, o.y - b.y) < r * 2 + 0.35);
}

/**
 * @returns {{ complete:boolean, note:string, steps:Array, game:number, group:string|null }}
 */
export function planRunout(layout, { game, group = null, table } = {}) {
  const tbl = table?.lengthIn ? table : TC.spec(table || TC.DEFAULT_FT);
  let balls = layout.map((b) => ({ id: b.id === 'cue' || b.id === 0 ? 'cue' : Number(b.id), x: b.x, y: b.y }));
  const seq = orderFor(balls, game, group);
  const steps = [];
  const r = TC.diagramRadius(tbl);
  if (!balls.some((b) => b.id === 'cue')) {
    return { complete: false, note: 'Place the cue ball first.', steps, game, group };
  }
  if (!seq.length) {
    return { complete: false, note: 'No balls of that game are on the table.', steps, game, group };
  }
  for (let i = 0; i < seq.length; i++) {
    const id = seq[i];
    if (!balls.some((b) => String(b.id) === String(id))) continue;
    const next = seq[i + 1];
    const hit = bestFor(balls, id, next, tbl);
    if (!hit) {
      const why = clustered(balls, id, r) ? `The ${id}-ball is in a cluster and no pocket is open.` : `No pocket the simulator can reach for the ${id}-ball.`;
      const note = steps.length
        ? `No full runout. ${steps.length} ball${steps.length === 1 ? '' : 's'} can be played, then it stops. ${why}`
        : `No legal runout from here. ${why}`;
      return { complete: false, note, steps, game, group };
    }
    const cueEnd = hit.res.final.find((b) => b.id === 'cue');
    const key = game === 8 && id !== 8 && seq.filter((n) => n !== 8 && balls.some((b) => b.id === n)).length === 1;
    const cluster = clustered(balls, id, r);
    const tipWord = hit.tip.v > 0.2 ? 'follow' : hit.tip.v < -0.2 ? 'draw' : 'center';
    const side = hit.tip.h > 0.2 ? ' right' : hit.tip.h < -0.2 ? ' left' : '';
    steps.push({
      n: steps.length + 1,
      ball: id,
      pocket: hit.pocket,
      aim: hit.aim,
      speed: hit.speed,
      vTips: hit.tip.v,
      hTips: hit.tip.h,
      balls: balls.map((b) => ({ ...b })),
      zone: cueEnd && cueEnd.on ? { x: cueEnd.x, y: cueEnd.y, r: 4.5 } : null,
      key,
      cluster,
      text: `${id === 8 ? '8-ball' : `${id}-ball`} → ${hit.pocket} · ${tipWord}${side} · SPEED ${hit.speed.toFixed(2)}${key ? ' · key ball' : ''}${cluster ? ' · breakout' : ''}`
    });
    balls = hit.res.final.filter((b) => b.on).map((b) => ({ id: b.id, x: b.x, y: b.y }));
  }
  const gameName = game === 8 ? '8-ball' : game === 10 ? '10-ball' : '9-ball';
  return { complete: true, note: `${gameName} runout — ${steps.length} shot${steps.length === 1 ? '' : 's'}.`, steps, game, group };
}
