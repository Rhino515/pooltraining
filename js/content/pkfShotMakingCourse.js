/**
 * PKF Shot Making & Center Ball Course (+ PKF Shot Making & Center Ball Exam).
 * Source: PKF Pattern Play / Cue Ball Control, Chapter Three CENTER BALL, printed pages 23–43
 * (PKF-Master PDF pages 35–58: divider, blank, 37–57, blank). Original JPEGs only (images/pkf-smcb/).
 * Every lesson cites its printed page; explanations quote or paraphrase PKF. No outside instruction.
 * App mechanics (lock/reveal, 70% section gate, 80% exam pass, 3 attempts per physical exercise)
 * are app settings, not PKF rules. See docs/PKF_SHOTMAKING_CENTERBALL_SOURCE_MAP.md.
 *
 * This chapter used to be the first section of the PKF Cue Ball Control Course. It now lives here only.
 * migrateFromCueBall() copies old Center Ball progress across once (old data is left in place).
 */
import { ASSET_MAP, REGIONS, figureHTML, solutionFigureHTML, assetOf, regionOf, mappingRow } from './pkfShotMakingAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Shot Making & Center Ball Course';
export const EXAM_TITLE = 'PKF Shot Making & Center Ball Exam';
export const SHORT_TITLE = 'PKF Shot Making & Center Ball';
export const STORAGE_KEY = 'pkfShotMakingCenterBall';
export const HASH = 'pkfsmcb';
/** App settings (same pattern as the Cue Ball Control Course). Not PKF rules. */
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;
export const ATTEMPTS_MAX = 3;
export const NOT_SPECIFIED = 'Not specified in PKF';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  IDENTIFY: 'IDENTIFY',
  PREDICT: 'PREDICT',
  CHOOSE: 'CHOOSE CONTACT / ACTION',
  SHOOT: 'SET UP THIS SHOT'
};
export const KNOWLEDGE_TYPES = ['IDENTIFY', 'PREDICT', 'CHOOSE'];

/**
 * Physical exercise kinds (result buttons):
 *  pocket — MAKE / MISS (simple pocketing).
 *  action — SHOT MADE + CORRECT ACTION / SHOT MADE + INCORRECT ACTION / SHOT MISSED. Success = made + correct action.
 *  check  — drills where PKF names no pocket (rail-return, 9-ball center check, stop / draw drills):
 *           CORRECT ACTION / INCORRECT ACTION. Success = correct action. Pocketing is shown as "Not specified in PKF".
 */
export const PHYS = {
  pocket: [['make', 'MAKE', true, true], ['miss', 'MISS', false, false]],
  action: [['madeCorrect', 'SHOT MADE + CORRECT ACTION', true, true], ['madeWrong', 'SHOT MADE + INCORRECT ACTION', true, false], ['miss', 'SHOT MISSED', false, false]],
  check: [['correct', 'CORRECT ACTION', null, true], ['incorrect', 'INCORRECT ACTION', null, false]]
};
/** tag → { made: true|false|null (null = no pocket in this drill), objective: bool } */
export function tagInfo(kind, tag) {
  const row = (PHYS[kind] || []).find((r) => r[0] === tag);
  return row ? { made: row[2], objective: row[3] } : null;
}

export const SECTIONS = [
  { id: 'center-vs-sidespin', n: 1, title: 'Center Ball vs Sidespin', blurb: 'Center, center low and center high stay on the shooting line; sidespin deflects it.', pages: '23–26' },
  { id: 'elevation-variables', n: 2, title: 'Elevation & Sidespin Variables', blurb: 'Level vs elevated cue with sidespin, and the variables PKF lists.', pages: '26–27' },
  { id: 'finding-center', n: 3, title: 'Finding Center', blurb: 'Finding true center, the 9-ball drill and the rail-return drills.', pages: '27–29' },
  { id: 'high-action', n: 4, title: 'High Action', blurb: 'Aiming high enough, and following the cue ball into the pocket.', pages: '29–30' },
  { id: 'low-action', n: 5, title: 'Low Action', blurb: 'True low contact, PKF’s draw-shot checklist and the diamond draw drill.', pages: '31–33' },
  { id: 'stop-shot', n: 6, title: 'Stop Shot', blurb: 'Sliding at contact, degrees of low, and the Mosconi Cup stop drill.', pages: '33–36' },
  { id: 'low-action-position', n: 7, title: 'Low Action for Position', blurb: 'Minimizing angles, holding the cue ball, and Mike Massey’s Low Action.', pages: '36–37' },
  { id: 'throw', n: 8, title: 'Ball Pocketing & Throw', blurb: 'Throw without sidespin: aim a little thinner, overcut slightly.', pages: '38' },
  { id: 'combination-throw', n: 9, title: 'Combination Throw', blurb: 'Frozen balls: which side of the combination you end up on.', pages: '39' },
  { id: 'pocketing-drills', n: 10, title: 'Ball Pocketing Drills', blurb: 'Center, center high and center low with a target for the cue ball.', pages: '40–42' },
  { id: 'automatic-aiming', n: 11, title: 'Automatic Aiming', blurb: 'PKF’s automatic aiming and the three-second drill.', pages: '42–43' }
];
export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

