/**
 * Create Your Own Game (v14-119): a named table game with your own rack and house rules, saved as a Table Games tile.
 * Stored under poolIQCustomGamesV1 = { games: [...] } (vault KEYS, so it is in backups). Not Career, XP, or rank.
 *
 * Scoring stays generic on purpose (no new rule text):
 *   race   = racks won toward a race. Optional game ball (pocketing it wins the rack). Optional lowest-ball-first rotation.
 *   points = 1 point per ball pocketed, first to the target. When every ball is down, re-rack.
 * House rules the scorer can honor: call shot on/off, cue ball in hand on a foul anywhere or behind the head string,
 * who breaks, and the match/shot clocks with extensions. A Straight Pool preset that keeps its 15 balls uses the
 * Straight Pool scorer (tableMatch.js).
 */
import { lsSet } from '../storage.js';
import { normalizeClock, clockRowsHTML, clockSettingAction, RANGES, BREAK_RULES } from './gameSettings.js';
import { LAYOUTS, PRESET_RACKS, normalizeRack, swapSlots, randomFill, reshape, rackSVG, sequential } from './rackLayout.js';
import { settingsKit, head } from './tableMatch.js';

export const CUSTOM_KEY = 'poolIQCustomGamesV1';
export const MAX_GAMES = 24;
export const NAME_MAX = 24;
export const TARGET_RANGE = { min: 5, max: 150, step: 5 };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clampN = (v, lo, hi, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };

/** Preset = a starting point only: ball count, rack, and the rule toggles that game uses. */
export const PRESETS = {
  8: { label: '8-BALL', name: '8-Ball', rack: PRESET_RACKS[8], scoring: 'race', race: 5, gameBall: 0, rotation: false, callShot: true, foulBih: 'anywhere', breakRule: 'alternate' },
  9: { label: '9-BALL', name: '9-Ball', rack: PRESET_RACKS[9], scoring: 'race', race: 5, gameBall: 9, rotation: true, callShot: false, foulBih: 'anywhere', breakRule: 'alternate' },
  10: { label: '10-BALL', name: '10-Ball', rack: PRESET_RACKS[10], scoring: 'race', race: 5, gameBall: 10, rotation: true, callShot: true, foulBih: 'anywhere', breakRule: 'alternate' },
  straight: { label: 'STRAIGHT POOL', name: 'Straight Pool', rack: PRESET_RACKS.straight, scoring: 'points', target: 50, gameBall: 0, rotation: false, callShot: true, foulBih: 'kitchen', breakRule: 'off' }
};

export function blankGame() {
  return {
    id: '',
    name: '',
    preset: 'none',
    ...normalizeRack({ count: 6, layout: 'triangle' }),
    scoring: 'race',
    race: 5,
    target: 50,
    gameBall: 0,
    rotation: false,
    callShot: false,
    foulBih: 'anywhere',
    breakRule: 'alternate',
    clock: normalizeClock(null)
  };
}

