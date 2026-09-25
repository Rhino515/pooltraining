/**
 * Stage builders: turn compact authored layouts into full challenge objects.
 * Geometry (ghost ball, tangent line, curved follow/draw routes, mirror-method banks/kicks) is computed,
 * never hand-drawn, so every path is physically consistent with its recipe.
 * "Why" text is generated from each layout's own numbers plus optional hand-written coaching notes.
 */
import * as G from './geometry.js';
import * as T from './text.js';
import { speedLabel, speedMeaning, formatSpeed } from './speed.js';

const { R } = G;
const toBall = (a) => (Array.isArray(a) ? { n: a[0], x: a[1], y: a[2], pocket: a[3] || null } : { ...a });
const rings = (r = [9, 6, 3]) => [
  { r: r[0], stars: 1 },
  { r: r[1], stars: 2 },
  { r: r[2], stars: 3 }
];
const r0 = (v) => Math.round(v);
const cleanPts = (pts) => pts.map((p) => G.clean(p));

function note(spec, key) {
  const n = spec.note && spec.note[key];
  return n ? ` ${n}` : '';
}

function minPocketDist(points) {
  let m = Infinity;
  let key = null;
  for (const p of points) {
    for (const [k, q] of Object.entries(G.POCKET_XY)) {
      const d = G.dist(p, q);
      if (d < m) {
        m = d;
        key = k;
      }
    }
  }
  return { d: m, key };
}

/** Place the cue ball for a cut; shortens the distance if needed to keep the ball on the table. */
function placeCue(ob, dir, cut) {
  for (let dd = cut[2]; dd >= 7; dd -= 0.5) {
    const p = G.cueFromCut(ob, dir, [cut[0], cut[1], dd]);
    if (G.ballOnTable(p)) return p;
  }
  return G.cueFromCut(ob, dir, cut);
}

function baseChallenge(spec, defaults = {}) {
  const difficulty = spec.difficulty ?? 3;
  const scoring = { ...(defaults.scoring || {}), ...(spec.scoring || {}) };
  if (spec.attempts) scoring.attempts = spec.attempts;
  if (spec.pass) scoring.pass = { ...(scoring.pass || {}), ...spec.pass };
  return {
    id: spec.id,
    name: spec.name,
    game: defaults.game || spec.game || null,
    category: spec.category || defaults.category || null,
    difficulty,
    instructions: spec.instructions || '',
    goal: spec.goal || '',
    attemptCount: scoring.attempts || 5,
    passingRequirement: scoring.pass || {},
    scoringRules: scoring,
    prerequisites: spec.prerequisites || [],
    skillEffects: spec.skillEffects || defaults.skillEffects || {},
    xp: spec.xp ?? 40 + difficulty * 15,
    unlocks: [],
    blockers: (spec.blockers || []).map(toBall),
    warnings: []
  };
}

function railMarks(contacts, by) {
  return contacts.map((c, i) => ({ x: G.round1(c.x), y: G.round1(c.y), rail: c.rail, by, order: i + 1 }));
}

function nextBallInfo(zone, nb) {
  if (!nb) return null;
  const b = toBall(nb);
  const info = G.cutInfo(zone, b, b.pocket);
  return { ...b, cutDeg: r0(info.phi) };
}

function throwNote(technique, phi, n) {
  if (phi < 6) return ` Dead straight — aim through the middle of the ${n}.`;
  if (technique === 'stun' && phi > 10 && phi < 55) return ` A sliding cue ball at this angle creates cut-induced throw that drags the ${n} slightly toward the cue ball's direction, so overcut by a hair.`;
  if (technique === 'draw' && phi > 10) return ` The cue ball is still sliding at contact on a draw shot, so throw is at its strongest — favour a touch thinner than the ghost ball says.`;
  if (technique === 'follow' && phi >= 18 && phi <= 42) return ` Near a half-ball hit a rolling cue ball ends up about 30° off its original aim line — this zone sits on that natural-angle line.`;
  if (technique === 'follow') return ` Rolling cue balls produce very little throw, so trust the ghost-ball picture.`;
  return '';
}

// ---------------------------------------------------------------- position
export function buildPosition(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const ob = toBall(spec.ob);
  const pocket = spec.pocket;
  const cue = spec.cut ? placeCue(ob, G.sub(G.POCKET_XY[pocket], ob), spec.cut) : G.toPoint(spec.cue);
  if (!G.ballOnTable(cue)) c.warnings.push(`cue off table ${cue.x},${cue.y}`);
  const info = G.cutInfo(cue, ob, pocket);
  const fam0 = spec.family === 'any' ? null : spec.family;
  const family = fam0 || (spec.k != null ? (Math.abs(spec.k) <= 0.15 ? 'stun' : spec.k > 0 ? 'follow' : 'draw') : 'follow');
  const eng = spec.english || null; // { tips, type: 'running'|'reverse' }
  const englishDelta = eng ? Math.abs(eng.tips) * 12 * (eng.type === 'reverse' ? -1 : 1) : 0;
  let sol;
  if (spec.k != null && spec.travel != null) {
    const cl = spec.curve ?? Math.max(3, Math.min(16, spec.travel * 0.35));
    sol = spec.travel < 0.5
      ? { k: spec.k, travel: 0, err: 0, route: { points: [info.ghost], contacts: [] } }
      : { k: spec.k, travel: spec.travel, err: 0, curveLen: cl, route: G.cueRoute(info, { k: spec.k, curveLen: cl, travel: spec.travel, englishDelta }) };
  } else {
    sol = solve(info, G.toPoint(spec.zone), spec.kRange || family, englishDelta, spec.curve);
  }
  const technique = spec.technique || (family === 'stun' ? (info.phi < 5 ? 'stop' : 'stun') : family);
  const route = sol.route;
  const end = route.points[route.points.length - 1];
  const vTips = spec.vTips ?? G.tipsFromSpin(sol.k, info.dCue, technique);
  const speed = spec.speed ?? G.speedForShot(info, sol.k, sol.route.points, technique);
  if (sol.err > (spec.tol ?? 2.5)) c.warnings.push(`zone miss ${sol.err.toFixed(1)} (k=${sol.k})`);

  const zone = { type: 'rings', x: G.round1(end.x), y: G.round1(end.y), rings: rings(spec.rings), label: 'CB' };
  const nb = nextBallInfo(zone, spec.nextBall);
  if (nb) zone.forBall = nb.n;
  const obPath = [G.clean(ob), G.clean(G.POCKET_XY[pocket])];
  const cuePath = cleanPts([cue, info.ghost, ...route.points.slice(1)]);
  const others = [...(spec.others || []).map(toBall), ...(nb ? [nb] : [])];

  Object.assign(c, {
    kind: 'position',
    technique,
    ballPositions: [{ n: ob.n, x: ob.x, y: ob.y }, ...others.map((b) => ({ n: b.n, x: b.x, y: b.y }))],
    cueBallPosition: G.clean(cue),
    targetBall: ob.n,
    targetPocket: pocket,
    ghost: G.clean(info.ghost),
    targetZones: [zone],
    cueBallPath: cuePath,
    contactIndex: 1,
    objectBallPath: obPath,
    objectBallPaths: [{ n: ob.n, points: obPath }],
    railContacts: railMarks(route.contacts, 'cue'),
    cueContact: { vTips, hTips: eng ? eng.tips : 0 },
    english: eng ? { hTips: eng.tips, type: eng.type } : { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: r0(info.phi) },
    route: { rails: route.contacts.length, text: T.railsText(route.contacts), short: T.railsShort(route.contacts) },
    spinK: sol.k,
    travel: r0(sol.travel),
    nextBall: nb
  });
  if (!c.goal) {
    c.goal = nb
      ? `Pocket the ${ob.n} in the ${T.pocketName(pocket)} and land in the zone for the ${nb.n}.`
      : `Pocket the ${ob.n} in the ${T.pocketName(pocket)} and land the cue ball in the bullseye.`;
  }
  c.expertGoal = nb ? `Pocket the ${ob.n} and get position on the ${nb.n} (${T.pocketName(nb.pocket)}).` : null;
  c.whyExplanation = whyPosition(spec, c, { info, sol, technique, ob, pocket, speed, eng, englishDelta, route, zone, nb });
  return c;
}

function solve(info, Z, family, englishDelta, curve) {
  if ((family === 'stun' || Array.isArray(family)) && info.phi < 5 && G.dist(info.ghost, Z) < 2) {
    return { k: 0, travel: 0, err: G.dist(info.ghost, Z), route: { points: [info.ghost], contacts: [] } };
  }
  return G.solveToZone(info, Z, { family, englishDelta, curveLen: curve ?? null });
}

function energyPct(info, k) {
  const { vf } = G.postContact(info, k);
  return Math.max(G.len(vf) ** 2, 0.045);
}

