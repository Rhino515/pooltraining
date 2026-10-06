/**
 * PKF Banking Systems Course — learning course on Drill Sets & Exams.
 * Source (only authority): PKF Pattern Play / Cue Ball Control, Chapter Eight, printed pages 241–244
 * (PDF 267–270). The banking material is embedded in the kicking chapter: path-number context (241–242),
 * the ten-ball "find the path" drill (242–243), Zero-X Banking (243), end-rail banks + speed and the
 * corner-pocket bank drill (top of 244). The Diamond one-rail kick system on the rest of 244 is not banking
 * and is not used here.
 * Storage key: state.pkfBankingSystems only. Original PKF JPEGs only — no redrawn diagrams, no invented numbers.
 */
import { ASSET_MAP, REGIONS, figureHTML, revealFigureHTML, assetOf } from './pkfBankAssets.js';
import { awardRecordedStep, markSkipped, clearSkipped } from './pkfTableStep.js';

export const COURSE_TITLE = 'PKF Banking Systems Course';
export const EXAM_TITLE = 'PKF Banking Systems Exam';
export const STORAGE_KEY = 'pkfBankingSystems';
export const HASH = 'pkfbank';
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;
export const SOURCE_PAGES = [241, 242, 243, 244];

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  UNDERSTAND: 'UNDERSTAND',
  IDENTIFY: 'IDENTIFY',
  CALCULATE: 'CALCULATE',
  AIM: 'CHOOSE AIM',
  SOLVE: 'SOLVE IT YOURSELF',
  SHOOT: 'NOW SHOOT IT'
};

export const SECTIONS = [
  { id: 'path-context', n: 1, title: 'Path Numbers Before the Bank', blurb: 'The path-number examples PKF gives right before the banking drill: the third-diamond adjustment.', pages: [241, 242], stub: false },
  { id: 'find-path-drill', n: 2, title: 'Find the Path Drill', blurb: 'Ten balls across the table: find each ball\'s path and bank it into the corner or side pocket.', pages: [242, 243], stub: false },
  { id: 'zero-x-banking', n: 3, title: 'Zero-X Banking', blurb: 'Find the object ball\'s path, put the cue ball on the same path, bank it into the pocket.', pages: [243], stub: false },
  { id: 'end-rail-speed', n: 4, title: 'End-Rail Banks & Speed', blurb: 'Balls near the end rail into the side pocket, and why speed changes the bank.', pages: [243, 244], stub: false },
  { id: 'corner-bank-drill', n: 5, title: 'Corner Pocket Bank Drill', blurb: 'Long-rail banks into the corners: send the object ball to the right number on the end rail.', pages: [244], stub: false },
  { id: 'path-numbering', n: 6, title: 'Bank Path Numbering', blurb: 'Needs source review: these pages use path numbers but do not explain how they are assigned.', pages: [], stub: true }
];

export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

const T = LTYPE;
const A = ASSIST;

/**
 * hint: shown before LOCK ANSWER on GUIDED lessons, behind SHOW HINT on ASSISTED, never on INDEPENDENT.
 * src: where the PKF solution is printed.
 */
