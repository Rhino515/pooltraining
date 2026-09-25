/**
 * Aim View — the object ball as seen from behind the cue ball, looking down the line of aim,
 * with the translucent ghost cue ball overlapping it. Pure geometry + SVG, no DOM.
 *
 *   d  = unit direction of the cue ball's final approach (last leg before contact: cue → ghost,
 *        or last rail contact → ghost on a kick)
 *   n  = unit line of centres ghost → object ball (the direction the object ball leaves)
 *   θ  = angle between d and n (the cut angle)
 *   offset  = sin θ × one ball diameter (sideways distance between ghost and OB centres as seen)
 *   fullness = 1 − sin θ (share of the OB covered by the ghost ball)
 *   side: the ghost sits on the viewer's right of the OB → hit the RIGHT side → OB goes LEFT.
 */
import { BALL_COLORS, BALL_RADIUS } from '../tableDiagram.js';

export const BALL_R = BALL_RADIUS; // true-scale ball radius in table units (= geometry.R)
const near = (a, b, tol = 0.25) => a && b && Math.hypot(a.x - b.x, a.y - b.y) < tol;

/** Fraction word for a fullness 0–1 (same thresholds as the recipe's OB-contact label) */
export function fullnessWord(f) {
  if (f >= 0.93) return 'Full';
  if (f >= 0.68) return '¾';
  if (f >= 0.4) return '½';
  if (f >= 0.18) return '¼';
  return 'Thin';
}

/**
 * Pure aim maths from three points.
 * @returns {{theta:number, fullness:number, offset:number, lateral:number, side:'left'|'right'|'center', d:{x,y}, n:{x,y}}}
 */
export function aimFromPoints(approachFrom, ghost, ob, ballR = BALL_R) {
  let dx = ghost.x - approachFrom.x;
  let dy = ghost.y - approachFrom.y;
  const dl = Math.hypot(dx, dy) || 1;
  dx /= dl; dy /= dl;
  let nx = ob.x - ghost.x;
  let ny = ob.y - ghost.y;
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl; ny /= nl;
  const cos = Math.max(-1, Math.min(1, dx * nx + dy * ny));
  const theta = (Math.acos(cos) * 180) / Math.PI;
  // viewer's right when facing d on a y-down table = (−dy, dx)
  const lateral = (ghost.x - ob.x) * -dy + (ghost.y - ob.y) * dx; // signed, table units (= ±2R·sinθ)
  const offset = Math.sin((theta * Math.PI) / 180) * 2 * ballR;
  const fullness = 1 - Math.sin((theta * Math.PI) / 180);
  const side = theta < 0.5 ? 'center' : lateral > 0 ? 'right' : 'left';
  return { theta, fullness, offset, lateral, side, d: { x: dx, y: dy }, n: { x: nx, y: ny } };
}

/** The shot that the Aim View describes: the challenge itself, or the first step of a run-out. */
function shotSource(ch) {
  if (!ch) return null;
  if (ch.ghost && ch.cueBallPath) return ch;
  const s0 = ch.steps?.[0];
  if (s0?.ghost && s0.cueBallPath && (!ch.cueBallPosition || near(ch.cueBallPosition, s0.cueFrom || s0.cueBallPath[0], 0.3))) {
    return { ...s0, ballPositions: ch.ballPositions, targetBall: s0.ball };
  }
  return null;
}

/**
 * Aim View data for a challenge, or null when aim is not meaningful / not verifiable
 * (no object ball, no ghost spot, ghost not touching a ball, …) — never a guessed value.
 */
export function aimViewInfo(ch, ballR = BALL_R) {
  const src = shotSource(ch);
  if (!src) return null;
  const cp = src.cueBallPath || [];
  const gi = cp.findIndex((p, i) => i > 0 && near(p, src.ghost));
  if (gi < 1) return null;
  const from = cp[gi - 1];
  if (Math.hypot(src.ghost.x - from.x, src.ghost.y - from.y) < 0.5) return null;
  const want = src.ball ?? src.targetBall;
  const balls = src.ballPositions || [];
  const touching = (b) => Math.abs(Math.hypot(b.x - src.ghost.x, b.y - src.ghost.y) - 2 * ballR) < 0.2;
  const ob = balls.find((b) => b.n === want && touching(b)) || balls.find(touching);
  if (!ob) return null;
  const a = aimFromPoints(from, src.ghost, ob, ballR);
  const frac = fullnessWord(a.fullness);
  const sideWord = a.side === 'right' ? 'Right' : a.side === 'left' ? 'Left' : '';
  const label = frac === 'Full' ? 'Full' : `${sideWord} ${frac}`;
  const deg = Math.round(a.theta);
  const obGoes = a.side === 'right' ? 'left' : a.side === 'left' ? 'right' : 'straight';
  const plain = frac === 'Full'
    ? `Full ball — aim through the middle of the ${ob.n}`
    : `${frac === 'Thin' ? 'Thin hit' : `${frac} ball`} — hit the ${a.side} side of the ${ob.n} to send it ${obGoes}`;
  return { ...a, ob: { n: ob.n, x: ob.x, y: ob.y }, ghost: { x: src.ghost.x, y: src.ghost.y }, from: { x: from.x, y: from.y }, afterRail: gi > 1, frac, label, deg, plain, obGoes, ballR };
}

const f2 = (v) => Math.round(v * 100) / 100;

