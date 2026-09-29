/**
 * Career rank status (named ranks + ball levels), Skill Gates, Promotion Test readiness, Drill Rank,
 * Recommended Training and Champion stats. Pure functions over the saved state.
 *
 * Named ranks come from js/career.js (existing names, requirements and Boss Battles are kept). v11 adds:
 *   • ball levels inside each rank from Rank XP (config RANK_LADDER), held at Skill Gates until foundations are met;
 *   • the rank's Boss Battle is its PROMOTION TEST: it unlocks only when the existing requirements AND
 *     Rank XP full + all gates + skill floors + mastery count (config PROMOTION) are met.
 */
import { RANK_LADDER, RANK_DISPLAY, GATES, PROMOTION, DRILL_RANK, XP, TIERS, TIER_LABEL, SKILLS, RECOMMEND, skillName, tierIndex, PROGRESSION_VERSION } from './config.js';
import { ensureProg, rankTotal, CHAMPION_INDEX, masteryStars } from './award.js';
import { computeSkillLevels, stepOf, levelLabel } from './skillLevels.js';
import { builtinItems, drillItem } from './catalog.js';
import { requirementChecklist } from '../career.js';
import { isStageUnlocked, isGameUnlocked } from '../games/engine.js';
import { allDrills } from '../drills.js';

export { CHAMPION_INDEX, rankTotal };
export const rankName = (r) => RANK_LADDER.names[r] || RANK_LADDER.names[0];
export function rankTitle(rankIndex, ball) {
  const name = rankName(rankIndex);
  if (rankIndex >= CHAMPION_INDEX) return RANK_DISPLAY.maxFormat.replace('{rank}', name);
  return RANK_DISPLAY.format.replace('{rank}', name).replace('{ball}', ball);
}

// ------------------------------------------------------------------ gates
export function gatesForRank(r) {
  return GATES.filter((g) => g.rank === r).sort((a, b) => a.ball - b.ball);
}
export function foundationStatus(state, f, levels = computeSkillLevels(state)) {
  const lv = levels[f.skill];
  const have = lv ? lv.passesAtTier[f.tier] || 0 : 0;
  return { ...f, name: skillName(f.skill), have, need: f.passes, met: have >= f.passes, label: `${skillName(f.skill)} — pass ${f.passes} ${TIER_LABEL[f.tier]}+ item${f.passes > 1 ? 's' : ''}` };
}
export function gateStatus(state, gate, xpBall = null) {
  const levels = computeSkillLevels(state);
  const prog = state.prog || {};
  const list = gate.foundations.map((f) => foundationStatus(state, f, levels));
  const cleared = !!prog.gatesCleared?.[gate.id] || list.every((x) => x.met);
  const xb = xpBall ?? xpBallOf(state);
  const xpMet = (state.rankIndex || 0) > gate.rank || xb >= gate.ball;
  return { gate, foundations: list, cleared, xpMet, locked: !cleared && (state.rankIndex || 0) === gate.rank && xb >= gate.ball };
}

