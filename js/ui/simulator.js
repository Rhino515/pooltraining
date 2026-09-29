/**
 * Shot Simulator screen (#sim, #sim/s=<shared code>, #sim/target, #sim/eight/<group|pro>).
 * Set up balls on a true-scale table, aim / tip / SPEED, then watch a deterministic physics simulation
 * (js/sim/physics.js) with coloured ball tracks, replay, slow motion, step-by-event and skip-to-end.
 * Plus: undo/redo, continue with the next shot, racks and random run-out layouts, saved-shot library with
 * collections, share links, JSON/PNG export, Find a Shot, shape zones, drawing tools, Target Game and
 * "Turn into drill". All original Pool IQ UI.
 */
import { renderTableDiagram, BALL_COLORS, POCKETS } from '../tableDiagram.js';
import * as P from '../sim/physics.js';
import * as L from '../sim/layouts.js';
import * as S from '../sim/solver.js';
import * as SH from '../sim/share.js';
import * as LIB from '../sim/library.js';
import { aimFromPoints, aimViewSVG, fullnessWord } from '../games/aimView.js';
import { cueBallSVG } from '../games/cueBallDiagram.js';
import { openTipPicker, closeTipPicker, tipPickerOpen } from './tipPicker.js';
import { toDiamonds, fmtDiamond } from '../games/diamonds.js';
import { contactText } from '../games/text.js';
import { speedMeaning, personalFactor, formatSpeed, speedLabel } from '../games/speed.js';
import { esc, tipClockLabel } from '../games/recipe.js';
import { speedDiagramSVG } from '../games/speedDiagram.js';
import * as PV from '../sim/preview.js';
import { openSheet, closeSheet, toast, stars } from './sheet.js';
import { lsSet } from '../storage.js';
import * as TC from '../sim/tableCal.js';
import { offsetDragPoint } from '../sim/drag.js';
import { SCAN_PLACE_LABEL, detectBalls, perspectiveWarp, defaultCorners } from '../sim/scan.js';
import { planRunoutOptions, groupChoices } from '../sim/runout.js';
import { SHOT_TYPES, POCKET_CHOICES, generateShot, wayLabel } from '../sim/randomShot.js';

const R = P.R;
const f2 = (v) => Math.round(v * 100) / 100;
const f1 = (v) => Math.round(v * 10) / 10;
const POCKET_WORDS = { TL: 'top-left corner', TM: 'top side', TR: 'top-right corner', BL: 'bottom-left corner', BM: 'bottom side', BR: 'bottom-right corner' };
const ANNO_COLORS = ['#ffd34d', '#55e5ff', '#ff5d73', '#f4fbff'];
const TOOLS = [
  { id: 'arrow', label: '➚ Arrow' },
  { id: 'line', label: '╱ Line' },
  { id: 'circle', label: '◯ Circle' },
  { id: 'text', label: 'T Text' },
  { id: 'measure', label: '📏 Measure' },
  { id: 'erase', label: '⌫ Erase' }
];
const RATES = [0.25, 0.5, 1, 2];
export const DRAFT_KEY = 'poolIQDrillDraft';
const trackColor = (id) => (id === 'cue' ? '#f4fbff' : id === 8 ? '#9aa6b8' : BALL_COLORS[id] || '#94a3b8');
const ballWord = (id) => (id === 'cue' ? 'cue ball' : `${id}-ball`);
const posText = (p) => { const d = toDiamonds(p); return `${fmtDiamond(d.fromHead)} · ${fmtDiamond(d.fromTop)}`; };
const clone = (o) => JSON.parse(JSON.stringify(o));
const normDeg = (a) => ((a % 360) + 360) % 360;

function defaultLayout() {
  return { balls: [{ id: 'cue', x: 25, y: 25 }, { id: 1, x: 62.5, y: 18.75 }], shot: { aim: 12, speed: 2, vTips: 0, hTips: 0 }, annotations: [] };
}

