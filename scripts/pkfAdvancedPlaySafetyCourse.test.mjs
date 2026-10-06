/**
 * Focused tests for the PKF Advanced Play & Safety Course + PKF Advanced Play & Safety Exam.
 *   node scripts/pkfAdvancedPlaySafetyCourse.test.mjs
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as AP from '../js/content/pkfAdvancedPlaySafetyCourse.js';
import { PAGES, REGIONS, FIG, INSERTS, regionOf, captionText, printedOf, PDF_FIRST, PDF_LAST } from '../js/content/pkfAdvancedPlayAssets.js';
import * as PP from '../js/content/pkfPatternPlayCourse.js';
import { defaultState } from '../js/storage.js';
import { readSetProgress, completedSetsLineHTML } from '../js/content/setProgress.js';
import { createPkfAdvScreen } from '../js/ui/pkfAdvancedPlaySafetyPlay.js';
import * as GATE from '../js/dev/gate.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL', msg); }
  else console.log('PASS', msg);
}
const { SECTIONS, LESSONS, EXAM_ITEMS } = AP;
const ALL = [...LESSONS, ...EXAM_ITEMS];
GATE.setDevBypass?.(() => false);
const pageOf = (l) => +(String(l.src).match(/Page (\d+)/) || [])[1];

// ---------------------------------------------------------------- identity + audit
assert(AP.COURSE_TITLE === 'PKF Advanced Play & Safety Course' && AP.EXAM_TITLE === 'PKF Advanced Play & Safety Exam', 'titles');
assert(AP.STORAGE_KEY === 'pkfAdvancedPlaySafety' && AP.HASH === 'pkfadv', 'storage key + route');
assert(!(AP.STORAGE_KEY in defaultState()), 'key is not in defaultState');
{
  const problems = AP.auditCourse();
  assert(!problems.length, `course audit clean ${problems.slice(0, 5).join(' | ')}`);
}
assert(SECTIONS.length === 21 && SECTIONS.map((s) => s.n).join() === Array.from({ length: 21 }, (_, i) => i + 1).join(), '21 sections numbered in order');
{
  const first = SECTIONS.map((s) => +s.pages.split('–')[0]);
  assert(first.every((p, i) => i === 0 || p >= first[i - 1]) && first[0] === 137 && SECTIONS.at(-1).pages.endsWith('200'), 'sections follow PKF page order 137–200');
  const heads = ['Sliding Cue Ball Safeties', 'Be Aware of Your Backstroke', '8-Ball Strategies', 'Combinations', 'Consistency', '9-Ball Tips', 'Hangers', 'Kick Kill', 'Extreme Cut Shots', 'Kick Safe', 'Safeties', 'Aiming Jump Shots', 'Stop the Tip', 'Mosconi Cup Drills', '8-Ball Pattern Puzzles', 'Filipino Tips', 'Changing the Path'];
  const names = [...new Set(SECTIONS.map((s) => s.title.replace(/ · Part \d$/, '')))];
  assert(names.join('|') === heads.join('|'), 'section names are PKF’s own headings in PKF’s order');
}
assert(!SECTIONS.some((x) => ['exam', 'complete', 'rerun', 'lesson', ...AP.REVIEW_LISTS.map((r) => r.kind)].includes(x.id)), 'section routes never collide with exam / review routes');
assert(LESSONS.length >= 150 && EXAM_ITEMS.length === 31, `${LESSONS.length} lessons, ${EXAM_ITEMS.length} exam items`);
assert(LESSONS.every((l) => pageOf(l) >= 137 && pageOf(l) <= 200), 'every lesson cites a printed page 137–200');
{
  const c = AP.lessonTypeCounts();
  assert(Object.keys(AP.LTYPE).every((t) => c[t] > 0), `every lesson type used ${JSON.stringify(c)}`);
}
assert(EXAM_ITEMS.filter(AP.isKnowledge).length === 24 && EXAM_ITEMS.filter(AP.isPhysical).length === 7, 'exam: 24 knowledge + 7 physical');
assert(['safety', 'decision', 'pattern', 'knowledge'].every((a) => EXAM_ITEMS.some((l) => l.area === a)) && EXAM_ITEMS.filter(AP.isSafetyPhysical).length >= 3, 'exam covers every area, with safety table work');
assert(EXAM_ITEMS.every((e) => LESSONS.some((l) => l.id === e.from)), 'exam items come from lessons taught in this course');
assert(AP.EXAM_PASS === 0.8 && AP.KNOWLEDGE_PASS === 0.7 && AP.ATTEMPTS_MAX === 3, 'app settings');
{
  const ORDER = { GUIDED: 0, ASSISTED: 1, INDEPENDENT: 2 };
  const bad = SECTIONS.filter((s) => { const l = AP.lessonsFor(s.id); return l.some((x, i) => i && ORDER[x.assist] < ORDER[l[i - 1].assist]); });
  assert(!bad.length && ['GUIDED', 'ASSISTED', 'INDEPENDENT'].every((a) => LESSONS.some((l) => l.assist === a)), 'GUIDED → ASSISTED → INDEPENDENT within each section');
}
// ---------------------------------------------------------------- answers, labels, physical kinds
{
  const k = LESSONS.filter((l) => AP.isKnowledge(l) && !AP.isBuild(l));
  const pos = new Set(k.map((l) => l.choices.findIndex((c) => c[0] === l.answer)));
  assert(pos.size >= 3 || (pos.size >= 2 && k.every((l) => l.choices.length <= 2)), 'correct answers are spread over choice positions');
  const multi = [...LESSONS, ...EXAM_ITEMS].filter((l) => AP.isKnowledge(l) && !AP.isBuild(l) && l.choices.length > 2);
  const longest = multi.filter((l) => { const c = l.choices.find((x) => x[0] === l.answer)[1].length; return l.choices.every((x) => x[0] === l.answer || x[1].length < c); });
  assert(longest.length <= multi.length / 2, `the right answer is not usually the longest choice (${longest.length} / ${multi.length})`);
  assert(LESSONS.filter((l) => l.type === 'PUZZLE').every((l) => l.label === 'PKF RECOMMENDED PATTERN') && LESSONS.filter((l) => ['DECIDE', 'TWOWAY', 'SAFETY'].includes(l.type)).every((l) => l.label === 'PKF APPROACH'), 'reveal labels: PKF RECOMMENDED PATTERN / PKF APPROACH / PKF SOLUTION');
  const phys = LESSONS.filter(AP.isPhysical);
  assert(phys.length >= 30 && phys.every((l) => AP.PHYS[l.physical.kind] && l.physical.steps.length && l.physical.objective), `${phys.length} table exercises, each with steps + objective`);
  assert(AP.PHYS.safety.results.map((r) => r[1]).join('|') === 'SAFETY SUCCESSFUL|PARTIAL SAFETY|SAFETY FAILED|SCRATCH', 'safety results are safety-specific (never just made/missed)');
  assert(AP.PHYS.shot.results.map((r) => r[1]).join('|') === 'SHOT MADE · POSITION ACHIEVED|SHOT MADE · POSITION LOST|SHOT MISSED', 'shot + position results');
  assert(phys.filter(AP.isSafetyPhysical).length >= 15, 'at least 15 safety table exercises');
  assert(!JSON.stringify(phys.map((l) => l.physical.setup)).match(/\b\d+(\.\d+)?\s*(in|inch|inches|cm)\b|x:\s*\d|coordinates?:/i), 'setups give no invented coordinates');
  assert(phys.every((l) => l.physical.gaps?.length), 'every table exercise lists what PKF does not specify');
}
// ---------------------------------------------------------------- containment
{
  assert(!AP.lessonsFor('jump').some(AP.isPhysical) && !AP.lessonsFor('changing-path').some(AP.isPhysical), 'Aiming Jump Shots + Changing the Path: knowledge only, no table steps');
  const copy = JSON.stringify(ALL);
  assert(!/diamond system|two rail diamond|KICKING SYSTEMS|kicking system(?! is taught)/i.test(copy.replace(/no kicking system/gi, '')), 'no diamond / kicking systems taught');
  assert(LESSONS.filter((l) => ['kick-kill', 'kick-safe'].includes(l.section)).every((l) => pageOf(l) >= 173 && pageOf(l) <= 177), 'Kick Kill / Kick Safe use only their own PKF pages');
  assert(!/SOURCE REVIEW|FLAG|TODO|storage key|Career XP|catalog|OCR|typo/i.test(copy), 'no internal notes or review flags in lesson copy');
  assert(!ALL.some((l) => l.src && pageOf(l) > 200), 'nothing past page 200 (Kicking Systems chapter)');
}
// ---------------------------------------------------------------- assets
{
  assert(PDF_FIRST === 159 && PDF_LAST === 224 && Object.keys(PAGES).length === 66, '66 original pages, PDF 159–224');
  assert(INSERTS[159] && INSERTS[160] && printedOf(161) === 137 && printedOf(224) === 200, 'divider + blank page; printed pages 137–200');
  const missing = Object.values(PAGES).filter((p) => !fs.existsSync(path.join(root, p.src.replace(/^\.\//, ''))));
  assert(!missing.length, 'every original JPEG exists');
  assert(Object.keys(FIG).length >= 300, `${Object.keys(FIG).length} figure crops`);
  assert(captionText(regionOf('f7-1')) === 'Figure 7-1 · PKF page 137 · tap to enlarge', 'caption shows the figure and printed page');
  const hide = ['adv-tw-easy', 'adv-nb-9push', 'adv-cp-25', 'adv-cp-20', 'adv-fl-9ball'];
  assert(hide.every((id) => AP.lessonById(id)?.hidePre), 'figures that print the answer are held back before LOCK');
  const insetQ = LESSONS.filter((l) => AP.isKnowledge(l) && !l.hidePre && ['f7-174', 'f7-176', 'f7-178', 'f7-211', 'f7-297', 'f7-301', 'fU201a'].includes(l.fig));
  assert(!insetQ.length, `tip-inset answer figures are only reveals ${insetQ.map((l) => l.id).join(',')}`);
  assert(LESSONS.filter((l) => l.type === 'PUZZLE').every((l) => /^f7-2(7[68]|8\d|9[024])$/.test(l.fig) && /^fU21[789][a-d]$/.test(l.reveal)), 'puzzles: layout first, PKF answer image after LOCK');
}
// ---------------------------------------------------------------- flow
const st0 = defaultState();
const screen = (args, s0 = st0, acts = []) => {
  let s = s0;
  const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
  const sc = createPkfAdvScreen(ctx, args);
  sc.render();
  for (const [a, v] of acts) sc.onAction(a, { dataset: v == null ? {} : { v: String(v) } });
  return { html: ctx.root.innerHTML, state: s, sc };
};
{
  const home = screen([]).html;
  assert(home.includes('data-pkfadv-home="1"') && home.includes('disabled data-pkfadv-section="backstroke"') && home.includes('data-pkfadv-exam-locked="1"') && home.includes('data-pkfadv-stats="1"'), 'home: stats, order locks, locked exam');
  assert(['Lessons Completed', 'Strategy Questions Answered', 'First-Answer Accuracy', 'Safeties Attempted', 'Safeties Successful', 'Two-Way Decisions', 'Pattern Puzzles Solved', 'Physical Attempts', 'First-Try Successes', 'Independent Decisions Correct', 'Table Steps Skipped', 'Exam Attempts', 'Best Exam Score'].every((t) => home.includes(t)), 'home stats list');
  assert(!home.includes('data-pkfadv-list='), 'review lists hidden while empty');
  const q = screen(['sliding-safeties']);
  assert(q.html.includes('data-type="RECOGNIZE"') && q.html.includes('data-action="pkfadv-lock" disabled') && !q.html.includes('VIEW FULL PKF PAGE') && !q.html.includes('data-pkfadv-sol') && !q.html.includes('data-pkfadv-verdict'), 'question: LOCK disabled, nothing revealed (no full page) before LOCK');
  assert(q.html.includes('images/pkf-advanced/PKF_Advanced_PDF_161.jpg') && q.html.includes('alt="Sliding Safeties: Look First"'), 'original PKF image, alt = lesson title');
  const L0 = AP.lessonById('adv-ss-first');
  const wrong = L0.choices.find((c) => c[0] !== L0.answer)[0];
  const locked = screen(['sliding-safeties'], q.state, [['pkfadv-choice', wrong], ['pkfadv-lock']]);
  assert(locked.html.includes('data-pkfadv-verdict="wrong"') && !locked.html.includes('data-pkfadv-sol') && locked.html.includes('VIEW FULL PKF PAGE'), 'LOCK → verdict; solution behind SHOW PKF …');
  const sol = screen(['sliding-safeties'], locked.state, [['pkfadv-solution']]);
  assert(sol.html.includes('data-pkfadv-sol="1"') && sol.html.includes('ORIGINAL PAGE') && sol.html.includes('PKF’s way; other options may exist.'), 'comparison: PKF explanation + original page + “other options may exist”');
  const c1 = AP.courseOf(sol.state);
  assert(c1.review['adv-ss-first'] && AP.listIds(c1, 'concepts').includes('adv-ss-first'), 'wrong concept → REVIEW MISSED CONCEPTS');
  const h2 = screen([], sol.state).html;
  assert(h2.includes('data-pkfadv-list="concepts"') && h2.includes('REVIEW MISSED CONCEPTS (1)'), 'home shows the non-empty review list');
  // hidePre figure
  const tw = AP.lessonById('adv-tw-easy');
  const at = (id) => {
    const l = AP.lessonById(id);
    const before = SECTIONS.slice(0, SECTIONS.findIndex((x) => x.id === l.section));
    let s = { ...st0, [AP.STORAGE_KEY]: { ...AP.blank(), sections: Object.fromEntries(before.map((x) => [x.id, { passed: true }])) } };
    s = AP.startSection(s, l.section);
    const cur = s[AP.STORAGE_KEY].current;
    cur.cursor = cur.view = cur.order.indexOf(id);
    return s;
  };
  const hp = screen([tw.section], at(tw.id));
  assert(hp.html.includes('data-pkfadv-hidden-fig="1"') && !hp.html.includes('data-pkfadv-fig="f7-64"'), 'answer-printing figure hidden before LOCK');
  const hp2 = screen([tw.section], hp.state, [['pkfadv-choice', tw.answer], ['pkfadv-lock']]);
  assert(hp2.html.includes('data-pkfadv-fig="f7-64"') && hp2.html.includes('data-pkfadv-verdict="right"') && AP.courseOf(hp2.state).lessons[tw.id].correct, 'figure opens after LOCK; correct recorded');
  // puzzle build
  const pz = AP.lessonById('adv-pz-1');
  const p0 = screen([pz.section], at(pz.id));
  assert(p0.html.includes('data-pkfadv-build=""') && p0.html.includes('LOCK PATTERN') && !p0.html.includes('fU217a'), 'puzzle: build slots, answer image hidden');
  const p1 = screen([pz.section], p0.state, pz.answer.split('-').map((b) => ['pkfadv-choice', b]).concat([['pkfadv-lock'], ['pkfadv-solution']]));
  assert(p1.html.includes('data-pkfadv-verdict="right"') && p1.html.includes('PKF RECOMMENDED PATTERN · ORIGINAL PAGE') && p1.html.includes('data-pkfadv-fig="fU217a"'), 'puzzle: LOCK PATTERN → PKF RECOMMENDED PATTERN (answer image)');
  // safety physical: setup → shoot → partial → success on 2
  const sp = AP.lessonById('adv-ss-phys-endrail');
  const s1 = screen([sp.section], at(sp.id));
  assert(s1.html.includes('data-pkfadv-setup="1"') && s1.html.includes('SET UP THIS SHOT') && s1.html.includes('NOW SHOOT IT') && s1.html.includes('SKIP TABLE STEP') && s1.html.includes('Not specified in PKF'), 'table step: SET UP THIS SHOT + NOW SHOOT IT + SKIP + gaps');
  const s2 = screen([sp.section], s1.state, [['pkfadv-shoot']]);
  assert(['SAFETY SUCCESSFUL', 'PARTIAL SAFETY', 'SAFETY FAILED', 'SCRATCH'].every((t) => s2.html.includes(t)) && s2.html.includes('data-pkfadv-dots="empty empty empty"') && !/kickDots[^>]*>[^<]*<i class="empty">[^<]+</.test(s2.html), 'safety result buttons + three empty dots');
  const s3 = screen([sp.section], s2.state, [['pkfadv-result', 'partial']]);
  assert(s3.html.includes('data-pkfadv-dots="miss empty empty"') && s3.html.includes('Attempt 1: <b>PARTIAL SAFETY</b>') && s3.html.includes('data-pkfadv-left="2"'), 'partial safety = miss dot, attempt 2 next');
  const s4 = screen([sp.section], s3.state, [['pkfadv-result', 'success']]);
  const c4 = AP.courseOf(s4.state);
  assert(s4.html.includes('data-pkfadv-exec="success"') && s4.html.includes('data-pkfadv-dots="miss make empty"') && c4.stats.safetyAttempts === 2 && c4.stats.safetySuccess === 1 && s4.state.prog?.drillXp > 0, 'success on attempt 2: Drill XP (ratio 1/2), safety stats');
  assert(s4.html.includes('Decision: NOT ANSWERED · Execution: SUCCESSFUL') || s4.html.includes('Execution: SUCCESSFUL'), 'Decision / Execution line');
  // fail all three → PRACTICE FAILED SAFETIES
  const f = screen([sp.section], at(sp.id), [['pkfadv-shoot'], ['pkfadv-result', 'failed'], ['pkfadv-result', 'scratch'], ['pkfadv-result', 'partial']]);
  const cf = AP.courseOf(f.state);
  assert(f.html.includes('data-pkfadv-exec="failed"') && AP.listIds(cf, 'safeties').includes(sp.id) && !f.state.prog?.drillXp, 'three failed attempts: 0 XP, PRACTICE FAILED SAFETIES');
  assert(screen([], f.state).html.includes('data-pkfadv-list="safeties"'), 'home shows PRACTICE FAILED SAFETIES');
  // skip
  const sk = screen([sp.section], at(sp.id), [['pkfadv-skip']]);
  const ck = AP.courseOf(sk.state);
  assert(ck.stats.tableSkipped === 1 && ck.lessons[sp.id].done && ck.lessons[sp.id].skipped && AP.skippedIds(ck).includes(sp.id) && !sk.state.prog?.drillXp, 'SKIP TABLE STEP: 0 XP, lesson done, on practice list');
  // shot kind → PRACTICE FAILED SHOTS
  const sh = AP.lessonById('adv-ec-phys');
  const shf = screen([sh.section], at(sh.id), [['pkfadv-shoot'], ['pkfadv-result', 'failed'], ['pkfadv-result', 'failed'], ['pkfadv-result', 'failed']]);
  assert(AP.listIds(AP.courseOf(shf.state), 'shots').includes(sh.id), 'failed shot → PRACTICE FAILED SHOTS');
}
// ---------------------------------------------------------------- section pass, exam, completion
{
  const passAll = { ...st0, [AP.STORAGE_KEY]: { ...AP.blank(), sections: Object.fromEntries(SECTIONS.map((s) => [s.id, { passed: true }])) } };
  assert(AP.examUnlocked(passAll) && !AP.examUnlocked(st0), 'exam unlocks after all sections');
  const ex = screen(['exam'], passAll);
  const cur = AP.courseOf(ex.state).current;
  assert(cur.mode === 'exam' && cur.order.length === 31, 'exam run starts');
  // answer every knowledge item right, skip physical except two successes
  let s = ex.state;
  const runner = (acts) => { const r = screen(['exam'], s, acts); s = r.state; return r; };
  let last;
  for (const id of cur.order) {
    const l = AP.lessonById(id);
    if (AP.isKnowledge(l)) last = runner([...(AP.isBuild(l) ? l.answer.split('-').map((b) => ['pkfadv-choice', b]) : [['pkfadv-choice', l.answer]]), ['pkfadv-lock'], ['pkfadv-next']]);
    else if (id === 'apx-ss-phys-rolling') last = runner([['pkfadv-shoot'], ['pkfadv-result', 'failed'], ['pkfadv-result', 'failed'], ['pkfadv-result', 'failed'], ['pkfadv-next']]);
    else last = runner([['pkfadv-skip'], ['pkfadv-next']]);
  }
  const sum = AP.courseOf(s).current.summary;
  assert(last.html.includes('PKF ADVANCED PLAY &amp; SAFETY EXAM') && ['Strategy Knowledge', 'Safety Play', 'Shot Decisions', 'Physical Execution', 'Pattern / Problem Solving', 'Overall Score', 'Strongest Area', 'Weakest Area', 'Recommended Review', 'Best Score', 'Attempt History'].every((t) => last.html.includes(t)), 'exam results screen lists every area');
  assert(sum.xTot === 1 && sum.skipped.length === 6 && sum.kOk === 24 && Math.abs(sum.overall - 24 / 25) < 1e-9 && sum.passed && last.html.includes('data-pkfadv-pass="pass"'), 'skipped exam table items excluded; PASS at 96%');
  assert(sum.weakest === 'execution' && AP.courseOf(s).exam.history.length === 1, 'weakest area = Physical Execution; history saved');
  const done = screen(['complete'], s);
  assert(done.html.includes('data-pkfadv-complete="1"') && done.html.includes('COURSE COMPLETE') && ['Knowledge Score', 'Execution Score', 'Exam Score', 'Strongest Skill', 'Skill to Review'].every((t) => done.html.includes(t)), 'completion screen');
  assert(screen(['complete'], st0).html.includes('data-pkfadv-complete="0"'), 'completion screen waits for every section');
  const rows = readSetProgress({ ...st0, [AP.STORAGE_KEY]: { ...AP.blank(), sections: Object.fromEntries(SECTIONS.map((x) => [x.id, { passed: true }])), exam: { ...AP.blank().exam, passed: true, attempts: 1 } } }).filter((r) => r.id.startsWith('pkfAdvanced'));
  assert(rows.length === 2 && rows.every((r) => r.finished) && rows[0].href === '#pkfadv', 'course + exam emblem rows (finished = all sections passed / exam passed)');
  const line = completedSetsLineHTML({ ...st0, [AP.STORAGE_KEY]: { ...AP.blank(), sections: Object.fromEntries(SECTIONS.map((x) => [x.id, { passed: true }])), exam: { ...AP.blank().exam, passed: true, attempts: 1 } } });
  assert(line.includes('data-set-emblem="pkfAdvanced"') && line.includes('data-set-emblem="pkfAdvancedExam"'), 'home emblems');
}
// ---------------------------------------------------------------- banners + no interference
{
  assert(!AP.pkfAdvancedPlaySafetyBannersHTML({}).includes('href="#pkfadv/exam"') && AP.pkfAdvancedPlaySafetyBannersHTML({}).includes('data-pkfadv-locked="1"') && AP.pkfAdvancedPlaySafetyBannersHTML({}, { dev: true }).includes('data-dev-open="1"'), 'exam banner lock / dev preview');
  const ppIds = new Set([...PP.LESSONS, ...PP.EXAM_ITEMS].map((l) => l.id));
  assert(!ALL.some((l) => ppIds.has(l.id)), 'no id shared with Pattern Play');
  assert(AP.sourceMapRows().every((r) => r && r.sourceImage.includes('pkf-advanced') && r.sourcePage >= 137 && r.sourcePage <= 200), 'source map rows for every lesson + exam item');
  assert(fs.existsSync(path.join(root, 'docs', 'PKF_ADVANCED_PLAY_SAFETY_SOURCE_MAP.md')), 'docs/PKF_ADVANCED_PLAY_SAFETY_SOURCE_MAP.md exists');
}

if (failed) { console.error(`\n${failed} pkfAdvancedPlaySafetyCourse TEST(S) FAILED`); process.exit(1); }
console.log('\nALL pkfAdvancedPlaySafetyCourse TESTS PASSED');