// ------------------------------------------------------------------ career status
function xpBallOf(state) {
  const r = state.rankIndex || 0;
  if (r >= CHAMPION_INDEX) return 0;
  const xp = state.prog?.rankXpBy?.[r] || 0;
  return Math.min(RANK_LADDER.balls[r], 1 + Math.floor(xp / RANK_LADDER.ballXp[r]));
}
export function careerStatus(state) {
  const r = Math.max(0, Math.min(RANK_LADDER.names.length - 1, state.rankIndex || 0));
  const prog = ensureProg(state);
  const champion = r >= CHAMPION_INDEX;
  const balls = RANK_LADDER.balls[r] || 0;
  const per = RANK_LADDER.ballXp[r] || 0;
  const total = rankTotal(r);
  const xp = champion ? 0 : Math.min(total, prog.rankXpBy[r] || 0);
  const xpBall = champion ? 0 : Math.min(balls, 1 + Math.floor(xp / per));
  let ball = xpBall;
  let gateLocked = null;
  const gates = gatesForRank(r).map((g) => gateStatus(state, g, xpBall));
  for (const gs of gates) {
    if (!gs.cleared && xpBall > gs.gate.ball) { ball = gs.gate.ball; gateLocked = gs; break; }
    if (!gs.cleared && xpBall === gs.gate.ball && !gateLocked) gateLocked = { ...gs, atGate: true };
  }
  const gatesClear = gates.every((g) => g.cleared);
  const xpFull = !champion && xp >= total;
  const ballStart = (ball - 1) * per;
  const inBall = gateLocked && !gateLocked.atGate ? per : Math.max(0, xp - ballStart);
  return {
    rankIndex: r, name: rankName(r), title: rankTitle(r, ball), champion, balls, ball, xpBall, perBall: per, total, xp, xpFull, gatesClear, gates, gateLocked,
    ballProgress: champion ? 1 : ball >= balls && xpFull ? 1 : Math.min(1, inBall / per), toNextBall: champion ? 0 : Math.max(0, Math.min(total, ball * per) - xp),
    lifetimeXp: prog.lifetimeXp, legacyXp: prog.legacyXp || 0, carry: prog.carry || 0,
    tierCaps: TIERS.map((t) => ({ tier: t, label: TIER_LABEL[t], have: prog.tierXp[t] || 0, cap: XP.tierCaps[t], maxed: XP.tierCaps[t] != null && (prog.tierXp[t] || 0) >= XP.tierCaps[t] }))
  };
}

// ------------------------------------------------------------------ mastery counts
export function masteryCounts(state, filter = null) {
  const c = { played: 0, passed: 0, strong: 0, mastered: 0 };
  for (const rec of Object.values(state.prog?.items || {})) {
    if (filter && !filter(rec)) continue;
    if (!rec.attempts) continue;
    c.played++;
    const s = masteryStars(rec);
    if (s >= 1) c.passed++;
    if (s >= 2) c.strong++;
    if (s >= 3) c.mastered++;
  }
  return c;
}
const careerMasteryFilter = (rec) => !String(rec.key).startsWith('boss:') && !String(rec.key).startsWith('bshot:');

// ------------------------------------------------------------------ promotion test
/** Everything needed before the next rank's Promotion Test (Boss Battle) unlocks */
export function promotionStatus(state) {
  const r = state.rankIndex || 0;
  const to = r + 1;
  if (r >= CHAMPION_INDEX) return { to: null, unlocked: false, items: [], champion: true };
  const cs = careerStatus(state);
  const levels = computeSkillLevels(state);
  const def = PROMOTION[to] || { floors: {}, mastery: {} };
  const items = [];
  items.push({ type: 'xp', label: `${rankName(r)} Rank XP complete (${cs.balls}-ball)`, met: cs.xpFull, have: cs.xp, need: cs.total, href: '#training' });
  for (const g of cs.gates) items.push({ type: 'gate', label: g.gate.title, met: g.cleared, href: `#gate/${g.gate.id}`, gate: g.gate.id });
  for (const s of SKILLS) {
    const fl = s.core ? def.floors?.core : def.floors?.secondary;
    if (!fl) continue;
    const lv = levels[s.id];
    const need = stepOf(fl.rank, fl.ball);
    items.push({ type: 'floor', skill: s.id, label: `${s.name} at least ${levelLabel({ ...fl, champion: false })}`, met: lv.step >= need, have: lv.label, need: levelLabel({ ...fl, champion: false }), href: `#skill/${s.id}` });
  }
  const mc = masteryCounts(state, careerMasteryFilter);
  if (def.mastery?.strong) items.push({ type: 'mastery', label: `${def.mastery.strong} drills/stages at STRONG ⭐⭐ or better`, met: mc.strong >= def.mastery.strong, have: mc.strong, need: def.mastery.strong, href: '#training' });
  if (def.mastery?.mastered) items.push({ type: 'mastery', label: `${def.mastery.mastered} drills/stages MASTERED ⭐⭐⭐`, met: mc.mastered >= def.mastery.mastered, have: mc.mastered, need: def.mastery.mastered, href: '#training' });
  for (const c of requirementChecklist(to, state)) {
    if (c.type === 'boss') continue;
    items.push({ type: c.type === 'ghost' ? 'ghost' : 'career', label: c.label, met: c.met, have: c.progress?.have, need: c.progress?.need, href: c.link?.href || '#career' });
  }
  const unlocked = items.every((x) => x.met);
  return { to, toName: rankName(to), unlocked, items, open: items.filter((x) => !x.met), met: items.filter((x) => x.met).length };
}
export function promotionReady(state) {
  return promotionStatus(state).unlocked;
}

