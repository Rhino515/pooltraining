/**
 * Pool IQ persistence — versioned localStorage + light IndexedDB helpers.
 * Key: poolIQStateV3 (migrates from poolIQStateV2 when present).
 */
export const STORAGE_KEY = 'poolIQStateV3';
export const LEGACY_KEY = 'poolIQStateV2';
export const STORAGE_VERSION = 3;

export const SKILL_NAMES = [
  'Shot Making',
  'Cue-Ball Control',
  'Position Play',
  'Speed Control',
  'Banks',
  'Kicks',
  'Safeties',
  'Pattern Play'
];

export const RANK_NAMES = [
  'Rookie',
  'Club Player',
  'Shooter',
  'Competitor',
  'Advanced',
  'Expert',
  'Master',
  'Elite',
  'Pro',
  'Champion'
];

function defaultSkills() {
  return Object.fromEntries(SKILL_NAMES.map((n) => [n, 30]));
}

export function defaultState() {
  return {
    version: STORAGE_VERSION,
    xp: 0,
    rankIndex: 0,
    results: {}, // drillId -> { best, last, tries, passed, sessions: [{date, score, max, passed, attempts}] }
    ghostMatches: [],
    skills: defaultSkills(),
    promotionAttempts: {}, // testId -> { passed, bestStages, tries, lastDate }
    unlockedGhostBalls: 3,
    settings: { units: 'imperial' }
  };
}

function migrateV2(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  base.xp = Number(raw.xp) || 0;
  base.ghostMatches = Array.isArray(raw.ghostMatches)
    ? raw.ghostMatches.map((m) => ({
        id: m.id || `g-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        balls: m.balls || 3,
        you: m.you || 0,
        ghost: m.ghost || 0,
        race: m.race || 5,
        won: !!m.won,
        log: m.log || [],
        date: m.date || new Date().toISOString()
      }))
    : [];
  const wins = base.ghostMatches.filter((m) => m.won).length;
  base.unlockedGhostBalls = Math.min(9, 3 + Math.floor(wins / 2));
  if (raw.skills && typeof raw.skills === 'object') {
    for (const n of SKILL_NAMES) {
      if (raw.skills[n] != null) base.skills[n] = Math.max(1, Math.min(99, Number(raw.skills[n]) || 30));
      else if (n === 'Speed Control' && raw.skills['Cue-Ball Control'] != null) {
        base.skills[n] = Math.max(1, Math.min(99, Number(raw.skills['Cue-Ball Control']) || 30));
      }
    }
  }
  if (raw.results && typeof raw.results === 'object') {
    for (const [id, r] of Object.entries(raw.results)) {
      base.results[id] = {
        best: r.best || 0,
        last: r.last || 0,
        tries: r.tries || 0,
        passed: !!r.passed,
        sessions: r.sessions || []
      };
    }
  }
  // Rank from old heuristic as soft start; career.js will re-validate
  const passed = Object.values(base.results).filter((r) => r.passed).length;
  base.rankIndex = Math.min(9, Math.floor(passed / 2) + Math.floor(wins / 3));
  return base;
}

export function loadState() {
  try {
    const v3 = localStorage.getItem(STORAGE_KEY);
    if (v3) {
      const parsed = JSON.parse(v3);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        version: STORAGE_VERSION,
        skills: { ...base.skills, ...(parsed.skills || {}) },
        results: parsed.results || {},
        ghostMatches: parsed.ghostMatches || [],
        promotionAttempts: parsed.promotionAttempts || {},
        settings: { ...base.settings, ...(parsed.settings || {}) }
      };
    }
    const v2 = localStorage.getItem(LEGACY_KEY);
    if (v2) {
      const migrated = migrateV2(JSON.parse(v2));
      saveState(migrated);
      return migrated;
    }
  } catch (e) {
    console.warn('Pool IQ storage load failed', e);
  }
  return defaultState();
}

export function saveState(state) {
  const toSave = { ...state, version: STORAGE_VERSION };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  return toSave;
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  // Keep v2 so user can re-migrate if desired? Spec says reset demo — clear both.
  localStorage.removeItem(LEGACY_KEY);
  return defaultState();
}

/** Pure scoring helpers — also used by verification tests */
export function scoreBinaryAttempt(success) {
  return success ? 1 : 0;
}

/**
 * Position outcomes: 'zone' | 'pocketed' | 'miss'
 * Weights: 1 / 0.5 / 0
 */
export function scorePositionAttempt(outcome) {
  if (outcome === 'zone' || outcome === 'success') return 1;
  if (outcome === 'pocketed' || outcome === 'partial') return 0.5;
  return 0;
}

export function sessionPassed(score, passNeed) {
  return score >= passNeed;
}

export function applyDrillSession(state, drill, attemptValues) {
  const score = attemptValues.reduce((a, b) => a + b, 0);
  const max = drill.attempts;
  const passedNow = sessionPassed(score, drill.passNeed);
  const old = state.results[drill.id] || {
    best: 0,
    last: 0,
    tries: 0,
    passed: false,
    sessions: []
  };
  const firstPass = !old.passed && passedNow;
  const session = {
    date: new Date().toISOString(),
    score,
    max,
    passed: passedNow,
    attempts: attemptValues.slice()
  };
  const next = {
    ...state,
    results: {
      ...state.results,
      [drill.id]: {
        best: Math.max(old.best, score),
        last: score,
        tries: old.tries + 1,
        passed: old.passed || passedNow,
        sessions: [...(old.sessions || []), session].slice(-40)
      }
    },
    xp: state.xp + (firstPass ? drill.xp || 100 : passedNow ? 25 : 5)
  };
  if (firstPass && drill.skillEffects) {
    const skills = { ...next.skills };
    for (const [skill, delta] of Object.entries(drill.skillEffects)) {
      if (skills[skill] != null) {
        skills[skill] = Math.max(1, Math.min(99, skills[skill] + delta));
      }
    }
    next.skills = skills;
  }
  return { state: next, score, passed: passedNow, firstPass };
}

export function undoGhostRack(session) {
  if (!session || !session.log || !session.log.length) return session;
  const log = session.log.slice(0, -1);
  let you = 0;
  let ghost = 0;
  for (const x of log) {
    if (x === 'W') you++;
    else ghost++;
  }
  return { ...session, log, you, ghost };
}

export function ghostRackResult(session, result) {
  const log = [...(session.log || []), result];
  const you = session.you + (result === 'W' ? 1 : 0);
  const ghost = session.ghost + (result === 'L' ? 1 : 0);
  return { ...session, log, you, ghost };
}

// IndexedDB helper for optional large session blobs (future camera frames)
const IDB_NAME = 'poolIQ_idb';
const IDB_STORE = 'blobs';

export function idbPut(key, value) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export function idbGet(key) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(IDB_STORE, 'readonly');
      const g = tx.objectStore(IDB_STORE).get(key);
      g.onsuccess = () => resolve(g.result);
      g.onerror = () => reject(g.error);
    };
    req.onerror = () => reject(req.error);
  });
}
