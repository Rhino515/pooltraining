/**
 * PKF Shot Making & Center Ball — source image map.
 * Original PKF JPEGs (PKF-Master PDF pages 35–58) copied unmodified into images/pkf-smcb/.
 * Crops are CSS viewports only; nothing is redrawn, recoloured or re-encoded.
 *
 * Printed page = the "Page: N" footer on each JPEG (checked by eye on all 24 files):
 * PDF 37–57 → printed 23–43 (PDF − 14). PDF 35 is the CENTER BALL divider, PDF 36 and 58 are blank
 * inserts: none of them carry a printed page (printed: null). PDF 59 (SLIDING CUE BALL) is not in this pack.
 *
 * Captions reuse the Cue Ball Control caption helper (citeText) so the printed page shows once.
 */
import { citeText } from './pkfCueBallAssets.js';

export const PKF_SMCB_IMG_DIR = './images/pkf-smcb';
export const CHAPTER = 'Chapter Three: Center Ball';

const file = (pdf) => `./images/pkf-smcb/PKF_CenterBall_PDF_${String(pdf).padStart(3, '0')}.jpg`;

/** PDF page → original file, printed page, pixel size. */
export const PAGES = {};
for (let pdf = 35; pdf <= 58; pdf++) {
  const insert = pdf === 35 || pdf === 36 || pdf === 58;
  const big = pdf === 35 || pdf === 36;
  PAGES[pdf] = { src: file(pdf), pdf, printed: insert ? null : pdf - 14, w: big ? 909 : 756, h: big ? 1179 : 1080, view: { x: 0, y: 0, w: 1, h: 1 } };
}
PAGES[35].title = 'CENTER BALL divider';
PAGES[36].title = 'blank insert';
PAGES[58].title = 'blank insert';

/**
 * Printed figure boxes [pdf, x, y, w, h] (fractions of the page), measured on the JPEGs.
 * U51a / U51b / U53a / U57a are photos/diagrams PKF prints WITHOUT a figure number
 * (the numbering skips 3-55, 3-57 and 3-61). They are named by page, never by a guessed number.
 */
