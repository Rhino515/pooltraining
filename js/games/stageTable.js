/**
 * Stage table renderer — route visualisation on top of the shared tableDiagram SVG.
 * Cue-ball route: solid white with arrowhead. Object-ball route: dashed yellow with arrowhead.
 * Rail contacts: small diamonds on the cushion. Target zones: a photo bullseye (green, red, dark center) with no numbers.
 */
import { renderTableDiagram, BALL_RADIUS } from '../tableDiagram.js';
import { DIAGRAM_RE } from '../content/schema.js';

const BR = BALL_RADIUS;

const f = (v) => Math.round(v * 100) / 100;
const pathD = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join(' ');

/** Photo bullseye. Stars stay on the ring data (3 center, 2 middle, 1 outer) but are not drawn. */
const PHOTO_RING = { 1: '#2fbe4a', 2: '#e21b2d', 3: '#14161a' };
function photoColor(stars) {
  return PHOTO_RING[stars] || PHOTO_RING[1];
}
function zoneSVG(z, { dim = false, label = true, current = false, index = 0 } = {}) {
  let s = `<g class="zone bullseye${z.obZone ? ' ob-zone' : ''}" data-zone-i="${index}" clip-path="url(#feltClip)" opacity="${dim ? 0.45 : 1}">`;
  if (z.type === 'band') {
    const rs = z.rings.slice().sort((a, b) => b.r - a.r);
    for (const r of rs) {
      const col = photoColor(r.stars);
      s += `<rect class="zone-ring" data-stars="${r.stars}" data-bullseye-color="${col}" x="${f(z.center - r.r)}" y="0" width="${f(r.r * 2)}" height="50" fill="${col}" stroke="${col}" stroke-width="0.15"/>`;
    }
  } else {
    const rs = z.rings.slice().sort((a, b) => b.r - a.r);
    for (const r of rs) {
      const col = photoColor(r.stars);
      s += `<circle class="zone-ring" data-stars="${r.stars}" data-bullseye-color="${col}" cx="${f(z.x)}" cy="${f(z.y)}" r="${f(r.r)}" fill="${col}" stroke="${col}" stroke-width="0.12"/>`;
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

/** Rail + diamond → point on the cushion nose (same convention as the .pooliq schema) */
export function railDiamondPoint(rail, d) {
  const v = Number(d) * 12.5;
  return rail === 'top' ? { x: v, y: 0 } : rail === 'bottom' ? { x: v, y: 50 } : rail === 'left' ? { x: 0, y: v } : { x: 100, y: v };
}
const INWARD = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] };
const MARK_COLORS = { reference: '#9ff0ff', aim: '#ffc75b', contact: '#f2fdff', target: '#ff8fa3', player: '#ffc75b', answer: '#39d98a' };
/** Reference / answer pin on a rail: a triangle on the cushion pointing into the table + optional label */
function railPinSVG(m, cls = 'ref-marker') {
  const p = railDiamondPoint(m.rail, m.diamond);
  const [ix, iy] = INWARD[m.rail] || [0, 1];
  const c = MARK_COLORS[m.kind || 'reference'] || MARK_COLORS.reference;
  const tip = { x: p.x + ix * 0.2, y: p.y + iy * 0.2 };
  const b1 = { x: p.x - ix * 1.9 - iy * 1.1, y: p.y - iy * 1.9 - ix * 1.1 };
  const b2 = { x: p.x - ix * 1.9 + iy * 1.1, y: p.y - iy * 1.9 + ix * 1.1 };
  let g = `<g class="${cls}" data-rail="${m.rail}" data-diamond="${f(m.diamond)}" data-kind="${m.kind || 'reference'}"><polygon points="${f(tip.x)},${f(tip.y)} ${f(b1.x)},${f(b1.y)} ${f(b2.x)},${f(b2.y)}" fill="${c}" stroke="#062a32" stroke-width="0.25"/>`;
  if (m.line) g += `<line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(p.x + ix * 6)}" y2="${f(p.y + iy * 6)}" stroke="${c}" stroke-width="0.3" stroke-dasharray="0.8 0.5"/>`;
  if (m.label) {
    const dep = 3.4 + (Number(m.labelShift) || 0); // labelShift: stack a second pin's label further in
    const lx = Math.max(4, Math.min(96, p.x + ix * dep));
    const ly = Math.max(2.4, Math.min(48.6, p.y + iy * dep + (iy ? 0.55 : 0.55)));
    g += `<text x="${f(lx)}" y="${f(ly)}" text-anchor="${m.rail === 'left' ? 'start' : m.rail === 'right' ? 'end' : 'middle'}" font-size="1.7" font-weight="800" fill="${c}" font-family="system-ui,sans-serif" stroke="#062a32" stroke-width="0.35" paint-order="stroke">${escT(m.label)}</text>`;
  }
  return `${g}</g>`;
}
const escT = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
/** Diamond numbers along every rail (0–8 long rails, 0–4 short rails) for rail-answer challenges */
function diamondNumbersSVG() {
  let s = '<g class="diamond-numbers" font-size="1.6" font-weight="800" fill="#cdeefa" opacity="0.75" font-family="system-ui,sans-serif" text-anchor="middle" pointer-events="none">';
  for (let d = 1; d < 8; d++) s += `<text x="${d * 12.5}" y="2.6">${d}</text><text x="${d * 12.5}" y="48.6">${d}</text>`;
  for (let d = 1; d < 4; d++) s += `<text x="2.2" y="${d * 12.5 + 0.55}">${d}</text><text x="97.8" y="${d * 12.5 + 0.55}">${d}</text>`;
  return `${s}</g>`;
}

/**
 * @param {object} ch challenge
 * @param {object} opt { showCuePath, showAim, showObPath, showZones, step (train step index), dimOtherZones, highlight }
 */
/** Photo that replaces the drawn table. A shipped Exam I page, or an uploaded diagramImage. "off" means draw the table. */
export function diagramSrc(ch) {
  if (!ch || ch.diagramImage === 'off') return '';
  if (typeof ch.diagramImage === 'string' && DIAGRAM_RE.test(ch.diagramImage)) return ch.diagramImage;
  const id = String(ch.id || '');
  if (/^bu-f[1-8]$/.test(id)) return `./images/bu/${id}.png`;
  return '';
}

export function renderStageTable(ch, opt = {}) {
  const pic = opt.forceDrawn ? '' : diagramSrc(ch);
  if (pic) {
    const cls = escT(opt.className || 'table-diagram');
    const alt = escT(ch.name || ch.title || 'Drill diagram');
    return `<img class="${cls} drill-diagram" src="${escT(pic)}" alt="${alt}" />`;
  }
  const o = { showCuePath: true, showAim: true, showObPath: true, showZones: true, ...opt };
  const step = ch.steps && o.step != null ? ch.steps[o.step] : null;
  const src = step || ch;
  let under = '';
  let over = '';
  if (o.showZones) {
    const zones = ch.targetZones || [];
    zones.forEach((z, i) => {
      const isCur = step ? z.step === o.step + 1 : true;
      under += zoneSVG(z, { dim: step && !isCur, current: isCur && !!step, index: i });
    });
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
  // v11.1 multi-lane drills: every lane's start spot and route (overview diagram)
  if (ch.laneOverlay && o.showCuePath) {
    for (const l of ch.laneOverlay) {
      if (l.path?.length >= 2) under += `<path class="cue-path cue-route lane-route" data-lane="${l.key}" d="${pathD(l.path)}" fill="none" stroke="#f2fdff" stroke-width="0.38" stroke-linecap="round" stroke-linejoin="round" opacity="${l.active === false ? 0.3 : l.active ? 0.95 : 0.7}" marker-end="url(#cueArrow)"/>`;
      if (l.start && (l.start.x !== ch.cueBallPosition?.x || l.start.y !== ch.cueBallPosition?.y)) over += `<circle class="lane-start" data-lane="${l.key}" cx="${f(l.start.x)}" cy="${f(l.start.y)}" r="${BR}" fill="#f7fbff" stroke="#062a32" stroke-width="0.25"/>`;
    }
    // Lane speed stays in the lane tag. Do not print numbers inside the bullseye.
  }
  const cp = o.allSteps || ch.laneOverlay ? [] : src.cueBallPath || [];
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
  const ghostPt = src.ghost || ch.ghost;
  const headOn = !!(src.headOnFixed || ch.headOnFixed);
  if ((o.showAim || headOn) && ghostPt && ch.kind !== 'lag') {
    const ghostSVG = headOn
      ? `<circle class="ghost-spot" cx="${f(ghostPt.x)}" cy="${f(ghostPt.y)}" r="${BR}" fill="none" stroke="#f2fdff" stroke-width="0.28"/>`
      : `<circle class="ghost-spot" cx="${f(ghostPt.x)}" cy="${f(ghostPt.y)}" r="${BR}" fill="#ffffff1c" stroke="#cff9ff" stroke-width="0.2" stroke-dasharray="0.45 0.3"/>`;
    if (headOn) over += ghostSVG;
    else under += ghostSVG;
  }
  for (const ln of ch.guideLines || []) {
    if (!ln.points || ln.points.length < 2) continue;
    const col = /^#[0-9a-fA-F]{6}$/.test(ln.color || '') ? ln.color : '#f4f7fb';
    under += `<path class="guide-line" d="${pathD(ln.points)}" fill="none" stroke="${col}" stroke-width="0.32" stroke-linecap="round"/>`;
  }
  for (const spot of ch.cueSpots || []) {
    const ghost = !!spot.ghost;
    over += `<circle class="cue-spot${ghost ? ' is-ghost' : ''}" cx="${f(spot.x)}" cy="${f(spot.y)}" r="${BR}" fill="${ghost ? '#ffffff33' : '#f7fbff'}" stroke="${ghost ? '#d7e2ea' : '#062a32'}" stroke-width="0.22"${ghost ? ' stroke-dasharray="0.45 0.32"' : ''}/>`;
  }
  const marks = (step ? step.railContacts : ch.railContacts) || [];
  for (const m of marks) {
    if (m.by === 'cue' && !o.showCuePath && !(ch.kind === 'kick' && o.showAim)) continue;
    if (m.by === 'ob' && !o.showObPath) continue;
    over += railMarkSVG(m);
  }
  // .pooliq reference markers (diamond / reference points). o.markers: 'all' (default) | 'reference' (hide solution kinds) | 'none'
  const mk = o.markers || 'all';
  if (mk !== 'none') for (const m of ch.referenceMarkers || []) if (mk === 'all' || !m.kind || m.kind === 'reference') over += railPinSVG(m);
  if (o.diamondNumbers) over += diamondNumbersSVG();
  for (const pin of o.pins || []) over += railPinSVG({ ...pin, line: true }, `answer-pin pin-${pin.kind}`);
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

function marksSVG(marks) {
  let s = '';
  const esc = escT;
  for (const [i, m] of (marks || []).entries()) {
    const hot = m.hot ? ' hot' : '';
    const op = m.dim ? 0.28 : 1;
    if (m.type === 'grid') {
      s += `<g class="tmark diamond-guides" data-mark-i="${i}" opacity="0.55">`;
      for (const x of [12.5, 25, 37.5, 50, 62.5, 75, 87.5]) s += `<line x1="${x}" y1="0" x2="${x}" y2="50" stroke="#d5eee4" stroke-width="0.18"/>`;
      for (const y of [12.5, 25, 37.5]) s += `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="#d5eee4" stroke-width="0.18"/>`;
      s += `</g>`;
      continue;
    }
    if (m.type === 'path' || m.type === 'arrow') {
      const pts = m.points?.length ? m.points : (m.x1 != null ? [{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }] : []);
      if (pts.length < 2) continue;
      const col = m.color || '#f2fdff';
      const dash = m.dashed !== false && m.type !== 'arrow' ? ' stroke-dasharray="1.3 0.8"' : (m.dashed ? ' stroke-dasharray="1.3 0.8"' : '');
      s += `<g class="tmark${hot}" data-mark-i="${i}" opacity="${op}"><path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="${m.hot ? 0.7 : 0.42}" stroke-linecap="round" stroke-linejoin="round"${dash} marker-end="url(#arrowHead)"/></g>`;
      continue;
    }
    if (m.type === 'ghost') {
      s += `<g class="tmark${hot}" data-mark-i="${i}"><circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(m.r || BR)}" fill="none" stroke="${m.color || '#f4f7fb'}" stroke-width="0.28" stroke-dasharray="0.45 0.32"/></g>`;
      continue;
    }
    if (m.type === 'spot') {
      s += `<g class="tmark${hot}" data-mark-i="${i}"><circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(m.r || 0.55)}" fill="${m.color || '#1a1a1a'}" stroke="#062a32" stroke-width="0.12"/></g>`;
      continue;
    }
    if (m.type === 'marker') {
      const r = m.r || 1.35;
      s += `<g class="tmark${hot}" data-mark-i="${i}" opacity="${op}"><circle cx="${f(m.x)}" cy="${f(m.y)}" r="${f(r)}" fill="${m.hot ? '#ffc75b' : 'none'}" stroke="${m.color || '#f4f7fb'}" stroke-width="0.28"/>${m.n != null ? `<text x="${f(m.x)}" y="${f(m.y + 0.45)}" text-anchor="middle" font-size="1.5" font-weight="800" fill="${m.hot ? '#062a32' : '#f4f7fb'}" font-family="system-ui,sans-serif">${m.n}</text>` : ''}</g>`;
      continue;
    }
    if (m.type === 'rect' || m.type === 'paper') {
      const stroke = m.color || '#f4f7fb';
      const fill = m.type === 'paper' ? 'none' : (m.fill ? 'rgba(180,180,180,0.45)' : 'none');
      const sw = m.hot ? 0.7 : 0.4;
      s += `<g class="tmark${hot}" data-mark-i="${i}" opacity="${op}"><rect x="${f(m.x)}" y="${f(m.y)}" width="${f(m.w)}" height="${f(m.h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${m.type === 'paper' ? '' : (m.dashed ? ' stroke-dasharray="1.1 0.7"' : '')}/>${m.n != null ? `<text x="${f(m.x + m.w / 2)}" y="${f(m.y + m.h / 2 + 0.7)}" text-anchor="middle" font-size="2.4" font-weight="800" fill="#f4f7fb" font-family="system-ui,sans-serif">${m.n}</text>` : ''}</g>`;
      continue;
    }
    if (m.type === 'label') {
      const lines = String(m.text || '').split('\n');
      const size = m.size || 2.05;
      const anchor = m.anchor || 'middle';
      s += `<g class="tmark${hot}" data-mark-i="${i}">`;
      lines.forEach((line, li) => {
        s += `<text x="${f(m.x)}" y="${f(m.y + li * (size + 0.35))}" text-anchor="${anchor}" font-size="${size}" font-weight="700" fill="${m.color || '#1c2428'}" font-family="system-ui,sans-serif">${esc(line)}</text>`;
      });
      s += `</g>`;
      continue;
    }
    if (m.type === 'wheel') {
      const x = m.x, y = m.y, r = m.r || 8;
      s += `<g class="tmark wagon" data-mark-i="${i}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="#e7eef2" stroke-width="0.4"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.28)}" fill="none" stroke="#e7eef2" stroke-width="0.3"/>`;
      for (const a of [0, 45, 90, 135]) {
        const rad = a * Math.PI / 180;
        s += `<line x1="${f(x + Math.cos(rad) * r * 0.28)}" y1="${f(y + Math.sin(rad) * r * 0.28)}" x2="${f(x + Math.cos(rad) * r)}" y2="${f(y + Math.sin(rad) * r)}" stroke="#e7eef2" stroke-width="0.28"/>`;
      }
      s += `</g>`;
    }
  }
  return s;
}

  if (ch.tableMarks?.length) over += marksSVG(ch.tableMarks);
  let balls = [];
  if (ch.cueBallPosition) {
    const cb = step ? step.cueFrom : ch.cueBallPosition;
    balls.push({ id: 'cue', x: cb.x, y: cb.y });
  }
  if (!step) (ch.extraCueBalls || []).forEach((c, i) => balls.push({ id: 'cue', x: c.x, y: c.y, extra: i }));
  const pocketed = new Set(step ? ch.steps.slice(0, o.step).map((s) => s.ball) : []);
  for (const b of ch.ballPositions || []) if (!pocketed.has(b.n)) balls.push({ id: b.n, x: b.x, y: b.y });
  for (const b of ch.blockers || []) balls.push({ id: b.n, x: b.x, y: b.y, blocker: true });
  const spec = {
    balls,
    targetPocket: o.hidePocket ? null : (step ? step.pocket : ch.targetPocket) || undefined,
    targetPockets: o.hidePocket ? [] : (step?.pocket ? [step.pocket] : (ch.acceptPockets?.length ? ch.acceptPockets.slice() : (ch.targetPocket ? [ch.targetPocket] : []))),
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