export const LESSONS = [
  // ---------------------------------------------------------------- 1 · Path numbers before the bank (241–242)
  { id: 'ctx-intro', section: 'path-context', type: T.LEARN, assist: A.GUIDED, title: 'One slight number adjustment', src: 'Page 241 · Figures 8-151, 8-152',
    prompt: 'Read figures 8-151 and 8-152.',
    explain: 'PKF: as the cue ball starts to move down the table there is one slight number adjustment. In figure 8-151 the cue ball is on the 40-20 path and the object ball (the 4 ball) is near the third diamond (30). 40 − 30 = 10, and 10 / 2 gives the new target number, 5. That path should hit the 4 ball (figure 8-152).' },
  { id: 'ctx-value', section: 'path-context', type: T.LEARN, assist: A.GUIDED, title: 'The third diamond\'s value changes', src: 'Page 242 · Figure 8-157',
    prompt: 'Study figure 8-157: five cue balls on different paths.',
    explain: 'As the value of the path increases, so does the value of the third diamond on the end rail. On the 40-20 path or below: 30 (A). On or near 50-25: 35 (B). On or near 60-30: 40 (C). On or near 70-35: 45 (D). Near 80-40 or above: the value stays at 50 (E).' },
  { id: 'ctx-id-value', section: 'path-context', type: T.IDENTIFY, assist: A.GUIDED, title: 'Value on the 70-35 path', src: 'Page 242 · Figure 8-157',
    prompt: 'The cue ball is on or near the 70-35 path (D). What is the third diamond\'s value?',
    hint: 'PKF: 30 on the 40-20 path or below, rising as the path value rises, and it stays at 50 from 80-40 up.',
    explain: 'PKF: when the cue ball is on or near the 70-35 path the value of the third diamond is 45.',
    choices: [['45', '45'], ['40', '40'], ['50', '50'], ['35', '35']], answer: '45' },
  { id: 'ctx-calc-60', section: 'path-context', type: T.CALCULATE, assist: A.GUIDED, title: 'Hooked on the 6 ball', src: 'Page 241 · Figures 8-153, 8-154',
    prompt: 'Figure 8-153: hooked on the 6 ball next to the third diamond. The cue ball is on the 60-30 path, so the third diamond\'s value is 40. What is the new target number on the side rail?',
    hint: 'PKF method from page 241: path start number − third-diamond value, then divide by 2.',
    explain: 'PKF: when the cue ball is on the 60 path the third diamond\'s value increases to 40, so the new target number is 10 on the side rail (figure 8-154).',
    choices: [['10', '10'], ['20', '20'], ['15', '15'], ['30', '30']], answer: '10' },
  { id: 'ctx-calc-80', section: 'path-context', type: T.CALCULATE, assist: A.ASSISTED, title: 'The 80-40 path', src: 'Page 241 · Figure 8-155',
    prompt: 'Figure 8-155: the cue ball is on the 80-40 path, so the third diamond\'s value is 50. What is the target number?',
    hint: 'Path start − third-diamond value, then divide by 2.',
    explain: 'PKF: 80 − 50 = 30, and 30 / 2 gives 15.',
    choices: [['15', '15'], ['30', '30'], ['25', '25'], ['20', '20']], answer: '15' },
  { id: 'ctx-calc-100', section: 'path-context', type: T.CALCULATE, assist: A.ASSISTED, title: 'The 100-50 path', src: 'Page 241 · Figure 8-156',
    prompt: 'Figure 8-156: the cue ball is on the 100-50 path. What new target number does PKF use?',
    hint: 'From 80-40 up the third diamond stays at 50.',
    explain: 'PKF: 100 − 50 = 50, and 50 / 2 gives a new target number of 25, which sends the cue ball to the third diamond.',
    choices: [['25', '25'], ['50', '50'], ['30', '30'], ['20', '20']], answer: '25' },
  { id: 'ctx-solve-90', section: 'path-context', type: T.SOLVE, assist: A.INDEPENDENT, title: '8-Ball: the 90-45 path', src: 'Page 242 · Figure 8-158',
    prompt: 'Figure 8-158: 8-Ball, hooked on the 8 ball near the third diamond. The cue ball looks like it is on the 90-45 path. What is the target number?',
    explain: 'PKF: 90 − 50 = 40, and 40 / 2 = 20. This path should head toward the third diamond.',
    choices: [['20', '20'], ['45', '45'], ['40', '40'], ['25', '25']], answer: '20' },
  { id: 'ctx-solve-110', section: 'path-context', type: T.SOLVE, assist: A.INDEPENDENT, title: 'The 110-55 path', src: 'Page 242 · Figure 8-159',
    prompt: 'Figure 8-159: hooked on the 8 ball again. The cue ball is on the 110-55 path. What is the target number?',
    explain: 'PKF: 110 − 50 = 60, and 60 / 2 = 30. This new path should head toward the third diamond.',
    choices: [['30', '30'], ['55', '55'], ['60', '60'], ['35', '35']], answer: '30' },
  { id: 'ctx-why', section: 'path-context', type: T.LEARN, assist: A.ASSISTED, title: 'From cue-ball paths to banking', src: 'Page 242',
    prompt: 'Read the drill paragraph that follows these examples.',
    explain: 'The examples above are cue-ball paths. PKF follows them with a drill for finding the path a ball is on and banking it into the pocket. The banking examples on pages 242–244 aim the object ball at its path number; they do not mention the third-diamond adjustment.' },

  // ---------------------------------------------------------------- 2 · Find the Path drill (242–243)
  { id: 'fp-setup', section: 'find-path-drill', type: T.LEARN, assist: A.GUIDED, title: 'Ten balls across the table', src: 'Page 242',
    prompt: 'Read the drill and study the layout.',
    explain: 'Place ten balls in a straight line across the table. The goal of each shot is to find the path the ball is on toward the corner pocket or the side pocket. Once you find the path, bank it into the pocket. The first ball in this layout is on the 10-5 path. Work your way through to see how many you can bank into the corner or side pocket.' },
  { id: 'fp-cue', section: 'find-path-drill', type: T.LEARN, assist: A.GUIDED, title: 'Find the path with your cue stick', src: 'Page 242',
    prompt: 'See how PKF uses the cue stick on the 4 ball.',
    explain: 'Use your cue stick to find the path for each ball. PKF holds the cue stick over the 4 ball to find its path for the side pocket: it is on the 20-10 path. Shooting the 4 ball toward 10 should bank it into the side pocket.' },
  { id: 'fp-id-first', section: 'find-path-drill', type: T.IDENTIFY, assist: A.GUIDED, title: 'The first ball\'s path', src: 'Page 242',
    prompt: 'In this layout, which path is the first ball on?',
    hint: 'The dashed lines at the left end of the figure show the first ball\'s path.',
    explain: 'PKF: the first ball in this layout is on the 10-5 path.',
    choices: [['10-5', '10-5'], ['20-10', '20-10'], ['18-9', '18-9'], ['36-18', '36-18']], answer: '10-5' },
  { id: 'fp-id-4', section: 'find-path-drill', type: T.IDENTIFY, assist: A.ASSISTED, title: 'The 4 ball to the side pocket', src: 'Page 242',
    prompt: 'PKF holds the cue stick over the 4 ball\'s path to the side pocket. Which path is it?',
    hint: 'Follow the cue stick in the figure.',
    explain: 'PKF: "I can now see that it\'s on the 20-10 path."',
    choices: [['20-10', '20-10'], ['10-5', '10-5'], ['22-11', '22-11'], ['36-18', '36-18']], answer: '20-10' },
  { id: 'fp-aim-4', section: 'find-path-drill', type: T.AIM, assist: A.ASSISTED, title: 'Where to send the 4 ball', src: 'Page 242',
    prompt: 'The 4 ball is on the 20-10 path. Which number do you shoot the 4 ball toward to bank it into the side pocket?',
    hint: 'PKF shoots the ball toward a number on its path.',
    explain: 'PKF: "If I shoot the 4 ball toward 10 it should bank into the side pocket."',
    choices: [['10', '10'], ['20', '20'], ['5', '5'], ['0', '0']], answer: '10' },
  { id: 'fp-goal', section: 'find-path-drill', type: T.LEARN, assist: A.ASSISTED, title: 'How many should you make?', src: 'Page 243',
    prompt: 'Read the top of page 243.',
    explain: 'The first time you try this drill you may only make two or three of the shots, which is fine. When you get to the point where you are making over seven balls, it helps your kicking and also your bank shots.' },
  { id: 'fp-goal-q', section: 'find-path-drill', type: T.UNDERSTAND, assist: A.ASSISTED, title: 'The PKF goal for this drill', src: 'Page 243',
    prompt: 'When does PKF say this drill starts helping your kicking and your bank shots?',
    hint: 'Two or three on a first try is fine.',
    explain: 'PKF: when you can get to the point where you are making over seven balls.',
    choices: [['over-seven', 'When you make over seven balls'], ['all-ten', 'Only when you make all ten on the first try'], ['two-three', 'As soon as you make two or three'], ['five', 'When you make exactly five']], answer: 'over-seven' },
  { id: 'fp-paths', section: 'find-path-drill', type: T.LEARN, assist: A.GUIDED, title: 'Every ball is on several paths', src: 'Page 243 · Figure 8-161',
    prompt: 'Study figure 8-161: a ball in the middle of the table.',
    explain: 'Every ball is on a path; actually, several. A ball in the middle of the table is on six different paths. A: bottom right corner pocket, 54-27. B: bottom left corner pocket, 54-27. C: bottom left corner pocket, 27-13.5. D: top left corner pocket, 27-13.5. E: top right corner pocket, 27-13.5. F: bottom right corner pocket, 27-13.5. Once you start seeing these paths your one-rail kicks will dramatically improve.' },
  { id: 'fp-id-a', section: 'find-path-drill', type: T.IDENTIFY, assist: A.ASSISTED, title: 'Path A', src: 'Page 243 · Figure 8-161',
    prompt: 'Figure 8-161: path A goes to the bottom right corner pocket. Which path number is it?',
    hint: 'A and B are the long paths; C to F are the shorter ones.',
    explain: 'PKF: the A path goes to the bottom right corner pocket: 54-27.',
    choices: [['54-27', '54-27'], ['27-13.5', '27-13.5'], ['36-18', '36-18'], ['50-25', '50-25']], answer: '54-27' },
  { id: 'fp-id-d', section: 'find-path-drill', type: T.IDENTIFY, assist: A.INDEPENDENT, title: 'Path D', src: 'Page 243 · Figure 8-161',
    prompt: 'Figure 8-161: where does path D go, and what is its number?',
    explain: 'PKF: the D path goes to the top left corner pocket, 27-13.5.',
    choices: [['tl-27', 'Top left corner · 27-13.5'], ['br-54', 'Bottom right corner · 54-27'], ['tr-27', 'Top right corner · 27-13.5'], ['bl-54', 'Bottom left corner · 54-27']], answer: 'tl-27' },
  { id: 'fp-shoot', section: 'find-path-drill', type: T.SHOOT, assist: A.INDEPENDENT, title: 'Shoot the ten-ball path drill', src: 'Page 242–243', shoot: true,
    prompt: 'Place ten balls in a straight line across the table as in the PKF figure. For each ball, use your cue stick to find its path toward a corner or side pocket, then bank it in. Mark MAKE if you banked more than seven, MISS if not.',
    explain: 'PKF: the first time you may only make two or three, which is fine. Making over seven helps your kicking and your bank shots.' },

  // ---------------------------------------------------------------- 3 · Zero-X Banking (243)
  { id: 'zx-intro', section: 'zero-x-banking', type: T.LEARN, assist: A.GUIDED, title: 'Zero-X Banking', src: 'Page 243',
    prompt: 'Read how PKF banks balls with this system of finding paths.',
    explain: 'In the video "Zero-X Banking", PKF shows how to bank balls using this system of finding paths. In this drill five balls are set up along the table. Find the path each object ball is on. Once you find it, place the cue ball on the same path and bank the ball into the pocket.' },
  { id: 'zx-5', section: 'zero-x-banking', type: T.LEARN, assist: A.GUIDED, title: 'The 5 ball on the 18-9 path', src: 'Page 243',
    prompt: 'Follow the 5 ball example.',
    explain: 'PKF found the path for the 5 ball: 18-9. Place the cue ball on this path and bank the 5 ball toward 9 on the side rail. Use a soft to medium speed. If the rails are playing short, aim the 5 ball toward 8 instead of 9.' },
  { id: 'zx-steps', section: 'zero-x-banking', type: T.UNDERSTAND, assist: A.GUIDED, title: 'After you find the path', src: 'Page 243',
    prompt: 'In Zero-X Banking, what do you do once you have found the path the object ball is on?',
    hint: 'The cue ball and the object ball share something.',
    explain: 'PKF: once you find this path, place the cue ball on the same path and bank the ball into the pocket.',
    choices: [['same-path', 'Place the cue ball on the same path and bank the ball into the pocket'], ['adjust', 'Apply the third-diamond adjustment to the path'], ['kick', 'Kick the cue ball off one rail into the object ball'], ['center', 'Aim the object ball at the center diamond']], answer: 'same-path' },
  { id: 'zx-aim-5', section: 'zero-x-banking', type: T.AIM, assist: A.GUIDED, title: 'Where to send the 5 ball', src: 'Page 243',
    prompt: 'The 5 ball is on the 18-9 path and the rails are playing normally. Which number on the side rail do you bank it toward?',
    hint: 'Same idea as the 4 ball on the 20-10 path, shot toward 10.',
    explain: 'PKF: place the cue ball on this path and bank the 5 ball toward 9 on the side rail.',
    choices: [['9', '9'], ['18', '18'], ['11', '11'], ['5', '5']], answer: '9' },
  { id: 'zx-speed', section: 'zero-x-banking', type: T.UNDERSTAND, assist: A.ASSISTED, title: 'Bank speed', src: 'Page 243',
    prompt: 'What speed does PKF want when banking the 5 ball?',
    hint: 'PKF names a speed range in the 5 ball paragraph.',
    explain: 'PKF: "When I bank this ball I want to make sure I use a soft to medium speed."',
    choices: [['soft-med', 'Soft to medium speed'], ['hard', 'Hard speed'], ['any', 'Any speed; it does not matter'], ['firm-spin', 'Firm, with sidespin']], answer: 'soft-med' },
  { id: 'zx-short', section: 'zero-x-banking', type: T.CALCULATE, assist: A.ASSISTED, title: 'Rails playing short', src: 'Page 243',
    prompt: 'You are on a table where the rails are playing short. The 5 ball is on the 18-9 path. Where does PKF aim it?',
    hint: 'PKF moves the aim one number.',
    explain: 'PKF: "If I\'m playing on a table where the rails are playing short, I\'ll aim the 5 ball toward 8 instead of 9."',
    choices: [['8', '8'], ['9', '9'], ['10', '10'], ['18', '18']], answer: '8' },
  { id: 'zx-4', section: 'zero-x-banking', type: T.SOLVE, assist: A.INDEPENDENT, title: 'The 4 ball to the side pocket', src: 'Page 243',
    prompt: 'Same layout: the 4 ball looks like it is on the 22-11 path to the side pocket. With the cue ball on that path, which number do you shoot the 4 ball toward?',
    explain: 'PKF: "I\'ll place the cue ball on this path and shoot the 4 ball toward 11 on the side rail banking it into the side pocket."',
    choices: [['11', '11'], ['22', '22'], ['10', '10'], ['9', '9']], answer: '11' },
  { id: 'zx-shoot-5', section: 'zero-x-banking', type: T.SHOOT, assist: A.INDEPENDENT, title: 'Shoot the 5 ball bank', src: 'Page 243', shoot: true,
    prompt: 'Set up the 5 ball as in the PKF figure. Place the cue ball on its 18-9 path and bank the 5 ball toward 9 on the side rail (8 if your rails play short) at soft to medium speed.',
    explain: 'Mark MAKE if the bank goes in, MISS if not.' },
  { id: 'zx-shoot-4', section: 'zero-x-banking', type: T.SHOOT, assist: A.INDEPENDENT, title: 'Shoot the 4 ball into the side', src: 'Page 243', shoot: true,
    prompt: 'Set up the 4 ball as in the PKF figure. Place the cue ball on its 22-11 path and shoot the 4 ball toward 11 on the side rail, banking it into the side pocket.',
    explain: 'Mark MAKE if the bank goes in, MISS if not. PKF: when you set up this drill, put the balls in various locations around the table.' },

  // ---------------------------------------------------------------- 4 · End-rail banks & speed (243–244)
  { id: 'er-10', section: 'end-rail-speed', type: T.LEARN, assist: A.GUIDED, title: 'Balls near the end rail', src: 'Page 243–244',
    prompt: 'Read the end-rail example.',
    explain: 'When you set up this drill, put the balls in various locations around the table. PKF places balls near the end rail, finds the path for each ball and banks them into the side pocket. The 10 ball looks like it is on the 50-25 path: place the cue ball on this path and shoot the 10 ball toward 25 on the side rail. On a table that is playing short, shoot the 10 ball toward 24 or 23.' },
  { id: 'er-speed', section: 'end-rail-speed', type: T.LEARN, assist: A.GUIDED, title: 'Speed sensitive', src: 'Page 244',
    prompt: 'Read the top of page 244.',
    explain: 'When banking off the end rail it is very speed sensitive; shooting too hard will really shorten the bank. Practice these banks at a soft speed first until you are consistently pocketing the balls. Then try banking them at a harder speed and adjust your number slightly on the side rail.' },
  { id: 'er-id', section: 'end-rail-speed', type: T.IDENTIFY, assist: A.GUIDED, title: 'The 10 ball\'s path', src: 'Page 243',
    prompt: 'Balls near the end rail. Which path does PKF say the 10 ball is on?',
    hint: 'Follow the line from the end rail through the 10 ball to the side rail.',
    explain: 'PKF: "It looks like the 10 ball is on the 50-25 path."',
    choices: [['50-25', '50-25'], ['36-18', '36-18'], ['22-11', '22-11'], ['18-9', '18-9']], answer: '50-25' },
  { id: 'er-aim', section: 'end-rail-speed', type: T.AIM, assist: A.ASSISTED, title: 'Where to send the 10 ball', src: 'Page 243',
    prompt: 'The 10 ball is on the 50-25 path and the table plays normally. Which number on the side rail do you shoot it toward?',
    hint: 'Same idea as 18-9 toward 9 and 22-11 toward 11.',
    explain: 'PKF: "I\'ll place the cue ball on this path and shoot the 10 ball toward 25 on the side rail."',
    choices: [['25', '25'], ['50', '50'], ['20', '20'], ['30', '30']], answer: '25' },
  { id: 'er-short', section: 'end-rail-speed', type: T.CALCULATE, assist: A.ASSISTED, title: 'Table playing short', src: 'Page 243–244',
    prompt: 'The table is playing short. Where does PKF shoot the 10 ball instead of 25?',
    hint: 'On a short table PKF aims a little lower than the path number.',
    explain: 'PKF: "If I\'m on a table that\'s playing short I\'ll shoot the 10 ball toward 24 or 23."',
    choices: [['24-23', '24 or 23'], ['26-27', '26 or 27'], ['25', '25 exactly'], ['50', '50']], answer: '24-23' },
  { id: 'er-hard', section: 'end-rail-speed', type: T.UNDERSTAND, assist: A.ASSISTED, title: 'Shooting too hard', src: 'Page 244',
    prompt: 'What does shooting too hard do to a bank off the end rail?',
    hint: 'PKF calls these banks very speed sensitive.',
    explain: 'PKF: "When banking off the end rail it\'s very speed sensitive; shooting too hard will really shorten the bank."',
    choices: [['shorten', 'It really shortens the bank'], ['lengthen', 'It lengthens the bank'], ['nothing', 'Nothing; speed does not matter'], ['cue-only', 'It only changes where the cue ball stops']], answer: 'shorten' },
  { id: 'er-order', section: 'end-rail-speed', type: T.SOLVE, assist: A.INDEPENDENT, title: 'How to practice them', src: 'Page 244',
    prompt: 'You are practicing these end-rail banks. What order does PKF give?',
    explain: 'PKF: practice these banks at a soft speed first until you are consistently pocketing the balls, then try banking them at a harder speed and adjust your number slightly on the side rail.',
    choices: [['soft-then-hard', 'Soft speed until consistent, then harder speed with the number adjusted slightly'], ['hard-then-soft', 'Hard speed first, then soft'], ['soft-only', 'Soft speed only, never harder'], ['hard-same', 'Harder speed with the same number']], answer: 'soft-then-hard' },
  { id: 'er-shoot-soft', section: 'end-rail-speed', type: T.SHOOT, assist: A.INDEPENDENT, title: 'End-rail banks at soft speed', src: 'Page 243–244', shoot: true,
    prompt: 'Place balls near the end rail as in the PKF figure. Find the path for each ball, put the cue ball on that path and bank it into the side pocket at a SOFT speed.',
    explain: 'Mark MAKE if the bank goes in, MISS if not. PKF: stay at soft speed until you are consistently pocketing the balls.' },
  { id: 'er-shoot-hard', section: 'end-rail-speed', type: T.SHOOT, assist: A.INDEPENDENT, title: 'Now a harder speed', src: 'Page 244', shoot: true,
    prompt: 'Bank the same balls at a harder speed and adjust your number slightly on the side rail.',
    explain: 'Mark MAKE if the bank goes in, MISS if not. PKF: shooting too hard will really shorten the bank.' },

  // ---------------------------------------------------------------- 5 · Corner-pocket bank drill (top of 244)
  { id: 'cb-drill', section: 'corner-bank-drill', type: T.LEARN, assist: A.GUIDED, title: 'Banks into the corner pockets', src: 'Page 244',
    prompt: 'Read the corner-pocket drill.',
    explain: 'PKF lines up a few balls to bank them into the corner pockets and finds the path for each ball. The 4 ball is on the 36-18 path: place the cue ball on this path and shoot it toward 18, banking it into the corner pocket.' },
  { id: 'cb-focus', section: 'corner-bank-drill', type: T.LEARN, assist: A.GUIDED, title: 'Focus on the end-rail number', src: 'Page 244',
    prompt: 'Read PKF\'s key for long-rail banks.',
    explain: 'When practicing long rail banks, really focus on sending the object ball toward the correct number on the end rail.' },
  { id: 'cb-id', section: 'corner-bank-drill', type: T.IDENTIFY, assist: A.ASSISTED, title: 'The 4 ball\'s path', src: 'Page 244',
    prompt: 'Which path does PKF say the 4 ball is on?',
    hint: 'Follow the line through the 4 ball to the end rail.',
    explain: 'PKF: "The 4 ball is on the 36-18 path."',
    choices: [['36-18', '36-18'], ['50-25', '50-25'], ['18-9', '18-9'], ['54-27', '54-27']], answer: '36-18' },
  { id: 'cb-aim', section: 'corner-bank-drill', type: T.AIM, assist: A.ASSISTED, title: 'Where to send the 4 ball', src: 'Page 244',
    prompt: 'The 4 ball is on the 36-18 path. Which number do you shoot it toward to bank it into the corner pocket?',
    hint: 'Same idea as every bank in this course.',
    explain: 'PKF: "I\'ll place the cue ball on this path and shoot it toward 18, banking it into the corner pocket."',
    choices: [['18', '18'], ['36', '36'], ['9', '9'], ['20', '20']], answer: '18' },
  { id: 'cb-where', section: 'corner-bank-drill', type: T.UNDERSTAND, assist: A.INDEPENDENT, title: 'Where the number is', src: 'Page 244',
    prompt: 'On long rail banks, where is the number PKF tells you to focus on?',
    explain: 'PKF: really focus on sending the object ball toward the correct number on the end rail.',
    choices: [['end-rail', 'On the end rail'], ['side-pocket', 'On the long rail next to the side pocket'], ['object', 'On the object ball itself'], ['corner', 'On the corner pocket point']], answer: 'end-rail' },
  { id: 'cb-shoot', section: 'corner-bank-drill', type: T.SHOOT, assist: A.INDEPENDENT, title: 'Shoot the corner-pocket banks', src: 'Page 244', shoot: true,
    prompt: 'Line up a few balls as in the PKF figure. Find each ball\'s path, place the cue ball on it and bank the ball into the corner pocket. Focus on the number on the end rail.',
    explain: 'Mark MAKE if the bank goes in, MISS if not.' },

  // ---------------------------------------------------------------- 6 · stub
  { id: 'pn-stub', section: 'path-numbering', type: T.LEARN, assist: A.GUIDED, title: 'Needs source review', src: 'Pages 241–244', incomplete: true,
    prompt: 'FLAG FOR SOURCE REVIEW',
    explain: 'Pages 241–244 name bank paths by number (10-5, 20-10, 18-9, 22-11, 50-25, 36-18, 54-27, 27-13.5) but do not explain how those rail numbers are assigned or where each count starts. That is not in these pages, so it is not taught here.' }
].map((l) => ({ choices: null, answer: null, incomplete: false, shoot: false, hint: '', ...l }));

