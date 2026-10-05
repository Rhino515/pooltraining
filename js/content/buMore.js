/**
 * Billiard University exams added after Exam I and Exam II Bachelors/Doctorate.
 * Exam II Masters lives in buExam2.js. Diagrams are cropped table photos in images/bu/.
 * These drills are not on the All list and not in shot categories. No Career Rank XP.
 * Scoring a drill writes that result onto this exam's sheet. Nothing is retyped.
 * Source: Billiard University / Dr. Dave, billiarduniversity.org. No BU logo.
 */
import { challengeFromPkfDoc } from './pkfBuiltins.js';
import { validatePooliq } from './schema.js';
import { restartAskHTML } from './buExam2.js';
import { devBypass } from '../dev/gate.js';

export const MORE_CREDIT = 'Billiard University / Dr. Dave — billiarduniversity.org';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const bullet = (s) => `• ${s}`;

const E3 = `Instructions:
${bullet('Attempt each of the 25 shots in this document (A1 – A25).')}
${bullet('You get 4 points for success on the 1st attempt, 2 points for 2nd attempt, or 1 point for the 3rd attempt.')}
${bullet('To get points, the attempt must be a legal shot with no scratch or foul (unless indicated otherwise).')}
${bullet('The maximum total number of points is 100.')}
${bullet('Any shot can be done from the other side of the table (e.g., if it is easier to reach for a left-handed vs. right-handed player).')}
${bullet('The shots must be done one after another, in order, with no practice between the shots or attempts.')}
${bullet('For shots where there is a choice (A5 and A17), you can shoot either shot for any of the attempts. You are not required to shoot both.')}

Shot Score:
4 points for success on the 1st attempt
2 points for success on the 2nd attempt
1 point for success on the 3rd attempt`;

const A_NAMES = [
  'A1 – Spot Shot From Head Rail',
  'A2 – Spot Shot With Break Out',
  'A3 – Spot Shot With Inside',
  'A4 – Power Follow Shot',
  'A5 – Banana Shot',
  'A6 – Straight Power Draw',
  'A7 – Power Draw off Side Rail',
  'A8 – Power Draw with Side',
  'A9 – Inside Draw for Position',
  'A10 – Ball-First Inside Follow',
  'A11 – Ball-First Outside Draw',
  'A12 – Steep Rail Cut',
  'A13 – Rail-First Spin across Table',
  'A14 – Inside across the Table',
  'A15 – Three-Rail Kick',
  'A16 – One-Pocket Frozen Spot Shot',
  'A17 – One-Pocket Foot Spot Bank off Head Rail',
  'A18 – Hop on Cushion Nose for Shape',
  'A19 – Short, High Jump',
  'A20 – Jump Draw',
  'A21 – Jump over Obstacles with Draw',
  'A22 – Hop off Cushion Nose',
  'A23 – Massé Kick',
  'A24 – Large Curve Massé',
  'A25 – After-Collision Massé'
];

const E5 = `Instructions:
${bullet('PPC consists of the eighteen 9-ball and 8-ball runout layouts from the Bachelor, Master, and Doctorate versions of BU Exam II.')}
${bullet('You are required to consecutively attempt to run each of the 18 layouts in order. Each layout runout attempt ends with a miss or foul.')}
${bullet('For scoring, you start with 100 points and deduct points for any balls not pocketed legally.')}
${bullet('A perfect score of 100 requires 108 straight shots with no misses.')}
${bullet('Standard WPA rules apply, with CB fouls only.')}
${bullet('With any 9-ball layout, standard rules apply so slop counts as long as you hit the lowest numbered ball first with a legal hit, and pocketing the 9 at any time with a legal shot is a win giving you credit for all balls in that layout.')}
${bullet('Balls pocketed on a runout-ending foul shot (e.g., a scratch) do not count.')}
${bullet('The challenge can be done on any standard-size pool table (6’, 7’, 8’, 9’, 10’).')}

Layout Deduction:
# of balls not pocketed legally before a miss or foul

Total Score (max = 100):
100 − total deductions`;

const PPC = [
  '1 – Bachelor 9-ball layout 1',
  '2 – Bachelor 9-ball layout 2',
  '3 – Bachelor 9-ball layout 3',
  '4 – Bachelor 8-ball layout 1',
  '5 – Bachelor 8-ball layout 2',
  '6 – Bachelor 8-ball layout 3',
  '7 – Master 9-ball layout 1',
  '8 – Master 9-ball layout 2',
  '9 – Master 9-ball layout 3',
  '10 – Master 8-ball layout 1',
  '11 – Master 8-ball layout 2',
  '12 – Master 8-ball layout 3',
  '13 – Doctorate 9-ball layout 1',
  '14 – Doctorate 9-ball layout 2',
  '15 – Doctorate 9-ball layout 3',
  '16 – Doctorate 8-ball layout 1',
  '17 – Doctorate 8-ball layout 2',
  '18 – Doctorate 8-ball layout 3'
];