const FIG = {
  '3-1': [37, 0.071, 0.761, 0.421, 0.172], '3-2': [37, 0.508, 0.761, 0.413, 0.172],
  '3-3': [38, 0.079, 0.094, 0.413, 0.167], '3-4': [38, 0.508, 0.094, 0.413, 0.167],
  '3-5': [38, 0.079, 0.478, 0.413, 0.167], '3-6': [38, 0.508, 0.478, 0.413, 0.167],
  '3-7': [38, 0.079, 0.739, 0.413, 0.178], '3-8': [38, 0.508, 0.739, 0.413, 0.178],
  '3-9': [39, 0.079, 0.056, 0.563, 0.239],
  '3-10': [39, 0.079, 0.394, 0.413, 0.183], '3-11': [39, 0.508, 0.394, 0.413, 0.172],
  '3-12': [39, 0.079, 0.656, 0.413, 0.167], '3-13': [39, 0.508, 0.656, 0.413, 0.167],
  '3-14': [40, 0.103, 0.056, 0.373, 0.228], '3-15': [40, 0.524, 0.056, 0.381, 0.228],
  '3-16': [40, 0.079, 0.328, 0.421, 0.267],
  '3-17': [40, 0.079, 0.756, 0.413, 0.172], '3-18': [40, 0.508, 0.756, 0.413, 0.172],
  '3-19': [41, 0.079, 0.056, 0.468, 0.189], '3-20': [41, 0.079, 0.6, 0.571, 0.228],
  '3-21': [42, 0.079, 0.272, 0.413, 0.183], '3-22': [42, 0.508, 0.278, 0.413, 0.161],
  '3-23': [42, 0.079, 0.556, 0.413, 0.178], '3-24': [42, 0.524, 0.772, 0.397, 0.156],
  '3-25': [43, 0.079, 0.133, 0.413, 0.172], '3-26': [43, 0.508, 0.139, 0.413, 0.161],
  '3-27': [43, 0.079, 0.417, 0.444, 0.178], '3-28': [43, 0.079, 0.739, 0.468, 0.189],
  '3-29': [44, 0.079, 0.156, 0.413, 0.167], '3-30': [44, 0.508, 0.15, 0.413, 0.183],
  '3-31': [44, 0.079, 0.389, 0.492, 0.211], '3-32': [44, 0.421, 0.733, 0.5, 0.206],
  '3-33': [45, 0.079, 0.133, 0.484, 0.194], '3-34': [45, 0.079, 0.456, 0.413, 0.178],
  '3-35': [45, 0.508, 0.456, 0.413, 0.178], '3-36': [45, 0.333, 0.694, 0.587, 0.25],
  '3-37': [46, 0.079, 0.511, 0.437, 0.189], '3-38': [46, 0.492, 0.756, 0.429, 0.172],
  '3-39': [47, 0.079, 0.2, 0.413, 0.172], '3-40': [47, 0.508, 0.2, 0.413, 0.172],
  '3-41': [47, 0.079, 0.633, 0.508, 0.211],
  '3-42': [48, 0.079, 0.056, 0.476, 0.189], '3-43': [48, 0.079, 0.417, 0.413, 0.178],
  '3-44': [48, 0.5, 0.417, 0.421, 0.172], '3-45': [48, 0.476, 0.75, 0.444, 0.178],
  '3-46': [49, 0.079, 0.156, 0.413, 0.172], '3-47': [49, 0.508, 0.156, 0.413, 0.172],
  '3-48': [49, 0.079, 0.533, 0.413, 0.167], '3-49': [49, 0.508, 0.533, 0.413, 0.167],
  '3-50': [50, 0.079, 0.056, 0.413, 0.172], '3-51': [50, 0.508, 0.056, 0.413, 0.167],
  '3-52': [50, 0.079, 0.283, 0.579, 0.228],
  '3-53': [50, 0.079, 0.767, 0.413, 0.178], '3-54': [50, 0.508, 0.767, 0.413, 0.172],
  'U51a': [51, 0.071, 0.133, 0.492, 0.189], '3-56': [51, 0.333, 0.378, 0.595, 0.233],
  'U51b': [51, 0.079, 0.717, 0.563, 0.217],
  '3-58': [52, 0.079, 0.139, 0.294, 0.25], '3-59': [52, 0.079, 0.461, 0.563, 0.239],
  '3-60': [52, 0.405, 0.722, 0.516, 0.206],
  'U53a': [53, 0.079, 0.072, 0.46, 0.183],
  '3-62': [53, 0.079, 0.378, 0.413, 0.167], '3-63': [53, 0.508, 0.378, 0.413, 0.167],
  '3-64': [53, 0.079, 0.772, 0.413, 0.172], '3-65': [53, 0.508, 0.772, 0.413, 0.172],
  '3-66': [54, 0.079, 0.194, 0.381, 0.161], '3-67': [54, 0.54, 0.372, 0.381, 0.156],
  '3-68': [54, 0.079, 0.761, 0.413, 0.167], '3-69': [54, 0.508, 0.761, 0.413, 0.167],
  '3-70': [55, 0.437, 0.117, 0.484, 0.194], '3-71': [55, 0.079, 0.756, 0.429, 0.178],
  '3-72': [56, 0.079, 0.056, 0.571, 0.239],
  '3-73': [56, 0.079, 0.556, 0.413, 0.172], '3-74': [56, 0.508, 0.556, 0.413, 0.172],
  'U57a': [57, 0.079, 0.439, 0.508, 0.2]
};

