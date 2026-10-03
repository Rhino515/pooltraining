/**
 * Table-game scoring (v14-29).
 * 8-ball, 9-ball, 10-ball: rack counter plus the optional timer. No rules text was added.
 * Bank Pool: WPA Rules of Play §13, effective 2025-09-15
 *   https://wpapool.com/wp-content/uploads/2026/01/2026.01.02-WPA-Rules.pdf
 * Ultimate Pool USA: UPL League Manual v5.0
 *   https://league.ultimatepoolusa.com/docs/uplmanual.pdf
 */
import { timerHTML } from './shotTimer.js';
import { createLoopMatch } from './loopGame.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const RACES = [3, 5, 7, 9];

function clockText(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** UPScore handicap chart, UPL manual §5.4. Difference under 40 is not on the chart. */
export function uplHandicap(scoreA, scoreB) {
  const a = Number(scoreA);
  const b = Number(scoreB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { a: 0, b: 0, used: false, note: 'Both UPScores are needed before the chart applies.' };
  const diff = Math.abs(a - b);
  const row = diff >= 180 ? 180 : diff >= 120 ? 120 : diff >= 80 ? 80 : diff >= 40 ? 40 : 0;
  if (!row) return { a: 0, b: 0, used: false, note: 'A difference under 40 is not on the chart, so both start at 0.' };
  const table = { 40: [-1, -1, -1], 80: [-2, -2, -2], 120: [-2, -3, -3], 180: [-2, -3, -4] };
  const low = Math.min(a, b);
  const col = low <= 400 ? 0 : low <= 520 ? 1 : 2;
  const adj = table[row][col];
  const higher = a >= b ? 'a' : 'b';
  return {
    a: higher === 'a' ? adj : 0,
    b: higher === 'b' ? adj : 0,
    used: true,
    note: `Difference ${diff} uses the ${row} row. The lower UPScore picks the column. The higher-rated player starts at ${adj}.`
  };
}

/** Team points for one individual match, UPL manual §5.6. Cap 20. */
export function uplTeamPoints(finalA, finalB) {
  const cap = (n) => Math.max(0, Math.min(20, n));
  if (finalA === finalB) return { a: cap(finalA), b: cap(finalB), draw: true };
  const aWins = finalA > finalB;
  const w = Math.max(finalA, finalB);
  const l = Math.min(finalA, finalB);
  const wPts = w === 0 ? 0 : cap(5 + w);
  const lPts = cap(l);
  return aWins ? { a: wPts, b: lPts, draw: false } : { a: lPts, b: wPts, draw: false };
}

function head(title, sub) {
  return `<div class="playHead"><button type="button" class="phBack" data-action="go" data-href="#arcade" aria-label="Back">‹</button><div class="phTitle"><small>TABLE GAMES</small><b>${esc(title)}</b></div><div class="phStatus"><span class="score">${esc(sub)}</span></div></div>`;
}

export function createTableMatch(ctx, kind) {
  if (kind === 'loop') return createLoopMatch(ctx);
  const id = ['8', '9', '10', 'bank', 'upusa'].includes(kind) ? kind : '';
  if (!id) {
    return { render() { ctx.root.innerHTML = '<div class="card empty"><p>Unknown table game.</p></div>'; }, onAction() { return false; }, destroy() {} };
  }
  if (id === 'bank') return bankScreen(ctx);
  if (id === 'upusa') return upusaScreen(ctx);
  return raceScreen(ctx, id);
}

function raceScreen(ctx, id) {
  const name = `${id}-Ball`;
  const ui = { you: 0, opp: 0, race: 5, log: [] };
  let alive = true;
  function over() { return ui.you >= ui.race || ui.opp >= ui.race; }
  function render() {
    if (!alive) return;
    const done = over();
    const winner = ui.you === ui.opp ? '' : ui.you > ui.opp ? 'You' : 'Opponent';
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="${id}" data-timer="1">
      ${head(name, `Race to ${ui.race}`)}
      <div class="playBody">
        <p class="muted small ruleLine">Rack counter. The timer is optional and stays off until you turn it on.</p>
        ${timerHTML(`tg-${id}`)}
        <div class="racePick">${RACES.map((r) => `<button type="button" class="chip${r === ui.race ? ' active' : ''}" data-action="tg-race" data-v="${r}" ${ui.log.length ? 'disabled' : ''}>${r}</button>`).join('')}</div>
        <div class="ghostScore tmScore"><div><b>${ui.you}</b><span>YOU</span></div><em>—</em><div><b>${ui.opp}</b><span>OPPONENT</span></div></div>
        ${done ? `<div class="resultPanel pass inline"><h1>${esc(winner.toUpperCase())} ${ui.you}–${ui.opp}</h1></div>` : ''}
        <div class="racklog">${ui.log.map((w, i) => `<span class="${w === 'you' ? 'win' : 'loss'}">R${i + 1} ${w === 'you' ? 'YOU' : 'OPP'}</span>`).join('')}</div>
      </div>
      <div class="resultBar n2">
        <button type="button" class="rb s3" data-action="tg-rack" data-v="you" ${done ? 'disabled' : ''}><b>YOU</b><small>RACK WON</small></button>
        <button type="button" class="rb miss" data-action="tg-rack" data-v="opp" ${done ? 'disabled' : ''}><b>OPPONENT</b><small>RACK WON</small></button>
        <button type="button" class="rb undo wide" data-action="tg-undo" ${ui.log.length ? '' : 'disabled'}><b>UNDO LAST RACK</b></button>
      </div>
    </div>`;
  }
  function onAction(action, el) {
    if (!action.startsWith('tg-')) return false;
    if (action === 'tg-race') {
      if (ui.log.length) return true;
      ui.race = Number(el.dataset.v) || 5;
      render();
      return true;
    }
    if (action === 'tg-rack' && !over()) {
      const who = el.dataset.v === 'opp' ? 'opp' : 'you';
      ui[who] += 1;
      ui.log.push(who);
      render();
      return true;
    }
    if (action === 'tg-undo' && ui.log.length) {
      const who = ui.log.pop();
      ui[who] = Math.max(0, ui[who] - 1);
      render();
      return true;
    }
    return false;
  }
  return { render, onAction, destroy() { alive = false; } };
}

function bankScreen(ctx) {
  const ui = {
    rack: 'short',
    race: 3,
    you: 0,
    opp: 0,
    racksYou: 0,
    racksOpp: 0,
    turn: 'you',
    youBreak: true,
    lagBreaks: true,
    fouls: 0,
    owedYou: 0,
    owedOpp: 0,
    log: []
  };
  let alive = true;
  const need = () => (ui.rack === 'full' ? 8 : 5);
  function push(kind) { ui.log.push(kind); if (ui.log.length > 12) ui.log.shift(); }
  function giveRack(to) {
    if (to === 'you') ui.racksYou += 1; else ui.racksOpp += 1;
    ui.you = 0;
    ui.opp = 0;
    ui.fouls = 0;
    ui.youBreak = !ui.youBreak;
    ui.turn = ui.youBreak ? 'you' : 'opp';
    push(to === 'you' ? 'RACK YOU' : 'RACK OPP');
  }
  function scoreBank(who) {
    const owedKey = who === 'you' ? 'owedYou' : 'owedOpp';
    if (ui[owedKey] > 0) {
      ui[owedKey] -= 1;
      push('BANK CANCELS OWED');
      return;
    }
    ui[who] += 1;
    ui.fouls = 0;
    push('BANK');
    if (ui[who] >= need()) giveRack(who);
  }
  function render() {
    if (!alive) return;
    const done = ui.racksYou >= ui.race || ui.racksOpp >= ui.race;
    const winner = ui.racksYou === ui.racksOpp ? '' : ui.racksYou > ui.racksOpp ? 'You' : 'Opponent';
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="bank" data-timer="1">
      ${head('Bank Pool', `${ui.rack === 'full' ? 'Full rack to 8' : 'Short rack to 5'} · race ${ui.race}`)}
      <div class="playBody">
        ${timerHTML('tg-bank')}
        <p class="ruleLine"><b>WPA Bank Pool</b> (Rules of Play §13, effective 2025-09-15). Not a full referee. ${esc(ui.rack === 'full' ? 'Fifteen balls, triangle, eight points wins the rack.' : 'Nine balls, diamond, five points wins the rack.')} Lag winner chooses the first break. Later breaks alternate (general rule 1.3). A valid bank is one point. Another ball pocketed on that shot does not count. A miss ends the turn. A standard foul is minus one and the turn passes. Scratch: cue ball in hand behind the head string. Three fouls in a row loses the rack (3.13).</p>
        <div class="chips">
          <button type="button" class="chip${ui.rack === 'short' ? ' active' : ''}" data-action="bk-rack" data-v="short">SHORT · 5</button>
          <button type="button" class="chip${ui.rack === 'full' ? ' active' : ''}" data-action="bk-rack" data-v="full">FULL · 8</button>
        </div>
        <div class="racePick">${RACES.map((r) => `<button type="button" class="chip${r === ui.race ? ' active' : ''}" data-action="bk-race" data-v="${r}">Race ${r}</button>`).join('')}</div>
        <div class="chips">
          <button type="button" class="chip${ui.lagBreaks ? ' active' : ''}" data-action="bk-lag" data-v="1" ${ui.racksYou + ui.racksOpp ? 'disabled' : ''}>LAG WINNER BREAKS</button>
          <button type="button" class="chip${!ui.lagBreaks ? ' active' : ''}" data-action="bk-lag" data-v="0" ${ui.racksYou + ui.racksOpp ? 'disabled' : ''}>LAG WINNER GIVES THE BREAK</button>
        </div>
        <p class="muted small">${ui.youBreak ? 'You break this rack.' : 'Opponent breaks this rack.'} ${ui.turn === 'you' ? 'Your shot.' : 'Opponent’s shot.'} ${ui.owedYou || ui.owedOpp ? `Owed balls: you ${ui.owedYou}, opponent ${ui.owedOpp}.` : ''} Fouls in a row: ${ui.fouls}.</p>
        <div class="ghostScore tmScore"><div><b>${ui.you}</b><span>YOU · ${ui.racksYou} RACKS</span></div><em>to ${need()}</em><div><b>${ui.opp}</b><span>OPP · ${ui.racksOpp} RACKS</span></div></div>
        ${done ? `<div class="resultPanel pass inline"><h1>${esc(winner.toUpperCase())} WINS THE MATCH</h1><p class="muted">Race to ${ui.race} racks.</p></div>` : ''}
        <p class="muted small">Left out of the buttons: calling the ball, the cushions, and the pocket; spotting balls on the table; a stalemate re-rack; and unsportsmanlike conduct. Those stay with the players. Source: WPA Rules of Play, wpapool.com, file 2026.01.02.</p>
        <div class="racklog">${ui.log.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      </div>
      <div class="resultBar n3">
        <button type="button" class="rb s3" data-action="bk-bank" ${done ? 'disabled' : ''}><b>BANK</b><small>+1 IF NONE OWED</small></button>
        <button type="button" class="rb miss" data-action="bk-miss" ${done ? 'disabled' : ''}><b>MISS</b><small>TURN PASSES</small></button>
        <button type="button" class="rb alt" data-action="bk-foul" ${done ? 'disabled' : ''}><b>FOUL</b><small>−1 · TURN PASSES</small></button>
      </div>
    </div>`;
  }
  function onAction(action, el) {
    if (action === 'bk-rack' && !ui.racksYou && !ui.racksOpp && ui.you === 0 && ui.opp === 0) {
      ui.rack = el.dataset.v === 'full' ? 'full' : 'short';
      render();
      return true;
    }
    if (action === 'bk-race' && ui.racksYou < ui.race && ui.racksOpp < ui.race) {
      const r = Number(el.dataset.v);
      if (RACES.includes(r) && r > Math.max(ui.racksYou, ui.racksOpp)) ui.race = r;
      render();
      return true;
    }
    if (action === 'bk-lag' && !(ui.racksYou + ui.racksOpp)) {
      ui.lagBreaks = el.dataset.v !== '0';
      ui.youBreak = ui.lagBreaks;
      ui.turn = ui.youBreak ? 'you' : 'opp';
      render();
      return true;
    }
    if (ui.racksYou >= ui.race || ui.racksOpp >= ui.race) return action.startsWith('bk-');
    if (action === 'bk-bank') {
      scoreBank(ui.turn);
      render();
      return true;
    }
    if (action === 'bk-miss') {
      ui.fouls = 0;
      ui.turn = ui.turn === 'you' ? 'opp' : 'you';
      push('MISS');
      render();
      return true;
    }
    if (action === 'bk-foul') {
      const who = ui.turn;
      if (ui[who] > 0) ui[who] -= 1;
      else ui[who === 'you' ? 'owedYou' : 'owedOpp'] += 1;
      ui.fouls += 1;
      push('FOUL');
      if (ui.fouls >= 3) {
        giveRack(who === 'you' ? 'opp' : 'you');
        push('3 FOULS');
      } else ui.turn = who === 'you' ? 'opp' : 'you';
      render();
      return true;
    }
    return false;
  }
  return { render, onAction, destroy() { alive = false; } };
}

function upusaScreen(ctx) {
  const MATCH = 30 * 60 * 1000;
  const SHOT = 30 * 1000;
  const ui = {
    racksA: 0,
    racksB: 0,
    startA: 0,
    startB: 0,
    upA: '',
    upB: '',
    note: '',
    breaker: 'a',
    turn: 'a',
    ext: { a: false, b: false },
    matchLeft: MATCH,
    matchRunning: false,
    matchEnd: 0,
    shotLeft: SHOT,
    shotRunning: false,
    shotEnd: 0,
    shotOn: false,
    started: false,
    ended: false,
    msg: 'Lag for the first break, then tap who breaks. Breaks alternate after that.'
  };
  let alive = true;
  let tick = 0;
  function matchMs() {
    if (!ui.matchRunning) return ui.matchLeft;
    return Math.max(0, ui.matchEnd - Date.now());
  }
  function shotMs() {
    if (!ui.shotRunning) return ui.shotLeft;
    return Math.max(0, ui.shotEnd - Date.now());
  }
  function stopMatch() {
    if (ui.matchRunning) ui.matchLeft = matchMs();
    ui.matchRunning = false;
  }
  function stopShot() {
    if (ui.shotRunning) ui.shotLeft = shotMs();
    ui.shotRunning = false;
  }
  function finishIfDone() {
    if (matchMs() <= 0 && ui.started) {
      stopMatch();
      stopShot();
      ui.matchLeft = 0;
      ui.ended = true;
      ui.msg = 'Match clock is at 0.';
    }
  }
  function finalA() { return ui.startA + ui.racksA; }
  function finalB() { return ui.startB + ui.racksB; }
  function render() {
    if (!alive) return;
    finishIfDone();
    const fa = finalA();
    const fb = finalB();
    const pts = ui.ended ? uplTeamPoints(fa, fb) : null;
    const shot = shotMs();
    const warn = ui.shotRunning && shot <= 10000 && shot > 0;
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="upusa" data-upl="1">
      ${head('Ultimate Pool USA', '30:00 match · 0:30 shot')}
      <div class="playBody">
        <p class="ruleLine">${esc(ui.msg)}</p>
        <div class="tmClocks">
          <div><small>MATCH</small><b data-upl-match>${clockText(matchMs())}</b></div>
          <div class="${warn ? 'warn' : ''}"><small>SHOT${ui.ext[ui.turn] ? ' · EXT USED' : ''}</small><b data-upl-shot>${ui.shotOn ? clockText(shot) : '—'}</b></div>
        </div>
        <div class="ghostScore tmScore"><div><b data-upl-a>${fa}</b><span>YOU · ${ui.racksA} RACKS${ui.startA ? ` · start ${ui.startA}` : ''}</span></div><em>—</em><div><b data-upl-b>${fb}</b><span>OPP · ${ui.racksB} RACKS${ui.startB ? ` · start ${ui.startB}` : ''}</span></div></div>
        <p class="muted small">${ui.turn === 'a' ? 'Your shot.' : 'Opponent’s shot.'} ${ui.breaker === 'a' ? 'You break this rack.' : 'Opponent breaks this rack.'} One 30-second extension per player per rack.</p>
        ${!ui.started ? `<div class="fldRow"><label class="fld">Your UPScore<input id="upA" inputmode="numeric" value="${esc(ui.upA)}"></label><label class="fld">Opponent UPScore<input id="upB" inputmode="numeric" value="${esc(ui.upB)}"></label></div>
          <button type="button" class="bigBtn alt" data-action="up-hand">APPLY HANDICAP CHART</button>
          <p class="muted small">${esc(ui.note || 'Leave blank to start 0–0. The chart is manual §5.4.')}</p>
          <div class="chips">
            <button type="button" class="chip${ui.breaker === 'a' ? ' active' : ''}" data-action="up-break" data-v="a">LAG WINNER: YOU BREAK</button>
            <button type="button" class="chip${ui.breaker === 'b' ? ' active' : ''}" data-action="up-break" data-v="b">LAG WINNER: OPPONENT BREAKS</button>
          </div>` : ''}
        ${pts ? `<div class="resultPanel ${pts.draw ? '' : 'pass'} inline"><h1>${pts.draw ? 'DRAW' : fa > fb ? 'YOU WIN THE MATCH' : 'OPPONENT WINS THE MATCH'}</h1><p>Team points from §5.6: you ${pts.a}, opponent ${pts.b}. ${pts.draw ? 'A draw gives each team that player’s final score.' : 'Winner gets 5 plus the final score, unless that score is 0. Loser gets the final score. Cap 20.'}</p></div>` : ''}
        <p class="muted small">Included: lag choice, alternate breaks, rack score, 30-minute match clock, 30-second shot clock, one extension per rack, handicap chart, team points for this one match. Left out: a five-match team night, coin-toss lineups, roster limits, coaching, and the object-ball rules. Source: UPL League Manual v5.0, league.ultimatepoolusa.com/docs/uplmanual.pdf.</p>
      </div>
      <div class="resultBar n2">
        <button type="button" class="rb s3" data-action="up-balls" ${ui.ended ? 'disabled' : ''}><b>BALLS STOPPED</b><small>START SHOT CLOCK</small></button>
        <button type="button" class="rb alt" data-action="up-ext" ${ui.ended ? 'disabled' : ''}><b>EXTENSION</b><small>+30 ONCE THIS RACK</small></button>
        <button type="button" class="rb s3" data-action="up-rack" data-v="a" ${ui.ended ? 'disabled' : ''}><b>YOU WIN RACK</b></button>
        <button type="button" class="rb miss" data-action="up-rack" data-v="b" ${ui.ended ? 'disabled' : ''}><b>OPP WINS RACK</b></button>
        <button type="button" class="rb alt wide" data-action="up-stop" ${ui.ended ? 'disabled' : ''}><b>ALL STOP</b></button>
        <button type="button" class="rb wide" data-action="up-break-go" ${ui.ended ? 'disabled' : ''}><b>BREAK</b><small>START OR RESUME MATCH CLOCK</small></button>
      </div>
    </div>`;
    const ia = ctx.root.querySelector('#upA');
    const ib = ctx.root.querySelector('#upB');
    ia?.addEventListener('input', () => { ui.upA = ia.value; });
    ib?.addEventListener('input', () => { ui.upB = ib.value; });
  }
  function paintClocks() {
    const m = ctx.root.querySelector('[data-upl-match]');
    const s = ctx.root.querySelector('[data-upl-shot]');
    if (m) m.textContent = clockText(matchMs());
    if (s) s.textContent = ui.shotOn ? clockText(shotMs()) : '—';
    if (ui.shotRunning && shotMs() <= 0) {
      stopShot();
      ui.shotOn = false;
      ui.shotLeft = SHOT;
      ui.turn = ui.turn === 'a' ? 'b' : 'a';
      ui.msg = 'Shot clock expired. Standard foul (8-ball §18). Incoming player has cue ball in hand anywhere (§11).';
      render();
    }
    if (ui.matchRunning && matchMs() <= 0) render();
  }
  function onAction(action, el) {
    if (!action.startsWith('up-')) return false;
    if (action === 'up-hand' && !ui.started) {
      const h = uplHandicap(ui.upA, ui.upB);
      ui.startA = h.a;
      ui.startB = h.b;
      ui.note = h.note;
      render();
      return true;
    }
    if (action === 'up-break' && !ui.started) {
      ui.breaker = el.dataset.v === 'b' ? 'b' : 'a';
      ui.turn = ui.breaker;
      render();
      return true;
    }
    if (ui.ended) return true;
    if (action === 'up-break-go') {
      if (!ui.started) {
        ui.started = true;
        ui.matchLeft = MATCH;
        ui.matchEnd = Date.now() + ui.matchLeft;
        ui.matchRunning = true;
        ui.turn = ui.breaker;
        ui.msg = 'Match clock started on the break. Tap BALLS STOPPED when the balls stop.';
      } else if (!ui.matchRunning && ui.matchLeft > 0) {
        ui.matchEnd = Date.now() + ui.matchLeft;
        ui.matchRunning = true;
        ui.msg = 'Match clock resumed.';
      }
      render();
      return true;
    }
    if (action === 'up-balls') {
      ui.shotLeft = SHOT;
      ui.shotEnd = Date.now() + SHOT;
      ui.shotRunning = true;
      ui.shotOn = true;
      ui.msg = 'Shot clock started. It resets when the balls stop.';
      render();
      return true;
    }
    if (action === 'up-ext') {
      const who = ui.turn;
      if (ui.ext[who]) {
        ui.msg = 'That player already used the extension this rack.';
        render();
        return true;
      }
      ui.ext[who] = true;
      const left = ui.shotOn ? shotMs() : 0;
      ui.shotLeft = left + 30000;
      ui.shotEnd = Date.now() + ui.shotLeft;
      ui.shotRunning = true;
      ui.shotOn = true;
      ui.msg = 'Extension added 30 seconds to the time left. One per player per rack.';
      render();
      return true;
    }
    if (action === 'up-stop') {
      stopMatch();
      stopShot();
      ui.msg = 'All stop. Both clocks are paused.';
      render();
      return true;
    }
    if (action === 'up-rack') {
      const who = el.dataset.v === 'b' ? 'b' : 'a';
      if (who === 'a') ui.racksA += 1; else ui.racksB += 1;
      stopMatch();
      stopShot();
      ui.shotOn = false;
      ui.shotLeft = SHOT;
      ui.ext = { a: false, b: false };
      ui.breaker = ui.breaker === 'a' ? 'b' : 'a';
      ui.turn = ui.breaker;
      ui.msg = 'Rack over. Match clock stopped until the next break. Breaks alternate.';
      if (!ui.started) ui.started = true;
      render();
      return true;
    }
    return false;
  }
  tick = setInterval(() => { if (alive) paintClocks(); }, 200);
  return { render, onAction, destroy() { alive = false; clearInterval(tick); } };
}
