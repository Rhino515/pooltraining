/**
 * Focused tests for PKF Fundamentals Course (+ Exam).
 *   node scripts/pkfFundamentalsCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as C from '../js/content/pkfFundamentalsCourse.js';
import { PAGES, REGIONS, ASSET_MAP, assetOf, figureHTML } from '../js/content/pkfFundAssets.js';
import { defaultState } from '../js/storage.js';
import { createPkfFundScreen } from '../js/ui/pkfFundPlay.js';
import * as G from '../js/dev/gate.js';
import { readSetProgress, setProgressBoxHTML, completedSetsLineHTML } from '../js/content/setProgress.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); } else console.log('PASS', msg);
}
const { SECTIONS, LESSONS, EXAM_ITEMS } = C;

// ---- source + structure ----
assert(C.auditCourse().length === 0, `audit clean ${JSON.stringify(C.auditCourse())}`);
assert(C.COURSE_TITLE === 'PKF Fundamentals Course' && C.EXAM_TITLE === 'PKF Fundamentals Exam', 'titles');
assert(C.STORAGE_KEY === 'pkfFundamentals' && C.HASH === 'pkffund', 'storage key + route');
assert(!(C.STORAGE_KEY in defaultState()), 'key not in defaultState');
assert(SECTIONS.map((s) => s.id).join() === 'shooting-line,stance,forearm-grip,stroke,tip-eyes,stroke-drill,stroke-memory,stances,open-closed,tripod,rail-bridges,tight-spots', '12 sections in PKF book order');
assert(SECTIONS.filter((s) => s.area === 'fundamentals').length === 7 && SECTIONS.filter((s) => s.area === 'bridges').length === 5, 'Fundamentals then Bridges / Stances');
assert(SECTIONS.every((s) => C.knowledgeLessons(s.id).length > 0), 'every section has knowledge checks');
const srcDir = '/workspace/pkf-fund-src';
let identical = 0;
for (let n = 9; n <= 34; n++) {
  const name = `PKF_Fundamentals_PDF_${String(n).padStart(3, '0')}.jpg`;
  const dst = path.join(root, 'images/pkf-fund', name);
  const ok = fs.existsSync(dst) && (!fs.existsSync(path.join(srcDir, name)) ||
    crypto.createHash('sha256').update(fs.readFileSync(path.join(srcDir, name))).digest('hex') === crypto.createHash('sha256').update(fs.readFileSync(dst)).digest('hex'));
  if (ok) identical += 1;
}
assert(identical === 26, `26 original JPEGs present, byte-identical (${identical})`);
assert(Object.keys(PAGES).length === 26 && Object.values(PAGES).every((p) => p.src.startsWith('./images/pkf-fund/PKF_Fundamentals_PDF_')), 'page map → images/pkf-fund');
assert(Object.values(REGIONS).every((r) => r.crop.x >= 0 && r.crop.y >= 0 && r.crop.x + r.crop.w <= 1.0001 && r.crop.y + r.crop.h <= 1.0001), 'crops inside page');
assert([...LESSONS, ...EXAM_ITEMS].every((l) => ASSET_MAP[l.id] && assetOf(l.id)), 'every lesson + exam item has an original-image asset');
assert(Object.values(ASSET_MAP).every((a) => ['teaching', 'reference', 'question', 'answer', 'practice'].includes(a.purpose)), 'asset purposes valid');
{
  const h = figureHTML('st-id-back90', {});
  assert(/--ch:/.test(h) && /top:|pkfbCrop/.test(h) && !/<canvas|<svg/.test(h), 'figure is a CSS viewport on the original JPEG (no redraw)');
  const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  assert(/\.pkfbCrop img\{[^}]*top:calc\(var\(--cy\) \/ var\(--ch\) \* -100%\)[^}]*height:calc\(100% \/ var\(--ch\)\)/.test(css), 'crop math positions vertically by height (banking viewer)');
}
const q = (l) => C.isKnowledge(l);
assert(LESSONS.filter((l) => l.type === 'IDENTIFY').every((l) => assetOf(l.id).reveal || assetOf(l.id).textOnlyUntilLock), 'identification items reveal PKF page after lock');
assert(!/photo\)|caption hidden/.test(figureHTML('st-id-back90', {})), 'cite text has no internal labels');
// textOnly before lock
assert(/data-pkff-hidden-fig/.test(figureHTML('sk-q-tempo', { hideUntilLock: true })), 'text-only question hides figure until lock');
// no repetition counts enforced; quotes cite pages
const blob = JSON.stringify([LESSONS, EXAM_ITEMS]);
assert(!/\b(do|shoot|hit|repeat)\s+\d+\s+(times|shots|reps)\b/i.test(blob), 'no invented repetition counts');
assert(/several hundred shots/.test(blob) && /The app does not set a count/.test(blob), 'PKF repetition language quoted, app sets no count');
assert(!/not on All|Career XP|storage key|internal|TODO/i.test(blob), 'no internal notes in lesson copy');
assert(!/english|sidespin|left spin|right spin/i.test(LESSONS.filter((l) => l.type === 'LEARN').map((l) => l.explain).join(' ')), 'no spin/English teaching');
const tc = C.lessonTypeCounts();
assert(tc.LEARN && tc.IDENTIFY && tc.IMPORTANT && tc.SEQUENCE && tc.PRACTICE, `type mix ${JSON.stringify(tc)}`);
const ac = C.assistCounts();
assert(ac.GUIDED && ac.ASSISTED && ac.INDEPENDENT, `assist mix ${JSON.stringify(ac)}`);
assert(EXAM_ITEMS.filter(q).length >= 18 && EXAM_ITEMS.filter((e) => e.physical).length === 3, 'exam: knowledge-heavy + 3 physical checkpoints');

// ---- helpers ----
function answer(state, right) {
  const cur = C.courseOf(state).current;
  const l = C.lessonById(cur.order[cur.cursor]);
  if (l.type === 'LEARN') state = C.acknowledgeLearn(state);
  else if (l.type === 'PRACTICE') state = C.rate(state, C.ratingSet(l)[right ? 0 : C.ratingSet(l).length - 1][0]);
  else if (l.type === 'SEQUENCE') {
    const order = right ? l.seq.answer : [...l.seq.answer].reverse();
    for (const k of order) state = C.seqTap(state, k);
    state = C.lockAnswer(state);
  } else {
    const v = right ? l.answer : l.choices.find((c) => c[0] !== l.answer)[0];
    state = C.selectChoice(state, v);
    state = C.lockAnswer(state);
  }
  return C.nextLesson(state);
}
function runAll(state, rightFn) {
  let guard = 0;
  while (C.courseOf(state).current?.phase === 'play' && guard++ < 200) {
    const cur = C.courseOf(state).current;
    state = answer(state, rightFn(C.lessonById(cur.order[cur.cursor]), cur.cursor));
  }
  return state;
}

// ---- gating ----
let s = {};
assert(C.sectionUnlocked(s, 'shooting-line') && !C.sectionUnlocked(s, 'stance'), 'only section 1 open at start');
assert(C.startSection(s, 'stance') === s, 'cannot start locked section');
assert(!C.examUnlocked(s), 'exam locked at start');
// lock required before reveal
s = C.startSection(s, 'shooting-line');
s = C.acknowledgeLearn(s); s = C.nextLesson(s); s = C.acknowledgeLearn(s); s = C.nextLesson(s);
const before = s;
s = C.lockAnswer(s);
assert(s === before, 'cannot lock without a choice');
s = C.nextLesson(s);
assert(C.courseOf(s).current.cursor === 2, 'cannot skip an unanswered check');
// all wrong → fail section, review list populated
s = {};
s = C.startSection(s, 'shooting-line');
s = runAll(s, () => false);
let co = C.courseOf(s);
assert(co.current.phase === 'results' && !co.current.summary.passed && !co.sections['shooting-line'].passed, 'section fails below 70%');
assert(C.reviewIds(co).length === C.knowledgeLessons('shooting-line').length, 'missed checks go to REVIEW FUNDAMENTALS');
assert(co.stats.firstTotal === 3 && co.stats.firstCorrect === 0, 'first-answer accuracy tracked');
// retry, all right → pass, review clears, first-answer stays
s = C.retryCurrent(s);
s = runAll(s, () => true);
co = C.courseOf(s);
assert(co.sections['shooting-line'].passed && C.sectionUnlocked(s, 'stance'), 'pass at 100% unlocks next section');
assert(C.reviewIds(co).length === 0, 'correct answers clear REVIEW FUNDAMENTALS');
assert(co.stats.firstTotal === 3 && co.stats.firstCorrect === 0, 'first-answer accuracy is first attempt only');
// exactly 70% passes: stance has 6 checks → 5/6 = 83%; 4/6 = 67% fails
{
  const ks = C.knowledgeLessons('stance').map((l) => l.id);
  let t = C.startSection(s, 'stance');
  t = runAll(t, (l) => !(ks.indexOf(l.id) >= 4));
  assert(!C.courseOf(t).sections.stance.passed, `4/6 (67%) does not pass`);
  t = C.retryCurrent(t);
  t = runAll(t, (l) => !(ks.indexOf(l.id) === 5));
  assert(C.courseOf(t).sections.stance.passed, `5/6 (83%) passes`);
}
// self-eval never gates: all knowledge right, every practice rated NEEDS PRACTICE
{
  let t = C.startSection(s, 'stance');
  t = runAll(t, (l) => l.type !== 'PRACTICE');
  const c2 = C.courseOf(t);
  assert(c2.sections.stance.passed, 'NEEDS PRACTICE self-evaluation does not block the section');
  assert(c2.needsPractice['st-practice'] && C.needsPracticeIds(c2).includes('st-practice'), 'self-marked skill lands in NEEDS PRACTICE');
  assert(c2.practice['st-practice'].sessions === 1 && c2.stats.practiceSessions === 1, 'practice session logged');
  // needs-practice run, rate comfortable → clears
  t = C.startReview(t, 'needs');
  assert(C.courseOf(t).current.mode === 'needs', 'NEEDS PRACTICE run starts');
  t = runAll(t, () => true);
  assert(!C.courseOf(t).needsPractice['st-practice'] && C.courseOf(t).practice['st-practice'].sessions === 2, 'good rating clears NEEDS PRACTICE');
  // completed lessons always replayable
  const t2 = C.startSingle(t, 'st-feet');
  assert(C.courseOf(t2).current?.mode === 'single', 'completed lesson replayable');
  assert(C.startSingle(t, 'ts-frozen') === t, 'not-yet-reached lesson not replayable outside Dev Mode');
}
// ---- dev preview saves nothing ----
{
  const t0 = {};
  let t = C.previewSection(t0, 'tight-spots');
  t = runAll(t, () => true);
  const c3 = C.courseOf(t);
  assert(c3.current.dev && c3.current.phase === 'results' && !Object.keys(c3.sections).length && !Object.keys(c3.lessons).length && !c3.stats.practiceSessions && !Object.keys(c3.needsPractice).length, 'dev preview saves nothing');
  let e = C.previewExam(t0);
  e = runAll(e, () => true);
  assert(!C.courseOf(e).exam.attempts && C.pkfFundProgressRows(e).length === 0, 'dev exam preview saves nothing');
}
// ---- full course + exam ----
let full = {};
for (const sec of SECTIONS) { full = C.startSection(full, sec.id); full = runAll(full, () => true); }
assert(C.examUnlocked(full), 'exam unlocks after all sections pass');
assert(C.pkfFundProgressRows(full)[0]?.finished && C.pkfFundProgressRows(full)[0].href === '#pkffund', 'progress row finished');
{
  const ek = EXAM_ITEMS.filter(q).map((l) => l.id);
  const allowedMiss = Math.floor(ek.length * 0.2);
  let e = C.startExam(full);
  e = runAll(e, (l, i) => (l.physical ? false : ek.indexOf(l.id) >= allowedMiss + 1));
  let ce = C.courseOf(e);
  assert(!ce.current.summary.passed && ce.exam.attempts === 1 && !ce.exam.passed, `exam below 80% knowledge → REVIEW`);
  e = C.retryCurrent(e);
  e = runAll(e, (l) => (l.physical ? false : ek.indexOf(l.id) >= allowedMiss));
  ce = C.courseOf(e);
  assert(ce.current.summary.passed && ce.exam.passed && ce.current.summary.xDone === 0, 'exam passes on knowledge only (physical NOT YET does not fail)');
  assert(ce.exam.history.length === 2 && ce.current.summary.recommend.length > 0, 'attempt history + recommended review');
  assert(C.needsPracticeIds(ce).includes('sd-practice-drill'), 'physical NOT YET → linked skill in NEEDS PRACTICE');
  const rows = C.pkfFundProgressRows(e);
  assert(rows.some((r) => r.id === 'pkfFundExam' && r.finished && r.href === '#pkffund/exam'), 'exam progress row');
  full = e;
}
// ---- banners ----
assert(/data-pkffund-locked="1"/.test(C.pkfFundBannersHTML({})) && !/data-pkffund-locked/.test(C.pkfFundBannersHTML(full)), 'banner exam lock');
assert(/data-dev-open="1"/.test(C.pkfFundBannersHTML({}, { dev: true })), 'banner dev open');
assert(!/not on all|career xp|storage/i.test(C.pkfFundBannersHTML({})), 'no internal notes in banners');

// ---- screens ----
function screen(state, args) {
  let st = state;
  const ctx = { getState: () => st, commit: (n) => { st = n; return st; }, go: () => {}, root: { innerHTML: '', querySelector: () => null } };
  const sc = createPkfFundScreen(ctx, args);
  sc.render();
  return { ctx, sc, html: () => ctx.root.innerHTML, state: () => st };
}
G.setDevBypass?.(() => false);
{
  const L0 = screen({}, []);
  assert(/data-pkff-home/.test(L0.html()) && /FUNDAMENTALS/.test(L0.html()) && /BRIDGES \/ STANCES/.test(L0.html()), 'list shows both areas');
  assert(/data-pkff-exam-locked="1"/.test(L0.html()) && /data-href="#courses"/.test(L0.html()), 'list: exam locked, back to Drill Sets');
  assert(/REVIEW FUNDAMENTALS/.test(L0.html()) && /NEEDS PRACTICE/.test(L0.html()) && /data-pkff-progress/.test(L0.html()), 'list: progress + review + needs-practice');
  const P = screen({}, ['shooting-line']);
  assert(/data-type="LEARN"/.test(P.html()) && /WHAT PKF SHOWS/.test(P.html()) && /VIEW FULL PKF PAGE/.test(P.html()), 'LEARN screen with original page + full page button');
  P.sc.onAction('pkff-ack', { dataset: {} }); P.sc.onAction('pkff-next', { dataset: {} });
  P.sc.onAction('pkff-ack', { dataset: {} }); P.sc.onAction('pkff-next', { dataset: {} });
  const pre = P.html();
  assert(/LOCK ANSWER/.test(pre) && !/data-pkff-sol/.test(pre) && !/data-pkff-verdict/.test(pre), 'question hides PKF answer before lock');
  P.sc.onAction('pkff-choice', { dataset: { v: 'imaginary' } });
  P.sc.onAction('pkff-lock', { dataset: {} });
  assert(/data-pkff-verdict="right"/.test(P.html()) && /data-pkff-sol/.test(P.html()), 'lock → Correct + PKF explanation');
  P.sc.onAction('pkff-enlarge', { dataset: { src: './images/pkf-fund/PKF_Fundamentals_PDF_011.jpg', w: '807', h: '1152', cx: '0.1', cy: '0.1', cw: '0.5', ch: '0.3' } });
  assert(/data-pkff-lite="1"/.test(P.html()) && /RESET/.test(P.html()) && /VIEW FULL PKF PAGE/.test(P.html()), 'lightbox with reset + full page');
  P.sc.onAction('pkff-lite-full', { dataset: {} });
  assert(/data-full="1"/.test(P.html()) && /--cw:1;--ch:1/.test(P.html()), 'lightbox full page view');
  // identification before lock: no full page escape
  const I = screen({ pkfFundamentals: { ...C.courseOf(full), current: null } }, ['stance']);
  let guard = 0;
  while (!/data-type="IDENTIFY"/.test(I.html()) && guard++ < 10) { I.sc.onAction('pkff-ack', { dataset: {} }); I.sc.onAction('pkff-next', { dataset: {} }); }
  assert(/data-type="IDENTIFY"/.test(I.html()) && /data-nofull="1"/.test(I.html()) && !/pkfbFullBtn/.test(I.html()), 'identification hides full page (printed caption) until lock');
  const E = screen({}, ['exam']);
  assert(/data-pkff-exam-locked="1"/.test(E.html()), 'exam route locked');
  G.setDevBypass?.(() => true);
  const D = screen({}, ['tight-spots']);
  assert(/data-dev-preview="1"/.test(D.html()), 'dev mode: locked section opens as DEV PREVIEW');
  const DE = screen({}, ['exam']);
  assert(/data-dev-preview="1"/.test(DE.html()) && /data-mode="exam"/.test(DE.html()), 'dev mode: exam preview');
  G.setDevBypass?.(() => false);
  const R = screen(full, ['exam']);
  assert(/data-pkff-results="1"/.test(R.html()) && /Knowledge Score/.test(R.html()) && /Concepts Mastered/.test(R.html()) && /Physical Practice Completed/.test(R.html()) && /Best Score/.test(R.html()) && /Attempt History/.test(R.html()) && /Recommended Review/.test(R.html()), 'exam results fields');
}

// ---- table-step skip + Drill XP ----
{
  const drill = (st) => st?.prog?.drillXp || 0;
  const step = (st, onPractice) => {
    const cur = C.courseOf(st).current;
    const l = C.lessonById(cur.order[cur.cursor]);
    if (l.type === 'PRACTICE') return C.nextLesson(onPractice(st, l));
    return answer(st, true);
  };
  const run = (st, onPractice) => { let g = 0; while (C.courseOf(st).current?.phase === 'play' && g++ < 300) st = step(st, onPractice); return st; };
  let st = {};
  for (const sec of SECTIONS) { st = C.startSection(st, sec.id); st = run(st, (x) => C.skipTableStep(x)); }
  const c = C.courseOf(st);
  assert(C.passedSectionCount(c) === SECTIONS.length, 'Fund: course completes with every PRACTICE step skipped');
  assert(drill(st) === 0 && !st.prog?.lifetimeXp, 'Fund: knowledge + skipped steps award 0 XP');
  const practiceIds = LESSONS.filter((l) => l.type === 'PRACTICE').map((l) => l.id);
  assert(c.stats.tableSkipped === practiceIds.length && c.stats.practiceSessions === 0, `Fund: ${c.stats.tableSkipped} skips counted, no practice sessions logged`);
  assert(practiceIds.every((id) => c.needsPractice[id]), 'Fund: skipped steps land on NEEDS PRACTICE');
  assert(C.progressSummary(st).lessonsDone === LESSONS.length, 'Fund: skipped steps count as moving through the lesson');
  const row = readSetProgress(st).find((r) => r.id === 'pkfFund');
  assert(row && row.finished, 'Fund emblem row finished');
  assert(setProgressBoxHTML(st).includes('data-set-emblem="pkfFund"') && completedSetsLineHTML(st).includes('data-set-emblem="pkfFund"'), 'Fund emblem shows on dashboard');
  assert(C.examUnlocked(st), 'Fund: exam unlocks with skipped steps');
  st = C.startExam(st);
  st = run(st, (x) => C.skipTableStep(x));
  const c2 = C.courseOf(st);
  const h = c2.exam.history.at(-1);
  assert(c2.exam.passed && h.physical === 'skipped' && h.skipped === 3, 'Fund: exam passes on knowledge with 3 physical checkpoints skipped');
  const R = screen(st, ['exam']);
  assert(/data-pkf-skipped-count="3"/.test(R.html()) && /skipped \(not attempted\)/.test(R.html()), 'Fund: exam results show skipped count');
  const H = screen({ ...st, pkfFundamentals: { ...c2, current: null } }, []);
  assert(new RegExp(`data-pkf-skipped-stat="${c2.stats.tableSkipped}"`).test(H.html()), 'Fund: course home shows Table steps skipped');
  // recorded self-evaluation: 135 first time, 8 on a mastered repeat; NEEDS PRACTICE rating still counts as performed
  let s2 = C.startSection({ pkfFundamentals: { ...c2, current: null } }, 'stroke-drill');
  const amounts = [];
  let k = 0;
  s2 = run(s2, (x, l) => { const b = drill(x); const set = C.ratingSet(l); const y = C.rate(x, set[k++ % 2 ? set.length - 1 : 0][0]); amounts.push(drill(y) - b); return y; });
  assert(amounts.length > 0 && amounts.every((a) => a === 135), `Fund: each first self-evaluation = 135 Drill XP (${amounts.join('/')})`);
  assert(!s2.prog?.lifetimeXp && !s2.prog?.careerXp && !Object.keys(s2.prog?.items || {}).length, 'Fund: no Lifetime/Career XP or rank records');
  // skip button visible on a PRACTICE step
  const P = screen({ ...s2, pkfFundamentals: { ...C.courseOf(s2), current: null } }, ['stroke-drill']);
  let g = 0;
  while (!/data-type="PRACTICE"/.test(P.html()) && g++ < 40) {
    P.ctx.commit(answer(P.state(), true)); P.sc.render();
  }
  assert(/data-pkf-skip="1"/.test(P.html()) && /SKIP TABLE STEP/.test(P.html()), 'Fund: SKIP TABLE STEP shown on a practice step');
}

if (failed) { console.error(`\n${failed} pkfFundamentalsCourse test(s) FAILED`); process.exit(1); }
console.log('\nALL pkfFundamentalsCourse TESTS PASSED');