const SAF_SCORE = `Scoring:
If you hide the CB from the OB, the shot is good (mark “yes”).
If you do not, the shot is not good (mark “no”).

Total Score (max = 100) = 2.5 x (40 − total # of misses)`;

const SAF = [
  '1 – Stop and hide (9-ball):',
  '2 – Two-way, three-rail bank and hide (9-ball):',
  '3 – Roll up and snuggle (9-ball):',
  '4 – Equal-separation hide behind blockers (8-ball):',
  '5 – Equal-separation to opposite rails (9-ball):',
  '6 – Equal-separation straddle hide (9-ball):',
  '7 – Equal-separation self-hide (8-ball):',
  '8 – Short-bridge half-ball-hit hide (8-ball):',
  '9 – Short-bridge full-ball-hit hide (8-ball):',
  '10 – Short-bridge thin-hit lock-up hide (8-ball):',
  '11 – Separate and hide close to long rail (9-ball):',
  '12 – Come into the line of blockers (8-ball):',
  '13 – Thin-hit hide (8-ball):',
  '14 – Send ball straight down table with natural-angle hide (9-ball):',
  '15 – Send ball straight down table with inside-spin hold and hide (9-ball):',
  '16 – Kick-and-stick hide (9-ball):',
  '17 – Draw to hide (9-ball):',
  '18 – Stun hide off two rails (9-ball):',
  '19 – Rail-first thin hide (9-ball):',
  '20 – Tickie hide (9-ball):'
];

const RDS_INTRO = `RDS consists of a set of 16 break-and-run challenges of increasing levels of difficulty.

You start with a break shot and then take ball in hand (BIH), meaning you can place the CB anywhere you want on the table. There is no penalty for a scratch on the break, and balls pocketed on the break remain down.

RDS is progressive and adaptive. When you do well, the level gets harder; and when you do poorly, the level gets easier. If you run 2 out of 3 racks at one level, where you make all the required balls without a miss or foul, you go to the next higher level. If you run only 1 of 3, you stay at the current level. And if you do not run any of the 3, you go down to the next lower level. If you are trying RDS for the first time, pick a level at which you are confident to run 2 out of 3 racks and start there; otherwise, start where you left off in your previous RDS session. After a practice session, your ending level and associated rating should be a decent indicator of your level of playing ability.

An alternative RDS format is a scored approach, where you start with 100 points and attempt to run one rack at each level, deducting points left on the table after a miss or foul. I call it RDS 100 and it was adopted by the Billiard University (BU) as one of its Playing-Ability Exams (Exam IV).

This set plays the progressive version. Record 3 racks. The next level stays locked until the level before it is passed.`;

export const RDS_RATINGS = [
  'lower novice',
  'mid novice',
  'upper novice',
  'lower beginner (D-)',
  'mid beginner (D)',
  'upper beginner (D+)',
  'lower intermediate (C-)',
  'mid intermediate (C)',
  'upper intermediate (C+)',
  'lower advanced (B-)',
  'mid advanced (B)',
  'upper advanced (B+)',
  'lower shortstop (A-)',
  'upper shortstop (A)',
  'semipro / pro (A+/AA)',
  'world class pro (A++/AAA)'
];

const RDS_SHARED = [
  'You start with a break shot and then take ball in hand (BIH), meaning you can place the CB anywhere you want on the table.',
  'There is no penalty for a scratch on the break, and balls pocketed on the break remain down.'
];

