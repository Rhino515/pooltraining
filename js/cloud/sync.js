/**
 * Pool IQ v13 cloud save / profile / leaderboard logic — pure functions (no network, no DOM) so Node tests can run
 * them. The network side is js/cloud/client.js; the app wiring is js/cloud/controller.js.
 *
 * Cloud bookkeeping (device id, which cloud save this device has seen, last upload) lives in the vault's UI meta
 * key (poolIQMetaV1 → .cloud). That key is never part of backups / restores, so it stays per-device.
 */
import { readMeta, writeMeta, buildBackup, parseBackup, summarize, localBundle, isMeaningful, APP_VERSION, BACKUP_FORMAT } from '../vault.js';

export const AUTO_UPLOAD_DELAY_MS = 20000; // debounce: upload ~20 s after the last session / result is saved
export const SORTS = { xp: 'Lifetime XP', career: 'Career rank', drill: 'Drill Rank' };

const rnd = () => Math.random().toString(36).slice(2, 10);

// ------------------------------------------------------------------ per-device cloud meta
export function cloudMeta(kv) {
  const m = readMeta(kv).cloud;
  return m && typeof m === 'object' ? m : {};
}
export function setCloudMeta(kv, patch) {
  const m = readMeta(kv);
  const cur = m.cloud && typeof m.cloud === 'object' ? m.cloud : {};
  const next = { ...cur, ...patch };
  writeMeta(kv, { ...m, cloud: next });
  return next;
}
/** A stable random id for this install (tells "saved on this phone" from "saved on another device") */
export function deviceId(kv) {
  const m = cloudMeta(kv);
  if (typeof m.deviceId === 'string' && m.deviceId) return m.deviceId;
  return setCloudMeta(kv, { deviceId: `dev-${Date.now().toString(36)}-${rnd()}` }).deviceId;
}
export function deviceLabel(ua = '') {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux computer';
  return 'Browser';
}
/** Switching accounts on one phone must not reuse the other account's "already seen" markers */
export function metaForUser(kv, userId) {
  const m = cloudMeta(kv);
  if (m.userId === userId) return m;
  return setCloudMeta(kv, { userId, cloudUpdatedAt: null, lastUploadAt: 0, lastUploadSig: '', profileSig: '', statsSig: '', conflict: null, offerDismissedFor: null });
}

// ------------------------------------------------------------------ cloud save rows
/** What changes when a session / match / drill is saved — auto upload only fires when this changes */
export function activitySig(summary) {
  const s = summary || {};
  return [s.sessions, s.matches, s.pvp, s.lifetimeXp, s.xp, s.rankIndex, s.drills, s.shots, s.content, s.friends, s.player].join('|');
}
/** saves table row: one pool-iq-backup JSON (the same format as Settings → Back Up Now) */
export function buildSaveRow(kv, { userId, deviceId: dev, deviceLabel: label, now = Date.now() } = {}) {
  const data = buildBackup(kv, { now });
  const b = localBundle(kv);
  return { user_id: userId, data, summary: data.summary, app_version: APP_VERSION, device_id: dev || null, device_label: label || null, local_saved_at: b.savedAt || now };
}
/** Validate a cloud row exactly like a backup file (throws friendly errors) */
export function parseCloudSave(row) {
  if (!row || !row.data || typeof row.data !== 'object') throw new Error('There is no cloud save for this account yet.');
  if (row.data.format !== BACKUP_FORMAT) throw new Error('The cloud save is not a Pool IQ backup.');
  const parsed = parseBackup(JSON.stringify(row.data));
  return { ...parsed, updatedAt: row.updated_at || null, deviceId: row.device_id || null, deviceLabel: row.device_label || null, localSavedAt: Number(row.local_saved_at) || 0 };
}
const ts = (v) => (typeof v === 'number' ? v : v ? Date.parse(v) || 0 : 0);
/**
 * Newest-wins comparison between this device and the cloud save. Never decides on its own: the UI always asks.
 *   known       this device already has this exact cloud save (uploaded it or restored it) → nothing to offer
 *   newer       'cloud' | 'local' | 'same' — by when the data last changed (local savedAt vs the uploaded save's savedAt)
 *   recommend   'restore' (cloud newer or this device empty) | 'upload' (this device newer) | 'none'
 */
export function compareWithCloud({ kv, row, userId }) {
  if (!row) return { exists: false, known: false, newer: 'local', recommend: 'upload' };
  const m = cloudMeta(kv);
  const b = localBundle(kv);
  const localMeaningful = isMeaningful(b.keys);
  const cloudAt = Number(row.local_saved_at) || ts(row.updated_at);
  const localAt = b.savedAt || 0;
  const known = m.userId === userId && !!m.cloudUpdatedAt && m.cloudUpdatedAt === row.updated_at;
  const newer = !localMeaningful ? 'cloud' : cloudAt > localAt ? 'cloud' : cloudAt < localAt ? 'local' : 'same';
  const recommend = known ? 'none' : newer === 'cloud' ? 'restore' : newer === 'local' ? 'upload' : 'none';
  return { exists: true, known, newer, recommend, localMeaningful, localAt, cloudAt, localSummary: summarize(b.keys), cloudSummary: row.summary || null, fromThisDevice: !!row.device_id && row.device_id === m.deviceId };
}
/** Before an automatic upload: is the cloud copy one this device has not seen (another phone saved since)? */
export function uploadBlocked({ kv, head, userId }) {
  if (!head) return null; // no cloud save yet → safe to create
  const m = cloudMeta(kv);
  if (m.userId === userId && m.cloudUpdatedAt && m.cloudUpdatedAt === head.updated_at) return null;
  if (m.userId === userId && !m.cloudUpdatedAt && head.device_id && head.device_id === m.deviceId) return null;
  return { updatedAt: head.updated_at, deviceLabel: head.device_label || 'another device', reason: 'cloud-changed' };
}

