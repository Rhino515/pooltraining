/**
 * Pool IQ Speed System — numeric, calibratable.
 * SPEED n ≈ n table lengths of total cue-ball travel for a ball struck from near an end rail
 * on a clear table (rail rebounds included). Break speed is beyond the scale.
 */
export const SPEED_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
export const CALIBRATION_SPEEDS = [1, 1.5, 2, 2.5, 3];

const MEANINGS = {
  0.5: 'half a table length — dies around the side pockets',
  1: 'one table length — just reaches the far rail',
  1.5: 'far rail and back to the side pockets',
  2: 'two lengths — far rail and back to your starting end',
  2.5: 'two and a half lengths — back to the start, out again to the sides',
  3: 'three lengths — ends at the far rail after two rebounds',
  3.5: 'three and a half lengths — firm, controlled power',
  4: 'four lengths — firm stroke, back to the starting end twice',
  4.5: 'four and a half lengths — hard but still controlled',
  5: 'five lengths — near the top of the controlled range'
};

export function formatSpeed(s) {
  const v = Number(s) || 0;
  return v.toFixed(1);
}

export function speedLabel(s) {
  return `SPEED ${formatSpeed(s)}`;
}

export function speedMeaning(s) {
  const v = Math.round(Number(s) * 2) / 2;
  if (v > 5) return 'beyond the scale — break-level power, not used for position';
  return MEANINGS[v] || `about ${formatSpeed(v)} table lengths of cue-ball travel`;
}

/** Where a lag at speed s from the head rail ends: { leg (1-based), fraction along leg 0-1, diamond 0-8 from head rail } */
export function lagEndpoint(s) {
  const leg = Math.max(1, Math.ceil(s));
  const along = s - (leg - 1);
  const outward = leg % 2 === 1; // odd legs travel away from the head rail
  const diamond = outward ? along * 8 : 8 - along * 8;
  return { leg, outward, diamond: Math.round(diamond * 10) / 10 };
}

/** Convert a recorded stop (leg + diamond from head rail) into table lengths travelled */
export function travelFromStop(leg, diamond) {
  const d = Math.max(0, Math.min(8, Number(diamond)));
  const outward = leg % 2 === 1;
  return (leg - 1) + (outward ? d / 8 : (8 - d) / 8);
}

export const TABLE_SIZES = [7, 8, 9];
export const CLOTH_SPEEDS = ['slow', 'normal', 'fast'];

export function defaultCalibration() {
  return { tableSize: 9, cloth: 'normal', results: {}, factors: {}, updatedAt: null };
}

/** Record one calibration shot result; returns new calibration object */
export function recordCalibration(cal, target, actualLengths) {
  const key = formatSpeed(target);
  const results = { ...(cal.results || {}) };
  const list = [...(results[key] || []), { actual: Math.round(actualLengths * 100) / 100, date: new Date().toISOString() }].slice(-10);
  results[key] = list;
  const factors = { ...(cal.factors || {}) };
  const recent = list.slice(-5);
  const avg = recent.reduce((a, r) => a + r.actual, 0) / recent.length;
  factors[key] = avg > 0 ? Math.round((target / avg) * 100) / 100 : 1;
  return { ...cal, results, factors, updatedAt: new Date().toISOString() };
}

/** Personal factor for any speed (nearest calibrated value, else 1) */
export function personalFactor(cal, s) {
  const f = cal?.factors || {};
  const keys = Object.keys(f).map(Number);
  if (!keys.length) return 1;
  const nearest = keys.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a));
  return f[formatSpeed(nearest)] || 1;
}

/** Human advice from calibration, e.g. "Your SPEED 2.0 runs short — stroke it like 2.3" */
export function calibrationAdvice(cal, s) {
  const f = personalFactor(cal, s);
  if (!cal || !Object.keys(cal.factors || {}).length) return null;
  if (Math.abs(f - 1) < 0.06) return `Your ${speedLabel(s)} is calibrated ✓`;
  const feel = Math.round(s * f * 10) / 10;
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
