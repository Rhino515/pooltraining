/**
 * Phone editor for one shipped PKF drill (#drillfix/<id>) or one built-in stage (#devedit/<game>/<stage>).
 * Mounted only while drillEditorAllowed() is true. Balls drag freely. Nudge is still ¼ diamond.
 * Bullseye matches the photo (green, red, dark center). Drag the center to move it, or EXPAND / DECREASE its rings.
 * FULL TABLE fills the phone so the same drag, nudge, size, and save work standing at the table.
 * The table is rotated with an SVG transform (not CSS) so the finger position maps on every phone.
 * Exit returns here.
 * SAVE on a drill publishes it for every visitor (Supabase). Shipped files do not change.
 * IMPORT DRILL previews a .pooliq (or one-drill JSON) on the table. Nothing is stored until SAVE.
 * Leaving without SAVE does not publish and does not remove the live drill.
 */
import { renderStageTable } from '../games/stageTable.js';
import { techniqueName } from '../games/text.js';
import { formatSpeed, SPEED_STEPS } from '../games/speed.js';
import { DIAMOND_UNITS } from '../games/diamonds.js';
import { POCKETS } from '../tableDiagram.js';
import { TECHNIQUES } from '../content/schema.js';
import { snapPoint, freeSpot } from '../sim/layouts.js';
import { challengeFromPkfDoc } from '../content/pkfBuiltins.js';
import { displayDrillTitle } from '../drills.js';
import { openSheet, closeSheet, toast, sheetKind } from './sheet.js';
import { shareOrDownload } from './share.js';
import {
  drillEditorAllowed, removeDrillEdit, exportAllEdits, shippedDoc, drillLink, drillFromImport
} from '../drills/ownerEdits.js';
import { publishedDoc, publishDrill } from '../drills/published.js';
import { hideDrill } from '../drills/hidden.js';
import { ownerAccountSignedIn } from '../dev/dev.js';
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
      const pub = publishedDoc(id);
      if (pub?.shot) return pub;
      const shipped = shippedDoc(id);
      return shipped ? JSON.parse(JSON.stringify(shipped)) : null;
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
  let alive = true;

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
    (s.extraCueBalls || []).forEach((b, i) => { if (!(except?.kind === 'extraCue' && except.i === i)) out.push(b); });
    for (const b of s.ballPositions || []) if (!(except?.kind === 'ball' && except.n === b.n)) out.push(b);
    for (const b of s.blockers || []) if (!(except?.kind === 'blocker' && except.n === b.n)) out.push(b);
    return out;
  }
  function placeBall(target, q) {
    const from = { x: target.x, y: target.y };
    const R = 1.125;
    let next = { x: Math.max(R, Math.min(100 - R, q.x)), y: Math.max(R, Math.min(50 - R, q.y)) };
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
    if (sel.kind === 'extraCue') return s.extraCueBalls?.[sel.i] || null;
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
    if (sel.kind === 'mark') return markAnchor(s.tableMarks?.[sel.i]);
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
    else if (ui.sel.kind === 'mark') shiftMark(marks()[ui.sel.i], q.x - t.x, q.y - t.y);
    else if (ui.sel.kind === 'cue' || ui.sel.kind === 'extraCue' || ui.sel.kind === 'ball' || ui.sel.kind === 'blocker') placeBall(t, q);
    else setPathPoint(ui.sel.kind, ui.sel.i, q);
    ui.msg = '';
    render();
  }
  function markedPockets() {
    const s = shot();
    const acc = Array.isArray(s.acceptPockets) ? s.acceptPockets.filter(Boolean) : [];
    if (s.targetPocket && !acc.includes(s.targetPocket)) acc.unshift(s.targetPocket);
    return acc;
  }
  function setPocket(key) {
    const s = shot();
    let acc = markedPockets();
    if (acc.includes(key)) {
      if (acc.length <= 1) { ui.msg = 'Keep at least one pocket.'; render(); return; }
      acc = acc.filter((k) => k !== key);
    } else acc.push(key);
    s.acceptPockets = acc;
    s.targetPocket = acc[0];
    ui.msg = '';
    render();
  }
  function addCueBall() {
    const s = shot();
    if (!s.cueBallPosition) return;
    const list = s.extraCueBalls || (s.extraCueBalls = []);
    if (list.length >= 8) { ui.msg = 'Eight added cue balls is the limit.'; render(); return; }
    const spot = freeSpot(otherBalls(null), { x: s.cueBallPosition.x + 6, y: s.cueBallPosition.y });
    list.push({ x: f2(spot.x), y: f2(spot.y) });
    ui.sel = { kind: 'extraCue', i: list.length - 1 };
    ui.tool = 'move';
    ui.msg = '';
    render();
  }
  function addObjectBall() {
    const s = shot();
    const used = new Set([...(s.ballPositions || []).map((b) => b.n), ...(s.blockers || []).map((b) => b.n)]);
    let n = 1;
    while (used.has(n) && n <= 15) n += 1;
    if (n > 15) { ui.msg = 'All 15 object balls are already on the table.'; render(); return; }
    const spot = freeSpot(otherBalls(null), { x: 62, y: 25 });
    s.ballPositions = [...(s.ballPositions || []), { n, x: f2(spot.x), y: f2(spot.y) }];
    if (s.targetBall == null) s.targetBall = n;
    ui.sel = { kind: 'ball', n };
    ui.tool = 'move';
    ui.msg = '';
    render();
  }
  function removeBall() {
    const s = shot();
    const sel = ui.sel;
    if (sel?.kind === 'extraCue' && s.extraCueBalls?.[sel.i]) {
      s.extraCueBalls.splice(sel.i, 1);
      if (!s.extraCueBalls.length) delete s.extraCueBalls;
      ui.sel = { kind: 'cue' };
    } else if (sel?.kind === 'ball') {
      s.ballPositions = (s.ballPositions || []).filter((b) => b.n !== sel.n);
      if (s.targetBall === sel.n) s.targetBall = s.ballPositions?.[0]?.n ?? null;
      s.objectBallPaths = (s.objectBallPaths || []).filter((p) => p.n !== sel.n);
      ui.sel = s.ballPositions?.[0] ? { kind: 'ball', n: s.ballPositions[0].n } : { kind: 'cue' };
    } else {
      ui.msg = 'Select an added cue ball or an object ball to remove it. The main cue ball stays.';
      render();
      return;
    }
    ui.msg = '';
    render();
  }
  function removeCueLine() {
    const s = shot();
    if (!(s.cueBallPath || []).length) { ui.msg = 'No cue line to remove.'; render(); return; }
    delete s.cueBallPath;
    delete s.contactIndex;
    if (ui.sel?.kind === 'cuePath') ui.sel = { kind: 'cue' };
    ui.msg = '';
    render();
  }
  function removeObjectLine() {
    const s = shot();
    const op = obEntry();
    if (!op) { ui.msg = 'No object line to remove.'; render(); return; }
    const cue = s.cueBallPath ? JSON.stringify(s.cueBallPath) : '';
    s.objectBallPaths = (s.objectBallPaths || []).filter((p) => p !== op);
    if (!s.objectBallPaths.length) delete s.objectBallPaths;
    if (cue && JSON.stringify(s.cueBallPath) !== cue) s.cueBallPath = JSON.parse(cue);
    if (ui.sel?.kind === 'obPath') ui.sel = { kind: 'ball', n: s.targetBall ?? s.ballPositions?.[0]?.n };
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
      s.objectBallPaths = [{ n: ball.n, points: [{ x: ball.x, y: ball.y }, clampPath({ x: ball.x + 8, y: ball.y })] }];
      ui.sel = { kind: 'obPath', i: 1 };
      ui.tool = 'ob';
      render();
      return;
    }
    if (kind === 'cuePath' && !(s.cueBallPath || []).length) {
      const c = s.cueBallPosition;
      if (!c) return;
      s.cueBallPath = [{ x: c.x, y: c.y }, clampPath({ x: c.x + 8, y: c.y })];
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
    const fallback = { id: doc.id || id, name: doc.title, cueBallPosition: s.cueBallPosition, extraCueBalls: s.extraCueBalls || [], ballPositions: s.ballPositions || [], cueBallPath: s.cueBallPath || [], objectBallPaths: s.objectBallPaths || [], targetPocket: s.targetPocket, acceptPockets: markedPockets(), blockers: s.blockers || [], targetZones: s.targetZones || [] };
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
    if (sel.kind === 'extraCue') return `Added cue ball ${sel.i + 1}`;
    if (sel.kind === 'ball') return `${sel.n}-ball`;
    if (sel.kind === 'blocker') return `Blocker ${sel.n}`;
    if (sel.kind === 'cuePath') return `Cue path point ${sel.i + 1}`;
    if (sel.kind === 'obPath') return `Object path point ${sel.i + 1}`;
    if (sel.kind === 'zone') return `Bullseye ${sel.i + 1}`;
    if (sel.kind === 'mark') {
      const m = shot().tableMarks?.[sel.i];
      return m ? `Mark ${sel.i + 1} · ${m.type}` : 'Mark';
    }
    return '';
  }
  function marks() { return shot().tableMarks || (shot().tableMarks = []); }
  function markAnchor(m) {
    if (!m) return null;
    if (m.type === 'arrow' && m.x1 != null) return { x: (m.x1 + m.x2) / 2, y: (m.y1 + m.y2) / 2 };
    if (m.type === 'path' && m.points?.[0]) return { x: m.points[0].x, y: m.points[0].y };
    if ((m.type === 'rect' || m.type === 'paper') && m.x != null) return { x: m.x + (m.w || 0) / 2, y: m.y + (m.h || 0) / 2 };
    if (m.x != null && m.y != null) return { x: m.x, y: m.y };
    return null;
  }
  function shiftMark(m, dx, dy) {
    if (!m) return;
    for (const k of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) {
      if (typeof m[k] !== 'number') continue;
      m[k] = f2(m[k] + (k[0] === 'x' ? dx : dy));
    }
    if (m.points) for (const pt of m.points) { pt.x = f2(pt.x + dx); pt.y = f2(pt.y + dy); }
  }
  function addMark(type) {
    const list = marks();
    if (list.length >= 80) { ui.msg = '80 marks is the limit.'; render(); return; }
    const m = { type };
    if (type === 'label') Object.assign(m, { x: 40, y: 20, text: 'label', size: 2.05, color: '#1c2428', anchor: 'middle' });
    else if (type === 'arrow') Object.assign(m, { x1: 30, y1: 25, x2: 48, y2: 25, color: '#1a1a1a', dashed: false });
    else if (type === 'path') Object.assign(m, { points: [{ x: 30, y: 30 }, { x: 50, y: 20 }], color: '#f5c542', dashed: true });
    else if (type === 'ghost') Object.assign(m, { x: 50, y: 25, color: '#f4f7fb' });
    else if (type === 'rect') Object.assign(m, { x: 40, y: 18, w: 12, h: 8, color: '#d7e2ea', fill: false, n: 1 });
    else if (type === 'paper') Object.assign(m, { x: 70, y: 8, w: 8.5, h: 11, color: '#f7f7f7' });
    else if (type === 'grid') Object.assign(m, {});
    else if (type === 'marker') Object.assign(m, { x: 50, y: 12, n: 1, color: '#f4f7fb' });
    else if (type === 'spot') Object.assign(m, { x: 60, y: 25, r: 0.7, color: '#1a1a1a' });
    else if (type === 'wheel') Object.assign(m, { x: 20, y: 25, r: 8 });
    list.push(m);
    ui.sel = { kind: 'mark', i: list.length - 1 };
    ui.tool = 'move';
    ui.msg = '';
    render();
  }
  function addRailBall() {
    const s = shot();
    const used = new Set([...(s.ballPositions || []).map((b) => b.n), ...(s.blockers || []).map((b) => b.n)]);
    let n = 1;
    while (used.has(n) && n <= 15) n += 1;
    if (n > 15) { ui.msg = 'All 15 object balls are already on the table.'; render(); return; }
    const spot = freeSpot(otherBalls(null), { x: 75, y: 1.13 });
    s.ballPositions = [...(s.ballPositions || []), { n, x: f2(spot.x), y: 1.13 }];
    if (s.targetBall == null) s.targetBall = n;
    ui.sel = { kind: 'ball', n };
    ui.tool = 'move';
    ui.msg = '';
    render();
  }
  function diagramShowing() {
    const v = shot().diagramImage;
    if (v === 'off') return false;
    if (v) return true;
    return /^bu-f[1-8]$/.test(String(doc.id || id)) || /^bu-[bd]s(?:10|[1-9])$/.test(String(doc.id || id));
  }
  function diagramInput() {
    let input = document.getElementById('fixDiagram');
    if (input) return input;
    input = document.createElement('input');
    input.type = 'file';
    input.id = 'fixDiagram';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (file) ingestDiagram(file);
    });
    return input;
  }
  async function ingestDiagram(file) {
    try {
      const bmp = await createImageBitmap(file);
      const maxW = 1000;
      const scale = Math.min(1, maxW / Math.max(1, bmp.width));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext('2d');
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.drawImage(bmp, 0, 0, w, h);
      if (bmp.close) bmp.close();
      let q = 0.82;
      let url = canvas.toDataURL('image/jpeg', q);
      while (url.length > 340000 && q > 0.45) {
        q = Math.round((q - 0.08) * 100) / 100;
        url = canvas.toDataURL('image/jpeg', q);
      }
      if (url.length > 380 * 1024 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(url)) {
        ui.msg = 'That picture is too large to save with the drill. Try a smaller one.';
        closeSheet();
        render();
        return;
      }
      shot().diagramImage = url;
      ui.msg = '';
      closeSheet();
      render();
    } catch {
      ui.msg = 'That picture could not be used.';
      closeSheet();
      render();
    }
  }
  function openAddSheet() {
    const zones = (shot().targetZones || []).filter((z) => z?.rings?.length);
    const i = ui.sel?.kind === 'zone' ? ui.sel.i : 0;
    const picks = zones.length > 1 ? `<div class="pockets">${shot().targetZones.map((zz, n) => zz?.rings ? `<button type="button" class="${n === i ? 'on' : ''}" data-action="df-zone-pick" data-i="${n}">Target ${n + 1}</button>` : '').join('')}</div>` : '';
    openSheet(`<h2 class="sheetTitle">Add</h2>
      <p class="muted small">Balls, lines, targets, labels, boxes, and a diagram photo. A photo replaces the drawn table. Remove it to drag the balls again.</p>
      <div class="fixAdd">
        <button type="button" data-action="df-add-cue">ADD CUE BALL</button>
        <button type="button" data-action="df-add-ob">ADD OBJECT BALL</button>
        <button type="button" data-action="df-remove-ball">REMOVE BALL</button>
        <button type="button" data-action="df-rail-ball">ADD RAIL BALL</button>
        <button type="button" data-action="df-add" data-kind="cuePath">ADD CUE LINE</button>
        <button type="button" data-action="df-remove-cue-line">REMOVE CUE LINE</button>
        <button type="button" data-action="df-add" data-kind="obPath">ADD OBJECT LINE</button>
        <button type="button" data-action="df-remove-ob-line">REMOVE OBJECT LINE</button>
        <button type="button" data-action="df-mark" data-t="label">ADD LABEL</button>
        <button type="button" data-action="df-mark" data-t="arrow">ADD ARROW</button>
        <button type="button" data-action="df-mark" data-t="path">ADD PATH</button>
        <button type="button" data-action="df-mark" data-t="ghost">ADD GHOST</button>
        <button type="button" data-action="df-mark" data-t="rect">ADD BOX</button>
        <button type="button" data-action="df-mark" data-t="paper">ADD PAPER</button>
        <button type="button" data-action="df-mark" data-t="grid">ADD GRID</button>
        <button type="button" data-action="df-mark" data-t="marker">ADD MARKER</button>
        <button type="button" data-action="df-mark" data-t="spot">ADD SPOT</button>
        <button type="button" data-action="df-mark" data-t="wheel">ADD WHEEL</button>
        <button type="button" data-action="df-diagram">UPLOAD DIAGRAM</button>
        <button type="button" data-action="df-diagram-clear"${diagramShowing() ? '' : ' disabled'}>REMOVE DIAGRAM</button>
      </div>
      <div class="eyebrow">POCKETS</div>
      <div class="pockets">${PKEYS.map((k) => `<button type="button" class="${markedPockets().includes(k) ? 'on' : ''}" data-action="df-pocket" data-p="${k}">${PSHORT[k]}</button>`).join('')}</div>
      ${zones.length ? `<div class="eyebrow">BULLSEYE</div>${sizeButtons()}${picks}` : ''}
    `, { id: 'add-piece' });
  }
    function marksPanel() {
    const m = ui.sel?.kind === 'mark' ? shot().tableMarks?.[ui.sel.i] : null;
    if (!m) return '';
    return `<div class="eyebrow">SELECTED MARK</div>
      <label class="fld"><span>Wording</span><input id="fixMarkText" type="text" maxlength="80" value="${esc(m.text || '')}"/></label>
      <label class="fld"><span>Color #rrggbb</span><input id="fixMarkColor" type="text" maxlength="7" value="${esc(m.color || '')}"/></label>
      <div class="fixAdd">
        <button type="button" data-action="df-mark-dash">${m.dashed ? 'SOLID LINE' : 'DASHED LINE'}</button>
        <button type="button" data-action="df-mark-fill">${m.fill ? 'NO FILL' : 'LIGHT FILL'}</button>
        <button type="button" data-action="df-mark-num" data-d="1">NUMBER +</button>
        <button type="button" data-action="df-mark-num" data-d="-1">NUMBER −</button>
        <button type="button" data-action="df-mark-del">REMOVE MARK</button>
      </div>`;
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
  let loadedDesc = String(doc.description || '');
  function backHref() { return isDrill ? `#play/drills/${esc(id)}` : `#devgame/${esc(gameId)}`; }
  function overriddenNow() {
    if (isDrill) return !!publishedDoc(id);
    const ov = getOverride(stageOverrideId(gameId, spec.stageId));
    return !!(ov?.doc || ov?.patch);
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
    const img = slot?.querySelector('img.drill-diagram');
    if (img && !slot.querySelector('svg')) {
      const r = slot.getBoundingClientRect();
      const sw = Math.max(0, r.width - 4);
      const sh = Math.max(0, r.height - 4);
      const nw = img.naturalWidth || 920;
      const nh = img.naturalHeight || 520;
      const aspect = nh ? nw / nh : 1.7;
      const cssW = Math.min(sw, sh * aspect);
      const cssH = cssW / aspect;
      img.style.width = `${cssW}px`;
      img.style.height = `${cssH}px`;
      img.style.objectFit = 'contain';
      if (!img.complete) img.addEventListener('load', () => { if (ui.full) fitFullTable(); }, { once: true });
      return;
    }
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
        <div id="fixMsg" class="fixMsg${ui.msg ? ' show' : ''}">${esc(ui.msg).replace(/\n/g, '<br>')}</div>
        <div class="fixFullBot">
          <div class="nudge">
            <button type="button" data-action="df-nudge" data-dx="-0.25" data-dy="0">◀ HEAD</button>
            <button type="button" data-action="df-nudge" data-dx="0.25" data-dy="0">FOOT ▶</button>
            <button type="button" data-action="df-nudge" data-dx="0" data-dy="-0.25">▲ TOP</button>
            <button type="button" data-action="df-nudge" data-dx="0" data-dy="0.25">▼ BOTTOM</button>
          </div>
          <button type="button" class="bigBtn alt fixAddOpen" data-action="df-add-open">ADD</button>
          <p class="muted small">Drag a ball freely, or the bullseye. Nudge moves ¼ diamond. ADD opens balls, lines, targets, and the diagram. SAVE publishes this drill for everyone.</p>
        </div>
      </div>
    </div>`;
      paintHandles();
      bindTable();
      fitFullTable();
      requestAnimationFrame(() => { if (ui.full) fitFullTable(); });
      if (sheetKind() === 'add-piece') openAddSheet();
      return;
    }
    ctx.root.innerHTML = `<div class="playScreen drillFix" data-drill-fix="${esc(id)}" data-overridden="${overridden ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="go" data-href="${backHref()}" aria-label="Back">‹</button>
        <div class="phTitle"><small>OWNER EDIT${overridden ? ' · LIVE' : ''}</small><b>${esc(displayDrillTitle(doc.title || 'Drill'))}</b></div>
      </div>
      <div class="fixTop">
        ${s.cueBallPosition || (s.targetZones || []).length ? `<div class="fixTableWrap"><button type="button" class="fixExpand" data-action="df-full">FULL TABLE</button><div id="fixTable" class="fixTable">${table}</div></div>` : ''}
        <div id="fixMsg" class="fixMsg${ui.msg ? ' show' : ''}">${esc(ui.msg).replace(/\n/g, '<br>')}</div>
        <div class="fixTools" role="group" aria-label="What to drag">
          <button type="button" class="${ui.tool === 'move' ? 'on' : ''}" data-action="df-tool" data-tool="move">BALLS</button>
          <button type="button" class="${ui.tool === 'cue' ? 'on' : ''}" data-action="df-tool" data-tool="cue">CUE PATH</button>
          <button type="button" class="${ui.tool === 'ob' ? 'on' : ''}" data-action="df-tool" data-tool="ob">OBJECT PATH</button>
        </div>
        <button type="button" class="bigBtn fixSaveMain" data-action="df-save">SAVE</button>
        <button type="button" class="bigBtn alt fixAddOpen" data-action="df-add-open">ADD</button>
      </div>
      <div class="fixScroll">
        <p class="fixSel">${esc(selLabel())}</p>
        <div class="nudge">
          <button type="button" data-action="df-nudge" data-dx="-0.25" data-dy="0">◀ HEAD</button>
          <button type="button" data-action="df-nudge" data-dx="0.25" data-dy="0">FOOT ▶</button>
          <button type="button" data-action="df-nudge" data-dx="0" data-dy="-0.25">▲ TOP</button>
          <button type="button" data-action="df-nudge" data-dx="0" data-dy="0.25">▼ BOTTOM</button>
        </div>
        ${s.cueBallPosition ? '' : '<p class="muted small">No balls to drag on this one. Title and description publish when you tap SAVE.</p>'}
        ${marksPanel()}
        <label class="fixFld">Title<input id="fixTitle" maxlength="80" value="${esc(doc.title || '')}"/></label>
        <label class="fixFld">Description<textarea id="fixDesc" maxlength="2000" rows="3">${esc(doc.description || '')}</textarea></label>
        <label class="fixFld">Category<input id="fixCat" maxlength="40" value="${esc(doc.category || '')}"/></label>
        ${isDrill ? `<label class="fixFld">Link<input id="fixLink" type="url" inputmode="url" maxlength="500" placeholder="https:// YouTube, video, or a resource" value="${esc(doc.attribution?.sourceURL || '')}"/></label>
        <p class="muted small">A video, a page, or a YouTube address. It publishes with this drill when you tap SAVE. Only shown while Dev Mode is unlocked.</p>` : ''}
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
      </div>
      <div class="fixBar">
        <button type="button" class="bigBtn" data-action="df-save">SAVE</button>
        <button type="button" class="bigBtn alt" data-action="df-reset">RESET</button>
        <button type="button" class="bigBtn alt" data-action="df-export">EXPORT THIS</button>
        ${isDrill ? `<button type="button" class="bigBtn alt" data-action="df-import">IMPORT DRILL</button>
        <input id="fixImport" type="file" accept=".pooliq,.json,application/json,application/octet-stream,text/plain,*/*" hidden>` : ''}
        <button type="button" class="bigBtn alt" data-action="df-export-all">EXPORT ALL</button>
        ${isDrill ? '<button type="button" class="bigBtn danger" data-action="df-delete">DELETE</button>' : ''}
      </div>
    </div>`;
    paintHandles();
    bindTable();
    bindFields();
    bindImport();
    if (sheetKind() === 'add-piece') openAddSheet();
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
    (shot().extraCueBalls || []).forEach((b, i) => {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < bd) { bd = d; best = { kind: 'extraCue', i }; }
    });
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
    let markBest = null;
    let md = 7;
    (shot().tableMarks || []).forEach((m, i) => {
      if ((m.type === 'rect' || m.type === 'paper') && m.w && m.h && p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h) {
        markBest = { kind: 'mark', i };
        md = 0;
        return;
      }
      const a = markAnchor(m);
      if (!a) return;
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < md) { md = d; markBest = { kind: 'mark', i }; }
    });
    if (markBest && (!best || md < bd)) return markBest;
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
      if (drag.sel.kind === 'zone') q = snapPoint(q);
      else if (drag.sel.kind === 'cuePath' || drag.sel.kind === 'obPath') q = clampPath(q);
      drag.to = q;
      const svg = t.querySelector('svg');
      if (drag.sel.kind === 'cue') {
        const g = [...svg.querySelectorAll('g.ball[data-n="cue"]')].find((n) => !n.hasAttribute('data-extra'));
        if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      } else if (drag.sel.kind === 'extraCue') {
        const g = svg.querySelector(`g.ball[data-extra="${drag.sel.i}"]`);
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
      } else if (drag.sel.kind === 'mark') {
        const g = svg.querySelector(`g.tmark[data-mark-i="${drag.sel.i}"]`);
        if (g && drag.from) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
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
        else if (d.sel.kind === 'mark') shiftMark(marks()[d.sel.i], d.to.x - d.from.x, d.to.y - d.from.y);
        else if (d.sel.kind === 'cue' || d.sel.kind === 'extraCue' || d.sel.kind === 'ball' || d.sel.kind === 'blocker') placeBall(d.item, d.to);
        else setPathPoint(d.sel.kind, d.sel.i, d.to);
      }
      render();
    };
    t.addEventListener('pointerup', end, opt);
    t.addEventListener('pointercancel', () => { drag = null; render(); }, opt);
  }
  function showMsg(msg) {
    ui.msg = msg;
    const el = ctx.root.querySelector('#fixMsg');
    if (!el) { render(); return; }
    el.innerHTML = esc(msg).replace(/\n/g, '<br>');
    el.classList.toggle('show', !!msg);
    if (msg && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  function bindImport() {
    const input = ctx.root.querySelector('#fixImport');
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file || !alive) return;
      const reader = new FileReader();
      reader.onload = () => { if (alive) applyImported(String(reader.result || '')); };
      reader.onerror = () => { if (alive) showMsg('That file is not a drill this app understands.'); };
      reader.readAsText(file);
    });
  }
  function applyImported(text) {
    if (!alive || !isDrill || !drillEditorAllowed()) return;
    const out = drillFromImport(text, id);
    if (!out.doc) {
      showMsg(out.error || 'That file is not a drill this app understands.');
      return;
    }
    doc = out.doc;
    loadedDesc = String(doc.description || '');
    ui.sel = { kind: 'cue' };
    ui.tool = 'move';
    ui.full = false;
    ui.msg = 'Showing the imported drill. Nothing is saved until you tap SAVE.';
    render();
  }
  function bindFields() {
    const title = ctx.root.querySelector('#fixTitle');
    const desc = ctx.root.querySelector('#fixDesc');
    const cat = ctx.root.querySelector('#fixCat');
    title?.addEventListener('input', () => { doc.title = title.value.slice(0, 80); });
    desc?.addEventListener('input', () => { doc.description = desc.value.slice(0, 2000); });
    cat?.addEventListener('input', () => { doc.category = cat.value.slice(0, 40); });
    ctx.root.querySelector('#fixLink')?.addEventListener('input', () => { readLink(false); });
    ctx.root.querySelector('#fixMarkText')?.addEventListener('input', (e) => {
      const m = ui.sel?.kind === 'mark' ? shot().tableMarks?.[ui.sel.i] : null;
      if (m) m.text = e.target.value.slice(0, 80);
    });
    ctx.root.querySelector('#fixMarkColor')?.addEventListener('change', (e) => {
      const m = ui.sel?.kind === 'mark' ? shot().tableMarks?.[ui.sel.i] : null;
      const c = String(e.target.value || '').trim();
      if (!m) return;
      if (/^#[0-9a-fA-F]{6}$/.test(c)) m.color = c;
      else ui.msg = 'Color must look like #1a1a1a';
      render();
    });
  }

  function readLink(strict) {
    const el = ctx.root.querySelector('#fixLink');
    if (!el || !isDrill) return true;
    const raw = el.value.trim().slice(0, 500);
    const link = drillLink(raw);
    if (raw && !link) {
      if (strict) { ui.msg = 'Link must start with http:// or https://. A YouTube address is fine.'; return false; }
      return true;
    }
    const at = { ...(doc.attribution || {}) };
    if (link) at.sourceURL = link;
    else delete at.sourceURL;
    if (Object.keys(at).length) doc.attribution = at;
    else delete doc.attribution;
    return true;
  }
  function readText() {
    const title = ctx.root.querySelector('#fixTitle');
    const desc = ctx.root.querySelector('#fixDesc');
    const cat = ctx.root.querySelector('#fixCat');
    if (title) doc.title = title.value.slice(0, 80);
    if (desc) doc.description = desc.value.slice(0, 2000);
    if (cat) doc.category = cat.value.slice(0, 40);
    if (isDrill && readLink(true) === false) return false;
    if (doc.shot && String(doc.description || '') !== loadedDesc) doc.shot.goal = String(doc.description || '').slice(0, 240);
    if (!isDrill && doc.shot) doc.shot.instructions = String(doc.description || '').slice(0, 1500);
  }
  async function save() {
    if (!drillEditorAllowed()) return;
    if (readText() === false) { render(); return; }
    if (!String(doc.title || '').trim()) { ui.msg = 'Title cannot be empty.'; render(); return; }
    if (!String(doc.category || '').trim()) { ui.msg = 'Category cannot be empty.'; render(); return; }
    if (isDrill) {
      doc.metadata = { ...(doc.metadata || {}), updated: new Date().toISOString().slice(0, 10) };
      const out = await publishDrill(id, doc);
      if (out.error) { ui.msg = out.error; render(); return; }
      doc = JSON.parse(JSON.stringify(out.doc));
      toast('Saved. Everyone sees this drill now.');
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
    const live = isDrill ? (publishedDoc(id) || shippedDoc(id)) : null;
    const clean = isDrill ? JSON.stringify(doc) === JSON.stringify(live) : !overriddenNow();
    if (clean) { toast(isDrill ? 'Already the live drill' : 'Already the shipped stage'); return; }
    openSheet(`<h2 class="sheetTitle">Drop these unsaved edits?</h2><p class="muted">${isDrill ? 'The table goes back to the live drill. Nothing is unpublished, and the drill everyone sees stays as it is.' : 'Your correction is removed from this phone. The original stage comes back.'} Export it first if you want a copy.</p><button type="button" class="bigBtn danger" data-action="df-reset-do">RESET</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'fix-reset' });
  }
  function resetDo() {
    closeSheet();
    if (isDrill) {
      const out = removeDrillEdit(id);
      if (out.error) { toast(out.error); return; }
      // phone copy only — the published row is what everyone sees, and RESET does not delete it
    } else {
      if (!drillEditorAllowed()) { toast('DEV MODE is locked'); return; }
      removeOverride(stageOverrideId(gameId, spec.stageId));
      clearStageCache(gameId);
    }
    doc = loadDoc();
    ui.msg = '';
    ui.sel = { kind: 'cue' };
    toast(isDrill ? 'Back to the live drill' : 'Restored the shipped stage');
    render();
  }
  async function exportOne() {
    if (readText() === false) { render(); return; }
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

  async function confirmDelete() {
    if (!isDrill || !drillEditorAllowed()) return;
    if (!ownerAccountSignedIn()) { toast('Sign in as the owner account to delete this drill. Nothing was changed.'); return; }
    const out = await hideDrill(id);
    if (!alive) return;
    if (out.error) { toast(out.error); return; }
    closeSheet();
    toast('Drill deleted.');
    ctx.go('#drills');
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
    if (action === 'df-add-open') { openAddSheet(); return true; }
    if (action === 'df-diagram') { diagramInput().click(); return true; }
    if (action === 'df-diagram-clear') {
      shot().diagramImage = 'off';
      ui.msg = '';
      closeSheet();
      render();
      return true;
    }
    if (action === 'df-add-cue') { addCueBall(); return true; }
    if (action === 'df-add-ob') { addObjectBall(); return true; }
    if (action === 'df-mark') { addMark(el.dataset.t); return true; }
    if (action === 'df-rail-ball') { addRailBall(); return true; }
    if (action === 'df-mark-del') {
      if (ui.sel?.kind === 'mark') marks().splice(ui.sel.i, 1);
      if (!marks().length) delete shot().tableMarks;
      ui.sel = { kind: 'cue' };
      render();
      return true;
    }
    if (action === 'df-mark-dash') {
      const m = ui.sel?.kind === 'mark' ? marks()[ui.sel.i] : null;
      if (m) m.dashed = !m.dashed;
      render();
      return true;
    }
    if (action === 'df-mark-fill') {
      const m = ui.sel?.kind === 'mark' ? marks()[ui.sel.i] : null;
      if (m) m.fill = !m.fill;
      render();
      return true;
    }
    if (action === 'df-mark-num') {
      const m = ui.sel?.kind === 'mark' ? marks()[ui.sel.i] : null;
      if (m) m.n = Math.max(0, Math.min(20, (m.n || 0) + Number(el.dataset.d || 1)));
      render();
      return true;
    }
    if (action === 'df-remove-ball') { removeBall(); return true; }
    if (action === 'df-remove-cue-line') { removeCueLine(); return true; }
    if (action === 'df-remove-ob-line') { removeObjectLine(); return true; }
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
    if (action === 'df-import') {
      if (!isDrill) return true;
      ctx.root.querySelector('#fixImport')?.click();
      return true;
    }
    if (action === 'df-export-all') { exportAll(); return true; }
    if (action === 'df-delete') {
      if (!isDrill) return true;
      openSheet(`<h2 class="sheetTitle">Delete this drill?</h2><p class="muted">This removes it for every account. It will not be in any list, category, or search, and it cannot be played. Tap DELETE DRILL to confirm, or CANCEL to keep it.</p><button type="button" class="bigBtn danger" data-action="df-delete-do">DELETE DRILL</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'confirm' });
      return true;
    }
    if (action === 'df-delete-do') { confirmDelete(); return true; }
    return false;
  }

  return { render, onAction, destroy() { alive = false; ac?.abort(); ac = null; drag = null; document.body.classList.remove('fix-full'); document.getElementById('fixDiagram')?.remove(); } };
}
