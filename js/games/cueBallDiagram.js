/**
 * Cue-ball contact diagram: a large cue ball with tip-width rings (½, 1, 1½ tips) and a coloured
 * target dot. Static mode shows a recipe; interactive mode lets the player tap their own contact point.
 */
import { contactText } from './text.js';

export const TIP_UNIT = 19.5; // svg units per cue-tip width (ball radius 44 ≈ 2.25 tip widths)
const CX = 50;
const CY = 50;

export function dotPosition(vTips = 0, hTips = 0) {
  return { x: CX + (Number(hTips) || 0) * TIP_UNIT, y: CY - (Number(vTips) || 0) * TIP_UNIT };
}

function dotColor(v, h) {
  if (v < 0) return '#ff5f7e';
  if (v > 0) return '#46e7a0';
  if (h) return '#ffc75b';
  return '#19b8ff';
}

/**
 * @param {{vTips:number,hTips:number}|null} contact
 * @param {{size?:'lg'|'sm'|'xs', interactive?:boolean, compare?:{vTips,hTips}, id?:string}} opt
 */
export function cueBallSVG(contact, opt = {}) {
  const size = opt.size || 'lg';
  const v = contact ? Number(contact.vTips) || 0 : 0;
  const h = contact ? Number(contact.hTips) || 0 : 0;
  const p = dotPosition(v, h);
  const small = size !== 'lg';
  let s = `<svg class="cb-diagram cb-${size}${opt.interactive ? ' cb-interactive' : ''}" viewBox="0 0 100 100" role="img" aria-label="Cue-ball contact: ${contact ? contactText(v, h) : 'tap to choose'}"${opt.id ? ` id="${opt.id}"` : ''}>`;
  s += `<defs><radialGradient id="cbShade${size}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e9f1f5"/><stop offset="1" stop-color="#b9c8d1"/></radialGradient></defs>`;
  s += `<circle cx="${CX}" cy="${CY}" r="44" fill="url(#cbShade${size})" stroke="#9fb4c1" stroke-width="1.2"/>`;
  if (!small || size === 'sm') {
    for (const t of [0.5, 1, 1.5]) s += `<circle class="cb-ring" data-tips="${t}" cx="${CX}" cy="${CY}" r="${t * TIP_UNIT}" fill="none" stroke="#7d93a3" stroke-width="${t === 1 ? 0.9 : 0.6}" stroke-dasharray="${t === 1 ? '0' : '2 2'}"/>`;
    s += `<line x1="${CX}" y1="8" x2="${CX}" y2="92" stroke="#9fb4c1" stroke-width="0.5"/><line x1="8" y1="${CY}" x2="92" y2="${CY}" stroke="#9fb4c1" stroke-width="0.5"/>`;
  }
  if (size === 'lg') {
    s += `<text x="50" y="5.5" text-anchor="middle" font-size="4.2" fill="#8199aa" font-weight="700">FOLLOW</text><text x="50" y="99" text-anchor="middle" font-size="4.2" fill="#8199aa" font-weight="700">DRAW</text>`;
    for (const t of [0.5, 1, 1.5]) s += `<text x="${CX + 1.2}" y="${CY - t * TIP_UNIT + 3.6}" font-size="3.2" fill="#6f8797">${t === 0.5 ? '½' : t === 1 ? '1' : '1½'}</text>`;
  }
  if (opt.compare) {
    const q = dotPosition(opt.compare.vTips, opt.compare.hTips);
    s += `<circle class="cb-dot-compare" cx="${q.x}" cy="${q.y}" r="${small ? 9 : 6.5}" fill="none" stroke="#ffc75b" stroke-width="2" stroke-dasharray="3 2"/>`;
  }
  if (contact) {
    s += `<circle class="cb-dot" data-vtips="${v}" data-htips="${h}" cx="${p.x}" cy="${p.y}" r="${small ? 11 : 6.5}" fill="${dotColor(v, h)}" stroke="#05111b" stroke-width="${small ? 2.5 : 1.4}"/>`;
  }
  s += `</svg>`;
  return s;
}

/** Convert a tap on an interactive diagram to snapped tips (½-tip grid; vertical ±1.5, horizontal ±1) */
export function tipsFromTap(svgEl, clientX, clientY) {
  const r = svgEl.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * 100;
  const y = ((clientY - r.top) / r.height) * 100;
  const snap = (val) => Math.round(val * 2) / 2;
  const hTips = Math.max(-1, Math.min(1, snap((x - CX) / TIP_UNIT)));
  const vTips = Math.max(-1.5, Math.min(1.5, snap((CY - y) / TIP_UNIT)));
  return { vTips: vTips || 0, hTips: hTips || 0 };
}
