/**
 * v11 progression screens + cards: Career header (ball badge, Rank XP, Lifetime XP, tier caps), Skill Gate,
 * Promotion Test checklist, Drill Rank card, 12-skill breakdown, Skill detail, Recommended Training,
 * Champion (max rank) stats, result-screen XP lines and the Profile header (avatar + name + both ranks).
 */
import { careerStatus, promotionStatus, drillRankStatus, gateStatus, recommendedTraining, trainingFor, championStats, masteryCounts, rankName, CHAMPION_INDEX } from '../progression/rank.js';
import { computeSkillLevels } from '../progression/skillLevels.js';
import { masteryStars, MASTERY_LABEL } from '../progression/award.js';
import { GATES, SKILLS, DRILL_RANK, RANK_LADDER, TIER_LABEL, skillById } from '../progression/config.js';
import { rankBadgeSVG, drillBadgeSVG, ballSVG, avatarHTML } from '../progression/badge.js';
import { displayDrillTitle } from '../drills.js';
import { bossForRank } from '../games/registry.js';
import { isBossUnlocked } from '../career.js';
import { ballPocketStatus } from '../content/ballPocket.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');
const pct = (x) => Math.round(Math.max(0, Math.min(1, x || 0)) * 100);
const tick = (ok) => `<span class="ck ${ok ? 'ok' : 'no'}" aria-label="${ok ? 'done' : 'not done'}">${ok ? '✅' : '❌'}</span>`;
export const starsHTML = (n) => `<span class="mstars" data-mastery="${n}" title="${esc(MASTERY_LABEL(n))}">${n ? '⭐'.repeat(n) : '<span class="muted">—</span>'}</span>`;
export function masteryOf(state, key) {
  return masteryStars(state.prog?.items?.[key]);
}

// ------------------------------------------------------------------ Career header
export function careerHeaderHTML(state, { compact = false, link = true } = {}) {
  const cs = careerStatus(state);
  const next = cs.champion ? null : cs.ball < cs.balls ? `${cs.ball + 1}-Ball` : rankName(cs.rankIndex + 1);
  const barLabel = cs.champion ? 'MAX RANK — Rank XP complete. Lifetime XP keeps counting.' : cs.gateLocked && !cs.gateLocked.atGate ? `Held at the ${esc(cs.gateLocked.gate.title)}` : cs.xpFull ? 'Rank XP complete — pass the Promotion Test' : `${fmt(cs.toNextBall)} XP to ${esc(next)}`;
  return `<div class="card careerHead${cs.champion ? ' champ' : ''}" data-career-rank="${cs.rankIndex}" data-ball="${cs.champion ? 'max' : cs.ball}" ${link ? 'data-action="go" data-href="#career"' : ''}>
    <div class="chBadge">${rankBadgeSVG(cs, { size: compact ? 64 : 84 })}</div>
    <div class="chMain"><span class="eyebrow">CAREER RANK ${cs.rankIndex + 1} / ${RANK_LADDER.names.length}</span>
      <h2 class="chTitle" data-rank-title>${esc(cs.title)}</h2>
      ${cs.champion ? '' : `<div class="xpBar" role="progressbar" aria-valuenow="${pct(cs.ballProgress)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(cs.ballProgress)}%"></i></div>`}
      <small class="chSub">${barLabel}</small>
      <div class="chXp"><span>RANK XP <b data-rank-xp>${cs.champion ? 'MAX' : `${fmt(cs.xp)} / ${fmt(cs.total)}`}</b></span><span>LIFETIME XP <b data-lifetime-xp>${fmt(cs.lifetimeXp)}</b></span></div>
    </div>
  </div>`;
}
export function tierCapsHTML(state) {
  const cs = careerStatus(state);
  return `<div class="card tierCaps" data-tier-caps><div class="eyebrow">TRAINING XP BY DIFFICULTY</div>${cs.tierCaps.map((t) => `<div class="tcRow${t.maxed ? ' maxed' : ''}" data-tier="${t.tier}"><span>${esc(t.label.toUpperCase())} TRAINING XP</span><b>${t.cap == null ? `${fmt(t.have)} · no cap` : `${fmt(Math.min(t.have, t.cap))} / ${fmt(t.cap)}${t.maxed ? ' — MAXED' : ''}`}</b></div>`).join('')}<small class="muted">When a difficulty is MAXED it stops giving Rank XP — harder training keeps you moving. Lifetime XP always counts.</small></div>`;
}

