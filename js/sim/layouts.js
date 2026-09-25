/**
 * Shot Simulator layouts: racks, random "run-out practice" spreads, snapping and validation (pure).
 * Coordinates: 100 × 50 table inches, cushion nose to cushion nose. Foot spot = (75, 25), head string x = 25.
 */
import { R } from './physics.js';

export const FOOT_SPOT = { x: 75, y: 25 };
export const HEAD_SPOT = { x: 25, y: 25 };
export const QUARTER = 3.125; // ¼ diamond (1 diamond = 12.5")
export const EIGHTH = 1.5625;

/** Small deterministic PRNG (mulberry32) */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Clamp a ball centre onto the playing surface (touching the cushion at most) */
export function clampToTable(p) {
  return { x: Math.min(100 - R, Math.max(R, p.x)), y: Math.min(50 - R, Math.max(R, p.y)) };
}
/** Snap to the ¼-diamond grid (or ⅛ when step given); a snap past the cushion line lands frozen on the rail */
export function snapPoint(p, step = QUARTER) {
  return clampToTable({ x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step });
}

// Rack positions: rows run toward the foot rail from the apex on the foot spot.
const GAP = 2 * R + 0.004;
function rackSpots(rows) {
  const dx = GAP * Math.sqrt(3) / 2;
  const out = [];
  rows.forEach((count, r) => {
    for (let k = 0; k < count; k++) out.push({ row: r, x: FOOT_SPOT.x + r * dx, y: FOOT_SPOT.y + (k - (count - 1) / 2) * GAP });
  });
  return out;
}

export const GAME_NAMES = { 8: '8-ball', 9: '9-ball', 10: '10-ball' };

/**
 * Racked layout (legal rack rules), cue ball on the head spot.
 *  8-ball: 15-ball triangle, 8 in the centre of the third row, one solid + one stripe in the back corners.
 *  9-ball: diamond, 1 on the apex, 9 in the centre.
 *  10-ball: 10-ball triangle, 1 on the apex, 10 in the centre of the third row.
 */
export function rackLayout(game, seed = Date.now()) {
  const rand = rng(seed);
  const balls = [];
  if (game === 8) {
    const s = rackSpots([1, 2, 3, 4, 5]);
    const center = 4; // row 3 middle
    const backL = 10;
    const backR = 14;
    const solids = shuffle([1, 2, 3, 4, 5, 6, 7], rand);
    const stripes = shuffle([9, 10, 11, 12, 13, 14, 15], rand);
    const solidLeft = rand() < 0.5;
    const assign = new Map();
    assign.set(center, 8);
    assign.set(backL, solidLeft ? solids.pop() : stripes.pop());
    assign.set(backR, solidLeft ? stripes.pop() : solids.pop());
    const rest = shuffle([...solids, ...stripes], rand);
    s.forEach((p, i) => { if (!assign.has(i)) assign.set(i, rest.pop()); });
    s.forEach((p, i) => balls.push({ id: assign.get(i), x: p.x, y: p.y }));
  } else if (game === 9) {
    const s = rackSpots([1, 2, 3, 2, 1]);
    const others = shuffle([2, 3, 4, 5, 6, 7, 8], rand);
    s.forEach((p, i) => balls.push({ id: i === 0 ? 1 : i === 4 ? 9 : others.pop(), x: p.x, y: p.y }));
  } else {
    const s = rackSpots([1, 2, 3, 4]);
    const others = shuffle([2, 3, 4, 5, 6, 7, 8, 9], rand);
    s.forEach((p, i) => balls.push({ id: i === 0 ? 1 : i === 4 ? 10 : others.pop(), x: p.x, y: p.y }));
  }
  balls.push({ id: 'cue', x: HEAD_SPOT.x, y: HEAD_SPOT.y });
  return balls.map((b) => ({ id: b.id, x: round3(b.x), y: round3(b.y) }));
}
const round3 = (v) => Math.round(v * 1000) / 1000;

/**
 * Random open layout ("run-out practice"): every ball of the game spread legally over the table,
 * not overlapping (≥ 2R + ¼" apart), off the cushions a little, not sitting in a pocket mouth.
 * Cue ball: in hand (placed in the kitchen for 8-ball, anywhere open for 9/10-ball rotation-style practice).
 */
