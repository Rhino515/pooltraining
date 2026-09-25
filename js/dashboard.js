/**
 * Pages: Home, Career, Arcade hub, Game lobby, Boss intro, Profile, Drills (empty-state aware), Settings.
 */
import { nextRankInfo, RANK_NAMES, RANK_REQUIREMENTS, requirementChecklist, nextUp, isBossUnlocked } from './career.js';
import { skillBarsHTML, weakestSkills, recommendations } from './skills.js';
import { drills, drillsByCategory, isDrillUnlocked, CATEGORIES } from './drills.js';
import { maxUnlockedBalls, ghostStats } from './ghost.js';
import { GAMES, getGame, stageSpecs, getStages, getBosses, getBoss } from './games/registry.js';
import * as E from './games/engine.js';
import { renderStageTable } from './games/stageTable.js';
import { esc, speedChip } from './games/recipe.js';
import { stars } from './ui/sheet.js';
import { COACH_LEVELS, COACH_LABEL, coachingLevel } from './games/coaching.js';
import { TABLE_SIZES, CLOTH_SPEEDS, CALIBRATION_SPEEDS, speedLabel, formatSpeed, personalFactor, clothNote } from './games/speed.js';

function nextUpCard(state) {
  const n = nextUp(state);
  return `<div class="card nextUp" data-next-href="${esc(n.href)}">
    <div class="eyebrow">NEXT UP${n.rank ? ` · TOWARD ${esc(n.rank.toUpperCase())}` : ''}</div>
    <h3>${esc(n.title)}</h3>
    ${n.text ? `<p class="muted">${esc(n.text)}</p>` : ''}
    <button type="button" class="bigBtn" data-action="go" data-href="${esc(n.href)}">${esc(n.linkText ? `GO: ${n.linkText}` : 'GO')}</button>
    ${n.remaining ? `<small class="muted">${n.remaining} requirement${n.remaining > 1 ? 's' : ''} left for this rank</small>` : ''}
  </div>`;
}

export function renderHome(state) {
  const info = nextRankInfo(state);
  const pct = Math.round((info.progress || 0) * 100);
  const weak = weakestSkills(state, 3);
  const st = ghostStats(state);
  return `
    <div class="hero card">
      <div>
        <span class="eyebrow">PLAYER CAREER</span>
        <h1>${esc((info.current || 'Rookie').toUpperCase())}</h1>
        <p>Turn real-table practice into a progression game.</p>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="row"><b>${pct}%</b><span>${info.next ? 'Next: ' + esc(info.next) : 'Max Rank'}</span></div>
      </div>
      <div class="rankBadge">${(state.rankIndex || 0) + 1}</div>
    </div>
    ${nextUpCard(state)}
    <div class="dashActions">
      <button type="button" class="dashAction card" data-action="go" data-href="#arcade"><span class="icon">🎯</span><b>Arcade</b><span>${GAMES.length} skill games · ${E.totalStars(state)}★ earned</span></button>
      <button type="button" class="dashAction card" data-action="go" data-href="#ghost"><span class="icon">♚</span><b>Ghost</b><span>Up to ${maxUnlockedBalls(state)}-ball · ${st.pct}% wins</span></button>
      <button type="button" class="dashAction card" data-action="go" data-href="#profile"><span class="icon">▥</span><b>Weakest skills</b><span>${weak.map((w) => `${esc(w.name)} ${w.value}`).join(' · ')}</span></button>
    </div>
    <h2>Skill Ratings</h2>
    <div class="skills card" id="skills">${skillBarsHTML(state)}</div>`;
}

