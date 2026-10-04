/**
 * v13 online accounts — screens (render only; actions live in js/cloud/controller.js):
 *   #account            sign in / create account / signed-in panel
 *   #account/reset      send a password reset email
 *   #account/newpass    set a new password (after the reset link, or "change password" while signed in)
 *   #leaderboard        friends leaderboard (everyone in the project), sortable, tap a player → profile card sheet
 *   Settings → ONLINE ACCOUNT · CLOUD SAVE card
 */
import { avatarHTML, initialsAvatarSVG, rankBadgeSVG, drillBadgeSVG } from '../progression/badge.js';
import { SORTS } from '../cloud/sync.js';
import { SUPABASE_URL, AVATAR_BUCKET } from '../cloud/config.js';
import { skillName } from '../progression/config.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtN = (n) => (Number(n) || 0).toLocaleString('en-US');
export const fmtWhen = (t) => {
  const ms = typeof t === 'number' ? t : Date.parse(t || '');
  if (!ms) return 'never';
  const d = new Date(ms);
  const diff = Date.now() - ms;
  if (diff >= 0 && diff < 60000) return 'just now';
  if (diff >= 0 && diff < 3600000) return `${Math.round(diff / 60000)} min ago`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};
const AVATAR_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`;
/** Only photos from this project's avatars bucket are shown (a row can't point the leaderboard at other sites) */
export const safeAvatarUrl = (u) => (typeof u === 'string' && u.startsWith(AVATAR_PREFIX) && !/["'<>\s]/.test(u) ? u : null);
/** Remote (cloud) avatar: initials ball underneath, the photo on top (removed if it fails to load / offline) */
export function remoteAvatarHTML(name, url, size = 44) {
  const src = safeAvatarUrl(url);
  return `<span class="avatar remoteAvatar" style="width:${size}px;height:${size}px" data-avatar="${src ? 'remote' : 'initials'}">${initialsAvatarSVG(name || '', { size })}${src ? `<img src="${esc(src)}" alt="${esc(name || 'Player')}" width="${size}" height="${size}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"/>` : ''}</span>`;
}

const back = (href, label) => `<button type="button" class="linkish back" data-action="go" data-href="${href}">‹ ${esc(label)}</button>`;
const msgBox = (m) => (m ? `<p class="acMsg ${m.ok ? 'ok' : 'err'}" data-ac-msg="${m.ok ? 'ok' : 'err'}" role="status">${esc(m.text)}</p>` : '<p class="acMsg" data-ac-msg="" role="status"></p>');

// ------------------------------------------------------------------ account screens
/** Tiny Home-header control. Opens the existing #account screen (or signs out). Not a second login. */
export function homeAuthHTML(st = {}) {
  if (st.user) {
    const name = String(st.profileName || '').trim();
    if (name) return `<button type="button" class="homeAuthLink" data-home-auth="account" data-action="go" data-href="#account" title="${esc(name)}">${esc(name)}</button>`;
    return `<button type="button" class="homeAuthLink" data-home-auth="signout" data-action="ac-signout">Sign out</button>`;
  }
  return `<button type="button" class="homeAuthLink" data-home-auth="guest" data-action="go" data-href="#account">Sign in / Register</button>`;
}

export function renderAuthCallback() {
  return `<div class="title"><span class="eyebrow">ONLINE ACCOUNT</span><h1>One moment</h1><p>Finishing the link from your email…</p></div><div class="card settingsCard" data-auth-callback><p class="muted">If nothing happens, open <b>Settings → Online account</b>.</p><button type="button" class="bigBtn alt" data-action="go" data-href="#account">ACCOUNT</button></div>`;
}

export function renderAccount(st, sub = '') {
  if (sub === 'reset') return resetHTML(st);
  if (sub === 'newpass') return newPassHTML(st);
  if (st.user) return signedInHTML(st);
  return signInHTML(st);
}

function signInHTML(st) {
  const mode = st.mode === 'signup' ? 'signup' : 'signin';
  const up = mode === 'signup';
  return `<div class="title">${back('#settings', 'Settings')}<span class="eyebrow">ONLINE ACCOUNT · FREE</span><h1>${up ? 'Create account' : 'Sign in'}</h1><p>Back up to the cloud, move to a new phone, and see your friends on the leaderboard. Pool IQ still works fully without an account, offline too.</p></div>
    <div class="card settingsCard acCard" data-account="signed-out" data-mode="${mode}">
      <div class="acTabs" role="tablist"><button type="button" role="tab" class="chip${up ? '' : ' active'}" data-action="ac-mode" data-v="signin" aria-selected="${!up}">SIGN IN</button><button type="button" role="tab" class="chip${up ? ' active' : ''}" data-action="ac-mode" data-v="signup" aria-selected="${up}">CREATE ACCOUNT</button></div>
      <form data-ac-form="${mode}" novalidate autocomplete="on">
        ${up ? `<label class="fld"><span>Display name (shown to friends)</span><input id="acName" name="nickname" type="text" maxlength="24" autocomplete="nickname" value="${esc(st.profileName || '')}" placeholder="Your name"/></label>` : ''}
        <label class="fld"><span>Email</span><input id="acEmail" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(st.email || '')}" placeholder="you@example.com" required/></label>
        <label class="fld"><span>Password${up ? ' (at least 6 characters)' : ''}</span><input id="acPass" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" placeholder="${up ? 'Choose a password' : 'Your password'}" required/></label>
        ${msgBox(st.msg)}
        <button type="submit" class="bigBtn" data-ac-submit ${st.busy ? 'disabled' : ''}>${st.busy ? 'PLEASE WAIT…' : up ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
      </form>
      ${up ? '' : '<button type="button" class="linkish acForgot" data-action="go" data-href="#account/reset">Forgot password?</button>'}
      <p class="muted small">Email + password only — no email links needed to sign in, so it works inside the installed iPhone app. ${up ? 'Your account is ready instantly.' : ''}</p>
    </div>
    <div class="card settingsCard"><div class="eyebrow">WHAT GETS STORED ONLINE</div><ul class="hookList"><li><b>Profile</b>: your display name and photo (friends can see them).</li><li><b>Cloud save</b>: one private backup of your Pool IQ data — only you can read it.</li><li><b>Leaderboard stats</b>: Career rank and ball, Drill Rank, Lifetime XP, stars and Ghost record (friend-match record only if you switch it on).</li></ul></div>`;
}

function resetHTML(st) {
  return `<div class="title">${back('#account', 'Sign in')}<span class="eyebrow">ONLINE ACCOUNT</span><h1>Reset password</h1><p>We’ll email you a link. Open it, choose a new password, then sign in here with it.</p></div>
    <div class="card settingsCard acCard" data-account="reset">
      <form data-ac-form="reset" novalidate>
        <label class="fld"><span>Email</span><input id="acEmail" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" value="${esc(st.email || '')}" placeholder="you@example.com" required/></label>
        ${msgBox(st.msg)}
        <button type="submit" class="bigBtn" data-ac-submit ${st.busy ? 'disabled' : ''}>${st.busy ? 'PLEASE WAIT…' : 'SEND RESET EMAIL'}</button>
      </form>
      <p class="muted small"><b>iPhone:</b> the link opens in Safari — set the new password there, then come back to the Pool IQ app and sign in. No email? Check spam, or ask Andrew to reset it for you.</p>
    </div>`;
}

function newPassHTML(st) {
  if (!st.user) {
    return `<div class="title">${back('#account', 'Sign in')}<span class="eyebrow">ONLINE ACCOUNT</span><h1>New password</h1></div>
      <div class="card settingsCard acCard" data-account="newpass-out"><p class="muted">${st.ready ? 'This reset link has expired or was already used. Send a new one.' : 'Checking your reset link…'}</p><button type="button" class="bigBtn alt" data-action="go" data-href="#account/reset">SEND A NEW RESET EMAIL</button></div>`;
  }
  return `<div class="title">${back('#account', 'Account')}<span class="eyebrow">ONLINE ACCOUNT · ${esc(st.user.email || '')}</span><h1>New password</h1><p>${st.recovery ? 'Choose your new password.' : 'Change the password for this account.'}</p></div>
    <div class="card settingsCard acCard" data-account="newpass">
      <form data-ac-form="newpass" novalidate>
        <input type="email" name="email" autocomplete="username" value="${esc(st.user.email || '')}" hidden/>
        <label class="fld"><span>New password (at least 6 characters)</span><input id="acPass" name="password" type="password" autocomplete="new-password" minlength="6" required/></label>
        <label class="fld"><span>Repeat new password</span><input id="acPass2" name="password2" type="password" autocomplete="new-password" minlength="6" required/></label>
        ${msgBox(st.msg)}
        <button type="submit" class="bigBtn" data-ac-submit ${st.busy ? 'disabled' : ''}>${st.busy ? 'PLEASE WAIT…' : 'SAVE NEW PASSWORD'}</button>
      </form>
      ${st.recovery ? '<p class="muted small"><b>iPhone:</b> if this opened in Safari, go back to the Pool IQ app afterwards and sign in with the new password.</p>' : ''}
    </div>`;
}

function signedInHTML(st) {
  return `<div class="title">${back('#settings', 'Settings')}<span class="eyebrow">ONLINE ACCOUNT</span><h1>${esc(st.profileName || 'My account')}</h1><p>Signed in as <b data-ac-email>${esc(st.user.email || '')}</b>.</p></div>
    <div class="card settingsCard acCard" data-account="signed-in">
      <div class="acWho">${avatarHTML({ avatar: st.profileAvatar, name: st.profileName }, 64)}<div><b>${esc(st.profileName || 'No display name yet')}</b><small class="muted">${esc(st.profileSync || '')}</small></div></div>
      ${msgBox(st.msg)}
      <button type="button" class="bigBtn" data-action="go" data-href="#leaderboard">🏆 FRIENDS LEADERBOARD</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#me">EDIT PROFILE (NAME + PHOTO)</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#account/newpass">CHANGE PASSWORD</button>
      <button type="button" class="bigBtn alt" data-action="ac-signout">SIGN OUT</button>
      <p class="muted small">Signing out keeps everything on this phone. Your cloud save stays in your account.</p>
    </div>
    ${cloudCardHTML(st)}`;
}

// ------------------------------------------------------------------ Settings card
export function cloudCardHTML(st) {
  if (!st.user) {
    return `<div class="card settingsCard cloudCard" data-card="cloud" data-cloud="${st.checking ? 'checking' : 'signed-out'}"><div class="eyebrow">ONLINE ACCOUNT · CLOUD SAVE</div>
      <p class="muted small">${st.checking ? 'Checking your sign-in…' : 'Optional free account: a private cloud backup that follows you to a new phone, plus the friends leaderboard. Everything keeps working without it.'}</p>
      <button type="button" class="bigBtn" data-action="go" data-href="#account">SIGN IN / CREATE ACCOUNT</button></div>`;
  }
  const c = st.cloud || {};
  const warn = c.conflict ? `<div class="warnBox" data-cloud-conflict>The cloud save was changed on <b>${esc(c.conflict.deviceLabel || 'another device')}</b> (${esc(fmtWhen(c.conflict.updatedAt))}). Automatic backup is paused so nothing is overwritten — choose <b>Restore from Cloud</b> or <b>Back Up to Cloud</b>.</div>` : '';
  return `<div class="card settingsCard dataCard cloudCard" data-card="cloud" data-cloud="signed-in">
      <div class="eyebrow">ONLINE ACCOUNT · CLOUD SAVE</div>
      <div class="kv"><span>Account</span><b data-cloud-email>${esc(st.user.email || '')}</b></div>
      <div class="kv"><span>Last cloud backup</span><b data-cloud-last class="${c.lastUploadAt ? 'green' : 'amber'}">${c.lastUploadAt ? esc(fmtWhen(c.lastUploadAt)) : 'none yet'}</b></div>
      <div class="kv"><span>Automatic backup</span><b data-cloud-auto class="${c.conflict || st.devSeeded ? 'amber' : 'green'}">${c.conflict ? 'paused' : st.devSeeded ? 'off in DEV test state' : 'on · after sessions'}</b></div>
      ${warn}
      <p class="muted small">One private backup per account (the same file as Back Up Now). Restoring always asks first and snapshots this device before replacing anything.</p>
      <button type="button" class="bigBtn" data-action="cloud-backup" ${st.busy ? 'disabled' : ''}>⇪ BACK UP TO CLOUD</button>
      <button type="button" class="bigBtn alt" data-action="cloud-restore" ${st.busy ? 'disabled' : ''}>⇩ RESTORE FROM CLOUD</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#leaderboard">🏆 FRIENDS LEADERBOARD</button>
      <div class="kv shareRow"><span>Show my friend-match record on the leaderboard</span><button type="button" class="chip${c.shareWins ? ' active' : ''}" data-action="cloud-share-wins" data-share-wins="${c.shareWins ? 1 : 0}" aria-pressed="${!!c.shareWins}">${c.shareWins ? 'ON' : 'OFF'}</button></div>
      ${st.route !== 'account' ? '<button type="button" class="bigBtn alt" data-action="go" data-href="#account">ACCOUNT · SIGN OUT</button>' : ''}
    </div>`;
}

// ------------------------------------------------------------------ cloud save compare / confirm sheets
function miniSummary(s, label, when, newer, extra = '') {
  const x = s || {};
  return `<div class="cmpCol${newer ? ' newer' : ''}" data-cmp="${esc(label.toLowerCase().replace(/\s+/g, '-'))}"><div class="eyebrow">${esc(label)}${newer ? ' <span class="tag newTag">NEWER</span>' : ''}</div><small class="muted">${esc(when)}${extra}</small>
    <div class="cmpGrid"><div><b>${esc(x.rank || '—')}</b><span>RANK</span></div><div><b>${fmtN(x.lifetimeXp ?? x.xp)}</b><span>LIFETIME XP</span></div><div><b>${fmtN(x.sessions)}</b><span>SESSIONS</span></div><div><b>${fmtN(x.matches)}</b><span>GHOST</span></div><div><b>${fmtN(x.drills)}</b><span>MY DRILLS</span></div><div><b>${fmtN(x.pvp)}</b><span>FRIEND MATCHES</span></div></div></div>`;
}
export function compareHTML(cmp, row) {
  return `<div class="cmpWrap">${miniSummary(cmp.cloudSummary, 'Cloud save', `saved ${fmtWhen(row.updated_at)}`, cmp.newer === 'cloud', row.device_label ? ` · ${esc(row.device_label)}` : '')}${miniSummary(cmp.localSummary, 'This device', cmp.localMeaningful ? `last change ${fmtWhen(cmp.localAt)}` : 'no progress yet', cmp.newer === 'local')}</div>`;
}
export function offerSheetHTML(cmp, row) {
  const restoreFirst = cmp.recommend !== 'upload';
  const restoreBtn = `<button type="button" class="bigBtn${restoreFirst ? '' : ' alt'}" data-action="cloud-restore-ask">⇩ RESTORE FROM CLOUD</button>`;
  // with nothing on this device worth keeping there is no "keep" choice (it could only wipe the cloud save)
  const keepBtn = cmp.localMeaningful ? `<button type="button" class="bigBtn${restoreFirst ? ' alt' : ''}" data-action="cloud-keep-ask">KEEP THIS DEVICE & BACK IT UP</button>` : '';
  return `<div class="eyebrow">CLOUD SAVE FOUND</div><h2 class="sheetTitle">${restoreFirst ? 'Restore your cloud save?' : 'This device looks newer'}</h2>
    <p class="muted small">${cmp.newer === 'cloud' ? 'Your cloud save is newer than the data on this device.' : cmp.newer === 'local' ? 'This device has changes that are newer than your cloud save.' : 'Both copies were last changed at the same time.'} Nothing changes until you choose.</p>
    ${compareHTML(cmp, row)}
    ${restoreFirst ? restoreBtn + keepBtn : keepBtn + restoreBtn}
    <button type="button" class="bigBtn alt" data-action="cloud-offer-later">DECIDE LATER</button>`;
}
export function restoreConfirmHTML(parsed, cmp, row) {
  return `<div class="eyebrow">RESTORE FROM CLOUD · CONFIRM</div><h2 class="sheetTitle">Replace this device’s data?</h2>
    <p class="muted small" data-cloud-restore-info>Cloud save from ${esc(fmtWhen(row.updated_at))}${row.device_label ? ` · ${esc(row.device_label)}` : ''}${parsed.appVersion ? ` · Pool IQ v${esc(parsed.appVersion)}` : ''}</p>
    ${compareHTML(cmp, row)}
    <div class="warnBox">This <b>replaces</b> everything on this device with the cloud save. A snapshot of this device is taken first — undo any time from Settings → <b>Restore previous snapshot</b>.</div>
    <button type="button" class="bigBtn danger" data-action="cloud-restore-do">RESTORE (REPLACE MY DATA)</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`;
}
export function overwriteConfirmHTML(cmp, row) {
  return `<div class="eyebrow">BACK UP TO CLOUD · CONFIRM</div><h2 class="sheetTitle">Replace the cloud save?</h2>
    <p class="muted small">The cloud has a save this device hasn’t seen${row.device_label ? ` (from ${esc(row.device_label)})` : ''}. Backing up replaces it with this device’s data.</p>
    ${compareHTML(cmp, row)}
    <div class="warnBox">The cloud copy shown on the left will be <b>replaced</b>. If you might need it, restore it on a device first.</div>
    <button type="button" class="bigBtn danger" data-action="cloud-backup-force">REPLACE CLOUD SAVE</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`;
}

// ------------------------------------------------------------------ leaderboard
function metricHTML(e, by) {
  const s = e.stats;
  if (!s) return '<span class="lbMetric muted">no stats yet</span>';
  if (by === 'career') return `<span class="lbMetric">${rankBadgeSVG({ champion: s.champion, ball: s.ball || 1, rankIndex: s.rank_index, name: s.rank_name, title: s.rank_title || s.rank_name }, { size: 34 })}<small>${esc(s.rank_name)}</small></span>`;
  if (by === 'drill') return `<span class="lbMetric">${drillBadgeSVG(s.drill_rank, { size: 34 })}<small>${esc(s.drill_rank_name)}</small></span>`;
  return `<span class="lbMetric"><b>${fmtN(s.lifetime_xp)}</b><small>XP</small></span>`;
}
export function renderLeaderboard(st) {
  const by = SORTS[st.sort] ? st.sort : 'xp';
  const head = `<div class="title">${back('#friends', 'Friends')}<span class="eyebrow">FRIENDS LEADERBOARD</span><h1>Leaderboard</h1><p>Everyone with a Pool IQ account in this group. Training stats only${st.user ? '' : ' — sign in to see it'}.</p></div>`;
  if (!st.user) return `${head}<div class="card settingsCard" data-lb="signed-out"><p class="muted">${st.checking ? 'Checking your sign-in…' : 'The leaderboard needs a free Pool IQ account, so friends can see each other’s ranks and photos.'}</p><button type="button" class="bigBtn" data-action="go" data-href="#account">SIGN IN / CREATE ACCOUNT</button></div>`;
  const chips = `<div class="chips lbSort" role="tablist">${Object.entries(SORTS).map(([k, l]) => `<button type="button" class="chip${k === by ? ' active' : ''}" data-action="lb-sort" data-v="${k}" aria-selected="${k === by}">${esc(l)}</button>`).join('')}</div>`;
  const lb = st.lb || {};
  if (lb.error && !lb.entries) return `${head}${chips}<div class="card settingsCard" data-lb="error"><p class="muted">${esc(lb.error)}</p><button type="button" class="bigBtn" data-action="lb-refresh">TRY AGAIN</button></div>`;
  if (!lb.entries) return `${head}${chips}<div class="card settingsCard" data-lb="loading"><p class="muted">Loading the leaderboard…</p></div>`;
  const rows = lb.entries.map((e, i) => {
    const s = e.stats;
    return `<button type="button" class="card playerRow lbRow${e.isMe ? ' me' : ''}" data-action="lb-player" data-id="${esc(e.id)}" data-lb-row="${i + 1}"><span class="lbPos" data-place="${i + 1}">${i + 1}</span>${remoteAvatarHTML(e.name, e.avatarUrl, 44)}<span class="prMain"><b>${esc(e.name)}${e.isMe ? ' <small class="tag">YOU</small>' : ''}</b><small>${s ? `${esc(s.rank_title || s.rank_name)} · ${fmtN(s.stars)}★` : 'Hasn’t synced stats yet'}</small></span>${metricHTML(e, by)}</button>`;
  }).join('');
  return `${head}${chips}<div class="playerList lbList" data-lb="list" data-sort="${by}">${rows || '<p class="muted">Nobody here yet — invite your friends to create accounts.</p>'}</div>
    <p class="muted small lbFoot">${lb.error ? `<span class="amber">${esc(lb.error)}</span> · ` : ''}Updated ${esc(fmtWhen(lb.at))} · ${lb.entries.length} player${lb.entries.length === 1 ? '' : 's'}</p>
    <button type="button" class="bigBtn alt" data-action="lb-refresh">↻ REFRESH</button>`;
}
export function playerCardHTML(e) {
  const s = e.stats;
  const skills = s?.stats?.skills ? Object.entries(s.stats.skills) : [];
  const m = s?.stats?.mastery || {};
  return `<div class="eyebrow">PLAYER PROFILE${e.isMe ? ' · YOU' : ''}</div>
    <div class="pcHead" data-player-card="${esc(e.id)}">${remoteAvatarHTML(e.name, e.avatarUrl, 88)}<div><h2 class="sheetTitle">${esc(e.name)}</h2>${s ? `<small class="muted">${esc(s.rank_title || s.rank_name)}</small>` : ''}</div></div>
    ${s ? `<div class="pcBadges"><div>${rankBadgeSVG({ champion: s.champion, ball: s.ball || 1, rankIndex: s.rank_index, name: s.rank_name, title: s.rank_title || s.rank_name }, { size: 56 })}<b>${esc(s.rank_name)}</b><small>CAREER${s.champion ? ' · MAX' : s.ball ? ` · BALL ${s.ball}` : ''}</small></div><div>${drillBadgeSVG(s.drill_rank, { size: 56 })}<b>${esc(s.drill_rank_name)}</b><small>DRILL RANK ${s.drill_rank}</small></div></div>
    <div class="cmpGrid pcStats"><div><b>${fmtN(s.lifetime_xp)}</b><span>LIFETIME XP</span></div><div><b>${fmtN(s.stars)}★</b><span>STARS</span></div><div><b>${fmtN(s.drill_xp)}</b><span>DRILL XP</span></div><div><b>${fmtN(s.ghost_wins)}/${fmtN(s.ghost_matches)}</b><span>GHOST WINS</span></div><div><b>${fmtN(m.passed)}/${fmtN(m.strong)}/${fmtN(m.mastered)}</b><span>PASS/STRONG/MASTER</span></div>${s.pvp_wins != null ? `<div data-pc-pvp><b>${fmtN(s.pvp_wins)}–${fmtN(s.pvp_losses)}</b><span>FRIEND MATCHES</span></div>` : '<div><b>—</b><span>FRIEND MATCHES</span></div>'}</div>
    ${skills.length ? `<div class="pcSkills">${skills.map(([id, k]) => `<div class="kv"><span>${esc(skillName(id) || id)}</span><b>${esc(k.level)}</b></div>`).join('')}</div>` : ''}
    <small class="muted">Stats updated ${esc(fmtWhen(s.updated_at))}</small>` : '<p class="muted">This player hasn’t synced any stats yet.</p>'}
    <button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`;
}
