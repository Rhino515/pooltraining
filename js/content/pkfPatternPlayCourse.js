/**
 * PKF Pattern Play Course (+ PKF Pattern Play Exam).
 * Source: PKF Pattern Play / Cue Ball Control, HALF TABLE PATTERNS (Chapter Five, printed pages 58–84) and
 * FULL TABLE PATTERNS (Chapter Six, printed pages 85–136), PDF pages 75–158. The pack stops before TIPS & TRICKS.
 * Original JPEGs only (images/pkf-pattern/). Every lesson cites its printed page; explanations quote or
 * paraphrase PKF. No outside instruction, no invented positions, routes, speeds or pockets.
 * App mechanics (lock/reveal, 70% section gate, 80% exam pass, 3 attempts per table exercise, the shot-by-shot
 * result buttons) are app settings, not PKF rules. See docs/PKF_PATTERN_PLAY_SOURCE_MAP.md.
 *
 * Table setups use the ORIGINAL PKF layout image (no app coordinates): PKF prints its layouts as diagrams
 * without measurements, so ball positions are reproduced from the image (PKF: use stickers to mark them).
 */
import { regionOf, regionHTML, chapterOf } from './pkfPatternPlayAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Pattern Play Course';
export const EXAM_TITLE = 'PKF Pattern Play Exam';
export const SHORT_TITLE = 'PKF Pattern Play';
export const STORAGE_KEY = 'pkfPatternPlay';
export const HASH = 'pkfpattern';
/** App settings (same pattern as the other PKF courses). Not PKF rules. */
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;
export const ATTEMPTS_MAX = 3;
export const NOT_SPECIFIED = 'Not specified in PKF';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN THE PATTERN',
  NEXT: 'WHAT’S NEXT?',
  WHERE: 'WHERE SHOULD THE CUE BALL GO?',
  SEQUENCE: 'CHOOSE THE SEQUENCE',
  BUILD: 'BUILD THE PATTERN',
  ROUTE: 'PREDICT THE ROUTE',
  ACTION: 'CHOOSE CUE-BALL ACTION',
  SPEED: 'CHOOSE SPEED',
  PROBLEM: 'FIND THE PROBLEM',
  SOLVE: 'SOLVE IT YOURSELF',
  RUN: 'NOW RUN THE PATTERN'
};
export const KNOWLEDGE_TYPES = ['NEXT', 'WHERE', 'SEQUENCE', 'BUILD', 'ROUTE', 'ACTION', 'SPEED', 'PROBLEM', 'SOLVE'];
/** CHOOSE SPEED labels (used only where PKF's own wording translates directly). */
export const SPEED_LABELS = ['SOFT', 'MEDIUM-SOFT', 'MEDIUM', 'MEDIUM-FIRM', 'FIRM'];

/**
 * Physical kind 'pattern' (the only kind): the player runs PKF's shots in order and records each one.
 *  Shot buttons (not the last shot): BALL MADE + POSITION / BALL MADE, POSITION LOST / SHOT MISSED
 *  (+ WRONG SEQUENCE only when the exercise has `sequence: true`).
 *  Last shot: BALL MADE / SHOT MISSED (or the three position buttons when that shot has `pos: true`).
 *  Attempt result: PATTERN COMPLETED / PATTERN FAILED — SHOT MISSED / — POSITION LOST / — WRONG SEQUENCE.
 */
export const SHOT_TAGS = {
  pos: { label: 'BALL MADE + POSITION', made: true, pos: true },
  lost: { label: 'BALL MADE, POSITION LOST', made: true, pos: false },
  made: { label: 'BALL MADE', made: true, pos: null },
  miss: { label: 'SHOT MISSED', made: false, pos: null },
  seq: { label: 'WRONG SEQUENCE', made: null, pos: null }
};
export const RESULT_LABEL = {
  completed: 'PATTERN COMPLETED',
  missed: 'PATTERN FAILED — SHOT MISSED',
  position: 'PATTERN FAILED — POSITION LOST',
  sequence: 'PATTERN FAILED — WRONG SEQUENCE'
};
export const PHYS = { pattern: SHOT_TAGS };

/** PKF's own groupings: Chapter Five sub-groups, then Chapter Six headings. `half` = Half Table progress. */
export const SECTIONS = [
  { id: 'three-ball', n: 1, half: true, title: 'Half Table: Three Ball Patterns', blurb: 'PKF’s half table rules, then five three-ball patterns: work backwards from the last ball.', pages: '58–66' },
  { id: 'four-ball', n: 2, half: true, title: 'Half Table: Four Ball Patterns', blurb: 'Five four-ball patterns: pocket lines, sliding vs rolling, rails for a bigger window.', pages: '66–74' },
  { id: 'five-ball', n: 3, half: true, title: 'Half Table: Five Ball Patterns', blurb: 'Five five-ball patterns, chalk targets, stun follow, problem shots and stickers.', pages: '74–84' },
  { id: 'wagon-wheel', n: 4, half: true, title: 'Wagon Wheel', blurb: 'PKF’s wagon wheel drill for the cue ball path from the side pocket.', pages: '84' },
  { id: 'eight-ball', n: 5, half: false, title: 'Full Table: 8-Ball Layouts', blurb: 'Center ball only: ball in hand on the last solid, the sliding path as a reference, and choosing the order.', pages: '85–93' },
  { id: 'balls-in-order', n: 6, half: false, title: 'Full Table: Balls in Order', blurb: 'Three- to seven-ball layouts in order: roll it in, or use the sliding path as the reference.', pages: '93–107' },
  { id: 'sidespin', n: 7, half: false, title: 'Full Table with Sidespin', blurb: 'When sidespin helps, when it hurts: running and reverse english, throw, curve and typical shots.', pages: '107–118' },
  { id: 'pre-shot', n: 8, half: false, title: 'Pre-Shot Routine', blurb: 'PKF’s pre-shot questions, trusting the game plan, visualizing and the pause.', pages: '118–121' },
  { id: 'actual-games', n: 9, half: false, title: 'Full Table Patterns from Actual Games', blurb: 'Five layouts from actual games (9-Ball and 8-Ball), then PKF’s marker drill.', pages: '121–136' }
];
export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

/** Half-table pattern rule (PKF page 58): crossing the halfway point means start over — recorded as POSITION LOST. */
const HALF_RULE = 'PKF half table rules: center, center low or center high only; the cue ball must stay on its half of the table (if it crosses the halfway point, start over: record POSITION LOST); decide every pocket before you shoot.';
const STICKERS = 'PKF: use stickers to mark the ball positions so you can set the layout up again.';
const IMG_SETUP = (where) => `Set the balls up as in PKF’s original layout (${where}). The original image is the setup; the app gives no coordinates.`;
/** PKF names pockets as seen in its table photos; the top-down layout diagrams are drawn from another side. */
export const ORIENT = 'Pocket names (top/bottom, left/right) are PKF’s and follow PKF’s photos, which are taken from a different side than the top-down layout diagram. Match the pockets using the photo figures.';

