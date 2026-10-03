/**
 * Play screen for Billiard University Exam I drills.
 * Scores the printed exam (progressive practice or fixed attempts). Does not add Career Rank XP.
 * Exam-mode finishes are stored on state.buExam. A category session records a drill result only.
 */
import { renderStageTable } from '../games/stageTable.js';
import { getDrillById, displayDrillTitle } from '../drills.js';
import { drillEditorAllowed, drillLink } from '../drills/ownerEdits.js';
import { awardSession } from '../progression/sessions.js';
import {
  applyShot, stopEarly, undoRun, present, statusLine, shotButtons, buMeta, newRun, withExamScore, examInstructions, BU_CREDIT
} from '../content/buExam.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createBuPlay(ctx, { id, exam = false } = {}) {
  const base = getDrillById(id);
  if (!base?.buExam) {
    return { render() { ctx.root.innerHTML = ''; }, onAction() { return false; }, destroy() {} };
  }
  let run = newRun(id);
  let mirror = false;
  let saved = false;
  let alive = true;

  function finish() {
    if (saved || !run.done) return;
    saved = true;
    const meta = buMeta(id);
    const score = Math.max(0, Math.min(meta.max, Number(run.score) || 0));
    let state = ctx.getState();
    const games = { ...(state.games || {}) };
    const gs = games.drills || { stages: {}, pb: {}, sessions: [] };
    const stages = { ...(gs.stages || {}) };
    const old = stages[id] || { tries: 0, passed: false, bestScore: 0, bestStars: 0, history: [] };
    const now = new Date().toISOString();
    stages[id] = {
      ...old,
      tries: (old.tries || 0) + 1,
      passed: old.passed || score > 0,
      bestScore: Math.max(old.bestScore || 0, score),
      bestStars: old.bestStars || 0,
      lastScore: score,
      lastPassed: score > 0,
      lastDate: now,
      firstPassDate: old.firstPassDate || (score > 0 ? now : null),
      history: [...(old.history || []), { date: now, score, passed: score > 0, stars: 0, bu: true, exam: !!exam }].slice(-20)
    };
    games.drills = {
      ...gs,
      stages,
      pb: { ...(gs.pb || {}) },
      sessions: [...(gs.sessions || []), { stageId: id, date: now, score, passed: score > 0, stars: 0, attempts: run.shots || 0 }].slice(-100)
    };
    state = { ...state, games, activeSession: null };
    const drill = getDrillById(id);
    const session = { gameId: 'drills', stageId: id, attempts: [], startedAt: now };
    const aw = awardSession(state, session, drill, { passed: score > 0, score, maxScore: meta.max });
    state = aw.state;
    if (exam) state = withExamScore(state, id, score, meta.max);
    ctx.commit(state);
  }

  function render() {
    if (!alive) return;
    const ch = present(base, run, mirror);
    const meta = buMeta(id);
    const buttons = shotButtons(id);
    const edit = drillEditorAllowed() ? `<button type="button" class="phEdit" data-owner-edit="1" data-action="go" data-href="#drillfix/${esc(id)}">EDIT</button>` : '';
    const link = drillLink(base.attribution?.sourceURL);
    const done = run.done;
    const score = done ? (run.score ?? 0) : null;
    const next = exam && meta.next ? `#play/drills/${meta.next}/exam` : '';
    const actions = done
      ? `<p class="buScoreLine">Score ${score} / ${meta.max}</p>
         ${exam && next ? `<button type="button" class="bigBtn" data-action="go" data-href="${next}">NEXT DRILL</button>` : ''}
         ${exam && !next ? `<button type="button" class="bigBtn" data-action="go" data-href="#buexam">EXAM LIST</button>` : ''}
         <button type="button" class="bigBtn alt" data-action="bu-again">RUN AGAIN</button>`
      : `<div class="buBar">
           <button type="button" class="bigBtn" data-action="bu-hit" data-ok="1">${esc(buttons[0])}</button>
           <button type="button" class="bigBtn alt" data-action="bu-hit" data-ok="0">${esc(buttons[1])}</button>
         </div>
         ${run.guaranteed ? '<button type="button" class="bigBtn alt" data-action="bu-stop">STOP — SCORE IS 10</button>' : ''}
         <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO LAST SHOT</button>`;
    ctx.root.innerHTML = `<div class="playScreen buPlay" data-bu="${esc(id)}" data-exam="${exam ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button>
        <div class="phTitle"><small>${exam ? 'EXAM I – FUNDAMENTALS' : esc(displayDrillTitle(base.category))}</small><b>${esc(base.name)}</b></div>
        <div class="phStatus">${edit}<button type="button" class="phEdit" data-action="bu-flip">${mirror ? 'THIS SIDE' : 'OTHER SIDE'}</button></div>
      </div>
      <div class="diagramWrap">${renderStageTable(ch, { className: 'table-diagram', showCuePath: false, showAim: false, showObPath: false, showZones: false })}</div>
      <p class="buStatus">${esc(statusLine(id, run))}</p>
      ${actions}
      ${link ? `<a class="drillLink" data-drill-link href="${esc(link)}" target="_blank" rel="noopener noreferrer nofollow"><small>Source</small><b>billiarduniversity.org</b></a>` : ''}
      <details class="card buHowCard" open>
        <summary>Instructions</summary>
        <pre class="buHow">${esc(examInstructions(id))}</pre>
        <small class="muted credit">${esc(BU_CREDIT)}</small>
      </details>
    </div>`;
  }

  function onAction(action, el) {
    if (action === 'bu-hit') {
      if (run.done) return true;
      run = applyShot(id, run, el?.dataset?.ok === '1');
      if (run.done) finish();
      render();
      return true;
    }
    if (action === 'bu-stop') {
      run = stopEarly(run);
      if (run.done) finish();
      render();
      return true;
    }
    if (action === 'bu-undo') {
      if (saved) return true;
      run = undoRun(id, run);
      render();
      return true;
    }
    if (action === 'bu-flip') {
      mirror = !mirror;
      render();
      return true;
    }
    if (action === 'bu-again') {
      run = newRun(id);
      saved = false;
      render();
      return true;
    }
    if (action === 'play-exit') {
      ctx.go(exam ? '#buexam' : '#drills');
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() { alive = false; } };
}
