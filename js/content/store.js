/**
 * My Content store — installed .pooliq content, in its own namespace (pure data layer, no DOM).
 *
 *   localStorage 'poolIQContentV1'         = { version: 1, items: [ { uid, id, contentType, title, contentVersion,
 *                                              source: 'imported' | 'custom', installedAt, updatedAt, edited, doc } ] }
 *   localStorage 'poolIQContentProgressV1' = { [uid]: { plays, best, stages: { [stageId]: {done, passed, best, tries} },
 *                                              results: [..last 20], lastPlayed } }
 *
 * Both keys are mirrored to IndexedDB, included in snapshots and the backup file (vault.js KEYS).
 * `doc` is always a VALIDATED, normalized .pooliq document — the file format is the storage format, so
 * exporting an installed item is lossless. Progress lives outside the doc (definitions stay portable).
 * Nothing here touches Career state (poolIQStateV4).
 */
import { dataWritten } from '../storage.js';
import { validatePooliq } from './schema.js';

export const CONTENT_KEY = 'poolIQContentV1';
export const PROGRESS_KEY = 'poolIQContentProgressV1';
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
const clone = (o) => JSON.parse(JSON.stringify(o));

export function loadContent() {
  try {
    const d = JSON.parse(ls()?.getItem(CONTENT_KEY) || 'null');
    return Array.isArray(d?.items) ? d.items.filter((it) => it && typeof it.uid === 'string' && it.doc && typeof it.doc === 'object') : [];
  } catch {
    return [];
  }
}
export function saveContent(items) {
  try {
    ls()?.setItem(CONTENT_KEY, JSON.stringify({ version: 1, items }));
    dataWritten(CONTENT_KEY);
    return true;
  } catch {
    return false;
  }
}
export function getItem(uid) {
  return loadContent().find((it) => it.uid === uid) || null;
}
export function findById(id) {
  return loadContent().filter((it) => it.id === id);
}
export function newUid(now = Date.now()) {
  return `c${now.toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;
}

/** Unique id for "keep both": id-2, id-3 … */
export function nextFreeId(id, items = loadContent()) {
  const taken = new Set(items.map((it) => it.id));
  if (!taken.has(id)) return id;
  const base = id.replace(/-\d+$/, '').slice(0, 60);
  for (let n = 2; n < 1000; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now().toString(36)}`.slice(0, 64);
}

/**
 * Install a validated doc.
 *   mode: undefined → returns {conflict: [existing…]} when the id is already installed (nothing written)
 *         'replace'  → overwrites the installed item(s) with that id (keeps their uid, so progress stays)
 *         'keepBoth' → installs as a copy with a new id (id-2) and "(copy)" title suffix
 *         'cancel'   → writes nothing
 */
export function installDoc(doc, { mode, source = 'imported', now = Date.now() } = {}) {
  if (mode === 'cancel') return { cancelled: true };
  const v = validatePooliq(clone(doc));
  if (!v.ok || v.legacy) return { error: v.errors?.join('\n') || 'Invalid content' };
  const d = v.doc;
  const items = loadContent();
  const same = items.filter((it) => it.id === d.id);
  if (same.length && !mode) return { conflict: same };
  let item;
  if (same.length && mode === 'replace') {
    const i = items.indexOf(same[0]);
    item = { ...same[0], id: d.id, contentType: d.contentType, title: d.title, contentVersion: d.contentVersion, source: same[0].source || source, updatedAt: now, edited: false, doc: d };
    items[i] = item;
    for (const extra of same.slice(1)) items.splice(items.indexOf(extra), 1);
  } else {
    if (same.length && mode === 'keepBoth') {
      d.id = nextFreeId(d.id, items);
      d.title = `${d.title} (copy)`.slice(0, 80);
    }
    item = { uid: newUid(now), id: d.id, contentType: d.contentType, title: d.title, contentVersion: d.contentVersion, source, installedAt: now, updatedAt: now, edited: false, doc: d };
    items.push(item);
  }
  saveContent(items);
  return { item };
}