export function createSimScreen(ctx, args = []) {
  const store = LIB.loadSim();
  const set = store.settings;
  if (set.tableFt == null) set.tableFt = TC.DEFAULT_FT;
  function tableSpec() { return TC.spec(set.tableFt); }
  function rad() { return TC.diagramRadius(tableSpec()); }
  function simOpt(extra = {}) {
    const o = { ...extra };
    if (!TC.isNine(tableSpec())) o.table = tableSpec();
    return o;
  }
  const cur = store.current && Array.isArray(store.current.balls) ? store.current : defaultLayout();
  const st = {
    balls: clone(cur.balls),
    shot: { aim: 0, speed: 2, vTips: 0, hTips: 0, ...(cur.shot || {}) },
    annotations: clone(cur.annotations || []),
    currentId: cur.currentId || null,
    name: cur.name || '',
    mode: 'edit', // edit | play
    sel: null,
    aimBall: null,
    aimPocket: null,
    tool: null,
    color: ANNO_COLORS[0],
    res: null,
    playT: 0,
    playing: false,
    rate: set.playback || 1,
    showTracks: set.paths !== false,
    shape: false,
    findTarget: cur.findTarget || null,
    placing: null, // 'find' when waiting for a target tap
    game: null,
    full: false,
    scan: null,
    runout: null
  };
  let past = [];
  let future = [];
  let startSnap = null;
  let lastPushKind = null;
  let lastPushAt = 0;
  let raf = 0;
  let timer = 0;
  let drag = null;
  let lastFrame = 0;
  let destroyed = false;

  function snap() {
    return { balls: st.balls, shot: st.shot, annotations: st.annotations };
  }
  startSnap = clone(snap());
  /** Push an undo point before a change. kind coalesces rapid aim/tip/speed tweaks into one step. */
  function pushUndo(kind = 'layout') {
    const now = Date.now();
    if (kind !== 'layout' && kind === lastPushKind && now - lastPushAt < 1500) { lastPushAt = now; return; }
    past.push(clone(snap()));
    if (past.length > 100) past.shift();
    future = [];
    lastPushKind = kind;
    lastPushAt = now;
  }
  function restore(s) {
    st.balls = clone(s.balls);
    st.shot = clone(s.shot);
    st.annotations = clone(s.annotations || []);
    st.sel = null;
    leavePlay();
  }
  function persist() {
    store.current = { balls: st.balls, shot: st.shot, annotations: st.annotations, currentId: st.currentId, name: st.name, findTarget: st.findTarget };
    if (!st.game) LIB.saveSim(store);
  }

  // ------------------------------------------------------------------ geometry helpers
  const cueBall = () => st.balls.find((b) => b.id === 'cue');
  const layout = () => st.balls.map((b) => ({ id: b.id, x: b.x, y: b.y }));
  function effectiveV() {
    let s = st.shot.speed;
    if (set.useCal) {
      const f = personalFactor(ctx.getState().speedCal, s);
      if (f) s = s / f;
    }
    return P.speedToV0(s, tableSpec());
  }
  function prediction() {
    const cue = cueBall();
    if (!cue) return null;
    // the line shows where the cue ball actually travels: stick aim + squirt from side spin
    return P.predictContact(layout(), st.shot.aim + (Number(st.shot.hTips) || 0) * P.SQUIRT_DEG_PER_TIP, rad());
  }
  function aimInfoFor(pred) {
    const cue = cueBall();
    if (!pred || pred.type !== 'ball' || !cue) return null;
    const a = aimFromPoints(cue, pred.ghost, pred.ball);
    const frac = fullnessWord(a.fullness);
    const sideWord = a.side === 'right' ? 'Right' : a.side === 'left' ? 'Left' : '';
    const label = frac === 'Full' ? 'Full' : `${sideWord} ${frac}`;
    return { ...a, ob: { n: pred.ball.id, x: pred.ball.x, y: pred.ball.y }, ghost: pred.ghost, from: cue, frac, label, deg: Math.round(a.theta), plain: `${label} hit`, ballR: rad() };
  }

  // ------------------------------------------------------------------ v11.1 full-path aim preview
  // Same physics, same inputs as shoot(): the path shown is where the balls really go at this aim/SPEED/tip.
  let pvCache = { key: '', res: null, paths: [] };
  let pvTimer = 0;
  let pvLastRun = 0;
  const fullPathOn = () => set.fullPath !== false && !st.game && st.mode === 'edit' && !st.runout && !st.scan;
  function previewShot() {
    return { aim: st.shot.aim, V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips, table: tableSpec() };
  }
  function previewKey() {
    return JSON.stringify([layout(), previewShot(), tableSpec().ft]);
  }
  function previewData() {
    if (!fullPathOn() || !cueBall()) return null;
    const key = previewKey();
    if (pvCache.key === key) return pvCache;
    if (L.validateLayout(layout()).length) { pvCache = { key, res: null, paths: [] }; return pvCache; }
    const res = PV.runPreview(layout(), previewShot());
    pvLastRun = performance.now();
    pvCache = { key, res, paths: PV.previewPaths(res) };
    return pvCache;
  }
  function previewLayer() {
    const d = previewData();
    if (!d || !d.res) return '';
    return PV.previewSVG(d.paths, { aimBall: st.aimBall, aimPocket: st.aimPocket, truncated: d.res.truncated });
  }
  function previewSummaryText() {
    const d = pvCache.key === previewKey() ? pvCache : null;
    if (!d || !d.res) return 'Preview: working…';
    return PV.previewSummary(d.paths, { aimBall: st.aimBall, aimPocket: st.aimPocket });
  }
  /** Throttled redraw while aim / SPEED / tip change (keeps phones smooth: at most one physics run per 80 ms) */
  function schedulePreview() {
    if (!fullPathOn()) return;
    clearTimeout(pvTimer);
    const wait = Math.max(0, PV.PREVIEW_THROTTLE_MS - (performance.now() - pvLastRun));
    pvTimer = setTimeout(() => {
      if (destroyed) return;
      const g = ctx.root.querySelector('#simPreview');
      if (g) g.innerHTML = previewLayer();
      const sm = ctx.root.querySelector('#pvSummary');
      if (sm) sm.textContent = previewSummaryText();
    }, wait);
  }

  // ------------------------------------------------------------------ SVG pieces
  function aimOverlay() {
    const cue = cueBall();
    if (!cue || st.mode !== 'edit') return '';
    const pred = prediction();
    let s = '<g class="sim-aim" pointer-events="none">';
    if (pred?.type === 'ball') {
      const g = pred.ghost;
      s += `<line class="aim-line" x1="${f2(cue.x)}" y1="${f2(cue.y)}" x2="${f2(g.x)}" y2="${f2(g.y)}" stroke="#f4fbff" stroke-width="0.32" stroke-dasharray="1 0.6" opacity="0.9"/>`;
      s += `<circle class="aim-ghost" cx="${f2(g.x)}" cy="${f2(g.y)}" r="${rad()}" fill="#ffffff22" stroke="#f4fbff" stroke-width="0.2" stroke-dasharray="0.45 0.3"/>`;
      if (set.tangent) {
        const ob = pred.ball;
        const L1 = 14;
        s += `<line class="ob-line" x1="${f2(ob.x)}" y1="${f2(ob.y)}" x2="${f2(ob.x + pred.obDir.x * L1)}" y2="${f2(ob.y + pred.obDir.y * L1)}" stroke="#ffd34d" stroke-width="0.3" stroke-dasharray="0.9 0.6" opacity="0.9"/>`;
        if (pred.cut > 1) s += `<line class="tangent-line" x1="${f2(g.x)}" y1="${f2(g.y)}" x2="${f2(g.x + pred.tangent.x * 12)}" y2="${f2(g.y + pred.tangent.y * 12)}" stroke="#9ff0ff" stroke-width="0.24" stroke-dasharray="0.5 0.5" opacity="0.8"/>`;
      }
    } else if (pred?.type === 'rail') {
      const p = pred.point;
      s += `<line class="aim-line" x1="${f2(cue.x)}" y1="${f2(cue.y)}" x2="${f2(p.x)}" y2="${f2(p.y)}" stroke="#f4fbff" stroke-width="0.32" stroke-dasharray="1 0.6" opacity="${fullPathOn() ? 0.35 : 0.9}"/>`;
      const d = P.aimVector(st.shot.aim);
      const onX = Math.abs(p.x - rad()) < 0.05 || Math.abs(p.x - (100 - rad())) < 0.05;
      const r = onX ? { x: -d.x, y: d.y } : { x: d.x, y: -d.y };
      if (!fullPathOn()) s += `<line class="rail-preview" x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(p.x + r.x * 10)}" y2="${f2(p.y + r.y * 10)}" stroke="#f4fbff" stroke-width="0.24" stroke-dasharray="0.5 0.6" opacity="0.5"/>`;
    }
    if (st.aimPocket && POCKETS[st.aimPocket]) {
      const pk = POCKETS[st.aimPocket];
      s += `<circle class="aim-pocket" cx="${pk.x}" cy="${pk.y}" r="${pk.r + 0.9}" fill="none" stroke="#55e5ff" stroke-width="0.4" stroke-dasharray="1 0.7"/>`;
    }
    return s + '</g>';
  }
  function zonesSVG() {
    let s = '';
    if (st.shape && st.mode === 'edit') {
      const id = st.aimBall ?? st.sel;
      if (id != null && id !== 'cue' && st.balls.some((b) => b.id === id)) {
        for (const z of S.shapeZones(layout(), id, set.maxCut)) {
          s += `<polygon class="shape-zone" data-pocket="${z.pocket}" points="${z.polygon.map((p) => `${f2(p.x)},${f2(p.y)}`).join(' ')}" fill="#46e7a01f" stroke="#46e7a0" stroke-width="0.2" stroke-dasharray="0.8 0.5" pointer-events="none"/>`;
        }
      }
    }
    const t = st.game ? st.game.rounds[st.game.index]?.target : st.findTarget;
    if (t) {
      s += `<g class="sim-target" pointer-events="none">`;
      for (const [r, a] of [[10, 0.13], [6.5, 0.24], [3.5, 0.45]]) s += `<circle cx="${f2(t.x)}" cy="${f2(t.y)}" r="${r}" fill="rgba(255,199,91,${a})" stroke="#ffc75b" stroke-width="0.3" ${r === 3.5 ? '' : 'stroke-dasharray="1.1 0.7"'}/>`;
      s += `<text x="${f2(t.x)}" y="${f2(t.y - 10.6 < 2 ? t.y + 12.4 : t.y - 10.6)}" text-anchor="middle" font-size="1.7" font-weight="800" fill="#ffc75b" stroke="#062a32" stroke-width="0.3" paint-order="stroke">TARGET</text></g>`;
    }
    return s;
  }
  function annoSVG(a, i) {
    const c = a.color || ANNO_COLORS[0];
    const [p0, p1] = a.points;
    let s = `<g class="anno" data-i="${i}" data-kind="${a.kind}">`;
    if (a.kind === 'text') {
      s += `<text x="${f2(p0.x)}" y="${f2(p0.y)}" font-size="2.6" font-weight="800" fill="${c}" stroke="#062a32" stroke-width="0.4" paint-order="stroke" font-family="system-ui,sans-serif">${esc(a.text || '')}</text>`;
    } else if (a.kind === 'circle' && p1) {
      s += `<circle cx="${f2(p0.x)}" cy="${f2(p0.y)}" r="${f2(Math.hypot(p1.x - p0.x, p1.y - p0.y))}" fill="none" stroke="${c}" stroke-width="0.45"/>`;
    } else if (p1) {
      s += `<line x1="${f2(p0.x)}" y1="${f2(p0.y)}" x2="${f2(p1.x)}" y2="${f2(p1.y)}" stroke="${c}" stroke-width="0.45" stroke-linecap="round" ${a.kind === 'measure' ? 'stroke-dasharray="0.8 0.5"' : ''}/>`;
      if (a.kind === 'arrow') {
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const h = 2;
        const q = (da) => `${f2(p1.x - h * Math.cos(ang + da))},${f2(p1.y - h * Math.sin(ang + da))}`;
        s += `<polygon points="${f2(p1.x)},${f2(p1.y)} ${q(0.45)} ${q(-0.45)}" fill="${c}"/>`;
      }
      if (a.kind === 'measure') {
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const ang = Math.round(normDeg((Math.atan2(-(p1.y - p0.y), p1.x - p0.x) * 180) / Math.PI));
        s += `<text x="${f2((p0.x + p1.x) / 2)}" y="${f2((p0.y + p1.y) / 2 - 1)}" text-anchor="middle" font-size="1.8" font-weight="800" fill="${c}" stroke="#062a32" stroke-width="0.35" paint-order="stroke" font-family="system-ui,sans-serif">${f2(len / 12.5)}◆ · ${f1(len)}" · ${ang}°</text>`;
      }
    }
    return s + '</g>';
  }
  function tracksSVG(uptoIndex = null) {
    if (!st.res || !st.showTracks) return '';
    const r = st.res;
    const n = uptoIndex == null ? r.frames.length - 1 : uptoIndex;
    let s = '<g class="sim-tracks" pointer-events="none">';
    r.ids.forEach((id, i) => {
      if (!(r.distance[id] > 0.05)) return;
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const p = r.frames[k].p[i];
        if (!p) break;
        if (k % 2 === 0 || k === n) pts.push(`${f2(p[0])},${f2(p[1])}`);
      }
      if (pts.length > 1) s += `<polyline class="track" data-ball="${id}" points="${pts.join(' ')}" fill="none" stroke="${trackColor(id)}" stroke-width="${id === 'cue' ? 0.42 : 0.36}" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>`;
    });
    return s + '</g>';
  }
  function frameIndex() {
    if (!st.res) return 0;
    return Math.max(0, Math.min(st.res.frames.length - 1, Math.floor(Math.max(0, st.playT) * 60 + 1e-9)));
  }
  function tableSVG() {
    const srcBalls = st.runout?.steps?.length ? st.runout.steps[st.runout.i].balls : (st.scan?.phase === 'confirm' ? st.scan.balls : st.balls);
    const balls = srcBalls.map((b) => ({ id: b.id, x: b.x, y: b.y, stripe: b.stripe }));
    const under = `<g id="simZones">${zonesSVG()}</g><g id="simTracks">${st.mode === 'play' ? tracksSVG(frameIndex()) : ''}</g><g id="simUnder">${st.runout || st.scan ? '' : aimOverlay()}</g>`;
    let over = `<g id="simPreview">${previewLayer()}</g><g id="simAnno">${st.annotations.map(annoSVG).join('')}</g><g id="simDraft"></g>`;
    if (st.sel != null && st.mode === 'edit') {
      const b = srcBalls.find((q) => q.id === st.sel);
      if (b) over += `<circle class="sel-ring" data-selected="1" cx="${f2(b.x)}" cy="${f2(b.y)}" r="${rad() + 1.15}" fill="none" stroke="#55e5ff" stroke-width="0.7" pointer-events="none"/>`;
    }
    if (st.runout?.steps?.length) {
      const step = st.runout.steps[Math.min(st.runout.i, st.runout.steps.length - 1)];
      const pk = POCKETS[step.pocket];
      if (pk) over += `<circle class="run-pocket" cx="${pk.x}" cy="${pk.y}" r="${pk.r + 1.3}" fill="none" stroke="#ffd34d" stroke-width="0.5" pointer-events="none"/>`;
      const tb = step.balls.find((b) => String(b.id) === String(step.ball));
      if (tb) over += `<circle class="run-ball" cx="${f2(tb.x)}" cy="${f2(tb.y)}" r="${f2(rad() + 1.5)}" fill="none" stroke="#ffd34d" stroke-width="0.45" pointer-events="none"/>`;
      const cue = step.balls.find((b) => b.id === 'cue');
      const ghost = step.ghost || (tb && pk ? { x: tb.x - ((pk.x - tb.x) / (Math.hypot(pk.x - tb.x, pk.y - tb.y) || 1)) * 2 * rad(), y: tb.y - ((pk.y - tb.y) / (Math.hypot(pk.x - tb.x, pk.y - tb.y) || 1)) * 2 * rad() } : null);
      if (cue && ghost) {
        over += `<line class="run-ghost-aim" x1="${f2(cue.x)}" y1="${f2(cue.y)}" x2="${f2(ghost.x)}" y2="${f2(ghost.y)}" stroke="#ffc75b" stroke-width="0.36" stroke-dasharray="0.9 0.5" pointer-events="none"/>`;
        over += `<circle class="run-ghost" cx="${f2(ghost.x)}" cy="${f2(ghost.y)}" r="${f2(rad())}" fill="#ffffff28" stroke="#cff9ff" stroke-width="0.22" stroke-dasharray="0.5 0.35" pointer-events="none"/>`;
        if (tb) {
          over += `<circle class="run-overlap" cx="${f2((ghost.x + tb.x) / 2)}" cy="${f2((ghost.y + tb.y) / 2)}" r="${f2(rad() * 0.55)}" fill="#55e5ff22" pointer-events="none"/>`;
          if (pk) over += `<line class="run-ob" x1="${f2(tb.x)}" y1="${f2(tb.y)}" x2="${f2(pk.x)}" y2="${f2(pk.y)}" stroke="#55e5ff" stroke-width="0.28" stroke-dasharray="0.8 0.5" pointer-events="none"/>`;
        }
      }
      if (step.zone) over += `<circle class="run-zone" cx="${f2(step.zone.x)}" cy="${f2(step.zone.y)}" r="${step.zone.r}" fill="#46e7a022" stroke="#46e7a0" stroke-width="0.3" stroke-dasharray="1.1 0.6" pointer-events="none"/>`;
      const pv = PV.runPreview(step.balls, { aim: step.aim, V: P.speedToV0(step.speed, tableSpec()), vTips: step.vTips, hTips: step.hTips, table: tableSpec() });
      over += PV.previewSVG(PV.previewPaths(pv));
    }
    return renderTableDiagram({ balls, ballR: rad(), hitR: Math.max(7.2, rad() * 3.4), grid: set.grid === 'off' ? false : set.grid === 'half' ? 'half' : true, headString: true, extraUnder: under, extraOver: over }, { className: 'table-diagram sim-svg', id: 'simSvg' });
  }

  // ------------------------------------------------------------------ panel pieces
  function aimRowHTML() { return ''; }
  function tipSpeedHTML() {
    const s = st.shot;
    return `<div class="simTipSpeed">
      <button type="button" class="simTip" data-action="sim-tip" aria-label="Cue-ball tip position">${cueBallSVG({ vTips: s.vTips, hTips: s.hTips }, { size: 'sm', interactive: true, id: 'simTipBall' })}<small data-tip="${s.vTips},${s.hTips}">${esc(contactText(s.vTips, s.hTips))}</small><small class="tipClock" data-tip-clock>${esc(tipClockLabel(s.vTips, s.hTips, { oclock: true }))}</small></button>
      <div class="simSpeed">
        <div class="spRow"><button type="button" class="spBtn" data-action="sim-speed" data-v="-0.25" aria-label="Slower">−</button><b data-speed="${formatSpeed(s.speed)}">${speedLabel(s.speed)}</b><button type="button" class="spBtn" data-action="sim-speed" data-v="0.25" aria-label="Faster">+</button></div>
        <input type="range" class="spRange" id="simSpeedRange" min="0.3" max="${P.SPEED_MAX}" step="0.05" value="${s.speed}" aria-label="Speed"/>
      </div>
    </div>`;
  }
  function trayHTML() {
    const on = new Set(st.balls.map((b) => String(b.id)));
    const ids = ['cue', ...Array.from({ length: 15 }, (_, i) => i + 1)];
    return `<div class="simTray" role="group" aria-label="Ball tray">${ids.map((id) => `<button type="button" class="trayBall${on.has(String(id)) ? ' on' : ''}${String(st.sel) === String(id) ? ' sel' : ''}${id !== 'cue' && id >= 9 ? ' stripe' : ''}" data-action="sim-tray" data-id="${id}" style="--c:${id === 'cue' ? '#f5f7fa' : BALL_COLORS[id]}" aria-label="${id === 'cue' ? 'Cue ball' : `Ball ${id}`}">${id === 'cue' ? '' : `<i>${id}</i>`}</button>`).join('')}</div>`;
  }
  function selHTML() {
    const b = st.balls.find((q) => q.id === st.sel);
    if (!b || st.full) return '';
    return `<div class="simSel"><span class="selName"><b>${esc(ballWord(b.id))}</b></span>
      <div class="nudgePad"><button type="button" class="nudge" data-action="sim-move" data-dx="-1" data-dy="0" aria-label="Move left">←</button><button type="button" class="nudge" data-action="sim-move" data-dx="0" data-dy="-1" aria-label="Move up">↑</button><button type="button" class="nudge" data-action="sim-move" data-dx="0" data-dy="1" aria-label="Move down">↓</button><button type="button" class="nudge" data-action="sim-move" data-dx="1" data-dy="0" aria-label="Move right">→</button></div>
      <button type="button" class="nudge danger" data-action="sim-remove" aria-label="Remove ball">Remove</button></div>`;
  }
  function drawToolsHTML() {
    return `<div class="simDraw"><div class="chips">${TOOLS.map((t) => `<button type="button" class="chip${st.tool === t.id ? ' active' : ''}" data-action="sim-tool" data-v="${t.id}">${t.label}</button>`).join('')}</div>
      <div class="chips">${ANNO_COLORS.map((c) => `<button type="button" class="swatch${st.color === c ? ' active' : ''}" data-action="sim-color" data-v="${c}" style="--c:${c}" aria-label="Colour ${c}"></button>`).join('')}<button type="button" class="chip" data-action="sim-anno-clear" ${st.annotations.length ? '' : 'disabled'}>Clear drawings</button><button type="button" class="chip done" data-action="sim-draw">Done drawing</button></div></div>`;
  }
  function resultHTML() {
    const r = st.res;
    if (!r) return '';
    const d = P.describeResult(r);
    const cueF = r.final.find((b) => b.id === 'cue');
    const done = st.playT >= r.duration - 1e-6;
    let game = '';
    if (st.game && done) {
      const rd = st.game.rounds[st.game.index];
      game = rd.stars != null ? `<div class="gameRound" data-stars="${rd.stars}">${stars(rd.stars)} <b>${rd.pocketed ? (rd.stars ? `${rd.stars} star${rd.stars > 1 ? 's' : ''}` : 'Pocketed — missed the target') : r.scratch ? 'Scratch — no stars' : 'Missed the pot — no stars'}</b></div>` : '';
    }
    return `<div class="simResult${done ? ' done' : ''}" data-done="${done ? 1 : 0}" data-pocketed="${esc(r.pocketed.map((p) => `${p.id}:${p.pocket}`).join(','))}">
      <div class="eyebrow">${done ? 'RESULT' : 'SIMULATING…'} <span class="muted small">physics simulation · an approximation</span></div>
      <p>${d.firstHit != null ? `Cue ball hits the ${d.firstHit} first. ` : 'Cue ball touches no ball. '}${d.pots.length ? `<b class="green">${esc(d.pots.join(', '))}</b>. ` : 'Nothing pocketed. '}${d.scratch ? '<b class="red">Scratch!</b> ' : ''}Cue ball: ${d.rails} rail${d.rails === 1 ? '' : 's'}${cueF.on ? `, stops at ${posText(cueF)}` : ''}.</p>${game}
    </div>`;
  }
  function headHTML() {
    const g = st.game;
    const title = g ? `Target Game · Round ${g.index + 1}/${g.rounds.length}` : 'Shot Simulator';
    const sub = g ? `<span id="simTimer" class="simTimer">${timerText()}</span> · ${g.rounds.reduce((a, r) => a + (r.stars || 0), 0)}★ so far` : 'Physics simulation — an approximation';
    return `<div class="playHead simHead"><button type="button" class="phBack" data-action="sim-exit" aria-label="Exit">${st.full ? 'EXIT' : '‹'}</button><div class="phTitle"><b>${esc(title)}</b><small>${sub}</small></div>
      <div class="simHeadBtns">${g ? '' : `<button type="button" class="hBtn" data-action="sim-undo" ${past.length ? '' : 'disabled'} aria-label="Undo">↶</button><button type="button" class="hBtn" data-action="sim-redo" ${future.length ? '' : 'disabled'} aria-label="Redo">↷</button>`}<button type="button" class="hBtn act" data-action="sim-actions" aria-label="Actions">${g ? 'Quit' : 'Actions'}</button></div></div>`;
  }
  function tableSizeHTML() {
    if (st.full) return '';
    const ft = tableSpec().ft;
    return `<div class="tableSize" id="tableSize" role="group" aria-label="Table size"><span class="tsLabel">TABLE SIZE</span>${[7, 8, 9].map((n) => `<button type="button" class="tsBtn${ft === n ? ' on' : ''}" data-action="sim-size" data-ft="${n}" data-table-ft="${n}" aria-pressed="${ft === n ? 'true' : 'false'}">${n} FT</button>`).join('')}</div>`;
  }
  function exitBtn() {
    return st.full ? '<button type="button" class="fullExit" data-action="sim-full">EXIT</button>' : '';
  }
  function toolsHTML() {
    if (st.game || st.full) return '';
    return `<div class="simTools" role="group" aria-label="Simulator tools"><button type="button" data-action="sim-scan">SCAN TABLE</button><button type="button" data-action="sim-runout">RUNOUT</button><button type="button" data-action="sim-full">FULL SCREEN</button><button type="button" data-action="sim-rand">RANDOM SHOT</button></div>`;
  }
  function previewNote() {
    if (!fullPathOn()) return '';
    return `<p class="srOnly" id="pvSummary" data-preview-summary>${esc(previewSummaryText())}</p>`;
  }
  function panelHTML() {
    if (st.mode === 'play') return resultHTML();
    if (st.full) return '';
    const findBar = st.findTarget && !st.game ? `<div class="findBar"><span>🎯 Cue-ball target set</span><button type="button" class="chip" data-action="sim-find-run">Find again</button><button type="button" class="chip" data-action="sim-find-clear">Clear target</button></div>` : '';
    const placing = st.placing === 'find' ? '<div class="placeBanner">Tap the table where the cue ball should finish</div>' : '';
    const gameInfo = st.game ? `<div class="gameInfo">Pocket the ${st.balls.find((b) => b.id !== 'cue')?.id} and stop the cue ball on the target. One shot per round.</div>` : '';
    if (st.scan?.phase === 'corners') return scanCornerHTML();
    if (st.scan?.phase === 'confirm') return scanConfirmHTML();
    if (st.runout) return runoutHTML();
    return `${placing}${gameInfo}${findBar}${st.tool ? drawToolsHTML() : ''}${previewNote()}${tipSpeedHTML()}${toolsHTML()}${st.game ? '' : selHTML() + trayHTML()}`;
  }
  function barHTML() {
    if (st.mode === 'play') {
      const done = st.res && st.playT >= st.res.duration - 1e-6;
      const g = st.game;
      const last = g && g.index >= g.rounds.length - 1;
      const main = g
        ? `<button type="button" class="bigBtn" data-action="sim-game-next" ${done ? '' : 'disabled'}>${last ? 'FINISH GAME' : 'NEXT ROUND ›'}</button>`
        : `<button type="button" class="bigBtn alt" data-action="sim-edit">EDIT SHOT</button><button type="button" class="bigBtn" data-action="sim-continue">CONTINUE ▶<small>next shot from here</small></button>`;
      return `<div class="simBar play"><div class="pbRow">
        <button type="button" class="pbBtn" data-action="sim-replay" aria-label="Replay">↺<small>Replay</small></button>
        <button type="button" class="pbBtn" data-action="sim-pause" aria-label="${st.playing ? 'Pause' : 'Play'}">${st.playing ? '❚❚' : '▶'}<small>${st.playing ? 'Pause' : 'Play'}</small></button>
        <button type="button" class="pbBtn" data-action="sim-step" aria-label="Next event">⇥<small>Event</small></button>
        <button type="button" class="pbBtn" data-action="sim-end" aria-label="Skip to end">⏭<small>End</small></button>
        <button type="button" class="pbBtn" data-action="sim-rate" aria-label="Playback speed" data-rate="${st.rate}">${st.rate === 0.25 ? '¼' : st.rate === 0.5 ? '½' : st.rate}×<small>Speed</small></button>
        <button type="button" class="pbBtn${st.showTracks ? ' on' : ''}" data-action="sim-tracks" aria-label="Show tracks">〰<small>Tracks</small></button>
      </div><div class="pbMain${g ? ' one' : ''}">${main}</div></div>`;
    }
    if (st.full) return '';
    if (st.scan || st.runout) return '';
    return `<div class="simBar"><button type="button" class="toolBtn${st.tool ? ' on' : ''}" data-action="sim-draw" aria-label="Draw on the table">✎<small>Draw</small></button>${st.game ? '' : `<button type="button" class="toolBtn${st.shape ? ' on' : ''}" data-action="sim-shape" aria-label="Shape zone">◭<small>Zone</small></button>`}<button type="button" class="bigBtn shootBtn" data-action="sim-shoot" ${cueBall() ? '' : 'disabled'}>SHOOT ▶</button></div>`;
  }

  // ------------------------------------------------------------------ render
  function render() {
    if (destroyed) return;
    const root = ctx.root;
    document.body.classList.toggle('sim-full', !!st.full);
    const tableInner = `${tableSVG()}<div class="dragBubble" id="dragBubble"></div>${exitBtn()}`;
    root.innerHTML = `<div class="simScreen${st.full ? ' is-full' : ''}" data-mode="${st.mode}" data-game="${st.game ? 1 : 0}" data-table-ft="${tableSpec().ft}" data-offset-drag="1" data-scan="${st.scan?.phase || ''}" data-runout="${st.runout ? 1 : 0}">
      <div id="simHeadWrap">${headHTML()}</div>
      <div class="simTable" id="simTable">${tableInner}</div>
      <div id="simSetup">${tableSizeHTML()}</div>
      <div class="simPanel" id="simPanel">${panelHTML()}</div>
      <div id="simBarWrap">${barHTML()}</div>
      <input id="simScanFile" class="srOnly" type="file" accept="image/*" capture="environment" aria-label="Table photo"/>
    </div>`;
    bind();
    persist();
  }
  function refresh(parts = 'all') {
    if (destroyed) return;
    const root = ctx.root;
    const scr = root.querySelector('.simScreen');
    if (!scr) return render();
    scr.dataset.mode = st.mode;
    scr.dataset.game = st.game ? '1' : '0';
    const has = (p) => parts === 'all' || parts.includes(p);
    if (has('table')) root.querySelector('#simTable').innerHTML = `${tableSVG()}<div class="dragBubble" id="dragBubble"></div>${exitBtn()}`;
    if (has('table') || has('head')) root.querySelector('#simHeadWrap').innerHTML = headHTML();
    if (has('table') || has('setup')) root.querySelector('#simSetup').innerHTML = tableSizeHTML();
    if (has('panel')) root.querySelector('#simPanel').innerHTML = panelHTML();
    if (has('bar') || has('table')) root.querySelector('#simBarWrap').innerHTML = barHTML();
    bindRange();
    document.body.classList.toggle('sim-full', !!st.full);
    scr.classList.toggle('is-full', !!st.full);
    scr.dataset.tableFt = String(tableSpec().ft);
    scr.dataset.scan = st.scan?.phase || '';
    scr.dataset.runout = st.runout ? '1' : '0';
    if (st.scan?.phase === 'corners') mountCorners();
    persist();
  }
  function overlayOnly() {
    const u = ctx.root.querySelector('#simUnder');
    if (u) u.innerHTML = aimOverlay();
    schedulePreview();
    const z = ctx.root.querySelector('#simZones');
    if (z) z.innerHTML = zonesSVG();
  }

  // ------------------------------------------------------------------ pointer input on the table
  function toTableXY(clientX, clientY) {
    const svg = ctx.root.querySelector('#simSvg');
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  function toTable(e) { return toTableXY(e.clientX, e.clientY); }
  function activeBalls() { return st.scan?.phase === 'confirm' ? st.scan.balls : st.balls; }
  function ballAt(p, max) {
    const limit = max == null ? Math.max(7.5, rad() * 3.3) : max;
    let best = null;
    let bd = limit;
    for (const b of activeBalls()) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  function pocketAt(p) {
    for (const [k, pk] of Object.entries(POCKETS)) if (Math.hypot(pk.x - p.x, pk.y - p.y) < pk.r + 1.6) return k;
    return null;
  }
  function bind() {
    const tEl = ctx.root.querySelector('#simTable');
    tEl.addEventListener('pointerdown', onDown);
    tEl.addEventListener('pointermove', onMove);
    tEl.addEventListener('pointerup', onUp);
    tEl.addEventListener('pointercancel', onCancel);
    const file = ctx.root.querySelector('#simScanFile');
    if (file) file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = async () => {
        await detectBalls(img);
        st.scan = { phase: 'corners', url, img, corners: defaultCorners(img.naturalWidth, img.naturalHeight) };
        refresh();
      };
      img.src = url;
    });
    bindRange();
    if (st.scan?.phase === 'corners') mountCorners();
  }
  function bindRange() {
    const r = ctx.root.querySelector('#simSpeedRange');
    if (r && !r.dataset.bound) {
      r.dataset.bound = '1';
      r.addEventListener('input', () => {
        pushUndo('speed');
        st.shot.speed = Math.round(Number(r.value) * 100) / 100;
        const b = ctx.root.querySelector('.simSpeed b');
        if (b) { b.textContent = speedLabel(st.shot.speed); b.dataset.speed = formatSpeed(st.shot.speed); }
        const sm = ctx.root.querySelector('.simSpeed small');
        if (sm) sm.textContent = `${speedMeaning(st.shot.speed)}.${set.useCal ? ' · your calibration' : ''}`;
        const dg = ctx.root.querySelector('#simSpeedDiagram');
        if (dg) dg.innerHTML = speedDiagramSVG(st.shot.speed);
        schedulePreview();
        persist();
      });
      r.addEventListener('change', () => {
        if (st.aimBall != null && st.aimPocket) { aimAtBall(st.aimBall, st.aimPocket, true); overlayOnly(); }
        refresh(['head']);
      });
    }
  }
  function onDown(e) {
    if (st.mode !== 'edit') return;
    e.preventDefault();
    const p = toTable(e);
    const tEl = ctx.root.querySelector('#simTable');
    try { tEl.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (st.placing === 'find') { drag = { kind: 'find', start: p }; return; }
    if (st.tool) {
      if (st.tool === 'erase') {
        const g = e.target.closest ? e.target.closest('.anno') : null;
        let idx = g ? Number(g.dataset.i) : -1;
        if (idx < 0) {
          // nearest annotation point within 3"
          let bd = 3;
          st.annotations.forEach((an, i) => an.points.forEach((q) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; idx = i; } }));
        }
        if (idx >= 0) { pushUndo(); st.annotations.splice(idx, 1); refresh(['table', 'panel']); }
        return;
      }
      if (st.tool === 'text') { drag = { kind: 'text', start: p }; return; }
      drag = { kind: 'anno', start: p, cur: p };
      return;
    }
    document.documentElement.classList.add('sim-dragging');
    const b = ballAt(p);
    if (b && !st.game) {
      st.sel = b.id;
      drag = { kind: 'ball', id: b.id, from: { x: b.x, y: b.y }, sx: e.clientX, sy: e.clientY, moved: false };
      return;
    }
    if (b && st.game && b.id !== 'cue') { drag = { kind: 'tapball', id: b.id }; return; }
    drag = { kind: 'aim', sx: e.clientX, sy: e.clientY, pocket: pocketAt(p), moved: false };
  }
  function onMove(e) {
    if (!drag) return;
    e.preventDefault();
    const p = toTable(e);
    const movedPx = Math.hypot(e.clientX - (drag.sx ?? e.clientX), e.clientY - (drag.sy ?? e.clientY));
    if (drag.kind === 'ball') {
      if (!drag.moved && movedPx < 5) return;
      drag.moved = true;
      const lifted = offsetDragPoint(e.clientX, e.clientY);
      const lp = toTableXY(lifted.x, lifted.y);
      let q = L.clampToTable(lp, rad());
      if (set.snap) q = L.snapPoint(q, L.QUARTER, rad());
      drag.to = q;
      const g = ctx.root.querySelector(`#simSvg g.ball[data-n="${drag.id}"]`);
      if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      let ring = ctx.root.querySelector('#dragRing');
      if (!ring) {
        ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('id', 'dragRing');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#f6c453');
        ring.setAttribute('stroke-width', '0.7');
        ring.setAttribute('pointer-events', 'none');
        ctx.root.querySelector('#simSvg')?.appendChild(ring);
      }
      ring.setAttribute('cx', f2(q.x));
      ring.setAttribute('cy', f2(q.y));
      ring.setAttribute('r', f2(rad() + 1.35));
      const bub = ctx.root.querySelector('#dragBubble');
      if (bub) {
        const rect = ctx.root.querySelector('#simTable').getBoundingClientRect();
        bub.textContent = drag.id === 'cue' ? 'Cue' : String(drag.id);
        bub.style.left = `${Math.max(44, Math.min(rect.width - 44, e.clientX - rect.left))}px`;
        bub.style.top = `${Math.max(0, e.clientY - rect.top - 60)}px`;
        bub.classList.add('show');
      }
    } else if (drag.kind === 'aim') {
      if (!drag.moved && movedPx < 5) return;
      drag.moved = true;
      const cue = cueBall();
      if (!cue) return;
      if (!drag.pushed) { pushUndo('aim'); drag.pushed = true; }
      if (Math.hypot(p.x - cue.x, p.y - cue.y) < 0.5) return;
      st.shot.aim = f2(P.aimAt(cue, p));
      st.aimPocket = null;
      overlayOnly();
    } else if (drag.kind === 'anno') {
      drag.cur = p;
      const d = ctx.root.querySelector('#simDraft');
      if (d) d.innerHTML = annoSVG({ kind: st.tool, color: st.color, points: [drag.start, p] }, -1);
    }
  }
  function onUp(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    document.documentElement.classList.remove('sim-dragging');
    const bub = ctx.root.querySelector('#dragBubble');
    if (bub) bub.classList.remove('show');
    const p = toTable(e);
    if (d.kind === 'find') {
      const q = L.clampToTable(p, rad());
      st.findTarget = { x: f2(q.x), y: f2(q.y) };
      st.placing = null;
      refresh();
      runFind();
      return;
    }
    if (d.kind === 'text') { askText(d.start); return; }
    if (d.kind === 'anno') {
      if (Math.hypot(d.cur.x - d.start.x, d.cur.y - d.start.y) > 0.8) {
        pushUndo();
        st.annotations.push({ kind: st.tool, color: st.color, points: [{ x: f2(d.start.x), y: f2(d.start.y) }, { x: f2(d.cur.x), y: f2(d.cur.y) }] });
      }
      refresh(['table', 'panel']);
      return;
    }
    if (d.kind === 'ball') {
      if (!d.moved) {
        st.sel = d.id;
        if (d.id !== 'cue' && st.scan?.phase !== 'confirm') aimAtBall(d.id);
        refresh();
        return;
      }
      if (st.scan?.phase !== 'confirm') pushUndo();
      const list = activeBalls();
      const b = list.find((q) => q.id === d.id);
      if (!b) { refresh(); return; }
      const others = list.filter((q) => q.id !== d.id);
      const q = L.freeSpot(others, d.to || d.from, rad());
      b.x = f2(q.x);
      b.y = f2(q.y);
      st.sel = d.id;
      if (st.aimBall != null && st.aimPocket && st.balls.some((x) => x.id === st.aimBall)) aimAtBall(st.aimBall, st.aimPocket, true);
      refresh();
      return;
    }
    if (d.kind === 'tapball') { aimAtBall(d.id); refresh(); return; }
    if (d.kind === 'aim') {
      if (!d.moved) {
        if (d.pocket && st.aimBall != null && st.balls.some((b) => b.id === st.aimBall)) { aimAtBall(st.aimBall, d.pocket); refresh(); return; }
        const cue = cueBall();
        st.sel = null;
        if (cue) { pushUndo('aim'); st.shot.aim = f2(P.aimAt(cue, p)); st.aimPocket = null; }
        refresh();
        return;
      }
      refresh(['panel', 'head']);
    }
  }
  function onCancel() {
    drag = null;
    document.documentElement.classList.remove('sim-dragging');
    refresh(['table']);
  }

  /** Aim at an object ball: thinnest makeable cut first, the next tap cycles pockets; throw-compensated */
  function aimAtBall(id, pocket = null, keep = false) {
    const cue = cueBall();
    if (!cue) return;
    let pk = pocket;
    if (!pk) {
      const cands = S.candidatePots(layout(), 80, id).map((c) => c.pocket);
      if (!cands.length) {
        const ob = st.balls.find((b) => b.id === id);
        pushUndo('aim');
        st.shot.aim = f2(P.aimAt(cue, ob));
        st.aimBall = id;
        st.aimPocket = null;
        if (!keep) toast(`No clear pocket for the ${id} — aiming full ball`);
        return;
      }
      const i = st.aimBall === id && st.aimPocket ? cands.indexOf(st.aimPocket) : -1;
      pk = cands[(i + 1) % cands.length];
    }
    const a = S.aimToPocket(layout(), id, pk, { V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips });
    if (!a) return;
    pushUndo('aim');
    st.shot.aim = Math.round(a.aim * 1000) / 1000;
    st.aimBall = id;
    st.aimPocket = pk;
  }

  // ------------------------------------------------------------------ simulation + playback
  function shoot() {
    const cue = cueBall();
    if (!cue) { toast('Place the cue ball first'); return; }
    const errs = L.validateLayout(layout(), { r: rad() });
    if (errs.length) { toast(errs[0]); return; }
    st.res = P.simulate(layout(), { aim: st.shot.aim, V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips }, simOpt({ maxTime: 40 }));
    st.mode = 'play';
    st.playT = 0;
    st.playing = true;
    st.tool = null;
    st.placing = null;
    refresh();
    startLoop();
  }
  function startLoop() {
    cancelAnimationFrame(raf);
    lastFrame = performance.now();
    const tick = (now) => {
      if (destroyed || st.mode !== 'play' || !st.res) return;
      const dt = Math.max(0, Math.min(0.1, (now - lastFrame) / 1000));
      lastFrame = now;
      if (st.playing) {
        st.playT = Math.min(st.res.duration, st.playT + dt * st.rate);
        if (st.playT >= st.res.duration - 1e-6) {
          st.playT = st.res.duration;
          st.playing = false;
          applyFrame();
          onPlaybackDone();
          return;
        }
      }
      applyFrame();
      if (st.playing) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function applyFrame() {
    const r = st.res;
    if (!r) return;
    const end = st.playT >= r.duration - 1e-6;
    const k = end ? r.frames.length - 1 : frameIndex();
    const fr = r.frames[k];
    const svg = ctx.root.querySelector('#simSvg');
    if (!svg) return;
    r.ids.forEach((id, i) => {
      const g = svg.querySelector(`g.ball[data-n="${id}"]`);
      if (!g) return;
      const b0 = st.balls.find((b) => b.id === id);
      const p = fr.p[i];
      if (!p) { g.style.display = 'none'; return; }
      g.style.display = '';
      g.setAttribute('transform', `translate(${f2(p[0] - b0.x)} ${f2(p[1] - b0.y)})`);
    });
    const tr = svg.querySelector('#simTracks');
    if (tr) tr.innerHTML = tracksSVG(k);
  }
  function onPlaybackDone() {
    if (st.game) { const rd = st.game.rounds[st.game.index]; if (rd.stars == null) scoreRound(); }
    refresh(['panel', 'bar', 'head']);
  }
  function leavePlay() {
    cancelAnimationFrame(raf);
    st.mode = 'edit';
    st.res = null;
    st.playing = false;
  }
  function continueNext() {
    const r = st.res;
    if (!r) return;
    pushUndo();
    const next = r.final.filter((b) => b.on).map((b) => ({ id: b.id, x: f2(b.x), y: f2(b.y) }));
    let msg = 'Next shot — balls left where they stopped';
    if (r.scratch) {
      const spot = L.freeSpot(next, { x: 25, y: 25 }, rad());
      next.push({ id: 'cue', x: f2(spot.x), y: f2(spot.y) });
      msg = 'Scratch — cue ball in hand on the head spot';
    }
    st.balls = next;
    st.sel = null;
    if (st.aimBall != null && !next.some((b) => b.id === st.aimBall)) { st.aimBall = null; st.aimPocket = null; }
    st.aimPocket = null;
    leavePlay();
    refresh();
    toast(msg);
  }

  // ------------------------------------------------------------------ Find a Shot
  let findSignal = null;
  async function runFind() {
    const t = st.findTarget;
    if (!t) return;
    const lay = layout();
    if (!lay.some((b) => b.id === 'cue') || lay.length < 2) { toast('Find a Shot needs the cue ball and at least one object ball'); return; }
    findSignal = { cancelled: false };
    const sig = findSignal;
    openSheet(`<div class="eyebrow">FIND A SHOT</div><h2 class="sheetTitle">Searching…</h2><p class="muted">Trying pockets, tip positions and speeds in the simulator (${set.findMode === 'fast' ? 'quick search' : 'thorough search'}).</p><div class="progress"><i id="findProg" style="width:0%"></i></div><button type="button" class="bigBtn alt" data-action="sim-find-cancel">CANCEL</button>`, { id: 'find', dismissable: false });
    let out;
    try {
      out = await S.findShot(lay, t, { mode: set.findMode, signal: sig, onProgress: (p) => { const el = document.getElementById('findProg'); if (el) el.style.width = `${Math.round(p * 100)}%`; } });
    } catch {
      return;
    }
    if (sig.cancelled || destroyed) return;
    st.findResults = out;
    showFindResults();
  }
  function recipeLine(r) {
    return `${r.ob} → ${POCKET_WORDS[r.pocket]} · ${contactText(r.shot.vTips, r.shot.hTips)} · ${speedLabel(r.shot.speed)} · ${f1(r.miss)}" from target`;
  }
  function showFindResults() {
    const out = st.findResults;
    if (!out?.best) {
      openSheet(`<div class="eyebrow">FIND A SHOT</div><h2 class="sheetTitle">No clean shot found</h2><p class="muted">None of the ${out?.tried || 0} simulated shots pocketed a ball without scratching. Move the target or the balls and try again.</p><button type="button" class="bigBtn" data-action="sheet-close">OK</button>`, { id: 'find' });
      return;
    }
    openSheet(`<div class="eyebrow">FIND A SHOT · ${out.tried} SHOTS SIMULATED</div><h2 class="sheetTitle">Best: ${f1(out.best.miss)}" from the target</h2>
      <div class="findList">${out.alternatives.map((r, i) => `<button type="button" class="findItem${i === 0 ? ' best' : ''}" data-action="sim-find-apply" data-i="${i}"><b>${i === 0 ? 'BEST' : `OPTION ${i + 1}`}</b><span>${esc(recipeLine(r))}</span></button>`).join('')}</div>
      <p class="muted small">Tap an option to load its aim, tip and speed, then SHOOT to watch it. These come from the simulation, so treat them as a starting point at the real table.</p>
      <button type="button" class="bigBtn" data-action="sim-find-apply" data-i="0" data-shoot="1">LOAD BEST &amp; SHOOT</button>`, { id: 'find' });
  }
  function applyFound(r) {
    pushUndo('find');
    Object.assign(st.shot, { aim: Math.round(r.shot.aim * 1000) / 1000, speed: r.shot.speed, vTips: r.shot.vTips, hTips: r.shot.hTips });
    if (set.useCal) { set.useCal = false; LIB.saveSim(store); toast('Calibration switched off so the replay matches the search'); }
    st.aimBall = r.ob;
    st.aimPocket = r.pocket;
  }

  // ------------------------------------------------------------------ Target Game
  function startGame() {
    const seed0 = Date.now() % 1e9;
    const rounds = [];
    for (let i = 0; rounds.length < 5 && i < 40; i++) {
      const r = S.targetRound(seed0 + i * 7919);
      if (r) rounds.push({ ...r, stars: null, pocketed: false });
    }
    if (!rounds.length) { toast('Could not generate a round — try again'); return; }
    if (!st.game) st.gameBackup = clone(snap());
    st.game = { rounds, index: 0, deadline: 0 };
    loadRound();
  }
  function loadRound() {
    const g = st.game;
    const rd = g.rounds[g.index];
    leavePlay();
    st.balls = clone(rd.balls);
    const ob = rd.balls.find((b) => b.id !== 'cue');
    st.shot = { aim: f2(P.aimAt(rd.balls[0], ob)), speed: 2, vTips: 0, hTips: 0 };
    st.sel = null;
    st.aimBall = null;
    st.aimPocket = null;
    st.shape = false;
    st.tool = null;
    st.placing = null;
    st.annotations = [];
    st.findTarget = null;
    g.deadline = Date.now() + 60000;
    clearInterval(timer);
    timer = setInterval(tickTimer, 250);
    render();
  }
  function timerText() {
    const g = st.game;
    if (!g) return '';
    const rd = g.rounds[g.index];
    if (rd.stars != null) return 'round over';
    const left = Math.max(0, Math.ceil((g.deadline - Date.now()) / 1000));
    return `0:${String(left).padStart(2, '0')} left`;
  }
  function tickTimer() {
    const g = st.game;
    if (!g || destroyed) { clearInterval(timer); return; }
    const el = ctx.root.querySelector('#simTimer');
    if (el) el.textContent = timerText();
    const rd = g.rounds[g.index];
    if (rd.stars == null && st.mode === 'edit' && Date.now() >= g.deadline) {
      rd.stars = 0;
      rd.timeout = true;
      clearInterval(timer);
      openSheet(`<div class="eyebrow">TARGET GAME</div><h2 class="sheetTitle">Time's up!</h2><p class="muted">No stars this round.</p><button type="button" class="bigBtn" data-action="sim-game-next">${g.index >= g.rounds.length - 1 ? 'FINISH GAME' : 'NEXT ROUND ›'}</button>`, { id: 'gameover', dismissable: false });
    }
  }
  function scoreRound() {
    const g = st.game;
    const rd = g.rounds[g.index];
    const r = st.res;
    clearInterval(timer);
    const obId = rd.balls.find((b) => b.id !== 'cue').id;
    rd.pocketed = r.pocketed.some((p) => p.id === obId);
    const cue = r.final.find((b) => b.id === 'cue');
    rd.stars = rd.pocketed && !r.scratch && cue.on ? S.targetStars(cue, rd.target) : 0;
  }
  function nextRound() {
    const g = st.game;
    if (!g) return;
    closeSheet();
    if (g.index >= g.rounds.length - 1) { finishGame(); return; }
    g.index++;
    loadRound();
  }
  function finishGame() {
    const g = st.game;
    const total = g.rounds.reduce((a, r) => a + (r.stars || 0), 0);
    const isBest = total > (store.targetBest || 0);
    store.targetBest = Math.max(store.targetBest || 0, total);
    const back = st.gameBackup;
    st.game = null;
    clearInterval(timer);
    restore(back);
    render();
    openSheet(`<div class="eyebrow">TARGET GAME · FINAL</div><h2 class="sheetTitle" data-total="${total}">${total} / ${g.rounds.length * 3} stars</h2>${isBest ? '<p class="pb">★ NEW BEST</p>' : `<p class="muted">Best: ${store.targetBest}★</p>`}
      <div class="gameRounds">${g.rounds.map((r, i) => `<div><span>Round ${i + 1}</span>${stars(r.stars || 0)}<small>${r.timeout ? 'time up' : r.pocketed ? 'pocketed' : 'missed'}</small></div>`).join('')}</div>
      <button type="button" class="bigBtn" data-action="sim-game">PLAY AGAIN</button><button type="button" class="bigBtn alt" data-action="sheet-close">BACK TO SIMULATOR</button>`, { id: 'gamefinal' });
  }
  function quitGame() {
    if (!st.game) return;
    const back = st.gameBackup;
    st.game = null;
    clearInterval(timer);
    restore(back);
    render();
  }

  // ------------------------------------------------------------------ sheets
  function actionsSheet() {
    const btn = (a, label, extra = '') => `<button type="button" class="actBtn" data-action="${a}" ${extra}>${label}</button>`;
    openSheet(`<div class="eyebrow">ACTIONS</div><h2 class="sheetTitle">Shot Simulator</h2>
      <h3 class="actH">Table</h3><div class="actGrid">
        ${btn('sim-rack', '△ 8-ball rack', 'data-g="8"')}${btn('sim-rack', '◇ 9-ball rack', 'data-g="9"')}${btn('sim-rack', '△ 10-ball rack', 'data-g="10"')}
        ${btn('sim-random', '⁂ Random 8-ball', 'data-g="8"')}${btn('sim-random', '⁂ Random 9-ball', 'data-g="9"')}${btn('sim-random', '⁂ Random 10-ball', 'data-g="10"')}
        ${btn('sim-clear', '⌫ Clear table')}${btn('sim-reset', '⟲ Reset to start')}${btn('sim-flip', '⇆ Flip ends', 'data-axis="h"')}${btn('sim-flip', '⇅ Flip sides', 'data-axis="v"')}
      </div>
      <h3 class="actH">Shot</h3><div class="actGrid">
        ${btn('sim-find', '🎯 Find a Shot')}${btn('sim-shape', `◭ Shape zone ${st.shape ? 'off' : 'on'}`)}${btn('sim-game', '⏱ Target Game')}
      </div>
      <h3 class="actH">Save &amp; share</h3><div class="actGrid">
        ${btn('sim-save', '💾 Save shot')}${btn('sim-library', '📚 Shot library')}${btn('sim-share', '🔗 Share link')}
        ${btn('sim-export', '⤓ Export JSON')}${btn('sim-import', '⤒ Import JSON')}${btn('sim-png', '🖼 Export image')}
        ${btn('sim-todrill', '◎ Turn into drill')}
      </div>
      <button type="button" class="bigBtn alt" data-action="sim-settings">SETTINGS</button>`, { id: 'simactions' });
  }
  function settingsSheet() {
    const tog = (k, label) => `<button type="button" class="chip${set[k] ? ' active' : ''}" data-action="sim-set" data-k="${k}">${label}: ${set[k] ? 'on' : 'off'}</button>`;
    openSheet(`<div class="eyebrow">SIMULATOR SETTINGS</div><h2 class="sheetTitle">Settings</h2>
      <div class="setRow"><span>Lines</span><div class="chips">${tog('fullPath', 'Full path preview')}${tog('tangent', 'Tangent &amp; object-ball lines')}${tog('paths', 'Ball tracks')}</div></div>
      <p class="muted small">Full path preview runs the real physics at your aim, SPEED and tip: every rail contact is numbered and the end shows POCKET, STOP or MISS — exactly what SHOOT will do. (Hidden during the Target Game.)</p>
      <div class="setRow"><span>Grid</span><div class="chips">${['full', 'half', 'off'].map((g) => `<button type="button" class="chip${set.grid === g ? ' active' : ''}" data-action="sim-set" data-k="grid" data-v="${g}">${g === 'full' ? 'Diamonds' : g === 'half' ? 'Half diamonds' : 'Off'}</button>`).join('')}</div></div>
      <div class="setRow"><span>Placing</span><div class="chips">${tog('snap', 'Snap to ¼ diamond')}</div></div>
      <div class="setRow"><span>Shape zone max cut</span><div class="chips">${[30, 45, 60, 75].map((v) => `<button type="button" class="chip${set.maxCut === v ? ' active' : ''}" data-action="sim-set" data-k="maxCut" data-v="${v}">${v}°</button>`).join('')}</div></div>
      <div class="setRow"><span>Find a Shot</span><div class="chips">${['fast', 'precise'].map((v) => `<button type="button" class="chip${set.findMode === v ? ' active' : ''}" data-action="sim-set" data-k="findMode" data-v="${v}">${v === 'fast' ? 'Speed (quick search)' : 'Precision (thorough)'}</button>`).join('')}</div></div>
      <div class="setRow"><span>Playback</span><div class="chips">${RATES.map((v) => `<button type="button" class="chip${set.playback === v ? ' active' : ''}" data-action="sim-set" data-k="playback" data-v="${v}">${v}×</button>`).join('')}</div></div>
      <div class="setRow"><span>SPEED</span><div class="chips">${tog('useCal', 'Use my speed calibration')}</div></div>
      <p class="muted small">SPEED n = n table lengths of total cue-ball travel from where the cue ball starts (centre ball, clear table; calibrated from the first diamond, rail rebounds included) — the same scale as the rest of Pool IQ. With calibration on, the simulator plays YOUR stroke for that number.</p>
      <button type="button" class="bigBtn" data-action="sheet-close">DONE</button>`, { id: 'simsettings' });
  }
  function saveSheet() {
    const existing = st.currentId && store.shots.find((s) => s.id === st.currentId);
    openSheet(`<div class="eyebrow">SAVE SHOT</div><h2 class="sheetTitle">${existing ? 'Update or save a copy' : 'Save to your library'}</h2>
      <label class="fld"><span>Name</span><input id="simSaveName" type="text" maxlength="60" value="${esc(existing ? existing.name : st.name || '')}" placeholder="e.g. 3 to 4 shape"/></label>
      <label class="fld"><span>Collection</span><select id="simSaveCol">${store.collections.map((c) => `<option value="${esc(c.id)}"${(existing ? existing.collection : 'default') === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label class="fld"><span>Notes</span><textarea id="simSaveNotes" rows="3" maxlength="500" placeholder="What to remember about this shot">${esc(existing ? existing.notes : '')}</textarea></label>
      ${existing ? '<button type="button" class="bigBtn" data-action="sim-save-do" data-mode="update">UPDATE SAVED SHOT</button><button type="button" class="bigBtn alt" data-action="sim-save-do" data-mode="new">SAVE AS NEW</button>' : '<button type="button" class="bigBtn" data-action="sim-save-do" data-mode="new">SAVE</button>'}`, { id: 'simsave' });
  }
  const libView = { collection: 'all', favorites: false, query: '', sort: 'newest' };
  function libraryHTML() {
    const list = LIB.listShots(store, libView);
    const colName = (id) => store.collections.find((c) => c.id === id)?.name || 'My Shots';
    return list.length ? list.map((s) => `<div class="libItem" data-id="${esc(s.id)}">
        <button type="button" class="libFav${s.favorite ? ' on' : ''}" data-action="lib-fav" data-id="${esc(s.id)}" aria-label="Favorite">★</button>
        <button type="button" class="libOpen" data-action="lib-open" data-id="${esc(s.id)}"><b>${esc(s.name)}</b><small>${s.balls.length} balls · ${esc(colName(s.collection))} · ${new Date(s.updated).toLocaleDateString()}</small>${s.notes ? `<em>${esc(s.notes.slice(0, 80))}</em>` : ''}</button>
        <button type="button" class="libMore" data-action="lib-more" data-id="${esc(s.id)}" aria-label="More options">⋯</button></div>`).join('') : `<p class="muted">${store.shots.length ? 'No shots match.' : 'No saved shots yet — use Actions → Save shot.'}</p>`;
  }
  function librarySheet() {
    openSheet(`<div class="eyebrow">SHOT LIBRARY · ${store.shots.length} SAVED</div><h2 class="sheetTitle">Your shots</h2>
      <div class="chips libCols">${[{ id: 'all', name: 'All' }, ...store.collections].map((c) => `<button type="button" class="chip${libView.collection === c.id ? ' active' : ''}" data-action="lib-col" data-id="${esc(c.id)}">${esc(c.name)}</button>`).join('')}<button type="button" class="chip" data-action="lib-col-new">+ Collection</button></div>
      <div class="libTools"><input id="libQuery" type="search" placeholder="Search names &amp; notes" value="${esc(libView.query)}"/><select id="libSort" aria-label="Sort"><option value="newest"${libView.sort === 'newest' ? ' selected' : ''}>Newest</option><option value="oldest"${libView.sort === 'oldest' ? ' selected' : ''}>Oldest</option><option value="name"${libView.sort === 'name' ? ' selected' : ''}>Name</option><option value="balls"${libView.sort === 'balls' ? ' selected' : ''}>Most balls</option></select><button type="button" class="chip${libView.favorites ? ' active' : ''}" data-action="lib-fav-filter">★ Favorites</button></div>
      ${libView.collection !== 'all' && libView.collection !== 'default' ? `<div class="chips"><button type="button" class="chip" data-action="lib-col-rename">Rename collection</button><button type="button" class="chip" data-action="lib-col-delete">Delete collection</button></div>` : ''}
      <div class="libList" id="libList">${libraryHTML()}</div>`, { id: 'simlib' });
    const q = document.getElementById('libQuery');
    q?.addEventListener('input', () => { libView.query = q.value; const l = document.getElementById('libList'); if (l) l.innerHTML = libraryHTML(); });
    document.getElementById('libSort')?.addEventListener('change', (ev) => { libView.sort = ev.target.value; const l = document.getElementById('libList'); if (l) l.innerHTML = libraryHTML(); });
  }
  function shotMenu(id) {
    const s = store.shots.find((x) => x.id === id);
    if (!s) return;
    openSheet(`<div class="eyebrow">SAVED SHOT</div><h2 class="sheetTitle">${esc(s.name)}</h2>
      <label class="fld"><span>Name</span><input id="libName" type="text" maxlength="60" value="${esc(s.name)}"/></label>
      <label class="fld"><span>Notes</span><textarea id="libNotes" rows="3" maxlength="500">${esc(s.notes || '')}</textarea></label>
      <label class="fld"><span>Collection</span><select id="libMove">${store.collections.map((c) => `<option value="${esc(c.id)}"${s.collection === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <button type="button" class="bigBtn" data-action="lib-update" data-id="${esc(id)}">SAVE CHANGES</button>
      <div class="actGrid"><button type="button" class="actBtn" data-action="lib-open" data-id="${esc(id)}">Open</button><button type="button" class="actBtn" data-action="lib-dup" data-id="${esc(id)}">Duplicate</button><button type="button" class="actBtn" data-action="lib-export" data-id="${esc(id)}">Export JSON</button><button type="button" class="actBtn danger" data-action="lib-del" data-id="${esc(id)}">Delete</button></div>
      <button type="button" class="bigBtn alt" data-action="sim-library">BACK TO LIBRARY</button>`, { id: 'simshot' });
  }
  function confirmSheet(title, text, action, id, label = 'DELETE') {
    openSheet(`<h2 class="sheetTitle">${esc(title)}</h2><p class="muted">${esc(text)}</p><button type="button" class="bigBtn danger" data-action="${action}" data-id="${esc(id || '')}">${label}</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'confirm' });
  }
  function promptSheet(title, value, action, id = '') {
    openSheet(`<h2 class="sheetTitle">${esc(title)}</h2><label class="fld"><input id="promptVal" type="text" maxlength="40" value="${esc(value)}"/></label><button type="button" class="bigBtn" data-action="${action}" data-id="${esc(id)}">OK</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'prompt' });
  }
  function askText(p) {
    st.pendingText = p;
    openSheet(`<h2 class="sheetTitle">Add text</h2><label class="fld"><input id="annoText" type="text" maxlength="40" placeholder="Label for the table"/></label><button type="button" class="bigBtn" data-action="sim-text-do">ADD</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'annotext' });
  }
  function shareState() {
    return { balls: st.balls, shot: st.shot, annotations: st.annotations, name: st.name };
  }
  async function share() {
    const url = SH.shareLink(location.href, shareState());
    st.lastShareUrl = url;
    const data = { title: 'Pool IQ shot', text: `${st.name || 'A shot'} — open it in the Pool IQ Shot Simulator`, url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch { copied = false; }
    openSheet(`<div class="eyebrow">SHARE LINK</div><h2 class="sheetTitle">${copied ? 'Link copied' : 'Copy this link'}</h2><p class="muted">Opening it loads this exact layout, aim, tip, speed and drawings in the Shot Simulator on any device.</p><label class="fld"><input id="shareUrl" type="text" readonly value="${esc(url)}"/></label><button type="button" class="bigBtn" data-action="sim-share-copy">COPY LINK</button><button type="button" class="bigBtn alt" data-action="sheet-close">DONE</button>`, { id: 'share' });
  }
  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportShots(shots, name) {
    download(name, new Blob([SH.exportFile(shots)], { type: 'application/json' }));
    toast('Exported JSON file');
  }
  function importJSON() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.id = 'simImportInput';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', async () => {
      const file = inp.files?.[0];
      inp.remove();
      if (!file) return;
      try {
        const shots = SH.importFile(await file.text());
        if (!shots.length) throw new Error('No shots in that file.');
        for (const s of shots) LIB.saveShot(store, { name: s.name || 'Imported shot', notes: s.notes || '', balls: s.balls, shot: s.shot, annotations: s.annotations || [] });
        LIB.saveSim(store);
        pushUndo();
        loadShotState(shots[0]);
        render();
        toast(`Imported ${shots.length} shot${shots.length > 1 ? 's' : ''} into your library`);
      } catch (err) {
        toast(err.message || 'Import failed');
      }
    });
    inp.click();
  }
  function loadShotState(s) {
    st.balls = (s.balls || []).filter((b) => b.id === 'cue' || (b.id >= 1 && b.id <= 15)).map((b) => ({ id: b.id, ...L.clampToTable(b) }));
    st.shot = { aim: 0, speed: 2, vTips: 0, hTips: 0, ...(s.shot || {}) };
    st.annotations = clone(s.annotations || []);
    st.name = s.name || '';
    st.sel = null;
    st.aimBall = null;
    st.aimPocket = null;
    leavePlay();
    startSnap = clone(snap());
  }
  async function exportPNG() {
    const svg = ctx.root.querySelector('#simSvg');
    if (!svg) return;
    const W = 1600;
    const vb = svg.viewBox.baseVal;
    const H = Math.round((W * vb.height) / vb.width);
    const c2 = svg.cloneNode(true);
    c2.setAttribute('width', W);
    c2.setAttribute('height', H);
    c2.querySelectorAll('animate').forEach((a) => a.remove());
    const xml = new XMLSerializer().serializeToString(c2);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`; });
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H + 70;
    const g = c.getContext('2d');
    g.fillStyle = '#050b12';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, W, H);
    g.fillStyle = '#8199aa';
    g.font = '28px system-ui, sans-serif';
    g.fillText(`Pool IQ · Shot Simulator${st.name ? ` · ${st.name}` : ''} · aim ${f1(st.shot.aim)}° · ${contactText(st.shot.vTips, st.shot.hTips)} · ${speedLabel(st.shot.speed)}`, 24, H + 45);
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    if (!blob) { toast('Image export is not supported here'); return; }
    const file = typeof File === 'function' ? new File([blob], 'pool-iq-shot.png', { type: 'image/png' }) : null;
    if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Pool IQ shot' }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    download('pool-iq-shot.png', blob);
    toast('Saved table image');
  }
  function toDrill() {
    const cue = cueBall();
    const obs = st.balls.filter((b) => b.id !== 'cue');
    if (!cue || !obs.length) { toast('Turn into drill needs the cue ball and at least one object ball'); return; }
    const pred = prediction();
    const r = st.res || P.simulate(layout(), { aim: st.shot.aim, V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips }, simOpt({ record: false }));
    let target = pred?.type === 'ball' ? pred.ball.id : st.aimBall ?? obs[0].id;
    let pocket = st.aimBall === target && st.aimPocket ? st.aimPocket : null;
    if (!pocket && !r.pocketed.some((p) => p.id === target)) {
      // the current shot doesn't make anything: start the drill from the easiest open pot on the table
      const easiest = S.candidatePots(layout(), 60)[0];
      if (easiest) { target = easiest.ob; pocket = easiest.pocket; }
    }
    const pot = r.pocketed.find((p) => p.id === target);
    if (!pocket && pot) pocket = pot.pocket;
    if (!pocket) pocket = S.candidatePots(layout(), 85, target)[0]?.pocket || 'TR';
    const cueEnd = r.final.find((b) => b.id === 'cue');
    const draft = {
      title: st.name || '',
      cue: { x: cue.x, y: cue.y },
      balls: obs.map((b) => ({ n: b.id, x: b.x, y: b.y })),
      blockers: [],
      targetBall: target,
      pockets: [pocket],
      zones: cueEnd && cueEnd.on && pot ? [{ x: f2(cueEnd.x), y: f2(cueEnd.y) }] : [],
      tip: { vTips: Math.max(-1.5, Math.min(1.5, Math.round(st.shot.vTips * 2) / 2)), hTips: Math.max(-1, Math.min(1, Math.round(st.shot.hTips * 2) / 2)) },
      speed: Math.max(0.25, Math.min(5, Math.round(st.shot.speed * 4) / 4)),
      fromSim: true
    };
    lsSet(DRAFT_KEY, JSON.stringify(draft));
    closeSheet();
    ctx.go('#drillnew/fromsim');
  }

  // ------------------------------------------------------------------ actions
  function relaim() {
    if (st.aimBall != null && st.aimPocket && st.balls.some((b) => b.id === st.aimBall)) aimAtBall(st.aimBall, st.aimPocket, true);
  }
  function newLayout(balls, shot, name, msg) {
    pushUndo();
    st.balls = balls;
    st.shot = { ...st.shot, ...shot };
    st.annotations = [];
    st.sel = null;
    st.aimBall = null;
    st.aimPocket = null;
    st.currentId = null;
    st.findTarget = null;
    st.name = name;
    leavePlay();
    startSnap = clone(snap());
    closeSheet();
    refresh();
    if (msg) toast(msg);
  }
  const TABLE_ACTIONS = {
    'sim-rack': (el) => { const g = Number(el.dataset.g); newLayout(L.rackLayout(g, Date.now(), rad()), { aim: 0, speed: 6, vTips: 0, hTips: 0 }, `${L.GAME_NAMES[g]} break`, `${L.GAME_NAMES[g]} racked — aimed at the head ball, SPEED 6`); },
    'sim-random': (el) => { const g = Number(el.dataset.g); newLayout(L.randomLayout(g, Date.now(), { r: rad() }), { speed: 2, vTips: 0, hTips: 0 }, `${L.GAME_NAMES[g]} run-out`, `Random ${L.GAME_NAMES[g]} layout — run out from here`); },
    'sim-clear': () => { newLayout([], {}, '', 'Table cleared — undo brings it back'); },
    'sim-reset': () => { pushUndo(); restore(startSnap); closeSheet(); refresh(); toast('Back to the starting layout'); },
    'sim-flip': (el) => {
      const ax = el.dataset.axis;
      pushUndo();
      st.balls = L.flipLayout(st.balls, ax);
      st.shot.aim = L.flipAim(st.shot.aim, ax);
      st.shot.hTips = -st.shot.hTips || 0;
      st.annotations = st.annotations.map((an) => ({ ...an, points: an.points.map((p) => ({ x: ax === 'h' ? f2(100 - p.x) : p.x, y: ax === 'v' ? f2(50 - p.y) : p.y })) }));
      if (st.findTarget) st.findTarget = { x: ax === 'h' ? f2(100 - st.findTarget.x) : st.findTarget.x, y: ax === 'v' ? f2(50 - st.findTarget.y) : st.findTarget.y };
      st.aimPocket = null;
      leavePlay();
      closeSheet();
      refresh();
    }
  };

  function scanCornerHTML() {
    return `<div class="scanBox" data-scan-box="corners"><p class="scanHint">Drag the 4 corners onto the edges of the table, then straighten. This does not find the balls.</p><div class="scanPhoto" id="scanPhoto"><img id="scanImg" alt="Table photo" src="${st.scan.url}"/></div><div class="simTools"><button type="button" data-action="sim-scan-straight">STRAIGHTEN</button><button type="button" data-action="sim-scan-asis">USE PHOTO</button><button type="button" data-action="sim-scan-cancel">CANCEL</button></div></div>`;
  }
  function scanConfirmHTML() {
    return `<p class="scanPlace" data-scan-label>${esc(SCAN_PLACE_LABEL)}</p><img class="scanRef" alt="Reference photo" src="${st.scan.url}"/><div class="simTools scanEdit"><button type="button" data-action="sim-scan-add">ADD BALL</button><button type="button" data-action="sim-scan-del">DELETE</button><button type="button" data-action="sim-scan-num" data-d="-1">− NO.</button><button type="button" data-action="sim-scan-num" data-d="1">+ NO.</button><button type="button" data-action="sim-scan-stripe">SOLID / STRIPE</button><button type="button" data-action="sim-scan-cue">CUE BALL</button></div><button type="button" class="bigBtn" data-action="sim-scan-confirm">CONFIRM LAYOUT</button><button type="button" class="bigBtn alt" data-action="sim-scan-cancel">CANCEL</button>`;
  }
  function runoutAimInfo(step) {
    if (!step || step.breakout) return null;
    const cue = step.balls.find((b) => b.id === 'cue');
    const ob = step.balls.find((b) => String(b.id) === String(step.ball));
    const ghost = step.ghost;
    if (!cue || !ob || !ghost) return null;
    const a = aimFromPoints(cue, ghost, ob, rad());
    const frac = fullnessWord(a.fullness);
    const sideWord = a.side === 'right' ? 'Right' : a.side === 'left' ? 'Left' : '';
    const label = frac === 'Full' ? 'Full' : `${sideWord} ${frac}`;
    return { ...a, ob: { n: ob.id, x: ob.x, y: ob.y }, ghost, from: cue, frac, label, deg: Math.round(a.theta), plain: `${label} hit`, ballR: rad() };
  }
  function runoutHTML() {
    const plan = st.runout;
    if (!plan.steps.length) return `<p class="runNote" data-runout-note>${esc(plan.note)}</p><button type="button" class="bigBtn alt" data-action="sim-run-close">CLOSE</button>`;
    const step = plan.steps[plan.i];
    const options = plan.options || [];
    const chips = options.length > 1
      ? `<div class="chips runPick" role="group" aria-label="Runout difficulty">${options.map((p, i) => `<button type="button" class="chip${i === plan.pick ? ' active' : ''}" data-action="sim-run-pick" data-i="${i}">${esc(p.label || `Option ${i + 1}`)}</button>`).join('')}</div>`
      : '';
    const info = runoutAimInfo(step);
    const cutBox = `<div class="runAimCard"><div class="runAimView">${aimViewSVG(info, { size: 'gauge' })}</div><p class="runCut">${info ? esc(info.label) + (info.frac === 'Full' ? '' : ` · ${info.deg}° cut`) : 'Ghost / cut'}</p></div>`;
    const tipBox = `<div class="runAimCard"><div class="runTipView">${cueBallSVG({ vTips: step.vTips, hTips: step.hTips }, { size: 'sm', id: 'runTipBall' })}</div><p class="runCut">${esc(contactText(step.vTips, step.hTips))}</p></div>`;
    const diagram = `<div class="runAim">${cutBox}${tipBox}</div>`;
    return `${chips}<p class="runNote" data-runout-note>${esc(plan.note)}</p>${diagram}<p class="runStep" data-run-step="${plan.i + 1}" data-run-count="${plan.steps.length}">${esc(step.text)}</p><div class="simTools"><button type="button" data-action="sim-run-prev" ${plan.i ? '' : 'disabled'}>PREVIOUS SHOT</button><button type="button" data-action="sim-run-next" ${plan.i < plan.steps.length - 1 ? '' : 'disabled'}>NEXT SHOT</button><button type="button" class="bigBtn alt" data-action="sim-run-close">CLOSE</button></div>`;
  }
  function mountCorners() {
    const img = ctx.root.querySelector('#scanImg');
    const box = ctx.root.querySelector('#scanPhoto');
    if (!img || !box || !st.scan) return;
    const draw = () => {
      box.querySelectorAll('.scanHandle').forEach((n) => n.remove());
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const r = img.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const scale = Math.min(r.width / iw, r.height / ih) || 1;
      const dw = iw * scale;
      const dh = ih * scale;
      const ox = r.left - b.left + (r.width - dw) / 2;
      const oy = r.top - b.top + (r.height - dh) / 2;
      st.scan.corners.forEach((c, i) => {
        const h = document.createElement('button');
        h.type = 'button';
        h.className = 'scanHandle';
        h.dataset.corner = String(i);
        h.style.left = `${ox + (c.x / iw) * dw}px`;
        h.style.top = `${oy + (c.y / ih) * dh}px`;
        h.setAttribute('aria-label', `Corner ${i + 1}`);
        box.appendChild(h);
      });
      box.dataset.iw = String(iw);
      box.dataset.ih = String(ih);
      box.dataset.ox = String(ox);
      box.dataset.oy = String(oy);
      box.dataset.dw = String(dw);
      box.dataset.dh = String(dh);
    };
    if (img.complete && img.naturalWidth) draw();
    else img.addEventListener('load', draw, { once: true });
    if (box.dataset.cornersBound) return;
    box.dataset.cornersBound = '1';
    let hold = null;
    box.addEventListener('pointerdown', (e) => {
      const h = e.target.closest?.('.scanHandle');
      if (!h) return;
      e.preventDefault();
      e.stopPropagation();
      hold = h;
      try { box.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    box.addEventListener('pointermove', (e) => {
      if (!hold || !st.scan) return;
      e.preventDefault();
      const b = box.getBoundingClientRect();
      const iw = +box.dataset.iw || 1;
      const ih = +box.dataset.ih || 1;
      const x = ((e.clientX - b.left - (+box.dataset.ox || 0)) / (+box.dataset.dw || 1)) * iw;
      const y = ((e.clientY - b.top - (+box.dataset.oy || 0)) / (+box.dataset.dh || 1)) * ih;
      const i = +hold.dataset.corner;
      st.scan.corners[i] = { x: Math.max(0, Math.min(iw, x)), y: Math.max(0, Math.min(ih, y)) };
      hold.style.left = `${e.clientX - b.left}px`;
      hold.style.top = `${e.clientY - b.top}px`;
    });
    const up = () => { hold = null; };
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
  }
  function beginConfirm(url) {
    st.scan.phase = 'confirm';
    st.scan.url = url;
    st.scan.balls = [{ id: 'cue', x: 25, y: 25 }];
    st.sel = 'cue';
    refresh();
  }
  function applyRunStep() {
    const plan = st.runout;
    const step = plan?.steps?.[plan.i];
    if (!step) return;
    st.shot.aim = step.aim;
    st.shot.speed = step.speed;
    st.shot.vTips = step.vTips;
    st.shot.hTips = step.hTips;
  }
  function openRunout(game, group) {
    const options = planRunoutOptions(st.balls, { game, group, table: tableSpec() });
    const plan = options[0] || { steps: [], note: 'No balls left to run.', game, group };
    plan.i = 0;
    plan.options = options;
    plan.pick = 0;
    st.runout = plan;
    applyRunStep();
    closeSheet();
    refresh();
  }
  function askRunout() {
    const both = groupChoices(st.balls);
    openSheet(`<div class="eyebrow">RUNOUT</div><h2 class="sheetTitle">What game?</h2><div class="actGrid"><button type="button" class="actBtn" data-action="sim-run-game" data-g="8">8-BALL</button><button type="button" class="actBtn" data-action="sim-run-game" data-g="9">9-BALL</button><button type="button" class="actBtn" data-action="sim-run-game" data-g="10">10-BALL</button></div>`, { id: 'runout' });
    st._groups = both;
  }
  function randomSheet() {
    const type = st.randType || 'straight';
    const pocket = st.randPocket || 'ANY';
    openSheet(`<div class="eyebrow">RANDOM SHOT</div><h2 class="sheetTitle">What kind of shot?</h2><div class="chips">${SHOT_TYPES.map((tp) => `<button type="button" class="chip${type === tp.id ? ' active' : ''}" data-action="sim-rand-type" data-v="${tp.id}">${esc(tp.label)}</button>`).join('')}</div><p class="muted small">Pocket</p><div class="chips">${POCKET_CHOICES.map((pk) => `<button type="button" class="chip${pocket === pk ? ' active' : ''}" data-action="sim-rand-pocket" data-v="${pk}">${pk === 'ANY' ? 'Any pocket' : pk}</button>`).join('')}</div><button type="button" class="bigBtn" data-action="sim-rand-go">GENERATE</button>`, { id: 'random' });
  }

  function onAction(a, el, e) {
    if (!a.startsWith('sim-') && !a.startsWith('lib-')) return false;
    if (TABLE_ACTIONS[a]) { if (st.game) return true; TABLE_ACTIONS[a](el); return true; }
    const inPlay = st.mode === 'play';
    switch (a) {

      case 'sim-size': {
        const ft = Number(el.dataset.ft);
        if (![7, 8, 9].includes(ft) || ft === tableSpec().ft) return true;
        set.tableFt = ft;
        st.balls = st.balls.map((b) => ({ ...b, ...L.clampToTable(b, rad()) }));
        for (let i = 0; i < st.balls.length; i++) {
          if (st.balls.some((o, j) => j < i && Math.hypot(o.x - st.balls[i].x, o.y - st.balls[i].y) < rad() * 2)) {
            const spot = L.freeSpot(st.balls.filter((_, j) => j !== i), st.balls[i], rad());
            st.balls[i].x = f2(spot.x); st.balls[i].y = f2(spot.y);
          }
        }
        LIB.saveSim(store);
        refresh();
        return true;
      }
      case 'sim-full':
        st.full = !st.full;
        refresh();
        return true;
      case 'sim-scan': {
        const input = ctx.root.querySelector('#simScanFile');
        if (input) { input.value = ''; input.click(); }
        return true;
      }
      case 'sim-scan-cancel':
        if (st.scan?.url?.startsWith('blob:')) URL.revokeObjectURL(st.scan.url);
        st.scan = null;
        refresh();
        return true;
      case 'sim-scan-asis':
        beginConfirm(st.scan.url);
        return true;
      case 'sim-scan-straight': {
        const canvas = perspectiveWarp(st.scan.img, st.scan.corners, 640);
        if (!canvas) { toast('Drag the 4 corners onto the table first'); return true; }
        beginConfirm(canvas.toDataURL('image/jpeg', 0.86));
        return true;
      }
      case 'sim-scan-add': {
        const ids = new Set(st.scan.balls.map((b) => String(b.id)));
        let id = 'cue';
        if (ids.has('cue')) {
          id = 1;
          while (ids.has(String(id)) && id <= 15) id++;
          if (id > 15) { toast('All 15 balls are on the table'); return true; }
        }
        const spot = L.freeSpot(st.scan.balls, { x: 50, y: 25 }, rad());
        st.scan.balls.push({ id, x: f2(spot.x), y: f2(spot.y), stripe: Number(id) >= 9 });
        st.sel = id;
        refresh();
        return true;
      }
      case 'sim-scan-del': {
        const id = st.sel;
        if (id == null) return true;
        st.scan.balls = st.scan.balls.filter((b) => b.id !== id);
        st.sel = st.scan.balls[0]?.id ?? null;
        refresh();
        return true;
      }
      case 'sim-scan-num': {
        const b = st.scan.balls.find((q) => q.id === st.sel);
        if (!b || b.id === 'cue') return true;
        let n = Number(b.id) + Number(el.dataset.d);
        if (n < 1) n = 15;
        if (n > 15) n = 1;
        if (st.scan.balls.some((q) => q !== b && String(q.id) === String(n))) { toast('That number is already on the table'); return true; }
        b.id = n;
        if (b.stripe == null) b.stripe = n >= 9;
        st.sel = n;
        refresh();
        return true;
      }
      case 'sim-scan-stripe': {
        const b = st.scan.balls.find((q) => q.id === st.sel);
        if (!b || b.id === 'cue') return true;
        b.stripe = !(b.stripe != null ? b.stripe : Number(b.id) >= 9);
        refresh();
        return true;
      }
      case 'sim-scan-cue': {
        const b = st.scan.balls.find((q) => q.id === st.sel);
        if (!b) return true;
        if (st.scan.balls.some((q) => q !== b && q.id === 'cue')) {
          const old = st.scan.balls.find((q) => q.id === 'cue');
          old.id = b.id === 'cue' ? 1 : b.id;
        }
        b.id = 'cue';
        b.stripe = false;
        st.sel = 'cue';
        refresh();
        return true;
      }
      case 'sim-scan-confirm':
        pushUndo();
        st.balls = st.scan.balls.map((b) => ({ id: b.id, x: f2(b.x), y: f2(b.y), ...(b.stripe ? { stripe: true } : {}) }));
        st.scan = null;
        st.sel = null;
        refresh();
        toast('Layout set');
        return true;
      case 'sim-runout':
        if (!cueBall()) { toast('Place the cue ball first'); return true; }
        askRunout();
        return true;
      case 'sim-run-game': {
        const g = Number(el.dataset.g);
        if (g === 8 && st._groups?.solids && st._groups?.stripes) {
          openSheet(`<div class="eyebrow">8-BALL</div><h2 class="sheetTitle">Solids or stripes?</h2><div class="actGrid"><button type="button" class="actBtn" data-action="sim-run-group" data-g="solids">SOLIDS</button><button type="button" class="actBtn" data-action="sim-run-group" data-g="stripes">STRIPES</button></div>`, { id: 'runout' });
          return true;
        }
        openRunout(g, g === 8 ? (st._groups?.stripes && !st._groups?.solids ? 'stripes' : 'solids') : null);
        return true;
      }
      case 'sim-run-group':
        openRunout(8, el.dataset.g);
        return true;
      case 'sim-run-pick': {
        const i = Number(el.dataset.i);
        const opt = st.runout?.options?.[i];
        if (!opt) return true;
        st.runout = { ...opt, i: 0, options: st.runout.options, pick: i };
        applyRunStep();
        refresh();
        return true;
      }
      case 'sim-run-prev':
        if (st.runout && st.runout.i > 0) { st.runout.i--; applyRunStep(); refresh(); }
        return true;
      case 'sim-run-next':
        if (st.runout && st.runout.i < st.runout.steps.length - 1) { st.runout.i++; applyRunStep(); refresh(); }
        return true;
      case 'sim-run-close':
        st.runout = null;
        refresh();
        return true;
      case 'sim-rand':
        st.randType = st.randType || 'straight';
        st.randPocket = st.randPocket || 'ANY';
        randomSheet();
        return true;
      case 'sim-rand-type':
        st.randType = el.dataset.v;
        randomSheet();
        return true;
      case 'sim-rand-pocket':
        st.randPocket = el.dataset.v;
        randomSheet();
        return true;
      case 'sim-rand-go': {
        closeSheet();
        toast('Looking for a shot the simulator can make…');
        const tries = st.randType === 'kick4' ? 70 : st.randType === 'kick3' ? 50 : 40;
        const gen = generateShot({ type: st.randType, pocket: st.randPocket || 'ANY', seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0, table: tableSpec(), tries });
        if (!gen.ok) {
          openSheet(`<div class="eyebrow">RANDOM SHOT</div><h2 class="sheetTitle">No shot found</h2><p class="muted">None of the ${gen.tried} tries made that shot on this table. Nothing was placed.</p><button type="button" class="bigBtn" data-action="sim-rand-go">GENERATE AGAIN</button><button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`, { id: 'random' });
          return true;
        }
        pushUndo();
        st.balls = gen.balls.map((b) => ({ ...b }));
        const w0 = gen.ways[0];
        st.shot.aim = w0.aim;
        st.shot.speed = w0.speed;
        st.shot.vTips = w0.vTips;
        st.shot.hTips = w0.hTips;
        st.randWays = gen.ways;
        st.randPocketMade = gen.pocket;
        st.sel = null;
        refresh();
        openSheet(`<div class="eyebrow">RANDOM SHOT · ${esc(gen.pocket)}</div><h2 class="sheetTitle">${gen.ways.length} way${gen.ways.length === 1 ? '' : 's'}</h2><p class="muted small">Same layout. Each line is a tip and speed the simulator makes.</p><div class="findList">${gen.ways.map((w, i) => `<button type="button" class="findItem${i === 0 ? ' best' : ''}" data-action="sim-rand-apply" data-i="${i}"><b>${esc(wayLabel(w))}</b></button>`).join('')}</div>`, { id: 'random' });
        return true;
      }
      case 'sim-rand-apply': {
        const w = st.randWays?.[Number(el.dataset.i)];
        if (!w) return true;
        st.shot.aim = w.aim;
        st.shot.speed = w.speed;
        st.shot.vTips = w.vTips;
        st.shot.hTips = w.hTips;
        closeSheet();
        refresh();
        return true;
      }
      case 'sim-exit':
        if (st.game) { quitGame(); return true; }
        ctx.go('#home');
        return true;
      case 'sim-undo':
        if (past.length) { future.push(clone(snap())); restore(past.pop()); lastPushKind = null; refresh(); }
        return true;
      case 'sim-redo':
        if (future.length) { past.push(clone(snap())); restore(future.pop()); lastPushKind = null; refresh(); }
        return true;
      case 'sim-actions':
        if (st.game) { confirmSheet('Quit the Target Game?', 'This game will not be scored.', 'sim-game-quit', '', 'QUIT GAME'); return true; }
        actionsSheet();
        return true;
      case 'sim-game-quit': closeSheet(); quitGame(); return true;
      case 'sim-settings': settingsSheet(); return true;
      case 'sim-set': {
        const k = el.dataset.k;
        if (el.dataset.v != null) set[k] = ['maxCut', 'playback'].includes(k) ? Number(el.dataset.v) : el.dataset.v;
        else set[k] = !set[k];
        if (k === 'paths') st.showTracks = set.paths;
        if (k === 'playback') st.rate = set.playback;
        LIB.saveSim(store);
        settingsSheet();
        refresh();
        return true;
      }
      case 'sim-shoot': shoot(); return true;
      case 'sim-edit': leavePlay(); refresh(); return true;
      case 'sim-continue': continueNext(); return true;
      case 'sim-replay': if (st.res) { st.playT = 0; st.playing = true; applyFrame(); refresh(['panel', 'bar']); startLoop(); } return true;
      case 'sim-pause':
        if (!st.res) return true;
        if (!st.playing && st.playT >= st.res.duration - 1e-6) st.playT = 0;
        st.playing = !st.playing;
        refresh(['bar', 'panel']);
        if (st.playing) startLoop();
        return true;
      case 'sim-step': {
        if (!st.res) return true;
        const next = st.res.events.find((ev) => ev.t > st.playT + 0.02);
        st.playing = false;
        cancelAnimationFrame(raf);
        st.playT = next ? Math.min(st.res.duration, next.t + 0.001) : st.res.duration;
        applyFrame();
        if (st.playT >= st.res.duration - 1e-6) onPlaybackDone();
        else refresh(['bar', 'panel']);
        return true;
      }
      case 'sim-end':
        if (!st.res) return true;
        st.playing = false;
        cancelAnimationFrame(raf);
        st.playT = st.res.duration;
        applyFrame();
        onPlaybackDone();
        return true;
      case 'sim-rate': st.rate = RATES[(RATES.indexOf(st.rate) + 1) % RATES.length]; refresh(['bar']); return true;
      case 'sim-tracks': st.showTracks = !st.showTracks; applyFrame(); refresh(['bar']); return true;
      case 'sim-nudge':
        if (inPlay) return true;
        pushUndo('aim');
        st.shot.aim = Math.round(normDeg(st.shot.aim + Number(el.dataset.v)) * 1000) / 1000;
        st.aimPocket = null;
        refresh(['table', 'panel']);
        return true;
      case 'sim-tip': {
        // v11.1: compact pop-up next to the small cue ball; drag the dot, the preview line follows live
        if (tipPickerOpen()) return true;
        pushUndo('tip');
        openTipPicker({
          anchor: el,
          vTips: st.shot.vTips,
          hTips: st.shot.hTips,
          maxV: P.MAX_TIPS_V,
          maxH: P.MAX_TIPS_H,
          onChange: (t) => {
            if (destroyed) return;
            st.shot.vTips = t.vTips;
            st.shot.hTips = t.hTips;
            relaim();
            refresh(['table', 'panel']);
          }
        });
        return true;
      }
      case 'sim-speed':
        pushUndo('speed');
        st.shot.speed = Math.max(0.25, Math.min(P.SPEED_MAX, Math.round((st.shot.speed + Number(el.dataset.v)) * 4) / 4));
        relaim();
        refresh(['table', 'panel']);
        return true;
      case 'sim-tray': {
        const id = el.dataset.id === 'cue' ? 'cue' : Number(el.dataset.id);
        if (st.balls.some((b) => b.id === id)) { st.sel = id; refresh(['table', 'panel']); return true; }
        pushUndo();
        const spot = L.freeSpot(st.balls, id === 'cue' ? { x: 25, y: 25 } : { x: 50 + ((id * 7) % 30) - 15, y: 25 + ((id * 5) % 16) - 8 }, rad());
        st.balls.push({ id, x: f2(spot.x), y: f2(spot.y) });
        st.sel = id;
        refresh();
        return true;
      }
      case 'sim-move': {
        const b = st.balls.find((q) => q.id === st.sel);
        if (!b) return true;
        pushUndo('move');
        const step = set.snap ? L.QUARTER : 0.25;
        let q = L.clampToTable({ x: b.x + Number(el.dataset.dx) * step, y: b.y + Number(el.dataset.dy) * step }, rad());
        if (set.snap) q = L.snapPoint(q, L.QUARTER, rad());
        if (st.balls.some((o) => o !== b && Math.hypot(o.x - q.x, o.y - q.y) < 2 * rad() - 0.001)) { toast('Blocked by another ball'); return true; }
        b.x = f2(q.x);
        b.y = f2(q.y);
        relaim();
        refresh();
        return true;
      }
      case 'sim-remove':
        if (st.sel == null) return true;
        pushUndo();
        st.balls = st.balls.filter((b) => b.id !== st.sel);
        if (st.aimBall === st.sel) { st.aimBall = null; st.aimPocket = null; }
        st.sel = null;
        refresh();
        return true;
      case 'sim-draw': st.tool = st.tool ? null : 'arrow'; st.sel = null; refresh(['table', 'panel']); return true;
      case 'sim-tool': st.tool = el.dataset.v; refresh(['panel']); return true;
      case 'sim-color': st.color = el.dataset.v; refresh(['panel']); return true;
      case 'sim-anno-clear': pushUndo(); st.annotations = []; refresh(['table', 'panel']); return true;
      case 'sim-text-do': {
        const v = (document.getElementById('annoText')?.value || '').trim();
        closeSheet();
        if (v && st.pendingText) { pushUndo(); st.annotations.push({ kind: 'text', color: st.color, text: v.slice(0, 40), points: [{ x: f2(st.pendingText.x), y: f2(st.pendingText.y) }] }); refresh(['table']); }
        return true;
      }
      case 'sim-shape':
        st.shape = !st.shape;
        if (st.shape && st.aimBall == null && (st.sel == null || st.sel === 'cue')) toast('Tap an object ball to see where the cue ball can pocket it');
        closeSheet();
        refresh(['table']);
        return true;
      case 'sim-find': closeSheet(); leavePlay(); st.tool = null; st.placing = 'find'; refresh(); toast('Tap where the cue ball should finish'); return true;
      case 'sim-find-run': runFind(); return true;
      case 'sim-find-clear': st.findTarget = null; refresh(); return true;
      case 'sim-find-cancel': if (findSignal) findSignal.cancelled = true; closeSheet(); return true;
      case 'sim-find-apply': {
        const r = st.findResults?.alternatives?.[Number(el.dataset.i)];
        if (!r) return true;
        applyFound(r);
        closeSheet();
        if (el.dataset.shoot) shoot();
        else refresh();
        return true;
      }
      case 'sim-game': closeSheet(); startGame(); return true;
      case 'sim-game-next': nextRound(); return true;
      case 'sim-save': saveSheet(); return true;
      case 'sim-save-do': {
        const name = (document.getElementById('simSaveName')?.value || '').trim() || 'Untitled shot';
        const collection = document.getElementById('simSaveCol')?.value || 'default';
        const notes = document.getElementById('simSaveNotes')?.value || '';
        if (el.dataset.mode === 'update' && st.currentId) LIB.updateShot(store, st.currentId, { name, collection, notes, balls: st.balls, shot: st.shot, annotations: st.annotations });
        else st.currentId = LIB.saveShot(store, { name, collection, notes, balls: st.balls, shot: st.shot, annotations: st.annotations }).id;
        st.name = name;
        LIB.saveSim(store);
        closeSheet();
        persist();
        toast(`Saved “${name}”`);
        return true;
      }
      case 'sim-library': librarySheet(); return true;
      case 'lib-col': libView.collection = el.dataset.id; librarySheet(); return true;
      case 'lib-fav-filter': libView.favorites = !libView.favorites; librarySheet(); return true;
      case 'lib-col-new': promptSheet('New collection', '', 'lib-col-new-do'); return true;
      case 'lib-col-new-do': { const v = (document.getElementById('promptVal')?.value || '').trim(); if (v) { const c = LIB.addCollection(store, v); LIB.saveSim(store); libView.collection = c.id; } librarySheet(); return true; }
      case 'lib-col-rename': promptSheet('Rename collection', store.collections.find((c) => c.id === libView.collection)?.name || '', 'lib-col-rename-do', libView.collection); return true;
      case 'lib-col-rename-do': LIB.renameCollection(store, el.dataset.id, document.getElementById('promptVal')?.value || ''); LIB.saveSim(store); librarySheet(); return true;
      case 'lib-col-delete': confirmSheet('Delete this collection?', 'Its shots move to My Shots — no shots are deleted.', 'lib-col-delete-do', libView.collection); return true;
      case 'lib-col-delete-do': LIB.deleteCollection(store, el.dataset.id); LIB.saveSim(store); libView.collection = 'all'; librarySheet(); return true;
      case 'lib-fav': { const s = store.shots.find((x) => x.id === el.dataset.id); if (s) { s.favorite = !s.favorite; LIB.saveSim(store); } librarySheet(); return true; }
      case 'lib-open': {
        const s = store.shots.find((x) => x.id === el.dataset.id);
        if (!s) return true;
        if (st.game) quitGame();
        pushUndo();
        loadShotState(s);
        st.currentId = s.id;
        closeSheet();
        refresh();
        toast(`Opened “${s.name}”`);
        return true;
      }
      case 'lib-more': shotMenu(el.dataset.id); return true;
      case 'lib-update':
        LIB.updateShot(store, el.dataset.id, { name: (document.getElementById('libName')?.value || '').trim() || 'Untitled shot', notes: document.getElementById('libNotes')?.value || '', collection: document.getElementById('libMove')?.value || 'default' });
        LIB.saveSim(store);
        toast('Saved');
        librarySheet();
        return true;
      case 'lib-dup': LIB.duplicateShot(store, el.dataset.id); LIB.saveSim(store); toast('Duplicated'); librarySheet(); return true;
      case 'lib-export': { const s = store.shots.find((x) => x.id === el.dataset.id); if (s) exportShots([s], `${s.name.replace(/[^\w-]+/g, '-').toLowerCase() || 'shot'}.json`); return true; }
      case 'lib-del': { const s = store.shots.find((x) => x.id === el.dataset.id); if (s) confirmSheet(`Delete “${s.name}”?`, 'This removes the saved shot from this device.', 'lib-del-do', s.id); return true; }
      case 'lib-del-do': LIB.deleteShot(store, el.dataset.id); if (st.currentId === el.dataset.id) st.currentId = null; LIB.saveSim(store); toast('Deleted'); librarySheet(); return true;
      case 'sim-share': closeSheet(); share(); return true;
      case 'sim-share-copy': { const i = document.getElementById('shareUrl'); if (i) { i.select(); if (navigator.clipboard) navigator.clipboard.writeText(i.value).then(() => toast('Link copied')).catch(() => toast('Select the link and copy it')); } return true; }
      case 'sim-export': closeSheet(); exportShots([{ name: st.name || 'Pool IQ shot', notes: '', ...shareState() }], 'pool-iq-shot.json'); return true;
      case 'sim-import': closeSheet(); importJSON(); return true;
      case 'sim-png': closeSheet(); exportPNG().catch(() => toast('Image export failed on this device')); return true;
      case 'sim-todrill': toDrill(); return true;
      case 'sim-setup':
        openSheet(`<div class="eyebrow">SETUP · DIAMOND POSITIONS</div><h2 class="sheetTitle">Ball positions</h2><p class="muted small">First number: diamonds from the head rail (left end, 0–8). Second: diamonds down from the top rail (0–4). Rounded to ¼.</p><div class="su-list">${st.balls.map((b) => `<div class="su-row"><b>${esc(ballWord(b.id))}</b><span class="su-num">${posText(b)}</span><small>${f1(b.x)}" from the head cushion, ${f1(b.y)}" from the top cushion</small></div>`).join('')}</div><button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`, { id: 'simsetup' });
        return true;
      default:
        return false;
    }
  }

  // shared link
  const hashArg = args.join('/');
  if (hashArg.startsWith('s=')) {
    try {
      const d = SH.decodeState(hashArg.slice(2));
      pushUndo();
      loadShotState(d);
      st.currentId = null;
      setTimeout(() => toast(`Shared shot loaded${d.name ? `: ${d.name}` : ''}`), 60);
    } catch (err) {
      setTimeout(() => toast(err.message), 60);
    }
    history.replaceState(null, '', '#sim');
  }

  function destroy() {
    destroyed = true;
    document.body.classList.remove('sim-full');
    document.documentElement.classList.remove('sim-dragging');
    closeTipPicker();
    clearTimeout(pvTimer);
    cancelAnimationFrame(raf);
    clearInterval(timer);
    if (findSignal) findSignal.cancelled = true;
    if (!st.game) persist();
  }
  return {
    render() {
      render();
      if (args[0] === 'target' && !st.game) { history.replaceState(null, '', '#sim'); startGame(); }
      if (args[0] === 'eight' && !st.game) {
        // from 8-Ball Ghost: #sim/eight/<group 1-7> or #sim/eight/pro
        history.replaceState(null, '', '#sim');
        const pro = args[1] === 'pro';
        const g = pro ? 7 : Math.max(1, Math.min(7, Number(args[1]) || 3));
        if (pro) newLayout(L.eightGhostLayout(7, Date.now(), true, rad()), { aim: 0, speed: 6, vTips: 0, hTips: 0 }, '8-Ball Ghost · Pro break', '15-ball rack — break, then ball in hand');
        else newLayout(L.eightGhostLayout(g, Date.now(), false, rad()), { speed: 2, vTips: 0, hTips: 0 }, `8-Ball Ghost · ${g} + 8`, `Ball in hand: run your ${g} in any order, then the 8`);
      }
    },
    onAction,
    destroy,
    // hooks for tests
    get state() { return st; },
    get undoDepth() { return past.length; },
    get redoDepth() { return future.length; }
  };
}