// ------------------------------------------------------------------ Skill Gate
export function gateCardHTML(state) {
  const cs = careerStatus(state);
  const g = cs.gateLocked || cs.gates.find((x) => !x.cleared);
  if (!g) return cs.gates.length ? `<div class="card gateCard cleared" data-gate-state="cleared"><div class="eyebrow">SKILL GATES</div><p class="green">✓ ${cs.gates.length > 1 ? `All ${cs.gates.length} ${esc(cs.name)} Skill Gates cleared` : `${esc(cs.name)} Skill Gate cleared`}</p></div>` : '';
  const locked = cs.gateLocked && !cs.gateLocked.atGate;
  const done = g.foundations.filter((f) => f.met).length;
  return `<div class="card gateCard${locked ? ' locked' : ''}" data-gate="${esc(g.gate.id)}" data-gate-state="${locked ? 'holding' : 'open'}">
    <div class="eyebrow">${locked ? '🔒 SKILL GATE — XP HELD' : `SKILL GATE AT ${g.gate.ball}-BALL`}</div>
    <h3>${esc(g.gate.title)}</h3>
    <p class="muted small">${locked ? `Your Rank XP is past the ${g.gate.ball}-Ball, but the ball stays until these foundations are passed.` : `Before ${esc(cs.name)} · ${g.gate.ball + 1}-Ball you must pass these foundations.`} ${done}/${g.foundations.length} done.</p>
    <button type="button" class="bigBtn${locked ? '' : ' alt'}" data-action="go" data-href="#gate/${esc(g.gate.id)}">OPEN SKILL GATE</button>
  </div>`;
}
export function renderGatePage(state, gateId) {
  const gate = GATES.find((g) => g.id === gateId);
  if (!gate) return '<div class="card empty"><p>Unknown skill gate.</p></div>';
  const gs = gateStatus(state, gate);
  const levels = computeSkillLevels(state);
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">SKILL GATE · ${esc(rankName(gate.rank).toUpperCase())} ${gate.ball}-BALL</span><h1>${esc(gate.title)}</h1><p>${gs.cleared ? 'Cleared — this gate never locks again.' : `Pass these before your ball can go past ${gate.ball}. XP keeps banking while you work on them.`}</p></div>
    <div class="card checkList" data-gate-page="${esc(gate.id)}">${gs.foundations.map((f) => {
      const tr = f.met ? [] : trainingFor(state, f.skill, 2);
      return `<div class="checkRow" data-met="${f.met ? 1 : 0}" data-skill="${esc(f.skill)}">${tick(f.met)}<div class="crMain"><b>${esc(f.label)}</b><small>${f.have}/${f.need} passed · ${esc(levels[f.skill]?.label || '')}</small>${tr.map((t) => `<button type="button" class="miniAct" data-action="go" data-href="${esc(t.href)}">GO: ${esc(t.title)}</button>`).join('')}</div></div>`;
    }).join('')}</div>`;
}

// ------------------------------------------------------------------ Promotion Test
export function promotionCardHTML(state, { full = false } = {}) {
  const ps = promotionStatus(state);
  if (ps.champion) return `<div class="card promoCard champ" data-promo="max"><div class="eyebrow">MAX RANK</div><h3>Champion — every rank earned</h3><button type="button" class="bigBtn alt" data-action="go" data-href="#champion">CHAMPION STATS</button></div>`;
  const boss = bossForRank(ps.to);
  const unlocked = boss ? isBossUnlocked(state, boss) : ps.unlocked;
  const list = full ? ps.items : [...ps.items.filter((x) => !x.met).slice(0, 4), ...ps.items.filter((x) => x.met).slice(0, full ? 99 : 0)];
  return `<div class="card promoCard${unlocked ? ' ready' : ''}" data-promo="${unlocked ? 'unlocked' : 'locked'}">
    <div class="eyebrow">${unlocked ? '🔓 PROMOTION TEST UNLOCKED' : '🔒 PROMOTION TEST LOCKED'}</div>
    <h3>${esc(rankName(ps.to - 1))} → ${esc(ps.toName)}${boss ? ` · ${esc(boss.name)}` : ''}</h3>
    <p class="muted small">${ps.met}/${ps.items.length} requirements met. The Promotion Test is this rank's Boss Battle — pass it to promote.</p>
    ${unlocked ? '' : `<div class="checkList">${list.map(checkRowHTML).join('')}</div>${!full && ps.open.length > 4 ? `<small class="muted">+${ps.open.length - 4} more</small>` : ''}`}
    ${unlocked && boss ? `<button type="button" class="bigBtn" data-action="go" data-href="#boss/${esc(boss.id)}">START PROMOTION TEST</button>` : ''}
    ${full ? '' : '<button type="button" class="bigBtn alt" data-action="go" data-href="#promo">FULL CHECKLIST</button>'}
  </div>`;
}
function checkRowHTML(it) {
  const prog = it.have != null && it.need != null && typeof it.have === 'number' ? ` <small>(${fmt(it.have)}/${fmt(it.need)})</small>` : it.have != null && typeof it.have === 'string' ? ` <small>(now ${esc(it.have)})</small>` : '';
  return `<div class="checkRow" data-met="${it.met ? 1 : 0}" data-type="${esc(it.type)}">${tick(it.met)}<div class="crMain"><b>${esc(it.label)}</b>${prog}</div>${it.met ? '' : `<button type="button" class="miniAct go" data-action="go" data-href="${esc(it.href)}">GO</button>`}</div>`;
}
export function renderPromoPage(state) {
  const ps = promotionStatus(state);
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">PROMOTION TEST</span><h1>${ps.champion ? 'Max rank' : `To ${esc(ps.toName)}`}</h1><p>Rank XP alone never promotes. Everything below must be ✅, then pass the Promotion Test.</p></div>${promotionCardHTML(state, { full: true })}`;
}