const RDS = [
  ['Level 1 – 6 balls, pocket OBs directly with no CB', ['break a rack of 6 balls.', 'remove the cue ball.', 'pocket each object ball directly, in any order.', 'wipe chalk marks off the balls when done.']],
  ['Level 2 – 6 balls, any order, BIH on every shot', ['break a rack of 6 balls.', 'take cue ball in hand for each shot.', 'pocket each ball in any order.']],
  ['Level 3 – 6 balls, any order, 3 extra BIHs', ['break a rack of 6 balls.', 'take cue ball in hand after the break and any 3 other times during the run.', 'pocket each ball in any order.']],
  ['Level 4 – 6 balls, any order, 2 extra BIHs', ['break a rack of 6 balls.', 'take cue ball in hand after the break and any 2 other times during the run.', 'pocket each ball in any order.']],
  ['Level 5 – 6 balls, any order, 1 extra BIH', ['break a rack of 6 balls.', 'take cue ball in hand after the break and once any time during the run.', 'pocket each ball in any order.']],
  ['Level 6 – 7 balls (3 solids, 3 stripes, 8), 8-ball rules, 1 extra BIH', ['break a rack of 6 balls (3 solids, 3 stripes) with the 8 ball added (in the center or back).', 'play standard 8-ball rules, except take cue ball in hand after the break.', 'pocket all the stripes or all the solids, and then the 8.']],
  ['Level 7 – 9 balls, any order, 1 extra BIH', ['break a rack of 9 balls.', 'take cue ball in hand after the break and once any time during the run.', 'pocket each ball in any order.']],
  ['Level 8 – 9 balls (4 solids, 4 stripes, 8), 8-ball rules, 1 extra BIH', ['break a rack of 9 balls (4 solids, 4 stripes, with the 8 ball in the center).', 'play standard 8-ball rules, except take cue ball in hand after the break.', 'pocket all the stripes or all the solids, and then the 8.']],
  ['Level 9 – 15 balls, any order, 2 extra BIHs', ['break a rack of 15 balls.', 'take cue ball in hand after the break and any 2 other times during the run.', 'pocket each ball in any order.']],
  ['Level 10 – 6 balls, in order', ['break a rack of 6 balls.', 'take cue ball in hand after the break.', 'shoot the balls in rotation, always hitting the lowest-numbered ball 1st.']],
  ['Level 11 – 15 balls, any order', ['break a rack of 15 balls.', 'take cue ball in hand after the break.', 'pocket each ball in any order.']],
  ['Level 12 – 8-ball rules', ['break a rack of 15 balls.', 'play standard 8-ball rules, except take cue ball in hand after the break.', 'pocket all the stripes or all the solids, and then the 8.']],
  ['Level 13 – 9 balls (4 solids, 4 stripes, 8), 8-ball rules, remaining balls in order', ['break a rack of 9 balls (4 solids, 4 stripes, with the 8 ball in the center).', 'play standard 8-ball rules, except take cue ball in hand after the break.', 'pocket all the stripes or all the solids, and then the 8.', 'then pocket the remaining balls in rotation, always hitting the lowest-numbered ball 1st.']],
  ['Level 14 – 9 balls, 9-ball rules', RDS_SHARED.slice()],
  ['Level 15 – 15 balls, 8-ball rules, remaining balls in order', RDS_SHARED.slice()],
  ['Level 16 – 15 balls, in order', RDS_SHARED.slice()]
];

/**
 * Progressive RDS, from the October 2020 article:
 * 2 out of 3 (or 3 out of 3) goes to the next higher level.
 * 1 of 3 stays. 0 of 3 goes down. There is no level above 16 or below 1.
 */
export function rdsOutcome(runs, level) {
  const n = Math.max(0, Math.min(3, Number(runs) || 0));
  const lv = Math.max(1, Math.min(16, Number(level) || 1));
  let move;
  let next;
  if (n >= 2) {
    move = 'up';
    next = Math.min(16, lv + 1);
  } else if (n === 1) {
    move = 'stay';
    next = lv;
  } else {
    move = 'down';
    next = Math.max(1, lv - 1);
  }
  const rule = move === 'up'
    ? 'You go to the next higher level.'
    : move === 'stay'
      ? 'You stay at the current level.'
      : 'You go down to the next lower level.';
  return {
    runs: n,
    level: lv,
    move,
    next,
    passed: move === 'up',
    line: `${n} out of 3. ${rule}`,
    rating: RDS_RATINGS[next - 1]
  };
}

export function rdsProgress(exam) {
  const sets = Array.isArray(exam?.sets) ? exam.sets : [];
  const passed = new Set();
  for (const row of sets) {
    if (row && Number(row.runs) >= 2) passed.add(Number(row.level));
  }
  let unlocked = 1;
  while (unlocked < 16 && passed.has(unlocked)) unlocked += 1;
  const asked = Math.max(1, Math.min(16, Number(exam?.current) || 1));
  return { sets, passed, unlocked, current: Math.min(asked, unlocked) };
}

const E7 = `Instructions:
${bullet('Pocket the OB and draw the CB back from four different CB-OB distances (1-4 diamonds) to four different draw distances (1-4 diamonds).')}
${bullet('Take three shots at each CB position and draw distance, with each successful shot worth 1 point.')}
${bullet('Place the CB and OB anywhere you want along the diamond lines within one diamond of the side rail, with the OB on the foot string for all shots.')}
${bullet('You must draw back so the center of CB is within a ½ diamond of the target distance.')}
${bullet('The CB can come off the side rail, but the center of the CB must remain within one diamond of the side rail.')}

Total Score (max: 100) =
# of successful shots (max: 48) x 25/12 (factor to scale max score to 100)`;

const E8 = `Instructions:
${bullet('Pocket the OB and follow the CB forward from five different CB-OB distances (1-5 diamonds) to five different follow distances (1-5 diamonds).')}
${bullet('Take three shots at each CB position and follow distance, with each successful shot worth 1 point.')}
${bullet('Place the CB and OB anywhere you want along the diamond lines within one diamond of the side rail, with the CB on the head string for all shots.')}
${bullet('You must follow forward so the center of CB is within a ½ diamond of the target distance.')}
${bullet('The CB can come off the side rail, but the center of the CB must remain within one diamond of the side rail.')}

Total Score (max: 100) =
# of successful shots (max: 75) x 4/3 (factor to scale max score to 100)`;

function rdsText(i) {
  const [title, lines] = RDS[i];
  return `${title}\n${RDS_RATINGS[i]}\n${lines.map(bullet).join('\n')}`;
}

