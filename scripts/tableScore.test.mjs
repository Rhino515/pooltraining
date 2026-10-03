/**
 * Straight pool, one pocket, and cribbage scoring.
 * Standalone — scripts/verify.mjs does not import this file.
 *   node --test scripts/tableScore.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { freshStraight, applyStraight, freshOnePocket, applyOnePocket } from '../js/ui/wpaScore.js';
import { freshCribbage, applyCribbage, partnerOf } from '../js/ui/cribbageRules.js';

const run = (apply, start, steps) => steps.reduce((s, step) => {
  const [action, arg] = Array.isArray(step) ? step : [step, undefined];
  return apply(s, action, arg);
}, start);

test('straight: point stays, extra needs a point, miss and safety pass with no point', () => {
  let s = applyStraight(freshStraight(), 'point');
  assert.equal(s.you, 1);
  assert.equal(s.turn, 'you');
  assert.equal(s.foulsYou, 0);
  assert.equal(s.opening, false);
  const extraFirst = applyStraight(freshStraight(), 'extra');
  assert.equal(extraFirst.you, 0);
  s = applyStraight(s, 'extra');
  assert.equal(s.you, 2);
  assert.equal(s.turn, 'you');
  assert.equal(s.down, 2);
  s = applyStraight(s, 'miss');
  assert.equal(s.you, 2);
  assert.equal(s.turn, 'opp');
  s = applyStraight(s, 'safety');
  assert.equal(s.opp, 0);
  assert.equal(s.turn, 'you');
  assert.match(s.note, /spotted/i);
});

test('straight: foul and scratch are −1 once, scores may be negative, scratch is a standard foul', () => {
  let s = applyStraight(freshStraight(), 'foul');
  assert.equal(s.you, -1);
  assert.equal(s.foulsYou, 1);
  assert.equal(s.turn, 'opp');
  assert.match(s.note, /stays/i);
  s = applyStraight(freshStraight(), 'scratch');
  assert.equal(s.you, -1);
  assert.equal(s.foulsYou, 1);
  assert.match(s.note, /in hand above the head string/i);
});

test('straight: three standard fouls are −1 then −15, same player breaks, each player has their own count', () => {
  let s = freshStraight();
  s = applyStraight(s, 'foul');
  s = applyStraight(s, 'miss');
  s = applyStraight(s, 'foul');
  assert.equal(s.foulsYou, 2);
  assert.equal(s.foulsOpp, 0);
  assert.equal(s.you, -2);
  s = applyStraight(s, 'miss');
  s = applyStraight(s, 'scratch');
  assert.equal(s.you, -2 - 1 - 15);
  assert.equal(s.foulsYou, 0);
  assert.equal(s.turn, 'you');
  assert.equal(s.opening, true);
  assert.match(s.note, /−15|15/);
});

test('straight: break foul is −2 only, not a third-foul count, then accept or rebreak', () => {
  let s = applyStraight(freshStraight(), 'break-foul');
  assert.equal(s.you, -2);
  assert.equal(s.foulsYou, 0);
  assert.equal(s.needBreakChoice, true);
  assert.equal(s.turn, 'opp');
  const ignored = applyStraight(s, 'foul');
  assert.equal(ignored.you, -2);
  const accepted = applyStraight(s, 'accept');
  assert.equal(accepted.opening, false);
  assert.equal(accepted.turn, 'opp');
  assert.equal(accepted.you, -2);
  const again = applyStraight(s, 'rebreak');
  assert.equal(again.opening, true);
  assert.equal(again.turn, 'you');
  assert.equal(again.breaker, 'you');
  const late = applyStraight(applyStraight(freshStraight(), 'point'), 'break-foul');
  assert.equal(late.you, 1);
  assert.equal(late.needBreakChoice, false);
});

test('straight: 14 down re-racks with the 15th out; the 15th on that same shot re-racks all 15', () => {
  let s = freshStraight();
  for (let i = 0; i < 13; i++) s = applyStraight(s, 'point');
  assert.equal(s.you, 13);
  assert.equal(s.down, 13);
  s = applyStraight(s, 'point');
  assert.equal(s.down, 0);
  assert.equal(s.rackNote, '14');
  assert.equal(s.turn, 'you');
  assert.match(s.note, /apex/i);
  const fifteenth = applyStraight(s, 'extra');
  assert.equal(fifteenth.you, 15);
  assert.equal(fifteenth.rackNote, '15');
  assert.equal(fifteenth.down, 0);
  assert.match(fifteenth.note, /7\.8a/);
  const next = applyStraight(s, 'point');
  assert.equal(next.down, 1);
  assert.equal(next.rackNote, '');
});

test('straight: target locks after a point, first to the score wins, a point clears fouls', () => {
  let s = applyStraight(freshStraight(), 'target', 25);
  assert.equal(s.target, 25);
  s = applyStraight(s, 'foul');
  s = applyStraight(s, 'miss');
  s = applyStraight(s, 'point');
  assert.equal(s.foulsYou, 0);
  assert.equal(s.you, 0);
  const locked = applyStraight(s, 'target', 100);
  assert.equal(locked.target, 25);
  let win = freshStraight();
  win = applyStraight(win, 'target', 25);
  for (let i = 0; i < 25; i++) win = applyStraight(win, 'point');
  assert.equal(win.winner, 'you');
  assert.equal(win.you, 25);
  const stuck = applyStraight(win, 'point');
  assert.equal(stuck.you, 25);
});

test('one pocket: own pocket stays, their pocket ends the turn, scratch does not award their ball', () => {
  let s = applyOnePocket(freshOnePocket(), 'mine');
  assert.equal(s.you, 1);
  assert.equal(s.turn, 'you');
  assert.equal(s.ballInHand, false);
  s = applyOnePocket(s, 'theirs');
  assert.equal(s.opp, 1);
  assert.equal(s.you, 1);
  assert.equal(s.turn, 'opp');
  s = applyOnePocket(freshOnePocket(), 'scratch');
  assert.equal(s.you, 0);
  assert.equal(s.owedYou, 1);
  assert.equal(s.opp, 0);
  assert.equal(s.turn, 'opp');
  assert.equal(s.ballInHand, true);
  const both = applyOnePocket(freshOnePocket(), 'foul-theirs');
  assert.equal(both.opp, 1);
  assert.equal(both.owedYou, 1);
  assert.equal(both.turn, 'opp');
  assert.equal(both.ballInHand, false);
});

test('one pocket: owed ball cancels, both at 7 gives the rack to the shooter, three fouls lose the rack', () => {
  let s = applyOnePocket(freshOnePocket(), 'foul');
  assert.equal(s.owedYou, 1);
  assert.equal(s.turn, 'opp');
  s = applyOnePocket(s, 'miss');
  s = applyOnePocket(s, 'mine');
  assert.equal(s.you, 0);
  assert.equal(s.owedYou, 0);
  assert.equal(s.turn, 'you');
  let tied = freshOnePocket();
  for (let i = 0; i < 7; i++) tied = applyOnePocket(tied, 'mine');
  tied = applyOnePocket(tied, 'both');
  assert.equal(tied.racksYou, 1);
  assert.equal(tied.racksOpp, 0);
  assert.equal(tied.you, 0);
  let third = freshOnePocket();
  third = applyOnePocket(third, 'foul');
  third = applyOnePocket(third, 'miss');
  third = applyOnePocket(third, 'foul');
  third = applyOnePocket(third, 'miss');
  third = applyOnePocket(third, 'scratch');
  assert.equal(third.racksOpp, 1);
  assert.equal(third.racksYou, 0);
  assert.equal(third.foulsYou, 0);
});

test('cribbage pairs and a successive cribbage', () => {
  assert.equal(partnerOf(1), 14);
  assert.equal(partnerOf(8), 7);
  assert.equal(partnerOf(15), null);
  let s = applyCribbage(freshCribbage(), 'stroke', [1]);
  assert.deepEqual(s.on, [1]);
  assert.equal(s.out.includes(1), false);
  assert.equal(s.you, 0);
  assert.equal(s.turn, 'you');
  s = applyCribbage(s, 'stroke', [14]);
  assert.equal(s.you, 1);
  assert.deepEqual(s.on, []);
  assert.equal(s.turn, 'you');
  s = applyCribbage(s, 'miss');
  assert.equal(s.you, 1);
  assert.equal(s.turn, 'opp');
  assert.equal(s.foulsYou, 0);
  assert.equal(s.needChoice, false);
});

test('cribbage: missing the partner is a foul and spots it; scratch is ball in hand, not a choice', () => {
  let s = applyCribbage(freshCribbage(), 'stroke', [1]);
  s = applyCribbage(s, 'miss');
  assert.equal(s.you, 0);
  assert.equal(s.foulsYou, 1);
  assert.equal(s.out.includes(1), true);
  assert.equal(s.needChoice, true);
  assert.equal(s.turn, 'opp');
  const blocked = applyCribbage(s, 'stroke', [2]);
  assert.equal(blocked.out.includes(2), true);
  const hand = applyCribbage(s, 'choice', 'hand');
  assert.equal(hand.needChoice, false);
  assert.equal(hand.ballInHand, true);
  let scr = applyCribbage(freshCribbage(), 'stroke', [4]);
  scr = applyCribbage(scr, 'scratch');
  assert.equal(scr.foulsYou, 1);
  assert.equal(scr.needChoice, false);
  assert.equal(scr.ballInHand, true);
  assert.equal(scr.out.includes(4), true);
  assert.equal(scr.you, 0);
});

test('cribbage: 15 early is spotted and is not a foul; 15 last is a cribbage', () => {
  let s = applyCribbage(freshCribbage(), 'stroke', [15]);
  assert.equal(s.you, 0);
  assert.equal(s.foulsYou, 0);
  assert.equal(s.turn, 'you');
  assert.equal(s.out.includes(15), true);
  assert.match(s.note, /spotted/i);
  s = applyCribbage(s, 'stroke', [1]);
  s = applyCribbage(s, 'stroke', [15]);
  assert.deepEqual(s.on, [1]);
  assert.equal(s.turn, 'you');
  assert.equal(s.foulsYou, 0);
  let last = freshCribbage();
  last.out = [15];
  last.on = [];
  last = applyCribbage(last, 'stroke', [15]);
  assert.equal(last.you, 1);
  assert.equal(last.out.length, 0);
  assert.equal(last.rackOver, true);
});

test('cribbage: several balls on one stroke, a later miss keeps the completed pair', () => {
  let s = applyCribbage(freshCribbage(), 'stroke', [1, 2]);
  assert.deepEqual(s.on, [1, 2]);
  s = applyCribbage(s, 'stroke', [14]);
  assert.equal(s.you, 1);
  assert.deepEqual(s.on, [2]);
  s = applyCribbage(s, 'stroke', [3]);
  assert.equal(s.you, 1);
  assert.equal(s.foulsYou, 1);
  assert.equal(s.out.includes(2), true);
  assert.equal(s.out.includes(3), true);
  assert.equal(s.needChoice, true);
  let both = applyCribbage(freshCribbage(), 'stroke', [1, 2]);
  both = applyCribbage(both, 'stroke', [13, 14]);
  assert.equal(both.you, 2);
  assert.deepEqual(both.on, []);
  let extra = applyCribbage(freshCribbage(), 'stroke', [1]);
  extra = applyCribbage(extra, 'stroke', [14, 3]);
  assert.equal(extra.you, 1);
  assert.deepEqual(extra.on, [3]);
  const same = applyCribbage(freshCribbage(), 'stroke', [1, 14]);
  assert.equal(same.you, 0);
  assert.deepEqual(same.on, []);
  assert.equal(same.out.includes(1), true);
  assert.equal(same.out.includes(14), true);
  assert.equal(same.turn, 'you');
});

test('cribbage: three successive fouls by the same player lose, a legal pocket resets the count, fouls do not subtract', () => {
  let s = freshCribbage();
  s = applyCribbage(s, 'foul');
  s = applyCribbage(s, 'choice', 'position');
  s = applyCribbage(s, 'miss');
  s = applyCribbage(s, 'foul');
  assert.equal(s.foulsYou, 2);
  assert.equal(s.you, 0);
  s = applyCribbage(s, 'choice', 'position');
  s = applyCribbage(s, 'miss');
  s = applyCribbage(s, 'scratch');
  assert.equal(s.winner, 'opp');
  assert.equal(s.you, 0);
  let reset = applyCribbage(freshCribbage(), 'foul');
  reset = applyCribbage(reset, 'choice', 'position');
  reset = applyCribbage(reset, 'miss');
  reset = applyCribbage(reset, 'stroke', [6]);
  assert.equal(reset.foulsYou, 0);
  reset = applyCribbage(reset, 'miss');
  assert.equal(reset.foulsYou, 1);
});

test('cribbage: rack can end 4–4 with neither at 5, and 5 wins immediately', () => {
  let s = freshCribbage();
  const pairs = [[1, 14], [2, 13], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]];
  for (let i = 0; i < 4; i++) {
    s = applyCribbage(s, 'stroke', [pairs[i][0]]);
    s = applyCribbage(s, 'stroke', [pairs[i][1]]);
  }
  assert.equal(s.you, 4);
  s = applyCribbage(s, 'miss');
  for (let i = 4; i < 7; i++) {
    s = applyCribbage(s, 'stroke', [pairs[i][0]]);
    s = applyCribbage(s, 'stroke', [pairs[i][1]]);
  }
  assert.equal(s.opp, 3);
  s = applyCribbage(s, 'stroke', [15]);
  assert.equal(s.opp, 4);
  assert.equal(s.you, 4);
  assert.equal(s.winner, null);
  assert.equal(s.rackOver, true);
  const stuck = applyCribbage(s, 'stroke', [1]);
  assert.equal(stuck.rackOver, true);
  let win = freshCribbage();
  for (let i = 0; i < 5; i++) {
    win = applyCribbage(win, 'stroke', [pairs[i][0]]);
    win = applyCribbage(win, 'stroke', [pairs[i][1]]);
  }
  assert.equal(win.winner, 'you');
  assert.equal(win.you, 5);
  const after = applyCribbage(win, 'stroke', [pairs[5][0]]);
  assert.equal(after.you, 5);
});
