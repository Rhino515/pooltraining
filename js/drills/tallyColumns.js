/**
 * Extra make/miss columns for a drill. Dev Mode only (same gate as the drill editor).
 * Stored on this phone with the other local editor data. Not part of the cloud save.
 */
import { dataWritten } from '../storage.js';
import { drillEditorAllowed } from './ownerEdits.js';

export const TALLY_COLUMNS_KEY = 'poolIQTallyColumnsV1';

const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function loadTallyColumns() {
  try {
    const o = JSON.parse(ls()?.getItem(TALLY_COLUMNS_KEY) || 'null');
    if (o && o.drills && typeof o.drills === 'object') return { schema: 1, drills: o.drills };
  } catch { /* fall through */ }
  return { schema: 1, drills: {} };
}

function save(o) {
  try {
    ls()?.setItem(TALLY_COLUMNS_KEY, JSON.stringify({ schema: 1, drills: o.drills || {} }));
    dataWritten(TALLY_COLUMNS_KEY);
  } catch { /* quota */ }
  return o;
}

export function columnsFor(drillId) {
  const list = loadTallyColumns().drills[drillId];
  return Array.isArray(list) ? list : [];
}

export function addTallyColumn(drillId, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  if (!drillId) return { error: 'No drill' };
  const o = loadTallyColumns();
  const list = Array.isArray(o.drills[drillId]) ? o.drills[drillId].slice() : [];
  list.push({ id: `c${now.toString(36)}`, makes: 0, misses: 0 });
  o.drills[drillId] = list;
  save(o);
  return { ok: true, columns: list };
}

export function bumpTallyColumn(drillId, colId, kind, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  const o = loadTallyColumns();
  const list = Array.isArray(o.drills[drillId]) ? o.drills[drillId].slice() : [];
  const i = list.findIndex((c) => c.id === colId);
  if (i < 0) return { error: 'No column' };
  const c = { ...list[i], makes: list[i].makes || 0, misses: list[i].misses || 0 };
  if (kind === 'make') c.makes += 1;
  else c.misses += 1;
  list[i] = c;
  o.drills[drillId] = list;
  save(o);
  return { ok: true, columns: list };
}

export function removeTallyColumn(drillId, colId, now = Date.now()) {
  if (!drillEditorAllowed(now)) return { error: 'DEV MODE is locked' };
  const o = loadTallyColumns();
  const list = Array.isArray(o.drills[drillId]) ? o.drills[drillId] : [];
  o.drills[drillId] = list.filter((c) => c.id !== colId);
  if (!o.drills[drillId].length) delete o.drills[drillId];
  save(o);
  return { ok: true, columns: o.drills[drillId] || [] };
}
