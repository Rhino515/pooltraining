/**
 * Billiard University Exam I – Fundamentals (Dr. Dave).
 * Eight drills, ids bu-f1 … bu-f8. Diagrams follow the printed pages.
 * Scoring is the exam's progressive-practice / fixed-attempt rules, not a generic make count.
 * Career Rank XP is never awarded from these drills. Exam completion is stored on state.buExam
 * and is separate from opening a drill or from Career / Ball Pocketing levels.
 * Source: Billiard University / Dr. Dave, billiarduniversity.org. No BU logo.
 */
import { challengeFromPkfDoc } from './pkfBuiltins.js';
import { validatePooliq } from './schema.js';
import { skillsBannersHTML, skillsAccomplishmentHTML, skillsExamPageHTML } from './buExam2.js';

export const BU_CREDIT = 'Billiard University / Dr. Dave — billiarduniversity.org';
export const BU_EXAM_NAME = 'Exam I – Fundamentals';
export const BU_ORDER = ['bu-f1', 'bu-f2', 'bu-f3', 'bu-f4', 'bu-f5', 'bu-f6', 'bu-f7', 'bu-f8'];

/** Diamond positions 7 (head side) → 1 (foot side) along the top long rail. One diamond = 12.5. */
export const POS_X = { 1: 87.5, 2: 75, 3: 62.5, 4: 50, 5: 37.5, 6: 25, 7: 12.5 };

const R = 1.125;
const railBall = (n, x, y) => ({ n, x: Math.max(R, Math.min(100 - R, x)), y: Math.max(R, Math.min(50 - R, y)) });

const F1_BLOCK = `Instructions (for drills: F1-F4):
• Start with the cue ball (CB) in position 4. Each time you pocket the object ball (OB), advance the CB one position (e.g., from 4 to 5); and with each miss, move down by one number (e.g., from 4 to 3). If you succeed at position 7 or miss at position 1, stay at that position. The phrase “progressive practice” is used to describe this type of drill because the difficulty level changes progressively in response to your performance.
• Continue for 10 shots total unless you already have a guaranteed score of 10 (e.g., you can stop if you make the first eight shots).
• Adjust the CB position after the 10th shot based on the outcome, but not below 1 or above 7. For example if you make the 10th shot at 6, the final position is 7; and if you miss the 10th shot at 6, the final position is 5.
• Your score for the drill is the final position number plus a bonus for excellence. The bonus is equal to the numbers of successes at position 7. The maximum total score allowed is 10.
• Any drill in this exam can be done from the other side of the table (e.g., if it is easier to reach for a left-handed vs. right-handed player).

score = CB position number after the last shot + bonus (10 max)`;

const F2_OWN = `Instructions:
• Follow the instructions from drill F1.
• The OB must be pocketed, and the stopped CB must overlap at least part of the ghost-ball (GB) outline.
• The CB is allowed to contact the cushion.
• Tap and mark both the OB and GB positions with “little white donuts” to make it easier to check GB overlap after each shot (e.g., by trying to place a ball in the GB position) and to re-spot the OB.
• You are allowed to vary the CB and OB positions away from the rail as long as the CB remains within one diamond of the rail.
• If you end up in position 1 you are allowed to place the CB anywhere between positions 1 and 2. This will allow you to comfortably avoid a double hit.

score = CB position number after the last shot + bonus (10 max)`;

const F3_OWN = `Instructions:
• Follow the instructions from drill F1.
• The rectangular target can be printed and cut out from a template on the website. It is an 8.5”x11” sheet of paper with the center removed, leaving a 1” border.
• The CB and OB are always 1 diamond apart.
• The OB must be pocketed and the CB must end up within or overlapping the target for success.
• Both the CB and OB are allowed to contact cushions.
• You are allowed to vary the CB and OB positions away from the rail as long as the CB remains within one diamond of the rail.

score = CB position number after the last shot + bonus (10 max)`;

const F4_OWN = `Instructions:
• Follow the instructions from drill F1.
• You must pocket the OB and the CB must end up within the 2x1 diamond rectangle adjacent to the side pocket. The CB center (or resting point on the cloth) must be inside of the rectangle border.
• The CB is allowed to hit the side cushion.
• The target rectangle area is fixed and does not move with the CB.
• You are allowed to vary the CB and OB positions away from the rail as long as the CB remains within one diamond of the rail.
• If you end up in position 1 you are allowed to place the CB anywhere between positions 1 and 2. This will allow you to comfortably avoid a double hit.

score = CB position number after the last shot + bonus (10 max)`;

