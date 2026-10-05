/**
 * Focused tests for PKF Kicking Systems Course.
 *   node scripts/pkfKickingCourse.test.mjs
 */
import {
  COURSE_TITLE, EXAM_TITLE, STORAGE_KEY, SECTIONS, LESSONS, EXAM_ITEMS,
  KNOWLEDGE_PASS, EXAM_PASS, ASSIST, LTYPE,
  pkfOf, sectionUnlocked, examUnlocked, startSection, startExam, previewSection, previewExam,
  selectChoice, lockAnswer, markExecution, acknowledgeLearn, nextLesson,
  passedSectionCount, playableSectionCount, lessonTypeCounts, auditCourse,
  ASSET_MAP
} from '../js/content/pkfKickingCourse.js';
import { defaultState } from '../js/storage.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}

const audit = auditCourse();
assert(audit.lessons === LESSONS.length && audit.exam === EXAM_ITEMS.length, `audit ${audit.lessons} lessons / ${audit.exam} exam`);
assert(COURSE_TITLE === 'PKF Kicking Systems Course' && EXAM_TITLE === 'PKF Kicking Systems Exam', 'titles');
assert(STORAGE_KEY === 'pkfKickingSystems', 'storage key');
assert(!('pkfKickingSystems' in defaultState()), 'key is not in defaultState');
assert(SECTIONS.length === 15, '15 sections');
assert(playableSectionCount() === SECTIONS.filter((s) => !s.stub).length, 'playable excludes stubs');
assert(SECTIONS.some((s) => s.id === 'half-table' && s.stub), 'Half-Table is stub / needs source review');
assert(LESSONS.every((l) => l.incomplete || ASSET_MAP[l.id]), 'every complete lesson has an asset');
assert(EXAM_ITEMS.every((e) => ASSET_MAP[e.asset || e.id]), 'every exam item has an asset');
assert(Object.values(ASSET_MAP).every((a) => a.page >= 227 && a.page <= 281), 'assets are in PDF 227–281');
assert(!String(COURSE_TITLE + EXAM_TITLE).includes('Off the Rail'), 'not Off the Rail');

const counts = lessonTypeCounts();
assert((counts.LEARN || 0) >= 20, `enough LEARN lessons (${counts.LEARN})`);
assert((counts.IDENTIFY || 0) >= 8, `IDENTIFY ${counts.IDENTIFY}`);
assert((counts.CALCULATE || 0) >= 6, `CALCULATE ${counts.CALCULATE}`);
assert((counts['NOW SHOOT IT'] || 0) >= 8, `SHOOT ${counts['NOW SHOOT IT']}`);
assert((counts.INCOMPLETE || 0) === 1, 'one incomplete stub lesson');

let state = {};
assert(sectionUnlocked(state, 'multiple-rail') === true, 'first section open');
assert(sectionUnlocked(state, 'visual-guide') === false, 'second section locked');
assert(sectionUnlocked(state, 'visual-guide', { dev: true }) === true, 'dev flag opens locked section');
assert(examUnlocked(state) === false, 'exam locked');
assert(examUnlocked(state, { dev: true }) === true, 'dev flag opens exam');
{
  const prev = previewSection({}, 'visual-guide');
  assert(pkfOf(prev).current?.dev === true && pkfOf(prev).current?.sectionId === 'visual-guide', 'previewSection is DEV PREVIEW');
  const again = previewSection(prev, 'visual-guide');
  assert(again === prev, 'previewSection keeps in-progress preview');
}

state = startSection(state, 'multiple-rail');
assert(pkfOf(state).current?.sectionId === 'multiple-rail', 'section started');
const cur0 = pkfOf(state).current;
const firstId = cur0.order[0];
const first = LESSONS.find((l) => l.id === firstId);
assert(first.type === LTYPE.LEARN, 'first lesson is LEARN');
state = acknowledgeLearn(state);
assert(pkfOf(state).current.items[firstId].done === true, 'LEARN acknowledged');

// jump to an identify lesson in the same run by finishing learns until identify

