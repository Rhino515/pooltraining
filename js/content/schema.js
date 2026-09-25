/**
 * .pooliq content format — strict schema + validator (pure, no DOM). See POOLIQ_CONTENT_SCHEMA.md.
 *
 * A .pooliq file is DATA ONLY: strict JSON, validated field by field against a whitelist before anything
 * is shown. Nothing in it is ever executed or inserted as HTML: unknown fields, HTML/script-like strings,
 * javascript:/data: URLs, event-handler text, prototype keys (__proto__, constructor, prototype),
 * oversized files, deep nesting and huge lists are rejected with a readable error list.
 *
 * validatePooliq(textOrObject) → { ok, errors[], warnings[], doc } where doc is the NORMALIZED document
 * (a fresh object built only from whitelisted fields; diamond-unit points converted to table units,
 * objectBallPath shorthand converted to objectBallPaths). Normalization is idempotent, so
 * validate(export(doc)).doc deep-equals doc (lossless round trip).
 *
 * Coordinates (canonical): table units, the playing surface cushion-nose to cushion-nose is 100 × 50,
 * x 0 = head (left) rail → 100 = foot (right) rail, y 0 = top rail → 50 = bottom rail, 1 diamond = 12.5.
 * Alternative input: { dx, dy } in diamonds (dx 0–8 from the head rail, dy 0–4 from the top rail).
 */
import { SKILL_NAMES } from '../storage.js';