const L = [
  // ---------------------------------------------------------------- 1 · Center Ball vs Sidespin (pages 23–26)
  { id: 'smcb-intro', section: 'center-vs-sidespin', type: 'LEARN', assist: 'GUIDED', title: 'Center before sidespin', src: 'Page 23 · Figures 3-1, 3-2', concept: 'Center ball before sidespin', from: 'cb-intro',
    prompt: 'Read the Center Ball introduction and figures 3-1 and 3-2.',
    explain: 'PKF: “If you can’t control the cue ball without sidespin, you’ll never control the cue ball with sidespin.” Before position fundamentals, understand the differences between shooting center ball and shooting with sidespin. Many players never learned to control the cue ball without sidespin; they jumped into sidespin, which made them inconsistent. Once they learn to control the cue ball without sidespin, they become more consistent at positional play. Figure 3-1: center ball with a fairly level cue stick. Without sidespin the cue ball travels straight down the line (figure 3-2).' },
  { id: 'smcb-elevate', section: 'center-vs-sidespin', type: 'LEARN', assist: 'GUIDED', title: 'Elevated cue, no sidespin', src: 'Page 24 · Figures 3-3, 3-4', concept: 'Center family stays on the shooting line', from: 'cb-elevate-center',
    prompt: 'Study figures 3-3 and 3-4.',
    explain: 'PKF elevates the cue stick and shoots below center with no sidespin (figure 3-3); the cue ball stays on the shooting line (figure 3-4). PKF: “As long as you shoot center, center low or center high, your cue ball will stay on the shooting line regardless of how level your cue stick is.”' },
  { id: 'smcb-q-line', section: 'center-vs-sidespin', type: 'CHOOSE', assist: 'GUIDED', title: 'Tough shot on your last ball', src: 'Page 24', concept: 'Center family stays on the shooting line',
    prompt: 'You have a tough shot on your last ball in 8-Ball. Which tip contacts does PKF say keep the cue ball on the shooting line, regardless of how level your cue stick is?',
    hint: 'PKF names three contact points, none of them with sidespin.',
    choices: [['center', 'Center, center low or center high'], ['left', 'Left sidespin'], ['right', 'Right sidespin']], answer: 'center',
    explain: 'PKF: “As long as you shoot center, center low or center high, your cue ball will stay on the shooting line regardless of how level your cue stick is. This is important to remember as we move on to show how sidespin moves the cue ball off the shooting line.”' },
  { id: 'smcb-left-deflect', section: 'center-vs-sidespin', type: 'PREDICT', assist: 'GUIDED', title: 'Left sidespin, level cue', src: 'Page 24 · Figures 3-5, 3-6', concept: 'Deflection', from: 'cb-left-deflect',
    prompt: 'Figure 3-5: PKF strikes the cue ball with left sidespin, keeping the cue stick as level as possible. Which way does the cue ball go?',
    hint: 'Striking one side pushes the cue ball the other way.',
    choices: [['right', 'Veers off to the right of the shooting line'], ['left', 'Veers off to the left of the shooting line'], ['straight', 'Stays on the shooting line']], answer: 'right',
    explain: 'PKF: “As soon as I strike the cue ball it veers off the shooting line (figure 3-6). By striking the cue ball on the left side it pushes the cue ball to the right of the line. This is referred to as deflection.”' },
  { id: 'smcb-id-deflection', section: 'center-vs-sidespin', type: 'IDENTIFY', assist: 'GUIDED', title: 'Name it', src: 'Page 24 · Figure 3-6', concept: 'Deflection',
    prompt: 'Figure 3-6: left sidespin pushed the cue ball to the right of the line. What does PKF call this?',
    choices: [['deflection', 'Deflection'], ['throw', 'Throw'], ['sliding', 'Sliding cue ball']], answer: 'deflection',
    explain: 'PKF: “By striking the cue ball on the left side it pushes the cue ball to the right of the line. This is referred to as deflection.” (Throw, on page 38, is what happens to the object ball.)' },
  { id: 'smcb-elevated-firm', section: 'center-vs-sidespin', type: 'LEARN', assist: 'ASSISTED', title: 'Elevation and speed with sidespin', src: 'Page 24 · Figures 3-7, 3-8', concept: 'Sidespin with elevation and speed',
    prompt: 'Study figures 3-7 and 3-8.',
    explain: 'PKF: “In figure 3-7 I’m going to elevate my cue stick and shoot at a firm speed using left sidespin. This added elevation and speed really causes the cue ball to veer off the shooting line sending it toward the end rail (figure 3-8).”' },
  { id: 'smcb-right-veer', section: 'center-vs-sidespin', type: 'PREDICT', assist: 'ASSISTED', title: 'Now with right spin', src: 'Page 25 · Figure 3-9', concept: 'Deflection', from: 'cb-right-veer',
    prompt: 'Same cue stick elevation and speed as figure 3-7, but PKF strikes the cue ball with right spin. Which way does the cue ball veer?',
    hint: 'Compare with left sidespin in figure 3-6.',
    choices: [['left', 'Off the shooting line to the left'], ['right', 'Off the shooting line to the right'], ['straight', 'It stays on the shooting line']], answer: 'left',
    explain: 'PKF: “With the same cue stick elevation and speed, I’m going to strike the cue ball with right spin causing the cue ball to veer off the shooting line to the left (figure 3-9).”' },
  { id: 'smcb-long-8', section: 'center-vs-sidespin', type: 'PREDICT', assist: 'ASSISTED', title: 'Long shot on the 8 ball', src: 'Page 25 · Figures 3-10, 3-11', concept: 'Sidespin causes misses',
    prompt: 'Figure 3-10: a long shot on the 8 ball. Without sidespin the cue ball stays on the shooting line. Now use the same aiming line, left spin and a level cue stick. What happens?',
    choices: [['miss-right', 'The cue ball veers off the path to the right, causing a miss'], ['make', 'It stays on the path and the 8 goes in'], ['miss-left', 'The cue ball veers off the path to the left, causing a miss']], answer: 'miss-right',
    explain: 'PKF: “If we strike the cue ball without sidespin the cue ball will stay on the shooting line (figure 3-10). It doesn’t matter if our cue stick is elevated or level… But, if we use the same aiming line and strike the cue ball with left spin and a level cue stick, the cue ball veers off the path to the right causing a miss (figure 3-11).”' },
  { id: 'smcb-rule-spin', section: 'center-vs-sidespin', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Left vs right spin', src: 'Page 25 · Figures 3-12, 3-13', concept: 'Deflection direction', from: 'cb-rule-spin',
    prompt: 'According to PKF, which way do left spin and right spin each send the cue ball relative to the shooting line?',
    hint: 'Each side pushes the ball the opposite way.',
    choices: [['opp', 'Left spin → right of the line; right spin → left of the line'], ['same', 'Left spin → left of the line; right spin → right of the line'], ['none', 'Neither leaves the line with a level cue']], answer: 'opp',
    explain: 'PKF: “In figure 3-12 I’ll be striking the cue ball with left spin which causes the cue ball to veer to the right of the shooting line. If I’m using right spin this will cause the cue ball to veer to the left of this line (figure 3-13).”' },
  { id: 'smcb-ghost-line', section: 'center-vs-sidespin', type: 'LEARN', assist: 'ASSISTED', title: 'Shooting line from the ghost ball', src: 'Pages 25–26 · Figures 3-14, 3-15', concept: 'Sidespin causes misses',
    prompt: 'Study figures 3-14 and 3-15.',
    explain: 'PKF: “In figure 3-14 I need to pocket the 8 ball in the side pocket. The cue ball needs to contact the 8 ball here (A) to send it toward the side pocket. We can now create our shooting line from this ghost ball. If we were to shoot this shot with center ball we can shoot straight down this shooting line and pocket the object ball. But, if we use right spin (figure 3-15), this is going to cause the cue ball to veer to the left of this shooting line causing a miss.”' },
  { id: 'smcb-q-adjust', section: 'center-vs-sidespin', type: 'CHOOSE', assist: 'INDEPENDENT', title: 'Adjust for right spin', src: 'Page 26 · Figure 3-16', concept: 'Adjusting the shooting line for sidespin',
    prompt: 'You want to shoot the figure 3-14 shot with right spin. How does PKF adjust the shooting line?',
    choices: [['right', 'Move the shooting line to the right'], ['left', 'Move the shooting line to the left'], ['same', 'Keep the center-ball shooting line']], answer: 'right',
    explain: 'PKF: “If we’re going to use right spin we need to adjust the shooting line. Since the cue ball is going to veer to the left of the line, we need to move our shooting line to the right (figure 3-16). By moving the shooting line we can see that our ghost ball has also been moved to the right (A). Now when the cue ball veers to the left, it will strike the object ball in the correct spot (B).”' },

  // ---------------------------------------------------------------- 2 · Elevation & Sidespin Variables (pages 26–27)
  { id: 'smcb-q-level', section: 'elevation-variables', type: 'PREDICT', assist: 'GUIDED', title: 'Level cue with sidespin', src: 'Page 26', concept: 'Level cue: never returns to the line',
    prompt: 'Your cue stick is level and you use sidespin. Does the speed you strike the cue ball bring it back to the shooting line?',
    hint: 'PKF: with a level cue, speed doesn’t matter.',
    choices: [['never', 'No. At any speed, the cue ball will not return to the shooting line'], ['soft', 'Yes, at a soft speed it returns'], ['firm', 'Yes, at a firm speed it returns']], answer: 'never',
    explain: 'PKF: “As long as your cue stick is level it doesn’t matter what speed you strike the cue ball using sidespin, the cue ball will not return to the shooting line.”' },
  { id: 'smcb-swerve', section: 'elevation-variables', type: 'LEARN', assist: 'GUIDED', title: 'Elevated cue curves back', src: 'Pages 26–27 · Figures 3-17, 3-18', concept: 'Elevated cue: returns to the line', from: 'cb-swerve',
    prompt: 'Study figures 3-17 and 3-18.',
    explain: 'PKF: “In figure 3-17 I’m going to use an elevated cue stick as I strike the cue ball with left spin at a medium soft speed; this will cause the cue ball to veer to the right of the shooting line, but, unlike before, the cue ball curves back to the shooting line (figure 3-18).”' },
  { id: 'smcb-q-more-angle', section: 'elevation-variables', type: 'PREDICT', assist: 'ASSISTED', title: 'Even more elevation', src: 'Page 27 · Figure 3-19', concept: 'Elevated cue: returns to the line',
    prompt: 'PKF increases the angle of the cue stick even more than in figure 3-17. What does the cue ball do?',
    choices: [['cross', 'Returns to the shooting line and actually crosses it'], ['never', 'Never returns to the shooting line'], ['straight', 'Stays on the shooting line the whole way']], answer: 'cross',
    explain: 'PKF: “In this example I’ll increase the angle of my cue stick even more which causes the cue ball to not only return to the shooting line, but actually cross it (figure 3-19). So now we know that if your cue stick is level when using sidespin, the cue ball is pushed off the shooting line and will never return to it. When your cue stick is angled when using sidespin, the cue ball is pushed off the shooting line but eventually returns to the line and may even cross it.”' },
  { id: 'smcb-variables', section: 'elevation-variables', type: 'LEARN', assist: 'ASSISTED', title: 'Sidespin variables', src: 'Page 27', concept: 'Sidespin variables',
    prompt: 'Read PKF’s list of sidespin variables.',
    explain: 'PKF: “When shooting with sidespin, there are several variables to remember: the distance between the cue ball and object ball; the speed in which you strike the cue ball; the elevation of your cue stick; the amount of sidespin you use; the type of shaft you are using. A low deflection shaft will have minimal cue ball deflection. A shaft that isn’t low deflection will push the cue ball more off the shooting line.”' },
  { id: 'smcb-q-variables', section: 'elevation-variables', type: 'IDENTIFY', assist: 'INDEPENDENT', title: 'On PKF’s list?', src: 'Page 27', concept: 'Sidespin variables',
    prompt: 'Which of these is one of PKF’s sidespin variables?',
    choices: [['elevation', 'The elevation of your cue stick'], ['throw', 'How much the object ball is thrown'], ['chalk', 'How well your tip is chalked']], answer: 'elevation',
    explain: 'PKF’s variables: distance between the cue ball and object ball, the speed you strike the cue ball, the elevation of your cue stick, the amount of sidespin, and the type of shaft. Throw (page 38) and chalk (page 32) are covered elsewhere in the chapter.' },
  { id: 'smcb-q-shaft', section: 'elevation-variables', type: 'IDENTIFY', assist: 'INDEPENDENT', title: 'Shaft type', src: 'Page 27', concept: 'Sidespin variables',
    prompt: 'Which shaft does PKF say will have minimal cue ball deflection?',
    choices: [['low', 'A low deflection shaft'], ['not-low', 'A shaft that isn’t low deflection']], answer: 'low',
    explain: 'PKF: “A low deflection shaft will have minimal cue ball deflection. A shaft that isn’t low deflection will push the cue ball more off the shooting line.”' },

  // ---------------------------------------------------------------- 3 · Finding Center (pages 27–29)
  { id: 'smcb-find-center', section: 'finding-center', type: 'LEARN', assist: 'GUIDED', title: 'Finding Center', src: 'Page 27 · Figure 3-20', concept: 'Finding center', from: 'cb-find-center',
    prompt: 'Read Finding Center and figure 3-20.',
    explain: 'PKF: even students who play for a living are not always able to find center on the cue ball; when told to place their tip at center, it’s either right or left of center. In figure 3-20 the student thinks his tip is at the center, but from above his tip is actually center left, so his center-ball shots carry a little sidespin. “Even a little amount of sidespin is enough to throw the shot off. This is the reason why many players miss long straight in shots.” PKF: “One of the most important building blocks of becoming a strong player is being able to find center on the cue ball.”' },
  { id: 'smcb-q-tip-where', section: 'finding-center', type: 'IDENTIFY', assist: 'GUIDED', title: 'Where is the tip?', src: 'Page 27 · Figure 3-20', concept: 'Finding center',
    prompt: 'Figure 3-20, seen from above. The student thinks his tip is at the center of the cue ball. Where is it actually?',
    choices: [['center-left', 'Center left'], ['center-right', 'Center right'], ['center', 'At center']], answer: 'center-left',
    explain: 'PKF: “In figure 3-20 my student thinks his tip is at the center of the cue ball. But, from above, we can see that his tip is actually center left which means when he is shooting shots using center ball he is actually applying a little sidespin to the cue ball.”' },
  { id: 'smcb-q-long-straight', section: 'finding-center', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Missing long straight-in shots', src: 'Page 27', concept: 'Finding center',
    prompt: 'Why does PKF say many players miss long straight-in shots?',
    choices: [['offcenter', 'Without realizing it, they strike the cue ball off center with left or right spin'], ['throw', 'They don’t allow for throw'], ['high', 'They aren’t aiming high enough on the cue ball']], answer: 'offcenter',
    explain: 'PKF: “Even a little amount of sidespin is enough to throw the shot off. This is the reason why many players miss long straight in shots. Without realizing it, they’re striking the cue ball off center with left or right spin which is going to alter their cue ball path.”' },
  { id: 'smcb-9drill', section: 'finding-center', type: 'LEARN', assist: 'ASSISTED', title: 'The 9-ball center drill', src: 'Page 28 · Figures 3-21 to 3-23', concept: 'Center-ball drill', from: 'cb-stop-9drill',
    prompt: 'Read PKF’s first center drill.',
    explain: 'PKF suggests reinforcement labels (figure 3-21) so the balls go in the exact same position time after time. Place an object ball about a diamond away from the corner pocket, then the 9 ball about a quarter diamond away from the object ball on the same pocket line (figure 3-22), with the number 9 at the top of the ball (A). “The goal of this drill is to shoot center on the 9 ball so the 9 ball stops when it strikes the object ball.” Struck with center, it slides before it begins rolling; striking an object ball full while sliding, it loses all its energy and stops. The 9 ball shows a mishit: spinning after contact means center right or center left; rolling forward means above center; spinning backward means below center. When it stops, the number 9 should still be at the top (figure 3-23). A little movement is normal; any large movement means it was struck incorrectly.' },
  { id: 'smcb-q-9-forward', section: 'finding-center', type: 'PREDICT', assist: 'ASSISTED', title: '9 ball rolls forward', src: 'Page 28', concept: 'Center-ball drill',
    prompt: 'In the 9-ball drill, the 9 ball rolls forward after contact with the object ball. What does PKF say that means?',
    choices: [['above', 'You struck the 9 ball above center'], ['below', 'You struck it below center'], ['side', 'You struck it center right or center left']], answer: 'above',
    explain: 'PKF: “If the 9 ball rolls forward after contact with the object ball that means I struck the 9 ball above center.”' },
  { id: 'smcb-q-9-back', section: 'finding-center', type: 'PREDICT', assist: 'ASSISTED', title: '9 ball spins backward', src: 'Page 28', concept: 'Center-ball drill',
    prompt: 'In the 9-ball drill, the 9 ball spins backward after contact. What does PKF say that means?',
    choices: [['below', 'You struck below center'], ['above', 'You struck above center'], ['side', 'You struck center right or center left']], answer: 'below',
    explain: 'PKF: “If the 9 ball spins backward that means I struck the cue ball below center.” Spinning after contact means center right or center left; rolling forward means above center.' },
  { id: 'smcb-shoot-9drill', section: 'finding-center', type: 'SHOOT', assist: 'ASSISTED', title: 'Shoot the 9-ball center drill', src: 'Page 28 · Figures 3-21 to 3-23', concept: 'Center-ball drill', from: 'cb-shoot-center',
    prompt: 'Set up PKF’s 9-ball drill and shoot center on the 9 ball.',
    physical: { kind: 'check',
      setup: ['Place an object ball about a diamond away from the corner pocket.', 'Place the 9 ball about a quarter diamond away from the object ball on the same pocket line (figure 3-22).', 'Make sure the number 9 is at the top of the ball (A).', 'Reinforcement labels (figure 3-21) let you place the balls in the exact same position time after time.'],
      objective: 'The 9 ball stops when it strikes the object ball, with the number 9 still at the top (figure 3-23). A little movement is normal; any large movement of the number 9 means it was struck incorrectly.',
      goal: 'Keep shooting the shot until you can consistently strike the 9 ball in the center.',
      gaps: ['Speed', 'Whether the object ball is pocketed'] },
    explain: 'PKF: spinning after contact → center right or center left; rolling forward → above center; spinning backward → below center.' },
  { id: 'smcb-rail-return', section: 'finding-center', type: 'CHOOSE', assist: 'ASSISTED', title: 'Rail-return drill', src: 'Pages 28–29 · Figures 3-24, 3-25', concept: 'Rail-return center drill', from: 'cb-rail-return',
    prompt: 'Figure 3-24: the cue ball sits directly across from the second diamond of the side rail and is shot at that diamond. Where on the cue ball does PKF aim so it comes back to the tip?',
    hint: 'This drill exposes accidental sidespin.',
    choices: [['center', 'Center'], ['left', 'Left spin'], ['right', 'Right spin']], answer: 'center',
    explain: 'PKF: “Shoot the cue ball at the second diamond aiming center on the cue ball, and remain still as the cue ball banks off the rail. If struck correctly the cue ball should return back to the tip of the cue stick. If the cue ball isn’t coming back to the tip area that means you added sidespin to the cue ball.” In figure 3-25 the player accidentally added left spin, so the cue ball comes off the rail at an angle.' },
  { id: 'smcb-shoot-rail', section: 'finding-center', type: 'SHOOT', assist: 'ASSISTED', title: 'Shoot the rail-return drill', src: 'Page 28 · Figure 3-24', concept: 'Rail-return center drill', from: 'cb-shoot-center',
    prompt: 'Set up the side-rail version of PKF’s rail-return drill.',
    physical: { kind: 'check',
      setup: ['Place the cue ball directly across from the second diamond of the side rail (figure 3-24).', 'Shoot the cue ball at the second diamond, aiming center on the cue ball.', 'Remain still as the cue ball banks off the rail.'],
      objective: 'The cue ball returns back to the tip of the cue stick. If it isn’t coming back to the tip area, you added sidespin (figure 3-25).',
      goal: 'Once you get consistent at this drill, move on to the full table version (figure 3-26).',
      gaps: ['Speed'] },
    explain: 'PKF: if the cue ball isn’t coming back to the tip area, you added sidespin to the cue ball.' },
  { id: 'smcb-shoot-rail-full', section: 'finding-center', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Shoot the full table version', src: 'Page 29 · Figure 3-26', concept: 'Rail-return center drill',
    prompt: 'Set up the full table version of the rail-return drill.',
    physical: { kind: 'check',
      setup: ['Put the cue ball on the spot (figure 3-26).', 'Aim at the second diamond on the end rail.'],
      objective: 'The cue ball returns to your tip area.',
      gaps: ['Speed'] },
    explain: 'PKF: “Once you get consistent at this drill move on to the full table version (figure 3-26). Put the cue ball on the spot and aim at the second diamond on the end rail. The cue ball should return to your tip area.”' },

  // ---------------------------------------------------------------- 4 · High Action (pages 29–30)
  { id: 'smcb-high-action', section: 'high-action', type: 'LEARN', assist: 'GUIDED', title: 'High Action', src: 'Pages 29–30 · Figures 3-27 to 3-30', concept: 'High action', from: 'cb-high-action',
    prompt: 'Read High Action and figures 3-27 to 3-30.',
    explain: 'PKF: high action “is all about striking the cue ball easier but getting more action out of it.” Figure 3-27: pocket the 13 ball in the side and get the cue ball to the target area for the 8, with the cue ball only about one pool ball from the object ball. It’s difficult because the follow-through is limited, so you must generate high action with an abbreviated stroke, and many players aren’t aiming high enough. From the player’s view the tip looks well above center (figure 3-28), but from the side (figure 3-29) only the bottom of the tip contacts the cue ball, near center. Aiming a lot higher (figure 3-30) makes the bottom of the tip contact much higher, creating more revolutions and extra energy that makes it easier to move the cue ball around the table.' },
  { id: 'smcb-q-high-why', section: 'high-action', type: 'IDENTIFY', assist: 'GUIDED', title: 'Why figure 3-27 is hard', src: 'Page 29 · Figure 3-27', concept: 'High action',
    prompt: 'Figure 3-27: the cue ball is only about one pool ball from the 13. Why does PKF say this shot is difficult for many players?',
    choices: [['limited', 'Their follow-through is limited, so they must generate high action with an abbreviated stroke, and many aren’t aiming high enough'], ['deflect', 'Sidespin deflects the cue ball off the shooting line'], ['throw', 'They don’t allow for throw']], answer: 'limited',
    explain: 'PKF: “The reason why this is a difficult shot for many players is because their follow-through will be limited, so they have to generate high action with an abbreviated stroke. Also, many players aren’t aiming high enough on the cue ball to generate enough high action.”' },
  { id: 'smcb-q-tip-part', section: 'high-action', type: 'PREDICT', assist: 'ASSISTED', title: 'Which part of the tip?', src: 'Page 29 · Figures 3-28, 3-29', concept: 'High action contact',
    prompt: 'When you are aiming above center, which part of the tip does PKF say is making contact with the cue ball?',
    choices: [['bottom', 'The bottom of the tip'], ['top', 'The top of the tip'], ['whole', 'The whole face of the tip']], answer: 'bottom',
    explain: 'PKF: “When you are aiming above center, the only part of the tip that is making contact with the cue ball is the bottom of the tip. Even though from the player’s vantage point it looks like the tip is well above center, the tip is actually striking the cue ball near the center which is why they’re not getting very much forward roll.”' },
  { id: 'smcb-high-follow-in', section: 'high-action', type: 'CHOOSE', assist: 'ASSISTED', title: 'High-action drill goal', src: 'Page 30 · Figure 3-31', concept: 'High action drill', from: 'cb-high-follow-in',
    prompt: 'Figure 3-31: object ball near the corner pocket, cue ball about a half diamond away on the same pocket line. What does PKF’s high-action drill ask for?',
    choices: [['follow', 'Pocket the ball and follow the cue ball into the pocket'], ['pocket', 'Pocket the ball; the cue ball can go anywhere'], ['hard', 'Pocket the ball with the firmest stroke you can']], answer: 'follow',
    explain: 'PKF: “You not only have to pocket the ball but you have to follow the cue ball into the pocket. You should be able to perform this shot with a nice soft stroke using high action. It also requires a very precise hit otherwise the cue ball’s not going to follow the object ball into the pocket.” The goal: see how softly you can strike the cue ball and still have it follow the object ball in.' },
  { id: 'smcb-shoot-high', section: 'high-action', type: 'SHOOT', assist: 'ASSISTED', title: 'Shoot the high-action follow-in', src: 'Page 30 · Figure 3-31', concept: 'High action drill', from: 'cb-shoot-high',
    prompt: 'Set up figure 3-31 and follow the cue ball into the pocket.',
    physical: { kind: 'action',
      setup: ['Place an object ball near the corner pocket.', 'Place the cue ball about a half diamond away from the object ball on the same pocket line (figure 3-31).', 'Use a nice soft stroke using high action.'],
      objective: 'Pocket the ball and follow the cue ball into the pocket.',
      goal: 'Once you get consistent at this distance, gradually move your cue ball farther away. See how softly you can strike the cue ball and still have it follow the object ball into the pocket.' },
    explain: 'PKF: if you’re not getting very much forward movement on the cue ball you may not be striking high enough on the cue ball.' },
  { id: 'smcb-high-close', section: 'high-action', type: 'CHOOSE', assist: 'INDEPENDENT', title: 'One ball away', src: 'Page 30 · Figure 3-32', concept: 'High action, abbreviated stroke', from: 'cb-high-close',
    prompt: 'Figure 3-32: the cue ball is about one ball from the object ball and you still want to follow it into the pocket. What stroke does PKF use?',
    choices: [['abbrev', 'An abbreviated forward stroke, gripping a little tighter, with maximum high'], ['normal', 'A normal follow-through'], ['same', 'The same soft stroke as from a half diamond away']], answer: 'abbrev',
    explain: 'PKF: “Since a normal follow-through will result in double hitting the cue ball, you’ll have to generate cue ball speed with an abbreviated forward stroke. You’ll be gripping the cue stick a little tighter than normal. Focus on a short forward stroke and striking the cue ball with maximum high.”' },
  { id: 'smcb-shoot-high-close', section: 'high-action', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Shoot the one-ball-away follow-in', src: 'Page 30 · Figure 3-32', concept: 'High action, abbreviated stroke', from: 'cb-shoot-high',
    prompt: 'Set up figure 3-32 and follow the object ball into the pocket.',
    physical: { kind: 'action',
      setup: ['Put the cue ball about one ball away from the object ball (figure 3-32).', 'Grip the cue stick a little tighter than normal.', 'Use a short, abbreviated forward stroke and strike the cue ball with maximum high.'],
      objective: 'Pocket the ball and follow it into the pocket.' },
    explain: 'PKF: a normal follow-through will result in double hitting the cue ball.' },

  // ---------------------------------------------------------------- 5 · Low Action (pages 31–33)
  { id: 'smcb-low-action', section: 'low-action', type: 'LEARN', assist: 'GUIDED', title: 'Low Action', src: 'Page 31 · Figures 3-33 to 3-36', concept: 'Low action', from: 'cb-low-action',
    prompt: 'Read Low Action.',
    explain: 'Figure 3-33: pocket the last stripe and draw the cue ball back to the highlighted area for the 8, hitting softer but using low action to control the speed. Many players’ cue balls come off the object ball flat and come up short. From their view the tip looks well below center (figure 3-34), but from the side only part of the tip strikes the cue ball, near center (figure 3-35), giving very little draw. Moving the tip lower (figure 3-36) puts the contact point much lower for more revolutions. PKF: as long as your tip is well chalked and you don’t tighten up the grip prior to impact, you shouldn’t miscue. “If you think you’re going to miscue you probably will, since this thought will cause you to tense up.”' },
  { id: 'smcb-q-miscue', section: 'low-action', type: 'IDENTIFY', assist: 'GUIDED', title: 'Afraid of a miscue', src: 'Page 31 · Figure 3-36', concept: 'Low action',
    prompt: 'Striking the cue ball this low (figure 3-36) scares many players. What does PKF say keeps you from miscuing?',
    choices: [['chalk-grip', 'A well-chalked tip, and not tightening up the grip prior to impact'], ['tight', 'Tightening the grip right before impact'], ['higher', 'Aiming a little higher on the cue ball']], answer: 'chalk-grip',
    explain: 'PKF: “As long as your tip is well chalked and you don’t tighten up the grip prior to impact with the cue ball, you shouldn’t miscue.”' },
  { id: 'smcb-draw-tips', section: 'low-action', type: 'IDENTIFY', assist: 'ASSISTED', title: 'An effective draw shot', src: 'Page 32', concept: 'Draw-shot checklist', from: 'cb-draw-tips',
    prompt: 'Which set matches PKF’s “few things to remember when performing an effective draw shot”?',
    choices: [['pkf', 'Light grip pressure kept the same through the stroke, accelerate through the cue ball, cue as level as possible, head still'], ['tight', 'Grip tightly and tighten up right before impact'], ['elevate', 'Elevate the cue stick and hesitate before impact']], answer: 'pkf',
    explain: 'PKF: stay away from gripping the cue stick too tightly; keep grip pressure light and the same throughout the stroke; accelerate through the cue ball to remove any hesitation prior to impact; keep the cue stick as level as possible (minimize the angle when rails or balls are in the way); keep your head still throughout the stroke. Tightening the grip right before impact can move the cue off the aiming line, resulting in not enough draw or a miscue.' },
  { id: 'smcb-q-power-draw', section: 'low-action', type: 'CHOOSE', assist: 'ASSISTED', title: 'Power draw', src: 'Page 32 · Figure 3-37', concept: 'Power draw',
    prompt: 'Figure 3-37: PKF has to draw the cue ball back for the 9 ball with a power draw. How does PKF strike it?',
    choices: [['less-low', 'Not quite as low, with a bigger stroke'], ['max-low', 'As low as possible, with a bigger stroke'], ['soft', 'Maximum low with a soft stroke']], answer: 'less-low',
    explain: 'PKF: when attempting a power draw shot it’s very difficult to hit the cue ball exactly where you are aiming; the softer the stroke the more accurate you will be, and a mishit could result in a miscue. “Instead, I’m not going to aim quite as low and I’ll put a bigger stroke on the cue ball.”' },
  { id: 'smcb-q-chalk', section: 'low-action', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Chalk before you draw', src: 'Page 32 · Figure 3-38', concept: 'Draw-shot checklist',
    prompt: 'Before a draw stroke, which part of the tip does PKF say needs to be well chalked?',
    choices: [['sides', 'The sides of the tip'], ['center', 'The center of the tip only'], ['none', 'Chalk doesn’t matter for draw']], answer: 'sides',
    explain: 'PKF: “Remember to make sure your tip is well chalked before attempting a draw stroke. As mentioned earlier, only the sides of the tip will be making contact with the cue ball. The red highlighted area in figure 3-38 shows the part of the tip that needs to be well chalked.”' },
  { id: 'smcb-draw-drill', section: 'low-action', type: 'LEARN', assist: 'ASSISTED', title: 'Diamond draw drill', src: 'Pages 32–33 · Figures 3-39, 3-40', concept: 'Draw drill', from: 'cb-draw-drill',
    prompt: 'Read the diamond draw drill.',
    explain: 'PKF: when you begin practicing your draw stroke, start with simple drills where you’re only drawing the cue ball back a few inches. Figure 3-39: “my cue ball is at the second diamond and the object ball is at the first diamond. I’ll then practice drawing the cue ball back to the second diamond; once I’m consistent at this distance I’ll practice drawing back two diamonds, then three, and so on.” Then start moving the cue ball farther away from the object ball (figure 3-40). The draw shot is “one of the most important shots in pool but it’s also one of the toughest to master.” To reach maximum low, work down gradually from where you normally strike for draw; it may take several practice sessions.' },
  { id: 'smcb-shoot-draw', section: 'low-action', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Shoot the diamond draw drill', src: 'Page 33 · Figures 3-39, 3-40', concept: 'Draw drill',
    prompt: 'Set up figure 3-39 and draw the cue ball back.',
    physical: { kind: 'check',
      setup: ['Cue ball at the second diamond; object ball at the first diamond (figure 3-39).'],
      objective: 'Draw the cue ball back to the second diamond. Once consistent, draw back two diamonds, then three, and so on.',
      goal: 'As you progress, start moving the cue ball farther away from the object ball (figure 3-40).',
      gaps: ['Speed', 'Whether the object ball is pocketed'] },
    explain: 'PKF: spend some time practicing the draw shot.' },

  // ---------------------------------------------------------------- 6 · Stop Shot (pages 33–36)
  { id: 'smcb-stop-intro', section: 'stop-shot', type: 'LEARN', assist: 'GUIDED', title: 'Stop Shot', src: 'Page 33 · Figure 3-41', concept: 'Stop shot',
    prompt: 'Read the Stop Shot introduction and figure 3-41.',
    explain: 'PKF: before position fundamentals, become comfortable stopping the cue ball using low spin. The stop shot is one of the most important shots every 8-Ball and 9-Ball player needs; you’ll need to stop the cue ball from different distances. Figure 3-41: the object ball about a diamond away from the corner pocket, the cue ball about a half diamond away from the object ball. “The goal of this drill is to see how softly we can strike the cue ball and still stop it using maximum low.” The lower you strike the cue ball the softer you can hit it. If the cue ball draws back a bit, you struck it with a bit too much speed. The shot requires the correct balance of speed and draw.' },
  { id: 'smcb-stop-physics', section: 'stop-shot', type: 'LEARN', assist: 'GUIDED', title: 'Low spin, sliding, rolling', src: 'Pages 33–34 · Figures 3-42 to 3-44', concept: 'Stop shot: sliding at contact', from: 'cb-stop-physics',
    prompt: 'Study figures 3-42 to 3-44.',
    explain: 'PKF: for the cue ball to stop it needs to be sliding when it strikes the 1 ball, so the low spin has to end right before contact. The period between the cue ball having low spin and rolling forward is referred to as a sliding cue ball (figure 3-42). Figure 3-43: the low spin ended too early, so it was rolling by the time it reached the 1 ball. Figure 3-44: the low spin lasts the entire distance and the cue ball draws back. Keep track of what the cue ball does after contact so you can adjust.' },
  { id: 'smcb-q-sliding', section: 'stop-shot', type: 'PREDICT', assist: 'GUIDED', title: 'What stops the cue ball?', src: 'Pages 33–34 · Figure 3-42', concept: 'Stop shot: sliding at contact',
    prompt: 'For the cue ball to stop, what does PKF say it needs to be doing when it strikes the 1 ball?',
    hint: 'Look back at figure 3-42.',
    choices: [['sliding', 'Sliding: the low spin ends right before contact'], ['rolling', 'Rolling forward'], ['low', 'Still spinning with low spin']], answer: 'sliding',
    explain: 'PKF: “In order for the cue ball to stop it needs to be sliding when it strikes the 1 ball; which means the low spin has to end right before contact… If the cue ball is sliding when it strikes the 1 ball it will come to a stop.”' },
  { id: 'smcb-stop-diag', section: 'stop-shot', type: 'PREDICT', assist: 'ASSISTED', title: 'The cue ball draws back', src: 'Page 34 · Figure 3-44', concept: 'Stop shot adjustments', from: 'cb-stop-diag',
    prompt: 'On the stop-shot drill, the cue ball draws back after contact. What does PKF say to adjust?',
    choices: [['reduce', 'Reduce your speed'], ['increase', 'Increase your speed'], ['lower', 'Strike the cue ball even lower']], answer: 'reduce',
    explain: 'PKF: “If the cue ball draws back that means you need to reduce your speed. For instance, in figure 3-44 the cue ball’s low spin lasts the entire distance which results in the cue ball drawing back.”' },
  { id: 'smcb-q-follows', section: 'stop-shot', type: 'PREDICT', assist: 'ASSISTED', title: 'The cue ball follows', src: 'Page 34 · Figure 3-43', concept: 'Stop shot adjustments',
    prompt: 'On the stop-shot drill, the cue ball is slightly following the 1 ball after contact. What does PKF say that means?',
    choices: [['not-enough', 'You didn’t have enough low spin'], ['too-fast', 'You had too much speed'], ['perfect', 'It was a correct stop']], answer: 'not-enough',
    explain: 'PKF: “If the cue ball is slightly following the 1 ball then you didn’t have enough low spin.” In figure 3-43 the low spin ended too early, so the cue ball was rolling by the time it reached the 1 ball.' },
  { id: 'smcb-shoot-stop', section: 'stop-shot', type: 'SHOOT', assist: 'ASSISTED', title: 'Shoot the soft stop drill', src: 'Pages 33–34 · Figure 3-41', concept: 'Stop shot', from: 'cb-shoot-stop',
    prompt: 'Set up figure 3-41 and stop the cue ball with maximum low.',
    physical: { kind: 'check',
      setup: ['Put the object ball about a diamond away from the corner pocket.', 'Put the cue ball about a half diamond away from the object ball (figure 3-41).', 'Use maximum low.'],
      objective: 'The cue ball stops. See how softly you can strike the cue ball and still stop it. If it draws back, reduce your speed; if it slightly follows, you didn’t have enough low spin.',
      goal: 'Practice until you can consistently stop the cue ball, then gradually start moving the cue ball farther away.',
      gaps: ['Whether the object ball is pocketed'] },
    explain: 'PKF: the lower you can strike the cue ball the more low action you’ll get, which means you can shoot the shot softer.' },
  { id: 'smcb-q-less-low', section: 'stop-shot', type: 'PREDICT', assist: 'ASSISTED', title: 'Less than maximum low', src: 'Page 34 · Figure 3-45', concept: 'Degrees of low',
    prompt: 'You switch from maximum low to less low, but shoot at the same speed you used with maximum low. What happens?',
    choices: [['early', 'The low spin ends too soon and the cue ball is rolling forward by the time it reaches the 1 ball'], ['draw', 'The cue ball draws back'], ['stop', 'It still stops']], answer: 'early',
    explain: 'PKF: “The less low spin you’re using the harder you’ll need to strike the cue ball… Since we’re no longer using maximum low we’re not generating as many revolutions on the cue ball; which means if we shoot this shot at the same speed as when we were using maximum low, the low spin will end too soon (A), resulting in the cue ball rolling forward by the time it reaches the 1 ball” (figure 3-45).' },
  { id: 'smcb-shoot-stop-degrees', section: 'stop-shot', type: 'SHOOT', assist: 'ASSISTED', title: 'Stop with different degrees of low', src: 'Pages 34–35 · Figures 3-46, 3-47', concept: 'Degrees of low',
    prompt: 'Shoot the stop drill using different degrees of low, then from farther away.',
    physical: { kind: 'check',
      setup: ['Shoot the stop shot drill (figure 3-41) using different degrees of low.', 'As you get better at the short distance, start moving the cue ball farther away from the object ball (figure 3-46).'],
      objective: 'The cue ball stops. The lower you hit the cue ball the softer you can shoot; the less low you use, the harder you’ll have to shoot.',
      goal: 'Find your soft speed when using maximum low. Eventually you should be able to stop the cue ball from any distance (figure 3-47).',
      gaps: ['Exact distances', 'Whether the object ball is pocketed'] },
    explain: 'PKF: this is one of the main shots that separates the strong runout players from everybody else.' },
  { id: 'smcb-q-pocket-bigger', section: 'stop-shot', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Why shoot it softer?', src: 'Page 35 · Figures 3-48 to 3-51', concept: 'Low action makes the pocket bigger', from: 'cb-soft-stop-why',
    prompt: 'Figure 3-48: shoot the 3 ball and stop the cue ball for the 8. What advantage does PKF give for shooting it easier with low action instead of firm speed?',
    choices: [['bigger', 'The pocket is going to play much bigger'], ['room', 'Firm speed leaves more room for error'], ['rail', 'Firm speed keeps the object ball off the rail']], answer: 'bigger',
    explain: 'PKF: with a firm speed there is very little room for error; if the player is off even a little, the pocket rejects the shot (figure 3-49). “The advantage of shooting easier is that the pocket is going to play much bigger which means he can be a little bit off on the shot and it will still go in the pocket.” Figures 3-50 / 3-51: a firm stop shot rattles out after catching the rail before the pocket; the same shot with maximum low and a much softer stroke catches the rail even higher and still goes in.' },
  { id: 'smcb-mosconi', section: 'stop-shot', type: 'LEARN', assist: 'ASSISTED', title: 'Mosconi Cup stop exercise', src: 'Page 36 · Figure 3-52', concept: 'Stop shot',
    prompt: 'Read the exercise and study figure 3-52.',
    explain: 'PKF: an exercise the Mosconi Cup team practices under the guidance of Mark Wilson. Put the cue ball and object ball in a straight line toward the corner pocket. “The object of this shot is to see how easy you can shoot the shot and still stop the cue ball. This shot requires striking the cue ball with maximum low. Once you can perform this shot consistently from the closest cue ball position, start moving the cue ball farther away (A, B).”' },
  { id: 'smcb-shoot-mosconi', section: 'stop-shot', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Shoot the Mosconi Cup stop', src: 'Page 36 · Figure 3-52', concept: 'Stop shot',
    prompt: 'Set up figure 3-52 from the closest cue ball position.',
    physical: { kind: 'check',
      setup: ['Put the cue ball and object ball in a straight line toward the corner pocket (figure 3-52), starting from the closest cue ball position.', 'Strike the cue ball with maximum low.'],
      objective: 'Stop the cue ball, shooting the shot as easy as you can.',
      goal: 'Once you can perform this shot consistently from the closest position, move the cue ball farther away (A, B).',
      gaps: ['Exact distances', 'Whether the object ball is pocketed'] },
    explain: 'PKF: this shot requires striking the cue ball with maximum low.' },

  // ---------------------------------------------------------------- 7 · Low Action for Position (pages 36–37)
  { id: 'smcb-min-angles', section: 'low-action-position', type: 'LEARN', assist: 'GUIDED', title: 'Low action minimizes angles', src: 'Page 36 · Figures 3-53, 3-54', concept: 'Low action minimizes angles',
    prompt: 'Read how low action minimizes angles.',
    explain: 'PKF: “Another advantage of low action is that it minimizes angles.” Figure 3-53: the player is on the wrong side of the 12 for the 8 in the bottom right corner. Even shot softly, the cue ball floats away (B) to the other side of the 8. Shot with low action (A), the low action kills the cue ball, leaving a shot on the 8. Figure 3-54: because of the angle on the 12, even a soft low spin shot sends the cue ball too far (A); with maximum low the player holds the cue ball for position on the 8 (B).' },
  { id: 'smcb-q-min-angles', section: 'low-action-position', type: 'PREDICT', assist: 'GUIDED', title: 'Wrong side of the 12', src: 'Page 36 · Figure 3-53', concept: 'Low action minimizes angles',
    prompt: 'Figure 3-53: wrong side of the 12 for the 8 in the bottom right corner. Shot softly, the cue ball floats away to the other side of the 8. What does PKF do instead?',
    choices: [['low', 'Shoots the 12 using low action to kill the cue ball'], ['softer', 'Shoots it even softer with center ball'], ['high', 'Uses high action to follow through']], answer: 'low',
    explain: 'PKF: “This time he’s going to shoot the 12 ball using low action (A). The low action is going to help kill the cue ball leaving him with a shot for the 8 ball.”' },
  { id: 'smcb-q-hold', section: 'low-action-position', type: 'CHOOSE', assist: 'ASSISTED', title: 'Hold the cue ball', src: 'Page 36 · Figure 3-54', concept: 'Low action minimizes angles',
    prompt: 'Figure 3-54: hold the cue ball for position on the 8 in the top right corner. Because of the angle on the 12, which action does PKF say holds the cue ball?',
    choices: [['max-low', 'Maximum low'], ['soft-low', 'A soft low spin shot'], ['high', 'High action']], answer: 'max-low',
    explain: 'PKF: “Due to the angle on the 12 ball, even a soft low spin shot results in the cue ball traveling too far (A). But using maximum low, the player can hold the cue ball for position on the 8 ball (B).”' },
  { id: 'smcb-massey', section: 'low-action-position', type: 'LEARN', assist: 'ASSISTED', title: 'Mike Massey’s Low Action', src: 'Page 37 · Figure 3-56', concept: 'Low action changes the cue ball path', from: 'cb-massey-stub',
    prompt: 'Read Mike Massey’s Low Action and figure 3-56.',
    explain: 'PKF: a shot from a Zero-X video of Mike Massey. Playing 8-Ball on his last stripe, there isn’t a good shot to pocket the 10 and gain position for the 8 (first diagram on the page). One option is to bank the 10 into the bottom left corner with right spin, but that firm stroke sends the cue ball crashing into the solids. With low action he can bank the 10 into the bottom left corner and send the cue ball toward the bottom side rail (figure 3-56): strike just a small part of the 10 while using low action; “the low action pulls the cue ball toward the side rail changing its natural path.”' },
  { id: 'smcb-q-massey', section: 'low-action-position', type: 'PREDICT', assist: 'ASSISTED', title: 'Banking the 10 with low action', src: 'Page 37 · Figure 3-56', concept: 'Low action changes the cue ball path',
    prompt: 'Banking the 10 into the bottom left corner while striking just a small part of it with low action: what does PKF say the low action does to the cue ball?',
    choices: [['pull', 'Pulls the cue ball toward the side rail, changing its natural path'], ['crash', 'Sends the cue ball into the solids'], ['stop', 'Stops the cue ball where it hits the 10']], answer: 'pull',
    explain: 'PKF: “In order to execute this shot properly you’ll need to strike just a small part of the 10 ball while using low action; the low action pulls the cue ball toward the side rail changing its natural path.”' },
  { id: 'smcb-massey-curve', section: 'low-action-position', type: 'LEARN', assist: 'INDEPENDENT', title: 'Curving around a blocker', src: 'Page 37 · unnumbered diagram', concept: 'Low action changes the cue ball path',
    prompt: 'Read the second Mike Massey example.',
    explain: 'PKF: playing 9-Ball and hooked on the 1 ball, the natural kicking path toward the 1 is blocked by the 4. The player can use low action and shoot toward the third diamond; “the low action pulls the cue ball away from its natural path and toward the 1 ball. This shot will also work from the other cue ball positions but you’ll have to adjust your target on the bottom side rail.” (PKF prints this diagram without a figure number.)' },

  // ---------------------------------------------------------------- 8 · Ball Pocketing & Throw (page 38)
  { id: 'smcb-throw', section: 'throw', type: 'LEARN', assist: 'GUIDED', title: 'Throw without sidespin', src: 'Page 38 · Figure 3-58', concept: 'Throw', from: 'cb-throw',
    prompt: 'Read the start of Ball Pocketing Drills.',
    explain: 'PKF: ball pocketing drills use center, center low and center high. Many participants have a difficult time pocketing balls without sidespin because for years they used sidespin on almost every shot; they don’t adjust their aim and hit too much or too little of the object ball. Another issue is not allowing for throw: “When you shoot without sidespin the cue ball will slightly throw the object ball in the same direction the cue ball is traveling.” Figure 3-58: the 8 shot toward the center of the side pocket is slightly thrown in the same direction the cue ball is traveling (A).' },
  { id: 'smcb-q-throw-dir', section: 'throw', type: 'PREDICT', assist: 'GUIDED', title: 'Which way is it thrown?', src: 'Page 38 · Figure 3-58', concept: 'Throw',
    prompt: 'Shooting without sidespin, which way does PKF say the object ball is slightly thrown?',
    hint: 'Think about the direction the cue ball is moving.',
    choices: [['same', 'In the same direction the cue ball is traveling'], ['opposite', 'Opposite to the direction the cue ball is traveling'], ['none', 'It isn’t thrown without sidespin']], answer: 'same',
    explain: 'PKF: “When you shoot without sidespin the cue ball will slightly throw the object ball in the same direction the cue ball is traveling.”' },
  { id: 'smcb-throw-q', section: 'throw', type: 'CHOOSE', assist: 'ASSISTED', title: 'Allow for throw', src: 'Page 38 · Figure 3-59', concept: 'Throw', from: 'cb-throw-q',
    prompt: 'Cutting an object ball into the corner without sidespin (figure 3-59). How does PKF aim?',
    choices: [['thinner', 'Hit the object ball a little thinner than normal'], ['fuller', 'Hit the object ball a little fuller than normal'], ['center', 'Aim toward the center of the opening as normal']], answer: 'thinner',
    explain: 'PKF: “Whenever you are cutting an object ball without sidespin always aim to hit the object ball a little thinner than normal to allow for the throw.” Figure 3-59: aiming toward the center of the opening, the 3 is thrown slightly to the right of the line (A); cutting it a little thinner (B), it is thrown toward the center of the pocket opening.' },
  { id: 'smcb-q-overcut', section: 'throw', type: 'CHOOSE', assist: 'INDEPENDENT', title: 'Thrown toward the point', src: 'Page 38 · Figure 3-60', concept: 'Throw',
    prompt: 'Figure 3-60: at this angle the 3 ball will be thrown to the left of the aiming line and may catch the point of the pocket. What does PKF do?',
    choices: [['overcut', 'Overcut the shot slightly'], ['fuller', 'Cut it a little fuller'], ['same', 'Keep the aiming line']], answer: 'overcut',
    explain: 'PKF: “At this angle the 3 ball will be thrown to the left of the aiming line (A) and may catch the point of the pocket. But, if he aims to overcut the shot slightly (B), now when the 3 ball is thrown to the left it will head toward the center of the pocket opening.”' },

  // ---------------------------------------------------------------- 9 · Combination Throw (page 39)
  { id: 'smcb-combo', section: 'combination-throw', type: 'LEARN', assist: 'GUIDED', title: 'Throw with frozen balls', src: 'Page 39 · unnumbered photo, Figures 3-62, 3-63', concept: 'Combination throw',
    prompt: 'Read how throw affects two frozen balls.',
    explain: 'PKF: playing 9-Ball on the 1 ball, the 3 ball is frozen to the 9 and both are lined up for the corner pocket (the first photo on the page, printed without a figure number). “When two balls are frozen like this it’s important that you are very aware of which side of the combination you end up on.” Above both balls (figure 3-62), the 9 is thrown in the same direction the cue ball is traveling, toward the bottom end rail (A). With the angle in figure 3-63, the 9 is thrown toward the side rail (A). To make the combination, the player needs to play position on or near the pocket line.' },
  { id: 'smcb-q-combo-above', section: 'combination-throw', type: 'PREDICT', assist: 'ASSISTED', title: 'Above both balls', src: 'Page 39 · Figure 3-62', concept: 'Combination throw',
    prompt: 'The player ends up above both frozen balls (figure 3-62) and shoots the combination. Where is the 9 ball thrown?',
    choices: [['end', 'Toward the bottom end rail, the same direction the cue ball is traveling'], ['side', 'Toward the side rail'], ['corner', 'Straight into the corner pocket']], answer: 'end',
    explain: 'PKF: “If the player ends up above both balls (figure 3-62), when he shoots the combination the 9 ball will be thrown in the same direction the cue ball is traveling, which is toward the bottom end rail (A).”' },
  { id: 'smcb-q-combo-pos', section: 'combination-throw', type: 'CHOOSE', assist: 'ASSISTED', title: 'Where to play position', src: 'Page 39', concept: 'Combination throw',
    prompt: 'To make this frozen combination, where does PKF say the player needs to play position?',
    choices: [['line', 'On or near the pocket line'], ['above', 'Above both balls'], ['side', 'At an angle toward the side rail']], answer: 'line',
    explain: 'PKF: “In order to make this combination the player will need to play position on or near the pocket line.”' },
  { id: 'smcb-combo-advantage', section: 'combination-throw', type: 'LEARN', assist: 'ASSISTED', title: 'Using throw to your advantage', src: 'Page 39 · Figure 3-65', concept: 'Combination throw',
    prompt: 'Study figure 3-65.',
    explain: 'PKF: “Figure 3-65 is an example of using ‘throw’ to your advantage. In this game of 9-Ball the 5-9 combination is lined up toward the side rail. But, if the player can play position below the combination, when he shoots this combo the 9 ball will be thrown upward toward the side pocket.”' },
  { id: 'smcb-q-combo-c', section: 'combination-throw', type: 'PREDICT', assist: 'INDEPENDENT', title: 'Position C on the 2-9', src: 'Page 39 · Figure 3-64', concept: 'Combination throw',
    prompt: 'Figure 3-64: the frozen 2-9 combination is lined up for the corner. The player ends up at C and shoots straight at the combo. Where is the 9 thrown?',
    choices: [['end', 'To the end rail'], ['side', 'Toward the side rail'], ['corner', 'Straight toward the corner']], answer: 'end',
    explain: 'PKF: on the pocket line (A) the 9 heads straight toward the corner; at B it will be thrown toward the side rail if he shoots straight at the combo; “and if he ends up here (C), the 9 ball will be thrown to the end rail if he shoots straight at the combo.”' },

  // ---------------------------------------------------------------- 10 · Ball Pocketing Drills (pages 40–42)
  { id: 'smcb-target-drill', section: 'pocketing-drills', type: 'LEARN', assist: 'GUIDED', title: 'Give the cue ball a target', src: 'Page 40 · Figures 3-66 to 3-69', concept: 'Ball pocketing drill with a target', from: 'cb-path-drill',
    prompt: 'Read the ball pocketing drill setup.',
    explain: 'PKF: in ball pocketing drills with center, center low and center high, you pocket the ball and the cue ball hits a target. “It’s important that whenever you perform ball pocketing drills you always give yourself a target for the cue ball. This ensures that you’re consistently striking the same spot on the cue ball time after time.” Line up four balls below the spot with a sticker under each (figure 3-66); place a sticker near the corner pocket for the object ball; cue ball on the first sticker. First shot: maximum high, just hard enough for the cue ball to reach both side rails. Strike exactly where you’re aiming, pocket into the center of the opening, and keep your speed consistent (figure 3-67). Mark the cue ball path with a ball; keep shooting until you find a consistent path, then mark it with two balls as your target (figures 3-68, 3-69). Keep shooting until you hit your target five times; for a challenge, five in a row.' },
  { id: 'smcb-q-target-why', section: 'pocketing-drills', type: 'IDENTIFY', assist: 'GUIDED', title: 'Why a target?', src: 'Page 40', concept: 'Ball pocketing drill with a target',
    prompt: 'Why does PKF say you should always give yourself a target for the cue ball in ball pocketing drills?',
    choices: [['spot', 'It ensures you’re consistently striking the same spot on the cue ball time after time'], ['speed', 'It lets you shoot harder'], ['aim', 'It replaces aiming at the object ball']], answer: 'spot',
    explain: 'PKF: “It’s important that whenever you perform ball pocketing drills you always give yourself a target for the cue ball. This ensures that you’re consistently striking the same spot on the cue ball time after time.”' },
  { id: 'smcb-shoot-max-high', section: 'pocketing-drills', type: 'SHOOT', assist: 'GUIDED', title: 'Maximum high to a target', src: 'Page 40 · Figures 3-66 to 3-69', concept: 'Ball pocketing drill with a target',
    prompt: 'Set up the first ball pocketing drill.',
    physical: { kind: 'action',
      setup: ['Line up four balls below the spot and place a sticker under each ball: the four stickers for the cue ball (figure 3-66).', 'Place a sticker near the corner pocket for the object ball; put the cue ball on the first sticker.', 'Strike the cue ball with maximum high, just hard enough for the cue ball to reach both side rails.', 'Pocket the object ball into the center of the pocket opening and keep your speed consistent (figure 3-67).', 'Mark the cue ball path with a ball; once the path is consistent, mark it with two balls as your target (figures 3-68, 3-69).'],
      objective: 'Pocket the ball and also strike your target.',
      goal: 'Keep shooting until you can hit your target five times. For a challenge, hit it five times in a row.' },
    explain: 'PKF: pocketing the ball into the right or left side of the pocket will alter the cue ball path.' },
  { id: 'smcb-q-3things', section: 'pocketing-drills', type: 'IDENTIFY', assist: 'ASSISTED', title: 'Three things', src: 'Page 41', concept: 'Consistent cue ball path',
    prompt: 'To consistently control the cue ball path shot after shot, PKF says you have to do 3 things. Which set is it?',
    choices: [['three', 'Same spot on the cue ball, same part of the pocket, same speed'], ['spin', 'Sidespin every shot, firm speed, center of the pocket'], ['soft', 'Soft speed, maximum low, overcut slightly']], answer: 'three',
    explain: 'PKF: “1. The tip must strike the cue ball in the same spot every shot. 2. The object ball has to go into the same part of the pocket every shot. 3. The speed of the shot can’t vary, it must remain consistent.”' },
  { id: 'smcb-q-pocket-side', section: 'pocketing-drills', type: 'PREDICT', assist: 'ASSISTED', title: 'Left or right side of the pocket', src: 'Page 41 · Figure 3-70', concept: 'Consistent cue ball path',
    prompt: 'In these drills, what happens to the cue ball path if the object ball goes into the left or right side of the pocket?',
    choices: [['alter', 'It will alter your cue ball path'], ['nothing', 'Nothing, as long as the ball goes in'], ['throw', 'It cancels out the throw']], answer: 'alter',
    explain: 'PKF: “If the object ball goes into the left or right side of the pocket it will alter your cue ball path.” That’s why PKF places a ball on each side of the corner pocket (figure 3-70): it forces the object ball into the exact center of the opening. Top players “realize that the cue ball path is directly tied to the part of the pocket the object ball is going into.”' },
  { id: 'smcb-shoot-tip-above', section: 'pocketing-drills', type: 'SHOOT', assist: 'ASSISTED', title: 'A tip above center', src: 'Page 41 · Figure 3-70', concept: 'Ball pocketing drill with a target',
    prompt: 'After five hits on the maximum-high target, set the shot up again.',
    physical: { kind: 'action',
      setup: ['After you strike the target five times, set the shot up again.', 'Strike the cue ball about a tip above center.', 'Place a ball on each side of the corner pocket so the object ball must go into the exact center of the opening (figure 3-70).'],
      objective: 'Pocket the ball into the center of the opening and hit your target. This path will be a little wider than the first shot; find a consistent path and mark it with two balls.' },
    explain: 'PKF: if the object ball goes into the left or right side of the pocket it will alter your cue ball path.' },
  { id: 'smcb-shoot-center-target', section: 'pocketing-drills', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Around center', src: 'Page 41', concept: 'Ball pocketing drill with a target',
    prompt: 'Now strike the cue ball around center.',
    physical: { kind: 'action',
      setup: ['Strike the cue ball around center, using the same speed as the previous shots.', 'Shoot the shot until you find the true cue ball path, then set up your target balls.'],
      objective: 'Pocket the ball and hit your target.',
      goal: 'Try to hit this target 5 times before moving on.' },
    explain: 'PKF: same spot on the cue ball, same part of the pocket, same speed.' },
  { id: 'smcb-shoot-low-target', section: 'pocketing-drills', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Below center, then maximum low', src: 'Page 41 · Figure 3-71', concept: 'Ball pocketing drill with a target',
    prompt: 'When you’re done with center, shoot below center and then maximum low.',
    physical: { kind: 'action',
      setup: ['Shoot the shots below center, and then with maximum low (figure 3-71).'],
      objective: 'Pocket the ball and hit your target. With maximum low the cue ball path really widens, sending the cue ball toward the other end of the table.',
      goal: 'Below center it’s a little more difficult to hit your target consistently: pay attention to where your tip strikes the cue ball and to the speed of the shot.' },
    explain: 'PKF: when you strike the cue ball below center it’s a little more difficult to consistently hit your target.' },
  { id: 'smcb-problem', section: 'pocketing-drills', type: 'LEARN', assist: 'INDEPENDENT', title: 'Next sticker, and problem shots', src: 'Page 42 · Figures 3-72 to 3-74', concept: 'Ball pocketing drill with a target',
    prompt: 'Read how PKF continues the drills.',
    explain: 'PKF: when finished, move the cue ball to the next sticker and begin the drills again (figure 3-72), or make your own shots by moving the object ball and cue ball to different locations. If you struggle with a drill, move the cue ball closer until it becomes easy, then gradually add distance. Combine ball pocketing drills with problem shots from leagues or tournaments: in figure 3-73 the player misses the 13 in the corner; in practice he sets it up and practices pocketing the ball and hitting his target, and if still struggling he lines up a row of stickers on the same angle to make it much easier (figure 3-74), then moves back toward the original spot. “Make sure your fundamentals are rock solid. Keep your head down throughout the shot.” PKF: “Becoming a strong player isn’t about hitting a million balls, it’s about hitting a few thousand balls the correct way.”' },
  { id: 'smcb-shoot-problem', section: 'pocketing-drills', type: 'SHOOT', assist: 'INDEPENDENT', title: 'Practice a problem shot', src: 'Page 42 · Figures 3-73, 3-74', concept: 'Ball pocketing drill with a target',
    prompt: 'Set up a shot you missed in a league or tournament.',
    physical: { kind: 'action',
      setup: ['Set up a shot you missed while playing (figure 3-73).', 'If you’re still struggling from this distance, line up a row of stickers on the same angle and make the shot much easier (figure 3-74).'],
      objective: 'Pocket the ball and hit your target.',
      goal: 'Once you’re more consistent, gradually move the cue ball farther away until it’s back to the original spot. Keep your head down throughout the shot.',
      gaps: ['Ball positions (your own missed shot)'] },
    explain: 'PKF: keep track of any stroke issues that may come up.' },

  // ---------------------------------------------------------------- 11 · Automatic Aiming (pages 42–43)
  { id: 'smcb-auto-aim', section: 'automatic-aiming', type: 'LEARN', assist: 'GUIDED', title: 'Automatic Aiming', src: 'Pages 42–43', concept: 'Automatic aiming', from: 'cb-auto-aim',
    prompt: 'Read Automatic Aiming.',
    explain: 'PKF: in the 14 Days Experiment, ball pocketing is a huge part of the training; it’s through this training that the player develops automatic aiming. “Automatic aiming happens at a subconscious level.” It’s how top players pocket hundreds of balls in a tournament without a miss. Training is a conscious effort; actual performance is a subconscious effort. PKF lets participants use an aiming system, but to reach a high level the player has to evolve to automatic aiming; an aiming system isn’t a substitute for ball pocketing drills. “Anyone can achieve automatic aiming through practice and ball pocketing drills.” Your brain is like a computer: hit a shot enough times and it knows where to hit the object ball; trust your training and talent.' },
  { id: 'smcb-q-auto-level', section: 'automatic-aiming', type: 'IDENTIFY', assist: 'GUIDED', title: 'Where it happens', src: 'Page 42', concept: 'Automatic aiming',
    prompt: 'At what level does PKF say automatic aiming happens?',
    choices: [['sub', 'At a subconscious level'], ['con', 'At a conscious level'], ['system', 'Through an aiming system']], answer: 'sub',
    explain: 'PKF: “Automatic aiming happens at a subconscious level. It’s how top players can pocket hundreds of balls during a tournament without a miss.”' },
  { id: 'smcb-q-auto-how', section: 'automatic-aiming', type: 'IDENTIFY', assist: 'ASSISTED', title: 'How to get there', src: 'Page 43', concept: 'Automatic aiming',
    prompt: 'How does PKF say anyone can achieve automatic aiming?',
    choices: [['drills', 'Through practice and ball pocketing drills'], ['system', 'By using an aiming system as a substitute for ball pocketing drills'], ['control', 'By consciously controlling the aiming process on every shot']], answer: 'drills',
    explain: 'PKF: “Anyone can achieve automatic aiming through practice and ball pocketing drills.” An aiming system isn’t a substitute for ball pocketing drills; players who use one in competition tend to overthink their shots.' },
  { id: 'smcb-shoot-3sec', section: 'automatic-aiming', type: 'SHOOT', assist: 'INDEPENDENT', title: 'The three-second drill', src: 'Page 43 · unnumbered photo', concept: 'Automatic aiming',
    prompt: 'PKF’s drill: no time to overthink the shot.',
    physical: { kind: 'pocket',
      setup: ['Throw balls out on the table (photo, page 43).', 'Pocket any ball you want.', 'You have to shoot the shot within three seconds of being down on the table.'],
      objective: 'Pocket the ball.',
      goal: 'Trust your aiming and talent. When you don’t have the time to overthink the shot, ball pocketing requires less effort.',
      gaps: ['Number of balls'] },
    explain: 'PKF: “In order for the player to be successful in pocketing balls they have to trust their aiming and talent.”' },
  { id: 'smcb-q-next', section: 'automatic-aiming', type: 'IDENTIFY', assist: 'INDEPENDENT', title: 'The next level', src: 'Page 43', concept: 'Automatic aiming',
    prompt: 'What does PKF say is the next level after automatic aiming?',
    choices: [['position', 'Placing the cue ball exactly where you want for position'], ['system', 'Learning an aiming system'], ['power', 'Pocketing balls with more power']], answer: 'position',
    explain: 'PKF: “The next level after automatic aiming is not just pocketing the ball but placing the cue ball exactly where you want for position, making the entire game effortless.” That needs a thorough understanding of position fundamentals, covered next in PKF (Sliding Cue Ball, in the Cue Ball Control Course).' }
];

