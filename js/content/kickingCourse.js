/**
 * Off the Rail — progressive kicking course on Drill Sets & Exams.
 * Physical-table training: the diagram shows the layout, the player shoots, then taps the result.
 * Storage key: state.kickingCourse only. No Career XP.
 *
 * Ball centers sit on diamond crossings only (x and y in 0, 12.5, 25 … 100 and 0, 12.5, 25, 37.5, 50).
 * One-rail contacts are the mirror method. Two-rail and three-rail contacts are the same reflection,
 * described as the diamond the line hits, or "approximately" the nearest diamond.
 */
import { renderTableDiagram } from '../tableDiagram.js';
import { cueBallSVG } from '../games/cueBallDiagram.js';

export const COURSE_TITLE = 'Off the Rail';
export const EXAM_TITLE = 'Off the Rail Exam';
export const STORAGE_KEY = 'kickingCourse';

export const KICK_SCORE = {
  attemptPoints: { 1: 3, 2: 2, 3: 1, 4: 1, 5: 1, 0: 0 },
  pocketBonus: 2,
  attempts: 3,
  passPercent: 80
};

/** Last choice is state.kickingCourse.difficulty. Intermediate is the original 3-attempt hit rule. */
export const DIFFICULTIES = {
  beginner: { id: 'beginner', label: 'Beginner', attempts: 5, pocketRequired: false },
  intermediate: { id: 'intermediate', label: 'Intermediate', attempts: 3, pocketRequired: false },
  pro: { id: 'pro', label: 'Pro', attempts: 3, pocketRequired: true }
};

export function difficultyOf(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.intermediate;
}

export function attemptsFor(id) {
  return difficultyOf(id).attempts;
}

export function pocketRequired(id) {
  return difficultyOf(id).pocketRequired;
}

export function difficultyNote(id) {
  const d = difficultyOf(id);
  if (d.id === 'beginner') return 'Beginner: 5 attempts. Success is hitting the required rails, then the object ball. Pocketing is not required. A pocket adds +2.';
  if (d.id === 'pro') return 'Pro: 3 attempts. The object ball must go in the designated pocket. A hit that misses the pocket is a miss.';
  return 'Intermediate: 3 attempts. Success is hitting the object ball. Pocketing is not required. A pocket adds +2.';
}

const DIAMOND_X = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
const DIAMOND_Y = [12.5, 25, 37.5];
const POCKETS = { TL: [0, 0], TM: [50, 0], TR: [100, 0], BL: [0, 50], BM: [50, 50], BR: [100, 50] };
const RAIL_NAME = {
  top: 'top long rail',
  bottom: 'bottom long rail',
  left: 'head short rail',
  right: 'foot short rail'
};
const COUNT = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function onCrossing(p) {
  if (!p) return false;
  return DIAMOND_X.some((x) => Math.abs(x - p.x) < 1e-6) && DIAMOND_Y.some((y) => Math.abs(y - p.y) < 1e-6);
}

function nearestDiamond(v) {
  let best = 0;
  let err = 99;
  for (let d = 0; d <= 100; d += 12.5) {
    const e = Math.abs(v - d);
    if (e < err) { err = e; best = d; }
  }
  return { diamond: best, err };
}

function countWord(n) {
  const k = Math.round(n);
  const name = COUNT[k] || String(k);
  return `${name} diamond${k === 1 ? '' : 's'}`;
}

/** Diamond language for a ball on a crossing. Diagram and words use the same point. */
export function diamondPhrase(p) {
  const out = Math.round(p.x / 12.5);
  const up = Math.round(p.y / 12.5);
  return `${countWord(out)} out from the head short rail, ${countWord(up)} up from the bottom long rail`;
}

function railPhrase(hit, rail) {
  const along = rail === 'left' || rail === 'right' ? hit.y : hit.x;
  const near = nearestDiamond(along);
  const exact = near.err < 0.35;
  const n = Math.round(near.diamond / 12.5);
  const where = rail === 'left' || rail === 'right'
    ? `${countWord(n)} up from the bottom long rail`
    : `${countWord(n)} out from the head short rail`;
  const lead = exact ? 'the diamond' : 'approximately the diamond';
  return `${lead} ${where} on the ${RAIL_NAME[rail]}`;
}

function mirrorPoint(p, rail) {
  if (rail === 'top') return { x: p.x, y: -p.y };
  if (rail === 'bottom') return { x: p.x, y: 100 - p.y };
  if (rail === 'left') return { x: -p.x, y: p.y };
  return { x: 200 - p.x, y: p.y };
}

function nearPocket(p) {
  for (const [x, y] of [[0, 0], [100, 0], [0, 50], [100, 50]]) {
    if (Math.hypot(p.x - x, p.y - y) < 6.2) return true;
  }
  if ((p.y < 1.2 || p.y > 48.8) && Math.abs(p.x - 50) < 7) return true;
  return false;
}

function railHit(from, to, rail) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let t;
  let x;
  let y;
  if (rail === 'top' || rail === 'bottom') {
    y = rail === 'top' ? 0 : 50;
    if (Math.abs(dy) < 1e-6) return null;
    t = (y - from.y) / dy;
    x = from.x + t * dx;
    if (x < 4 || x > 96) return null;
  } else {
    x = rail === 'left' ? 0 : 100;
    if (Math.abs(dx) < 1e-6) return null;
    t = (x - from.x) / dx;
    y = from.y + t * dy;
    if (y < 4 || y > 46) return null;
  }
  if (t < 0.08 || t > 0.92) return null;
  const p = { x, y };
  if (nearPocket(p)) return null;
  return p;
}

function segDist(a, b, p) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
}

