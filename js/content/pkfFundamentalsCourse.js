/**
 * PKF Fundamentals Course (+ PKF Fundamentals Exam).
 * Source: PKF Fundamentals pages 2–22 (PDF pages 9–34): Chapter One FUNDAMENTALS and Chapter Two BRIDGES/STANCES.
 * Every lesson cites its printed page; explanations paraphrase or quote PKF. No outside instruction.
 * App mechanics (lock/reveal, 70% section gate, 80% exam pass, self-evaluation ratings, session log)
 * are app infrastructure, not PKF claims. No repetition count is enforced anywhere.
 * See docs/PKF_FUNDAMENTALS_SOURCE_MAP.md.
 */
import { ASSET_MAP, REGIONS, figureHTML, revealFigureHTML, assetOf, regionOf } from './pkfFundAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Fundamentals Course';
export const EXAM_TITLE = 'PKF Fundamentals Exam';
export const STORAGE_KEY = 'pkfFundamentals';
export const HASH = 'pkffund';
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  IDENTIFY: 'VISUAL IDENTIFICATION',
  IMPORTANT: 'WHAT’S IMPORTANT?',
  SEQUENCE: 'SEQUENCE',
  PRACTICE: 'PRACTICE THIS'
};
export const KNOWLEDGE_TYPES = ['IDENTIFY', 'IMPORTANT', 'SEQUENCE'];

/** Self-evaluation sets: [key, label, needsPractice]. The app never validates mechanics. */
export const RATINGS = {
  complete: [['completed', 'COMPLETED', false], ['more', 'NEEDS MORE WORK', true]],
  consistency: [['comfortable', 'COMFORTABLE', false], ['inconsistent', 'INCONSISTENT', true], ['needs', 'NEEDS PRACTICE', true]],
  bridge: [['comfortable', 'COMFORTABLE', false], ['needs', 'NEEDS PRACTICE', true]],
  confirm: [['completed', 'COMPLETED', false], ['notyet', 'NOT YET', true]]
};

export const FLOW = ['LEARN', 'SEE', 'UNDERSTAND', 'CHECK', 'SET UP', 'PRACTICE', 'SELF-EVALUATE'];

export const SECTIONS = [
  { id: 'shooting-line', n: 1, area: 'fundamentals', title: 'Shooting Line & Ghost Ball', blurb: 'The line every stance is built on, using the ghost ball and the cue ball.', pages: '2–3', pdf: '11–12' },
  { id: 'stance', n: 2, area: 'fundamentals', title: 'Building the Stance', blurb: 'Back foot, front foot, legs, stance issues, and the stroke arm on the line.', pages: '3–5', pdf: '12–14' },
  { id: 'forearm-grip', n: 3, area: 'fundamentals', title: 'Forearm & Grip', blurb: 'Forearm hanging naturally, a relaxed grip, thumb position, and grip pressure.', pages: '5–6', pdf: '14–15' },
  { id: 'stroke', n: 4, area: 'fundamentals', title: 'Back Stroke, Forward Stroke & Follow Through', blurb: 'Grip hand below the elbow, slow back-stroke tempo, accelerating through, few moving parts.', pages: '6–9', pdf: '15–18' },
  { id: 'tip-eyes', n: 5, area: 'fundamentals', title: 'Tip Position & Eyes', blurb: 'How close the tip sits when aiming, and where your eyes finish.', pages: '9', pdf: '18' },
  { id: 'stroke-drill', n: 6, area: 'fundamentals', title: 'Putting It Together & the Stroke Drill', blurb: 'PKF’s steps, the tripod, the stroke drill, head still, and the felt line drill.', pages: '10–11', pdf: '19–20' },
  { id: 'stroke-memory', n: 7, area: 'fundamentals', title: 'Stroke Memory & Learning in Steps', blurb: 'Changing a stroke for good, when to compete, and learning the game in steps.', pages: '12–13', pdf: '21–22' },
  { id: 'stances', n: 8, area: 'bridges', title: 'Stances for Hard-to-Reach Shots', blurb: 'Side shot, stretch shot, sitting on the rail or table, and knee on the table.', pages: '14–16', pdf: '25–27' },
  { id: 'open-closed', n: 9, area: 'bridges', title: 'Open & Closed Bridges', blurb: 'The open bridge and both closed-bridge variations.', pages: '16–17', pdf: '27–28' },
  { id: 'tripod', n: 10, area: 'bridges', title: 'Tripod Bridges & Shooting Over a Ball', blurb: 'Closed and open tripod, fingers back for support, bridge close to the ball.', pages: '17–18', pdf: '28–29' },
  { id: 'rail-bridges', n: 11, area: 'bridges', title: 'Rail Bridges', blurb: 'Common and most common rail bridges, room for the back stroke, and distance.', pages: '18–20', pdf: '29–31' },
  { id: 'tight-spots', n: 12, area: 'bridges', title: 'Bridges in Tight Spots', blurb: 'Near the side pocket, alongside the rail, frozen to the rail, and awkward positions.', pages: '20–22', pdf: '31–33' }
];

export const AREAS = [
  { id: 'fundamentals', title: 'Fundamentals', note: 'PKF Chapter One · pages 2–13' },
  { id: 'bridges', title: 'Bridges / Stances', note: 'PKF Chapter Two · pages 14–22' }
];

const COMPLETE = 'complete';
const CONSIST = 'consistency';
const BRIDGE = 'bridge';

