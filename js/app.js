/**
 * Pool IQ — hash router / boot.
 * Routes: #home #career #drills #analyze #arcade #profile (#stats alias) #settings
 *         #ghost[/balls/race] #ghostmatch #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id>
 */
import { loadState, saveState, resetState, archiveUnknownDrills } from './storage.js';
import { syncRank } from './career.js';
import { withSkills } from './skills.js';
import { drills, getDrillById } from './drills.js';
import { renderHome, renderCareerPage, renderDrillsPage, renderArcade, renderGameLobby, renderBossPage, renderProfile, renderSettings } from './dashboard.js';
import { renderAnalyzePage, bindAnalyzeHandlers } from './analyze.js';
import { renderGhostLobby, renderGhostMatch, newGhostSession, applyRack, applyUndo, maxUnlockedBalls, matchOver } from './ghost.js';
import { createPlayScreen } from './ui/play.js';
import { openSheet, closeSheet, toast } from './ui/sheet.js';
import { getGame, getBoss, getStage } from './games/registry.js';
import { isStageUnlocked, isEndlessUnlocked, isGameUnlocked } from './games/engine.js';
import { isBossUnlocked } from './career.js';

function derive(s) {
  return syncRank(withSkills(s));
}

let state = derive(archiveUnknownDrills(loadState(), drills.map((d) => d.id)));
saveState(state);

let screen = null; // active play screen (has render/onAction)
let route = { name: 'home', args: [] };
let ghostPreset = { balls: 3, race: 5 };
let drillFilter = 'All';
const view = () => document.getElementById('view');

function commit(next, { silent = false } = {}) {
  state = silent ? next : derive(next);
  saveState(state);
  return state;
}

const ctx = {
  getState: () => state,
  commit,
  go: (h) => navigate(h),
  get root() {
    return view();
  }
};

function navigate(hash) {
  if (location.hash === hash) renderRoute();
  else location.hash = hash;
}

function parseHash() {
  const h = (location.hash || '#home').slice(1);
  const [name, ...args] = h.split('/');
  return { name: name || 'home', args };
}

const NAV_FOR = { home: 'home', career: 'career', drills: 'drills', analyze: 'analyze', arcade: 'arcade', game: 'arcade', ghost: 'arcade', ghostmatch: 'arcade', profile: 'profile', stats: 'profile', settings: 'profile', boss: 'career' };

function setChrome(playing, navName) {
  document.body.classList.toggle('playing', playing);
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === navName));
}

function renderRoute() {
  closeSheet();
  route = parseHash();
  const { name, args } = route;
  screen = null;
  const v = view();
  let playing = false;
  if (name === 'play' && args[0]) {
    const [gameId, stageId] = args;
    const ok = gameId === 'drills' ? !!getDrillById(stageId) : stageId === 'endless' ? isEndlessUnlocked(state, gameId) : !!getStage(gameId, stageId) && isStageUnlocked(state, gameId, stageId);
    if (!ok) {
      toast(gameId !== 'drills' && getGame(gameId) && !isGameUnlocked(state, gameId) ? 'That game is still locked' : 'That stage is locked — pass the previous stage first');
      v.innerHTML = gameId === 'drills' ? renderDrillsPage(state, drillFilter) : renderGameLobby(state, gameId);
    } else {
      screen = createPlayScreen(ctx, { gameId, stageId });
      screen.render();
      playing = true;
    }
  } else if (name === 'bossplay' && args[0]) {
    const b = getBoss(args[0]);
    if (b && (isBossUnlocked(state, b) || state.bosses?.[b.id]?.passed)) {
      screen = createPlayScreen(ctx, { bossId: b.id });
      screen.render();
      playing = true;
    } else v.innerHTML = renderBossPage(state, args[0]);
  } else if (name === 'boss') v.innerHTML = renderBossPage(state, args[0]);
  else if (name === 'game') v.innerHTML = args[0] === 'ghost' ? renderGhostLobby(state, ghostPreset) : renderGameLobby(state, args[0]);
  else if (name === 'career') v.innerHTML = renderCareerPage(state);
  else if (name === 'drills') v.innerHTML = renderDrillsPage(state, drillFilter);
  else if (name === 'analyze') {
    v.innerHTML = renderAnalyzePage();
    bindAnalyzeHandlers(v);
  } else if (name === 'arcade') v.innerHTML = renderArcade(state);
  else if (name === 'profile' || name === 'stats') v.innerHTML = renderProfile(state);
  else if (name === 'settings') v.innerHTML = renderSettings(state);
  else if (name === 'ghost') {
    if (args[0]) ghostPreset = { balls: Math.min(Number(args[0]) || 3, maxUnlockedBalls(state)), race: Number(args[1]) || 5 };
    v.innerHTML = renderGhostLobby(state, ghostPreset);
  } else if (name === 'ghostmatch') {
    v.innerHTML = renderGhostMatch(state);
    playing = !!state.activeGhost;
  } else v.innerHTML = renderHome(state);
  setChrome(playing, NAV_FOR[name] || 'home');
  if (!playing) window.scrollTo(0, 0);
  else window.scrollTo(0, 0);
}