export const EXAM_ITEMS = [
  { id: 'ex-k1', type: T.CALCULATE, title: 'Third-diamond adjustment', src: 'Page 241 · Figure 8-155', prompt: 'The cue ball is on the 80-40 path and the third diamond\'s value is 50. What is the target number?', explain: 'PKF: 80 − 50 = 30, and 30 / 2 gives 15.', choices: [['15', '15'], ['30', '30'], ['25', '25'], ['40', '40']], answer: '15' },
  { id: 'ex-k2', type: T.IDENTIFY, title: 'Third-diamond value', src: 'Page 242 · Figure 8-157', prompt: 'The cue ball is on or near the 50-25 path (B). What is the third diamond\'s value?', explain: 'PKF: on or near the 50-25 path the third diamond\'s value is 35.', choices: [['35', '35'], ['30', '30'], ['40', '40'], ['25', '25']], answer: '35' },
  { id: 'ex-k3', type: T.IDENTIFY, title: 'Find the Path drill', src: 'Page 242', prompt: 'In the ten-ball drill, which path is the 4 ball on for the side pocket?', explain: 'PKF: the 4 ball is on the 20-10 path; shot toward 10 it should bank into the side pocket.', choices: [['20-10', '20-10'], ['10-5', '10-5'], ['22-11', '22-11'], ['18-9', '18-9']], answer: '20-10' },
  { id: 'ex-k4', type: T.UNDERSTAND, title: 'Zero-X Banking', src: 'Page 243', prompt: 'Zero-X Banking: after you find the path the object ball is on, where does the cue ball go?', explain: 'PKF: place the cue ball on the same path and bank the ball into the pocket.', choices: [['same', 'On the same path'], ['third', 'On the third diamond'], ['center', 'In the center of the table'], ['rail', 'Frozen to the nearest rail']], answer: 'same' },
  { id: 'ex-k5', type: T.CALCULATE, title: 'Rails playing short', src: 'Page 243', prompt: 'The rails are playing short. The 5 ball is on the 18-9 path. Where does PKF aim it?', explain: 'PKF: toward 8 instead of 9.', choices: [['8', '8'], ['9', '9'], ['10', '10'], ['18', '18']], answer: '8' },
  { id: 'ex-k6', type: T.AIM, title: 'End-rail bank aim', src: 'Page 243', prompt: 'The 10 ball is on the 50-25 path and the table plays normally. Shoot it toward which number on the side rail?', explain: 'PKF: shoot the 10 ball toward 25 on the side rail.', choices: [['25', '25'], ['50', '50'], ['24', '24'], ['20', '20']], answer: '25' },
  { id: 'ex-k7', type: T.UNDERSTAND, title: 'End-rail speed', src: 'Page 244', prompt: 'What does shooting too hard do when banking off the end rail?', explain: 'PKF: it is very speed sensitive; shooting too hard will really shorten the bank.', choices: [['shorten', 'Really shortens the bank'], ['lengthen', 'Lengthens the bank'], ['nothing', 'Nothing'], ['jump', 'Makes the bank go straight in']], answer: 'shorten' },
  { id: 'ex-k8', type: T.AIM, title: 'Corner-pocket bank', src: 'Page 244', prompt: 'The 4 ball is on the 36-18 path. Which number do you shoot it toward to bank it into the corner pocket?', explain: 'PKF: shoot it toward 18, banking it into the corner pocket.', choices: [['18', '18'], ['36', '36'], ['9', '9'], ['27', '27']], answer: '18' },
  { id: 'ex-k9', type: T.IDENTIFY, title: 'Several paths', src: 'Page 243 · Figure 8-161', prompt: 'Figure 8-161: path B goes to the bottom left corner pocket. Which path number is it?', explain: 'PKF: the B path goes to the bottom left corner pocket, 54-27.', choices: [['54-27', '54-27'], ['27-13.5', '27-13.5'], ['36-18', '36-18'], ['50-25', '50-25']], answer: '54-27' },
  { id: 'ex-x1', type: T.SHOOT, title: 'Shoot a Zero-X side-pocket bank', src: 'Page 243', prompt: 'Set up the 4 ball as in the PKF figure. Place the cue ball on its 22-11 path and shoot the 4 ball toward 11, banking it into the side pocket.', explain: 'Physical execution: mark MAKE or MISS.', shoot: true },
  { id: 'ex-x2', type: T.SHOOT, title: 'Shoot a corner-pocket bank', src: 'Page 244', prompt: 'Set up the 4 ball as in the PKF corner-pocket drill. Place the cue ball on its 36-18 path and shoot it toward 18 on the end rail, banking it into the corner pocket.', explain: 'Physical execution: mark MAKE or MISS.', shoot: true }
].map((l) => ({ choices: null, answer: null, shoot: false, assist: ASSIST.INDEPENDENT, hint: '', ...l }));

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

