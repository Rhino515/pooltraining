/**
 * Ghost scorekeeper — race formats, undo, history, unlock ladder.
 */
import {
  undoGhostRack as undoRackPure,
  ghostRackResult
} from './storage.js';

export const GHOST_BALL_OPTIONS = [3, 4, 5, 6, 7, 8, 9];
export const RACE_OPTIONS = [3, 5, 7, 9];

let session = null;

export function getGhostSession() {
  return session;
}

export function maxUnlockedBalls(state) {
  const wins = (state.ghostMatches || []).filter((m) => m.won).length;
  // Start at 3; +1 ball option every 2 wins, cap 9
  return Math.min(9, Math.max(3, state.unlockedGhostBalls || 3 + Math.floor(wins / 2)));
}

export function startGhost({ balls = 3, race = 5 } = {}) {
  session = {
    balls,
    race,
    you: 0,
    ghost: 0,
    log: [],
    startedAt: new Date().toISOString()
  };
  return session;
}

export function closeGhost() {
  session = null;
}

export function ghostRack(result) {
  if (!session) return null;
  if (session.you >= session.race || session.ghost >= session.race) return session;
  session = ghostRackResult(session, result);
  return session;
}

export function undoLastRack() {
  if (!session) return null;
  session = undoRackPure(session);
  return session;
}

export function matchOver(s = session) {
  if (!s) return false;
  return s.you >= s.race || s.ghost >= s.race;
}

export function saveGhostMatch(state) {
  if (!session || !matchOver(session)) return { state, error: 'incomplete' };
  const won = session.you > session.ghost;
  const match = {
    id: `g-${Date.now()}`,
    balls: session.balls,
    you: session.you,
    ghost: session.ghost,
    race: session.race,
    won,
    log: session.log.slice(),
    date: new Date().toISOString()
  };
  const wins = (state.ghostMatches || []).filter((m) => m.won).length + (won ? 1 : 0);
  const unlockedGhostBalls = Math.min(9, 3 + Math.floor(wins / 2));
  let skills = { ...state.skills };
  let xp = state.xp || 0;
  if (won) {
    xp += 80 + session.balls * 15;
    skills['Pattern Play'] = Math.min(99, (skills['Pattern Play'] || 30) + 3);
    skills['Shot Making'] = Math.min(99, (skills['Shot Making'] || 30) + 1);
  } else {
    xp += 15;
  }
  const next = {
    ...state,
    xp,
    skills,
    unlockedGhostBalls,
    ghostMatches: [...(state.ghostMatches || []), match]
  };
  return { state: next, match, won };
}

export function renderGhostHTML(state) {
  if (!session) return '';
  const g = session;
  const over = matchOver(g);
  const rackNum = g.log.length + 1;
  return `
    <button class="close" data-action="close-ghost" aria-label="Close">×</button>
    <span class="eyebrow">${g.balls}-BALL GHOST · RACE TO ${g.race}</span>
    <h1>YOU vs GHOST</h1>
    <div class="ghostScore">
      <div><b>${g.you}</b><span>YOU</span></div>
      <em>—</em>
      <div><b>${g.ghost}</b><span>GHOST</span></div>
    </div>
    <p class="instructions">Rack <b>${Math.min(rackNum, g.log.length + (over ? 0 : 1))}</b>. Break, take ball-in-hand after a legal break, and try to run out. Clear the table = you win the rack. Miss, foul, or failed runout = Ghost wins the rack.</p>
    <div class="racklog">${g.log
      .map((x, i) => `<span class="${x === 'W' ? 'win' : 'loss'}">R${i + 1} ${x === 'W' ? 'RUNOUT' : 'MISS'}</span>`)
      .join('')}</div>
    ${
      !over
        ? `<div class="scoreBtns ghostBtns">
            <button class="hitBtn" data-ghost="W">RUNOUT</button>
            <button class="missBtn" data-ghost="L">MISS / FOUL</button>
            <button class="ghostUndo" data-ghost="undo" ${g.log.length ? '' : 'disabled'}>UNDO LAST RACK</button>
          </div>`
        : `<button class="saveScore" data-ghost="save">Save Match — ${g.you > g.ghost ? 'YOU WIN' : 'GHOST WINS'} ${g.you}–${g.ghost}</button>`
    }
  `;
}

export function renderGhostLobby(state) {
  const maxB = maxUnlockedBalls(state);
  const levels = GHOST_BALL_OPTIONS.map((n) => {
    const locked = n > maxB;
    return `<div class="rank card ${locked ? 'locked' : ''}">
      <div class="num">${n}</div>
      <div>
        <h3>${n}-Ball Ghost</h3>
        <p>Choose race to 3 / 5 / 7 / 9 · ball-in-hand after break · undo available.</p>
      </div>
      ${
        locked
          ? `<button disabled>🔒 Win more Ghost matches</button>`
          : `<button type="button" data-ghost-start="${n}">Play</button>`
      }
    </div>`;
  }).join('');

  const hist = (state.ghostMatches || []).slice().reverse().slice(0, 8);
  const histHTML = hist.length
    ? hist
        .map((m) => {
          const d = new Date(m.date);
          return `<div class="historyRow"><span>${m.balls}-Ball · Race ${m.race || 5} · ${d.toLocaleDateString()}</span><b class="${m.won ? 'green' : 'red'}">${m.won ? 'WIN' : 'LOSS'} ${m.you}–${m.ghost}</b></div>`;
        })
        .join('')
    : `<p class="muted">No Ghost matches recorded yet.</p>`;

  const wins = (state.ghostMatches || []).filter((m) => m.won).length;
  const played = (state.ghostMatches || []).length;

  return `
    <div class="title">
      <span class="eyebrow">GHOST LADDER</span>
      <h1>Beat the Ghost</h1>
      <p>Race formats unlock with wins. Recorded matches count toward career ranks.</p>
    </div>
    <div class="card stats ghostStats">
      <div><b>${wins}</b><span>Wins</span></div>
      <div><b>${played}</b><span>Matches</span></div>
      <div><b>${maxB}</b><span>Max Balls</span></div>
    </div>
    <div id="ghostLevels" class="ranklist">${levels}</div>
    <h2>Match History</h2>
    <div class="card history" id="ghostHistory">${histHTML}</div>
    <div id="ghostRacePicker" class="modal"><div class="modalBody card" id="ghostRaceBody"></div></div>
  `;
}

export function renderRacePicker(balls) {
  return `
    <button class="close" data-action="close-race">×</button>
    <span class="eyebrow">${balls}-BALL GHOST</span>
    <h1>Select Race</h1>
    <div class="raceGrid">
      ${RACE_OPTIONS.map((r) => `<button type="button" class="raceBtn" data-race="${r}" data-balls="${balls}">Race to ${r}</button>`).join('')}
    </div>
  `;
}

export { undoRackPure as undoGhostRack };
