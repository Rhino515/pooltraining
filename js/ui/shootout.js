/**
 * 6-Ball Shootout (v14-120), only what the UPL League Manual v5.0 section 9 says:
 *   §9.1 a timed tiebreak: pocket six object balls, fastest time wins (used at GFQ, GF and NSL, not regular session play)
 *   §9.2 teams: one player from each team lags; the lag winner shoots first or makes the other team shoot first;
 *        fastest total time wins; teammates alternate shots
 *   §9.3 singles: tied at the expiration of the Match Clock; fastest time wins; no shot rotation
 *   §9.4 clock starts on the break, stops on the final object ball; each foul adds five seconds; after a scratch,
 *        ball in hand anywhere (a second cue ball is kept ready); the back middle ball goes on the foot spot
 * A tie is not covered by the manual: the screen says "Tie" and offers a re-shoot without calling it a rule.
 * Not Career, XP, or rank. Nothing is saved: a shootout lives on this screen only.
 */
import { rackSVG, PRESET_RACKS } from './rackLayout.js';
import { head } from './tableMatch.js';

export const FOUL_MS = 5000; // §9.4
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const other = (k) => (k === 'a' ? 'b' : 'a');
const freshRun = () => ({ start: 0, stop: 0, running: false, done: false, fouls: 0, scratches: 0, log: [] });

export function freshShootout({ mode = 'singles', fromUpl = false } = {}) {
  return {
    mode: mode === 'team' ? 'team' : 'singles',
    fromUpl,
    sides: {
      a: { name: fromUpl ? 'You' : 'Player 1', players: ['', ''] },
      b: { name: fromUpl ? 'Opponent' : 'Player 2', players: ['', ''] }
    },
    lagWinner: null,
    first: null,
    phase: 'setup',
    turn: 0, // 0 = first shooter's run, 1 = second
    round: 1,
    runs: { a: freshRun(), b: freshRun() }
  };
}
export const order = (s) => (s.first ? [s.first, other(s.first)] : ['a', 'b']);
export const shooter = (s) => order(s)[s.turn];
export function rawMs(run, now = Date.now()) {
  if (!run.start) return 0;
  return Math.max(0, (run.running ? now : run.stop) - run.start);
}
export const finalMs = (run, now) => rawMs(run, now) + run.fouls * FOUL_MS;
/** m:ss.t (tenths, rounded down so the display never runs ahead of the clock). */
export function fmt(ms) {
  const t = Math.floor(Math.max(0, ms) / 100);
  const m = Math.floor(t / 600);
  const sec = Math.floor((t % 600) / 10);
  return `${m}:${String(sec).padStart(2, '0')}.${t % 10}`;
}
const tenths = (ms) => Math.floor(ms / 100);
export function result(s) {
  const row = (k) => ({ side: k, name: s.sides[k].name, raw: rawMs(s.runs[k]), fouls: s.runs[k].fouls, scratches: s.runs[k].scratches, final: finalMs(s.runs[k]) });
  const a = row('a');
  const b = row('b');
  const winner = tenths(a.final) === tenths(b.final) ? null : a.final < b.final ? 'a' : 'b';
  return { a, b, winner, tie: winner === null };
}
/** Pure step. now = ms timestamp. */
export function applyShootout(state, action, arg, now = Date.now()) {
  const s = JSON.parse(JSON.stringify(state));
  const k = shooter(s);
  const run = s.runs[k];
  if (action === 'mode' && s.phase === 'setup') { s.mode = arg === 'team' ? 'team' : 'singles'; return s; }
  if (action === 'lag' && s.phase === 'setup') { s.lagWinner = arg === 'b' ? 'b' : 'a'; s.first = null; return s; }
  if (action === 'choose' && s.phase === 'setup' && s.lagWinner) {
    s.first = arg === 'other' ? other(s.lagWinner) : s.lagWinner; // §9.2: shoot first or require the opponents to shoot first
    return s;
  }
  if (action === 'begin' && s.phase === 'setup' && s.first) { s.phase = 'run'; s.turn = 0; s.runs = { a: freshRun(), b: freshRun() }; return s; }
  if (s.phase !== 'run') {
    if (action === 'reshoot' && s.phase === 'result') { s.phase = 'run'; s.turn = 0; s.round += 1; s.runs = { a: freshRun(), b: freshRun() }; }
    return s;
  }
  if (action === 'start' && !run.start) { run.start = now; run.running = true; return s; } // §9.4 clock starts on the break
  if (action === 'stop' && run.running) { run.stop = now; run.running = false; run.done = true; return s; } // §9.4 final object ball
  if (action === 'foul' && run.start) { run.fouls += 1; run.log.push('foul'); return s; } // §9.4 +5 seconds each
  if (action === 'scratch' && run.start) { run.scratches += 1; run.log.push('scratch'); return s; } // §9.4 ball in hand anywhere
  if (action === 'undo' && run.log.length) {
    const last = run.log.pop();
    if (last === 'foul') run.fouls -= 1; else run.scratches -= 1;
    return s;
  }
  if (action === 'reset') { s.runs[k] = freshRun(); return s; }
  if (action === 'next' && run.done) {
    if (s.turn === 0) s.turn = 1; else s.phase = 'result';
    return s;
  }
  return s;
}

