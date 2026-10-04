/**
 * RDS progressive score. Not part of verify.mjs, so that file's pass count stays put.
 * node scripts/rds-score-test.mjs
 */
import { pathToFileURL } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
globalThis.document = { readyState: 'complete', addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; } };
globalThis.window = globalThis;

const mod = await import(pathToFileURL(path.join(root, 'js/content/buMore.js')).href);
const { rdsOutcome, rdsProgress, withMoreScore, moreExamPageHTML, moreApply, newMoreRun, undoMore, moreSheetHTML } = mod;

let failed = 0;
function check(cond, msg) {
  if (!cond) { failed += 1; console.error('FAIL:', msg); }
  else console.log('PASS:', msg);
}

const up = rdsOutcome(2, 4);
check(up.move === 'up' && up.next === 5 && up.passed && up.line === '2 out of 3. You go to the next higher level.', '2 out of 3 goes to the next higher level');
const three = rdsOutcome(3, 4);
check(three.move === 'up' && three.next === 5 && three.passed, '3 out of 3 also goes up');
const stay = rdsOutcome(1, 4);
check(stay.move === 'stay' && stay.next === 4 && !stay.passed && stay.line === '1 out of 3. You stay at the current level.', '1 of 3 stays');
const down = rdsOutcome(0, 4);
check(down.move === 'down' && down.next === 3 && down.line === '0 out of 3. You go down to the next lower level.', '0 of 3 goes down');
check(rdsOutcome(0, 1).next === 1 && rdsOutcome(2, 16).next === 16, 'no level below 1 or above 16');

let run = newMoreRun('bu-rds1');
run = moreApply('bu-rds1', run, { ok: true });
run = moreApply('bu-rds1', run, { ok: true });
check(!run.done && run.runs === 2, 'a set is not scored until the third rack');
run = undoMore('bu-rds1', run);
check(!run.done && run.racks.length === 1 && run.runs === 1, 'undo drops the last rack');
run = moreApply('bu-rds1', run, { ok: false });
run = moreApply('bu-rds1', run, { ok: true });
check(run.done && run.runs === 2 && run.move === 'up', 'two runs and one miss is a pass');

let state = {};
const blocked = withMoreScore(state, 'bu-rds2', 3, 3, { racks: [true, true, true] });
check(blocked === state || !blocked.buExam4, 'a locked level does not record');
state = withMoreScore(state, 'bu-rds1', 2, 3, { racks: [true, false, true] });
check(state.buExam4.current === 2 && rdsProgress(state.buExam4).unlocked === 2, 'passing level 1 opens level 2');
state = withMoreScore(state, 'bu-rds2', 0, 3, { racks: [false, false, false] });
const prog = rdsProgress(state.buExam4);
check(prog.current === 1 && prog.unlocked === 2 && prog.passed.has(1), '0 of 3 drops the ending level and does not re-lock a passed level');
const page = moreExamPageHTML(state, 'rds');
check(page.includes('Runout Drill System (RDS)') && page.includes('data-rds-locked="3"') && !page.includes('data-rds-locked="1"') && page.includes('Ending level 1 — lower novice'), 'set page names RDS, locks level 3, and shows the ending level');
const sheet = moreSheetHTML(state, 'rds');
check(sheet.includes('2 out of 3') && sheet.includes('0 out of 3') && sheet.includes('next higher') && sheet.includes('next lower'), 'the score sheet fills from the racks');

if (failed) {
  console.error(failed + ' failed');
  process.exit(1);
}
console.log('rds score test passed');