export const LESSONS = L.map((l) => ({ choices: null, answer: null, hint: '', physical: null, from: null, ...l }));

/** Exam: knowledge + representative original PKF exercises. `from` = item moved from the Cue Ball Control Exam. */
export const EXAM_ITEMS = [
  { id: 'smx-deflect', section: 'center-vs-sidespin', type: 'PREDICT', title: 'Left spin, level cue', src: 'Page 24', concept: 'Deflection', from: 'ex-k1',
    prompt: 'Level cue stick, left sidespin: which way does the cue ball leave the shooting line?',
    choices: [['right', 'To the right'], ['left', 'To the left'], ['straight', 'It stays on the line']], answer: 'right',
    explain: 'PKF: striking the cue ball on the left side pushes it to the right of the line. This is referred to as deflection.' },
  { id: 'smx-center-line', section: 'center-vs-sidespin', type: 'CHOOSE', title: 'Staying on the shooting line', src: 'Page 24', concept: 'Center family stays on the shooting line',
    prompt: 'Which contacts keep the cue ball on the shooting line regardless of how level your cue stick is?',
    choices: [['center', 'Center, center low or center high'], ['side', 'Left or right sidespin'], ['level', 'Any contact with a level cue']], answer: 'center',
    explain: 'PKF: “As long as you shoot center, center low or center high, your cue ball will stay on the shooting line regardless of how level your cue stick is.”' },
  { id: 'smx-level-never', section: 'elevation-variables', type: 'PREDICT', title: 'Level vs angled cue with sidespin', src: 'Page 27', concept: 'Level cue: never returns to the line',
    prompt: 'With sidespin, what is the difference between a level cue stick and an angled one?',
    choices: [['pkf', 'Level: pushed off and never returns. Angled: pushed off, returns, and may cross the line'], ['same', 'Both stay on the shooting line'], ['reverse', 'Level: returns to the line. Angled: never returns']], answer: 'pkf',
    explain: 'PKF: “If your cue stick is level when using sidespin, the cue ball is pushed off the shooting line and will never return to it. When your cue stick is angled when using sidespin, the cue ball is pushed off the shooting line but eventually returns to the line and may even cross it.”' },
  { id: 'smx-long-straight', section: 'finding-center', type: 'IDENTIFY', title: 'Long straight-in misses', src: 'Page 27', concept: 'Finding center',
    prompt: 'Why does PKF say many players miss long straight-in shots?',
    choices: [['offcenter', 'They strike the cue ball off center without realizing it'], ['throw', 'They don’t allow for throw'], ['speed', 'They shoot too softly']], answer: 'offcenter',
    explain: 'PKF: even a little sidespin is enough to throw the shot off; without realizing it, they strike the cue ball off center with left or right spin.' },
  { id: 'smx-rail-center', section: 'finding-center', type: 'CHOOSE', title: 'Rail-return drill', src: 'Page 28', concept: 'Rail-return center drill', from: 'ex-k3',
    prompt: 'Second-diamond rail-return drill: where does PKF aim on the cue ball?',
    choices: [['center', 'Center'], ['left', 'Left spin'], ['right', 'Right spin']], answer: 'center',
    explain: 'PKF: aim center on the cue ball so it returns to the tip. If it doesn’t come back to the tip area, you added sidespin.' },
  { id: 'smx-high-tip', section: 'high-action', type: 'PREDICT', title: 'Aiming above center', src: 'Page 29', concept: 'High action contact',
    prompt: 'Aiming above center, which part of the tip makes contact with the cue ball?',
    choices: [['bottom', 'The bottom of the tip'], ['top', 'The top of the tip'], ['whole', 'The whole face of the tip']], answer: 'bottom',
    explain: 'PKF: when you are aiming above center, the only part of the tip making contact with the cue ball is the bottom of the tip.' },
  { id: 'smx-draw-grip', section: 'low-action', type: 'IDENTIFY', title: 'Why players miscue on draw', src: 'Page 32', concept: 'Draw-shot checklist',
    prompt: 'What does PKF give as one of the main reasons people miscue when using draw?',
    choices: [['tighten', 'They tighten up right before impact with the cue ball'], ['chalk', 'They chalk the sides of the tip'], ['level', 'They keep the cue stick too level']], answer: 'tighten',
    explain: 'PKF: “One of the main reasons people miscue when using draw is that they tighten up right before impact with the cue ball.”' },
  { id: 'smx-stop-slide', section: 'stop-shot', type: 'PREDICT', title: 'When low spin must end', src: 'Page 34', concept: 'Stop shot: sliding at contact', from: 'ex-k2',
    prompt: 'For a stop shot, when must the low spin end relative to contact?',
    choices: [['before', 'Right before contact, so the cue ball is sliding'], ['after', 'After contact'], ['early', 'Well before contact, so the cue ball is rolling']], answer: 'before',
    explain: 'PKF: the cue ball needs to be sliding when it strikes the 1 ball, which means the low spin has to end right before contact.' },
  { id: 'smx-pocket-bigger', section: 'stop-shot', type: 'IDENTIFY', title: 'Soft stop, bigger pocket', src: 'Page 35', concept: 'Low action makes the pocket bigger',
    prompt: 'What is PKF’s advantage of shooting a stop shot easier with low action instead of firm speed?',
    choices: [['bigger', 'The pocket plays much bigger'], ['room', 'Firm speed gives more room for error'], ['angle', 'It widens the cue ball angle']], answer: 'bigger',
    explain: 'PKF: the advantage of shooting easier is that the pocket is going to play much bigger.' },
  { id: 'smx-throw-thinner', section: 'throw', type: 'CHOOSE', title: 'Cutting without sidespin', src: 'Page 38', concept: 'Throw',
    prompt: 'Cutting an object ball without sidespin: how does PKF aim to allow for throw?',
    choices: [['thinner', 'A little thinner than normal'], ['fuller', 'A little fuller than normal'], ['center', 'Center of the opening as normal']], answer: 'thinner',
    explain: 'PKF: “Whenever you are cutting an object ball without sidespin always aim to hit the object ball a little thinner than normal to allow for the throw.”' },
  { id: 'smx-combo-line', section: 'combination-throw', type: 'CHOOSE', title: 'Frozen combination', src: 'Page 39', concept: 'Combination throw',
    prompt: 'Two balls frozen and lined up for the corner. Where does PKF say to play position to make the combination?',
    choices: [['line', 'On or near the pocket line'], ['above', 'Above both balls'], ['any', 'Anywhere: frozen balls aren’t thrown']], answer: 'line',
    explain: 'PKF: “In order to make this combination the player will need to play position on or near the pocket line.”' },
  { id: 'smx-3things', section: 'pocketing-drills', type: 'IDENTIFY', title: 'Controlling the cue ball path', src: 'Page 41', concept: 'Consistent cue ball path',
    prompt: 'PKF’s 3 things to consistently control the cue ball path:',
    choices: [['three', 'Same spot on the cue ball, same part of the pocket, consistent speed'], ['spin', 'Sidespin, firm speed, pocket center'], ['stance', 'Faster stroke, tighter grip, aim thinner']], answer: 'three',
    explain: 'PKF: the tip must strike the cue ball in the same spot every shot; the object ball has to go into the same part of the pocket every shot; the speed of the shot can’t vary.' },
  { id: 'smx-auto', section: 'automatic-aiming', type: 'IDENTIFY', title: 'Automatic aiming', src: 'Pages 42–43', concept: 'Automatic aiming',
    prompt: 'According to PKF, automatic aiming happens at what level, and how is it achieved?',
    choices: [['sub', 'Subconscious level; through practice and ball pocketing drills'], ['con', 'Conscious level; through an aiming system'], ['sys', 'Subconscious level; through an aiming system instead of drills']], answer: 'sub',
    explain: 'PKF: automatic aiming happens at a subconscious level, and anyone can achieve it through practice and ball pocketing drills.' },
  { id: 'smx-x-stop', section: 'stop-shot', type: 'SHOOT', title: 'Soft stop drill', src: 'Pages 33–34 · Figure 3-41', concept: 'Stop shot', from: 'ex-x1',
    prompt: 'PKF’s soft stop drill with maximum low.',
    physical: { kind: 'check',
      setup: ['Object ball about a diamond away from the corner pocket.', 'Cue ball about a half diamond away from the object ball (figure 3-41).', 'Use maximum low.'],
      objective: 'The cue ball stops.',
      gaps: ['Whether the object ball is pocketed'] },
    explain: 'PKF: if the cue ball draws back, reduce your speed; if it slightly follows, you didn’t have enough low spin.' },
  { id: 'smx-x-high', section: 'high-action', type: 'SHOOT', title: 'High-action follow-in', src: 'Page 30 · Figure 3-31', concept: 'High action drill',
    prompt: 'PKF’s high-action drill.',
    physical: { kind: 'action',
      setup: ['Object ball near the corner pocket.', 'Cue ball about a half diamond away on the same pocket line (figure 3-31).', 'Nice soft stroke using high action.'],
      objective: 'Pocket the ball and follow the cue ball into the pocket.' },
    explain: 'PKF: it requires a very precise hit, otherwise the cue ball won’t follow the object ball into the pocket.' },
  { id: 'smx-x-target', section: 'pocketing-drills', type: 'SHOOT', title: 'Ball pocketing to a target', src: 'Page 40 · Figures 3-66 to 3-69', concept: 'Ball pocketing drill with a target',
    prompt: 'PKF’s maximum-high ball pocketing drill with your marked target.',
    physical: { kind: 'action',
      setup: ['Cue ball on the first sticker below the spot; object ball on its sticker near the corner pocket (figure 3-66).', 'Maximum high, just hard enough for the cue ball to reach both side rails.', 'Your two target balls mark the consistent cue ball path (figure 3-69).'],
      objective: 'Pocket the ball and also strike your target.' },
    explain: 'PKF: same spot on the cue ball, same part of the pocket, same speed.' },
  { id: 'smx-x-3sec', section: 'automatic-aiming', type: 'SHOOT', title: 'Three-second drill', src: 'Page 43', concept: 'Automatic aiming',
    prompt: 'PKF’s automatic aiming drill.',
    physical: { kind: 'pocket',
      setup: ['Throw balls out on the table.', 'Pocket any ball you want, shooting within three seconds of being down on the table.'],
      objective: 'Pocket the ball.',
      gaps: ['Number of balls'] },
    explain: 'PKF: when you don’t have the time to overthink the shot, ball pocketing requires less effort.' }
].map((l) => ({ choices: null, answer: null, hint: '', physical: null, from: null, assist: 'INDEPENDENT', ...l }));