function whyPosition(spec, c, ctx) {
  const { info, sol, technique, ob, pocket, speed, eng, englishDelta, route, zone, nb } = ctx;
  const n = ob.n;
  const phi = r0(info.phi);
  const trav = r0(sol.travel);
  const tip = T.contactText(c.cueContact.vTips, 0);
  const dest = T.areaName(zone);
  const nr = route.contacts.length;
  const railsT = nr ? `off ${nr} rail${nr > 1 ? 's' : ''} (${G.railListText(route.contacts)})` : 'without touching a rail';
  let whyContact;
  if (technique === 'follow') {
    whyContact = `${tip}: the cue ball reaches the ${n} still rolling forward. ${phi < 6 ? `On this straight shot that roll carries it on through the ${n}'s spot` : `At a ${phi}° cut the roll bends it forward off the tangent line`} and on for about ${trav} in ${railsT}, finishing ${dest}.`;
  } else if (technique === 'draw') {
    whyContact = `${tip}: the backspin has to survive the ${r0(info.dCue)}-inch trip to the ${n}. ${phi < 6 ? 'On a straight hit it reverses the cue ball straight back' : `On a ${phi}° cut the cue ball first slides out on the tangent line, then the backspin hooks it back behind that line`} — about ${trav} in ${railsT} — to finish ${dest}.`;
  } else if (technique === 'stun-run') {
    whyContact = `${tip}: a stun-run-through arrives with just a trace of forward roll, so the cue ball leaves close to the tangent line and then drifts a few degrees forward of it — about ${trav} in ${railsT} — to finish ${dest}.`;
  } else if (technique === 'stun-draw') {
    whyContact = `${tip}: a stun-draw arrives with only a little backspin left, so the cue ball starts on the tangent line and then eases a few degrees back behind it, travelling about ${trav} in ${railsT} to finish ${dest}.`;
  } else if (technique === 'stun') {
    whyContact = `${tip}: the cue ball must arrive sliding, with no roll and no backspin, so it leaves on the tangent line 90° off the ${n}'s path and slides about ${trav} in ${railsT}, finishing ${dest}.`;
  } else {
    whyContact = `${tip}: on a straight ${r0(info.dCue)}-inch shot, zero spin at contact hands all of the cue ball's motion to the ${n}, so the cue ball stops on the ${n}'s old spot${trav > 1 ? ` (within ${trav} in)` : ''}.`;
  }
  whyContact += note(spec, 'contact');

  const f = energyPct(info, sol.k);
  const cap = info.dCue + sol.travel / f;
  const step = r0(45 * f);
  let whySpeed = `${speedLabel(speed)} — ${speedMeaning(speed)}. `;
  if (technique === 'stop') {
    whySpeed += `A stop needs just enough pace to keep the cue ball skidding for all ${r0(info.dCue)} in; any softer and friction turns the skid into roll and the cue ball creeps forward.`;
  } else {
    const fShot = Math.max(G.len(G.postContact(info, sol.k).vf) ** 2, 0.03);
    const afterCap = route.points && route.points.length > 1 ? G.capacityForLegs(G.legLengths(route.points)) : 0;
    const raw = G.speedFromCapacity(info.dCue + afterCap / fShot);
    const shotTxt = phi < 6 ? 'On this straight shot' : `On this ${phi}° cut`;
    whySpeed += `${shotTxt} the cue ball rolls about ${r0(info.dCue)} in to the ${n}, gives up most of its pace at contact, and then still has to travel about ${trav} in to the zone. `;
    if (raw < speed - 0.25 && technique !== 'follow') {
      const reason = technique === 'draw'
        ? `draw only works if the cue ball still has backspin when it reaches the ${n}, and a softer stroke lets the cloth wear that spin off on the way`
        : `the cue ball has to reach the ${n} still sliding rather than rolling, and a softer stroke lets it pick up forward roll before contact`;
      whySpeed += `Distance alone would only take about SPEED ${G.round1(raw).toFixed(1)}, but ${reason}. That is why the recipe calls for ${speedLabel(speed)}.`;
    } else if (raw > speed + 0.25) {
      whySpeed += `The distance works out to roughly SPEED ${G.round1(raw).toFixed(1)}; this stage sets ${speedLabel(speed)}, so expect to land on the short side of the zone until your calibration says otherwise.`;
    } else {
      whySpeed += `That adds up to about ${speedLabel(speed)} on a calibrated table.`;
    }
    whySpeed += ` Each half-step of speed moves the finish about ${step} in.`;
  }
  whySpeed += note(spec, 'speed');

  let whySpin;
  if (eng && eng.tips) {
    const first = route.contacts[0];
    const railName = first ? G.RAILS[first.rail].name : 'first rail';
    whySpin = `${T.englishText(eng.tips, eng.type)}: ${eng.type === 'reverse' ? 'reverse english shortens' : 'running english widens'} the cue ball's rebound off the ${railName} by roughly ${Math.abs(englishDelta)}°. Without it the cue ball would come off the ${railName} ${eng.type === 'reverse' ? 'too wide and run past' : 'too short and fall short of'} the zone. Side spin also squirts the cue ball a little over ${r0(info.dCue)} in, so keep a short bridge.`;
  } else if (phi >= 15) {
    whySpin = `No sidespin. The ${n} is a ${phi}° cut, where side english adds squirt and throw to the pot — ${T.techniqueName(technique).toLowerCase()} alone already reaches the zone.`;
  } else {
    whySpin = `No sidespin. On a ${phi < 6 ? 'straight' : `shallow ${phi}°`} shot, side english only adds aiming error; vertical spin does all the positional work here.`;
  }
  whySpin += note(spec, 'spin');

  const mp = minPocketDist(route.points.slice(1));
  let whyRoute;
  if (!nr) {
    whyRoute = `Direct route of about ${trav} in: no rail means no rebound angle to misjudge${Number.isFinite(mp.d) && route.points.length > 1 ? `, and the path never gets closer than ${r0(mp.d)} in to the ${T.pocketName(mp.key)}` : ''}.`;
  } else {
    const c0 = route.contacts[0];
    const along = G.diamondsAlong(c0, c0.rail);
    const ref = c0.rail === 'top' || c0.rail === 'bottom' ? 'head rail' : 'top rail';
    whyRoute = `The cue ball meets the ${G.RAILS[c0.rail].name} ${along} diamonds from the ${ref}${nr > 1 ? ` and then the ${route.contacts.slice(1).map((q) => G.RAILS[q.rail].short).join(' and ')} rail` : ''}. Using the rail${nr > 1 ? 's' : ''} lets it travel ${trav} in yet finish on a predictable line, passing no closer than ${r0(mp.d)} in to the ${T.pocketName(mp.key)}.`;
  }
  if (nb) whyRoute += ` Landing here leaves about a ${nb.cutDeg}° cut on the ${nb.n} into the ${T.pocketName(nb.pocket)}.`;
  if (c.blockers.length) {
    const clear = Math.min(...c.blockers.map((b) => G.distToPolyline(b, route.points.length > 1 ? route.points : [info.ghost, info.ghost])));
    whyRoute += ` It stays ${r0(clear)} in clear of the ${c.blockers.map((b) => b.n).join(' and ')}.`;
  }
  whyRoute += note(spec, 'route');

  const whyAim = `${G.fullnessLabel(info.fullness)} contact: the ${n} is cut ${phi}° into the ${T.pocketName(pocket)}. Send the cue ball's centre to the ghost-ball spot touching the ${n} directly opposite the pocket.${throwNote(technique, phi, n)}${note(spec, 'aim')}`;
  return { whyContact, whySpeed, whySpin, whyRoute, whyAim };
}

