/**
 * 9 Ball Pool – Practice made Perfect (Kindle book). Andrew's page screenshots.
 * Each drill's words are the page's words, 1:1: spelling, punctuation and the author's own typos kept.
 * Words split by the page's line-end hyphenation are joined. Paragraph breaks are kept.
 * Each diagram is that page's own table, cropped from the screenshot (images/book9/*.webp). Nothing redrawn.
 * Scoring is the book's own: 147 Academy drills (3 attempts, best score, Bronze/Silver/Gold balls),
 * Five Ball Runs (5 attempts, a point a ball, max 25), cushion drills (10 in a row / 10 pots then 5 of 10),
 * runs for the respot routine and the Newman 15 repeater, and a done record for the two safety-chapter drills.
 * Drill XP and Lifetime XP use the flat drill base. No Career Rank XP (same as the other book drill sets).
 */
import { challengeFromPkfDoc } from './pkfBuiltins.js';
import { validatePooliq } from './schema.js';

export const BOOK9_CREDIT = '9 Ball Pool – Practice made Perfect';
export const ROTATIONAL = 'Rotational Drills';

/** The 147 Academy scoring page, exactly as printed. Shown on each of the five 147 drills. */
export const BOOK9_147_TEXT = `The first five drills in this chapter feature a series of 9 ball drills originally published on the 147 Academy snooker site. Each drill is named after a present day pool great, from Archer to Souquet. The aim of each drill is however the same. Clear balls 1 to 9 in order, replace the balls in the pattern outlined and continue the break.

You have to limit yourself to 3 atempts for each routine. Record your best score for each drill. The first time I attempted  the Reyes Drill I scored the following:

Attempt 1: 8 points (I missed the 9 ball and thus break ended)
Attempt 2: 16 points (I completed 1 run, repositioned the balls and this time missed the 8 ball)
Attempt 3: 20 points (2 run outs, then a miss on the 3 ball)

So attempt 3 was my best score and I recorded that in my practice diary. I awared myself a silver star for this drill.

Bronze– 9 to 18 balls (1 to 2 run out)
Silver- 19 to 27 balls
Gold – 28 balls and above

Lets get started.`;

/** Book medals for the 147 drills: Bronze 9–18 balls, Silver 19–27, Gold 28 and above. */
export const BOOK9_147_TIERS = [['Gold', 28], ['Silver', 19], ['Bronze', 9]];

