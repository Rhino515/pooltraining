/**
 * PKF Kicking Systems — asset map (lessonId → original scan + crop).
 * Crops isolate figures; they do not redraw or alter diagram geometry.
 * Shared shell for a later PKF Banking Systems Course can reuse figureHTML().
 */

export const PKF_KICK_IMG_DIR = './images/pkf-kick';

/** @type {Record<string, { sourceImage: string, page: number, crop: { x: number, y: number, w: number, h: number }, purpose: string, note?: string }>} */
export const ASSET_MAP = {
  'mrs-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'Multiple Rail Systems intro + 30-30 add-to-target' },
  'mrs-3030': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: '30-30 path equals object number 60' },
  'mrs-short-long': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_229.jpg', page: 229, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'path short or long adjustments at 30' },
  'mrs-find-path': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_230.jpg', page: 230, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'finding cue ball path with cue stick' },
  'mrs-identify-60': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'identify 30-30 path for object 60' },
  'mrs-calc-path': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_230.jpg', page: 230, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'which path equals the object number' },
  'mrs-shoot-3030': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'shoot the 30-30 two-rail kick' },
  'viz-guide': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_231.jpg', page: 231, crop: { x: 0.05, y: 0.48, w: 0.86, h: 0.22 }, purpose: 'teaching', note: 'guide to visualize numbers between diamonds' },
  'viz-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_231.jpg', page: 231, crop: { x: 0.05, y: 0.48, w: 0.86, h: 0.22 }, purpose: 'problem', note: 'read half-numbers between diamonds' },
  'viz-example': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_231.jpg', page: 231, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'teaching', note: '33-32 path example with cue stick check' },
  'two-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'start − target = object ball number' },
  'two-ex-40-30': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.04, y: 0.12, w: 0.88, h: 0.38 }, purpose: 'teaching', note: '40-30 path → object 10' },
  'two-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.04, y: 0.52, w: 0.88, h: 0.38 }, purpose: 'problem', note: 'identify path for object 10 near side' },
  'two-calc': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.02, y: 0.55, w: 0.45, h: 0.35 }, purpose: 'problem', note: '45-15 path for object 30' },
  'two-solve': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_235.jpg', page: 235, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'steps to find cue ball path' },
  'two-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.04, y: 0.12, w: 0.88, h: 0.38 }, purpose: 'physicalSetup', note: 'shoot difference-method two-rail' },
  'chk-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_231.jpg', page: 231, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'hold cue stick over path to verify cue ball is under it' },
  'chk-endrail': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_264.jpg', page: 264, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'checking end-rail path with cue stick + math' },
  'chk-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_231.jpg', page: 231, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'which path places cue under the stick' },
  'three-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_237.jpg', page: 237, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'three-rail kicks; object number near corner' },
  'three-sep': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_237.jpg', page: 237, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'three rails for separation' },
  'three-calc': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_238.jpg', page: 238, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'object number and path for three-rail' },
  'three-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_239.jpg', page: 239, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'identify object ball number for three-rail' },
  'three-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_238.jpg', page: 238, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'shoot a three-rail kick' },
  'corner-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_242.jpg', page: 242, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'three-rail to corner; path for 25 then adjust' },
  'corner-add10': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_242.jpg', page: 242, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'add 10 per diamond from corner' },
  'corner-calc': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_242.jpg', page: 242, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: '30-05 path; target 5 + 10 = 15' },
  'corner-other': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_243.jpg', page: 243, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'other side of corner — double the subtract' },
  'corner-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_242.jpg', page: 242, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'shoot corner-pocket three-rail' },
  'railpos-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'diamond numbering 0–80 on long rails' },
  'railpos-paths': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'cue ball always on a number path' },
  'railpos-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'identify diamond values from corner 0' },
  'one-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'One Rail Kicks; Zero-X modified, no sidespin' },
  'one-sidespin': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'why sidespin misses (A–D paths)' },
  'one-nosidespin': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'no sidespin stays true at controlled speed' },
  'one-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'which path is short from too much speed/spin' },
  'one-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'practice one-rail with no sidespin' },
  'num-map': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'teaching', note: '0 to 80 by tens; mirror on other side' },
  'num-paths': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'number paths toward pocket or rail target' },
  'num-half': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_248.jpg', page: 248, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'half-numbers: 10-5, 30-15, 50-25' },
  'num-side0': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_249.jpg', page: 249, crop: { x: 0.02, y: 0.08, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'side pocket as 0 / back of pocket target' },
  'num-identify-path': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_249.jpg', page: 249, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'A=30-15 B=60-30 C=80-40' },
  'num-calc-half': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_248.jpg', page: 248, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'cue ball B is on which path' },
  'num-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_249.jpg', page: 249, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'shoot a number-path one-rail' },
  'half-stub': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_248.jpg', page: 248, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'needs source review: no Half-Table Kicks chapter title; half-number aim is under Number Guide' },
  'end-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_256.jpg', page: 256, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'cue ball coming off the end rail; side pocket 0' },
  'end-50-25': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_256.jpg', page: 256, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: '50-25 path toward side pocket' },
  'end-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_256.jpg', page: 256, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'identify end-rail path numbers' },
  'end-calc': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_257.jpg', page: 257, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'path when 8 is near first diamond' },
  'end-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_256.jpg', page: 256, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'shoot end-rail approach kick' },
  'long-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_258.jpg', page: 258, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'object ball already on cue ball path' },
  'long-focus': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_258.jpg', page: 258, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'hit target number precisely' },
  'long-32-16': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_258.jpg', page: 258, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: '32-16 path to 0 barely misses 6' },
  'long-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_258.jpg', page: 258, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'identify long-rail path' },
  'long-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_258.jpg', page: 258, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'shoot long-rail kick' },
  'dia-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_270.jpg', page: 270, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'Blue Series Diamond one-rail system; no L/R spin' },
  'dia-calc-ex': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_272.jpg', page: 272, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'divide distance to side pocket in half and add' },
  'dia-inside': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_272.jpg', page: 272, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'object inside path → add; outside → subtract' },
  'dia-solve': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_272.jpg', page: 272, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'calculate new target for figure 8-172/173' },
  'dia-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_272.jpg', page: 272, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'shoot Blue Series one-rail' },
  'adj-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_278.jpg', page: 278, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'distance-from-rail percentage adjustments' },
  'adj-pct': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_278.jpg', page: 278, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: '1st diamond 80%, 2nd 60%, 3rd 40%' },
  'adj-calc-a': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_278.jpg', page: 278, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'cue ball A one diamond out' },
  'adj-calc-c': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_279.jpg', page: 279, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: '40% of 10 added to 40 → 44; 44/2 = 22' },
  'adj-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_278.jpg', page: 278, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'physicalSetup', note: 'apply percentage adjustment on table' },
  'ks-intro': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_280.jpg', page: 280, crop: { x: 0.02, y: 0.06, w: 0.9, h: 0.88 }, purpose: 'teaching', note: 'Kick Safe instructional game from the book' },
  'ks-break': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_280.jpg', page: 280, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'teaching', note: 'soft break; at least three balls to a rail' },
  'ks-play': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_281.jpg', page: 281, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'teaching', note: 'players take turns kicking' },
  'ks-identify': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_280.jpg', page: 280, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'how is Kick Safe racked' },
  'ks-shoot': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_280.jpg', page: 280, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'play a Kick Safe practice inning' },
  'exam-k1': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'exam item 1' },
  'exam-k2': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_234.jpg', page: 234, crop: { x: 0.04, y: 0.12, w: 0.88, h: 0.38 }, purpose: 'problem', note: 'exam item 2' },
  'exam-k3': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_247.jpg', page: 247, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'exam item 3' },
  'exam-k4': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_248.jpg', page: 248, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'problem', note: 'exam item 4' },
  'exam-k5': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_256.jpg', page: 256, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'exam item 5' },
  'exam-k6': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_272.jpg', page: 272, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'exam item 6' },
  'exam-k7': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_278.jpg', page: 278, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'exam item 7' },
  'exam-k8': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_242.jpg', page: 242, crop: { x: 0.02, y: 0.28, w: 0.9, h: 0.45 }, purpose: 'problem', note: 'exam item 8' },
  'exam-x1': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_228.jpg', page: 228, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'exam item 9' },
  'exam-x2': { sourceImage: './images/pkf-kick/PKF_Kicking_PDF_246.jpg', page: 246, crop: { x: 0.02, y: 0.48, w: 0.9, h: 0.42 }, purpose: 'physicalSetup', note: 'exam item 10' },
};

