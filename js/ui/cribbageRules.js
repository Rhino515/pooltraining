/**
 * Cribbage pool scorekeeper. Not in the WPA Rules of Play.
 * BCA Official Rules and Record Book (1992), pp. 75–76.
 * Pure. Not a referee. Does not place balls on the table.
 */

export const PAIRS = [[1, 14], [2, 13], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]];

export function partnerOf(n) {
  for (const [a, b] of PAIRS) {
    if (n === a) return b;
    if (n === b) return a;
  }
  return null;
}

export function freshCribbage() {
  return {
    you: 0,
    opp: 0,
    turn: 'you',
    out: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    on: [],
    foulsYou: 0,
    foulsOpp: 0,
    needChoice: false,
    ballInHand: false,
    winner: null,
    rackOver: false,
    note: ''
  };
}

function clone(s) {
  return { ...s, out: s.out.slice(), on: s.on.slice() };
}

const other = (t) => (t === 'you' ? 'opp' : 'you');

function clearFouls(s) {
  if (s.turn === 'you') s.foulsYou = 0;
  else s.foulsOpp = 0;
}

function spotBack(s, balls) {
  const add = balls.filter((n) => !s.out.includes(n));
  if (add.length) s.out = [...s.out, ...add].sort((a, b) => a - b);
}

function endInning(s, { foul, scratch, base }) {
  const who = s.turn;
  const unpaired = s.on.slice();
  if (unpaired.length) {
    spotBack(s, unpaired);
    s.on = [];
  }
  let note = base || '';
  if (unpaired.length) note = `${note} Spotted ${unpaired.join(', ')}.`.trim();
  if (foul) {
    const fk = who === 'you' ? 'foulsYou' : 'foulsOpp';
    s[fk] += 1;
    if (s[fk] >= 3) {
      s.winner = other(who);
      s.needChoice = false;
      s.ballInHand = false;
      s.note = `${note} Three successive fouls. Loss of game.`.trim();
      return s;
    }
  } else clearFouls(s);
  s.turn = other(who);
  if (scratch) {
    s.needChoice = false;
    s.ballInHand = true;
    s.note = `${note} Scratch. Cue ball in hand behind the head string for the incoming player.`.trim();
  } else if (foul) {
    s.needChoice = true;
    s.ballInHand = false;
    s.note = `${note} Foul. No point lost. Incoming player chooses shoot from position or cue ball in hand behind the head string.`.trim();
  } else {
    s.needChoice = false;
    s.ballInHand = false;
    s.note = note || 'Miss. Inning over. No foul.';
  }
  return s;
}

function maybeOver(s) {
  if (!s.winner && !s.out.length && !s.on.length && s.you < 5 && s.opp < 5) s.rackOver = true;
  return s;
}

/** stroke (arg = balls on that stroke), miss, foul, scratch, choice ('position'|'hand'). */
export function applyCribbage(state, action, arg) {
  const s = clone(state);
  if (s.winner || s.rackOver) return s;
  if (s.needChoice) {
    if (action === 'choice') {
      s.needChoice = false;
      s.ballInHand = arg === 'hand';
      s.note = arg === 'hand'
        ? 'Cue ball in hand behind the head string.'
        : 'Incoming player shoots from position.';
    }
    return s;
  }
  if (action === 'miss') {
    if (s.on.length) return endInning(s, { foul: true, scratch: false, base: 'Required partner was not pocketed. That cribbage does not count.' });
    return endInning(s, { foul: false, scratch: false, base: 'Miss. Inning over. No foul.' });
  }
  if (action === 'foul') return endInning(s, { foul: true, scratch: false, base: 'Foul.' });
  if (action === 'scratch') return endInning(s, { foul: true, scratch: true, base: 'Scratch.' });
  if (action !== 'stroke') return s;

  const pocketed = [...new Set((Array.isArray(arg) ? arg : [arg]).map(Number))].filter((n) => s.out.includes(n));
  if (!pocketed.length) return s;

  const who = s.turn;
  const otherOut = s.out.some((b) => b !== 15);
  let work = pocketed.slice();
  let fifteen = '';
  if (work.includes(15) && otherOut) {
    work = work.filter((b) => b !== 15);
    fifteen = '15 spotted. Not a foul. No point. The inning continues.';
  }
  if (!work.length) {
    clearFouls(s);
    s.note = fifteen;
    return s;
  }
  if (work.length === 1 && work[0] === 15 && !s.on.length && !otherOut) {
    clearFouls(s);
    s.out = s.out.filter((b) => b !== 15);
    s[who] += 1;
    s.note = '15 is a cribbage by itself. Every other object ball was already pocketed.';
    if (s[who] >= 5) s.winner = who;
    return maybeOver(s);
  }

  // Two partners on the same stroke are not successive. They do not count and stay on the table.
  let deadNote = '';
  if (!s.on.length) {
    const inStroke = new Set(work);
    const dead = work.filter((b) => {
      const p = partnerOf(b);
      return p && inStroke.has(p);
    });
    if (dead.length) {
      work = work.filter((b) => !dead.includes(b));
      deadNote = `${dead.join(' and ')} were pocketed on the same stroke, so that is not a successive cribbage. Those balls are spotted and stay up.`;
    }
  }
  if (!work.length) {
    clearFouls(s);
    s.note = [fifteen, deadNote].filter(Boolean).join(' ');
    return s;
  }

  if (s.on.length) {
    const completes = work.filter((b) => s.on.includes(partnerOf(b)));
    if (!completes.length) {
      const base = [fifteen, 'Required partner was not pocketed. That cribbage does not count.'].filter(Boolean).join(' ');
      return endInning(s, { foul: true, scratch: false, base });
    }
  }

  clearFouls(s);
  const on = s.on.slice();
  let gained = 0;
  const removed = [];
  const added = [];
  if (on.length) {
    for (const b of work) {
      const idx = on.indexOf(partnerOf(b));
      if (idx >= 0) {
        on.splice(idx, 1);
        gained += 1;
      } else added.push(b);
      removed.push(b);
    }
  } else {
    for (const b of work) {
      if (b === 15) continue;
      added.push(b);
      removed.push(b);
    }
  }
  s.out = s.out.filter((b) => !removed.includes(b));
  s.on = on.concat(added);
  s[who] += gained;
  const need = s.on.map((b) => partnerOf(b)).filter((n) => n != null);
  const bits = [fifteen, deadNote];
  if (gained) bits.push(`${gained} cribbage${gained === 1 ? '' : 's'}.`);
  if (s.on.length) bits.push(`On ${s.on.join(', ')}. Need ${need.join(' or ')}.`);
  else if (gained) bits.push('Inning continues.');
  s.note = bits.filter(Boolean).join(' ');
  if (s[who] >= 5) {
    s.winner = who;
    return s;
  }
  return maybeOver(s);
}
