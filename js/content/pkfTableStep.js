/**
 * PKF table steps (shared by every PKF course): SKIP TABLE STEP and Drill XP for recorded table work.
 *
 * Rules (Andrew):
 *  - Knowledge work (questions, LOCK ANSWER, learn pages, exam knowledge items) never earns Drill XP.
 *  - A skipped table step earns 0 Drill XP, never counts as a make / success / execution score,
 *    and never blocks progress (it counts as moving through the lesson).
 *  - A table step the player performs and records earns Drill XP through the app's existing per-drill
 *    session formula (progression/award.js applyAward): one recorded step = one drill session of the
 *    app's default drill difficulty (3 → Intermediate tier, base 60 XP, the same default an unrated drill
 *    gets; most built-in PKF library drills are difficulty 3 too). Curve, PERFECT, FIRST CLEAR, PB,
 *    mastered-repeat and same-day rules apply exactly as for a drill. A failed step earns what a failed
 *    drill session earns (0). No Career Rank XP, no Lifetime XP.
 *  - The per-step mastery record is kept inside the course's own state object (`tableXp`), not in
 *    state.prog.items, so PKF steps never change Drill Rank star counts, Career promotion mastery,
 *    skill levels or recommended training. Only state.prog.drillXp (and its event log) moves.
 */
import { applyAward, ensureProg, emptyProg } from '../progression/award.js';
import { PROGRESSION_VERSION, tierOfDifficulty } from '../progression/config.js';

export const SKIP_LABEL = 'SKIP TABLE STEP';
export const SKIP_NOTE = 'Just learning? Skip it and keep moving. 0 Drill XP; it goes to your practice list so you can come back later.';
/** Drill difficulty the app uses when a drill has none (catalog tierOfDifficulty default). */
export const TABLE_STEP_DIFFICULTY = 3;

export function tableStepItem(storageKey, courseTitle, lesson) {
  const id = lesson?.id || '?';
  return {
    key: `pkf:${storageKey}:${id}`,
    source: 'drill',
    name: `${courseTitle} · ${lesson?.title || id}`,
    short: lesson?.title || id,
    tier: tierOfDifficulty(TABLE_STEP_DIFFICULTY),
    difficulty: TABLE_STEP_DIFFICULTY,
    weights: { shotMaking: 1 },
    mode: 'binary',
    rankXpEligible: false,
    drillRank: true,
    category: null
  };
}

/**
 * Drill XP for one recorded table step.
 * act: { ratio 0–1 (successful attempts / attempts), passed (objective achieved / self-evaluation completed), at? }
 * prevRec: this step's previous record from the course's `tableXp` map.
 * Returns { prog, rec, drill, flags } — the caller stores rec in its course state and sets state.prog = prog.
 */
export function tableStepXp(state, { storageKey, courseTitle, lesson, prevRec = null, ratio, passed, at = Date.now() }) {
  const item = tableStepItem(storageKey, courseTitle, lesson);
  const sandbox = { rankIndex: state?.rankIndex || 0, prog: { ...emptyProg(), v: PROGRESSION_VERSION, items: prevRec ? { [item.key]: prevRec } : {} } };
  const out = applyAward(sandbox, { item, ratio, passed: !!passed, at });
  const drill = Math.max(0, out.award.drill || 0);
  const prog = ensureProg(state || {});
  if (!state?.prog) prog.v = PROGRESSION_VERSION;
  prog.drillXp = (prog.drillXp || 0) + drill;
  if (drill > 0) prog.events = [{ at, key: item.key, name: item.name, life: 0, rank: 0, drill, flags: out.award.flags }, ...prog.events].slice(0, 60);
  return { prog, rec: out.state.prog.items[item.key], drill, flags: out.award.flags };
}

/**
 * Award a recorded step and write everything back. `state` already contains the updated course at storageKey.
 * Adds course.tableXp[lessonId] and course.stats.tableDrillXp. Returns { state, drill }.
 */
export function awardRecordedStep(state, storageKey, courseTitle, lesson, act) {
  const course = state?.[storageKey];
  if (!course || !lesson) return { state, drill: 0 };
  const tableXp = { ...(course.tableXp && typeof course.tableXp === 'object' ? course.tableXp : {}) };
  const r = tableStepXp(state, { storageKey, courseTitle, lesson, prevRec: tableXp[lesson.id] || null, ...act });
  tableXp[lesson.id] = r.rec;
  course.tableXp = tableXp;
  course.stats = { ...(course.stats || {}), tableDrillXp: (course.stats?.tableDrillXp || 0) + r.drill };
  return { state: { ...state, [storageKey]: course, prog: r.prog }, drill: r.drill };
}

/** SKIP button (shared markup; the action name is per course). */
export function skipButtonHTML(action) {
  return `<div class="pkfSkip" data-pkf-skip="1"><button type="button" class="bigBtn alt pkfSkipBtn" data-action="${action}">${SKIP_LABEL}</button><p class="muted small">${SKIP_NOTE}</p></div>`;
}

/** Shown after a skip. */
export function skippedVerdictHTML() {
  return '<p class="muted pkfVerdict" data-pkf-skipped="1"><b>TABLE STEP SKIPPED</b> · not attempted, 0 Drill XP. Saved to your practice list for later.</p>';
}

/** "+N Drill XP" line after a recorded step (nothing in Dev preview). */
export function xpLineHTML(it) {
  if (!it || it.xp == null) return '';
  return `<p class="muted small" data-pkf-xp="${Number(it.xp) || 0}">${Number(it.xp) > 0 ? `+${Number(it.xp)} Drill XP` : '0 Drill XP (objective not achieved)'}</p>`;
}

/** Persistent "skipped, come back later" map helpers: { [lessonId]: count }. */
export function markSkipped(map, id) {
  const m = { ...(map && typeof map === 'object' ? map : {}) };
  m[id] = (m[id] || 0) + 1;
  return m;
}
export function clearSkipped(map, id) {
  const m = { ...(map && typeof map === 'object' ? map : {}) };
  delete m[id];
  return m;
}
