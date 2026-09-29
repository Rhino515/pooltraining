/**
 * Tournaments (local): SINGLE ELIMINATION (standard seeding, byes to top seeds, winners advance automatically)
 * and ROUND ROBIN (circle-method schedule, standings with documented tiebreakers).
 * Results are ordinary PvP match records (friends/model.js) tagged with tournamentId, so they feed head-to-head.
 * Tiebreakers (config PVP.tiebreakers): wins → head-to-head wins among the tied players → game differential →
 * games won → name. See docs/FRIENDS_AND_TOURNAMENTS.md.
 */
import { uuid, cleanName, newMatch, saveMatch, finalScore } from './model.js';
import { PVP } from '../progression/config.js';

export const BYE = 'bye';

/** Standard bracket order for a power-of-two size: 8 → [1,8,4,5,2,7,3,6] */
export function seedOrder(size) {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2 + 1;
    order = order.flatMap((s) => [s, n - s]);
  }
  return order;
}

export function createTournament(d, { name, format, playerIds, game = '8-ball', raceTo = PVP.defaultRace, now = Date.now() }) {
  const f = PVP.formats.find((x) => x.id === format);
  const ids = [...new Set(playerIds)];
  if (!f) return { d, error: 'Pick a format' };
  if (ids.length < f.minPlayers) return { d, error: `${f.name} needs at least ${f.minPlayers} players` };
  if (ids.length > f.maxPlayers) return { d, error: `${f.name} allows up to ${f.maxPlayers} players` };
  const t = { id: uuid(), schema: 1, name: cleanName(name) || `${f.name} ${new Date(now).toLocaleDateString()}`, format, game, raceTo: Math.max(1, Math.round(raceTo) || 1), playerIds: ids, createdAt: now, updatedAt: now, completedAt: null, championId: null, status: 'active', matches: [], source: 'local' };
  t.matches = format === 'single' ? singleElimMatches(ids) : roundRobinMatches(ids);
  const out = advance(t);
  return { d: { ...d, tournaments: [...d.tournaments, out] }, tournament: out };
}

// ------------------------------------------------------------------ single elimination
export function singleElimMatches(ids) {
  const n = ids.length;
  const size = 2 ** Math.ceil(Math.log2(Math.max(2, n)));
  const rounds = Math.log2(size);
  const order = seedOrder(size);
  const ms = [];
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    for (let s = 0; s < count; s++) ms.push({ id: `r${r}m${s + 1}`, round: r, slot: s, a: null, b: null, winner: null, score: null, matchId: null, bye: false });
  }
  for (let s = 0; s < size / 2; s++) {
    const m = ms.find((x) => x.round === 1 && x.slot === s);
    const sa = order[2 * s];
    const sb = order[2 * s + 1];
    m.a = sa <= n ? ids[sa - 1] : BYE;
    m.b = sb <= n ? ids[sb - 1] : BYE;
    m.seeds = [sa, sb];
  }
  return ms;
}
export const roundCount = (t) => Math.max(0, ...t.matches.map((m) => m.round));
export function roundName(t, r) {
  if (t.format !== 'single') return `Round ${r}`;
  const left = roundCount(t) - r;
  return left === 0 ? 'Final' : left === 1 ? 'Semifinals' : left === 2 ? 'Quarterfinals' : `Round ${r}`;
}
/** Auto-advance: byes, winners into the next round, champion when done. Pure. */
export function advance(t0) {
  const t = { ...t0, matches: t0.matches.map((m) => ({ ...m })) };
  if (t.format === 'single') {
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of t.matches) {
        if (!m.winner && m.a && m.b && (m.a === BYE || m.b === BYE)) {
          m.winner = m.a === BYE ? m.b : m.a;
          m.bye = true;
          changed = true;
        }
        if (m.winner) {
          const nx = t.matches.find((x) => x.round === m.round + 1 && x.slot === Math.floor(m.slot / 2));
          if (nx) {
            const side = m.slot % 2 === 0 ? 'a' : 'b';
            if (nx[side] !== m.winner) { nx[side] = m.winner; changed = true; }
          }
        }
      }
    }
    const final = t.matches.find((m) => m.round === roundCount(t));
    if (final?.winner && final.winner !== BYE) { t.championId = final.winner; t.status = 'complete'; t.completedAt = t.completedAt || Date.now(); }
  } else if (t.matches.every((m) => m.winner)) {
    t.championId = standings(t)[0]?.id || null;
    t.status = 'complete';
    t.completedAt = t.completedAt || Date.now();
  }
  return t;
}

