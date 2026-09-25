/**
 * Shot Simulator helpers built on the physics: throw-compensated aim to a pocket, "Find a Shot"
 * (search for a shot that pockets a ball AND lands the cue ball on a target), shape zones and
 * Target Game shot generation. Pure (no DOM); long searches run in chunks through an async API.
 */
import { R, simulate, aimAt, aimFromVector, PHYS_POCKETS, isCue, speedToV0 } from './physics.js';
import { rng } from './layouts.js';

export const POCKET_KEYS = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];
const hyp = (x, y) => Math.sqrt(x * x + y * y);
const pocketOf = (k) => PHYS_POCKETS.find((p) => p.key === k);
const angDiff = (a, b) => { let d = (a - b) % 360; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };

const aimCache = new Map();
/**
 * Effective aim point for an object ball into a pocket: the middle of the window of launch directions
 * that actually drop the ball in the simulated pocket (so shallow-angle corner shots aim past the near
 * point instead of at the pocket's centre). Lone-ball rolling test at a medium pace. Cached.
 */
export function pocketAimPoint(ob, pocketKey) {
  const key = `${ob.x.toFixed(2)},${ob.y.toFixed(2)},${pocketKey}`;
  if (aimCache.has(key)) return aimCache.get(key);
  const pk = pocketOf(pocketKey);
  const dist = hyp(pk.x - ob.x, pk.y - ob.y);
  const center = aimAt(ob, pk);
  const V = speedToV0(0.9);
  const drops = (deg) => {
    const d = { x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) };
    // the ball runs straight until it reaches the pocket area, so start it 10" out on the same line
    const skip = Math.max(0, dist - 10);
    const r = simulate([{ id: 1, x: ob.x + d.x * skip, y: ob.y + d.y * skip }], null, { record: false, maxTime: 1.2, initial: { 1: { vx: V * d.x, vy: V * d.y, wx: (V * d.y) / R, wy: (-V * d.x) / R, wz: 0 } } });
    return r.pocketed.length === 1 && r.pocketed[0].pocket === pocketKey;
  };
  const span = Math.min(25, Math.max(3, (Math.atan2(4, dist) * 180) / Math.PI * 1.6));
  const step = span / 30;
  const ok = [];
  for (let i = -30; i <= 30; i++) ok.push(drops(center + i * step));
  // largest run of successes (prefer the one nearest the centre)
  let best = null;
  for (let i = 0; i < ok.length; ) {
    if (!ok[i]) { i++; continue; }
    let j = i;
    while (j + 1 < ok.length && ok[j + 1]) j++;
    const mid = (i + j) / 2 - 30;
    if (!best || j - i > best.len || (j - i === best.len && Math.abs(mid) < Math.abs(best.mid))) best = { len: j - i, mid };
    i = j + 1;
  }
  const deg = best ? center + best.mid * step : center;
  const d = { x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) };
  const out = { x: ob.x + d.x * dist, y: ob.y + d.y * dist, window: best ? (best.len + 1) * step : 0, makeable: !!best };
  if (aimCache.size > 400) aimCache.clear();
  aimCache.set(key, out);
  return out;
}
/** Ghost ball for ob → effective pocket aim point */
export function potGhost(cue, ob, pocketKey) {
  const p = pocketAimPoint(ob, pocketKey);
  const dx = p.x - ob.x;
  const dy = p.y - ob.y;
  const l = hyp(dx, dy) || 1;
  const ghost = { x: ob.x - (dx / l) * 2 * R, y: ob.y - (dy / l) * 2 * R };
  return { aim: aimAt(cue, ghost), ghost, point: p };
}

/** Object-ball direction (deg) right after the first hit, for a given aim */
function obLaunch(layout, obId, shot, aim) {
  // only the cue ball and the object ball matter for the launch direction (blockers are caught by the full simulation later)
  const two = layout.filter((b) => isCue(b.id) || String(b.id) === String(obId));
  const r = simulate(two, { ...shot, aim }, { record: false, stopAfterFirstHit: true, afterHit: 0.004, maxTime: 20 });
  if (!r.firstHit || String(r.firstHit.ob) !== String(obId)) return null;
  const f = r.final.find((b) => String(b.id) === String(obId));
  if (!f || (!f.vx && !f.vy)) return null;
  return aimFromVector(f.vx, f.vy);
}

/**
 * Aim angle that sends obId toward the pocket, compensating for throw and squirt (secant iterations
 * on the simulated object-ball launch direction). Returns {aim, ghost, cut, compensated} or null if the
 * object ball can't be hit first.
 */
