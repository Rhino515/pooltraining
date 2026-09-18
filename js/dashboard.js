/**
 * Home dashboard — continue career, weakness training, ghost challenges.
 */
import { nextRankInfo, RANK_NAMES, requirementChecklist } from './career.js';
import { recommendDrills, skillBarsHTML, weakestSkills } from './skills.js';
import { renderTableDiagram } from './tableDiagram.js';
import { drills, isDrillUnlocked } from './drills.js';
import { maxUnlockedBalls } from './ghost.js';

export function renderHome(state) {
  const info = nextRankInfo(state);
  const pct = Math.round((info.progress || 0) * 100);
  const weak = weakestSkills(state, 3);
  const recs = recommendDrills(state, 3).filter((d) => isDrillUnlocked(d, state));
  const ghostNeed = findGhostRequirement(state);

  const checklistPreview = (info.checklist || [])
    .slice(0, 4)
    .map(
      (c) =>
        `<li class="${c.met ? 'met' : ''}">${c.met ? '✓' : '○'} ${c.label}</li>`
    )
    .join('');

  const missionCards =
    recs
      .map((d) => {
        const mini = renderTableDiagram(d.diagram || { balls: [] }, {
          compact: true,
          className: 'table-diagram mini'
        });
        return `<div class="mission card">
          <div class="diagramWrap mini">${mini}</div>
          <span class="tag">WEAKNESS · ${d.category}</span>
          <h3>${d.name}</h3>
          <p>${d.purpose}</p>
          <button type="button" data-start="${d.id}">Train Now</button>
        </div>`;
      })
      .join('') ||
    `<div class="card mission"><h3>Stack cleared</h3><p>You've passed the recommended open drills. Browse the full lab or push Ghost.</p></div>`;

  return `
    <div class="hero card">
      <div>
        <span class="eyebrow">PLAYER CAREER</span>
        <h1>${(info.current || 'Rookie').toUpperCase()}</h1>
        <p>Turn real-table practice into a progression game.</p>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="row"><b>${pct}%</b><span>${info.next ? 'Next: ' + info.next : 'Max Rank'}</span></div>
        ${info.next ? `<ul class="checkPreview">${checklistPreview}</ul>` : ''}
        <button type="button" class="linkish" data-page-jump="career">Continue Career →</button>
      </div>
      <div class="rankBadge">${(state.rankIndex || 0) + 1}</div>
    </div>

    <div class="dashActions">
      <button type="button" class="dashAction card" data-page-jump="career">
        <span class="icon">♜</span>
        <b>Continue Career</b>
        <span>Checklist & promotion tests</span>
      </button>
      <button type="button" class="dashAction card" data-page-jump="drills">
        <span class="icon">◎</span>
        <b>Weakness Training</b>
        <span>${weak.map((w) => w.name).join(' · ') || 'All skills'}</span>
      </button>
      <button type="button" class="dashAction card" data-page-jump="ghost">
        <span class="icon">♚</span>
        <b>Ghost Challenge</b>
        <span>${ghostNeed || 'Up to ' + maxUnlockedBalls(state) + '-ball unlocked'}</span>
      </button>
    </div>

    <h2>Today's Training</h2>
    <div class="grid" id="missions">${missionCards}</div>
    <h2>Skill Ratings</h2>
    <div class="skills card" id="skills">${skillBarsHTML(state)}</div>
  `;
}

function findGhostRequirement(state) {
  const next = Math.min(9, (state.rankIndex || 0) + 1);
  const list = requirementChecklist(next, state);
  const g = list.find((r) => (r.type === 'ghost' || r.type === 'ghostWinsTotal') && !r.met);
  return g ? g.label : null;
}

export function renderStats(state) {
  const passed = Object.values(state.results || {}).filter((r) => r.passed).length;
  const gw = (state.ghostMatches || []).filter((m) => m.won).length;
  return `
    <div class="title"><span class="eyebrow">PLAYER PROFILE</span><h1>Stats</h1></div>
    <div class="card stats">
      <div><b>${state.xp || 0}</b><span>Career XP</span></div>
      <div><b>${passed}</b><span>Drills Passed</span></div>
      <div><b>${gw}</b><span>Ghost Wins</span></div>
    </div>
    <div class="skills card">${skillBarsHTML(state)}</div>
    <p class="muted">Skills rise when you first-pass drills and win Ghost matches. Ratings come from saved results only.</p>
  `;
}

export function renderCareerPage(state) {
  const idx = state.rankIndex || 0;
  const ranksHTML = RANK_NAMES.map((name, i) => {
    const locked = i > idx;
    const current = i === idx;
    const checklist =
      i === 0
        ? '<p>Starting rank — train fundamentals and unlock Club Player.</p>'
        : i <= idx + 1
          ? `<ul class="reqList">${requirementChecklist(i, state)
              .map(
                (c) =>
                  `<li class="${c.met ? 'met' : 'open'}">${c.met ? '✓' : '○'} ${c.label}${
                    c.type === 'promotion' && !c.met && i === idx + 1
                      ? ` <button type="button" class="miniBtn" data-promo="${c.testId}">Take Test</button>`
                      : ''
                  }</li>`
              )
              .join('')}</ul>`
          : '<p class="muted">Locked — earn previous ranks first.</p>';

    return `<div class="rank card ${locked ? 'locked' : ''} ${current ? 'current' : ''}">
      <div class="num">${i + 1}</div>
      <div>
        <h3>${name}</h3>
        ${checklist}
      </div>
      <div class="status">${i < idx ? '✓ PASSED' : current ? '● CURRENT' : '🔒 LOCKED'}</div>
    </div>`;
  }).join('');

  return `
    <div class="title">
      <span class="eyebrow">PLAYER DEVELOPMENT</span>
      <h1>Career Path</h1>
      <p>Only saved drill passes, Ghost wins, and promotion tests unlock ranks. No skip-ahead.</p>
    </div>
    <div id="ranksEl" class="ranklist">${ranksHTML}</div>
  `;
}

export function renderDrillsPage(state) {
  const byCat = {};
  for (const d of drills) {
    (byCat[d.category] = byCat[d.category] || []).push(d);
  }
  const weak = weakestSkills(state, 1)[0];
  let html = `<div class="title"><span class="eyebrow">TRAINING LAB</span><h1>Drills</h1><p>Weakest skill right now: <b>${weak ? weak.name + ' (' + weak.value + ')' : '—'}</b>. Locked drills need prerequisite passes.</p></div>`;
  html += `<div class="catFilter" id="catFilter">
    <button type="button" class="chip active" data-cat="all">All (${drills.length})</button>
    ${Object.keys(byCat)
      .map(
        (c) =>
          `<button type="button" class="chip" data-cat="${c}">${c} (${byCat[c].length})</button>`
      )
      .join('')}
  </div>`;
  html += `<div id="drillList" class="grid"></div>`;
  return html;
}