/** Mirror-method contacts, cue through each reflected image, in rail order. */
export function mirrorContacts(cue, ob, rails) {
  let img = { x: ob.x, y: ob.y };
  const images = [];
  for (let i = rails.length - 1; i >= 0; i--) {
    img = mirrorPoint(img, rails[i]);
    images[i] = img;
  }
  const hits = [];
  let from = cue;
  for (let i = 0; i < rails.length; i++) {
    const h = railHit(from, images[i], rails[i]);
    if (!h) return null;
    hits.push(h);
    from = h;
  }
  return hits;
}

function pathClears(cue, hits, ob, blocker) {
  const pts = [cue, ...hits];
  for (let i = 0; i < pts.length - 1; i++) {
    if (segDist(pts[i], pts[i + 1], ob) < 2.4) return 'path hits the object ball before the last rail';
  }
  if (blocker) {
    const all = [cue, ...hits, ob];
    for (let i = 0; i < all.length - 1; i++) {
      if (segDist(all[i], all[i + 1], blocker) < 2.4) return 'path runs through the blocker';
    }
  }
  return '';
}

function pocketLine(hit, ob, pocket) {
  const p = POCKETS[pocket];
  if (!p) return false;
  const dx = p[0] - ob.x;
  const dy = p[1] - ob.y;
  const len = Math.hypot(dx, dy) || 1;
  const cross = Math.abs((hit.x - ob.x) * dy - (hit.y - ob.y) * dx) / len;
  const t = ((hit.x - ob.x) * dx + (hit.y - ob.y) * dy) / (len * len);
  return cross < 0.6 && t < -0.15;
}

function ballName(n) { return `${n}-ball`; }

function tipWords(tip) {
  const v = tip?.vTips || 0;
  const h = tip?.hTips || 0;
  if (!v && !h) return { english: 'NONE', cue: 'CENTER' };
  const side = h > 0 ? 'right' : h < 0 ? 'left' : '';
  const vert = v > 0 ? 'follow' : v < 0 ? 'draw' : '';
  const cue = [vert, side].filter(Boolean).join(' ') || 'CENTER';
  return { english: (tip.englishLabel || cue).toUpperCase(), cue: cue.toUpperCase() };
}

const LEVEL_META = [
  { n: 1, name: 'ONE-RAIL FUNDAMENTALS', blurb: 'Easy one-rail contact. Long rail and short rail. Center ball, medium speed.' },
  { n: 2, name: 'ONE-RAIL ANGLES', blurb: 'A shallow kick, a steep kick, a long-table kick, and a different cue-ball diamond.' },
  { n: 3, name: 'TWO-RAIL KICKS', blurb: 'Long then short, short then long, a cross-table kick, and a corner route.' },
  { n: 4, name: 'THREE-RAIL KICKS', blurb: 'Four three-rail routes. Use the route the solution names.' },
  { n: 5, name: 'ENGLISH & SPEED', blurb: 'Center ball is not enough. Running english, reverse english, and a speed change.' },
  { n: 6, name: 'BLOCKED KICKS', blurb: 'A ball blocks the straight line. Kick around it: one rail, two rails, and three rails.' },
  { n: 7, name: 'KICK & POCKET', blurb: 'Precise contact. On a required-pocket shot, contact without the pocket is a miss.' },
  { n: 8, name: 'KICK POSITION & KICK SAFETY', blurb: 'Confirm the leave. Contact alone is not the result.' }
];

function S(raw) { return raw; }

