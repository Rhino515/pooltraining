/**
 * Off the Rail course screen. The player shoots on a real table and taps the result.
 * No shot simulation and no Career XP.
 */
import {
  COURSE_TITLE, EXAM_TITLE, KICK_SCORE, LEVELS, EXAM_STATIONS,
  kickingOf, isLevelOpen, isExamOpen, levelRecord, passedLevelCount,
  startLevel, startExam, kickTap, kickUndo, kickView, kickPractice, kickRetry,
  courseStats, diagramHTML, howToHTML, ballName, diamondPhrase, freshStation, stationMax,
  difficultyOf, attemptsFor, pocketRequired, designatedPocket, difficultyNote, setDifficulty, DIFFICULTIES,
  levelById, nextLevelId
} from '../content/kickingCourse.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function dotHTML(marks) {
  const m = marks || ['empty', 'empty', 'empty'];
  return `<span class="kickDots" data-kick-dots="${esc(m.join(' '))}">${m.map((k) => `<i class="${esc(k)}"></i>`).join('')}</span>`;
}

function difficultyHTML(id) {
  const cur = difficultyOf(id).id;
  const buttons = Object.values(DIFFICULTIES).map((d) => {
    const on = d.id === cur;
    return `<button type="button" class="chip${on ? ' active' : ''}" data-action="kick-difficulty" data-diff="${d.id}" aria-pressed="${on ? 'true' : 'false'}">${esc(d.label)}</button>`;
  }).join('');
  return `<div class="kickDiff" role="group" aria-label="Difficulty" data-kick-diff="${esc(cur)}">${buttons}</div><p class="kickDiffNote">${esc(difficultyNote(cur))}</p>`;
}

function shownMarks(rec, attempts) {
  const m = (rec?.marks || []).slice();
  while (m.length < attempts) m.push('empty');
  return m.slice(0, attempts);
}

function buttonsHTML(station, difficulty) {
  const ball = ballName(station.ball);
  const rows = [];
  if (pocketRequired(difficulty)) {
    const pocket = designatedPocket(station);
    rows.push(['pocket', `Pocketed the ${ball} in the ${pocket} — pocket is required`, 'kick-pocket']);
    rows.push(['contact', `Hit the ${ball}, no pocket`, 'kick-miss']);
    rows.push(['miss', 'Missed', 'kick-miss']);
  } else {
    rows.push(['contact', `Made the kick on the ${ball}`, 'kick-make']);
    rows.push(['miss', 'Missed', 'kick-miss']);
    rows.push(['pocket', `Pocketed the ${ball}`, 'kick-pocket']);
  }
  return rows.map(([outcome, label, cls]) => `<button type="button" class="bigBtn ${cls}" data-action="kick-tap" data-outcome="${outcome}">${esc(label)}</button>`).join('');
}

function running(cur, stations) {
  let score = 0;
  cur.order.forEach((si) => { score += cur.stations[si]?.points || 0; });
  let max = 0;
  cur.order.forEach((si) => { max += stationMax(stations[si]); });
  return { score, max };
}

