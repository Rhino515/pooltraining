/**
 * .pooliq ⇄ Pool IQ challenge objects (pure, no DOM).
 * A .pooliq "shot" uses the exact field names of the challenge data model the drill library, Arcade and
 * Create Drill already use (cueBallPosition, ballPositions, targetZones, cueBallPath, cueContact, speed, …),
 * so shotToChallenge() only fills in derived fields (ghost, aim, route, technique) that the file left out.
 */
import { aimInfo, fullnessLabel, shortFullness, POCKET_NAMES } from '../games/geometry.js';
import { railsText, railsShort } from '../games/text.js';
import { FORMAT, SCHEMA_VERSION, BALL_R, SHOT_KINDS, TECHNIQUES, ENGLISH_TYPES, SCORING_MODES, validatePooliq } from './schema.js';
import { SKILL_NAMES } from '../storage.js';

const r2 = (v) => Math.round(v * 100) / 100;
const pt = (p) => ({ x: p.x, y: p.y });
export const WHY_KEYS = ['whyCustom', 'whyContact', 'whySpeed', 'whySpin', 'whyRoute', 'whyAim'];

export function techniqueFromTip(vTips = 0, cutDeg = 10) {
  if (vTips >= 0.25) return 'follow';
  if (vTips <= -0.25) return 'draw';
  return cutDeg < 5 ? 'stop' : 'stun';
}

/** Contact point (ghost) for Aim View: explicit, or the cue path point at contactIndex when it touches the target ball */
export function deriveGhost(s) {
  if (s.ghost) return pt(s.ghost);
  const cp = s.cueBallPath || [];
  const ci = s.contactIndex ?? 1;
  const ob = (s.ballPositions || []).find((b) => b.n === s.targetBall) || (s.ballPositions || [])[0];
  const g = cp[ci];
  if (g && ob && Math.abs(Math.hypot(g.x - ob.x, g.y - ob.y) - 2 * BALL_R) < 0.25) return pt(g);
  return null;
}

export function deriveAim(s, ghost = deriveGhost(s)) {
  if (s.aim) return { fraction: s.aim.fraction ?? null, label: s.aim.label ?? '—', short: s.aim.short ?? '—', cutDeg: s.aim.cutDeg ?? 0 };
  const cp = s.cueBallPath || [];
  const ci = s.contactIndex ?? 1;
  const ob = (s.ballPositions || []).find((b) => b.n === s.targetBall) || (s.ballPositions || [])[0];
  if (ghost && ob && cp[ci - 1]) {
    const info = aimInfo(cp[ci - 1], ob, ghost);
    return { fraction: r2(info.fullness), label: fullnessLabel(info.fullness), short: shortFullness(info.fullness), cutDeg: Math.round(info.phi) };
  }
  return { fraction: null, label: '—', short: '—', cutDeg: 0 };
}

export function deriveRoute(s) {
  if (s.route) return { rails: s.route.rails ?? 0, text: s.route.text ?? '—', short: s.route.short ?? '' };
  const cueRails = (s.railContacts || []).filter((c) => (c.by || 'cue') === 'cue');
  return { rails: cueRails.length, text: railsText(cueRails), short: railsShort(cueRails) };
}

/**
 * Challenge object (the engine / renderer data model) for a validated shot.
 * meta: { id, title, category, difficulty, skill, scoringRules, xp, skillEffects }
 */
