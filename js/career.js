/**
 * Career ranks, requirements, promotion tests.
 * Rank-ups ONLY from saved results meeting requirements — no click-through.
 */
import { RANK_NAMES } from './storage.js';
import { getDrillById } from './drills.js';

export { RANK_NAMES };

/**
 * Each rank (except Rookie index 0) defines requirements to REACH that rank
 * from the previous one.
 */
export const RANK_REQUIREMENTS = [
  { rankIndex: 0, name: 'Rookie', requirements: [] },
  {
    rankIndex: 1,
    name: 'Club Player',
    requirements: [
      { type: 'drill', drillId: 'sm-straight-1', label: 'Pass Center-Table Straight' },
      { type: 'drill', drillId: 'stop-1', label: 'Pass Stop Shot Foundation' },
      { type: 'drill', drillId: 'sm-hanging-1', label: 'Pass Hanging Ball Drill' }
    ]
  },
  {
    rankIndex: 2,
    name: 'Shooter',
    requirements: [
      { type: 'drill', drillId: 'follow-1', label: 'Pass Natural Follow Zone' },
      { type: 'drill', drillId: 'draw-1', label: 'Pass Short Draw Zone' },
      { type: 'drill', drillId: 'cut-1', label: 'Pass Quarter-Ball Cuts' },
      { type: 'ghost', balls: 3, wins: 1, label: 'Win 1× 3-Ball Ghost match' }
    ]
  },
  {
    rankIndex: 3,
    name: 'Competitor',
    requirements: [
      { type: 'drill', drillId: 'speed-2', label: 'Pass Soft Pocket Speed' },
      { type: 'drill', drillId: 'cbpos-1', label: 'Pass One-Zone Shape' },
      { type: 'drill', drillId: 'pattern-1', label: 'Pass Two-Ball Pattern' },
      { type: 'promotion', testId: 'promo-competitor', label: 'Pass Competitor Promotion Test' }
    ]
  },
  {
    rankIndex: 4,
    name: 'Advanced',
    requirements: [
      { type: 'drill', drillId: 'stun-1', label: 'Pass Stun Across Line' },
      { type: 'drill', drillId: 'bank-1', label: 'Pass Cross-Corner Bank' },
      { type: 'drill', drillId: 'kick-1', label: 'Pass One-Rail Kick Contact' },
      { type: 'ghost', balls: 5, wins: 1, label: 'Win 1× 5-Ball Ghost match' }
    ]
  },
  {
    rankIndex: 5,
    name: 'Expert',
    requirements: [
      { type: 'drill', drillId: 'safe-1', label: 'Pass Distance Safety' },
      { type: 'drill', drillId: 'pattern-2', label: 'Pass Three-Ball Sequence Map' },
      { type: 'drill', drillId: 'run-1', label: 'Pass Three-Ball Runout' },
      { type: 'promotion', testId: 'promo-expert', label: 'Pass Expert Promotion Test' }
    ]
  },
  {
    rankIndex: 6,
    name: 'Master',
    requirements: [
      { type: 'drill', drillId: 'draw-3', label: 'Pass Power Draw Window' },
      { type: 'drill', drillId: 'bank-2', label: 'Pass Cross-Side Bank' },
      { type: 'drill', drillId: 'run-2', label: 'Pass Five-Ball Runout' },
      { type: 'ghost', balls: 7, wins: 1, label: 'Win 1× 7-Ball Ghost match' }
    ]
  },
  {
    rankIndex: 7,
    name: 'Elite',
    requirements: [
      { type: 'drill', drillId: 'kick-2', label: 'Pass Two-Rail Kick Line' },
      { type: 'drill', drillId: 'safe-3', label: 'Pass Two-Way Shot Safety' },
      { type: 'drill', drillId: 'cbpos-keyball', label: 'Pass Key-Ball Window' },
      { type: 'promotion', testId: 'promo-elite', label: 'Pass Elite Promotion Test' }
    ]
  },
  {
    rankIndex: 8,
    name: 'Pro',
    requirements: [
      { type: 'drill', drillId: 'bank-3', label: 'Pass Short Rail Bank' },
      { type: 'drill', drillId: 'run-3', label: 'Pass Pressure 8 Finish' },
      { type: 'ghost', balls: 9, wins: 1, label: 'Win 1× 9-Ball Ghost match' },
      { type: 'ghostWinsTotal', wins: 5, label: 'Earn 5 Ghost match wins total' }
    ]
  },
  {
    rankIndex: 9,
    name: 'Champion',
    requirements: [
      { type: 'drill', drillId: 'run-bi-h-clear', label: 'Pass BIH Clear Ladder' },
      { type: 'drill', drillId: 'kick-3', label: 'Pass Kick to Pocket' },
      { type: 'ghostWinsTotal', wins: 10, label: 'Earn 10 Ghost match wins total' },
      { type: 'promotion', testId: 'promo-champion', label: 'Pass Champion Promotion Test' }
    ]
  }
];

