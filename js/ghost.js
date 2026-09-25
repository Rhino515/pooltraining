/**
 * Ghost — race the Ghost.
 *
 * Rotation Ghost (3-ball … 9-ball): balls are pocketed in numerical order (1, 2, 3 …). Break, ball in hand,
 * run every ball in order = your rack; a miss, foul or shooting out of order = Ghost's rack.
 * Unlocks: beating the N-ball Ghost in a race to 3 or longer opens N+1 balls (legacy unlocks are kept as a floor).
 *
 * 8-Ball Ghost: your group (1–7 balls, chosen by level) plus the 8. Ball in hand, pocket your group in any order,
 * then the 8 in a called pocket. Miss, scratch or 8 early = Ghost's rack.
 *   Pro: full 15-ball rack and you break. Balls made on the break stay down. The table is open after the break
 *   (choose solids or stripes), then ball in hand anywhere and run your group + the 8.
 *   House rules: the 8 on the break = you win the rack; scratch on the break = take ball in hand and run out, no penalty.
 * 8-Ball Ghost wins count as general Ghost wins; they never satisfy an "N-ball Ghost" career requirement.
 *
 * Matches auto-save when a player reaches the race; UNDO LAST RACK reverts the last step, including a finished
 * match (the saved match is removed).
 */
import { undoGhostRack as undoRackPure, ghostRackResult } from './storage.js';
import { maxGhostBalls } from './games/engine.js';
import { esc } from './games/recipe.js';

export const GHOST_BALL_OPTIONS = [3, 4, 5, 6, 7, 8, 9];
export const RACE_OPTIONS = [3, 5, 7, 9];
export const EIGHT_LEVELS = [
  { id: 'beginner', label: 'Beginner', group: 3, short: '3 + 8', desc: 'Ball in hand · 3 balls + the 8' },
  { id: 'intermediate', label: 'Intermediate', group: 5, short: '5 + 8', desc: 'Ball in hand · 5 balls + the 8' },
  { id: 'advanced', label: 'Advanced', group: 7, short: '7 + 8', desc: 'Ball in hand, no break · 7 balls + the 8' },
  { id: 'pro', label: 'Pro', group: 7, short: 'Break 15', desc: 'Full rack · you break, then ball in hand' },
  { id: 'custom', label: 'Custom', group: null, short: 'Pick', desc: 'Choose 1–7 balls + the 8' }
];

export function maxUnlockedBalls(state) {
  return maxGhostBalls(state);
}
const isEight = (s) => s && s.mode === 'eight';
const clampGroup = (n) => Math.max(1, Math.min(7, Math.round(Number(n) || 3)));

/** Rotation Ghost session (unchanged shape) */
export function newGhostSession(balls = 3, race = 5) {
  return { id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, balls, race, you: 0, ghost: 0, log: [], startedAt: new Date().toISOString(), savedMatchId: null };
}
/** 8-Ball Ghost session. level: beginner|intermediate|advanced|pro|custom; group: your balls (1–7) + the 8 */
export function newEightSession(level = 'beginner', race = 5, group = null) {
  const L = EIGHT_LEVELS.find((l) => l.id === level) || EIGHT_LEVELS[0];
  const g = clampGroup(L.group ?? group ?? 3);
  const s = { ...newGhostSession(0, race), mode: 'eight', level: L.id, group: g, breaks: [] };
  if (L.id === 'pro') { s.phase = 'break'; s.breakMade = 0; }
  return s;
}

export function matchOver(s) {
  return !!s && (s.you >= s.race || s.ghost >= s.race);
}
/** Short label for a session or saved match */
export function ghostLabel(m) {
  if (!isEight(m)) return `${m.balls}-Ball`;
  return m.level === 'pro' ? '8-Ball Ghost · Pro' : `8-Ball Ghost · ${m.group} + 8`;
}
export function matchXP(m) {
  if (!m.won) return 15;
  if (isEight(m)) return 80 + (m.group + 1) * 15 + (m.level === 'pro' ? 30 : 0);
  return 80 + m.balls * 15;
}

