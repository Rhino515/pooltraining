/**
 * PKF Advanced Play & Safety Course (+ PKF Advanced Play & Safety Exam).
 * Source: PKF Pattern Play / Cue Ball Control, CHAPTER SEVEN: TIPS & TRICKS, printed pages 137–200
 * (PDF pages 159–224; 159 is the TIPS & TRICKS divider, 160 is blank). The pack stops right before
 * KICKING SYSTEMS (PDF 225); nothing from that chapter is used. Original JPEGs only (images/pkf-advanced/).
 * Every lesson cites its printed page; explanations quote or paraphrase PKF. No outside instruction, no invented
 * positions, routes, speeds, spin or pockets. Section names are PKF’s own headings (long headings are split into
 * parts by page range, in PKF’s order).
 * App mechanics (lock/reveal, 70% section gate, 80% exam pass, 3 attempts per table exercise, the result buttons)
 * are app settings, not PKF rules. See docs/PKF_ADVANCED_PLAY_SAFETY_SOURCE_MAP.md.
 *
 * Table setups use the ORIGINAL PKF image (no app coordinates): PKF prints these layouts as diagrams or photos
 * without measurements, so ball positions are reproduced from the image.
 * Contained material: KICK KILL and KICK SAFE stay as those two Tips & Tricks concepts only (PKF’s own examples,
 * no kicking system). AIMING JUMP SHOTS and CHANGING THE PATH (elevated cue) are knowledge lessons only: no extra setups.
 */
import { regionOf, regionHTML, chapterOf, PUZZLE_ANSWER } from './pkfAdvancedPlayAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Advanced Play & Safety Course';
export const EXAM_TITLE = 'PKF Advanced Play & Safety Exam';
export const SHORT_TITLE = 'PKF Advanced Play & Safety';
export const STORAGE_KEY = 'pkfAdvancedPlaySafety';
export const HASH = 'pkfadv';
/** App settings (same pattern as the other PKF courses). Not PKF rules. */
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;
export const ATTEMPTS_MAX = 3;
export const NOT_SPECIFIED = 'Not specified in PKF';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  RECOGNIZE: 'RECOGNIZE THE SITUATION',
  DECIDE: 'WHAT WOULD YOU DO?',
  PREDICT: 'PREDICT THE RESULT',
  SAFETY: 'PLAN THE SAFETY',
  TWOWAY: 'TWO-WAY SHOT',
  PROBLEM: 'FIND THE PROBLEM',
  METHOD: 'PKF METHOD',
  SEQUENCE: 'CHOOSE THE SEQUENCE',
  PUZZLE: 'SOLVE THE PATTERN PUZZLE',
  SHOOT: 'SET UP THIS SHOT'
};
export const KNOWLEDGE_TYPES = ['RECOGNIZE', 'DECIDE', 'PREDICT', 'SAFETY', 'TWOWAY', 'PROBLEM', 'METHOD', 'SEQUENCE', 'PUZZLE'];
/** Pick-the-order questions (tap balls for shot 1, shot 2, …). */
export const BUILD_TYPES = ['SEQUENCE', 'PUZZLE'];
/** Skill areas (exam + completion screen). */
export const AREAS = { safety: 'Safety Play', decision: 'Shot Decisions', pattern: 'Pattern / Problem Solving', knowledge: 'Strategy Knowledge', execution: 'Physical Execution' };
const AREA_OF_TYPE = { SAFETY: 'safety', DECIDE: 'decision', TWOWAY: 'decision', SEQUENCE: 'decision', PUZZLE: 'pattern', PROBLEM: 'pattern', RECOGNIZE: 'knowledge', PREDICT: 'knowledge', METHOD: 'knowledge' };

/**
 * Physical kinds. One button per attempt; the result labels fit the objective (a safety is never just made/missed).
 * `ok` = counts as a successful attempt.
 */
export const PHYS = {
  safety: { label: 'Safety', results: [['success', 'SAFETY SUCCESSFUL', true], ['partial', 'PARTIAL SAFETY', false], ['failed', 'SAFETY FAILED', false], ['scratch', 'SCRATCH', false]] },
  target: { label: 'Safety drill', results: [['success', 'TARGET AREA REACHED', true], ['failed', 'TARGET AREA MISSED', false], ['scratch', 'SCRATCH', false]] },
  twoway: { label: 'Two-way shot', results: [['made', 'SHOT MADE', true], ['success', 'MISSED · SAFETY SUCCESSFUL', true], ['failed', 'MISSED · SAFETY FAILED', false], ['scratch', 'SCRATCH', false]] },
  shot: { label: 'Shot + position', results: [['success', 'SHOT MADE · POSITION ACHIEVED', true], ['lost', 'SHOT MADE · POSITION LOST', false], ['failed', 'SHOT MISSED', false]] },
  make: { label: 'Shot', results: [['success', 'SHOT MADE', true], ['failed', 'SHOT MISSED', false]] },
  pattern: { label: 'Pattern', results: [['success', 'PATTERN COMPLETED', true], ['failed', 'PATTERN FAILED', false]] },
  drill: { label: 'Drill', results: [['success', 'SUCCESS', true], ['failed', 'FAILED', false]] }
};
/** Safety-type physical kinds (PRACTICE FAILED SAFETIES, Safeties Attempted / Successful). */
export const SAFETY_KINDS = ['safety', 'target', 'twoway'];
export function resultInfo(kind, v) {
  const r = (PHYS[kind]?.results || []).find((x) => x[0] === v);
  return r ? { v: r[0], label: r[1], ok: r[2] } : null;
}

/** PKF’s own headings in PKF’s order. Long headings are split into parts by page range (same heading). */
export const SECTIONS = [
  { id: 'sliding-safeties', n: 1, title: 'Sliding Cue Ball Safeties', blurb: 'Use the sliding cue ball path to hide the cue ball: the 90 degree line, rolling cue ball adjustments, sidespin and practice drills.', pages: '137–143' },
  { id: 'backstroke', n: 2, title: 'Be Aware of Your Backstroke', blurb: 'Soft shots need a short backstroke, firm shots a long one.', pages: '144–145' },
  { id: 'eight-ball-1', n: 3, title: '8-Ball Strategies · Part 1', blurb: 'When not to run out: defense, problem areas, breakout balls and removing an opponent’s blocker.', pages: '145–148' },
  { id: 'eight-ball-2', n: 4, title: '8-Ball Strategies · Part 2', blurb: 'Two-way shots, missing banks on the pro side, bank speed and calling safe.', pages: '149–152' },
  { id: 'eight-ball-3', n: 5, title: '8-Ball Strategies · Part 3', blurb: 'Choosing stripes or solids, insurance balls, and breaking out problem areas while playing safe.', pages: '153–157' },
  { id: 'eight-ball-4', n: 6, title: '8-Ball Strategies · Part 4', blurb: 'Locking up the cue ball, no shot on your last ball, blockers and clustered tables.', pages: '158–161' },
  { id: 'combinations', n: 7, title: 'Combinations', blurb: 'Use the first ball as a “cue ball”, know which side of the line to be on, and build in a safety.', pages: '161–165' },
  { id: 'consistency', n: 8, title: 'Consistency', blurb: 'PKF’s runout test and the five parts of a consistent game.', pages: '166–167' },
  { id: 'nine-ball', n: 9, title: '9-Ball Tips', blurb: 'Push outs, low percentage kicks, ball in hand on a problem area, and side vs corner pocket.', pages: '168–172' },
  { id: 'hangers', n: 10, title: 'Hangers', blurb: 'Plan position on a hanging ball as carefully as any other shot.', pages: '172–173' },
  { id: 'kick-kill', n: 11, title: 'Kick Kill', blurb: 'Kill the cue ball on a kick: hit the object ball full; high action or maximum low by angle.', pages: '173–174' },
  { id: 'extreme-cut', n: 12, title: 'Extreme Cut Shots', blurb: 'Cutting a ball when the cue ball is too close.', pages: '175' },
  { id: 'kick-safe', n: 13, title: 'Kick Safe', blurb: 'Hit a specific part of the object ball, and kick softly at a ball that’s tied up.', pages: '176–177' },
  { id: 'safeties-1', n: 14, title: 'Safeties · Part 1', blurb: 'Object ball off the rail, hiding behind one ball, distance, and reverse english.', pages: '178–182' },
  { id: 'safeties-2', n: 15, title: 'Safeties · Part 2', blurb: 'Two-rail banks with high action, clusters, clip safeties, two-ball safeties and the stun follow safety.', pages: '182–187' },
  { id: 'jump', n: 16, title: 'Aiming Jump Shots', blurb: 'Sidespin on jump shots and using the obstacle ball as an aiming target (knowledge only).', pages: '188–190' },
  { id: 'stop-tip', n: 17, title: 'Stop the Tip', blurb: 'Pause the tip at the cue ball for one final check.', pages: '190' },
  { id: 'mosconi', n: 18, title: 'Mosconi Cup Drills', blurb: 'The soft stop shot, soft kill safeties and the sidespin drill.', pages: '191–192' },
  { id: 'pattern-puzzles', n: 19, title: '8-Ball Pattern Puzzles', blurb: 'Ten layouts from PKF’s pattern puzzles: solve the runout, lock it, compare with PKF.', pages: '193–195' },
  { id: 'filipino', n: 20, title: 'Filipino Tips', blurb: 'Maximum sidespin, the Filipino break stroke, and carom safeties with running english.', pages: '196–199' },
  { id: 'changing-path', n: 21, title: 'Changing the Path', blurb: 'Mike Massey’s elevated cue shots that change the cue ball’s path (knowledge only).', pages: '199–200' }
];
export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

const IMG_SETUP = (where) => `Set the balls up as in PKF’s original ${where}. The original image is the setup; the app gives no coordinates.`;
const PHOTO = 'PKF shows this layout as a table photo: match the ball positions by eye.';
const POSITIONS = 'Exact ball positions (PKF’s image only)';

/* ───────────────────────────── Lessons (PKF order) ───────────────────────────── */
const L = [];
const add = (sec, list) => { for (const o of list) L.push({ sec, ...o }); };

