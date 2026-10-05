/**
 * PKF Banking Systems Course screen.
 * LEARN → UNDERSTAND → IDENTIFY → SOLVE → LOCK ANSWER → REVEAL PKF SOLUTION → NOW SHOOT IT → exam.
 * Guided lessons show the PKF hint, Assisted lessons offer SHOW HINT, Independent lessons show none.
 * Dev Mode (devBypass) opens locked sections/exam as a DEV PREVIEW that saves nothing.
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST,
  bankOf, sectionUnlocked, examUnlocked, sectionRecord,
  passedSectionCount, playableSectionCount, lessonsFor, lessonById,
  startSection, startExam, previewSection, previewExam, selectChoice, showHint, lockAnswer,
  markExecution, acknowledgeLearn, nextLesson, viewLesson, retryCurrent, reviewMissed,
  figureHTML, revealFigureHTML
} from '../content/pkfBankingCourse.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(d) {
  const cw = Number(d.cw) || 1;
  const ch = Number(d.ch) || 1;
  const ar = (cw * (Number(d.w) || 756)) / (ch * (Number(d.h) || 1080));
  return `<div class="pkfLite pkfbLite" data-pkfb-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkfb-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkfb-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkfb-pan="1">
      <div class="pkfbLiteFrame" style="--cx:${Number(d.cx) || 0};--cy:${Number(d.cy) || 0};--cw:${cw};--ch:${ch};--ar:${ar.toFixed(4)}"><img src="${esc(d.src)}" alt="PKF original page" draggable="false"/></div>
    </div>
    <p class="muted small pkfLiteHint">Pinch or drag to pan. Original PKF page, not redrawn.</p>
  </div>`;
}

function choicesHTML(lesson, it) {
  if (!lesson.choices?.length) return '';
  const locked = !!it?.locked;
  return `<div class="pkfChoices pkfbChoices" role="group" aria-label="Answers">${lesson.choices.map(([v, label]) => {
    const on = it?.choice === v;
    const cls = locked ? (v === lesson.answer ? ' is-right' : (on ? ' is-wrong' : '')) : (on ? ' active' : '');
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfb-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

const labelOf = (lesson, v) => (lesson.choices || []).find((c) => c[0] === v)?.[1] ?? v;

function flowHTML(stage) {
  const steps = ['LEARN', 'SOLVE', 'LOCK', 'REVEAL', 'SHOOT'];
  return `<p class="pkfbFlow" aria-label="Lesson steps">${steps.map((s) => `<span class="${s === stage ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

function shootButtons() {
  return `<div class="pkfActs"><p class="muted small">NOW SHOOT IT on your table. The app does not hit the balls.</p><button type="button" class="bigBtn pkf-make" data-action="pkfb-exec" data-v="make">MAKE</button><button type="button" class="bigBtn alt pkf-miss" data-action="pkfb-exec" data-v="miss">MISS</button></div>`;
}

function solutionCard(lesson) {
  return `<div class="card pkfSol pkfbSol" data-pkfb-sol="1"><b>PKF SOLUTION</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function playHTML(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  const exam = cur.mode === 'exam';
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const id = cur.order[view];
  const lesson = lessonById(id);
  const it = cur.items[id] || {};
  const section = exam ? null : SECTIONS.find((s) => s.id === cur.sectionId);
  const live = view === cur.cursor && cur.phase === 'play';
  const isKnow = lesson.answer != null;
  const isShoot = !!lesson.shoot;
  const isLearn = !isKnow && !isShoot;
  let stage = 'LEARN';
  let body = '';

  if (lesson.incomplete) {
    body = `<p class="card warn" data-pkfb-incomplete="1"><b>FLAG FOR SOURCE REVIEW</b><br/>${esc(lesson.explain || '')}</p>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfb-ack">CONTINUE</button>' : ''}`;
  } else if (isLearn) {
    body = `<div class="card pkfbLearn"><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfb-ack">CONTINUE</button>' : ''}`;
  } else if (isKnow && !it.locked) {
    stage = 'SOLVE';
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED) hint = `<p class="card pkfbHint" data-pkfb-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED) {
      hint = it.hint
        ? `<p class="card pkfbHint" data-pkfb-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkfb-hint">SHOW HINT</button>' : '');
    }
    body = `${hint}${choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkfb-lock" ${it.choice != null && it.choice !== '' ? '' : 'disabled'}>LOCK ANSWER</button>
      <p class="muted small">Lock your answer first. The PKF solution stays hidden until you do.</p>` : ''}`;
  } else if (isKnow && it.locked) {
    stage = 'REVEAL';
    const verdict = it.correct
      ? '<p class="green pkfVerdict" data-pkfb-verdict="right"><b>Correct</b></p>'
      : `<p class="warn pkfVerdict" data-pkfb-verdict="wrong"><b>Incorrect.</b> You chose ${esc(labelOf(lesson, it.choice))}. PKF: ${esc(labelOf(lesson, lesson.answer))}.</p>`;
    body = `${choicesHTML(lesson, it)}${verdict}${solutionCard(lesson)}${revealFigureHTML(lesson.id)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfb-next">NEXT</button>' : ''}`;
  } else if (isShoot && !it.done) {
    stage = 'SHOOT';
    body = `<div class="card pkfbShoot"><b>NOW SHOOT IT</b><p>${esc(lesson.prompt || '')}</p></div>${live ? shootButtons() : ''}`;
  } else if (isShoot && it.done) {
    stage = 'SHOOT';
    body = `<p class="${it.execution === 'make' ? 'green' : 'warn'} pkfVerdict" data-pkfb-exec="${esc(it.execution)}"><b>${it.execution === 'make' ? 'MAKE recorded' : 'MISS recorded'}</b></p>
      ${solutionCard(lesson)}${revealFigureHTML(lesson.id)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfb-next">NEXT</button>' : ''}`;
  }
  if (live && it.done && !isKnow && !isShoot) body += '<button type="button" class="bigBtn" data-action="pkfb-next">NEXT</button>';
  if (!live) body += `<button type="button" class="bigBtn alt" data-action="pkfb-view" data-i="${cur.cursor}">Back to lesson ${cur.cursor + 1}</button>`;

  const review = cur.parent === 'review';
  const eyebrow = exam ? EXAM_TITLE.toUpperCase() : (review ? 'REVIEW MISSED CONCEPTS' : 'PKF BANKING SYSTEMS');
  const h1 = exam ? (lesson.title || EXAM_TITLE) : (section?.title || COURSE_TITLE);
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length}${lesson.assist && !exam ? ` · ${lesson.assist}` : ''} · ${lesson.incomplete ? 'INCOMPLETE' : lesson.type}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkfb-view" data-i="${view - 1}">‹ Previous</button>` : '';

  return `<div class="playScreen kickPage pkfbPage" data-pkfbank-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="#pkfbank">‹ Back</button><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${lesson.incomplete ? '' : flowHTML(stage)}
    ${figureHTML(lesson.id, { alt: lesson.title || 'PKF example', fullBtn: !(isKnow && !it.locked) })}
    ${isShoot && !it.done ? '' : `<div class="card pkfPrompt pkfbPrompt"><b>${esc(lesson.incomplete ? 'INCOMPLETE' : lesson.type)}${lesson.title ? ` · ${esc(lesson.title)}` : ''}</b><p>${esc(lesson.prompt || '')}</p></div>`}
    ${body}
    ${prev}
  </div>`;
}

function resultsHTML(state) {
  const bank = bankOf(state);
  const cur = bank.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const head = exam ? EXAM_TITLE : COURSE_TITLE;
  const title = sum.review
    ? 'Review complete'
    : sum.passed ? (exam ? `${EXAM_TITLE}: Pass` : 'Section complete') : (exam ? `${EXAM_TITLE}: Not passed` : 'Section: Not passed');
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkfb-review">REVIEW MISSED CONCEPTS</button>' : '';
  const weak = exam && !sum.review && bank.exam.weak && Object.keys(bank.exam.weak).length
    ? `<div class="kickHist"><b>Weak topics</b>${Object.entries(bank.exam.weak).map(([k, v]) => `<p>${esc(k)} · ${v}</p>`).join('')}</div>` : '';
  const history = exam && !sum.review && bank.exam.history?.length
    ? `<div class="kickHist"><b>History</b>${bank.exam.history.map((h) => `<p>${esc(new Date(h.at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))} PT · Knowledge ${h.knowledge}% · Execution ${h.execution}% · ${h.overall}% · ${h.passed ? 'pass' : 'not passed'}</p>`).join('')}</div>` : '';
  const missedList = sum.missed?.length
    ? `<div class="kickHist"><b>Missed</b>${sum.missed.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '';
  return `<div class="playScreen kickPage pkfbPage" data-pkfbank-results="1" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfbank">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card">
      <p><b>${sum.review ? 'PRACTICE' : (sum.passed ? 'PASS' : 'RETRY')}</b></p>
      <p>Knowledge ${sum.kOk || 0} / ${sum.kTot || 0} (${Math.round((sum.kRate || 0) * 100)}%)</p>
      <p>Execution ${sum.xOk || 0} / ${sum.xTot || 0}${sum.xTot ? ` (${Math.round((sum.xRate || 0) * 100)}%)` : ''}</p>
      ${sum.review ? '<p class="muted small">Review runs are practice. Your section result is unchanged.</p>' : `<p>Pass requirement: ${exam ? `${Math.round(EXAM_PASS * 100)}% overall` : `${Math.round(KNOWLEDGE_PASS * 100)}% knowledge`}</p>`}
      ${missedList}
      ${reviewBtn}
      <button type="button" class="bigBtn" data-action="pkfb-retry">${sum.passed && !sum.review ? 'REPLAY' : 'RETRY'}</button>
      ${weak}${history}
    </div>
  </div>`;
}

function listHTML(state) {
  const bank = bankOf(state);
  const dev = devBypass();
  const rows = SECTIONS.map((sec) => {
    const real = sectionUnlocked(state, sec.id);
    const open = real || dev;
    const rec = sectionRecord(bank, sec.id);
    const tag = sec.stub ? 'Needs source review'
      : rec?.passed ? 'Passed'
      : rec ? `Best ${Math.round((rec.bestKnowledge || 0) * 100)}% knowledge`
      : real ? 'Open' : open ? 'Locked · Dev preview' : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : sec.stub ? '…' : String(sec.n);
    const href = open ? `#pkfbank/${sec.id}` : '#pkfbank';
    const n = lessonsFor(sec.id).length;
    const ex = rec && (rec.executionMake || rec.executionMiss) ? ` · Shots ${rec.executionMake || 0}/${(rec.executionMake || 0) + (rec.executionMiss || 0)}` : '';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfbank-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · ${sec.stub ? '' : `${n} lessons · `}${esc(tag)}${ex}</small></span></button>`;
  }).join('');
  const passed = passedSectionCount(bank);
  const total = playableSectionCount();
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${bank.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkfbank/exam" data-pkfbank-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (bank.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${EXAM_ITEMS.length} items. Pass at ${Math.round(EXAM_PASS * 100)}%.${examReal ? '' : ' Dev preview.'}${bank.exam.bestOverall ? ` Best ${Math.round(bank.exam.bestOverall * 100)}%.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfbank-exam="1" data-pkfbank-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></button>`;
  const st = bank.stats;
  return `<div class="playScreen kickPage pkfbPage" data-pkfbank-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>Banking from PKF Pattern Play, pages 241–244, shown on the original pages. Sections unlock at ${Math.round(KNOWLEDGE_PASS * 100)}% knowledge.</p></div>
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN from the original PKF page.</li>
      <li>IDENTIFY the path, CALCULATE or CHOOSE AIM on the figure.</li>
      <li>LOCK ANSWER. The PKF solution stays hidden until you lock.</li>
      <li>REVEAL PKF SOLUTION: the printed answer on the original page.</li>
      <li>NOW SHOOT IT on your table and mark MAKE or MISS.</li>
      <li>Pass every section, then take the exam.</li>
    </ol></details>
    <div class="card pkfbTally"><p>${passed} of ${total} sections passed · Knowledge ${st.knowledgeCorrect}/${st.knowledgeCorrect + st.knowledgeWrong} · Shots ${st.executionMake}/${st.executionMake + st.executionMiss}</p></div>
    <div class="stageList" data-pkfbank-sections="1">${rows}${examBtn}</div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage" data-pkfbank-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfbank">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfBankScreen(ctx, args) {
  let lite = null;
  const kind = !args?.[0] || args[0] === 'home' ? 'list' : args[0] === 'exam' ? 'exam' : 'section';
  const sectionId = kind === 'section' ? String(args[0]) : '';

  function paint(html) {
    ctx.root.innerHTML = html + (lite || '');
    bindLite();
  }

  function render() {
    const state0 = ctx.getState();
    if (kind === 'list') return paint(listHTML(state0));
    if (kind === 'exam') {
      const examReal = examUnlocked(state0);
      if (!examReal && !devBypass()) return paint(lockedExamHTML());
      const next = examReal ? startExam(state0) : previewExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = bankOf(state).current;
      return paint(cur?.phase === 'results' ? resultsHTML(state) : playHTML(state));
    }
    if (!SECTIONS.some((s) => s.id === sectionId)) return paint(listHTML(state0));
    const secReal = sectionUnlocked(state0, sectionId);
    if (!secReal && !devBypass()) return paint(listHTML(state0));
    const next = secReal ? startSection(state0, sectionId) : previewSection(state0, sectionId);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = bankOf(state).current;
    if (!cur || cur.mode !== 'section' || cur.sectionId !== sectionId) return paint(listHTML(state));
    paint(cur.phase === 'results' ? resultsHTML(state) : playHTML(state));
  }

  function bindLite() {
    const pan = ctx.root.querySelector?.('[data-pkfb-pan]');
    const frame = pan?.querySelector?.('.pkfbLiteFrame');
    if (!pan || !frame) return;
    let scale = 1, x = 0, y = 0, dragging = false, lx = 0, ly = 0, lastDist = 0;
    const apply = () => { frame.style.transform = `translate(${x}px,${y}px) scale(${scale})`; };
    apply();
    pan.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; pan.setPointerCapture?.(e.pointerId); });
    pan.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      x += e.clientX - lx; y += e.clientY - ly; lx = e.clientX; ly = e.clientY; apply();
    });
    pan.addEventListener('pointerup', () => { dragging = false; });
    pan.addEventListener('pointercancel', () => { dragging = false; });
    pan.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = Math.max(1, Math.min(5, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
      if (scale === 1) { x = 0; y = 0; }
      apply();
    }, { passive: false });
    pan.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }, { passive: true });
    pan.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 2) return;
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastDist) { scale = Math.max(1, Math.min(5, scale * (d / lastDist))); apply(); }
      lastDist = d;
    }, { passive: true });
    frame._pkfbReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkfb-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkfb-hint': (s) => showHint(s),
    'pkfb-lock': (s) => lockAnswer(s),
    'pkfb-ack': (s) => acknowledgeLearn(s),
    'pkfb-exec': (s, el) => markExecution(s, el.dataset.v),
    'pkfb-next': (s) => nextLesson(s),
    'pkfb-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkfb-retry': (s) => retryCurrent(s),
    'pkfb-review': (s) => reviewMissed(s)
  };

  function onAction(action, el) {
    if (action === 'pkfb-enlarge') { lite = enlargeOverlay(el.dataset); render(); return true; }
    if (action === 'pkfb-lite-close') { lite = null; render(); return true; }
    if (action === 'pkfb-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkfbReset?.(); return true; }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    render();
    if (/^pkfb-(next|view|retry|review)$/.test(action) && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
    return true;
  }

  return { render, onAction, destroy() {} };
}
