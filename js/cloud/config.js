/**
 * Pool IQ v13 online accounts — Supabase project settings (public values only).
 * The publishable key is meant to ship in the client (like the old "anon" key): it only identifies the project.
 * All data access is enforced server-side by row-level security (supabase/schema.sql). No secrets live here.
 */
export const PROJECT_REF = 'nqfwlpfyccbqetcyjijf';
export const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
export const SUPABASE_KEY = 'sb_publishable_w__OM4GIQtLO3bxr2XBuoQ_cx2V7-Am';
export const SITE_URL = 'https://rhino515.github.io/pooltraining/';
/** where supabase-js keeps the signed-in session (its default storage key for this project) */
export const AUTH_STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;
/** official supabase-js v2 UMD build, bundled + precached so the app still loads offline */
export const LIB_SRC = './js/vendor/supabase.js';
export const LIB_VERSION = '2.117.2';
export const AVATAR_BUCKET = 'avatars';
