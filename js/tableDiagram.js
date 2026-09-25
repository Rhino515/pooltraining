/**
 * Reusable SVG pool table diagram renderer — drawn at TRUE SCALE.
 * Coordinate system: the playing surface, cushion nose to cushion nose, is 0–100 × 0–50
 * (1 unit = 1 inch on a 9-ft table's 100" × 50" bed; one diamond = 12.5).
 * x: 0 head (left) cushion → 100 foot (right) cushion; y: 0 top cushion → 50 bottom cushion.
 * Rails, diamond sights and pockets are drawn OUTSIDE the playing surface (viewBox −4.6 … 104.6).
 * Balls: 2¼" diameter → radius BALL_RADIUS = 1.125 units (2.25% of the length, 4.5% of the width).
 */

export const BALL_RADIUS = 1.125;
export const RAIL = 4.6; // drawn rail width (cushion + wood) outside the playing surface
export const CUSHION_W = 1.3; // drawn cushion rubber strip inside the rail
export const VIEWBOX = `${-RAIL} ${-RAIL} ${100 + 2 * RAIL} ${50 + 2 * RAIL}`;

/** Pocket centres (drawn holes and object-ball aim targets). Corner holes sit on the cushion corner, side holes just behind the long cushions. */
const POCKETS = {
  TL: { x: -0.45, y: -0.45, r: 2.35, label: 'TL' },
  TM: { x: 50, y: -1.45, r: 2.3, label: 'TM' },
  TR: { x: 100.45, y: -0.45, r: 2.35, label: 'TR' },
  BL: { x: -0.45, y: 50.45, r: 2.35, label: 'BL' },
  BM: { x: 50, y: 51.45, r: 2.3, label: 'BM' },
  BR: { x: 100.45, y: 50.45, r: 2.35, label: 'BR' }
};

const BALL_COLORS = {
  cue: '#f5f7fa',
  1: '#f5d76e',
  2: '#3b82f6',
  3: '#ef4444',
  4: '#7c3aed',
  5: '#f97316',
  6: '#16a34a',
  7: '#a16207',
  8: '#111827',
  9: '#eab308',
  10: '#2563eb',
  11: '#dc2626',
  12: '#6d28d9',
  13: '#ea580c',
  14: '#15803d',
  15: '#854d0e'
};

const CUT_AUTO_MIN_DEG = 10;

/** Diamond sights on the wood rails (table units). One diamond = 12.5 from the cushion nose; long rails have 3 per half (the side pocket replaces the middle one). */
export const SIGHT_OFFSET = 3.0; // distance of the sight from the cushion nose, out on the rail
const SO = SIGHT_OFFSET;
export const DIAMOND_SIGHTS = [
  ...[12.5, 25, 37.5, 62.5, 75, 87.5].map((x) => [x, -SO]),
  ...[12.5, 25, 37.5, 62.5, 75, 87.5].map((x) => [x, 50 + SO]),
  ...[12.5, 25, 37.5].map((y) => [-SO, y]),
  ...[12.5, 25, 37.5].map((y) => [100 + SO, y])
];
/** Faint dashed grid from every diamond sight across the playing surface: 7 long-axis + 3 short-axis lines */
export const GRID_LINES_X = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
export const GRID_LINES_Y = [12.5, 25, 37.5];

