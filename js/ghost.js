/**
 * Ghost — race the Ghost from 3-ball to 9-ball.
 * Runout = your rack, any miss/foul = Ghost's rack. The match auto-saves when a player reaches the race;
 * UNDO LAST RACK reverts the last rack, including a finished match (the saved match is removed).
 * Unlocks: beating the N-ball Ghost in a race to 3 or longer opens N+1 balls (legacy unlocks are kept as a floor).
 */
import { undoGhostRack as undoRackPure, ghostRackResult } from './storage.js';
import { maxGhostBalls } from './games/engine.js';
import { esc } from './games/recipe.js';

export const GHOST_BALL_OPTIONS = [3, 4, 5, 6, 7, 8, 9];
export const RACE_OPTIONS = [3, 5, 7, 9];

export function maxUnlockedBalls(state) {
  return maxGhostBalls(state);
}

export function newGhostSession(balls = 3, race = 5) {
  return { id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, balls, race, you: 0, ghost: 0, log: [], startedAt: new Date().toISOString(), savedMatchId: null };
}

export function matchOver(s) {
  return !!s && (s.you >= s.race || s.ghost >= s.race);
}

function matchRecord(s) {
  return { id: s.id, balls: s.balls, you: s.you, ghost: s.ghost, race: s.race, won: s.you > s.ghost, log: s.log.slice(), date: new Date().toISOString(), resultSource: 'manual' };
}

/** Record a rack ('W' player runout / 'L' ghost). Pure: returns { state, session, ended }. */
export function applyRack(state, session, result) {
  if (!session || matchOver(session)) return { state, session, ended: false };
  const s = ghostRackResult(session, result);
  if (!matchOver(s)) return { state: { ...state, activeGhost: s }, session: s, ended: false };
  const m = matchRecord(s);
  const s2 = { ...s, savedMatchId: m.id };
  const xp = (state.xp || 0) + (m.won ? 80 + s.balls * 15 : 15);
  return { state: { ...state, xp, ghostMatches: [...(state.ghostMatches || []), m], activeGhost: s2 }, session: s2, ended: true, match: m };
}

/** Undo the last rack; if the match had ended, the saved match is removed too. */
export function applyUndo(state, session) {
  if (!session || !session.log.length) return { state, session };
  let ghostMatches = state.ghostMatches || [];
  let xp = state.xp || 0;
  if (session.savedMatchId) {
    const m = ghostMatches.find((x) => x.id === session.savedMatchId);
    ghostMatches = ghostMatches.filter((x) => x.id !== session.savedMatchId);
    if (m) xp = Math.max(0, xp - (m.won ? 80 + m.balls * 15 : 15));
  }
  const s = { ...undoRackPure(session), savedMatchId: null };
  return { state: { ...state, ghostMatches, xp, activeGhost: s }, session: s };
}

export function ghostStats(state) {
  const ms = state.ghostMatches || [];
  const won = ms.filter((m) => m.won).length;
  const byBalls = GHOST_BALL_OPTIONS.map((n) => {
    const l = ms.filter((m) => m.balls === n);
    const w = l.filter((m) => m.won).length;
    const racks = l.reduce((a, m) => a + (m.log || []).length, 0);
    const rw = l.reduce((a, m) => a + (m.log || []).filter((x) => x === 'W').length, 0);
    return { balls: n, played: l.length, won: w, pct: l.length ? Math.round((100 * w) / l.length) : 0, rackPct: racks ? Math.round((100 * rw) / racks) : 0 };
  });
  return { played: ms.length, won, pct: ms.length ? Math.round((100 * won) / ms.length) : 0, byBalls };
}