const TEXT = {
  'bu-f1': F1_BLOCK,
  'bu-f2': `${F2_OWN}\n\n${F1_BLOCK}`,
  'bu-f3': `${F3_OWN}\n\n${F1_BLOCK}`,
  'bu-f4': `${F4_OWN}\n\n${F1_BLOCK}`,
  'bu-f5': `Instructions:
• The OB must be pocketed and the CB must end up within or overlapping the target for success.
• Start with the target in position 4. Note that the target center and orientation for position 4 is different from the others, with the long edge against the rail cushion. The target centers for the other positions are aligned with the long-rail diamonds.
• The CB must head straight to the target (without cushion contact) for positions 1, 2, and 3, and the CB must rebound off the end rail for target positions 5, 6, and 7. Cushion contact is allowed, but not required, for target position 4.
• With each success, advance the target one position (e.g., from 4 to 5); and with each miss, move the target back (e.g., from 4 to 3). If you succeed at position 7 or miss at position 1, keep the target at that position.
• Continue for 10 shots total.
• Adjust the target position after the 10th shot based on the outcome, but not below 1 or above 7. For example if you succeed on the 10th shot at 6, the final position is 7; and if you miss the 10th shot at 6, the final position is 5.
• Your score for the drill is the final position number plus a bonus for excellence. The bonus is equal to the numbers of successes at position 7. The maximum total score allowed is 10.

score = target position number after the last shot + bonus (10 max)`,
  'bu-f6': `Drills F1-F5 above were “progressive practice” drills, where the CB, OB, and/or target moved as you progressed through the drill, taking 10 shots total. In the remaining drills, the CB and/or OB are fixed and you are simply shooting a set of shots, where you attempt each shot a specified number of times. You shoot the shots in order, regardless of whether or not you succeed at each.

Instructions:
• Shoot all 5 shots from each CB position, attempting to pocket the OBs as shown.
• You get 1 attempt at each of the 10 shots. You are not allowed to scratch.
• This and the remaining drills are not “progressive.” Instead, you attempt each shot, regardless of the previous shot’s outcome.

score = # of balls pocketed (10 max)`,
  'bu-f7': `Instructions:
• Pocket the OB and have the CB hit each of the rail target balls.
• You score a point by pocketing the OB and hitting the current target ball.
• Rail-first contact, adjacent to the target ball, is allowed, but you are not allowed to hit any other cushion on the way to the target ball.
• Take 2 attempts at each target ball.
• Remove target balls completed, and reposition any remaining balls that are disturbed.

score = # of successful attempts (20 max)`,
  'bu-f8': `Instructions:
• The OB (1 ball) must be pocketed and the CB must end up within or overlapping each of the targets.
• Take 4 attempts at each target, scoring 1 point for each success.
• Take any path to the target you desire, off as many rails as you chose or straight to the target.

score = # of successful attempts (20 max)`
};

export function examInstructions(id) {
  return TEXT[id] || '';
}

function posLabels(yLine) {
  return [7, 6, 5, 4, 3, 2, 1].map((n) => ({ type: 'label', x: POS_X[n], y: -2.15, text: String(n), size: 2.3, color: '#1c2428' }));
}
function posGhosts(y, skip) {
  return [7, 6, 5, 4, 3, 2, 1].filter((n) => n !== skip).map((n) => ({ type: 'ghost', x: POS_X[n], y, color: '#f4f7fb' }));
}
function label(x, y, text, extra = {}) {
  return { type: 'label', x, y, text, size: 2.05, color: '#1c2428', anchor: 'middle', ...extra };
}
function arrow(x1, y1, x2, y2, color, dashed) {
  return { type: 'arrow', x1, y1, x2, y2, color, dashed: !!dashed };
}
function path(points, color, dashed, n) {
  return { type: 'path', points, color, dashed: dashed !== false, ...(n != null ? { n } : {}) };
}

function doc(id, title, category, shot, attempts, goal) {
  return {
    format: 'pooliq',
    schemaVersion: '1.0',
    contentType: 'drill',
    id,
    contentVersion: '1.0',
    title,
    description: goal,
    category,
    difficulty: 2,
    skill: 'Shot Making',
    rankXpEligible: false,
    attribution: { sourceName: 'Billiard University', author: 'Dr. Dave', sourceURL: 'https://billiarduniversity.org' },
    shot: {
      kind: 'pot',
      speed: 2,
      cueContact: { vTips: 0, hTips: 0 },
      instructions: TEXT[id].slice(0, 1500),
      goal: goal.slice(0, 240),
      ...shot
    },
    scoringRules: { mode: 'binary', attempts, pass: { made: 1 } },
    xp: 0,
    skillEffects: { 'Shot Making': 1 }
  };
}