const L = [
  // ================================================================ 1 · Half Table: Three Ball Patterns (pages 58–66)
  { id: 'pp-ht-rules', section: 'three-ball', type: 'LEARN', assist: 'GUIDED', title: 'Half table pattern play', src: 'Page 58 · Figure 5-1', concept: 'Half table rules', pattern: 'rules',
    fig: 'f5-1', purpose: 'TEACHING',
    prompt: 'Read PKF’s rules for half table pattern play, then look at the first layout (figure 5-1).',
    explain: 'PKF: start with three ball patterns using only center, center low and center high. You can pocket the object balls in any of the six pockets, but the cue ball must remain on one half of the table, and you must decide which pockets you’re making each ball into before you begin shooting. If the cue ball crosses the halfway point, start the run over. Removing half of the table takes away a player’s safety net, so angles and speed control have to be much more precise. Use stickers for each ball so you can shoot each pattern several times. “Half table pattern play is not just about running out, it’s about learning which shots you need to work on.” Be very specific on each shot: the pocket, how you strike the cue ball, and exactly where the cue ball ends up. Before you decide on your pocket for the 1 ball, decide what pocket you’ll be playing the 3 ball into. Working backwards like this helps in the more complicated 8-Ball and 9-Ball patterns.' },
  { id: 'pp-ht-cross', section: 'three-ball', type: 'NEXT', assist: 'GUIDED', title: 'Over the halfway point', src: 'Page 58', concept: 'Half table rules', pattern: 'rules',
    fig: 'f5-1', reveal: 'f5-1', purpose: 'QUESTION',
    prompt: 'You’re running a half table pattern and your cue ball rolls across the halfway point of the table. What’s next, by PKF’s rules?',
    hint: 'Removing half of the table takes away the safety net.',
    choices: [['keep', 'Keep shooting if the next ball is still makeable'], ['over', 'Start the run over'], ['side', 'Keep shooting, but only with center ball']], answer: 'over',
    explain: 'PKF: “If the cue ball crosses the halfway point we’ll have to start the run over.” The cue ball must remain on one half of the table, and you decide every pocket before you begin shooting.' },
  // Pattern 1 (figure 5-1)
  { id: 'pp-p1-last', section: 'three-ball', type: 'NEXT', assist: 'GUIDED', title: 'Pattern 1: what do you decide first?', src: 'Pages 58–59 · Figures 5-1, 5-2', concept: 'Work backwards from the last ball', pattern: 'ht3-1',
    fig: 'f5-1', reveal: 'f5-2', purpose: 'QUESTION',
    prompt: 'First three ball pattern (figure 5-1), ball in hand, balls in order. Before you pick the pocket for the 1 ball, what does PKF say to decide?',
    hint: 'PKF works backwards.',
    choices: [['cb', 'Where to place the cue ball for the 1 ball'], ['last', 'The pocket you’ll play the 3 ball (the last ball) into, then work backwards'], ['speed', 'The speed of the first shot']], answer: 'last',
    explain: 'PKF: “Before you decide on your pocket for the 1 ball, decide what pocket you’ll be playing the 3 ball into. Working backwards like this is really going to help.” In this pattern the 3 ball goes in the bottom left corner pocket, so PKF wants to be in the position area of figure 5-2 for the 3 ball. (PKF names pockets as seen in its photos.)' },
  { id: 'pp-p1-where2', section: 'three-ball', type: 'WHERE', assist: 'GUIDED', title: 'Pattern 1: the ideal spot on the 2 ball', src: 'Page 59 · Figures 5-2, 5-3', concept: 'Let the angles do the work', pattern: 'ht3-1',
    fig: 'f5-2', reveal: 'f5-3', purpose: 'QUESTION',
    prompt: 'The highlighted area in figure 5-2 is PKF’s position area for the 3 ball. What makes a spot on the 2 ball “ideal” for getting there?',
    hint: 'PKF wants the easiest way from the 2 ball to the position area.',
    choices: [['straight', 'Straight in on the 2 ball, so you can stop the cue ball'], ['roll', 'An angle where you just roll in the 2 ball and the cue ball naturally heads to the position area'], ['draw', 'A thin cut, so you can draw back to the area']], answer: 'roll',
    explain: 'PKF: “If the cue ball were here (figure 5-3), all we would have to do is roll in the 2 ball and the cue ball would naturally head to our position area. This would be the ideal position for the 2 ball.”' },
  { id: 'pp-p1-route', section: 'three-ball', type: 'ROUTE', assist: 'GUIDED', title: 'Pattern 1: from the 1 ball to the 2', src: 'Page 59 · Figures 5-4, 5-5, 5-6', concept: 'Use a rail instead of perfect speed', pattern: 'ht3-1',
    fig: 'f5-3', reveal: 'f5-6', purpose: 'QUESTION',
    prompt: 'PKF shows two options for getting the ideal angle on the 2 ball (figure 5-3) from the 1 ball. Which does PKF call the easier way?',
    hint: 'One option needs perfect speed control.',
    choices: [['follow', 'Put the cue ball on the pocket line for the bottom right corner and follow it with center high toward the angle'], ['side', 'Shoot the 1 ball into the side pocket, cue ball above center (not max high), softly roll it in so the cue ball goes to the side rail and into the position area']], answer: 'side',
    explain: 'PKF: the follow option (figure 5-4) needs perfect speed control, “otherwise we could roll too far and end up with a flat angle, or end up short of the ideal angle (figure 5-5).” The easier way is shooting the 1 ball into the side pocket (figure 5-6), striking the cue ball above center (not max high), with an angle where all you have to do is softly roll it in and the cue ball travels toward the side rail and into the position area. Mark the spot on the rail the cue ball needs to strike with a piece of chalk.' },
  { id: 'pp-p1-rail', section: 'three-ball', type: 'PROBLEM', assist: 'GUIDED', title: 'Pattern 1: too high on the rail', src: 'Page 60 · Figures 5-7, 5-8', concept: 'Angle on the object ball', pattern: 'ht3-1',
    fig: 'f5-7', reveal: 'f5-8', purpose: 'QUESTION',
    prompt: 'Practising the 1 ball shot, your cue ball hits too high on the rail (figure 5-7). What does that mean?',
    hint: 'Hitting too low means the opposite.',
    choices: [['more', 'You need more angle on the 1 ball'], ['less', 'You had too much angle on the 1 ball'], ['hard', 'You hit the shot too hard']], answer: 'more',
    explain: 'PKF: “If you practice this shot and your cue ball hits too high on the rail (figure 5-7), that means you need more angle on the 1 ball. If you shoot the 1 ball and the cue ball hits too low on the rail (figure 5-8), that means you had too much angle on the 1 ball.” You’ll know it’s the correct angle when you can land in your position area with minimal effort.' },
  { id: 'pp-p1-ab', section: 'three-ball', type: 'PROBLEM', assist: 'GUIDED', title: 'Pattern 1: ending up at A', src: 'Page 60 · Figure 5-9', concept: 'Angle on the object ball', pattern: 'ht3-1',
    fig: 'f5-9', reveal: 'f5-9', purpose: 'QUESTION',
    prompt: 'Playing from the 2 ball to the 3 ball, you end up in position A (figure 5-9). What went wrong on the 2 ball?',
    choices: [['notenough', 'Not enough angle on the 2 ball'], ['speed', 'Too much speed'], ['toomuch', 'Too much angle on the 2 ball']], answer: 'toomuch',
    explain: 'PKF: “If you end up in position ‘A’ then you had too much angle on the 2 ball. If you end up near position ‘B’ then you didn’t have enough angle on the 2 ball. The goal of this pattern is to play a precise angle on the 2 ball where all you have to do is roll it in and the cue ball will naturally travel toward the position area.”' },
  { id: 'pp-p1-learn', section: 'three-ball', type: 'LEARN', assist: 'GUIDED', title: 'Pattern 1: PKF solution', src: 'Pages 58–60 · Figures 5-1 to 5-9', concept: 'Work backwards from the last ball', pattern: 'ht3-1',
    fig: 'f5-6', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the first three ball pattern, shot by shot.',
    explain: 'PKF SOLUTION, worked backwards. 3 ball: bottom left corner pocket, from the position area in figure 5-2. 2 ball: the ideal angle (figure 5-3), where you just roll it in and the cue ball naturally heads to that area. 1 ball: into the side pocket (figure 5-6), cue ball above center (not max high), soft roll so the cue ball goes to the side rail and into the position area for the 2 ball; mark the rail spot with chalk. Too high on the rail = more angle needed; too low = too much angle (figures 5-7, 5-8). Center, center low and center high only, and the cue ball stays on its half of the table.' },
  { id: 'pp-p1-run', section: 'three-ball', type: 'RUN', assist: 'GUIDED', title: 'Run pattern 1', src: 'Pages 58–60 · Figures 5-1, 5-6', concept: 'Half table runout', pattern: 'ht3-1', plan: 'pp-p1-route',
    fig: 'f5-1', reveal: 'f5-6', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s first three ball pattern and run it the PKF way.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('figure 5-1, page 58'), STICKERS, ORIENT, 'Ball in hand: place the cue ball for the 1 ball as PKF shows in figure 5-6 (page 59).', HALF_RULE],
      shots: [
        { label: '1 ball in the side pocket → cue ball off the side rail to the angle on the 2 ball (figure 5-6)', pos: true },
        { label: '2 ball, rolled in → cue ball to the position area for the 3 ball (figures 5-2, 5-3)', pos: true },
        { label: '3 ball in the bottom left corner pocket', pos: false }],
      objective: 'Run the three balls in order, in PKF’s pockets, without the cue ball leaving its half of the table.',
      gaps: ['Speed (PKF: soft roll on the 1 ball)'] },
    explain: 'PKF: practise the 1 ball shot until you get a feel for the angle you need to hit your target on the side rail; then practise ending up near the position area for the 3 ball (figure 5-9).' },
  // Pattern 2 (unnumbered layout, page 60)
  { id: 'pp-p2-last', section: 'three-ball', type: 'PROBLEM', assist: 'ASSISTED', title: 'Pattern 2: a ball hanging in the pocket', src: 'Pages 60–61 · unnumbered layout', concept: 'Thin cut on a hanging ball', pattern: 'ht3-2',
    fig: 'fU79a', reveal: 'f5-11', purpose: 'QUESTION',
    prompt: 'Next layout, ball in hand, balls in order. PKF: the key shot is getting the proper angle on the 2 ball to get on the 3 ball (top right corner). The 1 ball is hanging in a pocket. What’s the problem PKF says many players make on a ball like this?',
    hint: 'It’s about how the shot is approached, not the stroke.',
    choices: [['quick', 'They shoot it too quickly'], ['hard', 'They hit it too softly and leave it hanging'], ['spin', 'They forget to use sidespin']], answer: 'quick',
    explain: 'PKF: “The problem many players make when shooting a ball that’s hanging in a pocket is they shoot too quickly. When a top player shoots a ball that’s hanging in a pocket they spend as much time on that shot as they would on a full table shot.” Working backwards: the 3 ball goes in the top right corner pocket, and the goal is the angle on the 2 ball in figure 5-11, where you just roll it in and position on the 3 ball is automatic.' },
  { id: 'pp-p2-amateur', section: 'three-ball', type: 'PROBLEM', assist: 'ASSISTED', title: 'Pattern 2: the sidespin option', src: 'Page 61 · Figure 5-12', concept: 'Sidespin makes position less precise', pattern: 'ht3-2',
    fig: 'f5-12', reveal: 'f5-12', purpose: 'QUESTION',
    prompt: 'Many amateur players would put the cue ball here (figure 5-12) and use sidespin to drive the cue ball toward the side rail and out. What usually happens, according to PKF?',
    hint: 'Two things can go wrong, labelled A and B.',
    choices: [['scratch', 'The cue ball scratches in the side pocket'], ['ab', 'They mishit the 1 ball, sending the cue ball into the 2 ball (B), or overhit and miss the position area (A)'], ['short', 'The 1 ball can’t be pocketed from there']], answer: 'ab',
    explain: 'PKF: “What usually happens is they’ll mishit the 1 ball sending the cue ball into the 2 ball (B), or they’ll overhit the shot and miss their position area (A). It’s difficult to be precise with the cue ball position when playing shape this way.”' },
  { id: 'pp-p2-action', section: 'three-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Pattern 2: center ball to the position area', src: 'Page 61 · Figure 5-13', concept: 'Thin cut on a hanging ball', pattern: 'ht3-2',
    fig: 'fU79a', reveal: 'f5-13', purpose: 'QUESTION',
    prompt: 'PKF shows an easy way from the 1 ball to the angle on the 2 ball “just by hitting center on the cue ball”. How does PKF set it up?',
    hint: 'The cue ball is close to the 1 ball.',
    choices: [['side', 'Cue ball far from the 1 ball, sidespin off the side rail'], ['low', 'Cue ball straight in, draw back'], ['thin', 'Cue ball fairly close to the 1 ball; hit just a thin slice of the 1 ball']], answer: 'thin',
    explain: 'PKF: “Place the cue ball fairly close to the 1 ball (figure 5-13) and really concentrate on trying to hit just a thin slice of the 1 ball. The first few times you try this shot you’ll probably hit too much of the 1 ball sending the cue ball toward the middle of the table (A).” When a top player shoots a ball hanging in a pocket, they spend as much time on it as on a full table shot.' },
  { id: 'pp-p2-flat', section: 'three-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Pattern 2: a flatter angle on the 2', src: 'Page 61 · Figure 5-14', concept: 'High action off the rail', pattern: 'ht3-2',
    fig: 'f5-11', reveal: 'f5-14', purpose: 'QUESTION',
    prompt: 'You end up with a flatter angle on the 2 ball than PKF’s position area. What does PKF use to get shape on the 3 ball?',
    choices: [['high', 'High action, forcing the cue ball off the side rail and toward the end rail'], ['stop', 'A stop shot'], ['draw', 'Draw back toward the side pocket']], answer: 'high',
    explain: 'PKF: “Once you end up in your position area it’s just a matter of rolling in the 2 ball and the cue ball heads to the position area (figure 5-14). If you end up with a flatter angle on the 2 ball (B), then you’ll have to use high action to force the cue ball off the side rail and toward the end rail for shape on the 3 ball.”' },
  { id: 'pp-p2-learn', section: 'three-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Pattern 2: PKF solution', src: 'Pages 60–61 · Figures 5-11 to 5-14', concept: 'Thin cut on a hanging ball', pattern: 'ht3-2',
    fig: 'f5-13', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the second three ball pattern.',
    explain: 'PKF SOLUTION. 3 ball: top right corner pocket. 2 ball: end up at the angle in figure 5-11, so you just roll it in and position on the 3 ball is automatic. 1 ball (hanging in the pocket): cue ball fairly close, center ball, a thin slice of the 1 ball (figure 5-13); too much of the 1 ball sends the cue ball toward the middle (A). Don’t shoot a hanging ball too quickly. With a flatter angle on the 2 ball (B), use high action off the side rail toward the end rail (figure 5-14).' },
  { id: 'pp-p2-run', section: 'three-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run pattern 2', src: 'Pages 60–61 · unnumbered layout, Figure 5-13', concept: 'Half table runout', pattern: 'ht3-2', plan: 'pp-p2-action',
    fig: 'fU79a', reveal: 'f5-13', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s second three ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 60'), STICKERS, ORIENT, 'Ball in hand: cue ball fairly close to the 1 ball, as in figure 5-13 (page 61).', HALF_RULE],
      shots: [
        { label: '1 ball (thin slice, center ball) → cue ball to the angle on the 2 ball (figures 5-11, 5-13)', pos: true },
        { label: '2 ball, rolled in → cue ball to position on the 3 ball (figure 5-14)', pos: true },
        { label: '3 ball in the top right corner pocket', pos: false }],
      objective: 'Run the three balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1 and 2 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: it’s a type of shot few people practise, but it comes up over and over again. Keep practising until you can consistently land in your target area.' },
  // Pattern 3 (figure 5-15)
  { id: 'pp-p3-where', section: 'three-ball', type: 'WHERE', assist: 'ASSISTED', title: 'Pattern 3: which side of the line?', src: 'Pages 62–63 · Figures 5-15, 5-16', concept: 'Correct side of the pocket line', pattern: 'ht3-3',
    fig: 'f5-15', reveal: 'f5-16', purpose: 'QUESTION',
    prompt: 'Third pattern (figure 5-15). PKF pockets the 3 ball in the bottom right corner and the 2 ball in the side pocket. Where does the cue ball need to be for the 2 ball?',
    hint: 'After the 2 ball, the cue ball has to travel toward the end rail.',
    choices: [['below', 'Below the 2 ball pocket line for the side pocket'], ['above', 'Above the 2 ball pocket line for the side pocket'], ['on', 'Exactly on the 2 ball pocket line']], answer: 'above',
    explain: 'PKF: if the cue ball is above the pocket line for the side pocket (figure 5-16), “all we would have to do is pocket the 2 ball and the cue ball would naturally travel toward the end rail for position on the 3 ball.” Find the pocket line through the side pocket and the 2 ball: “this is the line you must cross to get the correct angle on the 2 ball.”' },
  { id: 'pp-p3-route', section: 'three-ball', type: 'ROUTE', assist: 'ASSISTED', title: 'Pattern 3: from the 1 ball', src: 'Page 62 · Figures 5-17, 5-18', concept: 'Use a rail instead of perfect speed', pattern: 'ht3-3',
    fig: 'f5-15', reveal: 'f5-18', purpose: 'QUESTION',
    prompt: 'What’s PKF’s easy way to get the correct angle on the 2 ball from the 1 ball?',
    hint: 'PKF marks a spot with chalk.',
    choices: [['draw', 'Put the cue ball at an angle and draw it back into the open position area'], ['rail', 'Mark where the 2 ball pocket line meets the rail; cue ball at an angle on the 1 ball heading for that spot, striking above center, so it comes off the rail above the line']], answer: 'rail',
    explain: 'PKF: drawing into the area (figure 5-17) needs excellent speed control: below the 2 ball pocket line (A) it’s very difficult to get back on the 3 ball; a bit too far (B) leaves an extremely difficult shot. “Trying to play position into an open area without using rails requires almost perfect speed control.” The easy way: mark the spot where the 2 ball pocket line meets the rail with chalk (figure 5-18), place the cue ball at an angle on the 1 ball so it heads toward that spot, strike above center, and it should come off the rail above the pocket line.' },
  { id: 'pp-p3-close', section: 'three-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Pattern 3: too close to the line', src: 'Page 63 · Figure 5-20', concept: 'Sliding vs rolling cue ball', pattern: 'ht3-3',
    fig: 'f5-20', reveal: 'f5-20', purpose: 'QUESTION',
    prompt: 'The cue ball ended up too close to the 2 ball pocket line (figure 5-20). A rolling cue ball would hit the side rail too high, and a sliding cue ball (A) heads close to the corner pocket. What does PKF do?',
    hint: 'PKF gives two options, both with the same stroke.',
    choices: [['roll', 'Roll it softly anyway'], ['spin', 'Add sidespin to bend the cue ball'], ['firm', 'A little low spin (C) or a touch of high spin to the side rail (B), both with a firm stroke']], answer: 'firm',
    explain: 'PKF: “Since a sliding cue ball heads close to the corner pocket, we can either add a little low spin to the cue ball (C) or we can use a touch of high spin forcing the cue ball to the side rail (B). Both shots will require a firm stroke.” Figure 5-19 shows the ideal angle.' },
  { id: 'pp-p3-learn', section: 'three-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Pattern 3: PKF solution', src: 'Pages 62–63 · Figures 5-15 to 5-20', concept: 'Correct side of the pocket line', pattern: 'ht3-3',
    fig: 'f5-19', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the third three ball pattern. “When this pattern is run out correctly it takes very little effort.”',
    explain: 'PKF SOLUTION. 3 ball: bottom right corner pocket. 2 ball: side pocket, from above its pocket line, so the cue ball naturally travels toward the end rail (figure 5-16; ideal angle figure 5-19). 1 ball: chalk the spot where the 2 ball pocket line meets the rail, cue ball at an angle heading to that spot, above center (figure 5-18). Too close to the line (figure 5-20): a little low (C) or a touch of high (B), firm stroke. Remember, you have to play the balls in the pockets you picked before the run.' },
  { id: 'pp-p3-run', section: 'three-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run pattern 3', src: 'Pages 62–63 · Figures 5-15, 5-18', concept: 'Half table runout', pattern: 'ht3-3', plan: 'pp-p3-route',
    fig: 'f5-15', reveal: 'f5-18', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s third three ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('figure 5-15, page 62'), STICKERS, ORIENT, 'Chalk the spot where the 2 ball pocket line (side pocket) meets the rail (figure 5-18).', 'Ball in hand: cue ball at an angle on the 1 ball, heading for that spot (figure 5-18).', HALF_RULE],
      shots: [
        { label: '1 ball → cue ball off the rail, above the 2 ball pocket line (figure 5-18)', pos: true },
        { label: '2 ball in the side pocket → cue ball toward the end rail for the 3 ball (figure 5-19)', pos: true },
        { label: '3 ball in the bottom right corner pocket', pos: false }],
      objective: 'Run the three balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pocket for the 1 ball (shown in PKF’s figure only)', 'Speed on the 1 ball'] },
    explain: 'PKF: if the cue ball can hit the correct spot on the rail, it should come off the rail above the pocket line, leaving a nice angle on the 2 ball.' },
  // Pattern 4 (unnumbered layout, page 63)
  { id: 'pp-p4-solve', section: 'three-ball', type: 'SOLVE', assist: 'INDEPENDENT', title: 'Pattern 4: how would you run this?', src: 'Pages 63–64 · unnumbered layout, Figures 5-22 to 5-24', concept: 'Choose the pocket with the bigger window', pattern: 'ht3-4',
    fig: 'fU82a', reveal: 'f5-24', purpose: 'QUESTION',
    prompt: 'Fourth pattern, ball in hand, balls in order. It isn’t clear yet which corner the 3 ball goes in, so look at the 2 ball first. Where does PKF play position for the 2 ball?',
    choices: [['far', 'Into one of the far corner pockets'], ['top', 'Into the top side pocket'], ['bottom', 'Into the bottom side pocket, drawing back from the 1 ball']], answer: 'top',
    explain: 'PKF: the far corners are risky; a hair short and you’re left with a long tough shot (figure 5-22). The bottom side pocket (figure 5-23) leaves a very small position area: too short (A) or too long (B) and you’re in trouble. The top side pocket gives a much larger area (figure 5-24), so speed control doesn’t have to be perfect; from there the 3 ball goes in the bottom right corner pocket.' },
  { id: 'pp-p4-route', section: 'three-ball', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Pattern 4: into the big window', src: 'Page 64 · Figures 5-25, 5-26', concept: 'Two rails for a greater margin of error', pattern: 'ht3-4',
    fig: 'f5-24', reveal: 'f5-26', purpose: 'QUESTION',
    prompt: 'The highlighted area (figure 5-24) is the position area for the 2 ball in the top side pocket. Which route from the 1 ball does PKF call the better option?',
    choices: [['one', 'Come off one rail toward the position area'], ['both', 'Play the cue ball off both side rails, so it travels within the position area off the second rail']], answer: 'both',
    explain: 'PKF: one rail (figure 5-25) works but needs very good speed control; a bit short (A) and you can no longer pocket the 2 ball in the side and get position for the 3 ball. “A better option is to place the cue ball here (figure 5-26), and play the cue ball off both side rails. Now when the cue ball comes off the second rail it will be traveling within the position area; by playing position this way we have a greater margin of error.”' },
  { id: 'pp-p4-low', section: 'three-ball', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Pattern 4: below the second diamond', src: 'Page 64 · Figure 5-27', concept: 'Low spin on the two-rail shot', pattern: 'ht3-4',
    fig: 'f5-27', reveal: 'f5-27', purpose: 'QUESTION',
    prompt: 'On the two-rail position shot you strike the cue ball with low spin (figure 5-27). Your cue ball hits the rail below the second diamond (A). What caused it?',
    choices: [['less', 'Not enough low spin'], ['more', 'Too much low spin'], ['speed', 'Not enough speed']], answer: 'less',
    explain: 'PKF: “If your cue ball doesn’t have enough low spin on it you’ll be hitting the rail below the second diamond (A). Too much low spin and the cue ball will travel more toward the side pocket (B). Keep practicing until you can consistently land in the position area.”' },
  { id: 'pp-p4-speed', section: 'three-ball', type: 'SPEED', assist: 'INDEPENDENT', title: 'Pattern 4: speed depends on the angle', src: 'Page 65 · Figure 5-28', concept: 'Speed depends on the angle', pattern: 'ht3-4',
    fig: 'f5-28', reveal: 'f5-28', purpose: 'QUESTION',
    prompt: 'Shooting the 2 ball (figure 5-28), your cue ball is at position C, close to the 2 ball pocket line. Which speed does PKF give?',
    choices: [['soft', 'SOFT, with a rolling cue ball'], ['firm', 'FIRM: a very firm stroke'], ['softdraw', 'SOFT, with draw']], answer: 'firm',
    explain: 'PKF: “When you shoot the 2 ball your speed will depend on the angle.” At cue ball A (the ideal position) a soft stroke with a rolling cue ball comes off the side rail for the 3 ball. At B there’s less angle, so more of a sliding cue ball and a firm stroke. “Cue ball position ‘C’ requires a very firm stroke since it’s close to the 2 ball pocket line.” Strike near center.' },
  { id: 'pp-p4-learn', section: 'three-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Pattern 4: PKF solution', src: 'Pages 63–65 · Figures 5-22 to 5-28', concept: 'Choose the pocket with the bigger window', pattern: 'ht3-4',
    fig: 'f5-26', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the fourth three ball pattern.',
    explain: 'PKF SOLUTION. 2 ball: top side pocket, because its position area is much larger (figure 5-24). 1 ball: play the cue ball off both side rails with low spin so it travels within the position area off the second rail (figures 5-26, 5-27). 2 ball: speed depends on the angle (figure 5-28: A soft and rolling, B sliding and firm, C very firm), striking near center; the cue ball comes off the side rail for the 3 ball. 3 ball: bottom right corner pocket.' },
  { id: 'pp-p4-run', section: 'three-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run pattern 4', src: 'Pages 63–65 · unnumbered layout, Figures 5-26, 5-28', concept: 'Half table runout', pattern: 'ht3-4', plan: 'pp-p4-solve',
    fig: 'fU82a', reveal: 'f5-26', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s fourth three ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 63'), STICKERS, ORIENT, 'Ball in hand: place the cue ball for the 1 ball as PKF shows in figure 5-26 (page 64).', HALF_RULE],
      shots: [
        { label: '1 ball, low spin → cue ball off both side rails into the position area for the 2 ball (figures 5-26, 5-27)', pos: true },
        { label: '2 ball in the top side pocket → cue ball off the side rail for the 3 ball (figure 5-28)', pos: true },
        { label: '3 ball in the bottom right corner pocket', pos: false }],
      objective: 'Run the three balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pocket for the 1 ball (shown in PKF’s figure only)'] },
    explain: 'PKF: by playing position off both side rails, “we have a greater margin of error.”' },
  // Pattern 5 (unnumbered layout, page 65)
  { id: 'pp-p5-solve', section: 'three-ball', type: 'SOLVE', assist: 'INDEPENDENT', title: 'Pattern 5: how would you run this?', src: 'Pages 65–66 · unnumbered layout, Figures 5-30, 5-31', concept: 'Natural position instead of forcing', pattern: 'ht3-5',
    fig: 'fU84a', reveal: 'f5-31', purpose: 'QUESTION',
    prompt: 'Last three ball pattern. The 3 ball goes in the top right corner pocket; the key shot is the correct angle on the 2 ball. Which way from the 1 ball does PKF call the natural position shot?',
    choices: [['force', 'End up straight-ish on the 2 ball and use high spin to send the cue ball to the end rail and back up'], ['thin', 'Cue ball close to the 1 ball (even partially sitting on the table), cut it extremely thin, just above center, soft stroke']], answer: 'thin',
    explain: 'PKF: the high-spin option (figure 5-30) is not a natural position shot; restricted to half a table, the speed has to be very precise or you may cross half table (B), or let up and end up short (A). The natural shot: put the cue ball here and cut the 1 ball in (figure 5-31), hitting it extremely thin. “The key to this shot is to make sure the cue ball is close to the 1 ball even if it means you’ll be partially sitting on the table. You’ll be striking the cue ball just above center with a soft stroke.”' },
  { id: 'pp-p5-flat', section: 'three-ball', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Pattern 5: flatter isn’t easier', src: 'Page 66 · Figure 5-34', concept: 'Don’t play for flatter angles', pattern: 'ht3-5',
    fig: 'f5-34', reveal: 'f5-34', purpose: 'QUESTION',
    prompt: 'Figure 5-34: cue ball at A or at B on the 2 ball. Why does PKF prefer A?',
    choices: [['easier', 'B is flatter, so the 2 ball is easier and so is position'], ['roll', 'At A you just roll the 2 in softly and the cue ball heads to the 3 ball area; at B you need more of a sliding cue ball, so speed is harder'], ['spin', 'At A you can use sidespin']], answer: 'roll',
    explain: 'PKF: “One of the biggest mistakes that many players make is to play for flatter angles on balls when playing position. The problem is that even though the shot is easier, playing position on the next ball becomes more difficult.” At A the player rolls the 2 ball in with a soft speed; at B he has to use more of a sliding cue ball, so being precise with speed is more difficult.' },
  { id: 'pp-p5-learn', section: 'three-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Pattern 5: PKF solution', src: 'Pages 65–66 · Figures 5-30 to 5-34', concept: 'Natural position instead of forcing', pattern: 'ht3-5',
    fig: 'f5-32', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the last three ball pattern.',
    explain: 'PKF SOLUTION. 1 ball: cue ball close, extremely thin cut, just above center, soft (figure 5-31). 2 ball: the goal angle (figure 5-32); strike around center or a little above with a very soft stroke so the cue ball softly bounces off the side rail near the 3 ball. Overhit and you still have a shot on the 3 ball (figure 5-33), so the window is large. 3 ball: top right corner pocket. Don’t play for flatter angles (figure 5-34).' },
  { id: 'pp-p5-run', section: 'three-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run pattern 5', src: 'Pages 65–66 · unnumbered layout, Figures 5-31, 5-32', concept: 'Half table runout', pattern: 'ht3-5', plan: 'pp-p5-solve',
    fig: 'fU84a', reveal: 'f5-31', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s last three ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 65'), STICKERS, ORIENT, 'Ball in hand: cue ball close to the 1 ball, as in figure 5-31 (page 65).', HALF_RULE],
      shots: [
        { label: '1 ball, extremely thin, just above center, soft → the highlighted area for the 2 ball (figure 5-31)', pos: true },
        { label: '2 ball, very soft, center or a little above → softly off the side rail near the 3 ball (figure 5-32)', pos: true },
        { label: '3 ball in the top right corner pocket', pos: false }],
      objective: 'Run the three balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1 and 2 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: with this type of positional shot the position window is pretty large.' },

  // ================================================================ 2 · Half Table: Four Ball Patterns (pages 66–74)
  // Pattern 1 (unnumbered layout, page 66)
  { id: 'pp-f1-route', section: 'four-ball', type: 'ROUTE', assist: 'GUIDED', title: 'Four ball 1: the route strong players prefer', src: 'Pages 66–67 · unnumbered layout, Figures 5-38, 5-39', concept: 'Use a rail instead of perfect speed', pattern: 'ht4-1',
    fig: 'fU85a', reveal: 'f5-39', purpose: 'QUESTION',
    prompt: 'First four ball pattern. The 4 ball goes in the top right corner; for the 3 ball you need to be near the 3 ball pocket line; for the 2 ball, on the correct side of the 2 ball pocket line. From the 1 ball, which way do many strong players prefer?',
    hint: 'Once the cue ball hits a rail, the speed doesn’t have to be perfect.',
    choices: [['follow', 'Follow the 1 ball across the 2 ball pocket line with no rail'], ['rail', 'Go off the side rail toward the position area']], answer: 'rail',
    explain: 'PKF: following across the line (figure 5-38) isn’t bad, but without a rail the speed control has to be very good: too short (A) or too far (B). “Many strong players prefer this method (figure 5-39), where they go off the side rail toward the position area… once the cue ball hits the rail it’s heading toward the 2 ball on the correct angle so the speed doesn’t have to be perfect.” Even too easy (A) still leaves the correct angle.' },
  { id: 'pp-f1-action', section: 'four-ball', type: 'ACTION', assist: 'GUIDED', title: 'Four ball 1: the 2 ball to the 3', src: 'Pages 66–67 · Figures 5-36, 5-37, 5-40', concept: 'Sliding cue ball', pattern: 'ht4-1',
    fig: 'f5-36', reveal: 'f5-40', purpose: 'QUESTION',
    prompt: 'You’re on the correct side of the 2 ball pocket line. Which cue ball takes you from the 2 ball to the position area near the 3 ball pocket line?',
    hint: 'PKF names it in figure 5-37.',
    choices: [['draw', 'A draw shot'], ['high', 'Maximum high'], ['slide', 'A sliding cue ball']], answer: 'slide',
    explain: 'PKF: “If we can end up on this side of the 2 ball pocket line (figure 5-37), a sliding cue ball will take the cue ball to our position area.” Then pocket the 3 ball and roll forward for the 4 ball (figure 5-36). Don’t end up too close to the side rail on the 1 ball.' },
  { id: 'pp-f1-learn', section: 'four-ball', type: 'LEARN', assist: 'GUIDED', title: 'Four ball 1: PKF solution', src: 'Pages 66–67 · Figures 5-36 to 5-40', concept: 'Work backwards from the last ball', pattern: 'ht4-1',
    fig: 'f5-39', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the first four ball pattern.',
    explain: 'PKF SOLUTION, worked backwards. 4 ball: top right corner pocket. 3 ball: end up near the 3 ball pocket line, pocket it and roll forward (figure 5-36). 2 ball: from the correct side of its pocket line, a sliding cue ball goes to the 3 ball area (figures 5-37, 5-40). 1 ball: off the side rail toward the position area (figure 5-39), not too close to the side rail. PKF: practise running out this pattern a few times; start to understand how angles move the cue ball around the table.' },
  { id: 'pp-f1-run', section: 'four-ball', type: 'RUN', assist: 'GUIDED', title: 'Run four ball pattern 1', src: 'Pages 66–67 · unnumbered layout, Figure 5-39', concept: 'Half table runout', pattern: 'ht4-1', plan: 'pp-f1-route',
    fig: 'fU85a', reveal: 'f5-39', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice running out this pattern a few times.”',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 66'), STICKERS, ORIENT, 'Ball in hand: place the cue ball for the 1 ball as PKF shows in figure 5-39 (page 67).', HALF_RULE],
      shots: [
        { label: '1 ball → off the side rail to the correct side of the 2 ball pocket line (figure 5-39)', pos: true },
        { label: '2 ball, sliding cue ball → near the 3 ball pocket line (figures 5-37, 5-40)', pos: true },
        { label: '3 ball, roll forward → position on the 4 ball (figure 5-36)', pos: true },
        { label: '4 ball in the top right corner pocket', pos: false }],
      objective: 'Run the four balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1, 2 and 3 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: it’s important that you start to understand how angles move the cue ball around the table.' },
  // Pattern 2 (figure 5-41)
  { id: 'pp-f2-where', section: 'four-ball', type: 'WHERE', assist: 'GUIDED', title: 'Four ball 2: least effort on the 3', src: 'Page 68 · Figures 5-41, 5-42', concept: 'Least effort position', pattern: 'ht4-2',
    fig: 'f5-41', reveal: 'f5-42', purpose: 'QUESTION',
    prompt: 'Figure 5-41. The 4 ball goes in the bottom right corner. Where does PKF want the cue ball for the 3 ball (the position shot that requires the least effort)?',
    hint: 'Cut the 3 ball and let the cue ball travel across to the other side rail.',
    choices: [['rail', 'On the end rail: cut the 3 ball into the corner and the cue ball naturally heads to the other side rail for the 4 ball'], ['straight', 'Straight in on the 3 ball, to stop the cue ball'], ['middle', 'In the middle of the table, to draw back']], answer: 'rail',
    explain: 'PKF: “if we can end up on the end rail with the cue ball (figure 5-42), we can just cut the 3 ball into the corner pocket and the cue ball will naturally head to the other side rail for shape on the 4 ball. We’ll be striking the cue ball just above center.”' },
  { id: 'pp-f2-roll', section: 'four-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Four ball 2: missing the 4 ball', src: 'Page 68 · Figure 5-43', concept: 'A hair of roll changes the path', pattern: 'ht4-2',
    fig: 'f5-43', reveal: 'f5-43', purpose: 'QUESTION',
    prompt: 'From this angle on the 2 ball (figure 5-43), the sliding cue ball path goes between the 4 ball and the side rail, very close to the 4 ball. What does PKF do?',
    hint: 'A small change in how the cue ball arrives at the 2 ball.',
    choices: [['draw', 'Draw so the cue ball stays short of the 4 ball'], ['roll', 'Make sure the cue ball has a hair of roll when it strikes the 2 ball, so it reaches the side rail sooner and misses the 4 ball (A)'], ['side', 'Use sidespin to bend around the 4 ball']], answer: 'roll',
    explain: 'PKF: “Since the sliding cue ball path comes very close to striking the 4 ball, we need to make sure the cue ball has a hair of roll on it when it strikes the 2 ball; this will send the cue ball to the side rail sooner missing the 4 ball (A).”' },
  { id: 'pp-f2-learn', section: 'four-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Four ball 2: PKF solution', src: 'Pages 68–69 · Figures 5-41 to 5-44', concept: 'Plan around a hanging ball', pattern: 'ht4-2',
    fig: 'f5-44', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the second four ball pattern.',
    explain: 'PKF SOLUTION. 4 ball: bottom right corner. 3 ball: from the end rail, cut it into the corner and the cue ball heads to the other side rail; strike just above center (figure 5-42). 2 ball: this angle (figure 5-43), with a hair of roll so the cue ball misses the 4 ball. 1 ball: a slight angle, float over to the position area (figure 5-44); the main goal is not to end up too close to the 2 ball pocket line. When a ball is hanging in a pocket, take the time to plan the pattern: the 3 ball is easy to make, but position on the next ball could become difficult. If you struggle with any shot, stop the runout and sticker up the problem shot.' },
  { id: 'pp-f2-run', section: 'four-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run four ball pattern 2', src: 'Pages 68–69 · Figures 5-41, 5-44', concept: 'Half table runout', pattern: 'ht4-2', plan: 'pp-f2-where',
    fig: 'f5-41', reveal: 'f5-44', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s second four ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('figure 5-41, page 68'), STICKERS, ORIENT, 'Ball in hand: cue ball at a slight angle on the 1 ball, as in figure 5-44 (page 68).', HALF_RULE, 'PKF: if you struggle with a shot, stop the runout and sticker up the problem shot.'],
      shots: [
        { label: '1 ball → float to the angle on the 2 ball, not too close to the 2 ball pocket line (figure 5-44)', pos: true },
        { label: '2 ball, a hair of roll → past the 4 ball to the end rail (figure 5-43)', pos: true },
        { label: '3 ball, just above center → to the other side rail for the 4 ball (figure 5-42)', pos: true },
        { label: '4 ball in the bottom right corner pocket', pos: false }],
      objective: 'Run the four balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1 and 2 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: if we can end up in our position area it won’t take much effort to pocket the 2 ball and head to the end rail.' },
  // Pattern 3 (unnumbered layout, page 69)
  { id: 'pp-f3-next', section: 'four-ball', type: 'NEXT', assist: 'ASSISTED', title: 'Four ball 3: on the 3 ball', src: 'Page 69 · unnumbered layout, Figure 5-46', concept: 'Work backwards from the last ball', pattern: 'ht4-3',
    fig: 'fU88a', reveal: 'f5-46', purpose: 'QUESTION',
    prompt: 'Third four ball pattern. The 4 ball goes in the top right corner. If you end up near the 3 ball pocket line, what does the 3 ball shot need?',
    hint: 'The cue ball doesn’t need to travel.',
    choices: [['stop', 'Just stop the cue ball for shape on the 4 ball'], ['follow', 'Follow to the end rail'], ['draw', 'Draw back to the side rail']], answer: 'stop',
    explain: 'PKF: “If we can end up near the 3 ball pocket line for the 3 ball (figure 5-46), then all we have to do is stop the cue ball for shape on the 4 ball.” The best way to get there from the 2 ball is from the end rail: roll the 2 ball in and come off the side rail (figure 5-47).' },
  { id: 'pp-f3-angle', section: 'four-ball', type: 'PROBLEM', assist: 'ASSISTED', title: 'Four ball 3: striking too hard', src: 'Pages 69–70 · Figures 5-49, 5-50', concept: 'Angle does the work', pattern: 'ht4-3',
    fig: 'f5-50', reveal: 'f5-50', purpose: 'QUESTION',
    prompt: 'Drawing from the 1 ball (side pocket) to the end rail, you find yourself striking the cue ball too hard for position. What does PKF say you probably need?',
    choices: [['more', 'A little more angle on the 1 ball'], ['low', 'More low spin'], ['less', 'Less angle on the 1 ball']], answer: 'more',
    explain: 'PKF: “If you find yourself striking the cue ball too hard for position then you probably need to give yourself a little more angle on the 1 ball.” On the draw shot: too little angle needs more stroke and less draw; too much angle and the shot becomes too difficult; the correct angle needs only a soft draw stroke.' },
  { id: 'pp-f3-roll', section: 'four-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Four ball 3: a few inches off the rail', src: 'Page 70 · Figure 5-53', concept: 'Sliding vs rolling cue ball', pattern: 'ht4-3',
    fig: 'f5-53', reveal: 'f5-53', purpose: 'QUESTION',
    prompt: 'You ended up a few inches off the end rail on the 2 ball, so a rolling cue ball no longer works. A sliding cue ball hits too high on the side rail (A). What sends the cue ball on the correct path (B)?',
    choices: [['low', 'A little low spin'], ['firm', 'A firmer stroke with a sliding cue ball'], ['touch', 'A touch of roll on the cue ball, so it hits the rail sooner']], answer: 'touch',
    explain: 'PKF: “A sliding cue ball will hit too high on the side rail (A), but a cue ball with a touch of roll on it will hit the rail sooner sending it on the correct path (B).”' },
  { id: 'pp-f3-learn', section: 'four-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Four ball 3: four ways to the end rail', src: 'Pages 69–71 · Figures 5-46 to 5-55', concept: 'Know several shots', pattern: 'ht4-3',
    fig: 'f5-48', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the third four ball pattern and PKF’s four ways to the end rail.',
    explain: 'PKF SOLUTION. 4 ball: top right corner; stop the cue ball on the 3 ball from near its pocket line (figure 5-46). 2 ball: from the end rail, roll it in and come off the side rail (figures 5-47, 5-52). The four ways from the 1 ball to the end rail (get as close to it as possible): 1) a slight angle for the bottom right corner with maximum high (figure 5-48); 2) a slight angle to the side pocket with a soft draw (figure 5-49); 3) the same into the other side pocket (figure 5-50); 4) the sliding cue ball path off the side rail (figure 5-51). Practise all four until you’re consistent at all of them: in 9-Ball, if the side pockets aren’t available you need to follow to the end rail (figure 5-54); if the corners aren’t, side pocket and drift down (figure 5-55).' },
  { id: 'pp-f3-key', section: 'four-ball', type: 'RUN', assist: 'ASSISTED', title: 'Four ways to the end rail', src: 'Pages 69–70 · Figures 5-48 to 5-51', concept: 'Key shot drill', pattern: 'ht4-3',
    fig: 'f5-48', reveal: 'f5-51', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice all four shots on the 1 ball until you’re consistent at all of them.”',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 69'), 'Pick one of PKF’s four ways (figures 5-48, 5-49, 5-50, 5-51) and place the cue ball as PKF shows for it.', 'The goal of each shot is to get as close as possible to the end rail.'],
      shots: [{ label: '1 ball → cue ball as close as possible to the end rail', pos: true }],
      objective: 'Pocket the 1 ball and end up near the end rail.',
      gaps: ['How close counts as “near the end rail” (your judgement)'] },
    explain: 'PKF: strong players not only have to know a lot of shots, they have to execute them when the time comes.' },
  { id: 'pp-f3-run', section: 'four-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run four ball pattern 3', src: 'Pages 69–70 · unnumbered layout, Figures 5-46, 5-47', concept: 'Half table runout', pattern: 'ht4-3', plan: 'pp-f3-next',
    fig: 'fU88a', reveal: 'f5-47', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s third four ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 69'), STICKERS, ORIENT, 'Ball in hand on the 1 ball, using one of PKF’s four ways to the end rail (figures 5-48 to 5-51).', HALF_RULE],
      shots: [
        { label: '1 ball → near the end rail', pos: true },
        { label: '2 ball, rolled in → off the side rail to near the 3 ball pocket line (figure 5-47)', pos: true },
        { label: '3 ball, stop the cue ball → shape on the 4 ball (figure 5-46)', pos: true },
        { label: '4 ball in the top right corner pocket', pos: false }],
      objective: 'Run the four balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 2 and 3 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: the key to this pattern is getting on the 2 ball.' },
  // Pattern 4 (unnumbered layout, page 71)
  { id: 'pp-f4-problem', section: 'four-ball', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Four ball 4: the problem ball', src: 'Page 71 · unnumbered layout, Figure 5-57', concept: 'Find the problem ball', pattern: 'ht4-4',
    fig: 'fU90a', reveal: 'f5-57', purpose: 'QUESTION',
    prompt: 'Fourth four ball pattern. The 4 ball goes in the bottom right corner. Which ball does PKF call the problem ball, and why?',
    choices: [['three', 'The 3 ball: it has no pocket'], ['one', 'The 1 ball: it’s frozen to the rail'], ['two', 'The 2 ball: the 4 ball blocks it from the bottom right corner, so it goes in the bottom left corner']], answer: 'two',
    explain: 'PKF: “Since the 4 ball is blocking the 2 ball from going into the bottom right corner pocket, we’re going to shoot the 2 ball into the bottom left corner pocket. This means the cue ball needs to end up in this area after pocketing the 1 ball (figure 5-57).” Then from the angle on the 3 ball (figure 5-58), slide straight up table (A) or draw back to the side rail (B).' },
  { id: 'pp-f4-route', section: 'four-ball', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Four ball 4: the key shot', src: 'Pages 71–72 · Figures 5-59, 5-60', concept: 'Use a rail instead of perfect speed', pattern: 'ht4-4',
    fig: 'f5-57', reveal: 'f5-60', purpose: 'QUESTION',
    prompt: 'The key shot is the 1 ball, ending near the 2 ball pocket line (area in figure 5-57). Which way does PKF show?',
    choices: [['rail', 'A slight angle on the 1 ball, follow to the end rail with maximum high, so the cue ball comes off the end rail toward the 2 ball'], ['roll', 'Pocket the 1 ball and roll forward into the open area']], answer: 'rail',
    explain: 'PKF: rolling forward (figure 5-59) usually comes up a bit short (A) or a bit too far (B); without a rail the speed control has to be very precise. Instead, a slight angle on the 1 ball and follow to the end rail (figure 5-60): “Once the cue ball leaves the end rail, it will be traveling toward the 2 ball so the window for position is much larger.” Use maximum high; mark the spot on the end rail. “Remember, this shot is stroke, not power.”' },
  { id: 'pp-f4-next', section: 'four-ball', type: 'NEXT', assist: 'INDEPENDENT', title: 'Four ball 4: on the 2 ball pocket line', src: 'Page 72 · Figure 5-62', concept: 'Don’t overdo position', pattern: 'ht4-4',
    fig: 'f5-62', reveal: 'f5-62', purpose: 'QUESTION',
    prompt: 'You ended up on the 2 ball pocket line (figure 5-62). What does PKF do on the 2 ball?',
    choices: [['allway', 'Draw all the way back for an easier shot on the 3 ball'], ['stop', 'Stop the cue ball (A), or draw back a little bit'], ['follow', 'Follow forward to the end rail']], answer: 'stop',
    explain: 'PKF: “we just need to stop the cue ball (A), or draw back a little bit for shape on the 3 ball. Many players would try to draw the cue ball all the way back for an easier shot on the 3 ball, but the danger is ending up in front of the 4 ball (B), or getting too flat of an angle on the 3 ball (C).” With an angle on the 2 ball (figure 5-63), slide to the side rail and back out.' },
  { id: 'pp-f4-learn', section: 'four-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Four ball 4: PKF solution', src: 'Pages 71–72 · Figures 5-57 to 5-63', concept: 'Find the problem ball', pattern: 'ht4-4',
    fig: 'f5-60', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the fourth four ball pattern.',
    explain: 'PKF SOLUTION. Problem ball: the 2, blocked by the 4 from the bottom right corner, so it goes in the bottom left corner (figure 5-57). 1 ball: slight angle, maximum high, follow to the end rail (figure 5-60); stroke, not power. 2 ball: on its pocket line stop the cue ball or draw a little (figure 5-62); with an angle, slide to the side rail and out (figure 5-63). 3 ball: slide straight up table (A) or draw back to the side rail (B) (figure 5-58). 4 ball: bottom right corner.' },
  { id: 'pp-f4-run', section: 'four-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run four ball pattern 4', src: 'Pages 71–72 · unnumbered layout, Figure 5-60', concept: 'Half table runout', pattern: 'ht4-4', plan: 'pp-f4-problem',
    fig: 'fU90a', reveal: 'f5-60', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice this position shot on the 2 ball until you can consistently come off the rail at the proper angle.” Then run the pattern.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 71'), STICKERS, ORIENT, 'Ball in hand: slight angle on the 1 ball, as in figure 5-60 (page 72). You may mark the spot on the end rail.', HALF_RULE],
      shots: [
        { label: '1 ball, maximum high → off the end rail to near the 2 ball pocket line (figure 5-60)', pos: true },
        { label: '2 ball in the bottom left corner → stop or draw a little for the 3 ball (figure 5-62)', pos: true },
        { label: '3 ball → slide up table (A) or draw to the side rail (B) for the 4 ball (figure 5-58)', pos: true },
        { label: '4 ball in the bottom right corner pocket', pos: false }],
      objective: 'Run the four balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1 and 3 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: “Remember, this shot is stroke, not power.”' },
  // Pattern 5 (figure 5-64)
  { id: 'pp-f5-solve', section: 'four-ball', type: 'SOLVE', assist: 'INDEPENDENT', title: 'Four ball 5: how would you run this?', src: 'Page 73 · Figures 5-64 to 5-68', concept: 'Angle does the work', pattern: 'ht4-5',
    fig: 'f5-64', reveal: 'f5-68', purpose: 'QUESTION',
    prompt: 'Final four ball pattern (figure 5-64). The 4 ball goes in the bottom left corner, and you can’t have much angle on the 2 ball. The key is getting from the 1 ball to the position area for the 2. Which way does PKF call better?',
    choices: [['near', 'Come off the near side rail back toward the 2 ball area'], ['stop', 'A stop shot on the 1 ball'], ['other', 'A slight angle on the 1 ball, below center, bouncing off the other side rail so you’re straight in on the 2 ball']], answer: 'other',
    explain: 'PKF: with the angle on the 3 ball in figure 5-65, the cue ball naturally travels toward the side rail for the 4 ball, so you can’t have much angle on the 2 ball (figure 5-66). Coming off the side rail (figure 5-67) will work, but the better way: “Put the cue ball here (figure 5-68) at a slight angle on the 1 ball, and strike the cue ball below center. The goal is to have the cue ball bounce off the other side rail so we’re straight in on the 2 ball.”' },
  { id: 'pp-f5-speed', section: 'four-ball', type: 'SPEED', assist: 'INDEPENDENT', title: 'Four ball 5: speed on the 1 ball', src: 'Pages 73–74 · Figure 5-68', concept: 'Angle does the work', pattern: 'ht4-5',
    fig: 'f5-64', reveal: 'f5-68', purpose: 'QUESTION',
    prompt: 'On PKF’s better 1 ball shot (below center, off the other side rail, straight in on the 2), what speed does PKF give if it’s struck correctly?',
    choices: [['mf', 'MEDIUM-FIRM'], ['ms', 'MEDIUM-SOFT: between soft and medium'], ['firm', 'FIRM']], answer: 'ms',
    explain: 'PKF: “If struck correctly, the speed will be between soft and medium.” If you find yourself striking the 1 ball too hard, give yourself a little more angle; it’s the proper angle when a nice soft stroke moves the cue ball across the table. (MEDIUM-SOFT is the app’s label for PKF’s “between soft and medium”.)' },
  { id: 'pp-f5-learn', section: 'four-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Four ball 5: PKF solution', src: 'Pages 73–74 · Figures 5-64 to 5-68', concept: 'Angle does the work', pattern: 'ht4-5',
    fig: 'f5-68', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the final four ball pattern.',
    explain: 'PKF SOLUTION. 4 ball: bottom left corner. 3 ball: the angle in figure 5-65, so the cue ball naturally travels toward the side rail. 2 ball: nearly straight (figure 5-66), pocket it and follow past the 3 ball pocket line. 1 ball: slight angle, below center, off the other side rail to straight in on the 2 ball (figure 5-68), speed between soft and medium. Too hard = give yourself more angle.' },
  { id: 'pp-f5-run', section: 'four-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run four ball pattern 5', src: 'Pages 73–74 · Figures 5-64, 5-68', concept: 'Half table runout', pattern: 'ht4-5', plan: 'pp-f5-solve',
    fig: 'f5-64', reveal: 'f5-68', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s final four ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('figure 5-64, page 73'), STICKERS, ORIENT, 'Ball in hand: slight angle on the 1 ball, as in figure 5-68 (page 73).', HALF_RULE],
      shots: [
        { label: '1 ball, below center, between soft and medium → off the other side rail, straight in on the 2 (figure 5-68)', pos: true },
        { label: '2 ball → follow past the 3 ball pocket line (figure 5-66)', pos: true },
        { label: '3 ball → cue ball toward the side rail for the 4 ball (figure 5-65)', pos: true },
        { label: '4 ball in the bottom left corner pocket', pos: false }],
      objective: 'Run the four balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1, 2 and 3 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: keep practising this shot until you can consistently land in your position area for the 2 ball.' },

  // ================================================================ 3 · Half Table: Five Ball Patterns (pages 74–84)
  // Pattern 1 (unnumbered layout, page 74)
  { id: 'pp-v1-where', section: 'five-ball', type: 'WHERE', assist: 'GUIDED', title: 'Five ball 1: shape on the 3 ball', src: 'Page 74 · unnumbered layout, Figures 5-71, 5-72', concept: 'Correct side of the pocket line', pattern: 'ht5-1',
    fig: 'fU93b', reveal: 'f5-72', purpose: 'QUESTION',
    prompt: 'First five ball pattern. The 3 ball is very close to the 4 ball pocket line for the side pocket, so the 4 ball goes in the left side pocket. Where does PKF want the cue ball when playing shape on the 3 ball?',
    hint: 'Too much angle on the 3 and the 4 can’t go in the side.',
    choices: [['line', 'Near the 3 ball pocket line (the highlighted area in figure 5-72)'], ['angle', 'With plenty of angle on the 3 ball'], ['far', 'Far from the 3 ball, for a long rolling shot']], answer: 'line',
    explain: 'PKF: “This pattern really emphasizes how important it is to be on the correct side of the pocket lines.” Since the 4 ball goes in the side pocket, end up near the 3 ball pocket line when playing shape for the 3 ball. In figure 5-72 the player ended up with too much angle on the 3 ball, so he can no longer play shape for the 4 ball in the left side pocket. On the 4 ball, the ideal angle (figure 5-71) lets you slide to the end rail with a touch of low (A) or use a rolling cue ball (B).' },
  { id: 'pp-v1-ghost', section: 'five-ball', type: 'ROUTE', assist: 'GUIDED', title: 'Five ball 1: the 2 ball line through the ghost ball', src: 'Pages 74–75 · Figures 5-73 to 5-76', concept: 'Sliding cue ball path', pattern: 'ht5-1',
    fig: 'fU93b', reveal: 'f5-74', purpose: 'QUESTION',
    prompt: 'Shooting the 1 ball into the bottom right corner, the 2 ball pocket line goes right through the ghost ball. Pocketing the 1 ball with a sliding cue ball, where does the cue ball head?',
    hint: 'A sliding cue ball leaves at 90 degrees to the object ball’s path.',
    choices: [['two', 'Straight toward the 2 ball'], ['rail', 'Into the end rail and back out'], ['corner', 'Into the corner pocket behind the 1 ball']], answer: 'two',
    explain: 'PKF: “If we can pocket the 1 ball with a sliding cue ball it should head straight toward the 2 ball. Put a piece of chalk on the pocket line to use as a target (figure 5-74). Avoid crossing the 2 ball pocket line on either side.” Then put the chalk on the left side of the line (figure 5-75): ending there gives the ideal angle for the 3 ball, striking just below center. Farther away (figure 5-76), strike lower for more low spin.' },
  { id: 'pp-v1-roll', section: 'five-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Five ball 1: higher up on the rail', src: 'Page 75 · Figure 5-77', concept: 'A hair of roll changes the path', pattern: 'ht5-1',
    fig: 'f5-77', reveal: 'f5-77', purpose: 'QUESTION',
    prompt: 'You ended up here on the 2 ball (figure 5-77). The sliding cue ball path heads to the side rail near the 3 ball, a bit too close; PKF wants the position area higher up on the rail. What does PKF do?',
    hint: 'Think of figure 5-43 in the four ball patterns.',
    choices: [['draw', 'Use a little draw'], ['roll', 'Make sure the cue ball has a small amount of roll when it strikes the 2 ball (A)'], ['soft', 'Shoot it softer with a sliding cue ball']], answer: 'roll',
    explain: 'PKF: “In order for our cue ball to head to this position area we need to make sure the cue ball has a small amount of roll on it when it strikes the 2 ball (A).”' },
  { id: 'pp-v1-tip', section: 'five-ball', type: 'PROBLEM', assist: 'ASSISTED', title: 'Five ball 1: too close to the 4 ball line', src: 'Page 76 · Figure 5-79', concept: 'Sliding vs rolling cue ball', pattern: 'ht5-1',
    fig: 'f5-79', reveal: 'f5-80', purpose: 'QUESTION',
    prompt: 'After the 3 ball you ended up too close to the 4 ball pocket line (figure 5-79). A rolling cue ball hits too high on the side rail (B); a sliding cue ball heads near the corner pocket (A). What is PKF’s safer alternative?',
    choices: [['tip', 'About a tip of high spin and a firm stroke, forcing the cue ball to the side rail and down to the end rail (C)'], ['slide', 'A sliding cue ball with a soft stroke'], ['low', 'Maximum low spin']], answer: 'tip',
    explain: 'PKF: with a sliding cue ball heading near the corner pocket (A), “if we accidentally apply a small amount of roll to the cue ball we could scratch on this shot. A safer alternative is to use about a tip of high spin and a firm stroke; this will force the cue ball to the side rail and down to the end rail.” Better still, end up farther above the 4 ball pocket line on the 3 ball (figure 5-80), so the 4 ball can be struck much easier.' },
  { id: 'pp-v1-learn', section: 'five-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Five ball 1: PKF solution', src: 'Pages 74–76 · Figures 5-71 to 5-80', concept: 'Correct side of the pocket line', pattern: 'ht5-1',
    fig: 'f5-75', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the first five ball pattern. Key shot: from the 2 ball to the 3 ball.',
    explain: 'PKF SOLUTION. 1 ball: bottom right corner; chalk on the left side of the 2 ball pocket line, cue ball close at a slight angle, just below center (figure 5-75). 2 ball: a small amount of roll so the cue ball reaches the 3 ball area higher up the rail (figure 5-77). 3 ball: draw back and stay above the 4 ball pocket line (figures 5-78, 5-80). 4 ball: left side pocket, from the angle in figure 5-71 (touch of low sliding to the end rail, or rolling). 5 ball last. If you end up too close to the 4 ball line, about a tip of high and a firm stroke (figure 5-79, C).' },
  { id: 'pp-v1-run', section: 'five-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run five ball pattern 1', src: 'Pages 74–76 · unnumbered layout, Figure 5-75', concept: 'Half table runout', pattern: 'ht5-1', plan: 'pp-v1-where',
    fig: 'fU93b', reveal: 'f5-75', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s first five ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 74'), STICKERS, ORIENT, 'Ball in hand: cue ball close to the 1 ball at a slight angle; chalk on the left side of the 2 ball pocket line (figure 5-75).', HALF_RULE],
      shots: [
        { label: '1 ball in the bottom right corner, just below center → left side of the 2 ball pocket line (figure 5-75)', pos: true },
        { label: '2 ball, small amount of roll → the 3 ball area up the rail (figure 5-77)', pos: true },
        { label: '3 ball, draw back → above the 4 ball pocket line (figure 5-80)', pos: true },
        { label: '4 ball in the left side pocket → shape on the 5 ball (figure 5-71)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 2, 3 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: keep practising the 1 ball position shot until it starts to become easier; it is a common 9-Ball and 8-Ball shot.' },
  // Pattern 2 (unnumbered layout, page 76)
  { id: 'pp-v2-route', section: 'five-ball', type: 'ROUTE', assist: 'ASSISTED', title: 'Five ball 2: from the 1 ball', src: 'Pages 76–77 · unnumbered layout, Figures 5-83, 5-84', concept: 'High action off the rail', pattern: 'ht5-2',
    fig: 'fU95a', reveal: 'f5-84', purpose: 'QUESTION',
    prompt: 'Second five ball pattern. The key is the proper angle on the 2 ball (4 ball in the bottom right corner). What is PKF’s best way from the 1 ball to the 2 ball position area?',
    hint: 'PKF gives the cue ball a target on a rail.',
    choices: [['draw', 'A stop shot, then roll the 2 ball'], ['high', 'A slight angle on the 1 ball for the side pocket, high action to force the cue ball to the side rail and onto the position area'], ['roll', 'Roll forward into the open area']], answer: 'high',
    explain: 'PKF: “The best way is to give ourselves a slight angle on the 1 ball for the side pocket and use high action to force the cue ball to the side rail and onto the position area (figure 5-84). When you try this shot give yourself a target on the side rail to aim at (a piece of chalk will work).”' },
  { id: 'pp-v2-where', section: 'five-ball', type: 'WHERE', assist: 'ASSISTED', title: 'Five ball 2: the ideal angle on the 2', src: 'Page 77 · Figures 5-84 to 5-86', concept: 'Correct side of the pocket line', pattern: 'ht5-2',
    fig: 'f5-83', reveal: 'f5-86', purpose: 'QUESTION',
    prompt: 'Where is PKF’s ideal angle on the 2 ball?',
    choices: [['above', 'Well above the 2 ball pocket line'], ['below', 'Right below the 2 ball pocket line'], ['straight', 'Straight in on the 2 ball']], answer: 'below',
    explain: 'PKF: “The ideal angle on the 2 ball is right below the pocket line; the key to this shot is getting high action on the cue ball and making sure you have the correct angle on the 1 ball.” If you do end up above the 2 ball pocket line, practise using high action to force the cue ball off the end rail and back up for the correct angle on the 3 ball (figure 5-86).' },
  { id: 'pp-v2-learn', section: 'five-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Five ball 2: PKF solution', src: 'Pages 76–77 · Figures 5-82 to 5-87', concept: 'High action off the rail', pattern: 'ht5-2',
    fig: 'f5-84', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the second five ball pattern.',
    explain: 'PKF SOLUTION, worked backwards. 4 ball: bottom right corner. 3 ball: from the angle in figure 5-82 the cue ball travels to the 4 ball area with little effort. 2 ball: pocket it and roll forward (figure 5-83), from right below its pocket line. 1 ball: slight angle for the side pocket, high action off the side rail with a chalk target (figure 5-84); know which part of the pocket the 1 ball goes into; a ball on each side shrinks the pocket (figure 5-85). On the 4 ball, anywhere near the 4 ball pocket line is ideal; a little short and you may come off both side rails for the 5 (figure 5-87, A).' },
  { id: 'pp-v2-key', section: 'five-ball', type: 'RUN', assist: 'ASSISTED', title: 'Five ball 2: the 1 ball shot', src: 'Page 77 · Figures 5-84, 5-85', concept: 'Key shot drill', pattern: 'ht5-2',
    fig: 'f5-85', reveal: 'f5-84', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Keep practicing this shot until you can consistently end up in the position area for the 2 ball.”',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 76'), 'Slight angle on the 1 ball for the side pocket; chalk target on the side rail (figure 5-84).', 'Optional (PKF): place a ball on each side of the pocket to shrink it slightly (figure 5-85).'],
      shots: [{ label: '1 ball in the side pocket, high action → right below the 2 ball pocket line', pos: true }],
      objective: 'Pocket the 1 ball and end up in the position area for the 2 ball.' },
    explain: 'PKF: be aware of what part of the pocket the 1 ball is going into.' },
  { id: 'pp-v2-run', section: 'five-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run five ball pattern 2', src: 'Pages 76–77 · unnumbered layout, Figure 5-84', concept: 'Half table runout', pattern: 'ht5-2', plan: 'pp-v2-route',
    fig: 'fU95a', reveal: 'f5-84', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice trying to run this pattern out a few times the correct way.”',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 76'), STICKERS, ORIENT, 'Ball in hand: slight angle on the 1 ball for the side pocket, as in figure 5-84 (page 77).', HALF_RULE],
      shots: [
        { label: '1 ball in the side pocket, high action → right below the 2 ball pocket line (figure 5-84)', pos: true },
        { label: '2 ball, roll forward → the angle on the 3 ball (figure 5-83)', pos: true },
        { label: '3 ball in the corner → the 4 ball area (figure 5-82)', pos: true },
        { label: '4 ball in the bottom right corner → near the 4 ball pocket line for the 5 (figure 5-87)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 2 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: if your cue ball ends up anywhere near the 4 ball pocket line that would be ideal.' },
  // Pattern 3 (figure 5-88)
  { id: 'pp-v3-where', section: 'five-ball', type: 'WHERE', assist: 'INDEPENDENT', title: 'Five ball 3: position on the 2 ball', src: 'Page 78 · Figures 5-88, 5-91, 5-92', concept: 'Play for the bigger window', pattern: 'ht5-3',
    fig: 'f5-88', reveal: 'f5-91', purpose: 'QUESTION',
    prompt: 'Third five ball pattern (figure 5-88): pay close attention to where you need to be for the 2 ball and 4 ball. Where does PKF play position on the 2 ball?',
    choices: [['on', 'On, or just below, the 2 ball pocket line, then draw back to the side rail'], ['far', 'Well below the line'], ['above', 'Above the 2 ball pocket line, where the window is a little larger']], answer: 'above',
    explain: 'PKF: with the angle in figure 5-91 a sliding cue ball moves around the 5 ball to the side rail for the 3 ball. On or just below the line (figure 5-92) you can draw back, but “ending up too far below the pocket line will end the run” (red cue ball). “But, if we play position above the 2 ball pocket line, our window for position will be a little larger (figure 5-91).”' },
  { id: 'pp-v3-ways', section: 'five-ball', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Five ball 3: three ways from the 1 ball', src: 'Pages 78–79 · Figures 5-93 to 5-95', concept: 'Use a rail instead of perfect speed', pattern: 'ht5-3',
    fig: 'f5-91', reveal: 'f5-94', purpose: 'QUESTION',
    prompt: 'PKF shows three ways from the 1 ball to the position area above the 2 ball line. What is the benefit PKF gives for coming off the side rail with high action?',
    choices: [['angle', 'Once the cue ball hits the rail it travels along the correct angle for the 2 ball'], ['speed', 'It needs less speed than any other way'], ['spin', 'It lets you use sidespin']], answer: 'angle',
    explain: 'PKF: rolling forward into the bottom left corner (figure 5-93) risks underhitting and coming up short. Off the side rail (figure 5-94): “once the cue ball hits the rail it will be traveling along the correct angle for the 2 ball”; it needs high action and a target on the side rail. The third way: side pocket, draw back to the side rail and out, cue ball just below the 1 ball pocket line (figure 5-95). Coming off the rail gives a larger position window.' },
  { id: 'pp-v3-stun', section: 'five-ball', type: 'ACTION', assist: 'INDEPENDENT', title: 'Five ball 3: an inch or two forward', src: 'Pages 79–80 · Figures 5-89, 5-97', concept: 'Stun follow', pattern: 'ht5-3',
    fig: 'f5-89', reveal: 'f5-97', purpose: 'QUESTION',
    prompt: 'On or near the 3 ball pocket line, you need to pocket the 3 ball and roll forward only an inch or two. Which shot does PKF use?',
    choices: [['draw', 'A soft draw'], ['stun', 'A stun follow: the cue ball slides about 95% of the way, then starts to roll just before contact'], ['max', 'Maximum high, soft']], answer: 'stun',
    explain: 'PKF: “To perform this shot correctly we need to perform a stun follow shot… the cue ball is sliding about 95% of the way, then, right before contacting the object ball, it starts to roll forward. This little bit of roll is enough to move the cue ball forward an inch or two.” Strong players usually aim near center and use the speed of their stroke to control the amount of sliding (figure 5-97).' },
  { id: 'pp-v3-speed', section: 'five-ball', type: 'SPEED', assist: 'INDEPENDENT', title: 'Five ball 3: too much roll', src: 'Page 80 · Figure 5-97', concept: 'Stun follow', pattern: 'ht5-3',
    fig: 'f5-97', reveal: 'f5-97', purpose: 'QUESTION',
    prompt: 'Practising the stun follow, your cue ball has too much roll after contact. What does PKF tell you to change?',
    choices: [['up', 'Slightly increase your speed'], ['down', 'Slightly let up on your speed'], ['higher', 'Aim higher on the cue ball']], answer: 'up',
    explain: 'PKF: “The stun follow shot is speed sensitive… If your cue ball has too much roll after contact with the object ball, then you need to slightly increase your speed. If the cue ball stops then you need to slightly let up on your speed.”' },
  { id: 'pp-v3-learn', section: 'five-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Five ball 3: PKF solution', src: 'Pages 78–80 · Figures 5-88 to 5-97', concept: 'Play for the bigger window', pattern: 'ht5-3',
    fig: 'f5-96', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the third five ball pattern.',
    explain: 'PKF SOLUTION. 4 ball: top side pocket (the 3 ball is on the bottom side rail). 3 ball: top left corner, stun follow an inch or two (figures 5-89, 5-97). 4 ball: roll it in for the 5 (figure 5-90). 2 ball: from above its pocket line, a sliding cue ball goes around the 5 ball to the side rail (figures 5-91, 5-96); a sliding cue ball leaves at 90 degrees, and the angle it heads into the rail is similar to the angle it leaves. 1 ball: one of PKF’s three ways (figures 5-93 to 5-95); the rail gives the larger window.' },
  { id: 'pp-v3-drill', section: 'five-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Stun follow drill', src: 'Page 80 · Figure 5-97', concept: 'Stun follow', pattern: 'ht5-3',
    fig: 'f5-97', reveal: 'f5-89', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice this stun follow shot from various distances. The goal is to have the cue ball slightly roll forward a couple inches.”',
    physical: { kind: 'pattern',
      setup: ['Set up a stun follow like the 3 ball shot in figure 5-89 (page 78).', 'Aim near center and use the speed of your stroke to control the sliding (figure 5-97).', 'Change the distance between attempts or sessions.'],
      shots: [{ label: 'Object ball pocketed → cue ball rolls forward a couple of inches', pos: true }],
      objective: 'The cue ball slightly rolls forward a couple of inches.',
      gaps: ['Exact distances', 'Pocket (PKF’s example is the 3 ball in figure 5-89)'] },
    explain: 'PKF: too much roll, slightly increase your speed; if the cue ball stops, slightly let up.' },
  { id: 'pp-v3-run', section: 'five-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run five ball pattern 3', src: 'Pages 78–80 · Figures 5-88, 5-91', concept: 'Half table runout', pattern: 'ht5-3', plan: 'pp-v3-where',
    fig: 'f5-88', reveal: 'f5-94', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s third five ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('figure 5-88, page 78'), STICKERS, ORIENT, 'Ball in hand on the 1 ball, using one of PKF’s three ways (figures 5-93 to 5-95).', HALF_RULE],
      shots: [
        { label: '1 ball → above the 2 ball pocket line (figure 5-91)', pos: true },
        { label: '2 ball, sliding cue ball → around the 5 ball to the side rail for the 3 (figure 5-96)', pos: true },
        { label: '3 ball in the top left corner, stun follow → an inch or two forward (figure 5-89)', pos: true },
        { label: '4 ball in the top side pocket, rolled in → shape on the 5 (figure 5-90)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 1, 2 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: playing position to end up too far below the 2 ball pocket line will end the run.' },
  // Pattern 4 (unnumbered layout, page 80)
  { id: 'pp-v4-where', section: 'five-ball', type: 'WHERE', assist: 'INDEPENDENT', title: 'Five ball 4: the key shot', src: 'Page 80 · unnumbered layout, Figure 5-100', concept: 'Correct side of the pocket line', pattern: 'ht5-4',
    fig: 'fU99b', reveal: 'f5-100', purpose: 'QUESTION',
    prompt: 'Fourth five ball pattern: “a difficult layout that requires very precise angles and speed control.” The key shot is the 3 ball, next to the 5 ball, in the top right corner. Where must the cue ball be on the 3 ball?',
    choices: [['above', 'Above the 3 ball pocket line'], ['straight', 'Straight in, to stop the cue ball'], ['below', 'Just below the 3 ball pocket line, then maximum high']], answer: 'below',
    explain: 'PKF: “If we can end up just below the 3 ball pocket line (figure 5-100), we can use maximum high to pocket the 3 ball and get our position on the 4 ball. If the cue ball ends up above the 3 ball pocket line it’s going to be very difficult to get on the 4 ball.”' },
  { id: 'pp-v4-route', section: 'five-ball', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Five ball 4: from the 2 ball', src: 'Page 81 · Figure 5-101', concept: 'Use a rail instead of perfect speed', pattern: 'ht5-4',
    fig: 'f5-101', reveal: 'f5-101', purpose: 'QUESTION',
    prompt: 'On the 2 ball (figure 5-101), a sliding cue ball heads to the position area (A), but into an open area. What does PKF call slightly better?',
    choices: [['roll', 'A rolling cue ball, coming off the side rail: a little bigger window'], ['draw', 'A draw shot back to the position area'], ['slide', 'The sliding cue ball with a softer stroke']], answer: 'roll',
    explain: 'PKF: “Since we’re playing into an open area our speed has to be very precise. A slightly better option would be to use a rolling cue ball when pocketing the 2 ball and come off the side rail for position. This option gives us a little bigger window for position.”' },
  { id: 'pp-v4-learn', section: 'five-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Five ball 4: PKF solution', src: 'Pages 80–82 · Figures 5-100 to 5-106', concept: 'Correct side of the pocket line', pattern: 'ht5-4',
    fig: 'f5-102', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the fourth five ball pattern.',
    explain: 'PKF SOLUTION. 1 ball: top left corner, slight angle, sliding cue ball, cue ball fairly close (about two balls away) (figure 5-102); end near the 2 ball and cross the 2 ball pocket line. 2 ball: rolling cue ball off the side rail (figure 5-101). 3 ball: from just below its pocket line, maximum high, top right corner (figure 5-100); chalk where the 3 ball pocket line meets the rail and try to end just below it (figure 5-103). 4 ball: come off the other side rail to create the angle; a small angle, draw back for the 5 (figure 5-105); more angle, off the other side rail (figure 5-106), not a draw (danger of underhitting).' },
  { id: 'pp-v4-key', section: 'five-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Five ball 4: the 1 ball shot', src: 'Page 81 · Figures 5-102, 5-103', concept: 'Key shot drill', pattern: 'ht5-4',
    fig: 'f5-102', reveal: 'f5-103', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Sticker this shot up and shoot it over and over again until you develop a feel for it. Also, practice this shot from different distances.”',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 80'), 'Cue ball at a slight angle to the 1 ball, about two balls away (figure 5-102).', 'Mark the spot where the 3 ball pocket line meets the rail with chalk (figure 5-103).'],
      shots: [{ label: '1 ball in the top left corner, sliding cue ball → across the 2 ball pocket line, near the 2 ball', pos: true }],
      objective: 'End up in the correct position area for the 2 ball.' },
    explain: 'PKF: the correct angle lets you softly roll in the 2 ball and get shape for the 3 ball.' },
  { id: 'pp-v4-run', section: 'five-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run five ball pattern 4', src: 'Pages 80–82 · unnumbered layout, Figure 5-102', concept: 'Half table runout', pattern: 'ht5-4', plan: 'pp-v4-where',
    fig: 'fU99b', reveal: 'f5-102', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s fourth five ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 80'), STICKERS, ORIENT, 'Ball in hand: slight angle, about two balls from the 1 ball (figure 5-102).', HALF_RULE],
      shots: [
        { label: '1 ball in the top left corner, sliding → near the 2 ball, across its pocket line (figure 5-102)', pos: true },
        { label: '2 ball, rolling → off the side rail, just below the 3 ball pocket line (figures 5-101, 5-103)', pos: true },
        { label: '3 ball in the top right corner, maximum high → the 4 ball (figure 5-100)', pos: true },
        { label: '4 ball → draw back (small angle) or off the other side rail (figures 5-105, 5-106)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 2, 4 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: this is a difficult layout that requires very precise angles and speed control.' },
  // Pattern 5 (unnumbered layout, page 82)
  { id: 'pp-v5-solve', section: 'five-ball', type: 'SOLVE', assist: 'INDEPENDENT', title: 'Five ball 5: what sets up the pattern?', src: 'Page 82 · unnumbered layout, Figure 5-108', concept: 'Sliding cue ball path', pattern: 'ht5-5',
    fig: 'fU101a', reveal: 'f5-108', purpose: 'QUESTION',
    prompt: 'Final five ball pattern: it “relies heavily on the sliding cue ball path.” Study it. Which angle does PKF say sets up the whole pattern?',
    choices: [['two', 'A slight angle on the 2 ball, so a sliding cue ball gets position on the 3'], ['one', 'A big angle on the 1 ball'], ['four', 'Straight in on the 4 ball']], answer: 'two',
    explain: 'PKF: “If we end up with a slight angle on the 2 ball, we can use a sliding cue ball to get our position for the 3 ball. If we can end up above the 3 ball pocket line, we can use a sliding cue ball to play shape for the 4 ball (figure 5-108). Once we have the correct angle on the 2 ball it sets up the whole pattern for us.”' },
  { id: 'pp-v5-route', section: 'five-ball', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Five ball 5: the 3 ball to the 4', src: 'Page 83 · Figures 5-113, 5-114', concept: 'Use a rail instead of perfect speed', pattern: 'ht5-5',
    fig: 'f5-113', reveal: 'f5-114', purpose: 'QUESTION',
    prompt: 'The sliding cue ball path for the 3 ball in the side pocket heads toward the end rail near the 4 ball (figure 5-113). How does PKF play position on the 4 ball?',
    choices: [['slide', 'Slide into the highlighted area without touching the end rail'], ['rail', 'Off the end rail and back up, for a larger position window'], ['draw', 'Draw the cue ball back toward the side pocket']], answer: 'rail',
    explain: 'PKF: “we don’t want to just slide into this area without coming off the end rail since our speed control would have to be very precise; if we underhit the shot we’ll be left with a tough cut shot on the 4 ball (A). Instead, we’ll play the cue ball off the end rail and back up which gives us a larger position window (figure 5-114).” It almost ensures you won’t come up short or end up straight in on the 4 ball.' },
  { id: 'pp-v5-learn', section: 'five-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Five ball 5: PKF solution and problem shots', src: 'Pages 82–84 · Figures 5-108 to 5-115', concept: 'Find and remove problem shots', pattern: 'ht5-5',
    fig: 'f5-112', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the final five ball pattern, and PKF’s advice before the next chapter.',
    explain: 'PKF SOLUTION. 1 ball: either the bottom left corner drawing back (figure 5-109), excellent for a very precise draw stroke, or the bottom right corner at a slight angle, softly sliding into the position area (figure 5-110). 2 ball: slight angle, sliding cue ball; target where the 3 ball pocket line meets the rail so you end up above that line (figures 5-111, 5-112). 3 ball: side pocket, off the end rail and back up (figure 5-114). 4 ball: sliding cue ball straight up table for the 5 (figure 5-115); restricted to half a table, the speed has to be very good. PKF: keep working on half table patterns. If you miss position by quite a bit, sticker the shot up and shoot it over and over. In PKF’s 14 Days training they often find two or three problem shots in one five ball pattern; sometimes it takes fifty or a hundred tries. “Problem shots in your game will never go away — you have to find them and remove them.”' },
  { id: 'pp-v5-run', section: 'five-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Run five ball pattern 5', src: 'Pages 82–84 · unnumbered layout, Figure 5-110', concept: 'Half table runout', pattern: 'ht5-5', plan: 'pp-v5-solve',
    fig: 'fU101a', reveal: 'f5-110', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s final five ball pattern and run it.',
    physical: { kind: 'pattern', halfTable: true,
      setup: [IMG_SETUP('unnumbered layout, page 82'), STICKERS, ORIENT, 'Ball in hand on the 1 ball: PKF’s draw option (figure 5-109) or slide option (figure 5-110).', 'Chalk where the 3 ball pocket line meets the rail (figure 5-112).', HALF_RULE],
      shots: [
        { label: '1 ball → slight angle on the 2 ball (figure 5-109 or 5-110)', pos: true },
        { label: '2 ball, sliding → the rail target, above the 3 ball pocket line (figure 5-112)', pos: true },
        { label: '3 ball in the side pocket → off the end rail and back up for the 4 (figure 5-114)', pos: true },
        { label: '4 ball, sliding → straight up table for the 5 (figure 5-115)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order without the cue ball leaving its half of the table.',
      gaps: ['Pockets for the 2, 4 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: there is no better way to find your problem shots than through pattern play.' },

  // ================================================================ 4 · Wagon Wheel (page 84)
  { id: 'pp-ww-learn', section: 'wagon-wheel', type: 'LEARN', assist: 'GUIDED', title: 'The Wagon Wheel', src: 'Page 84 · Figures 5-116, 5-117', concept: 'Wagon Wheel drill', pattern: 'wagon',
    fig: 'f5-116', purpose: 'TEACHING',
    prompt: 'PKF: “Another good drill for controlling the cue ball without sidespin is The Wagon Wheel.”',
    explain: 'PKF: the object ball is in the middle of the table about a diamond away from the side pocket; the cue ball is at a slight angle to it (figure 5-116). Pocket the object ball in the side pocket and have the cue ball strike the balls along the rails. The first ball is in front of the first diamond next to the side pocket. After the cue ball hits it, respot the cue ball and object ball and attempt the ball in front of the second diamond, then the third, and so on. Keep track of how many strokes it takes to hit all of the balls. Then set the balls up the same way on the other side of the table (figure 5-117).' },
  { id: 'pp-ww-next', section: 'wagon-wheel', type: 'NEXT', assist: 'ASSISTED', title: 'Wagon Wheel: after the first target', src: 'Page 84 · Figure 5-116', concept: 'Wagon Wheel drill', pattern: 'wagon',
    fig: 'f5-116', reveal: 'f5-117', purpose: 'QUESTION',
    prompt: 'Your cue ball just hit the ball in front of the first diamond next to the side pocket. What’s next?',
    hint: 'The targets go in order along the rails.',
    choices: [['other', 'Move to the other side of the table'], ['respot', 'Respot the cue ball and object ball and attempt the ball in front of the second diamond'], ['again', 'Hit the first target again three times in a row']], answer: 'respot',
    explain: 'PKF: “After the cue ball hits this ball we respot the cue ball and object ball and attempt to hit the ball in front of the second diamond, then third diamond, and so on. Keep track of how many strokes it takes to hit all of the balls.” Once you work your way through, set the balls up the same way on the other side of the table (figure 5-117).' },
  { id: 'pp-ww-run', section: 'wagon-wheel', type: 'RUN', assist: 'ASSISTED', title: 'Wagon Wheel: one target', src: 'Page 84 · Figures 5-116, 5-117', concept: 'Wagon Wheel drill', pattern: 'wagon',
    fig: 'f5-116', reveal: 'f5-117', purpose: 'PHYSICAL SETUP',
    prompt: 'Set up PKF’s Wagon Wheel and work on your current target ball.',
    physical: { kind: 'pattern',
      setup: ['Object ball in the middle of the table, about a diamond from the side pocket; cue ball at a slight angle to it (figure 5-116).', 'Target balls along the rails as in figure 5-116; start with the ball in front of the first diamond next to the side pocket.', 'Center, center low or center high only (PKF: controlling the cue ball without sidespin).', 'Keep your own count of strokes, as PKF asks.'],
      shots: [{ label: 'Object ball in the side pocket → cue ball strikes the target ball', pos: true }],
      objective: 'Pocket the object ball in the side and hit the current target ball.',
      goal: 'Hit every target in order with as few strokes as possible, then repeat on the other side of the table.',
      gaps: ['A pass mark: PKF only says to count your strokes', 'Number of target balls (as in figure 5-116)'] },
    explain: 'PKF: keep track of how many strokes it takes to hit all of the balls, then work through the other side of the table.' },

  // ================================================================ 5 · Full Table: 8-Ball Layouts (pages 85–93)
  { id: 'pp-e-intro', section: 'eight-ball', type: 'LEARN', assist: 'GUIDED', title: 'Full table pattern play', src: 'Page 85 · Figure 6-1', concept: 'Full table pattern play', pattern: 'ft-intro',
    fig: 'f6-1', purpose: 'TEACHING',
    prompt: 'PKF begins full table pattern play with 8-Ball layouts.',
    explain: 'PKF: “Let’s begin full table pattern play. We’re going to go through a few 8-Ball layouts where you’ll have to figure out the best way to run the balls out. We’ll be starting with only one solid and the 8 ball; as we progress, more balls will be added to the layouts, and we’re still only using center, center low and center high.” First layout (figure 6-1): ball in hand on the 5 ball, next to the corner pocket. Pocket the 5 ball and get position on the 8 ball, without left or right spin.' },
  { id: 'pp-e1-route', section: 'eight-ball', type: 'ROUTE', assist: 'GUIDED', title: '6-1: ball in hand on the 5', src: 'Pages 85–86 · Figures 6-1, 6-2, unnumbered photo', concept: 'Cue ball close for a precise hit', pattern: 'ft-6-1',
    fig: 'f6-1', reveal: 'fU108a', purpose: 'QUESTION',
    prompt: 'Ball in hand on the 5 ball, next to the corner pocket (figure 6-1). Center ball only. Which option does PKF show?',
    hint: 'PKF places the cue ball much closer than most players do.',
    choices: [['middle', 'Cue ball near the middle of the table, send it to the other end'], ['close', 'Cue ball about a ball and a half from the 5, hit about ten percent of it, just above center, nice soft stroke: the cue ball hits between the first and second diamond of the far side rail']], answer: 'close',
    explain: 'PKF: many players place the cue ball near the middle of the table (figure 6-2), but then you have to be very precise in how much of the 5 ball you hit: too much and you follow path A, too thin and path B. “Since we have ball in hand let’s try this option: place the cue ball about a ball and a half away from the object ball. We’re going to be aiming to hit about ten percent of the object ball. If struck correctly, the cue ball should hit between the first and second diamond of the side rail at the other end of the table.” Nice soft stroke, just above center.' },
  { id: 'pp-e1-thin', section: 'eight-ball', type: 'PROBLEM', assist: 'GUIDED', title: '6-1: too thin', src: 'Page 86 · Figure 6-4', concept: 'Cue ball close for a precise hit', pattern: 'ft-6-1',
    fig: 'f6-4', reveal: 'f6-4', purpose: 'QUESTION',
    prompt: 'You hit the 5 ball too thin (figure 6-4). Where does the cue ball go?',
    choices: [['middle', 'Toward the middle of the table (B)'], ['high', 'Too high on the side rail (A)'], ['scratch', 'Into the corner pocket']], answer: 'high',
    explain: 'PKF: “If you hit the object ball too thin you’ll be hitting too high on the side rail (A), and hitting the object ball too thick will send the cue ball toward the middle of the table (B).” Players are usually hesitant to place the cue ball this close; a couple feet away makes the shot more difficult.' },
  { id: 'pp-e1-run', section: 'eight-ball', type: 'RUN', assist: 'GUIDED', title: '6-1: the 5 ball to the 8', src: 'Pages 85–86 · Figure 6-1, unnumbered photo', concept: 'Cue ball close for a precise hit', pattern: 'ft-6-1', plan: 'pp-e1-route',
    fig: 'f6-1', reveal: 'fU108a', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Once you practice this shot enough times hitting the right amount of the object ball will become routine.”',
    physical: { kind: 'pattern',
      setup: [IMG_SETUP('figure 6-1, page 85'), 'Ball in hand: cue ball about a ball and a half from the 5 ball (unnumbered photo, page 86).', 'Center, center low or center high only (no left or right spin).'],
      shots: [
        { label: '5 ball, about ten percent of it, just above center, soft → cue ball between the first and second diamond of the far side rail, position on the 8', pos: true },
        { label: '8 ball', pos: false }],
      objective: 'Pocket the 5 ball, get position, and pocket the 8 ball.',
      gaps: ['Pocket for the 8 ball (shown in PKF’s figures only)'] },
    explain: 'PKF: the success of this shot depends on hitting the proper amount of the object ball.' },
  { id: 'pp-e2-route', section: 'eight-ball', type: 'ROUTE', assist: 'ASSISTED', title: 'Last solid: the 3 ball to the 8', src: 'Pages 86–87 · unnumbered layout, Figures 6-6 to 6-8', concept: 'Sliding cue ball path as a reference', pattern: 'ft-3-8',
    fig: 'fU108b', reveal: 'f6-8', purpose: 'QUESTION',
    prompt: 'Ball in hand on your last solid, the 3 ball. PKF looks for “the type of shot that is easy to repeat over and over again.” What is PKF’s slightly better way than going two rails?',
    hint: 'Find where a sliding cue ball would go first.',
    choices: [['two', 'An angle on the 3 ball and two rails, aiming at a spot on the second rail'], ['slide', 'Shoot the 3 ball in the bottom right corner using the sliding cue ball path (toward the top right corner) as a reference: a little roll sends the cue ball to the side rail and easy position'], ['stop', 'Straight in, stop the cue ball']], answer: 'slide',
    explain: 'PKF: two rails with a target (figure 6-6) is common, and you must be specific about the rail because obstacle balls can be in the way (figure 6-7). “If we were to shoot the 3 ball in the bottom right corner pocket (figure 6-8), we can see that the sliding cue ball path will take the cue ball to the top right corner pocket.” With a little roll by the time it strikes the object ball, it hits the side rail and gets easy position on the 8 (A). Cue ball fairly close at an angle, a little above center. “By using the sliding cue ball path as a reference point, we can now start to put that cue ball anywhere we want.”' },
  { id: 'pp-e2-action', section: 'eight-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Last solid: obstacle balls', src: 'Page 87 · Figure 6-9', concept: 'Sliding cue ball path as a reference', pattern: 'ft-3-8',
    fig: 'f6-9', reveal: 'f6-9', purpose: 'QUESTION',
    prompt: 'Same shot, but two obstacle balls may interfere if the cue ball heads to the side rail (figure 6-9). What does PKF use?',
    choices: [['low', 'A small amount of low spin, pulling the cue ball away from the sliding path toward the end rail'], ['high', 'More high, to go around both balls'], ['side', 'Right spin off the side rail']], answer: 'low',
    explain: 'PKF: “By using the sliding cue ball path as a reference point, we know that a small amount of low spin will pull the cue ball away from the sliding cue ball path toward the end rail.”' },
  { id: 'pp-e2-drill', section: 'eight-ball', type: 'RUN', assist: 'ASSISTED', title: 'Blocker ball drill', src: 'Page 88 · Figure 6-10', concept: 'Sliding cue ball path as a reference', pattern: 'ft-3-8',
    fig: 'f6-10', reveal: 'f6-9', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “A good drill to get better at this type of shot is to place one ball near the side rail as in figure 6-10.”',
    physical: { kind: 'pattern',
      setup: ['Object ball and cue ball as in figure 6-10 (page 88).', 'One blocker ball near the side rail; PKF’s illustration shows three examples, but use only one blocker at a time.', 'Move the blocker to different spots along the side rail to challenge yourself.'],
      shots: [{ label: 'Object ball pocketed → cue ball goes around the blocker ball', pos: true }],
      objective: 'Pocket the object ball and send the cue ball around the obstacle ball.',
      gaps: ['Where the cue ball must finish beyond the blocker'] },
    explain: 'PKF: use the sliding cue ball path as your reference, then add a little roll or low spin to move the cue ball off it.' },
  { id: 'pp-e3-build', section: 'eight-ball', type: 'BUILD', assist: 'ASSISTED', title: 'Two solids: build the pattern', src: 'Pages 88–89 · unnumbered layout, Figures 6-12, 6-13', concept: 'Find the ball that gets you on the 8', pattern: 'ft-3-7-8',
    fig: 'fU110a', reveal: 'f6-13', purpose: 'QUESTION',
    prompt: 'Two solids (3 and 7) and the 8 ball. This pattern involves both a sliding and a rolling cue ball. Tap the balls in the order PKF runs them, then LOCK RUNOUT.',
    hint: 'Find the solid that gets you to the 8 ball most easily; that one is shot last.',
    choices: [['3', '3'], ['7', '7'], ['8', '8']], answer: '3-7-8',
    explain: 'PKF: “If we look at both solids the easiest way to get from one of these balls to the 8 ball is to end up here on the 7 ball (figure 6-12).” A nice soft rolling shot pockets the 7 ball and heads to the position area for the 8. Shooting the 3 ball in the lower right corner (figure 6-13), a sliding cue ball takes you directly to the position area for the 7 ball; place the cue ball fairly close.' },
  { id: 'pp-e3-action', section: 'eight-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Two solids: correct side of the 8', src: 'Pages 88–89 · Figure 6-14', concept: 'Sliding vs rolling cue ball', pattern: 'ft-3-7-8',
    fig: 'f6-14', reveal: 'f6-14', purpose: 'QUESTION',
    prompt: 'On the 7 ball (figure 6-14): which cue ball ends up on the correct side of the 8 ball?',
    choices: [['slide', 'A sliding cue ball (A)'], ['roll', 'A rolling cue ball (B)'], ['draw', 'A draw shot']], answer: 'roll',
    explain: 'PKF: “If the cue ball is sliding (A), it’s going to head toward the wrong side of the 8 ball. Since we know where the sliding cue ball path is, now we know if the cue ball is rolling it’s going to end up on the correct side of the 8 ball (B).”' },
  { id: 'pp-e3-angle', section: 'eight-ball', type: 'ROUTE', assist: 'ASSISTED', title: 'Two solids: angle and the rolling path', src: 'Page 89 · Figures 6-15, 6-16', concept: 'Angle changes the rolling path', pattern: 'ft-3-7-8',
    fig: 'f6-15', reveal: 'f6-16', purpose: 'QUESTION',
    prompt: 'With a rolling cue ball, how does the amount of angle on the object ball change the cue ball’s direction compared with the sliding cue ball path?',
    choices: [['more', 'More angle: closer to the sliding path. Less angle: farther away from it'], ['less', 'More angle: farther from the sliding path. Less angle: closer to it'], ['same', 'The angle makes no difference to a rolling cue ball']], answer: 'more',
    explain: 'PKF: “the more angle you have on the object ball, the closer to the sliding cue ball path the cue ball’s direction will be” (figure 6-15). “The less angle you have on the object ball, the more a rolling cue ball will take the cue ball away from the sliding cue ball path” (figure 6-16).' },
  { id: 'pp-e3-stun', section: 'eight-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Two solids: between rolling and sliding', src: 'Page 89 · Figure 6-17', concept: 'Stun follow', pattern: 'ft-3-7-8',
    fig: 'f6-17', reveal: 'f6-17', purpose: 'QUESTION',
    prompt: 'At this angle on the 7 ball (figure 6-17), a rolling cue ball heads toward the stripes (A) and a sliding cue ball ends up on the wrong side of the 8 (C). What does PKF use for B?',
    choices: [['stun', 'A stun follow shot, just above center, firm stroke'], ['draw', 'A soft draw'], ['max', 'Maximum high, soft']], answer: 'stun',
    explain: 'PKF: “if the player uses a stun follow shot, he can force the cue ball to the correct side of the 8 ball (B). He’ll be shooting this shot just above center with a firm stroke.”' },
  { id: 'pp-e3-learn', section: 'eight-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Two solids: PKF solution', src: 'Pages 88–89 · Figures 6-12 to 6-17', concept: 'Find the ball that gets you on the 8', pattern: 'ft-3-7-8',
    fig: 'f6-12', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: 3 → 7 → 8.',
    explain: 'PKF SOLUTION. 3 ball: lower right corner, cue ball fairly close, sliding cue ball directly to the position area for the 7 ball (figure 6-13). 7 ball: soft rolling shot to the correct side of the 8 ball (figures 6-12, 6-14). More angle on the 7 = closer to the sliding path; less angle = farther away (figures 6-15, 6-16). At the figure 6-17 angle, stun follow just above center with a firm stroke. 8 ball last.' },
  { id: 'pp-e3-run', section: 'eight-ball', type: 'RUN', assist: 'ASSISTED', title: 'Run 3 → 7 → 8', src: 'Pages 88–89 · unnumbered layout, Figure 6-13', concept: 'Full table runout', pattern: 'ft-3-7-8', plan: 'pp-e3-build',
    fig: 'fU110a', reveal: 'f6-13', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: find the pattern that will be easy to repeat over and over again. Run it in PKF’s order.',
    physical: { kind: 'pattern', sequence: true,
      setup: [IMG_SETUP('unnumbered layout, page 88'), 'Ball in hand: cue ball fairly close to the 3 ball, as in figure 6-13 (page 88).', 'Center, center low or center high only. Shooting the balls in a different order counts as WRONG SEQUENCE.'],
      shots: [
        { label: '3 ball in the lower right corner, sliding → the position area for the 7 ball (figure 6-13)', pos: true },
        { label: '7 ball, soft rolling → the correct side of the 8 ball (figures 6-12, 6-14)', pos: true },
        { label: '8 ball', pos: false }],
      objective: 'Run 3, 7, 8 in PKF’s order.',
      gaps: ['Pockets for the 7 and 8 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: when you practise the 3 ball shot, place the cue ball fairly close to it; it won’t take much of a stroke.' },
  { id: 'pp-e4-seq', section: 'eight-ball', type: 'SEQUENCE', assist: 'ASSISTED', title: 'Two solids, 8 in the top left', src: 'Pages 89–91 · unnumbered layout, Figures 6-19, 6-23', concept: 'More than one runout', pattern: 'ft-5-2-8',
    fig: 'fU111a', reveal: 'f6-23', purpose: 'QUESTION',
    prompt: 'Two solids (5 and 2) and the 8 ball for the top left corner. Which statement matches what PKF shows?',
    choices: [['five', 'Only 5 then 2 works'], ['two', 'Only 2 then 5 works'], ['both', 'PKF shows more than one way: 5 then 2 (figure 6-19), and 2 then 5 (figure 6-23)']], answer: 'both',
    explain: 'PKF: “In this layout there are a few different ways to get position on the 8 ball for the top left corner pocket.” Way one: slight angle on the 5 ball for the bottom left corner, high action off the side rail to just below the 2 ball pocket line, then draw the 2 back to the side rail (figures 6-19, 6-20). Way two: end up at the figure 6-23 angle on the 5 ball, so the cue ball naturally heads to the 8 ball area, getting there from the 2 ball with high action (figure 6-24).' },
  { id: 'pp-e4-danger', section: 'eight-ball', type: 'PROBLEM', assist: 'ASSISTED', title: 'Two solids: crossing the 2 ball line', src: 'Page 90 · Figure 6-21', concept: 'Danger areas', pattern: 'ft-5-2-8',
    fig: 'f6-21', reveal: 'f6-21', purpose: 'QUESTION',
    prompt: 'Playing 5 then 2, PKF shows two danger areas (figure 6-21). What happens if you cross the 2 ball pocket line (B)?',
    choices: [['force', 'You have to force the cue ball to the other end rail and back up for the 8'], ['draw', 'It’s harder to draw because you’re on the rail'], ['fine', 'Nothing: any angle on the 2 works']], answer: 'force',
    explain: 'PKF: first danger, ending up too close to the rail after the 5 ball (A): much more difficult to get draw on the cue ball. “The other danger is crossing the 2 ball pocket line (B). Now you’re going to have to force the cue ball to the other end rail and back up for position on the 8 ball.” Too far below the line (figure 6-22): a sliding cue ball heads to the end rail near the 8 (A), so use low spin to pull it back a bit (B).' },
  { id: 'pp-e4-stun', section: 'eight-ball', type: 'ACTION', assist: 'ASSISTED', title: 'Two solids: short of the 5 ball line', src: 'Page 91 · Figures 6-25, 6-26', concept: 'Stun follow', pattern: 'ft-5-2-8',
    fig: 'f6-26', reveal: 'f6-26', purpose: 'QUESTION',
    prompt: 'Playing 2 then 5, you ended above the 5 ball line, so a rolling cue ball heads toward the side pocket area, and a sliding cue ball hits too high on the side rail (figure 6-26, A). What does PKF use (B)?',
    choices: [['low', 'Low spin to pull it back'], ['stun', 'A stun follow, aiming above center with a firm stroke'], ['soft', 'A softer rolling shot']], answer: 'stun',
    explain: 'PKF: “Since we need to hit lower on the rail we’ll use a stun follow shot (B); we’ll be aiming above center using a firm stroke.” Chalk where the 5 ball line meets the rail: on or near it is the ideal angle to go two rails for the 8, an angle strong players prefer because it lets them shoot softly.' },
  { id: 'pp-e4-learn', section: 'eight-ball', type: 'LEARN', assist: 'ASSISTED', title: 'Two solids: PKF’s two ways', src: 'Pages 89–91 · Figures 6-19 to 6-26', concept: 'More than one runout', pattern: 'ft-5-2-8',
    fig: 'f6-24', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: two ways to run 5 and 2, then the 8 in the top left corner.',
    explain: 'PKF SOLUTION, way one: slight angle on the 5 ball for the bottom left corner, high action off the side rail to just below the 2 ball pocket line (figure 6-19); draw the 2 back to the side rail (figure 6-20). Dangers: too close to the rail (A) or crossing the 2 ball line (B) (figure 6-21). Way two: the figure 6-23 angle on the 5 ball; from the 2 ball, high action toward that area (figure 6-24), chalk where the 5 ball line meets the rail. Short of the line: stun follow above center, firm (figures 6-25, 6-26).' },
  { id: 'pp-e5-first', section: 'eight-ball', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Three solids: first concern', src: 'Page 91 · unnumbered layout', concept: 'Find the ball that gets you on the 8', pattern: 'ft-2-3-1-8',
    fig: 'fU113a', reveal: 'f6-28', purpose: 'QUESTION',
    prompt: 'Three solids; the 8 ball is at the other end and blocked from the bottom left corner, so it goes in the top left corner. When a strong player studies a layout like this, what is their first concern?',
    choices: [['easy', 'Pocketing the easiest solid first'], ['key', 'Finding the solid that will give them position on the 8 ball'], ['break', 'Breaking out the 8 ball']], answer: 'key',
    explain: 'PKF: “When a strong player studies an 8-Ball layout like this, their first concern is finding the solid that will give them position on the 8 ball.” Here, the 1 ball in the side pocket (figure 6-28).' },
  { id: 'pp-e5-action', section: 'eight-ball', type: 'ACTION', assist: 'INDEPENDENT', title: 'Three solids: the 1 ball to the 8', src: 'Pages 91–92 · Figure 6-28', concept: 'Sliding cue ball path as a reference', pattern: 'ft-2-3-1-8',
    fig: 'f6-28', reveal: 'f6-28', purpose: 'QUESTION',
    prompt: 'Shooting the 1 ball in the side, a sliding cue ball heads toward a small area by the 8 ball (A), and you may end up behind the 11 ball. What does PKF use instead (B)?',
    choices: [['high', 'High action to the end rail'], ['draw', 'A little draw, pulling the cue ball to the side rail near the second diamond'], ['slide', 'A softer sliding cue ball']], answer: 'draw',
    explain: 'PKF: “if we use a little draw when we shoot the 1 ball (B), we can pull the cue ball to the side rail near the second diamond. Once the cue ball hits the rail it’s going to be traveling along our position path for the 8 ball.”' },
  { id: 'pp-e5-build', section: 'eight-ball', type: 'BUILD', assist: 'INDEPENDENT', title: 'Three solids: build the pattern', src: 'Pages 92–93 · Figures 6-30 to 6-33', concept: 'Pick a pattern that is easy to repeat', pattern: 'ft-2-3-1-8',
    fig: 'fU113a', reveal: 'f6-32', purpose: 'QUESTION',
    prompt: 'The 1 ball is the solid that gets you on the 8. Now build PKF’s whole runout: tap the balls in order, then LOCK RUNOUT.',
    choices: [['1', '1'], ['2', '2'], ['3', '3'], ['8', '8']], answer: '2-3-1-8',
    explain: 'PKF: some players shoot the 2 in the side and draw back for an angle on the 3, then come off the side rail for the 1 (figure 6-29); underhit and they may end up on the wrong side of the 1 ball pocket line (A). PKF: shoot the 2 ball in the side pocket using high action to the position area for the 3 ball (figure 6-30): coming off the rail ensures the correct side of the 3, and it’s easier to reach than rolling forward (figure 6-31, mechanical bridge). 3 ball: high action to the end rail toward the position area for the 1 ball (figure 6-32); even underhit (A) keeps the correct angle. 1 ball: draw toward the second diamond on the side rail (figure 6-33). Then the 8.' },
  { id: 'pp-e5-learn', section: 'eight-ball', type: 'LEARN', assist: 'INDEPENDENT', title: 'Three solids: PKF solution', src: 'Pages 91–93 · Figures 6-28 to 6-34', concept: 'Pick a pattern that is easy to repeat', pattern: 'ft-2-3-1-8',
    fig: 'f6-30', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: 2 → 3 → 1 → 8.',
    explain: 'PKF SOLUTION. First find the solid that gives position on the 8: the 1 ball in the side with a little draw to the side rail near the second diamond (figure 6-28). 2 ball: side pocket, high action off the rail to the position area for the 3 (figure 6-30). 3 ball: high action to the end rail toward the 1 ball area (figure 6-32). 1 ball: some draw by the time the cue ball reaches it (figure 6-33). 8 ball: top left corner. If you struggle with the 1 ball shot, move the cue ball closer to the object ball until it starts to become easier (figure 6-34), then farther away.' },
  { id: 'pp-e5-drill', section: 'eight-ball', type: 'RUN', assist: 'INDEPENDENT', title: 'Draw to the second diamond', src: 'Page 93 · Figures 6-33, 6-34', concept: 'Key shot drill', pattern: 'ft-2-3-1-8',
    fig: 'f6-34', reveal: 'f6-33', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “If you struggle with this shot, try moving the cue ball fairly close to the object ball until the shot starts to become easier for you.”',
    physical: { kind: 'pattern',
      setup: [IMG_SETUP('unnumbered layout, page 91'), 'Cue ball fairly close to the 1 ball (figure 6-34); as you get more consistent, move it farther away.'],
      shots: [{ label: '1 ball in the side pocket, draw → side rail near the second diamond', pos: true }],
      objective: 'Pocket the 1 ball and hit near the second diamond on the side rail.' },
    explain: 'PKF: your goal should be to hit near the second diamond on the side rail.' },

  // ================================================================ 6 · Full Table: Balls in Order (pages 93–107)
  { id: 'pp-o1-route', section: 'balls-in-order', type: 'ROUTE', assist: 'GUIDED', title: '3 balls in order: the 1 ball', src: 'Pages 93–94 · unnumbered layout, Figures 6-36 to 6-38', concept: 'Use a rail instead of perfect speed', pattern: 'ft-o3',
    fig: 'fU115a', reveal: 'f6-38', purpose: 'QUESTION',
    prompt: 'Ball in hand, balls in order. PKF: “I want you to see how virtually every shot relies on the sliding cue ball path.” The key is the ideal angle on the 2 ball (figure 6-36). How does PKF get there from the 1 ball?',
    hint: 'Rolling into the area without a rail needs very exact speed.',
    choices: [['roll', 'Just roll the cue ball into the position area'], ['high', 'High action off the side rail into the position area, with a chalk target on the rail']], answer: 'high',
    explain: 'PKF: rolling into the area (figure 6-37) needs very exact speed; a bit too much and the cue ball could overrun the area (A). “Instead, we’re going to use high action to have the cue ball come off the side rail and end up in our position area (figure 6-38). By playing the shot this way our margin for error is much greater.” The key: the correct angle on the 1 ball and high action.' },
  { id: 'pp-o1-action', section: 'balls-in-order', type: 'ACTION', assist: 'GUIDED', title: '3 balls in order: the 2 ball', src: 'Page 94 · Figure 6-39', concept: 'Sliding cue ball', pattern: 'ft-o3',
    fig: 'f6-36', reveal: 'f6-39', purpose: 'QUESTION',
    prompt: 'You’re at the ideal angle on the 2 ball. What does PKF make sure of to reach the 3 ball position area (A)?',
    choices: [['slide', 'That the cue ball is sliding when it strikes the 2 ball'], ['roll', 'That the cue ball is rolling'], ['side', 'That you use a little sidespin']], answer: 'slide',
    explain: 'PKF: “it’s just a matter of making sure the cue ball is sliding once it strikes the 2 ball, and we’ll end up in our position area for the 3 ball (A).” You can also draw to the side rail and toward the end rail (B), but be very precise about where you strike the side rail: simply drawing back to the rail isn’t the goal; precise cue ball control is.' },
  { id: 'pp-o1-learn', section: 'balls-in-order', type: 'LEARN', assist: 'GUIDED', title: '3 balls in order: PKF solution', src: 'Pages 93–94 · Figures 6-36 to 6-39', concept: 'Sliding cue ball path', pattern: 'ft-o3',
    fig: 'f6-38', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the three ball layout in order.',
    explain: 'PKF SOLUTION. 1 ball: correct angle, high action off the side rail to the chalk target and into the position area for the 2 ball (figure 6-38). 2 ball: sliding cue ball to the 3 ball area (A), or low spin to the side rail toward the end rail (B), precise about the rail contact (figure 6-39). 3 ball last.' },
  { id: 'pp-o1-key', section: 'balls-in-order', type: 'RUN', assist: 'GUIDED', title: '3 balls in order: the 1 ball shot', src: 'Page 94 · Figure 6-38', concept: 'Key shot drill', pattern: 'ft-o3',
    fig: 'fU115a', reveal: 'f6-38', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “When practicing this shot place a piece of chalk on the rail to use as a target… Keep practicing this shot until you can consistently land in the correct area for the 2 ball.”',
    physical: { kind: 'pattern',
      setup: [IMG_SETUP('unnumbered layout, page 93'), 'Ball in hand: angle on the 1 ball as in figure 6-38 (page 94).', 'Chalk target on the side rail.'],
      shots: [{ label: '1 ball, high action → off the side rail to the target, into the area for the 2 ball', pos: true }],
      objective: 'Pocket the 1 ball and land in the correct area for the 2 ball.',
      gaps: ['Pocket for the 1 ball (shown in PKF’s figure only)'] },
    explain: 'PKF: the high action drives the cue ball toward the spot on the rail.' },
  { id: 'pp-o2-rule', section: 'balls-in-order', type: 'ROUTE', assist: 'GUIDED', title: '4 balls in order: end to end', src: 'Page 95 · unnumbered layout, Figures 6-42, 6-43', concept: 'Study the sliding path first', pattern: 'ft-o4',
    fig: 'fU117a', reveal: 'f6-43', purpose: 'QUESTION',
    prompt: 'The key shot is the proper angle on the 2 ball from the 1 ball, from one end of the table to the other. What does PKF say to always study first in that situation?',
    choices: [['side', 'Which sidespin to use'], ['speed', 'The speed of the shot'], ['slide', 'The sliding cue ball path for the first ball']], answer: 'slide',
    explain: 'PKF: “Whenever you have to go from one end of the table to the other end, as in this case with the 1 to the 2 ball, always study the sliding cue ball path for the first ball.” Shooting the 1 ball in the top left corner, a sliding cue ball travels toward the corner pocket (A); strike a little above center for enough roll to go to the side rail and down to the 2 ball area (B), the way most strong players would choose (figure 6-43). Off the side rail the other way (figure 6-42) leaves A, B or D difficult and C unnatural.' },
  { id: 'pp-o2-where', section: 'balls-in-order', type: 'WHERE', assist: 'ASSISTED', title: '4 balls in order: the 3 ball area', src: 'Pages 95–96 · Figures 6-41, 6-44 to 6-46', concept: 'Middle of the position area', pattern: 'ft-o4',
    fig: 'f6-41', reveal: 'f6-46', purpose: 'QUESTION',
    prompt: 'From near the end rail you softly roll in the 2 ball. Where in the 3 ball position area does PKF try to end up, and why?',
    choices: [['edge', 'At the near edge, to keep the shot short'], ['middle', 'In the middle of the area, so a slight underhit or overhit is still fine'], ['far', 'At the far edge, for more angle']], answer: 'middle',
    explain: 'PKF: “We’re trying to end up in the middle of this position area, that way if we slightly underhit or slightly overhit the shot we should still be fine” (figure 6-46). Then a nice soft rolling cue ball on the 3 ball for the 4 (figure 6-47). On the 1 ball, the cue ball just above the 1 ball line (figure 6-44); end near the end rail, below the 2 ball line (figure 6-45).' },
  { id: 'pp-o2-problem', section: 'balls-in-order', type: 'PROBLEM', assist: 'ASSISTED', title: '4 balls in order: too close to the 3 ball line', src: 'Pages 96–97 · Figures 6-48 to 6-50', concept: 'Sliding vs rolling cue ball', pattern: 'ft-o4',
    fig: 'f6-50', reveal: 'f6-50', purpose: 'QUESTION',
    prompt: 'You ended up too close to the 3 ball pocket line (figure 6-50), so a rolling cue ball no longer works. What two options does PKF give for the 4 ball?',
    choices: [['draw', 'Draw back (A) or stop (B)'], ['spin', 'Left spin (A) or right spin (B)'], ['two', 'High action forcing the cue ball to the side rail (A), or a stun follow a little above center with a firm stroke (B)']], answer: 'two',
    explain: 'PKF: “The first option is to use high action and force the cue ball to the side rail (A). The second option is to use a stun follow shot striking the cue ball a little above center with a firm stroke (B).” Above the 2 ball line it’s similar: a rolling cue ball misses the area (figure 6-48), a sliding one hits the side rail too high (figure 6-49, A); a stun follow reaches the rail sooner.' },
  { id: 'pp-o2-learn', section: 'balls-in-order', type: 'LEARN', assist: 'ASSISTED', title: '4 balls in order: PKF solution', src: 'Pages 95–97 · Figures 6-41 to 6-50', concept: 'Study the sliding path first', pattern: 'ft-o4',
    fig: 'f6-43', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the four ball layout in order. Visualize the pocket lines for each ball.',
    explain: 'PKF SOLUTION. 1 ball: top left corner, cue ball just above the 1 ball line (figure 6-44), a little above center so the cue ball goes off the side rail and down near the end rail, below the 2 ball line (figures 6-43, 6-45). 2 ball: softly roll it in to the middle of the 3 ball area (figure 6-46). 3 ball: soft rolling cue ball for the 4 (figure 6-47). Off target: stun follow or high action (figures 6-49, 6-50).' },
  { id: 'pp-o2-key', section: 'balls-in-order', type: 'RUN', assist: 'ASSISTED', title: '4 balls in order: the 1 ball shot', src: 'Page 96 · Figures 6-44, 6-45', concept: 'Key shot drill', pattern: 'ft-o4',
    fig: 'f6-44', reveal: 'f6-45', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice this shot until you can consistently hit your target on the side rail and end up near the end rail.”',
    physical: { kind: 'pattern',
      setup: [IMG_SETUP('unnumbered layout, page 95'), 'Ball in hand: cue ball just above the 1 ball line (figure 6-44).', 'Pick a target on the side rail.'],
      shots: [{ label: '1 ball in the top left corner, a little above center → side rail target, near the end rail, below the 2 ball line', pos: true }],
      objective: 'Hit your side rail target and end up near the end rail, below the 2 ball line.' },
    explain: 'PKF: at the correct angle it won’t take much of a stroke to pocket the ball and end up in the position area.' },
  { id: 'pp-o3-where', section: 'balls-in-order', type: 'WHERE', assist: 'ASSISTED', title: '5 balls in order: the 4 ball near a pocket', src: 'Pages 97–98 · unnumbered layout, Figures 6-53, 6-54', concept: 'Angles on a ball near a pocket', pattern: 'ft-o5',
    fig: 'fU119a', reveal: 'f6-53', purpose: 'QUESTION',
    prompt: 'Five balls in order; the 3 ball only goes in one corner. The 4 ball is close to a pocket, but you still need the proper angle on it. Where does PKF call the ideal position on the 4 ball?',
    choices: [['middle', 'Near the middle of the table'], ['rail', 'Near the end rail: roll it in and travel two rails for the 5 ball'], ['straight', 'Straight in, to stop the cue ball']], answer: 'rail',
    explain: 'PKF: from near the end rail, “it wouldn’t take much effort just to roll the 4 ball in and travel two rails for position on the 5 ball (figure 6-53).” From the middle of the table (figure 6-54) it’s a little more difficult to predict the exact path; a slight overcut sends the cue ball toward the corner pocket area (B). “The ideal position on the 4 ball would be near the end rail.”' },
  { id: 'pp-o3-stun', section: 'balls-in-order', type: 'ACTION', assist: 'ASSISTED', title: '5 balls in order: short on the 2 ball', src: 'Pages 98–99 · Figures 6-58, 6-59', concept: 'Stun follow', pattern: 'ft-o5',
    fig: 'f6-58', reveal: 'f6-59', purpose: 'QUESTION',
    prompt: 'You came up short of the ideal position on the 2 ball, so a rolling cue ball hits too high on the second rail (figure 6-58), and a sliding cue ball heads to the side pocket. What does PKF use?',
    choices: [['draw', 'Draw, a soft stroke'], ['stun', 'A stun follow, a little above center with a firm stroke, reaching the side rail before the side pocket'], ['roll', 'A softer rolling shot']], answer: 'stun',
    explain: 'PKF: “In figure 6-59 we see that a sliding cue ball is going to head to the side pocket (A). But, if we use a stun follow shot, we can force the cue ball to the side rail before the side pocket and have it head to our position area for the 3 ball (B). We’ll be shooting the cue ball a little above center with a firm stroke.”' },
  { id: 'pp-o3-lower', section: 'balls-in-order', type: 'ACTION', assist: 'INDEPENDENT', title: '5 balls in order: less angle on the 3', src: 'Page 99 · Figures 6-60, 6-61', concept: 'Sliding before rolling', pattern: 'ft-o5',
    fig: 'f6-61', reveal: 'f6-61', purpose: 'QUESTION',
    prompt: 'You ended up with a less than ideal angle on the 3 ball (figure 6-61): a rolling cue ball heads more toward the corner pocket (A). How does PKF change the hit?',
    choices: [['higher', 'Aim higher for more roll'], ['side', 'Add right spin'], ['lower', 'Aim lower, around center, so the cue ball slides before rolling and heads toward the end rail (B)']], answer: 'lower',
    explain: 'PKF: “This time when we shoot this shot we’ll aim lower on the cue ball, around center. This will cause the cue ball to slide before rolling which will limit the amount of roll on the cue ball when it strikes the 3 ball; now the cue ball heads toward the end rail (B).” At the ideal angle (figure 6-60), with the object ball near a rail, more angle means the cue ball comes off the rail closer to 90 degrees, almost straight back.' },
  { id: 'pp-o3-learn', section: 'balls-in-order', type: 'LEARN', assist: 'INDEPENDENT', title: '5 balls in order: PKF solution', src: 'Pages 97–100 · Figures 6-52 to 6-63', concept: 'Angles on a ball near a pocket', pattern: 'ft-o5',
    fig: 'f6-57', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the five ball layout in order. Key shot: the proper angle on the 2 ball for the 3.',
    explain: 'PKF SOLUTION. 1 ball: side pocket, high action to the side rail into the position area (figure 6-57); the goal is on or very close to the 2 ball line (the figure 6-56 route is hard to control). 2 ball: roll it in, two rails for the 3 (figure 6-55); short, stun follow (figure 6-59). 3 ball (only one corner): from the figure 6-60 angle, almost straight back to the other end rail; less angle, aim around center (figure 6-61). 4 ball: below the 4 ball line roll it in to the other end; too close to or above the line, sliding cue ball, leaving the first rail toward the second diamond of the second rail (figures 6-62, 6-63). PKF: “Practice this layout until you can successfully run it out a few times.”' },
  { id: 'pp-o3-run', section: 'balls-in-order', type: 'RUN', assist: 'INDEPENDENT', title: 'Run the five ball layout', src: 'Pages 97–100 · unnumbered layout, Figure 6-57', concept: 'Full table runout', pattern: 'ft-o5', plan: 'pp-o3-where',
    fig: 'fU119a', reveal: 'f6-57', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “Practice this layout until you can successfully run it out a few times. If you struggle at any of these shots, sticker them up and shoot them over and over again.”',
    physical: { kind: 'pattern',
      setup: [IMG_SETUP('unnumbered layout, page 97'), STICKERS, ORIENT, 'Ball in hand: place the cue ball for the 1 ball as in figure 6-57 (page 98).'],
      shots: [
        { label: '1 ball in the side, high action → on or very close to the 2 ball line (figure 6-57)', pos: true },
        { label: '2 ball, rolled in → two rails for the 3 ball (figure 6-55)', pos: true },
        { label: '3 ball → back toward the other end rail for the 4 (figure 6-60)', pos: true },
        { label: '4 ball → two rails for the 5 (figures 6-53, 6-63)', pos: true },
        { label: '5 ball', pos: false }],
      objective: 'Run the five balls in order.',
      gaps: ['Pockets for the 2, 3, 4 and 5 balls (shown in PKF’s figures only)'] },
    explain: 'PKF: this pattern emphasizes how important it is to be aware of your angles, especially with a ball near a pocket like the 4 ball.' },
  { id: 'pp-o4-problem', section: 'balls-in-order', type: 'PROBLEM', assist: 'INDEPENDENT', title: '6 balls in order: the problem area', src: 'Page 100 · unnumbered layout, Figure 6-65', concept: 'Find the problem ball', pattern: 'ft-o6',
    fig: 'fU122a', reveal: 'f6-65', purpose: 'QUESTION',
    prompt: 'Six balls in order: “another pattern that relies heavily on proper angles.” Before you shoot the 1 ball, which problem area does PKF look at?',
    choices: [['one', 'The 1 ball, for the break-out'], ['five', 'The 5 ball, top right corner pocket: you have to end up in its highlighted position area'], ['six', 'The 6 ball, frozen on the rail']], answer: 'five',
    explain: 'PKF: “Before we shoot the 1 ball we need to look at the problem area which is the 5 ball (figure 6-65). We’re going to shoot the 5 ball in the top right corner pocket, so that means we’ll have to end up in this area for position (highlighted area).” The key shot is getting from the 4 ball to the 5 ball.' },
  { id: 'pp-o4-action', section: 'balls-in-order', type: 'ACTION', assist: 'INDEPENDENT', title: '6 balls in order: a larger window on the 4', src: 'Page 100 · Figures 6-66, 6-75', concept: 'Low spin widens the window', pattern: 'ft-o6',
    fig: 'f6-66', reveal: 'f6-75', purpose: 'QUESTION',
    prompt: 'The 4 ball in the side: the sliding cue ball path heads to the position area for the 5 ball (A, figure 6-66). What does PKF add, and why?',
    choices: [['high', 'High action, for more speed'], ['right', 'Right spin, to bend the path'], ['low', 'A little low spin to pull the cue ball toward the side rail (B), for a larger position window']], answer: 'low',
    explain: 'PKF: “When we shoot the 4 ball, we want to make sure we use a little low spin to pull the cue ball toward the side rail (B), this will give us a little larger position window for the 5 ball.” Sliding exactly to the ideal spot (figure 6-74, B) needs very exact speed; a little too easy (A) or too hard (C) leaves a tough shot. Play position for the 4 ball below the 4 ball pocket line.' },
  { id: 'pp-o4-next', section: 'balls-in-order', type: 'NEXT', assist: 'INDEPENDENT', title: '6 balls in order: straight in on the 5', src: 'Page 103 · Figures 6-76 to 6-78', concept: 'Don’t leave yourself too close', pattern: 'ft-o6',
    fig: 'f6-76', reveal: 'f6-78', purpose: 'QUESTION',
    prompt: 'Below the 5 ball pocket line PKF follows to the side rail and back out (figure 6-76). But you ended up straight in on the 5 ball, with the 6 ball close by. What’s next, according to PKF?',
    choices: [['stop', 'A stop shot'], ['draw', 'Draw back to the side rail and out toward the middle of the table'], ['follow', 'Follow two rails']], answer: 'draw',
    explain: 'PKF: if you end up straight in on the 5 ball, don’t play a stop shot for the 6 ball, which is so close to the 5. “The better option is to draw the cue ball back to the side rail and out toward the middle of the table (figure 6-78).” With a little more angle, go around the table (figure 6-77).' },
  { id: 'pp-o4-learn', section: 'balls-in-order', type: 'LEARN', assist: 'INDEPENDENT', title: '6 balls in order: PKF solution', src: 'Pages 100–103 · Figures 6-65 to 6-78', concept: 'Roll it in, or use the sliding path', pattern: 'ft-o6',
    fig: 'f6-69', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the six ball layout in order.',
    explain: 'PKF SOLUTION. 1 ball: roll it in the corner and come off the other side rail to near the 2 ball line, with a rail target and no left or right spin (figure 6-69); coming off the side rail above the 2 ball (figure 6-68) risks the 4 ball or the side pocket. 2 ball: roll it in to the 3 ball area (figure 6-70); above the 2 ball line, stun follow (figures 6-71, 6-72). 3 ball: roll it in, off the end rail for the 4 (figures 6-67, 6-73). 4 ball: side pocket, a little low spin toward the side rail (figures 6-66, 6-75). 5 ball: top right corner; below its line high action, more angle around the table, straight in draw to the side rail and out (figures 6-76 to 6-78). PKF: “The goal of any pattern is to play position on object balls where you can roll the ball in and your cue ball will naturally head in the proper direction… When you can’t roll the ball in for position, then you have to be good at seeing the sliding cue ball path and knowing how to use that path as a reference point.”' },
  { id: 'pp-o4-key', section: 'balls-in-order', type: 'RUN', assist: 'INDEPENDENT', title: '6 balls in order: the 4 ball shot', src: 'Page 102 · Figure 6-75', concept: 'Low spin widens the window', pattern: 'ft-o6',
    fig: 'f6-75', reveal: 'f6-74', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “When you practice this shot remember to give yourself a target on the side rail for the cue ball. Also, practice this shot from different distances.”',
    physical: { kind: 'pattern',
      setup: ['The 4 ball shot as in figure 6-75 (page 102).', 'Give yourself a target on the side rail.', 'Change the distance between sessions.'],
      shots: [{ label: '4 ball in the side, a little low spin → toward the side rail into the position area for the 5 ball', pos: true }],
      objective: 'Consistently get to the position area for the 5 ball.',
      gaps: ['Exact distances'] },
    explain: 'PKF: low spin pulls the cue ball toward the side rail, making the position area for the 5 ball larger.' },
  { id: 'pp-o5-problem', section: 'balls-in-order', type: 'PROBLEM', assist: 'INDEPENDENT', title: '7 balls in order: the problem ball', src: 'Pages 103–104 · unnumbered layout, Figures 6-80, 6-81', concept: 'Find the problem ball', pattern: 'ft-o7',
    fig: 'fU125a', reveal: 'f6-81', purpose: 'QUESTION',
    prompt: 'Seven balls in order. PKF: if played correctly, each shot will be a rolling cue ball shot; the key shot is from the 3 ball to the 4 ball. Which is the problem ball, and why?',
    choices: [['seven', 'The 7 ball: it’s blocked'], ['one', 'The 1 ball: it’s on the rail'], ['four', 'The 4 ball: it only goes in one of the corner pockets']], answer: 'four',
    explain: 'PKF: “Before we shoot the 1 ball we need to examine our problem ball which is the 4 ball; since it only goes in one of the corner pockets we’re going to have to be very careful in how we play position on it.” From the area in figure 6-80 you pocket the 4 and travel on the correct path for the 5. The easiest way there: the cue ball on the end rail below the 3 ball line, just roll the 3 in (figure 6-81).' },
  { id: 'pp-o5-route', section: 'balls-in-order', type: 'ROUTE', assist: 'INDEPENDENT', title: '7 balls in order: the 1 ball to the 2', src: 'Page 104 · Figures 6-82, 6-83', concept: 'Angle does the work', pattern: 'ft-o7',
    fig: 'f6-82', reveal: 'f6-83', purpose: 'QUESTION',
    prompt: 'You need this angle on the 2 ball (figure 6-82) so you can roll it in at a soft speed. What is PKF’s easiest way from the 1 ball?',
    choices: [['draw', 'Draw straight back to the area'], ['both', 'Come off both side rails, with an angle on the 1 ball that lets you shoot fairly soft'], ['one', 'One rail with high action']], answer: 'both',
    explain: 'PKF: “The easiest way to do this is to place the cue ball here (figure 6-83), and come off both side rails for shape on the 2 ball. When you try this shot you want to give yourself an angle on the 1 ball where you can shoot fairly soft and still reach your position area; the angle should do most of the work for you.”' },
  { id: 'pp-o5-where', section: 'balls-in-order', type: 'WHERE', assist: 'INDEPENDENT', title: '7 balls in order: the 5 ball to the 6', src: 'Pages 105–106 · Figures 6-89 to 6-91', concept: 'Travel along the position line', pattern: 'ft-o7',
    fig: 'f6-89', reveal: 'f6-91', purpose: 'QUESTION',
    prompt: 'On the 5 ball (figure 6-89), strong players first determine where a rolling cue ball will travel. Some players instead go two rails for the 6 ball in the bottom right corner. What does PKF want when the cue ball leaves the last rail?',
    choices: [['line', 'To be travelling along the correct position line, so too easy or a little too hard still leaves the correct angle'], ['fast', 'To have as much speed as possible'], ['near', 'To stop as close to the 6 ball as possible']], answer: 'line',
    explain: 'PKF: a rolling cue ball naturally travels to the highlighted area for the 6 ball. Two rails for the bottom right corner (figure 6-90) takes excellent speed control since the cue ball isn’t travelling along the position line: A, B or C leaves a difficult shot. “Ideally, when the cue ball leaves the last rail you want it traveling along the correct position line as in figure 6-91.” Too easy (A) or a little overhit (B) still gives the correct angle.' },
  { id: 'pp-o5-learn', section: 'balls-in-order', type: 'LEARN', assist: 'INDEPENDENT', title: '7 balls in order: PKF solution', src: 'Pages 103–107 · Figures 6-80 to 6-93', concept: 'Rolling cue ball shots', pattern: 'ft-o7',
    fig: 'f6-88', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the seven ball layout in order.',
    explain: 'PKF SOLUTION. 1 ball: off both side rails to the 2 ball angle (figure 6-83). 2 ball: roll it in softly to the end rail below the 3 ball line (figures 6-81, 6-82). Recognize when you must slide instead: in figure 6-84 rolling heads toward the 5 ball; sliding heads near the corner (A), so a little draw (B) hits the side rail and takes the corner out of play (figure 6-85); to get closer to the 3, stun follow (figure 6-86). On or above the 3 ball line, the sliding path (figure 6-87). 4 ball: roll it in to the middle of the table, soft, so the pocket plays bigger (figure 6-88). 5 ball: roll to the highlighted area (figures 6-89, 6-91). 6 ball: roll it in and drift down for the 7 (figure 6-92); too much angle, a little low spin (figure 6-93, B). PKF: before you move on to left and right spin, become skilled at moving the cue ball around the table with center, center low and center high.' },

  // ================================================================ 7 · Full Table with Sidespin (pages 107–118)
  { id: 'pp-s-intro', section: 'sidespin', type: 'LEARN', assist: 'GUIDED', title: 'Full table with sidespin', src: 'Page 107 · Figure 6-94', concept: 'Sidespin, speed and elevation', pattern: 'ss-intro',
    fig: 'f6-94', purpose: 'TEACHING',
    prompt: 'PKF now moves to full table patterns using sidespin.',
    explain: 'PKF: depending on the angle of your cue stick, the cue ball may or may not return to the shooting line, or it may return and then cross over it like a massé shot. In figure 6-94 the player is hidden behind half a ball on the 8: he aims down the shooting line just missing the blocker; with the cue elevated 45 degrees and left spin, the cue ball first moves right (A), then travels across the shooting line toward the 8 ball (B). “When you use sidespin on the cue ball, you have to be very aware of your speed and the elevation of your cue stick.”' },
  { id: 'pp-s-over', section: 'sidespin', type: 'PROBLEM', assist: 'GUIDED', title: 'Sidespin over a ball', src: 'Page 107 · Figures 6-95, 6-96', concept: 'When to avoid sidespin', pattern: 'ss-over',
    fig: 'f6-95', reveal: 'f6-96', purpose: 'QUESTION',
    prompt: 'The player uses left spin on the 1 ball to come back for the 2, but has to elevate over a ball (figure 6-96). He lets up on his speed just a little. What happens, and what does PKF suggest?',
    choices: [['under', 'He undercuts it; use more spin'], ['over', 'The cue ball crosses the aiming line and he overcuts it; when shooting over a ball it’s often a good idea to play it without sidespin'], ['fine', 'Nothing changes; elevation removes the curve']], answer: 'over',
    explain: 'PKF: “he accidentally let up on his speed just a little bit and the cue ball crossed the aiming line (A) causing him to overcut the shot. Because of the added elevation of the cue stick, these shots have to be hit very precisely. When shooting over a ball its often a good idea to shoot these shots without sidespin, since the cue ball will stay on its path even if you let up on your speed.”' },
  { id: 'pp-s-rail', section: 'sidespin', type: 'ACTION', assist: 'GUIDED', title: 'Cue ball on the rail', src: 'Page 108 · Figures 6-97, 6-98', concept: 'When to avoid sidespin', pattern: 'ss-rail',
    fig: 'f6-97', reveal: 'f6-98', purpose: 'QUESTION',
    prompt: 'The cue ball is on the rail and the player wants the highlighted area for the 4 ball. Right spin with the elevated cue usually goes wrong (A). What is PKF’s better option?',
    choices: [['more', 'More right spin and more speed'], ['slide', 'Elevate a bit more and strike it with more of a sliding cue ball and no sidespin'], ['jump', 'A jump shot']], answer: 'slide',
    explain: 'PKF: with a bit too much speed “the cue ball never has time to curve back to the correct contact point, so they end up hitting too much of the object ball missing the shot (A). A better option is to elevate a bit more and strike the cue ball with more of a sliding cue ball and no sidespin (figure 6-98).” PKF adds: avoid sidespin on combination shots if you can, since sidespin throws the object ball slightly.' },
  { id: 'pp-s-decel', section: 'sidespin', type: 'PROBLEM', assist: 'GUIDED', title: 'Deceleration', src: 'Page 108 · Figure 6-100', concept: 'Deceleration', pattern: 'ss-decel',
    fig: 'f6-100', reveal: 'f6-100', purpose: 'QUESTION',
    prompt: 'Low right spin, two rails for the 2 ball in the side (figure 6-100). The player is afraid of overrunning position. What usually causes the miss (A)?',
    choices: [['decel', 'He lets up on his speed (decelerates), so the cue ball curves a bit too much'], ['hard', 'He hits it too hard'], ['aim', 'His aiming system is wrong']], answer: 'decel',
    explain: 'PKF: deceleration “is when the player’s forward stroke is slowing down before contact with the cue ball instead of accelerating,” usually when the player isn’t confident in pocketing the ball or getting position; here it makes the cue ball curve a bit too much (A). “There’s no aiming system on the planet that’s going to help you with sidespin shots. These are shots that you have to develop a feel for.”' },
  { id: 'pp-s-worth', section: 'sidespin', type: 'ACTION', assist: 'GUIDED', title: 'Is the sidespin worth it?', src: 'Page 109 · Figures 6-101, 6-102', concept: 'When to avoid sidespin', pattern: 'ss-worth',
    fig: 'f6-101', reveal: 'f6-102', purpose: 'QUESTION',
    prompt: 'Most players instinctively shoot figure 6-101 with low left. What does PKF point out?',
    choices: [['need', 'Low left is the only way to the 5 ball area'], ['draw', 'A draw stroke with no sidespin ends up in about the same location; ask if the added difficulty is worth it'], ['high', 'High right is better']], answer: 'draw',
    explain: 'PKF: “But you can end up in the same position area for the 5 ball just using a draw stroke with no sidespin. They both end up in about the same location.” In figure 6-102 (the 9 ball, position for the 8 in the top left corner), a little draw stroke without sidespin keeps the cue ball on the shooting line even if struck too easy or too hard. “When using sidespin it’s very speed sensitive.”' },
  { id: 'pp-s-path', section: 'sidespin', type: 'ROUTE', assist: 'GUIDED', title: 'Where sidespin takes effect', src: 'Pages 109–110 · Figures 6-103, 6-104', concept: 'Running english', pattern: 'ss-path',
    fig: 'f6-103', reveal: 'f6-104', purpose: 'QUESTION',
    prompt: 'Same shot with a sliding cue ball and then with left spin, toward a chalk target on the side rail (figure 6-103). How do the two paths compare?',
    choices: [['curve', 'The left spin curves the cue ball before it reaches the rail'], ['same', 'Same path to the first rail; once the cue ball hits the rail, the spin widens its path'], ['short', 'The left spin shortens the path after the rail']], answer: 'same',
    explain: 'PKF: “When using sidespin on a shot, the spin has no effect on the cue ball after it leaves the object ball, and before it hits a rail.” With left spin the cue ball still travels along the same path toward the chalk, “But, once the cue ball hits the rail the spin widens the cue ball’s path (B).” Figure 6-104: center high (A) vs center high with left spin (B).' },
  { id: 'pp-s-running', section: 'sidespin', type: 'LEARN', assist: 'GUIDED', title: 'Running english', src: 'Pages 110–111 · Figures 6-105 to 6-108', concept: 'Running english', pattern: 'ss-running',
    fig: 'f6-105', purpose: 'TEACHING',
    prompt: 'PKF: running english is sidespin that works with the cue ball’s natural path.',
    explain: 'PKF: “An easy way to determine running english on each shot, is to face the first rail the cue ball is going to hit after contacting the object ball.” Figure 6-105: the cue ball naturally goes right after the first rail (A), so for three rails to the 8 ball, right spin (B). Figure 6-106, from the opposite side: left spin is running english; running english adds speed, so the 1 ball doesn’t need to be struck very hard. If the cue ball travels right after hitting the rail, right spin is running english; if it travels left, left spin is running english.' },
  { id: 'pp-s-run1', section: 'sidespin', type: 'NEXT', assist: 'ASSISTED', title: 'Running english: three rails', src: 'Page 110 · Figure 6-105', concept: 'Running english', pattern: 'ss-running',
    fig: 'f6-105', reveal: 'f6-105', hidePre: true, purpose: 'QUESTION',
    prompt: 'You make the 1 ball in the top left corner; after the first rail the cue ball naturally goes right (A). You want three rails for the 8 ball. Which sidespin is running english?',
    choices: [['left', 'Left spin'], ['right', 'Right spin'], ['none', 'No sidespin']], answer: 'right',
    explain: 'PKF: “we would choose a sidespin that’s going to work with the cue ball’s natural path; which in this example would be right spin (B).”' },
  { id: 'pp-s-run2', section: 'sidespin', type: 'NEXT', assist: 'ASSISTED', title: 'Running english: the 4 ball', src: 'Pages 110–111 · Figure 6-107', concept: 'Running english', pattern: 'ss-running',
    fig: 'f6-107', reveal: 'f6-107', hidePre: true, purpose: 'QUESTION',
    prompt: 'On the 4 ball, three rails to the 5 ball area (figure 6-107). The first rail is the end rail, and the natural path goes right after it. Which spin is running english?',
    choices: [['right', 'Right spin'], ['left', 'Left spin'], ['draw', 'Draw only']], answer: 'right',
    explain: 'PKF: “The first thing we need to do is face the first rail the cue ball will strike, which is the end rail; since the cue ball’s natural path will go right after striking this rail, then right spin would be running english.” Same idea in figure 6-108: right spin propels the cue ball around the table for the 8.' },
  { id: 'pp-s-hold', section: 'sidespin', type: 'ACTION', assist: 'ASSISTED', title: 'Reverse english to hold', src: 'Pages 111–112 · Figures 6-109 to 6-111', concept: 'Reverse english', pattern: 'ss-reverse',
    fig: 'f6-111', reveal: 'f6-111', hidePre: true, purpose: 'QUESTION',
    prompt: 'Angle on the last stripe; the player needs to hold the cue ball for the 8 ball. The same speed three ways: no sidespin, left spin (running english here), or right spin. Which one slows the cue ball after the rail with a much more shallow angle?',
    choices: [['none', 'No sidespin (B)'], ['left', 'Left spin (A)'], ['right', 'Right spin, which is reverse english here (C)']], answer: 'right',
    explain: 'PKF: no sidespin travels toward the 1 ball (B); left spin, running english, picks up a little extra speed and travels toward the middle of the table (A). “Finally, he’s going to shoot this shot with reverse english, which is right spin. Now we can see that the cue ball not only slowed down after striking the rail, but the angle coming off the rail is much more shallow (C).” If right spin is running english, left spin is reverse english. Straight into the rail (figure 6-112): left spin goes left off the rail (A), right spin goes right (B).' },
  { id: 'pp-s-draw', section: 'sidespin', type: 'ACTION', assist: 'ASSISTED', title: 'Draw with running english', src: 'Page 113 · Figures 6-113 to 6-115', concept: 'Running english', pattern: 'ss-draw',
    fig: 'f6-113', reveal: 'f6-115', hidePre: true, purpose: 'QUESTION',
    prompt: 'The 2 ball is at the other end; the only path is drawing back to the right side rail. Which spin goes with the draw?',
    choices: [['left', 'Left spin'], ['right', 'Right spin: facing the right side rail, he wants the cue ball to go right off it'], ['none', 'No sidespin']], answer: 'right',
    explain: 'PKF: “he faces the first rail the cue ball will strike which is the right side rail. Since he wants the cue ball to go right when it contacts this rail, then right spin is what he’ll need to put on the cue ball along with draw.” Figure 6-114/6-115: drawing back to the right side rail with right spin, three rails for the 3 ball. Running english slightly increases the cue ball’s speed after the rail, so speed control must be precise.' },
  { id: 'pp-s-throw', section: 'sidespin', type: 'ACTION', assist: 'ASSISTED', title: 'Throw', src: 'Page 114 · Figures 6-117, 6-118', concept: 'Throw', pattern: 'ss-throw',
    fig: 'f6-117', reveal: 'f6-118', hidePre: true, purpose: 'QUESTION',
    prompt: 'Partially blocked by the 5 ball; cue ball and 8 ball line up just left of the side pocket. Which spin, with a soft stroke, throws the 8 ball right toward the side pocket?',
    choices: [['left', 'Left spin'], ['right', 'Right spin'], ['draw', 'Draw']], answer: 'left',
    explain: 'PKF: “Left spin will throw the object ball to the right, and right spin will throw the object ball to the left.” Figure 6-118: “If he can use a soft stroke with left spin he should be able to throw the 8 ball to the right toward the side pocket.”' },
  { id: 'pp-s-kill', section: 'sidespin', type: 'LEARN', assist: 'ASSISTED', title: 'Throw to kill the cue ball', src: 'Pages 114–115 · Figures 6-119, 6-120', concept: 'Throw', pattern: 'ss-throw',
    fig: 'f6-119', purpose: 'TEACHING',
    prompt: 'PKF: a strong player uses throw to help kill the cue ball.',
    explain: 'PKF: figure 6-119, to hold the cue ball for the 8, he hits the 5 ball a little more full than normal, aiming to miss the pocket on the right side (A); right spin throws the object ball slightly left toward the corner (B). Figure 6-120: to stop the cue ball immediately on the 3 ball, shoot toward a spot on the rail (A) with left spin, throwing the 3 right toward the corner (B). “A tip of left or right spin is enough to throw the object ball. You also don’t want to strike these shots too hard otherwise you may not get any throw on the object ball.”' },
  { id: 'pp-s-throwdrill', section: 'sidespin', type: 'RUN', assist: 'ASSISTED', title: 'Throw drill', src: 'Page 115 · unnumbered diagram', concept: 'Throw', pattern: 'ss-throw',
    fig: 'fU137a', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “A good drill to practice this type of shot is to place the cue ball and object ball in a straight line toward the side rail, right above the corner pocket (A).”',
    physical: { kind: 'pattern',
      setup: ['Cue ball and object ball in a straight line toward the side rail, right above the corner pocket (unnumbered diagram, page 115).', 'Aim a little below center with left spin; strike the object ball full.', 'A tip of spin is enough; don’t strike it too hard.'],
      shots: [{ label: 'Object ball thrown into the corner pocket with minimal cue ball movement', pos: true }],
      objective: 'Minimize any cue ball movement but still pocket the ball.' },
    explain: 'PKF: “The left spin should throw the object ball to the right toward the pocket.”' },
  { id: 'pp-s-curve', section: 'sidespin', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Curving around a blocker', src: 'Page 116 · Figures 6-123, 6-124', concept: 'Sidespin, speed and elevation', pattern: 'ss-curve',
    fig: 'f6-123', reveal: 'f6-124', purpose: 'QUESTION',
    prompt: 'Partially hidden on the 8; left spin with an elevated cue stick to curve around the obstacle. What happens if he strokes it a bit too firmly?',
    choices: [['much', 'It curves too much'], ['wrong', 'The cue ball never returns to the shooting line and strikes the 8 ball on the wrong side'], ['fine', 'It still makes the 8']], answer: 'wrong',
    explain: 'PKF: too softly, the cue ball curves too much and misses; “he strokes the shot a bit too firmly and the cue ball never returns to the shooting line so it strikes the 8 ball on the wrong side causing a miss (figure 6-124).” “When using an elevated cue stick with sidespin, your speed has to be very precise.” Seeing more of the 8 (figure 6-125): only about 20 degrees of elevation; totally blocked: around 45 degrees, a low percentage shot.' },
  { id: 'pp-s-frozen', section: 'sidespin', type: 'ACTION', assist: 'INDEPENDENT', title: 'Throw with frozen balls', src: 'Page 117 · Figures 6-127, 6-128', concept: 'Throw', pattern: 'ss-frozen',
    fig: 'f6-127', reveal: 'f6-128', purpose: 'QUESTION',
    prompt: 'The cue ball is frozen to the 8; both line up to a point on the end rail (A), and the 8 needs to go left of that line. What does PKF do?',
    choices: [['left', 'Center left, aim straight down the line, firm'], ['right', 'Center right, aim toward the corner pocket, nice soft stroke, about a tip of right spin'], ['draw', 'Draw, firm']], answer: 'right',
    explain: 'PKF: “Since he needs the 8 ball to go left of this line he’s going to shoot with center right and aim toward the corner pocket. If he shoots this shot with a nice soft stroke and about a tip of right spin he should be able to pocket the 8 ball.” Figure 6-128: the same idea toward the side pocket.' },
  { id: 'pp-s-typical', section: 'sidespin', type: 'LEARN', assist: 'INDEPENDENT', title: 'Typical sidespin shots', src: 'Pages 117–118 · Figures 6-129 to 6-131, unnumbered diagram', concept: 'Typical sidespin shots', pattern: 'ss-typical',
    fig: 'f6-129', purpose: 'TEACHING',
    prompt: 'PKF’s typical sidespin shots that come up often in 8-Ball and 9-Ball.',
    explain: 'PKF: figure 6-129, high right, two rails toward the target: “it’s all stroke, not power.” Figure 6-130, low right, two rails toward the middle of the table, trying to stop the cue ball on or near the target. Figure 6-131, over a ball with low right, two rails: place a ball near the cue ball to force a raised bridge. Unnumbered diagram (page 118): high left off the side rail toward the target, high action and at least two tips of left spin; if the cue ball has little speed after the object ball, you’re not hitting high enough.' },
  { id: 'pp-s-tworail', section: 'sidespin', type: 'RUN', assist: 'INDEPENDENT', title: 'High right, two rails', src: 'Page 117 · Figure 6-129', concept: 'Typical sidespin shots', pattern: 'ss-typical',
    fig: 'f6-129', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “With enough practice it won’t take that much of an effort to hit your target.”',
    physical: { kind: 'pattern',
      setup: ['Set up the shot in figure 6-129 (page 117), including the target.', 'High right; good acceleration through the cue ball: stroke, not power.'],
      shots: [{ label: 'Object ball pocketed, high right → two rails to the target', pos: true }],
      objective: 'Pocket the ball and spin two rails to your target.',
      gaps: ['Object ball and cue ball placement as drawn in PKF’s figure only'] },
    explain: 'PKF: a typical two rail spin shot that comes up quite often in 8-Ball and 9-Ball.' },
  { id: 'pp-s-overdrill', section: 'sidespin', type: 'RUN', assist: 'INDEPENDENT', title: 'Over a ball, low right', src: 'Page 118 · Figure 6-131', concept: 'Typical sidespin shots', pattern: 'ss-typical',
    fig: 'f6-131', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “When you practice this type of shot place a ball near the cue ball to force yourself to use a raised bridge.”',
    physical: { kind: 'pattern',
      setup: ['Set up the shot in figure 6-131 (page 118), with a ball near the cue ball.', 'Raised bridge; low with right spin.', 'Start with the cue ball closer to the object ball; move it farther away as you get more consistent.'],
      shots: [{ label: 'Object ball pocketed over the ball, low right → two rails to the target', pos: true }],
      objective: 'Pocket the ball and go two rails to hit your target.',
      gaps: ['Object ball and cue ball placement as drawn in PKF’s figure only'] },
    explain: 'PKF: one of the most commonly missed shots; most players don’t practise shooting over balls.' },

  // ================================================================ 8 · Pre-Shot Routine (pages 118–121)
  { id: 'pp-r-intro', section: 'pre-shot', type: 'LEARN', assist: 'GUIDED', title: 'Pre-shot routine', src: 'Pages 118–119 · Figure 6-133', concept: 'Pre-shot routine', pattern: 'ps-intro',
    fig: 'f6-133', purpose: 'TEACHING',
    prompt: 'PKF: top players all share a consistent pre-shot routine.',
    explain: 'PKF: “It’s this period between shots where they analyze the table, create a game plan, chalk their tip, determine their speed and cue ball spin, and build their stance around the shooting line.” After the break (figure 6-133) the player may ask: Which side has more problem areas? If I choose solids, what is the pattern for the runout? What are the danger areas? What is my last solid before the 8 ball? What speed and spin for my first solid, and what path will the cue ball take? Then he builds his stance around the first shooting line.' },
  { id: 'pp-r-plan', section: 'pre-shot', type: 'NEXT', assist: 'GUIDED', title: 'After the break', src: 'Page 118 · Figure 6-133', concept: 'Pre-shot routine', pattern: 'ps-intro',
    fig: 'f6-133', purpose: 'QUESTION',
    prompt: 'The player just broke and made a couple of balls (figure 6-133). Before he begins shooting, what does PKF say he has to do?',
    choices: [['first', 'Shoot the easiest ball first and look again'], ['plan', 'Create a game plan for the entire layout'], ['chalk', 'Only chalk and pick a speed']], answer: 'plan',
    explain: 'PKF: “Before he begins shooting he has to create a game plan for the entire layout. This pre-shot routine will take longer than normal since he has to analyze the entire table.”' },
  { id: 'pp-r-doubt', section: 'pre-shot', type: 'NEXT', assist: 'GUIDED', title: 'Doubts on the shot', src: 'Page 119 · unnumbered diagram', concept: 'Pre-shot routine', pattern: 'ps-doubt',
    fig: 'fU141a', purpose: 'QUESTION',
    prompt: 'You’re down on the shot and doubts about your talent or game plan creep into your mind. What does PKF say to do?',
    choices: [['shoot', 'Shoot quickly before the doubt grows'], ['steer', 'Steer the cue ball a little more carefully'], ['stand', 'Stand back up and make sure you refocus']], answer: 'stand',
    explain: 'PKF: “If any doubts about their talent or game plan creep into their mind they need to stand back up and make sure they refocus. The player’s pre-shot routine only works if the player trusts their ability to execute the game plan.” Lack of trust may result in jumping up or steering the cue ball.' },
  { id: 'pp-r-visual', section: 'pre-shot', type: 'LEARN', assist: 'ASSISTED', title: 'Visualization', src: 'Page 120 · unnumbered diagram', concept: 'Visualization', pattern: 'ps-visual',
    fig: 'fU142a', purpose: 'TEACHING',
    prompt: 'PKF: an effective visualization technique used by many top players.',
    explain: 'PKF: on the 4 ball in 9-Ball, a top player looks at where they need to be on the 6 ball (A), then works backwards: below the 5 ball pocket line for the side pocket. They visualize the path from the 4 ball to that area, which tells them the spin (low spin here). They stroke the cue in the air for speed, create their bridge in the air, then get down: “They’ve decided on their speed, spin, cue ball path, and bridge before they even get down on the table. The fewer things you have to think about when down on the table the better.”' },
  { id: 'pp-r-seq', section: 'pre-shot', type: 'SEQUENCE', assist: 'ASSISTED', title: 'The pre-shot questions in order', src: 'Page 120 · unnumbered diagram', concept: 'Visualization', pattern: 'ps-seq',
    fig: 'fU142b', purpose: 'QUESTION',
    prompt: '9-Ball, on the 3 ball. Which order of questions matches PKF’s pre-shot routine?',
    choices: [['fwd', 'Shooting line on the 3 → speed → spin → where the cue ball ends up'], ['back', 'Where on the 5 (A) → angle on the 4 (B) → how to get there from the 3 → cue ball path (C) → spin → bridge → speed → shooting line on the 3'], ['spin', 'Spin → speed → pocket → position on the 4']], answer: 'back',
    explain: 'PKF’s list: “Where do I need to be on the 5 ball (A)? What angle do I need on the 4 ball to obtain this position on the 5 ball (B)? How do I get this position on the 4 ball from the 3 ball? What is the cue ball path from the 3 ball to this position area (C)? Now that I can see the path what spin on the cue ball will I need? What bridge will I use? What speed do I need? Where is the shooting line on the 3 ball?”' },
  { id: 'pp-r-pause', section: 'pre-shot', type: 'WHERE', assist: 'INDEPENDENT', title: 'Take a pause', src: 'Page 121 · Figures 6-137, 6-138', concept: 'Pre-shot routine', pattern: 'ps-pause',
    fig: 'f6-137', reveal: 'f6-138', purpose: 'QUESTION',
    prompt: 'Without pausing, the player pockets the 3 ball and goes off the side rail for the 4 in the top left corner (figure 6-137), leaving a lot of work to get on the 5. Had he paused, what would he have played?',
    choices: [['same', 'The same shot, softer'], ['draw', 'Draw the cue ball back to the position area (A)'], ['two', 'Two rails with right spin']], answer: 'draw',
    explain: 'PKF: “If he had taken a pause and studied the situation (figure 6-138), he would have known that drawing the cue ball back to this position area (A) is the correct shot.” The pre-shot routine also forces a pause before the next shot; use that time to make sure your tip has plenty of chalk.' },

  // ================================================================ 9 · Full Table Patterns from Actual Games (pages 121–136)
  { id: 'pp-g1-route', section: 'actual-games', type: 'ROUTE', assist: 'ASSISTED', title: 'Game 1 (9-Ball): the 1 ball to the 2', src: 'Pages 121–122 · unnumbered layout, Figures 6-140 to 6-142', concept: 'Rails when the path is blocked', pattern: 'g1',
    fig: 'fU143a', reveal: 'f6-141', purpose: 'QUESTION',
    prompt: 'From an actual game: ball in hand, 9-Ball; the 2 ball goes in the bottom side pocket. Three rails from the 1 ball is blocked by the 5 ball (figure 6-140). How did the player get position on the 2?',
    hint: 'He needed two rails and a specific spot on the rail.',
    choices: [['draw', 'Draw back from the 1 ball'], ['both', 'High action off both side rails, striking the rail right between the 4 and 5 ball, with a small amount of right spin'], ['stop', 'A stop shot on the 1 ball']], answer: 'both',
    explain: 'PKF: “In the actual game he put the cue ball here (figure 6-141), and used high action to come off both side rails for shape on the 2 ball. He had to strike the rail right between the 4 and 5 ball using high action with a small amount of right spin.” If short of the 2 ball pocket line, he could roll the 2 in the side and use the 8 ball to stop the cue ball (figure 6-142).' },
  { id: 'pp-g1-where', section: 'actual-games', type: 'WHERE', assist: 'ASSISTED', title: 'Game 1: position on the 4', src: 'Pages 122–123 · Figures 6-143 to 6-146', concept: 'Pocket lines', pattern: 'g1',
    fig: 'f6-143', reveal: 'f6-144', purpose: 'QUESTION',
    prompt: 'Keeping the cue ball in the same area after the 5 gives a natural rolling shot on the 6 for the 7 (figure 6-143). Where does the cue ball need to end up when he shoots the 4 ball?',
    choices: [['straight', 'Straight in on the 5 ball'], ['line', 'On the 5 ball pocket line or on the other side of it'], ['short', 'Short of the 5 ball pocket line']], answer: 'line',
    explain: 'PKF: “When he shoots the 4 ball his cue ball needs to end up either on the 5 ball pocket line or on the other side (figure 6-144).” He doesn’t want to end up straight in on the 4 (figure 6-145): then a stop shot, two rails back for the 6 and around the table for the 7 (figure 6-146), a lot more work.' },
  { id: 'pp-g1-action', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 1: the 3 ball', src: 'Page 123 · Figure 6-147', concept: 'Stun follow with sidespin', pattern: 'g1',
    fig: 'f6-147', reveal: 'f6-148', hidePre: true, purpose: 'QUESTION',
    prompt: 'On the 3 ball, the sliding cue ball path goes toward the corner pocket area, but he needs the side rail and out for the 4 ball. What did he use?',
    choices: [['draw', 'Draw with right spin'], ['stun', 'A stun follow shot, to reach the end rail sooner, with left spin to bring the cue ball to the side rail and out'], ['roll', 'A soft rolling shot, no spin']], answer: 'stun',
    explain: 'PKF: “The sliding cue ball path for the 3 ball goes toward the corner pocket area, so he used a stun follow shot to force the cue ball to the end rail sooner. He also used left spin to bring the cue ball to the side rail and out for his 4 ball position.” On the 4 he played shape on the other side of the 5 ball line (figure 6-148).' },
  { id: 'pp-g1-seven', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 1: the 7 ball', src: 'Page 124 · Figure 6-150', concept: 'Feel for the rolling cue ball', pattern: 'g1',
    fig: 'f6-150', reveal: 'f6-150', purpose: 'QUESTION',
    prompt: 'At this angle on the 7 ball (figure 6-150), what takes the cue ball toward the ideal position for the 8?',
    choices: [['roll', 'A simple center high rolling shot (A)'], ['right', 'Right spin (B)'], ['draw', 'Draw']], answer: 'roll',
    explain: 'PKF: “he knew a simple center high rolling shot will take the cue ball toward his ideal position for the 8 ball (A). Players who don’t have a good feel for the rolling cue ball may shoot this shot with right spin and end up with a more difficult shot (B).”' },
  { id: 'pp-g1-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'Game 1: how he ran it', src: 'Pages 121–124 · Figures 6-140 to 6-151', concept: 'Actual game runout', pattern: 'g1',
    fig: 'f6-151', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: 1 through 9 in order, as played in the actual game.',
    explain: 'PKF SOLUTION. 1 ball: high action off both side rails, between the 4 and 5, small right spin (figure 6-141). 2 ball: from just below its pocket line, in the side. 3 ball: stun follow with left spin, side rail and out (figure 6-147). 4 ball: on the other side of the 5 ball line (figure 6-148). 5 ball: keep the cue ball on or near the 6 ball line (figure 6-149). 6 ball: roll it in with a little left spin. 7 ball: center high rolling (figure 6-150). 8 ball: draw back to shoot the 9 in the same pocket (figure 6-151).' },
  { id: 'pp-g2-problem', section: 'actual-games', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Game 2 (9-Ball): the potential problem', src: 'Page 124 · unnumbered layout, Figure 6-153', concept: 'Find the problem ball', pattern: 'g2',
    fig: 'fU146a', reveal: 'f6-153', purpose: 'QUESTION',
    prompt: 'The player just broke and has a shot on the 1 ball; the key is getting from the 3 ball to the 5 ball. What is the potential problem PKF points out?',
    choices: [['one', 'The 1 ball'], ['five', 'The 5 ball: to play it in the bottom left corner he has to be aware of the 6 ball'], ['nine', 'The 9 ball']], answer: 'five',
    explain: 'PKF: “In this layout a potential problem may be the 5 ball. If he wants to play the 5 ball in the bottom left corner pocket he has to be aware of the 6 ball (figure 6-153).” From near the 3 ball line he can pocket the 3 in the corner and go two rails for the 5: a nice soft rolling cue ball with a little right spin. He shot the 1 ball off the side rail to end up on or very close to the 3 ball line (figure 6-154).' },
  { id: 'pp-g2-action', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 2: the 3 ball', src: 'Page 125 · unnumbered figure', concept: 'Rolling path first, then sidespin', pattern: 'g2',
    fig: 'fU147a', purpose: 'QUESTION',
    prompt: 'Near the 3 ball line: how does a strong player decide how much right spin to use on the 3 ball?',
    choices: [['max', 'Use maximum right spin to be safe'], ['first', 'First determine the path of a rolling cue ball without sidespin, then add only what’s needed'], ['feel', 'Pick a spin, then adjust the speed']], answer: 'first',
    explain: 'PKF: “When a strong player approaches a shot like this they first determine the path of a rolling cue ball without sidespin.” With no sidespin it heads toward the side pocket (A), fairly close to where he needs to be, so “he rolled the 3 ball in with just a small amount of right spin (B).” He wants to bounce off the second rail into the area so he doesn’t come up short on the 5.' },
  { id: 'pp-g2-speed', section: 'actual-games', type: 'SPEED', assist: 'INDEPENDENT', title: 'Game 2: flat on the 5 ball', src: 'Page 125 · Figure 6-156', concept: 'Power makes the pocket smaller', pattern: 'g2',
    fig: 'f6-156', purpose: 'QUESTION',
    prompt: 'A flat angle on the 5 ball (figure 6-156). Many players would power it in to force the cue ball off the side rail. What did the player use?',
    choices: [['SOFT', 'SOFT'], ['MEDIUM', 'MEDIUM'], ['FIRM', 'FIRM (power)']], answer: 'MEDIUM',
    explain: 'PKF: “When you strike a ball with power the pocket plays much smaller so there is less margin for error. In this game the player didn’t try to force an easier shot on the 6 ball, instead, he used a medium stroke and came off the side rail ending up with a backward cut on the 6 ball.”' },
  { id: 'pp-g2-where', section: 'actual-games', type: 'WHERE', assist: 'INDEPENDENT', title: 'Game 2: position on the 8', src: 'Pages 125–126 · Figures 6-157, 6-158', concept: 'Safer position area', pattern: 'g2',
    fig: 'f6-158', reveal: 'f6-158', hidePre: true, purpose: 'QUESTION',
    prompt: 'Two rails from the 7 ball for the 8 in the side. The ideal area gives a slight angle to come off the side rail for the 9, but coming up short means banking the 8. What safer alternative does PKF show?',
    choices: [['ideal', 'Play for the ideal area anyway, firmer'], ['between', 'Move the position area between the 9 ball and the 8 ball: short leaves the highlighted area, long leaves the 8 in the corner'], ['bank', 'Plan to bank the 8']], answer: 'between',
    explain: 'PKF: “A safer alternative is to move the position area between the 9 ball and 8 ball (B). Now if he comes up short he’ll end up in the highlighted area, and if he goes long he can pocket the 8 ball in the corner pocket (C).” On the 6 he used low action to hold the cue ball in the middle of the table (figure 6-157 shows the dangers of playing the 7 in the corner).' },
  { id: 'pp-g2-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'Game 2: how he ran it', src: 'Pages 124–126 · Figures 6-153 to 6-158', concept: 'Actual game runout', pattern: 'g2',
    fig: 'f6-154', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: 1 through 9 in order, as played in the actual game.',
    explain: 'PKF SOLUTION. 1 ball: off the side rail to on or very close to the 3 ball line (figure 6-154). 3 ball: rolling path without sidespin first, then a small amount of right spin, off the second rail into the area for the 5 (unnumbered figure, page 125). 5 ball: medium stroke off the side rail to a backward cut on the 6 (figure 6-156). 6 ball: low action to hold in the middle of the table. 7 ball: two rails for the 8 in the side, safest between the 9 and the 8 (figure 6-158). Then the 9.' },
  { id: 'pp-g3-problem', section: 'actual-games', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Game 3 (8-Ball, solids): problem areas', src: 'Page 126 · unnumbered layout', concept: 'Find the problem ball', pattern: 'g3',
    fig: 'fU148a', purpose: 'QUESTION',
    prompt: 'From a game between two top players; he has chosen solids and there are three problem areas. Which two are his main priority?',
    choices: [['seventhree', 'The 7 ball tied up with the 8, and the 3 ball, which doesn’t have a pocket'], ['two', 'The 2 ball and the 1 ball'], ['five', 'The 5 ball and the 4 ball']], answer: 'seventhree',
    explain: 'PKF: “the first problem is the 7 ball which is tied up with the 8 ball. The next problem area is the 3 ball which doesn’t have a pocket, and the final problem area is the 2 ball,” a problem because no solids are nearby to play position on it. “His main priority however, is resolving the other two problem areas.”' },
  { id: 'pp-g3-action', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 3: breaking out the 7 and 8', src: 'Page 126 · Figures 6-160, 6-161', concept: 'Sliding path as a reference', pattern: 'g3',
    fig: 'f6-160', reveal: 'f6-161', purpose: 'QUESTION',
    prompt: 'The sliding cue ball path for the 5 ball heads toward the 7 and 8 problem area, but a sliding cue ball may miss both balls (A). How did the player strike the cue ball?',
    choices: [['low', 'Low, to slow the cue ball down'], ['above', 'Just above center, so the cue ball travels more toward the problem area (B)'], ['side', 'Left spin']], answer: 'above',
    explain: 'PKF: “Since a sliding cue ball may miss both balls (A), the player struck the cue ball just above center so the cue ball would travel more toward the problem area (B). After the breakout, the 7 ball was no longer a problem ball (figure 6-161).”' },
  { id: 'pp-g3-seq', section: 'actual-games', type: 'SEQUENCE', assist: 'INDEPENDENT', title: 'Game 3: breaking out the 3', src: 'Page 127 · Figures 6-162, 6-163', concept: 'Insurance ball', pattern: 'g3',
    fig: 'f6-162', reveal: 'f6-163', purpose: 'QUESTION',
    prompt: 'He uses the 6 ball to break out the 3. Which order did the player use, and why?',
    choices: [['one', '1 ball first, then the 6 to break out the 3'], ['four', '4 ball first, ending up in the area for the 6; after the breakout he can pocket the 1 in the side (an insurance ball)'], ['three', 'Bank the 3 first']], answer: 'four',
    explain: 'PKF: “Whenever a player needs to break out a problem ball they always want to make sure, if possible, that they will be guaranteed a shot after the breakout.” 1 then 6 may leave a very difficult shot (figure 6-162). “A better game plan, and the one the player used, is to shoot the 4 ball first ending up in this area for the 6 ball (figure 6-163).” Then the 1 ball in the side: “Players refer to this as having an insurance ball when breaking out a problem area.”' },
  { id: 'pp-g3-route', section: 'actual-games', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Game 3: the 6 into the 3', src: 'Page 127 · unnumbered diagram', concept: 'Insurance ball', pattern: 'g3',
    fig: 'f6-163', reveal: 'fU149a', purpose: 'QUESTION',
    prompt: 'Shooting the 6 ball to break out the 3: straight into the 3, or off the end rail first?',
    choices: [['straight', 'Straight into the 3 ball'], ['rail', 'Strike the end rail first, then the 3, just hard enough to free it from the end rail']], answer: 'rail',
    explain: 'PKF: “he didn’t want to go straight into the 3 ball (A), since a slight mishit could send the 3 ball toward the 14 ball tying it up. When he shoots the 6 ball he wants to strike the end rail first before hitting the 3 ball (B). He just wants to hit the 3 ball hard enough to free it from the end rail.”' },
  { id: 'pp-g3-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'Game 3: how he ran it', src: 'Pages 126–128 · Figures 6-160 to 6-168', concept: 'Actual game runout', pattern: 'g3',
    fig: 'f6-166', purpose: 'PATTERN',
    prompt: 'PKF PATTERN (solids): 5 → 4 → 6 → 1 → 2 → 7 → 3 → 8.',
    explain: 'PKF SOLUTION, as described across pages 126–128. 5 ball: just above center to break out the 7 and 8 (figure 6-160). 4 ball: to the area for the 6 (figure 6-163). 6 ball: end rail first into the 3 (unnumbered diagram, page 127). 1 ball (insurance): side pocket, off the end rail for the 2 (figure 6-165). 2 ball: off the side rail with low right spin to on or near the 7 ball pocket line (figure 6-166). 7 ball: low spin, draw back to the 3 ball pocket line (figure 6-167). Then a stop shot, and the 8 ball in the top left corner. Quite a bit short of the 3 line: follow toward the end rail with high right (figure 6-168).' },
  { id: 'pp-g4-choose', section: 'actual-games', type: 'PROBLEM', assist: 'INDEPENDENT', title: 'Game 4 (8-Ball): stripes or solids?', src: 'Pages 128–129 · unnumbered layout, Figure 6-170', concept: 'Choosing a group', pattern: 'g4',
    fig: 'fU150a', reveal: 'f6-170', purpose: 'QUESTION',
    prompt: 'Ball in hand. Stripes have two problem areas (15 and 10; the 11, side pockets only). Solids have two (the 5; the 3 and 6, with the 12 blocking the corner). Which group did the player choose, and why?',
    choices: [['solids', 'Solids: fewer balls in trouble'], ['stripes', 'Stripes: the solids will be tougher because the 3 and 6 are tied up']], answer: 'stripes',
    explain: 'PKF: “After studying both solids and stripes the player chose stripes. Both sides present challenges but the solids will be tougher to navigate due to the 3 and 6 ball being tied up.” For stripes, pocketing the 13 and coming off the end rail into the 5 clears the 15 and 10 area (figure 6-170).' },
  { id: 'pp-g4-first', section: 'actual-games', type: 'NEXT', assist: 'INDEPENDENT', title: 'Game 4: which problem first?', src: 'Page 129 · Figure 6-171', concept: 'Attack the hardest problem first', pattern: 'g4',
    fig: 'fU150a', reveal: 'f6-171', purpose: 'QUESTION',
    prompt: 'With ball in hand on stripes, which problem area did the player remove first?',
    choices: [['eleven', 'The 11 ball'], ['fifteen', 'The 15 and 10 area'], ['thirteen', 'The 13 ball']], answer: 'eleven',
    explain: 'PKF: “So the first problem area the player removed was the 11 ball. He could have focused on the 15 and 10 ball problem area first, but getting position on the 11 ball for either side pocket is going to be extremely difficult if he saves this ball for later in the run.” He came off the end rail to create an angle for the 13 (figure 6-171); the 13 with high right broke out the 5 with a nice soft stroke (figure 6-172).' },
  { id: 'pp-g4-combo', section: 'actual-games', type: 'WHERE', assist: 'INDEPENDENT', title: 'Game 4: before the combination', src: 'Page 129 · Figures 6-173, 6-174', concept: 'Guarantee a shot', pattern: 'g4',
    fig: 'f6-173', reveal: 'f6-174', purpose: 'QUESTION',
    prompt: 'After the 15 ball he wants to shoot the 10-12 combination. Where did he make sure the cue ball ended up when he shot the 15?',
    choices: [['on', 'On the 10 ball pocket line'], ['short', 'Just short of the 10 ball pocket line'], ['other', 'On the other side of the 10 ball pocket line']], answer: 'short',
    explain: 'PKF: on or past the 10 ball pocket line he may run into trouble: a slight mishit could leave the 10 on the end rail without a shot (figure 6-174). “When he shot the 15 ball he made sure he ended up just short of the 10 ball pocket line. Now when he played the combination, the cue ball ended up in the middle of the table. By playing the combination this way he guaranteed himself a shot in case he mishits the combination.” Then the 10 with a little right spin to the middle of the table for the 8 (unnumbered figure, page 130).' },
  { id: 'pp-g4-six', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 4 (solids): the 6 ball', src: 'Page 131 · Figure 6-184', concept: 'Reverse english', pattern: 'g4',
    fig: 'f6-184', reveal: 'f6-184', hidePre: true, purpose: 'QUESTION',
    prompt: 'PKF also shows the solids pattern. On the 6 ball, center high heads toward the 11 ball. What sends the cue ball to the ideal position area?',
    choices: [['running', 'Running english'], ['reverse', 'Reverse english (left spin)'], ['draw', 'Draw']], answer: 'reverse',
    explain: 'PKF: “we can see that the cue ball will head toward the 11 ball with just center high (B). Since he knows the path of a center high shot, he now knows that if he can use reverse english (left spin), the cue ball ball’s path will head toward his ideal position area (A).” With more angle, two rails (figure 6-185). The 3 ball: a similar stroke, center high and left spin, back to the middle for the 8 (figure 6-186).' },
  { id: 'pp-g4-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'Game 4: both patterns', src: 'Pages 128–132 · Figures 6-170 to 6-187', concept: 'Actual game runout', pattern: 'g4',
    fig: 'f6-177', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: the stripes runout the player chose, and PKF’s solids pattern.',
    explain: 'PKF SOLUTION, stripes (actual game): the 11 first, off the end rail for an angle on the 13 (figure 6-171); the 13 with high right, breaking out the 5 softly (figure 6-172); the 15, ending just short of the 10 ball line (figure 6-173); the 10-12 combination, cue ball to the middle; the 10 with a little right spin to the middle for the 8. PKF doesn’t describe every remaining stripe. Solids (PKF’s pattern): be on the 7 as in figure 6-177, pocket it in the side and send the cue ball toward the 12, making it in the corner, the 1 as insurance; get there with high action off the side rail near the 2 ball line (figures 6-178, 6-179), or via the 4 (figure 6-181); a small amount of roll on the 7 toward the 12 (figure 6-182); roll in the 1 (figure 6-183); the 6 with reverse english (figure 6-184); the 3 with center high and left spin (figure 6-186); then the 8.' },
  { id: 'pp-g5-route', section: 'actual-games', type: 'ROUTE', assist: 'INDEPENDENT', title: 'Game 5 (9-Ball): the 1 ball to the 2', src: 'Pages 132–133 · unnumbered layout, Figures 6-192, 6-193', concept: 'Rails for a bigger window', pattern: 'g5',
    fig: 'fU154a', reveal: 'f6-193', purpose: 'QUESTION',
    prompt: 'Two key shots: the 1 to the 2 and the 5 to the 6. To get the right angle on the 2 ball, how should he play the 1 ball?',
    choices: [['end', 'Off the end rail into the area'], ['side', 'Off the side rail, both rails, so he can overhit and still stay on the proper angle']], answer: 'side',
    explain: 'PKF: off the end rail (figure 6-192) “takes precise speed control and there’s the chance of coming up short (A).” “A better way of getting this angle… is to come off the side rail (figure 6-193). By playing position off both rails the player can overhit the shot and still stay on the proper angle (A); the position window is much larger than the previous option.”' },
  { id: 'pp-g5-action', section: 'actual-games', type: 'ACTION', assist: 'INDEPENDENT', title: 'Game 5: the 4 ball', src: 'Page 133 · Figure 6-195', concept: 'Low spin widens the angle', pattern: 'g5',
    fig: 'f6-195', reveal: 'f6-195', hidePre: true, purpose: 'QUESTION',
    prompt: 'On the 4 ball the sliding cue ball heads toward the position area for the 5 (A). What did the player add, and why?',
    choices: [['high', 'High, to get closer to the 5'], ['low', 'A touch of low spin to widen the angle, for a little more angle on the 5 to play shape for the 6'], ['right', 'Right spin, off the rail']], answer: 'low',
    explain: 'PKF: “In the game the player used a touch of low spin to widen the angle (B). By playing position this way he gave himself a little more angle on the 5 ball which will make it easier to play shape for the 6 ball.”' },
  { id: 'pp-g5-where', section: 'actual-games', type: 'WHERE', assist: 'INDEPENDENT', title: 'Game 5: the 5 ball to the 6', src: 'Page 134 · Figures 6-197, 6-200', concept: 'Middle of the position area', pattern: 'g5',
    fig: 'f6-197', reveal: 'f6-200', purpose: 'QUESTION',
    prompt: 'The ideal ‘A’ angle on the 6 ball sits right at the border of the position area (figure 6-197). What rule of thumb does PKF give?',
    choices: [['ideal', 'Always play for the ideal angle'], ['middle', 'Play position for the middle of position areas'], ['draw', 'Always draw into side pocket shape']], answer: 'middle',
    explain: 'PKF: playing for the ‘A’ angle needs almost perfect speed. “A common rule of thumb is to play position for the middle of position areas. For instance, in figure 6-200 the player chose this path off the 5 ball for position on the 6 ball (A). By playing into the middle of the position area he’s allowed himself little room for error on either side.” ‘C’ angle: high action with left spin; ‘D’ angle: three rails back to the middle (figures 6-198, 6-199).' },
  { id: 'pp-g5-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'Game 5: how he ran it', src: 'Pages 132–135 · Figures 6-189 to 6-202', concept: 'Actual game runout', pattern: 'g5',
    fig: 'f6-201', purpose: 'PATTERN',
    prompt: 'PKF PATTERN: 1 through 9 in order. The pattern relies heavily on correct angles.',
    explain: 'PKF SOLUTION. Work back from the 4 ball angle (figure 6-189): from the end rail on the 3, high action off the side rail just short of the 4 ball line (figure 6-190). 2 ball: a nice soft shot with a touch of left spin to the end rail (figure 6-191). 1 ball: off both side rails (figure 6-193). 3 ball straight in: high action with right spin (figure 6-194). 4 ball: a touch of low to widen the angle (figure 6-195). 5 ball: into the middle of the 6 ball area (figure 6-200). 7 ball: low with left spin, two rails for the 8 (figure 6-201); too flat, power draw with a small amount of left off the end rail (A) or maximum right, three rails (B) (figure 6-202). Then the 8 and 9.' },
  { id: 'pp-m-learn', section: 'actual-games', type: 'LEARN', assist: 'INDEPENDENT', title: 'The marker drill', src: 'Pages 135–136 · Figures 6-203 to 6-209', concept: 'Marker drill', pattern: 'marker',
    fig: 'f6-203', purpose: 'TEACHING',
    prompt: 'PKF: “An excellent drill for practicing full table pattern play is to throw nine balls on the table.”',
    explain: 'PKF: shoot the balls in order with ball in hand, using a marker (a quarter will work) for every third ball. Before the 1 ball, place the marker where you want the cue ball for the 3 ball (A); shoot the 1 and 2 to end near it (figure 6-204). Before the 3, place it for the 5 (figure 6-205); before the 5, for the 7 (figures 6-206, 6-207); before the 7, for the 9 (figures 6-208, 6-209). “If you miss the marker by quite a bit then set both shots up and shoot them again. If you continue to struggle see if you’ve chosen the best pattern for both balls.” It also works for 8-Ball: markers for the third, fifth and seventh balls.' },
  { id: 'pp-m-next', section: 'actual-games', type: 'NEXT', assist: 'INDEPENDENT', title: 'Marker drill: before the 1 ball', src: 'Page 135 · Figure 6-203', concept: 'Marker drill', pattern: 'marker',
    fig: 'f6-203', purpose: 'QUESTION',
    prompt: 'Nine balls thrown on the table, ball in hand. Before you shoot the 1 ball, what do you do?',
    choices: [['nine', 'Place the marker where you want to finish for the 9'], ['three', 'Place the marker where you would like the cue ball to be for shape on the 3 ball'], ['two', 'Place the marker for the 2 ball']], answer: 'three',
    explain: 'PKF: “Before we shoot the 1 ball we’re going to place a marker (a quarter will work) on the table where we would like the cue ball to be for shape on the 3 ball (A). The goal is to shoot the 1 and 2 ball and end up near this position marker for the 3 ball.”' },
  { id: 'pp-m-run', section: 'actual-games', type: 'RUN', assist: 'INDEPENDENT', title: 'Marker drill: nine balls', src: 'Pages 135–136 · Figures 6-203 to 6-209', concept: 'Marker drill', pattern: 'marker',
    fig: 'f6-203', purpose: 'PHYSICAL SETUP',
    prompt: 'PKF: “This type of drill forces you to start thinking ahead when playing 9-Ball or 8-Ball.”',
    physical: { kind: 'pattern', sequence: true,
      setup: ['Throw nine balls on the table; ball in hand (figure 6-203). Your layout will differ from PKF’s example.', 'A marker (a quarter will work). Shoot the balls in order.', 'Each two-ball step counts as one row: record POSITION when you end near the marker.'],
      shots: [
        { label: 'Marker for the 3, then the 1 and 2 → near the marker', pos: true },
        { label: 'Marker for the 5, then the 3 and 4 → near the marker', pos: true },
        { label: 'Marker for the 7, then the 5 and 6 → near the marker', pos: true },
        { label: 'Marker for the 9, then the 7 and 8 → near the marker', pos: true },
        { label: '9 ball', pos: false }],
      objective: 'Run the nine balls in order, ending near each marker.',
      goal: 'PKF: if you miss the marker by quite a bit, set both shots up and shoot them again.',
      gaps: ['How close counts as “near the marker” (PKF doesn’t say)'] },
    explain: 'PKF: take your time and be aware of pocket lines and angles.' }
];

/** When the question figure is also the answer figure, the comparison opens PKF's full original page (its explanation). */
const revealOf = (l) => (l.reveal && l.reveal === l.fig ? `t${regionOf(l.fig)?.page}` : l.reveal);
export const LESSONS = L.map((l) => ({ choices: null, answer: null, hint: '', physical: null, plan: null, ...l, reveal: revealOf(l) || null }));

// ------------------------------------------------------------------ exam
/**
 * PKF Pattern Play Exam: original PKF layouts taught in this course, nothing new.
 * Planning part = source-supported pattern questions (`planning: true` = sequence / next ball / CB finish / route /
 * problem ball / solve); the rest of the knowledge part tests PKF's action, speed and sidespin teaching.
 * Physical part = five representative PKF patterns (two half table, three full table).
 */
const EXAM_FROM = [
  ['pp-p1-last', true], ['pp-p3-route', true], ['pp-p4-solve', true], ['pp-f4-problem', true], ['pp-f5-speed', false],
  ['pp-v1-where', true], ['pp-v3-stun', false],
  ['pp-e1-route', true], ['pp-e3-build', true], ['pp-e5-first', true], ['pp-o2-rule', true], ['pp-o4-next', true],
  ['pp-s-run2', false], ['pp-s-hold', false], ['pp-s-throw', false], ['pp-r-seq', false], ['pp-g3-seq', true], ['pp-g5-where', true],
  ['pp-p1-run', false], ['pp-f2-run', false], ['pp-v2-run', false], ['pp-e1-run', false], ['pp-o3-run', false]
];
export const EXAM_ITEMS = EXAM_FROM.map(([from, planning]) => {
  const l = LESSONS.find((x) => x.id === from);
  if (!l) throw new Error(`exam source missing ${from}`);
  return { ...l, id: `ppx-${from.slice(3)}`, from, assist: 'INDEPENDENT', plan: null, planning: !!planning };
});

export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }
export function isKnowledge(l) { return !!l && KNOWLEDGE_TYPES.includes(l.type); }
export function isPhysical(l) { return !!l && l.type === 'RUN'; }
export function isBuild(l) { return !!l && l.type === 'BUILD'; }
/** Planning question: exam items carry `planning`; in the course, the pattern-planning question types. */
const PLAN_TYPES = ['NEXT', 'WHERE', 'SEQUENCE', 'BUILD', 'ROUTE', 'PROBLEM', 'SOLVE'];
export function isPlanning(l) { return !!l && isKnowledge(l) && (l.planning != null ? !!l.planning : PLAN_TYPES.includes(l.type)); }
export function knowledgeLessons(sectionId) { return lessonsFor(sectionId).filter(isKnowledge); }
export function isHalf(l) { return !!sectionById(l?.section)?.half; }
/** Which shot buttons a shot gets. */
export function shotTagsFor(lesson, idx) {
  const shots = lesson?.physical?.shots || [];
  const shot = shots[idx];
  if (!shot) return [];
  const last = idx === shots.length - 1;
  const tags = shot.pos || !last ? ['pos', 'lost', 'miss'] : ['made', 'miss'];
  if (lesson.physical.sequence) tags.push('seq');
  return tags;
}

// ------------------------------------------------------------------ figures and source map
const PURPOSES = ['TEACHING', 'QUESTION', 'SOLUTION', 'PHYSICAL SETUP', 'REFERENCE', 'PATTERN'];
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
    return '<div class="card pkfppHiddenFig" data-pkfpp-hidden-fig="1"><p class="muted small">The PKF figure for this question prints the answer, so it opens after you LOCK ANSWER.</p></div>';
  }
  return regionHTML(a, { alt: l?.title || 'PKF example', fullBtn: locked, ...opts });
}
export function solutionFigureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  const l = lessonById(lessonId);
  if (!a) return '';
  const r = a.reveal || a;
  return regionHTML(r, { alt: l?.title || 'PKF example', label: 'PKF SOLUTION · ORIGINAL PAGE', ...opts });
}
/** Flat mapping row: lessonId → sourceImage → sourcePage → sourceFigure → PKF section → crop → pattern → purpose. */
export function mappingRow(lesson) {
  const a = assetOf(lesson.id);
  if (!a) return null;
  return {
    lessonId: lesson.id,
    sourceImage: a.sourceImage,
    sourcePdfPage: a.pdf,
    sourcePage: a.printed,
    sourceFigure: a.figs,
    chapter: chapterOf(a.pdf),
    pkfSection: sectionById(lesson.section)?.title || lesson.section,
    crop: a.crop,
    pattern: lesson.pattern || '',
    type: lesson.type,
    purpose: a.purpose,
    solution: a.reveal ? { sourceImage: a.reveal.sourceImage, sourcePage: a.reveal.printed, region: a.reveal.key, figure: a.reveal.figs } : null
  };
}
export function sourceMapRows() { return [...LESSONS, ...EXAM_ITEMS].map((l) => mappingRow(l)); }

// ------------------------------------------------------------------ state
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
export function blank() {
  return {
    sections: {},
    lessons: {},
    physical: {},
    review: {},
    needsPractice: {},
    positionErrors: {},
    skipped: {},
    tableXp: {},
    current: null,
    exam: { attempts: 0, passed: false, bestKnowledge: 0, bestPlanning: 0, bestExecution: 0, bestOverall: 0, history: [], weak: {} },
    stats: {
      knowledgeCorrect: 0, knowledgeWrong: 0, firstTotal: 0, firstCorrect: 0,
      patternAttempts: 0, patternsCompleted: 0, patternsFailed: 0, firstTryRuns: 0,
      positionErrors: 0, shotErrors: 0, sequenceErrors: 0, shotsMade: 0, shotsTotal: 0, posOk: 0, posTotal: 0,
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
    positionErrors: { ...obj(raw.positionErrors) },
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
  const course = courseOf(state);
  return SECTIONS.every((s) => sectionPassed(course, s.id));
}

function emptyItem() {
  return { locked: false, choice: null, build: [], correct: null, solution: false, hint: false, shooting: false, live: [], between: false, attempts: [], execution: null, skipped: false, done: false };
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
export function reviewIds(course) { return Object.keys(course.review || {}).filter((id) => inCourse(id) && isKnowledge(lessonById(id))); }
export function needsPracticeIds(course) { return Object.keys(course.needsPractice || {}).filter((id) => inCourse(id) && isPhysical(lessonById(id))); }
export function positionErrorIds(course) { return Object.keys(course.positionErrors || {}).filter((id) => inCourse(id) && isPhysical(lessonById(id))); }
export function skippedIds(course) { return Object.keys(course.skipped || {}).filter((id) => isPhysical(lessonById(id))); }

/** REVIEW MISSED PATTERNS ('review') / PRACTICE FAILED RUNOUTS ('practice') / REVIEW POSITION ERRORS ('position'). */
export function startReview(state, kind = 'review') {
  const course = courseOf(state);
  const ids = kind === 'practice' ? needsPracticeIds(course) : kind === 'position' ? positionErrorIds(course) : reviewIds(course);
  if (!ids.length) return state;
  course.current = freshRun(ids, { mode: kind === 'practice' || kind === 'position' ? kind : 'review' });
  return put(state, course);
}
/** Open one lesson directly (jump to a trouble pattern). Saves nothing graded. */
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

/** Multiple choice: picks the answer. BUILD THE PATTERN: appends a ball (each ball once). */
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
/** SET UP THE PATTERN → NOW RUN IT. */
export function beginShooting(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson)) return state;
  x.it.shooting = true;
  return put(state, course);
}

/**
 * Record one shot of the current attempt (shot-by-shot tracking).
 *  pos / made on the last shot → next shot or PATTERN COMPLETED;  lost → PATTERN FAILED — POSITION LOST;
 *  miss → PATTERN FAILED — SHOT MISSED;  seq (only for `sequence: true`) → PATTERN FAILED — WRONG SEQUENCE.
 * Max ATTEMPTS_MAX attempts. After a failed attempt the player taps RESET / TRY AGAIN.
 */
export function markShot(state, tag) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson) || !x.it.shooting || x.it.between) return state;
  const { cur, lesson, it, id } = x;
  const t = String(tag);
  const live = Array.isArray(it.live) ? it.live : [];
  const idx = live.length;
  if (!shotTagsFor(lesson, idx).includes(t) || it.attempts.length >= ATTEMPTS_MAX) return state;
  it.live = [...live, t];
  const lastIdx = lesson.physical.shots.length - 1;
  let result = null;
  if (t === 'miss') result = 'missed';
  else if (t === 'lost') result = 'position';
  else if (t === 'seq') result = 'sequence';
  else if (idx === lastIdx) result = 'completed';
  if (!result) return put(state, course);

  const shots = [...it.live];
  it.attempts = [...it.attempts, { shots, result }];
  it.live = [];
  const sv = saves(cur);
  if (sv) {
    const st = course.stats;
    st.patternAttempts += 1;
    for (const s of shots) {
      const info = SHOT_TAGS[s];
      if (info.made != null) { st.shotsTotal += 1; if (info.made) st.shotsMade += 1; }
      if (info.pos != null) { st.posTotal += 1; if (info.pos) st.posOk += 1; }
    }
    if (result === 'position') st.positionErrors += 1;
    if (result === 'missed') st.shotErrors += 1;
    if (result === 'sequence') st.sequenceErrors += 1;
  }
  const success = result === 'completed';
  if (!success && it.attempts.length < ATTEMPTS_MAX) {
    it.between = true;
    return put(state, course);
  }
  it.done = true;
  it.shooting = false;
  it.execution = success ? 'success' : 'failed';
  if (!sv) return put(state, course);
  const n = it.attempts.length;
  const st = course.stats;
  if (success) {
    st.patternsCompleted += 1;
    if (n === 1) st.firstTryRuns += 1;
    st.streak = (st.streak || 0) + 1;
    st.bestStreak = Math.max(st.bestStreak || 0, st.streak);
    if (inCourse(id)) delete course.needsPractice[id];
  } else {
    st.patternsFailed += 1;
    st.streak = 0;
    if (inCourse(id)) course.needsPractice[id] = true;
  }
  if (inCourse(id)) {
    const posLost = it.attempts.filter((a) => a.result === 'position').length;
    if (posLost) course.positionErrors[id] = (course.positionErrors[id] || 0) + posLost;
    else if (success && n === 1) delete course.positionErrors[id];
  }
  const p = { history: [], ...(course.physical[id] || {}) };
  p.history = [...(p.history || []), { at: new Date().toISOString(), attempts: it.attempts.map((a) => ({ shots: [...a.shots], result: a.result })), success, mode: cur.mode }].slice(-30);
  p.best = success ? 'success' : (p.best || 'failed');
  course.physical[id] = p;
  course.lessons[id] = { ...(course.lessons[id] || {}), done: true, skipped: false };
  course.skipped = clearSkipped(course.skipped, id);
  // Recorded table step → Drill XP: one drill session, ratio = successful attempts / attempts (1, 1/2, 1/3 or 0).
  const out = awardRecordedStep(put(state, course), STORAGE_KEY, COURSE_TITLE, lesson, { ratio: success ? 1 / n : 0, passed: success });
  const c2 = out.state[STORAGE_KEY];
  if (c2?.current?.items?.[id]) c2.current.items[id].xp = out.drill;
  return out.state;
}
/** RESET / TRY AGAIN: after a failed attempt starts the next one; mid-attempt it clears an unfinished shot record (re-rack). */
export function resetAttempt(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson)) return state;
  x.it.between = false;
  x.it.live = [];
  return put(state, course);
}