// ------------------------------------------------------------------ Drill Rank
export function drillRankCardHTML(state, { compact = false, tile = false } = {}) {
  const dr = drillRankStatus(state);
  return `<div class="card drillRankCard${dr.max ? ' max' : ''}${tile ? ' drTileCard' : ''}" data-drill-rank="${dr.number}" data-action="go" data-href="#drillrank">
    <div class="drBadge">${drillBadgeSVG(dr.number, { size: compact ? 56 : 68, max: dr.max, tile })}</div>
    <div class="drMain"><span class="eyebrow drEyebrow">DRILL RANK ${dr.number} / ${DRILL_RANK.ranks.length}</span><h3 data-drill-rank-name><span class="drRankNo">${dr.number}</span> ${esc(dr.name)}</h3>
      ${dr.max ? '<small class="gold">MAX DRILL RANK</small>' : `<div class="drBar"><i style="width:${pct(dr.progress)}%"></i></div><small class="muted">Next: ${esc(dr.next)} · ${pct(dr.progress)}%</small>`}
      <div class="drCounts"><span>⭐ <b data-dr-passed>${dr.have.passed}</b> passed</span><span>⭐⭐ <b data-dr-strong>${dr.have.strong}</b> strong</span><span>⭐⭐⭐ <b data-dr-mastered>${dr.have.mastered}</b> mastered</span><span><b>${fmt(dr.have.xp)}</b> Drill XP</span></div>
    </div>
  </div>`;
}
export function renderDrillRankPage(state) {
  const dr = drillRankStatus(state);
  const rows = DRILL_RANK.ranks.map((r, i) => `<div class="drRow drTileRow${i < dr.number ? ' earned' : ''}${i === dr.index + 1 ? ' next' : ''}" data-dr-row="${i + 1}"><span class="drNum">${drillBadgeSVG(i + 1, { tile: true, max: i === DRILL_RANK.ranks.length - 1 })}</span><span class="drInfo"><b><span class="drRankNo">${i + 1}</span> ${esc(r.name)}</b><small>${i ? `${fmt(r.xp)} XP · ${r.passed} passed · ${r.strong} strong · ${r.mastered} mastered${r.categories ? ` · ${r.categories} skill categories` : ''}` : 'Start'}</small></span><span class="drState">${i < dr.number ? '✓' : ''}</span></div>`).join('');
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">DRILL RANK</span></div>
    ${drillRankCardHTML(state, { tile: true })}
    ${dr.reqs.length ? `<div class="card checkList"><div class="eyebrow">TO REACH ${esc(dr.next.toUpperCase())}</div>${dr.reqs.map((q) => `<div class="checkRow" data-met="${q.met ? 1 : 0}">${tick(q.met)}<div class="crMain"><b>${esc(q.label)}</b> <small>(${fmt(q.have)}/${fmt(q.need)})</small></div></div>`).join('')}</div>` : ''}
    <h2>All Drill Ranks</h2><div class="card drRanks">${rows}</div>`;
}

// ------------------------------------------------------------------ skills
export function skillBreakdownHTML(state, { link = true, only = null } = {}) {
  const lv = computeSkillLevels(state);
  return Object.values(lv).filter((s) => !s.hidden && (!only || only.includes(s.id))).map((s) => `<div class="skill skillRow${s.core ? '' : ' secondary'}" data-skill="${esc(s.id)}" ${link ? `data-action="go" data-href="#skill/${esc(s.id)}"` : ''}><span class="skName">${esc(s.name)}<small class="lvl" data-level>${esc(s.label)}</small></span><div class="meter"><i style="width:${s.score}%"></i></div><b>${s.score}</b></div>`).join('');
}
export function renderSkillsPage(state) {
  const shown = SKILLS.filter((s) => !s.hidden);
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#profile">‹ Profile</button><span class="eyebrow">SKILL BREAKDOWN</span><h1>${shown.length} Skills</h1><p>Each skill has its own level on the Career ladder (e.g. “Shooter 7”), from passes, mastery and difficulty in the content that trains it. The number is the 0–100 rating.</p></div>
    <h2>Core skills</h2><div class="skills card">${skillBreakdownHTML(state, { only: shown.filter((s) => s.core).map((s) => s.id) })}</div>
    <h2>Secondary skills</h2><div class="skills card">${skillBreakdownHTML(state, { only: shown.filter((s) => !s.core).map((s) => s.id) })}</div>`;
}
export function renderSkillPage(state, skillId) {
  const s = skillById(skillId);
  if (!s) return '<div class="card empty"><p>Unknown skill.</p></div>';
  const lv = computeSkillLevels(state)[s.id];
  const tr = trainingFor(state, s.id, 6);
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#skills">‹ Skills</button><span class="eyebrow">SKILL · ${s.core ? 'CORE' : 'SECONDARY'}</span><h1>${esc(s.long || s.name)}</h1><p>${esc(s.desc || '')}</p></div>
    <div class="card skillHero" data-skill-page="${esc(s.id)}"><div class="shBall">${lv.champion ? rankBadgeSVG({ champion: true }, { size: 64 }) : ballSVG(lv.ball, { size: 64 })}</div><div><span class="eyebrow">LEVEL</span><h2>${esc(lv.label)}</h2><small class="muted">Rating ${lv.score}/100 · ${lv.played} item${lv.played === 1 ? '' : 's'} played · highest tier passed: ${esc(TIER_LABEL[lv.ceiling] || 'none')}</small></div></div>
    <div class="card stats"><div><b>${lv.passesAtTier.beginner}</b><span>PASSED</span></div><div><b>${lv.passesAtTier.intermediate}</b><span>INTERMEDIATE+</span></div><div><b>${lv.passesAtTier.advanced}</b><span>ADVANCED+</span></div></div>
    <h2>Train ${esc(s.name)}</h2><div class="recList">${tr.length ? tr.map((t) => `<button type="button" class="card trainRow" data-action="go" data-href="${esc(t.href)}"><b>${esc(displayDrillTitle(t.title))}</b><small>${esc(t.sub)}</small><span>›</span></button>`).join('') : '<p class="muted">Unlock more games or import drills that train this skill.</p>'}</div>`;
}

// ------------------------------------------------------------------ Recommended Training
export function recommendedHTML(state, n = 3) {
  return recommendedTraining(state, n).map((r) => `<div class="card recCard" data-skill="${esc(r.skill)}"><div class="eyebrow">${esc(r.name.toUpperCase())} — ${esc(r.level.label.toUpperCase())}</div>${r.why ? `<p class="small gold">${esc(r.why)}</p>` : ''}${r.items.length ? `${r.items.slice(0, 2).map((t, i) => `<button type="button" class="${i ? 'bigBtn alt' : 'bigBtn'}" data-action="go" data-href="${esc(t.href)}">${esc(displayDrillTitle(t.title))}<small> · ${esc(t.sub)}</small></button>`).join('')}` : '<p class="muted">Unlock more games to train this skill.</p>'}</div>`).join('');
}
export function renderTrainingPage(state) {
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">RECOMMENDED TRAINING</span><h1>What to train next</h1><p>Blocked skills first (Skill Gate foundations and Promotion floors), then your weakest skills — real stages and drills that train them, least-mastered and easiest first.</p></div>
    <div class="recList">${recommendedHTML(state, 6)}</div>`;
}

