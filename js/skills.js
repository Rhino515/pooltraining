/**
 * Skill ratings derived from saved drill / ghost results.
 */
import { SKILL_NAMES } from './storage.js';
import { drills } from './drills.js';

export { SKILL_NAMES };

/** Recompute soft recommendations; persistent skills still updated on first pass via storage. */
export function weakestSkills(state, n = 3) {
  return Object.entries(state.skills || {})
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

export function strongestSkills(state, n = 3) {
  return Object.entries(state.skills || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

/** Map category → primary skill for recommendations */
const CATEGORY_SKILL = {
  'Shot Making': 'Shot Making',
  'Stop Shots': 'Cue-Ball Control',
  Follow: 'Cue-Ball Control',
  Draw: 'Cue-Ball Control',
  Stun: 'Cue-Ball Control',
  'Speed Control': 'Speed Control',
  'Cue-Ball Position': 'Position Play',
  'Cut Shots': 'Shot Making',
  'Rail Position': 'Position Play',
  'Pattern Play': 'Pattern Play',
  Banks: 'Banks',
  Kicks: 'Kicks',
  Safeties: 'Safeties',
  Runouts: 'Pattern Play'
};

export function recommendDrills(state, limit = 6) {
  const weak = weakestSkills(state, 3).map((w) => w.name);
  const scored = drills
    .filter((d) => !state.results[d.id]?.passed)
    .map((d) => {
      const skill = CATEGORY_SKILL[d.category] || 'Shot Making';
      const weakIdx = weak.indexOf(skill);
      const unlockPenalty = (d.prerequisites || []).every((p) => state.results[p]?.passed)
        ? 0
        : 50;
      return {
        drill: d,
        score: (weakIdx >= 0 ? weakIdx : 5) + d.difficulty * 0.1 + unlockPenalty
      };
    })
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.drill);
}

export function skillBarsHTML(state) {
  return SKILL_NAMES.map((n) => {
    const v = state.skills[n] ?? 30;
    return `<div class="skill"><span>${n}</span><div class="meter"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
  }).join('');
}

/** Optional refresh: nudge skills from recent pass rates (does not replace event-based XP bumps) */
export function deriveSkillHints(state) {
  const hints = {};
  for (const name of SKILL_NAMES) hints[name] = state.skills[name] ?? 30;
  return hints;
}