const L = [
  // 1 · Shooting Line & Ghost Ball (pages 2–3)
  { id: 'sl-ghost', section: 'shooting-line', type: 'LEARN', assist: 'GUIDED', title: 'The shooting line and the ghost ball', src: 'Page 2 · Figure 1-1', concept: 'Shooting line / ghost ball',
    prompt: 'Read how PKF builds the shooting line.',
    explain: 'PKF: the stance is created around the shooting line, and the shooting line is created using the ghost ball and the cue ball. The ghost ball is an imaginary ball location that represents where the cue ball needs to be to pocket the object ball. In figure 1-1, imagine a line from the center of the pocket opening through the center of the 1 ball. The cue ball needs to end up on that same line when it contacts the object ball. Then imagine a line through the center of the cue ball to the center of the ghost ball (A). PKF uses this line to build the stance on every shot.',
    watch: 'Two lines: pocket through object ball (where the ghost ball sits), then cue ball to ghost ball (the shooting line).' },
  { id: 'sl-straight', section: 'shooting-line', type: 'LEARN', assist: 'GUIDED', title: 'Cut shots and straight-in shots', src: 'Pages 2–3 · Figures 1-2, 1-3', concept: 'Shooting line on cut and straight shots',
    prompt: 'Compare figures 1-2 and 1-3.',
    explain: 'Figure 1-2: to pocket the 9 ball in the corner, PKF visualizes the ghost ball at the point of contact. The shooting line runs through the center of this ghost ball and the center of the cue ball. Figure 1-3: when the object ball and cue ball are straight into the pocket, you don’t need to visualize the ghost ball. Create the shooting line from the center of the object ball through the center of the cue ball, then visualize this line as it extends past the table.',
    watch: 'Straight in: no ghost ball needed. The line is extended past the table, because the stance is built on it.' },
  { id: 'sl-q-ghost', section: 'shooting-line', type: 'IMPORTANT', assist: 'GUIDED', title: 'What is the ghost ball?', src: 'Page 2', concept: 'Ghost ball definition',
    prompt: 'In PKF’s words, what is the ghost ball?',
    hint: 'It is not a real ball on the table.',
    choices: [['imaginary', 'An imaginary ball location that represents where the cue ball needs to be to pocket the object ball'], ['contact', 'The spot on the cue ball where the tip should strike'], ['second', 'A second object ball used as a target'], ['rail', 'The point on the rail the cue ball should hit']], answer: 'imaginary',
    explain: 'PKF: “When we talk about the ghost ball, we’re referring to an imaginary ball location that represents where the cue ball needs to be to pocket the object ball.”' },
  { id: 'sl-seq', section: 'shooting-line', type: 'SEQUENCE', assist: 'ASSISTED', title: 'Build the shooting line (figure 1-1)', src: 'Page 2 · Figure 1-1', concept: 'Shooting line order',
    prompt: 'Put PKF’s figure 1-1 thinking in order. Tap the steps in order, then lock.',
    seq: { items: [['pocket', 'Imagine a line from the center of the pocket opening through the center of the object ball'], ['ghost', 'Visualize the ghost ball, where the cue ball must be on that line at contact'], ['line', 'Imagine a line from the center of the cue ball to the center of the ghost ball (A)'], ['stance', 'Build your stance on that line']], answer: ['pocket', 'ghost', 'line', 'stance'], shown: ['line', 'stance', 'pocket', 'ghost'] },
    explain: 'PKF figure 1-1: line from the center of the pocket opening through the center of the 1 ball → the cue ball must end up on that line at contact (the ghost ball) → line from the center of the cue ball to the center of the ghost ball (A) → “This is the line that I use to build my stance on every shot.”' },
  { id: 'sl-q-straight', section: 'shooting-line', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Straight in to the pocket', src: 'Page 3 · Figure 1-3', concept: 'Straight-in shooting line',
    prompt: 'The object ball and cue ball are straight into the corner pocket (figure 1-3). What does PKF say about the ghost ball?',
    hint: 'Look at where the line already runs.',
    choices: [['none', 'You don’t need to visualize it. Create the shooting line from the center of the object ball through the center of the cue ball'], ['behind', 'Visualize it a full ball behind the object ball'], ['edge', 'Aim at the edge of the object ball instead'], ['skip', 'Straight-in shots don’t use a shooting line']], answer: 'none',
    explain: 'PKF: when both balls are straight in, you don’t need to visualize the ghost ball. You can create the shooting line from the center of the object ball through the center of the cue ball, then visualize this line as it extends past the table.' },
  // 2 · Building the Stance (pages 3–5)
  { id: 'st-feet', section: 'stance', type: 'LEARN', assist: 'GUIDED', title: 'Back foot, then front foot', src: 'Page 3 · Figure 1-4 and foot photos', concept: 'Foot placement on the shooting line',
    prompt: 'Read how PKF places the feet on the shooting line.',
    explain: 'Figure 1-4 shows the shooting line extending past the table. PKF begins by placing the back foot on this shooting line, either at a slight angle or at an angle closer to 90 degrees; turning the foot like this helps provide a bit more stability. Next, step into the shot with the other foot. The front foot will be parallel with the shooting line, or slightly turned in. The four photos on the page show each option.',
    watch: 'Back foot goes on the line first. Front foot: parallel with the line or slightly turned in.' },
  { id: 'st-id-back90', section: 'stance', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which foot position?', src: 'Page 3 · foot photos', concept: 'Back foot turned 90 degrees',
    prompt: 'Caption hidden. Which of PKF’s four foot positions is this photo?',
    hint: 'Look at the angle between the shoe and the line.',
    choices: [['b-slight', 'Back foot slightly turned'], ['b-90', 'Back foot turned 90 degrees'], ['f-par', 'Front foot parallel with line'], ['f-slight', 'Front foot slightly turned']], answer: 'b-90',
    explain: 'PKF caption: BACK FOOT TURNED 90 DEGREES. The back foot goes on the shooting line at a slight angle or at an angle closer to 90 degrees; turning the foot helps provide a bit more stability.' },
  { id: 'st-id-front', section: 'stance', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which foot position?', src: 'Page 3 · foot photos', concept: 'Front foot slightly turned',
    prompt: 'Caption hidden. Which of PKF’s four foot positions is this photo?',
    choices: [['b-slight', 'Back foot slightly turned'], ['b-90', 'Back foot turned 90 degrees'], ['f-par', 'Front foot parallel with line'], ['f-slight', 'Front foot slightly turned']], answer: 'f-slight',
    explain: 'PKF caption: FRONT FOOT SLIGHTLY TURNED. After the back foot, step into the shot with the other foot: parallel with the shooting line, or slightly turned in.' },
  { id: 'st-legs', section: 'stance', type: 'LEARN', assist: 'GUIDED', title: 'Two leg styles', src: 'Page 4 · Figures 1-5, 1-6', concept: 'Leg position',
    prompt: 'Compare figures 1-5 and 1-6.',
    explain: 'PKF: some players prefer locking their back leg and slightly bending their front leg (figure 1-5), while other players prefer slightly bending both legs (figure 1-6). Players who are taller or who tend to play at a faster pace prefer the figure 1-6 type of stance.',
    watch: 'PKF shows both as options. Neither is called wrong.' },
  { id: 'st-id-legs', section: 'stance', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which leg style?', src: 'Page 4 · Figure 1-6', concept: 'Both legs slightly bent',
    prompt: 'Follow the red lines on the legs. Which stance does this figure show?',
    choices: [['both', 'Both legs slightly bent'], ['lock-back', 'Back leg locked, front leg slightly bent'], ['lock-both', 'Both legs locked straight'], ['lock-front', 'Front leg locked, back leg bent']], answer: 'both',
    explain: 'Figure 1-6: slightly bending both legs. PKF: players who are taller or who tend to play at a faster pace prefer this type of stance. Figure 1-5 is the other option, back leg locked and front leg slightly bent.' },
  { id: 'st-issues', section: 'stance', type: 'LEARN', assist: 'GUIDED', title: 'Issues to watch out for', src: 'Page 4 · Figures 1-7, 1-8, 1-9', concept: 'Stance issues',
    prompt: 'Read PKF’s “few issues to watch out for when creating your stance.”',
    explain: 'Figure 1-7: when the back foot is placed on the shooting line it’s too far back, because the stance was started too far away from the table. Figure 1-8: facing away from the shot. The right foot is in the proper place but the left foot faces away, about 90 degrees from the shot, which may cause a bit of instability. Figure 1-9: the back foot has crossed the shooting line by several inches; down in the stance, the stroke is extremely close to the body, which may interfere with the stroking motion.',
    watch: 'Three issues: started too far from the table, facing away from the shot, back foot across the line.' },
  { id: 'st-q-toofar', section: 'stance', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Why is the back foot too far back?', src: 'Page 4 · Figure 1-7', concept: 'Starting distance from the table',
    prompt: 'In figure 1-7 the back foot ends up too far back on the shooting line. What does PKF say caused it?',
    choices: [['far', 'The stance was started too far away from the table'], ['front', 'The front foot was placed first'], ['bridge', 'The bridge was made too long'], ['turned', 'The back foot was turned 90 degrees']], answer: 'far',
    explain: 'PKF: “The reason why this happened is because I started creating my stance too far away from the table.”' },
  { id: 'st-id-crossed', section: 'stance', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Spot the stance issue', src: 'Page 4 · Figure 1-9', concept: 'Back foot crossed the shooting line',
    prompt: 'Look at the two lines and the back foot. Which issue does this figure show?',
    choices: [['crossed', 'The back foot has crossed the shooting line'], ['toofar', 'The back foot is too far back'], ['away', 'Facing away from the shot'], ['ok', 'No issue. This is a correct stance']], answer: 'crossed',
    explain: 'Figure 1-9: the back foot has crossed the shooting line by several inches. PKF: down in the stance, the stroke is extremely close to the body, which may interfere with the stroking motion.' },
  { id: 'st-arm', section: 'stance', type: 'LEARN', assist: 'GUIDED', title: 'Stroke arm on the shooting line', src: 'Page 5 · Figures 1-10, 1-11', concept: 'Stroke arm on the line',
    prompt: 'Compare figures 1-10 and 1-11.',
    explain: 'PKF: in shooting position, the top part of the stroke arm should be on the shooting line. In figure 1-10 it isn’t quite on the line, so PKF repositions and gets down with the arm on the shooting line (figure 1-11). Your stance is always built around this line for every single shot, and the better you become at creating your stance, the more accurate you’ll be in pocketing balls. “Much of the aiming process is done before you even get down on the table.”',
    watch: 'If the arm is off the line, PKF repositions and gets down again.' },
  { id: 'st-q-aim', section: 'stance', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'Why the shooting line matters', src: 'Page 5', concept: 'Aiming begins before you get down',
    prompt: 'Why does PKF say it’s so important to visualize the shooting line?',
    choices: [['stance', 'Your stance is built around it on every shot. Much of the aiming is done before you get down on the table'], ['speed', 'It tells you how hard to hit the shot'], ['bridge', 'It replaces the need for a solid bridge'], ['long', 'It only matters on long shots']], answer: 'stance',
    explain: 'PKF: “Your stance will always be built around this line for every single shot, and the better you become at creating your stance the more accurate you’ll be in pocketing balls. Much of the aiming process is done before you even get down on the table.”' },
  { id: 'st-practice', section: 'stance', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: build your stance', src: 'Pages 3–5 (practiced in the page 10 stroke drill)', concept: 'Stance building',
    prompt: 'At the table, build your stance around the shooting line the way PKF shows.',
    practice: { rating: CONSIST,
      setup: 'Pick a shot. See the shooting line and extend it past the table (figure 1-4).',
      focus: ['Back foot on the shooting line, slightly turned or closer to 90 degrees.', 'Step in with the front foot: parallel with the line or slightly turned in.', 'Leg style: back leg locked with front slightly bent, or both slightly bent.', 'Down on the shot: top part of the stroke arm on the shooting line.'],
      checks: [['toofar', 'Back foot too far back (started too far from the table)'], ['away', 'Facing away from the shot'], ['crossed', 'Back foot crossed the shooting line'], ['arm', 'Stroke arm not on the shooting line']] },
    explain: 'PKF builds the stance around the shooting line on every shot, and lists three issues to watch: starting too far from the table (1-7), facing away from the shot (1-8), and the back foot crossing the line (1-9).' },

  // 3 · Forearm & Grip (pages 5–6)
  { id: 'fg-forearm', section: 'forearm-grip', type: 'LEARN', assist: 'GUIDED', title: 'Forearm hanging naturally', src: 'Page 5 · Figures 1-12, 1-13', concept: 'Forearm position',
    prompt: 'Compare figures 1-12 and 1-13.',
    explain: 'PKF: in shooting position the forearm should be relaxed and hanging naturally below the elbow (figure 1-12). Once the forearm starts moving away from this line, either to the inside or outside, it becomes more challenging to keep the stick on a straight path (figure 1-13). When building the stance, let your body do what it naturally wants to do. This applies to the forearm and also to the grip.',
    watch: 'The white line runs down from the elbow. The forearm should hang on it.' },
  { id: 'fg-id-forearm', section: 'forearm-grip', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which forearm hangs naturally?', src: 'Page 5 · Figures 1-12, 1-13', concept: 'Forearm below the elbow',
    prompt: 'Which figure shows the forearm relaxed and hanging naturally below the elbow?',
    choices: [['f12', 'Figure 1-12 (left)'], ['f13', 'Figure 1-13 (right)']], answer: 'f12',
    explain: 'Figure 1-12: forearm relaxed and hanging naturally below the elbow. Figure 1-13: the forearm has moved away from the line. PKF: once it moves to the inside or outside, it becomes more challenging to keep the stick on a straight path.' },
  { id: 'fg-grip', section: 'forearm-grip', type: 'LEARN', assist: 'GUIDED', title: 'A relaxed grip', src: 'Pages 5–6 · Figure 1-14', concept: 'Grip and thumb',
    prompt: 'Study figure 1-14.',
    explain: 'PKF: in figure 1-14 the grip is relaxed. The cue sits on the fingers and the thumb rests on the side of the cue stick, holding it in place. You never want to put the thumb on top of the cue stick. You always want it off to the side to hold the cue in place.',
    watch: 'Cue on the fingers. Thumb on the side, never on top.' },
  { id: 'fg-hand', section: 'forearm-grip', type: 'LEARN', assist: 'GUIDED', title: 'Don’t turn the hand', src: 'Page 6 · Figures 1-15, 1-16', concept: 'Hand hanging naturally',
    prompt: 'Compare figures 1-15 and 1-16.',
    explain: 'PKF: when making the grip, avoid turning the hand inward or outward as shown in figure 1-15. If you just hang your hand naturally below your forearm without the pool cue, you’ll see that your hand will naturally hang correctly (figure 1-16).',
    watch: 'PKF’s own check: hang the hand without the cue and see where it falls.' },
  { id: 'fg-id-hand', section: 'forearm-grip', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which hand hangs correctly?', src: 'Page 6 · Figures 1-15, 1-16', concept: 'Hand not turned',
    prompt: 'Which figure shows the hand hanging naturally below the forearm, not turned inward or outward?',
    choices: [['f15', 'Figure 1-15 (left)'], ['f16', 'Figure 1-16 (right)']], answer: 'f16',
    explain: 'Figure 1-16: the hand hanging naturally below the forearm. Figure 1-15 shows the turned hand PKF says to avoid.' },
  { id: 'fg-pressure', section: 'forearm-grip', type: 'LEARN', assist: 'GUIDED', title: 'Thumb and grip pressure', src: 'Page 6', concept: 'Grip pressure and thumb direction',
    prompt: 'Read PKF on the thumb and grip pressure.',
    explain: 'Keep the same relaxed position as you hold the cue. The thumb should point downward through the stroking motion. If you finish your stroke and your thumb is pointing toward your body, you have turned your wrist. PKF: “Try to keep your thumb in the same position, throughout the stroke.” The goal for the grip is to remove any unnecessary tension; you want to feel the weight of the cue. One of the biggest mistakes most players make is holding the cue too tightly. Grip pressure should come from the front part of the grip hand while the back fingers apply very little pressure; some players remove their back one or two fingers completely. Grip pressure should remain the same throughout the stroking motion.',
    watch: 'Thumb points down the whole stroke. Pressure from the front of the hand, the same all the way through.' },
  { id: 'fg-q-thumb', section: 'forearm-grip', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Thumb pointing at your body', src: 'Page 6', concept: 'Wrist turn',
    prompt: 'You finish your stroke and your thumb is pointing toward your body. What does PKF say that means?',
    choices: [['wrist', 'You have turned your wrist'], ['back', 'Your grip hand is too far back'], ['good', 'You followed through correctly'], ['bridge', 'Your bridge is too long']], answer: 'wrist',
    explain: 'PKF: the thumb should point downward through the stroking motion. “If you finish your stroke and your thumb is pointing toward your body, this means you have turned your wrist.”' },
  { id: 'fg-q-pressure', section: 'forearm-grip', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Where grip pressure comes from', src: 'Page 6', concept: 'Grip pressure',
    prompt: 'Where should grip pressure come from, according to PKF?',
    choices: [['front', 'The front part of the grip hand, with the back fingers applying very little pressure'], ['back', 'The back fingers, with the front fingers relaxed'], ['even', 'The whole hand squeezing evenly and firmly'], ['thumb', 'The thumb pressing on top of the cue']], answer: 'front',
    explain: 'PKF: “The grip pressure should come from the front part of the grip hand while the back fingers apply very little pressure on the cue stick.” Some players remove their back one or two fingers completely.' },
  { id: 'fg-q-goal', section: 'forearm-grip', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'The goal for the grip', src: 'Page 6', concept: 'Remove tension',
    prompt: 'What does PKF say is the goal for the grip?',
    choices: [['tension', 'Remove any unnecessary tension, so you feel the weight of the cue'], ['squeeze', 'Squeeze harder at impact for control'], ['top', 'Put the thumb on top for alignment'], ['change', 'Change the pressure during the forward stroke']], answer: 'tension',
    explain: 'PKF: “The goal for the grip is to remove any unnecessary tension. You really just want to feel the weight of the cue stick as you hold it.” Holding the cue too tightly is one of the biggest mistakes most players make.' },
  { id: 'fg-practice', section: 'forearm-grip', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: grip hang check', src: 'Pages 5–6 · Figures 1-12 to 1-16', concept: 'Grip and forearm',
    prompt: 'Use PKF’s own check for the hand, then hold the cue the same way.',
    practice: { rating: CONSIST,
      setup: 'Get into your stance. First hang your hand below your forearm without the pool cue.',
      focus: ['PKF: the hand will naturally hang correctly (figure 1-16). Keep that position.', 'Cue sits on the fingers. Thumb on the side, never on top.', 'Forearm relaxed, hanging naturally below the elbow.', 'Pressure from the front of the hand, back fingers very light, the same through the stroke.'],
      checks: [['turned', 'Hand turned inward or outward'], ['top', 'Thumb on top of the cue'], ['tight', 'Holding the cue too tightly'], ['wrist', 'Thumb finished pointing toward my body']] },
    explain: 'PKF: if you hang your hand naturally below your forearm without the pool cue, your hand will naturally hang correctly. Try to keep the same relaxed position as you hold the cue stick.' },
  // 4 · Back Stroke, Forward Stroke & Follow Through (pages 6–9)
  { id: 'sk-slide', section: 'stroke', type: 'LEARN', assist: 'GUIDED', title: 'Grip hand below the elbow', src: 'Pages 6–7 · Figures 1-17 to 1-20', concept: 'Grip hand position on the cue',
    prompt: 'Read how PKF sets the grip hand once the tip is at the cue ball.',
    explain: 'PKF: as the player is down on the shot and puts the tip up to the cue ball (figure 1-17), they should relax the grip hand and slide it below the elbow (figure 1-18). In figure 1-19 the grip hand is too far back on the cue stick, which may restrict the back stroke. In figure 1-20 it is too far forward. By keeping the grip hand relaxed, you can let it slide naturally below the elbow.',
    watch: 'Tip to the cue ball first, then let the relaxed grip hand slide under the elbow.' },
  { id: 'sk-id-grip', section: 'stroke', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Where is the grip hand?', src: 'Page 7 · Figure 1-19', concept: 'Grip hand too far back',
    prompt: 'The tip is at the cue ball (inset). Where is the grip hand in this figure?',
    choices: [['back', 'Too far back on the cue'], ['forward', 'Too far forward on the cue'], ['below', 'Directly below the elbow']], answer: 'back',
    explain: 'Figure 1-19: the grip hand is too far back on the cue stick, which may restrict the back stroke. Figure 1-20 shows it too far forward. PKF: keep the grip hand relaxed and let it slide naturally below the elbow.' },
  { id: 'sk-back', section: 'stroke', type: 'LEARN', assist: 'GUIDED', title: 'Back stroke tempo and the pause', src: 'Page 7', concept: 'Back stroke tempo / pause',
    prompt: 'Read PKF on the back stroke.',
    explain: 'The back stroke should be straight back with a nice, easy tempo. PKF: “It doesn’t matter if you’re shooting a shot easy, medium or hard, your back stroke should always be the same slow tempo.” Some top players have a noticeable pause at the end of the backstroke. It requires practice to perfect the timing, and if you use it you’ll want it to become second nature before playing in competition. You never want to think about stroke mechanics in tournaments or leagues. The more common type is the natural pause: it happens as the back stroke slowly finishes and begins the forward stroke, like someone throwing a softball or horseshoe, without having to think about it.',
    watch: 'Same slow back-stroke tempo on every speed of shot.' },
  { id: 'sk-q-tempo', section: 'stroke', type: 'IMPORTANT', assist: 'GUIDED', title: 'Back stroke on a hard shot', src: 'Page 7', concept: 'Same slow tempo',
    prompt: 'You’re about to shoot a hard shot. What does PKF say about your back stroke?',
    hint: 'PKF puts this sentence in bold.',
    choices: [['same', 'Always the same slow tempo, whether the shot is easy, medium or hard'], ['faster', 'Use a faster back stroke for harder shots'], ['short', 'Use a short, quick back stroke'], ['any', 'Tempo doesn’t matter as long as you follow through']], answer: 'same',
    explain: 'PKF: “It doesn’t matter if you’re shooting a shot easy, medium or hard, your back stroke should always be the same slow tempo.”' },
  { id: 'sk-q-pause', section: 'stroke', type: 'IMPORTANT', assist: 'ASSISTED', title: 'The more common pause', src: 'Page 7', concept: 'Natural pause',
    prompt: 'Which pause does PKF call the more common type?',
    choices: [['natural', 'The natural pause, as the back stroke slowly finishes and begins the forward stroke'], ['noticeable', 'A noticeable, deliberate pause at the end of the backstroke'], ['impact', 'A pause at impact with the cue ball'], ['none', 'No pause of any kind']], answer: 'natural',
    explain: 'PKF: “The more common type of pause is the natural pause.” It happens naturally, like someone throwing a softball or horseshoe. A noticeable pause, used by some top players, takes practice to perfect the timing.' },
  { id: 'sk-forward', section: 'stroke', type: 'LEARN', assist: 'GUIDED', title: 'Forward stroke and follow through', src: 'Pages 7–8 · Figures 1-21, 1-22', concept: 'Acceleration / follow through',
    prompt: 'Read PKF on the forward stroke, then the follow-through experiment.',
    explain: 'As the forward motion begins, grip pressure should remain consistent. The speed of the forward stroke should gradually ramp up to prevent any tightening of the grip hand. The cue should be accelerating on the forward stroke, reaching the optimum speed at impact. Even though it slows slightly on contact, keep the stick moving forward through the cue ball, as level as possible through the impact area. This is called following through. PKF’s experiment: put a ball on the spot and shoot it into the corner pocket at medium or medium hard speed. The cue should drive through the cue ball and gradually come to a stop a few inches beyond the spot (figure 1-21). An abbreviated follow through (figure 1-22) means you tightened up at impact.',
    watch: 'Gradual acceleration, consistent grip pressure, stick keeps going through the ball.' },
  { id: 'sk-id-follow', section: 'stroke', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which follow through?', src: 'Page 8 · Figures 1-21, 1-22', concept: 'Abbreviated follow through',
    prompt: 'Both photos show where the stick stopped after PKF’s spot experiment. Which one shows the abbreviated follow through that means you tightened up at impact?',
    choices: [['f21', 'Figure 1-21 (left)'], ['f22', 'Figure 1-22 (right)']], answer: 'f22',
    explain: 'Figure 1-22: abbreviated follow through, meaning you tightened up at impact. In figure 1-21 the stick drives through the cue ball and gradually comes to a stop a few inches beyond the spot.' },
  { id: 'sk-q-tight', section: 'stroke', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Why tightening up hurts', src: 'Page 8', concept: 'Tightening before impact',
    prompt: 'To stop the stick right after impact, the grip hand has to start tightening just before contact. What does PKF say that can cause?',
    choices: [['offline', 'The stick may go off the shooting line, causing a mishit'], ['speed', 'Too much speed on the cue ball'], ['long', 'A back stroke that is too long'], ['nothing', 'Nothing, as long as the bridge is solid']], answer: 'offline',
    explain: 'PKF: “This change in grip pressure just prior to striking the cue ball may cause the stick to go off the shooting line causing a mishit.” Being able to follow through correctly removes this hesitation.' },
  { id: 'sk-elbow', section: 'stroke', type: 'LEARN', assist: 'ASSISTED', title: 'Elbow drop and moving parts', src: 'Pages 8–9', concept: 'Few moving parts',
    prompt: 'Read PKF on elbow drop.',
    explain: 'Some players have a significant elbow drop while others have very little elbow movement. PKF: “Ideally, you want as few moving parts as possible during the stroke; the more moving parts means the more things that can go wrong.” All the parts have to be in sync. Players with a significant elbow drop usually developed it when first learning, so it’s part of their muscle memory, and even compact strokes may drop the elbow a little on stretch shots or certain power shots. PKF: there is very little difference between the styles when it comes to the cue driving through the cue ball. If you plan on a significant elbow drop, plan on many hours of practice to perfect the timing. Players who manufacture an elbow drop sometimes drop the elbow before impact, which results in hitting higher on the cue ball.',
    watch: 'PKF’s ideal: as few moving parts as possible.' },
  { id: 'sk-q-parts', section: 'stroke', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'The ideal stroke', src: 'Page 8', concept: 'Few moving parts',
    prompt: 'What does PKF say is ideal during the stroke?',
    choices: [['few', 'As few moving parts as possible'], ['drop', 'A big elbow drop on every shot'], ['quick', 'A quick back stroke'], ['tight', 'Tightening the grip at impact']], answer: 'few',
    explain: 'PKF: “Ideally, you want as few moving parts as possible during the stroke; the more moving parts means the more things that can go wrong. All the parts have to be in sync with each other when performing the stroke.”' },
  { id: 'sk-practice', section: 'stroke', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: follow-through experiment', src: 'Pages 7–8 · Figures 1-21, 1-22', concept: 'Follow through',
    prompt: 'Try PKF’s experiment to see if you tighten up at impact.',
    practice: { rating: COMPLETE,
      setup: 'Put a ball on the spot and shoot it into the corner pocket at medium or medium hard speed.',
      focus: ['Back stroke: straight back, the same slow tempo.', 'Forward stroke: gradually ramp up speed, grip pressure consistent.', 'Watch the stick: it should drive through the cue ball and gradually stop a few inches beyond the spot (figure 1-21).', 'An abbreviated follow through (figure 1-22) means you tightened up at impact.'],
      checks: [['short', 'Follow through was abbreviated'], ['tight', 'Grip tightened at impact'], ['fast', 'Back stroke was too fast']] },
    explain: 'PKF: “Here’s an experiment you can try to see if you have a tendency to tighten up at impact.” The cue stick should drive through the cue ball and gradually come to a stop a few inches beyond the spot.' },

  // 5 · Tip Position & Eyes (page 9)
  { id: 'te-tip', section: 'tip-eyes', type: 'LEARN', assist: 'GUIDED', title: 'Tip close to the cue ball', src: 'Page 9 · Figures 1-24, 1-25', concept: 'Tip distance when aiming',
    prompt: 'Read why PKF wants the tip close to the cue ball when aiming.',
    explain: 'PKF: one issue to watch out for, if you have minimal elbow drop, is not putting the tip close enough to the cue ball when aiming. In figure 1-24 the tip isn’t very close to the cue ball. The optimum speed is reached when the grip hand is below the elbow during the forward stroke (figure 1-25), and that speed has to be maintained until the tip reaches the cue ball. If the tip is too far away, the stick may be slowing down by the time it reaches the cue ball. When aiming, try to get the tip fairly close to the cue ball, usually less than one cube of chalk away. Your aim improves, and you have a much better chance of hitting the cue ball where you’re aiming.',
    watch: 'Usually less than one cube of chalk away.' },
  { id: 'te-id-tip', section: 'tip-eyes', type: 'IDENTIFY', assist: 'ASSISTED', title: 'What is wrong here?', src: 'Page 9 · Figure 1-24', concept: 'Tip too far from the cue ball',
    prompt: 'This is PKF’s figure 1-24, taken while aiming. What issue does it show?',
    choices: [['far', 'The tip isn’t very close to the cue ball'], ['touch', 'The tip is touching the cue ball'], ['bridge', 'The bridge is too far forward'], ['grip', 'The grip hand is too far forward']], answer: 'far',
    explain: 'PKF: in figure 1-24 the tip of the cue stick isn’t very close to the cue ball. If the tip is too far away, the stick may be slowing down by the time it reaches the cue ball.' },
  { id: 'te-q-chalk', section: 'tip-eyes', type: 'IMPORTANT', assist: 'ASSISTED', title: 'How close is close?', src: 'Page 9', concept: 'Less than one cube of chalk',
    prompt: 'When aiming, how close does PKF say to get the tip to the cue ball?',
    choices: [['chalk', 'Fairly close, usually less than one cube of chalk away'], ['foot', 'About a foot away'], ['touch', 'Touching the cue ball'], ['two', 'Exactly two cubes of chalk away']], answer: 'chalk',
    explain: 'PKF: “When aiming, try to get the tip fairly close to the cue ball, usually less than one cube of chalk away.” Your aim improves, and you have a much better chance of hitting the cue ball where you’re aiming.' },
  { id: 'te-eyes', section: 'tip-eyes', type: 'LEARN', assist: 'GUIDED', title: 'Where your eyes finish', src: 'Page 9', concept: 'Eye pattern',
    prompt: 'Read PKF on where players look.',
    explain: 'As the player gets down and begins aiming, the eyes go back and forth from the object ball to the cue ball. When everything looks lined up, they stroke. Some people look at the cue ball last, focused on hitting it exactly where they’re aiming. The majority of players look at the object ball last; they feel more comfortable seeing it while stroking. Others look at the cue ball during the back stroke, then shift to the object ball as the forward stroke begins, which usually gives a more noticeable pause. PKF: find a way that’s comfortable for you. “There is no wrong way to do it.”',
    watch: 'PKF does not mandate one way. Most players finish on the object ball.' },
  { id: 'te-q-eyes', section: 'tip-eyes', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'Look at which ball last?', src: 'Page 9', concept: 'No wrong way',
    prompt: 'Where does PKF say you must look last before stroking?',
    choices: [['comfort', 'There’s no wrong way. Find what’s comfortable (most players look at the object ball last)'], ['cue', 'Always the cue ball'], ['tip', 'Always the cue tip'], ['pocket', 'Always the pocket']], answer: 'comfort',
    explain: 'PKF: the majority of players look at the object ball last; some look at the cue ball last. “Find a way that’s comfortable for you… There is no wrong way to do it.”' },
  // 6 · Putting It Together & the Stroke Drill (pages 10–11)
  { id: 'sd-steps', section: 'stroke-drill', type: 'LEARN', assist: 'GUIDED', title: 'Put it all together', src: 'Page 10 · Figures 1-27, 1-28, 1-29', concept: 'Stance steps',
    prompt: 'Read PKF’s steps.',
    explain: 'PKF: “So if we put it all together here are the steps.” Place the back foot on the shooting line, at a slight angle or closer to 90 degrees. Step into the shot with the other foot, parallel with the shooting line or slightly turned in. Create the bridge before getting down on the table (figure 1-27); the fewer things you have to do once you’re on the table, the better. As you bend forward onto the table, move your hips back to give clearance for the stroking arm (figure 1-28). The bridge on the table becomes the third part of a tripod along with both legs (figure 1-29). Apply slight pressure to the cue as you perform the back stroke; the cue drives forward through the cue ball and the tip slowly comes to a stop on or near the table felt.',
    watch: 'Bridge made while standing. Hips back for clearance. Legs + bridge = tripod.' },
  { id: 'sd-seq', section: 'stroke-drill', type: 'SEQUENCE', assist: 'ASSISTED', title: 'PKF’s steps, in order', src: 'Page 10', concept: 'Stance steps order',
    prompt: 'Tap PKF’s steps in order, then lock.',
    seq: { items: [['back', 'Place your back foot on the shooting line'], ['front', 'Step into the shot with your other foot'], ['bridge', 'Create the bridge before getting down on the table'], ['hips', 'Bend forward, moving your hips back for stroking-arm clearance'], ['tripod', 'Place the bridge on the table: the third part of the tripod']], answer: ['back', 'front', 'bridge', 'hips', 'tripod'], shown: ['bridge', 'tripod', 'back', 'hips', 'front'] },
    explain: 'PKF page 10: back foot on the shooting line → step in with the other foot → create the bridge before getting down (1-27) → bend forward, hips back for clearance (1-28) → bridge on the table as the third part of the tripod (1-29).' },
  { id: 'sd-q-bridge', section: 'stroke-drill', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Why make the bridge standing up?', src: 'Page 10 · Figure 1-27', concept: 'Fewer things on the table',
    prompt: 'Figure 1-27: PKF creates the bridge before getting down on the table. Why?',
    choices: [['fewer', 'The fewer things you have to do once you’re on the table, the better'], ['look', 'It looks more professional'], ['rule', 'The rules require it'], ['speed', 'It lets you shoot faster']], answer: 'fewer',
    explain: 'PKF: “We then create the bridge before getting down on the table (1-27). The fewer things you have to do once you’re on the table, the better.”' },
  { id: 'sd-id-tripod', section: 'stroke-drill', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Three highlighted points', src: 'Page 10 · Figure 1-29', concept: 'The tripod',
    prompt: 'Figure 1-29 highlights three points. What does PKF call them together?',
    choices: [['tripod', 'A tripod: both legs plus the bridge'], ['bridge3', 'The three pressure fingers of a bridge'], ['line', 'Three points on the shooting line'], ['stretch', 'A stretch-shot stance']], answer: 'tripod',
    explain: 'PKF: “When we place our bridge on the table it becomes the third part of our tripod along with both legs (figure 1-29).”' },
  { id: 'sd-drill', section: 'stroke-drill', type: 'LEARN', assist: 'GUIDED', title: 'PKF’s stroke drill', src: 'Pages 10–11 · Figures 1-30, 1-31', concept: 'Stroke drill',
    prompt: 'Read the stroke drill PKF uses to fine-tune stroke and stance.',
    explain: 'Place a ball on the spot and imagine the shooting line from the center of the ball to the center of the pocket opening. Create your stance using this line (figure 1-30). Create your bridge while standing, then slowly bend down onto the shot keeping your head on the line. Down on the table, your forearm and grip hand should hang naturally below your elbow (figure 1-31). On the back stroke pull the cue all the way back on a straight line, and concentrate on a smooth transition between the back stroke and forward stroke. Allow the cue to slowly accelerate, reaching proper speed at impact. Try to keep your head still until the ball reaches the pocket. With no position to worry about, all your focus is on stroke and stance.',
    watch: 'No cue-ball position to think about, just stroke and stance.' },
  { id: 'sd-monitor', section: 'stroke-drill', type: 'LEARN', assist: 'GUIDED', title: 'What to monitor', src: 'Page 11', concept: 'Self-check list / head still',
    prompt: 'Read PKF’s list of problems to monitor during the drill.',
    explain: 'PKF: you can now monitor your mechanics for any problems such as: Is your forearm turned inward or outward? Is your wrist turned? Is your back stroke too fast? Does your thumb turn on the forward stroke? Do you follow through on a straight line? Is there any head movement during the stroke? PKF: “When practicing, keep your head still until the ball reaches the pocket.” Moving your head has no effect after you strike the cue ball, but if it becomes a habit your body begins to tighten up in anticipation before striking. On some shots, head movement may begin during the early forward stroke and affect where the tip strikes the cue ball.',
    watch: 'These six questions are PKF’s own checklist. The app uses them for your self-check.' },
  { id: 'sd-q-head', section: 'stroke-drill', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Why keep your head still?', src: 'Page 11', concept: 'Head movement',
    prompt: 'Moving your head has no effect on the shot after you strike the cue ball. Why does PKF still want it still until the ball reaches the pocket?',
    choices: [['habit', 'As a habit, your body tightens up in anticipation, and early head movement can affect where the tip strikes'], ['path', 'It changes the object ball’s path after contact'], ['look', 'Only so the stroke looks smooth'], ['rule', 'It’s a rule in league play']], answer: 'habit',
    explain: 'PKF: if head movement becomes a habit, your body will begin to tighten up in anticipation of it before striking the cue ball. On some shots it may begin during the early part of the forward stroke, which affects where your tip strikes the cue ball.' },
  { id: 'sd-felt', section: 'stroke-drill', type: 'LEARN', assist: 'ASSISTED', title: 'The felt line drill', src: 'Page 11 · Figures 1-32, 1-33', concept: 'Straight follow through',
    prompt: 'Read how PKF fixes a follow through that is short or off the line.',
    explain: 'When some students first do the stroke drill, the follow through is too short or off the line on one side or the other (figure 1-32). PKF uses a piece of felt with a line down the middle (figure 1-33). The back stroke and forward stroke should stay on the line. After striking the ball, the tip should continue along the line and finish above or on the line. At first a student may have to manually force the stick to stay on the line. PKF: “after several hundred shots their stroke will begin to follow through naturally.” Focus on consistent grip pressure throughout the stroke and avoid tightening the grip at impact. Once stroke and stance feel more natural, a variation: throw balls out on the table and shoot them one by one (no cue ball) to practice your stance with various types of shots.',
    watch: 'Tip finishes above or on the line. Grip pressure stays consistent.' },
  { id: 'sd-id-flaw', section: 'stroke-drill', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Spot the stroke flaw', src: 'Page 11 · Figure 1-32', concept: 'Follow through off the line',
    prompt: 'Follow the white line from the spot. What flaw does this figure show?',
    choices: [['offline', 'Follow through off the line'], ['bridge', 'Bridge too close to the ball'], ['thumb', 'Thumb pointing away from the shot'], ['grip', 'Grip hand too far forward']], answer: 'offline',
    explain: 'Figure 1-32: the follow through is off the line. PKF: some students’ follow through is either too short or off the line on one side or the other; the felt line drill (figure 1-33) is PKF’s fix.' },
  { id: 'sd-practice-drill', section: 'stroke-drill', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: PKF stroke drill', src: 'Pages 10–11', concept: 'Stroke drill',
    prompt: 'Run PKF’s stroke drill on your table.',
    practice: { rating: CONSIST,
      setup: 'Ball on the spot. Imagine the shooting line from the center of the ball to the center of the pocket opening.',
      focus: ['Create your stance on the line. Create the bridge while standing, then bend down keeping your head on the line.', 'Forearm and grip hand hanging naturally below the elbow.', 'Pull the cue all the way back on a straight line; smooth transition to the forward stroke.', 'Slowly accelerate to proper speed at impact. Keep your head still until the ball reaches the pocket.'],
      checks: [['forearm', 'Forearm turned inward or outward'], ['wrist', 'Wrist turned'], ['fast', 'Back stroke too fast'], ['thumb', 'Thumb turned on the forward stroke'], ['line', 'Follow through not on a straight line'], ['head', 'Head movement during the stroke']] },
    explain: 'PKF: “Since you don’t have to worry about playing position, all of your focus can be on your stroke and your stance.” The six checks are PKF’s own list of problems to monitor.' },
  { id: 'sd-practice-felt', section: 'stroke-drill', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: felt line drill', src: 'Page 11 · Figure 1-33', concept: 'Straight follow through',
    prompt: 'Use a piece of felt with a line down the middle, as in figure 1-33.',
    practice: { rating: COMPLETE,
      setup: 'Lay a piece of felt with a line down the middle under the ball, as in figure 1-33.',
      focus: ['Back stroke and forward stroke stay on the line.', 'After striking the ball, the tip continues along the line and finishes above or on the line.', 'Keep grip pressure consistent through the stroke. Avoid tightening the grip at impact.'],
      checks: [['offline', 'Follow through off the line'], ['short', 'Follow through too short'], ['tight', 'Grip tightened at impact']],
      pkfNote: 'PKF: at first you may have to force the stick to stay on the line, but “after several hundred shots their stroke will begin to follow through naturally.” The app does not set a count. It logs your sessions.' },
    explain: 'PKF page 11: back stroke and forward stroke stay on the line; the tip finishes above or on the line; focus on consistent grip pressure and avoiding tightening at impact.' },
  { id: 'sd-practice-oneball', section: 'stroke-drill', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: one ball, no cue ball', src: 'Pages 11–12', concept: 'Stance with various shots',
    prompt: 'PKF’s variation once stroke and stance start to feel more natural.',
    practice: { rating: CONSIST,
      setup: 'Throw balls out on the table and shoot them one by one, with no cue ball.',
      focus: ['Build the stance on each new shooting line.', 'Same stroke-drill focus: straight back stroke, smooth transition, head still until the ball reaches the pocket.'] },
    explain: 'PKF: this “allows you to practice your stance with various types of shots.” For players new to the game, PKF suggests shooting just one ball (no cue ball) until the fundamentals are down.' },

  // 7 · Stroke Memory & Learning in Steps (pages 12–13)
  { id: 'sm-memory', section: 'stroke-memory', type: 'LEARN', assist: 'GUIDED', title: 'Making a stroke change permanent', src: 'Page 12', concept: 'Muscle memory',
    prompt: 'Read PKF on correcting stroke mechanics.',
    explain: 'PKF tells students to avoid playing leagues or tournaments while correcting stroke issues. You don’t want to think about stroke mechanics in competition; over time you mentally break down and go back to old habits. PKF: before corrections can become muscle memory “you will have to perform the new stroke hundreds, perhaps thousands of times.” If you change something and perform only one or two hundred shots with it, you haven’t changed anything permanently. “Permanent change will only happen after you’ve hit thousands of balls with these new stroke mechanics.” Once you can perform the new stroke without having to think about the mechanics, you’re ready to play leagues or tournaments again.',
    watch: 'These are PKF’s descriptions of how change happens. The app does not set a shot count.' },
  { id: 'sm-q-ready', section: 'stroke-memory', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Ready to compete again?', src: 'Page 12', concept: 'Ready to compete',
    prompt: 'You’re correcting your stroke. When does PKF say you’ll be ready to play leagues or tournaments again?',
    choices: [['nothink', 'Once you can perform the new stroke without having to think about the mechanics'], ['200', 'After one or two hundred shots'], ['session', 'After one good practice session'], ['now', 'Right away, since competition helps the change stick']], answer: 'nothink',
    explain: 'PKF: “Once you can perform this new stroke without having to think about the mechanics, then you’ll be ready to play leagues or tournaments again.” One or two hundred shots doesn’t change anything permanently.' },
  { id: 'sm-steps', section: 'stroke-memory', type: 'LEARN', assist: 'GUIDED', title: 'Learn the game in steps', src: 'Page 12', concept: 'Learning order',
    prompt: 'Read PKF’s advice for players new to the game.',
    explain: 'If you’re new to pool, PKF suggests shooting just one ball (no cue ball) until you get your fundamentals down. Many new players try to pocket balls right away and their focus goes away from proper fundamentals, which is when bad habits may begin. PKF: “to become a strong pool player you have to learn the game in steps: fundamentals, ball pocketing, and then position play.” Work hard on your stroke fundamentals and don’t move on to ball pocketing or center ball positioning until you can perform the stroke drill correctly automatically. The stick should stay on the shooting line on its own; it should be effortless.',
    watch: 'PKF’s gate: the stroke drill done correctly, automatically.' },
  { id: 'sm-seq', section: 'stroke-memory', type: 'SEQUENCE', assist: 'ASSISTED', title: 'Learn the game in steps', src: 'Page 12', concept: 'Learning order',
    prompt: 'Put PKF’s steps for learning the game in order.',
    seq: { items: [['fund', 'Fundamentals'], ['pocket', 'Ball pocketing'], ['position', 'Position play']], answer: ['fund', 'pocket', 'position'], shown: ['position', 'fund', 'pocket'] },
    explain: 'PKF: “you have to learn the game in steps: fundamentals, ball pocketing, and then position play.”' },
  { id: 'sm-q-move', section: 'stroke-memory', type: 'IMPORTANT', assist: 'ASSISTED', title: 'When to move on', src: 'Page 12', concept: 'Stroke drill done automatically',
    prompt: 'What does PKF want before you move on to ball pocketing or center ball positioning?',
    choices: [['auto', 'You can perform the stroke drill correctly, automatically'], ['run', 'You can run a rack'], ['week', 'A week of practice'], ['spin', 'You can use sidespin']], answer: 'auto',
    explain: 'PKF: “don’t move on to ball pocketing or center ball positioning until you can perform the stroke drill correctly automatically. The stick should stay on the shooting line on its own - it should be effortless.”' },
  { id: 'sm-story', section: 'stroke-memory', type: 'LEARN', assist: 'ASSISTED', title: 'The “crooked stroke” example', src: 'Pages 12–13', concept: 'Stroke is one piece',
    prompt: 'Read PKF’s student example.',
    explain: 'A player complained his stroke would twist or go off line on some shots. On easy shots his stroke was fine; on shots that needed good cue ball control for position he tried to steer the cue ball. It wasn’t his stroke: it was a lack of trust in his cue ball control. He was playing incorrect angles and patterns, creating tough positional shots. PKF tracked which positional shots caused the problem and had him practice them the proper way; once he trusted the cue ball would end up in the right area, he stopped steering. PKF: creating strong fundamentals is only one small piece of becoming a strong player. Some players wrongly assume a lack of improvement must be a flaw in their stroke and keep tweaking it.',
    watch: 'Not every crooked stroke is a stroke problem.' },
  { id: 'sm-q-story', section: 'stroke-memory', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'What was really wrong?', src: 'Page 12', concept: 'Steering the cue ball',
    prompt: 'In PKF’s crooked-stroke example, what was actually sending the stick off line?',
    choices: [['trust', 'A lack of trust in his cue ball control. He was steering the cue ball'], ['grip', 'His grip was too tight'], ['foot', 'His back foot crossed the shooting line'], ['bridge', 'His bridge was loose']], answer: 'trust',
    explain: 'PKF: “it wasn’t his stroke that was the issue, it was a lack of trust in his cue ball control that would send the cue stick off line since he was trying to steer the cue ball.”' },
  { id: 'sm-all', section: 'stroke-memory', type: 'LEARN', assist: 'INDEPENDENT', title: 'One piece of the puzzle', src: 'Page 13', concept: 'All aspects of the game',
    prompt: 'Read PKF’s list of what it takes to reach a high level.',
    explain: 'PKF: to reach a high level you have to work hard on all aspects of the game: Shot Repertoire, Pattern Play, Center Ball Positioning, Correct Angles, and Ball Pocketing. Work hard on your stroke mechanics before moving on to ball pocketing and center ball positioning. Creating a consistent stroke is only one piece of the puzzle.',
    watch: 'PKF lists these as later parts of the game. This course stays on fundamentals.' },
  // 8 · Stances for Hard-to-Reach Shots (pages 14–16)
  { id: 'bs-choices', section: 'stances', type: 'LEARN', assist: 'GUIDED', title: 'Three choices for a long reach', src: 'Page 14 · Figures 2-1 to 2-4', concept: 'Stretch / side / mechanical bridge',
    prompt: 'Read the chapter opener and figure 2-1.',
    explain: 'PKF: “Don’t shoot any shot until your bridge is rock solid.” In figure 2-1 the player is shooting the 2 ball and has three choices: a stretch shot, a side shot, or the mechanical bridge. How you shoot it depends on what you plan to do with the cue ball. If you simply need to stop the cue ball or roll forward a few inches, a stretch shot or the mechanical bridge will work fine (figure 2-2). If you need to apply a good stroke, you may want to try a side shot: press both legs against the table (figure 2-3) and bend over raising the back leg (figure 2-4). It requires some flexibility and balance. A common mistake is shooting too quickly because the stance isn’t comfortable. PKF: “If you are stretching or balancing on one leg, that is all the more reason to take more time on your shot.”',
    watch: 'Stretching or on one leg: take more time, not less.' },
  { id: 'bs-q-choose', section: 'stances', type: 'IMPORTANT', assist: 'ASSISTED', title: 'A good stroke from a long reach', src: 'Page 14 · Figure 2-1', concept: 'Choosing the side shot',
    prompt: 'Figure 2-1: you need to apply a good stroke to the cue ball. Which option does PKF say you may want to try?',
    choices: [['side', 'A side shot'], ['mech', 'The mechanical bridge'], ['stretch', 'A stretch shot'], ['one', 'Standing on one foot behind the table']], answer: 'side',
    explain: 'PKF: if you simply need to stop the cue ball or roll it forward a few inches, a stretch shot or mechanical bridge will work fine. “If you need to apply a good stroke to the cue ball, you may want to try a side shot.”' },
  { id: 'bs-id-side', section: 'stances', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Name the stance', src: 'Page 15 · Figure 2-4', concept: 'Side shot',
    prompt: 'Which stance is this player using?',
    choices: [['side', 'Side shot: legs pressed against the table, back leg raised'], ['stretch', 'Stretch shot: back leg on the floor, front leg lifted'], ['sit', 'Sitting on the rail, back foot on the floor'], ['knee', 'Knee on the table']], answer: 'side',
    explain: 'Figure 2-4: the side shot. PKF: press both legs against the table (2-3) and bend over raising the back leg (2-4). In the stretch shot (2-5) the back leg stays on the floor and the front leg lifts.' },
  { id: 'bs-q-time', section: 'stances', type: 'IMPORTANT', assist: 'GUIDED', title: 'Balancing on one leg', src: 'Page 14', concept: 'Take more time',
    prompt: 'You’re stretching or balancing on one leg. What does PKF say?',
    hint: 'PKF says the common mistake on these shots is shooting too quickly.',
    choices: [['time', 'That is all the more reason to take more time on your shot'], ['quick', 'Shoot quickly before you lose your balance'], ['soft', 'Always shoot it softly'], ['never', 'Never shoot from one leg']], answer: 'time',
    explain: 'PKF: “If you are stretching or balancing on one leg, that is all the more reason to take more time on your shot.”' },
  { id: 'bs-stretch', section: 'stances', type: 'LEARN', assist: 'GUIDED', title: 'The stretch shot', src: 'Page 15 · Figures 2-5, 2-6', concept: 'Stretch shot',
    prompt: 'Study figures 2-5 and 2-6.',
    explain: 'In figure 2-5 the player is shooting the 9 ball but the cue ball is near the other side rail. He presses both legs against the side of the table and bends over toward the shot. This time he keeps his back leg on the floor and lifts his front leg off the floor. Depending on your height, you may need to stretch your back leg by pushing off with the front part of your foot (figure 2-6).',
    watch: 'Stretch shot: back leg stays down, front leg lifts.' },
  { id: 'bs-sit', section: 'stances', type: 'LEARN', assist: 'GUIDED', title: 'Sit on the rail or table', src: 'Pages 15–16 · Figures 2-7 to 2-12', concept: 'Sitting stance',
    prompt: 'Read PKF’s more stable options for stretching over a ball or near a rail.',
    explain: 'Figure 2-7: a stretch shot that also shoots over a ball. Many players create an unstable stance and shoot too quickly. A better way is to sit on the end rail keeping your back foot on the floor (figure 2-8); you can get closer to the cue ball for a more stable bridge. Figure 2-9: object ball near the corner pocket, cue ball near the rail; you can’t get properly lined up, but sitting on the table with your back foot on the floor gets you closer (figure 2-10). Figure 2-11: near the side rail, shooting over a ball, some players balance on one foot. PKF’s more stable way is to sit on the table keeping your back foot on the floor (figure 2-12).',
    watch: 'Every sitting option keeps the back foot on the floor.' },
  { id: 'bs-q-sit', section: 'stances', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Over a ball near the side rail', src: 'Page 16 · Figure 2-11', concept: 'Sit, back foot down',
    prompt: 'Figure 2-11: near the side rail, shooting over a ball. Instead of balancing on one foot, what does PKF suggest?',
    choices: [['sit', 'Sit on the table keeping your back foot on the floor'], ['quick', 'Balance on one foot and shoot quickly'], ['closed', 'Switch to a closed bridge and stay standing'], ['mech', 'Always use the mechanical bridge']], answer: 'sit',
    explain: 'PKF: “A more stable way to shoot this shot would be to sit on the table keeping your back foot on the floor (2-12). This allows you to be a bit more stable when you perform this shot.”' },
  { id: 'bs-knee', section: 'stances', type: 'LEARN', assist: 'GUIDED', title: 'Knee on the table', src: 'Page 16 · Figures 2-13, 2-14', concept: 'Knee on the table',
    prompt: 'Study figures 2-13 and 2-14.',
    explain: 'In the last example (figure 2-13), the player is shooting the 8 ball but can’t reach the cue ball from the end rail. PKF: he would put his right knee on the table, which lets him get closer to the cue ball (figure 2-14).',
    watch: 'Used when the cue ball can’t be reached from the rail.' },
  { id: 'bs-id-knee', section: 'stances', type: 'IDENTIFY', assist: 'INDEPENDENT', title: 'Name the stance', src: 'Page 16 · Figure 2-14', concept: 'Knee on the table',
    prompt: 'Which of PKF’s stances is shown here?',
    choices: [['knee', 'Knee on the table'], ['side', 'Side shot'], ['stretch', 'Stretch shot'], ['sit', 'Sitting on the end rail']], answer: 'knee',
    explain: 'Figure 2-14: the player can’t reach the cue ball from the end rail, so he puts his right knee on the table to get closer to the cue ball.' },
  { id: 'bs-practice', section: 'stances', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: hard-to-reach stances', src: 'Pages 14–16 (practice method page 21)', concept: 'Stances',
    prompt: 'Place the cue ball where you have to reach, and try PKF’s stances.',
    practice: { rating: BRIDGE,
      setup: 'PKF’s practice method (page 21): place the cue ball around the table in awkward positions.',
      focus: ['Side shot: both legs against the table, bend over raising the back leg.', 'Stretch shot: legs against the table, back leg on the floor, front leg lifted.', 'Sit on the rail or table, keeping your back foot on the floor.', 'Can’t reach from the rail: knee on the table.', 'Stretching or on one leg: take more time on the shot.'],
      variants: [['side', 'Side shot'], ['stretch', 'Stretch shot'], ['sit', 'Sitting on the rail / table'], ['knee', 'Knee on the table']] },
    explain: 'PKF: “Don’t shoot any shot until your bridge is rock solid,” and becoming comfortable with as many stances and bridges as possible is essential to elevating your game.' },

  // 9 · Open & Closed Bridges (pages 16–17)
  { id: 'oc-open', section: 'open-closed', type: 'LEARN', assist: 'GUIDED', title: 'The open bridge', src: 'Pages 16–17 · Figures 2-15, 2-16', concept: 'Open bridge',
    prompt: 'Read how PKF makes and raises the open bridge.',
    explain: 'PKF: the most common bridges are the closed bridge and the open bridge. The open bridge is great for players of all skill levels, especially players new to the game; it’s fairly easy to make and gives good support. Figure 2-15: split the fingers so the base of the palm is on the table, and press the thumb against the side of the finger, creating a groove the stick glides on. Always keep the thumb pressed firmly against your hand; never off to the side away from the hand. To raise the bridge, pull your fingers in toward your hand (figure 2-16). One important benefit: the open bridge lets you see more of the cue ball than a closed bridge.',
    watch: 'Base of the palm down, thumb pressed against the finger to form the groove.' },
  { id: 'oc-id-open', section: 'open-closed', type: 'IDENTIFY', assist: 'GUIDED', title: 'Name the bridge', src: 'Page 17 · Figure 2-15', concept: 'Open bridge',
    prompt: 'Which bridge is this?',
    hint: 'Look for a loop of finger around the cue. Is there one?',
    choices: [['open', 'Open bridge'], ['closed', 'Closed bridge'], ['ctripod', 'Closed tripod bridge'], ['rail', 'Rail bridge']], answer: 'open',
    explain: 'Figure 2-15: the open bridge. Fingers split so the base of the palm is on the table; the thumb pressed against the side of the finger creates the groove the stick glides on.' },
  { id: 'oc-q-raise', section: 'open-closed', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Raising the open bridge', src: 'Page 17 · Figure 2-16', concept: 'Raise the open bridge',
    prompt: 'How does PKF raise the open bridge?',
    choices: [['pull', 'Pull your fingers in toward your hand'], ['thumb', 'Lift the thumb off to the side'], ['palm', 'Lift the base of the palm off the table'], ['stand', 'Stand up taller']], answer: 'pull',
    explain: 'PKF: “Raising the bridge just requires you to pull your fingers in toward your hand (figure 2-16).” The thumb stays pressed firmly against the hand.' },
  { id: 'oc-q-benefit', section: 'open-closed', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'Open bridge benefit', src: 'Page 17', concept: 'See more of the cue ball',
    prompt: 'What important benefit does PKF give for the open bridge?',
    choices: [['see', 'It lets you see more of the cue ball than a closed bridge'], ['snug', 'It is the most snug bridge'], ['pro', 'Only advanced players can use it'], ['power', 'It adds power to every shot']], answer: 'see',
    explain: 'PKF: “One important benefit of the open bridge is that it allows you to see more of the cue ball than a closed bridge.”' },
  { id: 'oc-closed', section: 'open-closed', type: 'LEARN', assist: 'GUIDED', title: 'Two closed bridges', src: 'Page 17 · Figures 2-17, 2-18, 2-19', concept: 'Closed bridge',
    prompt: 'Compare PKF’s two closed-bridge variations.',
    explain: 'PKF: there are two variations of the closed bridge. In the first, the forefinger and thumb create a loop pressed against the side of the hand (figure 2-17). It is very snug, so make sure the shaft is very smooth; the benefit of a bridge this snug is that it helps keep the cue on the shooting line. In the second, the thumb is pressed against the middle finger with the forefinger looping over and touching the top of the thumb (figure 2-18). Both use the thumb as a track for the cue. The cue should be aligned with the thumb as in figure 2-18. In figure 2-19 the thumb is pointing away from the shot, which is incorrect.',
    watch: 'Thumb is the track. Cue aligned with it, not pointing away.' },
  { id: 'oc-id-closed', section: 'open-closed', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Name the bridge', src: 'Page 17 · Figure 2-17', concept: 'Closed bridge',
    prompt: 'Which bridge is this?',
    choices: [['closed', 'Closed bridge'], ['open', 'Open bridge'], ['otripod', 'Open tripod bridge'], ['rail', 'Rail bridge']], answer: 'closed',
    explain: 'Figure 2-17: the first closed-bridge variation. The forefinger and thumb create a loop pressed against the side of the hand. PKF: very snug, which helps keep the cue on the shooting line.' },
  { id: 'oc-id-thumb', section: 'open-closed', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Is this closed bridge right?', src: 'Page 17 · Figure 2-19', concept: 'Thumb pointing away',
    prompt: 'Look at the thumb and the cue. Is this closed bridge correct?',
    choices: [['away', 'Incorrect: the thumb is pointing away from the shot'], ['ok', 'Correct: the cue is aligned with the thumb'], ['palm', 'Incorrect: the palm is off the table'], ['far', 'Incorrect: the bridge is too far from the cue ball']], answer: 'away',
    explain: 'PKF: “When you make the closed bridge the cue stick should be aligned with the thumb as in figure 2-18. In figure 2-19 the player’s thumb is pointing away from the shot, so this would be incorrect.”' },
  { id: 'oc-practice-open', section: 'open-closed', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: the open bridge', src: 'Pages 16–17 · Figures 2-15, 2-16', concept: 'Open bridge',
    prompt: 'Make PKF’s open bridge on the table.',
    practice: { rating: BRIDGE,
      setup: 'Bridge hand on the table, cue in your other hand.',
      focus: ['Split your fingers so the base of the palm is on the table.', 'Press the thumb against the side of the finger to create the groove.', 'Keep the thumb pressed firmly against your hand, never off to the side.', 'Raise it by pulling your fingers in toward your hand.'] },
    explain: 'PKF: the open bridge is fairly easy to make and provides good support for the cue stick.' },
  { id: 'oc-practice-closed', section: 'open-closed', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: both closed bridges', src: 'Page 17 · Figures 2-17, 2-18', concept: 'Closed bridge',
    prompt: 'Make each of PKF’s closed-bridge variations.',
    practice: { rating: BRIDGE,
      setup: 'Bridge hand on the table. PKF calls the first variation very snug, so make sure the shaft is very smooth.',
      focus: ['Variation 1: forefinger and thumb make a loop pressed against the side of the hand (2-17).', 'Variation 2: thumb against the middle finger, forefinger looping over and touching the top of the thumb (2-18).', 'Cue aligned with the thumb, not with the thumb pointing away from the shot (2-19).'],
      variants: [['v1', 'Variation 1 (2-17)'], ['v2', 'Variation 2 (2-18)']] },
    explain: 'PKF: both closed bridges use the thumb as a track for the cue.' },

  // 10 · Tripod Bridges & Shooting Over a Ball (pages 17–18)
  { id: 'tr-learn', section: 'tripod', type: 'LEARN', assist: 'GUIDED', title: 'Closed and open tripod', src: 'Pages 17–18 · Figures 2-20, 2-21', concept: 'Tripod bridge',
    prompt: 'Compare PKF’s two tripod bridges.',
    explain: 'PKF: the tripod bridge is used when shooting over a ball, and is sometimes used instead of the closed or open bridge. The closed tripod bridge uses two fingers in the front to raise the bridge and one finger kept in the back for support (figure 2-20). Figure 2-21 is the open tripod bridge, which usually has two fingers kept back for support.',
    watch: 'Closed tripod: one finger back. Open tripod: usually two fingers back.' },
  { id: 'tr-id-closed', section: 'tripod', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Name the tripod', src: 'Page 18 · Figure 2-20', concept: 'Closed tripod',
    prompt: 'Which tripod bridge is this?',
    choices: [['closed', 'Closed tripod bridge'], ['open', 'Open tripod bridge'], ['openb', 'Open bridge'], ['rail', 'Rail bridge']], answer: 'closed',
    explain: 'Figure 2-20: the closed tripod bridge. Two fingers in the front raise the bridge and one finger is kept in the back for support.' },
  { id: 'tr-id-open', section: 'tripod', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Name the tripod', src: 'Page 18 · Figure 2-21', concept: 'Open tripod',
    prompt: 'Which tripod bridge is this?',
    choices: [['open', 'Open tripod bridge'], ['closed', 'Closed tripod bridge'], ['closedb', 'Closed bridge'], ['rail', 'Rail bridge']], answer: 'open',
    explain: 'Figure 2-21: the open tripod bridge, which usually has two fingers kept back for support.' },
  { id: 'tr-over', section: 'tripod', type: 'LEARN', assist: 'GUIDED', title: 'Shooting over a ball', src: 'Page 18 · Figures 2-22 to 2-25', concept: 'Support and distance over a ball',
    prompt: 'Read the two issues PKF sees when players shoot over a ball.',
    explain: 'Issue one: failing to keep a finger back for support (figure 2-22). Players balance the bridge with all their fingers together, which makes it very unstable; without realizing it, the bridge moves slightly during the stroke, which may cause a mishit. Keep one or two fingers back for support (figure 2-23). Issue two: building the tripod bridge too far away from the obstructing ball (figure 2-24), which increases the chance of accidentally striking it with your cue. Place the tripod bridge fairly close to the obstructing ball (figure 2-25). Some players also place their feet closer together when shooting over a ball, which lets them stand a bit higher than normal.',
    watch: 'One or two fingers back. Bridge fairly close to the obstructing ball.' },
  { id: 'tr-id-support', section: 'tripod', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which bridge is unstable?', src: 'Page 18 · Figures 2-22, 2-23', concept: 'Finger back for support',
    prompt: 'Both players are shooting over a ball. Which figure shows the bridge with no finger kept back for support?',
    choices: [['f22', 'Figure 2-22 (left)'], ['f23', 'Figure 2-23 (right)']], answer: 'f22',
    explain: 'Figure 2-22: all the fingers together, no finger back for support. PKF: very unstable, and it may move slightly during the stroke, causing a mishit. Figure 2-23 keeps fingers back for support.' },
  { id: 'tr-id-far', section: 'tripod', type: 'IDENTIFY', assist: 'INDEPENDENT', title: 'Spot the issue', src: 'Page 18 · Figure 2-24', concept: 'Bridge too far from the obstructing ball',
    prompt: 'What issue does the arrow in this figure point out?',
    choices: [['far', 'The tripod bridge is too far from the obstructing ball'], ['nofinger', 'No finger kept back for support'], ['thumb', 'The thumb is pointing away from the shot'], ['high', 'The bridge is raised too high']], answer: 'far',
    explain: 'Figure 2-24: the tripod bridge is too far away from the obstructing ball. PKF: this increases the chance of accidentally striking the obstructing ball; place the bridge fairly close to it (figure 2-25).' },
  { id: 'tr-practice', section: 'tripod', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: tripod over a ball', src: 'Pages 17–18 · Figures 2-20 to 2-25', concept: 'Tripod bridge',
    prompt: 'Put a ball between your bridge and the cue ball and make PKF’s tripod bridges.',
    practice: { rating: BRIDGE,
      setup: 'Cue ball with another ball in front of your bridge hand, as in figures 2-22 to 2-25.',
      focus: ['Closed tripod: two fingers in front raise the bridge, one finger back for support.', 'Open tripod: usually two fingers back for support.', 'Keep one or two fingers back. Don’t balance on all fingers together.', 'Place the bridge fairly close to the obstructing ball.'],
      variants: [['closed', 'Closed tripod'], ['open', 'Open tripod']] },
    explain: 'PKF: to create a stable bridge when shooting over a ball it’s important to keep one or two fingers back for support.' },
  // 11 · Rail Bridges (pages 18–20)
  { id: 'rb-common', section: 'rail-bridges', type: 'LEARN', assist: 'GUIDED', title: 'A common rail bridge', src: 'Pages 18–19 · Figures 2-26, 2-27', concept: 'Open-style rail bridge',
    prompt: 'Read PKF’s common rail bridge for a cue ball on or near the rail.',
    explain: 'PKF: here’s a common rail bridge when the cue ball is on or near the rail (figure 2-26). Similar to an open bridge, the cue glides on the groove formed between the thumb and forefinger. A finger is kept back and pressed against the table for support. You can raise this bridge as needed to create an angle (figure 2-27). The open bridge is preferred to the closed bridge when bridging on the rail, since it keeps the cue more level and lets you see more of the cue ball.',
    watch: 'Groove between thumb and forefinger; one finger back on the table.' },
  { id: 'rb-q-open', section: 'rail-bridges', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Open vs closed on the rail', src: 'Page 19', concept: 'Open bridge on the rail',
    prompt: 'Why does PKF prefer the open bridge to the closed bridge when bridging on the rail?',
    choices: [['level', 'It keeps the cue more level and lets you see more of the cue ball'], ['snug', 'It’s more snug than a closed bridge'], ['power', 'It always adds power'], ['rule', 'Closed bridges aren’t allowed on the rail']], answer: 'level',
    explain: 'PKF: “The open bridge is preferred to the closed bridge when bridging on the rail since it keeps the cue stick more level and it also allows you to see more of the cue ball.”' },
  { id: 'rb-most', section: 'rail-bridges', type: 'LEARN', assist: 'GUIDED', title: 'The most common rail bridge', src: 'Page 19 · Figures 2-28, 2-29', concept: 'Most common rail bridge',
    prompt: 'Read how PKF builds the most common rail bridge.',
    explain: 'PKF figure 2-28. First, place the cue on the rail along the shooting line. Tuck your thumb into your bridge hand and slide the bridge alongside the cue, being careful not to move the cue off the shooting line. The cue should contact the thumb and the top of the middle finger, and the forefinger loops around the cue, creating a secure bridge. Many players move their thumb away from the cue, which removes the stick’s support (figure 2-29). Keep your thumb locked in place alongside the cue as you create the bridge on the rail.',
    watch: 'Cue placed on the line first; the bridge comes to the cue, not the other way.' },
  { id: 'rb-seq', section: 'rail-bridges', type: 'SEQUENCE', assist: 'ASSISTED', title: 'Build the rail bridge in order', src: 'Page 19 · Figure 2-28', concept: 'Rail bridge order',
    prompt: 'Tap PKF’s steps for the most common rail bridge in order, then lock.',
    seq: { items: [['cue', 'Place the cue on the rail along the shooting line'], ['tuck', 'Tuck your thumb into your bridge hand'], ['slide', 'Slide the bridge alongside the cue without moving it off the line'], ['loop', 'Loop the forefinger around the cue (cue on the thumb and top of the middle finger)']], answer: ['cue', 'tuck', 'slide', 'loop'], shown: ['slide', 'loop', 'cue', 'tuck'] },
    explain: 'PKF: “First, place the cue stick on the rail along the shooting line. Tuck your thumb into your bridge hand and slide your bridge alongside the cue stick being careful not to move the cue off the shooting line. The cue stick should be contacting the thumb and the top of the middle finger - the forefinger should loop around the cue stick creating a secure bridge.”' },
  { id: 'rb-id-thumb', section: 'rail-bridges', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Spot the issue', src: 'Page 19 · Figure 2-29', concept: 'Thumb moved away',
    prompt: 'This is PKF’s rail bridge mistake photo. What went wrong?',
    choices: [['thumb', 'The thumb moved away from the cue, removing its support'], ['close', 'The bridge is too close to the cue ball'], ['level', 'The cue is too level'], ['ok', 'Nothing. This is correct']], answer: 'thumb',
    explain: 'PKF: when many players attempt this bridge they end up moving their thumb away from the cue stick, which removes the stick’s support (figure 2-29). Keep your thumb locked in place alongside the cue.' },
  { id: 'rb-back', section: 'rail-bridges', type: 'LEARN', assist: 'GUIDED', title: 'Room for the back stroke', src: 'Page 19 · Figures 2-30, 2-31', concept: 'Bridge distance on the rail',
    prompt: 'Compare figures 2-30 and 2-31.',
    explain: 'PKF: one issue when the cue ball is on or near the rail is limiting the back stroke when the cue ball has to be struck firmly. In figure 2-30 the player made his bridge too close to the cue ball, which limits his back stroke. Then the player has to muscle the cue to create power, which usually results in a mishit. When strong players have a cue ball near the rail they usually use this type of rail bridge (figure 2-31); they can pull the cue farther back, allowing a much smoother stroke.',
    watch: 'Leave room to pull the cue back.' },
  { id: 'rb-id-close', section: 'rail-bridges', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Spot the issue', src: 'Page 19 · Figure 2-30', concept: 'Bridge too close',
    prompt: 'The player needs to strike this cue ball firmly. What issue does PKF point out?',
    choices: [['close', 'The bridge is too close to the cue ball, limiting the back stroke'], ['far', 'The bridge is too far from the cue ball'], ['thumb', 'The thumb is off the cue'], ['high', 'The cue is elevated too much']], answer: 'close',
    explain: 'PKF figure 2-30: the bridge is too close to the cue ball, which limits the back stroke. The player has to muscle the cue to create power, which usually results in a mishit.' },
  { id: 'rb-dist', section: 'rail-bridges', type: 'LEARN', assist: 'ASSISTED', title: 'Farther from the rail; a level start', src: 'Page 20 · Figures 2-32 to 2-35', concept: 'Choosing the bridge by distance',
    prompt: 'Read two more rail situations from page 20.',
    explain: 'Figure 2-32: the cue ball is farther from the rail. Many players still make a rail bridge, which leaves too much distance between the cue ball and the bridge. In a situation like this, see if there is enough room to create a tripod bridge or a standard bridge (figure 2-33). Next, PKF looks at a cue ball near the rail when the player needs to draw it. Players sometimes create more angle than is necessary (figure 2-34), making the shot more difficult than it needs to be. PKF: start off with a level cue, then slowly lower the tip (figure 2-35). Now the player has a much better chance of pocketing the object ball.',
    watch: 'Don’t default to a rail bridge. Don’t add more cue angle than needed.' },
  { id: 'rb-q-dist', section: 'rail-bridges', type: 'IMPORTANT', assist: 'INDEPENDENT', title: 'Cue ball off the rail', src: 'Page 20 · Figure 2-32', concept: 'Tripod or standard bridge',
    prompt: 'The cue ball is farther away from the rail (figure 2-32), and a rail bridge would leave too much distance. What does PKF suggest?',
    choices: [['room', 'See if there is enough room to create a tripod bridge or a standard bridge'], ['longer', 'Keep the rail bridge and use a longer back stroke'], ['elevate', 'Elevate the cue steeply'], ['mech', 'Always switch to the mechanical bridge']], answer: 'room',
    explain: 'PKF: “In a situation like this see if there is enough room to create a tripod bridge or a standard bridge (figure 2-33).”' },
  { id: 'rb-practice', section: 'rail-bridges', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: rail bridges', src: 'Pages 18–19 · Figures 2-26 to 2-31', concept: 'Rail bridges',
    prompt: 'Put the cue ball on or near the rail and make PKF’s rail bridges.',
    practice: { rating: BRIDGE,
      setup: 'Cue ball on or near a rail.',
      focus: ['Common rail bridge: cue in the groove between thumb and forefinger; one finger back pressed on the table (2-26, 2-27).', 'Most common rail bridge: cue on the rail along the shooting line, tuck the thumb, slide the bridge alongside, forefinger loops around (2-28).', 'Keep the thumb locked alongside the cue (not 2-29).', 'Leave room to pull the cue back for a firm stroke (2-31, not 2-30).'],
      variants: [['common', 'Common rail bridge (2-26)'], ['most', 'Most common rail bridge (2-28)']] },
    explain: 'PKF: when strong players have a cue ball near the rail they usually use this type of rail bridge, so they can pull the cue farther back for a much smoother stroke.' },

  // 12 · Bridges in Tight Spots (pages 20–22)
  { id: 'ts-side', section: 'tight-spots', type: 'LEARN', assist: 'GUIDED', title: 'Near the side pocket', src: 'Page 20 · Figures 2-36, 2-37', concept: 'Side-pocket bridge',
    prompt: 'Read PKF’s bridge for a cue ball near the side pocket.',
    explain: 'PKF: sometimes it’s difficult to create your bridge. In figure 2-36 the cue ball is near the side pocket, so there isn’t much room for a normal bridge, and many players create an unstable bridge which may result in a mishit. “Sometimes in pool you have to be creative in creating your bridges.” With the cue ball near the side pocket, rest your palm on the side of the rail, placing your fingers just outside the pocket opening. Now you have a stable bridge when you stroke (figure 2-37).',
    watch: 'Palm on the side of the rail, fingers just outside the pocket opening.' },
  { id: 'ts-id-side', section: 'tight-spots', type: 'IDENTIFY', assist: 'ASSISTED', title: 'What is this bridge for?', src: 'Page 20 · Figure 2-37', concept: 'Side-pocket bridge',
    prompt: 'Which situation is PKF solving with this bridge?',
    choices: [['side', 'Cue ball near the side pocket'], ['frozen', 'Cue ball frozen to the long rail'], ['over', 'Shooting over a ball in the middle of the table'], ['far', 'Cue ball far from any rail']], answer: 'side',
    explain: 'Figure 2-37: with the cue ball near the side pocket, PKF rests the palm on the side of the rail and places the fingers just outside the pocket opening for a stable bridge.' },
  { id: 'ts-along', section: 'tight-spots', type: 'LEARN', assist: 'GUIDED', title: 'Cue ball alongside the rail', src: 'Page 21 · Figures 2-38 to 2-41', concept: 'Rail + bed bridge',
    prompt: 'Read PKF’s two bridges for a cue ball right alongside the rail.',
    explain: 'When the cue ball is alongside the rail many players struggle to create a stable bridge (figure 2-38). With the cue ball this close to the rail, create a bridge that uses the rail and the table bed for support. Figure 2-39 is the open bridge version: keep your thumb pointing slightly upward to help secure the cue. Figure 2-40 is the closed bridge version; the pressure points are these three fingers (figure 2-41). It sometimes helps to apply pressure downward to help secure the bridge.',
    watch: 'Use both the rail and the table bed for support.' },
  { id: 'ts-id-along', section: 'tight-spots', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Which version?', src: 'Page 21 · Figure 2-39', concept: 'Open version alongside the rail',
    prompt: 'Cue ball alongside the rail. Which of PKF’s versions is this?',
    choices: [['open', 'Open bridge version, thumb pointing slightly upward'], ['closed', 'Closed bridge version, three pressure fingers'], ['tripod', 'Closed tripod bridge'], ['side', 'Side-pocket bridge']], answer: 'open',
    explain: 'Figure 2-39: the open bridge version. PKF: keep your thumb pointing slightly upward to help secure the cue. Figure 2-40 is the closed version, with three pressure fingers (figure 2-41).' },
  { id: 'ts-frozen', section: 'tight-spots', type: 'LEARN', assist: 'GUIDED', title: 'Frozen to the rail', src: 'Page 21 · Figures 2-42, 2-43', concept: 'Frozen cue ball: slight elevation',
    prompt: 'Read PKF’s warning for a cue ball frozen to the rail.',
    explain: 'PKF: when the cue ball is frozen to the rail (figure 2-42), one issue is shooting with a level cue. Since you’re only hitting a small part of the cue ball, there is a chance the tip may slide off the top of the cue ball, causing a miscue. When the cue ball is frozen to the rail, slightly elevate your cue so you’re shooting down at the cue ball (figure 2-43).',
    watch: 'Frozen: slightly elevate, shoot down at the cue ball.' },
  { id: 'ts-q-frozen', section: 'tight-spots', type: 'IMPORTANT', assist: 'ASSISTED', title: 'Frozen cue ball, level cue?', src: 'Page 21', concept: 'Miscue risk',
    prompt: 'The cue ball is frozen to the rail. What does PKF warn about a level cue, and what is the fix?',
    choices: [['elevate', 'The tip may slide off the top and miscue. Slightly elevate so you’re shooting down at the cue ball'], ['level', 'A level cue is best. Keep it perfectly level'], ['hard', 'Hit it harder to stop a miscue'], ['closed', 'Use a closed bridge and stay level']], answer: 'elevate',
    explain: 'PKF: “Since we’re only hitting a small part of the cue ball there is a chance the tip may slide off the top of the cue ball causing a miscue. When the cue ball is frozen to the rail, slightly elevate your cue stick so you’re shooting down at the cue ball (figure 2-43).”' },
  { id: 'ts-practice-tight', section: 'tight-spots', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: tight-spot bridges', src: 'Pages 20–21 · Figures 2-36 to 2-43', concept: 'Tight-spot bridges',
    prompt: 'Set the cue ball in each tight spot PKF shows and make the bridge.',
    practice: { rating: BRIDGE,
      setup: 'Cue ball near the side pocket, then alongside the rail, then frozen to the rail.',
      focus: ['Near the side pocket: palm on the side of the rail, fingers just outside the pocket opening (2-37).', 'Alongside the rail, open version: thumb pointing slightly upward (2-39).', 'Alongside the rail, closed version: three pressure fingers; press down if it helps (2-40, 2-41).', 'Frozen to the rail: slightly elevate the cue and shoot down at the cue ball (2-43).'],
      variants: [['side', 'Side pocket (2-37)'], ['open', 'Alongside, open (2-39)'], ['closed', 'Alongside, closed (2-40)'], ['frozen', 'Frozen, elevated (2-43)']] },
    explain: 'PKF: sometimes in pool you have to be creative in creating your bridges.' },
  { id: 'ts-practice-awkward', section: 'tight-spots', type: 'PRACTICE', assist: 'INDEPENDENT', title: 'Practice This: awkward positions', src: 'Pages 21–22 · Figure 2-44', concept: 'All stances and bridges',
    prompt: 'PKF’s practice method for all the stances and bridges.',
    practice: { rating: BRIDGE,
      setup: 'Place the cue ball around the table in as many awkward positions as possible (figure 2-44).',
      focus: ['Choose the stance and bridge PKF shows for each spot.', 'Don’t shoot until your bridge is rock solid.'] },
    explain: 'PKF: “This allows you to get comfortable with all types of stances and bridges, especially since these situations will probably come up in tournaments or leagues. Becoming comfortable with as many stances and bridges as possible is essential to elevating your game to a higher level.”' }
];

