/**
 * Local player profile (the phone's owner): display name + photo, in its own key (poolIQProfileV1), mirrored to
 * IndexedDB / snapshots / backups by vault.js. Sync-ready shape (stable UUID, createdAt/updatedAt, schema) and a
 * clean exportable publicStats() summary for a future account service / leaderboards. NO network code: nothing is
 * uploaded anywhere and there are no online leaderboards.
 */
import { dataWritten } from './storage.js';
import { uuid } from './friends/model.js';
import { careerStatus, drillRankStatus, masteryCounts } from './progression/rank.js';
import { computeSkillLevels } from './progression/skillLevels.js';

export const PROFILE_KEY = 'poolIQProfileV1';
export const PROFILE_SCHEMA = 1;
export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 90 * 1024; // data URL length cap (~256px JPEG/WebP is ~10–30 KB)
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
export const AVATAR_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export function defaultProfile(now = Date.now()) {
  return { schema: PROFILE_SCHEMA, id: uuid(), displayName: '', avatar: null, createdAt: now, updatedAt: now };
}
export function loadProfile() {
  try {
    const p = JSON.parse(ls()?.getItem(PROFILE_KEY) || 'null');
    if (p && typeof p === 'object' && typeof p.id === 'string') return { ...defaultProfile(p.createdAt || Date.now()), ...p, avatar: validAvatar(p.avatar) ? p.avatar : null };
  } catch { /* fall through */ }
  return null;
}
/** The profile, created (and saved) on first use */
export function getProfile() {
  return loadProfile() || saveProfile(defaultProfile());
}
export function saveProfile(p, now = Date.now()) {
  const out = { ...p, schema: PROFILE_SCHEMA, updatedAt: now };
  try { ls()?.setItem(PROFILE_KEY, JSON.stringify(out)); dataWritten(PROFILE_KEY); } catch { /* quota */ }
  return out;
}
export const cleanDisplayName = (s) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
export const validAvatar = (a) => typeof a === 'string' && a.length <= AVATAR_MAX_BYTES && AVATAR_RE.test(a);
export function updateProfile(patch, now = Date.now()) {
  const p = getProfile();
  const next = { ...p };
  if ('displayName' in patch) next.displayName = cleanDisplayName(patch.displayName);
  if ('avatar' in patch) {
    if (patch.avatar !== null && !validAvatar(patch.avatar)) return { profile: p, error: 'That photo could not be used' };
    next.avatar = patch.avatar;
  }
  return { profile: saveProfile(next, now) };
}
export const displayNameOf = (p) => (p && p.displayName) || 'You';

/**
 * Public stats summary — the object a future account service / leaderboard would receive. Training data only
 * (PvP results are private to this phone). Pure; nothing is sent anywhere.
 */
export function publicStats(state, profile = getProfile(), now = Date.now()) {
  const cs = careerStatus(state);
  const dr = drillRankStatus(state);
  const mc = masteryCounts(state);
  const lv = computeSkillLevels(state, now);
  const gm = state.ghostMatches || [];
  return {
    format: 'pool-iq-public-stats',
    schema: 1,
    profileId: profile.id,
    displayName: displayNameOf(profile),
    generatedAt: new Date(now).toISOString(),
    profileUpdatedAt: new Date(profile.updatedAt || now).toISOString(),
    career: { rankIndex: cs.rankIndex, rank: cs.name, ball: cs.champion ? null : cs.ball, title: cs.title, champion: cs.champion, lifetimeXp: cs.lifetimeXp },
    drillRank: { number: dr.number, name: dr.name, drillXp: dr.have.xp },
    mastery: { passed: mc.passed, strong: mc.strong, mastered: mc.mastered },
    skills: Object.fromEntries(Object.values(lv).map((s) => [s.id, { level: s.label, step: s.step, rating: s.score }])),
    ghost: { matches: gm.length, wins: gm.filter((m) => m.won).length },
    devSeeded: !!state.devSeed // DEV MODE test states must never be synced
  };
}

/** Browser only: square-crop + downscale an image File to a ~256px JPEG/WebP data URL */
export async function avatarFromFile(file, size = AVATAR_SIZE) {
  if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Pick a photo');
  if (file.size > 25 * 1048576) throw new Error('That photo is too large');
  let src;
  let bmp = null;
  try { bmp = await createImageBitmap(file); src = bmp; } catch {
    src = await new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new Error('That photo could not be read')); img.src = URL.createObjectURL(file); });
  }
  const w = src.width || src.naturalWidth;
  const h = src.height || src.naturalHeight;
  const s = Math.min(w, h);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  if (bmp && bmp.close) bmp.close();
  for (const [type, q] of [['image/webp', 0.82], ['image/jpeg', 0.82], ['image/jpeg', 0.6], ['image/jpeg', 0.4]]) {
    const url = c.toDataURL(type, q);
    if (url.startsWith(`data:${type}`) && url.length <= AVATAR_MAX_BYTES) return url;
  }
  throw new Error('That photo could not be shrunk enough');
}
