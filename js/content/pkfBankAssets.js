/**
 * PKF Banking Systems — source image map.
 * Source pack: four original PKF JPEGs (PDF 267–270 = printed pages 241–244), copied byte-for-byte
 * into images/pkf-bank/. Crops only isolate a region of the original page with CSS; nothing is
 * redrawn, re-rendered or altered (ball positions, rail numbers, lines and labels stay as printed).
 *
 * Printed page 244 (PDF 270) switches to the Diamond one-rail KICKING system below y≈0.348 (its text starts at pixel row 380 of 1080).
 * That part is not banking material, so every 244 region (including the full-page view) stops above it.
 */

export const PKF_BANK_IMG_DIR = './images/pkf-bank';

/** Printed page → original file (and its pixel size). */
export const PAGES = {
  241: { src: './images/pkf-bank/PKF_Banking_PDF_267.jpg', pdf: 267, w: 630, h: 900, view: { x: 0, y: 0, w: 1, h: 1 } },
  242: { src: './images/pkf-bank/PKF_Banking_PDF_268.jpg', pdf: 268, w: 756, h: 1080, view: { x: 0, y: 0, w: 1, h: 1 } },
  243: { src: './images/pkf-bank/PKF_Banking_PDF_269.jpg', pdf: 269, w: 756, h: 1080, view: { x: 0, y: 0, w: 1, h: 1 } },
  // banking portion only — the rest of 244 is the Diamond one-rail kick system (not banking)
  244: { src: './images/pkf-bank/PKF_Banking_PDF_270.jpg', pdf: 270, w: 756, h: 1080, view: { x: 0, y: 0, w: 1, h: 0.348 } }
};

/**
 * Named regions of the original pages. t* = PKF text + figure (teaching / solution);
 * f* = figure only, no answer text (problem / physical setup).
 */
export const REGIONS = {
  // printed 241
  't241-151': { page: 241, crop: { x: 0.04, y: 0.035, w: 0.92, h: 0.30 }, figs: '8-151, 8-152', note: '40-20 path, third diamond 30: 40−30=10, 10/2=5' },
  't241-153': { page: 241, crop: { x: 0.04, y: 0.335, w: 0.92, h: 0.30 }, figs: '8-153, 8-154', note: '60-30 path, third diamond 40 → target 10' },
  't241-155': { page: 241, crop: { x: 0.04, y: 0.632, w: 0.92, h: 0.30 }, figs: '8-155, 8-156', note: '80-40 → 15; 100-50 → 25' },
  'f241-153': { page: 241, crop: { x: 0.06, y: 0.425, w: 0.445, h: 0.21 }, figs: '8-153', note: 'problem figure only (8-154 shows the answer label)' },
  'f241-155': { page: 241, crop: { x: 0.06, y: 0.753, w: 0.90, h: 0.175 }, figs: '8-155, 8-156', note: 'figures below the printed target labels (labels shown on REVEAL)' },
  // printed 242
  't242-157': { page: 242, crop: { x: 0.04, y: 0.03, w: 0.92, h: 0.39 }, figs: '8-157', note: 'third-diamond value 30/35/40/45/50 by path' },
  'f242-157': { page: 242, crop: { x: 0.06, y: 0.105, w: 0.53, h: 0.25 }, figs: '8-157', note: 'figure only (no third-diamond values printed on it)' },
  't242-158': { page: 242, crop: { x: 0.04, y: 0.395, w: 0.92, h: 0.235 }, figs: '8-158, 8-159', note: '90-45 → 20; 110-55 → 30' },
  'f242-158': { page: 242, crop: { x: 0.06, y: 0.496, w: 0.90, h: 0.172 }, figs: '8-158, 8-159', note: 'figures below the printed target labels (labels shown on REVEAL)' },
  't242-drill': { page: 242, crop: { x: 0.04, y: 0.625, w: 0.92, h: 0.35 }, figs: 'ten-ball path drill', note: 'first ball 10-5; 4 ball 20-10 toward 10 → side pocket' },
  'f242-drill': { page: 242, crop: { x: 0.05, y: 0.748, w: 0.495, h: 0.20 }, figs: 'ten-ball path drill', note: 'figure only' },
  // printed 243
  't243-161': { page: 243, crop: { x: 0.04, y: 0.03, w: 0.92, h: 0.35 }, figs: '8-161', note: 'drill goal; six paths A–F' },
  'f243-161': { page: 243, crop: { x: 0.06, y: 0.168, w: 0.55, h: 0.212 }, figs: '8-161', note: 'figure only' },
  't243-zx': { page: 243, crop: { x: 0.04, y: 0.375, w: 0.92, h: 0.335 }, figs: 'Zero-X Banking layout', note: '5 ball 18-9 toward 9 (8 if short); 4 ball 22-11' },
  'f243-zx': { page: 243, crop: { x: 0.415, y: 0.49, w: 0.51, h: 0.198 }, figs: 'Zero-X Banking layout', note: 'figure only' },
  't243-end': { page: 243, crop: { x: 0.04, y: 0.66, w: 0.92, h: 0.32 }, figs: 'balls near the end rail', note: '4 ball toward 11; 10 ball 50-25 toward 25' },
  'f243-end': { page: 243, crop: { x: 0.06, y: 0.748, w: 0.51, h: 0.198 }, figs: 'balls near the end rail', note: 'figure only' },
  // printed 244 (banking portion only, above y 0.348)
  't244-speed': { page: 244, crop: { x: 0.04, y: 0.035, w: 0.92, h: 0.095 }, figs: 'text', note: '24 or 23; end-rail banks are speed sensitive' },
  't244-corner': { page: 244, crop: { x: 0.03, y: 0.04, w: 0.94, h: 0.306 }, figs: 'corner-pocket bank drill', note: '4 ball 36-18 toward 18 → corner' },
  'f244-corner': { page: 244, crop: { x: 0.06, y: 0.166, w: 0.47, h: 0.18 }, figs: 'corner-pocket bank drill', note: 'figure only' }
};

