/**
 * Custom drills (Create Drill builder) — pure data layer, no DOM.
 *
 * The builder keeps a small "builder state" (balls, pocket, zones, recipe, texts, scoring). buildCustomDrill()
 * turns it into a FULL challenge object — the same data model the drill library and Arcade stages use
 * (see drills.js header / README) — with the cue-ball and object-ball routes computed by the Shot Simulator
 * physics (throw-compensated aim, real contact point, rail contacts). The challenge (with its builder state
 * embedded for editing) is what gets stored, exported and played.
 *
 * Storage: localStorage 'poolIQCustomDrillsV1' = { version: 1, drills: [challenge…] }.
 */
import { R, simulate, speedToV0, aimFromVector } from './sim/physics.js';
import { aimToPocket } from './sim/solver.js';
import { validateLayout, label as ballLabel } from './sim/layouts.js';
import { aimInfo, fullnessLabel, shortFullness, POCKET_NAMES } from './games/geometry.js';
import { railsText, railsShort, contactText, englishText, techniqueName } from './games/text.js';
import { speedMeaning, formatSpeed } from './games/speed.js';
import { SKILL_NAMES } from './storage.js';

export const CUSTOM_KEY = 'poolIQCustomDrillsV1';
export const EXPORT_FORMAT = 'pool-iq-drills';
export const ZONE_SIZES = { S: [7, 4.5, 2.5], M: [10, 6.5, 3.5], L: [13, 9, 5] };
export const SCORING_MODES = [
  { id: 'zone', label: 'Pocket + zone stars' },
  { id: 'binary', label: 'Made / miss' },
  { id: 'stars', label: 'Quality stars' }
];
const r2 = (v) => Math.round(v * 100) / 100;
const hyp = Math.hypot;

export function defaultBuilder() {
  return {
    id: null,
    title: '',
    category: 'Shot Making',
    skill: 'Shot Making',
    difficulty: 2,
    cue: { x: 25, y: 31.25 },
    balls: [{ n: 1, x: 62.5, y: 18.75 }],
    blockers: [],
    targetBall: 1,
    pockets: ['TR'],
    zones: [],
    zoneSize: 'M',
    tip: { vTips: 0, hTips: 0 },
    speed: 2,
    aimOffset: 0,
    showRoute: true,
    instructions: '',
    goal: '',
    why: '',
    scoring: { mode: 'binary', attempts: 10, made: 7, stars: 12, pockets: 7, requirePocket: true }
  };
}

/** Simulator layout for a builder state */
export function builderLayout(b) {
  const out = [];
  if (b.cue) out.push({ id: 'cue', x: b.cue.x, y: b.cue.y });
  for (const o of b.balls || []) out.push({ id: o.n, x: o.x, y: o.y });
  for (const o of b.blockers || []) out.push({ id: o.n, x: o.x, y: o.y, blocker: true });
  return out;
}

/** Friendly validation. Returns {errors:[], warnings:[]} — errors block saving. */
export function validateBuilder(b, route = null) {
  const errors = [];
  const warnings = [];
  if (!String(b.title || '').trim()) errors.push('Give the drill a title.');
  if (!b.cue) errors.push('Place the cue ball on the table.');
  const lay = builderLayout(b);
  const ids = lay.map((x) => String(x.id));
  const dupN = ids.find((v, i) => ids.indexOf(v) !== i);
  if (dupN) errors.push(`Ball ${dupN} is on the table twice — each number can only be used once.`);
  for (const e of validateLayout(lay.map((x) => ({ ...x, id: x.blocker ? `x${x.id}` : x.id })))) if (!e.startsWith('Duplicate')) errors.push(e);
  if (!(b.balls || []).some((o) => o.n === b.targetBall)) errors.push('Pick the object ball to pocket (tap one of your balls under “Target ball”).');
  if (!b.pockets || !b.pockets.length) errors.push('Choose a target pocket — tap a pocket on the table.');
  const sc = b.scoring || {};
  if (sc.mode === 'zone' && !(b.zones || []).length) errors.push('Pocket + zone scoring needs at least one cue-ball landing zone — tap “Add zone”.');
  const n = Number(sc.attempts);
  if (!(n >= 1 && n <= 50)) errors.push('Attempts must be between 1 and 50.');
  if (sc.mode === 'binary' && !(sc.made >= 1 && sc.made <= n)) errors.push(`“Made to pass” must be between 1 and ${n || 'the number of attempts'}.`);
  if ((sc.mode === 'zone' || sc.mode === 'stars') && !(sc.stars >= 1 && sc.stars <= n * 3)) errors.push(`Stars to pass must be between 1 and ${n * 3 || 3} (3 per attempt).`);
  if (sc.mode === 'zone' && sc.requirePocket !== false && !(sc.pockets >= 0 && sc.pockets <= n)) errors.push(`Pots to pass must be between 0 and ${n}.`);
  if (!errors.length && route) {
    if (!route.firstHit) warnings.push('In the simulator the cue ball misses the target ball — check the layout for a blocking ball.');
    else if (!route.made) warnings.push(`In the simulator the ${b.targetBall} doesn't drop with this recipe${route.rattled ? ' (it rattles in the jaws)' : ''} — try another speed or tip, or nudge the aim. You can still save it.`);
    if (route.scratch) warnings.push('The simulated cue ball scratches — adjust speed or spin.');
    if ((b.zones || []).length && route.cueEnd && route.zoneMiss > 0.5) warnings.push(`The simulated cue ball stops ${Math.round(route.zoneMiss)}" from the nearest zone centre.`);
  }
  return { errors, warnings };
}

