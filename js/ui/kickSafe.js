/**
 * Kick Safe scorekeeper. Rules live in kickSafeRules.js. No Career XP.
 * 1 vs 1 on one device, plus solo kick practice. No table diagram.
 */
import {
  RACES, normalizeBag, freshMatch, applyMatch, undoMatch, recordMatch,
  logSolo, railPercent, overallPercent
} from './kickSafeRules.js';
import { stepsAreOpen, toggleStepsOpen, stepToggleBtn } from './stepFold.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const RAIL_CHIPS = [[1, '1'], [2, '2'], [3, '3'], [4, '4+']];
const SOLO_KICKS = [
  { rails: 1, label: '1-rail' },
  { rails: 2, label: '2-rail' },
  { rails: 3, label: '3-rail' },
  { rails: 4, label: '4+ rails' }
];

function head(sub) {
  return `<div class="playHead"><button type="button" class="phBack" data-action="go" data-href="#arcade" aria-label="Back">‹</button><div class="phTitle"><small>TABLE GAMES</small><b>KICK SAFE</b></div><div class="phStatus"><span class="score">${esc(sub)}</span></div></div>`;
}

function howBlock() {
  const open = stepsAreOpen();
  return `<div class="stepHead"><span class="stepTitle">How to play</span>${stepToggleBtn('ks-steps', open)}</div>
    <div class="stepBody"${open ? '' : ' hidden'}>
      <p>Kick Safe is a defensive game. Contact the lowest-numbered ball first and try to leave your opponent hooked. When you're hooked, escape by kicking off one or more rails. Fouls give your opponent a point. No jump shots.</p>
      <ol class="gameSteps">
        <li>Rack a normal 9-ball.</li>
        <li>Legal 9-ball break.</li>
        <li>The lowest-numbered ball is first contact.</li>
        <li>Pocketed balls are spotted.</li>
        <li>No jump shots.</li>
      </ol>
      <p>SAFETY: Deliberately leaving the opponent a difficult or blocked shot.</p>
      <p>KICK: Sending the cue ball to one or more rails before contacting the required object ball.</p>
      <p>KICK SAFE: Escaping a safety with a kick while also attempting to leave the opponent safe.</p>
    </div>`;
}

function stat(n, label) {
  return `<div><b>${esc(n)}</b><span>${esc(label)}</span></div>`;
}

