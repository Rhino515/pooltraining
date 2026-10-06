/**
 * PKF Pattern Play Course screen (#pkfpattern) + PKF Pattern Play Exam.
 * LEARN THE PATTERN → question (WHAT’S NEXT? / WHERE SHOULD THE CUE BALL GO? / CHOOSE THE SEQUENCE / BUILD THE PATTERN /
 * PREDICT THE ROUTE / CHOOSE CUE-BALL ACTION / CHOOSE SPEED / FIND THE PROBLEM / SOLVE IT YOURSELF) → LOCK → COMPARE WITH PKF.
 * Physical: NOW RUN THE PATTERN from PKF's original layout image → shot-by-shot tracking, up to 3 attempts.
 * Routes: #pkfpattern · #pkfpattern/<section> · #pkfpattern/exam · #pkfpattern/review · #pkfpattern/practice ·
 *         #pkfpattern/position · #pkfpattern/lesson/<id>.
 * Dev Mode (devBypass) opens locked sections/exam as DEV PREVIEW (nothing saved).
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, LESSONS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST, ATTEMPTS_MAX, LTYPE, NOT_SPECIFIED,
  SHOT_TAGS, RESULT_LABEL, ORIENT,
  courseOf, sectionUnlocked, examUnlocked, sectionRecord, sectionById, lessonsFor, lessonById, isKnowledge, isPhysical, isBuild, isPlanning,
  shotTagsFor, planRunLine, progressSummary, startSection, startExam, previewSection, previewExam, startReview, startSingle,
  selectChoice, clearBuild, showHint, lockAnswer, showSolution, acknowledgeLearn, beginShooting, markShot, resetAttempt, skipTableStep,
  nextLesson, viewLesson, retryCurrent, reviewMissed, figureHTML, solutionFigureHTML, positionErrorIds, needsPracticeIds
} from '../content/pkfPatternPlayCourse.js';
import { skipButtonHTML, skippedVerdictHTML, xpLineHTML } from '../content/pkfTableStep.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pc = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const frac = (a, b) => `${a} / ${b}${b ? ` (${Math.round((a / b) * 100)}%)` : ''}`;
const ptTime = (iso) => { try { return `${new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} PT`; } catch { return ''; } };
const PATTERN_TYPES = ['BUILD', 'SEQUENCE', 'SOLVE'];

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(d) {
  const cw = Number(d.cw) || 1;
  const ch = Number(d.ch) || 1;
  const ar = (cw * (Number(d.w) || 731)) / (ch * (Number(d.h) || 1044));
  return `<div class="pkfLite pkfbLite pkfppLite" data-pkfpp-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkfpp-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkfpp-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkfpp-pan="1">
      <div class="pkfbLiteFrame" style="--cx:${Number(d.cx) || 0};--cy:${Number(d.cy) || 0};--cw:${cw};--ch:${ch};--ar:${ar.toFixed(4)}"><img src="${esc(d.src)}" alt="PKF original page" draggable="false"/></div>
    </div>
    <p class="muted small pkfLiteHint">Pinch or drag to pan. Original PKF page, not redrawn.</p>
  </div>`;
}

const labelOf = (lesson, v) => (lesson.choices || []).find((c) => c[0] === v)?.[1] ?? v;
const buildText = (v) => String(v || '').split('-').filter(Boolean).join(' → ');

function choicesHTML(lesson, it) {
  if (!lesson.choices?.length) return '';
  const locked = !!it?.locked;
  if (isBuild(lesson)) {
    const built = Array.isArray(it?.build) ? it.build : [];
    const slots = lesson.choices.map((_, i) => `<span class="pkfppSlot${built[i] ? ' on' : ''}" data-pkfpp-slot="${i + 1}"><small>SHOT ${i + 1}</small><b>${esc(built[i] || '·')}</b></span>`).join('');
    const balls = lesson.choices.map(([v, label]) => {
      const used = built.includes(v);
      return `<button type="button" class="bigBtn alt pkfppBall${used ? ' active' : ''}" data-action="pkfpp-choice" data-v="${esc(v)}" ${locked || used ? 'disabled' : ''} aria-pressed="${used ? 'true' : 'false'}">${esc(label)} ball</button>`;
    }).join('');
    return `<div class="pkfppBuild" data-pkfpp-build="${esc(built.join('-'))}"><p class="muted small">Tap the object ball for shot 1, then shot 2, and so on.</p><div class="pkfppSlots">${slots}</div>
      ${locked ? '' : `<div class="pkfppBalls" role="group" aria-label="Object balls">${balls}</div>${built.length ? '<button type="button" class="chip" data-action="pkfpp-clear">CLEAR</button>' : ''}`}</div>`;
  }
  return `<div class="pkfChoices pkfbChoices" role="group" aria-label="Answers">${lesson.choices.map(([v, label]) => {
    const on = it?.choice === v;
    const cls = locked ? (v === lesson.answer ? ' is-right' : (on ? ' is-wrong' : '')) : (on ? ' active' : '');
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfpp-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

function flowHTML(stage, physical) {
  const steps = physical ? ['SET UP', 'RUN', 'RESULT'] : ['READ', 'ANSWER', 'LOCK', 'COMPARE'];
  return `<p class="pkfbFlow" aria-label="Lesson steps">${steps.map((s) => `<span class="${s === stage ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

function dotsHTML(attempts) {
  const marks = [];
  for (let i = 0; i < ATTEMPTS_MAX; i++) {
    const a = attempts?.[i];
    marks.push(!a ? 'empty' : a.result === 'completed' ? 'make' : 'miss');
  }
  return `<span class="kickDots" data-pkfpp-dots="${esc(marks.join(' '))}" aria-label="Attempts">${marks.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}
const MARK = { pos: '✓', made: '✓', lost: '✕ position', miss: '✕', seq: '✕ sequence' };
function shotLine(shots) {
  if (!shots?.length) return '';
  return shots.map((t, i) => `<span class="pkfppShot ${t === 'pos' || t === 'made' ? 'ok' : 'bad'}">SHOT ${i + 1} ${esc(MARK[t] || t)}</span>`).join(' ');
}

function setupCard(lesson, exam) {
  const p = lesson.physical;
  const gaps = p.gaps?.length ? `<p class="small pkfppGaps" data-pkfpp-gaps="1"><b>${esc(NOT_SPECIFIED)}:</b> ${p.gaps.map(esc).join(' · ')}</p>` : '';
  const plan = `<ol class="pkfppShots" data-pkfpp-plan="1">${p.shots.map((s) => `<li>${esc(s.label)}</li>`).join('')}</ol>`;
  return `<div class="card pkfbShoot pkfppSetup" data-pkfpp-setup="1"><b>${esc(LTYPE.RUN)}</b>
    <ol class="pkfppSteps">${p.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <p><b>${exam ? 'Pattern' : 'PKF PATTERN'}</b> (${p.shots.length} shot${p.shots.length === 1 ? '' : 's'})</p>${plan}
    <p><b>Objective:</b> ${esc(p.objective)}</p>
    ${p.goal ? `<p><b>PKF goal:</b> ${esc(p.goal)}</p>` : ''}
    ${p.sequence ? '<p class="muted small">Order is part of this exercise: shooting a different ball records WRONG SEQUENCE.</p>' : ''}
    ${gaps}
    <p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function runCard(lesson, it, live) {
  const shots = lesson.physical.shots;
  const n = it.attempts?.length || 0;
  const head = `<p class="muted small"><b>NOW RUN IT</b> on your table. Up to ${ATTEMPTS_MAX} attempts (app setting). Record every shot.</p>
    ${dotsHTML(it.attempts)}<p class="muted small" data-pkfpp-left="${ATTEMPTS_MAX - n}">Attempt ${Math.min(n + 1, ATTEMPTS_MAX)} of ${ATTEMPTS_MAX}</p>`;
  if (it.between) {
    const last = it.attempts[n - 1];
    return `<div class="card pkfppRun" data-pkfpp-between="1">${head}
      <p class="pkfppLine" data-pkfpp-line="1">${shotLine(last.shots)}</p>
      <p class="warn pkfVerdict" data-pkfpp-result="${esc(last.result)}"><b>${esc(RESULT_LABEL[last.result])}</b></p>
      ${live ? '<button type="button" class="bigBtn" data-action="pkfpp-reset">RESET / TRY AGAIN</button>' : ''}</div>`;
  }
  const idx = (it.live || []).length;
  const shot = shots[idx];
  const tags = shotTagsFor(lesson, idx);
  const btns = live ? tags.map((t, i) => `<button type="button" class="bigBtn${i === 0 ? ' pkf-make' : ' alt'}${t === 'miss' ? ' pkf-miss' : ''}" data-action="pkfpp-shot" data-v="${esc(t)}">${esc(SHOT_TAGS[t].label)}</button>`).join('') : '';
  return `<div class="card pkfppRun" data-pkfpp-run="1" data-pkfpp-shot="${idx + 1}">${head}
    ${idx ? `<p class="pkfppLine" data-pkfpp-line="1">${shotLine(it.live)}</p>` : ''}
    <p><b>SHOT ${idx + 1} of ${shots.length}</b> · ${esc(shot?.label || '')}</p>
    <div class="pkfActs pkfppActs">${btns}</div>
    ${live && idx ? '<button type="button" class="chip" data-action="pkfpp-reset">RESET (re-rack this attempt)</button>' : ''}</div>`;
}

function solutionCard(lesson) {
  const pattern = PATTERN_TYPES.includes(lesson.type) || lesson.type === 'LEARN';
  return `<div class="card pkfSol pkfbSol" data-pkfpp-sol="1"><b>${pattern ? 'PKF PATTERN' : 'PKF SOLUTION'}</b><p>${esc(lesson.explain || '')}</p>
    <p class="muted small">This is PKF’s way; other runouts may exist. ${esc(lesson.src || '')}</p></div>`;
}

function eyebrowOf(cur) {
  if (cur.mode === 'exam') return 'PKF PATTERN PLAY EXAM';
  if (cur.mode === 'review') return 'REVIEW MISSED PATTERNS';
  if (cur.mode === 'practice') return 'PRACTICE FAILED RUNOUTS';
  if (cur.mode === 'position') return 'REVIEW POSITION ERRORS';
  if (cur.mode === 'single') return 'PATTERN REVIEW · NOT GRADED';
  return 'PKF PATTERN PLAY';
}
function lockLabel(lesson) {
  if (isBuild(lesson)) return 'LOCK RUNOUT';
  if (lesson.type === 'SOLVE' || lesson.type === 'SEQUENCE') return 'LOCK PATTERN';
  return 'LOCK ANSWER';
}

function playHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const exam = cur.mode === 'exam';
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const id = cur.order[view];
  const lesson = lessonById(id);
  const it = cur.items[id] || {};
  const section = sectionById(lesson.section);
  const live = view === cur.cursor && cur.phase === 'play';
  const know = isKnowledge(lesson);
  const phys = isPhysical(lesson);
  let stage = 'READ';
  let body = '';
  let fig = '';

  if (lesson.type === 'LEARN') {
    fig = figureHTML(lesson.id, { locked: true });
    body = `<div class="card pkfbLearn" data-pkfpp-learn="1"><b>${lesson.purpose === 'PATTERN' ? 'PKF PATTERN' : 'PKF'}</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${lesson.purpose === 'PATTERN' ? 'This is PKF’s way; other runouts may exist. ' : ''}${esc(lesson.src || '')}</p></div>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfpp-ack">CONTINUE</button>' : ''}
      ${live && it.done ? '<button type="button" class="bigBtn" data-action="pkfpp-next">NEXT</button>' : ''}`;
  } else if (know && !it.locked) {
    stage = 'ANSWER';
    fig = figureHTML(lesson.id, { locked: false });
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED) hint = `<p class="card pkfbHint" data-pkfpp-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED && !exam) {
      hint = it.hint
        ? `<p class="card pkfbHint" data-pkfpp-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkfpp-hint">SHOW HINT</button>' : '');
    }
    const ready = isBuild(lesson) ? (it.build || []).length === lesson.choices.length : (it.choice != null && it.choice !== '');
    body = `${hint}${choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkfpp-lock" ${ready ? '' : 'disabled'}>${lockLabel(lesson)}</button>
      <p class="muted small">Lock first. The answer and PKF’s solution stay hidden until you do.</p>` : ''}`;
  } else if (know && it.locked) {
    stage = it.solution ? 'COMPARE' : 'LOCK';
    fig = figureHTML(lesson.id, { locked: true });
    const mine = isBuild(lesson) ? buildText(it.choice) : labelOf(lesson, it.choice);
    const pkf = isBuild(lesson) ? buildText(lesson.answer) : labelOf(lesson, lesson.answer);
    const verdict = it.correct
      ? '<p class="green pkfVerdict" data-pkfpp-verdict="right"><b>CORRECT</b> · matches PKF</p>'
      : `<p class="warn pkfVerdict" data-pkfpp-verdict="wrong"><b>REVIEW PATTERN</b> · You chose: ${esc(mine)}. PKF: ${esc(pkf)}.</p>`;
    const btn = PATTERN_TYPES.includes(lesson.type) ? 'SHOW PKF PATTERN' : lesson.type === 'WHERE' ? 'SHOW PKF POSITION' : 'SHOW PKF SOLUTION';
    const sol = it.solution
      ? `${solutionCard(lesson)}${solutionFigureHTML(lesson.id)}`
      : `<button type="button" class="bigBtn alt" data-action="pkfpp-solution">${btn}</button>`;
    body = `${choicesHTML(lesson, it)}${verdict}${sol}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfpp-next">NEXT</button>' : ''}`;
  } else if (phys && !it.done && !it.shooting) {
    stage = 'SET UP';
    fig = figureHTML(lesson.id, { locked: true });
    body = `${setupCard(lesson, exam)}${live ? `<button type="button" class="bigBtn" data-action="pkfpp-shoot">NOW RUN IT</button>${skipButtonHTML('pkfpp-skip')}` : ''}`;
  } else if (phys && !it.done) {
    stage = 'RUN';
    fig = figureHTML(lesson.id, { locked: true });
    body = `<div class="card pkfppObjective"><b>${esc(LTYPE.RUN)}</b><p>${esc(lesson.physical.objective)}</p></div>${runCard(lesson, it, live)}${live ? skipButtonHTML('pkfpp-skip') : ''}`;
  } else if (phys) {
    stage = 'RESULT';
    fig = figureHTML(lesson.id, { locked: true });
    const ok = it.execution === 'success';
    const last = it.attempts?.[it.attempts.length - 1];
    const pr = planRunLine(cur, id);
    body = `${it.skipped ? `${skippedVerdictHTML()}${cur.dev || cur.mode === 'single' ? '' : '<p class="muted small">Added to PRACTICE FAILED RUNOUTS.</p>'}` : `<p class="${ok ? 'green' : 'warn'} pkfVerdict" data-pkfpp-exec="${esc(it.execution)}"><b>${ok ? RESULT_LABEL.completed : `${esc(RESULT_LABEL[last?.result] || 'PATTERN FAILED')} · not completed in ${ATTEMPTS_MAX} attempts`}</b></p>${xpLineHTML(it)}`}
      ${pr ? `<p class="small pkfppPlanRun" data-pkfpp-planrun="1"><b>${esc(pr)}</b></p>` : ''}
      ${dotsHTML(it.attempts)}
      <div class="pkfppAttempts">${(it.attempts || []).map((a, i) => `<p class="small">Attempt ${i + 1}: ${shotLine(a.shots)} · ${esc(RESULT_LABEL[a.result])}</p>`).join('')}</div>
      ${solutionCard(lesson)}${solutionFigureHTML(lesson.id)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfpp-next">NEXT</button>' : ''}`;
  }
  if (!live && cur.phase === 'play') body += `<button type="button" class="bigBtn alt" data-action="pkfpp-view" data-i="${cur.cursor}">Back to ${exam ? 'item' : 'lesson'} ${cur.cursor + 1}</button>`;

  const h1 = exam ? (lesson.title || EXAM_TITLE) : (cur.mode === 'section' ? (section?.title || COURSE_TITLE) : lesson.title);
  const part = exam ? (phys ? 'Physical' : isPlanning(lesson) ? 'Planning' : 'Knowledge') : lesson.assist;
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length} · ${part} · ${LTYPE[lesson.type]}${cur.mode !== 'section' && section ? ` · ${section.title}` : ''}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkfpp-view" data-i="${view - 1}">‹ Previous</button>` : '';
  const prompt = (phys && !it.done) ? '' : `<div class="card pkfPrompt pkfbPrompt"><b>${esc(LTYPE[lesson.type])}${lesson.title ? ` · ${esc(lesson.title)}` : ''}</b><p>${esc(lesson.prompt || '')}</p></div>`;
  return `<div class="playScreen kickPage pkfbPage pkfppPage" data-pkfpp-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}" data-type="${esc(lesson.type)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="#pkfpattern">‹ Back</button><span class="eyebrow">${esc(eyebrowOf(cur))}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${cur.mode === 'single' ? '<p class="card muted small" data-pkfpp-single="1">Pattern review. Nothing here changes your scores.</p>' : ''}
    ${flowHTML(stage, phys)}
    ${fig}
    ${prompt}
    ${body}
    ${prev}
  </div>`;
}

function areaName(secId) { return sectionById(secId)?.title || '—'; }
const titleList = (head, ids, attr) => (ids?.length ? `<div class="kickHist"${attr ? ` ${attr}` : ''}><b>${esc(head)}</b>${ids.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '');

function resultsHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const graded = sum.graded;
  const head = exam ? 'PKF PATTERN PLAY EXAM' : COURSE_TITLE.toUpperCase();
  const title = cur.mode === 'single' ? 'Pattern reviewed'
    : !graded ? (cur.mode === 'practice' ? 'Runout practice complete' : cur.mode === 'position' ? 'Position review complete' : 'Review complete')
    : sum.passed ? (exam ? `${EXAM_TITLE}: PASS` : 'Section passed') : (exam ? `${EXAM_TITLE}: RETRY` : 'Section: RETRY');
  if (cur.mode === 'single') {
    return `<div class="playScreen kickPage pkfbPage pkfppPage" data-pkfpp-results="1" data-mode="single">
      <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfpattern">‹ Back</button><span class="eyebrow">${esc(head)}</span><h1>${esc(title)}</h1></div>
      <div class="card"><p class="muted small">Not graded. Your saved progress didn’t change.</p>
        <button type="button" class="bigBtn" data-action="go" data-href="#pkfpattern">Course home</button>
        <button type="button" class="bigBtn alt" data-action="pkfpp-retry">REVIEW AGAIN</button></div>
    </div>`;
  }
  const nSkip = sum.skipped?.length || 0;
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkfpp-review-missed">REVIEW MISSED PATTERNS</button>' : '';
  const practiceBtn = (sum.missedRuns?.length || nSkip) ? '<button type="button" class="bigBtn alt" data-action="pkfpp-practice-missed">PRACTICE FAILED RUNOUTS</button>' : '';
  let examBlock = '';
  if (exam) {
    const rec = (sum.recommend || []).map((s) => `<button type="button" class="chip" data-action="go" data-href="#pkfpattern/${esc(s)}">${esc(areaName(s))}</button>`).join(' ');
    const hist = (course.exam.history || []).slice().reverse().map((h) => `<p>${esc(ptTime(h.at))} · Knowledge ${h.knowledge ?? '—'}% · Planning ${h.planning ?? '—'}% · Physical ${h.execution == null ? (h.skipped ? 'skipped' : '—') : `${h.execution}%`}${h.skipped ? ` · ${h.skipped} skipped` : ''} · Overall ${h.overall}% · ${h.passed ? 'PASS' : 'RETRY'}</p>`).join('');
    examBlock = `<p>Half Table Score ${sum.hTot ? frac(sum.hOk, sum.hTot) : '—'}</p>
      <p>Full Table Score ${sum.fTot ? frac(sum.fOk, sum.fTot) : '—'}</p>
      <p data-pkfpp-position="1">Position Accuracy ${sum.posTot ? frac(sum.posOk, sum.posTot) : '—'}</p>
      <p data-pkfpp-overall="1"><b>Overall Score ${pc(sum.overall)}</b> · pass at ${Math.round(EXAM_PASS * 100)}% (app setting)</p>
      <p><b>${sum.passed ? 'PASS' : 'RETRY'}</b></p>
      <p>Strongest Area: ${esc(sum.strongest ? areaName(sum.strongest) : '—')}</p>
      <p>Weakest Area: ${esc(sum.weakest ? areaName(sum.weakest) : '—')}</p>
      ${rec ? `<div class="kickHist" data-pkfpp-recommend="1"><b>Recommended Review</b><p>${rec}</p></div>` : '<p>Recommended Review: —</p>'}
      ${cur.dev ? '' : `<p>Best Score ${pc(course.exam.bestOverall)}</p>`}
      ${hist && !cur.dev ? `<div class="kickHist" data-pkfpp-history="1"><b>Attempt History</b>${hist}</div>` : ''}`;
  }
  return `<div class="playScreen kickPage pkfbPage pkfppPage" data-pkfpp-results="1" data-mode="${esc(cur.mode)}" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfpattern">‹ Back</button><span class="eyebrow">${esc(head)}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card pkfppResults">
      ${exam ? '' : `<p><b>${graded ? (sum.passed ? 'PASS' : 'RETRY') : 'PRACTICE'}</b></p>`}
      <p>Pattern Knowledge ${frac(sum.kOk || 0, sum.kTot || 0)}</p>
      <p data-pkfpp-planning="1">Planning Accuracy ${sum.pTot ? frac(sum.pOk, sum.pTot) : '—'}</p>
      <p data-pkf-exec-line="1">Physical Execution ${sum.xTot || !nSkip ? frac(sum.xOk || 0, sum.xTot || 0) : 'skipped (not attempted)'}</p>
      <p data-pkf-skipped-count="${nSkip}">Table Steps Skipped ${nSkip}</p>
      ${exam ? '' : `<p>Position Accuracy ${sum.posTot ? frac(sum.posOk, sum.posTot) : '—'}</p>`}
      ${(sum.posErr || sum.shotErr || sum.seqErr) ? `<p class="small">Position errors ${sum.posErr || 0} · Shot errors ${sum.shotErr || 0} · Sequence errors ${sum.seqErr || 0}</p>` : ''}
      ${examBlock}
      ${graded && !exam ? `<p class="muted small">Pass requirement: ${Math.round(KNOWLEDGE_PASS * 100)}% pattern knowledge (app setting). Failed or skipped runouts don’t fail a section; they go to PRACTICE FAILED RUNOUTS.</p>` : ''}
      ${exam && graded ? '<p class="muted small">Skipped table items are left out of the exam score.</p>' : ''}
      ${!graded ? '<p class="muted small">Review and practice runs never change a section pass.</p>' : ''}
      ${titleList('Missed patterns', sum.missed)}${titleList('Runouts needing practice', sum.missedRuns)}${titleList('Position lost', sum.posLost, 'data-pkfpp-poslost="1"')}
      ${titleList('Skipped table steps (in PRACTICE FAILED RUNOUTS)', sum.skipped, `data-pkf-skipped-list="${nSkip}"`)}
      ${reviewBtn}${practiceBtn}
      <button type="button" class="bigBtn" data-action="pkfpp-retry">${sum.passed && graded ? 'REPLAY' : 'RETRY'}</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#pkfpattern">Course home</button>
    </div>
  </div>`;
}

function statsHTML(p) {
  const row = (k, v, attr) => `<div class="pkfppStat"${attr ? ` data-pkfpp-stat="${attr}"` : ''}><small>${esc(k)}</small><b>${esc(v)}</b></div>`;
  return `<div class="card pkfppStats" data-pkfpp-stats="1">
    ${row('Lessons Completed', `${p.lessonsDone} / ${p.lessonsTotal}`, 'lessons')}
    ${row('Pattern Questions Answered', `${p.questionsAnswered} / ${p.questionsTotal}`, 'questions')}
    ${row('First-Answer Accuracy', pc(p.firstAccuracy), 'first')}
    ${row('Patterns Solved', `${p.patternsSolved} / ${p.planningTotal}`, 'solved')}
    ${row('Physical Pattern Attempts', String(p.patternAttempts), 'attempts')}
    ${row('Patterns Completed', String(p.patternsCompleted), 'completed')}
    ${row('First-Try Runouts', String(p.firstTryRuns), 'first-try')}
    ${row('Position Errors', String(p.positionErrors), 'position')}
    ${row('Shot Errors', String(p.shotErrors), 'shot')}
    ${row('Sequence Errors', String(p.sequenceErrors), 'sequence')}
    ${row('Best Streak', String(p.bestStreak), 'streak')}
    ${row('Half Table Progress', `${p.halfDone} / ${p.halfTotal}`, 'half')}
    ${row('Full Table Progress', `${p.fullDone} / ${p.fullTotal}`, 'full')}
    ${row('Independent Patterns Solved', `${p.independentSolved} / ${p.independentTotal}`, 'independent')}
    ${row('Table Steps Skipped', String(p.tableSkipped || 0), 'skipped')}
    ${row('Exam Attempts', String(p.examAttempts), 'exam-attempts')}
    ${row('Best Exam Score', p.examAttempts ? pc(p.examBest) : '—', 'exam-best')}
    ${row('Sections Passed', `${p.sectionsPassed} / ${p.sectionsTotal}`, 'sections')}
  </div>`;
}

function troubleHTML(course) {
  const ids = [...new Set([...positionErrorIds(course), ...needsPracticeIds(course)])];
  if (!ids.length) return '';
  return `<div class="card pkfppTrouble" data-pkfpp-trouble="${ids.length}"><b>Trouble patterns</b><p class="muted small">Jump straight to a runout (not graded).</p>
    <div class="pkfppChips">${ids.map((id) => `<button type="button" class="chip" data-action="go" data-href="#pkfpattern/lesson/${esc(id)}">${esc(lessonById(id)?.title || id)}</button>`).join('')}</div></div>`;
}

function listHTML(state) {
  const course = courseOf(state);
  const dev = devBypass();
  const p = progressSummary(state);
  const rows = SECTIONS.map((sec) => {
    const real = sectionUnlocked(state, sec.id);
    const open = real || dev;
    const rec = sectionRecord(course, sec.id);
    const tag = rec?.passed ? 'Passed' : rec ? `Best ${Math.round((rec.bestKnowledge || 0) * 100)}% knowledge` : real ? 'Open' : open ? 'Locked · Dev preview' : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : String(sec.n);
    const href = open ? `#pkfpattern/${sec.id}` : '#pkfpattern';
    const list = lessonsFor(sec.id);
    const runs = list.filter(isPhysical).length;
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfpp-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · Pages ${esc(sec.pages)} · ${list.length} lessons${runs ? ` (${runs} table exercise${runs === 1 ? '' : 's'})` : ''} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const nPlan = EXAM_ITEMS.filter(isKnowledge).length;
  const nPhys = EXAM_ITEMS.filter(isPhysical).length;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${course.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkfpattern/exam" data-pkfpp-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (course.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${nPlan} planning and knowledge items + ${nPhys} PKF runouts on your table. Pass at ${Math.round(EXAM_PASS * 100)}% overall (app setting).${examReal ? '' : ' Dev preview.'}${course.exam.bestOverall ? ` Best ${pc(course.exam.bestOverall)}.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfpp-exam="1" data-pkfpp-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${SECTIONS.length} sections are passed.</small></span></button>`;
  const reviewBtn = p.review ? `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfpattern/review" data-pkfpp-review="1">REVIEW MISSED PATTERNS (${p.review})</button>` : '';
  const practiceBtn = p.needsPractice ? `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfpattern/practice" data-pkfpp-practice="1">PRACTICE FAILED RUNOUTS (${p.needsPractice})</button>` : '';
  const positionBtn = p.positionReview ? `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfpattern/position" data-pkfpp-position-review="1">REVIEW POSITION ERRORS (${p.positionReview})</button>` : '';
  return `<div class="playScreen kickPage pkfbPage pkfppPage" data-pkfpp-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>PKF Half Table Patterns and Full Table Patterns (printed pages 58–136), on the original pages. Sections unlock in order at ${Math.round(KNOWLEDGE_PASS * 100)}% pattern knowledge (app setting).</p></div>
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN THE PATTERN from PKF’s original layout and page.</li>
      <li>Read the table: what’s next, where the cue ball should go, the sequence, the route, the action, the problem ball. Then LOCK. Nothing is revealed before you lock.</li>
      <li>COMPARE WITH PKF: SHOW PKF SOLUTION / PATTERN opens PKF’s explanation and figure. PKF’s way isn’t always the only runout.</li>
      <li>NOW RUN THE PATTERN: set the balls up from PKF’s original image (no app coordinates), then record every shot. Up to three attempts.</li>
      <li>Help steps down within each pattern group: GUIDED, then ASSISTED, then INDEPENDENT (solve it before you see PKF’s pattern).</li>
      <li>${esc(ORIENT)}</li>
      <li>Pass all ${SECTIONS.length} sections, then take the exam.</li>
    </ol></details>
    ${statsHTML(p)}
    ${reviewBtn}${practiceBtn}${positionBtn}
    ${troubleHTML(course)}
    <div class="stageList" data-pkfpp-sections="1">${rows}${examBtn}</div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage pkfppPage" data-pkfpp-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfpattern">‹ Back</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all ${SECTIONS.length} sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfpattern">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

const REVIEW_KINDS = ['review', 'practice', 'position'];

export function createPkfPatternPlayScreen(ctx, args) {
  let lite = null;
  const a0 = args?.[0] ? String(args[0]) : '';
  const kind = !a0 || a0 === 'home' ? 'list' : a0 === 'exam' ? 'exam' : REVIEW_KINDS.includes(a0) ? a0 : a0 === 'lesson' ? 'single' : 'section';
  const sectionId = kind === 'section' ? a0 : '';
  const singleId = kind === 'single' ? String(args?.[1] || '') : '';

  function paint(html) {
    ctx.root.innerHTML = html + (lite || '');
    bindLite();
  }
  function playOrResults(state) {
    const cur = courseOf(state).current;
    return paint(cur?.phase === 'results' ? resultsHTML(state) : playHTML(state));
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
      if (!cur || cur.mode !== 'exam') return paint(listHTML(state));
      return playOrResults(state);
    }
    if (REVIEW_KINDS.includes(kind)) {
      const cur0 = courseOf(state0).current;
      let state = state0;
      if (!cur0 || cur0.mode !== kind) {
        const next = startReview(state0, kind);
        if (next === state0) return paint(listHTML(state0));
        state = ctx.commit(next);
      }
      return playOrResults(state);
    }
    if (kind === 'single') {
      if (!LESSONS.some((l) => l.id === singleId)) return paint(listHTML(state0));
      const next = startSingle(state0, singleId);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = courseOf(state).current;
      if (!cur || cur.mode !== 'single' || cur.order[0] !== singleId) return paint(listHTML(state));
      return playOrResults(state);
    }
    if (!SECTIONS.some((s) => s.id === sectionId)) return paint(listHTML(state0));
    const secReal = sectionUnlocked(state0, sectionId);
    if (!secReal && !devBypass()) return paint(listHTML(state0));
    const next = secReal ? startSection(state0, sectionId) : previewSection(state0, sectionId);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = courseOf(state).current;
    if (!cur || cur.mode !== 'section' || cur.sectionId !== sectionId) return paint(listHTML(state));
    return playOrResults(state);
  }

  function bindLite() {
    const pan = ctx.root.querySelector?.('[data-pkfpp-pan]');
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
    frame._pkfppReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkfpp-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkfpp-clear': (s) => clearBuild(s),
    'pkfpp-hint': (s) => showHint(s),
    'pkfpp-lock': (s) => lockAnswer(s),
    'pkfpp-solution': (s) => showSolution(s),
    'pkfpp-ack': (s) => acknowledgeLearn(s),
    'pkfpp-shoot': (s) => beginShooting(s),
    'pkfpp-shot': (s, el) => markShot(s, el.dataset.v),
    'pkfpp-reset': (s) => resetAttempt(s),
    'pkfpp-skip': (s) => skipTableStep(s),
    'pkfpp-next': (s) => nextLesson(s),
    'pkfpp-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkfpp-retry': (s) => retryCurrent(s),
    'pkfpp-review-missed': (s) => reviewMissed(s, 'review'),
    'pkfpp-practice-missed': (s) => reviewMissed(s, 'practice')
  };

  function onAction(action, el) {
    if (action === 'pkfpp-enlarge') { lite = enlargeOverlay(el.dataset); render(); return true; }
    if (action === 'pkfpp-lite-close') { lite = null; render(); return true; }
    if (action === 'pkfpp-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkfppReset?.(); return true; }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    const cur = courseOf(ctx.getState()).current;
    if ((action === 'pkfpp-review-missed' || action === 'pkfpp-practice-missed') && cur && cur.mode !== kind) {
      if (typeof location !== 'undefined') { try { location.hash = `#pkfpattern/${cur.mode}`; return true; } catch { /* headless */ } }
    }
    render();
    if (/^pkfpp-(next|view|retry|review|practice)/.test(action) && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
    return true;
  }

  return { render, onAction, destroy() {} };
}
