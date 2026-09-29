/**
 * Friends / PvP (local, offline) — player profiles, match records, head-to-head, group sessions.
 * Stored in its own key (poolIQFriendsV1), mirrored to IndexedDB / snapshots / backups by vault.js.
 * NEVER reads or writes training state: PvP results cannot change Career rank, XP, skills or Drill Rank.
 *
 * Designed for later sync (one-phone Arena, linked phones, room codes/QR, accounts): every player and match has a
 * stable UUID, createdAt/updatedAt, source ('local'), deviceId, and match records carry ruleset/houseRules fields
 * (null for now; Stage B's "Set Tonight's House Rules" fills them). There is no network code here.
 */
import { dataWritten } from '../storage.js';
import { PVP } from '../progression/config.js';

export const FRIENDS_KEY = 'poolIQFriendsV1';
export const FRIENDS_SCHEMA = 1;
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function uuid() {
  try { if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID(); } catch { /* fall through */ }
  const b = new Uint8Array(16);
  try { globalThis.crypto.getRandomValues(b); } catch { for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function emptyFriends() {
  return { schema: FRIENDS_SCHEMA, deviceId: uuid(), players: [], matches: [], sessions: [], tournaments: [], live: null, updatedAt: 0 };
}
export function loadFriends() {
  try {
    const d = JSON.parse(ls()?.getItem(FRIENDS_KEY) || 'null');
    if (!d || typeof d !== 'object' || !Array.isArray(d.players)) return emptyFriends();
    return { ...emptyFriends(), ...d, players: d.players || [], matches: d.matches || [], sessions: d.sessions || [], tournaments: d.tournaments || [] };
  } catch {
    return emptyFriends();
  }
}
export function saveFriends(d, now = Date.now()) {
  const out = { ...d, schema: FRIENDS_SCHEMA, updatedAt: now };
  try { ls()?.setItem(FRIENDS_KEY, JSON.stringify(out)); dataWritten(FRIENDS_KEY); } catch { /* quota */ }
  return out;
}

// ------------------------------------------------------------------ players
export const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24);
export function addPlayer(d, name, { avatar = null, isMe = false, id = null, now = Date.now() } = {}) {
  const n = cleanName(name);
  if (!n) return { d, error: 'Enter a name' };
  if (d.players.some((p) => !p.archived && p.name.toLowerCase() === n.toLowerCase())) return { d, error: `${n} is already on your list` };
  if (d.players.filter((p) => !p.archived).length >= PVP.maxPlayers) return { d, error: 'Player list is full' };
  const p = { id: id || uuid(), name: n, avatar: avatar || null, isMe: !!isMe, createdAt: now, updatedAt: now, source: 'local' };
  return { d: { ...d, players: [...d.players, p] }, player: p };
}
export function updatePlayer(d, id, patch, now = Date.now()) {
  const name = patch.name != null ? cleanName(patch.name) : null;
  if (patch.name != null && !name) return { d, error: 'Enter a name' };
  if (name && d.players.some((p) => p.id !== id && !p.archived && p.name.toLowerCase() === name.toLowerCase())) return { d, error: `${name} is already on your list` };
  return { d: { ...d, players: d.players.map((p) => (p.id === id ? { ...p, ...(name ? { name } : {}), ...('avatar' in patch ? { avatar: patch.avatar } : {}), updatedAt: now } : p)) } };
}
/** Players with match history are archived (history stays intact); others are removed */
export function removePlayer(d, id) {
  const used = d.matches.some((m) => m.players.includes(id)) || d.tournaments.some((t) => t.playerIds.includes(id));
  return { ...d, players: used ? d.players.map((p) => (p.id === id ? { ...p, archived: true } : p)) : d.players.filter((p) => p.id !== id) };
}
export const activePlayers = (d) => d.players.filter((p) => !p.archived);
export const playerById = (d, id) => d.players.find((p) => p.id === id) || null;
export const playerName = (d, id) => playerById(d, id)?.name || (id === 'bye' ? 'BYE' : '—');
export const gameName = (id) => PVP.games.find((g) => g.id === id)?.name || id;

// ------------------------------------------------------------------ matches
export function emptyStats() {
  return Object.fromEntries(PVP.advancedStats.map((k) => [k, 0]));
}
/** A new (live) match. players: [idA, idB] */
export function newMatch({ a, b, game = '8-ball', raceTo = PVP.defaultRace, sessionId = null, tournamentId = null, tournamentMatchId = null, deviceId = null, now = Date.now() }) {
  return { id: uuid(), schema: 1, createdAt: now, updatedAt: now, endedAt: null, status: 'live', game, raceTo: Math.max(1, Math.min(99, Math.round(raceTo) || 1)), players: [a, b], score: { [a]: 0, [b]: 0 }, racks: [], winner: null, stats: { [a]: emptyStats(), [b]: emptyStats() }, ruleset: null, houseRules: null, sessionId, tournamentId, tournamentMatchId, source: 'local', deviceId };
}
export function rackWon(m, pid, now = Date.now()) {
  if (m.status !== 'live' || !m.players.includes(pid)) return m;
  const score = { ...m.score, [pid]: (m.score[pid] || 0) + 1 };
  const out = { ...m, score, racks: [...m.racks, pid], updatedAt: now };
  if (score[pid] >= m.raceTo) return { ...out, status: 'final', winner: pid, endedAt: now };
  return out;
}
export function undoRack(m, now = Date.now()) {
  if (!m.racks.length) return m;
  const last = m.racks[m.racks.length - 1];
  return { ...m, racks: m.racks.slice(0, -1), score: { ...m.score, [last]: Math.max(0, m.score[last] - 1) }, status: 'live', winner: null, endedAt: null, updatedAt: now };
}
export function bumpStat(m, pid, key, delta = 1) {
  if (!PVP.advancedStats.includes(key) || !m.players.includes(pid)) return m;
  const s = { ...(m.stats[pid] || emptyStats()) };
  s[key] = Math.max(0, (s[key] || 0) + delta);
  return { ...m, stats: { ...m.stats, [pid]: s } };
}
/** Final score typed in directly (simple score entry) */
export function finalScore(m, sa, sb, now = Date.now()) {
  const [a, b] = m.players;
  const x = Math.max(0, Math.round(sa) || 0);
  const y = Math.max(0, Math.round(sb) || 0);
  if (x === y) return { m, error: 'A match needs a winner' };
  if (Math.max(x, y) !== m.raceTo) return { m, error: `The winner must reach ${m.raceTo} (race to ${m.raceTo})` };
  return { m: { ...m, score: { [a]: x, [b]: y }, racks: m.racks.length === x + y ? m.racks : [], status: 'final', winner: x > y ? a : b, endedAt: now, updatedAt: now } };
}
/** Hill-hill: the match went to the last rack (both players one game from winning) */
export function isHillHill(m) {
  if (m.status !== 'final') return false;
  const [a, b] = m.players;
  return Math.min(m.score[a], m.score[b]) === m.raceTo - 1 && Math.max(m.score[a], m.score[b]) === m.raceTo;
}
export function saveMatch(d, m) {
  const i = d.matches.findIndex((x) => x.id === m.id);
  const matches = i >= 0 ? d.matches.map((x) => (x.id === m.id ? m : x)) : [...d.matches, m];
  let sessions = d.sessions;
  if (m.sessionId) sessions = sessions.map((s) => (s.id === m.sessionId && !s.matchIds.includes(m.id) ? { ...s, matchIds: [...s.matchIds, m.id] } : s));
  return { ...d, matches, sessions };
}
export function deleteMatch(d, id) {
  return { ...d, matches: d.matches.filter((m) => m.id !== id), sessions: d.sessions.map((s) => ({ ...s, matchIds: s.matchIds.filter((x) => x !== id) })) };
}
const finals = (d) => d.matches.filter((m) => m.status === 'final');

// ------------------------------------------------------------------ stats
export function playerStats(d, pid, game = null) {
  const ms = finals(d).filter((m) => m.players.includes(pid) && (!game || m.game === game)).sort((x, y) => (x.endedAt || x.createdAt) - (y.endedAt || y.createdAt));
  const st = { matches: ms.length, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, currentStreak: 0, streakType: null, bestStreak: 0, hillHill: 0, hillHillWins: 0, ...emptyStats(), byGame: {} };
  let run = 0;
  for (const m of ms) {
    const opp = m.players.find((x) => x !== pid);
    const won = m.winner === pid;
    st[won ? 'wins' : 'losses']++;
    st.gamesWon += m.score[pid] || 0;
    st.gamesLost += m.score[opp] || 0;
    if (isHillHill(m)) { st.hillHill++; if (won) st.hillHillWins++; }
    for (const k of PVP.advancedStats) st[k] += m.stats?.[pid]?.[k] || 0;
    run = won ? (run > 0 ? run + 1 : 1) : run < 0 ? run - 1 : -1;
    if (run > st.bestStreak) st.bestStreak = run;
    const g = (st.byGame[m.game] ||= { matches: 0, wins: 0, losses: 0 });
    g.matches++;
    g[won ? 'wins' : 'losses']++;
  }
  st.currentStreak = Math.abs(run);
  st.streakType = run > 0 ? 'W' : run < 0 ? 'L' : null;
  st.winPct = st.matches ? Math.round((100 * st.wins) / st.matches) : 0;
  return st;
}
/** Head-to-head A vs B (optionally one game) */
export function headToHead(d, a, b, game = null) {
  const ms = finals(d).filter((m) => m.players.includes(a) && m.players.includes(b) && (!game || m.game === game)).sort((x, y) => (y.endedAt || 0) - (x.endedAt || 0));
  const out = { a, b, matches: ms.length, winsA: 0, winsB: 0, gamesA: 0, gamesB: 0, hillHill: 0, byGame: {}, recent: ms.slice(0, 10), stats: { [a]: emptyStats(), [b]: emptyStats() } };
  for (const m of ms) {
    if (m.winner === a) out.winsA++; else out.winsB++;
    out.gamesA += m.score[a] || 0;
    out.gamesB += m.score[b] || 0;
    if (isHillHill(m)) out.hillHill++;
    const g = (out.byGame[m.game] ||= { a: 0, b: 0 });
    g[m.winner === a ? 'a' : 'b']++;
    for (const k of PVP.advancedStats) { out.stats[a][k] += m.stats?.[a]?.[k] || 0; out.stats[b][k] += m.stats?.[b]?.[k] || 0; }
  }
  return out;
}
/** Every opponent a player has faced, with the record */
export function rivals(d, pid) {
  const ids = new Set();
  for (const m of finals(d)) if (m.players.includes(pid)) ids.add(m.players.find((x) => x !== pid));
  return [...ids].map((o) => ({ id: o, ...headToHead(d, pid, o) })).sort((x, y) => y.matches - x.matches);
}

// ------------------------------------------------------------------ group sessions (PLAY WITH FRIENDS, 3+ players)
export function newSession(d, { name = '', playerIds, game = '8-ball', raceTo = PVP.defaultRace, now = Date.now() }) {
  const ids = [...new Set(playerIds)].filter((id) => playerById(d, id));
  if (ids.length < 3) return { d, error: 'Pick at least 3 players' };
  const s = { id: uuid(), name: cleanName(name) || `Session ${new Date(now).toLocaleDateString()}`, playerIds: ids, game, raceTo, matchIds: [], startedAt: now, endedAt: null, source: 'local' };
  return { d: { ...d, sessions: [...d.sessions, s] }, session: s };
}
export function endSession(d, id, now = Date.now()) {
  return { ...d, sessions: d.sessions.map((s) => (s.id === id ? { ...s, endedAt: now } : s)) };
}
/** Who played whom in the session: {pairs: [{a,b,played,winsA,winsB}], table: {pid: {played,wins,losses}}, next: [a,b] fewest games together} */
export function sessionSummary(d, id) {
  const s = d.sessions.find((x) => x.id === id);
  if (!s) return null;
  const ms = d.matches.filter((m) => s.matchIds.includes(m.id) && m.status === 'final');
  const pairs = [];
  for (let i = 0; i < s.playerIds.length; i++) {
    for (let j = i + 1; j < s.playerIds.length; j++) {
      const a = s.playerIds[i];
      const b = s.playerIds[j];
      const pm = ms.filter((m) => m.players.includes(a) && m.players.includes(b));
      pairs.push({ a, b, played: pm.length, winsA: pm.filter((m) => m.winner === a).length, winsB: pm.filter((m) => m.winner === b).length });
    }
  }
  const table = Object.fromEntries(s.playerIds.map((p) => [p, { played: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 }]));
  for (const m of ms) for (const p of m.players) if (table[p]) { table[p].played++; table[p][m.winner === p ? 'wins' : 'losses']++; table[p].gamesWon += m.score[p] || 0; table[p].gamesLost += m.score[m.players.find((x) => x !== p)] || 0; }
  const load = (p) => table[p].played;
  const next = pairs.slice().sort((x, y) => x.played - y.played || load(x.a) + load(x.b) - (load(y.a) + load(y.b)))[0] || null;
  return { session: s, matches: ms, pairs, table, next: next ? [next.a, next.b] : null };
}
