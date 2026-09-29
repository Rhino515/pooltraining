/**
 * DEV MODE content overrides: a LOCAL layer keyed by content id (e.g. "stage:landing:ls-1") that replaces the
 * layout / text / scoring of a built-in item when the stage is built. The built-in source files are never
 * touched; removing the override (RESET TO ORIGINAL) brings the original back. Stored in poolIQDevOverridesV1
 * (mirrored to IndexedDB, snapshots and backups via vault.js).
 */
import { dataWritten } from '../storage.js';
import { itemChallenge } from '../content/convert.js';
import { SHOT_KINDS, SCORING_MODES } from '../content/schema.js';

export const OVERRIDES_KEY = 'poolIQDevOverridesV1';
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
export const stageOverrideId = (gameId, stageId) => `stage:${gameId}:${stageId}`;
export function parseOverrideId(id) {
  const m = /^stage:([a-z0-9_-]+):([A-Za-z0-9._-]+)$/.exec(String(id || ''));
  return m ? { kind: 'stage', gameId: m[1], stageId: m[2] } : null;
}
export function emptyOverrides() { return { schema: 1, items: {} }; }
export function loadOverrides() {
  try {
    const o = JSON.parse(ls()?.getItem(OVERRIDES_KEY) || 'null');
    if (o && typeof o.items === 'object' && o.items) return { schema: 1, items: o.items };
  } catch { /* fall through */ }
  return emptyOverrides();
}
export function saveOverrides(o) {
  try { ls()?.setItem(OVERRIDES_KEY, JSON.stringify({ schema: 1, items: o.items || {} })); dataWritten(OVERRIDES_KEY); } catch { /* quota */ }
  return o;
}
export const getOverride = (id) => loadOverrides().items[id] || null;
export function setOverride(id, doc, now = Date.now()) {
  if (!parseOverrideId(id)) return { error: 'Unknown content id' };
  if (!doc || !doc.shot) return { error: 'Nothing to save' };
  const o = loadOverrides();
  o.items[id] = { id, doc, updatedAt: now, createdAt: o.items[id]?.createdAt || now };
  saveOverrides(o);
  return { ok: true, title: doc.title, rec: o.items[id] };
}
export function removeOverride(id) {
  const o = loadOverrides();
  if (!o.items[id]) return false;
  delete o.items[id];
  saveOverrides(o);
  return true;
}

/** Only single-shot built-in stages can be edited with the drill builder */
export function isEditableSpec(spec, kind) {
  const k = spec?.kind || kind;
  return !!spec && !['calibration', 'ladder', 'train'].includes(spec.kind) && SHOT_KINDS.includes(k);
}

/** Apply an override doc to a freshly built challenge (registry.getStages) — returns a new challenge */
export function applyOverride(ch, rec) {
  if (!rec?.doc?.shot) return ch;
  let oc;
  try { oc = itemChallenge(rec.doc, ch.id, { title: rec.doc.title, scoringRules: rec.doc.scoringRules }); } catch { return ch; }
  const origMode = ch.scoringRules?.mode;
  // game-specific scoring modes (lives, kick, sniper…) are kept; schema modes may be re-tuned in the builder
  const keepScoring = !SCORING_MODES.includes(origMode) || !rec.doc.scoringRules;
  return {
    ...oc,
    id: ch.id,
    game: ch.game,
    level: ch.level,
    category: ch.category,
    difficulty: ch.difficulty,
    skillEffects: ch.skillEffects,
    xp: ch.xp,
    kind: oc.kind || ch.kind,
    scoringRules: keepScoring ? ch.scoringRules : oc.scoringRules,
    attemptCount: keepScoring ? ch.attemptCount : oc.attemptCount,
    passingRequirement: keepScoring ? ch.passingRequirement : oc.passingRequirement,
    prerequisites: ch.prerequisites,
    unlocks: ch.unlocks,
    imported: false,
    devOverride: true
  };
}
