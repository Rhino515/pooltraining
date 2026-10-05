/**
 * Kick Safe table game — pure scoring. No DOM, no Career XP.
 * Points come only from the opponent's fouls. Pocketed balls are spotted and do not score.
 * 1 vs 1 is a race. Solo practice stats stay separate from match history.
 */

export const RACES = [3, 5, 7, 10];
export const DEFAULT_RACE = 5;
export const HISTORY_CAP = 20;
const RAILS = new Set([1, 2, 3, 4]);

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function emptySolo() {
  return {
    attempts: 0,
    success: 0,
    fail: 0,
    scratch: 0,
    streak: 0,
    bestStreak: 0,
    rails: {
      1: { attempts: 0, success: 0 },
      2: { attempts: 0, success: 0 },
      3: { attempts: 0, success: 0 },
      4: { attempts: 0, success: 0 }
    }
  };
}

export function defaultKickSafeBag() {
  return {
    race: DEFAULT_RACE,
    pvpHistory: [],
    solo: emptySolo()
  };
}

function normalizeSolo(raw) {
  const d = emptySolo();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
  const rails = { ...d.rails };
  const src = raw.rails && typeof raw.rails === 'object' ? raw.rails : {};
  for (const k of [1, 2, 3, 4]) {
    const row = src[k] || src[String(k)] || {};
    rails[k] = { attempts: num(row.attempts), success: num(row.success) };
  }
  return {
    attempts: num(raw.attempts),
    success: num(raw.success),
    fail: num(raw.fail),
    scratch: num(raw.scratch),
    streak: num(raw.streak),
    bestStreak: num(raw.bestStreak),
    rails
  };
}

export function normalizeBag(raw) {
  const d = defaultKickSafeBag();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return d;
  const race = RACES.includes(Number(raw.race)) ? Number(raw.race) : DEFAULT_RACE;
  return {
    race,
    pvpHistory: Array.isArray(raw.pvpHistory) ? raw.pvpHistory.slice(0, HISTORY_CAP) : [],
    solo: normalizeSolo(raw.solo)
  };
}

export function railKey(rails) {
  if (rails === '4+') return 4;
  const n = Number(rails);
  return RAILS.has(n) ? n : null;
}

/** Integer percent. 0 when there are no attempts. */
export function percent(success, attempts) {
  const a = num(attempts);
  if (a <= 0) return 0;
  return Math.round((100 * num(success)) / a);
}

export function railPercent(solo, rails) {
  const key = railKey(rails);
  const row = normalizeSolo(solo).rails[key];
  if (!row) return 0;
  return percent(row.success, row.attempts);
}

export function overallPercent(solo) {
  const s = normalizeSolo(solo);
  return percent(s.success, s.attempts);
}

/**
 * One solo attempt. rails is 1, 2, 3, or 4 (4+).
 * result is success, fail, or scratch.
 * A streak is consecutive successful escapes. A fail or a scratch breaks it.
 */
export function logSolo(solo, rails, result) {
  const s = normalizeSolo(solo);
  const key = railKey(rails);
  if (!key || (result !== 'success' && result !== 'fail' && result !== 'scratch')) return s;
  s.attempts += 1;
  s.rails[key].attempts += 1;
  if (result === 'success') {
    s.success += 1;
    s.rails[key].success += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  } else if (result === 'fail') {
    s.fail += 1;
    s.streak = 0;
  } else {
    s.scratch += 1;
    s.streak = 0;
  }
  return s;
}

export function freshMatch(race = DEFAULT_RACE) {
  const r = RACES.includes(Number(race)) ? Number(race) : DEFAULT_RACE;
  return {
    scores: [0, 0],
    turn: 0,
    ball: 1,
    race: r,
    fouls: 0,
    scratches: 0,
    kickOk: 0,
    kickFail: 0,
    safeties: 0,
    hooks: 0,
    done: false,
    winner: null,
    log: []
  };
}