export function bankOf(state) {
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

function put(state, bank) { return { ...state, [STORAGE_KEY]: bank }; }

export function sectionRecord(bank, id) { return bank.sections?.[id] || null; }
export function sectionPassed(bank, id) { const r = sectionRecord(bank, id); return !!(r && r.passed); }

/** Sequential unlock (stubs never block). Dev Mode bypass is handled by the screen via devBypass(). */
export function sectionUnlocked(state, sectionId, { dev = false } = {}) {
  if (dev) return true;
  const bank = bankOf(state);
  const idx = SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return false;
  for (let i = 0; i < idx; i++) {
    const s = SECTIONS[i];
    if (s.stub) continue;
    if (!sectionPassed(bank, s.id)) return false;
  }
  return true;
}

export function examUnlocked(state, { dev = false } = {}) {
  if (dev) return true;
  const bank = bankOf(state);
  return SECTIONS.filter((s) => !s.stub).every((s) => sectionPassed(bank, s.id));
}

export function knowledgeLessons(sectionId) {
  return lessonsFor(sectionId).filter((l) => !l.shoot && !l.incomplete && l.answer != null);
}

function emptyItem() {
  return { locked: false, choice: null, correct: null, revealed: false, execution: null, skipped: false, done: false, hint: false };
}

function freshRun(ids, extra) {
  const items = {};
  for (const id of ids) items[id] = emptyItem();
  return { cursor: 0, view: 0, phase: 'play', order: [...ids], items, ...extra };
}

export function startSection(state, sectionId) {
  if (!sectionUnlocked(state, sectionId)) return state;
  const bank = bankOf(state);
  const cur = bank.current;
  if (cur && !cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  bank.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId });
  return put(state, bank);
}

