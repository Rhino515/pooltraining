/**
 * Pool IQ — hash router / boot.
 * Routes: #home #career #drills #analyze #arcade #profile (#stats alias) #settings
 *         #ghost[/balls/race] #ghostmatch #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id>
 *         #sim[/s=<code>|/target] (Shot Simulator) #drillnew[/fromsim] #drilledit/<id> (Create Drill)
 *         #content (My Content) #cimport (import error) #cview/<ref> #cplay/<ref>[/<stage>] #cedit/<uid>[/<loc>]  (.pooliq content, ui/content.js)
 */
import { loadState, saveState, resetState, archiveUnknownDrills, onDataWrite, lsSet, idbAdapter } from './storage.js';
import * as V from './vault.js';
import { initInstall, installMode, promptInstall, installSheetHTML, isIOS, isAndroid } from './install.js';
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
import * as C from './ui/content.js';
import * as CS from './content/store.js';

function derive(s) {
  return syncRank(withSkills(s));
}

let state = null; // set in boot() after the storage vault has reconciled localStorage with IndexedDB
const vault = V.createVault({ kv: localStorage, idb: idbAdapter });
const FLASH_KEY = 'poolIQFlash';
const DAY = 86400000;

let screen = null; // active play screen (has render/onAction)
let route = { name: 'home', args: [] };
const GHOST_PRESET_KEY = 'poolIQGhostPreset';
let ghostPreset = { balls: 3, race: 5, mode: 'rotation', level: 'beginner', group: 3 };
function loadGhostPreset() { try { ghostPreset = { ...ghostPreset, ...JSON.parse(localStorage.getItem(GHOST_PRESET_KEY) || '{}') }; } catch { /* ignore */ } }
function saveGhostPreset() { lsSet(GHOST_PRESET_KEY, JSON.stringify(ghostPreset)); }
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

