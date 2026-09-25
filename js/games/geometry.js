/**
 * Pool IQ game geometry — pure functions, no DOM.
 * Table coordinates match tableDiagram.js: x 0–100 (left/head → right/foot), y 0–50 (top → bottom).
 * 0–100 × 0–50 is the playing surface cushion nose to cushion nose; 1 unit = 1 inch on a 9-ft table (100" × 50").
 * Balls are true scale: 2¼" diameter → R = 1.125. Ball centres rebound on lines R inside the cushion noses.
 *
 * Physics used (general billiards knowledge, simplified):
 *  - Ghost ball: cue-ball centre at contact sits 2R behind the object ball on the OB→pocket line.
 *  - Stun (no spin at contact): cue ball leaves along the tangent line (90° to the OB path).
 *  - Follow/draw: while sliding, the cue ball's velocity changes linearly from the tangent-line
 *    velocity v0 = sinφ·t to the final rolling velocity vf = 5/7·v0 + 2/7·k·d
 *    (k = spin at contact in "natural roll" units: +1 rolling, −1 equal draw, 0 stun).
 *    This gives the familiar curved paths and the ~30° natural-angle deflection for rolling half-ball hits.
 *  - Rails: angle in = angle out (mirror method). Optional running/reverse english widens/narrows the first rebound.
 */
import { POCKETS, BALL_RADIUS } from '../tableDiagram.js';

export const R = BALL_RADIUS; // 1.125 — real ball radius in table inches
/** Lines the ball CENTRE bounces off (ball touching the cushion nose) */
export const CUSHION = { minX: R, maxX: 100 - R, minY: R, maxY: 50 - R };
/** Where a ball centre can legally sit (frozen to a cushion at the extreme) */
export const BALL_BOUNDS = { minX: R, maxX: 100 - R, minY: R, maxY: 50 - R };
/** Inches of cue-ball travel that count as "one table length" on the SPEED scale (a speed-scale calibration in inches; unchanged by the true-scale redraw) */
export const TABLE_LENGTH = 90;
export const DIAMOND = 12.5;
export const POCKET_XY = Object.fromEntries(Object.entries(POCKETS).map(([k, p]) => [k, { x: p.x, y: p.y }]));

export const POCKET_NAMES = {
  TL: 'top-left corner',
  TM: 'top side pocket',
  TR: 'top-right corner',
  BL: 'bottom-left corner',
  BM: 'bottom side pocket',
  BR: 'bottom-right corner'
};

export const RAILS = {
  top: { axis: 'y', value: CUSHION.minY, name: 'top long rail', short: 'top' },
  bottom: { axis: 'y', value: CUSHION.maxY, name: 'bottom long rail', short: 'bottom' },
  left: { axis: 'x', value: CUSHION.minX, name: 'head (left) short rail', short: 'head' },
  right: { axis: 'x', value: CUSHION.maxX, name: 'foot (right) short rail', short: 'foot' }
};

// ---------- vectors ----------
export const P = (x, y) => ({ x, y });
export const add = (a, b) => P(a.x + b.x, a.y + b.y);
export const sub = (a, b) => P(a.x - b.x, a.y - b.y);
export const mul = (a, s) => P(a.x * s, a.y * s);
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a) => {
  const l = len(a) || 1;
  return P(a.x / l, a.y / l);
};
export const perp = (a) => P(-a.y, a.x);
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
export const round1 = (v) => Math.round(v * 10) / 10;
export const roundHalf = (v) => Math.round(v * 2) / 2;
export const toPoint = (p) => (Array.isArray(p) ? P(p[0], p[1]) : P(p.x, p.y));
export const clean = (p) => P(round1(p.x), round1(p.y));

export function angleBetween(a, b) {
  const c = Math.max(-1, Math.min(1, dot(norm(a), norm(b))));
  return deg(Math.acos(c));
}

export function rotate(v, degrees) {
  const r = rad(degrees);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return P(v.x * c - v.y * s, v.x * s + v.y * c);
}

/** Distance from point p to segment a→b */
export function distToSegment(p, a, b) {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 < 1e-9) return dist(p, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2));
  return dist(p, add(a, mul(ab, t)));
}

