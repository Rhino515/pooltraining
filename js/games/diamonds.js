/**
 * Diamond grid + ball-placement readout (pure, no DOM).
 *
 * Convention (shown to the player once in the Setup sheet):
 *   The diagram's left end is the HEAD rail, the top edge is the TOP long rail.
 *   First number  = diamonds from the head rail, counted along the long rails (0 at the head rail … 8 at the foot rail).
 *   Second number = diamonds from the top rail, counted along the short rails (0 at the top rail … 4 at the bottom rail).
 *   Rounded to the nearest ¼ diamond. Center spot = 4 · 2, head spot = 2 · 2, foot spot = 6 · 2.
 * Table units: 100 × 50, one diamond = 12.5 units (the diamond sights on the rails sit at multiples of 12.5).
 */
export const DIAMOND_UNITS = 12.5;
export const LONG_DIAMONDS = 8;
export const SHORT_DIAMONDS = 4;

/** Grid line positions (table units) — 7 across the long axis, 3 across the short axis */
export const GRID_X = Array.from({ length: LONG_DIAMONDS - 1 }, (_, i) => (i + 1) * DIAMOND_UNITS);
export const GRID_Y = Array.from({ length: SHORT_DIAMONDS - 1 }, (_, i) => (i + 1) * DIAMOND_UNITS);

export const quarter = (v) => Math.round(v * 4) / 4;

/** Table point → diamonds { fromHead, fromTop } rounded to ¼ and clamped to the table */
export function toDiamonds(p) {
  const x = Math.max(0, Math.min(100, Number(p.x)));
  const y = Math.max(0, Math.min(50, Number(p.y)));
  return { fromHead: quarter(x / DIAMOND_UNITS), fromTop: quarter(y / DIAMOND_UNITS) };
}

const FRAC = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' };
/** 2.75 → "2¾", 0.5 → "½", 0 → "0", 4 → "4" */
export function fmtDiamond(v) {
  const q = quarter(v);
  const whole = Math.floor(q + 1e-9);
  const fr = FRAC[Math.round((q - whole) * 100) / 100] ?? '';
  if (!whole && fr) return fr;
  return `${whole}${fr}`;
}

/** Balls to set up for a challenge (cue first), from its own coordinates */
export function setupBalls(ch) {
  if (!ch) return [];
  const out = [];
  if (ch.cueBallPosition) out.push({ id: 'cue', x: ch.cueBallPosition.x, y: ch.cueBallPosition.y });
  for (const b of ch.ballPositions || []) out.push({ id: b.n, x: b.x, y: b.y });
  for (const b of ch.blockers || []) if (!out.some((o) => o.id === b.n && o.x === b.x && o.y === b.y)) out.push({ id: b.n, x: b.x, y: b.y, blocker: true });
  return out.map((b) => ({ ...b, ...toDiamonds(b) }));
}

export const ballName = (id) => (id === 'cue' ? 'Cue' : `${id}-ball`);
/** "2¼ · 1½" */
export const shortPos = (b) => `${fmtDiamond(b.fromHead)} · ${fmtDiamond(b.fromTop)}`;
/** "2¼ diamonds from the head rail, 1½ from the top rail" */
export function wordsPos(b) {
  const h = fmtDiamond(b.fromHead);
  const t = fmtDiamond(b.fromTop);
  return `${h} diamond${b.fromHead === 1 ? '' : 's'} from the head rail, ${t} from the top rail`;
}

export const CONVENTION_TEXT = 'Positions are in diamonds, rounded to the nearest ¼. The first number counts diamonds from the head rail (the left end of the diagram, 0–8). The second counts diamonds down from the top rail (0–4). The faint dashed lines on the diagram run from each diamond sight, so 4 · 2 is the center spot, 2 · 2 the head spot and 6 · 2 the foot spot.';
