/**
 * Pool IQ — router / boot
 */
import { loadState, saveState, resetState } from './storage.js';
import {
  syncRank,
  evaluatePromotion,
  PROMOTION_TESTS,
  canAttemptPromotion
} from './career.js';
import { drills, getDrillById, isDrillUnlocked } from './drills.js';
import {
  startTraining,
  closeTraining,
  recordBinary,
  recordPosition,
  finishTraining,
  renderTrainingHTML,
  renderDrillCard,
  getActiveTraining
} from './training.js';
import {
  renderGhostLobby,
  renderGhostHTML,
  renderRacePicker,
  startGhost,
  closeGhost,
  ghostRack,
  undoLastRack,
  saveGhostMatch,
  getGhostSession
} from './ghost.js';
import { renderHome, renderStats, renderCareerPage, renderDrillsPage } from './dashboard.js';
import { renderAnalyzePage, bindAnalyzeHandlers } from './analyze.js';

let state = syncRank(loadState());
let page = 'home';
let promoSession = null; // { testId, stageIndex, stageScores[] }

function persist(next) {
  state = syncRank(next);
  saveState(state);
  return state;
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function render() {
  const home = $('#home');
  const career = $('#career');
  const drillsPage = $('#drills');
  const analyze = $('#analyze');
  const ghost = $('#ghost');
  const stats = $('#stats');

  if (home) home.innerHTML = renderHome(state);
  if (career) career.innerHTML = renderCareerPage(state);
  if (drillsPage) {
    drillsPage.innerHTML = renderDrillsPage(state);
    paintDrillList('all');
  }
  if (analyze) {
    analyze.innerHTML = renderAnalyzePage();
    bindAnalyzeHandlers(analyze);
  }
  if (ghost) ghost.innerHTML = renderGhostLobby(state);
  if (stats) stats.innerHTML = renderStats(state);

  document.querySelectorAll('nav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach((p) => {
    p.classList.toggle('active', p.id === page);
  });
}

function paintDrillList(cat) {
  const list = $('#drillList');
  if (!list) return;
  const items = cat === 'all' ? drills : drills.filter((d) => d.category === cat);
  list.innerHTML = items.map((d) => renderDrillCard(d, state)).join('');
}

function showPage(id) {
  page = id;
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('nav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === id);
  });
  window.scrollTo?.(0, 0);
  if (id === 'home') $('#home').innerHTML = renderHome(state);
  if (id === 'career') $('#career').innerHTML = renderCareerPage(state);
  if (id === 'drills') {
    $('#drills').innerHTML = renderDrillsPage(state);
    paintDrillList('all');
  }
  if (id === 'ghost') $('#ghost').innerHTML = renderGhostLobby(state);
  if (id === 'stats') $('#stats').innerHTML = renderStats(state);
  if (id === 'analyze') {
    $('#analyze').innerHTML = renderAnalyzePage();
    bindAnalyzeHandlers($('#analyze'));
  }
}

function openDrillModal(drillId) {
  const drill = getDrillById(drillId);
  if (!drill) return;
  if (!isDrillUnlocked(drill, state)) return;
  startTraining(drill, { mode: 'drill' });
  const modal = $('#drillModal');
  const body = $('#drillModalBody');
  body.innerHTML = renderTrainingHTML(state);
  modal.classList.add('show');
}

function refreshDrillModal() {
  const body = $('#drillModalBody');
  if (body && getActiveTraining()) body.innerHTML = renderTrainingHTML(state);
}

function openGhostModal() {
  const modal = $('#ghostModal');
  const body = $('#ghostModalBody');
  body.innerHTML = renderGhostHTML(state);
  modal.classList.add('show');
}

function refreshGhostModal() {
  const body = $('#ghostModalBody');
  if (body && getGhostSession()) body.innerHTML = renderGhostHTML(state);
}

function startPromotion(testId) {
  const test = PROMOTION_TESTS[testId];
  if (!test) return;
  if (!canAttemptPromotion(testId, state)) {
    alert('Finish the other requirements for this rank before taking the promotion test.');
    return;
  }
  promoSession = { testId, stageIndex: 0, stageScores: [] };
  launchPromoStage();
}

