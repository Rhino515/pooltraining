/**
 * Pool IQ data safety ("vault"): every localStorage key the app uses is mirrored to IndexedDB,
 * reconciled on load (newest good copy wins, a good copy is never replaced by an empty one),
 * kept as ~3 rolling snapshots, and exported / imported as one JSON backup file.
 *
 * Pure logic + injected adapters so Node tests can run it:
 *   kv  — localStorage-like {getItem,setItem,removeItem}
 *   idb — {get(key), put(key, value), del(key)} (storage.js idbAdapter in the app)
 */
import { STORAGE_KEY, V3_KEY, LEGACY_KEY, RANK_NAMES, migrateToV4, migrateV2 } from './storage.js';

/** Every persisted key (keep in sync with the modules that own them — verify.mjs checks this) */
export const KEYS = {
  state: STORAGE_KEY, // career, stages, Ghost matches, bosses, calibration, settings
  v3: V3_KEY, // legacy saves, kept as a backup by the V4 migration
  v2: LEGACY_KEY,
  custom: 'poolIQCustomDrillsV1', // Create Drill library (customDrills.js)
  sim: 'poolIQSimV1', // Shot Simulator table, saved shots, collections, settings (sim/library.js)
  ghostPreset: 'poolIQGhostPreset', // last Ghost setup (app.js)
  drillWip: 'poolIQDrillWip', // Create Drill work in progress (ui/drillBuilder.js)
  drillDraft: 'poolIQDrillDraft' // Simulator → Create Drill hand-off (ui/simulator.js)
};
export const DATA_KEYS = Object.values(KEYS);
export const META_KEY = 'poolIQMetaV1'; // seq/savedAt, lastBackupAt, nudge + install dismissals, persist result
export const MIRROR_KEY = 'mirror:current';
export const SNAP_KEY = 'mirror:snapshots';
export const MAX_SNAPSHOTS = 3;
export const SNAP_EVERY_MS = 6 * 3600 * 1000; // automatic rolling snapshot at most every 6 h
export const BACKUP_FORMAT = 'pool-iq-backup';
export const BACKUP_SCHEMA = 1;
export const APP_VERSION = '9';
export const NUDGE_DAYS = 7;
const DAY = 86400000;

// ------------------------------------------------------------------ helpers
export function parseJSON(str) {
  if (typeof str !== 'string') return undefined;
  try { return JSON.parse(str); } catch { return undefined; }
}
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const keyOk = (str) => isObj(parseJSON(str));
const MAIN_KEYS = [KEYS.state, KEYS.v3, KEYS.v2];

export function readMeta(kv) {
  const m = parseJSON(kv.getItem(META_KEY));
  return isObj(m) ? m : {};
}
export function writeMeta(kv, m) {
  try { kv.setItem(META_KEY, JSON.stringify(m)); } catch { /* quota — mirror still has the data */ }
  return m;
}

/** Snapshot of everything in localStorage right now */
export function localBundle(kv) {
  const keys = {};
  for (const k of DATA_KEYS) {
    const v = kv.getItem(k);
    if (v != null) keys[k] = v;
  }
  const m = readMeta(kv);
  return { schema: 1, seq: m.seq || 0, savedAt: m.savedAt || 0, intentAt: m.intentAt || 0, keys, ui: { lastBackupAt: m.lastBackupAt || 0 } };
}

/** Health of a bundle: valid = has data and the main save (if present) parses */
export function health(b) {
  if (!b || !isObj(b.keys)) return { exists: false, valid: false, corrupt: [] };
  const present = Object.keys(b.keys).filter((k) => DATA_KEYS.includes(k) && b.keys[k] != null);
  const corrupt = present.filter((k) => !keyOk(b.keys[k]));
  const mainPresent = present.filter((k) => MAIN_KEYS.includes(k));
  const mainOk = mainPresent.some((k) => keyOk(b.keys[k]));
  const anyOk = present.some((k) => keyOk(b.keys[k]));
  return { exists: present.length > 0, valid: anyOk && (!mainPresent.length || mainOk), corrupt };
}

/** Career state from raw key strings (runs the normal migrations for V3/V2 saves) */
export function stateFromKeys(keys) {
  const v4 = parseJSON(keys?.[KEYS.state]);
  if (isObj(v4)) return migrateToV4(v4);
  const v3 = parseJSON(keys?.[KEYS.v3]);
  if (isObj(v3)) return migrateToV4(v3);
  const v2 = parseJSON(keys?.[KEYS.v2]);
  if (isObj(v2)) return migrateToV4(migrateV2(v2));
  return null;
}