/** Caption depth under each printed box (measured: last row of the "Figure 3-x" line; unnumbered = shadow only). */
const CAP = {'3-1': 0.013, '3-2': 0.013, '3-3': 0.0176, '3-4': 0.0176, '3-5': 0.0176, '3-6': 0.0176, '3-7': 0.0125, '3-8': 0.024, '3-9': 0.0125, '3-10': 0.0125, '3-11': 0.0148, '3-12': 0.0194, '3-13': 0.0194, '3-14': 0.0194, '3-15': 0.0185, '3-16': 0.011, '3-17': 0.0139, '3-18': 0.0139, '3-19': 0.0148, '3-20': 0.0176, '3-21': 0.0125, '3-22': 0.0194, '3-23': 0.0125, '3-24': 0.026, '3-25': 0.0139, '3-26': 0.0185, '3-27': 0.0157, '3-28': 0.0185, '3-29': 0.0148, '3-30': 0.0125, '3-31': 0.011, '3-32': 0.0102, '3-33': 0.0176, '3-34': 0.0125, '3-35': 0.0125, '3-36': 0.026, '3-37': 0.011, '3-38': 0.0204, '3-39': 0.013, '3-40': 0.013, '3-41': 0.012, '3-42': 0.0176, '3-43': 0.0125, '3-44': 0.0102, '3-45': 0.0148, '3-46': 0.0093, '3-47': 0.0093, '3-48': 0.0185, '3-49': 0.0185, '3-50': 0.0111, '3-51': 0.0167, '3-52': 0.0204, '3-53': 0.0125, '3-54': 0.0093, 'U51a': 0.0037, '3-56': 0.0194, 'U51b': 0.0037, '3-58': 0.0176, '3-59': 0.0165, '3-60': 0.0176, 'U53a': 0.0037, '3-62': 0.0139, '3-63': 0.0139, '3-64': 0.0111, '3-65': 0.0111, '3-66': 0.0093, '3-67': 0.0176, '3-68': 0.0176, '3-69': 0.0176, '3-70': 0.0148, '3-71': 0.013, '3-72': 0.0125, '3-73': 0.0093, '3-74': 0.0093, 'U57a': 0.0037};

const clamp = (v) => Math.max(0, Math.min(1, v));
const r3 = (v) => Math.round(v * 1000) / 1000;
function figLabel(k) { return k.startsWith('U') ? `Unnumbered PKF ${k === 'U57a' ? 'photo' : (k === 'U53a' ? 'photo' : 'diagram')}` : `Figure ${k}`; }

/** Figure crop: the printed box plus its "Figure 3-x" caption line underneath. */
function figCrop([, x, y, w, h], cap = 0.02) {
  const x0 = clamp(x - 0.006), y0 = clamp(y - 0.004);
  return { x: r3(x0), y: r3(y0), w: r3(Math.min(1 - x0, w + 0.012)), h: r3(Math.min(1 - y0, h + 0.004 + cap)) };
}

/** Text + figure bands on one page (teaching / solution). x spans the text column. */
const BAND = {
  'p37': [37, 0.03, 0.97], 'p37-b': [37, 0.43, 0.96],
  'p38-a': [38, 0.03, 0.372], 'p38-b': [38, 0.36, 0.665], 'p38-c': [38, 0.665, 0.945],
  'p39-a': [39, 0.03, 0.3], 'p39-b': [39, 0.278, 0.6], 'p39-c': [39, 0.6, 0.975],
  'p40-a': [40, 0.03, 0.31], 'p40-b': [40, 0.31, 0.6], 'p40-c': [40, 0.595, 0.965],
  'p41-a': [41, 0.03, 0.49], 'p41-var': [41, 0.33, 0.49], 'p41-b': [41, 0.49, 0.965],
  'p42-a': [42, 0.03, 0.475], 'p42-b': [42, 0.465, 0.755], 'p42-c': [42, 0.745, 0.965],
  'p43-a': [43, 0.03, 0.33], 'p43-b': [43, 0.335, 0.965],
  'p44-a': [44, 0.03, 0.34], 'p44-b': [44, 0.335, 0.7], 'p44-c': [44, 0.69, 0.965],
  'p45': [45, 0.03, 0.97], 'p45-b': [45, 0.62, 0.965],
  'p46-a': [46, 0.03, 0.285], 'p46-b': [46, 0.27, 0.745], 'p46-c': [46, 0.735, 0.965],
  'p47-a': [47, 0.03, 0.39], 'p47-b': [47, 0.39, 0.965],
  'p48-a': [48, 0.03, 0.41], 'p48-ab': [48, 0.03, 0.62], 'p48-c': [48, 0.6, 0.965],
  'p49-a': [49, 0.03, 0.335], 'p49-b': [49, 0.33, 0.965],
  'p50-a': [50, 0.03, 0.27], 'p50-b': [50, 0.235, 0.54], 'p50-c': [50, 0.535, 0.965],
  'p51-a': [51, 0.03, 0.635], 'p51-b': [51, 0.64, 0.965],
  'p52-a': [52, 0.03, 0.42], 'p52-b': [52, 0.415, 0.7], 'p52-c': [52, 0.68, 0.965],
  'p53-a': [53, 0.03, 0.37], 'p53-b': [53, 0.24, 0.565], 'p53-c': [53, 0.555, 0.965],
  'p54': [54, 0.03, 0.97], 'p54-a': [54, 0.03, 0.37],
  'p55-a': [55, 0.03, 0.39], 'p55-b': [55, 0.395, 0.735], 'p55-c': [55, 0.72, 0.965],
  'p56-a': [56, 0.03, 0.735], 'p56-b': [56, 0.738, 0.965],
  'p57-a': [57, 0.03, 0.43], 'p57-b': [57, 0.415, 0.82]
};