export function normalizeGame(raw) {
  const g = raw && typeof raw === 'object' ? raw : {};
  const rack = normalizeRack(g);
  const b = blankGame();
  return {
    id: /^cg-[a-z0-9]+$/.test(String(g.id || '')) ? g.id : '',
    name: String(g.name || '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX),
    preset: Object.prototype.hasOwnProperty.call(PRESETS, g.preset) ? String(g.preset) : 'none',
    ...rack,
    scoring: g.scoring === 'points' ? 'points' : 'race',
    race: clampN(g.race, RANGES.race.min, RANGES.race.max, b.race),
    target: clampN(Math.round(Number(g.target) / 5) * 5, TARGET_RANGE.min, TARGET_RANGE.max, b.target),
    gameBall: g.scoring === 'points' ? 0 : clampN(g.gameBall, 0, rack.count, 0),
    rotation: g.rotation === true,
    callShot: g.callShot === true,
    foulBih: g.foulBih === 'kitchen' ? 'kitchen' : 'anywhere',
    breakRule: Object.prototype.hasOwnProperty.call(BREAK_RULES, g.breakRule) ? g.breakRule : b.breakRule,
    clock: normalizeClock(g.clock)
  };
}

function readAll() {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
    const list = raw && Array.isArray(raw.games) ? raw.games : [];
    return list.map(normalizeGame).filter((g) => g.id && g.name);
  } catch { return []; }
}
const writeAll = (games) => lsSet(CUSTOM_KEY, JSON.stringify({ games: games.slice(0, MAX_GAMES) }));
export const readCustomGames = () => readAll();
export const readCustomGame = (id) => readAll().find((g) => g.id === id) || null;
export function newGameId(now = Date.now(), rnd = Math.random) {
  return `cg-${now.toString(36)}${Math.floor(rnd() * 1296).toString(36).padStart(2, '0')}`;
}
/** Save (insert or replace). Returns the saved game, or null when there is no name or the list is full. */
export function saveCustomGame(game) {
  const g = normalizeGame(game);
  if (!g.name) return null;
  const all = readAll();
  if (!g.id) {
    if (all.length >= MAX_GAMES) return null;
    g.id = newGameId();
  }
  const i = all.findIndex((x) => x.id === g.id);
  if (i >= 0) all[i] = g; else all.push(g);
  writeAll(all);
  return g;
}
export function deleteCustomGame(id) {
  const all = readAll();
  const next = all.filter((g) => g.id !== id);
  writeAll(next);
  return next.length !== all.length;
}
export function applyPreset(game, key) {
  const p = PRESETS[key];
  if (!p) return game;
  const rack = normalizeRack({ ...p.rack, pins: [] });
  return normalizeGame({
    ...game,
    preset: key,
    name: game.name || p.name,
    ...rack,
    scoring: p.scoring,
    race: p.race ?? game.race,
    target: p.target ?? game.target,
    gameBall: p.gameBall,
    rotation: p.rotation,
    callShot: p.callShot,
    foulBih: p.foulBih,
    breakRule: p.breakRule
  });
}

/** Short rule lines shown on the play screen and in the editor preview. */
export function houseRuleLines(g) {
  const out = [];
  out.push(`${g.count} ${g.count === 1 ? 'ball' : 'balls'}, ${LAYOUTS[g.layout].toLowerCase()} rack. Ball ${g.order[g.foot]} on the foot spot.`);
  out.push(g.scoring === 'points' ? `1 point for each ball pocketed. First to ${g.target}. Re-rack when every ball is down.` : `Race to ${g.race} racks.`);
  if (g.scoring === 'race' && g.gameBall) out.push(`Game ball: the ${g.gameBall}. Pocket it to win the rack.`);
  if (g.rotation) out.push('Rotation: hit the lowest-numbered ball first.');
  out.push(g.callShot ? 'Call shot: call the ball and the pocket.' : 'No call shot.');
  out.push(g.foulBih === 'kitchen' ? 'Foul: cue ball in hand behind the head string.' : 'Foul: cue ball in hand anywhere.');
  if (g.breakRule !== 'off') out.push(g.breakRule === 'winner' ? 'Breaks: lag, then the rack winner breaks.' : 'Breaks: lag, then alternate.');
  return out;
}
export function gameSummary(g) {
  return `${g.count} ${g.count === 1 ? 'ball' : 'balls'} · ${g.scoring === 'points' ? `to ${g.target}` : `race ${g.race}`}`;
}

/** The custom game tile for Table Games (drawn, not a picture): name + its own rack diagram. */
export function customTileHTML(g) {
  return `<button type="button" class="tgTile tgCustom" data-action="go" data-href="#tgame/${esc(g.id)}" data-game="${esc(g.id)}" data-custom-tile>
    <span class="tgcArt">${rackSVG(g, { tight: true, className: 'table-diagram rackDiagram tgcRack' })}</span>
    <span class="tgcName">${esc(g.name.toUpperCase())}</span>
    <span class="tgcSub">${esc(gameSummary(g))}</span>
  </button>`;
}

// ------------------------------------------------------------------------------------------- editor
function toggleRow(label, action, on, { disabled = false } = {}) {
  return `<div class="gsRow"><span class="gsLab">${esc(label)}</span><button type="button" class="chip gsTog${on ? ' active' : ''}" data-action="${action}"${disabled ? ' disabled' : ''}>${on ? 'ON' : 'OFF'}</button></div>`;
}
function stepper(label, action, value, text, lo, hi, { off = false } = {}) {
  return `<div class="gsRow${off ? ' is-off' : ''}"><span class="gsLab">${esc(label)}</span><span class="gsStep"><button type="button" class="tmStep" data-action="${action}" data-d="-1" aria-label="Less"${off || value <= lo ? ' disabled' : ''}>−</button><b data-cg="${action}">${esc(text)}</b><button type="button" class="tmStep" data-action="${action}" data-d="1" aria-label="More"${off || value >= hi ? ' disabled' : ''}>+</button></span></div>`;
}
const MODES = { swap: 'MOVE BALLS', foot: 'FOOT SPOT', pin: 'PIN FOR RANDOM' };
const MODE_HELP = {
  swap: 'Tap a ball, then tap another to swap them. You can also drag one ball onto another.',
  foot: 'Tap the ball that sits on the foot spot. The rack is placed around it.',
  pin: 'Tap balls to pin them (gold ring). RANDOM FILL keeps pinned balls where they are.'
};