/* 1 · SLIDING CUE BALL SAFETIES (p137–143) */
add('sliding-safeties', [
  { id: 'adv-ss-first', type: 'RECOGNIZE', assist: 'GUIDED', page: '137', title: 'Sliding Safeties: Look First', fig: 'f7-1', reveal: 'f7-1',
    prompt: 'The player is playing 9-Ball and ended up here on the 1 ball after the break (figure 7-1). What do strong players do first in a situation like this?',
    hint: 'Defense is never the first look.',
    choices: [['offense', 'Look for an offensive shot'], ['hide', 'Look for a hiding spot for the cue ball'], ['kick', 'Look at where the 1 ball will end up']], answer: 'offense',
    explain: 'PKF: “The first thing strong players do in a situation like this is look for an offensive shot. If they can’t find one then they start looking for a good hiding spot for the cue ball.” Here the 2 and 5 ball would make a great hiding spot. When strong players look at playing defense, they always study the sliding cue ball path first and use it as a reference point.' },
  { id: 'adv-ss-method', type: 'METHOD', assist: 'GUIDED', page: '137–138', title: 'Sliding Safeties: Finding the Target', fig: 'f7-1', reveal: 'f7-2', hidePre: false,
    prompt: 'He wants to send the cue ball to the side rail near the first diamond so it continues to the end rail behind the 2 and 5 ball. How does PKF find the target for the 1 ball?',
    hint: 'His cue stick does the work: it points at the cue ball’s spot.',
    choices: [['ninety', 'A 90 degree line from the cue stick, through the 1 ball, to the side rail'], ['direct', 'Aim the 1 ball at the cue ball’s rail spot, then let the cue ball roll through'], ['roll', 'Shoot the 1 ball at the rail with center ball and let the cue ball roll']], answer: 'ninety',
    explain: 'PKF: once he picks out a target on the side rail for the cue ball, “he then holds his cue stick next to the 1 ball and points it toward this spot on the rail (figure 7-2). He then imagines a 90 degree line from his cue stick, through the 1 ball, and toward the side rail (B).”' },
  { id: 'adv-ss-predict', type: 'PREDICT', assist: 'GUIDED', page: '138', title: 'Sliding Safeties: The Result', fig: 'f7-2', reveal: 'f7-3',
    prompt: 'He aims the 1 ball toward spot B with a sliding cue ball. Where should the cue ball travel?',
    hint: 'The cue stick was pointing at his spot.',
    choices: [['spot', 'Toward his spot on the other side rail, then behind the 2 and 5'], ['follow', 'Forward along the 1 ball’s path toward the rail, then back up the table'], ['stop', 'It stops close to where the 1 ball was struck']], answer: 'spot',
    explain: 'PKF: “If he can now aim the 1 ball toward this spot on the side rail with a sliding cue ball, the cue ball should travel toward his spot on the other side rail (figure 7-3).”' },
  { id: 'adv-ss-endrail', type: 'SAFETY', assist: 'GUIDED', page: '138', title: 'Sliding Safeties: Behind Three Balls', fig: 'fU162a', reveal: 'f7-5',
    prompt: 'In this game of 9-Ball the player is on the 1 ball but doesn’t have a good offensive shot. If he plays safe, the 8, 2 and 9 ball would make a great place to hide the cue ball. What’s the first thing he needs to do?',
    hint: 'Start with the cue ball’s target, not the object ball’s.',
    choices: [['cbspot', 'Pick a spot on the end rail to send the cue ball toward'], ['obspot', 'Pick the 1 ball’s target on the side rail before anything else'], ['speed', 'Choose the speed of the shot']], answer: 'cbspot',
    explain: 'PKF: “The first thing he needs to do is pick a spot on the end rail to send the cue ball toward (figure 7-5).” Then he places his cue stick alongside the 1 ball pointing toward this spot; the 90 degree line from the cue stick to the rail gives him his target for the 1 ball (B).' },
  { id: 'adv-ss-angle', type: 'RECOGNIZE', assist: 'GUIDED', page: '138', title: 'Sliding Safeties: Why the Spot Works', fig: 'f7-5', reveal: 'f7-6',
    prompt: 'Why should a path toward this spot on the end rail (A) result in an effective safety?',
    hint: 'Think about the angle into and out of the rail.',
    choices: [['angle', 'The angle into the rail matches the angle leaving it'], ['spin', 'The cue ball picks up spin from the 1 ball'], ['slow', 'The end rail takes the speed off the cue ball near the blockers']], answer: 'angle',
    explain: 'PKF: “Since he knows that the cue ball’s angle toward the rail is similar to the angle leaving the rail, a path toward this spot on the end rail (A), should result in an effective safety.” Aiming the 1 ball at B with a sliding cue ball sends the cue ball behind the group of balls (figure 7-6).' },
  { id: 'adv-ss-phys-endrail', type: 'SHOOT', assist: 'GUIDED', page: '138', title: 'Table: Sliding Safety Behind the 8, 2 and 9', fig: 'fU162a', reveal: 'f7-6', plan: 'adv-ss-endrail',
    phys: { kind: 'safety', setup: [IMG_SETUP('layout (page 138)'), 'Cue ball and 1 ball where PKF shows them; the 8, 2 and 9 ball are the blockers.'],
      steps: ['Pick the spot on the end rail (A) to send the cue ball toward (figure 7-5).', 'Hold your cue stick alongside the 1 ball pointing at A; the 90 degree line gives the 1 ball’s target (B).', 'Aim the 1 ball at B with a sliding cue ball.'],
      objective: 'Cue ball ends up behind the 8, 2 and 9 ball (figure 7-6).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-ss-sideB', type: 'SAFETY', assist: 'ASSISTED', page: '139', title: 'Sliding Safeties: The 4 Ball', fig: 'fU163a', reveal: 'f7-9',
    prompt: 'The player is on the 4 ball with no good offensive shot; the 7 and 8 ball would be a good place to hide the cue ball. He has found his spot on the end rail (A). Where is the target for the 4 ball?',
    hint: 'Visualize the line from the cue stick.',
    choices: [['side', 'A side rail spot, found with the 90 degree line (B)'], ['endA', 'Spot A on the end rail, the cue ball’s target'], ['pocket', 'The nearest corner pocket, as if pocketing it']], answer: 'side',
    explain: 'PKF: “If he can visualize the 90 degree line from the cue stick through the 4 ball he now has a spot on the side rail that he can use as a target for the 4 ball (B). A sliding cue ball should take him behind the 7 and 8 ball (figure 7-9).”' },
  { id: 'adv-ss-sidespot', type: 'SAFETY', assist: 'ASSISTED', page: '139', title: 'Sliding Safeties: Behind the 5 and 7', fig: 'fU163b', reveal: 'f7-12',
    prompt: 'On the 4 ball, he needs to play a defensive shot behind the 5 and 7 ball. What does he pick first?',
    choices: [['cb', 'The spot on the side rail the cue ball must hit'], ['ob', 'A target on the rail for the 4 ball'], ['blk', 'Which of the blockers to hide the cue ball behind first']], answer: 'cb',
    explain: 'PKF: “He first picks a spot along the side rail that the cue ball needs to strike (figure 7-11). Once he has this spot he holds his cue stick alongside the 4 ball and points it toward this spot (A). Now, the 90 degree line from the cue stick gives him his target for the 4 ball on the rail (B).” A sliding cue ball hides it behind the 5 and 7 ball (figure 7-12).' },
  { id: 'adv-ss-breakout', type: 'SAFETY', assist: 'ASSISTED', page: '140', title: 'Sliding Safeties: Missed Breakout', fig: 'f7-13', reveal: 'f7-15',
    prompt: 'He missed his breakout on the 3 ball and has to find a defensive shot; a good hiding spot is behind the 5 and 8 ball. After he finds the 3 ball’s target (B) with the 90 degree line, what kind of cue ball takes him behind the blockers?',
    choices: [['slide', 'A sliding cue ball'], ['draw', 'A draw shot'], ['follow', 'A follow shot']], answer: 'slide',
    explain: 'PKF: he picks a spot on the side rail that will take the cue ball behind the blocker balls (figure 7-14), holds his cue stick alongside the 3 ball pointing at it (A), and the 90 degree line gives the 3 ball’s target (B). “A sliding cue ball should take him behind the blocker balls (figure 7-15).”' },
  { id: 'adv-ss-rolling-learn', type: 'LEARN', assist: 'ASSISTED', page: '140', title: 'Rolling Cue Ball Safeties', fig: 'f7-16',
    explain: 'PKF: “When the cue ball is farther away from the object ball it’s a little tougher to slide the cue ball and control your speed. When this happens you’ll have to use a rolling cue ball instead of a sliding cue ball, but you’re still using the sliding cue ball path as a reference point.” In figure 7-16 the player is on the 4 ball and needs to hide behind the 8 and 5 ball; striking the side rail right above the first diamond does it (figure 7-17). With this distance, sliding is difficult, and rolling the cue ball along the sliding cue ball path sends it toward the corner pocket.' },
  { id: 'adv-ss-rolling', type: 'PREDICT', assist: 'ASSISTED', page: '140–141', title: 'Rolling Cue Ball: The Adjustment', fig: 'f7-17', reveal: 'f7-18',
    prompt: 'A rolling cue ball heads toward the side rail about a diamond lower than the sliding cue ball path. To send a rolling cue ball to the first diamond, what does he use as his point of contact for the sliding cue ball path?',
    hint: 'Move the reference point by the same amount the rolling cue ball changes.',
    choices: [['second', 'The second diamond'], ['first', 'The first diamond'], ['corner', 'The corner pocket']], answer: 'second',
    explain: 'PKF: “This time he’ll use the second diamond as his point of contact on the side rail (figure 7-18), which changes his sliding cue ball path. He finds his new target for the 4 ball using this line. Now when he uses a rolling cue ball, it should travel toward the first diamond and end up behind the blocker balls.”' },
  { id: 'adv-ss-rolling2', type: 'SAFETY', assist: 'INDEPENDENT', page: '141', title: 'Rolling Cue Ball: The 5 Ball', fig: 'f7-19', reveal: 'f7-21',
    prompt: 'On the 5 ball with no good offensive shot, he wants to hide behind the 8 and 9 ball by sending the cue ball toward the first diamond. He’ll be rolling the cue ball. Which sliding cue ball path does he use to find the 5 ball’s target on the end rail?',
    choices: [['second', 'The second diamond'], ['first', 'The first diamond'], ['third', 'The third diamond']], answer: 'second',
    explain: 'PKF: “Since he’ll be rolling the cue ball he’ll need to use the second diamond as his sliding cue ball path (figure 7-20). This sliding cue ball path now gives him his target for the 5 ball on the end rail; if he can aim the 5 ball toward this target … the cue ball should head toward the first diamond and behind the blocker balls (figure 7-21).”' },
  { id: 'adv-ss-phys-rolling', type: 'SHOOT', assist: 'INDEPENDENT', page: '141', title: 'Table: Rolling Cue Ball Safety', fig: 'f7-19', reveal: 'f7-21', plan: 'adv-ss-rolling2',
    phys: { kind: 'safety', setup: [IMG_SETUP('layout (figure 7-19)'), 'Blockers: the 8 and 9 ball.'],
      steps: ['Use the second diamond as your sliding cue ball path (figure 7-20).', 'Find the 5 ball’s target on the end rail from that path.', 'Roll the cue ball: it should head toward the first diamond.'],
      objective: 'Cue ball ends up behind the 8 and 9 ball (figure 7-21).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-ss-spin1', type: 'SAFETY', assist: 'INDEPENDENT', page: '142', title: 'Sidespin Safeties: The 2 Ball', fig: 'f7-26', reveal: 'f7-27',
    prompt: 'No offensive shot on the 2 ball. He sees a great hiding spot behind the 3 and 5 ball, but he won’t get there with a sliding cue ball and no sidespin. What does PKF add?',
    choices: [['right', 'Right spin, so it spins behind the blockers off the end rail'], ['left', 'Left spin, to hold the cue ball off the end rail'], ['draw', 'Draw, to pull the cue ball back behind the blockers off the rail']], answer: 'right',
    explain: 'PKF: “If the cue ball can hit the end rail around here (A) with right spin, it should end up behind the blocker balls.” He draws a line from that spot past the 2 ball to find the 2 ball’s target on the side rail; “if he can shoot the 2 ball toward this target with a sliding cue ball and right spin, the cue ball will head toward his target on the end rail and spin behind the blocker balls (figure 7-27).”' },
  { id: 'adv-ss-phys-spin', type: 'SHOOT', assist: 'INDEPENDENT', page: '142', title: 'Table: Sidespin Safety Behind the 3 and 5', fig: 'f7-26', reveal: 'f7-27', plan: 'adv-ss-spin1',
    phys: { kind: 'safety', setup: [IMG_SETUP('layout (figure 7-26)'), 'Blockers: the 3 and 5 ball.'],
      steps: ['Spot on the end rail (A) for the cue ball.', 'Line from A past the 2 ball gives the 2 ball’s target on the side rail.', 'Sliding cue ball with right spin.'],
      objective: 'Cue ball spins behind the 3 and 5 ball (figure 7-27).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED, 'Amount of right spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-ss-spin2', type: 'SAFETY', assist: 'INDEPENDENT', page: '143', title: 'Sidespin Safeties: Target on the End Rail', fig: 'fU167a', reveal: 'f7-30',
    prompt: 'Forced to play a safety on the 5 ball, he wants to hide behind the 6 and 7 ball by sending the cue ball to spot A on the side rail with right spin. Now that he has his spot, what does his cue stick give him?',
    choices: [['endrail', 'His target for the 5 ball on the end rail'], ['siderail', 'A second spot on the side rail for the cue ball'], ['pocket', 'A pocket for the 5 ball']], answer: 'endrail',
    explain: 'PKF: “Now that he has his spot on the side rail he can use his cue stick to find his target for the 5 ball on the end rail (figure 7-29). Now it’s a matter of shooting the 5 ball toward the target on the end rail with right spin (figure 7-30).”' },
  { id: 'adv-ss-spin3', type: 'PREDICT', assist: 'INDEPENDENT', page: '143', title: 'Sidespin Safeties: Left Spin', fig: 'f7-31', reveal: 'f7-32',
    prompt: 'A good hiding spot is behind the 9 and 6 ball. The cue ball will be sliding with left spin when it strikes the 5 ball and heads toward spot A on the side rail. How does it reach the hiding area?',
    choices: [['two', 'It spins two more rails behind the blocker balls'], ['stops', 'It stops at A'], ['one', 'It comes straight off spot A and stops behind the balls']], answer: 'two',
    explain: 'PKF: “If he can send the cue ball to this spot on the side rail (A) with left spin, it should travel two more rails to end up in the hiding area.” With the target on the side rail he has the spot on the end rail to aim the 5 ball toward; the sliding cue ball with left spin “should head toward the side rail (A), and spin two rails behind the blocker balls (figure 7-32).”' },
  { id: 'adv-ss-drill-sticker', type: 'SHOOT', assist: 'INDEPENDENT', page: '141–142', title: 'Drill: Sliding Safeties on Stickers', fig: 'f7-22', reveal: 'f7-23',
    phys: { kind: 'safety', setup: ['Set up the cue ball and object ball on stickers as in figure 7-22, with obstacle balls to hide behind.'],
      steps: ['Pick a target on the rail that the cue ball needs to hit to end up behind the obstacle balls.', 'Find the target for the object ball on the side rail; you can use a piece of chalk to mark this spot on the rail.', 'As you get more consistent, gradually move the cue ball farther away from the object ball (figure 7-23).'],
      objective: 'Cue ball ends up behind the obstacle balls.', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-ss-drill-paper', type: 'SHOOT', assist: 'INDEPENDENT', page: '142', title: 'Drill: Land on the Paper', fig: 'f7-24', reveal: 'f7-25',
    phys: { kind: 'target', setup: ['Place a small piece of paper on the table as in figure 7-24.'],
      steps: ['Practice landing the cue ball on the paper with a sliding cue ball safety.', 'Keep moving the two balls around the table and practice from different angles (figure 7-25).'],
      objective: 'Cue ball lands on the paper.', gaps: [POSITIONS, 'Paper size: ' + NOT_SPECIFIED] } }
]);

/* 2 · BE AWARE OF YOUR BACKSTROKE (p144–145) */
add('backstroke', [
  { id: 'adv-bs-learn', type: 'LEARN', assist: 'GUIDED', page: '144', title: 'Backstroke Length', fig: 'f7-33',
    explain: 'PKF on the length of your backstroke: on a soft shot like cutting the 3 ball in the corner and holding the cue ball for the 8 ball (figure 7-33), the backstroke only needs to be an inch or two (figure 7-34).' },
  { id: 'adv-bs-problem', type: 'PROBLEM', assist: 'GUIDED', page: '144', title: 'Backstroke: What Goes Wrong', fig: 'f7-35', reveal: 'f7-35',
    prompt: 'On this soft shot the player pulls his cue back too far (figure 7-35). What usually happens?',
    choices: [['decel', 'He decelerates, which can cause a miss or over-running position'], ['power', 'He gets extra power and a smoother follow-through, so better position'], ['nothing', 'Nothing, as long as he keeps his bridge hand still']], answer: 'decel',
    explain: 'PKF: pulling the cue back too far on a soft shot leads to decelerating on the forward stroke, which can cause a missed shot or over-running position (figure 7-35). A soft shot only needs a short backstroke.' },
  { id: 'adv-bs-hold', type: 'METHOD', assist: 'ASSISTED', page: '144', title: 'Backstroke: Holding for the 6', fig: 'f7-36', reveal: 'f7-36',
    prompt: 'Pocketing a ball and holding the cue ball for the 6 ball (figure 7-36): about how long a backstroke does PKF show?',
    choices: [['inch', 'About an inch'], ['full', 'A full backstroke'], ['foot', 'About a foot']], answer: 'inch',
    explain: 'PKF: holding the cue ball for the 6 ball takes a backstroke of about an inch (figure 7-36).' },
  { id: 'adv-bs-safety', type: 'METHOD', assist: 'ASSISTED', page: '144', title: 'Backstroke: Frozen Safety', fig: 'f7-37', reveal: 'f7-38',
    prompt: 'A common 8-Ball safety: barely hit the 1 ball and leave the cue ball frozen to it (figure 7-37). How long is the backstroke?',
    choices: [['less', 'Less than an inch'], ['two', 'Two inches or more'], ['normal', 'A normal full backstroke']], answer: 'less',
    explain: 'PKF: on this safety the player needs to barely hit the 1 ball and leave the cue ball frozen to it, so the backstroke is less than an inch (figure 7-38).' },
  { id: 'adv-bs-firm', type: 'PREDICT', assist: 'INDEPENDENT', page: '145', title: 'Backstroke: Firm Shot', fig: 'fU169a', reveal: 'fU169a',
    prompt: 'He wants to pocket the 6 ball and bring the cue ball down to the end rail for the 7. Which backstroke lets the momentum of the cue provide the power: A or B?',
    choices: [['B', 'Backstroke B (longer)'], ['A', 'Backstroke A (shorter)']], answer: 'B',
    explain: 'PKF: if his backstroke stops at A he’ll need to tighten his grip and muscle the shot; with the longer backstroke (B) he can let the momentum of the cue provide the power. The harder you need to strike the cue ball, the longer the backstroke; the softer the shot, the shorter the backstroke.' },
  { id: 'adv-bs-rule', type: 'RECOGNIZE', assist: 'INDEPENDENT', page: '145', title: 'Backstroke: The Rule', fig: 'fU169a', reveal: 'fU169a',
    prompt: 'What is PKF’s rule for backstroke length?',
    choices: [['rule', 'Harder shot, longer backstroke; softer shot, shorter'], ['same', 'Always use the same length and vary the stroke speed'], ['short', 'Always keep it short for accuracy, whatever the speed']], answer: 'rule',
    explain: 'PKF: harder shots need a longer backstroke so the cue’s momentum provides the power; soft shots need a short backstroke so you don’t decelerate.' },
  { id: 'adv-bs-phys-soft', type: 'SHOOT', assist: 'INDEPENDENT', page: '144', title: 'Table: Soft Cut, Short Backstroke', fig: 'f7-33', reveal: 'f7-34',
    phys: { kind: 'shot', setup: [IMG_SETUP('photo (figure 7-33)'), PHOTO],
      steps: ['Cut the 3 ball in the corner.', 'Backstroke an inch or two (figure 7-34).', 'Hold the cue ball for the 8 ball.'],
      objective: '3 ball made and the cue ball stays in position for the 8 ball.', gaps: [POSITIONS, 'Speed: soft (PKF gives no exact speed)'] } },
  { id: 'adv-bs-phys-frozen', type: 'SHOOT', assist: 'INDEPENDENT', page: '144', title: 'Table: Frozen Cue Ball Safety', fig: 'f7-37', reveal: 'f7-38', plan: 'adv-bs-safety',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-37)'), PHOTO],
      steps: ['Backstroke less than an inch.', 'Barely hit the 1 ball.'],
      objective: 'Cue ball frozen to the 1 ball.', gaps: [POSITIONS] } },
  { id: 'adv-bs-phys-firm', type: 'SHOOT', assist: 'INDEPENDENT', page: '145', title: 'Table: Firm Shot, Long Backstroke', fig: 'fU169a', reveal: 'fU169a', plan: 'adv-bs-firm',
    phys: { kind: 'shot', setup: [IMG_SETUP('diagram (page 145)')],
      steps: ['Use the longer backstroke (B).', 'Let the momentum of the cue provide the power; don’t tighten your grip.', 'Pocket the 6 ball and bring the cue ball down to the end rail.'],
      objective: '6 ball made with position on the 7.', gaps: [POSITIONS, 'Speed / spin: ' + NOT_SPECIFIED] } }
]);

/* 3 · 8-BALL STRATEGIES · PART 1 (p145–148) */
add('eight-ball-1', [
  { id: 'adv-e8-defense', type: 'DECIDE', assist: 'GUIDED', page: '145', title: '8-Ball: Run or Defend?', fig: 'fU169b', reveal: 'f7-41', area: 'safety',
    prompt: 'He’s stripes. To keep going he must pocket the 12 and bring the cue ball back to the bottom end rail for the 9 in the top left corner, then still needs the right angle on the 9. What does PKF suggest?',
    hint: 'PKF calls this route low percentage.',
    choices: [['defense', 'Consider a defensive shot instead'], ['run', 'Go for the 12 and the position on the 9'], ['power', 'Pocket the 12 with power and hope for a shot']], answer: 'defense',
    explain: 'PKF: this is a low percentage way to keep running, so he should consider defense. A good defensive option is shooting the 9 toward the end rail and rolling the cue ball behind the 3 ball (figure 7-41).' },
  { id: 'adv-e8-defense2', type: 'PREDICT', assist: 'GUIDED', page: '145', title: '8-Ball: The Bonus of the Safety', fig: 'f7-41', reveal: 'f7-42',
    prompt: 'He shoots the 9 toward the end rail and rolls the cue ball behind the 3 ball. What extra benefit does PKF point out?',
    choices: [['block', 'It blocks a corner pocket for the 3'], ['pocket', 'The 9 ends up in a corner pocket'], ['cluster', 'The 9 breaks up the solids']], answer: 'block',
    explain: 'PKF: besides hiding the cue ball behind the 3, the 9 ends up blocking one of the corner pockets for the 3 ball (figure 7-42).' },
  { id: 'adv-e8-rule', type: 'RECOGNIZE', assist: 'GUIDED', page: '146', title: '8-Ball: Rule of Thumb', fig: 'fU170a', reveal: 'fU170a',
    prompt: 'What is PKF’s rule of thumb about pocketing balls in 8-Ball?',
    choices: [['rule', 'Don’t pocket balls unless you’re sure you can run out'], ['always', 'Always pocket a ball when you have a shot'], ['two', 'Pocket two or three balls first, then play safe if it gets hard']], answer: 'rule',
    explain: 'PKF: the previous example illustrates a common error many amateur players make: they attempt to run out every rack of 8-Ball regardless of the difficulty. “A good rule of thumb to remember when playing 8 ball, is to avoid pocketing balls unless you are positive you can run the table.”' },
  { id: 'adv-e8-tieup8', type: 'DECIDE', assist: 'GUIDED', page: '146', title: '8-Ball: Stripes With a Problem', fig: 'fU170a', reveal: 'f7-45', area: 'safety',
    prompt: 'He’s stripes and has a good shot on the 12, but the stripes are clustered and the 11 and 6 make a problem area at the other end. What does PKF look for?',
    choices: [['tie8', 'A safety with the 12 that ties up the 8 for the opponent'], ['run', 'Start the run with the 12 and solve the 11 later'], ['break', 'Break up the stripe cluster with the 12 right away, then run out']], answer: 'tie8',
    explain: 'PKF: “When faced with a situation like this when you don’t think you can complete your runout, look for a defensive shot; and when playing defense try to find a shot that makes your opponent’s layout even tougher.” In figure 7-44 he uses the 12 ball to tie up the 8 ball for his opponent; now his opponent’s layout is even tougher (figure 7-45).' },
  { id: 'adv-e8-threerail', type: 'DECIDE', assist: 'ASSISTED', page: '146', title: '8-Ball: Long Breakout', fig: 'f7-46', reveal: 'f7-47', area: 'safety',
    prompt: 'He’s solids with a problem area of the 6 and 7; breaking out with the 5 or 2 would be long. What’s PKF’s defensive option?',
    choices: [['near', 'Send the 5 three rails near the problem, cue ball behind the 2'], ['long', 'Try the long breakout with the 5 anyway'], ['pocket', 'Pocket the 5 and the 2 first, then deal with the 6 and 7 at the end']], answer: 'near',
    explain: 'PKF: shoot the 5 ball three rails so it ends near the problem area and leave the cue ball behind the 2 (figure 7-47). Next turn, he can use the 5 to break out the problem balls.' },
  { id: 'adv-e8-nobreakout', type: 'PROBLEM', assist: 'ASSISTED', page: '147', title: '8-Ball: What’s Missing?', fig: 'fU171a', reveal: 'f7-49',
    prompt: 'Solids, with the 6 and 7 as a problem area. What’s the real problem with running out here?',
    choices: [['nobo', 'No breakout ball near the problem area'], ['eight', 'The 8 is tied up with a stripe'], ['angle', 'He has no shot on any solid']], answer: 'nobo',
    explain: 'PKF: when you have a ball or two tied up, look for a good breakout ball; “if you don’t have a breakout ball nearby you may want to think about stopping your run and relocating one of the balls.” Here he plays a defensive shot and sends one of his solids (the 3) near the problem area (figure 7-49), then uses the 3 to break out the problem balls on his next turn (figure 7-50).' },
  { id: 'adv-e8-keep3', type: 'SAFETY', assist: 'ASSISTED', page: '147', title: '8-Ball: Wrong Angle on the Breakout', fig: 'f7-51', reveal: 'f7-52',
    prompt: 'He’s running out solids; the 4 and 13 are tied up, and his breakout ball (the 3) has the wrong angle. What does PKF do?',
    choices: [['tap', 'Tap the 3 off the rail, keeping it near the 4; cue ball by the 9'], ['force', 'Force the breakout off the 3 with extra speed'], ['skip', 'Pocket the 3 now and come back for the 4 and 13 later in the rack']], answer: 'tap',
    explain: 'PKF: he plays a defensive shot and at the same time keeps the 3 ball near the 4 ball problem area: “Using a little right spin he’s going to tap the 3 ball away from the rail and put the cue ball next to the 9 ball (figure 7-52).” His opponent has no offensive shot and the 3 is still near the problem area.' },
  { id: 'adv-e8-remove', type: 'DECIDE', assist: 'INDEPENDENT', page: '147–148', title: '8-Ball: Opponent’s Ball in the Way', fig: 'fU172a', reveal: 'f7-55',
    prompt: 'Solids. He’s straight in on the 6, but the 2, 5 and 7 are difficult: the 9 blocks the pocket for the 7, and the 5 and 2 are tied up. What does PKF suggest?',
    choices: [['into9', 'Shoot the 2 into the 9, removing the blocker'], ['six', 'Pocket the 6, then the 3, and decide on the rest later'], ['seven', 'Bank the 7 into another pocket']], answer: 'into9',
    explain: 'PKF: shooting the 2 into the 9 removes the opponent’s ball near the pocket, freeing the 7, and the 2 then blocks the pocket for the 10 (figures 7-54 and 7-55).' },
  { id: 'adv-e8-bih', type: 'DECIDE', assist: 'INDEPENDENT', page: '148', title: '8-Ball: Ball in Hand With a Problem', fig: 'fU172b', reveal: 'f7-58',
    prompt: 'Ball in hand, solids. His 6 and 7 are a problem area; his opponent’s 11 and 13 are tied up. What does PKF do?',
    choices: [['into10', 'Shoot the 2 into the 10 and stop behind the 3'], ['run', 'Start running the open solids'], ['safe', 'Play a safety without moving any of the balls on the table']], answer: 'into10',
    explain: 'PKF: shooting the 3 and using the 2 to break out the 6 and 7 is risky. A good alternative is to shoot the 2 into the 10 (figure 7-57). It removes the opponent’s breakout ball and sends the 2 toward the problem area, breaking out the 6 and 7 (figure 7-58), and a stop shot hides the cue ball behind the 3.' }
]);

/* 4 · 8-BALL STRATEGIES · PART 2 (p149–152) */
add('eight-ball-2', [
  { id: 'adv-tw-5ball', type: 'TWOWAY', assist: 'GUIDED', page: '149', title: 'Two-Way: The 5 Ball', fig: 'fU173a', reveal: 'f7-60',
    prompt: 'Solids. He could roll in the 5 and play the 4 in the top right corner, but he isn’t confident about it. What two-way option does PKF show?',
    hint: 'PKF’s two-way shot: attempt the difficult shot and play position on your next ball, while leaving your opponent a tough shot if you miss.',
    choices: [['other', 'Pocket the 5 and play position on the 4 for the bottom right corner'], ['safe', 'Play a pure safety on the 5'], ['top', 'Shoot the 5 and play position on the 4 for the top right corner anyway']], answer: 'other',
    explain: 'PKF: pocket the 5 and play position on the 4 for the bottom right corner (figure 7-60). If he makes it he can still win the game (figure 7-61); if he misses he leaves his opponent a tough shot.' },
  { id: 'adv-tw-learn', type: 'LEARN', assist: 'GUIDED', page: '149', title: 'Two-Way Shots', fig: 'f7-61',
    explain: 'PKF: if you’re not confident in a tough shot, it may be a good idea to play a two-way shot: “These are shots that allow you to attempt a difficult shot and play position on your next ball, but it also allows you to leave your opponent a tough shot if you miss.” In figure 7-60 the player pockets the 5 and plays position on the 4 for the bottom right corner; if he makes it he can still win the game (figure 7-61).' },
  { id: 'adv-tw-choice', type: 'TWOWAY', assist: 'GUIDED', page: '149', title: 'Two-Way: 1, 3 or 5?', fig: 'fU173b', reveal: 'fU173b',
    prompt: 'He can shoot the 1, 3 or 5. Missing the 1 leaves a shot; a stop shot on the 3 leaves his opponent tough. Which does PKF shoot first?',
    choices: [['five', 'The 5 with a stop shot'], ['one', 'The 1, the proper order'], ['three', 'The 3 with a stop shot']], answer: 'five',
    explain: 'PKF: the 5 with a stop shot leaves his opponent hooked if he misses, and if he makes it he can shoot the 7 next. The proper order is 1, 3, 5, then the 7 to get on the 8, but missing the 1 leaves his opponent an easy shot, and that extra pressure may be enough to cause a miss. Shooting the 5 first removes the pressure.' },
  { id: 'adv-tw-order', type: 'SEQUENCE', assist: 'ASSISTED', page: '149', title: 'Two-Way: The Order After the 5', fig: 'fU173b', reveal: 'fU173b',
    prompt: 'Tap the balls in the order PKF shoots them, starting with the two-way shot on the 5 (the 8 comes last).',
    choices: [['1', '1'], ['3', '3'], ['5', '5'], ['7', '7']], answer: '5-7-3-1',
    explain: 'PKF: shooting the 5 first removes the pressure; “Now he can shoot the 7 ball, 3 ball, then use the 1 ball to play shape for the 8 ball.”' },
  { id: 'adv-tw-1soft', type: 'LEARN', assist: 'ASSISTED', page: '150', title: 'Two-Way: Shooting the 1 Softly', fig: 'fU174a',
    explain: 'PKF: in this layout (any solid), a decent two-way shot is shooting the 1 softly into the top right corner. “If he makes it he’ll have another offensive shot, but, if he misses, he won’t leave a shot for his opponent.” Two-way shots like this come up quite often in 8-Ball, so it’s a good idea to be aware of them.' },
  { id: 'adv-tw-easy', type: 'TWOWAY', assist: 'ASSISTED', page: '150', title: 'Two-Way: Not Confident in the 7', fig: 'f7-64', reveal: 'f7-64', hidePre: true,
    prompt: 'He can shoot the 3 in the side, the 7 in the corner, or the 2 in the bottom left corner. He isn’t confident in the 7. What does PKF suggest?',
    choices: [['two', 'Shoot the 2 easy in the corner'], ['seven', 'Shoot the 7 anyway and hope'], ['three', 'Shoot the 3 in the side hard']], answer: 'two',
    explain: 'PKF: if he’s confident in the 7 that is a good option. If not, shooting the 2 in the corner is a good two-way shot: “Shooting this shot easy will give him shape on the 4 ball on the end rail, and leave his opponent tough if he misses” (figure 7-64).' },
  { id: 'adv-tw-bank11', type: 'TWOWAY', assist: 'ASSISTED', page: '150', title: 'Two-Way: 14, 9 or 11?', fig: 'f7-65', reveal: 'f7-66',
    prompt: 'Stripes. He has the 14, the 9 or the 11. The 14 and 9 are risky. What’s PKF’s safest option?',
    choices: [['bank', 'Bank the 11 in the side with a stop shot'], ['nine', 'Cut the 9 in the corner'], ['fourteen', 'Shoot the 14 with follow for position on the 9']], answer: 'bank',
    explain: 'PKF: the 14 and 9 are both risky since missing either one leaves the opponent a shot. The safest shot is banking the 11 into the left side pocket with a stop shot (figure 7-66): if he makes it he has the 9 in the side pocket, and if he misses his opponent won’t have a shot.' },
  { id: 'adv-tw-slide', type: 'TWOWAY', assist: 'INDEPENDENT', page: '150–151', title: 'Two-Way: Blocked Pocket', fig: 'f7-67', reveal: 'f7-68',
    prompt: 'A different layout: he could bank the 11, but the 14 is a problem (its pocket is blocked by a solid). What does PKF show?',
    choices: [['slide', 'Shoot the 14 and slide the cue ball right'], ['bank', 'Bank the 11 in the side anyway'], ['leave', 'Leave the 14 and play the 9 first']], answer: 'slide',
    explain: 'PKF: shoot the 14 and slide the cue ball to the right side (figure 7-68). If he misses, his opponent is left tough; if he makes it he has the 9 next.' },
  { id: 'adv-pro-learn', type: 'LEARN', assist: 'INDEPENDENT', page: '151', title: 'Missing on the Pro Side', fig: 'f7-70',
    explain: 'PKF: when strong players bank balls in 9-Ball (figure 7-69), they sometimes favor coming up a hair short on corner pocket banks; “by coming up short they know the cue ball will end up near the end rail leaving their opponent a tough shot (figure 7-70).” In 8-Ball, missing banks on the pro side means hitting corner pocket banks a bit long so the ball will block the pocket for their opponent. In figure 7-71 the bank comes up short and leaves the pocket open; in figure 7-72 it’s a hair long and the 1 blocks the pocket for the stripes.' },
  { id: 'adv-pro-8ball', type: 'RECOGNIZE', assist: 'INDEPENDENT', page: '151', title: 'Pro Side in 8-Ball', fig: 'f7-71', reveal: 'f7-72',
    prompt: 'In 8-Ball, which way is the pro side on a corner pocket bank?',
    choices: [['long', 'A hair long, so the ball blocks the pocket'], ['short', 'A hair short, leaving the pocket open'], ['center', 'Dead center, with no miss side at all']], answer: 'long',
    explain: 'PKF: in figure 7-71 the bank comes up short and leaves an open pocket; a hair long (figure 7-72) and the 1 blocks the pocket for the stripes.' },
  { id: 'adv-pro-speed', type: 'DECIDE', assist: 'INDEPENDENT', page: '152', title: 'Bank Speed', fig: 'fU176a', reveal: 'fU176a',
    prompt: 'He isn’t confident about this bank on the 1, so he favors the pro side, leaving the 1 near the side rail blocking the 10. At what speed does PKF bank it?',
    choices: [['near', 'A speed that keeps the 1 near the corner pocket if he misses'], ['hard', 'Hard, so the 1 travels well away from the pocket if he misses'], ['any', 'Speed doesn’t matter on a bank']], answer: 'near',
    explain: 'PKF: “When banking balls in 8-Ball it’s important to bank at a speed that will keep the ball close to the pocket.” If he’s confident he can go all out; if not, he favors the pro side, leaving the 1 near the side rail blocking the 10, banking at a speed that keeps the 1 near the corner pocket.' },
  { id: 'adv-callsafe', type: 'DECIDE', assist: 'INDEPENDENT', page: '152', title: 'Call Safe', fig: 'f7-74', reveal: 'f7-75', area: 'safety',
    prompt: 'Solids, with the 1 as a problem and no breakout ball nearby. Pocketing the 7 and using the 2 or 5 to break out the 1 is a tall order; shape on the 1 for a side bank is risky. What does PKF do?',
    choices: [['callsafe', 'Call safe, pocket the 7, hide behind the 2 and 5'], ['bank', 'Get shape for the side bank on the 1'], ['break', 'Try to break out the 1 with the 2 after pocketing the 7']], answer: 'callsafe',
    explain: 'PKF: “A better option is to call safe and pocket the 7 ball leaving the cue ball behind the 2 and 5 ball (figure 7-75). Now there’s an excellent chance he’ll get ball in hand which he can use to pocket the 1 ball and run out.” PKF notes this comes up every once in a while, but few people use it.' },
  { id: 'adv-twoproblem', type: 'DECIDE', assist: 'INDEPENDENT', page: '152', title: 'Two Problem Areas', fig: 'f7-76', reveal: 'f7-77',
    prompt: 'He has two problem areas: the 5 and the 6. What does PKF suggest?',
    choices: [['into11', 'Shoot the 5 into the 11 to block the 8’s pocket'], ['run', 'Shoot the 7 or 3 and try the runout'], ['six', 'Break out the 6 with power from the 7']], answer: 'into11',
    explain: 'PKF: with two problem areas he probably won’t be able to run out. “A better option is to shoot the 5 ball into the 11 ball making it in the corner pocket. He wants to leave the 5 ball near the side rail blocking the pocket for the 8 ball; if he uses high left spin, his cue ball may end up below the 5 ball for a good safety shot (figure 7-77).”' }
]);

/* 5 · 8-BALL STRATEGIES · PART 3 (p153–157) */
add('eight-ball-3', [
  { id: 'adv-side-choose', type: 'RECOGNIZE', assist: 'GUIDED', page: '153', title: 'Stripes or Solids?', fig: 'f7-78', reveal: 'f7-78',
    prompt: 'Both groups are spread out and share the same problem area (highlighted). The stripes can break it out with the 10, the solids with the 4. The 9 sits close to the bottom left corner pocket. Which side is the better option?',
    hint: 'Ask: after the breakout, is a shot guaranteed?',
    choices: [['stripes', 'Stripes: the 9 is an insurance ball after the breakout'], ['solids', 'Solids: the 4 is a better breakout ball for the problem area'], ['equal', 'They’re exactly equal']], answer: 'stripes',
    explain: 'PKF: when a top player first steps to an 8-Ball table, the first thing they look at is which side has more problem areas. Next they look for balls to break out the problem area, then for insurance balls nearby after the breakout. If he chooses stripes and shoots the 10 into the side pocket breaking out the problem area, the 9 close to the bottom left corner gives him an excellent chance to continue; the 9 is his insurance ball. Solids have no insurance ball near the problem area, so the stripes are the better option.' },
  { id: 'adv-side-insurance', type: 'PREDICT', assist: 'GUIDED', page: '153', title: 'If Solids Had an Insurance Ball', fig: 'f7-79', reveal: 'f7-79',
    prompt: 'Same table, but now the solids also have an insurance ball (figure 7-79). How do the two sides compare?',
    choices: [['equal', 'About equal now: both have insurance'], ['stripes', 'Stripes are still clearly better'], ['solids', 'Solids are now clearly better']], answer: 'equal',
    explain: 'PKF: “If the solids had an insurance ball (figure 7-79), both sides would be about equal since solids will be almost guaranteed a shot after the breakout.” Top players always study the problem areas for both sides, the breakout balls, and any insurance balls before choosing.' },
  { id: 'adv-side-more', type: 'DECIDE', assist: 'ASSISTED', page: '154', title: 'More Problem Areas, Still Better?', fig: 'f7-80', reveal: 'f7-80',
    prompt: 'Stripes have two problem areas (highlighted) but there are stripes near them to break them out. Solids have one problem area, the 5, with no solids near it. Which side?',
    choices: [['stripes', 'Stripes'], ['solids', 'Solids: one fewer problem area']], answer: 'stripes',
    explain: 'PKF: sometimes top players choose the side with more problem areas. “Even though stripes have one more problem area than solids, stripes are still the better choice due to the fact that there are stripes near the problem areas.”' },
  { id: 'adv-pro-7ball', type: 'PROBLEM', assist: 'ASSISTED', page: '154', title: 'Top Players: The 7 Ball', fig: 'fU178a', reveal: 'fU178a',
    prompt: 'A game between two of the top players in the world: solids are at the table with a problem area on the 7 and no solids near it. Until he resolves the 7, what does he not want to do?',
    choices: [['pocket', 'Pocket any more solids'], ['safe', 'Play any safety'], ['bank', 'Bank any ball']], answer: 'pocket',
    explain: 'PKF: he could try a difficult runout (5, 3, 6 and breaking out the 7), but if he doesn’t run the table his opponent would have a much easier layout. “The player knows that until he resolves the issue with the 7 ball he doesn’t want to pocket any more solids.”' },
  { id: 'adv-pro-7ball2', type: 'DECIDE', assist: 'ASSISTED', page: '154', title: 'Top Players: What He Did', fig: 'fU178a', reveal: 'f7-83', area: 'safety',
    prompt: 'So what did the top player do here?',
    choices: [['bank6', 'Banked the 6 two rails, leaving a breakout ball near the 7'], ['run', 'Shot the 5, 3 and 6 and then tried to break out the 7 with the 6'], ['seven', 'Shot directly at the 7 to break it loose']], answer: 'bank6',
    explain: 'PKF: “the player banked the 6 ball two rails toward the other end of the table (figure 7-82). He not only left his opponent tough but he now has a breakout ball near the 7 ball (figure 7-83).”' },
  { id: 'adv-cluster-2', type: 'DECIDE', assist: 'INDEPENDENT', page: '155', title: 'Four Solids in the Rack Area', fig: 'f7-84', reveal: 'f7-86', area: 'safety',
    prompt: 'Solids, with four balls clustered in the rack area. He could shoot the 3, then the 4 in the top right corner breaking out the other three solids, but he’d still have a problem with the 2. What’s PKF’s alternative?',
    choices: [['bank2', 'Shoot the 3, then bank the 2 into the cluster'], ['run', 'Shoot the 3, then the 4 for the breakout'], ['two', 'Pocket the 2 first, then the cluster']], answer: 'bank2',
    explain: 'PKF: running this rack would take a lot of skill along with a little luck. The alternative is to shoot the 3 ball and bank the 2 ball into the cluster, leaving the cue ball next to the 8. This removes the 2 from its problem area and helps break out the cluster while leaving the opponent safe (figure 7-86).' },
  { id: 'adv-below15', type: 'DECIDE', assist: 'INDEPENDENT', page: '155–156', title: 'No Breakout Ball Nearby', fig: 'fU179a', reveal: 'f7-89',
    prompt: 'Solids come to the table after stripes missed. Problem area: the 2 and 7, no breakout ball nearby. Shooting the 1 now and spinning down toward the problem is a low percentage breakout. What might be better?',
    choices: [['six', 'Pocket the 6, then bank the 5 near the problem playing safe'], ['one', 'Shoot the 1 and spin down toward the 2 and 7 anyway, then hope'], ['quit', 'Play safe without moving any solids']], answer: 'six',
    explain: 'PKF: “A better option might be to pocket the 6 ball and play position below the 1 and 5 ball (figure 7-88). Now he can bank the 5 ball down table near this problem area and at the same time, play safe on his opponent (figure 7-89).”' },
  { id: 'adv-bank2-near', type: 'SAFETY', assist: 'INDEPENDENT', page: '156', title: 'Running Out, Problem Unsolved', fig: 'f7-90', reveal: 'f7-91',
    prompt: 'Solids are running out but haven’t solved the 3 and 8 problem area, and no solid is near it to break it out. What’s PKF’s option?',
    choices: [['bank', 'Bank the 2 near the problem, cue ball behind the 1 and 7'], ['run', 'Keep running and deal with the 3 and 8 last'], ['eight', 'Shoot a solid into the 8 to break it out']], answer: 'bank',
    explain: 'PKF: “A good option here is to bank the 2 ball so it’s close to the problem area and leave the cue ball behind the 1 and 7 ball (figure 7-91).”' },
  { id: 'adv-8tied', type: 'DECIDE', assist: 'INDEPENDENT', page: '156', title: 'The 8 Is Tied Up', fig: 'f7-92', reveal: 'f7-93', area: 'safety',
    prompt: 'Solids have an easy run, but the 8 is tied up with a stripe. Breaking it out with the 3 means a long way to travel and no insurance ball. What might be better?',
    choices: [['bank1', 'Bank the 1 near the problem and play safe'], ['three', 'Break it out with the 3 anyway'], ['run', 'Run the solids and deal with the tied-up 8 at the end']], answer: 'bank1',
    explain: 'PKF: “the farther you have to travel to break out a problem area the more things that can go wrong.” A better option might be to bank the 1 toward the problem area and play safe behind the 2 and 5 (figure 7-93). “Even if the 1 ball misses the problem area at least you have a solid near that area now.”' },
  { id: 'adv-asap', type: 'RECOGNIZE', assist: 'INDEPENDENT', page: '157', title: 'Put the Brakes On', fig: 'f7-94', reveal: 'f7-95',
    prompt: 'Stripes are running out with the 10 and 13 still a problem, and the 12 doesn’t go in the top right corner. What’s PKF’s rule of thumb?',
    choices: [['asap', 'Break out problem areas as soon as possible'], ['last', 'Leave problem areas for the end of the rack'], ['easy', 'Pocket the easy balls first to clear the table']], answer: 'asap',
    explain: 'PKF: “A good rule of thumb to remember is to break out problem areas as soon as possible; also, you never want to pocket any balls until you come up with a strategy for going after these problem areas.” Here he shot the 12 near the top right corner and sent the cue ball into the problem area, breaking out both balls and blocking the top right corner pocket for his opponent (figure 7-95).' },
  { id: 'adv-noplan', type: 'DECIDE', assist: 'INDEPENDENT', page: '157', title: 'No Game Plan', fig: 'fU181a', reveal: 'f7-98', area: 'safety',
    prompt: 'Solids, with a problem area on the 5 and 2, and he can’t come up with a game plan for the runout. What does PKF suggest?',
    choices: [['both', 'A shot that removes the problem and plays safe at once'], ['run', 'Run what he can and play safe when the runout gets hard'], ['hard', 'Smash into the problem area and hope']], answer: 'both',
    explain: 'PKF: he shot the 4 in the side and rolled the cue ball down to the end of the table (figure 7-97), then shot the 2 into the 11 playing safe behind the 5 (figure 7-98). “If you can’t come up with a good game plan for a runout, try to create a strategy for removing problem areas and playing safe at the same time.”' }
]);

/* 6 · 8-BALL STRATEGIES · PART 4 (p158–161) */
add('eight-ball-4', [
  { id: 'adv-flat4', type: 'DECIDE', assist: 'GUIDED', page: '158', title: 'Flat Angle on the 4', fig: 'f7-99', reveal: 'f7-100', area: 'safety',
    prompt: 'He has a flat angle on the 4, so getting position on his next solids at the other end will be difficult. What does PKF suggest?',
    hint: 'Defense can also create a problem for your opponent.',
    choices: [['safe', 'A simple safe that blocks the 8’s pocket'], ['power', 'Power the shot to get position'], ['bank', 'Bank the 4 for a better angle']], answer: 'safe',
    explain: 'PKF: “Instead of trying to power the shot to get position, he can play a simple safe and at the same time create a problem area for the stripes by blocking the pocket for the 8 ball (figure 7-100).”' },
  { id: 'adv-lockup', type: 'SAFETY', assist: 'GUIDED', page: '158', title: 'Defense Without a Snooker', fig: 'f7-101', reveal: 'f7-102',
    prompt: 'Stripes have a problem area with the 9. Instead of a low percentage runout, what kind of defense does PKF show?',
    choices: [['next', 'Shoot the 12 into the 9, cue ball next to the 5'], ['behind', 'Snooker the opponent behind a stripe'], ['long', 'Leave the cue ball on the far rail, away from all the balls']], answer: 'next',
    explain: 'PKF: “Sometimes when you play defense in 8-Ball, it doesn’t always mean that you’re going to snooker your opponent behind another ball. Sometimes you can play defense just by leaving the cue ball right next to one of their balls.” Shooting the 12 into the 9 leaves the cue ball next to the 5 (figure 7-102): the problem area is broken out and the opponent has no offensive shot.' },
  { id: 'adv-lockup2', type: 'SAFETY', assist: 'ASSISTED', page: '158–159', title: 'Locking Up the Cue Ball', fig: 'fU182a', reveal: 'fU183a',
    prompt: 'Stripes, with a problem area on the 9; a runout has very little room for error. What’s the better option?',
    choices: [['away', 'Shoot the 9 away and hide behind the 7'], ['run', 'Try the runout carefully'], ['ten', 'Shoot the 10 first and see']], answer: 'away',
    explain: 'PKF: shoot the 9 away from this area and leave the cue ball behind the 7. It frees up the three ball cluster (8, 9 and 10) and leaves the opponent without a good offensive or defensive shot.' },
  { id: 'adv-5into3', type: 'DECIDE', assist: 'ASSISTED', page: '159', title: 'The 3 and 5 Problem', fig: 'f7-105', reveal: 'f7-106', area: 'safety',
    prompt: 'Solids, with a problem area on the 3 and 5. Shooting the 2, then using the 1 to break them out is risky, with no guaranteed shot after. What might be better?',
    choices: [['5into3', 'Shoot the 5 into the 3, cue ball next to the 10'], ['2then1', 'Shoot the 2 and then break out the problem with the 1'], ['eight', 'Play position for the 8 area first']], answer: '5into3',
    explain: 'PKF: “A better option might be to shoot the 5 ball into the 3 ball sending both balls away from this area and leaving the cue ball next to the 10 ball (figure 7-106).” The opponent has no good offensive shot and both solids are freed up.' },
  { id: 'adv-lastball', type: 'DECIDE', assist: 'ASSISTED', page: '159', title: 'No Shot on Your Last Ball', fig: 'f7-107', reveal: 'f7-108',
    prompt: 'He has no shot on his last ball, the 4, and his opponent has several balls left. What does PKF suggest?',
    choices: [['foul', 'An intentional foul that creates a problem area'], ['kick', 'A low percentage kick at the 4'], ['hard', 'Hit the 4 hard and hope it goes']], answer: 'foul',
    explain: 'PKF: “Instead of trying a low percentage kick shot, a better option would be to take an intentional foul by shooting the 13 and 8 ball toward the side rail creating a problem area (figure 7-108).” He’s still at a big disadvantage, but his opponent’s layout is much tougher.' },
  { id: 'adv-lastball2', type: 'PREDICT', assist: 'INDEPENDENT', page: '159–160', title: 'Tie Up Two Stripes', fig: 'f7-109', reveal: 'f7-110',
    prompt: 'No shot on his last solid (the 4). He softly shoots the 14 and 12 to the side rail. What has he created?',
    choices: [['two', 'Two problem areas for his opponent'], ['shot', 'An easy shot for himself on the 4'], ['nothing', 'Nothing: it’s just a foul']], answer: 'two',
    explain: 'PKF: “He softly shoots the 14 and 12 ball sending them both to the side rail. Now he’s created two problem areas for his opponent and he may get another shot at the table (figure 7-110).”' },
  { id: 'adv-reposition', type: 'DECIDE', assist: 'INDEPENDENT', page: '160', title: 'Balls Don’t Break Out', fig: 'f7-111', reveal: 'f7-112',
    prompt: 'The balls haven’t broken out well (as often happens on a bar table). He’s solids. What do strong players usually do?',
    choices: [['block', 'Use their balls to block the corner pockets'], ['run', 'Try to run the table anyway'], ['break', 'Break up every cluster right away']], answer: 'block',
    explain: 'PKF: when the balls don’t break out well, strong players usually won’t try to run the table; “instead, they’ll start to reposition their balls near the corner pockets to use as blockers.” He repositions the 5 in front of the corner pocket, taking this pocket away from the 10 and 12 (figure 7-112).' },
  { id: 'adv-carom15', type: 'DECIDE', assist: 'INDEPENDENT', page: '160', title: 'Clustered Table', fig: 'f7-113', reveal: 'f7-114',
    prompt: 'Clustered table; he’s solids with a shot on the 7 but no clear path for the runout. What does PKF suggest?',
    choices: [['carom', 'Carom off the 3 and make the 15'], ['seven', 'Shoot the 7 and keep going'], ['safe', 'Play safe on the 7']], answer: 'carom',
    explain: 'PKF: “When the runout is low percentage you want to steer clear of pocketing any balls if you can help it. A good option here is to carom the cue ball off the 3 ball and make the 15 ball; this not only removes an obstacle ball but now the 3 ball is blocking the pocket for the 14 ball (figure 7-114).”' },
  { id: 'adv-control', type: 'DECIDE', assist: 'INDEPENDENT', page: '160–161', title: 'Take Control of a Pocket', fig: 'f7-115', reveal: 'f7-117',
    prompt: 'Everything is clustered again. Instead of an extremely difficult runout, what does PKF’s player do?',
    choices: [['control', 'Take control of a corner pocket with the 2'], ['run', 'Attempt the runout one ball at a time and see'], ['nine', 'Leave the 9 in the side for himself']], answer: 'control',
    explain: 'PKF: he shoots the 2 into the 3, 7 and 11, sending the 7 and 5 toward the side rail (figure 7-116); the solids now control the lower left corner pocket (figure 7-117). The opponent has a shot on the 9 in the side but their runout has several problem areas. “It’s often a good idea to bait your opponent into trying a low percentage runout; this will clear a few of their balls off the table making your run easier when you get to the table.”' }
]);

/* 7 · COMBINATIONS (p161–165) */
add('combinations', [
  { id: 'adv-cb-aim', type: 'METHOD', assist: 'GUIDED', page: '161–162', title: 'Combinations: The 4-9', fig: 'f7-118', reveal: 'f7-121',
    prompt: 'He’s playing 9-Ball with a 4, 9 combination. How does a top player approach it?',
    hint: 'Treat one of the object balls as something else.',
    choices: [['cue', 'Use the 4 as a cue ball to find a rail spot'], ['ghost', 'Aim the cue ball at the 9 directly'], ['fast', 'Shoot it quickly before the tension of the shot builds']], answer: 'cue',
    explain: 'PKF: strong players never like playing combinations on the 9 ball, they would much rather run the table; when they do, they really take their time. A top player pretends the first object ball is the cue ball (figure 7-119) to find the shooting line to the side rail and where it ends up (figure 7-120), then pretends the second ball doesn’t exist (figure 7-121) and shoots the first object ball toward that spot. Since you can’t mark the rail, look for imperfections like scratches on the rail to use as a target.' },
  { id: 'adv-cb-twoway', type: 'TWOWAY', assist: 'GUIDED', page: '162', title: 'Combinations: Two-Way', fig: 'f7-118', reveal: 'f7-122',
    prompt: 'Strong players sometimes play a two-way on combinations. How did the player in figure 7-122 do it?',
    choices: [['low', 'Low spin and a little extra speed'], ['high', 'High spin to follow the 4 toward the pocket'], ['soft', 'Very soft so the 9 stays near the pocket']], answer: 'low',
    explain: 'PKF: “the player used low spin and a little extra speed to bring the cue ball back to the side rail. Now if the player misses the combination he’ll leave his opponent a tough shot.”' },
  { id: 'adv-cb-46', type: 'METHOD', assist: 'ASSISTED', page: '162', title: 'Combinations: The 4-6', fig: 'f7-123', reveal: 'f7-124',
    prompt: 'A 4, 6 combination. After aiming the 4 at the 6 as if the 4 were the cue ball, what does he do?',
    choices: [['extend', 'Extend the line to an end rail target and aim there'], ['six', 'Look at the 6 last while stroking'], ['pocket', 'Aim the 4 at the pocket through the 6']], answer: 'extend',
    explain: 'PKF: “Once he finds this shooting line he extends it to the end rail and finds his target; now he’ll pretend the 6 ball isn’t there and shoots the 4 ball toward this spot on the rail (figure 7-124).”' },
  { id: 'adv-cb-side', type: 'PREDICT', assist: 'ASSISTED', page: '163', title: 'Combinations: Wrong Side of the Line', fig: 'f7-128', reveal: 'f7-129',
    prompt: 'He shoots the 3, then the 4, 5 combination. If the cue ball ends up on this side of the shooting line (figure 7-128), what happens after the combination?',
    choices: [['nogood', 'No good offensive shot after it'], ['good', 'He has an easy shot on the 4'], ['scratch', 'He scratches in the side pocket']], answer: 'nogood',
    explain: 'PKF: top players are always aware of the angle they’ll need on combinations. On this side of the line “the cue ball will be heading to the side rail while the 4 ball heads to the end rail leaving him without a good offensive shot (figure 7-129).”' },
  { id: 'adv-cb-side2', type: 'PREDICT', assist: 'ASSISTED', page: '163', title: 'Combinations: Right Side of the Line', fig: 'f7-130', reveal: 'f7-131',
    prompt: 'Now he ends up on the other side of the shooting line (figure 7-130). What happens when he makes the combination?',
    choices: [['same', 'They travel the same way: a shot on the 4'], ['apart', 'They split apart: no shot on the 4'], ['stop', 'The cue ball stops dead near the rail']], answer: 'same',
    explain: 'PKF: “Now when he makes the combination the cue ball and 4 ball will be traveling in the same direction which means he’ll have a shot on the 4 ball (figure 7-131).” Always determine the path the first object ball will take after contacting the second.' },
  { id: 'adv-cb-23', type: 'PREDICT', assist: 'INDEPENDENT', page: '163–164', title: 'Combinations: The 2-3', fig: 'f7-133', reveal: 'f7-137',
    prompt: 'On the 1, with the 2, 3 combination next. The 2 will head to the side rail below the side pocket after making the 3. Where should he play shape?',
    choices: [['correct', 'Where the cue ball and 2 travel the same way'], ['below', 'Below the shooting line, near the side pocket'], ['on', 'Exactly on the shooting line']], answer: 'correct',
    explain: 'PKF: in figure 7-134 the player ended up below the shooting line and was left without a good offensive shot (figure 7-135). On the correct side of the line (figure 7-136), the cue ball and 2 travel in the same direction (figure 7-137). Determine the path the first object ball takes after contact, then the angle you need for a shot afterwards.' },
  { id: 'adv-cb-predict', type: 'PREDICT', assist: 'INDEPENDENT', page: '164–165', title: 'Combinations: Predict the Side', fig: 'f7-138', reveal: 'f7-141',
    prompt: 'PKF asks you to predict: which side of the line does the player need to be on for the 2, 3 combination after shooting the 1?',
    choices: [['above', 'Above the combination line'], ['below', 'Below the combination line']], answer: 'above',
    explain: 'PKF: the 2 will head toward the end rail after contacting the 3, so the cue ball also needs to head toward the end rail. Below the line it naturally heads away from the end rail (figure 7-139). Above the combination line (figure 7-140) it heads toward the end rail, leaving a shot on the 2 (figure 7-141).' },
  { id: 'adv-cb-hide', type: 'SAFETY', assist: 'INDEPENDENT', page: '165', title: 'Combinations: Build in a Safety', fig: 'f7-142', reveal: 'f7-143',
    prompt: 'Ball in hand; he decides to play the 1, 9 combination, but he could miss due to the distance. What does PKF build into the shot?',
    choices: [['hide', 'An angle that rolls the cue ball behind the 4'], ['power', 'Extra power so the 9 goes in'], ['draw', 'Draw back to the end rail, away from the 9, for safety']], answer: 'hide',
    explain: 'PKF: a good hiding spot is behind the 4. He gives himself an angle on the 1 that lets the cue ball roll forward behind the 4 (figure 7-143). “By playing the combination this way it’s essentially a free shot.”' },
  { id: 'adv-cb-phys-hide', type: 'SHOOT', assist: 'INDEPENDENT', page: '165', title: 'Table: Combination With a Safety', fig: 'f7-142', reveal: 'f7-143', plan: 'adv-cb-hide',
    phys: { kind: 'twoway', setup: [IMG_SETUP('diagram (figure 7-142)'), 'Ball in hand: place the cue ball for an angle on the 1 as PKF shows.'],
      steps: ['Play the 1, 9 combination.', 'The angle on the 1 lets the cue ball roll forward behind the 4.'],
      objective: 'Make the 9, or miss with the cue ball hidden behind the 4 (figure 7-143).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } }
]);

/* 8 · CONSISTENCY (p166–167) */
add('consistency', [
  { id: 'adv-co-learn', type: 'LEARN', assist: 'GUIDED', page: '166', title: 'PKF’s Consistency Test', fig: 'fU190a',
    explain: 'PKF: many players complain they aren’t consistent, but most are actually very consistent. The test: set up six balls in any location; run them in order, calling the pocket for each ball (“First choose pockets for each ball, then run the balls in order.”). Complete it and six more balls go out. To move on to seven balls, execute seven successful runs out of ten. If six is a struggle, remove a ball and run five; if that fails, remove another and run four. It takes correct angles, pattern play knowledge, ball pocketing and speed control.' },
  { id: 'adv-co-seven', type: 'RECOGNIZE', assist: 'GUIDED', page: '166', title: 'Consistency: Moving Up', fig: 'fU190a', reveal: 'fU190a',
    prompt: 'In PKF’s test, what does a player need to move on to seven balls?',
    choices: [['7of10', 'Seven runs out of ten'], ['3row', 'Three runs in a row'], ['1', 'One successful run']], answer: '7of10',
    explain: 'PKF: “In order to move on to seven balls they have to execute seven successful runs out of ten.” The same 7-of-10 goal applies at five and four balls.' },
  { id: 'adv-co-why', type: 'RECOGNIZE', assist: 'ASSISTED', page: '166–167', title: 'Consistency: The Real Reason', fig: 'fU191a', reveal: 'fU191a',
    prompt: 'According to PKF, why do players feel inconsistent?',
    choices: [['patterns', 'The patterns they meet are inconsistent'], ['stroke', 'Their stroke changes day to day'], ['luck', 'Pool is mostly luck, and the rolls change from rack to rack']], answer: 'patterns',
    explain: 'PKF: in 8-Ball players can sometimes get away with faulty speed control and incorrect angles. “So it’s not so much that the player is inconsistent, it’s that the 9-Ball and 8-Ball patterns they encounter are inconsistent.” You’re never going to improve until you’re honest about your true skill level.' },
  { id: 'adv-co-struggle', type: 'METHOD', assist: 'ASSISTED', page: '167', title: 'Consistency: When You’re Struggling', fig: 'fU191a', reveal: 'fU191a',
    prompt: 'Struggling players tend to tweak their stroke and stance first. What does PKF say it is most of the time?',
    choices: [['basics', 'Pocketing, angles and pattern choice'], ['stance', 'Their stance and alignment'], ['cue', 'Their cue and tip']], answer: 'basics',
    explain: 'PKF: “Sometimes it is their stroke and stance that needs tweaking, but most of the time it’s their ball pocketing, playing incorrect angles, and choosing the wrong patterns for runouts.” The parts to develop: Shot Repertoire, Pattern Play, Correct Angles, Ball Pocketing and Table Management.' },
  { id: 'adv-co-miss', type: 'RECOGNIZE', assist: 'INDEPENDENT', page: '167', title: 'Consistency: Allow Yourself to Miss', fig: 'fU191a', reveal: 'fU191a',
    prompt: 'What does PKF say the player finally needs to do?',
    choices: [['miss', 'Allow themselves to miss'], ['never', 'Never miss in practice'], ['more', 'Practice only offense']], answer: 'miss',
    explain: 'PKF: “Finally, the player needs to allow themselves to miss. Once they allow themselves to make mistakes they can start to pinpoint what they need to work on.” Every time you’re at the table it should be considered training: study your game, take notes and pinpoint weak areas.' },
  { id: 'adv-co-phys', type: 'SHOOT', assist: 'INDEPENDENT', page: '166', title: 'Table: Six-Ball Consistency Test', fig: 'fU190a', reveal: 'fU190a',
    phys: { kind: 'pattern', setup: ['Throw six balls on the table in any location (PKF).'],
      steps: ['First choose pockets for each ball.', 'Run the balls in order, calling each pocket.', 'PKF’s full test: seven successful runs out of ten to move up to seven balls; if six is a struggle, drop to five (then four).'],
      objective: 'Run all six balls in order into the called pockets.', gaps: ['Ball positions: any location (PKF)', 'The app records up to three runs here; PKF’s own test is seven out of ten.'] } }
]);

/* 9 · 9-BALL TIPS (p168–172) */
add('nine-ball', [
  { id: 'adv-nb-hanging', type: 'DECIDE', assist: 'GUIDED', page: '168', title: 'Push Out: Ball in the Jaws', fig: 'f7-146', reveal: 'f7-147',
    prompt: 'He broke and was left hidden on the 1, which is in the jaws of the corner pocket. A weak push out leaves an easy jump or kick. What’s often a good idea?',
    hint: 'A hanging ball gives the opponent many ways to pocket it.',
    choices: [['pocket', 'Push out by pocketing the 1, leaving a tough 2'], ['roll', 'Push out softly to a spot near the 1'], ['kick', 'Kick at the 1 without a push out']], answer: 'pocket',
    explain: 'PKF: when a ball is hanging in a pocket it’s very difficult to execute a successful push out, since the opponent has many options. “When a ball is hanging in the pocket like this it’s often a good idea to pocket the ball.” In figure 7-147 he calls push out, shoots the 6 into the 1 making it in the corner, and leaves his opponent a tough shot on the 2. This strategy is often overlooked.' },
  { id: 'adv-nb-lowkick', type: 'DECIDE', assist: 'GUIDED', page: '168', title: 'Low Percentage Kick', fig: 'f7-148', reveal: 'f7-149', area: 'safety',
    prompt: 'He’s hooked on the 3 with very little chance of hitting it; many players would try three or four rails. What does PKF suggest?',
    choices: [['tie', 'Tie up a couple of balls'], ['kick', 'Try the three or four rail kick'], ['jump', 'Jump at the 3 with a full hit']], answer: 'tie',
    explain: 'PKF: one big mistake in 9-Ball is attempting low percentage kick shots. “When you’re left with a low percentage kick shot you may want to think about tying up a couple balls.” He tied up the 4 and 5 instead (figure 7-149) and almost guaranteed himself another shot.' },
  { id: 'adv-nb-9push', type: 'DECIDE', assist: 'ASSISTED', page: '169', title: 'Push Out: 9 Near the Side', fig: 'f7-150', reveal: 'f7-150', hidePre: true,
    prompt: 'He broke and is hooked on the 2, and the 9 is next to the side pocket. He has to call push out. What may he want to do?',
    choices: [['pocket9', 'Pocket the 9 on the push out'], ['weak', 'Push out softly near the 2'], ['leave', 'Leave the 9 where it is']], answer: 'pocket9',
    explain: 'PKF: he called push out and pocketed the 9, leaving a tough shot for the 2 (figure 7-150). When you push out you’re at a disadvantage since the opponent can accept or pass; the last thing you want is a weak push out with the 9 hanging in a pocket, which may mean a quick victory for the opponent.' },
  { id: 'adv-nb-strong', type: 'DECIDE', assist: 'ASSISTED', page: '169', title: 'Push Out vs a Strong Player', fig: 'f7-151', reveal: 'f7-152',
    prompt: 'The opponent broke dry and he can’t see the 1. He’s playing a strong player. What should his push out do?',
    choices: [['tie', 'Tie a ball up, leaving it tough'], ['open', 'Break out the problem balls'], ['easy', 'Leave an easy shot to bait him']], answer: 'tie',
    explain: 'PKF: against a strong player he’ll want to tie a ball up on the push out: shoot the 4 toward the side rail leaving it tough (figure 7-152). “The last thing you want to do is hand over an open table to a strong player on a push out.”' },
  { id: 'adv-nb-weak', type: 'DECIDE', assist: 'ASSISTED', page: '169', title: 'Push Out vs a Weak Opponent', fig: 'f7-153', reveal: 'f7-154',
    prompt: 'He broke and has no shot on the 2. He’s playing a weak opponent. What should his push out do?',
    choices: [['break', 'Break out the problem areas'], ['tie', 'Tie a ball up near a rail'], ['hide', 'Hide the cue ball behind a ball']], answer: 'break',
    explain: 'PKF: “The opposite is true when playing a weak opponent. When you have to play a push out against a weak opponent, always try to break out any problem areas.” He breaks out the 3 and 4 on his push out (figure 7-154).' },
  { id: 'adv-nb-bih1', type: 'SAFETY', assist: 'INDEPENDENT', page: '170', title: 'Ball in Hand, Problem Area', fig: 'f7-155', reveal: 'f7-156',
    prompt: 'Ball in hand; the table is open except the 3 and 8 are tied up. Pocketing the 1 and using the 2 to break them out isn’t easy. What strategy do strong players use?',
    choices: [['toward', 'Send the 1 toward the problem while playing safe'], ['run', 'Run to the 2 and try the breakout'], ['ignore', 'Ignore the problem area and run as many balls as he can']], answer: 'toward',
    explain: 'PKF: “A strategy many strong players use when they have ball in hand and there’s a problem area on the table, is to shoot their object ball toward this area while playing safe.” He shot the 1 toward the problem area and put the cue ball behind the 7 (figure 7-156).' },
  { id: 'adv-nb-phys-bih1', type: 'SHOOT', assist: 'INDEPENDENT', page: '170', title: 'Table: Ball in Hand Breakout Safety', fig: 'f7-155', reveal: 'f7-156', plan: 'adv-nb-bih1',
    phys: { kind: 'safety', setup: [IMG_SETUP('diagram (figure 7-155)'), 'Ball in hand: place the cue ball for the 1.'],
      steps: ['Shoot the 1 toward the 3 and 8 problem area.', 'Put the cue ball behind the 7 (figure 7-156).'],
      objective: '1 near the problem area and the cue ball hidden behind the 7.', gaps: [POSITIONS, 'Cue ball placement, speed and spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-nb-bih2', type: 'SAFETY', assist: 'INDEPENDENT', page: '170', title: 'Ball in Hand on the 5', fig: 'f7-157', reveal: 'f7-158',
    prompt: 'Ball in hand on the 5, with the 7 and 8 a problem area. Using the 6 to break them out guarantees no shot after. What’s the good alternative?',
    choices: [['tuck', 'Send the 5 toward the problem, cue ball behind the 9'], ['six', 'Break out the 7 and 8 with the 6'], ['run', 'Run the 5 and 6 and see what happens']], answer: 'tuck',
    explain: 'PKF: “A good alternative is to shoot the 5 ball toward this problem area and tuck the cue ball behind the 9 ball (figure 7-158).”' },
  { id: 'adv-nb-side', type: 'DECIDE', assist: 'INDEPENDENT', page: '170–171', title: 'Side or Corner?', fig: 'fU194a', reveal: 'f7-160',
    prompt: 'Ball in hand on the 3; the 4 is next to the side pocket. Most players instinctively play the 4 in the side, but coming up short (A) means two or three rails for the 5. Where does PKF play the 4?',
    hint: 'Look at where the next ball is in the pattern.',
    choices: [['corner', 'In the corner with a stop shot'], ['side', 'In the side, as most players would'], ['bank', 'Bank it into the far corner']], answer: 'corner',
    explain: 'PKF: when choosing side or corner, always look where the next ball is in the pattern. “A simple stop shot on the 4 ball for the corner pocket will give the player position on the 5 ball (figure 7-160).” If the 5 were near the side rail (figure 7-161), the side pocket would be preferred.' },
  { id: 'adv-nb-side2', type: 'PREDICT', assist: 'INDEPENDENT', page: '171', title: 'Side or Corner: The 5 Moves', fig: 'f7-161', reveal: 'f7-161',
    prompt: 'Same idea, but now the 5 is near the side rail (figure 7-161). Which pocket does PKF prefer for the 4?',
    choices: [['side', 'The side pocket'], ['corner', 'The corner pocket']], answer: 'side',
    explain: 'PKF: “If the 5 ball is near the side rail (figure 7-161), then the side pocket would be preferred.”' },
  { id: 'adv-nb-corner5', type: 'DECIDE', assist: 'INDEPENDENT', page: '171', title: 'Side or Corner: The 5 Ball', fig: 'f7-162', reveal: 'f7-163',
    prompt: 'Ball in hand on the 4. Going off the rail for the 5 in the side, he came up short and now has to go off the end rail and back for the 6. What would have been better?',
    choices: [['corner', 'Play the 5 in the corner instead'], ['side', 'The same shot, more carefully'], ['bank', 'Bank the 5 in the side']], answer: 'corner',
    explain: 'PKF: “it would have been better to play position for the 5 ball in the corner pocket (figure 7-163). Now it’s just a matter of pocketing the 5 ball and drawing the cue ball back a few inches for the 6 ball.”' },
  { id: 'adv-nb-phys-corner5', type: 'SHOOT', assist: 'INDEPENDENT', page: '171', title: 'Table: 4, 5, 6 With the Corner Pocket', fig: 'f7-163', reveal: 'f7-163', plan: 'adv-nb-corner5',
    phys: { kind: 'pattern', setup: [IMG_SETUP('diagram (figure 7-163)'), 'Ball in hand on the 4.'],
      steps: ['Pocket the 4 and play position for the 5 in the corner.', 'Pocket the 5 and draw back a few inches for the 6.', 'Pocket the 6.'],
      objective: 'Run the 4, 5 and 6 with PKF’s corner pocket pattern.', gaps: [POSITIONS, 'Speeds and spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-nb-corner6', type: 'DECIDE', assist: 'INDEPENDENT', page: '171', title: 'Side or Corner: Five Balls Left', fig: 'f7-164', reveal: 'f7-165',
    prompt: 'Five balls left. He played the 6 in the side, came up short, went three rails for the 7 in the side and came up short again. What’s the better option?',
    choices: [['corner', 'Play shape for the 6 in the corner'], ['side', 'Keep using the side pockets, with more speed'], ['safe', 'Play safe on the 6 instead']], answer: 'corner',
    explain: 'PKF: “A better option would be to shoot the 5 ball and play shape for the 6 ball in the corner pocket (figure 7-165). Once he has position on the 6 ball it’s just a matter of drawing the cue ball back a couple inches, then it’s a series of stop shots.”' },
  { id: 'adv-nb-slide', type: 'DECIDE', assist: 'INDEPENDENT', page: '172', title: 'Side or Corner: The Sliding Path', fig: 'f7-166', reveal: 'f7-167',
    prompt: 'Ball in hand on the 2; the 3 is next to the side pocket. Short or long for the side (red cue balls) makes the 4 tricky. What does PKF use?',
    choices: [['slide', 'The sliding cue ball path for the corner'], ['side', 'Play the 3 in the side anyway'], ['draw', 'Draw back for the 3 in the side']], answer: 'slide',
    explain: 'PKF: “if he uses the sliding cue ball path of the 2 ball for the other corner pocket, the cue ball path will head directly toward the 3 ball for the corner pocket (figure 7-167). Now it’s just a matter of pocketing the 3 ball and sliding over a bit for the 4 ball.”' }
]);

/* 10 · HANGERS (p172–173) */
add('hangers', [
  { id: 'adv-hg-learn', type: 'LEARN', assist: 'GUIDED', page: '172', title: 'Hangers', fig: 'f7-168',
    explain: 'PKF: when a ball is hanging in a pocket, many players get a little careless in how they play position on it. They assume an easy shot doesn’t need precise shape, which often leads to a tough position shot for the next ball.' },
  { id: 'adv-hg-2to5', type: 'PROBLEM', assist: 'GUIDED', page: '172', title: 'Hangers: The 4 in the Side', fig: 'f7-168', reveal: 'f7-169',
    prompt: 'Ball in hand on the 2; the 4 is hanging in the side. He assumed any position on the 4 would work for the 5. What’s the problem, and PKF’s better plan?',
    choices: [['plan', 'The 5 isn’t a sure thing; plan it from the 3'], ['none', 'No problem at all: any position on a hanger works fine'], ['speed', 'He just needs to hit the 4 harder']], answer: 'plan',
    explain: 'PKF: with the shot he ended up with on the 4, a slight mishit leaves him without a shot on the 5. Planned better (figure 7-169): more angle on the 3, pocket it sending the cue ball to the end rail and over to the side rail with right spin; a soft rolling shot on the 4 sends the cue ball to the end rail for the 5.' },
  { id: 'adv-hg-phys-169', type: 'SHOOT', assist: 'GUIDED', page: '172', title: 'Table: Hanger Pattern 2 to 5', fig: 'f7-169', reveal: 'f7-169', plan: 'adv-hg-2to5',
    phys: { kind: 'pattern', setup: [IMG_SETUP('diagram (figure 7-169)'), 'Ball in hand on the 2.'],
      steps: ['On the 2, give yourself a little more angle on the 3.', 'Pocket the 3: cue ball to the end rail and over to the side rail with right spin.', 'Soft rolling shot on the 4: cue ball to the end rail for the 5.', 'Pocket the 5.'],
      objective: 'Run the 2 through the 5 with PKF’s plan.', gaps: [POSITIONS, 'Exact speeds: ' + NOT_SPECIFIED] } },
  { id: 'adv-hg-5to6', type: 'PROBLEM', assist: 'ASSISTED', page: '173', title: 'Hangers: The Critical Shot', fig: 'f7-170', reveal: 'f7-171',
    prompt: 'All the balls are open; the critical shot is getting from the 5 to the 6. He ended up near the middle of the table for the 5. What does PKF change?',
    choices: [['endrail', 'Bring the cue ball to the end rail on the 4'], ['speed', 'Hit the 5 with perfect speed from the middle'], ['draw', 'Draw the 5 back to the middle']], answer: 'endrail',
    explain: 'PKF: from the middle of the table his speed has to be excellent; hitting a bit too much of the 5 alters his speed and path. Run again, he brings the cue ball down to the end rail on the 4 (figure 7-171), then shoots the 5 with a soft rolling cue ball and a little left spin. “Since he’s closer to the 5 ball he can be more accurate in the speed and path of the cue ball.”' },
  { id: 'adv-hg-phys-171', type: 'SHOOT', assist: 'ASSISTED', page: '173', title: 'Table: The 4, 5, 6 Hanger Pattern', fig: 'f7-171', reveal: 'f7-171', plan: 'adv-hg-5to6',
    phys: { kind: 'pattern', setup: [IMG_SETUP('diagram (figure 7-171)')],
      steps: ['On the 4, bring the cue ball down to the end rail.', 'Shoot the 5 with a soft rolling cue ball and a little left spin.', 'Pocket the 6.'],
      objective: 'Get from the 5 to the 6 with PKF’s plan.', gaps: [POSITIONS, 'Speed on the 4: ' + NOT_SPECIFIED] } },
  { id: 'adv-hg-3to4', type: 'PROBLEM', assist: 'INDEPENDENT', page: '173', title: 'Hangers: Power Draw', fig: 'f7-172', reveal: 'f7-173',
    prompt: 'The only issue is getting from the 3 to the 4. He used a power draw with a little right spin to drag the cue ball to the other end; players often come up short on that. What’s PKF’s fix?',
    choices: [['angle', 'More angle on the 2, then three rails off the 3'], ['harder', 'Draw harder with more right spin'], ['stop', 'A stop shot on the 3, then bank the 4']], answer: 'angle',
    explain: 'PKF: the power draw is difficult to control for speed. He focused on the ideal angle on the 3: more angle on the 2 so the cue ball heads to the other side rail; then low left spin on the 3 sends the cue ball three rails for position on the 4 (figure 7-173).' },
  { id: 'adv-hg-phys-173', type: 'SHOOT', assist: 'INDEPENDENT', page: '173', title: 'Table: Three Rails for the 4', fig: 'f7-173', reveal: 'f7-173', plan: 'adv-hg-3to4',
    phys: { kind: 'pattern', setup: [IMG_SETUP('diagram (figure 7-173)')],
      steps: ['On the 2, give yourself more angle so the cue ball heads to the other side rail.', 'On the 3, low left spin: three rails for the 4.', 'Pocket the 4.'],
      objective: 'Get from the 3 to the 4 without the power draw.', gaps: [POSITIONS, 'Speeds: ' + NOT_SPECIFIED] } }
]);

/* 11 · KICK KILL (p173–174). Only PKF’s Kick Kill examples: no kicking system is taught here. */
const KICK_NOTE = 'Where to aim on the rail: ' + NOT_SPECIFIED + ' in Kick Kill (use PKF’s image)';
add('kick-kill', [
  { id: 'adv-kk-learn', type: 'LEARN', assist: 'GUIDED', page: '173–174', title: 'Kick Kill', fig: 'f7-175',
    explain: 'PKF: one shot that comes up quite a bit is killing the cue ball on a kick shot; strong players execute it when the object ball is within a few inches of the rail. It works really well when there is a ball near the object ball so you can hide the cue ball (figure 7-175).' },
  { id: 'adv-kk-shallow', type: 'METHOD', assist: 'GUIDED', page: '173–174', title: 'Kick Kill: Shallow Angle', fig: 'f7-175', reveal: 'f7-174',
    prompt: 'Hooked on the 3, he can kick one rail off the end rail. The angle is shallow. What spin and hit does PKF use to kill the cue ball?',
    hint: 'Shallow angle versus wide angle is the deciding factor.',
    choices: [['high', 'High, hitting the 3 as full as possible'], ['low', 'Maximum low and a thin hit'], ['side', 'Sidespin and a half-ball hit, to steer the cue ball away']], answer: 'high',
    explain: 'PKF: “When the angle is shallow like this, you can use high action to kill the cue ball once it strikes the object ball. The key to this shot is trying to hit the 3 ball as full as possible, so when the cue ball strikes the 3 ball it comes to a complete stop” (figure 7-174).' },
  { id: 'adv-kk-phys-shallow', type: 'SHOOT', assist: 'GUIDED', page: '173–174', title: 'Table: Kick Kill With High Action', fig: 'f7-175', reveal: 'f7-174', plan: 'adv-kk-shallow',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figures 7-174 and 7-175)'), PHOTO],
      steps: ['One rail kick off the end rail (shallow angle).', 'High action.', 'Hit the 3 as full as possible.'],
      objective: 'Cue ball stops on contact, hidden by the nearby ball (figure 7-175).', gaps: [POSITIONS, KICK_NOTE, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-kk-max', type: 'METHOD', assist: 'ASSISTED', page: '174', title: 'Kick Kill: The 2 Ball', fig: 'f7-177', reveal: 'f7-176',
    prompt: 'Hooked on the 2, which is near the rail with a ball near it to hide behind. What’s the key?',
    choices: [['full', 'Hit the 2 full, with maximum high'], ['thin', 'A thin hit with low on the cue ball'], ['soft', 'Very soft speed with center ball']], answer: 'full',
    explain: 'PKF: “The key to this shot is concentrating on trying to strike the 2 ball full; make sure you are using maximum high.” As the angle starts to widen you have to switch to maximum low spin.' },
  { id: 'adv-kk-wide', type: 'METHOD', assist: 'INDEPENDENT', page: '174', title: 'Kick Kill: Wide Angle', fig: 'f7-179', reveal: 'f7-178',
    prompt: 'Hooked on the 5, kicking off the end rail, and the angle is pretty wide. What does PKF use?',
    choices: [['low', 'Maximum low, hitting the 5 fully'], ['high', 'High action with a thin hit'], ['center', 'Center ball with medium speed']], answer: 'low',
    explain: 'PKF: “Since the angle is pretty wide, he’ll be using maximum low instead of high action. Once again, his focus is trying to hit as much of the 5 ball as possible … A full hit will result in the cue ball stopping behind the 9 ball (figure 7-179).”' },
  { id: 'adv-kk-phys-wide', type: 'SHOOT', assist: 'INDEPENDENT', page: '174', title: 'Table: Kick Kill With Maximum Low', fig: 'f7-179', reveal: 'f7-178', plan: 'adv-kk-wide',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figures 7-178 and 7-179)'), PHOTO],
      steps: ['Kick off the end rail (wide angle).', 'Maximum low.', 'Hit as much of the 5 as possible.'],
      objective: 'Full hit: cue ball stops behind the 9 (figure 7-179).', gaps: [POSITIONS, KICK_NOTE, 'Speed: ' + NOT_SPECIFIED] } }
]);

/* 12 · EXTREME CUT SHOTS (p175) */
add('extreme-cut', [
  { id: 'adv-ec-learn', type: 'LEARN', assist: 'GUIDED', page: '175', title: 'Extreme Cut Shots', fig: 'fU199a',
    explain: 'PKF: sometimes the cue ball ends up a bit too close to the object ball, and there’s a technique you can try to help you pocket the ball. Here the player is too close to the 3 but still cuts it into the side pocket.' },
  { id: 'adv-ec-steps', type: 'METHOD', assist: 'GUIDED', page: '175', title: 'Extreme Cut: First Steps', fig: 'fU199a', reveal: 'f7-182',
    prompt: 'What are PKF’s first two steps on this extreme cut?',
    hint: 'One is about the cue, one is about where he looks.',
    choices: [['choke', 'Choke up, then line up both balls’ edges'], ['bridge', 'Lengthen the bridge, then aim center ball'], ['jack', 'Jack up the butt and aim at the pocket']], answer: 'choke',
    explain: 'PKF: “The first thing he’s going to do is choke up on his pool cue (7-181). Before he gets down on the shot he locates the space between both balls, and finds where both edges line up (figure 7-182).” As he gets down he doesn’t take his eyes off the edges of the balls.' },
  { id: 'adv-ec-tip', type: 'METHOD', assist: 'ASSISTED', page: '175', title: 'Extreme Cut: Tip Position', fig: 'fU199b', reveal: 'f7-184',
    prompt: 'Down on the shot, where does he place the tip?',
    choices: [['closest', 'On the side closest to the object ball'], ['far', 'On the side farthest from the object ball'], ['center', 'Center ball, as on a normal cut']], answer: 'closest',
    explain: 'PKF: “he’ll be placing the tip on the side of the cue ball closest to the object ball, which in this case, would be on the right side (figure 7-184).”' },
  { id: 'adv-ec-speed', type: 'METHOD', assist: 'INDEPENDENT', page: '175', title: 'Extreme Cut: Speed', fig: 'f7-184', reveal: 'f7-185',
    prompt: 'The goal is to strike the object ball as thinly as possible. What speed does PKF call for?',
    choices: [['firm', 'Firm speed'], ['soft', 'As soft as possible'], ['medium', 'Normal medium speed']], answer: 'firm',
    explain: 'PKF: “Since you’re striking the object ball extremely thin you’ll need to make sure you strike it with a firm speed (figure 7-185).”' },
  { id: 'adv-ec-phys', type: 'SHOOT', assist: 'INDEPENDENT', page: '175', title: 'Table: Extreme Cut Into the Side', fig: 'fU199a', reveal: 'f7-185',
    phys: { kind: 'make', setup: [IMG_SETUP('photo (page 175)'), PHOTO],
      steps: ['Choke up on the cue.', 'Find where both edges line up; keep your eyes on the edges.', 'Tip on the side of the cue ball closest to the object ball.', 'Strike the object ball as thinly as possible with firm speed.'],
      objective: 'Cut the 3 into the side pocket.', gaps: [POSITIONS] } }
]);

/* 13 · KICK SAFE (p176–177). Only PKF’s Kick Safe examples: no kicking system is taught here. */
add('kick-safe', [
  { id: 'adv-ks-half', type: 'SAFETY', assist: 'GUIDED', page: '176', title: 'Kick Safe: The 3 Ball', fig: 'f7-186', reveal: 'f7-187',
    prompt: 'Hooked on the 3, kicking off the end rail. Top players always try to hit a specific part of the object ball. What do they aim to hit, and with what spin, to send the cue ball behind the 6 and 7?',
    hint: 'The angle is shallow.',
    choices: [['half', 'Half of the 3, with high action'], ['full', 'Full on the 3, with draw'], ['thin', 'A thin hit with sidespin']], answer: 'half',
    explain: 'PKF: whenever you kick at a ball you not only want to hit it, you also want to leave your opponent a tough shot. “Since the angle is shallow the player will be using high action and concentrates on hitting only half of the 3 ball; this should send the cue ball to the hiding area (figure 7-187).”' },
  { id: 'adv-ks-phys-half', type: 'SHOOT', assist: 'GUIDED', page: '176', title: 'Table: Kick Safe Behind the 6 and 7', fig: 'f7-186', reveal: 'f7-187', plan: 'adv-ks-half',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-186)'), PHOTO],
      steps: ['Kick off the end rail.', 'High action (shallow angle).', 'Concentrate on hitting only half of the 3.'],
      objective: 'Cue ball behind the 6 and 7 (figure 7-187).', gaps: [POSITIONS, KICK_NOTE, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-ks-bottom', type: 'SAFETY', assist: 'ASSISTED', page: '176', title: 'Kick Safe: The 1 Ball', fig: 'f7-188', reveal: 'f7-189',
    prompt: 'Hooked on the 1. Coming off the side rail, which part of the 1 sends the cue ball toward the bottom end rail, below the 9 and 6?',
    choices: [['bottom', 'The bottom half of the 1'], ['top', 'The top half of the 1'], ['full', 'Full on the 1']], answer: 'bottom',
    explain: 'PKF: striking the bottom half of the 1 off the side rail sends the cue ball toward the bottom end rail, leaving distance between both balls; hit correctly, the cue ball goes below the 9 and 6 for a safety (figure 7-189).' },
  { id: 'adv-ks-push', type: 'DECIDE', assist: 'ASSISTED', page: '176–177', title: 'Push Out to a Kick Safe', fig: 'fU200a', reveal: 'fU201a', area: 'safety',
    prompt: 'He pushed out to this position on the 1 and his opponent passed. Hitting about half of the 1 off the side rail should create distance. The 4 partially blocks the cue ball’s path. What does he use?',
    choices: [['left', 'Left spin'], ['right', 'Right spin'], ['center', 'Center ball and more speed']], answer: 'left',
    explain: 'PKF: sometimes a top player pushes out to a kick safe, especially against weaker opponents who may not know the shot. “Since the 4 ball partially blocked the cue ball’s path, the player used left spin which sent the cue ball toward the 1 ball after striking the side rail.” When you first try these shots, concentrate on striking a certain part of the object ball; once more skilled, you can start controlling the cue ball’s path.' },
  { id: 'adv-ks-soft', type: 'DECIDE', assist: 'INDEPENDENT', page: '177', title: 'Kick Safe: Already Tied Up', fig: 'f7-192', reveal: 'f7-193', area: 'safety',
    prompt: 'Hooked on the 6, kicking off the end rail. The 6 doesn’t really go anywhere. What speed does PKF use?',
    choices: [['soft', 'A very soft speed, so the 6 stays tied up'], ['firm', 'A lot of speed, to be sure to make solid contact with the 6'], ['medium', 'Medium speed to break it out']], answer: 'soft',
    explain: 'PKF: players usually use a lot of speed and either give the opponent an offensive shot, or strike the 8 clearing the pocket for the 6 and giving up ball in hand. With a very soft speed the 6 is still tied up (figure 7-193), and a complete miss won’t break out the problem area. “If the ball you’re kicking at is already tied up think twice before kicking at it with a firm speed.”' },
  { id: 'adv-ks-phys-soft', type: 'SHOOT', assist: 'INDEPENDENT', page: '177', title: 'Table: Soft Kick at a Tied-Up Ball', fig: 'f7-192', reveal: 'f7-193', plan: 'adv-ks-soft',
    phys: { kind: 'safety', setup: [IMG_SETUP('image (figure 7-192)')],
      steps: ['Kick at the 6 off the end rail.', 'Use a very soft speed.'],
      objective: 'Hit the 6 and leave it tied up (figure 7-193).', gaps: [POSITIONS, KICK_NOTE] } },
  { id: 'adv-ks-intact', type: 'PREDICT', assist: 'INDEPENDENT', page: '177', title: 'Kick Safe: Keep It Intact', fig: 'f7-194', reveal: 'f7-195',
    prompt: 'Hooked on the 3, which sits in a problem area. Many amateurs kick at it with a firm speed. What usually happens, and what does PKF do?',
    choices: [['open', 'It opens the table; PKF kicks softly'], ['fine', 'Firm speed works fine most of the time'], ['skip', 'Nothing: the problem area holds']], answer: 'open',
    explain: 'PKF: “Sometimes this will work, but more times than not, it will lead to an open shot for your opponent. This time the player used a soft speed keeping the problem area intact (figure 7-195).”' }
]);

/* 14 · SAFETIES · PART 1 (p178–182) */
add('safeties-1', [
  { id: 'adv-sf-rail', type: 'PROBLEM', assist: 'GUIDED', page: '178', title: 'Safeties: What’s Wrong?', fig: 'fU202a', reveal: 'f7-197',
    prompt: 'He played a safety on the 3 and hid the cue ball behind the 7. What’s the problem?',
    hint: 'Look at where the object ball ended up.',
    choices: [['rail', 'The 3 is near a rail, so the kick is easy'], ['cb', 'The cue ball isn’t fully hidden'], ['none', 'Nothing: it’s a perfect safety']], answer: 'rail',
    explain: 'PKF: one mistake many players make is leaving the object ball near a rail. Even if the opponent mishits the kick they can still hit the 3 by going off the rail (figure 7-197). “Leaving the object ball near a rail is like putting a backboard next to the ball.” Away from the rails it becomes a much tougher ball to hit (figure 7-198).' },
  { id: 'adv-sf-rail2', type: 'PREDICT', assist: 'GUIDED', page: '178', title: 'Safeties: The 6 Near the Rail', fig: 'f7-199', reveal: 'f7-200',
    prompt: 'His safety left the 6 near the side rail. How hard is the kick for his opponent?',
    choices: [['easy', 'Much easier: two or three rails both work'], ['hard', 'Very hard: rails protect the ball'], ['same', 'About the same as anywhere else']], answer: 'easy',
    explain: 'PKF: near the rail the 6 becomes a pretty large ball to hit: two rails or three rails (figure 7-200). “If the 6 ball had ended up here (A), now it requires a precise one rail kick to hit it.”' },
  { id: 'adv-sf-oneball', type: 'DECIDE', assist: 'ASSISTED', page: '179', title: 'Safeties: Behind One Ball', fig: 'f7-201', reveal: 'f7-203', area: 'safety',
    prompt: 'He wants to put the cue ball on the other side of the 5 (one ball). If his speed is a little strong it leaves a shot on the 4. If he isn’t sure about controlling the speed, what does PKF suggest?',
    choices: [['distance', 'Put distance between the cue ball and the 4'], ['try', 'Try the one-ball hide anyway, but with a softer stroke'], ['offense', 'Go for the 4 with a thin cut']], answer: 'distance',
    explain: 'PKF: hiding behind only one ball means your speed has to be excellent (figure 7-202). “If you’re not sure about your ability to control the speed of the shot, then try to put distance between the two balls.” He sends the cue ball to the end rail, using the 9 as a blocker; even if the 4 is visible, it’s a long tough shot (figure 7-203).' },
  { id: 'adv-sf-phys-distance', type: 'SHOOT', assist: 'ASSISTED', page: '179', title: 'Table: Distance Safety on the 4', fig: 'f7-201', reveal: 'f7-203', plan: 'adv-sf-oneball',
    phys: { kind: 'safety', setup: [IMG_SETUP('diagram (figure 7-201)')],
      steps: ['Shoot the 4 and send the cue ball to the end rail.', 'Use the 9 as the blocker ball.'],
      objective: 'Distance between the balls; the 4 hidden or a long tough shot (figure 7-203).', gaps: [POSITIONS, 'Speed / spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-sf-6ball', type: 'DECIDE', assist: 'ASSISTED', page: '180', title: 'Safeties: The 6 Ball', fig: 'f7-204', reveal: 'f7-205', area: 'safety',
    prompt: '9-Ball, on the 6. Behind the 8 is a good hiding spot, but a slight mishit leaves a shot. Not confident in the speed, what can he opt for?',
    choices: [['distance', 'Distance: send the cue ball to the other end'], ['hide8', 'Hide behind the 8 anyway with care'], ['pocket', 'Shoot at the 6 to pocket it']], answer: 'distance',
    explain: 'PKF: “In figure 7-205 he sends the cue ball to the other end of the table and banks the 6 ball near the end rail. Whenever you’re not positive about executing the safety, then try the defensive shot that’s easier to execute.”' },
  { id: 'adv-sf-phys-6', type: 'SHOOT', assist: 'ASSISTED', page: '180', title: 'Table: Distance Safety on the 6', fig: 'f7-204', reveal: 'f7-205', plan: 'adv-sf-6ball',
    phys: { kind: 'safety', setup: [IMG_SETUP('diagram (figure 7-204)')],
      steps: ['Send the cue ball to the other end of the table.', 'Bank the 6 near the end rail.'],
      objective: 'The two balls at opposite ends, leaving a tough shot (figure 7-205).', gaps: [POSITIONS, 'Speed / spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-sf-choices', type: 'DECIDE', assist: 'ASSISTED', page: '180', title: 'Safeties: Can You Pull It Off?', fig: 'f7-206', reveal: 'f7-209', area: 'safety',
    prompt: 'On the 8: barely hitting it and going three rails behind the 9 needs supreme confidence; a mishit sells out. If he doesn’t think he can pull it off, what are his two choices?',
    choices: [['two', 'Go all out for the win, or play a simple safe'], ['try', 'Shoot the three rail safety anyway and trust his speed'], ['push', 'Hit the 8 thin and hope it hides']], answer: 'two',
    explain: 'PKF: “you have two choices: you can either play an offensive shot and go all out for the win (figure 7-208), or play a simple safe where you leave your opponent a bank shot (figure 7-209). Sometimes just leaving your opponent a bank shot like this will bait them into trying a difficult offensive shot.”' },
  { id: 'adv-sf-phys-bank', type: 'SHOOT', assist: 'ASSISTED', page: '180', title: 'Table: Simple Safe, Leave a Bank', fig: 'f7-206', reveal: 'f7-209', plan: 'adv-sf-choices',
    phys: { kind: 'safety', setup: [IMG_SETUP('diagram (figure 7-206)')],
      steps: ['Play PKF’s simple safe on the 8 (figure 7-209).'],
      objective: 'Leave the opponent only a bank shot.', gaps: [POSITIONS, 'Speed / spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-sf-reverse', type: 'SAFETY', assist: 'INDEPENDENT', page: '181', title: 'Safeties: Under the 8', fig: 'f7-210', reveal: 'f7-211',
    prompt: 'On the 7, a great hiding spot is underneath the 8. He shoots it with low right spin. Why right spin?',
    choices: [['reverse', 'It’s reverse english, which kills speed off the rail'], ['running', 'It’s running english, which carries the cue ball farther'], ['throw', 'It throws the 7 into the pocket']], answer: 'reverse',
    explain: 'PKF: “he’s using right spin since it’s reverse english and will kill the speed of the cue ball when it strikes the rail.” Even if he doesn’t get there, there is still distance between both balls.' },
  { id: 'adv-sf-7speed', type: 'RECOGNIZE', assist: 'INDEPENDENT', page: '181', title: 'Safeties: Most Important Part', fig: 'f7-212', reveal: 'f7-213',
    prompt: 'On the 7, hiding the cue ball behind the 8. What’s the most important part of this shot?',
    choices: [['ob', 'Controlling the speed of the 7'], ['cb', 'Getting the cue ball exactly behind the 8'], ['spin', 'Using maximum spin on the cue ball']], answer: 'ob',
    explain: 'PKF: “The most important part of this shot is the speed of the 7 ball. Even if the cue ball doesn’t hide behind the 8 ball as long as the 7 ball doesn’t end up in front of the side pocket you’ll leave your opponent tough.”' },
  { id: 'adv-sf-kill', type: 'SAFETY', assist: 'INDEPENDENT', page: '181', title: 'Safeties: Kill It Off the Side Rail', fig: 'f7-214', reveal: 'f7-215',
    prompt: 'On the 5. A common safety top players use here: what is it, and what’s the key?',
    choices: [['reverse', 'Reverse english kill; the key is speed control'], ['follow', 'Follow through the 5; the key is aim'], ['draw', 'Draw to the end rail; the key is spin']], answer: 'reverse',
    explain: 'PKF: top players load the cue ball with reverse english and kill it off the side rail behind another ball (figure 7-215). “The key on this shot is speed control; ideally you want to leave the 5 ball away from the rail but as long as you get the cue ball behind the blocker ball you should have a good safety.”' },
  { id: 'adv-sf-drill-sticker', type: 'SHOOT', assist: 'INDEPENDENT', page: '182', title: 'Drill: Reverse English Safety on Stickers', fig: 'f7-216', reveal: 'f7-217', plan: 'adv-sf-kill',
    phys: { kind: 'safety', setup: ['Sticker up the cue ball for the figure 7-214 safety (figure 7-216).'],
      steps: ['Start close to the object ball.', 'Reverse english: kill the cue ball off the side rail behind the blocker.', 'Gradually move the cue ball farther away (figure 7-217).'],
      objective: 'Cue ball behind the blocker ball; ideally the 5 away from the rail.', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } }
]);

/* 15 · SAFETIES · PART 2 (p182–187) */
add('safeties-2', [
  { id: 'adv-sf-high', type: 'SAFETY', assist: 'GUIDED', page: '182', title: 'Safeties: Bury Your Opponent', fig: 'f7-218', reveal: 'f7-219',
    prompt: 'No offensive shot on the 5; a great hiding spot is behind the 6 and 7. How do strong players play this to really bury the opponent?',
    hint: 'The object ball travels two rails; the cue ball comes off the end rail.',
    choices: [['high', 'High action, banking the 5 two rails'], ['draw', 'Draw the cue ball straight back'], ['stop', 'A stop shot on the 5 near the rail']], answer: 'high',
    explain: 'PKF: “The player will load the cue ball up with high action and bank the object ball two rails toward the other end of the table (figure 7-219). They need to shoot the object ball at an angle that will send the cue ball off the end rail and behind the two blocker balls.”' },
  { id: 'adv-sf-key', type: 'RECOGNIZE', assist: 'GUIDED', page: '182', title: 'Safeties: The Key to Two-Rail Banks', fig: 'f7-220', reveal: 'f7-221',
    prompt: 'Another one: bank the 6 two rails and send the cue ball behind the 7 and 8. What’s the key to these shots?',
    choices: [['spot', 'Where the cue ball must strike the rail'], ['power', 'Hitting as hard as possible'], ['pocket', 'Aiming the object ball at a pocket']], answer: 'spot',
    explain: 'PKF: “The key to these types of shots is determining where the cue ball needs to strike the rail to end up behind the blocker balls. If the player is lined up, as in these examples, it’s just a matter of using high action and sending the cue ball to their spot on the rail.”' },
  { id: 'adv-sf-cluster', type: 'SAFETY', assist: 'ASSISTED', page: '183', title: 'Safeties: The Rack-Area Cluster', fig: 'f7-222', reveal: 'f7-223',
    prompt: 'On the 4 in 9-Ball, with a small cluster of balls around the rack area. What does PKF look for?',
    choices: [['angle', 'The angle that sends the cue ball behind the cluster'], ['break', 'A way to break up the cluster with the 4'], ['pocket', 'A pocket for the 4 and an easy position angle for the 5']], answer: 'angle',
    explain: 'PKF: a small cluster around the rack area usually makes a great hiding spot; “see if you can find the angle off the object ball that will send the cue ball behind this cluster” (figure 7-223).' },
  { id: 'adv-sf-3rails', type: 'SAFETY', assist: 'ASSISTED', page: '183', title: 'Safeties: Off Both Side Rails', fig: 'f7-224', reveal: 'f7-225',
    prompt: 'On the 4 again. The goal is to send the object ball off both side rails and leave the cue ball behind the cluster. What does the cue ball need?',
    choices: [['right', 'Right spin, three rails'], ['left', 'Left spin, one rail'], ['draw', 'Draw, two rails']], answer: 'right',
    explain: 'PKF: “they’ll need to use right spin on the cue ball to send it three rails behind the blocker balls (figure 7-225).”' },
  { id: 'adv-sf-ideal', type: 'SAFETY', assist: 'ASSISTED', page: '183', title: 'Safeties: The Ideal Type', fig: 'f7-226', reveal: 'f7-227',
    prompt: 'He banks the 4 off the left side rail toward the 5 and 7 while the cue ball goes three rails behind the rack-area cluster. Why is this the ideal type of safety?',
    choices: [['both', 'Cue ball behind a cluster, 4 near two blockers'], ['pocket', 'The 4 could still go in the side'], ['easy', 'It needs very little speed control on either the cue ball or the 4']], answer: 'both',
    explain: 'PKF: the cue ball hides behind the cluster and the 4 ends up near two potential blocker balls. “When playing safety if you can leave the object ball near other balls that will make the kick shot more difficult for your opponent.”' },
  { id: 'adv-sf-clip', type: 'SAFETY', assist: 'INDEPENDENT', page: '184', title: 'Safeties: Clip the 2', fig: 'f7-228', reveal: 'f7-229',
    prompt: 'No good offensive shot on the 2. The goal is to send the cue ball three rails behind the large cluster with the 2 ending near the side rail. What does success rely on?',
    choices: [['fraction', 'Hitting just a fraction of the 2 with right spin'], ['full', 'A full hit with draw'], ['half', 'A half-ball hit with left spin']], answer: 'fraction',
    explain: 'PKF: “The goal of this safety is to clip the 2 ball and send the cue ball three rails behind the large cluster of balls (figure 7-229). The 2 ball should end up near the side rail; the success of this shot relies on the player’s ability to hit just a fraction of the 2 ball with right spin.”' },
  { id: 'adv-sf-twoball', type: 'SAFETY', assist: 'INDEPENDENT', page: '184', title: 'Safeties: Two Balls Left', fig: 'f7-230', reveal: 'f7-231',
    prompt: 'Two balls left in 9-Ball; no offensive shot on the 8. What’s the goal of PKF’s safety?',
    choices: [['ends', 'Each ball close to opposite end rails'], ['hide', 'Hide the cue ball behind the 9 near the side pocket'], ['pocket', 'Leave the 8 near a pocket and hope']], answer: 'ends',
    explain: 'PKF: “he’s going to bank it two rails toward the bottom end rail (figure 7-231), and send the cue ball toward the other end rail. The goal of this shot is to try and get each ball as close to the end rails as possible.” It takes a bit of practice, but once you get the hang of it you can execute it almost every time.' },
  { id: 'adv-sf-phys-twoball', type: 'SHOOT', assist: 'INDEPENDENT', page: '184', title: 'Table: Two-Ball Safety', fig: 'f7-230', reveal: 'f7-231', plan: 'adv-sf-twoball',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-230)'), PHOTO],
      steps: ['Bank the 8 two rails toward the bottom end rail.', 'Send the cue ball toward the other end rail.'],
      objective: 'Each ball as close to the end rails as possible (figure 7-231).', gaps: [POSITIONS, 'Speed / spin: ' + NOT_SPECIFIED] } },
  { id: 'adv-sf-4rails', type: 'SAFETY', assist: 'INDEPENDENT', page: '184', title: 'Safeties: Four Rails', fig: 'f7-232', reveal: 'f7-233',
    prompt: 'He doesn’t have the angle to send the 8 two rails to the end rail. What does PKF’s strong player do?',
    choices: [['four', 'Hard stroke: the 8 four rails, with high action'], ['two', 'Force the two rail bank anyway'], ['soft', 'A soft roll-up safety, hiding the cue ball behind the 9']], answer: 'four',
    explain: 'PKF: “he’ll shoot the 8 ball with a hard stroke and send it four rails to the other end rail. He’ll strike the cue ball with high action to force the cue ball off the rail and down to the end rail (figure 7-233).”' },
  { id: 'adv-sf-crush', type: 'SAFETY', assist: 'INDEPENDENT', page: '185', title: 'Safeties: Crushing Defense', fig: 'f7-234', reveal: 'f7-235',
    prompt: 'He banks the 2 to the other end of the table. What sends the cue ball off the end rail toward the 3?',
    choices: [['high', 'High spin'], ['low', 'Low spin'], ['stun', 'A stun shot']], answer: 'high',
    explain: 'PKF: “The player is going to bank the 2 ball to the other end of the table and use high spin to send the cue ball off the end rail toward the 3 ball (figure 7-235).” It requires practice before trying it in a league or tournament game, but it’s a shot you’ll need in your repertoire.' },
  { id: 'adv-sf-amount', type: 'PREDICT', assist: 'INDEPENDENT', page: '185', title: 'Safeties: How Much High?', fig: 'f7-236', reveal: 'f7-237',
    prompt: 'Banking the 5 to the other end while the cue ball comes off the side rail behind the 7. What happens with too much or too little high spin?',
    choices: [['both', 'Too much: rolls past the 7. Too little: stops short'], ['none', 'Spin doesn’t matter, only speed'], ['reverse', 'Too much: stops short. Too little: rolls past']], answer: 'both',
    explain: 'PKF: “The key to this shot is striking the cue ball with the correct amount of high spin; too much high spin and the cue ball may roll past the 7 ball, too little high spin and the cue ball may stop near the side rail.”' },
  { id: 'adv-sf-drawback', type: 'SAFETY', assist: 'INDEPENDENT', page: '185', title: 'Safeties: Draw Straight Back', fig: 'f7-238', reveal: 'f7-239',
    prompt: 'On the 5. If he can draw the cue ball straight back, what does he leave, and where does the 5 go?',
    choices: [['behind8', 'Cue ball behind the 8; the 5 at the other end'], ['follow', 'The cue ball follows the 5 to the rail'], ['side', 'Both balls end up near the same side rail, close together']], answer: 'behind8',
    explain: 'PKF: drawing the cue ball straight back gives a good chance of leaving it behind the 8 (figure 7-239). The goal is to bank the 5 two rails to the other end and leave the cue ball near the end rail; it takes a great deal of practice since you’re being precise with both balls.' },
  { id: 'adv-sf-barely', type: 'SAFETY', assist: 'INDEPENDENT', page: '186', title: 'Safeties: Barely Hit the 2', fig: 'f7-240', reveal: 'f7-241',
    prompt: 'On the 2, he wants the cue ball behind the 5 and 7. What does PKF use?',
    choices: [['barely', 'Barely hit the 2 with center right spin'], ['full', 'A full hit with draw'], ['left', 'Half-ball with left spin']], answer: 'barely',
    explain: 'PKF: “If he can barely hit the 2 ball with center right spin, the cue ball should travel three rails behind both balls (figure 7-241). The key is being able to hit just a small amount of the object ball.” Figure 7-243 shows a variation that sends the cue ball to the other end behind the blockers.' },
  { id: 'adv-sf-around', type: 'SAFETY', assist: 'INDEPENDENT', page: '186', title: 'Safeties: Object Ball Around the Table', fig: 'f7-244', reveal: 'f7-245',
    prompt: 'This time the object ball goes around the table. He sends the 3 toward the first diamond on the end rail so it travels two more rails below the rack-area cluster. What kind of cue ball does he use?',
    choices: [['slide', 'A sliding cue ball'], ['draw', 'A draw shot'], ['follow', 'A follow shot']], answer: 'slide',
    explain: 'PKF: “He’ll be using a sliding cue ball when striking the object ball - this will help send the cue ball off the side rail and down toward the end rail” (figure 7-245).' },
  { id: 'adv-sf-maxlow', type: 'SAFETY', assist: 'INDEPENDENT', page: '187', title: 'Safeties: Below the 6 and 7', fig: 'f7-246', reveal: 'f7-247',
    prompt: 'On the 1, he wants the cue ball below the 6 and 7 and the 1 at the other end of the table. How does PKF strike it?',
    choices: [['half', 'Half of the 1, maximum low'], ['thin', 'A thin hit with high'], ['full', 'Full with center ball']], answer: 'half',
    explain: 'PKF: “he’ll need to strike about half of the 1 ball using maximum low spin (figure 7-247).” If you try it, start with the cue ball much closer to the 1, then gradually move it farther away.' },
  { id: 'adv-sf-phys-maxlow', type: 'SHOOT', assist: 'INDEPENDENT', page: '187', title: 'Table: Half-Ball, Maximum Low Safety', fig: 'f7-246', reveal: 'f7-247', plan: 'adv-sf-maxlow',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-246)'), PHOTO, 'PKF: start with the cue ball much closer to the 1, then gradually move it farther away.'],
      steps: ['Strike about half of the 1.', 'Maximum low spin.'],
      objective: 'Cue ball below the 6 and 7; the 1 at the other end of the table (figure 7-247).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-sf-stun', type: 'PREDICT', assist: 'INDEPENDENT', page: '187', title: 'Stun Follow Safety', fig: 'f7-248', reveal: 'f7-249',
    prompt: 'Stun follow safety on the 3: firm stroke above center so the cue ball moves forward only a few inches behind the 5 and 6. You end up short of the hiding area. What does PKF change?',
    choices: [['higher', 'Keep the speed the same but aim a hair higher'], ['harder', 'Hit harder'], ['lower', 'Keep the speed and aim a hair lower']], answer: 'higher',
    explain: 'PKF: “If you try this shot and end up short, then keep the speed the same but aim a hair higher. If the cue ball rolls past the hiding area then keep the speed the same but aim a hair lower on the cue ball.” Figures 7-250 and 7-251 show another example.' },
  { id: 'adv-sf-phys-stun', type: 'SHOOT', assist: 'INDEPENDENT', page: '187', title: 'Table: Stun Follow Safety', fig: 'f7-248', reveal: 'f7-249', plan: 'adv-sf-stun',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-248)'), PHOTO],
      steps: ['Above center with a firm stroke: the 3 goes two rails, the cue ball forward only a few inches.', 'Short? Same speed, a hair higher. Past the hiding area? Same speed, a hair lower.'],
      objective: 'Cue ball behind the 5 and 6; the 3 on the other half of the table (figure 7-249).', gaps: [POSITIONS] } }
]);

/* 16 · AIMING JUMP SHOTS (p188–190). Knowledge only: no extra setups. */
add('jump', [
  { id: 'adv-jp-learn', type: 'LEARN', assist: 'GUIDED', page: '188', title: 'Aiming Jump Shots', fig: 'f7-252',
    explain: 'PKF covers aiming techniques for jump shots and a common error. In figure 7-252 the player jumps over the 6 and 8 to hit the 2, but accidentally hits the cue ball with sidespin, which changes its path and makes him miss the 2 (figure 7-253). Sidespin moves the cue ball off the shooting line, “especially true when jumping balls since the cue stick is severely elevated.”' },
  { id: 'adv-jp-side', type: 'PREDICT', assist: 'GUIDED', page: '188', title: 'Jump Shots: Sidespin', fig: 'f7-254', reveal: 'fU212a',
    prompt: 'Without sidespin, the jump goes straight down the line toward the corner pocket (figure 7-255). Same aim, but now the cue ball is struck with left spin. What happens?',
    choices: [['off', 'It immediately moves off the shooting line'], ['same', 'It still goes straight'], ['higher', 'It jumps higher but stays on the straight shooting line']], answer: 'off',
    explain: 'PKF: “even though I’m aiming the shot toward the corner pocket the cue ball immediately moves off the shooting line when I strike it.” Once you’re lined up, pay close attention to where you’re aiming on the cue ball (figure 7-257).' },
  { id: 'adv-jp-center', type: 'METHOD', assist: 'ASSISTED', page: '189', title: 'Jump Shots: Finding Center', fig: 'f7-257', reveal: 'f7-258',
    prompt: 'With the cue elevated it’s harder to gauge center; what looks like center may be left or right of it. What does PKF suggest?',
    choices: [['friend', 'Have a friend check your aim'], ['guess', 'Aim a little left to be safe'], ['level', 'Lower the cue to see better']], answer: 'friend',
    explain: 'PKF: “It may help to have a friend check your aim once your cue stick is elevated (figure 7-258).”' },
  { id: 'adv-jp-path', type: 'METHOD', assist: 'ASSISTED', page: '189', title: 'Jump Shots: The Path', fig: 'f7-259', reveal: 'f7-260',
    prompt: 'He needs to jump over the 7 and 8 and pocket the 3 in the side. What’s the first thing he does, and how full does he aim?',
    choices: [['pretend', 'Find the direct path; aim a little fuller'], ['over', 'Aim at the top of the obstacle balls'], ['thin', 'Find the direct path; aim a little thinner']], answer: 'pretend',
    explain: 'PKF: “The first thing he needs to do is pretend the obstacle balls don’t exist so he can find the direct path to the 3 ball (figure 7-260). Typically when jumping to hit a ball, you want to aim to hit the object ball a little fuller since the cue ball may be slightly airborne when it contacts the object ball.”' },
  { id: 'adv-jp-target', type: 'METHOD', assist: 'INDEPENDENT', page: '189–190', title: 'Jump Shots: The Aiming Target', fig: 'f7-261', reveal: 'f7-262',
    prompt: 'The entire 8 is blocking the path to the 3. What does he use as his aiming target with the cue elevated?',
    choices: [['eight', 'The 8 ball'], ['three', 'The 3 ball'], ['pocket', 'The side pocket']], answer: 'eight',
    explain: 'PKF: “now when he elevates his cue stick he’ll be using the 8 ball as an aiming target. If he can aim the cue ball directly at the 8 ball the cue ball should be on the right path to pocket the 3 ball (figure 7-262).” Using the obstacle ball as a close target is a trick used by many strong players.' },
  { id: 'adv-jp-half', type: 'PREDICT', assist: 'INDEPENDENT', page: '190', title: 'Jump Shots: Half the Ball', fig: 'f7-263', reveal: 'f7-264',
    prompt: 'Now only half of the 8 is in the way of the path. Where does he aim the jump?',
    choices: [['right', 'Over the right half of the 8'], ['center', 'At the center of the 8'], ['left', 'Over the left half of the 8']], answer: 'right',
    explain: 'PKF: “only half of the 8 ball is in the way, so when the player is aiming his jump he’s aiming to jump over the right half of the 8 ball (figure 7-264).”' }
]);

/* 17 · STOP THE TIP (p190) */
add('stop-tip', [
  { id: 'adv-st-learn', type: 'LEARN', assist: 'GUIDED', page: '190', title: 'Stop the Tip', fig: 'fU214a',
    explain: 'PKF: almost every top player in the world pauses the tip at the cue ball before the final forward stroke. It’s one final check to make sure everything is lined up; some top players pause for up to two seconds on more difficult shots, focusing on tip placement and aim.' },
  { id: 'adv-st-why', type: 'RECOGNIZE', assist: 'ASSISTED', page: '190', title: 'Stop the Tip: Why', fig: 'fU214b', reveal: 'fU214b',
    prompt: 'Why do top players pause the tip at the cue ball?',
    choices: [['check', 'A final alignment check'], ['power', 'To build power for the stroke'], ['rest', 'To rest the arm before shooting']], answer: 'check',
    explain: 'PKF: “When they’re stopping the tip at the cue ball they’re doing one final check to make sure everything is lined up.” Amateurs can still pocket balls without it, but stopping the tip lets players be absolutely certain everything is lined up.' },
  { id: 'adv-st-wrong', type: 'DECIDE', assist: 'INDEPENDENT', page: '190', title: 'Stop the Tip: Something’s Off', fig: 'fU214b', reveal: 'fU214b',
    prompt: 'You pause the tip and something doesn’t look right. What do top players do?',
    choices: [['redo', 'Take more practice strokes or start over'], ['shoot', 'Shoot anyway and trust it'], ['adjust', 'Adjust the bridge slightly while going through the stroke']], answer: 'redo',
    explain: 'PKF: “If anything doesn’t look right they’ll know right away; they’ll either perform a couple more practice strokes, or they’ll stand back up and start the pre-shot routine all over again.”' }
]);

/* 18 · MOSCONI CUP DRILLS (p191–192) — Mark Wilson’s drills as PKF presents them */
add('mosconi', [
  { id: 'adv-mc-learn', type: 'LEARN', assist: 'GUIDED', page: '191', title: 'Mosconi Cup Drills', fig: 'fU215a',
    explain: 'PKF: Mosconi Cup captain Mark Wilson detailed two drills he uses with the players. Drill one: place the cue ball on the pocket line of the object ball, with the object ball near the third diamond and the cue ball two diamonds away. See how softly you can strike the cue ball and still play a stop shot; it requires maximum low. Once you can stop it with a soft speed, move the cue ball farther away.' },
  { id: 'adv-mc-why', type: 'RECOGNIZE', assist: 'GUIDED', page: '191', title: 'Soft Stop Shot: Why', fig: 'fU215a', reveal: 'fU215b',
    prompt: 'Why is pocketing balls at a slower speed so important?',
    choices: [['bigger', 'The pockets play bigger'], ['spin', 'You get more spin'], ['draw', 'It’s easier to draw']], answer: 'bigger',
    explain: 'PKF: “The reason this shot is so important is that when you can pocket balls at a slower speed the pockets play bigger.” On tables with tight pockets a softer stroke increases your pocketing percentage.' },
  { id: 'adv-mc-rail', type: 'PREDICT', assist: 'ASSISTED', page: '191', title: 'Soft Stroke on the 8', fig: 'fU215b', reveal: 'fU215b',
    prompt: 'On this angle on the 8, the shot catches the rail near the pocket (A). With more power than necessary, and with maximum low and a soft stroke, what happens?',
    choices: [['soft', 'Power may miss; soft with max low may go in'], ['power', 'Power makes it go in off the rail; the soft stroke won’t'], ['same', 'No difference: both go in']], answer: 'soft',
    explain: 'PKF: with a little more power than necessary, catching the rail near the pocket (A) the 8 may not go in. “But if they had used maximum low with a soft stroke, the pocket starts to play bigger; now if they catch the rail before the pocket the 8 ball may still go in.”' },
  { id: 'adv-mc-phys-stop', type: 'SHOOT', assist: 'ASSISTED', page: '191', title: 'Drill: Softest Stop Shot', fig: 'fU215a', reveal: 'fU215a', plan: 'adv-mc-why',
    phys: { kind: 'drill', setup: ['Cue ball on the pocket line of the object ball (PKF page 191).', 'Object ball near the third diamond; cue ball two diamonds away.'],
      steps: ['Strike the cue ball as softly as you can with maximum low.', 'Once you can stop the cue ball with a soft speed, move it farther away.'],
      objective: 'Ball made and the cue ball stops, at a soft speed.', gaps: ['Which rail / pocket: use PKF’s image'] } },
  { id: 'adv-mc-kill', type: 'SAFETY', assist: 'ASSISTED', page: '191–192', title: 'Soft Kill Safety', fig: 'fU215c', reveal: 'f7-271',
    prompt: 'On the 8 in 9-Ball, a soft kill shot on the cue ball banks the 8 to the other side of the 9 (figure 7-270). What usually goes wrong?',
    choices: [['errors', 'Too hard a stop shot, or decelerating'], ['spin', 'Too much sidespin on the cue ball when it strikes the 8'], ['aim', 'They miss the 8 completely']], answer: 'errors',
    explain: 'PKF: “either they shoot the stop shot too hard (B), or they decelerate and lose control of their cue ball (A).” When you first practice it, start with the cue ball closer to the object ball and gradually move it back. A soft stroke also helps your defensive game.' },
  { id: 'adv-mc-phys-kill', type: 'SHOOT', assist: 'INDEPENDENT', page: '191–192', title: 'Table: Soft Kill Bank Safety', fig: 'fU215c', reveal: 'f7-270', plan: 'adv-mc-kill',
    phys: { kind: 'safety', setup: [IMG_SETUP('image (page 191)'), 'PKF: start with the cue ball closer to the object ball, then gradually move it back.'],
      steps: ['Soft kill shot on the cue ball.', 'Bank the 8 to the other side of the 9.'],
      objective: '8 on the other side of the 9, cue ball killed (figure 7-270).', gaps: [POSITIONS] } },
  { id: 'adv-mc-stop8', type: 'SAFETY', assist: 'INDEPENDENT', page: '192', title: 'Soft Stop Shot Safety', fig: 'f7-272', reveal: 'f7-273',
    prompt: 'He wants to leave the 8 on the other side of the 9 with a soft stop shot. What does it require, and what if you struggle?',
    choices: [['soft', 'Very soft with max low; move closer if needed'], ['firm', 'A firm stroke with center ball'], ['high', 'High spin and medium speed']], answer: 'soft',
    explain: 'PKF: “This shot requires a very soft stroke with maximum low. If you struggle with this shot keep moving the cue ball closer to the 8 ball until the shot becomes easier” (figure 7-273).' },
  { id: 'adv-mc-phys-stop8', type: 'SHOOT', assist: 'INDEPENDENT', page: '192', title: 'Table: Soft Stop Shot Safety', fig: 'f7-272', reveal: 'f7-273', plan: 'adv-mc-stop8',
    phys: { kind: 'safety', setup: [IMG_SETUP('image (figure 7-272)'), 'PKF: if you struggle, keep moving the cue ball closer to the 8.'],
      steps: ['Very soft stroke with maximum low.', 'Stop shot on the 8.'],
      objective: 'The 8 on the other side of the 9 (figure 7-273).', gaps: [POSITIONS] } },
  { id: 'adv-mc-spin', type: 'METHOD', assist: 'INDEPENDENT', page: '192', title: 'The Sidespin Drill', fig: 'f7-274', reveal: 'f7-275',
    prompt: 'Cue ball on the object ball’s pocket line about a diamond away. Pocket the ball with sidespin and see how long the cue ball spins. What’s a good time?',
    choices: [['20', 'Over twenty seconds'], ['5', 'About five seconds'], ['60', 'A full minute']], answer: '20',
    explain: 'PKF: “a good time is over twenty seconds. Also, when pocketing the object ball try to keep the cue ball in the same area.” The drill tests a player’s power stroke with sidespin; it requires an accurate stroke with maximum sidespin.' },
  { id: 'adv-mc-phys-spin', type: 'SHOOT', assist: 'INDEPENDENT', page: '192', title: 'Drill: Sidespin Spin Test', fig: 'f7-274', reveal: 'f7-275', plan: 'adv-mc-spin',
    phys: { kind: 'drill', setup: ['Cue ball on the object ball’s pocket line, about a diamond away (figure 7-274).'],
      steps: ['Pocket the ball with maximum sidespin.', 'Keep the cue ball in the same area; if it moves too far, try again.'],
      objective: 'Ball made, cue ball stays in the area and spins over twenty seconds (figure 7-275).', gaps: ['Which side spin: ' + NOT_SPECIFIED] } }
]);

/* 19 · 8-BALL PATTERN PUZZLES (p193–195). Player is solids, ball in hand (PKF). Layout figure first; PKF’s answer image after LOCK. */
const PZ = [
  // [layout fig, answer fig, page, PKF line above the puzzle (or null), PKF’s printed solution, answer order, balls]
  ['7-276', 'U217a', '193', null, '1-4 SR 2-5 ER/SR 3-1 4-3 SR/SR', '4-5-1-3', [1, 3, 4, 5]],
  ['7-278', 'U217b', '193', null, '1-1 2-3 SR/SR 3-4 SR 4-5 ER', '1-3-4-5', [1, 3, 4, 5]],
  ['7-280', 'U218a', '194', 'The 8 ball may pose a problem in this layout.', '1-1 2-3 3-4 SR 4-5 SR/ER/SR/SR', '1-3-4-5', [1, 3, 4, 5]],
  ['7-282', 'U218b', '194', 'Find the runout that would be easy to repeat over and over again.', '1-5 2-4 3-1 4-3 ER/SR', '5-4-1-3', [1, 3, 4, 5]],
  ['7-284', 'U218c', '194', 'In this layout find which balls connect with each other. There should be a flow to the pattern as one shot leads to another.', '1-5 SR 2-4 ER 3-1 SR 4-3 SR/ER/SR', '5-4-1-3', [1, 3, 4, 5]],
  ['7-286', 'U218d', '194', 'There are two ways to run out this pattern: one uses the 4 ball as the key ball but requires a precise angle on the 4. PKF’s answer requires less precision.', '1-3 SR 2-1 SR 3-4 4-6 SR 5-2 ER/SR', '3-1-4-6-2', [1, 2, 3, 4, 6]],
  ['7-288', 'U219a', '195', 'In this layout there are a couple problem areas. Sometimes clearing one problem ball will free up the other problem ball.', '1-7 SR 2-5 SR 3-4 ER 4-2 SR 5-1', '7-5-4-2-1', [1, 2, 4, 5, 7]],
  ['7-290', 'U219b', '195', 'In this layout there aren’t any solids near the 8 ball, so finding the key ball unlocks the entire pattern.', '1-1 2-5 3-4 SR/ER 4-2 SR 5-7 ER', '1-5-4-2-7', [1, 2, 4, 5, 7]],
  ['7-292', 'U219c', '195', 'In this layout the 8 ball may prove to be a problem.', '1-3 2-4 SR/SR 3-5 ER 4-1 SR 5-7 ER', '3-4-5-1-7', [1, 3, 4, 5, 7]],
  ['7-294', 'U219d', '195', 'In this layout we have two problem areas we need to deal with.', '1-3 2-4 3-1 ER 4-7 ER 5-5 SR/SR', '3-4-1-7-5', [1, 3, 4, 5, 7]]
];
export const PUZZLES = PZ.map(([layout, ans, page, line, solution, order, balls], i) => ({ n: i + 1, layout, ans, page, line, solution, order, balls }));
const pzAssist = (i) => (i < 3 ? 'GUIDED' : i < 7 ? 'ASSISTED' : 'INDEPENDENT');
add('pattern-puzzles', [
  { id: 'adv-pz-learn', type: 'LEARN', assist: 'GUIDED', page: '193', title: '8-Ball Pattern Puzzles', fig: 'f7-276',
    explain: 'PKF: one of the main challenges for many players is seeing the proper pattern for 8-Ball runouts. “When I talk about how the balls connect with each other, I’m talking about shooting a ball with a stop shot (or minimal movement), or using the cue ball’s natural path to gain position for the next ball. Once you can find which balls connect with each other within 8-Ball patterns, your percentage of runouts will increase.” In each puzzle you’re solids with ball in hand. PKF shows the layout, then the solution: under each answer image is the runout line. For example “2-5 ER/SR” means the second shot pockets the 5 and the cue ball goes off the end rail (ER), then the side rail (SR). Each cue ball in the answer image shows the spin needed.' },
  ...PUZZLES.map((p, i) => ({
    id: `adv-pz-${p.n}`, type: 'PUZZLE', assist: pzAssist(i), page: p.page, title: `Pattern Puzzle ${p.n}`, fig: `f${p.layout}`, reveal: `f${p.ans}`,
    prompt: `${p.line ? `PKF: “${p.line}” ` : ''}Solids, ball in hand. Tap the solids in the order you’d run them (the 8 comes last).`,
    hint: i < 3 ? 'Look for balls that connect: a stop shot (or minimal movement), or the cue ball’s natural path to the next ball.' : (i < 7 ? 'Find where you need to be for the 8, then work backwards.' : undefined),
    choices: p.balls.map((b) => [String(b), String(b)]), answer: p.order,
    explain: `PKF’s solution (printed under the answer image): ${p.solution}. Order: ${p.order.split('-').join(', ')}, then the 8.${p.n === 1 ? ' PKF: 1-4 SR means the first shot pockets the 4 and comes off the side rail; 4-3 SR/SR means the fourth shot makes the 3 and goes off both side rails for position on the 8.' : ''}`
  })),
  { id: 'adv-pz-phys-2', type: 'SHOOT', assist: 'INDEPENDENT', page: '193', title: 'Table: Run Pattern Puzzle 2', fig: 'f7-278', reveal: 'fU217b', plan: 'adv-pz-2',
    phys: { kind: 'pattern', setup: [IMG_SETUP('layout (figure 7-278)'), 'You’re solids with ball in hand.'],
      steps: ['Run PKF’s pattern: 1-1 2-3 SR/SR 3-4 SR 4-5 ER, then the 8.', 'Use the spin each cue ball shows in PKF’s answer image.'],
      objective: 'Run the solids and the 8 with PKF’s pattern.', gaps: [POSITIONS, 'Speeds: ' + NOT_SPECIFIED] } },
  { id: 'adv-pz-phys-6', type: 'SHOOT', assist: 'INDEPENDENT', page: '194', title: 'Table: Run Pattern Puzzle 6', fig: 'f7-286', reveal: 'fU218d', plan: 'adv-pz-6',
    phys: { kind: 'pattern', setup: [IMG_SETUP('layout (figure 7-286)'), 'You’re solids with ball in hand.'],
      steps: ['Run PKF’s pattern: 1-3 SR 2-1 SR 3-4 4-6 SR 5-2 ER/SR, then the 8.', 'Use the spin each cue ball shows in PKF’s answer image.'],
      objective: 'Run the solids and the 8 with PKF’s pattern.', gaps: [POSITIONS, 'Speeds: ' + NOT_SPECIFIED] } }
]);

/* 20 · FILIPINO TIPS (p196–199) */
add('filipino', [
  { id: 'adv-fl-learn', type: 'LEARN', assist: 'GUIDED', page: '196', title: 'Maximum Sidespin', fig: 'f7-295',
    explain: 'PKF: a top Filipino player moved another professional’s tip to the very outside of the cue ball: the shot needed maximum sidespin, “which can only be achieved if the tip is moved as far from the center of the cue ball as possible.” The farther the tip from center, the more revolutions. It takes a lot of practice to allow for the deflection, but it puts the cue ball in places you can’t reach with only a tip or two of sidespin.' },
  { id: 'adv-fl-5ball', type: 'DECIDE', assist: 'GUIDED', page: '196', title: 'Maximum Left Around the 8', fig: 'f7-296', reveal: 'f7-297',
    prompt: 'On the 5, he needs to pocket it in the corner and end up in the highlighted area for the 2. Center left and high left will clip the 8, possibly tying it up. What does PKF use?',
    hint: 'Watch how the path changes off the end rail.',
    choices: [['max', 'Maximum left, around the 8'], ['high', 'High left with more speed'], ['draw', 'Low left']], answer: 'max',
    explain: 'PKF: “if we use maximum left, when the cue ball strikes the end rail its path really widens sending it around the 8 ball and into the position area (figure 7-297).”' },
  { id: 'adv-fl-phys-5', type: 'SHOOT', assist: 'GUIDED', page: '196', title: 'Table: Maximum Left for the 2', fig: 'f7-296', reveal: 'f7-297', plan: 'adv-fl-5ball',
    phys: { kind: 'shot', setup: [IMG_SETUP('photo (figure 7-296)'), PHOTO],
      steps: ['Tip at the very outside of the cue ball: maximum left.', 'Pocket the 5 in the corner.'],
      objective: '5 made; cue ball around the 8 into the highlighted area for the 2.', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-fl-last', type: 'PREDICT', assist: 'ASSISTED', page: '196', title: 'Maximum Left for the 8', fig: 'f7-298', reveal: 'f7-299',
    prompt: 'On his last solid; position on the 8 is tricky. High left or center left sends the cue ball toward the 15 (A). What does maximum left do?',
    choices: [['widen', 'The path widens off the end rail'], ['same', 'Same path, just more spin'], ['shorter', 'It stops short of the rail']], answer: 'widen',
    explain: 'PKF: “using maximum left, the cue ball’s path really widens off the end rail sending it toward the position area (figure 7-299).”' },
  { id: 'adv-fl-9ball', type: 'DECIDE', assist: 'ASSISTED', page: '197', title: 'Maximum Right for the 8', fig: 'f7-300', reveal: 'f7-301', hidePre: true,
    prompt: 'On the 9, position for the 8 in the highlighted area. Center right or high right sends the cue ball toward the 6 (A). What does PKF use?',
    choices: [['max', 'Maximum right spin'], ['center', 'Center ball, firmer'], ['left', 'Low left spin']], answer: 'max',
    explain: 'PKF: “if the player can use maximum right spin, the cue ball’s path will severely widen once it hits the end rail which will send it toward the position area (figure 7-301).” One advantage of maximum sidespin is that it helps propel the cue ball off the rails, so you can shoot easier.' },
  { id: 'adv-fl-break', type: 'LEARN', assist: 'ASSISTED', page: '197–198', title: 'The Filipino Break Stroke', fig: 'fU221a',
    explain: 'PKF: top Filipino players generate a lot of power on the break even if small in stature; most of it comes from the arm and wrist. Many hold the cue on the break resting lightly on two fingers with the thumb holding it in place (image). The wrist gets involved on the practice strokes (figures 7-303 to 7-305), and the front fingers open as the cue follows through (figure 7-306).' },
  { id: 'adv-fl-grip', type: 'METHOD', assist: 'INDEPENDENT', page: '197', title: 'Break Stroke: The Grip', fig: 'fU221a', reveal: 'f7-303',
    prompt: 'How tightly do they hold the cue on the break, and why?',
    choices: [['light', 'Extremely light, so the wrist can move'], ['tight', 'Tight, for control of the cue'], ['medium', 'Medium, like a normal shot']], answer: 'light',
    explain: 'PKF: “The grip is extremely light. If the cue stick is held too tightly it inhibits the amount of wrist movement.”' },
  { id: 'adv-fl-snap', type: 'METHOD', assist: 'INDEPENDENT', page: '198', title: 'Break Stroke: The Wrist Snap', fig: 'f7-305', reveal: 'f7-306',
    prompt: 'At the end of the final backstroke the wrist is completely bent. When is the wrist snap timed?',
    choices: [['contact', 'So it coincides with the tip striking the cue ball'], ['early', 'At the very start of the forward stroke, before the hit'], ['after', 'After the cue ball is struck']], answer: 'contact',
    explain: 'PKF: “as the forward stroke accelerates toward the cue ball the wrist snap is timed so it coincides with the tip striking the cue ball. The front fingers open up as the cue stick follows through after striking the cue ball (figure 7-306).”' },
  { id: 'adv-fl-carom', type: 'SAFETY', assist: 'INDEPENDENT', page: '198', title: 'Filipino Carom Safety', fig: 'f7-307', reveal: 'f7-308',
    prompt: 'On the 1, he wants to send it toward the side rail and leave the cue ball behind the 2 (highlighted area). How does the Filipino safety do it?',
    choices: [['rail', 'Aim at the rail beside the 1 with running english'], ['thin', 'Cut the 1 thin with draw to the rail'], ['full', 'Hit the 1 full with a stop shot behind the 2']], answer: 'rail',
    explain: 'PKF: Filipino players sometimes use this safety when they really want to bury the opponent; it takes practice since the cue ball caroms off the rail with sidespin. “If the player can aim at the rail next to the object ball with running english, the cue ball will carom off the 1 ball and slide across the rail behind the blocker ball (figure 7-308).”' },
  { id: 'adv-fl-phys-carom', type: 'SHOOT', assist: 'INDEPENDENT', page: '198', title: 'Table: Filipino Carom Safety', fig: 'f7-307', reveal: 'f7-308', plan: 'adv-fl-carom',
    phys: { kind: 'safety', setup: [IMG_SETUP('photo (figure 7-307)'), PHOTO, 'The object ball should be at least a half ball away from the rail (PKF).'],
      steps: ['Aim at the rail next to the object ball.', 'Running english.'],
      objective: 'Cue ball caroms off the 1 and slides behind the 2 (figure 7-308).', gaps: [POSITIONS, 'Speed: ' + NOT_SPECIFIED] } },
  { id: 'adv-fl-carom2', type: 'SAFETY', assist: 'INDEPENDENT', page: '198', title: 'Filipino Carom Safety: Across', fig: 'f7-309', reveal: 'f7-310',
    prompt: 'Ideally the cue ball ends behind the two blocker balls on the end rail. Where does he aim, and what condition must the object ball meet?',
    choices: [['across', 'Across from the ball; at least a half ball off the rail'], ['ball', 'Directly at the object ball; it must be frozen to the rail'], ['corner', 'At the corner pocket; anywhere on the table']], answer: 'across',
    explain: 'PKF: “We’ll aim at the rail directly across from the object ball (A) with running english. Once the cue ball strikes the rail it caroms off the 1 ball and the spin propels it toward the blocker balls (figure 7-310). The object ball should be at least a half ball away from the rail for this safety to work properly.” In the last example (page 199) he again aims at the rail across from the object ball with running english (right spin).' }
]);

/* 21 · CHANGING THE PATH (p199–200) — Mike Massey’s specialty shots (Zero-X video) as PKF presents them. Knowledge only. */
add('changing-path', [
  { id: 'adv-cp-learn', type: 'LEARN', assist: 'GUIDED', page: '199', title: 'Changing the Path', fig: 'fU223b',
    explain: 'PKF: in the Zero-X video featuring Mike Massey’s specialty shots, one shot he teaches is changing the path of the cue ball when you’re straight in on your object ball or have the incorrect angle. These are elevated-cue shots; this course covers them as knowledge only.' },
  { id: 'adv-cp-hop', type: 'DECIDE', assist: 'GUIDED', page: '199', title: 'Changing the Path: Draw Around', fig: 'fU223b', reveal: 'f7-314',
    prompt: 'Mike is almost straight in on the 1 and needs position for the 2 at the other end. The 4 prevents drawing back to the side rail near the side pocket. What does he do?',
    choices: [['elevate', 'Elevate and strike low: it hops, then draws back'], ['stop', 'A stop shot, and play safe on the 2 from where it stops'], ['follow', 'Follow through to the end rail']], answer: 'elevate',
    explain: 'PKF: “if he can elevate his cue stick and strike the cue ball below center (figure 7-313), the cue ball will hop to the left then draw back to the highlighted area (figure 7-314). This shot requires an elevated cue and stroking through the cue ball with about two tips of low spin.”' },
  { id: 'adv-cp-25', type: 'METHOD', assist: 'ASSISTED', page: '199', title: 'Changing the Path: How Much Elevation?', fig: 'fU223c', reveal: 'fU223c', hidePre: true,
    prompt: 'Almost straight in on his last solid (the 6); the 15 blocks the draw path to the side rail for the 8. About how much does he elevate, below center?',
    choices: [['25', 'About 25 degrees'], ['5', 'About 5 degrees'], ['60', 'About 60 degrees']], answer: '25',
    explain: 'PKF: “If he can elevate his cue about 25 degrees shooting below center on the cue ball with a good stroke, the cue ball should hop on the table and spin back to the highlighted area.”' },
  { id: 'adv-cp-high', type: 'PREDICT', assist: 'ASSISTED', page: '200', title: 'Changing the Path: High Spin', fig: 'f7-316', reveal: 'f7-319',
    prompt: 'High right sends the cue ball toward the middle of the table (figure 7-317). With the cue elevated about 25 degrees and high right, what happens, and why?',
    choices: [['hop', 'It hops and changes path toward the end rail'], ['same', 'Same path, just faster off the rail'], ['jump', 'It jumps over the 1 completely']], answer: 'hop',
    explain: 'PKF: “the cue ball will hop after striking the 1 ball and change its path; now the cue ball strikes the rail lower and spins toward the end rail (figure 7-319). The reason this shot works is because the cue ball is slightly airborne when it strikes the 1 ball which changes its tangent line.”' },
  { id: 'adv-cp-20', type: 'METHOD', assist: 'INDEPENDENT', page: '200', title: 'Changing the Path: Straight In', fig: 'f7-320', reveal: 'f7-321', hidePre: true,
    prompt: 'Straight in on the 3, he needs position for the 4; moving the cue ball away from the bottom end rail is difficult. How much elevation and what spin does PKF give?',
    choices: [['20', 'About 20 degrees, high left'], ['45', 'About 45 degrees, low right'], ['0', 'Level cue, center ball']], answer: '20',
    explain: 'PKF: “if he can elevate his cue about 20 degrees and stroke through the cue ball using high left, the cue ball should hop and change its path sending it toward the position area (figure 7-321).”' }
]);

/* ───────────────────────────── Normalize ───────────────────────────── */
/** Deterministic choice order (so the right answer isn’t always in the same spot). Build questions keep ball order. */
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function arrange(id, choices) {
  if (!Array.isArray(choices) || choices.length < 2) return choices;
  const out = choices.slice();
  let h = hashStr(id);
  for (let i = out.length - 1; i > 0; i--) { const j = h % (i + 1); h = (Math.floor(h / (i + 1)) ^ hashStr(id + i)) >>> 0; [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
const LABEL_OF_TYPE = { DECIDE: 'PKF APPROACH', TWOWAY: 'PKF APPROACH', SAFETY: 'PKF APPROACH', SEQUENCE: 'PKF APPROACH', PROBLEM: 'PKF APPROACH', PUZZLE: 'PKF RECOMMENDED PATTERN' };
const purposeOf = (l) => (l.type === 'LEARN' ? 'TEACHING' : l.type === 'SHOOT' ? 'PHYSICAL SETUP' : l.type === 'PUZZLE' ? 'PATTERN' : 'QUESTION');
/** When the question figure is also the answer figure, the comparison opens PKF's full original page (its explanation). */
const revealOf = (l) => (l.reveal && l.reveal === l.fig ? `t${regionOf(l.fig)?.page}` : l.reveal);

export const LESSONS = L.map((o) => {
  const { sec, page, phys, ...l } = o;
  const knowledge = KNOWLEDGE_TYPES.includes(l.type);
  return {
    hint: '', plan: null, hidePre: false, ...l,
    section: sec,
    src: `Page ${page}`,
    page,
    choices: knowledge ? (BUILD_TYPES.includes(l.type) ? l.choices : arrange(l.id, l.choices)) : null,
    answer: knowledge ? l.answer : null,
    physical: phys || null,
    area: l.type === 'SHOOT' ? 'execution' : knowledge ? (l.area || AREA_OF_TYPE[l.type]) : null,
    label: knowledge ? (LABEL_OF_TYPE[l.type] || 'PKF SOLUTION') : null,
    purpose: purposeOf(l),
    reveal: revealOf(l) || null
  };
});

/* ───────────────────────────── Exam ───────────────────────────── */
/** PKF Advanced Play & Safety Exam: lessons taught in this course (original PKF layouts), nothing new. */
const EXAM_FROM = [
  'adv-ss-rolling2', 'adv-ss-spin1', 'adv-bs-firm', 'adv-e8-defense', 'adv-e8-bih', 'adv-tw-choice', 'adv-callsafe', 'adv-side-choose',
  'adv-noplan', 'adv-lastball', 'adv-cb-predict', 'adv-cb-hide', 'adv-nb-strong', 'adv-nb-side', 'adv-hg-3to4', 'adv-kk-wide',
  'adv-ks-soft', 'adv-sf-oneball', 'adv-sf-reverse', 'adv-sf-stun', 'adv-jp-target', 'adv-pz-5', 'adv-pz-9', 'adv-fl-carom',
  // physical part
  'adv-ss-phys-rolling', 'adv-bs-phys-firm', 'adv-ks-phys-soft', 'adv-sf-phys-distance', 'adv-sf-phys-stun', 'adv-hg-phys-171', 'adv-pz-phys-6'
];
const examId = (from) => `apx-${from.slice(4)}`;
export const EXAM_ITEMS = EXAM_FROM.map((from) => {
  const l = LESSONS.find((x) => x.id === from);
  if (!l) throw new Error(`exam source missing ${from}`);
  const plan = l.plan && EXAM_FROM.includes(l.plan) ? examId(l.plan) : null;
  return { ...l, id: examId(from), from, assist: 'INDEPENDENT', hint: '', plan };
});

export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }
export function isKnowledge(l) { return !!l && KNOWLEDGE_TYPES.includes(l.type); }
export function isPhysical(l) { return !!l && l.type === 'SHOOT'; }
export function isBuild(l) { return !!l && BUILD_TYPES.includes(l.type); }
export function isSafetyPhysical(l) { return isPhysical(l) && SAFETY_KINDS.includes(l.physical?.kind); }
export function knowledgeLessons(sectionId) { return lessonsFor(sectionId).filter(isKnowledge); }
export function physicalLessons(list = LESSONS) { return list.filter(isPhysical); }
/** Which review list a lesson belongs to. */
export function listOf(l) {
  if (!l) return null;
  if (isPhysical(l)) return isSafetyPhysical(l) ? 'safeties' : 'shots';
  if (l.type === 'PUZZLE') return 'puzzles';
  if (['DECIDE', 'TWOWAY', 'SAFETY', 'SEQUENCE'].includes(l.type)) return 'decisions';
  if (isKnowledge(l)) return 'concepts';
  return null;
}
export const REVIEW_LISTS = [
  { kind: 'concepts', label: 'REVIEW MISSED CONCEPTS' },
  { kind: 'decisions', label: 'REVIEW WRONG DECISIONS' },
  { kind: 'shots', label: 'PRACTICE FAILED SHOTS' },
  { kind: 'safeties', label: 'PRACTICE FAILED SAFETIES' },
  { kind: 'puzzles', label: 'RETRY PATTERN PUZZLES' }
];
const REVIEW_KINDS = REVIEW_LISTS.map((r) => r.kind);

/* ───────────────────────────── Figures and source map ───────────────────────────── */
const PURPOSES = ['TEACHING', 'QUESTION', 'PATTERN', 'PHYSICAL SETUP'];
export function assetOf(lessonId) {
  const l = lessonById(lessonId);
  if (!l || !l.fig) return null;
  const fig = regionOf(l.fig);
  if (!fig) return null;
  return { ...fig, purpose: l.purpose, reveal: l.reveal ? regionOf(l.reveal) : null, hidePre: !!l.hidePre };
}
/**
 * The lesson's figure. Alt text is always the lesson title (never the answer). Before LOCK (`locked:false`) a
 * figure that prints the answer is replaced by a note, and VIEW FULL PKF PAGE is held back (the page may show it).
 */
export function figureHTML(lessonId, { locked = true, ...opts } = {}) {
  const a = assetOf(lessonId);
  const l = lessonById(lessonId);
  if (!a) return '<p class="muted">No source image for this lesson.</p>';
  if (!locked && a.hidePre) {
    return '<div class="card pkfadvHiddenFig" data-pkfadv-hidden-fig="1"><p class="muted small">The PKF figure for this question shows the answer, so it opens once you lock in your choice.</p></div>';
  }
  return regionHTML(a, { alt: l?.title || 'PKF example', fullBtn: locked, ...opts });
}
export function solutionLabel(l) { return `${l?.label || 'PKF SOLUTION'} · ORIGINAL PAGE`; }
export function solutionFigureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  const l = lessonById(lessonId);
  if (!a) return '';
  const r = a.reveal || a;
  return regionHTML(r, { alt: l?.title || 'PKF example', label: solutionLabel(l), ...opts });
}
export function mappingRow(lesson) {
  const a = assetOf(lesson.id);
  if (!a) return null;
  return {
    lessonId: lesson.id,
    sourceImage: a.sourceImage,
    sourcePdfPage: a.pdf,
    sourcePage: a.printed,
    sourceFigure: a.figs || a.label || a.key,
    chapter: chapterOf(a.pdf),
    pkfSection: sectionById(lesson.section)?.title || lesson.section,
    crop: a.crop,
    type: lesson.type,
    purpose: a.purpose,
    area: lesson.area,
    solution: a.reveal ? { sourceImage: a.reveal.sourceImage, sourcePage: a.reveal.printed, region: a.reveal.key, figure: a.reveal.figs || a.reveal.label || a.reveal.key } : null
  };
}
export function sourceMapRows() { return [...LESSONS, ...EXAM_ITEMS].map((l) => mappingRow(l)); }

/* ───────────────────────────── State ───────────────────────────── */
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export function blank() {
  return {
    sections: {},
    lessons: {},
    physical: {},
    review: {},
    needsPractice: {},
    skipped: {},
    tableXp: {},
    current: null,
    exam: { attempts: 0, passed: false, bestOverall: 0, history: [], weak: {} },
    stats: {
      knowledgeCorrect: 0, knowledgeWrong: 0, firstTotal: 0, firstCorrect: 0,
      physicalAttempts: 0, physicalSuccess: 0, physicalFailed: 0, firstTry: 0,
      safetyAttempts: 0, safetySuccess: 0, scratches: 0,
      streak: 0, bestStreak: 0, tableSkipped: 0, tableDrillXp: 0
    }
  };
}
function courseOfRaw(raw) {
  const b = blank();
  if (!raw || typeof raw !== 'object') return b;
  return {
    ...b,
    ...raw,
    sections: { ...obj(raw.sections) },
    lessons: { ...obj(raw.lessons) },
    physical: { ...obj(raw.physical) },
    review: { ...obj(raw.review) },
    needsPractice: { ...obj(raw.needsPractice) },
    skipped: { ...obj(raw.skipped) },
    tableXp: { ...obj(raw.tableXp) },
    exam: { ...b.exam, ...obj(raw.exam), weak: { ...obj(raw.exam?.weak) } },
    stats: { ...b.stats, ...obj(raw.stats) },
    current: raw.current ? JSON.parse(JSON.stringify(raw.current)) : null
  };
}
export function courseOf(state) { return courseOfRaw(state?.[STORAGE_KEY]); }
function put(state, course) { return { ...(state || {}), [STORAGE_KEY]: course }; }

export function sectionRecord(course, id) { return course.sections?.[id] || null; }
export function sectionPassed(course, id) { return !!sectionRecord(course, id)?.passed; }
export function lessonCompleted(course, id) { return !!course.lessons?.[id]?.done; }
export function passedSectionCount(course) { return SECTIONS.filter((s) => sectionPassed(course, s.id)).length; }
/** Course complete = every section passed (same rule as the other PKF courses; skipped table steps don't block). */
export function courseComplete(course) { return SECTIONS.every((s) => sectionPassed(course, s.id)); }

/** Sections unlock in PKF order (app setting, same as the other PKF courses). */
export function sectionUnlocked(state, sectionId, { dev = false } = {}) {
  if (dev) return true;
  const course = courseOf(state);
  const idx = SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return false;
  for (let i = 0; i < idx; i++) if (!sectionPassed(course, SECTIONS[i].id)) return false;
  return true;
}
export function examUnlocked(state, { dev = false } = {}) {
  if (dev) return true;
  return courseComplete(courseOf(state));
}

function emptyItem() {
  return { locked: false, choice: null, build: [], correct: null, solution: false, hint: false, shooting: false, attempts: [], execution: null, skipped: false, done: false };
}
function freshRun(ids, extra) {
  const items = {};
  for (const id of ids) items[id] = emptyItem();
  return { cursor: 0, view: 0, phase: 'play', order: [...ids], items, ...extra };
}
export function startSection(state, sectionId) {
  if (!sectionUnlocked(state, sectionId)) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (cur && !cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  course.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId });
  return put(state, course);
}
export function startExam(state) {
  if (!examUnlocked(state)) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (cur && !cur.dev && cur.mode === 'exam') return state;
  course.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam' });
  return put(state, course);
}
export function previewSection(state, sectionId, restart = false) {
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (!restart && cur && cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  course.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId, dev: true });
  return put(state, course);
}
export function previewExam(state, restart = false) {
  const course = courseOf(state);
  const cur = course.current;
  if (!restart && cur && cur.dev && cur.mode === 'exam') return state;
  course.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam', dev: true });
  return put(state, course);
}
const inCourse = (id) => LESSONS.some((l) => l.id === id);
/** Lesson ids on a review list (only what is still missed / failed / skipped). */
export function listIds(course, kind) {
  if (kind === 'shots' || kind === 'safeties') return Object.keys(course.needsPractice || {}).filter((id) => inCourse(id) && listOf(lessonById(id)) === kind);
  return Object.keys(course.review || {}).filter((id) => inCourse(id) && listOf(lessonById(id)) === kind);
}
export function skippedIds(course) { return Object.keys(course.skipped || {}).filter((id) => isPhysical(lessonById(id))); }
export function startReview(state, kind = 'concepts') {
  if (!REVIEW_KINDS.includes(kind)) return state;
  const course = courseOf(state);
  const ids = listIds(course, kind);
  if (!ids.length) return state;
  course.current = freshRun(ids, { mode: kind });
  return put(state, course);
}
/** Open one lesson directly. Saves nothing graded. */
export function startSingle(state, lessonId) {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (cur && cur.mode === 'single' && cur.order[0] === lessonId) return state;
  course.current = freshRun([lessonId], { mode: 'single', sectionId: lesson.section });
  return put(state, course);
}

function liveItem(course) {
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return null;
  const id = cur.order[cur.cursor];
  return { cur, id, lesson: lessonById(id), it: cur.items[id] };
}
/** Dev preview and single-lesson view never write graded progress. */
const saves = (cur) => !cur.dev && cur.mode !== 'single';

export function selectChoice(state, choice) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !isKnowledge(x.lesson)) return state;
  const v = String(choice);
  if (!x.lesson.choices?.some((c) => c[0] === v)) return state;
  if (isBuild(x.lesson)) {
    const b = Array.isArray(x.it.build) ? x.it.build : [];
    if (b.includes(v) || b.length >= x.lesson.choices.length) return state;
    x.it.build = [...b, v];
    x.it.choice = x.it.build.join('-');
  } else x.it.choice = v;
  return put(state, course);
}
export function clearBuild(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !isBuild(x.lesson)) return state;
  x.it.build = [];
  x.it.choice = null;
  return put(state, course);
}
export function showHint(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !x.lesson?.hint) return state;
  x.it.hint = true;
  return put(state, course);
}
export function lockAnswer(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !isKnowledge(x.lesson)) return state;
  const { cur, lesson, it, id } = x;
  if (it.choice == null || it.choice === '') return state;
  if (isBuild(lesson) && (it.build || []).length !== lesson.choices.length) return state;
  it.locked = true;
  it.correct = String(it.choice) === String(lesson.answer);
  it.done = true;
  if (saves(cur)) {
    const rec = { ...(course.lessons[id] || {}) };
    if (rec.firstCorrect == null && cur.mode !== 'exam') {
      rec.firstCorrect = it.correct;
      course.stats.firstTotal += 1;
      if (it.correct) course.stats.firstCorrect += 1;
    }
    rec.done = true;
    rec.correct = it.correct;
    course.lessons[id] = rec;
    if (it.correct) course.stats.knowledgeCorrect += 1; else course.stats.knowledgeWrong += 1;
    if (inCourse(id)) {
      if (it.correct) delete course.review[id];
      else course.review[id] = (course.review[id] || 0) + 1;
    }
  }
  return put(state, course);
}
export function showSolution(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || !x.it.locked) return state;
  x.it.solution = true;
  return put(state, course);
}
export function acknowledgeLearn(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || x.lesson?.type !== 'LEARN') return state;
  x.it.locked = true;
  x.it.done = true;
  if (saves(x.cur)) course.lessons[x.id] = { ...(course.lessons[x.id] || {}), done: true };
  return put(state, course);
}
/** SET UP THIS SHOT → NOW SHOOT IT. */
export function beginShooting(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson)) return state;
  x.it.shooting = true;
  return put(state, course);
}