/** SKIP TABLE STEP: not attempted. 0 Drill XP, never a completion or an execution score, never blocks the lesson.
 *  The pattern goes on PRACTICE FAILED RUNOUTS. A skip doesn't break the streak. */
export function skipTableStep(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson)) return state;
  const { cur, it, id } = x;
  it.skipped = true;
  it.execution = null;
  it.shooting = false;
  it.between = false;
  it.live = [];
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

/** "Plan: CORRECT · Run: FAILED ON SHOT 3" for a RUN item (plan = the linked question in the same run, if any). */
export function planRunLine(cur, id) {
  const l = lessonById(id);
  const it = cur?.items?.[id];
  if (!l || !it || !isPhysical(l)) return '';
  const pIt = l.plan ? cur.items[l.plan] : null;
  const plan = !l.plan ? null : !pIt || !pIt.locked ? 'NOT ANSWERED' : pIt.correct ? 'CORRECT' : 'MISSED';
  let run;
  if (it.skipped) run = 'SKIPPED';
  else if (it.execution === 'success') run = 'COMPLETED';
  else if (it.execution === 'failed') {
    const last = it.attempts[it.attempts.length - 1];
    run = `FAILED ON SHOT ${last ? last.shots.length : 1}`;
  } else run = 'NOT RUN';
  return plan ? `Plan: ${plan} · Run: ${run}` : `Run: ${run}`;
}

