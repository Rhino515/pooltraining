/**
 * Pool IQ headless verification (Node 18+, no dependencies).
 *   node scripts/verify.mjs
 * Checks: drill library (0+ drills), stage/boss geometry, why-text uniqueness, engine scoring,
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
  assert(speed.speedLabel(2) === 'SPEED 2.0', 'speed label format');
  assert(speed.formatSpeed(2.5) === '2.5', 'formatSpeed');
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
  assert((gh.match(/class="gauge /g) || []).length === 3 && /class="aim-view[^"]*"[^>]*data-cut="30" data-side="right"/.test(gh) && gh.includes('Right ½') && gh.includes('cb-dot') && gh.includes('Speed 1.0'), 'gauge card: Aim View (Right ½, 30°) · tip · speed dial');
  const hid = recipe.recipeGaugesHTML(lz, { hideAim: true });
  assert(!/data-cut=/.test(hid) && hid.includes('Your aim'), 'coaching hides the aim value (no numbers leak)');
  assert(recipe.speedAngle(0.5) === -135 && recipe.speedAngle(5) === 135 && Math.abs(recipe.speedAngle(2.75)) < 1e-9, 'speed dial needle maps SPEED 0.5–5.0 onto −135°…+135°');
  assert(recipe.tipLabel(0, 0) === 'Center' && recipe.tipLabel(1, 0) === 'Top 1 tip' && recipe.tipLabel(-1.5, 0) === 'Draw 1½ tips' && recipe.tipLabel(-0.5, -1) === 'Low Left' && recipe.tipLabel(0, 0.5) === 'Right ½ tip', 'tip labels (Center, Top 1 tip, Draw 1½ tips, Low Left)');
  const m = recipe.tipGaugeSVG({ vTips: -1, hTips: 0.5 }).match(/class="cb-dot"[^>]*cx="([\d.]+)" cy="([\d.]+)"/);
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
  assert(allReqs.every((r) => ['gameLevel', 'ghost', 'boss', 'stars', 'pb'].includes(r.type)), 'career requirements are game levels / Ghost / bosses / stars / PBs only');
  assert(!JSON.stringify(career.RANK_REQUIREMENTS).match(/drill/i), 'career references no drill ids');
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
  assert(career.isBossUnlocked(st, boss1), 'boss unlocks when every other requirement is met');
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

console.log('\n--- Summary ---');
console.log('Games:', reg.GAMES.length, '| Stages (non-ghost):', stageCount, '| Boss shots:', bossShots, '| Drills:', drills.length);
console.log('Passed:', passes, '| Fails:', fails.length);
if (fails.length) { console.error(fails.slice(0, 60).join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
