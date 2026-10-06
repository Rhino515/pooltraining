/**
 * v14-123: tap-to-zoom for pool-table diagrams and drill images.
 *
 * Tap a diagram (drill card, drill / play screen, book drills, Drill Sets & Exams, Learn pages) and it opens
 * full screen on a dark backdrop: the same image file (object-fit: contain) or a clone of the SVG diagram,
 * scaled to fit. Pinch / drag / double-tap (wheel on desktop) to zoom and pan.
 * Close: X button, tap the backdrop while not zoomed, the phone / browser Back gesture, or Esc.
 *
 * The PKF course lessons keep their own lightbox (figure crop + VIEW FULL PKF PAGE); this module adds the
 * same Back / Esc / scroll-lock behaviour to it. Answer figures that are hidden until LOCK ANSWER are not in
 * the page, so nothing here can show them early.
 */

const TARGET = 'img.table-diagram, img.drill-diagram, img.bpHowto, img.smTip, svg.table-diagram';
// Only where a diagram is a picture to look at (not a thumbnail, a tile or an editor canvas).
const HOME = '.diagramWrap, .playTable, .kickTable, .smTipWrap, .playScreen';
// Never take a tap away from: buttons / links / tiles, tap-the-table screens, editors and the simulator.
const SKIP = 'button, a, label, [data-action], .tapRail, .builderTable, .simTable, .fixFit, .cMini, .playScreen[data-mode="pattern"], .dzOverlay, .pkfLite';

const MAX_SCALE = 6;
let layer = null;      // open generic overlay state
let pkfOpen = false;   // a PKF lightbox is on screen
let pushedHref = null; // URL at the moment we pushed our history entry
let scrollY = 0;
let locked = false;
let expectPop = 0;   // pops we caused ourselves (closing via X / backdrop / Esc)

export function zoomTargetOf(el) {
  if (!el || !el.closest) return null;
  const t = el.closest(TARGET);
  if (!t || t.closest(SKIP)) return null;
  if (!t.closest(HOME)) return null;
  if (t.tagName.toLowerCase() === 'svg' && !t.closest('.diagramWrap, .playTable, .kickTable')) return null;
  if (t.parentElement && t.parentElement.closest('svg')) return null; // nested svg inside a diagram
  const r = t.getBoundingClientRect();
  if (r.width < 24 || r.height < 24) return null; // not visible
  return t;
}

function lockScroll() {
  if (locked) return;
  locked = true;
  scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const b = document.body.style;
  b.position = 'fixed'; b.top = `-${scrollY}px`; b.left = '0'; b.right = '0'; b.width = '100%';
  document.documentElement.classList.add('dz-locked');
}
function unlockScroll() {
  if (!locked) return;
  locked = false;
  const b = document.body.style;
  b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = '';
  document.documentElement.classList.remove('dz-locked');
  window.scrollTo(0, scrollY);
}

function pushEntry() {
  try { history.pushState({ ...(history.state || {}), pqZoom: 1 }, ''); pushedHref = location.href; } catch { pushedHref = null; }
}
/** Our history entry is still on top: step back off it (same URL, so no hashchange / re-route). */
function popEntry() {
  const ours = pushedHref && location.href === pushedHref && history.state && history.state.pqZoom;
  pushedHref = null;
  if (ours) { expectPop++; history.back(); }
}

// ------------------------------------------------------------------ rotate with the phone
// manifest.json keeps the app itself in portrait (Android honours that; iOS ignores it and rotates freely).
// While a diagram is open we ask for real full screen on phones and lift the portrait lock ('any' = follow the
// phone), so turning sideways fills the landscape screen. iPhone has neither API: the page already rotates
// there and the overlay re-fits on resize / orientationchange. Every call is best-effort and silent.
const coarse = () => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } };
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
let weFullscreen = false, weLocked = false;
function enterFullscreen(el) {
  if (!coarse()) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) { freeOrientation(); return; }
  try {
    const p = req.call(el, { navigationUI: 'hide' });
    weFullscreen = true;
    if (p && p.then) p.then(freeOrientation, () => { weFullscreen = false; freeOrientation(); });
    else freeOrientation();
  } catch { weFullscreen = false; freeOrientation(); }
}
function freeOrientation() {
  try {
    const o = screen.orientation;
    if (o && typeof o.lock === 'function') { const p = o.lock('any'); weLocked = true; if (p && p.catch) p.catch(() => { weLocked = false; }); }
  } catch { weLocked = false; }
}
function restoreOrientation() {
  if (weLocked) { weLocked = false; try { screen.orientation.unlock(); } catch { /* ignore */ } }
  if (weFullscreen) {
    weFullscreen = false;
    if (fsEl()) { try { const ex = document.exitFullscreen || document.webkitExitFullscreen; const p = ex && ex.call(document); if (p && p.catch) p.catch(() => {}); } catch { /* ignore */ } }
  }
}

