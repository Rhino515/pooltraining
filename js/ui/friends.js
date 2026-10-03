/**
 * PLAY WITH FRIENDS (local PvP): players (with photos), live match scoring or quick final score, player profiles,
 * head-to-head, group sessions, tournaments (single elimination bracket / round robin standings).
 * Everything lives in poolIQFriendsV1 (friends/model.js). PvP never touches training progression (Career,
 * Drill Rank, skills, XP) — this module does not import or commit training state.
 */
import * as F from '../friends/model.js';
import * as T from '../friends/tournament.js';
import { PVP } from '../progression/config.js';
import { avatarHTML } from '../progression/badge.js';
import { getProfile, displayNameOf, avatarFromFile } from '../profile.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { timerHTML } from './shotTimer.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const winsText = (d, id) => (F.playerById(d, id)?.isMe ? 'You win' : `${pName(d, id)} wins`);
const when = (t) => (t ? new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '');

// ------------------------------------------------------------------ data helpers
/** The phone's owner is a player too (id = profile id), kept in sync with the local profile */
export function withMe(d0 = F.loadFriends()) {
  const p = getProfile();
  let d = d0;
  const me = d.players.find((x) => x.isMe);
  const name = F.cleanName(displayNameOf(p)) || 'Me';
  if (!me) {
    const r = F.addPlayer(d, d.players.some((x) => !x.archived && x.name.toLowerCase() === name.toLowerCase()) ? `${name} (me)` : name, { isMe: true, id: p.id, avatar: p.avatar });
    d = r.d;
  } else if (me.name !== name || me.avatar !== (p.avatar || null)) {
    d = { ...d, players: d.players.map((x) => (x.isMe ? { ...x, name, avatar: p.avatar || null, updatedAt: Date.now() } : x)) };
  }
  if (d !== d0) F.saveFriends(d);
  return d;
}
const load = () => withMe(F.loadFriends());
const save = (d) => F.saveFriends(d);
const meId = (d) => d.players.find((x) => x.isMe)?.id;
const pName = (d, id) => F.playerName(d, id);
const av = (d, id, size = 40) => { const p = F.playerById(d, id); return p ? avatarHTML({ ...p, name: p.name }, size) : avatarHTML({ name: id === T.BYE ? 'BYE' : '?' }, size); };
const backBtn = (href, label) => `<button type="button" class="linkish back" data-action="go" data-href="${href}">‹ ${esc(label)}</button>`;
const chips = (action, list, cur) => `<div class="chips">${list.map(([v, l]) => `<button type="button" class="chip${String(cur) === String(v) ? ' active' : ''}" data-action="${action}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;