export const EXAM_ITEMS = [
  { id: 'fx-ghost', section: 'shooting-line', type: 'IMPORTANT', title: 'Ghost ball', src: 'Page 2', concept: 'Ghost ball',
    prompt: 'What does PKF mean by the ghost ball?',
    choices: [['cb', 'An imaginary ball location showing where the cue ball needs to be to pocket the object ball'], ['ob', 'The object ball’s position after contact'], ['tip', 'Where the tip strikes the cue ball'], ['rail', 'A spot on the rail']], answer: 'cb',
    explain: 'PKF: the ghost ball is an imaginary ball location that represents where the cue ball needs to be to pocket the object ball.' },
  { id: 'fx-seq-line', section: 'shooting-line', type: 'SEQUENCE', title: 'Shooting line order', src: 'Page 2 · Figure 1-1', concept: 'Shooting line',
    prompt: 'Put PKF’s figure 1-1 thinking in order.',
    seq: { items: [['pocket', 'Line from the center of the pocket opening through the center of the object ball'], ['ghost', 'Ghost ball on that line, where the cue ball must be at contact'], ['line', 'Line from the center of the cue ball to the center of the ghost ball'], ['stance', 'Build the stance on that line']], answer: ['pocket', 'ghost', 'line', 'stance'], shown: ['stance', 'ghost', 'line', 'pocket'] },
    explain: 'PKF figure 1-1: pocket line through the object ball → ghost ball → cue ball to ghost ball (A) → build the stance on that line.' },
  { id: 'fx-id-feet', section: 'stance', type: 'IDENTIFY', title: 'Foot position', src: 'Page 3 · foot photos', concept: 'Back foot slightly turned',
    prompt: 'Caption hidden. Which of PKF’s foot positions is this?',
    choices: [['b-slight', 'Back foot slightly turned'], ['b-90', 'Back foot turned 90 degrees'], ['f-par', 'Front foot parallel with line'], ['f-slight', 'Front foot slightly turned']], answer: 'b-slight',
    explain: 'PKF caption: BACK FOOT SLIGHTLY TURNED. The back foot goes on the shooting line at a slight angle or closer to 90 degrees.' },
  { id: 'fx-id-away', section: 'stance', type: 'IDENTIFY', title: 'Stance issue', src: 'Page 4 · Figure 1-8', concept: 'Facing away from the shot',
    prompt: 'Look at the left foot. Which stance issue is PKF showing in this figure?',
    choices: [['away', 'Facing away from the shot'], ['crossed', 'Back foot crossed the shooting line'], ['toofar', 'Back foot too far back'], ['ok', 'No issue']], answer: 'away',
    explain: 'Figure 1-8: the right foot is in the proper place but the left foot faces away, about 90 degrees from the shot, which may cause a bit of instability.' },
  { id: 'fx-aim', section: 'stance', type: 'IMPORTANT', title: 'Aiming starts early', src: 'Page 5', concept: 'Stance and aiming',
    prompt: 'According to PKF, where is much of the aiming process done?',
    choices: [['before', 'Before you even get down on the table'], ['back', 'During the back stroke'], ['impact', 'At impact'], ['after', 'After the stroke, by watching the object ball']], answer: 'before',
    explain: 'PKF: “Much of the aiming process is done before you even get down on the table.” The stance is built around the shooting line on every shot.' },
  { id: 'fx-id-forearm', section: 'forearm-grip', type: 'IDENTIFY', title: 'Forearm', src: 'Page 5 · Figures 1-12, 1-13', concept: 'Forearm below the elbow',
    prompt: 'Which figure shows the forearm moved away from the line below the elbow?',
    choices: [['f12', 'Figure 1-12 (left)'], ['f13', 'Figure 1-13 (right)']], answer: 'f13',
    explain: 'Figure 1-13: the forearm has moved away from the line. PKF: it then becomes more challenging to keep the stick on a straight path. Figure 1-12 hangs naturally below the elbow.' },
  { id: 'fx-thumb', section: 'forearm-grip', type: 'IMPORTANT', title: 'Thumb on the cue', src: 'Pages 5–6 · Figure 1-14', concept: 'Thumb on the side',
    prompt: 'In PKF’s relaxed grip, where does the thumb go?',
    choices: [['side', 'On the side of the cue, holding it in place, never on top'], ['top', 'On top of the cue'], ['under', 'Under the cue'], ['off', 'Off the cue entirely']], answer: 'side',
    explain: 'PKF: the cue sits on the fingers and the thumb rests on the side of the cue holding it in place. You never want to put the thumb on top of the cue stick.' },
  { id: 'fx-tempo', section: 'stroke', type: 'IMPORTANT', title: 'Back stroke tempo', src: 'Page 7', concept: 'Same slow tempo',
    prompt: 'Soft shot or hard shot, what does PKF say about the back stroke?',
    choices: [['same', 'Always the same slow tempo'], ['match', 'Match the tempo to the shot speed'], ['quick', 'Quick on hard shots'], ['short', 'Shorter on soft shots, with no tempo rule']], answer: 'same',
    explain: 'PKF: “your back stroke should always be the same slow tempo.”' },
  { id: 'fx-id-follow', section: 'stroke', type: 'IDENTIFY', title: 'Follow through', src: 'Page 8 · Figures 1-21, 1-22', concept: 'Follow through',
    prompt: 'Which figure shows the stick driving through and stopping a few inches beyond the spot?',
    choices: [['f21', 'Figure 1-21 (left)'], ['f22', 'Figure 1-22 (right)']], answer: 'f21',
    explain: 'Figure 1-21: the cue drives through the cue ball and gradually comes to a stop a few inches beyond the spot. Figure 1-22 is abbreviated, meaning you tightened up at impact.' },
  { id: 'fx-parts', section: 'stroke', type: 'IMPORTANT', title: 'Moving parts', src: 'Page 8', concept: 'Few moving parts',
    prompt: 'Why does PKF want as few moving parts as possible in the stroke?',
    choices: [['wrong', 'The more moving parts, the more things that can go wrong'], ['look', 'It looks better'], ['power', 'More parts means less power'], ['rule', 'It’s required for a legal stroke']], answer: 'wrong',
    explain: 'PKF: “the more moving parts means the more things that can go wrong. All the parts have to be in sync.”' },
  { id: 'fx-chalk', section: 'tip-eyes', type: 'IMPORTANT', title: 'Tip distance', src: 'Page 9', concept: 'Less than one cube of chalk',
    prompt: 'How close to the cue ball does PKF try to get the tip when aiming?',
    choices: [['chalk', 'Usually less than one cube of chalk away'], ['inch6', 'About six inches away'], ['touch', 'Touching'], ['any', 'Distance doesn’t matter']], answer: 'chalk',
    explain: 'PKF: try to get the tip fairly close to the cue ball, usually less than one cube of chalk away. If it’s too far away, the stick may be slowing down by the time it reaches the cue ball.' },
  { id: 'fx-seq-steps', section: 'stroke-drill', type: 'SEQUENCE', title: 'Putting it together', src: 'Page 10', concept: 'Stance steps',
    prompt: 'Put PKF’s steps in order.',
    seq: { items: [['back', 'Back foot on the shooting line'], ['front', 'Step in with the other foot'], ['bridge', 'Create the bridge before getting down'], ['hips', 'Bend forward, hips back'], ['tripod', 'Bridge on the table: the third part of the tripod']], answer: ['back', 'front', 'bridge', 'hips', 'tripod'], shown: ['hips', 'back', 'tripod', 'front', 'bridge'] },
    explain: 'PKF page 10: back foot → front foot → bridge before getting down → hips back as you bend forward → bridge on the table completes the tripod.' },
  { id: 'fx-head', section: 'stroke-drill', type: 'IMPORTANT', title: 'Head still', src: 'Page 11', concept: 'Head movement',
    prompt: 'When practicing, how long does PKF say to keep your head still?',
    choices: [['pocket', 'Until the ball reaches the pocket'], ['contact', 'Only until the tip touches the cue ball'], ['back', 'Only during the back stroke'], ['none', 'Head movement doesn’t matter']], answer: 'pocket',
    explain: 'PKF: “When practicing, keep your head still until the ball reaches the pocket.”' },
  { id: 'fx-steps', section: 'stroke-memory', type: 'IMPORTANT', title: 'Learning order', src: 'Page 12', concept: 'Learn the game in steps',
    prompt: 'What order does PKF give for learning the game?',
    choices: [['fbp', 'Fundamentals, ball pocketing, then position play'], ['pfb', 'Position play, fundamentals, then ball pocketing'], ['bfp', 'Ball pocketing, fundamentals, then position play'], ['any', 'Any order works']], answer: 'fbp',
    explain: 'PKF: you have to learn the game in steps: fundamentals, ball pocketing, and then position play.' },
  { id: 'fx-id-raised', section: 'open-closed', type: 'IDENTIFY', title: 'Name the bridge', src: 'Page 17 · Figure 2-16', concept: 'Open bridge, raised',
    prompt: 'Which bridge is this, and how was it raised?',
    choices: [['open', 'Open bridge, raised by pulling the fingers in toward the hand'], ['closed', 'Closed bridge, raised by lifting the loop'], ['tripod', 'Open tripod, two fingers back'], ['rail', 'Rail bridge on the cushion']], answer: 'open',
    explain: 'Figure 2-16: PKF raises the open bridge by pulling the fingers in toward the hand.' },
  { id: 'fx-id-tripod', section: 'tripod', type: 'IDENTIFY', title: 'Name the tripod', src: 'Pages 17–18 · Figure 2-21', concept: 'Open tripod',
    prompt: 'Which tripod bridge is this?',
    choices: [['open', 'Open tripod: usually two fingers back for support'], ['closed', 'Closed tripod: one finger back for support'], ['openb', 'Open bridge'], ['closedb', 'Closed bridge']], answer: 'open',
    explain: 'Figure 2-21: the open tripod bridge, usually with two fingers kept back for support. The closed tripod (2-20) keeps one finger back.' },
  { id: 'fx-id-support', section: 'tripod', type: 'IDENTIFY', title: 'Over a ball', src: 'Page 18 · Figures 2-22, 2-23', concept: 'Fingers back for support',
    prompt: 'Which figure shows PKF’s stable bridge over a ball, with fingers kept back for support?',
    choices: [['f22', 'Figure 2-22 (left)'], ['f23', 'Figure 2-23 (right)']], answer: 'f23',
    explain: 'Figure 2-23: one or two fingers back for support. Figure 2-22 has no finger back, which PKF calls unstable and likely to cause a mishit.' },
  { id: 'fx-id-rail', section: 'rail-bridges', type: 'IDENTIFY', title: 'Name the rail bridge', src: 'Page 19 · Figure 2-28', concept: 'Most common rail bridge',
    prompt: 'Which bridge is this?',
    choices: [['most', 'PKF’s most common rail bridge: thumb tucked, forefinger looped around the cue'], ['open', 'Open bridge on the bed of the table'], ['side', 'Side-pocket bridge'], ['tripod', 'Closed tripod bridge']], answer: 'most',
    explain: 'Figure 2-28: the most common rail bridge. The cue is on the rail along the shooting line, contacting the thumb and the top of the middle finger, with the forefinger looped around it for a secure bridge.' },
  { id: 'fx-id-close', section: 'rail-bridges', type: 'IDENTIFY', title: 'Rail bridge issue', src: 'Page 19 · Figure 2-30', concept: 'Bridge too close',
    prompt: 'The cue ball needs to be struck firmly. What is the problem with this rail bridge?',
    choices: [['close', 'Too close to the cue ball, limiting the back stroke'], ['far', 'Too far from the cue ball'], ['level', 'The cue is too level'], ['ok', 'No problem']], answer: 'close',
    explain: 'PKF figure 2-30: the bridge is too close to the cue ball, which limits the back stroke. The player then has to muscle the cue stick to create power, which usually results in a mishit.' },
  { id: 'fx-frozen', section: 'tight-spots', type: 'IMPORTANT', title: 'Frozen to the rail', src: 'Page 21', concept: 'Slight elevation',
    prompt: 'The cue ball is frozen to the rail. What does PKF tell you to do with the cue?',
    choices: [['elevate', 'Slightly elevate it'], ['level', 'Keep it perfectly level'], ['jack', 'Jack it up as high as possible'], ['low', 'Lower the tip toward the felt']], answer: 'elevate',
    explain: 'PKF: with a level cue you’re only hitting a small part of the cue ball, so the tip may slide off the top and miscue. When the cue ball is frozen to the rail, slightly elevate your cue so you’re shooting down at the cue ball (figure 2-43).' },
  { id: 'fx-id-sit', section: 'stances', type: 'IDENTIFY', title: 'Name the stance', src: 'Page 15 · Figure 2-8', concept: 'Sit on the end rail',
    prompt: 'A stretch shot over a ball. What is PKF’s player doing for a more stable bridge?',
    choices: [['sit', 'Sitting on the end rail, back foot on the floor'], ['side', 'Side shot, back leg raised'], ['knee', 'Knee on the table'], ['one', 'Balancing on one foot']], answer: 'sit',
    explain: 'Figure 2-8: sit on the end rail keeping your back foot on the floor. PKF: “Now you can get closer to the cue ball making for a more stable bridge.”' },
  // Physical checkpoints: PKF reference + instruction + self-confirmation. They never count toward pass.
  { id: 'fx-x-drill', section: 'stroke-drill', type: 'PRACTICE', physical: true, practiceLesson: 'sd-practice-drill', rating: 'confirm', title: 'Checkpoint: PKF stroke drill', src: 'Pages 10–11 · Figures 1-30, 1-31', concept: 'Stroke drill',
    prompt: 'Run PKF’s stroke drill on the table, then confirm honestly.',
    explain: 'Use PKF’s monitor questions on page 11 to check your own stroke. The app does not check mechanics.' },
  { id: 'fx-x-felt', section: 'stroke-drill', type: 'PRACTICE', physical: true, practiceLesson: 'sd-practice-felt', rating: 'confirm', title: 'Checkpoint: felt line drill', src: 'Page 11 · Figure 1-33', concept: 'Felt line drill',
    prompt: 'Run PKF’s felt line drill, then confirm honestly.',
    explain: 'PKF page 11: stroke along the line on the felt and watch that the stick stays on it.' },
  { id: 'fx-x-bridges', section: 'tight-spots', type: 'PRACTICE', physical: true, practiceLesson: 'ts-practice-awkward', rating: 'confirm', title: 'Checkpoint: awkward positions', src: 'Pages 21–22 · Figure 2-44', concept: 'Stances and bridges',
    prompt: 'Place the cue ball in awkward positions around the table and set up the stance and bridge PKF shows for each, then confirm honestly.',
    explain: 'PKF: becoming comfortable with as many stances and bridges as possible elevates your game.' }
];