// ---------------------------------------------------------------- lag / speed
export function buildLag(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const cue = G.toPoint(spec.cue || [6.5, 25]);
  const dir = G.norm(G.toPoint(spec.dir || [1, (spec.cue && spec.cue[1] > 25 ? -1 : 1) * 0.045]));
  const speed = spec.speed;
  // Lag lengths are measured cushion to cushion; a ball starting near the head rail reaches the far cushion at SPEED 1.
  const span = G.CUSHION.maxX - G.CUSHION.minX;
  const travel = Math.max(5, speed * span - Math.max(0, cue.x - G.CUSHION.minX) * (dir.x > 0 ? 1 : 0));
  const route = G.straightRoute(cue, dir, travel);
  const end = route.points[route.points.length - 1];
  const alongLength = Math.abs(dir.x) > 0.9;
  const halfW = spec.bands || [12.5, 6.25, 3.2];
  let zone;
  if (alongLength && spec.zoneType !== 'rings') {
    zone = { type: 'band', axis: 'x', center: G.round1(end.x), halfWidths: halfW, rings: halfW.map((h, i) => ({ r: h, stars: i + 1 })), x: G.round1(end.x), y: G.round1(end.y), label: 'STOP' };
  } else {
    zone = { type: 'rings', x: G.round1(end.x), y: G.round1(end.y), rings: rings(spec.rings || [10, 6.5, 3.5]), label: 'STOP' };
  }
  Object.assign(c, {
    kind: 'lag',
    technique: 'lag',
    ballPositions: [],
    cueBallPosition: G.clean(cue),
    targetBall: null,
    targetPocket: null,
    targetZones: [zone],
    cueBallPath: cleanPts(route.points),
    contactIndex: 0,
    objectBallPath: [],
    objectBallPaths: [],
    railContacts: railMarks(route.contacts, 'cue'),
    cueContact: { vTips: spec.vTips ?? 0, hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: null, label: 'No object ball', short: 'NO OB', cutDeg: 0 },
    route: { rails: route.contacts.length, text: T.railsText(route.contacts), short: T.railsShort(route.contacts) },
    travel: r0(travel)
  });
  if (!c.goal) c.goal = `Roll the cue ball at ${speedLabel(speed)} and stop it inside the band.`;
  const legs = route.contacts.length;
  const endTxt = T.areaName(end);
  c.whyExplanation = {
    whyContact: `${T.contactText(c.cueContact.vTips, 0)}: a centre hit rolls the cue ball naturally, so every lag at ${formatSpeed(speed)} behaves the same and the result measures your stroke, not your spin.${note(spec, 'contact')}`,
    whySpeed: `${speedLabel(speed)} means ${speedMeaning(speed)}: about ${r0(travel)} in of rolling, ${legs ? `rebounding ${legs} time${legs > 1 ? 's' : ''}` : 'with no rebound'} and dying ${endTxt}. Being half a speed step off moves the stop by about ${r0(G.TABLE_LENGTH / 2)} in — four diamonds.${note(spec, 'speed')}`,
    whySpin: `No sidespin: english changes the rebound angle and the rail's grab, which would blur the speed reading at ${formatSpeed(speed)}.${note(spec, 'spin')}`,
    whyRoute: legs
      ? `The route ${G.railListText(route.contacts)} uses ${legs} cushion${legs > 1 ? 's' : ''}; each rebound costs pace, which is already built into the ${formatSpeed(speed)} number.${note(spec, 'route')}`
      : `A straight roll with no cushion isolates pure distance control over ${r0(travel)} in.${note(spec, 'route')}`,
    whyAim: `Aim ${Math.abs(dir.y) < 0.05 ? 'dead parallel to the long rails' : `about ${r0(G.deg(Math.atan2(Math.abs(dir.y), Math.abs(dir.x))))}° off the long-rail line`} so the rebounds stay predictable and the ball finishes ${endTxt}.${note(spec, 'aim')}`
  };
  return c;
}

