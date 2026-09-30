/**
 * XP + mastery engine (pure). One call per finished session: applyAward(state, { item, ratio, passed, score, at }).
 *   performance ratio (0–1) → curve factor × base XP (by tier) + perfect / first-clear / PB bonuses
 *   → anti-farming (mastered/strong repeat factors, same-day diminishing, tier caps, Champion stops Rank XP)
 *   → Lifetime XP (always), Career Rank XP (rank-eligible content), Drill XP (drill work only)
 *   → the item's mastery record (best, attempts, recent, PB, PASSED/STRONG/MASTERED).
 * Numbers come from config.js only. Other features (e.g. a future Runout School) feed skills by calling applyAward
 * with their own item descriptor { key, source, tier, weights, mode, rankXpEligible }.
 */
import { XP, MASTERY, RANK_LADDER, DRILL_RANK, PROGRESSION_VERSION, TIERS, tierIndex } from './config.js';

const DAY = 86400000;
export const CHAMPION_INDEX = RANK_LADDER.balls.findIndex((b) => !b);
export const rankTotal = (r) => (RANK_LADDER.balls[r] || 0) * (RANK_LADDER.ballXp[r] || 0);

export function emptyProg() {
  return { v: 0, lifetimeXp: 0, legacyXp: 0, rankXpTotal: 0, rankXpBy: {}, carry: 0, tierXp: {}, drillXp: 0, items: {}, stats: { sessions: 0, perfect: 0, firstClears: 0, pbs: 0, trainingMs: 0 }, events: [], gatesCleared: {}, rankSeen: null };
}
export function ensureProg(state) {
  const p = state.prog && typeof state.prog === 'object' ? state.prog : null;
  if (!p) return emptyProg();
  const e = emptyProg();
  return { ...e, ...p, rankXpBy: { ...(p.rankXpBy || {}) }, tierXp: { ...(p.tierXp || {}) }, items: { ...(p.items || {}) }, stats: { ...e.stats, ...(p.stats || {}) }, events: (p.events || []).slice(), gatesCleared: { ...(p.gatesCleared || {}) } };
}

// ------------------------------------------------------------------ performance
const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
/** Performance ratio of an evaluated session (engine.evaluateSession / evaluateBoss result) + its attempts */
export function performanceOf(ev, attempts = [], stage = null) {
  if (!ev) return 0;
  const N = Number.isFinite(ev.attemptsTotal) && ev.attemptsTotal > 0 ? ev.attemptsTotal : Math.max(1, attempts.length);
  const sum = (f) => attempts.reduce((a, x) => a + f(x), 0);
  switch (ev.mode) {
    case 'boss': return clamp01(ev.passedCount / Math.max(1, ev.shots.length));
    case 'binary': case 'success': return clamp01(sum((a) => (a.result === 'made' ? 1 : a.result === 'partial' ? 0.3 : 0)) / N);
    case 'sniper': return clamp01((ev.made || 0) / N);
    case 'zone': return clamp01(ev.requirePocket === false ? sum((a) => (a.stars || 0) / 3) / N : sum((a) => (a.pocketed ? 0.4 + 0.2 * (a.stars || 0) : 0)) / N);
    case 'stars': return clamp01((ev.stars || 0) / (3 * N));
    case 'lives': return clamp01(sum((a) => (a.result === 'madePos' ? 1 : a.result === 'made' ? 0.85 : 0)) / N);
    case 'kick': return clamp01(sum((a) => (a.result === 'bonus' ? 1 : a.result === 'hit' ? 0.85 : 0)) / N);
    case 'train': {
      const steps = Math.max(1, stage?.steps?.length || Math.max(1, ...(ev.runs || []).map((r) => r.balls)));
      return clamp01(Math.max(0, ...(ev.runs || []).map((r) => (r.balls + r.zones) / Math.max(1, 2 * steps - 1))));
    }
    case 'pattern': return clamp01(sum((a) => (a.result === 'ran' ? 1 : a.result === 'partial' ? 0.4 : 0)) / N);
    case 'ladder': return ev.complete ? (ev.attemptsUsed <= ev.rungs.length ? 1 : clamp01(Math.max(0.6, ev.rungs.length / ev.attemptsUsed))) : clamp01(ev.bestRung / ev.rungs.length);
    case 'calibration': return ev.over ? 1 : 0;
    default: return clamp01(ev.maxScore ? ev.score / ev.maxScore : ev.passed ? 1 : 0);
  }
}
/** Ghost match → performance ratio: a win scores 0.8–1.0 by margin (5–0 = perfect); a loss ≤ 0.5 */
export function ghostPerformance(m) {
  const race = Math.max(1, m.race || 5);
  return m.won ? clamp01(0.8 + 0.2 * (1 - (m.ghost || 0) / race)) : clamp01((0.5 * (m.you || 0)) / race);
}
export function adjustedPerf(ratio, passed) {
  const r = clamp01(ratio);
  return passed ? Math.max(r, XP.passFloor) : Math.min(r, XP.failCap);
}
export function curveFactor(perf) {
  let f = 0;
  for (const row of XP.curve) if (perf >= row.at - 1e-9) f = row.factor;
  return f;
}