export const LESSONS = L;

export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }
export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }
export function isKnowledge(lesson) { return !!lesson && KNOWLEDGE_TYPES.includes(lesson.type); }
export function knowledgeLessons(sectionId) { return lessonsFor(sectionId).filter(isKnowledge); }
export function ratingSet(lesson) {
  const key = lesson?.practice?.rating || lesson?.rating || 'complete';
  return RATINGS[key] || RATINGS.complete;
}

export function blank() {
  return {
    sections: {},
    lessons: {},
    practice: {},
    needsPractice: {},
    review: {},
    skipped: {},
    tableXp: {},
    current: null,
    exam: { attempts: 0, passed: false, bestKnowledge: 0, bestOverall: 0, history: [], lastMissed: [] },
    stats: { knowledgeCorrect: 0, knowledgeWrong: 0, firstTotal: 0, firstCorrect: 0, practiceSessions: 0, tableSkipped: 0, tableDrillXp: 0 }
  };
}

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function courseOf(state) {
  const raw = state?.[STORAGE_KEY];
  if (!raw || typeof raw !== 'object') return blank();
  const b = blank();
  return {
    ...b,
    ...raw,
    sections: { ...obj(raw.sections) },
    lessons: { ...obj(raw.lessons) },
    practice: { ...obj(raw.practice) },
    needsPractice: { ...obj(raw.needsPractice) },
    review: { ...obj(raw.review) },
    skipped: { ...obj(raw.skipped) },
    tableXp: { ...obj(raw.tableXp) },
    exam: { ...b.exam, ...obj(raw.exam) },
    stats: { ...b.stats, ...obj(raw.stats) },
    current: raw.current || null
  };
}

