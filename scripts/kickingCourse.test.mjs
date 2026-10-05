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

const mustPocket = LEVELS.find((level) => level.id === 7).stations.find((s) => s.requirePocket);
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
assert(isExamOpen(state.kickingCourse) === false, 'the exam stays locked until every level is passed');
assert(isLevelOpen(state.kickingCourse, 9) === false, 'a new one-rail level stays locked after only level 1');
state = setDifficulty(state, 'pro');
assert(kickingOf(state).difficulty === 'pro', 'switching to pro is remembered');
state = startLevel(state, 2);
assert(state.kickingCourse.current.stations[0].marks.length === 3, 'pro station shows 3 attempt marks');
state = kickTap(state, 'contact');
assert(state.kickingCourse.current.stations[0].success === false && state.kickingCourse.current.stations[0].done === false, 'pro does not pass level 2 on contact');
for (let i = 0; i < 4; i++) state = kickTap(state, 'pocket');
assert(state.kickingCourse.levels[2].passed === true, 'pro pockets pass the level');
const legacy = { levels: {} };
for (let i = 1; i <= 8; i++) legacy.levels[String(i)] = { passed: true, bestScore: 12 };
assert(passedLevelCount(legacy) === 8, 'an old save still counts the original eight levels');
assert(isExamOpen(legacy) === false, 'the exam stays locked until the new levels are passed too');
assert(!legacy.levels[9] && !legacy.levels['9'], 'a new level is not marked passed');
assert(isLevelOpen(legacy, 1) && isLevelOpen(legacy, 3) && isLevelOpen(legacy, 8), 'levels the player already passed stay open');
assert(isLevelOpen(legacy, 9) === true, 'the first new level opens when levels 1 and 2 are already passed');
assert(isLevelOpen(legacy, 10) === false, 'the next new level stays locked');
state = setDifficulty(state, 'intermediate');
for (const level of LEVELS) {
  if (level.id === 1 || level.id === 2) continue;
  state = startLevel(state, level.id);
  for (let i = 0; i < 4; i++) state = kickTap(state, 'contact');
}
assert(passedLevelCount(state.kickingCourse) === LEVELS.length, 'every level can be passed on contact at intermediate');
assert(isExamOpen(state.kickingCourse) === true, 'the exam unlocks only after every level');
assert(kickingOf(state).difficulty === 'intermediate', 'the saved difficulty is still intermediate');
for (const [n, ids] of [[1, [1, 2, 9, 10, 11]], [2, [3, 12, 13, 14, 15]], [3, [4, 16, 17, 18, 19]]]) {
  const rows = ids.map((id) => LEVELS.find((level) => level.id === id));
  assert(rows.every((level) => level && level.stations.every((s) => s.rails.length === n)), n + '-rail group is five levels');
}
const first = LEVELS.find((level) => level.id === 1).stations[0];
assert(first.cue.x === 12.5 && first.cue.y === 25 && first.ob.x === 75 && first.ob.y === 12.5 && first.rails.join() === 'bottom', 'level 1 station 1 did not move');

const half = JSON.stringify(LEVELS).includes('6.25') || JSON.stringify(LEVELS).includes('18.75') || JSON.stringify(LEVELS).includes('1.125');
assert(!half, 'no half-diamond or radius offsets on ball positions');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('kicking course tests passed');