function buildDrills() {
  const out = [];
  A_NAMES.forEach((name, i) => {
    const n = i + 1;
    out.push({ id: `bu-a${n}`, exam: 'advanced', n, name, kind: 'tries3', max: 4, text: E3, images: [`./images/bu/bu-a${n}.png`], buttons: ['SUCCESS', 'MISS'] });
  });
  RDS.forEach((row, i) => {
    const n = i + 1;
    out.push({ id: `bu-rds${n}`, exam: 'rds', n, name: row[0], kind: 'rack', max: 3, text: rdsText(i), images: [`./images/bu/bu-rds${n}.png`], buttons: ['RAN THE RACK', 'MISS OR FOUL'] });
  });
  PPC.forEach((name, i) => {
    const n = i + 1;
    out.push({ id: `bu-ppc${n}`, exam: 'ppc', n, name, kind: 'deduct', max: 15, text: `${name}\n\n${E5}`, images: [`./images/bu/bu-ppc${n}.png`], buttons: [] });
  });
  SAF.forEach((name, i) => {
    const n = i + 1;
    out.push({ id: `bu-saf${n}`, exam: 'safety', n, name, kind: 'yesno', max: 2, text: `${name}\n\n${SAF_SCORE}`, images: [`./images/bu/bu-saf${n}.png`], buttons: ['YES', 'NO'] });
  });
  out.push({ id: 'bu-draw', exam: 'draw', n: 1, name: 'BU Exam VII – Draw Matrix Drill', kind: 'matrix', rows: 4, cols: 4, factor: 25 / 12, rawMax: 48, max: 100, text: E7, images: ['./images/bu/bu-draw.png'], buttons: [] });
  out.push({ id: 'bu-follow', exam: 'follow', n: 1, name: 'BU Exam VIII – Follow Matrix Drill', kind: 'matrix', rows: 5, cols: 5, factor: 4 / 3, rawMax: 75, max: 100, text: E8, images: ['./images/bu/bu-follow.png'], buttons: [] });
  return out;
}

const DRILLS = buildDrills();
const BY_ID = Object.fromEntries(DRILLS.map((d) => [d.id, d]));

export const MORE_EXAMS = {
  advanced: { key: 'advanced', name: 'Exam III – Advanced Shots', stateKey: 'buExam3', href: '#buexam/advanced', start: 'bu-a1', blurb: 'A1–A25. 4 / 2 / 1 / 0 by attempt. Not on the All list. Not a Career rank.', intro: E3 },
  rds: { key: 'rds', name: 'Runout Drill System (RDS)', stateKey: 'buExam4', href: '#buexam/rds', start: 'bu-rds1', blurb: '16 levels. 2 out of 3 racks opens the next level. Not on the All list. Not a Career rank.', intro: RDS_INTRO },
  ppc: { key: 'ppc', name: 'Exam V – Placement Pool Challenge', stateKey: 'buExam5', href: '#buexam/ppc', start: 'bu-ppc1', blurb: 'Eighteen 9-ball and 8-ball layouts. Not on the All list. Not a Career rank.', intro: E5 },
  safety: { key: 'safety', name: 'Exam VI – Safety Challenge', stateKey: 'buExam6', href: '#buexam/safety', start: 'bu-saf1', blurb: '20 safeties, two tries each. Not the Safety Master book. Not on the All list.', intro: SAF_SCORE },
  draw: { key: 'draw', name: 'Exam VII – Draw Matrix', stateKey: 'buExam7', href: '#buexam/draw', start: 'bu-draw', blurb: 'Draw matrix. Not on the All list. Not a Career rank.', intro: E7 },
  follow: { key: 'follow', name: 'Exam VIII – Follow Matrix', stateKey: 'buExam8', href: '#buexam/follow', start: 'bu-follow', blurb: 'Follow matrix. Not on the All list. Not a Career rank.', intro: E8 }
};

export function isMoreId(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); }
export function moreMeta(id) {
  const d = BY_ID[id];
  if (!d) return null;
  const exam = MORE_EXAMS[d.exam];
  const order = DRILLS.filter((x) => x.exam === d.exam).map((x) => x.id);
  const i = order.indexOf(id);
  return { ...d, order, index: i, next: i >= 0 && i < order.length - 1 ? order[i + 1] : null, exam };
}
export function moreText(id) { return BY_ID[id]?.text || ''; }
export function moreImages(id) { return BY_ID[id]?.images || []; }

function docFor(s) {
  return {
    format: 'pooliq', schemaVersion: '1.0', contentType: 'drill', id: s.id, contentVersion: '1.0',
    title: s.name.slice(0, 80), description: s.text.split('\n').slice(0, 4).join(' ').slice(0, 240),
    category: 'Shot Making', difficulty: 2, skill: 'Shot Making', rankXpEligible: false,
    attribution: { sourceName: 'Billiard University', author: 'Dr. Dave', sourceURL: 'https://billiarduniversity.org' },
    shot: { kind: 'pot', speed: 2, cueContact: { vTips: 0, hTips: 0 }, cueBallPosition: { x: 25, y: 12.5 }, ballPositions: [{ n: 1, x: 75, y: 25 }], targetBall: 1, instructions: s.text.slice(0, 1500), goal: s.name },
    scoringRules: { mode: 'binary', attempts: s.kind === 'yesno' ? 2 : s.kind === 'tries3' ? 3 : 1, pass: { made: 1 } },
    xp: 0, skillEffects: { 'Shot Making': 1 }
  };
}