// ------------------------------------------------------------------ Drill Rank
const isDrillRec = (rec) => rec.dr === true && DRILL_RANK.sources.includes(rec.src);
export function drillRankStatus(state) {
  const prog = ensureProg(state);
  const c = masteryCounts(state, isDrillRec);
  const cats = new Set();
  for (const rec of Object.values(prog.items)) if (isDrillRec(rec) && masteryStars(rec) >= 1 && rec.primary) cats.add(rec.primary);
  const have = { xp: prog.drillXp || 0, passed: c.passed, strong: c.strong, mastered: c.mastered, categories: cats.size };
  const R = DRILL_RANK.ranks;
  const meets = (req) => have.xp >= req.xp && have.passed >= req.passed && have.strong >= req.strong && have.mastered >= req.mastered && have.categories >= req.categories;
  let idx = 0;
  for (let i = 1; i < R.length; i++) { if (meets(R[i])) idx = i; else break; }
  const next = R[idx + 1] || null;
  const reqs = next ? ['xp', 'passed', 'strong', 'mastered', 'categories'].filter((k) => next[k] > 0).map((k) => ({ key: k, have: have[k], need: next[k], met: have[k] >= next[k], label: { xp: 'Drill XP', passed: 'Drills PASSED ⭐', strong: 'Drills STRONG ⭐⭐', mastered: 'Drills MASTERED ⭐⭐⭐', categories: 'Skill categories passed' }[k] })) : [];
  const progress = next ? Math.min(1, reqs.reduce((a, q) => a + Math.min(1, q.have / q.need), 0) / Math.max(1, reqs.length)) : 1;
  return { index: idx, number: idx + 1, name: R[idx].name, max: !next, next: next ? next.name : null, have, reqs, progress, played: c.played };
}

// ------------------------------------------------------------------ Recommended Training
/** Extension point: later features (e.g. Learn lessons) register (state, skillId) → [{ title, sub, href, kind }] */
const providers = [];
export function registerRecommendationProvider(fn) { if (typeof fn === 'function' && !providers.includes(fn)) providers.push(fn); }

