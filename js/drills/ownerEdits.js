/**
 * Local phone copies for shipped PKF drills, plus the gate for the editor.
 *
 * What everyone plays is NOT this phone key. SAVE publishes to Supabase
 * (js/drills/published.js). applyDrillEdit uses that published row when one
 * exists, otherwise the shipped file. poolIQDrillEditsV1 is only a phone copy
 * (export / older tests). It does not replace the live drill.
 *
 * Who can open the editor: the signed-in owner account (js/dev/dev.js isUnlocked).
 * There is no passcode. Who can publish: that same account, enforced again by row-level security.
 */
import { dataWritten } from '../storage.js';
import { isUnlocked } from '../dev/dev.js';
import { PKF_DOCS } from '../content/pkfLibrary.js';
import { buDocs } from '../content/buExam.js';
import { validatePooliq, serialize, MAX_FILE_BYTES } from '../content/schema.js';
import { challengeFromPkfDoc } from '../content/pkfBuiltins.js';
import { publishedDoc } from './published.js';

export const DRILL_EDITS_KEY = 'poolIQDrillEditsV1';

/**
 * Exact owner gate for the drill editor UI and for writing or exporting overrides.
 * True only while the owner account is signed in. A passcode does not open it.
 * A signed-in friend, or anyone signed out, is false. The Edit control is not rendered then.
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
    for (const d of buDocs()) if (d && d.id) shippedById.set(d.id, d);
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
/** http(s) only. Empty, javascript:, or a link with a password is rejected. Nothing is uploaded. */
export function drillLink(value) {
  const v = String(value || '').trim();
  if (!v || v.length > 500) return '';
  let u;
  try { u = new URL(v); } catch { return ''; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
  if (u.username || u.password) return '';
  return v;
}

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


const NOT_A_DRILL = 'That file is not a drill this app understands.';

/**
 * Read a file back onto the drill that is open. Does not write storage.
 * Accepts the .pooliq document EXPORT THIS writes, the same object as JSON,
 * or a wrapper whose `drills` array has exactly one drill — or several, if
 * one of them has this drill's id. Anything else is an error and no document.
 * The returned doc keeps currentId so Save still stores this drill.
 */
export function drillFromImport(input, currentId) {
  let raw = input;
  if (typeof input === 'string') {
    const t = input.replace(/^\uFEFF/, '').trim();
    if (!t || t.length > MAX_FILE_BYTES) return { error: NOT_A_DRILL };
    try { raw = JSON.parse(t); } catch { return { error: NOT_A_DRILL }; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: NOT_A_DRILL };

  let candidate = null;
  if (Array.isArray(raw.drills)) {
    const list = raw.drills.filter((d) => d && typeof d === 'object' && !Array.isArray(d));
    if (list.length === 1) candidate = list[0];
    else if (list.length > 1) {
      const id = String(currentId || '');
      const hits = list.filter((d) => d.id === id);
      if (hits.length !== 1) return { error: 'That file has more than one drill, and none is this drill.' };
      candidate = hits[0];
    } else return { error: NOT_A_DRILL };
  } else candidate = raw;

  if (candidate.contentType && candidate.contentType !== 'drill') return { error: NOT_A_DRILL };
  const rejected = (v) => {
    const lines = v && Array.isArray(v.errors) ? v.errors.filter(Boolean).slice(0, 4) : [];
    return { error: lines.length ? lines.join('\n') : NOT_A_DRILL };
  };
  let v;
  try { v = validatePooliq(JSON.stringify(candidate)); } catch { return { error: NOT_A_DRILL }; }
  if (!v.ok || !v.doc || v.doc.contentType !== 'drill') return rejected(v);
  let doc = v.doc;
  const id = String(currentId || '');
  if (id && doc.id !== id) {
    const swapped = JSON.parse(JSON.stringify(doc));
    swapped.id = id;
    try { v = validatePooliq(JSON.stringify(swapped)); } catch { return { error: NOT_A_DRILL }; }
    if (!v.ok || !v.doc || v.doc.contentType !== 'drill' || v.doc.id !== id) return rejected(v);
    doc = v.doc;
  }
  return { doc: JSON.parse(JSON.stringify(doc)) };
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

/** Replace a built-in challenge with the published override of the same id, when one is loaded. */
export function applyDrillEdit(ch) {
  const doc = ch && publishedDoc(ch.id);
  if (!doc?.shot) return ch;
  try {
    const v = validatePooliq(JSON.stringify(doc));
    if (!v.ok || v.doc.id !== ch.id) return ch;
    const next = challengeFromPkfDoc(v.doc);
    next.game = ch.game || 'drills';
    next.isDrill = true;
    next.drillEdit = true;
    if (String(next.id || '').startsWith('bu-f')) {
      delete next.level;
      next.xp = 0;
      next.buExam = true;
      next.pq = { ...(next.pq || {}), rankXpEligible: false };
    }
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
