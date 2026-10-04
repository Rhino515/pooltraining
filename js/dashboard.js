/**
 * Pages: Home, Career, Table Games hub (route #arcade, alias #tablegames), Game lobby, Boss intro, Profile, Drills (empty-state aware), Learn, Settings.
 */
import { nextRankInfo, RANK_NAMES, RANK_REQUIREMENTS, requirementChecklist, nextUp, isBossUnlocked } from './career.js';
import { skillBarsHTML, weakestSkills, recommendations } from './skills.js';
import { allDrills, drillsByCategory, isDrillUnlocked, CATEGORIES, getDrillById, displayDrillTitle, SHELVED_CATEGORIES, HIDDEN_DRILL_CATEGORIES } from './drills.js';
import { ballPocketDrills, ballPocketStatus, BALL_POCKET_TEXT, BALL_POCKET_LEVELS } from './content/ballPocket.js';
import { maxUnlockedBalls, ghostStats } from './ghost.js';
import { GAMES, GHOST_GAME, getGame, stageSpecs, getStages, getBosses, getBoss } from './games/registry.js';
import * as E from './games/engine.js';
import { renderStageTable } from './games/stageTable.js';
import { esc, speedChip } from './games/recipe.js';
import { stars } from './ui/sheet.js';
import { careerHeaderHTML, tierCapsHTML, gateCardHTML, promotionCardHTML, drillRankCardHTML, skillBreakdownHTML, recommendedHTML, profileHeaderHTML, devSeedBannerHTML, starsHTML, masteryOf } from './ui/progression.js';
import { careerStatus, promotionStatus, drillRankStatus } from './progression/rank.js';
import { rankBadgeSVG, drillBadgeSVG } from './progression/badge.js';
import { stageItem, drillItem } from './progression/catalog.js';
import { RANK_LADDER } from './progression/config.js';
import { getProfile } from './profile.js';
import { loadFriends, activePlayers } from './friends/model.js';
import { COACH_LEVELS, COACH_LABEL, coachingLevel } from './games/coaching.js';
import { TABLE_SIZES, CLOTH_SPEEDS, CALIBRATION_SPEEDS, speedLabel, formatSpeed, personalFactor, clothNote, calLookup } from './games/speed.js';
import { learnHTML } from './learn.js';
import { isDrillHidden } from './drills/hidden.js';
import { examBannerHTML, accomplishmentHTML } from './content/buExam.js';
import { safetyBannerHTML } from './content/safetyMaster.js';
import { ownerAccountSignedIn } from './dev/dev.js';
import { homeAuthHTML } from './ui/account.js';
export { homeAuthHTML };

function nextUpCard(state) {
  const n = nextUp(state);
  return `<div class="card nextUp homeNext" data-next-href="${esc(n.href)}">
    <span class="nxPhoto" aria-hidden="true"></span>
    <div class="nxIn">
      <div class="eyebrow">NEXT UP${n.rank ? ` · TOWARD ${esc(n.rank.toUpperCase())}` : ''}</div>
      <h3>${esc(n.title)}</h3>
      ${n.text ? `<p class="muted">${esc(n.text)}</p>` : ''}
      <button type="button" class="bigBtn" data-action="go" data-href="${esc(n.href)}">${esc(n.linkText ? `GO: ${n.linkText}` : 'GO')}</button>
      ${n.remaining ? `<small class="muted">${n.remaining} requirement${n.remaining > 1 ? 's' : ''} left for this rank</small>` : ''}
    </div>
  </div>`;
}

function homeExtrasHTML(x = {}) {
  const last = x.backup?.lastText || x.nudge?.lastText || 'never';
  let out = `<div class="card homeBackup" data-home-backup>
    <span class="bkIco" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M5 3h10.2L21 8.8V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h1zm1 2v5h9V5H6zm1 8h10v7H7v-7zm8-6h2v3h-2V7z"/></svg></span>
    <span class="nudgeText"><b>Back up your progress</b><small>Last backup: ${esc(last)}. One tap saves a file you can restore on any phone.</small></span>
    <button type="button" class="bkBtn" data-action="backup-now">BACK UP</button>
  </div>`;
  if (x.install) out += `<div class="card nudgeCard installNudge" data-nudge="install"><span class="nudgeIcon">⤓</span><span class="nudgeText"><b>Install Pool IQ</b><small>${x.install === 'ios' ? 'Share → Add to Home Screen: full-screen, offline, safer storage.' : 'Full-screen, works offline, safer storage.'}</small></span><button type="button" class="miniAct nudgeGo" data-action="install-app">INSTALL</button><button type="button" class="nudgeX" data-action="install-dismiss" aria-label="Dismiss install tip">×</button></div>`;
  return out;
}

export function renderLearn(args = []) {
  return learnHTML(args);
}