export function randomLayout(game, seed = Date.now(), opt = {}) {
  const rand = rng(seed);
  const ids = opt.ids ? opt.ids.slice() : game === 8 ? Array.from({ length: 15 }, (_, i) => i + 1) : Array.from({ length: game }, (_, i) => i + 1);
  const count = opt.count ? Math.min(opt.count, ids.length) : ids.length;
  let chosen = ids;
  if (count < ids.length && !opt.ids) {
    // keep the game ball, drop random others
    const keep = game === 8 ? 8 : game;
    chosen = [keep, ...shuffle(ids.filter((n) => n !== keep), rand).slice(0, count - 1)].sort((a, b) => a - b);
  }
  const out = [];
  const minGap = 2 * R + 0.25;
  const place = (id, box) => {
    for (let tries = 0; tries < 4000; tries++) {
      const p = { x: round3(box.x0 + rand() * (box.x1 - box.x0)), y: round3(box.y0 + rand() * (box.y1 - box.y0)) };
      if (out.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < minGap)) continue;
      if (nearPocket(p)) continue;
      out.push({ id, ...p });
      return true;
    }
    return false;
  };
  const table = { x0: R + 0.4, x1: 100 - R - 0.4, y0: R + 0.4, y1: 50 - R - 0.4 };
  for (const id of chosen) place(id, table);
  const kitchen = { x0: R + 3, x1: 25 - R, y0: R + 3, y1: 50 - R - 3 };
  if (!place('cue', game === 8 && !opt.cueAnywhere ? kitchen : { x0: R + 3, x1: 100 - R - 3, y0: R + 3, y1: 50 - R - 3 })) place('cue', table);
  return out;
}
/**
 * 8-Ball Ghost practice layout: your group (solids 1…group) plus the 8, scattered, cue ball in hand anywhere.
 * group 7 with pro = a full 15-ball rack to break.
 */
export function eightGhostLayout(group, seed = Date.now(), pro = false) {
  if (pro) return rackLayout(8, seed);
  const g = Math.max(1, Math.min(7, Math.round(Number(group) || 3)));
  const ids = [...Array.from({ length: g }, (_, i) => i + 1), 8];
  return randomLayout(8, seed, { ids, cueAnywhere: true });
}
function nearPocket(p) {
  const corners = [[0, 0], [100, 0], [0, 50], [100, 50]];
  if (corners.some(([x, y]) => Math.hypot(p.x - x, p.y - y) < 5.5)) return true;
  if (Math.abs(p.x - 50) < 4.5 && (p.y < 3.4 || p.y > 46.6)) return true;
  return false;
}

/** Friendly validation of any layout */
export function validateLayout(balls, opt = {}) {
  const errors = [];
  const tol = opt.tolerance ?? 0.002;
  for (const b of balls) {
    if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) { errors.push(`Ball ${label(b.id)} has no position.`); continue; }
    if (b.x < R - tol || b.x > 100 - R + tol || b.y < R - tol || b.y > 50 - R + tol) errors.push(`${cap(label(b.id))} is off the table — drag it back onto the cloth.`);
  }
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 2 * R - tol) errors.push(`${cap(label(a.id))} and ${label(b.id)} overlap — move one of them.`);
    }
  }
  const ids = balls.map((b) => String(b.id));
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) errors.push(`Duplicate ball: ${label(dup[0])}.`);
  if (opt.requireCue && !balls.some((b) => b.id === 'cue')) errors.push('Place the cue ball on the table.');
  return errors;
}
export function label(id) {
  if (id === 'cue') return 'the cue ball';
  if (String(id).startsWith('x')) return 'a blocker ball';
  return `the ${id}-ball`;
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Mirror layouts (Flip for another perspective) */
export function flipLayout(balls, axis) {
  return balls.map((b) => ({ ...b, x: axis === 'h' ? round3(100 - b.x) : b.x, y: axis === 'v' ? round3(50 - b.y) : b.y }));
}
export function flipAim(aimDeg, axis) {
  let a = axis === 'h' ? 180 - aimDeg : -aimDeg;
  a %= 360;
  if (a < 0) a += 360;
  return a;
}

/** Nearest free spot to p (spiral search) — used when adding a ball from the tray */
export function freeSpot(balls, p) {
  const ok = (q) => q.x >= R && q.x <= 100 - R && q.y >= R && q.y <= 50 - R && !balls.some((b) => Math.hypot(b.x - q.x, b.y - q.y) < 2 * R + 0.05);
  const start = clampToTable(p);
  if (ok(start)) return start;
  for (let r = 1; r < 60; r += 0.75) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const q = { x: round3(start.x + Math.cos(a) * r), y: round3(start.y + Math.sin(a) * r) };
      if (ok(q)) return q;
    }
  }
  return start;
}
