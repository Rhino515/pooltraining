/**
 * Training mode — attempt scoring UI for drills and promotion stages.
 */
import { renderTableDiagram } from './tableDiagram.js';
import {
  scoreBinaryAttempt,
  scorePositionAttempt,
  applyDrillSession
} from './storage.js';
import { isDrillUnlocked } from './drills.js';

let active = null; // { drill, attempts[], mode: 'drill'|'promo-stage', onComplete }

export function getActiveTraining() {
  return active;
}

export function startTraining(drill, { mode = 'drill', onComplete = null, attemptOverride = null, passOverride = null } = {}) {
  active = {
    drill: {
      ...drill,
      attempts: attemptOverride ?? drill.attempts,
      passNeed: passOverride ?? drill.passNeed
    },
    baseDrill: drill,
    attemptLog: [],
    mode,
    onComplete,
    finished: false,
    resultSummary: null
  };
  return active;
}

export function closeTraining() {
  active = null;
}

export function recordBinary(success) {
  if (!active || active.finished) return;
  active.attemptLog.push(scoreBinaryAttempt(success));
  maybeAutoFinish();
}

export function recordPosition(outcome) {
  if (!active || active.finished) return;
  active.attemptLog.push(scorePositionAttempt(outcome));
  maybeAutoFinish();
}

function maybeAutoFinish() {
  if (active.attemptLog.length >= active.drill.attempts) {
    // wait for explicit save in UI — mark ready
    active.readyToSave = true;
  }
}

export function finishTraining(state) {
  if (!active) return { state, error: 'no-active' };
  const drill = active.drill;
  const values = active.attemptLog;
  while (values.length < drill.attempts) values.push(0);
  if (active.mode === 'drill') {
    const { state: next, score, passed, firstPass } = applyDrillSession(state, active.baseDrill, values);
    active.finished = true;
    active.resultSummary = { score, max: drill.attempts, passed, firstPass, passNeed: drill.passNeed };
    if (active.onComplete) active.onComplete({ score, passed, firstPass, values });
    return { state: next, ...active.resultSummary };
  }
  // promo stage — just return score
  const score = values.reduce((a, b) => a + b, 0);
  const passed = score >= drill.passNeed;
  active.finished = true;
  active.resultSummary = { score, max: drill.attempts, passed, firstPass: false, passNeed: drill.passNeed };
  if (active.onComplete) active.onComplete({ score, passed, values });
  return { state, ...active.resultSummary };
}

