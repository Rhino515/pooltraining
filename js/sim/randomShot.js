/**
 * Random shot generator. A layout is returned only after the existing physics
 * pockets the object ball with the rail counts the type asks for.
 * "All the ways" are other tip positions and speeds on that same layout which
 * the same check accepts. A failed search says so — it never shows a miss.
 */
import * as P from './physics.js';
import * as TC from './tableCal.js';
import { rng } from './layouts.js';

export const SHOT_TYPES = [
  { id: 'straight', label: 'Straight shot', obRails: 0, cueRails: 0 },
  { id: 'bank1', label: 'Bank (1-rail)', obRails: 1, cueRails: 0 },
  { id: 'bank2', label: '2-rail bank', obRails: 2, cueRails: 0 },
  { id: 'kick1', label: 'Kick 1-rail', obRails: 0, cueRails: 1 },
  { id: 'kick2', label: 'Kick 2-rail', obRails: 0, cueRails: 2 },
  { id: 'kick3', label: 'Kick 3-rail', obRails: 0, cueRails: 3 },
  { id: 'kick4', label: 'Kick 4-rail', obRails: 0, cueRails: 4 }
];
export const POCKET_CHOICES = ['ANY', 'TL', 'TM', 'TR', 'BL', 'BM', 'BR'];

const PK = {
  TL: { x: -0.45, y: -0.45 }, TM: { x: 50, y: -1.45 }, TR: { x: 100.45, y: -0.45 },
  BL: { x: -0.45, y: 50.45 }, BM: { x: 50, y: 51.45 }, BR: { x: 100.45, y: 50.45 }
};
const RAILS = ['top', 'bottom', 'left', 'right'];

function reflect(p, rail) {
  if (rail === 'top') return { x: p.x, y: -p.y };
  if (rail === 'bottom') return { x: p.x, y: 100 - p.y };
  if (rail === 'left') return { x: -p.x, y: p.y };
  return { x: 200 - p.x, y: p.y };
}
function reflectN(p, rails) {
  let q = { ...p };
  for (let i = rails.length - 1; i >= 0; i--) q = reflect(q, rails[i]);
  return q;
}
const clamp = (p, r) => ({ x: Math.min(100 - r - 0.4, Math.max(r + 0.4, p.x)), y: Math.min(50 - r - 0.4, Math.max(r + 0.4, p.y)) });
const hyp = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function sim(layout, shot, table) {
  const opt = { record: false, maxTime: 16 };
  if (!TC.isNine(table)) opt.table = table;
  return P.simulate(layout, shot, opt);
}
function cueRailsBefore(res) {
  const t = res.firstHit ? res.firstHit.t : 1e9;
  return res.events.filter((e) => e.type === 'cushion' && e.ball === 'cue' && e.t < t - 1e-4).length;
}
function obRailsBeforePocket(res, id) {
  const pot = res.events.find((e) => e.type === 'pocket' && String(e.ball) === String(id));
  if (!pot) return -1;
  return res.events.filter((e) => e.type === 'cushion' && String(e.ball) === String(id) && e.t < pot.t - 1e-4).length;
}
export function shotMeets(res, { obId = 1, pocket, obRails, cueRails }) {
  if (!res || res.scratch || !res.firstHit || String(res.firstHit.ob) !== String(obId)) return false;
  const pot = res.pocketed.find((p) => String(p.id) === String(obId));
  if (!pot || pot.pocket !== pocket) return false;
  if (res.pocketed.some((p) => p.id !== 'cue' && String(p.id) !== String(obId))) return false;
  return obRailsBeforePocket(res, obId) === obRails && cueRailsBefore(res) === cueRails;
}

function lineHitRail(a, b, rail) {
  // does segment a→b cross this rail inside the playing surface?
  let t = null;
  if (rail === 'top' || rail === 'bottom') {
    const y = rail === 'top' ? 0 : 50;
    const dy = b.y - a.y;
    if (Math.abs(dy) < 1e-9) return null;
    t = (y - a.y) / dy;
    if (t <= 0.02 || t >= 0.98) return null;
    const x = a.x + t * (b.x - a.x);
    if (x < 4 || x > 96 || Math.abs(x - 50) < 3.2) return null;
    return { x, y };
  }
  const x = rail === 'left' ? 0 : 100;
  const dx = b.x - a.x;
  if (Math.abs(dx) < 1e-9) return null;
  t = (x - a.x) / dx;
  if (t <= 0.02 || t >= 0.98) return null;
  const y = a.y + t * (b.y - a.y);
  if (y < 4 || y > 46) return null;
  return { x, y };
}

