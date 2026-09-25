/**
 * Pool IQ game engine — pure functions over the saved state.
 * Sessions are reducers over a list of recorded attempts, so undo = drop the last attempt.
 * Every attempt carries resultSource ('manual' today; a camera adapter can supply 'camera' later).
 */
import { getGame, getStages, getStage, stageSpecs, GAMES, getBoss } from './registry.js';
import { recordCalibration, travelFromStop, lagEndpoint } from './speed.js';
import { buildLag } from './builders.js';
import { getDrillById } from '../drills.js';

export const RESULT_SOURCE_MANUAL = 'manual';

// ------------------------------------------------------------------ state helpers
export function gameState(state, gameId) {
  return (state.games && state.games[gameId]) || { stages: {}, pb: {}, sessions: [] };
}

export function stageRecord(state, gameId, stageId) {
  return gameState(state, gameId).stages[stageId] || null;
}

/** Level = number of consecutive stages passed from the first */
export function gameLevel(state, gameId) {
  if (gameId === 'ghost') return ghostLevel(state);
  const specs = stageSpecs(gameId);
  let lvl = 0;
  for (const s of specs) {
    if (stageRecord(state, gameId, s.id)?.passed) lvl++;
    else break;
  }
  return lvl;
}

export function ghostBeaten(state, balls, race = 3) {
  // N-ball (rotation) Ghost only — 8-Ball Ghost wins never satisfy an N-ball requirement
  return (state.ghostMatches || []).some((m) => m.won && m.mode !== 'eight' && m.balls >= balls && (m.race || 5) >= race);
}

/** Ghost "level": highest N-ball ghost beaten in a race to 3+ (3-ball = level 1) */
export function ghostLevel(state) {
  let lvl = 0;
  for (let n = 3; n <= 9; n++) {
    if (ghostBeaten(state, n, 3)) lvl = n - 2;
    else break;
  }
  return lvl;
}

export function maxGhostBalls(state) {
  const byProgress = Math.min(9, 3 + ghostLevel(state));
  return Math.max(byProgress, Math.min(9, state.ghostUnlockFloor || 3));
}

export function isGameUnlocked(state, gameId) {
  const def = getGame(gameId);
  if (!def) return false;
  const u = def.unlock;
  if (!u) return true;
  if (u.rank != null && (state.rankIndex || 0) >= u.rank) return true;
  if (u.game && gameLevel(state, u.game) >= u.level) return true;
  return false;
}

export function unlockLabel(gameId) {
  const u = getGame(gameId)?.unlock;
  if (!u) return '';
  return u.label || (u.game ? `${getGame(u.game)?.name} Level ${u.level}` : `Rank ${u.rank + 1}`);
}

export function isStageUnlocked(state, gameId, stageId) {
  if (!isGameUnlocked(state, gameId)) return false;
  const specs = stageSpecs(gameId);
  const i = specs.findIndex((s) => s.id === stageId);
  if (i < 0) return false;
  if (i === 0) return true;
  return !!stageRecord(state, gameId, specs[i - 1].id)?.passed;
}

export function isEndlessUnlocked(state, gameId) {
  const def = getGame(gameId);
  if (!def?.endless) return false;
  return gameLevel(state, gameId) >= def.stages.length;
}

export function totalStars(state, gameId = null) {
  let t = 0;
  for (const g of GAMES) {
    if (gameId && g.id !== gameId) continue;
    const gs = gameState(state, g.id);
    for (const r of Object.values(gs.stages || {})) t += r.bestStars || 0;
  }
  return t;
}

export function maxStars(gameId) {
  return stageSpecs(gameId).length * 3;
}

/** First stage the player has not passed (and is unlocked), or null */
export function nextOpenStage(state, gameId) {
  for (const s of stageSpecs(gameId)) {
    if (!stageRecord(state, gameId, s.id)?.passed) return isStageUnlocked(state, gameId, s.id) ? s : null;
  }
  return null;
}

// ------------------------------------------------------------------ sessions
export function newSession(gameId, stageId, opts = {}) {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    gameId,
    stageId,
    startedAt: new Date().toISOString(),
    attempts: [],
    endless: !!opts.endless,
    bossId: opts.bossId || null,
    queue: opts.queue || null,
    plan: null,
    planLocked: false
  };
}