/** Named regions (figure crops f*, bands p*, full pages t*). */
export const REGIONS = {};
for (const [k, box] of Object.entries(FIG)) {
  REGIONS[`f${k}`] = { page: box[0], crop: figCrop(box, CAP[k] ?? 0.02), figs: figLabel(k), kind: 'figure', unnumbered: k.startsWith('U') };
}
/** Side-by-side figure pairs printed on one row. */
const PAIRS = [['3-14', '3-15'], ['3-10', '3-11'], ['3-12', '3-13'], ['3-62', '3-63']];
for (const [a, b] of PAIRS) {
  const A = FIG[a], B = FIG[b];
  const x = Math.min(A[1], B[1]), y = Math.min(A[2], B[2]);
  const x1 = Math.max(A[1] + A[3], B[1] + B[3]), y1 = Math.max(A[2] + A[4], B[2] + B[4]);
  REGIONS[`f${a}+${b.split('-')[1]}`] = { page: A[0], crop: figCrop([A[0], x, y, x1 - x, y1 - y], Math.max(CAP[a], CAP[b])), figs: `Figures ${a}, ${b}`, kind: 'figure' };
}
for (const [k, [page, y0, y1]] of Object.entries(BAND)) {
  REGIONS[k] = { page, crop: { x: 0.055, y: y0, w: 0.89, h: r3(y1 - y0) }, figs: `page ${PAGES[page].printed}`, kind: 'band' };
}
for (let pdf = 35; pdf <= 58; pdf++) {
  REGIONS[`t${pdf}`] = { page: pdf, crop: { x: 0, y: 0, w: 1, h: 1 }, figs: PAGES[pdf].printed == null ? PAGES[pdf].title : `page ${PAGES[pdf].printed}`, kind: 'page' };
}

export function regionOf(key) {
  const r = REGIONS[key];
  if (!r) return null;
  const p = PAGES[r.page];
  return { key, ...r, sourceImage: p.src, pdf: p.pdf, printed: p.printed, w: p.w, h: p.h, view: p.view };
}

/**
 * lessonId → { fig, reveal?, hidePre?, purpose }.
 * purpose: TEACHING | QUESTION | SOLUTION | PHYSICAL SETUP | REFERENCE | DRILL.
 * hidePre: the figure itself prints the answer, so nothing is shown until LOCK ANSWER.
 * Question figures are figure-only crops (no surrounding text) so no printed answer is visible pre-lock;
 * "View Full PKF Page" is only offered after LOCK.
 */