function matchRecord(s) {
  const m = { id: s.id, balls: s.balls, you: s.you, ghost: s.ghost, race: s.race, won: s.you > s.ghost, log: s.log.slice(), date: new Date().toISOString(), resultSource: 'manual' };
  if (isEight(s)) Object.assign(m, { mode: 'eight', level: s.level, group: s.group, breaks: (s.breaks || []).slice() });
  return m;
}

/**
 * Record a rack ('W' player runout / 'L' ghost). Pure: returns { state, session, ended }.
 * Pro 8-ball: pass {made, eight, scratch} as `brk` for the break of this rack (defaults to the pending break).
 */
export function applyRack(state, session, result, brk = null) {
  if (!session || matchOver(session)) return { state, session, ended: false };
  let s = ghostRackResult(session, result);
  if (isEight(session)) {
    const b = session.level === 'pro' ? brk || { made: session.breakMade || 0, eight: false, scratch: !!session.breakScratch } : null;
    s = { ...s, breaks: [...(session.breaks || []), b] };
    if (session.level === 'pro') s = { ...s, phase: 'break', breakMade: 0, breakScratch: false };
  }
  if (!matchOver(s)) return { state: { ...state, activeGhost: s }, session: s, ended: false };
  const m = matchRecord(s);
  const s2 = { ...s, savedMatchId: m.id };
  const xp = (state.xp || 0) + matchXP(m);
  return { state: { ...state, xp, ghostMatches: [...(state.ghostMatches || []), m], activeGhost: s2 }, session: s2, ended: true, match: m };
}

/**
 * Pro 8-ball: the break result. kind: 'ok' (→ ball in hand, run-out phase), 'eight' (rack won),
 * 'scratch' (house rule: no penalty — re-spot as needed, ball in hand, run-out phase; the scratch is recorded).
 */
export function applyBreak(state, session, kind, made = null) {
  if (!isEight(session) || session.level !== 'pro' || session.phase !== 'break' || matchOver(session)) return { state, session, ended: false };
  const m = Math.max(0, Math.min(15, Math.round(made ?? session.breakMade ?? 0)));
  if (kind === 'eight') return applyRack(state, session, 'W', { made: Math.max(1, m), eight: true, scratch: false });
  const s = { ...session, phase: 'run', breakMade: m, breakScratch: kind === 'scratch' };
  return { state: { ...state, activeGhost: s }, session: s, ended: false };
}
/** Pro 8-ball: change the "made on the break" count (optional) */
export function setBreakMade(state, session, delta) {
  if (!isEight(session) || session.level !== 'pro' || session.phase !== 'break') return { state, session };
  const s = { ...session, breakMade: Math.max(0, Math.min(14, (session.breakMade || 0) + delta)) };
  return { state: { ...state, activeGhost: s }, session: s };
}

/** Undo the last step; if the match had ended, the saved match is removed too. Pro: run-out phase → back to the break. */
export function applyUndo(state, session) {
  if (!session) return { state, session };
  if (isEight(session) && session.level === 'pro' && session.phase === 'run') {
    const s = { ...session, phase: 'break', breakScratch: false };
    return { state: { ...state, activeGhost: s }, session: s };
  }
  if (!session.log.length) return { state, session };
  let ghostMatches = state.ghostMatches || [];
  let xp = state.xp || 0;
  if (session.savedMatchId) {
    const m = ghostMatches.find((x) => x.id === session.savedMatchId);
    ghostMatches = ghostMatches.filter((x) => x.id !== session.savedMatchId);
    if (m) xp = Math.max(0, xp - matchXP(m));
  }
  let s = { ...undoRackPure(session), savedMatchId: null };
  if (isEight(session)) {
    const breaks = (session.breaks || []).slice(0, -1);
    const last = (session.breaks || [])[session.breaks.length - 1];
    s = { ...s, breaks };
    if (session.level === 'pro') s = { ...s, phase: last && !last.eight ? 'run' : 'break', breakMade: last?.made || 0, breakScratch: !!last?.scratch };
  }
  return { state: { ...state, ghostMatches, xp, activeGhost: s }, session: s };
}

