import {
  KICK_SCORE, recordAttempt, freshStation, passesPercent, isLevelOpen, isExamOpen,
  passedLevelCount, startLevel, kickTap, LEVELS, auditStations
} from '../js/content/kickingCourse.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  }
}

auditStations();

assert(KICK_SCORE.attemptPoints[1] === 3, 'first try is 3');
assert(KICK_SCORE.attemptPoints[2] === 2, 'second try is 2');
assert(KICK_SCORE.attemptPoints[3] === 1, 'third try is 1');
assert(KICK_SCORE.attemptPoints[0] === 0, 'all missed is 0');
assert(KICK_SCORE.pocketBonus === 2, 'pocket bonus is 2');

const open = { allowPocket: true, requirePocket: false, confirm: false };
let rec = recordAttempt(open, freshStation(), 'contact');
assert(rec.points === 3 && rec.success && rec.marks.join() === 'make,empty,empty', 'first-try make is 3 and unused marks stay empty');

rec = recordAttempt(open, freshStation(), 'miss');
rec = recordAttempt(open, rec, 'contact');
assert(rec.points === 2 && rec.madeOn === 2 && rec.marks.join() === 'miss,make,empty', 'second-try make is 2 and the last mark stays empty');

rec = recordAttempt(open, freshStation(), 'miss');
rec = recordAttempt(open, rec, 'miss');
rec = recordAttempt(open, rec, 'contact');
assert(rec.points === 1 && rec.madeOn === 3 && rec.marks.join() === 'miss,miss,make', 'third-try make is 1');

rec = recordAttempt(open, freshStation(), 'miss');
rec = recordAttempt(open, rec, 'miss');
rec = recordAttempt(open, rec, 'miss');
assert(rec.points === 0 && rec.success === false && rec.done, 'three misses score 0');

rec = recordAttempt(open, freshStation(), 'pocket');
assert(rec.points === 5 && rec.pocketed, 'pocket bonus adds 2 to a first-try make');

const mustPocket = LEVELS[6].stations.find((s) => s.requirePocket);
assert(mustPocket, 'level 7 has a required pocket');
rec = recordAttempt(mustPocket, freshStation(), 'contact');
assert(rec.success === false && rec.done === false && rec.points === 0 && rec.marks[0] === 'miss', 'required-pocket station does not pass on contact only');
rec = recordAttempt(mustPocket, rec, 'pocket');
assert(rec.success && rec.pocketed && rec.points === 4, 'required pocket on the second try scores 2 plus the bonus');

assert(passesPercent(4, 4) === true, '4 successes pass a 4-station level');
assert(passesPercent(3, 4) === false, '3 successes fail a 4-station level at 80%');

let state = {};
assert(isLevelOpen({ levels: {} }, 1) === true, 'level 1 is open');
assert(isLevelOpen({ levels: {} }, 2) === false, 'the next level stays locked');
state = startLevel(state, 1);
for (let i = 0; i < 4; i++) state = kickTap(state, 'contact');
assert(state.kickingCourse.levels[1].passed === true, 'four makes pass level 1');
assert(isLevelOpen(state.kickingCourse, 2) === true, 'passing level 1 opens level 2');
assert(isLevelOpen(state.kickingCourse, 3) === false, 'level 3 stays locked after only level 1');
assert(isExamOpen(state.kickingCourse) === false, 'the exam stays locked until 8 levels pass');
for (let n = 2; n <= 8; n++) {
  state = startLevel(state, n);
  for (let i = 0; i < 4; i++) {
    const st = LEVELS[n - 1].stations[i];
    const outcome = st.confirm ? 'result' : st.requirePocket ? 'pocket' : 'contact';
    state = kickTap(state, outcome);
  }
}
assert(passedLevelCount(state.kickingCourse) === 8, 'eight levels can be passed');
assert(isExamOpen(state.kickingCourse) === true, 'the exam unlocks after 8 levels');

const half = JSON.stringify(LEVELS).includes('6.25') || JSON.stringify(LEVELS).includes('18.75') || JSON.stringify(LEVELS).includes('1.125');
assert(!half, 'no half-diamond or radius offsets on ball positions');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('kicking course tests passed');