/** SVG for the diamond grid (drawn right on the felt, under zones, paths and balls) */
export function diamondGridSVG() {
  let g = '<g class="diamond-grid" data-lines="' + (GRID_LINES_X.length + GRID_LINES_Y.length) + '" stroke="#cdeefa" stroke-width="0.16" stroke-dasharray="1.2 1.2" opacity="0.26" fill="none" pointer-events="none">';
  for (const x of GRID_LINES_X) g += `<line class="grid-x" data-x="${x}" x1="${x}" y1="0" x2="${x}" y2="50"/>`;
  for (const y of GRID_LINES_Y) g += `<line class="grid-y" data-y="${y}" x1="0" y1="${y}" x2="100" y2="${y}"/>`;
  return g + '</g>';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pocketKey(target) {
  if (!target) return null;
  if (typeof target === 'string') return target.toUpperCase();
  if (Array.isArray(target) && target.length >= 2) {
    const [x, y] = target;
    let best = null;
    let bestD = Infinity;
    for (const [k, p] of Object.entries(POCKETS)) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }
  if (target.x != null) return pocketKey([target.x, target.y]);
  return null;
}

function resolvePocket(target) {
  const key = pocketKey(target);
  return key ? POCKETS[key] : null;
}

function ballXY(b) {
  return {
    id: b.id != null ? b.id : b[0],
    x: b.x != null ? b.x : b[1],
    y: b.y != null ? b.y : b[2]
  };
}

function isCueBall(id) {
  return id === 'cue' || id === 0 || id === '0';
}

function findCueAndOb(balls) {
  let cue = null;
  let ob = null;
  for (const raw of balls) {
    const b = ballXY(raw);
    if (isCueBall(b.id)) {
      if (!cue) cue = b;
    } else if (!ob) {
      ob = b;
    }
  }
  return { cue, ob };
}

/**
 * Ghost-ball center for a cut: cue arrives here so OB travels toward pocket.
 * ghost = OB − normalize(pocket − OB) × (2 × ballR)
 * @param {{x:number,y:number}} ob
 * @param {{x:number,y:number}} pocket
 * @param {number} ballR
 * @returns {{x:number,y:number, dirX:number, dirY:number}}
 */
export function computeGhostBall(ob, pocket, ballR) {
  const dx = pocket.x - ob.x;
  const dy = pocket.y - ob.y;
  const len = Math.hypot(dx, dy) || 1;
  const dirX = dx / len;
  const dirY = dy / len;
  return {
    x: ob.x - dirX * 2 * ballR,
    y: ob.y - dirY * 2 * ballR,
    dirX,
    dirY
  };
}

/** Angle in degrees between two 2D vectors. */
export function angleBetweenDeg(ax, ay, bx, by) {
  const la = Math.hypot(ax, ay) || 1;
  const lb = Math.hypot(bx, by) || 1;
  const dot = (ax / la) * (bx / lb) + (ay / la) * (by / lb);
  const c = Math.max(-1, Math.min(1, dot));
  return (Math.acos(c) * 180) / Math.PI;
}

/**
 * Map cut angle (cue→ghost vs OB→pocket) to thickness label.
 */
export function cutThicknessFromAngle(deg) {
  if (deg < 8) return 'FULL';
  if (deg < 22) return '¾ BALL';
  if (deg < 38) return 'HALF-BALL';
  if (deg < 55) return '¼ BALL';
  return 'THIN';
}

/**
 * Resolve display label from fraction / override / angle.
 * @param {number|string|null|undefined} fraction
 * @param {string|null|undefined} override
 * @param {number} cutDeg
 */
export function resolveCutLabel(fraction, override, cutDeg) {
  if (override && String(override).trim()) return String(override).trim().toUpperCase();
  if (fraction != null && fraction !== '') {
    const f = Number(fraction);
    if (!Number.isNaN(f)) {
      if (f >= 0.9) return 'FULL';
      if (f >= 0.7) return '¾ BALL';
      if (f >= 0.4) return 'HALF-BALL';
      if (f >= 0.2) return '¼ BALL';
      return 'THIN';
    }
    const s = String(fraction).toUpperCase();
    if (s) return s;
  }
  return cutThicknessFromAngle(cutDeg);
}

/**
 * Decide whether to show ghost overlay for a diagram spec.
 */
export function shouldShowGhostBall(spec, cue, ob, pocket, ghost, ballR) {
  if (spec.showGhostBall === false || spec.ghostBall === false) return false;
  if (spec.ghostBall === true || spec.showGhostBall === true) return true;
  if (spec.ghostBall && typeof spec.ghostBall === 'object') return true;
  if (!cue || !ob || !pocket || !ghost) return false;
  const cutDeg = angleBetweenDeg(
    ghost.x - cue.x,
    ghost.y - cue.y,
    pocket.x - ob.x,
    pocket.y - ob.y
  );
  return cutDeg >= CUT_AUTO_MIN_DEG;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function pathLooksLikeAimThroughOb(path, cue, ob, pocket) {
  const pts = path.points || path;
  if (!pts || pts.length < 2 || !cue || !ob) return false;
  const near = (a, b, tol = 4) => Math.hypot(a.x - b.x, a.y - b.y) < tol;
  const coords = pts.map((pt) => ({
    x: pt.x != null ? pt.x : pt[0],
    y: pt.y != null ? pt.y : pt[1]
  }));
  const hitsCue = coords.some((p) => near(p, cue));
  const hitsOb = coords.some((p) => near(p, ob));
  const hitsPocket =
    pocket &&
    coords.some((p) => near(p, { x: pocket.x, y: pocket.y }, 6));
  // Typical aimPath: cue → OB → pocket (3 pts) — skip to avoid duplicate with ghost overlay
  if (coords.length >= 3 && hitsCue && hitsOb && hitsPocket) return true;
  if (coords.length === 2 && hitsCue && hitsOb) return true;
  if (coords.length === 2 && hitsOb && hitsPocket) return true;
  return false;
}

function renderGhostOverlay({ cue, ob, pocket, ghost, ballR, label, compact }) {
  let svg = '';
  const gx = ghost.x;
  const gy = ghost.y;

  // Optional overlap lens between ghost and OB (teaching hint)
  const midX = (gx + ob.x) / 2;
  const midY = (gy + ob.y) / 2;
  const overlapR = ballR * 0.55;
  svg += `<circle cx="${midX}" cy="${midY}" r="${overlapR}" fill="#55e5ff22" stroke="none"/>`;

  // Ghost ball: translucent dashed circle
  svg += `<circle class="ghost-ball" cx="${gx}" cy="${gy}" r="${ballR}" fill="#ffffff28" stroke="#a8f0ff" stroke-width="0.22" stroke-dasharray="0.5 0.35" opacity="0.95"/>`;
  // Second ring
  svg += `<circle class="ghost-ball-ring" cx="${gx}" cy="${gy}" r="${ballR * 0.55}" fill="none" stroke="#55e5ff" stroke-width="0.15" opacity="0.75"/>`;
  // Crosshair
  const ch = ballR * 0.35;
  svg += `<line x1="${gx - ch}" y1="${gy}" x2="${gx + ch}" y2="${gy}" stroke="#cff9ff" stroke-width="0.15" opacity="0.85"/>`;
  svg += `<line x1="${gx}" y1="${gy - ch}" x2="${gx}" y2="${gy + ch}" stroke="#cff9ff" stroke-width="0.15" opacity="0.85"/>`;

  // Aim line: cue → ghost (gold), with arrow
  svg += `<line class="ghost-aim" x1="${cue.x}" y1="${cue.y}" x2="${gx}" y2="${gy}" stroke="#ffc75b" stroke-width="0.45" marker-end="url(#ghostAimArrow)" opacity="0.95"/>`;

  // Object path: OB → pocket (dashed cyan) — drawn here so it sits under balls with ghost aim
  svg += `<line class="ghost-ob-path" x1="${ob.x}" y1="${ob.y}" x2="${pocket.x}" y2="${pocket.y}" stroke="#65e9ff" stroke-width="0.4" stroke-dasharray="1.4 1" opacity="0.85" marker-end="url(#arrowHead)"/>`;

  // Label
  if (!compact || label) {
    const awayX = gx - ob.x;
    const awayY = gy - ob.y;
    const alen = Math.hypot(awayX, awayY) || 1;
    let lx = gx + (awayX / alen) * (ballR + 3.2);
    let ly = gy + (awayY / alen) * (ballR + 2.4);
    lx = clamp(lx, 8, 92);
    ly = clamp(ly, 6, 46);
    const thickness = label || 'CUT';
    const line1 = 'GHOST';
    const line2 = thickness;
    const fs = compact ? 1.9 : 2.15;
    svg += `<text class="ghost-label" x="${lx}" y="${ly}" text-anchor="middle" fill="#e8fbff" font-size="${fs}" font-weight="800" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.35" paint-order="stroke">${esc(line1)}</text>`;
    svg += `<text class="ghost-label" x="${lx}" y="${ly + (compact ? 2.2 : 2.5)}" text-anchor="middle" fill="#ffc75b" font-size="${fs * 0.92}" font-weight="700" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.3" paint-order="stroke">${esc(line2)}</text>`;
  }

  return svg;
}

/**
 * @param {object} spec - diagram from drill data
 * @param {object} [options]
 * @param {boolean} [options.showLabels]
 * @param {boolean} [options.compact]
 * @param {string} [options.className]
 * @returns {string} SVG HTML
 */
export function renderTableDiagram(spec = {}, options = {}) {
  const balls = spec.balls || [];
  const paths = spec.paths || [];
  const arrows = spec.arrows || [];
  const zone = spec.zone || null;
  const headString = spec.headString !== false;
  const className = options.className || 'table-diagram';
  const compact = !!options.compact;
  const ballR = BALL_RADIUS; // true scale everywhere (compact only drops labels)
  const pocket = resolvePocket(spec.targetPocket || spec.target);
  const { cue, ob } = findCueAndOb(balls);

  let ghost = null;
  let cutDeg = 0;
  let cutLabel = null;
  let showGhost = false;

  if (cue && ob && pocket) {
    ghost = computeGhostBall(ob, pocket, ballR);
    cutDeg = angleBetweenDeg(
      ghost.x - cue.x,
      ghost.y - cue.y,
      pocket.x - ob.x,
      pocket.y - ob.y
    );
    const gb = spec.ghostBall;
    const overrideLabel =
      (gb && typeof gb === 'object' && gb.label) ||
      spec.cutLabel ||
      null;
    const fraction =
      (gb && typeof gb === 'object' && gb.cutFraction != null
        ? gb.cutFraction
        : null) ??
      spec.cutFraction ??
      null;
    cutLabel = resolveCutLabel(fraction, overrideLabel, cutDeg);
    showGhost = shouldShowGhostBall(spec, cue, ob, pocket, ghost, ballR);
  }

  let svg = `<svg class="${esc(className)}" viewBox="${VIEWBOX}" data-ball-r="${ballR}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pool table drill diagram" preserveAspectRatio="xMidYMid meet">`;

  // Rails / felt
  svg += `<defs>
    <radialGradient id="feltGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#147a7e"/>
      <stop offset="55%" stop-color="#0a4d56"/>
      <stop offset="100%" stop-color="#073840"/>
    </radialGradient>
    <filter id="ballShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0.12" dy="0.2" stdDeviation="0.14" flood-opacity="0.5"/>
    </filter>
    <marker id="arrowHead" markerWidth="3.4" markerHeight="3.4" refX="2.9" refY="1.7" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L3.4,1.7 L0,3.4 Z" fill="#55e5ff"/>
    </marker>
    <marker id="ghostAimArrow" markerWidth="3.6" markerHeight="3.6" refX="3" refY="1.8" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L3.6,1.8 L0,3.6 Z" fill="#ffc75b"/>
    </marker>
    <marker id="cueArrow" markerWidth="3.4" markerHeight="3.4" refX="2.9" refY="1.7" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L3.4,1.7 L0,3.4 Z" fill="#f2fdff"/>
    </marker>
    <marker id="obArrow" markerWidth="3.4" markerHeight="3.4" refX="2.9" refY="1.7" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L3.4,1.7 L0,3.4 Z" fill="#ffd34d"/>
    </marker>
    <clipPath id="feltClip"><rect x="0" y="0" width="100" height="50"/></clipPath>
  </defs>`;

  // Outer (wood) rail
  svg += `<rect x="${-RAIL}" y="${-RAIL}" width="${100 + 2 * RAIL}" height="${50 + 2 * RAIL}" rx="3.4" ry="3.4" fill="#1a3344" stroke="#2a5570" stroke-width="0.5"/>`;
  // Cushion rubber strip (felt-covered) between the wood and the playing surface
  svg += `<rect x="${-CUSHION_W}" y="${-CUSHION_W}" width="${100 + 2 * CUSHION_W}" height="${50 + 2 * CUSHION_W}" rx="0.8" ry="0.8" fill="#0b5a63" stroke="#0d3a42" stroke-width="0.25"/>`;
  // Playing surface (cushion nose to cushion nose)
  svg += `<rect class="felt" x="0" y="0" width="100" height="50" fill="url(#feltGrad)"/>`;
  // Cushion nose line
  svg += `<rect x="0" y="0" width="100" height="50" fill="none" stroke="#062a32" stroke-width="0.22" opacity="0.9"/>`;

  // Diamond grid (under everything that follows)
  if (spec.grid !== false) svg += diamondGridSVG();

  // Head string
  if (headString) {
    svg += `<line x1="25" y1="0" x2="25" y2="50" stroke="#55e5ff" stroke-width="0.25" stroke-dasharray="1.2 1.2" opacity="0.45"/>`;
    if (!compact) {
      svg += `<text x="25" y="48.9" text-anchor="middle" fill="#7eb8c8" font-size="1.6" font-family="system-ui,sans-serif" opacity="0.7">HEAD</text>`;
    }
  }

  // Diamond marks (simple)
  for (const [dx, dy] of DIAMOND_SIGHTS) {
    svg += `<circle class="diamond-sight" cx="${dx}" cy="${dy}" r="0.5" fill="#e3f4fa" opacity="0.8"/>`;
  }

  // Pockets
  for (const [key, p] of Object.entries(POCKETS)) {
    const isTarget = pocket && pocket.label === key;
    const r = p.r;
    svg += `<circle class="pocket" data-pocket="${key}" cx="${p.x}" cy="${p.y}" r="${r}" fill="#020508" stroke="${isTarget ? '#55e5ff' : '#0a1520'}" stroke-width="${isTarget ? 0.55 : 0.25}"/>`;
    if (isTarget) {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${r + 1.1}" fill="none" stroke="#55e5ff" stroke-width="0.4" stroke-dasharray="1.2 0.8" opacity="0.9">
        <animate attributeName="opacity" values="0.55;1;0.55" dur="2s" repeatCount="indefinite"/>
      </circle>`;
      if (!compact) {
        svg += `<text x="${Math.max(5.5, Math.min(94.5, p.x))}" y="${p.y > 25 ? p.y - 4.4 : p.y + 5.6}" text-anchor="middle" fill="#55e5ff" font-size="1.9" font-weight="700" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.3" paint-order="stroke">TARGET</text>`;
      }
    }
  }

  // CB destination zone
  if (zone) {
    const zx = zone.x != null ? zone.x : zone[0];
    const zy = zone.y != null ? zone.y : zone[1];
    const zr = zone.r != null ? zone.r : zone[2] != null ? zone[2] : 7;
    svg += `<circle cx="${zx}" cy="${zy}" r="${zr}" fill="#16c5ff22" stroke="#62e9ff" stroke-width="0.55" stroke-dasharray="1.5 1"/>`;
    svg += `<circle cx="${zx}" cy="${zy}" r="${zr * 0.35}" fill="#55e5ff33" stroke="none"/>`;
    if (!compact) {
      svg += `<text x="${zx}" y="${zy + zr + 2.4}" text-anchor="middle" fill="#7fdfff" font-size="2" font-family="system-ui,sans-serif">CB ZONE</text>`;
    }
  }

  // Aim / path lines (skip duplicates when ghost overlay draws cue→ghost and OB→pocket)
  for (const path of paths) {
    if (showGhost && pathLooksLikeAimThroughOb(path, cue, ob, pocket)) continue;
    const pts = path.points || path;
    if (!pts || pts.length < 2) continue;
    const d = pts
      .map((pt, i) => {
        const x = pt.x != null ? pt.x : pt[0];
        const y = pt.y != null ? pt.y : pt[1];
        return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join(' ');
    const color = path.color || '#65e9ff';
    const dash = path.dashed !== false ? 'stroke-dasharray="1.4 1"' : '';
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${path.width || 0.42}" ${dash} opacity="0.9" marker-end="url(#arrowHead)"/>`;
  }

  // CB movement arrows (separate from shot paths)
  for (const arrow of arrows) {
    const x1 = arrow.from?.x ?? arrow[0];
    const y1 = arrow.from?.y ?? arrow[1];
    const x2 = arrow.to?.x ?? arrow[2];
    const y2 = arrow.to?.y ?? arrow[3];
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffc75b" stroke-width="0.45" marker-end="url(#arrowHead)" opacity="0.95"/>`;
  }

  // Ghost ball overlay BEFORE solid balls so cue/OB sit on top
  if (showGhost && ghost && cue && ob && pocket) {
    svg += renderGhostOverlay({
      cue,
      ob,
      pocket,
      ghost,
      ballR,
      label: cutLabel,
      compact
    });
  }

  if (spec.extraUnder) svg += spec.extraUnder;

  // Balls (true scale; crisp dark outline so they read on the grid; larger invisible hit area for taps)
  const HIT_R = 3.2;
  for (const b of balls) {
    const id = b.id != null ? b.id : b[0];
    const x = b.x != null ? b.x : b[1];
    const y = b.y != null ? b.y : b[2];
    const isCue = isCueBall(id);
    const num = isCue ? null : Number(id);
    const fill = isCue ? BALL_COLORS.cue : BALL_COLORS[num] || '#94a3b8';
    if (b.blocker) {
      svg += `<circle class="blocker-ring" cx="${x}" cy="${y}" r="${ballR + 0.75}" fill="#ff4d6d22" stroke="#ff5d73" stroke-width="0.3" stroke-dasharray="0.7 0.45"/>`;
    }
    svg += `<g class="ball ${isCue ? 'cue-ball' : 'obj-ball'}${b.blocker ? ' blocker' : ''}" data-n="${isCue ? 'cue' : num}">`;
    svg += `<circle class="ball-hit" cx="${x}" cy="${y}" r="${HIT_R}" fill="#000" fill-opacity="0" pointer-events="all"/>`;
    svg += `<g filter="url(#ballShadow)">`;
    if (!isCue && num >= 9) {
      svg += `<circle cx="${x}" cy="${y}" r="${ballR}" fill="#f8fafc"/>`;
      const k = (v) => Math.round(v * 1000) / 1000;
      svg += `<path d="M${k(x - ballR * 0.87)} ${k(y - ballR * 0.5)} L${k(x + ballR * 0.87)} ${k(y - ballR * 0.5)} A${ballR} ${ballR} 0 0 1 ${k(x + ballR * 0.87)} ${k(y + ballR * 0.5)} L${k(x - ballR * 0.87)} ${k(y + ballR * 0.5)} A${ballR} ${ballR} 0 0 1 ${k(x - ballR * 0.87)} ${k(y - ballR * 0.5)} Z" fill="${fill}"/>`;
      svg += `<circle class="ball-body" cx="${x}" cy="${y}" r="${ballR}" fill="none" stroke="#050b10" stroke-width="0.2"/>`;
    } else {
      svg += `<circle class="ball-body" cx="${x}" cy="${y}" r="${ballR}" fill="${fill}" stroke="${isCue ? '#1d2b36' : '#050b10'}" stroke-width="0.2"/>`;
    }
    if (!isCue) {
      svg += `<circle cx="${x}" cy="${y}" r="${ballR * 0.56}" fill="#f8fafc"/>`;
      svg += `<text x="${x}" y="${y + ballR * 0.3}" text-anchor="middle" fill="#05111b" font-size="${num >= 10 ? ballR * 0.72 : ballR * 0.84}" font-weight="900" font-family="system-ui,sans-serif">${num}</text>`;
    } else {
      svg += `<circle cx="${x - ballR * 0.3}" cy="${y - ballR * 0.32}" r="${ballR * 0.26}" fill="#ffffff" opacity="0.9"/>`;
    }
    svg += `</g></g>`;
  }

  if (spec.extraOver) svg += spec.extraOver;
  svg += `</svg>`;
  return svg;
}

export { POCKETS, BALL_COLORS, CUT_AUTO_MIN_DEG };
