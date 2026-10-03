/**
 * Table-game scoring (v14-29).
 * 8-ball, 9-ball, 10-ball: rack counter plus the optional timer, and a rules menu.
 * The menu remembers WPA, BCA, APA, or bar in localStorage only. It does not score racks.
 * Bank Pool: WPA Rules of Play §13, effective 2025-09-15
 *   https://wpapool.com/wp-content/uploads/2026/01/2026.01.02-WPA-Rules.pdf
 * Ultimate Pool USA: UPL League Manual v5.0
 *   https://league.ultimatepoolusa.com/docs/uplmanual.pdf
 */
import { timerHTML } from './shotTimer.js';
import { createLoopMatch } from './loopGame.js';
import { freshStraight, applyStraight, STRAIGHT_TARGETS, freshOnePocket, applyOnePocket } from './wpaScore.js';
import { freshCribbage, applyCribbage, partnerOf } from './cribbageRules.js';
import { lsSet } from '../storage.js';
import { HOW } from '../learn.js';

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
  if (kind === 'straight') return straightScreen(ctx);
  if (kind === 'onepocket') return onePocketScreen(ctx);
  if (kind === 'cribbage') return cribbageScreen(ctx);
  const id = ['8', '9', '10', 'bank', 'upusa'].includes(kind) ? kind : '';
  if (!id) {
    return { render() { ctx.root.innerHTML = '<div class="card empty"><p>Unknown table game.</p></div>'; }, onAction() { return false; }, destroy() {} };
  }
  if (id === 'bank') return bankScreen(ctx);
  if (id === 'upusa') return upusaScreen(ctx);
  return raceScreen(ctx, id);
}