function launchPromoStage() {
  const test = PROMOTION_TESTS[promoSession.testId];
  const stage = test.stages[promoSession.stageIndex];
  const drill = getDrillById(stage.drillId);
  if (!drill) return;
  startTraining(
    {
      ...drill,
      name: `${test.name} · ${stage.name}`,
      purpose: `Promotion stage ${promoSession.stageIndex + 1} of ${test.stages.length}`,
      scoringType: stage.scoringType || drill.scoringType
    },
    {
      mode: 'promo-stage',
      attemptOverride: stage.attempts,
      passOverride: stage.passNeed,
      onComplete: ({ score }) => {
        promoSession.stageScores[promoSession.stageIndex] = score;
      }
    }
  );
  const modal = $('#drillModal');
  const body = $('#drillModalBody');
  body.innerHTML =
    renderTrainingHTML(state) +
    `<p class="promoNote muted">Promotion stage ${promoSession.stageIndex + 1} / ${test.stages.length}</p>`;
  modal.classList.add('show');
}

function afterPromoStageSaved(score) {
  const test = PROMOTION_TESTS[promoSession.testId];
  promoSession.stageScores[promoSession.stageIndex] = score;
  promoSession.stageIndex += 1;
  if (promoSession.stageIndex < test.stages.length) {
    launchPromoStage();
    return;
  }
  const result = evaluatePromotion(promoSession.testId, promoSession.stageScores, state);
  persist(result.state);
  closeTraining();
  $('#drillModal').classList.remove('show');
  const weak = result.weakStages?.length
    ? `Weak stages: ${result.weakStages.join(', ')}`
    : 'All stages cleared.';
  alert(result.passed ? `PROMOTION PASSED — ranked up!\n${weak}` : `PROMOTION FAILED\n${weak}`);
  promoSession = null;
  showPage('career');
}

function boot() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-page-jump], .chip');
    if (!t) return;

    if (t.dataset.page) {
      showPage(t.dataset.page);
      return;
    }
    if (t.dataset.pageJump) {
      showPage(t.dataset.pageJump);
      return;
    }

    if (t.classList.contains('chip') && t.dataset.cat) {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      t.classList.add('active');
      paintDrillList(t.dataset.cat);
      return;
    }

    if (t.dataset.start) {
      openDrillModal(t.dataset.start);
      return;
    }

    if (t.dataset.promo) {
      startPromotion(t.dataset.promo);
      return;
    }

    if (t.dataset.ghostStart) {
      const balls = Number(t.dataset.ghostStart);
      const picker = $('#ghostRacePicker');
      const body = $('#ghostRaceBody');
      if (picker && body) {
        body.innerHTML = renderRacePicker(balls);
        picker.classList.add('show');
      }
      return;
    }

    if (t.dataset.race) {
      const balls = Number(t.dataset.balls);
      const race = Number(t.dataset.race);
      $('#ghostRacePicker')?.classList.remove('show');
      startGhost({ balls, race });
      openGhostModal();
      return;
    }

    if (t.dataset.action === 'close-race') {
      $('#ghostRacePicker')?.classList.remove('show');
      return;
    }

    if (t.dataset.action === 'close') {
      closeTraining();
      promoSession = null;
      $('#drillModal').classList.remove('show');
      render();
      showPage(page);
      return;
    }
    if (t.dataset.action === 'miss') {
      recordBinary(false);
      refreshDrillModal();
      return;
    }
    if (t.dataset.action === 'hit') {
      recordBinary(true);
      refreshDrillModal();
      return;
    }
    if (t.dataset.outcome) {
      recordPosition(t.dataset.outcome);
      refreshDrillModal();
      return;
    }
    if (t.dataset.action === 'save') {
      const active = getActiveTraining();
      if (!active) return;
      if (active.mode === 'promo-stage') {
        const { score } = finishTraining(state);
        afterPromoStageSaved(score);
        return;
      }
      const { state: next } = finishTraining(state);
      persist(next);
      refreshDrillModal();
      return;
    }

    if (t.dataset.action === 'close-ghost') {
      closeGhost();
      $('#ghostModal').classList.remove('show');
      showPage('ghost');
      return;
    }
    if (t.dataset.ghost === 'W') {
      ghostRack('W');
      refreshGhostModal();
      return;
    }
    if (t.dataset.ghost === 'L') {
      ghostRack('L');
      refreshGhostModal();
      return;
    }
    if (t.dataset.ghost === 'undo') {
      undoLastRack();
      refreshGhostModal();
      return;
    }
    if (t.dataset.ghost === 'save') {
      const { state: next } = saveGhostMatch(state);
      persist(next);
      closeGhost();
      $('#ghostModal').classList.remove('show');
      showPage('ghost');
      return;
    }
  });

  $('#resetBtn')?.addEventListener('click', () => {
    if (confirm('Reset all Pool IQ progress (v3)?')) {
      state = resetState();
      saveState(state);
      location.reload();
    }
  });

  persist(state);
  render();
  showPage('home');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  window.PoolIQ = {
    getState: () => state,
    drills,
    getDrillById,
    persist,
    syncRank
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

export { drills, getDrillById };