function buildDocs() {
  const y1 = 12.5;
  const f1 = doc('bu-f1', 'F1 – Cut Shot Drill', 'Cut Shots', {
    cueBallPosition: { x: POS_X[4], y: y1 },
    ballPositions: [{ n: 1, x: 96.5, y: 37.5 }],
    targetBall: 1,
    tableMarks: [
      ...posLabels(),
      ...posGhosts(y1, 4),
      { type: 'ghost', x: 97.35, y: 39.9, color: '#f4f7fb' },
      arrow(POS_X[4], y1, 95.2, 36.2, '#1a1a1a', false),
      path([{ x: 96.6, y: 39.2 }, { x: 99.2, y: 48.6 }], '#f5c542', true),
      arrow(46, 16, 40, 16, '#1a1a1a', false),
      label(40, 20, 'move the CB\nback with\neach success'),
      label(88, 33, 'one ball\ngap', { anchor: 'start' }),
      label(78, 44, 'pocket the OB'),
      label(22, 42, 'you are allowed to scratch')
    ]
  }, 10, 'Pocket the OB. Progressive practice from CB position 4. Score = final CB position + successes at 7 (10 max).');

  const y2 = 5.5;
  const f2 = doc('bu-f2', 'F2 – Stop Shot Drill', 'Stop Shots', {
    cueBallPosition: { x: POS_X[4], y: y2 },
    ballPositions: [{ n: 1, x: 93.2, y: 4.2 }],
    targetBall: 1,
    tableMarks: [
      ...posLabels(),
      ...posGhosts(y2, 4),
      { type: 'ghost', x: 93.2, y: 4.2 },
      { type: 'spot', x: 90.2, y: 8.2, r: 0.7, color: '#1a1a1a' },
      arrow(POS_X[4] + 2, y2, 91.5, y2, '#1a1a1a', false),
      path([{ x: 90.2, y: 8.2 }, { x: 93.2, y: 4.2 }], '#1a1a1a', false),
      arrow(94.6, 4.2, 99, 2.2, '#f5c542', false),
      arrow(46, 14, 40, 14, '#1a1a1a', false),
      label(38, 18, 'move the CB\nback with\neach success'),
      label(78, 12, 'stop the CB within\na ball of the\nghost-ball position', { anchor: 'start' }),
      label(78, 22, 'the OB is at the\nhalf-diamond\nposition', { anchor: 'start' })
    ]
  }, 10, 'Pocket the OB and stop the CB so it overlaps the ghost-ball outline. CB may hit the cushion.');

  const y3 = 8;
  const f3 = doc('bu-f3', 'F3 – Follow Shot Drill', 'Follow', {
    cueBallPosition: { x: POS_X[4], y: y3 },
    ballPositions: [{ n: 1, x: POS_X[4] + 12.5, y: y3 }],
    targetBall: 1,
    tableMarks: [
      ...posLabels(),
      ...posGhosts(y3, 4),
      { type: 'paper', x: 91.2, y: 0.6, w: 8.2, h: 11, color: '#f7f7f7' },
      path([{ x: POS_X[4] + 14, y: y3 }, { x: 95, y: 5 }, { x: 99, y: 2 }], '#f5c542', true),
      arrow(POS_X[4] + 2, y3, POS_X[4] + 10, y3, '#1a1a1a', false),
      arrow(44, 16, 38, 16, '#1a1a1a', false),
      label(36, 20, 'move the CB\nand OB back with\neach success'),
      label(78, 18, 'follow to\nthe target\nwithout\nscratching', { anchor: 'start' }),
      label(62, 16, 'the CB may\noverlap the target')
    ]
  }, 10, 'Pocket the OB and leave the CB within or overlapping the paper target. CB and OB stay 1 diamond apart.');

  const f4 = doc('bu-f4', 'F4 – Draw Shot Drill', 'Draw', {
    cueBallPosition: { x: POS_X[4], y: 8 },
    ballPositions: [{ n: 1, x: 93.5, y: 4.2 }],
    targetBall: 1,
    tableMarks: [
      ...posLabels(),
      ...posGhosts(8, 5),
      { type: 'rect', x: 50, y: 1.2, w: 25, h: 11.2, fill: true, color: '#f4f7fb' },
      { type: 'ghost', x: 51.6, y: 2.2 },
      { type: 'ghost', x: 73.4, y: 2.2 },
      { type: 'ghost', x: 51.6, y: 11.2 },
      { type: 'ghost', x: 73.4, y: 11.2 },
      { type: 'ghost', x: 93.5, y: 4.2 },
      { type: 'spot', x: 88, y: 9.5, r: 0.65, color: '#1a1a1a' },
      arrow(58, 6, 48, 6, '#1a1a1a', false),
      arrow(44, 16, 38, 16, '#1a1a1a', false),
      label(28, 10, 'draw the CB back into\nthe fixed 2x1 diamond\nrectangle', { anchor: 'start' }),
      label(34, 20, 'move the CB\nback with\neach success'),
      label(70, 18, 'the CB center\nmust end up\nwithin the rectangle', { anchor: 'start' }),
      label(80, 26, 'corners marked\nwith donuts', { anchor: 'start' }),
      label(80, 8, 'the OB is at the\nhalf-diamond\nposition', { anchor: 'start' })
    ]
  }, 10, 'Pocket the OB and draw the CB so its center finishes inside the fixed 2×1 diamond rectangle by the side pocket.');

  const f5 = doc('bu-f5', 'F5 – Stun Shot Drill', 'Stun', {
    cueBallPosition: { x: 36, y: 16 },
    ballPositions: [{ n: 1, x: 50, y: 27.25 }],
    targetBall: 1,
    tableMarks: [
      { type: 'rect', x: 58, y: 13.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 1 },
      { type: 'rect', x: 70.5, y: 13.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 2 },
      { type: 'rect', x: 83, y: 13.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 3 },
      { type: 'paper', x: 91.3, y: 19.5, w: 8.4, h: 11, color: '#f7f7f7', n: 4 },
      { type: 'rect', x: 83, y: 28.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 5 },
      { type: 'rect', x: 70.5, y: 28.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 6 },
      { type: 'rect', x: 58, y: 28.5, w: 9, h: 8, dashed: true, color: '#f4f7fb', n: 7 },
      path([{ x: 50, y: 29 }, { x: 50, y: 49 }], '#f5c542', true),
      label(22, 12, 'CB in hand\nfor each shot', { anchor: 'start' }),
      label(28, 24, 'the OB is one ball\nbelow the table center', { anchor: 'start' }),
      label(28, 36, 'leave the CB in or over the target\nat each numbered position', { anchor: 'start' }),
      label(62, 8, 'target location\nfor positions 1 and 7', { size: 1.7 }),
      label(75, 8, 'target location\nfor positions 2 and 6', { size: 1.7 }),
      label(90, 14, 'target location\nfor position 4', { size: 1.7, anchor: 'start' }),
      label(74, 40, 'positions 5, 6, and 7 require\nrebound off the end rail', { size: 1.7 }),
      label(86, 36, 'the CB may\noverlap the target', { size: 1.7, anchor: 'start' })
    ]
  }, 10, 'Pocket the OB and leave the CB in or over the numbered target. The target moves; the CB is in hand.');

  const CBu = { x: 25, y: 12.5 };
  const CBl = { x: 25, y: 37.5 };
  const f6shots = [
    { n: 1, color: '#3ec6ef', pts: [CBu, { x: 33, y: 8 }, { x: 50, y: 1.5 }] },
    { n: 2, color: '#3ec6ef', pts: [CBu, { x: 39, y: 9 }, { x: 50, y: 2.2 }] },
    { n: 3, color: '#1a1a1a', pts: [CBu, { x: 50, y: 25 }] },
    { n: 4, color: '#1a1a1a', pts: [CBu, { x: 50, y: 25 }, { x: 50, y: 48 }] },
    { n: 5, color: '#c43b4e', pts: [CBu, { x: 50, y: 25 }, { x: 75, y: 25 }] },
    { n: 6, color: '#3ec6ef', pts: [CBl, { x: 33, y: 42 }, { x: 50, y: 48.5 }] },
    { n: 7, color: '#3ec6ef', pts: [CBl, { x: 39, y: 41 }, { x: 50, y: 47.5 }] },
    { n: 8, color: '#7a4ea3', pts: [CBl, { x: 75, y: 25 }, { x: 98, y: 47 }] },
    { n: 9, color: '#1a1a1a', pts: [CBl, { x: 50, y: 25 }, { x: 50, y: 2 }] },
    { n: 10, color: '#c43b4e', pts: [CBl, { x: 75, y: 25 }, { x: 98, y: 4 }] }
  ];
  const f6 = doc('bu-f6', 'F6 – Ball Pocketing Drill', 'Ball Pocketing', {
    cueBallPosition: CBu,
    extraCueBalls: [CBl],
    ballPositions: [
      { n: 2, x: 33, y: 8 },
      { n: 3, x: 39, y: 10 },
      { n: 1, x: 50, y: 25 },
      { n: 6, x: 75, y: 25 },
      { n: 4, x: 33, y: 42 },
      { n: 5, x: 39, y: 40 }
    ],
    targetBall: 1,
    tableMarks: [
      { type: 'grid' },
      path([{ x: 50, y: 0 }, { x: 50, y: 50 }], '#1a1a1a', true),
      ...f6shots.flatMap((s) => [
        path(s.pts, s.color, true, s.n),
        label(s.pts[s.pts.length - 1].x + (s.n >= 6 ? 1.5 : -1.2), s.pts[Math.min(1, s.pts.length - 1)].y, String(s.n), { color: s.color, size: 1.8, anchor: 'start' })
      ]),
      label(16, 22, 'pocket all\n10 shots', { anchor: 'start' })
    ]
  }, 10, 'Five shots from each cue-ball position, one attempt each, in the numbered order. No scratch. Score = balls pocketed (10 max).');

  const f7balls = [
    railBall(1, 63, 3.2), railBall(2, 73, 3.2), railBall(3, 83, 3.2), railBall(4, 93, 3.4),
    railBall(5, 96.6, 12), railBall(6, 96.6, 22), railBall(7, 96.6, 33),
    railBall(8, 96.2, 44), railBall(9, 82, 46.6), railBall(10, 66, 46.6)
  ];
  const ob7 = { x: 50, y: 7 };
  const f7 = doc('bu-f7', 'F7 – Wagon Wheel Drill', 'PKF · Cue Ball Control', {
    cueBallPosition: { x: 44, y: 16 },
    ballPositions: f7balls,
    targetBall: 1,
    tableMarks: [
      { type: 'spot', x: ob7.x, y: ob7.y, r: 1.125, color: '#111111' },
      { type: 'wheel', x: 18, y: 30, r: 8 },
      label(18, 41, 'wagon wheel drill'),
      label(43, 6.2, 'OB', { size: 1.8, anchor: 'end' }),
      label(30, 14, 'CB in hand\nfor each shot', { anchor: 'start' }),
      arrow(50, 5.6, 50, 1.2, '#1a1a1a', false),
      ...f7balls.map((b) => path([ob7, { x: b.x, y: b.y }], ['#f5c542', '#3b82f6', '#ef4444', '#7c3aed', '#f97316', '#16a34a', '#a16207', '#111827', '#eab308', '#2563eb'][b.n - 1], false, b.n))
    ]
  }, 20, 'Pocket the OB and hit the current rail target. 2 attempts at each of 10 targets (20 max). Rail-first next to the target is allowed.');

  const f8 = doc('bu-f8', 'F8 – Grid Target Drill', 'Cue-Ball Position', {
    cueBallPosition: { x: 30, y: 32 },
    ballPositions: [{ n: 1, x: 18, y: 20 }],
    targetBall: 1,
    tableMarks: [
      { type: 'grid' },
      { type: 'rect', x: 16, y: 3, w: 14, h: 12, color: '#d7e2ea', n: 1 },
      { type: 'rect', x: 68, y: 3, w: 14, h: 12, color: '#d7e2ea', n: 2 },
      { type: 'rect', x: 68, y: 34, w: 14, h: 12, color: '#d7e2ea', n: 3 },
      { type: 'rect', x: 42, y: 20, w: 12, h: 11, color: '#d7e2ea', n: 4 },
      { type: 'rect', x: 16, y: 34, w: 14, h: 12, color: '#d7e2ea', n: 5 },
      { type: 'ghost', x: 14.2, y: 14.2 },
      path([{ x: 16, y: 17 }, { x: 4, y: 4 }], '#f5c542', true),
      arrow(20, 18, 14, 12, '#1a1a1a', false),
      label(55, 14, 'pocket the OB and\nleave the CB in or over\neach target', { anchor: 'start' }),
      label(40, 28, 'the CB may\noverlap the\ntarget', { anchor: 'start' }),
      { type: 'spot', x: 78, y: 26, r: 0.45, color: '#1a1a1a' }
    ]
  }, 20, 'Pocket the 1-ball and leave the CB in or overlapping each numbered box. 4 attempts at each of 5 targets (20 max). Any path.');

  return [f1, f2, f3, f4, f5, f6, f7, f8];
}