export function renderTrainingHTML(state) {
  if (!active) return '';
  const d = active.drill;
  const base = active.baseDrill;
  const log = active.attemptLog;
  const n = d.attempts;
  const current = Math.min(log.length + 1, n);
  const scoring = d.scoringType || 'binary';
  const old = state.results[base.id];
  const diagram = renderTableDiagram(base.diagram || { balls: [] }, {
    compact: false,
    className: 'table-diagram large'
  });

  const dots = Array.from({ length: n }, (_, i) => {
    const v = log[i];
    let cls = '';
    if (v === 1) cls = 'hit';
    else if (v === 0.5) cls = 'partial';
    else if (v === 0 && i < log.length) cls = 'miss';
    const label = v === 1 ? '✓' : v === 0.5 ? '½' : v === 0 && i < log.length ? '✕' : String(i + 1);
    return `<i class="${cls}">${label}</i>`;
  }).join('');

  let scoreBtns = '';
  if (!active.finished && log.length < n) {
    if (scoring === 'position') {
      const outcomes = d.outcomes || [
        { id: 'zone', label: 'SUCCESS — IN TARGET ZONE' },
        { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION' },
        { id: 'miss', label: 'MISSED SHOT' }
      ];
      scoreBtns = `<div class="scoreBtns positionBtns">
        <button class="hitBtn" data-outcome="zone">${outcomes[0]?.label || 'IN ZONE'}</button>
        <button class="partialBtn" data-outcome="pocketed">${outcomes[1]?.label || 'POCKETED / PARTIAL'}</button>
        <button class="missBtn" data-outcome="miss">${outcomes[2]?.label || 'MISS'}</button>
      </div>`;
    } else {
      scoreBtns = `<div class="scoreBtns">
        <button class="missBtn" data-action="miss">✕ MISS</button>
        <button class="hitBtn" data-action="hit">✓ SUCCESS</button>
      </div>`;
    }
  } else if (!active.finished && log.length >= n) {
    const score = log.reduce((a, b) => a + b, 0);
    scoreBtns = `<button class="saveScore" data-action="save">Save ${formatScore(score)}/${n} Result</button>`;
  }

  let resultBlock = '';
  if (active.finished && active.resultSummary) {
    const r = active.resultSummary;
    const ok = r.passed;
    resultBlock = `<div class="sessionResult ${ok ? 'pass' : 'fail'}">
      <h2>${ok ? 'PASSED' : 'FAILED'}</h2>
      <p>Score <b>${formatScore(r.score)}</b> / ${r.max} · Need ${r.passNeed}</p>
      <p class="muted">${ok ? (r.firstPass ? `+${base.xp || 100} XP · Personal best unlocked` : 'Requirement already satisfied · small XP') : 'No unlock this session — train again.'}</p>
    </div>`;
  }

  const history = renderDrillHistory(old, n);

  return `
    <button class="close" data-action="close" aria-label="Close">×</button>
    <span class="eyebrow">${base.category || 'TRAINING'} · DIFF ${base.difficulty || '?'}/10</span>
    <h1>${base.name}</h1>
    <div class="diagramWrap">${diagram}</div>
    <p class="goal"><b>Goal:</b> ${base.purpose || ''}</p>
    <p class="instructions"><b>Setup:</b> ${base.setup || ''}</p>
    <p class="instructions">${base.instructions || ''}</p>
    <div class="tip">🎯 ${base.tip || ''}</div>
    <div class="scoreHead">
      <b>Attempt ${active.finished ? n : current} / ${n}</b>
      <span>Pass: ${d.passNeed}/${n}${scoring === 'position' ? ' (weighted)' : ''}</span>
    </div>
    <div class="attemptDots" style="grid-template-columns:repeat(${Math.min(n, 12)},1fr)">${dots}</div>
    ${scoreBtns}
    ${resultBlock}
    ${history}
  `;
}

function formatScore(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

export function renderDrillHistory(result, maxAttempts) {
  if (!result) return `<p class="best muted">No history yet — first session.</p>`;
  const sessions = (result.sessions || []).slice().reverse().slice(0, 5);
  const sessHTML = sessions.length
    ? `<div class="history compact">${sessions
        .map((s) => {
          const d = new Date(s.date);
          const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return `<div class="historyRow"><span>${label}</span><b class="${s.passed ? 'green' : 'red'}">${formatScore(s.score)}/${s.max}</b></div>`;
        })
        .join('')}</div>`
    : '';
  return `<div class="drillHistoryMeta">
    <p class="best">Best <b>${formatScore(result.best)}/${maxAttempts}</b> · Last <b>${formatScore(result.last)}</b> · Attempts <b>${result.tries}</b> · ${result.passed ? '<span class="green">PASSED</span>' : '<span class="red">NOT PASSED</span>'}</p>
    ${sessHTML}
  </div>`;
}

export function renderDrillCard(drill, state, { onStart } = {}) {
  const unlocked = isDrillUnlocked(drill, state);
  const res = state.results[drill.id];
  const mini = renderTableDiagram(drill.diagram || { balls: [] }, {
    compact: true,
    className: 'table-diagram mini'
  });
  return `<article class="drill card ${unlocked ? '' : 'locked'}" data-drill="${drill.id}">
    <div class="diagramWrap mini">${mini}</div>
    <span class="tag">${drill.category} · D${drill.difficulty}</span>
    <h3>${drill.name}</h3>
    <p>${drill.purpose}</p>
    ${res ? `<div class="result ${res.passed ? 'green' : 'red'}">Best ${formatScore(res.best)}/${drill.attempts} · ${res.passed ? 'PASSED' : 'KEEP TRAINING'} · ${res.tries} tries</div>` : '<div class="result muted">Not attempted</div>'}
    ${unlocked
      ? `<button type="button" data-start="${drill.id}">${res?.passed ? 'Practice Again' : 'Start Drill'}</button>`
      : `<button type="button" disabled>🔒 Pass prerequisites first</button>`}
  </article>`;
}

export { scoreBinaryAttempt, scorePositionAttempt };
