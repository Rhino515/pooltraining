/**
 * Game registry — metadata + lazily built stage challenges (geometry is computed on first use).
 */
import { buildChallenge } from './builders.js';
import landing from './data/landingZone.js';
import draw from './data/drawChallenge.js';
import follow from './data/followChallenge.js';
import stun from './data/stunMaster.js';
import speed from './data/speedLadder.js';
import bank from './data/bankVault.js';
import kick from './data/kickEscape.js';
import train from './data/positionTrain.js';
import carom from './data/caromChallenge.js';
import safety from './data/safetyLock.js';
import pattern from './data/patternPuzzle.js';
import sniper from './data/pocketSniper.js';
import rail from './data/railRunner.js';
import bosses from './data/bosses.js';

export const GHOST_GAME = {
  id: 'ghost',
  name: 'Ghost',
  icon: '♚',
  tagline: 'Race the Ghost from 3-ball to 9-ball. Runout = your rack, any miss = Ghost rack.',
  primarySkill: 'Pattern Play',
  special: 'ghost',
  skillEffects: { 'Pattern Play': 1, 'Shot Making': 0.6, 'Position Play': 0.4 },
  unlock: null,
  stages: [3, 4, 5, 6, 7, 8, 9].map((n, i) => ({ id: `ghost-${n}`, name: `${n}-Ball Ghost`, balls: n, difficulty: Math.min(10, 2 + i * 1.3) }))
};

export const CORE_GAME_IDS = ['ghost', 'landing', 'draw', 'follow', 'stun', 'speed', 'bank', 'kick', 'train'];
export const GAMES = [GHOST_GAME, landing, draw, follow, stun, speed, bank, kick, train, carom, safety, pattern, sniper, rail];
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const BOSSES = bosses.list;

const built = {};

export function getGame(id) {
  return GAME_BY_ID[id] || null;
}

export function stageSpecs(gameId) {
  return getGame(gameId)?.stages || [];
}

export function stageIndex(gameId, stageId) {
  return stageSpecs(gameId).findIndex((s) => s.id === stageId);
}

function buildSpecial(spec, def, i) {
  return {
    ...spec,
    game: def.id,
    level: i + 1,
    kind: spec.kind,
    difficulty: spec.difficulty ?? 3,
    skillEffects: spec.skillEffects || def.skillEffects,
    xp: spec.xp ?? 60 + (spec.difficulty ?? 3) * 15,
    scoringRules: spec.kind === 'ladder' ? { mode: 'ladder', attempts: spec.shots, rungs: spec.rungs } : { mode: 'calibration', attempts: spec.speeds.length },
    attemptCount: spec.kind === 'ladder' ? spec.shots : spec.speeds.length,
    passingRequirement: spec.kind === 'ladder' ? { reachTop: true } : { recordAll: true },
    prerequisites: [],
    unlocks: [],
    blockers: [],
    whyExplanation: null
  };
}

export function getStages(gameId) {
  if (built[gameId]) return built[gameId];
  const def = getGame(gameId);
  if (!def || def.special === 'ghost') return (built[gameId] = def ? def.stages.map((s, i) => ({ ...s, game: 'ghost', level: i + 1 })) : []);
  const list = def.stages.map((spec, i) => {
    let ch;
    if (spec.kind === 'calibration' || spec.kind === 'ladder') ch = buildSpecial(spec, def, i);
    else {
      ch = buildChallenge(spec, { ...def, game: def.id, kind: spec.kind || def.kind });
      ch.level = i + 1;
      ch.game = def.id;
    }
    ch.prerequisites = i > 0 ? [`${def.id}:${def.stages[i - 1].id}`] : [];
    ch.unlocks = i < def.stages.length - 1 ? [`${def.id}:${def.stages[i + 1].id}`] : def.endless ? [`${def.id}:endless`] : [];
    return ch;
  });
  built[gameId] = list;
  return list;
}

export function getStage(gameId, stageId) {
  return getStages(gameId).find((s) => s.id === stageId) || null;
}

/** Build every stage of every game (used by verify / e2e) */
export function allStages() {
  return GAMES.filter((g) => !g.special).flatMap((g) => getStages(g.id));
}

let bossBuilt = null;
export function getBosses() {
  if (bossBuilt) return bossBuilt;
  bossBuilt = BOSSES.map((b) => ({
    ...b,
    shots: b.shots.map((s, i) => {
      const ch = buildChallenge({ ...s.spec, id: `${b.id}-${i + 1}`, name: s.title }, { game: 'boss', kind: s.spec.kind || 'position', skillEffects: { [s.skill]: 1 }, scoring: { mode: s.mode, attempts: s.attempts, pass: s.mode === 'zone' ? { stars: s.need } : { made: s.need } } });
      return { ...s, index: i, challenge: ch };
    })
  }));
  return bossBuilt;
}

export function getBoss(id) {
  return getBosses().find((b) => b.id === id) || null;
}

export function bossForRank(rankIndex) {
  return BOSSES.find((b) => b.rank === rankIndex) || null;
}