function placeCue(ghost, rand, Rd, ob) {
  const ang = Math.atan2(ghost.y - (rand() * 50), ghost.x - (rand() * 100));
  // stand back from the ghost along a random approach that isn't through the object ball
  for (let i = 0; i < 8; i++) {
    const a = Math.atan2(ghost.y - 25, ghost.x - 50) + (rand() - 0.5) * 1.4;
    const dist = 12 + rand() * 28;
    const cue = clamp({ x: ghost.x - Math.cos(a) * dist, y: ghost.y - Math.sin(a) * dist }, Rd);
    if (hyp(cue, ob) > Rd * 4 && hyp(cue, ghost) > 6) return cue;
  }
  return clamp({ x: ghost.x - 14, y: ghost.y + 8 }, Rd);
}

function tryLayout(type, pocket, rand, table) {
  const Rd = TC.diagramRadius(table);
  const pk = PK[pocket];
  let ob;
  let ghost;
  let rails = [];
  if (type.obRails === 0 && type.cueRails === 0) {
    const into = Math.atan2(25 - pk.y, 50 - pk.x);
    const a = into + (rand() - 0.5) * 1.1;
    const dist = 16 + rand() * 32;
    ob = clamp({ x: pk.x + Math.cos(a) * dist, y: pk.y + Math.sin(a) * dist }, Rd);
    const g = P.ghostAim({ x: ob.x - 10, y: ob.y }, ob, pocket, Rd);
    ghost = g.ghost;
  } else if (type.cueRails === 0) {
    // bank: object ball rails
    const seqs = type.obRails === 1
      ? RAILS.map((r) => [r])
      : [['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right'], ['left', 'top'], ['right', 'top'], ['left', 'bottom'], ['right', 'bottom']];
    rails = seqs[Math.floor(rand() * seqs.length)];
    const target = reflectN(pk, rails);
    for (let k = 0; k < 6; k++) {
      ob = clamp({ x: 10 + rand() * 80, y: 8 + rand() * 34 }, Rd);
      if (lineHitRail(ob, target, rails[0]) && hyp(ob, pk) > 14) break;
      ob = null;
    }
    if (!ob) return null;
    const dx = target.x - ob.x;
    const dy = target.y - ob.y;
    const L = Math.hypot(dx, dy) || 1;
    ghost = { x: ob.x - (dx / L) * 2 * Rd, y: ob.y - (dy / L) * 2 * Rd };
  } else {
    // kick: cue rails, object ball straight in
    const into = Math.atan2(25 - pk.y, 50 - pk.x);
    const a = into + (rand() - 0.5) * 0.8;
    ob = clamp({ x: pk.x + Math.cos(a) * (14 + rand() * 22), y: pk.y + Math.sin(a) * (14 + rand() * 22) }, Rd);
    const g = P.ghostAim({ x: 50, y: 25 }, ob, pocket, Rd);
    ghost = g.ghost;
    const seqs = [];
    if (type.cueRails === 1) seqs.push(...RAILS.map((r) => [r]));
    else if (type.cueRails === 2) seqs.push(['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right'], ['left', 'top'], ['right', 'bottom']);
    else if (type.cueRails === 3) seqs.push(['left', 'top', 'right'], ['right', 'top', 'left'], ['left', 'bottom', 'right'], ['top', 'left', 'bottom']);
    else seqs.push(['left', 'top', 'right', 'bottom'], ['right', 'bottom', 'left', 'top'], ['top', 'right', 'bottom', 'left']);
    rails = seqs[Math.floor(rand() * seqs.length)];
    const unfolded = reflectN(ghost, rails);
    if (!lineHitRail({ x: 20 + rand() * 60, y: 10 + rand() * 30 }, unfolded, rails[0]) && type.cueRails > 2) {
      /* still try a cue on the table aimed at the unfolded ghost */
    }
    const cue = clamp({ x: 8 + rand() * 84, y: 8 + rand() * 34 }, Rd);
    if (hyp(cue, ob) < Rd * 4) return null;
    const dx = unfolded.x - cue.x;
    const dy = unfolded.y - cue.y;
    let aim = (Math.atan2(-dy, dx) * 180) / Math.PI;
    if (aim < 0) aim += 360;
    return { balls: [{ id: 'cue', x: round(cue.x), y: round(cue.y) }, { id: 1, x: round(ob.x), y: round(ob.y) }], aim, pocket };
  }
  const cue = placeCue(ghost, rand, Rd, ob);
  if (hyp(cue, ob) < Rd * 3.2) return null;
  const dx = ghost.x - cue.x;
  const dy = ghost.y - cue.y;
  let aim = (Math.atan2(-dy, dx) * 180) / Math.PI;
  if (aim < 0) aim += 360;
  return { balls: [{ id: 'cue', x: round(cue.x), y: round(cue.y) }, { id: 1, x: round(ob.x), y: round(ob.y) }], aim, pocket };
}
const round = (v) => Math.round(v * 100) / 100;