// ------------------------------------------------------------------ profile + public stats rows
export function profileRow(profile, userId, avatarUrl) {
  return { id: userId, display_name: String(profile?.displayName || '').slice(0, 24), avatar_url: avatarUrl || null, local_profile_id: profile?.id ? String(profile.id).slice(0, 64) : null };
}
export function profileSig(profile) {
  const a = profile?.avatar || '';
  let h = 0;
  for (let i = 0; i < a.length; i += 7) h = (h * 31 + a.charCodeAt(i)) >>> 0;
  return `${profile?.displayName || ''}|${a.length}|${h}`;
}
/** public_stats row from the public stats export (profile.js publicStats). DEV MODE test states are never shared. */
export function publicStatsRow(ps, { userId, avatarUrl = null } = {}) {
  if (!ps || ps.format !== 'pool-iq-public-stats' || ps.devSeeded) return null;
  const n = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
  const stats = { ...ps };
  delete stats.devSeeded;
  return {
    user_id: userId,
    display_name: String(ps.displayName === 'You' ? '' : ps.displayName || '').slice(0, 24),
    avatar_url: avatarUrl,
    rank_index: n(ps.career?.rankIndex),
    rank_name: String(ps.career?.rank || '').slice(0, 40),
    ball: ps.career?.ball == null ? null : n(ps.career.ball),
    rank_title: ps.career?.title ? String(ps.career.title).slice(0, 60) : null,
    champion: !!ps.career?.champion,
    lifetime_xp: n(ps.career?.lifetimeXp),
    drill_rank: n(ps.drillRank?.number),
    drill_rank_name: String(ps.drillRank?.name || '').slice(0, 40),
    drill_xp: n(ps.drillRank?.drillXp),
    stars: n(ps.stars),
    ghost_matches: n(ps.ghost?.matches),
    ghost_wins: n(ps.ghost?.wins),
    pvp_wins: ps.pvp ? n(ps.pvp.wins) : null,
    pvp_losses: ps.pvp ? n(ps.pvp.losses) : null,
    stats
  };
}
export function statsSig(row) {
  if (!row) return '';
  const { stats, ...rest } = row;
  return JSON.stringify({ ...rest, skills: stats?.skills, mastery: stats?.mastery });
}

// ------------------------------------------------------------------ leaderboard
/** Merge profiles + public_stats (everyone in the project) into leaderboard entries */
export function mergeLeaderboard(profiles = [], stats = [], meId = null) {
  const byId = new Map();
  for (const p of profiles || []) byId.set(p.id, { id: p.id, name: p.display_name || '', avatarUrl: p.avatar_url || null, stats: null });
  for (const s of stats || []) {
    const e = byId.get(s.user_id) || { id: s.user_id, name: s.display_name || '', avatarUrl: s.avatar_url || null, stats: null };
    e.stats = s;
    if (!e.name) e.name = s.display_name || '';
    if (!e.avatarUrl) e.avatarUrl = s.avatar_url || null;
    byId.set(s.user_id, e);
  }
  return [...byId.values()].map((e) => ({ ...e, name: e.name || 'Player', isMe: e.id === meId }));
}
const num = (v) => Number(v) || 0;
export function sortLeaderboard(entries, by = 'xp') {
  const s = (e) => e.stats || {};
  const cmp = {
    xp: (a, b) => num(s(b).lifetime_xp) - num(s(a).lifetime_xp),
    career: (a, b) => (s(b).champion ? 1 : 0) - (s(a).champion ? 1 : 0) || num(s(b).rank_index) - num(s(a).rank_index) || num(s(b).ball) - num(s(a).ball) || num(s(b).lifetime_xp) - num(s(a).lifetime_xp),
    drill: (a, b) => num(s(b).drill_rank) - num(s(a).drill_rank) || num(s(b).drill_xp) - num(s(a).drill_xp)
  }[SORTS[by] ? by : 'xp'];
  return [...entries].sort((a, b) => (a.stats ? 0 : 1) - (b.stats ? 0 : 1) || cmp(a, b) || String(a.name).localeCompare(String(b.name)));
}

// ------------------------------------------------------------------ avatars
/** data:image/...;base64 → { mime, ext, bytes } (the app already shrinks photos to 256 px, ≤ 90 KB) */
export function dataUrlParts(dataUrl) {
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const bin = typeof atob === 'function' ? atob(m[3]) : Buffer.from(m[3], 'base64').toString('binary');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime: m[1], ext: m[2] === 'jpeg' ? 'jpg' : m[2], bytes };
}
export const avatarPath = (userId) => `${userId}/avatar`;

// ------------------------------------------------------------------ friendly errors
export function friendlyError(err) {
  const msg = String((err && (err.message || err.error_description || err.msg)) || err || '');
  if (/failed to fetch|networkerror|load failed|network request failed|offline|fetch/i.test(msg) && !/invalid/i.test(msg)) return 'No connection — check your internet and try again.';
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/user already registered|already been registered/i.test(msg)) return 'That email already has an account — sign in instead.';
  if (/password should be at least|weak password/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/unable to validate email|invalid email|email address .* is invalid/i.test(msg)) return 'That email address doesn’t look right.';
  if (/email address not authorized/i.test(msg)) return 'Reset emails can only go to the project owner’s address until custom email is set up — ask Andrew to reset your password.';
  if (/rate limit|too many/i.test(msg)) return 'Too many tries — wait a few minutes and try again.';
  if (/jwt|session|not signed in|auth session missing/i.test(msg)) return 'Your sign-in expired — please sign in again.';
  return msg || 'Something went wrong — try again.';
}