export function createGameEditor(ctx, id) {
  const existing = id ? readCustomGame(id) : null;
  let g = existing ? { ...existing } : blankGame();
  let mode = 'swap';
  let sel = null;
  let askDelete = false;
  let msg = '';
  let alive = true;
  const missing = id && !existing;

  function rackCard() {
    return `<div class="card cgRack" data-rack-editor data-mode="${mode}">
      <span class="eyebrow">RACK</span>
      ${stepper('Balls', 'cg-count', g.count, String(g.count), 1, 15)}
      <div class="gsRow"><span class="gsLab">Shape</span><span class="chips">${Object.entries(LAYOUTS).map(([k, v]) => `<button type="button" class="chip${g.layout === k ? ' active' : ''}" data-action="cg-layout" data-v="${k}">${v.toUpperCase()}</button>`).join('')}</span></div>
      <div class="cgRackArt">${rackSVG(g, { selected: mode === 'swap' ? sel : null, className: 'table-diagram rackDiagram cgRackSvg' })}</div>
      <div class="chips cgModes">${Object.entries(MODES).map(([k, v]) => `<button type="button" class="chip${mode === k ? ' active' : ''}" data-action="cg-mode" data-v="${k}">${v}</button>`).join('')}</div>
      <p class="muted small" data-cg-help>${MODE_HELP[mode]}</p>
      <div class="chips"><button type="button" class="chip" data-action="cg-random">RANDOM FILL${g.pins.length ? ` · ${g.pins.length} PINNED` : ''}</button><button type="button" class="chip" data-action="cg-order">IN ORDER 1–${g.count}</button></div>
      <p class="muted small">Foot spot: ball ${g.order[g.foot]} (dashed gold ring).</p>
    </div>`;
  }
  function rulesCard() {
    const race = g.scoring === 'race';
    return `<div class="card cgRules">
      <span class="eyebrow">SCORING</span>
      <div class="gsRow"><span class="gsLab">Win by</span><span class="chips"><button type="button" class="chip${race ? ' active' : ''}" data-action="cg-scoring" data-v="race">RACE (RACKS)</button><button type="button" class="chip${!race ? ' active' : ''}" data-action="cg-scoring" data-v="points">POINTS</button></span></div>
      ${race ? stepper('Race to', 'cg-race', g.race, String(g.race), RANGES.race.min, RANGES.race.max) : stepper('Points to win', 'cg-target', g.target, String(g.target), TARGET_RANGE.min, TARGET_RANGE.max)}
      ${race ? `<div class="gsRow${g.gameBall ? '' : ' is-off'}"><span class="gsLab">Game ball</span><button type="button" class="chip gsTog${g.gameBall ? ' active' : ''}" data-action="cg-gb-toggle">${g.gameBall ? 'ON' : 'OFF'}</button><span class="gsStep"><button type="button" class="tmStep" data-action="cg-gb" data-d="-1" aria-label="Less"${!g.gameBall || g.gameBall <= 1 ? ' disabled' : ''}>−</button><b data-cg="cg-gb">${g.gameBall ? g.gameBall : '—'}</b><button type="button" class="tmStep" data-action="cg-gb" data-d="1" aria-label="More"${!g.gameBall || g.gameBall >= g.count ? ' disabled' : ''}>+</button></span></div>` : ''}
      ${toggleRow('Lowest ball first (rotation)', 'cg-rotation', g.rotation)}
      <span class="eyebrow">HOUSE RULES</span>
      ${toggleRow('Call shot', 'cg-callshot', g.callShot)}
      <div class="gsRow"><span class="gsLab">Foul: cue ball in hand</span><span class="chips"><button type="button" class="chip${g.foulBih === 'anywhere' ? ' active' : ''}" data-action="cg-bih" data-v="anywhere">ANYWHERE</button><button type="button" class="chip${g.foulBih === 'kitchen' ? ' active' : ''}" data-action="cg-bih" data-v="kitchen">BEHIND THE HEAD STRING</button></span></div>
      <div class="gsRow"><span class="gsLab">Who breaks</span><span class="chips">${Object.entries(BREAK_RULES).map(([k, v]) => `<button type="button" class="chip${g.breakRule === k ? ' active' : ''}" data-action="cg-break" data-v="${k}">${esc(v)}</button>`).join('')}</span></div>
      <span class="eyebrow">CLOCKS</span>
      ${clockRowsHTML(g.clock, {})}
    </div>`;
  }
  function render() {
    if (!alive) return;
    if (missing) {
      ctx.root.innerHTML = `<div class="playScreen tableMatch">${head('Create your own game', '')}<div class="playBody"><div class="card empty"><p>That game was deleted.</p><button type="button" class="bigBtn" data-action="go" data-href="#arcade">BACK TO TABLE GAMES</button></div></div></div>`;
      return;
    }
    const full = !existing && readAll().length >= MAX_GAMES;
    ctx.root.innerHTML = `<div class="playScreen tableMatch cgEditor" data-create-game="${existing ? 'edit' : 'new'}">
      ${head(existing ? 'Edit your game' : 'Create your own game', existing ? existing.name : 'New game')}
      <div class="playBody">
        <div class="card cgName">
          <label class="eyebrow" for="cgName">NAME</label>
          <input id="cgName" class="cgNameInput" type="text" maxlength="${NAME_MAX}" placeholder="Game name" value="${esc(g.name)}" autocomplete="off"/>
          <span class="eyebrow">START FROM</span>
          <div class="chips">${Object.entries(PRESETS).map(([k, p]) => `<button type="button" class="chip${g.preset === k ? ' active' : ''}" data-action="cg-preset" data-v="${k}">${p.label}</button>`).join('')}</div>
          <p class="muted small">A preset fills in the balls, rack, and rules. Change anything after.</p>
        </div>
        ${rackCard()}
        ${rulesCard()}
        <div class="card cgPreview"><span class="eyebrow">YOUR RULES</span><ul class="cgRuleList">${houseRuleLines(g).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>
        ${msg ? `<p class="ruleLine cgMsg">${esc(msg)}</p>` : ''}
        ${full ? `<p class="muted small">You have ${MAX_GAMES} games saved. Delete one to add another.</p>` : ''}
        <button type="button" class="bigBtn" data-action="cg-save" ${full ? 'disabled' : ''}>${existing ? 'SAVE CHANGES' : 'SAVE GAME'}</button>
        ${existing ? `<button type="button" class="bigBtn alt cgDelete${askDelete ? ' is-ask' : ''}" data-action="cg-delete">${askDelete ? 'TAP AGAIN TO DELETE THIS GAME' : 'DELETE GAME'}</button>` : ''}
        <button type="button" class="bigBtn alt" data-action="go" data-href="${existing ? `#tgame/${esc(existing.id)}` : '#arcade'}">CANCEL</button>
      </div>
    </div>`;
    bind();
  }
  function tapSlot(slot) {
    if (slot == null || slot < 0) return;
    if (mode === 'foot') { g = { ...g, foot: slot }; }
    else if (mode === 'pin') { g = { ...g, pins: g.pins.includes(slot) ? g.pins.filter((p) => p !== slot) : g.pins.concat(slot) }; }
    else if (sel == null) sel = slot;
    else { g = { ...g, ...swapSlots(g, sel, slot) }; sel = null; }
    render();
  }
  const slotOf = (node) => {
    const b = node?.closest?.('[data-n]');
    if (!b) return null;
    const i = g.order.indexOf(Number(b.dataset.n));
    return i >= 0 ? i : null;
  };
  function bind() {
    const name = ctx.root.querySelector('#cgName');
    name?.addEventListener('input', () => { g = { ...g, name: name.value }; });
    const svg = ctx.root.querySelector('.cgRackSvg');
    if (!svg) return;
    let down = null;
    let dragged = false;
    svg.addEventListener('pointerdown', (e) => { down = slotOf(e.target); dragged = false; });
    svg.addEventListener('pointerup', (e) => {
      if (mode !== 'swap' || down == null) return;
      const over = slotOf(document.elementFromPoint(e.clientX, e.clientY));
      if (over != null && over !== down) {
        dragged = true;
        sel = null;
        g = { ...g, ...swapSlots(g, down, over) };
        down = null;
        render();
      }
    });
    svg.addEventListener('click', (e) => {
      if (dragged) { dragged = false; return; }
      tapSlot(slotOf(e.target));
    });
  }
  function onAction(action, el) {
    if (!action.startsWith('cg-') && !action.startsWith('gs-')) return false;
    msg = '';
    if (action !== 'cg-delete') askDelete = false;
    const d = Number(el?.dataset?.d) || 0;
    const v = el?.dataset?.v;
    if (action === 'gs-toggle' || action === 'gs-step') {
      const c = clockSettingAction(g.clock, action, el);
      if (c) g = { ...g, clock: c };
    } else if (action === 'cg-preset') { g = applyPreset(g, v); sel = null; }
    else if (action === 'cg-count') { g = { ...g, ...reshape(g, { count: g.count + d }), preset: 'none' }; g.gameBall = g.gameBall > g.count ? g.count : g.gameBall; sel = null; }
    else if (action === 'cg-layout') { g = { ...g, ...reshape(g, { layout: v }) }; sel = null; }
    else if (action === 'cg-mode') { mode = Object.prototype.hasOwnProperty.call(MODES, v) ? v : 'swap'; sel = null; }
    else if (action === 'cg-random') { g = { ...g, ...randomFill(g) }; sel = null; }
    else if (action === 'cg-order') { g = { ...g, order: sequential(g.count) }; sel = null; }
    else if (action === 'cg-scoring') { g = { ...g, scoring: v === 'points' ? 'points' : 'race', gameBall: v === 'points' ? 0 : g.gameBall }; }
    else if (action === 'cg-race') g = { ...g, race: clampN(g.race + d, RANGES.race.min, RANGES.race.max, g.race) };
    else if (action === 'cg-target') g = { ...g, target: clampN(g.target + d * TARGET_RANGE.step, TARGET_RANGE.min, TARGET_RANGE.max, g.target) };
    else if (action === 'cg-gb-toggle') g = { ...g, gameBall: g.gameBall ? 0 : g.count };
    else if (action === 'cg-gb') g = { ...g, gameBall: clampN(g.gameBall + d, 1, g.count, g.gameBall) };
    else if (action === 'cg-rotation') g = { ...g, rotation: !g.rotation };
    else if (action === 'cg-callshot') g = { ...g, callShot: !g.callShot };
    else if (action === 'cg-bih') g = { ...g, foulBih: v === 'kitchen' ? 'kitchen' : 'anywhere' };
    else if (action === 'cg-break') g = { ...g, breakRule: Object.prototype.hasOwnProperty.call(BREAK_RULES, v) ? v : g.breakRule };
    else if (action === 'cg-save') {
      const nameEl = ctx.root.querySelector('#cgName');
      if (nameEl) g = { ...g, name: nameEl.value };
      if (!String(g.name || '').trim()) { msg = 'Give your game a name first.'; render(); return true; }
      const saved = saveCustomGame(g);
      if (!saved) { msg = `You can save up to ${MAX_GAMES} games.`; render(); return true; }
      ctx.go(existing ? `#tgame/${saved.id}` : '#arcade');
      return true;
    } else if (action === 'cg-delete' && existing) {
      if (!askDelete) { askDelete = true; render(); return true; }
      deleteCustomGame(existing.id);
      ctx.go('#arcade');
      return true;
    }
    render();
    return true;
  }
  return { render, onAction, destroy() { alive = false; } };
}