function put(state, course) { return { ...state, [STORAGE_KEY]: course }; }

export function sectionRecord(course, id) { return course.sections?.[id] || null; }
export function sectionPassed(course, id) { return !!sectionRecord(course, id)?.passed; }

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
  return { locked: false, choice: null, seq: [], correct: null, done: false, skipped: false, hint: false, rating: null, checks: [], variants: [] };
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

/** REVIEW FUNDAMENTALS (missed checks) or NEEDS PRACTICE (self-marked skills). Never affects gating. */
export function reviewIds(course) { return Object.keys(course.review || {}).filter((id) => lessonById(id)); }
export function needsPracticeIds(course) { return Object.keys(course.needsPractice || {}).filter((id) => lessonById(id)); }

export function startReview(state, kind = 'review') {
  const course = courseOf(state);
  const ids = kind === 'needs' ? needsPracticeIds(course) : reviewIds(course);
  if (!ids.length) return state;
  course.current = freshRun(ids, { mode: kind === 'needs' ? 'needs' : 'review' });
  return put(state, course);
}

/** Replay one completed lesson (always allowed once done; never locked after completion). */
export function lessonCompleted(course, id) { return !!course.lessons?.[id]?.done; }
export function startSingle(state, lessonId, { dev = false } = {}) {
  const course = courseOf(state);
  const lesson = lessonById(lessonId);
  if (!lesson) return state;
  const allowed = dev || lessonCompleted(course, lessonId) || course.review?.[lessonId] || course.needsPractice?.[lessonId];
  if (!allowed) return state;
  course.current = freshRun([lessonId], { mode: 'single', sectionId: lesson.section, dev: !!dev && !lessonCompleted(course, lessonId) });
  return put(state, course);
}

