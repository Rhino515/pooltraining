/**
 * Focused tests for the PKF Shot Making & Center Ball Course (+ its split from PKF Cue Ball Control).
 *   node scripts/pkfShotMakingCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as SM from '../js/content/pkfShotMakingCourse.js';
import { PAGES, REGIONS, regionOf, captionText, mappingRow } from '../js/content/pkfShotMakingAssets.js';
import * as CB from '../js/content/pkfCueBallCourse.js';
import * as FUND from '../js/content/pkfFundamentalsCourse.js';
import { defaultState } from '../js/storage.js';
import { readSetProgress, setProgressBoxHTML, pkfProgressBoxHTML, completedSetsLineHTML } from '../js/content/setProgress.js';
import { createPkfShotMakingScreen } from '../js/ui/pkfShotMakingPlay.js';
import * as GATE from '../js/dev/gate.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}
const { SECTIONS, LESSONS, EXAM_ITEMS } = SM;
const ALL = [...LESSONS, ...EXAM_ITEMS];

// ---------------------------------------------------------------- identity + audit
assert(SM.COURSE_TITLE === 'PKF Shot Making & Center Ball Course' && SM.EXAM_TITLE === 'PKF Shot Making & Center Ball Exam', 'titles');
assert(SM.STORAGE_KEY === 'pkfShotMakingCenterBall' && SM.HASH === 'pkfsmcb', 'storage key + route');
assert(!(SM.STORAGE_KEY in defaultState()), 'key is not in defaultState');
{
  const problems = SM.auditCourse();
  assert(!problems.length, `course audit clean ${problems.slice(0, 5).join(' | ')}`);
}
assert(SECTIONS.length === 11 && SECTIONS.map((s) => s.n).join() === '1,2,3,4,5,6,7,8,9,10,11', '11 sections numbered in order');
{
  const first = SECTIONS.map((s) => +s.pages.split('–')[0]);
  assert(first.every((p, i) => i === 0 || p >= first[i - 1]) && first[0] === 23 && SECTIONS.at(-1).pages.endsWith('43'), 'sections follow PKF page order 23–43');
}
assert(LESSONS.length >= 80 && EXAM_ITEMS.length === 17, `${LESSONS.length} lessons, ${EXAM_ITEMS.length} exam items`);
{
  const c = SM.lessonTypeCounts();
  assert(c.LEARN >= 15 && c.IDENTIFY >= 10 && c.PREDICT >= 10 && c.CHOOSE >= 6 && c.SHOOT >= 12, `type mix ${JSON.stringify(c)}`);
  const kinds = LESSONS.filter(SM.isPhysical).map((l) => l.physical.kind);
  assert(['pocket', 'action', 'check'].every((k) => kinds.includes(k)), 'all three physical kinds used');
}
assert(EXAM_ITEMS.filter(SM.isKnowledge).length === 13 && EXAM_ITEMS.filter(SM.isPhysical).length === 4, 'exam: 13 knowledge + 4 physical');
assert(new Set(EXAM_ITEMS.map((e) => e.section)).size >= 9, 'exam covers most sections');
assert(SM.EXAM_PASS === 0.8 && SM.KNOWLEDGE_PASS === 0.7 && SM.ATTEMPTS_MAX === 3, 'app settings');

// ---------------------------------------------------------------- source map
{
  const rows = SM.sourceMapRows();
  assert(rows.length === ALL.length && rows.every(Boolean), 'every lesson + exam item has a mapping row');
  assert(rows.every((r) => r.sourceImage && r.sourcePdfPage >= 35 && r.sourcePdfPage <= 58 && r.chapter === 'Chapter Three: Center Ball' && r.purpose), 'mapping rows complete (image, page, chapter, purpose)');
  const pur = new Set(['TEACHING', 'QUESTION', 'PHYSICAL SETUP', 'DRILL', 'REFERENCE']);
  assert(rows.every((r) => pur.has(r.purpose)), 'purposes are from the fixed list');
  assert(ALL.filter(SM.isKnowledge).every((l) => SM.assetOf(l.id).purpose === 'QUESTION'), 'questions map to QUESTION assets');
}
{
  for (let n = 35; n <= 58; n++) {
    const f = path.join(root, 'images', 'pkf-smcb', `PKF_CenterBall_PDF_${String(n).padStart(3, '0')}.jpg`);
    assert(fs.existsSync(f) && fs.statSync(f).size > 1000 && PAGES[n], `JPEG + page entry ${n}`);
  }
  const src = '/workspace/pkf-smcb-src';
  if (fs.existsSync(src)) {
    const want = fs.readdirSync(src, { recursive: true }).filter((f) => /PDF_037\.jpg$/.test(String(f)))[0];
    if (want) {
      const a = fs.readFileSync(path.join(src, String(want)));
      const b = fs.readFileSync(path.join(root, 'images/pkf-smcb/PKF_CenterBall_PDF_037.jpg'));
      assert(crypto.createHash('sha256').update(a).digest('hex') === crypto.createHash('sha256').update(b).digest('hex'), '037 byte-identical to the uploaded pack');
    }
  }
  assert(PAGES[37].printed === 23 && PAGES[57].printed === 43 && [35, 36, 58].every((n) => PAGES[n].printed == null), 'printed = PDF − 14; divider/blank have none');
  const bad = [];
  for (const key of Object.keys(REGIONS)) {
    const r = regionOf(key);
    const c = r.crop;
    if (!(c.x >= 0 && c.y >= 0 && c.x + c.w <= 1.0001 && c.y + c.h <= 1.0001 && c.w > 0 && c.h > 0)) bad.push(`${key}:bounds`);
    const cap = captionText(r);
    if (r.printed != null && !cap.includes(`PKF page ${r.printed} · tap to enlarge`)) bad.push(`${key}:${cap}`);
    if ((cap.match(/page/gi) || []).length > 1) bad.push(`${key}:dup`);
  }
  assert(!bad.length, `crops in bounds; captions "PKF page <printed> · tap to enlarge" once ${bad.slice(0, 5).join(' | ')}`);
  const pageBad = ALL.filter((l) => {
    const n = +(String(l.src).match(/Pages? (\d+)/) || [])[1];
    const a = SM.assetOf(l.id);
    const sec = SM.sectionById(l.section).pages.split('–').map(Number);
    const hi = sec[1] || sec[0];
    return !(n >= sec[0] && n <= hi) || !(a.printed == null || Math.abs(a.printed - n) <= 2);
  }).map((l) => `${l.id}:${l.src}`);
  assert(!pageBad.length, `lesson source pages inside their section and near their figure ${pageBad.slice(0, 5).join(' | ')}`);
  const unnumbered = ALL.filter((l) => /3-(55|57|61)\b/.test(JSON.stringify(l)));
  assert(!unnumbered.length, 'never names an unprinted figure number (3-55 / 3-57 / 3-61)');
}

// ---------------------------------------------------------------- no answers before LOCK
{
  const leaks = [];
  for (const l of ALL.filter(SM.isKnowledge)) {
    const html = SM.figureHTML(l.id, { locked: false });
    if (/VIEW FULL PKF PAGE|PKF SOLUTION/.test(html)) leaks.push(`${l.id}:button`);
    const a = SM.assetOf(l.id);
    if (!a.hidePre && a.reveal && a.reveal.key === a.key) leaks.push(`${l.id}:reveal=figure`);
  }
  assert(!leaks.length, `no full page / solution before LOCK ANSWER ${leaks.slice(0, 5).join(' | ')}`);
  const hidden = ALL.filter((l) => SM.isKnowledge(l) && SM.assetOf(l.id).hidePre);
  assert(hidden.every((l) => SM.figureHTML(l.id, { locked: false }).includes('data-pkfsm-hidden-fig')), 'answer-printing figures are hidden pre-lock');
  assert(SM.figureHTML('smcb-intro', { locked: true }).includes('VIEW FULL PKF PAGE'), 'full page available after lock / on LEARN');
}

// ---------------------------------------------------------------- gating + flow
let st = {};
assert(SM.sectionUnlocked(st, 'center-vs-sidespin') && !SM.sectionUnlocked(st, 'elevation-variables'), 'first open, second locked');
assert(SM.courseOf(SM.startSection({}, 'throw')).current === null && SM.courseOf(SM.startExam({})).current === null, 'locked section / exam do not start');
st = SM.startSection({}, 'center-vs-sidespin');
st = SM.acknowledgeLearn(st); st = SM.nextLesson(st);
st = SM.acknowledgeLearn(st); st = SM.nextLesson(st);
{
  const cur = SM.courseOf(st).current;
  assert(cur.order[cur.cursor] === 'smcb-q-line', 'reached first question');
  assert(SM.lockAnswer(st) === st && SM.nextLesson(st) === st && SM.showSolution(st) === st, 'cannot lock / skip / see solution without an answer');
  st = SM.selectChoice(st, 'left');
  st = SM.lockAnswer(st);
  const c = SM.courseOf(st);
  assert(c.current.items['smcb-q-line'].correct === false && c.review['smcb-q-line'] === 1 && c.lessons['smcb-q-line'].firstCorrect === false, 'wrong answer → review list, first-answer recorded');
  st = SM.showSolution(st);
  assert(SM.courseOf(st).current.items['smcb-q-line'].solution, 'SHOW PKF SOLUTION after lock');
}
function finish(s, { wrong = false, fail = false } = {}) {
  for (let guard = 0; guard < 300; guard++) {
    const cur = SM.courseOf(s).current;
    if (!cur || cur.phase !== 'play') return s;
    const id = cur.order[cur.cursor];
    const l = SM.lessonById(id);
    const it = cur.items[id];
    if (!it.done) {
      if (SM.isKnowledge(l)) s = SM.lockAnswer(SM.selectChoice(s, wrong ? l.choices.find((c) => c[0] !== l.answer)[0] : l.answer));
      else if (SM.isPhysical(l)) {
        s = SM.beginShooting(s);
        const rows = SM.PHYS[l.physical.kind];
        if (fail) for (let i = 0; i < 3; i++) s = SM.markAttempt(s, rows[rows.length - 1][0]);
        else { s = SM.markAttempt(s, rows[1][0]); s = SM.markAttempt(s, rows[0][0]); }
      } else s = SM.acknowledgeLearn(s);
    }
    s = SM.nextLesson(s);
  }
  return s;
}
st = {};
for (const sec of SECTIONS) {
  assert(SM.sectionUnlocked(st, sec.id), `${sec.id} unlocked in order`);
  st = SM.startSection(st, sec.id);
  st = finish(st, { fail: sec.id === 'finding-center' });
  assert(SM.courseOf(st).sections[sec.id]?.passed, `${sec.id} passed`);
}
{
  const c = SM.courseOf(st);
  assert(SM.needsPracticeIds(c).length === 3 && c.stats.failed === 3, 'failed shots → PRACTICE MISSED SHOTS (no section fail)');
  assert(c.stats.secondTry > 0 && c.stats.objectiveTotal > c.stats.objectiveOk && c.stats.madeTotal < c.stats.attempts, 'execution stats: tries, objective, made (check drills record no make)');
  const p = SM.progressSummary(st);
  assert(p.lessonsDone === LESSONS.length && p.sectionsPassed === 11 && p.conceptsMastered === p.conceptsTotal, 'progress summary');
  assert(SM.examUnlocked(st), 'exam unlocks after all sections');
  const rows = SM.pkfShotMakingProgressRows(st);
  assert(rows[0].id === 'pkfShotMaking' && rows[0].finished && rows[0].done === 11, 'progress row');
}
{
  let s2 = SM.startReview(st, 'practice');
  const cur = SM.courseOf(s2).current;
  assert(cur.mode === 'practice' && cur.order.length === 3, 'practice run built from needs-practice list');
  s2 = finish(s2);
  assert(SM.needsPracticeIds(SM.courseOf(s2)).length === 0 && SM.courseOf(s2).sections['finding-center'].attempts === 1, 'practice success clears list, never re-grades a section');
}
st = SM.startExam(st);
st = finish(st, { fail: true });
{
  const c = SM.courseOf(st);
  const s = c.current.summary;
  assert(c.exam.attempts === 1 && s.kTot === 13 && s.xTot === 4 && s.xOk === 0, 'exam scored knowledge vs execution');
  assert(Math.abs(s.overall - 13 / 17) < 1e-9 && !s.passed, 'overall = (k + x) / 17 and 80% needed');
  assert(s.strongest && s.weakest && s.strongest !== s.weakest && s.recommend.length === 4, 'strongest / weakest / recommended review');
  assert(c.exam.history[0].overall === Math.round((13 / 17) * 100) && typeof c.exam.history[0].at === 'string', 'attempt history');
}
{
  let d = SM.previewSection({}, 'automatic-aiming');
  d = finish(d);
  const c = SM.courseOf(d);
  assert(!c.sections['automatic-aiming'] && c.stats.attempts === 0 && !Object.keys(c.lessons).length, 'dev preview saves nothing');
  let one = SM.startSingle({}, 'smcb-low-action');
  one = finish(one);
  const c1 = SM.courseOf(one);
  assert(c1.current.mode === 'single' && !Object.keys(c1.lessons).length && !Object.keys(c1.sections).length, 'single-lesson review saves nothing graded');
}

// ---------------------------------------------------------------- split from Cue Ball Control: no duplicates
{
  const cbIds = new Set([...CB.LESSONS, ...CB.EXAM_ITEMS].map((l) => l.id));
  const smIds = ALL.map((l) => l.id);
  assert(!smIds.some((id) => cbIds.has(id)), 'no lesson / exam id in both courses');
  assert(![...cbIds].some((id) => SM.MOVED_CB_IDS.includes(id)), 'every moved Cue Ball Control id is gone from Cue Ball Control');
  assert(!CB.SECTIONS.some((s) => s.id === 'center-ball') && CB.SECTIONS[0].id === 'sliding-cue-ball', 'Cue Ball Control starts at Sliding Cue Ball');
  assert(CB.sectionUnlocked({}, 'sliding-cue-ball'), 'Sliding Cue Ball is open without Center Ball');
  const cbPages = CB.LESSONS.concat(CB.EXAM_ITEMS).map((l) => +(String(l.src).match(/Pages? (\d+)/) || [])[1]).filter(Boolean);
  assert(cbPages.every((n) => n >= 44), 'Cue Ball Control cites no Center Ball pages (23–43)');
  const smPages = ALL.map((l) => +(String(l.src).match(/Pages? (\d+)/) || [])[1]);
  assert(smPages.every((n) => n >= 23 && n <= 43), 'this course cites only pages 23–43');
  const fundIds = new Set([...(FUND.LESSONS || []), ...(FUND.EXAM_ITEMS || [])].map((l) => l.id));
  assert(!smIds.some((id) => fundIds.has(id)), 'no id shared with PKF Fundamentals');
  const pre = CB.LESSONS.filter((l) => l.prereq);
  assert(pre.length >= 10 && pre.every((l) => LESSONS.some((x) => x.id === l.prereq.lessonId)), 'Cue Ball Control prerequisite cards link to real lessons here');
  for (const id of Object.values(SM.CB_ID_MAP).flat()) assert(LESSONS.some((l) => l.id === id), `migration target exists ${id}`);
}

// ---------------------------------------------------------------- migration
{
  const old = {
    profile: { name: 'x' },
    pkfCueBallControl: {
      sections: {
        'center-ball': { passed: true, attempts: 2, knowledgeCorrect: 9, knowledgeTotal: 11, executionMake: 2, executionMiss: 1, missed: ['cb-rule-spin', 'cb-throw-q'], missedPos: ['cb-shoot-stop'], bestKnowledge: 0.82 },
        'sliding-cue-ball': { passed: true, attempts: 1 }
      },
      current: { mode: 'section', sectionId: 'center-ball', phase: 'play', cursor: 1, view: 1, order: ['cb-intro', 'cb-left-deflect', 'cb-shoot-high'], items: { 'cb-intro': { done: true }, 'cb-left-deflect': { done: true, locked: true, choice: 'left', correct: false }, 'cb-shoot-high': { done: false, attempts: [] } } },
      exam: { attempts: 1, passed: false, bestOverall: 0.6, history: [{ at: '2026-09-01T00:00:00Z', overall: 60 }], weak: { 'Left spin deflection': 2, 'Slide gate': 1 } },
      stats: { knowledgeCorrect: 9, knowledgeWrong: 2 }
    }
  };
  const before = JSON.stringify(old);
  const m1 = SM.migrateFromCueBall(old);
  assert(JSON.stringify(old) === before, 'migration is pure (input untouched)');
  const m2 = SM.migrateFromCueBall(m1);
  assert(m2 === m1, 'migration is idempotent (second run returns the same state)');
  const c = m1.pkfShotMakingCenterBall;
  assert(c.migratedFromCueBall?.v === 1 && c.unlockAll === true, 'marker + old pass keeps all sections open');
  assert(SECTIONS.every((s) => SM.sectionUnlocked(m1, s.id)) && !SECTIONS.some((s) => c.sections[s.id]?.passed), 'all open, none auto-passed');
  assert(c.lessons['smcb-intro'].done && c.lessons['smcb-left-deflect'].correct === false && c.lessons['smcb-rule-spin'].correct === false && c.lessons['smcb-high-close'].correct === true, 'lesson results carried over (missed stay missed)');
  assert(c.review['smcb-rule-spin'] && c.review['smcb-throw-q'] && c.review['smcb-left-deflect'], 'missed concepts → REVIEW MISSED CONCEPTS');
  assert(c.needsPractice['smcb-shoot-stop'] && !c.needsPractice['smcb-shoot-high'], 'missed position drills → PRACTICE MISSED SHOTS');
  assert(c.stats.knowledgeCorrect === 9 && c.stats.knowledgeWrong === 2 && c.stats.attempts === 0, 'knowledge counts carried, no attempts fabricated');
  assert(c.exam.attempts === 0 && c.exam.weak['Left spin, level cue'] === 2 && !c.exam.weak['Slide gate'], 'no exam score copied; moved weak areas only');
  assert(m1.pkfCueBallControl.sections['center-ball'] && m1.pkfCueBallControl.exam.history.length === 1 && m1.profile.name === 'x', 'old Cue Ball Control data kept in place');
  assert(m1.pkfCueBallControl.current === null && m1.pkfCueBallControl.legacyCurrent?.order?.[0] === 'cb-intro', 'old in-progress run parked, not deleted');
  assert(CB.courseOf(old).current === null, 'Cue Ball Control ignores a saved run with removed lessons');
  assert(CB.sectionPassed(CB.courseOf(m1), 'sliding-cue-ball') && CB.passedSectionCount(CB.courseOf(m1)) === 1, 'Cue Ball Control progress for remaining sections untouched');
  assert(SM.migrateFromCueBall({}) && Object.keys(SM.migrateFromCueBall({})).length === 0 && SM.migrateFromCueBall(defaultState()) !== null, 'no-op without Cue Ball Control data');
  const fresh = { pkfCueBallControl: { sections: { 'sliding-cue-ball': { passed: true } } } };
  assert(SM.migrateFromCueBall(fresh) === fresh, 'nothing to migrate → same object');
  const virt = SM.courseOf(old);
  assert(virt.migratedFromCueBall && SM.pkfShotMakingProgressRows(old).length === 1, 'courseOf / progress rows apply the migration virtually');
}

// ---------------------------------------------------------------- copy hygiene
assert(!JSON.stringify(ALL).match(/Career XP|storage key|not on All|45°/i), 'no internal notes or invented numbers in lesson copy');
assert(!SM.pkfShotMakingBannersHTML({}).includes('href="#pkfsmcb/exam"') && SM.pkfShotMakingBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner lock / dev preview');
assert(LESSONS.filter(SM.isPhysical).filter((l) => l.physical.kind === 'check').every((l) => l.physical.gaps?.some((g) => /pocket/i.test(g)) || /rail/.test(l.id)), 'check drills flag pocketing as not specified');

// ---------------------------------------------------------------- table-step skip + Drill XP
{
  GATE.setDevBypass?.(() => false);
  const drill = (x) => x?.prog?.drillXp || 0;
  const run = (s, onPhys) => {
    for (let guard = 0; guard < 400; guard++) {
      const cur = SM.courseOf(s).current;
      if (!cur || cur.phase !== 'play') return s;
      const id = cur.order[cur.cursor];
      const l = SM.lessonById(id);
      const it = cur.items[id];
      if (!it.done) {
        if (SM.isKnowledge(l)) s = SM.lockAnswer(SM.selectChoice(s, l.answer));
        else if (SM.isPhysical(l)) s = onPhys(s, l);
        else s = SM.acknowledgeLearn(s);
      }
      s = SM.nextLesson(s);
    }
    return s;
  };
  let s = {};
  let firstSkipFromSetup = true;
  for (const sec of SECTIONS) {
    s = SM.startSection(s, sec.id);
    // skip from SET UP on some steps, from the shooting screen on others
    s = run(s, (x) => { firstSkipFromSetup = !firstSkipFromSetup; return SM.skipTableStep(firstSkipFromSetup ? x : SM.beginShooting(x)); });
    const sum = SM.courseOf(s).current.summary;
    assert(sum.skipped.every((id) => !sum.missedShots.includes(id)), `SM ${sec.id}: skipped steps are not counted as missed shots`);
  }
  const c = SM.courseOf(s);
  const physIds = LESSONS.filter((l) => SM.isPhysical(l)).map((l) => l.id);
  assert(SM.passedSectionCount(c) === SECTIONS.length, 'SM: course completes with every table step skipped');
  assert(drill(s) === 0 && !s.prog?.lifetimeXp, 'SM: knowledge + skipped steps award 0 XP');
  assert(c.stats.tableSkipped === physIds.length && c.stats.attempts === 0 && c.stats.exercisesOk === 0 && c.stats.failed === 0, `SM: ${c.stats.tableSkipped} skips, no attempts/success/failed counted`);
  assert(physIds.every((id) => c.needsPractice[id]), 'SM: skipped steps go to PRACTICE MISSED SHOTS');
  const row = readSetProgress(s).find((r) => r.id === 'pkfShotMaking');
  assert(row && row.finished, 'SM emblem row finished');
  assert(pkfProgressBoxHTML(s).includes('data-set-emblem="pkfShotMaking"') && !setProgressBoxHTML(s).includes('data-set="pkfShotMaking"') && completedSetsLineHTML(s).includes('data-set-emblem="pkfShotMaking"'), 'SM emblem shows on dashboard');
  assert(SM.examUnlocked(s), 'SM: exam unlocks with skipped steps');
  s = SM.startExam(s);
  s = run(s, (x) => SM.skipTableStep(x));
  const c2 = SM.courseOf(s);
  const h = c2.exam.history.at(-1);
  assert(c2.exam.passed && h.execution === null && h.skipped === EXAM_ITEMS.filter((e) => SM.isPhysical(e)).length, `SM: exam passes on knowledge with ${h.skipped} physical items skipped`);
  let st2 = s;
  const ctx = { getState: () => st2, commit: (n) => { st2 = n; return st2; }, go: () => {}, root: { innerHTML: '', querySelector: () => null } };
  const R = createPkfShotMakingScreen(ctx, ['exam']); R.render();
  assert(new RegExp(`data-pkf-skipped-count="${h.skipped}"`).test(ctx.root.innerHTML) && /skipped \(not attempted\)/.test(ctx.root.innerHTML), 'SM: exam results show skipped count');
  // PRACTICE MISSED SHOTS from results includes the skipped items
  s = SM.reviewMissed(s, 'practice');
  assert(SM.courseOf(s).current?.mode === 'practice' && SM.courseOf(s).current.order.length === h.skipped, 'SM: PRACTICE MISSED SHOTS replays skipped items');
  // recorded steps: first-try success 135, 2nd-try 75, failed 0; single mode awards nothing
  let s3 = SM.startSection({ ...s, [SM.STORAGE_KEY]: { ...SM.courseOf(s), current: null } }, 'finding-center');
  const amounts = [];
  let k = 0;
  s3 = run(s3, (x, l) => {
    const b = drill(x);
    const rows = SM.PHYS[l.physical.kind];
    let y = SM.beginShooting(x);
    if (k === 0) y = SM.markAttempt(y, rows[0][0]);
    else if (k === 1) { y = SM.markAttempt(y, rows[rows.length - 1][0]); y = SM.markAttempt(y, rows[0][0]); }
    else for (let i = 0; i < 3; i++) y = SM.markAttempt(y, rows[rows.length - 1][0]);
    k += 1;
    amounts.push(drill(y) - b);
    return y;
  });
  assert(amounts[0] === 135 && (amounts.length < 2 || amounts[1] === 75) && amounts.slice(2).every((a) => a === 0), `SM: Drill XP per recorded step ${amounts.join('/')}`);
  const xpAfter = SM.courseOf(s3).current.items;
  assert(Object.values(xpAfter).some((it) => it.xp === 135), 'SM: +XP is stored on the step for the result screen');
  assert(!s3.prog?.lifetimeXp && !s3.prog?.careerXp && !Object.keys(s3.prog?.items || {}).length, 'SM: no Lifetime/Career XP or rank records');
  const one = physIds[0];
  let s4 = SM.startSingle(s3, one);
  const d4 = drill(s4);
  s4 = SM.beginShooting(s4);
  s4 = SM.markAttempt(s4, SM.PHYS[SM.lessonById(one).physical.kind][0][0]);
  assert(SM.courseOf(s4).current?.mode !== 'single' || drill(s4) === d4, 'SM: single-lesson review (not graded) awards no Drill XP');
}

if (failed) { console.error(`\n${failed} pkfShotMakingCourse TEST(S) FAILED`); process.exit(1); }
console.log('\nALL pkfShotMakingCourse TESTS PASSED');