export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }
export function isKnowledge(l) { return !!l && KNOWLEDGE_TYPES.includes(l.type); }
export function isPhysical(l) { return !!l && l.type === 'SHOOT'; }
export function knowledgeLessons(sectionId) { return lessonsFor(sectionId).filter(isKnowledge); }

// ------------------------------------------------------------------ one-time migration from the Cue Ball Control Course
/** Old Cue Ball Control id → new id(s). The old combined drills map to each PKF drill they covered. */
export const CB_ID_MAP = {
  'cb-intro': ['smcb-intro'],
  'cb-elevate-center': ['smcb-elevate'],
  'cb-left-deflect': ['smcb-left-deflect'],
  'cb-right-veer': ['smcb-right-veer'],
  'cb-rule-spin': ['smcb-rule-spin'],
  'cb-swerve': ['smcb-swerve'],
  'cb-find-center': ['smcb-find-center'],
  'cb-stop-9drill': ['smcb-9drill'],
  'cb-rail-return': ['smcb-rail-return'],
  'cb-shoot-center': ['smcb-shoot-9drill', 'smcb-shoot-rail'],
  'cb-high-action': ['smcb-high-action'],
  'cb-high-follow-in': ['smcb-high-follow-in'],
  'cb-high-close': ['smcb-high-close'],
  'cb-shoot-high': ['smcb-shoot-high', 'smcb-shoot-high-close'],
  'cb-low-action': ['smcb-low-action'],
  'cb-draw-tips': ['smcb-draw-tips'],
  'cb-draw-drill': ['smcb-draw-drill'],
  'cb-stop-physics': ['smcb-stop-physics'],
  'cb-stop-diag': ['smcb-stop-diag'],
  'cb-soft-stop-why': ['smcb-q-pocket-bigger'],
  'cb-shoot-stop': ['smcb-shoot-stop'],
  'cb-throw': ['smcb-throw'],
  'cb-throw-q': ['smcb-throw-q'],
  'cb-path-drill': ['smcb-target-drill'],
  'cb-auto-aim': ['smcb-auto-aim'],
  'cb-massey-stub': ['smcb-massey']
};
export const CB_EXAM_MAP = { 'ex-k1': 'smx-deflect', 'ex-k2': 'smx-stop-slide', 'ex-k3': 'smx-rail-center', 'ex-x1': 'smx-x-stop' };
/** Titles the old Cue Ball Control Exam used in its weak-area tally. */
export const CB_EXAM_TITLES = { 'Left spin deflection': 'ex-k1', 'Stop needs sliding': 'ex-k2', 'Center-finding rail drill': 'ex-k3', 'Soft stop with position': 'ex-x1' };
export const MOVED_CB_IDS = [...Object.keys(CB_ID_MAP), ...Object.keys(CB_EXAM_MAP)];
const CB_KEY = 'pkfCueBallControl';
export const MIGRATION_VERSION = 1;

