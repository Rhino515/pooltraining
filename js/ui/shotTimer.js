/**
 * Optional shot timer for table games (8-ball, 9-ball, 10-ball, bank).
 * Off until turned on. Off hides the clock. Minutes and seconds are chosen here.
 * This is not a rules clock. Ultimate Pool USA uses its own published clocks.
 * Timer-on, friend's-turn, and mute are remembered with lsSet. Not career state.
 * A tick plays about once a second while the clock is running. The alarm plays once at zero.
 */
import { lsSet } from '../storage.js';

const PREF_KEY = 'poolIQShotTimer';
const models = new Map();

function readPrefs() {
  const base = { on: false, friend: false, mute: false };
  try {
    if (typeof localStorage === 'undefined') return base;
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || '');
    if (!raw || typeof raw !== 'object') return base;
    if (raw.on === true) base.on = true;
    if (raw.friend === true) base.friend = true;
    if (raw.mute === true) base.mute = true;
  } catch { /* keep defaults: timer off, friend's turn off, sound on */ }
  return base;
}

function writePrefs(prefs) {
  const next = { on: prefs.on === true, friend: prefs.friend === true, mute: prefs.mute === true };
  lsSet(PREF_KEY, JSON.stringify(next));
  return next;
}

export function timerModel(key) {
  if (!models.has(key)) {
    const p = readPrefs();
    models.set(key, {
      on: p.on, friend: p.friend, mute: p.mute,
      min: 1, sec: 0, running: false, left: 60000, endAt: 0, done: false, alarmed: false, lastTick: null
    });
  }
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
  const muteLabel = t.mute ? 'Muted' : 'Mute';
  const table = String(key).startsWith('tg-');
  const clock = t.on ? `<div class="tmClock${t.done ? ' done' : ''}" data-remain>${t.done && left <= 0 ? 'TIME' : clockText(left)}</div>
    <div class="tmPick" data-tm-pick>
      <div class="tmRow"><button type="button" class="tmStep" data-action="tm-min" data-key="${key}" data-d="-1" aria-label="Fewer minutes">−</button><b data-tm-min>${t.min} min</b><button type="button" class="tmStep" data-action="tm-min" data-key="${key}" data-d="1" aria-label="More minutes">+</button></div>
      <div class="tmRow"><button type="button" class="tmStep" data-action="tm-sec" data-key="${key}" data-d="-1" aria-label="Fewer seconds">−</button><b data-tm-sec>${pad(t.sec)} sec</b><button type="button" class="tmStep" data-action="tm-sec" data-key="${key}" data-d="1" aria-label="More seconds">+</button></div>
    </div>
    <div class="tmRun">
      <button type="button" class="bigBtn" data-action="tm-run" data-key="${key}">${t.running ? 'PAUSE' : 'START'}</button>
      <button type="button" class="bigBtn alt" data-action="tm-stop" data-key="${key}">STOP</button>
      <button type="button" class="tmMute" data-action="tm-mute" data-key="${key}" aria-pressed="${t.mute ? 'true' : 'false'}" aria-label="${t.mute ? 'Unmute the shot timer' : 'Mute the shot timer'}">${muteLabel}</button>
    </div>` : '';
  const friendBtn = table ? `<button type="button" class="tmFriend" data-action="tm-friend" data-key="${key}" aria-pressed="${t.friend ? 'true' : 'false'}">Friend's turn ${t.friend ? 'ON' : 'OFF'}</button>` : '';
  const opp = table && t.friend ? `<div class="tmOpp">
      <button type="button" class="bigBtn alt" data-action="tm-pocket" data-key="${key}">Opponent pocketed</button>
      <button type="button" class="bigBtn" data-action="tm-miss" data-key="${key}">Opponent missed</button>
    </div>` : '';
  return `<section class="shotTimer" data-shot-timer="${key}" data-on="${t.on ? 1 : 0}" data-friend="${t.friend ? 1 : 0}">
    <button type="button" class="bigBtn ${t.on ? 'alt' : ''}" data-action="tm-toggle" data-key="${key}">TIMER ${t.on ? 'ON' : 'OFF'}</button>
    ${clock}
    ${friendBtn}
    ${opp}
  </section>`;
}

function applyLength(t) {
  const sec = Math.max(1, t.min * 60 + t.sec);
  t.left = sec * 1000;
  t.done = false;
  t.alarmed = false;
  t.lastTick = null;
}

