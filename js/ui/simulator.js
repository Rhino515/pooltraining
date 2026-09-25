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
import { cueBallSVG, tipsFromTap } from '../games/cueBallDiagram.js';
import { toDiamonds, fmtDiamond } from '../games/diamonds.js';
import { contactText } from '../games/text.js';
import { speedMeaning, personalFactor } from '../games/speed.js';
import { esc } from '../games/recipe.js';
import { openSheet, closeSheet, toast, stars } from './sheet.js';

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
    game: null
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
    return P.speedToV0(s);
  }
  function prediction() {
    const cue = cueBall();
    if (!cue) return null;
    // the line shows where the cue ball actually travels: stick aim + squirt from side spin
    return P.predictContact(layout(), st.shot.aim + (Number(st.shot.hTips) || 0) * P.SQUIRT_DEG_PER_TIP);
  }
  function aimInfoFor(pred) {
    const cue = cueBall();
    if (!pred || pred.type !== 'ball' || !cue) return null;
    const a = aimFromPoints(cue, pred.ghost, pred.ball);
    const frac = fullnessWord(a.fullness);
    const sideWord = a.side === 'right' ? 'Right' : a.side === 'left' ? 'Left' : '';
    const label = frac === 'Full' ? 'Full' : `${sideWord} ${frac}`;
    return { ...a, ob: { n: pred.ball.id, x: pred.ball.x, y: pred.ball.y }, ghost: pred.ghost, from: cue, frac, label, deg: Math.round(a.theta), plain: `${label} hit`, ballR: R };
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
      s += `<circle class="aim-ghost" cx="${f2(g.x)}" cy="${f2(g.y)}" r="${R}" fill="#ffffff22" stroke="#f4fbff" stroke-width="0.2" stroke-dasharray="0.45 0.3"/>`;
      if (set.tangent) {
        const ob = pred.ball;
        const L1 = 14;
        s += `<line class="ob-line" x1="${f2(ob.x)}" y1="${f2(ob.y)}" x2="${f2(ob.x + pred.obDir.x * L1)}" y2="${f2(ob.y + pred.obDir.y * L1)}" stroke="#ffd34d" stroke-width="0.3" stroke-dasharray="0.9 0.6" opacity="0.9"/>`;
        if (pred.cut > 1) s += `<line class="tangent-line" x1="${f2(g.x)}" y1="${f2(g.y)}" x2="${f2(g.x + pred.tangent.x * 12)}" y2="${f2(g.y + pred.tangent.y * 12)}" stroke="#9ff0ff" stroke-width="0.24" stroke-dasharray="0.5 0.5" opacity="0.8"/>`;
      }
    } else if (pred?.type === 'rail') {
      const p = pred.point;
      s += `<line class="aim-line" x1="${f2(cue.x)}" y1="${f2(cue.y)}" x2="${f2(p.x)}" y2="${f2(p.y)}" stroke="#f4fbff" stroke-width="0.32" stroke-dasharray="1 0.6" opacity="0.9"/>`;
      const d = P.aimVector(st.shot.aim);
      const onX = Math.abs(p.x - R) < 0.01 || Math.abs(p.x - (100 - R)) < 0.01;
      const r = onX ? { x: -d.x, y: d.y } : { x: d.x, y: -d.y };
      s += `<line class="rail-preview" x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(p.x + r.x * 10)}" y2="${f2(p.y + r.y * 10)}" stroke="#f4fbff" stroke-width="0.24" stroke-dasharray="0.5 0.6" opacity="0.5"/>`;
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
    const balls = st.balls.map((b) => ({ id: b.id, x: b.x, y: b.y }));
    const under = `<g id="simZones">${zonesSVG()}</g><g id="simTracks">${st.mode === 'play' ? tracksSVG(frameIndex()) : ''}</g><g id="simUnder">${aimOverlay()}</g>`;
    let over = `<g id="simAnno">${st.annotations.map(annoSVG).join('')}</g><g id="simDraft"></g>`;
    if (st.sel != null && st.mode === 'edit') {
      const b = st.balls.find((q) => q.id === st.sel);
      if (b) over += `<circle class="sel-ring" cx="${f2(b.x)}" cy="${f2(b.y)}" r="${R + 0.55}" fill="none" stroke="#55e5ff" stroke-width="0.3" pointer-events="none"/>`;
    }
    return renderTableDiagram({ balls, grid: set.grid === 'off' ? false : set.grid === 'half' ? 'half' : true, headString: true, extraUnder: under, extraOver: over }, { className: 'table-diagram sim-svg', id: 'simSvg' });
  }

  // ------------------------------------------------------------------ panel pieces
  function aimRowHTML() {
    const pred = prediction();
    const info = aimInfoFor(pred);
    const what = pred?.type === 'ball'
      ? `${info.label} on the ${pred.ball.id} · ${Math.round(pred.cut)}° cut${st.aimPocket && st.aimBall === pred.ball.id ? ` → ${POCKET_WORDS[st.aimPocket]}` : ''}`
      : pred?.type === 'rail' ? 'Straight to the rail (no ball in line)' : 'Place the cue ball';
    return `<div class="simAim">
      <div class="simAimView">${info ? aimViewSVG(info) : aimViewSVG(null)}</div>
      <div class="simAimText"><span class="eyebrow">AIM</span><b data-aim="${f2(st.shot.aim)}">${f1(st.shot.aim)}°</b><small>${esc(what)}</small></div>
      <div class="nudges"><button type="button" class="nudge" data-action="sim-nudge" data-v="-1" aria-label="Aim −1°">−1°</button><button type="button" class="nudge" data-action="sim-nudge" data-v="-0.1" aria-label="Aim −0.1°">−.1</button><button type="button" class="nudge" data-action="sim-nudge" data-v="0.1" aria-label="Aim +0.1°">+.1</button><button type="button" class="nudge" data-action="sim-nudge" data-v="1" aria-label="Aim +1°">+1°</button></div>
    </div>`;
  }
  function tipSpeedHTML() {
    const s = st.shot;
    return `<div class="simTipSpeed">
      <button type="button" class="simTip" data-action="sim-tip" aria-label="Cue-ball tip position">${cueBallSVG({ vTips: s.vTips, hTips: s.hTips }, { size: 'sm', interactive: true, id: 'simTipBall' })}<small data-tip="${s.vTips},${s.hTips}">${esc(contactText(s.vTips, s.hTips))}</small></button>
      <div class="simSpeed">
        <div class="spRow"><button type="button" class="spBtn" data-action="sim-speed" data-v="-0.5" aria-label="Slower">−</button><b data-speed="${s.speed.toFixed(1)}">SPEED ${s.speed.toFixed(1)}</b><button type="button" class="spBtn" data-action="sim-speed" data-v="0.5" aria-label="Faster">+</button></div>
        <input type="range" class="spRange" id="simSpeedRange" min="0.3" max="${P.SPEED_MAX}" step="0.1" value="${s.speed}" aria-label="Speed"/>
        <small>${esc(speedMeaning(s.speed))}${set.useCal ? ' · your calibration' : ''}</small>
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
    if (!b) return `<div class="simSel hint">Drag balls to move them · drag the felt to aim · tap a ball to aim at it (tap again for the next pocket) · tap the tray to add a ball</div>`;
    return `<div class="simSel"><span class="selName"><b>${esc(ballWord(b.id))}</b><small>${posText(b)}</small></span>
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
    return `<div class="playHead simHead"><button type="button" class="phBack" data-action="sim-exit" aria-label="Exit">‹</button><div class="phTitle"><b>${esc(title)}</b><small>${sub}</small></div>
      <div class="simHeadBtns">${g ? '' : `<button type="button" class="hBtn" data-action="sim-undo" ${past.length ? '' : 'disabled'} aria-label="Undo">↶</button><button type="button" class="hBtn" data-action="sim-redo" ${future.length ? '' : 'disabled'} aria-label="Redo">↷</button>`}<button type="button" class="hBtn act" data-action="sim-actions" aria-label="Actions">${g ? 'Quit' : 'Actions'}</button></div></div>`;
  }
  function setupHTML() {
    const items = st.balls.slice().sort((a, b) => (a.id === 'cue' ? -1 : b.id === 'cue' ? 1 : a.id - b.id)).map((b) => `<span class="su-ball" data-ball="${b.id}"><i class="su-dot${b.id === 'cue' ? ' cue' : ''}" style="--c:${b.id === 'cue' ? '#f5f7fa' : BALL_COLORS[b.id]}">${b.id === 'cue' ? '' : b.id}</i>${posText(b)}</span>`).join('');
    return `<button type="button" class="setupLine" data-action="sim-setup" aria-label="Ball positions in diamonds"><span class="su-label"><b>SETUP</b><small>head · top</small></span><span class="su-items">${items || '<span class="muted">empty table</span>'}</span></button>`;
  }
  function panelHTML() {
    if (st.mode === 'play') return resultHTML();
    const findBar = st.findTarget && !st.game ? `<div class="findBar"><span>🎯 Cue-ball target set</span><button type="button" class="chip" data-action="sim-find-run">Find again</button><button type="button" class="chip" data-action="sim-find-clear">Clear target</button></div>` : '';
    const placing = st.placing === 'find' ? '<div class="placeBanner">Tap the table where the cue ball should finish</div>' : '';
    const gameInfo = st.game ? `<div class="gameInfo">Pocket the ${st.balls.find((b) => b.id !== 'cue')?.id} and stop the cue ball on the target. One shot per round.</div>` : '';
    return `${placing}${gameInfo}${findBar}${st.tool ? drawToolsHTML() : ''}${aimRowHTML()}${tipSpeedHTML()}${st.game ? '' : selHTML() + trayHTML()}`;
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
    return `<div class="simBar"><button type="button" class="toolBtn${st.tool ? ' on' : ''}" data-action="sim-draw" aria-label="Draw on the table">✎<small>Draw</small></button>${st.game ? '' : `<button type="button" class="toolBtn${st.shape ? ' on' : ''}" data-action="sim-shape" aria-label="Shape zone">◭<small>Zone</small></button>`}<button type="button" class="bigBtn shootBtn" data-action="sim-shoot" ${cueBall() ? '' : 'disabled'}>SHOOT ▶</button></div>`;
  }

  // ------------------------------------------------------------------ render
  function render() {
    if (destroyed) return;
    const root = ctx.root;
    root.innerHTML = `<div class="simScreen" data-mode="${st.mode}" data-game="${st.game ? 1 : 0}">
      <div id="simHeadWrap">${headHTML()}</div>
      <div class="simTable" id="simTable">${tableSVG()}<div class="dragBubble" id="dragBubble"></div></div>
      <div id="simSetup">${setupHTML()}</div>
      <div class="simPanel" id="simPanel">${panelHTML()}</div>
      <div id="simBarWrap">${barHTML()}</div>
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
    if (has('table')) root.querySelector('#simTable').innerHTML = `${tableSVG()}<div class="dragBubble" id="dragBubble"></div>`;
    if (has('table') || has('head')) root.querySelector('#simHeadWrap').innerHTML = headHTML();
    if (has('table') || has('setup')) root.querySelector('#simSetup').innerHTML = setupHTML();
    if (has('panel')) root.querySelector('#simPanel').innerHTML = panelHTML();
    if (has('bar') || has('table')) root.querySelector('#simBarWrap').innerHTML = barHTML();
    bindRange();
    persist();
  }
  function overlayOnly() {
    const u = ctx.root.querySelector('#simUnder');
    if (u) u.innerHTML = aimOverlay();
    const z = ctx.root.querySelector('#simZones');
    if (z) z.innerHTML = zonesSVG();
    const a = ctx.root.querySelector('.simAim');
    if (a) a.outerHTML = aimRowHTML();
  }

  // ------------------------------------------------------------------ pointer input on the table
  function toTable(e) {
    const svg = ctx.root.querySelector('#simSvg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  function ballAt(p, max = 3.2) {
    let best = null;
    let bd = max;
    for (const b of st.balls) {
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
    const t = ctx.root.querySelector('#simTable');
    t.addEventListener('pointerdown', onDown);
    t.addEventListener('pointermove', onMove);
    t.addEventListener('pointerup', onUp);
    t.addEventListener('pointercancel', onCancel);
    bindRange();
  }
  function bindRange() {
    const r = ctx.root.querySelector('#simSpeedRange');
    if (r && !r.dataset.bound) {
      r.dataset.bound = '1';
      r.addEventListener('input', () => {
        pushUndo('speed');
        st.shot.speed = Math.round(Number(r.value) * 10) / 10;
        const b = ctx.root.querySelector('.simSpeed b');
        if (b) { b.textContent = `SPEED ${st.shot.speed.toFixed(1)}`; b.dataset.speed = st.shot.speed.toFixed(1); }
        const sm = ctx.root.querySelector('.simSpeed small');
        if (sm) sm.textContent = speedMeaning(st.shot.speed) + (set.useCal ? ' · your calibration' : '');
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
    const b = ballAt(p);
    if (b && !st.game) {
      drag = { kind: 'ball', id: b.id, ox: b.x - p.x, oy: b.y - p.y, from: { x: b.x, y: b.y }, sx: e.clientX, sy: e.clientY, moved: false };
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
      let q = L.clampToTable({ x: p.x + drag.ox, y: p.y + drag.oy });
      if (set.snap) q = L.snapPoint(q);
      drag.to = q;
      const g = ctx.root.querySelector(`#simSvg g.ball[data-n="${drag.id}"]`);
      if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      const bub = ctx.root.querySelector('#dragBubble');
      if (bub) {
        const rect = ctx.root.querySelector('#simTable').getBoundingClientRect();
        bub.textContent = `${drag.id === 'cue' ? 'Cue' : drag.id} · ${posText(q)}`;
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
    const bub = ctx.root.querySelector('#dragBubble');
    if (bub) bub.classList.remove('show');
    const p = toTable(e);
    if (d.kind === 'find') {
      const q = L.clampToTable(p);
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
        if (d.id !== 'cue') aimAtBall(d.id);
        refresh();
        return;
      }
      pushUndo();
      const b = st.balls.find((q) => q.id === d.id);
      const others = st.balls.filter((q) => q.id !== d.id);
      const q = L.freeSpot(others, d.to || d.from);
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
    const errs = L.validateLayout(layout());
    if (errs.length) { toast(errs[0]); return; }
    st.res = P.simulate(layout(), { aim: st.shot.aim, V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips }, { maxTime: 40 });
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
      const spot = L.freeSpot(next, { x: 25, y: 25 });
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
    return `${r.ob} → ${POCKET_WORDS[r.pocket]} · ${contactText(r.shot.vTips, r.shot.hTips)} · SPEED ${r.shot.speed.toFixed(1)} · ${f1(r.miss)}" from target`;
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
      <div class="setRow"><span>Lines</span><div class="chips">${tog('tangent', 'Tangent &amp; object-ball lines')}${tog('paths', 'Ball tracks')}</div></div>
      <div class="setRow"><span>Grid</span><div class="chips">${['full', 'half', 'off'].map((g) => `<button type="button" class="chip${set.grid === g ? ' active' : ''}" data-action="sim-set" data-k="grid" data-v="${g}">${g === 'full' ? 'Diamonds' : g === 'half' ? 'Half diamonds' : 'Off'}</button>`).join('')}</div></div>
      <div class="setRow"><span>Placing</span><div class="chips">${tog('snap', 'Snap to ¼ diamond')}</div></div>
      <div class="setRow"><span>Shape zone max cut</span><div class="chips">${[30, 45, 60, 75].map((v) => `<button type="button" class="chip${set.maxCut === v ? ' active' : ''}" data-action="sim-set" data-k="maxCut" data-v="${v}">${v}°</button>`).join('')}</div></div>
      <div class="setRow"><span>Find a Shot</span><div class="chips">${['fast', 'precise'].map((v) => `<button type="button" class="chip${set.findMode === v ? ' active' : ''}" data-action="sim-set" data-k="findMode" data-v="${v}">${v === 'fast' ? 'Speed (quick search)' : 'Precision (thorough)'}</button>`).join('')}</div></div>
      <div class="setRow"><span>Playback</span><div class="chips">${RATES.map((v) => `<button type="button" class="chip${set.playback === v ? ' active' : ''}" data-action="sim-set" data-k="playback" data-v="${v}">${v}×</button>`).join('')}</div></div>
      <div class="setRow"><span>SPEED</span><div class="chips">${tog('useCal', 'Use my speed calibration')}</div></div>
      <p class="muted small">SPEED n ≈ n table lengths of cue-ball travel (centre ball, clear table) — the same scale as the rest of Pool IQ. With calibration on, the simulator plays YOUR stroke for that number.</p>
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
    g.fillText(`Pool IQ · Shot Simulator${st.name ? ` · ${st.name}` : ''} · aim ${f1(st.shot.aim)}° · ${contactText(st.shot.vTips, st.shot.hTips)} · SPEED ${st.shot.speed.toFixed(1)}`, 24, H + 45);
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
    const r = st.res || P.simulate(layout(), { aim: st.shot.aim, V: effectiveV(), vTips: st.shot.vTips, hTips: st.shot.hTips }, { record: false });
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
      speed: Math.max(0.5, Math.min(5, Math.round(st.shot.speed * 2) / 2)),
      fromSim: true
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
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
    'sim-rack': (el) => { const g = Number(el.dataset.g); newLayout(L.rackLayout(g, Date.now()), { aim: 0, speed: 6, vTips: 0, hTips: 0 }, `${L.GAME_NAMES[g]} break`, `${L.GAME_NAMES[g]} racked — aimed at the head ball, SPEED 6`); },
    'sim-random': (el) => { const g = Number(el.dataset.g); newLayout(L.randomLayout(g, Date.now()), { speed: 2, vTips: 0, hTips: 0 }, `${L.GAME_NAMES[g]} run-out`, `Random ${L.GAME_NAMES[g]} layout — run out from here`); },
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
  function onAction(a, el, e) {
    if (!a.startsWith('sim-') && !a.startsWith('lib-')) return false;
    if (TABLE_ACTIONS[a]) { if (st.game) return true; TABLE_ACTIONS[a](el); return true; }
    const inPlay = st.mode === 'play';
    switch (a) {
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
        const svg = ctx.root.querySelector('#simTipBall');
        if (svg && e) {
          pushUndo('tip');
          const t = tipsFromTap(svg, e.clientX, e.clientY);
          st.shot.vTips = t.vTips;
          st.shot.hTips = t.hTips;
          relaim();
          refresh(['table', 'panel']);
        }
        return true;
      }
      case 'sim-speed':
        pushUndo('speed');
        st.shot.speed = Math.max(0.3, Math.min(P.SPEED_MAX, Math.round((st.shot.speed + Number(el.dataset.v)) * 10) / 10));
        relaim();
        refresh(['table', 'panel']);
        return true;
      case 'sim-tray': {
        const id = el.dataset.id === 'cue' ? 'cue' : Number(el.dataset.id);
        if (st.balls.some((b) => b.id === id)) { st.sel = id; refresh(['table', 'panel']); return true; }
        pushUndo();
        const spot = L.freeSpot(st.balls, id === 'cue' ? { x: 25, y: 25 } : { x: 50 + ((id * 7) % 30) - 15, y: 25 + ((id * 5) % 16) - 8 });
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
        let q = L.clampToTable({ x: b.x + Number(el.dataset.dx) * step, y: b.y + Number(el.dataset.dy) * step });
        if (set.snap) q = L.snapPoint(q);
        if (st.balls.some((o) => o !== b && Math.hypot(o.x - q.x, o.y - q.y) < 2 * R - 0.001)) { toast('Blocked by another ball'); return true; }
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
        if (pro) newLayout(L.eightGhostLayout(7, Date.now(), true), { aim: 0, speed: 6, vTips: 0, hTips: 0 }, '8-Ball Ghost · Pro break', '15-ball rack — break, then ball in hand');
        else newLayout(L.eightGhostLayout(g, Date.now()), { speed: 2, vTips: 0, hTips: 0 }, `8-Ball Ghost · ${g} + 8`, `Ball in hand: run your ${g} in any order, then the 8`);
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
