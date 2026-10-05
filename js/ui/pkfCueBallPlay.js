/**
 * PKF Cue Ball Control Course screen.
 * LEARN → PREDICT / ACTION / ZONE / PLAN → LOCK → REVEAL → NOW SHOOT IT (3 attempts, position when required).
 * Dev Mode (devBypass) opens locked sections/exam as DEV PREVIEW (nothing saved).
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST, ATTEMPTS_MAX,
  courseOf, sectionUnlocked, examUnlocked, sectionRecord,
  passedSectionCount, playableSectionCount, lessonsFor, lessonById,
  startSection, startExam, previewSection, previewExam, selectChoice, selectPlanStep, showHint, lockAnswer,
  markExecution, acknowledgeLearn, nextLesson, viewLesson, retryCurrent, reviewMissed, reviewMissedPositions,
  figureHTML, revealFigureHTML, assetOf
} from '../content/pkfCueBallCourse.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(d) {
  const cw = Number(d.cw) || 1;
  const ch = Number(d.ch) || 1;
  const ar = (cw * (Number(d.w) || 756)) / (ch * (Number(d.h) || 1080));
  return `<div class="pkfLite pkfbLite pkfcbLite" data-pkfcb-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkfcb-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkfcb-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkfcb-pan="1">
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
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfcb-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

function planHTML(lesson, it) {
  if (!lesson.plan?.steps?.length) return '';
  const locked = !!it?.locked;
  return `<div class="pkfcbPlan" data-pkfcb-plan="1">${lesson.plan.steps.map((step) => {
    const picked = it?.planChoices?.[step.id];
    return `<div class="card pkfcbPlanStep"><b>${esc(step.label)}</b><div class="pkfChoices">${step.choices.map(([v, label]) => {
      const on = picked === v;
      const cls = locked ? (v === step.answer ? ' is-right' : (on ? ' is-wrong' : '')) : (on ? ' active' : '');
      return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfcb-plan" data-step="${esc(step.id)}" data-v="${esc(v)}" ${locked ? 'disabled' : ''}>${esc(label)}</button>`;
    }).join('')}</div></div>`;
  }).join('')}</div>`;
}

const labelOf = (lesson, v) => (lesson.choices || []).find((c) => c[0] === v)?.[1] ?? v;

function flowHTML(stage) {
  const steps = ['LEARN', 'SOLVE', 'LOCK', 'REVEAL', 'SHOOT'];
  return `<p class="pkfbFlow" aria-label="Lesson steps">${steps.map((s) => `<span class="${s === stage ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

function dotsHTML(attempts) {
  const marks = [];
  for (let i = 0; i < ATTEMPTS_MAX; i++) {
    const a = attempts?.[i];
    if (!a) marks.push('empty');
    else if (a === 'makePos') marks.push('make');
    else marks.push('miss');
  }
  return `<span class="kickDots" data-pkfcb-dots="${esc(marks.join(' '))}">${marks.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}

function shootButtons(lesson, it) {
  const needPos = !!lesson.position;
  const left = ATTEMPTS_MAX - (it?.attempts?.length || 0);
  if (needPos) {
    return `<div class="pkfActs pkfcbActs"><p class="muted small">NOW SHOOT IT on your table. Up to ${ATTEMPTS_MAX} attempts. Success needs the shot made and the position.</p>
      ${dotsHTML(it?.attempts)}
      <p class="muted small">${left} attempt${left === 1 ? '' : 's'} left</p>
      <button type="button" class="bigBtn pkf-make" data-action="pkfcb-exec" data-v="makePos">SHOT MADE + POSITION ACHIEVED</button>
      <button type="button" class="bigBtn alt" data-action="pkfcb-exec" data-v="make-miss-pos">SHOT MADE + MISSED POSITION</button>
      <button type="button" class="bigBtn alt pkf-miss" data-action="pkfcb-exec" data-v="miss">SHOT MISSED</button></div>`;
  }
  return `<div class="pkfActs pkfcbActs"><p class="muted small">NOW SHOOT IT on your table. Up to ${ATTEMPTS_MAX} attempts.</p>
    ${dotsHTML(it?.attempts)}
    <button type="button" class="bigBtn pkf-make" data-action="pkfcb-exec" data-v="makePos">MAKE</button>
    <button type="button" class="bigBtn alt pkf-miss" data-action="pkfcb-exec" data-v="miss">MISS</button></div>`;
}

function solutionCard(lesson) {
  return `<div class="card pkfSol pkfbSol" data-pkfcb-sol="1"><b>PKF SOLUTION</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function playHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const exam = cur.mode === 'exam';
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const id = cur.order[view];
  const lesson = lessonById(id);
  const it = cur.items[id] || {};
  const section = exam ? null : SECTIONS.find((s) => s.id === cur.sectionId);
  const live = view === cur.cursor && cur.phase === 'play';
  const isKnow = lesson.answer != null;
  const isPlan = !!lesson.plan;
  const isShoot = !!lesson.shoot;
  const isLearn = !isKnow && !isPlan && !isShoot;
  const asset = assetOf(lesson.id);
  let stage = 'LEARN';
  let body = '';

  if (lesson.incomplete) {
    body = `<p class="card warn" data-pkfcb-incomplete="1"><b>FLAG FOR SOURCE REVIEW</b><br/>${esc(lesson.explain || '')}</p>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfcb-ack">CONTINUE</button>' : ''}`;
  } else if (isLearn) {
    body = `<div class="card pkfbLearn"><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfcb-ack">CONTINUE</button>' : ''}`;
  } else if ((isKnow || isPlan) && !it.locked) {
    stage = 'SOLVE';
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED) hint = `<p class="card pkfbHint" data-pkfcb-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED) {
      hint = it.hint
        ? `<p class="card pkfbHint" data-pkfcb-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkfcb-hint">SHOW HINT</button>' : '');
    }
    const ready = isPlan
      ? (lesson.plan.steps || []).every((s) => it.planChoices?.[s.id] != null)
      : (it.choice != null && it.choice !== '');
    body = `${hint}${isPlan ? planHTML(lesson, it) : choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkfcb-lock" ${ready ? '' : 'disabled'}>${isPlan ? 'LOCK PLAN' : 'LOCK ANSWER'}</button>
      <p class="muted small">Lock first. The PKF solution stays hidden until you do.</p>` : ''}`;
  } else if ((isKnow || isPlan) && it.locked) {
    stage = 'REVEAL';
    const verdict = it.correct
      ? `<p class="green pkfVerdict" data-pkfcb-verdict="right"><b>Correct</b></p>`
      : (isPlan
        ? `<p class="warn pkfVerdict" data-pkfcb-verdict="wrong"><b>Incorrect.</b> Compare each step with PKF below.</p>`
        : `<p class="warn pkfVerdict" data-pkfcb-verdict="wrong"><b>Incorrect.</b> You chose ${esc(labelOf(lesson, it.choice))}. PKF: ${esc(labelOf(lesson, lesson.answer))}.</p>`);
    body = `${isPlan ? planHTML(lesson, it) : choicesHTML(lesson, it)}${verdict}${solutionCard(lesson)}${revealFigureHTML(lesson.id)}
      ${isPlan ? '<p class="muted small">COMPARE WITH PKF — original solution above.</p>' : ''}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfcb-next">NEXT</button>' : ''}`;
  } else if (isShoot && !it.done) {
    stage = 'SHOOT';
    body = `<div class="card pkfbShoot"><b>NOW SHOOT IT</b><p>${esc(lesson.prompt || '')}</p></div>${live ? shootButtons(lesson, it) : ''}`;
  } else if (isShoot && it.done) {
    stage = 'SHOOT';
    const ok = it.execution === 'make';
    body = `<p class="${ok ? 'green' : 'warn'} pkfVerdict" data-pkfcb-exec="${esc(it.execution)}"><b>${ok ? 'SUCCESS recorded' : 'FAILED after attempts'}</b></p>
      ${dotsHTML(it.attempts)}
      ${solutionCard(lesson)}${revealFigureHTML(lesson.id)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfcb-next">NEXT</button>' : ''}`;
  }
  if (live && it.done && !isKnow && !isPlan && !isShoot) body += '<button type="button" class="bigBtn" data-action="pkfcb-next">NEXT</button>';
  if (!live) body += `<button type="button" class="bigBtn alt" data-action="pkfcb-view" data-i="${cur.cursor}">Back to lesson ${cur.cursor + 1}</button>`;

  const review = cur.parent === 'review' || cur.parent === 'review-pos';
  const eyebrow = exam ? EXAM_TITLE.toUpperCase() : (cur.parent === 'review-pos' ? 'PRACTICE MISSED POSITIONS' : (cur.parent === 'review' ? 'REVIEW MISSED CONCEPTS' : 'PKF CUE BALL CONTROL'));
  const h1 = exam ? (lesson.title || EXAM_TITLE) : (section?.title || COURSE_TITLE);
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length}${lesson.assist && !exam ? ` · ${lesson.assist}` : ''} · ${lesson.incomplete ? 'INCOMPLETE' : lesson.type}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkfcb-view" data-i="${view - 1}">‹ Previous</button>` : '';
  const hideFig = (isKnow || isPlan) && !it.locked && asset?.textOnlyUntilLock;

  return `<div class="playScreen kickPage pkfbPage pkfcbPage" data-pkfcb-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="#pkfcb">‹ Back</button><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${lesson.incomplete ? '' : flowHTML(stage)}
    ${figureHTML(lesson.id, { alt: lesson.title || 'PKF example', fullBtn: !((isKnow || isPlan) && !it.locked), hideUntilLock: hideFig })}
    ${isShoot && !it.done ? '' : `<div class="card pkfPrompt pkfbPrompt"><b>${esc(lesson.incomplete ? 'INCOMPLETE' : lesson.type)}${lesson.title ? ` · ${esc(lesson.title)}` : ''}</b><p>${esc(lesson.prompt || '')}</p></div>`}
    ${body}
    ${prev}
  </div>`;
}

function resultsHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const head = exam ? EXAM_TITLE : COURSE_TITLE;
  const title = sum.review
    ? (cur.parent === 'review-pos' ? 'Position practice complete' : 'Review complete')
    : sum.passed ? (exam ? `${EXAM_TITLE}: Pass` : 'Section complete') : (exam ? `${EXAM_TITLE}: Not passed` : 'Section: Not passed');
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkfcb-review">REVIEW MISSED CONCEPTS</button>' : '';
  const posBtn = sum.missedPos?.length ? '<button type="button" class="bigBtn alt" data-action="pkfcb-review-pos">PRACTICE MISSED POSITIONS</button>' : '';
  const weakEntries = exam && !sum.review && course.exam.weak ? Object.entries(course.exam.weak).sort((a, b) => b[1] - a[1]) : [];
  const strongest = weakEntries.length ? null : (exam && sum.passed ? 'Knowledge & execution balanced' : null);
  const weakest = weakEntries[0]?.[0];
  const weak = weakEntries.length
    ? `<div class="kickHist"><b>Weakest area</b><p>${esc(weakest)}</p><b>Strongest / review</b><p>${esc(weakEntries.slice().reverse()[0]?.[0] || 'Keep reviewing missed concepts')}</p>${weakEntries.map(([k, v]) => `<p>${esc(k)} · ${v}</p>`).join('')}</div>` : '';
  const history = exam && !sum.review && course.exam.history?.length
    ? `<div class="kickHist"><b>Attempt history</b>${course.exam.history.map((h) => `<p>${esc(new Date(h.at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))} PT · Knowledge ${h.knowledge}% · Execution ${h.execution}% · Position ${h.position ?? '—'}% · Pattern ${h.pattern ?? '—'}% · ${h.overall}% · ${h.passed ? 'pass' : 'retry'}</p>`).join('')}</div>` : '';
  const missedList = sum.missed?.length
    ? `<div class="kickHist"><b>Missed concepts</b>${sum.missed.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '';
  return `<div class="playScreen kickPage pkfbPage pkfcbPage" data-pkfcb-results="1" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfcb">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card">
      <p><b>${sum.review ? 'PRACTICE' : (sum.passed ? 'PASS' : 'RETRY')}</b></p>
      <p>Knowledge Score ${sum.kOk || 0} / ${sum.kTot || 0} (${Math.round((sum.kRate || 0) * 100)}%)</p>
      <p>Execution Score ${sum.xOk || 0} / ${sum.xTot || 0}${sum.xTot ? ` (${Math.round((sum.xRate || 0) * 100)}%)` : ''}</p>
      <p>Position Accuracy ${sum.pOk || 0} / ${sum.pTot || 0}${sum.pTot ? ` (${Math.round((sum.pRate || 0) * 100)}%)` : ''}</p>
      <p>Pattern Planning Score ${sum.planOk || 0} / ${sum.planTot || 0}${sum.planTot ? ` (${Math.round((sum.planRate || 0) * 100)}%)` : ''}</p>
      ${exam ? `<p>Overall ${Math.round((sum.overall || 0) * 100)}%</p><p>Best Score ${Math.round((course.exam.bestOverall || 0) * 100)}%</p>` : ''}
      ${sum.review ? '<p class="muted small">Practice runs do not change your saved result.</p>' : `<p>Pass requirement: ${exam ? `${Math.round(EXAM_PASS * 100)}% overall` : `${Math.round(KNOWLEDGE_PASS * 100)}% knowledge`} (missed shots do not fail a section)</p>`}
      ${missedList}
      ${reviewBtn}${posBtn}
      <button type="button" class="bigBtn" data-action="pkfcb-retry">${sum.passed && !sum.review ? 'REPLAY' : 'RETRY'}</button>
      ${weak}${history}
    </div>
  </div>`;
}

function listHTML(state) {
  const course = courseOf(state);
  const dev = devBypass();
  const rows = SECTIONS.map((sec) => {
    const real = sectionUnlocked(state, sec.id);
    const open = real || dev;
    const rec = sectionRecord(course, sec.id);
    const tag = sec.stub ? 'Needs source review'
      : rec?.passed ? 'Passed'
      : rec ? `Best ${Math.round((rec.bestKnowledge || 0) * 100)}% knowledge`
      : real ? 'Open' : open ? 'Locked · Dev preview' : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : sec.stub ? '…' : String(sec.n);
    const href = open ? `#pkfcb/${sec.id}` : '#pkfcb';
    const n = lessonsFor(sec.id).length;
    const ex = rec && (rec.executionMake || rec.executionMiss) ? ` · Shots ${rec.executionMake || 0}/${(rec.executionMake || 0) + (rec.executionMiss || 0)}` : '';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfcb-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · ${sec.stub ? '' : `${n} lessons · `}${esc(tag)}${ex}</small></span></button>`;
  }).join('');
  const passed = passedSectionCount(course);
  const total = playableSectionCount();
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${course.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkfcb/exam" data-pkfcb-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (course.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${EXAM_ITEMS.length} items. Pass at ${Math.round(EXAM_PASS * 100)}%.${examReal ? '' : ' Dev preview.'}${course.exam.bestOverall ? ` Best ${Math.round(course.exam.bestOverall * 100)}%.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfcb-exam="1" data-pkfcb-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></button>`;
  const st = course.stats;
  return `<div class="playScreen kickPage pkfbPage pkfcbPage" data-pkfcb-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>Cue ball control from PKF Pattern Play — original pages. Sections unlock at ${Math.round(KNOWLEDGE_PASS * 100)}% knowledge.</p></div>
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN from the original PKF page.</li>
      <li>PREDICT the cue ball, CHOOSE the action/speed/zone, or PLAN the pattern.</li>
      <li>LOCK ANSWER (or LOCK PLAN). The PKF solution stays hidden until you lock.</li>
      <li>REVEAL PKF SOLUTION on the original page.</li>
      <li>NOW SHOOT IT on your table — up to three attempts; position drills need make + position.</li>
      <li>Pass every section on knowledge, then take the exam.</li>
    </ol></details>
    <div class="card pkfbTally"><p>${passed} of ${total} sections passed · Knowledge ${st.knowledgeCorrect}/${st.knowledgeCorrect + st.knowledgeWrong} · Shots ${st.executionMake}/${st.executionMake + st.executionMiss} · Positions ${st.positionOk}/${st.positionOk + st.positionMiss}</p></div>
    <div class="stageList" data-pkfcb-sections="1">${rows}${examBtn}</div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage pkfcbPage" data-pkfcb-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfcb">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfCueBallScreen(ctx, args) {
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
      const cur = courseOf(state).current;
      return paint(cur?.phase === 'results' ? resultsHTML(state) : playHTML(state));
    }
    if (!SECTIONS.some((s) => s.id === sectionId)) return paint(listHTML(state0));
    const secReal = sectionUnlocked(state0, sectionId);
    if (!secReal && !devBypass()) return paint(listHTML(state0));
    const next = secReal ? startSection(state0, sectionId) : previewSection(state0, sectionId);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = courseOf(state).current;
    if (!cur || cur.mode !== 'section' || cur.sectionId !== sectionId) return paint(listHTML(state));
    paint(cur.phase === 'results' ? resultsHTML(state) : playHTML(state));
  }

  function bindLite() {
    const pan = ctx.root.querySelector?.('[data-pkfcb-pan]');
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
    frame._pkfcbReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkfcb-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkfcb-plan': (s, el) => selectPlanStep(s, el.dataset.step, el.dataset.v),
    'pkfcb-hint': (s) => showHint(s),
    'pkfcb-lock': (s) => lockAnswer(s),
    'pkfcb-ack': (s) => acknowledgeLearn(s),
    'pkfcb-exec': (s, el) => markExecution(s, el.dataset.v),
    'pkfcb-next': (s) => nextLesson(s),
    'pkfcb-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkfcb-retry': (s) => retryCurrent(s),
    'pkfcb-review': (s) => reviewMissed(s),
    'pkfcb-review-pos': (s) => reviewMissedPositions(s)
  };

  function onAction(action, el) {
    if (action === 'pkfcb-enlarge') { lite = enlargeOverlay(el.dataset); render(); return true; }
    if (action === 'pkfcb-lite-close') { lite = null; render(); return true; }
    if (action === 'pkfcb-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkfcbReset?.(); return true; }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    render();
    if (/^pkfcb-(next|view|retry|review)/.test(action) && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
    return true;
  }

  return { render, onAction, destroy() {} };
}