/**
 * Record one attempt with the result button that fits the objective (PHYS[kind].results).
 * Up to ATTEMPTS_MAX attempts; stops at the first success. Drill XP: one session, ratio = 1/n on success, 0 on failure.
 */
export function markResult(state, v) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson) || !x.it.shooting) return state;
  const { cur, lesson, it, id } = x;
  const info = resultInfo(lesson.physical.kind, String(v));
  if (!info || it.attempts.length >= ATTEMPTS_MAX) return state;
  it.attempts = [...it.attempts, { result: info.v, ok: info.ok }];
  const sv = saves(cur);
  const safety = isSafetyPhysical(lesson);
  if (sv) {
    const st = course.stats;
    st.physicalAttempts += 1;
    if (safety) { st.safetyAttempts += 1; if (info.ok) st.safetySuccess += 1; }
    if (info.v === 'scratch') st.scratches += 1;
  }
  const success = info.ok;
  if (!success && it.attempts.length < ATTEMPTS_MAX) return put(state, course);
  it.done = true;
  it.shooting = false;
  it.execution = success ? 'success' : 'failed';
  if (!sv) return put(state, course);
  const n = it.attempts.length;
  const st = course.stats;
  if (success) {
    st.physicalSuccess += 1;
    if (n === 1) st.firstTry += 1;
    st.streak = (st.streak || 0) + 1;
    st.bestStreak = Math.max(st.bestStreak || 0, st.streak);
    if (inCourse(id)) delete course.needsPractice[id];
  } else {
    st.physicalFailed += 1;
    st.streak = 0;
    if (inCourse(id)) course.needsPractice[id] = true;
  }
  const p = { history: [], ...(course.physical[id] || {}) };
  p.history = [...(p.history || []), { at: new Date().toISOString(), attempts: it.attempts.map((a) => a.result), success, mode: cur.mode }].slice(-30);
  p.best = success ? 'success' : (p.best || 'failed');
  course.physical[id] = p;
  course.lessons[id] = { ...(course.lessons[id] || {}), done: true, skipped: false };
  course.skipped = clearSkipped(course.skipped, id);
  const out = awardRecordedStep(put(state, course), STORAGE_KEY, COURSE_TITLE, lesson, { ratio: success ? 1 / n : 0, passed: success });
  const c2 = out.state[STORAGE_KEY];
  if (c2?.current?.items?.[id]) c2.current.items[id].xp = out.drill;
  return out.state;
}