function finishSection(st) {
  let guard = 80;
  while (guard--) {
    const cur = pkfOf(st).current;
    if (!cur || cur.phase === 'results') return st;
    const id = cur.order[cur.cursor];
    const lesson = LESSONS.find((l) => l.id === id);
    const it = cur.items[id];
    if (it.done) { st = nextLesson(st); continue; }
    if (lesson.answer != null) {
      st = selectChoice(st, lesson.answer);
      st = lockAnswer(st);
      st = nextLesson(st);
      continue;
    }
    if (lesson.shoot) { st = markExecution(st, 'make'); st = nextLesson(st); continue; }
    st = acknowledgeLearn(st);
    st = nextLesson(st);
  }
  return st;
}

function advanceToType(st, type) {
  let guard = 80;
  while (guard--) {
    const cur = pkfOf(st).current;
    if (!cur || cur.phase !== 'play') return st;
    const id = cur.order[cur.cursor];
    const lesson = LESSONS.find((l) => l.id === id) || {};
    const it = cur.items[id];
    if (it.done) { st = nextLesson(st); continue; }
    if (lesson.type === type && lesson.answer != null) return st;
    if (lesson.answer != null) {
      st = selectChoice(st, lesson.answer);
      st = lockAnswer(st);
      st = nextLesson(st);
      continue;
    }
    if (lesson.shoot) {
      st = markExecution(st, 'make');
      st = nextLesson(st);
      continue;
    }
    st = acknowledgeLearn(st);
    st = nextLesson(st);
  }
  return st;
}

state = advanceToType(state, LTYPE.IDENTIFY);
{
  const cur = pkfOf(state).current;
  const id = cur.order[cur.cursor];
  const lesson = LESSONS.find((l) => l.id === id);
  assert(lesson && lesson.answer, 'landed on identify/calc with answer');
  const wrong = lesson.choices.find((c) => c[0] !== lesson.answer)[0];
  state = selectChoice(state, wrong);
  let before = pkfOf(state).current.items[id];
  assert(before.locked === false && before.revealed === false, 'no reveal before lock');
  state = lockAnswer(state);
  let after = pkfOf(state).current.items[id];
  assert(after.locked === true && after.correct === false && after.revealed === true, 'lock reveals incorrect');
}

// Real pass: complete Multiple Rail, then Visual Guide (saves progress)
state = {};
state = startSection(state, 'multiple-rail');
state = finishSection(state);
assert(pkfOf(state).sections['multiple-rail']?.passed === true, 'multiple-rail passed');
assert(sectionUnlocked(state, 'visual-guide') === true, 'visual-guide unlocks after prior pass');
state = startSection(state, 'visual-guide');
state = finishSection(state);
assert(pkfOf(state).current?.phase === 'results', 'visual-guide finished');
assert(pkfOf(state).sections['visual-guide']?.passed === true, 'visual-guide passed at knowledge threshold');

// Without passing multiple-rail, two-rail stays locked (visual-guide pass alone is not enough if multiple-rail not passed — visual is section 2)
assert(sectionUnlocked(state, 'two-rail') === true, 'two-rail unlocks after visual-guide');
assert(sectionUnlocked({}, 'diamond-table') === false, 'far section stays locked on empty state');
assert(sectionUnlocked({}, 'diamond-table', { dev: true }) === true, 'dev flag opens far section on empty state');
{
  const preview = previewSection(state, 'two-rail');
  assert(pkfOf(preview).current?.dev === true, 'locked section opens as preview');
  // finishing a preview must not unlock/pass the section
  let st = preview;
  let guard = 40;
  while (guard--) {
    const cur = pkfOf(st).current;
    if (!cur || cur.phase === 'results') break;
    const id = cur.order[cur.cursor];
    const lesson = LESSONS.find((l) => l.id === id);
    const it = cur.items[id];
    if (it.done) { st = nextLesson(st); continue; }
    if (lesson.answer != null) { st = selectChoice(st, lesson.answer); st = lockAnswer(st); st = nextLesson(st); continue; }
    if (lesson.shoot) { st = markExecution(st, 'make'); st = nextLesson(st); continue; }
    st = acknowledgeLearn(st); st = nextLesson(st);
  }
  assert(pkfOf(st).current?.phase === 'results', 'preview finished');
  assert(!pkfOf(st).sections['two-rail']?.passed, 'DEV PREVIEW does not save section pass');
}

console.log('\nType counts', counts);
console.log(failed ? `\n${failed} FAILED` : '\nALL pkfKickingCourse TESTS PASSED');
process.exit(failed ? 1 : 0);
