/**
 * PKF Shot Making & Center Ball Course screen (#pkfsmcb).
 * LEARN → IDENTIFY / PREDICT / CHOOSE → LOCK ANSWER → CORRECT / REVIEW CONCEPT → SHOW PKF SOLUTION.
 * Physical: SET UP THIS SHOT → NOW SHOOT IT (3 attempts; MAKE/MISS, made + action, or action only).
 * Routes: #pkfsmcb · #pkfsmcb/<section> · #pkfsmcb/exam · #pkfsmcb/review · #pkfsmcb/practice · #pkfsmcb/lesson/<id>.
 * Dev Mode (devBypass) opens locked sections/exam as DEV PREVIEW (nothing saved).
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, LESSONS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST, ATTEMPTS_MAX, LTYPE, PHYS, NOT_SPECIFIED,
  courseOf, migrateFromCueBall, sectionUnlocked, examUnlocked, sectionRecord, sectionById, lessonsFor, lessonById, isKnowledge, isPhysical, tagInfo,
  progressSummary, startSection, startExam, previewSection, previewExam, startReview, startSingle, selectChoice, showHint, lockAnswer, showSolution,
  acknowledgeLearn, beginShooting, markAttempt, nextLesson, viewLesson, retryCurrent, reviewMissed, figureHTML, solutionFigureHTML, assetOf
} from '../content/pkfShotMakingCourse.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pc = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const frac = (a, b) => `${a} / ${b}${b ? ` (${Math.round((a / b) * 100)}%)` : ''}`;
const ptTime = (iso) => { try { return `${new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} PT`; } catch { return ''; } };

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(d) {
  const cw = Number(d.cw) || 1;
  const ch = Number(d.ch) || 1;
  const ar = (cw * (Number(d.w) || 756)) / (ch * (Number(d.h) || 1080));
  return `<div class="pkfLite pkfbLite pkfsmLite" data-pkfsm-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkfsm-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkfsm-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkfsm-pan="1">
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
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfsm-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}
const labelOf = (lesson, v) => (lesson.choices || []).find((c) => c[0] === v)?.[1] ?? v;

function flowHTML(stage, physical) {
  const steps = physical ? ['SET UP', 'SHOOT', 'RESULT'] : ['LEARN', 'ANSWER', 'LOCK', 'SOLUTION'];
  return `<p class="pkfbFlow" aria-label="Lesson steps">${steps.map((s) => `<span class="${s === stage ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

function dotsHTML(lesson, attempts) {
  const marks = [];
  for (let i = 0; i < ATTEMPTS_MAX; i++) {
    const a = attempts?.[i];
    if (!a) marks.push('empty');
    else marks.push(tagInfo(lesson.physical.kind, a)?.objective ? 'make' : 'miss');
  }
  return `<span class="kickDots" data-pkfsm-dots="${esc(marks.join(' '))}">${marks.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}

const KIND_NOTE = {
  pocket: 'Mark each attempt MAKE or MISS.',
  action: 'Success needs the shot made AND the action PKF describes.',
  check: 'PKF does not say this drill must pocket a ball, so only the action is scored.'
};

function setupCard(lesson) {
  const p = lesson.physical;
  const gaps = p.gaps?.length ? `<p class="small pkfsmGaps" data-pkfsm-gaps="1"><b>${esc(NOT_SPECIFIED)}:</b> ${p.gaps.map(esc).join(' · ')}</p>` : '';
  return `<div class="card pkfbShoot pkfsmSetup" data-pkfsm-setup="${esc(p.kind)}"><b>${esc(LTYPE.SHOOT)}</b>
    <ol class="pkfsmSteps">${p.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <p><b>Objective:</b> ${esc(p.objective)}</p>
    ${p.goal ? `<p><b>PKF goal:</b> ${esc(p.goal)}</p>` : ''}
    ${gaps}
    <p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function shootButtons(lesson, it) {
  const kind = lesson.physical.kind;
  const left = ATTEMPTS_MAX - (it?.attempts?.length || 0);
  return `<div class="pkfActs pkfcbActs pkfsmActs" data-pkfsm-kind="${esc(kind)}"><p class="muted small"><b>NOW SHOOT IT</b> on your table. Up to ${ATTEMPTS_MAX} attempts (app setting). ${esc(KIND_NOTE[kind])}</p>
    ${dotsHTML(lesson, it?.attempts)}
    <p class="muted small" data-pkfsm-left="${left}">${left} attempt${left === 1 ? '' : 's'} left</p>
    ${PHYS[kind].map(([tag, label, , ok], i) => `<button type="button" class="bigBtn${i === 0 ? ' pkf-make' : ' alt'}${!ok && i === PHYS[kind].length - 1 ? ' pkf-miss' : ''}" data-action="pkfsm-attempt" data-v="${esc(tag)}">${esc(label)}</button>`).join('')}</div>`;
}

function solutionCard(lesson) {
  return `<div class="card pkfSol pkfbSol" data-pkfsm-sol="1"><b>PKF SOLUTION</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function eyebrowOf(cur) {
  if (cur.mode === 'exam') return EXAM_TITLE.toUpperCase();
  if (cur.mode === 'review') return 'REVIEW MISSED CONCEPTS';
  if (cur.mode === 'practice') return 'PRACTICE MISSED SHOTS';
  if (cur.mode === 'single') return 'SKILL REVIEW · NOT GRADED';
  return 'PKF SHOT MAKING & CENTER BALL';
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
  let stage = 'LEARN';
  let body = '';
  let fig = '';

  if (lesson.type === 'LEARN') {
    fig = figureHTML(lesson.id, { locked: true, alt: lesson.title });
    body = `<div class="card pkfbLearn" data-pkfsm-learn="1"><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfsm-ack">CONTINUE</button>' : ''}
      ${live && it.done ? '<button type="button" class="bigBtn" data-action="pkfsm-next">NEXT</button>' : ''}`;
  } else if (know && !it.locked) {
    stage = 'ANSWER';
    fig = figureHTML(lesson.id, { locked: false, alt: lesson.title });
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED) hint = `<p class="card pkfbHint" data-pkfsm-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED) {
      hint = it.hint
        ? `<p class="card pkfbHint" data-pkfsm-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkfsm-hint">SHOW HINT</button>' : '');
    }
    const ready = it.choice != null && it.choice !== '';
    body = `${hint}${choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkfsm-lock" ${ready ? '' : 'disabled'}>LOCK ANSWER</button>
      <p class="muted small">Lock first. The answer and the PKF solution stay hidden until you do.</p>` : ''}`;
  } else if (know && it.locked) {
    stage = it.solution ? 'SOLUTION' : 'LOCK';
    fig = figureHTML(lesson.id, { locked: true, alt: lesson.title });
    const verdict = it.correct
      ? '<p class="green pkfVerdict" data-pkfsm-verdict="right"><b>CORRECT</b></p>'
      : `<p class="warn pkfVerdict" data-pkfsm-verdict="wrong"><b>REVIEW CONCEPT</b> · You chose: ${esc(labelOf(lesson, it.choice))}. PKF: ${esc(labelOf(lesson, lesson.answer))}.</p>`;
    const sol = it.solution
      ? `${solutionCard(lesson)}${solutionFigureHTML(lesson.id, { alt: lesson.title })}`
      : '<button type="button" class="bigBtn alt" data-action="pkfsm-solution">SHOW PKF SOLUTION</button>';
    body = `${choicesHTML(lesson, it)}${verdict}${sol}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfsm-next">NEXT</button>' : ''}`;
  } else if (phys && !it.done && !it.shooting) {
    stage = 'SET UP';
    fig = figureHTML(lesson.id, { locked: true, alt: lesson.title });
    body = `${setupCard(lesson)}${live ? '<button type="button" class="bigBtn" data-action="pkfsm-shoot">NOW SHOOT IT</button>' : ''}`;
  } else if (phys && !it.done) {
    stage = 'SHOOT';
    fig = figureHTML(lesson.id, { locked: true, alt: lesson.title });
    body = `<div class="card pkfsmObjective"><b>NOW SHOOT IT</b><p>${esc(lesson.physical.objective)}</p></div>${live ? shootButtons(lesson, it) : dotsHTML(lesson, it.attempts)}`;
  } else if (phys) {
    stage = 'RESULT';
    fig = figureHTML(lesson.id, { locked: true, alt: lesson.title });
    const ok = it.execution === 'success';
    body = `<p class="${ok ? 'green' : 'warn'} pkfVerdict" data-pkfsm-exec="${esc(it.execution)}"><b>${ok ? 'SKILL OBJECTIVE ACHIEVED' : `NEEDS PRACTICE · not achieved in ${ATTEMPTS_MAX} attempts`}</b></p>
      ${dotsHTML(lesson, it.attempts)}
      <p class="muted small">${(it.attempts || []).map((t, i) => `Attempt ${i + 1}: ${esc(PHYS[lesson.physical.kind].find((r) => r[0] === t)?.[1] || t)}`).join(' · ')}</p>
      ${solutionCard(lesson)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfsm-next">NEXT</button>' : ''}`;
  }
  if (!live && cur.phase === 'play') body += `<button type="button" class="bigBtn alt" data-action="pkfsm-view" data-i="${cur.cursor}">Back to ${exam ? 'item' : 'lesson'} ${cur.cursor + 1}</button>`;

  const h1 = exam ? (lesson.title || EXAM_TITLE) : (cur.mode === 'section' ? (section?.title || COURSE_TITLE) : lesson.title);
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length}${!exam ? ` · ${lesson.assist}` : ''} · ${LTYPE[lesson.type]}${cur.mode !== 'section' && !exam && section ? ` · ${section.title}` : ''}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkfsm-view" data-i="${view - 1}">‹ Previous</button>` : '';
  const back = cur.mode === 'single' ? '#pkfcb' : '#pkfsmcb';
  const prompt = (phys && !it.done) ? '' : `<div class="card pkfPrompt pkfbPrompt"><b>${esc(LTYPE[lesson.type])}${lesson.title ? ` · ${esc(lesson.title)}` : ''}</b><p>${esc(lesson.prompt || '')}</p></div>`;
  return `<div class="playScreen kickPage pkfbPage pkfsmPage" data-pkfsm-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}" data-type="${esc(lesson.type)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="${back}">‹ Back</button><span class="eyebrow">${esc(eyebrowOf(cur))}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${cur.mode === 'single' ? '<p class="card muted small" data-pkfsm-single="1">Skill review from the PKF Shot Making & Center Ball Course. Nothing here changes your scores.</p>' : ''}
    ${flowHTML(stage, phys)}
    ${fig}
    ${prompt}
    ${body}
    ${prev}
  </div>`;
}

function areaName(secId) { return sectionById(secId)?.title || '—'; }

function resultsHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const graded = sum.graded;
  const head = exam ? EXAM_TITLE : COURSE_TITLE;
  const title = cur.mode === 'single' ? 'Skill reviewed'
    : !graded ? (cur.mode === 'practice' ? 'Shot practice complete' : 'Review complete')
    : sum.passed ? (exam ? `${EXAM_TITLE}: PASS` : 'Section passed') : (exam ? `${EXAM_TITLE}: RETRY` : 'Section: RETRY');
  if (cur.mode === 'single') {
    return `<div class="playScreen kickPage pkfbPage pkfsmPage" data-pkfsm-results="1" data-mode="single">
      <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfcb">‹ Back</button><span class="eyebrow">${esc(COURSE_TITLE.toUpperCase())}</span><h1>${esc(title)}</h1></div>
      <div class="card"><p class="muted small">Not graded. Your saved progress didn’t change.</p>
        <button type="button" class="bigBtn" data-action="go" data-href="#pkfcb">Back to PKF Cue Ball Control</button>
        <button type="button" class="bigBtn alt" data-action="go" data-href="#pkfsmcb">Open ${esc(COURSE_TITLE)}</button>
        <button type="button" class="bigBtn alt" data-action="pkfsm-retry">REVIEW AGAIN</button></div>
    </div>`;
  }
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkfsm-review-missed">REVIEW MISSED CONCEPTS</button>' : '';
  const practiceBtn = sum.missedShots?.length ? '<button type="button" class="bigBtn alt" data-action="pkfsm-practice-missed">PRACTICE MISSED SHOTS</button>' : '';
  const missedList = sum.missed?.length ? `<div class="kickHist"><b>Missed concepts</b>${sum.missed.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '';
  const missedShots = sum.missedShots?.length ? `<div class="kickHist"><b>Shots needing practice</b>${sum.missedShots.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '';
  let examBlock = '';
  if (exam) {
    const rec = (sum.recommend || []).map((s) => `<button type="button" class="chip" data-action="go" data-href="#pkfsmcb/${esc(s)}">${esc(areaName(s))}</button>`).join(' ');
    const hist = (course.exam.history || []).slice().reverse().map((h) => `<p>${esc(ptTime(h.at))} · Knowledge ${h.knowledge ?? '—'}% · Execution ${h.execution ?? '—'}% · Overall ${h.overall}% · ${h.passed ? 'PASS' : 'RETRY'}</p>`).join('');
    examBlock = `<p data-pkfsm-overall="1"><b>Overall ${pc(sum.overall)}</b> · pass at ${Math.round(EXAM_PASS * 100)}% (app setting)</p>
      <p>Strongest Area: ${esc(sum.strongest ? areaName(sum.strongest) : '—')}</p>
      <p>Weakest Area: ${esc(sum.weakest ? areaName(sum.weakest) : '—')}</p>
      ${rec ? `<div class="kickHist"><b>Recommended Review</b><p>${rec}</p></div>` : ''}
      ${cur.dev ? '' : `<p>Best Score ${pc(course.exam.bestOverall)}</p>`}
      ${hist && !cur.dev ? `<div class="kickHist" data-pkfsm-history="1"><b>Attempt History</b>${hist}</div>` : ''}`;
  }
  return `<div class="playScreen kickPage pkfbPage pkfsmPage" data-pkfsm-results="1" data-mode="${esc(cur.mode)}" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfsmcb">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card pkfsmResults">
      <p><b>${graded ? (sum.passed ? 'PASS' : 'RETRY') : 'PRACTICE'}</b></p>
      <p>Knowledge Score ${frac(sum.kOk || 0, sum.kTot || 0)}</p>
      <p>Execution Score ${frac(sum.xOk || 0, sum.xTot || 0)}</p>
      <p>Shot-Making Accuracy ${sum.madeTot ? frac(sum.made, sum.madeTot) : '—'}</p>
      <p>Skill-Objective Accuracy ${sum.objTot ? frac(sum.objOk, sum.objTot) : '—'}</p>
      ${examBlock}
      ${graded && !exam ? `<p class="muted small">Pass requirement: ${Math.round(KNOWLEDGE_PASS * 100)}% knowledge (app setting). Missed shots don’t fail a section; they go to PRACTICE MISSED SHOTS.</p>` : ''}
      ${!graded ? '<p class="muted small">Review and practice runs never change a section pass.</p>' : ''}
      ${missedList}${missedShots}
      ${reviewBtn}${practiceBtn}
      <button type="button" class="bigBtn" data-action="pkfsm-retry">${sum.passed && graded ? 'REPLAY' : 'RETRY'}</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#pkfsmcb">Course home</button>
    </div>
  </div>`;
}

function statsHTML(p) {
  const row = (k, v, attr) => `<div class="pkfsmStat"${attr ? ` data-pkfsm-stat="${attr}"` : ''}><small>${esc(k)}</small><b>${esc(v)}</b></div>`;
  return `<div class="card pkfsmStats" data-pkfsm-stats="1">
    ${row('Lessons Completed', `${p.lessonsDone} / ${p.lessonsTotal}`, 'lessons')}
    ${row('Concepts Mastered', `${p.conceptsMastered} / ${p.conceptsTotal}`, 'concepts')}
    ${row('Knowledge Accuracy', pc(p.knowledgeAccuracy), 'knowledge')}
    ${row('First-Answer Accuracy', pc(p.firstAccuracy), 'first')}
    ${row('Physical Attempts', String(p.attempts), 'attempts')}
    ${row('Shots Made', p.madeTotal ? `${p.made} / ${p.madeTotal}` : '—', 'made')}
    ${row('Skill Objective Achieved', p.objectiveTotal ? `${p.objectiveOk} / ${p.objectiveTotal}` : '—', 'objective')}
    ${row('1st / 2nd / 3rd-Try Success', `${p.firstTry} / ${p.secondTry} / ${p.thirdTry}`, 'tries')}
    ${row('Failed Exercises', String(p.failed), 'failed')}
    ${row('Sections Completed', `${p.sectionsPassed} / ${p.sectionsTotal}`, 'sections')}
    ${row('Exercises Needing Practice', String(p.needsPractice), 'practice')}
    ${row('Exam Attempts', String(p.examAttempts), 'exam-attempts')}
    ${row('Best Exam Score', p.examAttempts ? pc(p.examBest) : '—', 'exam-best')}
  </div>`;
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
    const href = open ? `#pkfsmcb/${sec.id}` : '#pkfsmcb';
    const list = lessonsFor(sec.id);
    const shots = list.filter(isPhysical).length;
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfsm-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · Pages ${esc(sec.pages)} · ${list.length} lessons${shots ? ` (${shots} table exercise${shots === 1 ? '' : 's'})` : ''} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${course.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkfsmcb/exam" data-pkfsm-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (course.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${EXAM_ITEMS.filter(isKnowledge).length} knowledge items + ${EXAM_ITEMS.filter(isPhysical).length} table exercises. Pass at ${Math.round(EXAM_PASS * 100)}% overall (app setting).${examReal ? '' : ' Dev preview.'}${course.exam.bestOverall ? ` Best ${pc(course.exam.bestOverall)}.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfsm-exam="1" data-pkfsm-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${SECTIONS.length} sections are passed.</small></span></button>`;
  const reviewBtn = p.review ? `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfsmcb/review" data-pkfsm-review="1">REVIEW MISSED CONCEPTS (${p.review})</button>` : '';
  const practiceBtn = p.needsPractice ? `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfsmcb/practice" data-pkfsm-practice="1">PRACTICE MISSED SHOTS (${p.needsPractice})</button>` : '';
  const mig = course.migratedFromCueBall?.lessons
    ? `<p class="card muted small" data-pkfsm-migrated="1">Your Center Ball progress from the PKF Cue Ball Control Course was carried over here (${course.migratedFromCueBall.lessons} lessons).${course.unlockAll ? ' You had passed Center Ball there, so every section is open.' : ''}</p>` : '';
  return `<div class="playScreen kickPage pkfbPage pkfsmPage" data-pkfsm-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>PKF Chapter Three, Center Ball (pages 23–43), on the original pages. Sections unlock in order at ${Math.round(KNOWLEDGE_PASS * 100)}% knowledge (app setting).</p></div>
    ${mig}
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN from the original PKF page.</li>
      <li>IDENTIFY, PREDICT or CHOOSE the contact / action, then LOCK ANSWER. Nothing is revealed before you lock.</li>
      <li>You see CORRECT or REVIEW CONCEPT, then SHOW PKF SOLUTION opens PKF’s explanation and page.</li>
      <li>SET UP THIS SHOT from PKF’s description, then NOW SHOOT IT: up to three attempts.</li>
      <li>Help steps down within each section: GUIDED, then ASSISTED, then INDEPENDENT.</li>
      <li>Pass all ${SECTIONS.length} sections, then take the exam.</li>
    </ol></details>
    ${statsHTML(p)}
    ${reviewBtn}${practiceBtn}
    <div class="stageList" data-pkfsm-sections="1">${rows}${examBtn}</div>
    <p class="card muted small" data-pkfsm-next-course="1">Next in PKF: Sliding Cue Ball, in the <button type="button" class="linkish" data-action="go" data-href="#pkfcb">PKF Cue Ball Control Course</button>.</p>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage pkfsmPage" data-pkfsm-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfsmcb">‹ Back</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all ${SECTIONS.length} sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfsmcb">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfShotMakingScreen(ctx, args) {
  let lite = null;
  const a0 = args?.[0] ? String(args[0]) : '';
  const kind = !a0 || a0 === 'home' ? 'list' : a0 === 'exam' ? 'exam' : a0 === 'review' || a0 === 'practice' ? a0 : a0 === 'lesson' ? 'single' : 'section';
  const sectionId = kind === 'section' ? a0 : '';
  const singleId = kind === 'single' ? String(args?.[1] || '') : '';

  function paint(html) {
    ctx.root.innerHTML = html + (lite || '');
    bindLite();
  }
  /** Commits the one-time Cue Ball Control migration the first time this screen sees unmigrated data. */
  function migrated() {
    const s0 = ctx.getState();
    const s1 = migrateFromCueBall(s0);
    return s1 === s0 ? s0 : ctx.commit(s1);
  }
  function playOrResults(state) {
    const cur = courseOf(state).current;
    return paint(cur?.phase === 'results' ? resultsHTML(state) : playHTML(state));
  }

  function render() {
    const state0 = migrated();
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
    if (kind === 'review' || kind === 'practice') {
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
    const pan = ctx.root.querySelector?.('[data-pkfsm-pan]');
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
    frame._pkfsmReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkfsm-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkfsm-hint': (s) => showHint(s),
    'pkfsm-lock': (s) => lockAnswer(s),
    'pkfsm-solution': (s) => showSolution(s),
    'pkfsm-ack': (s) => acknowledgeLearn(s),
    'pkfsm-shoot': (s) => beginShooting(s),
    'pkfsm-attempt': (s, el) => markAttempt(s, el.dataset.v),
    'pkfsm-next': (s) => nextLesson(s),
    'pkfsm-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkfsm-retry': (s) => retryCurrent(s),
    'pkfsm-review-missed': (s) => reviewMissed(s, 'review'),
    'pkfsm-practice-missed': (s) => reviewMissed(s, 'practice')
  };

  function onAction(action, el) {
    if (action === 'pkfsm-enlarge') { lite = enlargeOverlay(el.dataset); render(); return true; }
    if (action === 'pkfsm-lite-close') { lite = null; render(); return true; }
    if (action === 'pkfsm-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkfsmReset?.(); return true; }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    // Review / practice runs started from a results screen keep playing on this screen.
    const cur = courseOf(ctx.getState()).current;
    if ((action === 'pkfsm-review-missed' || action === 'pkfsm-practice-missed') && cur && cur.mode !== kind) {
      if (typeof location !== 'undefined' && kind !== cur.mode) { try { location.hash = `#pkfsmcb/${cur.mode}`; return true; } catch { /* headless */ } }
    }
    render();
    if (/^pkfsm-(next|view|retry|review|practice)/.test(action) && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
    return true;
  }

  return { render, onAction, destroy() {} };
}