/** Ramer–Douglas–Peucker polyline simplification */
function simplify(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  let idx = -1;
  let dmax = 0;
  const a = pts[0];
  const b = pts[pts.length - 1];
  const L = hyp(b.x - a.x, b.y - a.y) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= tol) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}

/**
 * Simulate the builder's shot: throw-compensated aim at the primary pocket (+ optional fine offset),
 * then extract drawable routes from the recorded frames.
 */
export function computeRoute(b) {
  const lay = builderLayout(b).map(({ id, x, y }) => ({ id, x, y }));
  const cue = lay.find((x) => x.id === 'cue');
  const ob = lay.find((x) => x.id === b.targetBall);
  const pocket = (b.pockets || [])[0];
  if (!cue || !ob || !pocket) return null;
  const shot0 = { speed: b.speed, vTips: b.tip?.vTips || 0, hTips: b.tip?.hTips || 0 };
  const a = aimToPocket(lay, ob.id, pocket, shot0);
  if (!a) return null;
  const aim = a.aim + (Number(b.aimOffset) || 0);
  const shot = { ...shot0, aim };
  const res = simulate(lay, shot, { maxTime: 30 });
  const ci = res.ids.indexOf('cue');
  const oi = res.ids.indexOf(ob.id);
  const track = (i, fromT = 0) => res.frames.filter((f) => f.t >= fromT && f.p[i]).map((f) => ({ x: f.p[i][0], y: f.p[i][1] }));
  const hit = res.firstHit && res.firstHit.ob === ob.id ? res.firstHit : null;
  let cuePath;
  let contactIndex = 1;
  let ghost = null;
  if (hit) {
    ghost = { x: r2(hit.cueAt.x), y: r2(hit.cueAt.y) };
    const post = simplify(track(ci, hit.t), 0.12);
    cuePath = [{ x: cue.x, y: cue.y }, ghost, ...post.slice(1)];
  } else {
    cuePath = simplify(track(ci), 0.12);
  }
  cuePath = cuePath.map((p) => ({ x: r2(p.x), y: r2(p.y) }));
  const obTrack = track(oi, hit ? hit.t : 0);
  if (obTrack.length) obTrack[0] = { x: ob.x, y: ob.y };
  const obPts = simplify(obTrack, 0.12).map((p) => ({ x: r2(p.x), y: r2(p.y) }));
  // a pocketed ball: finish its line at the pocket drop point
  const obPocket = res.pocketed.find((p) => p.id === ob.id);
  const others = res.ids
    .map((id, i) => ({ id, i }))
    .filter(({ id, i }) => id !== 'cue' && id !== ob.id && res.distance[id] > 1)
    .map(({ id, i }) => ({ n: id, points: simplify(track(i), 0.12).map((p) => ({ x: r2(p.x), y: r2(p.y) })) }));
  const cush = res.events.filter((e) => e.type === 'cushion');
  const railContacts = [
    ...cush.filter((e) => e.ball === 'cue' && (!hit || e.t > hit.t)).map((e, i) => ({ x: r2(e.x), y: r2(e.y), rail: e.rail, by: 'cue', order: i + 1 })),
    ...cush.filter((e) => e.ball === ob.id).map((e, i) => ({ x: r2(e.x), y: r2(e.y), rail: e.rail, by: 'ob', order: i + 1 }))
  ];
  const cueEnd = res.final[ci].on ? { x: r2(res.final[ci].x), y: r2(res.final[ci].y) } : null;
  const zoneMiss = cueEnd && (b.zones || []).length ? Math.min(...b.zones.map((z) => hyp(z.x - cueEnd.x, z.y - cueEnd.y))) : null;
  const madeInto = obPocket ? obPocket.pocket : null;
  return {
    aim,
    compensated: a.compensated,
    cut: a.cut,
    sim: res,
    shot,
    firstHit: hit,
    ghost,
    cuePath,
    contactIndex,
    obPath: obPts,
    otherPaths: others,
    railContacts,
    cueEnd,
    zoneMiss,
    made: !!madeInto && (b.pockets || []).includes(madeInto),
    madeInto,
    rattled: res.events.some((e) => e.type === 'jaw' && e.ball === ob.id),
    scratch: res.scratch
  };
}

