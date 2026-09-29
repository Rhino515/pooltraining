/**
 * Shot Simulator full-path aim preview (v11.1).
 *
 * Runs the SAME deterministic physics as the SHOOT button (js/sim/physics.js simulate, same layout, aim,
 * launch speed and tip) headlessly, then turns the result into drawable paths: the cue ball and every ball
 * it sets moving, through every cushion, until each ball stops or drops. Recording frames never changes the
 * physics, so the preview's end positions are exactly where the real shot finishes (verify.mjs + e2e check it).
 * Pure module (no DOM) so tests can call it directly.
 */
import { simulate, R } from './physics.js';
import { POCKETS, BALL_COLORS } from '../tableDiagram.js';

export const PREVIEW_MAX_STEPS = 40000; // hard cap per preview run (a 15-ball break at SPEED 7 needs ~2–3k)
export const PREVIEW_FRAME_DT = 1 / 120;
export const PREVIEW_THROTTLE_MS = 80;

const f = (v) => Math.round(v * 100) / 100;
const isCueId = (id) => id === 'cue';

/** Run the preview simulation for a layout + shot ({aim, V|speed, vTips, hTips}) — identical inputs to shoot() */
export function runPreview(layout, shot) {
  return simulate(layout, shot, { maxTime: 40, frameDt: PREVIEW_FRAME_DT, maxSteps: PREVIEW_MAX_STEPS });
}

/** Where a cushion contact label sits: on the cushion nose next to the contact */
function railLabelPoint(e) {
  const out = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[e.rail] || [0, 0];
  return { x: e.x + out[0] * (R - 0.1), y: e.y + out[1] * (R - 0.1) };
}

/**
 * Paths for every ball that moves.
 * @returns {Array<{id, role:'cue'|'ob'|'other', points:{x,y}[], rails:{n,x,y,rail}[], end:{type:'pocket'|'stop', x, y, pocket?}}>}
 */
export function previewPaths(res) {
  if (!res) return [];
  const firstOb = res.firstHit ? res.firstHit.ob : null;
  const out = [];
  res.ids.forEach((id, i) => {
    if (!(res.distance[id] > 0.05)) return;
    const pts = [];
    for (const fr of res.frames) {
      const p = fr.p[i];
      if (!p) break;
      pts.push({ t: fr.t, x: p[0], y: p[1] });
    }
    const evs = [];
    for (const e of res.events) {
      if (e.type === 'cushion' || e.type === 'jaw') { if (e.ball === id) evs.push({ t: e.t, x: e.x, y: e.y, cushion: e.type === 'cushion', rail: e.rail, e }); }
      else if (e.type === 'ball') {
        if (e.a === id && e.pa) evs.push({ t: e.t, x: e.pa.x, y: e.pa.y });
        else if (e.b === id && e.pb) evs.push({ t: e.t, x: e.pb.x, y: e.pb.y });
      } else if (e.type === 'pocket' && e.ball === id) evs.push({ t: e.t, x: e.x, y: e.y, pocketEv: true });
    }
    const all = [...pts, ...evs].sort((a, b) => a.t - b.t);
    const fin = res.final[i];
    const pocket = fin.on ? null : fin.pocket;
    const end = pocket
      ? { type: 'pocket', pocket, x: POCKETS[pocket].x, y: POCKETS[pocket].y, dropX: fin.x, dropY: fin.y }
      : { type: 'stop', x: fin.x, y: fin.y };
    if (!pocket) all.push({ t: Infinity, x: fin.x, y: fin.y });
    // decimate: keep every event point, drop frame points closer than 0.25" to the last kept one
    const points = [];
    for (const p of all) {
      const last = points[points.length - 1];
      if (!last || p.cushion !== undefined || p.pocketEv || Math.hypot(p.x - last.x, p.y - last.y) > 0.25) points.push({ x: p.x, y: p.y });
    }
    if (pocket) points.push({ x: end.x, y: end.y });
    const rails = evs.filter((e) => e.cushion).map((e, k) => ({ n: k + 1, rail: e.rail, x: e.x, y: e.y, label: railLabelPoint(e) }));
    const role = isCueId(id) ? 'cue' : id === firstOb ? 'ob' : 'other';
    out.push({ id, role, points, rails, end });
  });
  // cue first, then the first object ball, then the rest
  const rank = { cue: 0, ob: 1, other: 2 };
  return out.sort((a, b) => rank[a.role] - rank[b.role]);
}

/** Short text summary, e.g. "Cue ball: 3 rails → STOP · 1-ball: 1 rail → POCKET" */
export function previewSummary(paths, { aimBall = null, aimPocket = null } = {}) {
  if (!paths.length) return 'Preview: nothing moves';
  return paths
    .filter((p) => p.role !== 'other')
    .map((p) => `${p.role === 'cue' ? 'Cue ball' : `${p.id}-ball`}: ${p.rails.length} rail${p.rails.length === 1 ? '' : 's'} → ${endTag(p, { aimBall, aimPocket })}`)
    .join(' · ');
}

