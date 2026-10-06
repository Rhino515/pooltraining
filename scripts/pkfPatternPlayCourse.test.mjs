/**
 * Focused tests for the PKF Pattern Play Course + PKF Pattern Play Exam.
 *   node scripts/pkfPatternPlayCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import * as PP from '../js/content/pkfPatternPlayCourse.js';
import { PAGES, REGIONS, FIG, INSERTS, regionOf, captionText, printedOf } from '../js/content/pkfPatternPlayAssets.js';
import * as CB from '../js/content/pkfCueBallCourse.js';
import { defaultState } from '../js/storage.js';
import { readSetProgress, setProgressBoxHTML, pkfProgressBoxHTML, completedSetsLineHTML } from '../js/content/setProgress.js';
import { createPkfPatternPlayScreen } from '../js/ui/pkfPatternPlayPlay.js';
import * as GATE from '../js/dev/gate.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}
const { SECTIONS, LESSONS, EXAM_ITEMS } = PP;
const ALL = [...LESSONS, ...EXAM_ITEMS];
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
GATE.setDevBypass?.(() => false);

// ---------------------------------------------------------------- identity + audit
assert(PP.COURSE_TITLE === 'PKF Pattern Play Course' && PP.EXAM_TITLE === 'PKF Pattern Play Exam', 'titles');
assert(PP.STORAGE_KEY === 'pkfPatternPlay' && PP.HASH === 'pkfpattern', 'storage key + route');
assert(!(PP.STORAGE_KEY in defaultState()), 'key is not in defaultState');
{
  const problems = PP.auditCourse();
  assert(!problems.length, `course audit clean ${problems.slice(0, 5).join(' | ')}`);
}
assert(SECTIONS.length === 9 && SECTIONS.map((s) => s.n).join() === '1,2,3,4,5,6,7,8,9', '9 sections numbered in order');
assert(SECTIONS.filter((s) => s.half).map((s) => s.id).join() === 'three-ball,four-ball,five-ball,wagon-wheel', 'half table = Chapter Five groups');
{
  const first = SECTIONS.map((s) => +s.pages.split('–')[0]);
  assert(first.every((p, i) => i === 0 || p >= first[i - 1]) && first[0] === 58 && SECTIONS.at(-1).pages.endsWith('136'), 'sections follow PKF page order 58–136');
}
assert(LESSONS.length >= 150 && EXAM_ITEMS.length === 23, `${LESSONS.length} lessons, ${EXAM_ITEMS.length} exam items`);
{
  const c = PP.lessonTypeCounts();
  const want = ['LEARN', 'NEXT', 'WHERE', 'SEQUENCE', 'BUILD', 'ROUTE', 'ACTION', 'SPEED', 'PROBLEM', 'SOLVE', 'RUN'];
  assert(want.every((t) => c[t] > 0), `every lesson type used ${JSON.stringify(c)}`);
}
assert(EXAM_ITEMS.filter(PP.isKnowledge).length === 18 && EXAM_ITEMS.filter(PP.isPlanning).length === 12 && EXAM_ITEMS.filter(PP.isPhysical).length === 5, 'exam: 18 knowledge (12 planning) + 5 physical');
assert(EXAM_ITEMS.filter(PP.isPhysical).some(PP.isHalf) && EXAM_ITEMS.filter(PP.isPhysical).some((l) => !PP.isHalf(l)), 'exam physical covers half and full table');
assert(EXAM_ITEMS.every((e) => LESSONS.some((l) => l.id === e.from)), 'exam items come from lessons taught in this course');
assert(PP.EXAM_PASS === 0.8 && PP.KNOWLEDGE_PASS === 0.7 && PP.ATTEMPTS_MAX === 3, 'app settings');
{
  const ORDER = { GUIDED: 0, ASSISTED: 1, INDEPENDENT: 2 };
  const bad = SECTIONS.filter((s) => { const l = PP.lessonsFor(s.id); return l.some((x, i) => i && ORDER[x.assist] < ORDER[l[i - 1].assist]); });
  assert(!bad.length && ['GUIDED', 'ASSISTED', 'INDEPENDENT'].every((a) => LESSONS.some((l) => l.assist === a)), 'GUIDED → ASSISTED → INDEPENDENT within each section');
}
assert(LESSONS.filter(PP.isPhysical).every((l) => l.physical.kind === 'pattern' && l.physical.shots.length >= 1 && /original|figure|PKF|Set up|Throw|Cue ball|Object ball|The 4/i.test(l.physical.setup.join(' '))), 'every RUN has shots + a setup from PKF’s figures');
assert(LESSONS.filter((l) => PP.isPhysical(l) && l.physical.shots.length > 1 && !l.physical.sequence).every((l) => l.physical.shots.at(-1).pos === false), 'multi-shot patterns end on a plain last shot');
assert(!JSON.stringify(LESSONS.map((l) => l.physical?.setup)).match(/\b\d+(\.\d+)?\s*(in|inch|cm)\b|x:\s*\d|coordinates?:/i), 'setups give no invented coordinates');

// ---------------------------------------------------------------- source pages + images
{
  for (let n = 75; n <= 158; n++) {
    const f = path.join(root, 'images', 'pkf-pattern', `PKF_PatternPlay_PDF_${String(n).padStart(3, '0')}.jpg`);
    if (!(fs.existsSync(f) && fs.statSync(f).size > 1000 && PAGES[n])) assert(false, `JPEG + page entry ${n}`);
  }
  assert(fs.readdirSync(path.join(root, 'images', 'pkf-pattern')).length === 84, '84 JPEGs, PDF 75–158');
  const zip = '/workspace/specs/PKF_Pattern_Play_Reference_Images.zip';
  if (fs.existsSync(zip)) {
    const diff = [];
    for (let n = 75; n <= 158; n++) {
      const name = `PKF_PatternPlay_PDF_${String(n).padStart(3, '0')}.jpg`;
      const a = execFileSync('unzip', ['-p', zip, `PKF_Pattern_Play_Reference_Images/${name}`], { maxBuffer: 1 << 26 });
      const b = fs.readFileSync(path.join(root, 'images/pkf-pattern', name));
      if (sha(a) !== sha(b)) diff.push(n);
    }
    assert(!diff.length, `all 84 images byte-identical to the zip ${diff.join(',')}`);
  }
  assert(printedOf(77) === 58 && printedOf(103) === 84 && printedOf(107) === 85 && printedOf(158) === 136, 'printed = PDF − 19 (77–103), PDF − 22 (107–158)');
  assert([75, 76, 104, 105, 106].every((n) => printedOf(n) == null && INSERTS[n]), 'divider / blank inserts have no printed page');
  const bad = [];
  for (const key of Object.keys(REGIONS)) {
    const r = regionOf(key);
    const c = r.crop;
    if (!(c.x >= 0 && c.y >= 0 && c.x + c.w <= 1.0001 && c.y + c.h <= 1.0001 && c.w > 0 && c.h > 0)) bad.push(`${key}:bounds`);
    const cap = captionText(r);
    if (r.printed != null && !cap.includes(`PKF page ${r.printed}`)) bad.push(`${key}:${cap}`);
    if ((cap.match(/page/gi) || []).length > 1) bad.push(`${key}:dup`);
  }
  assert(!bad.length, `crops in bounds; captions show the printed page once ${bad.slice(0, 5).join(' | ')}`);
  const pageBad = ALL.filter((l) => {
    const n = +(String(l.src).match(/Pages? (\d+)/) || [])[1];
    const a = PP.assetOf(l.id);
    const sec = PP.sectionById(l.section).pages.split('–').map(Number);
    const hi = sec[1] || sec[0];
    return !(n >= sec[0] && n <= hi) || !(a.printed == null || Math.abs(a.printed - n) <= 3);
  }).map((l) => `${l.id}:${l.src}`);
  assert(!pageBad.length, `lesson source pages inside their section and near their figure ${pageBad.slice(0, 5).join(' | ')}`);
  const unprinted = ALL.filter((l) => /Figure (5|6)-\d+/.test(l.src) && String(l.src).match(/Figures? ([\d-]+)/g)?.some((m) => { const k = m.replace(/Figures? /, ''); return !(k in FIG); }));
  assert(!unprinted.length, `cited figure numbers exist in PKF ${unprinted.slice(0, 3).map((l) => l.id).join(',')}`);
}

// ---------------------------------------------------------------- source map
{
  const rows = PP.sourceMapRows();
  assert(rows.length === ALL.length && rows.every(Boolean), 'every lesson + exam item has a mapping row');
  assert(rows.every((r) => r.sourceImage && r.sourcePdfPage >= 77 && r.sourcePdfPage <= 158 && r.chapter && r.pkfSection && r.purpose && r.crop), 'mapping rows complete');
  const doc = path.join(root, 'docs/PKF_PATTERN_PLAY_SOURCE_MAP.md');
  const md = fs.existsSync(doc) ? fs.readFileSync(doc, 'utf8') : '';
  assert(md && LESSONS.every((l) => md.includes(l.id)) && /SOURCE REVIEW/i.test(md), 'source map doc lists every lesson and the review flags');
  assert(md && [...Array(84).keys()].every((i) => md.includes(`PDF_${String(75 + i).padStart(3, '0')}`)), 'per-page audit covers PDF 75–158');
}

// ---------------------------------------------------------------- no answers before LOCK
{
  const leaks = [];
  for (const l of ALL.filter(PP.isKnowledge)) {
    const html = PP.figureHTML(l.id, { locked: false });
    if (/VIEW FULL PKF PAGE|PKF SOLUTION|PKF PATTERN/.test(html)) leaks.push(`${l.id}:button`);
    const a = PP.assetOf(l.id);
    if (a.reveal && a.reveal.key === a.key && !a.hidePre) leaks.push(`${l.id}:reveal=figure`);
    const alt = (html.match(/alt="([^"]*)"/) || [])[1];
    if (alt != null && alt !== l.title) leaks.push(`${l.id}:alt`);
    const ansLabel = (l.choices.find((c) => c[0] === l.answer) || [])[1];
    if (ansLabel && alt && alt.includes(ansLabel)) leaks.push(`${l.id}:alt-answer`);
  }
  assert(!leaks.length, `no full page / solution / answer alt text before LOCK ${leaks.slice(0, 5).join(' | ')}`);
  const hidden = ALL.filter((l) => PP.isKnowledge(l) && l.hidePre);
  assert(hidden.length >= 5 && hidden.every((l) => PP.figureHTML(l.id, { locked: false }).includes('data-pkfpp-hidden-fig')), 'answer-printing figures are hidden pre-lock');
  assert(PP.figureHTML('pp-ht-rules', { locked: true }).includes('VIEW FULL PKF PAGE'), 'full page available after lock / on LEARN');
  // screen: before LOCK neither the PKF answer verdict nor the explanation is in the DOM
  let s = PP.startSection({}, 'three-ball');
  s = PP.acknowledgeLearn(s); s = PP.nextLesson(s);
  let st2 = s;
  const ctx = { getState: () => st2, commit: (n) => { st2 = n; return st2; }, go: () => {}, root: { innerHTML: '', querySelector: () => null } };
  const R = createPkfPatternPlayScreen(ctx, ['three-ball']);
  R.render();
  const l = PP.lessonById(PP.courseOf(st2).current.order[1]);
  const pre = ctx.root.innerHTML;
  assert(pre.includes('LOCK ANSWER') && !pre.includes(l.explain.slice(0, 40)) && !/data-pkfpp-verdict|data-pkfpp-sol/.test(pre), 'screen: nothing revealed before LOCK');
  R.onAction('pkfpp-choice', { dataset: { v: l.answer } });
  R.onAction('pkfpp-lock', { dataset: {} });
  assert(/data-pkfpp-verdict="right"/.test(ctx.root.innerHTML), 'screen: verdict after LOCK');
  R.onAction('pkfpp-solution', { dataset: {} });
  assert(/data-pkfpp-sol="1"/.test(ctx.root.innerHTML) && /other runouts may exist/.test(ctx.root.innerHTML), 'screen: PKF solution labelled, not the only runout');
}

// ---------------------------------------------------------------- BUILD + shot-by-shot engine
{
  const build = LESSONS.find((l) => l.type === 'BUILD');
  let s = PP.startSingle({}, build.id);
  const balls = build.answer.split('-');
  s = PP.selectChoice(s, balls[0]);
  assert(PP.lockAnswer(s) === s, 'BUILD needs the whole runout before LOCK RUNOUT');
  s = PP.selectChoice(s, balls[0]);
  assert(PP.courseOf(s).current.items[build.id].build.length === 1, 'BUILD: each ball once');
  for (const b of balls.slice(1)) s = PP.selectChoice(s, b);
  s = PP.lockAnswer(s);
  assert(PP.courseOf(s).current.items[build.id].correct === true, 'BUILD: PKF order is correct');

  const run = LESSONS.find((l) => PP.isPhysical(l) && l.physical.shots.length === 3 && !l.physical.sequence);
  let r = PP.startSingle({}, run.id);
  assert(PP.markShot(r, 'pos') === r, 'cannot record before NOW RUN IT');
  r = PP.beginShooting(r);
  assert(PP.markShot(r, 'seq') === r, 'WRONG SEQUENCE only where sequence is part of the exercise');
  r = PP.markShot(r, 'pos');
  r = PP.markShot(r, 'lost');
  let it = PP.courseOf(r).current.items[run.id];
  assert(it.attempts.length === 1 && it.attempts[0].result === 'position' && it.between && !it.done, 'BALL MADE, POSITION LOST ends the attempt (position)');
  assert(PP.markShot(r, 'pos') === r, 'RESET / TRY AGAIN required between attempts');
  r = PP.resetAttempt(r);
  r = PP.markShot(r, 'miss');
  r = PP.resetAttempt(r);
  assert(!PP.shotTagsFor(run, 2).includes('lost') && PP.shotTagsFor(run, 2).includes('made'), 'last shot: BALL MADE / SHOT MISSED');
  r = PP.markShot(PP.markShot(PP.markShot(r, 'pos'), 'pos'), 'made');
  it = PP.courseOf(r).current.items[run.id];
  assert(it.done && it.execution === 'success' && it.attempts.map((a) => a.result).join() === 'position,missed,completed', 'three attempts saved with results');
  assert(PP.planRunLine(PP.courseOf(r).current, run.id).includes('Run: COMPLETED'), 'Plan / Run line');
  const seqRun = LESSONS.find((l) => PP.isPhysical(l) && l.physical.sequence);
  let q = PP.beginShooting(PP.startSingle({}, seqRun.id));
  q = PP.markShot(q, 'seq');
  assert(PP.courseOf(q).current.items[seqRun.id].attempts[0].result === 'sequence', 'WRONG SEQUENCE recorded on sequence exercises');
}

// ---------------------------------------------------------------- gating + full flow
function finish(s, { wrong = false, fail = false, skip = false } = {}) {
  for (let guard = 0; guard < 500; guard++) {
    const cur = PP.courseOf(s).current;
    if (!cur || cur.phase !== 'play') return s;
    const id = cur.order[cur.cursor];
    const l = PP.lessonById(id);
    const it = cur.items[id];
    if (!it.done) {
      if (PP.isKnowledge(l)) {
        if (PP.isBuild(l)) for (const b of (wrong ? l.answer.split('-').reverse() : l.answer.split('-'))) s = PP.selectChoice(s, b);
        else s = PP.selectChoice(s, wrong ? l.choices.find((c) => c[0] !== l.answer)[0] : l.answer);
        s = PP.lockAnswer(s);
      } else if (PP.isPhysical(l)) {
        if (skip) s = PP.skipTableStep(s);
        else {
          s = PP.beginShooting(s);
          if (fail) for (let i = 0; i < 3; i++) { s = PP.markShot(s, 'miss'); s = PP.resetAttempt(s); }
          else for (let i = 0; i < l.physical.shots.length; i++) s = PP.markShot(s, PP.shotTagsFor(l, i)[0]);
        }
      } else s = PP.acknowledgeLearn(s);
    }
    s = PP.nextLesson(s);
  }
  return s;
}
let st = {};
assert(PP.sectionUnlocked(st, 'three-ball') && !PP.sectionUnlocked(st, 'four-ball'), 'first open, second locked');
assert(PP.courseOf(PP.startSection({}, 'sidespin')).current === null && PP.courseOf(PP.startExam({})).current === null, 'locked section / exam do not start');
for (const sec of SECTIONS) {
  assert(PP.sectionUnlocked(st, sec.id), `${sec.id} unlocked in order`);
  st = PP.startSection(st, sec.id);
  st = finish(st, { fail: sec.id === 'four-ball' });
  assert(PP.courseOf(st).sections[sec.id]?.passed, `${sec.id} passed`);
}
{
  const c = PP.courseOf(st);
  const fourRuns = PP.lessonsFor('four-ball').filter(PP.isPhysical).length;
  assert(PP.needsPracticeIds(c).length === fourRuns && c.stats.patternsFailed === fourRuns && c.stats.shotErrors === fourRuns * 3, 'failed runouts → PRACTICE FAILED RUNOUTS (no section fail)');
  const p = PP.progressSummary(st);
  assert(p.lessonsDone === LESSONS.length && p.sectionsPassed === 9 && p.halfDone === p.halfTotal && p.fullDone === p.fullTotal, 'progress summary');
  assert(p.bestStreak > 0 && p.firstTryRuns === p.patternsCompleted && p.independentSolved === p.independentTotal, 'streak / first-try / independent stats');
  assert(PP.examUnlocked(st), 'exam unlocks after all sections');
  const rows = PP.pkfPatternPlayProgressRows(st);
  assert(rows[0].id === 'pkfPatternPlay' && rows[0].finished && rows[0].done === 9, 'progress row');
}
{
  let s2 = PP.startReview(st, 'practice');
  assert(PP.courseOf(s2).current.mode === 'practice', 'practice run from failed runouts');
  s2 = finish(s2);
  assert(PP.needsPracticeIds(PP.courseOf(s2)).length === 0 && PP.courseOf(s2).sections['four-ball'].attempts === 1, 'practice success clears list, never re-grades a section');
  // position errors list
  const run = LESSONS.find((l) => PP.isPhysical(l) && l.physical.shots.length > 1);
  let s3 = PP.startSection({ ...s2, [PP.STORAGE_KEY]: { ...PP.courseOf(s2), current: null } }, run.section);
  s3 = finish(s3, {});
  const s4 = PP.startReview(s3, 'position');
  assert(PP.courseOf(s4) && (PP.positionErrorIds(PP.courseOf(s3)).length === 0 ? s4 === s3 : PP.courseOf(s4).current.mode === 'position'), 'REVIEW POSITION ERRORS builds from position errors');
}
st = PP.startExam(st);
st = finish(st, { fail: true });
{
  const c = PP.courseOf(st);
  const s = c.current.summary;
  assert(c.exam.attempts === 1 && s.kTot === 18 && s.pTot === 12 && s.xTot === 5 && s.xOk === 0, 'exam: knowledge / planning / execution scored separately');
  assert(Math.abs(s.overall - 18 / 23) < 1e-9 && !s.passed, 'overall = (k + x) / 23 and 80% needed');
  assert(s.hTot > 0 && s.fTot > 0 && s.strongest && s.recommend.length > 0, 'half / full table scores, strongest area, recommended review');
  assert(c.exam.history[0].planning === 100 && typeof c.exam.history[0].at === 'string', 'attempt history');
  let st2 = st;
  const ctx = { getState: () => st2, commit: (n) => { st2 = n; return st2; }, go: () => {}, root: { innerHTML: '', querySelector: () => null } };
  createPkfPatternPlayScreen(ctx, ['exam']).render();
  const html = ctx.root.innerHTML;
  assert(['PKF PATTERN PLAY EXAM', 'Pattern Knowledge', 'Planning Accuracy', 'Physical Execution', 'Half Table Score', 'Full Table Score', 'Position Accuracy', 'Overall Score', 'RETRY', 'Strongest Area', 'Weakest Area', 'Recommended Review', 'Best Score', 'Attempt History'].every((t) => html.includes(t)), 'exam results lines');
}
{
  let d = PP.previewSection({}, 'actual-games');
  d = finish(d);
  const c = PP.courseOf(d);
  assert(!c.sections['actual-games'] && c.stats.patternAttempts === 0 && !Object.keys(c.lessons).length, 'dev preview saves nothing');
}

// ---------------------------------------------------------------- skip + Drill XP
{
  const drill = (x) => x?.prog?.drillXp || 0;
  let s = {};
  for (const sec of SECTIONS) {
    s = PP.startSection(s, sec.id);
    s = finish(s, { skip: true });
    const sum = PP.courseOf(s).current.summary;
    if (sum.skipped.some((id) => sum.missedRuns.includes(id))) assert(false, `${sec.id}: skipped counted as failed`);
  }
  const c = PP.courseOf(s);
  const physIds = LESSONS.filter(PP.isPhysical).map((l) => l.id);
  assert(PP.passedSectionCount(c) === SECTIONS.length, 'course completes with every table step skipped');
  assert(drill(s) === 0 && !s.prog?.lifetimeXp, 'knowledge + skipped steps award 0 XP');
  assert(c.stats.tableSkipped === physIds.length && c.stats.patternAttempts === 0 && c.stats.patternsCompleted === 0 && c.stats.streak === 0, 'skips counted, no attempts');
  assert(physIds.every((id) => c.needsPractice[id] && c.skipped[id]), 'skipped steps go to the practice list');
  const row = readSetProgress(s).find((r) => r.id === 'pkfPatternPlay');
  assert(row && row.finished, 'emblem row finished with skips');
  assert(pkfProgressBoxHTML(s).includes('data-set-emblem="pkfPatternPlay"') && !setProgressBoxHTML(s).includes('data-set="pkfPatternPlay"') && completedSetsLineHTML(s).includes('data-set-emblem="pkfPatternPlay"'), 'emblem shows in Profile box + Home badges');
  s = PP.startExam(s);
  s = finish(s, { skip: true });
  const c2 = PP.courseOf(s);
  const h = c2.exam.history.at(-1);
  assert(c2.exam.passed && h.execution === null && h.skipped === 5 && c2.current.summary.xTot === 0, 'exam passes on knowledge; skipped physical items excluded from execution');
  assert(readSetProgress(s).find((r) => r.id === 'pkfPatternPlayExam')?.finished, 'exam emblem row');
  // recorded steps: first-try success 135, second-try 75, failed 0
  let s3 = PP.startSection({ ...s, [PP.STORAGE_KEY]: { ...PP.courseOf(s), current: null } }, 'three-ball');
  const amounts = [];
  let k = 0;
  for (let guard = 0; guard < 300; guard++) {
    const cur = PP.courseOf(s3).current;
    if (!cur || cur.phase !== 'play') break;
    const id = cur.order[cur.cursor];
    const l = PP.lessonById(id);
    if (!cur.items[id].done) {
      if (PP.isKnowledge(l)) s3 = PP.lockAnswer(PP.selectChoice(s3, l.answer));
      else if (PP.isPhysical(l)) {
        const b = drill(s3);
        let y = PP.beginShooting(s3);
        const ok = (z) => { for (let i = 0; i < l.physical.shots.length; i++) z = PP.markShot(z, PP.shotTagsFor(l, i)[0]); return z; };
        if (k === 0) y = ok(y);
        else if (k === 1) { y = PP.resetAttempt(PP.markShot(y, 'miss')); y = ok(y); }
        else for (let i = 0; i < 3; i++) y = PP.resetAttempt(PP.markShot(y, 'miss'));
        k += 1;
        amounts.push(drill(y) - b);
        s3 = y;
      } else s3 = PP.acknowledgeLearn(s3);
    }
    s3 = PP.nextLesson(s3);
  }
  assert(amounts[0] === 135 && amounts[1] === 75 && amounts.slice(2).every((a) => a === 0), `Drill XP per recorded step ${amounts.join('/')}`);
  assert(!s3.prog?.lifetimeXp && !s3.prog?.careerXp && !Object.keys(s3.prog?.items || {}).length, 'no Lifetime/Career XP or rank records');
  const one = physIds[0];
  let s4 = PP.beginShooting(PP.startSingle(s3, one));
  const d4 = drill(s4);
  for (let i = 0; i < PP.lessonById(one).physical.shots.length; i++) s4 = PP.markShot(s4, PP.shotTagsFor(PP.lessonById(one), i)[0]);
  assert(drill(s4) === d4, 'single-lesson review (not graded) awards no Drill XP');
}

// ---------------------------------------------------------------- isolation + copy hygiene
{
  const hashes = { // v14-113: Cue Ball Control course card says COURSE and Back goes to Learn > Fundamentals
    'js/content/pkfCueBallCourse.js': '711d29c3d432bb9a35c92c2669f86e4bb64725a700fc018ebc6ce1b3138e007b',
    'js/content/pkfCueBallAssets.js': 'a51bb07963bc3c2aac7f8a7e51e194689373570370dd35f164c95e0cfc5c5be5',
    'js/ui/pkfCueBallPlay.js': '4adc83547a9f1b521b516c5214f795a675f2e100d90a1f9d75d6f80d015c631d'
  };
  assert(Object.entries(hashes).every(([f, h]) => sha(fs.readFileSync(path.join(root, f))) === h), 'PKF Cue Ball Control files untouched');
  assert(CB.LESSONS.length === 41 && CB.EXAM_ITEMS.length === 10, 'Cue Ball Control lessons / exam unchanged');
  const cbIds = new Set([...CB.LESSONS, ...CB.EXAM_ITEMS].map((l) => l.id));
  assert(!ALL.some((l) => cbIds.has(l.id)), 'no id shared with Cue Ball Control');
}
{
  const copy = JSON.stringify(ALL);
  assert(!/Tips\s*&\s*Tricks|TIPS & TRICKS/i.test(copy) && !ALL.some((l) => +(String(l.src).match(/Pages? (\d+)/) || [])[1] > 136), 'nothing from Tips & Tricks (pages > 136)');
  assert(!/SOURCE REVIEW|FLAG|TODO|storage key|Career XP|catalog|OCR/i.test(copy), 'no internal notes or review flags in lesson copy');
  assert(!PP.pkfPatternPlayBannersHTML({}).includes('href="#pkfpattern/exam"') && PP.pkfPatternPlayBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner lock / dev preview');
  assert(LESSONS.filter((l) => l.type === 'SPEED').every((l) => /soft|medium|firm|speed/i.test(l.explain)), 'speed questions only where PKF states the speed');
}

if (failed) { console.error(`\n${failed} pkfPatternPlayCourse TEST(S) FAILED`); process.exit(1); }
console.log('\nALL pkfPatternPlayCourse TESTS PASSED');