let drillsCache = null;
export function buMoreDrills() {
  if (!drillsCache) {
    drillsCache = DRILLS.map((s) => {
      const raw = docFor(s);
      const v = validatePooliq(JSON.stringify(raw));
      if (!v.ok) throw new Error(`BU ${s.id}: ${v.errors.join(' | ')}`);
      const ch = challengeFromPkfDoc(v.doc);
      delete ch.level; delete ch.speed;
      ch.buExam = true;
      ch.buMore = s.exam;
      ch.xp = 0;
      ch.pq = { rankXpEligible: false };
      ch.prerequisites = [];
      ch.credit = MORE_CREDIT;
      ch.instructions = s.text;
      ch.layouts = s.images;
      ch.name = s.name;
      ch.goal = s.name;
      ch.category = 'Shot Making';
      return ch;
    });
  }
  return drillsCache;
}

export function newMoreRun(id) {
  const m = moreMeta(id);
  if (m?.kind === 'matrix') return { cells: Array(m.rows * m.cols).fill(null), done: false, score: null, shots: 0, log: [] };
  if (m?.kind === 'deduct') return { n: 0, done: false, score: null, shots: 0, log: [] };
  if (m?.kind === 'yesno') return { answers: [null, null], step: 0, done: false, score: null, shots: 0, log: [] };
  if (m?.kind === 'rack') return { racks: [], runs: 0, done: false, score: null, shots: 0, log: [] };
  return { step: 0, done: false, score: null, shots: 0, log: [] };
}

function scaleMatrix(m, cells) {
  const sum = cells.reduce((a, b) => a + (b || 0), 0);
  return Math.round(sum * m.factor * 100) / 100;
}

export function moreApply(id, run, action) {
  const m = moreMeta(id);
  if (!m || run.done) return run;
  const next = { ...run, log: run.log.slice(), cells: run.cells ? run.cells.slice() : undefined, answers: run.answers ? run.answers.slice() : undefined, racks: run.racks ? run.racks.slice() : undefined };
  if (m.kind === 'tries3') {
    next.shots += 1;
    next.log.push({ ok: action.ok ? 1 : 0 });
    if (action.ok) {
      next.score = [4, 2, 1][next.step] ?? 0;
      next.done = true;
    } else if (next.step >= 2) {
      next.score = 0;
      next.done = true;
    } else next.step += 1;
    return next;
  }
  if (m.kind === 'yesno') {
    next.answers[next.step] = !!action.ok;
    next.shots += 1;
    next.log.push({ ok: action.ok ? 1 : 0 });
    if (next.step >= 1) {
      next.done = true;
      next.score = next.answers.filter(Boolean).length;
    } else next.step += 1;
    return next;
  }
  if (m.kind === 'deduct') {
    if (action.type === 'add') { next.n += 1; next.log.push({ type: 'add' }); return next; }
    if (action.type === 'sub') { next.n = Math.max(0, next.n - 1); next.log.push({ type: 'sub' }); return next; }
    if (action.type === 'done') { next.done = true; next.score = next.n; next.log.push({ type: 'done' }); return next; }
    return next;
  }
  if (m.kind === 'rack') {
    if ((next.racks || []).length >= 3) return next;
    next.racks = (next.racks || []).concat(!!action.ok);
    next.shots += 1;
    next.runs = next.racks.filter(Boolean).length;
    next.log.push({ ok: action.ok ? 1 : 0 });
    if (next.racks.length >= 3) {
      const o = rdsOutcome(next.runs, m.n);
      next.done = true;
      next.score = o.runs;
      next.move = o.move;
      next.nextLevel = o.next;
      next.ran = o.passed;
      next.line = o.line;
    }
    return next;
  }
  if (m.kind === 'matrix' && action.type === 'cell') {
    const i = action.i;
    if (i < 0 || i >= next.cells.length) return next;
    const cur = next.cells[i];
    next.cells[i] = cur == null ? 1 : cur === 1 ? 2 : cur === 2 ? 3 : cur === 3 ? 0 : null;
    next.log.push({ type: 'cell', i });
    if (next.cells.every((c) => c != null)) {
      next.done = true;
      next.score = scaleMatrix(m, next.cells);
    } else {
      next.score = scaleMatrix(m, next.cells);
      next.done = false;
    }
    return next;
  }
  return next;
}

export function undoMore(id, run) {
  if (!run?.log?.length) return newMoreRun(id);
  const log = run.log.slice(0, -1);
  let cur = newMoreRun(id);
  for (const step of log) {
    if (step.type === 'cell') cur = moreApply(id, cur, { type: 'cell', i: step.i });
    else if (step.type === 'add' || step.type === 'sub' || step.type === 'done') cur = moreApply(id, cur, { type: step.type });
    else cur = moreApply(id, cur, { ok: !!step.ok });
  }
  return cur;
}