export function recordAttempt(session, outcome, extra = {}) {
  return {
    ...session,
    attempts: [...session.attempts, { ...outcome, t: new Date().toISOString(), resultSource: extra.resultSource || RESULT_SOURCE_MANUAL }]
  };
}

export function undoAttempt(session) {
  return { ...session, attempts: session.attempts.slice(0, -1) };
}

export function stageFor(session) {
  if (session.bossId) return null;
  if (session.gameId === 'drills') return getDrillById(session.stageId);
  return getStage(session.gameId, session.stageId);
}

/** Current lag challenge for ladder sessions */
const ladderCache = {};
export function ladderRungChallenge(speed) {
  const key = String(speed);
  if (!ladderCache[key]) {
    ladderCache[key] = buildLag({ id: `ladder-${key}`, name: `Ladder SPEED ${speed.toFixed(1)}`, speed, cue: [5, speed % 1 ? 18 : 32], difficulty: Math.round(speed * 2), note: { route: `Rung ${speed.toFixed(1)} of the ladder.` } }, { game: 'speed' });
  }
  return ladderCache[key];
}

/** Endless bank queue: shuffled by increasing difficulty */
export function endlessChallenge(session, index) {
  const stages = getStages(session.gameId).filter((s) => s.kind === 'bank');
  const sorted = stages.slice().sort((a, b) => a.difficulty - b.difficulty);
  const band = Math.min(sorted.length - 1, Math.floor(index / 2));
  const lo = Math.max(0, band - 2);
  const pool = sorted.slice(lo, band + 1);
  // deterministic pseudo-random pick per index so reloads show the same layout
  const seed = (session.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + index * 7919) % 9973;
  return pool[seed % pool.length];
}

/**
 * Evaluate a session: score, lives, multiplier, progress, pass/fail.
 */
