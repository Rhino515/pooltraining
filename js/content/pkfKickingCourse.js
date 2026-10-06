/**
 * PKF Kicking Systems Course — learning course in Learn > Fundamentals (PKF list).
 * Source: Pattern Play / Cue Ball Control, Chapter Eight (PDF pages 227–281).
 * Storage key: state.pkfKickingSystems only. No Career XP. Not on All. Not a Table Game.
 * Original PKF JPEGs only — no redrawn diagrams, no invented diamond numbers.
 */
import { ASSET_MAP, figureHTML, assetOf } from './pkfKickAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Kicking Systems Course';
export const EXAM_TITLE = 'PKF Kicking Systems Exam';
export const STORAGE_KEY = 'pkfKickingSystems';
export const HASH = 'pkfkick';
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  IDENTIFY: 'IDENTIFY',
  CALCULATE: 'CALCULATE',
  CHOOSE: 'CHOOSE THE ROUTE',
  SOLVE: 'SOLVE IT YOURSELF',
  SHOOT: 'NOW SHOOT IT'
};

export const SECTIONS = [
  { id: 'multiple-rail', n: 1, title: 'Multiple Rail Systems', blurb: 'Two- and three-rail kicks with running english. Add-to-target and the 30-30 path.', pages: [228,229,230,231,232,233], stub: false },
  { id: 'visual-guide', n: 2, title: 'Visual Guide', blurb: 'PKF guide to visualize the numbers between the diamonds.', pages: [231], stub: false },
  { id: 'two-rail', n: 3, title: '2-Rail System', blurb: 'Difference method: start number minus target equals the object ball number.', pages: [234,235,236], stub: false },
  { id: 'checking-point', n: 4, title: 'Checking the Path', blurb: 'Verify a path by holding the cue stick over the numbers (PKF cue-stick check).', pages: [231,264], stub: false },
  { id: 'three-rail', n: 5, title: '3-Rail Kicks', blurb: 'Three-rail kicks for contact and separation.', pages: [237,238,239,240,241], stub: false },
  { id: 'corner-pocket', n: 6, title: 'Corner Pocket Kicks', blurb: 'Three-rail variants aimed at the corner pocket.', pages: [242,243,244,245], stub: false },
  { id: 'rail-position', n: 7, title: 'Rail Kicks Using Diamonds', blurb: 'Diamond numbering and cue-ball number paths (PKF Number Guide lead-in).', pages: [247], stub: false },
  { id: 'one-rail', n: 8, title: 'One-Rail Kicks', blurb: 'Zero-X modified — no sidespin unless necessary.', pages: [246], stub: false },
  { id: 'number-guide', n: 9, title: 'Number Guide', blurb: 'PKF numbers, half-number aim, and the side pocket as 0.', pages: [247,248,249,250,251,252,253,254,255], stub: false },
  { id: 'half-table', n: 10, title: 'Half-Table Kicks', blurb: 'Needs source review — PKF has half-number aim under Number Guide, not a Half-Table chapter.', pages: [248], stub: true },
  { id: 'end-rail', n: 11, title: 'End-Rail Kicks', blurb: 'Cue ball coming off the end rail; side pocket valued at 0.', pages: [256,257], stub: false },
  { id: 'long-rail', n: 12, title: 'Long-Rail Kicks', blurb: 'Long-rail contact when the object ball sits on the cue-ball path.', pages: [258,259,260,261], stub: false },
  { id: 'diamond-table', n: 13, title: 'Diamond Table Kicking System', blurb: 'Blue Series one-rail system with calculations — student solves.', pages: [270,271,272,273,274,275,276,277], stub: false },
  { id: 'adjustments', n: 14, title: 'Adjustments', blurb: 'Distance-from-rail percentage adjustments (80% / 60% / 40%).', pages: [278,279], stub: false },
  { id: 'kick-safe', n: 15, title: 'Kick Safe', blurb: 'Instructional Kick Safe game from the book (not the Table Games scorekeeper).', pages: [280,281], stub: false },
];

export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