let docsCache = null;
export function buDocs() {
  if (!docsCache) {
    docsCache = buildDocs();
    for (const d of docsCache) {
      const v = validatePooliq(JSON.stringify(d));
      if (!v.ok) throw new Error(`BU ${d.id}: ${v.errors.join(' | ')}`);
    }
  }
  return docsCache;
}

let drillsCache = null;
export function buDrills() {
  if (!drillsCache) {
    drillsCache = buDocs().map((raw) => {
      const v = validatePooliq(JSON.stringify(raw));
      const ch = challengeFromPkfDoc(v.doc);
      delete ch.level;
      delete ch.speed;
      ch.buExam = true;
      ch.xp = 0;
      ch.pq = { rankXpEligible: false };
      ch.prerequisites = [];
      ch.credit = BU_CREDIT;
      ch.instructions = TEXT[ch.id];
      ch.goal = raw.description;
      return ch;
    });
  }
  return drillsCache;
}

export function isBuId(id) {
  return BU_ORDER.includes(id);
}

export function buMeta(id) {
  const i = BU_ORDER.indexOf(id);
  return {
    id,
    index: i,
    max: id === 'bu-f7' || id === 'bu-f8' ? 20 : 10,
    kind: id === 'bu-f6' ? 'pocket' : id === 'bu-f7' ? 'wagon' : id === 'bu-f8' ? 'grid' : 'progressive',
    next: i >= 0 && i < 7 ? BU_ORDER[i + 1] : null
  };
}