/** Every Table Games hub game except Ghost (solo). Cards match the hub and open that scorekeeper. */
const PVP_TABLE_GAMES = [
  ['8', '8-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['9', '9-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['10', '10-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['bank', 'Bank Pool', 'WPA bank pool. Short rack to 5, full rack to 8. Optional timer.'],
  ['upusa', 'Ultimate Pool USA', '30-minute match clock. 30-second shot clock.'],
  ['loop', 'Loop', 'POOL BACKWARDS / CAROM TRAINING'],
  ['straight', 'Straight Pool', 'WPA 14.1. Called shot to a score.'],
  ['onepocket', 'One Pocket', 'WPA one pocket. First to 8, race to racks.'],
  ['cribbage', 'Cribbage', 'Pairs that add to 15. First to 5.']
];
const pvpGameIcon = (id) => (id === 'upusa' ? '⏱' : id === 'bank' ? '▣' : id === 'loop' ? '↺' : id === 'straight' ? '14' : id === 'onepocket' ? '1P' : id === 'cribbage' ? '15' : id);
const pvpGameCards = () => `<h2>Games</h2><div class="arcadeGrid" data-pvp-games>${PVP_TABLE_GAMES.map(([id, name, sub]) => `<button type="button" class="gameCard card" data-action="go" data-href="#tgame/${id}" data-game="${esc(id)}"><span class="gcIcon">${pvpGameIcon(id)}</span><span class="gcMain"><b>${esc(name)}</b><small>${esc(sub)}</small></span></button>`).join('')}</div>`;

// UI-only selections (not persisted until a match / session / tournament is created)
const setup = { a: null, b: null, game: '8-ball', raceTo: PVP.defaultRace, pick: [], format: 'single', name: '', adv: false, sessionId: null, tournamentId: null, tmId: null };
let pendingAvatar; // undefined = unchanged, null = removed, string = new photo
let editingId = null;

// ------------------------------------------------------------------ hub
export function renderFriends() {
  const d = load();
  const players = F.activePlayers(d);
  const me = meId(d);
  const recent = d.matches.filter((m) => m.status === 'final').sort((x, y) => (y.endedAt || 0) - (x.endedAt || 0)).slice(0, 8);
  const sessions = d.sessions.slice().reverse().slice(0, 5);
  const tours = d.tournaments.slice().reverse().slice(0, 6);
  return `<div class="title"><span class="eyebrow">PLAY WITH FRIENDS · PvP</span><h1>Friends</h1><p>Score real matches on this phone: head-to-head records, group nights and tournaments. Friend matches are separate from your training ranks.</p></div>
    ${d.live ? `<div class="card resumeCard" data-live-match><b>Match in progress</b><p class="muted">${esc(pName(d, d.live.players[0]))} ${d.live.score[d.live.players[0]]} – ${d.live.score[d.live.players[1]]} ${esc(pName(d, d.live.players[1]))} · race to ${d.live.raceTo}</p><button type="button" class="bigBtn" data-action="go" data-href="#fmatch/live">RESUME MATCH</button></div>` : ''}
    <button type="button" class="card simPromo lbPromo" data-action="go" data-href="#leaderboard"><span class="simPromoIcon">🏆</span><span class="simPromoText"><span class="eyebrow">ONLINE</span><b>Friends Leaderboard</b><small>Everyone with a Pool IQ account: Lifetime XP, Career rank and Drill Rank, with photos.</small></span><span class="simPromoGo">›</span></button>
    <div class="friendActs"><button type="button" class="bigBtn" data-action="go" data-href="#fmatch">⚔ NEW MATCH</button><button type="button" class="bigBtn alt" data-action="fr-session-new">GROUP SESSION</button><button type="button" class="bigBtn alt" data-action="go" data-href="#tnew">🏆 TOURNAMENT</button></div>
    ${pvpGameCards()}
    <h2>Players <button type="button" class="miniAct" data-action="fr-add">＋ ADD PLAYER</button></h2>
    <div class="playerList">${players.map((p) => { const st = F.playerStats(d, p.id); return `<button type="button" class="card playerRow" data-action="go" data-href="#friend/${esc(p.id)}" data-player="${esc(p.id)}">${av(d, p.id, 44)}<span class="prMain"><b>${esc(p.name)}${p.isMe ? ' <small class="tag">YOU</small>' : ''}</b><small>${st.matches ? `${st.wins}–${st.losses} · ${st.winPct}% · ${st.streakType ? `${st.streakType}${st.currentStreak}` : ''}` : 'No matches yet'}</small></span>${!p.isMe && me ? (() => { const h = F.headToHead(d, me, p.id); return h.matches ? `<span class="prH2h">${h.winsA}–${h.winsB}</span>` : ''; })() : ''}</button>`; }).join('')}
      ${players.length < 2 ? '<p class="muted">Add the people you play with. Photos are optional and stay on this phone.</p>' : ''}</div>
    <h2>Recent matches</h2><div class="card history">${recent.length ? recent.map((m) => matchRowHTML(d, m)).join('') : '<p class="muted">No matches yet.</p>'}</div>
    ${sessions.length ? `<h2>Group sessions</h2><div class="card history">${sessions.map((s) => `<button type="button" class="historyRow linkRow" data-action="go" data-href="#fsession/${esc(s.id)}"><span>${esc(s.name)}</span><span class="muted">${s.playerIds.length} players · ${s.matchIds.length} matches</span><span class="${s.endedAt ? 'muted' : 'green'}">${s.endedAt ? when(s.endedAt) : 'LIVE'}</span></button>`).join('')}</div>` : ''}
    ${tours.length ? `<h2>Tournaments</h2><div class="card history">${tours.map((t) => `<button type="button" class="historyRow linkRow" data-action="go" data-href="#tourney/${esc(t.id)}" data-tourney="${esc(t.id)}"><span>${esc(t.name)}</span><span class="muted">${t.format === 'single' ? 'Bracket' : 'Round robin'} · ${t.playerIds.length}</span><span class="${t.status === 'complete' ? 'gold' : 'green'}">${t.status === 'complete' ? `🏆 ${esc(pName(d, t.championId))}` : 'LIVE'}</span></button>`).join('')}</div>` : ''}`;
}
function matchRowHTML(d, m) {
  const [a, b] = m.players;
  return `<div class="historyRow matchRow" data-match="${esc(m.id)}"><span><b class="${m.winner === a ? 'green' : ''}">${esc(pName(d, a))}</b> ${m.score[a]}–${m.score[b]} <b class="${m.winner === b ? 'green' : ''}">${esc(pName(d, b))}</b></span><span class="muted">${esc(F.gameName(m.game))}${m.tournamentId ? ' · 🏆' : m.sessionId ? ' · group' : ''}</span><span class="muted">${when(m.endedAt)}</span></div>`;
}

// ------------------------------------------------------------------ player add / edit (sheet)
function playerSheet(d, p = null) {
  editingId = p ? p.id : null;
  pendingAvatar = undefined;
  const isMe = p?.isMe;
  openSheet(`<div class="eyebrow">${p ? 'EDIT PLAYER' : 'ADD PLAYER'}</div><h2 class="sheetTitle">${p ? esc(p.name) : 'New player'}</h2>
    <div class="avatarEdit"><span id="frAvatarPrev">${avatarHTML(p || { name: '' }, 88)}</span>
      <div class="avatarBtns"><label class="bigBtn alt fileBtn">TAKE PHOTO<input type="file" accept="image/*" capture="environment" data-avatar-input="friend" aria-label="Take a photo"/></label><label class="bigBtn alt fileBtn">CHOOSE PHOTO<input type="file" accept="image/*" data-avatar-input="friend" aria-label="Choose a photo"/></label>${p?.avatar ? '<button type="button" class="bigBtn alt" data-action="fr-photo-clear">REMOVE PHOTO</button>' : ''}</div></div>
    ${isMe ? '<p class="muted small">This is you — your name and photo come from your profile.</p><button type="button" class="bigBtn" data-action="go" data-href="#me">EDIT MY PROFILE</button>' : `<label class="fld"><span>Name</span><input id="frName" type="text" maxlength="24" autocomplete="off" value="${esc(p?.name || '')}" placeholder="Player name"/></label>
    <button type="button" class="bigBtn" data-action="fr-save">${p ? 'SAVE' : 'ADD PLAYER'}</button>${p ? '<button type="button" class="bigBtn danger" data-action="fr-remove">REMOVE PLAYER</button>' : ''}`}
    <button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'player' });
}
/** File input change (TAKE / CHOOSE PHOTO) for a friend being added / edited */
export async function onFriendAvatarFile(file) {
  try {
    pendingAvatar = await avatarFromFile(file);
    const el = document.getElementById('frAvatarPrev');
    if (el) el.innerHTML = avatarHTML({ avatar: pendingAvatar, name: document.getElementById('frName')?.value || '' }, 88);
  } catch (e) { toast(e.message || 'That photo could not be used'); }
}

// ------------------------------------------------------------------ player profile + head-to-head
export function renderFriend(id) {
  const d = load();
  const p = F.playerById(d, id);
  if (!p) return `<div class="card empty"><p>That player is not on this phone.</p><button type="button" class="bigBtn" data-action="go" data-href="#friends">FRIENDS</button></div>`;
  const st = F.playerStats(d, id);
  const riv = F.rivals(d, id);
  const me = meId(d);
  const recent = d.matches.filter((m) => m.status === 'final' && m.players.includes(id)).sort((x, y) => (y.endedAt || 0) - (x.endedAt || 0)).slice(0, 10);
  const adv = PVP.advancedStats.filter((k) => st[k] > 0);
  return `<div class="title">${backBtn('#friends', 'Friends')}</div>
    <div class="card profileHead friendHead" data-friend="${esc(id)}">${av(d, id, 76)}<div class="phInfo"><span class="eyebrow">${p.isMe ? 'YOU' : 'FRIEND'}${p.archived ? ' · ARCHIVED' : ''}</span><h1 class="phName">${esc(p.name)}</h1><button type="button" class="linkish" data-action="fr-edit" data-id="${esc(id)}">Edit ›</button></div></div>
    <div class="card stats"><div><b>${st.wins}–${st.losses}</b><span>RECORD</span></div><div><b>${st.winPct}%</b><span>WIN RATE</span></div><div><b>${st.streakType ? `${st.streakType}${st.currentStreak}` : '—'}</b><span>STREAK</span></div></div>
    <div class="card stats"><div><b>${st.gamesWon}–${st.gamesLost}</b><span>RACKS</span></div><div><b>${st.bestStreak}</b><span>BEST WIN STREAK</span></div><div><b>${st.hillHillWins}/${st.hillHill}</b><span>HILL-HILL WON</span></div></div>
    ${Object.keys(st.byGame).length ? `<div class="card history">${Object.entries(st.byGame).map(([g, r]) => `<div class="historyRow"><span>${esc(F.gameName(g))}</span><span>${r.wins}–${r.losses}</span></div>`).join('')}</div>` : ''}
    ${adv.length ? `<div class="card history">${adv.map((k) => `<div class="historyRow"><span>${esc(PVP.statLabels[k])}</span><b>${st[k]}</b></div>`).join('')}</div>` : ''}
    ${!p.isMe && me ? `<button type="button" class="bigBtn" data-action="fr-match-vs" data-id="${esc(id)}">⚔ PLAY ${esc(p.name.toUpperCase())}</button><button type="button" class="bigBtn alt" data-action="go" data-href="#h2h/${esc(me)}/${esc(id)}">HEAD-TO-HEAD VS YOU</button>` : ''}
    <h2>Rivals</h2><div class="card history">${riv.length ? riv.map((r) => `<button type="button" class="historyRow linkRow" data-action="go" data-href="#h2h/${esc(id)}/${esc(r.id)}"><span>${esc(pName(d, r.id))}</span><span>${r.winsA}–${r.winsB}</span><span class="muted">${r.matches} match${r.matches === 1 ? '' : 'es'}</span></button>`).join('') : '<p class="muted">No matches yet.</p>'}</div>
    <h2>Recent</h2><div class="card history">${recent.length ? recent.map((m) => matchRowHTML(d, m)).join('') : '<p class="muted">No matches yet.</p>'}</div>`;
}
export function renderH2H(a, b) {
  const d = load();
  if (!F.playerById(d, a) || !F.playerById(d, b)) return '<div class="card empty"><p>Unknown players.</p></div>';
  const h = F.headToHead(d, a, b);
  const adv = PVP.advancedStats.filter((k) => h.stats[a][k] || h.stats[b][k]);
  return `<div class="title">${backBtn(`#friend/${esc(b)}`, pName(d, b))}<span class="eyebrow">HEAD-TO-HEAD</span></div>
    <div class="card h2hHead" data-h2h="${esc(a)}:${esc(b)}"><div class="h2hSide">${av(d, a, 64)}<b>${esc(pName(d, a))}</b></div><div class="h2hScore"><b data-h2h-a>${h.winsA}</b><em>–</em><b data-h2h-b>${h.winsB}</b><small>${h.matches} match${h.matches === 1 ? '' : 'es'}</small></div><div class="h2hSide">${av(d, b, 64)}<b>${esc(pName(d, b))}</b></div></div>
    <div class="card stats"><div><b>${h.gamesA}–${h.gamesB}</b><span>RACKS</span></div><div><b>${h.hillHill}</b><span>HILL-HILL</span></div><div><b>${h.matches ? Math.round((100 * h.winsA) / h.matches) : 0}%</b><span>${esc(pName(d, a).toUpperCase())} WINS</span></div></div>
    ${Object.keys(h.byGame).length ? `<div class="card history">${Object.entries(h.byGame).map(([g, r]) => `<div class="historyRow"><span>${esc(F.gameName(g))}</span><span>${r.a}–${r.b}</span></div>`).join('')}</div>` : ''}
    ${adv.length ? `<div class="card history">${adv.map((k) => `<div class="historyRow"><span>${esc(PVP.statLabels[k])}</span><span>${h.stats[a][k]} – ${h.stats[b][k]}</span></div>`).join('')}</div>` : ''}
    <button type="button" class="bigBtn" data-action="fr-match-pair" data-a="${esc(a)}" data-b="${esc(b)}">⚔ PLAY A MATCH</button>
    <h2>Matches</h2><div class="card history">${h.recent.length ? h.recent.map((m) => matchRowHTML(d, m)).join('') : '<p class="muted">They have not played yet.</p>'}</div>`;
}

// ------------------------------------------------------------------ match: setup + live scoring
export function renderMatch(arg) {
  const d = load();
  if (arg === 'live' && d.live) return liveHTML(d, d.live);
  if (d.live && arg !== 'new') return liveHTML(d, d.live);
  const players = F.activePlayers(d);
  if (!setup.a || !F.playerById(d, setup.a)) setup.a = meId(d);
  if (setup.b === setup.a) setup.b = null;
  const pick = (side) => `<div class="pickRow" data-pick="${side}">${players.map((p) => `<button type="button" class="pickP${setup[side] === p.id ? ' active' : ''}" data-action="fr-pick" data-side="${side}" data-id="${esc(p.id)}" ${setup[side === 'a' ? 'b' : 'a'] === p.id ? 'disabled' : ''}>${av(d, p.id, 40)}<small>${esc(p.name)}</small></button>`).join('')}<button type="button" class="pickP add" data-action="fr-add"><span class="avatar addAv">＋</span><small>Add</small></button></div>`;
  const ctx = setup.tournamentId ? d.tournaments.find((t) => t.id === setup.tournamentId) : null;
  return `<div class="title">${backBtn('#friends', 'Friends')}<span class="eyebrow">${ctx ? `TOURNAMENT · ${esc(ctx.name)}` : setup.sessionId ? 'GROUP SESSION MATCH' : 'NEW MATCH'}</span><h1>Match setup</h1></div>
    <div class="card matchSetup">
      <div class="eyebrow">PLAYER 1</div>${pick('a')}
      <div class="eyebrow">PLAYER 2</div>${pick('b')}
      <div class="eyebrow">GAME</div>${chips('fr-game', PVP.games.map((g) => [g.id, g.name]), setup.game)}
      <div class="eyebrow">RACE TO</div>${chips('fr-race', PVP.raceOptions.map((r) => [r, r]), setup.raceTo)}
      <div class="chips"><button type="button" class="chip${setup.adv ? ' active' : ''}" data-action="fr-adv">Advanced stats: ${setup.adv ? 'ON' : 'OFF'}</button></div>
      <button type="button" class="bigBtn" data-action="fr-start" ${setup.a && setup.b ? '' : 'disabled'}>START MATCH · LIVE SCORE</button>
      <button type="button" class="bigBtn alt" data-action="fr-quick" ${setup.a && setup.b ? '' : 'disabled'}>ENTER FINAL SCORE</button>
    </div>`;
}
function liveHTML(d, m) {
  const [a, b] = m.players;
  const over = m.status === 'final';
  const statBtns = (pid) => (m.adv ? `<div class="statBtns">${PVP.advancedStats.map((k) => `<button type="button" class="chip" data-action="fr-stat" data-id="${esc(pid)}" data-k="${k}">${esc(PVP.statLabels[k])} <b>${m.stats[pid]?.[k] || 0}</b></button>`).join('')}</div>` : '');
  const side = (pid) => `<div class="liveSide${m.winner === pid ? ' won' : ''}" data-side="${esc(pid)}">${av(d, pid, 56)}<b class="lsName">${esc(pName(d, pid))}</b><b class="lsScore" data-score="${m.score[pid]}">${m.score[pid]}</b>${over ? '' : `<button type="button" class="bigBtn rackBtn" data-action="fr-rack" data-id="${esc(pid)}">RACK WON</button>`}${statBtns(pid)}</div>`;
  const timed = ['8-ball', '9-ball', '10-ball', 'bank'].includes(m.game);
  return `<div class="title">${backBtn('#friends', 'Friends')}<span class="eyebrow">${esc(F.gameName(m.game).toUpperCase())} · RACE TO ${m.raceTo}${F.isHillHill(m) || (!over && m.score[a] === m.raceTo - 1 && m.score[b] === m.raceTo - 1) ? ' · HILL-HILL' : ''}</span></div>
    ${timed ? timerHTML(`pvp-${m.game}`) : ''}
    <div class="card liveMatch" data-live="${esc(m.id)}" data-over="${over ? 1 : 0}"${timed ? ' data-timer="1"' : ''}>${side(a)}<div class="lsVs">VS</div>${side(b)}</div>
    ${over ? `<div class="resultPanel pass inline" data-result="pvp"><h1>${esc(winsText(d, m.winner).toUpperCase())} ${m.score[m.winner]}–${m.score[m.players.find((x) => x !== m.winner)]}</h1><div class="resultBtns"><button type="button" class="bigBtn" data-action="fr-save-match">SAVE MATCH</button><button type="button" class="bigBtn alt" data-action="fr-undo">UNDO LAST RACK</button></div></div>` : `<div class="liveTools"><button type="button" class="bigBtn alt" data-action="fr-undo" ${m.racks.length ? '' : 'disabled'}>↶ UNDO LAST RACK</button><button type="button" class="bigBtn alt danger" data-action="fr-abandon">ABANDON MATCH</button></div>`}
    <div class="racklog">${m.racks.map((w, i) => `<span class="${w === a ? 'win' : 'loss'}">R${i + 1} ${esc(pName(d, w))}</span>`).join('')}</div>`;
}
function quickScoreSheet(d, a, b, raceTo, title, action = 'fr-quick-save', extra = '') {
  openSheet(`<div class="eyebrow">${esc(title)}</div><h2 class="sheetTitle">Final score · race to ${raceTo}</h2>
    <div class="quickScore"><label class="fld">${av(d, a, 36)}<span>${esc(pName(d, a))}</span><input id="qsA" type="number" inputmode="numeric" min="0" max="${raceTo}" value=""/></label><label class="fld">${av(d, b, 36)}<span>${esc(pName(d, b))}</span><input id="qsB" type="number" inputmode="numeric" min="0" max="${raceTo}" value=""/></label></div>
    <p class="muted small">The winner's score must be ${raceTo}.</p>
    <button type="button" class="bigBtn" data-action="${action}" ${extra}>SAVE RESULT</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'quickscore' });
}

// ------------------------------------------------------------------ group session
export function renderSession(id) {
  const d = load();
  const sum = F.sessionSummary(d, id);
  if (!sum) return '<div class="card empty"><p>Unknown session.</p></div>';
  const s = sum.session;
  const rows = Object.entries(sum.table).sort((x, y) => y[1].wins - x[1].wins || (y[1].gamesWon - y[1].gamesLost) - (x[1].gamesWon - x[1].gamesLost));
  return `<div class="title">${backBtn('#friends', 'Friends')}<span class="eyebrow">GROUP SESSION · ${esc(F.gameName(s.game).toUpperCase())} · RACE TO ${s.raceTo}</span><h1>${esc(s.name)}</h1></div>
    ${!s.endedAt && sum.next ? `<div class="card nextUp" data-next-pair="${esc(sum.next.join(':'))}"><div class="eyebrow">NEXT UP · FEWEST GAMES TOGETHER</div><h3>${esc(pName(d, sum.next[0]))} vs ${esc(pName(d, sum.next[1]))}</h3><button type="button" class="bigBtn" data-action="fr-session-play" data-a="${esc(sum.next[0])}" data-b="${esc(sum.next[1])}">PLAY THIS MATCH</button><button type="button" class="bigBtn alt" data-action="fr-session-quick" data-a="${esc(sum.next[0])}" data-b="${esc(sum.next[1])}">ENTER FINAL SCORE</button></div>` : ''}
    <div class="card standings" data-session-table><div class="stRowH"><span>#</span><span>Player</span><span>W–L</span><span>Racks</span></div>${rows.map(([pid, r], i) => `<div class="stRowT"><span>${i + 1}</span><span class="stName">${av(d, pid, 28)}${esc(pName(d, pid))}</span><span>${r.wins}–${r.losses}</span><span>${r.gamesWon}–${r.gamesLost}</span></div>`).join('')}</div>
    <h2>Pairings</h2><div class="card history">${sum.pairs.map((p) => `<div class="historyRow"><span>${esc(pName(d, p.a))} vs ${esc(pName(d, p.b))}</span><span>${p.played ? `${p.winsA}–${p.winsB}` : '—'}</span>${s.endedAt ? '' : `<button type="button" class="miniAct" data-action="fr-session-play" data-a="${esc(p.a)}" data-b="${esc(p.b)}">PLAY</button>`}</div>`).join('')}</div>
    <h2>Matches</h2><div class="card history">${sum.matches.length ? sum.matches.slice().reverse().map((m) => matchRowHTML(d, m)).join('') : '<p class="muted">No matches yet.</p>'}</div>
    ${s.endedAt ? `<p class="muted">Ended ${when(s.endedAt)}</p>` : '<button type="button" class="bigBtn alt" data-action="fr-session-end" data-id="' + esc(s.id) + '">END SESSION</button>'}`;
}
function sessionSheet(d) {
  setup.pick = F.activePlayers(d).map((p) => p.id).slice(0, 4);
  openSheet(`<div class="eyebrow">GROUP SESSION</div><h2 class="sheetTitle">Who is playing?</h2><p class="muted small">3 or more players. Pool IQ suggests who plays next (fewest games together).</p>${pickManyHTML(d)}
    <div class="eyebrow">GAME</div>${chips('fr-game', PVP.games.map((g) => [g.id, g.name]), setup.game)}<div class="eyebrow">RACE TO</div>${chips('fr-race', PVP.raceOptions.map((r) => [r, r]), setup.raceTo)}
    <button type="button" class="bigBtn" data-action="fr-session-start">START SESSION</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'session' });
}
function pickManyHTML(d) {
  return `<div class="pickRow many" id="pickMany">${F.activePlayers(d).map((p) => `<button type="button" class="pickP${setup.pick.includes(p.id) ? ' active' : ''}" data-action="fr-toggle" data-id="${esc(p.id)}">${av(d, p.id, 40)}<small>${esc(p.name)}</small></button>`).join('')}</div><small class="muted" id="pickCount">${setup.pick.length} selected</small>`;
}

// ------------------------------------------------------------------ tournaments
export function renderTourneyNew() {
  const d = load();
  if (!setup.pick.length) setup.pick = F.activePlayers(d).map((p) => p.id).slice(0, 4);
  return `<div class="title">${backBtn('#friends', 'Friends')}<span class="eyebrow">NEW TOURNAMENT</span><h1>Tournament</h1></div>
    <div class="card matchSetup">
      <label class="fld"><span>Name</span><input id="tName" type="text" maxlength="24" value="${esc(setup.name)}" placeholder="Friday Night 8-Ball"/></label>
      <div class="eyebrow">FORMAT</div>${chips('fr-format', PVP.formats.map((f) => [f.id, f.name]), setup.format)}
      <small class="muted">${setup.format === 'single' ? 'Seeded bracket; byes go to the top seeds; winners advance automatically.' : 'Everyone plays everyone once. Standings: wins → head-to-head → rack difference → racks won.'}</small>
      <div class="eyebrow">PLAYERS (in seed order)</div>${pickManyHTML(d)}
      <div class="eyebrow">GAME</div>${chips('fr-game', PVP.games.map((g) => [g.id, g.name]), setup.game)}
      <div class="eyebrow">RACE TO</div>${chips('fr-race', PVP.raceOptions.map((r) => [r, r]), setup.raceTo)}
      <button type="button" class="bigBtn" data-action="fr-t-create">CREATE TOURNAMENT</button>
      <button type="button" class="linkish" data-action="fr-add">＋ Add a player</button>
    </div>`;
}
export function renderTourney(id) {
  const d = load();
  const t = d.tournaments.find((x) => x.id === id);
  if (!t) return '<div class="card empty"><p>Unknown tournament.</p></div>';
  const names = Object.fromEntries(t.playerIds.map((p) => [p, pName(d, p)]));
  const mCard = (m) => {
    const ready = m.a && m.b && m.a !== T.BYE && m.b !== T.BYE && !m.winner;
    const nm = (pid) => (pid ? (pid === T.BYE ? 'BYE' : esc(names[pid] || pName(d, pid))) : '<span class="muted">TBD</span>');
    const sc = (pid) => (m.score && pid && m.score[pid] != null ? `<b>${m.score[pid]}</b>` : '');
    return `<div class="tMatch${m.winner ? ' done' : ''}${m.bye ? ' bye' : ''}${ready ? ' ready' : ''}" data-tm="${esc(m.id)}"><div class="tmP${m.winner && m.winner === m.a ? ' win' : ''}">${m.a && m.a !== T.BYE ? av(d, m.a, 22) : ''}<span>${nm(m.a)}</span>${sc(m.a)}</div><div class="tmP${m.winner && m.winner === m.b ? ' win' : ''}">${m.b && m.b !== T.BYE ? av(d, m.b, 22) : ''}<span>${nm(m.b)}</span>${sc(m.b)}</div>${ready ? `<div class="tmBtns"><button type="button" class="miniAct" data-action="fr-t-play" data-t="${esc(t.id)}" data-m="${esc(m.id)}">PLAY</button><button type="button" class="miniAct" data-action="fr-t-score" data-t="${esc(t.id)}" data-m="${esc(m.id)}">SCORE</button></div>` : m.winner && !m.bye ? `<button type="button" class="miniAct subtle" data-action="fr-t-clear" data-t="${esc(t.id)}" data-m="${esc(m.id)}">↶</button>` : ''}</div>`;
  };
  let body;
  if (t.format === 'single') {
    const rounds = T.roundCount(t);
    body = `<div class="bracket" data-bracket style="--rounds:${rounds}">${Array.from({ length: rounds }, (_, i) => i + 1).map((r) => `<div class="bRound"><div class="eyebrow">${esc(T.roundName(t, r).toUpperCase())}</div>${t.matches.filter((m) => m.round === r).map(mCard).join('')}</div>`).join('')}</div>`;
  } else {
    const st = T.standings(t, names);
    const rounds = T.roundCount(t);
    body = `<div class="card standings" data-standings><div class="stRowH rr"><span>#</span><span>Player</span><span>W–L</span><span>+/-</span><span>H2H</span></div>${st.map((r) => `<div class="stRowT rr" data-place="${r.place}" data-player="${esc(r.id)}"><span>${r.place}</span><span class="stName">${av(d, r.id, 24)}${esc(names[r.id])}</span><span>${r.wins}–${r.losses}</span><span>${r.diff > 0 ? '+' : ''}${r.diff}</span><span>${r.h2h || 0}</span></div>`).join('')}<small class="muted">Tiebreakers: wins → head-to-head wins among tied players → rack difference → racks won → name.</small></div>
      ${Array.from({ length: rounds }, (_, i) => i + 1).map((r) => `<h2>Round ${r}</h2><div class="rrRound">${t.matches.filter((m) => m.round === r).map(mCard).join('')}</div>`).join('')}`;
  }
  return `<div class="title">${backBtn('#friends', 'Friends')}<span class="eyebrow">${t.format === 'single' ? 'SINGLE ELIMINATION' : 'ROUND ROBIN'} · ${esc(F.gameName(t.game).toUpperCase())} · RACE TO ${t.raceTo}</span><h1>${esc(t.name)}</h1></div>
    ${t.status === 'complete' ? `<div class="card champCard" data-champion="${esc(t.championId)}">${av(d, t.championId, 56)}<div><span class="eyebrow">🏆 CHAMPION</span><h2>${esc(pName(d, t.championId))}</h2></div></div>` : ''}
    ${body}
    <button type="button" class="bigBtn alt danger" data-action="fr-t-delete" data-t="${esc(t.id)}">DELETE TOURNAMENT</button>`;
}

// ------------------------------------------------------------------ actions
export function friendsAction(a, el, ctx) {
  if (!a.startsWith('fr-')) return false;
  let d = load();
  const rer = () => ctx.rerender();
  switch (a) {
    case 'fr-add': playerSheet(d); return true;
    case 'fr-edit': { const p = F.playerById(d, el.dataset.id); if (p) playerSheet(d, p); return true; }
    case 'fr-photo-clear': pendingAvatar = null; { const e2 = document.getElementById('frAvatarPrev'); if (e2) e2.innerHTML = avatarHTML({ name: document.getElementById('frName')?.value || '' }, 88); } return true;
    case 'fr-save': {
      const name = document.getElementById('frName')?.value || '';
      const r = editingId ? F.updatePlayer(d, editingId, { name: F.cleanName(name), ...(pendingAvatar !== undefined ? { avatar: pendingAvatar } : {}) }) : F.addPlayer(d, name, { avatar: pendingAvatar || null });
      if (r.error) { toast(r.error); return true; }
      if (!F.cleanName(name)) { toast('Enter a name'); return true; }
      save(r.d);
      if (!editingId && r.player) { if (!setup.b && setup.a !== r.player.id) setup.b = r.player.id; if (!setup.pick.includes(r.player.id)) setup.pick.push(r.player.id); }
      closeSheet();
      toast(editingId ? 'Player saved' : 'Player added');
      rer();
      return true;
    }
    case 'fr-remove': {
      d = F.removePlayer(d, editingId);
      save(d);
      closeSheet();
      toast('Player removed (match history is kept)');
      ctx.go('#friends');
      return true;
    }
    case 'fr-pick': setup[el.dataset.side] = el.dataset.id; rer(); return true;
    case 'fr-game': setup.game = el.dataset.v; if (document.querySelector('#sheet.show')) { el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === el)); } else rer(); return true;
    case 'fr-race': setup.raceTo = Number(el.dataset.v); if (document.querySelector('#sheet.show')) { el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === el)); } else rer(); return true;
    case 'fr-adv': setup.adv = !setup.adv; rer(); return true;
    case 'fr-format': setup.name = document.getElementById('tName')?.value || setup.name; setup.format = el.dataset.v; rer(); return true;
    case 'fr-toggle': {
      const id = el.dataset.id;
      setup.pick = setup.pick.includes(id) ? setup.pick.filter((x) => x !== id) : [...setup.pick, id];
      el.classList.toggle('active', setup.pick.includes(id));
      const c = document.getElementById('pickCount');
      if (c) c.textContent = `${setup.pick.length} selected`;
      return true;
    }
    case 'fr-match-vs': setup.a = meId(d); setup.b = el.dataset.id; setup.sessionId = null; setup.tournamentId = null; ctx.go('#fmatch/new'); return true;
    case 'fr-match-pair': setup.a = el.dataset.a; setup.b = el.dataset.b; setup.sessionId = null; setup.tournamentId = null; ctx.go('#fmatch/new'); return true;
    case 'fr-start': {
      if (!setup.a || !setup.b || setup.a === setup.b) return true;
      const m = { ...F.newMatch({ a: setup.a, b: setup.b, game: setup.game, raceTo: setup.raceTo, sessionId: setup.sessionId, tournamentId: setup.tournamentId, tournamentMatchId: setup.tmId, deviceId: d.deviceId }), adv: setup.adv };
      save({ ...d, live: m });
      ctx.go('#fmatch/live');
      return true;
    }
    case 'fr-quick': if (setup.a && setup.b) quickScoreSheet(d, setup.a, setup.b, setup.raceTo, 'ENTER FINAL SCORE'); return true;
    case 'fr-quick-save': {
      const sa = Number(document.getElementById('qsA')?.value);
      const sb = Number(document.getElementById('qsB')?.value);
      const ctxA = el.dataset.a || setup.a;
      const ctxB = el.dataset.b || setup.b;
      if (setup.tournamentId && setup.tmId) {
        const r = T.recordResult(d, setup.tournamentId, setup.tmId, sa, sb);
        if (r.error) { toast(r.error); return true; }
        save(r.d);
        closeSheet();
        const tid = setup.tournamentId;
        setup.tournamentId = null; setup.tmId = null;
        toast(r.tournament.status === 'complete' ? `🏆 ${winsText(r.d, r.tournament.championId)} the tournament!` : 'Result saved');
        ctx.go(`#tourney/${tid}`);
        return true;
      }
      let m = F.newMatch({ a: ctxA, b: ctxB, game: el.dataset.game || setup.game, raceTo: Number(el.dataset.race) || setup.raceTo, sessionId: el.dataset.session || setup.sessionId, deviceId: d.deviceId });
      const fs = F.finalScore(m, sa, sb);
      if (fs.error) { toast(fs.error); return true; }
      m = fs.m;
      save(F.saveMatch(d, m));
      closeSheet();
      toast(`${winsText(d, m.winner)} ${m.score[m.winner]}–${m.score[m.players.find((x) => x !== m.winner)]} · saved`);
      const sid = m.sessionId;
      setup.sessionId = null;
      ctx.go(sid ? `#fsession/${sid}` : `#h2h/${m.players[0]}/${m.players[1]}`);
      return true;
    }
    case 'fr-rack': if (d.live) { save({ ...d, live: F.rackWon(d.live, el.dataset.id) }); rer(); } return true;
    case 'fr-undo': if (d.live) { save({ ...d, live: F.undoRack(d.live) }); rer(); } return true;
    case 'fr-stat': if (d.live) { save({ ...d, live: F.bumpStat(d.live, el.dataset.id, el.dataset.k) }); rer(); } return true;
    case 'fr-abandon':
      openSheet(`<h2 class="sheetTitle">Abandon this match?</h2><p class="muted">Nothing is saved to anyone's record.</p><button type="button" class="bigBtn danger" data-action="fr-abandon-do">ABANDON</button><button type="button" class="bigBtn alt" data-action="sheet-close">KEEP PLAYING</button>`, { id: 'confirm' });
      return true;
    case 'fr-abandon-do': save({ ...d, live: null }); closeSheet(); ctx.go('#friends'); return true;
    case 'fr-save-match': {
      const m = d.live;
      if (!m || m.status !== 'final') return true;
      const clean = { ...m };
      delete clean.adv;
      if (m.tournamentId && m.tournamentMatchId) {
        const r = T.recordResult({ ...d, live: null }, m.tournamentId, m.tournamentMatchId, m.score[m.players[0]], m.score[m.players[1]], { stats: null });
        if (r.error) { toast(r.error); return true; }
        // keep the live-scored rack log + stats on the tournament's match record
        const d2 = { ...r.d, matches: r.d.matches.map((x) => (x.id === r.match.id ? { ...x, racks: clean.racks, stats: clean.stats } : x)) };
        save(d2);
        toast(r.tournament.status === 'complete' ? `🏆 ${winsText(d2, r.tournament.championId)} the tournament!` : 'Result saved');
        setup.tournamentId = null; setup.tmId = null;
        ctx.go(`#tourney/${m.tournamentId}`);
        return true;
      }
      save({ ...F.saveMatch(d, clean), live: null });
      toast('Match saved');
      ctx.go(m.sessionId ? `#fsession/${m.sessionId}` : `#h2h/${m.players[0]}/${m.players[1]}`);
      return true;
    }
    case 'fr-session-new': if (F.activePlayers(d).length < 3) { toast('Add at least 3 players first'); playerSheet(d); } else sessionSheet(d); return true;
    case 'fr-session-start': {
      const r = F.newSession(d, { playerIds: setup.pick, game: setup.game, raceTo: setup.raceTo });
      if (r.error) { toast(r.error); return true; }
      save(r.d);
      closeSheet();
      ctx.go(`#fsession/${r.session.id}`);
      return true;
    }
    case 'fr-session-play': case 'fr-session-quick': {
      const s = d.sessions.find((x) => location.hash.endsWith(x.id));
      if (!s) return true;
      setup.a = el.dataset.a; setup.b = el.dataset.b; setup.game = s.game; setup.raceTo = s.raceTo; setup.sessionId = s.id; setup.tournamentId = null;
      if (a === 'fr-session-quick') { quickScoreSheet(d, el.dataset.a, el.dataset.b, s.raceTo, s.name.toUpperCase()); return true; }
      const m = { ...F.newMatch({ a: setup.a, b: setup.b, game: s.game, raceTo: s.raceTo, sessionId: s.id, deviceId: d.deviceId }), adv: setup.adv };
      save({ ...d, live: m });
      ctx.go('#fmatch/live');
      return true;
    }
    case 'fr-session-end': save(F.endSession(d, el.dataset.id)); toast('Session ended'); rer(); return true;
    case 'fr-t-create': {
      setup.name = document.getElementById('tName')?.value || '';
      const r = T.createTournament(d, { name: setup.name, format: setup.format, playerIds: setup.pick, game: setup.game, raceTo: setup.raceTo });
      if (r.error) { toast(r.error); return true; }
      save(r.d);
      setup.name = '';
      ctx.go(`#tourney/${r.tournament.id}`);
      return true;
    }
    case 'fr-t-score': case 'fr-t-play': {
      const t = d.tournaments.find((x) => x.id === el.dataset.t);
      const m = t?.matches.find((x) => x.id === el.dataset.m);
      if (!m) return true;
      setup.tournamentId = t.id; setup.tmId = m.id; setup.sessionId = null;
      if (a === 'fr-t-score') { quickScoreSheet(d, m.a, m.b, t.raceTo, t.name.toUpperCase()); return true; }
      const lm = { ...F.newMatch({ a: m.a, b: m.b, game: t.game, raceTo: t.raceTo, tournamentId: t.id, tournamentMatchId: m.id, deviceId: d.deviceId }), adv: setup.adv };
      save({ ...d, live: lm });
      ctx.go('#fmatch/live');
      return true;
    }
    case 'fr-t-clear': {
      const r = T.clearResult(d, el.dataset.t, el.dataset.m);
      if (r.error) { toast(r.error); return true; }
      save(r.d);
      toast('Result cleared');
      rer();
      return true;
    }
    case 'fr-t-delete':
      openSheet(`<h2 class="sheetTitle">Delete this tournament?</h2><p class="muted">Its matches are removed from head-to-head records too.</p><button type="button" class="bigBtn danger" data-action="fr-t-delete-do" data-t="${esc(el.dataset.t)}">DELETE</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'confirm' });
      return true;
    case 'fr-t-delete-do': save(T.deleteTournament(d, el.dataset.t)); closeSheet(); ctx.go('#friends'); return true;
    default: return false;
  }
}
