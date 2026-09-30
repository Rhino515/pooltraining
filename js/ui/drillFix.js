/**
 * Phone editor for one shipped PKF drill (#drillfix/<id>) or one built-in stage (#devedit/<game>/<stage>).
 * Mounted only while drillEditorAllowed() is true. Drag balls on the table (¼-diamond nudge is the backup).
 * Bullseye matches the photo (green, red, dark center). Drag the center to move it, or EXPAND / DECREASE its rings.
 * FULL TABLE fills the phone so the same drag, nudge, size, and save work standing at the table.
 * The table is rotated with an SVG transform (not CSS) so the finger position maps on every phone.
 * Exit returns here.
 * Saves are local overrides. Shipped files do not change.
 */
import { renderStageTable } from '../games/stageTable.js';
import { techniqueName } from '../games/text.js';
import { formatSpeed, SPEED_STEPS } from '../games/speed.js';
import { DIAMOND_UNITS } from '../games/diamonds.js';
import { POCKETS } from '../tableDiagram.js';
import { TECHNIQUES } from '../content/schema.js';
import { snapPoint, freeSpot } from '../sim/layouts.js';
import { challengeFromPkfDoc } from '../content/pkfBuiltins.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { shareOrDownload } from './share.js';
import {
  drillEditorAllowed, canFixDrill, editingDoc, setDrillEdit, removeDrillEdit,
  getDrillEdit, exportAllEdits, shippedDoc
} from '../drills/ownerEdits.js';
import { getDrillById } from '../drills.js';
import { getGame, stageSpecs, getStage, clearStageCache } from '../games/registry.js';
import { editDocForStage } from '../dev/dev.js';
import { isEditableSpec, stageOverrideId, getOverride, setOverride, setStagePatch, removeOverride } from '../dev/overrides.js';

const f2 = (v) => Math.round(Number(v) * 100) / 100;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PKEYS = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];
const PSHORT = { TL: 'Top left', TM: 'Top side', TR: 'Top right', BL: 'Bottom left', BM: 'Bottom side', BR: 'Bottom right' };
const STEP = DIAMOND_UNITS / 4; // ¼ diamond

function diamondsOf(p) {
  return { dx: f2(p.x / DIAMOND_UNITS), dy: f2(p.y / DIAMOND_UNITS) };
}
function clampPath(p) {
  return { x: f2(Math.min(103, Math.max(-3, p.x))), y: f2(Math.min(53, Math.max(-3, p.y))) };
}
function near(a, b, tol = 1.5) {
  return !!(a && b && Math.hypot(a.x - b.x, a.y - b.y) <= tol);
}

function docFromPatch(ch, patch) {
  const cue = patch?.cue || ch.cueBallPosition;
  const doc = {
    patchOnly: true,
    title: (patch?.title || ch.name || '').slice(0, 80),
    description: patch?.instructions != null ? patch.instructions : (ch.goal || ch.instructions || ''),
    category: patch?.category || ch.category || 'Practice',
    shot: {
      speed: ch.speed || 2,
      technique: TECHNIQUES.includes(ch.technique) ? ch.technique : 'stop',
      cueContact: { vTips: ch.cueContact?.vTips || 0, hTips: ch.cueContact?.hTips || 0 },
      targetPocket: ch.targetPocket || null
    }
  };
  if (cue) doc.shot.cueBallPosition = { x: cue.x, y: cue.y };
  const balls = patch?.balls || ch.ballPositions;
  if (balls?.length) doc.shot.ballPositions = balls.map((b) => ({ n: b.n, x: b.x, y: b.y }));
  const blockers = patch?.blockers || ch.blockers;
  if (blockers?.length) doc.shot.blockers = blockers.map((b) => ({ n: b.n, x: b.x, y: b.y }));
  const zones = patch?.zones || ch.targetZones;
  if (zones?.length) doc.shot.targetZones = JSON.parse(JSON.stringify(zones));
  if (ch.goal && patch?.goal == null) doc.shot.goal = ch.goal;
  else if (patch?.goal) doc.shot.goal = patch.goal;
  if (ch.instructions) doc.shot.instructions = patch?.instructions != null ? patch.instructions : ch.instructions;
  return doc;
}

