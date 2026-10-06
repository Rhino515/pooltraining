/**
 * PKF Advanced Play & Safety Course screen (#pkfadv) + PKF Advanced Play & Safety Exam.
 * LEARN → question (RECOGNIZE THE SITUATION / WHAT WOULD YOU DO? / PREDICT THE RESULT / PLAN THE SAFETY / TWO-WAY SHOT /
 * FIND THE PROBLEM / PKF METHOD / CHOOSE THE SEQUENCE / SOLVE THE PATTERN PUZZLE) → LOCK → COMPARE WITH PKF.
 * Physical: SET UP THIS SHOT from PKF's original image → NOW SHOOT IT → one result button per attempt (labels fit the
 * objective: a safety is SAFETY SUCCESSFUL / PARTIAL SAFETY / SAFETY FAILED / SCRATCH), up to 3 attempts.
 * Routes: #pkfadv · #pkfadv/<section> · #pkfadv/exam · #pkfadv/complete · #pkfadv/concepts · #pkfadv/decisions ·
 *         #pkfadv/shots · #pkfadv/safeties · #pkfadv/puzzles · #pkfadv/rerun · #pkfadv/lesson/<id>.
 * Dev Mode (devBypass) opens locked sections/exam as DEV PREVIEW (nothing saved).
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, EXAM_ITEMS, LESSONS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST, ATTEMPTS_MAX, LTYPE, NOT_SPECIFIED,
  PHYS, AREAS, REVIEW_LISTS, resultInfo,
  courseOf, sectionUnlocked, examUnlocked, sectionRecord, sectionById, lessonsFor, lessonById, isKnowledge, isPhysical, isBuild,
  isSafetyPhysical, decisionExecutionLine, progressSummary, completionSummary, courseComplete, startSection, startExam, previewSection,
  previewExam, startReview, startSingle, selectChoice, clearBuild, showHint, lockAnswer, showSolution, acknowledgeLearn, beginShooting,
  markResult, skipTableStep, nextLesson, viewLesson, retryCurrent, reviewMissed, figureHTML, solutionFigureHTML
} from '../content/pkfAdvancedPlaySafetyCourse.js';
import { skipButtonHTML, skippedVerdictHTML, xpLineHTML } from '../content/pkfTableStep.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pc = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const frac = (a, b) => `${a} / ${b}${b ? ` (${Math.round((a / b) * 100)}%)` : ''}`;
const ptTime = (iso) => { try { return `${new Date(iso).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} PT`; } catch { return ''; } };
const REVIEW_KINDS = REVIEW_LISTS.map((r) => r.kind);
const listLabel = (kind) => REVIEW_LISTS.find((r) => r.kind === kind)?.label || 'REVIEW';
const areaLabel = (k) => AREAS[k] || '—';

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

function enlargeOverlay(d) {
  const cw = Number(d.cw) || 1;
  const ch = Number(d.ch) || 1;
  const ar = (cw * (Number(d.w) || 807)) / (ch * (Number(d.h) || 1152));
  return `<div class="pkfLite pkfbLite pkfadvLite" data-pkfadv-lite="1" role="dialog" aria-label="PKF example">
    <div class="pkfLiteBar">
      <button type="button" class="chip" data-action="pkfadv-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkfadv-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkfadv-pan="1">
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
    const slots = lesson.choices.map((_, i) => `<span class="pkfadvSlot${built[i] ? ' on' : ''}" data-pkfadv-slot="${i + 1}"><small>SHOT ${i + 1}</small><b>${esc(built[i] || '·')}</b></span>`).join('');
    const balls = lesson.choices.map(([v, label]) => {
      const used = built.includes(v);
      return `<button type="button" class="bigBtn alt pkfadvBall${used ? ' active' : ''}" data-action="pkfadv-choice" data-v="${esc(v)}" ${locked || used ? 'disabled' : ''} aria-pressed="${used ? 'true' : 'false'}">${esc(label)} ball</button>`;
    }).join('');
    return `<div class="pkfadvBuild" data-pkfadv-build="${esc(built.join('-'))}"><p class="muted small">Tap the ball for shot 1, then shot 2, and so on.</p><div class="pkfadvSlots">${slots}<span class="pkfadvSlot fixed"><small>LAST</small><b>8</b></span></div>
      ${locked ? '' : `<div class="pkfadvBalls" role="group" aria-label="Object balls">${balls}</div>${built.length ? '<button type="button" class="chip" data-action="pkfadv-clear">CLEAR</button>' : ''}`}</div>`;
  }
  return `<div class="pkfChoices pkfbChoices" role="group" aria-label="Answers">${lesson.choices.map(([v, label]) => {
    const on = it?.choice === v;
    const cls = locked ? (v === lesson.answer ? ' is-right' : (on ? ' is-wrong' : '')) : (on ? ' active' : '');
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkfadv-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

function flowHTML(stage, physical) {
  const steps = physical ? ['SET UP', 'SHOOT', 'RESULT'] : ['READ', 'DECIDE', 'LOCK', 'COMPARE'];
  return `<p class="pkfbFlow" aria-label="Lesson steps">${steps.map((s) => `<span class="${s === stage ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

function dotsHTML(attempts) {
  const marks = [];
  for (let i = 0; i < ATTEMPTS_MAX; i++) {
    const a = attempts?.[i];
    marks.push(!a ? 'empty' : a.ok ? 'make' : 'miss');
  }
  return `<span class="kickDots" data-pkfadv-dots="${esc(marks.join(' '))}" aria-label="Attempts">${marks.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}

function setupCard(lesson) {
  const p = lesson.physical;
  const kind = PHYS[p.kind];
  const gaps = p.gaps?.length ? `<p class="small pkfadvGaps" data-pkfadv-gaps="1"><b>${esc(NOT_SPECIFIED)}:</b> ${p.gaps.map(esc).join(' · ')}</p>` : '';
  return `<div class="card pkfbShoot pkfadvSetup" data-pkfadv-setup="1" data-kind="${esc(p.kind)}"><b>${esc(LTYPE.SHOOT)}</b> <span class="pkfadvKind">${esc(kind.label)}</span>
    <ol class="pkfadvSteps">${p.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <p><b>PKF’s way</b></p><ol class="pkfadvSteps" data-pkfadv-how="1">${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <p><b>Objective:</b> ${esc(p.objective)}</p>
    ${gaps}
    <p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function shootCard(lesson, it, live) {
  const n = it.attempts?.length || 0;
  const kind = PHYS[lesson.physical.kind];
  const last = n ? resultInfo(lesson.physical.kind, it.attempts[n - 1].result) : null;
  const btns = live ? kind.results.map(([v, label, ok]) => `<button type="button" class="bigBtn${ok ? ' pkf-make' : ' alt'}${v === 'failed' || v === 'scratch' ? ' pkf-miss' : ''}" data-action="pkfadv-result" data-v="${esc(v)}">${esc(label)}</button>`).join('') : '';
  return `<div class="card pkfadvShootCard" data-pkfadv-shoot="1">
    <p class="muted small"><b>NOW SHOOT IT</b> on your table. Up to ${ATTEMPTS_MAX} attempts (app setting); stops at your first success. Tap the result of each attempt.</p>
    ${dotsHTML(it.attempts)}<p class="muted small" data-pkfadv-left="${ATTEMPTS_MAX - n}">Attempt ${Math.min(n + 1, ATTEMPTS_MAX)} of ${ATTEMPTS_MAX}</p>
    ${last ? `<p class="warn pkfVerdict" data-pkfadv-last="${esc(last.v)}">Attempt ${n}: <b>${esc(last.label)}</b>. Reset the balls and try again.</p>` : ''}
    <div class="pkfActs pkfadvActs">${btns}</div></div>`;
}

function solutionCard(lesson) {
  const label = lesson.label || (lesson.type === 'SHOOT' ? 'PKF' : 'PKF SOLUTION');
  return `<div class="card pkfSol pkfbSol" data-pkfadv-sol="1"><b>${esc(label)}</b><p>${esc(lesson.explain || '')}</p>
    <p class="muted small">PKF’s way; other options may exist. ${esc(lesson.src || '')}</p></div>`;
}

function eyebrowOf(cur) {
  if (cur.mode === 'exam') return 'PKF ADVANCED PLAY & SAFETY EXAM';
  if (REVIEW_KINDS.includes(cur.mode)) return listLabel(cur.mode);
  if (cur.mode === 'rerun') return 'REVIEW · NOT GRADED';
  if (cur.mode === 'single') return 'LESSON REVIEW · NOT GRADED';
  return 'PKF ADVANCED PLAY & SAFETY';
}
function lockLabel(lesson) {
  if (lesson.type === 'PUZZLE') return 'LOCK PATTERN';
  if (lesson.type === 'SEQUENCE') return 'LOCK SEQUENCE';
  if (['DECIDE', 'TWOWAY', 'SAFETY'].includes(lesson.type)) return 'LOCK DECISION';
  return 'LOCK ANSWER';
}
function revealLabel(lesson) {
  if (lesson.type === 'PUZZLE') return 'SHOW PKF SOLUTION';
  if (lesson.label === 'PKF APPROACH') return lesson.type === 'PROBLEM' ? 'SHOW PKF APPROACH' : 'SHOW PKF DECISION';
  return 'SHOW PKF SOLUTION';
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
    body = `<div class="card pkfbLearn" data-pkfadv-learn="1"><b>PKF</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkfadv-ack">CONTINUE</button>' : ''}
      ${live && it.done ? '<button type="button" class="bigBtn" data-action="pkfadv-next">NEXT</button>' : ''}`;
  } else if (know && !it.locked) {
    stage = 'DECIDE';
    fig = figureHTML(lesson.id, { locked: false });
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED && !exam) hint = `<p class="card pkfbHint" data-pkfadv-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED && !exam) {
      hint = it.hint
        ? `<p class="card pkfbHint" data-pkfadv-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkfadv-hint">SHOW HINT</button>' : '');
    }
    const ready = isBuild(lesson) ? (it.build || []).length === lesson.choices.length : (it.choice != null && it.choice !== '');
    body = `${hint}${choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkfadv-lock" ${ready ? '' : 'disabled'}>${lockLabel(lesson)}</button>
      <p class="muted small">Lock first. PKF’s answer stays hidden until you do.</p>` : ''}`;
  } else if (know && it.locked) {
    stage = it.solution ? 'COMPARE' : 'LOCK';
    fig = figureHTML(lesson.id, { locked: true });
    const mine = isBuild(lesson) ? buildText(it.choice) : labelOf(lesson, it.choice);
    const pkf = isBuild(lesson) ? buildText(lesson.answer) : labelOf(lesson, lesson.answer);
    const verdict = it.correct
      ? '<p class="green pkfVerdict" data-pkfadv-verdict="right"><b>CORRECT</b> · matches PKF</p>'
      : `<p class="warn pkfVerdict" data-pkfadv-verdict="wrong"><b>NOT PKF’S CHOICE</b> · You chose: ${esc(mine)}. PKF: ${esc(pkf)}.</p>`;
    const sol = it.solution
      ? `${solutionCard(lesson)}${solutionFigureHTML(lesson.id)}`
      : `<button type="button" class="bigBtn alt" data-action="pkfadv-solution">${revealLabel(lesson)}</button>`;
    body = `${choicesHTML(lesson, it)}${verdict}${sol}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfadv-next">NEXT</button>' : ''}`;
  } else if (phys && !it.done && !it.shooting) {
    stage = 'SET UP';
    fig = figureHTML(lesson.id, { locked: true });
    body = `${setupCard(lesson)}${live ? `<button type="button" class="bigBtn" data-action="pkfadv-shoot">NOW SHOOT IT</button>${skipButtonHTML('pkfadv-skip')}` : ''}`;
  } else if (phys && !it.done) {
    stage = 'SHOOT';
    fig = figureHTML(lesson.id, { locked: true });
    body = `<div class="card pkfadvObjective"><b>${esc(PHYS[lesson.physical.kind].label.toUpperCase())}</b><p>${esc(lesson.physical.objective)}</p></div>${shootCard(lesson, it, live)}${live ? skipButtonHTML('pkfadv-skip') : ''}`;
  } else if (phys) {
    stage = 'RESULT';
    fig = figureHTML(lesson.id, { locked: true });
    const ok = it.execution === 'success';
    const lastA = it.attempts?.[it.attempts.length - 1];
    const lastI = lastA ? resultInfo(lesson.physical.kind, lastA.result) : null;
    const de = decisionExecutionLine(cur, id);
    const practice = isSafetyPhysical(lesson) ? 'PRACTICE FAILED SAFETIES' : 'PRACTICE FAILED SHOTS';
    body = `${it.skipped ? `${skippedVerdictHTML()}${cur.dev || cur.mode === 'single' ? '' : `<p class="muted small">Added to ${practice}.</p>`}` : `<p class="${ok ? 'green' : 'warn'} pkfVerdict" data-pkfadv-exec="${esc(it.execution)}"><b>${ok ? esc(lastI?.label || 'SUCCESS') : `${esc(lastI?.label || 'FAILED')} · not successful in ${ATTEMPTS_MAX} attempts`}</b></p>${xpLineHTML(it)}`}
      ${de ? `<p class="small pkfadvDecExec" data-pkfadv-decexec="1"><b>${esc(de)}</b></p>` : ''}
      ${dotsHTML(it.attempts)}
      <div class="pkfadvAttempts">${(it.attempts || []).map((a, i) => `<p class="small">Attempt ${i + 1}: ${esc(resultInfo(lesson.physical.kind, a.result)?.label || a.result)}</p>`).join('')}</div>
      ${solutionFigureHTML(lesson.id)}
      ${live ? '<button type="button" class="bigBtn" data-action="pkfadv-next">NEXT</button>' : ''}`;
  }
  if (!live && cur.phase === 'play') body += `<button type="button" class="bigBtn alt" data-action="pkfadv-view" data-i="${cur.cursor}">Back to ${exam ? 'item' : 'lesson'} ${cur.cursor + 1}</button>`;

  const h1 = exam ? (lesson.title || EXAM_TITLE) : (cur.mode === 'section' ? (section?.title || COURSE_TITLE) : lesson.title);
  const part = exam ? (phys ? 'Physical' : areaLabel(lesson.area)) : lesson.assist;
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length} · ${part} · ${LTYPE[lesson.type]}${cur.mode !== 'section' && section ? ` · ${section.title}` : ''}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkfadv-view" data-i="${view - 1}">‹ Previous</button>` : '';
  const prompt = (phys || lesson.type === 'LEARN') ? (lesson.type === 'LEARN' ? `<div class="card pkfPrompt pkfbPrompt"><b>${esc(LTYPE.LEARN)} · ${esc(lesson.title)}</b></div>` : '')
    : `<div class="card pkfPrompt pkfbPrompt"><b>${esc(LTYPE[lesson.type])}${lesson.title && !exam ? ` · ${esc(lesson.title)}` : ''}</b><p>${esc(lesson.prompt || '')}</p></div>`;
  return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}" data-type="${esc(lesson.type)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">${esc(eyebrowOf(cur))}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${cur.mode === 'single' || cur.mode === 'rerun' ? '<p class="card muted small" data-pkfadv-single="1">Review. Nothing here changes your section passes.</p>' : ''}
    ${flowHTML(stage, phys)}
    ${fig}
    ${prompt}
    ${body}
    ${prev}
  </div>`;
}

function sectionName(secId) { return sectionById(secId)?.title || '—'; }
const titleList = (head, ids, attr) => (ids?.length ? `<div class="kickHist"${attr ? ` ${attr}` : ''}><b>${esc(head)}</b>${ids.map((id) => `<p>${esc(lessonById(id)?.title || id)}</p>`).join('')}</div>` : '');

function resultsHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const graded = sum.graded;
  const head = exam ? 'PKF ADVANCED PLAY & SAFETY EXAM' : COURSE_TITLE.toUpperCase();
  const title = cur.mode === 'single' ? 'Lesson reviewed'
    : !graded ? (REVIEW_KINDS.includes(cur.mode) ? `${listLabel(cur.mode)}: done` : 'Review complete')
    : sum.passed ? (exam ? 'PASS' : 'Section passed') : (exam ? 'RETRY' : 'Section: RETRY');
  if (cur.mode === 'single') {
    return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-results="1" data-mode="single">
      <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">${esc(head)}</span><h1>${esc(title)}</h1></div>
      <div class="card"><p class="muted small">Not graded. Your saved progress didn’t change.</p>
        <button type="button" class="bigBtn" data-action="go" data-href="#pkfadv">Course home</button>
        <button type="button" class="bigBtn alt" data-action="pkfadv-retry">REVIEW AGAIN</button></div>
    </div>`;
  }
  const nSkip = sum.skipped?.length || 0;
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkfadv-review-missed">REVIEW WHAT I MISSED</button>' : '';
  const practiceBtn = (sum.failed?.length || nSkip) ? '<button type="button" class="bigBtn alt" data-action="pkfadv-practice-missed">PRACTICE FAILED TABLE STEPS</button>' : '';
  const area = (k) => (sum.areas || []).find((a) => a.key === k);
  const areaRow = (k, attr) => { const a = area(k); return `<p data-pkfadv-area="${attr}">${esc(AREAS[k])} ${a && a.tot ? frac(a.ok, a.tot) : (k === 'execution' && nSkip ? 'skipped (not attempted)' : '—')}</p>`; };
  let block;
  if (exam) {
    const rec = (sum.recommend || []).map((s) => `<button type="button" class="chip" data-action="go" data-href="#pkfadv/${esc(s)}">${esc(sectionName(s))}</button>`).join(' ');
    const hist = (course.exam.history || []).slice().reverse().map((h) => `<p>${esc(ptTime(h.at))} · Overall ${h.overall}% · Knowledge ${h.knowledge ?? '—'}% · Physical ${h.execution == null ? (h.skipped ? 'skipped' : '—') : `${h.execution}%`}${h.skipped ? ` · ${h.skipped} skipped` : ''} · ${h.passed ? 'PASS' : 'RETRY'}</p>`).join('');
    block = `${areaRow('knowledge', 'knowledge')}${areaRow('safety', 'safety')}${areaRow('decision', 'decision')}${areaRow('execution', 'execution')}${areaRow('pattern', 'pattern')}
      <p data-pkfadv-overall="1"><b>Overall Score ${pc(sum.overall)}</b> · pass at ${Math.round(EXAM_PASS * 100)}% (app setting)</p>
      <p data-pkfadv-pass="${sum.passed ? 'pass' : 'retry'}"><b>${sum.passed ? 'PASS' : 'RETRY'}</b></p>
      <p>Strongest Area: ${esc(sum.strongest ? areaLabel(sum.strongest) : '—')}</p>
      <p>Weakest Area: ${esc(sum.weakest ? areaLabel(sum.weakest) : '—')}</p>
      ${rec ? `<div class="kickHist" data-pkfadv-recommend="1"><b>Recommended Review</b><p>${rec}</p></div>` : '<p>Recommended Review: —</p>'}
      ${cur.dev ? '' : `<p>Best Score ${pc(course.exam.bestOverall)}</p>`}
      ${hist && !cur.dev ? `<div class="kickHist" data-pkfadv-history="1"><b>Attempt History</b>${hist}</div>` : ''}
      <p data-pkf-skipped-count="${nSkip}">Table Steps Skipped ${nSkip}</p>
      ${graded ? '<p class="muted small">Skipped table items are left out of the exam score.</p>' : ''}`;
  } else {
    block = `<p><b>${graded ? (sum.passed ? 'PASS' : 'RETRY') : 'PRACTICE'}</b></p>
      <p>Strategy Knowledge ${frac(sum.kOk || 0, sum.kTot || 0)}</p>
      <p data-pkf-exec-line="1">Physical Execution ${sum.xTot || !nSkip ? frac(sum.xOk || 0, sum.xTot || 0) : 'skipped (not attempted)'}</p>
      ${sum.sTot ? `<p data-pkfadv-safeties="1">Safeties Successful ${frac(sum.sOk, sum.sTot)}</p>` : ''}
      <p data-pkf-skipped-count="${nSkip}">Table Steps Skipped ${nSkip}</p>
      ${graded ? `<p class="muted small">Pass requirement: ${Math.round(KNOWLEDGE_PASS * 100)}% strategy knowledge (app setting). Failed or skipped table steps don’t fail a section; they go to your practice lists.</p>` : '<p class="muted small">Review and practice runs never change a section pass.</p>'}`;
  }
  const done = !exam && graded && sum.passed && !cur.dev && courseComplete(course);
  return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-results="1" data-mode="${esc(cur.mode)}" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">${esc(head)}</span><h1>${esc(title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card pkfadvResults">
      ${block}
      ${titleList('Missed', sum.missed)}${titleList('Table steps needing practice', sum.failed)}
      ${titleList('Skipped table steps (on your practice list)', sum.skipped, `data-pkf-skipped-list="${nSkip}"`)}
      ${done ? '<button type="button" class="bigBtn" data-action="go" data-href="#pkfadv/complete" data-pkfadv-complete-btn="1">COURSE COMPLETE · SEE SUMMARY</button>' : ''}
      ${reviewBtn}${practiceBtn}
      <button type="button" class="bigBtn${done ? ' alt' : ''}" data-action="pkfadv-retry">${sum.passed && graded ? 'REPLAY' : 'RETRY'}</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#pkfadv">Course home</button>
    </div>
  </div>`;
}

function statsHTML(p) {
  const row = (k, v, attr) => `<div class="pkfadvStat" data-pkfadv-stat="${attr}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`;
  return `<div class="card pkfadvStats" data-pkfadv-stats="1">
    ${row('Lessons Completed', `${p.lessonsDone} / ${p.lessonsTotal}`, 'lessons')}
    ${row('Strategy Questions Answered', `${p.questionsAnswered} / ${p.questionsTotal}`, 'questions')}
    ${row('First-Answer Accuracy', pc(p.firstAccuracy), 'first')}
    ${row('Safeties Attempted', String(p.safetiesAttempted), 'safeties-attempted')}
    ${row('Safeties Successful', String(p.safetiesSuccessful), 'safeties-successful')}
    ${row('Two-Way Decisions', `${p.twoWayCorrect} / ${p.twoWayTotal}`, 'two-way')}
    ${row('Pattern Puzzles Solved', `${p.puzzlesSolved} / ${p.puzzlesTotal}`, 'puzzles')}
    ${row('Physical Attempts', String(p.physicalAttempts), 'attempts')}
    ${row('First-Try Successes', String(p.firstTry), 'first-try')}
    ${row('Independent Decisions Correct', `${p.independentCorrect} / ${p.independentTotal}`, 'independent')}
    ${row('Table Steps Skipped', String(p.tableSkipped || 0), 'skipped')}
    ${row('Exam Attempts', String(p.examAttempts), 'exam-attempts')}
    ${row('Best Exam Score', p.examAttempts ? pc(p.examBest) : '—', 'exam-best')}
    ${row('Sections Passed', `${p.sectionsPassed} / ${p.sectionsTotal}`, 'sections')}
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
    const href = open ? `#pkfadv/${sec.id}` : '#pkfadv';
    const list = lessonsFor(sec.id);
    const runs = list.filter(isPhysical).length;
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkfadv-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>${esc(sec.blurb)} · Pages ${esc(sec.pages)} · ${list.length} lessons${runs ? ` (${runs} table exercise${runs === 1 ? '' : 's'})` : ''} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const nK = EXAM_ITEMS.filter(isKnowledge).length;
  const nP = EXAM_ITEMS.filter(isPhysical).length;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${course.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkfadv/exam" data-pkfadv-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (course.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${nK} strategy, safety and decision items + ${nP} PKF table exercises. Pass at ${Math.round(EXAM_PASS * 100)}% overall (app setting).${examReal ? '' : ' Dev preview.'}${course.exam.bestOverall ? ` Best ${pc(course.exam.bestOverall)}.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkfadv-exam="1" data-pkfadv-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${SECTIONS.length} sections are passed.</small></span></button>`;
  const lists = REVIEW_LISTS.filter((r) => p.lists[r.kind]).map((r) => `<button type="button" class="bigBtn alt" data-action="go" data-href="#pkfadv/${r.kind}" data-pkfadv-list="${r.kind}">${esc(r.label)} (${p.lists[r.kind]})</button>`).join('');
  const complete = p.complete ? '<button type="button" class="bigBtn" data-action="go" data-href="#pkfadv/complete" data-pkfadv-complete-btn="1">COURSE COMPLETE · SEE SUMMARY</button>' : '';
  return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>PKF Chapter Seven: Tips &amp; Tricks (printed pages 137–200), on the original pages. Sections unlock in order at ${Math.round(KNOWLEDGE_PASS * 100)}% strategy knowledge (app setting).</p></div>
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN from PKF’s original figure and page.</li>
      <li>Read the table and decide: the situation, what you’d do, the safety, the two-way shot, the problem, the result. Then LOCK. Nothing is revealed before you lock.</li>
      <li>COMPARE WITH PKF: PKF’s decision, approach or solution with its original figure. It’s PKF’s way; other options may exist.</li>
      <li>SET UP THIS SHOT from PKF’s original image (no app coordinates), then NOW SHOOT IT: tap the result that fits the objective. Up to three attempts.</li>
      <li>Help steps down within each section: GUIDED, then ASSISTED, then INDEPENDENT.</li>
      <li>Pass all ${SECTIONS.length} sections, then take the exam.</li>
    </ol></details>
    ${complete}
    ${statsHTML(p)}
    ${lists ? `<div class="pkfadvLists" data-pkfadv-lists="1">${lists}</div>` : ''}
    <div class="stageList" data-pkfadv-sections="1">${rows}${examBtn}</div>
  </div>`;
}

function completeHTML(state) {
  const c = completionSummary(state);
  if (!c.complete) {
    return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-complete="0">
      <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">PKF ADVANCED PLAY &amp; SAFETY</span><h1>Not complete yet</h1></div>
      <div class="card"><p>Pass all ${SECTIONS.length} sections to complete the course.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfadv">Course home</button></div></div>`;
  }
  return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-complete="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">PKF ADVANCED PLAY &amp; SAFETY</span><h1>COURSE COMPLETE</h1></div>
    <div class="card pkfadvComplete">
      <p data-pkfadv-final="knowledge">Knowledge Score <b>${pc(c.knowledge)}</b></p>
      <p data-pkfadv-final="execution">Execution Score <b>${c.execution == null ? '—' : pc(c.execution)}</b>${c.skipped ? ` <span class="muted small">(${c.skipped} skipped table step${c.skipped === 1 ? '' : 's'} left out)</span>` : ''}</p>
      <p data-pkfadv-final="exam">Exam Score <b>${c.exam == null ? '—' : pc(c.exam)}</b>${c.exam == null ? '' : c.examPassed ? ' · PASS' : ''}</p>
      <p data-pkfadv-final="strongest">Strongest Skill <b>${esc(c.strongest ? areaLabel(c.strongest) : '—')}</b></p>
      <p data-pkfadv-final="review">Skill to Review <b>${esc(c.weakest ? areaLabel(c.weakest) : '—')}</b></p>
      ${c.exam == null ? '<button type="button" class="bigBtn" data-action="go" data-href="#pkfadv/exam">TAKE THE EXAM</button>' : ''}
      <button type="button" class="bigBtn alt" data-action="go" data-href="#pkfadv">Course home</button>
    </div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage pkfadvPage" data-pkfadv-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkfadv">‹ Back</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all ${SECTIONS.length} sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkfadv">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfAdvScreen(ctx, args) {
  let lite = null;
  const a0 = args?.[0] ? String(args[0]) : '';
  const kind = !a0 || a0 === 'home' ? 'list' : a0 === 'exam' ? 'exam' : a0 === 'complete' ? 'complete' : a0 === 'rerun' ? 'rerun'
    : REVIEW_KINDS.includes(a0) ? a0 : a0 === 'lesson' ? 'single' : 'section';
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
    if (kind === 'complete') return paint(completeHTML(state0));
    if (kind === 'exam') {
      const examReal = examUnlocked(state0);
      if (!examReal && !devBypass()) return paint(lockedExamHTML());
      const next = examReal ? startExam(state0) : previewExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = courseOf(state).current;
      if (!cur || cur.mode !== 'exam') return paint(listHTML(state));
      return playOrResults(state);
    }
    if (kind === 'rerun') {
      const cur = courseOf(state0).current;
      if (!cur || cur.mode !== 'rerun') return paint(listHTML(state0));
      return playOrResults(state0);
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
    const pan = ctx.root.querySelector?.('[data-pkfadv-pan]');
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
    frame._pkfadvReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkfadv-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkfadv-clear': (s) => clearBuild(s),
    'pkfadv-hint': (s) => showHint(s),
    'pkfadv-lock': (s) => lockAnswer(s),
    'pkfadv-solution': (s) => showSolution(s),
    'pkfadv-ack': (s) => acknowledgeLearn(s),
    'pkfadv-shoot': (s) => beginShooting(s),
    'pkfadv-result': (s, el) => markResult(s, el.dataset.v),
    'pkfadv-skip': (s) => skipTableStep(s),
    'pkfadv-next': (s) => nextLesson(s),
    'pkfadv-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkfadv-retry': (s) => retryCurrent(s),
    'pkfadv-review-missed': (s) => reviewMissed(s, 'knowledge'),
    'pkfadv-practice-missed': (s) => reviewMissed(s, 'table')
  };

  function onAction(action, el) {
    if (action === 'pkfadv-enlarge') { lite = enlargeOverlay(el.dataset); render(); return true; }
    if (action === 'pkfadv-lite-close') { lite = null; render(); return true; }
    if (action === 'pkfadv-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkfadvReset?.(); return true; }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    const cur = courseOf(ctx.getState()).current;
    if ((action === 'pkfadv-review-missed' || action === 'pkfadv-practice-missed') && cur && cur.mode === 'rerun' && kind !== 'rerun') {
      if (typeof location !== 'undefined') { try { location.hash = '#pkfadv/rerun'; return true; } catch { /* headless */ } }
    }
    render();
    if (/^pkfadv-(next|view|retry|review|practice)/.test(action) && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
    return true;
  }

  return { render, onAction, destroy() {} };
}
