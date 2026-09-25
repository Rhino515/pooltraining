/**
 * Create Drill ⇄ .pooliq bridge (pure helpers, no DOM).
 * Extra builder fields (all optional — a builder without them behaves exactly like v9):
 *   routeMode 'sim' | 'manual'   manual = hand-drawn paths from a .pooliq file or the draw tools
 *   manual { cuePath[], contactIndex, ghost, obPaths[{n, points}], rails[{x, y, rail, by}] }
 *   markers[{rail, diamond, label, kind}]  technique  englishType  kind  aimOverride  routeOverride
 *   whyContact whySpeed whySpin whyRoute whyAim  setupInstructions  hints (one per line)
 *   description  attribution{author, sourceName, sourceURL, notes}  contentVersion  bandZones[]  zones[i].rings/label
 */
import * as CD from '../customDrills.js';
import { shotFromChallenge, shotToChallenge, WHY_KEYS } from '../content/convert.js';
import { BALL_R } from '../content/schema.js';
import { POCKETS } from '../tableDiagram.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const r2 = (v) => Math.round(v * 100) / 100;
const txt = (v) => String(v ?? '').trim();
const EXTRA_WHY = ['whyContact', 'whySpeed', 'whySpin', 'whyRoute', 'whyAim'];

export function emptyManual() {
  return { cuePath: [], contactIndex: 1, ghost: null, obPaths: [], rails: [] };
}

/** Builder state from a .pooliq shot (+ the item/doc fields around it) — lossless for untouched fields */
export function builderFromShot(shot, item = {}, doc = null) {
  const b = CD.defaultBuilder();
  const s = clone(shot);
  const sr = item.scoringRules;
  const zones = (s.targetZones || []).filter((z) => z.type !== 'band').map((z) => ({ x: z.x, y: z.y, rings: z.rings, ...(z.label ? { label: z.label } : {}), ...(z.type === 'rings' ? { typed: true } : {}) }));
  const out = {
    ...b,
    id: null,
    title: item.title || doc?.title || '',
    category: item.category || doc?.category || 'Imported',
    skill: item.skill || doc?.skill || Object.keys(item.skillEffects || {})[0] || b.skill,
    difficulty: item.difficulty || doc?.difficulty || 2,
    cue: { ...s.cueBallPosition },
    balls: (s.ballPositions || []).map((o) => ({ ...o })),
    blockers: (s.blockers || []).map((o) => ({ ...o })),
    targetBall: s.targetBall ?? null,
    pockets: s.acceptPockets ? s.acceptPockets.slice() : s.targetPocket ? [s.targetPocket] : [],
    acceptExplicit: !!s.acceptPockets,
    zones,
    bandZones: (s.targetZones || []).filter((z) => z.type === 'band'),
    tip: { vTips: s.cueContact?.vTips || 0, hTips: s.cueContact?.hTips || 0 },
    speed: s.speed,
    instructions: s.instructions || '',
    goal: s.goal || '',
    why: s.whyExplanation?.whyCustom || '',
    routeMode: s.cueBallPath?.length >= 2 || !(s.targetBall != null && s.targetPocket) ? 'manual' : 'sim',
    manual: {
      cuePath: (s.cueBallPath || []).map((p) => ({ ...p })),
      contactIndex: s.contactIndex ?? 1,
      ghost: s.ghost ? { ...s.ghost } : null,
      obPaths: (s.objectBallPaths || []).map((p) => ({ n: p.n, points: p.points.map((q) => ({ ...q })) })),
      rails: (s.railContacts || []).map((c) => ({ ...c }))
    },
    markers: (s.referenceMarkers || []).map((m) => ({ ...m })),
    technique: s.technique || '',
    englishType: s.english?.type || '',
    kind: s.kind || '',
    aimOverride: s.aim ? { ...s.aim } : null,
    routeOverride: s.route ? { ...s.route } : null,
    setupInstructions: s.setupInstructions || '',
    hints: (s.hints || []).join('\n'),
    description: (doc && item === doc ? doc.description : item.description) || '',
    attribution: { ...(doc?.attribution || {}) },
    contentVersion: doc?.contentVersion || '1.0',
    careerEligible: !!doc?.careerEligible
  };
  for (const k of EXTRA_WHY) out[k] = s.whyExplanation?.[k] || '';
  if (sr) out.scoring = { ...b.scoring, mode: sr.mode, attempts: sr.attempts, made: sr.pass.made ?? b.scoring.made, stars: sr.pass.stars ?? b.scoring.stars, pockets: sr.pass.pockets ?? b.scoring.pockets, requirePocket: sr.requirePocket !== false };
  else out.scoring = { ...b.scoring, mode: 'success', none: true };
  return out;
}