function oldTagToNew(kind, tag) {
  if (kind === 'pocket') return tag === 'miss' ? 'miss' : 'make';
  if (kind === 'check') return tag === 'makePos' ? 'correct' : 'incorrect';
  return tag === 'makePos' ? 'madeCorrect' : tag === 'makeMissPos' ? 'madeWrong' : 'miss';
}
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/**
 * One-time, idempotent, pure: copies Center Ball progress from state.pkfCueBallControl into
 * state.pkfShotMakingCenterBall. Old Cue Ball Control data stays in place (sections['center-ball'], stats,
 * exam history). A Cue Ball Control run that still holds moved lessons is parked under
 * pkfCueBallControl.legacyCurrent (not deleted) so Cue Ball Control never opens a lesson it no longer has.
 * Nothing is fabricated: knowledge answers keep their old right/wrong, shots keep their old attempts.
 */
export function migrateFromCueBall(state) {
  if (!state || typeof state !== 'object') return state;
  const cb = state[CB_KEY];
  const mine = state[STORAGE_KEY];
  if (mine && mine.migratedFromCueBall) return state;
  if (!cb || typeof cb !== 'object') return state;
  const oldSec = cb.sections?.['center-ball'] || null;
  const cur = cb.current && typeof cb.current === 'object' ? cb.current : null;
  const curHasMoved = !!(cur && Array.isArray(cur.order) && cur.order.some((id) => MOVED_CB_IDS.includes(id)));
  const weakOld = Object.keys(obj(cb.exam?.weak)).filter((t) => CB_EXAM_TITLES[t]);
  if (!oldSec && !curHasMoved && !weakOld.length) return state;

  const course = courseOfRaw(mine);
  const moved = new Set();
  // Section results fill gaps; a later in-progress run (override) wins over the section summary.
  const markLesson = (newId, rec, override = false) => {
    const prev = course.lessons[newId] || {};
    course.lessons[newId] = override ? { ...prev, ...rec, migrated: true } : { ...rec, ...prev, migrated: true };
    moved.add(newId);
  };
  if (oldSec) {
    const missed = new Set(oldSec.missed || []);
    const missedPos = new Set(oldSec.missedPos || []);
    for (const [oldId, newIds] of Object.entries(CB_ID_MAP)) {
      for (const newId of newIds) {
        const l = lessonById(newId);
        if (!l) continue;
        if (isKnowledge(l)) {
          const ok = !missed.has(oldId);
          markLesson(newId, { done: true, correct: ok });
          if (!ok) course.review[newId] = (course.review[newId] || 0) + 1;
        } else if (isPhysical(l)) {
          const ok = !missedPos.has(oldId) && !missed.has(oldId);
          markLesson(newId, { done: true });
          const p = { history: [], ...(course.physical[newId] || {}) };
          p.history = [...p.history, { migrated: true, from: oldId, success: ok, attempts: [] }];
          p.best = p.best || (ok ? 'success' : 'failed');
          course.physical[newId] = p;
          if (!ok) course.needsPractice[newId] = true;
        } else markLesson(newId, { done: true });
      }
    }
    const kOk = Number(oldSec.knowledgeCorrect) || 0;
    const kTot = Number(oldSec.knowledgeTotal) || 0;
    course.stats.knowledgeCorrect += kOk;
    course.stats.knowledgeWrong += Math.max(0, kTot - kOk);
    course.migratedCounts = { knowledgeCorrect: kOk, knowledgeTotal: kTot, executionMake: Number(oldSec.executionMake) || 0, executionMiss: Number(oldSec.executionMiss) || 0, passed: !!oldSec.passed };
    if (oldSec.passed) course.unlockAll = true;
  }
  if (curHasMoved && !cur.dev) {
    for (const oldId of cur.order) {
      const it = cur.items?.[oldId];
      if (!it || !it.done) continue;
      const newIds = CB_ID_MAP[oldId] || (CB_EXAM_MAP[oldId] ? [CB_EXAM_MAP[oldId]] : []);
      for (const newId of newIds) {
        const l = lessonById(newId);
        if (!l) continue;
        if (isKnowledge(l) && it.choice != null) {
          const ok = !!it.correct;
          markLesson(newId, { done: true, correct: ok }, true);
          if (!ok) course.review[newId] = (course.review[newId] || 0) + 1;
          else delete course.review[newId];
        } else if (isPhysical(l) && Array.isArray(it.attempts) && it.attempts.length) {
          const kind = l.physical.kind;
          const attempts = it.attempts.slice(0, ATTEMPTS_MAX).map((t) => oldTagToNew(kind, t));
          const success = attempts.some((t) => tagInfo(kind, t)?.objective);
          markLesson(newId, { done: true });
          const p = { history: [], ...(course.physical[newId] || {}) };
          p.history = [...p.history, { migrated: true, from: oldId, success, attempts }];
          course.physical[newId] = p;
          if (!success) course.needsPractice[newId] = true;
        } else if (!isKnowledge(l) && !isPhysical(l)) markLesson(newId, { done: true });
      }
    }
  }
  for (const t of weakOld) {
    const newId = CB_EXAM_MAP[CB_EXAM_TITLES[t]];
    const title = EXAM_ITEMS.find((e) => e.id === newId)?.title || newId;
    course.exam.weak[title] = (course.exam.weak[title] || 0) + (Number(cb.exam.weak[t]) || 0);
  }
  course.migratedFromCueBall = { v: MIGRATION_VERSION, lessons: moved.size, fromSection: !!oldSec, fromRun: curHasMoved, weak: weakOld.length };
  const next = { ...state, [STORAGE_KEY]: course };
  if (curHasMoved) next[CB_KEY] = { ...cb, legacyCurrent: cur, current: null };
  return next;
}

