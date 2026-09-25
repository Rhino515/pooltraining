/**
 * Skill ratings (0–100) computed from saved results only:
 * Arcade stage records (passed, stars, success rate), drill records, Ghost matches and Boss Battle shots,
 * each weighted by the stage's difficulty × the stage's weight for that skill × a recency factor.
 * A rating of 100 means every piece of content that trains the skill has been mastered recently.
 */
import { SKILL_NAMES } from './storage.js';
import { drills, customDrills } from './drills.js';
import { GAMES, stageSpecs, BOSSES } from './games/registry.js';
import { isGameUnlocked, nextOpenStage, gameLevel } from './games/engine.js';

export { SKILL_NAMES };

const DAY = 86400000;
function recency(dateStr, now) {
  if (!dateStr) return 0.85;
  const age = (now - new Date(dateStr).getTime()) / DAY;
  if (!(age > 30)) return 1;
  return Math.max(0.7, 1 - ((age - 30) / 150) * 0.3);
}
const diffW = (d) => 0.5 + (d || 3) / 10;

function normEffects(eff = {}) {
  const max = Math.max(1, ...Object.values(eff).map((v) => Math.abs(v)));
  const out = {};
  for (const [k, v] of Object.entries(eff)) if (SKILL_NAMES.includes(k)) out[k] = Math.abs(v) / max;
  return out;
}

function perfFromRecord(r) {
  if (!r) return 0;
  if (r.passed) return 0.6 + 0.4 * Math.min(1, (r.bestStars || 1) / 3);
  return Math.min(0.45, (r.successRate || 0) * 0.5);
}

export function computeSkillRatings(state, now = Date.now()) {
  const W = Object.fromEntries(SKILL_NAMES.map((n) => [n, 0]));
  const E = Object.fromEntries(SKILL_NAMES.map((n) => [n, 0]));
  const add = (eff, d, perf, rec = 1) => {
    for (const [k, w] of Object.entries(normEffects(eff))) {
      W[k] += w * diffW(d);
      E[k] += w * diffW(d) * perf * rec;
    }
  };
  for (const g of GAMES) {
    if (g.special === 'ghost') continue;
    const gs = state.games?.[g.id]?.stages || {};
    for (const spec of stageSpecs(g.id)) {
      const r = gs[spec.id];
      add(spec.skillEffects || g.skillEffects, spec.difficulty, perfFromRecord(r), recency(r?.lastDate, now));
    }
  }
  // Ghost: one entry per ball count
  const ghostEff = { 'Pattern Play': 1, 'Shot Making': 0.6, 'Position Play': 0.5 };
  for (let n = 3; n <= 9; n++) {
    const ms = (state.ghostMatches || []).filter((m) => m.mode !== 'eight' && m.balls === n);
    const won = ms.filter((m) => m.won);
    const last = ms.length ? ms[ms.length - 1].date : null;
    const perf = won.some((m) => (m.race || 5) >= 3) ? Math.min(1, 0.7 + 0.1 * won.length) : ms.length ? 0.3 * (won.length / ms.length) : 0;
    add(ghostEff, 2 + (n - 3) * 1.3, perf, recency(last, now));
  }
  // 8-Ball Ghost counts once played (never lowers a rating)
  const eightMs = (state.ghostMatches || []).filter((m) => m.mode === 'eight');
  if (eightMs.length) {
    const won8 = eightMs.filter((m) => m.won);
    const top = Math.max(...eightMs.map((m) => (m.level === 'pro' ? 9 : (m.group || 3) + 1)));
    const perf = won8.length ? Math.min(1, 0.6 + 0.1 * won8.length) : 0.3 * (won8.length / eightMs.length);
    add({ 'Pattern Play': 1, 'Shot Making': 0.6, 'Position Play': 0.6 }, 2 + (top - 3) * 1.1, perf, recency(eightMs[eightMs.length - 1].date, now));
  }
  // Boss battles: each shot trains its skill
  for (const b of BOSSES) {
    const rec = state.bosses?.[b.id];
    const lastShots = rec?.history?.[rec.history.length - 1]?.shots || [];
    b.shots.forEach((s, i) => {
      const passedShot = rec?.passed || lastShots[i]?.passed;
      add({ [s.skill]: 1 }, b.rank + 1, passedShot ? 1 : 0, recency(rec?.lastDate, now));
    });
  }
  // Drills (library may be empty)
  const ds = state.games?.drills?.stages || {};
  for (const d of drills) add(d.skillEffects || {}, d.difficulty, perfFromRecord(ds[d.id]), recency(ds[d.id]?.lastDate, now));
  // Custom drills count once they have been played (an unplayed custom drill never lowers a rating)
  for (const d of customDrills()) if (ds[d.id]) add(d.skillEffects || {}, d.difficulty, perfFromRecord(ds[d.id]), recency(ds[d.id]?.lastDate, now));
  const out = {};
  for (const n of SKILL_NAMES) out[n] = W[n] ? Math.round(100 * Math.pow(Math.min(1, E[n] / W[n]), 0.7)) : 0;
  return out;
}

export function withSkills(state) {
  return { ...state, skills: computeSkillRatings(state) };
}

export function weakestSkills(state, n = 3) {
  return Object.entries(state.skills || {})
    .filter(([k]) => SKILL_NAMES.includes(k))
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

export function strongestSkills(state, n = 3) {
  return Object.entries(state.skills || {})
    .filter(([k]) => SKILL_NAMES.includes(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

/** Best place to train a skill: the unlocked game weighted most for it, at its next open stage. */
export function recommendForSkill(state, skill) {
  const all = GAMES.filter((g) => !g.special && (g.skillEffects?.[skill] || 0) > 0)
    .map((g) => ({ g, w: g.skillEffects[skill] + (g.primarySkill === skill ? 0.5 : 0), unlocked: isGameUnlocked(state, g.id), st: nextOpenStage(state, g.id) }))
    .sort((a, b) => b.w - a.w);
  const top = all[0];
  // The game that trains this skill best is still locked: point at its unlock path
  if (top && !top.unlocked && top.g.unlock?.game && top.g.primarySkill === skill) {
    const u = top.g.unlock;
    const ug = GAMES.find((g) => g.id === u.game);
    const ust = nextOpenStage(state, u.game);
    if (ug && ust) {
      const lvl = gameLevel(state, u.game) + 1;
      return { game: u.game, stage: ust.id, level: lvl, unlocks: top.g.id, text: `${ug.name} Level ${lvl} — ${ust.name} (unlocks ${top.g.name})`, href: `#play/${u.game}/${ust.id}` };
    }
  }
  const c = all.find((x) => x.unlocked && x.st);
  if (!c) {
    if (['Pattern Play', 'Shot Making'].includes(skill)) return { game: 'ghost', text: 'Ghost matches', href: '#ghost' };
    return null;
  }
  const lvl = gameLevel(state, c.g.id) + 1;
  return { game: c.g.id, stage: c.st.id, level: lvl, text: `${c.g.name} Level ${lvl} — ${c.st.name}`, href: `#play/${c.g.id}/${c.st.id}` };
}

export function recommendations(state, n = 3) {
  return weakestSkills(state, n).map((w) => ({ ...w, rec: recommendForSkill(state, w.name) }));
}

export function skillBarsHTML(state) {
  return SKILL_NAMES.map((n) => {
    const v = state.skills?.[n] ?? 0;
    return `<div class="skill" data-skill="${n}"><span>${n}</span><div class="meter"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
  }).join('');
}
