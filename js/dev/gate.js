/**
 * Dev Mode lock bypass, as one tiny module with no imports.
 *
 * Course, level and stage screens ask devBypass() whether a locked item may be opened.
 * app.js wires it to dev.js isUnlocked(): true only while andrewaphay@gmail.com is signed in
 * AND the Dev Mode switch (Settings → DEV MODE) is ON. Every other account, signed-out use,
 * and the owner with the switch OFF get false, so the normal unlock rules apply.
 *
 * A locked item opened this way is a DEV PREVIEW: its results are not saved, so Career XP,
 * scores and unlock progress are never changed by the bypass.
 */
let check = () => false;
export function setDevBypass(fn) { if (typeof fn === 'function') check = fn; }
export function devBypass() {
  try { return !!check(); } catch { return false; }
}