const NAV_FOR = { content: 'drills', cimport: 'drills', cview: 'drills', cplay: 'drills', cedit: 'drills', sim: 'sim', drillnew: 'drills', drilledit: 'drills', home: 'home', career: 'career', drills: 'drills', analyze: 'analyze', arcade: 'arcade', game: 'arcade', ghost: 'arcade', ghostmatch: 'arcade', profile: 'profile', stats: 'profile', settings: 'profile', boss: 'career' };

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
  } else if (name === 'content') v.innerHTML = C.contentHubHTML();
  else if (name === 'cimport') v.innerHTML = C.importErrorHTML();
  else if (name === 'cview') {
    screen = C.createContentView(ctx, args[0]);
    if (screen) screen.render();
    else {
      toast(args[0] === 'pending' ? 'Nothing to preview — import a .pooliq file first' : 'That item is no longer in My Content');
      v.innerHTML = C.contentHubHTML();
    }
  } else if (name === 'cplay') {
    const out = C.createContentPlay(ctx, args[0], args[1]);
    if (out.error) {
      toast(out.error);
      if (out.redirect) { location.replace(out.redirect); return; }
      v.innerHTML = C.contentHubHTML();
    } else {
      screen = out;
      screen.render();
      playing = true;
    }
  } else if (name === 'cedit') {
    const it = CS.getItem(args[0]);
    if (!it) {
      toast('That item is no longer in My Content');
      v.innerHTML = C.contentHubHTML();
    } else {
      const single = it.doc.contentType === 'drill' || it.doc.contentType === 'challenge';
      const loc = args[1] ? C.decodeLoc(args[1]) : single ? [] : null;
      const item = loc ? C.itemAt(it.doc, loc) : null;
      if (loc && item && item.shot) {
        screen = createDrillBuilder(ctx, { content: { uid: it.uid, loc, doc: it.doc, item } });
        screen.render();
        playing = true;
      } else v.innerHTML = C.editListHTML(it.uid);
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
  else if (name === 'settings') {
    v.innerHTML = renderSettings(state, settingsInfo());
    fillSettings();
  }
  else if (name === 'ghost') {
    if (args[0] === 'eight') ghostPreset = { ...ghostPreset, mode: 'eight' };
    else if (args[0]) ghostPreset = { ...ghostPreset, mode: 'rotation', balls: Math.min(Number(args[0]) || 3, maxUnlockedBalls(state)), race: Number(args[1]) || 5 };
    v.innerHTML = renderGhostLobby(state, ghostPreset);
  } else if (name === 'ghostmatch') {
    v.innerHTML = renderGhostMatch(state);
    playing = !!state.activeGhost;
  } else v.innerHTML = renderHome(state, homeExtras());
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
  if (action.startsWith('c-') && C.contentAction(action, el, e, ctx)) return;
  switch (action) {
    case 'ce-save-meta': {
      const out = C.saveMetaFromForm(el.dataset.uid);
      if (out.error) {
        const m = document.getElementById('ceMsgs');
        if (m) m.innerHTML = out.error.split('\n').map((x) => `<p class="err">• ${escHTML(x)}</p>`).join('');
        if (m) m.classList.add('show');
        toast('Not saved — please fix the details');
      } else {
        toast('Details saved');
        renderRoute();
      }
      break;
    }
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
      openSheet(`<div class="eyebrow">STEP 1 OF 2</div><h2 class="sheetTitle">Reset all progress?</h2><p class="muted">This clears stages, Ghost matches, bosses, calibration and rank on this device. Custom drills and saved simulator shots are kept.</p><div class="warnBox">A snapshot of your current data is saved first — you can undo this from Settings → <b>Restore previous snapshot</b>. For a copy off this phone, tap <b>Back Up Now</b> first.</div><button type="button" class="bigBtn danger" data-action="reset-step2">CONTINUE</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'reset' });
      break;
    case 'reset-step2':
      openSheet(`<div class="eyebrow">STEP 2 OF 2</div><h2 class="sheetTitle">Type RESET to confirm</h2><p class="muted small">This can't be undone except from a snapshot or backup.</p><input id="resetType" class="typeConfirm" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="RESET" aria-label="Type RESET to confirm"/><button type="button" id="resetGo" class="bigBtn danger" data-action="reset-confirm" disabled>RESET EVERYTHING</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'reset2' });
      break;
    case 'reset-confirm': {
      if ((document.getElementById('resetType')?.value || '').trim().toUpperCase() !== 'RESET') break;
      el.disabled = true;
      (async () => {
        await vault.snapshot('Before reset');
        vault.markIntent();
        state = derive(resetState());
        saveState(state);
        await vault.flush().catch(() => {});
        closeSheet();
        navigate('#home');
        toast('Progress reset — a snapshot was saved in Settings');
      })();
      break;
    }
    case 'backup-now':
      backupNow(false);
      break;
    case 'backup-download':
      backupNow(true);
      break;
    case 'nudge-dismiss':
      V.writeMeta(localStorage, { ...V.readMeta(localStorage), nudgeDismissedAt: Date.now() });
      renderRoute();
      break;
    case 'install-dismiss':
      V.writeMeta(localStorage, { ...V.readMeta(localStorage), installDismissedAt: Date.now() });
      renderRoute();
      break;
    case 'install-app':
      if (installMode() === 'prompt') {
        promptInstall().then((r) => { toast(r === 'accepted' ? 'Installing Pool IQ…' : 'Install cancelled'); if (route.name === 'home' || route.name === 'settings') renderRoute(); });
      } else openSheet(installSheetHTML(), { id: 'install' });
      break;
    case 'snap-list':
      showSnapshots();
      break;
    case 'snap-pick': {
      const snap = snapCache.find((x) => x.id === el.dataset.id);
      if (snap) openSheet(`<div class="eyebrow">RESTORE SNAPSHOT</div><h2 class="sheetTitle">Go back to ${escHTML(fmtWhen(snap.takenAt))}?</h2>${summaryGridHTML(snap.summary)}<div class="warnBox">This <b>replaces</b> your current data with the snapshot. Your current data is snapshotted first, so this can be undone too.</div><button type="button" class="bigBtn danger" data-action="snap-restore-do" data-id="${escHTML(snap.id)}">RESTORE THIS SNAPSHOT</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'snap-confirm' });
      break;
    }
    case 'snap-restore-do': {
      const snap = snapCache.find((x) => x.id === el.dataset.id);
      if (!snap) break;
      el.disabled = true;
      replaceAndReload(snap.keys, 'Before snapshot restore', `Snapshot from ${fmtWhen(snap.takenAt)} restored`);
      break;
    }
    case 'restore-do':
      if (!pendingRestore) break;
      el.disabled = true;
      replaceAndReload(pendingRestore.keys, 'Before restore', 'Backup restored — your previous data is saved as a snapshot');
      break;
    default:
      break;
  }
}

document.addEventListener('click', (e) => {
  if (!state) return; // still booting (vault reconcile)
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

// ------------------------------------------------------------------------------ data safety
let snapCache = [];
let pendingRestore = null;
const fmtWhen = (t) => { const d = new Date(t); return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`; };
function fmtBytes(n) {
  if (!Number.isFinite(n)) return '?';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(1)} GB`;
}
function canShareFiles() {
  try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File(['{}'], 'PoolIQ-backup.json', { type: 'application/json' })] })); } catch { return false; }
}
function homeExtras() {
  const meta = V.readMeta(localStorage);
  const sum = V.summarize(V.localBundle(localStorage).keys);
  const mode = installMode();
  return {
    nudge: V.nudgeDue(meta, sum) ? { lastText: V.daysAgoText(meta.lastBackupAt) } : null,
    install: (mode === 'prompt' || mode === 'ios') && !(meta.installDismissedAt && Date.now() - meta.installDismissedAt < 30 * DAY) ? mode : null
  };
}
function settingsInfo() {
  const meta = V.readMeta(localStorage);
  return {
    persist: meta.persist?.state || 'checking',
    lastBackupAt: meta.lastBackupAt || 0,
    lastBackupText: V.daysAgoText(meta.lastBackupAt),
    backupStale: !meta.lastBackupAt || Date.now() - meta.lastBackupAt > V.NUDGE_DAYS * DAY,
    install: installMode(),
    canShare: canShareFiles(),
    ios: isIOS(),
    android: isAndroid()
  };
}
const PERSIST_TEXT = { on: 'ON ✓', off: 'OFF', unsupported: 'not supported' };
function setPersist(st) {
  V.writeMeta(localStorage, { ...V.readMeta(localStorage), persist: { state: st, at: Date.now() } });
  const el = document.querySelector('[data-persist]');
  if (el) { el.dataset.persist = st; el.textContent = PERSIST_TEXT[st]; el.className = st === 'on' ? 'green' : st === 'off' ? 'amber' : ''; }
  return st;
}
/** navigator.storage.persist(): asks the browser not to evict our storage (Chrome/Android grant it silently for engaged or installed apps; Safari 17+) */
async function checkPersist(request) {
  const S = navigator.storage;
  if (!S || typeof S.persist !== 'function' || typeof S.persisted !== 'function') return setPersist('unsupported');
  let on = false;
  try { on = await S.persisted(); } catch { on = false; }
  if (!on && request) { try { on = await S.persist(); } catch { on = false; } }
  return setPersist(on ? 'on' : 'off');
}
async function fillSettings() {
  checkPersist(false);
  const est = document.querySelector('[data-estimate]');
  if (est) {
    try {
      const e = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
      est.textContent = e && Number.isFinite(e.usage) ? `${fmtBytes(e.usage)}${e.quota ? ` of ${fmtBytes(e.quota)}` : ''}` : 'not available';
    } catch { est.textContent = 'not available'; }
  }
  await vault.flush().catch(() => {}); // make sure the safety copy reflects the latest save before reporting it
  const [mir, snaps] = await Promise.all([vault.getMirror(), vault.snapshots()]);
  const m = document.querySelector('[data-mirror]');
  if (m) {
    const ok = V.health(mir).valid;
    m.textContent = ok ? `on · updated ${mir.mirroredAt && Date.now() - mir.mirroredAt < 60000 ? 'just now' : fmtWhen(mir.mirroredAt || mir.savedAt)}` : 'not available';
    m.className = ok ? 'green' : 'amber';
    m.dataset.mirror = ok ? 'on' : 'off';
  }
  const sc = document.querySelector('[data-snapcount]');
  if (sc) { sc.textContent = `(${snaps.length})`; sc.dataset.snapcount = String(snaps.length); }
}
function summaryGridHTML(s) {
  return `<div class="summaryGrid" data-summary><div class="rankCell"><b>${escHTML(s.rank)}</b><span>RANK · ${s.xp} XP</span></div><div><b>${s.sessions}</b><span>SESSIONS</span></div><div><b>${s.matches}</b><span>GHOST GAMES</span></div><div><b>${s.drills}</b><span>MY DRILLS</span></div><div><b>${s.shots}</b><span>SAVED SHOTS</span></div><div><b>${s.content || 0}</b><span>MY CONTENT</span></div></div>`;
}
function backupPayload(now = new Date()) {
  const obj = V.buildBackup(localStorage, { now: now.getTime() });
  return { name: V.backupFilename(now), text: JSON.stringify(obj, null, 2), obj };
}
function markBackedUp(how) {
  V.writeMeta(localStorage, { ...V.readMeta(localStorage), lastBackupAt: Date.now(), lastBackupHow: how });
  vault.schedule();
  if (route.name === 'settings' || route.name === 'home') renderRoute();
}
/** One JSON file with everything: iPhone share sheet (Save to Files / iCloud Drive), Android share or Downloads, else a download */
function backupNow(forceDownload) {
  const { name, text } = backupPayload();
  const file = typeof File === 'function' ? new File([text], name, { type: 'application/json' }) : null;
  let share = false;
  try { share = !forceDownload && !!file && !!navigator.share && !!navigator.canShare && navigator.canShare({ files: [file] }); } catch { share = false; }
  if (share) {
    navigator.share({ files: [file], title: 'Pool IQ backup', text: `Pool IQ backup · ${new Date().toLocaleDateString()}` })
      .then(() => { markBackedUp('share'); toast('Backup saved'); })
      .catch((err) => {
        if (err && err.name === 'AbortError') { toast('Backup not saved — share was cancelled'); return; }
        downloadFile(name, text);
        markBackedUp('download');
        toast(`Backup downloaded: ${name}`);
      });
    return;
  }
  downloadFile(name, text);
  markBackedUp('download');
  toast(`Backup downloaded: ${name}`);
}
async function showSnapshots() {
  snapCache = await vault.snapshots();
  const rows = snapCache.map((s) => `<div class="snapRow" data-snap="${escHTML(s.id)}"><div><b>${escHTML(fmtWhen(s.takenAt))}</b><small>${escHTML(s.reason)} · ${escHTML(V.summaryLine(s.summary || V.summarize(s.keys)))}</small></div><button type="button" class="miniAct" data-action="snap-pick" data-id="${escHTML(s.id)}">RESTORE</button></div>`).join('');
  openSheet(`<div class="eyebrow">SNAPSHOTS ON THIS DEVICE</div><h2 class="sheetTitle">Restore previous snapshot</h2><p class="muted small">Pool IQ keeps the last ${V.MAX_SNAPSHOTS} snapshots: one every few hours of use, plus one right before any reset or restore.</p>${rows || '<p class="muted" data-snap-empty>No snapshots yet — one is taken automatically once you have some progress.</p>'}<button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`, { id: 'snapshots' });
}
async function replaceAndReload(keys, reason, flash) {
  try {
    await vault.replaceAll(keys, reason);
    try { sessionStorage.setItem(FLASH_KEY, flash); } catch { /* ignore */ }
    location.reload();
  } catch (err) {
    toast(`Restore failed: ${err.message || err}`);
  }
}
/* IMPORT CONTENT: the <input type=file data-content-input> inside the button label (native iOS / Android file picker) */
document.addEventListener('change', (e) => {
  const inp = e.target && e.target.closest ? e.target.closest('[data-content-input]') : null;
  if (!inp) return;
  const file = inp.files && inp.files[0];
  if (file) C.handleContentFile(file, ctx).finally(() => { inp.value = ''; });
});
document.addEventListener('change', async (e) => {
  const inp = e.target && e.target.closest ? e.target.closest('[data-restore-input]') : null;
  if (!inp) return;
  const file = inp.files && inp.files[0];
  inp.value = '';
  if (!file) return;
  try {
    if (file.size > 25 * 1048576) throw new Error('That file is too large to be a Pool IQ backup.');
    const parsed = V.parseBackup(await file.text());
    pendingRestore = parsed;
    const when = parsed.exportedAt ? fmtWhen(Date.parse(parsed.exportedAt)) : 'unknown date';
    openSheet(`<div class="eyebrow">RESTORE FROM BACKUP</div><h2 class="sheetTitle">Restore this backup?</h2><p class="muted small" data-restore-file>${escHTML(file.name)} · saved ${escHTML(when)}${parsed.appVersion ? ` · Pool IQ v${escHTML(parsed.appVersion)}` : ''}${parsed.legacy ? ' · older save format (will be upgraded)' : ''}${parsed.newer ? ' · made by a newer Pool IQ' : ''}</p>${summaryGridHTML(parsed.summary)}<div class="warnBox">This <b>replaces</b> everything on this device with the backup. Your current data is snapshotted first — undo any time from Settings → <b>Restore previous snapshot</b>.</div><button type="button" class="bigBtn danger" data-action="restore-do">RESTORE (REPLACE MY DATA)</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'restore' });
  } catch (err) {
    pendingRestore = null;
    openSheet(`<div class="eyebrow">RESTORE FROM BACKUP</div><h2 class="sheetTitle">Can't use that file</h2><p class="muted" data-restore-error>${escHTML(err.message || 'That file is not a Pool IQ backup.')}</p><p class="muted small">Pick a file named like PoolIQ-backup-YYYY-MM-DD.json. Nothing on this device was changed.</p><button type="button" class="bigBtn alt" data-action="sheet-close">OK</button>`, { id: 'restore-error' });
  }
});
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'resetType') {
    const b = document.getElementById('resetGo');
    if (b) b.disabled = e.target.value.trim().toUpperCase() !== 'RESET';
  }
});