const WAY_SPEEDS = [1, 1.5, 2, 2.5, 3, 4, 5];
const WAY_V = [-1, -0.5, 0, 0.5, 1];
const WAY_H = [-1, 0, 1];

export function waysFor(layout, { pocket, obRails, cueRails, aim, table, obId = 1 }) {
  const out = [];
  for (const vTips of WAY_V) {
    for (const hTips of WAY_H) {
      for (const speed of WAY_SPEEDS) {
        const aim2 = aim - hTips * P.SQUIRT_DEG_PER_TIP;
        const res = sim(layout, { aim: aim2, V: P.speedToV0(speed, table), vTips, hTips }, table);
        if (!shotMeets(res, { obId, pocket, obRails, cueRails })) continue;
        out.push({ aim: aim2, speed, vTips, hTips });
      }
    }
  }
  return out;
}

function tipWord(v, h) {
  const vert = v > 0.2 ? 'follow' : v < -0.2 ? 'draw' : 'center';
  const side = h > 0.2 ? ' right' : h < -0.2 ? ' left' : '';
  return vert === 'center' && side ? `center${side}` : `${vert}${side}`;
}
export function wayLabel(w) {
  return `${tipWord(w.vTips, w.hTips)} · SPEED ${Number(w.speed).toFixed(2)}`;
}

/**
 * @returns {{ ok:true, type, pocket, balls, shot, ways } | { ok:false, tried:number }}
 */
export function generateShot({ type, pocket = 'ANY', seed = 1, table, tries = 36 } = {}) {
  const tbl = table?.lengthIn ? table : TC.spec(table || TC.DEFAULT_FT);
  const spec = SHOT_TYPES.find((t) => t.id === type) || SHOT_TYPES[0];
  const rand = rng(seed >>> 0);
  const pockets = pocket === 'ANY' ? ['TL', 'TR', 'BL', 'BR', 'TM', 'BM'] : [pocket];
  const speeds = [1.5, 2, 2.5, 3.5, 5];
  let tried = 0;
  for (let n = 0; n < tries; n++) {
    const pk = pockets[Math.floor(rand() * pockets.length)];
    const lay = tryLayout(spec, pk, rand, tbl);
    if (!lay) continue;
    for (const speed of speeds) {
      tried++;
      const aim = lay.aim;
      const res = sim(lay.balls, { aim, V: P.speedToV0(speed, tbl), vTips: 0, hTips: 0 }, tbl);
      if (!shotMeets(res, { pocket: pk, obRails: spec.obRails, cueRails: spec.cueRails })) continue;
      const ways = waysFor(lay.balls, { pocket: pk, obRails: spec.obRails, cueRails: spec.cueRails, aim, table: tbl });
      if (!ways.length) ways.push({ aim, speed, vTips: 0, hTips: 0 });
      return {
        ok: true,
        type: spec.id,
        pocket: pk,
        balls: lay.balls,
        shot: ways[0],
        ways
      };
    }
  }
  return { ok: false, tried };
}