// ------------------------------------------------------------------ mastery
export function masteryStars(rec) {
  if (!rec || !(rec.passes > 0)) return 0;
  const m = rec.m || MASTERY.default;
  const b = rec.bestPassed || 0;
  return b >= m.mastered - 1e-9 ? 3 : b >= m.strong - 1e-9 ? 2 : 1;
}
export const MASTERY_LABEL = (n) => MASTERY.labels[n] || '';
export const starText = (n) => (n ? '⭐'.repeat(n) : '');

function newRecord(item) {
  return { key: item.key, name: item.name, src: item.source, tier: item.tier, w: item.weights || {}, primary: item.primary || null, mode: item.mode, m: item.mastery || MASTERY.default, cat: item.category || null, dr: !!item.drillRank, attempts: 0, passes: 0, best: 0, bestPassed: 0, bestScore: 0, recent: [], stars: 0, firstClearAt: null, lastAt: null, pbAt: null, day: null, dayN: 0 };
}
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);

// ------------------------------------------------------------------ rank XP buckets
function bankRankXp(prog, rankIndex, amount, { migrating = false } = {}) {
  if (amount <= 0) return 0;
  prog.rankXpTotal += amount;
  if (migrating) return amount;
  if (rankIndex >= CHAMPION_INDEX) return 0;
  const total = rankTotal(rankIndex);
  const have = prog.rankXpBy[rankIndex] || 0;
  const add = Math.min(Math.max(0, total - have), amount);
  prog.rankXpBy[rankIndex] = have + add;
  const over = amount - add;
  if (over > 0) {
    const cap = Math.round(rankTotal(rankIndex + 1) * XP.overflowCarry);
    const c = Math.min(cap - (prog.carry || 0), over);
    if (c > 0) prog.carry = (prog.carry || 0) + c;
    return add + Math.max(0, c);
  }
  return add;
}

/**
 * Apply one finished session. act: { item, ratio, passed, score?, at?, durationMs? }
 * opts: { migrating } (history replay: Rank XP is totalled, then placed by the migration)
 * Returns { state, award }.
 */
