/**
 * v11 progression migration — computes Lifetime XP, Rank XP, mastery and skill records from EXISTING history
 * (Arcade stage histories, drill histories, Ghost matches, Boss Battles) on first load. Idempotent + versioned
 * (state.prog.v = PROGRESSION_VERSION); app.js snapshots the data via the vault first.
 * Never demotes: the named Career rank is untouched; this rank's ball level comes from the replayed Rank XP
 * beyond the totals of the ranks below it (0 → 1-ball). Stage history keeps the last 20 sessions per stage;
 * older sessions beyond that are not in the save, so a passed stage without a surviving passing session is
 * credited once from its best stars (documented in docs/RANKING_AND_XP.md).
 */
import { PROGRESSION_VERSION, RANK_LADDER } from './config.js';
import { applyAward, recordOnly, emptyProg, rankTotal, CHAMPION_INDEX } from './award.js';
import { awardGhost, shotRatio } from './sessions.js';
import { arcadeItem, drillItem, bossItem, bossShotItem } from './catalog.js';
import { GAMES, getStage, getBosses } from '../games/registry.js';
import { evaluateSession, evaluateBoss } from '../games/engine.js';
import { getDrillById } from '../drills.js';
import { performanceOf } from './award.js';

export const needsMigration = (state) => !state.prog || !(state.prog.v >= PROGRESSION_VERSION);
const STARS_RATIO = [0, 0.6, 0.75, 0.9];

function stageActs(gameId, stageId, rec, itemOf, stageOf) {
  const acts = [];
  const item = itemOf();
  if (!item) return acts;
  let stage = null;
  try { stage = stageOf(); } catch { stage = null; }
  let sawPass = false;
  for (const h of rec.history || []) {
    const at = Date.parse(h.date) || 0;
    let ratio = STARS_RATIO[h.stars || 0] || (h.passed ? 0.6 : 0.3);
    if (stage && Array.isArray(h.attempts) && h.attempts.length) {
      try {
        const ev = evaluateSession({ id: 'mig', gameId, stageId, attempts: h.attempts, endless: false }, stage);
        ratio = performanceOf(ev, h.attempts, stage);
      } catch { /* keep the stars estimate */ }
    }
    if (h.passed) sawPass = true;
    acts.push({ item, ratio, passed: !!h.passed, score: h.score, at });
  }
  if (rec.passed && !sawPass) acts.push({ item, ratio: STARS_RATIO[rec.bestStars || 1] || 0.6, passed: true, score: rec.bestScore, at: Date.parse(rec.firstPassDate || rec.lastDate || '') || 1 });
  return acts;
}

export function migrateProgression(state) {
  if (!needsMigration(state)) return state;
  const legacyXp = Number(state.xp) || 0;
  let st = { ...state, prog: { ...emptyProg(), v: 0 } };
  const acts = [];
  for (const g of GAMES) {
    if (g.special) continue;
    for (const [sid, rec] of Object.entries(state.games?.[g.id]?.stages || {})) acts.push(...stageActs(g.id, sid, rec, () => arcadeItem(g.id, sid), () => getStage(g.id, sid)));
  }
  for (const [id, rec] of Object.entries(state.games?.drills?.stages || {})) {
    const d = getDrillById(id);
    if (d) acts.push(...stageActs('drills', id, rec, () => drillItem(d), () => d));
  }
  for (const m of state.ghostMatches || []) acts.push({ ghost: m, at: Date.parse(m.date) || 0 });
  for (const b of getBosses()) {
    for (const h of state.bosses?.[b.id]?.history || []) acts.push({ boss: b, h, at: Date.parse(h.date) || 0 });
    const rec = state.bosses?.[b.id];
    if (rec?.passed && !(rec.history || []).some((h) => h.passed)) acts.push({ boss: b, h: { passed: true, shots: b.shots.map((s) => ({ passed: true, made: s.need, stars: s.need, attempts: [] })) }, at: Date.parse(rec.lastDate || '') || 1 });
  }
  acts.sort((a, b) => a.at - b.at);
  for (const a of acts) {
    if (a.ghost) st = awardGhost(st, a.ghost, a.at || 1, { migrating: true }).state;
    else if (a.boss) {
      const shots = a.h.shots || [];
      a.boss.shots.forEach((s, i) => {
        const hs = shots[i];
        if (!hs) return;
        const n = Math.max(1, s.attempts);
        const ratio = s.mode === 'zone' ? (hs.attempts?.length ? shotRatio({ shot: s, attempts: hs.attempts, made: hs.made }) : Math.min(1, (hs.stars || 0) / (3 * n))) : Math.min(1, (hs.made || 0) / n);
        st = recordOnly(st, { item: bossShotItem(a.boss, s, i), ratio, passed: !!hs.passed, at: a.at });
      });
      const passedCount = shots.filter((x) => x.passed).length;
      st = applyAward(st, { item: bossItem(a.boss), ratio: passedCount / Math.max(1, a.boss.shots.length), passed: !!a.h.passed, at: a.at || 1 }, { migrating: true }).state;
    } else st = applyAward(st, a, { migrating: true }).state;
  }
  // place Rank XP: ranks below the current one are complete; the current rank gets what is left (never demotes)
  const prog = st.prog;
  const r = Math.max(0, Math.min(CHAMPION_INDEX, state.rankIndex || 0));
  let left = prog.rankXpTotal;
  prog.rankXpBy = {};
  for (let k = 0; k < r; k++) { prog.rankXpBy[k] = rankTotal(k); left -= rankTotal(k); }
  if (r < CHAMPION_INDEX) prog.rankXpBy[r] = Math.max(0, Math.min(rankTotal(r), left));
  prog.carry = 0;
  prog.rankSeen = r;
  prog.legacyXp = legacyXp;
  prog.lifetimeXp = Math.max(prog.lifetimeXp, legacyXp); // Lifetime XP never shrinks below the pre-v11 XP total
  prog.v = PROGRESSION_VERSION;
  prog.migratedAt = Date.now();
  prog.migration = { acts: acts.length, from: 'v10', ranks: RANK_LADDER.names.length };
  prog.events = [{ at: Date.now(), key: 'migration', name: `Progress imported from ${acts.length} saved sessions`, life: 0, rank: 0, drill: 0, flags: ['MIGRATED'] }];
  if (r >= CHAMPION_INDEX) prog.championAt = prog.championAt || Date.now();
  return { ...st, prog };
}