/** Knowledge, planning and execution scored separately; half/full table and position accuracy; per-section areas. */
export function summarize(cur) {
  let kOk = 0, kTot = 0, pOk = 0, pTot = 0, xOk = 0, xTot = 0, posOk = 0, posTot = 0, shotsMade = 0, shotsTot = 0;
  let hOk = 0, hTot = 0, fOk = 0, fTot = 0, posErr = 0, shotErr = 0, seqErr = 0;
  const missed = [], missedRuns = [], skipped = [], posLost = [];
  const bySection = {};
  const bump = (l, ok) => {
    const b = bySection[l.section] || (bySection[l.section] = { ok: 0, tot: 0 });
    b.tot += 1; if (ok) b.ok += 1;
    if (isHalf(l)) { hTot += 1; if (ok) hOk += 1; } else { fTot += 1; if (ok) fOk += 1; }
  };
  for (const id of cur.order) {
    const l = lessonById(id);
    const it = cur.items[id];
    if (!l || !it) continue;
    if (isKnowledge(l)) {
      kTot += 1;
      if (it.correct) kOk += 1; else missed.push(id);
      if (isPlanning(l)) { pTot += 1; if (it.correct) pOk += 1; }
      bump(l, !!it.correct);
    } else if (isPhysical(l) && it.skipped) {
      skipped.push(id);
    } else if (isPhysical(l)) {
      xTot += 1;
      const ok = it.execution === 'success';
      if (ok) xOk += 1; else missedRuns.push(id);
      bump(l, ok);
      for (const a of it.attempts || []) {
        if (a.result === 'position') posErr += 1;
        if (a.result === 'missed') shotErr += 1;
        if (a.result === 'sequence') seqErr += 1;
        for (const s of a.shots || []) {
          const info = SHOT_TAGS[s];
          if (!info) continue;
          if (info.made != null) { shotsTot += 1; if (info.made) shotsMade += 1; }
          if (info.pos != null) { posTot += 1; if (info.pos) posOk += 1; }
        }
      }
      if ((it.attempts || []).some((a) => a.result === 'position')) posLost.push(id);
    }
  }
  const rate = (a, b) => (b ? a / b : null);
  const kRate = kTot ? kOk / kTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  const areas = Object.entries(bySection).map(([sec, b]) => ({ sec, rate: b.ok / b.tot, tot: b.tot }));
  const byBest = areas.slice().sort((a, b) => b.rate - a.rate || b.tot - a.tot);
  const strongest = byBest.length ? byBest[0].sec : null;
  const weakest = byBest.length > 1 && byBest[byBest.length - 1].rate < byBest[0].rate ? byBest[byBest.length - 1].sec : null;
  const recommend = [...new Set([...missed, ...missedRuns].map((id) => lessonById(id)?.section).filter(Boolean))];
  return {
    kOk, kTot, kRate, pOk, pTot, pRate: rate(pOk, pTot), xOk, xTot, xRate: rate(xOk, xTot),
    hOk, hTot, hRate: rate(hOk, hTot), fOk, fTot, fRate: rate(fOk, fTot),
    posOk, posTot, posRate: rate(posOk, posTot), shotsMade, shotsTot, shotRate: rate(shotsMade, shotsTot),
    posErr, shotErr, seqErr, overall, missed, missedRuns, skipped, posLost, strongest, weakest, recommend
  };
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
    prev.missedRuns = s.missedRuns;
    prev.skipped = s.skipped;
    if (passed) prev.passed = true;
    course.sections[cur.sectionId] = prev;
  } else {
    course.exam.attempts += 1;
    course.exam.bestKnowledge = Math.max(course.exam.bestKnowledge || 0, s.kRate);
    course.exam.bestPlanning = Math.max(course.exam.bestPlanning || 0, s.pRate ?? 0);
    course.exam.bestExecution = Math.max(course.exam.bestExecution || 0, s.xRate ?? 0);
    course.exam.bestOverall = Math.max(course.exam.bestOverall || 0, s.overall);
    if (passed) course.exam.passed = true;
    const weak = { ...(course.exam.weak || {}) };
    for (const id of [...s.missed, ...s.missedRuns]) { const t = lessonById(id)?.title || id; weak[t] = (weak[t] || 0) + 1; }
    course.exam.weak = weak;
    const pc = (v) => (v == null ? null : Math.round(v * 100));
    course.exam.history = [...(course.exam.history || []), {
      at: new Date().toISOString(), knowledge: pc(s.kRate), planning: pc(s.pRate), execution: pc(s.xRate), half: pc(s.hRate), full: pc(s.fRate), position: pc(s.posRate), overall: pc(s.overall), passed, skipped: s.skipped.length
    }].slice(-20);
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
  if (cur.mode === 'review' || cur.mode === 'practice' || cur.mode === 'position') return startReview(cleared, cur.mode);
  if (cur.mode === 'single') return startSingle(cleared, cur.order[0]);
  return cleared;
}
/** From a results screen: replay only what was missed in that run (never changes a pass). */
export function reviewMissed(state, kind = 'review') {
  const course = courseOf(state);
  const cur = course.current;
  const ids = (kind === 'practice' ? [...(cur?.summary?.missedRuns || []), ...(cur?.summary?.skipped || [])] : cur?.summary?.missed) || [];
  const list = ids.filter((id) => inCourse(id) || cur?.mode === 'exam');
  if (!list.length) return state;
  course.current = freshRun(list, { mode: kind === 'practice' ? 'practice' : 'review', dev: !!cur.dev });
  return put(state, course);
}
export function clearCurrent(state) {
  const course = courseOf(state);
  if (!course.current) return state;
  course.current = null;
  return put(state, course);
}

