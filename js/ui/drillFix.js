/**
 * Phone editor for one shipped PKF drill (#drillfix/<id>).
 * Mounted only while drillEditorAllowed() is true. Drag balls and path points on the
 * table, or type diamond positions. Save / Reset / Export talk to drills/ownerEdits.js.
 * Does not invent a route — path points stay as they are until you move, add or remove one.
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

export function createDrillFix(ctx, id) {
  const ch0 = getDrillById(id);
  if (!drillEditorAllowed() || !canFixDrill(ch0)) {
    return {
      render() { ctx.root.innerHTML = ''; },
      onAction() { return false; },
      destroy() {}
    };
  }
  let doc = editingDoc(id);
  const ui = { tool: 'move', sel: { kind: 'cue' }, msg: '' };
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
    return null;
  }
  function nudge(dxd, dyd) {
    const t = targetOf(ui.sel);
    if (!t) return;
    const q = { x: t.x + dxd * DIAMOND_UNITS, y: t.y + dyd * DIAMOND_UNITS };
    if (ui.sel.kind === 'cue' || ui.sel.kind === 'ball' || ui.sel.kind === 'blocker') placeBall(t, q);
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
    try { return challengeFromPkfDoc(doc); }
    catch { return { id: doc.id, name: doc.title, cueBallPosition: shot().cueBallPosition, ballPositions: shot().ballPositions || [], cueBallPath: shot().cueBallPath || [], objectBallPaths: shot().objectBallPaths || [], targetPocket: shot().targetPocket, blockers: shot().blockers || [] }; }
  }

  function selLabel() {
    const sel = ui.sel;
    if (!sel) return 'Nothing selected';
    if (sel.kind === 'cue') return 'Cue ball';
    if (sel.kind === 'ball') return `${sel.n}-ball`;
    if (sel.kind === 'blocker') return `Blocker ${sel.n}`;
    if (sel.kind === 'cuePath') return `Cue path point ${sel.i + 1}`;
    if (sel.kind === 'obPath') return `Object path point ${sel.i + 1}`;
    return '';
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

  function render() {
    if (!drillEditorAllowed()) { ctx.root.innerHTML = ''; return; }
    const overridden = !!getDrillEdit(id);
    const s = shot();
    const cc = s.cueContact || { vTips: 0, hTips: 0 };
    const table = renderStageTable(preview(), { showCuePath: true, showAim: true, showObPath: true, showZones: true, className: 'table-diagram stage-table' });
    ctx.root.innerHTML = `<div class="playScreen drillFix" data-drill-fix="${esc(id)}" data-overridden="${overridden ? 1 : 0}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="go" data-href="#play/drills/${esc(id)}" aria-label="Back to drill">‹</button>
        <div class="phTitle"><small>OWNER EDIT${overridden ? ' · SAVED ON THIS PHONE' : ''}</small><b>${esc(doc.title || 'Drill')}</b></div>
      </div>
      <div class="fixScroll">
        <div id="fixTable" class="fixTable">${table}</div>
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
        <div class="eyebrow">TARGET POCKET</div>
        <div class="pockets">${PKEYS.map((k) => `<button type="button" class="${s.targetPocket === k ? 'on' : ''}" data-action="df-pocket" data-p="${k}">${PSHORT[k]}</button>`).join('')}</div>
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

  function paintHandles() {
    const svg = ctx.root.querySelector('#fixTable svg');
    if (!svg) return;
    svg.querySelectorAll('.fix-handle').forEach((n) => n.remove());
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
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
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
    return best;
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
      if (drag.sel.kind === 'cue' || drag.sel.kind === 'ball' || drag.sel.kind === 'blocker') q = snapPoint(q);
      else q = clampPath(q);
      drag.to = q;
      const svg = t.querySelector('svg');
      if (drag.sel.kind === 'cue') {
        const g = svg.querySelector('g.ball[data-n="cue"]');
        if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      } else if (drag.sel.kind === 'ball' || drag.sel.kind === 'blocker') {
        const g = svg.querySelector(`g.ball[data-n="${drag.sel.n}"]`);
        if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
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
        return;
      }
      ui.sel = d.sel;
      if (d.moved && d.to && d.item) {
        if (d.sel.kind === 'cue' || d.sel.kind === 'ball' || d.sel.kind === 'blocker') placeBall(d.item, d.to);
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
      if (ui.sel.kind === 'cue' || ui.sel.kind === 'ball' || ui.sel.kind === 'blocker') placeBall(t, q);
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
  }
  function save() {
    if (!drillEditorAllowed()) return;
    readText();
    if (!String(doc.title || '').trim()) { ui.msg = 'Title cannot be empty.'; render(); return; }
    if (!String(doc.category || '').trim()) { ui.msg = 'Category cannot be empty.'; render(); return; }
    doc.metadata = { ...(doc.metadata || {}), updated: new Date().toISOString().slice(0, 10) };
    const out = setDrillEdit(id, doc);
    if (out.error) { ui.msg = out.error; render(); return; }
    doc = JSON.parse(JSON.stringify(out.doc));
    ui.msg = '';
    toast('Saved on this phone. This drill now uses your correction.');
    render();
  }
  function resetAsk() {
    if (!getDrillEdit(id) && JSON.stringify(doc) === JSON.stringify(shippedDoc(id))) {
      toast('Already the shipped drill');
      return;
    }
    openSheet(`<h2 class="sheetTitle">Reset to the shipped drill?</h2><p class="muted">Your correction for this drill is removed from this phone. The original comes back. Export it first if you want a copy.</p><button type="button" class="bigBtn danger" data-action="df-reset-do">RESET THIS DRILL</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'fix-reset' });
  }
  function resetDo() {
    closeSheet();
    const out = removeDrillEdit(id);
    if (out.error) { toast(out.error); return; }
    doc = editingDoc(id);
    ui.msg = '';
    ui.sel = { kind: 'cue' };
    toast('Restored the shipped drill');
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

  return { render, onAction, destroy() { ac?.abort(); ac = null; drag = null; } };
}
