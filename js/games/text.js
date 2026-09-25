/** Pure text helpers for recipes (no DOM). */
import { POCKET_NAMES, RAILS, round1, DIAMOND } from './geometry.js';

export function fracTips(v) {
  const a = Math.abs(v);
  const whole = Math.floor(a);
  const half = a - whole >= 0.25;
  if (!whole && half) return '½';
  if (whole && half) return `${whole}½`;
  return String(whole);
}

function tipWord(v) {
  const a = Math.abs(v);
  return a > 1 ? 'tips' : 'tip';
}

/** "1 tip below center", "Center ball", "½ tip above, ½ tip right" */
export function contactText(vTips = 0, hTips = 0) {
  const v = Number(vTips) || 0;
  const h = Number(hTips) || 0;
  if (!v && !h) return 'Center ball';
  const parts = [];
  if (v) parts.push(`${fracTips(v)} ${tipWord(v)} ${v > 0 ? 'above' : 'below'} center`);
  if (h) parts.push(`${fracTips(h)} ${tipWord(h)} ${h > 0 ? 'right' : 'left'}`);
  return parts.join(', ');
}

export function contactShort(vTips = 0, hTips = 0) {
  const v = Number(vTips) || 0;
  const h = Number(hTips) || 0;
  if (!v && !h) return 'CENTER';
  const vs = v ? `${fracTips(v)}${v > 0 ? '↑' : '↓'}` : '';
  const hs = h ? `${fracTips(h)}${h > 0 ? '→' : '←'}` : '';
  return [vs, hs].filter(Boolean).join(' ');
}

export function englishText(hTips = 0, type = null) {
  const h = Number(hTips) || 0;
  if (!h) return 'None';
  const base = `${fracTips(h)} ${tipWord(h)} ${h > 0 ? 'right' : 'left'}`;
  return type ? `${base} (${type})` : base;
}

export function techniqueName(t) {
  return { follow: 'Follow', draw: 'Draw', stun: 'Stun', stop: 'Stop', 'stun-run': 'Stun-run-through', 'stun-draw': 'Stun-draw', lag: 'Lag', bank: 'Bank', kick: 'Kick' }[t] || 'Shot';
}

export function railsText(contacts = []) {
  if (!contacts.length) return 'Direct (no rail)';
  const n = contacts.length;
  return `${n} rail${n > 1 ? 's' : ''} (${contacts.map((c) => RAILS[c.rail].short).join(' → ')})`;
}

export function railsShort(contacts = []) {
  const n = contacts.length;
  return n ? `${n} RAIL${n > 1 ? 'S' : ''}` : 'DIRECT';
}

export function pocketName(k) {
  return POCKET_NAMES[k] || k;
}

export function inches(v) {
  const r = Math.round(v);
  return `${r} in`;
}

export function diamonds(v) {
  return `${round1(v / DIAMOND)} diamond${Math.abs(v / DIAMOND - 1) < 0.05 ? '' : 's'}`;
}

/** Where on the table is a point, in plain words */
export function areaName(p) {
  const x = p.x;
  const y = p.y;
  const horiz = x < 20 ? 'near the head rail' : x < 40 ? 'in the head half' : x < 60 ? 'at mid-table' : x < 80 ? 'in the foot half' : 'near the foot rail';
  const vert = y < 12 ? 'along the top rail' : y > 38 ? 'along the bottom rail' : y < 22 ? 'above the center line' : y > 28 ? 'below the center line' : 'on the center line';
  return `${horiz}, ${vert}`;
}