export function newRun(id) {
  const meta = buMeta(id);
  if (meta.kind === 'progressive') return { pos: 4, shots: 0, at7: 0, done: false, score: null, live: 4, guaranteed: false, log: [] };
  if (meta.kind === 'pocket') return { shot: 1, pocketed: 0, shots: 0, done: false, score: 0, log: [] };
  if (meta.kind === 'wagon') return { target: 1, attempt: 1, score: 0, shots: 0, cleared: [], done: false, log: [] };
  return { target: 1, attempt: 1, score: 0, shots: 0, done: false, log: [] };
}

function clampPos(n) { return Math.max(1, Math.min(7, n)); }

function worstScore(pos, at7, remain) {
  let p = pos;
  for (let i = 0; i < remain; i++) if (p > 1) p -= 1;
  return Math.min(10, p + at7);
}

export function applyShot(id, run, success) {
  const meta = buMeta(id);
  const next = { ...run, log: run.log.slice(), cleared: run.cleared ? run.cleared.slice() : undefined };
  if (next.done) return next;
  if (meta.kind === 'progressive') {
    const pos = next.pos;
    if (success) {
      if (pos >= 7) next.at7 += 1;
      else next.pos = pos + 1;
    } else if (pos > 1) next.pos = pos - 1;
    next.shots += 1;
    next.live = Math.min(10, next.pos + next.at7);
    const remain = 10 - next.shots;
    next.guaranteed = remain > 0 && worstScore(next.pos, next.at7, remain) >= 10;
    next.done = next.shots >= 10 || false;
    next.log.push({ success, pos: next.pos });
    if (next.done) next.score = next.live;
    return next;
  }
  if (meta.kind === 'pocket') {
    next.shots += 1;
    if (success) next.pocketed += 1;
    next.score = next.pocketed;
    next.shot = Math.min(10, next.shots + 1);
    next.done = next.shots >= 10;
    next.log.push({ success, shot: next.shots });
    return next;
  }
  if (meta.kind === 'wagon') {
    next.shots += 1;
    if (success) {
      next.score += 1;
      if (!next.cleared.includes(next.target)) next.cleared.push(next.target);
    }
    if (next.attempt >= 2) {
      next.attempt = 1;
      next.target += 1;
    } else next.attempt += 1;
    next.done = next.shots >= 20;
    next.log.push({ success, target: next.target, attempt: next.attempt });
    return next;
  }
  next.shots += 1;
  if (success) next.score += 1;
  if (next.attempt >= 4) {
    next.attempt = 1;
    next.target += 1;
  } else next.attempt += 1;
  next.done = next.shots >= 20;
  next.log.push({ success });
  return next;
}