function homeRanksCard(state) {
  const cs = careerStatus(state);
  const dr = drillRankStatus(state);
  const bp = ballPocketStatus(state);
  const level = cs.champion ? 'MAX RANK' : `LEVEL ${cs.ball}`;
  return `<button type="button" class="card homeRanks" data-home-ranks data-action="go" data-href="#profile">
    <span class="hrTop"><span class="eyebrow">YOUR RANKS</span><span class="hrView">View Profile ›</span></span>
    <span class="hrGrid">
      <span class="hrCareer">
        ${rankBadgeSVG(cs, { size: 124 })}
        <span class="hrLevel">${esc(level)}</span>
        <span class="hrRankName">${esc(cs.name)}</span>
      </span>
      <span class="hrSide">
        <span class="hrRow hrDrill">
          ${drillBadgeSVG(dr.number, { tile: true, max: dr.max, title: dr.name })}
          <span class="hrMeta"><span class="k">Drill Rank</span><span class="lv">Lv. ${dr.number}</span><span class="nm"><span class="drRankNo">${dr.number}</span> ${esc(dr.name)}</span></span>
          <span class="hrChev" aria-hidden="true">›</span>
        </span>
        <span class="hrRow">
          ${ballPocketBadgeSVG(bp.current)}
          <span class="hrMeta"><span class="k">Ball Pocketing Rank</span><span class="lv gold">Lv. ${bp.current}</span></span>
          <span class="hrChev" aria-hidden="true">›</span>
        </span>
      </span>
    </span>
  </button>`;
}

function quickAccessHTML() {
  const tiles = [
    ['#arcade', './icons/qa-table.png', 'Table Games', '8/9/10/Ultimate<br>Bank Pool'],
    ['#drills', './icons/qa-drills.png', 'Drills', 'Career Drills<br>&amp; Training'],
    ['#sim', './icons/qa-sim.png', 'Simulator', 'Runouts ·<br>Layouts · Shots'],
    ['#learn', './icons/qa-learn.png', 'Learn', 'Fundamentals<br>How to Play<br>Rules']
  ];
  return `<h2 class="qaTitle">QUICK ACCESS</h2><div class="quickAccess">${tiles.map(([href, src, name, sub]) => `<button type="button" class="qaTile" data-action="go" data-href="${href}"><img src="${src}" alt=""/><b>${esc(name)}</b><small>${sub}</small><span class="qaChev" aria-hidden="true">›</span></button>`).join('')}</div>`;
}

export function renderHome(state, extras = {}) {
  // Sign in / Register is the header chip (homeAuthHTML), not a card on this page.
  return `${devSeedBannerHTML(state)}
    ${homeRanksCard(state)}
    ${nextUpCard(state)}
    ${homeExtrasHTML(extras)}
    ${quickAccessHTML()}`;
}

function weakText(state) {
  const w = weakestSkills(state, 1)[0];
  void w;
  const ps = promotionStatus(state);
  const open = (ps.open || [])[0];
  return open ? open.label : 'Train your weakest skills';
}
function friendsText() {
  const d = loadFriends();
  const n = activePlayers(d).filter((p) => !p.isMe).length;
  return n ? `${n} friend${n > 1 ? 's' : ''} · ${d.matches.length} match${d.matches.length === 1 ? '' : 'es'}` : 'Head-to-head, groups & tournaments';
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
      <div><h3>${esc(def.name)} <small class="muted rkBalls">${RANK_BALLS_TEXT(i)}</small></h3><p>${status === 'earned' ? 'Earned ✓' : `${met}/${list.length} requirements`}</p>
      ${(() => { const bp = list.find((c) => c.type === 'ballPocket'); return bp && status !== 'current' ? `<p class="bpReq ${bp.met ? 'met' : 'open'}" data-req="ballPocket:${bp.level}" data-met="${bp.met ? 1 : 0}">${bp.met ? '✓' : '○'} ${esc(bp.label)} <small>(${bp.progress.have}/${bp.progress.need})</small></p>` : ''; })()}
      ${status === 'current' ? `<ul class="reqList">${list.map((c) => `<li class="${c.met ? 'met' : 'open'}" data-req="${esc(c.type)}:${esc(c.game || c.balls || c.rank || c.level || '')}" data-met="${c.met ? 1 : 0}">${c.met ? '✓' : '○'} ${esc(c.label)}${c.type === 'gameLevel' || c.type === 'stars' || c.type === 'pb' || c.type === 'ballPocket' ? ` <small>(${c.progress.have}/${c.progress.need})</small>` : ''}${!c.met && c.type !== 'boss' ? ` <button type="button" class="miniBtn" data-action="go" data-href="${esc(c.link.href)}">Go</button>` : ''}${c.type === 'boss' && !c.met ? (bossUnlocked ? ` <button type="button" class="miniBtn" data-action="go" data-href="#boss/${boss.id}">Fight</button>` : ' <small>(unlocks when the rest are met)</small>') : ''}</li>`).join('')}</ul>` : ''}
      </div>
      <div class="status">${status === 'earned' ? 'EARNED' : status === 'current' ? 'IN PROGRESS' : 'LOCKED'}</div>
    </div>`;
  });
  const cs = careerStatus(state);
  return `${devSeedBannerHTML(state)}<div class="title"><span class="eyebrow">CAREER MODE</span><h1>${esc(RANK_NAMES[cur])}</h1><p>Rank XP fills the ball levels inside each rank (the ball is your level). Skill Gates hold the ball until foundations are passed. Beat the rank's Promotion Test (Boss Battle) to promote — XP never promotes by itself.</p></div>
    ${careerHeaderHTML(state, { link: false })}
    ${gateCardHTML(state)}
    ${promotionCardHTML(state)}
    ${nextUpCard(state)}
    ${tierCapsHTML(state)}
    <div class="chLinks"><button type="button" class="chip" data-action="go" data-href="#training">Recommended Training</button><button type="button" class="chip" data-action="go" data-href="#skills">Skill Breakdown</button><button type="button" class="chip" data-action="go" data-href="#champion">${cs.champion ? 'Champion Stats' : 'Road to Champion'}</button></div>
    <h2>Ranks</h2><div class="ranklist">${rows.join('')}</div>`;
}


const RANK_BALLS_TEXT = (i) => { const b = RANK_LADDER.balls[i]; return b ? `· ${b} balls` : '· MAX RANK'; };

// ------------------------------------------------------------------------------ Table Games (internal id: arcade)
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
      <span class="gcStats">${unlocked ? `<span>LVL ${lvl}/${total}</span>${g.special === 'ghost' ? `<span>${gs.pct}% WINS</span><span>${gs.won} GAMES</span>` : `<span>${st}/${total * 3}★</span><span>PB ${pb}</span>`}` : `<span class="lock">🔒 ${esc(E.unlockLabel(g.id))}</span>`}</span>
    </span>
    <span class="gcProg"><i style="width:${Math.round((lvl / total) * 100)}%"></i></span>
  </button>`;
}