/** Counts used for the restore summary, the "meaningful progress" test and the Home nudge */
export function summarize(keys) {
  const st = stateFromKeys(keys);
  let sessions = 0;
  if (st) {
    for (const g of Object.values(st.games || {})) for (const r of Object.values(g?.stages || {})) sessions += Number(r?.tries) || 0;
    for (const r of Object.values(st.results || {})) sessions += Number(r?.tries) || 0;
    for (const b of Object.values(st.bosses || {})) sessions += Number(b?.tries) || 0;
  }
  const custom = parseJSON(keys?.[KEYS.custom]);
  const sim = parseJSON(keys?.[KEYS.sim]);
  const out = {
    sessions,
    matches: st ? (st.ghostMatches || []).length : 0,
    drills: Array.isArray(custom?.drills) ? custom.drills.length : 0,
    shots: Array.isArray(sim?.shots) ? sim.shots.length : 0,
    xp: st ? Number(st.xp) || 0 : 0,
    rankIndex: st ? Math.max(0, Math.min(RANK_NAMES.length - 1, Number(st.rankIndex) || 0)) : 0,
    calibrated: !!(st && st.speedCal && st.speedCal.results && Object.keys(st.speedCal.results).length)
  };
  out.rank = RANK_NAMES[out.rankIndex];
  out.activity = out.sessions + out.matches + out.drills + out.shots;
  out.score = out.activity + (out.xp > 0 ? 1 : 0) + (out.calibrated ? 1 : 0);
  return out;
}
export const isMeaningful = (keys) => summarize(keys).score > 0;
export function summaryLine(s) {
  const p = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  return `${s.rank} · ${p(s.sessions, 'session', 'sessions')} · ${p(s.matches, 'Ghost match', 'Ghost matches')} · ${p(s.drills, 'custom drill', 'custom drills')} · ${p(s.shots, 'saved shot', 'saved shots')}`;
}

/**
 * Which copy should the app run on?  local = localStorage, remote = IndexedDB mirror.
 * Missing/corrupt loses; a good copy never loses to an empty one (unless the empty one is a
 * deliberate reset/restore newer than the other copy); otherwise the newer savedAt/seq wins.
 */
export function choose(local, remote) {
  const L = health(local);
  const R = health(remote);
  if (!R.valid) return { pick: 'local', reason: R.exists ? 'mirror corrupt' : 'no mirror' };
  if (!L.valid) return { pick: 'remote', reason: L.exists ? 'local corrupt' : 'local missing' };
  const lm = isMeaningful(local.keys);
  const rm = isMeaningful(remote.keys);
  const lt = local.savedAt || 0;
  const rt = remote.savedAt || 0;
  if (rm && !lm && !((local.intentAt || 0) && local.intentAt >= rt)) return { pick: 'remote', reason: 'local empty' };
  if (lm && !rm && !((remote.intentAt || 0) && remote.intentAt >= lt)) return { pick: 'local', reason: 'mirror empty' };
  if (rt > lt || (rt === lt && (remote.seq || 0) > (local.seq || 0))) return { pick: 'remote', reason: 'mirror newer' };
  return { pick: 'local', reason: 'local newer or same' };
}

/** Replace every data key in localStorage with the bundle's (UI meta like lastBackupAt is kept) */
export function applyBundle(kv, b, extraMeta = {}) {
  for (const k of DATA_KEYS) kv.removeItem(k);
  for (const [k, v] of Object.entries(b.keys || {})) if (DATA_KEYS.includes(k) && v != null) kv.setItem(k, v);
  const m = readMeta(kv);
  writeMeta(kv, { ...m, seq: b.seq || 0, savedAt: b.savedAt || 0, intentAt: b.intentAt || 0, lastBackupAt: Math.max(m.lastBackupAt || 0, b.ui?.lastBackupAt || 0), ...extraMeta });
}

const sameKeys = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());