export function startExam(state) {
  if (!examUnlocked(state)) return state;
  const bank = bankOf(state);
  const cur = bank.current;
  if (cur && !cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  bank.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam' });
  return put(state, bank);
}

/** DEV PREVIEW: open a locked section. Results are not saved. */
export function previewSection(state, sectionId, restart = false) {
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  const bank = bankOf(state);
  const cur = bank.current;
  if (!restart && cur && cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  bank.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId, dev: true, parent: 'section' });
  return put(state, bank);
}

/** DEV PREVIEW: open the locked exam. Results are not saved. */
export function previewExam(state, restart = false) {
  const bank = bankOf(state);
  const cur = bank.current;
  if (!restart && cur && cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  bank.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam', dev: true, parent: 'exam' });
  return put(state, bank);
}

function liveItem(bank) {
  const cur = bank.current;
  if (!cur || cur.phase !== 'play') return null;
  const id = cur.order[cur.cursor];
  return { cur, id, lesson: lessonById(id), it: cur.items[id] };
}

export function selectChoice(state, choice) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.locked || x.it.done) return state;
  if (!x.lesson?.choices?.some((c) => c[0] === String(choice))) return state;
  x.it.choice = String(choice);
  return put(state, bank);
}

/** ASSISTED lessons: reveal the hint on request (never the answer). */
export function showHint(state) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.locked || !x.lesson?.hint) return state;
  x.it.hint = true;
  return put(state, bank);
}