// ------------------------------------------------------------------ state
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
    unlockAll: false,
    exam: { attempts: 0, passed: false, bestKnowledge: 0, bestExecution: 0, bestOverall: 0, history: [], weak: {} },
    stats: { knowledgeCorrect: 0, knowledgeWrong: 0, firstTotal: 0, firstCorrect: 0, attempts: 0, made: 0, madeTotal: 0, objectiveOk: 0, objectiveTotal: 0, firstTry: 0, secondTry: 0, thirdTry: 0, failed: 0, exercisesOk: 0, tableSkipped: 0, tableDrillXp: 0 }
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
/** Reads the course, applying the Cue Ball Control migration virtually if it hasn't been saved yet. */
export function courseOf(state) {
  const s = migrateFromCueBall(state);
  return courseOfRaw(s?.[STORAGE_KEY]);
}
function put(state, course) { return { ...migrateFromCueBall(state), [STORAGE_KEY]: course }; }

export function sectionRecord(course, id) { return course.sections?.[id] || null; }
export function sectionPassed(course, id) { return !!sectionRecord(course, id)?.passed; }
export function lessonCompleted(course, id) { return !!course.lessons?.[id]?.done; }

/** Sections unlock in PKF order. Anyone who had passed Cue Ball Control's old Center Ball section keeps every section open. */
export function sectionUnlocked(state, sectionId, { dev = false } = {}) {
  if (dev) return true;
  const course = courseOf(state);
  const idx = SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return false;
  if (course.unlockAll) return true;
  for (let i = 0; i < idx; i++) if (!sectionPassed(course, SECTIONS[i].id)) return false;
  return true;
}
export function examUnlocked(state, { dev = false } = {}) {
  if (dev) return true;
  const course = courseOf(state);
  return SECTIONS.every((s) => sectionPassed(course, s.id));
}