function aspectOf(t) {
  if (t.tagName.toLowerCase() === 'img') {
    if (t.naturalWidth && t.naturalHeight) return t.naturalWidth / t.naturalHeight;
  } else {
    const vb = t.viewBox && t.viewBox.baseVal;
    if (vb && vb.width && vb.height) return vb.width / vb.height;
  }
  const r = t.getBoundingClientRect();
  return r.width && r.height ? r.width / r.height : 2;
}

function buildContent(t) {
  if (t.tagName.toLowerCase() === 'img') {
    const img = document.createElement('img');
    img.className = 'dzImg';
    img.src = t.currentSrc || t.src; // the same file, untouched
    img.alt = t.alt || 'Diagram';
    img.draggable = false;
    return img;
  }
  const svg = t.cloneNode(true);
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('id');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('dzSvg');
  return svg;
}

export function openDiagramZoom(t) {
  if (!t || layer) return;
  const ov = document.createElement('div');
  ov.className = 'dzOverlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Diagram full screen');
  ov.innerHTML = `<div class="dzStage"><div class="dzContent"></div></div>
    <button type="button" class="dzClose" aria-label="Close full screen">\u2715</button>`;
  const stage = ov.querySelector('.dzStage');
  const content = ov.querySelector('.dzContent');
  if (t.matches('.is-mirror .drill-diagram')) content.classList.add('dzMirror');
  content.appendChild(buildContent(t));
  document.body.appendChild(ov);
  enterFullscreen(ov); // synchronous inside the tap, as the Fullscreen API requires
  lockScroll();
  pushEntry();
  layer = { ov, stage, content, aspect: aspectOf(t), s: 1, tx: 0, ty: 0, box: null, cleanup: [] };
  layout();
  const img = content.querySelector('img');
  if (img && !img.complete) img.addEventListener('load', () => { if (layer && layer.ov === ov) { layer.aspect = aspectOf(img); layout(); } }, { once: true });
  wireGestures(layer);
  ov.querySelector('.dzClose').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeDiagramZoom(); });
  requestAnimationFrame(() => ov.classList.add('is-in'));
  ov.querySelector('.dzClose').focus({ preventScroll: true });
}

export function closeDiagramZoom({ fromHistory = false } = {}) {
  if (!layer) return;
  const L = layer;
  layer = null;
  L.cleanup.forEach((f) => f());
  restoreOrientation();
  L.ov.remove();
  unlockScroll();
  if (fromHistory) pushedHref = null; else popEntry();
}

export function isDiagramZoomOpen() { return !!layer; }

/** Fit the content box (diagram aspect) inside the stage, centred. */
function layout() {
  const L = layer;
  if (!L) return;
  const W = L.stage.clientWidth, H = L.stage.clientHeight;
  let w = W, h = W / L.aspect;
  if (h > H) { h = H; w = H * L.aspect; }
  L.box = { W, H, w, h, left: (W - w) / 2, top: (H - h) / 2 };
  Object.assign(L.content.style, { width: `${w}px`, height: `${h}px`, left: `${L.box.left}px`, top: `${L.box.top}px` });
  setView(L.s, L.tx, L.ty);
}

function clampView(s, tx, ty) {
  const b = layer.box;
  s = Math.min(MAX_SCALE, Math.max(1, s));
  if (s <= 1.001) return { s: 1, tx: 0, ty: 0 };
  const cw = b.w * s, ch = b.h * s;
  tx = cw <= b.W ? (b.W - cw) / 2 - b.left : Math.min(-b.left, Math.max(b.W - cw - b.left, tx));
  ty = ch <= b.H ? (b.H - ch) / 2 - b.top : Math.min(-b.top, Math.max(b.H - ch - b.top, ty));
  return { s, tx, ty };
}
function setView(s, tx, ty, animate = false) {
  const L = layer;
  if (!L || !L.box) return;
  const v = clampView(s, tx, ty);
  L.s = v.s; L.tx = v.tx; L.ty = v.ty;
  L.content.style.transition = animate ? 'transform .22s ease' : '';
  L.content.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
  L.ov.classList.toggle('is-zoomed', v.s > 1);
}
/** Zoom to scale ns keeping stage point (px, py) still. */
function zoomAt(ns, px, py, animate) {
  const L = layer, b = L.box;
  const lx = (px - b.left - L.tx) / L.s, ly = (py - b.top - L.ty) / L.s;
  setView(ns, px - b.left - lx * ns, py - b.top - ly * ns, animate);
}