/** LOCK ANSWER: grade the choice; only now is the PKF solution revealed. */
export function lockAnswer(state) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.locked || x.it.done) return state;
  const { cur, lesson, it } = x;
  if (lesson?.answer == null) return state;
  if (it.choice == null || it.choice === '') return state;
  it.locked = true;
  it.correct = String(it.choice) === String(lesson.answer);
  it.revealed = true;
  if (!cur.dev) {
    if (it.correct) bank.stats.knowledgeCorrect += 1;
    else bank.stats.knowledgeWrong += 1;
  }
  if (!lesson.shoot) it.done = true;
  return put(state, bank);
}

/** NOW SHOOT IT: the player reports MAKE or MISS (the app does not hit balls). */
export function markExecution(state, result) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.done) return state;
  const { cur, id, lesson, it } = x;
  if (!lesson?.shoot) return state;
  if (lesson.answer != null && !it.locked) return state;
  const ok = result === 'make' || result === 'success';
  it.execution = ok ? 'make' : 'miss';
  it.revealed = true;
  it.done = true;
  if (cur.dev) return put(state, bank);
  if (ok) bank.stats.executionMake += 1;
  else bank.stats.executionMiss += 1;
  bank.skipped = clearSkipped(bank.skipped, id);
  // Recorded table step → Drill XP (same per-drill session formula; a miss earns what a failed drill earns).
  const r = awardRecordedStep(put(state, bank), STORAGE_KEY, COURSE_TITLE, lesson, { ratio: ok ? 1 : 0, passed: ok });
  it.xp = r.drill;
  return r.state;
}

