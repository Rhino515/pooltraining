/**
 * Pool IQ — hash router / boot.
 * Routes: #home #career #drills #analyze #arcade #profile (#stats alias) #settings
 *         #ghost[/balls/race] #ghostmatch #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id>
 *         #sim[/s=<code>|/target] (Shot Simulator) #drillnew[/fromsim] #drilledit/<id> (Create Drill)
 */
import { loadState, saveState, resetState, archiveUnknownDrills } from './storage.js';
import { syncRank } from './career.js';
import { withSkills } from './skills.js';
import { drills, getDrillById, allDrills } from './drills.js';
import { renderHome, renderCareerPage, renderDrillsPage, renderArcade, renderGameLobby, renderBossPage, renderProfile, renderSettings } from './dashboard.js';
import { renderAnalyzePage, bindAnalyzeHandlers } from './analyze.js';
import { renderGhostLobby, renderGhostMatch, newGhostSession, newEightSession, applyRack, applyUndo, applyBreak, setBreakMade, rulesSheetHTML, maxUnlockedBalls, matchOver } from './ghost.js';
import { createPlayScreen } from './ui/play.js';
import { createSimScreen } from './ui/simulator.js';
import { createDrillBuilder } from './ui/drillBuilder.js';
import { customDrills, refreshCustomDrills } from './drills.js';
import * as CD from './customDrills.js';
import { openSheet, closeSheet, toast, clearToast } from './ui/sheet.js';
import { getGame, getBoss, getStage } from './games/registry.js';
import { isStageUnlocked, isEndlessUnlocked, isGameUnlocked } from './games/engine.js';
import { isBossUnlocked } from './career.js';

function derive(s) {
  return syncRank(withSkills(s));
}

let state = derive(archiveUnknownDrills(loadState(), allDrills().map((d) => d.id)));
saveState(state);

let screen = null; // active play screen (has render/onAction)
let route = { name: 'home', args: [] };
const GHOST_PRESET_KEY = 'poolIQGhostPreset';
let ghostPreset = { balls: 3, race: 5, mode: 'rotation', level: 'beginner', group: 3 };
try { ghostPreset = { ...ghostPreset, ...JSON.parse(localStorage.getItem(GHOST_PRESET_KEY) || '{}') }; } catch { /* ignore */ }
function saveGhostPreset() { try { localStorage.setItem(GHOST_PRESET_KEY, JSON.stringify(ghostPreset)); } catch { /* ignore */ } }
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

const NAV_FOR = { sim: 'sim', drillnew: 'drills', drilledit: 'drills', home: 'home', career: 'career', drills: 'drills', analyze: 'analyze', arcade: 'arcade', game: 'arcade', ghost: 'arcade', ghostmatch: 'arcade', profile: 'profile', stats: 'profile', settings: 'profile', boss: 'career' };

function setChrome(playing, navName) {
  document.body.classList.toggle('playing', playing);
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('active', b.dataset.page === navName));
}