export const ASSET_MAP = {
  // 1 · Center Ball vs Sidespin
  'smcb-intro': { fig: 'p37-b', purpose: 'TEACHING' },
  'smcb-elevate': { fig: 'p38-a', purpose: 'TEACHING' },
  'smcb-q-line': { fig: 'f3-3', reveal: 'p38-a', purpose: 'QUESTION' },
  'smcb-left-deflect': { fig: 'f3-5', reveal: 'p38-b', purpose: 'QUESTION' },
  'smcb-id-deflection': { fig: 'f3-6', reveal: 'p38-b', purpose: 'QUESTION' },
  'smcb-elevated-firm': { fig: 'p38-c', purpose: 'TEACHING' },
  'smcb-right-veer': { fig: 'f3-7', reveal: 'p39-a', purpose: 'QUESTION' },
  'smcb-long-8': { fig: 'f3-10', reveal: 'p39-b', purpose: 'QUESTION' },
  'smcb-rule-spin': { fig: 'f3-12+13', reveal: 'p39-c', hidePre: true, purpose: 'QUESTION' },
  'smcb-ghost-line': { fig: 'f3-14+15', purpose: 'TEACHING' },
  'smcb-q-adjust': { fig: 'f3-14', reveal: 'p40-b', purpose: 'QUESTION' },
  // 2 · Elevation & Sidespin Variables
  'smcb-q-level': { fig: 'f3-5', reveal: 'p40-c', purpose: 'QUESTION' },
  'smcb-swerve': { fig: 'p40-c', purpose: 'TEACHING' },
  'smcb-q-more-angle': { fig: 'f3-17', reveal: 'p41-a', purpose: 'QUESTION' },
  'smcb-variables': { fig: 'p41-var', purpose: 'TEACHING' },
  'smcb-q-variables': { fig: 'p41-var', reveal: 'p41-var', hidePre: true, purpose: 'QUESTION' },
  'smcb-q-shaft': { fig: 'p41-var', reveal: 'p41-var', hidePre: true, purpose: 'QUESTION' },
  // 3 · Finding Center & Center-Ball Drills
  'smcb-find-center': { fig: 'p41-b', purpose: 'TEACHING' },
  'smcb-q-tip-where': { fig: 'f3-20', reveal: 'p41-b', purpose: 'QUESTION' },
  'smcb-q-long-straight': { fig: 'p41-b', reveal: 'p41-b', hidePre: true, purpose: 'QUESTION' },
  'smcb-9drill': { fig: 'p42-a', purpose: 'DRILL' },
  'smcb-q-9-forward': { fig: 'f3-22', reveal: 'p42-b', purpose: 'QUESTION' },
  'smcb-q-9-back': { fig: 'f3-22', reveal: 'p42-b', purpose: 'QUESTION' },
  'smcb-shoot-9drill': { fig: 'f3-22', reveal: 'p42-b', purpose: 'PHYSICAL SETUP' },
  'smcb-rail-return': { fig: 'f3-24', reveal: 'p43-a', purpose: 'QUESTION' },
  'smcb-shoot-rail': { fig: 'f3-24', reveal: 'p42-c', purpose: 'PHYSICAL SETUP' },
  'smcb-shoot-rail-full': { fig: 'f3-26', reveal: 'p43-a', purpose: 'PHYSICAL SETUP' },
  // 4 · High Action
  'smcb-high-action': { fig: 'p43-b', purpose: 'TEACHING' },
  'smcb-q-high-why': { fig: 'f3-27', reveal: 'p43-b', purpose: 'QUESTION' },
  'smcb-q-tip-part': { fig: 'f3-28', reveal: 'p43-b', purpose: 'QUESTION' },
  'smcb-high-follow-in': { fig: 'f3-31', reveal: 'p44-b', purpose: 'QUESTION' },
  'smcb-shoot-high': { fig: 'f3-31', reveal: 'p44-b', purpose: 'PHYSICAL SETUP' },
  'smcb-high-close': { fig: 'f3-32', reveal: 'p44-c', purpose: 'QUESTION' },
  'smcb-shoot-high-close': { fig: 'f3-32', reveal: 'p44-c', purpose: 'PHYSICAL SETUP' },
  // 5 · Low Action
  'smcb-low-action': { fig: 't45', purpose: 'TEACHING' },
  'smcb-q-miscue': { fig: 'f3-36', reveal: 'p45-b', purpose: 'QUESTION' },
  'smcb-draw-tips': { fig: 'p46-a', reveal: 'p46-a', hidePre: true, purpose: 'QUESTION' },
  'smcb-q-power-draw': { fig: 'f3-37', reveal: 'p46-b', purpose: 'QUESTION' },
  'smcb-q-chalk': { fig: 'f3-38', reveal: 'p46-c', hidePre: true, purpose: 'QUESTION' },
  'smcb-draw-drill': { fig: 'p47-a', purpose: 'DRILL' },
  'smcb-shoot-draw': { fig: 'f3-39', reveal: 'p47-a', purpose: 'PHYSICAL SETUP' },
  // 6 · Stop Shot
  'smcb-stop-intro': { fig: 'p47-b', purpose: 'TEACHING' },
  'smcb-stop-physics': { fig: 'p48-ab', purpose: 'TEACHING' },
  'smcb-q-sliding': { fig: 'f3-41', reveal: 'p48-a', purpose: 'QUESTION' },
  'smcb-stop-diag': { fig: 'f3-41', reveal: 'p48-ab', purpose: 'QUESTION' },
  'smcb-q-follows': { fig: 'f3-41', reveal: 'p48-a', purpose: 'QUESTION' },
  'smcb-shoot-stop': { fig: 'f3-41', reveal: 'p47-b', purpose: 'PHYSICAL SETUP' },
  'smcb-q-less-low': { fig: 'f3-45', reveal: 'p48-c', hidePre: true, purpose: 'QUESTION' },
  'smcb-shoot-stop-degrees': { fig: 'f3-46', reveal: 'p49-a', purpose: 'PHYSICAL SETUP' },
  'smcb-q-pocket-bigger': { fig: 'f3-48', reveal: 'p49-b', purpose: 'QUESTION' },
  'smcb-mosconi': { fig: 'p50-b', purpose: 'DRILL' },
  'smcb-shoot-mosconi': { fig: 'f3-52', reveal: 'p50-b', purpose: 'PHYSICAL SETUP' },
  // 7 · Low Action for Position & Mike Massey's Low Action
  'smcb-min-angles': { fig: 'p50-c', purpose: 'TEACHING' },
  'smcb-q-min-angles': { fig: 'f3-53', reveal: 'p50-c', purpose: 'QUESTION' },
  'smcb-q-hold': { fig: 'f3-54', reveal: 'p50-c', purpose: 'QUESTION' },
  'smcb-massey': { fig: 'p51-a', purpose: 'TEACHING' },
  'smcb-q-massey': { fig: 'fU51a', reveal: 'p51-a', purpose: 'QUESTION' },
  'smcb-massey-curve': { fig: 'p51-b', purpose: 'REFERENCE' },
  // 8 · Ball Pocketing & Throw
  'smcb-throw': { fig: 'p52-a', purpose: 'TEACHING' },
  'smcb-q-throw-dir': { fig: 'f3-58', reveal: 'p52-a', hidePre: true, purpose: 'QUESTION' },
  'smcb-throw-q': { fig: 'f3-59', reveal: 'p52-b', hidePre: true, purpose: 'QUESTION' },
  'smcb-q-overcut': { fig: 'f3-60', reveal: 'p52-c', hidePre: true, purpose: 'QUESTION' },
  // 9 · Combination Throw
  'smcb-combo': { fig: 'p53-a', purpose: 'TEACHING' },
  'smcb-q-combo-above': { fig: 'fU53a', reveal: 'p53-b', purpose: 'QUESTION' },
  'smcb-q-combo-pos': { fig: 'fU53a', reveal: 'p53-b', purpose: 'QUESTION' },
  'smcb-combo-advantage': { fig: 'f3-65', reveal: 'p53-c', purpose: 'TEACHING' },
  'smcb-q-combo-c': { fig: 'f3-64', reveal: 'p53-c', purpose: 'QUESTION' },
  // 10 · Ball Pocketing Drills with a Cue-Ball Target
  'smcb-target-drill': { fig: 't54', purpose: 'DRILL' },
  'smcb-q-target-why': { fig: 'p54-a', reveal: 'p54-a', hidePre: true, purpose: 'QUESTION' },
  'smcb-shoot-max-high': { fig: 'f3-66', reveal: 't54', purpose: 'PHYSICAL SETUP' },
  'smcb-q-3things': { fig: 'p55-b', reveal: 'p55-b', hidePre: true, purpose: 'QUESTION' },
  'smcb-q-pocket-side': { fig: 'f3-70', reveal: 'p55-a', purpose: 'QUESTION' },
  'smcb-shoot-tip-above': { fig: 'f3-70', reveal: 'p55-a', purpose: 'PHYSICAL SETUP' },
  'smcb-shoot-center-target': { fig: 'f3-69', reveal: 'p55-b', purpose: 'PHYSICAL SETUP' },
  'smcb-shoot-low-target': { fig: 'f3-71', reveal: 'p55-c', purpose: 'PHYSICAL SETUP' },
  'smcb-problem': { fig: 'p56-a', purpose: 'DRILL' },
  'smcb-shoot-problem': { fig: 'f3-74', reveal: 'p56-a', purpose: 'PHYSICAL SETUP' },
  // 11 · Automatic Aiming
  'smcb-auto-aim': { fig: 'p56-b', purpose: 'TEACHING' },
  'smcb-q-auto-level': { fig: 'p56-b', reveal: 'p56-b', hidePre: true, purpose: 'QUESTION' },
  'smcb-q-auto-how': { fig: 'p57-a', reveal: 'p57-b', hidePre: true, purpose: 'QUESTION' },
  'smcb-shoot-3sec': { fig: 'fU57a', reveal: 'p57-b', purpose: 'PHYSICAL SETUP' },
  'smcb-q-next': { fig: 'p57-b', reveal: 'p57-b', hidePre: true, purpose: 'QUESTION' },
  // Exam (knowledge)
  'smx-deflect': { fig: 'f3-5', reveal: 'p38-b', purpose: 'QUESTION' },
  'smx-center-line': { fig: 'f3-3', reveal: 'p38-a', purpose: 'QUESTION' },
  'smx-level-never': { fig: 'f3-19', reveal: 'p41-a', hidePre: true, purpose: 'QUESTION' },
  'smx-long-straight': { fig: 'f3-20', reveal: 'p41-b', purpose: 'QUESTION' },
  'smx-rail-center': { fig: 'f3-24', reveal: 'p43-a', purpose: 'QUESTION' },
  'smx-high-tip': { fig: 'f3-28', reveal: 'p43-b', purpose: 'QUESTION' },
  'smx-draw-grip': { fig: 'p46-b', reveal: 'p46-b', hidePre: true, purpose: 'QUESTION' },
  'smx-stop-slide': { fig: 'f3-41', reveal: 'p48-a', purpose: 'QUESTION' },
  'smx-pocket-bigger': { fig: 'f3-48', reveal: 'p49-b', purpose: 'QUESTION' },
  'smx-throw-thinner': { fig: 'f3-59', reveal: 'p52-b', hidePre: true, purpose: 'QUESTION' },
  'smx-combo-line': { fig: 'fU53a', reveal: 'p53-b', purpose: 'QUESTION' },
  'smx-3things': { fig: 'p55-b', reveal: 'p55-b', hidePre: true, purpose: 'QUESTION' },
  'smx-auto': { fig: 'p56-b', reveal: 'p56-b', hidePre: true, purpose: 'QUESTION' },
  // Exam (physical: original PKF exercises only)
  'smx-x-stop': { fig: 'f3-41', reveal: 'p47-b', purpose: 'PHYSICAL SETUP' },
  'smx-x-high': { fig: 'f3-31', reveal: 'p44-b', purpose: 'PHYSICAL SETUP' },
  'smx-x-target': { fig: 'f3-66', reveal: 't54', purpose: 'PHYSICAL SETUP' },
  'smx-x-3sec': { fig: 'fU57a', reveal: 'p57-b', purpose: 'PHYSICAL SETUP' }
};

