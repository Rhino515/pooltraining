/**
 * Loop scorekeeper. Rules live in loopRules.js. No Career XP.
 */
import {
  normalizeBag, freshSolo, applySolo, undoSolo, placeSolo, finishSolo,
  freshPvp, applyPvp, undoPvp, placePvp, recordPvp
} from './loopRules.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function head(title, sub) {
  return `<div class="playHead"><button type="button" class="phBack" data-action="go" data-href="#arcade" aria-label="Back">‹</button><div class="phTitle"><small>TABLE GAMES</small><b>${esc(title)}</b></div><div class="phStatus"><span class="score">${esc(sub)}</span></div></div>`;
}

/** Triangle with the white at the apex nearest the player. The 1 is in hand, not in the rack. */
function rackSvg() {
  const balls = [];
  const rows = [
    ['2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9', '10'],
    ['11', '12', '13', '14', '15']
  ];
  const gap = 26;
  const apexY = 168;
  rows.forEach((labels, i) => {
    const y = apexY - (i + 1) * gap;
    const count = labels.length;
    labels.forEach((label, k) => {
      const x = 120 + (k - (count - 1) / 2) * gap;
      balls.push(`<g><circle cx="${x}" cy="${y}" r="11" fill="#f6c453" stroke="#1a1408" stroke-width="1"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1a1408">${label}</text></g>`);
    });
  });
  return `<svg class="loopRack" viewBox="0 0 240 320" role="img" aria-label="Loop rack. The white cue ball is the apex nearest you. The 1-ball is in your hand, not in the triangle.">
    <text x="120" y="18" text-anchor="middle" fill="#9eb0c4" font-size="11" font-weight="700">FAR END</text>
    ${balls.join('')}
    <g>
      <circle cx="120" cy="${apexY}" r="12" fill="#ffffff" stroke="#1a1408" stroke-width="1.5"/>
      <text x="120" y="${apexY + 4}" text-anchor="middle" font-size="9" font-weight="800" fill="#1a1408">W</text>
    </g>
    <text x="120" y="${apexY + 28}" text-anchor="middle" fill="#f6c453" font-size="11" font-weight="800">WHITE APEX</text>
    <line x1="120" y1="230" x2="120" y2="248" stroke="#9eb0c4" stroke-width="1.5"/>
    <g>
      <circle cx="120" cy="262" r="12" fill="#f6c453" stroke="#1a1408" stroke-width="1.5"/>
      <text x="120" y="266" text-anchor="middle" font-size="11" font-weight="800" fill="#1a1408">1</text>
    </g>
    <line x1="120" y1="276" x2="120" y2="300" stroke="#e7d3a1" stroke-width="4" stroke-linecap="round"/>
    <text x="168" y="266" fill="#d5deea" font-size="11" font-weight="700">1 IN HAND</text>
    <text x="120" y="314" text-anchor="middle" fill="#f4fbff" font-size="11" font-weight="800">YOU · BREAKING END</text>
  </svg>`;
}