function renderRoute() {
  closeSheet();
  route = parseHash();
  const { name, args } = route;
  if (screen && screen.destroy) screen.destroy();
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
  } else if (name === 'sim') {
    screen = createSimScreen(ctx, args);
    screen.render();
    playing = true;
  } else if (name === 'drillnew' || name === 'drilledit') {
    const existing = name === 'drilledit' ? customDrills().find((d) => d.id === args[0]) : null;
    if (name === 'drilledit' && !existing) {
      toast('That custom drill no longer exists');
      v.innerHTML = renderDrillsPage(state, drillFilter);
    } else {
      const raw = existing ? CD.loadCustomDrills().find((d) => d.id === existing.id) || existing : null;
      screen = createDrillBuilder(ctx, { editId: existing ? existing.id : null, fromSim: args[0] === 'fromsim', existing: raw });
      screen.render();
      playing = true;
    }
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
    if (args[0] === 'eight') ghostPreset = { ...ghostPreset, mode: 'eight' };
    else if (args[0]) ghostPreset = { ...ghostPreset, mode: 'rotation', balls: Math.min(Number(args[0]) || 3, maxUnlockedBalls(state)), race: Number(args[1]) || 5 };
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
    case 'drill-create':
      navigate('#drillnew');
      break;
    case 'drill-edit':
      navigate(`#drilledit/${el.dataset.id}`);
      break;
    case 'drill-dup': {
      const c = CD.duplicateCustomDrill(el.dataset.id);
      refreshCustomDrills();
      if (c) toast(`Duplicated as “${c.name}”`);
      renderRoute();
      break;
    }
    case 'drill-del': {
      const d = customDrills().find((x) => x.id === el.dataset.id);
      if (d) openSheet(`<h2 class="sheetTitle">Delete “${escHTML(d.name)}”?</h2><p class="muted">The drill is removed from this device. Your past results stay in your history. Export it first if you might want it back.</p><button type="button" class="bigBtn danger" data-action="drill-del-do" data-id="${escHTML(d.id)}">DELETE DRILL</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'confirm' });
      break;
    }
    case 'drill-del-do':
      CD.deleteCustomDrill(el.dataset.id);
      refreshCustomDrills();
      if (state.activeSession?.gameId === 'drills' && state.activeSession.stageId === el.dataset.id) commit({ ...state, activeSession: null }, { silent: true });
      commit({ ...state });
      closeSheet();
      toast('Drill deleted');
      renderRoute();
      break;
    case 'drill-export': {
      const list = el.dataset.id ? CD.loadCustomDrills().filter((d) => d.id === el.dataset.id) : CD.loadCustomDrills();
      if (!list.length) { toast('No custom drills to export yet'); break; }
      const name = el.dataset.id ? `${list[0].name.replace(/[^\w-]+/g, '-').toLowerCase() || 'drill'}.pooliq-drill.json` : `pool-iq-drills-${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(name, CD.exportDrills(list));
      toast(el.dataset.id ? 'Drill exported as a JSON file' : `Exported ${list.length} drill${list.length > 1 ? 's' : ''}`);
      break;
    }
    case 'drill-import': {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.id = 'drillImportInput';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', async () => {
        const file = inp.files?.[0];
        inp.remove();
        if (!file) return;
        try {
          const existing = CD.loadCustomDrills();
          const out = CD.parseDrillImport(await file.text(), existing.map((d) => d.id));
          if (!out.drills.length) throw new Error('No drills found in that file.');
          CD.saveCustomDrills([...existing, ...out.drills]);
          refreshCustomDrills();
          toast(`Imported ${out.drills.length} drill${out.drills.length > 1 ? 's' : ''}${out.skipped ? ` (${out.skipped} skipped)` : ''}`);
          renderRoute();
        } catch (err) {
          toast(err.message || 'Import failed');
        }
      });
      inp.click();
      break;
    }
    case 'drill-history': {
      const d = getDrillById(el.dataset.id);
      const rec = state.games?.drills?.stages?.[el.dataset.id];
      const hist = (rec?.history || []).slice().reverse();
      openSheet(`<div class="eyebrow">HISTORY · PERSONAL BESTS</div><h2 class="sheetTitle">${escHTML(d?.name || 'Drill')}</h2>
        <div class="card stats"><div><b>${rec?.bestScore || 0}</b><span>BEST SCORE</span></div><div><b>${rec?.bestStars || 0}★</b><span>BEST STARS</span></div><div><b>${rec?.tries || 0}</b><span>SESSIONS</span></div></div>
        <div class="histList">${hist.length ? hist.map((h) => `<div class="historyRow"><span>${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><span>${h.score} pts${h.stars ? ` · ${'★'.repeat(h.stars)}` : ''}</span><b class="${h.passed ? 'green' : 'red'}">${h.passed ? 'PASSED' : 'not passed'}</b></div>`).join('') : '<p class="muted">No sessions yet — train it to start your history.</p>'}</div>
        <button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${escHTML(el.dataset.id)}">TRAIN</button>`, { id: 'history' });
      break;
    }
    case 'locked-stage':
      toast('Locked — pass the previous stage first');
      break;
    case 'drill-filter':
      drillFilter = el.dataset.v;
      renderRoute();
      break;
    case 'ghost-balls':
      ghostPreset.balls = Number(el.dataset.v);
      saveGhostPreset();
      renderRoute();
      break;
    case 'ghost-race':
      ghostPreset.race = Number(el.dataset.v);
      saveGhostPreset();
      renderRoute();
      break;
    case 'ghost-start': {
      clearToast();
      const balls = Math.min(ghostPreset.balls, maxUnlockedBalls(state));
      commit({ ...state, activeGhost: newGhostSession(balls, ghostPreset.race) }, { silent: true });
      navigate('#ghostmatch');
      break;
    }
    case 'ghost-mode':
      ghostPreset.mode = el.dataset.v === 'eight' ? 'eight' : 'rotation';
      saveGhostPreset();
      renderRoute();
      break;
    case 'ghost-level':
      ghostPreset.level = el.dataset.v;
      saveGhostPreset();
      renderRoute();
      break;
    case 'ghost-group':
      ghostPreset.group = Number(el.dataset.v);
      saveGhostPreset();
      renderRoute();
      break;
    case 'ghost-start8':
      clearToast();
      commit({ ...state, activeGhost: newEightSession(ghostPreset.level, ghostPreset.race, ghostPreset.group) }, { silent: true });
      navigate('#ghostmatch');
      break;
    case 'ghost-rules':
      if (state.activeGhost) openSheet(rulesSheetHTML(state.activeGhost), { id: 'rules' });
      break;
    case 'ghost-bmade': {
      const out = setBreakMade(state, state.activeGhost, Number(el.dataset.v));
      commit(out.state, { silent: true });
      renderRoute();
      break;
    }
    case 'ghost-break': {
      const out = applyBreak(state, state.activeGhost, el.dataset.v);
      commit(out.state);
      if (el.dataset.v === 'eight') toast('8 on the break — your rack');
      else if (el.dataset.v === 'scratch') toast('Scratch on the break — ball in hand, no penalty');
      else toast('Ball in hand — run out');
      if (out.ended) toast(out.match.won ? 'Match won — saved' : 'Ghost wins — match saved');
      renderRoute();
      break;
    }
    case 'ghost-again': {
      clearToast();
      const g = state.activeGhost;
      commit({ ...state, activeGhost: g.mode === 'eight' ? newEightSession(g.level, g.race, g.group) : newGhostSession(g.balls, g.race) }, { silent: true });
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
      toast('Last step undone');
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

function escHTML(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function downloadFile(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});

window.PoolIQ = { getState: () => state, drills, getDrillById, allDrills, commit, navigate, rerender, get screen() { return screen; } };
export { drills, getDrillById };
