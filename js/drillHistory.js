/**
 * v14-126: Profile Drill History — drills and career stages the player has tried or passed.
 * Built from existing state.games[*].stages records (tries / passed / lastDate / history). No parallel log.
 */
import { GAMES, getGame, getStage, stageSpecs } from './games/registry.js';
import { getDrillById, displayDrillTitle } from './drills.js';
import { esc } from './games/recipe.js';
import { isDrillHidden } from './drills/hidden.js';

let histFilter = 'all'; // all | passed | tried
export function getHistFilter() { return histFilter; }
export function setHistFilter(v) {
  histFilter = v === 'passed' || v === 'tried' ? v : 'all';
  return histFilter;
}

function msOf(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

/** Best activity timestamp for a stage record; falls back through history / first pass / prog item. */
export function stageLastAt(rec, progRec) {
  if (!rec) return msOf(progRec?.lastAt);
  const hist = rec.history || [];
  const lastHist = hist.length ? hist[hist.length - 1]?.date : null;
  return msOf(rec.lastDate) || msOf(lastHist) || msOf(rec.firstPassDate) || msOf(progRec?.lastAt) || 0;
}

function shortWhen(ms) {
  if (!ms) return '';
  const days = (Date.now() - ms) / 86400000;
  if (days < 0.5) return 'Today';
  if (days < 1.5) return 'Yesterday';
  if (days < 7) return `${Math.floor(days)}d ago`;
  if (days < 40) return `${Math.floor(days / 7)}w ago`;
  return new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric', year: days > 400 ? 'numeric' : undefined });
}

function statusOf(rec) {
  const stars = Number(rec.bestStars) || 0;
  const score = Number(rec.bestScore) || 0;
  const medal = rec.bestMedal || '';
  if (rec.passed) {
    if (stars > 0) return { kind: 'passed', label: `Passed · ${stars}★` };
    if (medal) return { kind: 'passed', label: `Passed · ${medal}` };
    if (score > 0) return { kind: 'passed', label: `Passed · best ${score}` };
    return { kind: 'passed', label: 'Passed' };
  }
  if (stars > 0) return { kind: 'tried', label: `Tried · ${stars}★` };
  if (score > 0) return { kind: 'tried', label: `Tried · best ${score}` };
  return { kind: 'tried', label: 'Tried' };
}

function resolveDrill(id, rec, progItems) {
  if (isDrillHidden(id)) return null;
  const d = getDrillById(id);
  const prog = progItems?.[`drill:${id}`];
  const lastAt = stageLastAt(rec, prog);
  const tries = Number(rec.tries) || (rec.history || []).length || 0;
  if (tries <= 0 && !rec.passed && !lastAt) return null;
  const st = statusOf(rec);
  const cat = d?.category || d?.part || (d?.credit ? 'Drill' : 'Drill');
  return {
    key: `drill:${id}`,
    name: displayDrillTitle(d?.name || prog?.name || id),
    parent: displayDrillTitle(cat),
    href: `#play/drills/${id}`,
    lastAt,
    when: shortWhen(lastAt),
    ...st,
    tries: tries || 1
  };
}

function resolveCareer(gameId, stageId, rec, progItems) {
  if (stageId === 'endless') return null;
  const def = getGame(gameId);
  if (!def || def.special === 'ghost') return null;
  const specs = stageSpecs(gameId);
  const idx = specs.findIndex((s) => s.id === stageId);
  const stage = idx >= 0 ? specs[idx] : getStage(gameId, stageId);
  if (!stage && !rec) return null;
  const prog = progItems?.[`arcade:${gameId}:${stageId}`];
  const lastAt = stageLastAt(rec, prog);
  const tries = Number(rec.tries) || (rec.history || []).length || 0;
  if (tries <= 0 && !rec.passed && !lastAt) return null;
  const st = statusOf(rec);
  const level = idx >= 0 ? idx + 1 : (stage?.difficulty || '');
  const parent = level ? `${def.name} · Level ${level}` : def.name;
  return {
    key: `arcade:${gameId}:${stageId}`,
    name: displayDrillTitle(stage?.name || prog?.name || stageId),
    parent,
    href: `#play/${gameId}/${stageId}`,
    lastAt,
    when: shortWhen(lastAt),
    ...st,
    tries: tries || 1
  };
}

/**
 * Chronological list of drills / career stages with at least one recorded try or a pass.
 * Most recent activity first. Pure — does not write state.
 */
export function collectDrillHistory(state) {
  const games = state?.games || {};
  const progItems = state?.prog?.items || {};
  const out = [];
  const seen = new Set();

  for (const [gameId, g] of Object.entries(games)) {
    const stages = g?.stages;
    if (!stages) continue;
    for (const [stageId, rec] of Object.entries(stages)) {
      if (!rec || typeof rec !== 'object') continue;
      const row = gameId === 'drills'
        ? resolveDrill(stageId, rec, progItems)
        : resolveCareer(gameId, stageId, rec, progItems);
      if (!row || seen.has(row.key)) continue;
      seen.add(row.key);
      out.push(row);
    }
  }

  // Progress items with lastAt but no stage row yet (rare migration leftovers) — drills only
  for (const [key, rec] of Object.entries(progItems)) {
    if (!key.startsWith('drill:') || seen.has(key)) continue;
    if (!(Number(rec.attempts) > 0 || Number(rec.passes) > 0 || rec.lastAt)) continue;
    const id = key.slice(6);
    const fake = {
      tries: Number(rec.attempts) || Number(rec.passes) || 1,
      passed: !!rec.firstClearAt || Number(rec.passes) > 0,
      bestStars: 0,
      bestScore: 0,
      lastDate: rec.lastAt
    };
    const row = resolveDrill(id, fake, progItems);
    if (!row || seen.has(row.key)) continue;
    seen.add(row.key);
    out.push(row);
  }

  out.sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0) || a.name.localeCompare(b.name));
  return out;
}

