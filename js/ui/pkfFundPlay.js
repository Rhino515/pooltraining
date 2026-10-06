/**
 * PKF Fundamentals Course screen (#pkffund, #pkffund/<section>, #pkffund/exam, #pkffund/run).
 * LEARN → SEE → UNDERSTAND → CHECK → SET UP → PRACTICE → SELF-EVALUATE.
 * Knowledge checks lock before the PKF answer is revealed; physical practice is self-evaluated and never gates.
 * Dev Mode (devBypass) opens locked sections/exam as DEV PREVIEW (nothing saved).
 * Image viewer follows the PKF Banking / Cue Ball Control viewer (height-based crop math), plus
 * pointer pinch-zoom, pan, RESET and VIEW FULL PKF PAGE.
 */
import {
  COURSE_TITLE, EXAM_TITLE, SECTIONS, AREAS, EXAM_ITEMS, KNOWLEDGE_PASS, EXAM_PASS, ASSIST, LTYPE,
  courseOf, sectionUnlocked, examUnlocked, sectionRecord, lessonsFor, lessonById, isKnowledge, ratingSet,
  startSection, startExam, previewSection, previewExam, startReview, startSingle, reviewIds, needsPracticeIds,
  selectChoice, seqTap, seqUndo, seqClear, showHint, lockAnswer, acknowledgeLearn, toggleCheck, toggleVariant, rate,
  toggleNeedsPractice, nextLesson, viewLesson, retryCurrent, reviewMissed, progressSummary, lessonCompleted,
  figureHTML, revealFigureHTML, assetOf
} from '../content/pkfFundamentalsCourse.js';
import { devBypass } from '../dev/gate.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (x) => `${Math.round((x || 0) * 100)}%`;

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock, no practice log.</p>' : '';
}

/** Lightbox on the original JPEG. d = crop dataset; full = show the whole PKF page. */
function enlargeOverlay(d, full) {
  const v = full ? { cx: 0, cy: 0, cw: 1, ch: 1 } : { cx: Number(d.cx) || 0, cy: Number(d.cy) || 0, cw: Number(d.cw) || 1, ch: Number(d.ch) || 1 };
  const ar = (v.cw * (Number(d.w) || 807)) / (v.ch * (Number(d.h) || 1152));
  return `<div class="pkfLite pkfbLite pkffLite" data-pkff-lite="1" data-full="${full ? 1 : 0}" role="dialog" aria-label="PKF original page">
    <div class="pkfLiteBar pkffLiteBar">
      ${d.nofull ? '' : (full ? '<button type="button" class="chip" data-action="pkff-lite-crop">FIGURE ONLY</button>' : '<button type="button" class="chip" data-action="pkff-lite-full">VIEW FULL PKF PAGE</button>')}
      <button type="button" class="chip" data-action="pkff-lite-reset">RESET</button>
      <button type="button" class="chip" data-action="pkff-lite-close">CLOSE</button>
    </div>
    <div class="pkfLitePan pkfbPan" data-pkff-pan="1">
      <div class="pkfbLiteFrame" style="--cx:${v.cx};--cy:${v.cy};--cw:${v.cw};--ch:${v.ch};--ar:${ar.toFixed(4)}"><img src="${esc(d.src)}" alt="PKF original page" draggable="false"/></div>
    </div>
    <p class="muted small pkfLiteHint">Pinch to zoom, drag to pan. Original PKF page, not redrawn.</p>
  </div>`;
}

function flowHTML(stage) {
  return `<p class="pkfbFlow pkffFlow" aria-label="Lesson steps">${['LEARN', 'SEE', 'UNDERSTAND', 'CHECK', 'SET UP', 'PRACTICE', 'SELF-EVALUATE'].map((s) => `<span class="${stage.includes(s) ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}</p>`;
}

const labelOf = (lesson, v) => (lesson.choices || []).find((c) => c[0] === v)?.[1] ?? v;
const seqLabel = (lesson, k) => (lesson.seq?.items || []).find((i) => i[0] === k)?.[1] ?? k;