function rerender() {
  if (screen) screen.render();
  else renderRoute();
}

// ------------------------------------------------------------------------------ actions
function handleAction(action, el, e) {
  if (action === 'go') {
    navigate(el.dataset.href);
    return;
  }
  if (action === 'sheet-close') {
    closeSheet();
    return;
  }
  if (screen && screen.onAction(action, el, e)) return;
  switch (action) {
    case 'locked-stage':
      toast('Locked — pass the previous stage first');
      break;
    case 'drill-filter':
      drillFilter = el.dataset.v;
      renderRoute();
      break;
    case 'ghost-balls':
      ghostPreset.balls = Number(el.dataset.v);
      renderRoute();
      break;
    case 'ghost-race':
      ghostPreset.race = Number(el.dataset.v);
      renderRoute();
      break;
    case 'ghost-start': {
      const balls = Math.min(ghostPreset.balls, maxUnlockedBalls(state));
      commit({ ...state, activeGhost: newGhostSession(balls, ghostPreset.race) }, { silent: true });
      navigate('#ghostmatch');
      break;
    }
    case 'ghost-again': {
      const g = state.activeGhost;
      commit({ ...state, activeGhost: newGhostSession(g.balls, g.race) }, { silent: true });
      renderRoute();
      break;
    }
    case 'ghost-rack': {
      const out = applyRack(state, state.activeGhost, el.dataset.v);
      commit(out.state);
      if (out.ended) toast(out.match.won ? 'Match won — saved' : 'Ghost wins — match saved');
      renderRoute();
      break;
    }
    case 'ghost-undo': {
      const out = applyUndo(state, state.activeGhost);
      commit(out.state);
      toast('Last rack undone');
      renderRoute();
      break;
    }
    case 'set-coach':
      commit({ ...state, settings: { ...state.settings, coaching: el.dataset.v } });
      renderRoute();
      break;
    case 'set-table':
      commit({ ...state, speedCal: { ...state.speedCal, tableSize: Number(el.dataset.v) } });
      renderRoute();
      break;
    case 'set-cloth':
      commit({ ...state, speedCal: { ...state.speedCal, cloth: el.dataset.v } });
      renderRoute();
      break;
    case 'reset-all':
      openSheet(`<h2 class="sheetTitle">Reset all progress?</h2><p class="muted">This clears stages, Ghost matches, bosses, calibration and rank on this device.</p><button type="button" class="bigBtn danger" data-action="reset-confirm">YES, RESET</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'reset' });
      break;
    case 'reset-confirm':
      state = derive(resetState());
      saveState(state);
      closeSheet();
      navigate('#home');
      break;
    default:
      break;
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && !el.disabled) {
    e.preventDefault();
    handleAction(el.dataset.action, el, e);
    return;
  }
  if (screen && screen.onTableTap && e.target.closest('.playTable')) {
    screen.onTableTap(e.target);
  }
});

window.addEventListener('hashchange', renderRoute);
renderRoute();
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});

window.PoolIQ = { getState: () => state, drills, getDrillById, commit, navigate, rerender };
export { drills, getDrillById };