/** lessonId → region shown with the question (fig) and region shown after LOCK ANSWER (reveal). */
export const ASSET_MAP = {
  // 1 · Path context (241–242)
  'ctx-intro': { fig: 't241-151', purpose: 'teaching' },
  'ctx-value': { fig: 't242-157', purpose: 'referenceGuide' },
  'ctx-id-value': { fig: 'f242-157', reveal: 't242-157', purpose: 'problem' },
  'ctx-calc-60': { fig: 'f241-153', reveal: 't241-153', purpose: 'problem' },
  'ctx-calc-80': { fig: 'f241-155', reveal: 't241-155', purpose: 'problem' },
  'ctx-calc-100': { fig: 'f241-155', reveal: 't241-155', purpose: 'problem' },
  'ctx-solve-90': { fig: 'f242-158', reveal: 't242-158', purpose: 'problem' },
  'ctx-solve-110': { fig: 'f242-158', reveal: 't242-158', purpose: 'problem' },
  'ctx-why': { fig: 't242-drill', purpose: 'teaching' },
  // 2 · Find the Path drill (242–243)
  'fp-setup': { fig: 't242-drill', purpose: 'teaching' },
  'fp-cue': { fig: 't242-drill', purpose: 'teaching' },
  'fp-id-first': { fig: 'f242-drill', reveal: 't242-drill', purpose: 'problem' },
  'fp-id-4': { fig: 'f242-drill', reveal: 't242-drill', purpose: 'problem' },
  'fp-aim-4': { fig: 'f242-drill', reveal: 't242-drill', purpose: 'problem' },
  'fp-goal': { fig: 't243-161', purpose: 'teaching' },
  'fp-goal-q': { fig: 'f242-drill', reveal: 't243-161', purpose: 'problem' },
  'fp-paths': { fig: 't243-161', purpose: 'teaching' },
  'fp-id-a': { fig: 'f243-161', reveal: 't243-161', purpose: 'problem' },
  'fp-id-d': { fig: 'f243-161', reveal: 't243-161', purpose: 'problem' },
  'fp-shoot': { fig: 'f242-drill', reveal: 't242-drill', purpose: 'physicalSetup' },
  // 3 · Zero-X Banking (243)
  'zx-intro': { fig: 't243-zx', purpose: 'teaching' },
  'zx-5': { fig: 't243-zx', purpose: 'teaching' },
  'zx-steps': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'zx-aim-5': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'zx-speed': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'zx-short': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'zx-4': { fig: 'f243-zx', reveal: 't243-end', purpose: 'problem' },
  'zx-shoot-5': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'physicalSetup' },
  'zx-shoot-4': { fig: 'f243-zx', reveal: 't243-end', purpose: 'physicalSetup' },
  // 4 · End-rail banks & speed (243–244)
  'er-10': { fig: 't243-end', purpose: 'teaching' },
  'er-speed': { fig: 't244-speed', purpose: 'teaching' },
  'er-id': { fig: 'f243-end', reveal: 't243-end', purpose: 'problem' },
  'er-aim': { fig: 'f243-end', reveal: 't243-end', purpose: 'problem' },
  'er-short': { fig: 'f243-end', reveal: 't244-speed', purpose: 'problem' },
  'er-hard': { fig: 'f243-end', reveal: 't244-speed', purpose: 'problem' },
  'er-order': { fig: 'f243-end', reveal: 't244-speed', purpose: 'problem' },
  'er-shoot-soft': { fig: 'f243-end', reveal: 't243-end', purpose: 'physicalSetup' },
  'er-shoot-hard': { fig: 'f243-end', reveal: 't244-speed', purpose: 'physicalSetup' },
  // 5 · Corner-pocket bank drill (244 top)
  'cb-drill': { fig: 't244-corner', purpose: 'teaching' },
  'cb-focus': { fig: 't244-corner', purpose: 'teaching' },
  'cb-id': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'problem' },
  'cb-aim': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'problem' },
  'cb-where': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'problem' },
  'cb-shoot': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'physicalSetup' },
  // 6 · stub (needs source review)
  'pn-stub': { fig: 't243-161', purpose: 'referenceGuide' },
  // exam
  'ex-k1': { fig: 'f241-155', reveal: 't241-155', purpose: 'problem' },
  'ex-k2': { fig: 'f242-157', reveal: 't242-157', purpose: 'problem' },
  'ex-k3': { fig: 'f242-drill', reveal: 't242-drill', purpose: 'problem' },
  'ex-k4': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'ex-k5': { fig: 'f243-zx', reveal: 't243-zx', purpose: 'problem' },
  'ex-k6': { fig: 'f243-end', reveal: 't243-end', purpose: 'problem' },
  'ex-k7': { fig: 'f243-end', reveal: 't244-speed', purpose: 'problem' },
  'ex-k8': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'problem' },
  'ex-k9': { fig: 'f243-161', reveal: 't243-161', purpose: 'problem' },
  'ex-x1': { fig: 'f243-zx', reveal: 't243-end', purpose: 'physicalSetup' },
  'ex-x2': { fig: 'f244-corner', reveal: 't244-corner', purpose: 'physicalSetup' }
};