export function moreStatus(id, run) {
  const m = moreMeta(id);
  if (!m) return '';
  if (m.kind === 'tries3') {
    if (run.done) return `Score ${run.score} / 4`;
    return `Attempt ${run.step + 1} of 3 · 4, then 2, then 1`;
  }
  if (m.kind === 'yesno') {
    if (run.done) return `Yes ${run.score} of 2`;
    return `Try ${run.step + 1} of 2`;
  }
  if (m.kind === 'deduct') return run.done ? `Deduction ${run.score}` : `Balls not pocketed legally: ${run.n}`;
  if (m.kind === 'rack') {
    if (run.done) return run.line || rdsOutcome(run.runs, m.n).line;
    const sofar = (run.racks || []).length;
    const runs = (run.racks || []).filter(Boolean).length;
    return sofar ? `Rack ${sofar + 1} of 3 · ${runs} out of ${sofar}` : 'Rack 1 of 3';
  }
  if (m.kind === 'matrix') {
    const sum = (run.cells || []).reduce((a, b) => a + (b || 0), 0);
    return `${sum} successful · score ${scaleMatrix(m, run.cells || [])} / 100`;
  }
  return '';
}

function emptyExam() { return { scores: {}, cols: [], completed: null }; }
export function moreExamOf(state, key) {
  const exam = MORE_EXAMS[key];
  const e = exam ? state?.[exam.stateKey] : null;
  if (!e || typeof e !== 'object') return key === 'rds' ? { ...emptyExam(), sets: [], current: 1 } : emptyExam();
  const out = { scores: { ...(e.scores || {}) }, cols: Array.isArray(e.cols) ? e.cols.slice() : [], completed: e.completed || null };
  if (key === 'rds') {
    out.sets = Array.isArray(e.sets) ? e.sets.map((row) => ({ ...row, racks: Array.isArray(row.racks) ? row.racks.slice() : [] })) : [];
    out.current = Number.isFinite(Number(e.current)) ? Number(e.current) : 1;
  }
  return out;
}

export function withMoreScore(state, id, score, max, detail, open) {
  const m = moreMeta(id);
  if (!m) return state;
  const key = m.exam.stateKey;
  const e = moreExamOf(state, m.exam.key);
  if (m.kind === 'rack') {
    const racks = Array.isArray(detail?.racks) ? detail.racks.map(Boolean) : [];
    if (racks.length !== 3) return state;
    const prog = rdsProgress(e);
    if (m.n > prog.unlocked) return state;
    const o = rdsOutcome(racks.filter(Boolean).length, m.n);
    e.sets = [...(e.sets || []), { level: m.n, racks, runs: o.runs, move: o.move, next: o.next, at: new Date().toISOString() }];
    e.current = o.next;
    e.completed = {
      name: MORE_EXAMS.rds.name,
      at: new Date().toISOString(),
      credit: MORE_CREDIT,
      ending: o.next,
      total: o.next,
      max: 16,
      runs: o.runs,
      move: o.move,
      progressive: true
    };
    return { ...state, [key]: e };
  }
  const prev = e.scores[id];
  const keepBest = m.kind === 'tries3';
  const better = keepBest && prev && prev.score > score;
  e.scores[id] = {
    score: better ? prev.score : score,
    max,
    at: new Date().toISOString(),
    detail: better ? prev.detail : detail,
    open: better ? !!prev.open : !!open,
    ...(better ? { best: prev.score } : {})
  };
  const order = m.order;
  const done = order.every((k) => e.scores[k] && Number.isFinite(e.scores[k].score) && !e.scores[k].open);
  if (done) {
    const scores = order.map((k) => ({ id: k, score: e.scores[k].score, max: e.scores[k].max }));
    let total = scores.reduce((a, s) => a + s.score, 0);
    let cap = scores.reduce((a, s) => a + s.max, 0);
    if (m.exam.key === 'ppc') { total = Math.max(0, Math.round((100 - total) * 100) / 100); cap = 100; }
    if (m.exam.key === 'safety') {
      const misses = order.reduce((a, k) => a + (2 - (e.scores[k].score || 0)), 0);
      total = Math.round(2.5 * (40 - misses) * 100) / 100;
      cap = 100;
    }
    e.completed = { name: m.exam.name, at: e.completed?.at || new Date().toISOString(), credit: MORE_CREDIT, scores, total, max: cap };
  } else e.completed = null;
  return { ...state, [key]: e };
}