const RULE_KEY = 'poolIQRuleSet';
const RULE_SETS = ['wpa', 'bca', 'apa', 'bar'];
const RULE_NAME = { wpa: 'WPA', bca: 'BCA', apa: 'APA', bar: 'Bar' };
const HOW_ID = {
  8: { wpa: 'wpa:eight', bca: 'bca:eight', apa: 'apa:eight', bar: 'bar:eight' },
  9: { wpa: 'wpa:nine', bca: 'bca:nine', apa: 'apa:nine' },
  10: { wpa: 'wpa:ten', bca: 'bca:ten' }
};
const RULE_STEPS = {
  8: {
    wpa: [
      'Rack 15 balls. The 8 goes in the center. One bottom corner is a solid, the other a stripe. The front ball sits on the foot spot.',
      'Break from behind the head string.',
      'Pocket a ball on the break and you keep shooting, unless you scratch.',
      'The 8 on the break is not a win and not a loss. On a legal break you may spot the 8 and continue, or re-break.',
      'The table stays open after the break. Your group starts when you legally pocket a called ball of that group.',
      'While the table is open, you may hit any ball except the 8 first.',
      'Call the ball and the pocket unless the shot is totally obvious. You do not have to call rails or caroms.',
      'A legal shot hits your ball first, then pockets a ball or drives a ball to a cushion.',
      'A scratch on the break: they may play the balls as they lie, or take the cue ball in the kitchen. From the kitchen it must cross the head string before it hits a ball.',
      'Any other foul is ball in hand anywhere.',
      'You win by pocketing the 8 after your group is clear, with no foul. You lose if you pocket the 8 early, in the wrong pocket, or on a foul, or jump the 8 off the table.'
    ],
    bca: [
      'BCA recognizes the WPA rules. This list is the CSI book, which is what players usually mean by BCA.',
      'Call the ball and the pocket. Your group is solids 1 through 7 or stripes 9 through 15. Clear the group, then the 8.',
      'The table stays open after the break even if balls were made.',
      'Your group is the first ball you legally pocket after the break. A safety does not pick the group.',
      'The 8 on the break is not a win or a loss. With no foul, spot the 8 and continue, or re-rack and break again.',
      'With a foul on that break, they may spot the 8 and take ball in hand anywhere, or re-rack and break.',
      'A foul, including a legal-break foul, is ball in hand anywhere. Only the opening break starts from behind the head string.',
      'If the 8 goes in on a foul, you lose. If you foul while shooting the 8 and it stays up, it is only a foul.',
      'These notes did not find a rule for an 8 that falls on a legal shot while your group is still on the table. That case is not stated here.'
    ],
    apa: [
      'Pocket solids 1 through 7 or stripes 9 through 15, then the 8. In league, mark the pocket for the 8. In Masters it may be called.',
      'The break must hit the head ball or a second-row ball. A soft break is not allowed.',
      'If you legally pocket only solids, or only stripes, on the break, that group is yours. If you make both or neither, the table stays open.',
      'The 8 on the break wins, unless you also scratch, which loses.',
      'Ordinary shots are not called. Slop counts.',
      'A foul on a legal break is ball in hand behind the head string, and the cue ball must hit a ball outside the kitchen. If the break was also illegal, re-rack and they break.',
      'Any other foul is ball in hand anywhere.',
      'The 8 has to be its own shot. Pocketing it early, or with your last ball, loses. A scratch while shooting the 8 loses even if the 8 stays up.',
      'An object ball jumped off the table is spotted, and that is not a foul. Only cue-ball fouls are called. Jump cues are not allowed except in Masters.'
    ],
    bar: [
      'There is no official bar rule set. This is Dr. Dave’s usual set. Ask before you play, because the room can change it.',
      'If you pocket balls on the break, the group with more balls down is yours. If the two groups are equal, the table stays open.',
      'The 8 on the break wins, unless you also scratch or jump the cue ball off the table, which loses.',
      'Call the details that are not a straight-in shot: combinations, kisses, caroms, rail-first hits, kicks, and banks. Skip the call and you lose the turn. The cue ball stays where it is.',
      'A scratch, or the cue ball off the table, is ball in hand in the kitchen. Shoot it out of the kitchen before it touches a ball or a cushion. That includes the break.',
      'If you do not hit your own ball first, you lose the turn. They shoot the cue ball where it lies. No ball in hand.',
      'The 8 cannot be used in a combination or a kiss.',
      'A safety is not allowed unless you are honestly trying to pocket a ball, or to break something out when you have no shot.',
      'A scratch while shooting the 8 loses the game, whether or not the 8 goes in.'
    ]
  },
  9: {
    wpa: [
      'Rack balls 1 through 9 in a diamond. The 1 is in front, on the foot spot. The 9 is in the center.',
      'Break from above the head string. If you pocket nothing, at least four object balls must reach a rail or it is a foul.',
      'Hit the lowest numbered ball first. Nothing has to be called. Slop counts.',
      'Pocket any ball and you keep shooting. Pocketing the 9 wins, even on the break, if the lowest ball was hit first.',
      'After a legal break you may push out. The cue ball may go anywhere. They then choose who shoots.',
      'A scratch on the break is ball in hand for them. Any other standard foul is ball in hand anywhere.',
      'Spot the 9 if it falls on a foul or a push out, or leaves the table. Other balls stay down.',
      'Three fouls in a row loses the rack.'
    ],
    apa: [
      'Balls 1 through 9. Hit the lowest number first. Pocket any ball and you keep shooting.',
      'Legally pocketing the 9 wins. Hitting the lowest ball into the 9 also wins.',
      'In league play, balls 1 through 8 are 1 point each and the 9 is 2 points. Masters does not use that count. There, pocketing the 9 wins the game.',
      'The 9 on the break wins unless you scratch. Then the 9 is spotted and the turn passes.',
      'A foul on a legal break is ball in hand anywhere. Other pocketed balls stay down.',
      'Push-outs are not allowed in handicapped league play. Masters allows a push-out, and any ball pocketed on it is spotted.'
    ],
    bca: [
      'Rack a diamond. The 1 is the apex on the foot spot. The 9 is in the middle. The rest are random.',
      'Break from behind the head string. The cue ball must hit the 1 before any other ball or cushion.',
      'Pocket a ball, or drive at least four object balls to a cushion, or the break is a foul.',
      'Shoot in number order. Pocket any legal ball and you keep shooting.',
      'Pocketing the 9 on a legal shot wins.',
      'A jumped ball stays off the table, except the 9, which comes back.',
      'The rest of the fouls are not on this short page.'
    ],
    bar: [
      'These notes do not have a bar-rules set for this game. The bar notes are for 8-ball only.'
    ]
  },
  10: {
    wpa: [
      'Rack balls 1 through 10 in a triangle. The 1 is the apex on the foot spot. The 10 is in the center.',
      'Break from above the head string. If you pocket nothing, at least four object balls must reach a rail or it is a foul.',
      'After a legal break you may push out, the same way as 9-ball. There is no safety call.',
      'Hit the lowest ball first. On every shot except the break, call the ball and the pocket.',
      'If a ball falls but it was not the called shot, and there is no foul, the other player chooses who shoots next.',
      'The 10 wins only on a called shot when it is the last object ball left.',
      'Spot the 10 if it leaves the table or falls on any shot that is not the win. Other balls stay down.',
      'A foul is ball in hand anywhere. Three fouls in one rack loses the rack.'
    ],
    bca: [
      'Rack a triangle. The 1 is the apex on the foot spot. The 10 is in the middle of the row of three. The 2 and the 3 are the two ends of the last row. The rest are random.',
      'Call the pocket. Shoot the balls in number order.',
      'Win by pocketing the 10 on a legal shot after the break.',
      'Fouls, the push-out, and the full break rules are in the CSI book and are not copied here.'
    ],
    apa: [
      '10-ball is not in the APA booklet these notes used. There is no APA 10-ball list to show.'
    ],
    bar: [
      'These notes do not have a bar-rules set for this game. The bar notes are for 8-ball only.'
    ]
  }
};