function playHTML(state, showSolution, howOpen) {
  const kc = kickingOf(state);
  const cur = kc.current;
  const exam = cur.mode === 'exam' || cur.parent === 'exam';
  const stations = exam ? EXAM_STATIONS : levelById(cur.level).stations;
  const view = Math.min(cur.view ?? cur.cursor, cur.cursor);
  const si = cur.order[view];
  const station = stations[si];
  const diff = difficultyOf(kc.difficulty).id;
  const attempts = attemptsFor(diff);
  const rec = cur.stations[si] || freshStation(attempts);
  const marks = shownMarks(rec, attempts);
  const live = view === cur.cursor && !rec.done && cur.phase === 'play';
  const { score, max } = running(cur, stations);
  const shotNo = view + 1;
  const title = exam ? EXAM_TITLE : (cur.mode === 'practice' ? 'Practice' : levelById(cur.level).name);
  const used = marks.filter((m) => m !== 'empty').length;
  const attemptN = rec.done ? (rec.madeOn || used) : (used + 1);
  const rails = station.rails.map((r, i) => `${i + 1}. ${r === 'top' ? 'top long rail' : r === 'bottom' ? 'bottom long rail' : r === 'left' ? 'head short rail' : 'foot short rail'}`).join(' · ');
  const stationRow = cur.order.map((idx, i) => {
    const done = !!(cur.stations[idx]?.done);
    const locked = i > cur.cursor;
    const now = i === cur.cursor && cur.phase === 'play';
    const cls = locked ? 'is-lock' : now ? 'is-now' : done && cur.stations[idx]?.success ? 'is-pass' : 'is-seen';
    const mark = locked ? '<span class="kickLock" aria-hidden="true">🔒</span>' : (done && cur.stations[idx]?.success ? '✓' : now ? '●' : '○');
    return `<button type="button" class="kickStation ${cls}" data-action="kick-view" data-i="${i}" ${locked ? 'disabled' : ''}>SHOT ${i + 1} ${mark}</button>`;
  }).join('');
  return `<div class="playScreen kickPage" data-offrail-play="1" data-offrail-mode="${esc(cur.mode)}" data-level="${cur.level || 0}">
    <div class="title kickTitle"><button type="button" class="linkish back" data-action="go" data-href="${exam ? '#courses' : '#kicking'}">‹ Back</button><span class="eyebrow">${esc(COURSE_TITLE.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${difficultyHTML(diff)}
    <p class="kickMeta">Shot ${shotNo} of ${cur.order.length} · Score ${score} / ${max} · Attempt ${attemptN} of ${attempts}<br>Pass requirement: ${KICK_SCORE.passPercent}%</p>
    <div class="kickTable" data-kick-table>${diagramHTML(station, { solution: showSolution, difficulty: diff })}</div>
    <p class="kickFacts"><b>Cue ball</b> (white): ${esc(diamondPhrase(station.cue))}. <b>${esc(ballName(station.ball))}</b>: ${esc(diamondPhrase(station.ob))}.${station.blocker ? ` <b>8-ball</b> blocking: ${esc(diamondPhrase(station.blocker))}.` : ''}<br><b>Required rails:</b> ${esc(rails)}.${pocketRequired(diff) ? ` <b>Target pocket:</b> ${esc(designatedPocket(station))} (required).` : (station.pocket ? ` <b>Target pocket:</b> ${esc(station.pocket)} (bonus).` : '')}</p>
    <div class="kickSolve"><button type="button" class="chip${showSolution ? ' active' : ''}" data-action="kick-solution" aria-pressed="${showSolution ? 'true' : 'false'}">${showSolution ? 'Hide solution' : 'Show Solution'}</button> ${dotHTML(marks)}</div>
    ${howToHTML(station, howOpen, diff)}
    <div class="kickStations">${stationRow}</div>
    ${live ? `<div class="kickActs">${buttonsHTML(station, diff)}<button type="button" class="bigBtn alt" data-action="kick-undo">Undo</button></div>` : (view !== cur.cursor ? `<button type="button" class="bigBtn alt" data-action="kick-view" data-i="${cur.cursor}">Back to shot ${cur.cursor + 1}</button>` : '')}
    <p class="muted small">Shoot this on your table. The app does not hit the balls.</p>
  </div>`;
}