export function polylineLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** Minimum distance from p to any segment of a polyline */
export function distToPolyline(p, pts) {
  let m = Infinity;
  for (let i = 1; i < pts.length; i++) m = Math.min(m, distToSegment(p, pts[i - 1], pts[i]));
  return m;
}

/** Truncate polyline to arc length s */
export function truncatePolyline(pts, s) {
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (acc + seg >= s) {
      const t = seg ? (s - acc) / seg : 0;
      out.push(add(pts[i - 1], mul(sub(pts[i], pts[i - 1]), t)));
      return out;
    }
    acc += seg;
    out.push(pts[i]);
  }
  return out;
}

// ---------- rails / mirror method ----------
export function mirrorPoint(p, railKey) {
  const r = RAILS[railKey];
  return r.axis === 'y' ? P(p.x, 2 * r.value - p.y) : P(2 * r.value - p.x, p.y);
}

export function onRail(p, railKey, tol = 0.25) {
  const r = RAILS[railKey];
  const v = r.axis === 'y' ? p.y : p.x;
  const along = r.axis === 'y' ? p.x : p.y;
  const lo = r.axis === 'y' ? CUSHION.minX : CUSHION.minY;
  const hi = r.axis === 'y' ? CUSHION.maxX : CUSHION.maxY;
  return Math.abs(v - r.value) <= tol && along >= lo - tol && along <= hi + tol;
}

export function railOf(p, tol = 0.25) {
  return Object.keys(RAILS).find((k) => onRail(p, k, tol)) || null;
}

function intersectRail(a, b, railKey) {
  const r = RAILS[railKey];
  const av = r.axis === 'y' ? a.y : a.x;
  const bv = r.axis === 'y' ? b.y : b.x;
  if (Math.abs(bv - av) < 1e-9) return null;
  const t = (r.value - av) / (bv - av);
  if (t <= 1e-6 || t >= 1 - 1e-6) return null;
  return add(a, mul(sub(b, a), t));
}

/**
 * Mirror-method route: start → rails[0] → rails[1] … → end.
 * Returns { points, contacts, valid }.
 */
export function mirrorPath(start, end, rails) {
  if (!rails.length) return { points: [start, end], contacts: [], valid: true };
  let img = end;
  for (let i = rails.length - 1; i >= 0; i--) img = mirrorPoint(img, rails[i]);
  const c = intersectRail(start, img, rails[0]);
  if (!c || !onRail(c, rails[0], 0.01)) return { points: [start, end], contacts: [], valid: false };
  const c1 = clean(c);
  c1[RAILS[rails[0]].axis] = RAILS[rails[0]].value; // exact on cushion line
  const rest = mirrorPath(c1, end, rails.slice(1));
  return {
    points: [start, ...rest.points],
    contacts: [{ ...c1, rail: rails[0] }, ...rest.contacts],
    valid: rest.valid
  };
}

/** Where a straight route from start toward `through` meets a rail — used for aim descriptions */
export function diamondsAlong(p, railKey) {
  const r = RAILS[railKey];
  return r.axis === 'y' ? round1(p.x / DIAMOND) : round1(p.y / DIAMOND);
}

/**
 * Fold an unfolded polyline back into the table (billiard unfolding).
 * Returns folded points plus rail contact points (with rail names).
 */