export function evaluateSession(session, stage = stageFor(session)) {
  if (session.bossId) return evaluateBoss(session);
  const rules = stage?.scoringRules || {};
  const mode = session.endless ? 'lives' : rules.mode;
  const A = session.attempts;
  const N = session.endless ? Infinity : stage.attemptCount || rules.attempts || 5;
  const pass = stage?.passingRequirement || {};
  const r = { mode, score: 0, attemptsUsed: A.length, attemptsTotal: N, over: false, passed: false, lives: null, multiplier: null, streak: 0 };
  if (mode === 'zone') {
    const requirePocket = rules.requirePocket !== false;
    let stars = 0;
    let pockets = 0;
    for (const a of A) {
      if (requirePocket) {
        if (a.pocketed) {
          pockets++;
          stars += a.stars || 0;
          r.score += 100 + 50 * (a.stars || 0);
        }
      } else {
        stars += a.stars || 0;
        if (a.stars) r.score += 50 + 50 * a.stars;
      }
    }
    Object.assign(r, { stars, pockets, requirePocket });
    r.maxScore = N * (requirePocket ? 250 : 200);
    r.over = A.length >= N;
    r.passed = r.over && stars >= (pass.stars || 0) && (!requirePocket || pockets >= (pass.pockets || 0));
    r.needText = `${pass.stars || 0}★${requirePocket && pass.pockets ? ` & ${pass.pockets} pots` : ''}`;
    r.progressText = `${stars}★${requirePocket ? ` · ${pockets} pots` : ''}`;
  } else if (mode === 'lives') {
    const L = rules.lives || 3;
    let made = 0;
    let bonus = 0;
    let misses = 0;
    for (const a of A) {
      if (a.result === 'made') { made++; r.score += 100; }
      else if (a.result === 'madePos') { made++; bonus++; r.score += 150; }
      else misses++;
    }
    r.lives = Math.max(0, L - misses);
    Object.assign(r, { made, bonus, misses, livesTotal: L });
    r.maxScore = (session.endless ? Math.max(A.length, 1) : N) * 150;
    r.over = r.lives <= 0 || A.length >= N;
    r.passed = !session.endless && r.over && r.lives > 0 && made >= (pass.made || 0) && bonus >= (pass.bonus || 0);
    r.needText = `${pass.made || 0} banks${pass.bonus ? ` incl. ${pass.bonus} +position` : ''}`;
    r.progressText = `${made} made${bonus ? ` · ${bonus} bonus` : ''}`;
  } else if (mode === 'kick') {
    const rails = stage.kickRails || 1;
    const bonusVal = stage.targetPocket ? 150 : 100;
    let hits = 0;
    let bonus = 0;
    for (const a of A) {
      if (a.result === 'hit') { hits++; r.score += 100 * rails; }
      else if (a.result === 'bonus') { hits++; bonus++; r.score += 100 * rails + bonusVal; }
    }
    Object.assign(r, { hits, bonus, rails });
    r.maxScore = N * (100 * rails + bonusVal);
    r.over = A.length >= N;
    r.passed = r.over && hits >= (pass.hits || 0) && bonus >= (pass.bonus || 0);
    r.needText = `${pass.hits || 0} legal hits${pass.bonus ? ` incl. ${pass.bonus} bonus` : ''}`;
    r.progressText = `${hits} hits${bonus ? ` · ${bonus} bonus` : ''}`;
  } else if (mode === 'train') {
    const total = stage.steps.length;
    const runs = [];
    let cur = null;
    for (const a of A) {
      if (!cur) cur = { balls: 0, zones: 0, score: 0, mult: 1, maxMult: 1, complete: false, failed: false };
      if (a.result === 'miss') { cur.failed = true; runs.push(cur); cur = null; continue; }
      cur.score += 100 * cur.mult;
      cur.balls++;
      if (a.result === 'zone') { cur.zones++; cur.mult = Math.min(5, cur.mult + 1); cur.maxMult = Math.max(cur.maxMult, cur.mult); }
      else cur.mult = 1;
      if (cur.balls >= total) { cur.complete = true; cur.perfect = cur.zones >= total - 1; runs.push(cur); cur = null; }
    }
    r.runs = runs;
    r.current = cur || { balls: 0, zones: 0, score: 0, mult: 1, maxMult: 1 };
    r.ballIndex = r.current.balls;
    r.multiplier = r.current.mult;
    r.score = Math.max(0, ...runs.map((x) => x.score), cur ? cur.score : 0);
    r.perfectRuns = runs.filter((x) => x.perfect).length;
    r.bestMultiplier = Math.max(1, ...runs.map((x) => x.maxMult), cur ? cur.maxMult : 1);
    r.attemptsUsed = runs.length;
    r.maxScore = [...Array(total)].reduce((acc, _, i) => acc + 100 * Math.min(5, i + 1), 0);
    r.over = runs.length >= N;
    const good = runs.filter((x) => x.complete && x.zones >= (pass.zones || 0));
    r.passed = r.over && good.length >= (pass.runs || 1);
    r.needText = `a full run with ${pass.zones || 0}+ zones`;
    r.progressText = `run ${Math.min(runs.length + 1, N)}/${N} · ball ${r.ballIndex + 1}/${total}`;
  } else if (mode === 'stars') {
    let stars = 0;
    for (const a of A) { stars += a.stars || 0; r.score += 100 * (a.stars || 0); }
    r.stars = stars;
    r.maxScore = N * 300;
    r.over = A.length >= N;
    r.passed = r.over && stars >= (pass.stars || 0);
    r.needText = `${pass.stars || 0}★ total`;
    r.progressText = `${stars}★`;
  } else if (mode === 'binary' || mode === 'success') {
    let made = 0;
    for (const a of A) {
      if (a.result === 'made') { made++; r.score += 100; }
      else if (a.result === 'partial') r.score += 40;
    }
    r.made = made;
    r.maxScore = N * 100;
    r.over = A.length >= N;
    r.passed = r.over && made >= (pass.made || 0);
    r.needText = `${pass.made || 0} made`;
    r.progressText = `${made} made`;
  } else if (mode === 'sniper') {
    const L = rules.lives || 3;
    let made = 0;
    let streak = 0;
    let best = 0;
    let misses = 0;
    for (const a of A) {
      if (a.result === 'made') {
        const mult = Math.min(5, 1 + Math.floor(streak / 2));
        r.score += 100 * mult;
        streak++;
        made++;
        best = Math.max(best, streak);
      } else { misses++; streak = 0; }
    }
    r.lives = Math.max(0, L - misses);
    r.streak = streak;
    r.bestStreak = best;
    r.multiplier = Math.min(5, 1 + Math.floor(streak / 2));
    r.made = made;
    r.livesTotal = L;
    r.maxScore = [...Array(N)].reduce((acc, _, i) => acc + 100 * Math.min(5, 1 + Math.floor(i / 2)), 0);
    r.over = r.lives <= 0 || A.length >= N;
    r.passed = r.over && made >= (pass.made || 0);
    r.needText = `${pass.made || 0} pots`;
    r.progressText = `${made} pots · streak ${streak}`;
  } else if (mode === 'ladder') {
    const rungs = rules.rungs;
    let rung = 0;
    let best = 0;
    let complete = false;
    for (const a of A) {
      if (a.result === 'hit') {
        if (rung >= rungs.length - 1) { complete = true; best = rungs.length; break; }
        rung++;
        best = Math.max(best, rung);
      } else rung = Math.max(0, rung - 1);
    }
    Object.assign(r, { rung, bestRung: best, complete, rungs, currentSpeed: rungs[Math.min(rung, rungs.length - 1)] });
    r.score = best * 100 + (complete ? 500 : 0);
    r.maxScore = rungs.length * 100 + 500;
    r.over = complete || A.length >= N;
    r.passed = complete;
    r.needText = `reach SPEED ${rungs[rungs.length - 1].toFixed(1)}`;
    r.progressText = `rung ${Math.min(rung + 1, rungs.length)}/${rungs.length}`;
  } else if (mode === 'calibration') {
    const speeds = stage.speeds;
    const done = {};
    for (const a of A) done[a.speed] = a;
    r.done = done;
    r.nextSpeed = speeds.find((s) => !done[s]) ?? null;
    r.score = Object.keys(done).length * 100;
    r.maxScore = speeds.length * 100;
    r.over = r.nextSpeed == null;
    r.passed = r.over;
    r.needText = 'record every speed';
    r.progressText = `${Object.keys(done).length}/${speeds.length} speeds`;
  } else if (mode === 'pattern') {
    let ran = 0;
    for (const a of A) {
      if (a.result === 'ran') { ran++; r.score += 300; }
      else if (a.result === 'partial') r.score += 100;
    }
    r.score += session.plan?.planScore || 0;
    r.ran = ran;
    r.maxScore = N * 300 + 400;
    r.over = A.length >= N;
    r.passed = r.over && ran >= (pass.runs || 1);
    r.needText = `${pass.runs || 1} runout${(pass.runs || 1) > 1 ? 's' : ''}`;
    r.progressText = `${ran} runouts`;
  }
  r.stars = r.stars ?? 0;
  r.stageStars = stageStarsFor(r);
  return r;
}