function readRuleSets() {
  const base = { 8: 'wpa', 9: 'wpa', 10: 'wpa' };
  try {
    const raw = JSON.parse(localStorage.getItem(RULE_KEY) || '');
    if (!raw || typeof raw !== 'object') return base;
    for (const id of ['8', '9', '10']) {
      if (RULE_SETS.includes(raw[id])) base[id] = raw[id];
    }
  } catch { /* keep the default */ }
  return base;
}

function writeRuleSet(id, set) {
  const all = readRuleSets();
  all[id] = set;
  lsSet(RULE_KEY, JSON.stringify(all));
}

function rulesBlock(id, set) {
  const steps = RULE_STEPS[id][set].map((line) => `<li>${esc(line)}</li>`).join('');
  const howKey = HOW_ID[id][set];
  const lines = howKey && HOW[howKey];
  const more = lines
    ? `<details class="ruleMore"><summary>Full rules</summary>${lines.map((line) => `<p class="ruleLine">${esc(line)}</p>`).join('')}</details>`
    : '';
  const chips = RULE_SETS.map((s) => `<button type="button" class="chip${s === set ? ' active' : ''}" data-action="tg-rule" data-v="${s}">${s === 'bar' ? 'BAR' : RULE_NAME[s]}</button>`).join('');
  return `<div class="ruleMenu"><span class="ruleLab">RULES</span><div class="rulePick">${chips}</div></div>
        <p class="playingSet">Playing ${RULE_NAME[set]} ${id}-ball</p>
        <ol class="gameSteps">${steps}</ol>
        ${more}`;
}