// ------------------------------------------------------------------------------------------- screen
const RACK = () => rackSVG(PRESET_RACKS.shootout, { className: 'table-diagram rackDiagram soRack' });
const sideLabel = (s, k) => esc(s.sides[k].name || (k === 'a' ? 'Side A' : 'Side B'));

export function shootoutRulesHTML() {
  return `<ul class="learnRules soRules">
    <li>What it is (§9.1): a timed tiebreak. Pocket all six object balls as fast as you can. The fastest time wins. The manual uses it at Grand Finals Qualifiers, Grand Finals and the National Shootout League, not in regular session league play.</li>
    <li>Teams (§9.2): one player from each team lags. The lag winner shoots first or makes the other team shoot first. The fastest total time wins. Teammates alternate shots: Player A, then Player B.</li>
    <li>Singles (§9.3): used when players are tied when the match clock runs out. The fastest time wins. No shot rotation: one player shoots every ball.</li>
    <li>The clock (§9.4): it starts when the cue ball is struck on the break and stops when the last object ball drops. You may shoot once the cue ball has stopped, at any object ball that has stopped, even if others are still moving.</li>
    <li>Fouls (§9.4): at least one object ball must hit a rail on the break, or it is a foul and play continues. Every shot must be legal or a foul is recorded. Each foul adds five seconds to the final time.</li>
    <li>Scratch (§9.4): no ball in hand except after a scratch. After a scratch, ball in hand anywhere on the table. A second cue ball is kept ready so play goes on right away.</li>
    <li>Rack (§9.4): six object balls. The back middle ball goes on the foot spot.</li>
  </ul>
  <p class="muted small">Source: UPL League Manual v5.0, section 9 (6-Ball Shootout). The manual does not say what happens if two final times are the same.</p>`;
}

