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
  assert(/'pool-iq-v14-69'/.test(sw), 'service worker cache is pool-iq-v14-69');
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
  const base = CFG.XP.base.beginner;
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
  st = fresh();
  const dItem = (i, tier = 'intermediate') => item({ key: `drill:t${i}`, source: 'drill', tier, drillRank: true, primary: CFG.SKILLS[i % 3].id, weights: { [CFG.SKILLS[i % 3].id]: 1 } });
  let drillsPlayed = 0;
  while (drillsPlayed < 40 && RK.drillRankStatus(st).have.xp < CFG.DRILL_RANK.ranks[1].xp) {
    st = AW.applyAward(st, { item: dItem(drillsPlayed), ratio: 0.8, passed: true, at: T0 + drillsPlayed * DAYMS }).state;
    drillsPlayed += 1;
  }
  const dr1 = RK.drillRankStatus(st);
  assert(dr1.have.passed >= 3 && dr1.have.xp >= CFG.DRILL_RANK.ranks[1].xp && dr1.number === 2 && dr1.name === 'Grinder', `Drill Rank: ${dr1.have.passed} passed drills + ${dr1.have.xp} Drill XP = Grinder`);
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
  assert(/'pool-iq-v14-69'/.test(sw) && !/'pool-iq-v12'/.test(sw) && !/'pool-iq-v13'/.test(sw) && !/'pool-iq-v14-5c'/.test(sw), 'v14: service worker cache is pool-iq-v14-69');
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
  assert(swSrc.includes('pool-iq-v14-69') && swSrc.includes('skipWaiting') && swSrc.includes('clients.claim'), 'v14-28: new cache skipWaiting and clients.claim');
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

console.log('\n--- Summary ---');
console.log('Games:', reg.GAMES.length, '| Stages (non-ghost):', stageCount, '| Boss shots:', bossShots, '| Drills:', drills.length);
console.log('Passed:', passes, '| Fails:', fails.length);
if (fails.length) { console.error(fails.slice(0, 60).join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