export function assetOf(lessonId) {
  const a = ASSET_MAP[lessonId];
  if (!a) return null;
  const fig = regionOf(a.fig);
  if (!fig) return null;
  return { ...fig, purpose: a.purpose, reveal: a.reveal ? regionOf(a.reveal) : null, hidePre: !!a.hidePre };
}

/** Flat mapping row: lessonId → sourceImage → sourcePage → sourceFigure → crop → chapter → concept → purpose. */
export function mappingRow(lesson) {
  const a = assetOf(lesson.id);
  if (!a) return null;
  return {
    lessonId: lesson.id,
    sourceImage: a.sourceImage,
    sourcePdfPage: a.pdf,
    sourcePage: a.printed,
    sourceFigure: a.figs,
    crop: a.crop,
    chapter: CHAPTER,
    concept: lesson.concept || '',
    purpose: a.purpose,
    solution: a.reveal ? { sourceImage: a.reveal.sourceImage, sourcePage: a.reveal.printed, region: a.reveal.key } : null
  };
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Caption: the figure name (if any) + the shared Cue Ball Control caption ("PKF page N · tap to enlarge"). */
export function captionText(r) {
  if (!r) return '';
  const base = citeText(r);
  return r.kind === 'figure' ? `${r.figs} · ${base}` : base;
}

function cropSpan(r, alt) {
  const c = r.crop;
  const ar = (c.w * r.w) / (c.h * r.h);
  return `<span class="pkfbCrop pkfsmCrop" style="--cx:${c.x};--cy:${c.y};--cw:${c.w};--ch:${c.h};--ar:${ar.toFixed(4)}"><img src="${esc(r.sourceImage)}" alt="${esc(alt)}" width="${r.w}" height="${r.h}" decoding="async" draggable="false"/></span>`;
}

function enlargeAttrs(r, c) {
  return `data-src="${esc(r.sourceImage)}" data-w="${r.w}" data-h="${r.h}" data-cx="${c.x}" data-cy="${c.y}" data-cw="${c.w}" data-ch="${c.h}"`;
}

/** Original JPEG region as a CSS viewport; tap to enlarge; optional View Full PKF Page. */
export function regionHTML(r, { alt = 'PKF example', fullBtn = true, label = '' } = {}) {
  if (!r) return '<p class="muted">No source image for this lesson.</p>';
  const btn = fullBtn ? `<button type="button" class="chip pkfbFullBtn" data-action="pkfsm-enlarge" ${enlargeAttrs(r, r.view)}>VIEW FULL PKF PAGE</button>` : '';
  return `<div class="pkfbFig pkfsmFig" data-pkfsm-fig="${esc(r.key)}" data-page="${r.page}" data-printed="${r.printed ?? ''}">
    ${label ? `<p class="pkfbFigLabel">${esc(label)}</p>` : ''}
    <button type="button" class="pkfbCropBtn" data-action="pkfsm-enlarge" ${enlargeAttrs(r, r.crop)} aria-label="Enlarge PKF example">${cropSpan(r, alt)}</button>
    <p class="pkfbCite muted small">${esc(captionText(r))}</p>
    ${btn}
  </div>`;
}

export function figureHTML(lessonId, { locked = true, ...opts } = {}) {
  const a = assetOf(lessonId);
  if (!a) return '<p class="muted">No source image for this lesson.</p>';
  if (!locked && a.hidePre) {
    return '<div class="card pkfsmHiddenFig" data-pkfsm-hidden-fig="1"><p class="muted small">The PKF figure for this question prints the answer, so it opens after you LOCK ANSWER.</p></div>';
  }
  return regionHTML(a, { fullBtn: locked, ...opts });
}

export function solutionFigureHTML(lessonId, opts = {}) {
  const a = assetOf(lessonId);
  if (!a) return '';
  const r = a.reveal || a;
  return regionHTML(r, { label: 'PKF SOLUTION · ORIGINAL PAGE', ...opts });
}
