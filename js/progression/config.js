/**
 * Pool IQ v11 progression — the ONE place for every balancing number.
 * Rank ladder, ball levels, XP values, performance curve, anti-farming rules, tier caps, mastery thresholds,
 * skill categories, skill-level mapping, skill gates, promotion requirements, Drill Rank and PvP defaults.
 * Nothing else in the app hard-codes these values (verify.mjs checks the modules read from here).
 * See docs/RANKING_AND_XP.md and docs/SKILL_GATES_AND_PROMOTIONS.md for the formulas.
 */
import { RANK_NAMES } from '../storage.js';

export const PROGRESSION_VERSION = 1; // bump to re-run the history migration (idempotent per version)

// ------------------------------------------------------------------ difficulty tiers
export const TIERS = ['beginner', 'intermediate', 'advanced', 'expert', 'pro'];
export const TIER_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert', pro: 'Pro' };
/** Built-in content uses difficulty 1–10: 1–2 Beginner · 3–4 Intermediate · 5–6 Advanced · 7–8 Expert · 9–10 Pro */
export const TIER_BY_DIFFICULTY = [null, 'beginner', 'beginner', 'intermediate', 'intermediate', 'advanced', 'advanced', 'expert', 'expert', 'pro', 'pro'];
/** .pooliq files may give difficulty as a tier word; it is stored as this 1–10 value */
export const TIER_DIFFICULTY = { beginner: 2, intermediate: 4, advanced: 6, expert: 8, pro: 10 };

// ------------------------------------------------------------------ Career rank ladder (names + ball levels)
/**
 * RANK_LADDER — config-driven so the name list and the ball structure can be switched independently.
 * names: the existing Career names (js/storage.js RANK_NAMES, used by js/career.js requirements + bosses).
 * balls: ball levels inside each rank (the BALL is the level: 1-ball … N-ball). 0 = MAX RANK (no levels).
 * ballXp: Rank XP needed per ball inside that rank (a rank's total = balls × ballXp).
 */
export const RANK_LADDER = {
  names: RANK_NAMES, // ['Rookie','Club Player','Shooter','Competitor','Advanced','Expert','Master','Elite','Pro','Champion']
  balls: [10, 10, 11, 11, 12, 12, 13, 14, 15, 0],
  ballXp: [300, 450, 600, 750, 900, 1050, 1200, 1350, 2500, 0], // rank-up ×3; Pro and Champion ×5 (Champion stays 0)
  maxLabel: 'MAX RANK'
};
/** How the rank reads everywhere: "{rank} · {ball}-BALL" (ball badge shows the number) */
export const RANK_DISPLAY = { format: '{rank} · {ball}-Ball', maxFormat: '{rank} · MAX RANK' };

