/**
 * Stage table renderer — route visualisation on top of the shared tableDiagram SVG.
 * Cue-ball route: solid white with arrowhead. Object-ball route: dashed yellow with arrowhead.
 * Rail contacts: small diamonds on the cushion. Target zones: concentric rings with star labels.
 */
import { renderTableDiagram, BALL_RADIUS } from '../tableDiagram.js';

const BR = BALL_RADIUS;

const f = (v) => Math.round(v * 100) / 100;
const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join(' ');

function zoneSVG(z, { dim = false, label = true, current = false } = {}) {
  let s = `<g class="zone${z.obZone ? ' ob-zone' : ''}" clip-path="url(#feltClip)" opacity="${dim ? 0.45 : 1}">`;
  const base = z.obZone ? '255,211,77' : '85,229,255';
  if (z.type === 'band') {
    const rs = z.rings.slice().sort((a, b) => b.r - a.r);
    for (const r of rs) {
      const a = r.stars === 3 ? 0.45 : r.stars === 2 ? 0.26 : 0.14;
      s += `<rect class="zone-ring" data-stars="${r.stars}" x="${f(z.center - r.r)}" y="0" width="${f(r.r * 2)}" height="50" fill="rgba(${base},${a})" stroke="rgba(${base},0.9)" stroke-width="${r.stars === 3 ? 0.45 : 0.3}" stroke-dasharray="${r.stars === 3 ? '0' : '1.2 0.8'}"/>`;
    }
    if (label) {
      const right = z.center > 50;
      rs.forEach((r, i) => {
        const lx = right ? z.center - r.r + 0.5 : z.center + r.r - 0.5;
        s += `<text x="${f(lx)}" y="${f(6.1 + (2 - i) * 0)}" dy="${f((3 - r.stars) * 2.2)}" text-anchor="${right ? 'start' : 'end'}" font-size="1.7" font-weight="800" fill="#e8fbff" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.3" paint-order="stroke">${r.stars}★</text>`;
      });
    }
  } else {
    const rs = z.rings.slice().sort((a, b) => b.r - a.r);
    for (const r of rs) {
      const a = r.stars === 3 ? 0.5 : r.stars === 2 ? 0.26 : 0.13;
      s += `<circle class="zone-ring" data-stars="${r.stars}" cx="${f(z.x)}" cy="${f(z.y)}" r="${f(r.r)}" fill="rgba(${base},${a})" stroke="rgba(${base},0.95)" stroke-width="${r.stars === 3 ? 0.45 : 0.3}" stroke-dasharray="${r.stars === 3 ? '0' : '1.2 0.8'}"/>`;
    }
    if (label) {
      for (const r of rs) {
        if (r.stars === 3) continue;
        const ly = z.y - r.r + 1.5;
        s += `<text x="${f(z.x)}" y="${f(ly)}" text-anchor="middle" font-size="1.45" font-weight="800" fill="#e8fbff" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.28" paint-order="stroke">${r.stars}★</text>`;
      }
    }
  }
  s += `</g>`;
  if (label && z.type !== 'band') {
    const outer = Math.max(...z.rings.map((r) => r.r));
    const txt = z.obZone ? 'OB SAFE' : z.forBall != null ? `${z.step ? z.step + ': ' : ''}FOR ${z.forBall}` : '';
    if (txt) {
      const ty = z.y + outer + 2.2 > 49 ? z.y - outer - 0.8 : z.y + outer + 2.2;
      s += `<text class="zone-label" x="${f(Math.max(7, Math.min(93, z.x)))}" y="${f(ty)}" text-anchor="middle" font-size="1.8" font-weight="800" fill="${current ? '#ffffff' : z.obZone ? '#ffd34d' : '#9ff0ff'}" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.35" paint-order="stroke">${txt}</text>`;
    }
  }
  return s;
}

function railMarkSVG(m) {
  const c = m.by === 'ob' ? '#ffd34d' : '#f2fdff';
  const s = 0.8;
  return `<polygon class="rail-mark" data-rail="${m.rail}" points="${f(m.x)},${f(m.y - s)} ${f(m.x + s)},${f(m.y)} ${f(m.x)},${f(m.y + s)} ${f(m.x - s)},${f(m.y)}" fill="${c}" stroke="#062a32" stroke-width="0.25"/>`;
}

/**
 * @param {object} ch challenge
 * @param {object} opt { showCuePath, showAim, showObPath, showZones, step (train step index), dimOtherZones, highlight }
 */
