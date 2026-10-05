/**
 * Kick Safe scoring. Standalone — scripts/verify.mjs does not import this file.
 *   node --test scripts/kickSafe.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RACES, DEFAULT_RACE, freshMatch, applyMatch, emptySolo, logSolo,
  railPercent, overallPercent, defaultKickSafeBag, normalizeBag
} from '../js/ui/kickSafeRules.js';
import { defaultState, migrateToV4 } from '../js/storage.js';

test('foul gives the opponent 1 point', () => {
  const s = applyMatch(freshMatch(), 'foul');
  assert.deepEqual(s.scores, [0, 1]);
  assert.equal(s.fouls, 1);
  assert.equal(s.scratches, 0);
  assert.equal(s.turn, 1);
  assert.equal(s.done, false);
  assert.equal(s.winner, null);
  const back = applyMatch(s, 'foul');
  assert.deepEqual(back.scores, [1, 1]);
  assert.equal(back.fouls, 2);
  assert.equal(back.turn, 0);
});

test('scratch gives the opponent 1 point and counts as a foul', () => {
  const s = applyMatch(freshMatch(), 'scratch');
  assert.deepEqual(s.scores, [0, 1]);
  assert.equal(s.fouls, 1);
  assert.equal(s.scratches, 1);
  assert.equal(s.turn, 1);
  assert.equal(s.done, false);
});

test('a pocketed ball does not score', () => {
  let s = applyMatch(freshMatch(), 'pocket');
  assert.deepEqual(s.scores, [0, 0]);
  assert.equal(s.fouls, 0);
  assert.equal(s.done, false);
  assert.equal(s.winner, null);
  s = applyMatch(freshMatch(), 'foul');
  const scored = s.scores.slice();
  s = applyMatch(s, 'pocket');
  assert.deepEqual(s.scores, scored);
  assert.equal(s.fouls, 1);
  assert.equal(s.done, false);
});

test('race to 5 ends the game and a shorter race is not used by default', () => {
  let s = freshMatch(5);
  for (let i = 0; i < 4; i++) {
    s = applyMatch(s, 'foul');
    s = applyMatch(s, 'pass');
  }
  assert.deepEqual(s.scores, [0, 4]);
  assert.equal(s.done, false);
  s = applyMatch(s, 'foul');
  assert.deepEqual(s.scores, [0, 5]);
  assert.equal(s.done, true);
  assert.equal(s.winner, 1);
  const after = applyMatch(s, 'foul');
  assert.deepEqual(after.scores, [0, 5]);
  assert.equal(after.done, true);
});

test('default race is 5 and the choices are 3, 5, 7, and 10', () => {
  assert.equal(DEFAULT_RACE, 5);
  assert.deepEqual(RACES, [3, 5, 7, 10]);
  assert.equal(freshMatch().race, 5);
  assert.equal(defaultKickSafeBag().race, 5);
  assert.equal(normalizeBag({}).race, 5);
  assert.equal(normalizeBag({ race: 9 }).race, 5);
  assert.equal(normalizeBag({ race: 10 }).race, 10);
  assert.equal(defaultState().kickSafe.race, 5);
  assert.ok(defaultState().loop);
  const kept = migrateToV4({ version: 4, xp: 3, rankIndex: 0, kickSafe: { race: 7 } });
  assert.equal(kept.xp, 3);
  assert.equal(kept.kickSafe.race, 7);
  assert.equal(kept.loop.gamesPlayed, 0);
  const added = migrateToV4({ version: 4, xp: 4, rankIndex: 1 });
  assert.equal(added.xp, 4);
  assert.equal(added.kickSafe.race, 5);
  assert.deepEqual(added.kickSafe.pvpHistory, []);
});

test('solo percentages and best streak', () => {
  let s = emptySolo();
  s = logSolo(s, 1, 'success');
  s = logSolo(s, 1, 'success');
  s = logSolo(s, 1, 'fail');
  assert.equal(s.bestStreak, 2);
  assert.equal(s.streak, 0);
  s = logSolo(s, 2, 'success');
  s = logSolo(s, 2, 'scratch');
  assert.equal(s.streak, 0);
  assert.equal(s.bestStreak, 2);
  s = logSolo(s, 3, 'fail');
  s = logSolo(s, 4, 'success');
  s = logSolo(s, 4, 'success');
  s = logSolo(s, '4+', 'success');
  assert.equal(s.attempts, 9);
  assert.equal(s.success, 6);
  assert.equal(s.fail, 2);
  assert.equal(s.scratch, 1);
  assert.equal(s.streak, 3);
  assert.equal(s.bestStreak, 3);
  assert.equal(railPercent(s, 1), 67);
  assert.equal(railPercent(s, 2), 50);
  assert.equal(railPercent(s, 3), 0);
  assert.equal(railPercent(s, 4), 100);
  assert.equal(overallPercent(s), 67);
  assert.equal(s.rails[1].attempts, 3);
  assert.equal(s.rails[4].success, 3);
});

test('a missed kick does not score and the shooter stays', () => {
  const s = applyMatch(freshMatch(), 'kick-miss');
  assert.deepEqual(s.scores, [0, 0]);
  assert.equal(s.kickFail, 1);
  assert.equal(s.turn, 0);
  assert.equal(s.done, false);
  const ok = applyMatch(s, 'kick', 3);
  assert.deepEqual(ok.scores, [0, 0]);
  assert.equal(ok.kickOk, 1);
  assert.equal(ok.turn, 0);
});