// ---------------------------------------------------------------- banks
export function buildBank(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const ob = toBall(spec.ob);
  const pocket = spec.pocket;
  const rails = spec.rails || ['top'];
  const mp = G.mirrorPath(ob, G.POCKET_XY[pocket], rails);
  if (!mp.valid) c.warnings.push('bank mirror path invalid');
  const n1 = G.norm(G.sub(mp.points[1], ob));
  const cue = spec.cut ? placeCue(ob, n1, spec.cut) : G.toPoint(spec.cue);
  if (!G.ballOnTable(cue)) c.warnings.push(`cue off table ${cue.x},${cue.y}`);
  const ghost = G.sub(ob, G.mul(n1, 2 * R));
  const info = G.aimInfo(cue, ob, ghost);
  const family = spec.family || 'stun';
  let sol;
  if (spec.k != null && spec.travel != null) {
    sol = { k: spec.k, travel: spec.travel, err: 0, route: G.cueRoute(info, { k: spec.k, curveLen: Math.max(3, Math.min(14, spec.travel * 0.35)), travel: spec.travel }) };
  } else if (spec.zone) {
    sol = G.solveToZone(info, G.toPoint(spec.zone), { family });
    if (sol.err > 2.5) c.warnings.push(`bank zone miss ${sol.err.toFixed(1)}`);
  } else {
    const k = family === 'follow' ? 0.8 : family === 'draw' ? -0.8 : 0;
    const travel = spec.cbTravel ?? 14;
    sol = { k, travel, err: 0, route: G.cueRoute(info, { k, curveLen: 6, travel }) };
  }
  const technique = G.techniqueFromSpin(sol.k, info.phi);
  const route = sol.route;
  const obLen = G.polylineLength(mp.points);
  const autoSpeed = G.speedForObjectRoute(info, mp.points, 10);
  const speed = spec.speed ?? autoSpeed;
  const vTips = spec.vTips ?? G.tipsFromSpin(sol.k, info.dCue, technique);
  const end = route.points[route.points.length - 1];
  const hasZone = spec.zone || spec.position;
  const zones = hasZone ? [{ type: 'rings', x: G.round1(end.x), y: G.round1(end.y), rings: rings(spec.rings || [9, 6, 3]), label: 'CB' }] : [];
  Object.assign(c, {
    kind: 'bank',
    technique,
    ballPositions: [{ n: ob.n, x: ob.x, y: ob.y }, ...(spec.others || []).map(toBall)],
    cueBallPosition: G.clean(cue),
    targetBall: ob.n,
    targetPocket: pocket,
    ghost: G.clean(ghost),
    targetZones: zones,
    cueBallPath: cleanPts([cue, ghost, ...route.points.slice(1)]),
    contactIndex: 1,
    objectBallPath: cleanPts(mp.points),
    objectBallPaths: [{ n: ob.n, points: cleanPts(mp.points) }],
    railContacts: [...railMarks(mp.contacts, 'ob'), ...railMarks(route.contacts, 'cue')],
    obRails: rails,
    reflectionCheck: [{ points: cleanPts(mp.points), rails }],
    cueContact: { vTips, hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: r0(info.phi) },
    route: { rails: rails.length, text: `Object ball: ${rails.length} rail${rails.length > 1 ? 's' : ''} (${rails.map((r) => G.RAILS[r].short).join(' → ')})`, short: `${rails.length}-RAIL BANK` },
    spinK: sol.k,
    travel: r0(sol.travel)
  });
  if (!c.goal) c.goal = hasZone ? `Bank the ${ob.n} into the ${T.pocketName(pocket)} and land the cue ball in the zone.` : `Bank the ${ob.n} off the ${rails.map((r) => G.RAILS[r].short).join(' and ')} rail into the ${T.pocketName(pocket)}.`;
  const c0 = mp.contacts[0];
  const img = rails.reduceRight((p, r) => G.mirrorPoint(p, r), G.POCKET_XY[pocket]);
  const [ain] = G.reflectionAngles(ob, mp.points[1], mp.points[2], rails[0]);
  const refRail = c0.rail === 'top' || c0.rail === 'bottom' ? 'head rail' : 'top rail';
  const phi = r0(info.phi);
  c.whyExplanation = {
    whyContact: `${T.contactText(vTips, 0)}: ${technique === 'stun' || technique === 'stop' ? `a sliding hit keeps the cue ball from following the ${ob.n} toward the ${G.RAILS[rails[0]].short} rail and lets it peel off on the tangent line` : technique === 'draw' ? `backspin pulls the cue ball back out of the ${ob.n}'s bank lane so the two balls never kiss` : `follow carries the cue ball forward after the ${ob.n} leaves`}${hasZone ? `, sending it about ${r0(sol.travel)} in to the position zone` : ''}.${note(spec, 'contact')}`,
    whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. The ${ob.n} has about ${r0(obLen)} in to travel including the cushion. Too firm and the ${ob.n} digs into the rubber and comes off shorter (a narrower angle); too soft and it rolls off long and can drift wide. ${formatSpeed(speed)} keeps the rebound closest to the true mirror angle.${note(spec, 'speed')}`,
    whySpin: `No sidespin: english on the cue ball transfers a little opposite spin to the ${ob.n}, which changes its rebound off the ${G.RAILS[rails[0]].short} rail. Learn the pure bank line first.${note(spec, 'spin')}`,
    whyRoute: `The ${ob.n} must hit the ${G.RAILS[c0.rail].name} ${G.diamondsAlong(c0, c0.rail)} diamonds from the ${refRail}${rails.length > 1 ? `, then the ${rails.slice(1).map((r) => G.RAILS[r].short).join(' and ')} rail` : ''}, arriving and leaving at about ${r0(ain)}° from square — angle in equals angle out.${note(spec, 'route')}`,
    whyAim: `Mirror method: imagine the ${T.pocketName(pocket)} reflected ${rails.length > 1 ? 'through each rail in turn' : `across the ${G.RAILS[rails[0]].short} cushion`} — the mirror pocket sits ${r0(G.dist(img, G.POCKET_XY[pocket]))} in away, off the table. A straight line from the ${ob.n} to that mirror pocket crosses the cushion exactly at the contact point. That calls for about a ${phi}° cut (${G.fullnessLabel(info.fullness).toLowerCase()}) on the ${ob.n}.${note(spec, 'aim')}`
  };
  return c;
}

// ---------------------------------------------------------------- kicks
export function buildKick(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const cue = G.toPoint(spec.cue);
  const target = toBall(spec.target);
  const rails = spec.rails;
  let aimPt = target;
  let obPathPts = [];
  let ghost = null;
  if (spec.pocket) {
    const ci = G.cutInfo(cue, target, spec.pocket);
    ghost = ci.ghost;
    aimPt = ghost;
    obPathPts = [G.clean(target), G.clean(G.POCKET_XY[spec.pocket])];
  }
  const mp = G.mirrorPath(cue, aimPt, rails);
  if (!mp.valid) c.warnings.push('kick mirror path invalid');
  let pts = mp.points.slice();
  if (!spec.pocket) {
    // stop the cue-ball centre 2R before the target centre (full contact)
    const a = pts[pts.length - 2];
    const dir = G.norm(G.sub(target, a));
    pts[pts.length - 1] = G.sub(target, G.mul(dir, 2 * R));
    ghost = pts[pts.length - 1];
  }
  const lastDir = G.norm(G.sub(pts[pts.length - 1], pts[pts.length - 2]));
  const zones = [];
  if (spec.safeTravel) {
    // object ball driven along the contact line to a safe area
    const ob = G.straightRoute(target, lastDir, spec.safeTravel);
    obPathPts = cleanPts(ob.points);
    const e = ob.points[ob.points.length - 1];
    zones.push({ type: 'rings', x: G.round1(e.x), y: G.round1(e.y), rings: rings(spec.rings || [10, 6.5, 3.5]), label: 'OB SAFE', obZone: true });
  }
  const L = G.polylineLength(pts);
  const kickLegs = G.legLengths(pts);
  kickLegs[kickLegs.length - 1] += spec.safeTravel ? spec.safeTravel * 2.5 : 12;
  const speed = spec.speed ?? G.clampSpeed(Math.max(1, G.speedFromCapacity(G.capacityForLegs(kickLegs))));
  Object.assign(c, {
    kind: 'kick',
    technique: 'kick',
    ballPositions: [{ n: target.n, x: target.x, y: target.y }, ...(spec.others || []).map(toBall)],
    cueBallPosition: G.clean(cue),
    targetBall: target.n,
    targetPocket: spec.pocket || null,
    ghost: G.clean(ghost),
    targetZones: zones,
    cueBallPath: cleanPts(pts),
    contactIndex: pts.length - 1,
    objectBallPath: obPathPts,
    objectBallPaths: obPathPts.length ? [{ n: target.n, points: obPathPts }] : [],
    railContacts: railMarks(mp.contacts, 'cue'),
    reflectionCheck: [{ points: cleanPts(pts), rails }],
    cueContact: { vTips: spec.vTips ?? 0, hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: spec.pocket ? null : 1, label: spec.pocket ? 'Hit the ghost-ball spot for the pocket' : 'Full hit on the target ball', short: spec.pocket ? 'GHOST' : 'FULL', cutDeg: 0 },
    route: { rails: rails.length, text: T.railsText(mp.contacts), short: T.railsShort(mp.contacts) },
    kickRails: rails.length,
    travel: r0(L)
  });
  if (!c.goal) c.goal = spec.pocket ? `Kick ${rails.length} rail${rails.length > 1 ? 's' : ''} and pocket the ${target.n} in the ${T.pocketName(spec.pocket)}.` : spec.safeTravel ? `Kick ${rails.length} rail${rails.length > 1 ? 's' : ''}, hit the ${target.n} and send it to the safe zone.` : `Kick ${rails.length} rail${rails.length > 1 ? 's' : ''} and make a legal hit on the ${target.n}.`;
  const blk = c.blockers.map((b) => b.n).join(' and ');
  const img = rails.reduceRight((p, r) => G.mirrorPoint(p, r), aimPt);
  const c0 = mp.contacts[0];
  const refRail = c0 && (c0.rail === 'top' || c0.rail === 'bottom') ? 'head rail' : 'top rail';
  let aimTxt;
  if (rails.length === 1) {
    aimTxt = `One-rail mirror: reflect the ${target.n} across the ${G.RAILS[rails[0]].short} cushion — its mirror image sits ${r0(Math.abs(G.RAILS[rails[0]].axis === 'y' ? img.y - aimPt.y : img.x - aimPt.x) / 2)} in beyond the cushion line, directly "behind" the rail. Aim straight at that image: the cue ball meets the cushion ${c0 ? G.diamondsAlong(c0, c0.rail) : '?'} diamonds from the ${refRail} and rebounds onto the ${target.n}.`;
  } else if (rails.length === 2) {
    const perpRails = G.RAILS[rails[0]].axis !== G.RAILS[rails[1]].axis;
    aimTxt = perpRails
      ? `Two rails that meet at a corner act like one mirror through that corner: the ${target.n}'s double image is the point directly opposite it through the corner. Aim at that image and the cue ball touches the ${G.RAILS[rails[0]].short} rail ${G.diamondsAlong(c0, c0.rail)} diamonds from the ${refRail}. Check: after two perpendicular rails the cue ball's last leg runs exactly parallel to its first leg, just in the opposite direction.`
      : `Two parallel rails: mirror the ${target.n} across the ${G.RAILS[rails[1]].short} rail, then mirror that image across the ${G.RAILS[rails[0]].short} rail. Aim at the second image; the cue ball crosses the table twice and first touches down ${G.diamondsAlong(c0, c0.rail)} diamonds from the ${refRail}.`;
  } else {
    aimTxt = `Three rails: stack the mirrors — reflect the ${target.n} across the last rail (${G.RAILS[rails[2]].short}), then the middle (${G.RAILS[rails[1]].short}), then the first (${G.RAILS[rails[0]].short}). The final image sits far off the table; aim at it and the first contact lands ${G.diamondsAlong(c0, c0.rail)} diamonds from the ${refRail}. On real cloth, firmer speed and a touch of running english lengthen the path, so treat the mirror line as your starting estimate.`;
  }
  c.whyExplanation = {
    whyContact: `${T.contactText(c.cueContact.vTips, 0)}: a centre hit keeps the cue ball's rebound angles true to the mirror geometry — sidespin would bend each rebound and ruin a ${rails.length}-rail estimate.${note(spec, 'contact')}`,
    whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. The kick route is about ${r0(L)} in long${spec.safeTravel ? ` and the ${target.n} still has to travel about ${r0(spec.safeTravel)} in afterwards to hide` : ''}. Hitting harder than needed compresses the cushion and shortens each rebound, so use just enough pace.${note(spec, 'speed')}`,
    whySpin: `No sidespin. ${rails.length > 1 ? `Across ${rails.length} rails any english compounds with every rebound` : 'Even a little side changes the rebound angle off the cushion'}; center ball keeps the kick honest.${note(spec, 'spin')}`,
    whyRoute: `${blk ? `The ${blk} blocks the direct line to the ${target.n}, so` : 'So'} the cue ball goes ${G.railListText(mp.contacts)} — ${rails.length} rail${rails.length > 1 ? 's' : ''} — ${spec.pocket ? `arriving at the ghost-ball spot that sends the ${target.n} into the ${T.pocketName(spec.pocket)}` : spec.safeTravel ? `hitting the ${target.n} full so it runs to the safe zone` : `hitting the ${target.n} nearly full for a legal contact`}.${note(spec, 'route')}`,
    whyAim: aimTxt + note(spec, 'aim')
  };
  return c;
}

// ---------------------------------------------------------------- straight pots (Pocket Sniper)
export function buildPot(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const ob = toBall(spec.ob);
  const pocket = spec.pocket;
  const cue = spec.cut ? placeCue(ob, G.sub(G.POCKET_XY[pocket], ob), spec.cut) : G.toPoint(spec.cue);
  if (!G.ballOnTable(cue)) c.warnings.push(`cue off table ${cue.x},${cue.y}`);
  const info = G.cutInfo(cue, ob, pocket);
  const obLen = G.dist(ob, G.POCKET_XY[pocket]);
  const speed = spec.speed ?? G.speedForObjectRoute(info, [ob, G.POCKET_XY[pocket]], 14);
  const k = spec.k ?? 0;
  const route = info.phi < 5 && !spec.k ? { points: [info.ghost], contacts: [] } : G.cueRoute(info, { k, curveLen: 4, travel: spec.cbTravel ?? 10 });
  const phi = r0(info.phi);
  Object.assign(c, {
    kind: 'pot',
    technique: phi < 5 ? 'stop' : 'stun',
    ballPositions: [{ n: ob.n, x: ob.x, y: ob.y }, ...(spec.others || []).map(toBall)],
    cueBallPosition: G.clean(cue),
    targetBall: ob.n,
    targetPocket: pocket,
    ghost: G.clean(info.ghost),
    showGhost: phi >= 8,
    targetZones: [],
    cueBallPath: cleanPts([cue, info.ghost, ...route.points.slice(1)]),
    contactIndex: 1,
    objectBallPath: [G.clean(ob), G.clean(G.POCKET_XY[pocket])],
    objectBallPaths: [{ n: ob.n, points: [G.clean(ob), G.clean(G.POCKET_XY[pocket])] }],
    railContacts: railMarks(route.contacts, 'cue'),
    cueContact: { vTips: spec.vTips ?? (info.dCue > 45 ? -0.5 : 0), hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: phi },
    route: { rails: 0, text: 'Pot only — cue ball wherever', short: 'POT' },
    travel: 0
  });
  if (!c.goal) c.goal = `Pocket the ${ob.n} in the ${T.pocketName(pocket)}.`;
  const nearRail = ob.y < 9 || ob.y > 41 || ob.x < 9 || ob.x > 91;
  c.whyExplanation = {
    whyContact: `${T.contactText(c.cueContact.vTips, 0)}: ${info.dCue > 45 ? `over a long ${r0(info.dCue)}-inch approach a touch below center keeps the cue ball from rolling into a follow-through that changes the throw` : 'center ball removes every variable except the aim line'} — this game only scores the pot.${note(spec, 'contact')}`,
    whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. The ${ob.n} travels about ${r0(obLen)} in; ${phi > 45 ? 'thin cuts transfer little energy, so it needs more stroke than it looks' : 'a smooth pace lets the pocket accept a slightly off-line ball instead of rattling it out'}.${note(spec, 'speed')}`,
    whySpin: `No sidespin — ${nearRail ? `the ${ob.n} is near a cushion, where english-induced throw would push it into the rail before the pocket` : 'on a pure pocketing test english only adds squirt and throw'}.${note(spec, 'spin')}`,
    whyRoute: `The cue ball's route doesn't matter here; focus on the ${ob.n}'s ${r0(obLen)}-inch path into the ${T.pocketName(pocket)}${nearRail ? ', running parallel and close to the cushion' : ''}.${note(spec, 'route')}`,
    whyAim: `${G.fullnessLabel(info.fullness)} (${phi}° cut). The ghost ball sits against the ${ob.n} on the far side from the ${T.pocketName(pocket)}; aim the cue ball's centre at it.${phi > 40 ? ' On thin cuts the ghost ball is the only reliable reference — the contact point on the object ball is barely visible.' : ''}${throwNote('stun', phi, ob.n)}${note(spec, 'aim')}`
  };
  return c;
}