/** SKIP TABLE STEP: not attempted. 0 Drill XP, never a make, never blocks the lesson. */
export function skipTableStep(state) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.done) return state;
  const { cur, id, lesson, it } = x;
  if (!lesson?.shoot) return state;
  if (lesson.answer != null && !it.locked) return state;
  it.skipped = true;
  it.execution = null;
  it.revealed = true;
  it.done = true;
  if (!cur.dev) {
    bank.stats.tableSkipped += 1;
    bank.skipped = markSkipped(bank.skipped, id);
  }
  return put(state, bank);
}

/** Persistent list of skipped table steps (come back later). */
export function skippedIds(bank) { return Object.keys(bank.skipped || {}).filter((id) => lessonById(id)?.shoot); }

export function acknowledgeLearn(state) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it || x.it.done) return state;
  if (x.lesson?.answer != null || x.lesson?.shoot) return state;
  x.it.locked = true;
  x.it.revealed = true;
  x.it.done = true;
  return put(state, bank);
}

export function nextLesson(state) {
  const bank = bankOf(state);
  const x = liveItem(bank);
  if (!x || !x.it?.done) return state;
  const cur = x.cur;
  if (cur.cursor >= cur.order.length - 1) return finishRun(state);
  cur.cursor += 1;
  cur.view = cur.cursor;
  return put(state, bank);
}

export function viewLesson(state, i) {
  const bank = bankOf(state);
  const cur = bank.current;
  if (!cur) return state;
  cur.view = Math.max(0, Math.min(cur.cursor, Number(i) || 0));
  return put(state, bank);
}

function finishRun(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  if (!cur) return state;
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0;
  const missed = [];
  const skipped = [];
  const weak = { ...(bank.exam.weak || {}) };
  for (const id of cur.order) {
    const lesson = lessonById(id);
    const it = cur.items[id];
    if (!lesson || !it) continue;
    if (lesson.answer != null) {
      kTot += 1;
      if (it.correct) kOk += 1;
      else {
        missed.push(id);
        if (cur.mode === 'exam') weak[lesson.title || id] = (weak[lesson.title || id] || 0) + 1;
      }
    }
    if (lesson.shoot && it.skipped) skipped.push(id);
    if (lesson.shoot && it.execution) {
      xTot += 1;
      if (it.execution === 'make') xOk += 1;
    }
  }
  const kRate = kTot ? kOk / kTot : 1;
  const xRate = xTot ? xOk / xTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  const review = cur.parent === 'review' || cur.parent === 'review-skip';
  const sectionPass = kTot ? kRate >= KNOWLEDGE_PASS : true;
  const examPass = overall >= EXAM_PASS;
  cur.phase = 'results';
  cur.summary = { kOk, kTot, xOk, xTot, kRate, xRate, overall, missed, skipped, review, passed: review ? kOk === kTot : (cur.mode === 'section' ? sectionPass : examPass) };
  // DEV PREVIEW, REVIEW MISSED CONCEPTS and PRACTICE SKIPPED TABLE STEPS runs never write section/exam progress.
  if (cur.dev || review) return put(state, bank);
  if (cur.mode === 'section') {
    const prev = bank.sections[cur.sectionId] || { knowledgeCorrect: 0, knowledgeTotal: 0, executionMake: 0, executionMiss: 0, passed: false, bestKnowledge: 0, attempts: 0, missed: [] };
    prev.attempts = (prev.attempts || 0) + 1;
    prev.knowledgeCorrect = kOk;
    prev.knowledgeTotal = kTot;
    prev.executionMake = (prev.executionMake || 0) + xOk;
    prev.executionMiss = (prev.executionMiss || 0) + (xTot - xOk);
    prev.bestKnowledge = Math.max(prev.bestKnowledge || 0, kRate);
    prev.missed = missed;
    prev.skipped = skipped;
    if (sectionPass) prev.passed = true;
    bank.sections[cur.sectionId] = prev;
  } else {
    bank.exam.attempts += 1;
    bank.exam.bestKnowledge = Math.max(bank.exam.bestKnowledge || 0, kRate);
    bank.exam.bestExecution = Math.max(bank.exam.bestExecution || 0, xRate);
    bank.exam.bestOverall = Math.max(bank.exam.bestOverall || 0, overall);
    if (examPass) bank.exam.passed = true;
    bank.exam.weak = weak;
    bank.exam.history = [...(bank.exam.history || []), {
      at: new Date().toISOString(),
      knowledge: Math.round(kRate * 100),
      execution: xTot ? Math.round(xRate * 100) : null,
      skipped: skipped.length,
      overall: Math.round(overall * 100),
      passed: examPass
    }].slice(-20);
  }
  return put(state, bank);
}

