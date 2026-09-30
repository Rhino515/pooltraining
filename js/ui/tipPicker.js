/**
 * Cue-ball tip picker pop-up (v11.1). A compact popover anchored next to the small cue-ball image:
 * a ~30%-of-screen-width cue ball whose contact dot you press and drag (touch, pen or mouse, via
 * Pointer Events), the live tip text ("Top Right"), the clock reading ("1:30 o'clock"), the exact tip
 * offsets, a CENTER button and a big DONE button. Tapping outside or pressing Escape closes it too.
 *
 * The dot follows the finger smoothly; the value is kept on a quarter-tip grid and never leaves the
 * miscue limit (the app's existing max tip offset: 1½ tips from centre, plus any per-axis limit the
 * caller passes, e.g. ±1 tip of side spin in the drill builder). onChange fires on every value change,
 * so callers can update their preview line live.
 */
import { TIP_UNIT } from '../games/cueBallDiagram.js';
import { tipLabel, tipClockLabel, esc } from '../games/recipe.js';

export const MISCUE_LIMIT_TIPS = 1.5;
const C = 50; // svg centre
const BALL_R = 44;
let current = null;

const fmt = (v) => String(Number(Math.abs(v).toFixed(2)));
/** "↑ 0.5 · → 0.25 tips" / "Offset 0 · 0 tips" */
export function tipOffsetText(v, h) {
  if (!v && !h) return 'Offset 0 · 0 tips';
  const vs = v ? `${v > 0 ? '↑' : '↓'} ${fmt(v)}` : '↕ 0';
  const hs = h ? `${h > 0 ? '→' : '←'} ${fmt(h)}` : '↔ 0';
  return `${vs} · ${hs} tips`;
}

/** Clamp a raw (vTips, hTips) pair into the limits; returns unsnapped values (for the smooth dot) */
export function clampTips(v, h, { maxV = 1.5, maxH = 1.5, limit = MISCUE_LIMIT_TIPS } = {}) {
  let vv = Math.max(-maxV, Math.min(maxV, v));
  let hh = Math.max(-maxH, Math.min(maxH, h));
  const d = Math.hypot(vv, hh);
  if (d > limit) { vv = (vv * limit) / d; hh = (hh * limit) / d; }
  return { vTips: vv, hTips: hh };
}
/** Snap to the step grid while staying inside the limits */
export function snapTips(v, h, opt = {}) {
  const step = opt.step || 0.25;
  const c = clampTips(v, h, opt);
  let sv = Math.round(c.vTips / step) * step;
  let sh = Math.round(c.hTips / step) * step;
  const limit = opt.limit ?? MISCUE_LIMIT_TIPS;
  // rounding can push a point just outside the circle: step back towards the centre
  while (Math.hypot(sv, sh) > limit + 1e-9) {
    if (Math.abs(sv) >= Math.abs(sh)) sv -= Math.sign(sv) * step; else sh -= Math.sign(sh) * step;
  }
  const r = (x) => Math.round(x * 1000) / 1000 || 0;
  return { vTips: r(sv), hTips: r(sh) };
}

const CUT_AMOUNT = { 'Full': 'Full', '¾': '3/4', '½': '1/2', '¼': '1/4', 'Thin': 'Thin' };
/** Amount only: "1/4", never "Left 1/4". */
function cutLine(cut) {
  if (!cut?.frac) return '';
  return CUT_AMOUNT[cut.frac] || String(cut.frac);
}
/**
 * Ghost is a faded shadow of the object ball, on the contact side, level with the cue ball.
 * For the default 1-ball cut the shadow sits on the right. Tip does not move it.
 * Offset 0 = full hit; one radius = a 1/2-ball cut.
 */