export const LESSONS = [
  { id: 'mrs-intro', section: 'multiple-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Multiple Rail Systems', prompt: 'Study the chapter intro and the first multiple-rail system on this page.', explain: 'PKF starts with multiple rail systems (two or three rails) using running english. Learn one system before moving on. The first system finds an object-ball number, then a cue-ball path whose two numbers add up to that object number (for example 30 + 30 = 60).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'mrs-3030', section: 'multiple-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'The 30-30 path', prompt: 'Look at the 30-30 path example on the lower diagram.', explain: 'Object ball number 60. The 30-30 path: cue ball from 30 on the long rail toward 30 on the end rail. 30 + 30 = 60. Use at least a tip of running english.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'mrs-identify-60', section: 'multiple-rail', type: LTYPE.IDENTIFY, assist: ASSIST.GUIDED, title: 'Identify the add-to-target path', prompt: 'In the lower diagram, the object ball is at 60. Which cue-ball path does PKF use?', explain: 'PKF places the cue ball on the 30-30 path because 30 + 30 = 60.', choices: [['30-30', '30-30 path (30 + 30 = 60)'], ['40-20', '40-20 path'], ['50-10', '50-10 path'], ['20-20', '20-20 path']], answer: '30-30', incomplete: false, shoot: false },
  { id: 'mrs-short-long', section: 'multiple-rail', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'When the path plays short or long', prompt: 'Read how PKF adjusts when the 30-30 path goes short or long.', explain: 'If the path is going short, aim slightly to the left of the 30 diamond. If going long, aim slightly to the right of the 30 diamond (as shown on the page).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'mrs-calc-path', section: 'multiple-rail', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Find a path that equals 70', prompt: 'PKF holds the cue over numbers that equal 70. Which nearby pair equals 70?', explain: 'PKF uses 40 and 30 as a starting pair that equals 70, then adjusts to a path that fits the cue ball (for example 35-35).', choices: [['40-30', '40 and 30'], ['50-10', '50 and 10'], ['60-20', '60 and 20'], ['25-25', '25 and 25']], answer: '40-30', incomplete: false, shoot: false },
  { id: 'mrs-shoot-3030', section: 'multiple-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot the 30-30 kick', prompt: 'Set up the 30-30 two-rail kick from the diagram. Shoot it on your table.', explain: 'Success is contacting the object ball after the two rails with running english, as in the PKF example.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'viz-guide', section: 'visual-guide', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Numbers between the diamonds', prompt: 'Study PKF\'s guide for visualizing the numbers between the diamonds.', explain: 'PKF shows a guide to help you visualize the numbers between the diamonds so you can read half-numbers and in-between values on the rails.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'viz-example', section: 'visual-guide', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Sliding to 33-32', prompt: 'Follow the 35-30 to 33-32 example above the guide.', explain: 'When the cue ball is not exactly on 35-30, PKF slides the cue stick to 33-32 so the cue ball sits under the stick — that is the correct path.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'viz-identify', section: 'visual-guide', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'Read the in-between path', prompt: 'In the example, after sliding from 35-30, which path does PKF settle on?', explain: 'PKF settles on 33-32 when the cue ball sits beneath the cue stick.', choices: [['33-32', '33-32'], ['35-30', '35-30'], ['40-30', '40-30'], ['30-30', '30-30']], answer: '33-32', incomplete: false, shoot: false },
  { id: 'two-intro', section: 'two-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Difference of start vs target', prompt: 'Read the second two-rail method on this page.', explain: 'Object ball numbers start at 10 and increase by 10. Find a cue-ball path where the difference between the starting number and the target number equals the object ball number. Use at least a tip and a half of running english (right spin in the examples).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'two-ex-40-30', section: 'two-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: '40 minus 30 equals 10', prompt: 'Study the layout hooked on the 6 ball at object number 10.', explain: 'Cue ball on the 40-30 path: 40 − 30 = 10, which matches the object ball number.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'two-identify', section: 'two-rail', type: LTYPE.IDENTIFY, assist: ASSIST.GUIDED, title: 'Path near the side pocket', prompt: 'In figure 8-29 the cue ball is near the side pocket and the object number is 10. Which path does PKF use?', explain: 'PKF uses the 30-20 path: 30 − 20 = 10.', choices: [['30-20', '30-20'], ['40-30', '40-30'], ['45-15', '45-15'], ['30-10', '30-10']], answer: '30-20', incomplete: false, shoot: false },
  { id: 'two-calc', section: 'two-rail', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Object number 30', prompt: 'Figure 8-30: object ball near the third diamond (object number 30). Cue ball looks like which path?', explain: 'PKF says the cue ball looks like it is on the 45-15 path, which leads to 30 (45 − 15 = 30).', choices: [['45-15', '45-15'], ['40-30', '40-30'], ['30-20', '30-20'], ['50-20', '50-20']], answer: '45-15', incomplete: false, shoot: false },
  { id: 'two-solve', section: 'two-rail', type: LTYPE.SOLVE, assist: ASSIST.INDEPENDENT, title: 'Lock your path first', prompt: 'Using the difference method, if start is 30 and object number is 20, what target do you aim at?', explain: '30 − target = 20 → target = 10. PKF\'s nearby example uses a 30-10 style path for object 20.', choices: [['10', 'Target 10'], ['20', 'Target 20'], ['30', 'Target 30'], ['50', 'Target 50']], answer: '10', incomplete: false, shoot: false },
  { id: 'two-shoot', section: 'two-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a difference-method kick', prompt: 'Pick one of the page layouts and shoot it with running english.', explain: 'Make contact after the rails using the difference method from the page.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'chk-intro', section: 'checking-point', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Cue-stick check', prompt: 'See how PKF checks a path with the cue stick.', explain: 'Hold the cue stick over two numbers that equal the object number. If the cue ball sits under the stick, that path is correct. If not, slide to a nearby path until the cue ball is under the stick.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'chk-endrail', section: 'checking-point', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'Check an end-rail path', prompt: 'On this page PKF checks an end-rail path with the cue stick and a quick math check.', explain: 'After estimating contact between diamonds, PKF checks the path with the cue stick to confirm a direct hit, then notes speed and spin limits for that shot.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'chk-identify', section: 'checking-point', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'When is the path correct?', prompt: 'According to PKF, when have you found the correct cue-ball path?', explain: 'When the cue ball sits beneath the cue stick held over that path.', choices: [['under', 'Cue ball is under the stick on that path'], ['parallel', 'Cue stick is parallel to the long rail'], ['diamond', 'Cue tip points at any diamond'], ['center', 'Cue ball is in the center of the table']], answer: 'under', incomplete: false, shoot: false },
  { id: 'three-intro', section: 'three-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Three-rail kicks', prompt: 'Read the three-rail examples starting on this page.', explain: 'PKF picks an object ball number, then finds a cue-ball path that fits that number for a three-rail route, often with running english.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'three-sep', section: 'three-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Separation after contact', prompt: 'Study the three-rail kick used to create separation.', explain: 'Top players often strike the rail right before the object ball to put separation between cue ball and object ball, with a chance at pocketing.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'three-calc', section: 'three-rail', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Object number near the second diamond', prompt: 'PKF: ball directly across from the second diamond (20) and half a diamond away from the side rail. What object ball number do they use?', explain: 'PKF takes 5 away from 20 to get object ball number 15.', choices: [['15', '15'], ['20', '20'], ['25', '25'], ['10', '10']], answer: '15', incomplete: false, shoot: false },
  { id: 'three-identify', section: 'three-rail', type: LTYPE.IDENTIFY, assist: ASSIST.INDEPENDENT, title: 'Three-rail object number', prompt: 'From the page examples, object numbers for three-rail kicks are taken from where?', explain: 'From the object ball\'s place relative to the diamonds (and distance off the side rail when needed).', choices: [['diamonds', 'Diamond position (and off-rail distance)'], ['ball-number', 'The printed number on the object ball'], ['pocket-name', 'Only the pocket name'], ['speed', 'Only the planned speed']], answer: 'diamonds', incomplete: false, shoot: false },
  { id: 'three-shoot', section: 'three-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a three-rail kick', prompt: 'Set up one three-rail layout from the section and shoot it.', explain: 'Hit the object ball after three rails as in the PKF example.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'corner-intro', section: 'corner-pocket', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Corner-pocket three-rail', prompt: 'Read the corner-pocket three-rail method.', explain: 'First find a cue-ball path that equals 25. Then adjust the target for how far the object ball sits from the corner (a diamond = 10).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'corner-add10', section: 'corner-pocket', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Add 10 per diamond from the corner', prompt: 'Study the example that adds 10 to the target of 5.', explain: 'Path 30-05 equals 25. Object ball one diamond from the corner → add 10 to target 5 giving 15. Shoot at 15 with running english (right spin).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'corner-calc', section: 'corner-pocket', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Target when one diamond out', prompt: 'Base path equals 25 with target 5. Object ball is one diamond from the corner. What number do you shoot at?', explain: 'Add 10 to 5 → shoot at 15.', choices: [['15', '15'], ['5', '5'], ['25', '25'], ['35', '35']], answer: '15', incomplete: false, shoot: false },
  { id: 'corner-other', section: 'corner-pocket', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'Other side of the corner', prompt: 'Read the rule when the ball is on the other side of the corner pocket.', explain: 'PKF doubles the number subtracted from the target when the object ball is on the other side of the corner pocket.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'corner-shoot', section: 'corner-pocket', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a corner-pocket kick', prompt: 'Shoot a three-rail corner-pocket layout from the page.', explain: 'Use running english and the page\'s target adjustment.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'railpos-intro', section: 'rail-position', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Diamond map 0 to 80', prompt: 'Study the graphic: corner pocket 0, each diamond +10 to the other corner 80.', explain: 'The other side of the table is a mirror image with the same numbers.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'railpos-paths', section: 'rail-position', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Every cue ball is on a path', prompt: 'Read how number paths work.', explain: 'The cue ball is always on a number path. Number paths lead to a pocket or a target on a rail.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'railpos-identify', section: 'rail-position', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'Value of the third diamond from the corner', prompt: 'Starting at corner pocket 0, what is the value at the third diamond?', explain: 'Each diamond increases by ten: 10, 20, 30. The third diamond is 30.', choices: [['30', '30'], ['20', '20'], ['40', '40'], ['3', '3']], answer: '30', incomplete: false, shoot: false },
  { id: 'one-intro', section: 'one-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'One Rail Kicks', prompt: 'Read why one-rail kicks are missed and how PKF modified Zero-X.', explain: 'Common misses: wrong rail target, too hard (shortens the angle), too much sidespin, too much high spin on full-table kicks. PKF modified Zero-X systems so they can be performed without sidespin unless absolutely necessary.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'one-sidespin', section: 'one-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Sidespin is speed sensitive', prompt: 'Study paths A–D with sidespin.', explain: 'Slower speed widens the angle; faster speed shortens it. Extra sidespin also causes misses.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'one-identify', section: 'one-rail', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'Which path comes up short?', prompt: 'In the sidespin diagram, shooting too hard causes which labeled result?', explain: 'PKF labels path A as shooting too hard — comes up short.', choices: [['A', 'Path A — too hard, short'], ['C', 'Path C — soft, wide'], ['D', 'Path D — soft with too much spin, very wide'], ['center', 'Center-ball only']], answer: 'A', incomplete: false, shoot: false },
  { id: 'one-nosidespin', section: 'one-rail', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'No sidespin stays true', prompt: 'Compare the no-sidespin diagram.', explain: 'With no sidespin at soft or medium speed the angle stays true (path A). Shooting too hard still comes up short (path B) even without sidespin.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'one-shoot', section: 'one-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a no-sidespin one-rail', prompt: 'Shoot a one-rail kick with center (no sidespin) at controlled speed.', explain: 'Contact the object ball without sidespin unless the layout truly needs it.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'num-map', section: 'number-guide', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Number Guide map', prompt: 'Memorize the 0–80 diamond map (critical PKF numbers).', explain: 'From the corner pocket (0), each diamond increases by ten to the other corner (80). The other long rail mirrors the same numbers.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'num-half', section: 'number-guide', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Half-number aim', prompt: 'Study cue balls A–D on half-number paths.', explain: 'A is on 10-5; B on 30-15; C on 50-25; D continues the pattern. Half-numbers sit between diamonds (5 between 0 and 10, 15 between 10 and 20).', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'num-calc-half', section: 'number-guide', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Cue ball B path', prompt: 'Four cue balls are shown. Cue ball B is on which path?', explain: 'PKF: cue ball B is on the 30-15 path.', choices: [['30-15', '30-15'], ['10-5', '10-5'], ['50-25', '50-25'], ['80-40', '80-40']], answer: '30-15', incomplete: false, shoot: false },
  { id: 'num-side0', section: 'number-guide', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'Side pocket as 0', prompt: 'Read how the side pocket is used as a target.', explain: 'The diamond for each side pocket is at the back of the pocket. Use that area as your target when coming in from an angle. Example: cue ball on 80-40 — aim at 40 (back of the pocket) toward the corner.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'num-identify-path', section: 'number-guide', type: LTYPE.IDENTIFY, assist: ASSIST.INDEPENDENT, title: 'Paths to the hanging 8', prompt: 'Figure 8-88: which path is cue ball A on toward the corner?', explain: 'PKF: cue ball A is on the 30-15 path; B on 60-30; C on 80-40.', choices: [['30-15', 'A: 30-15'], ['60-30', 'A: 60-30'], ['80-40', 'A: 80-40'], ['40-20', 'A: 40-20']], answer: '30-15', incomplete: false, shoot: false },
  { id: 'num-shoot', section: 'number-guide', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a number-path kick', prompt: 'Shoot one of the number-path examples from the section.', explain: 'Hit your target number cleanly; small misses change the path a lot.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'half-stub', section: 'half-table', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Needs source review', prompt: 'This requested section title does not appear as a chapter heading in the PKF kicking pages.', explain: 'Half-number aim (10-5, 30-15, 50-25) is taught under Number Guide. No separate Half-Table Kicks pages were found in PDF 227–281. Do not invent a half-table system.', choices: null, answer: null, incomplete: true, shoot: false },
  { id: 'end-intro', section: 'end-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Coming off the end rail', prompt: 'Read the end-rail approach examples.', explain: 'Side pocket is 0; each diamond from the side pocket increases by 10. Rounding the corner, diamonds continue (50, 60, 70). Hitting the side-rail number accurately matters — small misses change the path a lot.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'end-50-25', section: 'end-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: '50-25 toward the side', prompt: 'Study figure 8-111.', explain: 'Cue ball on the 50-25 path; shooting at 25 sends the cue ball toward the side pocket.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'end-identify', section: 'end-rail', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'Path in figure 8-111', prompt: 'Which path is the cue ball on in figure 8-111?', explain: 'PKF: the cue ball is directly on the 50-25 path.', choices: [['50-25', '50-25'], ['40-20', '40-20'], ['30-15', '30-15'], ['60-30', '60-30']], answer: '50-25', incomplete: false, shoot: false },
  { id: 'end-calc', section: 'end-rail', type: LTYPE.CALCULATE, assist: ASSIST.INDEPENDENT, title: '8 near the first diamond', prompt: 'Same 50-25 family when the 8 is near the first diamond — what must you still do?', explain: 'PKF stresses hitting the side-rail target number accurately; missing even a little really changes the path.', choices: [['hit-number', 'Hit the side-rail target number accurately'], ['add-sidespin', 'Add maximum sidespin'], ['ignore-path', 'Ignore the path and kick by feel'], ['aim-center', 'Always aim center table']], answer: 'hit-number', incomplete: false, shoot: false },
  { id: 'end-shoot', section: 'end-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot an end-rail kick', prompt: 'Shoot an end-rail approach from the section diagrams.', explain: 'Contact the object ball after coming off the end rail.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'long-intro', section: 'long-rail', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Object ball on the path', prompt: 'Read the long-rail kick intro.', explain: 'Sometimes the object ball is already on the cue-ball path to 0. Striking the rail at the right number (for example 15) contacts the object ball. Focus and hit your target number.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'long-32-16', section: 'long-rail', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: '32-16 barely misses', prompt: 'Study the 6-ball example.', explain: 'Path to 0 is 32-16. That path just barely misses the 6 — use that read to adjust.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'long-identify', section: 'long-rail', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'Key to long-rail kicks', prompt: 'What does PKF say is the main key to long-rail kicks?', explain: 'Focus and hit your target number; being off even a little throws the shot off.', choices: [['target', 'Hit your target number precisely'], ['sidespin', 'Always use two tips of sidespin'], ['hard', 'Always shoot as hard as possible'], ['feel', 'Kick only by feel']], answer: 'target', incomplete: false, shoot: false },
  { id: 'long-shoot', section: 'long-rail', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a long-rail kick', prompt: 'Shoot a long-rail layout from the section.', explain: 'Contact the object ball; prioritize the rail target number.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'dia-intro', section: 'diamond-table', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Blue Series one-rail system', prompt: 'Read the intro to the Blue Series Diamond table system.', explain: 'Created for Blue Series Diamond tables; works on any table with possible slight modification. Does not require left or right spin.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'dia-inside', section: 'diamond-table', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Add or subtract from the target', prompt: 'Study the inside-path vs outside-path rule.', explain: 'When the object ball is within the cue-ball path, add to the target diamond. When the object ball is outside the cue-ball path, subtract from the target diamond.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'dia-calc-ex', section: 'diamond-table', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Half the distance to the side pocket', prompt: 'Side pocket is 5 away from the cue ball\'s end point. What does PKF do with that 5?', explain: 'Divide in half → 2.5 — then add 2.5 to the target diamond for the new target (A).', choices: [['2.5', 'Divide by 2 → add 2.5'], ['5', 'Add the full 5'], ['10', 'Add 10'], ['0', 'Do not adjust']], answer: '2.5', incomplete: false, shoot: false },
  { id: 'dia-solve', section: 'diamond-table', type: LTYPE.SOLVE, assist: ASSIST.INDEPENDENT, title: 'Figure 8-172 / 8-173', prompt: 'End point is a diamond away (10) from the object ball, and the ball is within the path. What do you add to the target diamond?', explain: 'Add half of 10 → add 5 to the target diamond.', choices: [['5', 'Add 5'], ['10', 'Add 10'], ['2.5', 'Add 2.5'], ['0', 'Subtract 5']], answer: '5', incomplete: false, shoot: false },
  { id: 'dia-shoot', section: 'diamond-table', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot a Blue Series one-rail', prompt: 'Shoot a calculated Blue Series one-rail from the section.', explain: 'No left/right spin unless the page calls for a modification.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'adj-intro', section: 'adjustments', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Percentage adjustments', prompt: 'Read the distance-from-rail percentage graphic.', explain: 'As the cue ball moves away from the side rail, adjust using percentages at each diamond: first diamond 80%, second 60%, third 40%.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'adj-pct', section: 'adjustments', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: '80% / 60% / 40%', prompt: 'Confirm the three percentage landmarks.', explain: 'First diamond: 80%. Second diamond: 60%. Third diamond: 40%. Cue balls shown on the 40-20 path toward the corner.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'adj-calc-c', section: 'adjustments', type: LTYPE.CALCULATE, assist: ASSIST.ASSISTED, title: 'Cue ball C — first diamond', prompt: 'To hit the 8 by the first diamond: add 40% of 10 to 40. What target number results after dividing by 2?', explain: '40% of 10 = 4; 40 + 4 = 44; 44 / 2 = 22.', choices: [['22', '22'], ['26', '26'], ['30', '30'], ['44', '44']], answer: '22', incomplete: false, shoot: false },
  { id: 'adj-calc-a', section: 'adjustments', type: LTYPE.SOLVE, assist: ASSIST.INDEPENDENT, title: 'Cue ball A — pocket the 8', prompt: 'Cue ball A is one diamond from the side rail on the 40-20 path. To pocket the 8 in the corner, what does PKF say to shoot toward?', explain: 'Simply shoot toward 20.', choices: [['20', '20'], ['30', '30'], ['40', '40'], ['10', '10']], answer: '20', incomplete: false, shoot: false },
  { id: 'adj-shoot', section: 'adjustments', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Shoot with a percentage adjust', prompt: 'Apply one percentage adjustment from the page on your table.', explain: 'Use the diamond percentage from the graphic; do not invent other percents.', choices: null, answer: null, incomplete: false, shoot: true },
  { id: 'ks-intro', section: 'kick-safe', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'Kick Safe (from the book)', prompt: 'Read how Kick Safe is played.', explain: 'A game for kick shots and safeties for two or more players. Separate from the Pool IQ Table Games Kick Safe scorekeeper.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'ks-break', section: 'kick-safe', type: LTYPE.LEARN, assist: ASSIST.GUIDED, title: 'The break', prompt: 'Study figures 8-204 and 8-205.', explain: 'Rack as for 9-ball with the 1 in front. Soft break — at least three balls to a rail. Aim for the post-break position shown.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'ks-identify', section: 'kick-safe', type: LTYPE.IDENTIFY, assist: ASSIST.ASSISTED, title: 'How is it racked?', prompt: 'How does PKF rack Kick Safe?', explain: 'As for 9-ball, with the 1 ball in front.', choices: [['9ball', '9-ball rack, 1 in front'], ['8ball', '8-ball rack'], ['15open', '15-ball open rack'], ['no-rack', 'No rack — scatter by hand']], answer: '9ball', incomplete: false, shoot: false },
  { id: 'ks-play', section: 'kick-safe', type: LTYPE.LEARN, assist: ASSIST.ASSISTED, title: 'Taking turns', prompt: 'Read how players rotate after the break.', explain: 'Player 2 must perform a successful kick on the 1. A three-rail kick using a previous system is one option. Play continues with later players as shown.', choices: null, answer: null, incomplete: false, shoot: false },
  { id: 'ks-shoot', section: 'kick-safe', type: LTYPE.SHOOT, assist: ASSIST.INDEPENDENT, title: 'Play a practice inning', prompt: 'With a partner if you can, play a short Kick Safe inning as described.', explain: 'Soft break, then successful kicks in turn. Mark SUCCESS or MISS for your attempts.', choices: null, answer: null, incomplete: false, shoot: true },
];

export const EXAM_ITEMS = [
  { id: 'exam-k1', type: 'IDENTIFY', title: 'Add-to-target path', prompt: 'Object number 60. Which path does the Multiple Rail add-to-target example use?', explain: '30 + 30 = 60 → 30-30 path.', choices: [['30-30', '30-30'], ['40-20', '40-20'], ['50-10', '50-10'], ['20-40', '20-40']], answer: '30-30', shoot: false, asset: 'exam-k1' },
  { id: 'exam-k2', type: 'CALCULATE', title: 'Difference method', prompt: 'Start 40, target 30. What object ball number does that path equal?', explain: '40 − 30 = 10.', choices: [['10', '10'], ['70', '70'], ['30', '30'], ['40', '40']], answer: '10', shoot: false, asset: 'exam-k2' },
  { id: 'exam-k3', type: 'IDENTIFY', title: 'Diamond map', prompt: 'From corner pocket 0, what is the fourth diamond\'s value?', explain: '+10 per diamond → 40.', choices: [['40', '40'], ['30', '30'], ['50', '50'], ['4', '4']], answer: '40', shoot: false, asset: 'exam-k3' },
  { id: 'exam-k4', type: 'CALCULATE', title: 'Half-number path', prompt: 'Cue ball B in the four-ball graphic is on which path?', explain: '30-15.', choices: [['30-15', '30-15'], ['10-5', '10-5'], ['50-25', '50-25'], ['80-40', '80-40']], answer: '30-15', shoot: false, asset: 'exam-k4' },
  { id: 'exam-k5', type: 'IDENTIFY', title: 'End-rail path', prompt: 'Figure 8-111: cue ball path toward the side pocket?', explain: '50-25.', choices: [['50-25', '50-25'], ['40-20', '40-20'], ['60-30', '60-30'], ['30-15', '30-15']], answer: '50-25', shoot: false, asset: 'exam-k5' },
  { id: 'exam-k6', type: 'CALCULATE', title: 'Blue Series half-adjust', prompt: 'Distance from end point to side pocket is 5. What adjustment does PKF add to the target diamond?', explain: '5 / 2 = 2.5 added to the target.', choices: [['2.5', '2.5'], ['5', '5'], ['10', '10'], ['0', '0']], answer: '2.5', shoot: false, asset: 'exam-k6' },
  { id: 'exam-k7', type: 'CALCULATE', title: 'Percentage adjust', prompt: '40% of 10 added to 40, then divide by 2. Target?', explain: '44 / 2 = 22.', choices: [['22', '22'], ['26', '26'], ['30', '30'], ['18', '18']], answer: '22', shoot: false, asset: 'exam-k7' },
  { id: 'exam-k8', type: 'CALCULATE', title: 'Corner adjust', prompt: 'Base target 5; object one diamond from corner. Shoot at?', explain: '5 + 10 = 15.', choices: [['15', '15'], ['5', '5'], ['25', '25'], ['35', '35']], answer: '15', shoot: false, asset: 'exam-k8' },
  { id: 'exam-x1', type: 'SHOOT', title: 'Shoot a two-rail system kick', prompt: 'Shoot either the 30-30 add-to-target or a difference-method layout from the course.', explain: 'Physical execution — mark make or miss.', choices: null, answer: null, shoot: true, asset: 'exam-x1' },
  { id: 'exam-x2', type: 'SHOOT', title: 'Shoot a no-sidespin one-rail', prompt: 'Shoot a one-rail kick with no sidespin at controlled speed.', explain: 'Physical execution — mark make or miss.', choices: null, answer: null, shoot: true, asset: 'exam-x2' },
];


export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }

export function blank() {
  return {
    sections: {},
    current: null,
    skipped: {},
    tableXp: {},
    exam: { attempts: 0, passed: false, bestKnowledge: 0, bestExecution: 0, bestOverall: 0, history: [], weak: {} },
    stats: { knowledgeCorrect: 0, knowledgeWrong: 0, executionMake: 0, executionMiss: 0, tableSkipped: 0, tableDrillXp: 0 }
  };
}

export function pkfOf(state) {
  const raw = state?.[STORAGE_KEY];
  if (!raw || typeof raw !== 'object') return blank();
  return {
    ...blank(),
    ...raw,
    sections: raw.sections && typeof raw.sections === 'object' ? raw.sections : {},
    skipped: raw.skipped && typeof raw.skipped === 'object' ? { ...raw.skipped } : {},
    tableXp: raw.tableXp && typeof raw.tableXp === 'object' ? { ...raw.tableXp } : {},
    exam: { ...blank().exam, ...(raw.exam || {}) },
    stats: { ...blank().stats, ...(raw.stats || {}) },
    current: raw.current || null
  };
}

function put(state, pkf) { return { ...state, [STORAGE_KEY]: pkf }; }

export function sectionRecord(pkf, id) {
  return pkf.sections?.[id] || null;
}

export function sectionPassed(pkf, id) {
  const r = sectionRecord(pkf, id);
  return !!(r && r.passed);
}

/** Sequential unlock. Dev Mode ON (owner signed in) bypasses locks — same idea as pack stages. */
export function sectionUnlocked(state, sectionId, { dev = false } = {}) {
  if (dev) return true;
  const pkf = pkfOf(state);
  const idx = SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  for (let i = 0; i < idx; i++) {
    const s = SECTIONS[i];
    if (s.stub) continue;
    if (!sectionPassed(pkf, s.id)) return false;
  }
  return true;
}

export function examUnlocked(state, { dev = false } = {}) {
  if (dev) return true;
  const pkf = pkfOf(state);
  return SECTIONS.filter((s) => !s.stub).every((s) => sectionPassed(pkf, s.id));
}

export function knowledgeLessons(sectionId) {
  return lessonsFor(sectionId).filter((l) => !l.shoot && !l.incomplete && l.answer != null);
}

function emptyItem() {
  return { locked: false, choice: null, correct: null, revealed: false, execution: null, skipped: false, done: false };
}

export function startSection(state, sectionId) {
  if (!sectionUnlocked(state, sectionId)) return state;
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (cur && !cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  const items = {};
  for (const l of list) items[l.id] = emptyItem();
  pkf.current = { mode: 'section', sectionId, cursor: 0, view: 0, phase: 'play', order: list.map((l) => l.id), items };
  return put(state, pkf);
}

export function startExam(state) {
  if (!examUnlocked(state)) return state;
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (cur && !cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  const items = {};
  for (const l of EXAM_ITEMS) items[l.id] = emptyItem();
  pkf.current = { mode: 'exam', cursor: 0, view: 0, phase: 'play', order: EXAM_ITEMS.map((l) => l.id), items };
  return put(state, pkf);
}

/** DEV PREVIEW: open a locked section. Results are not saved. */
export function previewSection(state, sectionId, restart = false) {
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!restart && cur && cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  const items = {};
  for (const l of list) items[l.id] = emptyItem();
  pkf.current = { mode: 'section', sectionId, cursor: 0, view: 0, phase: 'play', order: list.map((l) => l.id), items, dev: true, parent: 'section' };
  return put(state, pkf);
}

/** DEV PREVIEW: open the locked exam. Results are not saved. */
export function previewExam(state, restart = false) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!restart && cur && cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  const items = {};
  for (const l of EXAM_ITEMS) items[l.id] = emptyItem();
  pkf.current = { mode: 'exam', cursor: 0, view: 0, phase: 'play', order: EXAM_ITEMS.map((l) => l.id), items, dev: true, parent: 'exam' };
  return put(state, pkf);
}

export function selectChoice(state, choice) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const it = cur.items[id];
  if (!it || it.locked || it.done) return state;
  it.choice = String(choice);
  return put(state, pkf);
}

export function lockAnswer(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const lesson = lessonById(id);
  const it = cur.items[id];
  if (!it || it.locked || it.done) return state;
  if (lesson?.shoot && lesson?.answer == null) return state;
  if (lesson?.answer == null) {
    it.locked = true;
    it.revealed = true;
    it.correct = null;
    it.done = true;
    return put(state, pkf);
  }
  if (it.choice == null || it.choice === '') return state;
  it.locked = true;
  it.correct = String(it.choice) === String(lesson.answer);
  it.revealed = true;
  if (!cur.dev) {
    if (it.correct) pkf.stats.knowledgeCorrect += 1;
    else pkf.stats.knowledgeWrong += 1;
  }
  if (!lesson.shoot) it.done = true;
  return put(state, pkf);
}

export function revealSolution(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur) return state;
  const id = cur.order[cur.cursor];
  const it = cur.items[id];
  if (!it || !it.locked) return state;
  it.revealed = true;
  return put(state, pkf);
}

export function markExecution(state, result) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const lesson = lessonById(id);
  const it = cur.items[id];
  if (!it || it.done) return state;
  if (lesson?.answer != null && !it.locked) return state;
  const ok = result === 'make' || result === 'success';
  it.execution = ok ? 'make' : 'miss';
  it.done = true;
  if (cur.dev) return put(state, pkf);
  if (ok) pkf.stats.executionMake += 1;
  else pkf.stats.executionMiss += 1;
  pkf.skipped = clearSkipped(pkf.skipped, id);
  // Recorded table step → Drill XP (same per-drill session formula; a miss earns what a failed drill earns).
  const r = awardRecordedStep(put(state, pkf), STORAGE_KEY, COURSE_TITLE, lesson, { ratio: ok ? 1 : 0, passed: ok });
  it.xp = r.drill;
  return r.state;
}

/** SKIP TABLE STEP: not attempted. 0 Drill XP, never a make, never blocks the lesson. */
export function skipTableStep(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const lesson = lessonById(id);
  const it = cur.items[id];
  if (!it || it.done || !lesson?.shoot) return state;
  if (lesson.answer != null && !it.locked) return state;
  it.skipped = true;
  it.execution = null;
  it.done = true;
  if (!cur.dev) {
    pkf.stats.tableSkipped += 1;
    pkf.skipped = markSkipped(pkf.skipped, id);
  }
  return put(state, pkf);
}

/** Persistent list of skipped table steps (come back later). */
export function skippedIds(pkf) { return Object.keys(pkf.skipped || {}).filter((id) => lessonById(id)?.shoot); }

export function acknowledgeLearn(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const lesson = lessonById(id);
  const it = cur.items[id];
  if (!it || it.done) return state;
  if (lesson?.answer != null || lesson?.shoot) return state;
  it.locked = true;
  it.revealed = true;
  it.done = true;
  return put(state, pkf);
}

export function nextLesson(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur || cur.phase !== 'play') return state;
  const id = cur.order[cur.cursor];
  const it = cur.items[id];
  if (!it?.done) return state;
  if (cur.cursor >= cur.order.length - 1) return finishRun(state);
  cur.cursor += 1;
  cur.view = cur.cursor;
  return put(state, pkf);
}

export function viewLesson(state, i) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur) return state;
  const n = Math.max(0, Math.min(cur.cursor, Number(i) || 0));
  cur.view = n;
  return put(state, pkf);
}

function finishRun(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur) return state;
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0;
  const missed = [];
  const skipped = [];
  const weak = { ...(pkf.exam.weak || {}) };
  for (const id of cur.order) {
    const lesson = lessonById(id);
    const it = cur.items[id];
    if (!lesson || !it) continue;
    if (lesson.answer != null) {
      kTot += 1;
      if (it.correct) kOk += 1;
      else {
        missed.push(id);
        const topic = cur.mode === 'exam' ? (lesson.title || id) : (cur.sectionId || id);
        weak[topic] = (weak[topic] || 0) + 1;
      }
    }
    if (lesson.shoot && it.skipped) skipped.push(id);
    if (lesson.shoot || it.execution) {
      if (it.execution) {
        xTot += 1;
        if (it.execution === 'make') xOk += 1;
      }
    }
  }
  const kRate = kTot ? kOk / kTot : 1;
  const xRate = xTot ? xOk / xTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  cur.phase = 'results';
  const sectionPass = kTot ? kRate >= KNOWLEDGE_PASS : true;
  const examPass = overall >= EXAM_PASS;
  cur.summary = { kOk, kTot, xOk, xTot, kRate, xRate, overall, missed, skipped, passed: cur.mode === 'section' ? sectionPass : examPass };
  // DEV PREVIEW and PRACTICE SKIPPED STEPS runs: show results but do not write section/exam progress.
  if (cur.dev || cur.parent === 'review-skip') return put(state, pkf);
  if (cur.mode === 'section') {
    const passed = sectionPass;
    const prev = pkf.sections[cur.sectionId] || { knowledgeCorrect: 0, knowledgeTotal: 0, executionMake: 0, executionMiss: 0, passed: false, bestKnowledge: 0, attempts: 0, missed: [], lesson: {} };
    prev.attempts += 1;
    prev.knowledgeCorrect = kOk;
    prev.knowledgeTotal = kTot;
    prev.executionMake = (prev.executionMake || 0) + xOk;
    prev.executionMiss = (prev.executionMiss || 0) + (xTot - xOk);
    prev.bestKnowledge = Math.max(prev.bestKnowledge || 0, kRate);
    prev.missed = missed;
    prev.skipped = skipped;
    if (passed) prev.passed = true;
    pkf.sections[cur.sectionId] = prev;
  } else {
    const passed = examPass;
    pkf.exam.attempts += 1;
    pkf.exam.bestKnowledge = Math.max(pkf.exam.bestKnowledge || 0, kRate);
    pkf.exam.bestExecution = Math.max(pkf.exam.bestExecution || 0, xRate);
    pkf.exam.bestOverall = Math.max(pkf.exam.bestOverall || 0, overall);
    if (passed) pkf.exam.passed = true;
    pkf.exam.weak = weak;
    pkf.exam.history = [...(pkf.exam.history || []), {
      at: new Date().toISOString(),
      knowledge: Math.round(kRate * 100),
      execution: xTot ? Math.round(xRate * 100) : null,
      skipped: skipped.length,
      overall: Math.round(overall * 100),
      passed
    }].slice(-20);
  }
  return put(state, pkf);
}

export function retryCurrent(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur) return state;
  if (cur.dev) {
    if (cur.mode === 'exam' || cur.parent === 'exam') return previewExam(state, true);
    return previewSection(state, cur.sectionId, true);
  }
  // Clear the finished run so start* builds a fresh one (start* keeps an existing run of the same kind).
  pkf.current = null;
  const cleared = put(state, pkf);
  if (cur.mode === 'exam') return startExam(cleared);
  return startSection(cleared, cur.sectionId);
}

export function reviewMissed(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  if (!cur?.summary?.missed?.length) return state;
  const missed = cur.summary.missed;
  const items = {};
  for (const id of missed) items[id] = emptyItem();
  pkf.current = {
    mode: cur.mode,
    sectionId: cur.sectionId,
    cursor: 0,
    view: 0,
    phase: 'play',
    order: missed,
    items,
    parent: 'review'
  };
  return put(state, pkf);
}

/** PRACTICE SKIPPED TABLE STEPS: replay the steps skipped in this run (saves no section/exam result). */
export function reviewSkipped(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  const ids = cur?.phase === 'results' ? (cur.summary?.skipped || []) : skippedIds(pkf);
  if (!ids.length) return state;
  const items = {};
  for (const id of ids) items[id] = emptyItem();
  pkf.current = { mode: cur?.mode === 'exam' ? 'exam' : 'section', sectionId: cur?.sectionId || lessonById(ids[0])?.section, cursor: 0, view: 0, phase: 'play', order: [...ids], items, parent: 'review-skip', dev: !!cur?.dev };
  return put(state, pkf);
}

export function passedSectionCount(pkf) {
  return SECTIONS.filter((s) => !s.stub && sectionPassed(pkf, s.id)).length;
}

export function playableSectionCount() {
  return SECTIONS.filter((s) => !s.stub).length;
}

export function pkfProgressRows(state) {
  const pkf = pkfOf(state);
  const rows = [];
  const started = !!(pkf.current || Object.keys(pkf.sections).length);
  if (started) {
    const done = passedSectionCount(pkf);
    const total = playableSectionCount();
    rows.push({ id: 'pkfKick', name: COURSE_TITLE, href: '#pkfkick', short: 'PKF Kicking', done, total, finished: done >= total });
  }
  const examStarted = !!(pkf.exam?.attempts || pkf.exam?.passed || (pkf.current && pkf.current.mode === 'exam'));
  if (examStarted) {
    rows.push({ id: 'pkfKickExam', name: EXAM_TITLE, href: '#pkfkick/exam', short: 'PKF Kick Exam', done: pkf.exam.passed ? 1 : 0, total: 1, finished: !!pkf.exam.passed });
  }
  return rows;
}

export function pkfBannersHTML(state) {
  const open = examUnlocked(state || {});
  const n = playableSectionCount();
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfkick" data-pkfkick="course"><span class="simPromoText"><span class="eyebrow">COURSE</span><b>${esc(COURSE_TITLE)}</b><small>${n} sections. Learn PKF kicking systems from the book diagrams. Knowledge first, then shoot on your table.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfkick/exam" data-pkfkick="exam"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Knowledge + table execution. Pass at ${Math.round(EXAM_PASS * 100)}%.</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfkick="exam" data-pkfkick-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
  return course + exam;
}

export function lessonTypeCounts() {
  const bag = {};
  for (const l of LESSONS) {
    const k = l.incomplete ? 'INCOMPLETE' : (l.type || 'OTHER');
    bag[k] = (bag[k] || 0) + 1;
  }
  return bag;
}

export { figureHTML, assetOf, ASSET_MAP };

export function auditCourse() {
  const problems = [];
  for (const l of LESSONS) {
    if (!ASSET_MAP[l.id] && !l.incomplete) problems.push(`missing asset ${l.id}`);
    if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
    if (l.answer != null && l.choices && !l.choices.some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
  }
  for (const e of EXAM_ITEMS) {
    if (!ASSET_MAP[e.asset || e.id]) problems.push(`missing exam asset ${e.id}`);
  }
  if (problems.length) throw new Error(problems.join('; '));
  return { lessons: LESSONS.length, exam: EXAM_ITEMS.length, sections: SECTIONS.length, assets: Object.keys(ASSET_MAP).length };
}

auditCourse();