export function renderStageTable(ch, opt = {}) {
  const o = { showCuePath: true, showAim: true, showObPath: true, showZones: true, ...opt };
  const step = ch.steps && o.step != null ? ch.steps[o.step] : null;
  const src = step || ch;
  let under = '';
  let over = '';
  if (o.showZones) {
    const zones = ch.targetZones || [];
    for (const z of zones) {
      const isCur = step ? z.step === o.step + 1 : true;
      under += zoneSVG(z, { dim: step && !isCur, current: isCur && !!step });
    }
  }
  if (o.showObPath) {
    const obPaths = step ? [{ points: step.objectBallPath }] : ch.objectBallPaths || [];
    for (const p of obPaths) {
      if (!p.points || p.points.length < 2) continue;
      under += `<path class="ob-path" d="${pathD(p.points)}" fill="none" stroke="#ffd34d" stroke-width="0.42" stroke-dasharray="1.3 0.8" stroke-linecap="round" marker-end="url(#obArrow)" opacity="0.95"/>`;
    }
  }
  if (o.allSteps && ch.steps) {
    // full pattern: every step's object-ball line and cue-ball route
    for (const st of ch.steps) {
      if (st.objectBallPath?.length >= 2) under += `<path class="ob-path" d="${pathD(st.objectBallPath)}" fill="none" stroke="#ffd34d" stroke-width="0.36" stroke-dasharray="1.3 0.8" marker-end="url(#obArrow)" opacity="0.8"/>`;
      const post = (st.cueBallPath || []).slice(1);
      if (post.length >= 2) under += `<path class="cue-path cue-route" d="${pathD(post)}" fill="none" stroke="#f2fdff" stroke-width="0.4" stroke-linejoin="round" marker-end="url(#cueArrow)" opacity="0.85"/>`;
      for (const m of st.railContacts || []) over += railMarkSVG(m);
    }
  }
  const cp = o.allSteps ? [] : src.cueBallPath || [];
  const ci = src.contactIndex ?? ch.contactIndex ?? 1;
  if (cp.length >= 2 && (o.showAim || o.showCuePath)) {
    const pre = cp.slice(0, ci + 1);
    const post = cp.slice(ci);
    if (ch.kind === 'kick' && (o.showAim || o.showCuePath) && pre.length >= 2) {
      under += `<path class="cue-path cue-route" d="${pathD(pre)}" fill="none" stroke="#f2fdff" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#cueArrow)"/>`;
    } else if (o.showAim && pre.length >= 2) {
      under += `<path class="cue-path cue-aim" d="${pathD(pre)}" fill="none" stroke="#f2fdff" stroke-width="0.3" stroke-opacity="0.75" stroke-linecap="round"${post.length < 2 ? ' marker-end="url(#cueArrow)"' : ''}/>`;
    }
    if (o.showCuePath && post.length >= 2) {
      under += `<path class="cue-path cue-route" d="${pathD(post)}" fill="none" stroke="#f2fdff" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#cueArrow)"/>`;
    }
  }
  if (o.showAim && src.ghost && ch.kind !== 'lag') {
    under += `<circle class="ghost-spot" cx="${f(src.ghost.x)}" cy="${f(src.ghost.y)}" r="${BR}" fill="#ffffff1c" stroke="#cff9ff" stroke-width="0.2" stroke-dasharray="0.45 0.3"/>`;
  }
  const marks = (step ? step.railContacts : ch.railContacts) || [];
  for (const m of marks) {
    if (m.by === 'cue' && !o.showCuePath && !(ch.kind === 'kick' && o.showAim)) continue;
    if (m.by === 'ob' && !o.showObPath) continue;
    over += railMarkSVG(m);
  }
  if (o.showAim && ch.contactLabels) {
    for (const l of ch.contactLabels) {
      over += `<g class="contact-label"><circle cx="${f(l.x)}" cy="${f(l.y - 2.9)}" r="1.25" fill="#ffc75b" stroke="#062a32" stroke-width="0.22"/><text x="${f(l.x)}" y="${f(l.y - 2.35)}" text-anchor="middle" font-size="1.6" font-weight="900" fill="#062a32" font-family="system-ui,sans-serif">${l.label}</text></g>`;
    }
  }
  if (ch.steps && o.showOrder !== false && o.orderBadges) {
    ch.steps.forEach((s, i) => {
      const b = ch.ballPositions.find((q) => q.n === s.ball);
      if (!b) return;
      over += `<g class="order-badge"><circle cx="${f(b.x + 1.9)}" cy="${f(b.y - 1.9)}" r="1.15" fill="#19b8ff" stroke="#062a32" stroke-width="0.25"/><text x="${f(b.x + 1.9)}" y="${f(b.y - 1.4)}" text-anchor="middle" font-size="1.5" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${i + 1}</text></g>`;
    });
  }
  if (o.pickedOrder) {
    o.pickedOrder.forEach((n, i) => {
      const b = ch.ballPositions.find((q) => q.n === n);
      if (!b) return;
      over += `<g class="pick-badge"><circle cx="${f(b.x - 1.9)}" cy="${f(b.y - 1.9)}" r="1.15" fill="#ffc75b" stroke="#062a32" stroke-width="0.25"/><text x="${f(b.x - 1.9)}" y="${f(b.y - 1.4)}" text-anchor="middle" font-size="1.5" font-weight="900" fill="#062a32" font-family="system-ui,sans-serif">${i + 1}</text></g>`;
    });
  }
  let balls = [];
  if (ch.cueBallPosition) {
    const cb = step ? step.cueFrom : ch.cueBallPosition;
    balls.push({ id: 'cue', x: cb.x, y: cb.y });
  }
  const pocketed = new Set(step ? ch.steps.slice(0, o.step).map((s) => s.ball) : []);
  for (const b of ch.ballPositions || []) if (!pocketed.has(b.n)) balls.push({ id: b.n, x: b.x, y: b.y });
  for (const b of ch.blockers || []) balls.push({ id: b.n, x: b.x, y: b.y, blocker: true });
  const spec = {
    balls,
    targetPocket: o.hidePocket ? null : (step ? step.pocket : ch.targetPocket) || undefined,
    showGhostBall: false,
    headString: true,
    extraUnder: under,
    extraOver: over
  };
  return renderTableDiagram(spec, { compact: false, className: o.className || 'table-diagram stage-table' });
}

export function legendHTML(ch) {
  const items = [
    '<span><i class="lg-cue"></i>Cue ball</span>',
    '<span><i class="lg-ob"></i>Object ball</span>',
    '<span><i class="lg-rail"></i>Rail</span>',
    '<span><i class="lg-zone"></i>Zone</span>'
  ];
  if (ch.blockers && ch.blockers.length) items.push('<span><i class="lg-block"></i>Blocker</span>');
  return `<div class="legend">${items.join('')}</div>`;
}