function techniqueFor(tip, cut) {
  const v = tip?.vTips || 0;
  if (v >= 0.25) return 'follow';
  if (v <= -0.25) return 'draw';
  return cut < 5 ? 'stop' : 'stun';
}

function englishType(b, route) {
  const h = b.tip?.hTips || 0;
  if (!h) return null;
  const firstRail = route.railContacts.find((c) => c.by === 'cue');
  if (!firstRail) return null;
  // compare with the same shot without english: wider rebound along the rail = running
  const plain = computeRoute({ ...b, tip: { ...b.tip, hTips: 0 } });
  const along = (r) => {
    const i = r.cuePath.findIndex((p) => Math.abs(p.x - firstRail.x) < 0.3 && Math.abs(p.y - firstRail.y) < 0.3);
    const k = i >= 0 ? i : r.contactIndex;
    const p = r.cuePath[k];
    const q = r.cuePath[Math.min(r.cuePath.length - 1, k + 1)];
    return firstRail.rail === 'top' || firstRail.rail === 'bottom' ? Math.abs(q.x - p.x) / (hyp(q.x - p.x, q.y - p.y) || 1) : Math.abs(q.y - p.y) / (hyp(q.x - p.x, q.y - p.y) || 1);
  };
  if (!plain) return null;
  return along(route) >= along(plain) ? 'running' : 'reverse';
}