// ------------------------------------------------------------------------------------------- play
export function freshCustomMatch() {
  return { you: 0, opp: 0, racksYou: 0, racksOpp: 0, down: [], turn: 'you', lag: 'you', breaker: 'you', racks: 0, winner: null, note: '', rackDone: false };
}
/** Lowest ball still on the table (rotation). */
export const lowestUp = (g, m) => sequential(g.count).find((b) => !m.down.includes(b)) ?? null;
const other = (w) => (w === 'you' ? 'opp' : 'you');
function nextBreaker(g, m, winner) {
  if (g.breakRule === 'winner') return winner;
  if (g.breakRule === 'alternate') return other(m.breaker);
  return m.breaker;
}
/** Pure match step. actions: lag, pocket(n), miss, foul, rack(who). */
export function applyCustom(g, state, action, arg) {
  const m = { ...state, down: state.down.slice() };
  if (m.winner) return m;
  m.note = '';
  const finishRack = (who) => {
    if (who === 'you') m.racksYou += 1; else m.racksOpp += 1;
    m.racks += 1;
    m.breaker = nextBreaker(g, m, who);
    m.turn = m.breaker;
    m.down = [];
    m.rackDone = false;
    m.note = `${who === 'you' ? 'You' : 'Opponent'} won the rack.`;
    if (m.racksYou >= g.race) m.winner = 'you';
    else if (m.racksOpp >= g.race) m.winner = 'opp';
  };
  if (action === 'lag') {
    if (m.racks === 0 && !m.down.length && !m.you && !m.opp) {
      m.lag = arg === 'opp' ? 'opp' : 'you';
      m.breaker = m.lag;
      m.turn = m.lag;
    }
    return m;
  }
  if (action === 'pocket') {
    const n = Number(arg);
    if (!(n >= 1 && n <= g.count) || m.down.includes(n) || m.rackDone) return m;
    m.down.push(n);
    if (g.scoring === 'points') {
      m[m.turn] += 1;
      if (m[m.turn] >= g.target) { m.winner = m.turn; return m; }
      if (m.down.length >= g.count) { m.down = []; m.racks += 1; m.note = `Every ball is down. Re-rack all ${g.count}. The shooter continues.`; }
      return m;
    }
    if (g.gameBall && n === g.gameBall) { finishRack(m.turn); return m; }
    if (m.down.length >= g.count) { m.rackDone = true; m.note = 'Every ball is down. Tap who won the rack.'; }
    return m;
  }
  if (action === 'miss') { m.turn = other(m.turn); return m; }
  if (action === 'foul') {
    m.turn = other(m.turn);
    m.note = g.foulBih === 'kitchen' ? 'Foul. Cue ball in hand behind the head string.' : 'Foul. Cue ball in hand anywhere.';
    return m;
  }
  if (action === 'rack' && g.scoring === 'race') { finishRack(arg === 'opp' ? 'opp' : 'you'); return m; }
  return m;
}

