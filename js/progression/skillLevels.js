/**
 * Individual skill levels (v11) — computed ONLY from real performance records (prog.items: Arcade stages, drills,
 * Create Drill drills, rank-eligible .pooliq content, Ghost matches, Promotion Test shots).
 *   rating(skill) = Σ weight × tierPoints × credit(record) × recency  /  Σ weight × tierPoints over the content that trains it
 *   credit = masteryCredit[stars] (not passed: masteryCredit[0] × performance curve)
 *   level  = the Career ladder step at rating^curvePow, capped by the hardest tier with a PASSED foundation item.
 * A single drill can never push a skill beyond its share of the content, so one-drill farming can't raise a skill.
 */
import { SKILLS, SKILL_LEVEL, RANK_LADDER, TIERS, tierIndex, MASTERY } from './config.js';
import { builtinItems } from './catalog.js';
import { adjustedPerf, curveFactor, masteryStars, CHAMPION_INDEX } from './award.js';

const DAY = 86400000;
/** Ladder steps: every ball of every numbered rank, in order */
export const LADDER = (() => {
  const out = [];
  RANK_LADDER.balls.forEach((n, r) => { for (let b = 1; b <= n; b++) out.push({ rank: r, ball: b }); });
  return out;
})();
export const TOTAL_STEPS = LADDER.length;
export function stepOf(rank, ball) {
  if (rank >= CHAMPION_INDEX) return TOTAL_STEPS + 1;
  let s = 0;
  for (let r = 0; r < rank; r++) s += RANK_LADDER.balls[r];
  return s + Math.max(1, Math.min(RANK_LADDER.balls[rank], ball));
}
export function levelOfStep(step) {
  if (step > TOTAL_STEPS) return { rank: CHAMPION_INDEX, ball: 0, champion: true };
  return { ...LADDER[Math.max(0, Math.min(TOTAL_STEPS - 1, step - 1))], champion: false };
}
export function levelLabel(lv) {
  const name = RANK_LADDER.names[lv.rank];
  return lv.champion ? `${name}` : `${name} ${lv.ball}`;
}

function recency(t, now) {
  if (!t) return SKILL_LEVEL.recency.min;
  const age = (now - t) / DAY;
  const R = SKILL_LEVEL.recency;
  if (!(age > R.fullDays)) return 1;
  return Math.max(R.min, 1 - ((age - R.fullDays) / R.spanDays) * (1 - R.min));
}
export function creditOf(rec) {
  if (!rec || !rec.attempts) return 0;
  const stars = masteryStars(rec);
  if (!stars) return SKILL_LEVEL.masteryCredit[0] * curveFactor(adjustedPerf(rec.best || 0, false));
  return SKILL_LEVEL.masteryCredit[stars];
}

const cache = new WeakMap();
/** → { [skillId]: { id, name, core, rating, score, step, rank, ball, champion, label, ceiling, passesAtTier: {tier: n (≥ tier)}, played } } */
export function computeSkillLevels(state, now = Date.now()) {
  const key = state.prog || state;
  const hit = cache.get(key);
  if (hit && hit.rank === (state.rankIndex || 0) && now - hit.at < 60000) return hit.out;
  const recs = state.prog?.items || {};
  const universe = new Map();
  for (const it of builtinItems()) universe.set(it.key, { tier: it.tier, w: it.weights });
  // played drills / custom / content / 8-ball Ghost records count once played (unplayed content never lowers a rating)
  for (const [k, r] of Object.entries(recs)) if (!universe.has(k) && r.attempts > 0 && !k.startsWith('boss:')) universe.set(k, { tier: r.tier, w: r.w || {} });
  const TP = SKILL_LEVEL.tierPoints;
  const out = {};
  for (const s of SKILLS) {
    let num = 0;
    let den = 0;
    let played = 0;
    const passTiers = TIERS.map(() => 0);
    let proMastered = 0;
    for (const [k, u] of universe) {
      const w = u.w?.[s.id] || 0;
      if (!w) continue;
      const pts = w * (TP[u.tier] || TP.beginner);
      den += pts;
      const r = recs[k];
      if (!r || !r.attempts) continue;
      played++;
      num += pts * creditOf(r) * recency(r.lastAt, now);
      if (r.passes > 0 && w >= SKILL_LEVEL.foundationWeight) {
        passTiers[tierIndex(r.tier)]++;
        if (r.tier === 'pro' && masteryStars(r) >= 3) proMastered++;
      }
    }
    const rating = den ? Math.min(1, num / den) : 0;
    const passesAtTier = {};
    TIERS.forEach((t, i) => { passesAtTier[t] = passTiers.slice(i).reduce((a, b) => a + b, 0); });
    const topTier = [...TIERS].reverse().find((t) => passTiers[tierIndex(t)] > 0) || 'none';
    const ceil = SKILL_LEVEL.ceilingByTier[topTier];
    let step = played ? Math.max(1, Math.ceil(Math.pow(rating, SKILL_LEVEL.curvePow) * TOTAL_STEPS)) : 1;
    step = Math.min(step, stepOf(ceil.rank, ceil.ball));
    let lv = levelOfStep(step);
    if (rating >= SKILL_LEVEL.champion.rating && proMastered >= SKILL_LEVEL.champion.proMastered) lv = levelOfStep(TOTAL_STEPS + 1);
    out[s.id] = { id: s.id, name: s.name, long: s.long || s.name, core: s.core, rating, score: Math.round(rating * 100), step: lv.champion ? TOTAL_STEPS + 1 : step, rank: lv.rank, ball: lv.ball, champion: lv.champion, label: played ? levelLabel(lv) : 'Not rated yet', played, ceiling: topTier, passesAtTier };
  }
  cache.set(key, { at: now, rank: state.rankIndex || 0, out });
  return out;
}
export function weakestSkillLevels(state, n = 3, now = Date.now()) {
  const lv = computeSkillLevels(state, now);
  return Object.values(lv).sort((a, b) => a.step - b.step || a.rating - b.rating || (b.core ? 1 : 0) - (a.core ? 1 : 0)).slice(0, n);
}
export { MASTERY };
