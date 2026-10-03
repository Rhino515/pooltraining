/**
 * Straight pool (§7) and one pocket (§12) scoring.
 * WPA Rules of Play, effective 2025-09-15, file 2026.01.02.
 * Pure. Not a referee. No DOM.
 */

export const STRAIGHT_TARGETS = [25, 50, 75, 100, 125];
export const RACK_RACES = [3, 5, 7, 9];

const other = (t) => (t === 'you' ? 'opp' : 'you');
const foulKey = (t) => (t === 'you' ? 'foulsYou' : 'foulsOpp');

export function freshStraight() {
  return {
    target: 50,
    you: 0,
    opp: 0,
    turn: 'you',
    foulsYou: 0,
    foulsOpp: 0,
    down: 0,
    canExtra: false,
    fourteenOpen: false,
    rackNote: '',
    opening: true,
    breaker: 'you',
    needBreakChoice: false,
    scored: false,
    winner: null,
    note: ''
  };
}

function addLegal(s) {
  const who = s.turn;
  s[who] += 1;
  s.scored = true;
  s[foulKey(who)] = 0;
  s.opening = false;
  if (s[who] >= s.target) {
    s.winner = who;
    s.canExtra = false;
    s.fourteenOpen = false;
    s.note = '';
    return s;
  }
  if (s.fourteenOpen) {
    s.fourteenOpen = false;
    s.canExtra = false;
    s.down = 0;
    s.rackNote = '15';
    s.note = 'RE-RACK: the 15th was pocketed on the same shot as the 14th. All 15 balls are re-racked (§7.8a). The shooter continues.';
    return s;
  }
  s.down += 1;
  s.canExtra = true;
  if (s.down >= 14) {
    s.down = 0;
    s.fourteenOpen = true;
    s.rackNote = '14';
    s.note = 'RE-RACK: rack those 14 with the apex left out. The 15th stays down. The shooter continues.';
  }
  return s;
}

function standardFoul(s, kind) {
  const who = s.turn;
  s.rackNote = '';
  s.fourteenOpen = false;
  s.canExtra = false;
  s.down = 0;
  s[who] -= 1;
  const fk = foulKey(who);
  s[fk] += 1;
  s.opening = false;
  if (s[fk] >= 3) {
    s[who] -= 15;
    s[fk] = 0;
    s.opening = true;
    s.breaker = who;
    s.turn = who;
    s.down = 0;
    s.note = 'Three standard fouls. −1 for the third foul, then −15. All 15 are re-racked. That player shoots an opening break, cue ball in hand above the head string (§7.11).';
    return s;
  }
  s.note = kind === 'scratch'
    ? 'Scratch. −1. Cue ball in hand above the head string. Turn passes.'
    : 'Foul. −1. Cue ball stays in place. Turn passes.';
  s.turn = other(who);
  return s;
}

function breakFoul(s) {
  if (!s.opening) return s;
  const who = s.turn;
  s[who] -= 2;
  s.canExtra = false;
  s.fourteenOpen = false;
  s.rackNote = '';
  s.down = 0;
  s.needBreakChoice = true;
  s.breaker = who;
  s.turn = other(who);
  s.note = 'Breaking foul. −2. It does not count toward three fouls. If a standard foul happened on the same shot, it is only this breaking foul. Incoming player accepts the table or requires another opening break.';
  return s;
}

/** action: target, breaker, point, extra, miss, safety, foul, scratch, break-foul, accept, rebreak */
export function applyStraight(state, action, arg) {
  const s = { ...state };
  if (s.winner) return s;
  if (action === 'target') {
    const n = Number(arg);
    if (!s.scored && STRAIGHT_TARGETS.includes(n)) s.target = n;
    return s;
  }
  if (action === 'breaker' && !s.scored && s.you === 0 && s.opp === 0 && s.opening && !s.needBreakChoice && s.foulsYou === 0 && s.foulsOpp === 0) {
    s.breaker = arg === 'opp' ? 'opp' : 'you';
    s.turn = s.breaker;
    return s;
  }
  if (s.needBreakChoice) {
    if (action === 'accept') {
      s.needBreakChoice = false;
      s.opening = false;
      s.note = 'Table accepted. Incoming player shoots the balls in position.';
    } else if (action === 'rebreak') {
      s.needBreakChoice = false;
      s.opening = true;
      s.turn = s.breaker;
      s.down = 0;
      s.fourteenOpen = false;
      s.canExtra = false;
      s.rackNote = '';
      s.note = 'Another opening break. Cue ball in hand above the head string. All 15 balls are racked.';
    }
    return s;
  }
  if (action === 'extra') {
    if (!s.canExtra) return s;
    return addLegal(s);
  }
  s.fourteenOpen = false;
  s.canExtra = false;
  s.rackNote = '';
  if (action === 'point') return addLegal(s);
  if (action === 'miss') {
    s[foulKey(s.turn)] = 0;
    s.opening = false;
    s.rackNote = '';
    s.note = 'Miss. Turn passes.';
    s.turn = other(s.turn);
    return s;
  }
  if (action === 'safety') {
    s[foulKey(s.turn)] = 0;
    s.opening = false;
    s.rackNote = '';
    s.note = 'Safety. Turn passes. Any object ball pocketed on a safety is spotted. No point.';
    s.turn = other(s.turn);
    return s;
  }
  if (action === 'foul' || action === 'scratch') return standardFoul(s, action);
  if (action === 'break-foul') return breakFoul(s);
  return s;
}

