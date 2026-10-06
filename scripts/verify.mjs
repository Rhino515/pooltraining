/**
 * Pool IQ headless verification (Node 18+, no dependencies).
 *   node scripts/verify.mjs
 * Checks: drill library (built-in Three-Lane Speed Exercise + saved drills), stage/boss geometry, why-text uniqueness, engine scoring,
 * unlock rules, Ghost undo, career requirements, boss pass/fail, skill ratings and storage migration.
 */
import { pathToFileURL } from 'url';
import path from 'path';

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
globalThis.document = { readyState: 'complete', addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; } };
globalThis.window = globalThis;
if (!globalThis.navigator) globalThis.navigator = { serviceWorker: { register: async () => {} } };
globalThis.alert = () => {};
globalThis.confirm = () => false;

const fails = [];
let passes = 0;
const quiet = process.argv.includes('--quiet');
function assert(cond, msg) {
  if (!cond) { fails.push(msg); console.error('FAIL:', msg); }
  else { passes++; if (!quiet) console.log('PASS:', msg); }
}
/** For large loops: one PASS line, every failure listed */
function assertAll(label, problems) {
  if (problems.length) for (const p of problems) { fails.push(`${label}: ${p}`); console.error(`FAIL: ${label}: ${p}`); }
  else { passes++; console.log('PASS:', label); }
}

const storage = await import(js('storage.js'));
const drillsMod = await import(js('drills.js'));
const table = await import(js('tableDiagram.js'));
const career = await import(js('career.js'));
const ghost = await import(js('ghost.js'));
const skills = await import(js('skills.js'));
const reg = await import(js('games/registry.js'));
const engine = await import(js('games/engine.js'));
const G = await import(js('games/geometry.js'));
const speed = await import(js('games/speed.js'));
const coaching = await import(js('games/coaching.js'));
const cbd = await import(js('games/cueBallDiagram.js'));
const stageTable = await import(js('games/stageTable.js'));
const recipe = await import(js('games/recipe.js'));
const text = await import(js('games/text.js'));
const aimV = await import(js('games/aimView.js'));
const dia = await import(js('games/diamonds.js'));

// ---------------------------------------------------------------- drill library (may be empty)
const { drills } = drillsMod;
assert(Array.isArray(drills), `drill library loads (count = ${drills.length}; 0 is valid)`);
{
  const problems = [];
  for (const d of drills) {
    if (!d.id || !d.name || !d.category) problems.push(`${d.id} missing id/name/category`);
    if (!Array.isArray(d.ballPositions) || !d.cueBallPosition) problems.push(`${d.id} missing ballPositions/cueBallPosition`);
    if (!d.whyExplanation || !d.cueContact || typeof d.speed !== 'number') problems.push(`${d.id} missing why/contact/speed`);
  }
  assertAll('every drill follows the challenge data model', problems);
}
assert(drillsMod.getDrillById('sm-straight-1') === null && drillsMod.getDrillById('cut-2') === null, 'deleted drill ids resolve to null (no crash)');
{
  // The documented template builds a complete challenge (not shipped as content — built in memory only)
  const t = drillsMod.normalizeDrill({ id: 'tmpl-test', name: 'Template', category: 'Stop Shots', difficulty: 2, kind: 'position', ob: [1, 60, 25], pocket: 'TR', cut: [0, 1, 24], k: 0, travel: 0, scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } }, skillEffects: { 'Cue-Ball Control': 1 } });
  assert(t.ballPositions.length && t.cueBallPosition && t.cueContact && typeof t.speed === 'number' && t.whyExplanation?.whySpeed && t.targetZones.length, 'README drill template builds a full challenge (diagram, recipe, why)');
  const svg = stageTable.renderStageTable(t, {});
  assert(svg.includes('obj-ball') && svg.includes('cue-ball'), 'template drill renders on the table diagram');
  assert(recipe.recipeCardHTML(t).includes('SPEED'), 'template drill renders a Shot Recipe with a SPEED chip');
  assert(!drills.some((d) => d.id === 'tmpl-test'), 'template is not added to the shipped library');
  const full = drillsMod.normalizeDrill({
    id: 'tmpl-full', name: 'Full', category: 'Shot Making', difficulty: 1,
    ballPositions: [{ n: 1, x: 60, y: 25 }], cueBallPosition: { x: 36, y: 25 }, targetBall: 1, targetPocket: 'TR',
    targetZones: [{ type: 'rings', x: 60, y: 25, rings: [{ r: 6, stars: 1 }, { r: 4, stars: 2 }, { r: 2, stars: 3 }] }],
    cueBallPath: [{ x: 36, y: 25 }, { x: 54.4, y: 25 }], contactIndex: 1, objectBallPath: [{ x: 60, y: 25 }, { x: 97.5, y: 2.5 }], railContacts: [],
    cueContact: { vTips: 0, hTips: 0 }, english: { hTips: 0, type: 'none' }, speed: 1.5,
    aim: { fraction: 1, label: 'Full hit', short: 'FULL', cutDeg: 0 }, route: { rails: 0, text: 'Direct (no rail)', short: 'DIRECT' },
    instructions: 'i', goal: 'g', whyExplanation: { whyContact: 'a', whySpeed: 'b', whySpin: 'c', whyRoute: 'd', whyAim: 'e' },
    scoringRules: { mode: 'binary', attempts: 10, pass: { made: 7 } }, attemptCount: 10, passingRequirement: { made: 7 }, skillEffects: { 'Shot Making': 1 }, xp: 100
  });
  assert(stageTable.renderStageTable(full, {}).includes('cue-ball') && recipe.recipeCardHTML(full).includes('SPEED 1.5'), 'README full-object drill template renders (table + recipe)');
  let fs = engine.newSession('drills', 'tmpl-full');
  for (let i = 0; i < 10; i++) fs = engine.recordAttempt(fs, { result: 'made' });
  assert(engine.evaluateSession(fs, full).passed, 'full-object drill template scores with the engine');
}

// ---------------------------------------------------------------- legacy ghost-ball overlay helper
{
  const ob = { x: 50, y: 25 };
  const pocket = { x: 97.5, y: 2.5 };
  const g = table.computeGhostBall(ob, pocket, 2.8);
  const dx = pocket.x - ob.x, dy = pocket.y - ob.y, l = Math.hypot(dx, dy);
  assert(Math.abs(g.x - (ob.x - (dx / l) * 5.6)) < 1e-9 && Math.abs(g.y - (ob.y - (dy / l) * 5.6)) < 1e-9, 'computeGhostBall = OB − n·2R');
}

// ---------------------------------------------------------------- games + stages
const EXPECTED = { ghost: 7, landing: 10, draw: 9, follow: 8, stun: 9, speed: 9, bank: 8, kick: 9, train: 8, carom: 7, safety: 6, pattern: 5, sniper: 8, rail: 6 };
assert(reg.GAMES.length === 14, `14 arcade games (got ${reg.GAMES.length})`);
for (const [id, n] of Object.entries(EXPECTED)) assert(reg.stageSpecs(id).length === n, `${id} has ${n} stages (got ${reg.stageSpecs(id).length})`);
assert(reg.getGame('bank').endless, 'Bank Vault has an endless mode');
assert(reg.BOSSES.length === 9, `9 boss battles (got ${reg.BOSSES.length})`);

const { geometryProblems, inJaws, inside, nearPocket, POCK } = await import(pathToFileURL(path.join(root, 'scripts', 'geometryCheck.mjs')).href);

assertAll(`geometry of ${drills.length} drills`, drills.flatMap((d) => geometryProblems(d, `drill ${d.id}`)));
const stageProblems = [];
const whyProblems = [];
const whySeen = new Map();
const fieldDupes = [];
const fieldSeen = new Map();
let stageCount = 0;
let geoCount = 0;
const whyText = (w) => (w ? Object.values(w).filter((v) => typeof v === 'string').join(' ') : '');
for (const g of reg.GAMES) {
  if (g.special === 'ghost') continue;
  for (const st of reg.getStages(g.id)) {
    stageCount++;
    const label = `${g.id}/${st.id}`;
    stageProblems.push(...geometryProblems(st, label));
    if (st.kind === 'train') {
      // Each step: OB path ends at its pocket, rails on cushions, path inside
      st.steps.forEach((s, i) => {
        const l = `${label} step ${i + 1}`;
        const ob = s.objectBallPath || [];
        if (ob.length > 1 && G.dist(ob[ob.length - 1], POCK[s.pocket]) > 1.5) stageProblems.push(`${l}: OB path misses pocket ${s.pocket}`);
        for (const q of [...(s.cueBallPath || []), ...ob.slice(0, -1)]) if (!inside(q)) stageProblems.push(`${l}: path point outside table (${q.x},${q.y})`);
        for (const rc of s.railContacts || []) if (inJaws(rc)) stageProblems.push(`${l}: rail contact in pocket mouth`);
      });
    }
    geoCount++;
    if (st.kind === 'calibration' || st.kind === 'ladder') { /* no single layout: each rung/shot is built on the fly with its own why */ }
    else if (st.whyExplanation) {
      const t = whyText(st.whyExplanation);
      if (!t.trim()) whyProblems.push(`${label} has empty why text`);
      if (whySeen.has(t)) whyProblems.push(`${label} repeats the why text of ${whySeen.get(t)}`);
      whySeen.set(t, label);
      for (const k of ['whyRoute', 'whyAim']) {
        const v = st.whyExplanation[k];
        if (!v) continue;
        const key = k + '|' + v;
        if (fieldSeen.has(key)) fieldDupes.push(`${label} ${k} = ${fieldSeen.get(key)}`);
        else fieldSeen.set(key, label);
      }
    } else whyProblems.push(`${label} has no whyExplanation`);
    // recipe basics
    if (st.cueContact && typeof st.speed === 'number') {
      if (!(st.speed >= 0.5 && st.speed <= 5)) stageProblems.push(`${label}: speed ${st.speed} outside 0.5–5`);
      if (Math.abs(st.cueContact.vTips) > 1.5 || Math.abs(st.cueContact.hTips) > 1) stageProblems.push(`${label}: cue contact outside the miscue limit`);
    }
  }
}
assertAll(`geometry of ${stageCount} stages (paths in table, rails on cushions, reflections, pockets, zones, overlaps, clear lines, blockers)`, stageProblems);
const bossProblems = [];
let bossShots = 0;
for (const b of reg.getBosses()) {
  assert(b.shots.length >= 4, `${b.name}: ${b.shots.length} shots`);
  for (const s of b.shots) { bossShots++; bossProblems.push(...geometryProblems(s.challenge, `${b.id}/${s.title}`)); }
}
assertAll(`geometry of ${bossShots} boss shots`, bossProblems);
assertAll(`why text is unique for all ${stageCount} stages`, whyProblems);
assert(fieldDupes.length <= Math.ceil(stageCount * 0.1), `route/aim explanations mostly stage-specific (${fieldDupes.length} identical fields across ${stageCount} stages)`);

// ---------------------------------------------------------------- teaching components
{
  const lz = reg.getStage('landing', 'lz-1');
  const svg = stageTable.renderStageTable(lz, {});
  for (const cls of ['obj-ball', 'cue-ball', 'zone-ring', 'cue-path', 'ob-path']) assert(svg.includes(cls), `stage table SVG has .${cls}`);
  const bank = reg.getStage('bank', 'bv-1');
  assert(stageTable.renderStageTable(bank, {}).includes('rail-mark'), 'bank table SVG marks rail contacts');
  const c = cbd.cueBallSVG({ vTips: -1, hTips: 0.5 }, { size: 'lg' });
  const m = c.match(/class="cb-dot"[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"/) || c.match(/cx="([\d.]+)" cy="([\d.]+)"[^>]*class="cb-dot"/);
  assert(m && Math.abs(+m[1] - (50 + 0.5 * cbd.TIP_UNIT)) < 0.2 && Math.abs(+m[2] - (50 + 1 * cbd.TIP_UNIT)) < 0.2, 'contact dot sits 1 tip low, ½ tip right');
  assert(speed.speedLabel(2) === 'SPEED 2.00' && speed.speedLabel(1.25) === 'SPEED 1.25', 'speed label format (two decimals, like the ICA indicator)');
  assert(speed.formatSpeed(2.5) === '2.50' && speed.formatSpeed(0.75) === '0.75', 'formatSpeed (two decimals)');
  let cal = speed.defaultCalibration();
  for (let i = 0; i < 3; i++) cal = speed.recordCalibration(cal, 2, 1.7);
  assert(speed.personalFactor(cal, 2) > 1 && /short/.test(speed.calibrationAdvice(cal, 2)), 'calibration: coming up short raises the personal factor and advice says "short"');
  const w1 = whyText(reg.getStage('draw', 'dr-1')?.whyExplanation || reg.getStages('draw')[0].whyExplanation);
  const w2 = whyText(reg.getStages('draw')[4].whyExplanation);
  assert(w1 !== w2, 'why text differs between two draw stages');
  assert(coaching.levelFromRating(10) === 'beginner' && coaching.levelFromRating(90) === 'expert', 'coaching level from rating');
  const vis = coaching.visibility('advanced', lz, false);
  assert(vis && vis.planner && !vis.recipe, 'advanced coaching hides the recipe until the plan is locked');
  const visR = coaching.visibility('advanced', lz, true);
  assert(visR.recipe, 'advanced coaching reveals the recipe after lock');
  const FMT = { technique: text.techniqueName, contact: text.contactText, english: (h) => text.englishText(h), speed: (v) => speed.speedLabel(v) };
  const cmp = coaching.comparePlan({ technique: coaching.techniqueGroup(lz.technique), vTips: lz.cueContact.vTips, hTips: lz.cueContact.hTips, speed: lz.speed, rails: lz.route?.rails || 0 }, lz, FMT);
  assert(cmp && cmp.rows && cmp.rows.every((r) => r.verdict === 'match'), 'plan identical to the recipe compares as all-match');
}

// ---------------------------------------------------------------- diamond grid
{
  const svg = stageTable.renderStageTable(reg.getStage('landing', 'lz-1'), {});
  const gx = [...svg.matchAll(/class="grid-x" data-x="([\d.]+)" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
  const gy = [...svg.matchAll(/class="grid-y" data-y="([\d.]+)" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)].map((m) => m.slice(1).map(Number));
  assert(gx.length === 7 && gy.length === 3, `diamond grid: 7 long-axis + 3 short-axis lines (got ${gx.length} + ${gy.length})`);
  assert(gx.every(([x, x1, , x2]) => x1 === x && x2 === x) && gy.every(([y, , y1, , y2]) => y1 === y && y2 === y), 'grid lines are straight (vertical / horizontal)');
  const sights = [...svg.matchAll(/class="diamond-sight" cx="(-?[\d.]+)" cy="(-?[\d.]+)"/g)].map((m) => [+m[1], +m[2]]);
  assert(sights.length === 18, `18 diamond sights on the rails (got ${sights.length})`);
  const onRail = (x, y) => sights.some(([a, b]) => Math.abs(a - x) < 1e-9 && Math.abs(b - y) < 1e-9);
  const xProblems = gx.map(([x]) => x).filter((x) => (x === 50 ? !(table.POCKETS.TM.x === 50 && table.POCKETS.BM.x === 50) : !(onRail(x, -table.SIGHT_OFFSET) && onRail(x, 50 + table.SIGHT_OFFSET))));
  assert(xProblems.length === 0, `every long-axis line runs from a top-rail sight to the matching bottom-rail sight (centre line through the side pockets)${xProblems.length ? ' — bad: ' + xProblems : ''}`);
  const yProblems = gy.map(([y]) => y).filter((y) => !(onRail(-table.SIGHT_OFFSET, y) && onRail(100 + table.SIGHT_OFFSET, y)));
  assert(yProblems.length === 0, 'every short-axis line runs from a head-rail sight to the matching foot-rail sight');
  assert(gx.every(([x], i) => Math.abs(x - (i + 1) * G.DIAMOND) < 1e-9) && gy.every(([y], i) => Math.abs(y - (i + 1) * G.DIAMOND) < 1e-9), 'grid spacing = one diamond (12.5 units) = geometry.DIAMOND');
  assert(JSON.stringify(dia.GRID_X) === JSON.stringify(gx.map((g) => g[0])) && JSON.stringify(dia.GRID_Y) === JSON.stringify(gy.map((g) => g[0])), 'readout grid (diamonds.js) matches the drawn grid');
  const iGrid = svg.indexOf('class="diamond-grid"');
  const firstOver = Math.min(...['zone-ring', 'cue-path', 'ob-path', 'class="ball '].map((k) => svg.indexOf(k)).filter((i) => i >= 0));
  assert(iGrid > 0 && iGrid < firstOver, 'grid is drawn under zones, paths and balls');
  assert(/class="diamond-grid"[^>]*stroke-dasharray="[\d.]+ [\d.]+"[^>]*opacity="0\.[0-3]\d*"/.test(svg), 'grid is dashed and faint (opacity < 0.4)');
  assert(svg.includes('HEAD') && /x1="25" y1="0" x2="25" y2="50" stroke="#55e5ff"/.test(svg), 'head string mark kept on top of the grid');
  const probs = [];
  for (const g of reg.GAMES) { if (g.special === 'ghost') continue; for (const st of reg.getStages(g.id)) if (st.kind !== 'ladder' && st.kind !== 'calibration' && (stageTable.renderStageTable(st, {}).match(/class="grid-[xy]"/g) || []).length !== 10) probs.push(st.id); }
  for (const b of reg.getBosses()) for (const sh of b.shots) if ((stageTable.renderStageTable(sh.challenge, {}).match(/class="grid-[xy]"/g) || []).length !== 10) probs.push(`${b.id}/${sh.title}`);
  const tmpl = drillsMod.normalizeDrill({ id: 'tmpl-grid', name: 'T', category: 'Stop Shots', difficulty: 2, kind: 'position', ob: [1, 60, 25], pocket: 'TR', cut: [30, 1, 24], k: 0, travel: 0, scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } }, skillEffects: { 'Cue-Ball Control': 1 } });
  if ((stageTable.renderStageTable(tmpl, { className: 'table-diagram mini' }).match(/class="grid-[xy]"/g) || []).length !== 10) probs.push('drill template');
  assertAll('every stage, boss shot and the drill template renders the 10-line diamond grid', probs);
}

// ---------------------------------------------------------------- true-scale balls
{
  const R = table.BALL_RADIUS;
  assert(R === 1.125 && G.R === R && aimV.BALL_R === R, `true-scale ball radius ${R} (2.25" ball on a 100×50 = 100"×50" nose-to-nose playing surface) shared by renderer, geometry and aim view`);
  assert(Math.abs((2 * R) / 100 - 0.0225) < 1e-12 && Math.abs((2 * R) / 50 - 0.045) < 1e-12, 'ball diameter = 2.25% of playing length / 4.5% of width');
  assert(G.CUSHION.minX === R && G.CUSHION.maxX === 100 - R && G.CUSHION.minY === R && G.CUSHION.maxY === 50 - R, 'cushion (ball-centre) lines sit one true radius inside the noses');
  const analyze = await import(js('analyze.js'));
  const probs = [];
  const checkSVG = (svg, label) => {
    if (!svg.includes(`data-ball-r="${R}"`)) probs.push(`${label}: data-ball-r`);
    if (!svg.includes(`viewBox="${table.VIEWBOX}"`)) probs.push(`${label}: viewBox`);
    const bodies = [...svg.matchAll(/class="ball-body" cx="[-\d.]+" cy="[-\d.]+" r="([\d.]+)"/g)].map((m) => +m[1]);
    const groups = (svg.match(/<g class="ball /g) || []).length;
    const hits = [...svg.matchAll(/class="ball-hit" cx="[-\d.]+" cy="[-\d.]+" r="([\d.]+)"/g)].map((m) => +m[1]);
    if (!bodies.length) probs.push(`${label}: no balls`);
    if (bodies.some((r) => r !== R)) probs.push(`${label}: ball radius ${[...new Set(bodies)]} ≠ ${R}`);
    if (bodies.length !== groups || hits.length !== groups || hits.some((r) => r < 2.5 * R)) probs.push(`${label}: every ball needs one body + a larger invisible hit area`);
    const ghosts = [...svg.matchAll(/class="ghost-(?:ball|spot)" cx="[-\d.]+" cy="[-\d.]+" r="([\d.]+)"/g)].map((m) => +m[1]);
    if (ghosts.some((r) => r !== R)) probs.push(`${label}: ghost ball radius ${ghosts}`);
    const pks = [...svg.matchAll(/class="pocket" data-pocket="\w+" cx="[-\d.]+" cy="[-\d.]+" r="([\d.]+)"/g)];
    if (pks.length !== 6) probs.push(`${label}: ${pks.length} pockets`);
    for (const m of pks) if (+m[1] < 1.8 * R || +m[1] > 2.4 * R) probs.push(`${label}: pocket r ${m[1]} not to scale`);
  };
  for (const g of reg.GAMES) { if (g.special === 'ghost') continue; for (const st of reg.getStages(g.id)) if (st.kind !== 'ladder' && st.kind !== 'calibration') checkSVG(stageTable.renderStageTable(st, {}), st.id); }
  for (const b of reg.getBosses()) for (const sh of b.shots) checkSVG(stageTable.renderStageTable(sh.challenge, {}), `${b.id}/${sh.title}`);
  const tmpl = drillsMod.normalizeDrill({ id: 'tmpl-ball', name: 'T', category: 'Stop Shots', difficulty: 2, kind: 'position', ob: [1, 60, 25], pocket: 'TR', cut: [30, 1, 24], k: 0, travel: 0, scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } }, skillEffects: { 'Cue-Ball Control': 1 } });
  checkSVG(stageTable.renderStageTable(tmpl, { className: 'table-diagram mini' }), 'drill template');
  checkSVG(analyze.renderAnalyzePage(), 'Analyze demo');
  checkSVG(table.renderTableDiagram({ balls: [{ id: 'cue', x: 20, y: 25 }, { id: 3, x: 60, y: 20 }, { id: 12, x: 70, y: 40, blocker: true }], targetPocket: 'TR', showGhost: true }), 'raw renderer (stripe + blocker)');
  assertAll('every stage, boss shot, drill template and the Analyze demo draw balls at true scale (r = 1.125) with a larger hit area; ghost balls same size; pockets ≈ 2× ball radius', probs);
  const pk = Object.values(table.POCKETS);
  assert(pk.every((p) => p.r >= 2 * R && p.r <= 2.2 * R), 'pocket holes drawn to scale (mouth ≈ 2 ball diameters)');
}

// ---------------------------------------------------------------- diamond readout
{
  const td = (x, y) => dia.toDiamonds({ x, y });
  const eq = (a, h, t) => a.fromHead === h && a.fromTop === t;
  assert(eq(td(0, 0), 0, 0) && eq(td(100, 0), 8, 0) && eq(td(0, 50), 0, 4) && eq(td(100, 50), 8, 4), 'readout: table corners = 0·0, 8·0, 0·4, 8·4');
  assert(eq(td(50, 25), 4, 2) && eq(td(25, 25), 2, 2) && eq(td(75, 25), 6, 2), 'readout: center spot 4·2, head spot 2·2, foot spot 6·2');
  assert(eq(td(31.25, 9.375), 2.5, 0.75) && eq(td(1.5, 48.5), 0, 4) && eq(td(1.6, 3.2), 0.25, 0.25) && eq(td(-5, 60), 0, 4), 'readout: rounds to the nearest ¼ diamond and clamps to the table');
  assert(eq(td(table.POCKETS.TL.x, table.POCKETS.TL.y), 0, 0) && eq(td(table.POCKETS.BM.x, table.POCKETS.BM.y), 4, 4) && eq(td(table.POCKETS.TR.x, table.POCKETS.TR.y), 8, 0), 'readout: pocket centres (TL 0·0, TR 8·0, bottom side 4·4 — pockets sit at the cushion noses)');
  // true-scale balls: a ball frozen to a cushion has its centre one radius off the nose and must read as on that rail (within ¼)
  const Rb = table.BALL_RADIUS;
  const fz = [[Rb, 25, 0, 2], [100 - Rb, 25, 8, 2], [50, Rb, 4, 0], [50, 50 - Rb, 4, 4], [Rb, Rb, 0, 0], [100 - Rb, 50 - Rb, 8, 4]];
  assert(fz.every(([x, y, h, t]) => eq(td(x, y), h, t) && Math.abs(x / 12.5 - h) <= 0.25 && Math.abs(y / 12.5 - t) <= 0.25), `readout: balls frozen to a rail (centre ${Rb} off the nose) read 0 / 8 and 0 / 4 within ¼ diamond`);
  assert(eq(td(G.CUSHION.minX, G.CUSHION.minY), 0, 0) && eq(td(G.CUSHION.maxX, G.CUSHION.maxY), 8, 4), 'readout: geometry cushion lines (ball-centre limits) read as the rails');
  assert(dia.fmtDiamond(2.75) === '2¾' && dia.fmtDiamond(0.5) === '½' && dia.fmtDiamond(0) === '0' && dia.fmtDiamond(4) === '4' && dia.fmtDiamond(3.25) === '3¼' && dia.fmtDiamond(1.1) === '1', 'readout formatting (2¾, ½, 0, 4, 3¼)');
  assert(dia.shortPos(dia.toDiamonds({ x: 50, y: 25 })) === '4 · 2' && /4 diamonds from the head rail, 2 from the top rail/.test(dia.wordsPos(dia.toDiamonds({ x: 50, y: 25 }))), 'readout text: "4 · 2" and plain words');
  assert(/head rail/.test(dia.CONVENTION_TEXT) && /top rail/.test(dia.CONVENTION_TEXT) && /¼/.test(dia.CONVENTION_TEXT), 'convention explained in plain words');
  const probs = [];
  const checkSetup = (ch, label) => {
    const sb = dia.setupBalls(ch);
    const want = (ch.cueBallPosition ? 1 : 0) + (ch.ballPositions || []).length;
    if (sb.length < want) probs.push(`${label}: ${sb.length}/${want} balls`);
    if (ch.cueBallPosition && sb[0]?.id !== 'cue') probs.push(`${label}: cue not first`);
    for (const b of sb) if (Math.abs(b.fromHead - b.x / 12.5) > 0.125 + 1e-9 || Math.abs(b.fromTop - b.y / 12.5) > 0.125 + 1e-9) probs.push(`${label}: ball ${b.id} readout off`);
    const html = recipe.setupLineHTML(ch);
    if (sb.length && (html.match(/class="su-ball"/g) || []).length !== sb.length) probs.push(`${label}: setup line shows ${(html.match(/class="su-ball"/g) || []).length}/${sb.length}`);
  };
  for (const g of reg.GAMES) { if (g.special === 'ghost') continue; for (const st of reg.getStages(g.id)) if (st.ballPositions || st.cueBallPosition) checkSetup(st, st.id); }
  for (const b of reg.getBosses()) for (const sh of b.shots) checkSetup(sh.challenge, `${b.id}/${sh.title}`);
  assertAll('setup readout derived from ball coordinates for every stage and boss shot (±⅛ diamond, all balls, cue first)', probs);
}

// ---------------------------------------------------------------- aim view
{
  const R = G.R;
  const shot = (thetaDeg, sign) => {
    // OB at (60,25) going +x; approach direction rotated by sign·θ (y-down coords)
    const ob = { x: 60, y: 25 };
    const ghost = { x: 60 - 2 * R, y: 25 };
    const t = (sign * thetaDeg * Math.PI) / 180;
    const from = { x: ghost.x - Math.cos(t) * 30, y: ghost.y - Math.sin(t) * 30 };
    return aimV.aimFromPoints(from, ghost, ob, R);
  };
  const s0 = shot(0, 1);
  assert(s0.theta < 1e-6 && Math.abs(s0.fullness - 1) < 1e-9 && s0.offset < 1e-9 && aimV.fullnessWord(s0.fullness) === 'Full' && s0.side === 'center', 'aim: straight-in = Full, zero offset');
  const s30 = shot(30, 1);
  assert(Math.abs(s30.theta - 30) < 1e-6 && Math.abs(s30.fullness - 0.5) < 1e-9 && Math.abs(s30.offset - R) < 1e-9 && aimV.fullnessWord(s30.fullness) === '½', 'aim: 30° cut = ½ ball, offset = sin30° × diameter = one radius');
  const q = (Math.asin(0.75) * 180) / Math.PI;
  const s48 = shot(q, 1);
  assert(Math.abs(q - 48.59) < 0.01 && Math.abs(s48.fullness - 0.25) < 1e-9 && aimV.fullnessWord(s48.fullness) === '¼' && Math.abs(s48.offset - 1.5 * R) < 1e-9, 'aim: 48.6° cut = ¼ ball (offset ¾ diameter)');
  assert(aimV.fullnessWord(1 - Math.sin((14.5 * Math.PI) / 180)) === '¾' && aimV.fullnessWord(1 - Math.sin((70 * Math.PI) / 180)) === 'Thin', 'aim: 14.5° = ¾, 70° = Thin');
  // approach heading down-right (y-down) while the OB leaves straight right → OB goes to the viewer's LEFT → hit the RIGHT side
  assert(s30.side === 'right' && shot(30, -1).side === 'left', 'aim: side correct (OB goes left of the aim line ⇒ hit its right side, and the mirror case)');
  assert(Math.abs(Math.abs(s30.lateral) - s30.offset) < 1e-9, 'aim: seen offset equals the ghost–OB sideways distance');
  // every real shot: aim view agrees with the dashed object-ball path, the recipe cut angle and the cut side
  const probs = [];
  let n = 0;
  let hidden = 0;
  const checkShot = (ch, label) => {
    const info = aimV.aimViewInfo(ch);
    const hasOB = !!(ch.ghost || ch.steps?.[0]?.ghost);
    if (!info) { if (hasOB && ch.kind !== 'train') probs.push(`${label}: no aim view despite a ghost spot`); else hidden++; return; }
    n++;
    const obp = ch.ghost ? ch.objectBallPath : ch.steps?.[0]?.objectBallPath;
    if (obp?.length >= 2 && G.dist(obp[0], info.ob) < 0.3) {
      const o = G.norm(G.sub(obp[1], obp[0]));
      const ang = G.angleBetween(o, info.n);
      if (ang > 2) probs.push(`${label}: aim-view OB direction differs from the dashed OB path by ${ang.toFixed(1)}°`);
      if (info.theta >= 1) {
        const cross = info.d.x * o.y - info.d.y * o.x; // >0: OB leaves to the viewer's right
        const expect = cross > 0 ? 'left' : 'right';
        if (info.side !== expect) probs.push(`${label}: side ${info.side}, OB path says ${expect}`);
      }
    }
    const aim = ch.ghost ? ch.aim : ch.steps?.[0]?.aim;
    if (!info.afterRail && aim && aim.fraction != null && typeof aim.cutDeg === 'number' && Math.abs(aim.cutDeg - info.theta) > 2.5) /* ghost/ball coords are rounded to 0.1 units: vs a true-size 2.25-unit ball that alone moves the cut up to ~2° */ probs.push(`${label}: cut ${info.theta.toFixed(1)}° vs recipe ${aim.cutDeg}°`);
    if (Math.abs(info.offset - Math.sin((info.theta * Math.PI) / 180) * 2 * R) > 1e-9 || Math.abs(info.fullness - (1 - Math.sin((info.theta * Math.PI) / 180))) > 1e-9) probs.push(`${label}: offset/fullness formula`);
  };
  for (const g of reg.GAMES) {
    if (g.special === 'ghost') continue;
    for (const st of reg.getStages(g.id)) {
      checkShot(st, st.id);
      if (st.steps) st.steps.forEach((sp, i) => checkShot({ ...st, ...sp, id: `${st.id}-s${i + 1}`, kind: 'position', steps: undefined, targetBall: sp.ball }, `${st.id} step ${i + 1}`));
    }
  }
  for (const b of reg.getBosses()) for (const sh of b.shots) checkShot(sh.challenge, `${b.id}/${sh.title}`);
  assertAll(`aim view matches the OB path direction, recipe cut angle and cut side on ${n} shots (${hidden} without an object-ball aim hidden)`, probs);
  const lag = reg.getStages('speed').find((s) => s.kind === 'lag') || reg.getBosses().flatMap((b) => b.shots).find((s) => s.challenge.kind === 'lag')?.challenge;
  assert(lag && aimV.aimViewInfo(lag) === null && (recipe.recipeGaugesHTML(lag).match(/class="gauge /g) || []).length === 2, 'no object ball (lag) → aim view hidden, 2 gauges');
  const lz = reg.getStage('landing', 'lz-1');
  const gh = recipe.recipeGaugesHTML(lz);
  assert((gh.match(/class="gauge /g) || []).length === 3 && /class="aim-view[^"]*"[^>]*data-cut="30" data-side="right"/.test(gh) && gh.includes('Right ½') && gh.includes('cb-dot') && gh.includes(`Speed ${speed.formatSpeed(lz.speed)}`), 'gauge card: Aim View (Right ½, 30°) · tip · speed dial');
  const hid = recipe.recipeGaugesHTML(lz, { hideAim: true });
  assert(!/data-cut=/.test(hid) && hid.includes('Your aim'), 'coaching hides the aim value (no numbers leak)');
  assert(recipe.speedAngle(0.5) === -135 && recipe.speedAngle(5) === 135 && Math.abs(recipe.speedAngle(2.75)) < 1e-9, 'speed dial needle maps SPEED 0.5–5.0 onto −135°…+135°');
  assert(recipe.tipLabel(0, 0) === 'Center' && recipe.tipLabel(1, 0) === 'Top 1 tip' && recipe.tipLabel(-1.5, 0) === 'Draw 1½ tips' && recipe.tipLabel(-0.5, -1) === 'Low Left' && recipe.tipLabel(0, 0.5) === 'Right ½ tip', 'tip labels (Center, Top 1 tip, Draw 1½ tips, Low Left)');
  const m = recipe.tipGaugeSVG({ vTips: -1, hTips: 0.5 }).match(/class="cb-dot"[^>]*cx="([\d.]+)"\s+cy="([\d.]+)"/);
  assert(m && Math.abs(+m[1] - (50 + 0.5 * cbd.TIP_UNIT)) < 0.01 && Math.abs(+m[2] - (50 + cbd.TIP_UNIT)) < 0.01, 'tip gauge dot sits at the recipe tips (1 low, ½ right)');
  assert(recipe.recipeCardHTML(lz).includes('aimRow') && !recipe.recipeCardHTML(lz, { hideAim: true }).includes('aimRow'), 'recipe sheet shows the Aim View unless coaching hides aim');
}

// ---------------------------------------------------------------- engine: sessions, unlocks, lives, multiplier
let state = storage.defaultState();
{
  const stage = reg.getStage('landing', 'lz-1');
  let s = engine.newSession('landing', 'lz-1');
  for (let i = 0; i < stage.attemptCount; i++) s = engine.recordAttempt(s, { pocketed: false, stars: 0 });
  assert(s.attempts.every((a) => a.resultSource === 'manual'), 'attempts carry resultSource = manual');
  const ev = engine.evaluateSession(s);
  assert(ev.over && !ev.passed, 'all-miss landing session fails');
  const r1 = engine.finishSession(state, s);
  state = r1.state;
  assert(!engine.isStageUnlocked(state, 'landing', 'lz-2'), 'failed session does NOT unlock the next stage');
  assert(state.games.landing.stages['lz-1'].tries === 1 && state.games.landing.stages['lz-1'].history.length === 1, 'failed attempt saved to history');
  let p = engine.newSession('landing', 'lz-1');
  for (let i = 0; i < stage.attemptCount; i++) p = engine.recordAttempt(p, { pocketed: true, stars: 3 });
  const r2 = engine.finishSession(state, p);
  state = r2.state;
  assert(r2.result.passed && r2.result.firstPass && r2.result.unlockedNext, 'passing session unlocks the next stage');
  assert(engine.isStageUnlocked(state, 'landing', 'lz-2'), 'lz-2 unlocked after pass');
  assert(state.games.landing.pb.highScore === r2.result.score && r2.result.newPB, 'personal best recorded');
  assert(engine.gameLevel(state, 'landing') === 1, 'landing level = 1');
  const u = engine.undoAttempt(engine.recordAttempt(engine.newSession('landing', 'lz-1'), { pocketed: true, stars: 1 }));
  assert(u.attempts.length === 0, 'undo removes the last attempt');
}
{
  let s = engine.newSession('bank', 'bv-1');
  s = engine.recordAttempt(s, { result: 'miss' });
  let ev = engine.evaluateSession(s);
  assert(ev.lives === ev.livesTotal - 1, 'bank miss costs a life');
  s = engine.recordAttempt(engine.recordAttempt(s, { result: 'miss' }), { result: 'miss' });
  ev = engine.evaluateSession(s);
  assert(ev.lives === 0 && ev.over && !ev.passed, 'bank: out of lives = game over, failed');
  let e = engine.newSession('bank', 'endless', { endless: true });
  const draws = Array.from({ length: 20 }, (_, i) => engine.endlessChallenge(e, i));
  assert(draws.every(Boolean) && new Set(draws.map((d) => d.id)).size >= 4, 'bank endless rotates through the bank layouts');
  assert(draws.slice(14).reduce((a, d) => a + d.difficulty, 0) / 6 > draws.slice(0, 4).reduce((a, d) => a + d.difficulty, 0) / 4, 'bank endless difficulty rises');
  assert(engine.endlessChallenge(e, 7).id === engine.endlessChallenge(e, 7).id, 'bank endless draw is deterministic per session (reload-safe)');
}
{
  let s = engine.newSession('train', 'pt-1');
  s = engine.recordAttempt(s, { result: 'zone' });
  s = engine.recordAttempt(s, { result: 'zone' });
  let ev = engine.evaluateSession(s);
  assert(ev.multiplier === 3, `train multiplier rises with zones (×${ev.multiplier})`);
  s = engine.recordAttempt(s, { result: 'pocket' });
  ev = engine.evaluateSession(s);
  assert(ev.multiplier === 1 || ev.runs.length === 1, 'train multiplier resets on a zone miss');
}
{
  let s = engine.newSession('sniper', 'ps-1');
  s = engine.recordAttempt(s, { result: 'made' });
  s = engine.recordAttempt(s, { result: 'made' });
  s = engine.recordAttempt(s, { result: 'made' });
  const ev = engine.evaluateSession(s);
  assert(ev.streak === 3 && ev.multiplier === 2, 'sniper streak multiplier');
}
{
  let s = engine.newSession('kick', 'ke-1');
  s = engine.recordAttempt(s, { result: 'hit' });
  const ev = engine.evaluateSession(s);
  assert(ev.score === 100 * ev.rails, 'kick scoring = 100 per rail');
}
{
  const st = reg.getStage('speed', 'sp-cal');
  let s = engine.newSession('speed', 'sp-cal');
  for (const sp of st.speeds) s = engine.recordAttempt(s, engine.calibrationOutcome(sp, 1, 7));
  const r = engine.finishSession(storage.defaultState(), s);
  assert(r.result.passed && Object.keys(r.state.speedCal.records || r.state.speedCal).length > 0, 'calibration session stores personal speed data');
}

// ---------------------------------------------------------------- ghost
{
  let st = storage.defaultState();
  let sess = ghost.newGhostSession(3, 3);
  ({ state: st, session: sess } = ghost.applyRack(st, sess, 'W'));
  ({ state: st, session: sess } = ghost.applyRack(st, sess, 'L'));
  assert(sess.you === 1 && sess.ghost === 1, 'ghost racks increment');
  ({ state: st, session: sess } = ghost.applyRack(st, sess, 'W'));
  const r = ghost.applyRack(st, sess, 'W');
  st = r.state; sess = r.session;
  assert(r.ended && st.ghostMatches.length === 1 && st.ghostMatches[0].won, 'ghost match ends at the race target and saves');
  assert(engine.ghostLevel(st) === 1, 'beating the 3-ball ghost = ghost level 1');
  ({ state: st, session: sess } = ghost.applyUndo(st, sess));
  assert(st.ghostMatches.length === 0 && sess.you === 2 && !ghost.matchOver(sess), 'undo after match end reopens the match and removes it from history');
}

// ---------------------------------------------------------------- career
{
  let st = career.syncRank(storage.defaultState());
  assert(st.rankIndex === 0, 'fresh state is Rookie');
  assert(career.computeEarnedRankIndex(st) === 0, 'cannot skip ranks');
  const allReqs = career.RANK_REQUIREMENTS.flatMap((r) => r.requirements);
  assert(allReqs.every((r) => ['gameLevel', 'ghost', 'boss', 'stars', 'pb', 'ballPocket'].includes(r.type)), 'career requirements are game levels / Ghost / bosses / stars / PBs / Ball Pocketing levels only');
  assert(!JSON.stringify(career.RANK_REQUIREMENTS).match(/bp-l|pkf-|three-lane/), 'career references no drill ids');
  const pass = (s, gid, n) => {
    const specs = reg.stageSpecs(gid);
    const games = { ...(s.games || {}) };
    const g = { stages: { ...(games[gid]?.stages || {}) }, pb: {}, sessions: [] };
    for (let i = 0; i < n; i++) g.stages[specs[i].id] = { passed: true, bestStars: 2, tries: 1, lastDate: new Date().toISOString() };
    games[gid] = g;
    return { ...s, games };
  };
  const before = career.requirementChecklist(1, st).filter((c) => c.met).length;
  st = pass(pass(pass(st, 'landing', 2), 'sniper', 2), 'speed', 2);
  st = { ...st, ghostMatches: [{ id: 'm1', balls: 3, race: 3, you: 3, ghost: 1, won: true, log: [], date: new Date().toISOString() }] };
  const after = career.requirementChecklist(1, st);
  assert(after.filter((c) => c.met).length === before + 4, 'career checklist ticks from injected game/ghost results');
  assert(career.syncRank(st).rankIndex === 0, 'requirements alone do not promote (boss required)');
  const boss1 = reg.bossForRank(1);
  // v11: the boss is the rank's PROMOTION TEST — it also needs Rank XP full + the Skill Gate cleared
  assert(!career.isBossUnlocked(st, boss1), 'v11: Promotion Test stays locked without Rank XP / Skill Gate');
  st = { ...st, prog: { ...(st.prog || {}), v: 1, rankXpBy: { 0: 3000 }, gatesCleared: { 'g-rookie': 1 }, items: {}, tierXp: {}, stats: {}, events: [] } };
  assert(career.isBossUnlocked(st, boss1), 'boss unlocks when every other requirement is met (incl. v11 Rank XP + gate)');
  // boss: fail
  const b = reg.getBoss(boss1.id);
  let bs = engine.newSession(null, null, { bossId: b.id });
  for (const shot of b.shots) for (let i = 0; i < shot.attempts; i++) bs = engine.recordAttempt(bs, shot.mode === 'zone' ? { pocketed: false, stars: 0 } : { result: 'miss' });
  let ev = engine.evaluateBoss(bs);
  assert(ev.over && !ev.passed && ev.weakSkills.length > 0, `failed boss reports weak skills (${ev.weakSkills.join(', ')})`);
  let fin = engine.finishBoss(st, bs);
  assert(career.syncRank(fin.state).rankIndex === 0, 'failed boss does not promote');
  // boss: pass
  bs = engine.newSession(null, null, { bossId: b.id });
  for (const shot of b.shots) for (let i = 0; i < shot.attempts; i++) bs = engine.recordAttempt(bs, shot.mode === 'zone' ? { pocketed: true, stars: 3 } : { result: 'made' });
  ev = engine.evaluateBoss(bs);
  assert(ev.over && ev.passed && ev.weakSkills.length === 0, 'perfect boss run passes');
  fin = engine.finishBoss(fin.state, bs);
  const promoted = career.syncRank(fin.state);
  assert(promoted.rankIndex === 1, 'beating the boss promotes to Club Player');
  assert(career.computeEarnedRankIndex(promoted) < 9, 'still far from Champion');
  assert(career.nextUp(promoted) && career.nextUp(promoted).href, 'next-up points to a concrete action');
  state = promoted;
}

// ---------------------------------------------------------------- skills
{
  const empty = skills.computeSkillRatings(storage.defaultState());
  assert(Object.values(empty).every((v) => v === 0), 'fresh skill ratings are 0 (with zero drills)');
  const after = skills.computeSkillRatings(state);
  assert(Object.values(after).some((v) => v > 0), 'skill ratings rise after recorded results');
  const weak = skills.weakestSkills(skills.withSkills(state), 3);
  assert(Array.isArray(weak) && weak.length === 3, 'weakestSkills returns 3');
  const recs = skills.recommendations(skills.withSkills(state), 3);
  assert(Array.isArray(recs) && recs.length > 0 && recs.every((r) => r.name) && recs.some((r) => r.rec?.href?.startsWith('#')), 'recommendations name the weak skill and link to a game stage');
}

// ---------------------------------------------------------------- storage migration
{
  store.clear();
  const v3 = {
    version: 3, xp: 1234, rankIndex: 4, unlockedGhostBalls: 6,
    results: { 'sm-straight-1': { passed: true, best: 9, tries: 3 }, 'stop-1': { passed: true }, 'cut-2': { passed: false } },
    ghostMatches: [{ id: 'old', balls: 5, race: 5, you: 5, ghost: 2, won: true, log: [], date: '2026-01-01T00:00:00Z' }],
    skills: { 'Shot Making': 50 }, settings: { units: 'imperial' }
  };
  localStorage.setItem(storage.V3_KEY, JSON.stringify(v3));
  let st = storage.loadState();
  assert(st.version === 4 && st.xp === 1234, 'V3 → V4 migration keeps XP');
  assert(st.rankFloor === 4, 'V3 rank preserved as rankFloor');
  assert(st.ghostUnlockFloor === 6, 'V3 ghost unlocks preserved');
  st = storage.archiveUnknownDrills(st, drills.map((d) => d.id));
  assert(Object.keys(st.results).length === 0 && st.drillArchive['sm-straight-1']?.passed, 'old drill results archived harmlessly');
  st = career.syncRank(skills.withSkills(st));
  assert(st.rankIndex === 4, 'migrated player keeps rank 4 with zero drills');
  assert(localStorage.getItem(storage.V3_KEY), 'V3 data left intact as a backup');
  storage.saveState(st);
  const again = storage.loadState();
  assert(again.rankFloor === 4 && again.version === 4, 'V4 round-trip');
  // drill session referencing a deleted id must not crash
  let ok = true;
  try { engine.stageFor({ gameId: 'drills', stageId: 'stop-1' }); } catch { ok = false; }
  assert(ok, 'stageFor() on a deleted drill id does not throw');
}

// ---------------------------------------------------------------- Shot Simulator: physics
{
  const P = await import(js('sim/physics.js'));
  const L = await import(js('sim/layouts.js'));
  const SH = await import(js('sim/share.js'));
  const LIB = await import(js('sim/library.js'));
  const SO = await import(js('sim/solver.js'));
  const R = P.R;
  assert(R === 1.125 && table.BALL_RADIUS === 1.125, 'simulator uses the shared true-scale ball radius (1.125" on 100×50)');
  // SPEED calibration: Speed N ≈ N table lengths of centre-ball travel, and the precomputed table matches the physics
  const lagErr = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 7].map((s) => [s, P.lagLengths(P.speedToV0(s))]).filter(([s, l]) => Math.abs(l - s) > 0.03);
  assertAll('SPEED calibration: Speed N sends a centre-ball cue ball N table lengths (0.5…7, ±0.03; table not stale)', lagErr.map(([s, l]) => `Speed ${s} → ${l.toFixed(3)} lengths`));
  assert(Math.abs(P.lagLengths(P.speedToV0(1)) - 1) < 0.01, `Speed 1 ≈ 1 table length (${P.lagLengths(P.speedToV0(1)).toFixed(3)})`);
  assert(Math.abs(P.v0ToSpeed(P.speedToV0(3.3)) - 3.3) < 1e-6, 'speedToV0 / v0ToSpeed are inverses');
  // straight-in stop shot (stun): a touch of draw at SPEED 3 over 16" leaves the cue ball on the contact spot
  {
    const d = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
    const ob = { x: 100 - 12 * d.x, y: 50 - 12 * d.y };
    const cue = { x: ob.x - 16 * d.x, y: ob.y - 16 * d.y };
    const lay = [{ id: 'cue', ...cue }, { id: 1, ...ob }];
    const contact = { x: ob.x - 2 * R * d.x, y: ob.y - 2 * R * d.y };
    const along = (r) => { const c = r.final.find((b) => b.id === 'cue'); return (c.x - contact.x) * d.x + (c.y - contact.y) * d.y; };
    const stun = P.simulate(lay, { aim: P.aimAt(cue, ob), speed: 3, vTips: -0.25 }, { record: false });
    const cf = stun.final.find((b) => b.id === 'cue');
    assert(Math.hypot(cf.x - contact.x, cf.y - contact.y) < 1 && stun.pocketed.some((p) => p.id === 1 && p.pocket === 'BR'), `straight-in stun: object ball pocketed, cue ball stops ${Math.hypot(cf.x - contact.x, cf.y - contact.y).toFixed(2)}" from the contact spot`);
    const fol = along(P.simulate(lay, { aim: P.aimAt(cue, ob), speed: 3, vTips: 0.5 }, { record: false }));
    const drw = along(P.simulate(lay, { aim: P.aimAt(cue, ob), speed: 3, vTips: -0.75 }, { record: false }));
    assert(fol > 3 && drw < -3, `follow goes forward (${fol.toFixed(1)}"), draw comes back (${drw.toFixed(1)}")`);
    // pure sliding impact (no spin at contact): the cue ball transfers almost all its speed
    const c2 = { x: ob.x - 2 * R * d.x - 0.01 * d.x, y: ob.y - 2 * R * d.y - 0.01 * d.y };
    const hit = P.simulate([{ id: 'cue', ...c2 }, { id: 1, ...ob }], null, { record: false, initial: { cue: { vx: 100 * d.x, vy: 100 * d.y, wx: 0, wy: 0, wz: 0 } } });
    const hc = hit.final.find((b) => b.id === 'cue');
    assert(Math.hypot(hc.x - c2.x, hc.y - c2.y) < 0.6, `sliding head-on hit with no spin stops the cue ball dead (${Math.hypot(hc.x - c2.x, hc.y - c2.y).toFixed(2)}")`);
  }
  // 30° half-ball hit with natural roll: cue ball deflects ≈ 30° (theory 33.7°)
  {
    const cue = { x: 12, y: 25 }, ob = { x: 50, y: 25 };
    const ghost = { x: ob.x - 2 * R * Math.cos(Math.PI / 6), y: ob.y + 2 * R * Math.sin(Math.PI / 6) };
    const r = P.simulate([{ id: 'cue', ...cue }, { id: 1, ...ob }], { aim: P.aimAt(cue, ghost), speed: 2 }, { record: true });
    const ci = r.ids.indexOf('cue');
    const fr = r.frames.find((f) => f.t > r.firstHit.t + 0.7) || r.frames[r.frames.length - 1];
    const p = fr.p[ci];
    const din = Math.atan2(ghost.y - cue.y, ghost.x - cue.x);
    const dout = Math.atan2(p[1] - r.firstHit.cueAt.y, p[0] - r.firstHit.cueAt.x);
    const defl = (Math.abs(dout - din) * 180) / Math.PI;
    const oi = r.ids.indexOf(1);
    const obDir = (Math.atan2(fr.p[oi][1] - ob.y, fr.p[oi][0] - ob.x) * 180) / Math.PI;
    assert(defl > 27 && defl < 40, `half-ball natural roll: cue ball deflection ${defl.toFixed(1)}° after it rolls (≈30°)`);
    assert(Math.abs(Math.abs(obDir) - 30) < 3, `half-ball: object ball leaves on the 30° cut line (${obDir.toFixed(1)}°, incl. throw)`);
  }
  // draw reverses; follow keeps going
  {
    const lay = [{ id: 'cue', x: 30, y: 25 }, { id: 1, x: 60, y: 25 }];
    const dr = P.simulate(lay, { aim: 0, speed: 2.5, vTips: -1.25 }, { record: false });
    assert(dr.final[0].x < dr.firstHit.cueAt.x - 10, `draw reverses the cue ball (contact x ${dr.firstHit.cueAt.x.toFixed(1)} → stops x ${dr.final[0].x.toFixed(1)})`);
  }
  // rail rebound roughly mirrors at medium speed with no spin
  {
    const out = [];
    for (const inc of [20, 30, 45]) {
      const r = P.simulate([{ id: 'cue', x: 30, y: 25 }], { aim: -(90 - inc), speed: 2 }, { record: true });
      const ev = r.events.find((e) => e.type === 'cushion');
      const fr = r.frames.find((f) => f.t > ev.t + 0.25);
      const ang = (Math.atan2(Math.abs(fr.p[0][0] - ev.x), Math.abs(fr.p[0][1] - ev.y)) * 180) / Math.PI;
      out.push([inc, ang, ev.rail]);
    }
    assert(out.every(([i, a, rail]) => rail === 'bottom' && Math.abs(a - i) < 6), `rail rebound ≈ mirror angle (${out.map(([i, a]) => `${i}°→${a.toFixed(1)}°`).join(', ')})`);
    const e1 = P.simulate([{ id: 'cue', x: 30, y: 25 }], { aim: -60, speed: 2, hTips: 1 }, { record: true });
    const e2 = P.simulate([{ id: 'cue', x: 30, y: 25 }], { aim: -60, speed: 2, hTips: -1 }, { record: true });
    const dirAfter = (r) => { const ev = r.events.find((e) => e.type === 'cushion'); const f = r.frames.find((q) => q.t > ev.t + 0.25); return Math.atan2(Math.abs(f.p[0][0] - ev.x), Math.abs(f.p[0][1] - ev.y)); };
    assert(Math.abs(dirAfter(e1) - dirAfter(e2)) > 0.1, `side spin changes the rebound angle (${((dirAfter(e1) * 180) / Math.PI).toFixed(1)}° vs ${((dirAfter(e2) * 180) / Math.PI).toFixed(1)}°)`);
    const slow = P.simulate([{ id: 'cue', x: 30, y: 25 }], { aim: -90, speed: 0.6 }, { record: false });
    const fast = P.simulate([{ id: 'cue', x: 30, y: 25 }], { aim: -90, speed: 4 }, { record: false });
    const ev = (r) => r.events.find((e) => e.type === 'cushion');
    assert(P.cushionE(300) < P.cushionE(20) && ev(fast).v > ev(slow).v, 'cushion restitution drops with impact speed');
    assert(!!ev(slow) && !!ev(fast), 'cushion events recorded');
  }
  // energy never increases, no tunnelling at max speed, balls stay on the table
  {
    const lay = [{ id: 'cue', x: 10, y: 25 }, { id: 1, x: 40, y: 25.5 }, { id: 2, x: 42.3, y: 24.2 }, { id: 3, x: 60, y: 10 }, { id: 4, x: 70, y: 40 }, { id: 5, x: 88, y: 25 }];
    let minD = 99;
    const probs = [];
    for (let k = 0; k < 14; k++) {
      const r = P.simulate(lay, { aim: -9 + k * 1.4, speed: P.SPEED_MAX, vTips: k % 3 - 1, hTips: (k % 5) / 2 - 1 }, { record: true, frameDt: 1 / 240 });
      for (let i = 1; i < r.energy.length; i++) if (r.energy[i] > r.energy[i - 1] * (1 + 1e-9) + 1e-9) { probs.push(`energy rose at shot ${k}`); break; }
      for (const f of r.frames) {
        for (let i = 0; i < f.p.length; i++) {
          const a = f.p[i];
          if (!a) continue;
          if (a[0] < -3 || a[0] > 103 || a[1] < -3 || a[1] > 53) probs.push(`ball left the table at shot ${k}`);
          for (let j = i + 1; j < f.p.length; j++) if (f.p[j]) minD = Math.min(minD, Math.hypot(a[0] - f.p[j][0], a[1] - f.p[j][1]));
        }
      }
    }
    assertAll('max-speed shots: energy never increases, no ball leaves the table', [...new Set(probs)]);
    assert(minD > 2 * R - 0.05, `no tunnelling / overlap at SPEED ${P.SPEED_MAX} (closest centres ${minD.toFixed(3)}", ball diameter ${2 * R}")`);
  }
  // pocketing + rattles + determinism
  {
    const r = P.simulate([{ id: 'cue', x: 50, y: 25 }], { aim: P.aimAt({ x: 50, y: 25 }, { x: 100, y: 50 }), speed: 2 }, { record: false });
    assert(r.scratch && r.pocketed[0]?.pocket === 'BR', 'a ball rolled at a corner drops (scratch detected)');
    const s = P.simulate([{ id: 'cue', x: 50, y: 40 }], { aim: -90, speed: 1 }, { record: false });
    assert(s.pocketed[0]?.pocket === 'BM', 'straight into the side pocket drops');
    const jaw = P.simulate([{ id: 'cue', x: 20, y: 25 }], { aim: P.aimAt({ x: 20, y: 25 }, { x: 100, y: 46.2 }), speed: 3 }, { record: false });
    assert(jaw.events.some((e) => e.type === 'jaw' || e.type === 'cushion') , `a ball hitting the pocket facing reacts to the jaw geometry (${jaw.pocketed.length ? 'dropped after jaw contact' : 'rattled out'})`);
    const a = JSON.stringify(P.simulate(L.rackLayout(9, 3), { aim: 0, speed: 6 }, { record: false }).final);
    const b = JSON.stringify(P.simulate(L.rackLayout(9, 3), { aim: 0, speed: 6 }, { record: false }).final);
    assert(a === b, 'simulation is deterministic (same break twice → identical result)');
    const brk = P.simulate(L.rackLayout(9, 3), { aim: 0, speed: 6 }, { record: false });
    assert(brk.firstHit && brk.firstHit.ob === 1 && brk.events.filter((e) => e.type === 'ball').length > 10, `9-ball break spreads the rack (${brk.events.filter((e) => e.type === 'ball').length} ball contacts)`);
    const d = P.describeResult(brk);
    assert(Array.isArray(d.pots) && typeof d.rails === 'number', 'describeResult summarises the shot');
  }
  // throw-compensated aim pockets the ball; Find a Shot finds a make
  {
    const lay = [{ id: 'cue', x: 30, y: 30 }, { id: 1, x: 70, y: 18 }];
    const probs = [];
    for (const [v, h] of [[0, 0], [0.5, 0], [-0.5, 1], [0, -1]]) {
      const a = SO.aimToPocket(lay, 1, 'TR', { speed: 2.5, vTips: v, hTips: h });
      const r = P.simulate(lay, { aim: a.aim, speed: 2.5, vTips: v, hTips: h }, { record: false });
      if (!r.pocketed.some((p) => p.id === 1 && p.pocket === 'TR')) probs.push(`tip ${v}/${h} missed`);
    }
    assertAll('aimToPocket (throw + squirt compensated) pockets the ball with any tip', probs);
    const f = await SO.findShot(lay, { x: 50, y: 25 }, { mode: 'fast' });
    assert(f.best && f.best.miss < 12 && f.tried > 50, `Find a Shot returns a pot that lands near the target (${f.best?.miss.toFixed(1)}" off, ${f.tried} shots simulated)`);
    const rd = SO.targetRound(42);
    assert(rd && rd.balls.length === 2 && rd.target && SO.targetStars(rd.target, rd.target) === 3, 'Target Game round generated with a reachable target');
  }
  // racks + random layouts are legal and non-overlapping
  {
    const probs = [];
    for (const g of [8, 9, 10]) {
      const want = { 8: 15, 9: 9, 10: 10 }[g];
      for (let seed = 1; seed <= 40; seed++) {
        for (const [kind, lay] of [['rack', L.rackLayout(g, seed)], ['random', L.randomLayout(g, seed)]]) {
          const v = L.validateLayout(lay);
          if (v.errors?.length || (Array.isArray(v) && v.length)) probs.push(`${g}-ball ${kind} seed ${seed}: ${(v.errors || v).join('; ')}`);
          const obs = lay.filter((b) => b.id !== 'cue');
          if (obs.length !== want || new Set(obs.map((b) => b.id)).size !== want) probs.push(`${g}-ball ${kind} seed ${seed}: ${obs.length} balls`);
          for (let i = 0; i < lay.length; i++) for (let j = i + 1; j < lay.length; j++) if (Math.hypot(lay[i].x - lay[j].x, lay[i].y - lay[j].y) < 2 * R - 1e-6) probs.push(`${g}-ball ${kind} seed ${seed}: overlap`);
          if (lay.some((b) => b.x < R || b.x > 100 - R || b.y < R || b.y > 50 - R)) probs.push(`${g}-ball ${kind} seed ${seed}: off table`);
        }
      }
      const rk = L.rackLayout(g, 7);
      const apex = rk.filter((b) => b.id !== 'cue').reduce((a, b) => (b.x < a.x ? b : a));
      if (Math.abs(apex.x - 75) > 0.01 || Math.abs(apex.y - 25) > 0.01) probs.push(`${g}-ball apex not on the foot spot`);
      if (g === 9 && apex.id !== 1) probs.push('9-ball: 1 not on the apex');
      if (g === 10 && apex.id !== 1) probs.push('10-ball: 1 not on the apex');
    }
    assertAll('8/9/10-ball racks and random run-out layouts: right balls, legal, non-overlapping, on the table (240 layouts)', probs);
    const v = L.validateLayout([{ id: 'cue', x: 20, y: 20 }, { id: 1, x: 20.5, y: 20 }, { id: 2, x: 120, y: 20 }]);
    const msgs = (v.errors || v).join(' ');
    assert(/overlap/i.test(msgs) && /table/i.test(msgs), `layout validation gives friendly messages ("${msgs.slice(0, 80)}…")`);
    const sp = L.snapPoint({ x: 33.9, y: 20.2 });
    assert(Math.abs(sp.x - 34.375) < 1e-9 && Math.abs(sp.y - 18.75) < 1e-9, '¼-diamond snap (3.125")');
  }
  // share link round trip
  {
    const state = { balls: [{ id: 'cue', x: 25.13, y: 31.25 }, { id: 1, x: 62.5, y: 18.75 }, { id: 9, x: 90.01, y: 3.3 }], shot: { aim: 12.3456, speed: 2.5, vTips: -0.5, hTips: 1 }, annotations: [{ kind: 'arrow', color: '#ffd24a', points: [{ x: 10, y: 10 }, { x: 30, y: 20 }] }, { kind: 'text', color: '#fff', points: [{ x: 50, y: 25 }], text: 'Here' }], name: 'Test shot' };
    const code = SH.encodeState(state);
    const back = SH.decodeState(code);
    const link = SH.shareLink('https://rhino515.github.io/pooltraining/', state);
    assert(/^[A-Za-z0-9_-]+$/.test(code) && /#sim\/s=/.test(link) && SH.codeFromLink(link) === code, `share link encodes the layout in the URL hash (${link.length} chars)`);
    assert(JSON.stringify(back.balls) === JSON.stringify(state.balls) && Math.abs(back.shot.aim - 12.346) < 1e-9 && back.shot.speed === 2.5 && back.shot.vTips === -0.5 && back.annotations.length === 2 && back.annotations[1].text === 'Here' && back.name === 'Test shot', 'share encode → decode round-trip keeps balls, aim, speed, tip, drawings and name');
    let err = '';
    try { SH.decodeState('not-a-real-code'); } catch (e) { err = e.message; }
    assert(/share link/i.test(err), `damaged share link → friendly error ("${err}")`);
    const file = SH.exportFile([{ name: 'A', balls: state.balls, shot: state.shot }]);
    const imp = SH.importFile(file);
    assert(Array.isArray(imp) ? imp.length === 1 : !!imp, 'shot JSON export → import');
  }
  // shot library CRUD
  {
    let d = LIB.loadSim();
    const s1 = LIB.saveShot(d, { name: 'One', balls: [{ id: 'cue', x: 1, y: 1 }], shot: { aim: 0, speed: 2, vTips: 0, hTips: 0 } });
    const c = LIB.addCollection(d, 'Breaks');
    const id = s1?.id || d.shots[0].id;
    LIB.updateShot(d, id, { name: 'Renamed', favorite: true, collection: c?.id || d.collections[1].id });
    LIB.duplicateShot(d, id);
    LIB.saveSim(d);
    d = LIB.loadSim();
    assert(d.shots.length === 2 && d.shots.some((s) => s.name === 'Renamed' && s.favorite), 'shot library: save, rename, favourite, duplicate, persist');
    assert(LIB.listShots(d, { favorites: true }).length >= 1 && LIB.listShots(d, { query: 'renam' }).length >= 1, 'shot library: filter by favourites and search');
    LIB.deleteCollection(d, d.collections.find((x) => x.name === 'Breaks').id);
    assert(d.shots.every((s) => d.collections.some((x) => x.id === s.collection)), 'deleting a collection keeps its shots (moved to My Shots)');
    LIB.deleteShot(d, id);
    assert(d.shots.length === 1, 'shot library: delete');
    localStorage.removeItem(LIB.SIM_KEY);
  }
}

// ---------------------------------------------------------------- Create Drill (custom drills)
{
  const CD = await import(js('customDrills.js'));
  const b = CD.defaultBuilder();
  let v = CD.validateBuilder(b);
  assert(v.errors.some((e) => /title/i.test(e)), `builder validation: title required ("${v.errors[0]}")`);
  const bad = { ...CD.defaultBuilder(), title: 'Bad', balls: [{ n: 1, x: 25.5, y: 31.25 }, { n: 1, x: 150, y: 20 }], pockets: [] };
  v = CD.validateBuilder(bad);
  const msgs = v.errors.join(' | ');
  assert(/overlap/i.test(msgs) && /table/i.test(msgs) && /pocket/i.test(msgs) && /twice|once|same number|duplicate/i.test(msgs), `builder validation: overlap, off-table, duplicate number, no pocket (${v.errors.length} messages)`);
  b.title = 'Verify Stop Shot';
  b.balls.push({ n: 2, x: 75, y: 40.625 });
  b.zones = [{ x: 70, y: 30 }];
  b.why = 'Coach note from verify.';
  b.scoring.mode = 'zone';
  const route = CD.computeRoute(b);
  v = CD.validateBuilder(b, route);
  assert(v.errors.length === 0, `valid builder passes (${v.errors.join('; ') || 'no errors'}${v.warnings.length ? `, warnings: ${v.warnings.join('; ')}` : ''})`);
  assert(route.cuePath.length >= 2 && route.obPath.length >= 2 && route.contactIndex === 1, 'route computed by the simulator (cue path, object-ball path)');
  const ch = CD.buildCustomDrill(b, { now: 1767225600000, route });
  assert(CD.isChallenge(ch) && ch.id.startsWith('cd-') && ch.custom && ch.ballPositions.length === 2 && ch.targetZones.length === 1, 'builder → structured challenge (README drill template fields)');
  assert(ch.whyExplanation && Object.keys(ch.whyExplanation).length >= 3 && /Coach note/.test(ch.whyExplanation.whyCustom), 'custom drill has Why This Shot? text incl. the coach note');
  assert(ch.skillEffects[b.skill] === 1 && ch.scoringRules && ch.attemptCount === 10, 'custom drill has skill effects, scoring rules and attempts');
  CD.upsertCustomDrill(ch);
  drillsMod.refreshCustomDrills();
  const got = drillsMod.getDrillById(ch.id);
  const pocketLevels = drillsMod.allDrills().filter((d) => d.category === 'Ball Pocketing' && d.level).length;
  const buF6 = drillsMod.getDrillById('bu-f6');
  const shelvedN = drills.filter((d) => drillsMod.SHELVED_CATEGORIES.has(d.category)).length;
  assert(pocketLevels === 62 && buF6 && buF6.level == null && buF6.category === 'Ball Pocketing' && !!got && got.custom && shelvedN > 0 && drillsMod.allDrills().length === drills.length - shelvedN + 62 + 8 + 20 + 1 && drills.some((d) => d.id === 'three-lane-speed') && !drills.some((d) => d.category === 'Ball Pocketing') && [...drillsMod.SHELVED_CATEGORIES].every((c) => drillsMod.CATEGORIES.includes(c)) && drillsMod.allDrills().filter((d) => drillsMod.SHELVED_CATEGORIES.has(d.category)).map((d) => d.id).sort().join() === 'bu-bs7,bu-ds7' && drillsMod.getDrillById('sm-01') && drillsMod.knownDrillIds().includes('sm-01') && !drillsMod.allDrills().some((d) => d.safetyMaster || String(d.id).startsWith('sm-')), 'saved drill merges into the built-in library (Three-Lane Speed Exercise) via allDrills()/getDrillById(); the 62 level-gated Ball Pocketing drills stay merged and not in the shipped drills array; bu-f6 is unlocked and not a level; shelved categories stay listed and only bu-bs7 and bu-ds7 show in Banks; Safety Master drills stay out of the library lists');
  const svg = stageTable.renderStageTable(got);
  assert(/<svg/.test(svg) && (svg.match(/class="ball[ "]/g) || []).length >= 3 && /diamond-grid/.test(svg) && /zone-ring/.test(svg), 'custom drill renders: table, grid, 3 balls, zone rings');
  const stage = engine.stageFor({ gameId: 'drills', stageId: ch.id });
  assert(!!stage, 'custom drill plays through the same stage engine as other drills');
  const aimInfo = recipe.recipeGaugesHTML ? recipe.recipeGaugesHTML(got) : '';
  assert(!recipe.recipeGaugesHTML || /gauge-aim/.test(aimInfo), 'custom drill gets the 3-gauge recipe incl. Aim View');
  // unplayed custom drill does not change skills; played one feeds its skill; rank requirements stay game/boss based
  const fresh = storage.loadState ? JSON.parse(JSON.stringify(storage.defaultState ? storage.defaultState() : { games: {}, bosses: {}, ghostMatches: [] })) : { games: {} };
  const base = skills.computeSkillRatings(fresh);
  CD.saveCustomDrills([]);
  drillsMod.refreshCustomDrills();
  const without = skills.computeSkillRatings(fresh);
  CD.upsertCustomDrill(ch);
  drillsMod.refreshCustomDrills();
  assert(JSON.stringify(base) === JSON.stringify(without), 'an unplayed custom drill never lowers skill ratings');
  const played = JSON.parse(JSON.stringify(fresh));
  played.games = played.games || {};
  played.games.drills = { stages: { [ch.id]: { passed: true, tries: 1, bestScore: 30, bestStars: 3, lastDate: new Date().toISOString(), history: [{}] } }, pb: {}, sessions: [] };
  const withRes = skills.computeSkillRatings(played);
  assert(withRes[b.skill] > base[b.skill], `a passed custom drill raises ${b.skill} (${base[b.skill]} → ${withRes[b.skill]})`);
  const r0 = career.syncRank(skills.withSkills(JSON.parse(JSON.stringify(fresh)))).rankIndex;
  const r1 = career.syncRank(skills.withSkills(played)).rankIndex;
  assert(r0 === r1, 'custom drill results do not change career rank (requirements stay game/boss based)');
  // export / import / duplicate / delete
  const file = CD.exportDrills([ch]);
  const imp = CD.parseDrillImport(file, [ch.id]);
  const list = imp.drills || imp;
  assert(list.length === 1 && list[0].id !== ch.id && list[0].name === ch.name, 'drill export → import (clashing id gets a new one)');
  const dup = CD.duplicateCustomDrill(ch.id);
  assert(CD.loadCustomDrills().length === 2 && dup && dup.id !== ch.id, 'duplicate custom drill');
  CD.deleteCustomDrill(dup.id);
  assert(CD.loadCustomDrills().length === 1 && CD.loadCustomDrills()[0].id === ch.id, 'delete custom drill');
  let bad2 = false;
  try { CD.parseDrillImport('{"format":"nope"}', []); } catch { bad2 = true; }
  assert(bad2, 'importing a non-drill file is rejected with an error');
  CD.saveCustomDrills([]);
  drillsMod.refreshCustomDrills();
}

// ---------------------------------------------------------------- service worker + text fixes
{
  const fs = await import('fs');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const missing = walk(path.join(root, 'js')).filter((f) => f.endsWith('.js')).map((f) => './' + path.relative(root, f)).filter((f) => !sw.includes(`'${f}'`));
  assert(/'pool-iq-v14-119'/.test(sw), 'service worker cache is pool-iq-v14-119');
  assertAll('service worker precaches every JS module (incl. simulator + Create Drill)', missing.map((m) => `missing ${m}`));
  const wordN = { one: 1, two: 2, three: 3, four: 4 };
  const probs = [];
  for (const [g, id] of [['follow', 'fo-8'], ['speed', 'sp-6'], ['kick', 'ke-4']]) {
    const st = reg.getStages(g).find((s) => s.id === id);
    const t = `${st.name} ${st.instructions || ''} ${st.goal || ''}`.toLowerCase();
    const rails = st.route?.rails ?? (st.railContacts || []).filter((r) => r.by !== 'ob').length;
    for (const m of t.matchAll(/\b(one|two|three|four)[- ](?:rail|cushion)/g)) if (wordN[m[1]] !== rails) probs.push(`${id}: "${m[0]}" but the route uses ${rails}`);
  }
  assertAll('fo-8, sp-6, ke-4 rail counts in the text match their routes', probs);
}

// ---------------------------------------------------------------- Ghost: order rules + 8-Ball Ghost (incl. Pro)
{
  const GH = await import(js('ghost.js'));
  const L = await import(js('sim/layouts.js'));
  const r3 = GH.rotationRule(3);
  const r9 = GH.rotationRule(9);
  assert(/in order: 1, 2, 3\./.test(r3) && /out of order = Ghost wins the rack/.test(r3), `3-ball rule text states numerical order ("${r3}")`);
  assert(/1, 2, 3, 4, 5, 6, 7, 8, 9\./.test(r9), '9-ball rule text lists 1 through 9 in order');
  const base = { games: {}, bosses: {}, ghostMatches: [], xp: 0 };
  const m3 = GH.renderGhostMatch({ ...base, activeGhost: GH.newGhostSession(3, 5) });
  const m9 = GH.renderGhostMatch({ ...base, activeGhost: GH.newGhostSession(9, 5) });
  assert(/data-rule="order"/.test(m3) && /1, 2, 3\./.test(m3) && /ALL IN ORDER/.test(m3) && /OUT OF ORDER/.test(m3) && /ghost-rules/.test(m3), '3-ball in-game screen shows the order rule, a RULES button and order-based score buttons');
  assert(/1, 2, 3, 4, 5, 6, 7, 8, 9\./.test(m9), '9-ball in-game screen shows the 1…9 order rule');
  const lob = GH.renderGhostLobby(base, { balls: 3, race: 5 });
  assert(/data-rule="order"/.test(lob) && /in order: 1, 2, 3/.test(lob), 'Ghost setup screen shows the order rule');
  assert(/lowest number first/.test(GH.rulesSheetHTML(GH.newGhostSession(4, 5))), 'rotation rules sheet explains lowest number first');
  // 8-Ball Ghost sessions
  const lv = Object.fromEntries(['beginner', 'intermediate', 'advanced', 'pro'].map((l) => [l, GH.newEightSession(l, 5)]));
  assert(lv.beginner.bih === 5 && lv.intermediate.bih === 3 && lv.advanced.bih === 2 && lv.pro.bih === 0 && [lv.beginner, lv.intermediate, lv.advanced, lv.pro].every((s) => s.group === 7 && s.phase === 'break') && lv.beginner.mode === 'eight', '8-Ball Ghost: full rack at every level; ball-in-hand takes are Beginner 5, Intermediate 3, Advanced 2, Pro 0; break phase is free');
  const lob8 = GH.renderGhostLobby(base, { mode: 'eight', level: 'beginner', race: 5 });
  assert(/Beginner/.test(lob8) && /5 ball-in-hand/.test(lob8) && /Intermediate/.test(lob8) && /3 ball-in-hand/.test(lob8) && /Advanced/.test(lob8) && /2 ball-in-hand/.test(lob8) && />Pro</.test(lob8) && /0 ball-in-hand/.test(lob8) && /any order/.test(lob8) && /called pocket/.test(lob8) && /#sim\/eight\/pro/.test(lob8) && !/Custom/.test(lob8), '8-Ball Ghost setup: four levels, ball-in-hand labels, full-rack simulator link');
  const lobPro = GH.renderGhostLobby(base, { mode: 'eight', level: 'pro', race: 5 });
  assert(/you break/i.test(lobPro) && /solids or stripes/.test(lobPro) && /8 on the break = you win the rack/.test(lobPro) && /#sim\/eight\/pro/.test(lobPro), 'Pro rules state the break, open table and the 8-on-the-break house rule');
  // scoring: race to 3 with a custom 4+8 session
  let st = { ...base, activeGhost: GH.newEightSession('beginner', 3) };
  let s = st.activeGhost;
  for (const r of ['W', 'L', 'W']) ({ state: st, session: s } = GH.applyRack(st, s, r));
  let out = GH.applyRack(st, s, 'W');
  st = out.state;
  assert(out.ended && out.match.won && out.match.mode === 'eight' && out.match.group === 7 && out.match.bih === undefined && st.ghostMatches.length === 1 && st.xp > 0, `8-Ball Ghost match to 3 saves a full-rack match (${out.match.you}–${out.match.ghost}, +${st.xp} XP)`);
  assert(career.ghostWins(st) === 1 && career.ghostWins(st, 3) === 0 && !engine.ghostBeaten(st, 3, 3), '8-Ball Ghost win counts as a general Ghost win but never as an N-ball Ghost requirement');
  const sk0 = skills.computeSkillRatings(base);
  const sk1 = skills.computeSkillRatings(st);
  assert(sk1['Pattern Play'] >= sk0['Pattern Play'] && career.syncRank(skills.withSkills({ ...st })).rankIndex === career.syncRank(skills.withSkills({ ...base })).rankIndex, `8-Ball Ghost feeds Pattern Play (${sk0['Pattern Play']} → ${sk1['Pattern Play']}) without changing rank`);
  const un = GH.applyUndo(st, out.session);
  assert(un.state.ghostMatches.length === 0 && un.session.you === 2 && un.state.xp === 0, 'undo after the final rack removes the saved 8-ball match and its XP');
  // Pro flow
  st = { ...base, activeGhost: GH.newEightSession('pro', 3) };
  s = st.activeGhost;
  ({ state: st, session: s } = GH.setBreakMade(st, s, 2));
  ({ state: st, session: s } = GH.applyBreak(st, s, 'ok'));
  assert(s.phase === 'run' && s.breakMade === 2 && s.log.length === 0, 'Pro: logging the break (2 made) moves to ball-in-hand run-out');
  let u = GH.applyUndo(st, s);
  assert(u.session.phase === 'break' && u.session.log.length === 0, 'Pro: undo in the run-out goes back to the break');
  ({ state: st, session: s } = GH.applyBreak(st, u.session, 'ok'));
  ({ state: st, session: s } = GH.applyRack(st, s, 'W'));
  assert(s.you === 1 && s.phase === 'break' && s.breaks[0].made === 2 && !s.breaks[0].eight, 'Pro: run-out win records the rack with its break (2 made)');
  ({ state: st, session: s } = GH.applyBreak(st, s, 'eight'));
  assert(s.you === 2 && s.breaks[1].eight, 'Pro house rule: 8 on the break = rack win');
  ({ state: st, session: s } = GH.setBreakMade(st, s, 1));
  ({ state: st, session: s } = GH.applyBreak(st, s, 'scratch'));
  assert(s.phase === 'run' && s.breakScratch && s.breakMade === 1 && s.ghost === 0 && s.log.length === 2, 'Pro house rule: scratch on the break = no penalty — ball in hand, run-out phase, made count kept');
  u = GH.applyUndo(st, s);
  assert(u.session.phase === 'break' && !u.session.breakScratch && u.session.log.length === 2, 'Pro: undo after a break scratch returns to the break');
  ({ state: st, session: s } = GH.applyBreak(st, u.session, 'scratch'));
  ({ state: st, session: s } = GH.applyRack(st, s, 'L'));
  assert(s.ghost === 1 && s.breaks[2].scratch && s.breaks[2].made === 1 && s.phase === 'break' && !s.breakScratch, 'Pro: run-out after a break scratch scores normally; the scratch is kept in the rack history');
  u = GH.applyUndo(st, s);
  assert(u.session.ghost === 0 && u.session.breaks.length === 2 && u.session.phase === 'run' && u.session.breakScratch && u.session.breakMade === 1, 'Pro: undo of that rack steps back to its run-out (scratch + made count restored)');
  ({ state: st, session: s } = GH.applyRack(st, u.session, 'L'));
  ({ state: st, session: s } = GH.applyBreak(st, s, 'ok'));
  const proHTML = GH.renderGhostMatch({ ...base, activeGhost: GH.newEightSession('pro', 5) });
  const proRules = GH.rulesSheetHTML(GH.newEightSession('pro', 5));
  const proLobby = GH.renderGhostLobby(base, { mode: 'eight', level: 'pro', race: 5 });
  assert([proHTML, proRules, proLobby].every((h) => /Scratch on the break: take ball in hand and run out, no penalty/.test(h) && /8 on the break = you win the rack/.test(h)) && /SCRATCHED ON BREAK/.test(proHTML) && !/GHOST WINS<\/small><\/button>\s*`?$/.test(proHTML) && ![proHTML, proRules, proLobby].some((h) => /scratch (on the break )?= Ghost wins/i.test(h)), 'Pro rule text (break screen, RULES sheet, setup): scratch on the break = ball in hand, no penalty; 8 on the break = rack win');
  out = GH.applyRack(st, s, 'W');
  assert(out.ended && out.match.level === 'pro' && out.match.breaks.length === 4 && GH.ghostLabel(out.match) === '8-Ball Ghost · Pro', 'Pro match saved with break history');
  const stats = GH.ghostStats(out.state);
  const proRow = stats.byEight.find((x) => x.level === 'pro');
  assert(proRow.won === 3 && proRow.played === 1 && proRow.pct === 100 && out.match.you === 3 && out.match.ghost === 1 && out.match.log.length === 4 && stats.won === 3 && stats.byBalls.every((b) => b.played === 0), '8-ball stats kept separate from 3–9-ball stats; a won 3–1 set adds 3 games, not 1 and not 4');
  const shared = GH.ghostStats({
    ghostMatches: [
      { mode: 'eight', level: 'beginner', you: 3, ghost: 0, won: true, log: ['W', 'W', 'W'], race: 3 },
      { mode: 'eight', level: 'beginner', you: 2, ghost: 3, won: false, log: ['W', 'W', 'L', 'L', 'L'], race: 3 },
      { balls: 9, you: 3, ghost: 1, won: true, log: ['W', 'L', 'W', 'W'], race: 3 },
      { balls: 9, you: 1, ghost: 3, won: false, log: ['W', 'L', 'L', 'L'], race: 3 }
    ]
  });
  assert(shared.byEight.find((x) => x.level === 'beginner').won === 3, '8-ball: 3–0 adds 3 games won; a lost set adds 0');
  assert(shared.byBalls.find((b) => b.balls === 9).won === 3 && shared.byBalls.find((b) => b.balls === 9).played === 2, '9-ball shares the games-won counter: 3–1 adds 3, a loss adds 0');
  assert(GH.gamesWonInWinningSet({ won: false, you: 2, log: ['W', 'W', 'L'] }) === 0 && GH.gamesWonInWinningSet({ won: true, you: 3, ghost: 1 }) === 3, 'games won uses his score in a set he won, never a loss');
  // Shot Simulator layouts for 8-Ball Ghost
  const probs = [];
  for (let seed = 1; seed <= 10; seed++) {
    const lay = L.eightGhostLayout(3, seed);
    const ids = lay.filter((b) => b.id !== 'cue').map((b) => b.id);
    if (ids.length !== 15) probs.push(`seed ${seed}: ${ids.length} object balls`);
    const v = L.validateLayout(lay);
    if ((v.errors || v).length) probs.push(`seed ${seed}: ${(v.errors || v).join('; ')}`);
  }
  if (L.eightGhostLayout(7, 3, true).length !== 16) probs.push('layout is not a full rack');
  assertAll('8-Ball Ghost simulator layouts: full 15-ball rack at every level', probs);
}

// ---------------------------------------------------------------- data safety: IndexedDB mirror, snapshots, backup file
{
  const V = await import(js('vault.js'));
  const CDm = await import(js('customDrills.js'));
  const LIBm = await import(js('sim/library.js'));
  const fs = await import('fs');
  const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
  const memKV = (init = {}) => { const m = new Map(Object.entries(init)); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() }; };
  const memIDB = () => { const m = new Map(); return { m, get: async (k) => (m.has(k) ? structuredClone(m.get(k)) : undefined), put: async (k, v) => { m.set(k, structuredClone(v)); return true; }, del: async (k) => m.delete(k) }; };
  let clock = 1_800_000_000_000;
  const now = () => clock;
  const dataOf = (kv) => Object.fromEntries(V.DATA_KEYS.filter((k) => kv.getItem(k) != null).map((k) => [k, JSON.parse(kv.getItem(k))]));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // a realistic save: career progress + custom drill + simulator shots + ghost preset
  const richState = () => {
    const s0 = storage.defaultState();
    s0.xp = 640; s0.rankIndex = 2;
    s0.games = { landing: { stages: { 'lz-1': { passed: true, tries: 4, bestScore: 500, bestStars: 2, history: [] } }, pb: {}, sessions: [] } };
    s0.ghostMatches = [{ id: 'g1', balls: 3, you: 5, ghost: 2, race: 5, won: true, log: ['W'], date: '2026-09-01T10:00:00Z' }];
    return s0;
  };
  const seed = (kv) => {
    kv.setItem(V.KEYS.state, JSON.stringify(richState()));
    kv.setItem(V.KEYS.custom, JSON.stringify({ version: 1, drills: [{ id: 'cd-abc', name: 'My Stop Shot', ballPositions: [{ n: 1, x: 50, y: 25 }], cueBallPosition: { x: 25, y: 25 }, scoringRules: { mode: 'binary' } }] }));
    kv.setItem(V.KEYS.sim, JSON.stringify({ version: 1, current: null, shots: [{ id: 's1', name: 'Draw back', balls: [{ id: 'cue', x: 1, y: 1 }], shot: { speed: 3 } }, { id: 's2', name: 'Bank', balls: [], shot: {} }], collections: [{ id: 'default', name: 'My Shots' }], settings: {}, targetBest: 7 }));
    kv.setItem(V.KEYS.ghostPreset, JSON.stringify({ balls: 5, race: 7, mode: 'eight', level: 'pro', group: 3 }));
  };

  // every persisted key the app uses is covered, and every localStorage writer notifies the mirror
  const keyConsts = new Set();
  const writers = [];
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p2 = path.join(d, f.name); if (f.isDirectory()) walk(p2); else if (f.name.endsWith('.js')) { const t = fs.readFileSync(p2, 'utf8'); for (const m of t.matchAll(/['"](poolIQ[A-Za-z0-9]+)['"]/g)) keyConsts.add(m[1]); if (/localStorage\.setItem\(/.test(t) || /\?\.setItem\(/.test(t)) writers.push([path.relative(root, p2), t]); } } };
  walk(path.join(root, 'js'));
  const uncovered = [...keyConsts].filter((k) => !V.DATA_KEYS.includes(k) && k !== V.META_KEY && k !== 'poolIQFlash');
  assertAll(`every persisted localStorage key is mirrored + backed up (${V.DATA_KEYS.length} data keys: ${V.DATA_KEYS.join(', ')})`, uncovered.map((k) => `not covered: ${k}`));
  assert(V.KEYS.custom === CDm.CUSTOM_KEY && V.KEYS.sim === LIBm.SIM_KEY && /WIP_KEY = 'poolIQDrillWip'/.test(src('js/ui/drillBuilder.js')) && /DRAFT_KEY = 'poolIQDrillDraft'/.test(src('js/ui/simulator.js')) && /GHOST_PRESET_KEY = 'poolIQGhostPreset'/.test(src('js/app.js')), 'vault key list matches the owning modules (custom drills, simulator, drafts, ghost preset)');
  // js/vendor/supabase.js (v13, third-party) only keeps its own sign-in session (sb-<ref>-auth-token): tokens must
  // never go into backup files, so that key is deliberately outside the mirrored / backed-up set
  assertAll('every module that writes localStorage notifies the mirror (dataWritten / lsSet)', writers.filter(([f, t]) => !/vault\.js$/.test(f) && !/^js\/vendor\//.test(f) && !/dataWritten\(/.test(t)).map(([f]) => f));
  assert(!/localStorage\.setItem\(/.test(src('js/ui/drillBuilder.js')) && !/localStorage\.setItem\(/.test(src('js/ui/simulator.js')) && /lsSet\(GHOST_PRESET_KEY/.test(src('js/app.js')), 'drafts + ghost preset go through lsSet (mirrored)');
  {
    let hits = 0;
    storage.onDataWrite(() => hits++);
    storage.saveState(storage.defaultState());
    CDm.saveCustomDrills([]);
    LIBm.saveSim(LIBm.loadSim());
    storage.lsSet('poolIQDrillWip', '{}');
    storage.lsRemove('poolIQDrillWip');
    storage.onDataWrite(null);
    assert(hits === 5, `saveState / saveCustomDrills / saveSim / lsSet / lsRemove all fire the mirror hook (${hits}/5)`);
  }

  // mirror write
  let kv = memKV(); let idb = memIDB();
  let vault = V.createVault({ kv, idb, now, debounceMs: 5 });
  seed(kv); vault.touch();
  await vault.flush();
  let mir = idb.m.get(V.MIRROR_KEY);
  assert(mir && eq(Object.keys(mir.keys).sort(), V.DATA_KEYS.filter((k) => kv.getItem(k) != null).sort()) && V.DATA_KEYS.every((k) => (mir.keys[k] ?? null) === kv.getItem(k)) && mir.savedAt === V.readMeta(kv).savedAt, 'every save is mirrored to IndexedDB (all keys, same savedAt)');
  await new Promise((r) => setTimeout(r, 20));
  kv.setItem(V.KEYS.ghostPreset, JSON.stringify({ balls: 9 })); clock += 1000; vault.touch();
  await new Promise((r) => setTimeout(r, 40));
  assert(JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.ghostPreset]).balls === 9, 'debounced mirror picks up later writes automatically');
  kv.setItem(V.KEYS.ghostPreset, JSON.stringify({ balls: 5, race: 7, mode: 'eight', level: 'pro', group: 3 })); clock += 1000; vault.touch(); await vault.flush();
  const original = dataOf(kv);

  // localStorage wiped → restored from IndexedDB
  kv.clear();
  vault = V.createVault({ kv, idb, now });
  let rec = await vault.reconcile();
  assert(rec.pick === 'remote' && rec.reason === 'local missing' && eq(dataOf(kv), original), 'localStorage wiped → everything restored from the IndexedDB mirror (career, custom drills, sim shots, preset)');
  // main save corrupted → restored
  kv.setItem(V.KEYS.state, '{"xp": 12, broken');
  rec = await V.createVault({ kv, idb, now }).reconcile();
  assert(rec.pick === 'remote' && rec.reason === 'local corrupt' && eq(dataOf(kv), original), 'corrupted main save → good copy restored from IndexedDB');
  // one secondary key corrupted → just that key repaired
  kv.setItem(V.KEYS.sim, 'not json{');
  rec = await V.createVault({ kv, idb, now }).reconcile();
  assert(rec.pick === 'local' && rec.repaired.includes(V.KEYS.sim) && eq(dataOf(kv), original), 'a single corrupted key (simulator library) is repaired from the mirror');
  // IndexedDB wiped → rebuilt from localStorage (vice versa)
  idb.m.clear();
  rec = await V.createVault({ kv, idb, now }).reconcile();
  assert(rec.pick === 'local' && eq(JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.state]), original[V.KEYS.state]), 'IndexedDB missing → mirror rebuilt from localStorage');
  // newer wins (both directions)
  {
    const m = idb.m.get(V.MIRROR_KEY);
    const newer = structuredClone(m);
    const st2 = JSON.parse(newer.keys[V.KEYS.state]); st2.xp = 999; newer.keys[V.KEYS.state] = JSON.stringify(st2); newer.savedAt = V.readMeta(kv).savedAt + 5000;
    idb.m.set(V.MIRROR_KEY, newer);
    rec = await V.createVault({ kv, idb, now }).reconcile();
    assert(rec.pick === 'remote' && rec.reason === 'mirror newer' && JSON.parse(kv.getItem(V.KEYS.state)).xp === 999, 'newer-wins: an IndexedDB copy newer than localStorage is restored');
    const st3 = JSON.parse(kv.getItem(V.KEYS.state)); st3.xp = 1234; kv.setItem(V.KEYS.state, JSON.stringify(st3));
    clock += 60000; V.writeMeta(kv, { ...V.readMeta(kv), savedAt: clock });
    rec = await V.createVault({ kv, idb, now }).reconcile();
    assert(rec.pick === 'local' && JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.state]).xp === 1234, 'newer-wins: newer localStorage stays and updates the mirror');
  }
  // never overwrite a good copy with an empty/default one
  {
    const good = structuredClone(idb.m.get(V.MIRROR_KEY));
    kv.clear();
    kv.setItem(V.KEYS.state, JSON.stringify(storage.defaultState()));
    clock += 60000; V.writeMeta(kv, { seq: 1, savedAt: clock });
    assert(V.choose(V.localBundle(kv), good).pick === 'remote', 'choose(): a newer but EMPTY localStorage never beats a good mirror');
    vault = V.createVault({ kv, idb, now });
    const r1 = await vault.mirror();
    assert(r1.skipped === 'guard' && JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.state]).xp === 1234, 'mirror guard: an empty/default state never overwrites the good IndexedDB copy');
    rec = await vault.reconcile();
    assert(rec.pick === 'remote' && JSON.parse(kv.getItem(V.KEYS.state)).xp === 1234, 'boot with an empty localStorage → good data restored');
    // a deliberate reset IS allowed to mirror an empty state
    vault.markIntent(); clock += 1000;
    kv.setItem(V.KEYS.state, JSON.stringify(storage.defaultState())); vault.touch();
    const r2 = await vault.flush();
    assert(r2.ok && JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.state]).xp === 0 && V.choose(V.localBundle(kv), good).pick === 'local', 'deliberate reset (markIntent) may replace the mirror and wins over older data');
    assert(V.choose({ keys: {}, savedAt: 0 }, null).pick === 'local' && V.choose({ keys: { [V.KEYS.state]: '{bad' } }, { keys: { [V.KEYS.state]: '{bad' } }).pick === 'local', 'choose(): nothing valid anywhere → keep local (no crash)');
  }
  // snapshot rotation (~3 rolling)
  {
    kv = memKV(); idb = memIDB(); clock = 1_800_000_000_000;
    vault = V.createVault({ kv, idb, now, debounceMs: 1 });
    kv.setItem(V.KEYS.state, JSON.stringify(storage.defaultState())); vault.touch(); await vault.flush();
    assert((await vault.snapshots()).length === 0, 'no snapshot of an empty/default state');
    const xps = [];
    for (let i = 1; i <= 5; i++) {
      const st4 = richState(); st4.xp = i * 100; xps.push(i * 100);
      kv.setItem(V.KEYS.state, JSON.stringify(st4)); clock += V.SNAP_EVERY_MS + 1000; vault.touch(); await vault.flush();
    }
    let snaps = await vault.snapshots();
    assert(snaps.length === V.MAX_SNAPSHOTS && eq(snaps.map((x) => JSON.parse(x.keys[V.KEYS.state]).xp), [500, 400, 300]), `snapshots rotate: keeps the newest ${V.MAX_SNAPSHOTS}, newest first (${snaps.map((x) => JSON.parse(x.keys[V.KEYS.state]).xp)})`);
    clock += 1000; const st5 = richState(); st5.xp = 600; kv.setItem(V.KEYS.state, JSON.stringify(st5)); vault.touch(); await vault.flush();
    assert((await vault.snapshots())[0].keys[V.KEYS.state].includes('"xp":500'), 'automatic snapshots are spaced out (not one per save)');
    await vault.snapshot('Before reset');
    snaps = await vault.snapshots();
    assert(snaps[0].reason === 'Before reset' && snaps[0].summary.xp === 600 && snaps.length === 3, 'manual snapshot ("Before reset") goes on top with a summary');
    // restoring a snapshot snapshots the current data first (undoable)
    const target = snaps[2];
    await vault.replaceAll(target.keys, 'Before snapshot restore');
    snaps = await vault.snapshots();
    assert(JSON.parse(kv.getItem(V.KEYS.state)).xp === JSON.parse(target.keys[V.KEYS.state]).xp && snaps[0].reason === 'Before snapshot restore' && snaps[0].summary.xp === 600 && JSON.parse(idb.m.get(V.MIRROR_KEY).keys[V.KEYS.state]).xp === JSON.parse(target.keys[V.KEYS.state]).xp, 'restore previous snapshot: data replaced, mirror updated, and the replaced data kept as a snapshot');
  }
  // backup export → import round trip
  {
    kv = memKV(); idb = memIDB(); seed(kv);
    kv.setItem(V.KEYS.drillWip, JSON.stringify({ editId: null, b: { title: 'wip' } }));
    const orig = dataOf(kv);
    const file = V.buildBackup(kv, { now: Date.UTC(2026, 8, 25, 18) });
    const text = JSON.stringify(file, null, 2);
    assert(file.format === 'pool-iq-backup' && file.schema === V.BACKUP_SCHEMA && file.appVersion === V.APP_VERSION && file.exportedAt === '2026-09-25T18:00:00.000Z' && eq(Object.keys(file.keys).sort(), Object.keys(orig).sort()), 'backup file: format, schema version, app version, timestamp and every key');
    assert(/^PoolIQ-backup-\d{4}-\d{2}-\d{2}\.json$/.test(V.backupFilename(new Date(2026, 8, 5))) && V.backupFilename(new Date(2026, 8, 5)) === 'PoolIQ-backup-2026-09-05.json', 'backup file name PoolIQ-backup-YYYY-MM-DD.json');
    const parsed = V.parseBackup(text);
    assert(parsed.summary.sessions === 4 && parsed.summary.matches === 1 && parsed.summary.drills === 1 && parsed.summary.shots === 2 && parsed.summary.rank === 'Shooter' && parsed.exportedAt === file.exportedAt, `restore summary: sessions, games, drills, shots, rank, date (${V.summaryLine(parsed.summary)})`);
    const kv2 = memKV(); const idb2 = memIDB();
    const other = storage.defaultState(); other.xp = 50; other.ghostMatches = [{ id: 'x', won: false }];
    kv2.setItem(V.KEYS.state, JSON.stringify(other));
    const v2 = V.createVault({ kv: kv2, idb: idb2, now });
    await v2.replaceAll(parsed.keys, 'Before restore');
    assert(eq(dataOf(kv2), orig), 'export → import round trip restores every key identically (career, custom drills, sim shots, preset, draft)');
    const snaps2 = await v2.snapshots();
    assert(snaps2.length === 1 && snaps2[0].reason === 'Before restore' && JSON.parse(snaps2[0].keys[V.KEYS.state]).xp === 50, 'restore auto-snapshots the data it replaces (undoable)');
    assert(eq(JSON.parse(idb2.m.get(V.MIRROR_KEY).keys[V.KEYS.custom]), orig[V.KEYS.custom]), 'restored data is mirrored to IndexedDB immediately');
    // restoring through the real loader: custom drills + sim shots readable by their modules
    for (const k of V.DATA_KEYS) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(parsed.keys)) localStorage.setItem(k, v);
    const loaded = storage.loadState();
    assert(loaded.xp === 640 && loaded.ghostMatches.length === 1 && CDm.loadCustomDrills().length === 1 && LIBm.loadSim().shots.length === 2 && LIBm.loadSim().targetBest === 7, 'restored backup loads through the normal loaders (state, Create Drill library, simulator library)');
    for (const k of V.DATA_KEYS) localStorage.removeItem(k);
  }
  // old-version backups migrate; invalid files are rejected
  {
    const v3 = { version: 3, xp: 900, rankIndex: 4, unlockedGhostBalls: 6, results: {}, ghostMatches: [{ id: 'o', won: true }], skills: {} };
    const p3 = V.parseBackup(JSON.stringify(v3));
    const st6 = V.stateFromKeys(p3.keys);
    assert(p3.legacy && p3.keys[V.KEYS.v3] && st6.version === 4 && st6.xp === 900 && st6.rankFloor === 4 && st6.ghostUnlockFloor === 6 && p3.summary.rank === 'Advanced', 'an old V3 save file is accepted and migrated to V4 (rank + Ghost unlocks preserved)');
    const v2 = { xp: 300, ghostMatches: [{ balls: 3, you: 5, ghost: 1, won: true }], results: { a: { passed: true } } };
    const p2 = V.parseBackup(JSON.stringify(v2));
    assert(V.stateFromKeys(p2.keys).xp === 300 && p2.summary.matches === 1, 'an unversioned (V2-era) save file is accepted and migrated');
    const old = { format: 'pool-iq-backup', schema: 0, exportedAt: '2026-01-02T03:04:05Z', keys: { poolIQStateV3: JSON.stringify(v3), poolIQSimV1: JSON.stringify({ shots: [{ id: 'z' }] }), someFutureKey: { a: 1 } } };
    const p0 = V.parseBackup(JSON.stringify(old));
    assert(p0.summary.xp === 900 && p0.summary.shots === 1 && !('someFutureKey' in p0.keys), 'older backup schema (string values, V3 state) is migrated; unknown keys ignored');
    const bad = [['not json at all', /not valid JSON/], ['[1,2]', /not a Pool IQ backup/], ['{"hello":1}', /not a Pool IQ backup/], [JSON.stringify({ format: 'pool-iq-drills', drills: [] }), /drill export/], [JSON.stringify({ format: 'pool-iq-backup', schema: 1 }), /damaged/], [JSON.stringify({ format: 'pool-iq-backup', schema: 1, keys: {} }), /empty/], [JSON.stringify({ format: 'pool-iq-backup', schema: 1, keys: { poolIQStateV4: 'garbage' } }), /damaged/], [JSON.stringify({ format: 'pool-iq-backup', schema: 1, keys: { poolIQStateV4: [1] } }), /damaged/]];
    const probs = [];
    for (const [t, re] of bad) { try { V.parseBackup(t); probs.push(`accepted: ${t.slice(0, 40)}`); } catch (e) { if (!re.test(e.message)) probs.push(`wrong message for ${t.slice(0, 30)}: ${e.message}`); } }
    assertAll('invalid backup files are rejected with a clear message (not JSON, wrong shape, drill export, no data, damaged state)', probs);
    let bom = null; try { bom = V.parseBackup('\uFEFF' + JSON.stringify(V.buildBackup(memKV({ poolIQStateV4: JSON.stringify(richState()) })))); } catch { bom = null; }
    assert(bom && bom.summary.xp === 640, 'backup with a UTF-8 BOM (edited on Windows) still restores');
  }
  // reminder
  {
    const D = 86400000; const T = Date.UTC(2026, 8, 25);
    const busy = { activity: 5 };
    assert(V.daysAgoText(0, T) === 'never' && V.daysAgoText(T - 3600000, T) === 'today' && V.daysAgoText(T - D - 1, T) === 'yesterday' && V.daysAgoText(T - 9 * D, T) === '9 days ago', 'last-backup text: never / today / yesterday / N days ago');
    assert(V.nudgeDue({}, busy, T) && !V.nudgeDue({}, { activity: 1 }, T) && !V.nudgeDue({ lastBackupAt: T - 3 * D }, busy, T) && V.nudgeDue({ lastBackupAt: T - 8 * D }, busy, T) && !V.nudgeDue({ nudgeDismissedAt: T - D }, busy, T) && V.nudgeDue({ nudgeDismissedAt: T - 8 * D }, busy, T), 'Home nudge only with real progress, >7 days since backup, and not dismissed this week');
  }
  // Android install: manifest + icons
  {
    const man = JSON.parse(src('manifest.json'));
    const pngSize = (f) => { const b = fs.readFileSync(path.join(root, f)); return b.toString('ascii', 1, 4) === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
    const icons = man.icons || [];
    const has = (size, purpose) => icons.find((i) => i.sizes === size && (i.purpose || 'any').split(' ').includes(purpose) && i.type === 'image/png');
    const probs = [];
    for (const [size, purpose] of [['192x192', 'any'], ['512x512', 'any'], ['192x192', 'maskable'], ['512x512', 'maskable']]) {
      const ic = has(size, purpose);
      if (!ic) { probs.push(`no ${purpose} ${size} icon`); continue; }
      const dim = pngSize(ic.src.replace(/^\.\//, ''));
      if (!dim || `${dim[0]}x${dim[1]}` !== size) probs.push(`${ic.src} is ${dim}`);
    }
    if (!(man.name && man.short_name && man.start_url === './' && man.scope === './' && man.display === 'standalone' && /^#/.test(man.theme_color) && /^#/.test(man.background_color) && man.id)) probs.push('name/short_name/id/start_url/scope/display/colours incomplete');
    if (man.prefer_related_applications) probs.push('prefer_related_applications must be false');
    const sw2 = src('sw.js');
    for (const ic of icons) if (!sw2.includes(ic.src)) probs.push(`sw does not precache ${ic.src}`);
    if (!/apple-touch-icon\.png/.test(src('index.html')) || !sw2.includes('./icons/apple-touch-icon.png')) probs.push('apple-touch-icon missing');
    assertAll('manifest complete for Android Chrome install (start_url/scope ./ = /pooltraining/, standalone, colours, 192+512 any + maskable PNGs, precached)', probs);
  }
}


// ---------------------------------------------------------------- v10: .pooliq content system
{
  const fs = await import('fs');
  const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
  const SC = await import(js('content/schema.js'));
  const CV = await import(js('content/convert.js'));
  const ST = await import(js('content/store.js'));
  const TP = await import(js('content/templates.js'));
  const BC = await import(js('ui/builderContent.js'));
  const CDm = await import(js('customDrills.js'));
  const V = await import(js('vault.js'));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const exDir = path.join(root, 'examples');
  const exFiles = fs.readdirSync(exDir).filter((f) => f.endsWith('.pooliq')).sort();
  const ex = Object.fromEntries(exFiles.map((f) => [f, fs.readFileSync(path.join(exDir, f), 'utf8')]));
  const V1 = (t) => SC.validatePooliq(t);
  const errs = (r) => (r.errors || []).join(' | ');

  // examples
  {
    const probs = [];
    const want = ['demo-single-drill.pooliq', 'demo-training-pack.pooliq', 'demo-lesson.pooliq', 'demo-gauntlet.pooliq', 'demo-diamond-challenge.pooliq', 'demo-player-solution.pooliq', 'pooliq-drill-template.pooliq'];
    for (const f of want) if (!ex[f]) probs.push(`missing ${f}`);
    for (const [f, t] of Object.entries(ex)) {
      const r = V1(t);
      if (!r.ok) probs.push(`${f}: ${errs(r)}`);
      else {
        if (r.warnings.length) probs.push(`${f} has warnings: ${r.warnings.join('; ')}`);
        if (!/DEMO|TEMPLATE/i.test(r.doc.title) || !/DEMO|template/i.test(r.doc.description || '')) probs.push(`${f} is not clearly labeled DEMO/template`);
      }
    }
    assertAll(`all ${exFiles.length} example .pooliq files validate with no errors or warnings and are labeled DEMO`, probs);
    const types = Object.values(ex).map((t) => JSON.parse(t)).map((d) => d.contentType + (d.challengeType ? `:${d.challengeType}` : '') + (d.template ? `:${d.template}` : ''));
    assert(['drill', 'pack', 'lesson', 'game:gauntlet', 'challenge:diamond', 'challenge:solution'].every((t) => types.includes(t)), `examples cover drill, pack, lesson, gauntlet, diamond + solution challenges (${types.join(', ')})`);
    const tpl = JSON.parse(ex['pooliq-drill-template.pooliq']);
    const missingShot = Object.keys(SC.SHOT_FIELDS).filter((k) => k !== 'objectBallPath' && tpl.shot[k] === undefined);
    const hdr = ['format', 'schemaVersion', 'contentType', 'id', 'contentVersion', 'title', 'description', 'category', 'difficulty', 'skill', 'attribution', 'careerEligible', 'metadata', 'shot', 'scoringRules', 'xp', 'skillEffects', 'prerequisites', ...SC.V11_FIELDS];
    const missingTop = hdr.filter((k) => tpl[k] === undefined);
    assert(!missingShot.length && !missingTop.length, `template file demonstrates every drill + shot field (missing: ${[...missingTop, ...missingShot].join(', ') || 'none'})`);
  }
  // valid single drill
  {
    const r = V1(ex['demo-single-drill.pooliq']);
    const raw = JSON.parse(ex['demo-single-drill.pooliq']);
    assert(r.ok && r.doc.id === raw.id && r.doc.shot.speed === 1.5 && r.doc.shot.ballPositions[0].n === 1 && r.doc.scoringRules.pass.made === 7, 'valid single drill imports with its layout, SPEED and scoring intact');
    const ch = CV.shotToChallenge(r.doc.shot, { id: 'x', title: r.doc.title, scoringRules: r.doc.scoringRules });
    assert(ch.cueBallPosition.x === 50 && ch.targetPocket === 'TM' && ch.speed === 1.5 && ch.aim && ch.cueContact && ch.scoringRules.attempts === 10, 'imported shot maps to the engine challenge used by the normal renderer / Shot Recipe');
    const dshort = clone(raw); dshort.shot.cueBallPosition = { dx: 4, dy: 2.8 };
    const r2 = V1(JSON.stringify(dshort));
    assert(r2.ok && r2.doc.shot.cueBallPosition.x === 50 && r2.doc.shot.cueBallPosition.y === 35, 'diamond shorthand {dx, dy} converts to canonical table units (1 diamond = 12.5)');
  }
  // v11.1: quarter-step SPEED values are valid; existing 0.5-step content still is
  {
    const base = JSON.parse(ex['demo-single-drill.pooliq']);
    const okFor = (v) => { const d = clone(base); d.shot.speed = v; const r = V1(JSON.stringify(d)); return r.ok; };
    assert([0.25, 1.25, 1.75, 2.75, 4.75].every(okFor), 'schema: quarter-step SPEED values (0.25, 1.25, 1.75, 2.75, 4.75) validate');
    assert([0.5, 1, 1.5, 2, 2.5, 3, 5].every(okFor) && V1(ex['demo-single-drill.pooliq']).ok, 'schema: existing 0.5-step SPEED content still validates');
  }
  // invalid files
  {
    const base = JSON.parse(ex['demo-single-drill.pooliq']);
    const mut = (fn) => { const d = clone(base); fn(d); return V1(JSON.stringify(d)); };
    const cases = [
      ['missing cue ball', (d) => { delete d.shot.cueBallPosition; }, /cueBallPosition: is required/],
      ['two cue balls', (d) => { d.shot.cueBallPosition = [{ x: 10, y: 10 }, { x: 20, y: 20 }]; }, /exactly one cue ball/],
      ['cue ball in numbered balls', (d) => { d.shot.ballPositions.push({ n: 0, x: 70, y: 30 }); }, /cue ball goes in cueBallPosition/],
      ['off table', (d) => { d.shot.ballPositions[0].x = 104; }, /off the table/],
      ['in the cushion', (d) => { d.shot.cueBallPosition = { x: 0.5, y: 20 }; }, /overlaps the cushion/],
      ['overlapping balls', (d) => { d.shot.ballPositions.push({ n: 2, x: 50.8, y: 12.5 }); }, /overlap/],
      ['duplicate numbers', (d) => { d.shot.ballPositions.push({ n: 1, x: 70, y: 30 }); }, /used twice/],
      ['ball 16', (d) => { d.shot.ballPositions[0].n = 16; }, /1 to 15/],
      ['SPEED 1.7', (d) => { d.shot.speed = 1.7; }, /not on the Pool IQ SPEED scale/],
      ['SPEED 6', (d) => { d.shot.speed = 6; }, /SPEED scale/],
      ['SPEED 1.1', (d) => { d.shot.speed = 1.1; }, /steps of 0\.25/],
      ['SPEED 0.1', (d) => { d.shot.speed = 0.1; }, /SPEED scale/],
      ['SPEED text', (d) => { d.shot.speed = 'medium'; }, /SPEED number/],
      ['pass > attempts', (d) => { d.scoringRules.pass.made = 12; }, /between 1 and the number of attempts/],
      ['attempts 0', (d) => { d.scoringRules.attempts = 0; }, /whole number from 1 to 50/],
      ['unknown field', (d) => { d.shot.cueBall = { x: 1, y: 1 }; }, /unknown field \(did you mean "cueBallPosition"\?\)/],
      ['bad tip step', (d) => { d.shot.cueContact.vTips = 0.3; }, /¼-tip steps/],
      ['zone scoring without zones', (d) => { delete d.shot.targetZones; d.scoringRules = { mode: 'zone', attempts: 5, pass: { stars: 5 } }; }, /needs at least one target zone/],
      ['bad zone rings', (d) => { d.shot.targetZones[0].rings = [{ r: 2, stars: 3 }, { r: 1, stars: 1 }]; }, /smaller/],
      ['bad pocket', (d) => { d.shot.targetPocket = 'XX'; }, /must be one of: TL/],
      ['target ball not on table', (d) => { d.shot.targetBall = 9; }, /not in ballPositions/],
      ['bad id', (d) => { d.id = 'has spaces!'; }, /must be an id/],
      ['wrong format', (d) => { d.format = 'other'; }, /not a Pool IQ content file/],
      ['unknown content type', (d) => { d.contentType = 'video'; }, /Unknown contentType/]
    ];
    const probs = [];
    for (const [name, fn, re] of cases) { const r = mut(fn); if (r.ok || !re.test(errs(r))) probs.push(`${name}: ${r.ok ? 'accepted' : errs(r)}`); }
    probs.push(...(V1('not json {').ok ? ['bad JSON accepted'] : []), ...(V1('').ok ? ['empty accepted'] : []), ...(V1('[1,2]').ok ? ['array accepted'] : []));
    assertAll(`invalid files are rejected with readable errors (${cases.length + 3} cases)`, probs);
    const r = mut((d) => { d.shot.speed = 1.7; d.scoringRules.pass.made = 12; });
    assert(!r.ok && /^CANNOT IMPORT/.test(r.errors[0]) && r.errors.length >= 3, 'all problems are listed together under a CANNOT IMPORT header');
  }
  // malicious / executable content
  {
    const base = JSON.parse(ex['demo-single-drill.pooliq']);
    const mut = (fn) => { const d = clone(base); fn(d); return V1(JSON.stringify(d)); };
    const cases = [
      ['<script> in title', (d) => { d.title = 'Nice <script>alert(1)</script>'; }],
      ['<iframe> in instructions', (d) => { d.shot.instructions = 'x <iframe src=x>'; }],
      ['img onerror', (d) => { d.description = '<img src=x onerror=alert(1)>'; }],
      ['event handler text', (d) => { d.attribution.notes = 'hello onclick=steal()'; }],
      ['javascript: URL', (d) => { d.attribution.sourceURL = 'javascript:alert(1)'; }],
      ['javascript: in text', (d) => { d.shot.goal = 'go to javascript:void(0)'; }],
      ['data: URL', (d) => { d.shot.hints = ['data:text/html;base64,PHNjcmlwdD4=']; }],
      ['HTML entity', (d) => { d.title = '&#60;script&#62;'; }],
      ['eval', (d) => { d.shot.whyExplanation.whyCustom = 'eval(atob("x"))'; }],
      ['CSS expression', (d) => { d.category = 'x{background:url(http://e)}'; }],
      ['ftp URL', (d) => { d.attribution.sourceURL = 'ftp://example.com/x'; }]
    ];
    const probs = [];
    for (const [name, fn] of cases) { const r = mut(fn); if (r.ok) probs.push(`${name} accepted`); }
    const proto = V1(ex['demo-single-drill.pooliq'].replace('"shot": {', '"__proto__": {"polluted": true}, "shot": {'));
    if (proto.ok || !/forbidden key "__proto__"/.test(errs(proto))) probs.push(`__proto__: ${errs(proto)}`);
    const ctor = V1(ex['demo-single-drill.pooliq'].replace('"shot": {', '"shot": {"constructor": {"prototype": {"x": 1}},'));
    if (ctor.ok || !/forbidden key "constructor"/.test(errs(ctor))) probs.push(`constructor: ${errs(ctor)}`);
    const proto2 = V1(ex['demo-single-drill.pooliq'].replace('"metadata": {', '"metadata": {"prototype": 1,'));
    if (proto2.ok) probs.push('prototype key accepted');
    if ({}.polluted !== undefined || Object.prototype.x !== undefined) probs.push('Object.prototype was polluted');
    const big = clone(base); big.description = 'a'.repeat(3000); big.shot.hints = Array.from({ length: 10 }, () => 'b'.repeat(290));
    const huge = JSON.stringify({ ...base, pad: 'x'.repeat(SC.MAX_FILE_BYTES) });
    const rh = V1(huge);
    if (rh.ok || !/too large/.test(errs(rh))) probs.push(`oversized file: ${errs(rh)}`);
    const longStr = mut((d) => { d.shot.instructions = 'y'.repeat(5000); });
    if (longStr.ok) probs.push('5000-char text accepted');
    const deep = V1(JSON.stringify({ format: 'pooliq', a: JSON.parse('['.repeat(30) + ']'.repeat(30)) }));
    if (deep.ok) probs.push('deeply nested accepted');
    const manyBalls = mut((d) => { d.shot.ballPositions = Array.from({ length: 16 }, (_, i) => ({ n: (i % 15) + 1, x: 5 + i * 5, y: 40 })); });
    if (manyBalls.ok || !/too many entries/.test(errs(manyBalls))) probs.push(`16 balls: ${errs(manyBalls)}`);
    assertAll(`malicious / executable content is rejected (${cases.length} script-like strings, __proto__/constructor/prototype keys, oversize, depth, long text, array caps)`, probs);
    const r = mut((d) => { d.title = '<script>x</script>'; });
    assert(!r.ok && r.security && /not allowed/.test(r.errors[0]), 'security rejections are flagged and explained ("content that is not allowed")');
  }
  // schema version
  {
    const d = JSON.parse(ex['demo-single-drill.pooliq']);
    const r3 = V1(JSON.stringify({ ...d, schemaVersion: '3.0' }));
    assert(!r3.ok && r3.errors[0] === 'CANNOT IMPORT — This file uses Pool IQ schema 3.0. Your version supports up to 1.0.', 'schema 3.0 → "CANNOT IMPORT — This file uses Pool IQ schema 3.0. Your version supports up to 1.0."');
    const r11 = V1(JSON.stringify({ ...d, schemaVersion: '1.1' }));
    const rn = V1(JSON.stringify({ ...d, schemaVersion: 1 }));
    const rm = V1(JSON.stringify({ ...d, schemaVersion: undefined }));
    assert(!r11.ok && /schema 1\.1/.test(r11.errors[0]) && rn.ok && rn.doc.schemaVersion === '1.0' && !rm.ok, 'schema 1.1 refused, numeric 1 accepted as 1.0, missing version refused');
  }
  // legacy custom-drill export + backup file
  {
    const b = { ...CDm.defaultBuilder(), title: 'Old drill', cue: { x: 25, y: 25 }, balls: [{ n: 1, x: 62.5, y: 18.75 }], targetBall: 1, pockets: ['TR'] };
    const ch = CDm.buildCustomDrill(b, { id: 'cd-legacy1', route: null });
    const exp = CDm.exportDrills([ch]);
    const r = V1(exp);
    assert(r.ok && r.legacy === 'drills' && CDm.parseDrillImport(exp, []).drills.length === 1, 'old Create Drill JSON exports are still accepted (legacy format → My Drills)');
    const doc = CV.checkedDoc(CV.docFromChallenge(ch, { title: ch.name }));
    const back = CV.shotToChallenge(doc.shot, { id: 'y' });
    assert(doc.contentType === 'drill' && back.cueBallPosition.x === 25 && back.ballPositions[0].x === 62.5 && back.targetPocket === 'TR', 'a Create Drill drill exports as a valid .pooliq drill (positions preserved)');
    const bk = V1(JSON.stringify({ format: 'pool-iq-backup', keys: {} }));
    assert(!bk.ok && /backup file/.test(bk.errors[0]), 'Pool IQ backup files are refused by IMPORT CONTENT with a pointer to Settings → Restore');
  }
  // training pack
  {
    const r = V1(ex['demo-training-pack.pooliq']);
    const d = r.doc;
    let prog = null;
    const s0 = ST.packStageStates(d, prog);
    assert(r.ok && d.stages.length === 4 && s0[0] === 'open' && s0.slice(1).every((s) => s === 'locked') && ST.packPercent(d, prog) === 0, `training pack imports with ordered stages, first open and the rest locked (${s0.join(', ')})`);
    const ids = d.stages.map((s) => s.id);
    prog = { stages: { [ids[0]]: { passed: true } } };
    const s1 = ST.packStageStates(d, prog);
    prog = { stages: { [ids[0]]: { passed: true }, [ids[1]]: { passed: true } } };
    const s2 = ST.packStageStates(d, prog);
    assert(s1[0] === 'done' && s1[1] === 'open' && s1[2] === 'locked' && s2[2] === 'open' && s2[3] === 'locked' && ST.packPercent(d, prog) === 50, `stage locking + progress: ${s1.join('/')} → ${s2.join('/')} (50%)`);
    const bad = clone(JSON.parse(ex['demo-training-pack.pooliq'])); bad.stages[0].requires = ['final'];
    const rb = V1(JSON.stringify(bad));
    assert(!rb.ok && /EARLIER stage/.test(errs(rb)), 'pack prerequisites must point at earlier stages');
    const open = clone(JSON.parse(ex['demo-training-pack.pooliq'])); open.unlockMode = 'open'; for (const s of open.stages) delete s.requires;
    assert(ST.packStageStates(V1(JSON.stringify(open)).doc, null).every((s) => s === 'open'), 'unlockMode "open" unlocks every stage');
  }
  // lesson
  {
    const r = V1(ex['demo-lesson.pooliq']);
    const phases = r.doc.steps.map((s) => s.phase);
    assert(r.ok && ['teach', 'guided', 'solve', 'execute', 'test'].every((p) => phases.includes(p)), `lesson imports with TEACH → GUIDED → SOLVE → EXECUTE → TEST (${phases.join(' → ')})`);
    const d = JSON.parse(ex['demo-lesson.pooliq']);
    const solve = d.steps.findIndex((s) => s.phase === 'solve');
    const test = d.steps.findIndex((s) => s.phase === 'test');
    const a = clone(d); delete a.steps[solve].ask;
    const b = clone(d); delete b.steps[test].scoringRules;
    const c = clone(d); a.steps[solve].answer && delete c.steps[solve].answer;
    assert(!V1(JSON.stringify(a)).ok && !V1(JSON.stringify(b)).ok && (!d.steps[solve].answer || !V1(JSON.stringify(c)).ok), 'lesson rules: solve steps need ask (and an answer for rail/diamond), test steps need scoring');
  }
  // game templates
  {
    const g0 = V1(ex['demo-gauntlet.pooliq']).doc;
    const miss = { t: 'shot', ok: false };
    const hit = { t: 'shot', ok: true };
    let g = TP.replayGame(g0, []);
    assert(g.lives === 3 && g.pos === 0 && g.score === 0 && !g.over && g0.template === 'gauntlet', 'gauntlet starts with 3 lives at stage 1');
    g = TP.replayGame(g0, [miss]);
    const g2 = TP.replayGame(g0, [miss, hit]);
    assert(g.lives === 2 && g.pos === 0 && !g.over && g2.pos === 1 && g2.score >= 100, `a miss loses a life and retries the stage; a success scores and advances (lives ${g.lives}, stage ${g2.pos + 1}, score ${g2.score})`);
    g = TP.replayGame(g0, [hit, miss, miss, miss]);
    const s = TP.gameSummary(g0, g);
    assert(g.over && !g.won && g.reason === 'lives' && g.lives === 0 && s.successes === 1 && s.misses === 3 && s.stageReached === 2 && s.longestStreak === 1, `lives 0 → GAME OVER with score/stage reached/successes/misses/longest streak (${JSON.stringify(s)})`);
    const all = TP.replayGame(g0, g0.stages.map(() => hit));
    const pts = g0.stages.reduce((a, st) => a + (st.points ?? g0.rules.pointsPerSuccess), 0);
    const bonus = g0.rules.streakBonus ? Math.floor(g0.stages.length / g0.rules.streakBonus.every) * g0.rules.streakBonus.points : 0;
    assert(all.over && all.won && all.score === pts + bonus + (g0.rules.stageBonus || 0), `clearing every stage wins (GAUNTLET CLEARED) with points + streak bonus + completion bonus (${all.score})`);
    const nx = clone(g0); nx.rules = { ...nx.rules, retry: 'next' };
    assert(TP.replayGame(nx, [miss]).pos === 1, 'retry "next" moves on after a miss');
    const mk = (template, stages, rules = {}) => ({ ...clone(g0), template, rules, stages: stages.map((st, i) => ({ ...clone(g0.stages[0]), points: undefined, id: `t${i}`, ...st })) });
    const streak = mk('streak', [{}, {}, {}]);
    const gs = TP.replayGame(streak, [hit, hit, hit, hit, miss]);
    assert(gs.over && gs.longest === 4 && gs.made === 4, 'STREAK: runs until the first miss (loops stages)');
    const sa = mk('scoreAttack', [{}, {}], { shots: 4, pointsPerSuccess: 10, passScore: 20 });
    const gsa = TP.replayGame(sa, [hit, miss, hit, miss]);
    assert(gsa.over && gsa.score === 20 && gsa.won && gsa.shots === 4, 'SCORE ATTACK: fixed shots, points per success, pass score');
    const tg = mk('target', [{}], { shots: 2, pointsPerStar: 10 });
    const gt = TP.replayGame(tg, [{ t: 'shot', stars: 3 }, { t: 'shot', stars: 1 }]);
    assert(gt.over && gt.score === 40, 'TARGET: stars × points per star');
    const lv = mk('lives', [{}, {}], { lives: 2 });
    const gl = TP.replayGame(lv, [hit, miss, hit, miss]);
    assert(gl.over && gl.lives === 0 && gl.made === 2, 'LIVES: every shot moves on, misses cost lives');
    const ms = mk('multiStage', [{ scoringRules: { mode: 'success', attempts: 3, pass: { made: 2 } } }, { scoringRules: { mode: 'success', attempts: 2, pass: { made: 1 } } }], { lives: 2 });
    let gm = TP.replayGame(ms, [hit, miss, hit]);
    const gm2 = TP.replayGame(ms, [miss, miss, miss, miss]);
    gm = TP.replayGame(ms, [hit, miss, hit, hit]);
    assert(gm.over && gm.won && gm2.over && !gm2.won, 'MULTI-STAGE: pass each stage\'s requirement to advance; failing costs a life');
    const qz = mk('quizExecution', [{ quiz: { question: 'Q?', options: ['A', 'B'], correct: 1 } }], { quizPoints: 50, pointsPerSuccess: 100 });
    const gq0 = TP.replayGame(qz, []);
    const gq = TP.replayGame(qz, [{ t: 'quiz', ok: true }, hit]);
    assert(gq0.phase === 'quiz' && TP.replayGame(qz, [hit]).shots === 0 && gq.over && gq.score === 150, 'QUIZ + EXECUTION: answer first, then shoot (quiz points + shot points)');
    const probs = [];
    for (const t of SC.GAME_TEMPLATES) {
      const d = mk(t, [{ scoringRules: { mode: 'success', attempts: 1, pass: { made: 1 } }, quiz: { question: 'Q?', options: ['A', 'B'], correct: 0 } }]);
      if (t !== 'quizExecution') delete d.stages[0].quiz;
      if (t !== 'multiStage') delete d.stages[0].scoringRules;
      if (t === 'target') d.stages[0].shot.targetZones = [{ x: 50, y: 25, rings: [{ r: 3, stars: 3 }] }];
      const r = V1(JSON.stringify(d));
      if (!r.ok) probs.push(`${t}: ${errs(r)}`);
      let gg = TP.replayGame(r.doc || d, []);
      for (let i = 0; i < 400 && !gg.over; i++) gg = TP.applyEvent(r.doc || d, gg, gg.phase === 'quiz' ? { t: 'quiz', ok: true } : { t: 'shot', ok: false, stars: 0 });
      if (!gg.over) probs.push(`${t} never ends on misses`);
    }
    const bad = mk('pinball', [{}]);
    const rb = V1(JSON.stringify(bad));
    if (rb.ok || !/template: must be one of/.test(errs(rb))) probs.push('unsupported template accepted');
    assertAll(`all ${SC.GAME_TEMPLATES.length} safe game templates validate and always terminate; unsupported templates are rejected`, probs);
  }
  // personal bests + store
  {
    store.clear();
    const d1 = V1(ex['demo-single-drill.pooliq']).doc;
    const g = V1(ex['demo-gauntlet.pooliq']).doc;
    const a = ST.installDoc(d1, { source: 'imported' });
    const gi = ST.installDoc(g, { source: 'imported' });
    assert(a.item && gi.item && ST.loadContent().length === 2 && JSON.parse(store.get(ST.CONTENT_KEY)).items.length === 2, 'install saves to My Content in its own storage key (poolIQContentV1)');
    const r1 = ST.recordResult(gi.item.uid, { passed: false, score: 300 });
    const r2 = ST.recordResult(gi.item.uid, { passed: false, score: 200 });
    const r3 = ST.recordResult(gi.item.uid, { passed: true, score: 900 });
    const p = JSON.parse(store.get(ST.PROGRESS_KEY))[gi.item.uid];
    assert(r1.newBest && !r2.newBest && r3.newBest && p.best === 900 && p.plays === 3 && p.passed, `personal best persists (best ${p?.best}, plays ${p?.plays}) in poolIQContentProgressV1`);
    const pk = ST.installDoc(V1(ex['demo-training-pack.pooliq']).doc, {});
    ST.recordResult(pk.item.uid, { stageId: 'intro', passed: true, score: 10 });
    assert(ST.packStageStates(pk.item.doc, ST.progressFor(pk.item.uid))[1] === 'open', 'pack stage results unlock the next stage');
    // conflicts
    const c = ST.installDoc(d1, {});
    assert(c.conflict && c.conflict.length === 1 && c.conflict[0].uid === a.item.uid, 'same id already installed → conflict (never silently overwritten)');
    const cancel = ST.installDoc(d1, { mode: 'cancel' });
    assert(cancel.cancelled && ST.loadContent().length === 3, 'CANCEL changes nothing');
    const v12 = { ...clone(d1), contentVersion: '1.2', title: 'DEMO v1.2' };
    const rep = ST.installDoc(v12, { mode: 'replace' });
    assert(rep.item && rep.item.uid === a.item.uid && ST.getItem(a.item.uid).contentVersion === '1.2' && ST.loadContent().length === 3, 'REPLACE updates the installed item (same uid, version 1.0 → 1.2)');
    const kb = ST.installDoc(d1, { mode: 'keepBoth' });
    assert(kb.item && kb.item.id !== d1.id && /copy/.test(kb.item.title) && ST.loadContent().length === 4 && ST.getItem(a.item.uid).contentVersion === '1.2', `KEEP BOTH installs a copy with a new id (${kb.item?.id})`);
    // edit imported content
    const ed = clone(ST.getItem(a.item.uid).doc);
    ed.shot.speed = 1.5 === ed.shot.speed ? 2 : 1.5;
    ed.shot.ballPositions[0].x = 45;
    ed.shot.instructions = 'Fixed instructions';
    const up = ST.updateItemDoc(a.item.uid, ed);
    const after = ST.getItem(a.item.uid);
    assert(up.item && after.edited && after.doc.shot.speed === ed.shot.speed && after.doc.shot.ballPositions[0].x === 45 && after.doc.shot.instructions === 'Fixed instructions', 'editing imported content (move a ball, change SPEED, fix instructions) saves and re-validates');
    const badEd = clone(after.doc); badEd.shot.speed = 1.7;
    const up2 = ST.updateItemDoc(a.item.uid, badEd);
    assert(up2.error && ST.getItem(a.item.uid).doc.shot.speed === ed.shot.speed, 'an invalid edit is refused and the saved item is untouched');
    // delete
    ST.deleteItem(gi.item.uid);
    assert(!ST.getItem(gi.item.uid) && !JSON.parse(store.get(ST.PROGRESS_KEY))[gi.item.uid] && ST.loadContent().length === 3, 'delete removes the item and its personal progress');
    const keysTouched = [...store.keys()].filter((k) => k.startsWith('poolIQ'));
    assert(keysTouched.every((k) => [ST.CONTENT_KEY, ST.PROGRESS_KEY, 'poolIQMetaV1'].includes(k)), `installing / playing / deleting content only writes its own keys (${keysTouched.join(', ')})`);
  }
  // diamond / rail answer
  {
    const t1 = TP.tapToRail(40, 0.4);
    const t2 = TP.tapToRail(99.2, 20.3);
    const t3 = TP.tapToRail(28.7, 49);
    assert(t1.rail === 'top' && t1.diamond === 3.2 && t2.rail === 'right' && t2.diamond === 1.6 && t3.rail === 'bottom' && t3.diamond === 2.3, `tapping the table snaps to the nearest rail at 0.1 diamond (${JSON.stringify([t1, t2, t3])})`);
    const ans = V1(ex['demo-diamond-challenge.pooliq']).doc.answer;
    const v1 = TP.diamondVerdict({ rail: 'top', diamond: 3.8 }, ans);
    const v2 = TP.diamondVerdict({ rail: 'top', diamond: 3.6 }, ans);
    const v3 = TP.diamondVerdict({ rail: 'top', diamond: 2.3 }, ans);
    const v4 = TP.diamondVerdict({ rail: 'bottom', diamond: 4 }, ans);
    const v5 = TP.diamondVerdict({ rail: 'top', diamond: 2.3 }, { rail: 'top', diamond: 2.5 });
    assert(v1.verdict === 'pass' && v1.diff === 0.2 && v2.verdict === 'close' && v3.verdict === 'miss' && v3.diff === 1.7 && v4.verdict === 'miss' && !v4.sameRail && v5.diff === 0.2 && v5.verdict === 'pass', 'diamond verdicts: difference in diamonds with pass / close / miss tolerance (2.3 vs 2.5 → 0.2 PASS; other rail → MISS)');
    const tight = TP.diamondVerdict({ rail: 'top', diamond: 3.8 }, { ...ans, tolerance: { pass: 0.1, close: 0.3 } });
    assert(tight.verdict === 'close', 'per-answer tolerance from the file is used');
  }
  // player solution
  {
    const d = V1(ex['demo-player-solution.pooliq']).doc;
    const ch = CV.shotToChallenge(d.shot, { id: 'ps' });
    const fmt = { technique: (t) => t, contact: (v, h) => `${v},${h}`, english: (h) => String(h), speed: (s) => String(s) };
    const right = { technique: coaching.techniqueGroup(ch.technique), vTips: ch.cueContact.vTips, hTips: ch.cueContact.hTips, speed: ch.speed, rails: ch.route?.rails ?? 0 };
    const wrong = { technique: right.technique === 'draw' ? 'follow' : 'draw', vTips: -ch.cueContact.vTips - 1, hTips: 0, speed: ch.speed + 2, rails: 0 };
    const ok = TP.solutionRows(coaching.comparePlan(right, ch, fmt), d.ask, null, d.answer);
    const bad = TP.solutionRows(coaching.comparePlan(wrong, ch, fmt), d.ask, null, d.answer);
    const fields = ok.rows.map((r) => r.field);
    assert(d.challengeType === 'solution' && fields.length === d.ask.length && ok.rows.every((r) => r.verdict === 'match') && bad.rows.some((r) => r.verdict === 'different') && ok.score === ok.max, `player-solution comparison: rows only for what the file asks (${d.ask.join(', ')} → ${fields.join(', ')}), matches vs differences`);
    const dia = V1(ex['demo-diamond-challenge.pooliq']).doc;
    const rr = TP.solutionRows({ rows: [] }, ['rail', 'diamond'], { rail: 'top', diamond: 3.9 }, dia.answer);
    assert(rr.rows.length === 1 && rr.rows[0].field === 'diamond' && rr.rows[0].verdict === 'match', 'rail/diamond answers join the PLAYER CHOICE vs RECOMMENDED table');
  }
  // export → import round trip (lossless)
  {
    const probs = [];
    for (const [f, t] of Object.entries(ex)) {
      const a = V1(t).doc;
      const out = SC.serialize(a);
      const b = V1(out);
      if (!b.ok || !deepEq(a, b.doc)) probs.push(f);
      if (!SC.fileNameFor(a).endsWith('.pooliq')) probs.push(`${f}: file name`);
    }
    assertAll('export → re-import is lossless for every example (serialize → validate → identical document, .pooliq file name)', probs);
    // builder round trip: untouched shot survives the Create Drill builder unchanged
    const bprobs = [];
    for (const f of ['demo-single-drill.pooliq', 'pooliq-drill-template.pooliq', 'demo-diamond-challenge.pooliq', 'demo-player-solution.pooliq']) {
      const d = V1(ex[f]).doc;
      const b = BC.builderFromShot(d.shot, d, d);
      const shot2 = BC.shotFromBuilder(b, null);
      const d2 = { ...clone(d), shot: shot2 };
      const r = V1(JSON.stringify(d2));
      if (!r.ok) { bprobs.push(`${f}: ${errs(r)}`); continue; }
      const A = JSON.stringify(Object.fromEntries(Object.entries(d.shot).sort()));
      const B = JSON.stringify(Object.fromEntries(Object.entries(r.doc.shot).sort()));
      if (A !== B) bprobs.push(`${f}: shot changed\n${A}\n${B}`);
    }
    assertAll('imported shots open in the Create Drill builder and save back unchanged (lossless edit round trip)', bprobs);
    const d = V1(ex['demo-single-drill.pooliq']).doc;
    const b = BC.builderFromShot(d.shot, d, d);
    b.speed = 2; b.balls[0].x = 45; b.instructions = 'Edited in builder';
    b.markers = [{ rail: 'top', diamond: 3.5, label: '3.5', kind: 'reference' }];
    const doc2 = BC.applyRootMeta({ ...clone(d), shot: BC.shotFromBuilder(b, null) }, b);
    const r = V1(SC.serialize(doc2));
    assert(r.ok && r.doc.shot.speed === 2 && r.doc.shot.ballPositions[0].x === 45 && r.doc.shot.instructions === 'Edited in builder' && r.doc.shot.referenceMarkers.length === 1, 'builder edits (SPEED, ball position, instructions, diamond marker) export as a valid .pooliq');
    const sp = BC.snapPathPoint({ x: 30, y: 0.8 }, {});
    const sb = BC.snapPathPoint({ x: 61, y: 25.3 }, { prev: { x: 25, y: 25 }, balls: [{ n: 1, x: 62.5, y: 25 }] });
    assert(sp.rail === 'top' && sp.point.y === SC.BALL_R && sb.contact === 1 && Math.abs(sb.point.x - (62.5 - 2 * SC.BALL_R)) < 0.01, 'builder path drawing snaps to rails (ball centre R from the cushion) and to the ghost-ball contact point');
  }
  // storage safety: vault mirror, snapshots, backup file, restore summary
  {
    assert(V.KEYS.content === 'poolIQContentV1' && V.KEYS.contentProgress === 'poolIQContentProgressV1' && V.DATA_KEYS.includes(ST.CONTENT_KEY) && V.DATA_KEYS.includes(ST.PROGRESS_KEY), 'My Content keys are part of the IndexedDB mirror / snapshot key set');
    store.clear();
    ST.installDoc(V1(ex['demo-lesson.pooliq']).doc, {});
    ST.installDoc(V1(ex['demo-gauntlet.pooliq']).doc, {});
    ST.recordResult(ST.loadContent()[1].uid, { passed: true, score: 500 });
    const bk = V.buildBackup(localStorage, { now: Date.parse('2026-09-25T12:00:00Z') });
    const text = typeof bk === 'string' ? bk : JSON.stringify(bk);
    const parsed = V.parseBackup(text);
    const pk = parsed.keys || {};
    assert(!!pk[ST.CONTENT_KEY] && JSON.parse(pk[ST.CONTENT_KEY]).items.length === 2 && !!pk[ST.PROGRESS_KEY] && parsed.summary.content === 2, `the backup file includes My Content + progress and the restore summary counts it (content ${parsed.summary?.content})`);
    assert(/content/i.test(V.summaryLine(parsed.summary)), `summary line mentions content (${V.summaryLine(parsed.summary)})`);
    let msg = '';
    try { V.parseBackup(ex['demo-single-drill.pooliq']); } catch (e) { msg = e.message; }
    assert(/pooliq|My Content|IMPORT CONTENT/i.test(msg), `restoring a .pooliq file as a backup gives a clear message (${msg})`);
    store.clear();
  }
  // docs, service worker, manifest, isolation (static)
  {
    const md = src('POOLIQ_CONTENT_SCHEMA.md');
    const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]).filter((b) => /"format": "pooliq"/.test(b));
    const bad = blocks.filter((b) => !V1(b).ok);
    assert(blocks.length >= 2 && !bad.length, `schema doc minimal examples validate (${blocks.length} files)`);
    const needed = ['Coordinate system', 'SPEED', 'Target zones', 'Scoring', 'lesson', 'pack', 'Validation', 'Security', 'Versioning', 'Prompt for an AI', 'TL', 'dx', 'careerEligible', 'gauntlet'];
    assert(needed.every((w) => md.includes(w)), 'schema doc covers coordinates, SPEED, zones, scoring, lessons, packs, validation, security, versioning and an AI prompt');
    const sw = src('sw.js');
    const need = ['./POOLIQ_CONTENT_SCHEMA.md', ...exFiles.map((f) => `./examples/${f}`), './js/content/schema.js', './js/content/store.js', './js/content/templates.js', './js/content/convert.js', './js/ui/content.js', './js/ui/builderContent.js', './js/ui/share.js'];
    const miss = need.filter((n) => !sw.includes(`'${n}'`));
    assert(!miss.length, `sw precaches the schema doc, every example and the new modules (${miss.join(', ') || 'all present'})`);
    const man = JSON.parse(src('manifest.json'));
    assert(man.file_handlers?.[0]?.accept?.['application/json']?.includes('.pooliq'), 'manifest registers .pooliq file handling (Chromium installed PWA)');
    const cjs = src('js/ui/content.js');
    const ac = cjs.match(/ACCEPT = '([^']+)'/)[1].split(',');
    assert(['.pooliq', '.json', 'application/json', 'application/octet-stream', 'text/plain'].every((x) => ac.includes(x)), `file picker accept list lets iOS pick .pooliq from Files (${ac.join(', ')})`);
    const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/ctx\.commit/.test(code(cjs)) && !/\beval\s*\(|new Function/.test(cjs + src('js/content/schema.js') + src('js/content/store.js')), 'content screens never commit Career state and nothing evaluates file content');
    const play = src('js/ui/play.js');
    assert(/function saveSession\(next\) \{\s*session = next;\s*if \(C\) return;/.test(play) && /if \(C\) return finishContent\(\);/.test(play), 'play screen content sessions are memory-only (no Career commit on attempts or finish)');
  }
}

// ---------------------------------------------------------------- v11: progression, Drill Rank, friends, profile, DEV MODE
{
  const CFG = await import(js('progression/config.js'));
  const AW = await import(js('progression/award.js'));
  const RK = await import(js('progression/rank.js'));
  const SL = await import(js('progression/skillLevels.js'));
  const CAT = await import(js('progression/catalog.js'));
  const MIG = await import(js('progression/migrate.js'));
  const SES = await import(js('progression/sessions.js'));
  const FM = await import(js('friends/model.js'));
  const TN = await import(js('friends/tournament.js'));
  const PRF = await import(js('profile.js'));
  const DEV = await import(js('dev/dev.js'));
  const OVR = await import(js('dev/overrides.js'));
  const SCH = await import(js('content/schema.js'));
  const VLT = await import(js('vault.js'));
  const fs = await import('fs');
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const fresh = (extra = {}) => ({ ...storage.defaultState(), prog: { ...AW.emptyProg(), v: CFG.PROGRESSION_VERSION, rankSeen: 0 }, ...extra });
  const item = (o = {}) => ({ key: 'test:a', source: 'arcade', name: 'Test item', tier: 'beginner', weights: { draw: 1, position: 0.5 }, primary: 'draw', mode: 'success', mastery: { strong: 0.85, mastered: 0.95 }, rankXpEligible: true, drillRank: false, ...o });
  const DAYMS = 86400000;
  const T0 = Date.parse('2026-01-05T12:00:00Z');

  // career names + ball structure are config-driven and unchanged
  assert(JSON.stringify(CFG.RANK_LADDER.names) === JSON.stringify(storage.RANK_NAMES) && CFG.RANK_LADDER.names[9] === 'Champion', 'v11: Career keeps the existing 10 rank names (Rookie … Champion)');
  assert(CFG.RANK_LADDER.balls.slice(0, 9).every((b, i, a) => b >= 10 && b <= 15 && (i === 0 || b >= a[i - 1])) && CFG.RANK_LADDER.balls[9] === 0, 'v11: ball levels per rank scale up (10 → 15), Champion has none');
  // ball levels from Rank XP
  let st = fresh();
  const per0 = CFG.RANK_LADDER.ballXp[0];
  const full0 = per0 * CFG.RANK_LADDER.balls[0];
  st.prog.rankXpBy = { 0: per0 * 2 + 1 };
  let cs = RK.careerStatus(st);
  assert(cs.ball === 3 && cs.title === 'Rookie · 3-Ball', `v11: ${per0 * 2 + 1} Rank XP in Rookie = ${cs.title}`);
  st.prog.rankXpBy = { 0: full0 - 1 };
  cs = RK.careerStatus(st);
  assert(cs.ball === 5 && cs.gateLocked && !cs.gateLocked.atGate, `v11: ball held at the Rookie Skill Gate (5-Ball) until foundations are passed (ball ${cs.ball})`);
  st.prog.gatesCleared = { 'g-rookie': 1 };
  cs = RK.careerStatus(st);
  assert(cs.ball === 10 && !cs.xpFull, 'v11: clearing the gate releases the ball (10-Ball, XP not yet full)');
  st.prog.rankXpBy = { 0: full0 };
  assert(RK.careerStatus(st).xpFull, 'v11: Rank XP full at the last ball');
  // Rank XP never promotes by itself
  assert(career.syncRank(st).rankIndex === 0, 'v11: full Rank XP alone does not promote');
  // first clear / PB / perfect bonuses
  st = fresh();
  let r = AW.applyAward(st, { item: item(), ratio: 0.8, passed: true, at: T0 });
  const base = CFG.XP.flatSources.includes(item().source) ? CFG.XP.flatDrillBase : CFG.XP.base.beginner; // v14-117: drills use the flat base
  assert(r.award.flags.includes('FIRST CLEAR') && r.award.lifetime === Math.round(base * 0.75 + base * CFG.XP.firstClearBonus), `v11: first clear bonus (${r.award.lifetime} XP)`);
  r = AW.applyAward(r.state, { item: item(), ratio: 0.9, passed: true, at: T0 + 1000 });
  assert(r.award.flags.includes('PERSONAL BEST') && r.award.lifetime === Math.round(base * 0.9 + base * CFG.XP.pbBonus), `v11: personal best bonus (${r.award.lifetime} XP)`);
  r = AW.applyAward(r.state, { item: item(), ratio: 1, passed: true, at: T0 + 2000 });
  assert(r.award.flags.includes('PERFECT') && r.award.stars === 3, 'v11: perfect run flagged, item MASTERED ⭐⭐⭐');
  // anti-farming: mastered repeats + same-day grinding
  const rep = AW.applyAward(r.state, { item: item(), ratio: 1, passed: true, at: T0 + 3000 });
  assert(rep.award.flags.includes('MASTERED REPEAT') && rep.award.rank <= Math.ceil(base * 1.25 * CFG.XP.repeat.mastered * CFG.XP.repeat.sameDayFactor) + 1, `v11: mastered repeat earns little Rank XP (${rep.award.rank})`);
  let s2 = fresh();
  const gains = [];
  for (let i = 0; i < 6; i++) { const x = AW.applyAward(s2, { item: item({ key: 'test:grind' }), ratio: 0.7, passed: true, at: T0 + i * 1000 }); gains.push(x.award.lifetime); s2 = x.state; }
  assert(gains[4] < gains[2] && gains[5] <= gains[4], `v11: same-day repeats beyond ${CFG.XP.repeat.sameDayFree} earn less (${gains.join(',')})`);
  const failed = AW.applyAward(fresh(), { item: item({ key: 'test:fail' }), ratio: 0.95, passed: false, at: T0 });
  assert(failed.award.rank === 0 || failed.award.rank < base, 'v11: a failed session never earns pass-level XP (fail cap)');
  assert(AW.applyAward(fresh(), { item: item({ key: 'test:zero' }), ratio: 0.1, passed: false, at: T0 }).award.lifetime === CFG.XP.participationLifetime, 'v11: very low performance → participation Lifetime XP only');
  // tier caps
  st = fresh();
  st.prog.tierXp = { beginner: CFG.XP.tierCaps.beginner - 5 };
  r = AW.applyAward(st, { item: item({ key: 'test:cap' }), ratio: 0.8, passed: true, at: T0 });
  assert(r.award.rank === 5 && r.award.flags.some((f) => /BEGINNER XP MAXED/.test(f)) && r.award.lifetime > 5, `v11: tier cap limits Rank XP, Lifetime XP still counts (${r.award.rank} rank / ${r.award.lifetime} life)`);
  assert(RK.careerStatus(r.state).tierCaps.find((t) => t.tier === 'beginner').maxed, 'v11: tier shows MAXED');
  const custom = AW.applyAward(fresh(), { item: item({ key: 'drill:c1', source: 'custom', tier: 'pro' }), ratio: 0.8, passed: true, at: T0 });
  assert(custom.state.prog.tierXp.intermediate > 0 && !custom.state.prog.tierXp.pro, 'v11: Create Drill drills count at most as Intermediate for Rank XP');
  // Champion = max rank: Rank XP stops, Lifetime continues
  st = fresh({ rankIndex: 9, rankFloor: 9 });
  cs = RK.careerStatus(st);
  assert(cs.champion && cs.title === 'Champion · MAX RANK' && cs.balls === 0, 'v11: Champion is MAX RANK (no balls)');
  r = AW.applyAward(st, { item: item({ key: 'test:champ', tier: 'pro' }), ratio: 1, passed: true, at: T0 });
  assert(r.award.rank === 0 && r.award.lifetime > 0 && r.award.flags.includes('MAX RANK'), 'v11: at Champion Rank XP stops, Lifetime XP continues');
  assert(RK.promotionStatus(st).champion && RK.championStats(r.state).lifetimeXp === r.state.prog.lifetimeXp, 'v11: Champion stats (replaces "Master stats")');
  // overflow carry into the next rank
  st = fresh();
  st.prog.rankXpBy = { 0: AW.rankTotal(0) - 1 };
  r = AW.applyAward(st, { item: item({ key: 'test:over', tier: 'expert' }), ratio: 1, passed: true, at: T0 });
  assert(r.state.prog.rankXpBy[0] === AW.rankTotal(0) && r.state.prog.carry > 0 && r.state.prog.carry <= Math.round(AW.rankTotal(1) * CFG.XP.overflowCarry), `v11: overflow past full Rank XP carries (capped) into the next rank (${r.state.prog.carry})`);
  const promotedSt = RK.syncProgression({ ...r.state, rankIndex: 1 });
  assert(promotedSt.prog.rankXpBy[1] === r.state.prog.carry && promotedSt.prog.carry === 0 && promotedSt.prog.events[0].flags.includes('PROMOTED'), 'v11: entering the next rank starts with the carried XP');
  // multi-skill XP + skill levels
  st = fresh();
  const lv0 = SL.computeSkillLevels(st, T0);
  const d1 = CAT.stageItem('draw', reg.stageSpecs('draw')[0], 0);
  r = AW.applyAward(st, { item: d1, ratio: 1, passed: true, at: T0 });
  const lv1 = SL.computeSkillLevels(r.state, T0 + 1);
  const trained = Object.keys(d1.weights).filter((k) => d1.weights[k] > 0);
  assert(trained.length >= 2 && trained.every((k) => lv1[k].rating > lv0[k].rating), `v11: one stage raises every skill it trains (${trained.join(', ')})`);
  assert(Object.keys(lv1).length === 12 && lv1.draw.label.startsWith('Rookie') && /\d+$/.test(lv1.draw.label), `v11: skill level shown as "<rank> <ball>" (${lv1.draw.label})`);
  assert(lv1.kicks.label === 'Not rated yet', 'v11: unplayed skills are not rated');
  // mastery thresholds
  assert(AW.masteryStars({ passes: 1, bestPassed: 0.7, m: { strong: 0.85, mastered: 0.95 } }) === 1 && AW.masteryStars({ passes: 1, bestPassed: 0.86, m: { strong: 0.85, mastered: 0.95 } }) === 2 && AW.masteryStars({ passes: 1, bestPassed: 0.95, m: { strong: 0.85, mastered: 0.95 } }) === 3 && AW.masteryStars({ passes: 0, bestPassed: 1 }) === 0, 'v11: mastery PASSED / STRONG / MASTERED thresholds');
  // gates latch
  st = fresh();
  for (const f of CFG.GATES[0].foundations) {
    const it = builtinFor(f.skill);
    st = AW.applyAward(st, { item: it, ratio: 0.8, passed: true, at: T0 }).state;
  }
  st = RK.syncProgression(st);
  assert(!!st.prog.gatesCleared['g-rookie'], 'v11: passing the foundations clears (latches) the Rookie Skill Gate');
  function builtinFor(skill) { return CAT.builtinItems().find((x) => x.source === 'arcade' && x.tier === 'beginner' && (x.weights[skill] || 0) >= CFG.SKILL_LEVEL.foundationWeight); }
  // promotion: every item needed
  st = fresh();
  let ps = RK.promotionStatus(st);
  assert(!ps.unlocked && ps.items.some((x) => x.type === 'xp') && ps.items.some((x) => x.type === 'gate') && ps.items.some((x) => x.type === 'career'), 'v11: Promotion Test checklist = Rank XP + Skill Gates + floors/mastery + existing Career requirements');
  const p5 = CFG.PROMOTION[5];
  assert(p5.floors.core && p5.mastery.strong > 0, 'v11: later promotions need skill floors + mastery counts');
  // .pooliq v11 metadata (optional, backward compatible)
  const doc = { format: 'pooliq', schemaVersion: '1.0', contentType: 'drill', id: 'v11-meta', contentVersion: '1.0', title: 'Meta drill', difficulty: 'advanced', rankXpEligible: true, baseXP: 120, primarySkill: 'draw', secondarySkills: ['position'], mastery: { strong: 0.8, mastered: 0.9 }, shot: { cueBallPosition: { x: 20, y: 25 }, ballPositions: [{ n: 1, x: 50, y: 25 }], targetBall: 1, targetPocket: 'TR', speed: 3 }, scoringRules: { mode: 'success', attempts: 10, pass: { made: 7 } } };
  const vd = SCH.validatePooliq(JSON.stringify(doc));
  assert(vd.ok && vd.doc.difficulty === 6 && vd.doc.baseXP === 120 && vd.doc.primarySkill === 'draw', `v11 .pooliq: tier-word difficulty + progression fields accepted (${vd.errors?.slice(1, 3).join(' | ')})`);
  const ci = CAT.contentItem({ uid: 'cX', doc: vd.doc }, null);
  assert(ci.tier === 'advanced' && ci.baseXP === 120 && ci.weights.draw === 1 && ci.weights.position === 0.5 && ci.rankXpEligible && ci.drillRank && ci.mastery.strong === 0.8, 'v11: imported drill metadata drives tier, base XP, skill weights, mastery');
  assert(!SCH.validatePooliq(JSON.stringify({ ...doc, primarySkill: 'juggling' })).ok, 'v11 .pooliq: unknown skill rejected with an error');
  assert(SCH.validatePooliq(JSON.stringify({ ...doc, rankXpEligible: undefined, baseXP: undefined, primarySkill: undefined, secondarySkills: undefined, mastery: undefined, difficulty: 3 })).ok, 'v11 .pooliq: v10 files without the new fields still validate');
  assert(!CAT.contentItem({ uid: 'cY', doc: { ...vd.doc, rankXpEligible: undefined, careerEligible: undefined } }, null).rankXpEligible, 'v11: installed content is rank-eligible only when marked rankXpEligible / careerEligible');
  // Play Test / preview can never award: the sandbox branch returns before the award hook
  const contentSrc = read('js/ui/content.js');
  const cplay = contentSrc.slice(contentSrc.indexOf('complete(res) {'));
  assert(cplay.indexOf('if (r.sandbox)') >= 0 && cplay.indexOf('if (r.sandbox)') < cplay.indexOf('ctx.awardContent') && !/ctx\.commit\(/.test(contentSrc), 'v11: Play Test / preview never reaches the XP hook (and content.js never commits)');
  // Drill Rank
  assert(CFG.DRILL_RANK.ranks.map((x) => x.name).join('|') === 'BALL BANGER|Grinder|DRILLER|STUDENT OF THE GAME|Precision Player|Drill Sergeant|Drill Master|Drill Legend', 'Drill Rank: 8 ranks in order');
  assert(RK.drillRankStatus(fresh()).number === 1, 'Drill Rank: starts at BALL BANGER');
  assert(CFG.DRILL_RANK.ranks.map((x) => `${x.xp}/${x.passed}/${x.strong}/${x.mastered}/${x.categories}`).join('|') === '0/0/0/0/0|2700/9/0/0/0|9000/18/6/0/0|22500/30/12/3/2|45000/45/21/9/3|81000/60/30/18/4|225000/84/45/30/5|375000/108/66/48/6', 'Drill Rank: passed / strong / mastered counts are x3 (9/0/0 … 108/66/48); XP and skill categories unchanged');
  st = fresh();
  const dItem = (i, tier = 'intermediate') => item({ key: `drill:t${i}`, source: 'drill', tier, drillRank: true, primary: CFG.SKILLS[i % 3].id, weights: { [CFG.SKILLS[i % 3].id]: 1 } });
  let drillsPlayed = 0;
  while (drillsPlayed < 80 && RK.drillRankStatus(st).have.xp < CFG.DRILL_RANK.ranks[1].xp) {
    st = AW.applyAward(st, { item: dItem(drillsPlayed), ratio: 0.8, passed: true, at: T0 + drillsPlayed * DAYMS }).state;
    drillsPlayed += 1;
  }
  const dr1 = RK.drillRankStatus(st);
  assert(dr1.have.passed >= 9 && dr1.have.xp >= CFG.DRILL_RANK.ranks[1].xp && dr1.number === 2 && dr1.name === 'Grinder', `Drill Rank: ${dr1.have.passed} passed drills + ${dr1.have.xp} Drill XP = Grinder`);
  assert(RK.drillRankStatus({ ...st, prog: { ...st.prog, drillXp: 99999 } }).number === 2, 'Drill Rank: XP alone is not enough (needs passed / strong / mastered counts)');
  // anti-farming: mastered drill repeated
  let fs2 = fresh();
  fs2 = AW.applyAward(fs2, { item: dItem(9), ratio: 1, passed: true, at: T0 }).state;
  const farm = [];
  for (let i = 1; i <= 5; i++) { const x = AW.applyAward(fs2, { item: dItem(9), ratio: 1, passed: true, at: T0 + i * DAYMS }); farm.push(x.award.drill); fs2 = x.state; }
  assert(farm.every((x) => x <= Math.ceil(CFG.XP.base.intermediate * 1.25 * CFG.XP.repeat.mastered)), `Drill Rank anti-farming: a mastered drill gives little Drill XP on repeats (${farm.join(',')})`);
  // not affected by Arcade / Ghost / PvP / Play Test
  let ar = AW.applyAward(fresh(), { item: item({ key: 'arcade:x:y' }), ratio: 1, passed: true, at: T0 }).state;
  ar = SES.awardGhost(ar, { id: 'g', balls: 5, race: 5, you: 5, ghost: 1, won: true, date: new Date(T0).toISOString(), log: [] }).state;
  assert(ar.prog.drillXp === 0 && RK.drillRankStatus(ar).have.passed === 0, 'Drill Rank: Arcade stages and Ghost matches never count');
  // v14-37: ghost Career Rank XP only while that ghost task is the one he is on
  const g8 = SES.awardGhost(fresh(), { id: 'e8', mode: 'eight', level: 'beginner', balls: 0, race: 5, you: 5, ghost: 0, won: true, date: new Date(T0).toISOString(), log: [] });
  const g8lv = SL.computeSkillLevels(g8.state, T0 + 60000);
  assert(g8.award.rank === 0 && g8.award.drill === 0 && (g8.state.prog.rankXpBy[0] || 0) === 0 && g8.state.prog.drillXp === 0 && career.syncRank(g8.state).rankIndex === 0, 'v14-37: 8-Ball Ghost adds no Career Rank XP, no Drill XP, and does not promote Career rank');
  assert((g8lv.shotMaking.passesAtTier.beginner || 0) === 0 && g8lv.pattern.played >= 1, 'v14-37: 8-Ball Ghost still trains Pattern Play and does not clear a foundation task');
  const g9early = SES.awardGhost(fresh(), { id: 'n9', balls: 9, race: 9, you: 9, ghost: 0, won: true, date: new Date(T0).toISOString(), log: [] });
  assert(g9early.award.rank === 0 && (g9early.state.prog.rankXpTotal || 0) === 0 && g9early.award.drill === 0, 'v14-37: 9-ball Ghost adds no Career XP before that task is current');
  const on9 = fresh({ rankIndex: 8, rankFloor: 8 });
  const won9 = { id: 'n9b', balls: 9, race: 9, you: 9, ghost: 1, won: true, date: new Date(T0).toISOString(), log: [] };
  const g9 = SES.awardGhost({ ...on9, ghostMatches: [won9] }, won9);
  assert(career.ghostMatchAwardsCareerXp({ ...on9, ghostMatches: [won9] }, won9) && g9.award.rank > 0 && g9.award.drill === 0, `v14-37: 9-ball Ghost awards Career XP only while Defeat the 9-Ball Ghost is the current task (${g9.award.rank})`);
  const eightOn9 = { id: 'e8b', mode: 'eight', level: 'pro', balls: 0, race: 9, you: 9, ghost: 0, won: true, date: new Date(T0).toISOString(), log: [] };
  assert(SES.awardGhost({ ...on9, ghostMatches: [eightOn9] }, eightOn9).award.rank === 0, 'v14-37: 8-Ball Ghost still adds no Career XP when a later ghost task is current');
  const won9b = { id: 'n9c', balls: 9, race: 9, you: 9, ghost: 0, won: true, date: new Date(T0 + 1000).toISOString(), log: [] };
  const again = SES.awardGhost({ ...g9.state, ghostMatches: [won9, won9b] }, won9b);
  assert(again.award.rank === 0 && engine.ghostBeaten({ ghostMatches: [won9] }, 9, 9), 'v14-37: after that ghost task is met, more ghost play adds no Career XP; the earlier win still completes it');
  assert(career.RANK_REQUIREMENTS.some((r) => r.requirements.some((q) => q.type === 'ghost' && q.balls === 9 && q.race === 9)) && CFG.GATES.some((g) => g.id === 'g-rookie' && g.foundations.length >= 6), 'v14-37: existing ghost tasks and foundation gates stay');
  const friendsSrc = ['js/friends/model.js', 'js/friends/tournament.js', 'js/ui/friends.js'].map(read).join('\n');
  assert(!/progression\/(award|sessions|migrate)\.js|ctx\.commit|poolIQStateV4/.test(friendsSrc), 'PvP code never imports XP/award code or writes training state (Career / Drill Rank / skills untouched)');
  // migration: idempotent, never demotes
  const legacy = { ...storage.defaultState(), rankIndex: 3, rankFloor: 3, xp: 4200 };
  const lg = { ...legacy.games, landing: { stages: { 'lz-1': { passed: true, bestStars: 3, tries: 2, history: [{ date: '2025-10-01T10:00:00Z', passed: true, stars: 3, score: 900 }, { date: '2025-10-02T10:00:00Z', passed: false, stars: 0, score: 100 }] } }, pb: {}, sessions: [] } };
  const m1 = MIG.migrateProgression({ ...legacy, games: lg });
  assert(MIG.needsMigration({ ...legacy }) && !MIG.needsMigration(m1), 'migration: needed once, then done');
  assert(MIG.migrateProgression(m1) === m1, 'migration: idempotent (second run is a no-op)');
  assert(career.syncRank(m1).rankIndex === 3 && m1.prog.rankXpBy[0] === AW.rankTotal(0) && m1.prog.rankXpBy[2] === AW.rankTotal(2) && m1.prog.rankSeen === 3, 'migration: never demotes — lower ranks full, current rank kept');
  assert(m1.prog.lifetimeXp >= 4200 && m1.prog.legacyXp === 4200 && m1.prog.items['arcade:landing:lz-1']?.passes === 1, 'migration: Lifetime XP ≥ old XP, history replayed into mastery');
  // friends: players, H2H, stats
  let fd = FM.emptyFriends();
  for (const n of ['Ann', 'Bob', 'Cat', 'Dan', 'Eve']) fd = FM.addPlayer(fd, n).d;
  assert(FM.addPlayer(fd, 'ann').error, 'friends: duplicate names rejected');
  const [A, B, C, Dd, E] = fd.players.map((p) => p.id);
  let mm = FM.newMatch({ a: A, b: B, raceTo: 3 });
  for (const w of [A, B, A, B, A]) mm = FM.rackWon(mm, w);
  assert(mm.status === 'final' && mm.winner === A && FM.isHillHill(mm), 'friends: live scoring ends at the race, hill-hill detected');
  mm = FM.bumpStat(mm, A, 'breakAndRuns');
  fd = FM.saveMatch(fd, mm);
  const q = FM.finalScore(FM.newMatch({ a: B, b: A, raceTo: 3 }), 3, 1);
  fd = FM.saveMatch(fd, q.m);
  assert(FM.finalScore(FM.newMatch({ a: A, b: B, raceTo: 3 }), 4, 1).error && FM.finalScore(FM.newMatch({ a: A, b: B, raceTo: 3 }), 2, 2).error, 'friends: final score must have a winner who reached the race');
  const h = FM.headToHead(fd, A, B);
  assert(h.matches === 2 && h.winsA === 1 && h.winsB === 1 && h.hillHill === 1 && h.stats[A].breakAndRuns === 1, 'friends: head-to-head record + advanced stats');
  const psA = FM.playerStats(fd, A);
  assert(psA.wins === 1 && psA.losses === 1 && psA.winPct === 50 && psA.streakType === 'L', 'friends: player stats (record, win %, streak)');
  fd = FM.removePlayer(fd, A);
  assert(fd.players.find((p) => p.id === A).archived && FM.headToHead(fd, A, B).matches === 2, 'friends: removing a player with history archives them (history kept)');
  // group session
  let gs = FM.newSession(fd, { playerIds: [B, C, Dd], raceTo: 3 });
  assert(!FM.newSession(fd, { playerIds: [B, C] }).session, 'group session: needs 3+ players');
  fd = gs.d;
  const gm = FM.finalScore(FM.newMatch({ a: B, b: C, raceTo: 3, sessionId: gs.session.id }), 3, 0).m;
  fd = FM.saveMatch(fd, gm);
  const sum = FM.sessionSummary(fd, gs.session.id);
  assert(sum.table[B].wins === 1 && sum.next && !(sum.next.includes(B) && sum.next.includes(C)), 'group session: table + next pairing suggests players who have not met');
  // tournaments: single elimination seeding + byes + auto-advance
  assert(JSON.stringify(TN.seedOrder(8)) === '[1,8,4,5,2,7,3,6]', 'tournament: standard bracket seed order');
  let tr = TN.createTournament(fd, { format: 'single', playerIds: [B, C, Dd, E, A].filter((x) => x !== A), raceTo: 3 });
  let tt = tr.tournament;
  assert(tt.matches.filter((m) => m.round === 1).length === 2 && tt.matches.length === 3, 'tournament: 4 players → 2 semis + final');
  tr = TN.createTournament(fd, { format: 'single', playerIds: [B, C, Dd], raceTo: 3 });
  tt = tr.tournament;
  const byeM = tt.matches.find((m) => m.bye);
  assert(byeM && byeM.winner === B && tt.matches.find((m) => m.round === 2).a === B, 'tournament: top seed gets the bye and auto-advances');
  let td = tr.d;
  for (const m of TN.playableMatches(tt)) { const x = TN.recordResult(td, tt.id, m.id, 3, 1); td = x.d; tt = x.tournament; }
  for (const m of TN.playableMatches(tt)) { const x = TN.recordResult(td, tt.id, m.id, 1, 3); td = x.d; tt = x.tournament; }
  assert(tt.status === 'complete' && tt.championId && td.matches.filter((m) => m.tournamentId === tt.id).length === 2, 'tournament: winners advance, champion crowned, results are normal match records');
  assert(TN.clearResult(td, tt.id, tt.matches.find((m) => m.round === 1 && !m.bye).id).error, 'tournament: a result cannot be cleared once the next round is played');
  // round robin: everyone once, BYE for odd counts, tiebreakers
  tr = TN.createTournament(fd, { format: 'roundrobin', playerIds: [B, C, Dd], raceTo: 3 });
  tt = tr.tournament;
  const pairs = new Set(tt.matches.map((m) => [m.a, m.b].sort().join(':')));
  assert(tt.matches.length === 3 && pairs.size === 3 && Math.max(...tt.matches.map((m) => m.round)) === 3, 'round robin: 3 players → 3 rounds, everyone plays everyone once (BYE rotates)');
  td = tr.d;
  const res = { [`${B}:${C}`]: [3, 0], [`${C}:${Dd}`]: [3, 1], [`${B}:${Dd}`]: [2, 3] };
  for (const m of tt.matches) { const k = `${m.a}:${m.b}`; const kr = `${m.b}:${m.a}`; const sc = res[k] || (res[kr] ? [res[kr][1], res[kr][0]] : [3, 0]); const x = TN.recordResult(td, tt.id, m.id, sc[0], sc[1]); td = x.d; tt = x.tournament; }
  const stn = TN.standings(tt, { [B]: 'Bob', [C]: 'Cat', [Dd]: 'Dan' });
  assert(stn.every((x) => x.wins === 1) && stn[0].id === B && stn[0].diff === 2, `round robin: 3-way tie broken by head-to-head then rack difference (${stn.map((x) => x.id === B ? 'Bob' : x.id === C ? 'Cat' : 'Dan').join(' > ')})`);
  assert(tt.status === 'complete' && tt.championId === B, 'round robin: winner decided when all matches are in');
  assert(JSON.stringify(CFG.PVP.tiebreakers) === JSON.stringify(['wins', 'headToHead', 'gameDiff', 'gamesWon', 'name']), 'round robin: documented tiebreaker order');
  // local profile
  store.clear();
  const pr = PRF.getProfile();
  assert(/^[0-9a-f-]{36}$/.test(pr.id) && pr.createdAt && pr.updatedAt && PRF.getProfile().id === pr.id, 'profile: stable UUID created once');
  const up = PRF.updateProfile({ displayName: '  Andrew <b>  ' }, pr.updatedAt + 5);
  assert(up.profile.displayName === 'Andrew b' && up.profile.updatedAt === pr.updatedAt + 5, 'profile: name cleaned, updatedAt bumps');
  assert(PRF.updateProfile({ avatar: 'javascript:alert(1)' }).error && PRF.updateProfile({ avatar: 'data:image/png;base64,' + 'A'.repeat(100 * 1024) }).error, 'profile: unsafe / oversized photo rejected');
  assert(!PRF.updateProfile({ avatar: 'data:image/webp;base64,UklGRg==' }).error && PRF.getProfile().avatar.startsWith('data:image/webp'), 'profile: small image data URL accepted');
  const pub = PRF.publicStats(m1, PRF.getProfile(), T0);
  assert(pub.format === 'pool-iq-public-stats' && pub.profileId === pr.id && pub.career.rankIndex === 3 && pub.career.ball != null && Object.keys(pub.skills).length === 12 && pub.drillRank.number >= 1 && pub.devSeeded === false && !('friends' in pub), 'profile: publicStats() is a clean exportable summary (training only, no PvP)');
  // DEV MODE: the owner account is already the dev. A passcode cannot unlock.
  store.clear();
  const CL = await import(js('cloud/client.js'));
  CL.setCurrentUserForTests(null);
  assert(!DEV.hasPasscode() && (await DEV.unlock('1234')).error && !DEV.isUnlocked(), 'dev: a passcode cannot unlock');
  assert((await DEV.setPasscode('12')).error && (await DEV.setPasscode('cue-9ball')).error && !DEV.isUnlocked(), 'dev: there is no passcode to set');
  assert(DEV.isOwnerEmail('andrewaphay@gmail.com') && DEV.isOwnerEmail(' AndrewAphay@gmail.com ') && !DEV.isOwnerEmail('friend@example.com') && !DEV.ownerAccountSignedIn(), 'dev: owner account is recognized; any other account is not');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'AndrewAphay@gmail.com' });
  assert(DEV.ownerAccountSignedIn() && DEV.isUnlocked(), 'dev: the signed-in owner account is already unlocked');
  DEV.lock();
  assert(DEV.isUnlocked(), 'dev: there is no lock step while the owner account is signed in');
  CL.setCurrentUserForTests({ id: 'friend-1', email: 'friend@example.com' });
  assert(!DEV.ownerAccountSignedIn() && !DEV.isUnlocked() && (await DEV.unlock('cue-9ball')).error, 'dev: another account stays locked with no passcode');
  CL.setCurrentUserForTests(null);
  assert(!DEV.isUnlocked(), 'dev: signed-out stays locked');
  store.set(DEV.DEV_KEY, JSON.stringify({ schema: 1, autoLockMin: 15, salt: null, hash: null }));
  const devRec = JSON.parse(store.get(DEV.DEV_KEY));
  // overrides: applied, source untouched, reset
  const orig = reg.getStage('landing', 'lz-1');
  const origCue = JSON.stringify(orig.cueBallPosition);
  const odoc = DEV.editDocForStage(orig, null);
  assert(SCH.validatePooliq(JSON.stringify(odoc)).ok, 'dev: built-in stage converts to a valid .pooliq doc for the builder');
  odoc.title = 'DEV lz-1'; odoc.shot.cueBallPosition = { x: 12, y: 12 };
  assert(OVR.setOverride(OVR.stageOverrideId('landing', 'lz-1'), odoc).ok, 'dev: override saved in its own key');
  reg.clearStageCache('landing');
  const ov1 = reg.getStage('landing', 'lz-1');
  assert(ov1.name === 'DEV lz-1' && ov1.cueBallPosition.x === 12 && ov1.devOverride && ov1.id === 'lz-1' && ov1.unlocks.length === 1 && reg.stageSpecs('landing')[0].name !== 'DEV lz-1', 'dev: override applied when the stage is built (source definitions untouched)');
  const pack = DEV.exportOverridesPack();
  assert(pack.count === 1 && pack.doc.contentType === 'pack' && pack.doc.stages[0].id === 'ov--landing--lz-1' && SCH.validatePooliq(JSON.stringify(pack.doc)).ok, 'dev: overrides export as a valid .pooliq pack');
  OVR.removeOverride(OVR.stageOverrideId('landing', 'lz-1'));
  reg.clearStageCache('landing');
  assert(JSON.stringify(reg.getStage('landing', 'lz-1').cueBallPosition) === origCue && !reg.getStage('landing', 'lz-1').devOverride, 'dev: RESET TO ORIGINAL restores the built-in stage');
  const imp = DEV.importOverridesPack(JSON.stringify(pack.doc), { stageExists: (g, s2) => !!reg.stageSpecs(g).find((x) => x.id === s2) });
  reg.clearStageCache('landing');
  assert(imp.applied === 1 && reg.getStage('landing', 'lz-1').name === 'DEV lz-1', 'dev: overrides pack re-imports');
  OVR.removeOverride(OVR.stageOverrideId('landing', 'lz-1')); reg.clearStageCache();
  const kickSpec = reg.stageSpecs('kick')[0];
  assert(!OVR.isEditableSpec(reg.stageSpecs('train')[0], 'train') && OVR.isEditableSpec(kickSpec, kickSpec.kind || 'kick'), 'dev: only single-shot stages are editable');
  const marked = DEV.markContentDoc(vd.doc, { careerEligible: true, official: true });
  assert(marked.careerEligible && marked.metadata.official && SCH.validatePooliq(JSON.stringify(marked)).ok, 'dev: mark imported content official / career-eligible (still valid)');
  // seeded test state: flagged, excluded, restorable
  const real = m1;
  const seeded = DEV.seedProgression(real, { rank: 9 });
  assert(seeded.rankIndex === 9 && career.syncRank(seeded).rankIndex === 9 && seeded.devSeed && seeded.prog.dev && real.rankIndex === 3 && !real.devSeed, 'dev: seeded Champion test state (flagged DEV, real state untouched)');
  assert(PRF.publicStats(seeded).devSeeded === true, 'dev: seeded states are flagged in public stats (never synced)');
  const seededDR = DEV.seedProgression(real, { drillRank: 5 });
  assert(RK.drillRankStatus(seededDR).number === 5, 'dev: seed Drill Rank 5 → Precision Player');
  const seed7 = DEV.seedProgression(real, { rank: 4, ball: 7 });
  assert(RK.careerStatus(seed7).ball === 7 && RK.careerStatus(seed7).rankIndex === 4, 'dev: seed Career rank + ball');
  // vault stash + snapshot restore round trip (memory IndexedDB)
  const mem = new Map();
  const idb = { get: async (k) => mem.get(k), put: async (k, v) => { mem.set(k, v); }, del: async (k) => { mem.delete(k); } };
  store.clear();
  store.set(VLT.KEYS.state, JSON.stringify(real));
  store.set(VLT.KEYS.dev, JSON.stringify(devRec));
  globalThis.localStorage.key = (i) => [...store.keys()][i];
  const vt = VLT.createVault({ kv: globalThis.localStorage, idb, debounceMs: 0 });
  await vt.putStash('dev-real', VLT.localBundle(globalThis.localStorage));
  store.set(VLT.KEYS.state, JSON.stringify(seeded));
  const stash = await vt.getStash('dev-real');
  await vt.replaceAll({ ...stash.keys }, 'Before DEV restore real progress');
  assert(JSON.parse(store.get(VLT.KEYS.state)).rankIndex === 3 && !JSON.parse(store.get(VLT.KEYS.state)).devSeed && store.get(VLT.KEYS.dev), 'dev: RESTORE MY REAL PROGRESS brings the stashed real data back (dev settings kept)');
  const snaps = await vt.snapshots();
  assert(snaps[0] && snaps[0].reason === 'Before DEV restore real progress' && JSON.parse(snaps[0].keys[VLT.KEYS.state]).devSeed, 'dev: the test state is snapshotted before the restore');
  // vault: new keys mirrored / backed up, old backups still restore
  for (const k of ['poolIQFriendsV1', 'poolIQProfileV1', 'poolIQDevV1', 'poolIQDevOverridesV1']) assert(VLT.DATA_KEYS.includes(k), `vault: ${k} is mirrored, snapshotted and backed up`);
  const oldBackup = { format: 'pool-iq-backup', schema: 1, appVersion: '10', exportedAt: '2026-06-01T00:00:00Z', keys: { poolIQStateV4: storage.defaultState(), poolIQCustomDrillsV1: { drills: [] } } };
  const pb = VLT.parseBackup(JSON.stringify(oldBackup));
  assert(pb.keys.poolIQStateV4 && !pb.keys.poolIQFriendsV1 && pb.appVersion === '10', 'vault: v10 backups (without v11 keys) still restore');
  const newBackup = { ...oldBackup, appVersion: '11', keys: { ...oldBackup.keys, poolIQFriendsV1: fd, poolIQProfileV1: PRF.defaultProfile(), poolIQDevOverridesV1: { schema: 1, items: {} } } };
  const pb2 = VLT.parseBackup(JSON.stringify(newBackup));
  assert(pb2.keys.poolIQFriendsV1 && pb2.summary.pvp === fd.matches.length && pb2.summary.friends > 0, 'vault: v11 backup summary counts friends + friend matches');
  assert(!VLT.parseBackup(JSON.stringify({ ...newBackup, keys: { ...newBackup.keys, poolIQFriendsV1: { nope: 1 } } })).keys.poolIQFriendsV1, 'vault: a damaged friends key is dropped (rest restores)');
  assert(VLT.APP_VERSION === '14', 'vault: APP_VERSION is 14');
  // docs exist
  for (const f of ['docs/RANKING_AND_XP.md', 'docs/SKILL_GATES_AND_PROMOTIONS.md', 'docs/FRIENDS_AND_TOURNAMENTS.md', 'docs/DEV_MODE.md']) assert(fs.existsSync(path.join(root, f)), `doc present: ${f}`);
  store.clear();
}

// ---------------------------------------------------------------- v11.1: speed scale, mini diagram, tip clock, preview, Three-Lane drill, Table Games
{
  const fsm = (await import('fs')).default;
  const P = await import(js('sim/physics.js'));
  const PV = await import(js('sim/preview.js'));
  const SD = await import(js('games/speedDiagram.js'));
  const RK = await import(js('progression/rank.js'));
  const LAY = await import(js('sim/layouts.js'));
  const { geometryProblems } = await import(pathToFileURL(path.join(root, 'scripts', 'geometryCheck.mjs')).href);
  const src = (f) => fsm.readFileSync(path.join(root, f), 'utf8');

  // speed meanings: one plain meaning per quarter step, stop diamond counted from your end rail
  const T = Object.fromEntries(speed.speedTable().map((r) => [r.label, r.text]));
  assert(Object.keys(T).length === 20 && T['0.25'] && T['5.00'], 'speed table: 20 quarter steps 0.25 … 5.00');
  assert(T['1.50'] === 'Up to the far rail and back. Stops on the 3rd diamond from your end, just past the side pockets on the way back to you', `SPEED 1.50 meaning: 3rd diamond from your end, just past the side pockets on the way back ("${T['1.50']}")`);
  assert(T['1.25'] === 'Up to the far rail and back. Stops on the 5th diamond from your end, just before it reaches the side pockets', `SPEED 1.25 meaning: 5th diamond, just before it reaches the side pockets ("${T['1.25']}")`);
  assert(/out again\. Stops on the 5th diamond from your end, just past the side pockets$/.test(T['2.50']) && /up and back again\. Stops on the 7th diamond from your end, 1 diamond off the far rail$/.test(T['3.00']) && /Stops on the 1st diamond from your end, right back on the start spot$/.test(T['2.00']), 'SPEED 2.00 / 2.50 / 3.00 meanings (1st / 5th / 7th diamond from your end)');
  const wordProbs = [];
  for (const sp of speed.SPEED_STEPS) {
    const t = T[speed.formatSpeed(sp)];
    const pth = speed.speedPath(sp);
    const m = /^[^.]+\. Stops on the ([1-7])(st|nd|rd|th) diamond from your end(, [^.]+)?$/.exec(t);
    const svgS = SD.speedDiagramSVG(sp);
    if (!m) { wordProbs.push(`${sp}: "${t}" does not name the stop diamond`); continue; }
    if (Number(m[1]) !== pth.diamond) wordProbs.push(`${sp}: text says diamond ${m[1]}, rule says ${pth.diamond}`);
    if (!svgS.includes(`data-stop-diamond="${pth.diamond}"`) || !svgS.includes(`STOP · ${m[1]}${m[2]} diamond`) || !svgS.includes(`sm-dnum sm-dnum-stop" x="${pth.diamond * 12.5}"`)) wordProbs.push(`${sp}: mini diagram STOP marker is not on diamond ${m[1]}`);
    const g = SD.speedDiagramGeometry(sp);
    if (Math.abs(g.end.x - pth.diamond * 12.5) > 1.2) wordProbs.push(`${sp}: STOP ring at x ${g.end.x}`);
    if (t.length > 130) wordProbs.push(`${sp}: too long (${t.length})`);
    if (/reaches the side pockets/.test(t) && !((pth.diamond === 3 && pth.outward) || (pth.diamond === 5 && !pth.outward))) wordProbs.push(`${sp}: "before it reaches the side pockets" used for the wrong side`);
    if (/just past the side pockets/.test(t) && !((pth.diamond === 5 && pth.outward) || (pth.diamond === 3 && !pth.outward))) wordProbs.push(`${sp}: "just past the side pockets" used for the wrong side`);
  }
  assertAll('every speed meaning names its stop diamond from your end, matches the mini diagram STOP marker, and says before / past the side pockets the right way for the direction of travel', wordProbs);
  assert(new Set(Object.values(T)).size === 20, 'every speed meaning is unique');
  assert(speed.SPEED_STEPS.every((s) => { const p = speed.speedPath(s); return Math.abs(p.diamond - Math.round(p.diamond)) < 1e-9 && Math.round(p.diamond) % 2 === 1; }), 'from the first diamond every quarter step stops on an odd diamond (1, 3, 5, 7)');
  assert(Math.abs(speed.travelFromStop(2, 3) - 1.5) < 1e-9 && speed.lagEndpoint(1.5).diamond === 3 && speed.lagEndpoint(1.5).leg === 2, 'calibration helpers measure from the start spot (pass 2, diamond 3 = 1.50 lengths)');
  // simulator: SPEED n = n lengths of total travel from the start spot, and the stop matches the meaning
  const simStop = (s) => P.simulate([{ id: 'cue', x: 12.5, y: 25 }], { aim: 0, speed: s }, { record: false, maxTime: 60 }).final[0].x / 12.5;
  const simErr = speed.SPEED_STEPS.filter((s) => s >= 0.5).map((s) => [s, simStop(s), speed.speedPath(s).diamond]).filter(([, a, b]) => Math.abs(a - b) > 0.15);
  assertAll('simulator lag from the first diamond stops on the diamond the speed meaning names (every quarter step 0.50–5.00, ±0.15 diamond)', simErr.map(([s, a, b]) => `SPEED ${s}: sim ${a.toFixed(2)} vs rule ${b}`));
  assert(Math.abs(simStop(1.5) - 3) < 0.15 && Math.abs(simStop(2.5) - 5) < 0.15 && Math.abs(simStop(3) - 7) < 0.15, `simulator: SPEED 1.50 → 3rd diamond (${simStop(1.5).toFixed(2)}), 2.50 → 5th (${simStop(2.5).toFixed(2)}), 3.00 → 7th (${simStop(3).toFixed(2)})`);
  // lag builder agrees with the simulator / rule
  const lagProbs = [];
  for (const st of reg.getStages('speed').filter((x) => x.kind === 'lag' && x.id !== 'sp-6')) {
    const end = st.cueBallPath[st.cueBallPath.length - 1];
    if (Math.abs(end.x / 12.5 - speed.speedPath(st.speed, st.cueBallPosition.x / 12.5).diamond) > 0.15) lagProbs.push(`${st.id}: stop ${end.x}`);
    if (st.cueBallPosition.x !== 12.5) lagProbs.push(`${st.id}: starts at x=${st.cueBallPosition.x}, not the first diamond`);
  }
  assertAll('Speed Ladder lags start on the first diamond and their stop zones sit where the speed rule says (±0.15 diamond; lanes are angled slightly)', lagProbs);
  assert(/Back to the 3rd Diamond/.test(reg.getStage('speed', 'sp-2').name) && /Far Rail Again/.test(reg.getStage('speed', 'sp-5').name) && reg.getStage('speed', 'sp-2').instructions.includes(speed.speedMeaning(1.5)), 'Speed Ladder stage names and texts follow the new meanings (1.50 — Back to the 3rd Diamond)');
  // quarter steps everywhere speed is chosen
  const allSpeeds = [...reg.allStages(), ...reg.getBosses().flatMap((b) => b.shots.map((x) => x.challenge))].filter((c) => c && typeof c.speed === 'number').map((c) => c.speed);
  assert(allSpeeds.every((v) => Math.abs(v * 4 - Math.round(v * 4)) < 1e-9) && allSpeeds.some((v) => v % 0.5 !== 0), 'recipe speeds use quarter steps (some stages now call for x.25 / x.75)');
  assert(allSpeeds.every((v) => coaching.SPEED_CHOICES.includes(v)) && coaching.SPEED_CHOICES.length === 19, 'coaching planner offers every quarter step 0.50–5.00, so every recipe speed can be answered exactly');
  // saved calibration from before v11.1 keeps working
  const oldCal = { tableSize: 9, cloth: 'normal', results: { '2.0': [{ actual: 1.7, date: '2026-01-01' }], '1.5': [{ actual: 1.5, date: '2026-01-01' }] }, factors: { '2.0': 1.18, '1.5': 1 }, updatedAt: '2026-01-01' };
  assert(speed.personalFactor(oldCal, 2) === 1.18 && speed.calLookup(oldCal.results, 2).length === 1 && /short/.test(speed.calibrationAdvice(oldCal, 2)), 'old calibration keys ("2.0") still drive the personal factor and advice');
  const c2 = speed.recordCalibration(oldCal, 2, 1.9);
  const c3 = speed.recordCalibration(c2, 1.25, 1.2);
  assert(c2.results['2.0'].length === 2 && !c2.results['2.00'] && c3.results['1.25'].length === 1 && c3.factors['1.25'] > 1, 'new calibration shots append to the old key; quarter steps get their own key');
  // mini diagram
  const d15 = SD.speedDiagramSVG(1.5);
  const d7 = SD.speedDiagramSVG(7);
  assert(/data-rails="1"/.test(d15) && /data-stop-diamond="3"/.test(d15) && (d15.match(/class="sm-turn"/g) || []).length === 1 && /STOP · 3rd diamond/.test(d15) && /START/.test(d15), 'mini diagram: SPEED 1.50 draws 1 numbered turn and STOP · 3rd diamond');
  assert(/data-rails="7"/.test(d7) && (d7.match(/class="sm-turn"/g) || []).length === 7, 'mini diagram: SPEED 7.00 draws 7 numbered turns');
  const lz = reg.getStage('landing', 'lz-1');
  const card = recipe.recipeCardHTML(lz);
  assert(/data-speed-diagram="/.test(card) && card.includes(recipe.esc(speed.speedMeaning(lz.speed))), 'Shot Recipe speed row: plain meaning + mini-table diagram');
  const dial = recipe.speedDialSVG(2);
  assert((dial.match(/class="sd-tick/g) || []).length === 19 && (dial.match(/sd-tick major/g) || []).length === 5, `speed dial ticks every 0.25 (19 ticks, 5 major)`);
  assert(recipe.speedChip(1.25).includes(`title="${speed.speedMeaning(1.25)}"`) && recipe.speedChip(1.25).includes('SPEED 1.25'), 'SPEED chip tooltip is the same plain meaning as the speed table');
  // tip clock (Andrew's tipClockLabel reused)
  assert(recipe.tipClockLabel(1, 1, { oclock: true }) === "1:30 o'clock" && recipe.tipClockLabel(0, 0, { oclock: true }) === 'Center' && recipe.tipClockLabel(-1, 0, { oclock: true }) === "6:00 o'clock", "tip clock: 1:30 o'clock / Center / 6:00 o'clock");
  const ghTip = recipe.recipeGaugesHTML({ ...lz, cueContact: { vTips: 1, hTips: 1 } }).replace(/\s+/g, ' ');
  assert(/<b> Top Right <\/b> <small class="tipClock" data-tip-clock>1:30 o(&#39;|')clock<\/small>/.test(ghTip), 'Shot Recipe tip gauge: clock reading right under the tip text');
  assert(/Cue-ball contact<\/span><b>[^<]*<small class="tipClock" data-tip-clock>/.test(recipe.recipeCardHTML(lz)), 'Shot Recipe card: clock reading under the cue-ball contact text');
  // tip picker pop-up helpers (pure): miscue limit, quarter grid, offsets text, quarter-tip wording
  const TP = await import(js('ui/tipPicker.js'));
  const TX = await import(js('games/text.js'));
  const lim = [[3, 3], [-3, 0.2], [0.4, -2.2], [1.5, 1.5], [0, 0]].map(([v, h]) => TP.snapTips(v, h));
  assert(lim.every((t) => Math.hypot(t.vTips, t.hTips) <= TP.MISCUE_LIMIT_TIPS + 1e-9 && Math.abs(t.vTips * 4 - Math.round(t.vTips * 4)) < 1e-9 && Math.abs(t.hTips * 4 - Math.round(t.hTips * 4)) < 1e-9), `tip picker: values stay inside the 1½-tip miscue limit on a ¼-tip grid (${lim.map((t) => `${t.vTips},${t.hTips}`).join(' ')})`);
  assert(TP.snapTips(0.1, 2, { maxH: 1 }).hTips === 1 && TP.snapTips(1, 1).vTips === 1 && TP.snapTips(1, 1).hTips === 1, 'tip picker: per-axis limit (drill builder side spin ±1) and exact 1·1 top-right');
  assert(TP.tipOffsetText(1, -0.25) === '↑ 1 · ← 0.25 tips' && TP.tipOffsetText(0, 0) === 'Offset 0 · 0 tips', 'tip picker: offsets text');
  assert(TX.fracTips(0.25) === '¼' && TX.fracTips(0.5) === '½' && TX.fracTips(1.25) === '1¼' && TX.fracTips(1.5) === '1½' && TX.contactText(0.05, 0) === 'Center ball' && TX.contactText(-0.75, 0.25) === '¾ tip below center, ¼ tip right', 'quarter tips read as ¼ / ¾ (not rounded up to ½)');
  // full-path preview = the real shot
  const cases = [
    { name: 'SPEED 7 into a rail (multi-rail kick)', lay: [{ id: 'cue', x: 25, y: 25 }, { id: 1, x: 62.5, y: 18.75 }], shot: { aim: 60, speed: 7 } },
    { name: 'SPEED 4 with right english off two rails', lay: [{ id: 'cue', x: 20, y: 40 }], shot: { aim: 30, speed: 4, hTips: 1, vTips: 0.5 } },
    { name: 'cut into a pocket with draw', lay: [{ id: 'cue', x: 30, y: 30 }, { id: 1, x: 80, y: 12 }], shot: { speed: 2.5, vTips: -1 } },
    { name: '9-ball break at SPEED 6', lay: LAY.rackLayout(9, 3), shot: { aim: 0, speed: 6 } }
  ];
  cases[2].shot.aim = P.ghostAim(cases[2].lay[0], cases[2].lay[1], 'TR').aim;
  const pvProbs = [];
  let multi = null;
  let potted = null;
  for (const c of cases) {
    const shot = { vTips: 0, hTips: 0, ...c.shot };
    shot.V = P.speedToV0(shot.speed);
    const pv = PV.runPreview(c.lay, shot);
    const real = P.simulate(c.lay, { aim: shot.aim, V: shot.V, vTips: shot.vTips, hTips: shot.hTips }, { maxTime: 40 }); // what SHOOT runs
    const paths = PV.previewPaths(pv);
    if (pv.truncated) pvProbs.push(`${c.name}: preview hit the step cap`);
    for (const b of real.final) {
      const p = paths.find((x) => String(x.id) === String(b.id));
      const q = pv.final.find((x) => String(x.id) === String(b.id));
      if (Math.abs(q.x - b.x) > 1e-9 || Math.abs(q.y - b.y) > 1e-9 || q.pocket !== b.pocket) pvProbs.push(`${c.name}: ball ${b.id} preview ${q.x},${q.y} vs shot ${b.x},${b.y}`);
      if (p && (p.end.type === 'pocket' ? p.end.pocket !== b.pocket : Math.hypot(p.end.x - b.x, p.end.y - b.y) > 1e-9)) pvProbs.push(`${c.name}: drawn end of ${b.id} differs from the shot`);
      const l0 = c.lay.find((l) => String(l.id) === String(b.id));
      if (!p && (b.pocket || Math.hypot(b.x - l0.x, b.y - l0.y) > 0.05)) pvProbs.push(`${c.name}: moving ball ${b.id} has no preview path`);
    }
    if (c.name.startsWith('SPEED 7')) multi = paths.find((x) => x.role === 'cue');
    if (c.name.startsWith('cut')) potted = paths.find((x) => x.id === 1);
  }
  assertAll('full-path preview: final positions and pockets match the real SHOOT result exactly (4 layouts incl. SPEED 7 and a break)', pvProbs);
  assert(multi && multi.rails.length >= 3 && multi.rails.every((r, i) => r.n === i + 1), `SPEED 7 toward a rail: preview shows ${multi?.rails.length} numbered rail contacts (≥ 3)`);
  const svg7 = PV.previewSVG(PV.previewPaths(PV.runPreview(cases[0].lay, { aim: 60, V: P.speedToV0(7) })));
  assert((svg7.match(/class="pv-rail pv-rail-cue"/g) || []).length >= 3 && /data-end="(pocket|stop)"/.test(svg7) && /data-tag="(POCKET|SCRATCH|STOP)"/.test(svg7) && /pv-path pv-cue/.test(svg7), 'preview SVG: cue path, numbered rail labels, end marker with a POCKET / SCRATCH / STOP tag');
  assert(potted && potted.end.type === 'pocket' && potted.end.pocket === 'TR' && PV.endTag(potted) === 'POCKET' && /data-tag="POCKET"/.test(PV.previewSVG([potted])), 'preview marks a potted object ball with the pocket highlight + POCKET tag');
  const missPath = { ...potted, end: { type: 'stop', x: 70, y: 20 } };
  assert(PV.endTag(missPath, { aimBall: 1, aimPocket: 'TR' }) === 'MISS' && PV.endTag({ ...missPath, role: 'cue', id: 'cue' }) === 'STOP', 'preview tags an aimed object ball that stays up as MISS, a resting cue ball as STOP');
  assert(PV.previewSVG(PV.previewPaths(PV.runPreview(cases[2].lay, { aim: cases[2].shot.aim, V: P.speedToV0(2.5), vTips: -1 }))).includes('pv-path pv-ob'), 'object-ball path has its own style (pv-ob)');
  const tBreak = Date.now();
  PV.runPreview(LAY.rackLayout(8, 3), { aim: 0, V: P.speedToV0(7) });
  const dtB = Date.now() - tBreak;
  assert(dtB < 400, `preview of a 15-ball break at SPEED 7 stays fast (${dtB} ms in Node; throttled to one run per ${PV.PREVIEW_THROTTLE_MS} ms in the app)`);
  const simSrc = src('js/ui/simulator.js');
  assert(/PV\.runPreview\(layout\(\), previewShot\(\)\)/.test(simSrc) && /aim: st\.shot\.aim, V: effectiveV\(\), vTips: st\.shot\.vTips, hTips: st\.shot\.hTips/.test(simSrc), 'simulator: preview and SHOOT use the same layout, aim, launch speed and tip');
  // Three-Lane Speed Exercise
  const tl = drillsMod.getDrillById('three-lane-speed');
  assert(tl && tl.category === 'Speed Control' && tl.lanes.length === 3 && tl.lanes.map((l) => l.speed).join() === '1.5,2.5,3' && tl.lanes.every((l) => l.cueBallPosition.x === 12.5) && tl.lanes.map((l) => l.cueBallPosition.y).join() === '12.5,25,37.5', 'Three-Lane drill: left/center/right lanes start on the first diamond at SPEED 1.50 / 2.50 / 3.00');
  assert(tl.lanes.every((l) => Math.abs(l.targetZones[0].x / 12.5 - speed.speedPath(l.speed).diamond) < 0.12 && l.targetZones[0].type === 'rings' && l.cueContact.vTips === 0 && l.cueContact.hTips === 0), 'Three-Lane drill: target circles on the 3rd / 5th / 7th diamond from your end (the rule stops), centre ball');
  assert(tl.credit === "Inspired by Ron the Pool Student's ICA cue-ball speed exercise." && tl.instructions.includes(tl.credit), 'Three-Lane drill: credit line in the drill notes');
  assert([1.5, 2.5, 3].every((v) => tl.instructions.includes(speed.speedMeaning(v))) && tl.lanes.every((l, i) => l.goal.includes(`on the ${['3rd', '5th', '7th'][i]} diamond from your end`)), 'Three-Lane drill uses the same speed meanings as the speed table');
  assert(geometryProblems(tl).length === 0 && tl.lanes.every((l) => geometryProblems(l).length === 0), 'Three-Lane drill: geometry checks pass (drill + every lane)');
  let ts = engine.newSession('drills', 'three-lane-speed');
  const lanesSeen = [];
  for (let i = 0; i < 15; i++) {
    const ev = engine.evaluateSession(ts, tl);
    lanesSeen.push(engine.currentChallenge(ts, tl, ev).lane.index);
    ts = engine.recordAttempt(ts, { stars: i < 10 ? 2 : i < 14 ? 1 : 2 });
  }
  const evTL = engine.evaluateSession(ts, tl);
  assert(lanesSeen.join('') === '000001111122222' && evTL.over && evTL.laneStars.join() === '10,10,6' && !evTL.passed, 'Three-Lane drill: 5 attempts per lane in order; 6★ in one lane fails even with 26★ total');
  let ts2 = engine.newSession('drills', 'three-lane-speed');
  for (let i = 0; i < 15; i++) ts2 = engine.recordAttempt(ts2, { stars: i % 5 < 2 ? 2 : 1 });
  const ev2 = engine.evaluateSession(ts2, tl);
  assert(ev2.passed && ev2.laneStars.every((x) => x === 7) && ev2.needText === '7★ in each lane', 'Three-Lane drill: 7★ in every lane passes');
  const fin = engine.finishSession(storage.defaultState(), ts2);
  assert(fin.state.prog && fin.state.prog.drillXp > 0 && fin.state.prog.lifetimeXp > 0 && RK.drillRankStatus(fin.state).have.passed === 1, `Three-Lane drill earns Lifetime XP, Drill XP (${fin.state.prog?.drillXp}) and a Drill Rank pass`);
  // Table Games rename (internal ids unchanged)
  const idx = src('index.html');
  assert(/<span>Table Games<\/span>/.test(idx) && !/Arcade/.test(idx) && /data-page="arcade"/.test(idx), 'bottom nav says Table Games (internal page id arcade kept)');
  const dash = await import(js('dashboard.js'));
  const hub = dash.renderArcade(storage.defaultState());
  assert(hub.includes('TABLE GAMES') && !/Arcade/.test(hub), 'Table Games hub never says Arcade');
  const userJs = ['js/dashboard.js', 'js/career.js', 'js/ghost.js', 'js/ui/progression.js', 'js/ui/dev.js', 'js/ui/play.js', 'js/app.js', 'js/skills.js'].map((f) => src(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\/\/ [^'"`\n]*$/gm, '')).join('\n');
  const leftovers = (userJs.replace(/renderArcade|arcade/g, '').match(/.{0,40}\bArcade\b.{0,40}/g) || []);
  assertAll('no user-visible "Arcade" text left in the UI modules', leftovers);
  assert(/'tablegames'/.test(src('js/app.js')) && /Table Games stars/.test(src('js/career.js')), 'Table Games: #tablegames alias route; career text renamed');
  assert(/SPEED n = n table lengths of total cue-ball travel/.test(src('POOLIQ_CONTENT_SCHEMA.md')) && src('POOLIQ_CONTENT_SCHEMA.md').includes(speed.speedMeaning(1.5)) && src('POOLIQ_CONTENT_SCHEMA.md').includes(speed.speedMeaning(1.25)), 'schema doc section 4 has the v11.1 speed definition and meaning table');
  assert(/v11\.1/.test(src('README.md')) && /Table Games/.test(src('README.md')) && src('README.md').includes(speed.speedMeaning(1.5)), 'README has the v11.1 changelog');
}

// ---------------------------------------------------------------- v12: visual restyle (font, theme, table look, icons)
{
  const fsm = await import('fs');
  const src = (f) => fsm.readFileSync(path.join(root, f), 'utf8');
  const bin = (f) => fsm.readFileSync(path.join(root, f));
  const sw = src('sw.js');
  const css = src('css/styles.css');
  const idx = src('index.html');
  const man = JSON.parse(src('manifest.json'));
  // font: Poppins bundled locally (woff2), licence shipped, every face declared + precached
  const faces = ['regular', 'medium', 'semibold', 'bold', 'extrabold'];
  const fprobs = [];
  for (const w of faces) {
    const f = `fonts/poppins-${w}.woff2`;
    if (!fsm.existsSync(path.join(root, f))) { fprobs.push(`missing ${f}`); continue; }
    if (bin(f).subarray(0, 4).toString('latin1') !== 'wOF2') fprobs.push(`${f} is not WOFF2`);
    if (!css.includes(`url(../fonts/poppins-${w}.woff2)`)) fprobs.push(`${f} not declared in @font-face`);
    if (!sw.includes(`'./${f}'`)) fprobs.push(`${f} not precached`);
  }
  assertAll('v12 font: 5 Poppins WOFF2 faces bundled locally, declared with @font-face and precached for offline use', fprobs);
  const ofl = fsm.existsSync(path.join(root, 'fonts/OFL.txt')) ? src('fonts/OFL.txt') : '';
  assert(/SIL OPEN FONT LICENSE Version 1\.1/.test(ofl) && /Poppins Project Authors/.test(ofl), 'v12 font licence: SIL Open Font License 1.1 text shipped in fonts/OFL.txt');
  assert(/body\{font-family:Poppins/.test(css) && /font-display:swap/.test(css) && !/fonts\.googleapis|fonts\.gstatic/.test(css + idx), 'v12: Poppins is the app font, font-display swap, no remote font CDN');
  // theme + header / nav
  assert(/class="brandMark"[^>]*alt="POOLIQ"/.test(idx) && idx.includes('./icons/wordmark.png') && !/1Q/.test(idx) && !/POOL <b>IQ<\/b>/.test(idx), 'v14-40 header wordmark is the installed app icon mark (never "1Q", not the old blue IQ text)');
  const navBtns = (idx.match(/<nav>[\s\S]*<\/nav>/) || [''])[0].match(/<button[\s\S]*?<\/button>/g) || [];
  assert(navBtns.length === 7 && navBtns.every((b) => /<svg class="navIco"/.test(b) && /<span>[^<]+<\/span>/.test(b)) && !/<nav>[\s\S]*data-page="analyze"[\s\S]*<\/nav>/.test(idx), 'v14-16 nav: 7 tabs (Analyze left the bottom nav), each with an SVG icon + its label');
  assert(['home', 'career', 'drills', 'learn', 'sim', 'arcade', 'profile'].every((p) => idx.includes(`data-page="${p}"`)) && !idx.includes('data-page="analyze"') && idx.includes('id="settingsBtn"') && idx.includes('aria-label="Settings"'), 'v14-16 nav + settings button keep their ids, pages and labels');
  assert(/--gold:#f6c453/.test(css) && /--bg:#040a12/.test(css) && /--cloth:#066b83/.test(css) && /--wood:#57301a/.test(css), 'v12 palette variables: navy background, gold, teal cloth, wood');
  // table look: wood rails, teal cloth, white diamond sights, unique gradient ids
  const svgA = table.renderTableDiagram({ balls: [{ id: 'cue', x: 20, y: 25 }, { id: 1, x: 60, y: 20 }], targetPocket: 'TR' });
  const svgB = table.renderTableDiagram({ balls: [{ id: 'cue', x: 30, y: 25 }] });
  const idsA = [...svgA.matchAll(/id="(feltGrad[^"]+)"/g)].map((m) => m[1]);
  const idsB = [...svgB.matchAll(/id="(feltGrad[^"]+)"/g)].map((m) => m[1]);
  assert(/class="rail-wood"[^>]*fill="url\(#woodV[^)]+\) #4a2915"/.test(svgA) && /class="wood-grain"/.test(svgA), 'v12 table: wood rail with grain (solid fallback colour)');
  assert(/class="felt"[^>]*fill="url\(#feltGrad[^)]+\) #066b83"/.test(svgA) && /stop-color="#066b83"/.test(svgA), 'v12 table: teal cloth playing surface');
  assert((svgA.match(/class="diamond-mark"/g) || []).length === 18 && (svgA.match(/class="diamond-sight"/g) || []).length === 18 && /class="diamond-mark"[^>]*fill="#f4f6fb"/.test(svgA), 'v12 table: 18 white diamond sights on the rails (sight positions unchanged)');
  assert(idsA.length === 1 && idsB.length === 1 && idsA[0] !== idsB[0], 'v12 table: gradient ids are unique per SVG (a hidden copy never blanks another)');
  assert((svgA.match(/class="ball-shine"/g) || []).length === 2 && (svgA.match(/class="ball-body"[^>]* r="1\.125"/g) || []).length === 2, 'v12 table: glossy shine on each true-scale ball (r stays 1.125)');
  const sd = (await import(js('games/speedDiagram.js'))).speedDiagramSVG(1.5);
  assert(/class="sm-felt"[^>]*fill="#066b83"/.test(sd) && /class="sm-wood"/.test(sd) && (sd.match(/class="sm-diamond"/g) || []).length === 12 && /STOP · 3rd diamond/.test(sd), 'v12 speed mini diagram: teal cloth, wood rail, white diamonds, STOP marker kept');
  // icons: every manifest size exists as a real PNG of that size; maskable + apple opaque; favicons linked + precached
  const pngInfo = (f) => { const b = bin(f); return { png: b.subarray(1, 4).toString('latin1') === 'PNG', w: b.readUInt32BE(16), h: b.readUInt32BE(20), type: b[25] }; };
  const iprobs = [];
  for (const ic of man.icons) {
    const f = ic.src.replace('./', '');
    const [w, h] = ic.sizes.split('x').map(Number);
    const info = pngInfo(f);
    if (!info.png || info.w !== w || info.h !== h) iprobs.push(`${f}: ${info.w}x${info.h}`);
    if (ic.purpose === 'maskable' && info.type !== 2) iprobs.push(`${f}: maskable icon should be opaque RGB`);
  }
  const ap = pngInfo('icons/apple-touch-icon.png');
  if (!(ap.png && ap.w === 180 && ap.h === 180 && ap.type === 2)) iprobs.push('apple-touch-icon must be an opaque 180×180 PNG');
  const fv = pngInfo('icons/favicon-32.png');
  if (!(fv.png && fv.w === 32 && fv.h === 32)) iprobs.push('favicon-32.png must be 32×32');
  for (const f of ['./icons/favicon.svg', './icons/favicon-32.png', './icons/apple-touch-icon.png']) if (!sw.includes(`'${f}'`)) iprobs.push(`${f} not precached`);
  if (!/rel="icon" href="\.\/icons\/favicon\.svg"/.test(idx) || !/rel="icon" href="\.\/icons\/favicon-32\.png"/.test(idx)) iprobs.push('favicon links missing');
  if (!/^<svg[^>]*viewBox="0 0 512 512"/.test(src('icons/favicon.svg')) || /<text/.test(src('icons/favicon.svg'))) iprobs.push('favicon.svg must be self-contained (outlined text)');
  assertAll('v12 icons: 192/512 any + maskable, apple-touch-icon 180, favicon SVG + 32 px PNG, all real PNG sizes, precached', iprobs);
  assert(/v12/.test(src('README.md')) && /Poppins/.test(src('README.md')) && /Open Font License/.test(src('README.md')), 'README has the v12 changelog (font + licence)');
}

// ---------------------------------------------------------------- v13: online accounts (Supabase)
{
  const fsm = await import('fs');
  const src = (f) => fsm.readFileSync(path.join(root, f), 'utf8');
  const sw = src('sw.js');
  const idx = src('index.html');
  const cfg = src('js/cloud/config.js');
  const sql = src('supabase/schema.sql');
  const docs = src('docs/ONLINE_ACCOUNTS.md');
  const app = src('js/app.js');
  const dash = src('js/dashboard.js');
  const friends = src('js/ui/friends.js');
  const vendor = src('js/vendor/supabase.js');
  assert(/'pool-iq-v14-119'/.test(sw) && !/'pool-iq-v12'/.test(sw) && !/'pool-iq-v13'/.test(sw) && !/'pool-iq-v14-5c'/.test(sw), 'v14: service worker cache is pool-iq-v14-119');
  assert(sw.includes(`'./js/vendor/supabase.js'`) && sw.includes(`'./js/cloud/controller.js'`) && sw.includes(`'./js/ui/account.js'`), 'v13: sw precaches the bundled supabase-js and the cloud modules');
  assert(/supabase-js\/2\.117\.2/.test(vendor) && /createClient/.test(vendor) && !/cdn\.jsdelivr|unpkg\.com|esm\.sh/.test(idx + sw), 'v13: official supabase-js v2 UMD build is bundled locally (no CDN)');
  assert(/nqfwlpfyccbqetcyjijf/.test(cfg) && /sb_publishable_/.test(cfg) && !/sb_secret_|service_role|sbp_[0-9a-f]{10}/.test(cfg + sql + docs), 'v13: config carries the project ref + publishable key only (no secrets anywhere)');
  assert(/enable row level security/.test(sql) && /profiles: owner insert/.test(sql) && /saves: owner read/.test(sql) && /public_stats: signed-in read/.test(sql) && /avatars: owner insert/.test(sql) && /pool-iq-backup/.test(sql), 'v13: schema.sql has RLS + owner policies on profiles, saves, public_stats and the avatars bucket');
  assert(/createCloud/.test(app) && /name === 'account'/.test(app) && /name === 'leaderboard'/.test(app) && /cloudCard/.test(dash) && /leaderboard/.test(friends), 'v13: app wires account + leaderboard routes, Settings cloud card, Friends link');
  assert(/Reset a friend's password/.test(docs) && /What's stored where/.test(docs) && /mailer_autoconfirm/.test(docs), 'v13: docs/ONLINE_ACCOUNTS.md covers setup, storage and password reset');
  assert(/v13/.test(src('README.md')) && /ONLINE_ACCOUNTS/.test(src('README.md')), 'README has the v13 changelog');
  // the pure cloud logic (Node-runnable, no network)
  const S = await import(js('cloud/sync.js'));
  const kv = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
  kv.setItem('poolIQStateV4', JSON.stringify({ version: 4, xp: 50, rankIndex: 0, results: {}, games: { landing: { stages: { 'lz-1': { tries: 2 } }, pb: {}, sessions: [] } }, ghostMatches: [], settings: {}, speedCal: {} }));
  const dev = S.deviceId(kv);
  assert(S.deviceId(kv) === dev && dev.startsWith('dev-'), 'v13 sync: device id is stable per install');
  const row = S.buildSaveRow(kv, { userId: 'u1', deviceId: dev, deviceLabel: 'iPhone', now: 1700000000000 });
  assert(row.data.format === 'pool-iq-backup' && row.data.keys.poolIQStateV4 && row.device_label === 'iPhone' && row.summary.sessions === 2, 'v13 sync: cloud save row is a real pool-iq-backup');
  const parsed = S.parseCloudSave({ ...row, updated_at: '2026-09-01T00:00:00Z' });
  assert(parsed.summary.sessions === 2 && parsed.keys.poolIQStateV4, 'v13 sync: a cloud save parses back like a backup file');
  let bad = false; try { S.parseCloudSave({ data: { format: 'nope' } }); } catch { bad = true; }
  assert(bad, 'v13 sync: a non-backup cloud row is rejected');
  const cmp = S.compareWithCloud({ kv, row: { updated_at: '2026-09-01T00:00:00Z', local_saved_at: Date.now() + 1e7, device_id: 'other', device_label: 'Android phone', summary: {} }, userId: 'u1' });
  assert(cmp.exists && !cmp.known && cmp.newer === 'cloud' && cmp.recommend === 'restore', `v13 sync: newer cloud save recommends restore (${cmp.recommend})`);
  const block = S.uploadBlocked({ kv, head: { updated_at: '2026-09-02T00:00:00Z', device_id: 'other' }, userId: 'u1' });
  assert(block && block.reason === 'cloud-changed', 'v13 sync: an unseen cloud change blocks the automatic upload');
  S.setCloudMeta(kv, { userId: 'u1', cloudUpdatedAt: '2026-09-02T00:00:00Z' });
  assert(S.uploadBlocked({ kv, head: { updated_at: '2026-09-02T00:00:00Z', device_id: 'other' }, userId: 'u1' }) === null, 'v13 sync: once the cloud change is acknowledged, upload is allowed');
  const ps = { format: 'pool-iq-public-stats', displayName: 'Andrew', career: { rankIndex: 2, rank: 'Shooter', ball: 3, title: 'Shooter · 3-ball', champion: false, lifetimeXp: 1200 }, drillRank: { number: 1, name: 'Chalk Rookie', drillXp: 40 }, stars: 9, ghost: { matches: 4, wins: 2 }, devSeeded: false };
  const sr = S.publicStatsRow(ps, { userId: 'u1' });
  assert(sr && sr.rank_name === 'Shooter' && sr.lifetime_xp === 1200 && sr.drill_rank === 1 && sr.stars === 9 && sr.pvp_wins === null, 'v13 sync: public stats row maps the export (no win record by default)');
  assert(S.publicStatsRow({ ...ps, devSeeded: true }, { userId: 'u1' }) === null, 'v13 sync: DEV test states are never shared');
  const entries = S.mergeLeaderboard([{ id: 'a', display_name: 'Maya', avatar_url: 'https://x/a' }, { id: 'b', display_name: '', avatar_url: null }], [{ user_id: 'b', display_name: 'Leo', lifetime_xp: 500 }, { user_id: 'a', display_name: 'Maya', lifetime_xp: 100, rank_index: 3 }], 'a');
  const sorted = S.sortLeaderboard(entries, 'xp');
  assert(sorted.map((e) => e.name).join(',') === 'Leo,Maya' && sorted[1].isMe && sorted.length === 2, `v13 sync: leaderboard merges profiles + stats and sorts by XP (${sorted.map((e) => e.name).join(',')})`);
  const byCareer = S.sortLeaderboard(entries, 'career');
  assert(byCareer[0].name === 'Maya', 'v13 sync: Career rank sort puts the higher rank first');
  const parts = S.dataUrlParts('data:image/png;base64,iVBORw0KGgo=');
  assert(parts && parts.mime === 'image/png' && parts.ext === 'png' && parts.bytes.length > 0 && S.avatarPath('u1') === 'u1/avatar', 'v13 sync: data URLs decode for the avatars bucket');
  assert(S.friendlyError({ message: 'Invalid login credentials' }) === 'Wrong email or password.' && /No connection/.test(S.friendlyError({ message: 'Failed to fetch' })), 'v13 sync: errors become plain sentences');
  // public stats export now carries stars + an opt-in win record
  const prof = await import(js('profile.js'));
  const st = { version: 4, xp: 0, rankIndex: 0, results: {}, games: {}, ghostMatches: [], settings: {}, speedCal: {} };
  const out = prof.publicStats(st, prof.defaultProfile(), 1700000000000, { pvp: { matches: 3, wins: 2, losses: 1 } });
  assert(out.format === 'pool-iq-public-stats' && typeof out.stars === 'number' && out.pvp && out.pvp.wins === 2, 'v13: public stats export includes stars and the opt-in friend-match record');
  const out2 = prof.publicStats(st, prof.defaultProfile(), 1700000000000);
  assert(!out2.pvp, 'v13: friend-match record is absent unless opted in');
}


// ---------------------------------------------------------------- v14: simulator simplification, table size, scan, runout, 3D, random shot, icons
{
  const fs = await import('fs');
  const sim = fs.readFileSync(path.join(root, 'js/ui/simulator.js'), 'utf8');
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(!/data-action="sim-nudge"/.test(sim), 'v14: aim degree nudge buttons are gone');
  assert(!/id="simSpeedDiagram"/.test(sim) && !/class="spMean"/.test(sim), 'v14: speed mini-diagram and route sentence are not rendered');
  assert(!sim.includes('data-aim='), 'v14: aim degree readout is not rendered');
  assert(/TABLE SIZE/.test(sim) && /data-action="sim-size"/.test(sim), 'v14: table size control is on the simulator');
  assert(/offsetDragPoint/.test(sim) && /data-offset-drag/.test(sim), 'v14: offset-drag hook is wired');
  assert(/SCAN_PLACE_LABEL/.test(sim) && /Place the balls to match your photo/.test(fs.readFileSync(path.join(root, 'js/sim/scan.js'), 'utf8')), 'v14: scan confirm uses the place-balls label');
  assert(!/detected \d|balls detected|auto-detect/i.test(sim), 'v14: simulator does not claim detection');
  assert(/data-action="sim-runout"/.test(sim) && !/data-action="sim-3d"/.test(sim) && !/3D VIEW/.test(sim) && /data-action="sim-full"/.test(sim) && /data-action="sim-rand"/.test(sim), 'v14-5c: runout, full screen and random shot exist; 3D view button is gone');
  const arcade = idx.match(/data-page="arcade"[\s\S]*?<\/button>/)[0];
  assert(!/M7\.4 6\.6/.test(arcade) && /<rect /.test(arcade), 'v14: Table Games icon is a pool table, not the controller');
  for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/favicon.svg']) {
    assert(fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).size > 400, `v14: icon file ${f}`);
  }
  assert(/pool-iq-v14/.test(sw) && sw.includes('./js/sim/tableCal.js') && sw.includes('./js/sim/randomShot.js'), 'v14: cache and new modules are precached');

  const TC = await import(js('sim/tableCal.js'));
  const P = await import(js('sim/physics.js'));
  const LIB = await import(js('sim/library.js'));
  const RO = await import(js('sim/runout.js'));
  const RS = await import(js('sim/randomShot.js'));
  const V3 = await import(js('sim/view3d.js'));
  const SC = await import(js('sim/scan.js'));
  assert(TC.spec(7).lengthIn === 78 && TC.spec(7).widthIn === 39 && TC.spec(8).lengthIn === 88 && TC.spec(9).lengthIn === 100, 'v14: playing surfaces are 78×39, 88×44, 100×50');
  assert(TC.DEFAULT_FT === 8 && LIB.DEFAULT_SETTINGS.tableFt === 8, 'v14: default table is 8 ft');
  const saved = LIB.loadSim();
  saved.settings.tableFt = 7;
  LIB.saveSim(saved);
  assert(LIB.loadSim().settings.tableFt === 7, 'v14: table size persists in the sim settings');
  const cue = [{ id: 'cue', x: 20, y: 25 }];
  const travel = (ft) => {
    const table = TC.spec(ft);
    const opt = TC.isNine(table) ? { record: false, maxTime: 12 } : { record: false, maxTime: 12, table };
    const res = P.simulate(cue, { aim: 0, V: P.speedToV0(2, table), vTips: 0, hTips: 0 }, opt);
    return res.distance.cue;
  };
  const d7 = travel(7); const d8 = travel(8); const d9 = travel(9);
  assert(d7 > 50 && d8 > d7 + 5 && d9 > d8 + 5, `v14: SPEED 2 travels farther in inches on a longer table (${d7.toFixed(1)} / ${d8.toFixed(1)} / ${d9.toFixed(1)})`);
  const det = await SC.detectBalls(null);
  assert(det.available === false && det.balls == null && det.label === 'Place the balls to match your photo', 'v14: detector hook does not invent balls');
  const plan = RO.planRunout([{ id: 'cue', x: 30, y: 30 }, { id: 1, x: 70, y: 22 }], { game: 9, table: TC.spec(8) });
  assert(Array.isArray(plan.steps) && plan.steps.length >= 1 && plan.steps[0].pocket && plan.steps[0].text, `v14: runout returns a physics step (${plan.steps[0]?.text || plan.note})`);
  const eight = RO.planRunout([
    { id: 'cue', x: 28, y: 25 },
    { id: 1, x: 18, y: 10 }, { id: 2, x: 20.2, y: 11.2 },
    { id: 4, x: 62, y: 25 }, { id: 8, x: 78, y: 36 }, { id: 9, x: 40, y: 12 }
  ], { game: 8, group: 'solids', table: TC.spec(8) });
  const open = String(eight.steps[0]?.text || '');
  const rotationOpen = /^1-ball\s*→/.test(open) && !eight.steps[0]?.breakout;
  assert(eight.steps.length >= 2 && !rotationOpen, `v14-1: 8-ball breakout may hit the 1, but rotation must not open on the 1 (${eight.steps[0]?.text || eight.note})`);
  assert(eight.steps.some((s) => String(s.ball) === '4'), 'v14-1: 8-ball plans another solid, not numerical order');
  const balls = [{ id: 'cue', x: 25, y: 30 }, { id: 1, x: 60, y: 20 }];
  const before = JSON.stringify(balls);
  const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
  V3.drawTable3D(ctx, 300, 160, { balls, ballR: TC.diagramRadius(TC.spec(8)), yaw: 0.2, pitch: 2 });
  assert(JSON.stringify(balls) === before && V3.cameraBehind(balls[0], 0, 0).x !== balls[0].x, 'v14: 3D draw reads the same positions and does not move them');
  const gen = RS.generateShot({ type: 'straight', pocket: 'ANY', seed: 3, table: TC.spec(8), tries: 24 });
  assert(gen.ok && gen.ways.length >= 1, `v14: random straight shot is one the physics makes (${gen.ok ? gen.ways.length + ' ways' : 'none'})`);
  if (gen.ok) {
    const spec = RS.SHOT_TYPES.find((s) => s.id === 'straight');
    const bad = gen.ways.filter((w) => {
      const table = TC.spec(8);
      const res = P.simulate(gen.balls, { aim: w.aim, V: P.speedToV0(w.speed, table), vTips: w.vTips, hTips: w.hTips }, { record: false, maxTime: 12, table });
      return !RS.shotMeets(res, { pocket: gen.pocket, obRails: spec.obRails, cueRails: spec.cueRails });
    });
    assert(bad.length === 0, `v14: every listed way pockets (${bad.length} misses)`);
  }
  const miss = RS.generateShot({ type: 'kick4', pocket: 'TL', seed: 1, table: TC.spec(8), tries: 0 });
  assert(miss.ok === true || (miss.ok === false && !miss.balls), 'v14: a failed random search does not return a layout');
}


// ---------------------------------------------------------------- v14-25: import a fixed drill as a preview (not saved until SAVE)
{
  const fs = await import('fs');
  const OE = await import(js('drills/ownerEdits.js'));
  const SCH = await import(js('content/schema.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL = await import(js('cloud/client.js'));
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  assert(DEV.isUnlocked(), 'v14-25: the owner account is the dev for the import check');
  const fixSrc = fs.readFileSync(path.join(root, 'js/ui/drillFix.js'), 'utf8');
  const barAt = fixSrc.indexOf('class="fixBar"');
  const bar = fixSrc.slice(barAt, barAt + 900);
  assert(bar.includes('data-action="df-save"') && bar.includes('>SAVE<') && !bar.includes('SAVE ON THIS PHONE') && bar.includes('data-action="df-export"') && bar.includes('EXPORT THIS') && bar.includes('data-action="df-import"') && bar.includes('IMPORT DRILL') && bar.includes('RESET') && bar.includes('EXPORT ALL'), 'v14-26: SAVE sits with RESET, EXPORT THIS, IMPORT DRILL, and EXPORT ALL');
  const applyBody = fixSrc.slice(fixSrc.indexOf('function applyImported'), fixSrc.indexOf('function bindFields'));
  assert(applyBody.includes('drillFromImport(text, id)') && !applyBody.includes('setDrillEdit') && !applyBody.includes('saveDrillEdits') && !applyBody.includes('localStorage'), 'v14-25: import previews through drillFromImport and does not write the edit store');
  const id = 'pkf-draw-1d';
  const otherId = 'pkf-draw-2d';
  store.delete(OE.DRILL_EDITS_KEY);
  const shipped = OE.editingDoc(id);
  const other = OE.editingDoc(otherId);
  assert(shipped && shipped.shot?.cueBallPosition && other && other.id === otherId, 'v14-25: sample drills load');
  const fixed = JSON.parse(JSON.stringify(shipped));
  fixed.title = 'Imported preview';
  fixed.description = 'ChatGPT moved the balls.';
  fixed.shot.cueBallPosition = { x: 18, y: 40 };
  fixed.shot.ballPositions = [{ n: 1, x: 78, y: 12 }];
  fixed.shot.targetPocket = 'BR';
  fixed.shot.acceptPockets = ['BR'];
  fixed.shot.targetZones = [{ x: 30, y: 36, rings: [{ r: 2.5, stars: 3 }, { r: 4, stars: 2 }, { r: 6, stars: 1 }] }];
  fixed.attribution = { ...(fixed.attribution || {}), sourceURL: 'https://example.com/pool-fix' };
  const file = SCH.serialize(fixed);
  const before = store.get(OE.DRILL_EDITS_KEY);
  const parsed = OE.drillFromImport(file, id);
  assert(parsed.doc && !parsed.error && parsed.doc.title === 'Imported preview' && parsed.doc.shot.cueBallPosition.x === 18 && parsed.doc.shot.ballPositions[0].x === 78 && parsed.doc.shot.targetPocket === 'BR' && parsed.doc.shot.targetZones[0].x === 30 && parsed.doc.attribution.sourceURL === 'https://example.com/pool-fix' && parsed.doc.id === id, 'v14-25: a .pooliq export parses onto this drill (balls, pocket, bullseye, title, link)');
  assert(store.get(OE.DRILL_EDITS_KEY) === before && OE.editingDoc(id).title === shipped.title && OE.editingDoc(id).shot.cueBallPosition.x === shipped.shot.cueBallPosition.x, 'v14-25: parsing an import does not store it; leaving the editor would reload the saved drill');
  const asJson = OE.drillFromImport(JSON.parse(file), id);
  assert(asJson.doc && asJson.doc.title === 'Imported preview' && asJson.doc.id === id, 'v14-25: the same drill as a JSON object is accepted');
  const oneWrap = OE.drillFromImport(JSON.stringify({ drills: [other] }), id);
  assert(oneWrap.doc && oneWrap.doc.id === id && oneWrap.doc.title === other.title && oneWrap.doc.shot.cueBallPosition.x === other.shot.cueBallPosition.x, 'v14-25: a drills array with exactly one drill is applied to the open drill');
  const many = OE.drillFromImport(JSON.stringify({ format: 'pooliq-drill-edits', drills: [other, fixed] }), id);
  assert(many.doc && many.doc.id === id && many.doc.title === 'Imported preview', 'v14-25: a drills array uses the drill whose id matches the one open');
  const none = OE.drillFromImport(JSON.stringify({ drills: [other, JSON.parse(JSON.stringify(other))] }), id);
  assert(!none.doc && none.error === 'That file has more than one drill, and none is this drill.', 'v14-25: several drills and no id match is refused');
  const bad = OE.drillFromImport('not json', id);
  const pack = OE.drillFromImport(JSON.stringify({ format: 'pooliq', contentType: 'pack', drills: [] }), id);
  const empty = OE.drillFromImport('{"drills":[]}', id);
  assert(bad.error === 'That file is not a drill this app understands.' && pack.error === 'That file is not a drill this app understands.' && empty.error === 'That file is not a drill this app understands.' && !bad.doc && !pack.doc && !empty.doc, 'v14-25: a file that is not a drill is a short error and no document');
  assert(store.get(OE.DRILL_EDITS_KEY) === before && OE.getDrillEdit(id) == null, 'v14-25: a bad import does not wipe the saved drill');
  const kept = OE.setDrillEdit(id, shipped, 1700000000000);
  assert(kept.ok, 'v14-25: a previously saved drill is still there');
  const savedRaw = store.get(OE.DRILL_EDITS_KEY);
  const preview = OE.drillFromImport(file, id);
  assert(preview.doc.title === 'Imported preview' && store.get(OE.DRILL_EDITS_KEY) === savedRaw && OE.editingDoc(id).title === shipped.title, 'v14-25: import preview does not replace the saved override');
  const wrote = OE.setDrillEdit(id, preview.doc, 1700000000001);
  assert(wrote.ok && OE.editingDoc(id).title === 'Imported preview' && OE.editingDoc(id).shot.cueBallPosition.x === 18, 'v14-25: SAVE stores the imported drill the same way as any other edit');
  OE.removeDrillEdit(id);
  assert(OE.editingDoc(id).title === shipped.title, 'v14-25: reset removes the override and the shipped drill returns');
  CL.setCurrentUserForTests(null);
  DEV.lock();
  assert(!DEV.isUnlocked() && OE.setDrillEdit(id, preview.doc).error === 'DEV MODE is locked' && OE.getDrillEdit(id) == null, 'v14-25: a locked phone cannot save an import');
}

// ---------------------------------------------------------------- v14-26: SAVE publishes, object line is separate, open app updates once
{
  const fs = await import('fs');
  const fixSrc = fs.readFileSync(path.join(root, 'js/ui/drillFix.js'), 'utf8');
  const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const swSrc = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const pubSrc = fs.readFileSync(path.join(root, 'js/drills/published.js'), 'utf8');
  const oeSrc = fs.readFileSync(path.join(root, 'js/drills/ownerEdits.js'), 'utf8');
  const top = fixSrc.slice(fixSrc.indexOf('class="fixTop"'), fixSrc.indexOf('class="fixScroll"'));
  assert(top.includes('fixSaveMain') && top.includes('>SAVE<') && top.includes('fixTable'), 'v14-26: SAVE is in the row under the table, not only at the bottom');
  assert(fixSrc.includes('REMOVE OBJECT LINE') && fixSrc.includes('data-action="df-remove-ob-line"') && fixSrc.includes('REMOVE CUE LINE'), 'v14-26: REMOVE OBJECT LINE sits with the line controls');
  const obFn = fixSrc.slice(fixSrc.indexOf('function removeObjectLine'), fixSrc.indexOf('function setSpeed'));
  assert(obFn.includes('objectBallPaths') && !obFn.includes('delete s.cueBallPath'), 'v14-26: REMOVE OBJECT LINE does not delete the cue path');
  const cueFn = fixSrc.slice(fixSrc.indexOf('function removeCueLine'), fixSrc.indexOf('function removeObjectLine'));
  assert(cueFn.includes('delete s.cueBallPath') && !cueFn.includes('objectBallPaths'), 'v14-26: only REMOVE CUE LINE deletes the cue path');
  const saveFn = fixSrc.slice(fixSrc.indexOf('async function save'), fixSrc.indexOf('function resetAsk'));
  const imp = fixSrc.slice(fixSrc.indexOf('function applyImported'), fixSrc.indexOf('function bindFields'));
  assert(saveFn.includes('publishDrill(id, doc)') && !saveFn.includes('setDrillEdit'), 'v14-26: SAVE publishes and does not write the phone-only edit store');
  assert(imp.includes('drillFromImport') && !imp.includes('publishDrill') && !imp.includes('setDrillEdit'), 'v14-26: import still only previews');
  assert(!fixSrc.includes('drill_overrides') && !saveFn.includes('.delete('), 'v14-26: the editor never deletes the published row');
  assert(oeSrc.includes('publishedDoc(ch.id)') && !oeSrc.slice(oeSrc.indexOf('export function applyDrillEdit'), oeSrc.indexOf('export function editCount')).includes('getDrillEdit'), 'v14-26: the live drill is the published row, not the phone copy');
  assert(pubSrc.includes('andrewaphay') === false && pubSrc.includes('ownerAccountSignedIn'), 'v14-26: the client refuses publish unless the owner account is signed in');
  assert(swSrc.includes('pool-iq-v14-119') && swSrc.includes('skipWaiting') && swSrc.includes('clients.claim'), 'v14-28: new cache skipWaiting and clients.claim');
  assert(fixSrc.includes('id="fixImport"') && fixSrc.includes('accept=".pooliq,.json,application/json,application/octet-stream,text/plain,*/*"') && !fixSrc.includes('text/json'), 'v14-27: IMPORT DRILL accept lets Android select .pooliq and .json');
  assert(appSrc.includes('controllerchange') && appSrc.includes('pooliq-sw-reloaded') && appSrc.includes('location.reload()'), 'v14-26: an open app reloads once when the new worker activates');
  const PUB = await import(js('drills/published.js'));
  const locked = await PUB.publishDrill('pkf-draw-1d', { title: 'nope' });
  assert(locked.error && /owner account/i.test(locked.error) && !locked.ok, 'v14-26: publish without the owner account does not write');
}


// ---------------------------------------------------------------- v14-28: ChatGPT .pooliq with extra metadata replaces the editor diagram
{
  const fs = await import('fs');
  const OE = await import(js('drills/ownerEdits.js'));
  const PKF = await import(js('content/pkfBuiltins.js'));
  const ST = await import(js('games/stageTable.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL28 = await import(js('cloud/client.js'));
  CL28.setCurrentUserForTests(null);
  const fixSrc = fs.readFileSync(path.join(root, 'js/ui/drillFix.js'), 'utf8');
  const top = fixSrc.slice(fixSrc.indexOf('class="fixTop"'), fixSrc.indexOf('class="fixScroll"'));
  assert(top.includes('id="fixMsg"') && top.indexOf('id="fixMsg"') < top.indexOf('fixTools'), 'v14-28: an import error is in the row with the table, not only below the fold');
  const applyBody = fixSrc.slice(fixSrc.indexOf('function applyImported'), fixSrc.indexOf('function bindFields'));
  assert(applyBody.includes('showMsg(out.error') && applyBody.includes('doc = out.doc') && applyBody.includes('render()') && !applyBody.includes('publishDrill'), 'v14-28: a rejected file shows its error; a kept file only previews');
  const id = 'pkf-low-action-straight-1';
  const shipped = OE.shippedDoc(id);
  const file = {
    format: 'pooliq', schemaVersion: '1.0', contentType: 'drill', id,
    contentVersion: '1.1', title: 'PKF · Low Action Straight · Near',
    description: 'Pocket the straight-in 1-ball using maximum low and the softest effective speed, stopping the cue ball at the contact point.',
    category: 'PKF · Center Ball', difficulty: 1, skill: 'Shot Making',
    attribution: { sourceName: 'P.K.F. — Pattern Play / Cue Ball Control (Zero-X Billiards)', notes: 'Converted from the user-provided PKF handbook.' },
    careerEligible: true,
    metadata: { tags: ['pkf', 'center-ball', 'low-action', 'stop-shot', 'figure-3-52'], created: '2026-09-29', language: 'en', demo: false, generator: 'ChatGPT', corrected: '2026-09-30', sourceFigure: '3-52' },
    shot: {
      kind: 'position',
      cueBallPosition: { x: 62.5, y: 43.75 },
      ballPositions: [{ n: 1, x: 25, y: 43.75 }],
      targetBall: 1, targetPocket: 'BL',
      targetZones: [{ x: 25, y: 43.75, rings: [{ r: 2.5, stars: 3 }, { r: 4, stars: 2 }, { r: 6, stars: 1 }], label: 'STOP' }],
      cueBallPath: [{ x: 62.5, y: 43.75 }, { x: 25, y: 43.75 }],
      contactIndex: 1,
      objectBallPaths: [{ n: 1, points: [{ x: 25, y: 43.75 }, { x: 0, y: 50 }] }],
      cueContact: { vTips: -1.5, hTips: 0 },
      technique: 'stun', speed: 1,
      goal: 'Pocket the 1-ball and stop the cue ball as close to the contact point as possible.'
    },
    scoringRules: { mode: 'zone', attempts: 5, pass: { stars: 7, pockets: 3 } },
    xp: 45,
    skillEffects: { 'Shot Making': 0.4, 'Cue-Ball Control': 0.4 }
  };
  const parsed = OE.drillFromImport(JSON.stringify(file), id);
  assert(parsed.doc && !parsed.error && parsed.doc.shot.cueBallPosition.x === 62.5 && parsed.doc.shot.ballPositions[0].x === 25 && parsed.doc.shot.targetPocket === 'BL' && parsed.doc.metadata.corrected === '2026-09-30' && parsed.doc.metadata.sourceFigure === '3-52', 'v14-28: ChatGPT metadata (corrected, sourceFigure) does not reject the drill');
  assert(shipped.shot.cueBallPosition.x !== 62.5 && shipped.shot.ballPositions[0].x !== 25 && shipped.shot.targetPocket === 'BR', 'v14-28: shipped low-action drill is the old layout');
  const opt = { showCuePath: true, showAim: true, showObPath: true, showZones: true, className: 'table-diagram stage-table' };
  const before = ST.renderStageTable(PKF.challengeFromPkfDoc(shipped), opt);
  const after = ST.renderStageTable(PKF.challengeFromPkfDoc(parsed.doc), opt);
  const ballAt = (svg, n) => {
    const m = svg.match(new RegExp(`data-n="${n}"[\\s\\S]*?class="ball-body" cx="([^"]+)" cy="([^"]+)"`));
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
  };
  const cue0 = ballAt(before, 'cue');
  const ob0 = ballAt(before, '1');
  const cue1 = ballAt(after, 'cue');
  const ob1 = ballAt(after, '1');
  assert(cue0 && ob0 && cue1 && ob1 && cue1.x === 62.5 && cue1.y === 43.75 && ob1.x === 25 && ob1.y === 43.75 && (cue1.x !== cue0.x || cue1.y !== cue0.y) && (ob1.x !== ob0.x || ob1.y !== ob0.y), `v14-28: importing moved balls changes the editor diagram (${cue0 && cue0.x},${cue0 && cue0.y} -> ${cue1 && cue1.x},${cue1 && cue1.y}; ob ${ob0 && ob0.x} -> ${ob1 && ob1.x})`);
  const targetPocket = (svg) => (svg.match(/data-pocket="([A-Z]+)"[^>]*stroke="#55e5ff"/) || [])[1];
  assert(targetPocket(before) === 'BR' && targetPocket(after) === 'BL' && after.includes('62.5') && after.includes('43.75'), 'v14-28: imported pocket and path coordinates are on the diagram');
  const badShot = JSON.parse(JSON.stringify(file));
  badShot.metadata = { created: '2026-09-29' };
  badShot.shot.cueBallPosition = { x: 0, y: 0 };
  const refused = OE.drillFromImport(JSON.stringify(badShot), id);
  assert(!refused.doc && refused.error && /off the table|overlaps the cushion/.test(refused.error) && refused.error !== 'That file is not a drill this app understands.', 'v14-28: a rejected drill shows the validator error, not a silent generic no-op');
  DEV.lock();
}


// ---------------------------------------------------------------- v14-34: a deleted drill is absent everywhere; a failed read keeps known ids
{
  const fs = await import('fs');
  const H = await import(js('drills/hidden.js'));
  const DEV = await import(js('dev/dev.js'));
  const DU = await import(js('ui/dev.js'));
  const DASH = await import(js('dashboard.js'));
  const BP = await import(js('content/ballPocket.js'));
  const CAREER = await import(js('career.js'));
  const RANK = await import(js('progression/rank.js'));
  const CFG = await import(js('progression/config.js'));
  const fixSrc = fs.readFileSync(path.join(root, 'js/ui/drillFix.js'), 'utf8');
  const id = 'pkf-draw-1d';
  const bpId = 'bp-l1-1';
  assert(drillsMod.drills.some((d) => d.id === id), 'v14-34: the shipped drill is still in the library module');
  const denied = await H.hideDrill(id);
  assert(denied.error && /owner account/i.test(denied.error) && !denied.ok && !H.isDrillHidden(id), 'v14-34: another account cannot delete');
  const ask = fixSrc.slice(fixSrc.indexOf("action === 'df-delete'"), fixSrc.indexOf("action === 'df-delete-do'"));
  assert(ask.includes('openSheet') && ask.includes('df-delete-do') && ask.includes('DELETE DRILL') && !ask.includes('hideDrill') && !ask.includes('confirmDelete'), 'v14-34: the first DELETE only asks; the second tap confirms');
  assert(!fixSrc.includes('Hidden for everyone') && !fixSrc.includes('hidden for everyone') && !fixSrc.includes('still in the app'), 'v14-34: no hidden-for-everyone row or toast');
  const origFetch = globalThis.fetch;
  const level1 = BP.ballPocketDrills().filter((d) => d.level === 1);
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [{ drill_id: id }, { drill_id: bpId }] });
  const loaded = await H.loadHiddenDrills();
  assert(loaded.ok && H.isDrillHidden(id) && H.isDrillHidden(bpId), 'v14-34: a loaded deleted id is known');
  assert(drillsMod.getDrillById(id) === null && engine.stageFor({ gameId: 'drills', stageId: id }) === null, 'v14-34: a deleted drill has no play entry');
  assert(!drillsMod.allDrills().some((d) => d.id === id || d.id === bpId), 'v14-34: deleted drills are absent from the library list');
  assert(drillsMod.knownDrillIds().includes(id), 'v14-34: the shipped id is still known so history is not archived');
  const cats = drillsMod.drillsByCategory();
  assert(!Object.values(cats).some((list) => list.some((d) => d.id === id || d.id === bpId)), 'v14-34: deleted drills are absent from every category');
  const CL34 = await import(js('cloud/client.js'));
  CL34.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  assert(DEV.isUnlocked(), 'v14-34: the owner account can open the dev drill list');
  const devHtml = DU.renderDevDrills();
  const page = DASH.renderDrillsPage(storage.defaultState(), 'All');
  const catName = drillsMod.drills.find((d) => d.id === id).category;
  const catPage = DASH.renderDrillsPage(storage.defaultState(), catName);
  const pocketPage = DASH.renderDrillsPage(storage.defaultState(), 'Ball Pocketing', 1);
  assert(!devHtml.includes(`data-dev-drill="${id}"`) && !page.includes(`data-drill="${id}"`) && !catPage.includes(`data-drill="${id}"`) && !pocketPage.includes(`data-drill="${bpId}"`), 'v14-34: Dev Mode, the drill list, that category, and Ball Pocketing omit the deleted drill');
  assert(!devHtml.includes('Hidden for everyone') && !page.includes('Hidden for everyone') && !page.includes('hidden for everyone'), 'v14-34: lists do not label a deleted drill hidden for everyone');
  const st = storage.defaultState();
  const recs = [];
  for (const skill of CFG.SKILL_IDS) recs.push(...RANK.trainingFor(st, skill, 80));
  assert(!recs.some((x) => x.href === `#play/drills/${id}` || x.href === `#play/drills/${bpId}`), 'v14-34: recommended training does not offer a deleted drill');
  const status = BP.ballPocketStatus(st);
  assert(status.total === level1.length - 1, 'v14-34: a deleted Ball Pocketing drill is not in the level count');
  const prog = CAREER.requirementProgress({ type: 'ballPocket', level: 1 }, st);
  assert(prog.need === level1.length - 1, 'v14-34: career does not still require the deleted drill');
  const stored = localStorage.getItem(H.HIDDEN_KEY);
  globalThis.fetch = async () => { throw new Error('offline'); };
  const failed = await H.loadHiddenDrills();
  assert(failed.error === 'unreachable' && H.hiddenStatus() === 'unreachable' && H.isDrillHidden(id) && H.isDrillHidden(bpId) && localStorage.getItem(H.HIDDEN_KEY) === stored, 'v14-34: a failed read does not show ids already known to be deleted');
  assert(drillsMod.getDrillById(id) === null && !drillsMod.allDrills().some((d) => d.id === id), 'v14-34: after a failed read the deleted drill is still absent');
  localStorage.setItem(H.HIDDEN_KEY, JSON.stringify({ ids: ['pkf-draw-2d'] }));
  const H2 = await import(js('drills/hidden.js') + '?v14-34=1');
  assert(H2.isDrillHidden('pkf-draw-2d'), 'v14-34: a phone that already knows a deleted id starts with it hidden');
  globalThis.fetch = async () => { throw new Error('offline'); };
  await H2.loadHiddenDrills();
  assert(H2.isDrillHidden('pkf-draw-2d') && !H2.isDrillHidden(id), 'v14-34: that phone still hides the known id when the list fails, and does not invent others');
  globalThis.fetch = origFetch;
  CL34.setCurrentUserForTests(null);
  DEV.lock();
}

// ---------------------------------------------------------------- v14-35: owner edits any visible text; no passcode; published for everyone
{
  const fs = await import('fs');
  const DEV = await import(js('dev/dev.js'));
  const DU = await import(js('ui/dev.js'));
  const DASH = await import(js('dashboard.js'));
  const CP = await import(js('dev/copy.js'));
  const CL = await import(js('cloud/client.js'));
  const schema = fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8');
  const copySrc = fs.readFileSync(path.join(root, 'js/dev/copy.js'), 'utf8');
  const devSrc = fs.readFileSync(path.join(root, 'js/ui/dev.js'), 'utf8');
  const dashSrc = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');
  CL.setCurrentUserForTests(null);
  const locked = DU.renderDev({});
  assert(locked.includes('data-dev-state="locked"') && !locked.includes('type="password"') && !locked.includes('devPass') && !locked.includes('SET A PASSCODE'), 'v14-35: Dev Mode has no passcode screen');
  assert(!DASH.renderSettings(storage.defaultState(), {}).includes('data-card="dev"'), 'v14-35: signed-out settings hide Dev Mode');
  CL.setCurrentUserForTests({ id: 'friend-1', email: 'friend@example.com' });
  assert(!DEV.isUnlocked() && !DASH.renderSettings(storage.defaultState(), {}).includes('data-card="dev"'), 'v14-35: another account stays locked and does not see Dev Mode');
  const denied = await CP.publishCopyText('learn|p:0|abc|Rules text', 'Changed rules');
  assert(denied.error && /owner account/i.test(denied.error) && !denied.ok, 'v14-35: another account cannot publish text');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  const own = DASH.renderSettings(storage.defaultState(), {});
  assert(DEV.isUnlocked() && own.includes('data-card="dev"') && !own.includes('type="password"'), 'v14-35: the owner account sees Dev Mode with no passcode');
  assert(copySrc.includes("from('text_overrides')") && copySrc.includes('ownerAccountSignedIn') && !copySrc.includes('Saved on this phone only'), 'v14-35: saving text publishes a text_overrides row');
  assert(schema.includes('create table if not exists public.text_overrides') && schema.includes('text_overrides: public read') && schema.includes("= 'andrewaphay@gmail.com'"), 'v14-35: text overrides are public read and owner-email write');
  assert(devSrc.includes('dev-copy-open') && devSrc.includes('Hold any words') && !devSrc.includes('type="password"'), 'v14-35: hold or Edit opens the publisher, with no password field');
  assert(dashSrc.includes('ownerAccountSignedIn()') && dashSrc.includes('data-card="dev"'), 'v14-35: the settings Dev Mode card is owner-only');
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-92: Dev Mode ON/OFF switch (owner account only)
{
  const DEV = await import(js('dev/dev.js'));
  const DU = await import(js('ui/dev.js'));
  const DASH = await import(js('dashboard.js'));
  const CP = await import(js('dev/copy.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  const OE = await import(js('drills/ownerEdits.js'));
  const KC = await import(js('content/kickingCourse.js'));
  const TS = await import(js('content/trickShotCourse.js'));
  const TP = await import(js('ui/trickPlay.js'));
  const KP = await import(js('ui/kickingPlay.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (make, args) => { let s = st0; const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '' } }; make(ctx, args).render(); return { html: ctx.root.innerHTML, state: s }; };
  CL.setCurrentUserForTests(null);
  assert(DEV.setDevModeOn(true).error && !DEV.isUnlocked() && !G.devBypass() && DU.devSwitchHTML() === '', 'v14-92: signed out cannot turn Dev Mode on and sees no switch');
  CL.setCurrentUserForTests({ id: 'friend-1', email: 'friend@example.com' });
  const friendSet = DEV.setDevModeOn(true);
  assert(friendSet.error && !DEV.isUnlocked() && !G.devBypass() && !OE.drillEditorAllowed() && !CP.copyWritable(), 'v14-92: another account cannot turn Dev Mode on (no editor, no copy edit, no lock bypass)');
  assert(!DASH.renderSettings(st0, {}).includes('data-dev-switch') && DU.renderDev({}).includes('data-dev-state="locked"'), 'v14-92: another account never sees the Dev Mode switch');
  assert(screen(TP.createTrickScreen, []).html.includes('disabled data-trick-level="2"') && !screen(TP.createTrickScreen, []).html.includes('data-dev-open'), 'v14-92: another account keeps Trick Shot locks');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.saveDev({ ...DEV.loadDev(), on: undefined });
  assert(DEV.devModeOn() && DEV.isUnlocked() && DASH.renderSettings(st0, {}).includes('data-dev-switch="on"'), 'v14-92: owner Dev Mode defaults to ON and the switch is in Settings → DEV MODE');
  // OFF
  assert(DEV.setDevModeOn(false).on === false && !DEV.isUnlocked() && !OE.drillEditorAllowed() && !CP.copyWritable() && !G.devBypass(), 'v14-92: owner OFF: no drill editor, no text editing, no lock bypass');
  const offSettings = DASH.renderSettings(st0, {});
  assert(offSettings.includes('data-dev-switch="off"') && !offSettings.includes('data-href="#dev"') && DU.renderDev({}).includes('data-dev-state="off"') && DU.renderDev({}).includes('data-dev-switch="off"'), 'v14-92: owner OFF: the switch stays reachable, the dev tools are hidden');
  const tOff = screen(TP.createTrickScreen, []).html;
  const kOff = screen(KP.createKickingScreen, []).html;
  assert(tOff.includes('disabled data-trick-level="2"') && tOff.includes('data-trick-exam-locked="1"') && !tOff.includes('data-dev-open') && kOff.includes('disabled data-offrail-level="2"'), 'v14-92: owner OFF: Trick Shot and Off the Rail locks hold');
  assert(screen(TP.createTrickScreen, ['2']).html.includes('data-trick-home="1"') && screen(KP.createKickingScreen, ['2']).html.includes('data-offrail-home="1"'), 'v14-92: owner OFF: a locked level link goes back to the list');
  assert(!KC.offRailBannersHTML(st0).includes('data-dev-open') && !TS.trickBannersHTML(st0).includes('data-dev-open'), 'v14-92: owner OFF: the exam banners stay locked');
  // ON
  assert(DEV.setDevModeOn(true).on === true && DEV.isUnlocked() && OE.drillEditorAllowed() && CP.copyWritable() && G.devBypass(), 'v14-92: owner ON: editor, text editing and lock bypass are on');
  const tOn = screen(TP.createTrickScreen, []).html;
  const kOn = screen(KP.createKickingScreen, []).html;
  assert(!tOn.includes('disabled data-trick-level') && tOn.includes('data-dev-open="1"') && !kOn.includes('disabled data-offrail-level'), 'v14-92: owner ON: every Trick Shot and Off the Rail level opens');
  assert(KC.offRailBannersHTML(st0).includes('data-dev-open="1"') && TS.trickBannersHTML(st0).includes('data-dev-open="1"'), 'v14-92: owner ON: the locked exams open from Drill Sets');
  const tPrev = screen(TP.createTrickScreen, ['3']);
  assert(tPrev.html.includes('data-dev-preview="1"') && TS.readCourse(tPrev.state).current?.dev && TS.readCourse(tPrev.state).current?.mode === 'practice', 'v14-92: a locked Trick Shot level opens as a DEV PREVIEW');
  let ts = tPrev.state;
  for (let i = 0; i < 40 && TS.readCourse(ts).current?.phase === 'play'; i++) ts = TS.trickTap(ts, 'make', false);
  assert(TS.readCourse(ts).current?.phase === 'results' && !TS.levelPassed(ts, 3) && !TS.levelUnlocked(ts, 4) && !Object.keys(TS.readCourse(ts).levels).length, 'v14-92: finishing a Trick Shot DEV PREVIEW saves nothing and unlocks nothing');
  const kPrev = screen(KP.createKickingScreen, ['2']);
  const kcur = KC.kickingOf(kPrev.state).current;
  assert(kPrev.html.includes('data-dev-preview="1"') && kcur?.dev && kcur.mode === 'practice' && !KC.isLevelOpen(KC.kickingOf(kPrev.state), 2), 'v14-92: a locked Off the Rail level opens as a DEV PREVIEW (practice: nothing saved)');
  assert(KC.startLevel(st0, 2) === st0 && TS.startLevel(st0, 2) === st0, 'v14-92: the normal unlock rules are unchanged');
  DEV.setDevModeOn(true);
  CL.setCurrentUserForTests(null);
  assert(!G.devBypass(), 'v14-92: signing out ends the bypass');
}

// ---------------------------------------------------------------- v14-95: PKF Banking Systems Course (Drill Sets & Exams)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfBankingCourse.test.mjs')], { encoding: 'utf8' });
  assert(run.status === 0 && /ALL pkfBankingCourse TESTS PASSED/.test(run.stdout), `v14-95: scripts/pkfBankingCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout}\n${run.stderr}`}`);
  const PB = await import(js('content/pkfBankingCourse.js'));
  const PBP = await import(js('ui/pkfBankPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = PBP.createPkfBankScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(['js/content/pkfBankAssets.js', 'js/content/pkfBankingCourse.js', 'js/ui/pkfBankPlay.js', 'images/pkf-bank/PKF_Banking_PDF_267.jpg', 'images/pkf-bank/PKF_Banking_PDF_270.jpg'].every((f) => swSrc.includes(`'./${f}'`)), 'v14-95: service worker precaches the banking course + original JPEGs');
  assert(appSrc.includes("name === 'pkfbank'") && appSrc.includes("pkfbank: 'learn'"), 'v14-95: #pkfbank routes under the Learn tab (v14-113)');
  assert(!('pkfBankingSystems' in st0), 'v14-95: state.pkfBankingSystems is not in defaultState (Career XP untouched)');
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  assert(courses.includes('data-pkfbank="course"') && courses.includes('PKF Banking Systems Course') && courses.includes('data-pkfbank-locked="1"'), 'v14-95: Learn > Fundamentals lists the course and a locked exam');
  assert(courses.indexOf('data-pkfkick="course"') < courses.indexOf('data-pkfbank="course"'), 'v14-95: listed after PKF Kicking Systems Course');
  assert(!DASH.renderDrillsPage(st0).includes('pkfbank') && !DASH.renderArcade(st0).includes('pkfbank') && !DASH.renderLearn([]).includes('pkfbank'), 'v14-95: not on All, Table Games or Learn');
  CL.setCurrentUserForTests(null);
  const list = screen([]).html;
  assert(list.includes('data-pkfbank-home="1"') && list.includes('disabled data-pkfbank-section="find-path-drill"') && list.includes('data-pkfbank-exam-locked="1"'), 'v14-95: list shows locks for everyone else');
  assert(screen(['corner-bank-drill']).html.includes('data-pkfbank-home="1"'), 'v14-95: a locked section link goes back to the list');
  assert(!/not on all|career xp|storage key/i.test(list), 'v14-95: no internal notes in UI');
  // lock-answer flow on the real screen
  const learn = screen(['path-context']);
  assert(learn.html.includes('data-pkfbank-play="1"') && learn.html.includes('images/pkf-bank/PKF_Banking_PDF_267.jpg') && learn.html.includes('VIEW FULL PKF EXAMPLE') && learn.html.includes('pkfb-ack'), 'v14-95: LEARN shows the original PKF page region + enlarge');
  const q = screen(['path-context'], st0, [['pkfb-ack'], ['pkfb-next'], ['pkfb-ack'], ['pkfb-next']]);
  assert(q.html.includes('data-action="pkfb-lock" disabled') && !q.html.includes('data-pkfb-sol') && !q.html.includes('VIEW FULL PKF EXAMPLE') && q.html.includes('data-pkfb-hint="1"'), 'v14-95: question: LOCK ANSWER disabled until a choice; solution + full page hidden; GUIDED hint shown');
  const picked = screen(['path-context'], q.state, [['pkfb-choice', '40']]);
  assert(picked.html.includes('data-action="pkfb-lock" ') && !picked.html.includes('data-action="pkfb-lock" disabled') && !picked.html.includes('data-pkfb-sol'), 'v14-95: choice enables LOCK ANSWER, solution still hidden');
  const locked = screen(['path-context'], picked.state, [['pkfb-lock']]);
  assert(locked.html.includes('data-pkfb-verdict="wrong"') && locked.html.includes('data-pkfb-sol="1"') && locked.html.includes('PKF SOLUTION · ORIGINAL PAGE') && locked.html.includes('VIEW FULL PKF EXAMPLE') && locked.html.includes('is-right'), 'v14-95: LOCK ANSWER reveals the PKF solution + original page');
  // shoot screen
  let sh = PB.startSection(st0, 'path-context');
  const skipTo = (s, sec, id) => { let x = PB.startSection(s, sec); for (let i = 0; i < 40; i++) { const c = PB.bankOf(x).current; if (c.order[c.cursor] === id) return x; const l = PB.lessonById(c.order[c.cursor]); if (l.answer != null) x = PB.lockAnswer(PB.selectChoice(x, l.answer)); else if (l.shoot) x = PB.markExecution(x, 'make'); else x = PB.acknowledgeLearn(x); x = PB.nextLesson(x); } return x; };
  const devAll = { ...st0, pkfBankingSystems: { sections: Object.fromEntries(PB.SECTIONS.map((s) => [s.id, { passed: true }])) } };
  sh = skipTo(devAll, 'find-path-drill', 'fp-shoot');
  const shoot = screen(['find-path-drill'], sh);
  assert(shoot.html.includes('NOW SHOOT IT') && shoot.html.includes('data-action="pkfb-exec" data-v="make"') && shoot.html.includes('does not hit the balls'), 'v14-95: NOW SHOOT IT offers MAKE / MISS');
  // set progress + emblems
  const doneState = { ...st0, pkfBankingSystems: { sections: Object.fromEntries(PB.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { passed: true, attempts: 1 } } };
  const rows = SP.readSetProgress(doneState).filter((r) => r.id.startsWith('pkfBank'));
  assert(rows.length === 2 && rows.every((r) => r.finished) && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfBank"') && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfBankExam"'), 'v14-95: profile progress + home emblems for course and exam');
  assert(!SP.readSetProgress(st0).some((r) => r.id.startsWith('pkfBank')), 'v14-95: no row before starting');
  // Dev Mode owner ON: locked sections + exam open as DEV PREVIEW, nothing saved
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const devList = screen([]).html;
  assert(!devList.includes('disabled data-pkfbank-section') && devList.includes('data-dev-open="1"') && DASH.renderLearn(['fundamentals'], st0).includes('data-pkfbank="exam" data-dev-open="1"'), 'v14-95: owner Dev Mode ON opens every section + exam');
  const prev = screen(['corner-bank-drill']);
  assert(prev.html.includes('data-dev-preview="1"') && PB.bankOf(prev.state).current?.dev, 'v14-95: locked section opens as DEV PREVIEW');
  const exPrev = screen(['exam']);
  assert(exPrev.html.includes('data-dev-preview="1"') && PB.bankOf(exPrev.state).current?.mode === 'exam', 'v14-95: locked exam opens as DEV PREVIEW');
  DEV.setDevModeOn(false);
  assert(screen([]).html.includes('disabled data-pkfbank-section="find-path-drill"'), 'v14-95: owner Dev Mode OFF keeps locks');
  DEV.setDevModeOn(true);
  CL.setCurrentUserForTests(null);
}


// ---------------------------------------------------------------- v14-97: PKF Cue Ball Control Course (Drill Sets & Exams)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfCueBallCourse.test.mjs')], { encoding: 'utf8' });
  assert(run.status === 0 && /ALL pkfCueBallCourse TESTS PASSED/.test(run.stdout), `v14-97: scripts/pkfCueBallCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout}\n${run.stderr}`}`);
  const CB = await import(js('content/pkfCueBallCourse.js'));
  const CBP = await import(js('ui/pkfCueBallPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = CBP.createPkfCueBallScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, typeof v === 'object' && v ? { dataset: v } : { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(['js/content/pkfCueBallAssets.js', 'js/content/pkfCueBallCourse.js', 'js/ui/pkfCueBallPlay.js', 'images/pkf-cb/PKF_CueBall_PDF_037.jpg', 'images/pkf-cb/PKF_CueBall_PDF_150.jpg'].every((f) => swSrc.includes(`'./${f}'`)), 'v14-97: service worker precaches cue-ball course + original JPEGs');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-97: CACHE bumped to pool-iq-v14-119');
  assert(appSrc.includes("name === 'pkfcb'") && appSrc.includes("pkfcb: 'learn'"), 'v14-97: #pkfcb routes under the Learn tab (v14-113)');
  assert(!('pkfCueBallControl' in st0), 'v14-97: state.pkfCueBallControl is not in defaultState');
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  assert(courses.includes('data-pkfcb="course"') && courses.includes('PKF Cue Ball Control Course') && courses.includes('data-pkfcb-locked="1"'), 'v14-97: Learn > Fundamentals lists course + locked exam');
  {
    const at = ['data-pkffund="course"', 'data-pkfsmcb="course"', 'data-pkfcb="course"', 'data-pkfkick="course"', 'data-pkfbank="course"'].map((k) => courses.indexOf(k));
    assert(at.every((v, i) => v >= 0 && (i === 0 || v > at[i - 1])), 'v14-100: PKF courses ordered Fundamentals → Shot Making & Center Ball → Cue Ball Control → Kicking → Banking');
  }
  assert(!DASH.renderDrillsPage(st0).includes('pkfcb') && !DASH.renderArcade(st0).includes('pkfcb') && !DASH.renderLearn([]).includes('pkfcb'), 'v14-97: not on All, Table Games or Learn');
  CL.setCurrentUserForTests(null);
  const list = screen([]).html;
  assert(list.includes('data-pkfcb-home="1"') && list.includes('disabled data-pkfcb-section="half-table"') && list.includes('data-pkfcb-exam-locked="1"'), 'v14-97: list shows locks');
  assert(!/not on all|career xp|storage key/i.test(list), 'v14-97: no internal notes in UI');
  const learn = screen(['sliding-cue-ball']);
  assert(learn.html.includes('data-pkfcb-play="1"') && learn.html.includes('images/pkf-cb/PKF_CueBall_PDF_061.jpg') && learn.html.includes('VIEW FULL PKF EXAMPLE') && learn.html.includes('pkfcb-ack'), 'v14-97: LEARN shows original PKF page');
  const q = screen(['sliding-cue-ball'], st0, [['pkfcb-ack'], ['pkfcb-next']]);
  assert(q.html.includes('data-action="pkfcb-lock" disabled') && !q.html.includes('data-pkfcb-sol') && q.html.includes('data-pkfcb-hint="1"'), 'v14-97: question LOCK disabled; solution hidden; GUIDED hint');
  const picked = screen(['sliding-cue-ball'], q.state, [['pkfcb-choice', '45']]);
  assert(picked.html.includes('data-action="pkfcb-lock" ') && !picked.html.includes('data-action="pkfcb-lock" disabled'), 'v14-97: choice enables LOCK');
  const locked = screen(['sliding-cue-ball'], picked.state, [['pkfcb-lock']]);
  assert(locked.html.includes('data-pkfcb-verdict="wrong"') && locked.html.includes('data-pkfcb-sol="1"') && locked.html.includes('PKF SOLUTION'), 'v14-97: LOCK reveals PKF solution');
  const doneState = { ...st0, pkfCueBallControl: { sections: Object.fromEntries(CB.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { passed: true, attempts: 1 } } };
  const rows = SP.readSetProgress(doneState).filter((r) => r.id.startsWith('pkfCueBall'));
  assert(rows.length === 2 && rows.every((r) => r.finished) && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfCueBall"') && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfCueBallExam"'), 'v14-97: profile progress + home emblems');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const prev = screen(['full-table']);
  assert(prev.html.includes('data-dev-preview="1"') && CB.courseOf(prev.state).current?.dev, 'v14-97: locked section DEV PREVIEW');
  const exPrev = screen(['exam']);
  assert(exPrev.html.includes('data-dev-preview="1"') && CB.courseOf(exPrev.state).current?.mode === 'exam', 'v14-97: locked exam DEV PREVIEW');
  DEV.setDevModeOn(false);
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-98: PKF Fundamentals Course (Drill Sets & Exams)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfFundamentalsCourse.test.mjs')], { encoding: 'utf8' });
  assert(run.status === 0 && /ALL pkfFundamentalsCourse TESTS PASSED/.test(run.stdout), `v14-98: scripts/pkfFundamentalsCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout}\n${run.stderr}`}`);
  const PF = await import(js('content/pkfFundamentalsCourse.js'));
  const PFP = await import(js('ui/pkfFundPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = PFP.createPkfFundScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, typeof v === 'object' && v ? { dataset: v } : { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(['js/content/pkfFundAssets.js', 'js/content/pkfFundamentalsCourse.js', 'js/ui/pkfFundPlay.js', 'images/pkf-fund/PKF_Fundamentals_PDF_009.jpg', 'images/pkf-fund/PKF_Fundamentals_PDF_034.jpg'].every((f) => swSrc.includes(`'./${f}'`)), 'v14-98: service worker precaches fundamentals course + original JPEGs');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-98: CACHE bumped to pool-iq-v14-119');
  assert(appSrc.includes("name === 'pkffund'") && appSrc.includes("pkffund: 'learn'"), 'v14-98: #pkffund routes under the Learn tab (v14-113)');
  assert(!('pkfFundamentals' in st0), 'v14-98: state.pkfFundamentals is not in defaultState');
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  assert(courses.includes('data-pkffund="course"') && courses.includes('PKF Fundamentals Course') && courses.includes('data-pkffund-locked="1"'), 'v14-98: Learn > Fundamentals lists course + locked exam');
  assert(courses.indexOf('data-pkffund="course"') < courses.indexOf('data-pkfbank="course"'), 'v14-98: listed before the other PKF courses');
  assert(!DASH.renderDrillsPage(st0).includes('pkffund') && !DASH.renderArcade(st0).includes('pkffund') && !DASH.renderLearn([]).includes('pkffund'), 'v14-98: not on All, Table Games or Learn');
  CL.setCurrentUserForTests(null);
  const list = screen([]).html;
  assert(list.includes('data-pkff-home="1"') && list.includes('disabled data-pkff-section="stance"') && list.includes('data-pkff-exam-locked="1"') && list.includes('data-pkff-area="bridges"'), 'v14-98: list shows areas + locks');
  assert(!/not on all|career xp|storage key/i.test(list), 'v14-98: no internal notes in UI');
  const learn = screen(['shooting-line']);
  assert(learn.html.includes('data-pkff-play="1"') && learn.html.includes('images/pkf-fund/PKF_Fundamentals_PDF_011.jpg') && learn.html.includes('VIEW FULL PKF PAGE') && learn.html.includes('pkff-ack'), 'v14-98: LEARN shows original PKF page');
  const q = screen(['shooting-line'], st0, [['pkff-ack'], ['pkff-next'], ['pkff-ack'], ['pkff-next']]);
  assert(q.html.includes('data-action="pkff-lock" disabled') && !q.html.includes('data-pkff-sol') && q.html.includes('data-pkff-hint="1"'), 'v14-98: question LOCK disabled; explanation hidden; GUIDED hint');
  const picked = screen(['shooting-line'], q.state, [['pkff-choice', 'contact']]);
  assert(!picked.html.includes('data-action="pkff-lock" disabled'), 'v14-98: choice enables LOCK');
  const locked = screen(['shooting-line'], picked.state, [['pkff-lock']]);
  assert(locked.html.includes('data-pkff-verdict="wrong"') && locked.html.includes('Review This Concept') && locked.html.includes('data-pkff-sol="1"'), 'v14-98: LOCK reveals PKF explanation');
  assert(PF.reviewIds(PF.courseOf(locked.state)).includes('sl-q-ghost'), 'v14-98: missed check → REVIEW FUNDAMENTALS');
  const doneState = { ...st0, pkfFundamentals: { sections: Object.fromEntries(PF.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { passed: true, attempts: 1 } } };
  const rows = SP.readSetProgress(doneState).filter((r) => r.id.startsWith('pkfFund'));
  assert(rows.length === 2 && rows.every((r) => r.finished) && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfFund"') && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfFundExam"'), 'v14-98: profile progress + home emblems');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const prev = screen(['tight-spots']);
  assert(prev.html.includes('data-dev-preview="1"') && PF.courseOf(prev.state).current?.dev, 'v14-98: locked section DEV PREVIEW');
  const exPrev = screen(['exam']);
  assert(exPrev.html.includes('data-dev-preview="1"') && PF.courseOf(exPrev.state).current?.mode === 'exam', 'v14-98: locked exam DEV PREVIEW');
  DEV.setDevModeOn(false);
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-99: PKF Cue Ball captions = printed page once; PLAN figure crops
{
  const fsMod = await import('fs');
  const CB = await import(js('content/pkfCueBallCourse.js'));
  const CBA = await import(js('content/pkfCueBallAssets.js'));
  const CBP = await import(js('ui/pkfCueBallPlay.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-99: CACHE bumped to pool-iq-v14-119');
  assert(CBA.PAGES[77].printed === 58 && CBA.PAGES[72].printed === 55 && CBA.PAGES[150].printed === 128 && CBA.PAGES[75].printed == null, 'v14-99: printed pages follow the JPEG "Page:" footers (inserts unnumbered)');
  const ids = [...CB.LESSONS, ...CB.EXAM_ITEMS].map((l) => l.id);
  const cites = ids.flatMap((id) => [CB.figureHTML(id), CB.revealFigureHTML(id)]).join('').match(/<p class="pkfbCite[^>]*>[^<]*<\/p>/g) || [];
  assert(cites.length > ids.length && cites.every((c) => /^<p class="pkfbCite muted small">PKF (page \d+|[A-Z][^·<]*divider) · tap to enlarge<\/p>$/.test(c)), 'v14-99: every cue-ball caption is "PKF page <printed> · tap to enlarge" (no duplicate page)');
  const passedPrior = Object.fromEntries(['center-ball', 'sliding-cue-ball'].map((id) => [id, { passed: true }]));
  const item = { locked: false, choice: null, correct: null, revealed: false, execution: null, attempts: [], done: false, hint: false, planChoices: {} };
  let s = { ...storage.defaultState(), pkfCueBallControl: { sections: passedPrior, current: { mode: 'section', sectionId: 'half-table', cursor: 0, view: 0, phase: 'play', order: ['ht-plan-3'], items: { 'ht-plan-3': { ...item } } } } };
  const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
  const sc = CBP.createPkfCueBallScreen(ctx, ['half-table']);
  sc.render();
  const h = ctx.root.innerHTML;
  assert(h.includes('data-pkfcb-fig="f77-5-1"') && h.includes('PKF page 58 · tap to enlarge') && !/PKF page 63|page 63 ·/.test(h), 'v14-99: Half Table Plan shows figure 5-1 crop captioned PKF page 58');
  assert(h.includes('VIEW FULL PKF EXAMPLE') && h.includes('PKF_CueBall_PDF_077.jpg') && !h.includes('PKF_CueBall_PDF_078.jpg') && !h.includes('data-pkfcb-sol'), 'v14-99: View Full PKF Example offered; pattern solution (PDF 78) hidden before LOCK');
  assert(CB.assetOf('ft-plan-5-8').key === 'f107-6-1' && CB.assetOf('ft-plan-9').key === 'f141-6-133', 'v14-99: full-table PLAN figures crop to the layout only (printed solutions hidden pre-LOCK)');
}

// ---------------------------------------------------------------- v14-100: PKF Shot Making & Center Ball Course (Center Ball moved out of Cue Ball Control)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfShotMakingCourse.test.mjs')], { encoding: 'utf8' });
  assert(run.status === 0 && /ALL pkfShotMakingCourse TESTS PASSED/.test(run.stdout), `v14-100: scripts/pkfShotMakingCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n')}\n${run.stderr}`}`);
  const run2 = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfCueBallCourse.test.mjs')], { encoding: 'utf8' });
  assert(run2.status === 0 && /ALL pkfCueBallCourse TESTS PASSED/.test(run2.stdout), 'v14-100: scripts/pkfCueBallCourse.test.mjs passes after the split');
  const SM = await import(js('content/pkfShotMakingCourse.js'));
  const SMP = await import(js('ui/pkfShotMakingPlay.js'));
  const CB = await import(js('content/pkfCueBallCourse.js'));
  const CBP = await import(js('ui/pkfCueBallPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const DEV = await import(js('dev/dev.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = SMP.createPkfShotMakingScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-100: CACHE bumped to pool-iq-v14-119');
  const imgs = Array.from({ length: 24 }, (_, i) => `images/pkf-smcb/PKF_CenterBall_PDF_${String(35 + i).padStart(3, '0')}.jpg`);
  assert(['js/content/pkfShotMakingAssets.js', 'js/content/pkfShotMakingCourse.js', 'js/ui/pkfShotMakingPlay.js', ...imgs].every((f) => swSrc.includes(`'./${f}'`) && fsMod.existsSync(path.join(root, f))), 'v14-100: service worker precaches the course + all 24 original JPEGs');
  assert(appSrc.includes("name === 'pkfsmcb'") && appSrc.includes("pkfsmcb: 'learn'") && appSrc.includes('migrateShotMakingFromCueBall(st0)'), 'v14-100: #pkfsmcb routes under Learn (v14-113); boot runs the one-time migration');
  assert(!(SM.STORAGE_KEY in st0), 'v14-100: state.pkfShotMakingCenterBall is not in defaultState');
  CL.setCurrentUserForTests(null);
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  assert(courses.includes('data-pkfsmcb="course"') && courses.includes('PKF Shot Making &amp; Center Ball Course') && courses.includes('data-pkfsmcb-locked="1"'), 'v14-100: Learn > Fundamentals lists the course + a locked exam');
  assert(!DASH.renderDrillsPage(st0).includes('pkfsmcb') && !DASH.renderArcade(st0).includes('pkfsmcb') && !DASH.renderLearn([]).includes('pkfsmcb'), 'v14-100: not on All, Table Games or Learn');
  const home = screen([]).html;
  assert(home.includes('data-pkfsm-home="1"') && home.includes('disabled data-pkfsm-section="elevation-variables"') && home.includes('data-pkfsm-exam-locked="1"') && home.includes('data-pkfsm-stats="1"'), 'v14-100: home shows stats, order locks and locked exam');
  const learn = screen(['center-vs-sidespin']);
  assert(learn.html.includes('data-pkfsm-learn="1"') && learn.html.includes('images/pkf-smcb/PKF_CenterBall_PDF_037.jpg') && learn.html.includes('VIEW FULL PKF PAGE') && learn.html.includes('PKF page 23 · tap to enlarge'), 'v14-100: LEARN shows the original PKF page, captioned with the printed page');
  const q = screen(['center-vs-sidespin'], st0, [['pkfsm-ack'], ['pkfsm-next'], ['pkfsm-ack'], ['pkfsm-next']]);
  assert(q.html.includes('data-lesson="smcb-q-line"') && q.html.includes('data-action="pkfsm-lock" disabled') && !q.html.includes('data-pkfsm-sol') && !q.html.includes('VIEW FULL PKF PAGE') && !q.html.includes('data-pkfsm-verdict') && q.html.includes('data-pkfsm-hint="1"'), 'v14-100: question: LOCK disabled, no answer / solution / full page before lock, GUIDED hint');
  const locked = screen(['center-vs-sidespin'], q.state, [['pkfsm-choice', 'left'], ['pkfsm-lock']]);
  assert(locked.html.includes('data-pkfsm-verdict="wrong"') && locked.html.includes('REVIEW CONCEPT') && locked.html.includes('SHOW PKF SOLUTION') && !locked.html.includes('data-pkfsm-sol'), 'v14-100: LOCK → REVIEW CONCEPT, solution behind SHOW PKF SOLUTION');
  const sol = screen(['center-vs-sidespin'], locked.state, [['pkfsm-solution']]);
  assert(sol.html.includes('data-pkfsm-sol="1"') && sol.html.includes('PKF SOLUTION · ORIGINAL PAGE'), 'v14-100: SHOW PKF SOLUTION opens explanation + original page');
  const item = { locked: false, choice: null, correct: null, solution: false, hint: false, shooting: false, attempts: [], execution: null, done: false };
  const atShot = (id, sec) => ({ ...st0, pkfShotMakingCenterBall: { ...SM.blank(), unlockAll: true, current: { mode: 'section', sectionId: sec, cursor: 0, view: 0, phase: 'play', order: [id], items: { [id]: { ...item } } } } });
  const setup = screen(['high-action'], atShot('smcb-shoot-high', 'high-action'));
  assert(setup.html.includes('data-pkfsm-setup="action"') && setup.html.includes('SET UP THIS SHOT') && setup.html.includes('data-action="pkfsm-shoot"'), 'v14-100: physical exercise starts with SET UP THIS SHOT');
  const shoot = screen(['high-action'], setup.state, [['pkfsm-shoot']]);
  assert(['SHOT MADE + CORRECT ACTION', 'SHOT MADE + INCORRECT ACTION', 'SHOT MISSED'].every((t) => shoot.html.includes(t)) && shoot.html.includes('data-pkfsm-left="3"'), 'v14-100: NOW SHOOT IT: three result buttons + attempts left');
  const tried = screen(['high-action'], shoot.state, [['pkfsm-attempt', 'madeWrong'], ['pkfsm-attempt', 'madeCorrect']]);
  assert(tried.html.includes('data-pkfsm-exec="success"') && SM.courseOf(tried.state).stats.secondTry === 1, 'v14-100: success on attempt 2 recorded');
  const last = screen(['high-action'], tried.state, [['pkfsm-next']]);
  assert(last.html.includes('data-pkfsm-results="1"') && screen(['high-action'], last.state).html.includes('data-pkfsm-results="1"'), 'v14-100: finishing a run shows (and keeps) its results screen');
  const chk = screen(['finding-center'], atShot('smcb-shoot-rail', 'finding-center'));
  assert(chk.html.includes('Not specified in PKF') && screen(['finding-center'], chk.state, [['pkfsm-shoot']]).html.includes('CORRECT ACTION'), 'v14-100: drills without a stated pocket score the action only and say "Not specified in PKF"');
  // Cue Ball Control now starts at Sliding Cue Ball and links back for Center Ball skills.
  let cs = st0;
  const cctx = { getState: () => cs, commit: (n) => (cs = n), root: { innerHTML: '', querySelector: () => null } };
  const cbHome = CBP.createPkfCueBallScreen(cctx, []); cbHome.render();
  assert(cctx.root.innerHTML.includes('data-pkfcb-section="sliding-cue-ball"') && !cctx.root.innerHTML.includes('center-ball') && cctx.root.innerHTML.includes('data-pkfcb-prereq-course="1"'), 'v14-100: Cue Ball Control home starts at Sliding Cue Ball with a prerequisite-course card');
  const cbIntro = CBP.createPkfCueBallScreen(cctx, ['sliding-cue-ball']); cbIntro.render();
  assert(cctx.root.innerHTML.includes('data-pkfcb-prereq="smcb-stop-physics"') && cctx.root.innerHTML.includes('#pkfsmcb/lesson/smcb-stop-physics') && cctx.root.innerHTML.includes('REVIEW SKILL'), 'v14-100: Sliding intro shows the Stop Shot PREREQUISITE SKILL card');
  const single = screen(['lesson', 'smcb-stop-physics']);
  assert(single.html.includes('data-pkfsm-single="1"') && single.html.includes('data-lesson="smcb-stop-physics"') && !Object.keys(SM.courseOf(single.state).lessons).length, 'v14-100: REVIEW SKILL opens the one lesson, ungraded');
  // Migration of an existing Center Ball player.
  const legacy = { ...st0, pkfCueBallControl: { sections: { 'center-ball': { passed: true, knowledgeCorrect: 10, knowledgeTotal: 11, missed: ['cb-throw-q'], missedPos: [] } }, current: null, exam: { attempts: 0, weak: {} }, stats: {} } };
  const mh = screen([], legacy);
  assert(mh.html.includes('data-pkfsm-migrated="1"') && mh.state.pkfShotMakingCenterBall?.migratedFromCueBall && mh.state.pkfCueBallControl.sections['center-ball'], 'v14-100: screen commits the one-time migration; old data kept');
  assert(SM.SECTIONS.every((s) => mh.html.includes(`data-pkfsm-section="${s.id}"`) && !mh.html.includes(`disabled data-pkfsm-section="${s.id}"`)), 'v14-100: a player who passed old Center Ball has every section open');
  assert(SM.migrateFromCueBall(mh.state) === mh.state, 'v14-100: migration is idempotent on the committed state');
  const doneState = { ...st0, pkfShotMakingCenterBall: { ...SM.blank(), sections: Object.fromEntries(SM.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { ...SM.blank().exam, passed: true, attempts: 1 } } };
  const rows = SP.readSetProgress(doneState).filter((r) => r.id.startsWith('pkfShotMaking'));
  assert(rows.length === 2 && rows.every((r) => r.finished) && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfShotMaking"') && SP.completedSetsLineHTML(doneState).includes('data-set-emblem="pkfShotMakingExam"'), 'v14-100: profile progress + home emblems');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const prev = screen(['automatic-aiming']);
  assert(prev.html.includes('data-dev-preview="1"') && SM.courseOf(prev.state).current?.dev, 'v14-100: locked section DEV PREVIEW');
  const exPrev = screen(['exam']);
  assert(exPrev.html.includes('data-dev-preview="1"') && SM.courseOf(exPrev.state).current?.mode === 'exam', 'v14-100: locked exam DEV PREVIEW');
  DEV.setDevModeOn(false);
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-101: Drill Sets & Exams in three groups
{
  const DASH = await import(js('dashboard.js'));
  const CL = await import(js('cloud/client.js'));
  const swSrc = (await import('fs')).readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-101: CACHE bumped to pool-iq-v14-119');
  CL.setCurrentUserForTests(null);
  const html = DASH.renderCoursesPage(storage.defaultState());
  // v14-113: PKF moved to Learn > Fundamentals. Drill Sets & Exams keeps BU EXAMS and OTHER only.
  const groups = ['bu', 'other'].map((k) => html.indexOf(`data-ds-group="${k}"`));
  assert(groups.every((v, i) => v >= 0 && (i === 0 || v > groups[i - 1])) && !html.includes('data-ds-group="pkf"'), 'v14-101/113: groups BU EXAMS → OTHER; no PKF group');
  assert(html.includes('<b>BU EXAMS</b>') && !html.includes('<b>PKF</b>') && html.includes('<b>OTHER DRILL SETS &amp; EXAMS</b>'), 'v14-101/113: group headers are labeled (no PKF)');
  const part = (k) => { const a = html.indexOf(`data-ds-group="${k}"`); const rest = html.slice(a + 1); const b = rest.search(/data-ds-group="/); return b < 0 ? rest : rest.slice(0, b); };
  const tiles = (src) => [...src.matchAll(/<(?:button|div) [^>]*class="card simPromo[^"]*"[^>]*>[\s\S]*?<b>([\s\S]*?)<\/b>/g)].map((m) => m[1]);
  const bu = tiles(part('bu')), other = tiles(part('other'));
  assert(bu.join('|') === ['Exam I – Fundamentals', 'Exam II – Skills, Bachelors', 'Exam II – Skills Masters', 'Exam II – Skills, Doctorate', 'Exam III – Advanced Shots', 'Runout Drill System (RDS)', 'Exam V – Placement Pool Challenge', 'Exam VI – Safety Challenge', 'Exam VII – Draw Matrix', 'Exam VIII – Follow Matrix'].join('|'), 'v14-101: BU EXAMS holds every Billiard University exam in order (RDS is Exam IV)');
  assert(other.join('|') === ['Safety Master', 'Ball Pocketing', 'Off the Rail', 'Off the Rail Exam', 'Trick Shot Course', 'Trick Shot Exam'].join('|'), 'v14-101: OTHER keeps the old relative order');
  const all = tiles(html);
  assert(all.length === 16 && new Set(all).size === all.length && !all.some((t) => /^PKF /.test(t)), 'v14-113: Drill Sets & Exams has 16 tiles, none PKF');
  const hrefs = ['#buexam', '#buexam/bachelors', '#buexam/masters', '#buexam/doctorate', '#buexam/advanced', '#buexam/rds', '#buexam/ppc', '#buexam/safety', '#buexam/draw', '#buexam/follow', '#safety', '#bpset', '#kicking', '#trick'];
  assert(hrefs.every((h) => html.includes(`data-href="${h}"`)) && !/data-href="#pkf/.test(html), 'v14-101/113: tiles keep their routes; no PKF route on Drill Sets');
  assert(['bu', 'other'].every((k) => html.includes(`<details class="dsGroup" data-ds-group="${k}">`)) && !/<details class="dsGroup"[^>]*\bopen\b/.test(html), 'v14-102: both groups start collapsed');
  assert(!html.includes('data-ds-start') && !/NEW HERE\?/.test(html), 'v14-113: no NEW HERE? / Start with PKF Fundamentals card on Drill Sets & Exams');
  const head = (k) => (html.match(new RegExp(`data-ds-group="${k}"><summary[\\s\\S]*?</summary>`)) || [''])[0];
  assert(/<span class="dsGroupLead">For intermediate players<\/span><small>Billiard University · Dr\. Dave<\/small>/.test(head('bu')), 'v14-104: BU EXAMS header reads For intermediate players / Billiard University · Dr. Dave');
  assert(!/<small>|dsGroupLead/.test(head('other')) && !/Recommended for beginners|Recommended after PKF/.test(html), 'v14-104: OTHER header unchanged; rejected wordings absent');
}

// ---------------------------------------------------------------- v14-102: PKF SKIP TABLE STEP + Drill XP for recorded table steps
{
  const swSrc = (await import('fs')).readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-102: CACHE bumped to pool-iq-v14-119');
  assert(swSrc.includes("'./js/content/pkfTableStep.js'"), 'v14-102: pkfTableStep.js precached');
  const TS = await import(js('content/pkfTableStep.js'));
  assert(TS.SKIP_LABEL === 'SKIP TABLE STEP' && TS.tableStepItem('k', 'C', { id: 'x' }).tier === 'intermediate', 'v14-102: skip label + table step = default (difficulty 3) drill');
  const st0 = { pkfX: { tableXp: {}, stats: {} } };
  const r1 = TS.awardRecordedStep(st0, 'pkfX', 'C', { id: 'a', title: 'A' }, { ratio: 1, passed: true });
  const r2 = TS.awardRecordedStep(r1.state, 'pkfX', 'C', { id: 'b', title: 'B' }, { ratio: 0, passed: false });
  assert(r1.drill === 135 && r2.drill === 0 && r2.state.prog.drillXp === 135, 'v14-102: first-try step 135 Drill XP, miss 0');
  assert(!r2.state.prog.lifetimeXp && !Object.keys(r2.state.prog.items || {}).length, 'v14-102: no Lifetime XP, no Drill Rank mastery records');
  const CBC = await import(js('content/pkfCueBallCourse.js'));
  const tile = CBC.pkfCueBallBannersHTML(storage.defaultState());
  assert(tile.includes('sections: sliding cue ball, half-table and full-table patterns. Builds on the Shot Making & Center Ball Course.') && !tile.includes('from PKF Pattern Play'), 'v14-102: Cue Ball Control tile no longer says "from PKF Pattern Play"');
  const mods = ['pkfKickingCourse', 'pkfBankingCourse', 'pkfCueBallCourse', 'pkfFundamentalsCourse', 'pkfShotMakingCourse', 'pkfPatternPlayCourse', 'pkfAdvancedPlaySafetyCourse'];
  for (const m of mods) {
    const M = await import(js(`content/${m}.js`));
    assert(typeof M.skipTableStep === 'function' && typeof M.skippedIds === 'function', `v14-102: ${m} has SKIP TABLE STEP`);
  }
}

// ---------------------------------------------------------------- v14-105: restore crash fix (VALIDATE had no poolIQRuleSet entry)
{
  const swSrc = (await import('fs')).readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-105: CACHE bumped to pool-iq-v14-119');
  const VR = await import(js('vault.js'));
  const SY = await import(js('cloud/sync.js'));
  assertAll('v14-105: every DATA_KEYS entry has a backup validator', VR.DATA_KEYS.filter((k) => !VR.hasValidator(k)));
  assert(VR.hasValidator('poolIQRuleSet') && VR.hasValidator('poolIQShotTimer'), 'v14-105: poolIQRuleSet and poolIQShotTimer have validators');
  const rules = { 8: 'wpa', 9: 'bca', 10: 'apa', open: true };
  const bk = { format: 'pool-iq-backup', schema: 1, appVersion: '14', exportedAt: '2026-10-05T00:00:00Z', keys: { poolIQStateV4: storage.defaultState(), poolIQRuleSet: rules, poolIQShotTimer: { on: true } } };
  let pr = null; let err = '';
  try { pr = VR.parseBackup(JSON.stringify(bk)); } catch (e) { err = e.message; }
  assert(pr && pr.keys.poolIQRuleSet === JSON.stringify(rules) && pr.keys.poolIQShotTimer && pr.keys.poolIQStateV4 && !pr.dropped.length, `v14-105: parseBackup accepts a backup with poolIQRuleSet (file restore) ${err}`);
  let pr2 = null; err = '';
  try { pr2 = VR.parseBackup(JSON.stringify({ ...bk, keys: { ...bk.keys, poolIQRuleSet: JSON.stringify(rules) } })); } catch (e) { err = e.message; }
  assert(pr2 && pr2.keys.poolIQRuleSet === JSON.stringify(rules), `v14-105: parseBackup accepts poolIQRuleSet stored as a JSON string ${err}`);
  let pr3 = null; err = '';
  try { pr3 = VR.parseBackup(JSON.stringify({ ...bk, keys: { ...bk.keys, poolIQRuleSet: [1, 2] } })); } catch (e) { err = e.message; }
  assert(pr3 && !pr3.keys.poolIQRuleSet && pr3.dropped.includes('poolIQRuleSet') && pr3.keys.poolIQStateV4, `v14-105: a damaged poolIQRuleSet is dropped, the rest restores ${err}`);
  let cs = null; err = '';
  try { cs = SY.parseCloudSave({ data: bk, updated_at: '2026-10-05T01:00:00Z', device_id: 'dev-x', device_label: 'iPhone', local_saved_at: 1 }); } catch (e) { err = e.message; }
  assert(cs && cs.keys.poolIQRuleSet === JSON.stringify(rules) && cs.deviceLabel === 'iPhone', `v14-105: Restore from Cloud (parseCloudSave) accepts a cloud row with poolIQRuleSet ${err}`);
}

// ---------------------------------------------------------------- v14-106: PKF Pattern Play Course + Exam (#pkfpattern)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfPatternPlayCourse.test.mjs')], { encoding: 'utf8', maxBuffer: 1 << 26 });
  assert(run.status === 0 && /ALL pkfPatternPlayCourse TESTS PASSED/.test(run.stdout), `v14-106: scripts/pkfPatternPlayCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n')}\n${run.stderr}`}`);
  const PP = await import(js('content/pkfPatternPlayCourse.js'));
  const PPP = await import(js('ui/pkfPatternPlayPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  const DEV = await import(js('dev/dev.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = PPP.createPkfPatternPlayScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-106: CACHE bumped to pool-iq-v14-119');
  const imgs = Array.from({ length: 84 }, (_, i) => `images/pkf-pattern/PKF_PatternPlay_PDF_${String(75 + i).padStart(3, '0')}.jpg`);
  assert(['js/content/pkfPatternPlayAssets.js', 'js/content/pkfPatternPlayCourse.js', 'js/ui/pkfPatternPlayPlay.js', ...imgs].every((f) => swSrc.includes(`'./${f}'`) && fsMod.existsSync(path.join(root, f))), 'v14-106: service worker precaches the course + all 84 original JPEGs');
  assert(appSrc.includes("name === 'pkfpattern'") && appSrc.includes("pkfpattern: 'learn'"), 'v14-106: #pkfpattern routes under Learn (v14-113)');
  assert(!(PP.STORAGE_KEY in st0) && PP.STORAGE_KEY === 'pkfPatternPlay', 'v14-106: state.pkfPatternPlay is not in defaultState');
  assert(fsMod.existsSync(path.join(root, 'docs', 'PKF_PATTERN_PLAY_SOURCE_MAP.md')), 'v14-106: docs/PKF_PATTERN_PLAY_SOURCE_MAP.md');
  CL.setCurrentUserForTests(null);
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  const at = (k) => courses.indexOf(k);
  assert(at('data-pkfpattern="course"') > at('data-pkfcb="exam"') && at('data-pkfpattern="exam"') > at('data-pkfpattern="course"') && at('data-href="#pkfkick"') > at('data-pkfpattern="exam"') && courses.includes('data-pkfpattern-locked="1"'), 'v14-106: Pattern Play tiles sit after Cue Ball Control, before Kicking; exam locked');
  assert(!DASH.renderDrillsPage(st0).includes('pkfpattern') && !DASH.renderArcade(st0).includes('pkfpattern') && !DASH.renderLearn([]).includes('pkfpattern'), 'v14-106: not on All, Table Games or Learn');
  const home = screen([]).html;
  assert(home.includes('data-pkfpp-home="1"') && home.includes('disabled data-pkfpp-section="four-ball"') && home.includes('data-pkfpp-exam-locked="1"') && home.includes('data-pkfpp-stats="1"'), 'v14-106: home shows stats, order locks and locked exam');
  const learn = screen(['three-ball']);
  assert(learn.html.includes('data-pkfpp-learn="1"') && learn.html.includes('images/pkf-pattern/PKF_PatternPlay_PDF_') && learn.html.includes('VIEW FULL PKF PAGE') && /PKF page \d+ · tap to enlarge/.test(learn.html), 'v14-106: LEARN shows the original PKF page with the printed page');
  const q = screen(['three-ball'], st0, [['pkfpp-ack'], ['pkfpp-next']]);
  assert(q.html.includes('data-action="pkfpp-lock" disabled') && q.html.includes('LOCK ANSWER') && !q.html.includes('data-pkfpp-sol') && !q.html.includes('VIEW FULL PKF PAGE') && !q.html.includes('data-pkfpp-verdict'), 'v14-106: question: LOCK disabled, nothing revealed before LOCK');
  const lid = PP.courseOf(q.state).current.order[1];
  const wrong = PP.lessonById(lid).choices.find((c) => c[0] !== PP.lessonById(lid).answer)[0];
  const locked = screen(['three-ball'], q.state, [['pkfpp-choice', wrong], ['pkfpp-lock']]);
  assert(locked.html.includes('data-pkfpp-verdict="wrong"') && !locked.html.includes('data-pkfpp-sol'), 'v14-106: LOCK → verdict; solution still behind SHOW PKF …');
  const sol = screen(['three-ball'], locked.state, [['pkfpp-solution']]);
  assert(sol.html.includes('data-pkfpp-sol="1"') && sol.html.includes('PKF SOLUTION · ORIGINAL PAGE'), 'v14-106: comparison opens PKF explanation + original page');
  const runL = PP.LESSONS.find((l) => PP.isPhysical(l) && l.physical.shots.length === 3);
  const atRun = { ...st0, pkfPatternPlay: { ...PP.blank(), current: { mode: 'section', sectionId: runL.section, cursor: 0, view: 0, phase: 'play', order: [runL.id], items: { [runL.id]: { locked: false, choice: null, build: [], correct: null, solution: false, hint: false, shooting: false, live: [], between: false, attempts: [], execution: null, skipped: false, done: false } } } } };
  const setup = screen([runL.section], atRun);
  assert(setup.html.includes('data-pkfpp-setup="1"') && setup.html.includes('NOW RUN THE PATTERN') && setup.html.includes('SKIP TABLE STEP'), 'v14-106: RUN starts with the original setup + SKIP TABLE STEP');
  const shot = screen([runL.section], setup.state, [['pkfpp-shoot'], ['pkfpp-shot', 'pos'], ['pkfpp-shot', 'lost']]);
  assert(shot.html.includes('data-pkfpp-between="1"') && shot.html.includes('SHOT 1 ✓') && shot.html.includes('PATTERN FAILED — POSITION LOST') && shot.html.includes('RESET / TRY AGAIN') && shot.html.includes('data-pkfpp-dots="miss empty empty"'), 'v14-106: shot-by-shot tracking, result + three attempt dots');
  const rows = SP.readSetProgress({ ...st0, pkfPatternPlay: { ...PP.blank(), sections: Object.fromEntries(PP.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { ...PP.blank().exam, passed: true, attempts: 1 } } }).filter((r) => r.id.startsWith('pkfPatternPlay'));
  assert(rows.length === 2 && rows.every((r) => r.finished), 'v14-106: course + exam emblem rows');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const prev = screen(['actual-games']);
  assert(prev.html.includes('data-dev-preview="1"') && PP.courseOf(prev.state).current?.dev, 'v14-106: locked section DEV PREVIEW');
  DEV.setDevModeOn(false);
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-107: PKF card at the top of Learn > Fundamentals
{
  const fsMod = await import('fs');
  const DASH = await import(js('dashboard.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-107: CACHE bumped to pool-iq-v14-119');
  const html = DASH.renderLearn(['fundamentals']);
  const at = html.indexOf('data-learn-pkf="pkffund"');
  const body = html.slice(html.indexOf('</h1>'));
  assert(at >= 0 && at < html.indexOf('Bridges') && at < html.indexOf('Stance and Stroke') && body.indexOf('<div class="card dsStart" data-learn-pkf="pkffund">') === 5, 'v14-107: PKF card is the first item in Learn > Fundamentals, above the topics');
  assert(/data-learn-pkf="pkffund"[\s\S]*?<span class="eyebrow">LEARN THE WHOLE GAME<\/span><b>Start with PKF Fundamentals<\/b><small>Build your game step by step, from the basics to an advanced player\.<\/small>[\s\S]*?data-action="go" data-href="#pkffund">OPEN<\/button>/.test(html), 'v14-107: card text + OPEN button links to #pkffund');
  assert(!DASH.renderLearn([]).includes('data-learn-pkf') && !DASH.renderLearn(['fundamentals', 'bridges']).includes('data-learn-pkf') && !DASH.renderLearn(['fundamentals', 'stance']).includes('data-learn-pkf') && !DASH.renderLearn(['play']).includes('data-learn-pkf'), 'v14-107: only the Fundamentals list gets the card');
}

// ---------------------------------------------------------------- v14-109: Learn page titles always fit the phone (no clipped "FUNDAMENTAL", no sideways scroll)
{
  const fsMod = await import('fs');
  const http = await import('http');
  const { createRequire } = await import('module');
  const LEARN = await import(js('learn.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const css = fsMod.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-109: CACHE bumped to pool-iq-v14-119');
  assert(/\.title\.learnPage > h1\{font-size:clamp\(\d+px,[\d.]+vw,\d+px\);max-width:100%/.test(css), 'v14-109: Learn titles size with clamp()+vw and never exceed the column');
  assert(typeof LEARN.fitLearnTitle === 'function' && typeof LEARN.fitLearnTitles === 'function' && LEARN.LEARN_TITLE_SEL === '.title.learnPage > h1', 'v14-109: learn.js exports the title fit-to-width helper');
  assert(LEARN.learnHTML(['fundamentals']).includes('<div class="title learnPage" data-page-learn>') && LEARN.learnHTML(['fundamentals']).includes('<h1>Fundamentals</h1>'), 'v14-109: Fundamentals title markup unchanged');
  // Real browser: Learn > Fundamentals at 320px and 390px (plus 375/430) — no horizontal overflow, title scrollWidth <= clientWidth
  let puppeteer = null;
  for (const d of [process.env.PUPPETEER_DIR, path.join(root, 'node_modules'), path.join(root, '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean)) {
    try { puppeteer = createRequire(path.join(d, 'x.js'))('puppeteer-core'); break; } catch {}
  }
  const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && fsMod.existsSync(p));
  if (!puppeteer || !chrome) {
    assert(false, 'v14-109: browser fit check needs puppeteer-core (PUPPETEER_DIR) and Chrome (CHROME_PATH)');
  } else {
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
    const server = http.createServer((req, res) => {
      let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (f.endsWith('/')) f += 'index.html';
      const fp = path.join(root, path.normalize(f));
      if (!fp.startsWith(root) || !fsMod.existsSync(fp) || fsMod.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream' });
      fsMod.createReadStream(fp).pipe(res);
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}/`;
    const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
    try {
      for (const w of [320, 375, 390, 430]) {
        const pg = await browser.newPage();
        await pg.setViewport({ width: w, height: 800, isMobile: true, hasTouch: true });
        let r = null; let err = '';
        for (let attempt = 0; attempt < 3 && !r; attempt++) try {
          // the first visit installs the service worker, which can reload the page once; retry if that happens mid-check
          err = '';
          await pg.goto(base + '#learn/fundamentals', { waitUntil: 'load', timeout: 30000 });
          await pg.waitForFunction(() => [...document.querySelectorAll('.title.learnPage > h1')].some((h) => h.clientWidth && h.textContent === 'Fundamentals'), { timeout: 15000 });
          await pg.evaluate(() => document.fonts.ready);
          await new Promise((res) => setTimeout(res, 300));
          r = await pg.evaluate(() => {
            const h = [...document.querySelectorAll('.title.learnPage > h1')].find((e) => e.clientWidth);
            const cs = getComputedStyle(h);
            return { docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, vw: innerWidth, sw: h.scrollWidth, cw: h.clientWidth, fs: parseFloat(cs.fontSize), tt: cs.textTransform, color: cs.color };
          });
        } catch (e) { err = e.message; }
        await pg.close();
        const must = w === 320 || w === 390;
        const ok = r && r.docW <= r.vw && r.bodyW <= r.vw && r.sw <= r.cw && r.fs >= 18 && r.tt === 'uppercase';
        assert(ok, `v14-109: ${w}px Learn > Fundamentals — no horizontal overflow, title scrollWidth <= clientWidth${must ? '' : ' (extra width)'} ${r ? JSON.stringify(r) : err}`);
      }
    } finally {
      await browser.close();
      server.close();
    }
  }
}

// ---------------------------------------------------------------- v14-112: 8/9/10-ball Table Games tiles redrawn in the original glossy style with correct racks
{
  const fsMod = await import('fs');
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const dash = fsMod.readFileSync(path.join(root, 'js', 'dashboard.js'), 'utf8');
  const fr = fsMod.readFileSync(path.join(root, 'js', 'ui', 'friends.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-112: CACHE bumped to pool-iq-v14-119');
  for (const [k, w, h] of [['8', 338, 323], ['9', 333, 323], ['10', 343, 301]]) {
    const f = `./icons/tg-${k}-v3.png`;
    const file = path.join(root, 'icons', `tg-${k}-v3.png`);
    const ok = fsMod.existsSync(file);
    const buf = ok ? fsMod.readFileSync(file) : null;
    assert(ok && buf.readUInt32BE(16) === w && buf.readUInt32BE(20) === h, `v14-112: ${f} exists at the original tile size ${w}x${h}`);
    assert(swSrc.includes(`'${f}'`) && !swSrc.includes(`'./icons/tg-${k}.png'`) && !swSrc.includes(`'./icons/tg-${k}-v2.png'`), `v14-112: sw.js precaches ${f} instead of the older tiles`);
    assert(dash.includes(`'${k}': '${f}'`) && fr.includes(`'${k}': '${f}'`) && !dash.includes(`tg-${k}-v2.png`) && !fr.includes(`tg-${k}-v2.png`), `v14-112: Table Games hub and Play with Friends use ${f}`);
  }
}

// ---------------------------------------------------------------- v14-111: PKF Advanced Play & Safety Course + Exam (#pkfadv)
{
  const { spawnSync } = await import('child_process');
  const fsMod = await import('fs');
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'pkfAdvancedPlaySafetyCourse.test.mjs')], { encoding: 'utf8', maxBuffer: 1 << 26 });
  assert(run.status === 0 && /ALL pkfAdvancedPlaySafetyCourse TESTS PASSED/.test(run.stdout), `v14-111: scripts/pkfAdvancedPlaySafetyCourse.test.mjs passes${run.status === 0 ? '' : `\n${run.stdout.split('\n').filter((l) => /FAIL/.test(l)).join('\n')}\n${run.stderr}`}`);
  const AP = await import(js('content/pkfAdvancedPlaySafetyCourse.js'));
  const APP = await import(js('ui/pkfAdvancedPlaySafetyPlay.js'));
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const CL = await import(js('cloud/client.js'));
  const G = await import(js('dev/gate.js'));
  const DEV = await import(js('dev/dev.js'));
  G.setDevBypass(() => DEV.isUnlocked());
  const st0 = storage.defaultState();
  const screen = (args, s0 = st0, acts = []) => {
    let s = s0;
    const ctx = { getState: () => s, commit: (n) => (s = n), root: { innerHTML: '', querySelector: () => null } };
    const sc = APP.createPkfAdvScreen(ctx, args);
    sc.render();
    for (const [a, v] of acts) sc.onAction(a, { dataset: v == null ? {} : { v: String(v) } });
    return { html: ctx.root.innerHTML, state: s };
  };
  const atLesson = (id) => {
    const l = AP.lessonById(id);
    const before = AP.SECTIONS.slice(0, AP.SECTIONS.findIndex((x) => x.id === l.section));
    let s = { ...st0, [AP.STORAGE_KEY]: { ...AP.blank(), sections: Object.fromEntries(before.map((x) => [x.id, { passed: true }])) } };
    s = AP.startSection(s, l.section);
    const cur = s[AP.STORAGE_KEY].current;
    cur.cursor = cur.view = cur.order.indexOf(id);
    return s;
  };
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-111: CACHE bumped to pool-iq-v14-119');
  const imgs = Array.from({ length: 66 }, (_, i) => `images/pkf-advanced/PKF_Advanced_PDF_${159 + i}.jpg`);
  assert(['js/content/pkfAdvancedPlayAssets.js', 'js/content/pkfAdvancedPlaySafetyCourse.js', 'js/ui/pkfAdvancedPlaySafetyPlay.js', ...imgs].every((f) => swSrc.includes(`'./${f}'`) && fsMod.existsSync(path.join(root, f))), 'v14-111: service worker precaches the course + all 66 original JPEGs (PDF 159–224)');
  assert(appSrc.includes("name === 'pkfadv'") && appSrc.includes("pkfadv: 'learn'"), 'v14-111: #pkfadv routes under Learn (v14-113)');
  assert(!(AP.STORAGE_KEY in st0) && AP.STORAGE_KEY === 'pkfAdvancedPlaySafety', 'v14-111: state.pkfAdvancedPlaySafety is not in defaultState');
  assert(fsMod.existsSync(path.join(root, 'docs', 'PKF_ADVANCED_PLAY_SAFETY_SOURCE_MAP.md')), 'v14-111: docs/PKF_ADVANCED_PLAY_SAFETY_SOURCE_MAP.md');
  CL.setCurrentUserForTests(null);
  const courses = DASH.renderLearn(['fundamentals'], st0); // v14-113: PKF list moved to Learn > Fundamentals
  const at = (k) => courses.indexOf(k);
  assert(at('data-pkfadv="course"') > at('data-pkfpattern="exam"') && at('data-pkfadv="exam"') > at('data-pkfadv="course"') && at('data-href="#pkfkick"') > at('data-pkfadv="exam"') && courses.includes('data-pkfadv-locked="1"'), 'v14-111: Advanced Play & Safety tiles sit after Pattern Play, before Kicking; exam locked');
  assert(!DASH.renderDrillsPage(st0).includes('pkfadv') && !DASH.renderArcade(st0).includes('pkfadv') && !DASH.renderLearn([]).includes('pkfadv'), 'v14-111: not on All, Table Games or Learn');
  const home = screen([]).html;
  assert(home.includes('data-pkfadv-home="1"') && home.includes('disabled data-pkfadv-section="backstroke"') && home.includes('data-pkfadv-exam-locked="1"') && home.includes('data-pkfadv-stats="1"'), 'v14-111: home shows stats, order locks and locked exam');
  const learnL = AP.lessonsFor('sliding-safeties').find((l) => l.type === 'LEARN');
  const learn = screen(['sliding-safeties'], atLesson(learnL.id));
  assert(learn.html.includes('data-pkfadv-learn="1"') && learn.html.includes('images/pkf-advanced/PKF_Advanced_PDF_') && learn.html.includes('VIEW FULL PKF PAGE') && /PKF page \d+ · tap to enlarge/.test(learn.html), 'v14-111: LEARN shows the original PKF page with the printed page');
  const q = screen(['sliding-safeties']);
  assert(q.html.includes('data-action="pkfadv-lock" disabled') && !q.html.includes('data-pkfadv-sol') && !q.html.includes('VIEW FULL PKF PAGE') && !q.html.includes('data-pkfadv-verdict'), 'v14-111: question: LOCK disabled, nothing revealed before LOCK');
  const lid = AP.courseOf(q.state).current.order[0];
  const wrong = AP.lessonById(lid).choices.find((c) => c[0] !== AP.lessonById(lid).answer)[0];
  const locked = screen(['sliding-safeties'], q.state, [['pkfadv-choice', wrong], ['pkfadv-lock']]);
  assert(locked.html.includes('data-pkfadv-verdict="wrong"') && !locked.html.includes('data-pkfadv-sol'), 'v14-111: LOCK → verdict; solution still behind SHOW PKF …');
  const sol = screen(['sliding-safeties'], locked.state, [['pkfadv-solution']]);
  assert(sol.html.includes('data-pkfadv-sol="1"') && sol.html.includes('PKF SOLUTION · ORIGINAL PAGE'), 'v14-111: comparison opens PKF explanation + original page');
  const safL = AP.lessonById('adv-ss-phys-endrail');
  const setup = screen([safL.section], atLesson(safL.id));
  assert(setup.html.includes('data-pkfadv-setup="1"') && setup.html.includes('NOW SHOOT IT') && setup.html.includes('SKIP TABLE STEP'), 'v14-111: table step starts with the original setup + SKIP TABLE STEP');
  const shot = screen([safL.section], setup.state, [['pkfadv-shoot'], ['pkfadv-result', 'partial']]);
  assert(['SAFETY SUCCESSFUL', 'PARTIAL SAFETY', 'SAFETY FAILED', 'SCRATCH'].every((t) => shot.html.includes(t)) && shot.html.includes('data-pkfadv-dots="miss empty empty"'), 'v14-111: safety results (not made/missed) + three attempt dots');
  const rows = SP.readSetProgress({ ...st0, pkfAdvancedPlaySafety: { ...AP.blank(), sections: Object.fromEntries(AP.SECTIONS.map((s) => [s.id, { passed: true }])), exam: { ...AP.blank().exam, passed: true, attempts: 1 } } }).filter((r) => r.id.startsWith('pkfAdvanced'));
  assert(rows.length === 2 && rows.every((r) => r.finished), 'v14-111: course + exam emblem rows');
  CL.setCurrentUserForTests({ id: 'owner-1', email: 'andrewaphay@gmail.com' });
  DEV.setDevModeOn(true);
  const prev = screen(['changing-path']);
  assert(prev.html.includes('data-dev-preview="1"') && AP.courseOf(prev.state).current?.dev, 'v14-111: locked section DEV PREVIEW');
  DEV.setDevModeOn(false);
  CL.setCurrentUserForTests(null);
}

// ---------------------------------------------------------------- v14-113: PKF courses + exams moved to Learn > Fundamentals; PKF cards say COURSE
{
  const fsMod = await import('fs');
  const DASH = await import(js('dashboard.js'));
  const CL = await import(js('cloud/client.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-113: CACHE bumped to pool-iq-v14-119');
  CL.setCurrentUserForTests(null);
  const st = storage.defaultState();
  const ds = DASH.renderCoursesPage(st);
  assert(!/data-href="#pkf/.test(ds) && !ds.includes('data-ds-group="pkf"') && !ds.includes('data-ds-start'), 'v14-113: Drill Sets & Exams has no PKF group, tiles or start card');
  assert(ds.includes('<h1>Drill Sets & Exams</h1>'), 'v14-113: Drill Sets & Exams page keeps its name');
  const learn = DASH.renderLearn(['fundamentals'], st);
  const iCard = learn.indexOf('data-learn-pkf="pkffund"'), iList = learn.indexOf('data-learn-pkf-list'), iBridges = learn.indexOf('#learn/fundamentals/bridges');
  assert(iCard >= 0 && iList > iCard && iBridges > iList, 'v14-113: PKF list sits under the Start with PKF Fundamentals card, above Bridges');
  assert(/<summary class="dsGroupHead"><span class="dsGroupText"><b>PKF<\/b><span class="dsGroupLead">Recommended for starters<\/span><small>The complete path from beginner to expert<\/small>/.test(learn), 'v14-113: PKF list header reads Recommended for starters / The complete path from beginner to expert');
  const list = learn.slice(iList);
  const cards = [...list.matchAll(/<(?:button|div) [^>]*class="card simPromo[^"]*"[^>]*>[\s\S]*?<span class="eyebrow">([^<]*)<\/span><b>([\s\S]*?)<\/b>/g)].map((m) => [m[1], m[2]]);
  const want = ['Fundamentals', 'Shot Making &amp; Center Ball', 'Cue Ball Control', 'Pattern Play', 'Advanced Play &amp; Safety', 'Kicking Systems', 'Banking Systems'].flatMap((n) => [['COURSE', `PKF ${n} Course`], ['EXAM', `PKF ${n} Exam`]]);
  assert(JSON.stringify(cards) === JSON.stringify(want), `v14-113: Learn > Fundamentals lists all 7 PKF courses (COURSE), each followed by its exam (EXAM), in curriculum order ${JSON.stringify(cards)}`);
  assert(!list.includes('>DRILL SET<'), 'v14-113: no DRILL SET label on PKF cards');
  for (const k of ['pkffund', 'pkfsmcb', 'pkfcb', 'pkfpattern', 'pkfadv', 'pkfkick', 'pkfbank']) assert(list.includes(`data-href="#${k}"`), `v14-113: #${k} route kept`);
  assert(/data-pkffund-locked="1"/.test(list) && /data-pkfbank-locked="1"/.test(list), 'v14-113: locked exams stay locked in the Learn list');
  assert(DASH.renderLearn(['fundamentals']).includes('<h1>Fundamentals</h1>') && !DASH.renderLearn(['fundamentals']).includes('data-learn-pkf-list'), 'v14-113: Learn renders without state too (no list)');
  assert(appSrc.includes('renderLearn(args, state)'), 'v14-113: app passes state to Learn');
  for (const k of ['pkfkick', 'pkfbank', 'pkfcb', 'pkffund', 'pkfsmcb', 'pkfpattern', 'pkfadv']) assert(appSrc.includes(`${k}: 'learn'`), `v14-113: #${k} highlights the Learn tab`);
  for (const f of ['pkfFundPlay', 'pkfShotMakingPlay', 'pkfCueBallPlay', 'pkfPatternPlayPlay', 'pkfAdvancedPlaySafetyPlay', 'pkfKickPlay', 'pkfBankPlay']) {
    const src = fsMod.readFileSync(path.join(root, 'js', 'ui', `${f}.js`), 'utf8');
    assert(src.includes('<span class="eyebrow">COURSE</span><h1>${esc(COURSE_TITLE)}</h1>') && !src.includes('eyebrow">DRILL SET'), `v14-113: ${f} course header says COURSE`);
    assert(src.includes('data-href="#learn/fundamentals">‹ Fundamentals</button>') && !src.includes('data-href="#courses"'), `v14-113: ${f} Back returns to Learn > Fundamentals`);
  }
  for (const f of ['kickingPlay', 'trickPlay']) {
    const src = fsMod.readFileSync(path.join(root, 'js', 'ui', `${f}.js`), 'utf8');
    assert(src.includes('<span class="eyebrow">DRILL SET</span>') && src.includes('data-href="#courses"'), `v14-113: ${f} (not PKF) keeps DRILL SET and Back to Drill Sets`);
  }
  assert(DASH.renderCoursesPage(st).includes('<span class="eyebrow">DRILL SET</span>'), 'v14-113: OTHER group keeps DRILL SET');
}

// ---------------------------------------------------------------- v14-114: PKF group in Learn starts folded; PKF cards show progress + emblems; Profile/Home show PKF under Learn
{
  const fsMod = await import('fs');
  const DASH = await import(js('dashboard.js'));
  const SP = await import(js('content/setProgress.js'));
  const CL = await import(js('cloud/client.js'));
  const FUND = await import(js('content/pkfFundamentalsCourse.js'));
  const SM = await import(js('content/pkfShotMakingCourse.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-114: CACHE bumped to pool-iq-v14-119');
  CL.setCurrentUserForTests(null);
  const st0 = storage.defaultState();
  // folded group header with a chevron and a course count; never opened by default (Drill Sets groups are not persisted either)
  const l0 = DASH.renderLearn(['fundamentals'], st0);
  assert(/<details class="dsGroup learnPkf" data-learn-pkf-list><summary class="dsGroupHead">/.test(l0) && !/<details[^>]*data-learn-pkf-list[^>]*\bopen\b/.test(l0), 'v14-114: PKF group starts collapsed (details without open)');
  assert(l0.includes('<span class="dsGroupChev" aria-hidden="true"></span>') && l0.includes('data-pkf-summary>0 of 7 courses complete</small>') && l0.includes('<span class="dsGroupCount">0/7</span>'), 'v14-114: header has chevron + "0 of 7 courses complete"');
  assert(!fsMod.readFileSync(path.join(root, 'js', 'learn.js'), 'utf8').includes('localStorage') && !/learnPkfOpen|pkfGroupOpen/.test(JSON.stringify(st0)), 'v14-114: open/closed state is not stored');
  // seeded sample progress: Fundamentals finished (all sections + exam passed), Shot Making partly done
  const fundSections = Object.fromEntries(FUND.SECTIONS.map((x) => [x.id, { passed: true }]));
  const smSome = Object.fromEntries(SM.SECTIONS.slice(0, 4).map((x) => [x.id, { passed: true }]));
  const st = { ...st0, [FUND.STORAGE_KEY]: { ...FUND.blank(), sections: fundSections, exam: { ...FUND.blank().exam, attempts: 2, passed: true, bestOverall: 0.92, bestKnowledge: 0.95 } }, [SM.STORAGE_KEY]: { ...SM.blank(), sections: smSome } };
  const l1 = DASH.renderLearn(['fundamentals'], st);
  const prog = (id) => (l1.match(new RegExp(`<span class="pkfProg[^"]*" data-pkf-prog="${id}"[\\s\\S]*?</span></span>(?:<span class="setEmblem"[\\s\\S]*?</span>)?</span>`)) || [''])[0];
  assert(/Complete · 12 of 12 sections/.test(prog('pkfFund')) && prog('pkfFund').includes('data-set-emblem="pkfFund"') && prog('pkfFund').includes('100%'), `v14-114: finished course shows Complete, 100% and its emblem`);
  assert(/In progress · 4 of 11 sections passed/.test(prog('pkfShotMaking')) && prog('pkfShotMaking').includes('36%') && prog('pkfShotMaking').includes('role="progressbar"') && !prog('pkfShotMaking').includes('setEmblem'), 'v14-114: partial course shows sections passed, a bar and percent, no emblem');
  assert(/data-pkf-prog="pkfCueBall"[\s\S]*?Not started · /.test(l1), 'v14-114: untouched course shows Not started');
  assert(/data-pkf-exam="pkfFundExam" data-pkf-exam-state="passed"[\s\S]*?Passed · Best 92%[\s\S]*?data-set-emblem="pkfFundExam"/.test(l1), 'v14-114: passed exam shows Passed, best score and its emblem');
  assert(/data-pkf-exam="pkfShotMakingExam" data-pkf-exam-state="locked"[\s\S]*?Locked · 4 of 11 sections passed/.test(l1), 'v14-114: locked exam shows Locked');
  assert(l1.includes('data-pkf-summary>1 of 7 courses complete</small>') && l1.includes('<span class="dsGroupCount">1/7</span>'), 'v14-114: header counts finished courses');
  assert((l1.match(/data-pkf-prog="/g) || []).length === 7 && (l1.match(/data-pkf-exam="/g) || []).length === 7, 'v14-114: every PKF course and exam card has its progress block');
  // Profile: PKF under its own Learn card; Drill Sets & Exams box keeps BU / Other only. Home: PKF emblems on their own Learn line.
  const prof = DASH.renderProfile(st);
  const pkfBox = (prof.match(/<div class="card setProgressCard pkfProgressCard" data-pkf-progress>[\s\S]*?<\/div>/) || [''])[0];
  const dsBox = (prof.match(/<div class="card setProgressCard" data-set-progress>[\s\S]*?<\/div>/) || [''])[0];
  assert(pkfBox.includes('<span class="eyebrow">LEARN</span> PKF Courses &amp; Exams') && pkfBox.includes('data-set="pkfFund"') && pkfBox.includes('data-set-emblem="pkfFund"') && pkfBox.includes('data-set="pkfFundExam"') && pkfBox.includes('data-set="pkfShotMaking"'), 'v14-114: Profile Learn · PKF card lists PKF courses and exams with emblems');
  assert(dsBox.includes('Drill Sets &amp; Exams') && !/data-set="pkf/.test(dsBox), 'v14-114: Profile Drill Sets & Exams box has no PKF rows');
  assert(prof.indexOf('data-pkf-progress') >= 0 && prof.indexOf('data-pkf-progress') < prof.indexOf('data-set-progress'), 'v14-114: Learn · PKF card sits above Drill Sets & Exams on Profile');
  const home = SP.completedSetsLineHTML(st);
  assert(home.includes('data-pkf-emblems><span class="hrSetsLabel">Learn · PKF courses completed</span>') && home.includes('data-set-emblem="pkfFund"') && !home.includes('data-set-emblems'), 'v14-114: Home shows finished PKF emblems on a Learn · PKF line, not the drill sets line');
  assert(SP.readSetProgress(st).some((r) => r.id === 'pkfFund') && SP.readDrillSetProgress(st).every((r) => !r.id.startsWith('pkf')) && SP.readPkfProgress(st).every((r) => r.id.startsWith('pkf')), 'v14-114: progress rows split into drill sets and PKF');
  assert(!SP.pkfProgressBoxHTML(st0).includes('data-set=') && SP.pkfProgressBoxHTML(st0).includes('No PKF course started'), 'v14-114: empty Learn · PKF card before starting');
}

// ---------------------------------------------------------------- v14-115: small "+N XP" pill on every XP gain
{
  const fsMod = await import('fs');
  const http = await import('http');
  const { createRequire } = await import('module');
  const XT = await import(js('ui/xpToast.js'));
  const AW = await import(js('progression/award.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  const css = fsMod.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-115: CACHE bumped to pool-iq-v14-119');
  assert(swSrc.includes("'./js/ui/xpToast.js'"), 'v14-115: xpToast.js precached');
  assert(/import \{ xpGain, showXpGain[^}]*\} from '\.\/ui\/xpToast\.js';/.test(appSrc) && /function commit\(next[^)]*\) \{\n  const before = state;[\s\S]*?saveState\(state\);[\s\S]*?const gain = xpGain\(before, state\);\n  if \(gain - bonus > 0\) showXpGain\(gain - bonus\);/.test(appSrc), 'v14-115: commit() (every XP award) shows the gain');
  assert(!/replaceAndReload[^\n]*showXpGain|showXpGain[^\n]*restore/i.test(appSrc), 'v14-115: restores never call the pill (they reload the page)');
  // gain math: positive only, Lifetime XP first, legacy xp fallback
  const st0 = storage.defaultState();
  const r = AW.applyAward(st0, { item: { key: 'v115-test', name: 'XP pill test', source: 'drill', tier: 'beginner' }, ratio: 1, passed: true, at: Date.UTC(2026, 9, 5) });
  const g = XT.xpGain(st0, r.state);
  assert(g > 0 && g === Math.round(r.state.prog.lifetimeXp - XT.xpOf(st0)), `v14-115: an award's Lifetime XP gain is what the pill shows (+${g})`);
  assert(XT.xpGain(r.state, st0) === 0 && XT.xpGain(st0, st0) === 0 && XT.xpGain(null, r.state) === 0, 'v14-115: no pill for losses, no change, or before boot');
  assert(XT.xpGain({ xp: 100 }, { xp: 400 }) === 300 && XT.xpText(1300) === '+1,300 XP', 'v14-115: legacy XP fallback and "+N XP" text');
  assert(XT.XP_TOAST_MS === 1500 && /\.xpToast\{[^}]*pointer-events:none/.test(css) && /\.xpToast\{[^}]*top:calc\(env\(safe-area-inset-top\) \+ \d+px\)/.test(css) && /@keyframes xpFloat/.test(css), 'v14-115: pill is under the header (safe area), no pointer events, 1.5s float');
  // Real browser: two quick gains combine into one pill, it never takes taps, and it is gone after ~1.5s
  let puppeteer = null;
  for (const d of [process.env.PUPPETEER_DIR, path.join(root, 'node_modules'), path.join(root, '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean)) {
    try { puppeteer = createRequire(path.join(d, 'x.js'))('puppeteer-core'); break; } catch {}
  }
  const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && fsMod.existsSync(p));
  if (!puppeteer || !chrome) {
    assert(false, 'v14-115: browser check needs puppeteer-core (PUPPETEER_DIR) and Chrome (CHROME_PATH)');
  } else {
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
    const server = http.createServer((req, res) => {
      let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (f.endsWith('/')) f += 'index.html';
      const p = path.join(root, f);
      fsMod.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); res.end(b); } });
    });
    await new Promise((r2) => server.listen(0, r2));
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    try {
      const pg = await browser.newPage();
      await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      let a = null; let err = '';
      for (let attempt = 0; attempt < 3 && !a; attempt++) try {
        // the first visit installs the service worker, which can reload the page once; retry if that happens mid-check
        err = '';
        await pg.goto(`http://127.0.0.1:${server.address().port}/#home`, { waitUntil: 'load', timeout: 30000 });
        await pg.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 20000 });
        await new Promise((r2) => setTimeout(r2, 1500));
        a = await pg.evaluate(async () => {
        const m = await import('./js/ui/xpToast.js');
        m.showXpGain(200); m.showXpGain(100); m.showXpGain(0); m.showXpGain(-50);
        await new Promise((r) => setTimeout(r, 400));
        const el = document.getElementById('xpToast');
        const cs = getComputedStyle(el); const box = el.getBoundingClientRect(); const head = document.querySelector('header').getBoundingClientRect();
        return { text: el.textContent, pe: cs.pointerEvents, op: parseFloat(cs.opacity), below: box.top >= head.bottom - 1, centered: Math.abs(box.left + box.width / 2 - innerWidth / 2) < 3, n: document.querySelectorAll('.xpToast').length };
      });
      } catch (e) { err = String(e.message || e); }
      a = a || { err };
      assert(a.text === '+300 XP' && a.n === 1 && a.pe === 'none' && a.op > 0.5 && a.below && a.centered, `v14-115: gains combine into one pill under the header, no pointer events ${JSON.stringify(a)}`);
      await new Promise((r2) => setTimeout(r2, 1700));
      const b = await pg.evaluate(() => { const el = document.getElementById('xpToast'); return { show: el.classList.contains('show'), op: parseFloat(getComputedStyle(el).opacity) }; });
      assert(!b.show && b.op === 0, `v14-115: pill fades out by itself in ~1.5s ${JSON.stringify(b)}`);
      // a real award through the app's commit() raises the pill with that award's Lifetime XP
      const c = await pg.evaluate(async () => {
        const AWm = await import('./js/progression/award.js');
        const before = window.PoolIQ.getState();
        const r = AWm.applyAward(before, { item: { key: 'v115-live', name: 'XP pill live', source: 'drill', tier: 'beginner' }, ratio: 1, passed: true });
        window.PoolIQ.commit(r.state);
        const want = Math.round((window.PoolIQ.getState().prog.lifetimeXp || 0) - ((before.prog && before.prog.lifetimeXp) || 0));
        await new Promise((res) => setTimeout(res, 300));
        const el = document.getElementById('xpToast');
        return { want, text: el.textContent, show: el.classList.contains('show') };
      });
      assert(c.want > 0 && c.show && c.text === `+${c.want.toLocaleString('en-US')} XP`, `v14-115: a real award through commit() shows its gain ${JSON.stringify(c)}`);
    } finally {
      await browser.close();
      server.close();
    }
  }
}

// ---------------------------------------------------------------- v14-116: one-time +300 XP course bonus for every Drill Sets & Exams set and exam
{
  const fsMod = await import('fs');
  const http = await import('http');
  const { createRequire } = await import('module');
  const CFG = await import(js('progression/config.js'));
  const AW = await import(js('progression/award.js'));
  const CB = await import(js('progression/courseBonus.js'));
  const SP = await import(js('content/setProgress.js'));
  const BUx = await import(js('content/buExam.js'));
  const SAF = await import(js('content/safetyMaster.js'));
  const TR = await import(js('content/trickShotCourse.js'));
  const FUNDx = await import(js('content/pkfFundamentalsCourse.js'));
  const DASH = await import(js('dashboard.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const appSrc = fsMod.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc) && swSrc.includes("'./js/progression/courseBonus.js'"), 'v14-116: CACHE bumped and courseBonus.js precached');
  assert(CFG.XP.courseCompleteBonus === 300 && CFG.XP.courseCompleteTier === 'intermediate', 'v14-116: XP.courseCompleteBonus = 300 in config.js');
  assert(/const cb = silent \? \{ state: next, awarded: \[\] \} : withCourseBonus\(before, next\);\n  state = silent \? next : derive\(cb\.state\);/.test(appSrc) && appSrc.includes("showXpBonus(bonus, 'Course bonus')"), 'v14-116: commit() pays the bonus before derive and shows "+300 XP · Course bonus"');
  const base = () => ({ ...storage.defaultState(), prog: { ...AW.emptyProg(), v: CFG.PROGRESSION_VERSION, rankSeen: 0 } });
  const ids = BUx.BU_ORDER;
  const buAll = (st, n = ids.length) => ids.slice(0, n).reduce((s2, id) => BUx.withExamScore(s2, id, 5, BUx.buMeta(id)?.max || 10, {}), st);
  // BU Exam I: the last drill finishes the set (same test as its emblem)
  let st0 = buAll(base(), ids.length - 1);
  let st1 = buAll(st0);
  assert(!CB.finishedSets(st0).has('fundamentals') && CB.finishedSets(st1).has('fundamentals') && SP.readDrillSetProgress(st1).find((r) => r.id === 'fundamentals').finished, 'v14-116: "finished" is the emblem test (readSetProgress row.finished)');
  let r = CB.withCourseBonus(st0, st1, 5000);
  const p = r.state.prog;
  assert(r.awarded.length === 1 && r.awarded[0].id === 'fundamentals' && r.awarded[0].xp === 300, 'v14-116: finishing BU Exam I awards one +300 bonus');
  assert(p.lifetimeXp === 300 && p.drillXp === 300 && p.rankXpBy[0] === 300 && p.rankXpTotal === 300 && p.tierXp.intermediate === 300, `v14-116: +300 to Lifetime, Drill and Career Rank XP (${p.lifetimeXp}/${p.drillXp}/${p.rankXpBy[0]})`);
  assert(p.courseBonus.fundamentals.xp === 300 && p.courseBonus.fundamentals.at === 5000 && p.events[0].key === 'course:fundamentals' && p.events[0].flags.includes('COURSE BONUS'), 'v14-116: one-time flag in prog.courseBonus plus an XP event');
  // replays, retakes and a second finish never pay again
  const replay = BUx.withExamScore(r.state, ids[0], 7, BUx.buMeta(ids[0])?.max || 10, {});
  assert(CB.withCourseBonus(r.state, replay).awarded.length === 0, 'v14-116: replaying a finished set pays nothing');
  const reset = { ...r.state, buExam: undefined, examI: undefined };
  const refin = CB.withCourseBonus(reset, buAll(r.state));
  assert(refin.awarded.length === 0 && refin.state.prog.lifetimeXp === 300, 'v14-116: re-finishing after a retake pays nothing (flag kept)');
  // finished before the bonus existed (or restored from an older backup): flagged with no XP, no surprise award
  const old = buAll(base());
  const retro = CB.withCourseBonus(old, { ...old, touched: 1 });
  assert(retro.awarded.length === 0 && retro.state.prog.lifetimeXp === 0 && retro.state.prog.courseBonus.fundamentals.xp === 0, 'v14-116: not retroactive (already-finished sets are flagged with 0 XP)');
  assert(CB.withCourseBonus(old, buAll(retro.state)).awarded.length === 0, 'v14-116: a flagged-at-0 set never pays later');
  assert(CB.withCourseBonus(null, st1).awarded.length === 0 && CB.withCourseBonus(st0, { ...st1, prog: undefined }).awarded.length === 0, 'v14-116: nothing before boot or for a fresh/reset save');
  // Champion: no Career Rank XP; tier cap respected
  const champ = { ...st0, rankIndex: AW.CHAMPION_INDEX };
  const rc = CB.withCourseBonus(champ, { ...st1, rankIndex: AW.CHAMPION_INDEX }).state.prog;
  assert(rc.lifetimeXp === 300 && rc.drillXp === 300 && rc.rankXpTotal === 0, 'v14-116: at Champion the bonus pays Lifetime + Drill XP only');
  const capped = { ...st0, prog: { ...st0.prog, tierXp: { intermediate: CFG.XP.tierCaps.intermediate - 100 } } };
  const rt = CB.withCourseBonus(capped, { ...st1, prog: capped.prog }).state.prog;
  assert(rt.rankXpBy[0] === 100 && rt.lifetimeXp === 300 && rt.tierXp.intermediate === CFG.XP.tierCaps.intermediate, 'v14-116: Career Rank part respects the intermediate tier cap');
  // OTHER group: Safety Master and the Trick Shot exam use their own finish tests; two in one save pay twice
  const safe0 = SAF.SAFETY_ORDER.slice(0, -1).reduce((s2, id) => SAF.withSafetyScore(s2, id), base());
  const safe1 = SAF.withSafetyScore(safe0, SAF.SAFETY_ORDER[SAF.SAFETY_ORDER.length - 1]);
  const both0 = { ...safe0, [TR.STORAGE_KEY]: { levels: {}, exam: { history: [{ score: 1 }] }, current: null } };
  const both1 = { ...safe1, [TR.STORAGE_KEY]: { levels: {}, exam: { passed: true, history: [{ score: 9 }] }, current: null } };
  const rb = CB.withCourseBonus(both0, both1);
  assert(rb.awarded.map((x) => x.id).sort().join() === 'safetyMaster,trickExam' && rb.state.prog.lifetimeXp === 600, `v14-116: Safety Master and the Trick Shot Exam each pay once (${rb.awarded.map((x) => x.id)})`);
  // PKF is not included (Learn)
  const pk0 = { ...base(), [FUNDx.STORAGE_KEY]: { ...FUNDx.blank(), sections: Object.fromEntries(FUNDx.SECTIONS.slice(0, -1).map((x) => [x.id, { passed: true }])) } };
  const pk1 = { ...pk0, [FUNDx.STORAGE_KEY]: { ...FUNDx.blank(), sections: Object.fromEntries(FUNDx.SECTIONS.map((x) => [x.id, { passed: true }])), exam: { ...FUNDx.blank().exam, attempts: 1, passed: true, bestOverall: 0.9 } } };
  assert(CB.withCourseBonus(pk0, pk1).awarded.length === 0, 'v14-116: PKF courses and exams pay no course bonus');
  // notes: Drill Sets tiles and Profile rows
  const page = DASH.renderCoursesPage(r.state);
  assert(/data-href="#buexam" [^>]*>[\s\S]*?<span class="courseBonusNote" data-course-bonus="fundamentals">✓ Course bonus \+300 XP<\/span>/.test(page), 'v14-116: finished set card says "✓ Course bonus +300 XP"');
  const fresh = DASH.renderCoursesPage(storage.defaultState());
  const todo = [...fresh.matchAll(/data-course-bonus-todo="([^"]+)"/g)].map((m) => m[1]);
  assert(todo.length === 14 && ['#buexam', '#buexam/bachelors', '#buexam/rds', '#buexam/follow', '#safety', '#bpset', '#kicking', '#trick'].every((h) => todo.includes(h)), `v14-116: every unlocked Drill Sets & Exams card shows the bonus it pays (${todo.length})`);
  assert(SP.setProgressBoxHTML(r.state).includes('data-course-bonus="fundamentals"') && !SP.setProgressBoxHTML(retro.state).includes('data-course-bonus='), 'v14-116: Profile row shows an earned bonus, nothing for pre-bonus finishes');
  // Real browser: finishing BU Exam I through the app's commit() shows "+300 XP · Course bonus" once and saves the flag
  let puppeteer = null;
  for (const d of [process.env.PUPPETEER_DIR, path.join(root, 'node_modules'), path.join(root, '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean)) {
    try { puppeteer = createRequire(path.join(d, 'x.js'))('puppeteer-core'); break; } catch {}
  }
  const chrome = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((x) => x && fsMod.existsSync(x));
  if (!puppeteer || !chrome) {
    assert(false, 'v14-116: browser check needs puppeteer-core (PUPPETEER_DIR) and Chrome (CHROME_PATH)');
  } else {
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
    const server = http.createServer((req, res) => {
      let f = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (f.endsWith('/')) f += 'index.html';
      const fp = path.join(root, f);
      fsMod.readFile(fp, (e, b) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream' }); res.end(b); } });
    });
    await new Promise((r2) => server.listen(0, r2));
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    try {
      const pg = await browser.newPage();
      await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      let a = null; let err = '';
      for (let attempt = 0; attempt < 3 && !a; attempt++) {
        try {
          err = '';
          await pg.goto(`http://127.0.0.1:${server.address().port}/#home`, { waitUntil: 'load', timeout: 30000 });
          await pg.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 20000 });
          await new Promise((r2) => setTimeout(r2, 1500));
          a = await pg.evaluate(async () => {
            const B = await import('./js/content/buExam.js');
            const fin = (s, n) => B.BU_ORDER.slice(0, n).reduce((s2, id) => B.withExamScore(s2, id, 5, B.buMeta(id)?.max || 10, {}), s);
            window.PoolIQ.commit(fin(window.PoolIQ.getState(), B.BU_ORDER.length - 1));
            await new Promise((res) => setTimeout(res, 1700));
            const life0 = window.PoolIQ.getState().prog.lifetimeXp;
            window.PoolIQ.commit(fin(window.PoolIQ.getState(), B.BU_ORDER.length));
            await new Promise((res) => setTimeout(res, 300));
            const el = document.getElementById('xpBonusToast');
            const out = { text: el?.textContent, show: el?.classList.contains('show'), pe: el && getComputedStyle(el).pointerEvents, gained: window.PoolIQ.getState().prog.lifetimeXp - life0, flag: window.PoolIQ.getState().prog.courseBonus?.fundamentals?.xp };
            await new Promise((res) => setTimeout(res, 1700));
            const life1 = window.PoolIQ.getState().prog.lifetimeXp;
            window.PoolIQ.commit(fin(window.PoolIQ.getState(), B.BU_ORDER.length));
            await new Promise((res) => setTimeout(res, 300));
            out.again = window.PoolIQ.getState().prog.lifetimeXp - life1;
            out.againShow = document.getElementById('xpBonusToast').classList.contains('show');
            out.saved = JSON.stringify(localStorage).includes('courseBonus');
            return out;
          });
        } catch (e) { err = String(e.message || e); }
      }
      a = a || { err };
      assert(a.text === '+300 XP · Course bonus' && a.show && a.pe === 'none' && a.gained === 300 && a.flag === 300, `v14-116: finishing a set in the app shows "+300 XP · Course bonus" ${JSON.stringify(a)}`);
      assert(a.again === 0 && !a.againShow && a.saved, `v14-116: saving the finished set again pays nothing; the flag is in saved state ${JSON.stringify(a)}`);
    } finally {
      await browser.close();
      server.close();
    }
  }
}

// ---------------------------------------------------------------- v14-117: every drill uses one flat base XP of 60
{
  const fsMod = await import('fs');
  const CFG = await import(js('progression/config.js'));
  const AW = await import(js('progression/award.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-117: CACHE bumped to pool-iq-v14-119');
  assert(CFG.XP.flatDrillBase === 60 && CFG.XP.flatSources.join() === 'drill,custom,content', 'v14-117: XP.flatDrillBase = 60 for drill, custom and content');
  assert(JSON.stringify(CFG.XP.base) === JSON.stringify({ beginner: 40, intermediate: 60, advanced: 90, expert: 130, pro: 180 }) && JSON.stringify(CFG.XP.tierCaps) === JSON.stringify({ beginner: 5000, intermediate: 9000, advanced: 14000, expert: 20000, pro: null }), 'v14-117: tier bases (games, Ghost, Boss) and tier caps unchanged');
  const T0 = Date.UTC(2026, 9, 5, 12);
  const fresh = () => ({ ...storage.defaultState(), prog: { ...AW.emptyProg(), v: CFG.PROGRESSION_VERSION, rankSeen: 0 } });
  const it = (o = {}) => ({ key: 'v117:a', name: 'Flat XP', source: 'drill', tier: 'beginner', drillRank: true, rankXpEligible: true, ...o });
  for (const source of CFG.XP.flatSources) {
    for (const tier of ['beginner', 'intermediate', 'advanced', 'expert', 'pro']) {
      const r = AW.applyAward(fresh(), { item: it({ key: `v117:${source}:${tier}`, source, tier }), ratio: 1, passed: true, at: T0 });
      assert(r.award.lifetime === 135 && r.award.rank === 135 && r.award.drill === 135, `v14-117: ${source} ${tier}: first 10/10 pass = 135 (${r.award.lifetime}/${r.award.rank}/${r.award.drill})`);
    }
  }
  // 8/10 repeat (passed, not a PB) = 45; 10/10 with only the perfect bonus = 75; 10/10 PB after 8/10 = 90
  let r = AW.applyAward(fresh(), { item: it({ tier: 'expert' }), ratio: 0.8, passed: true, at: T0 });
  assert(r.award.lifetime === 105, `v14-117: first pass at 8/10 = 45 + 60 first clear = 105 (${r.award.lifetime})`);
  const r8 = AW.applyAward(r.state, { item: it({ tier: 'expert' }), ratio: 0.8, passed: true, at: T0 + 1000 });
  assert(r8.award.lifetime === 45 && r8.award.rank === 45, `v14-117: 8/10 repeat = 45 (${r8.award.lifetime})`);
  const rpb = AW.applyAward(r8.state, { item: it({ tier: 'expert' }), ratio: 1, passed: true, at: T0 + 2000 });
  assert(rpb.award.lifetime === 90 && rpb.award.flags.includes('PERSONAL BEST'), `v14-117: 10/10 personal best = 90 (${rpb.award.lifetime})`);
  const hard = { strong: 1.5, mastered: 1.5 }; // an item whose mastery bar is never reached, so no repeat reduction
  let rn = AW.applyAward(fresh(), { item: it({ key: 'v117:n', mastery: hard }), ratio: 1, passed: true, at: T0 });
  rn = AW.applyAward(rn.state, { item: it({ key: 'v117:n', mastery: hard }), ratio: 1, passed: true, at: T0 + 1000 });
  assert(rn.award.lifetime === 75 && rn.award.flags.join() === 'PERFECT', `v14-117: normal 10/10 repeat = 75 (${rn.award.lifetime} ${rn.award.flags})`);
  const rm = AW.applyAward(rpb.state, { item: it({ tier: 'expert' }), ratio: 1, passed: true, at: T0 + 86400000 }); // next day, so only the mastered cut applies
  assert(rm.award.flags.includes('MASTERED REPEAT') && rm.award.lifetime === 38 && rm.award.rank === 8, `v14-117: anti-farming still applies to mastered repeats (${rm.award.lifetime}/${rm.award.rank})`);
  // games, Ghost and Boss keep the tier base; author baseXP still wins; Ball Pocketing medal gate kept
  const arc = AW.applyAward(fresh(), { item: it({ key: 'v117:arc', source: 'arcade', tier: 'advanced' }), ratio: 1, passed: true, at: T0 });
  const boss = AW.applyAward(fresh(), { item: it({ key: 'v117:boss', source: 'boss', tier: 'beginner', drillRank: false }), ratio: 1, passed: true, at: T0 });
  const ghost = AW.applyAward(fresh(), { item: it({ key: 'v117:ghost', source: 'ghost', tier: 'pro', drillRank: false }), ratio: 1, passed: true, at: T0 });
  assert(arc.award.lifetime === Math.round(90 * 2.25) && boss.award.lifetime === Math.round(80 * 2.25) && ghost.award.lifetime === Math.round(180 * 2.25), `v14-117: Table Games, Boss and Ghost keep the tier base (${arc.award.lifetime}/${boss.award.lifetime}/${ghost.award.lifetime})`);
  const own = AW.applyAward(fresh(), { item: it({ key: 'v117:own', source: 'content', tier: 'advanced', baseXP: 120 }), ratio: 1, passed: true, at: T0 });
  assert(own.award.lifetime === 270, `v14-117: a .pooliq author baseXP still overrides (${own.award.lifetime})`);
  const cust = AW.applyAward(fresh(), { item: it({ key: 'v117:c', source: 'custom', tier: 'pro' }), ratio: 1, passed: true, at: T0 });
  assert(cust.award.rank === 135 && cust.state.prog.tierXp.intermediate === 135 && !cust.state.prog.tierXp.pro, 'v14-117: Create Drill pro still counts toward the Intermediate cap, at the flat 60');
  const bp = AW.applyAward(fresh(), { item: it({ key: 'v117:bp', category: 'Ball Pocketing' }), ratio: 1, passed: true, at: T0 });
  const bpg = AW.applyAward(fresh(), { item: it({ key: 'v117:bpg', category: 'Ball Pocketing' }), ratio: 1, passed: true, at: T0, medal: 'Gold' });
  assert(bp.award.drill === 0 && bpg.award.drill === 135, 'v14-117: Ball Pocketing medal gate for Drill XP kept');
}

// ---------------------------------------------------------------- v14-118: Profile BALL POCKETING RANK card (after Drill Rank, before Learn · PKF)
{
  const fsMod = await import('fs');
  const DASH = await import(js('dashboard.js'));
  const PRG = await import(js('ui/progression.js'));
  const BPm = await import(js('content/ballPocket.js'));
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-118: CACHE bumped to pool-iq-v14-119');
  const empty = storage.defaultState();
  const HID = await import(js('drills/hidden.js'));
  const vis = BPm.ballPocketDrills().filter((d) => !HID.isDrillHidden(d.id)); // earlier checks may hide a drill; the card counts visible drills only
  const lv1 = vis.filter((d) => d.level === 1);
  const prof = DASH.renderProfile(empty);
  const iDr = prof.indexOf('data-drill-rank='), iBp = prof.indexOf('data-bp-rank-card='), iPkf = prof.indexOf('data-pkf-progress');
  assert(iDr > 0 && iBp > iDr && iPkf > iBp, 'v14-118: Profile order is Drill Rank, Ball Pocketing Rank, then Learn · PKF');
  const e = DASH.ballPocketRankCardHTML(empty);
  assert(/BALL POCKETING RANK 1 \/ 5/.test(e) && /data-bp-started="0"/.test(e) && e.includes(`Not started · 0 / ${lv1.length} to Level 2`) && /width:0%/.test(e) && /data-href="#drills\/pocket"/.test(e) && /rank-cue-1\.png/.test(e), `v14-118: empty state shows Level 1, "Not started" and an empty bar; taps open #drills/pocket ${(e.match(/data-bp-[a-z]+>[^<]*|width:[0-9]+%|data-bp-started="[01]"/g) || []).join(' ; ')}`);
  const stages = {};
  for (const d of lv1) stages[d.id] = { tries: 2, passed: true };
  for (let i = 1; i <= 3; i++) stages[`bp-l2-${i}`] = { tries: 1, passed: true };
  stages['bp-l2-4'] = { tries: 3, passed: false };
  const seeded = { ...empty, games: { ...(empty.games || {}), drills: { stages, pb: {}, sessions: [] } } };
  const st = BPm.ballPocketStatus(seeded);
  const c = DASH.ballPocketRankCardHTML(seeded);
  assert(st.current === 2 && /BALL POCKETING RANK 2 \/ 5/.test(c) && /Level 2<\/h3>/.test(c) && /Next: Level 3 · 3 \/ 10 at bronze\+/.test(c) && /width:30%/.test(c) && /rank-cue-2\.png/.test(c), 'v14-118: level, next level and bar come from ballPocketStatus');
  assert(c.includes(`data-bp-bronze>${lv1.length + 3}</b> / ${vis.length}`) && /data-bp-levels>1<\/b> \/ 5 levels finished/.test(c) && c.includes(`data-bp-sessions>${lv1.length * 2 + 6}</b> sessions`), `v14-118: stats are the saved drill stages (bronze+, levels finished, sessions) ${(c.match(/data-bp-[a-z]+>[^<]*<\/b>[^<]*/g) || []).join(' ; ')}`);
  const all = {};
  for (const d of BPm.ballPocketDrills()) all[d.id] = { tries: 1, passed: true };
  const full = DASH.ballPocketRankCardHTML({ ...empty, games: { drills: { stages: all, pb: {}, sessions: [] } } });
  assert(/MAX LEVEL · all five levels finished/.test(full) && / max"/.test(full) && /data-bp-levels>5</.test(full), 'v14-118: all five levels finished shows MAX LEVEL');
  const head = PRG.profileHeaderHTML(seeded, {});
  assert(/class="phRank bp" data-action="go" data-href="#drills\/pocket" data-ph-bp="2"/.test(head) && head.includes('Ball Pocketing <span class="gold">Lv. 2</span>'), 'v14-118: profile header has a Ball Pocketing chip next to the Career and Drill Rank chips');
  assert(!/v14-118|internal/i.test(c.replace(/data-[a-z-]+="[^"]*"/g, '')), 'v14-118: no internal notes in the card');
}

// ---------------------------------------------------------------- v14-119: Table Games SETTINGS, clocks + extensions, Create Your Own Game
{
  const fsMod = await import('fs');
  const swSrc = fsMod.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert(/const CACHE = 'pool-iq-v14-119'/.test(swSrc), 'v14-119: CACHE bumped to pool-iq-v14-119');
  for (const f of ['./js/ui/gameSettings.js', './js/ui/rackLayout.js', './js/ui/customGame.js', './icons/tg-create.png']) {
    assert(swSrc.includes(`'${f}'`) && fsMod.existsSync(path.join(root, f)), `v14-119: ${f} exists and is in the service worker ASSETS`);
  }
  const VR = await import(js('vault.js'));
  assert(VR.KEYS.gameSettings === 'poolIQGameSettingsV1' && VR.KEYS.customGames === 'poolIQCustomGamesV1' && VR.hasValidator('poolIQGameSettingsV1') && VR.hasValidator('poolIQCustomGamesV1'), 'v14-119: game settings and custom games are vault KEYS with validators (in backups)');
  const GS = await import(js('ui/gameSettings.js'));
  const DASH = await import(js('dashboard.js'));
  const src = fsMod.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');
  const ids = [...src.matchAll(/^\s*\['([a-z0-9]+)', '[^']+', '[^']*'\]/gm)].map((m) => m[1]).filter((id) => id !== 'friends' && id !== 'ghost'); // Friends and Ghost are not rack scorers
  assertAll('v14-119: every Table Games game has settings defaults', ids.filter((id) => !GS.GAME_DEFAULTS[id]));
  const off = { matchOn: false, matchMin: 30, shotOn: false, shotSec: 30, extN: 1, extSec: 30 };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  localStorage.removeItem('poolIQGameSettingsV1');
  assert(same(GS.readGameSettings('upusa').clock, { ...off, matchOn: true, shotOn: true }), 'v14-119: Ultimate Pool defaults are the league clocks (30 min, 30 sec, one 30-second extension per player per rack)');
  assertAll('v14-119: every other game defaults to clocks off', ids.filter((id) => id !== 'upusa' && !same(GS.readGameSettings(id).clock, off)));
  assert(['8', '9', '10'].every((id) => GS.readGameSettings(id).race === 5 && GS.readGameSettings(id).breakRule === 'off') && GS.readGameSettings('bank').race === 3 && GS.readGameSettings('bank').rack === 'short' && GS.readGameSettings('bank').lagBreaks === true && GS.readGameSettings('straight').target === 50 && GS.readGameSettings('onepocket').race === 3 && GS.readGameSettings('onepocket').lagBreaks === true, 'v14-119: race, rack, break and target defaults match how each game played before');
  assert(same(GS.RANGES, { matchMin: { min: 5, max: 120, step: 5 }, shotSec: { min: 10, max: 120, step: 5 }, extN: { min: 0, max: 5, step: 1 }, extSec: { min: 5, max: 60, step: 5 }, race: { min: 1, max: 21, step: 1 } }), 'v14-119: setting ranges');
  const el = (d) => ({ dataset: d });
  let s9 = GS.readGameSettings('9');
  s9 = GS.settingsAction('9', s9, 'gs-step', el({ f: 'race', d: '1' }));
  s9 = GS.settingsAction('9', s9, 'gs-toggle', el({ f: 'shotSec' }));
  assert(GS.readGameSettings('9').race === 6 && GS.readGameSettings('9').clock.shotOn && GS.readGameSettings('8').race === 5, 'v14-119: each game remembers its own settings');
  for (let i = 0; i < 40; i++) s9 = GS.settingsAction('9', s9, 'gs-step', el({ f: 'shotSec', d: '1' }));
  assert(s9.clock.shotSec === 120, 'v14-119: shot clock stops at 120 seconds');
  const panel = GS.settingsPanelHTML('9', s9, {});
  assert(/data-tg-settings="9"/.test(panel) && /data-action="gs-reset"/.test(panel) && /RESET TO DEFAULTS/.test(panel) && /Extensions per player per rack/.test(panel) && /Extension length/.test(panel), 'v14-119: settings panel has the clocks, extensions and RESET TO DEFAULTS');
  GS.settingsAction('9', s9, 'gs-reset', el({}));
  assert(same(GS.readGameSettings('9'), GS.defaultsFor('9')), 'v14-119: RESET TO DEFAULTS restores the defaults');
  const k = GS.createClock({ ...off, shotOn: true, extN: 2, extSec: 20 });
  assert(!GS.canExtend(k) && /disabled/.test(GS.clockPanelHTML(k).match(/<button[^>]*data-action="mc-ext"[^>]*>/)[0]), 'v14-119: EXTENSION is greyed out until the shot clock is running');
  GS.clockAction(k, 'mc-shot', el({ v: 'you' }));
  const before = GS.shotMs(k);
  GS.clockAction(k, 'mc-ext', el({}));
  assert(k.ext.you === 1 && k.ext.opp === 2 && GS.shotMs(k) > before + 19000 && /YOU 1 LEFT · OPP 2 LEFT/.test(GS.clockPanelHTML(k)), 'v14-119: EXTENSION adds its time to the running shot clock and counts down that player only');
  k.shotEnd = Date.now() - 1;
  GS.clockTick(k, { querySelector: () => null });
  GS.clockAction(k, 'mc-ext', el({}));
  assert(k.shotDone && k.ext.you === 1 && !GS.canExtend(k), 'v14-119: no extension after the shot clock ran out');
  GS.clockNewRack(k);
  assert(k.ext.you === 2 && k.ext.opp === 2, 'v14-119: extensions reset each rack');
  const tm = fsMod.readFileSync(path.join(root, 'js/ui/tableMatch.js'), 'utf8');
  assert((tm.match(/settingsKit\(ctx, /g) || []).length >= 8 && /withKit\(ctx, 'loop'/.test(tm) && /withKit\(ctx, 'kicksafe'/.test(tm), 'v14-119: every table game screen shows the SETTINGS panel');
  assert(!/const MATCH = 30 \* 60 \* 1000/.test(tm) && /if \(!ui\.shotRunning \|\| shotMs\(\) <= 0\)/.test(tm) && /Request it before the shot clock expires/.test(tm) && /ui\.ext = \{ a: cfg\.extN, b: cfg\.extN \}/.test(tm), 'v14-119: Ultimate Pool clocks come from settings; the extension only works while the shot clock runs and resets each rack');
  // rack layouts
  const RL = await import(js('ui/rackLayout.js'));
  const bad = [];
  for (const lay of Object.keys(RL.LAYOUTS)) for (let n = 1; n <= 15; n++) {
    const rk = RL.reshape({ count: n, layout: 'triangle' }, { layout: lay });
    const p = RL.rackPositions(rk);
    if (p.length !== n || p.some((q) => q.x < 1 || q.x > 99 || q.y < 1 || q.y > 49)) bad.push(`${lay}/${n}`);
  }
  assertAll('v14-119: every ball count and rack shape fits on the table', bad);
  const pinned = RL.randomFill({ count: 9, layout: 'diamond', order: [1, 2, 3, 4, 5, 6, 7, 8, 9], pins: [0, 4] }, () => 0.3);
  assert(pinned.order[0] === 1 && pinned.order[4] === 5 && [...pinned.order].sort((a, b) => a - b).join() === '1,2,3,4,5,6,7,8,9', 'v14-119: random fill keeps pinned balls');
  const fp = RL.rackPositions({ count: 10, layout: 'triangle', foot: 0 })[0];
  assert(fp.x === 75 && fp.y === 25 && /data-rack="10"/.test(RL.rackSVG({ count: 10 })), 'v14-119: the foot ball sits on the foot spot in the flat diagram');
  // custom games
  const CG = await import(js('ui/customGame.js'));
  localStorage.removeItem('poolIQCustomGamesV1');
  const g9 = CG.applyPreset(CG.blankGame(), '9');
  assert(g9.count === 9 && g9.layout === 'diamond' && g9.gameBall === 9 && g9.rotation && CG.applyPreset(CG.blankGame(), 'straight').scoring === 'points', 'v14-119: presets prefill count, rack and rules');
  assert(CG.saveCustomGame({ ...g9, name: '' }) === null, 'v14-119: a custom game needs a name');
  const saved = CG.saveCustomGame({ ...g9, name: 'My Nine', count: 7, order: [1, 2, 3, 4, 5, 6, 7], gameBall: 7, clock: { ...off, shotOn: true } });
  assert(saved && /^cg-/.test(saved.id) && CG.readCustomGame(saved.id).count === 7, 'v14-119: custom game saves under poolIQCustomGamesV1');
  let m = CG.freshCustomMatch();
  m = CG.applyCustom(saved, m, 'pocket', 1);
  assert(CG.lowestUp(saved, m) === 2, 'v14-119: rotation points at the lowest ball left');
  m = CG.applyCustom(saved, m, 'pocket', 7);
  assert(m.racksYou === 1 && m.down.length === 0 && m.breaker === 'opp', 'v14-119: the game ball wins the rack; breaks alternate');
  const pts = CG.normalizeGame({ ...CG.blankGame(), id: 'cg-p1', name: 'P', scoring: 'points', target: 5, count: 3 });
  let q = CG.freshCustomMatch();
  for (const n of [1, 2, 3, 1, 2]) q = CG.applyCustom(pts, q, 'pocket', n);
  assert(q.you === 5 && q.winner === 'you' && q.racks === 1, 'v14-119: points scoring re-racks when every ball is down');
  const arc = DASH.renderArcade(storage.defaultState());
  assert(arc.includes('data-href="#tgame/create"') && arc.includes('tg-create.png') && arc.includes(`data-href="#tgame/${saved.id}"`) && /data-custom-tile[\s\S]*data-rack="7"/.test(arc), 'v14-119: Table Games shows the custom tile with its rack, and the CREATE YOUR OWN GAME tile');
  assert(CG.deleteCustomGame(saved.id) && !CG.readCustomGame(saved.id), 'v14-119: custom games can be deleted');
  const cgSrc = fsMod.readFileSync(path.join(root, 'js/ui/customGame.js'), 'utf8') + fsMod.readFileSync(path.join(root, 'js/ui/gameSettings.js'), 'utf8');
  assert(!/award|commit\(|careerXp|bankRankXp/.test(cgSrc), 'v14-119: no Career XP or rank from settings or custom games');
  localStorage.removeItem('poolIQCustomGamesV1');
  localStorage.removeItem('poolIQGameSettingsV1');
}

console.log('\n--- Summary ---');
console.log('Games:', reg.GAMES.length, '| Stages (non-ghost):', stageCount, '| Boss shots:', bossShots, '| Drills:', drills.length);
console.log('Passed:', passes, '| Fails:', fails.length);
if (fails.length) { console.error(fails.slice(0, 60).join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