function resultsHTML(state) {
  const kc = kickingOf(state);
  const cur = kc.current;
  const sum = cur.summary;
  const exam = cur.mode === 'exam' || cur.parent === 'exam';
  const practice = cur.mode === 'practice';
  const head = exam ? EXAM_TITLE : COURSE_TITLE;
  const passed = sum.passed;
  const title = passed
    ? (exam ? `${EXAM_TITLE}` : `${COURSE_TITLE} — Level complete`)
    : (exam ? `${EXAM_TITLE} — Not passed` : `${COURSE_TITLE} — Not passed`);
  const failed = sum.failed.length
    ? `<p><b>Failed stations.</b> ${sum.failed.map((f) => esc(f.name)).join(', ')}.</p>`
    : '<p>No failed stations.</p>';
  let next = '';
  const nxt = cur.mode === 'level' ? nextLevelId(cur.level) : null;
  if (!practice && passed && nxt) next = `<p class="green">NEXT LEVEL UNLOCKED</p><button type="button" class="bigBtn" data-action="go" data-href="#kicking/${nxt}">NEXT LEVEL</button>`;
  if (!practice && passed && cur.mode === 'level' && !nxt && isExamOpen(kickingOf(state))) next = `<p class="green">All ${LEVELS.length} levels are passed. ${esc(EXAM_TITLE)} is unlocked.</p><button type="button" class="bigBtn" data-action="go" data-href="#kicking/exam">OPEN ${esc(EXAM_TITLE).toUpperCase()}</button>`;
  const practiceBtn = !practice && !passed && sum.failed.length
    ? `<button type="button" class="bigBtn alt" data-action="kick-practice">Practice these</button>`
    : '';
  const practiceNote = practice ? '<p class="muted">Practice only. Your saved score was not changed.</p>' : '';
  const history = exam && kc.exam.history?.length
    ? `<div class="kickHist"><b>History</b>${kc.exam.history.map((h) => `<p>${esc(new Date(h.at).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))} PT · ${h.score} / ${h.max} · ${h.passed ? 'pass' : 'not passed'}</p>`).join('')}</div>`
    : '';
  return `<div class="playScreen kickPage" data-offrail-results="1" data-passed="${passed ? 1 : 0}">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="${exam ? '#courses' : '#kicking'}">‹ Back</button><span class="eyebrow">${esc(head.toUpperCase())}</span><h1>${esc(title)}</h1></div>
    ${difficultyHTML(kc.difficulty)}
    <div class="card">
      <p><b>${passed ? 'PASS' : 'RETRY'}</b></p>
      <p>Score ${sum.score} / ${sum.max}</p>
      <p>Success rate ${sum.rate}%</p>
      <p>First-try makes ${sum.first}</p>
      <p>Second-try makes ${sum.second}</p>
      <p>Third-try makes ${sum.third}</p>
      ${(sum.fourth || sum.fifth) ? `<p>Fourth-try makes ${sum.fourth || 0}</p><p>Fifth-try makes ${sum.fifth || 0}</p>` : ''}
      ${failed}
      <p>Kick-pockets ${sum.pockets}</p>
      <p>Bonus points ${sum.bonus}</p>
      <p>Pass requirement: ${KICK_SCORE.passPercent}%</p>
      ${practiceNote}
      ${next}
      ${practiceBtn}
      <button type="button" class="bigBtn" data-action="kick-retry">${passed ? 'REPLAY' : 'RETRY'}</button>
      ${history}
    </div>
  </div>`;
}

function listHTML(state) {
  const kc = kickingOf(state);
  const rows = LEVELS.map((level) => {
    const open = isLevelOpen(kc, level.n);
    const rec = levelRecord(kc, level.n);
    const tag = rec?.passed ? 'Passed' : rec ? `Best ${rec.bestScore} / ${rec.bestMax}` : open ? 'Open' : 'Locked';
    const mark = !open ? '🔒' : rec?.passed ? '✓' : '●';
    return `<button type="button" class="stageRow card${open ? '' : ' locked'}" data-action="go" data-href="#kicking/${level.n}" ${open ? '' : 'disabled'} data-offrail-level="${level.n}"><span class="srNum">${mark}</span><span class="srMain"><b>${esc(level.name)}</b><small>${esc(level.blurb)} · ${esc(tag)}</small></span></button>`;
  }).join('');
  const passed = passedLevelCount(kc);
  return `<div class="playScreen kickPage" data-offrail-home="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">DRILL SET</span><h1>${esc(COURSE_TITLE)}</h1><p>${LEVELS.length} levels. Five one-rail, five two-rail, five three-rail, then english, blocked kicks, kick and pocket, and kick position. Place the balls where the diagram shows, shoot the kick on your table, and tap what happened. Pass requirement: ${KICK_SCORE.passPercent}% of the stations.</p></div>
    ${difficultyHTML(kc.difficulty)}
    <div class="card"><p>${passed} of ${LEVELS.length} levels passed.</p><button type="button" class="bigBtn alt" data-action="go" data-href="#kicking/stats">Course stats</button></div>
    <div class="stageList" data-offrail-levels="1">${rows}</div>
  </div>`;
}