export function applyAward(state, act, opts = {}) {
  const item = act.item;
  const prog = ensureProg(state);
  const at = act.at || Date.now();
  const rankIndex = Math.max(0, Math.min(RANK_LADDER.names.length - 1, state.rankIndex || 0));
  const prevRec = prog.items[item.key] || null;
  const rec = prevRec ? { ...prevRec, recent: (prevRec.recent || []).slice() } : newRecord(item);
  // keep the latest metadata (content can be edited)
  Object.assign(rec, { name: item.name, src: item.source, tier: item.tier, w: item.weights || rec.w, primary: item.primary || rec.primary, mode: item.mode, m: item.mastery || rec.m, cat: item.category || rec.cat || null, dr: !!item.drillRank });
  const ratio = clamp01(act.ratio);
  const passed = !!act.passed;
  const perf = adjustedPerf(ratio, passed);
  const prevStars = masteryStars(prevRec);
  const tier = TIERS.includes(item.tier) ? item.tier : 'beginner';
  const base = (item.baseXP ?? XP.base[tier]) * (XP.sourceMult[item.source] ?? 1);
  const flags = [];
  let raw = base * curveFactor(perf);
  const perfect = passed && ratio >= 0.999;
  if (perfect && raw > 0) { raw += base * XP.perfectBonus; flags.push('PERFECT'); }
  const firstClear = passed && !rec.firstClearAt;
  if (firstClear) { raw += base * XP.firstClearBonus; flags.push('FIRST CLEAR'); }
  const pb = passed && !firstClear && rec.passes > 0 && ratio > (rec.bestPassed || 0) + 1e-6;
  if (pb) { raw += base * XP.pbBonus; flags.push('PERSONAL BEST'); }
  // anti-farming: repeats of strong / mastered items, same-day grinding
  let rankF = 1;
  let lifeF = 1;
  if (prevStars >= 3) { rankF = XP.repeat.mastered; lifeF = XP.repeat.masteredLifetime; flags.push('MASTERED REPEAT'); }
  else if (prevStars === 2) { rankF = lifeF = XP.repeat.strong; }
  const d = dayOf(at);
  const dayN = rec.day === d ? (rec.dayN || 0) + 1 : 1;
  if (dayN > XP.repeat.sameDayFree) { rankF *= XP.repeat.sameDayFactor; lifeF *= XP.repeat.sameDayFactor; flags.push('REPEAT TODAY'); }
  let life = Math.round(raw * lifeF);
  if (life < XP.participationLifetime) life = XP.participationLifetime;
  // Career Rank XP: rank-eligible items, tier caps, custom-drill tier cap, Champion stops Rank XP
  let rank = 0;
  let tierMaxed = false;
  const champion = rankIndex >= CHAMPION_INDEX;
  if (item.rankXpEligible !== false && !champion && raw > 0) {
    let rTier = tier;
    let rBase = base;
    if (item.source === 'custom' && tierIndex(tier) > tierIndex(XP.customDrillMaxTier)) { rTier = XP.customDrillMaxTier; rBase = (XP.base[rTier]) * (XP.sourceMult.custom ?? 1); }
    let want = Math.round(raw * (rBase / base) * rankF);
    const cap = XP.tierCaps[rTier];
    const have = prog.tierXp[rTier] || 0;
    if (cap != null && have + want > cap) { want = Math.max(0, cap - have); tierMaxed = true; flags.push(`${rTier.toUpperCase()} XP MAXED`); }
    prog.tierXp[rTier] = have + want;
    rank = bankRankXp(prog, rankIndex, want, opts);
  }
  if (champion) flags.push('MAX RANK');
  // Drill XP (separate Drill Rank)
  let drill = 0;
  // Ball Pocketing pays Drill XP only at bronze or better. Below bronze pays none.
  const ballPocketXp = item.category !== 'Ball Pocketing' || ['Bronze', 'Silver', 'Gold'].includes(act.medal);
  if (item.drillRank && DRILL_RANK.sources.includes(item.source) && raw > 0 && ballPocketXp) {
    drill = Math.round(raw * rankF * DRILL_RANK.xpScale);
    prog.drillXp += drill;
  }
  prog.lifetimeXp += life;
  // mastery record
  rec.attempts += 1;
  if (passed) rec.passes += 1;
  rec.best = Math.max(rec.best || 0, ratio);
  if (passed) rec.bestPassed = Math.max(rec.bestPassed || 0, ratio);
  if (act.score != null) rec.bestScore = Math.max(rec.bestScore || 0, Number(act.score) || 0);
  rec.recent = [...rec.recent, Math.round(ratio * 100) / 100].slice(-MASTERY.recentWindow);
  if (firstClear) rec.firstClearAt = at;
  if (pb) rec.pbAt = at;
  rec.lastAt = at;
  rec.day = d;
  rec.dayN = dayN;
  rec.stars = masteryStars(rec);
  prog.items[item.key] = rec;
  prog.stats.sessions += 1;
  if (perfect) prog.stats.perfect += 1;
  if (firstClear) prog.stats.firstClears += 1;
  if (pb) prog.stats.pbs += 1;
  if (act.durationMs > 0) prog.stats.trainingMs += Math.min(act.durationMs, 3600000);
  const award = { key: item.key, name: item.name, lifetime: life, rank, drill, flags, tierMaxed, tier, stars: rec.stars, prevStars, firstClear, pb, perfect, champion, ratio: Math.round(ratio * 100) / 100, undo: { key: item.key, prevRec, life, rank, drill, rankIndex, tier } };
  if (!opts.migrating) prog.events = [{ at, key: item.key, name: item.name, life, rank, drill, flags }, ...prog.events].slice(0, 60);
  if (prog.v < PROGRESSION_VERSION && !opts.migrating && !state.prog) prog.v = PROGRESSION_VERSION;
  return { state: { ...state, prog }, award };
}

/** Record mastery only (no XP) — e.g. individual Promotion Test shots */
export function recordOnly(state, act) {
  const prog = ensureProg(state);
  const item = act.item;
  const prev = prog.items[item.key];
  const rec = prev ? { ...prev, recent: (prev.recent || []).slice() } : newRecord(item);
  const ratio = clamp01(act.ratio);
  rec.attempts += 1;
  if (act.passed) { rec.passes += 1; rec.bestPassed = Math.max(rec.bestPassed || 0, ratio); if (!rec.firstClearAt) rec.firstClearAt = act.at || Date.now(); }
  rec.best = Math.max(rec.best || 0, ratio);
  rec.recent = [...rec.recent, Math.round(ratio * 100) / 100].slice(-MASTERY.recentWindow);
  rec.lastAt = act.at || Date.now();
  rec.stars = masteryStars(rec);
  prog.items[item.key] = rec;
  return { ...state, prog };
}

/** Undo an award (Ghost UNDO LAST RACK after a saved match) */
export function revertAward(state, u) {
  if (!u || !state.prog) return state;
  const prog = ensureProg(state);
  prog.lifetimeXp = Math.max(0, prog.lifetimeXp - (u.life || 0));
  prog.drillXp = Math.max(0, prog.drillXp - (u.drill || 0));
  if (u.rank) {
    prog.rankXpTotal = Math.max(0, prog.rankXpTotal - u.rank);
    prog.rankXpBy[u.rankIndex] = Math.max(0, (prog.rankXpBy[u.rankIndex] || 0) - u.rank);
    for (const t of Object.keys(prog.tierXp)) if (t === u.tier) prog.tierXp[t] = Math.max(0, prog.tierXp[t] - u.rank);
  }
  if (u.prevRec) prog.items[u.key] = u.prevRec;
  else delete prog.items[u.key];
  prog.stats.sessions = Math.max(0, prog.stats.sessions - 1);
  prog.events = prog.events.filter((e, i) => !(i === 0 && e.key === u.key));
  return { ...state, prog };
}
export { DAY };