export function endTag(p, { aimBall = null, aimPocket = null } = {}) {
  if (p.end.type === 'pocket') return p.role === 'cue' ? 'SCRATCH' : 'POCKET';
  if (p.role !== 'cue' && aimPocket && String(aimBall) === String(p.id)) return 'MISS';
  return 'STOP';
}

function tagSVG(x, y, text, color, cls) {
  const w = text.length * 1.12 + 1.4;
  const tx = Math.max(w / 2 + 0.3, Math.min(100 - w / 2 - 0.3, x));
  const ty = y < 5.5 ? y + 3.4 : y - 2.9;
  return `<g class="pv-tag ${cls}" data-tag="${text}"><rect x="${f(tx - w / 2)}" y="${f(ty - 1.45)}" width="${f(w)}" height="2.3" rx="0.6" fill="${color}" stroke="#062a32" stroke-width="0.18"/><text x="${f(tx)}" y="${f(ty + 0.32)}" text-anchor="middle" font-size="1.55" font-weight="900" fill="#062a32" font-family="system-ui,sans-serif">${text}</text></g>`;
}

const STYLE = {
  cue: { stroke: '#f4fbff', width: 0.34, dash: '1.1 0.55', label: '#f4fbff', tag: '#f4fbff' },
  ob: { stroke: '#ffd34d', width: 0.34, dash: '0.3 0.5', label: '#ffd34d', tag: '#ffd34d' }
};

/** SVG for the preview (inside the table's coordinate system) */
export function previewSVG(paths, { aimBall = null, aimPocket = null, truncated = false } = {}) {
  let s = `<g class="sim-preview" pointer-events="none" data-paths="${paths.length}"${truncated ? ' data-truncated="1"' : ''}>`;
  let labels = '';
  for (const p of paths) {
    const st = STYLE[p.role] || { stroke: p.id === 8 ? '#9aa6b8' : BALL_COLORS[p.id] || '#94a3b8', width: 0.22, dash: '0.6 0.6', label: null, tag: '#cbd5e1' };
    const pts = p.points.map((q) => `${f(q.x)},${f(q.y)}`).join(' ');
    if (p.points.length > 1) s += `<polyline class="pv-path pv-${p.role}" data-ball="${p.id}" points="${pts}" fill="none" stroke="${st.stroke}" stroke-width="${st.width}" stroke-dasharray="${st.dash}" stroke-linecap="round" stroke-linejoin="round" opacity="${p.role === 'other' ? 0.7 : 0.95}"/>`;
    if (st.label) {
      for (const r of p.rails) {
        labels += `<g class="pv-rail pv-rail-${p.role}" data-ball="${p.id}" data-n="${r.n}"><circle cx="${f(r.label.x)}" cy="${f(r.label.y)}" r="1.25" fill="${st.label}" stroke="#062a32" stroke-width="0.22"/><text x="${f(r.label.x)}" y="${f(r.label.y + 0.58)}" text-anchor="middle" font-size="1.6" font-weight="900" fill="#062a32" font-family="system-ui,sans-serif">${r.n}</text></g>`;
      }
    }
    const tag = endTag(p, { aimBall, aimPocket });
    const e = p.end;
    if (e.type === 'pocket') {
      const pk = POCKETS[e.pocket];
      const col = p.role === 'cue' ? '#ff5d73' : '#46e7a0';
      s += `<g class="pv-end pv-pocket" data-ball="${p.id}" data-end="pocket" data-pocket="${e.pocket}" data-x="${f(e.dropX)}" data-y="${f(e.dropY)}"><circle cx="${pk.x}" cy="${pk.y}" r="${f(pk.r + 1.1)}" fill="${col}33" stroke="${col}" stroke-width="0.5"/><circle cx="${pk.x}" cy="${pk.y}" r="${f(pk.r + 2)}" fill="none" stroke="${col}" stroke-width="0.25" stroke-dasharray="0.8 0.5"/></g>`;
      if (p.role !== 'other') labels += tagSVG(Math.max(4, Math.min(96, pk.x)), Math.max(4.2, Math.min(46, pk.y)) + (pk.y < 25 ? 3.2 : -1.6), tag, col, `pv-tag-${p.role}`);
    } else {
      s += `<g class="pv-end pv-stop" data-ball="${p.id}" data-end="${tag.toLowerCase()}" data-x="${f(e.x)}" data-y="${f(e.y)}"><circle cx="${f(e.x)}" cy="${f(e.y)}" r="${R}" fill="${st.stroke}22" stroke="${st.stroke}" stroke-width="0.3" stroke-dasharray="0.45 0.3"/><circle cx="${f(e.x)}" cy="${f(e.y)}" r="0.35" fill="${st.stroke}"/></g>`;
      if (p.role !== 'other') labels += tagSVG(e.x, e.y, tag, tag === 'MISS' ? '#ff5d73' : st.tag, `pv-tag-${p.role}`);
    }
  }
  return `${s}${labels}</g>`;
}
