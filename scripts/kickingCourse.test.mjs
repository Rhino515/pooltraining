import {
  KICK_SCORE, DIFFICULTIES, recordAttempt, freshStation, passesPercent, isLevelOpen, isExamOpen,
  passedLevelCount, startLevel, kickTap, setDifficulty, kickingOf, LEVELS, auditStations, attemptsFor
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
assert(KICK_SCORE.attemptPoints[4] === 1, 'fourth try is 1');
assert(KICK_SCORE.attemptPoints[5] === 1, 'fifth try is 1');
assert(KICK_SCORE.attemptPoints[0] === 0, 'all missed is 0');
assert(KICK_SCORE.pocketBonus === 2, 'pocket bonus is 2');
assert(DIFFICULTIES.beginner.attempts === 5 && DIFFICULTIES.beginner.pocketRequired === false, 'beginner is 5 attempts and a hit');
assert(DIFFICULTIES.intermediate.attempts === 3 && DIFFICULTIES.intermediate.pocketRequired === false, 'intermediate is 3 attempts and a hit');
assert(DIFFICULTIES.pro.attempts === 3 && DIFFICULTIES.pro.pocketRequired === true, 'pro is 3 attempts and the pocket');

const open = LEVELS[0].stations[0];
let rec = recordAttempt(open, freshStation(5), 'contact', 'beginner');
assert(rec.points === 3 && rec.success && rec.marks.join() === 'make,empty,empty,empty,empty', 'beginner first-try hit is 3 and the other four marks stay empty');

rec = recordAttempt(open, freshStation(5), 'miss', 'beginner');
rec = recordAttempt(open, rec, 'miss', 'beginner');
rec = recordAttempt(open, rec, 'miss', 'beginner');
rec = recordAttempt(open, rec, 'contact', 'beginner');
assert(rec.points === 1 && rec.madeOn === 4 && rec.marks.join() === 'miss,miss,miss,make,empty', 'beginner fourth-try hit scores 1 and the fifth mark stays empty');

rec = freshStation(5);
for (let i = 0; i < 5; i++) rec = recordAttempt(open, rec, 'miss', 'beginner');
assert(rec.points === 0 && rec.success === false && rec.done && rec.marks.join() === 'miss,miss,miss,miss,miss', 'beginner five misses score 0');

rec = recordAttempt(open, freshStation(5), 'pocket', 'beginner');
assert(rec.points === 5 && rec.pocketed && rec.success, 'beginner pocket adds +2 and is not required');

rec = recordAttempt(open, freshStation(), 'contact', 'intermediate');
assert(rec.points === 3 && rec.success && rec.marks.join() === 'make,empty,empty', 'intermediate first-try hit is 3 and unused marks stay empty');
rec = recordAttempt(open, freshStation(), 'miss', 'intermediate');
rec = recordAttempt(open, rec, 'contact', 'intermediate');
assert(rec.points === 2 && rec.madeOn === 2 && rec.marks.join() === 'miss,make,empty', 'intermediate second-try hit is 2');
rec = recordAttempt(open, freshStation(), 'miss', 'intermediate');
rec = recordAttempt(open, rec, 'miss', 'intermediate');
rec = recordAttempt(open, rec, 'miss', 'intermediate');
assert(rec.points === 0 && rec.success === false && rec.done && rec.marks.length === 3, 'intermediate three misses score 0');
rec = recordAttempt(open, freshStation(), 'pocket', 'intermediate');
assert(rec.points === 5 && rec.pocketed, 'intermediate pocket bonus adds 2');

const mustPocket = LEVELS[6].stations.find((s) => s.requirePocket);
assert(mustPocket, 'level 7 still names a pocket');
rec = recordAttempt(mustPocket, freshStation(), 'contact', 'intermediate');
assert(rec.success === true && rec.pocketed === false && rec.points === 3, 'intermediate contact passes a level 7 station without the pocket');
rec = recordAttempt(open, freshStation(), 'contact', 'pro');
assert(rec.success === false && rec.done === false && rec.points === 0 && rec.marks[0] === 'miss', 'pro contact is a miss on an early level');
rec = recordAttempt(open, rec, 'pocket', 'pro');
assert(rec.success && rec.pocketed && rec.points === 4 && rec.marks.join() === 'miss,make,empty', 'pro pocket on the second try scores 2 plus the bonus');
rec = recordAttempt(mustPocket, freshStation(), 'contact', 'pro');
assert(rec.success === false && rec.marks[0] === 'miss', 'pro contact is a miss on a level 7 station too');

assert(passesPercent(4, 4) === true, '4 successes pass a 4-station level');
assert(passesPercent(3, 4) === false, '3 successes fail a 4-station level at 80%');
assert(passesPercent(7, 8) === true && passesPercent(6, 8) === false, 'exam pass stays 80%');

let state = {};
assert(kickingOf(state).difficulty === 'intermediate', 'difficulty defaults to intermediate');
state = setDifficulty(state, 'beginner');
assert(state.kickingCourse.difficulty === 'beginner', 'the last difficulty is stored on kickingCourse');
state = setDifficulty(state, 'nope');
assert(state.kickingCourse.difficulty === 'beginner', 'an unknown difficulty is ignored');
assert(isLevelOpen({ levels: {} }, 1) === true, 'level 1 is open');
assert(isLevelOpen({ levels: {} }, 2) === false, 'the next level stays locked');
state = startLevel(state, 1);
assert(attemptsFor(state.kickingCourse.difficulty) === 5, 'a started level keeps beginner');
assert(state.kickingCourse.current.stations[0].marks.length === 5, 'beginner station shows 5 attempt marks');
for (let i = 0; i < 4; i++) state = kickTap(state, 'contact');
assert(state.kickingCourse.levels[1].passed === true, 'four beginner hits pass level 1');
assert(isLevelOpen(state.kickingCourse, 2) === true, 'passing level 1 opens level 2');
assert(isLevelOpen(state.kickingCourse, 3) === false, 'level 3 stays locked after only level 1');
assert(isExamOpen(state.kickingCourse) === false, 'the exam stays locked until 8 levels pass');
state = setDifficulty(state, 'pro');
assert(kickingOf(state).difficulty === 'pro', 'switching to pro is remembered');
state = startLevel(state, 2);
assert(state.kickingCourse.current.stations[0].marks.length === 3, 'pro station shows 3 attempt marks');
state = kickTap(state, 'contact');
assert(state.kickingCourse.current.stations[0].success === false && state.kickingCourse.current.stations[0].done === false, 'pro does not pass level 2 on contact');
for (let i = 0; i < 4; i++) state = kickTap(state, 'pocket');
assert(state.kickingCourse.levels[2].passed === true, 'pro pockets pass the level');
state = setDifficulty(state, 'intermediate');
for (let n = 3; n <= 8; n++) {
  state = startLevel(state, n);
  for (let i = 0; i < 4; i++) state = kickTap(state, 'contact');
}
assert(passedLevelCount(state.kickingCourse) === 8, 'eight levels can be passed on contact at intermediate');
assert(isExamOpen(state.kickingCourse) === true, 'the exam unlocks after 8 levels');
assert(kickingOf(state).difficulty === 'intermediate', 'the saved difficulty is still intermediate');

const half = JSON.stringify(LEVELS).includes('6.25') || JSON.stringify(LEVELS).includes('18.75') || JSON.stringify(LEVELS).includes('1.125');
assert(!half, 'no half-diamond or radius offsets on ball positions');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('kicking course tests passed');