export function retryCurrent(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  if (!cur) return state;
  if (cur.dev) {
    if (cur.mode === 'exam' || cur.parent === 'exam') return previewExam(state, true);
    return previewSection(state, cur.sectionId, true);
  }
  // clear the finished run so start* builds a fresh one
  bank.current = null;
  const cleared = put(state, bank);
  if (cur.mode === 'exam') return startExam(cleared);
  return startSection(cleared, cur.sectionId);
}

/** REVIEW MISSED CONCEPTS: replay only the missed questions (practice; saves nothing). */
export function reviewMissed(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  if (!cur?.summary?.missed?.length) return state;
  bank.current = freshRun(cur.summary.missed, { mode: cur.mode, sectionId: cur.sectionId, parent: 'review', dev: !!cur.dev });
  return put(state, bank);
}

/** PRACTICE SKIPPED TABLE STEPS: replay the steps skipped in this run (saves no section/exam result). */
export function reviewSkipped(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  const ids = cur?.phase === 'results' ? (cur.summary?.skipped || []) : skippedIds(bank);
  if (!ids.length) return state;
  bank.current = freshRun(ids, { mode: cur?.mode === 'exam' ? 'exam' : 'section', sectionId: cur?.sectionId || lessonById(ids[0])?.section, parent: 'review-skip', dev: !!cur?.dev });
  return put(state, bank);
}

export function passedSectionCount(bank) { return SECTIONS.filter((s) => !s.stub && sectionPassed(bank, s.id)).length; }
export function playableSectionCount() { return SECTIONS.filter((s) => !s.stub).length; }

export function pkfBankProgressRows(state) {
  const bank = bankOf(state);
  const rows = [];
  const started = !!((bank.current && !bank.current.dev) || Object.keys(bank.sections).length);
  if (started) {
    const done = passedSectionCount(bank);
    const total = playableSectionCount();
    rows.push({ id: 'pkfBank', name: COURSE_TITLE, href: '#pkfbank', short: 'PKF Banking', done, total, finished: done >= total });
  }
  const examStarted = !!(bank.exam?.attempts || bank.exam?.passed || (bank.current && !bank.current.dev && bank.current.mode === 'exam'));
  if (examStarted) {
    rows.push({ id: 'pkfBankExam', name: EXAM_TITLE, href: '#pkfbank/exam', short: 'PKF Bank Exam', done: bank.exam.passed ? 1 : 0, total: 1, finished: !!bank.exam.passed });
  }
  return rows;
}

export function pkfBankBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const n = playableSectionCount();
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfbank" data-pkfbank="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${n} sections from the PKF banking pages. Find the path, lock your answer, see the PKF page, then bank it on your table.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfbank/exam" data-pkfbank="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Knowledge + table execution. Pass at ${Math.round(EXAM_PASS * 100)}%.${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfbank="exam" data-pkfbank-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
  return course + exam;
}

/** Counts by lesson type (stubs counted as INCOMPLETE). */
export function lessonTypeCounts() {
  const bag = {};
  for (const l of LESSONS) {
    const k = l.incomplete ? 'INCOMPLETE' : (l.type || 'OTHER');
    bag[k] = (bag[k] || 0) + 1;
  }
  return bag;
}

export function assistCounts() {
  const bag = {};
  for (const l of LESSONS) if (!l.incomplete) bag[l.assist] = (bag[l.assist] || 0) + 1;
  return bag;
}

export { figureHTML, revealFigureHTML, assetOf, ASSET_MAP, REGIONS };

export function auditCourse() {
  const problems = [];
  const ids = new Set();
  for (const l of [...LESSONS, ...EXAM_ITEMS]) {
    if (ids.has(l.id)) problems.push(`duplicate id ${l.id}`);
    ids.add(l.id);
    if (!ASSET_MAP[l.id] || !assetOf(l.id)) problems.push(`missing asset ${l.id}`);
    if (!l.src) problems.push(`missing source citation ${l.id}`);
    if (l.answer != null && !(l.choices || []).some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
    if (l.answer != null && !assetOf(l.id)?.reveal) problems.push(`question without a PKF reveal region ${l.id}`);
    if (l.choices && new Set(l.choices.map((c) => c[0])).size !== l.choices.length) problems.push(`duplicate choice ${l.id}`);
    if (l.shoot && l.answer != null) problems.push(`shoot item with a graded answer ${l.id}`);
  }
  for (const l of LESSONS) if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
  for (const s of SECTIONS) if (!lessonsFor(s.id).length) problems.push(`empty section ${s.id}`);
  for (const r of Object.values(REGIONS)) {
    if (!SOURCE_PAGES.includes(r.page)) problems.push(`region outside 241–244 (${r.page})`);
    const c = r.crop;
    if (c.x < 0 || c.y < 0 || c.x + c.w > 1.0001 || c.y + c.h > 1.0001) problems.push(`crop out of bounds p${r.page}`);
    if (r.page === 244 && c.y + c.h > 0.3481) problems.push('page 244 region reaches the Diamond one-rail kicking section');
  }
  if (problems.length) throw new Error(problems.join('; '));
  return { lessons: LESSONS.length, exam: EXAM_ITEMS.length, sections: SECTIONS.length, assets: Object.keys(ASSET_MAP).length };
}

auditCourse();