function statsHTML(state) {
  const s = courseStats(kickingOf(state));
  const line = (k, v) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
  return `<div class="playScreen kickPage" data-offrail-stats="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#kicking">‹ ${esc(COURSE_TITLE)}</button><span class="eyebrow">${esc(COURSE_TITLE.toUpperCase())}</span><h1>Course stats</h1></div>
    <div class="card">
      ${line('First-attempt makes', s.first)}
      ${line('Second-attempt makes', s.second)}
      ${line('Third-attempt makes', s.third)}
      ${line('Fourth- and fifth-attempt makes', s.later || 0)}
      ${line('Failed stations', s.failed)}
      ${line('Total attempts', s.attempts)}
      ${line('Successful kick contacts', s.contacts)}
      ${line('Kick-pocket makes', s.pockets)}
      ${line('Success percentage', s.successPct + '%')}
      ${line('Best course score', s.best)}
      ${line('Course completion', s.courseCompletion)}
      ${line('Level completion', s.levelCompletion)}
    </div>
  </div>`;
}

function lockedExamHTML(state) {
  return `<div class="playScreen kickPage" data-offrail-exam-locked="1">
    <div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets & Exams</button><span class="eyebrow">EXAM</span><h1>${esc(EXAM_TITLE)}</h1></div>
    ${difficultyHTML(kickingOf(state).difficulty)}
    <div class="card"><p>Locked until all ${LEVELS.length} levels are passed.</p><button type="button" class="bigBtn" data-action="go" data-href="#kicking">Back to ${esc(COURSE_TITLE)}</button></div>
  </div>`;
}

export function createKickingScreen(ctx, args) {
  let showSolution = false;
  let howOpen = false;
  const kind = !args[0] || args[0] === 'home' ? 'list' : args[0] === 'stats' ? 'stats' : args[0] === 'exam' ? 'exam' : 'level';
  const level = kind === 'level' ? Number(args[0]) : 0;

  function render() {
    const state0 = ctx.getState();
    if (kind === 'list') { ctx.root.innerHTML = listHTML(state0); return; }
    if (kind === 'stats') { ctx.root.innerHTML = statsHTML(state0); return; }
    if (kind === 'exam') {
      if (!isExamOpen(kickingOf(state0))) { ctx.root.innerHTML = lockedExamHTML(state0); return; }
      const next = startExam(state0);
      const state = next === state0 ? state0 : ctx.commit(next);
      const cur = kickingOf(state).current;
      ctx.root.innerHTML = cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, showSolution, howOpen);
      return;
    }
    if (!isLevelOpen(kickingOf(state0), level)) { ctx.root.innerHTML = listHTML(state0); return; }
    const next = startLevel(state0, level);
    const state = next === state0 ? state0 : ctx.commit(next);
    const cur = kickingOf(state).current;
    ctx.root.innerHTML = cur?.phase === 'results' ? resultsHTML(state) : playHTML(state, showSolution, howOpen);
  }

  function onAction(action, el) {
    if (action === 'kick-difficulty') {
      const id = el.dataset.diff;
      if (!DIFFICULTIES[id]) return true;
      ctx.commit(setDifficulty(ctx.getState(), id));
      render();
      return true;
    }
    if (action === 'kick-solution') {
      showSolution = !showSolution;
      if (showSolution) howOpen = true;
      render();
      return true;
    }
    if (action === 'kick-how') {
      howOpen = !howOpen;
      render();
      return true;
    }
    if (action === 'kick-tap') {
      ctx.commit(kickTap(ctx.getState(), el.dataset.outcome));
      render();
      return true;
    }
    if (action === 'kick-undo') {
      ctx.commit(kickUndo(ctx.getState()));
      render();
      return true;
    }
    if (action === 'kick-view') {
      ctx.commit(kickView(ctx.getState(), Number(el.dataset.i)));
      render();
      return true;
    }
    if (action === 'kick-practice') {
      showSolution = false;
      ctx.commit(kickPractice(ctx.getState()));
      render();
      return true;
    }
    if (action === 'kick-retry') {
      showSolution = false;
      ctx.commit(kickRetry(ctx.getState()));
      render();
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() {} };
}