export function createShootout(ctx, rest = []) {
  const fromUpl = rest[0] === 'upl';
  let s = freshShootout({ fromUpl });
  let alive = true;
  let rulesOpen = false;
  const iv = setInterval(() => {
    if (!alive || s.phase !== 'run') return;
    const run = s.runs[shooter(s)];
    if (!run.running) return;
    const c = ctx.root.querySelector('[data-so-clock]');
    const f = ctx.root.querySelector('[data-so-final]');
    if (c) c.textContent = fmt(rawMs(run));
    if (f) f.textContent = fmt(finalMs(run));
  }, 100);
  function go(action, arg) { s = applyShootout(s, action, arg); render(); }

  function nameInputs() {
    const box = (k) => {
      const side = s.sides[k];
      if (s.mode === 'singles') return `<label class="soField"><span>${k === 'a' ? 'PLAYER 1' : 'PLAYER 2'}</span><input class="cgNameInput" data-so-name="${k}" maxlength="24" value="${esc(side.name)}"/></label>`;
      return `<div class="soTeam"><label class="soField"><span>${k === 'a' ? 'TEAM 1' : 'TEAM 2'}</span><input class="cgNameInput" data-so-name="${k}" maxlength="24" value="${esc(side.name)}"/></label>
        <div class="soPair"><input class="cgNameInput small" data-so-player="${k}:0" maxlength="24" placeholder="Player A" value="${esc(side.players[0])}"/><input class="cgNameInput small" data-so-player="${k}:1" maxlength="24" placeholder="Player B" value="${esc(side.players[1])}"/></div></div>`;
    };
    return box('a') + box('b');
  }
  function setupHTML() {
    const team = s.mode === 'team';
    const lw = s.lagWinner;
    return `<div class="card soCard">
        <div class="soRackArt">${RACK()}</div>
        <p class="muted small">Six object balls in a triangle. The back middle ball goes on the foot spot (§9.4).</p>
      </div>
      ${s.fromUpl ? '<p class="ruleLine">Tied when the match clock ran out. §9.3 settles a tied singles match with a 6-Ball Shootout. The manual uses it at Grand Finals Qualifiers, Grand Finals and the NSL (§9.1).</p>' : ''}
      <div class="card soCard">
        <span class="eyebrow">PLAYERS</span>
        <div class="chips"><button type="button" class="chip${!team ? ' active' : ''}" data-action="so-mode" data-v="singles">SINGLES</button><button type="button" class="chip${team ? ' active' : ''}" data-action="so-mode" data-v="team">TEAM</button></div>
        ${nameInputs()}
      </div>
      <div class="card soCard">
        <span class="eyebrow">LAG</span>
        <p class="muted small">${team ? 'One player from each team lags. The lag winner chooses to shoot first or make the other team shoot first (§9.2).' : 'Lag for who picks the order. The manual does not set the order for singles.'}</p>
        <div class="chips"><button type="button" class="chip${lw === 'a' ? ' active' : ''}" data-action="so-lag" data-v="a">${sideLabel(s, 'a')} WON THE LAG</button><button type="button" class="chip${lw === 'b' ? ' active' : ''}" data-action="so-lag" data-v="b">${sideLabel(s, 'b')} WON THE LAG</button></div>
        ${lw ? `<div class="chips"><button type="button" class="chip${s.first === lw ? ' active' : ''}" data-action="so-choose" data-v="self">${sideLabel(s, lw)} SHOOTS FIRST</button><button type="button" class="chip${s.first && s.first !== lw ? ' active' : ''}" data-action="so-choose" data-v="other">${sideLabel(s, other(lw))} SHOOTS FIRST</button></div>` : ''}
      </div>
      <button type="button" class="bigBtn" data-action="so-begin" ${s.first ? '' : 'disabled'}>START THE SHOOTOUT</button>
      ${rulesCard()}`;
  }
  function rulesCard() {
    return `<details class="card soCard soRulesCard"${rulesOpen ? ' open' : ''}><summary><span class="eyebrow">RULES · UPL MANUAL §9</span></summary>${shootoutRulesHTML()}</details>`;
  }
  function runHTML() {
    const k = shooter(s);
    const run = s.runs[k];
    const firstK = order(s)[0];
    const prev = s.turn === 1 ? s.runs[firstK] : null;
    const team = s.mode === 'team';
    const pl = s.sides[k].players.filter(Boolean);
    const lastScratch = run.log[run.log.length - 1] === 'scratch';
    return `<div class="soWho"><small>RUN ${s.turn + 1} OF 2${s.round > 1 ? ` · RE-SHOOT ${s.round - 1}` : ''}</small><b data-so-shooter="${k}">${sideLabel(s, k)}</b>
        <span class="muted small">${team ? `Teammates alternate shots${pl.length === 2 ? `: ${esc(pl[0])}, then ${esc(pl[1])}` : ': Player A, then Player B'} (§9.2).` : 'One player shoots every ball. No shot rotation (§9.3).'}</span></div>
      <div class="soWatch${run.running ? ' is-running' : ''}${run.done ? ' is-done' : ''}" data-so-watch>
        <b data-so-clock>${fmt(rawMs(run))}</b>
        <span>FOULS <b data-so-fouls>${run.fouls}</b> · +${run.fouls * 5} s · SCRATCHES <b data-so-scratches>${run.scratches}</b></span>
        <span class="soFinal">FINAL <b data-so-final>${fmt(finalMs(run))}</b></span>
      </div>
      <p class="muted small">${!run.start ? 'Tap START when the cue ball is struck on the break (§9.4).' : run.running ? 'Tap STOP when the last object ball drops (§9.4).' : 'Run finished. Add any foul the referee calls, then go on.'}</p>
      ${lastScratch ? '<p class="ruleLine" data-so-scratch-note>Scratch: ball in hand anywhere on the table. Use the second cue ball so play goes on right away (§9.4).</p>' : ''}
      <p class="muted small">A foul is a break where no object ball hits a rail, or a shot that is not legal. Each foul adds 5 seconds (§9.4).</p>
      ${prev ? `<p class="muted small soPrev">${sideLabel(s, firstK)}: ${fmt(rawMs(prev))} + ${prev.fouls} ${prev.fouls === 1 ? 'foul' : 'fouls'} = <b>${fmt(finalMs(prev))}</b></p>` : ''}
      <div class="soRackArt small">${RACK()}</div>`;
  }
  function runBar() {
    const k = shooter(s);
    const run = s.runs[k];
    const nextK = s.turn === 0 ? order(s)[1] : null;
    return `<div class="resultBar soBar">
      ${!run.start ? '<button type="button" class="rb s3 wide soBig" data-action="so-start"><b>START</b><small>BREAK · CUE BALL STRUCK</small></button>' : ''}
      ${run.running ? '<button type="button" class="rb miss wide soBig" data-action="so-stop"><b>STOP</b><small>LAST OBJECT BALL DOWN</small></button>' : ''}
      <button type="button" class="rb alt" data-action="so-foul" ${run.start ? '' : 'disabled'}><b>+FOUL</b><small>+5 SECONDS</small></button>
      <button type="button" class="rb alt" data-action="so-scratch" ${run.start ? '' : 'disabled'}><b>SCRATCH</b><small>BALL IN HAND ANYWHERE</small></button>
      <button type="button" class="rb undo" data-action="so-undo" ${run.log.length ? '' : 'disabled'}><b>UNDO</b><small>LAST FOUL OR SCRATCH</small></button>
      <button type="button" class="rb undo" data-action="so-reset" ${run.start ? '' : 'disabled'}><b>RESET RUN</b><small>CLEAR THIS RUN</small></button>
      ${run.done ? `<button type="button" class="rb s3 wide" data-action="so-next"><b>${nextK ? `NEXT: ${sideLabel(s, nextK).toUpperCase()}` : 'SEE THE RESULT'}</b></button>` : ''}
    </div>`;
  }
  function resultHTML() {
    const r = result(s);
    const rows = order(s).map((k) => r[k]).map((x) => `<tr class="${r.winner === x.side ? 'win' : ''}"><th>${esc(x.name)}</th><td>${fmt(x.raw)}</td><td>${x.fouls} × 5 s</td><td>${x.scratches}</td><td><b>${fmt(x.final)}</b></td></tr>`).join('');
    return `<div class="resultPanel ${r.tie ? '' : 'pass'} inline" data-so-result="${r.tie ? 'tie' : r.winner}"><h1>${r.tie ? 'TIE' : `${esc(r[r.winner].name.toUpperCase())} WINS`}</h1>
        <p class="muted">${r.tie ? 'Same final time, to the tenth of a second.' : `Fastest final time (§9.1). ${fmt(Math.abs(r.a.final - r.b.final))} faster.`}</p></div>
      <table class="soTable"><thead><tr><th></th><th>TIME</th><th>FOULS</th><th>SCR.</th><th>FINAL</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="muted small">Final time = clock time + 5 seconds for each foul (§9.4).</p>
      ${r.tie ? '<p class="ruleLine">The manual does not say what to do after a tie. You can shoot it again if you both agree.</p><button type="button" class="bigBtn" data-action="so-reshoot">RE-SHOOT</button>' : ''}
      <button type="button" class="bigBtn alt" data-action="so-new">NEW SHOOTOUT</button>
      ${rulesCard()}`;
  }
  function render() {
    if (!alive) return;
    const sub = s.phase === 'setup' ? 'UPL §9' : s.phase === 'run' ? `Run ${s.turn + 1} of 2` : 'Result';
    ctx.root.innerHTML = `<div class="playScreen tableMatch soScreen" data-table-game="shootout" data-so-phase="${s.phase}">
      ${head('6-Ball Shootout', sub)}
      <div class="playBody">${s.phase === 'setup' ? setupHTML() : s.phase === 'run' ? runHTML() : resultHTML()}</div>
      ${s.phase === 'run' ? runBar() : ''}
    </div>`;
    bind();
  }
  function bind() {
    ctx.root.querySelectorAll('[data-so-name]').forEach((i) => i.addEventListener('input', () => { s.sides[i.dataset.soName].name = i.value; }));
    ctx.root.querySelectorAll('[data-so-player]').forEach((i) => i.addEventListener('input', () => { const [k, n] = i.dataset.soPlayer.split(':'); s.sides[k].players[Number(n)] = i.value; }));
    const d = ctx.root.querySelector('.soRulesCard');
    d?.addEventListener('toggle', () => { rulesOpen = d.open; });
  }
  function onAction(action, el) {
    if (!action.startsWith('so-')) return false;
    const v = el?.dataset?.v;
    for (const k of ['a', 'b']) if (!String(s.sides[k].name || '').trim()) s.sides[k].name = s.mode === 'team' ? (k === 'a' ? 'Team 1' : 'Team 2') : (k === 'a' ? 'Player 1' : 'Player 2');
    if (action === 'so-mode') {
      go('mode', v);
      if (!fromUpl) for (const k of ['a', 'b']) if (/^(Player|Team) [12]$/.test(s.sides[k].name)) s.sides[k].name = s.mode === 'team' ? (k === 'a' ? 'Team 1' : 'Team 2') : (k === 'a' ? 'Player 1' : 'Player 2');
      render();
      return true;
    }
    if (action === 'so-new') { const keep = s.sides; s = freshShootout({ mode: s.mode, fromUpl }); s.sides = keep; render(); return true; }
    const map = { 'so-lag': 'lag', 'so-choose': 'choose', 'so-begin': 'begin', 'so-start': 'start', 'so-stop': 'stop', 'so-foul': 'foul', 'so-scratch': 'scratch', 'so-undo': 'undo', 'so-reset': 'reset', 'so-next': 'next', 'so-reshoot': 'reshoot' };
    if (map[action]) { go(map[action], v); return true; }
    return true;
  }
  return { render, onAction, destroy() { alive = false; clearInterval(iv); } };
}