export function stopEarly(run) {
  if (!run || run.done || !run.guaranteed) return run;
  return { ...run, done: true, score: Math.min(10, run.live ?? (run.pos + run.at7)) };
}

export function undoRun(id, run) {
  if (!run?.log?.length) return newRun(id);
  const log = run.log.slice(0, -1);
  let cur = newRun(id);
  for (const step of log) cur = applyShot(id, cur, step.success);
  return cur;
}

function mirrorX(x) { return Math.round((100 - x) * 100) / 100; }
function mirrorPoint(p) { return p ? { ...p, x: mirrorX(p.x) } : p; }

export function present(ch, run, mirror = false) {
  const d = JSON.parse(JSON.stringify(ch));
  const id = d.id;
  const r = run || newRun(id);
  if (['bu-f1', 'bu-f2', 'bu-f3', 'bu-f4'].includes(id)) {
    const y = d.cueBallPosition.y;
    d.cueBallPosition = { x: POS_X[r.pos] || 50, y };
    if (id === 'bu-f3') {
      const ob = (d.ballPositions || [])[0];
      if (ob) ob.x = Math.max(R, Math.min(100 - R, (POS_X[r.pos] || 50) + 12.5));
    }
  }
  if (id === 'bu-f5') {
    for (const m of d.tableMarks || []) if ((m.type === 'rect' || m.type === 'paper') && m.n != null) {
      m.hot = m.n === r.pos;
      m.dim = m.n !== r.pos;
    }
  }
  if (id === 'bu-f6') {
    for (const m of d.tableMarks || []) if (m.n != null) {
      m.hot = m.n === r.shot;
      m.dim = m.n !== r.shot;
    }
  }
  if (id === 'bu-f7') {
    const gone = new Set(r.cleared || []);
    d.ballPositions = (d.ballPositions || []).filter((b) => !gone.has(b.n));
    for (const m of d.tableMarks || []) if (m.n != null) {
      m.dim = gone.has(m.n) || (r.target && m.n !== r.target);
      m.hot = m.n === r.target;
    }
  }
  if (id === 'bu-f8') {
    for (const m of d.tableMarks || []) if (m.type === 'rect' && m.n != null) {
      m.hot = m.n === r.target;
      m.dim = m.n !== r.target;
    }
  }
  if (mirror) {
    d.cueBallPosition = mirrorPoint(d.cueBallPosition);
    d.ballPositions = (d.ballPositions || []).map(mirrorPoint);
    d.extraCueBalls = (d.extraCueBalls || []).map(mirrorPoint);
    for (const m of d.tableMarks || []) {
      if ((m.type === 'rect' || m.type === 'paper') && m.w != null) m.x = mirrorX(m.x + m.w);
      else if (m.x != null) m.x = mirrorX(m.x);
      if (m.x1 != null) m.x1 = mirrorX(m.x1);
      if (m.x2 != null) m.x2 = mirrorX(m.x2);
      if (m.points) m.points = m.points.map(mirrorPoint);
    }
  }
  return d;
}