export function aimToPocket(layout, obId, pocketKey, shot = {}) {
  const cue = layout.find((b) => isCue(b.id));
  const ob = layout.find((b) => String(b.id) === String(obId));
  const pk = pocketOf(pocketKey);
  if (!cue || !ob || !pk) return null;
  const g = potGhost(cue, ob, pocketKey);
  const want = aimAt(ob, g.point);
  const cutVec = { x: ob.x - g.ghost.x, y: ob.y - g.ghost.y };
  const approach = { x: g.ghost.x - cue.x, y: g.ghost.y - cue.y };
  const cut = (Math.acos(Math.max(-1, Math.min(1, (cutVec.x * approach.x + cutVec.y * approach.y) / (hyp(cutVec.x, cutVec.y) * hyp(approach.x, approach.y) || 1)))) * 180) / Math.PI;
  const s = { speed: shot.speed ?? 2, vTips: shot.vTips || 0, hTips: shot.hTips || 0, V: shot.V };
  let a0 = g.aim;
  let e0 = errAt(a0);
  if (e0 == null) return { aim: g.aim, ghost: g.ghost, cut, compensated: false };
  let a1 = a0 + (e0 > 0 ? -0.3 : 0.3);
  let e1 = errAt(a1);
  for (let i = 0; i < 8 && e1 != null && Math.abs(e1) > 0.02; i++) {
    const denom = e1 - e0;
    if (Math.abs(denom) < 1e-9) break;
    const a2 = a1 - (e1 * (a1 - a0)) / denom;
    a0 = a1; e0 = e1;
    a1 = Math.abs(a2 - g.aim) > 8 ? g.aim : a2;
    e1 = errAt(a1);
  }
  if (e1 == null || Math.abs(e1) > 0.5) return { aim: g.aim, ghost: g.ghost, cut, compensated: false };
  return { aim: norm(a1), ghost: g.ghost, cut, compensated: true };
  function errAt(a) {
    const d = obLaunch(layout, obId, s, a);
    return d == null ? null : angDiff(d, want);
  }
}
const norm = (a) => ((a % 360) + 360) % 360;

/** Is the straight path from p to q clear of every ball except the listed ids? (for quick filtering) */
export function pathClear(layout, p, q, exceptIds, width = 2 * R) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const L2 = dx * dx + dy * dy || 1;
  return layout.every((b) => {
    if (exceptIds.some((e) => String(e) === String(b.id))) return true;
    const t = Math.max(0, Math.min(1, ((b.x - p.x) * dx + (b.y - p.y) * dy) / L2));
    return hyp(b.x - (p.x + t * dx), b.y - (p.y + t * dy)) >= width - 0.01;
  });
}

/** Candidate (object ball, pocket) pairs that are geometrically makeable from the cue ball */
export function candidatePots(layout, maxCut = 75, onlyBall = null) {
  const cue = layout.find((b) => isCue(b.id));
  if (!cue) return [];
  const out = [];
  for (const ob of layout) {
    if (isCue(ob.id) || (onlyBall != null && String(ob.id) !== String(onlyBall))) continue;
    for (const k of POCKET_KEYS) {
      const pk = pocketAimPoint(ob, k);
      if (!pk.makeable) continue;
      const g = potGhost(cue, ob, k);
      const ox = pk.x - ob.x;
      const oy = pk.y - ob.y;
      const ax = g.ghost.x - cue.x;
      const ay = g.ghost.y - cue.y;
      const cut = (Math.acos(Math.max(-1, Math.min(1, (ox * ax + oy * ay) / (hyp(ox, oy) * hyp(ax, ay) || 1)))) * 180) / Math.PI;
      if (cut > maxCut) continue;
      if (k === 'TM' || k === 'BM') {
        const fromNormal = (Math.atan2(Math.abs(ox), Math.abs(oy)) * 180) / Math.PI;
        if (fromNormal > 62) continue;
      }
      if (!pathClear(layout, ob, pk, [ob.id, 'cue'].concat([])) || !pathClear(layout, cue, g.ghost, ['cue', ob.id])) continue;
      out.push({ ob: ob.id, pocket: k, cut, ghost: g.ghost });
    }
  }
  return out.sort((a, b) => a.cut - b.cut);
}

/**
 * Find a Shot: search pockets × tip × speed for a shot that pockets a ball (no scratch, nothing else
 * pocketed) and leaves the cue ball closest to target. mode 'fast' = coarse grid; 'precise' adds a
 * fine refinement around the best candidates. Async + cancellable via opt.signal {cancelled}.
 */
