/**
 * Shot Simulator persistence: current table, saved shots, collections, settings, Target Game best.
 * localStorage key poolIQSimV1 (separate from the main career save so nothing there is touched).
 */
export const SIM_KEY = 'poolIQSimV1';
export const DEFAULT_SETTINGS = {
  tangent: true, // show the stun tangent line and object-ball line while aiming
  paths: true, // draw coloured ball tracks after a shot
  grid: 'full', // 'full' | 'half' | 'off'
  snap: false, // snap dragged balls to ¼ diamond
  maxCut: 60, // shape-zone max cut angle
  findMode: 'precise', // Find a Shot: 'fast' | 'precise'
  playback: 1, // animation speed
  useCal: false // scale SPEED with my speed calibration
};

function blank() {
  return { version: 1, current: null, shots: [], collections: [{ id: 'default', name: 'My Shots' }], settings: { ...DEFAULT_SETTINGS }, targetBest: 0 };
}
const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function loadSim() {
  const ls = store();
  let d = null;
  try { d = JSON.parse(ls?.getItem(SIM_KEY) || 'null'); } catch { d = null; }
  const base = blank();
  if (!d || typeof d !== 'object') return base;
  return {
    ...base,
    ...d,
    shots: Array.isArray(d.shots) ? d.shots : [],
    collections: Array.isArray(d.collections) && d.collections.length ? d.collections : base.collections,
    settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) }
  };
}
export function saveSim(d) {
  try { store()?.setItem(SIM_KEY, JSON.stringify(d)); return true; } catch { return false; }
}
const uid = (p) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

export function saveShot(d, { name, notes = '', collection = 'default', balls, shot, annotations = [] }) {
  const now = Date.now();
  const s = { id: uid('s'), name: (name || 'Untitled shot').trim().slice(0, 60), notes, favorite: false, collection, created: now, updated: now, balls: clone(balls), shot: clone(shot), annotations: clone(annotations) };
  d.shots.push(s);
  return s;
}
export function updateShot(d, id, patch) {
  const s = d.shots.find((x) => x.id === id);
  if (!s) return null;
  Object.assign(s, clone(patch), { updated: Date.now() });
  return s;
}
export function duplicateShot(d, id) {
  const s = d.shots.find((x) => x.id === id);
  if (!s) return null;
  const c = { ...clone(s), id: uid('s'), name: `${s.name} (copy)`.slice(0, 60), created: Date.now(), updated: Date.now(), favorite: false };
  d.shots.push(c);
  return c;
}
export function deleteShot(d, id) {
  const n = d.shots.length;
  d.shots = d.shots.filter((x) => x.id !== id);
  return d.shots.length < n;
}
export function addCollection(d, name) {
  const c = { id: uid('c'), name: (name || 'New collection').trim().slice(0, 40) };
  d.collections.push(c);
  return c;
}
export function renameCollection(d, id, name) {
  const c = d.collections.find((x) => x.id === id);
  if (c && name.trim()) c.name = name.trim().slice(0, 40);
  return c;
}
/** Deleting a collection moves its shots to the default one (nothing is lost) */
export function deleteCollection(d, id) {
  if (id === 'default') return false;
  d.collections = d.collections.filter((c) => c.id !== id);
  for (const s of d.shots) if (s.collection === id) s.collection = 'default';
  return true;
}
/** View helpers: filter by collection / favorites / text, sort by date or name */
export function listShots(d, { collection = 'all', favorites = false, query = '', sort = 'newest' } = {}) {
  const q = query.trim().toLowerCase();
  let list = d.shots.filter((s) => (collection === 'all' || s.collection === collection) && (!favorites || s.favorite) && (!q || s.name.toLowerCase().includes(q) || (s.notes || '').toLowerCase().includes(q)));
  const cmp = {
    newest: (a, b) => b.updated - a.updated,
    oldest: (a, b) => a.created - b.created,
    name: (a, b) => a.name.localeCompare(b.name),
    balls: (a, b) => b.balls.length - a.balls.length
  }[sort] || ((a, b) => b.updated - a.updated);
  return list.sort(cmp);
}
export const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