// ------------------------------------------------------------------------------ career
export function renderCareerPage(state) {
  const cur = state.rankIndex || 0;
  const rows = RANK_REQUIREMENTS.slice(1).map((def) => {
    const i = def.rank;
    const list = requirementChecklist(i, state);
    const met = list.filter((c) => c.met).length;
    const status = i <= cur ? 'earned' : i === cur + 1 ? 'current' : 'locked';
    const boss = getBosses().find((b) => b.rank === i);
    const bossUnlocked = boss && isBossUnlocked(state, boss);
    return `<div class="rank card ${status === 'locked' ? 'locked' : ''} ${status === 'current' ? 'current' : ''}" data-rank="${i}">
      <div class="num">${i + 1}</div>
      <div><h3>${esc(def.name)}</h3><p>${status === 'earned' ? 'Earned ✓' : `${met}/${list.length} requirements`}</p>
      ${status === 'current' ? `<ul class="reqList">${list.map((c) => `<li class="${c.met ? 'met' : 'open'}" data-req="${esc(c.type)}:${esc(c.game || c.balls || c.rank || '')}" data-met="${c.met ? 1 : 0}">${c.met ? '✓' : '○'} ${esc(c.label)}${c.type === 'gameLevel' || c.type === 'stars' || c.type === 'pb' ? ` <small>(${c.progress.have}/${c.progress.need})</small>` : ''}${!c.met && c.type !== 'boss' ? ` <button type="button" class="miniBtn" data-action="go" data-href="${esc(c.link.href)}">Go</button>` : ''}${c.type === 'boss' && !c.met ? (bossUnlocked ? ` <button type="button" class="miniBtn" data-action="go" data-href="#boss/${boss.id}">Fight</button>` : ' <small>(unlocks when the rest are met)</small>') : ''}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="status">${status === 'earned' ? 'EARNED' : status === 'current' ? 'IN PROGRESS' : 'LOCKED'}</div>
    </div>`;
  });
  return `<div class="title"><span class="eyebrow">CAREER MODE</span><h1>${esc(RANK_NAMES[cur])}</h1><p>Concrete achievements unlock each rank's Boss Battle. Beat the boss to promote — XP never promotes by itself.</p></div>
    ${nextUpCard(state)}
    <h2>Ranks</h2><div class="ranklist">${rows.join('')}</div>`;
}

// ------------------------------------------------------------------------------ arcade
function gameCard(state, g) {
  const unlocked = E.isGameUnlocked(state, g.id);
  const total = g.special === 'ghost' ? 7 : stageSpecs(g.id).length;
  const lvl = E.gameLevel(state, g.id);
  const st = E.totalStars(state, g.id);
  const pb = E.gameState(state, g.id).pb?.highScore || 0;
  const gs = g.special === 'ghost' ? ghostStats(state) : null;
  return `<button type="button" class="gameCard card ${unlocked ? '' : 'locked'}" data-action="go" data-href="${g.special === 'ghost' ? '#ghost' : `#game/${g.id}`}" data-game="${g.id}" data-locked="${unlocked ? 0 : 1}">
    <span class="gcIcon">${g.icon}</span>
    <span class="gcMain"><b>${esc(g.name)}</b><small>${esc(g.tagline)}</small>
      <span class="gcStats">${unlocked ? `<span>LVL ${lvl}/${total}</span>${g.special === 'ghost' ? `<span>${gs.pct}% WINS</span><span>${gs.won} WON</span>` : `<span>${st}/${total * 3}★</span><span>PB ${pb}</span>`}` : `<span class="lock">🔒 ${esc(E.unlockLabel(g.id))}</span>`}</span>
    </span>
    <span class="gcProg"><i style="width:${Math.round((lvl / total) * 100)}%"></i></span>
  </button>`;
}

export function renderArcade(state) {
  return `<div class="title"><span class="eyebrow">ARCADE</span><h1>Skill Games</h1><p>Replay any unlocked stage for stars, streaks and personal bests. Every result feeds your skill ratings.</p></div>
    <div class="arcadeGrid">${GAMES.map((g) => gameCard(state, g)).join('')}</div>`;
}

export function renderGameLobby(state, gameId) {
  const g = getGame(gameId);
  if (!g) return '<div class="card empty"><p>Unknown game.</p></div>';
  const unlocked = E.isGameUnlocked(state, gameId);
  const gs = E.gameState(state, gameId);
  const specs = stageSpecs(gameId);
  const active = state.activeSession && state.activeSession.gameId === gameId ? state.activeSession : null;
  const rows = specs.map((s, i) => {
    const rec = gs.stages?.[s.id];
    const open = E.isStageUnlocked(state, gameId, s.id);
    return `<button type="button" class="stageRow card ${open ? '' : 'locked'} ${rec?.passed ? 'passed' : ''}" data-action="${open ? 'go' : 'locked-stage'}" data-href="#play/${gameId}/${s.id}" data-stage="${s.id}" data-open="${open ? 1 : 0}">
      <span class="srNum">${i + 1}</span>
      <span class="srMain"><b>${esc(s.name)}</b><small>${esc((s.instructions || '').slice(0, 90))}${(s.instructions || '').length > 90 ? '…' : ''}</small></span>
      <span class="srSide">${open ? `${stars(rec?.bestStars || 0)}<small>${rec ? `Best ${rec.bestScore}` : 'New'}</small>` : '<span class="lock">🔒</span>'}</span>
    </button>`;
  });
  const endless = g.endless ? (E.isEndlessUnlocked(state, gameId) ? `<button type="button" class="stageRow card endless" data-action="go" data-href="#play/${gameId}/endless" data-stage="endless"><span class="srNum">∞</span><span class="srMain"><b>Endless Mode</b><small>Random bank layouts, rising difficulty, 3 lives.</small></span><span class="srSide"><small>Best ${gs.pb?.endlessBest || 0}</small></span></button>` : `<div class="stageRow card locked"><span class="srNum">∞</span><span class="srMain"><b>Endless Mode</b><small>Pass the final stage to unlock.</small></span><span class="srSide lock">🔒</span></div>`) : '';
  const hist = (gs.sessions || []).slice(-6).reverse().map((h) => `<div class="historyRow"><span>${esc(specs.find((s) => s.id === h.stageId)?.name || (h.stageId === 'endless' ? 'Endless' : h.stageId))}</span><span class="${h.passed ? 'green' : 'muted'}">${h.passed ? 'PASS' : '—'} ${h.score}</span><span class="muted">${new Date(h.date).toLocaleDateString()}</span></div>`).join('');
  const cal = gameId === 'speed' ? calibrationCard(state) : '';
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#arcade">‹ Arcade</button><span class="eyebrow">${g.icon} ${esc(g.name.toUpperCase())}</span><h1>${esc(g.name)}</h1><p>${esc(g.tagline)}</p></div>
    ${!unlocked ? `<div class="card lockNote">🔒 Locked — reach <b>${esc(E.unlockLabel(gameId))}</b> to play.</div>` : ''}
    ${active ? `<div class="card resumeCard"><b>Session in progress</b><p class="muted">${esc(specs.find((s) => s.id === active.stageId)?.name || 'Endless')} · ${active.attempts.length} shots recorded</p><button type="button" class="bigBtn" data-action="go" data-href="#play/${gameId}/${active.stageId}">RESUME</button></div>` : ''}
    <div class="card stats"><div><b>${E.gameLevel(state, gameId)}/${specs.length}</b><span>LEVEL</span></div><div><b>${E.totalStars(state, gameId)}★</b><span>STARS</span></div><div><b data-pb>${gs.pb?.highScore || 0}</b><span>HIGH SCORE</span></div></div>
    ${cal}
    <h2>Stages</h2><div class="stageList">${rows.join('')}${endless}</div>
    <h2>History</h2><div class="card history">${hist || '<p class="muted">No sessions yet.</p>'}</div>`;
}

function calibrationCard(state) {
  const cal = state.speedCal || {};
  const has = Object.keys(cal.factors || {}).length;
  return `<div class="card calCard"><div class="eyebrow">YOUR SPEED CALIBRATION</div>
    ${has ? CALIBRATION_SPEEDS.map((s) => { const f = personalFactor(cal, s); const list = cal.results?.[formatSpeed(s)] || []; return `<div class="calRow"><span>${speedLabel(s)}</span><span>${list.length ? `${list[list.length - 1].actual.toFixed(2)} L` : '—'}</span><span class="${Math.abs(f - 1) < 0.06 ? 'green' : 'gold'}">${list.length ? (Math.abs(f - 1) < 0.06 ? 'on target' : f > 1 ? 'short' : 'long') : ''}</span></div>`; }).join('') : '<p class="muted">Not calibrated yet — play the Calibration stage.</p>'}
    <p class="muted small">${esc(clothNote(cal))}</p></div>`;
}

// ------------------------------------------------------------------------------ boss intro
export function renderBossPage(state, bossId) {
  const b = getBoss(bossId);
  if (!b) return '<div class="card empty"><p>Unknown boss.</p></div>';
  const unlocked = isBossUnlocked(state, b);
  const rec = state.bosses?.[bossId];
  const beaten = rec?.passed;
  const active = state.activeSession?.bossId === bossId;
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">BOSS BATTLE · RANK ${b.rank + 1} ${esc(RANK_NAMES[b.rank].toUpperCase())}</span><h1>${esc(b.name)}</h1><p>${esc(b.intro)}</p></div>
    <div class="card bossIntro">
      <p class="muted">Pass/fail is computed from your recorded shot results only. ${b.passShots ? `Pass at least ${b.passShots} of ${b.shots.length} stations.` : 'Every station must be passed.'}</p>
      <div class="bossShots">${b.shots.map((s, i) => `<div class="bsRow"><span class="srNum">${i + 1}</span><span><b>${esc(s.title)}</b><small>${esc(s.skill)} · ${s.mode === 'zone' ? `${s.need}★ in ${s.attempts}` : `${s.need} of ${s.attempts}`}</small></span></div>`).join('')}</div>
      ${beaten ? '<p class="green">✓ Defeated</p>' : ''}
      ${rec?.lastWeak?.length && !rec.lastPassed ? `<p class="muted">Last attempt — weak areas: ${rec.lastWeak.map(esc).join(', ')}</p>` : ''}
      ${unlocked || beaten ? `<button type="button" class="bigBtn" data-action="go" data-href="#bossplay/${b.id}">${active ? 'RESUME BATTLE' : 'START BOSS BATTLE'}</button>` : `<p class="lockNote">🔒 Unlocks when you are ${esc(RANK_NAMES[b.rank - 1])} and every other ${esc(RANK_NAMES[b.rank])} requirement is met.</p>`}
    </div>`;
}

// ------------------------------------------------------------------------------ profile
export function renderProfile(state) {
  const recs = recommendations(state, 3);
  const st = ghostStats(state);
  const passedStages = GAMES.filter((g) => !g.special).reduce((a, g) => a + E.gameLevel(state, g.id), 0);
  return `<div class="title"><span class="eyebrow">PLAYER PROFILE</span><h1>${esc(RANK_NAMES[state.rankIndex || 0])}</h1><p>Ratings are computed from your saved results: stages passed, stars, success rates, drills, Ghost matches and boss shots — weighted by difficulty and recency.</p></div>
    <div class="card stats"><div><b>${state.xp || 0}</b><span>XP</span></div><div><b>${passedStages}</b><span>STAGES PASSED</span></div><div><b>${E.totalStars(state)}★</b><span>STARS</span></div></div>
    <h2>Skill Ratings</h2>
    <div class="skills card" id="profileSkills">${skillBarsHTML(state)}</div>
    <h2>Recommended Training</h2>
    <div class="recList">${recs.map((r) => `<div class="card recCard" data-skill="${esc(r.name)}"><div class="eyebrow">${esc(r.name.toUpperCase())} — CURRENT RATING ${r.value}</div>${r.rec ? `<p>Recommended: <b>${esc(r.rec.text)}</b></p><button type="button" class="bigBtn" data-action="go" data-href="${esc(r.rec.href)}">TRAIN ${esc(r.name.toUpperCase())}</button>` : '<p class="muted">Unlock more games to train this skill.</p>'}</div>`).join('')}</div>
    <h2>Ghost</h2>
    <div class="card stats"><div><b>${st.pct}%</b><span>WIN RATE</span></div><div><b>${st.won}</b><span>WON</span></div><div><b>${maxUnlockedBalls(state)}</b><span>MAX BALLS</span></div></div>
    <button type="button" class="bigBtn alt" data-action="go" data-href="#settings">SETTINGS & CALIBRATION</button>`;
}

// ------------------------------------------------------------------------------ drills
export function renderDrillsPage(state, filter = 'All') {
  if (!drills.length) {
    return `<div class="title"><span class="eyebrow">DRILL LIBRARY</span><h1>Drills</h1></div>
      <div class="card empty drillsEmpty" data-empty="1"><div class="emptyIcon">◎</div><h3>No drills loaded yet.</h3><p class="muted">Your drills will appear here once added. Each drill gets the table diagram, Shot Recipe, contact diagram and Why This Shot? automatically.</p><button type="button" class="bigBtn" data-action="go" data-href="#arcade">PLAY THE ARCADE MEANWHILE</button></div>`;
  }
  const by = drillsByCategory();
  const cats = ['All', ...CATEGORIES.filter((c) => by[c])];
  const list = filter === 'All' ? drills : by[filter] || [];
  return `<div class="title"><span class="eyebrow">DRILL LIBRARY</span><h1>Drills</h1></div>
    <div class="catFilter">${cats.map((c) => `<button type="button" class="chip${c === filter ? ' active' : ''}" data-action="drill-filter" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="grid">${list.map((d) => { const rec = state.games?.drills?.stages?.[d.id]; const open = isDrillUnlocked(d, state); return `<div class="drill card ${open ? '' : 'locked'}"><div class="diagramWrap mini">${renderStageTable(d, { className: 'table-diagram mini' })}</div><span class="tag">${esc(d.category)}</span><h3>${esc(d.name)}</h3><p>${esc(d.instructions || d.goal || '')}</p>${speedChip(d.speed)}<button type="button" class="${rec?.passed ? 'done' : ''}" data-action="go" data-href="#play/drills/${esc(d.id)}" ${open ? '' : 'disabled'}>${rec?.passed ? 'Passed ✓ — Train again' : 'Train'}</button></div>`; }).join('')}</div>`;
}

// ------------------------------------------------------------------------------ settings
export function renderSettings(state) {
  const cal = state.speedCal || {};
  const coach = state.settings?.coaching || 'auto';
  return `<div class="title"><span class="eyebrow">SETTINGS</span><h1>Settings</h1></div>
    <div class="card settingsCard">
      <div class="eyebrow">COACHING LEVEL</div>
      <p class="muted small">Auto picks the level from your rating in each game's main skill (now: ${esc(COACH_LABEL[coachingLevel({ ...state, settings: { coaching: 'auto' } }, { primarySkill: 'Position Play' })])} for position games).</p>
      <div class="chips">${['auto', ...COACH_LEVELS].map((l) => `<button type="button" class="chip${coach === l ? ' active' : ''}" data-action="set-coach" data-v="${l}">${l === 'auto' ? 'Auto' : COACH_LABEL[l]}</button>`).join('')}</div>
      <ul class="hookList"><li><b>Beginner</b>: aim, contact, speed, spin, route and zone shown.</li><li><b>Intermediate</b>: route line and aim note hidden.</li><li><b>Advanced</b>: layout + zone only — plan it, lock your answer, then compare.</li><li><b>Expert</b>: sometimes only the goal text.</li></ul>
    </div>
    <div class="card settingsCard">
      <div class="eyebrow">TABLE & SPEED SCALE</div>
      <div class="chips">${TABLE_SIZES.map((t) => `<button type="button" class="chip${cal.tableSize === t ? ' active' : ''}" data-action="set-table" data-v="${t}">${t}-ft</button>`).join('')}</div>
      <div class="chips">${CLOTH_SPEEDS.map((c) => `<button type="button" class="chip${cal.cloth === c ? ' active' : ''}" data-action="set-cloth" data-v="${c}">${c} cloth</button>`).join('')}</div>
      <p class="muted small">SPEED n ≈ n lengths of total cue-ball travel from an end rail. ${esc(clothNote(cal))}</p>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#play/speed/sp-cal">RUN SPEED CALIBRATION</button>
    </div>
    <div class="card settingsCard"><div class="eyebrow">DATA</div><p class="muted small">Progress is stored on this device (localStorage key poolIQStateV4).</p><button type="button" class="bigBtn danger" data-action="reset-all">RESET ALL PROGRESS</button></div>`;
}
