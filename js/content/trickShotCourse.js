/**
 * Trick Shot Course on Drill Sets & Exams.
 * Placement, aim, english, speed, and paths are shown. The player shoots on a real table
 * and taps make or miss. No simulated shot. No Career XP.
 * Storage key: state.trickShotCourse only.
 * Next level unlocks when every shot has been MADE 3 times. Misses do not fail the level.
 * Score 3/2/1/0 records how each make happened and does not gate the unlock.
 */
import { renderTableDiagram } from '../tableDiagram.js';
import { cueBallSVG } from '../games/cueBallDiagram.js';

export const COURSE_TITLE = 'Trick Shot Course';
export const EXAM_TITLE = 'Trick Shot Exam';
export const STORAGE_KEY = 'trickShotCourse';
export const TRICK_SCORE = { attemptPoints: { 1: 3, 2: 2, 3: 1, 0: 0 }, makesRequired: 3, bonusPoints: 1 };

const DIAM = 12.5;
const BALL_D = 2.25;
const SPEEDS = new Set(['Soft', 'Medium-Soft', 'Medium', 'Medium-Firm', 'Firm']);
const POCKETS = { TL: [0, 0], TM: [50, 0], TR: [100, 0], BL: [0, 50], BM: [50, 50], BR: [100, 50] };
const POCKET_NAME = { TL: 'head-top corner', TM: 'top side pocket', TR: 'foot-top corner', BL: 'head-bottom corner', BM: 'bottom side pocket', BR: 'foot-bottom corner' };
const RAIL_NAME = { top: 'top long rail', bottom: 'bottom long rail', left: 'head short rail', right: 'foot short rail' };
const RAIL_SHORT = { top: 'TOP', bottom: 'BOTTOM', left: 'HEAD', right: 'FOOT' };
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a, s) => ({ x: a.x * s, y: a.y * s });
const len = (a) => Math.hypot(a.x, a.y);
const norm = (a) => { const l = len(a) || 1; return mul(a, 1 / l); };
const dot = (a, b) => a.x * b.x + a.y * b.y;
const pk = (id) => ({ x: POCKETS[id][0], y: POCKETS[id][1] });
const r2 = (n) => Math.round(n * 100) / 100;
const onStep = (v, step) => Math.abs(v / step - Math.round(v / step)) < 0.045 / step;