/* Book order. heading: the page's own heading ('' when the page prints none). part: app label only, for pages that share a heading. */
const PAGES = [
  {
    id: 'b9-reyes', heading: 'Reyes Drill', category: ROTATIONAL, kind: 'best3', img: 'reyes', is147: true, skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `A great routine to work on your potting and positional play and the first of 5 similar drills. Layout the balls as demostrated below, 1 to 9.

The trickiest shot to pull of in this routine for me is positioning from the 3 to the four ball. This is because the 4 ball will only pass into either middle pocket.

The table is laid out so each pot should easily follow the proceeding one. A range of shots are required including draw, stun and follow through. The use of sidespin or ‘english’ shouldn’t be needed for this drill. See what feels comfortable for you.

Video link: http://www.youtube.com/watch?v=L9DHsGEorow`
  },
  {
    id: 'b9-alcano', heading: 'Alcano Drill', category: ROTATIONAL, kind: 'best3', img: 'alcano', is147: true, skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `In this drill you will work on clearing balls 1 to 4 at the head of the table with some simple screw and stun shots.

From there accurate positional play is required to make the 5 ball while retaining position on the 6 ball, usually into the bottom left pocket. So give extra attention to this shot, getting the correct angle on number 5 ball is crucial to completing this drill.  The remaining balls after the 6 should be relatively simple.

Give yourself three attemps, and record the best for your diary.`
  },
  {
    id: 'b9-bustamante', heading: 'Bustamante Drill', category: ROTATIONAL, kind: 'best3', img: 'bustamante', is147: true, skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `Drill 3 of this mini series really stokes up the positional play and accuracy required to complete the run out. Look to place the cue ball in an area that will make the position onto the 2 ball relatively easy.

Generally I would try and get relatively close to the number 2 ball which in turn makes the next shot easier, the three to four ball. Give yourself time with this positional shot as the four  ball will only go into the left top corner pocket (space made possible via dispatch of the one ball earlier).

Nailing this shot is the key to running the rack as remaining balls should be straightforward. Again, take the best score from three attempts and log.`
  },
  {
    id: 'b9-archer', heading: 'Archer Drill', category: ROTATIONAL, kind: 'best3', img: 'archer', is147: true, skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `This particular practice routine looks more difficult than it actually is. Expect to attain pretty high scores with this one, but only if you can perfect the 4 to 5 ball positional play. That’s because set up correctly, the 5 ball will not pass into the top left of right pockets.

For me I like to leave a half ball contact on the red number three which in turn will give me a good angle on the four to the right middle. If this shot is overhit, all is not lost as you can play up and down the table. The idea is  to drop behind the five ball (somewhere near the head string) leaving a simple pot into the middle and then down for the 6 ball.

Remaining balls at head of table are easy. Give it a try.

Video Clip: http://www.youtube.com/watch?v=YFM2wYUCN1c`
  },
  {
    id: 'b9-souquet', heading: 'Souquet Drill', category: ROTATIONAL, kind: 'best3', img: 'souquet', is147: true, skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `The final drill from the 147academy.com 9 ball routines features a challenge to your potting ability and positional play. Again complete this drill three times before recording your best score, Gold, Silver or Bronze.

Assesing the 1 ball the first thought should be which of the two left hand corner pockets to play the 2 ball. This in turn will dictate how the rest of the rack proceeds. This routine doesn’t have any really difficult pots to perform so its all about the positonal play.`
  },
  {
    id: 'b9-respot', heading: 'Chapter Three – Advanced Routines', category: 'Cue-Ball Position', kind: 'runs', img: 'respot', skills: { 'Position Play': 1 },
    text: `The following routines should really hone your positional play.Set up as shown with object balls on the head spot and foot spot.

Giving yourself a half ball shot, pot the yellow 1 Ball into left corner pocket, playing position for the green 6 ball into top right corner (A),leaving just the right angle to come down for the respotted object ball.

Repeat and document the number of successful ‘runs’ you can make. My record to date is 17.`
  },
  {
    id: 'b9-fbr1', heading: 'Five Ball Run Number 1', category: ROTATIONAL, kind: 'sum5', img: 'fbr1', skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `The following advanced positional drills focus on accurate positional play and precise potting. The first 5 ball run should be set up as follows, and was originally published via San Francisco Billiard Academy.

Similar to the previous routines, it’s a good idea to get into the habit of recording your success rate for each routine.

Attempt each routine 5 times in a session.
Add together the total number of balls potted for each drill, one point for each ball.
Maximum points for each drill is 25.

Its useful to try these drills with a practice partner. That way you can discuss possible alternative ways to navigate from one ball to the next. Lets get going.

Beginning with the cue ball in hand, the balls are potted in sequence 5 through 9. If you can leave the 7 ball into left middle pocket the routine is so much easier to complete.`
  },
  {
    id: 'b9-fbr2', heading: 'Five Ball Run Number 2', category: ROTATIONAL, kind: 'sum5', img: 'fbr2', skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `Again start with Cue ball in hand, and having potted the 5 ball, leave a good angle to get from 6 ball up to the 7 ball. Complete five times and add up your score for each attempt as before.`
  },
  {
    id: 'b9-fbr3', heading: 'Five Ball Run Number 3', category: ROTATIONAL, kind: 'sum5', img: 'fbr3', skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `Things get a little bit tricker now with the following fantastic positional drill. Avoid the side rails!

Starting with cue ball in hand the objective is to pot each ball in order without touching any side rail, so positional play is key. Expect to play the majority of shots with stun and draw.

Again, complete 5 times and add up your score before adding and dating your diary entry.`
  },
  {
    id: 'b9-fbr4', heading: 'Five Ball Run Number 4', category: ROTATIONAL, kind: 'sum5', img: 'fbr4', skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `The final drill from the advanced position routine provides a solid test of cueball control and potting ability.

The key shot in this drill (which must be completed to be successful) is using the end and side rails for postion from 6 to 7 ball and 8 to 9 ball as outlined below. Good luck with this one!`
  },
  {
    id: 'b9-safety1', heading: 'Chapter Four – Safety is the Game', part: 'Drill 1 of 2', category: 'Safeties', kind: 'done', img: 'safety1', skills: { Safeties: 1, 'Speed Control': 1 },
    text: `Often overlooked, the safety game in 9 ball pool is vital if you are to win your fair share of matches and tournaments. Putting your opponent in a tricky position will not only increase your chances of winning the frame but will show that you are in control of your game and can adapt as the situation dictates.

Each match table is different. Try these couple of practice drills to get used to the pace of the table and cushion rebound before your next match.

With the cue ball just of centre try and play the object ball (in this diagram the 9 Ball) up and down the table over the foot and head spots with the objective being to leave both balls relatively safe. See where the cue ball has finished on the left hand rail.`
  },
  {
    // The page prints no heading of its own. It is the second of the chapter's "couple of practice drills".
    id: 'b9-safety2', heading: '', name: 'Chapter Four – Safety is the Game', part: 'Drill 2 of 2', category: 'Speed Control', kind: 'done', img: 'tableroll', skills: { 'Speed Control': 1 },
    text: `Another useful little drill that you should use prior to starting a match. It will help you assess the roll of the table, rebound of the cushion and speed of the cloth. Play the shot with a little top left english.

This will help in two ways. The left english will widen the angle the cue ball takes making it easier to reach the foot rail, while right hand english is transmitted to the object ball which in turn facilitates a shorter path to the head rail. 5 mins playing this shot from both sides of the table will be invaluable.`
  },
  {
    id: 'b9-cushion1', heading: 'Chapter Five – Cushion and Rail Drills', part: 'Drill 1 of 3', category: 'Cut Shots', kind: 'streak', sides: 2, img: 'cushion1', skills: { 'Shot Making': 1 },
    text: `Here the object ball is placed half balls width from the left rail opposite the diamond. The cue ball is positioned below. The aim of this drill is to successfully pocket the object ball 10 times, without fail. If you miss start from the beginning. I can usually hone in on this shot after a few attempts. Once completed swap to the opposite rail and complete again. A great routine for your armoury.`
  },
  {
    id: 'b9-cushion2', heading: 'Cushion & Rail Drills (Cont)', part: 'Drill 2 of 3', category: 'Cut Shots', kind: 'streak', sides: 1, img: 'cushion2', skills: { 'Shot Making': 1 },
    text: `With this drill, the object ball is quarter ball with from the head rail. With the cue ball frozen to the side rail on the head string the objective is again 10 balls in a row, ensuring no side spin is applied…thus the cue ball should run up and down the table. If you wish to make this even harder, try and position the cue ball somewhere on the table. Another great drill to tighten up your play.`
  },
  {
    id: 'b9-cushion3', heading: 'Cushion & Rail Drills (Cont)', part: 'Drill 3 of 3', category: 'Cut Shots', kind: 'ladder', img: 'cushion3', skills: { 'Shot Making': 1 },
    text: `Position the object ball as shown with the cue ball about quarter ball width from side rail diamond two. Played with central ball striking the aim is to complete 10 successful pots before playing the same shot with the cue ball a little further up the rail (position B) Continue in this fashion up the rail until you can no longer make 50% of your attempts or 5 out of 10.

This is useful knowledge to have since it will let you guague the risk element in your game if you come across this shot in matchplay.`
  },
  {
    id: 'b9-newman', heading: 'Newman 15 repeater', category: ROTATIONAL, kind: 'runs', img: 'newman', skills: { 'Position Play': 1, 'Shot Making': 1 },
    text: `I like to call this the Newman 15 Repeater, named after Paul Newman. If your familiar with the film Colour of Money starring Newman and Tom Cruise, you will recognise this routine.

The objective is to pot each ball in sequence, 1 to 15 without a break. It’s a great routine which will focus your game on the skills learned in Chapter Four, as you will be utilising a lot of cushion shots. Once completed, reverse to the other cushion and start again. See how many ‘runs’ of 15 balls you can complete. Have fun.`
  }
];