export function ghostStats(state) {
  const ms = state.ghostMatches || [];
  const won = ms.filter((m) => m.won).length;
  const row = (l) => {
    const w = l.filter((m) => m.won).length;
    const racks = l.reduce((a, m) => a + (m.log || []).length, 0);
    const rw = l.reduce((a, m) => a + (m.log || []).filter((x) => x === 'W').length, 0);
    return { played: l.length, won: w, pct: l.length ? Math.round((100 * w) / l.length) : 0, rackPct: racks ? Math.round((100 * rw) / racks) : 0 };
  };
  const byBalls = GHOST_BALL_OPTIONS.map((n) => ({ balls: n, ...row(ms.filter((m) => !isEight(m) && m.balls === n)) }));
  const eight = ms.filter(isEight);
  const byEight = EIGHT_LEVELS.map((L) => ({ level: L.id, label: L.label, ...row(eight.filter((m) => m.level === L.id)) }));
  return { played: ms.length, won, pct: ms.length ? Math.round((100 * won) / ms.length) : 0, byBalls, eight: row(eight), byEight };
}

// ------------------------------------------------------------------------------------ rules text
const orderList = (n) => Array.from({ length: n }, (_, i) => i + 1).join(', ');
/** One-line rotation rule: "Run the balls in order: 1, 2, 3. Miss or shoot out of order = Ghost wins the rack." */
export function rotationRule(n) {
  return `Run the balls in order: ${orderList(n)}. Miss, foul or shoot out of order = Ghost wins the rack.`;
}
export function eightRule(level, group) {
  if (level === 'pro') return 'Full 15-ball rack — you break. Table is open: pick solids or stripes, take ball in hand anywhere, run your 7 in any order, then the 8 in a called pocket.';
  return `Ball in hand. Pocket your ${group} ball${group === 1 ? '' : 's'} in any order, then the 8 in a called pocket. Miss, scratch or 8 early = Ghost wins the rack.`;
}
export function rulesSheetHTML(session) {
  if (isEight(session)) {
    const pro = session.level === 'pro';
    return `<div class="eyebrow">RULES · 8-BALL GHOST</div><h2 class="sheetTitle">${esc(ghostLabel(session))}</h2>
      <ol class="rulesList">
        ${pro ? `<li>Rack all 15 balls. <b>You break.</b></li><li>Balls made on the break stay down. Log how many (optional).</li><li><b>House rules:</b> 8 on the break = you win the rack. Scratch on the break: take ball in hand and run out, no penalty (re-spot as needed).</li><li>The table is open after the break — choose <b>solids or stripes</b>, then take <b>ball in hand anywhere</b>.</li>` : `<li>Put your ${session.group} ball${session.group === 1 ? '' : 's'} (solids 1–${session.group}) and the 8 on the table${session.level === 'advanced' ? ' — no break' : ''}.</li><li>Take <b>ball in hand</b> anywhere.</li>`}
        <li>Pocket all of your group in <b>any order</b>, then the <b>8 last in a called pocket</b>.</li>
        <li>Clear your group + the 8 = <b>your rack</b>.</li>
        <li>Miss, scratch, 8 early${pro ? ' or 8 in the wrong pocket' : ' or in an uncalled pocket'} = <b>Ghost wins the rack</b>.</li>
      </ol><button type="button" class="bigBtn alt" data-action="sheet-close">GOT IT</button>`;
  }
  const n = session.balls;
  return `<div class="eyebrow">RULES · ${n}-BALL GHOST</div><h2 class="sheetTitle">Balls in numerical order</h2>
    <ol class="rulesList">
      <li>Rack balls 1–${n} and break. Take ball in hand after the break.</li>
      <li>Pocket the balls in order, lowest number first: <b>${orderList(n)}</b>.</li>
      <li>Every ball down in order = <b>your rack</b>.</li>
      <li>A miss, a foul (scratch) or pocketing a ball out of order = <b>Ghost wins the rack</b>.</li>
    </ol><button type="button" class="bigBtn alt" data-action="sheet-close">GOT IT</button>`;
}