export function foldPolyline(pts) {
  const W = CUSHION.maxX - CUSHION.minX;
  const H = CUSHION.maxY - CUSHION.minY;
  const foldC = (v, min, span) => {
    let u = (v - min) % (2 * span);
    if (u < 0) u += 2 * span;
    return u <= span ? min + u : min + 2 * span - u;
  };
  const cell = (v, min, span) => Math.floor((v - min) / span);
  const out = [];
  const contacts = [];
  const f = (p) => P(foldC(p.x, CUSHION.minX, W), foldC(p.y, CUSHION.minY, H));
  out.push(f(pts[0]));
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    // collect boundary crossings between a and b
    const events = [];
    const cx0 = cell(a.x, CUSHION.minX, W);
    const cx1 = cell(b.x, CUSHION.minX, W);
    if (cx0 !== cx1) {
      const step = cx1 > cx0 ? 1 : -1;
      for (let c = cx0; c !== cx1; c += step) {
        const bx = CUSHION.minX + (step > 0 ? c + 1 : c) * W;
        const t = (bx - a.x) / (b.x - a.x);
        events.push({ t, axis: 'x', k: step > 0 ? c + 1 : c });
      }
    }
    const cy0 = cell(a.y, CUSHION.minY, H);
    const cy1 = cell(b.y, CUSHION.minY, H);
    if (cy0 !== cy1) {
      const step = cy1 > cy0 ? 1 : -1;
      for (let c = cy0; c !== cy1; c += step) {
        const by = CUSHION.minY + (step > 0 ? c + 1 : c) * H;
        const t = (by - a.y) / (b.y - a.y);
        events.push({ t, axis: 'y', k: step > 0 ? c + 1 : c });
      }
    }
    events.sort((e1, e2) => e1.t - e2.t);
    for (const e of events) {
      const q = add(a, mul(sub(b, a), e.t));
      const fq = f(q);
      let rail;
      if (e.axis === 'x') {
        fq.x = e.k % 2 === 0 ? CUSHION.minX : CUSHION.maxX;
        rail = e.k % 2 === 0 ? 'left' : 'right';
        if (e.k < 0 && Math.abs(e.k) % 2 === 1) { fq.x = CUSHION.maxX; rail = 'right'; }
      } else {
        fq.y = Math.abs(e.k) % 2 === 0 ? CUSHION.minY : CUSHION.maxY;
        rail = Math.abs(e.k) % 2 === 0 ? 'top' : 'bottom';
      }
      out.push(fq);
      contacts.push({ x: fq.x, y: fq.y, rail });
    }
    out.push(f(b));
  }
  return { points: out, contacts };
}

// ---------- shot physics ----------
export function cutInfo(cue, ob, pocketKey) {
  const pocket = POCKET_XY[pocketKey];
  const n = norm(sub(pocket, ob));
  const ghost = sub(ob, mul(n, 2 * R));
  return aimInfo(cue, ob, ghost);
}

/** Aim info for sending the OB along direction (ob - ghost) */
export function aimInfo(cue, ob, ghost) {
  const n = norm(sub(ob, ghost));
  const d = norm(sub(ghost, cue));
  const cosPhi = Math.max(-1, Math.min(1, dot(d, n)));
  const phi = deg(Math.acos(cosPhi));
  let t = sub(d, mul(n, cosPhi));
  t = len(t) < 1e-6 ? perp(n) : norm(t);
  return { ghost, n, d, phi, t, fullness: 1 - Math.sin(rad(phi)), dCue: dist(cue, ghost) };
}

/** Fraction label for object-ball contact */
export function fullnessLabel(fullness) {
  if (fullness >= 0.93) return 'Full ball';
  if (fullness >= 0.68) return 'About ¾ ball';
  if (fullness >= 0.4) return 'About ½ ball';
  if (fullness >= 0.18) return 'About ¼ ball';
  return 'Thin (⅛ ball)';
}

export function shortFullness(fullness) {
  if (fullness >= 0.93) return 'FULL';
  if (fullness >= 0.68) return '¾ BALL';
  if (fullness >= 0.4) return '½ BALL';
  if (fullness >= 0.18) return '¼ BALL';
  return 'THIN';
}

/** Post-contact cue-ball velocities (unit contact speed) */
export function postContact(info, k) {
  const sinP = Math.sin(rad(info.phi));
  const v0 = mul(info.t, sinP);
  const vf = add(mul(v0, 5 / 7), mul(info.d, (2 / 7) * k));
  return { v0, vf };
}

/**
 * Unfolded cue-ball path after contact: curved sliding phase then straight roll.
 * Returns unfolded points (not yet folded into the table).
 */
function unfoldedCBPath(start, v0, vf, curveLen, total) {
  const pts = [start];
  const steps = 14;
  const raw = [];
  for (let i = 0; i <= steps; i++) {
    const tau = i / steps;
    raw.push(add(mul(v0, tau), mul(sub(vf, v0), 0.5 * tau * tau)));
  }
  const arc = polylineLength(raw);
  const endDir = len(vf) > 1e-4 ? norm(vf) : len(v0) > 1e-4 ? norm(v0) : null;
  if (!endDir) return pts;
  let scale = arc > 1e-4 ? curveLen / arc : 0;
  if (scale > 0) {
    for (let i = 1; i <= steps; i++) pts.push(add(start, mul(raw[i], scale)));
  }
  const last = pts[pts.length - 1];
  const used = polylineLength(pts);
  pts.push(add(last, mul(endDir, Math.max(0, total - used) + 0.001)));
  return pts;
}

