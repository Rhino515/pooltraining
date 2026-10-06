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
  ASSET_MAP, REGIONS, assetOf, skipTableStep, skippedIds, passedSectionCount, lessonById
} from '../js/content/pkfCueBallCourse.js';
import { readSetProgress, setProgressBoxHTML, completedSetsLineHTML } from '../js/content/setProgress.js';
import { PAGES, regionHTML, regionOf, citeText, figureHTML, revealFigureHTML } from '../js/content/pkfCueBallAssets.js';
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
assert(SECTIONS.map((s) => s.id).join() === 'sliding-cue-ball,half-table,full-table', 'three sections in source order (Center Ball moved to PKF Shot Making & Center Ball)');
assert(playableSectionCount() === 3, 'three playable sections');
assert(LESSONS.filter((l) => l.incomplete).length === 1, 'one INCOMPLETE source-review stub');
assert(![...LESSONS, ...EXAM_ITEMS].some((l) => /^cb-/.test(l.id) || ['ex-k1', 'ex-k2', 'ex-k3', 'ex-x1'].includes(l.id) || l.section === 'center-ball'), 'no Center Ball lessons or exam items remain');
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
assert((counts.LEARN || 0) >= 10, `LEARN ${counts.LEARN}`);
assert((counts[LTYPE.PREDICT] || 0) >= 5 && (counts[LTYPE.ACTION] || 0) >= 5, `PREDICT ${counts[LTYPE.PREDICT]} ACTION ${counts[LTYPE.ACTION]}`);
assert((counts[LTYPE.SHOOT] || 0) >= 7, `SHOOT ${counts[LTYPE.SHOOT]}`);
assert((counts[LTYPE.PLAN] || 0) >= 2, `PLAN ${counts[LTYPE.PLAN]}`);
assert(assists.GUIDED && assists.ASSISTED && assists.INDEPENDENT, `assist mix G${assists.GUIDED}/A${assists.ASSISTED}/I${assists.INDEPENDENT}`);
assert(EXAM_ITEMS.filter((e) => e.answer != null || e.plan).length >= 7 && EXAM_ITEMS.filter((e) => e.shoot).length >= 3, 'exam knowledge-heavy + physical');
assert(LESSONS.filter((l) => l.position && l.shoot).length >= 5, 'position drills present');
assert(!JSON.stringify([LESSONS, EXAM_ITEMS]).match(/not on All|Career XP|storage key/i), 'no internal notes in lesson copy');
assert(!pkfCueBallBannersHTML({}).match(/not on all|career xp|storage/i), 'no internal notes in banners');

