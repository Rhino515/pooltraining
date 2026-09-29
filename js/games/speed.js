/**
 * Pool IQ Speed System — numeric, calibratable (v11.1 definition).
 *
 * SPEED n = n table lengths of TOTAL cue-ball travel, measured from where the cue ball starts
 * (centre ball, clear table, rail rebounds included). The standard reference start is the first
 * diamond at your end of the table, the way the ICA-style cue-ball speed exercise sets it up.
 * Quarter steps are allowed and speeds are shown with two decimals ("SPEED 1.50").
 *
 * From the first diamond every quarter step finishes on an odd diamond (1, 3, 5 or 7), so each speed
 * has a short plain meaning naming the stop diamond counted from your end rail. Real cushions soak up a little pace, so on most tables the ball
 * finishes slightly shorter than the sentence — that is what personal calibration corrects.
 */
export const SPEED_STEP = 0.25;
export const SPEED_STEPS = Array.from({ length: 20 }, (_, i) => (i + 1) * SPEED_STEP); // 0.25 … 5.00
export const CALIBRATION_SPEEDS = [1, 1.5, 2, 2.5, 3];
/** Standard start spot for the speed scale: diamonds from your end rail (0 = end rail, 8 = far rail) */
export const START_DIAMOND = 1;
/** Controlled range; above this the simulator still works but the stroke is power / break territory */
export const SCALE_MAX = 5;

/** "1.50" — two decimals, like the ICA speed indicator */
export function formatSpeed(s) {
  const v = Number(s) || 0;
  return v.toFixed(2);
}

export function speedLabel(s) {
  return `SPEED ${formatSpeed(s)}`;
}

/** Nearest quarter step */
export const roundQuarter = (s) => Math.round((Number(s) || 0) * 4) / 4;

/**
 * Storage key for a calibration speed. Half steps keep the original one-decimal keys ("1.5", "2.0")
 * so calibration data saved before v11.1 keeps working; quarter steps use two decimals ("1.25").
 */
export function calKey(s) {
  const v = Number(s) || 0;
  return Math.abs(v * 2 - Math.round(v * 2)) < 1e-9 ? v.toFixed(1) : v.toFixed(2);
}
/** Read a calibration list/value whichever key format it was stored under */
export function calLookup(obj, s) {
  if (!obj) return undefined;
  const v = Number(s) || 0;
  if (obj[calKey(v)] !== undefined) return obj[calKey(v)];
  for (const k of Object.keys(obj)) if (Math.abs(Number(k) - v) < 1e-9) return obj[k];
  return undefined;
}

/**
 * Where a straight centre-ball lag at SPEED s finishes, starting from `start` diamonds off your end rail.
 * Returns { rails, outward, diamond, total } — rails = cushions touched before it stops, outward = moving
 * away from you when it stops, diamond = stop spot 0–8 counted from your end rail, total = diamonds rolled.
 */
export function speedPath(s, start = START_DIAMOND) {
  const total = Math.max(0, Number(s) || 0) * 8;
  const u = start + total; // unfolded position along a mirrored table
  const rails = Math.max(0, Math.floor((u - 1e-9) / 8));
  const m = u - rails * 8; // distance along the final leg (0–8]
  const outward = rails % 2 === 0;
  const diamond = Math.round((outward ? m : 8 - m) * 100) / 100;
  return { rails, outward, diamond, total, start };
}

export const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const HALF = (d) => { const h = Math.round(d * 2) / 2; const w = Math.floor(h); return h % 1 ? `${w ? w : ''}½` : String(w); };

/**
 * v11.1 wording: every stop spot is named by the diamond counted from YOUR end rail (the shooter's end),
 * plus a plain landmark that says which way the ball is travelling, so "before / past the side pockets"
 * can never read backwards for a ball that is coming back to you.
 */
export function stopPhrase(d, outward) {
  const n = Math.round(d);
  if (Math.abs(d - n) > 0.15) return `Stops about ${HALF(d)} diamonds from your end`;
  if (n <= 0) return 'Stops at your end rail';
  if (n >= 8) return 'Stops at the far rail';
  const lm = {
    1: outward ? 'right back on the start spot' : 'back on the start spot',
    2: '',
    3: outward ? 'just before it reaches the side pockets' : 'just past the side pockets on the way back to you',
    4: 'level with the side pockets',
    5: outward ? 'just past the side pockets' : 'just before it reaches the side pockets',
    6: '2 diamonds short of the far rail',
    7: outward ? '1 diamond short of the far rail' : '1 diamond off the far rail'
  }[n];
  return `Stops on the ${ORD[n]} diamond from your end${lm ? `, ${lm}` : ''}`;
}
const TIMES = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

/** The route part: which cushions it visits before the final leg */
export function routePhrase(rails) {
  if (rails <= 0) return 'Rolls up the table';
  if (rails === 1) return 'Up to the far rail and back';
  if (rails === 2) return 'Up, back off your end rail, and out again';
  if (rails === 3) return 'Up and back, then up and back again';
  if (rails % 2 === 0) return `Up and back ${TIMES(rails / 2)}, then out again`;
  return `Up and back ${TIMES((rails - 1) / 2)}, then up and back again`;
}