// ------------------------------------------------------------------------------------ screens
export function renderGhostLobby(state, preset = {}) {
  const max = maxUnlockedBalls(state);
  const st = ghostStats(state);
  const active = state.activeGhost && !matchOver(state.activeGhost) ? state.activeGhost : null;
  const mode = preset.mode === 'eight' ? 'eight' : 'rotation';
  const selBalls = preset.balls && preset.balls <= max ? preset.balls : Math.min(max, preset.balls || 3);
  const selRace = preset.race || 5;
  const lvl = EIGHT_LEVELS.find((l) => l.id === preset.level) || EIGHT_LEVELS[0];
  const grp = clampGroup(lvl.group ?? preset.group ?? 3);
  const modeTabs = `<div class="ghostModes" role="tablist"><button type="button" class="chip${mode === 'rotation' ? ' active' : ''}" data-action="ghost-mode" data-v="rotation" role="tab">3- to 9-Ball</button><button type="button" class="chip${mode === 'eight' ? ' active' : ''}" data-action="ghost-mode" data-v="eight" role="tab">8-Ball Ghost</button></div>`;
  const race = `<div class="eyebrow">RACE TO</div>
      <div class="racePick">${RACE_OPTIONS.map((r) => `<button type="button" class="chip${r === selRace ? ' active' : ''}" data-action="ghost-race" data-v="${r}">${r}</button>`).join('')}</div>`;
  const setup = mode === 'rotation'
    ? `<div class="card ghostSetup" data-mode="rotation">
      <div class="eyebrow">BALLS</div>
      <div class="ballPick">${GHOST_BALL_OPTIONS.map((n) => `<button type="button" class="ballOpt${n === selBalls ? ' active' : ''}${n > max ? ' locked' : ''}" data-action="ghost-balls" data-v="${n}" ${n > max ? 'disabled' : ''}><b>${n}</b><small>${n > max ? '🔒' : 'ball'}</small></button>`).join('')}</div>
      <p class="muted small">${max < 9 ? `Beat the ${max}-ball Ghost in a race to 3 or longer to unlock ${max + 1}-ball.` : 'Every ball count unlocked.'}</p>
      <div class="ruleBox" data-rule="order"><b>RULES</b> ${esc(rotationRule(selBalls))}</div>
      ${race}
      <button type="button" class="bigBtn" data-action="ghost-start">START ${selBalls}-BALL · RACE TO ${selRace}</button>
    </div>`
    : `<div class="card ghostSetup" data-mode="eight">
      <div class="eyebrow">SKILL LEVEL</div>
      <div class="levelPick">${EIGHT_LEVELS.map((l) => `<button type="button" class="lvlOpt${l.id === lvl.id ? ' active' : ''}" data-action="ghost-level" data-v="${l.id}"><b>${l.label}</b><small>${l.short}</small></button>`).join('')}</div>
      ${lvl.id === 'custom' ? `<div class="eyebrow">YOUR BALLS (+ THE 8)</div><div class="ballPick">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button type="button" class="ballOpt${n === grp ? ' active' : ''}" data-action="ghost-group" data-v="${n}"><b>${n}</b><small>+ 8</small></button>`).join('')}</div>` : ''}
      <p class="muted small">${esc(lvl.id === 'custom' ? `Ball in hand · ${grp} ball${grp === 1 ? '' : 's'} + the 8` : lvl.desc)}</p>
      <div class="ruleBox" data-rule="eight"><b>RULES</b> ${esc(eightRule(lvl.id, grp))}${lvl.id === 'pro' ? ' <b>House rules:</b> 8 on the break = you win the rack. Scratch on the break: take ball in hand and run out, no penalty. After the break: miss, scratch, or 8 early / wrong pocket = Ghost wins the rack.' : ''}</div>
      ${race}
      <button type="button" class="bigBtn" data-action="ghost-start8">START 8-BALL · ${lvl.id === 'pro' ? 'PRO' : `${grp} + 8`} · RACE TO ${selRace}</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#sim/eight/${lvl.id === 'pro' ? 'pro' : grp}">SET UP IN SHOT SIMULATOR</button>
    </div>`;
  const recordRows = mode === 'rotation'
    ? `<div class="card history"><div class="historyRow head"><span>Balls</span><span>Played</span><span>Won</span><span>Win %</span><span>Rack %</span></div>${st.byBalls.map((b) => `<div class="historyRow"><span>${b.balls}-ball</span><span>${b.played}</span><span>${b.won}</span><span>${b.pct}%</span><span>${b.rackPct}%</span></div>`).join('')}</div>`
    : `<div class="card history"><div class="historyRow head"><span>8-Ball</span><span>Played</span><span>Won</span><span>Win %</span><span>Rack %</span></div>${st.byEight.map((b) => `<div class="historyRow"><span>${b.label}</span><span>${b.played}</span><span>${b.won}</span><span>${b.pct}%</span><span>${b.rackPct}%</span></div>`).join('')}</div>`;
  return `<div class="title"><span class="eyebrow">ARCADE · GHOST</span><h1>Race the Ghost</h1><p>Clear the table = your rack. Any miss, foul or failed runout = Ghost's rack.</p></div>
    ${active ? `<div class="card resumeCard"><b>Match in progress</b><p class="muted">${esc(ghostLabel(active))} · race to ${active.race} · ${active.you}–${active.ghost}</p><button type="button" class="bigBtn" data-action="go" data-href="#ghostmatch">RESUME MATCH</button></div>` : ''}
    ${modeTabs}
    ${setup}
    <h2>Your Ghost record</h2>
    <div class="card stats ghostStats"><div><b data-ghost-pct>${st.pct}%</b><span>WIN RATE</span></div><div><b>${st.won}</b><span>MATCHES WON</span></div><div><b>${st.played}</b><span>PLAYED</span></div></div>
    ${recordRows}
    <h2>Recent matches</h2>
    <div class="card history" id="ghostHistory">${(state.ghostMatches || []).slice(-8).reverse().map((m) => `<div class="historyRow" data-match="${esc(m.id)}"><span>${esc(ghostLabel(m))} · race ${m.race}</span><span class="${m.won ? 'green' : 'red'}">${m.won ? 'WON' : 'LOST'} ${m.you}–${m.ghost}</span><span class="muted">${new Date(m.date).toLocaleDateString()}</span></div>`).join('') || '<p class="muted">No matches yet.</p>'}</div>`;
}

function rackChip(g, x, i) {
  const b = isEight(g) && g.level === 'pro' ? (g.breaks || [])[i] : null;
  const note = b ? (b.eight ? ' · 8 ON BREAK' : `${b.made ? ` · ${b.made} ON BREAK` : ''}${b.scratch ? ' · BREAK SCRATCH' : ''}`) : '';
  return `<span class="${x === 'W' ? 'win' : 'loss'}">R${i + 1} ${x === 'W' ? 'RUNOUT' : 'GHOST'}${note}</span>`;
}

export function renderGhostMatch(state) {
  const g = state.activeGhost;
  if (!g) return `<div class="card empty"><p>No match in progress.</p><button type="button" class="bigBtn" data-action="go" data-href="#ghost">SET UP A MATCH</button></div>`;
  const over = matchOver(g);
  const won = g.you > g.ghost;
  const eight = isEight(g);
  const pro = eight && g.level === 'pro';
  const breakPhase = pro && g.phase === 'break' && !over;
  const rackNo = g.log.length + 1;
  let rule;
  if (!eight) rule = `<p class="instructions ruleLine" data-rule="order"><b>Rack ${rackNo}:</b> break, then ball in hand. ${esc(rotationRule(g.balls))}</p>`;
  else if (breakPhase) rule = `<p class="instructions ruleLine" data-rule="break"><b>Rack ${rackNo} · Break:</b> full 15-ball rack, you break. Balls made stay down. 8 on the break = you win the rack. Scratch on the break: take ball in hand and run out, no penalty.</p>`;
  else if (pro) rule = `<p class="instructions ruleLine" data-rule="eight"><b>Rack ${rackNo} · Run-out:</b> table open — pick solids or stripes, ball in hand anywhere. Run your 7 in any order, then the 8 in a called pocket. Miss, scratch, or 8 early / wrong pocket = Ghost wins.</p>`;
  else rule = `<p class="instructions ruleLine" data-rule="eight"><b>Rack ${rackNo}:</b> ${esc(eightRule(g.level, g.group))}</p>`;
  let bar;
  if (over) bar = '';
  else if (breakPhase) {
    bar = `<div class="breakMade"><span>Made on the break <small>(optional)</small></span><button type="button" class="spBtn" data-action="ghost-bmade" data-v="-1" aria-label="Fewer">−</button><b data-bmade>${g.breakMade || 0}</b><button type="button" class="spBtn" data-action="ghost-bmade" data-v="1" aria-label="More">+</button></div>
      <button type="button" class="rb s3 wide" data-action="ghost-break" data-v="ok"><b>BALL IN HAND ›</b><small>BREAK DONE · RUN OUT</small></button>
      <button type="button" class="rb pot" data-action="ghost-break" data-v="eight"><b>8 ON BREAK</b><small>YOU WIN THE RACK</small></button>
      <button type="button" class="rb alt" data-action="ghost-break" data-v="scratch"><b>SCRATCHED ON BREAK</b><small>BALL IN HAND · KEEP GOING</small></button>`;
  } else if (eight) {
    bar = `<button type="button" class="rb s3" data-action="ghost-rack" data-v="W"><b>RUNOUT</b><small>GROUP + 8 IN CALLED POCKET</small></button><button type="button" class="rb miss" data-action="ghost-rack" data-v="L"><b>MISS / SCRATCH</b><small>OR 8 EARLY · GHOST WINS</small></button>`;
  } else {
    bar = `<button type="button" class="rb s3" data-action="ghost-rack" data-v="W"><b>RUNOUT</b><small>ALL IN ORDER · YOU WIN</small></button><button type="button" class="rb miss" data-action="ghost-rack" data-v="L"><b>MISS / FOUL</b><small>OR OUT OF ORDER · GHOST</small></button>`;
  }
  const canUndo = g.log.length || (pro && g.phase === 'run');
  return `<div class="playScreen ghostMatch" data-over="${over ? 1 : 0}" data-mode="${eight ? 'eight' : 'rotation'}"${pro ? ` data-phase="${esc(g.phase || 'break')}"` : ''}>
    <div class="playHead"><button type="button" class="phBack" data-action="go" data-href="#ghost" aria-label="Back">‹</button><div class="phTitle"><small>GHOST</small><b>${esc(ghostLabel(g))} · Race to ${g.race}</b></div><div class="phStatus"><button type="button" class="rulesBtn" data-action="ghost-rules">RULES</button><span class="score">R${g.log.length + (over ? 0 : 1)}</span></div></div>
    <div class="playBody">
      <div class="ghostScore"><div><b data-you>${g.you}</b><span>YOU</span></div><em>—</em><div><b data-ghost>${g.ghost}</b><span>GHOST</span></div></div>
      ${over ? `<div class="resultPanel ${won ? 'pass' : 'fail'} inline" data-result="${won ? 'pass' : 'fail'}"><h1>${won ? 'YOU WIN' : 'GHOST WINS'} ${g.you}–${g.ghost}</h1><p class="muted">Match saved to history. Tapped the wrong button? UNDO LAST RACK reopens the match.</p><div class="resultBtns"><button type="button" class="bigBtn" data-action="ghost-again">REMATCH</button><button type="button" class="bigBtn alt" data-action="go" data-href="#ghost">GHOST HOME</button></div></div>`
        : rule}
      <div class="racklog">${g.log.map((x, i) => rackChip(g, x, i)).join('')}${pro && g.phase === 'run' && !over ? `<span class="pend">R${rackNo} BREAK${g.breakMade ? ` · ${g.breakMade} MADE` : ''}${g.breakScratch ? ' · SCRATCH, BALL IN HAND' : ''} ✓</span>` : ''}</div>
    </div>
    <div class="resultBar ghostBar${breakPhase ? ' breakBar' : ''}">
      ${bar}
      <button type="button" class="rb undo wide" data-action="ghost-undo" ${canUndo ? '' : 'disabled'}><b>↶ ${pro && g.phase === 'run' && !over ? 'UNDO BREAK' : 'UNDO LAST RACK'}</b></button>
    </div>
  </div>`;
}
