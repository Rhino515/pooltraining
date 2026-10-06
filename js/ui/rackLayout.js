/**
 * Rack layouts for Create Your Own Game (v14-119) and the 6-Ball Shootout rack diagram.
 * Slots are in ball diameters: x across the table, z along the long string toward the foot rail, slot 0 = apex.
 * order[slot] = ball number. foot = the slot that sits on the foot spot. pins = slots a random fill keeps.
 * The diagram is the app's own flat top-down table (tableDiagram.js), zoomed on the foot end.
 */
import { renderTableDiagram, BALL_RADIUS } from '../tableDiagram.js';

export const LAYOUTS = { triangle: 'Triangle', diamond: 'Diamond', line: 'Line', row: 'Row' };
const R3 = Math.sqrt(3) / 2;

/** Rows (counts per row) for a layout and ball count. */
export function layoutRows(layout, n) {
  const N = Math.max(1, Math.min(15, Math.round(Number(n) || 1)));
  if (layout === 'line') return Array(N).fill(1);
  if (layout === 'row') return [N];
  if (layout === 'diamond') {
    let k = 1;
    while (k * k < N) k += 1;
    const widths = [];
    for (let i = 1; i <= k; i++) widths.push(i);
    for (let i = k - 1; i >= 1; i--) widths.push(i);
    const rows = [];
    let left = N;
    for (const w of widths) { if (left <= 0) break; rows.push(Math.min(w, left)); left -= w; }
    return rows;
  }
  const rows = [];
  let left = N;
  for (let w = 1; left > 0; w++) { rows.push(Math.min(w, left)); left -= w; }
  return rows;
}
/** Slot centres { x, z, row } in ball diameters. */
export function layoutSlots(layout, n) {
  const rows = layoutRows(layout, n);
  const out = [];
  rows.forEach((k, i) => {
    for (let j = 0; j < k; j++) {
      if (layout === 'line') out.push({ x: 0, z: i, row: i });
      else out.push({ x: j - (k - 1) / 2, z: i * R3, row: i });
    }
  });
  return out;
}
/** Standard orders for the presets (row by row from the apex). */
export const PRESET_RACKS = {
  8: { count: 15, layout: 'triangle', order: [1, 9, 6, 2, 8, 14, 10, 7, 15, 5, 3, 11, 12, 4, 13], foot: 0 },
  9: { count: 9, layout: 'diamond', order: [1, 2, 5, 8, 9, 4, 7, 6, 3], foot: 0 },
  10: { count: 10, layout: 'triangle', order: [1, 4, 5, 6, 10, 7, 2, 8, 9, 3], foot: 0 },
  straight: { count: 15, layout: 'triangle', order: [1, 9, 6, 2, 8, 14, 10, 7, 15, 5, 3, 11, 12, 4, 13], foot: 0 },
  // UPL manual §9.4: six balls, the back middle ball on the foot spot (slot 4 of a 1-2-3 triangle)
  shootout: { count: 6, layout: 'triangle', order: [1, 2, 3, 4, 5, 6], foot: 4 }
};
export const sequential = (n) => Array.from({ length: n }, (_, i) => i + 1);

/** Keep a rack valid: count 1–15, order is a permutation of 1..count, foot and pins inside the slots. */
export function normalizeRack(r) {
  const src = r && typeof r === 'object' ? r : {};
  const count = Math.max(1, Math.min(15, Math.round(Number(src.count) || 9)));
  const layout = Object.prototype.hasOwnProperty.call(LAYOUTS, src.layout) ? src.layout : 'triangle';
  let order = Array.isArray(src.order) ? src.order.map(Number) : [];
  const ok = order.length === count && sequential(count).every((b) => order.includes(b));
  if (!ok) order = sequential(count);
  const foot = Number.isInteger(src.foot) && src.foot >= 0 && src.foot < count ? src.foot : 0;
  const pins = Array.isArray(src.pins) ? [...new Set(src.pins.map(Number).filter((p) => Number.isInteger(p) && p >= 0 && p < count))] : [];
  return { count, layout, order, foot, pins };
}
/** Swap the balls in two slots. */
export function swapSlots(rack, a, b) {
  const r = normalizeRack(rack);
  if (a === b || a < 0 || b < 0 || a >= r.count || b >= r.count) return r;
  const order = r.order.slice();
  [order[a], order[b]] = [order[b], order[a]];
  return { ...r, order };
}
/** Random fill: pinned slots keep their ball; every other ball goes to a random free slot. rnd() in [0, 1). */
export function randomFill(rack, rnd = Math.random) {
  const r = normalizeRack(rack);
  const free = sequential(r.count).map((_, i) => i).filter((i) => !r.pins.includes(i));
  const balls = free.map((i) => r.order[i]);
  for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
  const order = r.order.slice();
  free.forEach((slot, k) => { order[slot] = balls[k]; });
  return { ...r, order };
}
/** Change count or layout: keep the balls that still fit in order, foot back on the apex unless still valid. */
export function reshape(rack, { count, layout } = {}) {
  const r = normalizeRack(rack);
  const n = Math.max(1, Math.min(15, Math.round(Number(count ?? r.count))));
  const lay = layout || r.layout;
  let order = r.order.filter((b) => b <= n);
  for (let b = 1; b <= n; b++) if (!order.includes(b)) order.push(b);
  order = order.slice(0, n);
  // a row is placed with its middle ball on the foot spot; other shapes keep the foot ball when it still fits
  const foot = lay === 'row' && (layout || count != null) ? Math.floor((n - 1) / 2) : r.foot < n ? r.foot : 0;
  return normalizeRack({ count: n, layout: lay, order, foot, pins: r.pins.filter((p) => p < n) });
}

