/**
 * Pool IQ v13 — thin wrapper around the bundled supabase-js v2 UMD build (js/vendor/supabase.js, window.supabase).
 * The library is only loaded when it is needed (a saved sign-in, an auth link, or opening Account / Leaderboard),
 * so signed-out and offline use costs nothing extra. It is precached by sw.js, so it also loads offline.
 */
import { SUPABASE_URL, SUPABASE_KEY, SITE_URL, AUTH_STORAGE_KEY, LIB_SRC, AVATAR_BUCKET } from './config.js';
import { avatarPath, dataUrlParts } from './sync.js';

let libPromise = null;
let client = null;
let session = null;
const listeners = new Set();

export const hasStoredSession = () => { try { return !!localStorage.getItem(AUTH_STORAGE_KEY); } catch { return false; } };
/** #access_token=… / #error_description=… on arrival = the app was opened from a Supabase auth email link */
export const isAuthCallbackHash = (h = '') => /(^|[#&])(access_token|error_description|error_code)=/.test(String(h));

export function loadLib() {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
  if (!libPromise) {
    libPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = LIB_SRC;
      s.async = true;
      s.dataset.supabaseLib = '1';
      s.onload = () => (window.supabase && window.supabase.createClient ? resolve(window.supabase) : reject(new Error('Account library failed to load')));
      s.onerror = () => { libPromise = null; s.remove(); reject(new Error('Account library failed to load')); };
      document.head.appendChild(s);
    });
  }
  return libPromise;
}

/** Create the client once. onEvent(event, session) mirrors supabase auth events (SIGNED_IN, SIGNED_OUT, PASSWORD_RECOVERY…) */
export async function getClient() {
  if (client) return client;
  const lib = await loadLib();
  if (client) return client;
  client = lib.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: AUTH_STORAGE_KEY }
  });
  client.auth.onAuthStateChange((event, s) => {
    session = s || null;
    for (const fn of listeners) { try { fn(event, session); } catch (e) { console.warn('Pool IQ auth listener', e); } }
  });
  try {
    const { data } = await client.auth.getSession();
    session = data?.session || null;
  } catch { session = null; }
  return client;
}
export const onAuth = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const currentSession = () => session;
export const currentUser = () => session?.user || null;
export const isReady = () => !!client;

const need = (r) => { if (r.error) throw r.error; return r.data; };

// ------------------------------------------------------------------ auth (email + password only; no magic links)
export async function signUp(email, password) {
  const c = await getClient();
  const data = need(await c.auth.signUp({ email, password, options: { emailRedirectTo: SITE_URL } }));
  return { user: data.user, session: data.session, needsConfirm: !data.session };
}
export async function signIn(email, password) {
  const c = await getClient();
  return need(await c.auth.signInWithPassword({ email, password }));
}
export async function signOut() {
  const c = await getClient();
  const r = await c.auth.signOut({ scope: 'local' });
  session = null;
  if (r.error) throw r.error;
}
export async function sendPasswordReset(email) {
  const c = await getClient();
  need(await c.auth.resetPasswordForEmail(email, { redirectTo: SITE_URL }));
}
export async function updatePassword(password) {
  const c = await getClient();
  return need(await c.auth.updateUser({ password }));
}

// ------------------------------------------------------------------ data (row-level security does the access control)
export async function fetchSaveHead(userId) {
  const c = await getClient();
  return need(await c.from('saves').select('updated_at, device_id, device_label, local_saved_at, summary, app_version').eq('user_id', userId).maybeSingle());
}
export async function fetchSave(userId) {
  const c = await getClient();
  return need(await c.from('saves').select('*').eq('user_id', userId).maybeSingle());
}
export async function upsertSave(row) {
  const c = await getClient();
  return need(await c.from('saves').upsert(row, { onConflict: 'user_id' }).select('updated_at, device_id, device_label, local_saved_at, summary').single());
}
export async function fetchProfile(userId) {
  const c = await getClient();
  return need(await c.from('profiles').select('*').eq('id', userId).maybeSingle());
}
export async function upsertProfile(row) {
  const c = await getClient();
  return need(await c.from('profiles').upsert(row, { onConflict: 'id' }).select('*').single());
}
export async function upsertPublicStats(row) {
  const c = await getClient();
  return need(await c.from('public_stats').upsert(row, { onConflict: 'user_id' }).select('user_id, updated_at').single());
}
export async function patchPublicStatsIdentity(userId, patch) {
  const c = await getClient();
  return need(await c.from('public_stats').update(patch).eq('user_id', userId).select('user_id'));
}
/** Everyone in the project (5–10 friends): profiles + public stats */
export async function fetchLeaderboard() {
  const c = await getClient();
  const [p, s] = await Promise.all([c.from('profiles').select('id, display_name, avatar_url, updated_at').limit(500), c.from('public_stats').select('*').limit(500)]);
  return { profiles: need(p) || [], stats: need(s) || [] };
}
/** Upload the (already 256 px) profile photo to avatars/<user id>/avatar and return its public URL */
export async function uploadAvatar(userId, dataUrl) {
  const c = await getClient();
  const parts = dataUrlParts(dataUrl);
  if (!parts) throw new Error('That photo could not be uploaded');
  const path = avatarPath(userId);
  need(await c.storage.from(AVATAR_BUCKET).upload(path, new Blob([parts.bytes], { type: parts.mime }), { upsert: true, contentType: parts.mime, cacheControl: '3600' }));
  const { data } = c.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now().toString(36)}`;
}
export async function removeAvatar(userId) {
  const c = await getClient();
  need(await c.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)]));
}
