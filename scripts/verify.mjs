/**
 * Pool IQ headless verification
 */
import { pathToFileURL } from 'url';
import path from 'path';
import { createRequire } from 'module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const js = (name) => pathToFileURL(path.join(root, 'js', name)).href;

// Minimal browser shims for modules that touch DOM/storage at import time
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};
globalThis.indexedDB = undefined;
globalThis.document = {
  readyState: 'complete',
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};
globalThis.window = globalThis;
globalThis.navigator = { serviceWorker: { register: async () => {} } };
globalThis.alert = () => {};
globalThis.confirm = () => false;

const fails = [];
function assert(cond, msg) {
  if (!cond) {
    fails.push(msg);
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

const storage = await import(js('storage.js'));
const drillsMod = await import(js('drills.js'));
const table = await import(js('tableDiagram.js'));
const training = await import(js('training.js'));
const career = await import(js('career.js'));
const ghost = await import(js('ghost.js'));
const skills = await import(js('skills.js'));

const { drills } = drillsMod;
assert(drills.length >= 40, `drills.length >= 40 (got ${drills.length})`);
assert(drills.length >= 60, `expanded curriculum >= 60 (got ${drills.length})`);

const byCat = {};
for (const d of drills) {
  byCat[d.category] = (byCat[d.category] || 0) + 1;
  assert(!!d.id && !!d.name && !!d.category, `drill ${d.id} has id/name/category`);
  assert(d.diagram && Array.isArray(d.diagram.balls) && d.diagram.balls.length > 0, `drill ${d.id} has diagram.balls`);
  assert(typeof d.passNeed === 'number' && typeof d.attempts === 'number', `drill ${d.id} attempts/passNeed`);
  const svg = table.renderTableDiagram(d.diagram, { compact: true });
  assert(typeof svg === 'string' && svg.includes('<svg') && svg.includes('</svg>'), `diagram SVG for ${d.id}`);
}

console.log('Category counts:', byCat);

// Ghost-ball aiming overlay
assert(typeof table.computeGhostBall === 'function', 'computeGhostBall exported');
{
  const ob = { x: 50, y: 25 };
  const pocket = { x: 97.5, y: 2.5 };
  const g = table.computeGhostBall(ob, pocket, 2.8);
  const dx = pocket.x - ob.x;
  const dy = pocket.y - ob.y;
  const len = Math.hypot(dx, dy);
  assert(Math.abs(g.x - (ob.x - (dx / len) * 5.6)) < 1e-9, 'ghost x = OB - n*(2R)');
  assert(Math.abs(g.y - (ob.y - (dy / len) * 5.6)) < 1e-9, 'ghost y = OB - n*(2R)');
}
const half = drills.find((d) => d.id === 'cut-2');
assert(half, 'Half-Ball Accuracy drill exists');
const halfSvg = table.renderTableDiagram(half.diagram, { compact: false });
assert(halfSvg.includes('GHOST') || halfSvg.includes('ghost-ball'), 'half-ball SVG includes GHOST overlay');
assert(halfSvg.includes('HALF-BALL') || halfSvg.includes('HALF'), 'half-ball SVG includes HALF-BALL label');
assert(halfSvg.includes('ghost-aim') || halfSvg.includes('#ffc75b'), 'half-ball SVG has aim line color');

const straight = drills.find((d) => d.id === 'sm-straight-1');
assert(straight, 'straight drill exists');
const straightSvg = table.renderTableDiagram(straight.diagram, { compact: false });
assert(!straightSvg.includes('HALF-BALL'), 'straight-in SVG does not show HALF-BALL');
assert(!straightSvg.includes('class="ghost-ball"'), 'straight-in SVG hides ghost circle');

const thin = drills.find((d) => d.id === 'sm-thin-cut-intro' || d.id === 'cut-thin-iii');
if (thin) {
  const thinSvg = table.renderTableDiagram(thin.diagram, { compact: false });
  assert(thinSvg.includes('GHOST') || thinSvg.includes('ghost-ball'), 'thin-cut SVG includes ghost');
  assert(thinSvg.includes('THIN'), 'thin-cut SVG labeled THIN');
}


// Scoring pure functions
assert(storage.scoreBinaryAttempt(true) === 1, 'binary success = 1');
assert(storage.scoreBinaryAttempt(false) === 0, 'binary miss = 0');
assert(storage.scorePositionAttempt('zone') === 1, 'position zone = 1');
assert(storage.scorePositionAttempt('pocketed') === 0.5, 'position pocketed = 0.5');
assert(storage.scorePositionAttempt('miss') === 0, 'position miss = 0');

let state = storage.defaultState();
const drill = drills.find((d) => d.scoringType === 'binary') || drills[0];
const valuesPass = Array(drill.attempts).fill(1);
const { state: passedState, passed, firstPass } = storage.applyDrillSession(state, drill, valuesPass);
assert(passed === true, 'applyDrillSession can pass');
assert(firstPass === true, 'first pass flagged');
assert(passedState.results[drill.id]?.passed === true, 'result stored as passed');

const failDrill = drills.find((d) => d.id !== drill.id && d.scoringType === 'binary') || drills[1];
const valuesFail = Array(failDrill.attempts).fill(0);
const { state: failState, passed: failed } = storage.applyDrillSession(passedState, failDrill, valuesFail);
assert(failed === false, 'applyDrillSession can fail');
assert(failState.results[failDrill.id]?.passed !== true, 'failed drill not marked passed');

// Ghost undo
ghost.startGhost({ balls: 3, race: 3 });
ghost.ghostRack('W');
ghost.ghostRack('L');
let sess = ghost.getGhostSession();
assert(sess.you === 1 && sess.ghost === 1 && sess.log.length === 2, 'ghost racks recorded');
ghost.undoLastRack();
sess = ghost.getGhostSession();
assert(sess.you === 1 && sess.ghost === 0 && sess.log.length === 1, 'ghost undo last rack');

// Career lock: Rookie cannot jump to Champion
state = storage.defaultState();
state = career.syncRank(state);
assert(state.rankIndex === 0, 'fresh state is Rookie');
const champReqs = career.requirementChecklist(9, state);
assert(champReqs.every((r) => !r.met), 'champion requirements unmet at start');
assert(career.computeEarnedRankIndex(state) === 0, 'cannot skip to high rank');

// Unlock Club Player by passing its drills
for (const req of career.RANK_REQUIREMENTS[1].requirements) {
  if (req.type === 'drill') {
    const d = drillsMod.getDrillById(req.drillId);
    const vals = Array(d.attempts).fill(1);
    state = storage.applyDrillSession(state, d, vals).state;
  }
}
state = career.syncRank(state);
assert(state.rankIndex >= 1, `rank advances after Club Player reqs (rank=${state.rankIndex})`);
assert(career.computeEarnedRankIndex(state) < 9, 'still locked below Champion');

// Skills
const weak = skills.weakestSkills(state, 3);
assert(Array.isArray(weak) && weak.length > 0, 'weakestSkills returns list');

console.log('\n--- Summary ---');
console.log('Drill total:', drills.length);
console.log('Fails:', fails.length);
if (fails.length) {
  console.error(fails);
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