export function shotToChallenge(shot, meta = {}) {
  const s = shot || {};
  const cc = s.cueContact ? { vTips: s.cueContact.vTips, hTips: s.cueContact.hTips } : { vTips: 0, hTips: 0 };
  const ghost = deriveGhost(s);
  const aim = deriveAim(s, ghost);
  const zones = (s.targetZones || []).map((z) => (z.type === 'band' ? { ...z, rings: z.rings.map((r) => ({ ...r })) } : { type: 'rings', x: z.x, y: z.y, rings: z.rings.map((r) => ({ ...r })), ...(z.label ? { label: z.label } : {}) }));
  const obPaths = (s.objectBallPaths || []).map((p) => ({ n: p.n, points: p.points.map(pt) }));
  const tb = s.targetBall ?? (s.ballPositions || [])[0]?.n ?? null;
  const sr = meta.scoringRules || { mode: 'success', attempts: 10, pass: { made: 7 } };
  const pocketWord = s.targetPocket ? POCKET_NAMES[s.targetPocket] : null;
  const goal = s.goal || (tb != null && pocketWord ? `Pocket the ${tb} in the ${pocketWord}${zones.length ? ' and land the cue ball in the zone' : ''}.` : 'Play the shot as shown.');
  const hType = s.english?.type && s.english.type !== 'none' ? s.english.type : cc.hTips ? (cc.hTips > 0 ? 'right' : 'left') : 'none';
  const why = {};
  for (const k of WHY_KEYS) if (s.whyExplanation?.[k]) why[k] = s.whyExplanation[k];
  return {
    id: meta.id,
    name: meta.title || 'Untitled',
    game: 'drills',
    category: meta.category || 'Imported',
    difficulty: meta.difficulty || 2,
    level: meta.difficulty || 2,
    kind: s.kind || (zones.length ? 'position' : 'pot'),
    technique: s.technique || techniqueFromTip(cc.vTips, aim.cutDeg || 0),
    instructions: s.instructions || `Set up the balls as shown (tap SETUP for the diamond positions). ${goal}`,
    setupInstructions: s.setupInstructions || '',
    goal,
    hints: (s.hints || []).slice(),
    attemptCount: sr.attempts,
    passingRequirement: { ...sr.pass },
    scoringRules: { ...sr, pass: { ...sr.pass } },
    prerequisites: [],
    skillEffects: { ...(meta.skillEffects || (meta.skill ? { [meta.skill]: 1 } : {})) },
    xp: meta.xp ?? 50,
    unlocks: [],
    warnings: [],
    blockers: (s.blockers || []).map((b) => ({ n: b.n, x: b.x, y: b.y })),
    ballPositions: (s.ballPositions || []).map((b) => ({ n: b.n, x: b.x, y: b.y })),
    cueBallPosition: pt(s.cueBallPosition),
    targetBall: tb,
    targetPocket: s.targetPocket || null,
    acceptPockets: s.acceptPockets ? s.acceptPockets.slice() : s.targetPocket ? [s.targetPocket] : [],
    ghost,
    targetZones: zones,
    cueBallPath: (s.cueBallPath || []).map(pt),
    contactIndex: s.contactIndex ?? 1,
    objectBallPath: (obPaths.find((p) => p.n === tb) || obPaths[0])?.points || [],
    objectBallPaths: obPaths,
    railContacts: (s.railContacts || []).map((c) => ({ x: c.x, y: c.y, rail: c.rail, by: c.by || 'cue', ...(c.order ? { order: c.order } : {}) })),
    referenceMarkers: (s.referenceMarkers || []).map((m) => ({ ...m })),
    cueContact: cc,
    english: { hTips: cc.hTips, type: hType },
    speed: s.speed,
    aim,
    route: deriveRoute(s),
    whyExplanation: why,
    imported: true
  };
}

/** Challenge for a playable item (drill doc, pack stage drill, game stage, lesson step, challenge doc) */
export function itemChallenge(item, id, extra = {}) {
  return shotToChallenge(item.shot, { id, title: extra.title || item.title, category: item.category, difficulty: item.difficulty, skill: item.skill, scoringRules: extra.scoringRules || item.scoringRules, xp: item.xp, skillEffects: item.skillEffects });
}