/** SKIP TABLE STEP: 0 Drill XP, never an execution score, never blocks the lesson; goes on the practice list. */
export function skipTableStep(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson)) return state;
  const { cur, it, id } = x;
  it.skipped = true;
  it.execution = null;
  it.shooting = false;
  it.done = true;
  if (saves(cur)) {
    course.stats.tableSkipped += 1;
    course.skipped = markSkipped(course.skipped, id);
    if (inCourse(id)) course.needsPractice[id] = true;
    course.lessons[id] = { ...(course.lessons[id] || {}), done: true, skipped: true };
  }
  return put(state, course);
}
export function nextLesson(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it?.done) return state;
  const cur = x.cur;
  if (cur.cursor >= cur.order.length - 1) return finishRun(state);
  cur.cursor += 1;
  cur.view = cur.cursor;
  return put(state, course);
}
export function viewLesson(state, i) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur) return state;
  cur.view = Math.max(0, Math.min(cur.cursor, Number(i) || 0));
  return put(state, course);
}

/** "Decision: CORRECT · Execution: FAILED" for a table item (decision = the linked question in the same run, if any). */
export function decisionExecutionLine(cur, id) {
  const l = lessonById(id);
  const it = cur?.items?.[id];
  if (!l || !it || !isPhysical(l)) return '';
  const pIt = l.plan ? cur.items[l.plan] : null;
  const dec = !l.plan || !pIt ? null : !pIt.locked ? 'NOT ANSWERED' : pIt.correct ? 'CORRECT' : 'WRONG';
  const ex = it.skipped ? 'SKIPPED' : it.execution === 'success' ? 'SUCCESSFUL' : it.execution === 'failed' ? 'FAILED' : 'NOT SHOT';
  return dec ? `Decision: ${dec} · Execution: ${ex}` : `Execution: ${ex}`;
}