/** First cushion crossing of an unfolded polyline: { i (segment end index), q (point), axis } */
function firstCrossing(unf) {
  const W = CUSHION.maxX - CUSHION.minX;
  const H = CUSHION.maxY - CUSHION.minY;
  const cell = (v, min, span) => Math.floor((v - min) / span);
  for (let i = 1; i < unf.length; i++) {
    const a = unf[i - 1];
    const b = unf[i];
    let best = null;
    const cx0 = cell(a.x, CUSHION.minX, W);
    const cx1 = cell(b.x, CUSHION.minX, W);
    if (cx0 !== cx1) {
      const bx = CUSHION.minX + (cx1 > cx0 ? cx0 + 1 : cx0) * W;
      const t = (bx - a.x) / (b.x - a.x);
      best = { t, axis: 'x' };
    }
    const cy0 = cell(a.y, CUSHION.minY, H);
    const cy1 = cell(b.y, CUSHION.minY, H);
    if (cy0 !== cy1) {
      const by = CUSHION.minY + (cy1 > cy0 ? cy0 + 1 : cy0) * H;
      const t = (by - a.y) / (b.y - a.y);
      if (!best || t < best.t) best = { t, axis: 'y' };
    }
    if (best) return { i, q: add(a, mul(sub(b, a), best.t)), axis: best.axis };
  }
  return null;
}

/** Apply running (+) / reverse (−) english by changing the first rebound angle (degrees) in unfolded space. */
function applyEnglish(unfolded, degreesDelta) {
  if (!degreesDelta) return unfolded;
  const fc = firstCrossing(unfolded);
  if (!fc) return unfolded;
  const a = unfolded[fc.i - 1];
  const b = unfolded[fc.i];
  const dir = norm(sub(b, a));
  const normal = fc.axis === 'x' ? P(1, 0) : P(0, 1);
  const along = fc.axis === 'x' ? P(0, 1) : P(1, 0);
  const cn = dot(dir, normal);
  const ca = dot(dir, along);
  const inc = deg(Math.atan2(Math.abs(ca), Math.abs(cn)));
  const out = Math.max(2, Math.min(80, inc + degreesDelta));
  const newDir = add(mul(normal, Math.sign(cn || 1) * Math.cos(rad(out))), mul(along, Math.sign(ca || 1) * Math.sin(rad(out))));
  const before = [...unfolded.slice(0, fc.i), fc.q];
  const remaining = Math.max(0, polylineLength(unfolded) - polylineLength(before));
  return [...before, add(fc.q, mul(newDir, remaining))];
}

/**
 * Build a folded cue-ball route of given travel after contact.
 * opts: { k, curveLen, travel, englishDelta }
 */
export function cueRoute(info, { k = 0, curveLen = 8, travel = 30, englishDelta = 0 }) {
  const { v0, vf } = postContact(info, k);
  let unf = unfoldedCBPath(info.ghost, v0, vf, Math.min(curveLen, travel), travel);
  unf = applyEnglish(unf, englishDelta);
  unf = truncatePolyline(unf, travel);
  return foldPolyline(unf);
}

/** Straight route from a point in a direction with rail reflections */
export function straightRoute(start, dir, travel, englishDelta = 0) {
  let unf = [start, add(start, mul(norm(dir), travel))];
  unf = applyEnglish(unf, englishDelta);
  unf = truncatePolyline(unf, travel);
  return foldPolyline(unf);
}

/**
 * Search spin k and travel so the cue-ball route ends at (or as close as possible to) zone Z.
 * family: 'follow' | 'draw' | 'stun' | 'any'
 */
export const SPIN_RANGES = {
  follow: [0.3, 1.4],
  draw: [-1.6, -0.25],
  stun: [-0.12, 0.12],
  any: [-1.6, 1.4]
};