function emptyItem() {
  return { locked: false, choice: null, correct: null, solution: false, hint: false, shooting: false, attempts: [], execution: null, skipped: false, done: false };
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
  // Keeps the run (in play or on its results screen); RETRY / REPLAY starts a fresh one.
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
/** Dev preview: plays a section with nothing saved. */
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
export function reviewIds(course) { return Object.keys(course.review || {}).filter((id) => LESSONS.some((l) => l.id === id) && isKnowledge(lessonById(id))); }
export function needsPracticeIds(course) { return Object.keys(course.needsPractice || {}).filter((id) => LESSONS.some((l) => l.id === id) && isPhysical(lessonById(id))); }

/** REVIEW MISSED CONCEPTS ('review') / PRACTICE MISSED SHOTS ('practice'). Never changes section passes. */
export function startReview(state, kind = 'review') {
  const course = courseOf(state);
  const ids = kind === 'practice' ? needsPracticeIds(course) : reviewIds(course);
  if (!ids.length) return state;
  course.current = freshRun(ids, { mode: kind === 'practice' ? 'practice' : 'review' });
  return put(state, course);
}
/** Open one lesson (the REVIEW SKILL links in Cue Ball Control land here). Saves nothing graded. */
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
/** Dev preview and single-lesson review never write graded progress. */
const saves = (cur) => !cur.dev && cur.mode !== 'single';

export function selectChoice(state, choice) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !isKnowledge(x.lesson)) return state;
  if (!x.lesson.choices?.some((c) => c[0] === String(choice))) return state;
  x.it.choice = String(choice);
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
    if (LESSONS.some((l) => l.id === id)) {
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
/** One attempt (max ATTEMPTS_MAX). Success = the kind's objective result: MAKE / SHOT MADE + CORRECT ACTION / CORRECT ACTION. */
export function markAttempt(state, tag) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done || !isPhysical(x.lesson) || !x.it.shooting) return state;
  const { cur, lesson, it, id } = x;
  const kind = lesson.physical.kind;
  const info = tagInfo(kind, String(tag));
  if (!info || it.attempts.length >= ATTEMPTS_MAX) return state;
  it.attempts = [...it.attempts, String(tag)];
  const sv = saves(cur);
  if (sv) {
    course.stats.attempts += 1;
    if (info.made != null) { course.stats.madeTotal += 1; if (info.made) course.stats.made += 1; }
    course.stats.objectiveTotal += 1;
    if (info.objective) course.stats.objectiveOk += 1;
  }
  const success = info.objective;
  if (success || it.attempts.length >= ATTEMPTS_MAX) {
    it.done = true;
    it.execution = success ? 'success' : 'failed';
    if (sv) {
      const n = it.attempts.length;
      const inCourse = LESSONS.some((l) => l.id === id);
      if (success) {
        course.stats.exercisesOk += 1;
        if (n === 1) course.stats.firstTry += 1; else if (n === 2) course.stats.secondTry += 1; else course.stats.thirdTry += 1;
        if (inCourse) delete course.needsPractice[id];
      } else {
        course.stats.failed += 1;
        if (inCourse) course.needsPractice[id] = true;
      }
      const p = { history: [], ...(course.physical[id] || {}) };
      p.history = [...(p.history || []), { at: new Date().toISOString(), attempts: [...it.attempts], success, mode: cur.mode }].slice(-30);
      p.best = success ? 'success' : (p.best || 'failed');
      course.physical[id] = p;
      course.lessons[id] = { ...(course.lessons[id] || {}), done: true, skipped: false };
      course.skipped = clearSkipped(course.skipped, id);
      // Recorded table step → Drill XP: one drill session, ratio = successful attempts / attempts (1, 1/2, 1/3 or 0).
      const out = awardRecordedStep(put(state, course), STORAGE_KEY, COURSE_TITLE, lesson, { ratio: success ? 1 / n : 0, passed: success });
      it.xp = out.drill;
      return out.state;
    }
  }
  return put(state, course);
}