const BY_ID = Object.fromEntries(PAGES.map((p) => [p.id, p]));
export const BOOK9_ORDER = PAGES.map((p) => p.id);
export function isBook9Id(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); }
export function book9Page(id) { return BY_ID[id] || null; }
export const book9Image = (id) => (BY_ID[id] ? `./images/book9/${BY_ID[id].img}.webp` : '');
const nameOf = (p) => p.name || p.heading;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const posName = (i) => (i < LETTERS.length ? LETTERS[i] : String(i + 1));
const tierOf = (balls) => (BOOK9_147_TIERS.find(([, min]) => balls >= min) || [''])[0];

/** Buttons for a drill kind. act: pot | miss | done. */
function buttonsFor(p) {
  if (p.kind === 'done') return [{ act: 'done', label: 'DONE' }];
  if (p.kind === 'best3' || p.kind === 'sum5') return [{ act: 'pot', label: 'BALL POTTED' }, { act: 'miss', label: 'MISSED · ATTEMPT OVER' }];
  if (p.kind === 'runs') return [{ act: 'pot', label: p.id === 'b9-newman' ? 'RUN OF 15 COMPLETED' : 'RUN COMPLETED' }, { act: 'miss', label: 'MISSED · FINISH' }];
  if (p.kind === 'streak') return [{ act: 'pot', label: 'POTTED' }, { act: 'miss', label: 'MISSED · START AGAIN' }];
  return [{ act: 'pot', label: 'POTTED' }, { act: 'miss', label: 'MISSED' }];
}

