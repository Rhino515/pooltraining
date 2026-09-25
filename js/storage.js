/**
 * Pool IQ persistence — versioned localStorage + light IndexedDB helpers.
 * Key: poolIQStateV4. Migrates from poolIQStateV3 (left intact as a backup) and poolIQStateV2.
 * V4 adds: games (arcade stage records), speedCal (speed-scale calibration), bosses, settings.coaching,
 * rankFloor (preserves a migrated user's rank), ghostUnlockFloor, activeSession, activeGhost, drillArchive.
 */
import { defaultCalibration } from './games/speed.js';

export const STORAGE_KEY = 'poolIQStateV4';
export const V3_KEY = 'poolIQStateV3';
export const LEGACY_KEY = 'poolIQStateV2';
export const STORAGE_VERSION = 4;

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
  return Object.fromEntries(SKILL_NAMES.map((n) => [n, 0]));
}

export function defaultState() {
  return {
    version: STORAGE_VERSION,
    xp: 0,
    rankIndex: 0,
    rankFloor: 0,
    results: {}, // drillId -> { best, last, tries, passed, sessions } (only for drills that exist)
    drillArchive: {}, // results for drill ids that no longer exist (kept harmlessly, never read by career)
    ghostMatches: [],
    skills: defaultSkills(),
    games: {}, // gameId -> { stages: {stageId: record}, pb: {}, sessions: [] }
    bosses: {}, // bossId -> { passed, tries, history }
    speedCal: defaultCalibration(),
    promotionAttempts: {},
    unlockedGhostBalls: 3,
    ghostUnlockFloor: 3,
    activeSession: null,
    activeGhost: null,
    settings: { units: 'imperial', coaching: 'auto' }
  };
}

export function migrateV2(raw) {
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
  if (raw.results && typeof raw.results === 'object') base.results = { ...raw.results };
  const passed = Object.values(base.results).filter((r) => r && r.passed).length;
  base.rankIndex = Math.min(9, Math.floor(passed / 2) + Math.floor(wins / 3));
  return base;
}

/** Upgrade any V3-shaped object to V4 without losing progress. */
export function migrateToV4(parsed) {
  const base = defaultState();
  if (!parsed || typeof parsed !== 'object') return base;
  const legacyRank = Math.max(0, Math.min(9, Number(parsed.rankIndex) || 0));
  const legacyGhost = Math.max(3, Math.min(9, Number(parsed.unlockedGhostBalls) || 3));
  const out = {
    ...base,
    ...parsed,
    version: STORAGE_VERSION,
    rankIndex: legacyRank,
    rankFloor: Math.max(Number(parsed.rankFloor) || 0, parsed.version === 4 ? Number(parsed.rankFloor) || 0 : legacyRank),
    ghostUnlockFloor: Math.max(Number(parsed.ghostUnlockFloor) || 3, parsed.version === 4 ? 3 : legacyGhost),
    skills: { ...base.skills, ...(parsed.skills || {}) },
    results: parsed.results && typeof parsed.results === 'object' ? parsed.results : {},
    drillArchive: parsed.drillArchive || {},
    ghostMatches: Array.isArray(parsed.ghostMatches) ? parsed.ghostMatches : [],
    games: parsed.games && typeof parsed.games === 'object' ? parsed.games : {},
    bosses: parsed.bosses && typeof parsed.bosses === 'object' ? parsed.bosses : {},
    speedCal: { ...defaultCalibration(), ...(parsed.speedCal || {}) },
    promotionAttempts: parsed.promotionAttempts || {},
    settings: { ...base.settings, ...(parsed.settings || {}) }
  };
  return out;
}

/**
 * Move results for drill ids that are not in the current library into drillArchive,
 * so deleted drills can never break career/skills code. Pure.
 */
export function archiveUnknownDrills(state, knownIds) {
  const known = new Set(knownIds);
  const results = {};
  const drillArchive = { ...(state.drillArchive || {}) };
  let moved = 0;
  for (const [id, r] of Object.entries(state.results || {})) {
    if (known.has(id)) results[id] = r;
    else {
      drillArchive[id] = r;
      moved++;
    }
  }
  return moved ? { ...state, results, drillArchive } : state;
}

export function loadState() {
  try {
    const v4 = localStorage.getItem(STORAGE_KEY);
    if (v4) return migrateToV4(JSON.parse(v4));
    const v3 = localStorage.getItem(V3_KEY);
    if (v3) {
      const migrated = migrateToV4(JSON.parse(v3));
      saveState(migrated);
      return migrated;
    }
    const v2 = localStorage.getItem(LEGACY_KEY);
    if (v2) {
      const migrated = migrateToV4(migrateV2(JSON.parse(v2)));
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
  dataWritten(STORAGE_KEY);
  return toSave;
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(V3_KEY);
  localStorage.removeItem(LEGACY_KEY);
  dataWritten(STORAGE_KEY);
  return defaultState();
}

/**
 * Write hook: every module that persists data calls dataWritten(key) after writing localStorage,
 * so the IndexedDB mirror (js/vault.js) can copy it. No-op until the app installs a hook.
 */
let writeHook = null;
export function onDataWrite(fn) {
  writeHook = fn;
}
export function dataWritten(key) {
  try { if (writeHook) writeHook(key); } catch (e) { console.warn('Pool IQ mirror hook failed', e); }
}
/** localStorage set/remove + mirror notification (for small keys like drafts and presets) */
export function lsSet(key, value) {
  try { localStorage.setItem(key, value); dataWritten(key); return true; } catch { return false; }
}
export function lsRemove(key) {
  try { localStorage.removeItem(key); dataWritten(key); return true; } catch { return false; }
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
  const max = drill.attempts || drill.attemptCount || attemptValues.length;
  const passedNow = sessionPassed(score, drill.passNeed ?? drill.passingRequirement?.made ?? max);
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
    attempts: attemptValues.slice(),
    resultSource: 'manual'
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

// IndexedDB helpers: the redundant mirror + rolling snapshots (js/vault.js) and future large blobs.
const IDB_NAME = 'poolIQ_idb';
const IDB_STORE = 'blobs';
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined' || !indexedDB) { reject(new Error('IndexedDB not available')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

export async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('IndexedDB write aborted'));
  });
}

export async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const g = tx.objectStore(IDB_STORE).get(key);
    g.onsuccess = () => resolve(g.result);
    g.onerror = () => reject(g.error);
  });
}

export async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/** Adapter used by the vault: {get, put, del} — tests swap in an in-memory version */
export const idbAdapter = { get: idbGet, put: idbPut, del: idbDelete };