function liveItem(course) {
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return null;
  const id = cur.order[cur.cursor];
  return { cur, id, lesson: lessonById(id), it: cur.items[id] };
}

export function selectChoice(state, choice) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked) return state;
  if (!x.lesson?.choices?.some((c) => c[0] === String(choice))) return state;
  x.it.choice = String(choice);
  return put(state, course);
}

export function seqTap(state, key) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || x.lesson?.type !== 'SEQUENCE') return state;
  const k = String(key);
  if (!x.lesson.seq.items.some((i) => i[0] === k) || x.it.seq.includes(k)) return state;
  x.it.seq = [...x.it.seq, k];
  return put(state, course);
}

export function seqUndo(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !x.it.seq.length) return state;
  x.it.seq = x.it.seq.slice(0, -1);
  return put(state, course);
}

export function seqClear(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked) return state;
  x.it.seq = [];
  return put(state, course);
}

export function showHint(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !x.lesson?.hint) return state;
  x.it.hint = true;
  return put(state, course);
}

function recordAnswer(course, id, correct) {
  const rec = { ...(course.lessons[id] || {}) };
  if (rec.firstCorrect == null) {
    rec.firstCorrect = !!correct;
    course.stats.firstTotal += 1;
    if (correct) course.stats.firstCorrect += 1;
  }
  rec.done = true;
  course.lessons[id] = rec;
  if (correct) course.stats.knowledgeCorrect += 1;
  else course.stats.knowledgeWrong += 1;
  if (correct) delete course.review[id];
  else course.review[id] = (course.review[id] || 0) + 1;
}

