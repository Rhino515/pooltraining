/**
 * "Install App": Android/Chrome uses the deferred beforeinstallprompt; iPhone/iPad Safari gets
 * Share → Add to Home Screen steps; hidden when already running installed (display-mode standalone).
 */
let deferred = null;
let onChange = () => {};

export function initInstall(cb) {
  onChange = cb || onChange;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep it for our own button
    deferred = e;
    onChange();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    onChange();
  });
}

export function isStandalone() {
  try {
    if (window.matchMedia && (window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches)) return true;
  } catch { /* ignore */ }
  return navigator.standalone === true;
}
export function isIOS(ua = navigator.userAgent, platform = navigator.platform, touch = navigator.maxTouchPoints) {
  return /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && touch > 1);
}
export function isAndroid(ua = navigator.userAgent) {
  return /Android/i.test(ua);
}

/** 'installed' | 'prompt' (Android/Chrome can install now) | 'ios' (show Add to Home Screen steps) | 'manual' */
export function installMode() {
  if (isStandalone()) return 'installed';
  if (isIOS()) return 'ios'; // iOS never fires beforeinstallprompt: Share → Add to Home Screen is the only way
  if (deferred) return 'prompt';
  return 'manual';
}

/** Show the browser's install prompt; resolves 'accepted' | 'dismissed' | 'unavailable' */
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  try {
    await e.prompt();
    const choice = await (e.userChoice || Promise.resolve({ outcome: 'dismissed' }));
    onChange();
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    onChange();
    return 'dismissed';
  }
}

export function installSheetHTML(mode = installMode()) {
  if (mode === 'ios') {
    return `<div class="eyebrow">INSTALL · IPHONE / IPAD</div><h2 class="sheetTitle">Add Pool IQ to your Home Screen</h2>
      <ol class="steps" data-install-steps="ios">
        <li>Tap the <b>Share</b> button <span class="shareGlyph" aria-hidden="true">⎋</span> (square with an arrow) in Safari's toolbar.</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
        <li>From now on, open Pool IQ from the new <b>Home Screen icon</b>.</li>
      </ol>
      <p class="muted small">The Home Screen app and a Safari tab keep <b>separate storage</b> — use the icon every time so all your history is in one place. If you already have progress in this tab, tap <b>Back Up Now</b> in Settings first, then <b>Restore from Backup</b> inside the installed app.</p>
      <button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`;
  }
  return `<div class="eyebrow">INSTALL</div><h2 class="sheetTitle">Install Pool IQ</h2>
    <ol class="steps" data-install-steps="manual">
      <li><b>Android (Chrome):</b> tap the <b>⋮</b> menu, then <b>Install app</b> or <b>Add to Home screen</b>.</li>
      <li><b>Samsung Internet:</b> tap <b>☰</b> → <b>Add page to</b> → <b>Home screen</b>.</li>
      <li><b>Desktop Chrome / Edge:</b> click the install icon in the address bar.</li>
    </ol>
    <p class="muted small">Installed, Pool IQ opens full-screen, works offline and the browser is far less likely to clear its storage.</p>
    <button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`;
}