function raceScreen(ctx, id) {
  const name = `${id}-Ball`;
  const ui = { you: 0, opp: 0, race: 5, log: [], rules: readRuleSets()[id] };
  let alive = true;
  function over() { return ui.you >= ui.race || ui.opp >= ui.race; }
  function render() {
    if (!alive) return;
    const done = over();
    const winner = ui.you === ui.opp ? '' : ui.you > ui.opp ? 'You' : 'Opponent';
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="${id}" data-timer="1">
      ${head(name, `Race to ${ui.race}`)}
      <div class="playBody">
        ${rulesBlock(id, ui.rules)}
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
    if (action === 'tg-rule') {
      const set = el.dataset.v;
      if (!RULE_SETS.includes(set) || set === ui.rules) return true;
      ui.rules = set;
      writeRuleSet(id, set);
      render();
      return true;
    }
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
        <ol class="gameSteps">
          <li>Short rack is 9 balls in a diamond, and 5 points wins the rack. Full rack is 15 balls in a triangle, and 8 points wins the rack.</li>
          <li>The lag winner chooses who breaks. Later breaks switch. Cue ball in hand above the head string.</li>
          <li>If the break pockets nothing, at least four object balls must reach a rail, or they can take the table or make you break again.</li>
          <li>Call the ball, the cushions in order, and the pocket. Only that bank counts as 1 point.</li>
          <li>You keep shooting as long as you make a legal bank.</li>
          <li>A miss ends your turn. An extra ball on the same shot does not count. Spot it.</li>
          <li>A foul is minus 1 and your turn ends. If you are at 0, you owe a ball. A scratch is cue ball in hand behind the head string.</li>
          <li>Three fouls in a row and you lose the rack.</li>
          <li>First to the rack score wins the rack. First to the race wins the match.</li>
        </ol>
        <details class="ruleMore"><summary>Full rules</summary>
                <p class="ruleLine"><b>WPA Bank Pool</b> (Rules of Play §13, effective 2025-09-15). Not a full referee. ${esc(ui.rack === 'full' ? 'Fifteen balls, triangle, eight points wins the rack.' : 'Nine balls, diamond, five points wins the rack.')} Lag winner chooses the first break. Later breaks alternate (general rule 1.3). A valid bank is one point. Another ball pocketed on that shot does not count. A miss ends the turn. A standard foul is minus one and the turn passes. Scratch: cue ball in hand behind the head string. Three fouls in a row loses the rack (3.13).</p>
        </details>
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

function straightScreen(ctx) {
  let ui = freshStraight();
  let alive = true;
  function go(action, arg) {
    ui = applyStraight(ui, action, arg);
    render();
  }
  function render() {
    if (!alive) return;
    const done = !!ui.winner;
    const locked = done || ui.needBreakChoice;
    const dis = locked ? 'disabled' : '';
    const extraDis = locked || !ui.canExtra ? 'disabled' : '';
    const breakDis = locked || !ui.opening ? 'disabled' : '';
    const who = ui.turn === 'you' ? 'Your shot.' : 'Opponent’s shot.';
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="straight">
      ${head('Straight Pool', `to ${ui.target}`)}
      <div class="playBody">
        <ol class="gameSteps">
          <li>Rack all 15 numbered balls. The apex goes on the foot spot.</li>
          <li>Lag for who shoots first. The cue ball starts in hand above the head string.</li>
          <li>On the opening break, pocket a called ball, or drive the cue ball and two object balls to a rail. If you do neither, it is minus 2. They can accept the table or make you break again.</li>
          <li>Call the ball and the pocket. That ball is 1 point. Each extra ball on that same legal shot is also 1.</li>
          <li>You keep shooting until you miss, play a safety, or foul.</li>
          <li>A miss ends your turn. A safety ends your turn, and any ball that fell is spotted, not scored.</li>
          <li>A foul or a scratch is minus 1 and your turn ends. A scratch gives them the cue ball in hand above the head string. The score can go below zero.</li>
          <li>A bad opening break is minus 2 only. It does not count toward three fouls.</li>
          <li>Three normal fouls in a row: minus 1, then minus 15 more. Re-rack all 15 and you break again.</li>
          <li>After 14 balls, re-rack those 14 and leave the apex empty. You keep shooting. If the 15th fell on that same shot, re-rack all 15.</li>
          <li>First player to the score you picked wins.</li>
        </ol>
        <details class="ruleMore"><summary>Full rules</summary>
                <p class="ruleLine"><b>WPA 14.1 Continuous</b> (Rules of Play §7, effective 2025-09-15). Not a full referee. Fifteen numbered balls plus the cue ball. A called ball is 1 point, and each other ball pocketed on that same legal shot is 1. First to the chosen score wins. Scores may go negative. The shooter stays until a miss, safety, or foul. Opening break: cue ball in hand above the head string. If no called ball is pocketed, the cue ball and two object balls must each reach a rail, or it is a breaking foul (−2). A breaking foul does not count toward three fouls. If both happen on one shot, it is only the breaking foul. Three standard fouls: −1 for the third, then −15 more, re-rack all 15, and that player shoots an opening break (§7.11). Left out of the buttons: calling the ball, spotting balls, a cue ball or 15th that sits in the rack (§7.8b–d), a stalemate re-lag, and unsportsmanlike conduct. Those stay with the players. Source: WPA Rules of Play, wpapool.com, file 2026.01.02.</p>
        </details>
        <div class="chips">${STRAIGHT_TARGETS.map((n) => `<button type="button" class="chip${n === ui.target ? ' active' : ''}" data-action="st-target" data-v="${n}" ${ui.scored ? 'disabled' : ''}>${n}</button>`).join('')}</div>
        <div class="chips">
          <button type="button" class="chip${ui.breaker === 'you' ? ' active' : ''}" data-action="st-break" data-v="you" ${ui.scored || ui.you || ui.opp || ui.needBreakChoice ? 'disabled' : ''}>YOU BREAK</button>
          <button type="button" class="chip${ui.breaker === 'opp' ? ' active' : ''}" data-action="st-break" data-v="opp" ${ui.scored || ui.you || ui.opp || ui.needBreakChoice ? 'disabled' : ''}>OPPONENT BREAKS</button>
        </div>
        <p class="muted small">${who}${ui.opening ? ' Opening break. Cue ball in hand above the head string.' : ''} Fouls in a row: you ${ui.foulsYou}, opponent ${ui.foulsOpp}. Balls down this rack: ${ui.down} / 14.</p>
        ${ui.rackNote === '14' ? '<div class="rackNote">RE-RACK: rack those 14 with the apex left out. The 15th stays down. The shooter continues.</div>' : ''}
        ${ui.rackNote === '15' ? '<div class="rackNote">RE-RACK: the 15th was pocketed on the same shot as the 14th. All 15 are re-racked (§7.8a). The shooter continues.</div>' : ''}
        ${ui.note ? `<p class="muted small">${esc(ui.note)}</p>` : ''}
        ${ui.needBreakChoice ? '<div class="rackNote"><p>Incoming player chooses.</p><button type="button" class="bigBtn" data-action="st-accept">ACCEPT TABLE</button><button type="button" class="bigBtn alt" data-action="st-rebreak">REQUIRE ANOTHER BREAK</button></div>' : ''}
        <div class="ghostScore tmScore"><div><b>${ui.you}</b><span>YOU</span></div><em>to ${ui.target}</em><div><b>${ui.opp}</b><span>OPPONENT</span></div></div>
        ${done ? `<div class="resultPanel pass inline"><h1>${ui.winner === 'you' ? 'YOU' : 'OPPONENT'} WINS</h1><p class="muted">${ui.you}–${ui.opp}</p></div>` : ''}
      </div>
      <div class="resultBar">
        <button type="button" class="rb s3" data-action="st-point" ${dis}><b>POINT</b><small>+1 · STAY</small></button>
        <button type="button" class="rb s3" data-action="st-extra" ${extraDis}><b>EXTRA</b><small>SAME LEGAL SHOT</small></button>
        <button type="button" class="rb miss" data-action="st-miss" ${dis}><b>MISS</b><small>TURN PASSES</small></button>
        <button type="button" class="rb alt" data-action="st-safety" ${dis}><b>SAFETY</b><small>SPOT ANY BALL</small></button>
        <button type="button" class="rb alt" data-action="st-foul" ${dis}><b>FOUL</b><small>−1 · CUE STAYS</small></button>
        <button type="button" class="rb miss" data-action="st-scratch" ${dis}><b>SCRATCH</b><small>−1 · IN HAND</small></button>
        <button type="button" class="rb wide" data-action="st-bfoul" ${breakDis}><b>BREAK FOUL</b><small>−2 · NOT A THIRD FOUL</small></button>
      </div>
    </div>`;
  }
  function onAction(action, el) {
    if (!action.startsWith('st-')) return false;
    if (action === 'st-target') { go('target', el.dataset.v); return true; }
    if (action === 'st-break') { go('breaker', el.dataset.v); return true; }
    if (action === 'st-accept') { go('accept'); return true; }
    if (action === 'st-rebreak') { go('rebreak'); return true; }
    if (action === 'st-point') { go('point'); return true; }
    if (action === 'st-extra') { go('extra'); return true; }
    if (action === 'st-miss') { go('miss'); return true; }
    if (action === 'st-safety') { go('safety'); return true; }
    if (action === 'st-foul') { go('foul'); return true; }
    if (action === 'st-scratch') { go('scratch'); return true; }
    if (action === 'st-bfoul') { go('break-foul'); return true; }
    return true;
  }
  return { render, onAction, destroy() { alive = false; } };
}

function onePocketScreen(ctx) {
  let ui = freshOnePocket();
  let alive = true;
  function go(action, arg) {
    ui = applyOnePocket(ui, action, arg);
    render();
  }
  function render() {
    if (!alive) return;
    const done = !!ui.winner;
    const dis = done ? 'disabled' : '';
    const yourPocket = ui.pocket === 'left' ? 'left foot' : 'right foot';
    const oppPocket = ui.pocket === 'left' ? 'right foot' : 'left foot';
    const who = ui.turn === 'you' ? 'Your shot.' : 'Opponent’s shot.';
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="onepocket">
      ${head('One Pocket', `race ${ui.race}`)}
      <div class="playBody">
        <ol class="gameSteps">
          <li>Rack all 15 balls with no pattern. The apex goes on the foot spot.</li>
          <li>The lag winner chooses who breaks. Later breaks switch.</li>
          <li>The breaker picks one foot pocket. The other player gets the other one. Cue ball in hand above the head string.</li>
          <li>A ball in your foot pocket is 1 point and you shoot again.</li>
          <li>A ball in their foot pocket is their point and your turn ends.</li>
          <li>A miss ends your turn. Side pockets and the head pockets score nothing. Spot those balls.</li>
          <li>A foul is minus 1 and your turn ends. If you are at 0, you owe a ball instead.</li>
          <li>A scratch is minus 1. They get the cue ball in hand above the head string. A ball that fell in their pocket on the scratch does not count.</li>
          <li>On any other foul, a ball that fell in their pocket does count for them.</li>
          <li>Three fouls in a row and you lose the rack.</li>
          <li>First to 8 wins the rack. First to the race wins the match. If both would reach 8 on your shot, you win the rack.</li>
        </ol>
        <details class="ruleMore"><summary>Full rules</summary>
                <p class="ruleLine"><b>WPA One-Pocket</b> (Rules of Play §12, effective 2025-09-15). Not a full referee. Fifteen object balls, random triangle, apex on the foot spot. Each player has one foot pocket. First to 8 there wins the rack. Lag winner chooses who breaks the first rack. Later breaks alternate. The breaker chooses a foot pocket. Cue ball in hand above the head string. No special break requirement. The turn continues only after a ball in the shooter’s own pocket. A ball in the opponent’s pocket on a foul counts for them and is not spotted, unless the only foul is a cue-ball scratch (§12.5). Side and head pockets are spotted and score nothing. Three standard fouls in a row loses the rack (§12.9). If both would reach 8 on the same shot, the shooter wins (§12.11). Left out of the buttons: spotting balls on the table, a stalemate re-rack, forgetting to spot, and unsportsmanlike conduct. Those stay with the players. Source: WPA Rules of Play, wpapool.com, file 2026.01.02.</p>
        </details>
        <div class="racePick">${RACES.map((r) => `<button type="button" class="chip${r === ui.race ? ' active' : ''}" data-action="op-race" data-v="${r}" ${done ? 'disabled' : ''}>Race ${r}</button>`).join('')}</div>
        <div class="chips">
          <button type="button" class="chip${ui.youBreak ? ' active' : ''}" data-action="op-lag" data-v="you" ${ui.racksYou + ui.racksOpp || ui.rackLive ? 'disabled' : ''}>LAG WINNER BREAKS</button>
          <button type="button" class="chip${!ui.youBreak ? ' active' : ''}" data-action="op-lag" data-v="opp" ${ui.racksYou + ui.racksOpp || ui.rackLive ? 'disabled' : ''}>LAG WINNER GIVES THE BREAK</button>
        </div>
        <div class="chips">
          <button type="button" class="chip${ui.pocket === 'left' ? ' active' : ''}" data-action="op-pocket" data-v="left" ${ui.rackLive ? 'disabled' : ''}>YOU TAKE THE LEFT FOOT POCKET</button>
          <button type="button" class="chip${ui.pocket === 'right' ? ' active' : ''}" data-action="op-pocket" data-v="right" ${ui.rackLive ? 'disabled' : ''}>YOU TAKE THE RIGHT FOOT POCKET</button>
        </div>
        <p class="muted small">${who} ${ui.youBreak ? 'You break this rack.' : 'Opponent breaks this rack.'} Your pocket: ${yourPocket}. Opponent: ${oppPocket}. ${ui.ballInHand ? 'Cue ball in hand above the head string.' : ''} ${ui.owedYou || ui.owedOpp ? `Owed balls: you ${ui.owedYou}, opponent ${ui.owedOpp}.` : ''} Fouls in a row: you ${ui.foulsYou}, opponent ${ui.foulsOpp}.</p>
        ${ui.note ? `<p class="muted small">${esc(ui.note)}</p>` : ''}
        <div class="ghostScore tmScore"><div><b>${ui.you}</b><span>YOU · ${ui.racksYou} RACKS</span></div><em>to 8</em><div><b>${ui.opp}</b><span>OPP · ${ui.racksOpp} RACKS</span></div></div>
        ${done ? `<div class="resultPanel pass inline"><h1>${ui.winner === 'you' ? 'YOU' : 'OPPONENT'} WINS THE MATCH</h1><p class="muted">Race to ${ui.race} racks.</p></div>` : ''}
      </div>
      <div class="resultBar">
        <button type="button" class="rb s3" data-action="op-mine" ${dis}><b>MY POCKET</b><small>+1 · STAY</small></button>
        <button type="button" class="rb miss" data-action="op-theirs" ${dis}><b>THEIR POCKET</b><small>+1 THEM · TURN ENDS</small></button>
        <button type="button" class="rb s3" data-action="op-both" ${dis}><b>BOTH</b><small>YOU +1 AND THEM +1</small></button>
        <button type="button" class="rb miss" data-action="op-miss" ${dis}><b>MISS</b><small>TURN ENDS</small></button>
        <button type="button" class="rb alt" data-action="op-foul" ${dis}><b>FOUL</b><small>−1 · CUE STAYS</small></button>
        <button type="button" class="rb alt" data-action="op-scratch" ${dis}><b>SCRATCH</b><small>−1 · IN HAND</small></button>
        <button type="button" class="rb wide" data-action="op-foul-theirs" ${dis}><b>FOUL + THEIR POCKET</b><small>THEM +1 · YOU −1</small></button>
      </div>
    </div>`;
  }
  function onAction(action, el) {
    if (!action.startsWith('op-')) return false;
    if (action === 'op-race') { go('race', el.dataset.v); return true; }
    if (action === 'op-lag') { go('lag', el.dataset.v); return true; }
    if (action === 'op-pocket') { go('pocket', el.dataset.v); return true; }
    if (action === 'op-mine') { go('mine'); return true; }
    if (action === 'op-theirs') { go('theirs'); return true; }
    if (action === 'op-both') { go('both'); return true; }
    if (action === 'op-miss') { go('miss'); return true; }
    if (action === 'op-foul') { go('foul'); return true; }
    if (action === 'op-scratch') { go('scratch'); return true; }
    if (action === 'op-foul-theirs') { go('foul-theirs'); return true; }
    return true;
  }
  return { render, onAction, destroy() { alive = false; } };
}

function cribbageScreen(ctx) {
  let ui = freshCribbage();
  let alive = true;
  let group = false;
  let queue = [];
  function go(action, arg) {
    ui = applyCribbage(ui, action, arg);
    queue = [];
    group = false;
    render();
  }
  function render() {
    if (!alive) return;
    const done = !!ui.winner || ui.rackOver;
    const wait = ui.needChoice;
    const dis = done || wait ? 'disabled' : '';
    const who = ui.turn === 'you' ? 'Your inning.' : 'Opponent’s inning.';
    const need = ui.on.map((b) => partnerOf(b)).filter((n) => n != null);
    const balls = ui.out.map((n) => `<button type="button" class="chip${queue.includes(n) ? ' active' : ''}" data-action="cr-ball" data-v="${n}" ${dis}>${n}</button>`).join('');
    ctx.root.innerHTML = `<div class="playScreen tableMatch" data-table-game="cribbage">
      ${head('Cribbage', 'first to 5')}
      <div class="playBody">
        <ol class="gameSteps">
          <li>Rack all 15. Put the 15-ball in the center and the apex on the foot spot. No two corner balls may add to 15.</li>
          <li>Open break: pocket a ball, or drive at least four object balls to a rail.</li>
          <li>The pairs are 1 and 14, 2 and 13, 3 and 12, 4 and 11, 5 and 10, 6 and 9, 7 and 8.</li>
          <li>Pocket one ball. Your next shot has to be its partner.</li>
          <li>Pocket the partner and that is 1 cribbage. You keep shooting.</li>
          <li>Miss the partner and it is a foul. Spot that ball. Your turn ends. You do not lose a point.</li>
          <li>The 15 counts only when it is the last ball. If it falls earlier, spot it and keep playing. That is not a foul.</li>
          <li>A miss when you are not on a partner just ends your turn. It is not a foul.</li>
          <li>A foul does not take a point. They choose to shoot the balls as they lie, or take the cue ball in hand behind the head string. A scratch is ball in hand behind the head string, not a choice.</li>
          <li>Three fouls in a row and you lose.</li>
          <li>First to 5 cribbages wins. If the rack runs out and nobody has 5, the rack is over.</li>
        </ol>
        <details class="ruleMore"><summary>Full rules</summary>
                <p class="ruleLine"><b>Cribbage is not in the WPA Rules of Play</b> (file 2026.01.02). Not a full referee. This follows the BCA Official Rules and Record Book (1992, pp. 75–76), the source of the published summary on Wikipedia, Cribbage (pool). Pairs that add to 15: 1+14, 2+13, 3+12, 4+11, 5+10, 6+9, 7+8. The 15 is a cribbage by itself only after every other object ball is pocketed. First to 5 wins. A full rack has 8 cribbages. Rack: 15 in the center, apex on the foot spot, and no two of the three corner balls may add to 15. Open break: pocket a ball or drive at least four object balls to a rail. A cribbage counts only when the two partners are pocketed on successive strokes in the same inning. Fouls do not subtract points. Three successive fouls by the same player loses the game. Left out of the buttons: the open-break check, spotting on the long string, and moving a kitchen ball to the foot spot when every object ball is behind the head string. Those stay with the players.</p>
        </details>
        <p class="muted small">Balls still out: ${ui.out.length}. Tap a number to pocket it. For more than one ball on the same stroke, turn on MORE ON THIS STROKE, tap each ball, then COUNT THIS STROKE.</p>
        <div class="chips cribBalls">${balls || '<span class="muted">No balls left.</span>'}</div>
        <div class="chips">
          <button type="button" class="chip${group ? ' active' : ''}" data-action="cr-group" ${dis}>MORE ON THIS STROKE</button>
          ${group ? `<button type="button" class="chip" data-action="cr-count" ${queue.length ? '' : 'disabled'}>COUNT THIS STROKE${queue.length ? ' · ' + queue.join(',') : ''}</button>` : ''}
        </div>
        ${ui.on.length ? `<div class="rackNote">ON ${ui.on.join(', ')}. NEED ${need.join(' OR ')}.</div>` : '<p class="muted small">Not on a ball.</p>'}
        <p class="muted small">${who} ${ui.ballInHand ? 'Cue ball in hand behind the head string.' : ''} Fouls in a row: you ${ui.foulsYou}, opponent ${ui.foulsOpp}.</p>
        ${ui.note ? `<p class="muted small">${esc(ui.note)}</p>` : ''}
        ${wait ? '<div class="rackNote"><p>Incoming player chooses. Scoring stays off until then.</p><button type="button" class="bigBtn" data-action="cr-pos">SHOOT FROM POSITION</button><button type="button" class="bigBtn alt" data-action="cr-hand">CUE BALL IN HAND BEHIND THE HEAD STRING</button></div>' : ''}
        <div class="ghostScore tmScore"><div><b>${ui.you}</b><span>YOU / 5</span></div><em>—</em><div><b>${ui.opp}</b><span>OPP / 5</span></div></div>
        ${ui.winner ? `<div class="resultPanel pass inline"><h1>${ui.winner === 'you' ? 'YOU' : 'OPPONENT'} WINS</h1><p class="muted">${ui.you}–${ui.opp}</p></div>` : ''}
        ${ui.rackOver ? '<div class="resultPanel inline"><h1>RACK OVER</h1><p>No balls left, and neither player reached 5. There is no re-rack.</p></div>' : ''}
        ${done ? '<button type="button" class="bigBtn alt" data-action="cr-new">NEW GAME</button>' : ''}
      </div>
      <div class="resultBar">
        <button type="button" class="rb miss" data-action="cr-miss" ${dis}><b>MISS</b><small>INNING ENDS</small></button>
        <button type="button" class="rb alt" data-action="cr-foul" ${dis}><b>FOUL</b><small>NO POINT LOST</small></button>
        <button type="button" class="rb miss" data-action="cr-scratch" ${dis}><b>SCRATCH</b><small>IN HAND · NOT OPTIONAL</small></button>
      </div>
    </div>`;
  }
  function onAction(action, el) {
    if (!action.startsWith('cr-')) return false;
    if (action === 'cr-new') {
      ui = freshCribbage();
      queue = [];
      group = false;
      render();
      return true;
    }
    if (action === 'cr-pos') { go('choice', 'position'); return true; }
    if (action === 'cr-hand') { go('choice', 'hand'); return true; }
    if (ui.winner || ui.rackOver || ui.needChoice) return true;
    if (action === 'cr-group') { group = !group; if (!group) queue = []; render(); return true; }
    if (action === 'cr-count') {
      if (queue.length) go('stroke', queue.slice());
      return true;
    }
    if (action === 'cr-ball') {
      const n = Number(el.dataset.v);
      if (group) {
        queue = queue.includes(n) ? queue.filter((x) => x !== n) : queue.concat(n);
        render();
        return true;
      }
      go('stroke', [n]);
      return true;
    }
    if (action === 'cr-miss') { go('miss'); return true; }
    if (action === 'cr-foul') { go('foul'); return true; }
    if (action === 'cr-scratch') { go('scratch'); return true; }
    return true;
  }
  return { render, onAction, destroy() { alive = false; } };
}
