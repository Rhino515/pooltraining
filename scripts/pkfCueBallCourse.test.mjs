/**
 * Focused tests for PKF Cue Ball Control Course.
 *   node scripts/pkfCueBallCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  COURSE_TITLE, EXAM_TITLE, STORAGE_KEY, HASH, SECTIONS, LESSONS, EXAM_ITEMS, LTYPE, ASSIST,
  courseOf, sectionUnlocked, examUnlocked, startSection, startExam, previewSection, previewExam,
  selectChoice, selectPlanStep, showHint, lockAnswer, markExecution, acknowledgeLearn, nextLesson,
  retryCurrent, reviewMissed, reviewMissedPositions,
  playableSectionCount, lessonTypeCounts, assistCounts, auditCourse, pkfCueBallProgressRows, pkfCueBallBannersHTML,
  ASSET_MAP, REGIONS, assetOf
} from '../js/content/pkfCueBallCourse.js';
import { PAGES } from '../js/content/pkfCueBallAssets.js';
import { defaultState } from '../js/storage.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}

const audit = auditCourse();
assert(audit.lessons === LESSONS.length && audit.exam === EXAM_ITEMS.length, `audit ${audit.lessons} lessons / ${audit.exam} exam / ${audit.sections} sections`);
assert(COURSE_TITLE === 'PKF Cue Ball Control Course' && EXAM_TITLE === 'PKF Cue Ball Control Exam', 'titles');
assert(STORAGE_KEY === 'pkfCueBallControl' && HASH === 'pkfcb', 'storage key + route');
assert(!(STORAGE_KEY in defaultState()), 'key is not in defaultState');
assert(SECTIONS.map((s) => s.id).join() === 'center-ball,sliding-cue-ball,half-table,full-table', 'four sections in source order');
assert(playableSectionCount() === 4, 'four playable sections');
assert(LESSONS.filter((l) => l.incomplete).length === 2, 'two INCOMPLETE source-review stubs');
assert([...LESSONS, ...EXAM_ITEMS].every((l) => ASSET_MAP[l.id] && assetOf(l.id)), 'every lesson + exam has an asset');
assert(Object.values(PAGES).every((p) => p.src.startsWith('./images/pkf-cb/PKF_CueBall_PDF_')), 'page map points at images/pkf-cb');
{
  const sample = [37, 61, 77, 107];
  for (const n of sample) {
    const f = path.join(root, 'images', 'pkf-cb', `PKF_CueBall_PDF_${String(n).padStart(3,'0')}.jpg`);
    assert(fs.existsSync(f) && fs.statSync(f).size > 1000, `JPEG present ${n}`);
  }
  // byte-identical with source pack
  const a = fs.readFileSync('/workspace/pkf-cb-src/a/PKF_CueBall_PDF_037.jpg');
  const b = fs.readFileSync(path.join(root, 'images/pkf-cb/PKF_CueBall_PDF_037.jpg'));
  assert(crypto.createHash('sha256').update(a).digest('hex') === crypto.createHash('sha256').update(b).digest('hex'), '037 byte-identical to source pack');
}

const counts = lessonTypeCounts();
const assists = assistCounts();
assert((counts.LEARN || 0) >= 15, `LEARN ${counts.LEARN}`);
assert((counts[LTYPE.PREDICT] || 0) >= 5 && (counts[LTYPE.ACTION] || 0) >= 5, `PREDICT ${counts[LTYPE.PREDICT]} ACTION ${counts[LTYPE.ACTION]}`);
assert((counts[LTYPE.SHOOT] || 0) >= 8, `SHOOT ${counts[LTYPE.SHOOT]}`);
assert((counts[LTYPE.PLAN] || 0) >= 2, `PLAN ${counts[LTYPE.PLAN]}`);
assert(assists.GUIDED && assists.ASSISTED && assists.INDEPENDENT, `assist mix G${assists.GUIDED}/A${assists.ASSISTED}/I${assists.INDEPENDENT}`);
assert(EXAM_ITEMS.filter((e) => e.answer != null || e.plan).length >= 8 && EXAM_ITEMS.filter((e) => e.shoot).length >= 3, 'exam knowledge-heavy + physical');
assert(LESSONS.filter((l) => l.position && l.shoot).length >= 5, 'position drills present');
assert(!JSON.stringify([LESSONS, EXAM_ITEMS]).match(/not on All|Career XP|storage key/i), 'no internal notes in lesson copy');
assert(!pkfCueBallBannersHTML({}).match(/not on all|career xp|storage/i), 'no internal notes in banners');

let state = {};
assert(sectionUnlocked(state, 'center-ball') && !sectionUnlocked(state, 'sliding-cue-ball'), 'first open, second locked');
assert(sectionUnlocked(state, 'full-table', { dev: true }) && examUnlocked(state, { dev: true }), 'dev opens locked');
assert(courseOf(startSection({}, 'sliding-cue-ball')).current === null, 'locked section does not start');
assert(courseOf(startExam({})).current === null, 'locked exam does not start');
assert(!pkfCueBallBannersHTML({}).includes('href="#pkfcb/exam"') && pkfCueBallBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner lock / preview');

// LOCK ANSWER gating on center-ball
state = startSection({}, 'center-ball');
state = acknowledgeLearn(state); state = nextLesson(state);
state = acknowledgeLearn(state); state = nextLesson(state);
{
  const cur = courseOf(state).current;
  const id = cur.order[cur.cursor];
  const lesson = LESSONS.find((l) => l.id === id);
  assert(lesson.id === 'cb-left-deflect' && lesson.answer === 'right', 'landed on left-deflect predict');
  assert(lockAnswer(state) === state, 'cannot lock without choice');
  assert(acknowledgeLearn(state) === state && markExecution(state, 'makePos') === state, 'cannot skip question');
  state = selectChoice(state, 'left');
  state = lockAnswer(state);
  const it = courseOf(state).current.items[id];
  assert(it.locked && it.correct === false && it.revealed && it.done, 'LOCK grades wrong + reveals');
  assert(courseOf(state).stats.knowledgeWrong === 1, 'knowledge wrong recorded');
}

// three-attempt position drill
function skipTo(st, sec, id) {
  let x = startSection(st, sec);
  for (let i = 0; i < 80; i++) {
    const c = courseOf(x).current;
    if (!c || c.phase === 'results') return x;
    if (c.order[c.cursor] === id) return x;
    const l = LESSONS.find((z) => z.id === c.order[c.cursor]);
    const it = c.items[c.order[c.cursor]];
    if (it.done) { x = nextLesson(x); continue; }
    if (l.plan) {
      for (const s of l.plan.steps) x = selectPlanStep(x, s.id, s.answer);
      x = lockAnswer(x);
    } else if (l.answer != null) x = lockAnswer(selectChoice(x, l.answer));
    else if (l.shoot) {
      x = markExecution(x, 'makePos');
      while (!courseOf(x).current.items[c.order[c.cursor]]?.done) x = markExecution(x, 'makePos');
    } else x = acknowledgeLearn(x);
    x = nextLesson(x);
  }
  return x;
}

{
  const passed = { ...{}, pkfCueBallControl: { sections: { 'center-ball': { passed: true } } } };
  // use open first section shoot
  let st = startSection({}, 'center-ball');
  st = skipTo({ ...st, pkfCueBallControl: courseOf(st) }, 'center-ball', 'cb-shoot-high');
  // rebuild cleanly
  st = {};
  // manually walk to shoot-high by finishing prior correctly via finish helper below
}

function finish(st, { wrong = false, miss = false } = {}) {
  let guard = 200;
  while (guard--) {
    const cur = courseOf(st).current;
    if (!cur || cur.phase === 'results') return st;
    const id = cur.order[cur.cursor];
    const lesson = LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id);
    const it = cur.items[id];
    if (it.done) { st = nextLesson(st); continue; }
    if (lesson.plan) {
      for (const s of lesson.plan.steps) {
        const pick = wrong ? s.choices.find((c) => c[0] !== s.answer)[0] : s.answer;
        st = selectPlanStep(st, s.id, pick);
      }
      st = lockAnswer(st);
    } else if (lesson.answer != null) {
      const pick = wrong ? lesson.choices.find((c) => c[0] !== lesson.answer)[0] : lesson.answer;
      st = lockAnswer(selectChoice(st, pick));
    } else if (lesson.shoot) {
      if (miss) {
        st = markExecution(st, 'miss');
        st = markExecution(st, 'miss');
        st = markExecution(st, 'miss');
      } else {
        st = markExecution(st, lesson.position ? 'make-miss-pos' : 'miss');
        st = markExecution(st, 'makePos');
      }
    } else st = acknowledgeLearn(st);
    st = nextLesson(st);
  }
  return st;
}

state = {};
for (const s of SECTIONS) {
  assert(sectionUnlocked(state, s.id), `${s.id} unlocked in order`);
  state = startSection(state, s.id);
  state = finish(state, { miss: s.id === 'sliding-cue-ball' });
  assert(courseOf(state).sections[s.id]?.passed === true, `${s.id} passed`);
}
{
  const sl = courseOf(state).sections['sliding-cue-ball'];
  assert(sl.executionMiss >= 1 && sl.passed, 'missed shots do not fail knowledge pass');
}
assert(examUnlocked(state), 'exam unlocks');
{
  const rows = pkfCueBallProgressRows(state);
  assert(rows.length === 1 && rows[0].id === 'pkfCueBall' && rows[0].finished && rows[0].done === 4, 'progress row finished');
}
state = startExam(state);
state = finish(state, { miss: true });
{
  const b = courseOf(state);
  assert(b.current.phase === 'results' && b.exam.attempts === 1, 'exam finished one attempt');
  assert(typeof b.exam.bestKnowledge === 'number' && typeof b.exam.bestExecution === 'number', 'exam tracks knowledge vs execution');
}

// DEV PREVIEW saves nothing
{
  let st = previewSection({}, 'full-table');
  assert(courseOf(st).current?.dev, 'preview marked dev');
  st = finish(st);
  assert(!courseOf(st).sections['full-table']?.passed, 'dev preview does not pass section');
}

// Direct markExecution unit
{
  let st = startSection({}, 'center-ball');
  const bank = courseOf(st);
  const shootId = 'cb-shoot-high';
  bank.current = { mode: 'section', sectionId: 'center-ball', phase: 'play', cursor: 0, view: 0, order: [shootId], items: { [shootId]: { locked: false, choice: null, correct: null, revealed: false, execution: null, attempts: [], done: false, hint: false, planChoices: {} } } };
  st = { pkfCueBallControl: bank };
  st = markExecution(st, 'make-miss-pos');
  let it = courseOf(st).current.items[shootId];
  assert(it.attempts.length === 1 && !it.done, 'first attempt recorded, not done');
  st = markExecution(st, 'makePos');
  it = courseOf(st).current.items[shootId];
  assert(it.done && it.execution === 'make' && it.attempts.length === 2, 'second-try success');
  assert(courseOf(st).stats.secondTry === 1 && courseOf(st).stats.positionOk === 1, '2nd try + position stats');
}

// crop math uses height (cy/ch) — spot-check regionHTML helper via asset crop aspect
{
  const a = assetOf('cb-intro');
  assert(a && a.h === 1080 && a.crop.h > 0 && 'y' in a.crop, 'teaching asset has height-based crop fields');
  const c = a.crop;
  assert(c.y + c.h <= 1.0001, 'crop in bounds');
}

if (failed) { console.error(`\n${failed} FAILED`); process.exit(1); }
console.log('\nALL pkfCueBallCourse TESTS PASSED');