/**
 * Score a drill from its tap log (pure). log: ['pot' | 'miss' | 'stop' | 'done', ...]. 'stop' ends the session early.
 * Returns { done, passed, score, maxScore, medal, status, lines, buttons }. maxScore only feeds the XP performance ratio.
 */
export function book9Status(id, log = []) {
  const p = BY_ID[id];
  if (!p) return null;
  const out = { kind: p.kind, done: false, passed: false, score: 0, maxScore: null, medal: '', status: '', lines: [], buttons: buttonsFor(p) };
  if (p.kind === 'done') {
    out.done = log.includes('done');
    out.passed = out.done;
    out.score = out.done ? 1 : 0;
    out.maxScore = 1;
    out.status = out.done ? 'Done' : 'Run the drill, then tap DONE.';
  } else if (p.kind === 'best3' || p.kind === 'sum5') {
    const N = p.kind === 'best3' ? 3 : 5;
    const attempts = [];
    let cur = 0;
    for (const a of log) {
      if (out.done) break;
      if (a === 'pot') {
        cur += 1;
        if (p.kind === 'sum5' && cur >= 5) { attempts.push(cur); cur = 0; }
      } else if (a === 'miss') { attempts.push(cur); cur = 0; } else if (a === 'stop') {
        if (cur > 0 || !attempts.length) attempts.push(cur);
        cur = 0;
        out.done = true;
      }
      if (attempts.length >= N) out.done = true;
    }
    out.attempts = attempts;
    out.current = cur;
    out.lines = attempts.map((n, i) => `Attempt ${i + 1}: ${n} ball${n === 1 ? '' : 's'}`);
    if (p.kind === 'best3') {
      const best = attempts.length ? Math.max(...attempts) : 0;
      out.score = best;
      out.medal = tierOf(best);
      out.passed = out.done && !!out.medal;
      out.maxScore = BOOK9_147_TIERS[0][1];
      out.status = out.done ? `Best ${best} ball${best === 1 ? '' : 's'}${out.medal ? ` · ${out.medal}` : ''}` : `Attempt ${attempts.length + 1} of 3 · ${cur} ball${cur === 1 ? '' : 's'} this attempt${attempts.length ? ` · best ${best}` : ''}`;
    } else {
      const sum = attempts.reduce((s, n) => s + n, 0);
      out.score = sum;
      out.maxScore = 25;
      out.passed = out.done && attempts.length === 5 && sum > 0;
      out.status = out.done ? `${sum} / 25 points` : `Attempt ${attempts.length + 1} of 5 · ${cur} of 5 balls · ${sum + cur} / 25 points`;
    }
  } else if (p.kind === 'runs') {
    let runs = 0;
    for (const a of log) {
      if (out.done) break;
      if (a === 'pot') runs += 1;
      else if (a === 'miss' || a === 'stop') out.done = true;
    }
    out.score = runs;
    out.passed = out.done && runs >= 1;
    out.status = out.done ? `${runs} run${runs === 1 ? '' : 's'}` : `${runs} run${runs === 1 ? '' : 's'} so far`;
  } else if (p.kind === 'streak') {
    const sides = p.sides || 1;
    let side = 0;
    let streak = 0;
    let best = 0;
    let shots = 0;
    for (const a of log) {
      if (out.done) break;
      if (a === 'pot') {
        shots += 1;
        streak += 1;
        best = Math.max(best, streak);
        if (streak >= 10) { side += 1; streak = 0; best = 0; }
      } else if (a === 'miss') { shots += 1; streak = 0; } else if (a === 'stop') out.done = true;
      if (side >= sides) out.done = true;
    }
    out.score = Math.min(10 * sides, 10 * side + best);
    out.maxScore = 10 * sides;
    out.passed = side >= sides;
    const railTxt = sides > 1 ? `${side >= sides ? 'Both rails' : `Rail ${side + 1} of ${sides}`} · ` : '';
    out.status = out.passed ? `10 in a row${sides > 1 ? ' on both rails' : ''}` : out.done ? `${railTxt}best ${best} in a row` : `${railTxt}${streak} of 10 in a row`;
    out.lines = [`${shots} shot${shots === 1 ? '' : 's'}`];
  } else if (p.kind === 'ladder') {
    let pos = 0;
    let pots = 0;
    let shots = 0;
    let block = 0;
    for (const a of log) {
      if (out.done) break;
      if (a === 'stop') { out.done = true; break; }
      if (a !== 'pot' && a !== 'miss') continue;
      shots += 1;
      if (a === 'pot') { pots += 1; block += 1; }
      if (pots >= 10) { out.lines.push(`Position ${posName(pos)}: 10 pots in ${shots} shots`); pos += 1; pots = 0; shots = 0; block = 0; continue; }
      if (shots % 10 === 0) {
        if (block < 5) { out.lines.push(`Position ${posName(pos)}: ${block} out of 10`); out.done = true; }
        block = 0;
      }
    }
    out.score = pos;
    out.passed = out.done && pos >= 1;
    out.status = out.done ? `Positions cleared: ${pos}` : `Position ${posName(pos)} · ${pots} of 10 pots · ${shots} shot${shots === 1 ? '' : 's'}`;
  }
  if (out.done) out.buttons = [];
  out.canStop = !out.done && log.length > 0 && p.kind !== 'done' && p.kind !== 'runs';
  return out;
}

