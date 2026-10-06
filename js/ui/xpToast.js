/**
 * v14-115: small "+N XP" pill that floats up under the header and fades out (~1.5s).
 * Never blocks input (pointer-events:none). Gains that land close together are combined into one pill.
 * Fed from app.js commit(): the difference in Lifetime XP between the old and new state, so every XP source shows it.
 * Cloud restore, backup restore and imports replace the saved data and reload the page; they never go through commit(),
 * so they never show it. XP amounts and storage are not touched here.
 */
export const XP_TOAST_MS = 1500;
const MERGE_MS = 450; // gains within this window add up into the pill that is already showing

/** Lifetime XP of a state (v11+ progression, else the legacy counter). */
export function xpOf(state) {
  if (!state) return 0;
  const life = Number(state.prog?.lifetimeXp);
  return Number.isFinite(life) ? life : Number(state.xp) || 0;
}

/** Positive XP gained between two states, else 0. */
export function xpGain(prev, next) {
  if (!prev || !next) return 0;
  const d = Math.round(xpOf(next) - xpOf(prev));
  return d > 0 ? d : 0;
}

export const xpText = (n) => `+${Math.round(n).toLocaleString('en-US')} XP`;

let el = null;
let total = 0;
let shownAt = 0;
let hideTimer = null;
let suppressed = 0;

/** Run fn without showing the pill (for bulk state replacement such as a restore). */
export function withoutXpToast(fn) {
  suppressed += 1;
  try { return fn(); } finally { suppressed -= 1; }
}

export function showXpGain(n) {
  const gain = Math.round(Number(n) || 0);
  if (gain <= 0 || suppressed || typeof document === 'undefined') return false;
  const now = Date.now();
  if (!el) {
    el = document.createElement('div');
    el.id = 'xpToast';
    el.className = 'xpToast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  total = el.classList.contains('show') && now - shownAt < MERGE_MS ? total + gain : gain;
  shownAt = now;
  el.textContent = xpText(total);
  el.dataset.xp = String(total);
  // restart the float/fade animation
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { el.classList.remove('show'); total = 0; }, XP_TOAST_MS);
  return true;
}
