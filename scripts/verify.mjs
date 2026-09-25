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