export function createCustomPlay(ctx, id) {
  const g = readCustomGame(id);
  if (!g) {
    return {
      render() { ctx.root.innerHTML = `<div class="playScreen tableMatch">${head('Your game', '')}<div class="playBody"><div class="card empty"><p>That game was deleted.</p><button type="button" class="bigBtn" data-action="go" data-href="#arcade">BACK TO TABLE GAMES</button></div></div></div>`; },
      onAction() { return false; },
      destroy() {}
    };
  }
  let m = freshCustomMatch();
  const hist = [];
  const kit = settingsKit(ctx, 'custom', {
    started: () => !!(m.racks || m.down.length || m.you || m.opp || hist.length),
    fixed: g.scoring === 'points' ? { target: g.target, clock: g.clock } : { race: g.race, breakRule: g.breakRule, clock: g.clock },
    editHref: `#tgame/${g.id}/edit`
  });
  let alive = true;
  const iv = setInterval(() => { if (alive) kit.tick(render); }, 200);
  function go(action, arg) {
    hist.push(m);
    if (hist.length > 200) hist.shift();
    const racks = m.racks;
    m = applyCustom(g, m, action, arg);
    if (m.racks !== racks) kit.newRack();
    render();
  }
  function render() {
    if (!alive) return;
    const pts = g.scoring === 'points';
    const low = g.rotation ? lowestUp(g, m) : null;
    const done = !!m.winner;
    const dis = done ? 'disabled' : '';
    const balls = g.order.slice().sort((a, b) => a - b).map((n) => {
      const isDown = m.down.includes(n);
      return `<button type="button" class="cgBall b${n > 8 ? n - 8 : n}${n > 8 ? ' stripe' : ''}${isDown ? ' is-down' : ''}${low === n ? ' is-low' : ''}${g.gameBall === n ? ' is-game' : ''}" data-action="cgp-pocket" data-v="${n}" ${isDown || done || m.rackDone ? 'disabled' : ''}><span>${n}</span></button>`;
    }).join('');
    const who = m.turn === 'you' ? 'Your shot.' : 'Opponent’s shot.';
    const brk = g.breakRule !== 'off';
    const fresh = !m.racks && !m.down.length && !m.you && !m.opp;
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="custom" data-custom-game="${esc(g.id)}">
      ${head(g.name, pts ? `to ${g.target}` : `Race to ${g.race}`)}
      <div class="playBody">
        ${kit.html()}
        <details class="card cgPlayRack"><summary><span class="eyebrow">RACK AND RULES</span><b>${esc(gameSummary(g))}</b></summary>
          <div class="cgRackArt">${rackSVG(g, { className: 'table-diagram rackDiagram' })}</div>
          <ul class="cgRuleList">${houseRuleLines(g).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        </details>
        ${brk && fresh ? `<div class="chips"><button type="button" class="chip${m.lag === 'you' ? ' active' : ''}" data-action="cgp-lag" data-v="you">LAG WINNER: YOU BREAK</button><button type="button" class="chip${m.lag === 'opp' ? ' active' : ''}" data-action="cgp-lag" data-v="opp">LAG WINNER: OPPONENT BREAKS</button></div>` : ''}
        <p class="muted small">${who}${brk ? ` ${m.breaker === 'you' ? 'You break this rack.' : 'Opponent breaks this rack.'}` : ''}${g.callShot ? ' Call the ball and the pocket.' : ''}${low ? ` Lowest ball: ${low}.` : ''}</p>
        ${m.note ? `<p class="ruleLine" data-cg-note>${esc(m.note)}</p>` : ''}
        <p class="muted small">Tap a ball when it is pocketed${pts ? '. Each ball is 1 point for the shooter' : g.gameBall ? `. The ${g.gameBall} wins the rack` : ''}.</p>
        <div class="cgBalls">${balls}</div>
        <div class="ghostScore tmScore">${pts
          ? `<div><b>${m.you}</b><span>YOU</span></div><em>to ${g.target}</em><div><b>${m.opp}</b><span>OPPONENT</span></div>`
          : `<div><b>${m.racksYou}</b><span>YOU</span></div><em>race ${g.race}</em><div><b>${m.racksOpp}</b><span>OPPONENT</span></div>`}</div>
        ${done ? `<div class="resultPanel pass inline"><h1>${m.winner === 'you' ? 'YOU WIN' : 'OPPONENT WINS'}</h1><p class="muted">${pts ? `${m.you}–${m.opp}` : `${m.racksYou}–${m.racksOpp} in racks`}</p></div><button type="button" class="bigBtn alt" data-action="cgp-new">NEW MATCH</button>` : ''}
      </div>
      <div class="resultBar">
        <button type="button" class="rb miss" data-action="cgp-miss" ${dis}><b>MISS</b><small>TURN PASSES</small></button>
        <button type="button" class="rb alt" data-action="cgp-foul" ${dis}><b>FOUL</b><small>${g.foulBih === 'kitchen' ? 'IN HAND · KITCHEN' : 'IN HAND · ANYWHERE'}</small></button>
        ${pts ? '' : `<button type="button" class="rb s3" data-action="cgp-rack" data-v="you" ${dis}><b>YOU WON THE RACK</b><small>+1 RACK</small></button><button type="button" class="rb s3" data-action="cgp-rack" data-v="opp" ${dis}><b>OPPONENT WON THE RACK</b><small>+1 RACK</small></button>`}
        <button type="button" class="rb undo wide" data-action="cgp-undo" ${hist.length ? '' : 'disabled'}><b>UNDO</b></button>
      </div>
    </div>`;
    kit.bind();
  }
  function onAction(action, el) {
    if (kit.action(action, el)) { render(); return true; }
    if (!action.startsWith('cgp-')) return false;
    const v = el?.dataset?.v;
    if (action === 'cgp-undo') { if (hist.length) m = hist.pop(); render(); return true; }
    if (action === 'cgp-new') { m = freshCustomMatch(); hist.length = 0; kit.newRack(); render(); return true; }
    if (action === 'cgp-lag') { go('lag', v); return true; }
    if (action === 'cgp-pocket') { go('pocket', v); return true; }
    if (action === 'cgp-miss') { go('miss'); return true; }
    if (action === 'cgp-foul') { go('foul'); return true; }
    if (action === 'cgp-rack') { go('rack', v); return true; }
    return true;
  }
  return { render, onAction, destroy() { alive = false; clearInterval(iv); } };
}