export function stageStarsFor(r) {
  if (!r.passed) return 0;
  if (r.mode === 'ladder') return r.attemptsUsed <= r.rungs.length ? 3 : r.attemptsUsed <= r.rungs.length + 2 ? 2 : 1;
  if (r.mode === 'calibration') return 3;
  const ratio = r.maxScore ? r.score / r.maxScore : 0;
  return ratio >= 0.8 ? 3 : ratio >= 0.6 ? 2 : 1;
}

/** Buttons for the current state of a session (labels + outcome payloads) */
export function resultButtons(session, stage, ev = evaluateSession(session, stage)) {
  if (ev.over) return [];
  const mode = session.endless ? 'lives' : stage.scoringRules.mode;
  if (mode === 'zone') {
    if (stage.scoringRules.requirePocket === false) {
      return [
        { label: 'MISSED ZONE', sub: 'short / long', outcome: { stars: 0 }, cls: 'miss', wide: true },
        { label: '★ OUTER', outcome: { stars: 1 }, cls: 's1' },
        { label: '★★ MIDDLE', outcome: { stars: 2 }, cls: 's2' },
        { label: '★★★ BULLSEYE', outcome: { stars: 3 }, cls: 's3' }
      ];
    }
    return [
      { label: 'MISSED BALL', outcome: { pocketed: false, stars: 0 }, cls: 'miss' },
      { label: 'POCKETED', sub: 'no zone', outcome: { pocketed: true, stars: 0 }, cls: 'pot' },
      { label: '★ OUTER', outcome: { pocketed: true, stars: 1 }, cls: 's1' },
      { label: '★★ MIDDLE', outcome: { pocketed: true, stars: 2 }, cls: 's2' },
      { label: '★★★ BULLSEYE', outcome: { pocketed: true, stars: 3 }, cls: 's3' }
    ];
  }
  if (mode === 'lives') {
    const ch = session.endless ? endlessChallenge(session, session.attempts.length) : stage;
    const hasPos = session.endless || (ch.targetZones || []).length > 0;
    return [
      { label: 'MISS', sub: '−1 life', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'BANK MADE', sub: '+100', outcome: { result: 'made' }, cls: 'pot' },
      ...(hasPos ? [{ label: 'MADE + POSITION', sub: '+150', outcome: { result: 'madePos' }, cls: 's3' }] : [])
    ];
  }
  if (mode === 'kick') {
    const rails = stage.kickRails || 1;
    const bonusLabel = stage.targetPocket ? 'KICK + POCKET' : stage.targetZones?.length ? 'KICK + SAFE' : null;
    return [
      { label: 'NO LEGAL HIT', outcome: { result: 'miss' }, cls: 'miss' },
      { label: `LEGAL ${rails}-RAIL HIT`, sub: `+${rails * 100}`, outcome: { result: 'hit' }, cls: 'pot' },
      ...(bonusLabel ? [{ label: bonusLabel, sub: `+${rails * 100 + (stage.targetPocket ? 150 : 100)}`, outcome: { result: 'bonus' }, cls: 's3' }] : [])
    ];
  }
  if (mode === 'train') {
    const last = ev.ballIndex >= stage.steps.length - 1;
    return [
      { label: 'MISSED BALL', sub: 'run ends', outcome: { result: 'miss' }, cls: 'miss' },
      { label: last ? 'POCKETED' : 'POCKETED · NO ZONE', sub: last ? 'finish' : 'multiplier resets', outcome: { result: 'pocket' }, cls: 'pot' },
      ...(last ? [] : [{ label: 'POCKETED + ZONE', sub: `×${Math.min(5, ev.multiplier + 1)} next`, outcome: { result: 'zone' }, cls: 's3' }])
    ];
  }
  if (mode === 'stars') {
    return [0, 1, 2, 3].map((s) => ({ label: ['FAILED', '★ PLAYABLE', '★★ TOUGH', '★★★ LOCKED'][s], outcome: { stars: s }, cls: s ? `s${s}` : 'miss' }));
  }
  if (mode === 'success') {
    // .pooliq drills: plain SUCCESS / MISS (evaluated like binary)
    return [
      { label: 'MISS', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'SUCCESS', outcome: { result: 'made' }, cls: 's3' }
    ];
  }
  if (mode === 'binary') {
    return [
      { label: 'MISS', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'CONTACT ONLY', sub: 'right sequence', outcome: { result: 'partial' }, cls: 'pot' },
      { label: 'MADE IT', outcome: { result: 'made' }, cls: 's3' }
    ];
  }
  if (mode === 'sniper') {
    return [
      { label: 'MISS', sub: '−1 life', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'POCKETED', sub: `+${100 * ev.multiplier}`, outcome: { result: 'made' }, cls: 's3' }
    ];
  }
  if (mode === 'ladder') {
    return [
      { label: 'MISSED ZONE', sub: 'down a rung', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'IN THE ZONE', sub: '2★ or better', outcome: { result: 'hit' }, cls: 's3' }
    ];
  }
  if (mode === 'pattern') {
    return [
      { label: 'MISSED A BALL', outcome: { result: 'miss' }, cls: 'miss' },
      { label: 'LOST POSITION', sub: 'partial run', outcome: { result: 'partial' }, cls: 'pot' },
      { label: 'RAN OUT', sub: '+300', outcome: { result: 'ran' }, cls: 's3' }
    ];
  }
  return [];
}

