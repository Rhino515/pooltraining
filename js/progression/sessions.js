/**
 * Session → award adapters used by the game engine (Table Games stages, drills, bosses) and Ghost matches.
 * Every finished, recorded session goes through applyAward once. Content Play Test / preview never reaches here.
 */
import { getGame, BOSSES } from '../games/registry.js';
import { XP, GAME_SKILLS } from './config.js';
import { applyAward, recordOnly, performanceOf, ghostPerformance } from './award.js';
import { arcadeItem, drillItem, bossItem, bossShotItem, ghostItem, ghost8Item, stageItem, normalizeWeights } from './catalog.js';

export function itemForSession(session, stage) {
  const gid = session.gameId;
  if (session.endless) {
    const g = getGame(gid);
    return { key: `arcade:${gid}:endless`, source: 'arcade', name: `${g?.name || gid} · Endless`, short: 'Endless', tier: 'advanced', weights: normalizeWeights(GAME_SKILLS[gid] || {}), mode: 'lives', rankXpEligible: false, drillRank: false, href: `#play/${gid}/endless` };
  }
  if (gid === 'drills') return stage ? drillItem(stage) : null;
  const spec = getGame(gid)?.stages?.find((s) => s.id === session.stageId);
  return arcadeItem(gid, session.stageId) || (spec ? stageItem(gid, spec) : null);
}

export function awardSession(state, session, stage, ev, now = Date.now()) {
  let item = itemForSession(session, stage);
  if (!item) return { state, award: null };
  if (stage?.category === 'Ball Pocketing') item = { ...item, rankXpEligible: false };
  let ratio;
  let passed = !!ev.passed;
  if (session.endless) { ratio = Math.min(1, (ev.made || 0) / 10); passed = false; }
  else ratio = performanceOf(ev, session.attempts, stage);
  const started = Date.parse(session.startedAt || '') || now;
  return applyAward(state, { item, ratio, passed, score: ev.score, at: now, durationMs: now - started, medal: ev?.ballPocketMedal });
}

export function shotRatio(s) {
  const n = Math.max(1, s.shot.attempts);
  if (s.shot.mode === 'zone') return Math.min(1, s.attempts.reduce((a, x) => a + (x.pocketed ? 0.4 + 0.2 * (x.stars || 0) : 0), 0) / n);
  return Math.min(1, s.made / n);
}
export function awardBoss(state, session, ev, now = Date.now()) {
  const boss = BOSSES.find((b) => b.id === session.bossId);
  if (!boss) return { state, award: null };
  let st = state;
  ev.shots.forEach((s, i) => { st = recordOnly(st, { item: bossShotItem(boss, boss.shots[i], i), ratio: shotRatio(s), passed: s.passed, at: now }); });
  const started = Date.parse(session.startedAt || '') || now;
  return applyAward(st, { item: bossItem(boss), ratio: ev.passedCount / Math.max(1, ev.shots.length), passed: ev.passed, score: ev.score, at: now, durationMs: now - started });
}

/** Career Rank XP for a ghost match. career.js registers the real rule. Until then, ghost play banks none. */
let ghostCareerXp = () => false;
export function setGhostCareerXpGate(fn) {
  if (typeof fn === 'function') ghostCareerXp = fn;
}

export function ghostMatchItem(m, state = null) {
  const it = m.mode === 'eight' ? ghost8Item(m.level, m.group) : ghostItem(m.balls);
  const rf = XP.ghost.raceFactor;
  const f = Math.max(rf.min, Math.min(rf.max, (m.race || 5) / rf.per));
  // Drill Rank stays off (drillRank: false). Career Rank XP only when the gate says this match is the task he is on.
  const rankXpEligible = !!(state && ghostCareerXp(state, m));
  return { ...it, baseXP: Math.round(XP.base[it.tier] * f), rankXpEligible, drillRank: false };
}
export function awardGhost(state, m, now = Date.parse(m.date || '') || Date.now(), opts = {}) {
  return applyAward(state, { item: ghostMatchItem(m, state), ratio: ghostPerformance(m), passed: !!m.won, score: m.you, at: now }, opts);
}