export async function findShot(layout, target, opt = {}) {
  const mode = opt.mode || 'precise';
  const cands = candidatePots(layout, 72, opt.ball ?? null).slice(0, mode === 'fast' ? 6 : 10);
  const vList = mode === 'fast' ? [-1, -0.5, 0, 0.5, 1] : [-1.25, -0.75, -0.25, 0, 0.25, 0.75, 1.25];
  const hList = mode === 'fast' ? [-1, 0, 1] : [-1, -0.5, 0, 0.5, 1];
  const sList = [];
  for (let s = 0.75; s <= 5.01; s += 0.5) sList.push(Math.round(s * 100) / 100);
  const jobs = [];
  for (const c of cands) for (const vTips of vList) for (const hTips of hList) jobs.push({ c, vTips, hTips });
  const total = jobs.length * sList.length + (mode === 'precise' ? 54 : 0);
  let done = 0;
  const results = [];
  const tick = async () => {
    if (opt.onProgress) opt.onProgress(done / total);
    await new Promise((r) => setTimeout(r, 0));
    if (opt.signal?.cancelled) throw new Error('cancelled');
  };
  const trial = (c, vTips, hTips, speed) => {
    const a = aimToPocket(layout, c.ob, c.pocket, { speed, vTips, hTips });
    if (!a) return null;
    const shot = { aim: a.aim, speed, vTips, hTips };
    const r = simulate(layout, shot, { record: false, maxTime: 30 });
    done++;
    const pots = r.pocketed;
    if (r.scratch || pots.length !== 1 || String(pots[0].id) !== String(c.ob) || pots[0].pocket !== c.pocket) return null;
    if (!r.firstHit || String(r.firstHit.ob) !== String(c.ob)) return null;
    const cf = r.final.find((b) => b.id === 'cue');
    const miss = hyp(cf.x - target.x, cf.y - target.y);
    return { shot, ob: c.ob, pocket: c.pocket, cut: c.cut, miss, end: { x: cf.x, y: cf.y } };
  };
  let lastTick = Date.now();
  for (const j of jobs) {
    // speed sweep: stop early once far past the target (longer shots only go further)
    for (const speed of sList) {
      const res = trial(j.c, j.vTips, j.hTips, speed);
      if (res) results.push(res);
      if (Date.now() - lastTick > 40) { await tick(); lastTick = Date.now(); }
    }
  }
  results.sort((a, b) => a.miss - b.miss || Math.abs(a.shot.vTips) + Math.abs(a.shot.hTips) - (Math.abs(b.shot.vTips) + Math.abs(b.shot.hTips)));
  if (mode === 'precise' && results.length) {
    const seeds = results.slice(0, 3);
    for (const sd of seeds) {
      for (const dv of [-0.25, 0, 0.25]) for (const ds of [-0.25, -0.125, -0.0625, 0.0625, 0.125, 0.25]) {
        const c = { ob: sd.ob, pocket: sd.pocket, cut: sd.cut };
        const res = trial(c, clampTip(sd.shot.vTips + dv, 1.5), sd.shot.hTips, Math.max(0.5, sd.shot.speed + ds));
        if (res) results.push(res);
        if (Date.now() - lastTick > 40) { await tick(); lastTick = Date.now(); }
      }
    }
    results.sort((a, b) => a.miss - b.miss);
  }
  if (opt.onProgress) opt.onProgress(1);
  // distinct alternatives (different pocket/ball or clearly different recipe)
  const alts = [];
  for (const r of results) {
    if (alts.length >= 4) break;
    if (!alts.some((a) => a.ob === r.ob && a.pocket === r.pocket && Math.abs(a.shot.vTips - r.shot.vTips) < 0.3 && Math.abs(a.shot.hTips - r.shot.hTips) < 0.3)) alts.push(r);
  }
  return { best: results[0] || null, alternatives: alts, tried: done, candidates: cands.length };
}
const clampTip = (v, m) => Math.max(-m, Math.min(m, v));

