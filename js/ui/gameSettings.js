/**
 * Table Games settings (v14-119): one SETTINGS panel per game, saved per game, defaults equal to how each game played before.
 *   clock: match clock on/off + minutes, shot clock on/off + seconds, extensions per player per rack, extension length.
 *   plus the match settings each game's own logic already has: race or points target, who breaks, rack, rule set.
 * Stored under poolIQGameSettingsV1 (vault KEYS, so it is in backups). Not Career, XP, or rank.
 * The 8, 9, and 10-ball rule-set pick stays in poolIQRuleSet (stepFold.js), shared with the chips on the game screen.
 *
 * Clocks for every game except Ultimate Pool (which keeps its own clocks, now set from these lengths):
 * createClock(cfg) / clockPanelHTML(clock) / clockAction(clock, action, el). An extension adds its time only while the
 * shot clock is still running and that player has one left. Extensions reset each rack (clockNewRack).
 */
import { lsSet } from '../storage.js';

export const SETTINGS_KEY = 'poolIQGameSettingsV1';
export const RANGES = {
  matchMin: { min: 5, max: 120, step: 5 },
  shotSec: { min: 10, max: 120, step: 5 },
  extN: { min: 0, max: 5, step: 1 },
  extSec: { min: 5, max: 60, step: 5 },
  race: { min: 1, max: 21, step: 1 }
};
const clockOff = () => ({ matchOn: false, matchMin: 30, shotOn: false, shotSec: 30, extN: 1, extSec: 30 });
const clockUpl = () => ({ matchOn: true, matchMin: 30, shotOn: true, shotSec: 30, extN: 1, extSec: 30 });
export const BREAK_RULES = { off: 'Not tracked', alternate: 'Lag, then alternate', winner: 'Lag, then winner breaks' };
/** Defaults = what each game shipped with before settings existed. */
export const GAME_DEFAULTS = {
  8: { race: 5, breakRule: 'off', clock: clockOff() },
  9: { race: 5, breakRule: 'off', clock: clockOff() },
  10: { race: 5, breakRule: 'off', clock: clockOff() },
  bank: { race: 3, rack: 'short', lagBreaks: true, clock: clockOff() },
  upusa: { clock: clockUpl() },
  straight: { target: 50, clock: clockOff() },
  onepocket: { race: 3, lagBreaks: true, clock: clockOff() },
  loop: { clock: clockOff() },
  cribbage: { clock: clockOff() },
  kicksafe: { clock: clockOff() }
};
export const STRAIGHT_TARGET_CHOICES = [25, 50, 75, 100, 125];