export function passedSectionCount(course) { return SECTIONS.filter((s) => sectionPassed(course, s.id)).length; }

/** Home-screen stats (spec list). Rates are null until there is data. */
export function progressSummary(state) {
  const course = courseOf(state);
  const st = course.stats;
  const k = LESSONS.filter(isKnowledge);
  const pct = (a, b) => (b ? a / b : null);
  const halfL = LESSONS.filter(isHalf);
  const fullL = LESSONS.filter((l) => !isHalf(l));
  return {
    lessonsDone: LESSONS.filter((l) => lessonCompleted(course, l.id)).length,
    lessonsTotal: LESSONS.length,
    questionsAnswered: k.filter((l) => course.lessons[l.id]?.done).length,
    questionsTotal: k.length,
    firstAccuracy: pct(st.firstCorrect, st.firstTotal),
    knowledgeAccuracy: pct(st.knowledgeCorrect, st.knowledgeCorrect + st.knowledgeWrong),
    patternsSolved: k.filter((l) => isPlanning(l) && course.lessons[l.id]?.correct === true).length,
    planningTotal: k.filter(isPlanning).length,
    independentSolved: k.filter((l) => l.assist === 'INDEPENDENT' && course.lessons[l.id]?.correct === true).length,
    independentTotal: k.filter((l) => l.assist === 'INDEPENDENT').length,
    patternAttempts: st.patternAttempts,
    patternsCompleted: st.patternsCompleted,
    firstTryRuns: st.firstTryRuns,
    positionErrors: st.positionErrors,
    shotErrors: st.shotErrors,
    sequenceErrors: st.sequenceErrors,
    bestStreak: st.bestStreak || 0,
    halfDone: halfL.filter((l) => lessonCompleted(course, l.id)).length,
    halfTotal: halfL.length,
    fullDone: fullL.filter((l) => lessonCompleted(course, l.id)).length,
    fullTotal: fullL.length,
    sectionsPassed: passedSectionCount(course),
    sectionsTotal: SECTIONS.length,
    needsPractice: needsPracticeIds(course).length,
    positionReview: positionErrorIds(course).length,
    review: reviewIds(course).length,
    tableSkipped: st.tableSkipped || 0,
    tableDrillXp: st.tableDrillXp || 0,
    examAttempts: course.exam.attempts,
    examBest: course.exam.bestOverall,
    examPassed: !!course.exam.passed
  };
}