/** Scoring rules for the file from builder scoring */
export function scoringFromBuilder(sc) {
  const mode = sc.mode || 'success';
  const out = { mode, attempts: Math.max(1, Math.min(50, Math.round(sc.attempts) || 10)), pass: {} };
  if (mode === 'success' || mode === 'binary') out.pass.made = Math.max(1, Math.min(out.attempts, Math.round(sc.made) || 1));
  else {
    out.pass.stars = Math.max(0, Math.min(out.attempts * 3, Math.round(sc.stars) || 0));
    if (mode === 'zone' && sc.requirePocket !== false) out.pass.pockets = Math.max(0, Math.min(out.attempts, Math.round(sc.pockets) || 0));
    if (mode === 'zone' && sc.requirePocket === false) out.requirePocket = false;
  }
  return out;
}

function zonesFor(b) {
  const sizes = CD.ZONE_SIZES[b.zoneSize] || CD.ZONE_SIZES.M;
  const rings = [{ r: sizes[0], stars: 1 }, { r: sizes[1], stars: 2 }, { r: sizes[2], stars: 3 }];
  const z = (b.zones || []).map((q, i) => ({ type: 'rings', x: r2(q.x), y: r2(q.y), rings: q.rings ? clone(q.rings) : clone(rings), label: q.label || (b.zones.length > 1 ? `Z${i + 1}` : 'CB') }));
  return [...z, ...clone(b.bandZones || [])];
}

/** Manual (drawn / imported) route fields for a challenge or shot */
export function manualRoute(b) {
  const m = b.manual || emptyManual();
  const cuePath = m.cuePath.length >= 2 ? m.cuePath.map((p) => ({ x: r2(p.x), y: r2(p.y) })) : [];
  const out = {};
  if (cuePath.length >= 2) {
    out.cueBallPath = cuePath;
    out.contactIndex = Math.max(1, Math.min(cuePath.length - 1, m.contactIndex || 1));
  }
  if (m.ghost) out.ghost = { ...m.ghost };
  const obp = m.obPaths.filter((p) => p.points.length >= 2);
  if (obp.length) out.objectBallPaths = obp.map((p) => ({ n: p.n, points: p.points.map((q) => ({ x: r2(q.x), y: r2(q.y) })) }));
  if (m.rails.length) out.railContacts = m.rails.map((c) => ({ ...c }));
  return out;
}

/** Apply the extra builder fields to a challenge built by CD.buildCustomDrill (custom drills + sim-mode content) */
export function applyExtras(ch, b) {
  if (b.technique) ch.technique = b.technique;
  if (b.englishType) ch.english = { ...ch.english, type: b.englishType };
  if (b.kind) ch.kind = b.kind;
  if ((b.zones || []).some((z) => z.rings || z.label) || (b.bandZones || []).length) ch.targetZones = zonesFor(b);
  const why = { ...(ch.whyExplanation || {}) };
  for (const k of EXTRA_WHY) if (txt(b[k])) why[k] = txt(b[k]);
  ch.whyExplanation = why;
  if (txt(b.setupInstructions)) ch.setupInstructions = txt(b.setupInstructions);
  const hints = String(b.hints || '').split('\n').map(txt).filter(Boolean).slice(0, 10);
  if (hints.length) ch.hints = hints;
  if ((b.markers || []).length) ch.referenceMarkers = clone(b.markers);
  if (b.routeMode === 'manual') {
    const mr = manualRoute(b);
    const s = { ...shotFromChallenge(ch), ...mr };
    delete s.aim;
    delete s.route;
    if (!mr.objectBallPaths) delete s.objectBallPaths;
    if (!mr.railContacts) delete s.railContacts;
    if (!mr.ghost) delete s.ghost;
    if (b.aimOverride) s.aim = b.aimOverride;
    if (b.routeOverride) s.route = b.routeOverride;
    const d = shotToChallenge(s, {});
    Object.assign(ch, { cueBallPath: d.cueBallPath, contactIndex: d.contactIndex, ghost: d.ghost, objectBallPaths: d.objectBallPaths, objectBallPath: d.objectBallPath, railContacts: d.railContacts, aim: d.aim, route: d.route });
  }
  if (txt(b.description)) ch.description = txt(b.description);
  return ch;
}