// ------------------------------------------------------------------------------ boot
async function boot() {
  let rec = null;
  try { rec = await vault.reconcile(); } catch (e) { console.warn('Pool IQ vault reconcile failed', e); }
  onDataWrite(() => vault.touch());
  refreshCustomDrills();
  state = derive(archiveUnknownDrills(loadState(), allDrills().map((d) => d.id)));
  saveState(state);
  loadGhostPreset();
  initInstall(() => { if ((route.name === 'home' || route.name === 'settings') && !document.querySelector('#sheet.show')) renderRoute(); });
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
  document.documentElement.dataset.ready = '1';
  window.PoolIQ.boot = rec;
  // Installed PWA opened with a .pooliq file (manifest file_handlers, Chromium) → the same validate → preview flow
  if ('launchQueue' in window) {
    try {
      window.launchQueue.setConsumer(async (params) => {
        const h = params && params.files && params.files[0];
        if (h) C.handleContentFile(await h.getFile(), ctx);
      });
    } catch { /* ignore */ }
  }
  let flash = null;
  try { flash = sessionStorage.getItem(FLASH_KEY); sessionStorage.removeItem(FLASH_KEY); } catch { /* ignore */ }
  if (flash) toast(flash);
  else if (rec && rec.pick === 'remote' && V.isMeaningful(V.localBundle(localStorage).keys)) toast('Your data was restored from the on-device safety copy');
  checkPersist(true).then((st) => {
    if (st === 'off') window.addEventListener('pointerdown', () => checkPersist(true), { once: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') vault.flush().catch(() => {}); });
  window.addEventListener('pagehide', () => { vault.flush().catch(() => {}); });
}

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
});

window.PoolIQ = { getState: () => state, drills, getDrillById, allDrills, commit, navigate, rerender, vault, V, backupPayload, installMode, get screen() { return screen; }, content: { store: CS, getPending: C.getPending, processImport: (text, name) => C.processImport(text, name || 'test.pooliq', ctx) } };
boot();
export { drills, getDrillById };
