import {
  TRICK_SCORE, PASS_RULE, STORAGE_KEY, LEVELS, EXAM_SHOTS, AUDIT, allShots,
  pointsForMake, applyAttempt, shotDone, scoreRun, readCourse,
  startLevel, startExam, trickTap, trickPractice, trickReplay,
  levelUnlocked, levelPassed, examUnlocked
} from '../js/content/trickShotCourse.js';
import { defaultState } from '../js/storage.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
}

assert(PASS_RULE.includes('3 times') && !/80%/.test(PASS_RULE), 'pass rule is three makes, not 80%');
assert(STORAGE_KEY === 'trickShotCourse', 'storage key');
assert(!('trickShotCourse' in defaultState()), 'key is not in defaultState');
assert(LEVELS.length === 9 && LEVELS.every((l) => l.shots.length === 4), '9 levels, 4 shots');
assert(allShots().every((s) => s.name && !/^shot\s*\d/i.test(s.name)), 'every shot is named');
assert(new Set(allShots().map((s) => s.name)).size === 36, '36 unique names');
const skills = ['combination', 'carom', 'multiball', 'bank', 'kick', 'z', 'draw', 'english'];
assert(EXAM_SHOTS.map((s) => s.skill).join() === skills.join(), 'exam skills in order');
assert(EXAM_SHOTS.map((s) => s.name).join('|') === 'Three-Ball Corner Line|Square Stun Carom|Corner Cluster|Head-Rail Bank|Kick-Combo to the Side|Long Z to the Corner|Draw Back from the Top|Outside English on the Cut', 'exam shots');
assert(AUDIT.seventhPocket === 0 && AUDIT.namedRailsOk && AUDIT.shots === 36, 'audit: no 7th pocket, rails match');
assert(LEVELS[0].stars === 1 && LEVELS[8].stars === 5, 'stars step from 1 to 5');

assert(pointsForMake(1) === 3 && pointsForMake(2) === 2 && pointsForMake(3) === 1 && pointsForMake(4) === 0, '3/2/1/0');

const run = { shots: [{ makes: [], attempts: [] }] };
applyAttempt(run, 0, 'miss');
applyAttempt(run, 0, 'miss');
applyAttempt(run, 0, 'miss');
applyAttempt(run, 0, 'make');
assert(!shotDone(run.shots[0]) && run.shots[0].makes[0].points === 0, 'a make after three misses scores 0 and does not finish the shot');
applyAttempt(run, 0, 'make');
assert(run.shots[0].makes[1].points === 3 && run.shots[0].makes[1].cycle === 1, 'the next make starts a new cycle at 3');
applyAttempt(run, 0, 'miss');
applyAttempt(run, 0, 'make', true);
assert(run.shots[0].makes[2].points === 2 && run.shots[0].makes[2].bonus === 1 && shotDone(run.shots[0]), 'second-try make is 2, bonus does not block the make, three makes finish the shot');
const scored = scoreRun(run);
assert(scored.score === 0 + 3 + 2 + 1 && scored.later === 1 && scored.first === 1 && scored.second === 1, 'score adds the cycle points plus the bonus');

let s = defaultState();
assert(!levelUnlocked(s, 2) && !examUnlocked(s), 'level 2 and the exam start locked');
s = startLevel(s, 2);
assert(!readCourse(s).current, 'a locked level does not start');
s = startLevel(s, 1);
for (let shot = 0; shot < 4; shot++) {
  s = trickTap(s, 'miss');
  s = trickTap(s, 'miss');
  s = trickTap(s, 'miss');
  s = trickTap(s, 'make');
  s = trickTap(s, 'make');
  s = trickTap(s, 'make');
}
let cur = readCourse(s).current;
assert(cur.phase === 'results' && cur.summary.passed && cur.summary.score === 4 * (0 + 3 + 3), 'misses do not fail; three makes each unlock the level');
assert(levelPassed(s, 1) && levelUnlocked(s, 2) && !examUnlocked(s), 'level 2 opens and the exam stays locked');
const lowBest = readCourse(s).levels['1'].best;
assert(lowBest === cur.summary.score, 'best stores the low score');

s = trickReplay(s);
cur = readCourse(s).current;
assert(cur.phase === 'play' && cur.shots.every((slot) => slot.attempts.length === 0), 'replay starts clean');
for (let shot = 0; shot < 4; shot++) {
  s = trickTap(s, 'make');
  s = trickTap(s, 'make');
  s = trickTap(s, 'make');
}
cur = readCourse(s).current;
assert(cur.summary.score === 36 && readCourse(s).levels['1'].best === 36 && readCourse(s).levels['1'].passed, 'replay can raise the best and the pass stays');

// practice must not change the saved best
s = trickPractice(s);
assert(readCourse(s).current === null || readCourse(s).current.mode !== 'practice', 'clean pass has nothing to practice');
// force a pass that had a miss, then practice
s = defaultState();
s = startLevel(s, 1);
s = trickTap(s, 'miss');
for (let n = 0; n < 3; n++) s = trickTap(s, 'make');
for (let shot = 1; shot < 4; shot++) for (let n = 0; n < 3; n++) s = trickTap(s, 'make');
const bestBefore = readCourse(s).levels['1'].best;
assert(readCourse(s).current.summary.missNames.includes('Side-Pocket Stack'), 'the shot that missed is named, not failed');
s = trickPractice(s);
assert(readCourse(s).current.mode === 'practice' && readCourse(s).current.order.length === 1, 'practice is only the shot that had a miss');
for (let n = 0; n < 3; n++) s = trickTap(s, 'make');
assert(readCourse(s).current.phase === 'results' && readCourse(s).levels['1'].best === bestBefore, 'practice does not change the saved score');

// required zone is a make label, a miss does not count
const stop = LEVELS[7].shots.find((shot) => shot.name === 'Stop in the Small Zone');
assert(stop.objective === 'pocket-and-zone' && stop.zone && !stop.bonus, 'the small zone is required and is not a bonus');
const follow = LEVELS[5].shots.find((shot) => shot.name === 'Follow to the Zone');
assert(follow.bonus && follow.objective !== 'pocket-and-zone', 'follow zone is a bonus');

// pass all 9 with three clean makes, then the exam
s = defaultState();
for (let level = 1; level <= 9; level++) {
  assert(levelUnlocked(s, level), `level ${level} unlocks in order`);
  s = startLevel(s, level);
  for (let shot = 0; shot < 4; shot++) for (let n = 0; n < 3; n++) s = trickTap(s, 'make');
  assert(levelPassed(s, level), `level ${level} passed`);
}
assert(examUnlocked(s), 'exam unlocks after all 9');
s = startExam(s);
assert(readCourse(s).current.mode === 'exam' && readCourse(s).current.shots.length === 8, 'exam has 8 shots');
for (let shot = 0; shot < 8; shot++) for (let n = 0; n < 3; n++) s = trickTap(s, 'make');
assert(readCourse(s).exam.passed && readCourse(s).exam.best === 8 * 9, 'exam pass stores score and best');

if (failed) { console.error(failed, 'failed'); process.exit(1); }
console.log('trick shot course tests passed');
