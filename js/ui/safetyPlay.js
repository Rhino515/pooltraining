/**
 * Play screen for Safety Master drills.
 * The photo is the diagram. The printed tip circle and lag-to-break bar sit under it.
 * Course mode (#play/drills/<id>/safety) is what finishes the course.
 * A category session does not.
 * No Career Rank XP.
 */
import { getDrillById, displayDrillTitle } from '../drills.js';
import { drillEditorAllowed } from '../drills/ownerEdits.js';
import { awardSession } from '../progression/sessions.js';
import { isSafetyId, safetyMeta, safetyText, withSafetyScore, SAFETY_NAME } from '../content/safetyMaster.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createSafetyPlay(ctx, { id, course = false } = {}) {
  const base = getDrillById(id);
  const meta = safetyMeta(id);
  if (!base || !isSafetyId(id) || !meta) {
    return { render() { ctx.root.innerHTML = ''; }, onAction() { return false; }, destroy() {} };
  }
  let saved = false;
  let done = false;
  let alive = true;

  function finish() {
    if (saved || !done) return;
    saved = true;
    let state = ctx.getState();
    const games = { ...(state.games || {}) };
    const gs = games.drills || { stages: {}, pb: {}, sessions: [] };
    const stages = { ...(gs.stages || {}) };
    const old = stages[id] || { tries: 0, passed: false, bestScore: 0, bestStars: 0, history: [] };
    const now = new Date().toISOString();
    const score = 1;
    stages[id] = {
      ...old,
      tries: (old.tries || 0) + 1,
      passed: true,
      bestScore: Math.max(old.bestScore || 0, score),
      bestStars: old.bestStars || 0,
      lastScore: score,
      lastPassed: true,
      lastDate: now,
      firstPassDate: old.firstPassDate || now,
      history: [...(old.history || []), { date: now, score, passed: true, stars: 0, safety: true, course: !!course }].slice(-20)
    };
    games.drills = {
      ...gs,
      stages,
      pb: { ...(gs.pb || {}) },
      sessions: [...(gs.sessions || []), { stageId: id, date: now, score, passed: true, stars: 0, attempts: 1 }].slice(-100)
    };
    state = { ...state, games, activeSession: null };
    const drill = getDrillById(id);
    const session = { gameId: 'drills', stageId: id, attempts: [], startedAt: now };
    const aw = awardSession(state, session, drill, { passed: true, score, maxScore: 1 });
    state = aw.state;
    if (course) state = withSafetyScore(state, id);
    ctx.commit(state);
  }

  function render() {
    if (!alive) return;
    const edit = drillEditorAllowed() ? `<button type="button" class="phEdit" data-owner-edit="1" data-action="go" data-href="#drillfix/${esc(id)}">EDIT</button>` : '';
    const next = course && meta.next ? `#play/drills/${meta.next}/safety` : '';
    const actions = done
      ? `<p class="buScoreLine">Done</p>
         ${course && next ? `<button type="button" class="bigBtn" data-action="go" data-href="${next}">NEXT DRILL</button>` : ''}
         ${course && !next ? `<button type="button" class="bigBtn" data-action="go" data-href="#safety">COURSE LIST</button>` : ''}
         <button type="button" class="bigBtn alt" data-action="sm-again">RUN AGAIN</button>`
      : `<button type="button" class="bigBtn" data-action="sm-done">DONE</button>
         <p class="muted small">${course ? 'Mark it done after you run it. This is one of the course drills.' : 'This does not finish the Safety Master course. Open it from the course list for that.'}</p>`;
    const eyebrow = course ? SAFETY_NAME.toUpperCase() : esc(displayDrillTitle(base.category));
    const time = meta.time ? `<p class="smTime">time:${esc(meta.time)}</p>` : '';
    ctx.root.innerHTML = `<div class="playScreen buPlay smPlay" data-safety="${esc(id)}" data-course="${course ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button>
        <div class="phTitle"><small>${eyebrow}</small><b>${esc(base.name)}</b></div>
        <div class="phStatus">${edit}</div>
      </div>
      <div class="smShot">
        <div class="diagramWrap"><img class="table-diagram drill-diagram" src="${esc(base.layouts[0])}" alt="${esc(base.name)}" /></div>
        <div class="smTipWrap"><img class="smTip" src="${esc(base.tipImage)}" alt="Cue tip and lag-to-break speed for ${esc(base.name)}" /></div>
        ${time}
      </div>
      ${actions}
      <details class="card buHowCard" open>
        <summary>How to run it</summary>
        <pre class="buHow">${esc(safetyText(id))}</pre>
      </details>
    </div>`;
  }

  function onAction(action) {
    if (action === 'sm-done') {
      if (done) return true;
      done = true;
      finish();
      render();
      return true;
    }
    if (action === 'sm-again') {
      done = false;
      saved = false;
      render();
      return true;
    }
    if (action === 'play-exit') {
      ctx.go(course ? '#safety' : '#drills');
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() { alive = false; } };
}