const RAW = [
  // Level 1 — natural one-rail, center, medium
  S({ level: 1, ball: 1, cue: { x: 12.5, y: 25 }, ob: { x: 75, y: 12.5 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Center ball, medium speed. The mirror line from the cue ball through the image of the 1-ball hits the bottom long rail on the diamond three out from the head rail, and comes back to the 1-ball one diamond up.' }),
  S({ level: 1, ball: 2, cue: { x: 25, y: 37.5 }, ob: { x: 87.5, y: 25 }, rails: ['top'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Same idea off the top long rail. Center ball and medium speed. The contact is the diamond five out from the head rail.' }),
  S({ level: 1, ball: 3, cue: { x: 25, y: 12.5 }, ob: { x: 25, y: 37.5 }, rails: ['right'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Both balls are two diamonds out from the head rail. Kick the foot short rail at two diamonds up, center ball, medium speed, and the cue ball comes back to the 3-ball.' }),
  S({ level: 1, ball: 4, cue: { x: 75, y: 37.5 }, ob: { x: 75, y: 12.5 }, rails: ['left'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Both balls are six diamonds out. Kick the head short rail at two diamonds up. Center ball, medium speed, natural angle.' }),
  // Level 2 — angles and speed, still no english
  S({ level: 2, ball: 5, cue: { x: 12.5, y: 12.5 }, ob: { x: 62.5, y: 12.5 }, rails: ['bottom'], speed: 'Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Shallow kick. Both balls are one diamond up from the bottom rail, so the cue ball runs along the table and comes back only a little. Soft speed is enough for this short return.' }),
  S({ level: 2, ball: 6, cue: { x: 12.5, y: 12.5 }, ob: { x: 12.5, y: 37.5 }, rails: ['right'], speed: 'Medium-Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Steep kick. The balls are stacked one diamond out, so the cue ball goes almost straight into the foot short rail and comes back up the same diamond. Medium-soft keeps it from jumping off that steep return.' }),
  S({ level: 2, ball: 7, cue: { x: 25, y: 12.5 }, ob: { x: 87.5, y: 25 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Long-table one-rail. The 7-ball is seven diamonds out. Medium speed carries the cue ball to the diamond five out on the bottom rail and back up to the center line.' }),
  S({ level: 2, ball: 1, cue: { x: 50, y: 25 }, ob: { x: 12.5, y: 12.5 }, rails: ['top'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'The cue ball is on a different diamond: four out and two up, the center of the table. Medium-firm, center ball. The mirror line hits the top long rail two diamonds out.' }),
  // Level 3 — two-rail
  S({ level: 3, ball: 2, cue: { x: 25, y: 37.5 }, ob: { x: 62.5, y: 25 }, rails: ['bottom', 'right'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Long then short. Diamond system: bottom long rail at five diamonds out, then the foot short rail three diamonds up, into the 2-ball.' }),
  S({ level: 3, ball: 3, cue: { x: 50, y: 12.5 }, ob: { x: 75, y: 25 }, rails: ['left', 'bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Short then long. Diamond system: head short rail at three diamonds up, then the bottom long rail at two diamonds out, into the 3-ball.' }),
  S({ level: 3, ball: 4, cue: { x: 25, y: 37.5 }, ob: { x: 75, y: 12.5 }, rails: ['top', 'bottom'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Cross-table. The mirror line hits the top long rail approximately at three diamonds out, then the bottom long rail approximately at five diamonds out. Medium-firm, because the cue ball crosses the table twice.' }),
  S({ level: 3, ball: 5, cue: { x: 50, y: 37.5 }, ob: { x: 25, y: 25 }, rails: ['right', 'top'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Corner route. Diamond system: foot short rail one diamond up from the bottom, then the top long rail at six diamonds out, back to the 5-ball.' }),
  // Level 4 — three-rail, four routes
  S({ level: 4, ball: 6, cue: { x: 25, y: 12.5 }, ob: { x: 62.5, y: 25 }, rails: ['bottom', 'right', 'top'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Route: bottom long rail at five diamonds out, foot short rail one diamond up, top long rail at seven diamonds out. That is the only route that tracks into the 6-ball.' }),
  S({ level: 4, ball: 7, cue: { x: 25, y: 12.5 }, ob: { x: 75, y: 12.5 }, rails: ['top', 'left', 'bottom'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Route: top long rail at one diamond out, head short rail one diamond up, bottom long rail at three diamonds out. Do not cut the 7-ball straight along the first diamond.' }),
  S({ level: 4, ball: 1, cue: { x: 25, y: 37.5 }, ob: { x: 62.5, y: 25 }, rails: ['top', 'right', 'bottom'], speed: 'Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Route: top long rail at five diamonds out, foot short rail three diamonds up, bottom long rail at seven diamonds out. Firm speed, center ball, so it survives three rails.' }),
  S({ level: 4, ball: 2, cue: { x: 25, y: 37.5 }, ob: { x: 50, y: 12.5 }, rails: ['bottom', 'left', 'top'], speed: 'Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Route: bottom long rail at one diamond out, head short rail three diamonds up, top long rail at three diamonds out, into the 2-ball one diamond off the bottom.' }),
  // Level 5 — english and speed. Path for side-english is the aimed diamond, not the center-ball mirror of the real ball.
  S({ level: 5, ball: 3, cue: { x: 12.5, y: 25 }, ob: { x: 75, y: 25 }, naturalOb: { x: 75, y: 12.5 }, rails: ['bottom'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 1, englishLabel: 'running right' }, english: 'running', allowPocket: true, why: 'A center-ball hit off the bottom-rail diamond three out rebounds to the diamond one up at six diamonds out, and misses this 3-ball on the center line. Right running english opens that rebound so the cue ball climbs off the rail to the center diamond. The cue ball is traveling toward the foot rail, so right is running.' }),
  S({ level: 5, ball: 4, cue: { x: 25, y: 12.5 }, ob: { x: 87.5, y: 12.5 }, naturalOb: { x: 87.5, y: 25 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: -1, englishLabel: 'reverse left' }, english: 'reverse', allowPocket: true, why: 'Center ball off the diamond five out runs up to the center line at seven diamonds out and misses the 4-ball, which is only one diamond off the bottom rail. Left reverse english holds the cue ball on the rail so it comes off shorter, into that ball.' }),
  S({ level: 5, ball: 5, cue: { x: 50, y: 12.5 }, ob: { x: 25, y: 37.5 }, rails: ['bottom', 'right', 'top'], speed: 'Firm', tip: { vTips: 0.5, hTips: 0, englishLabel: 'half tip of follow' }, english: 'follow', allowPocket: true, why: 'Center ball at medium speed dies before the third rail. Firm speed with a half tip of follow keeps the cue ball moving through the third rail. The line is still the diamond route; the follow is for distance, not a new track.' }),
  S({ level: 5, ball: 6, cue: { x: 62.5, y: 12.5 }, ob: { x: 12.5, y: 25 }, naturalOb: { x: 12.5, y: 12.5 }, rails: ['bottom'], speed: 'Medium-Soft', tip: { vTips: 0, hTips: -1, englishLabel: 'running left' }, english: 'running', allowPocket: true, why: 'Center ball off the diamond three out stays on the first diamond and misses the 6-ball on the center line. The cue ball is traveling toward the head rail, so left english is running and opens the rebound. Medium-soft keeps that wider angle from running past the ball.' }),
  // Level 6 — blocker on the straight diamond line
  S({ level: 6, ball: 7, cue: { x: 12.5, y: 12.5 }, ob: { x: 37.5, y: 12.5 }, blocker: { x: 25, y: 12.5 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'The 8-ball sits on the straight diamond between the cue ball and the 7-ball, one diamond up. Kick the bottom long rail at two diamonds out and come back to the 7-ball.' }),
  S({ level: 6, ball: 2, cue: { x: 12.5, y: 12.5 }, ob: { x: 12.5, y: 37.5 }, blocker: { x: 12.5, y: 25 }, rails: ['right'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'The 8-ball blocks the diamond one out. Kick the foot short rail at two diamonds up. The cue ball goes around the 8 and back up that same diamond to the 2-ball.' }),
  S({ level: 6, ball: 3, cue: { x: 12.5, y: 12.5 }, ob: { x: 37.5, y: 37.5 }, blocker: { x: 25, y: 25 }, rails: ['left', 'bottom'], speed: 'Medium-Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'The 8-ball blocks the diagonal. Two-rail diamond system around it: head short rail at two diamonds up, then the bottom long rail at two diamonds out, into the 3-ball.' }),
  S({ level: 6, ball: 4, cue: { x: 12.5, y: 12.5 }, ob: { x: 12.5, y: 37.5 }, blocker: { x: 12.5, y: 25 }, rails: ['bottom', 'right', 'top'], speed: 'Firm', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Three rails around the same 8-ball. Bottom long rail approximately at five diamonds out, foot short rail at two diamonds up, then the top long rail approximately at five diamonds out. Firm speed.' }),
  // Level 7 — kick and pocket. First three require the pocket.
  S({ level: 7, ball: 3, cue: { x: 12.5, y: 25 }, ob: { x: 37.5, y: 25 }, rails: ['top'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, requirePocket: true, pocket: 'BM', why: 'The mirror contact is the top long rail at two diamonds out. That line through the 3-ball runs straight into the bottom side pocket. The pocket is required. Hitting the 3-ball and missing the pocket is a miss.' }),
  S({ level: 7, ball: 5, cue: { x: 62.5, y: 25 }, ob: { x: 87.5, y: 25 }, rails: ['top'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, requirePocket: true, pocket: 'BR', why: 'Top long rail at six diamonds out. The 5-ball is on the center line and the kick sends it into the foot-bottom corner. The pocket is required.' }),
  S({ level: 7, ball: 4, cue: { x: 37.5, y: 25 }, ob: { x: 12.5, y: 25 }, rails: ['bottom'], speed: 'Medium-Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, requirePocket: true, pocket: 'TL', why: 'Bottom long rail at two diamonds out. The 4-ball goes into the head-top corner. The pocket is required. Medium-soft, so the cue ball does not follow the 4-ball in.' }),
  S({ level: 7, ball: 1, cue: { x: 12.5, y: 25 }, ob: { x: 75, y: 12.5 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', allowPocket: true, why: 'Precise one-rail contact only. The bottom-rail diamond three out is the shot. Pocketing the 1-ball is a bonus, not the requirement.' }),
  // Level 8 — the player confirms the leave. Contact alone is not enough.
  S({ level: 8, ball: 3, cue: { x: 12.5, y: 25 }, ob: { x: 62.5, y: 25 }, blocker: { x: 37.5, y: 25 }, rails: ['bottom'], speed: 'Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', confirm: true, allowPocket: false, zone: { x: 25, y: 25, r: 12 }, successLabel: 'Cue ball finished behind the 8', why: 'Soft, center ball, off the bottom rail at three diamonds out. Intended finish: the cue ball stays on the head side of the 8, around one or two diamonds out on the center line, so the 8 still blocks the 3-ball. Getting to the 3-ball and rolling past the 8 is not the result.' }),
  S({ level: 8, ball: 1, cue: { x: 37.5, y: 12.5 }, ob: { x: 87.5, y: 12.5 }, rails: ['bottom'], speed: 'Medium-Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', confirm: true, allowPocket: false, successLabel: 'Both balls are safe', why: 'Kick safe off the bottom rail at five diamonds out. Intended finish: the 1-ball stays one diamond up from the bottom long rail, and the cue ball comes back short of it, not in a pocket and not in the open.' }),
  S({ level: 8, ball: 2, cue: { x: 25, y: 12.5 }, ob: { x: 87.5, y: 25 }, rails: ['bottom'], speed: 'Medium', tip: { vTips: 0, hTips: 0 }, english: 'none', confirm: true, allowPocket: false, successLabel: 'The 2-ball reached the foot rail', why: 'A full hit off the diamond five out sends the 2-ball along that line into the foot short rail, one diamond up from the bottom, clear of the corner pocket. Pocketing it is not the result. Confirm only if the 2-ball reached that rail.' }),
  S({ level: 8, ball: 6, cue: { x: 12.5, y: 25 }, ob: { x: 75, y: 12.5 }, rails: ['bottom'], speed: 'Medium-Soft', tip: { vTips: 0, hTips: 0 }, english: 'none', confirm: true, allowPocket: true, zone: { x: 62.5, y: 25, r: 6 }, successLabel: 'Cue ball stopped on the center diamond', why: 'Medium-soft off the bottom rail at three diamonds out. The return line crosses the center line at five diamonds out. Intended finish: the cue ball stops on that diamond (62.5, two up), short of the 6-ball. If you also pocket the 6-ball and the cue ball is still there, that is the same leave plus the pocket bonus.' })
];

function hydrate(raw, index) {
  if (!onCrossing(raw.cue) || !onCrossing(raw.ob)) throw new Error(`station off the diamond grid L${raw.level}`);
  if (raw.blocker && !onCrossing(raw.blocker)) throw new Error(`blocker off the diamond grid L${raw.level}`);
  if (raw.naturalOb && !onCrossing(raw.naturalOb)) throw new Error(`natural ball off the grid L${raw.level}`);
  const target = raw.naturalOb || raw.ob;
  const hits = mirrorContacts(raw.cue, target, raw.rails);
  if (!hits) throw new Error(`no mirror path L${raw.level} shot ${index + 1}`);
  const clip = pathClears(raw.cue, hits, raw.naturalOb || raw.ob, raw.blocker);
  if (!raw.naturalOb && clip) throw new Error(`${clip} L${raw.level} shot ${index + 1}`);
  if (raw.blocker) {
    const all = [raw.cue, ...hits, raw.ob];
    for (let i = 0; i < all.length - 1; i++) {
      if (segDist(all[i], all[i + 1], raw.blocker) < 2.4) throw new Error(`blocker clip L${raw.level} shot ${index + 1}`);
    }
    const dx = raw.ob.x - raw.cue.x;
    const dy = raw.ob.y - raw.cue.y;
    const len = Math.hypot(dx, dy) || 1;
    const t = ((raw.blocker.x - raw.cue.x) * dx + (raw.blocker.y - raw.cue.y) * dy) / (len * len);
    const cross = Math.abs((raw.blocker.x - raw.cue.x) * dy - (raw.blocker.y - raw.cue.y) * dx) / len;
    if (cross > 0.2 || t <= 0.05 || t >= 0.95) throw new Error(`blocker not on the straight line L${raw.level}`);
  }
  if (raw.requirePocket && !pocketLine(hits[hits.length - 1], raw.ob, raw.pocket)) {
    throw new Error(`pocket line does not match L${raw.level} ${raw.pocket}`);
  }
  if (raw.pocket && !POCKETS[raw.pocket]) throw new Error('pocket is not one of the six');
  const contacts = hits.map((h, i) => ({ ...h, rail: raw.rails[i], phrase: railPhrase(h, raw.rails[i]) }));
  const route = contacts.map((c, i) => `${i + 1}. ${c.phrase}`).join('; ');
  return {
    ...raw,
    index,
    id: `l${raw.level}s${index}`,
    contacts,
    hits,
    route,
    aim: contacts[0].phrase,
    diamondRef: contacts.map((c) => c.phrase).join(' · '),
    tip: { vTips: raw.tip?.vTips || 0, hTips: raw.tip?.hTips || 0, englishLabel: raw.tip?.englishLabel || '' }
  };
}

function buildLevels() {
  const levels = LEVEL_META.map((m) => ({ ...m, stations: [] }));
  for (const raw of RAW) {
    const level = levels[raw.level - 1];
    level.stations.push(hydrate(raw, level.stations.length));
  }
  for (const level of levels) {
    if (level.stations.length !== 4) throw new Error(`level ${level.n} has ${level.stations.length} stations`);
  }
  return levels;
}

export const LEVELS = buildLevels();

export const EXAM_PICKS = [[1, 0], [2, 1], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 1]];

export function examStations() {
  return EXAM_PICKS.map(([level, index], i) => {
    const src = LEVELS[level - 1].stations[index];
    return { ...src, id: `exam-${i + 1}`, exam: true, from: `Level ${level} · ${LEVELS[level - 1].name}` };
  });
}

export const EXAM_STATIONS = examStations();

export function levelByNumber(n) { return LEVELS[n - 1] || null; }

export function stationMax() {
  return (KICK_SCORE.attemptPoints[1] || 0) + KICK_SCORE.pocketBonus;
}

export function emptyMarks(n = KICK_SCORE.attempts) {
  return Array.from({ length: n }, () => 'empty');
}

export function freshStation(attempts = KICK_SCORE.attempts) {
  return { marks: emptyMarks(attempts), log: [], done: false, success: false, pocketed: false, madeOn: 0, points: 0 };
}

/** Pocket the object ball is sent toward. A station that already names a pocket keeps it. */
export function designatedPocket(station) {
  if (station?.pocket && POCKETS[station.pocket]) return station.pocket;
  const hit = station?.hits?.[station.hits.length - 1];
  const ob = station?.ob;
  if (!hit || !ob) return 'BM';
  const vx = ob.x - hit.x;
  const vy = ob.y - hit.y;
  const vlen = Math.hypot(vx, vy) || 1;
  let best = 'BM';
  let bestScore = -Infinity;
  for (const [name, pt] of Object.entries(POCKETS)) {
    const dx = pt[0] - ob.x;
    const dy = pt[1] - ob.y;
    const len = Math.hypot(dx, dy) || 1;
    const forward = (vx * dx + vy * dy) / (vlen * len);
    const score = forward * 3 - len / 80;
    if (score > bestScore) { bestScore = score; best = name; }
  }
  return best;
}

function judge(station, outcome, difficulty) {
  if (outcome === 'miss') return { success: false, pocketed: false };
  if (pocketRequired(difficulty)) {
    if (outcome === 'pocket') return { success: true, pocketed: true };
    return { success: false, pocketed: false };
  }
  if (outcome === 'pocket') return { success: true, pocketed: true };
  if (outcome === 'contact' || outcome === 'result') return { success: true, pocketed: false };
  return { success: false, pocketed: false };
}

function fitMarks(prev, attempts) {
  const cur = prev && prev.marks
    ? { ...prev, marks: prev.marks.slice(), log: (prev.log || []).slice() }
    : freshStation(attempts);
  let marks = cur.marks.slice();
  while (marks.length > attempts && marks[marks.length - 1] === 'empty') marks.pop();
  while (marks.length < attempts) marks.push('empty');
  if (marks.length > attempts) marks = marks.slice(0, attempts);
  cur.marks = marks;
  const used = marks.filter((m) => m !== 'empty').length;
  if (!cur.done && used >= attempts && !marks.includes('empty')) {
    cur.done = true;
    cur.success = false;
    cur.points = 0;
    cur.madeOn = 0;
  }
  return cur;
}

export function recordAttempt(station, prev, outcome, difficulty = 'intermediate') {
  const attempts = attemptsFor(difficulty);
  const cur = fitMarks(prev, attempts);
  if (cur.done) return cur;
  const slot = cur.marks.findIndex((m) => m === 'empty');
  if (slot < 0) return { ...cur, done: true, success: false, points: 0 };
  const judged = judge(station, outcome, difficulty);
  cur.marks[slot] = judged.success ? 'make' : 'miss';
  cur.log.push(outcome);
  const used = slot + 1;
  const done = judged.success || used >= attempts;
  cur.done = done;
  cur.success = done && judged.success;
  cur.pocketed = !!(cur.success && judged.pocketed);
  cur.madeOn = cur.success ? used : 0;
  cur.points = cur.success
    ? (KICK_SCORE.attemptPoints[used] ?? 1) + (cur.pocketed ? KICK_SCORE.pocketBonus : 0)
    : 0;
  return cur;
}

export function replayLog(station, log, difficulty = 'intermediate') {
  let s = freshStation(attemptsFor(difficulty));
  for (const outcome of log || []) s = recordAttempt(station, s, outcome, difficulty);
  return s;
}

export function passesPercent(successes, total, percent = KICK_SCORE.passPercent) {
  if (!total) return false;
  return (successes / total) * 100 + 1e-9 >= percent;
}

function blank() {
  return {
    levels: {},
    exam: { passed: false, bestScore: 0, bestMax: 0, attempts: 0, history: [], last: null },
    stats: { first: 0, second: 0, third: 0, later: 0, failed: 0, attempts: 0, contacts: 0, pockets: 0 },
    difficulty: 'intermediate',
    current: null
  };
}

export function kickingOf(state) {
  const raw = state?.kickingCourse;
  const kc = blank();
  if (!raw || typeof raw !== 'object') return kc;
  const copy = structuredClone(raw);
  kc.levels = copy.levels && typeof copy.levels === 'object' ? copy.levels : {};
  kc.exam = { ...kc.exam, ...(copy.exam || {}) };
  kc.exam.history = Array.isArray(kc.exam.history) ? kc.exam.history : [];
  kc.stats = { ...kc.stats, ...(copy.stats || {}) };
  kc.difficulty = difficultyOf(copy.difficulty).id;
  kc.current = copy.current || null;
  return kc;
}

export function setDifficulty(state, id) {
  if (!DIFFICULTIES[id]) return state;
  const kc = kickingOf(state);
  kc.difficulty = id;
  const attempts = attemptsFor(id);
  const cur = kc.current;
  if (cur && cur.phase === 'play') {
    cur.difficulty = id;
    for (const si of cur.order) {
      const rec = cur.stations[si];
      if (!rec || rec.done) continue;
      cur.stations[si] = fitMarks(rec, attempts);
    }
  }
  return withKicking(state, kc);
}

export function withKicking(state, kc) {
  return { ...state, kickingCourse: kc };
}

export function passedLevelCount(kc) {
  let n = 0;
  for (let i = 1; i <= 8; i++) if (kc?.levels?.[i]?.passed || kc?.levels?.[String(i)]?.passed) n += 1;
  return n;
}

export function levelRecord(kc, n) {
  return kc?.levels?.[n] || kc?.levels?.[String(n)] || null;
}

export function isLevelOpen(kc, level) {
  const n = Number(level);
  if (n < 1 || n > 8) return false;
  for (let i = 1; i < n; i++) if (!levelRecord(kc, i)?.passed) return false;
  return true;
}

export function isExamOpen(kc) {
  return passedLevelCount(kc) >= 8;
}

function stationsFor(cur) {
  if (cur.mode === 'exam' || cur.parent === 'exam') return EXAM_STATIONS;
  return LEVELS[cur.level - 1].stations;
}

function runScore(cur, stations) {
  let score = 0;
  let max = 0;
  let successes = 0;
  let first = 0;
  let second = 0;
  let third = 0;
  let fourth = 0;
  let fifth = 0;
  let failed = [];
  let pockets = 0;
  let bonus = 0;
  cur.order.forEach((si, i) => {
    const st = stations[si];
    const rec = cur.stations[si] || freshStation();
    score += rec.points || 0;
    max += stationMax(st);
    if (rec.success) {
      successes += 1;
      if (rec.madeOn === 1) first += 1;
      else if (rec.madeOn === 2) second += 1;
      else if (rec.madeOn === 3) third += 1;
      else if (rec.madeOn === 4) fourth += 1;
      else if (rec.madeOn === 5) fifth += 1;
      if (rec.pocketed) {
        pockets += 1;
        bonus += KICK_SCORE.pocketBonus;
      }
    } else failed.push({ index: si, shot: i + 1, ball: st.ball, name: `Shot ${i + 1}` });
  });
  const total = cur.order.length;
  const passed = passesPercent(successes, total);
  const rate = total ? Math.round((successes / total) * 100) : 0;
  return { score, max, successes, total, first, second, third, fourth, fifth, failed, pockets, bonus, passed, rate };
}

function addStats(stats, cur, stations) {
  cur.order.forEach((si) => {
    const rec = cur.stations[si] || freshStation();
    const used = (rec.marks || []).filter((m) => m !== 'empty').length;
    stats.attempts += used;
    if (rec.success) {
      if (rec.madeOn === 1) stats.first += 1;
      else if (rec.madeOn === 2) stats.second += 1;
      else if (rec.madeOn === 3) stats.third += 1;
      else if (rec.madeOn >= 4) stats.later = (stats.later || 0) + 1;
      stats.contacts += 1;
      if (rec.pocketed) stats.pockets += 1;
    } else stats.failed += 1;
  });
}

function finalize(kc) {
  const cur = kc.current;
  const stations = stationsFor(cur);
  const summary = runScore(cur, stations);
  cur.summary = summary;
  cur.phase = 'results';
  if (cur.mode === 'practice') return kc;
  cur.undoSave = {
    levels: structuredClone(kc.levels),
    stats: structuredClone(kc.stats),
    exam: structuredClone(kc.exam)
  };
  if (cur.mode === 'level') {
    addStats(kc.stats, cur, stations);
    const prev = levelRecord(kc, cur.level);
    const better = !prev || summary.score > (prev.bestScore || 0);
    kc.levels[cur.level] = {
      passed: !!(prev?.passed || summary.passed),
      bestScore: better ? summary.score : prev.bestScore,
      bestMax: better ? summary.max : prev.bestMax,
      rate: better ? summary.rate : prev.rate,
      stations: better ? structuredClone(cur.stations) : prev.stations,
      successes: better ? summary.successes : prev.successes
    };
  } else if (cur.mode === 'exam') {
    addStats(kc.stats, cur, stations);
    const exam = kc.exam;
    exam.attempts += 1;
    const row = {
      at: new Date().toISOString(),
      score: summary.score,
      max: summary.max,
      passed: summary.passed,
      rate: summary.rate
    };
    exam.history = [...(exam.history || []), row].slice(-12);
    exam.last = row;
    if (summary.passed) exam.passed = true;
    if (!exam.bestMax || summary.score > (exam.bestScore || 0)) {
      exam.bestScore = summary.score;
      exam.bestMax = summary.max;
    }
  }
  return kc;
}

export function beginRun(state, spec) {
  const kc = kickingOf(state);
  const order = spec.order.slice();
  const stations = {};
  const attempts = attemptsFor(kc.difficulty);
  for (const i of order) stations[i] = freshStation(attempts);
  kc.current = {
    mode: spec.mode,
    level: spec.level || 0,
    order,
    cursor: 0,
    view: 0,
    stations,
    phase: 'play',
    parent: spec.parent || null,
    difficulty: kc.difficulty
  };
  return withKicking(state, kc);
}

export function startLevel(state, level) {
  const kc = kickingOf(state);
  if (!isLevelOpen(kc, level)) return state;
  const cur = kc.current;
  if (cur && cur.level === level && (cur.mode === 'level' || (cur.mode === 'practice' && cur.parent !== 'exam'))) return state;
  return beginRun(state, { mode: 'level', level, order: [0, 1, 2, 3] });
}

export function startExam(state) {
  const kc = kickingOf(state);
  if (!isExamOpen(kc)) return state;
  const cur = kc.current;
  if (cur && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  return beginRun(state, { mode: 'exam', order: EXAM_STATIONS.map((_, i) => i) });
}

export function kickTap(state, outcome) {
  const kc = kickingOf(state);
  const cur = kc.current;
  if (!cur || cur.phase !== 'play') return state;
  const stations = stationsFor(cur);
  const si = cur.order[cur.cursor];
  const rec = recordAttempt(stations[si], cur.stations[si] || freshStation(attemptsFor(kc.difficulty)), outcome, kc.difficulty);
  cur.stations[si] = rec;
  if (rec.done) {
    if (cur.cursor + 1 >= cur.order.length) return withKicking(state, finalize(kc));
    cur.cursor += 1;
    cur.view = cur.cursor;
  }
  return withKicking(state, kc);
}

export function kickUndo(state) {
  const kc = kickingOf(state);
  const cur = kc.current;
  if (!cur) return state;
  const stations = stationsFor(cur);
  if (cur.phase === 'results') {
    if (cur.undoSave) {
      kc.levels = cur.undoSave.levels;
      kc.stats = cur.undoSave.stats;
      kc.exam = cur.undoSave.exam;
    }
    cur.phase = 'play';
    cur.summary = null;
    cur.undoSave = null;
    cur.cursor = cur.order.length - 1;
    cur.view = cur.cursor;
  }
  let si = cur.order[cur.cursor];
  let rec = cur.stations[si] || freshStation();
  if (!(rec.log || []).length) {
    if (cur.cursor === 0) return withKicking(state, kc);
    cur.cursor -= 1;
    cur.view = cur.cursor;
    si = cur.order[cur.cursor];
    rec = cur.stations[si] || freshStation();
  }
  const log = (rec.log || []).slice(0, -1);
  cur.stations[si] = replayLog(stations[si], log, kc.difficulty);
  return withKicking(state, kc);
}

export function kickView(state, orderIndex) {
  const kc = kickingOf(state);
  const cur = kc.current;
  if (!cur || cur.phase !== 'play') return state;
  if (orderIndex < 0 || orderIndex > cur.cursor) return state;
  cur.view = orderIndex;
  return withKicking(state, kc);
}

export function kickPractice(state) {
  const kc = kickingOf(state);
  const cur = kc.current;
  if (!cur?.summary) return state;
  const failed = cur.summary.failed.map((f) => f.index);
  if (!failed.length) return state;
  return beginRun(state, { mode: 'practice', level: cur.level, order: failed, parent: cur.mode });
}

export function kickRetry(state) {
  const kc = kickingOf(state);
  const cur = kc.current;
  if (!cur) return state;
  if (cur.mode === 'exam' || cur.parent === 'exam') return startExam(state);
  const level = cur.level;
  return beginRun(state, { mode: 'level', level, order: [0, 1, 2, 3] });
}

export function courseStats(kc) {
  const stats = kc.stats || blank().stats;
  const makes = stats.first + stats.second + stats.third + (stats.later || 0);
  const doneStations = makes + stats.failed;
  const successPct = doneStations ? Math.round((makes / doneStations) * 100) : 0;
  let best = 0;
  let levelStationsHit = 0;
  for (let i = 1; i <= 8; i++) {
    const rec = levelRecord(kc, i);
    if (!rec) continue;
    best += rec.bestScore || 0;
    levelStationsHit += rec.successes || 0;
  }
  const passed = passedLevelCount(kc);
  return {
    ...stats,
    successPct,
    best,
    courseCompletion: `${passed} / 8`,
    levelCompletion: `${levelStationsHit} / 32`,
    passed
  };
}

export function offRailProgress(state) {
  const kc = kickingOf(state);
  const rows = [];
  const started = !!(kc.current || Object.keys(kc.levels).length);
  if (started) {
    const done = passedLevelCount(kc);
    rows.push({
      id: 'offRail',
      name: COURSE_TITLE,
      href: '#kicking',
      short: COURSE_TITLE,
      done,
      total: 8,
      finished: done >= 8
    });
  }
  const examStarted = !!(kc.exam?.attempts || kc.exam?.passed || (kc.current && kc.current.mode === 'exam'));
  if (examStarted) {
    rows.push({
      id: 'offRailExam',
      name: EXAM_TITLE,
      href: '#kicking/exam',
      short: EXAM_TITLE,
      done: kc.exam.passed ? 1 : 0,
      total: 1,
      finished: !!kc.exam.passed
    });
  }
  return rows;
}

export function offRailBannersHTML(state) {
  const kc = kickingOf(state || {});
  const open = isExamOpen(kc);
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#kicking" data-offrail="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>8 levels. Shoot the kick on your table. Not on the All list. Not a Career rank.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#kicking/exam" data-offrail="exam"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>8 shots, one from each level. Pass at 80%.</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-offrail="exam" data-offrail-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all 8 levels are passed.</small></span></div>`;
  return course + exam;
}

export function auditStations() {
  if (LEVELS.length !== 8) throw new Error('expected 8 levels');
  if (EXAM_STATIONS.length !== 8) throw new Error('expected 8 exam stations');
  const half = [6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25, 93.75, 1.125];
  for (const level of LEVELS) {
    for (const st of level.stations) {
      for (const p of [st.cue, st.ob, st.blocker, st.naturalOb].filter(Boolean)) {
        if (half.some((h) => Math.abs(p.x - h) < 1e-6 || Math.abs(p.y - h) < 1e-6)) throw new Error('half-diamond ball');
        if (!onCrossing(p)) throw new Error('ball off crossing');
      }
    }
  }
  return true;
}

auditStations();

export function diagramHTML(station, { solution = false, difficulty = 'intermediate' } = {}) {
  const balls = [
    { id: 'cue', x: station.cue.x, y: station.cue.y },
    { id: station.ball, x: station.ob.x, y: station.ob.y }
  ];
  if (station.blocker) balls.push({ id: 8, x: station.blocker.x, y: station.blocker.y, blocker: true });
  const spec = {
    balls,
    grid: true,
    headString: false,
    targetPocket: pocketRequired(difficulty) ? designatedPocket(station) : (station.pocket || null)
  };
  if (solution) {
    const pts = [station.cue, ...station.hits, station.ob];
    spec.paths = [{ points: pts, dashed: false, color: '#f2fdff', width: 0.48 }];
    if (station.zone) spec.zone = station.zone;
    const labels = station.contacts.map((c, i) => {
      const inside = c.rail === 'top' ? 3.4 : c.rail === 'bottom' ? 46.4 : c.y;
      const x = c.rail === 'left' ? 4.2 : c.rail === 'right' ? 95.6 : c.x;
      const y = c.rail === 'left' || c.rail === 'right' ? c.y : inside;
      return `<text class="kick-rail" data-rail="${c.rail}" x="${x}" y="${y}" text-anchor="middle" fill="#f2fdff" font-size="2.3" font-weight="700" font-family="Poppins, sans-serif">${i + 1} ${c.rail === 'left' ? 'HEAD' : c.rail === 'right' ? 'FOOT' : c.rail === 'top' ? 'TOP' : 'BOTTOM'}</text>`;
    }).join('');
    spec.extraOver = labels;
  }
  return renderTableDiagram(spec, { className: 'table-diagram' });
}

export function howToHTML(station, open, difficulty = 'intermediate') {
  const tw = tipWords(station.tip);
  const englishLine = !station.tip.vTips && !station.tip.hTips
    ? 'ENGLISH: NONE'
    : `ENGLISH: ${esc(tw.english)}`;
  const cueLine = !station.tip.vTips && !station.tip.hTips
    ? 'CUE TIP: CENTER'
    : `CUE TIP: ${esc(tw.cue)}`;
  const rails = station.rails.map((r) => RAIL_NAME[r]).join(', then ');
  const items = [
    `<li><b>Required rails.</b> ${esc(rails)}, in that order, then the ${ballName(station.ball)}.</li>`,
    `<li><b>Aim point.</b> ${esc(station.aim)}.</li>`,
    `<li><b>Diamond reference.</b> Cue ball: ${esc(diamondPhrase(station.cue))}. Object ball: ${esc(diamondPhrase(station.ob))}.${station.blocker ? ` Blocker, the 8-ball: ${esc(diamondPhrase(station.blocker))}.` : ''} ${esc(station.diamondRef)}.</li>`,
    `<li><b>${englishLine}.</b> ${cueLine}.</li>`,
    `<li class="kickTip">${cueBallSVG(station.tip, { size: 'sm' })}</li>`,
    `<li><b>Speed.</b> ${esc(station.speed)}.</li>`,
    `<li><b>Cue-ball route.</b> ${esc(station.route)}, then the ${ballName(station.ball)}.</li>`,
    `<li><b>Object-ball contact.</b> The cue ball hits the ${ballName(station.ball)} after those rails.</li>`
  ];
  const pro = pocketRequired(difficulty);
  const pocket = pro ? designatedPocket(station) : station.pocket;
  if (pocket) items.push(`<li><b>Target pocket.</b> ${esc(pocket)}${pro ? '. The pocket is required. A hit that misses the pocket is a miss.' : '. Pocketing is a bonus, not required.'}</li>`);
  items.push(`<li>${esc(station.why)}</li>`);
  const sign = open ? '−' : '+';
  return `<div class="stepHead"><span class="stepTitle">How to shoot it</span><button type="button" class="stepToggle" data-action="kick-how" aria-expanded="${open ? 'true' : 'false'}" aria-label="${open ? 'Hide how to shoot it' : 'Show how to shoot it'}">${sign}</button></div>
    ${open ? `<ol class="gameSteps">${items.join('')}</ol>` : ''}`;
}

export { ballName, tipWords, runScore, RAIL_NAME };
