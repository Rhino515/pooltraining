/**
 * v14-116: one-time +XP.courseCompleteBonus for finishing a Drill Sets & Exams set or exam
 * (every BU EXAMS and OTHER DRILL SETS & EXAMS row; PKF lives in Learn and is not included).
 * "Finished" is the same test that shows the set's completion emblem: row.finished from readSetProgress.
 *
 * Runs inside app.js commit() and compares the state before and after the save:
 *   - a set that becomes finished in this save, and has no flag yet → bonus (Lifetime, Career Rank, Drill XP) + flag
 *   - a set that was already finished before this save (finished before this feature, or restored from an
 *     older backup) → flag only, no XP, so nobody gets a surprise retroactive award
 * Flags live in prog.courseBonus, so re-finishing, retakes and replays never pay again.
 */
import { readDrillSetProgress } from '../content/setProgress.js';
import { applyCourseBonus, ensureProg } from './award.js';
import { XP } from './config.js';

export const courseBonusXp = () => XP.courseCompleteBonus;

/** Finished Drill Sets & Exams rows by id (non-PKF). */
export function finishedSets(state) {
  const out = new Map();
  if (!state) return out;
  for (const row of readDrillSetProgress(state)) if (row.finished) out.set(row.id, row);
  return out;
}

export const courseBonusOf = (state, id) => (state?.prog?.courseBonus || {})[id] || null;

/** Returns { state, awarded: [{ id, name, xp }] }. Pure: no storage, no UI. */
export function withCourseBonus(before, next, now = Date.now()) {
  // no prog yet = a fresh or reset save (derive() creates it); nothing to pay or flag
  if (!before || !next || !next.prog) return { state: next, awarded: [] };
  const done0 = finishedSets(before);
  const done1 = finishedSets(next);
  const flags = next.prog?.courseBonus || {};
  const seed = {};
  for (const id of new Set([...done0.keys(), ...done1.keys()])) if (!flags[id] && done0.has(id)) seed[id] = { at: now, xp: 0, seen: 1 };
  let state = next;
  if (Object.keys(seed).length) {
    const prog = ensureProg(state);
    prog.courseBonus = { ...(prog.courseBonus || {}), ...seed };
    state = { ...state, prog };
  }
  const awarded = [];
  for (const [id, row] of done1) {
    if (flags[id] || seed[id]) continue;
    const r = applyCourseBonus(state, { id, name: row.name, at: now });
    if (!r.award) continue;
    state = r.state;
    awarded.push({ id, name: row.name, xp: r.award.lifetime });
  }
  return { state, awarded };
}