export function trainingFor(state, skillId, n = RECOMMEND.perSkill) {
  const recs = state.prog?.items || {};
  const out = [];
  const seen = new Set();
  const push = (x) => { if (!seen.has(x.href) && out.length < n) { seen.add(x.href); out.push(x); } };
  // installed-content providers first (hooks), then real content that trains the skill, weakest mastery first, easiest tier first
  for (const p of providers) { try { for (const x of p(state, skillId) || []) push(x); } catch { /* provider errors never break the page */ } }
  const cands = [];
  for (const it of builtinItems()) {
    if (it.source !== 'arcade') continue;
    const w = it.weights[skillId] || 0;
    if (w < 0.5) continue;
    if (!isGameUnlocked(state, it.gameId) || !isStageUnlocked(state, it.gameId, it.stageId)) continue;
    const s = masteryStars(recs[it.key]);
    if (s >= 3) continue;
    cands.push({ it, w, s, t: tierIndex(it.tier) });
  }
  for (const d of allDrills()) {
    const it = drillItem(d);
    const w = it.weights[skillId] || 0;
    if (w < 0.5) continue;
    const s = masteryStars(recs[it.key]);
    if (s >= 3) continue;
    cands.push({ it, w, s, t: tierIndex(it.tier) });
  }
  cands.sort((a, b) => a.s - b.s || a.t - b.t || b.w - a.w);
  for (const c of cands) push({ title: c.it.name, sub: `${TIER_LABEL[c.it.tier]} · ${c.s ? '⭐'.repeat(c.s) : 'not passed yet'}`, href: c.it.href, kind: c.it.source });
  if (skillId === 'pattern' && out.length < n) push({ title: 'Ghost matches', sub: 'Run racks against the Ghost', href: '#ghost', kind: 'ghost' });
  return out;
}
export function recommendedTraining(state, n = RECOMMEND.skills) {
  const levels = computeSkillLevels(state);
  const ps = promotionStatus(state);
  const cs = careerStatus(state);
  // blocked skills first (gate foundations, then skill floors), then the weakest skills
  const blocked = [];
  if (cs.gateLocked) for (const f of cs.gateLocked.foundations) if (!f.met) blocked.push({ skill: f.skill, why: `${cs.gateLocked.gate.title}: ${f.label}` });
  for (const it of ps.open || []) if (it.type === 'floor') blocked.push({ skill: it.skill, why: `Promotion floor: ${it.label}` });
  const order = [...blocked.map((b) => b.skill), ...Object.values(levels).filter((l) => !l.hidden).sort((a, b) => a.step - b.step || a.rating - b.rating).map((l) => l.id)];
  const picked = [];
  for (const id of order) if (!picked.includes(id)) picked.push(id);
  return picked.slice(0, n).map((id) => ({ skill: id, name: skillName(id), level: levels[id], why: blocked.find((b) => b.skill === id)?.why || null, items: trainingFor(state, id) }));
}

// ------------------------------------------------------------------ Champion (max rank) stats
export function championStats(state) {
  const prog = ensureProg(state);
  const mc = masteryCounts(state);
  const gm = state.ghostMatches || [];
  return {
    lifetimeXp: prog.lifetimeXp,
    sessions: prog.stats.sessions,
    completed: mc.passed,
    mastered: mc.mastered,
    strong: mc.strong,
    perfect: prog.stats.perfect,
    firstClears: prog.stats.firstClears,
    pbs: prog.stats.pbs,
    ghostWins: gm.filter((m) => m.won).length,
    ghostMatches: gm.length,
    bestGhost: Math.max(0, ...gm.filter((m) => m.won && m.mode !== 'eight').map((m) => m.balls)),
    eightWins: gm.filter((m) => m.won && m.mode === 'eight').length,
    bossesBeaten: Object.values(state.bosses || {}).filter((b) => b.passed).length,
    trainingMs: prog.stats.trainingMs,
    drillRank: drillRankStatus(state).name
  };
}

// ------------------------------------------------------------------ sync (runs on every save via app derive())
export function syncProgression(state) {
  if (!state.prog) return state;
  const prog = ensureProg(state);
  const r = state.rankIndex || 0;
  let changed = false;
  // latch cleared gates (foundation passes never decrease, but content can be deleted)
  for (const g of GATES) {
    if (prog.gatesCleared[g.id] || g.rank > r) continue;
    const gs = gateStatus({ ...state, prog }, g, 99);
    if (gs.foundations.every((f) => f.met)) { prog.gatesCleared[g.id] = Date.now(); changed = true; }
  }
  // entering a new rank: its bucket starts with the carried overflow
  if (prog.rankSeen == null) { prog.rankSeen = r; changed = true; }
  if (r > prog.rankSeen) {
    for (let k = prog.rankSeen + 1; k <= r; k++) {
      if (prog.rankXpBy[k] == null && k < CHAMPION_INDEX) prog.rankXpBy[k] = Math.min(rankTotal(k), k === r ? prog.carry || 0 : 0);
    }
    prog.carry = 0;
    prog.events = [{ at: Date.now(), key: `promotion:${r}`, name: `Promoted to ${rankName(r)}`, life: 0, rank: 0, drill: 0, flags: ['PROMOTED'] }, ...prog.events].slice(0, 60);
    if (r >= CHAMPION_INDEX && !prog.championAt) prog.championAt = Date.now();
    prog.rankSeen = r;
    changed = true;
  }
  return changed ? { ...state, prog } : state;
}
export { PROGRESSION_VERSION };