const clampN = (v, r, dflt) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.max(r.min, Math.min(r.max, n));
};
export function normalizeClock(raw, base) {
  const b = base || clockOff();
  const c = raw && typeof raw === 'object' ? raw : {};
  return {
    matchOn: typeof c.matchOn === 'boolean' ? c.matchOn : b.matchOn,
    matchMin: clampN(c.matchMin ?? b.matchMin, RANGES.matchMin, b.matchMin),
    shotOn: typeof c.shotOn === 'boolean' ? c.shotOn : b.shotOn,
    shotSec: clampN(c.shotSec ?? b.shotSec, RANGES.shotSec, b.shotSec),
    extN: clampN(c.extN ?? b.extN, RANGES.extN, b.extN),
    extSec: clampN(c.extSec ?? b.extSec, RANGES.extSec, b.extSec)
  };
}
export function defaultsFor(id) {
  const d = GAME_DEFAULTS[id] || { clock: clockOff() };
  return JSON.parse(JSON.stringify(d));
}
export function normalizeSettings(id, raw) {
  const d = defaultsFor(id);
  const r = raw && typeof raw === 'object' ? raw : {};
  const out = { ...d, clock: normalizeClock(r.clock, d.clock) };
  if ('race' in d) out.race = clampN(r.race ?? d.race, RANGES.race, d.race);
  if ('breakRule' in d) out.breakRule = Object.prototype.hasOwnProperty.call(BREAK_RULES, r.breakRule) ? r.breakRule : d.breakRule;
  if ('rack' in d) out.rack = r.rack === 'full' ? 'full' : r.rack === 'short' ? 'short' : d.rack;
  if ('lagBreaks' in d) out.lagBreaks = typeof r.lagBreaks === 'boolean' ? r.lagBreaks : d.lagBreaks;
  if ('target' in d) out.target = STRAIGHT_TARGET_CHOICES.includes(Number(r.target)) ? Number(r.target) : d.target;
  return out;
}
function readAll() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}
export function readGameSettings(id) { return normalizeSettings(id, readAll()[id]); }
export function writeGameSettings(id, s) {
  const all = readAll();
  all[id] = normalizeSettings(id, s);
  lsSet(SETTINGS_KEY, JSON.stringify(all));
  return all[id];
}
export function resetGameSettings(id) {
  const all = readAll();
  delete all[id];
  lsSet(SETTINGS_KEY, JSON.stringify(all));
  return defaultsFor(id);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
export function clockText(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
const secText = (s) => (s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} sec`);

export function stepRow(label, field, value, text, { locked = false, on = null } = {}) {
  const r = RANGES[field];
  const dis = locked ? ' disabled' : '';
  const tog = on == null ? '' : `<button type="button" class="chip gsTog${on ? ' active' : ''}" data-action="gs-toggle" data-f="${field}"${dis}>${on ? 'ON' : 'OFF'}</button>`;
  const off = on === false;
  return `<div class="gsRow${off ? ' is-off' : ''}" data-gs-row="${field}"><span class="gsLab">${esc(label)}</span>${tog}<span class="gsStep"><button type="button" class="tmStep" data-action="gs-step" data-f="${field}" data-d="-1" aria-label="Less"${dis || (off ? ' disabled' : '')}${value <= r.min ? ' disabled' : ''}>−</button><b data-gs="${field}">${esc(text)}</b><button type="button" class="tmStep" data-action="gs-step" data-f="${field}" data-d="1" aria-label="More"${dis || (off ? ' disabled' : '')}${value >= r.max ? ' disabled' : ''}>+</button></span></div>`;
}
/** Clock rows (match clock, shot clock, extensions). upl = clocks always on (no ON/OFF). */
export function clockRowsHTML(c, { locked = false, upl = false } = {}) {
  const extOff = !upl && !c.shotOn;
  return stepRow('Match clock', 'matchMin', c.matchMin, `${c.matchMin} min`, { locked, on: upl ? null : c.matchOn })
    + stepRow('Shot clock', 'shotSec', c.shotSec, secText(c.shotSec), { locked, on: upl ? null : c.shotOn })
    + `<div class="gsGroup${extOff ? ' is-off' : ''}">${stepRow('Extensions per player per rack', 'extN', c.extN, String(c.extN), { locked: locked || extOff })}${stepRow('Extension length', 'extSec', c.extSec, `${c.extSec} sec`, { locked: locked || extOff })}</div>`;
}
/** gs-toggle / gs-step on a clock (returns the new clock) or null when the action is not a clock change. */
export function clockSettingAction(clock, action, el) {
  const f = el?.dataset?.f;
  const c = { ...normalizeClock(clock) };
  if (action === 'gs-toggle' && (f === 'matchMin' || f === 'shotSec')) {
    if (f === 'matchMin') c.matchOn = !c.matchOn; else c.shotOn = !c.shotOn;
    return c;
  }
  if (action === 'gs-step' && f && f !== 'race' && RANGES[f]) {
    c[f] = clampN(c[f] + (Number(el.dataset.d) || 0) * RANGES[f].step, RANGES[f], c[f]);
    return c;
  }
  return null;
}
/** One-line summary for the folded panel. */
export function settingsSummary(id, s) {
  const c = s.clock;
  const bits = [];
  if ('race' in s) bits.push(id === 'bank' ? `${s.rack === 'full' ? 'Full rack' : 'Short rack'} · race ${s.race}` : `Race to ${s.race}`);
  if ('target' in s) bits.push(`to ${s.target}`);
  if (id === 'upusa') bits.push(`${c.matchMin} min match · ${c.shotSec} sec shot · ${c.extN} × ${c.extSec} sec ext`);
  else bits.push(c.matchOn || c.shotOn ? [c.matchOn ? `${c.matchMin} min match` : '', c.shotOn ? `${c.shotSec} sec shot · ${c.extN} × ${c.extSec} sec ext` : ''].filter(Boolean).join(' · ') : 'Clocks off');
  return bits.join(' · ');
}
/**
 * The SETTINGS panel (folded <details>). locked = the match has started (shows the values, no changes).
 * extra = game-specific rows already rendered by the caller (rule set chips for 8/9/10).
 */
export function settingsPanelHTML(id, s, { locked = false, open = false, extra = '', fixedGame = false } = {}) {
  const c = s.clock;
  const upl = id === 'upusa';
  const dis = locked ? ' disabled' : '';
  const rows = [];
  if ('race' in s) rows.push(stepRow(id === 'onepocket' || id === 'bank' ? 'Race (racks)' : 'Race to', 'race', s.race, String(s.race), { locked }));
  if ('target' in s && fixedGame) rows.push(`<div class="gsRow"><span class="gsLab">Points to win</span><b>${s.target}</b></div>`);
  else if ('target' in s) rows.push(`<div class="gsRow"><span class="gsLab">Points to win</span><span class="chips">${STRAIGHT_TARGET_CHOICES.map((n) => `<button type="button" class="chip${n === s.target ? ' active' : ''}" data-action="gs-set" data-f="target" data-v="${n}"${dis}>${n}</button>`).join('')}</span></div>`);
  if ('rack' in s) rows.push(`<div class="gsRow"><span class="gsLab">Rack</span><span class="chips"><button type="button" class="chip${s.rack === 'short' ? ' active' : ''}" data-action="gs-set" data-f="rack" data-v="short"${dis}>SHORT · 5</button><button type="button" class="chip${s.rack === 'full' ? ' active' : ''}" data-action="gs-set" data-f="rack" data-v="full"${dis}>FULL · 8</button></span></div>`);
  if ('lagBreaks' in s) rows.push(`<div class="gsRow"><span class="gsLab">First break</span><span class="chips"><button type="button" class="chip${s.lagBreaks ? ' active' : ''}" data-action="gs-set" data-f="lagBreaks" data-v="1"${dis}>LAG WINNER BREAKS</button><button type="button" class="chip${!s.lagBreaks ? ' active' : ''}" data-action="gs-set" data-f="lagBreaks" data-v="0"${dis}>LAG WINNER GIVES IT</button></span></div>`);
  if ('breakRule' in s) rows.push(`<div class="gsRow"><span class="gsLab">Who breaks</span><span class="chips">${Object.entries(BREAK_RULES).map(([k, v]) => `<button type="button" class="chip${s.breakRule === k ? ' active' : ''}" data-action="gs-set" data-f="breakRule" data-v="${k}"${dis}>${esc(v)}</button>`).join('')}</span></div>`);
  rows.push(extra);
  rows.push(clockRowsHTML(c, { locked, upl }));
  return `<details class="card tgSettings" data-tg-settings="${esc(id)}"${open ? ' open' : ''}>
    <summary><span class="eyebrow">SETTINGS</span><b data-gs-summary>${esc(settingsSummary(id, s))}</b>${fixedGame ? '<small class="muted">Saved with your game</small>' : locked ? '<small class="muted">Locked for this match</small>' : ''}</summary>
    <div class="gsBody">${rows.join('')}
      <p class="muted small">${fixedGame ? 'These are saved with your game. Change them with EDIT GAME.' : upl ? 'Defaults are the league settings: 30-minute match clock, 30-second shot clock, one 30-second extension per player per rack.' : 'Clocks are off by default. An extension adds its time to a running shot clock. Extensions reset each rack.'}</p>
      ${fixedGame ? '' : `<button type="button" class="bigBtn alt" data-action="gs-reset"${dis}>RESET TO DEFAULTS</button>`}
    </div>
  </details>`;
}
/** Apply one gs-* action to settings s (returns the new settings, saved) or null when not a settings action. */
export function settingsAction(id, s, action, el) {
  if (!action.startsWith('gs-')) return null;
  if (action === 'gs-reset') return resetGameSettings(id);
  const next = JSON.parse(JSON.stringify(s));
  const f = el?.dataset?.f;
  const ck = clockSettingAction(next.clock, action, el);
  if (ck) next.clock = ck;
  else if (action === 'gs-step' && f === 'race') {
    next.race = clampN(next.race + (Number(el.dataset.d) || 0), RANGES.race, next.race);
  } else if (action === 'gs-set') {
    const v = el.dataset.v;
    if (f === 'target') next.target = Number(v);
    else if (f === 'rack') next.rack = v;
    else if (f === 'lagBreaks') next.lagBreaks = v !== '0';
    else if (f === 'breakRule') next.breakRule = v;
    else return s;
  } else return s;
  return writeGameSettings(id, next);
}

// ------------------------------------------------------------------ clocks (every game except Ultimate Pool)
export function createClock(cfg) {
  const c = normalizeClock(cfg);
  return { cfg: c, matchLeft: c.matchMin * 60000, matchRunning: false, matchEnd: 0, shotLeft: c.shotSec * 1000, shotRunning: false, shotEnd: 0, shotUsed: false, shotDone: false, shooter: 'you', ext: { you: c.extN, opp: c.extN }, alarmed: false };
}
export const clockActive = (k) => !!(k && (k.cfg.matchOn || k.cfg.shotOn));
export function matchMs(k) { return k.matchRunning ? Math.max(0, k.matchEnd - Date.now()) : k.matchLeft; }
export function shotMs(k) { return k.shotRunning ? Math.max(0, k.shotEnd - Date.now()) : k.shotLeft; }
/** Settings changed before the match: new lengths, fresh counts. */
export function clockReconfigure(k, cfg) {
  const fresh = createClock(cfg);
  Object.assign(k, fresh);
  return k;
}
export function clockNewRack(k) {
  if (!k) return k;
  if (k.shotRunning) k.shotLeft = shotMs(k);
  k.shotRunning = false;
  k.shotUsed = false;
  k.shotDone = false;
  k.shotLeft = k.cfg.shotSec * 1000;
  k.ext = { you: k.cfg.extN, opp: k.cfg.extN };
  return k;
}
/** True when the extension can be used right now (shot clock running with time left, shooter has one). */
export function canExtend(k) { return !!(k && k.cfg.shotOn && k.shotRunning && shotMs(k) > 0 && k.ext[k.shooter] > 0); }
export function clockPanelHTML(k) {
  if (!clockActive(k)) return '';
  const c = k.cfg;
  const shot = shotMs(k);
  const warn = k.shotRunning && shot <= 10000 && shot > 0;
  const who = k.shooter === 'opp' ? 'OPP' : 'YOU';
  return `<section class="mClock" data-mclock>
    <div class="tmClocks">
      ${c.matchOn ? `<div><small>MATCH</small><b data-mc-match>${clockText(matchMs(k))}</b></div>` : ''}
      ${c.shotOn ? `<div class="${warn ? 'warn' : ''}${k.shotDone ? ' done' : ''}"><small>SHOT · ${who}</small><b data-mc-shot>${k.shotDone ? 'TIME' : k.shotUsed ? clockText(shot) : '—'}</b></div>` : ''}
    </div>
    <div class="mcBtns">
      ${c.matchOn ? `<button type="button" class="chip" data-action="mc-match">${k.matchRunning ? 'PAUSE MATCH CLOCK' : matchMs(k) < c.matchMin * 60000 ? 'RESUME MATCH CLOCK' : 'START MATCH CLOCK'}</button>` : ''}
      ${c.shotOn ? `<button type="button" class="chip${k.shotRunning && k.shooter === 'you' ? ' active' : ''}" data-action="mc-shot" data-v="you">SHOT CLOCK · YOU</button><button type="button" class="chip${k.shotRunning && k.shooter === 'opp' ? ' active' : ''}" data-action="mc-shot" data-v="opp">SHOT CLOCK · OPP</button>` : ''}
    </div>
    ${c.shotOn ? `<button type="button" class="mcExt${canExtend(k) ? '' : ' is-used'}" data-action="mc-ext" ${canExtend(k) ? '' : 'disabled'}><b>EXTENSION +${c.extSec}s</b><small data-mc-extleft>YOU ${k.ext.you} LEFT · OPP ${k.ext.opp} LEFT</small></button>` : ''}
    <div class="mcBtns"><button type="button" class="chip" data-action="mc-pause">ALL STOP</button>${c.shotOn ? '<button type="button" class="chip" data-action="mc-rack">NEW RACK · RESET EXTENSIONS</button>' : ''}</div>
  </section>`;
}
/** Returns true when handled. */
export function clockAction(k, action, el) {
  if (!k || !action.startsWith('mc-')) return false;
  const c = k.cfg;
  if (action === 'mc-match' && c.matchOn) {
    if (k.matchRunning) { k.matchLeft = matchMs(k); k.matchRunning = false; }
    else if (k.matchLeft > 0) { k.matchEnd = Date.now() + k.matchLeft; k.matchRunning = true; }
    return true;
  }
  if (action === 'mc-shot' && c.shotOn) {
    k.shooter = el?.dataset?.v === 'opp' ? 'opp' : 'you';
    k.shotLeft = c.shotSec * 1000;
    k.shotEnd = Date.now() + k.shotLeft;
    k.shotRunning = true;
    k.shotUsed = true;
    k.shotDone = false;
    k.alarmed = false;
    return true;
  }
  if (action === 'mc-ext') {
    if (!canExtend(k)) return true; // called after time ran out, or none left: nothing happens
    k.ext[k.shooter] -= 1;
    k.shotLeft = shotMs(k) + c.extSec * 1000;
    k.shotEnd = Date.now() + k.shotLeft;
    return true;
  }
  if (action === 'mc-pause') {
    if (k.matchRunning) { k.matchLeft = matchMs(k); k.matchRunning = false; }
    if (k.shotRunning) { k.shotLeft = shotMs(k); k.shotRunning = false; }
    return true;
  }
  if (action === 'mc-rack') { clockNewRack(k); return true; }
  return true;
}
/** Called about 5 times a second: repaints the numbers; returns 'rerender' when a clock just hit zero. */
export function clockTick(k, root) {
  if (!clockActive(k) || !root) return '';
  let out = '';
  if (k.matchRunning && matchMs(k) <= 0) { k.matchRunning = false; k.matchLeft = 0; out = 'rerender'; }
  if (k.shotRunning && shotMs(k) <= 0) { k.shotRunning = false; k.shotLeft = 0; k.shotDone = true; out = 'rerender'; }
  const m = root.querySelector('[data-mc-match]');
  const s = root.querySelector('[data-mc-shot]');
  if (m) m.textContent = clockText(matchMs(k));
  if (s && k.shotUsed && !k.shotDone) s.textContent = clockText(shotMs(k));
  return out;
}