/**
 * One plain meaning for SPEED s from the standard start spot (no trailing period):
 * "Up to the far rail and back. Stops on the 3rd diamond from your end, just past the side pockets on the way back to you"
 */
export function speedSentence(s, start = START_DIAMOND) {
  const p = speedPath(s, start);
  if (p.total <= 0) return 'No speed. The cue ball stays on the start spot';
  return `${routePhrase(p.rails)}. ${stopPhrase(p.diamond, p.outward)}`;
}

/** Plain meaning shown next to a SPEED number everywhere in the app */
export function speedMeaning(s) {
  const v = Number(s) || 0;
  const base = speedSentence(v);
  return v > SCALE_MAX + 1e-9 ? `${base} (power stroke, beyond the controlled 0.25–5.00 range)` : base;
}

/** "1.50: Up to the far rail and back. Stops on the 3rd diamond from your end, …" */
export function speedLine(s) {
  return `${formatSpeed(s)}: ${speedMeaning(s)}.`;
}

/** Table of every step for docs / help: [{ speed, text }] */
export function speedTable() {
  return SPEED_STEPS.map((s) => ({ speed: s, label: formatSpeed(s), text: speedSentence(s) }));
}

/** Where a lag at speed s from the standard start ends: { leg (1-based), outward, diamond 0-8 from your end rail } */
export function lagEndpoint(s, start = START_DIAMOND) {
  const p = speedPath(s, start);
  return { leg: p.rails + 1, outward: p.outward, diamond: Math.round(p.diamond * 10) / 10 };
}

/** Convert a recorded stop (pass/leg + diamond from your end rail) into table lengths travelled from the start spot */
export function travelFromStop(leg, diamond, start = START_DIAMOND) {
  const d = Math.max(0, Math.min(8, Number(diamond)));
  const outward = leg % 2 === 1;
  const unfolded = (leg - 1) * 8 + (outward ? d : 8 - d);
  return Math.max(0, (unfolded - start) / 8);
}

export const TABLE_SIZES = [7, 8, 9];
export const CLOTH_SPEEDS = ['slow', 'normal', 'fast'];

export function defaultCalibration() {
  return { tableSize: 9, cloth: 'normal', results: {}, factors: {}, updatedAt: null };
}

/** Record one calibration shot result; returns new calibration object */
export function recordCalibration(cal, target, actualLengths) {
  const key = calKey(target);
  const results = { ...(cal.results || {}) };
  const prev = calLookup(results, target) || [];
  // fold any differently-formatted key for the same speed into the canonical key
  for (const k of Object.keys(results)) if (k !== key && Math.abs(Number(k) - target) < 1e-9) delete results[k];
  const list = [...prev, { actual: Math.round(actualLengths * 100) / 100, date: new Date().toISOString() }].slice(-10);
  results[key] = list;
  const factors = { ...(cal.factors || {}) };
  for (const k of Object.keys(factors)) if (k !== key && Math.abs(Number(k) - target) < 1e-9) delete factors[k];
  const recent = list.slice(-5);
  const avg = recent.reduce((a, r) => a + r.actual, 0) / recent.length;
  factors[key] = avg > 0 ? Math.round((target / avg) * 100) / 100 : 1;
  return { ...cal, results, factors, updatedAt: new Date().toISOString() };
}

/** Personal factor for any speed (nearest calibrated value, else 1). Accepts old "2.0" and new "1.25" keys. */
export function personalFactor(cal, s) {
  const f = cal?.factors || {};
  const keys = Object.keys(f).filter((k) => Number.isFinite(Number(k)));
  if (!keys.length) return 1;
  const nearest = keys.reduce((a, b) => (Math.abs(Number(b) - s) < Math.abs(Number(a) - s) ? b : a));
  return f[nearest] || 1;
}

/** Human advice from calibration, e.g. "You tend to come up short — stroke it like your 2.30" */
export function calibrationAdvice(cal, s) {
  const f = personalFactor(cal, s);
  if (!cal || !Object.keys(cal.factors || {}).length) return null;
  if (Math.abs(f - 1) < 0.06) return `Your ${speedLabel(s)} is calibrated ✓`;
  const feel = Math.round(s * f * 20) / 20;
  return f > 1
    ? `You tend to come up short — stroke it like your ${formatSpeed(feel)}`
    : `You tend to run long — ease it back to your ${formatSpeed(feel)}`;
}

export function clothNote(cal) {
  if (!cal) return '';
  const size = `${cal.tableSize || 9}-ft`;
  const cloth = cal.cloth || 'normal';
  const extra = cloth === 'fast' ? 'Fast cloth: the same stroke travels farther, so every number needs less arm.' : cloth === 'slow' ? 'Slow cloth: expect to add stroke for the same number.' : 'Normal cloth.';
  return `${size} table · ${extra} Speeds are always measured in lengths of YOUR table.`;
}