// ---------------------------------------------------------------- caroms
function searchContact(cue, ob, k, target, maxTravel, rangeDeg = 78) {
  let best = null;
  for (let a = 0; a < 360; a += 0.5) {
    const gpos = G.add(ob, G.P(Math.cos(G.rad(a)) * 2 * R, Math.sin(G.rad(a)) * 2 * R));
    const info = G.aimInfo(cue, ob, gpos);
    if (info.phi > rangeDeg || info.dCue < 4) continue;
    // cue must actually approach from outside: ghost must be the first touching point
    const route = G.cueRoute(info, { k, curveLen: 6, travel: maxTravel });
    const pts = route.points;
    // find first point where cue centre within 2R of target
    let hit = null;
    let s = 0;
    for (let i = 1; i < pts.length && !hit; i++) {
      const A = pts[i - 1];
      const B = pts[i];
      const seg = G.dist(A, B);
      const steps = Math.max(1, Math.ceil(seg / 0.4));
      for (let j = 1; j <= steps; j++) {
        const q = G.add(A, G.mul(G.sub(B, A), j / steps));
        if (G.dist(q, target) <= 2 * R) {
          hit = { q, s: s + (seg * j) / steps, idx: i, closest: G.distToSegment(target, A, B) };
          break;
        }
      }
      s += seg;
    }
    if (!hit) continue;
    const err = hit.closest; // 0 = full hit on the target
    if (!best || err < best.err) best = { a, info, route, hit, err };
  }
  return best;
}