export function freshOnePocket() {
  return {
    race: 3,
    you: 0,
    opp: 0,
    racksYou: 0,
    racksOpp: 0,
    owedYou: 0,
    owedOpp: 0,
    foulsYou: 0,
    foulsOpp: 0,
    turn: 'you',
    youBreak: true,
    pocket: 'left',
    winner: null,
    ballInHand: true,
    rackLive: false,
    note: ''
  };
}

function credit(s, who) {
  const owed = who === 'you' ? 'owedYou' : 'owedOpp';
  if (s[owed] > 0) s[owed] -= 1;
  else s[who] += 1;
}

function penalize(s, who) {
  if (s[who] > 0) s[who] -= 1;
  else s[who === 'you' ? 'owedYou' : 'owedOpp'] += 1;
}

function giveRack(s, to) {
  if (to === 'you') s.racksYou += 1;
  else s.racksOpp += 1;
  s.you = 0;
  s.opp = 0;
  s.owedYou = 0;
  s.owedOpp = 0;
  s.foulsYou = 0;
  s.foulsOpp = 0;
  s.youBreak = !s.youBreak;
  s.turn = s.youBreak ? 'you' : 'opp';
  s.ballInHand = true;
  s.rackLive = false;
  s.note = `${to === 'you' ? 'You' : 'Opponent'} won the rack. Breaks alternate. Cue ball in hand above the head string.`;
  if (s.racksYou >= s.race || s.racksOpp >= s.race) {
    s.note = `${s.racksYou >= s.race ? 'You' : 'Opponent'} won the match.`;
  }
  if (s.racksYou >= s.race) s.winner = 'you';
  else if (s.racksOpp >= s.race) s.winner = 'opp';
}

function bumpFoul(s, who) {
  const fk = foulKey(who);
  s[fk] += 1;
  return s[fk] >= 3;
}

/** action: mine, theirs, both, miss, foul, scratch, foul-theirs, race, lag, pocket */
export function applyOnePocket(state, action, arg) {
  const s = { ...state };
  if (s.winner) return s;
  if (action === 'race') {
    const n = Number(arg);
    if (RACK_RACES.includes(n) && n > Math.max(s.racksYou, s.racksOpp)) s.race = n;
    return s;
  }
  if (action === 'lag' && !s.racksYou && !s.racksOpp && !s.you && !s.opp && !s.rackLive) {
    s.youBreak = arg !== 'opp' && arg !== '0';
    s.turn = s.youBreak ? 'you' : 'opp';
    s.ballInHand = true;
    return s;
  }
  if (action === 'pocket' && !s.rackLive) {
    s.pocket = arg === 'right' ? 'right' : 'left';
    return s;
  }
  if (action === 'mine' || action === 'theirs' || action === 'both' || action === 'miss' || action === 'foul' || action === 'scratch' || action === 'foul-theirs') {
    const who = s.turn;
    const opp = other(who);
    s.rackLive = true;
    if (action === 'mine' || action === 'theirs' || action === 'both' || action === 'miss') s[foulKey(who)] = 0;
    if (action === 'mine') {
      credit(s, who);
      s.ballInHand = false;
      s.note = '';
      if (s[who] >= 8) giveRack(s, who);
      return s;
    }
    if (action === 'theirs') {
      credit(s, opp);
      s.ballInHand = false;
      s.note = 'Ball in the opponent’s foot pocket. Their point. Your turn ends.';
      if (s[opp] >= 8) giveRack(s, opp);
      else s.turn = opp;
      return s;
    }
    if (action === 'both') {
      credit(s, who);
      credit(s, opp);
      s.ballInHand = false;
      s.note = '';
      if (s[who] >= 8) giveRack(s, who);
      else if (s[opp] >= 8) giveRack(s, opp);
      return s;
    }
    if (action === 'miss') {
      s.ballInHand = false;
      s.note = 'Miss. Turn ends. Shoot from the table, not ball in hand.';
      s.turn = opp;
      return s;
    }
    if (action === 'foul' || action === 'scratch' || action === 'foul-theirs') {
      if (action === 'foul-theirs') credit(s, opp);
      penalize(s, who);
      const third = bumpFoul(s, who);
      if (action === 'foul-theirs' && s[opp] >= 8) {
        giveRack(s, opp);
        s.note = 'Foul, and that ball counts for the opponent. It is not spotted (§12.5). ' + s.note;
        return s;
      }
      if (third) {
        giveRack(s, opp);
        s.note = 'Three standard fouls in a row. Opponent wins the rack (§12.9). ' + s.note;
        return s;
      }
      s.turn = opp;
      if (action === 'scratch') {
        s.ballInHand = true;
        s.note = 'Scratch. −1. A ball that fell in the opponent’s pocket on a scratch does not count (§12.5). Cue ball in hand above the head string.';
      } else if (action === 'foul-theirs') {
        s.ballInHand = false;
        s.note = 'Foul, and that ball counts for the opponent. It is not spotted. Cue ball stays. −1 for you (§12.5).';
      } else {
        s.ballInHand = false;
        s.note = 'Foul. −1, or a ball owed if you had none. Cue ball stays. Turn ends.';
      }
      return s;
    }
  }
  return s;
}