export function filterDrillHistory(rows, filter = histFilter) {
  if (filter === 'passed') return rows.filter((r) => r.kind === 'passed');
  if (filter === 'tried') return rows.filter((r) => r.kind === 'tried');
  return rows;
}

function rowHTML(r) {
  return `<button type="button" class="histRow" data-action="go" data-href="${esc(r.href)}" data-hist-kind="${r.kind}">
    <span class="histMain"><b class="histName">${esc(r.name)}</b><small class="histParent">${esc(r.parent)}</small></span>
    <span class="histMeta"><span class="histStatus is-${r.kind}">${esc(r.label)}</span>${r.when ? `<small class="histWhen">${esc(r.when)}</small>` : ''}</span>
  </button>`;
}

/** Profile card: fixed-height scrolling list of tried / passed drills. */
export function drillHistoryHTML(state, filter = histFilter) {
  const all = collectDrillHistory(state);
  const rows = filterDrillHistory(all, filter);
  const chips = [
    ['all', 'All'],
    ['passed', 'Passed'],
    ['tried', 'Tried']
  ].map(([v, label]) => `<button type="button" class="chip${filter === v ? ' active' : ''}" data-action="hist-filter" data-v="${v}">${label}</button>`).join('');
  const body = rows.length
    ? `<div class="histList" role="list">${rows.map(rowHTML).join('')}</div>`
    : `<p class="muted small histEmpty">${all.length ? 'Nothing in this filter.' : 'Drills you try will show up here.'}</p>`;
  const count = all.length ? `<small class="histCount">${all.length} drill${all.length === 1 ? '' : 's'}</small>` : '';
  return `<div class="card histCard" data-hist-card>
    <div class="histHead"><div><span class="eyebrow">ACTIVITY</span><h2 class="histTitle">Drill History</h2></div>${count}</div>
    <div class="histFilters catFilter">${chips}</div>
    ${body}
  </div>`;
}