// ------------------------------------------------------------------ Champion
export function championStatsHTML(state) {
  const c = championStats(state);
  const h = Math.floor(c.trainingMs / 3600000);
  const m = Math.round((c.trainingMs % 3600000) / 60000);
  const cells = [[fmt(c.lifetimeXp), 'LIFETIME XP'], [c.sessions, 'SESSIONS'], [c.completed, 'ITEMS PASSED'], [c.strong, 'STRONG ⭐⭐'], [c.mastered, 'MASTERED ⭐⭐⭐'], [c.perfect, 'PERFECT'], [c.firstClears, 'FIRST CLEARS'], [c.pbs, 'PERSONAL BESTS'], [c.bossesBeaten, 'PROMOTIONS'], [`${c.ghostWins}/${c.ghostMatches}`, 'GHOST WINS'], [c.bestGhost ? `${c.bestGhost}-ball` : '—', 'BEST GHOST WIN'], [`${h}h ${m}m`, 'TRAINING TIME']];
  return `<div class="card champGrid" data-champion-stats>${cells.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div><p class="muted small">Drill Rank: <b>${esc(c.drillRank)}</b></p>`;
}
export function renderChampionPage(state) {
  const cs = careerStatus(state);
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#career">‹ Career</button><span class="eyebrow">${cs.champion ? 'MAX RANK' : 'CHAMPION STATS'}</span><h1>${cs.champion ? 'Champion' : 'Road to Champion'}</h1><p>${cs.champion ? 'Every rank earned. Rank XP is complete — Lifetime XP, mastery and personal bests keep counting.' : `Champion is the max rank. You are ${esc(cs.title)}.`}</p></div>
    ${careerHeaderHTML(state, { link: false })}${championStatsHTML(state)}
    <h2>Skills</h2><div class="skills card">${skillBreakdownHTML(state)}</div>`;
}

// ------------------------------------------------------------------ result screens
export function awardHTML(award) {
  if (!award) return '';
  const flags = (award.flags || []).filter((f) => !/REPEAT/.test(f));
  const parts = [`<b class="xpPlus">+${fmt(award.lifetime)} XP</b>`];
  if (award.rank > 0) parts.push(`<span>+${fmt(award.rank)} Rank XP</span>`);
  if (award.drill > 0) parts.push(`<span class="drTxt">+${fmt(award.drill)} Drill XP</span>`);
  return `<div class="awardBox" data-award data-xp="${award.lifetime}" data-rank-xp="${award.rank}" data-drill-xp="${award.drill}"><div class="awLine">${parts.join(' · ')}</div>${flags.length ? `<div class="awFlags">${flags.map((f) => `<span class="awFlag" data-flag="${esc(f)}">${esc(f)}</span>`).join('')}</div>` : ''}${award.stars > award.prevStars ? `<div class="awMastery">${starsHTML(award.stars)} <b>${esc(MASTERY_LABEL(award.stars))}</b></div>` : ''}${(award.flags || []).includes('MASTERED REPEAT') ? '<small class="muted">Already mastered — reduced Rank XP. Harder content earns more.</small>' : (award.flags || []).includes('REPEAT TODAY') ? '<small class="muted">Played a lot today — repeats earn less XP.</small>' : ''}</div>`;
}

// ------------------------------------------------------------------ profile header + home hero
export function profileHeaderHTML(state, profile, { edit = true } = {}) {
  const cs = careerStatus(state);
  const dr = drillRankStatus(state);
  const bp = ballPocketStatus(state); // v14-118: Ball Pocketing chip next to the Career and Drill Rank chips
  const name = profile?.displayName || 'Player';
  return `<div class="card profileHead" data-profile-head>
    <button type="button" class="phAvatar" data-action="go" data-href="#me" aria-label="Edit profile">${avatarHTML({ ...profile, name }, 76)}</button>
    <div class="phInfo"><span class="eyebrow">PLAYER PROFILE</span><h1 class="phName" data-player-name>${esc(name)}</h1>
      <div class="phRanks"><span class="phRank" data-action="go" data-href="#career">${rankBadgeSVG(cs, { size: 28 })}<b>${esc(cs.title)}</b></span><span class="phRank dr" data-action="go" data-href="#drillrank">${drillBadgeSVG(dr.number, { size: 28, max: dr.max })}<b><span class="drRankNo">${dr.number}</span> ${esc(dr.name)}</b></span><span class="phRank bp" data-action="go" data-href="#drills/pocket" data-ph-bp="${bp.current}"><img class="phCue" src="./icons/rank-cue-${Math.max(1, Math.min(5, bp.current))}.png" alt="" width="15" height="28"/><b>Ball Pocketing <span class="gold">Lv. ${bp.current}</span></b></span></div>
      ${edit ? `<button type="button" class="linkish" data-action="go" data-href="#me">${profile?.displayName ? 'Edit profile' : 'Add your name & photo'} ›</button>` : ''}
    </div>
  </div>`;
}
export function devSeedBannerHTML(state) {
  return state.devSeed ? `<div class="card devBanner" data-dev-seed>DEV TEST STATE · ${esc(state.devSeed.label)} — not your real progress. <button type="button" class="miniAct" data-action="go" data-href="#dev">DEV MODE</button></div>` : '';
}
export { masteryCounts, CHAMPION_INDEX };