// ------------------------------------------------------------------ the vault
export function createVault({ kv, idb, now = () => Date.now(), debounceMs = 400 }) {
  let timer = null;
  let lastSig = '';
  let chain = Promise.resolve();
  let last = { mirroredAt: 0, skipped: null, error: null };
  const serial = (fn) => (chain = chain.then(fn, fn));

  /** Called after any data write: bump the save sequence and schedule a mirror */
  function touch() {
    const m = readMeta(kv);
    writeMeta(kv, { ...m, seq: (m.seq || 0) + 1, savedAt: Math.max(now(), (m.savedAt || 0) + 1) });
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { mirror().catch(() => {}); }, debounceMs);
  }
  function flush() {
    clearTimeout(timer);
    return mirror();
  }
  async function getMirror() {
    try { return (await idb.get(MIRROR_KEY)) || null; } catch { return null; }
  }
  async function snapshots() {
    let s = null;
    try { s = await idb.get(SNAP_KEY); } catch { s = null; }
    return Array.isArray(s) ? s.filter((x) => x && health(x).valid) : [];
  }
  function mirror({ force = false } = {}) {
    return serial(async () => {
      const local = localBundle(kv);
      const sig = `${local.savedAt}|${local.seq}|${local.ui.lastBackupAt}|${JSON.stringify(local.keys)}`;
      if (!force && sig === lastSig) return { skipped: 'same' };
      const cur = await getMirror();
      if (!force) {
        const lh = health(local);
        if (!lh.valid && health(cur).valid) { last = { ...last, skipped: 'local invalid' }; return { skipped: 'local invalid' }; }
        if (cur && health(cur).valid && isMeaningful(cur.keys) && !isMeaningful(local.keys) && !((local.intentAt || 0) >= (cur.savedAt || 0))) {
          last = { ...last, skipped: 'guard' };
          return { skipped: 'guard' }; // never overwrite a good copy with an empty/default one
        }
      }
      try {
        await idb.put(MIRROR_KEY, { ...local, mirroredAt: now() });
      } catch (e) {
        last = { ...last, error: String(e && e.message || e) };
        return { error: last.error };
      }
      lastSig = sig;
      last = { mirroredAt: now(), skipped: null, error: null };
      await autoSnapshot(local);
      return { ok: true };
    });
  }
  async function putSnapshot(reason, bundle, { dedupe = false } = {}) {
    if (!health(bundle).valid || !isMeaningful(bundle.keys)) return null;
    const list = await snapshots();
    if (dedupe && list[0] && sameKeys(list[0].keys, bundle.keys)) return null;
    const t = now();
    const snap = { id: `snap-${t.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`, takenAt: t, reason, seq: bundle.seq || 0, savedAt: bundle.savedAt || 0, keys: { ...bundle.keys }, summary: summarize(bundle.keys) };
    await idb.put(SNAP_KEY, [snap, ...list].slice(0, MAX_SNAPSHOTS));
    return snap;
  }
  async function autoSnapshot(bundle) {
    const list = await snapshots();
    if (!list[0] || now() - list[0].takenAt >= SNAP_EVERY_MS) return putSnapshot('Automatic', bundle, { dedupe: true }).catch(() => null);
    return null;
  }
  /** Snapshot the current local data (e.g. "Before reset"); skipped when there is nothing to keep */
  function snapshot(reason) {
    return serial(() => putSnapshot(reason, localBundle(kv)).catch(() => null));
  }
  /** On load: pick the good copy, repair single corrupt keys, then bring the mirror up to date */
  async function reconcile({ timeoutMs = 2500 } = {}) {
    const local = localBundle(kv);
    // a hung IndexedDB must never block the app: after the timeout we run on localStorage
    const remote = await Promise.race([getMirror(), new Promise((r) => setTimeout(() => r(null), timeoutMs))]);
    const c = choose(local, remote);
    const out = { ...c, restored: [], repaired: [] };
    if (c.pick === 'remote') {
      applyBundle(kv, remote, { lastRestore: { from: 'mirror', reason: c.reason, at: now() } });
      out.restored = Object.keys(remote.keys);
    } else if (remote && health(remote).valid) {
      for (const k of health(local).corrupt) {
        if (keyOk(remote.keys[k])) { kv.setItem(k, remote.keys[k]); out.repaired.push(k); }
      }
    }
    lastSig = '';
    await mirror();
    return out;
  }
  /** Mark the next save as a deliberate replacement (reset) so an empty state may be mirrored */
  function markIntent() {
    const m = readMeta(kv);
    writeMeta(kv, { ...m, intentAt: now() });
  }
  /** Replace all data (backup restore / snapshot restore): current data is snapshotted first */
  async function replaceAll(keys, reason = 'Before restore') {
    await snapshot(reason);
    const t = now();
    const m = readMeta(kv);
    applyBundle(kv, { keys, seq: (m.seq || 0) + 1, savedAt: Math.max(t, (m.savedAt || 0) + 1), intentAt: Math.max(t, (m.savedAt || 0) + 1) }, { lastRestore: { from: reason, at: t } });
    lastSig = '';
    return mirror({ force: true });
  }
  return { touch, schedule, flush, mirror, reconcile, snapshot, snapshots, replaceAll, markIntent, getMirror, status: () => ({ ...last }) };
}