export function finishRdsRun(state) {
  const e = moreExamOf(state, 'rds');
  const prog = rdsProgress(e);
  if (prog.sets.length) {
    e.completed = { name: MORE_EXAMS.rds.name, at: new Date().toISOString(), credit: MORE_CREDIT, ending: prog.current, total: prog.current, max: 16, progressive: true };
    e.current = prog.current;
    return { ...state, buExam4: e };
  }
  if (!e.cols.length) return state;
  const last = e.cols[e.cols.length - 1];
  e.completed = { name: MORE_EXAMS.rds.name, at: new Date().toISOString(), credit: MORE_CREDIT, ending: last.level, cols: e.cols.slice(), total: last.level, max: 16 };
  return { ...state, buExam4: e };
}

export function clearRdsSheet(state) {
  return clearMoreExam(state, 'rds');
}

export function clearMoreExam(state, key) {
  const exam = MORE_EXAMS[key];
  if (!exam) return state;
  return { ...state, [exam.stateKey]: emptyExam() };
}

export function clearMoreDrill(state, id) {
  const m = moreMeta(id);
  if (!m || m.kind === 'rack') return state;
  const e = moreExamOf(state, m.exam.key);
  delete e.scores[id];
  e.completed = null;
  return { ...state, [m.exam.stateKey]: e };
}

function sheetCells(examKey, state) {
  const exam = MORE_EXAMS[examKey];
  const e = moreExamOf(state, examKey);
  const drills = DRILLS.filter((d) => d.exam === examKey);
  if (examKey === 'rds') {
    const latest = {};
    for (const row of e.sets || []) latest[row.level] = row;
    const word = { up: 'next higher', stay: 'stay', down: 'next lower' };
    return drills.map((d) => {
      const row = latest[d.n];
      return `<div class="buCell"><b>${d.n}</b><small>${esc(RDS_RATINGS[d.n - 1])}</small><strong>${row ? `${row.runs} out of 3` : '—'}</strong><small>${row ? esc(word[row.move] || '') : ''}</small></div>`;
    }).join('');
  }
  if (examKey === 'draw' || examKey === 'follow') {
    const d = drills[0];
    const cells = e.scores[d.id]?.detail?.cells || [];
    const bits = [];
    for (let r = 1; r <= d.rows; r++) {
      for (let c = 1; c <= d.cols; c++) {
        const v = cells[(r - 1) * d.cols + (c - 1)];
        bits.push(`<div class="buCell"><b>${r}×${c}</b><small>${examKey === 'draw' ? 'draw' : 'follow'} ${c}</small><strong>${v == null ? '—' : v}</strong></div>`);
      }
    }
    return bits.join('');
  }
  return drills.map((d) => {
    const sc = e.scores[d.id];
    let shown = '—';
    if (sc) {
      if (examKey === 'ppc') shown = String(sc.score);
      else if (examKey === 'safety') {
        const a = sc.detail?.answers || [];
        shown = a.map((x) => (x ? 'yes' : 'no')).join(' · ') || String(sc.score);
      } else shown = String(sc.score);
    }
    const label = examKey === 'ppc' ? 'deduct' : examKey === 'advanced' ? 'pts' : '';
    return `<div class="buCell"><b>${esc(d.name.split('–')[0].trim())}</b><small>${esc(label)}</small><strong>${esc(shown)}</strong></div>`;
  }).join('');
}

function sheetTotal(examKey, state) {
  const e = moreExamOf(state, examKey);
  if (e.completed && examKey !== 'rds') return `${e.completed.total} / ${e.completed.max}`;
  const drills = DRILLS.filter((d) => d.exam === examKey);
  if (examKey === 'advanced') {
    const total = drills.reduce((a, d) => a + (e.scores[d.id]?.score || 0), 0);
    return `${total} / 100`;
  }
  if (examKey === 'ppc') {
    const filled = drills.filter((d) => e.scores[d.id]);
    const ded = filled.reduce((a, d) => a + e.scores[d.id].score, 0);
    return filled.length ? `${Math.max(0, Math.round((100 - ded) * 100) / 100)} / 100` : '— / 100';
  }
  if (examKey === 'safety') {
    const filled = drills.filter((d) => e.scores[d.id]);
    if (filled.length < drills.length) return '— / 100';
    const misses = drills.reduce((a, d) => a + (2 - (e.scores[d.id].score || 0)), 0);
    return `${Math.round(2.5 * (40 - misses) * 100) / 100} / 100`;
  }
  if (examKey === 'rds') {
    const prog = rdsProgress(e);
    if (!prog.sets.length) return 'No racks yet';
    return `Ending level ${prog.current} — ${RDS_RATINGS[prog.current - 1]}`;
  }
  const d = drills[0];
  const sc = e.scores[d.id];
  return sc ? `${sc.score} / 100` : '— / 100';
}

export function moreSheetHTML(state, examKey) {
  const exam = MORE_EXAMS[examKey];
  if (!exam) return '';
  const note = examKey === 'rds'
    ? 'Filled from the 3 racks you record. Nothing to retype.'
    : 'Filled when you score a drill. Nothing to retype.';
  return `<div class="card buSheetCard" data-bu-sheet="${examKey}"><div class="eyebrow">SCORE SHEET</div><h3>${esc(exam.name)}</h3><p class="muted small">${note}</p><div class="buSheet">${sheetCells(examKey, state)}</div><p class="buScoreLine">${esc(sheetTotal(examKey, state))}</p></div>`;
}