/** Knowledge and execution scored separately, plus skill areas. Skipped table steps are excluded from execution. */
export function summarize(cur) {
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0, sOk = 0, sTot = 0;
  const missed = [], failed = [], skipped = [];
  const byArea = {};
  const bySection = {};
  const bump = (bag, key, ok) => { const b = bag[key] || (bag[key] = { ok: 0, tot: 0 }); b.tot += 1; if (ok) b.ok += 1; };
  for (const id of cur.order) {
    const l = lessonById(id);
    const it = cur.items[id];
    if (!l || !it) continue;
    if (isKnowledge(l)) {
      kTot += 1;
      if (it.correct) kOk += 1; else missed.push(id);
      bump(byArea, l.area, !!it.correct);
      bump(bySection, l.section, !!it.correct);
    } else if (isPhysical(l) && it.skipped) {
      skipped.push(id);
    } else if (isPhysical(l)) {
      xTot += 1;
      const ok = it.execution === 'success';
      if (ok) xOk += 1; else failed.push(id);
      if (isSafetyPhysical(l)) { sTot += 1; if (ok) sOk += 1; }
      bump(byArea, 'execution', ok);
      bump(bySection, l.section, ok);
    }
  }
  const rate = (a, b) => (b ? a / b : null);
  const kRate = kTot ? kOk / kTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  const areas = Object.keys(AREAS).map((k) => ({ key: k, label: AREAS[k], ok: byArea[k]?.ok || 0, tot: byArea[k]?.tot || 0, rate: byArea[k] ? byArea[k].ok / byArea[k].tot : null }));
  const scored = areas.filter((a) => a.tot);
  const byBest = scored.slice().sort((a, b) => b.rate - a.rate || b.tot - a.tot);
  const strongest = byBest.length ? byBest[0].key : null;
  const weakest = byBest.length > 1 && byBest[byBest.length - 1].rate < byBest[0].rate ? byBest[byBest.length - 1].key : null;
  const recommend = [...new Set([...missed, ...failed].map((id) => lessonById(id)?.section).filter(Boolean))];
  return { kOk, kTot, kRate, xOk, xTot, xRate: rate(xOk, xTot), sOk, sTot, sRate: rate(sOk, sTot), overall, areas, missed, failed, skipped, strongest, weakest, recommend, bySection };
}