function wireGestures(L) {
  const { stage, content } = L;
  const pts = new Map();
  let pinch = null, pan = null, tap = null, lastTap = null, tapTimer = 0;
  const local = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onContent = (e) => { const r = content.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };

  const down = (e) => {
    if (layer !== L) return;
    e.preventDefault();
    try { stage.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    pts.set(e.pointerId, local(e));
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: L.s, lx: ((a.x + b.x) / 2 - L.box.left - L.tx) / L.s, ly: ((a.y + b.y) / 2 - L.box.top - L.ty) / L.s };
      pan = null; tap = null;
    } else if (pts.size === 1) {
      const p = pts.get(e.pointerId);
      pan = { x: p.x, y: p.y, tx: L.tx, ty: L.ty };
      tap = { x: p.x, y: p.y, t: performance.now(), inside: onContent(e) };
    }
  };
  const move = (e) => {
    if (layer !== L || !pts.has(e.pointerId)) return;
    pts.set(e.pointerId, local(e));
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const ns = Math.min(MAX_SCALE, Math.max(1, pinch.s * d / pinch.d));
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      setView(ns, mx - L.box.left - pinch.lx * ns, my - L.box.top - pinch.ly * ns);
    } else if (pan) {
      const p = pts.get(e.pointerId);
      if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > 10) tap = null;
      if (L.s > 1) setView(L.s, pan.tx + (p.x - pan.x), pan.ty + (p.y - pan.y));
    }
  };
  const up = (e) => {
    if (layer !== L || !pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 1) { const p = [...pts.values()][0]; pan = { x: p.x, y: p.y, tx: L.tx, ty: L.ty }; return; }
    if (pts.size) return;
    pan = null;
    const t = tap; tap = null;
    if (!t || e.type === 'pointercancel' || performance.now() - t.t > 350) return;
    const now = performance.now();
    if (lastTap && now - lastTap.t < 320 && Math.hypot(t.x - lastTap.x, t.y - lastTap.y) < 40) {
      clearTimeout(tapTimer); lastTap = null;
      if (L.s > 1.05) setView(1, 0, 0, true); else zoomAt(2.5, t.x, t.y, true);
      return;
    }
    lastTap = { x: t.x, y: t.y, t: now };
    if (!t.inside && L.s <= 1.001) {
      tapTimer = setTimeout(() => { if (layer === L && L.s <= 1.001) closeDiagramZoom(); }, 300);
    }
  };
  const wheel = (e) => {
    if (layer !== L) return;
    e.preventDefault();
    const p = local(e);
    zoomAt(L.s * Math.exp(-e.deltaY * 0.0022), p.x, p.y);
  };
  const dbl = (e) => e.preventDefault();
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', wheel, { passive: false });
  stage.addEventListener('dblclick', dbl);
  let fitTimers = [];
  const refit = () => { if (layer === L) { L.s = 1; L.tx = 0; L.ty = 0; layout(); } };
  const onResize = () => { refit(); fitTimers.forEach(clearTimeout); fitTimers = [150, 400].map((ms) => setTimeout(refit, ms)); };
  // Android Back while in full screen only leaves full screen: treat that as closing the diagram.
  const onFs = () => {
    if (layer === L && weFullscreen && !fsEl()) {
      weFullscreen = false;
      // If the same Back press also popped history, popstate has closed it already.
      setTimeout(() => { if (layer === L) closeDiagramZoom(); }, 120);
    } else onResize();
  };
  const vv = window.visualViewport;
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  if (vv) vv.addEventListener('resize', onResize);
  try { screen.orientation && screen.orientation.addEventListener('change', onResize); } catch { /* ignore */ }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
  L.cleanup.push(() => {
    clearTimeout(tapTimer);
    fitTimers.forEach(clearTimeout);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (vv) vv.removeEventListener('resize', onResize);
    try { screen.orientation && screen.orientation.removeEventListener('change', onResize); } catch { /* ignore */ }
    document.removeEventListener('fullscreenchange', onFs);
    document.removeEventListener('webkitfullscreenchange', onFs);
  });
}

// ------------------------------------------------------------------ PKF lesson lightboxes: Back / Esc / scroll lock
function pkfClose() {
  const btn = document.querySelector('.pkfLite [data-action$="lite-close"]');
  if (btn) btn.click();
}
function syncPkf() {
  const now = !!document.querySelector('.pkfLite');
  if (now === pkfOpen) return;
  pkfOpen = now;
  if (now) { lockScroll(); pushEntry(); if (coarse()) freeOrientation(); } else { restoreOrientation(); unlockScroll(); popEntry(); }
}

let wired = false;
export function initDiagramZoom() {
  if (wired || typeof document === 'undefined') return;
  wired = true;
  // Capture phase: runs before the app's delegated click handler, so a diagram tap never starts a drill.
  window.addEventListener('click', (e) => {
    if (layer) return;
    const t = zoomTargetOf(e.target);
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    openDiagramZoom(t);
  }, true);
  window.addEventListener('popstate', () => {
    if (expectPop > 0) { expectPop--; return; }
    if (layer) { closeDiagramZoom({ fromHistory: true }); return; }
    if (pkfOpen) { pushedHref = null; pkfClose(); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (layer) { e.preventDefault(); closeDiagramZoom(); } else if (pkfOpen) { e.preventDefault(); pkfClose(); }
  });
  // A route change while open (e.g. a link elsewhere): drop the overlay without stepping history back.
  window.addEventListener('hashchange', () => {
    pushedHref = null;
    if (layer) closeDiagramZoom({ fromHistory: true });
  });
  new MutationObserver(syncPkf).observe(document.body, { childList: true, subtree: true });
}
