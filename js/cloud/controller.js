/**
 * Pool IQ v13 online accounts — app wiring: auth events, profile sync, cloud save (auto + manual, with the
 * newest-wins confirm flow), public stats and the friends leaderboard. Created once by app.js.
 *
 * Rules: the app works fully signed out / offline; the account library only loads when needed; local data is never
 * overwritten without a confirm step, and a snapshot is taken before any restore (vault.replaceAll).
 */
import * as CL from './client.js';
import * as S from './sync.js';
import * as AU from '../ui/account.js';
import { getProfile, updateProfile, publicStats, PROFILE_KEY, validAvatar } from '../profile.js';
import { loadFriends, playerStats } from '../friends/model.js';
import { openSheet, closeSheet, toast, sheetKind } from '../ui/sheet.js';

const CLOUD_ROUTES = new Set(['settings', 'account', 'leaderboard', 'me', 'profile']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

/**
 * env: { kv, vault, V, getState, routeName(), renderRoute(), navigate(hash), flash(msg) }
 */
export function createCloud(env) {
  const { kv, vault, V } = env;
  const ui = { mode: 'signin', msg: null, email: '', recovery: false, lb: null, lbLoading: false, sort: 'xp', pending: null, pendingOffer: null };
  let started = false;
  let ready = false;
  let user = null;
  let running = false;
  let timer = null;
  let profileTimer = null;
  let lastRendered = '';
  let bootHash = '';

  // ---------------------------------------------------------------- status for the screens
  function status() {
    const p = getProfile();
    const m = S.cloudMeta(kv);
    return {
      user, ready, checking: !ready && (started || CL.hasStoredSession()), mode: ui.mode, msg: ui.msg, email: ui.email, recovery: ui.recovery,
      profileName: p.displayName || '', profileAvatar: p.avatar || null,
      profileSync: user ? (m.profileSynced ? `Name + photo synced ${AU.fmtWhen(m.profileSynced)}` : 'Name + photo sync when you save your profile') : '',
      cloud: user && m.userId === user.id ? m : {}, devSeeded: !!env.getState()?.devSeed, route: env.routeName(), lb: ui.lb, sort: ui.sort
    };
  }
  const sig = () => `${ready ? 1 : 0}|${user ? user.id : '-'}`;
  /** Refresh what is on screen without closing an open sheet or jumping the scroll position */
  function refresh({ full = false } = {}) {
    const r = env.routeName();
    if (!CLOUD_ROUTES.has(r)) return;
    const changed = sig() !== lastRendered;
    if ((full || changed) && !sheetKind() && !document.body.classList.contains('playing')) { env.renderRoute(); return; }
    const st = status();
    const card = document.querySelector('[data-card="cloud"]');
    if (card) card.outerHTML = AU.cloudCardHTML(st);
    const who = document.querySelector('[data-account="signed-in"] .acWho small');
    if (who) who.textContent = st.profileSync;
  }
  function rendered() { lastRendered = sig(); }

  // ---------------------------------------------------------------- start-up
  function init(hash) {
    bootHash = hash || '';
    CL.onAuth(onAuthEvent);
    if (CL.hasStoredSession() || CL.isAuthCallbackHash(bootHash)) start();
    window.addEventListener('online', () => { if (user) schedule(3000); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); timer = null; autoSync(); } });
  }
  function start() {
    if (started) return;
    started = true;
    CL.getClient().then(() => {
      ready = true;
      user = CL.currentUser();
      if (/error_description=/.test(bootHash)) {
        const m = /error_description=([^&]+)/.exec(bootHash);
        const text = decodeURIComponent((m ? m[1] : '').replace(/\+/g, ' '));
        ui.msg = { text: /expired|invalid/i.test(text) ? 'That email link is invalid or has expired — send a new one.' : text || 'That email link did not work.' };
        location.replace('#account/reset');
      } else if (user && !ui.recovery) {
        // offline: no requests at all (the app runs on this device); catch up once the connection is back
        if (offline()) window.addEventListener('online', () => afterSignIn('resume'), { once: true });
        else setTimeout(() => afterSignIn('resume'), 0);
      }
      refresh();
    }).catch((e) => {
      started = false;
      ready = false;
      console.warn('Pool IQ account library', e);
      refresh();
    });
  }
  function ensure() { if (!started) start(); }

  function onAuthEvent(event, session) {
    const prev = user;
    user = session?.user || null;
    if (event === 'PASSWORD_RECOVERY') {
      ui.recovery = true;
      setTimeout(() => env.navigate('#account/newpass'), 60);
    } else if (event === 'SIGNED_IN' && user && (!prev || prev.id !== user.id) && ready && !ui.recovery) {
      setTimeout(() => afterSignIn('signin'), 0);
    } else if (event === 'SIGNED_OUT') {
      ui.lb = null;
      clearTimeout(timer);
      timer = null;
    }
    setTimeout(() => refresh(), 0);
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(() => env.renderRoute(), 40);
  }

  // ---------------------------------------------------------------- after sign-in: profile, cloud save offer, stats
  async function afterSignIn(kind) {
    if (!user || running) return;
    running = true;
    const uid = user.id;
    try {
      S.metaForUser(kv, uid);
      S.deviceId(kv);
      if (kind === 'signin') S.setCloudMeta(kv, { offerDismissedFor: null });
      await syncProfile({ adopt: true }).catch((e) => console.warn('Pool IQ profile sync', e));
      const head = await CL.fetchSaveHead(uid);
      if (!head) {
        if (V.isMeaningful(V.localBundle(kv).keys) && !env.getState()?.devSeed) {
          await uploadNow({ force: true });
          toast('Cloud backup created');
        }
      } else {
        const cmp = S.compareWithCloud({ kv, row: head, userId: uid });
        if (!cmp.known) {
          S.setCloudMeta(kv, { conflict: { updatedAt: head.updated_at, deviceLabel: head.device_label || 'another device' } });
          if (S.cloudMeta(kv).offerDismissedFor !== head.updated_at) offer(head, cmp);
        } else S.setCloudMeta(kv, { conflict: null });
      }
      await syncStats().catch((e) => console.warn('Pool IQ stats sync', e));
    } catch (e) {
      console.warn('Pool IQ sign-in sync', e);
    } finally {
      running = false;
      refresh();
    }
  }
  function offer(head, cmp) {
    ui.pendingOffer = { head, cmp };
    showPendingOffer();
  }
  /** Shown only when nothing else is open and no game is being scored (app.js calls this after each route) */
  function showPendingOffer() {
    if (!ui.pendingOffer || sheetKind() || document.body.classList.contains('playing')) return;
    const { head, cmp } = ui.pendingOffer;
    ui.pendingOffer = null;
    ui.pending = { row: head, cmp };
    openSheet(AU.offerSheetHTML(cmp, head), { id: 'cloud-offer' });
  }

  // ---------------------------------------------------------------- profile (name + photo)
  async function dataUrlFromUrl(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('photo download failed');
    const blob = await res.blob();
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error('photo read failed')); r.readAsDataURL(blob); });
  }
  async function syncProfile({ adopt = false } = {}) {
    if (!user) return;
    const uid = user.id;
    let p = getProfile();
    const m = S.cloudMeta(kv);
    let cloudP = null;
    if (adopt) {
      cloudP = await CL.fetchProfile(uid);
      // a fresh phone with no name / photo yet takes them from the account (never replaces a local name or photo)
      if (cloudP && !p.displayName && !p.avatar && (cloudP.display_name || cloudP.avatar_url)) {
        const patch = { displayName: cloudP.display_name || '' };
        const safe = AU.safeAvatarUrl(cloudP.avatar_url);
        if (safe) { try { const d = await dataUrlFromUrl(safe); if (validAvatar(d)) patch.avatar = d; } catch { /* photo stays remote-only */ } }
        p = updateProfile(patch).profile;
        S.setCloudMeta(kv, { profileSig: S.profileSig(p), avatarSig: S.profileSig({ avatar: p.avatar }), avatarUrl: patch.avatar ? cloudP.avatar_url : null, profileSynced: Date.now() });
        if (!patch.avatar && cloudP.avatar_url) await CL.upsertProfile(S.profileRow(p, uid, null));
        return;
      }
    }
    const psig = S.profileSig(p);
    const asig = S.profileSig({ avatar: p.avatar });
    if (psig === m.profileSig && m.profileSynced && (!cloudP || (cloudP.display_name === (p.displayName || '') && (cloudP.avatar_url || null) === (m.avatarUrl || null)))) return;
    let avatarUrl = m.avatarUrl || null;
    if (p.avatar) {
      if (asig !== m.avatarSig || !avatarUrl) avatarUrl = await CL.uploadAvatar(uid, p.avatar);
    } else if (avatarUrl || cloudP?.avatar_url) {
      await CL.removeAvatar(uid).catch(() => {});
      avatarUrl = null;
    }
    await CL.upsertProfile(S.profileRow(p, uid, avatarUrl));
    S.setCloudMeta(kv, { profileSig: psig, avatarSig: asig, avatarUrl, profileSynced: Date.now() });
  }

  // ---------------------------------------------------------------- public stats (leaderboard row)
  async function syncStats({ force = false } = {}) {
    const st = env.getState();
    if (!user || !st || st.devSeed) return false;
    const m = S.cloudMeta(kv);
    let pvp = null;
    if (m.shareWins) {
      const d = loadFriends();
      const me = d.players.find((x) => x.isMe);
      if (me) pvp = playerStats(d, me.id);
    }
    const row = S.publicStatsRow(publicStats(st, getProfile(), Date.now(), { pvp }), { userId: user.id, avatarUrl: m.avatarUrl || null });
    if (!row) return false;
    const s = S.statsSig(row);
    if (!force && s === m.statsSig) return false;
    await CL.upsertPublicStats(row);
    S.setCloudMeta(kv, { statsSig: s, statsAt: Date.now() });
    return true;
  }

  // ---------------------------------------------------------------- cloud save
  async function uploadNow({ force = false } = {}) {
    const uid = user.id;
    const head = await CL.fetchSaveHead(uid);
    const blocked = S.uploadBlocked({ kv, head, userId: uid });
    if (blocked && !force) {
      S.setCloudMeta(kv, { conflict: blocked });
      return { blocked, head };
    }
    await vault.flush().catch(() => {});
    const row = S.buildSaveRow(kv, { userId: uid, deviceId: S.deviceId(kv), deviceLabel: S.deviceLabel(navigator.userAgent || '') });
    const out = await CL.upsertSave(row);
    S.setCloudMeta(kv, { cloudUpdatedAt: out.updated_at, lastUploadAt: Date.now(), lastUploadSig: S.activitySig(row.summary), conflict: null, offerDismissedFor: null });
    return { ok: true, row: out };
  }
  function schedule(ms = S.AUTO_UPLOAD_DELAY_MS) {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; autoSync(); }, ms);
  }
  /** Called for every data write (storage.js onDataWrite): debounced upload after sessions / results */
  function noteDataChange(key) {
    if (!user) return;
    if (key === PROFILE_KEY) {
      clearTimeout(profileTimer);
      profileTimer = setTimeout(() => { syncProfile().then(() => syncStats()).catch((e) => console.warn('Pool IQ profile sync', e)).finally(() => refresh()); }, 2500);
    }
    schedule();
  }
  async function autoSync() {
    if (!user || running || offline()) return;
    const st = env.getState();
    if (!st || st.devSeed) return;
    running = true;
    try {
      const keys = V.localBundle(kv).keys;
      const m = S.cloudMeta(kv);
      if (!m.conflict && m.userId === user.id && V.isMeaningful(keys) && S.activitySig(V.summarize(keys)) !== m.lastUploadSig) {
        const r = await uploadNow();
        if (r.blocked) toast('Cloud save changed on another device — automatic backup paused (Settings)');
      }
      await syncStats();
    } catch (e) {
      console.warn('Pool IQ auto backup', e); // offline / server hiccup: retried after the next session or when back online
    } finally {
      running = false;
      refresh();
    }
  }

  // ---------------------------------------------------------------- leaderboard
  async function loadLeaderboard() {
    if (!user || ui.lbLoading) return;
    if (offline()) {
      ui.lb = { ...(ui.lb || {}), error: 'You’re offline — the leaderboard needs a connection.', at: ui.lb && ui.lb.entries ? Date.now() : 0 };
      if (env.routeName() === 'leaderboard' && !sheetKind()) env.renderRoute();
      return;
    }
    ui.lbLoading = true;
    try {
      await syncStats().catch(() => {});
      const { profiles, stats } = await CL.fetchLeaderboard();
      const entries = S.mergeLeaderboard(profiles, stats, user.id);
      ui.lb = { entries: S.sortLeaderboard(entries, ui.sort), at: Date.now() };
    } catch (e) {
      ui.lb = { ...(ui.lb || {}), error: S.friendlyError(e), at: ui.lb && ui.lb.entries ? Date.now() : 0 };
    } finally {
      ui.lbLoading = false;
      if (env.routeName() === 'leaderboard' && !sheetKind()) env.renderRoute();
    }
  }

  // ---------------------------------------------------------------- screens
  function renderAccountPage(sub) {
    ensure();
    const html = AU.renderAccount(status(), sub);
    rendered();
    return html;
  }
  function renderLeaderboardPage() {
    ensure();
    // load when first shown or older than a minute; after a failure only TRY AGAIN / REFRESH reloads (no retry loop)
    if (user && !ui.lbLoading && (!ui.lb || (ui.lb.entries && Date.now() - (ui.lb.at || 0) > 60000))) setTimeout(loadLeaderboard, 0);
    const html = AU.renderLeaderboard(status());
    rendered();
    return html;
  }
  function settingsCardHTML() {
    rendered();
    return AU.cloudCardHTML(status());
  }

  // ---------------------------------------------------------------- forms + actions
  const $ = (id) => document.getElementById(id);
  function formBusy(on) {
    const b = document.querySelector('[data-ac-submit]');
    if (!b) return;
    if (on) { b.dataset.label = b.textContent; b.textContent = 'PLEASE WAIT…'; b.disabled = true; } else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  }
  function formMsg(text, ok = false) {
    ui.msg = text ? { text, ok } : null;
    const el = document.querySelector('[data-ac-msg]');
    if (el) { el.textContent = text || ''; el.className = `acMsg ${text ? (ok ? 'ok' : 'err') : ''}`; el.dataset.acMsg = text ? (ok ? 'ok' : 'err') : ''; }
  }
  async function submit(kind) {
    const email = ($('acEmail')?.value || '').trim();
    const pass = $('acPass')?.value || '';
    if (email) ui.email = email;
    if ((kind === 'signin' || kind === 'signup' || kind === 'reset') && !EMAIL_RE.test(email)) return formMsg('Enter your email address.');
    if ((kind === 'signin' || kind === 'signup' || kind === 'newpass') && pass.length < 6) return formMsg('Password must be at least 6 characters.');
    if (kind === 'newpass' && pass !== ($('acPass2')?.value || '')) return formMsg('The two passwords don’t match.');
    formBusy(true);
    formMsg('');
    try {
      if (kind === 'signin') {
        await CL.signIn(email, pass);
        user = CL.currentUser();
        ui.msg = null;
        toast('Signed in');
        env.renderRoute();
      } else if (kind === 'signup') {
        const name = ($('acName')?.value || '').trim();
        const out = await CL.signUp(email, pass);
        if (name) updateProfile({ displayName: name });
        if (out.needsConfirm) { formBusy(false); formMsg('Account created — confirm the email we sent, then sign in.', true); return; }
        user = CL.currentUser();
        ui.msg = null;
        toast('Account created — you’re signed in');
        env.renderRoute();
      } else if (kind === 'reset') {
        await CL.sendPasswordReset(email);
        formBusy(false);
        formMsg('If that email has an account, a reset link is on its way. Open it, set a new password, then sign in here.', true);
      } else if (kind === 'newpass') {
        await CL.updatePassword(pass);
        ui.recovery = false;
        ui.msg = { text: 'Password changed.', ok: true };
        toast('Password changed');
        env.navigate('#account');
      }
    } catch (e) {
      formBusy(false);
      formMsg(S.friendlyError(e));
    }
  }
  function busyBtn(el, on) { if (el) el.disabled = on; }

  async function fetchFullRow() {
    const row = await CL.fetchSave(user.id);
    if (!row) return null;
    return { row, parsed: S.parseCloudSave(row), cmp: S.compareWithCloud({ kv, row, userId: user.id }) };
  }
  async function askRestore(el) {
    if (!user) { env.navigate('#account'); return; }
    busyBtn(el, true);
    try {
      const got = await fetchFullRow();
      if (!got) { toast('No cloud save yet — tap Back Up to Cloud first'); return; }
      ui.pending = got;
      openSheet(AU.restoreConfirmHTML(got.parsed, got.cmp, got.row), { id: 'cloud-restore' });
    } catch (e) {
      toast(S.friendlyError(e));
    } finally { busyBtn(el, false); }
  }
  async function doRestore(el) {
    const got = ui.pending;
    if (!got || !got.parsed) return;
    el.disabled = true;
    try {
      await vault.replaceAll(got.parsed.keys, 'Before cloud restore'); // snapshots this device first
      S.setCloudMeta(kv, { userId: user.id, cloudUpdatedAt: got.row.updated_at, lastUploadSig: S.activitySig(got.parsed.summary), conflict: null, offerDismissedFor: null, profileSig: '', statsSig: '' });
      env.flash('Cloud save restored — your previous data is saved as a snapshot');
      location.reload();
    } catch (e) {
      el.disabled = false;
      toast(`Restore failed: ${e.message || e}`);
    }
  }
  async function backup(el, force) {
    if (!user) { env.navigate('#account'); return; }
    if (env.getState()?.devSeed && !force) { toast('DEV test state — restore your real progress before backing up'); return; }
    busyBtn(el, true);
    try {
      const r = await uploadNow({ force });
      if (r.blocked) {
        const row = r.head;
        ui.pending = { row, cmp: S.compareWithCloud({ kv, row, userId: user.id }) };
        openSheet(AU.overwriteConfirmHTML(ui.pending.cmp, row), { id: 'cloud-overwrite' });
      } else {
        closeSheet();
        toast('Backed up to the cloud');
        syncProfile().then(() => syncStats()).catch(() => {}).finally(() => refresh());
      }
    } catch (e) {
      toast(S.friendlyError(e));
    } finally {
      busyBtn(el, false);
      refresh();
    }
  }

  function action(a, el) {
    switch (a) {
      case 'ac-mode': {
        const em = ($('acEmail')?.value || '').trim();
        if (em) ui.email = em;
        ui.mode = el.dataset.v === 'signup' ? 'signup' : 'signin';
        ui.msg = null;
        env.renderRoute();
        return true;
      }
      case 'ac-signout':
        el.disabled = true;
        CL.signOut().catch(() => {}).finally(() => { user = null; ui.lb = null; ui.msg = null; toast('Signed out — your data stays on this phone'); env.renderRoute(); });
        return true;
      case 'cloud-backup': backup(el, false); return true;
      case 'cloud-backup-force': backup(el, true); return true;
      case 'cloud-restore':
      case 'cloud-restore-ask': askRestore(el); return true;
      case 'cloud-restore-do': doRestore(el); return true;
      case 'cloud-keep-ask': {
        const p = ui.pending;
        if (p && p.row) openSheet(AU.overwriteConfirmHTML(p.cmp, p.row), { id: 'cloud-overwrite' });
        return true;
      }
      case 'cloud-offer-later': {
        const p = ui.pending;
        if (p && p.row) S.setCloudMeta(kv, { offerDismissedFor: p.row.updated_at });
        closeSheet();
        toast('Automatic cloud backup is paused until you choose — Settings → Cloud save');
        refresh();
        return true;
      }
      case 'cloud-share-wins': {
        const m = S.cloudMeta(kv);
        S.setCloudMeta(kv, { shareWins: !m.shareWins });
        toast(!m.shareWins ? 'Your friend-match record will show on the leaderboard' : 'Friend-match record hidden from the leaderboard');
        refresh();
        if (user) syncStats({ force: true }).catch((e) => toast(S.friendlyError(e)));
        return true;
      }
      case 'lb-sort':
        ui.sort = S.SORTS[el.dataset.v] ? el.dataset.v : 'xp';
        if (ui.lb && ui.lb.entries) ui.lb = { ...ui.lb, entries: S.sortLeaderboard(ui.lb.entries, ui.sort) };
        env.renderRoute();
        return true;
      case 'lb-refresh':
        ui.lb = ui.lb && ui.lb.entries ? { ...ui.lb, at: 0, error: null } : null;
        env.renderRoute();
        return true;
      case 'lb-player': {
        const e = ui.lb?.entries?.find((x) => x.id === el.dataset.id);
        if (e) openSheet(AU.playerCardHTML(e), { id: 'player-card' });
        return true;
      }
      default:
        return false;
    }
  }
  document.addEventListener('submit', (e) => {
    const f = e.target && e.target.closest ? e.target.closest('[data-ac-form]') : null;
    if (!f) return;
    e.preventDefault();
    submit(f.dataset.acForm);
  });

  return {
    init, ensure, action, noteDataChange, showPendingOffer, renderAccountPage, renderLeaderboardPage, settingsCardHTML,
    isSignedIn: () => !!user, user: () => user, status,
    // test / debug hooks (no secrets): run the debounced upload now, inspect state
    _autoSyncNow: () => autoSync(), _syncStats: (o) => syncStats(o), _ui: ui
  };
}