function prefsFrom(t) {
  return { on: t.on === true, friend: t.friend === true, mute: t.mute === true };
}

function applyPrefs(prefs) {
  writePrefs(prefs);
  for (const m of models.values()) {
    m.on = prefs.on;
    m.friend = prefs.friend;
    m.mute = prefs.mute;
    if (!m.on) { m.running = false; m.done = false; m.alarmed = false; }
  }
}

let audio = null;
function audioCtx() {
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  if (!audio) {
    try { audio = new AC(); } catch { return null; }
  }
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

function tone(freq, dur, peak, when, type) {
  const ac = audioCtx();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  const top = Math.max(0.0002, peak);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(top, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(when);
  o.stop(when + dur + 0.02);
}

function tickSound() {
  const ac = audioCtx();
  if (!ac) return;
  tone(980, 0.04, 0.035, ac.currentTime, 'square');
}

function alarmSound() {
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  tone(880, 0.16, 0.2, t0, 'square');
  tone(660, 0.22, 0.2, t0 + 0.18, 'square');
  tone(880, 0.32, 0.22, t0 + 0.42, 'square');
}

function startRunning(t) {
  if (t.left <= 0 || t.done) applyLength(t);
  t.done = false;
  t.alarmed = false;
  t.lastTick = null;
  t.endAt = Date.now() + t.left;
  t.running = true;
  audioCtx();
}

function stopRunning(t, reset) {
  if (t.running) t.left = remainMs(t);
  t.running = false;
  t.lastTick = null;
  if (reset) applyLength(t);
}

export function timerAction(action, el) {
  if (!action.startsWith('tm-') || !el?.dataset?.key) return false;
  const t = timerModel(el.dataset.key);
  if (action === 'tm-toggle') {
    const prefs = prefsFrom(t);
    prefs.on = !t.on;
    if (!prefs.on) stopRunning(t, false);
    applyPrefs(prefs);
    return 'rerender';
  }
  if (action === 'tm-friend') {
    const prefs = prefsFrom(t);
    prefs.friend = !t.friend;
    applyPrefs(prefs);
    return 'rerender';
  }
  if (action === 'tm-mute') {
    const prefs = prefsFrom(t);
    prefs.mute = !t.mute;
    applyPrefs(prefs);
    return 'rerender';
  }
  if (action === 'tm-pocket') {
    stopRunning(t, true);
    return 'rerender';
  }
  if (action === 'tm-miss') {
    if (t.on) {
      applyLength(t);
      startRunning(t);
    }
    return 'rerender';
  }
  if (!t.on) return false;
  if (action === 'tm-min' || action === 'tm-sec') {
    const d = Number(el.dataset.d) || 0;
    if (t.running) stopRunning(t, false);
    if (action === 'tm-min') t.min = Math.max(0, Math.min(99, t.min + d));
    else t.sec = Math.max(0, Math.min(59, t.sec + (d > 0 ? 5 : -5)));
    if (t.min === 0 && t.sec === 0) t.sec = 5;
    applyLength(t);
    return 'rerender';
  }
  if (action === 'tm-run') {
    if (t.running) stopRunning(t, false);
    else startRunning(t);
    return 'rerender';
  }
  if (action === 'tm-stop') {
    stopRunning(t, true);
    return 'rerender';
  }
  return false;
}

let tick = 0;
export function mountTimers() {
  if (tick) return;
  tick = setInterval(() => {
    const seen = new Set();
    for (const node of document.querySelectorAll('[data-shot-timer][data-on="1"]')) {
      const key = node.getAttribute('data-shot-timer');
      if (seen.has(key)) continue;
      seen.add(key);
      const t = models.get(key);
      const out = node.querySelector('[data-remain]');
      if (!t || !out) continue;
      const left = remainMs(t);
      if (t.running && left <= 0) {
        t.running = false;
        t.left = 0;
        t.done = true;
        t.lastTick = null;
        out.textContent = 'TIME';
        out.classList.add('done');
        const run = node.querySelector('[data-action="tm-run"]');
        if (run) run.textContent = 'START';
        if (!t.alarmed) {
          t.alarmed = true;
          if (!t.mute) alarmSound();
        }
      } else if (t.running) {
        out.textContent = clockText(left);
        const sec = Math.ceil(left / 1000);
        if (!t.mute && sec > 0 && t.lastTick !== sec) {
          t.lastTick = sec;
          tickSound();
        }
      }
    }
  }, 200);
}