export function createDrillFix(ctx, idOrSpec) {
  const spec = typeof idOrSpec === 'string' ? { kind: 'drill', id: idOrSpec } : (idOrSpec || {});
  const isDrill = spec.kind !== 'stage';
  const id = isDrill ? spec.id : spec.stageId;
  const gameId = spec.gameId;
  function stageMeta() {
    if (isDrill) return null;
    const g = getGame(gameId);
    const st = stageSpecs(gameId).find((s) => s.id === spec.stageId);
    if (!g || !st) return null;
    return { g, st, editable: isEditableSpec(st, st.kind || g.kind) };
  }
  function loadDoc() {
    if (!drillEditorAllowed()) return null;
    if (isDrill) {
      const ch0 = getDrillById(id);
      if (!ch0 || ch0.custom || ch0.contentUid) return null;
      return editingDoc(id);
    }
    const meta = stageMeta();
    if (!meta) return null;
    clearStageCache(gameId);
    const ch = getStage(gameId, spec.stageId);
    if (!ch) return null;
    const ov = getOverride(stageOverrideId(gameId, spec.stageId));
    if (meta.editable) {
      try {
        const doc = editDocForStage(ch, ov?.doc ? ov : null);
        if (!doc.description) doc.description = doc.shot?.goal || doc.shot?.instructions || ch.goal || ch.instructions || '';
        return doc;
      } catch { return null; }
    }
    return docFromPatch(ch, ov?.patch);
  }
  let doc = loadDoc();
  if (!doc) {
    return {
      render() { ctx.root.innerHTML = ''; },
      onAction() { return false; },
      destroy() {}
    };
  }
  const ui = { tool: 'move', sel: { kind: 'cue' }, msg: '', full: false };
  let drag = null;
  let ac = null;

  function shot() { return doc.shot; }
  function obEntry() {
    const s = shot();
    const paths = s.objectBallPaths || (s.objectBallPaths = []);
    const n = s.targetBall ?? s.ballPositions?.[0]?.n;
    let op = paths.find((p) => p.n === n);
    if (!op && paths[0]) op = paths[0];
    return op || null;
  }
  function pointsFor(kind) {
    if (kind === 'cuePath') return shot().cueBallPath || null;
    if (kind === 'obPath') return obEntry()?.points || null;
    return null;
  }
  function otherBalls(except) {
    const s = shot();
    const out = [];
    if (except?.kind !== 'cue' && s.cueBallPosition) out.push(s.cueBallPosition);
    for (const b of s.ballPositions || []) if (!(except?.kind === 'ball' && except.n === b.n)) out.push(b);
    for (const b of s.blockers || []) if (!(except?.kind === 'blocker' && except.n === b.n)) out.push(b);
    return out;
  }
  function placeBall(target, q) {
    const from = { x: target.x, y: target.y };
    let next = snapPoint(q);
    next = freeSpot(otherBalls(ui.sel), next);
    next = { x: f2(next.x), y: f2(next.y) };
    followStart(ui.sel, from, next);
    target.x = next.x;
    target.y = next.y;
  }
  function followStart(sel, from, to) {
    const s = shot();
    if (sel.kind === 'cue' && s.cueBallPath?.[0] && near(s.cueBallPath[0], from)) s.cueBallPath[0] = { x: to.x, y: to.y };
    if (sel.kind === 'ball' && sel.n === s.targetBall) {
      const op = obEntry();
      if (op?.points?.[0] && near(op.points[0], from)) op.points[0] = { x: to.x, y: to.y };
    }
  }
  function setPathPoint(kind, i, q) {
    const pts = pointsFor(kind);
    if (!pts || !pts[i]) return;
    const prev = pts[i];
    const next = clampPath(q);
    pts[i] = next;
    const s = shot();
    if (kind === 'cuePath' && s.ghost && i === (s.contactIndex ?? 1) && near(s.ghost, prev, 0.2)) s.ghost = { ...next };
    if (kind === 'cuePath' && i === 0 && s.cueBallPosition && near(s.cueBallPosition, prev, 0.2)) {
      /* path start moved on purpose — do not drag the ball with it */
    }
  }
  function targetOf(sel) {
    const s = shot();
    if (!sel) return null;
    if (sel.kind === 'cue') return s.cueBallPosition;
    if (sel.kind === 'ball') return (s.ballPositions || []).find((b) => b.n === sel.n) || null;
    if (sel.kind === 'blocker') return (s.blockers || []).find((b) => b.n === sel.n) || null;
    if (sel.kind === 'cuePath') return s.cueBallPath?.[sel.i] || null;
    if (sel.kind === 'obPath') return obEntry()?.points?.[sel.i] || null;
    if (sel.kind === 'zone') {
      const z = s.targetZones?.[sel.i];
      if (!z) return null;
      if (z.type === 'band') return { x: z.center, y: 25, _zone: z };
      return z;
    }
    return null;
  }
  function placeZone(z, q) {
    if (!z) return;
    if (z.type === 'band') z.center = f2(Math.max(0, Math.min(100, q.x)));
    else {
      const spt = snapPoint(q);
      z.x = f2(spt.x);
      z.y = f2(spt.y);
    }
  }
  function scaleZone(i, dir) {
    const z = shot().targetZones?.[i];
    if (!z?.rings?.length) return;
    const factor = dir > 0 ? 1.15 : 1 / 1.15;
    for (const r of z.rings) r.r = f2(Math.min(30, Math.max(0.5, r.r * factor)));
    const by = z.rings.slice().sort((a, b) => b.stars - a.stars);
    for (let k = 1; k < by.length; k++) if (by[k].r < by[k - 1].r) by[k].r = by[k - 1].r;
  }
  function nudge(dxd, dyd) {
    const t = targetOf(ui.sel);
    if (!t) return;
    const q = { x: t.x + dxd * DIAMOND_UNITS, y: t.y + dyd * DIAMOND_UNITS };
    if (ui.sel.kind === 'zone') placeZone(shot().targetZones[ui.sel.i], q);
    else if (ui.sel.kind === 'cue' || ui.sel.kind === 'ball' || ui.sel.kind === 'blocker') placeBall(t, q);
    else setPathPoint(ui.sel.kind, ui.sel.i, q);
    ui.msg = '';
    render();
  }
  function setPocket(key) {
    const s = shot();
    const prev = s.targetPocket;
    s.targetPocket = key;
    if (Array.isArray(s.acceptPockets)) {
      const acc = s.acceptPockets.filter((k) => k && k !== prev);
      if (!acc.includes(key)) acc.unshift(key);
      s.acceptPockets = acc;
    }
    ui.msg = '';
    render();
  }
  function setSpeed(delta) {
    const i = SPEED_STEPS.indexOf(shot().speed);
    const cur = i >= 0 ? i : SPEED_STEPS.findIndex((s) => s >= shot().speed);
    const n = Math.max(0, Math.min(SPEED_STEPS.length - 1, (cur < 0 ? 0 : cur) + delta));
    shot().speed = SPEED_STEPS[n];
    ui.msg = '';
    render();
  }
  function setTip(key, delta) {
    const s = shot();
    s.cueContact = s.cueContact || { vTips: 0, hTips: 0 };
    const min = key === 'vTips' ? -1.5 : -1;
    const max = key === 'vTips' ? 1.5 : 1;
    let v = Math.round((Number(s.cueContact[key]) || 0) * 4) / 4 + delta * 0.25;
    v = Math.round(Math.max(min, Math.min(max, v)) * 4) / 4;
    s.cueContact[key] = v;
    if (s.english && s.english.hTips !== undefined) s.english.hTips = s.cueContact.hTips;
    ui.msg = '';
    render();
  }
  function addPoint(kind) {
    const s = shot();
    if (kind === 'obPath' && !obEntry()) {
      const ball = (s.ballPositions || []).find((b) => b.n === s.targetBall) || s.ballPositions?.[0];
      if (!ball) { ui.msg = 'Add an object ball before a path.'; render(); return; }
      s.objectBallPaths = [{ n: ball.n, points: [{ x: ball.x, y: ball.y }, { x: ball.x, y: ball.y }] }];
      ui.sel = { kind: 'obPath', i: 1 };
      ui.tool = 'ob';
      render();
      return;
    }
    if (kind === 'cuePath' && !(s.cueBallPath || []).length) {
      const c = s.cueBallPosition;
      if (!c) return;
      s.cueBallPath = [{ x: c.x, y: c.y }, { x: c.x, y: c.y }];
      s.contactIndex = 1;
      ui.sel = { kind: 'cuePath', i: 1 };
      ui.tool = 'cue';
      render();
      return;
    }
    const pts = pointsFor(kind);
    if (!pts || pts.length >= 200) return;
    const last = pts[pts.length - 1];
    pts.push(clampPath({ x: last.x + STEP, y: last.y }));
    ui.sel = { kind, i: pts.length - 1 };
    ui.msg = '';
    render();
  }
  function removePoint(kind, i) {
    const pts = pointsFor(kind);
    if (!pts || pts.length <= 2) { ui.msg = 'A path needs at least 2 points.'; render(); return; }
    pts.splice(i, 1);
    const s = shot();
    if (kind === 'cuePath' && s.contactIndex >= pts.length) s.contactIndex = pts.length - 1;
    ui.sel = { kind, i: Math.min(i, pts.length - 1) };
    render();
  }

  function preview() {
    const s = shot();
    const fallback = { id: doc.id || id, name: doc.title, cueBallPosition: s.cueBallPosition, ballPositions: s.ballPositions || [], cueBallPath: s.cueBallPath || [], objectBallPaths: s.objectBallPaths || [], targetPocket: s.targetPocket, blockers: s.blockers || [], targetZones: s.targetZones || [] };
    if (doc.patchOnly) return fallback;
    try {
      const ch = challengeFromPkfDoc(doc);
      ch.targetZones = s.targetZones || ch.targetZones || [];
      return ch;
    } catch { return fallback; }
  }

  function selLabel() {
    const sel = ui.sel;
    if (!sel) return 'Nothing selected';
    if (sel.kind === 'cue') return 'Cue ball';
    if (sel.kind === 'ball') return `${sel.n}-ball`;
    if (sel.kind === 'blocker') return `Blocker ${sel.n}`;
    if (sel.kind === 'cuePath') return `Cue path point ${sel.i + 1}`;
    if (sel.kind === 'obPath') return `Object path point ${sel.i + 1}`;
    if (sel.kind === 'zone') return `Bullseye ${sel.i + 1}`;
    return '';
  }
  const GRAB = 5.6; // table units — a disc you can grab, not the thin ring stroke
  function zoneCenter(z) {
    if (!z?.rings?.length) return null;
    if (z.type === 'band') {
      const x = Number(z.center);
      return Number.isFinite(x) ? { x, y: 25, band: true } : null;
    }
    if (!Number.isFinite(z.x) || !Number.isFinite(z.y)) return null;
    return { x: z.x, y: z.y, band: false };
  }
  function zoneHit(p, grabOnly) {
    let best = null;
    let bd = Infinity;
    (shot().targetZones || []).forEach((z, i) => {
      const c = zoneCenter(z);
      if (!c) return;
      const outer = Math.max(...z.rings.map((r) => Number(r.r) || 0));
      const d = c.band ? Math.abs(c.x - p.x) : Math.hypot(c.x - p.x, c.y - p.y);
      const limit = grabOnly ? GRAB : Math.max(outer + 1.2, GRAB);
      const yOk = !c.band || (p.y >= -2 && p.y <= 52);
      if (yOk && d <= limit && d < bd) { bd = d; best = { kind: 'zone', i }; }
    });
    return best;
  }
  function sizeButtons() {
    const zones = (shot().targetZones || []).filter((z) => z?.rings?.length);
    if (!zones.length) return '';
    return `<div class="fixPair" data-zone-size="1">
        <button type="button" data-action="df-zone-size" data-d="1">EXPAND</button>
        <button type="button" data-action="df-zone-size" data-d="-1">DECREASE</button>
      </div>`;
  }
  function zonePanel() {
    const zones = (shot().targetZones || []).filter((z) => z?.rings?.length);
    if (!zones.length) return '<div class="eyebrow">BULLSEYE</div><p class="muted small">No bullseye on this one.</p>';
    const i = ui.sel?.kind === 'zone' ? ui.sel.i : 0;
    const z = shot().targetZones[i] || zones[0];
    const outer = Math.max(...z.rings.map((r) => r.r));
    return `<div class="eyebrow">BULLSEYE</div>
      <p class="fixSel" data-bullseye-size="${outer}">${esc(zones.length > 1 ? `Target ${i + 1} of ${shot().targetZones.length}` : 'Target')} · outer ring ${outer}</p>
      ${sizeButtons()}
      ${shot().targetZones.length > 1 ? `<div class="pockets">${shot().targetZones.map((zz, n) => zz?.rings ? `<button type="button" class="${n === i ? 'on' : ''}" data-action="df-zone-pick" data-i="${n}">Target ${n + 1}</button>` : '').join('')}</div>` : ''}
      <p class="muted small">Drag the center to move the target. EXPAND and DECREASE change its size. No numbers on the rings. Size is saved with this ${isDrill ? 'drill' : 'stage'}.</p>`;
  }
  const loadedDesc = String(doc.description || '');
  function backHref() { return isDrill ? `#play/drills/${esc(id)}` : `#devgame/${esc(gameId)}`; }
  function overriddenNow() {
    if (isDrill) return !!getDrillEdit(id);
    const ov = getOverride(stageOverrideId(gameId, spec.stageId));
    return !!(ov?.doc || ov?.patch);
  }

  function diamondFields() {
    const t = targetOf(ui.sel);
    if (!t) return '<p class="muted">Select a ball or a path point.</p>';
    const d = diamondsOf(t);
    const path = ui.sel.kind === 'cuePath' || ui.sel.kind === 'obPath';
    return `<div class="fixDiamonds">
      <label class="fixFld">From head rail
        <input id="fixDx" inputmode="decimal" type="number" step="0.25" value="${d.dx}" data-axis="dx"/>
      </label>
      <label class="fixFld">Down from top
        <input id="fixDy" inputmode="decimal" type="number" step="0.25" value="${d.dy}" data-axis="dy"/>
      </label>
    </div>
    <p class="muted small">${path ? 'Path points may sit just past a cushion (into a pocket).' : 'Balls snap to the ¼-diamond grid and stay on the cloth.'}</p>`;
  }

  function pathList(kind) {
    const pts = pointsFor(kind) || [];
    if (!pts.length) {
      return `<button type="button" class="bigBtn alt" data-action="df-add" data-kind="${kind}">ADD PATH</button>`;
    }
    const rows = pts.map((p, i) => {
      const d = diamondsOf(p);
      const on = ui.sel?.kind === kind && ui.sel.i === i ? ' on' : '';
      return `<button type="button" class="fixPt${on}" data-action="df-pt" data-kind="${kind}" data-i="${i}"><b>${i + 1}</b><span>${d.dx} · ${d.dy}</span></button>`;
    }).join('');
    const ci = shot().contactIndex ?? 1;
    const contact = kind === 'cuePath'
      ? `<div class="stepper fixContact"><button type="button" data-action="df-ci" data-d="-1" aria-label="Earlier contact">−</button><span>Hits ball at point ${ci + 1}</span><button type="button" data-action="df-ci" data-d="1" aria-label="Later contact">+</button></div>`
      : '';
    return `<div class="fixPts">${rows}</div>${contact}
      <div class="fixPair">
        <button type="button" class="bigBtn alt" data-action="df-add" data-kind="${kind}">ADD POINT</button>
        <button type="button" class="bigBtn alt" data-action="df-delpt" data-kind="${kind}">REMOVE POINT</button>
      </div>`;
  }

  function spinFullSvg(svg) {
    if (svg.dataset.spun) return;
    const NS = 'http://www.w3.org/2000/svg';
    const spin = document.createElementNS(NS, 'g');
    spin.id = 'fixSpin';
    while (svg.firstChild) spin.appendChild(svg.firstChild);
    svg.appendChild(spin);
    const vb = svg.viewBox.baseVal;
    const x = vb.x, y = vb.y, w = vb.width, h = vb.height;
    const cx = x + w / 2, cy = y + h / 2;
    // Same direction as the old CSS rotate(90deg): the head of the table swings to the right.
    spin.setAttribute('transform', `rotate(90 ${f2(cx)} ${f2(cy)})`);
    const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py]) => {
      const dx = px - cx, dy = py - cy;
      return [cx + dy, cy - dx];
    });
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    svg.setAttribute('viewBox', `${f2(minX)} ${f2(minY)} ${f2(Math.max(...xs) - minX)} ${f2(Math.max(...ys) - minY)}`);
    svg.dataset.spun = '1';
  }
  function fitFullTable() {
    if (!ui.full) return;
    const slot = ctx.root.querySelector('.fixFit');
    const svg = slot?.querySelector('svg');
    if (!svg) return;
    spinFullSvg(svg);
    const vb = svg.viewBox.baseVal;
    const aspect = vb.height ? vb.width / vb.height : 0.5;
    const r = slot.getBoundingClientRect();
    const sw = Math.max(0, r.width - 4);
    const sh = Math.max(0, r.height - 4);
    if (sw < 20 || sh < 20) return;
    const cssW = Math.min(sw, sh * aspect);
    const cssH = cssW / aspect;
    svg.style.position = 'absolute';
    svg.style.transform = 'none';
    svg.style.width = `${cssW}px`;
    svg.style.height = `${cssH}px`;
    svg.style.left = `${(r.width - cssW) / 2}px`;
    svg.style.top = `${(r.height - cssH) / 2}px`;
    svg.style.maxHeight = 'none';
  }
  function render() {
    if (!drillEditorAllowed()) { document.body.classList.remove('fix-full'); ctx.root.innerHTML = ''; return; }
    document.body.classList.toggle('fix-full', !!ui.full);
    const overridden = overriddenNow();
    const s = shot();
    const cc = s.cueContact || { vTips: 0, hTips: 0 };
    const table = renderStageTable(preview(), { showCuePath: true, showAim: true, showObPath: true, showZones: true, className: 'table-diagram stage-table' });
    if (ui.full) {
      ctx.root.innerHTML = `<div class="playScreen drillFix is-full" data-drill-fix="${esc(id)}" data-fix-full="1" data-overridden="${overridden ? 1 : 0}">
      <div class="fixStage">
        <div class="fixFullTop">
          <button type="button" class="fullExit" data-action="df-full">EXIT</button>
          <span class="fixSel">${esc(selLabel())}</span>
          <button type="button" class="fixSave" data-action="df-save">SAVE</button>
        </div>
        <div class="fixFit"><div id="fixTable" class="fixTable">${table}</div></div>
        <div class="fixFullBot">
          <div class="nudge">
            <button type="button" data-action="df-nudge" data-dx="-0.25" data-dy="0">◀ HEAD</button>
            <button type="button" data-action="df-nudge" data-dx="0.25" data-dy="0">FOOT ▶</button>
            <button type="button" data-action="df-nudge" data-dx="0" data-dy="-0.25">▲ TOP</button>
            <button type="button" data-action="df-nudge" data-dx="0" data-dy="0.25">▼ BOTTOM</button>
          </div>
          ${sizeButtons()}
          <p class="muted small">Drag a ball or the bullseye. Nudge moves ¼ diamond. SAVE keeps it on this phone.</p>
        </div>
      </div>
    </div>`;
      paintHandles();
      bindTable();
      fitFullTable();
      requestAnimationFrame(() => { if (ui.full) fitFullTable(); });
      return;
    }
    ctx.root.innerHTML = `<div class="playScreen drillFix" data-drill-fix="${esc(id)}" data-overridden="${overridden ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="go" data-href="${backHref()}" aria-label="Back">‹</button>
        <div class="phTitle"><small>OWNER EDIT${overridden ? ' · SAVED ON THIS PHONE' : ''}</small><b>${esc(doc.title || 'Drill')}</b></div>
      </div>
      <div class="fixScroll">
        ${s.cueBallPosition || (s.targetZones || []).length ? `<div class="fixTableWrap"><button type="button" class="fixExpand" data-action="df-full">FULL TABLE</button><div id="fixTable" class="fixTable">${table}</div></div>` : ''}
        <div class="fixTools" role="group" aria-label="What to drag">
          <button type="button" class="${ui.tool === 'move' ? 'on' : ''}" data-action="df-tool" data-tool="move">BALLS</button>
          <button type="button" class="${ui.tool === 'cue' ? 'on' : ''}" data-action="df-tool" data-tool="cue">CUE PATH</button>
          <button type="button" class="${ui.tool === 'ob' ? 'on' : ''}" data-action="df-tool" data-tool="ob">OBJECT PATH</button>
        </div>
        <p class="fixSel">${esc(selLabel())}</p>
        <div class="nudge">
          <button type="button" data-action="df-nudge" data-dx="-0.25" data-dy="0">◀ HEAD</button>
          <button type="button" data-action="df-nudge" data-dx="0.25" data-dy="0">FOOT ▶</button>
          <button type="button" data-action="df-nudge" data-dx="0" data-dy="-0.25">▲ TOP</button>
          <button type="button" data-action="df-nudge" data-dx="0" data-dy="0.25">▼ BOTTOM</button>
        </div>
        ${diamondFields()}
        ${s.cueBallPosition ? `<div class="eyebrow">TARGET POCKET</div>
        <div class="pockets">${PKEYS.map((k) => `<button type="button" class="${s.targetPocket === k ? 'on' : ''}" data-action="df-pocket" data-p="${k}">${PSHORT[k]}</button>`).join('')}</div>` : '<p class="muted small">No balls to drag on this one. Title and description still save on this phone.</p>'}
        ${zonePanel()}
        <label class="fixFld">Title<input id="fixTitle" maxlength="80" value="${esc(doc.title || '')}"/></label>
        <label class="fixFld">Description<textarea id="fixDesc" maxlength="2000" rows="3">${esc(doc.description || '')}</textarea></label>
        <label class="fixFld">Category<input id="fixCat" maxlength="40" value="${esc(doc.category || '')}"/></label>
        <div class="eyebrow">SPEED</div>
        <div class="stepper"><button type="button" data-action="df-speed" data-d="-1" aria-label="Slower">−</button><b>${formatSpeed(s.speed)}</b><button type="button" data-action="df-speed" data-d="1" aria-label="Faster">+</button></div>
        <div class="eyebrow">TECHNIQUE</div>
        <div class="techs">${TECHNIQUES.map((t) => `<button type="button" class="${s.technique === t ? 'on' : ''}" data-action="df-tech" data-t="${t}">${esc(techniqueName(t))}</button>`).join('')}</div>
        <div class="eyebrow">CUE CONTACT · TIPS</div>
        <div class="stepper"><button type="button" data-action="df-tip" data-k="vTips" data-d="-1" aria-label="Lower tip">−</button><span>Vertical ${cc.vTips}</span><button type="button" data-action="df-tip" data-k="vTips" data-d="1" aria-label="Higher tip">+</button></div>
        <div class="stepper"><button type="button" data-action="df-tip" data-k="hTips" data-d="-1" aria-label="More left english">−</button><span>Side ${cc.hTips}</span><button type="button" data-action="df-tip" data-k="hTips" data-d="1" aria-label="More right english">+</button></div>
        <p class="muted small">Vertical: above centre is follow (+), below is draw (−). Side: right is +, left is −. Steps of ¼ tip.</p>
        ${ui.tool === 'cue' ? `<div class="eyebrow">CUE BALL PATH</div>${pathList('cuePath')}` : ''}
        ${ui.tool === 'ob' ? `<div class="eyebrow">OBJECT BALL PATH</div>${pathList('obPath')}` : ''}
        <div id="fixMsg" class="fixMsg${ui.msg ? ' show' : ''}">${esc(ui.msg).replace(/\n/g, '<br>')}</div>
      </div>
      <div class="fixBar">
        <button type="button" class="bigBtn" data-action="df-save">SAVE ON THIS PHONE</button>
        <button type="button" class="bigBtn alt" data-action="df-reset">RESET</button>
        <button type="button" class="bigBtn alt" data-action="df-export">EXPORT THIS</button>
        <button type="button" class="bigBtn alt" data-action="df-export-all">EXPORT ALL</button>
      </div>
    </div>`;
    paintHandles();
    bindTable();
    bindFields();
  }

  function paintBulls(svg) {
    svg.querySelectorAll('.fix-bulls').forEach((n) => n.remove());
    const NS = 'http://www.w3.org/2000/svg';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'fix-bulls');
    (shot().targetZones || []).forEach((z, i) => {
      const c = zoneCenter(z);
      if (!c) return;
      const on = ui.sel?.kind === 'zone' && ui.sel.i === i;
      const wrap = document.createElementNS(NS, 'g');
      wrap.setAttribute('class', 'fix-bull' + (on ? ' on' : ''));
      wrap.dataset.i = String(i);
      const disc = document.createElementNS(NS, 'circle');
      disc.setAttribute('class', 'fix-bull-grab');
      disc.setAttribute('cx', String(c.x));
      disc.setAttribute('cy', String(c.y));
      disc.setAttribute('r', '4.2');
      disc.setAttribute('fill', 'transparent');
      disc.setAttribute('stroke', on ? '#ffffff' : 'transparent');
      disc.setAttribute('stroke-width', on ? '0.55' : '0');
      wrap.appendChild(disc);
      g.appendChild(wrap);
    });
    svg.appendChild(g);
  }
  function paintHandles() {
    const svg = ctx.root.querySelector('#fixTable svg');
    if (!svg) return;
    svg.querySelectorAll('.fix-handle').forEach((n) => n.remove());
    paintBulls(svg);
    const kind = ui.tool === 'cue' ? 'cuePath' : ui.tool === 'ob' ? 'obPath' : null;
    if (!kind) return;
    const pts = pointsFor(kind) || [];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'fix-handles');
    pts.forEach((p, i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'fix-handle' + (ui.sel?.kind === kind && ui.sel.i === i ? ' on' : ''));
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', '2.6');
      c.dataset.kind = kind;
      c.dataset.i = String(i);
      g.appendChild(c);
    });
    svg.appendChild(g);
  }

  function toTable(e) {
    const svg = ctx.root.querySelector('#fixTable svg');
    const space = svg.querySelector('#fixSpin') || svg;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = space.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }
  function hit(p) {
    if (ui.tool === 'cue' || ui.tool === 'ob') {
      const kind = ui.tool === 'cue' ? 'cuePath' : 'obPath';
      const pts = pointsFor(kind) || [];
      let best = null;
      let bd = 4.2;
      pts.forEach((pt, i) => {
        const d = Math.hypot(pt.x - p.x, pt.y - p.y);
        if (d < bd) { bd = d; best = { kind, i }; }
      });
      return best;
    }
    let best = null;
    let bd = 4.5;
    const cue = shot().cueBallPosition;
    if (cue) {
      const d = Math.hypot(cue.x - p.x, cue.y - p.y);
      if (d < bd) { bd = d; best = { kind: 'cue' }; }
    }
    for (const b of shot().ballPositions || []) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < bd) { bd = d; best = { kind: 'ball', n: b.n }; }
    }
    for (const b of shot().blockers || []) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < bd) { bd = d; best = { kind: 'blocker', n: b.n }; }
    }
    const grabbed = zoneHit(p, true);
    if (grabbed && !best) return grabbed;
    if (grabbed && best) {
      const c = zoneCenter(shot().targetZones[grabbed.i]);
      const zd = c.band ? Math.abs(c.x - p.x) : Math.hypot(c.x - p.x, c.y - p.y);
      let item = null;
      if (best.kind === 'cue') item = cue;
      else if (best.kind === 'ball') item = (shot().ballPositions || []).find((b) => b.n === best.n);
      else if (best.kind === 'blocker') item = (shot().blockers || []).find((b) => b.n === best.n);
      const bdNow = item ? Math.hypot(item.x - p.x, item.y - p.y) : Infinity;
      return zd <= bdNow ? grabbed : best;
    }
    if (best) return best;
    return zoneHit(p, false);
  }
  function pocketAt(p) {
    for (const [k, pk] of Object.entries(POCKETS)) if (Math.hypot(pk.x - p.x, pk.y - p.y) < pk.r + 2) return k;
    return null;
  }
  function bindTable() {
    ac?.abort();
    ac = new AbortController();
    const t = ctx.root.querySelector('#fixTable');
    if (!t) return;
    const opt = { signal: ac.signal };
    t.addEventListener('pointerdown', (e) => {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      const p = toTable(e);
      try { t.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const h = hit(p);
      if (!h) {
        drag = { empty: true, pocket: ui.tool === 'move' ? pocketAt(p) : null };
        return;
      }
      const item = targetOf(h);
      drag = { sel: h, item, from: item ? { x: item.x, y: item.y } : null, ox: item ? item.x - p.x : 0, oy: item ? item.y - p.y : 0, moved: false, sx: e.clientX, sy: e.clientY };
      ui.sel = h;
    }, opt);
    t.addEventListener('pointermove', (e) => {
      if (!drag?.item) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      drag.moved = true;
      e.preventDefault();
      const p = toTable(e);
      let q = { x: p.x + drag.ox, y: p.y + drag.oy };
      if (drag.sel.kind === 'cue' || drag.sel.kind === 'ball' || drag.sel.kind === 'blocker' || drag.sel.kind === 'zone') q = snapPoint(q);
      else q = clampPath(q);
      drag.to = q;
      const svg = t.querySelector('svg');
      if (drag.sel.kind === 'cue') {
        const g = svg.querySelector('g.ball[data-n="cue"]');
        if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      } else if (drag.sel.kind === 'ball' || drag.sel.kind === 'blocker') {
        const g = svg.querySelector(`g.ball[data-n="${drag.sel.n}"]`);
        if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      } else if (drag.sel.kind === 'zone') {
        const band = shot().targetZones[drag.sel.i]?.type === 'band';
        if (band) q = { x: snapPoint({ x: q.x, y: drag.from.y }).x, y: drag.from.y };
        drag.to = q;
        const dx = f2(q.x - drag.from.x);
        const dy = band ? 0 : f2(q.y - (drag.from.y ?? 0));
        const g = svg.querySelector(`g.zone[data-zone-i="${drag.sel.i}"]`);
        if (g && drag.from) g.setAttribute('transform', `translate(${dx} ${dy})`);
        const hnd = svg.querySelector(`.fix-bull[data-i="${drag.sel.i}"]`);
        if (hnd && drag.from) hnd.setAttribute('transform', `translate(${dx} ${dy})`);
        const lab = svg.querySelector('text.zone-label');
        if (lab && drag.from && !band) lab.setAttribute('transform', `translate(${dx} ${dy})`);
      } else {
        const c = [...svg.querySelectorAll('.fix-handle')].find((n) => Number(n.dataset.i) === drag.sel.i);
        if (c) { c.setAttribute('cx', String(q.x)); c.setAttribute('cy', String(q.y)); }
      }
    }, opt);
    const end = () => {
      const d = drag;
      drag = null;
      if (!d) return;
      if (d.empty) {
        if (d.pocket) setPocket(d.pocket);
        else if (!ui.full && ui.tool === 'move') { ui.full = true; ui.msg = ''; render(); }
        return;
      }
      ui.sel = d.sel;
      if (d.moved && d.to && d.item) {
        if (d.sel.kind === 'zone') placeZone(shot().targetZones[d.sel.i], d.to);
        else if (d.sel.kind === 'cue' || d.sel.kind === 'ball' || d.sel.kind === 'blocker') placeBall(d.item, d.to);
        else setPathPoint(d.sel.kind, d.sel.i, d.to);
      }
      render();
    };
    t.addEventListener('pointerup', end, opt);
    t.addEventListener('pointercancel', () => { drag = null; render(); }, opt);
  }
  function bindFields() {
    const title = ctx.root.querySelector('#fixTitle');
    const desc = ctx.root.querySelector('#fixDesc');
    const cat = ctx.root.querySelector('#fixCat');
    title?.addEventListener('input', () => { doc.title = title.value.slice(0, 80); });
    desc?.addEventListener('input', () => { doc.description = desc.value.slice(0, 2000); });
    cat?.addEventListener('input', () => { doc.category = cat.value.slice(0, 40); });
    const readDiamonds = () => {
      const dx = Number(ctx.root.querySelector('#fixDx')?.value);
      const dy = Number(ctx.root.querySelector('#fixDy')?.value);
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      const t = targetOf(ui.sel);
      if (!t) return;
      const q = { x: dx * DIAMOND_UNITS, y: dy * DIAMOND_UNITS };
      if (ui.sel.kind === 'zone') placeZone(shot().targetZones[ui.sel.i], q);
      else if (ui.sel.kind === 'cue' || ui.sel.kind === 'ball' || ui.sel.kind === 'blocker') placeBall(t, q);
      else setPathPoint(ui.sel.kind, ui.sel.i, q);
      ui.msg = '';
      render();
    };
    ctx.root.querySelector('#fixDx')?.addEventListener('change', readDiamonds);
    ctx.root.querySelector('#fixDy')?.addEventListener('change', readDiamonds);
  }

  function readText() {
    const title = ctx.root.querySelector('#fixTitle');
    const desc = ctx.root.querySelector('#fixDesc');
    const cat = ctx.root.querySelector('#fixCat');
    if (title) doc.title = title.value.slice(0, 80);
    if (desc) doc.description = desc.value.slice(0, 2000);
    if (cat) doc.category = cat.value.slice(0, 40);
    if (doc.shot && String(doc.description || '') !== loadedDesc) doc.shot.goal = String(doc.description || '').slice(0, 240);
    if (!isDrill && doc.shot) doc.shot.instructions = String(doc.description || '').slice(0, 1500);
  }
  function save() {
    if (!drillEditorAllowed()) return;
    readText();
    if (!String(doc.title || '').trim()) { ui.msg = 'Title cannot be empty.'; render(); return; }
    if (!String(doc.category || '').trim()) { ui.msg = 'Category cannot be empty.'; render(); return; }
    if (isDrill) {
      doc.metadata = { ...(doc.metadata || {}), updated: new Date().toISOString().slice(0, 10) };
      const out = setDrillEdit(id, doc);
      if (out.error) { ui.msg = out.error; render(); return; }
      doc = JSON.parse(JSON.stringify(out.doc));
      toast('Saved on this phone. This drill now uses your correction.');
    } else if (doc.patchOnly) {
      const out = setStagePatch(stageOverrideId(gameId, spec.stageId), {
        title: doc.title.trim(),
        instructions: String(doc.description || '').slice(0, 1500),
        goal: String(doc.shot?.goal || doc.description || '').slice(0, 240),
        category: doc.category,
        cue: doc.shot?.cueBallPosition || null,
        balls: doc.shot?.ballPositions || null,
        blockers: doc.shot?.blockers || null,
        zones: doc.shot?.targetZones || null
      });
      if (out.error) { ui.msg = out.error; render(); return; }
      clearStageCache(gameId);
      toast('Saved on this phone.');
    } else {
      doc.metadata = { ...(doc.metadata || {}), updated: new Date().toISOString().slice(0, 10), generator: 'Pool IQ DEV MODE' };
      const out = setOverride(stageOverrideId(gameId, spec.stageId), doc);
      if (out.error) { ui.msg = out.error; render(); return; }
      clearStageCache(gameId);
      toast('Saved on this phone. This stage now uses your correction.');
    }
    ui.msg = '';
    render();
  }
  function resetAsk() {
    const clean = isDrill ? (!getDrillEdit(id) && JSON.stringify(doc) === JSON.stringify(shippedDoc(id))) : !overriddenNow();
    if (clean) { toast(isDrill ? 'Already the shipped drill' : 'Already the shipped stage'); return; }
    openSheet(`<h2 class="sheetTitle">Reset to the shipped ${isDrill ? 'drill' : 'stage'}?</h2><p class="muted">Your correction is removed from this phone. The original comes back. Export it first if you want a copy.</p><button type="button" class="bigBtn danger" data-action="df-reset-do">RESET</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'fix-reset' });
  }
  function resetDo() {
    closeSheet();
    if (isDrill) {
      const out = removeDrillEdit(id);
      if (out.error) { toast(out.error); return; }
    } else {
      if (!drillEditorAllowed()) { toast('DEV MODE is locked'); return; }
      removeOverride(stageOverrideId(gameId, spec.stageId));
      clearStageCache(gameId);
    }
    doc = loadDoc();
    ui.msg = '';
    ui.sel = { kind: 'cue' };
    toast(isDrill ? 'Restored the shipped drill' : 'Restored the shipped stage');
    render();
  }
  async function exportOne() {
    readText();
    const copy = JSON.parse(JSON.stringify(doc));
    copy.id = id;
    copy.format = 'pooliq';
    copy.contentType = 'drill';
    const { validatePooliq, serialize } = await import('../content/schema.js');
    const v = validatePooliq(JSON.stringify(copy));
    if (!v.ok) { ui.msg = v.errors.slice(0, 4).join('\n'); render(); return; }
    const name = `${id}.pooliq`;
    const how = await shareOrDownload(name, serialize(v.doc), { title: v.doc.title || 'Pool IQ drill' });
    if (how !== 'cancelled') toast(how === 'shared' ? 'Share sheet opened' : `Downloaded ${name}`);
  }
  async function exportAll() {
    const out = exportAllEdits();
    if (out.error) { toast(out.error); return; }
    const how = await shareOrDownload(out.name, out.text, { title: 'Pool IQ drill corrections' });
    if (how !== 'cancelled') toast(how === 'shared' ? 'Share sheet opened' : `Downloaded ${out.count} correction${out.count === 1 ? '' : 's'}`);
  }

  function onAction(action, el) {
    if (!drillEditorAllowed()) return false;
    if (action === 'df-full') {
      ui.full = !ui.full;
      if (ui.full) ui.tool = 'move';
      ui.msg = '';
      render();
      return true;
    }
    if (action === 'df-tool') {
      ui.tool = el.dataset.tool;
      if (ui.tool === 'move' && ui.sel && (ui.sel.kind === 'cuePath' || ui.sel.kind === 'obPath')) ui.sel = { kind: 'cue' };
      if (ui.tool === 'cue') ui.sel = { kind: 'cuePath', i: ui.sel?.kind === 'cuePath' ? ui.sel.i : 0 };
      if (ui.tool === 'ob') ui.sel = { kind: 'obPath', i: ui.sel?.kind === 'obPath' ? ui.sel.i : 0 };
      ui.msg = '';
      render();
      return true;
    }
    if (action === 'df-nudge') { nudge(Number(el.dataset.dx), Number(el.dataset.dy)); return true; }
    if (action === 'df-zone-size') {
      const i = ui.sel?.kind === 'zone' ? ui.sel.i : 0;
      ui.sel = { kind: 'zone', i };
      scaleZone(i, Number(el.dataset.d));
      ui.msg = '';
      render();
      return true;
    }
    if (action === 'df-zone-pick') { ui.sel = { kind: 'zone', i: Number(el.dataset.i) }; ui.tool = 'move'; render(); return true; }
    if (action === 'df-pocket') { setPocket(el.dataset.p); return true; }
    if (action === 'df-speed') { setSpeed(Number(el.dataset.d)); return true; }
    if (action === 'df-tech') { shot().technique = el.dataset.t; ui.msg = ''; render(); return true; }
    if (action === 'df-tip') { setTip(el.dataset.k, Number(el.dataset.d)); return true; }
    if (action === 'df-pt') { ui.sel = { kind: el.dataset.kind, i: Number(el.dataset.i) }; ui.tool = el.dataset.kind === 'cuePath' ? 'cue' : 'ob'; render(); return true; }
    if (action === 'df-add') { addPoint(el.dataset.kind); return true; }
    if (action === 'df-delpt') {
      const kind = el.dataset.kind;
      const i = ui.sel?.kind === kind ? ui.sel.i : (pointsFor(kind)?.length || 1) - 1;
      removePoint(kind, i);
      return true;
    }
    if (action === 'df-ci') {
      const pts = shot().cueBallPath || [];
      let ci = (shot().contactIndex ?? 1) + Number(el.dataset.d);
      ci = Math.max(1, Math.min(Math.max(pts.length - 1, 1), ci));
      shot().contactIndex = ci;
      render();
      return true;
    }
    if (action === 'df-save') { save(); return true; }
    if (action === 'df-reset') { resetAsk(); return true; }
    if (action === 'df-reset-do') { resetDo(); return true; }
    if (action === 'df-export') { exportOne(); return true; }
    if (action === 'df-export-all') { exportAll(); return true; }
    return false;
  }

  return { render, onAction, destroy() { ac?.abort(); ac = null; drag = null; document.body.classList.remove('fix-full'); } };
}
