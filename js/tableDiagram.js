/**
 * Reusable SVG pool table diagram renderer.
 * Coordinate system: 0–100 on a 2:1 table (viewBox="0 0 100 50").
 * x: 0 left rail → 100 right rail; y: 0 top rail → 50 bottom rail.
 */

const POCKETS = {
  TL: { x: 2.5, y: 2.5, label: 'TL' },
  TM: { x: 50, y: 1.8, label: 'TM' },
  TR: { x: 97.5, y: 2.5, label: 'TR' },
  BL: { x: 2.5, y: 47.5, label: 'BL' },
  BM: { x: 50, y: 48.2, label: 'BM' },
  BR: { x: 97.5, y: 47.5, label: 'BR' }
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
  svg += `<circle class="ghost-ball" cx="${gx}" cy="${gy}" r="${ballR}" fill="#ffffff28" stroke="#a8f0ff" stroke-width="0.45" stroke-dasharray="1.1 0.7" opacity="0.95"/>`;
  // Second ring
  svg += `<circle class="ghost-ball-ring" cx="${gx}" cy="${gy}" r="${ballR * 0.55}" fill="none" stroke="#55e5ff" stroke-width="0.28" opacity="0.75"/>`;
  // Crosshair
  const ch = ballR * 0.35;
  svg += `<line x1="${gx - ch}" y1="${gy}" x2="${gx + ch}" y2="${gy}" stroke="#cff9ff" stroke-width="0.28" opacity="0.85"/>`;
  svg += `<line x1="${gx}" y1="${gy - ch}" x2="${gx}" y2="${gy + ch}" stroke="#cff9ff" stroke-width="0.28" opacity="0.85"/>`;

  // Aim line: cue → ghost (gold), with arrow
  svg += `<line class="ghost-aim" x1="${cue.x}" y1="${cue.y}" x2="${gx}" y2="${gy}" stroke="#ffc75b" stroke-width="0.65" marker-end="url(#ghostAimArrow)" opacity="0.95"/>`;

  // Object path: OB → pocket (dashed cyan) — drawn here so it sits under balls with ghost aim
  svg += `<line class="ghost-ob-path" x1="${ob.x}" y1="${ob.y}" x2="${pocket.x}" y2="${pocket.y}" stroke="#65e9ff" stroke-width="0.5" stroke-dasharray="1.4 1" opacity="0.85" marker-end="url(#arrowHead)"/>`;

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
  const ballR = compact ? 2.2 : 2.8;
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

  let svg = `<svg class="${esc(className)}" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pool table drill diagram" preserveAspectRatio="xMidYMid meet">`;

  // Rails / felt
  svg += `<defs>
    <radialGradient id="feltGrad" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="#147a7e"/>
      <stop offset="55%" stop-color="#0a4d56"/>
      <stop offset="100%" stop-color="#073840"/>
    </radialGradient>
    <filter id="ballShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0.2" dy="0.4" stdDeviation="0.35" flood-opacity="0.45"/>
    </filter>
    <marker id="arrowHead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
      <path d="M0,0 L4,2 L0,4 Z" fill="#55e5ff"/>
    </marker>
    <marker id="ghostAimArrow" markerWidth="4.5" markerHeight="4.5" refX="3.2" refY="2.25" orient="auto">
      <path d="M0,0 L4.5,2.25 L0,4.5 Z" fill="#ffc75b"/>
    </marker>
  </defs>`;

  // Outer rail
  svg += `<rect x="0" y="0" width="100" height="50" rx="3.2" ry="3.2" fill="#1a3344" stroke="#2a5570" stroke-width="0.6"/>`;
  // Felt
  svg += `<rect x="2.2" y="2.2" width="95.6" height="45.6" rx="1.6" ry="1.6" fill="url(#feltGrad)" stroke="#0d3a42" stroke-width="0.3"/>`;
  // Inner cushion line hint
  svg += `<rect x="3.4" y="3.4" width="93.2" height="43.2" rx="1" ry="1" fill="none" stroke="#1a6a72" stroke-width="0.25" opacity="0.5"/>`;

  // Head string
  if (headString) {
    svg += `<line x1="25" y1="3.5" x2="25" y2="46.5" stroke="#55e5ff" stroke-width="0.25" stroke-dasharray="1.2 1.2" opacity="0.45"/>`;
    if (!compact) {
      svg += `<text x="25" y="48.6" text-anchor="middle" fill="#7eb8c8" font-size="1.8" font-family="system-ui,sans-serif" opacity="0.7">HEAD</text>`;
    }
  }

  // Diamond marks (simple)
  const diamonds = [
    [12.5, 2.4], [25, 2.4], [37.5, 2.4], [62.5, 2.4], [75, 2.4], [87.5, 2.4],
    [12.5, 47.6], [25, 47.6], [37.5, 47.6], [62.5, 47.6], [75, 47.6], [87.5, 47.6],
    [2.4, 12.5], [2.4, 25], [2.4, 37.5],
    [97.6, 12.5], [97.6, 25], [97.6, 37.5]
  ];
  for (const [dx, dy] of diamonds) {
    svg += `<circle cx="${dx}" cy="${dy}" r="0.45" fill="#c9e6f0" opacity="0.55"/>`;
  }

  // Pockets
  for (const [key, p] of Object.entries(POCKETS)) {
    const isTarget = pocket && pocket.label === key;
    const r = key.includes('M') ? 2.4 : 2.8;
    svg += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#020508" stroke="${isTarget ? '#55e5ff' : '#0a1520'}" stroke-width="${isTarget ? 0.7 : 0.25}"/>`;
    if (isTarget) {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="${r + 1.4}" fill="none" stroke="#55e5ff" stroke-width="0.45" stroke-dasharray="1.2 0.8" opacity="0.9">
        <animate attributeName="opacity" values="0.55;1;0.55" dur="2s" repeatCount="indefinite"/>
      </circle>`;
      if (!compact) {
        svg += `<text x="${p.x}" y="${p.y > 25 ? p.y - 4.2 : p.y + 5.2}" text-anchor="middle" fill="#55e5ff" font-size="2.2" font-weight="700" font-family="system-ui,sans-serif">TARGET</text>`;
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
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${path.width || 0.55}" ${dash} opacity="0.9" marker-end="url(#arrowHead)"/>`;
  }

  // CB movement arrows (separate from shot paths)
  for (const arrow of arrows) {
    const x1 = arrow.from?.x ?? arrow[0];
    const y1 = arrow.from?.y ?? arrow[1];
    const x2 = arrow.to?.x ?? arrow[2];
    const y2 = arrow.to?.y ?? arrow[3];
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffc75b" stroke-width="0.6" marker-end="url(#arrowHead)" opacity="0.95"/>`;
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

  // Balls
  for (const b of balls) {
    const id = b.id != null ? b.id : b[0];
    const x = b.x != null ? b.x : b[1];
    const y = b.y != null ? b.y : b[2];
    const isCue = isCueBall(id);
    const num = isCue ? null : Number(id);
    const fill = isCue ? BALL_COLORS.cue : BALL_COLORS[num] || '#94a3b8';
    const stroke = isCue ? '#94a3b8' : num === 8 ? '#e5e7eb' : '#ffffffaa';
    const textFill = isCue ? 'transparent' : num === 8 ? '#fff' : '#05111b';
    svg += `<g filter="url(#ballShadow)">`;
    svg += `<circle cx="${x}" cy="${y}" r="${ballR}" fill="${fill}" stroke="${stroke}" stroke-width="0.35"/>`;
    if (!isCue) {
      // stripe hint for 9–15
      if (num >= 9) {
        svg += `<rect x="${x - ballR}" y="${y - ballR * 0.45}" width="${ballR * 2}" height="${ballR * 0.9}" fill="#f8fafc" opacity="0.85"/>`;
        svg += `<circle cx="${x}" cy="${y}" r="${ballR}" fill="none" stroke="${stroke}" stroke-width="0.35"/>`;
      }
      svg += `<circle cx="${x}" cy="${y}" r="${ballR * 0.55}" fill="#f8fafc"/>`;
      svg += `<text x="${x}" y="${y + 0.85}" text-anchor="middle" fill="${num === 8 ? '#111' : textFill}" font-size="${compact ? 2.2 : 2.6}" font-weight="800" font-family="system-ui,sans-serif">${num}</text>`;
    } else if (!compact) {
      svg += `<circle cx="${x - 0.6}" cy="${y - 0.7}" r="0.55" fill="#ffffff88"/>`;
    }
    svg += `</g>`;
  }

  svg += `</svg>`;
  return svg;
}

export { POCKETS, BALL_COLORS, CUT_AUTO_MIN_DEG };