export function finishRun(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return state;
  const s = summarize(cur);
  const graded = cur.mode === 'section' || cur.mode === 'exam';
  const passed = cur.mode === 'exam' ? s.overall >= EXAM_PASS : (s.kTot ? s.kRate >= KNOWLEDGE_PASS : true);
  cur.phase = 'results';
  cur.summary = { ...s, passed, graded };
  if (cur.dev || !graded) return put(state, course);
  if (cur.mode === 'section') {
    const prev = { passed: false, attempts: 0, bestKnowledge: 0, ...(course.sections[cur.sectionId] || {}) };
    prev.attempts += 1;
    prev.knowledgeCorrect = s.kOk;
    prev.knowledgeTotal = s.kTot;
    prev.executionOk = s.xOk;
    prev.executionTotal = s.xTot;
    prev.bestKnowledge = Math.max(prev.bestKnowledge || 0, s.kRate);
    prev.missed = s.missed;
    prev.failed = s.failed;
    prev.skipped = s.skipped;
    if (passed) prev.passed = true;
    course.sections[cur.sectionId] = prev;
  } else {
    course.exam.attempts += 1;
    course.exam.bestOverall = Math.max(course.exam.bestOverall || 0, s.overall);
    if (passed) course.exam.passed = true;
    const weak = { ...(course.exam.weak || {}) };
    for (const id of [...s.missed, ...s.failed]) { const t = lessonById(id)?.title || id; weak[t] = (weak[t] || 0) + 1; }
    course.exam.weak = weak;
    const pc = (v) => (v == null ? null : Math.round(v * 100));
    const area = {};
    for (const a of s.areas) area[a.key] = pc(a.rate);
    course.exam.history = [...(course.exam.history || []), { at: new Date().toISOString(), overall: pc(s.overall), knowledge: pc(s.kRate), execution: pc(s.xRate), area, passed, skipped: s.skipped.length }].slice(-20);
  }
  return put(state, course);
}
export function retryCurrent(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur) return state;
  if (cur.dev && cur.mode === 'exam') return previewExam(state, true);
  if (cur.dev && cur.mode === 'section') return previewSection(state, cur.sectionId, true);
  course.current = null;
  const cleared = put(state, course);
  if (cur.mode === 'exam') return startExam(cleared);
  if (cur.mode === 'section') return startSection(cleared, cur.sectionId);
  if (REVIEW_KINDS.includes(cur.mode)) return startReview(cleared, cur.mode);
  if (cur.mode === 'single') return startSingle(cleared, cur.order[0]);
  return cleared;
}
/** From a results screen: replay only what was missed / failed / skipped in that run (never changes a pass). */
export function reviewMissed(state, which = 'knowledge') {
  const course = courseOf(state);
  const cur = course.current;
  const s = cur?.summary;
  const ids = (which === 'table' ? [...(s?.failed || []), ...(s?.skipped || [])] : s?.missed) || [];
  if (!ids.length) return state;
  course.current = freshRun(ids, { mode: 'rerun', dev: !!cur.dev });
  return put(state, course);
}
export function clearCurrent(state) {
  const course = courseOf(state);
  if (!course.current) return state;
  course.current = null;
  return put(state, course);
}