export const FORMAT = 'pooliq';
export const SCHEMA_VERSION = '1.0';
export const SUPPORTED = { major: 1, minor: 0 };
export const FILE_EXT = '.pooliq';
export const MAX_FILE_BYTES = 512 * 1024;
export const MAX_DEPTH = 14;
export const MAX_NODES = 25000;
export const MAX_STRING = 4000;
export const BALL_R = 1.125;
export const DIAMOND = 12.5;
export const CONTENT_TYPES = ['drill', 'pack', 'lesson', 'game', 'challenge'];
export const STAGE_CONTENT_TYPES = ['drill', 'lesson', 'game', 'challenge'];
export const GAME_TEMPLATES = ['gauntlet', 'target', 'streak', 'lives', 'scoreAttack', 'multiStage', 'quizExecution'];
export const TEMPLATE_NAMES = { gauntlet: 'Gauntlet', target: 'Target / Accuracy', streak: 'Streak', lives: 'Lives', scoreAttack: 'Score Attack', multiStage: 'Multi-Stage Challenge', quizExecution: 'Quiz + Execution' };
export const CHALLENGE_TYPES = ['diamond', 'solution'];
export const SCORING_MODES = ['success', 'binary', 'zone', 'stars'];
export const POCKET_IDS = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];
export const RAIL_IDS = ['top', 'bottom', 'left', 'right'];
export const RAIL_DIAMONDS = { top: 8, bottom: 8, left: 4, right: 4 };
export const TECHNIQUES = ['stop', 'stun', 'follow', 'draw', 'stun-run', 'stun-draw', 'lag', 'bank', 'kick'];
export const SHOT_KINDS = ['pot', 'position', 'bank', 'kick', 'carom', 'safety', 'lag'];
export const ENGLISH_TYPES = ['none', 'left', 'right', 'running', 'reverse'];
export const LESSON_PHASES = ['teach', 'guided', 'solve', 'execute', 'test'];
export const PHASE_NAMES = { teach: 'TEACH', guided: 'GUIDED PRACTICE', solve: 'SOLVE IT YOURSELF', execute: 'EXECUTE', test: 'TEST' };
export const ASK_FIELDS = ['technique', 'tip', 'english', 'speed', 'rails', 'rail', 'diamond'];
export const STAGE_TYPES = ['lesson', 'practice', 'test', 'final'];
export const MARKER_KINDS = ['reference', 'aim', 'contact', 'target'];
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 5;
export const DEFAULT_TOLERANCE = { pass: 0.2, close: 0.5 };
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Script-like / markup content that is never allowed in any string (the app shows plain text only) */
const UNSAFE = [
  [/<\s*\/?\s*[a-z!?]/i, 'HTML tags'],
  [/javascript\s*:/i, 'a javascript: link'],
  [/vbscript\s*:/i, 'a vbscript: link'],
  [/\bdata\s*:\s*[a-z]+\/[a-z0-9.+-]+/i, 'a data: URL'],
  [/\bon[a-z]{3,}\s*=/i, 'an event-handler attribute (on…=)'],
  [/&#x?[0-9a-f]+;?/i, 'HTML character codes'],
  [/\\u00?3c|\\x3c/i, 'escaped HTML'],
  [/\beval\s*\(|\bnew\s+Function\s*\(|\bsetTimeout\s*\(|\bdocument\s*\.\s*(cookie|write|location)|\bwindow\s*\.\s*location/i, 'script code'],
  [/expression\s*\(|url\s*\(|@import/i, 'CSS code']
];
export function unsafeReason(s) {
  if (typeof s !== 'string') return null;
  for (const [re, why] of UNSAFE) if (re.test(s)) return why;
  return null;
}

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const r3 = (v) => Math.round(v * 1000) / 1000;

function makeCtx() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    err(p, m) { if (errors.length < 80) errors.push(p ? `${p}: ${m}` : m); },
    warn(p, m) { if (warnings.length < 40) warnings.push(p ? `${p}: ${m}` : m); }
  };
}

/** Security pre-scan of the raw parsed JSON: forbidden keys, depth, size, script-like strings anywhere */
function prescan(raw, c) {
  let nodes = 0;
  let depthHit = false;
  const walk = (v, p, d) => {
    if (++nodes > MAX_NODES) return;
    if (d > MAX_DEPTH) { if (!depthHit) c.err(p, `nested too deeply (max ${MAX_DEPTH} levels)`); depthHit = true; return; }
    if (typeof v === 'string') {
      if (v.length > MAX_STRING) c.err(p, `text is too long (${v.length} characters, max ${MAX_STRING})`);
      const why = unsafeReason(v);
      if (why) c.err(p, `contains ${why} — .pooliq files may only contain plain text, never code or markup`);
      return;
    }
    if (typeof v === 'number') { if (!Number.isFinite(v)) c.err(p, 'is not a valid number'); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${p}[${i}]`, d + 1)); return; }
    if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) {
        const kp = p ? `${p}.${k}` : k;
        if (FORBIDDEN_KEYS.has(k)) { c.err(kp, `forbidden key "${k}" (not allowed for security)`); continue; }
        if (unsafeReason(k)) { c.err(kp, 'field name contains script-like content'); continue; }
        walk(v[k], kp, d + 1);
      }
    }
  };
  walk(raw, '', 0);
  if (nodes > MAX_NODES) c.err('', `the file has too many values (max ${MAX_NODES})`);
}

// ------------------------------------------------------------------ field validators
function suggestion(k, fields) {
  const low = k.toLowerCase();
  const hit = Object.keys(fields).find((f) => f.toLowerCase() === low || f.toLowerCase().startsWith(low.slice(0, 5)));
  return hit ? ` (did you mean "${hit}"?)` : '';
}
function objOf(v, p, c, fields, required = []) {
  if (!isObj(v)) { c.err(p, 'must be an object { … }'); return undefined; }
  const out = {};
  for (const k of Object.keys(v)) if (!Object.prototype.hasOwnProperty.call(fields, k) && !FORBIDDEN_KEYS.has(k)) c.err(p ? `${p}.${k}` : k, `unknown field${suggestion(k, fields)}`);
  for (const k of required) if (v[k] === undefined || v[k] === null) c.err(p ? `${p}.${k}` : k, 'is required');
  for (const k of Object.keys(fields)) {
    if (v[k] === undefined || v[k] === null || FORBIDDEN_KEYS.has(k)) continue;
    const r = fields[k](v[k], p ? `${p}.${k}` : k, c, v);
    if (r !== undefined) out[k] = r;
  }
  return out;
}
const T = {
  str: (max, min = 0) => (v, p, c) => {
    if (typeof v !== 'string') return void c.err(p, 'must be text in "quotes"');
    if (v.length > max) return void c.err(p, `is too long (${v.length} characters, max ${max})`);
    if (v.trim().length < min) return void c.err(p, 'must not be empty');
    return v;
  },
  int: (min, max) => (v, p, c) => (Number.isInteger(v) && v >= min && v <= max ? v : void c.err(p, `must be a whole number from ${min} to ${max} (got ${JSON.stringify(v)})`)),
  num: (min, max) => (v, p, c) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : void c.err(p, `must be a number from ${min} to ${max} (got ${JSON.stringify(v)})`)),
  bool: (v, p, c) => (typeof v === 'boolean' ? v : void c.err(p, 'must be true or false')),
  oneOf: (list) => (v, p, c) => (list.includes(v) ? v : void c.err(p, `must be one of: ${list.join(', ')} (got ${JSON.stringify(v)})`)),
  arr: (fn, max, min = 0) => (v, p, c, parent) => {
    if (!Array.isArray(v)) return void c.err(p, 'must be a list [ … ]');
    if (v.length > max) return void c.err(p, `has too many entries (${v.length}, max ${max})`);
    if (v.length < min) return void c.err(p, `needs at least ${min} entr${min === 1 ? 'y' : 'ies'}`);
    const out = [];
    v.forEach((x, i) => { const r = fn(x, `${p}[${i}]`, c, parent); if (r !== undefined) out.push(r); });
    return out.length === v.length ? out : undefined;
  },
  obj: (fields, required = []) => (v, p, c) => objOf(v, p, c, fields, required)
};
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const idStr = (v, p, c) => (typeof v === 'string' && ID_RE.test(v) ? v : void c.err(p, 'must be an id: 1–64 letters, digits, dot, dash or underscore (e.g. "demo-drill-1")'));
const versionStr = (v, p, c) => {
  const s = typeof v === 'number' && Number.isFinite(v) ? String(v) : v;
  return typeof s === 'string' && /^\d{1,4}(\.\d{1,4}){0,2}$/.test(s) ? s : void c.err(p, 'must be a version like "1.0" or "1.2"');
};
function urlStr(v, p, c) {
  if (typeof v !== 'string' || v.length > 500) return void c.err(p, 'must be a web link (max 500 characters)');
  let u;
  try { u = new URL(v); } catch { return void c.err(p, 'is not a valid web link'); }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return void c.err(p, 'only http:// or https:// links are allowed');
  if (u.username || u.password) return void c.err(p, 'links with a user name or password are not allowed');
  return v;
}
/** Point: {x, y} table units, or {dx, dy} diamonds → converted to {x, y} */
const pointIn = (minX, maxX, minY, maxY) => (v, p, c) => {
  if (Array.isArray(v)) return void c.err(p, 'must be a single point {"x": …, "y": …}');
  if (!isObj(v)) return void c.err(p, 'must be a point {"x": …, "y": …}');
  const keys = Object.keys(v);
  let x;
  let y;
  if ('dx' in v || 'dy' in v) {
    if (keys.some((k) => k !== 'dx' && k !== 'dy')) return void c.err(p, 'use either {x, y} (table units) or {dx, dy} (diamonds), not both');
    if (typeof v.dx !== 'number' || typeof v.dy !== 'number' || !Number.isFinite(v.dx) || !Number.isFinite(v.dy)) return void c.err(p, 'dx and dy must be numbers (diamonds)');
    x = r3(v.dx * DIAMOND);
    y = r3(v.dy * DIAMOND);
  } else {
    for (const k of keys) if (k !== 'x' && k !== 'y') c.err(`${p}.${k}`, 'unknown field (a point only has x and y)');
    if (typeof v.x !== 'number' || typeof v.y !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return void c.err(p, 'x and y must be numbers');
    x = v.x;
    y = v.y;
  }
  if (x < minX || x > maxX || y < minY || y > maxY) return void c.err(p, `is off the table (x ${x}, y ${y}; the playing surface is x 0–100, y 0–50)`);
  return { x, y };
};
const tablePoint = pointIn(0, 100, 0, 50);
const pathPoint = pointIn(-3, 103, -3, 53);
function ballNum(v, p, c) {
  if (v === 0 || v === 'cue' || v === '0') return void c.err(p, 'the cue ball goes in cueBallPosition, not in the numbered balls (only one cue ball is allowed)');
  return T.int(1, 15)(v, p, c);
}
const ball = (v, p, c) => {
  if (!isObj(v)) return void c.err(p, 'must be a ball {"n": 1, "x": …, "y": …}');
  const n = ballNum(v.n, `${p}.n`, c);
  const rest = { ...v };
  delete rest.n;
  for (const k of Object.keys(rest)) if (!['x', 'y', 'dx', 'dy'].includes(k)) { c.err(`${p}.${k}`, 'unknown field (a ball has n, x, y)'); delete rest[k]; }
  const pt = tablePoint(rest, p, c);
  return n !== undefined && pt ? { n, ...pt } : undefined;
};
const tips = (min, max) => (v, p, c) => {
  const r = T.num(min, max)(v, p, c);
  if (r === undefined) return undefined;
  if (Math.abs(r * 4 - Math.round(r * 4)) > 1e-9) return void c.err(p, 'must be in ¼-tip steps (e.g. 0, 0.25, 0.5, 1)');
  return r;
};
function speedVal(v, p, c) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return void c.err(p, 'must be a Pool IQ SPEED number, e.g. 1.5');
  if (v < SPEED_MIN || v > SPEED_MAX || Math.abs(v * 2 - Math.round(v * 2)) > 1e-9) return void c.err(p, `SPEED ${v} is not on the Pool IQ SPEED scale (${SPEED_MIN.toFixed(1)}–${SPEED_MAX.toFixed(1)} in steps of 0.5)`);
  return v;
}
const zone = (v, p, c) => {
  if (!isObj(v)) return void c.err(p, 'must be a target zone object');
  const type = v.type ?? 'rings';
  const rings = T.arr(T.obj({ r: T.num(0.5, 30), stars: T.int(1, 3) }, ['r', 'stars']), 3, 1);
  if (type === 'band') {
    const z = objOf(v, p, c, { type: T.oneOf(['band']), center: T.num(0, 100), rings, label: T.str(12) }, ['center', 'rings']);
    return z && z.rings ? z : undefined;
  }
  if (type !== 'rings') return void c.err(`${p}.type`, 'must be "rings" (circle) or "band" (strip across the table)');
  const f = { type: T.oneOf(['rings']), rings, label: T.str(12), x: () => undefined, y: () => undefined, dx: () => undefined, dy: () => undefined };
  const z = objOf(v, p, c, f, ['rings']);
  const pt = tablePoint(Object.fromEntries(Object.entries(v).filter(([k]) => ['x', 'y', 'dx', 'dy'].includes(k))), p, c);
  if (!z || !pt || !z.rings) return undefined;
  const out = { type: 'rings', x: pt.x, y: pt.y, rings: z.rings };
  if (z.label !== undefined) out.label = z.label;
  if (v.type === undefined) delete out.type;
  return out;
};
const railContact = T.obj({ x: T.num(-3, 103), y: T.num(-3, 53), rail: T.oneOf(RAIL_IDS), by: T.oneOf(['cue', 'ob']), order: T.int(1, 20) }, ['x', 'y', 'rail']);
const marker = T.obj({ rail: T.oneOf(RAIL_IDS), diamond: T.num(0, 8), label: T.str(24), kind: T.oneOf(MARKER_KINDS) }, ['rail', 'diamond']);
const text = (n) => T.str(n);
const WHY_KEYS = ['whyCustom', 'whyContact', 'whySpeed', 'whySpin', 'whyRoute', 'whyAim'];

export const SHOT_FIELDS = {
  kind: T.oneOf(SHOT_KINDS),
  cueBallPosition: (v, p, c) => {
    if (Array.isArray(v)) return void c.err(p, 'must be ONE point {"x": …, "y": …} — a layout has exactly one cue ball');
    return tablePoint(v, p, c);
  },
  ballPositions: T.arr(ball, 15),
  blockers: T.arr(ball, 15),
  targetBall: ballNum,
  targetPocket: T.oneOf(POCKET_IDS),
  acceptPockets: T.arr(T.oneOf(POCKET_IDS), 6, 1),
  targetZones: T.arr(zone, 8),
  cueBallPath: T.arr(pathPoint, 200, 2),
  contactIndex: T.int(1, 199),
  ghost: tablePoint,
  objectBallPaths: T.arr(T.obj({ n: ballNum, points: T.arr(pathPoint, 200, 2) }, ['n', 'points']), 15),
  objectBallPath: T.arr(pathPoint, 200, 2),
  railContacts: T.arr(railContact, 20),
  referenceMarkers: T.arr(marker, 20),
  cueContact: T.obj({ vTips: tips(-1.5, 1.5), hTips: tips(-1, 1) }, ['vTips', 'hTips']),
  english: T.obj({ type: T.oneOf(ENGLISH_TYPES), hTips: tips(-1, 1) }),
  technique: T.oneOf(TECHNIQUES),
  speed: speedVal,
  aim: T.obj({ fraction: T.num(0, 1), label: text(40), short: text(16), cutDeg: T.num(0, 90) }),
  route: T.obj({ rails: T.int(0, 10), text: text(60), short: text(16) }),
  goal: text(240),
  instructions: text(1500),
  setupInstructions: text(1500),
  whyExplanation: T.obj(Object.fromEntries(WHY_KEYS.map((k) => [k, text(1500)]))),
  hints: T.arr(T.str(300, 1), 10)
};
const scoringRules = T.obj({ mode: T.oneOf(SCORING_MODES), attempts: T.int(1, 50), pass: T.obj({ made: T.int(0, 50), stars: T.int(0, 150), pockets: T.int(0, 50) }), requirePocket: T.bool }, ['mode', 'attempts', 'pass']);
const skillEffects = (v, p, c) => {
  if (!isObj(v)) return void c.err(p, 'must be an object like {"Kicks": 1}');
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    if (FORBIDDEN_KEYS.has(k)) continue;
    if (!SKILL_NAMES.includes(k)) { c.err(`${p}.${k}`, `unknown skill (use: ${SKILL_NAMES.join(', ')})`); continue; }
    const r = T.num(0, 1)(val, `${p}.${k}`, c);
    if (r !== undefined) out[k] = r;
  }
  return out;
};
const diamondAnswer = T.obj({ rail: T.oneOf(RAIL_IDS), diamond: T.num(0, 8), tolerance: T.obj({ pass: T.num(0, 2), close: T.num(0, 4) }), explanation: text(1500) }, ['rail', 'diamond']);
const shot = (v, p, c) => objOf(v, p, c, SHOT_FIELDS, ['cueBallPosition', 'speed']);

const COMMON_ITEM = {
  title: T.str(80, 1),
  description: text(2000),
  category: text(40),
  difficulty: T.int(1, 10),
  skill: T.oneOf(SKILL_NAMES)
};
export const TYPE_FIELDS = {
  drill: { shot, scoringRules, xp: T.int(0, 1000), skillEffects, prerequisites: T.arr(idStr, 10) },
  challenge: { challengeType: T.oneOf(CHALLENGE_TYPES), question: T.str(240, 1), shot, answer: diamondAnswer, ask: T.arr(T.oneOf(ASK_FIELDS), 7, 1), scoringRules },
  lesson: {
    steps: T.arr(T.obj({ phase: T.oneOf(LESSON_PHASES), title: T.str(80, 1), text: text(3000), shot, scoringRules, ask: T.arr(T.oneOf(ASK_FIELDS), 7, 1), answer: diamondAnswer, question: text(240) }, ['phase', 'title']), 40, 1)
  },
  game: {
    template: T.oneOf(GAME_TEMPLATES),
    rules: T.obj({ lives: T.int(1, 10), pointsPerSuccess: T.int(0, 10000), pointsPerStar: T.int(0, 10000), streakBonus: T.obj({ every: T.int(2, 50), points: T.int(0, 10000) }, ['every', 'points']), stageBonus: T.int(0, 100000), retry: T.oneOf(['repeat', 'next']), shots: T.int(1, 200), loop: T.bool, passScore: T.int(0, 1000000), quizPoints: T.int(0, 10000), order: T.oneOf(['listed', 'difficulty']) }),
    stages: T.arr(T.obj({ id: idStr, title: T.str(80, 1), difficulty: T.int(1, 10), shot, points: T.int(0, 10000), scoringRules, quiz: T.obj({ question: T.str(240, 1), options: T.arr(T.str(80, 1), 6, 2), correct: T.int(0, 5), answer: diamondAnswer, explanation: text(1500) }, ['question']) }, ['id', 'title', 'shot']), 60, 1)
  },
  pack: { unlockMode: T.oneOf(['sequential', 'open']), stages: null /* set below */ }
};
const REQUIRED = { drill: ['shot', 'scoringRules'], challenge: ['challengeType', 'question', 'shot'], lesson: ['steps'], game: ['template', 'stages'], pack: ['stages'] };
const HEADER = {
  format: (v, p, c) => (v === FORMAT ? v : void c.err(p, `must be "${FORMAT}"`)),
  schemaVersion: (v) => (typeof v === 'number' ? String(v.toFixed(1)) : v),
  contentType: T.oneOf(CONTENT_TYPES),
  id: idStr,
  contentVersion: versionStr,
  attribution: T.obj({ author: text(80), sourceName: text(120), sourceURL: urlStr, notes: text(600) }),
  careerEligible: T.bool,
  metadata: T.obj({ tags: T.arr(T.str(30, 1), 12), created: text(40), updated: text(40), language: text(16), demo: T.bool, generator: text(80) }),
  ...COMMON_ITEM
};
const STAGE_BASE = { id: idStr, stageType: T.oneOf(STAGE_TYPES), requires: T.arr(idStr, 10), contentType: T.oneOf(STAGE_CONTENT_TYPES), ...COMMON_ITEM };
function packStage(v, p, c) {
  if (!isObj(v)) return void c.err(p, 'must be a stage object');
  if (!STAGE_CONTENT_TYPES.includes(v.contentType)) return void c.err(`${p}.contentType`, `must be one of: ${STAGE_CONTENT_TYPES.join(', ')}`);
  const out = objOf(v, p, c, { ...STAGE_BASE, ...TYPE_FIELDS[v.contentType] }, ['id', 'title', 'contentType', ...REQUIRED[v.contentType]]);
  if (out) checkItem(out, v.contentType, p, c);
  return out;
}
TYPE_FIELDS.pack.stages = T.arr(packStage, 40, 1);

// ------------------------------------------------------------------ cross-field checks
export function parseVersion(v) {
  const s = typeof v === 'number' ? v.toFixed(1) : String(v ?? '');
  const m = /^(\d{1,3})(?:\.(\d{1,3}))?(?:\.\d{1,3})?$/.exec(s.trim());
  return m ? { major: Number(m[1]), minor: Number(m[2] || 0), text: `${Number(m[1])}.${Number(m[2] || 0)}` } : null;
}
const railLine = { top: ['y', 0], bottom: ['y', 50], left: ['x', 0], right: ['x', 100] };
/** Rail + diamond → point on the cushion nose (table units) */
export function railPoint(rail, diamond) {
  const d = Number(diamond) * DIAMOND;
  if (rail === 'top') return { x: d, y: 0 };
  if (rail === 'bottom') return { x: d, y: 50 };
  if (rail === 'left') return { x: 0, y: d };
  return { x: 100, y: d };
}
function checkAnswer(a, p, c) {
  if (!a) return;
  if (a.diamond > RAIL_DIAMONDS[a.rail]) c.err(`${p}.diamond`, `the ${a.rail} rail runs 0–${RAIL_DIAMONDS[a.rail]} diamonds`);
  if (a.tolerance && a.tolerance.close < a.tolerance.pass) c.err(`${p}.tolerance`, '"close" must be at least as large as "pass"');
}
function checkScoring(sr, shotObj, p, c) {
  if (!sr || !sr.pass) return;
  const n = sr.attempts;
  const pass = sr.pass;
  if (sr.mode === 'success' || sr.mode === 'binary') {
    if (pass.made === undefined) c.err(`${p}.pass.made`, `is required for "${sr.mode}" scoring`);
    else if (pass.made < 1 || pass.made > n) c.err(`${p}.pass.made`, `must be between 1 and the number of attempts (${n})`);
  } else {
    if (pass.stars === undefined) c.err(`${p}.pass.stars`, `is required for "${sr.mode}" scoring`);
    else if (pass.stars > n * 3) c.err(`${p}.pass.stars`, `can be at most ${n * 3} (3 stars × ${n} attempts)`);
    if (sr.mode === 'zone' && sr.requirePocket !== false && pass.pockets !== undefined && pass.pockets > n) c.err(`${p}.pass.pockets`, `can be at most ${n} (the number of attempts)`);
    if (sr.mode === 'zone' && shotObj && !(shotObj.targetZones || []).length) c.err(p, '"zone" scoring needs at least one target zone in shot.targetZones');
  }
  if (sr.mode !== 'zone' && sr.requirePocket !== undefined) c.warn(`${p}.requirePocket`, 'only used by "zone" scoring');
}
/** Layout sanity: exactly one cue ball, numbers 1–15 unique, on the cloth, no overlapping balls, paths/zones/markers sensible */
export function checkShot(s, p, c) {
  if (!s || !s.cueBallPosition) return;
  const all = [{ id: 'cue', ...s.cueBallPosition }, ...(s.ballPositions || []).map((b) => ({ id: b.n, ...b })), ...(s.blockers || []).map((b) => ({ id: b.n, ...b, blocker: true }))];
  const nums = all.filter((b) => b.id !== 'cue').map((b) => b.id);
  const dup = nums.find((n, i) => nums.indexOf(n) !== i);
  if (dup !== undefined) c.err(p, `ball ${dup} is used twice — every ball number (1–15) can appear only once`);
  const name = (b) => (b.id === 'cue' ? 'the cue ball' : `${b.blocker ? 'blocker ' : ''}ball ${b.id}`);
  const tol = 0.01;
  for (const b of all) {
    if (b.x < BALL_R - tol || b.x > 100 - BALL_R + tol || b.y < BALL_R - tol || b.y > 50 - BALL_R + tol) c.err(p, `${name(b)} at (${b.x}, ${b.y}) overlaps the cushion — a ball centre must be ${BALL_R} or more from every rail (x ${BALL_R}–${100 - BALL_R}, y ${BALL_R}–${50 - BALL_R})`);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const d = Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y);
    if (d < 2 * BALL_R - tol) c.err(p, `${name(all[i])} and ${name(all[j])} overlap (centres ${d.toFixed(2)} apart, need at least ${2 * BALL_R})`);
  }
  const obNums = (s.ballPositions || []).map((b) => b.n);
  if (s.targetBall !== undefined && !obNums.includes(s.targetBall)) c.err(`${p}.targetBall`, `ball ${s.targetBall} is not in ballPositions`);
  if (s.acceptPockets && s.targetPocket && !s.acceptPockets.includes(s.targetPocket)) c.err(`${p}.acceptPockets`, 'must include targetPocket');
  if (s.acceptPockets && !s.targetPocket) c.err(`${p}.targetPocket`, 'is required when acceptPockets is given');
  if (s.contactIndex !== undefined && (!s.cueBallPath || s.contactIndex >= s.cueBallPath.length)) c.err(`${p}.contactIndex`, 'must point at a point of cueBallPath (0-based index, less than its length)');
  if (s.cueBallPath && Math.hypot(s.cueBallPath[0].x - s.cueBallPosition.x, s.cueBallPath[0].y - s.cueBallPosition.y) > 1.5) c.warn(`${p}.cueBallPath`, 'should start at the cue ball position');
  for (const [i, op] of (s.objectBallPaths || []).entries()) if (!obNums.includes(op.n) && !(s.blockers || []).some((b) => b.n === op.n)) c.err(`${p}.objectBallPaths[${i}].n`, `ball ${op.n} is not on the table`);
  for (const [i, rc] of (s.railContacts || []).entries()) {
    const [axis, val] = railLine[rc.rail];
    if (Math.abs(rc[axis] - val) > 2.5) c.err(`${p}.railContacts[${i}]`, `is not on the ${rc.rail} rail (${axis} must be within 2.5 of ${val})`);
  }
  for (const [i, m] of (s.referenceMarkers || []).entries()) if (m.diamond > RAIL_DIAMONDS[m.rail]) c.err(`${p}.referenceMarkers[${i}].diamond`, `the ${m.rail} rail runs 0–${RAIL_DIAMONDS[m.rail]} diamonds`);
  for (const [i, z] of (s.targetZones || []).entries()) {
    const st = z.rings.map((r) => r.stars);
    if (new Set(st).size !== st.length) c.err(`${p}.targetZones[${i}].rings`, 'each star value (1, 2, 3) can be used only once');
    const sorted = z.rings.slice().sort((a, b) => a.stars - b.stars);
    if (sorted.some((r, k) => k && r.r > sorted[k - 1].r)) c.err(`${p}.targetZones[${i}].rings`, 'more stars must mean a smaller (or equal) ring');
  }
  if (s.english && s.english.hTips !== undefined && s.english.hTips !== (s.cueContact?.hTips ?? 0)) c.err(`${p}.english.hTips`, 'must match cueContact.hTips (the tip position lives in cueContact)');
}
function checkItem(it, type, p, c) {
  const P = (k) => (p ? `${p}.${k}` : k);
  if (type === 'drill') { checkShot(it.shot, P('shot'), c); checkScoring(it.scoringRules, it.shot, P('scoringRules'), c); }
  if (type === 'challenge') {
    checkShot(it.shot, P('shot'), c);
    if (it.challengeType === 'diamond' && !it.answer) c.err(P('answer'), 'is required for a diamond challenge (the recommended rail + diamond)');
    if (it.challengeType === 'solution' && !it.ask) c.err(P('ask'), 'is required for a player-solution challenge (what the player must choose)');
    if (it.ask && (it.ask.includes('rail') || it.ask.includes('diamond')) && !it.answer) c.err(P('answer'), 'is required when ask includes "rail" or "diamond"');
    checkAnswer(it.answer, P('answer'), c);
    if (it.scoringRules) checkScoring(it.scoringRules, it.shot, P('scoringRules'), c);
  }
  if (type === 'lesson') {
    let last = 0;
    (it.steps || []).forEach((st, i) => {
      const sp = P(`steps[${i}]`);
      const k = LESSON_PHASES.indexOf(st.phase);
      if (k < last) c.warn(sp, `phase "${st.phase}" comes after a later phase (recommended order: ${LESSON_PHASES.join(' → ')})`);
      last = Math.max(last, k);
      if (st.shot) checkShot(st.shot, `${sp}.shot`, c);
      if (st.phase === 'teach' && !st.text && !st.shot) c.err(sp, 'a teach step needs text or a shot diagram');
      if (st.phase !== 'teach' && !st.shot) c.err(`${sp}.shot`, `is required for a ${st.phase} step`);
      if (st.phase === 'solve' && !st.ask) c.err(`${sp}.ask`, 'is required for a solve step (what the player must work out)');
      if (st.ask && (st.ask.includes('rail') || st.ask.includes('diamond')) && !st.answer) c.err(`${sp}.answer`, 'is required when ask includes "rail" or "diamond"');
      if (st.phase === 'test' && !st.scoringRules) c.err(`${sp}.scoringRules`, 'is required for a test step (attempts + passing requirement)');
      checkAnswer(st.answer, `${sp}.answer`, c);
      if (st.scoringRules) checkScoring(st.scoringRules, st.shot, `${sp}.scoringRules`, c);
    });
  }
  if (type === 'game') {
    const ids = new Set();
    (it.stages || []).forEach((st, i) => {
      const sp = P(`stages[${i}]`);
      if (ids.has(st.id)) c.err(`${sp}.id`, `duplicate stage id "${st.id}"`);
      ids.add(st.id);
      checkShot(st.shot, `${sp}.shot`, c);
      if (it.template === 'quizExecution') {
        if (!st.quiz) c.err(`${sp}.quiz`, 'is required by the quizExecution template');
        else if (!st.quiz.answer && !(st.quiz.options && st.quiz.correct !== undefined)) c.err(`${sp}.quiz`, 'needs options + correct (multiple choice) or answer (rail + diamond)');
        else if (st.quiz.options && st.quiz.correct !== undefined && st.quiz.correct >= st.quiz.options.length) c.err(`${sp}.quiz.correct`, 'must be the 0-based index of one of the options');
        if (st.quiz?.answer) checkAnswer(st.quiz.answer, `${sp}.quiz.answer`, c);
      } else if (st.quiz) c.warn(`${sp}.quiz`, `only used by the quizExecution template`);
      if (it.template === 'multiStage') {
        if (!st.scoringRules) c.err(`${sp}.scoringRules`, 'is required by the multiStage template (attempts + pass per stage)');
        else if (!['success', 'binary'].includes(st.scoringRules.mode)) c.err(`${sp}.scoringRules.mode`, 'multiStage stages use "success" or "binary" scoring');
        else checkScoring(st.scoringRules, st.shot, `${sp}.scoringRules`, c);
      }
      if (it.template === 'target' && !(st.shot?.targetZones || []).length) c.warn(`${sp}.shot.targetZones`, 'target games score by star rings — add a target zone');
    });
    const diffs = (it.stages || []).map((s) => s.difficulty).filter((d) => d !== undefined);
    if ((it.rules?.order ?? 'listed') === 'listed' && diffs.some((d, i) => i && d < diffs[i - 1])) c.warn(P('stages'), 'difficulty goes down between stages (stages are played in the listed order)');
  }
  if (type === 'pack') {
    const seen = new Set();
    (it.stages || []).forEach((st, i) => {
      if (seen.has(st.id)) c.err(P(`stages[${i}].id`), `duplicate stage id "${st.id}"`);
      for (const r of st.requires || []) if (!seen.has(r)) c.err(P(`stages[${i}].requires`), `"${r}" must be the id of an EARLIER stage`);
      seen.add(st.id);
    });
  }
}

// ------------------------------------------------------------------ main entry
function fail(msg, extra = {}) {
  return { ok: false, errors: [msg], warnings: [], doc: null, ...extra };
}
/**
 * Validate a .pooliq file (text or already-parsed object).
 * Returns { ok, errors, warnings, doc } or, for an older Pool IQ drill export, { ok: true, legacy: 'drills', raw }.
 */
export function validatePooliq(input) {
  let raw = input;
  if (typeof input === 'string') {
    if (input.length > MAX_FILE_BYTES) return fail(`CANNOT IMPORT — The file is too large (${Math.round(input.length / 1024)} KB). .pooliq files can be up to ${MAX_FILE_BYTES / 1024} KB.`);
    const t = input.replace(/^\uFEFF/, '').trim();
    if (!t) return fail('CANNOT IMPORT — The file is empty.');
    try { raw = JSON.parse(t); } catch (e) { return fail(`CANNOT IMPORT — This is not a valid .pooliq file: it is not valid JSON (${String(e.message || e).slice(0, 120)}).`); }
  }
  if (!isObj(raw)) return fail('CANNOT IMPORT — A .pooliq file must contain one JSON object { … }.');
  const c = makeCtx();
  prescan(raw, c);
  if (c.errors.length) return { ok: false, errors: ['CANNOT IMPORT — The file contains content that is not allowed:', ...c.errors], warnings: [], doc: null, security: true };
  if (raw.format === 'pool-iq-backup') return fail('CANNOT IMPORT — This is a Pool IQ backup file. Restore it from Settings → Restore from backup.');
  if (raw.format === 'pool-iq-drills') return { ok: true, legacy: 'drills', raw, errors: [], warnings: [] };
  if (raw.format !== FORMAT) return fail(`CANNOT IMPORT — This is not a Pool IQ content file (the "format" field must be "${FORMAT}").`);
  const ver = parseVersion(raw.schemaVersion);
  if (!ver) return fail('CANNOT IMPORT — The file has no valid "schemaVersion" (expected "1.0").');
  if (ver.major > SUPPORTED.major || (ver.major === SUPPORTED.major && ver.minor > SUPPORTED.minor)) return fail(`CANNOT IMPORT — This file uses Pool IQ schema ${ver.text}. Your version supports up to ${SUPPORTED.major}.${SUPPORTED.minor}.`, { newer: true });
  if (ver.major < 1) return fail(`CANNOT IMPORT — Pool IQ schema ${ver.text} is not supported (use 1.0).`);
  if (!CONTENT_TYPES.includes(raw.contentType)) return fail(`CANNOT IMPORT — Unknown contentType ${JSON.stringify(raw.contentType)}. Supported: ${CONTENT_TYPES.join(', ')}.`);
  const type = raw.contentType;
  const doc = objOf(raw, '', c, { ...HEADER, ...TYPE_FIELDS[type] }, ['format', 'schemaVersion', 'contentType', 'id', 'contentVersion', 'title', ...REQUIRED[type]]);
  if (doc) {
    doc.schemaVersion = ver.text;
    checkItem(doc, type, '', c);
    if (doc.careerEligible && type !== 'drill') c.warn('careerEligible', 'only single drills can count toward your training history — ignored for this content type');
  }
  if (c.errors.length) return { ok: false, errors: ['CANNOT IMPORT — Please fix these problems in the file:', ...c.errors], warnings: c.warnings, doc: null };
  normalizeInPlace(doc);
  return { ok: true, errors: [], warnings: c.warnings, doc: orderKeys(doc) };
}

/** Shorthand conversions (idempotent) */
function normalizeShot(s) {
  if (!s) return;
  if (s.objectBallPath) {
    if (!s.objectBallPaths) s.objectBallPaths = [{ n: s.targetBall ?? s.ballPositions?.[0]?.n ?? 1, points: s.objectBallPath }];
    delete s.objectBallPath;
  }
}
function normalizeInPlace(doc) {
  const items = doc.contentType === 'pack' ? doc.stages : [doc];
  for (const it of items) {
    normalizeShot(it.shot);
    for (const st of it.steps || []) normalizeShot(st.shot);
    if (it.contentType === 'game' || it.template) for (const st of it.stages || []) normalizeShot(st.shot);
  }
}
const KEY_ORDER = ['format', 'schemaVersion', 'contentType', 'id', 'contentVersion', 'title', 'description', 'category', 'difficulty', 'skill', 'attribution', 'careerEligible', 'metadata'];
function orderKeys(doc) {
  const out = {};
  for (const k of KEY_ORDER) if (doc[k] !== undefined) out[k] = doc[k];
  for (const k of Object.keys(doc)) if (out[k] === undefined) out[k] = doc[k];
  return out;
}

// ------------------------------------------------------------------ helpers used by the UI
/** The playable items of a document (a pack's stages, or the document itself) */
export function itemsOf(doc) {
  if (!doc) return [];
  return doc.contentType === 'pack' ? doc.stages : [doc];
}
export function typeLabel(t) {
  return { drill: 'Drill', pack: 'Training Pack', lesson: 'Lesson', game: 'Skill Game', challenge: 'Challenge' }[t] || 'Content';
}
export function serialize(doc) {
  return JSON.stringify(doc, null, 2);
}
export function fileNameFor(doc) {
  const slug = String(doc?.title || doc?.id || 'content').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'content';
  return `${slug}${FILE_EXT}`;
}