/** SKIP TABLE STEP (from SET UP THIS SHOT or while shooting): not attempted. 0 Drill XP, never a make or a
 *  success, never blocks the lesson. The shot goes on PRACTICE MISSED SHOTS (needs practice). */
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
    if (LESSONS.some((l) => l.id === id)) course.needsPractice[id] = true;
    course.lessons[id] = { ...(course.lessons[id] || {}), done: true, skipped: true };
  }
  return put(state, course);
}

/** Persistent list of skipped table steps (come back later). */
export function skippedIds(course) { return Object.keys(course.skipped || {}).filter((id) => isPhysical(lessonById(id))); }
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

/** Knowledge, execution, shot-making and skill objective scored separately; per-section accuracy for strongest/weakest. */
export function summarize(cur) {
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0, made = 0, madeTot = 0, objOk = 0, objTot = 0;
  const missed = [], missedShots = [], skipped = [];
  const bySection = {};
  const bump = (sec, ok) => { const b = bySection[sec] || (bySection[sec] = { ok: 0, tot: 0 }); b.tot += 1; if (ok) b.ok += 1; };
  for (const id of cur.order) {
    const l = lessonById(id);
    const it = cur.items[id];
    if (!l || !it) continue;
    if (isKnowledge(l)) {
      kTot += 1;
      if (it.correct) kOk += 1; else missed.push(id);
      bump(l.section, !!it.correct);
    } else if (isPhysical(l) && it.skipped) {
      skipped.push(id);
    } else if (isPhysical(l)) {
      xTot += 1;
      const ok = it.execution === 'success';
      if (ok) xOk += 1; else missedShots.push(id);
      bump(l.section, ok);
      for (const t of it.attempts || []) {
        const info = tagInfo(l.physical.kind, t);
        if (!info) continue;
        if (info.made != null) { madeTot += 1; if (info.made) made += 1; }
        objTot += 1;
        if (info.objective) objOk += 1;
      }
    }
  }
  const rate = (a, b) => (b ? a / b : null);
  const kRate = kTot ? kOk / kTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  const areas = Object.entries(bySection).map(([sec, b]) => ({ sec, rate: b.ok / b.tot, tot: b.tot }));
  const byBest = areas.slice().sort((a, b) => b.rate - a.rate || b.tot - a.tot);
  const strongest = byBest.length ? byBest[0].sec : null;
  const weakest = byBest.length > 1 && byBest[byBest.length - 1].rate < byBest[0].rate ? byBest[byBest.length - 1].sec : null;
  const recommend = [...new Set([...missed, ...missedShots].map((id) => lessonById(id)?.section).filter(Boolean))];
  return { kOk, kTot, kRate, xOk, xTot, xRate: rate(xOk, xTot), made, madeTot, shotRate: rate(made, madeTot), objOk, objTot, objRate: rate(objOk, objTot), overall, missed, missedShots, skipped, strongest, weakest, recommend };
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
    prev.missedShots = s.missedShots;
    prev.skipped = s.skipped;
    if (passed) prev.passed = true;
    course.sections[cur.sectionId] = prev;
  } else {
    course.exam.attempts += 1;
    course.exam.bestKnowledge = Math.max(course.exam.bestKnowledge || 0, s.kRate);
    course.exam.bestExecution = Math.max(course.exam.bestExecution || 0, s.xRate ?? 0);
    course.exam.bestOverall = Math.max(course.exam.bestOverall || 0, s.overall);
    if (passed) course.exam.passed = true;
    const weak = { ...(course.exam.weak || {}) };
    for (const id of [...s.missed, ...s.missedShots]) { const t = lessonById(id)?.title || id; weak[t] = (weak[t] || 0) + 1; }
    course.exam.weak = weak;
    const pc = (v) => (v == null ? null : Math.round(v * 100));
    course.exam.history = [...(course.exam.history || []), {
      at: new Date().toISOString(), knowledge: pc(s.kRate), execution: pc(s.xRate), shotMaking: pc(s.shotRate), objective: pc(s.objRate), overall: pc(s.overall), passed, skipped: s.skipped.length
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
  if (cur.mode === 'review' || cur.mode === 'practice') return startReview(cleared, cur.mode);
  if (cur.mode === 'single') return startSingle(cleared, cur.order[0]);
  return cleared;
}
/** From a results screen: replay only what was missed in that run (never changes a pass). */
export function reviewMissed(state, kind = 'review') {
  const course = courseOf(state);
  const cur = course.current;
  // PRACTICE MISSED SHOTS includes table steps skipped in this run.
  const ids = (kind === 'practice' ? [...(cur?.summary?.missedShots || []), ...(cur?.summary?.skipped || [])] : cur?.summary?.missed) || [];
  const list = ids.filter((id) => LESSONS.some((l) => l.id === id) || cur?.mode === 'exam');
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

/** Home-screen stats (knowledge vs execution kept apart). Rates are null until there is data. */
export function progressSummary(state) {
  const course = courseOf(state);
  const st = course.stats;
  const k = LESSONS.filter(isKnowledge);
  const pct = (a, b) => (b ? a / b : null);
  return {
    lessonsDone: LESSONS.filter((l) => lessonCompleted(course, l.id)).length,
    lessonsTotal: LESSONS.length,
    conceptsMastered: k.filter((l) => course.lessons[l.id]?.correct === true).length,
    conceptsTotal: k.length,
    knowledgeAccuracy: pct(st.knowledgeCorrect, st.knowledgeCorrect + st.knowledgeWrong),
    firstAccuracy: pct(st.firstCorrect, st.firstTotal),
    attempts: st.attempts,
    made: st.made,
    madeTotal: st.madeTotal,
    objectiveOk: st.objectiveOk,
    objectiveTotal: st.objectiveTotal,
    firstTry: st.firstTry,
    secondTry: st.secondTry,
    thirdTry: st.thirdTry,
    failed: st.failed,
    sectionsPassed: passedSectionCount(course),
    sectionsTotal: SECTIONS.length,
    needsPractice: needsPracticeIds(course).length,
    tableSkipped: st.tableSkipped || 0,
    review: reviewIds(course).length,
    examAttempts: course.exam.attempts,
    examBest: course.exam.bestOverall,
    examPassed: !!course.exam.passed
  };
}

export function pkfShotMakingProgressRows(state) {
  const course = courseOf(state);
  const rows = [];
  const started = !!((course.current && !course.current.dev && course.current.mode !== 'single') || Object.keys(course.sections).length || Object.keys(course.lessons).length);
  if (started) {
    const done = passedSectionCount(course);
    rows.push({ id: 'pkfShotMaking', name: COURSE_TITLE, href: '#pkfsmcb', short: 'PKF Shot Making', done, total: SECTIONS.length, finished: done >= SECTIONS.length });
  }
  const examStarted = !!(course.exam?.attempts || course.exam?.passed || (course.current && !course.current.dev && course.current.mode === 'exam'));
  if (examStarted) rows.push({ id: 'pkfShotMakingExam', name: EXAM_TITLE, href: '#pkfsmcb/exam', short: 'PKF SM Exam', done: course.exam.passed ? 1 : 0, total: 1, finished: !!course.exam.passed });
  return rows;
}

export function pkfShotMakingBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfsmcb" data-pkfsmcb="course"><span class="simPromoText"><span class="eyebrow">COURSE</span><b>${esc(COURSE_TITLE)}</b><small>${SECTIONS.length} sections from PKF’s Center Ball chapter: center ball vs sidespin, finding center, high and low action, stop shots, throw, ball pocketing drills and automatic aiming.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfsmcb/exam" data-pkfsmcb="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Knowledge + original PKF table exercises. Pass at ${Math.round(EXAM_PASS * 100)}% (app setting).${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfsmcb="exam" data-pkfsmcb-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
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
export function sourceMapRows() { return [...LESSONS, ...EXAM_ITEMS].map((l) => mappingRow(l)); }

export { figureHTML, solutionFigureHTML, assetOf, regionOf, ASSET_MAP, REGIONS };

const ORDER = { GUIDED: 0, ASSISTED: 1, INDEPENDENT: 2 };
export function auditCourse() {
  const problems = [];
  const ids = new Set();
  for (const l of [...LESSONS, ...EXAM_ITEMS]) {
    if (ids.has(l.id)) problems.push(`duplicate id ${l.id}`);
    ids.add(l.id);
    if (!assetOf(l.id)) problems.push(`no asset ${l.id}`);
    if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
    if (!l.src || !/Page/.test(l.src)) problems.push(`no source page ${l.id}`);
    if (!l.explain) problems.push(`no explanation ${l.id}`);
    if (!LTYPE[l.type]) problems.push(`bad type ${l.id}`);
    if (!ASSIST[l.assist]) problems.push(`bad assist ${l.id}`);
    if (isKnowledge(l)) {
      if (!l.choices?.some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
      else if (new Set(l.choices.map((c) => c[0])).size !== l.choices.length) problems.push(`duplicate choice ${l.id}`);
    } else if (l.choices || l.answer != null) problems.push(`non-question has choices ${l.id}`);
    if (isPhysical(l)) {
      if (!PHYS[l.physical?.kind]) problems.push(`physical kind ${l.id}`);
      if (!l.physical?.setup?.length || !l.physical?.objective) problems.push(`physical setup/objective ${l.id}`);
    } else if (l.physical) problems.push(`physical on non-shoot ${l.id}`);
  }
  for (const s of SECTIONS) {
    if (!knowledgeLessons(s.id).length) problems.push(`section without knowledge ${s.id}`);
    const list = lessonsFor(s.id);
    for (let i = 1; i < list.length; i++) if (ORDER[list[i].assist] < ORDER[list[i - 1].assist]) problems.push(`assist order ${list[i].id}`);
  }
  for (const id of Object.keys(ASSET_MAP)) if (!ids.has(id)) problems.push(`asset without lesson ${id}`);
  return problems;
}