export function solveToZone(info, Z, { family = 'any', englishDelta = 0, curveLen = null, maxTravel = 320 } = {}) {
  const [lo, hi] = Array.isArray(family) ? family : SPIN_RANGES[family] || SPIN_RANGES.any;
  const straight = dist(info.ghost, Z);
  const cl = curveLen ?? Math.max(3, Math.min(16, straight * 0.35));
  let best = null;
  for (let k = lo; k <= hi + 1e-9; k += 0.04) {
    const { v0, vf } = postContact(info, k);
    let unf = unfoldedCBPath(info.ghost, v0, vf, cl, maxTravel);
    unf = applyEnglish(unf, englishDelta);
    // walk unfolded path, fold each sample, find closest point to Z
    const samples = densify(unf, 0.5);
    const folded = samples.map((p) => foldPolyline([p]).points[0]);
    let s = 0;
    for (let i = 0; i < folded.length; i++) {
      if (i) s += dist(samples[i - 1], samples[i]);
      const e = dist(folded[i], Z);
      if (!best || e < best.err - 1e-6 || (Math.abs(e - best.err) < 0.2 && Math.abs(k) < Math.abs(best.k))) {
        if (s < 1 && family !== 'stun' && !Array.isArray(family)) continue;
        best = { k: Math.round(k * 100) / 100, travel: s, err: e };
      }
    }
  }
  if (!best) best = { k: 0, travel: 0, err: dist(info.ghost, Z) };
  const route = best.travel > 0.5 ? cueRoute(info, { k: best.k, curveLen: cl, travel: best.travel, englishDelta }) : { points: [info.ghost], contacts: [] };
  return { ...best, curveLen: cl, route };
}

function densify(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let j = 1; j <= n; j++) out.push(add(a, mul(sub(b, a), j / n)));
  }
  return out;
}

/** Search a straight direction (with rails) whose route ends nearest Z. Used for object-ball safety paths and lags. */
export function solveStraightToZone(start, Z, { maxRails = 2, minDeg = 0, maxDeg = 360, preferDir = null } = {}) {
  let best = null;
  for (let a = minDeg; a < maxDeg; a += 0.5) {
    const dir = P(Math.cos(rad(a)), Math.sin(rad(a)));
    const unf = [start, add(start, mul(dir, 260))];
    const samples = densify(unf, 0.5);
    let s = 0;
    let railsSeen = 0;
    let prevCell = null;
    for (let i = 0; i < samples.length; i++) {
      if (i) s += 0.5;
      const f = foldPolyline([samples[0], samples[i]]);
      railsSeen = f.contacts.length;
      if (railsSeen > maxRails) break;
      const e = dist(f.points[f.points.length - 1], Z);
      const score = e + railsSeen * 1.2 + s * 0.004; // prefer fewer rails / shorter routes when both reach the zone
      if (!best || score < best.score - 1e-6) best = { dir, travel: s, err: e, rails: railsSeen, score };
      prevCell = railsSeen;
    }
  }
  const route = straightRoute(start, best.dir, best.travel);
  return { ...best, route };
}

// ---------- speed / contact heuristics ----------
/** k (spin at contact) → vertical tips on the cue ball */
export function tipsFromSpin(k, dCue, technique) {
  const far = dCue > 45 ? 1 : 0;
  if (technique === 'stun' || technique === 'stop') return dCue > 38 ? -0.5 : 0;
  if (k > 0) return k < 0.6 ? 0.5 : k < 1.05 ? 1 : 1.5;
  const a = Math.abs(k);
  let v = a < 0.55 ? -0.5 : a < 1.05 ? -1 : -1.5;
  if (far && v > -1.5) v -= 0.5;
  return v;
}

/** Share of rolling energy a ball keeps through one cushion rebound (≈0.77 of its speed). */
export const RAIL_KEEP = 0.6;

/** Split a route polyline into straight-ish legs between cushion contacts; returns leg lengths. */
export function legLengths(points) {
  const legs = [];
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    acc += dist(points[i - 1], points[i]);
    if (i < points.length - 1 && railOf(points[i], 0.05)) {
      legs.push(acc);
      acc = 0;
    }
  }
  legs.push(acc);
  return legs;
}

/** Free-rolling "capacity" (inches) a ball needs at the start of a route to finish it, with rail losses. */
export function capacityForLegs(legs) {
  if (!legs.length) return 0;
  let E = legs[legs.length - 1];
  for (let i = legs.length - 2; i >= 0; i--) E = E / RAIL_KEEP + legs[i];
  return E;
}