const rail0 = (spec) => spec.variant === 'rail';
export function buildCarom(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const cue = G.toPoint(spec.cue);
  const variant = spec.variant;
  const labels = [];
  let ballPositions = [];
  let cuePath = [];
  let obPaths = [];
  let contacts = [];
  let aim;
  let info;
  let technique = 'stun';
  let speed;
  let why;
  if (variant === 'cb' || variant === 'rail') {
    const b1 = toBall(spec.ob1);
    let b2 = toBall(spec.ob2);
    const k = spec.k ?? { stun: 0, follow: 1, draw: -1 }[spec.family || 'stun'];
    const wantCut = spec.caromCut || null; // [deg, side] — carom designed from the cut, target ball placed on the route
    technique = spec.family || 'stun';
    let best;
    let pre = [cue];
    if (variant === 'rail') {
      // cue → rail → b1 (contact) → carom into b2
      const rail = spec.rail;
      const ax = G.RAILS[rail].axis === 'y' ? 'x' : 'y';
      const lo = ax === 'x' ? 8 : 8;
      const hi = ax === 'x' ? 92 : 42;
      let bb = null;
      for (let v = lo; v <= hi; v += 0.25) {
        const C = G.RAILS[rail].axis === 'y' ? G.P(v, G.RAILS[rail].value) : G.P(G.RAILS[rail].value, v);
        const inDir = G.norm(G.sub(C, cue));
        const outDir = G.RAILS[rail].axis === 'y' ? G.P(inDir.x, -inDir.y) : G.P(-inDir.x, inDir.y);
        // does the ray from C hit b1?
        const toB = G.sub(b1, C);
        const along = G.dot(toB, outDir);
        if (along <= 0) continue;
        const off = Math.abs(toB.x * outDir.y - toB.y * outDir.x);
        if (off >= 2 * R * 0.97) continue;
        const back = Math.sqrt(4 * R * R - off * off);
        const gpos = G.add(C, G.mul(outDir, along - back));
        const inf = G.aimInfo(C, b1, gpos);
        if (wantCut) {
          const sgn = Math.sign(inDir.x * 0 + (outDir.x * inf.n.y - outDir.y * inf.n.x)) || 1;
          const e = Math.abs(inf.phi - wantCut[0]) + (sgn === wantCut[1] ? 0 : 50);
          if (!bb || e < bb.err) bb = { err: e, C, info: inf, route: G.cueRoute(inf, { k, curveLen: 6, travel: spec.ob2Travel + 2 * R }) };
          continue;
        }
        const route = G.cueRoute(inf, { k, curveLen: 6, travel: 70 });
        const dmin = G.distToPolyline(b2, route.points);
        if (!bb || dmin < bb.err) bb = { err: dmin, C, info: inf, route };
      }
      best = bb;
      if (best) {
        pre = [cue, best.C];
        contacts.push({ ...G.clean(best.C), rail, by: 'cue', order: 1 });
      }
    } else if (wantCut) {
      let n = G.rotate(G.norm(G.sub(b1, cue)), wantCut[0] * wantCut[1]);
      for (let it = 0; it < 12; it++) {
        const gh = G.sub(b1, G.mul(n, 2 * R));
        n = G.rotate(G.norm(G.sub(gh, cue)), wantCut[0] * wantCut[1]);
      }
      const inf = G.aimInfo(cue, b1, G.sub(b1, G.mul(n, 2 * R)));
      best = { err: 0, info: inf, route: G.cueRoute(inf, { k, curveLen: Math.max(3, Math.min(12, spec.ob2Travel * 0.35)), travel: spec.ob2Travel + 2 * R }) };
    } else {
      best = searchContact(cue, b1, k, b2, 70);
    }
    if (wantCut && best) {
      // place the target ball so the cue ball meets it full at ob2Travel along the carom route
      const rp = best.route.points;
      const tip = G.truncatePolyline(rp, G.polylineLength(rp));
      const end = tip[tip.length - 1];
      b2 = { ...b2, x: G.round1(end.x), y: G.round1(end.y) };
      if (rail0(spec) && best.err > 4) c.warnings.push(`rail carom cut mismatch ${best.err.toFixed(1)}`);
      best.err = 0;
    }
    if (!best) {
      c.warnings.push('carom search failed');
      best = { info: G.aimInfo(cue, b1, G.sub(b1, G.P(2 * R, 0))), route: { points: [cue], contacts: [] }, err: 99 };
    }
    info = best.info;
    // truncate route at contact with b2
    const rp = best.route.points;
    let stopAt = rp.length ? G.polylineLength(rp) : 0;
    let acc = 0;
    outer: for (let i = 1; i < rp.length; i++) {
      const seg = G.dist(rp[i - 1], rp[i]);
      const steps = Math.max(1, Math.ceil(seg / 0.3));
      for (let j = 1; j <= steps; j++) {
        const q = G.add(rp[i - 1], G.mul(G.sub(rp[i], rp[i - 1]), j / steps));
        if (G.dist(q, b2) <= 2 * R) {
          stopAt = acc + (seg * j) / steps;
          break outer;
        }
      }
      acc += seg;
    }
    const post = G.truncatePolyline(rp, stopAt);
    const contact2 = post[post.length - 1];
    cuePath = cleanPts([...pre, info.ghost, ...post.slice(1)]);
    const postRails = G.foldPolyline(post).contacts.length;
    if (best.err > R) c.warnings.push(`carom target miss ${best.err.toFixed(1)}`);
    const b1Route = G.straightRoute(b1, info.n, spec.ob1Travel ?? 16);
    obPaths = [{ n: b1.n, points: cleanPts(b1Route.points) }];
    const b2dir = G.norm(G.sub(b2, contact2));
    if (spec.pocket2) obPaths.push({ n: b2.n, points: [G.clean(b2), G.clean(G.POCKET_XY[spec.pocket2])] });
    else obPaths.push({ n: b2.n, points: cleanPts(G.straightRoute(b2, b2dir, 10).points) });
    labels.push({ ...G.clean(info.ghost), label: String(labels.length + contacts.length + 1) });
    labels.push({ ...G.clean(contact2), label: String(labels.length + contacts.length + 1) });
    ballPositions = [{ n: b1.n, x: b1.x, y: b1.y }, { n: b2.n, x: b2.x, y: b2.y }];
    aim = { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: r0(info.phi) };
    const L = G.polylineLength(cuePath);
    speed = spec.speed ?? G.speedForShot(info, k, [info.ghost, ...post.slice(1)].length > 1 ? post : null, technique === 'stun' ? 'stun' : technique);
    c.targetBall = b1.n;
    c.caromTarget = b2.n;
    c.targetPocket = spec.pocket2 || null;
    const phi = r0(info.phi);
    const t2 = r0(G.polylineLength(post));
    why = {
      whyContact: `${T.contactText(spec.vTips ?? G.tipsFromSpin(k, info.dCue, technique), 0)}: ${technique === 'stun' ? `a sliding cue ball glances off the ${b1.n} exactly along the tangent line — the carom line to the ${b2.n}` : technique === 'follow' ? `a rolling cue ball bends forward off the tangent line after the ${b1.n}; that bend is what carries it onto the ${b2.n}` : `backspin hooks the cue ball back behind the tangent line and onto the ${b2.n}`}.${note(spec, 'contact')}`,
      whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. The cue ball must still be moving after ${t2} in of carom travel${postRails ? ` and ${postRails} rail${postRails > 1 ? 's' : ''}` : ''}${spec.pocket2 ? ` with enough pace to push the ${b2.n} into the ${T.pocketName(spec.pocket2)}` : ''}. ${technique === 'follow' ? 'Too firm and the follow bends late, sailing wide of the target.' : 'Too soft and the cue ball starts rolling early and bends off the carom line.'}${note(spec, 'speed')}`,
      whySpin: `No sidespin — carom lines come from vertical spin and the tangent line; side english would throw the ${b1.n} and bend the rebound.${note(spec, 'spin')}`,
      whyRoute: `Contact order: ${variant === 'rail' ? `① the ${G.RAILS[spec.rail].short} rail first, ② the ${b1.n}, ③ the ${b2.n}` : `① the ${b1.n}, ② the ${b2.n}`}. ${variant === 'rail' ? `Going to the rail first changes the angle into the ${b1.n} so the tangent line points at the ${b2.n}.` : `The ${b2.n} sits ${t2} in down the carom line.`}${note(spec, 'route')}`,
      whyAim: `${G.fullnessLabel(info.fullness)} on the ${b1.n} (${phi}° cut). ${technique === 'follow' && phi >= 18 && phi <= 42 ? `Near half-ball a rolling cue ball deflects roughly 30° from the aim line — the ${b2.n} sits on that natural-angle line.` : `The tangent line runs 90° from the ${b1.n}'s path; the ${b2.n} must sit on it${technique === 'stun' ? '' : ' after the spin bends it'}.`}${note(spec, 'aim')}`
    };
  } else if (variant === 'combo' || variant === 'kiss') {
    const b1 = toBall(spec.ob1);
    const b2 = toBall(spec.ob2);
    const pocket = spec.pocket;
    const pk = G.POCKET_XY[pocket];
    let g1;
    let g2;
    let b1Path;
    let b2Path;
    if (variant === 'combo') {
      // 1 is struck into 2, 2 goes to pocket
      const n2 = G.norm(G.sub(pk, b2));
      g2 = G.sub(b2, G.mul(n2, 2 * R));
      const n1 = G.norm(G.sub(g2, b1));
      g1 = G.sub(b1, G.mul(n1, 2 * R));
      b1Path = [G.clean(b1), G.clean(g2)];
      b2Path = [G.clean(b2), G.clean(pk)];
      c.targetBall = b2.n;
    } else {
      // kiss: the 1 glances off the 2 along the 2's tangent line into the pocket (1 is pocketed)
      const dvec = G.sub(pk, b2);
      const dd = G.len(dvec);
      const alpha = Math.acos(Math.min(1, (2 * R) / dd));
      const base = G.norm(dvec);
      const cands = [G.rotate(base, G.deg(alpha)), G.rotate(base, -G.deg(alpha))].map((u) => G.add(b2, G.mul(u, 2 * R)));
      // choose candidate closer to b1
      g2 = cands.sort((p, q) => G.dist(p, b1) - G.dist(q, b1))[0];
      const n1 = G.norm(G.sub(g2, b1));
      g1 = G.sub(b1, G.mul(n1, 2 * R));
      b1Path = [G.clean(b1), G.clean(g2), G.clean(pk)];
      b2Path = cleanPts(G.straightRoute(b2, G.norm(G.sub(b2, g2)), 8).points);
      c.targetBall = b1.n;
    }
    info = G.aimInfo(cue, b1, g1);
    const route = G.cueRoute(info, { k: 0, curveLen: 4, travel: spec.cbTravel ?? 8 });
    cuePath = cleanPts([cue, g1, ...route.points.slice(1)]);
    obPaths = [{ n: b1.n, points: b1Path }, { n: b2.n, points: b2Path }];
    labels.push({ ...G.clean(g1), label: '1' }, { ...G.clean(g2), label: '2' });
    ballPositions = [{ n: b1.n, x: b1.x, y: b1.y }, { n: b2.n, x: b2.x, y: b2.y }];
    aim = { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: r0(info.phi) };
    const cut2 = r0(G.angleBetween(G.sub(g2, b1), variant === 'combo' ? G.sub(pk, b2) : G.sub(b2, g2)));
    speed = spec.speed ?? G.clampSpeed(Math.max(1.5, G.speedFromCapacity(info.dCue + (G.dist(b1, g2) + (G.dist(b2, pk) + 12) / 0.8) / Math.max(0.15, Math.cos(G.rad(info.phi)) ** 2))));
    c.targetPocket = pocket;
    const phi = r0(info.phi);
    why = {
      whyContact: `${T.contactText(0, 0)}: center ball keeps the ${b1.n} rolling true — any spin on the cue ball transfers throw to the ${b1.n} and changes the second collision.${note(spec, 'contact')}`,
      whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. ${variant === 'combo' ? `The ${b1.n} only has to reach the ${b2.n} (${r0(G.dist(b1, g2))} in) and the ${b2.n} must travel ${r0(G.dist(b2, pk))} in` : `The ${b1.n} travels ${r0(G.dist(b1, g2))} in to the ${b2.n} and then ${r0(G.dist(g2, pk))} in to the pocket`}. Firm-but-smooth pace reduces throw between the object balls; too hard and the pocket rejects it.${note(spec, 'speed')}`,
      whySpin: `No sidespin: with two collisions in a row, throw on the first multiplies into a big miss on the second.${note(spec, 'spin')}`,
      whyRoute: variant === 'combo'
        ? `Contact order ① cue ball → ${b1.n}, ② ${b1.n} → ${b2.n}, then the ${b2.n} drops in the ${T.pocketName(pocket)}. The ${b1.n} hits the ${b2.n} with about a ${cut2}° cut.${note(spec, 'route')}`
        : `Contact order ① cue ball → ${b1.n}, ② the ${b1.n} glances off the ${b2.n} and rides the ${b2.n}'s tangent line into the ${T.pocketName(pocket)}. The ${b2.n} barely moves off its spot.${note(spec, 'route')}`,
      whyAim: variant === 'combo'
        ? `Work backwards: first find the ghost spot behind the ${b2.n} for the pocket, then treat that spot as the "pocket" for the ${b1.n}. That makes the cue-ball shot a ${phi}° cut (${G.fullnessLabel(info.fullness).toLowerCase()}).${note(spec, 'aim')}`
        : `The ${b1.n} must touch the ${b2.n} at the point where the ${b2.n}'s tangent line points at the pocket — about a ${cut2}° glance. Send the ${b1.n} there with a ${phi}° cut from the cue ball (${G.fullnessLabel(info.fullness).toLowerCase()}).${note(spec, 'aim')}`
    };
  }
  Object.assign(c, {
    kind: 'carom',
    variant,
    technique,
    ballPositions: [...ballPositions, ...(spec.others || []).map(toBall)],
    cueBallPosition: G.clean(cue),
    ghost: G.clean(info.ghost),
    targetZones: [],
    cueBallPath: cuePath,
    contactIndex: variant === 'rail' ? 2 : 1,
    objectBallPath: obPaths[0]?.points || [],
    objectBallPaths: obPaths,
    railContacts: contacts,
    contactLabels: labels,
    cueContact: { vTips: spec.vTips ?? G.tipsFromSpin(spec.k ?? { stun: 0, follow: 1, draw: -1 }[spec.family || 'stun'] ?? 0, info.dCue, technique), hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim,
    route: { rails: contacts.length, text: variant === 'rail' ? 'Rail first, then the carom' : 'Ball-to-ball carom', short: variant === 'rail' ? 'RAIL-FIRST' : variant === 'combo' ? 'COMBO' : variant === 'kiss' ? 'KISS' : 'CAROM' },
    travel: r0(G.polylineLength(cuePath))
  });
  if (variant === 'rail') c.reflectionCheck = [{ points: [G.clean(cue), contacts[0], G.clean(info.ghost)], rails: [spec.rail] }];
  if (!c.goal) c.goal = variant === 'combo' ? `Combination: cue ball → ${spec.ob1[0]} → ${spec.ob2[0]} into the ${T.pocketName(spec.pocket)}.` : variant === 'kiss' ? `Kiss the ${spec.ob1[0]} off the ${spec.ob2[0]} into the ${T.pocketName(spec.pocket)}.` : `Carom the cue ball off the ${spec.ob1[0]} into the ${spec.ob2[0]}.`;
  c.whyExplanation = why;
  return c;
}

// ---------------------------------------------------------------- safeties
export function buildSafety(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const cue = G.toPoint(spec.cue);
  const ob = toBall(spec.ob);
  const obZ = G.toPoint(spec.obZone);
  // restrict object-ball directions to cuts under ~70°
  const base = G.norm(G.sub(ob, cue));
  const baseDeg = G.deg(Math.atan2(base.y, base.x));
  const obSol = G.solveStraightToZone(ob, obZ, { maxRails: spec.obRails ?? 2, minDeg: baseDeg - 70, maxDeg: baseDeg + 70 });
  const n = obSol.dir;
  const ghost = G.sub(ob, G.mul(n, 2 * R));
  const info = G.aimInfo(cue, ob, ghost);
  const family = spec.family || 'stun';
  const sol = spec.k != null && spec.travel != null
    ? { k: spec.k, travel: spec.travel, err: 0, route: G.cueRoute(info, { k: spec.k, curveLen: Math.max(3, Math.min(12, spec.travel * 0.35)), travel: spec.travel }) }
    : G.solveToZone(info, G.toPoint(spec.cueZone), { family, maxTravel: spec.maxTravel ?? 80 });
  if (sol.err > 3) c.warnings.push(`safety cue zone miss ${sol.err.toFixed(1)}`);
  if (obSol.err > 3) c.warnings.push(`safety ob zone miss ${obSol.err.toFixed(1)}`);
  const technique = G.techniqueFromSpin(sol.k, info.phi);
  const cueEnd = sol.route.points[sol.route.points.length - 1];
  const obEnd = obSol.route.points[obSol.route.points.length - 1];
  const speed = spec.speed ?? G.clampSpeed(Math.max(G.speedForShot(info, sol.k, sol.route.points, technique) * 0.5 + G.speedForObjectRoute(info, obSol.route.points, 0) * 0.5, 1));
  const vTips = spec.vTips ?? G.tipsFromSpin(sol.k, info.dCue, technique);
  if (spec.autoBlock) {
    // blockers placed on the sight line between the two finishing spots (fraction along cue→OB)
    const d = G.sub(obEnd, cueEnd);
    const u = G.norm(G.perp(d));
    const cuePts = [cue, ghost, ...sol.route.points.slice(1)];
    const fixed = [cue, ob, ...(spec.others || []).map(toBall)];
    for (const [n, f0, off0 = 0] of spec.autoBlock) {
      let best = null;
      for (let f = 0.08; f <= 0.92; f += 0.02) {
        for (let off = off0 - 2.5; off <= off0 + 2.5; off += 0.5) {
          const q = G.add(G.add(cueEnd, G.mul(d, f)), G.mul(u, off));
          if (!G.ballOnTable(q)) continue;
          const clear = Math.min(
            G.distToPolyline(q, cuePts),
            G.distToPolyline(q, obSol.route.points),
            ...fixed.map((b) => G.dist(q, b)),
            ...c.blockers.map((b) => G.dist(q, b) + 0.2)
          );
          if (clear < 2 * R + 0.5) continue;
          const cost = Math.abs(f - f0) * 10 + Math.abs(off - off0);
          if (!best || cost < best.cost) best = { cost, q };
        }
      }
      if (!best) { c.warnings.push(`no clear blocker spot for ${n}`); continue; }
      c.blockers.push({ n, x: G.round1(best.q.x), y: G.round1(best.q.y) });
    }
  }
  const zones = [
    { type: 'rings', x: G.round1(cueEnd.x), y: G.round1(cueEnd.y), rings: rings(spec.rings || [9, 6, 3]), label: 'CB' },
    { type: 'rings', x: G.round1(obEnd.x), y: G.round1(obEnd.y), rings: rings(spec.obRings || [10, 6.5, 3.5]), label: 'OB', obZone: true }
  ];
  Object.assign(c, {
    kind: 'safety',
    technique,
    objective: spec.objective || 'hide',
    ballPositions: [{ n: ob.n, x: ob.x, y: ob.y }, ...(spec.others || []).map(toBall)],
    cueBallPosition: G.clean(cue),
    targetBall: ob.n,
    targetPocket: null,
    ghost: G.clean(ghost),
    targetZones: zones,
    cueBallPath: cleanPts([cue, ghost, ...sol.route.points.slice(1)]),
    contactIndex: 1,
    objectBallPath: cleanPts(obSol.route.points),
    objectBallPaths: [{ n: ob.n, points: cleanPts(obSol.route.points) }],
    railContacts: [...railMarks(obSol.route.contacts, 'ob'), ...railMarks(sol.route.contacts, 'cue')],
    reflectionCheck: [{ points: cleanPts(obSol.route.points), rails: obSol.route.contacts.map((q) => q.rail) }],
    cueContact: { vTips, hTips: 0 },
    english: { hTips: 0, type: 'none' },
    speed,
    aim: { fraction: Math.round(info.fullness * 100) / 100, label: G.fullnessLabel(info.fullness), short: G.shortFullness(info.fullness), cutDeg: r0(info.phi) },
    route: { rails: sol.route.contacts.length + obSol.route.contacts.length, text: `CB ${T.railsText(sol.route.contacts)} · OB ${T.railsText(obSol.route.contacts)}`, short: `OB ${obSol.route.contacts.length}R · CB ${sol.route.contacts.length}R` },
    hideCheck: spec.hide !== false ? { cue: G.clean(cueEnd), target: G.clean(obEnd) } : null,
    criteria: spec.criteria || [
      'Foul, no rail after contact, or an open shot left',
      'Playable: opponent has a tough cut or long shot',
      'Tough: only a bank or a thin edge is visible',
      'Locked: no part of the object ball is visible — opponent must kick'
    ],
    travel: r0(sol.travel)
  });
  if (!c.goal) c.goal = spec.goalText || `Hit the ${ob.n} to its zone and hide the cue ball in yours.`;
  const blk = c.blockers.map((b) => b.n).join(' and ');
  const obRails = obSol.route.contacts.length;
  const cbRails = sol.route.contacts.length;
  c.whyExplanation = {
    whyContact: `${T.contactText(vTips, 0)}: ${technique === 'draw' ? `backspin holds the cue ball back so it stops ${T.areaName(cueEnd)} instead of drifting into the open` : technique === 'follow' ? `follow pushes the cue ball on through to the far side of the ${blk || 'blocker'}` : `a sliding hit sends the cue ball out on the tangent line and lets it die ${T.areaName(cueEnd)}`}.${note(spec, 'contact')}`,
    whySpeed: `${speedLabel(speed)} — ${speedMeaning(speed)}. The ${ob.n} needs about ${r0(obSol.travel)} in${obRails ? ` including ${obRails} cushion${obRails > 1 ? 's' : ''}` : ''} while the cue ball needs only ${r0(sol.travel)} in. Safeties are speed shots: half a step too firm and both balls sail out of their zones.${note(spec, 'speed')}`,
    whySpin: `No sidespin — on a touch shot, english adds throw on the ${ob.n} and alters the cue ball's rebound, and you need both balls to stop exactly.${note(spec, 'spin')}`,
    whyRoute: `The ${ob.n} goes ${obRails ? G.railListText(obSol.route.contacts) : 'directly'} to finish ${T.areaName(obEnd)}; the cue ball goes ${cbRails ? G.railListText(sol.route.contacts) : 'directly'} to finish ${T.areaName(cueEnd)}${blk ? `, leaving the ${blk} between them` : ''}. ${obRails + cbRails ? 'A ball reaches a cushion after contact, keeping the safety legal.' : 'Make sure a ball reaches a rail after contact or it is a foul.'}${note(spec, 'route')}`,
    whyAim: `${G.fullnessLabel(info.fullness)} (${r0(info.phi)}° cut). ${info.phi > 45 ? `A thin hit moves the ${ob.n} a short way while the cue ball keeps most of its pace` : `A thick hit gives the ${ob.n} most of the energy while the cue ball dies quickly`} — exactly the split this safety needs.${note(spec, 'aim')}`
  };
  return c;
}

// ---------------------------------------------------------------- multi-ball (Position Train / Pattern Puzzle)
/**
 * Auto-position solver: search spin and travel for a landing spot that leaves a comfortable
 * (~15–35°) cut on the next ball, without touching other balls or scratching.
 */
function autoLanding(cuePos, ob, pocket, next, remaining, family, prefer = 22, maxSpeed = 3.5) {
  const info = G.cutInfo(cuePos, ob, pocket);
  const [lo, hi] = Array.isArray(family) ? family : G.SPIN_RANGES[family] || G.SPIN_RANGES.any;
  const nextPk = G.POCKET_XY[next.pocket];
  let best = null;
  for (let k = lo; k <= hi + 1e-9; k += 0.1) {
    for (let s = 6; s <= 110; s += 2) {
      const route = G.cueRoute(info, { k, curveLen: Math.max(3, Math.min(14, s * 0.35)), travel: s });
      const P = route.points[route.points.length - 1];
      if (!G.ballOnTable(P) || P.x < 7 || P.x > 93 || P.y < 7 || P.y > 43) continue;
      if (route.points.some((q) => G.nearestPocketDist(q) < 6)) continue;
      const pts = [info.ghost, ...route.points.slice(1)];
      if (remaining.some((b) => G.distToPolyline(b, pts) < 2 * R + 0.4)) continue;
      const ni = G.cutInfo(P, next, next.pocket);
      if (ni.dCue < 9 || ni.dCue > 42) continue;
      if (remaining.some((b) => b !== next && b.n !== next.n && G.distToSegment(b, P, ni.ghost) < 2 * R + 0.3)) continue;
      if (remaining.some((b) => b.n !== next.n && G.distToSegment(b, next, nextPk) < 2 * R + 0.3)) continue;
      const tech = Math.abs(k) <= 0.15 ? 'stun' : k > 0 ? 'follow' : 'draw';
      const spd = G.speedForShot(info, k, route.points, tech);
      if (spd > maxSpeed) continue;
      const score = Math.abs(ni.phi - prefer) + 0.25 * Math.abs(ni.dCue - 20) + 0.04 * s + 2 * Math.abs(k) + route.contacts.length * 2 + Math.max(0, spd - 2.5) * 8;
      if (!best || score < best.score) best = { score, k: Math.round(k * 100) / 100, travel: s };
    }
  }
  return best;
}

export function buildTrain(spec, defaults = {}) {
  const c = baseChallenge(spec, defaults);
  const steps = [];
  const allBalls = spec.steps.map((s) => toBall(s.ob));
  let cuePos = spec.cue && spec.cue !== 'auto' ? G.toPoint(spec.cue) : null;
  if (!cuePos || G.cutInfo(cuePos, allBalls[0], spec.steps[0].pocket).phi > 60) {
    // ball in hand: place the cue ball for a comfortable first shot
    const b0 = allBalls[0];
    const dir = G.sub(G.POCKET_XY[spec.steps[0].pocket], b0);
    let placed = null;
    for (const deg of [12, 18, 8, 25, 4]) {
      for (const side of [1, -1]) {
        for (let dd = 22; dd >= 12 && !placed; dd -= 2) {
          const p = G.cueFromCut(b0, dir, [deg, side, dd]);
          if (!G.ballOnTable(p)) continue;
          const gi = G.cutInfo(p, b0, spec.steps[0].pocket);
          if (allBalls.slice(1).some((b) => G.dist(b, p) < 2 * R + 0.5 || G.distToSegment(b, p, gi.ghost) < 2 * R + 0.3)) continue;
          placed = p;
        }
      }
      if (placed) break;
    }
    if (placed) cuePos = placed;
    else c.warnings.push('could not place cue ball in hand');
  }
  const cueStart = cuePos;
  const zones = [];
  for (let i = 0; i < spec.steps.length; i++) {
    const s = spec.steps[i];
    const ob = toBall(s.ob);
    const last = i === spec.steps.length - 1;
    if (!last && s.zone == null && s.travel == null) {
      const nb = toBall([...spec.steps[i + 1].ob.slice(0, 3), spec.steps[i + 1].pocket]);
      const auto = autoLanding(cuePos, ob, s.pocket, nb, allBalls.slice(i + 1), s.family || 'any', s.prefer ?? 22) || autoLanding(cuePos, ob, s.pocket, nb, allBalls.slice(i + 1), 'any', s.prefer ?? 22, 5);
      if (auto) {
        s.k = auto.k;
        s.travel = auto.travel;
      } else c.warnings.push(`step ${i + 1}: no auto landing found`);
    }
    const stepSpec = {
      id: `${spec.id}-s${i + 1}`,
      cue: [cuePos.x, cuePos.y],
      ob: s.ob,
      pocket: s.pocket,
      family: s.family || 'stun',
      zone: s.zone || null,
      k: s.k,
      travel: s.travel,
      english: s.english,
      rings: spec.rings,
      note: s.note,
      nextBall: !last ? [...spec.steps[i + 1].ob.slice(0, 3), spec.steps[i + 1].pocket] : null,
      others: allBalls.slice(i + 2)
    };
    let st;
    if (s.zone || s.travel != null) {
      st = buildPosition(stepSpec, defaults);
    } else {
      st = buildPot({ ...stepSpec, id: stepSpec.id }, defaults);
    }
    // collisions with remaining balls
    for (const b of allBalls.slice(i + 1)) {
      const d = G.distToPolyline(b, st.cueBallPath);
      if (d < 2 * R * 0.92) c.warnings.push(`step ${i + 1} cue path hits ball ${b.n} (${d.toFixed(1)})`);
      const d2 = G.distToSegment(b, ob, G.POCKET_XY[s.pocket]);
      if (d2 < 2 * R * 0.92) c.warnings.push(`step ${i + 1} OB path blocked by ${b.n}`);
    }
    c.warnings.push(...st.warnings.map((w) => `step ${i + 1}: ${w}`));
    const zone = st.targetZones[0] || null;
    if (zone && !last) {
      zone.forBall = spec.steps[i + 1].ob[0];
      zone.step = i + 1;
      zones.push(zone);
    }
    steps.push({
      index: i,
      ball: ob.n,
      pocket: s.pocket,
      cueFrom: G.clean(cuePos),
      zone,
      needsZone: !!zone && !last,
      cueBallPath: st.cueBallPath,
      objectBallPath: st.objectBallPath,
      railContacts: st.railContacts,
      cueContact: st.cueContact,
      english: st.english,
      speed: st.speed,
      aim: st.aim,
      route: st.route,
      technique: st.technique,
      ghost: st.ghost,
      whyExplanation: st.whyExplanation,
      goal: last ? `Pocket the ${ob.n} in the ${T.pocketName(s.pocket)} to finish.` : `Pocket the ${ob.n} in the ${T.pocketName(s.pocket)} and land in zone ${i + 1} for the ${spec.steps[i + 1].ob[0]}.`
    });
    if (zone) cuePos = G.P(zone.x, zone.y);
    else cuePos = G.toPoint(st.cueBallPath[st.cueBallPath.length - 1]);
  }
  Object.assign(c, {
    kind: 'train',
    technique: steps[0].technique,
    ballPositions: allBalls.map((b) => ({ n: b.n, x: b.x, y: b.y })),
    cueBallPosition: G.clean(cueStart),
    targetBall: allBalls[0].n,
    targetPocket: spec.steps[0].pocket,
    targetZones: zones,
    steps,
    order: allBalls.map((b) => b.n),
    cueBallPath: steps[0].cueBallPath,
    contactIndex: 1,
    objectBallPath: steps[0].objectBallPath,
    objectBallPaths: [{ n: allBalls[0].n, points: steps[0].objectBallPath }],
    railContacts: steps[0].railContacts,
    cueContact: steps[0].cueContact,
    english: steps[0].english,
    speed: steps[0].speed,
    aim: steps[0].aim,
    route: steps[0].route,
    whyExplanation: steps[0].whyExplanation
  });
  if (!c.goal) c.goal = `Run all ${steps.length} balls in order, landing in every zone.`;
  if (spec.patternWhy) c.patternWhy = spec.patternWhy;
  if (spec.decoyOrder) c.decoyOrder = spec.decoyOrder;
  if (spec.routeSide) c.routeSide = spec.routeSide;
  if (spec.routeSideOptions) c.routeSideOptions = spec.routeSideOptions;
  return c;
}

export function buildChallenge(spec, defaults = {}) {
  const kind = spec.kind || defaults.kind || 'position';
  const fn = { position: buildPosition, lag: buildLag, bank: buildBank, kick: buildKick, pot: buildPot, carom: buildCarom, safety: buildSafety, train: buildTrain }[kind];
  if (!fn) throw new Error(`Unknown kind ${kind}`);
  const ch = fn(spec, defaults);
  ch.kind = kind === 'train' ? 'train' : ch.kind;
  return ch;
}