export function assetOf(lessonId) {
  return ASSET_MAP[lessonId] || null;
}

export function pageSrc(page) {
  const n = Number(page);
  if (!Number.isFinite(n) || n < 227 || n > 281) return null;
  return `${PKF_KICK_IMG_DIR}/PKF_Kicking_PDF_${n}.jpg`;
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Cropped figure as CSS viewport (original JPEG, no redraw). */
export function figureHTML(lessonId, { alt = 'PKF example', fullBtn = true } = {}) {
  const a = assetOf(lessonId);
  if (!a) return '<p class="muted">No source image for this lesson.</p>';
  const c = a.crop || { x: 0.02, y: 0.06, w: 0.9, h: 0.88 };
  const ar = (c.w * 756) / (c.h * 1080);
  const btn = fullBtn
    ? `<button type="button" class="chip pkfFullBtn" data-action="pkf-enlarge" data-src="${esc(a.sourceImage)}" data-cx="${c.x}" data-cy="${c.y}" data-cw="${c.w}" data-ch="${c.h}">VIEW FULL PKF EXAMPLE</button>`
    : '';
  return `<div class="pkfFig" data-pkf-fig="${esc(lessonId)}" data-page="${a.page}">
    <button type="button" class="pkfCropBtn" data-action="pkf-enlarge" data-src="${esc(a.sourceImage)}" data-cx="${c.x}" data-cy="${c.y}" data-cw="${c.w}" data-ch="${c.h}" aria-label="Enlarge PKF example">
      <span class="pkfCrop" style="--cx:${c.x};--cy:${c.y};--cw:${c.w};--ch:${c.h};--ar:${ar.toFixed(4)}"><img src="${esc(a.sourceImage)}" alt="${esc(alt)}" width="756" height="1080" decoding="async"/></span>
    </button>
    ${btn}
  </div>`;
}