export function regionOf(key) {
  const r = REGIONS[key];
  if (!r) return null;
  const p = PAGES[r.page];
  return { key, ...r, sourceImage: p.src, pdf: p.pdf, w: p.w, h: p.h, view: p.view };
}

/** Lesson asset: question region (+ reveal region after LOCK ANSWER). */
export function assetOf(lessonId) {
  const a = ASSET_MAP[lessonId];
  if (!a) return null;
  const fig = regionOf(a.fig);
  if (!fig) return null;
  return { ...fig, purpose: a.purpose, reveal: a.reveal ? regionOf(a.reveal) : null };
}

export function pageSrc(page) {
  return PAGES[Number(page)]?.src || null;
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function cropSpan(r, alt) {
  const c = r.crop;
  const ar = (c.w * r.w) / (c.h * r.h);
  return `<span class="pkfbCrop" style="--cx:${c.x};--cy:${c.y};--cw:${c.w};--ch:${c.h};--ar:${ar.toFixed(4)}"><img src="${esc(r.sourceImage)}" alt="${esc(alt)}" width="${r.w}" height="${r.h}" decoding="async" draggable="false"/></span>`;
}

function enlargeAttrs(r, c) {
  return `data-src="${esc(r.sourceImage)}" data-w="${r.w}" data-h="${r.h}" data-cx="${c.x}" data-cy="${c.y}" data-cw="${c.w}" data-ch="${c.h}"`;
}

/** One original-JPEG region as a CSS viewport (never stretched: aspect ratio comes from the crop). */
export function regionHTML(r, { alt = 'PKF example', fullBtn = true, label = '' } = {}) {
  if (!r) return '<p class="muted">No source image for this lesson.</p>';
  const v = r.view;
  const btn = fullBtn
    ? `<button type="button" class="chip pkfbFullBtn" data-action="pkfb-enlarge" ${enlargeAttrs(r, v)}>VIEW FULL PKF EXAMPLE</button>`
    : '';
  return `<div class="pkfbFig" data-pkfb-fig="${esc(r.key)}" data-page="${r.page}">
    ${label ? `<p class="pkfbFigLabel">${esc(label)}</p>` : ''}
    <button type="button" class="pkfbCropBtn" data-action="pkfb-enlarge" ${enlargeAttrs(r, r.crop)} aria-label="Enlarge PKF example">${cropSpan(r, alt)}</button>
    <p class="pkfbCite muted small">PKF page ${r.page} · ${esc(r.figs)} · tap to enlarge</p>
    ${btn}
  </div>`;
}

export function figureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  if (!a) return '<p class="muted">No source image for this lesson.</p>';
  return regionHTML(a, opts);
}

export function revealFigureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  if (!a?.reveal) return '';
  return regionHTML(a.reveal, { label: 'PKF SOLUTION · ORIGINAL PAGE', ...opts });
}