// ------------------------------------------------------------------ XP
export const XP = {
  /** Base XP for a full-performance session by difficulty tier (Table Games stages, Ghost, Boss Battles) */
  base: { beginner: 40, intermediate: 60, advanced: 90, expert: 130, pro: 180 },
  /** v14-117: every drill (built-in, Create Drill, installed .pooliq content) uses one flat base, whatever its difficulty */
  flatDrillBase: 60,
  flatSources: ['drill', 'custom', 'content'],
  /** Performance curve: performance ratio ≥ at → factor of base (below the first row = 0 Rank XP). 10 attempts: 5/10 none, 6 low, 7 moderate, 8 good, 9 high, 10 full */
  curve: [
    { at: 0.6, factor: 0.25 },
    { at: 0.7, factor: 0.5 },
    { at: 0.8, factor: 0.75 },
    { at: 0.9, factor: 0.9 },
    { at: 1.0, factor: 1.0 }
  ],
  perfectBonus: 0.25, // × base, for a perfect session (10/10)
  firstClearBonus: 1.0, // × base, the first time an item is passed
  pbBonus: 0.25, // × base, a passed session that beats your best performance
  /** v14-116: one-time bonus when a Drill Sets & Exams set or exam is fully finished (its emblem). Lifetime + Career Rank + Drill XP, once per set. Not PKF. */
  courseCompleteBonus: 300,
  courseCompleteTier: 'intermediate', // the bonus's Career Rank XP counts toward this tier's cap
  passFloor: 0.6, // a PASSED session always counts at least as 6/10
  failCap: 0.69, // a failed session never counts above the 6/10 band
  participationLifetime: 5, // Lifetime XP for any finished session that earned nothing else (Rank XP stays 0)
  repeat: {
    strong: 0.6, // item already STRONG ⭐⭐: Rank + Lifetime XP × this
    mastered: 0.1, // item already MASTERED ⭐⭐⭐: Rank XP × this (little/no Rank XP)
    masteredLifetime: 0.5, // … Lifetime XP × this (still counts for the permanent record)
    sameDayFree: 3, // sessions of the same item per day at full value
    sameDayFactor: 0.5 // each further same-day session × this
  },
  /** Career Rank XP each difficulty tier can ever contribute (null = unlimited) */
  tierCaps: { beginner: 5000, intermediate: 9000, advanced: 14000, expert: 20000, pro: null },
  /** Self-authored Create Drill difficulty can't be verified: for Career Rank XP it counts at most as this tier */
  customDrillMaxTier: 'intermediate',
  /** Rank XP earned after a rank is full carries into the next rank, up to this share of the next rank's total */
  overflowCarry: 0.25,
  /** Source multipliers on base XP */
  sourceMult: { arcade: 1, drill: 1, custom: 1, content: 1, ghost: 1, boss: 2 },
  ghost: {
    tierByBalls: { 3: 'beginner', 4: 'beginner', 5: 'intermediate', 6: 'advanced', 7: 'advanced', 8: 'expert', 9: 'pro' },
    tierByEight: { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced', pro: 'expert', custom3: 'beginner', custom5: 'intermediate', custom7: 'advanced' },
    raceFactor: { per: 5, min: 0.6, max: 1.8 } // XP × clamp(race / 5, 0.6, 1.8)
  },
  bossTierByRank: [null, 'beginner', 'intermediate', 'intermediate', 'advanced', 'advanced', 'expert', 'expert', 'pro', 'pro']
};

// ------------------------------------------------------------------ drill mastery
/** strong / mastered = best performance ratio needed (PASSED ⭐ = the item's own pass rule). Per-mode defaults; items may override. */
export const MASTERY = {
  default: { strong: 0.85, mastered: 0.95 },
  byMode: {
    binary: { strong: 0.9, mastered: 1.0 }, // 9/10 · 10/10
    success: { strong: 0.9, mastered: 1.0 },
    sniper: { strong: 0.9, mastered: 1.0 },
    zone: { strong: 0.8, mastered: 0.92 },
    stars: { strong: 0.8, mastered: 0.93 },
    lives: { strong: 0.83, mastered: 1.0 },
    kick: { strong: 0.8, mastered: 1.0 },
    train: { strong: 0.8, mastered: 0.95 },
    pattern: { strong: 0.66, mastered: 1.0 },
    ladder: { strong: 0.9, mastered: 1.0 },
    calibration: { strong: 1.0, mastered: 1.0 },
    ghost: { strong: 0.9, mastered: 1.0 },
    boss: { strong: 0.9, mastered: 1.0 }
  },
  recentWindow: 5,
  labels: ['NOT PASSED', 'PASSED', 'STRONG', 'MASTERED']
};

// ------------------------------------------------------------------ skills
/** Extensible: add a row to add a skill. core = minimum floors apply from early ranks; secondary floors start later. */
export const SKILLS = [
  { id: 'straight', name: 'Straight Cueing', long: 'Straight Cueing / Alignment', core: true, hidden: true }, // not shown in Skill Breakdown; gates, floors and weights still use this id
  { id: 'shotMaking', name: 'Shot Making', core: true },
  { id: 'stop', name: 'Stop Shot', core: true },
  { id: 'follow', name: 'Follow', core: true },
  { id: 'draw', name: 'Draw', core: true },
  { id: 'stun', name: 'Stun', core: true },
  { id: 'speed', name: 'Speed Control', core: true },
  { id: 'position', name: 'Position Play', core: true },
  { id: 'banks', name: 'Banks', core: false },
  { id: 'kicks', name: 'Kicks', core: false },
  { id: 'safeties', name: 'Safeties', core: false },
  { id: 'pattern', name: 'Pattern Play', core: false }
];
export const SKILL_IDS = SKILLS.map((s) => s.id);
/** v1–v10 skill names → v11 skill ids ('Cue-Ball Control' is resolved from the shot's technique) */
export const LEGACY_SKILL_MAP = { 'Shot Making': 'shotMaking', 'Position Play': 'position', 'Speed Control': 'speed', Banks: 'banks', Kicks: 'kicks', Safeties: 'safeties', 'Pattern Play': 'pattern', 'Cue-Ball Control': '@technique' };
export const TECHNIQUE_SKILL = { stop: 'stop', stun: 'stun', 'stun-run': 'stun', 'stun-draw': 'stun', draw: 'draw', follow: 'follow' };

/** Skill levels use the Career ladder ("Draw — Shooter 5"). Rating (0–1) = demonstrated performance share of the content that trains the skill. */
export const SKILL_LEVEL = {
  tierPoints: { beginner: 20, intermediate: 45, advanced: 80, expert: 130, pro: 200 },
  /** credit per item by mastery: 0 = played, not passed (× performance curve) · PASSED · STRONG · MASTERED */
  masteryCredit: [0.3, 0.7, 0.85, 1.0],
  curvePow: 0.85, // ladder step = rating^curvePow × all ball steps
  recency: { fullDays: 45, spanDays: 180, min: 0.75 },
  /** Highest level a skill can show without a PASSED item (weight ≥ foundationWeight) at that tier */
  ceilingByTier: { none: { rank: 0, ball: 3 }, beginner: { rank: 1, ball: 10 }, intermediate: { rank: 3, ball: 11 }, advanced: { rank: 5, ball: 12 }, expert: { rank: 7, ball: 14 }, pro: { rank: 8, ball: 15 } },
  champion: { rating: 0.95, proMastered: 1 },
  foundationWeight: 0.5 // an item trains a skill "as a foundation" when its normalized weight is ≥ this
};

/** Skill mapping for built-in Table Games games (normalized so the top weight = 1). "_tech" = the skill of the stage's technique (stop/stun/draw/follow). */
export const GAME_SKILLS = {
  landing: { position: 1, speed: 0.4, _tech: 0.6 },
  draw: { _tech: 1, speed: 0.3, position: 0.3 },
  follow: { _tech: 1, speed: 0.4, position: 0.3 },
  stun: { _tech: 1, stun: 0.5, stop: 0.5, position: 0.3, shotMaking: 0.2 }, // stun = the stop shot played at an angle
  speed: { speed: 1, position: 0.2 },
  bank: { banks: 1, shotMaking: 0.3, speed: 0.3 },
  kick: { kicks: 1, safeties: 0.3, speed: 0.3 },
  train: { position: 1, pattern: 0.5, speed: 0.3, _tech: 0.3 },
  carom: { shotMaking: 1, position: 0.4, _tech: 0.4 },
  safety: { safeties: 1, speed: 0.5, _tech: 0.3 },
  pattern: { pattern: 1, position: 0.5 },
  sniper: { shotMaking: 1 },
  rail: { position: 1, speed: 0.6, _tech: 0.3 },
  ghost: { pattern: 1, shotMaking: 0.6, position: 0.5 }
};
/** Near-straight shots also train Straight Cueing */
export const STRAIGHT_RULE = { maxCutDeg: 5, weight: 0.6, kinds: ['position', 'pot', 'carom'] };
/** Per-stage adjustments (merged over the rules above) */
export const STAGE_SKILL_OVERRIDES = {
  'sniper:ps-1': { straight: 1, shotMaking: 0.8 },
  'sniper:ps-5': { straight: 0.5 },
  'speed:sp-cal': { speed: 0.5, position: 0 },
  'draw:dr-1': { straight: 0.8 },
  'stun:st-1': { straight: 0.8 },
  'follow:fo-1': { straight: 0.8 }
};

// ------------------------------------------------------------------ skill gates (inside a rank)
/**
 * A gate holds the ball level at `ball` until every foundation is met (Rank XP keeps banking meanwhile).
 * foundation: { skill, passes: N, tier: minimum tier } = pass N different items that train the skill (weight ≥ foundationWeight) at that tier or harder.
 */
export const GATES = [
  { id: 'g-rookie', rank: 0, ball: 5, title: 'ROOKIE FOUNDATION CHECK', foundations: [{ skill: 'straight', passes: 1, tier: 'beginner' }, { skill: 'shotMaking', passes: 1, tier: 'beginner' }, { skill: 'stop', passes: 1, tier: 'beginner' }, { skill: 'follow', passes: 1, tier: 'beginner' }, { skill: 'draw', passes: 1, tier: 'beginner' }, { skill: 'speed', passes: 1, tier: 'beginner' }] },
  { id: 'g-club', rank: 1, ball: 5, title: 'CLUB PLAYER FOUNDATION CHECK', foundations: [{ skill: 'stun', passes: 1, tier: 'intermediate' }, { skill: 'position', passes: 2, tier: 'beginner' }, { skill: 'speed', passes: 2, tier: 'beginner' }, { skill: 'stop', passes: 1, tier: 'intermediate' }] },
  { id: 'g-shooter', rank: 2, ball: 6, title: 'SHOOTER FOUNDATION CHECK', foundations: [{ skill: 'banks', passes: 1, tier: 'beginner' }, { skill: 'draw', passes: 2, tier: 'intermediate' }, { skill: 'follow', passes: 2, tier: 'intermediate' }, { skill: 'shotMaking', passes: 2, tier: 'beginner' }] },
  { id: 'g-competitor', rank: 3, ball: 6, title: 'COMPETITOR FOUNDATION CHECK', foundations: [{ skill: 'kicks', passes: 1, tier: 'beginner' }, { skill: 'stun', passes: 2, tier: 'intermediate' }, { skill: 'position', passes: 2, tier: 'intermediate' }] },
  { id: 'g-advanced', rank: 4, ball: 6, title: 'ADVANCED FOUNDATION CHECK', foundations: [{ skill: 'safeties', passes: 1, tier: 'intermediate' }, { skill: 'shotMaking', passes: 2, tier: 'advanced' }, { skill: 'speed', passes: 1, tier: 'advanced' }] },
  { id: 'g-expert', rank: 5, ball: 6, title: 'EXPERT FOUNDATION CHECK', foundations: [{ skill: 'pattern', passes: 1, tier: 'intermediate' }, { skill: 'banks', passes: 2, tier: 'intermediate' }, { skill: 'kicks', passes: 2, tier: 'intermediate' }] },
  { id: 'g-master', rank: 6, ball: 7, title: 'MASTER FOUNDATION CHECK', foundations: [{ skill: 'draw', passes: 2, tier: 'advanced' }, { skill: 'follow', passes: 2, tier: 'advanced' }, { skill: 'stun', passes: 2, tier: 'advanced' }, { skill: 'position', passes: 2, tier: 'advanced' }] },
  { id: 'g-elite', rank: 7, ball: 7, title: 'ELITE FOUNDATION CHECK', foundations: [{ skill: 'pattern', passes: 2, tier: 'advanced' }, { skill: 'safeties', passes: 2, tier: 'advanced' }, { skill: 'banks', passes: 1, tier: 'advanced' }, { skill: 'kicks', passes: 1, tier: 'advanced' }] },
  { id: 'g-pro', rank: 8, ball: 8, title: 'PRO FOUNDATION CHECK', foundations: [{ skill: 'shotMaking', passes: 2, tier: 'expert' }, { skill: 'position', passes: 2, tier: 'expert' }, { skill: 'speed', passes: 1, tier: 'expert' }, { skill: 'pattern', passes: 1, tier: 'expert' }] }
];

// ------------------------------------------------------------------ promotion (to rank `to`)
/**
 * The Promotion Test between named ranks is that rank's Boss Battle (a real sequence of shots scored on the play
 * screen). It unlocks only when ALL of these are met, plus the existing Career requirements (js/career.js, kept as-is):
 *   rankXpFull — the current rank's Rank XP is complete (top ball reached, every gate in the rank cleared)
 *   floors     — minimum skill levels: core / secondary skills at least {rank, ball} (null = no floor)
 *   mastery    — number of items at STRONG ⭐⭐ or better / MASTERED ⭐⭐⭐
 */
export const PROMOTION = {
  1: { floors: { core: null, secondary: null }, mastery: { strong: 0, mastered: 0 } },
  2: { floors: { core: { rank: 0, ball: 3 }, secondary: null }, mastery: { strong: 1, mastered: 0 } },
  3: { floors: { core: { rank: 0, ball: 6 }, secondary: null }, mastery: { strong: 2, mastered: 0 } },
  4: { floors: { core: { rank: 1, ball: 1 }, secondary: { rank: 0, ball: 3 } }, mastery: { strong: 4, mastered: 1 } },
  5: { floors: { core: { rank: 1, ball: 6 }, secondary: { rank: 0, ball: 6 } }, mastery: { strong: 6, mastered: 2 } },
  6: { floors: { core: { rank: 2, ball: 3 }, secondary: { rank: 1, ball: 1 } }, mastery: { strong: 9, mastered: 4 } },
  7: { floors: { core: { rank: 3, ball: 1 }, secondary: { rank: 1, ball: 6 } }, mastery: { strong: 12, mastered: 6 } },
  8: { floors: { core: { rank: 3, ball: 8 }, secondary: { rank: 2, ball: 3 } }, mastery: { strong: 16, mastered: 9 } },
  9: { floors: { core: { rank: 4, ball: 6 }, secondary: { rank: 3, ball: 1 } }, mastery: { strong: 20, mastered: 12 } }
};

// ------------------------------------------------------------------ Drill Rank (separate from Career; drills only)
export const DRILL_RANK = {
  /** Drill XP uses the same session formula (curve, first clear, PB, diminishing repeats) × this */
  xpScale: 1,
  sources: ['drill', 'custom', 'content'], // built-in drills, Create Drill drills, rank-eligible installed .pooliq content
  ranks: [
    { name: 'BALL BANGER', xp: 0, passed: 0, strong: 0, mastered: 0, categories: 0 },
    { name: 'Grinder', xp: 2700, passed: 9, strong: 0, mastered: 0, categories: 0 },
    { name: 'DRILLER', xp: 9000, passed: 18, strong: 6, mastered: 0, categories: 0 },
    { name: 'STUDENT OF THE GAME', xp: 22500, passed: 30, strong: 12, mastered: 3, categories: 2 },
    { name: 'Precision Player', xp: 45000, passed: 45, strong: 21, mastered: 9, categories: 3 },
    { name: 'Drill Sergeant', xp: 81000, passed: 60, strong: 30, mastered: 18, categories: 4 },
    { name: 'Drill Master', xp: 225000, passed: 84, strong: 45, mastered: 30, categories: 5 },
    { name: 'Drill Legend', xp: 375000, passed: 108, strong: 66, mastered: 48, categories: 6 }
  ]
};

// ------------------------------------------------------------------ Recommended Training
export const RECOMMEND = { skills: 3, perSkill: 3 };

// ------------------------------------------------------------------ Friends / PvP / tournaments (local only; never touches training rank)
export const PVP = {
  games: [
    { id: '8-ball', name: '8-Ball' },
    { id: '9-ball', name: '9-Ball' },
    { id: '10-ball', name: '10-Ball' },
    { id: 'straight', name: 'Straight Pool' },
    { id: 'bank', name: 'Bank Pool' },
    { id: 'one-pocket', name: 'One Pocket' },
    { id: 'other', name: 'Other' }
  ],
  raceOptions: [1, 2, 3, 4, 5, 7, 9, 11],
  defaultRace: 3,
  advancedStats: ['breakAndRuns', 'dryBreaks', 'fouls', 'safeties', 'banks', 'kickEscapes'],
  statLabels: { breakAndRuns: 'Break & runs', dryBreaks: 'Dry breaks', fouls: 'Fouls', safeties: 'Safeties', banks: 'Banks made', kickEscapes: 'Kick escapes' },
  formats: [
    { id: 'single', name: 'Single Elimination', minPlayers: 2, maxPlayers: 32 },
    { id: 'roundrobin', name: 'Round Robin', minPlayers: 3, maxPlayers: 12 }
  ],
  /** Round-robin standings order (documented in docs/FRIENDS_AND_TOURNAMENTS.md) */
  tiebreakers: ['wins', 'headToHead', 'gameDiff', 'gamesWon', 'name'],
  maxPlayers: 40
};

// ------------------------------------------------------------------ helpers (pure, no numbers)
export const tierOfDifficulty = (d) => {
  if (typeof d === 'string' && TIERS.includes(d.toLowerCase())) return d.toLowerCase();
  const n = Math.max(1, Math.min(10, Math.round(Number(d) || 3)));
  return TIER_BY_DIFFICULTY[n];
};
export const tierIndex = (t) => Math.max(0, TIERS.indexOf(t));
export const skillName = (id) => SKILLS.find((s) => s.id === id)?.name || id;
export const skillById = (id) => SKILLS.find((s) => s.id === id) || null;
/** Accept a v11 skill id, a v11 skill name, or a v1–v10 name (except 'Cue-Ball Control') → skill id or null */
export function toSkillId(x) {
  if (typeof x !== 'string') return null;
  if (SKILL_IDS.includes(x)) return x;
  const byName = SKILLS.find((s) => s.name.toLowerCase() === x.toLowerCase() || (s.long || '').toLowerCase() === x.toLowerCase());
  if (byName) return byName.id;
  const lg = LEGACY_SKILL_MAP[x];
  return lg && lg[0] !== '@' ? lg : null;
}