/* ───────────────────────────── Reporting ───────────────────────────── */
export function progressSummary(state) {
  const course = courseOf(state);
  const st = course.stats;
  const k = LESSONS.filter(isKnowledge);
  const pct = (a, b) => (b ? a / b : null);
  const tw = k.filter((l) => l.type === 'TWOWAY');
  const pz = k.filter((l) => l.type === 'PUZZLE');
  const ind = k.filter((l) => l.assist === 'INDEPENDENT');
  const lists = {};
  for (const r of REVIEW_LISTS) lists[r.kind] = listIds(course, r.kind).length;
  return {
    lessonsDone: LESSONS.filter((l) => lessonCompleted(course, l.id)).length,
    lessonsTotal: LESSONS.length,
    questionsAnswered: k.filter((l) => course.lessons[l.id]?.done).length,
    questionsTotal: k.length,
    firstAccuracy: pct(st.firstCorrect, st.firstTotal),
    safetiesAttempted: st.safetyAttempts,
    safetiesSuccessful: st.safetySuccess,
    twoWayCorrect: tw.filter((l) => course.lessons[l.id]?.correct === true).length,
    twoWayTotal: tw.length,
    puzzlesSolved: pz.filter((l) => course.lessons[l.id]?.correct === true).length,
    puzzlesTotal: pz.length,
    physicalAttempts: st.physicalAttempts,
    firstTry: st.firstTry,
    independentCorrect: ind.filter((l) => course.lessons[l.id]?.correct === true).length,
    independentTotal: ind.length,
    tableSkipped: st.tableSkipped || 0,
    tableDrillXp: st.tableDrillXp || 0,
    sectionsPassed: passedSectionCount(course),
    sectionsTotal: SECTIONS.length,
    lists,
    examAttempts: course.exam.attempts,
    examBest: course.exam.bestOverall,
    examPassed: !!course.exam.passed,
    complete: courseComplete(course)
  };
}