export function lockAnswer(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !isKnowledge(x.lesson)) return state;
  const { cur, lesson, it, id } = x;
  if (lesson.type === 'SEQUENCE') {
    if (it.seq.length !== lesson.seq.items.length) return state;
    it.correct = it.seq.every((k, i) => k === lesson.seq.answer[i]);
  } else {
    if (it.choice == null) return state;
    it.correct = String(it.choice) === String(lesson.answer);
  }
  it.locked = true;
  it.done = true;
  if (!cur.dev) recordAnswer(course, id, it.correct);
  return put(state, course);
}

export function acknowledgeLearn(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || x.lesson?.type !== 'LEARN') return state;
  x.it.locked = true;
  x.it.done = true;
  if (!x.cur.dev) course.lessons[x.id] = { ...(course.lessons[x.id] || {}), done: true };
  return put(state, course);
}

function toggleIn(list, key) { return list.includes(key) ? list.filter((k) => k !== key) : [...list, key]; }

export function toggleCheck(state, key) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !x.lesson?.practice?.checks?.some((c) => c[0] === String(key))) return state;
  x.it.checks = toggleIn(x.it.checks, String(key));
  return put(state, course);
}

export function toggleVariant(state, key) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !x.lesson?.practice?.variants?.some((c) => c[0] === String(key))) return state;
  x.it.variants = toggleIn(x.it.variants, String(key));
  return put(state, course);
}