/** 3D-shaded pool ball (flat colour + stripe + shading overlay + number disc) in a 0–100 viewBox */
export function shadedBallSVG(n, cx, cy, r, uid) {
  const isCue = n === 'cue' || n == null;
  const num = isCue ? null : Number(n);
  const col = isCue ? '#f4f8fb' : BALL_COLORS[num] || '#94a3b8';
  const stripe = num >= 9;
  let s = `<clipPath id="bc${uid}"><circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}"/></clipPath>`;
  s += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${stripe ? '#f4f6f8' : col}"/>`;
  if (stripe) s += `<rect clip-path="url(#bc${uid})" x="${f2(cx - r)}" y="${f2(cy - r * 0.52)}" width="${f2(2 * r)}" height="${f2(r * 1.04)}" fill="${col}"/>`;
  if (num != null) {
    s += `<circle cx="${f2(cx - r * 0.08)}" cy="${f2(cy - r * 0.06)}" r="${f2(r * 0.42)}" fill="#fbfdff"/>`;
    s += `<text x="${f2(cx - r * 0.08)}" y="${f2(cy + r * 0.12)}" text-anchor="middle" font-size="${f2(r * 0.52)}" font-weight="900" fill="#0b0f14" font-family="system-ui,sans-serif">${num}</text>`;
  }
  s += `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="url(#shade${uid})"/>`;
  s += `<ellipse cx="${f2(cx - r * 0.34)}" cy="${f2(cy - r * 0.42)}" rx="${f2(r * 0.26)}" ry="${f2(r * 0.16)}" fill="#ffffff" opacity="0.55" transform="rotate(-28 ${f2(cx - r * 0.34)} ${f2(cy - r * 0.42)})"/>`;
  return s;
}

export function shadeDefs(uid) {
  return `<radialGradient id="shade${uid}" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.82" stop-color="#000000" stop-opacity="0.22"/><stop offset="1" stop-color="#000000" stop-opacity="0.55"/></radialGradient>`;
}

let uidN = 0;
/**
 * Aim View SVG (viewBox 0 0 100 100): OB drawn behind, ghost cue ball in front, offset sideways by
 * sin θ × diameter (in view scale), plus the contact point and the aim line through the ghost centre.
 * @param {object|null} info from aimViewInfo(); null → hidden "?" face
 */
export function aimViewSVG(info, { size = 'gauge', hidden = false } = {}) {
  const uid = `av${++uidN}`;
  let s = `<svg class="aim-view av-${size}" viewBox="0 0 100 100" role="img" aria-label="${hidden || !info ? 'Aim hidden' : `Aim view: ${info.label}, ${info.deg}° cut. ${info.plain}`}"${info && !hidden ? ` data-cut="${info.deg}" data-side="${info.side}" data-fullness="${f2(info.fullness)}" data-offset="${f2(info.offset / (2 * info.ballR))}"` : ''}>`;
  s += `<defs><radialGradient id="face${uid}" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#123047"/><stop offset="1" stop-color="#07131e"/></radialGradient>${shadeDefs(uid)}<clipPath id="fc${uid}"><circle cx="50" cy="50" r="47"/></clipPath></defs>`;
  s += `<circle cx="50" cy="50" r="48.5" fill="url(#face${uid})" stroke="#1f5a74" stroke-width="1.5"/>`;
  if (!info || hidden) {
    s += `<circle cx="50" cy="52" r="22" fill="#0f2536" stroke="#2a5570" stroke-width="1.2" stroke-dasharray="3 2.4"/><text x="50" y="60" text-anchor="middle" font-size="24" font-weight="900" fill="#ffc75b" font-family="system-ui,sans-serif">?</text></svg>`;
    return s;
  }
  const r = 21; // view radius; diameter 42 ⇒ view offset = sinθ × 42
  const off = (info.offset / (2 * info.ballR)) * 2 * r * (info.side === 'left' ? -1 : 1);
  const obX = 50 - off / 2;
  const gX = 50 + off / 2;
  const cy = 52;
  s += `<g clip-path="url(#fc${uid})">`;
  s += `<rect x="0" y="${cy + r - 1}" width="100" height="40" fill="#0b3a44" opacity="0.55"/>`; // cloth
  s += `<ellipse cx="${f2(obX)}" cy="${cy + r - 0.5}" rx="${r * 0.95}" ry="3.2" fill="#000" opacity="0.4"/>`;
  s += `<g class="av-ob" data-n="${info.ob.n}">${shadedBallSVG(info.ob.n, obX, cy, r, uid)}</g>`;
  // ghost cue ball in front (translucent) + aim line through its centre
  s += `<line class="av-aimline" x1="${f2(gX)}" y1="4" x2="${f2(gX)}" y2="96" stroke="#ffc75b" stroke-width="1" stroke-dasharray="2.4 2" opacity="0.8"/>`;
  s += `<circle class="av-ghost" cx="${f2(gX)}" cy="${cy}" r="${r}" fill="#eaf8ff" fill-opacity="0.34" stroke="#cff9ff" stroke-width="1.4" stroke-dasharray="3.2 2.2"/>`;
  s += `<circle cx="${f2(gX)}" cy="${cy}" r="1.8" fill="#ffc75b"/>`;
  // contact point on the OB: halfway between the two centres (as seen)
  s += `<circle class="av-contact" cx="${f2((obX + gX) / 2)}" cy="${cy}" r="2.6" fill="#55e5ff" stroke="#05111b" stroke-width="0.8"/>`;
  s += `</g></svg>`;
  return s;
}