// ------------------------------------------------------------------ backup file
function pad2(n) { return String(n).padStart(2, '0'); }
export function backupFilename(d = new Date()) {
  return `PoolIQ-backup-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.json`;
}
export function buildBackup(kv, { now = Date.now(), appVersion = APP_VERSION } = {}) {
  const keys = {};
  const raw = {};
  for (const k of DATA_KEYS) {
    const v = kv.getItem(k);
    const p = parseJSON(v);
    if (v != null && p !== undefined && p !== null) { keys[k] = p; raw[k] = v; }
  }
  return { format: BACKUP_FORMAT, schema: BACKUP_SCHEMA, app: 'Pool IQ', appVersion, exportedAt: new Date(now).toISOString(), summary: summarize(raw), keys };
}

const VALIDATE = {
  [KEYS.state]: isObj,
  [KEYS.v3]: isObj,
  [KEYS.v2]: isObj,
  [KEYS.custom]: (v) => isObj(v) && Array.isArray(v.drills),
  [KEYS.sim]: isObj,
  [KEYS.ghostPreset]: isObj,
  [KEYS.drillWip]: isObj,
  [KEYS.drillDraft]: isObj
};

/**
 * Validate a backup file's text. Returns {keys (raw strings), summary, exportedAt, appVersion, schema, legacy, dropped}
 * or throws an Error with a friendly message. Accepts: Pool IQ backups (any schema ≤ current, newer ones best-effort)
 * and bare career saves (V2/V3/V4 state objects) — those go through the normal migration on load.
 */
export function parseBackup(text) {
  const o = parseJSON(typeof text === 'string' ? text.replace(/^\uFEFF/, '') : text);
  if (o === undefined) throw new Error('That file is not valid JSON — pick a Pool IQ backup (.json).');
  if (!isObj(o)) throw new Error('That file is not a Pool IQ backup.');
  if (o.format === 'pool-iq-drills') throw new Error('That is a drill export — import it from Drills → Import.');
  let src;
  let legacy = false;
  if (o.format === BACKUP_FORMAT) {
    if (!isObj(o.keys)) throw new Error('That backup is damaged (no data inside).');
    src = o.keys;
  } else if ('xp' in o || 'results' in o || 'ghostMatches' in o || 'games' in o) {
    legacy = true;
    src = { [Number(o.version) >= 4 ? KEYS.state : KEYS.v3]: o };
  } else throw new Error('That file is not a Pool IQ backup.');
  const keys = {};
  const dropped = [];
  for (const [k, v0] of Object.entries(src)) {
    if (!DATA_KEYS.includes(k)) continue;
    const v = typeof v0 === 'string' ? parseJSON(v0) : v0;
    if (VALIDATE[k](v)) keys[k] = JSON.stringify(v);
    else dropped.push(k);
  }
  if (MAIN_KEYS.some((k) => dropped.includes(k))) throw new Error('The progress data in that backup is damaged.');
  if (!Object.keys(keys).length) throw new Error('That backup is empty.');
  let st;
  try { st = stateFromKeys(keys); } catch { throw new Error('The progress data in that backup could not be read.'); }
  if (!st && MAIN_KEYS.some((k) => k in keys)) throw new Error('The progress data in that backup could not be read.');
  const exportedAt = o.exportedAt && !Number.isNaN(Date.parse(o.exportedAt)) ? o.exportedAt : null;
  return { keys, summary: summarize(keys), exportedAt, appVersion: o.appVersion || null, schema: Number(o.schema) || 0, legacy, dropped, newer: Number(o.schema) > BACKUP_SCHEMA };
}

// ------------------------------------------------------------------ reminder helpers
export function daysAgoText(ts, nowMs = Date.now()) {
  if (!ts) return 'never';
  const d = Math.floor((nowMs - ts) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}
/** Home nudge: meaningful progress (3+ sessions/matches/drills/shots), no backup for 7+ days, not dismissed this week */
export function nudgeDue(meta, summary, nowMs = Date.now()) {
  if (!summary || summary.activity < 3) return false;
  if (meta.lastBackupAt && nowMs - meta.lastBackupAt <= NUDGE_DAYS * DAY) return false;
  if (meta.nudgeDismissedAt && nowMs - meta.nudgeDismissedAt <= NUDGE_DAYS * DAY) return false;
  return true;
}