function ghostBehind(opt) {
  const cut = opt.cut;
  if (!cut || cut.fullness == null || Number.isNaN(Number(cut.fullness))) return '';
  const sin = Math.max(0, Math.min(1, 1 - Number(cut.fullness)));
  const sign = cut.side === 'left' ? 1 : cut.side === 'right' ? -1 : 0;
  const dx = sign * sin * 2 * BALL_R;
  const col = /^#[0-9a-fA-F]{6}$/.test(cut.color || '') ? cut.color : '#f5d76e';
  const n = Number.isInteger(cut.n) && cut.n >= 1 && cut.n <= 15 ? String(cut.n) : '';
  const num = n ? `<text x="${C}" y="${C + 7}" text-anchor="middle" font-size="20" font-weight="800" fill="#1a1408" fill-opacity="0.55" font-family="system-ui,sans-serif">${n}</text>` : '';
  return `<g class="tp-ghost" data-cut-ghost pointer-events="none" transform="translate(${dx.toFixed(2)} 0)"><circle cx="${C}" cy="${C}" r="${BALL_R}" fill="${col}" fill-opacity="0.5" stroke="${col}" stroke-opacity="0.85" stroke-width="1.2"/>${num}</g>`;
}
function ballSVG(opt) {
  const lim = (opt.limit ?? MISCUE_LIMIT_TIPS) * TIP_UNIT;
  let s = `<svg class="tipPopBall" viewBox="-6 -6 112 112" role="slider" tabindex="0" aria-label="Drag the contact point on the cue ball" data-tip-pad>`;
  s += ghostBehind(opt);
  s += `<defs><radialGradient id="tpShade" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e9f1f5"/><stop offset="1" stop-color="#b9c8d1"/></radialGradient></defs>`;
  s += `<circle cx="${C}" cy="${C}" r="${BALL_R}" fill="url(#tpShade)" stroke="#9fb4c1" stroke-width="1.2"/>`;
  for (const t of [0.5, 1]) s += `<circle cx="${C}" cy="${C}" r="${t * TIP_UNIT}" fill="none" stroke="#7d93a3" stroke-width="${t === 1 ? 0.9 : 0.6}" stroke-dasharray="${t === 1 ? '0' : '2 2'}"/>`;
  s += `<circle class="tp-limit" cx="${C}" cy="${C}" r="${lim}" fill="none" stroke="#ff5f7e" stroke-width="1" stroke-dasharray="3 2.2" opacity="0.85"/>`;
  if (opt.maxH < (opt.limit ?? MISCUE_LIMIT_TIPS)) {
    const x = opt.maxH * TIP_UNIT;
    s += `<line x1="${C - x}" y1="12" x2="${C - x}" y2="88" stroke="#ff5f7e" stroke-width="0.6" stroke-dasharray="1.5 2" opacity="0.6"/><line x1="${C + x}" y1="12" x2="${C + x}" y2="88" stroke="#ff5f7e" stroke-width="0.6" stroke-dasharray="1.5 2" opacity="0.6"/>`;
  }
  s += `<line x1="${C}" y1="8" x2="${C}" y2="92" stroke="#9fb4c1" stroke-width="0.5"/><line x1="8" y1="${C}" x2="92" y2="${C}" stroke="#9fb4c1" stroke-width="0.5"/>`;
  // dot: a transparent hit circle big enough for a thumb (≥ 44 px at the smallest ball size) + the visible dot
  s += `<g class="tp-dotG"><circle class="tp-hit" r="24" fill="transparent"/><circle class="tp-dot" r="7.5" fill="#19b8ff" stroke="#05111b" stroke-width="1.6"/><circle r="2" fill="#fff" opacity=".8" cx="-2" cy="-2"/></g>`;
  s += `</svg>`;
  return s;
}

export function tipPickerOpen() {
  return !!current;
}
export function closeTipPicker() {
  if (current) current.close();
}

/**
 * @param {{anchor?:Element, vTips:number, hTips:number, maxV?:number, maxH?:number, limit?:number, step?:number,
 *          title?:string, onChange?:(t:{vTips:number,hTips:number})=>void, onClose?:(t)=>void}} opt
 */