/** Clip polygon to the playing surface (Sutherland–Hodgman) */
export function clipToFelt(poly, inset = R) {
  const edges = [
    (p) => p.x >= inset, (p) => p.x <= 100 - inset, (p) => p.y >= inset, (p) => p.y <= 50 - inset
  ];
  const cross = [
    (a, b) => lerpAt(a, b, (inset - a.x) / (b.x - a.x)), (a, b) => lerpAt(a, b, (100 - inset - a.x) / (b.x - a.x)),
    (a, b) => lerpAt(a, b, (inset - a.y) / (b.y - a.y)), (a, b) => lerpAt(a, b, (50 - inset - a.y) / (b.y - a.y))
  ];
  let out = poly;
  edges.forEach((inside, k) => {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const cur = src[i];
      const prev = src[(i + src.length - 1) % src.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cross[k](prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cross[k](prev, cur));
    }
  });
  return out;
}
const lerpAt = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/**
 * Shape zones for one object ball: for each pocket with a clear object-ball path, the wedge of cue-ball
 * positions (apex at the ghost ball, opening away from the pocket, half-angle = max cut) from which the ball
 * can be pocketed with a cut no thicker than maxCut. Returns [{pocket, polygon:[{x,y}], ghost}].
 */
export function shapeZones(layout, obId, maxCut = 60) {
  const ob = layout.find((b) => String(b.id) === String(obId));
  if (!ob) return [];
  const zones = [];
  for (const k of POCKET_KEYS) {
    const pk = pocketAimPoint(ob, k);
    if (!pk.makeable) continue;
    const dx = pk.x - ob.x;
    const dy = pk.y - ob.y;
    const l = hyp(dx, dy) || 1;
    if (k === 'TM' || k === 'BM') {
      const fromNormal = (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
      if (fromNormal > 62) continue;
    }
    if (!pathClear(layout.filter((b) => !isCue(b.id)), ob, pk, [ob.id])) continue;
    const ghost = { x: ob.x - (dx / l) * 2 * R, y: ob.y - (dy / l) * 2 * R };
    const back = Math.atan2(-dy, -dx);
    const half = (Math.min(85, maxCut) * Math.PI) / 180;
    const poly = [ghost];
    for (let i = 0; i <= 12; i++) {
      const a = back - half + (2 * half * i) / 12;
      poly.push({ x: ghost.x + Math.cos(a) * 160, y: ghost.y + Math.sin(a) * 160 });
    }
    const clipped = clipToFelt(poly);
    if (clipped.length >= 3) zones.push({ pocket: k, polygon: clipped, ghost });
  }
  return zones;
}

/**
 * Target Game: a random position (cue + one object ball) with a target where the cue ball can actually
 * finish — the target is the end position of a simulated, successful shot (so every round is makeable).
 */
export function targetRound(seed) {
  const rand = rng(seed);
  for (let tries = 0; tries < 400; tries++) {
    const ob = { id: 1 + Math.floor(rand() * 9), x: 12 + rand() * 76, y: 6 + rand() * 38 };
    const cue = { id: 'cue', x: 8 + rand() * 84, y: 6 + rand() * 38 };
    const d = hyp(ob.x - cue.x, ob.y - cue.y);
    if (d < 10 || d > 55) continue;
    const layout = [cue, ob];
    const cands = candidatePots(layout, 50);
    if (!cands.length) continue;
    const c = cands[Math.floor(rand() * cands.length)];
    const vTips = [-1, -0.5, 0, 0.5, 1][Math.floor(rand() * 5)];
    const hTips = [-0.5, 0, 0, 0.5][Math.floor(rand() * 4)];
    const speed = Math.round((1.25 + rand() * 2.5) * 4) / 4;
    const a = aimToPocket(layout, c.ob, c.pocket, { speed, vTips, hTips });
    if (!a) continue;
    const r = simulate(layout, { aim: a.aim, speed, vTips, hTips }, { record: false });
    if (r.scratch || r.pocketed.length !== 1) continue;
    const end = r.final.find((b) => b.id === 'cue');
    if (hyp(end.x - cue.x, end.y - cue.y) < 6 || end.x < 4 || end.x > 96 || end.y < 4 || end.y > 46) continue;
    const round = (v) => Math.round(v * 100) / 100;
    return {
      balls: [{ id: 'cue', x: round(cue.x), y: round(cue.y) }, { id: ob.id, x: round(ob.x), y: round(ob.y) }],
      target: { x: round(end.x), y: round(end.y) },
      pocket: c.pocket,
      solution: { aim: a.aim, speed, vTips, hTips }
    };
  }
  return null;
}
/** Stars for a cue-ball finish: 3 inside 3.5", 2 inside 6.5", 1 inside 10" (same rings as drill zones) */
export function targetStars(end, target) {
  const d = hyp(end.x - target.x, end.y - target.y);
  return d <= 3.5 ? 3 : d <= 6.5 ? 2 : d <= 10 ? 1 : 0;
}