export function statusLine(id, run) {
  const meta = buMeta(id);
  if (meta.kind === 'progressive') {
    const what = id === 'bu-f5' ? 'Target' : 'CB';
    let extra = '';
    if ((id === 'bu-f2' || id === 'bu-f4') && run.pos === 1) extra = ' Position 1: CB may sit anywhere between 1 and 2.';
    if (id === 'bu-f5') {
      if (run.pos <= 3) extra = ' CB goes straight to the target. No cushion.';
      else if (run.pos === 4) extra = ' Cushion contact is allowed, not required.';
      else extra = ' CB must rebound off the end rail.';
    }
    return `${what} position ${run.pos} · shot ${Math.min(run.shots + 1, 10)} of 10 · score ${run.done ? run.score : run.live}${run.at7 ? ` · bonus ${run.at7}` : ''}${extra}`;
  }
  if (meta.kind === 'pocket') {
    const from = run.shot <= 5 ? 'upper CB' : 'lower CB';
    return `Shot ${Math.min(run.shot, 10)} of 10 · ${from} · pocketed ${run.score} · no scratch`;
  }
  if (meta.kind === 'wagon') return `Target ${Math.min(run.target, 10)} · attempt ${run.attempt} of 2 · score ${run.score} / 20`;
  return `Target ${Math.min(run.target, 5)} · attempt ${run.attempt} of 4 · score ${run.score} / 20`;
}