/** Full challenge object from a builder state (routes from the physics simulation) */
export function buildCustomDrill(b, { id = null, now = Date.now(), route: given } = {}) {
  const route = given !== undefined ? given : computeRoute(b);
  const drillId = id || b.id || `cd-${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const ob = b.balls.find((o) => o.n === b.targetBall);
  const pocket = b.pockets[0];
  const sizes = ZONE_SIZES[b.zoneSize] || ZONE_SIZES.M;
  const zones = (b.zones || []).map((z, i) => ({ type: 'rings', x: r2(z.x), y: r2(z.y), rings: [{ r: sizes[0], stars: 1 }, { r: sizes[1], stars: 2 }, { r: sizes[2], stars: 3 }], label: b.zones.length > 1 ? `Z${i + 1}` : 'CB' }));
  const info = route && route.ghost ? aimInfo(b.cue, ob, route.ghost) : null;
  const cutDeg = info ? Math.round(info.phi) : Math.round(route?.cut || 0);
  const technique = techniqueFor(b.tip, cutDeg);
  const hTips = b.tip?.hTips || 0;
  const engType = route ? englishType(b, route) : null;
  const cueRails = route ? route.railContacts.filter((c) => c.by === 'cue') : [];
  const pocketWords = (b.pockets || []).map((k) => POCKET_NAMES[k] || k);
  const autoGoal = `Pocket the ${b.targetBall} in the ${pocketWords[0]}${pocketWords.length > 1 ? ` (or ${pocketWords.slice(1).join(' / ')})` : ''}${zones.length ? ` and land the cue ball in ${zones.length > 1 ? 'a' : 'the'} zone` : ''}.`;
  const sc = b.scoring || {};
  const attempts = Math.round(Number(sc.attempts) || 10);
  let scoringRules;
  let pass;
  if (sc.mode === 'zone') {
    pass = { stars: Math.round(sc.stars), ...(sc.requirePocket !== false ? { pockets: Math.round(sc.pockets) } : {}) };
    scoringRules = { mode: 'zone', attempts, pass, requirePocket: sc.requirePocket !== false };
  } else if (sc.mode === 'stars') {
    pass = { stars: Math.round(sc.stars) };
    scoringRules = { mode: 'stars', attempts, pass };
  } else {
    pass = { made: Math.round(sc.made) };
    scoringRules = { mode: 'binary', attempts, pass };
  }
  const skill = SKILL_NAMES.includes(b.skill) ? b.skill : 'Shot Making';
  const skillEffects = { [skill]: 1 };
  if (zones.length && skill !== 'Position Play') skillEffects['Position Play'] = 0.5;
  if (skill !== 'Speed Control') skillEffects['Speed Control'] = Math.max(skillEffects['Speed Control'] || 0, 0.3);
  const travelAfter = route && route.firstHit ? Math.round(route.sim.distance.cue - hyp(route.ghost.x - b.cue.x, route.ghost.y - b.cue.y)) : null;
  const fullWord = info ? fullnessLabel(info.fullness).replace(/^About /, '') : null;
  const why = {
    whyCustom: String(b.why || '').trim() || undefined,
    whyAim: info ? `The ${b.targetBall} is cut about ${cutDeg}° into the ${pocketWords[0]} — ${fullWord.toLowerCase()} contact. The aim shown is where the simulator's cue ball actually meets the ${b.targetBall}, with a small allowance for throw.` : undefined,
    whyContact: technique === 'follow' ? `${contactText(b.tip.vTips, 0)}: topspin makes the cue ball keep rolling forward after it hits the ${b.targetBall}.` : technique === 'draw' ? `${contactText(b.tip.vTips, 0)}: backspin pulls the cue ball back off the ${b.targetBall}${cutDeg > 10 ? ' along a line behind the tangent' : ''}.` : technique === 'stop' ? 'Center ball with enough pace that the cue ball is sliding at contact — it stops dead on a straight-in hit.' : `Center ball (stun): the cue ball is sliding at contact, so it leaves along the tangent line, 90° from the ${b.targetBall}'s path.`,
    whySpeed: `${formatSpeed(b.speed)} on the SPEED scale (${speedMeaning(b.speed)}).${travelAfter != null && travelAfter > 1 ? ` In the simulation the cue ball travels about ${travelAfter}" after contact.` : ''}`,
    whySpin: hTips ? `${englishText(hTips, engType)}: side spin changes the cue ball's angle off the ${cueRails.length ? 'first rail' : 'object ball'} and makes the shot less forgiving — squirt and throw are included in the simulated aim.` : 'No side spin keeps the shot simple and the aim reliable.',
    whyRoute: route ? (cueRails.length ? `The cue ball goes ${railsText(cueRails).toLowerCase()} before it stops.` : 'The cue ball stays off the rails.') + (route.cueEnd && zones.length ? ` It finishes ${route.zoneMiss < 1 ? 'in the middle of the zone' : `${Math.round(route.zoneMiss)}" from the zone centre`}.` : '') : undefined
  };
  for (const k of Object.keys(why)) if (!why[k]) delete why[k];
  const showRoute = b.showRoute !== false && route;
  const ch = {
    id: drillId,
    name: String(b.title).trim().slice(0, 60),
    game: 'drills',
    category: b.category || 'Shot Making',
    difficulty: Number(b.difficulty) || 2,
    level: Number(b.difficulty) || 2,
    kind: zones.length ? 'position' : 'pot',
    technique,
    instructions: String(b.instructions || '').trim() || `Set up the balls as shown (tap SETUP for the diamond positions). ${autoGoal}`,
    goal: String(b.goal || '').trim() || autoGoal,
    attemptCount: attempts,
    passingRequirement: pass,
    scoringRules,
    prerequisites: [],
    skillEffects,
    xp: 40 + 15 * (Number(b.difficulty) || 2),
    unlocks: [],
    blockers: (b.blockers || []).map((o) => ({ n: o.n, x: r2(o.x), y: r2(o.y) })),
    warnings: [],
    ballPositions: b.balls.map((o) => ({ n: o.n, x: r2(o.x), y: r2(o.y) })),
    cueBallPosition: { x: r2(b.cue.x), y: r2(b.cue.y) },
    targetBall: b.targetBall,
    targetPocket: pocket,
    acceptPockets: (b.pockets || []).slice(),
    ghost: route?.ghost || null,
    targetZones: zones,
    cueBallPath: showRoute ? route.cuePath : [b.cue, route?.ghost || ob].map((p) => ({ x: r2(p.x), y: r2(p.y) })),
    contactIndex: 1,
    objectBallPath: route ? route.obPath : [],
    objectBallPaths: showRoute ? [{ n: b.targetBall, points: route.obPath }, ...route.otherPaths] : route ? [{ n: b.targetBall, points: route.obPath }] : [],
    railContacts: showRoute ? route.railContacts : route ? route.railContacts.filter((c) => c.by === 'ob') : [],
    cueContact: { vTips: b.tip?.vTips || 0, hTips },
    english: { hTips, type: hTips ? engType || (hTips > 0 ? 'right' : 'left') : 'none' },
    speed: Number(b.speed),
    aim: info ? { fraction: r2(info.fullness), label: fullnessLabel(info.fullness), short: shortFullness(info.fullness), cutDeg } : { fraction: null, label: '—', short: '—', cutDeg: 0 },
    route: { rails: cueRails.length, text: railsText(cueRails), short: railsShort(cueRails) },
    whyExplanation: why,
    custom: true,
    simulated: route ? { made: route.made, scratch: route.scratch, cueEnd: route.cueEnd, aimDeg: r2(route.aim) } : null,
    builder: JSON.parse(JSON.stringify({ ...b, id: drillId })),
    created: b.created || now,
    updated: now
  };
  return ch;
}

