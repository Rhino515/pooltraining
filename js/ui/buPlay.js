/**
 * Play screen for Billiard University Exam I drills.
 * Scores the printed exam (progressive practice or fixed attempts). Does not add Career Rank XP.
 * Exam-mode finishes are stored on state.buExam. A category session records a drill result only.
 */
import { renderStageTable } from '../games/stageTable.js';
import { getDrillById, displayDrillTitle } from '../drills.js';
import { drillEditorAllowed, drillLink } from '../drills/ownerEdits.js';
import { devBypass } from '../dev/gate.js';
import { awardSession } from '../progression/sessions.js';
import {
  applyShot, stopEarly, undoRun, present, statusLine, shotButtons, buMeta, newRun, withExamScore, examInstructions, BU_CREDIT
} from '../content/buExam.js';
import {
  isSkillsId, skillsMeta, newSkillsRun, skillsApply, undoSkills, skillsStatus, skillsButtons, skillsImages, withSkillsScore, skillsText, SKILLS_CREDIT, S10_CHECKS, restartAskHTML
} from '../content/buExam2.js';
import {
  isMoreId, moreMeta, newMoreRun, moreApply, undoMore, moreStatus, moreText, moreImages, withMoreScore, MORE_CREDIT,
  rdsOutcome, rdsProgress, moreExamOf
} from '../content/buMore.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createBuPlay(ctx, { id, exam = false } = {}) {
  if (isMoreId(id)) return createMorePlay(ctx, { id, exam });
  if (isSkillsId(id)) return createSkillsPlay(ctx, { id, exam });
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
    if (exam) state = withExamScore(state, id, score, meta.max, { log: run.log, pos: run.pos, at7: run.at7, pocketed: run.pocketed });
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
      <div class="diagramWrap${mirror ? ' is-mirror' : ''}">${renderStageTable(ch, { className: 'table-diagram', showCuePath: false, showAim: false, showObPath: false, showZones: false })}</div>
      <p class="buStatus">${esc(statusLine(id, run))}</p>
      ${actions}
      ${exam ? restartAskHTML('fundamentals', true) : ''}
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