/** The challenge to show right now (ladder/endless swap layouts per shot) */
export function currentChallenge(session, stage, ev = evaluateSession(session, stage)) {
  if (session.endless) return endlessChallenge(session, session.attempts.length);
  if (stage?.kind === 'ladder') return ladderRungChallenge(ev.currentSpeed);
  return stage;
}

// ------------------------------------------------------------------ finishing
export function finishSession(state, session) {
  if (session.bossId) return finishBoss(state, session);
  const stage = stageFor(session);
  const ev = evaluateSession(session, stage);
  const gid = session.gameId;
  const gs = gameState(state, gid);
  const now = new Date().toISOString();
  const beforeUnlocked = GAMES.filter((g) => isGameUnlocked(state, g.id)).map((g) => g.id);
  const attempts = session.attempts.map((a) => ({ ...a }));
  const games = { ...(state.games || {}) };
  const g = { stages: { ...gs.stages }, pb: { ...gs.pb }, sessions: [...(gs.sessions || [])] };
  let firstPass = false;
  let newPB = false;
  let xpGain = 0;
  if (session.endless) {
    const old = g.pb.endlessBest || 0;
    newPB = ev.score > old;
    g.pb.endlessBest = Math.max(old, ev.score);
    g.pb.endlessHistory = [...(g.pb.endlessHistory || []), { date: now, score: ev.score, made: ev.made }].slice(-30);
    xpGain = 10 + Math.floor(ev.score / 50);
  } else {
    const old = g.stages[session.stageId] || { tries: 0, passed: false, bestScore: 0, bestStars: 0, history: [] };
    firstPass = !old.passed && ev.passed;
    newPB = ev.score > (old.bestScore || 0);
    g.stages[session.stageId] = {
      ...old,
      tries: (old.tries || 0) + 1,
      passed: old.passed || ev.passed,
      bestScore: Math.max(old.bestScore || 0, ev.score),
      bestStars: Math.max(old.bestStars || 0, ev.stageStars),
      lastScore: ev.score,
      lastPassed: ev.passed,
      lastDate: now,
      firstPassDate: old.firstPassDate || (ev.passed ? now : null),
      successRate: successRateFor(ev),
      history: [...(old.history || []), { date: now, score: ev.score, passed: ev.passed, stars: ev.stageStars, attempts }].slice(-20)
    };
    xpGain = firstPass ? stage?.xp || 100 : ev.passed ? 20 : 5;
  }
  g.pb.highScore = Math.max(g.pb.highScore || 0, ev.score);
  if (ev.bestMultiplier) g.pb.bestMultiplier = Math.max(g.pb.bestMultiplier || 1, ev.bestMultiplier);
  if (ev.perfectRuns) g.pb.perfectRuns = (g.pb.perfectRuns || 0) + ev.perfectRuns;
  if (ev.bestStreak) g.pb.bestStreak = Math.max(g.pb.bestStreak || 0, ev.bestStreak);
  if (ev.mode === 'ladder') g.pb.ladderBest = Math.max(g.pb.ladderBest || 0, ev.bestRung);
  g.sessions = [...g.sessions, { stageId: session.endless ? 'endless' : session.stageId, date: now, score: ev.score, passed: ev.passed, stars: ev.stageStars, attempts: attempts.length }].slice(-100);
  games[gid] = g;
  let next = { ...state, games, xp: (state.xp || 0) + xpGain, activeSession: null };
  if (ev.mode === 'calibration') {
    let cal = next.speedCal;
    for (const a of session.attempts) cal = recordCalibration(cal, a.speed, a.actual);
    next.speedCal = cal;
  }
  const afterUnlocked = GAMES.filter((x) => isGameUnlocked(next, x.id)).map((x) => x.id);
  const specs = stageSpecs(gid);
  const idx = specs.findIndex((s) => s.id === session.stageId);
  const nextStage = idx >= 0 && idx < specs.length - 1 ? specs[idx + 1] : null;
  return {
    state: next,
    result: {
      ...ev,
      firstPass,
      newPB,
      xpGain,
      nextStageId: ev.passed && nextStage ? nextStage.id : null,
      unlockedNext: firstPass && !!nextStage,
      endlessUnlocked: firstPass && !nextStage && !!getGame(gid)?.endless,
      gamesUnlocked: afterUnlocked.filter((x) => !beforeUnlocked.includes(x))
    }
  };
}

