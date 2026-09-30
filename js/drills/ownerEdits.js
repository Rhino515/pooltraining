/**
 * Local corrections for shipped PKF drills (v14-7).
 *
 * The built-in .pooliq files are baked into the static site, so a phone cannot rewrite them.
 * A save stores a full .pooliq document under the same drill id in poolIQDrillEditsV1.
 * On load the override replaces that built-in drill. Reset deletes the override and the
 * shipped drill comes back. Nothing is uploaded.
 *
 * Who can edit: DEV MODE must be unlocked on this device (js/dev/dev.js isUnlocked).
 * There is no proven owner account in the app, so the editor is not tied to an email.
 * The override still applies after DEV MODE locks again — otherwise a reload would hide the fix.
 */
import { dataWritten } from '../storage.js';
import { isUnlocked } from '../dev/dev.js';
import { PKF_DOCS } from '../content/pkfLibrary.js';
import { validatePooliq, serialize } from '../content/schema.js';
import { challengeFromPkfDoc } from '../content/pkfBuiltins.js';

export const DRILL_EDITS_KEY = 'poolIQDrillEditsV1';

/**
 * Exact owner gate for the drill editor UI and for writing or exporting overrides.
 * True only while DEV MODE is unlocked this session (passcode accepted, auto-lock not expired).
 * A signed-in friend, or anyone with DEV MODE locked, is false. The Edit control is not rendered then.
 */
export function drillEditorAllowed(now = Date.now()) {
  return isUnlocked(now);
}

const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);

let shippedById = null;
function shippedRaw(id) {
  if (!shippedById) {
    shippedById = new Map();
    for (const d of PKF_DOCS) if (d && d.id) shippedById.set(d.id, d);
  }
  return shippedById.get(id) || null;
}

export function emptyDrillEdits() { return { schema: 1, items: {} }; }

export function loadDrillEdits() {
  try {
    const o = JSON.parse(ls()?.getItem(DRILL_EDITS_KEY) || 'null');
    if (o && typeof o.items === 'object' && o.items) return { schema: 1, items: o.items };
  } catch { /* fall through */ }
  return emptyDrillEdits();
}

export function saveDrillEdits(o) {
  try {
    ls()?.setItem(DRILL_EDITS_KEY, JSON.stringify({ schema: 1, items: o.items || {} }));
    dataWritten(DRILL_EDITS_KEY);
  } catch { /* quota */ }
  return o;
}

export const getDrillEdit = (id) => loadDrillEdits().items[id] || null;

/** Validated shipped document, or null. Does not include a local override. */
export function shippedDoc(id) {
  const raw = shippedRaw(id);
  if (!raw) return null;
  const v = validatePooliq(JSON.stringify(raw));
  return v.ok ? v.doc : null;
}

/** Built-in PKF drill with a single-shot layout (not a custom drill, not a multi-lane drill). */
export function canFixDrill(ch) {
  if (!ch || ch.custom || ch.contentUid || ch.lanes || ch.laneOverlay) return false;
  if (!ch.cueBallPosition || !ch.id) return false;
  return !!shippedRaw(ch.id);
}

/** Document the editor starts from: the local override if there is one, otherwise the shipped file. */
export function editingDoc(id) {
  const edit = getDrillEdit(id);
  if (edit?.doc) return JSON.parse(JSON.stringify(edit.doc));
  const shipped = shippedDoc(id);
  return shipped ? JSON.parse(JSON.stringify(shipped)) : null;
}

export function setDrillEdit(id, doc, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  if (!shippedRaw(id)) return { error: 'That drill is not a built-in drill' };
  let copy;
  try { copy = JSON.parse(JSON.stringify(doc)); } catch { return { error: 'Nothing to save' }; }
  copy.id = id;
  copy.format = 'pooliq';
  copy.contentType = 'drill';
  const v = validatePooliq(JSON.stringify(copy));
  if (!v.ok) return { error: v.errors.slice(0, 4).join('\n') };
  if (v.doc.id !== id) return { error: 'The drill id cannot change' };
  const o = loadDrillEdits();
  o.items[id] = { id, doc: v.doc, updatedAt: now, createdAt: o.items[id]?.createdAt || now };
  saveDrillEdits(o);
  return { ok: true, doc: v.doc };
}

export function removeDrillEdit(id, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  const o = loadDrillEdits();
  if (!o.items[id]) return { ok: true, removed: false };
  delete o.items[id];
  saveDrillEdits(o);
  return { ok: true, removed: true };
}

/** Replace a built-in challenge with the local override of the same id, when one is stored. */
export function applyDrillEdit(ch) {
  const rec = ch && getDrillEdit(ch.id);
  if (!rec?.doc?.shot) return ch;
  try {
    const v = validatePooliq(JSON.stringify(rec.doc));
    if (!v.ok || v.doc.id !== ch.id) return ch;
    const next = challengeFromPkfDoc(v.doc);
    next.game = ch.game || 'drills';
    next.isDrill = true;
    next.drillEdit = true;
    return next;
  } catch {
    return ch;
  }
}

export function editCount() {
  return Object.keys(loadDrillEdits().items).length;
}

function fileSlug(doc) {
  const slug = String(doc?.id || doc?.title || 'drill').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'drill';
  return `${slug}.pooliq`;
}

/** One corrected drill as a .pooliq JSON document (the same shape as content/pkf). */
export function exportOneEdit(id, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  const rec = getDrillEdit(id);
  const doc = rec?.doc || null;
  if (!doc) return { error: 'Save a correction first — nothing to export yet' };
  const v = validatePooliq(JSON.stringify(doc));
  if (!v.ok) return { error: v.errors.slice(0, 3).join(' · ') };
  return { name: fileSlug(v.doc), text: serialize(v.doc), doc: v.doc };
}

/**
 * Every saved override in one JSON download. Each entry of `drills` is a full .pooliq drill
 * document (open one and save it as its own .pooliq file to send back). Not a training pack:
 * a pack cannot hold all 117 drills.
 */
export function exportAllEdits(now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  const recs = Object.values(loadDrillEdits().items);
  if (!recs.length) return { error: 'No corrected drills to export yet' };
  const drills = [];
  for (const rec of recs) {
    const v = validatePooliq(JSON.stringify(rec.doc));
    if (v.ok) drills.push(v.doc);
  }
  if (!drills.length) return { error: 'No corrected drills to export yet' };
  const payload = {
    format: 'pooliq-drill-edits',
    schemaVersion: '1.0',
    exportedAt: new Date(now).toISOString(),
    note: 'Each item in drills is one full .pooliq drill. Save each as its own .pooliq file to replace the shipped drill with that id. Nothing here was uploaded.',
    drills
  };
  const day = new Date(now).toISOString().slice(0, 10);
  return { name: `pool-iq-drill-edits-${day}.pooliq`, text: JSON.stringify(payload, null, 2), count: drills.length };
}
