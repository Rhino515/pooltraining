/**
 * Table calibration — playing-surface size only, for now.
 *
 * Cushion nose to cushion nose, always 2:1. Ball diameter stays 2.25 in on every size.
 *   7 ft — 78 in × 39 in
 *   8 ft — 88 in × 44 in   (default; Andrew's table)
 *   9 ft — 100 in × 50 in  (the original diagram: 1 unit = 1 inch)
 *
 * The Shot Simulator stores ball positions on a 100 × 50 diagram (one diamond = 12.5,
 * same grid on every size). Physics converts that diagram into these real inches, so a
 * shorter table makes the ball a larger fraction of the bed and a "table length" shorter.
 *
 * Cloth speed and cushion response are optional fields on the spec (muSlide, muRoll,
 * muSpin, muCushion, cushionE). simulate() already reads them. Nothing sets them yet,
 * so only the playing-surface size changes how a shot behaves.
 */
export const BALL_DIAMETER_IN = 2.25;
export const BALL_RADIUS_IN = 1.125;

export const TABLE_SIZES = {
  7: { ft: 7, lengthIn: 78, widthIn: 39, label: '7 FT' },
  8: { ft: 8, lengthIn: 88, widthIn: 44, label: '8 FT' },
  9: { ft: 9, lengthIn: 100, widthIn: 50, label: '9 FT' }
};
export const DEFAULT_FT = 8;

export function spec(ft) {
  const n = Number(ft);
  return TABLE_SIZES[n] ? { ...TABLE_SIZES[n] } : { ...TABLE_SIZES[DEFAULT_FT] };
}
/** Inches per diagram unit (diagram length is always 100). */
export function inchesPerUnit(table) {
  const s = table?.lengthIn ? table : spec(table);
  return s.lengthIn / 100;
}
/** Ball radius in diagram units — larger on a shorter table. */
export function diagramRadius(table) {
  return BALL_RADIUS_IN / inchesPerUnit(table);
}
export function isNine(table) {
  const s = table?.lengthIn ? table : spec(table);
  return Math.abs(s.lengthIn - 100) < 1e-6;
}