/** Self-evaluation. Logs a practice session (unless Dev preview). Never fails the player, never gates. */
export function rate(state, rating) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || x.lesson?.type !== 'PRACTICE') return state;
  const r = ratingSet(x.lesson).find((o) => o[0] === String(rating));
  if (!r) return state;
  x.it.rating = r[0];
  x.it.done = true;
  x.it.locked = true;
  if (x.cur.dev) return put(state, course);
  const skillId = x.lesson.practiceLesson || x.id;
  const p = { sessions: 0, variants: [], ...(course.practice[skillId] || {}) };
  p.sessions = (p.sessions || 0) + 1;
  p.last = r[0];
  p.lastAt = new Date().toISOString();
  p.noticed = [...x.it.checks];
  p.variants = [...new Set([...(p.variants || []), ...x.it.variants])];
  course.practice[skillId] = p;
  course.stats.practiceSessions += 1;
  course.lessons[x.id] = { ...(course.lessons[x.id] || {}), done: true };
  if (r[2]) course.needsPractice[skillId] = true;
  else delete course.needsPractice[skillId];
  course.skipped = clearSkipped(course.skipped, x.id);
  // A completed self-evaluation = the table work was performed and recorded → Drill XP (one drill session,
  // objective achieved). Honest NEEDS PRACTICE ratings never fail you, so every rating counts as performed.
  const out = awardRecordedStep(put(state, course), STORAGE_KEY, COURSE_TITLE, x.lesson, { ratio: 1, passed: true });
  x.it.xp = out.drill;
  return out.state;
}

/** SKIP TABLE STEP (PRACTICE lessons and physical exam checkpoints): not attempted, 0 Drill XP, never blocks.
 *  The skill goes on the NEEDS PRACTICE list. */
export function skipTableStep(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || x.lesson?.type !== 'PRACTICE') return state;
  x.it.skipped = true;
  x.it.rating = null;
  x.it.done = true;
  x.it.locked = true;
  if (x.cur.dev) return put(state, course);
  const skillId = x.lesson.practiceLesson || x.id;
  course.stats.tableSkipped += 1;
  course.skipped = markSkipped(course.skipped, x.id);
  course.needsPractice[skillId] = true;
  course.lessons[x.id] = { ...(course.lessons[x.id] || {}), done: true, skipped: true };
  return put(state, course);
}

/** Persistent list of skipped table steps (come back later). */
export function skippedIds(course) { return Object.keys(course.skipped || {}).filter((id) => lessonById(id)?.type === 'PRACTICE'); }

export function toggleNeedsPractice(state, lessonId) {
  const course = courseOf(state);
  const lesson = lessonById(lessonId);
  if (!lesson || lesson.type !== 'PRACTICE' || course.current?.dev) return state;
  if (course.needsPractice[lessonId]) delete course.needsPractice[lessonId];
  else course.needsPractice[lessonId] = true;
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

export function summarize(cur) {
  let kOk = 0, kTot = 0, xDone = 0, xTot = 0;
  const missed = [];
  const mastered = [];
  const notYet = [];
  const skipped = [];
  for (const id of cur.order) {
    const lesson = lessonById(id);
    const it = cur.items[id];
    if (!lesson || !it) continue;
    if (isKnowledge(lesson)) {
      kTot += 1;
      if (it.correct) { kOk += 1; mastered.push(id); } else missed.push(id);
    } else if (lesson.type === 'PRACTICE' && it.skipped) {
      skipped.push(id);
    } else if (lesson.type === 'PRACTICE') {
      xTot += 1;
      const r = ratingSet(lesson).find((o) => o[0] === it.rating);
      if (r && !r[2]) xDone += 1; else notYet.push(id);
    }
  }
  const kRate = kTot ? kOk / kTot : 1;
  const overall = (kTot + xTot) ? (kOk + xDone) / (kTot + xTot) : 0;
  const recommend = [...new Set(missed.map((id) => lessonById(id)?.section).filter(Boolean))];
  return { kOk, kTot, kRate, xDone, xTot, overall, missed, mastered, notYet, skipped, recommend };
}

export function finishRun(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return state;
  const s = summarize(cur);
  const graded = cur.mode === 'section' || cur.mode === 'exam';
  const passed = cur.mode === 'exam' ? s.kRate >= EXAM_PASS : (s.kTot ? s.kRate >= KNOWLEDGE_PASS : true);
  cur.phase = 'results';
  cur.summary = { ...s, passed, graded };
  if (cur.dev || !graded) return put(state, course);
  if (cur.mode === 'section') {
    const prev = { passed: false, attempts: 0, bestKnowledge: 0, ...(course.sections[cur.sectionId] || {}) };
    prev.attempts += 1;
    prev.knowledgeCorrect = s.kOk;
    prev.knowledgeTotal = s.kTot;
    prev.bestKnowledge = Math.max(prev.bestKnowledge || 0, s.kRate);
    prev.missed = s.missed;
    if (passed) prev.passed = true;
    course.sections[cur.sectionId] = prev;
  } else {
    course.exam.attempts += 1;
    course.exam.bestKnowledge = Math.max(course.exam.bestKnowledge || 0, s.kRate);
    course.exam.bestOverall = Math.max(course.exam.bestOverall || 0, s.overall);
    if (passed) course.exam.passed = true;
    course.exam.lastMissed = s.missed;
    course.exam.history = [...(course.exam.history || []), {
      at: new Date().toISOString(),
      knowledge: Math.round(s.kRate * 100),
      physical: s.xTot ? `${s.xDone}/${s.xTot}` : (s.skipped.length ? 'skipped' : '0/0'),
      skipped: s.skipped.length,
      overall: Math.round(s.overall * 100),
      passed,
      missed: s.missed.length
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
  if (cur.mode === 'review' || cur.mode === 'needs') return startReview(cleared, cur.mode);
  return cleared;
}

export function reviewMissed(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur?.summary?.missed?.length) return state;
  course.current = freshRun(cur.summary.missed, { mode: 'review', dev: !!cur.dev });
  return put(state, course);
}

export function clearCurrent(state) {
  const course = courseOf(state);
  if (!course.current) return state;
  course.current = null;
  return put(state, course);
}

export function passedSectionCount(course) { return SECTIONS.filter((s) => sectionPassed(course, s.id)).length; }

/** Course progress (separate from shot stats). */
export function progressSummary(state) {
  const course = courseOf(state);
  const done = (l) => lessonCompleted(course, l.id);
  const all = LESSONS;
  const k = all.filter(isKnowledge);
  const bridgeSections = SECTIONS.filter((s) => s.area === 'bridges').map((s) => s.id);
  const stanceStroke = ['stance', 'forearm-grip', 'stroke', 'tip-eyes', 'stroke-drill', 'stroke-memory'];
  const bridgePractice = all.filter((l) => l.type === 'PRACTICE' && bridgeSections.includes(l.section));
  return {
    lessonsDone: all.filter(done).length,
    lessonsTotal: all.length,
    checksDone: k.filter(done).length,
    checksTotal: k.length,
    firstAccuracy: course.stats.firstTotal ? course.stats.firstCorrect / course.stats.firstTotal : null,
    firstTotal: course.stats.firstTotal,
    fundamentalsMastered: SECTIONS.filter((s) => s.area === 'fundamentals' && sectionPassed(course, s.id)).length,
    fundamentalsTotal: SECTIONS.filter((s) => s.area === 'fundamentals').length,
    sectionsPassed: passedSectionCount(course),
    sectionsTotal: SECTIONS.length,
    bridgesPracticed: bridgePractice.filter((l) => course.practice[l.id]?.sessions).length,
    bridgesTotal: bridgePractice.length,
    stanceStrokeDone: all.filter((l) => stanceStroke.includes(l.section) && done(l)).length,
    stanceStrokeTotal: all.filter((l) => stanceStroke.includes(l.section)).length,
    practiceSessions: course.stats.practiceSessions,
    needsPractice: needsPracticeIds(course).length,
    tableSkipped: course.stats.tableSkipped || 0,
    review: reviewIds(course).length,
    examAttempts: course.exam.attempts,
    examBest: course.exam.bestKnowledge,
    examPassed: !!course.exam.passed
  };
}

export function pkfFundProgressRows(state) {
  const course = courseOf(state);
  const rows = [];
  const started = !!((course.current && !course.current.dev) || Object.keys(course.sections).length || Object.keys(course.lessons).length);
  if (started) {
    const done = passedSectionCount(course);
    const total = SECTIONS.length;
    rows.push({ id: 'pkfFund', name: COURSE_TITLE, href: '#pkffund', short: 'PKF Fundamentals', done, total, finished: done >= total });
  }
  const examStarted = !!(course.exam?.attempts || course.exam?.passed || (course.current && !course.current.dev && course.current.mode === 'exam'));
  if (examStarted) {
    rows.push({ id: 'pkfFundExam', name: EXAM_TITLE, href: '#pkffund/exam', short: 'PKF Fund Exam', done: course.exam.passed ? 1 : 0, total: 1, finished: !!course.exam.passed });
  }
  return rows;
}

export function pkfFundBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkffund" data-pkffund="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${SECTIONS.length} sections from PKF Fundamentals: shooting line, stance, grip, stroke, the stroke drill, then every stance and bridge PKF shows.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkffund/exam" data-pkffund="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Knowledge checks + physical checkpoints. Pass at ${Math.round(EXAM_PASS * 100)}% knowledge.${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkffund="exam" data-pkffund-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
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

export { figureHTML, revealFigureHTML, assetOf, regionOf, ASSET_MAP, REGIONS };

export function auditCourse() {
  const problems = [];
  const ids = new Set();
  for (const l of [...LESSONS, ...EXAM_ITEMS]) {
    if (ids.has(l.id)) problems.push(`duplicate id ${l.id}`);
    ids.add(l.id);
    if (!assetOf(l.id)) problems.push(`no asset for ${l.id}`);
    if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
    if (!l.src || !/Page/.test(l.src)) problems.push(`no source page ${l.id}`);
    if (!l.explain) problems.push(`no explanation ${l.id}`);
    if (l.type === 'IDENTIFY' || l.type === 'IMPORTANT') {
      if (!l.choices?.some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
    }
    if (l.type === 'SEQUENCE') {
      const keys = (l.seq?.items || []).map((i) => i[0]);
      const a = l.seq?.answer || [];
      const sh = l.seq?.shown || [];
      if (a.length !== keys.length || !a.every((k) => keys.includes(k)) || new Set(a).size !== a.length) problems.push(`sequence answer not a permutation ${l.id}`);
      if (sh.length !== keys.length || !sh.every((k) => keys.includes(k))) problems.push(`sequence shown not a permutation ${l.id}`);
    }
    if (l.type === 'PRACTICE' && !l.physical) {
      if (!l.practice?.setup || !l.practice?.focus?.length) problems.push(`practice missing setup/focus ${l.id}`);
      if (!RATINGS[l.practice.rating]) problems.push(`practice rating ${l.id}`);
    }
    if (!LTYPE[l.type]) problems.push(`bad type ${l.id}`);
  }
  for (const s of SECTIONS) if (!knowledgeLessons(s.id).length) problems.push(`section without knowledge check ${s.id}`);
  for (const l of LESSONS) if (!ASSIST[l.assist]) problems.push(`bad assist ${l.id}`);
  return problems;
}