let state = {};
assert(sectionUnlocked(state, 'sliding-cue-ball') && !sectionUnlocked(state, 'half-table'), 'first open (Sliding Cue Ball), second locked');
assert(sectionUnlocked(state, 'full-table', { dev: true }) && examUnlocked(state, { dev: true }), 'dev opens locked');
assert(courseOf(startSection({}, 'half-table')).current === null, 'locked section does not start');
assert(courseOf(startExam({})).current === null, 'locked exam does not start');
assert(!pkfCueBallBannersHTML({}).includes('href="#pkfcb/exam"') && pkfCueBallBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner lock / preview');

// LOCK ANSWER gating on the first section (Sliding Cue Ball)
state = startSection({}, 'sliding-cue-ball');
state = acknowledgeLearn(state); state = nextLesson(state);
{
  const cur = courseOf(state).current;
  const id = cur.order[cur.cursor];
  const lesson = LESSONS.find((l) => l.id === id);
  assert(lesson.id === 'sl-90' && lesson.answer === '90', 'landed on sl-90 predict');
  assert(lockAnswer(state) === state, 'cannot lock without choice');
  assert(acknowledgeLearn(state) === state && markExecution(state, 'makePos') === state, 'cannot skip question');
  state = selectChoice(state, '45');
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
  // use open first section shoot
  let st = startSection({}, 'sliding-cue-ball');
  st = skipTo({ ...st, pkfCueBallControl: courseOf(st) }, 'sliding-cue-ball', 'sl-shoot-gate');
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
  assert(rows.length === 1 && rows[0].id === 'pkfCueBall' && rows[0].finished && rows[0].done === 3, 'progress row finished');
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
  let st = startSection({}, 'sliding-cue-ball');
  const bank = courseOf(st);
  const shootId = 'sl-shoot-gate';
  bank.current = { mode: 'section', sectionId: 'sliding-cue-ball', phase: 'play', cursor: 0, view: 0, order: [shootId], items: { [shootId]: { locked: false, choice: null, correct: null, revealed: false, execution: null, attempts: [], done: false, hint: false, planChoices: {} } } };
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
  const a = assetOf('sl-intro');
  assert(a && a.h === 1080 && a.crop.h > 0 && 'y' in a.crop, 'teaching asset has height-based crop fields');
  const c = a.crop;
  assert(c.y + c.h <= 1.0001, 'crop in bounds');
}

function lessonSrc(id) { return LESSONS.find((l) => l.id === id)?.src; }

// v14-98: captions show the PRINTED page (JPEG footer) once — never the PDF index, never duplicated.
{
  assert(PAGES[37].printed === 23 && PAGES[57].printed === 43, 'Center Ball printed = PDF − 14');
  assert(PAGES[61].printed === 44 && PAGES[72].printed === 55 && PAGES[74].printed === 57, 'Sliding printed = PDF − 17 (after inserts 58–60)');
  assert(PAGES[77].printed === 58 && PAGES[103].printed === 84, 'Half Table printed = PDF − 19 (figure 5-1 on PDF 77 = page 58)');
  assert(PAGES[107].printed === 85 && PAGES[150].printed === 128, 'Full Table printed = PDF − 22');
  assert([58, 59, 60, 75, 76, 104, 105, 106].every((n) => PAGES[n].printed == null), 'divider/blank inserts have no printed page');
  const all = [...LESSONS, ...EXAM_ITEMS];
  const bad = [];
  for (const l of all) {
    const a = assetOf(l.id);
    for (const r of [a, a?.reveal].filter(Boolean)) {
      const html = regionHTML(r);
      const cite = (html.match(/<p class="pkfbCite[^"]*">([^<]*)<\/p>/) || [])[1] || '';
      const nums = cite.match(/\d+/g) || [];
      const want = PAGES[r.page].printed;
      if (want == null ? nums.length : (cite !== `PKF page ${want} · tap to enlarge`)) bad.push(`${l.id}:${r.key}:${cite}`);
      if ((cite.match(/page/gi) || []).length > 1) bad.push(`${l.id}:${r.key}:dup:${cite}`);
    }
  }
  assert(!bad.length, `every caption = "PKF page <printed> · tap to enlarge"${bad.length ? ' ' + bad.slice(0, 5).join(' | ') : ''}`);
  const plan = regionHTML(assetOf('ht-plan-3'));
  assert(plan.includes('PKF page 58 · tap to enlarge') && !plan.includes('PKF page 63') && !plan.includes('page 72'), 'Half Table Plan caption: PKF page 58, once');
  assert(citeText(regionOf('t75')) === 'PKF Half Table Patterns divider · tap to enlarge', 'divider caption has no fake page number');
  // Section ranges and lesson source lines use printed pages.
  const rng = Object.fromEntries(SECTIONS.map((s) => [s.id, s.pages.split('–').map(Number)]));
  assert(rng['full-table'][1] === 128 && rng['half-table'].join() === '58,84' && rng['sliding-cue-ball'].join() === '44,57', 'section printed ranges match footers');
  const srcBad = LESSONS.filter((l) => {
    const n = (String(l.src).match(/Pages? (\d+)/) || [])[1];
    if (!n) return false;
    const [lo, hi] = rng[l.section];
    return +n < lo || +n > hi;
  }).map((l) => `${l.id}:${l.src}`);
  assert(!srcBad.length, `lesson source pages inside their section's printed range ${srcBad.join(' | ')}`);
  for (const id of ['ht-work-back', 'ft-intro', 'ft-plan-9', 'ft-preshot', 'ht-draw-vs-roll']) {
    const a = assetOf(id);
    const n = +(String(lessonSrc(id)).match(/Pages? (\d+)/) || [])[1];
    assert(n === a.printed || n === a.printed - 1, `${id} source page ${n} matches its PKF figure page ${a.printed}`);
  }
}

// v14-98: PLAN figures focus on the diagram (CSS viewport only); full page stays available; answers stay hidden pre-LOCK.
{
  const p3 = assetOf('ht-plan-3');
  assert(p3.key === 'f77-5-1' && p3.page === 77 && p3.figs === 'Figure 5-1', 'Half Table Plan uses the figure 5-1 crop on PDF 77');
  assert(p3.crop.w < 0.6 && p3.crop.h < 0.3 && p3.crop.y > 0.7 && p3.crop.y + p3.crop.h <= 0.97, 'figure 5-1 crop is the diagram, not the whole page');
  assert(p3.fullSafe && p3.view.w === 1 && p3.view.h === 1, 'View Full PKF Example shows the whole PDF 77 page (no printed answer on it)');
  assert(p3.reveal?.page === 78 && !p3.textOnlyUntilLock, 'pattern 1 solution (PDF 78) only after LOCK');
  const html = figureHTML('ht-plan-3', { fullBtn: true });
  assert(html.includes('PKF_CueBall_PDF_077.jpg') && html.includes('--cy:0.727') && html.includes('VIEW FULL PKF EXAMPLE') && html.includes('data-cw="1"'), 'crop + full-page button rendered from the original JPEG');
  const p58 = assetOf('ft-plan-5-8');
  assert(p58.key === 'f107-6-1' && p58.crop.x + p58.crop.w < 0.51 && !p58.fullSafe, 'Full-table Plan 5→8 shows figure 6-1 only (6-2 solution paths cropped out; no full page pre-LOCK)');
  const p9 = assetOf('ft-plan-9');
  assert(p9.key === 'f141-6-133' && p9.crop.y + p9.crop.h < 0.3 && !p9.fullSafe, '9-ball Plan shows figure 6-133 only (solution text/diagram cropped out pre-LOCK)');
  assert(REGIONS['f77-5-1'] && REGIONS['f107-6-1'] && REGIONS['f141-6-133'], 'figure-only regions registered');
}

// ---------------------------------------------------------------- table-step skip + Drill XP
{
  const runAll = (st, onShoot) => {
    let guard = 400;
    while (guard--) {
      const cur = courseOf(st).current;
      if (!cur || cur.phase === 'results') return st;
      const id = cur.order[cur.cursor];
      const lesson = lessonById(id);
      const it = cur.items[id];
      if (it.done) { st = nextLesson(st); continue; }
      if (lesson.plan && !it.locked) { for (const s of lesson.plan.steps) st = selectPlanStep(st, s.id, s.answer); st = lockAnswer(st); continue; }
      if (lesson.answer != null && !it.locked) { st = lockAnswer(selectChoice(st, lesson.answer)); continue; }
      if (lesson.shoot) { st = onShoot(st, lesson); continue; }
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
    const sum = courseOf(st).current.summary;
    assert(sum.skipped.every((id) => sum.missedPos.includes(id)), `Cue Ball ${sec.id}: skipped steps go to PRACTICE MISSED POSITIONS`);
  }
  const c = courseOf(st);
  assert(passedSectionCount(c) === playableSectionCount(), 'Cue Ball: course completes with every table step skipped');
  assert(drill(st) === 0 && !st.prog?.lifetimeXp, 'Cue Ball: knowledge + skipped steps award 0 XP');
  assert(c.stats.tableSkipped > 0 && c.stats.executionMake === 0 && c.stats.executionMiss === 0, `Cue Ball: ${c.stats.tableSkipped} skips, no make/miss counted`);
  assert(skippedIds(c).length > 0, 'Cue Ball: persistent skipped list');
  const row = readSetProgress(st).find((r) => r.id === 'pkfCueBall');
  assert(row && row.finished, 'Cue Ball emblem row finished');
  assert(setProgressBoxHTML(st).includes('data-set-emblem="pkfCueBall"') && completedSetsLineHTML(st).includes('data-set-emblem="pkfCueBall"'), 'Cue Ball emblem shows on dashboard');
  assert(examUnlocked(st), 'Cue Ball: exam unlocks with skipped table steps');
  st = startExam(st);
  st = runAll(st, (x) => skipTableStep(x));
  const c2 = courseOf(st);
  const h = c2.exam.history.at(-1);
  assert(c2.exam.passed === true && h.execution === null && h.skipped >= 3, `Cue Ball: exam passes on knowledge, ${h.skipped} physical items skipped`);
  // practice positions: skipped run must not count as passed
  st = reviewMissedPositions(st);
  st = runAll(st, (x) => skipTableStep(x));
  assert(courseOf(st).current.summary.passed === false, 'Cue Ball: skipping in PRACTICE MISSED POSITIONS is not a pass');
  // recorded steps: 1st-try success 135, 2nd-try success 75, failed after 3 = 0
  let s2 = startSection({}, SECTIONS[0].id);
  let k = 0;
  const amounts = [];
  s2 = runAll(s2, (x) => {
    const before = drill(x);
    let y;
    if (k === 0) y = markExecution(x, 'makePos');
    else if (k === 1) y = markExecution(markExecution(x, 'miss'), 'makePos');
    else y = markExecution(markExecution(markExecution(x, 'miss'), 'miss'), 'miss');
    k += 1;
    amounts.push(drill(y) - before);
    return y;
  });
  assert(amounts[0] === 135 && (amounts.length < 2 || amounts[1] === 75) && amounts.slice(2).every((a) => a === 0), `Cue Ball: Drill XP per recorded step ${amounts.join('/')}`);
  assert(!s2.prog?.lifetimeXp && !s2.prog?.careerXp && !Object.keys(s2.prog?.items || {}).length, 'Cue Ball: no Lifetime/Career XP or rank records');
}

if (failed) { console.error(`\n${failed} FAILED`); process.exit(1); }
console.log('\nALL pkfCueBallCourse TESTS PASSED');