// ------------------------------------------------------------------ challenge → .pooliq (export of Create Drill drills)
const has = (v) => v !== undefined && v !== null && v !== '';
/** .pooliq shot from any challenge object (custom drill, content drill) — only schema fields */
export function shotFromChallenge(ch) {
  const s = {};
  if (SHOT_KINDS.includes(ch.kind)) s.kind = ch.kind;
  s.cueBallPosition = pt(ch.cueBallPosition);
  if (ch.ballPositions?.length) s.ballPositions = ch.ballPositions.map((b) => ({ n: b.n, x: b.x, y: b.y }));
  if (ch.blockers?.length) s.blockers = ch.blockers.map((b) => ({ n: b.n, x: b.x, y: b.y }));
  if (has(ch.targetBall) && (ch.ballPositions || []).some((b) => b.n === ch.targetBall)) s.targetBall = ch.targetBall;
  if (ch.targetPocket) {
    s.targetPocket = ch.targetPocket;
    const acc = (ch.acceptPockets || []).filter((k) => k);
    if (acc.length && !(acc.length === 1 && acc[0] === ch.targetPocket)) s.acceptPockets = acc.includes(ch.targetPocket) ? acc.slice() : [ch.targetPocket, ...acc];
  }
  if (ch.targetZones?.length) s.targetZones = ch.targetZones.map((z) => (z.type === 'band' ? { type: 'band', center: z.center, rings: z.rings.map((r) => ({ r: r.r, stars: r.stars })) } : { x: z.x, y: z.y, rings: z.rings.map((r) => ({ r: r.r, stars: r.stars })), ...(z.label ? { label: String(z.label).slice(0, 12) } : {}) }));
  if ((ch.cueBallPath || []).length >= 2) {
    s.cueBallPath = ch.cueBallPath.map(pt);
    const ci = ch.contactIndex ?? 1;
    if (ci >= 1 && ci < s.cueBallPath.length) s.contactIndex = ci;
  }
  if (ch.ghost) s.ghost = pt(ch.ghost);
  const obp = (ch.objectBallPaths || []).filter((p) => (p.points || []).length >= 2 && has(p.n));
  if (obp.length) s.objectBallPaths = obp.map((p) => ({ n: p.n, points: p.points.map(pt) }));
  else if ((ch.objectBallPath || []).length >= 2 && has(ch.targetBall)) s.objectBallPaths = [{ n: ch.targetBall, points: ch.objectBallPath.map(pt) }];
  if (ch.railContacts?.length) s.railContacts = ch.railContacts.map((c) => ({ x: c.x, y: c.y, rail: c.rail, ...(c.by ? { by: c.by } : {}), ...(c.order ? { order: c.order } : {}) }));
  if (ch.referenceMarkers?.length) s.referenceMarkers = ch.referenceMarkers.map((m) => ({ rail: m.rail, diamond: m.diamond, ...(m.label ? { label: m.label } : {}), ...(m.kind ? { kind: m.kind } : {}) }));
  s.cueContact = { vTips: ch.cueContact?.vTips || 0, hTips: ch.cueContact?.hTips || 0 };
  if (ch.english?.type && ch.english.type !== 'none' && ENGLISH_TYPES.includes(ch.english.type)) s.english = { type: ch.english.type };
  if (TECHNIQUES.includes(ch.technique)) s.technique = ch.technique;
  s.speed = ch.speed;
  if (ch.aim && ch.aim.fraction != null) s.aim = { fraction: ch.aim.fraction, label: ch.aim.label, short: ch.aim.short, cutDeg: Math.min(90, Math.max(0, ch.aim.cutDeg || 0)) };
  if (ch.route) s.route = { rails: ch.route.rails || 0, text: ch.route.text || '', short: ch.route.short || '' };
  if (ch.goal) s.goal = ch.goal;
  if (ch.instructions) s.instructions = ch.instructions;
  if (ch.setupInstructions) s.setupInstructions = ch.setupInstructions;
  const why = {};
  for (const k of WHY_KEYS) if (ch.whyExplanation?.[k]) why[k] = ch.whyExplanation[k];
  if (Object.keys(why).length) s.whyExplanation = why;
  if (ch.hints?.length) s.hints = ch.hints.slice(0, 10);
  return s;
}

/** Full .pooliq drill document for a challenge (Create Drill export / imported drill after editing) */
export function docFromChallenge(ch, meta = {}) {
  const sr = ch.scoringRules || { mode: 'success', attempts: ch.attemptCount || 10, pass: ch.passingRequirement || { made: 7 } };
  const scoring = { mode: SCORING_MODES.includes(sr.mode) ? sr.mode : 'success', attempts: sr.attempts || ch.attemptCount || 10, pass: { ...(sr.pass || ch.passingRequirement || {}) } };
  if (scoring.mode === 'zone' && sr.requirePocket === false) scoring.requirePocket = false;
  const id = String(meta.id || ch.contentId || ch.id || 'drill').replace(/[^A-Za-z0-9._-]/g, '-').replace(/^[^A-Za-z0-9]+/, '').slice(0, 64) || 'drill';
  const skills = Object.fromEntries(Object.entries(ch.skillEffects || {}).filter(([k, v]) => SKILL_NAMES.includes(k) && v >= 0 && v <= 1));
  const doc = {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    contentType: 'drill',
    id,
    contentVersion: meta.contentVersion || '1.0',
    title: String(meta.title || ch.name || 'Untitled drill').slice(0, 80)
  };
  if (meta.description) doc.description = meta.description;
  doc.category = String(ch.category || 'Shot Making').slice(0, 40);
  doc.difficulty = Math.max(1, Math.min(10, Math.round(Number(ch.difficulty) || 2)));
  const skill = meta.skill || Object.keys(skills)[0];
  if (SKILL_NAMES.includes(skill)) doc.skill = skill;
  if (meta.attribution && Object.values(meta.attribution).some(has)) doc.attribution = Object.fromEntries(Object.entries(meta.attribution).filter(([, v]) => has(v)));
  if (meta.careerEligible) doc.careerEligible = true;
  doc.metadata = { ...(meta.metadata || {}), ...(meta.metadata?.generator ? {} : { generator: 'Pool IQ Create Drill' }) };
  doc.shot = shotFromChallenge(ch);
  doc.scoringRules = scoring;
  if (Number.isInteger(ch.xp) && ch.xp >= 0 && ch.xp <= 1000) doc.xp = ch.xp;
  if (Object.keys(skills).length) doc.skillEffects = skills;
  return doc;
}

/** Validate a generated document (export safety net) — returns the normalized doc or throws with the error list */
export function checkedDoc(doc) {
  const v = validatePooliq(JSON.stringify(doc));
  if (!v.ok) throw new Error(v.errors.slice(1, 4).join(' · ') || v.errors[0]);
  return v.doc;
}