/** Multi-stage promotion tests */
export const PROMOTION_TESTS = {
  'promo-competitor': {
    id: 'promo-competitor',
    name: 'Competitor Promotion Test',
    targetRank: 3,
    stages: [
      { id: 'c1', name: 'Shot Making Gate', drillId: 'sm-straight-2', attempts: 8, passNeed: 6, scoringType: 'binary' },
      { id: 'c2', name: 'Stop Control Gate', drillId: 'stop-2', attempts: 8, passNeed: 5, scoringType: 'position' },
      { id: 'c3', name: 'Follow Shape Gate', drillId: 'follow-2', attempts: 8, passNeed: 5, scoringType: 'position' }
    ]
  },
  'promo-expert': {
    id: 'promo-expert',
    name: 'Expert Promotion Test',
    targetRank: 5,
    stages: [
      { id: 'e1', name: 'Cut Accuracy', drillId: 'cut-2', attempts: 8, passNeed: 6, scoringType: 'binary' },
      { id: 'e2', name: 'Draw Control', drillId: 'draw-2', attempts: 8, passNeed: 5, scoringType: 'position' },
      { id: 'e3', name: 'Pattern Sense', drillId: 'pattern-2', attempts: 6, passNeed: 4, scoringType: 'position' }
    ]
  },
  'promo-elite': {
    id: 'promo-elite',
    name: 'Elite Promotion Test',
    targetRank: 7,
    stages: [
      { id: 'el1', name: 'Banks', drillId: 'bank-2', attempts: 8, passNeed: 4, scoringType: 'binary' },
      { id: 'el2', name: 'Kicks', drillId: 'kick-2', attempts: 6, passNeed: 3, scoringType: 'binary' },
      { id: 'el3', name: 'Runout', drillId: 'run-2', attempts: 4, passNeed: 2, scoringType: 'binary' }
    ]
  },
  'promo-champion': {
    id: 'promo-champion',
    name: 'Champion Promotion Test',
    targetRank: 9,
    stages: [
      { id: 'ch1', name: 'Power Draw', drillId: 'draw-3', attempts: 6, passNeed: 4, scoringType: 'position' },
      { id: 'ch2', name: 'Safety IQ', drillId: 'safe-3', attempts: 6, passNeed: 4, scoringType: 'position' },
      { id: 'ch3', name: 'Clear Ladder', drillId: 'run-bi-h-clear', attempts: 3, passNeed: 2, scoringType: 'binary' }
    ]
  }
};

export function ghostWins(state, balls = null) {
  return (state.ghostMatches || []).filter(
    (m) => m.won && (balls == null || m.balls === balls)
  ).length;
}

export function checkRequirement(req, state) {
  if (req.type === 'drill') return !!state.results[req.drillId]?.passed;
  if (req.type === 'ghost') return ghostWins(state, req.balls) >= (req.wins || 1);
  if (req.type === 'ghostWinsTotal') return ghostWins(state) >= (req.wins || 1);
  if (req.type === 'promotion') return !!state.promotionAttempts?.[req.testId]?.passed;
  return false;
}

export function requirementsMet(rankIndex, state) {
  const def = RANK_REQUIREMENTS[rankIndex];
  if (!def) return false;
  if (!def.requirements.length) return true;
  return def.requirements.every((r) => checkRequirement(r, state));
}

export function requirementChecklist(rankIndex, state) {
  const def = RANK_REQUIREMENTS[rankIndex];
  if (!def) return [];
  return def.requirements.map((r) => ({
    ...r,
    met: checkRequirement(r, state),
    drill: r.drillId ? getDrillById(r.drillId) : null
  }));
}

/** Highest rank earned (0..9). Must unlock sequentially. */
export function computeEarnedRankIndex(state) {
  let earned = 0;
  for (let i = 1; i < RANK_REQUIREMENTS.length; i++) {
    if (requirementsMet(i, state) && earned === i - 1) earned = i;
    else break;
  }
  return Math.max(earned, 0);
}

export function syncRank(state) {
  return { ...state, rankIndex: computeEarnedRankIndex(state) };
}

export function canAttemptPromotion(testId, state) {
  const test = PROMOTION_TESTS[testId];
  if (!test) return false;
  if (state.rankIndex !== test.targetRank - 1) return false;
  const def = RANK_REQUIREMENTS[test.targetRank];
  const others = def.requirements.filter((r) => !(r.type === 'promotion' && r.testId === testId));
  return others.every((r) => checkRequirement(r, state));
}

export function evaluatePromotion(testId, stageScores, state) {
  const test = PROMOTION_TESTS[testId];
  if (!test) return { passed: false, weakStages: [], state };
  const stageResults = test.stages.map((stage, i) => {
    const score = stageScores[i] ?? 0;
    const passed = score >= stage.passNeed;
    return { stage, score, passed };
  });
  const passed = stageResults.every((s) => s.passed);
  const weakStages = stageResults.filter((s) => !s.passed).map((s) => s.stage.name);
  const prev = state.promotionAttempts?.[testId] || { tries: 0, passed: false };
  const nextAttempts = {
    ...state.promotionAttempts,
    [testId]: {
      passed: prev.passed || passed,
      tries: prev.tries + 1,
      lastDate: new Date().toISOString(),
      lastStages: stageResults.map((s) => ({
        id: s.stage.id,
        score: s.score,
        passNeed: s.stage.passNeed,
        passed: s.passed
      })),
      bestStages: stageResults.map((s, i) => {
        const oldBest = prev.bestStages?.[i]?.score ?? 0;
        return {
          id: s.stage.id,
          score: Math.max(oldBest, s.score),
          passed: prev.bestStages?.[i]?.passed || s.passed
        };
      })
    }
  };
  let next = { ...state, promotionAttempts: nextAttempts };
  if (passed) {
    next.xp = (next.xp || 0) + 250;
    next = syncRank(next);
  }
  return { passed, weakStages, stageResults, state: next };
}

export function nextRankInfo(state) {
  const idx = state.rankIndex || 0;
  if (idx >= 9) {
    return { current: RANK_NAMES[9], next: null, checklist: [], progress: 1 };
  }
  const checklist = requirementChecklist(idx + 1, state);
  const met = checklist.filter((c) => c.met).length;
  return {
    current: RANK_NAMES[idx],
    next: RANK_NAMES[idx + 1],
    checklist,
    progress: checklist.length ? met / checklist.length : 1
  };
}