// ------------------------------------------------------------------ round robin
/** Circle method: n players (+ BYE if odd) → n−1 rounds, everyone plays everyone once */
export function roundRobinMatches(ids) {
  const list = ids.length % 2 ? [...ids, BYE] : ids.slice();
  const n = list.length;
  const ms = [];
  let arr = list.slice();
  for (let r = 1; r < n; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== BYE && b !== BYE) ms.push({ id: `r${r}m${ms.filter((x) => x.round === r).length + 1}`, round: r, a, b, winner: null, score: null, matchId: null });
    }
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return ms;
}
/** Standings with tiebreakers: wins, head-to-head among the tied, game differential, games won, name */
export function standings(t, names = {}) {
  const rows = Object.fromEntries(t.playerIds.map((id) => [id, { id, played: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, diff: 0 }]));
  for (const m of t.matches) {
    if (!m.winner || m.bye || !m.score) continue;
    for (const p of [m.a, m.b]) {
      const r = rows[p];
      if (!r) continue;
      const o = p === m.a ? m.b : m.a;
      r.played++;
      r[m.winner === p ? 'wins' : 'losses']++;
      r.gamesWon += m.score[p] || 0;
      r.gamesLost += m.score[o] || 0;
    }
  }
  for (const r of Object.values(rows)) r.diff = r.gamesWon - r.gamesLost;
  const h2hWins = (id, group) => t.matches.filter((m) => m.winner === id && group.includes(m.a) && group.includes(m.b)).length;
  const list = Object.values(rows);
  // group by wins, then order each tied group
  list.sort((x, y) => y.wins - x.wins);
  const out = [];
  for (let i = 0; i < list.length;) {
    let j = i;
    while (j < list.length && list[j].wins === list[i].wins) j++;
    const group = list.slice(i, j);
    const ids = group.map((g) => g.id);
    for (const g of group) g.h2h = group.length > 1 ? h2hWins(g.id, ids) : 0;
    group.sort((x, y) => y.h2h - x.h2h || y.diff - x.diff || y.gamesWon - x.gamesWon || String(names[x.id] || x.id).localeCompare(String(names[y.id] || y.id)));
    out.push(...group);
    i = j;
  }
  out.forEach((r, k) => { r.place = k + 1; });
  return out;
}

// ------------------------------------------------------------------ results
export function playableMatches(t) {
  return t.matches.filter((m) => !m.winner && m.a && m.b && m.a !== BYE && m.b !== BYE);
}
/** Record a result (final score) for tournament match tmId. Creates the PvP match record. Returns { d, tournament } */
export function recordResult(d, tid, tmId, scoreA, scoreB, { now = Date.now(), stats = null } = {}) {
  const t = d.tournaments.find((x) => x.id === tid);
  if (!t) return { d, error: 'Tournament not found' };
  const m = t.matches.find((x) => x.id === tmId);
  if (!m || !m.a || !m.b || m.a === BYE || m.b === BYE) return { d, error: 'That match is not ready' };
  if (m.winner) return { d, error: 'Result already entered' };
  let pm = newMatch({ a: m.a, b: m.b, game: t.game, raceTo: t.raceTo, tournamentId: t.id, tournamentMatchId: m.id, deviceId: d.deviceId, now });
  const fs = finalScore(pm, scoreA, scoreB, now);
  if (fs.error) return { d, error: fs.error };
  pm = fs.m;
  if (stats) pm = { ...pm, stats: { ...pm.stats, ...stats } };
  const t2 = advance({ ...t, updatedAt: now, matches: t.matches.map((x) => (x.id === tmId ? { ...x, winner: pm.winner, score: { ...pm.score }, matchId: pm.id } : x)) });
  const d2 = saveMatch({ ...d, tournaments: d.tournaments.map((x) => (x.id === tid ? t2 : x)) }, pm);
  return { d: d2, tournament: t2, match: pm };
}
/** Clear a result while the next-round match has not been played (single elim) — also removes the PvP match */
export function clearResult(d, tid, tmId) {
  const t = d.tournaments.find((x) => x.id === tid);
  const m = t?.matches.find((x) => x.id === tmId);
  if (!m || !m.winner || m.bye) return { d, error: 'Nothing to clear' };
  if (t.format === 'single') {
    const nx = t.matches.find((x) => x.round === m.round + 1 && x.slot === Math.floor(m.slot / 2));
    if (nx?.winner) return { d, error: 'The next round has already been played' };
    if (nx) nx[m.slot % 2 === 0 ? 'a' : 'b'] = null;
  }
  const matches = t.matches.map((x) => (x.id === tmId ? { ...x, winner: null, score: null, matchId: null } : x));
  const t2 = { ...t, matches, status: 'active', championId: null, completedAt: null };
  return { d: { ...d, matches: d.matches.filter((x) => x.id !== m.matchId), tournaments: d.tournaments.map((x) => (x.id === tid ? t2 : x)) }, tournament: t2 };
}
export function deleteTournament(d, tid) {
  return { ...d, tournaments: d.tournaments.filter((t) => t.id !== tid), matches: d.matches.filter((m) => m.tournamentId !== tid) };
}