export function createKickSafe(ctx) {
  let alive = true;
  let mode = 'home';
  let match = freshMatch();
  let rails = 1;
  let soloIndex = 0;
  let soloBase = null;
  let soloLog = [];
  let confirmNew = false;
  let pvpSnap = null;
  let pvpSaved = false;

  function bag() {
    return normalizeBag(ctx.getState()?.kickSafe);
  }
  function saveBag(next) {
    const st = ctx.getState();
    if (!st) return;
    ctx.commit({ ...st, kickSafe: normalizeBag(next) });
  }
  function currentSolo() {
    const base = soloBase || bag().solo;
    return soloLog.reduce((s, a) => logSolo(s, a.rails, a.result), base);
  }
  function persistSolo(next) {
    saveBag({ ...bag(), solo: next });
  }

  function play(action, arg) {
    if (match.done) return;
    const before = bag();
    match = applyMatch(match, action, arg);
    if (match.done && !pvpSaved) {
      pvpSnap = before;
      const res = recordMatch(before, match, new Date().toISOString());
      pvpSaved = true;
      if (res.recorded) saveBag(res.bag);
    }
  }

  function bar(disabled) {
    const dis = disabled ? 'disabled' : '';
    const canUndo = match.log.length ? '' : 'disabled';
    return `<div class="resultBar">
      <button type="button" class="rb s3" data-action="ks-safety" ${dis}><b>SAFETY</b><small>TURN PASSES</small></button>
      <button type="button" class="rb s3" data-action="ks-hook" ${dis}><b>HOOKED THEM</b><small>TURN PASSES</small></button>
      <button type="button" class="rb alt" data-action="ks-kick" ${dis}><b>KICK ESCAPE</b><small>${rails === 4 ? '4+' : rails} RAIL${rails === 1 ? '' : 'S'} · YOU STAY</small></button>
      <button type="button" class="rb miss" data-action="ks-kick-miss" ${dis}><b>KICK MISSED</b><small>NO POINT · YOU STAY</small></button>
      <button type="button" class="rb alt" data-action="ks-foul" ${dis}><b>FOUL</b><small>OPPONENT +1</small></button>
      <button type="button" class="rb miss" data-action="ks-scratch" ${dis}><b>SCRATCH</b><small>OPPONENT +1 · FOUL</small></button>
      <button type="button" class="rb alt" data-action="ks-pass" ${dis}><b>PASS TURN</b><small>NO POINT</small></button>
      <button type="button" class="rb undo wide" data-action="ks-undo" ${canUndo}><b>UNDO LAST ACTION</b></button>
    </div>`;
  }

  function confirmBlock() {
    if (!confirmNew) return '';
    return `<div class="ksConfirm"><p>Start a new game? Match history stays.</p>
      <button type="button" class="bigBtn" data-action="ks-new-yes">NEW GAME</button>
      <button type="button" class="bigBtn alt" data-action="ks-new-no">KEEP PLAYING</button></div>`;
  }

  function render() {
    if (!alive) return;
    const b = bag();
    if (mode === 'solo') {
      const solo = currentSolo();
      const kick = SOLO_KICKS[soloIndex];
      const canUndo = soloLog.length ? '' : 'disabled';
      ctx.root.innerHTML = `<div class="playScreen tableMatch kickSafe" data-table-game="kicksafe" data-kick-mode="solo">
        ${head('SOLO')}
        <div class="playBody">
          ${howBlock()}
          <p class="ksLine"><span>${esc(kick.label)}</span><button type="button" class="chip" data-action="ks-next">Next</button></p>
          <p class="muted small">Set the kick up on the table, then log the attempt. This is not a second player.</p>
          <div class="ksStats">
            ${stat(solo.attempts, 'Attempts')}
            ${stat(solo.success, 'Successful escapes')}
            ${stat(solo.fail, 'Failed escapes')}
            ${stat(railPercent(solo, 1) + '%', '1-rail kick %')}
            ${stat(railPercent(solo, 2) + '%', '2-rail kick %')}
            ${stat(railPercent(solo, 3) + '%', '3-rail kick %')}
            ${stat(railPercent(solo, 4) + '%', '4+ rail kick %')}
            ${stat(solo.scratch, 'Scratches')}
            ${stat(solo.bestStreak, 'Best streak')}
            ${stat(overallPercent(solo) + '%', 'Overall kick success %')}
          </div>
          <button type="button" class="bigBtn alt" data-action="ks-home">BACK</button>
        </div>
        <div class="resultBar">
          <button type="button" class="rb s3" data-action="ks-attempt" data-v="success"><b>SUCCESS</b><small>ESCAPE</small></button>
          <button type="button" class="rb miss" data-action="ks-attempt" data-v="fail"><b>FAIL</b><small>BREAKS STREAK</small></button>
          <button type="button" class="rb alt" data-action="ks-attempt" data-v="scratch"><b>SCRATCH</b><small>BREAKS STREAK</small></button>
          <button type="button" class="rb undo wide" data-action="ks-solo-undo" ${canUndo}><b>UNDO LAST ATTEMPT</b></button>
        </div>
      </div>`;
      return;
    }
    if (mode === 'pvp') {
      const who = match.turn === 0 ? 'Player 1' : 'Player 2';
      const done = match.done;
      ctx.root.innerHTML = `<div class="playScreen tableMatch kickSafe" data-table-game="kicksafe" data-kick-mode="pvp">
        ${head('RACE TO ' + match.race)}
        <div class="playBody">
          ${howBlock()}
          <div class="racePick">${RACES.map((r) => `<button type="button" class="chip${r === match.race ? ' active' : ''}" data-action="ks-race" data-v="${r}" ${match.log.length ? 'disabled' : ''}>${r}</button>`).join('')}</div>
          <div class="ghostScore tmScore">
            <div class="${!done && match.turn === 0 ? 'ksOn' : ''}"><b>${match.scores[0]}</b><span>PLAYER 1</span></div>
            <em>RACE TO ${match.race}</em>
            <div class="${!done && match.turn === 1 ? 'ksOn' : ''}"><b>${match.scores[1]}</b><span>PLAYER 2</span></div>
          </div>
          <p class="muted small">${done ? `Player ${match.winner + 1} wins.` : `${esc(who)} shooting.`}</p>
          <p class="ksLab">Required object ball</p>
          <div class="chips">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="chip${n === match.ball ? ' active' : ''}" data-action="ks-ball" data-v="${n}">${n}</button>`).join('')}</div>
          <p class="ksLab">Kick escape rails</p>
          <div class="chips">${RAIL_CHIPS.map(([n, label]) => `<button type="button" class="chip${n === rails ? ' active' : ''}" data-action="ks-rails" data-v="${n}" ${done ? 'disabled' : ''}>${label}</button>`).join('')}</div>
          <p class="muted small">Fouls ${match.fouls} · Successful kick escapes ${match.kickOk} · Failed kick escapes ${match.kickFail} · Safeties ${match.safeties} · Successful hooks ${match.hooks} · Scratches ${match.scratches}</p>
          ${done ? `<div class="resultPanel pass inline"><h1>PLAYER ${match.winner + 1} WINS</h1><p class="muted">${match.scores[0]}–${match.scores[1]} · race to ${match.race}</p></div>` : ''}
          ${confirmBlock()}
          <button type="button" class="bigBtn alt" data-action="ks-new">NEW GAME</button>
        </div>
        ${bar(done)}
      </div>`;
      return;
    }
    const last = b.pvpHistory[0];
    ctx.root.innerHTML = `<div class="playScreen tableMatch kickSafe" data-table-game="kicksafe" data-kick-mode="home">
      ${head('DEFENSIVE')}
      <div class="playBody">
        ${howBlock()}
        <p>Contact the lowest ball first. Leave them hooked. A foul is 1 point for the other player. Race to ${esc(b.race)}.</p>
        ${last ? `<p class="muted small">Last match: Player ${esc(last.winner)} won ${esc(last.p1)}–${esc(last.p2)}.</p>` : ''}
        <button type="button" class="bigBtn" data-action="ks-solo">SOLO PRACTICE</button>
        <button type="button" class="bigBtn" data-action="ks-pvp">1 VS 1</button>
      </div>
    </div>`;
  }

  function onAction(action, el) {
    if (!action || !action.startsWith('ks-')) return false;
    if (action === 'ks-steps') { toggleStepsOpen(); render(); return true; }
    if (action === 'ks-home') { mode = 'home'; confirmNew = false; render(); return true; }
    if (action === 'ks-solo') {
      mode = 'solo';
      confirmNew = false;
      soloBase = bag().solo;
      soloLog = [];
      render();
      return true;
    }
    if (action === 'ks-pvp') {
      mode = 'pvp';
      confirmNew = false;
      if (!match.log.length && !match.done) match = freshMatch(bag().race);
      render();
      return true;
    }
    if (action === 'ks-next') {
      soloIndex = (soloIndex + 1) % SOLO_KICKS.length;
      render();
      return true;
    }
    if (action === 'ks-attempt') {
      const result = el && el.dataset ? el.dataset.v : '';
      const railsN = SOLO_KICKS[soloIndex].rails;
      const next = logSolo(currentSolo(), railsN, result);
      if (next !== currentSolo() && (result === 'success' || result === 'fail' || result === 'scratch')) {
        soloLog.push({ rails: railsN, result });
        persistSolo(next);
      }
      render();
      return true;
    }
    if (action === 'ks-solo-undo') {
      if (soloLog.length) {
        soloLog.pop();
        persistSolo(currentSolo());
      }
      render();
      return true;
    }
    if (action === 'ks-race') {
      if (match.log.length) return true;
      const race = RACES.includes(Number(el.dataset.v)) ? Number(el.dataset.v) : match.race;
      match = { ...match, race };
      saveBag({ ...bag(), race });
      render();
      return true;
    }
    if (action === 'ks-ball') {
      match = applyMatch(match, 'ball', Number(el.dataset.v));
      render();
      return true;
    }
    if (action === 'ks-rails') {
      const n = Number(el.dataset.v);
      if (n === 1 || n === 2 || n === 3 || n === 4) rails = n;
      render();
      return true;
    }
    if (action === 'ks-new') { confirmNew = true; render(); return true; }
    if (action === 'ks-new-no') { confirmNew = false; render(); return true; }
    if (action === 'ks-new-yes') {
      confirmNew = false;
      match = freshMatch(bag().race);
      pvpSnap = null;
      pvpSaved = false;
      rails = 1;
      mode = 'pvp';
      render();
      return true;
    }
    if (action === 'ks-undo') {
      if (match.log.length) {
        match = undoMatch(match);
        if (pvpSnap && !match.done) {
          saveBag(pvpSnap);
          pvpSnap = null;
          pvpSaved = false;
        }
      }
      confirmNew = false;
      render();
      return true;
    }
    if (action === 'ks-safety') play('safety');
    else if (action === 'ks-hook') play('hook');
    else if (action === 'ks-kick') play('kick', rails);
    else if (action === 'ks-kick-miss') play('kick-miss');
    else if (action === 'ks-foul') play('foul');
    else if (action === 'ks-scratch') play('scratch');
    else if (action === 'ks-pass') play('pass');
    else return true;
    confirmNew = false;
    render();
    return true;
  }

  return { render, onAction, destroy() { alive = false; } };
}