function successRateFor(ev) {
  if (ev.mode === 'zone') return ev.attemptsUsed ? ev.stars / (ev.attemptsUsed * 3) : 0;
  if (ev.maxScore) return Math.min(1, ev.score / ev.maxScore);
  return ev.passed ? 1 : 0;
}

// ------------------------------------------------------------------ boss battles
export function evaluateBoss(session) {
  const boss = getBoss(session.bossId);
  const shots = boss.shots.map((s) => ({ shot: s, attempts: [], made: 0, stars: 0 }));
  let idx = 0;
  for (const a of session.attempts) {
    while (idx < shots.length && shots[idx].attempts.length >= shots[idx].shot.attempts) idx++;
    if (idx >= shots.length) break;
    const st = shots[idx];
    st.attempts.push(a);
    if (st.shot.mode === 'zone') {
      if (a.pocketed) { st.made++; st.stars += a.stars || 0; }
    } else if (a.result === 'made') st.made++;
  }
  while (idx < shots.length && shots[idx].attempts.length >= shots[idx].shot.attempts) idx++;
  for (const st of shots) {
    st.done = st.attempts.length >= st.shot.attempts;
    st.passed = st.done && (st.shot.mode === 'zone' ? st.stars >= st.shot.need : st.made >= st.shot.need);
    // can it still pass?
    const left = st.shot.attempts - st.attempts.length;
    st.lost = !st.passed && (st.shot.mode === 'zone' ? st.stars + left * 3 < st.shot.need : st.made + left < st.shot.need);
  }
  const over = idx >= shots.length;
  const passedCount = shots.filter((s) => s.passed).length;
  const mustOk = (boss.mustPass || []).every((i) => shots[i]?.passed);
  const passed = over && passedCount >= (boss.passShots ?? shots.length) && mustOk;
  const weak = [];
  for (const st of shots) if (st.done && !st.passed && !weak.includes(st.shot.skill)) weak.push(st.shot.skill);
  return {
    mode: 'boss',
    boss,
    shots,
    shotIndex: Math.min(idx, shots.length - 1),
    over,
    passed,
    passedCount,
    weakSkills: weak,
    score: shots.reduce((a, s) => a + (s.shot.mode === 'zone' ? s.stars * 50 + s.made * 100 : s.made * 100), 0),
    attemptsUsed: session.attempts.length,
    attemptsTotal: boss.shots.reduce((a, s) => a + s.attempts, 0),
    stars: 0,
    stageStars: over && passed ? (passedCount === shots.length ? 3 : 2) : 0
  };
}

