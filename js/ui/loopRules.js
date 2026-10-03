/**
 * Loop table game — pure scoring. No DOM.
 * Solo: strike a numbered ball, carom off the white, pocket the object ball.
 * Score is shots. Lower is better. A scratch never adds an extra shot.
 * 1 vs 1: race to 8. A made ball on a scratch does not score (unlike solo).
 */

export const SOLO_TARGET = 15;
export const PVP_RACE = 8;
export const HISTORY_CAP = 20;

const EVENTS = new Set(['make', 'miss', 'scratch', 'make-scratch']);

export function defaultLoopBag() {
  return {
    gamesPlayed: 0,
    personalBest: null,
    totalShots: 0,
    totalCaroms: 0,
    totalMisses: 0,
    totalScratches: 0,
    bestStreak: 0,
    soloHistory: [],
    pvpHistory: []
  };
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeBag(raw) {
  const d = defaultLoopBag();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
  return {
    ...d,
    ...raw,
    gamesPlayed: num(raw.gamesPlayed),
    personalBest: raw.personalBest == null || raw.personalBest === '' ? null : num(raw.personalBest),
    totalShots: num(raw.totalShots),
    totalCaroms: num(raw.totalCaroms),
    totalMisses: num(raw.totalMisses),
    totalScratches: num(raw.totalScratches),
    bestStreak: num(raw.bestStreak),
    soloHistory: Array.isArray(raw.soloHistory) ? raw.soloHistory.slice(0, HISTORY_CAP) : [],
    pvpHistory: Array.isArray(raw.pvpHistory) ? raw.pvpHistory.slice(0, HISTORY_CAP) : []
  };
}

export function averageScore(bag) {
  const b = normalizeBag(bag);
  if (!b.gamesPlayed) return null;
  return b.totalShots / b.gamesPlayed;
}

export function freshSolo() {
  return {
    balls: 0,
    shots: 0,
    misses: 0,
    scratches: 0,
    streak: 0,
    bestStreak: 0,
    bih: false,
    done: false,
    log: []
  };
}

function cloneSolo(state) {
  const src = state && typeof state === 'object' ? state : {};
  const balls = num(src.balls);
  return {
    balls,
    shots: num(src.shots),
    misses: num(src.misses),
    scratches: num(src.scratches),
    streak: num(src.streak),
    bestStreak: num(src.bestStreak),
    bih: !!src.bih,
    done: !!src.done || balls >= SOLO_TARGET,
    log: Array.isArray(src.log) ? src.log.slice() : []
  };
}

/** One stroke. shots +1 exactly once. No extra penalty shot. Done games ignore the event. */
export function applySolo(state, event) {
  const s = cloneSolo(state);
  if (s.done || s.balls >= SOLO_TARGET) {
    s.done = true;
    s.balls = Math.min(s.balls, SOLO_TARGET);
    return s;
  }
  if (!EVENTS.has(event)) return s;
  s.shots += 1;
  if (event === 'make') {
    s.balls += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.bih = false;
  } else if (event === 'miss') {
    s.misses += 1;
    s.streak = 0;
    s.bih = false;
  } else if (event === 'scratch') {
    s.scratches += 1;
    s.streak = 0;
    s.bih = true;
  } else if (event === 'make-scratch') {
    s.balls += 1;
    s.scratches += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.bih = true;
  }
  if (s.balls >= SOLO_TARGET) {
    s.balls = SOLO_TARGET;
    s.done = true;
  }
  s.log.push(event);
  return s;
}

/** Drop the last stroke and replay. Restores balls, shots, streak, and bih. */
export function undoSolo(state) {
  const s = cloneSolo(state);
  if (!s.log.length) return s;
  let next = freshSolo();
  for (const e of s.log.slice(0, -1)) next = applySolo(next, e);
  return next;
}

/** Ball in hand was placed. Not a shot. */
export function placeSolo(state) {
  const s = cloneSolo(state);
  if (!s.bih || s.done) return s;
  s.bih = false;
  return s;
}

/**
 * Record a finished solo game (15 balls). Personal best is the lowest shot total.
 * First finish is a personal best. An equal score is not a new best.
 */
export function finishSolo(bag, solo, date = new Date().toISOString()) {
  const b = normalizeBag(bag);
  if (!solo || !solo.done || num(solo.balls) < SOLO_TARGET) return { bag: b, newBest: false, recorded: false };
  const shots = num(solo.shots);
  const prev = b.personalBest;
  const newBest = prev == null || shots < prev;
  const entry = {
    shots,
    misses: num(solo.misses),
    scratches: num(solo.scratches),
    bestStreak: num(solo.bestStreak),
    date,
    newBest
  };
  return {
    bag: {
      ...b,
      gamesPlayed: b.gamesPlayed + 1,
      personalBest: newBest ? shots : prev,
      totalShots: b.totalShots + shots,
      totalCaroms: b.totalCaroms + num(solo.balls),
      totalMisses: b.totalMisses + num(solo.misses),
      totalScratches: b.totalScratches + num(solo.scratches),
      bestStreak: Math.max(b.bestStreak, num(solo.bestStreak)),
      soloHistory: [entry, ...b.soloHistory].slice(0, HISTORY_CAP)
    },
    newBest,
    recorded: true
  };
}

export function freshPvp() {
  return {
    scores: [0, 0],
    turn: 0,
    bih: false,
    done: false,
    winner: null,
    streaks: [0, 0],
    log: []
  };
}

function clonePvp(state) {
  const src = state && typeof state === 'object' ? state : {};
  const scores = Array.isArray(src.scores) ? [num(src.scores[0]), num(src.scores[1])] : [num(src.p1), num(src.p2)];
  const streaks = Array.isArray(src.streaks) ? [num(src.streaks[0]), num(src.streaks[1])] : [0, 0];
  const turn = src.turn === 1 ? 1 : 0;
  let winner = src.winner === 0 || src.winner === 1 ? src.winner : null;
  if (winner == null) {
    if (scores[0] >= PVP_RACE) winner = 0;
    else if (scores[1] >= PVP_RACE) winner = 1;
  }
  const done = !!src.done || scores[0] >= PVP_RACE || scores[1] >= PVP_RACE;
  return {
    scores,
    turn,
    bih: !!src.bih,
    done,
    winner: done ? winner : null,
    streaks,
    log: Array.isArray(src.log) ? src.log.slice() : []
  };
}

/**
 * 1 vs 1. make continues. miss switches with no ball in hand.
 * scratch and make-scratch: no point, turn ends, opponent has ball in hand.
 */
export function applyPvp(state, event) {
  const s = clonePvp(state);
  if (s.done || s.scores[0] >= PVP_RACE || s.scores[1] >= PVP_RACE) {
    s.done = true;
    if (s.winner == null) s.winner = s.scores[0] >= PVP_RACE ? 0 : 1;
    return s;
  }
  if (!EVENTS.has(event)) return s;
  const t = s.turn;
  if (event === 'make') {
    s.scores[t] += 1;
    s.streaks[t] += 1;
    s.bih = false;
  } else if (event === 'miss') {
    s.streaks[t] = 0;
    s.turn = t ^ 1;
    s.bih = false;
  } else if (event === 'scratch' || event === 'make-scratch') {
    s.streaks[t] = 0;
    s.turn = t ^ 1;
    s.bih = true;
  }
  if (s.scores[0] >= PVP_RACE || s.scores[1] >= PVP_RACE) {
    s.done = true;
    s.winner = s.scores[0] >= PVP_RACE ? 0 : 1;
    s.bih = false;
  }
  s.log.push(event);
  return s;
}

export function undoPvp(state) {
  const s = clonePvp(state);
  if (!s.log.length) return s;
  let next = freshPvp();
  for (const e of s.log.slice(0, -1)) next = applyPvp(next, e);
  return next;
}

export function placePvp(state) {
  const s = clonePvp(state);
  if (!s.bih || s.done) return s;
  s.bih = false;
  return s;
}

/** winner is 1 or 2. Call once when someone first reaches 8. */
export function recordPvp(bag, pvp, date = new Date().toISOString()) {
  const b = normalizeBag(bag);
  if (!pvp || !pvp.done || (pvp.winner !== 0 && pvp.winner !== 1)) return { bag: b, recorded: false };
  const scores = Array.isArray(pvp.scores) ? pvp.scores : [pvp.p1, pvp.p2];
  const entry = { p1: num(scores[0]), p2: num(scores[1]), winner: pvp.winner + 1, date };
  return {
    bag: { ...b, pvpHistory: [entry, ...b.pvpHistory].slice(0, HISTORY_CAP) },
    recorded: true
  };
}