/** Replace the doc of an installed item after editing (re-validated) */
export function updateItemDoc(uid, doc, now = Date.now()) {
  const v = validatePooliq(clone(doc));
  if (!v.ok || v.legacy) return { error: v.errors?.join('\n') || 'Invalid content' };
  const items = loadContent();
  const i = items.findIndex((it) => it.uid === uid);
  if (i < 0) return { error: 'That item is no longer installed.' };
  items[i] = { ...items[i], id: v.doc.id, contentType: v.doc.contentType, title: v.doc.title, contentVersion: v.doc.contentVersion, updatedAt: now, edited: true, doc: v.doc };
  saveContent(items);
  return { item: items[i] };
}

export function deleteItem(uid) {
  const items = loadContent();
  const next = items.filter((it) => it.uid !== uid);
  if (next.length === items.length) return false;
  saveContent(next);
  const p = loadProgress();
  if (p[uid]) {
    delete p[uid];
    saveProgress(p);
  }
  return true;
}

// ------------------------------------------------------------------ personal progress (never Career)
export function loadProgress() {
  try {
    const d = JSON.parse(ls()?.getItem(PROGRESS_KEY) || 'null');
    return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
  } catch {
    return {};
  }
}
export function saveProgress(p) {
  try {
    ls()?.setItem(PROGRESS_KEY, JSON.stringify(p));
    dataWritten(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}
export function progressFor(uid) {
  const p = loadProgress()[uid];
  return p && typeof p === 'object' ? p : { plays: 0, best: null, stages: {}, results: [] };
}
/**
 * Record a finished run. result: { stageId?, passed, score, summary }
 * Personal best = highest score. Returns { progress, newBest }.
 */
export function recordResult(uid, result, now = Date.now()) {
  const all = loadProgress();
  const p = all[uid] && typeof all[uid] === 'object' ? all[uid] : { plays: 0, best: null, stages: {}, results: [] };
  p.stages = p.stages || {};
  p.results = Array.isArray(p.results) ? p.results : [];
  p.plays = (p.plays || 0) + 1;
  p.lastPlayed = now;
  const score = Number(result.score) || 0;
  let newBest = false;
  if (result.stageId) {
    const s = p.stages[result.stageId] || { tries: 0, done: false, passed: false, best: null };
    s.tries += 1;
    s.done = true;
    s.passed = s.passed || !!result.passed;
    if (s.best == null || score > s.best) { newBest = s.best != null || score > 0; s.best = score; }
    p.stages[result.stageId] = s;
  } else {
    p.passed = p.passed || !!result.passed;
    if (p.best == null || score > p.best) { newBest = p.best != null || score > 0; p.best = score; }
  }
  if (result.summary && typeof result.summary === 'object') p.bestSummary = newBest || !p.bestSummary ? result.summary : p.bestSummary;
  p.results.unshift({ at: now, stageId: result.stageId || null, passed: !!result.passed, score });
  p.results = p.results.slice(0, 20);
  all[uid] = p;
  saveProgress(all);
  return { progress: p, newBest };
}

// ------------------------------------------------------------------ packs
/** Stage lock state: 'done' (passed), 'open', 'locked' */
export function packStageStates(doc, progress) {
  const st = progress?.stages || {};
  const passed = (id) => !!st[id]?.passed;
  const out = [];
  doc.stages.forEach((s, i) => {
    let open;
    if (s.requires?.length) open = s.requires.every(passed);
    else if ((doc.unlockMode || 'sequential') === 'open') open = true;
    else open = i === 0 || passed(doc.stages[i - 1].id);
    out.push(passed(s.id) ? 'done' : open ? 'open' : 'locked');
  });
  return out;
}
export function packPercent(doc, progress) {
  const states = packStageStates(doc, progress);
  return states.length ? Math.round((100 * states.filter((s) => s === 'done').length) / states.length) : 0;
}