/** The words shown on the drill page: the page's heading (when it prints one), then its text. */
export function book9Text(id) {
  const p = BY_ID[id];
  if (!p) return '';
  return p.heading ? `${p.heading}\n\n${p.text}` : p.text;
}

function docFor(p) {
  const first = p.text.split('\n\n')[0];
  return {
    format: 'pooliq', schemaVersion: '1.0', contentType: 'drill', id: p.id, contentVersion: '1.0',
    title: nameOf(p).slice(0, 80), description: first.slice(0, 2000),
    category: p.category, difficulty: 2, skill: Object.keys(p.skills)[0], rankXpEligible: false,
    attribution: { sourceName: BOOK9_CREDIT },
    shot: { kind: 'pot', speed: 2, cueContact: { vTips: 0, hTips: 0 }, cueBallPosition: { x: 25, y: 12.5 }, ballPositions: [{ n: 1, x: 75, y: 25 }], targetBall: 1, instructions: p.text.slice(0, 1500), goal: nameOf(p).slice(0, 200) },
    scoringRules: { mode: 'success', attempts: 1, pass: { made: 1 } },
    xp: 60, skillEffects: p.skills
  };
}

let cache = null;
/** Library drills for the book. The page's own picture is the diagram (pdfTable), like the Ball Pocketing PDF drills. */
export function book9Drills() {
  if (cache) return cache;
  cache = PAGES.map((p, i) => {
    const v = validatePooliq(JSON.stringify(docFor(p)));
    if (!v.ok) throw new Error(`book9 ${p.id}: ${v.errors.join(' | ')}`);
    const ch = challengeFromPkfDoc(v.doc);
    delete ch.level;
    delete ch.speed;
    Object.assign(ch, {
      name: nameOf(p),
      heading: p.heading,
      part: p.part || '',
      category: p.category,
      difficulty: 0,
      book9: p.kind,
      bookOrder: i + 1,
      pdfTable: book9Image(p.id),
      goal: p.text.split('\n\n')[0],
      description: p.text,
      instructions: book9Text(p.id),
      credit: BOOK9_CREDIT,
      xp: 60,
      prerequisites: [],
      pq: { rankXpEligible: false }
    });
    return ch;
  });
  return cache;
}
