/**
 * Loop scoring. Standalone — scripts/verify.mjs does not import this file.
 *   node --test scripts/loopRules.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshSolo, applySolo, undoSolo, placeSolo, finishSolo, averageScore, defaultLoopBag,
  freshPvp, applyPvp, undoPvp, placePvp, recordPvp, HISTORY_CAP
} from '../js/ui/loopRules.js';

function playSolo(events, start = freshSolo()) {
  return events.reduce((s, e) => applySolo(s, e), start);
}

test('solo starts at 0 balls and 0 shots', () => {
  const s = freshSolo();
  assert.equal(s.balls, 0);
  assert.equal(s.shots, 0);
  assert.equal(s.misses, 0);
  assert.equal(s.scratches, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.bih, false);
  assert.equal(s.done, false);
});

test('every stroke adds exactly one shot', () => {
  for (const e of ['make', 'miss', 'scratch', 'make-scratch']) {
    const s = applySolo(freshSolo(), e);
    assert.equal(s.shots, 1, e);
  }
  const mixed = playSolo(['make', 'miss', 'scratch', 'make-scratch', 'make']);
  assert.equal(mixed.shots, 5);
});

test('make increments balls and is not a miss or a scratch', () => {
  const s = applySolo(freshSolo(), 'make');
  assert.equal(s.balls, 1);
  assert.equal(s.misses, 0);
  assert.equal(s.scratches, 0);
  assert.equal(s.streak, 1);
  assert.equal(s.bestStreak, 1);
  assert.equal(s.bih, false);
});

test('miss does not add a ball and resets the streak', () => {
  const s = playSolo(['make', 'make', 'miss']);
  assert.equal(s.balls, 2);
  assert.equal(s.misses, 1);
  assert.equal(s.shots, 3);
  assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 2);
  assert.equal(s.bih, false);
});

test('solo scratch adds no extra shot, no ball, and ball in hand', () => {
  const start = playSolo(['make']);
  const s = applySolo(start, 'scratch');
  assert.equal(s.shots, start.shots + 1);
  assert.equal(s.balls, start.balls);
  assert.equal(s.scratches, 1);
  assert.equal(s.misses, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.bih, true);
  assert.equal(s.done, false);
});

test('make-scratch credits the ball, one shot, streak continues, ball in hand', () => {
  const start = { balls: 8, shots: 12, misses: 1, scratches: 2, streak: 3, bestStreak: 4, bih: false, done: false, log: [] };
  const s = applySolo(start, 'make-scratch');
  assert.equal(s.balls, 9);
  assert.equal(s.shots, 13);
  assert.equal(s.scratches, 3);
  assert.equal(s.misses, 1);
  assert.equal(s.streak, 4);
  assert.equal(s.bestStreak, 4);
  assert.equal(s.bih, true);
  assert.equal(s.done, false);
  assert.deepEqual(start, { balls: 8, shots: 12, misses: 1, scratches: 2, streak: 3, bestStreak: 4, bih: false, done: false, log: [] });
});

test('game ends at 15 and further events are no-ops', () => {
  const done = playSolo(Array(15).fill('make'));
  assert.equal(done.balls, 15);
  assert.equal(done.shots, 15);
  assert.equal(done.done, true);
  assert.equal(done.bestStreak, 15);
  const after = applySolo(done, 'make');
  assert.equal(after.balls, 15);
  assert.equal(after.shots, 15);
  assert.equal(after.log.length, 15);
  const scratchEnd = playSolo([...Array(14).fill('make'), 'make-scratch']);
  assert.equal(scratchEnd.balls, 15);
  assert.equal(scratchEnd.shots, 15);
  assert.equal(scratchEnd.scratches, 1);
  assert.equal(scratchEnd.done, true);
  assert.equal(scratchEnd.bih, true);
  const locked = applySolo(scratchEnd, 'scratch');
  assert.equal(locked.shots, 15);
  assert.equal(locked.scratches, 1);
});

test('personal best is lower-is-better and the first finish counts', () => {
  const bag0 = defaultLoopBag();
  const slow = playSolo([...Array(10).fill('make'), ...Array(5).fill('miss'), ...Array(5).fill('make')]);
  assert.equal(slow.done, true);
  assert.equal(slow.shots, 20);
  const a = finishSolo(bag0, slow, '2026-10-03T12:00:00.000Z');
  assert.equal(a.recorded, true);
  assert.equal(a.newBest, true);
  assert.equal(a.bag.personalBest, 20);
  assert.equal(a.bag.gamesPlayed, 1);
  const same = finishSolo(a.bag, slow, '2026-10-03T13:00:00.000Z');
  assert.equal(same.newBest, false);
  assert.equal(same.bag.personalBest, 20);
  const better = playSolo([...Array(14).fill('make'), 'miss', 'make']);
  assert.equal(better.shots, 16);
  const c = finishSolo(same.bag, better, '2026-10-03T14:00:00.000Z');
  assert.equal(c.newBest, true);
  assert.equal(c.bag.personalBest, 16);
  const worse = finishSolo(c.bag, slow, '2026-10-03T15:00:00.000Z');
  assert.equal(worse.newBest, false);
  assert.equal(worse.bag.personalBest, 16);
});

test('history aggregates completed solo games and keeps the last 20', () => {
  let bag = defaultLoopBag();
  const dates = [];
  for (let g = 0; g < 21; g++) {
    const misses = g % 2;
    const events = [...Array(15 - 0).fill('make')];
    if (misses) events.splice(3, 0, 'miss');
    const solo = playSolo(events);
    assert.equal(solo.done, true);
    const date = `2026-10-03T${String(g).padStart(2, '0')}:00:00.000Z`;
    dates.push(date);
    const res = finishSolo(bag, solo, date);
    bag = res.bag;
  }
  assert.equal(bag.gamesPlayed, 21);
  assert.equal(bag.soloHistory.length, HISTORY_CAP);
  assert.equal(bag.soloHistory[0].date, dates[20]);
  assert.equal(bag.soloHistory.at(-1).date, dates[1]);
  assert.equal(bag.soloHistory.some((h) => h.date === dates[0]), false);
  const missGames = 10;
  assert.equal(bag.totalMisses, missGames);
  assert.equal(bag.totalCaroms, 21 * 15);
  assert.equal(bag.totalScratches, 0);
  assert.equal(bag.totalShots, 21 * 15 + missGames);
  const kept = bag.soloHistory.reduce((n, h) => n + h.shots, 0);
  assert.equal(bag.totalShots, kept + 15);
  assert.equal(averageScore(bag), bag.totalShots / 21);
  assert.equal(bag.bestStreak, 15);
  assert.equal(bag.personalBest, 15);
  assert.equal(bag.soloHistory[0].newBest, false);
  assert.equal(bag.soloHistory.some((h) => h.newBest), false);
});

test('undo reverses the last solo stroke, including ball in hand', () => {
  let s = playSolo(['make', 'scratch']);
  assert.equal(s.bih, true);
  s = placeSolo(s);
  assert.equal(s.bih, false);
  assert.equal(s.shots, 2);
  s = undoSolo(s);
  assert.equal(s.shots, 1);
  assert.equal(s.balls, 1);
  assert.equal(s.scratches, 0);
  assert.equal(s.bih, false);
  s = undoSolo(s);
  assert.deepEqual(s, freshSolo());
});

test('1v1 starts 0-0 with player 1 to shoot and no ball in hand', () => {
  const p = freshPvp();
  assert.deepEqual(p.scores, [0, 0]);
  assert.equal(p.turn, 0);
  assert.equal(p.bih, false);
  assert.equal(p.done, false);
  assert.equal(p.winner, null);
});

test('1v1 make scores and the same player continues', () => {
  const s = applyPvp(freshPvp(), 'make');
  assert.deepEqual(s.scores, [1, 0]);
  assert.equal(s.turn, 0);
  assert.equal(s.streaks[0], 1);
  assert.equal(s.bih, false);
  const s2 = applyPvp(s, 'make');
  assert.deepEqual(s2.scores, [2, 0]);
  assert.equal(s2.turn, 0);
});

test('1v1 miss switches the turn and does not give ball in hand', () => {
  let s = applyPvp(freshPvp(), 'make');
  s = applyPvp(s, 'miss');
  assert.deepEqual(s.scores, [1, 0]);
  assert.equal(s.turn, 1);
  assert.equal(s.bih, false);
  assert.equal(s.streaks[0], 0);
  s = applyPvp(s, 'miss');
  assert.equal(s.turn, 0);
  assert.equal(s.bih, false);
});

test('1v1 scratch scores nothing, switches, and gives ball in hand', () => {
  let s = playTo(freshPvp(), 0, 3);
  s = applyPvp(s, 'scratch');
  assert.deepEqual(s.scores, [3, 0]);
  assert.equal(s.turn, 1);
  assert.equal(s.bih, true);
  assert.equal(s.streaks[0], 0);
  s = placePvp(s);
  assert.equal(s.bih, false);
  assert.equal(s.turn, 1);
});

test('1v1 make-scratch does not award the point', () => {
  let s = playTo(freshPvp(), 0, 3);
  s = applyPvp(s, 'make-scratch');
  assert.deepEqual(s.scores, [3, 0]);
  assert.equal(s.turn, 1);
  assert.equal(s.bih, true);
  assert.equal(s.done, false);
});

test('first to 8 wins and further scoring is a no-op', () => {
  let s = playTo(freshPvp(), 0, 7);
  s = applyPvp(s, 'miss');
  s = applyPvp(s, 'make');
  assert.deepEqual(s.scores, [7, 1]);
  assert.equal(s.turn, 1);
  s = applyPvp(s, 'miss');
  assert.equal(s.turn, 0);
  s = applyPvp(s, 'make');
  assert.deepEqual(s.scores, [8, 1]);
  assert.equal(s.done, true);
  assert.equal(s.winner, 0);
  assert.equal(s.bih, false);
  const locked = applyPvp(s, 'make');
  assert.deepEqual(locked.scores, [8, 1]);
  assert.equal(locked.turn, 0);
  assert.equal(locked.log.length, s.log.length);
  const rec = recordPvp(defaultLoopBag(), s, '2026-10-03T18:00:00.000Z');
  assert.equal(rec.recorded, true);
  assert.deepEqual(rec.bag.pvpHistory[0], { p1: 8, p2: 1, winner: 1, date: '2026-10-03T18:00:00.000Z' });
  const again = recordPvp(rec.bag, s, '2026-10-03T19:00:00.000Z');
  assert.equal(again.bag.pvpHistory.length, 2);
});

test('1v1 undo restores the previous turn and ball in hand', () => {
  let s = applyPvp(freshPvp(), 'make');
  s = applyPvp(s, 'make-scratch');
  assert.equal(s.bih, true);
  assert.equal(s.turn, 1);
  s = undoPvp(s);
  assert.deepEqual(s.scores, [1, 0]);
  assert.equal(s.turn, 0);
  assert.equal(s.bih, false);
});

function playTo(state, player, points) {
  let s = state;
  while (s.scores[player] < points) {
    if (s.turn !== player) s = applyPvp(s, 'miss');
    else s = applyPvp(s, 'make');
  }
  return s;
}