function cloneMatch(state) {
  const src = state && typeof state === 'object' ? state : {};
  const scores = Array.isArray(src.scores) ? [num(src.scores[0]), num(src.scores[1])] : [0, 0];
  const race = RACES.includes(Number(src.race)) ? Number(src.race) : DEFAULT_RACE;
  const ball = Math.min(9, Math.max(1, num(src.ball) || 1));
  const turn = src.turn === 1 ? 1 : 0;
  let winner = src.winner === 0 || src.winner === 1 ? src.winner : null;
  const done = !!src.done || scores[0] >= race || scores[1] >= race;
  if (done && winner == null) winner = scores[0] >= race ? 0 : 1;
  return {
    scores,
    turn,
    ball,
    race,
    fouls: num(src.fouls),
    scratches: num(src.scratches),
    kickOk: num(src.kickOk),
    kickFail: num(src.kickFail),
    safeties: num(src.safeties),
    hooks: num(src.hooks),
    done,
    winner: done ? winner : null,
    log: Array.isArray(src.log) ? src.log.map((e) => ({ ...e })) : []
  };
}

function endIfRace(s, before) {
  if (s.scores[0] < s.race && s.scores[1] < s.race) return s;
  s.done = true;
  if (s.scores[0] >= s.race && s.scores[0] !== before[0]) s.winner = 0;
  else if (s.scores[1] >= s.race && s.scores[1] !== before[1]) s.winner = 1;
  else s.winner = s.scores[0] >= s.race ? 0 : 1;
  return s;
}

/**
 * 1 vs 1. The opponent scores only on foul or scratch (1 point).
 * A pocketed object ball is spotted and does not score. There is no ball-in-hand win and no rack win.
 * safety / hook / pass switch the shooter. kick and kick-miss leave the shooter in place.
 */
export function applyMatch(state, action, arg) {
  const s = cloneMatch(state);
  if (s.done) return s;
  if (action === 'ball') {
    const n = num(arg);
    if (n >= 1 && n <= 9) s.ball = n;
    return s;
  }
  if (action === 'pocket') {
    s.log.push({ a: 'pocket' });
    return s;
  }
  const before = s.scores.slice();
  const opp = s.turn ^ 1;
  if (action === 'safety') {
    s.safeties += 1;
    s.turn = opp;
  } else if (action === 'hook') {
    s.hooks += 1;
    s.turn = opp;
  } else if (action === 'kick') {
    s.kickOk += 1;
  } else if (action === 'kick-miss') {
    s.kickFail += 1;
  } else if (action === 'foul') {
    s.scores[opp] += 1;
    s.fouls += 1;
    s.turn = opp;
  } else if (action === 'scratch') {
    s.scores[opp] += 1;
    s.fouls += 1;
    s.scratches += 1;
    s.turn = opp;
  } else if (action === 'pass') {
    s.turn = opp;
  } else {
    return s;
  }
  const entry = arg === undefined ? { a: action } : { a: action, arg };
  s.log.push(entry);
  return endIfRace(s, before);
}

export function undoMatch(state) {
  const s = cloneMatch(state);
  if (!s.log.length) return s;
  const ball = s.ball;
  const race = s.race;
  const events = s.log.slice(0, -1);
  let next = freshMatch(race);
  next.ball = ball;
  for (const e of events) next = applyMatch(next, e.a, e.arg);
  next.ball = ball;
  return next;
}

/** winner is 1 or 2. Call once when someone first reaches the race. */
export function recordMatch(bag, match, date = new Date().toISOString()) {
  const b = normalizeBag(bag);
  if (!match || !match.done || (match.winner !== 0 && match.winner !== 1)) return { bag: b, recorded: false };
  const scores = Array.isArray(match.scores) ? match.scores : [0, 0];
  const entry = { p1: num(scores[0]), p2: num(scores[1]), winner: match.winner + 1, race: match.race, date };
  return {
    bag: { ...b, pvpHistory: [entry, ...b.pvpHistory].slice(0, HISTORY_CAP) },
    recorded: true
  };
}