// ------------------------------------------------------------------------------------ screens
export function renderGhostLobby(state, preset = {}) {
  const max = maxUnlockedBalls(state);
  const st = ghostStats(state);
  const active = state.activeGhost && !matchOver(state.activeGhost) ? state.activeGhost : null;
  const selBalls = preset.balls && preset.balls <= max ? preset.balls : Math.min(max, preset.balls || 3);
  const selRace = preset.race || 5;
  return `<div class="title"><span class="eyebrow">ARCADE · GHOST</span><h1>Race the Ghost</h1><p>Break and run. Clear the table = your rack. Any miss, foul or failed runout = Ghost's rack.</p></div>
    ${active ? `<div class="card resumeCard"><b>Match in progress</b><p class="muted">${active.balls}-ball · race to ${active.race} · ${active.you}–${active.ghost}</p><button type="button" class="bigBtn" data-action="go" data-href="#ghostmatch">RESUME MATCH</button></div>` : ''}
    <div class="card ghostSetup">
      <div class="eyebrow">BALLS</div>
      <div class="ballPick">${GHOST_BALL_OPTIONS.map((n) => `<button type="button" class="ballOpt${n === selBalls ? ' active' : ''}${n > max ? ' locked' : ''}" data-action="ghost-balls" data-v="${n}" ${n > max ? 'disabled' : ''}><b>${n}</b><small>${n > max ? '🔒' : 'ball'}</small></button>`).join('')}</div>
      <p class="muted small">${max < 9 ? `Beat the ${max}-ball Ghost in a race to 3 or longer to unlock ${max + 1}-ball.` : 'Every ball count unlocked.'}</p>
      <div class="eyebrow">RACE TO</div>
      <div class="racePick">${RACE_OPTIONS.map((r) => `<button type="button" class="chip${r === selRace ? ' active' : ''}" data-action="ghost-race" data-v="${r}">${r}</button>`).join('')}</div>
      <button type="button" class="bigBtn" data-action="ghost-start">START ${selBalls}-BALL · RACE TO ${selRace}</button>
    </div>
    <h2>Your Ghost record</h2>
    <div class="card stats ghostStats"><div><b data-ghost-pct>${st.pct}%</b><span>WIN RATE</span></div><div><b>${st.won}</b><span>MATCHES WON</span></div><div><b>${st.played}</b><span>PLAYED</span></div></div>
    <div class="card history"><div class="historyRow head"><span>Balls</span><span>Played</span><span>Won</span><span>Win %</span><span>Rack %</span></div>${st.byBalls.map((b) => `<div class="historyRow"><span>${b.balls}-ball</span><span>${b.played}</span><span>${b.won}</span><span>${b.pct}%</span><span>${b.rackPct}%</span></div>`).join('')}</div>
    <h2>Recent matches</h2>
    <div class="card history" id="ghostHistory">${(state.ghostMatches || []).slice(-8).reverse().map((m) => `<div class="historyRow" data-match="${esc(m.id)}"><span>${m.balls}-ball · race ${m.race}</span><span class="${m.won ? 'green' : 'red'}">${m.won ? 'WON' : 'LOST'} ${m.you}–${m.ghost}</span><span class="muted">${new Date(m.date).toLocaleDateString()}</span></div>`).join('') || '<p class="muted">No matches yet.</p>'}</div>`;
}

export function renderGhostMatch(state) {
  const g = state.activeGhost;
  if (!g) return `<div class="card empty"><p>No match in progress.</p><button type="button" class="bigBtn" data-action="go" data-href="#ghost">SET UP A MATCH</button></div>`;
  const over = matchOver(g);
  const won = g.you > g.ghost;
  return `<div class="playScreen ghostMatch" data-over="${over ? 1 : 0}">
    <div class="playHead"><button type="button" class="phBack" data-action="go" data-href="#ghost" aria-label="Back">‹</button><div class="phTitle"><small>GHOST</small><b>${g.balls}-Ball · Race to ${g.race}</b></div><div class="phStatus"><span class="score">R${g.log.length + (over ? 0 : 1)}</span></div></div>
    <div class="playBody">
      <div class="ghostScore"><div><b data-you>${g.you}</b><span>YOU</span></div><em>—</em><div><b data-ghost>${g.ghost}</b><span>GHOST</span></div></div>
      ${over ? `<div class="resultPanel ${won ? 'pass' : 'fail'} inline" data-result="${won ? 'pass' : 'fail'}"><h1>${won ? 'YOU WIN' : 'GHOST WINS'} ${g.you}–${g.ghost}</h1><p class="muted">Match saved to history. Tapped the wrong button? UNDO LAST RACK reopens the match.</p><div class="resultBtns"><button type="button" class="bigBtn" data-action="ghost-again">REMATCH</button><button type="button" class="bigBtn alt" data-action="go" data-href="#ghost">GHOST HOME</button></div></div>`
        : `<p class="instructions">Rack ${g.log.length + 1}: break, ball in hand after a legal break, run all ${g.balls} balls in rotation.</p>`}
      <div class="racklog">${g.log.map((x, i) => `<span class="${x === 'W' ? 'win' : 'loss'}">R${i + 1} ${x === 'W' ? 'RUNOUT' : 'GHOST'}</span>`).join('')}</div>
    </div>
    <div class="resultBar ghostBar">
      ${over ? '' : '<button type="button" class="rb s3" data-action="ghost-rack" data-v="W"><b>RUNOUT</b><small>PLAYER WINS</small></button><button type="button" class="rb miss" data-action="ghost-rack" data-v="L"><b>MISS / FOUL</b><small>GHOST WINS</small></button>'}
      <button type="button" class="rb undo wide" data-action="ghost-undo" ${g.log.length ? '' : 'disabled'}><b>↶ UNDO LAST RACK</b></button>
    </div>
  </div>`;
}