export function bossButtons(ev) {
  if (ev.over) return [];
  const shot = ev.shots[ev.shotIndex].shot;
  if (shot.mode === 'zone') {
    return [
      { label: 'MISSED BALL', outcome: { pocketed: false, stars: 0 }, cls: 'miss' },
      { label: 'POCKETED', sub: 'no zone', outcome: { pocketed: true, stars: 0 }, cls: 'pot' },
      { label: '★ OUTER', outcome: { pocketed: true, stars: 1 }, cls: 's1' },
      { label: '★★ MIDDLE', outcome: { pocketed: true, stars: 2 }, cls: 's2' },
      { label: '★★★ BULLSEYE', outcome: { pocketed: true, stars: 3 }, cls: 's3' }
    ];
  }
  return [
    { label: 'MISS', outcome: { result: 'miss' }, cls: 'miss' },
    { label: shot.madeLabel || 'MADE', outcome: { result: 'made' }, cls: 's3' }
  ];
}

export function finishBoss(state, session) {
  const ev = evaluateBoss(session);
  const now = new Date().toISOString();
  const old = (state.bosses || {})[session.bossId] || { passed: false, tries: 0, history: [] };
  const rec = {
    ...old,
    passed: old.passed || ev.passed,
    tries: (old.tries || 0) + 1,
    lastDate: now,
    lastPassed: ev.passed,
    lastWeak: ev.weakSkills,
    history: [
      ...(old.history || []),
      { date: now, passed: ev.passed, weakSkills: ev.weakSkills, shots: ev.shots.map((s) => ({ skill: s.shot.skill, title: s.shot.title, made: s.made, stars: s.stars, need: s.shot.need, passed: s.passed, attempts: s.attempts.map((a) => ({ ...a })) })) }
    ].slice(-20)
  };
  const next = { ...state, bosses: { ...(state.bosses || {}), [session.bossId]: rec }, xp: (state.xp || 0) + (ev.passed && !old.passed ? 400 : 20), activeSession: null };
  return { state: next, result: { ...ev, firstPass: ev.passed && !old.passed } };
}

// ------------------------------------------------------------------ calibration helpers
export function calibrationOutcome(targetSpeed, leg, diamond) {
  return { speed: targetSpeed, leg, diamond, actual: Math.round(travelFromStop(leg, diamond) * 100) / 100 };
}

export { lagEndpoint };
