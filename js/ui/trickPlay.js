/**
 * Trick Shot Course screen. The player shoots on a real table and taps make or miss.
 * No shot simulation and no Career XP.
 * A shot is done after 3 makes. Misses do not fail the level and do not block the next one.
 */
import {
  COURSE_TITLE, EXAM_TITLE, PASS_RULE, LEVELS, TRICK_SCORE,
  levelUnlocked, levelPassed, levelRecord, examUnlocked, readCourse,
  startLevel, startExam, trickTap, trickUndo, trickView, trickPractice, trickReplay,
  shotsInRun, runMax, scoreRun, diagramHTML, cueGraphicHTML, howToHTML, solutionText, starsHTML,
  previewLevel, previewExam
} from '../content/trickShotCourse.js';
import { devBypass } from '../dev/gate.js';

function devPreviewNote(cur) {
  return cur?.dev ? '<p class="card devBanner" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing is saved: no score, no unlock.</p>' : '';
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function dotHTML(attempts) {
  const marks = attempts?.length ? attempts.map((a) => (a === 'make' ? 'make' : 'miss')) : ['empty', 'empty', 'empty'];
  return `<span class="kickDots" data-trick-dots="${esc(marks.join(' '))}">${marks.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}

function playHTML(state, showSolution) {
  const course = readCourse(state);
  const cur = course.current;
  const exam = cur.mode === 'exam' || cur.parent === 'exam';
  const shots = shotsInRun(cur);
  const peek = devBypass(); // Dev Mode ON: every shot in the run can be looked at
  const view = peek ? Math.min(cur.view ?? cur.cursor, cur.shots.length - 1) : Math.min(cur.view ?? cur.cursor, cur.cursor);
  const shot = shots[view];
  const slot = cur.shots[view];
  const live = view === cur.cursor && !((slot?.makes?.length || 0) >= TRICK_SCORE.makesRequired) && cur.phase === 'play';
  const running = scoreRun(cur);
  const title = exam ? EXAM_TITLE : (cur.mode === 'practice' && !cur.dev ? 'Practice' : LEVELS.find((l) => l.id === Number(cur.level))?.title);
  const row = cur.order.map((idx, i) => {
    const done = (cur.shots[i]?.makes?.length || 0) >= TRICK_SCORE.makesRequired;
    const locked = i > cur.cursor;
    const now = i === cur.cursor && cur.phase === 'play';
    const cls = locked ? 'is-lock' : now ? 'is-now' : done ? 'is-pass' : 'is-seen';
    const mark = locked ? '<span class="kickLock" aria-hidden="true">🔒</span>' : done ? '✓' : now ? '●' : '○';
    const name = shots[i]?.name || '';
    return `<button type="button" class="kickStation ${cls}" data-action="trick-view" data-i="${i}" aria-label="${esc(name)}" ${locked && !peek ? 'disabled' : ''}>${i + 1} ${mark}</button>`;
  }).join('');
  const makes = slot?.makes?.length || 0;
  const bonus = shot.bonus && shot.objective !== 'pocket-and-zone'
    ? `<label class="trickBonus"><input type="checkbox" data-trick-bonus> ${esc(shot.bonus.label)} (+${TRICK_SCORE.bonusPoints}, does not change the make)</label>`
    : '';
  const acts = live ? `<div class="kickActs">
      <button type="button" class="bigBtn" data-action="trick-tap" data-result="make">${esc(shot.makeLabel)}</button>
      <button type="button" class="bigBtn alt" data-action="trick-tap" data-result="miss">${esc(shot.missLabel)}</button>
      ${bonus}
      <button type="button" class="bigBtn alt" data-action="trick-undo">Undo</button>
    </div>` : (view !== cur.cursor ? `<button type="button" class="bigBtn alt" data-action="trick-view" data-i="${cur.cursor}">Back to ${esc(shots[cur.cursor]?.name || 'the current shot')}</button>` : '');
  return `<div class="playScreen kickPage" data-trick-play="1" data-trick-mode="${esc(cur.mode)}" data-level="${cur.level || 0}" data-trick-shot="${esc(shot.name)}"${cur.dev ? ' data-dev-preview="1"' : ''}>
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="${exam ? '#trick' : '#trick'}">‹ Back</button><span class="eyebrow">${esc(COURSE_TITLE.toUpperCase())}</span><h1>${esc(shot.name)}</h1><p>${esc(title)} ${starsHTML(shot.stars)}</p></div>
    ${devPreviewNote(cur)}
    <p class="trickPass">${esc(PASS_RULE)}</p>
    <p class="kickMeta">Score ${running.score} / ${runMax(cur)} · Makes ${makes} / ${TRICK_SCORE.makesRequired}</p>
    <div class="kickTable" data-trick-table>${diagramHTML(shot, { solution: showSolution })}</div>
    ${cueGraphicHTML(shot)}
    <div class="kickSolve"><button type="button" class="chip${showSolution ? ' active' : ''}" data-action="trick-solution" aria-pressed="${showSolution ? 'true' : 'false'}">${showSolution ? 'Hide solution' : 'Show Solution'}</button> ${dotHTML(slot?.attempts)} <span data-trick-makes>Makes ${makes} / ${TRICK_SCORE.makesRequired}</span></div>
    ${showSolution ? `<p class="kickFacts" data-trick-rails>${esc(solutionText(shot))}</p>` : ''}
    ${howToHTML(shot)}
    <div class="kickStations" data-trick-progress>${row}</div>
    ${acts}
    <p class="muted small">Shoot this on your table. A miss does not fail the level.</p>
  </div>`;
}

function resultsHTML(state) {
  const course = readCourse(state);
  const cur = course.current;
  const sum = cur.summary;
  const exam = cur.mode === 'exam' || cur.parent === 'exam';
  const practice = cur.mode === 'practice';
  const level = LEVELS.find((l) => l.id === Number(cur.level));
  const best = exam ? (course.exam?.best || sum.score) : (levelRecord(state, cur.level)?.best || sum.score);
  const rate = sum.attempts ? Math.round((sum.makes / sum.attempts) * 100) : 0;
  const misses = sum.missNames?.length ? sum.missNames.map(esc).join(', ') : 'none';
  const nxt = !exam && cur.mode === 'level' ? LEVELS.find((l) => l.id === Number(cur.level) + 1) : null;
  let next = '';
  if (!practice && nxt && levelUnlocked(state, nxt.id)) next = `<p class="green">NEXT LEVEL UNLOCKED</p><button type="button" class="bigBtn" data-action="go" data-href="#trick/${nxt.id}">NEXT LEVEL</button>`;
  if (!practice && !exam && !nxt && examUnlocked(state)) next = `<p class="green">All ${LEVELS.length} levels are passed. ${esc(EXAM_TITLE)} is unlocked.</p><button type="button" class="bigBtn" data-action="go" data-href="#trick/exam">OPEN ${esc(EXAM_TITLE).toUpperCase()}</button>`;
  const practiceBtn = !practice && sum.missNames?.length ? `<button type="button" class="bigBtn alt" data-action="trick-practice">Practice these</button>` : '';
  return `<div class="playScreen kickPage" data-trick-results="1" data-passed="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#trick">‹ Back</button><span class="eyebrow">${esc((exam ? EXAM_TITLE : COURSE_TITLE).toUpperCase())}</span><h1>${esc(exam ? EXAM_TITLE : (level?.title || COURSE_TITLE))}</h1></div>
    <div class="card">
      <p><b>PASS</b></p>
      <p>Score ${sum.score} / ${sum.max}</p>
      <p>Success rate ${rate}% (${sum.makes} makes / ${sum.attempts} attempts)</p>
      <p>First-try makes ${sum.first}</p>
      <p>Second-try makes ${sum.second}</p>
      <p>Third-try makes ${sum.third}</p>
      ${sum.later ? `<p>Makes after three misses ${sum.later}</p>` : ''}
      <p>Shots that had misses: ${misses}. None of them failed the level.</p>
      <p>Best score ${best}</p>
      ${cur.dev ? devPreviewNote(cur) : practice ? '<p class="muted">Practice only. Your saved score was not changed.</p>' : ''}
      ${next}
      ${practiceBtn}
      <button type="button" class="bigBtn" data-action="trick-replay">REPLAY</button>
    </div>
  </div>`;
}

function listHTML(state) {
  const passed = LEVELS.filter((l) => levelPassed(state, l.id)).length;
  const rows = LEVELS.map((level) => {
    const real = levelUnlocked(state, level.id);
    const open = real || devBypass(); // Dev Mode ON: locked levels open as a DEV PREVIEW
    const rec = levelRecord(state, level.id);
    const tag = rec?.passed ? `Passed · best ${rec.best}` : real ? 'Open' : open ? 'Locked · Dev preview' : 'Locked';
    const mark = !real ? (open ? '🔓' : '🔒') : rec?.passed ? '✓' : '●';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}" data-action="go" data-href="#trick/${level.id}" ${open ? '' : 'disabled'} data-trick-level="${level.id}"><span class="srNum">${mark}</span><span class="srMain"><b>${esc(level.title)}</b> ${starsHTML(level.stars)}<small>${esc(level.blurb)} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const examOpen = examUnlocked(state);
  const exam = examOpen
    ? `<button type="button" class="stageRow card" data-action="go" data-href="#trick/exam" data-trick-exam="1"><span class="srNum">●</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>8 shots. Make each one 3 times.</small></span></button>`
    : devBypass()
    ? `<button type="button" class="stageRow card" data-action="go" data-href="#trick/exam" data-trick-exam="1" data-trick-exam-locked="1" data-dev-open="1"><span class="srNum">🔓</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${LEVELS.length} levels are passed · Dev preview</small></span></button>`
    : `<button type="button" class="stageRow card locked" disabled data-trick-exam="1" data-trick-exam-locked="1"><span class="srNum">🔒</span><span class="srMain"><b>${esc(EXAM_TITLE)}</b><small>Locked until all ${LEVELS.length} levels are passed.</small></span></button>`;
  return `<div class="playScreen kickPage" data-trick-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>${PASS_RULE} ${LEVELS.length} levels, then the exam.</p></div>
    <div class="card"><p>${passed} of ${LEVELS.length} levels passed.</p><button type="button" class="bigBtn alt" data-action="go" data-href="#trick/stats">Course stats</button></div>
    <div class="stageList" data-trick-levels="1">${rows}${exam}</div>
  </div>`;
}

function statsHTML(state) {
  const course = readCourse(state);
  let first = 0, second = 0, third = 0, later = 0, attempts = 0, best = 0;
  for (const level of LEVELS) {
    const rec = course.levels[String(level.id)];
    if (!rec?.last) continue;
    first += rec.last.first || 0;
    second += rec.last.second || 0;
    third += rec.last.third || 0;
    later += rec.last.later || 0;
    attempts += rec.last.attempts || 0;
    best += rec.best || 0;
  }
  const line = (k, v) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
  const passed = LEVELS.filter((l) => levelPassed(state, l.id)).length;
  return `<div class="playScreen kickPage" data-trick-stats="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#trick">‹ ${esc(COURSE_TITLE)}</button><span class="eyebrow">${esc(COURSE_TITLE.toUpperCase())}</span><h1>Course stats</h1></div>
    <div class="card">
      ${line('First-try makes', first)}
      ${line('Second-try makes', second)}
      ${line('Third-try makes', third)}
      ${line('Makes after three misses', later)}
      ${line('Attempts on the last pass', attempts)}
      ${line('Best level scores', best)}
      ${line('Levels passed', `${passed} / ${LEVELS.length}`)}
      ${line('Exam', course.exam?.passed ? `Passed · best ${course.exam.best}` : 'Locked until every level is passed')}
    </div>
  </div>`;
}

function lockedExamHTML() {
  return `<div class="playScreen kickPage" data-trick-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#trick">‹ ${esc(COURSE_TITLE)}</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    <div class="card"><p>Locked until all ${LEVELS.length} levels are passed. ${esc(PASS_RULE)}</p><button type="button" class="bigBtn" data-action="go" data-href="#trick">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createTrickScreen(ctx, args) {
  let showSolution = false;
  const kind = !args[0] || args[0] === 'home' ? 'list' : args[0] === 'stats' ? 'stats' : args[0] === 'exam' ? 'exam' : 'level';
  const level = kind === 'level' ? Number(args[0]) : 0;

  function render() {
    const state0 = ctx.getState();
    if (kind === 'list') { ctx.root.innerHTML = listHTML(state0); return; }
    if (kind === 'stats') { ctx.root.innerHTML = statsHTML(state0); return; }
    if (kind === 'exam') {
      const examReal = examUnlocked(state0);
      if (!examReal && !devBypass()) { ctx.root.innerHTML = lockedExamHTML(); return; }
      const next = examReal ? startExam(state0) : previewExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = readCourse(state).current;
      ctx.root.innerHTML = cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, showSolution);
      return;
    }
    const levelReal = levelUnlocked(state0, level);
    if (!levelReal && (!devBypass() || !LEVELS.some((l) => l.id === level))) { ctx.root.innerHTML = listHTML(state0); return; }
    const next = levelReal ? startLevel(state0, level) : previewLevel(state0, level);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = readCourse(state).current;
    ctx.root.innerHTML = cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, showSolution);
  }

  function onAction(action, el) {
    if (action === 'trick-solution') {
      showSolution = !showSolution;
      render();
      return true;
    }
    if (action === 'trick-tap') {
      const box = ctx.root.querySelector('[data-trick-bonus]');
      ctx.commit(trickTap(ctx.getState(), el.dataset.result, !!(box && box.checked)));
      render();
      return true;
    }
    if (action === 'trick-undo') {
      ctx.commit(trickUndo(ctx.getState()));
      render();
      return true;
    }
    if (action === 'trick-view') {
      ctx.commit(trickView(ctx.getState(), Number(el.dataset.i), { peek: devBypass() }));
      render();
      return true;
    }
    if (action === 'trick-practice') {
      showSolution = false;
      ctx.commit(trickPractice(ctx.getState()));
      render();
      return true;
    }
    if (action === 'trick-replay') {
      showSolution = false;
      ctx.commit(trickReplay(ctx.getState()));
      render();
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() {} };
}