export function refClass(p) {
  if (onStep(p.x, DIAM) && onStep(p.y, DIAM)) return 'diamond';
  if (onStep(p.x - 6.25, DIAM) && onStep(p.y - 6.25, DIAM)) return 'box';
  if (onStep(p.x, 6.25) && onStep(p.y, 6.25)) return 'half';
  if (onStep(p.x, DIAM) || onStep(p.y, DIAM)) return 'line';
  return 'arbitrary';
}
function dWord(n) {
  const h = Math.round(n * 2);
  if (Math.abs(n * 2 - h) > 0.08) return null;
  if (h % 2 === 0) { const k = h / 2; return `${NUM[k] || k} diamond${k === 1 ? '' : 's'}`; }
  const w = (h - 1) / 2;
  return w === 0 ? 'half a diamond' : `${NUM[w]} and a half diamonds`;
}
export function placePhrase(p) {
  const cls = refClass(p);
  if (cls === 'diamond' || cls === 'half' || cls === 'box') {
    const core = `${dWord(p.x / DIAM)} out from the head short rail, ${dWord((50 - p.y) / DIAM)} up from the bottom long rail`;
    if (cls === 'box') return `center of that diamond box (${core})`;
    if (cls === 'half') return `half-diamond intersection, ${core}`;
    return `diamond intersection, ${core}`;
  }
  if (cls === 'line') {
    if (onStep(p.x, DIAM)) return `on the diamond line ${dWord(p.x / DIAM)} out from the head short rail, ${r2(p.y)} inches down from the top cushion`;
    return `on the diamond line ${dWord((50 - p.y) / DIAM)} up from the bottom long rail, ${r2(p.x)} inches out from the head short rail`;
  }
  return `${r2(p.x)} inches out from the head short rail and ${r2(50 - p.y)} inches up from the bottom long rail, off the diamond grid`;
}
function nearPocket(p) {
  for (const [x, y] of [[0, 0], [100, 0], [0, 50], [100, 50]]) if (Math.hypot(p.x - x, p.y - y) < 5) return true;
  return (p.y < 1.3 || p.y > 48.7) && Math.abs(p.x - 50) < 6.2;
}
const legalCenter = (p) => p.x >= 1.15 && p.x <= 98.85 && p.y >= 1.15 && p.y <= 48.85 && !nearPocket(p);
function segDist(a, b, p) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}
function trimEnd(a, b, dist) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  if (L <= dist + 0.05) return a;
  const t = (L - dist) / L;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function mirrorPoint(p, rail) {
  if (rail === 'top') return { x: p.x, y: -p.y };
  if (rail === 'bottom') return { x: p.x, y: 100 - p.y };
  if (rail === 'left') return { x: -p.x, y: p.y };
  return { x: 200 - p.x, y: p.y };
}
function railHit(from, to, rail) {
  const dx = to.x - from.x, dy = to.y - from.y;
  let t, x, y;
  if (rail === 'top' || rail === 'bottom') {
    y = rail === 'top' ? 0 : 50;
    if (Math.abs(dy) < 1e-9) return null;
    t = (y - from.y) / dy; x = from.x + t * dx;
    if (x < 4.5 || x > 95.5) return null;
  } else {
    x = rail === 'left' ? 0 : 100;
    if (Math.abs(dx) < 1e-9) return null;
    t = (x - from.x) / dx; y = from.y + t * dy;
    if (y < 4.5 || y > 45.5) return null;
  }
  if (t < 0.04 || t > 0.98) return null;
  const p = { x, y };
  return nearPocket(p) ? null : p;
}
export function mirrorContacts(cue, ob, rails) {
  let img = { x: ob.x, y: ob.y };
  const images = [];
  for (let i = rails.length - 1; i >= 0; i--) { img = mirrorPoint(img, rails[i]); images[i] = img; }
  const hits = [];
  let from = cue;
  for (let i = 0; i < rails.length; i++) {
    const h = railHit(from, images[i], rails[i]);
    if (!h) return null;
    hits.push(h); from = h;
  }
  return hits;
}
function colinear(points, tol = 0.15) {
  const a = points[0], b = points[points.length - 1];
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  return points.every((p) => Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / L <= tol);
}
const ballName = (id) => (id === 'cue' ? 'cue ball' : `${id}-ball`);
export function tipWords(tip) {
  const v = Number(tip?.vTips) || 0, h = Number(tip?.hTips) || 0;
  const amount = (n) => (Math.abs(Math.abs(n) - 0.5) < 0.01 ? 'half a tip of ' : Math.abs(Math.abs(n) - 1) < 0.01 ? 'one tip of ' : '');
  if (!v && !h) return { english: 'center ball, no english', cue: 'center of the cue ball' };
  const side = h > 0 ? 'right' : h < 0 ? 'left' : '';
  const vert = v > 0 ? 'follow' : v < 0 ? 'draw' : '';
  const parts = [];
  if (vert) parts.push(`${amount(v)}${vert}`);
  if (side) parts.push(`${amount(h)}${side} english`);
  const cue = parts.join(' and ');
  return { english: tip?.englishLabel || cue, cue };
}
const gapIn = (a, b) => len(sub(a, b)) - BALL_D;
export function starsFor(id) { return { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5 }[Number(id)] || 1; }
export function starsHTML(n) {
  const k = Math.max(1, Math.min(5, Number(n) || 1));
  return `<span class="trickStars" data-stars="${k}" aria-label="${k} of 5 stars">${'★'.repeat(k)}${'☆'.repeat(5 - k)}</span>`;
}
function sayBall(ball) {
  const name = ball.id === 'cue' ? 'Cue ball' : `${ball.id}-ball`;
  if (ball.frozenTo) return `${name}: FROZEN to the ${ball.frozenTo}. ${ball.note || placePhrase(ball)} No gap.`;
  if (ball.note) return `${name}: ${ball.note} ${placePhrase(ball)}.`;
  return `${name}: ${placePhrase(ball)}.`;
}
function railAt(p) {
  if (nearPocket(p)) return 'pocket';
  const hits = [];
  if (Math.abs(p.y) < 0.4) hits.push('top');
  if (Math.abs(p.y - 50) < 0.4) hits.push('bottom');
  if (Math.abs(p.x) < 0.4) hits.push('left');
  if (Math.abs(p.x - 100) < 0.4) hits.push('right');
  if (hits.length > 1) return 'pocket';
  return hits[0] || '';
}
function railsOf(points) {
  const rails = [];
  for (let i = 1; i < points.length - 1; i++) {
    const which = railAt(points[i]);
    if (which === 'pocket') throw new Error(`path point is in a pocket mouth (${r2(points[i].x)}, ${r2(points[i].y)})`);
    if (which) rails.push(which);
  }
  return rails;
}
function assertRest(balls, label) {
  for (const b of balls) if (!legalCenter(b)) throw new Error(`${label}: ${ballName(b.id)} off the bed (${r2(b.x)}, ${r2(b.y)})`);
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    if (len(sub(balls[i], balls[j])) < BALL_D - 0.08) throw new Error(`${label}: ${ballName(balls[i].id)} overlaps ${ballName(balls[j].id)}`);
  }
}
function assertClear(points, balls, label) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const endsOnBall = balls.some((ball) => Math.hypot(ball.x - b.x, ball.y - b.y) < 0.25);
    segs.push([a, endsOnBall ? trimEnd(a, b, BALL_D) : b]);
  }
  for (const ball of balls) for (const [a, b] of segs) {
    if (Math.hypot(ball.x - a.x, ball.y - a.y) < 0.3 || Math.hypot(ball.x - b.x, ball.y - b.y) < 0.3) continue;
    const dist = segDist(a, b, ball);
    if (dist < BALL_D - 0.08) throw new Error(`${label}: path clips the ${ballName(ball.id)} (${r2(dist)})`);
  }
}
function finishShot(level, spec, balls, paths, pockets) {
  const label = `L${level} ${spec.name}`;
  if (!SPEEDS.has(spec.speed)) throw new Error(`${label} speed`);
  assertRest(balls, label);
  for (const path of paths) {
    const got = railsOf(path.points);
    if (got.join(',') !== (path.rails || []).join(',')) throw new Error(`${label}: rails ${got.join('+') || 'none'} vs ${(path.rails || []).join('+') || 'none'}`);
    assertClear(path.points, balls, label);
    if (path.pocket) {
      const end = path.points[path.points.length - 1];
      const dest = pk(path.pocket);
      if (Math.hypot(end.x - dest.x, end.y - dest.y) > 0.35) throw new Error(`${label}: path does not end in ${path.pocket}`);
    }
  }
  for (const b of balls) {
    if (!b.frozenTo) continue;
    const other = balls.find((x) => ballName(x.id) === b.frozenTo);
    if (!other || Math.abs(gapIn(b, other)) > 0.08) throw new Error(`${label}: ${ballName(b.id)} is not frozen`);
  }
  const gaps = [];
  for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
    const g = gapIn(balls[i], balls[j]);
    if (g > 20) continue;
    gaps.push(Math.abs(g) <= 0.08
      ? `${ballName(balls[i].id)} and the ${ballName(balls[j].id)} are FROZEN`
      : `${ballName(balls[i].id)} to the ${ballName(balls[j].id)}: ${r2(g)} inches between the balls`);
  }
  return {
    level, name: spec.name, skill: spec.skill, stars: starsFor(level),
    balls: balls.map((b) => ({ ...b, say: sayBall(b), ref: refClass(b) === 'arbitrary' ? (b.because || 'illegal') : refClass(b) })),
    paths, pockets, gaps, lines: balls.map(sayBall),
    aim: spec.aim, tip: { vTips: spec.tip?.vTips || 0, hTips: spec.tip?.hTips || 0, englishLabel: spec.tip?.englishLabel || '' },
    english: spec.english, englishWhy: spec.englishWhy || '', speed: spec.speed, speedWhy: spec.speedWhy || '',
    stroke: spec.stroke, sequence: spec.sequence, objective: spec.objective || 'pocket',
    makeLabel: spec.makeLabel || 'Made it', missLabel: spec.missLabel || 'Missed',
    bonus: spec.bonus || null, special: spec.special || '', zone: spec.zone || spec.bonus?.zone || null, aimMark: spec.aimMark || null
  };
}
function combo(level, spec) {
  const cue = { id: 'cue', ...spec.cue };
  const objs = spec.objs.map((b) => ({ ...b }));
  const balls = [cue, ...objs];
  const pocket = pk(spec.pocket);
  if (!colinear([...balls, pocket])) throw new Error(`${spec.name} left the pocket line`);
  const paths = [{ ball: 'cue', points: [cue, objs[0]], rails: [] }];
  for (let i = 0; i < objs.length; i++) {
    paths.push({ ball: objs[i].id, points: [objs[i], objs[i + 1] || pocket], rails: [], pocket: objs[i + 1] ? null : spec.pocket });
  }
  spec.sequence = spec.sequence || `cue → ${objs.map((b) => ballName(b.id)).join(' → ')} → ${POCKET_NAME[spec.pocket]}`;
  return finishShot(level, spec, balls, paths, [spec.pocket]);
}
function railShot(level, spec) {
  const cue = { id: 'cue', ...spec.cue };
  const ob = { ...spec.ob };
  const balls = [cue, ob];
  const hits = mirrorContacts(cue, spec.aimAt || ob, spec.rails);
  if (!hits) throw new Error(`${spec.name} has no rail path`);
  if (spec.pocket) {
    const from = hits[hits.length - 1];
    const dest = pk(spec.pocket);
    const dx = dest.x - ob.x, dy = dest.y - ob.y, L = Math.hypot(dx, dy) || 1;
    const cross = Math.abs((from.x - ob.x) * dy - (from.y - ob.y) * dx) / L;
    const t = ((from.x - ob.x) * dx + (from.y - ob.y) * dy) / (L * L);
    if (cross > 0.65 || t > -0.12) throw new Error(`${spec.name} does not pocket into ${spec.pocket}`);
  }
  const paths = [{ ball: 'cue', points: [cue, ...hits, ob], rails: spec.rails.slice() }];
  if (spec.second) {
    balls.push(spec.second);
    if (!colinear([ob, spec.second, pk(spec.pocket)])) throw new Error(`${spec.name} combo left the line`);
    paths.push({ ball: ob.id, points: [ob, spec.second], rails: [] });
    paths.push({ ball: spec.second.id, points: [spec.second, pk(spec.pocket)], rails: [], pocket: spec.pocket });
  } else if (spec.pocket) paths.push({ ball: ob.id, points: [ob, pk(spec.pocket)], rails: [], pocket: spec.pocket });
  if (spec.blocker) {
    balls.push(spec.blocker);
    const dx = ob.x - cue.x, dy = ob.y - cue.y, L = Math.hypot(dx, dy) || 1;
    const t = ((spec.blocker.x - cue.x) * dx + (spec.blocker.y - cue.y) * dy) / (L * L);
    const cross = Math.abs((spec.blocker.x - cue.x) * dy - (spec.blocker.y - cue.y) * dx) / L;
    if (cross > 0.25 || t < 0.12 || t > 0.88) throw new Error(`${spec.name} blocker is not between the balls`);
  }
  for (const extra of spec.traffic || []) balls.push(extra);
  const rails = spec.rails.map((r) => RAIL_NAME[r]).join(' → ');
  const tail = spec.second ? `${ballName(ob.id)} → ${ballName(spec.second.id)} → ${POCKET_NAME[spec.pocket]}` : (spec.pocket ? `${ballName(ob.id)} → ${POCKET_NAME[spec.pocket]}` : ballName(ob.id));
  spec.sequence = spec.sequence || `cue → ${rails} → ${tail}`;
  return finishShot(level, spec, balls, paths, spec.pocket ? [spec.pocket] : []);
}
function objectBank(level, spec) {
  const cue = { id: 'cue', ...spec.cue };
  const ob = { ...spec.ob };
  const feed = spec.feed || null;
  const balls = feed ? [cue, ob, feed] : [cue, ob];
  const hits = mirrorContacts(ob, pk(spec.pocket), spec.rails);
  if (!hits) throw new Error(`${spec.name} bank misses`);
  const dir = norm(sub(ob, hits[0]));
  const back = norm(sub(feed || cue, ob));
  if (Math.abs(back.x * dir.y - back.y * dir.x) > 0.04 || dot(back, dir) < 0.85) throw new Error(`${spec.name} is not full on the bank`);
  const paths = [{ ball: 'cue', points: [cue, feed || ob], rails: [] }];
  if (feed) paths.push({ ball: feed.id, points: [feed, ob], rails: [] });
  paths.push({ ball: ob.id, points: [ob, ...hits, pk(spec.pocket)], rails: spec.rails.slice(), pocket: spec.pocket });
  const rails = spec.rails.map((r) => RAIL_NAME[r]).join(' → ');
  spec.sequence = feed
    ? `cue → ${ballName(feed.id)} → ${ballName(ob.id)} → ${rails} → ${POCKET_NAME[spec.pocket]}`
    : `cue → ${ballName(ob.id)} → ${rails} → ${POCKET_NAME[spec.pocket]}`;
  return finishShot(level, spec, balls, paths, [spec.pocket]);
}
const along = (anchor, dir, dist, id, extra = {}) => ({ id, ...add(anchor, mul(norm(dir), dist)), ...extra });
function squareCarom(G, corner, side, cue) {
  const n = norm(sub(pk(corner), G));
  const T = norm(sub(pk(side), G));
  if (Math.abs(dot(n, T)) > 0.03) throw new Error('carom not square');
  const ob1 = add(G, mul(n, BALL_D));
  const ob2 = add(G, mul(T, DIAM));
  const v = norm(sub(G, cue));
  const tang = norm(sub(v, mul(n, dot(v, n))));
  if (len(sub(tang, T)) > 0.08) throw new Error('stun tangent missed');
  return { ob1, ob2, G };
}
const headCarom = squareCarom({ x: 25, y: 25 }, 'TL', 'TM', { x: 25, y: 37.5 });
const footCarom = squareCarom({ x: 75, y: 25 }, 'TR', 'TM', { x: 75, y: 37.5 });
function kissLayout() {
  const ob2 = { x: 75, y: 37.5 };
  const n = norm(sub(pk('BR'), ob2));
  const G = sub(ob2, mul(n, BALL_D));
  const perp = { x: -n.y, y: n.x };
  const v = norm(add(mul(n, 0.78), mul(perp, 0.45)));
  return { cue: sub(sub(G, mul(v, 16)), mul(v, 14)), ob1: sub(G, mul(v, 16)), ob2, G, end: add(G, mul(norm(sub(v, mul(n, dot(v, n)))), 12)) };
}
const kiss = kissLayout();
function cutLayout(side, dist) {
  const ob = { x: 37.5, y: 25 };
  const n = norm(sub(pk('BR'), ob));
  const G = sub(ob, mul(n, BALL_D));
  const perp = { x: -n.y * side, y: n.x * side };
  const v = norm(add(mul(n, 0.7), mul(perp, 0.55)));
  return { cue: sub(G, mul(v, dist)), ob, G, cross: v.x * n.y - v.y * n.x };
}
const cutRight = cutLayout(1, 20);
const cutLeft = cutLayout(-1, 20);
function cornerChain(count) {
  const into = norm({ x: -2, y: -1 });
  const nose = add(pk('BR'), mul(into, 8));
  const balls = [{ id: 1, ...nose, because: 'cluster', note: '8.00 inches from the foot-bottom corner along the pocket line, off the diamond grid so the stack can sit close enough to drive in together.' }];
  for (let i = 1; i < count; i++) {
    const prev = balls[i - 1];
    balls.push({ id: i + 1, ...add(prev, mul(into, BALL_D)), frozenTo: `${prev.id}-ball`, because: 'frozen', note: 'One ball-width farther from the pocket, off the diamond grid because the balls are FROZEN in a straight stack.' });
  }
  return balls;
}
const built = [];
const C = (level, spec) => built.push(combo(level, spec));
const R = (level, spec) => built.push(railShot(level, spec));
const B = (level, spec) => built.push(objectBank(level, spec));
const center = { vTips: 0, hTips: 0 };
const follow = { vTips: 0.5, hTips: 0, englishLabel: 'half a tip of follow' };
const draw = { vTips: -0.5, hTips: 0, englishLabel: 'half a tip of draw' };