const TABLE_MATCHES = [
  ['8', '8-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['9', '9-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['10', '10-Ball', 'Rack counter. Optional timer, off until you turn it on.'],
  ['bank', 'Bank Pool', 'WPA bank pool. Short rack to 5, full rack to 8. Optional timer.'],
  ['upusa', 'Ultimate Pool USA', '30-minute match clock. 30-second shot clock.'],
  ['loop', 'Loop', 'POOL BACKWARDS / CAROM TRAINING'],
  ['straight', 'Straight Pool', 'WPA 14.1. Called shot to a score.'],
  ['onepocket', 'One Pocket', 'WPA one pocket. First to 8, race to racks.'],
  ['cribbage', 'Cribbage', 'Pairs that add to 15. First to 5.']
];
export function renderArcade(state) {
  const matches = TABLE_MATCHES.map(([id, name, sub]) => `<button type="button" class="gameCard card" data-action="go" data-href="#tgame/${id}" data-game="${esc(id)}"><span class="gcIcon">${id === 'upusa' ? '⏱' : id === 'bank' ? '▣' : id === 'loop' ? '↺' : id === 'straight' ? '14' : id === 'onepocket' ? '1P' : id === 'cribbage' ? '15' : id}</span><span class="gcMain"><b>${esc(name)}</b><small>${esc(sub)}</small></span></button>`).join('');
  const ghost = `<button type="button" class="gameCard card" data-action="go" data-href="#ghost" data-game="ghost"><span class="gcIcon">${GHOST_GAME.icon}</span><span class="gcMain"><b>${esc(GHOST_GAME.name)}</b><small>${esc(GHOST_GAME.tagline)} Includes 8-Ball Ghost.</small></span></button>`;
  return `<div class="title"><span class="eyebrow">TABLE GAMES</span><h1>At the table</h1><p>Rack counters for real games. Training modes are in Drills, under Career Drills.</p></div>
    <button type="button" class="card simPromo friendsPromo" data-action="go" data-href="#friends"><span class="simPromoIcon">⚔</span><span class="simPromoText"><b>Play with Friends</b><small>Score real matches head-to-head.</small></span><span class="simPromoGo">›</span></button>
    ${ghost}
    <div class="arcadeGrid" data-table-matches>${matches}</div>`;
}

export function renderGameLobby(state, gameId) {
  const g = getGame(gameId);
  if (!g) return '<div class="card empty"><p>Unknown game.</p></div>';
  const unlocked = E.isGameUnlocked(state, gameId);
  const gs = E.gameState(state, gameId);
  const specs = stageSpecs(gameId);
  const active = state.activeSession && state.activeSession.gameId === gameId ? state.activeSession : null;
  let currentSet = false;
  // v12: each stage row leads with a small table thumbnail (the stage's own layout), like the mockup's level list
  const fullStages = Object.fromEntries(getStages(gameId).map((x) => [x.id, x]));
  const thumb = (id) => {
    try {
      const st = fullStages[id];
      return st && st.kind !== 'calibration' ? renderStageTable(st, { className: 'table-diagram srThumbSvg' }) : '';
    } catch {
      return '';
    }
  };
  const rows = specs.map((s, i) => {
    const rec = gs.stages?.[s.id];
    const open = E.isStageUnlocked(state, gameId, s.id);
    // v12: the first open, not-yet-passed stage gets the gold "current level" ring
    const current = open && !rec?.passed && !currentSet;
    if (current) currentSet = true;
    return `<button type="button" class="stageRow card ${open ? '' : 'locked'} ${rec?.passed ? 'passed' : ''}${current ? ' current' : ''}" data-action="${open ? 'go' : 'locked-stage'}" data-href="#play/${gameId}/${s.id}" data-stage="${s.id}" data-open="${open ? 1 : 0}">
      ${(() => { const t = thumb(s.id); return `<span class="srLead${t ? ' hasThumb' : ''}">${t}<span class="srNum">${i + 1}</span></span>`; })()}
      <span class="srMain"><b>${esc(displayDrillTitle(s.name))}</b><small>${esc((s.instructions || '').slice(0, 90))}${(s.instructions || '').length > 90 ? '…' : ''}</small></span>
      <span class="srSide">${open ? `${stars(rec?.bestStars || 0)}<small>${rec ? `Best ${rec.bestScore}` : 'New'}</small>${rec ? starsHTML(masteryOf(state, stageItem(gameId, s, i).key)) : ''}` : '<span class="lock">🔒</span>'}</span>
    </button>`;
  });
  const endless = g.endless ? (E.isEndlessUnlocked(state, gameId) ? `<button type="button" class="stageRow card endless" data-action="go" data-href="#play/${gameId}/endless" data-stage="endless"><span class="srNum">∞</span><span class="srMain"><b>Endless Mode</b><small>Random bank layouts, rising difficulty, 3 lives.</small></span><span class="srSide"><small>Best ${gs.pb?.endlessBest || 0}</small></span></button>` : `<div class="stageRow card locked"><span class="srNum">∞</span><span class="srMain"><b>Endless Mode</b><small>Pass the final stage to unlock.</small></span><span class="srSide lock">🔒</span></div>`) : '';
  const hist = (gs.sessions || []).slice(-6).reverse().map((h) => `<div class="historyRow"><span>${esc(displayDrillTitle(specs.find((s) => s.id === h.stageId)?.name || (h.stageId === 'endless' ? 'Endless' : h.stageId)))}</span><span class="${h.passed ? 'green' : 'muted'}">${h.passed ? 'PASS' : '—'} ${h.score}</span><span class="muted">${new Date(h.date).toLocaleDateString()}</span></div>`).join('');
  const cal = gameId === 'speed' ? calibrationCard(state) + threeLaneCard(state) : '';
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">${g.icon} ${esc(g.name.toUpperCase())}</span><h1>${esc(g.name)}</h1><p>${esc(g.tagline)}</p></div>
    ${!unlocked ? `<div class="card lockNote">🔒 Locked — reach <b>${esc(E.unlockLabel(gameId))}</b> to play.</div>` : ''}
    ${active ? `<div class="card resumeCard"><b>Session in progress</b><p class="muted">${esc(displayDrillTitle(specs.find((s) => s.id === active.stageId)?.name || 'Endless'))} · ${active.attempts.length} shots recorded</p><button type="button" class="bigBtn" data-action="go" data-href="#play/${gameId}/${active.stageId}">RESUME</button></div>` : ''}
    <div class="card stats"><div><b>${E.gameLevel(state, gameId)}/${specs.length}</b><span>LEVEL</span></div><div><b>${E.totalStars(state, gameId)}★</b><span>STARS</span></div><div><b data-pb>${gs.pb?.highScore || 0}</b><span>HIGH SCORE</span></div></div>
    ${cal}
    <h2>Stages</h2><div class="stageList">${rows.join('')}${endless}</div>
    <h2>History</h2><div class="card history">${hist || '<p class="muted">No sessions yet.</p>'}</div>`;
}

/** v11.1: the Three-Lane Speed Exercise lives in the Drills library (Drill XP / Drill Rank) and is linked here */
function threeLaneCard(state) {
  const d = getDrillById('three-lane-speed');
  if (!d) return '';
  const rec = state.games?.drills?.stages?.[d.id];
  return `<div class="card threeLaneCard" data-three-lane>
    <div class="eyebrow">DRILL · NEXT TO THE LADDER</div>
    <div class="diagramWrap mini">${renderStageTable(d, { className: 'table-diagram mini' })}</div>
    <h3>${esc(displayDrillTitle(d.name))}</h3>
    <p class="muted small">Three lanes from the first diamond: SPEED 1.50, 2.50 and 3.00. 5 attempts per lane, 7★ in every lane to pass. Earns XP and Drill Rank.</p>
    <small class="muted credit">${esc(d.credit)}</small>
    ${rec ? `<small class="pbLine">Best ${rec.bestScore || 0} pts · ${rec.tries || 0} session${rec.tries === 1 ? '' : 's'}${rec.passed ? ' · passed ✓' : ''}</small>` : ''}
    <button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${esc(d.id)}">${rec?.passed ? 'TRAIN AGAIN' : 'START THE EXERCISE'}</button>
  </div>`;
}

function calibrationCard(state) {
  const cal = state.speedCal || {};
  const has = Object.keys(cal.factors || {}).length;
  return `<div class="card calCard"><div class="eyebrow">YOUR SPEED CALIBRATION</div>
    ${has ? CALIBRATION_SPEEDS.map((s) => { const f = personalFactor(cal, s); const list = calLookup(cal.results, s) || []; return `<div class="calRow"><span>${speedLabel(s)}</span><span>${list.length ? `${list[list.length - 1].actual.toFixed(2)} L` : '—'}</span><span class="${Math.abs(f - 1) < 0.06 ? 'green' : 'gold'}">${list.length ? (Math.abs(f - 1) < 0.06 ? 'on target' : f > 1 ? 'short' : 'long') : ''}</span></div>`; }).join('') : '<p class="muted">Not calibrated yet — play the Calibration stage.</p>'}
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
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">PROMOTION TEST · BOSS BATTLE · RANK ${b.rank + 1} ${esc(RANK_NAMES[b.rank].toUpperCase())}</span><h1>${esc(b.name)}</h1><p>${esc(b.intro)}</p></div>
    <div class="card bossIntro">
      <p class="muted">Pass/fail is computed from your recorded shot results only. ${b.passShots ? `Pass at least ${b.passShots} of ${b.shots.length} stations.` : 'Every station must be passed.'}</p>
      <div class="bossShots">${b.shots.map((s, i) => `<div class="bsRow"><span class="srNum">${i + 1}</span><span><b>${esc(s.title)}</b><small>${esc(s.skill)} · ${s.mode === 'zone' ? `${s.need}★ in ${s.attempts}` : `${s.need} of ${s.attempts}`}</small></span></div>`).join('')}</div>
      ${beaten ? '<p class="green">✓ Defeated</p>' : ''}
      ${rec?.lastWeak?.length && !rec.lastPassed ? `<p class="muted">Last attempt — weak areas: ${rec.lastWeak.map(esc).join(', ')}</p>` : ''}
      ${unlocked || beaten ? `<button type="button" class="bigBtn" data-action="go" data-href="#bossplay/${b.id}">${active ? 'RESUME BATTLE' : 'START BOSS BATTLE'}</button>` : `<p class="lockNote">🔒 Unlocks when you are ${esc(RANK_NAMES[b.rank - 1])} and every ${esc(RANK_NAMES[b.rank])} promotion requirement is met.</p>`}
    </div>
    ${!unlocked && !beaten && (state.rankIndex || 0) === b.rank - 1 ? promotionCardHTML(state, { full: true }) : ''}`;
}

// ------------------------------------------------------------------------------ profile
export function renderProfile(state) {
  const recs = recommendations(state, 3);
  const st = ghostStats(state);
  const passedStages = GAMES.filter((g) => !g.special).reduce((a, g) => a + E.gameLevel(state, g.id), 0);
  void recs;
  const cs = careerStatus(state);
  return `${devSeedBannerHTML(state)}${profileHeaderHTML(state, getProfile())}
    ${careerHeaderHTML(state, { compact: true })}
    ${drillRankCardHTML(state, { compact: true })}
    ${accomplishmentHTML(state)}
    <div class="card stats"><div><b>${(state.prog?.lifetimeXp ?? state.xp) || 0}</b><span>LIFETIME XP</span></div><div><b>${passedStages}</b><span>STAGES PASSED</span></div><div><b>${E.totalStars(state)}★</b><span>STARS</span></div></div>
    <div class="chLinks"><button type="button" class="chip" data-action="go" data-href="#me/stats">My Stats</button><button type="button" class="chip" data-action="go" data-href="#skills">Skill Breakdown</button><button type="button" class="chip" data-action="go" data-href="#champion">${cs.champion ? 'Champion Stats' : 'Road to Champion'}</button><button type="button" class="chip" data-action="go" data-href="#friends">Friends & PvP</button><button type="button" class="chip lbChip" data-action="go" data-href="#leaderboard">🏆 Friends Leaderboard</button><button type="button" class="chip" data-action="go" data-href="#account">Online Account</button></div>
    <h2>Skill Breakdown</h2>
    <div class="skills card" id="profileSkills">${skillBreakdownHTML(state)}</div>
    <h2>Recommended Training</h2>
    <div class="recList">${recommendedHTML(state, 3)}</div>
    <h2>Ghost</h2>
    <div class="card stats"><div><b>${st.pct}%</b><span>WIN RATE</span></div><div><b>${st.won}</b><span>GAMES WON</span></div><div><b>${maxUnlockedBalls(state)}</b><span>MAX BALLS</span></div></div>
    <button type="button" class="bigBtn alt" data-action="go" data-href="#settings">SETTINGS & CALIBRATION</button>`;
}

// ------------------------------------------------------------------------------ drills
/** Wide photo button. Cropped so the face, the cue, and the ball stay in the short card. */
function coursesCardHTML() {
  return `<button type="button" class="coursesCard" data-action="go" data-href="#courses" data-courses="1"><img src="./images/courses/efren-reyes.jpg" alt="" width="1400" height="530"/><span class="coursesLabel">Drill Sets & Exams</span></button>`;
}

export function renderCoursesPage() {
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">DRILL LIBRARY</span><h1>Drill Sets & Exams</h1></div>
    ${examBannerHTML()}
    ${safetyBannerHTML()}`;
}

export function renderDrillsPage(state, filter = 'All', bpViewLevel = null) {
  const list0 = allDrills().filter((d) => d.custom || !isDrillHidden(d.id));
  const head = `<div class="title drillsTitle"><span class="eyebrow">DRILL LIBRARY</span><h1>Drills</h1></div>
    ${coursesCardHTML()}
    ${drillRankCardHTML(state)}
    <div class="drillTools"><div class="drillBig"><button type="button" class="bigBtn createDrill" data-action="drill-create">＋ CREATE DRILL</button><button type="button" class="bigBtn myContentBtn" data-action="go" data-href="#content">▤ MY CONTENT<small>import .pooliq · packs · lessons · games</small></button></div>
    <div class="drillFileBtns"><button type="button" class="chip" data-action="drill-import">⤒ Import drills</button>${list0.some((d) => d.custom) ? '<button type="button" class="chip" data-action="drill-export">⤓ Export all</button>' : ''}</div></div>`;
  if (!list0.length) {
    return `${head}
      <div class="card empty drillsEmpty" data-empty="1"><div class="emptyIcon">◎</div><h3>No drills yet.</h3><p class="muted">Build your own: place the balls on the true-scale table, choose the pocket and cue-ball zone, and Pool IQ works out the route, recipe and Why This Shot? — then it plays like every other drill, with scoring and history.</p><button type="button" class="bigBtn" data-action="drill-create">CREATE YOUR FIRST DRILL</button><button type="button" class="bigBtn alt" data-action="go" data-href="#content">IMPORT .POOLIQ CONTENT</button><button type="button" class="bigBtn alt" data-action="go" data-href="#sim">OPEN THE SHOT SIMULATOR</button></div>`;
  }
  const by = drillsByCategory();
  const extraCats = Object.keys(by).filter((c) => c && !CATEGORIES.includes(c) && c !== 'Career Drills').sort();
  const keepEmpty = new Set([...SHELVED_CATEGORIES].filter((c) => !HIDDEN_DRILL_CATEGORIES.has(c)));
  keepEmpty.add('Safeties');
  const cats = ['All', 'Career Drills', ...CATEGORIES.filter((c) => !HIDDEN_DRILL_CATEGORIES.has(c) && (by[c] || keepEmpty.has(c))), ...extraCats.filter((c) => !HIDDEN_DRILL_CATEGORIES.has(c))];
  const career = filter === 'Career Drills';
  const pocket = filter === 'Ball Pocketing';
  const list = pocket || career ? [] : (filter === 'All' ? list0.filter((d) => d.category !== 'Ball Pocketing') : by[filter] || []);
  const emptyNote = !pocket && !career && filter !== 'All' && !list.length ? '<p class="muted emptyCat">No drills in this category.</p>' : '';
  return `${head}
    <div class="catFilter">${cats.map((c) => `<button type="button" class="chip${c === filter ? ' active' : ''}" data-action="drill-filter" data-v="${esc(c)}">${esc(displayDrillTitle(c))}</button>`).join('')}</div>
    ${career ? careerDrillsHTML(state) : ''}
    ${pocket ? ballPocketCategory(state, bpViewLevel) + ballPocketExtras(state) : ''}
    ${emptyNote}
    ${list.length ? `<div class="grid">${list.map((d) => drillCard(state, d)).join('')}</div>` : ''}
    `;
}

const CAREER_DRILL_GAMES = () => GAMES.filter((g) => g.special !== 'ghost');
function careerDrillsHTML(state) {
  return `<section class="careerDrills" data-section="Career Drills"><h2>Career Drills</h2><div class="arcadeGrid">${CAREER_DRILL_GAMES().map((g) => gameCard(state, g)).join('')}</div></section>`;
}

/** Ball Pocketing emblem: one cue tile per level. 1–3 wood, 4–5 carbon. Levels stay numbers. */
function ballPocketBadgeSVG(level) {
  const lv = Math.max(1, Math.min(5, Number(level) || 1));
  return `<img class="bpCue rankCue" src="./icons/rank-cue-${lv}.png" alt="Ball Pocketing level ${lv}" data-bp-cue="${lv}"/>`;
}

function ballPocketExtras(state) {
  const extra = allDrills().filter((d) => d.category === 'Ball Pocketing' && d.level == null && !isDrillHidden(d.id));
  if (!extra.length) return '';
  return `<section class="ballPocketExtra" data-section="Ball Pocketing exams"><h3>Exam drills</h3><p class="muted small">Not a Ball Pocketing level. These are not locked and do not change that rank.</p><div class="grid">${extra.map((d) => drillCard(state, d)).join('')}</div></section>`;
}
function ballPocketCategory(state, bpViewLevel) {
  const status = ballPocketStatus(state);
  const viewing = BALL_POCKET_LEVELS.includes(Number(bpViewLevel)) ? Number(bpViewLevel) : status.current;
  const list = ballPocketDrills().filter((d) => d.level === viewing && !isDrillHidden(d.id));
  const done = list.filter((d) => state.games?.drills?.stages?.[d.id]?.passed).length;
  const locked = viewing > status.current;
  const text = BALL_POCKET_TEXT[viewing] || '';
  const next = status.complete ? 'Every level is at bronze or better.' : (status.done >= status.total ? '' : `Bronze or better on every Level ${status.current} drill opens Level ${Math.min(5, status.current + 1)}.`);
  const chips = BALL_POCKET_LEVELS.map((lv) => `<button type="button" class="chip${lv === viewing ? ' active' : ''}" data-action="bp-level" data-v="${lv}">${lv === status.current ? 'Level ' : ''}${lv}${lv === status.current ? ' · now' : ''}</button>`).join('');
  return `<section class="ballPocket" id="ball-pocketing" data-section="Ball Pocketing" data-bp-level="${status.current}" data-bp-view="${viewing}">
    <div class="bpRank card">
      <div class="bpRankHead">
        <div class="bpBadge" data-bp-badge="${status.current}" aria-hidden="true">${ballPocketBadgeSVG(status.current)}</div>
        <div>
          <div class="eyebrow">BALL POCKETING · CURRENT LEVEL</div>
          <div class="bpRankNum">LEVEL ${status.current}</div>
          <p>${status.complete ? 'All five levels are finished.' : `${status.done} of ${status.total} drills at bronze or better.`}</p>
          <p class="muted small">${esc(next)}</p>
        </div>
      </div>
      <div class="bpBadgeRow">${BALL_POCKET_LEVELS.map((lv) => `<span class="bpMini${lv === status.current ? ' on' : ''}${lv < status.current || status.complete ? ' earned' : ''}" data-bp-badge="${lv}">${ballPocketBadgeSVG(lv)}</span>`).join('')}</div>
      <div class="bpLevels">${chips}</div>
    </div>
    <h3 class="bpLevel">${esc(list[0]?.levelLabel || `LEVEL ${viewing}`)}${locked ? ' · locked' : ''}</h3>
    <p class="bpCopy">${esc(text)}</p>
    <p class="muted small">${done} of ${list.length} on this level at bronze or better.${locked ? ' Finish the current level to train these.' : ''}</p>
    <div class="grid">${list.map((d) => drillCard(state, d, { locked })).join('')}</div>
  </section>`;
}
function drillCard(state, d, opts = {}) {
  const rec = state.games?.drills?.stages?.[d.id];
  const open = isDrillUnlocked(d, state) && !opts.locked;
  const meta = `${d.custom ? '<span class="tag mine">MY DRILL</span> ' : ''}${d.contentUid ? `<span class="tag imp" data-badge="${d.imported ? 'imported' : 'custom'}">${d.imported ? 'IMPORTED' : 'MY CONTENT'}</span> ` : ''}<span class="tag">${esc(displayDrillTitle(d.category))}</span>${d.difficulty ? ` <span class="tag">Level ${d.difficulty}</span>` : ''}`;
  const ms = rec ? masteryOf(state, drillItem(d).key) : 0;
  const pb = rec ? `<small class="pbLine">${starsHTML(ms)} Best ${rec.bestScore || 0} pts${rec.bestStars ? ` · ${'★'.repeat(rec.bestStars)}` : ''} · ${rec.tries || 0} session${rec.tries === 1 ? '' : 's'}${rec.passed ? ' · passed ✓' : ''}</small>` : '';
  const del = ownerAccountSignedIn() ? `<button type="button" class="miniAct danger" data-action="drill-del" data-id="${esc(d.id)}">Delete</button>` : '';
  const tools = d.custom ? `<div class="drillBtns"><button type="button" class="miniAct" data-action="drill-edit" data-id="${esc(d.id)}">Edit</button><button type="button" class="miniAct" data-action="drill-dup" data-id="${esc(d.id)}">Duplicate</button><button type="button" class="miniAct" data-action="drill-history" data-id="${esc(d.id)}">History</button><button type="button" class="miniAct" data-action="drill-export" data-id="${esc(d.id)}">Export</button>${del}</div>` : d.contentUid ? `<div class="drillBtns"><button type="button" class="miniAct" data-action="go" data-href="#cview/${esc(d.contentUid)}">My Content</button><button type="button" class="miniAct" data-action="go" data-href="#cedit/${esc(d.contentUid)}">Edit</button><button type="button" class="miniAct" data-action="drill-history" data-id="${esc(d.id)}">History</button></div>` : '';
  return `<div class="drill card ${open ? '' : 'locked'}" data-drill="${esc(d.id)}"><div class="diagramWrap mini">${renderStageTable(d, { className: 'table-diagram mini' })}</div>${meta}<h3>${esc(displayDrillTitle(d.name))}</h3><p>${esc(d.goal || d.instructions || '')}</p>${d.lanes ? `<div class="laneChips">${d.lanes.map((l) => speedChip(l.speed)).join('')}</div>` : (typeof d.speed === 'number' ? speedChip(d.speed) : '')}${d.credit ? `<small class="muted credit">${esc(d.credit)}</small>` : ''}${pb}<button type="button" class="${rec?.passed ? 'done' : ''}" data-action="go" data-href="#play/drills/${esc(d.id)}" ${open ? '' : 'disabled'}>${rec?.passed ? 'Passed ✓ — Train again' : 'Train'}</button>${tools}</div>`;
}

// ------------------------------------------------------------------------------ settings
export function renderSettings(state, info = {}) {
  const cal = state.speedCal || {};
  const coach = state.settings?.coaching || 'auto';
  return `<div class="title"><span class="eyebrow">SETTINGS</span><h1>Settings</h1></div>
    ${dataCardHTML(info)}
    ${info.cloudCard || ''}
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
      <p class="muted small">SPEED n = n table lengths of total cue-ball travel, measured from where the cue ball starts (standard start: the first diamond at your end). Quarter steps: 1.25, 1.50, 1.75… ${esc(clothNote(cal))}</p>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#play/speed/sp-cal">RUN SPEED CALIBRATION</button>
    </div>
    <div class="card settingsCard" data-card="profile"><div class="eyebrow">PLAYER PROFILE</div><p class="muted small">Your name and photo (shown on Profile and in friend matches). ${info.signedIn ? 'Saved on this device, in your backups, and synced to your online account (friends see them on the leaderboard).' : 'Stored only on this device and in your backups — until you sign in to an online account.'}</p><button type="button" class="bigBtn alt" data-action="go" data-href="#me">EDIT PROFILE</button></div>
    ${installCardHTML(info)}
    ${ownerAccountSignedIn() ? '<div class="card settingsCard devCard" data-card="dev"><div class="eyebrow">DEV MODE</div><p class="muted small">You are signed in as the owner, so these tools are already on. There is no passcode.</p><button type="button" class="bigBtn alt" data-action="go" data-href="#dev">DEV MODE</button></div>' : ''}
    <div class="card settingsCard dangerCard"><div class="eyebrow">DANGER ZONE</div><p class="muted small">Clears stages, Ghost matches, bosses, calibration and rank. A snapshot is taken first, so it can be undone from “Restore previous snapshot”.</p><button type="button" class="bigBtn danger" data-action="reset-all">RESET ALL PROGRESS</button></div>`;
}

const PERSIST_LABEL = { on: 'ON ✓', off: 'OFF', unsupported: 'not supported', checking: 'checking…' };
function dataCardHTML(info = {}) {
  const p = info.persist || 'checking';
  return `<div class="card settingsCard dataCard" data-card="backup">
      <div class="eyebrow">PROTECT YOUR HISTORY</div>
      <div class="kv"><span>Protected storage</span><b data-persist="${esc(p)}" class="${p === 'on' ? 'green' : p === 'off' ? 'amber' : ''}">${esc(PERSIST_LABEL[p] || p)}</b></div>
      <div class="kv"><span>Storage used</span><b data-estimate>…</b></div>
      <div class="kv"><span>Safety copy (IndexedDB)</span><b data-mirror>…</b></div>
      <div class="kv"><span>Last backup</span><b data-lastbackup="${info.lastBackupAt || 0}" class="${info.backupStale ? 'amber' : 'green'}">${esc(info.lastBackupText || 'never')}</b></div>
      <p class="muted small">Everything — career, sessions, Ghost matches, custom drills, saved shots and settings — is saved on this device and copied to a second store automatically. A backup file keeps it safe if the phone is lost, reset or the app is deleted.</p>
      <button type="button" class="bigBtn" data-action="backup-now">BACK UP NOW</button>
      ${info.canShare ? '<button type="button" class="bigBtn alt" data-action="backup-download">DOWNLOAD FILE INSTEAD</button>' : ''}
      <label class="bigBtn alt fileBtn" data-restore-label>RESTORE FROM BACKUP<input type="file" accept=".json,application/json,text/plain" data-restore-input aria-label="Choose a Pool IQ backup file"/></label>
      <button type="button" class="bigBtn alt" data-action="snap-list">RESTORE PREVIOUS SNAPSHOT <small data-snapcount></small></button>
      <p class="muted small tip">${info.ios ? '<b>iPhone:</b> always open Pool IQ from its Home Screen icon — a Safari tab keeps separate storage, so history made there won’t show in the app. “Back Up Now” → <b>Save to Files</b> (iCloud Drive) keeps a copy off the phone.' : info.android ? '<b>Android:</b> “Back Up Now” saves the file to <b>Downloads</b> (or share it to Google Drive). Installing the app keeps storage safer. <b>iPhone:</b> open Pool IQ from its Home Screen icon — a Safari tab keeps separate storage.' : '<b>iPhone:</b> open Pool IQ from its Home Screen icon — a Safari tab keeps separate storage. <b>Android:</b> backups go to Downloads or Google Drive.'}</p>
    </div>`;
}
function installCardHTML(info = {}) {
  const m = info.install || 'manual';
  if (m === 'installed') return `<div class="card settingsCard" data-card="install" data-install="installed"><div class="eyebrow">APP</div><p class="small"><b class="green">✓ Installed</b> — Pool IQ is running as an app.</p></div>`;
  const label = m === 'ios' ? 'ADD TO HOME SCREEN' : 'INSTALL APP';
  const note = m === 'prompt' ? 'Installs Pool IQ like a normal app: full-screen, offline, and safer storage.' : m === 'ios' ? 'In Safari: Share → Add to Home Screen. Then open Pool IQ from the icon.' : 'Install from your browser menu for a full-screen, offline app with safer storage.';
  return `<div class="card settingsCard" data-card="install" data-install="${esc(m)}"><div class="eyebrow">INSTALL APP</div><p class="muted small">${esc(note)}</p><button type="button" class="bigBtn alt" data-action="install-app">${label}</button></div>`;
}
