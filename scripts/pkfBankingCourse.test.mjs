/**
 * Focused tests for PKF Banking Systems Course.
 *   node scripts/pkfBankingCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  COURSE_TITLE, EXAM_TITLE, STORAGE_KEY, HASH, SECTIONS, LESSONS, EXAM_ITEMS, LTYPE, ASSIST,
  bankOf, sectionUnlocked, examUnlocked, startSection, startExam, previewSection, previewExam,
  selectChoice, showHint, lockAnswer, markExecution, acknowledgeLearn, nextLesson, retryCurrent, reviewMissed,
  playableSectionCount, lessonTypeCounts, assistCounts, auditCourse, pkfBankProgressRows, pkfBankBannersHTML,
  ASSET_MAP, REGIONS, assetOf, skipTableStep, skippedIds, reviewSkipped, passedSectionCount, lessonById
} from '../js/content/pkfBankingCourse.js';
import { readSetProgress, setProgressBoxHTML, pkfProgressBoxHTML, completedSetsLineHTML } from '../js/content/setProgress.js';
import { PAGES } from '../js/content/pkfBankAssets.js';
import { defaultState } from '../js/storage.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}

// ---------------------------------------------------------------- identity / source
const audit = auditCourse();
assert(audit.lessons === LESSONS.length && audit.exam === EXAM_ITEMS.length, `audit ${audit.lessons} lessons / ${audit.exam} exam / ${audit.sections} sections`);
assert(COURSE_TITLE === 'PKF Banking Systems Course' && EXAM_TITLE === 'PKF Banking Systems Exam', 'titles');
assert(STORAGE_KEY === 'pkfBankingSystems' && HASH === 'pkfbank', 'storage key + route');
assert(!(STORAGE_KEY in defaultState()), 'key is not in defaultState (no Career XP / existing keys touched)');
assert(SECTIONS.map((s) => s.id).join() === 'path-context,find-path-drill,zero-x-banking,end-rail-speed,corner-bank-drill,path-numbering', 'six sections in source order');
assert(SECTIONS.some((s) => s.id === 'zero-x-banking' && s.title === 'Zero-X Banking'), 'Zero-X Banking terminology preserved');
assert(playableSectionCount() === 5 && SECTIONS.filter((s) => s.stub).map((s) => s.id).join() === 'path-numbering', 'one stub (needs source review), five playable');
assert(LESSONS.filter((l) => l.incomplete).length === 1, 'one INCOMPLETE lesson');
assert(Object.values(REGIONS).every((r) => [241, 242, 243, 244].includes(r.page)), 'every region is on printed pages 241–244');
assert(Object.values(REGIONS).filter((r) => r.page === 244).every((r) => r.crop.y + r.crop.h <= 0.3481) && PAGES[244].view.h <= 0.3481, 'page 244 crops + full view stop above the Diamond one-rail kicking section');
assert(!JSON.stringify([LESSONS, EXAM_ITEMS]).match(/Blue Series|Diamond brand|distance between the diamonds is 10/i), 'no Diamond one-rail kicking content');
assert(!JSON.stringify([LESSONS, EXAM_ITEMS]).match(/running english|30-30 path|80%|60%|40%|Kick Safe/i), 'no PKF Kicking Systems formulas reused');
assert([...LESSONS, ...EXAM_ITEMS].every((l) => ASSET_MAP[l.id] && assetOf(l.id)), 'every lesson + exam item has an original-image asset');
assert([...LESSONS, ...EXAM_ITEMS].filter((l) => l.answer != null).every((l) => assetOf(l.id).reveal), 'every graded question has a PKF solution region for REVEAL');
assert([...LESSONS, ...EXAM_ITEMS].filter((l) => l.answer != null).every((l) => assetOf(l.id).key.startsWith('f')), 'questions show figure-only crops (answer text hidden until LOCK ANSWER)');
const purposes = new Set(Object.values(ASSET_MAP).map((a) => a.purpose));
assert(['teaching', 'problem', 'physicalSetup', 'referenceGuide'].every((p) => purposes.has(p)), 'asset purposes used: teaching / problem / physicalSetup / referenceGuide');
{
  const expected = {
    267: '6a0c57ef4f9c75b9daec559a3431a16f3ee165cea12b0e0ba3e0e5fbf4f63687',
    268: '9a8b6139ae6e51abc0ce9aa2802ea8ef74b38d80dbc4f5c8617abeb04c4b5d5b',
    269: '51d4d637ec064b26810eadd8833d0132612ee7ff39ba4eb7408edb5ace460003',
    270: 'd045e35f47d3d50aa4c1a571548e0a9df5e8c636f12f4be0c1fa0774a0f818b0'
  };
  const bad = Object.entries(expected).filter(([n, h]) => {
    const f = path.join(root, 'images', 'pkf-bank', `PKF_Banking_PDF_${n}.jpg`);
    return !fs.existsSync(f) || crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') !== h;
  });
  assert(!bad.length, `original PKF JPEGs served byte-for-byte from images/pkf-bank/ ${bad.length ? bad.map((b) => b[0]) : ''}`);
  assert(Object.values(PAGES).every((p) => p.src.startsWith('./images/pkf-bank/PKF_Banking_PDF_')), 'page map points at images/pkf-bank');
}

// ---------------------------------------------------------------- lesson mix
const counts = lessonTypeCounts();
const assists = assistCounts();
assert((counts.LEARN || 0) >= 10, `LEARN ${counts.LEARN}`);
assert((counts.IDENTIFY || 0) >= 5 && (counts.CALCULATE || 0) >= 4 && (counts[LTYPE.AIM] || 0) >= 4, `IDENTIFY ${counts.IDENTIFY} · CALCULATE ${counts.CALCULATE} · CHOOSE AIM ${counts[LTYPE.AIM]}`);
assert((counts[LTYPE.SOLVE] || 0) >= 3 && (counts.UNDERSTAND || 0) >= 3, `SOLVE ${counts[LTYPE.SOLVE]} · UNDERSTAND ${counts.UNDERSTAND}`);
assert((counts[LTYPE.SHOOT] || 0) >= 5, `NOW SHOOT IT ${counts[LTYPE.SHOOT]}`);
assert(assists.GUIDED && assists.ASSISTED && assists.INDEPENDENT, `assist mix G${assists.GUIDED}/A${assists.ASSISTED}/I${assists.INDEPENDENT}`);
for (const s of SECTIONS.filter((x) => !x.stub)) {
  const list = LESSONS.filter((l) => l.section === s.id);
  const order = { GUIDED: 0, ASSISTED: 1, INDEPENDENT: 2 };
  const mono = list.every((l, i) => i === 0 || order[l.assist] >= order[list[i - 1].assist] || l.type === LTYPE.LEARN);
  assert(list[0].type === LTYPE.LEARN && list[0].assist === ASSIST.GUIDED && mono, `${s.id}: starts with a GUIDED LEARN and steps toward INDEPENDENT`);
}
assert(EXAM_ITEMS.filter((e) => e.answer != null).length >= 8 && EXAM_ITEMS.filter((e) => e.shoot).length === 2, 'exam: knowledge-heavy + two physical');
assert(LESSONS.filter((l) => l.answer != null).every((l) => l.assist !== ASSIST.INDEPENDENT || !l.hint), 'INDEPENDENT questions carry no hint');

// ---------------------------------------------------------------- locks + DEV PREVIEW
let state = {};
assert(sectionUnlocked(state, 'path-context') && !sectionUnlocked(state, 'find-path-drill'), 'first section open, second locked');
assert(sectionUnlocked(state, 'corner-bank-drill', { dev: true }) && !examUnlocked(state) && examUnlocked(state, { dev: true }), 'dev flag opens locked section + exam');
assert(startSection({}, 'zero-x-banking') && bankOf(startSection({}, 'zero-x-banking')).current === null, 'locked section does not start normally');
assert(bankOf(startExam({})).current === null, 'locked exam does not start normally');
assert(!pkfBankBannersHTML({}).includes('href="#pkfbank/exam"') && pkfBankBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner locked; Dev Mode banner opens as preview');
assert(!pkfBankBannersHTML({}).match(/not on all|career xp|storage/i), 'no internal notes in UI copy');

// ---------------------------------------------------------------- LOCK ANSWER gating
state = startSection({}, 'path-context');
state = acknowledgeLearn(state); state = nextLesson(state);
state = acknowledgeLearn(state); state = nextLesson(state);
{
  const cur = bankOf(state).current;
  const id = cur.order[cur.cursor];
  const lesson = LESSONS.find((l) => l.id === id);
  assert(lesson.id === 'ctx-id-value' && lesson.answer === '45', 'landed on IDENTIFY ctx-id-value');
  assert(lockAnswer(state) === state, 'cannot lock without a choice');
  assert(acknowledgeLearn(state) === state && markExecution(state, 'make') === state, 'cannot skip a question with CONTINUE or MAKE');
  assert(nextLesson(state) === state, 'cannot advance before locking');
  assert(selectChoice(state, 'nope') === state, 'unknown choice ignored');
  state = showHint(state);
  state = selectChoice(state, '40');
  let it = bankOf(state).current.items[id];
  assert(it.locked === false && it.revealed === false && it.choice === '40', 'choice selected, not revealed');
  state = lockAnswer(state);
  it = bankOf(state).current.items[id];
  assert(it.locked && it.correct === false && it.revealed && it.done, 'LOCK ANSWER grades wrong + reveals');
  assert(selectChoice(state, '45') === state, 'cannot change a locked answer');
  assert(bankOf(state).stats.knowledgeWrong === 1, 'knowledge stat recorded');
}

// ---------------------------------------------------------------- full pass + execution tracking
function finish(st, { wrong = false, miss = false } = {}) {
  let guard = 120;
  while (guard--) {
    const cur = bankOf(st).current;
    if (!cur || cur.phase === 'results') return st;
    const id = cur.order[cur.cursor];
    const lesson = LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id);
    const it = cur.items[id];
    if (it.done) { st = nextLesson(st); continue; }
    if (lesson.answer != null) {
      const pick = wrong ? lesson.choices.find((c) => c[0] !== lesson.answer)[0] : lesson.answer;
      st = lockAnswer(selectChoice(st, pick));
    } else if (lesson.shoot) st = markExecution(st, miss ? 'miss' : 'make');
    else st = acknowledgeLearn(st);
    st = nextLesson(st);
  }
  return st;
}
state = {};
for (const s of SECTIONS.filter((x) => !x.stub)) {
  assert(sectionUnlocked(state, s.id), `${s.id} unlocked in order`);
  state = startSection(state, s.id);
  state = finish(state, { miss: s.id === 'zero-x-banking' });
  assert(bankOf(state).sections[s.id]?.passed === true, `${s.id} passed`);
}
{
  const zx = bankOf(state).sections['zero-x-banking'];
  assert(zx.executionMiss === 2 && zx.executionMake === 0 && zx.passed, 'execution tracked separately: missed shots do not fail a knowledge pass');
  assert(sectionUnlocked(state, 'path-numbering'), 'stub reachable once earlier sections pass');
}
assert(examUnlocked(state), 'exam unlocks after all playable sections');
{
  const rows = pkfBankProgressRows(state);
  assert(rows.length === 1 && rows[0].id === 'pkfBank' && rows[0].finished && rows[0].done === 5, 'set progress row finished (emblem)');
}
state = startExam(state);
state = finish(state, { miss: true });
{
  const b = bankOf(state);
  assert(b.current.phase === 'results' && b.exam.passed && b.exam.attempts === 1, 'exam: 9/11 = 82% passes at 80%');
  assert(b.exam.history.length === 1 && b.exam.bestExecution === 0 && b.exam.bestKnowledge === 1, 'exam knowledge vs execution recorded separately');
  const rows = pkfBankProgressRows(state);
  assert(rows.some((r) => r.id === 'pkfBankExam' && r.finished), 'exam emblem row');
}

// ---------------------------------------------------------------- failing a section + REVIEW MISSED CONCEPTS
{
  let st = startSection({}, 'path-context');
  st = finish(st, { wrong: true });
  const b = bankOf(st);
  assert(b.current.phase === 'results' && !b.current.summary.passed && !b.sections['path-context'].passed, 'all wrong: section not passed');
  assert(!sectionUnlocked(st, 'find-path-drill'), 'next section stays locked');
  const missed = b.current.summary.missed;
  assert(missed.length === LESSONS.filter((l) => l.section === 'path-context' && l.answer != null).length, 'missed list = every question');
  st = reviewMissed(st);
  assert(bankOf(st).current.parent === 'review' && bankOf(st).current.order.join() === missed.join(), 'REVIEW MISSED CONCEPTS replays only missed questions');
  assert(startSection(st, 'path-context') === st, 'review run survives a re-render');
  st = finish(st);
  assert(bankOf(st).current.summary.review && !bankOf(st).sections['path-context'].passed && bankOf(st).sections['path-context'].attempts === 1, 'review run saves nothing');
  st = retryCurrent(st);
  assert(bankOf(st).current.parent !== 'review' && bankOf(st).current.phase === 'play' && bankOf(st).current.cursor === 0, 'RETRY starts a fresh section run');
}

// ---------------------------------------------------------------- DEV PREVIEW saves nothing
{
  let st = previewSection({}, 'corner-bank-drill');
  assert(bankOf(st).current?.dev === true && previewSection(st, 'corner-bank-drill') === st, 'previewSection is a DEV PREVIEW and survives re-render');
  st = finish(st);
  const b = bankOf(st);
  assert(b.current.phase === 'results' && !Object.keys(b.sections).length && b.stats.knowledgeCorrect === 0 && b.stats.executionMake === 0, 'DEV PREVIEW section saves nothing');
  let ex = previewExam({});
  ex = finish(ex);
  assert(bankOf(ex).exam.attempts === 0 && !bankOf(ex).exam.passed, 'DEV PREVIEW exam saves nothing');
  assert(!pkfBankProgressRows(ex).length, 'DEV PREVIEW adds no progress row');
}

// ---------------------------------------------------------------- table-step skip + Drill XP
{
  const runAll = (st, onShoot) => {
    let guard = 400;
    while (guard--) {
      const cur = bankOf(st).current;
      if (!cur || cur.phase === 'results') return st;
      const id = cur.order[cur.cursor];
      const lesson = lessonById(id);
      const it = cur.items[id];
      if (it.done) { st = nextLesson(st); continue; }
      if (lesson.answer != null && !it.locked) { st = selectChoice(st, lesson.answer); st = lockAnswer(st); continue; }
      if (lesson.shoot) { st = onShoot(st); continue; }
      st = acknowledgeLearn(st);
    }
    return st;
  };
  const drill = (st) => st?.prog?.drillXp || 0;
  let st = {};
  for (const sec of SECTIONS) {
    if (sec.stub) continue;
    st = startSection(st, sec.id);
    st = runAll(st, (x) => skipTableStep(x));
  }
  const bank = bankOf(st);
  assert(passedSectionCount(bank) === playableSectionCount(), 'Bank: course completes with every table step skipped');
  assert(drill(st) === 0 && !st.prog?.lifetimeXp, 'Bank: knowledge + skipped steps award 0 XP');
  assert(bank.stats.tableSkipped > 0 && skippedIds(bank).length === bank.stats.tableSkipped, `Bank: skipped steps listed (${bank.stats.tableSkipped})`);
  assert(examUnlocked(st), 'Bank: exam unlocks with skipped table steps');
  const row = readSetProgress(st).find((r) => r.id === 'pkfBank');
  assert(row && row.finished, 'Bank emblem row finished');
  assert(pkfProgressBoxHTML(st).includes('data-set-emblem="pkfBank"') && !setProgressBoxHTML(st).includes('data-set="pkfBank"') && completedSetsLineHTML(st).includes('data-set-emblem="pkfBank"'), 'Bank emblem shows on dashboard');
  st = startExam(st);
  st = runAll(st, (x) => skipTableStep(x));
  const b2 = bankOf(st);
  const h = b2.exam.history.at(-1);
  assert(b2.exam.passed === true, 'Bank: exam passes on knowledge with physical items skipped');
  assert(h.execution === null && h.skipped === b2.current.summary.skipped.length, `Bank: exam history records ${h.skipped} skipped`);
  // practice the skipped exam steps: first-try MAKE = 135 each, list cleared, exam record unchanged
  const n = b2.current.summary.skipped.length;
  const examBefore = JSON.stringify(b2.exam);
  st = reviewSkipped(st);
  st = runAll(st, (x) => markExecution(x, 'make'));
  assert(n === 0 || drill(st) === 135 * n, `Bank: first-try MAKE = 135 Drill XP per step (got ${drill(st)} for ${n})`);
  assert(JSON.stringify(bankOf(st).exam) === examBefore, 'Bank: practice run leaves the exam record alone');
  assert(!st.prog?.lifetimeXp && !st.prog?.careerXp && !Object.keys(st.prog?.items || {}).length, 'Bank: no Lifetime/Career XP or rank records');
}

console.log('\nType counts', counts, 'Assist', assists);
console.log(failed ? `\n${failed} FAILED` : '\nALL pkfBankingCourse TESTS PASSED');
process.exit(failed ? 1 : 0);