function howHtml() {
  return `<div class="loopHow">
    <h2>LOOP IS POOL BACKWARDS</h2>
    <p>You play the object ball first. The white cue ball is what you carom off, not what you strike.</p>
    <div class="loopSeq"><b>NORMAL POOL</b><span>Cue Stick → Cue Ball → Object Ball → Pocket</span></div>
    <div class="loopSeq"><b>LOOP</b><span>Cue Stick → Object Ball → White Cue Ball → Pocket</span></div>
    <p class="loopStrike">Strike a numbered object ball directly with your cue. The object ball must carom off the white cue ball and enter your called pocket.</p>
    ${rackSvg()}
    <p class="muted small">Bottom of the diagram is you. White is the apex nearest you. The 1 is not in the rack.</p>
    <ol class="gameSteps">
      <li>Rack 14 numbered balls plus the white cue ball. White is the front apex, closest to you. Do not flip the rack.</li>
      <li>The 1-ball stays in your hand. It is not in the triangle.</li>
      <li>Break by striking the 1-ball. It hits the white and spreads the rack.</li>
      <li>After the break, strike a numbered ball with the cue. Do not strike the white.</li>
      <li>Call the pocket. That ball must carom off the white and go in the pocket you called.</li>
      <li>Solo: every stroke is 1 shot. A make adds a ball. A miss does not. Fewer shots is better. Clear all 15.</li>
      <li>Solo scratch: still only 1 shot. Place the white anywhere, then tap Cue ball placed. If the object ball also went in, it still counts.</li>
      <li>1 vs 1 is a race to 8. A make is 1 point and you shoot again. A miss ends your turn.</li>
      <li>1 vs 1 scratch: no point, even if the object ball went in. The other player places the white anywhere.</li>
      <li>Solo ends at 15 balls. 1 vs 1 ends when someone reaches 8.</li>
    </ol>
    <details class="ruleMore"><summary>Full rules</summary>
    <h2>SETUP</h2>
    <p>Use all 15 numbered balls plus the white cue ball. Rack a normal triangle. Do not reverse the rack. The white cue ball is the front apex, closest to the breaking end and to you. The 1-ball is not the apex.</p>
    <p>The triangle is 14 numbered balls plus the white at the apex, 15 balls in the rack. The 1-ball stays in your hand for the break.</p>
    <h2>BREAK</h2>
    <p>The 1-ball is the shooting ball for the opening break. Strike the 1-ball with the cue. The 1 hits the white at the front of the rack and spreads it. After the break, play normal Loop: strike a numbered ball, carom off the white, and pocket that numbered ball.</p>
    <h2>MAKING A BALL</h2>
    <p>Call the pocket. The numbered object ball must carom off the white cue ball and then go into that pocket.</p>
    <h2>SOLO</h2>
    <p>Your score is total shots. Every stroke counts as one shot. Lower is better. Perfect is 15. A make adds one ball and the streak continues. A miss adds no ball and the streak resets. The game ends at 15 balls.</p>
    <h2>SOLO SCRATCH</h2>
    <p>White only, object ball not made: one shot, one scratch, no ball, streak resets, ball in hand anywhere. No extra penalty shot. Tap CUE BALL PLACED before the next shot. Placing the white does not add a shot.</p>
    <p>Object ball made and white also pocketed: the ball counts, the streak continues, shots go up by one, scratches go up by one, ball in hand anywhere. Still no extra penalty shot.</p>
    <h2>1 VS 1</h2>
    <p>Race to 8. Both start at 0. A make is one point and you shoot again. A miss ends the turn. The opponent shoots from the table, not ball in hand.</p>
    <h2>1 VS 1 SCRATCH</h2>
    <p>A scratch scores no point. The turn ends. The incoming player has ball in hand anywhere.</p>
    <p>If the object ball goes in and the white scratches, that is different from solo. Do not award the point. The turn ends and the opponent has ball in hand anywhere.</p>
    <h2>WINNING</h2>
    <p>Solo ends when 15 numbered balls are pocketed. The score is total shots. Personal best is the lowest finished score. 1 vs 1 ends when a player reaches 8. That player wins.</p>
    </details>
    <h2>WHY IT TRAINS</h2>
    <ul class="loopWhy">
      <li>Carom-angle recognition</li>
      <li>Natural angles</li>
      <li>Tangent-line understanding</li>
      <li>Stun, follow, and draw caroms</li>
      <li>Speed control</li>
      <li>Cue-ball positioning</li>
      <li>Cluster management</li>
      <li>Pattern planning</li>
    </ul>
    <button type="button" class="bigBtn alt" data-action="loop-home">BACK TO LOOP</button>
  </div>`;
}

function stat(n, label) {
  return `<div><b>${esc(n)}</b><span>${esc(label)}</span></div>`;
}