function choicesHTML(lesson, it) {
  const locked = !!it?.locked;
  return `<div class="pkfChoices pkfbChoices" role="group" aria-label="Answers">${lesson.choices.map(([v, label]) => {
    const on = it?.choice === v;
    const cls = locked ? (v === lesson.answer ? ' is-right' : (on ? ' is-wrong' : '')) : (on ? ' active' : '');
    return `<button type="button" class="bigBtn alt pkfbChoice${cls}" data-action="pkff-choice" data-v="${esc(v)}" ${locked ? 'disabled' : ''} aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('')}</div>`;
}

function seqHTML(lesson, it, live) {
  const picked = it?.seq || [];
  const locked = !!it?.locked;
  const order = (lesson.seq.shown || lesson.seq.items.map((i) => i[0]));
  const list = picked.length
    ? `<ol class="pkffSeqPicked" data-pkff-seq="${esc(picked.join(' '))}">${picked.map((k, i) => {
      const cls = locked ? (lesson.seq.answer[i] === k ? ' is-right' : ' is-wrong') : '';
      return `<li class="${cls.trim()}">${esc(seqLabel(lesson, k))}</li>`;
    }).join('')}</ol>`
    : '<p class="muted small pkffSeqEmpty">Tap the steps below in order.</p>';
  const pool = locked ? '' : `<div class="pkfChoices pkfbChoices pkffSeqPool">${order.map((k) => {
    const used = picked.includes(k);
    return `<button type="button" class="bigBtn alt pkfbChoice${used ? ' used' : ''}" data-action="pkff-seq" data-v="${esc(k)}" ${used || !live ? 'disabled' : ''}>${esc(seqLabel(lesson, k))}</button>`;
  }).join('')}</div>${live && picked.length ? '<div class="pkffRow"><button type="button" class="chip" data-action="pkff-seq-undo">UNDO</button><button type="button" class="chip" data-action="pkff-seq-clear">CLEAR</button></div>' : ''}`;
  const pkf = locked ? `<div class="card pkffSeqPkf"><b>PKF SEQUENCE</b><ol>${lesson.seq.answer.map((k) => `<li>${esc(seqLabel(lesson, k))}</li>`).join('')}</ol></div>` : '';
  return `<div class="card pkffSeq"><b>YOUR ORDER</b>${list}</div>${pool}${pkf}`;
}

function solutionCard(lesson, label = 'PKF EXPLANATION') {
  return `<div class="card pkfSol pkfbSol" data-pkff-sol="1"><b>${esc(label)}</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>`;
}

function practiceHTML(lesson, it, live, cur) {
  const base = lesson.practice || lessonById(lesson.practiceLesson)?.practice || {};
  const ratings = ratingSet(lesson);
  const checks = lesson.physical ? [] : (base.checks || []);
  const variants = lesson.physical ? [] : (base.variants || []);
  const done = !!it?.done;
  const setup = `<div class="card pkffSetup"><b>SET UP</b><p>${esc(lesson.physical ? lesson.prompt : base.setup || '')}</p></div>`;
  const focus = (base.focus || []).length
    ? `<div class="card pkffFocus"><b>PKF FOCUS</b><ul>${base.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>${base.pkfNote ? `<p class="muted small pkffNote">${esc(base.pkfNote)}</p>` : ''}</div>` : '';
  const chip = (act, list, [k, label]) => {
    const on = (list || []).includes(k);
    return `<button type="button" class="chip pkffChip${on ? ' on' : ''}" data-action="${act}" data-v="${esc(k)}" aria-pressed="${on ? 'true' : 'false'}" ${done || !live ? 'disabled' : ''}>${esc(label)}</button>`;
  };
  const varHTML = variants.length ? `<div class="card pkffVariants"><b>WHAT I PRACTICED</b><div class="pkffChips">${variants.map((v) => chip('pkff-variant', it?.variants, v)).join('')}</div></div>` : '';
  const chkHTML = checks.length ? `<div class="card pkffChecks"><b>I NOTICED (PKF’s issues)</b><p class="muted small">Optional. Tap any you noticed.</p><div class="pkffChips">${checks.map((c) => chip('pkff-check', it?.checks, c)).join('')}</div></div>` : '';
  const pick = ratings.find((r) => r[0] === it?.rating);
  const rateHTML = done
    ? `<p class="${pick && !pick[2] ? 'green' : 'warn'} pkfVerdict" data-pkff-rating="${esc(it.rating)}"><b>${esc(pick?.[1] || '')}</b>${pick?.[2] ? ' · added to NEEDS PRACTICE. Keep working; this never fails you.' : ' · session logged.'}</p>`
    : (live ? `<div class="card pkffRate" data-pkff-rate="1"><b>SELF-EVALUATE</b>${ratings.map(([k, label, np]) => `<button type="button" class="bigBtn${np ? ' alt' : ''}" data-action="pkff-rate" data-v="${esc(k)}">${esc(label)}</button>`).join('')}</div>` : '');
  const note = '<p class="muted small pkffHonest">Your own judgment: the app does not check your mechanics. Struggling here never fails a section.</p>';
  return `${setup}${focus}${varHTML}${chkHTML}${rateHTML}${done ? solutionCard(lesson, 'PKF') : ''}${note}`;
}

function playHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const exam = cur.mode === 'exam';
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const id = cur.order[view];
  const lesson = lessonById(id);
  const it = cur.items[id] || {};
  const section = SECTIONS.find((s) => s.id === (exam ? lesson.section : (cur.sectionId || lesson.section)));
  const live = view === cur.cursor && cur.phase === 'play';
  const know = isKnowledge(lesson);
  const asset = assetOf(lesson.id);
  let stage = ['LEARN', 'SEE', 'UNDERSTAND'];
  let body = '';

  if (lesson.type === 'LEARN') {
    body = `<div class="card pkfbLearn"><b>WHAT PKF SHOWS</b><p>${esc(lesson.explain || '')}</p><p class="muted small">${esc(lesson.src || '')}</p></div>
      ${lesson.watch ? `<div class="card pkffWatch"><b>WHAT TO WATCH</b><p>${esc(lesson.watch)}</p></div>` : ''}
      ${live && !it.done ? '<button type="button" class="bigBtn" data-action="pkff-ack">GOT IT</button>' : ''}`;
  } else if (know && !it.locked) {
    stage = ['SEE', 'CHECK'];
    let hint = '';
    if (lesson.hint && lesson.assist === ASSIST.GUIDED) hint = `<p class="card pkfbHint" data-pkff-hint="1"><b>GUIDED</b> ${esc(lesson.hint)}</p>`;
    else if (lesson.hint && lesson.assist === ASSIST.ASSISTED) {
      hint = it.hint ? `<p class="card pkfbHint" data-pkff-hint="1"><b>HINT</b> ${esc(lesson.hint)}</p>`
        : (live ? '<button type="button" class="chip pkfbHintBtn" data-action="pkff-hint">SHOW HINT</button>' : '');
    }
    const ready = lesson.type === 'SEQUENCE' ? (it.seq || []).length === lesson.seq.items.length : it.choice != null;
    body = `${hint}${lesson.type === 'SEQUENCE' ? seqHTML(lesson, it, live) : choicesHTML(lesson, it)}
      ${live ? `<button type="button" class="bigBtn" data-action="pkff-lock" ${ready ? '' : 'disabled'}>LOCK ANSWER</button>
      <p class="muted small">Lock first. PKF’s answer stays hidden until you do.</p>` : ''}`;
  } else if (know && it.locked) {
    stage = ['CHECK', 'UNDERSTAND'];
    const verdict = it.correct
      ? '<p class="green pkfVerdict" data-pkff-verdict="right"><b>Correct</b></p>'
      : (lesson.type === 'SEQUENCE'
        ? '<p class="warn pkfVerdict" data-pkff-verdict="wrong"><b>Review This Concept.</b> Compare your order with PKF’s.</p>'
        : `<p class="warn pkfVerdict" data-pkff-verdict="wrong"><b>Review This Concept.</b> PKF: ${esc(labelOf(lesson, lesson.answer))}</p>`);
    body = `${lesson.type === 'SEQUENCE' ? seqHTML(lesson, it, false) : choicesHTML(lesson, it)}${verdict}${solutionCard(lesson)}${revealFigureHTML(lesson.id)}
      ${!it.correct && !cur.dev && !exam ? '<p class="muted small">Added to REVIEW FUNDAMENTALS.</p>' : ''}`;
  } else if (lesson.type === 'PRACTICE') {
    stage = it.done ? ['SELF-EVALUATE'] : ['SET UP', 'PRACTICE'];
    body = practiceHTML(lesson, it, live, cur);
    const np = course.needsPractice?.[lesson.practiceLesson || lesson.id];
    if (it.done && !cur.dev && !lesson.physical) {
      body += `<button type="button" class="chip pkffNpToggle" data-action="pkff-np" data-v="${esc(lesson.id)}">${np ? 'REMOVE FROM NEEDS PRACTICE' : 'MARK NEEDS PRACTICE'}</button>`;
    }
  }
  if (live && it.done) body += `<button type="button" class="bigBtn" data-action="pkff-next">${cur.cursor >= cur.order.length - 1 ? 'FINISH' : 'NEXT'}</button>`;
  if (!live) body += `<button type="button" class="bigBtn alt" data-action="pkff-view" data-i="${cur.cursor}">Back to ${exam ? 'item' : 'lesson'} ${cur.cursor + 1}</button>`;

  const eyebrow = exam ? EXAM_TITLE.toUpperCase()
    : cur.mode === 'review' ? 'REVIEW FUNDAMENTALS'
    : cur.mode === 'needs' ? 'NEEDS PRACTICE'
    : cur.mode === 'single' ? 'REPLAY LESSON'
    : `PKF FUNDAMENTALS · ${section?.area === 'bridges' ? 'BRIDGES / STANCES' : 'FUNDAMENTALS'}`;
  const h1 = exam ? (lesson.title || EXAM_TITLE) : (section?.title || COURSE_TITLE);
  const kind = LTYPE[lesson.type] || lesson.type;
  const meta = `${exam ? 'Item' : 'Lesson'} ${view + 1} of ${cur.order.length}${lesson.assist && !exam ? ` · ${lesson.assist}` : ''} · ${kind}`;
  const prev = view > 0 ? `<button type="button" class="chip pkfbPrev" data-action="pkff-view" data-i="${view - 1}">‹ Previous</button>` : '';
  const hideFig = know && !it.locked && asset?.textOnlyUntilLock;
  const preLock = know && !it.locked;
  const fig = know && asset?.textOnlyUntilLock
    ? (it.locked ? '' : figureHTML(lesson.id, { hideUntilLock: true }))
    : figureHTML(lesson.id, { alt: lesson.title || 'PKF original page', noFull: preLock, hideUntilLock: hideFig, withAlso: lesson.type === 'LEARN' || lesson.type === 'PRACTICE' });
  const backHref = '#pkffund';
  return `<div class="playScreen kickPage pkfbPage pkffPage" data-pkff-play="1" data-mode="${esc(cur.mode)}" data-lesson="${esc(lesson.id)}" data-type="${esc(lesson.type)}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="${backHref}">‹ Back</button><span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1><p class="kickMeta">${esc(meta)}</p></div>
    ${devPreviewNote(cur)}
    ${flowHTML(stage)}
    <div class="card pkfPrompt pkfbPrompt"><b>${esc(kind)} · ${esc(String(lesson.title || '').replace(/^Practice This: /, ''))}</b><p>${esc(lesson.prompt || '')}</p></div>
    ${fig}
    ${body}
    ${prev}
  </div>`;
}

function sectionTitle(id) { return SECTIONS.find((s) => s.id === id)?.title || id; }

function resultsHTML(state) {
  const course = courseOf(state);
  const cur = course.current;
  const sum = cur.summary || {};
  const exam = cur.mode === 'exam';
  const graded = !!sum.graded;
  const head = exam ? EXAM_TITLE : (cur.mode === 'review' ? 'REVIEW FUNDAMENTALS' : cur.mode === 'needs' ? 'NEEDS PRACTICE' : COURSE_TITLE);
  const title = !graded ? 'Review complete'
    : exam ? (sum.passed ? 'PASS' : 'REVIEW')
    : (sum.passed ? 'Section complete' : 'Section: review and retry');
  const missedList = sum.missed?.length
    ? `<div class="kickHist" data-pkff-missed="1"><b>${exam ? 'Concepts to Review' : 'Missed checks'}</b>${sum.missed.map((id) => `<p>${esc(lessonById(id)?.concept || lessonById(id)?.title || id)} · ${esc(lessonById(id)?.src || '')}</p>`).join('')}</div>` : '';
  const masteredList = exam && sum.mastered?.length
    ? `<details class="kickHist"><summary><b>Concepts Mastered (${sum.mastered.length})</b></summary>${sum.mastered.map((id) => `<p>${esc(lessonById(id)?.concept || id)}</p>`).join('')}</details>` : '';
  const recommend = exam && sum.recommend?.length
    ? `<div class="kickHist" data-pkff-recommend="1"><b>Recommended Review</b>${sum.recommend.map((sid) => `<p>${esc(sectionTitle(sid))} · PKF pages ${esc(SECTIONS.find((s) => s.id === sid)?.pages || '')}</p>`).join('')}</div>` : '';
  const history = exam && graded && course.exam.history?.length
    ? `<div class="kickHist" data-pkff-history="1"><b>Attempt History</b>${course.exam.history.slice().reverse().map((h) => `<p>${esc(new Date(h.at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} PT · Knowledge ${h.knowledge}% · Physical ${esc(h.physical)} · Overall ${h.overall}% · ${h.passed ? 'PASS' : 'REVIEW'}</p>`).join('')}</div>` : '';
  const passLine = exam
    ? `Pass rule (app): ${Math.round(EXAM_PASS * 100)}% knowledge. Physical checkpoints are self-confirmed and never fail the exam.`
    : graded ? `Unlock rule (app): ${Math.round(KNOWLEDGE_PASS * 100)}% on knowledge checks. Self-evaluations never block progress.` : 'Review runs don’t change saved section or exam results.';
  const stats = exam
    ? `<p data-pkff-knowledge="${Math.round((sum.kRate || 0) * 100)}"><b>Knowledge Score</b> ${sum.kOk || 0} / ${sum.kTot || 0} (${pct(sum.kRate)})</p>
       <p><b>Concepts Mastered</b> ${sum.mastered?.length || 0} · <b>Concepts to Review</b> ${sum.missed?.length || 0}</p>
       <p><b>Physical Practice Completed</b> ${sum.xDone || 0} / ${sum.xTot || 0}</p>
       <p><b>Overall</b> ${pct(sum.overall)}</p>
       <p class="pkffBig ${sum.passed ? 'green' : 'warn'}" data-pkff-exam-verdict="${sum.passed ? 'pass' : 'review'}"><b>${sum.passed ? 'PASS' : 'REVIEW'}</b></p>
       ${graded ? `<p><b>Best Score</b> ${pct(course.exam.bestKnowledge)} knowledge · ${pct(course.exam.bestOverall)} overall</p>` : ''}`
    : `<p><b>Knowledge checks</b> ${sum.kOk || 0} / ${sum.kTot || 0}${sum.kTot ? ` (${pct(sum.kRate)})` : ''}</p>
       ${sum.xTot ? `<p><b>Practice self-evaluations</b> ${sum.xDone} comfortable/completed of ${sum.xTot}</p>` : ''}
       ${graded ? `<p class="${sum.passed ? 'green' : 'warn'}"><b>${sum.passed ? 'PASSED' : 'NOT YET'}</b></p>` : ''}`;
  const reviewBtn = sum.missed?.length ? '<button type="button" class="bigBtn alt" data-action="pkff-review-missed">REVIEW MISSED NOW</button>' : '';
  const retryLabel = !graded ? 'RUN AGAIN' : sum.passed ? 'REPLAY' : 'RETRY';
  return `<div class="playScreen kickPage pkfbPage pkffPage" data-pkff-results="1" data-mode="${esc(cur.mode)}" data-passed="${sum.passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkffund">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(exam ? `${EXAM_TITLE}: ${title}` : title)}</h1></div>
    ${devPreviewNote(cur)}
    <div class="card pkffResults">
      ${stats}
      <p class="muted small">${esc(passLine)}</p>
      ${missedList}${recommend}${masteredList}
      ${reviewBtn}
      ${cur.mode === 'single' ? '' : `<button type="button" class="bigBtn" data-action="pkff-retry">${retryLabel}</button>`}
      <button type="button" class="bigBtn alt" data-action="go" data-href="#pkffund">Back to ${esc(COURSE_TITLE)}</button>
      ${history}
    </div>
  </div>`;
}

function itemButton(id, kind) {
  const l = lessonById(id);
  if (!l) return '';
  return `<button type="button" class="chip pkffItem" data-action="pkff-single" data-v="${esc(id)}" data-kind="${esc(kind)}">${esc(l.title)} <small class="muted">${esc(l.src || '')}</small></button>`;
}

function progressCard(state) {
  const p = progressSummary(state);
  const cell = (label, v, attr = '') => `<div class="pkffStat"${attr}><b>${v}</b><small>${esc(label)}</small></div>`;
  return `<div class="card pkffProg" data-pkff-progress="1">
    <b>COURSE PROGRESS</b>
    <div class="pkffStats">
      ${cell('Lessons completed', `${p.lessonsDone}/${p.lessonsTotal}`, ` data-pkff-lessons="${p.lessonsDone}"`)}
      ${cell('Concept checks', `${p.checksDone}/${p.checksTotal}`)}
      ${cell('First-answer accuracy', p.firstAccuracy == null ? '—' : pct(p.firstAccuracy))}
      ${cell('Fundamentals mastered', `${p.fundamentalsMastered}/${p.fundamentalsTotal}`)}
      ${cell('Sections passed', `${p.sectionsPassed}/${p.sectionsTotal}`)}
      ${cell('Bridges practiced', `${p.bridgesPracticed}/${p.bridgesTotal}`)}
      ${cell('Stance & stroke lessons', `${p.stanceStrokeDone}/${p.stanceStrokeTotal}`)}
      ${cell('Practice sessions', p.practiceSessions)}
      ${cell('Marked Needs Practice', p.needsPractice)}
      ${cell('Exam attempts', p.examAttempts)}
      ${cell('Exam best', p.examAttempts ? pct(p.examBest) : '—')}
    </div>
  </div>`;
}

function listHTML(state) {
  const course = courseOf(state);
  const dev = devBypass();
  const sectionRow = (sec) => {
    const real = sectionUnlocked(state, sec.id);
    const open = real || dev;
    const rec = sectionRecord(course, sec.id);
    const ls = lessonsFor(sec.id);
    const doneN = ls.filter((l) => lessonCompleted(course, l.id)).length;
    const tag = rec?.passed ? 'Passed'
      : rec ? `Best ${pct(rec.bestKnowledge)} on checks`
      : real ? 'Open' : open ? 'Locked · Dev preview' : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : String(sec.n);
    const href = open ? `#pkffund/${sec.id}` : '#pkffund';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}${rec?.passed ? ' passed' : ''}" data-action="go" data-href="${href}" ${open ? '' : 'disabled'} data-pkff-section="${esc(sec.id)}"${!real && open ? ' data-dev-open="1"' : ''}><span class="srNum">${mark}</span><span class="srMain"><b>${esc(sec.title)}</b><small>PKF pages ${esc(sec.pages)} · ${ls.length} lessons${doneN ? ` · ${doneN} done` : ''} · ${esc(tag)}</small><small class="muted">${esc(sec.blurb)}</small></span></button>`;
  };
  const areas = AREAS.map((a) => `<div class="pkffArea" data-pkff-area="${esc(a.id)}"><p class="eyebrow pkffAreaHead">${esc(a.title.toUpperCase())}</p><p class="muted small pkffAreaNote">${esc(a.note)}</p>${SECTIONS.filter((s) => s.area === a.id).map(sectionRow).join('')}</div>`).join('');
  const examReal = examUnlocked(state);
  const examOpen = examReal || dev;
  const nK = EXAM_ITEMS.filter(isKnowledge).length;
  const nX = EXAM_ITEMS.length - nK;
  const examBtn = examOpen
    ? `<button type="button" class="stageRow card${course.exam.passed ? ' passed' : ''}" data-action="go" data-href="#pkffund/exam" data-pkff-exam="1"${examReal ? '' : ' data-dev-open="1"'}><span class="srNum">${examReal ? (course.exam.passed ? '✓' : '★') : '🔓'}</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>${nK} knowledge items + ${nX} physical checkpoints. Pass at ${Math.round(EXAM_PASS * 100)}% knowledge.${examReal ? '' : ' Dev preview.'}${course.exam.attempts ? ` Best ${pct(course.exam.bestKnowledge)}.` : ''}</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-pkff-exam="1" data-pkff-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${SECTIONS.length} sections are passed.</small></span></button>`;
  const rv = reviewIds(course);
  const np = needsPracticeIds(course);
  const lists = `<div class="card pkffLists">
    <div class="pkffListBlock" data-pkff-review-list="${rv.length}"><b>REVIEW FUNDAMENTALS</b><p class="muted small">${rv.length ? `${rv.length} missed check${rv.length === 1 ? '' : 's'}. Answer correctly to clear.` : 'No missed checks.'}</p>
      ${rv.length ? `<button type="button" class="bigBtn alt" data-action="pkff-review" data-v="review">REVIEW FUNDAMENTALS (${rv.length})</button><div class="pkffItems">${rv.map((id) => itemButton(id, 'review')).join('')}</div>` : ''}</div>
    <div class="pkffListBlock" data-pkff-needs-list="${np.length}"><b>NEEDS PRACTICE</b><p class="muted small">${np.length ? `${np.length} skill${np.length === 1 ? '' : 's'} you marked. Rate COMFORTABLE or COMPLETED to clear.` : 'Nothing marked.'}</p>
      ${np.length ? `<button type="button" class="bigBtn alt" data-action="pkff-review" data-v="needs">PRACTICE NOW (${np.length})</button><div class="pkffItems">${np.map((id) => itemButton(id, 'needs')).join('')}</div>` : ''}</div>
  </div>`;
  const completed = SECTIONS.map((s) => {
    const ids = lessonsFor(s.id).filter((l) => lessonCompleted(course, l.id)).map((l) => l.id);
    return ids.length ? `<p class="small pkffReplayHead">${esc(s.title)}</p><div class="pkffItems">${ids.map((id) => itemButton(id, 'replay')).join('')}</div>` : '';
  }).join('');
  const replay = completed ? `<details class="card ruleMore pkffReplay" data-pkff-replay="1"><summary>Replay a completed lesson</summary>${completed}</details>` : '';
  return `<div class="playScreen kickPage pkfbPage pkffPage" data-pkff-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>From PKF Fundamentals. Every lesson uses the original PKF pages. Sections unlock at ${Math.round(KNOWLEDGE_PASS * 100)}% on knowledge checks.</p></div>
    <details class="ruleMore"><summary>How each lesson works</summary><ol class="gameSteps">
      <li>LEARN and SEE on the original PKF page. Tap a figure to enlarge, pinch to zoom, or view the full page.</li>
      <li>UNDERSTAND what PKF is teaching and why.</li>
      <li>CHECK: identify the position, choose what’s important, or put PKF’s steps in order. LOCK ANSWER first; PKF’s answer stays hidden until you do.</li>
      <li>SET UP and PRACTICE on your table using PKF’s reference.</li>
      <li>SELF-EVALUATE honestly. The app doesn’t check mechanics, and a skill that needs more work never fails you.</li>
      <li>Pass every section on knowledge checks, then take the exam.</li>
    </ol></details>
    ${progressCard(state)}
    ${lists}
    <div class="stageList" data-pkff-sections="1">${areas}<div class="pkffArea"><p class="eyebrow pkffAreaHead">EXAM</p>${examBtn}</div></div>
    ${replay}
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage pkfbPage pkffPage" data-pkff-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#pkffund">‹ Back</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all ${SECTIONS.length} sections are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#pkffund">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createPkfFundScreen(ctx, args) {
  let liteData = null;
  let liteFull = false;
  const a0 = args?.[0];
  const kind = !a0 || a0 === 'home' ? 'list' : a0 === 'exam' ? 'exam' : a0 === 'run' ? 'run' : 'section';
  const sectionId = kind === 'section' ? String(a0) : '';

  function paint(html) {
    ctx.root.innerHTML = html + (liteData ? enlargeOverlay(liteData, liteFull) : '');
    bindLite();
  }

  function runHTML(state) {
    const cur = courseOf(state).current;
    return cur?.phase === 'results' ? resultsHTML(state) : playHTML(state);
  }

  function render() {
    const state0 = ctx.getState();
    if (kind === 'list') return paint(listHTML(state0));
    if (kind === 'run') {
      const cur = courseOf(state0).current;
      if (!cur) return paint(listHTML(state0));
      return paint(runHTML(state0));
    }
    if (kind === 'exam') {
      const examReal = examUnlocked(state0);
      if (!examReal && !devBypass()) return paint(lockedExamHTML());
      const next = examReal ? startExam(state0) : previewExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = courseOf(state).current;
      if (!cur || cur.mode !== 'exam') return paint(listHTML(state));
      return paint(runHTML(state));
    }
    if (!SECTIONS.some((s) => s.id === sectionId)) return paint(listHTML(state0));
    const secReal = sectionUnlocked(state0, sectionId);
    if (!secReal && !devBypass()) return paint(listHTML(state0));
    const next = secReal ? startSection(state0, sectionId) : previewSection(state0, sectionId);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = courseOf(state).current;
    if (!cur || cur.mode !== 'section' || cur.sectionId !== sectionId) return paint(listHTML(state));
    paint(runHTML(state));
  }

  /** One pointer pans, two pointers pinch-zoom (plus wheel zoom on desktop). Aspect ratio fixed by --ar. */
  function bindLite() {
    const pan = ctx.root.querySelector?.('[data-pkff-pan]');
    const frame = pan?.querySelector?.('.pkfbLiteFrame');
    if (!pan || !frame) return;
    let scale = 1, x = 0, y = 0;
    const pts = new Map();
    let pinch = null;
    const apply = () => { frame.style.transform = `translate(${x}px,${y}px) scale(${scale})`; };
    const clamp = (s) => Math.max(1, Math.min(6, s));
    const dist = () => { const [p, q] = [...pts.values()]; return Math.hypot(p.x - q.x, p.y - q.y); };
    apply();
    pan.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      pan.setPointerCapture?.(e.pointerId);
      if (pts.size === 2) pinch = { d: dist(), s: scale };
    });
    pan.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && pinch) {
        const d = dist();
        if (pinch.d > 0) scale = clamp(pinch.s * (d / pinch.d));
      } else if (pts.size === 1) {
        x += dx; y += dy;
      }
      if (scale === 1 && pts.size >= 2) { x = 0; y = 0; }
      apply();
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; };
    pan.addEventListener('pointerup', up);
    pan.addEventListener('pointercancel', up);
    pan.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = clamp(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
      if (scale === 1) { x = 0; y = 0; }
      apply();
    }, { passive: false });
    pan.addEventListener('dblclick', () => { if (scale > 1) { scale = 1; x = 0; y = 0; } else scale = 2.5; apply(); });
    frame._pkffReset = () => { scale = 1; x = 0; y = 0; apply(); };
  }

  const STEP = {
    'pkff-choice': (s, el) => selectChoice(s, el.dataset.v),
    'pkff-seq': (s, el) => seqTap(s, el.dataset.v),
    'pkff-seq-undo': (s) => seqUndo(s),
    'pkff-seq-clear': (s) => seqClear(s),
    'pkff-hint': (s) => showHint(s),
    'pkff-lock': (s) => lockAnswer(s),
    'pkff-ack': (s) => acknowledgeLearn(s),
    'pkff-check': (s, el) => toggleCheck(s, el.dataset.v),
    'pkff-variant': (s, el) => toggleVariant(s, el.dataset.v),
    'pkff-rate': (s, el) => rate(s, el.dataset.v),
    'pkff-np': (s, el) => toggleNeedsPractice(s, el.dataset.v),
    'pkff-next': (s) => nextLesson(s),
    'pkff-view': (s, el) => viewLesson(s, Number(el.dataset.i)),
    'pkff-retry': (s) => retryCurrent(s),
    'pkff-review-missed': (s) => reviewMissed(s)
  };
  const GO_RUN = {
    'pkff-review': (s, el) => startReview(s, el.dataset.v === 'needs' ? 'needs' : 'review'),
    'pkff-single': (s, el) => startSingle(s, el.dataset.v, { dev: devBypass() })
  };

  function toTop() {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch { /* headless */ }
    }
  }

  function onAction(action, el) {
    if (action === 'pkff-enlarge') { liteData = { ...el.dataset }; liteFull = el.dataset.full === '1'; render(); return true; }
    if (action === 'pkff-lite-close') { liteData = null; liteFull = false; render(); return true; }
    if (action === 'pkff-lite-full') { if (liteData && !liteData.nofull) { liteFull = true; render(); } return true; }
    if (action === 'pkff-lite-crop') { liteFull = false; render(); return true; }
    if (action === 'pkff-lite-reset') { ctx.root.querySelector?.('.pkfbLiteFrame')?._pkffReset?.(); return true; }
    if (GO_RUN[action]) {
      const s0 = ctx.getState();
      const s1 = GO_RUN[action](s0, el);
      if (s1 === s0) return true;
      ctx.commit(s1);
      if (kind === 'run') render();
      else if (typeof ctx.go === 'function') ctx.go('#pkffund/run');
      else render();
      toTop();
      return true;
    }
    const fn = STEP[action];
    if (!fn) return false;
    const s0 = ctx.getState();
    const s1 = fn(s0, el);
    if (s1 !== s0) ctx.commit(s1);
    if (action === 'pkff-review-missed' && kind !== 'run' && s1 !== s0 && typeof ctx.go === 'function') { ctx.go('#pkffund/run'); toTop(); return true; }
    render();
    if (/^pkff-(next|view|retry|review)/.test(action)) toTop();
    return true;
  }

  return { render, onAction, destroy() {} };
}
