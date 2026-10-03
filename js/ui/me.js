/**
 * Local player profile screens: #me (name + photo) and #me/stats (my stats + the exportable public-stats summary).
 * Nothing here does network I/O: when signed in (v13), js/cloud/controller.js syncs the profile and public stats.
 */
import { getProfile, updateProfile, avatarFromFile, publicStats, displayNameOf } from '../profile.js';
import { avatarHTML } from '../progression/badge.js';
import { profileHeaderHTML, careerHeaderHTML, drillRankCardHTML, championStatsHTML, skillBreakdownHTML } from './progression.js';
import { loadFriends, playerStats } from '../friends/model.js';
import { toast } from './sheet.js';
import { accomplishmentHTML } from '../content/buExam.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderMe(state, { signedIn = false } = {}) {
  const p = getProfile();
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#profile">‹ Profile</button><span class="eyebrow">MY PROFILE</span><h1>${esc(displayNameOf(p))}</h1><p>${signedIn ? 'Your name and photo. Saved on this device and in your backups, and synced to your online account — friends see them on the leaderboard.' : 'Your name and photo on this phone. They are saved on this device and in your backups — nothing is uploaded unless you sign in to an online account.'}</p></div>
    <div class="card meEdit" data-me="${esc(p.id)}">
      <div class="avatarEdit"><span id="meAvatarPrev">${avatarHTML({ ...p, name: p.displayName }, 112)}</span>
        <div class="avatarBtns"><label class="bigBtn alt fileBtn">TAKE PHOTO<input type="file" accept="image/*" capture="user" data-avatar-input="me" aria-label="Take a profile photo"/></label><label class="bigBtn alt fileBtn">CHOOSE PHOTO<input type="file" accept="image/*" data-avatar-input="me" aria-label="Choose a profile photo"/></label>${p.avatar ? '<button type="button" class="bigBtn alt" data-action="me-photo-clear">REMOVE PHOTO</button>' : ''}</div></div>
      <small class="muted">Photos are cropped square and shrunk to 256×256 to keep storage small. Without a photo you get a ball badge with your initials.</small>
      <label class="fld"><span>Display name</span><input id="meName" type="text" maxlength="24" autocomplete="nickname" value="${esc(p.displayName)}" placeholder="Your name"/></label>
      <button type="button" class="bigBtn" data-action="me-save">SAVE PROFILE</button>
    </div>
    ${profileHeaderHTML(state, p, { edit: false })}
    <button type="button" class="bigBtn alt" data-action="go" data-href="#me/stats">MY STATS</button>`;
}

export function renderMyStats(state, { signedIn = false } = {}) {
  const p = getProfile();
  const ps = publicStats(state, p);
  const d = loadFriends();
  const me = d.players.find((x) => x.isMe);
  const pvp = me ? playerStats(d, me.id) : null;
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#profile">‹ Profile</button><span class="eyebrow">MY STATS</span><h1>${esc(displayNameOf(p))}</h1></div>
    ${careerHeaderHTML(state, { compact: true })}${drillRankCardHTML(state, { compact: true })}
    ${accomplishmentHTML(state)}
    <h2>Training</h2>${championStatsHTML(state)}
    ${pvp && pvp.matches ? `<h2>Friend matches (private)</h2><div class="card stats"><div><b>${pvp.wins}–${pvp.losses}</b><span>RECORD</span></div><div><b>${pvp.winPct}%</b><span>WIN RATE</span></div><div><b>${pvp.bestStreak}</b><span>BEST STREAK</span></div></div>` : ''}
    <h2>Skills</h2><div class="skills card">${skillBreakdownHTML(state)}</div>
    <h2>Public stats summary</h2>
    <div class="card settingsCard" data-public-stats><p class="muted small">${signedIn ? 'This is what the friends leaderboard shows for you (training only — your friend-match record is shared only if you switch it on in Settings).' : 'This is what the friends leaderboard would show if you sign in to an online account (training only — friend matches stay private). Signed out, nothing is sent anywhere.'}${ps.devSeeded ? ' <b class="gold">DEV test state — never shared.</b>' : ''}</p>
      <pre class="jsonBox">${esc(JSON.stringify(ps, null, 2))}</pre>
      <button type="button" class="bigBtn alt" data-action="me-export-stats">SAVE AS FILE</button></div>`;
}

export async function onMeAvatarFile(file, rerender) {
  try {
    const url = await avatarFromFile(file);
    const out = updateProfile({ avatar: url });
    if (out.error) throw new Error(out.error);
    toast('Photo saved');
    rerender();
  } catch (e) { toast(e.message || 'That photo could not be used'); }
}

export function meAction(a, el, ctx, { downloadFile } = {}) {
  if (!a.startsWith('me-')) return false;
  if (a === 'me-save') {
    const out = updateProfile({ displayName: document.getElementById('meName')?.value || '' });
    toast(out.error || 'Profile saved');
    ctx.rerender();
  } else if (a === 'me-photo-clear') {
    updateProfile({ avatar: null });
    toast('Photo removed');
    ctx.rerender();
  } else if (a === 'me-export-stats') {
    const ps = publicStats(ctx.getState());
    if (downloadFile) downloadFile(`pool-iq-public-stats-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(ps, null, 2));
    toast('Public stats saved as a file');
  }
  return true;
}