function createSkillsPlay(ctx, { id, exam = false } = {}) {
  const base = getDrillById(id);
  const meta = skillsMeta(id);
  if (!base?.buExam || !meta) {
    return { render() { ctx.root.innerHTML = ''; }, onAction() { return false; }, destroy() {} };
  }
  let run = newSkillsRun(id);
  let saved = false;
  let alive = true;

  function finish() {
    if (saved || !run.done) return;
    saved = true;
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
    if (exam) state = withSkillsScore(state, id, score, meta.max, { values: run.values, checks: run.checks });
    ctx.commit(state);
  }

  function pictures() {
    const imgs = skillsImages(id);
    if (imgs.length === 1) {
      return `<div class="diagramWrap"><img class="table-diagram drill-diagram" src="${esc(imgs[0])}" alt="${esc(base.name)}" /></div>`;
    }
    const cur = Math.min(run.values.length, imgs.length - 1);
    return imgs.map((src, i) => `<div class="diagramWrap${i === cur && !run.done ? ' is-on' : ''}"><p class="buStatus">Layout ${i + 1}</p><img class="table-diagram drill-diagram" src="${esc(src)}" alt="${esc(base.name)} layout ${i + 1}" /></div>`).join('');
  }

  function render() {
    if (!alive) return;
    const buttons = skillsButtons(id);
    const edit = drillEditorAllowed() ? `<button type="button" class="phEdit" data-owner-edit="1" data-action="go" data-href="#drillfix/${esc(id)}">EDIT</button>` : '';
    const link = drillLink(base.attribution?.sourceURL);
    const done = run.done;
    const score = done ? (run.score ?? 0) : null;
    const next = exam && meta.next ? `#play/drills/${meta.next}/exam` : '';
    const list = meta.exam.href;
    let actions;
    if (done) {
      actions = `<p class="buScoreLine">Score ${score} / ${meta.max}</p>
         ${exam && next ? `<button type="button" class="bigBtn" data-action="go" data-href="${next}">NEXT DRILL</button>` : ''}
         ${exam && !next ? `<button type="button" class="bigBtn" data-action="go" data-href="${list}">EXAM LIST</button>` : ''}
         <button type="button" class="bigBtn alt" data-action="bu-again">RUN AGAIN</button>`;
    } else if (meta.kind === 'median3') {
      const boxes = S10_CHECKS.map((label, i) => `<label data-action="bu-box" data-i="${i}"><input type="checkbox" tabindex="-1" ${run.checks[i] ? 'checked' : ''}/> <span>${esc(label)}</span></label>`).join('');
      actions = `<div class="buChecks">${boxes}</div>
         <button type="button" class="bigBtn" data-action="bu-break">SCORE THIS BREAK</button>
         <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO LAST</button>`;
    } else {
      actions = `<div class="buBar">
           <button type="button" class="bigBtn" data-action="bu-hit" data-ok="1">${esc(buttons[0])}</button>
           <button type="button" class="bigBtn alt" data-action="bu-hit" data-ok="0">${esc(buttons[1])}</button>
         </div>
         <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO LAST SHOT</button>`;
    }
    const eyebrow = exam ? meta.exam.name.toUpperCase() : esc(displayDrillTitle(base.category));
    ctx.root.innerHTML = `<div class="playScreen buPlay" data-bu="${esc(id)}" data-exam="${exam ? 1 : 0}" data-skills="${esc(meta.level)}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button>
        <div class="phTitle"><small>${eyebrow}</small><b>${esc(base.name)}</b></div>
        <div class="phStatus">${edit}</div>
      </div>
      ${pictures()}
      <p class="buStatus">${esc(skillsStatus(id, run))}</p>
      ${actions}
      ${exam ? restartAskHTML(meta.level, true) : ''}
      ${link ? `<a class="drillLink" data-drill-link href="${esc(link)}" target="_blank" rel="noopener noreferrer nofollow"><small>Source</small><b>billiarduniversity.org</b></a>` : ''}
      <details class="card buHowCard" open>
        <summary>Instructions</summary>
        <pre class="buHow">${esc(skillsText(id))}</pre>
        <small class="muted credit">${esc(SKILLS_CREDIT)}</small>
      </details>
    </div>`;
  }

  function onAction(action, el) {
    if (action === 'bu-hit') {
      if (run.done) return true;
      run = skillsApply(id, run, { type: 'hit', ok: el?.dataset?.ok === '1' });
      if (run.done) finish();
      render();
      return true;
    }
    if (action === 'bu-box') {
      if (run.done) return true;
      const i = Number(el?.dataset?.i);
      run = skillsApply(id, run, { type: 'box', i });
      render();
      return true;
    }
    if (action === 'bu-break') {
      if (run.done) return true;
      run = skillsApply(id, run, { type: 'break' });
      if (run.done) finish();
      render();
      return true;
    }
    if (action === 'bu-undo') {
      if (saved) return true;
      run = undoSkills(id, run);
      render();
      return true;
    }
    if (action === 'bu-again') {
      run = newSkillsRun(id);
      saved = false;
      render();
      return true;
    }
    if (action === 'play-exit') {
      ctx.go(exam ? meta.exam.href : '#drills');
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() { alive = false; } };
}

function createMorePlay(ctx, { id, exam = false } = {}) {
  const base = getDrillById(id);
  const meta = moreMeta(id);
  if (!base?.buExam || !meta) {
    return { render() { ctx.root.innerHTML = ''; }, onAction() { return false; }, destroy() {} };
  }
  let run = newMoreRun(id);
  let saved = false;
  let alive = true;

  function persist(force) {
    if (!exam) return;
    if (meta.kind === 'rack') {
      if (!run.done || saved) return;
      saved = true;
      ctx.commit(withMoreScore(ctx.getState(), id, run.score, meta.max, { racks: run.racks, runs: run.runs, move: run.move, ran: !!run.ran }));
      return;
    }
    if (meta.kind === 'matrix') {
      ctx.commit(withMoreScore(ctx.getState(), id, run.score || 0, meta.max, { cells: run.cells }, !run.done));
      saved = !!run.done;
      return;
    }
    if (!run.done || saved) return;
    saved = true;
    const detail = meta.kind === 'yesno' ? { answers: run.answers } : meta.kind === 'deduct' ? { n: run.n } : { step: run.step };
    let state = ctx.getState();
    state = withMoreScore(state, id, run.score, meta.max, detail);
    ctx.commit(state);
  }

  function pictures() {
    const rack = meta.kind === 'rack' ? ' rdsRack' : '';
    return moreImages(id).map((src) => `<div class="diagramWrap"><img class="table-diagram drill-diagram${rack}" src="${esc(src)}" alt="${esc(base.name)}" /></div>`).join('');
  }

  function matrix() {
    const cells = run.cells || [];
    let html = `<div class="buMatrix" style="grid-template-columns:repeat(${meta.cols},minmax(0,1fr))">`;
    for (let r = 0; r < meta.rows; r++) {
      for (let c = 0; c < meta.cols; c++) {
        const i = r * meta.cols + c;
        const v = cells[i];
        html += `<button type="button" class="buCell" data-action="bu-cell" data-i="${i}"><b>${r + 1} × ${c + 1}</b><strong>${v == null ? '·' : v}</strong><small>of 3</small></button>`;
      }
    }
    return html + '</div>';
  }

  function render() {
    if (!alive) return;
    const done = run.done;
    const next = exam && meta.next ? `#play/drills/${meta.next}/exam` : '';
    const list = meta.exam.href;
    let actions = '';
    if (meta.kind === 'rack') {
      const prog = rdsProgress(moreExamOf(ctx.getState(), 'rds'));
      const realLocked = exam && meta.n > prog.unlocked;
      const locked = realLocked && !devBypass(); // Dev Mode ON: a locked RDS level opens as a DEV PREVIEW
      if (realLocked && !locked) actions = '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this level is still locked. Nothing is saved.</p>';
      if (locked) {
        actions = `<p class="buScoreLine">Locked. Pass Level ${meta.n - 1} first.</p>
          <button type="button" class="bigBtn" data-action="go" data-href="${list}">BACK TO THE SET</button>`;
      } else if (done) {
        const o = rdsOutcome(run.runs, meta.n);
        const go = o.next !== meta.n;
        const label = o.move === 'up' ? 'NEXT HIGHER LEVEL' : 'NEXT LOWER LEVEL';
        actions += `<p class="buScoreLine" data-rds-result="1">${esc(o.line)}</p>
          ${go ? `<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/bu-rds${o.next}/exam">${label}</button>` : ''}
          <button type="button" class="bigBtn alt" data-action="bu-again">RUN 3 MORE</button>
          <button type="button" class="bigBtn alt" data-action="go" data-href="${list}">THE SET</button>`;
      } else {
        const labels = meta.buttons;
        actions += `<div class="buBar">
          <button type="button" class="bigBtn" data-action="bu-hit" data-ok="1">${esc(labels[0])}</button>
          <button type="button" class="bigBtn alt" data-action="bu-hit" data-ok="0">${esc(labels[1])}</button>
        </div>
        <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO</button>`;
      }
    } else if (done && meta.kind !== 'matrix') {
      actions = `<p class="buScoreLine">${esc(moreStatus(id, run))}</p>
        ${exam && next ? `<button type="button" class="bigBtn" data-action="go" data-href="${next}">NEXT</button>` : ''}
        ${exam && !next ? `<button type="button" class="bigBtn" data-action="go" data-href="${list}">EXAM SHEET</button>` : ''}
        <button type="button" class="bigBtn alt" data-action="bu-again">SCORE ANOTHER</button>`;
    } else if (meta.kind === 'tries3' || meta.kind === 'yesno') {
      const labels = meta.buttons;
      actions = `<div class="buBar">
        <button type="button" class="bigBtn" data-action="bu-hit" data-ok="1">${esc(labels[0])}</button>
        <button type="button" class="bigBtn alt" data-action="bu-hit" data-ok="0">${esc(labels[1])}</button>
      </div>
      <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO</button>`;
    } else if (meta.kind === 'deduct') {
      actions = `<div class="buBar">
        <button type="button" class="bigBtn alt" data-action="bu-sub">− 1 BALL</button>
        <button type="button" class="bigBtn" data-action="bu-add">+ 1 BALL LEFT</button>
      </div>
      <button type="button" class="bigBtn" data-action="bu-layout">END LAYOUT</button>
      <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO</button>`;
    } else if (meta.kind === 'matrix') {
      actions = `${matrix()}<p class="muted small">Tap a cell to count successful shots, 0 through 3. The sheet uses these numbers.</p>
        <button type="button" class="bigBtn alt" data-action="bu-undo">UNDO</button>
        ${done ? `<button type="button" class="bigBtn" data-action="go" data-href="${list}">EXAM SHEET</button>` : ''}`;
    }
    ctx.root.innerHTML = `<div class="playScreen buPlay" data-bu="${esc(id)}" data-exam="${exam ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button>
        <div class="phTitle"><small>${esc(meta.exam.name)}</small><b>${esc(base.name)}</b></div>
      </div>
      ${pictures()}
      ${(meta.kind === 'rack' && run.done) ? '' : `<p class="buStatus">${esc(moreStatus(id, run))}</p>`}
      ${actions}
      ${exam ? restartAskHTML(meta.exam.key, true) : ''}
      <details class="card buHowCard"${meta.kind === 'rack' ? '' : ' open'}>
        <summary>Instructions</summary>
        <pre class="buHow">${esc(moreText(id))}</pre>
        <small class="muted credit">${esc(MORE_CREDIT)}</small>
      </details>
    </div>`;
  }

  function onAction(action, el) {
    if (action === 'bu-hit') {
      if (run.done) return true;
      if (meta.kind === 'rack' && exam && meta.n > rdsProgress(moreExamOf(ctx.getState(), 'rds')).unlocked && !devBypass()) return true;
      run = moreApply(id, run, { ok: el?.dataset?.ok === '1' });
      persist();
      render();
      return true;
    }
    if (action === 'bu-add' || action === 'bu-sub') {
      run = moreApply(id, run, { type: action === 'bu-add' ? 'add' : 'sub' });
      render();
      return true;
    }
    if (action === 'bu-layout') {
      run = moreApply(id, run, { type: 'done' });
      persist();
      render();
      return true;
    }
    if (action === 'bu-cell') {
      run = moreApply(id, run, { type: 'cell', i: Number(el?.dataset?.i) });
      persist();
      render();
      return true;
    }
    if (action === 'bu-undo') {
      if (saved || (meta.kind === 'rack' && run.done)) return true;
      saved = false;
      run = undoMore(id, run);
      if (meta.kind === 'matrix') persist();
      render();
      return true;
    }
    if (action === 'bu-again') {
      run = newMoreRun(id);
      saved = false;
      render();
      return true;
    }
    if (action === 'play-exit') {
      ctx.go(exam ? meta.exam.href : '#courses');
      return true;
    }
    return false;
  }
  return { render, onAction, destroy() { alive = false; } };
}