/** Completion summary: knowledge (latest answer per question), execution (recorded table steps only; skips excluded), exam. */
export function completionSummary(state) {
  const course = courseOf(state);
  const area = {};
  const bump = (key, ok) => { const b = area[key] || (area[key] = { ok: 0, tot: 0 }); b.tot += 1; if (ok) b.ok += 1; };
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0;
  for (const l of LESSONS) {
    const rec = course.lessons[l.id];
    if (isKnowledge(l) && rec?.done) { kTot += 1; if (rec.correct) kOk += 1; bump(l.area, !!rec.correct); }
    if (isPhysical(l) && course.physical[l.id]?.best) { xTot += 1; const ok = course.physical[l.id].best === 'success'; if (ok) xOk += 1; bump('execution', ok); }
  }
  const scored = Object.entries(area).map(([k, b]) => ({ key: k, rate: b.ok / b.tot, tot: b.tot }));
  const byBest = scored.slice().sort((a, b) => b.rate - a.rate || b.tot - a.tot);
  const strongest = byBest.length ? byBest[0].key : null;
  const weakest = byBest.length > 1 && byBest[byBest.length - 1].rate < byBest[0].rate ? byBest[byBest.length - 1].key : null;
  return {
    complete: courseComplete(course),
    knowledge: kTot ? kOk / kTot : null,
    execution: xTot ? xOk / xTot : null,
    executionCount: xTot,
    skipped: skippedIds(course).length,
    exam: course.exam.attempts ? course.exam.bestOverall : null,
    examPassed: !!course.exam.passed,
    strongest, weakest
  };
}

export function pkfAdvancedPlaySafetyProgressRows(state) {
  const course = courseOf(state);
  const rows = [];
  const started = !!((course.current && !course.current.dev && course.current.mode !== 'single') || Object.keys(course.sections).length || Object.keys(course.lessons).length);
  if (started) {
    const done = passedSectionCount(course);
    rows.push({ id: 'pkfAdvanced', name: COURSE_TITLE, href: '#pkfadv', short: 'PKF Adv Play & Safety', done, total: SECTIONS.length, finished: done >= SECTIONS.length });
  }
  const examStarted = !!(course.exam?.attempts || course.exam?.passed || (course.current && !course.current.dev && course.current.mode === 'exam'));
  if (examStarted) rows.push({ id: 'pkfAdvancedExam', name: EXAM_TITLE, href: '#pkfadv/exam', short: 'PKF APS Exam', done: course.exam.passed ? 1 : 0, total: 1, finished: !!course.exam.passed });
  return rows;
}

export function pkfAdvancedPlaySafetyBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfadv" data-pkfadv="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${SECTIONS.length} sections from PKF’s Tips &amp; Tricks: sliding safeties, 8-Ball strategy, two-way shots, combinations, safeties and pattern puzzles. Decide, lock it, compare with PKF, then shoot it.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfadv/exam" data-pkfadv="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Strategy, safety and shot decisions + original PKF table work. Pass at ${Math.round(EXAM_PASS * 100)}% (app setting).${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfadv="exam" data-pkfadv-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
  return course + exam;
}

export function lessonTypeCounts(list = LESSONS) {
  const bag = {};
  for (const l of list) bag[l.type] = (bag[l.type] || 0) + 1;
  return bag;
}
export function assistCounts() {
  const bag = {};
  for (const l of LESSONS) bag[l.assist] = (bag[l.assist] || 0) + 1;
  return bag;
}
export { regionOf, PUZZLE_ANSWER };

const ORDER = { GUIDED: 0, ASSISTED: 1, INDEPENDENT: 2 };
export function auditCourse() {
  const problems = [];
  const ids = new Set();
  for (const l of [...LESSONS, ...EXAM_ITEMS]) {
    if (ids.has(l.id)) problems.push(`duplicate id ${l.id}`);
    ids.add(l.id);
    if (!assetOf(l.id)) problems.push(`no asset ${l.id}`);
    if (l.reveal && !regionOf(l.reveal)) problems.push(`bad reveal ${l.id}`);
    if (!PURPOSES.includes(l.purpose)) problems.push(`bad purpose ${l.id}`);
    if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
    if (!l.src || !/^Page \d/.test(l.src)) problems.push(`no source page ${l.id}`);
    if (!LTYPE[l.type]) problems.push(`bad type ${l.id}`);
    if (!ASSIST[l.assist]) problems.push(`bad assist ${l.id}`);
    if (isKnowledge(l)) {
      if (!l.explain) problems.push(`no explanation ${l.id}`);
      if (!l.prompt) problems.push(`no prompt ${l.id}`);
      if (!AREAS[l.area] || l.area === 'execution') problems.push(`bad area ${l.id}`);
      if (isBuild(l)) {
        const balls = l.choices?.map((c) => c[0]) || [];
        const ans = String(l.answer || '').split('-');
        if (ans.length !== balls.length || ans.some((b) => !balls.includes(b)) || new Set(ans).size !== ans.length) problems.push(`build answer ${l.id}`);
      } else if (!l.choices?.some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
      if (l.choices && new Set(l.choices.map((c) => c[0])).size !== l.choices.length) problems.push(`duplicate choice ${l.id}`);
      if (!l.reveal) problems.push(`no reveal ${l.id}`);
    } else if (l.choices || l.answer != null) problems.push(`non-question has choices ${l.id}`);
    if (l.type === 'LEARN' && !l.explain) problems.push(`no explanation ${l.id}`);
    if (isPhysical(l)) {
      if (!PHYS[l.physical?.kind]) problems.push(`physical kind ${l.id}`);
      if (!l.physical?.setup?.length || !l.physical?.objective || !l.physical?.steps?.length) problems.push(`physical setup/objective ${l.id}`);
      if (l.plan && !lessonById(l.plan)) problems.push(`bad plan link ${l.id}`);
    } else if (l.physical) problems.push(`physical on non-shoot ${l.id}`);
    if (['jump', 'changing-path'].includes(l.section) && isPhysical(l)) problems.push(`contained section has a table step ${l.id}`);
  }
  for (const s of SECTIONS) {
    if (!knowledgeLessons(s.id).length) problems.push(`section without knowledge ${s.id}`);
    const list = lessonsFor(s.id);
    for (let i = 1; i < list.length; i++) if (ORDER[list[i].assist] < ORDER[list[i - 1].assist]) problems.push(`assist order ${list[i].id}`);
  }
  return problems;
}