function rdsMoveWord(move) {
  if (move === 'up') return 'next higher level';
  if (move === 'down') return 'next lower level';
  if (move === 'stay') return 'stay at this level';
  return '';
}

export function moreExamPageHTML(state, which) {
  const exam = MORE_EXAMS[which];
  if (!exam) return '';
  const e = moreExamOf(state, which);
  const drills = DRILLS.filter((d) => d.exam === which);
  const prog = which === 'rds' ? rdsProgress(e) : null;
  const latest = {};
  if (prog) for (const row of prog.sets) latest[row.level] = row;
  const rows = drills.map((d, i) => {
    if (which === 'rds') {
      const real = d.n <= prog.unlocked;
      const open = real || devBypass(); // Dev Mode ON: locked levels open as a DEV PREVIEW (withMoreScore saves nothing for them)
      const row = latest[d.n];
      const bits = [RDS_RATINGS[d.n - 1]];
      if (row) bits.push(`${row.runs} out of 3 · ${rdsMoveWord(row.move)}`);
      else if (!open) bits.push('Locked');
      else if (!real) bits.push('Locked · Dev preview');
      const cls = `stageRow card${prog.passed.has(d.n) ? ' passed' : ''}${d.n === prog.current ? ' current' : ''}${open ? '' : ' locked'}`;
      const inner = `<span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>${esc(bits.join(' · '))}</small></span>`;
      if (!open) return `<div class="${cls}" data-rds-locked="${d.n}">${inner}</div>`;
      return `<button type="button" class="${cls}" data-action="go" data-href="#play/drills/${d.id}/exam" data-rds-level="${d.n}">${inner}</button>`;
    }
    const sc = e.scores[d.id];
    const note = sc ? ` · ${sc.score}` : '';
    return `<button type="button" class="stageRow card" data-action="go" data-href="#play/drills/${d.id}/exam"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>${note ? `exam${note}` : 'not scored yet'}</small></span></button>`;
  }).join('');
  let done;
  let start = exam.start;
  if (which === 'rds') {
    start = `bu-rds${prog.current}`;
    done = prog.sets.length
      ? `<p class="green">Ending level ${prog.current} — ${esc(RDS_RATINGS[prog.current - 1])}</p>`
      : '<p class="muted">Record 3 racks. If you run 2 out of 3, the next level opens. These drills are not on the All list. This does not change Career rank.</p>';
  } else {
    done = e.completed
      ? `<p class="green">Completed ${esc(exam.name)}. ${e.completed.total != null ? `${e.completed.total} / ${e.completed.max}` : ''}</p>`
      : '<p class="muted">Score the drills in this exam. The sheet fills itself. Opening a drill is not enough, and these drills are not on the All list. This does not change Career rank.</p>';
  }
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">BILLIARD UNIVERSITY</span><h1>${esc(exam.name)}</h1></div>
    <div class="card" data-rds-set="${which === 'rds' ? '1' : '0'}">${done}<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${start}/exam">START</button>${restartAskHTML(which)}</div>
    <details class="card buHowCard"><summary>Instructions</summary><pre class="buHow">${esc(exam.intro)}</pre><small class="muted credit">${esc(MORE_CREDIT)}</small></details>
    ${moreSheetHTML(state, which)}
    <div class="stageList" data-bu-list="1" data-more-exam="${which}">${rows}</div>`;
}

export function moreBannersHTML() {
  return Object.values(MORE_EXAMS).map((exam) => `<button type="button" class="card simPromo buEntry" data-action="go" data-href="${exam.href}" data-bu-entry="1" data-more-exam="${exam.key}"><span class="simPromoText"><span class="eyebrow">BILLIARD UNIVERSITY</span><b>${esc(exam.name)}</b><small>${esc(exam.blurb)}</small></span><span class="simPromoGo">›</span></button>`).join('');
}

export function moreAccomplishmentHTML(state) {
  return Object.values(MORE_EXAMS).map((exam) => {
    const e = moreExamOf(state, exam.key);
    if (exam.key === 'rds') {
      const prog = rdsProgress(e);
      if (!prog.sets.length) return '';
      return `<div class="card" data-bu-exam="done" data-more-exam="rds"><div class="eyebrow">BILLIARD UNIVERSITY</div><h3>${esc(exam.name)}</h3><p>Ending level ${prog.current} — ${esc(RDS_RATINGS[prog.current - 1])}</p><small class="muted credit">${esc(MORE_CREDIT)}</small></div>`;
    }
    if (!e.completed) return '';
    return `<div class="card" data-bu-exam="done" data-more-exam="${exam.key}"><div class="eyebrow">BILLIARD UNIVERSITY</div><h3>${esc(exam.name)}</h3><p>Completed. ${e.completed.total} / ${e.completed.max}</p><small class="muted credit">${esc(MORE_CREDIT)}</small></div>`;
  }).join('');
}