// ------------------------------------------------------------------ storage
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
export function loadCustomDrills() {
  try {
    const d = JSON.parse(ls()?.getItem(CUSTOM_KEY) || 'null');
    return Array.isArray(d?.drills) ? d.drills.filter(isChallenge) : [];
  } catch {
    return [];
  }
}
export function saveCustomDrills(list) {
  try {
    ls()?.setItem(CUSTOM_KEY, JSON.stringify({ version: 1, drills: list }));
    return true;
  } catch {
    return false;
  }
}
export function isChallenge(c) {
  return !!(c && typeof c.id === 'string' && Array.isArray(c.ballPositions) && c.cueBallPosition && c.scoringRules && c.name);
}
export function upsertCustomDrill(ch) {
  const list = loadCustomDrills();
  const i = list.findIndex((d) => d.id === ch.id);
  if (i >= 0) list[i] = ch;
  else list.push(ch);
  saveCustomDrills(list);
  return ch;
}
export function deleteCustomDrill(id) {
  const list = loadCustomDrills();
  const next = list.filter((d) => d.id !== id);
  saveCustomDrills(next);
  return next.length < list.length;
}
export function duplicateCustomDrill(id, now = Date.now()) {
  const src = loadCustomDrills().find((d) => d.id === id);
  if (!src) return null;
  const newId = `cd-${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = newId;
  copy.name = `${src.name} (copy)`.slice(0, 60);
  copy.created = now;
  copy.updated = now;
  if (copy.builder) { copy.builder.id = newId; copy.builder.title = copy.name; }
  upsertCustomDrill(copy);
  return copy;
}
export function exportDrills(list) {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 1, exported: new Date().toISOString(), drills: list }, null, 2);
}
/** Parse an export file; returns {drills, skipped}. Imported ids that clash get fresh ids (never overwrite). */
export function parseDrillImport(text, existingIds = [], now = Date.now()) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error('That file is not valid JSON.'); }
  const arr = o && o.format === EXPORT_FORMAT && Array.isArray(o.drills) ? o.drills : isChallenge(o) ? [o] : null;
  if (!arr) throw new Error('That file is not a Pool IQ drill export.');
  const taken = new Set(existingIds);
  const drills = [];
  let skipped = 0;
  arr.forEach((d, i) => {
    if (!isChallenge(d)) { skipped++; return; }
    const c = JSON.parse(JSON.stringify(d));
    if (!/^cd-/.test(c.id) || taken.has(c.id)) c.id = `cd-${(now + i).toString(36)}${i}`;
    if (c.builder) c.builder.id = c.id;
    c.custom = true;
    c.game = 'drills';
    taken.add(c.id);
    drills.push(c);
  });
  return { drills, skipped };
}
export { ballLabel, aimFromVector, speedToV0, R };