export function pkfPatternPlayProgressRows(state) {
  const course = courseOf(state);
  const rows = [];
  const started = !!((course.current && !course.current.dev && course.current.mode !== 'single') || Object.keys(course.sections).length || Object.keys(course.lessons).length);
  if (started) {
    const done = passedSectionCount(course);
    rows.push({ id: 'pkfPatternPlay', name: COURSE_TITLE, href: '#pkfpattern', short: 'PKF Pattern Play', done, total: SECTIONS.length, finished: done >= SECTIONS.length });
  }
  const examStarted = !!(course.exam?.attempts || course.exam?.passed || (course.current && !course.current.dev && course.current.mode === 'exam'));
  if (examStarted) rows.push({ id: 'pkfPatternPlayExam', name: EXAM_TITLE, href: '#pkfpattern/exam', short: 'PKF PP Exam', done: course.exam.passed ? 1 : 0, total: 1, finished: !!course.exam.passed });
  return rows;
}

export function pkfPatternPlayBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfpattern" data-pkfpattern="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${SECTIONS.length} sections from PKF’s Half Table and Full Table Patterns: read the layout, plan the runout, lock it, compare with PKF, then run it on your table.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfpattern/exam" data-pkfpattern="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Pattern planning + original PKF runouts on your table. Pass at ${Math.round(EXAM_PASS * 100)}% (app setting).${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfpattern="exam" data-pkfpattern-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
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
export { regionOf };

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
    if (!l.src || !/Page/.test(l.src)) problems.push(`no source page ${l.id}`);
    if (!l.explain) problems.push(`no explanation ${l.id}`);
    if (!LTYPE[l.type]) problems.push(`bad type ${l.id}`);
    if (!ASSIST[l.assist]) problems.push(`bad assist ${l.id}`);
    if (isKnowledge(l)) {
      if (isBuild(l)) {
        const balls = l.choices?.map((c) => c[0]) || [];
        const ans = String(l.answer || '').split('-');
        if (ans.length !== balls.length || ans.some((b) => !balls.includes(b)) || new Set(ans).size !== ans.length) problems.push(`build answer ${l.id}`);
      } else if (!l.choices?.some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
      if (l.choices && new Set(l.choices.map((c) => c[0])).size !== l.choices.length) problems.push(`duplicate choice ${l.id}`);
    } else if (l.choices || l.answer != null) problems.push(`non-question has choices ${l.id}`);
    if (isPhysical(l)) {
      if (!PHYS[l.physical?.kind]) problems.push(`physical kind ${l.id}`);
      if (!l.physical?.setup?.length || !l.physical?.objective || !l.physical?.shots?.length) problems.push(`physical setup/objective ${l.id}`);
      if (l.plan && !LESSONS.some((x) => x.id === l.plan)) problems.push(`bad plan link ${l.id}`);
    } else if (l.physical) problems.push(`physical on non-run ${l.id}`);
  }
  for (const s of SECTIONS) {
    if (!knowledgeLessons(s.id).length) problems.push(`section without knowledge ${s.id}`);
    const list = lessonsFor(s.id);
    for (let i = 1; i < list.length; i++) if (ORDER[list[i].assist] < ORDER[list[i - 1].assist]) problems.push(`assist order ${list[i].id}`);
  }
  return problems;
}