export function openTipPicker(opt) {
  closeTipPicker();
  const o = { maxV: 1.5, maxH: 1.5, limit: MISCUE_LIMIT_TIPS, step: 0.25, ...opt };
  let val = snapTips(Number(o.vTips) || 0, Number(o.hTips) || 0, o);
  // keep an existing value that is already on the caller's grid even if it sits outside the new circle
  if (Math.abs(val.vTips - (o.vTips || 0)) > 1e-9 || Math.abs(val.hTips - (o.hTips || 0)) > 1e-9) val = { vTips: Number(o.vTips) || 0, hTips: Number(o.hTips) || 0 };
  const back = document.createElement('div');
  back.className = 'tipPopBackdrop';
  back.setAttribute('data-tip-backdrop', '');
  const pop = document.createElement('div');
  pop.className = 'tipPop card';
  pop.id = 'tipPicker';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', o.title || 'Cue-ball tip');
  const size = Math.round(Math.max(108, Math.min(150, innerWidth * 0.3)));
  pop.style.setProperty('--tp-ball', `${size}px`);
  pop.innerHTML = `<div class="tpHead">${esc(o.title || 'CUE-BALL TIP')}<small>drag the dot</small></div>
    ${ballSVG(o)}
    <div class="tpText"><b class="tpLabel" data-tip-label></b><small class="tipClock tpClock" data-tip-clock></small><small class="tpCut" data-tip-cut>${esc(cutLine(o.cut))}</small><small class="tpOff" data-tip-offsets></small></div>
    <div class="tpBtns"><button type="button" class="tpCenter" data-tip-center>CENTER</button><button type="button" class="tpDone" data-tip-done>DONE</button></div>`;
  document.body.appendChild(back);
  document.body.appendChild(pop);
  const svg = pop.querySelector('svg');
  const dotG = pop.querySelector('.tp-dotG');
  const dot = pop.querySelector('.tp-dot');
  const color = (v, h) => (v < 0 ? '#ff5f7e' : v > 0 ? '#46e7a0' : h ? '#ffc75b' : '#19b8ff');
  function drawDot(v, h) {
    dotG.setAttribute('transform', `translate(${(C + h * TIP_UNIT).toFixed(2)} ${(C - v * TIP_UNIT).toFixed(2)})`);
  }
  function showValue() {
    pop.querySelector('[data-tip-label]').textContent = tipLabel(val.vTips, val.hTips);
    pop.querySelector('[data-tip-clock]').textContent = tipClockLabel(val.vTips, val.hTips, { oclock: true });
    pop.querySelector('[data-tip-offsets]').textContent = tipOffsetText(val.vTips, val.hTips);
    dot.setAttribute('fill', color(val.vTips, val.hTips));
    pop.dataset.vtips = String(val.vTips);
    pop.dataset.htips = String(val.hTips);
    svg.setAttribute('aria-valuetext', `${tipLabel(val.vTips, val.hTips)}, ${tipClockLabel(val.vTips, val.hTips, { oclock: true })}`);
  }
  function setValue(v, h, fromDrag) {
    const snapped = snapTips(v, h, o);
    const raw = clampTips(v, h, o);
    drawDot(fromDrag ? raw.vTips : snapped.vTips, fromDrag ? raw.hTips : snapped.hTips);
    if (snapped.vTips !== val.vTips || snapped.hTips !== val.hTips) {
      val = snapped;
      showValue();
      if (o.onChange) o.onChange({ ...val });
    }
  }
  function place() {
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    const a = o.anchor && o.anchor.isConnected ? o.anchor.getBoundingClientRect() : { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 2, bottom: innerHeight / 2, width: 0, height: 0 };
    let left = a.left + a.width / 2 - pw / 2;
    left = Math.max(8, Math.min(innerWidth - pw - 8, left));
    let top = a.top - ph - 8; // above the small ball (the table stays visible)
    if (top < 8) top = a.bottom + 8;
    if (top + ph > innerHeight - 8) top = Math.max(8, innerHeight - ph - 8);
    pop.style.left = `${Math.round(left)}px`;
    pop.style.top = `${Math.round(top)}px`;
  }
  // pointer drag (touch, pen and mouse)
  let dragging = null;
  const toTips = (e) => {
    const r = svg.getBoundingClientRect();
    const x = -6 + ((e.clientX - r.left) / r.width) * 112;
    const y = -6 + ((e.clientY - r.top) / r.height) * 112;
    return { v: (C - y) / TIP_UNIT, h: (x - C) / TIP_UNIT };
  };
  svg.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = e.pointerId;
    try { svg.setPointerCapture(e.pointerId); } catch {}
    pop.classList.add('dragging');
    const t = toTips(e);
    setValue(t.v, t.h, true);
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging !== e.pointerId) return;
    e.preventDefault();
    const t = toTips(e);
    setValue(t.v, t.h, true);
  });
  const end = (e) => {
    if (dragging !== e.pointerId) return;
    dragging = null;
    pop.classList.remove('dragging');
    drawDot(val.vTips, val.hTips);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', (e) => {
    const k = { ArrowUp: [1, 0], ArrowDown: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!k) return;
    e.preventDefault();
    setValue(val.vTips + k[0] * o.step, val.hTips + k[1] * o.step, false);
  });
  pop.addEventListener('click', (e) => e.stopPropagation());
  pop.querySelector('[data-tip-center]').addEventListener('click', (e) => { e.stopPropagation(); setValue(0, 0, false); });
  pop.querySelector('[data-tip-done]').addEventListener('click', (e) => { e.stopPropagation(); close(); });
  back.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); close(); });
  back.addEventListener('pointerdown', (e) => e.stopPropagation());
  back.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const onResize = () => place();
  document.addEventListener('keydown', onKey);
  addEventListener('resize', onResize);
  function close() {
    if (!current || current.pop !== pop) return;
    current = null;
    document.removeEventListener('keydown', onKey);
    removeEventListener('resize', onResize);
    back.remove();
    pop.remove();
    if (o.onClose) o.onClose({ ...val });
  }
  drawDot(val.vTips, val.hTips);
  showValue();
  place();
  current = { pop, close, get value() { return { ...val }; } };
  return current;
}
