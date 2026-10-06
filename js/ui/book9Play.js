/**
 * Play screen for the 9 Ball Pool – Practice made Perfect drills.
 * The page's own picture is the diagram and the page's own words sit under it, unchanged.
 * Scoring is the book's (book9Status). A finished session writes the drill record and goes through
 * awardSession once (flat drill base; no Career Rank XP).
 */
import { getDrillById, displayDrillTitle } from '../drills.js';
import { awardSession } from '../progression/sessions.js';
import { isBook9Id, book9Page, book9Status, book9Text, book9Image, BOOK9_147_TEXT, BOOK9_147_TIERS, BOOK9_CREDIT } from '../content/book9.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Plain text with the printed web links made tappable (the link text stays exactly as printed). */
function linkify(text) {
  return esc(text).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer nofollow">${u}</a>`);
}

export function createBook9Play(ctx, { id } = {}) {
  const base = getDrillById(id);
  const page = book9Page(id);
  if (!base || !isBook9Id(id) || !page) {
    return { render() { ctx.root.innerHTML = ''; }, onAction() { return false; }, destroy() {} };
  }
  let log = [];
  let saved = false;
  let alive = true;
  const startedAt = new Date().toISOString();

  function finish(st) {
    if (saved || !st.done) return;
    saved = true;
    let state = ctx.getState();
    const games = { ...(state.games || {}) };
    const gs = games.drills || { stages: {}, pb: {}, sessions: [] };
    const stages = { ...(gs.stages || {}) };
    const old = stages[id] || { tries: 0, passed: false, bestScore: 0, bestStars: 0, history: [] };
    const now = new Date().toISOString();
    const score = Math.max(0, Number(st.score) || 0);
    stages[id] = {
      ...old,
      tries: (old.tries || 0) + 1,
      passed: old.passed || st.passed,
      bestScore: Math.max(old.bestScore || 0, score),
      bestStars: old.bestStars || 0,
      lastScore: score,
      lastPassed: st.passed,
      lastDate: now,
      firstPassDate: old.firstPassDate || (st.passed ? now : null),
      ...(st.medal ? { bestMedal: bestMedal(old.bestMedal, st.medal) } : {}),
      history: [...(old.history || []), { date: now, score, passed: st.passed, stars: 0, book9: page.kind, ...(st.medal ? { medal: st.medal } : {}), ...(st.attempts ? { attempts: st.attempts.slice() } : {}) }].slice(-20)
    };
    games.drills = {
      ...gs,
      stages,
      pb: { ...(gs.pb || {}) },
      sessions: [...(gs.sessions || []), { stageId: id, date: now, score, passed: st.passed, stars: 0, attempts: log.length }].slice(-100)
    };
    state = { ...state, games, activeSession: null };
    const session = { gameId: 'drills', stageId: id, attempts: [], startedAt };
    const aw = awardSession(state, session, base, { passed: st.passed, score, maxScore: st.maxScore || 0 });
    ctx.commit(aw.state);
  }

  function scoringCard(st) {
    const rows = st.lines.length ? `<ul class="b9Lines">${st.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '';
    const tiers = page.kind === 'best3'
      ? `<div class="b9Tiers" data-b9-tiers>${BOOK9_147_TIERS.slice().reverse().map(([n, min], i, all) => `<span class="b9Tier${st.medal === n ? ' on' : ''}" data-tier="${n}"><b>${n}</b><small>${i < all.length - 1 ? `${min}–${all[i + 1][1] - 1}` : `${min}+`} balls</small></span>`).join('')}</div>`
      : '';
    return `<div class="card b9Score" data-b9-kind="${esc(page.kind)}" data-b9-done="${st.done ? 1 : 0}" data-b9-score="${st.score}"${st.medal ? ` data-b9-medal="${esc(st.medal)}"` : ''}>
      <p class="buStatus b9Status">${esc(st.status)}</p>${rows}${tiers}</div>`;
  }

  function render() {
    if (!alive) return;
    const st = book9Status(id, log);
    const btns = st.buttons.map((b, i) => `<button type="button" class="bigBtn${i ? ' alt' : ''}" data-action="b9-tap" data-v="${b.act}">${esc(b.label)}</button>`).join('');
    const actions = st.done
      ? `<p class="buScoreLine">${st.passed ? 'Saved ✓' : 'Saved'}</p>
         <div class="buBar"><button type="button" class="bigBtn" data-action="b9-again">RUN AGAIN</button><button type="button" class="bigBtn alt" data-action="play-exit">DRILLS</button></div>`
      : `<div class="buBar">${btns}</div>
         ${st.canStop || log.length ? `<div class="buBar b9More">${st.canStop ? '<button type="button" class="bigBtn alt" data-action="b9-tap" data-v="stop">FINISH &amp; SAVE</button>' : ''}${log.length ? '<button type="button" class="bigBtn alt" data-action="b9-undo">UNDO LAST</button>' : ''}</div>` : ''}`;
    const scoring = page.is147
      ? `<details class="card buHowCard b9Scoring" data-b9-147><summary>147 Academy scoring</summary><pre class="buHow">${esc(BOOK9_147_TEXT)}</pre></details>`
      : '';
    ctx.root.innerHTML = `<div class="playScreen buPlay b9Play" data-b9="${esc(id)}">
      <div class="playHead">
        <button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button>
        <div class="phTitle"><small>${esc(displayDrillTitle(base.category))}${page.part ? ` · ${esc(page.part)}` : ''}</small><b>${esc(base.name)}</b></div>
        <div class="phStatus"></div>
      </div>
      <div class="diagramWrap b9Diagram"><img class="table-diagram drill-diagram b9Img" src="${esc(book9Image(id))}" alt="${esc(base.name)}" /></div>
      ${scoringCard(st)}
      ${actions}
      <details class="card buHowCard b9Book" open>
        <summary>From the book</summary>
        <pre class="buHow b9Text">${linkify(book9Text(id))}</pre>
        <small class="muted credit">${esc(BOOK9_CREDIT)}</small>
      </details>
      ${scoring}
    </div>`;
  }

  function onAction(action, el) {
    if (action === 'b9-tap') {
      const st = book9Status(id, log);
      if (st.done) return true;
      log = [...log, el?.dataset?.v || 'pot'];
      const next = book9Status(id, log);
      if (next.done) finish(next);
      render();
      return true;
    }
    if (action === 'b9-undo') {
      if (saved || !log.length) return true;
      log = log.slice(0, -1);
      render();
      return true;
    }
    if (action === 'b9-again') {
      log = [];
      saved = false;
      render();
      return true;
    }
    if (action === 'play-exit') {
      ctx.go('#drills');
      return true;
    }
    return false;
  }

  return { render, onAction, destroy() { alive = false; } };
}

const MEDAL_RANK = { Bronze: 1, Silver: 2, Gold: 3 };
function bestMedal(a, b) {
  return (MEDAL_RANK[b] || 0) > (MEDAL_RANK[a] || 0) ? b : a || b;
}