C(1, { name: 'Side-Pocket Stack', skill: 'combination', pocket: 'BM', cue: { x: 50, y: 12.5 }, objs: [{ id: 1, x: 50, y: 25 }, { id: 2, x: 50, y: 37.5 }], speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. A full hit is the whole shot.', aim: 'Full hit on the 1-ball. The cue ball, both object balls, and the bottom side pocket are on one diamond line.' });
C(1, { name: 'Corner Combination', skill: 'combination', pocket: 'BR', cue: { x: 25, y: 12.5 }, objs: [{ id: 5, x: 50, y: 25 }, { id: 6, x: 75, y: 37.5 }], speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english.', aim: 'Full hit on the 5-ball. The same line runs through the 6-ball into the foot-bottom corner.' });
{
  const two = { x: 75, y: 37.5 };
  const one = along(two, { x: 50 - 75, y: 25 - 37.5 }, BALL_D, 1, { frozenTo: '2-ball', because: 'frozen', note: 'One ball-width back toward the cue ball along the pocket line, off the diamond grid because a frozen pair cannot both sit on diamond intersections.' });
  C(1, { name: 'Frozen Corner Pair', skill: 'combination', pocket: 'BR', cue: { x: 50, y: 25 }, objs: [one, { id: 2, ...two }], speed: 'Medium-Firm', stroke: 'Level stroke through both balls.', tip: center, english: 'Center ball. No english. The frozen pair is the trick.', aim: 'Full hit on the 1-ball. It is FROZEN to the 2-ball, and the 2-ball sits on the diamond lined up with the foot-bottom corner.', special: 'The 1-ball is FROZEN to the 2-ball. Do not leave a gap.', speedWhy: 'Medium-firm so the 2-ball still has speed after the frozen hit. Soft dies on the 1-ball.' });
}
R(1, { name: 'One-Rail to the Side', skill: 'kick', pocket: 'BM', rails: ['top'], cue: { x: 12.5, y: 25 }, ob: { id: 3, x: 37.5, y: 25 }, speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. The natural rebound is the shot.', aim: 'Kick the top long rail two diamonds out. The cue ball comes back through the 3-ball, and the 3-ball runs into the bottom side pocket.' });

C(2, { name: 'Three-Ball Corner Line', skill: 'combination', pocket: 'BR', cue: { x: 25, y: 12.5 }, objs: [{ id: 4, x: 50, y: 25 }, { id: 5, x: 75, y: 37.5 }, { id: 7, x: 87.5, y: 43.75 }], speed: 'Medium-Firm', stroke: 'Level, and finish the stroke.', tip: center, english: 'Center ball. No english.', aim: 'Full hit. The 7-ball is the half-diamond nearest the foot-bottom corner. The other two balls are on the same line.', speedWhy: 'Medium-firm because the hit travels through two balls before the 7-ball reaches the corner. Soft dies in the stack.' });
C(2, { name: 'Head-Side Combination', skill: 'combination', pocket: 'TM', cue: { x: 50, y: 37.5 }, objs: [{ id: 7, x: 50, y: 25 }, { id: 8, x: 50, y: 12.5 }], speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english.', aim: 'Full hit on the 7-ball. The 8-ball is one diamond from the top side pocket, on the center diamond line.' });
{
  const cue = { id: 'cue', x: 25, y: 37.5 };
  const ob1 = { id: 1, ...headCarom.ob1, because: 'contact', note: 'One ball-width off the diamond two out and two up, toward the head-top corner. Off the diamond grid because the stun contact sits one ball-width off the diamond you aim at.' };
  const ob2 = { id: 2, ...headCarom.ob2, because: 'contact', note: 'One diamond along the square line from that aim diamond toward the top side pocket. Off the diamond grid because a stun carom leaves on the tangent, not on a second diamond track.' };
  built.push(finishShot(2, { name: 'Square Stun Carom', skill: 'carom', aim: 'Aim the center of the cue ball at the diamond two out and two up. That point is one ball-width off the 1-ball. The 1-ball goes to the head-top corner. The cue ball leaves square into the 2-ball and the top side pocket.', tip: center, english: 'Center ball, stun. No follow and no draw.', englishWhy: 'With no english and a stun stroke, the cue ball keeps only the sideways part of the hit, so it leaves at 90 degrees. Follow would chase the 1-ball and miss the 2-ball.', speed: 'Medium', speedWhy: 'Medium. Too soft and the 2-ball dies. Too firm and the cue ball will not stun.', stroke: 'Stun. Stop the tip at the cue ball. Do not follow through.', sequence: 'cue → 1-ball → head-top corner, and the cue ball caroms square → 2-ball → top side pocket', objective: 'both', makeLabel: 'Both balls pocketed', aimMark: headCarom.G }, [cue, ob1, ob2], [
    { ball: 'cue', points: [cue, headCarom.G, ob2], rails: [] },
    { ball: 1, points: [ob1, pk('TL')], rails: [], pocket: 'TL' },
    { ball: 2, points: [ob2, pk('TM')], rails: [], pocket: 'TM' }
  ], ['TL', 'TM']));
}
{
  const cue = { id: 'cue', ...kiss.cue, because: 'contact', note: 'On the full-hit line into the 1-ball, off the diamond grid because that line is the cut into the kiss.' };
  const ob1 = { id: 1, ...kiss.ob1, because: 'contact', note: 'On the cut into the 2-ball, one ball-width off the 2-ball at contact. Off the diamond grid because the kiss contact is one ball-width off the 2-ball.' };
  const ob2 = { id: 2, ...kiss.ob2 };
  built.push(finishShot(2, { name: 'Tangent Kiss', skill: 'carom', aim: 'Full hit on the 1-ball. The 1-ball cuts the 2-ball into the foot-bottom corner and kisses off on the tangent. The 2-ball is the ball that has to go.', tip: center, english: 'Center ball. No english. The kiss is the cut, not the tip.', speed: 'Medium-Soft', speedWhy: 'Medium-soft so the 2-ball reaches the corner and does not rattle. Firm makes the kiss jump.', stroke: 'Level stroke. Let the 1-ball travel.', sequence: 'cue → 1-ball → 2-ball → foot-bottom corner. The 1-ball kisses off along the tangent.', makeLabel: '2-ball pocketed on the kiss', aimMark: kiss.G }, [cue, ob1, ob2], [
    { ball: 'cue', points: [cue, ob1], rails: [] },
    { ball: 1, points: [ob1, kiss.G, kiss.end], rails: [] },
    { ball: 2, points: [ob2, pk('BR')], rails: [], pocket: 'BR' }
  ], ['BR']));
}
{
  const pair = cornerChain(2);
  C(3, { name: 'Both in the Corner', skill: 'multiball', pocket: 'BR', cue: { x: 75, y: 37.5 }, objs: [pair[1], pair[0]], speed: 'Firm', stroke: 'Finish through the stack.', tip: follow, english: 'Half a tip of follow, so the second ball follows the first into the corner.', englishWhy: 'Center ball lets the back ball die. Follow keeps the stack moving.', aim: 'Full hit on the back ball. Both balls are FROZEN on the pocket line. The nose ball is 8 inches from the foot-bottom corner.', objective: 'both', makeLabel: 'Both balls pocketed', special: 'Both balls have to go. One ball in is a miss.', speedWhy: 'Firm, with follow. Two frozen balls this close to the corner both go if you finish the stroke. Soft pockets only the front ball.' });
}
{
  const nose = { id: 8, x: 50, y: 12.5 };
  const back = { id: 7, x: 50, y: 14.75, frozenTo: '8-ball', because: 'frozen', note: 'FROZEN one ball-width behind the 8-ball on the center diamond line.' };
  C(3, { name: 'Both in the Side', skill: 'multiball', pocket: 'TM', cue: { x: 50, y: 25 }, objs: [back, nose], speed: 'Firm', stroke: 'Follow through.', tip: follow, english: 'Half a tip of follow. No side english.', englishWhy: 'Follow is what makes the back ball chase the 8-ball into the side pocket.', aim: 'Full hit on the 7-ball. It is FROZEN to the 8-ball, and the 8-ball is one diamond from the top side pocket.', objective: 'both', makeLabel: 'Both balls pocketed', special: 'Both balls have to go.', speedWhy: 'Firm. The 8-ball is a full diamond from the pocket, so the frozen ball behind it needs speed to follow it in.' });
}
{
  const stack = cornerChain(3);
  C(3, { name: 'Corner Cluster', skill: 'multiball', pocket: 'BR', cue: { x: 75, y: 37.5 }, objs: [stack[2], stack[1], stack[0]], speed: 'Firm', stroke: 'A full finish. Do not baby it.', tip: follow, english: 'Half a tip of follow so the back balls chase the front ball.', aim: 'Full hit on the back ball. Three balls are FROZEN in a straight line. The nose ball is 8 inches from the foot-bottom corner.', objective: 'all', makeLabel: 'All three balls pocketed', special: 'All three have to go. Two is a miss.', speedWhy: 'Firm. Three frozen balls only stack in when the stroke gets through the whole cluster.' });
}
{
  const nose = { id: 1, x: 50, y: 12.5 };
  const mid = { id: 2, x: 50, y: 14.75, frozenTo: '1-ball', because: 'frozen', note: 'FROZEN one ball-width behind the 1-ball on the center diamond line.' };
  const back = { id: 3, x: 50, y: 17, frozenTo: '2-ball', because: 'frozen', note: 'FROZEN one ball-width behind the 2-ball on the center diamond line.' };
  C(3, { name: 'Three Down the Side', skill: 'multiball', pocket: 'TM', cue: { x: 50, y: 37.5 }, objs: [back, mid, nose], speed: 'Firm', stroke: 'Follow through the stack.', tip: follow, english: 'Half a tip of follow. Side english would throw the stack off the center line.', aim: 'Full hit on the 3-ball. All three are FROZEN on the center line. The 1-ball is one diamond from the top side pocket.', objective: 'all', makeLabel: 'All three balls pocketed', special: 'All three have to go.', speedWhy: 'Firm, with follow. The nose ball is a diamond from the pocket, so the two balls behind it need the cue to keep coming.' });
}
B(4, { name: 'Head-Rail Bank', skill: 'bank', pocket: 'TM', rails: ['left'], cue: { x: 62.5, y: 37.5 }, ob: { id: 4, x: 25, y: 25 }, speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. This is a natural one-rail bank, not a spin shot.', aim: 'Full hit on the 4-ball. It banks off the head short rail into the top side pocket.' });
{
  const ob = { x: 25, y: 25 }, cue = { x: 62.5, y: 37.5 };
  const feed = along(ob, sub(cue, ob), BALL_D, 1, { frozenTo: '2-ball', because: 'frozen', note: 'FROZEN to the 2-ball on the bank line, one ball-width toward the cue ball. Off the diamond grid because the frozen contact is one ball-width off the 2-ball.' });
  B(4, { name: 'Frozen into the Bank', skill: 'bank', pocket: 'TM', rails: ['left'], cue, ob: { id: 2, ...ob }, feed, speed: 'Medium-Firm', stroke: 'Level stroke through the frozen ball.', tip: center, english: 'Center ball. No english. The 1-ball is only there to be FROZEN into the banker.', aim: 'Full hit on the 1-ball. It is FROZEN to the 2-ball, and the 2-ball banks off the head short rail into the top side pocket.', special: 'The 1-ball is FROZEN to the 2-ball.', speedWhy: 'Medium-firm. The frozen hit takes speed off the 2-ball before the bank.' });
}
R(4, { name: 'Kick-Combo to the Side', skill: 'kick', pocket: 'BM', rails: ['top'], cue: { x: 12.5, y: 25 }, ob: { id: 3, x: 37.5, y: 25 }, second: { id: 6, x: 43.75, y: 37.5 }, speed: 'Medium-Firm', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english.', aim: 'Kick the top long rail two diamonds out. The cue ball hits the 3-ball full, and the 3-ball combinations the 6-ball into the bottom side pocket. The 6-ball is the half-diamond on that pocket line.', speedWhy: 'Medium-firm because the cue ball spends a rail before the combination starts.' });
R(4, { name: 'Rail First, up the Head', skill: 'kick', pocket: 'BM', rails: ['left'], cue: { x: 25, y: 12.5 }, ob: { id: 9, x: 25, y: 37.5 }, speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. The cue ball hits the head rail before it hits anything else.', aim: 'Both balls are two diamonds out. Kick the head short rail at two diamonds up. The cue ball comes back up that diamond, and the 9-ball goes into the bottom side pocket.', special: 'Rail first. Do not hit the 9-ball on the way to the rail.' });
R(5, { name: 'Short Z to the Side', skill: 'z', pocket: 'BM', rails: ['bottom', 'top'], cue: { x: 12.5, y: 37.5 }, ob: { id: 2, x: 37.5, y: 12.5 }, speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. The Z is the rail order, not a spin trick.', aim: 'Two long rails, bottom then top. The cue ball comes back through the 2-ball, and the 2-ball runs into the bottom side pocket.', special: 'A Z-shot uses both long rails, in that order. Missing a rail is a miss even if the ball falls.' });
R(5, { name: 'Long Z to the Corner', skill: 'z', pocket: 'BR', rails: ['bottom', 'top'], cue: { x: 12.5, y: 12.5 }, ob: { id: 4, x: 75, y: 12.5 }, speed: 'Firm', stroke: 'Finish the stroke so the cue ball can travel the long Z.', tip: follow, english: 'Half a tip of follow for distance. No side english. Follow does not change the center-ball rail line.', englishWhy: 'The Z is more than eight feet of cushion. Half a tip of follow keeps the cue ball from dying on the second rail. Side english would move the hit points off the line drawn here.', aim: 'Bottom long rail, then the top long rail, then the 4-ball into the foot-bottom corner. The 4-ball is six diamonds out, one diamond down.', speedWhy: 'Firm. A medium stroke dies between the second rail and the 4-ball.', special: 'Both long rails, in order. The follow is only for speed.' });
R(5, { name: 'Tight Z Through Traffic', skill: 'z', pocket: 'TM', rails: ['top', 'bottom'], cue: { x: 12.5, y: 12.5 }, ob: { id: 6, x: 37.5, y: 37.5 }, traffic: [
  { id: 3, x: 62.5, y: 25, note: 'Traffic. Do not hit it. It sits five diamonds out, on the center line, clear of the Z.' },
  { id: 5, x: 50, y: 12.5, note: 'Traffic. Do not hit it. Four diamonds out, one diamond down from the top cushion.' }
], speed: 'Medium-Firm', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. The traffic is only there to make the window look smaller.', aim: 'Top long rail first, then the bottom long rail, then the 6-ball into the top side pocket. The 3-ball and the 5-ball are not part of the hit.', speedWhy: 'Medium-firm so the cue ball still has speed after two rails and still does not fly through the traffic.', special: 'Hitting either traffic ball is a miss.' });
R(5, { name: 'Z Around the Blocker', skill: 'z', pocket: 'TR', rails: ['top', 'bottom'], cue: { x: 12.5, y: 37.5 }, ob: { id: 9, x: 75, y: 37.5 }, blocker: { id: 8, x: 50, y: 37.5, note: 'Blocker. It sits on the straight line between the cue ball and the 9-ball, four diamonds out. The Z goes around it.' }, speed: 'Firm', stroke: 'Finish through the cue ball.', tip: follow, english: 'Half a tip of follow for the long Z. No side english, because side english would move the track off the line that clears the 8-ball.', englishWhy: 'The 8-ball blocks the straight shot. The Z uses the top rail then the bottom rail. Follow only keeps the cue ball moving. It does not steer it.', aim: 'Top long rail, then the bottom long rail, around the 8-ball, then the 9-ball into the foot-top corner.', speedWhy: 'Firm. The Z is long, and the 9-ball still has to reach the corner.', special: 'Do not hit the 8-ball. A ball that goes straight into the 8-ball is the wrong shot.' });

C(6, { name: 'Stun the Side Pocket', skill: 'draw', pocket: 'BM', cue: { x: 50, y: 12.5 }, objs: [{ id: 1, x: 50, y: 37.5 }], speed: 'Medium-Soft', stroke: 'Stun. The tip stops at the cue ball.', tip: center, english: 'Center ball, stun. No follow and no draw.', englishWhy: 'A firm hit with follow sends the cue ball down after the 1-ball and it scratches or rolls out of the stop. Stun leaves it where it hits.', aim: 'Full hit on the 1-ball. It is one diamond from the bottom side pocket, on the center line.', speedWhy: 'Medium-soft. Firm will not stun. Too soft and the 1-ball does not reach the side pocket.', bonus: { label: 'Cue ball stayed in the stop zone', zone: { x: 50, y: 35.25, r: 3.2, label: 'stop' } } });
C(6, { name: 'Follow to the Zone', skill: 'draw', pocket: 'BM', cue: { x: 50, y: 12.5 }, objs: [{ id: 2, x: 50, y: 25 }], speed: 'Medium', stroke: 'Follow through the cue ball.', tip: follow, english: 'Half a tip of follow. No side english.', englishWhy: 'Follow is what carries the cue ball past the 2-ball toward the bottom of the table. Stun would stop it on the object ball.', aim: 'Full hit on the 2-ball, two diamonds up from the bottom, on the center line. Pocket the 2-ball and let the cue ball follow toward the bottom.', speedWhy: 'Medium. Soft follow never reaches the zone. Firm follow scratches in the bottom side.', bonus: { label: 'Cue ball reached the follow zone', zone: { x: 50, y: 34, r: 4, label: 'follow' } } });
C(6, { name: 'Draw Back from the Top', skill: 'draw', pocket: 'TM', cue: { x: 50, y: 37.5 }, objs: [{ id: 3, x: 50, y: 25 }], speed: 'Medium-Firm', stroke: 'A smooth draw. Do not jab.', tip: draw, english: 'Half a tip of draw. No side english.', englishWhy: 'Draw is the only way the cue ball comes back toward the bottom after a full hit. Follow would chase the 3-ball into the side pocket.', aim: 'Full hit on the 3-ball. It goes into the top side pocket. The cue ball draws back down the center line.', speedWhy: 'Medium-firm. Soft draw does not come back. A jab sends the cue ball off the line.', bonus: { label: 'Cue ball drew back into the zone', zone: { x: 50, y: 43.75, r: 3.5, label: 'draw' } } });
C(6, { name: 'Short Draw to the Corner', skill: 'draw', pocket: 'BR', cue: { x: 75, y: 37.5 }, objs: [{ id: 4, x: 87.5, y: 43.75 }], speed: 'Medium-Soft', stroke: 'A short draw. The ball is close.', tip: draw, english: 'Half a tip of draw. No side english.', englishWhy: 'The 4-ball is only a short cut from the corner. Draw pulls the cue ball back off the pocket instead of following it in.', aim: 'Full hit on the 4-ball. It sits on the half-diamond nearest the foot-bottom corner.', speedWhy: 'Medium-soft. The object ball is close to the pocket, so firm draw makes the cue ball jump or scratch.', bonus: { label: 'Cue ball drew short of the corner', zone: { x: 68, y: 34, r: 3.5, label: 'draw' } } });

{
  const s = cutRight;
  const cue = { id: 'cue', ...s.cue, because: 'contact', note: 'On the outside-english cut line, off the diamond grid because the ghost ball sits one ball-width off the object ball.' };
  const ob = { id: 2, ...s.ob };
  built.push(finishShot(7, { name: 'Outside English on the Cut', skill: 'english', aim: 'Hit the 2-ball on the side that sends it to the foot-bottom corner. One tip of right is outside english on this cut: the 2-ball is going to the right of the cue-ball path, so right english throws it less and keeps it on the line drawn here.', tip: { vTips: 0, hTips: 1, englishLabel: 'one tip of right, outside' }, english: 'One tip of right. That is outside english on this cut.', englishWhy: 'The object ball leaves to the right of the cue path, so the right side of the cue ball is the outside. Inside english, one tip of left, would throw the 2-ball off the ghost line and away from the corner. Do not use inside english to "help" this line.', speed: 'Medium', stroke: 'Level stroke. Let the outside english throw less, not more.', sequence: 'cue → 2-ball → foot-bottom corner', speedWhy: 'Medium. Firm with a full tip of english makes the cue ball skid off the cut.', aimMark: s.G }, [cue, ob], [
    { ball: 'cue', points: [cue, ob], rails: [] },
    { ball: 2, points: [ob, pk('BR')], rails: [], pocket: 'BR' }
  ], ['BR']));
}
{
  const s = cutLeft;
  const cue = { id: 'cue', ...s.cue, because: 'contact', note: 'On the outside-english cut line from the other side, off the diamond grid because the ghost ball sits one ball-width off the object ball.' };
  const ob = { id: 3, ...s.ob };
  built.push(finishShot(7, { name: 'Outside from the Other Side', skill: 'english', aim: 'The 3-ball goes to the left of the cue-ball path into the foot-bottom corner. One tip of left is outside english here. The other tip, right, is inside and would throw the 3-ball off the line.', tip: { vTips: 0, hTips: -1, englishLabel: 'one tip of left, outside' }, english: 'One tip of left. That is outside english from this side.', englishWhy: 'Outside is the side the object ball is already going. Left english throws it less. Right english is inside on this cut and pushes the 3-ball off the ghost line, so the pocket drawn here is missed.', speed: 'Medium', stroke: 'Level stroke.', sequence: 'cue → 3-ball → foot-bottom corner', speedWhy: 'Medium, for the same reason as the other outside cut. A full tip plus firm speed skids.', aimMark: s.G }, [cue, ob], [
    { ball: 'cue', points: [cue, ob], rails: [] },
    { ball: 3, points: [ob, pk('BR')], rails: [], pocket: 'BR' }
  ], ['BR']));
}
R(7, { name: 'Running Opens the Rail', skill: 'english', rails: ['bottom'], cue: { x: 12.5, y: 25 }, ob: { id: 7, x: 62.5, y: 12.5 }, aimAt: { x: 62.5, y: 25 }, speed: 'Medium', stroke: 'Level stroke with running english.', tip: { vTips: 0, hTips: 1, englishLabel: 'one tip of right, running' }, english: 'One tip of right. Traveling toward the foot, right english is running.', englishWhy: 'Center ball comes off the bottom rail and returns along the center line, which misses the 7-ball. The 7-ball is one diamond up from that natural line. Running english opens the rebound so the cue ball climbs to the 7-ball. The 7-ball does not have to go in a pocket. Make means you hit it.', aim: 'Aim the natural, center-ball kick at the diamond five out on the center line. Running english opens that rebound up to the 7-ball, which is one diamond above that diamond.', objective: 'contact', makeLabel: 'Cue ball hit the 7-ball', missLabel: 'Missed the 7-ball', special: 'The make is hitting the 7-ball. Pocketing it is not the shot, and the path does not run into a pocket.' });
R(7, { name: 'Reverse Holds the Rail', skill: 'english', rails: ['bottom'], cue: { x: 12.5, y: 12.5 }, ob: { id: 8, x: 62.5, y: 25 }, aimAt: { x: 62.5, y: 12.5 }, speed: 'Medium', stroke: 'Level stroke with reverse english.', tip: { vTips: 0, hTips: -1, englishLabel: 'one tip of left, reverse' }, english: 'One tip of left. Traveling toward the foot, left english is reverse.', englishWhy: 'The natural center-ball rebound comes back along the line one diamond down and misses high of the 8-ball. Reverse holds the rebound down onto the center line, where the 8-ball sits. Make means the cue ball hits the 8-ball. There is no pocket on this shot.', aim: 'Aim the natural kick at the diamond five out, one diamond down. Reverse english holds the rebound onto the 8-ball at five diamonds out on the center line.', objective: 'contact', makeLabel: 'Cue ball hit the 8-ball', missLabel: 'Missed the 8-ball', special: 'The make is hitting the 8-ball. Do not chase a pocket.' });

{
  const cue = { id: 'cue', x: 50, y: 12.5 };
  const ob = { id: 1, x: 50, y: 37.5 };
  const left = { id: 4, x: 47, y: 25, note: 'Window ball, on the center diamond line, 3.00 inches left of the pocket line. Do not hit it.' };
  const right = { id: 5, x: 53, y: 25, note: 'Window ball, on the center diamond line, 3.00 inches right of the pocket line. Do not hit it. The gap between the window balls is 3.75 inches.' };
  built.push(finishShot(8, {
    name: 'Tight Center Window', skill: 'precision',
    aim: 'Full hit on the 1-ball through the window. The 4-ball and the 5-ball sit on the center diamond line, 3 inches off the pocket line. The gap between those two balls is 3.75 inches.',
    tip: center, english: 'Center ball. No english. English would throw you into a window ball.',
    englishWhy: 'Any side english moves the cue ball off the center line and into a window ball. The window is the shot.',
    speed: 'Medium-Soft', speedWhy: 'Medium-soft. Firm makes a small throw and clips a window ball.',
    stroke: 'A smooth center-ball stroke. Do not steer it.',
    sequence: 'cue → 1-ball → bottom side pocket',
    special: 'Hitting either window ball is a miss. The gap is 3.75 inches between the balls.'
  }, [cue, ob, left, right], [
    { ball: 'cue', points: [cue, ob], rails: [] },
    { ball: 1, points: [ob, pk('BM')], rails: [], pocket: 'BM' }
  ], ['BM']));
}
R(8, { name: 'Around the Eight', skill: 'precision', pocket: 'BM', rails: ['top'], cue: { x: 12.5, y: 25 }, ob: { id: 3, x: 37.5, y: 25 }, blocker: { id: 8, x: 25, y: 25, note: 'Blocker on the straight line, two diamonds out. Not frozen to anything. The kick goes over it.' }, speed: 'Medium', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english.', englishWhy: 'The 8-ball blocks the straight shot. The top rail is the way around it. Side english would move the rebound off the 3-ball.', aim: 'Kick the top long rail two diamonds out, over the 8-ball. The cue ball comes back through the 3-ball and the 3-ball runs into the bottom side pocket.', special: 'Do not hit the 8-ball. It is not frozen to the cue ball or the 3-ball.' });
{
  const cue = { id: 'cue', x: 50, y: 12.5 };
  const ob = { id: 1, x: 50, y: 37.5 };
  const zone = { x: 50, y: 35.25, r: 2.5, label: 'stop' };
  built.push(finishShot(8, {
    name: 'Stop in the Small Zone', skill: 'precision',
    aim: 'Full hit on the 1-ball into the bottom side pocket, and stop the cue ball inside the small zone just short of the 1-ball.',
    tip: center, english: 'Center ball, stun. The zone is required.',
    englishWhy: 'Only a stun stroke stops the cue ball in that small circle. Follow rolls through it. Draw comes back out of it.',
    speed: 'Medium-Soft', speedWhy: 'Medium-soft is the stun speed for a full hit at this distance. Firm will not stop. Soft will not pocket the 1-ball.',
    stroke: 'Stun. Stop the tip at the cue ball.',
    sequence: 'cue → 1-ball → bottom side pocket, cue ball stays in the stop zone',
    objective: 'pocket-and-zone',
    makeLabel: 'Pocketed, cue ball in the zone',
    missLabel: 'Missed the pocket or the zone',
    special: 'The 1-ball in the pocket is not enough. The cue ball has to finish inside the small zone. Pocket without the zone is a miss.',
    zone
  }, [cue, ob], [
    { ball: 'cue', points: [cue, ob], rails: [] },
    { ball: 1, points: [ob, pk('BM')], rails: [], pocket: 'BM' }
  ], ['BM']));
}
{
  const s = cutLayout(1, 16);
  const cue = { id: 'cue', ...s.cue, because: 'contact', note: 'On the center-ball cut line, closer than the english cut, off the diamond grid because the ghost ball is one ball-width off the object ball.' };
  const ob = { id: 6, ...s.ob };
  built.push(finishShot(8, {
    name: 'Thin Cut, Center Ball', skill: 'precision',
    aim: 'Center-ball cut on the 6-ball into the foot-bottom corner. No english to hide a miss. The ghost ball is one ball-width off the 6-ball toward the pocket line.',
    tip: center, english: 'Center ball. No english.',
    englishWhy: 'This cut is short enough to pocket with a center-ball hit. Adding english would hide whether the aim was right, so the shot forbids it.',
    speed: 'Medium-Soft', speedWhy: 'Medium-soft. The cut is thin and the pocket is a corner, so firm rattles it out.',
    stroke: 'Level, smooth, center ball.',
    sequence: 'cue → 6-ball → foot-bottom corner',
    special: 'Any english is the wrong shot. Center ball only.',
    aimMark: s.G
  }, [cue, ob], [
    { ball: 'cue', points: [cue, ob], rails: [] },
    { ball: 6, points: [ob, pk('BR')], rails: [], pocket: 'BR' }
  ], ['BR']));
}

R(9, { name: 'Three-Rail to the Side', skill: 'kick', pocket: 'TM', rails: ['top', 'left', 'bottom'], cue: { x: 25, y: 12.5 }, ob: { id: 2, x: 25, y: 37.5 }, speed: 'Firm', stroke: 'Finish the stroke.', tip: follow, english: 'Half a tip of follow for the three-rail distance. No side english.', englishWhy: 'Three rails is a long trip. Follow keeps the cue ball moving. Side english would move all three hit points, so this line is center-ball plus follow only.', aim: 'Top long rail, then the head short rail, then the bottom long rail, then the 2-ball into the top side pocket. Both balls are two diamonds out.', speedWhy: 'Firm. Three rails plus the 2-ball still has to reach the side pocket.', special: 'Show Solution lists three cushions, in order.' });
{
  const ob = { id: 3, x: 37.5, y: 25 };
  const second = along(ob, sub(pk('BM'), ob), BALL_D, 6, { frozenTo: '3-ball', because: 'frozen', note: 'FROZEN to the 3-ball on the line into the bottom side pocket, one ball-width closer to the pocket. Off the diamond grid because the frozen contact is one ball-width off the 3-ball.' });
  R(9, { name: 'Kick the Frozen Pair', skill: 'kick', pocket: 'BM', rails: ['top'], cue: { x: 12.5, y: 25 }, ob, second, speed: 'Firm', stroke: 'Follow through after the rail.', tip: follow, english: 'Half a tip of follow so the second ball chases the first into the side pocket.', englishWhy: 'The kick is a center-ball rail line. Follow is only so both frozen balls reach the pocket. Side english would miss the 3-ball.', aim: 'Kick the top long rail two diamonds out. The cue ball hits the 3-ball, which is FROZEN to the 6-ball on the pocket line. Both object balls have to go.', objective: 'both', makeLabel: 'Both object balls pocketed', special: 'Both object balls have to go. The 6-ball is FROZEN to the 3-ball.', speedWhy: 'Firm, with follow. The cue ball spends a rail, then still has to drive two frozen balls.' });
}
R(9, { name: 'Head-and-Bottom to the Corner', skill: 'kick', pocket: 'TR', rails: ['left', 'bottom'], cue: { x: 12.5, y: 25 }, ob: { id: 5, x: 62.5, y: 25 }, speed: 'Medium-Firm', stroke: 'Level stroke.', tip: center, english: 'Center ball. No english. Head rail first, then the bottom long rail. This is not a Z-shot: a Z uses the two long rails.', aim: 'Head short rail, then the bottom long rail, then the 5-ball into the foot-top corner. The 5-ball is five diamonds out on the center line.', speedWhy: 'Medium-firm. Two rails, and the 5-ball still crosses to the far corner.' });
{
  const cue = { id: 'cue', x: 75, y: 37.5 };
  const ob1 = { id: 1, ...footCarom.ob1, because: 'contact', note: 'One ball-width off the diamond six out and two up, toward the foot-top corner. Off the diamond grid because the stun contact sits one ball-width off the diamond you aim at.' };
  const ob2 = { id: 2, ...footCarom.ob2, because: 'contact', note: 'One diamond along the square line from that aim diamond toward the top side pocket. Off the diamond grid because a stun carom leaves on the tangent.' };
  built.push(finishShot(9, {
    name: 'Foot-Side Square Carom', skill: 'carom',
    aim: 'Aim at the diamond six out and two up. The 1-ball is one ball-width off that diamond toward the foot-top corner. The cue ball stuns square into the 2-ball and the top side pocket.',
    tip: center, english: 'Center ball, stun. No follow and no draw.',
    englishWhy: 'Stun is what makes the cue ball leave at 90 degrees. Follow would follow the 1-ball into the corner and miss the 2-ball.',
    speed: 'Medium', speedWhy: 'Medium, so the 2-ball reaches the side pocket and the cue ball still stuns.',
    stroke: 'Stun. Stop the tip at the cue ball.',
    sequence: 'cue → 1-ball → foot-top corner, and the cue ball caroms square → 2-ball → top side pocket',
    objective: 'both', makeLabel: 'Both balls pocketed', aimMark: footCarom.G
  }, [cue, ob1, ob2], [
    { ball: 'cue', points: [cue, footCarom.G, ob2], rails: [] },
    { ball: 1, points: [ob1, pk('TR')], rails: [], pocket: 'TR' },
    { ball: 2, points: [ob2, pk('TM')], rails: [], pocket: 'TM' }
  ], ['TR', 'TM']));
}

if (built.length !== 36) throw new Error(`expected 36 shots, got ${built.length}`);
const byLevel = {};
for (const shot of built) (byLevel[shot.level] ||= []).push(shot);
for (let n = 1; n <= 9; n++) if ((byLevel[n] || []).length !== 4) throw new Error(`level ${n} has ${(byLevel[n] || []).length}`);

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
  id,
  stars: starsFor(id),
  title: {
    1: 'Trick Shot Fundamentals', 2: 'Combinations & Caroms', 3: 'Multi-Ball',
    4: 'Bank & Kick Tricks', 5: 'Z-Shots & Multi-Rail', 6: 'Draw, Follow & Stun',
    7: 'Spin & English', 8: 'Advanced Precision', 9: 'Showpiece Trick Shots'
  }[id],
  blurb: {
    1: 'Simple combinations, a frozen pair, and one easy rail.',
    2: 'Three-ball lines, a square stun carom, and a tangent kiss.',
    3: 'Pocket two balls, then three, frozen in a straight stack.',
    4: 'Bank combinations and kick combinations. These are trick shots, not the banking course.',
    5: 'Every shot is a Z. Show Solution lists the cushions in order.',
    6: 'Stun, follow, and draw, with a cue-ball zone that can add a point.',
    7: 'Why the english changes the shot, including the tip that would miss.',
    8: 'A tight window, a blocker, a required stop zone, and a thin center-ball cut.',
    9: 'Three rails, a frozen kick, a two-rail corner, and the foot-side carom.'
  }[id],
  shots: byLevel[id]
}));

const EXAM_NAMES = ['Three-Ball Corner Line', 'Square Stun Carom', 'Corner Cluster', 'Head-Rail Bank', 'Kick-Combo to the Side', 'Long Z to the Corner', 'Draw Back from the Top', 'Outside English on the Cut'];
export const EXAM_SHOTS = EXAM_NAMES.map((name) => {
  const shot = built.find((s) => s.name === name);
  if (!shot) throw new Error(`exam shot missing: ${name}`);
  return shot;
});
const EXAM_SKILLS = ['combination', 'carom', 'multiball', 'bank', 'kick', 'z', 'draw', 'english'];
EXAM_SHOTS.forEach((s, i) => { if (s.skill !== EXAM_SKILLS[i]) throw new Error(`exam skill ${s.name} is ${s.skill}`); });

export function allShots() { return LEVELS.flatMap((l) => l.shots); }
export function findShot(levelId, index) { return LEVELS.find((l) => l.id === Number(levelId))?.shots[index] || null; }
export function maxScore(shots) {
  return shots.reduce((sum, shot) => sum + TRICK_SCORE.attemptPoints[1] * TRICK_SCORE.makesRequired + (shot.bonus ? TRICK_SCORE.bonusPoints * TRICK_SCORE.makesRequired : 0), 0);
}

/** Points for one make. attemptInCycle is 1, 2, or 3. A 4th try in the cycle scores 0 and the cycle still counts as a make. */
export function pointsForMake(attemptInCycle) {
  const n = Number(attemptInCycle) || 0;
  if (n <= 0) return 0;
  return TRICK_SCORE.attemptPoints[n] ?? 0;
}

export const PASS_RULE = 'Make each shot 3 times. Misses do not fail the level.';

export function blankCourse() {
  return { levels: {}, exam: null, current: null };
}
export function readCourse(state) {
  const raw = state?.[STORAGE_KEY];
  if (!raw || typeof raw !== 'object') return blankCourse();
  const copy = typeof structuredClone === 'function' ? structuredClone(raw) : JSON.parse(JSON.stringify(raw));
  return {
    levels: copy.levels && typeof copy.levels === 'object' ? copy.levels : {},
    exam: copy.exam || null,
    current: copy.current || null
  };
}
function withCourse(state, course) {
  return { ...state, [STORAGE_KEY]: course };
}
export function levelRecord(state, levelId) {
  return readCourse(state).levels[String(levelId)] || null;
}
export function levelPassed(state, levelId) {
  const rec = levelRecord(state, levelId);
  return !!(rec && rec.passed);
}
export function levelUnlocked(state, levelId) {
  const id = Number(levelId);
  if (id <= 1) return true;
  return levelPassed(state, id - 1);
}
export function examUnlocked(state) {
  return LEVELS.every((l) => levelPassed(state, l.id));
}
export function bestScore(state, levelId) {
  return Number(levelRecord(state, levelId)?.best) || 0;
}
export function examBest(state) {
  return Number(readCourse(state).exam?.best) || 0;
}

/**
 * Apply one attempt to a live run.
 * run.shots[i] = { makes: [{ points, bonus, cycle }], attempts: ['make'|'miss', ...] }
 * A shot is done when makes.length >= 3. Misses never finish it and never fail the level.
 */
export function applyAttempt(run, shotIndex, result, bonus) {
  const slot = run.shots[shotIndex];
  if (!slot || slot.makes.length >= TRICK_SCORE.makesRequired) return run;
  const kind = result === 'make' ? 'make' : 'miss';
  slot.attempts.push(kind);
  if (kind === 'miss') return run;
  const misses = slot.attempts.filter((a) => a === 'miss').length;
  const priorMakes = slot.makes.length;
  // misses since the previous make
  let since = 0;
  for (let i = slot.attempts.length - 2; i >= 0; i--) {
    if (slot.attempts[i] === 'make') break;
    since += 1;
  }
  const cycle = since + 1;
  const points = cycle > 3 ? 0 : pointsForMake(cycle);
  slot.makes.push({ points, bonus: bonus ? TRICK_SCORE.bonusPoints : 0, cycle, attempt: slot.attempts.length });
  void priorMakes;
  void misses;
  return run;
}
export function shotDone(slot) {
  return (slot?.makes?.length || 0) >= TRICK_SCORE.makesRequired;
}
export function runComplete(run) {
  return !!run && run.shots.every(shotDone);
}
export function scoreRun(run) {
  let score = 0;
  let makes = 0;
  let attempts = 0;
  let first = 0, second = 0, third = 0, later = 0, bonus = 0;
  const hadMiss = [];
  run.shots.forEach((slot, i) => {
    attempts += slot.attempts.length;
    makes += slot.makes.length;
    if (slot.attempts.some((a) => a === 'miss')) hadMiss.push(i);
    for (const m of slot.makes) {
      score += m.points + (m.bonus || 0);
      bonus += m.bonus || 0;
      if (m.cycle === 1) first += 1;
      else if (m.cycle === 2) second += 1;
      else if (m.cycle === 3) third += 1;
      else later += 1;
    }
  });
  return { score, makes, attempts, first, second, third, later, bonus, hadMiss, rate: attempts ? makes / attempts : 0 };
}

function stampResult(prev, scored, run) {
  const before = prev || { best: 0, passed: false, history: [] };
  return {
    ...before,
    passed: true,
    best: Math.max(Number(before.best) || 0, scored.score),
    lastScore: scored.score,
    lastAttempts: run.shots.map((s) => s.attempts.slice()),
    last: { score: scored.score, attempts: scored.attempts, first: scored.first, second: scored.second, third: scored.third, later: scored.later, bonus: scored.bonus, makes: scored.makes },
    history: [...(before.history || []), { score: scored.score, attempts: scored.attempts, at: Date.now() }].slice(-12)
  };
}
export function saveLevelResult(state, levelId, run) {
  const course = readCourse(state);
  const key = String(levelId);
  const scored = scoreRun(run);
  course.levels[key] = stampResult(course.levels[key], scored, run);
  return withCourse(state, course);
}
export function saveExamResult(state, run) {
  const course = readCourse(state);
  const scored = scoreRun(run);
  course.exam = { ...stampResult(course.exam, scored, run), attempts: scored.attempts };
  return withCourse(state, course);
}

export function shotsInRun(cur) {
  if (!cur) return [];
  const pool = (cur.mode === 'exam' || cur.parent === 'exam') ? EXAM_SHOTS : (LEVELS.find((l) => l.id === Number(cur.level))?.shots || []);
  return cur.order.map((i) => pool[i]).filter(Boolean);
}
export function runMax(cur) { return maxScore(shotsInRun(cur)); }

export function beginTrick(state, spec) {
  const course = readCourse(state);
  course.current = {
    mode: spec.mode,
    level: spec.level || 0,
    parent: spec.parent || null,
    order: spec.order.slice(),
    cursor: 0,
    view: 0,
    phase: 'play',
    shots: spec.order.map(() => ({ makes: [], attempts: [] })),
    summary: null,
    undoSave: null
  };
  return withCourse(state, course);
}
export function startLevel(state, levelId) {
  const id = Number(levelId);
  if (!levelUnlocked(state, id)) return state;
  const cur = readCourse(state).current;
  if (cur && Number(cur.level) === id && (cur.mode === 'level' || (cur.mode === 'practice' && cur.parent === 'level'))) return state;
  return beginTrick(state, { mode: 'level', level: id, order: [0, 1, 2, 3] });
}
export function startExam(state) {
  if (!examUnlocked(state)) return state;
  const cur = readCourse(state).current;
  if (cur && (cur.mode === 'exam' || (cur.mode === 'practice' && cur.parent === 'exam'))) return state;
  return beginTrick(state, { mode: 'exam', level: 0, order: EXAM_SHOTS.map((_, i) => i) });
}
function finalizeTrick(state, course) {
  const cur = course.current;
  cur.undoSave = {
    levels: typeof structuredClone === 'function' ? structuredClone(course.levels) : JSON.parse(JSON.stringify(course.levels)),
    exam: course.exam ? (typeof structuredClone === 'function' ? structuredClone(course.exam) : JSON.parse(JSON.stringify(course.exam))) : null
  };
  const scored = scoreRun(cur);
  const names = shotsInRun(cur);
  cur.summary = { ...scored, max: runMax(cur), passed: true, missNames: scored.hadMiss.map((i) => names[i]?.name).filter(Boolean) };
  cur.phase = 'results';
  let next = withCourse(state, course);
  if (cur.mode === 'level') next = saveLevelResult(next, cur.level, cur);
  else if (cur.mode === 'exam') next = saveExamResult(next, cur);
  const saved = readCourse(next);
  saved.current = course.current;
  return withCourse(next, saved);
}
export function trickTap(state, result, bonus) {
  const course = readCourse(state);
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return state;
  const slot = cur.shots[cur.cursor];
  if (!slot || shotDone(slot)) return state;
  applyAttempt(cur, cur.cursor, result, !!bonus);
  if (shotDone(slot)) {
    if (cur.cursor + 1 >= cur.shots.length) return finalizeTrick(state, course);
    cur.cursor += 1;
    cur.view = cur.cursor;
  }
  return withCourse(state, course);
}
export function trickUndo(state) {
  const course = readCourse(state);
  const cur = course.current;
  if (!cur) return state;
  if (cur.phase === 'results') {
    if (cur.undoSave) {
      course.levels = cur.undoSave.levels;
      course.exam = cur.undoSave.exam;
    }
    cur.phase = 'play';
    cur.summary = null;
    cur.undoSave = null;
    cur.cursor = cur.shots.length - 1;
    cur.view = cur.cursor;
  }
  let slot = cur.shots[cur.cursor];
  if (!slot?.attempts?.length) {
    if (cur.cursor === 0) return withCourse(state, course);
    cur.cursor -= 1;
    cur.view = cur.cursor;
    slot = cur.shots[cur.cursor];
  }
  const last = slot.attempts.pop();
  if (last === 'make') slot.makes.pop();
  return withCourse(state, course);
}
export function trickView(state, index) {
  const course = readCourse(state);
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return state;
  const i = Number(index);
  if (i < 0 || i > cur.cursor) return state;
  cur.view = i;
  return withCourse(state, course);
}
export function trickPractice(state) {
  const course = readCourse(state);
  const cur = course.current;
  if (!cur?.summary) return state;
  const order = (cur.summary.hadMiss || []).map((i) => cur.order[i]);
  if (!order.length) return state;
  const parent = cur.mode === 'practice' ? cur.parent : cur.mode;
  return beginTrick(state, { mode: 'practice', level: cur.level, order, parent });
}
export function trickReplay(state) {
  const course = readCourse(state);
  const cur = course.current;
  if (!cur) return state;
  const exam = cur.mode === 'exam' || cur.parent === 'exam';
  const level = cur.level;
  course.current = null;
  const cleared = withCourse(state, course);
  return exam ? startExam(cleared) : startLevel(cleared, level);
}

const BALL_COLOR = { cue: 'var(--ball-cue)', 1: '#e6b422', 2: '#2456c9', 3: '#d23a3a', 4: '#6b3fa0', 5: '#e07a2f', 6: '#2f8f4e', 7: '#8b1e1e', 8: '#222', 9: '#e6b422' };
function ballFill(id) { return id === 'cue' ? 'var(--ball-cue, #f4f0e6)' : (BALL_COLOR[id] || '#888'); }

export function diagramSpec(shot, { solution = false } = {}) {
  const balls = shot.balls.map((b) => ({ id: b.id, x: b.x, y: b.y, fill: ballFill(b.id), label: b.id === 'cue' ? '' : String(b.id) }));
  const spec = { balls, grid: true, pockets: true, targetPockets: shot.pockets };
  if (shot.zone) spec.zone = shot.zone;
  if (solution) {
    spec.paths = shot.paths.map((p) => ({ points: p.points, dashed: p.ball !== 'cue', width: p.ball === 'cue' ? 1.4 : 1.1 }));
  } else if (shot.aimMark) {
    spec.paths = [{ points: [shot.balls[0], shot.aimMark], dashed: true, width: 1 }];
  }
  return spec;
}
export function diagramHTML(shot, opts) {
  return renderTableDiagram(diagramSpec(shot, opts));
}
export function setupHTML(shot) {
  const lines = shot.lines.map((line) => `<li>${esc(line)}</li>`);
  const gaps = (shot.gaps || []).map((g) => `<li>${esc(g)}</li>`);
  return `<div class="kickTip"><b>Setup, always on the table before you shoot.</b><ul>${lines.join('')}${gaps.join('')}</ul>${shot.special ? `<p>${esc(shot.special)}</p>` : ''}</div>`;
}
export function cueGraphicHTML(shot) {
  const tip = shot.tip || { vTips: 0, hTips: 0 };
  const words = tipWords(tip);
  return `<figure class="trickCue">${cueBallSVG({ vTips: tip.vTips, hTips: tip.hTips, label: words.english })}<figcaption>${esc(words.cue)}. ${esc(shot.english)}</figcaption></figure>`;
}
export function solutionText(shot) {
  const rails = [];
  for (const path of shot.paths) {
    const who = path.ball === 'cue' ? 'Cue ball' : `${path.ball}-ball`;
    const hits = (path.rails || []).map((r) => RAIL_SHORT[r]).join(' → ');
    const pocket = path.pocket ? ` → ${POCKET_NAME[path.pocket] || path.pocket}` : '';
    rails.push(hits ? `${who}: ${hits}${pocket}` : `${who}${pocket}`);
  }
  return `${shot.sequence}. ${rails.join('. ')}.`;
}
export function howToHTML(shot) {
  const steps = [
    ['Place the balls', shot.lines.join(' ')],
    ['Aim', shot.aim],
    ['Cue ball', `${tipWords(shot.tip).cue}. ${shot.english}${shot.englishWhy ? ' ' + shot.englishWhy : ''}`],
    ['Speed', `${shot.speed}. ${shot.speedWhy || ''} ${shot.stroke || ''}`.trim()],
    ['Pocket', shot.objective === 'contact' ? shot.special : `The make is ${shot.makeLabel.toLowerCase()}. ${shot.special || ''}`.trim()]
  ];
  const body = steps.map(([h, t], i) => `<li class="step"><span class="stepHead">${i + 1}. ${esc(h)}</span><p>${esc(t)}</p></li>`).join('');
  return `<details class="gameSteps"><summary>How to shoot it</summary><ol>${body}</ol><p><b>Show Solution</b> draws ${esc(solutionText(shot))}</p></details>`;
}


export function trickProgressRows(state) {
  const course = readCourse(state);
  const rows = [];
  const started = !!(course.current || Object.keys(course.levels).length);
  if (started) {
    const done = LEVELS.filter((l) => levelPassed(state, l.id)).length;
    rows.push({ id: 'trick', name: COURSE_TITLE, href: '#trick', short: 'Trick Shot', done, total: LEVELS.length, finished: done >= LEVELS.length });
  }
  const examStarted = !!(course.exam?.passed || course.exam?.history?.length || (course.current && (course.current.mode === 'exam' || course.current.parent === 'exam')));
  if (examStarted) {
    rows.push({ id: 'trickExam', name: EXAM_TITLE, href: '#trick/exam', short: 'Trick Shot Exam', done: course.exam?.passed ? 1 : 0, total: 1, finished: !!course.exam?.passed });
  }
  return rows;
}
export function trickBannersHTML(state) {
  const open = examUnlocked(state || {});
  const n = LEVELS.length;
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#trick" data-trick="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${n} levels. Make each shot 3 times. Not on the All list. Not a Career rank.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#trick/exam" data-trick="exam"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>8 shots, one skill each. Make each shot 3 times.</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-trick="exam" data-trick-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${n} levels are passed.</small></span></div>`;
  return course + exam;
}

export function trickProgress(state) {
  const passed = LEVELS.filter((l) => levelPassed(state, l.id)).length;
  const exam = readCourse(state).exam;
  return {
    id: 'trick',
    name: 'Trick Shot',
    done: passed,
    total: LEVELS.length,
    started: passed > 0 || !!exam,
    finished: !!(exam && exam.passed),
    examPassed: !!(exam && exam.passed),
    best: exam?.best || 0
  };
}

export function auditShots() {
  const shots = allShots();
  let pocketClaims = 0, railPaths = 0, arbitrary = 0;
  const pockets = new Set(['TL', 'TM', 'TR', 'BL', 'BM', 'BR']);
  for (const shot of shots) {
    if (shot.pockets.some((p) => !pockets.has(p))) throw new Error(`${shot.name} names a 7th pocket`);
    for (const path of shot.paths) {
      const got = railsOf(path.points);
      if (got.join(',') !== (path.rails || []).join(',')) throw new Error(`${shot.name} rail mismatch`);
      railPaths += got.length ? 1 : 0;
      if (path.pocket) {
        pocketClaims += 1;
        const end = path.points[path.points.length - 1];
        if (Math.hypot(end.x - POCKETS[path.pocket][0], end.y - POCKETS[path.pocket][1]) > 0.35) throw new Error(`${shot.name} pocket path misses`);
      }
    }
    for (const b of shot.balls) {
      if (!b.ref || b.ref === 'illegal') throw new Error(`${shot.name} ${b.id} has no legal reference`);
      if (b.ref === 'arbitrary' || b.ref === 'frozen' || b.ref === 'contact' || b.ref === 'cluster') arbitrary += 1;
    }
    if (!shot.name || /^shot\s*\d/i.test(shot.name)) throw new Error('unnamed shot');
  }
  return { shots: shots.length, pocketClaims, railPaths, namedRailsOk: true, seventhPocket: 0, legalBalls: shots.reduce((n, s) => n + s.balls.length, 0) };
}
export const AUDIT = auditShots();