/** .pooliq shot from the builder — content mode (no target ball / pocket required) */
export function shotFromBuilder(b, simRoute = null) {
  if (b.routeMode !== 'manual' && simRoute) {
    const ch = applyExtras(CD.buildCustomDrill({ ...b, title: b.title || 'Untitled' }, { id: 'content-edit', route: simRoute }), b);
    const s = shotFromChallenge(ch);
    if (!b.kind) delete s.kind;
    return s;
  }
  const s = {};
  if (b.kind) s.kind = b.kind;
  s.cueBallPosition = { x: r2(b.cue.x), y: r2(b.cue.y) };
  if (b.balls.length) s.ballPositions = b.balls.map((o) => ({ n: o.n, x: r2(o.x), y: r2(o.y) }));
  if (b.blockers.length) s.blockers = b.blockers.map((o) => ({ n: o.n, x: r2(o.x), y: r2(o.y) }));
  if (b.balls.some((o) => o.n === b.targetBall)) s.targetBall = b.targetBall;
  if (b.pockets.length) {
    s.targetPocket = b.pockets[0];
    if (b.pockets.length > 1 || b.acceptExplicit) s.acceptPockets = b.pockets.slice();
  }
  // content zones keep exactly what the file had (no default labels / type) so an untouched edit is lossless
  const sizes = CD.ZONE_SIZES[b.zoneSize] || CD.ZONE_SIZES.M;
  const dflt = [{ r: sizes[0], stars: 1 }, { r: sizes[1], stars: 2 }, { r: sizes[2], stars: 3 }];
  const zones = [
    ...(b.zones || []).map((q) => ({ ...(q.typed ? { type: 'rings' } : {}), x: r2(q.x), y: r2(q.y), rings: clone(q.rings || dflt), ...(q.label ? { label: q.label } : {}) })),
    ...clone(b.bandZones || [])
  ];
  if (zones.length) s.targetZones = zones;
  Object.assign(s, manualRoute(b));
  if ((b.markers || []).length) s.referenceMarkers = clone(b.markers);
  s.cueContact = { vTips: b.tip.vTips || 0, hTips: b.tip.hTips || 0 };
  if (b.englishType && b.englishType !== 'none') s.english = { type: b.englishType };
  else if (b.englishType === 'none') s.english = { type: 'none' };
  if (b.technique) s.technique = b.technique;
  s.speed = Number(b.speed);
  if (b.aimOverride) s.aim = clone(b.aimOverride);
  if (b.routeOverride) s.route = clone(b.routeOverride);
  if (txt(b.goal)) s.goal = txt(b.goal);
  if (txt(b.instructions)) s.instructions = txt(b.instructions);
  if (txt(b.setupInstructions)) s.setupInstructions = txt(b.setupInstructions);
  const why = {};
  if (txt(b.why)) why.whyCustom = txt(b.why);
  for (const k of EXTRA_WHY) if (txt(b[k])) why[k] = txt(b[k]);
  if (Object.keys(why).length) s.whyExplanation = why;
  const hints = String(b.hints || '').split('\n').map(txt).filter(Boolean).slice(0, 10);
  if (hints.length) s.hints = hints;
  return s;
}

/** Document-level fields from the builder (root drill / challenge) */
export function applyRootMeta(doc, b) {
  doc.title = txt(b.title).slice(0, 80) || doc.title;
  if (txt(b.description)) doc.description = txt(b.description); else delete doc.description;
  if (txt(b.category)) doc.category = txt(b.category).slice(0, 40);
  doc.difficulty = Math.max(1, Math.min(10, Math.round(Number(b.difficulty) || 2)));
  if (b.skill) doc.skill = b.skill;
  if (txt(b.contentVersion)) doc.contentVersion = txt(b.contentVersion);
  const at = Object.fromEntries(Object.entries(b.attribution || {}).map(([k, v]) => [k, txt(v)]).filter(([, v]) => v));
  if (Object.keys(at).length) doc.attribution = at; else delete doc.attribution;
  if (doc.contentType === 'drill') { if (b.careerEligible) doc.careerEligible = true; else delete doc.careerEligible; }
  return doc;
}

// ------------------------------------------------------------------ drawing helpers (table units)
const RAIL_SNAP = 2.6;
const r3 = (v) => Math.round(v * 1000) / 1000;
/** Snap a drawn cue/OB path point: onto a ball contact, a rail (ball centre R from the cushion), or a pocket */
export function snapPathPoint(p, { prev = null, balls = [], pockets = false } = {}) {
  if (pockets) for (const [k, pk] of Object.entries(POCKETS)) if (Math.hypot(pk.x - p.x, pk.y - p.y) < pk.r + 1.2) return { point: { x: pk.x, y: pk.y }, pocket: k };
  for (const o of balls) {
    if (prev && Math.hypot(o.x - p.x, o.y - p.y) < BALL_R * 1.6) {
      const L = Math.hypot(o.x - prev.x, o.y - prev.y) || 1;
      return { point: { x: r3(o.x - ((o.x - prev.x) / L) * 2 * BALL_R), y: r3(o.y - ((o.y - prev.y) / L) * 2 * BALL_R) }, contact: o.n };
    }
  }
  const q = { x: Math.max(BALL_R, Math.min(100 - BALL_R, p.x)), y: Math.max(BALL_R, Math.min(50 - BALL_R, p.y)) };
  const d = { top: p.y, bottom: 50 - p.y, left: p.x, right: 100 - p.x };
  const rail = Object.keys(d).reduce((a, k) => (d[k] < d[a] ? k : a));
  if (d[rail] < RAIL_SNAP) {
    if (rail === 'top') q.y = BALL_R;
    if (rail === 'bottom') q.y = 50 - BALL_R;
    if (rail === 'left') q.x = BALL_R;
    if (rail === 'right') q.x = 100 - BALL_R;
    const nose = rail === 'top' ? { x: r2(q.x), y: 0 } : rail === 'bottom' ? { x: r2(q.x), y: 50 } : rail === 'left' ? { x: 0, y: r2(q.y) } : { x: 100, y: r2(q.y) };
    return { point: { x: r3(q.x), y: r3(q.y) }, rail, nose };
  }
  return { point: { x: r2(q.x), y: r2(q.y) } };
}