export function createLoopMatch(ctx) {
  let alive = true;
  let mode = 'home';
  let solo = freshSolo();
  let pvp = freshPvp();
  let confirmNew = false;
  let soloNewBest = false;
  let soloSnap = null;
  let pvpSnap = null;
  let pvpSaved = false;

  function bag() {
    return normalizeBag(ctx.getState()?.loop);
  }
  function saveBag(next) {
    const st = ctx.getState();
    if (!st) return;
    ctx.commit({ ...st, loop: next });
  }

  function shootSolo(event) {
    if (solo.done || solo.bih) return;
    const before = bag();
    const wasDone = solo.done;
    solo = applySolo(solo, event);
    if (solo.done && !wasDone) {
      soloSnap = before;
      const res = finishSolo(before, solo, new Date().toISOString());
      soloNewBest = !!res.newBest;
      if (res.recorded) saveBag(res.bag);
    }
  }
  function shootPvp(event) {
    if (pvp.done || pvp.bih) return;
    const before = bag();
    pvp = applyPvp(pvp, event);
    if (pvp.done && !pvpSaved) {
      pvpSnap = before;
      const res = recordPvp(before, pvp, new Date().toISOString());
      pvpSaved = true;
      if (res.recorded) saveBag(res.bag);
    }
  }

  function shotBar(kind) {
    const locked = kind === 'solo' ? (solo.bih || solo.done) : (pvp.bih || pvp.done);
    const dis = locked ? 'disabled' : '';
    const canUndo = (kind === 'solo' ? solo.log.length : pvp.log.length) ? '' : 'disabled';
    const madeSub = kind === 'solo' ? 'CAROM IN' : '+1 AND CONTINUE';
    const missSub = kind === 'solo' ? 'NO BALL' : 'TURN ENDS';
    const bothSub = kind === 'solo' ? 'BALL COUNTS' : 'NO POINT · BALL IN HAND';
    const scrSub = kind === 'solo' ? 'WHITE ONLY' : 'NO POINT · BALL IN HAND';
    return `<div class="resultBar">
      <button type="button" class="rb s3" data-action="loop-shot" data-v="make" ${dis}><b>MADE</b><small>${madeSub}</small></button>
      <button type="button" class="rb miss" data-action="loop-shot" data-v="miss" ${dis}><b>MISS</b><small>${missSub}</small></button>
      <button type="button" class="rb alt" data-action="loop-shot" data-v="make-scratch" ${dis}><b>MADE + SCRATCH</b><small>${bothSub}</small></button>
      <button type="button" class="rb loopScratch" data-action="loop-shot" data-v="scratch" ${dis}><b>SCRATCH</b><small>${scrSub}</small></button>
      <button type="button" class="rb undo wide" data-action="loop-undo" ${canUndo}><b>UNDO LAST SHOT</b></button>
    </div>`;
  }

  function confirmBlock() {
    if (!confirmNew) return '';
    return `<div class="loopConfirm"><p>Start a new game? Personal best and history stay.</p>
      <button type="button" class="bigBtn" data-action="loop-new-yes">NEW GAME</button>
      <button type="button" class="bigBtn alt" data-action="loop-new-no">KEEP PLAYING</button></div>`;
  }

  function render() {
    if (!alive) return;
    const b = bag();
    const pb = b.personalBest;
    if (mode === 'how') {
      ctx.root.innerHTML = `<div class="playScreen tableMatch loopGame" data-table-game="loop" data-loop-mode="how">${head('LOOP', 'HOW TO PLAY')}<div class="playBody">${howHtml()}</div></div>`;
      return;
    }
    if (mode === 'solo') {
      const bih = solo.bih && !solo.done;
      ctx.root.innerHTML = `<div class="playScreen tableMatch loopGame" data-table-game="loop" data-loop-mode="solo">
        ${head('LOOP', `${solo.balls}/15`)}
        <div class="playBody">
          <p class="loopKicker">POOL BACKWARDS / CAROM TRAINING</p>
          <div class="ghostScore tmScore loopHero"><div><b>${solo.balls}<small>/15</small></b><span>BALLS</span></div></div>
          <div class="loopGrid">
            ${stat(solo.shots, 'SHOTS')}
            ${stat(solo.misses, 'MISSES')}
            ${stat(solo.scratches, 'SCRATCHES')}
            ${pb == null ? '' : stat(pb, 'PERSONAL BEST')}
          </div>
          ${bih ? `<div class="loopBih" role="status"><b>BALL IN HAND ANYWHERE</b><p>Place the white cue ball, then shoot. Placing it does not add a shot.</p><button type="button" class="bigBtn" data-action="loop-placed">CUE BALL PLACED</button></div>` : ''}
          ${solo.done ? `<div class="resultPanel pass inline">
            ${soloNewBest ? '<p class="loopNew">NEW PERSONAL BEST</p>' : ''}
            <h1>FINAL SCORE ${solo.shots}</h1>
            <div class="loopGrid">
              ${stat(pb == null ? '—' : pb, 'PERSONAL BEST')}
              ${stat(solo.balls, 'BALLS POCKETED')}
              ${stat(solo.shots, 'TOTAL SHOTS')}
              ${stat(solo.misses, 'MISSES')}
              ${stat(solo.scratches, 'SCRATCHES')}
              ${stat(solo.bestStreak, 'BEST SUCCESSFUL CAROM STREAK')}
            </div>
          </div>` : '<p class="muted small">Strike a numbered ball. It must carom off the white and enter the called pocket.</p>'}
          ${confirmBlock()}
          <button type="button" class="bigBtn alt" data-action="loop-new">NEW GAME</button>
        </div>
        ${shotBar('solo')}
      </div>`;
      return;
    }
    if (mode === 'pvp') {
      const bih = pvp.bih && !pvp.done;
      const who = pvp.turn === 0 ? 'PLAYER 1' : 'PLAYER 2';
      ctx.root.innerHTML = `<div class="playScreen tableMatch loopGame" data-table-game="loop" data-loop-mode="pvp">
        ${head('LOOP', 'RACE TO 8')}
        <div class="playBody">
          <p class="loopKicker">POOL BACKWARDS / CAROM TRAINING</p>
          <div class="ghostScore tmScore loopPvp">
            <div class="${!pvp.done && pvp.turn === 0 ? 'loopTurn' : ''}"><b>${pvp.scores[0]}</b><span>PLAYER 1</span></div>
            <em>RACE TO 8</em>
            <div class="${!pvp.done && pvp.turn === 1 ? 'loopTurn' : ''}"><b>${pvp.scores[1]}</b><span>PLAYER 2</span></div>
          </div>
          ${pvp.done ? `<div class="resultPanel pass inline"><h1>PLAYER ${pvp.winner + 1} WINS</h1><p class="muted">${pvp.scores[0]}–${pvp.scores[1]}</p></div>` : `<p class="muted small">${esc(who)} to shoot.${pvp.bih ? '' : ' A miss is from the table, not ball in hand.'}</p>`}
          ${bih ? `<div class="loopBih" role="status"><b>${esc(who)} · BALL IN HAND ANYWHERE</b><p>No point was awarded. Place the white cue ball, then shoot. Placing it does not add a shot.</p><button type="button" class="bigBtn" data-action="loop-placed">CUE BALL PLACED</button></div>` : ''}
          ${confirmBlock()}
          <button type="button" class="bigBtn alt" data-action="loop-new">NEW GAME</button>
        </div>
        ${shotBar('pvp')}
      </div>`;
      return;
    }
    ctx.root.innerHTML = `<div class="playScreen tableMatch loopGame" data-table-game="loop" data-loop-mode="home">
      ${head('LOOP', 'CAROM TRAINING')}
      <div class="playBody">
        <p class="loopKicker">POOL BACKWARDS / CAROM TRAINING</p>
        <p>Strike a numbered object ball. It has to carom off the white cue ball and enter the called pocket.</p>
        ${pb == null ? '' : `<div class="ghostScore tmScore"><div><b>${esc(pb)}</b><span>PERSONAL BEST</span></div></div>`}
        <button type="button" class="bigBtn" data-action="loop-solo">SOLO</button>
        <button type="button" class="bigBtn" data-action="loop-pvp">1 VS 1</button>
        <button type="button" class="bigBtn alt" data-action="loop-how">HOW TO PLAY</button>
      </div>
    </div>`;
  }

  function onAction(action, el) {
    if (!action || !action.startsWith('loop-')) return false;
    if (action === 'loop-home') { mode = 'home'; confirmNew = false; render(); return true; }
    if (action === 'loop-how') { mode = 'how'; confirmNew = false; render(); return true; }
    if (action === 'loop-solo') { mode = 'solo'; confirmNew = false; render(); return true; }
    if (action === 'loop-pvp') { mode = 'pvp'; confirmNew = false; render(); return true; }
    if (action === 'loop-new') { confirmNew = true; render(); return true; }
    if (action === 'loop-new-no') { confirmNew = false; render(); return true; }
    if (action === 'loop-new-yes') {
      confirmNew = false;
      if (mode === 'pvp') {
        pvp = freshPvp();
        pvpSaved = false;
        pvpSnap = null;
      } else {
        solo = freshSolo();
        soloNewBest = false;
        soloSnap = null;
        mode = 'solo';
      }
      render();
      return true;
    }
    if (action === 'loop-placed') {
      if (mode === 'solo') solo = placeSolo(solo);
      else if (mode === 'pvp') pvp = placePvp(pvp);
      render();
      return true;
    }
    if (action === 'loop-undo') {
      if (mode === 'solo' && solo.log.length) {
        solo = undoSolo(solo);
        if (soloSnap && !solo.done) {
          saveBag(soloSnap);
          soloSnap = null;
          soloNewBest = false;
        }
      } else if (mode === 'pvp' && pvp.log.length) {
        pvp = undoPvp(pvp);
        if (pvpSnap && !pvp.done) {
          saveBag(pvpSnap);
          pvpSnap = null;
          pvpSaved = false;
        }
      }
      render();
      return true;
    }
    if (action === 'loop-shot') {
      const ev = el && el.dataset ? el.dataset.v : '';
      if (mode === 'solo') shootSolo(ev);
      else if (mode === 'pvp') shootPvp(ev);
      confirmNew = false;
      render();
      return true;
    }
    return true;
  }

  return { render, onAction, destroy() { alive = false; } };
}
