/**
 * PKF Kicking Systems Course screen.
 * LEARN → question → LOCK ANSWER → reveal PKF solution → NOW SHOOT IT.
 * Dev Mode (owner signed in) opens locked sections/exam — same bypass idea as pack stages.
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, KNOWLEDGE_PASS, EXAM_PASS,
  pkfOf, sectionUnlocked, examUnlocked, sectionRecord, sectionPassed,
  passedSectionCount, playableSectionCount, lessonsFor, lessonById,
  startSection, startExam, previewSection, previewExam, selectChoice, lockAnswer, revealSolution,
  markExecution, acknowledgeLearn, nextLesson, viewLesson, retryCurrent, reviewMissed,
  figureHTML, HASH
} from '../content/pkfKickingCourse.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(src, cx, cy, cw, ch) {
  const escA = esc;
  return `<div class="pkfLite" data-pkf-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkf-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkf-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan" data-pkf-pan="1">
      <img class="pkfLiteImg" src="${escA(src)}" alt="PKF full example" width="756" height="1080" data-cx="${cx}" data-cy="${cy}" data-cw="${cw}" data-ch="${ch}" draggable="false"/>
    </div>
    <p class="muted small pkfLiteHint">Pinch or drag to pan. Reset returns to the cropped figure.</p>
  </div>`;
}

function choicesHTML(lesson, it) {
  if (!lesson.choices?.length) return '';
  const locked = !!(it?.locked);
  return `<div class="pkfChoices" role="group" aria-label="Answers">${lesson.choices.map(([v, label]) => {
    const on = it?.choice === v;
    const cls = locked
      ? (v === lesson.answer ? ' is-right' : (on ? ' is-wrong' : ''))
      : (on ? ' active' : '');
    return `<button type="button" class="bigBtn alt pkfChoice${cls}" data-action="pkf-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

function playHTML(state, ctx) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  const exam = cur.mode === 'exam';
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const id = cur.order[view];
  const lesson = lessonById(id);
  const it = cur.items[id] || {};
  const section = exam ? null : SECTIONS.find((s) => s.id === cur.sectionId);
  const live = view === cur.cursor && cur.phase === 'play';
  const n = cur.order.length;
  const shotNo = view + 1;
  const figId = lesson.asset || lesson.id;
  const isKnow = lesson.answer != null;
  const isShoot = !!lesson.shoot;
  const isLearn = !isKnow && !isShoot;

  let controls = '';
  if (live && isKnow && it.locked) {
    const verdict = it.correct ? '<p class="green pkfVerdict"><b>Correct</b></p>' : '<p class="warn pkfVerdict"><b>Incorrect</b></p>';
    const shootOrNext = isShoot && it.execution == null
      ? `<div class="pkfActs"><p class="muted small">NOW SHOOT IT on your table.</p><button type="button" class="bigBtn pkf-make" data-action="pkf-exec" data-v="make">MAKE / SUCCESS</button><button type="button" class="bigBtn alt pkf-miss" data-action="pkf-exec" data-v="miss">MISS / FAIL</button></div>`
      : `<button type="button" class="bigBtn" data-action="pkf-next">NEXT</button>`;
    controls = `${choicesHTML(lesson, it)}${verdict}
      <div class="card pkfSol" data-pkf-sol="1"><b>PKF solution</b><p>${esc(lesson.explain || '')}</p></div>
      ${shootOrNext}`;
  } else if (live && it.done) {
    controls = `<button type="button" class="bigBtn" data-action="pkf-next">NEXT</button>`;
  } else if (live && isLearn) {
    controls = `<button type="button" class="bigBtn" data-action="pkf-ack">CONTINUE</button>`;
  } else if (live && isKnow && !it.locked) {
    controls = `${choicesHTML(lesson, it)}
      <button type="button" class="bigBtn" data-action="pkf-lock" ${it.choice != null && it.choice !== '' ? '' : 'disabled'}>LOCK ANSWER</button>
      <p class="muted small">Lock before the PKF solution is shown.</p>`;
  } else if (live && isShoot && !isKnow) {
    controls = `<p class="muted small">Shoot this on your table. The app does not hit the balls.</p>
      <div class="pkfActs"><button type="button" class="bigBtn pkf-make" data-action="pkf-exec" data-v="make">MAKE / SUCCESS</button><button type="button" class="bigBtn alt pkf-miss" data-action="pkf-exec" data-v="miss">MISS / FAIL</button></div>`;
  } else if (live && isShoot && isKnow && it.locked && !it.done) {
    controls = `<div class="pkfActs"><button type="button" class="bigBtn pkf-make" data-action="pkf-exec" data-v="make">MAKE / SUCCESS</button><button type="button" class="bigBtn alt pkf-miss" data-action="pkf-exec" data-v="miss">MISS / FAIL</button></div>`;
  } else if (it.done && live) {
    controls = `<button type="button" class="bigBtn" data-action="pkf-next">NEXT</button>`;
  } else if (!live) {
    controls = `<button type="button" class="bigBtn alt" data-action="pkf-view" data-i="${cur.cursor}">Back to lesson ${cur.cursor + 1}</button>`;
  }

  const incomplete = lesson.incomplete
    ? '<p class="warn"><b>Needs source review.</b> This section title is not a clear PKF chapter heading in pages 227–281.</p>'
    : '';

  const back = exam ? '#pkfkick' : '#pkfkick';
  const eyebrow = exam ? EXAM_TITLE.toUpperCase() : 'PKF KICKING SYSTEMS';
  const h1 = exam ? (lesson.title || EXAM_TITLE) : (section?.title || COURSE_TITLE);
  const meta = `Lesson ${shotNo} of ${n}${lesson.assist ? ` · ${esc(lesson.assist)}` : ''}${lesson.type ? ` · ${esc(lesson.type)}` : ''}`;

  return `<div class="playScreen kickPage pkfPage" data-pkfkick-play="1" data-mode="${esc(cur.mode)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="${back}">‹ Back</button><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${incomplete}
    ${figureHTML(figId, { alt: lesson.title || 'PKF example' })}
    <div class="card pkfPrompt"><b>${esc(lesson.type || 'LESSON')}</b><p>${esc(lesson.prompt || '')}</p></div>
    ${!isKnow && !isShoot ? `<div class="card"><p>${esc(lesson.explain || '')}</p></div>` : ''}
    ${controls}
  </div>`;
}

function resultsHTML(state) {
  const pkf = pkfOf(state);
  const cur = pkf.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const head = exam ? EXAM_TITLE : COURSE_TITLE;
  const title = sum.passed ? (exam ? `${EXAM_TITLE} — Pass` : 'Section complete') : (exam ? `${EXAM_TITLE} — Not passed` : 'Section — Not passed');
  const review = sum.missed?.length
    ? `<button type="button" class="bigBtn alt" data-action="pkf-review">REVIEW MISSED CONCEPTS</button>`
    : '';
  const weak = exam && pkf.exam.weak && Object.keys(pkf.exam.weak).length
    ? `<div class="kickHist"><b>Weak topics</b>${Object.entries(pkf.exam.weak).map(([k, v]) => `<p>${esc(k)} · ${v}</p>`).join('')}</div>`
    : '';
  const history = exam && pkf.exam.history?.length
    ? `<div class="kickHist"><b>History</b>${pkf.exam.history.map((h) => `<p>${esc(new Date(h.at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))} PT · K ${h.knowledge}% · X ${h.execution}% · ${h.overall}% · ${h.passed ? 'pass' : 'not passed'}</p>`).join('')}</div>`
    : '';
  return `<div class="playScreen kickPage pkfPage" data-pkfkick-results="1" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfkick">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card">
      <p><b>${sum.passed ? 'PASS' : 'RETRY'}</b></p>
      <p>Knowledge ${sum.kOk || 0} / ${sum.kTot || 0} (${Math.round((sum.kRate || 0) * 100)}%)</p>
      <p>Execution ${sum.xOk || 0} / ${sum.xTot || 0} (${Math.round((sum.xRate || 0) * 100)}%)</p>
      <p>Overall ${Math.round((sum.overall || 0) * 100)}%</p>
      <p>Pass requirement: ${exam ? Math.round(EXAM_PASS * 100) : Math.round(KNOWLEDGE_PASS * 100)}%${exam ? ' overall' : ' knowledge'}</p>
      ${review}
      <button type="button" class="bigBtn" data-action="pkf-retry">${sum.passed ? 'REPLAY' : 'RETRY'}</button>
      ${weak}${history}
    </div>
  </div>`;
}

function listHTML(state) {
  const pkf = pkfOf(state);
  const rows = SECTIONS.map((sec) => {
    const real = sectionUnlocked(state, sec.id);
    const open = real || devBypass();
    const rec = sectionRecord(pkf, sec.id);
    const tag = sec.stub
      ? 'Needs source review'
      : rec?.passed
        ? 'Passed'
        : rec
          ? `Best ${Math.round((rec.bestKnowledge || 0) * 100)}% knowledge`
          : real
            ? 'Open'
            : open
              ? 'Locked · Dev preview'
              : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : sec.stub ? '…' : '●';
    const href = open ? `#pkfkick/${sec.id}` : '#pkfkick';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfkick-section="${esc(sec.id)}"><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const passed = passedSectionCount(pkf);
  const total = playableSectionCount();
  const examReal = examUnlocked(state);
  const examOpen = examReal || devBypass();
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card" data-action="go" data-href="#pkfkick/exam" data-pkfkick-exam="1"><span class="srNum">${examReal ? '●' : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${EXAM_ITEMS.length} items. Pass at ${Math.round(EXAM_PASS * 100)}%.${examReal ? '' : ' Dev preview.'}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfkick-exam="1" data-pkfkick-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></button>`;
  return `<div class="playScreen kickPage pkfPage" data-pkfkick-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>Learn → understand → solve → lock answer → reveal the PKF page → shoot on your table. Sections unlock after ${Math.round(KNOWLEDGE_PASS * 100)}% knowledge. Completed sections stay open.</p></div>
    <div class="card"><p>${passed} of ${total} sections passed.</p></div>
    <div class="stageList" data-pkfkick-sections="1">${rows}${examBtn}</div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfPage" data-pkfkick-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfkick">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfKickScreen(ctx, args) {
  let lite = null;
  const kind = !args[0] || args[0] === 'home' ? 'list' : args[0] === 'exam' ? 'exam' : 'section';
  const sectionId = kind === 'section' ? String(args[0]) : '';

  function render() {
    const state0 = ctx.getState();
    if (kind === 'list') {
      ctx.root.innerHTML = listHTML(state0) + (lite || '');
      bindLite();
      return;
    }
    if (kind === 'exam') {
      const examReal = examUnlocked(state0);
      if (!examReal && !devBypass()) {
        ctx.root.innerHTML = lockedExamHTML();
        return;
      }
      const next = examReal ? startExam(state0) : previewExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = pkfOf(state).current;
      ctx.root.innerHTML = (cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, ctx)) + (lite || '');
      bindLite();
      return;
    }
    const secReal = sectionUnlocked(state0, sectionId);
    if (!secReal && !devBypass()) {
      ctx.root.innerHTML = listHTML(state0);
      return;
    }
    const next = secReal ? startSection(state0, sectionId) : previewSection(state0, sectionId);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = pkfOf(state).current;
    ctx.root.innerHTML = (cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, ctx)) + (lite || '');
    bindLite();
  }

  function bindLite() {
    const pan = ctx.root.querySelector('[data-pkf-pan]');
    const img = ctx.root.querySelector('.pkfLiteImg');
    if (!pan || !img) return;
    let scale = 1;
    let x = 0;
    let y = 0;
    const apply = () => { img.style.transform = `translate(${x}px,${y}px) scale(${scale})`; };
    apply();
    let dragging = false;
    let lx = 0;
    let ly = 0;
    pan.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; pan.setPointerCapture?.(e.pointerId); });
    pan.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      x += e.clientX - lx;
      y += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      apply();
    });
    pan.addEventListener('pointerup', () => { dragging = false; });
    pan.addEventListener('pointercancel', () => { dragging = false; });
    pan.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = Math.max(1, Math.min(4, scale + (e.deltaY < 0 ? 0.15 : -0.15)));
      if (scale === 1) { x = 0; y = 0; }
      apply();
    }, { passive: false });
    let lastDist = 0;
    pan.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        lastDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      }
    }, { passive: true });
    pan.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (lastDist) {
          scale = Math.max(1, Math.min(4, scale * (d / lastDist)));
          apply();
        }
        lastDist = d;
      }
    }, { passive: true });
    img._pkfReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  function onAction(action, el) {
    if (action === 'pkf-enlarge') {
      lite = enlargeOverlay(el.dataset.src, el.dataset.cx, el.dataset.cy, el.dataset.cw, el.dataset.ch);
      render();
      return true;
    }
    if (action === 'pkf-lite-close') {
      lite = null;
      render();
      return true;
    }
    if (action === 'pkf-lite-reset') {
      const img = ctx.root.querySelector('.pkfLiteImg');
      img?._pkfReset?.();
      return true;
    }
    if (action === 'pkf-choice') {
      ctx.commit(selectChoice(ctx.getState(), el.dataset.v));
      render();
      return true;
    }
    if (action === 'pkf-lock') {
      ctx.commit(lockAnswer(ctx.getState()));
      render();
      return true;
    }
    if (action === 'pkf-reveal') {
      ctx.commit(revealSolution(ctx.getState()));
      render();
      return true;
    }
    if (action === 'pkf-ack') {
      ctx.commit(acknowledgeLearn(ctx.getState()));
      render();
      return true;
    }
    if (action === 'pkf-exec') {
      ctx.commit(markExecution(ctx.getState(), el.dataset.v));
      render();
      return true;
    }
    if (action === 'pkf-next') {
      ctx.commit(nextLesson(ctx.getState()));
      render();
      return true;
    }
    if (action === 'pkf-view') {
      ctx.commit(viewLesson(ctx.getState(), Number(el.dataset.i)));
      render();
      return true;
    }
    if (action === 'pkf-retry') {
      ctx.commit(retryCurrent(ctx.getState()));
      render();
      return true;
    }
    if (action === 'pkf-review') {
      ctx.commit(reviewMissed(ctx.getState()));
      render();
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() {} };
}