/** Table coordinates of each slot: the foot slot on the foot spot (75, 25), the rack opening toward the foot rail. */
export function rackPositions(rack) {
  const r = normalizeRack(rack);
  const slots = layoutSlots(r.layout, r.count);
  const d = BALL_RADIUS * 2 * 1.02;
  const f = slots[r.foot] || slots[0];
  let pos = slots.map((s, i) => ({ slot: i, n: r.order[i], x: 75 + (s.z - f.z) * d, y: 25 + (s.x - f.x) * d }));
  // a long rack that would run past the foot rail opens toward the head instead
  if (Math.max(...pos.map((p) => p.x)) > 100 - BALL_RADIUS) pos = pos.map((p) => ({ ...p, x: 150 - p.x }));
  // a wide rack that would run past a long rail slides back onto the table
  const lo = Math.min(...pos.map((p) => p.y)); const hi = Math.max(...pos.map((p) => p.y));
  const dy = lo < BALL_RADIUS ? BALL_RADIUS - lo : hi > 50 - BALL_RADIUS ? 50 - BALL_RADIUS - hi : 0;
  if (dy) pos = pos.map((p) => ({ ...p, y: p.y + dy }));
  return pos;
}
/**
 * Flat top-down diagram: the app's table, zoomed on the foot end. opts: { selected, full, tight, className }.
 * The foot spot is marked; pinned slots get a gold ring; the selected slot a blue ring.
 */
export function rackSVG(rack, opts = {}) {
  const r = normalizeRack(rack);
  const pos = rackPositions(r);
  const R = BALL_RADIUS;
  let under = `<g class="footSpot"><circle cx="75" cy="25" r="${R + 0.55}" fill="none" stroke="#f6c453" stroke-width="0.32" stroke-dasharray="0.6 0.4"/><path d="M73.6 25h-1.3M76.4 25h1.3M75 23.6v-1.3M75 26.4v1.3" stroke="#f6c453" stroke-width="0.28"/></g>`;
  for (const p of pos) {
    if (r.pins.includes(p.slot)) under += `<circle class="rackPin" data-pin="${p.slot}" cx="${p.x}" cy="${p.y}" r="${R + 0.42}" fill="none" stroke="#f6c453" stroke-width="0.45"/>`;
    if (opts.selected === p.slot) under += `<circle class="rackSel" cx="${p.x}" cy="${p.y}" r="${R + 0.62}" fill="#55e5ff33" stroke="#55e5ff" stroke-width="0.4"/>`;
  }
  const spec = { balls: pos.map((p) => ({ id: p.n, x: p.x, y: p.y })), extraUnder: under, hitR: R * 1.05 };
  let svg = renderTableDiagram(spec, { className: opts.className || 'table-diagram rackDiagram' });
  if (!opts.full) {
    // zoom on the foot end around the rack (keeps the rail and the foot pockets in view)
    const xs = pos.map((p) => p.x); const ys = pos.map((p) => p.y);
    const yPad = Math.max(0, Math.max(...ys) - 25, 25 - Math.min(...ys));
    const tight = !!opts.tight; // tiles: closer crop around the rack
    const half = Math.min(29.6, Math.max(tight ? 5 : 9, yPad + (tight ? 2.6 : 4)));
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const w = Math.min(109.2, Math.max(Math.max(...xs) - Math.min(...xs) + (tight ? 7 : 18), half * 2 * (tight ? 1.6 : 1.3)));
    const x0 = Math.max(-4.6, Math.min(104.6 - w, cx - w / 2));
    svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${x0.toFixed(2)} ${(25 - half).toFixed(2)} ${w.toFixed(2)} ${(half * 2).toFixed(2)}"`);
  }
  return svg.replace('<svg ', `<svg data-rack="${r.count}" data-layout="${r.layout}" `);
}
