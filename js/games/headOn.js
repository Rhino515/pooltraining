/**
 * Impossible head-on lines: the cue path is drawn through the object-ball center,
 * but the object ball is drawn leaving at an angle. A center-ball hit cannot do that.
 * The ghost center sits on the line from the pocket (or target) through the object-ball
 * center, one ball radius back, on the side the cue ball must hit. The cue path ends
 * on that ghost. It is not drawn on through the object-ball center.
 */
import { BALL_RADIUS } from '../tableDiagram.js';

const DEAD = 0.55;
const MIN_ANGLE = 12;
const r2 = (v) => Math.round(v * 1000) / 1000;

function ang(ax, ay, bx, by) {
  const d = Math.hypot(ax, ay) * Math.hypot(bx, by) || 1;
  const c = Math.max(-1, Math.min(1, (ax * bx + ay * by) / d));
  return (Math.acos(c) * 180) / Math.PI;
}

export function headOnScope(ch) {
  const cat = ch?.category || '';
  const id = String(ch?.id || '');
  return cat.startsWith('PKF') || cat === 'Ball Pocketing' || id.startsWith('pkf-') || id.startsWith('bp-');
}

/**
 * @param {object} ch challenge or shot-like object with x/y paths
 * @returns {boolean} true when a ghost replaced a dead-center contact
 */
export function correctHeadOn(ch) {
  if (!ch || ch.headOnFixed || !headOnScope(ch)) return false;
  const cp = (ch.cueBallPath || []).map((p) => ({ x: p.x, y: p.y }));
  if (cp.length < 2) return false;
  const balls = ch.ballPositions || [];
  if (!balls.length) return false;
  const prefer = ch.targetBall;
  const order = balls.slice().sort((a, b) => (a.n === prefer ? -1 : b.n === prefer ? 1 : 0));
  const paths = [];
  if (ch.objectBallPath?.length >= 2) paths.push({ n: ch.targetBall, points: ch.objectBallPath });
  for (const p of ch.objectBallPaths || []) if (p?.points?.length >= 2) paths.push(p);
  for (const ob of order) {
    const op = paths.find((p) => p.n === ob.n) || (paths.length === 1 ? paths[0] : null);
    if (!op) continue;
    const pts = op.points;
    let bi = 0;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - ob.x, p.y - ob.y);
      if (d < bd) { bd = d; bi = i; }
    });
    if (bd > 1.3 || bi >= pts.length - 1) continue;
    const nxt = pts[bi + 1];
    const lx = nxt.x - pts[bi].x;
    const ly = nxt.y - pts[bi].y;
    let vi = -1;
    let vd = Infinity;
    cp.forEach((p, i) => {
      const d = Math.hypot(p.x - ob.x, p.y - ob.y);
      if (d < vd) { vd = d; vi = i; }
    });
    if (vi < 1 || vd > DEAD) continue;
    const prev = cp[vi - 1];
    const ix = cp[vi].x - prev.x;
    const iy = cp[vi].y - prev.y;
    if (ang(ix, iy, lx, ly) < MIN_ANGLE) continue;
    const llen = Math.hypot(lx, ly) || 1;
    const gx = r2(ob.x - (lx / llen) * BALL_RADIUS);
    const gy = r2(ob.y - (ly / llen) * BALL_RADIUS);
    const blocked = balls.some((b) => b !== ob && Math.hypot(b.x - gx, b.y - gy) < 2 * BALL_RADIUS - 0.05);
    if (blocked) continue;
    const next = cp.slice(0, vi);
    next.push({ x: gx, y: gy });
    ch.cueBallPath = next;
    ch.ghost = { x: gx, y: gy };
    ch.contactIndex = next.length - 1;
    ch.headOnFixed = true;
    return true;
  }
  return false;
}
