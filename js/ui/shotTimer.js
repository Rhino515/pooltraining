/**
 * Optional shot timer for table games (8-ball, 9-ball, 10-ball, bank).
 * Off until turned on. Off hides the clock. Minutes and seconds are chosen here.
 * This is not a rules clock. Ultimate Pool USA uses its own published clocks.
 */
const models = new Map();

export function timerModel(key) {
  if (!models.has(key)) models.set(key, { on: false, min: 1, sec: 0, running: false, left: 60000, endAt: 0, done: false });
  return models.get(key);
}

function pad(n) { return String(n).padStart(2, '0'); }
export function remainMs(t) {
  if (!t.running) return t.left;
  return Math.max(0, t.endAt - Date.now());
}
function clockText(ms) {
  const s = Math.ceil(ms / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function timerHTML(key) {
  const t = timerModel(key);
  const left = remainMs(t);
  const clock = t.on ? `<div class="tmClock${t.done ? ' done' : ''}" data-remain>${t.done && left <= 0 ? 'TIME' : clockText(left)}</div>
    <div class="tmPick" data-tm-pick>
      <div class="tmRow"><button type="button" class="tmStep" data-action="tm-min" data-key="${key}" data-d="-1" aria-label="Fewer minutes">−</button><b data-tm-min>${t.min} min</b><button type="button" class="tmStep" data-action="tm-min" data-key="${key}" data-d="1" aria-label="More minutes">+</button></div>
      <div class="tmRow"><button type="button" class="tmStep" data-action="tm-sec" data-key="${key}" data-d="-1" aria-label="Fewer seconds">−</button><b data-tm-sec>${pad(t.sec)} sec</b><button type="button" class="tmStep" data-action="tm-sec" data-key="${key}" data-d="1" aria-label="More seconds">+</button></div>
    </div>
    <button type="button" class="bigBtn" data-action="tm-run" data-key="${key}">${t.running ? 'PAUSE' : 'START'}</button>` : '';
  return `<section class="shotTimer" data-shot-timer="${key}" data-on="${t.on ? 1 : 0}">
    <button type="button" class="bigBtn ${t.on ? 'alt' : ''}" data-action="tm-toggle" data-key="${key}">TIMER ${t.on ? 'ON' : 'OFF'}</button>
    ${clock}
  </section>`;
}

function applyLength(t) {
  const sec = Math.max(1, t.min * 60 + t.sec);
  t.left = sec * 1000;
  t.done = false;
}

export function timerAction(action, el) {
  if (!action.startsWith('tm-') || !el?.dataset?.key) return false;
  const t = timerModel(el.dataset.key);
  if (action === 'tm-toggle') {
    t.on = !t.on;
    if (!t.on) { t.running = false; t.done = false; }
    return 'rerender';
  }
  if (!t.on) return false;
  if (action === 'tm-min' || action === 'tm-sec') {
    const d = Number(el.dataset.d) || 0;
    if (t.running) { t.left = remainMs(t); t.running = false; }
    if (action === 'tm-min') t.min = Math.max(0, Math.min(99, t.min + d));
    else t.sec = Math.max(0, Math.min(59, t.sec + (d > 0 ? 5 : -5)));
    if (t.min === 0 && t.sec === 0) t.sec = 5;
    applyLength(t);
    return 'rerender';
  }
  if (action === 'tm-run') {
    if (t.running) { t.left = remainMs(t); t.running = false; }
    else {
      if (t.left <= 0) applyLength(t);
      t.done = false;
      t.endAt = Date.now() + t.left;
      t.running = true;
    }
    return 'rerender';
  }
  return false;
}

let tick = 0;
export function mountTimers() {
  if (tick) return;
  tick = setInterval(() => {
    for (const node of document.querySelectorAll('[data-shot-timer][data-on="1"]')) {
      const t = models.get(node.getAttribute('data-shot-timer'));
      const out = node.querySelector('[data-remain]');
      if (!t || !out) continue;
      const left = remainMs(t);
      if (t.running && left <= 0) {
        t.running = false;
        t.left = 0;
        t.done = true;
        out.textContent = 'TIME';
        out.classList.add('done');
      } else if (t.running) out.textContent = clockText(left);
    }
  }, 200);
}