/** Convert capacity to the Pool IQ Speed scale (lengths, with a rail rebound between each length). */
export function speedFromCapacity(C) {
  let S = 0;
  let E = C;
  while (E > TABLE_LENGTH && S < 9) {
    E -= TABLE_LENGTH;
    S += 1;
    E *= RAIL_KEEP;
  }
  return S + E / TABLE_LENGTH;
}

export const clampSpeed = (s) => Math.max(0.5, Math.min(5, roundHalf(s)));

/**
 * Recommended Pool IQ speed for a position shot.
 * The cue ball keeps |vf|² of its rolling energy after contact (physics model above); the route after
 * contact needs capacityForLegs(); draw and stun also need the ball still sliding at contact.
 */
export function speedForShot(info, k, routePoints, technique) {
  const { vf } = postContact(info, k);
  const f = Math.max(len(vf) ** 2, 0.03);
  const after = routePoints && routePoints.length > 1 ? capacityForLegs(legLengths(routePoints)) : 0;
  const C = info.dCue + after / f;
  let min = 0.5;
  if (technique === 'stun' || technique === 'stop' || technique === 'stun-run' || technique === 'stun-draw') min = 1 + info.dCue / 45;
  if (technique === 'draw') min = 1.5 + (info.dCue / 50) * Math.abs(k);
  return clampSpeed(Math.max(speedFromCapacity(C), Math.min(min, 3.5)));
}

/** Speed for sending an object ball along a route after a cut of phi degrees. */
export function speedForObjectRoute(info, obPoints, extra = 12) {
  const legs = legLengths(obPoints);
  legs[legs.length - 1] += extra; // arrive with pace to spare
  const E = capacityForLegs(legs);
  const cos2 = Math.max(Math.cos(rad(info.phi)) ** 2, 0.12);
  return clampSpeed(Math.max(1, speedFromCapacity(info.dCue + E / cos2)));
}

export function techniqueFromSpin(k, phi) {
  if (Math.abs(k) <= 0.15) return phi < 5 ? 'stop' : 'stun';
  return k > 0 ? 'follow' : 'draw';
}

/** Describe a table point in diamonds, e.g. "2.4 diamonds from the head rail, 1.1 from the top rail" */
export function describePoint(p) {
  return `${round1(p.x / DIAMOND)} diamonds up from the head rail, ${round1(p.y / DIAMOND)} down from the top rail`;
}

export function railListText(contacts) {
  if (!contacts.length) return 'no rails';
  return contacts.map((c) => RAILS[c.rail].short).join(' → ');
}

export function inTable(p, pad = 0) {
  return p.x >= CUSHION.minX - 0.3 - pad && p.x <= CUSHION.maxX + 0.3 + pad && p.y >= CUSHION.minY - 0.3 - pad && p.y <= CUSHION.maxY + 0.3 + pad;
}

export function ballOnTable(p) {
  return p.x >= BALL_BOUNDS.minX - 0.01 && p.x <= BALL_BOUNDS.maxX + 0.01 && p.y >= BALL_BOUNDS.minY - 0.01 && p.y <= BALL_BOUNDS.maxY + 0.01;
}

/** Nearest pocket distance (for scratch checks) */
export function nearestPocketDist(p) {
  return Math.min(...Object.values(POCKET_XY).map((q) => dist(p, q)));
}

/** Angle of incidence/reflection at vertex b on a rail; returns [in, out] measured from the rail normal */
export function reflectionAngles(a, b, c, railKey) {
  const r = RAILS[railKey];
  const normal = r.axis === 'y' ? P(0, 1) : P(1, 0);
  const vin = norm(sub(b, a));
  const vout = norm(sub(c, b));
  const ain = deg(Math.acos(Math.min(1, Math.abs(dot(vin, normal)))));
  const aout = deg(Math.acos(Math.min(1, Math.abs(dot(vout, normal)))));
  return [ain, aout];
}

/** Place the cue ball for a desired cut: cut = [degrees, side(+1/-1), distance from ghost] */
export function cueFromCut(ob, dirToTarget, cut) {
  const [d, side, dd] = cut;
  const n = norm(dirToTarget);
  const ghost = sub(ob, mul(n, 2 * R));
  const dir = rotate(n, side * d);
  return clean(sub(ghost, mul(dir, dd)));
}