export function shotButtons(id) {
  if (id === 'bu-f1') return ['POCKETED', 'MISS'];
  if (id === 'bu-f2') return ['IN THE GHOST', 'MISS'];
  if (id === 'bu-f3') return ['IN THE PAPER', 'MISS'];
  if (id === 'bu-f4') return ['IN THE BOX', 'MISS'];
  if (id === 'bu-f5') return ['IN THE TARGET', 'MISS'];
  if (id === 'bu-f6') return ['POCKETED', 'MISS OR SCRATCH'];
  if (id === 'bu-f7') return ['HIT TARGET', 'MISS'];
  return ['IN THE BOX', 'MISS'];
}

export function emptyExam() {
  return { scores: {}, completed: null };
}

export function examOf(state) {
  const e = state?.buExam;
  if (!e || typeof e !== 'object') return emptyExam();
  return { scores: { ...(e.scores || {}) }, completed: e.completed || null };
}

/** Record one finished exam-mode drill. Does not touch other stats. Completes only when all 8 have exam scores. */
export function withExamScore(state, id, score, max) {
  const e = examOf(state);
  const prev = e.scores[id];
  e.scores[id] = { score, max, at: new Date().toISOString(), ...(prev && prev.score > score ? { best: prev.score } : {}) };
  if (prev && prev.score > score) e.scores[id].score = prev.score;
  const done = BU_ORDER.every((k) => e.scores[k] && Number.isFinite(e.scores[k].score));
  if (done) {
    e.completed = {
      name: BU_EXAM_NAME,
      at: e.completed?.at || new Date().toISOString(),
      credit: BU_CREDIT,
      scores: BU_ORDER.map((k) => ({ id: k, score: e.scores[k].score, max: e.scores[k].max }))
    };
  }
  return { ...state, buExam: e };
}

export function accomplishmentHTML(state) {
  const e = examOf(state);
  let html = '';
  if (e.completed) {
    const rows = e.completed.scores.map((s) => `<span>${s.id.replace('bu-', '').toUpperCase()} ${s.score}/${s.max}</span>`).join('');
    const total = e.completed.scores.reduce((a, s) => a + s.score, 0);
    const max = e.completed.scores.reduce((a, s) => a + s.max, 0);
    html = `<div class="card" data-bu-exam="done"><div class="eyebrow">BILLIARD UNIVERSITY</div><h3>${BU_EXAM_NAME}</h3><p>Completed. ${total} / ${max}</p><p class="muted small buScores">${rows}</p><small class="muted credit">${BU_CREDIT}</small></div>`;
  }
  return html + skillsAccomplishmentHTML(state);
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function examPageHTML(state, which) {
  if (which === 'bachelors' || which === 'doctorate') return skillsExamPageHTML(state, which);
  const e = examOf(state);
  const rows = BU_ORDER.map((id, i) => {
    const d = buDrills().find((x) => x.id === id);
    const sc = e.scores[id];
    return `<button type="button" class="stageRow card" data-action="go" data-href="#play/drills/${id}/exam"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>${esc(String(d.category).replace(/^\s*PKF\b[\s·:\-–—]*/i, ''))}${sc ? ` · exam ${sc.score}/${sc.max}` : ''}</small></span></button>`;
  }).join('');
  const done = e.completed ? `<p class="green">Completed ${BU_EXAM_NAME}. Scores stay in your profile.</p>` : '<p class="muted">Finish all eight under these exam rules to record the accomplishment. Opening a drill is not enough. This does not change Career rank or Ball Pocketing level.</p>';
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">BILLIARD UNIVERSITY</span><h1>${BU_EXAM_NAME}</h1><p>Dr. Dave's first exam. Eight drills, in order. Any drill can be done from the other side of the table. ${BU_CREDIT}</p></div>
    <div class="card">${done}<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/bu-f1/exam">START AT F1</button></div>
    <div class="stageList" data-bu-list="1">${rows}</div>`;
}

export function examBannerHTML() {
  return `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#buexam" data-bu-entry="1"><span class="simPromoText"><span class="eyebrow">BILLIARD UNIVERSITY</span><b>${BU_EXAM_NAME}</b><small>F1–F8 · Dr. Dave. Also in each drill's category. Not a Career rank.</small></span><span class="simPromoGo">›</span></button>` + skillsBannersHTML();
}
