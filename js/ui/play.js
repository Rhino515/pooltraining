/**
 * Play screen for every Table Games mode, drills and Boss Battles.
 * Layout (mobile-first): sticky header → table → recipe strip + WHY → goal/progress → fixed result bar.
 * Results are recorded manually (resultSource: 'manual') unless a camera adapter is registered via
 * analyze.js registerResultAdapter(); pass/fail is always computed by the engine from recorded attempts.
 */
import * as E from '../games/engine.js';
import { getGame, getStage, getBoss, stageSpecs } from '../games/registry.js';
import { renderStageTable, legendHTML } from '../games/stageTable.js';
import { recipeCardHTML, recipeGaugesHTML, whyHTML, esc, speedChip, setupLineHTML, setupSheetHTML, aimRowHTML, tipClockLabel } from '../games/recipe.js';
import { cueBallSVG, tipsFromTap } from '../games/cueBallDiagram.js';
import { coachingLevel, visibility, comparePlan, TECHNIQUES, SPEED_CHOICES, RAIL_CHOICES, COACH_LABEL } from '../games/coaching.js';
import { contactText, englishText, techniqueName } from '../games/text.js';
import { speedLabel, formatSpeed, lagEndpoint, CALIBRATION_SPEEDS, personalFactor, speedMeaning, calLookup } from '../games/speed.js';
import { speedExplainHTML, speedDiagramSVG } from '../games/speedDiagram.js';
import { openSheet, closeSheet, toast, stars } from './sheet.js';
import { getDrillById, displayDrillTitle } from '../drills.js';
import { drillEditorAllowed, drillLink } from '../drills/ownerEdits.js';
import { columnsFor, addTallyColumn, bumpTallyColumn, removeTallyColumn } from '../drills/tallyColumns.js';
import { RANK_NAMES } from '../storage.js';
import { getResultAdapter } from '../analyze.js';
import { awardHTML } from './progression.js';
import { careerStatus } from '../progression/rank.js';

const FMT = { technique: techniqueName, contact: contactText, english: (h) => englishText(h), speed: (s) => (s == null ? '—' : speedLabel(s)) };

let ui = { draft: null, calLeg: 1, calDiamond: null, patternPick: [], lastResult: null };

function resetUI() {
  ui = { draft: { technique: null, vTips: 0, hTips: 0, speed: null, rails: null, touched: false }, calLeg: 1, calDiamond: null, patternPick: [], routeSide: null, lastResult: null };
}

/** Challenge shown for the current shot (train step, ladder rung, endless draw, boss shot) */
function shotChallenge(session, stage, ev) {
  if (session.bossId) {
    const shot = ev.shots[ev.shotIndex]; // { shot: bossShotDef, attempts, made, stars }
    return { ch: shot.shot.challenge, shot };
  }
  const ch = E.currentChallenge(session, stage, ev);
  if (ch?.steps && ev.mode === 'train') {
    const i = Math.min(ev.ballIndex, ch.steps.length - 1);
    const st = ch.steps[i];
    return { ch: { ...ch, ...st, id: `${ch.id}-s${i + 1}`, kind: 'position', goal: st.goal, targetZones: ch.targetZones, steps: ch.steps, expertGoal: ch.expertGoal }, step: i, base: ch };
  }
  return { ch };
}

function getSessionFor(state, key) {
  const s = state.activeSession;
  if (!s) return null;
  if (key.bossId) return s.bossId === key.bossId ? s : null;
  return s.gameId === key.gameId && s.stageId === key.stageId && !s.bossId ? s : null;
}

// ---------------------------------------------------------------------------------------------
export function createPlayScreen(ctx, key) {
  // key: { gameId, stageId } | { bossId } | { gameId: 'drills', stageId, content }
  // content (My Content / .pooliq Play Test): { challenge, title, skill, exitHref, onFinish(ev) → {note, buttons} }.
  // Content sessions live only in memory — nothing is committed to the Career state (Play Test isolation).
  resetUI();
  const C = key.content || null;
  const fromSet = !!key.fromSet;
  // Dev Mode ON opened a locked drill/stage (app.js). A DEV PREVIEW plays normally but saves nothing:
  // no stage record, no XP, no Ball Pocketing medal, no unlocks.
  const devPreview = !C && !key.bossId && !!key.devPreview;
  let state = ctx.getState();
  let session = C ? E.newSession('drills', C.challenge.id) : getSessionFor(state, key);
  if (!session) {
    session = E.newSession(key.gameId || 'boss', key.stageId || key.bossId, { endless: key.stageId === 'endless', bossId: key.bossId || null });
    ctx.commit({ ...state, activeSession: session }, { silent: true });
  }
  const game = key.bossId ? null : key.gameId === 'drills' ? { id: 'drills', name: 'Drill', primarySkill: null } : getGame(key.gameId);
  const stage = C ? C.challenge : key.bossId ? null : key.gameId === 'drills' ? getDrillById(key.stageId) : key.stageId === 'endless' ? { id: 'endless', name: 'Endless', scoringRules: { mode: 'lives', lives: 3 } } : getStage(key.gameId, key.stageId);
  const boss = key.bossId ? getBoss(key.bossId) : null;

  function saveSession(next) {
    session = next;
    if (C) return;
    state = ctx.getState();
    if (devPreview) { ctx.commit({ ...state, activeSession: session }, { silent: true }); return; }
    const settled = E.awardBallPocketWindow(state, session);
    session = settled.session;
    state = settled.state;
    ctx.commit({ ...state, activeSession: session }, { silent: true });
  }

  function evaluate() {
    return session.bossId ? E.evaluateBoss(session) : E.evaluateSession(session, stage);
  }

  function coach(ch) {
    if (C?.coach) return C.coach;
    if (!ch || ['lag', 'kick'].includes(ch.kind) || ev0().mode === 'calibration' || ev0().mode === 'ladder' || ev0().mode === 'pattern') return 'beginner';
    return coachingLevel(ctx.getState(), C ? { primarySkill: C.skill || null } : game || { primarySkill: shotSkill() });
  }
  const ev0 = () => evaluate();
  function shotSkill() {
    if (!boss) return null;
    const ev = evaluate();
    return ev.shots[ev.shotIndex].shot.skill;
  }

  // -------------------------------------------------------------------------------- render
  function headerHTML(ev, title, sub) {
    let status = '';
    if (ev.mode === 'lives' || ev.mode === 'sniper') status += `<span class="hearts" data-lives="${ev.lives}">${'♥'.repeat(ev.lives)}<i>${'♥'.repeat(Math.max(0, ev.livesTotal - ev.lives))}</i></span>`;
    if (ev.mode === 'train' || ev.mode === 'sniper') status += `<span class="mult" data-mult="${ev.multiplier}">×${ev.multiplier}</span>`;
    if (ev.mode === 'ladder') status += `<span class="mult">RUNG ${Math.min(ev.rung + 1, ev.rungs.length)}</span>`;
    status += `<span class="score" data-score="${ev.score}">${ev.score}</span>`;
    const editHref = !C && stage && drillEditorAllowed()
      ? (session.gameId === 'drills' && !stage.custom && !stage.contentUid ? `#drillfix/${esc(stage.id)}` : (!session.bossId && !session.endless && session.gameId && session.gameId !== 'drills' ? `#devedit/${esc(session.gameId)}/${esc(stage.id)}` : ''))
      : '';
    const edit = editHref ? `<button type="button" class="phEdit" data-owner-edit="1" data-action="go" data-href="${editHref}">EDIT</button>` : '';
    return `<div class="playHead"><button type="button" class="phBack" data-action="play-exit" aria-label="Exit">‹</button><div class="phTitle"><small>${devPreview ? '<span data-dev-preview="1">DEV PREVIEW · </span>' : ''}${esc(title)}</small><b>${esc(sub)}</b></div><div class="phStatus">${edit}${status}</div></div>`;
  }
  function drillLinkHTML() {
    if (!drillEditorAllowed() || session.gameId !== 'drills' || !stage) return '';
    const href = drillLink(stage.attribution?.sourceURL || stage.builder?.attribution?.sourceURL);
    if (!href) return '';
    let host = href;
    try { host = new URL(href).hostname.replace(/^www\./, ''); } catch { /* keep the address */ }
    return `<a class="drillLink" data-drill-link href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow"><small>Link</small><b>${esc(host)}</b></a>`;
  }

  function countMakeMiss(attempts) {
    let makes = 0;
    let misses = 0;
    for (const a of attempts || []) {
      if (E.attemptIsMake(a)) makes++;
      else misses++;
    }
    return { makes, misses };
  }
  /** Attempt count the medal uses: the drill's own number, else 20 only when a drill does not say. */
  function attemptBasis(ev) {
    if (ev?.mode === 'boss') {
      const n = ev.shots?.[ev.shotIndex]?.shot?.attempts;
      return E.medalThresholds(Number.isFinite(Number(n)) && Number(n) > 0 ? n : 20);
    }
    const src = stage || {};
    const own = [src.attemptCount, src.scoringRules?.attempts].map(Number).find((n) => Number.isFinite(n) && n > 0);
    if (own) return E.medalThresholds(own);
    if (session.gameId === 'drills' || C) return E.medalThresholds(20);
    if (Number.isFinite(ev?.attemptsTotal) && ev.attemptsTotal > 0) return E.medalThresholds(ev.attemptsTotal);
    return null;
  }
  function tallyHTML(attempts, basis) {
    const all = attempts || [];
    const windowed = basis ? all.slice(0, basis.total) : all;
    const shown = countMakeMiss(all);
    const ranked = countMakeMiss(windowed);
    const rank = basis ? E.medalName(ranked.makes, basis.total) : '';
    return `<div class="shotTally" data-makes="${shown.makes}" data-misses="${shown.misses}" data-window-makes="${ranked.makes}" data-window-misses="${ranked.misses}" data-attempts="${basis ? basis.total : ''}" data-rank="${rank}">
      <span class="tallyMake"><b>${shown.makes}</b><small>Makes</small></span>
      <span class="tallyMiss"><b>${shown.misses}</b><small>Misses</small></span>
      <span class="tallyRank${rank ? '' : ' is-none'}" data-rank="${rank}"><b>${rank || '—'}</b><small>${rank ? 'Rank' : 'Pass at Bronze'}</small></span>
    </div>`;
  }
  function extraTallyHTML() {
    if (!stage || !stage.isDrill || session.bossId || session.gameId !== 'drills' || !drillEditorAllowed()) return '';
    const cols = columnsFor(session.stageId);
    const cells = cols.map((c) => `<span class="tallyCol" data-col="${esc(c.id)}"><b>${c.makes || 0}</b><small>Makes</small><b>${c.misses || 0}</b><small>Misses</small><button type="button" data-action="tally-col-make" data-col="${esc(c.id)}">Make</button><button type="button" data-action="tally-col-miss" data-col="${esc(c.id)}">Miss</button><button type="button" data-action="tally-col-remove" data-col="${esc(c.id)}" aria-label="Remove tally column">×</button></span>`).join('');
    return `<div class="tallyCols" data-dev-tally="1">${cells}<button type="button" class="tallyAdd" data-action="tally-add-col">Add tally column</button></div>`;
  }
  function progressHTML(ev) {
    if (ev.mode === 'boss') {
      const cur = ev.shots[ev.shotIndex];
      const track = `<div class="bossTrack">${ev.shots.map((s, i) => `<i class="${s.passed ? 'ok' : s.done ? 'bad' : i === ev.shotIndex ? 'cur' : ''}" title="${esc(s.shot.title)}">${i + 1}</i>`).join('')}</div>`;
      return track + tallyHTML(cur.attempts, E.medalThresholds(cur.shot.attempts || 20));
    }
    return tallyHTML(session.attempts, attemptBasis(ev)) + extraTallyHTML();
  }

  function render() {
    const root = ctx.root;
    if (ui.resultHTML) {
      root.innerHTML = ui.resultHTML;
      return;
    }
    const ev = evaluate();
    if (ev.over) return finish(ev);
    if (!session.bossId && ev.mode === 'calibration') return renderCalibration(root, ev);
    const { ch, step, shot } = shotChallenge(session, stage, ev);
    const level = coach(ch);
    const vis = visibility(level, ch, session.planLocked);
    const isPattern = ev.mode === 'pattern';
    const patternPlanning = isPattern && !session.planLocked;
    const planning = vis.planner && !session.planLocked && !isPattern;
    const title = C ? displayDrillTitle(C.title) : boss ? `BOSS · ${boss.name}` : `${game.name}${stage.level ? ` · Level ${stage.level}` : ''}`;
    const sub = C ? (ev.over ? 'Done' : `Attempt ${Math.min(ev.attemptsUsed + 1, ev.attemptsTotal)} of ${ev.attemptsTotal}`) : boss ? `Shot ${ev.shotIndex + 1}/${ev.shots.length} · ${shot.shot.skill}` : session.endless ? `Endless · Bank ${ev.attemptsUsed + 1}` : displayDrillTitle(stage.name);
    const tableOpts = patternPlanning
      ? { showCuePath: false, showAim: false, showObPath: false, showZones: false, hidePocket: true, pickedOrder: ui.patternPick }
      : isPattern
        ? { allSteps: true, showAim: false, orderBadges: true, pickedOrder: session.plan?.order || [] }
        : { showCuePath: vis.cuePath, showAim: vis.aim, showObPath: vis.obPath, showZones: vis.zones, step: step ?? (ch.steps ? 0 : undefined), orderBadges: !!(shot && ch.steps) };
    // v11.1 multi-lane drills: show every lane (start spots, routes, target circles) with the current lane highlighted
    const laneSrc = ch.lane && stage.laneOverlay ? { ...ch, laneOverlay: stage.laneOverlay.map((l) => ({ ...l, active: l.key === ch.lane.key })), targetZones: stage.targetZones } : null;
    const tableSrc = ev.mode === 'train' ? stage : isPattern ? stage : laneSrc || ch;
    const pdfShot = !!(stage && stage.pdfTable) && !session.bossId && ev.mode !== 'calibration' && ev.mode !== 'pattern';
    const tableSVG = pdfShot
      ? `<div class="diagramWrap"><img class="table-diagram drill-diagram" src="${esc(stage.pdfTable)}" alt="${esc(stage.name)}" /></div>`
      : renderStageTable(tableSrc, ev.mode === 'train' ? { ...tableOpts, step } : tableOpts);
    const goalText = vis.goalOnly ? ch.expertGoal || ch.goal : ch.goal;
    let mid = '';
    if (patternPlanning) mid = patternPlannerHTML(stage);
    else if (planning) mid = plannerHTML(ch, level);
    else if (pdfShot) {
      // The level how-to is the scanned instruction page, not a retyped paragraph.
      mid = stage.pdfHowto
        ? `<img class="bpHowto" src="${esc(stage.pdfHowto)}" alt="Level ${esc(stage.level || '')} instructions" />`
        : `<pre class="buHow bpPrint">${esc(stage.instructions || stage.description || '')}</pre>`;
    } else {
      mid = `<div class="recipeRow">${recipeGaugesHTML(ch, { hideAim: !vis.aim, hideRoute: !vis.cuePath && !vis.obPath })}<button type="button" class="whyBtn" data-action="why-open">WHY THIS SHOT?</button></div>`;
      // v11.1: speed drills (lags) always show the plain-English speed sentence with its mini-table diagram
      // v11.1: speed drills (lags) show the plain speed meaning with its mini-table diagram. It stands in for the
      // goal line (same statement), so the screen still fits a 375×667 phone without scrolling.
      if (ch.kind === 'lag') {
        const top = ch.lane
          ? `<div class="laneTag" data-lane="${ch.lane.index + 1}"><b>${esc(ch.lane.label)}</b><span><i class="laneOf">Lane ${ch.lane.index + 1} of ${ch.lane.count} · ${ch.lane.attempts} attempts</i> <span class="coachTag" data-action="coach-info">${COACH_LABEL[level]}</span></span></div>`
          : `<div class="se-top"><span class="speedChip" data-speed="${formatSpeed(ch.speed)}">${speedLabel(ch.speed)}</span><span class="coachTag" data-action="coach-info">${COACH_LABEL[level]}</span></div>`;
        mid += `<div class="speedExplain compact lagGoal goalLine" data-speed-explain="${formatSpeed(ch.speed)}"><div class="se-text">${top}<b class="se-mean">${esc(speedMeaning(ch.speed))}.</b><p class="goal srOnly">${esc(goalText)}</p></div>${speedDiagramSVG(ch.speed)}</div>`;
      }
    }
    const need = boss ? `${shot.shot.mode === 'zone' ? `${shot.shot.need}★` : `${shot.shot.need} of ${shot.shot.attempts}`} to pass this shot` : ev.needText ? `Pass: ${ev.needText}` : '';
    const btns = patternPlanning || planning ? [] : session.bossId ? E.bossButtons(ev) : E.resultButtons(session, stage, ev);
    const barHTML = patternPlanning
      ? `<div class="resultBar"><button type="button" class="lockBtn" data-action="pattern-lock" ${ui.patternPick.length === stage.steps.length && ui.routeSide ? '' : 'disabled'}>LOCK MY PLAN</button></div>`
      : planning
        ? `<div class="resultBar"><button type="button" class="lockBtn" data-action="plan-lock" ${ui.draft.technique && ui.draft.speed != null && ui.draft.rails != null && ui.draft.touched ? '' : 'disabled'}>LOCK MY ANSWER</button></div>`
        : `<div class="resultBar n${btns.length}">${btns.map((b, i) => `<button type="button" class="rb ${b.cls}${b.wide ? ' wide' : ''}" data-action="record" data-i="${i}"><b>${esc(b.label)}</b>${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</button>`).join('')}${session.attempts.length ? '<button type="button" class="rbUndo" data-action="undo-attempt" aria-label="Undo last attempt">↶ Undo</button>' : ''}</div>`;
    root.innerHTML = `<div class="playScreen" data-game="${esc(session.gameId)}" data-stage="${esc(session.stageId)}" data-mode="${ev.mode}" data-coach="${level}">
      ${headerHTML(ev, title, sub)}
      ${drillLinkHTML()}
      <div class="playTable">${tableSVG}</div>
      ${pdfShot ? '' : setupLineHTML(tableSrc)}
      ${pdfShot ? '' : (patternPlanning ? '<div class="legend small">Tap the balls in the order you would run them.</div>' : legendHTML(ch))}
      <div class="playBody">
        ${mid}
        ${pdfShot || (!planning && !patternPlanning && ch.kind === 'lag') ? '' : `<div class="goalLine"><span class="coachTag" data-action="coach-info">${COACH_LABEL[level]}</span><p class="goal">${esc(goalText)}</p></div>`}
        <div class="progressLine"><span class="muted">${esc(need)}</span><span class="muted">${esc(ev.progressText || (boss ? `${ev.passedCount} passed` : ''))}</span></div>
        ${progressHTML(ev)}
        ${ch.instructions && !patternPlanning && !pdfShot ? `<details class="instr"><summary>Setup &amp; instructions</summary><p>${esc(ch.instructions)}</p>${ch.criteria ? `<ol class="criteria" start="0">${ch.criteria.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>` : ''}</details>` : ''}
      </div>
      ${barHTML}
    </div>`;
  }

  // ---------------------------------------------------------------------- advanced planner
  function plannerHTML(ch, level) {
    const d = ui.draft;
    return `<div class="planner" data-planner="1">
      <div class="plHead"><b>${level === 'expert' ? 'Expert' : 'Advanced'} coaching:</b> plan the shot, then lock your answer to see Pool IQ's recipe.</div>
      <div class="plRow"><span>Technique</span><div class="chips">${TECHNIQUES.map((t) => `<button type="button" class="chip${d.technique === t.id ? ' active' : ''}" data-action="plan-tech" data-v="${t.id}">${t.label}</button>`).join('')}</div></div>
      <div class="plContact"><div class="plBall" data-action="plan-tap">${cueBallSVG(d.touched ? { vTips: d.vTips, hTips: d.hTips } : null, { size: 'sm', interactive: true, id: 'planBall' })}</div><div class="plContactText"><span>Tap the cue ball</span><b>${d.touched ? esc(contactText(d.vTips, d.hTips)) : '—'}</b>${d.touched ? `<small class="tipClock" data-tip-clock>${esc(tipClockLabel(d.vTips, d.hTips, { oclock: true }))}</small>` : ''}</div></div>
      <div class="plRow"><span>Speed</span><div class="chips speedChoices">${SPEED_CHOICES.map((s) => `<button type="button" class="chip${d.speed === s ? ' active' : ''}" data-action="plan-speed" data-v="${s}">${formatSpeed(s)}</button>`).join('')}</div></div>
      ${d.speed != null ? `<small class="muted plSpeedMean">${esc(speedMeaning(d.speed))}.</small>` : ''}
      <div class="plRow"><span>Rails</span><div class="chips">${RAIL_CHOICES.map((r) => `<button type="button" class="chip${d.rails === r ? ' active' : ''}" data-action="plan-rails" data-v="${r}">${r}</button>`).join('')}</div></div>
    </div>`;
  }

  function patternPlannerHTML(st) {
    const d = ui.draft;
    return `<div class="planner" data-planner="pattern">
      <div class="plRow"><span>Your order</span><div class="chips">${ui.patternPick.map((n) => `<span class="chip active">${n}</span>`).join('') || '<span class="muted">tap balls on the table…</span>'}${ui.patternPick.length ? '<button type="button" class="chip" data-action="pattern-clear">Clear</button>' : ''}</div></div>
      <div class="plRow"><span>First route</span><div class="chips">${['above', 'below'].map((s) => `<button type="button" class="chip${ui.routeSide === s ? ' active' : ''}" data-action="pattern-side" data-v="${s}">Land ${s} the 2nd ball</button>`).join('')}</div></div>
      <div class="plContact"><div class="plBall" data-action="plan-tap">${cueBallSVG(d.touched ? { vTips: d.vTips, hTips: d.hTips } : null, { size: 'sm', interactive: true, id: 'planBall' })}</div><div class="plContactText"><span>First-shot contact</span><b>${d.touched ? esc(contactText(d.vTips, d.hTips)) : 'center (tap to change)'}</b></div></div>
      <div class="plRow"><span>First speed</span><div class="chips speedChoices">${SPEED_CHOICES.filter((v) => v <= 3.5).map((s) => `<button type="button" class="chip${d.speed === s ? ' active' : ''}" data-action="plan-speed" data-v="${s}">${formatSpeed(s)}</button>`).join('')}</div></div>
    </div>`;
  }

  function lockPlan(ch) {
    const plan = { technique: ui.draft.technique, vTips: ui.draft.vTips, hTips: ui.draft.hTips, speed: ui.draft.speed, rails: ui.draft.rails };
    const cmp = comparePlan(plan, ch, FMT);
    saveSession({ ...session, plan: { ...plan, compare: cmp, chId: ch.id }, planLocked: true });
    render();
    showCompare(cmp, ch);
  }

  function showCompare(cmp, ch) {
    openSheet(`<div class="eyebrow">YOUR PLAN vs POOL IQ</div><h2 class="sheetTitle">${cmp.score}/${cmp.max} — ${cmp.score >= cmp.max - 2 ? 'Great read!' : cmp.score >= cmp.max / 2 ? 'Close — check the differences' : 'Study the recipe'}</h2>
      <div class="compareTable">${cmp.rows.map((r) => `<div class="cmpRow ${r.verdict}" data-field="${r.field}" data-verdict="${r.verdict}"><div class="cmpHead"><b>${esc(r.label)}</b><span class="verdict">${r.verdict.toUpperCase()}</span></div><div class="cmpVals"><span>You: ${esc(r.yours)}</span><span>Pool IQ: ${esc(r.poolIQ)}</span></div>${r.verdict !== 'match' && r.why ? `<p>${esc(r.why)}</p>` : ''}</div>`).join('')}</div>
      ${recipeCardHTML(ch, { cal: ctx.getState().speedCal })}
      <button type="button" class="bigBtn" data-action="sheet-close">GOT IT — SHOOT</button>`, { id: 'compare' });
  }

  function lockPattern() {
    const st = stage;
    const rec = st.steps.map((s) => s.ball);
    const pick = ui.patternPick.slice();
    let posMatch = 0;
    pick.forEach((n, i) => { if (rec[i] === n) posMatch++; });
    const s0 = st.steps[0];
    const nb = st.steps[1] ? st.ballPositions.find((b) => b.n === st.steps[1].ball) : null;
    const recSide = st.routeSide || (s0.zone && nb ? (s0.zone.y < nb.y ? 'above' : 'below') : 'above');
    const dv = Math.hypot((ui.draft.vTips || 0) - s0.cueContact.vTips, (ui.draft.hTips || 0) - (s0.cueContact.hTips || 0));
    const ds = Math.abs((ui.draft.speed ?? 0) - s0.speed);
    const rows = [
      { field: 'order', label: 'Ball order', yours: pick.join(' → '), poolIQ: rec.join(' → '), verdict: posMatch === rec.length ? 'match' : posMatch >= rec.length / 2 ? 'close' : 'different' },
      { field: 'side', label: 'First route side', yours: ui.routeSide, poolIQ: recSide, verdict: ui.routeSide === recSide ? 'match' : 'different' },
      { field: 'contact', label: 'First-shot contact', yours: contactText(ui.draft.vTips || 0, ui.draft.hTips || 0), poolIQ: contactText(s0.cueContact.vTips, s0.cueContact.hTips), verdict: dv <= 0.3 ? 'match' : dv <= 0.8 ? 'close' : 'different' },
      { field: 'speed', label: 'First-shot speed', yours: FMT.speed(ui.draft.speed), poolIQ: speedLabel(s0.speed), verdict: ds < 0.01 ? 'match' : ds <= 0.5 ? 'close' : 'different' }
    ];
    const planScore = rows.reduce((a, r) => a + (r.verdict === 'match' ? 100 : r.verdict === 'close' ? 50 : 0), 0);
    saveSession({ ...session, plan: { order: pick, routeSide: ui.routeSide, vTips: ui.draft.vTips, hTips: ui.draft.hTips, speed: ui.draft.speed, rows, planScore }, planLocked: true });
    render();
    showPatternReveal();
  }

  function showPatternReveal() {
    const p = session.plan;
    openSheet(`<div class="eyebrow">PATTERN REVEAL</div><h2 class="sheetTitle">Plan score ${p.planScore}</h2>
      <div class="compareTable">${p.rows.map((r) => `<div class="cmpRow ${r.verdict}" data-field="${r.field}" data-verdict="${r.verdict}"><div class="cmpHead"><b>${esc(r.label)}</b><span class="verdict">${r.verdict.toUpperCase()}</span></div><div class="cmpVals"><span>You: ${esc(r.yours)}</span><span>Pool IQ: ${esc(r.poolIQ)}</span></div></div>`).join('')}</div>
      <h3>Why this pattern</h3><ul class="patternWhy">${(stage.patternWhy || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="muted">Now set it up and play it. Record each runout attempt below.</p>
      <button type="button" class="bigBtn" data-action="sheet-close">PLAY IT OUT</button>`, { id: 'pattern' });
  }

  // ---------------------------------------------------------------------- calibration
  function renderCalibration(root, ev) {
    const target = ev.nextSpeed;
    const ch = E.ladderRungChallenge(target);
    const ep = lagEndpoint(target);
    const cal = ctx.getState().speedCal;
    const legs = [1, 2, 3, 4];
    const ruler = [];
    for (let d = 0; d <= 8; d += 0.5) ruler.push(`<button type="button" class="rulerTick${ui.calDiamond === d ? ' active' : ''}${d % 1 ? ' half' : ''}" data-action="cal-diamond" data-v="${d}">${d % 1 ? '' : d}</button>`);
    root.innerHTML = `<div class="playScreen" data-game="speed" data-stage="sp-cal" data-mode="calibration">
      ${headerHTML(ev, `${game.name} · Calibration`, `Shot ${Object.keys(ev.done).length + 1}/${stage.speeds.length} · ${speedLabel(target)}`)}
      <div class="playTable">${renderStageTable(ch, {})}</div>
      ${setupLineHTML(ch)}
      <div class="legend small"><span>Start on the first diamond at your end (left), centre ball. Diamonds counted from your end rail: 0 → 8.</span></div>
      <div class="playBody">
        <div class="calTarget"><span class="speedChip big" data-speed="${formatSpeed(target)}">${speedLabel(target)}</span><p>Target: ${esc(speedMeaning(target))}. It should stop on pass ${ep.leg} at diamond ${ep.diamond}.</p></div>
        ${speedExplainHTML(target, { note: false })}
        <div class="calPick"><span>Where did it stop? Pass:</span><div class="chips">${legs.map((l) => `<button type="button" class="chip${ui.calLeg === l ? ' active' : ''}" data-action="cal-leg" data-v="${l}">${l}${l % 2 ? ' →' : ' ←'}</button>`).join('')}</div></div>
        <div class="ruler" aria-label="Diamond ruler">${ruler.join('')}</div>
        <div class="calDone"><em>Session:</em>${stage.speeds.map((s) => { const a = ev.done[s]; return `<span class="${a ? 'ok' : ''}">${formatSpeed(s)}${a ? `: ${a.actual.toFixed(2)}L` : ''}</span>`; }).join('')}</div>
      </div>
      <div class="resultBar n3">
        <button type="button" class="rb miss" data-action="cal-quick" data-v="0.85"><b>SHORT</b><small>~15% short</small></button>
        <button type="button" class="rb pot" data-action="cal-quick" data-v="1"><b>ON TARGET</b></button>
        <button type="button" class="rb s1" data-action="cal-quick" data-v="1.15"><b>LONG</b><small>~15% long</small></button>
        <button type="button" class="rb s3 wide" data-action="cal-record" ${ui.calDiamond == null ? 'disabled' : ''}><b>RECORD EXACT STOP</b><small>${ui.calDiamond == null ? 'tap the ruler' : `pass ${ui.calLeg}, diamond ${ui.calDiamond}`}</small></button>
        ${session.attempts.length ? '<button type="button" class="rbUndo" data-action="undo-attempt">↶ Undo</button>' : ''}
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------------- finishing
  function finishContent() {
    const r = evaluate();
    const extra = (C.onFinish && C.onFinish(r, session)) || {};
    const medal = tallyHTML(session.attempts, attemptBasis(r));
    const statsMade = r.made != null ? `<div><b>${r.made}/${r.attemptsTotal}</b><span>MADE</span></div>` : r.stars != null ? `<div><b>${r.stars}★</b><span>STARS</span></div>` : '';
    const body = `<div class="resultPanel ${r.passed ? 'pass' : 'fail'}" data-result="${r.passed ? 'pass' : 'fail'}" data-content-result="1">
        <div class="eyebrow">${esc(C.title)}</div>
        <h1>${r.passed ? 'PASSED' : 'NOT PASSED'}</h1>
        <div class="resultStats"><div><b data-final-score="${r.score}">${r.score}</b><span>SCORE</span></div>${statsMade}</div>
        ${medal}
        ${extra.newBest ? '<p class="pb">★ NEW PERSONAL BEST</p>' : ''}
        ${extra.award ? awardHTML(extra.award) : ''}
        <p class="muted">Needed: ${esc(r.needText || '')} · You: ${esc(r.progressText || '')}</p>
        ${extra.note ? `<p class="sandboxNote" data-sandbox-note>${esc(extra.note)}</p>` : ''}
        <div class="resultBtns">${(extra.buttons || []).map((b) => `<button type="button" class="bigBtn${b.alt ? ' alt' : ''}" data-action="${esc(b.action)}"${b.href ? ` data-href="${esc(b.href)}"` : ''}>${esc(b.label)}</button>`).join('')}<button type="button" class="bigBtn alt" data-action="retry">RETRY</button><button type="button" class="bigBtn alt" data-action="go" data-href="${esc(C.exitHref)}">DONE</button></div></div>`;
    ui.resultHTML = `<div class="playScreen resultScreen">${body}</div>`;
    ctx.root.innerHTML = ui.resultHTML;
  }

  function finish() {
    if (C) return finishContent();
    state = ctx.getState();
    const csBefore = careerStatus(state);
    const out = E.finishSession(devPreview ? JSON.parse(JSON.stringify(state)) : state, session);
    const r = devPreview ? { ...out.result, award: null, newPB: false, unlockedNext: false, endlessUnlocked: false, gamesUnlocked: [] } : out.result;
    ui.lastResult = r;
    if (devPreview) ctx.commit({ ...state, activeSession: null }, { silent: true });
    else ctx.commit(out.state);
    const after = ctx.getState();
    const csAfter = careerStatus(after);
    const levelUp = csAfter.rankIndex === csBefore.rankIndex && !csAfter.champion && csAfter.ball > csBefore.ball ? `<p class="levelUp" data-level-up="${csAfter.ball}">⬆ LEVEL UP · <b>${esc(csAfter.title)}</b></p>` : '';
    const gateHit = !csBefore.gateLocked?.gate && csAfter.gateLocked && !csAfter.gateLocked.atGate ? `<p class="gateHit">🔒 ${esc(csAfter.gateLocked.gate.title)} — pass its foundations to keep climbing <button type="button" class="miniAct" data-action="go" data-href="#gate/${esc(csAfter.gateLocked.gate.id)}">OPEN</button></p>` : '';
    const awardBlock = `${awardHTML(r.award)}${levelUp}${gateHit}`;
    const root = ctx.root;
    let body;
    if (session.bossId) {
      const promoted = r.passed && after.rankIndex >= boss.rank;
      body = `<div class="resultPanel ${r.passed ? 'pass' : 'fail'}" data-result="${r.passed ? 'pass' : 'fail'}">
        <div class="eyebrow">BOSS BATTLE · ${esc(boss.name)}</div>
        <h1>${r.passed ? 'BOSS DEFEATED' : 'BOSS WINS'}</h1>
        ${promoted ? `<p class="promo">PROMOTED TO <b>${esc(RANK_NAMES[after.rankIndex].toUpperCase())}</b></p>` : ''}
        ${awardBlock}
        <div class="bossResults">${r.shots.map((s) => `<div class="brRow ${s.passed ? 'ok' : 'bad'}"><span>${esc(s.shot.title)}</span><small>${esc(s.shot.skill)}</small><b>${s.shot.mode === 'zone' ? `${s.stars}★` : `${s.made}/${s.shot.attempts}`}<small>need ${s.shot.need}${s.shot.mode === 'zone' ? '★' : ''}</small></b></div>`).join('')}</div>
        ${!r.passed ? `<div class="weakBox" data-weak="${esc(r.weakSkills.join('|'))}"><b>Skill areas that cost you:</b> ${r.weakSkills.map((w) => `<span class="chip">${esc(w)}</span>`).join(' ')}</div>` : ''}
        <div class="resultBtns"><button type="button" class="bigBtn" data-action="retry">${r.passed ? 'PLAY AGAIN' : 'RETRY BOSS'}</button><button type="button" class="bigBtn alt" data-action="go" data-href="#career">CAREER</button></div></div>`;
    } else {
      const unlocked = devPreview ? '<p class="muted" data-dev-preview="1">DEV PREVIEW · this is still locked. Nothing was saved: no score, no XP, no unlock.</p>' : r.unlockedNext ? `<p class="unlock" data-unlocked="1">🔓 Next stage unlocked</p>` : r.endlessUnlocked ? '<p class="unlock" data-unlocked="1">🔓 ENDLESS MODE unlocked</p>' : !r.passed && !session.endless ? '<p class="muted" data-unlocked="0">Not passed — the next stage stays locked.</p>' : '';
      const gamesU = (r.gamesUnlocked || []).map((g) => `<p class="unlock">🎮 ${esc(getGame(g).name)} unlocked</p>`).join('');
      body = `<div class="resultPanel ${r.passed || session.endless ? 'pass' : 'fail'}" data-result="${r.passed ? 'pass' : 'fail'}">
        <div class="eyebrow">${esc(game.name)} · ${esc(session.endless ? 'Endless' : displayDrillTitle(stage.name))}</div>
        <h1>${session.endless ? 'GAME OVER' : r.passed ? 'STAGE PASSED' : 'NOT PASSED'}</h1>
        ${r.stageStars ? `<div class="bigStars">${stars(r.stageStars)}</div>` : ''}
        <div class="resultStats"><div><b data-final-score="${r.score}">${r.score}</b><span>SCORE</span></div>${r.mode === 'zone' && r.requirePocket ? `<div><b>${r.pockets}/${r.attemptsTotal}</b><span>POCKETED</span></div><div><b>${r.stars}★</b><span>POSITION</span></div>` : ''}${r.mode === 'train' ? `<div><b>×${r.bestMultiplier}</b><span>BEST MULT</span></div><div><b>${r.perfectRuns}</b><span>PERFECT</span></div>` : ''}${r.mode === 'ladder' ? `<div><b>${r.bestRung}/${r.rungs.length}</b><span>RUNGS</span></div>` : ''}${r.mode === 'sniper' ? `<div><b>${r.bestStreak}</b><span>BEST STREAK</span></div>` : ''}</div>
        ${r.newPB ? '<p class="pb">★ NEW PERSONAL BEST</p>' : ''}
        ${awardBlock}
        ${r.mode === 'calibration' ? calibrationSummary(after.speedCal) : ''}
        ${tallyHTML(session.attempts, attemptBasis(r))}
        ${!session.endless ? `<p class="muted">Needed: ${esc(r.needText)} · You: ${esc(r.progressText)}</p>` : ''}
        ${unlocked}${gamesU}
        <div class="resultBtns">
          ${r.nextStageId ? `<button type="button" class="bigBtn" data-action="go" data-href="#play/${session.gameId}/${r.nextStageId}">NEXT STAGE ›</button>` : ''}
          <button type="button" class="bigBtn ${r.nextStageId ? 'alt' : ''}" data-action="retry">RETRY</button>
          <button type="button" class="bigBtn alt" data-action="go" data-href="${session.gameId === 'drills' ? '#drills' : `#game/${session.gameId}`}">STAGES</button>
        </div></div>`;
    }
    ui.resultHTML = `<div class="playScreen resultScreen">${body}</div>`;
    root.innerHTML = ui.resultHTML;
  }

  function calibrationSummary(cal) {
    return `<div class="calSummary"><b>Your calibration</b>${CALIBRATION_SPEEDS.map((s) => { const f = personalFactor(cal, s); const last = (calLookup(cal.results, s) || []).slice(-1)[0]; return `<div class="calRow"><span>${speedLabel(s)}</span><span>${last ? `${last.actual.toFixed(2)} lengths` : '—'}</span><span class="${Math.abs(f - 1) < 0.06 ? 'green' : 'gold'}">${Math.abs(f - 1) < 0.06 ? 'on target' : f > 1 ? 'runs short' : 'runs long'}</span></div>`; }).join('')}</div>`;
  }

  /** The layout the player sets up at the table (train/pattern: the starting rack, not the current step) */
  function setupSource(ev, ch) {
    return ev.mode === 'train' || ev.mode === 'pattern' ? stage : ch;
  }

  // ---------------------------------------------------------------------- actions
  function onAction(action, el, e) {
    const ev = evaluate();
    if (action === 'record') {
      const btns = session.bossId ? E.bossButtons(ev) : E.resultButtons(session, stage, ev);
      const b = btns[Number(el.dataset.i)];
      if (!b) return true;
      const adapter = getResultAdapter();
      if (adapter.id === 'manual') {
        saveSession(E.recordAttempt(session, b.outcome));
        render();
      } else {
        // Camera-ready hook: a registered adapter may confirm/adjust the tapped outcome before it is saved.
        const { ch } = shotChallenge(session, stage, ev);
        adapter.verifyAttempt(ch, b.outcome).then((r) => {
          saveSession(E.recordAttempt(session, r.outcome || b.outcome, { resultSource: r.resultSource || adapter.id }));
          render();
        }).catch(() => {
          saveSession(E.recordAttempt(session, b.outcome));
          render();
        });
      }
      return true;
    }
    if (action === 'tally-add-col' || action === 'tally-col-make' || action === 'tally-col-miss' || action === 'tally-col-remove') {
      if (!drillEditorAllowed() || session.gameId !== 'drills') return true;
      const id = session.stageId;
      if (action === 'tally-add-col') addTallyColumn(id);
      else if (action === 'tally-col-remove') removeTallyColumn(id, el.dataset.col);
      else bumpTallyColumn(id, el.dataset.col, action === 'tally-col-make' ? 'make' : 'miss');
      render();
      return true;
    }
    if (action === 'undo-attempt') {
      if (session.attempts.length) {
        saveSession(E.undoAttempt(session));
        toast('Last attempt removed');
        render();
      }
      return true;
    }
    if (action === 'retry') {
      resetUI();
      const s = E.newSession(session.gameId, session.stageId, { endless: session.endless, bossId: session.bossId });
      saveSession(s);
      render();
      return true;
    }
    if (action === 'recipe-open') {
      const { ch } = shotChallenge(session, stage, ev);
      const v = visibility(coach(ch), ch, session.planLocked);
      openSheet(`${recipeCardHTML(ch, { cal: ctx.getState().speedCal, hideAim: !v.aim, hideRoute: !v.cuePath && !v.obPath })}<button type="button" class="bigBtn alt" data-action="why-open">WHY THIS SHOT?</button>`, { id: 'recipe' });
      return true;
    }
    if (action === 'why-open') {
      const { ch } = shotChallenge(session, stage, ev);
      const v = visibility(coach(ch), ch, session.planLocked);
      openSheet(`<div class="eyebrow">WHY THIS SHOT?</div><h2 class="sheetTitle">${esc(displayDrillTitle(ch.name || stage?.name || ''))}</h2>${v.aim ? aimRowHTML(ch) : ''}${whyHTML(ch)}<h3 class="su-h">Set it up (diamonds)</h3>${setupSheetHTML(setupSource(ev, ch))}`, { id: 'why' });
      return true;
    }
    if (action === 'setup-open') {
      const { ch } = shotChallenge(session, stage, ev);
      openSheet(`<div class="eyebrow">SETUP · DIAMOND POSITIONS</div><h2 class="sheetTitle">${esc(displayDrillTitle(ch.name || stage?.name || ''))}</h2>${setupSheetHTML(setupSource(ev, ch))}<button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`, { id: 'setup' });
      return true;
    }
    if (action === 'coach-info') {
      toast('Coaching level follows your skill rating — change it in Settings');
      return true;
    }
    if (action === 'plan-tech') { ui.draft.technique = el.dataset.v; render(); return true; }
    if (action === 'plan-speed') { ui.draft.speed = Number(el.dataset.v); render(); return true; }
    if (action === 'plan-rails') { ui.draft.rails = Number(el.dataset.v); render(); return true; }
    if (action === 'plan-tap') {
      const svg = ctx.root.querySelector('#planBall');
      if (svg && e) {
        const pt = e.touches?.[0] || e;
        const t = tipsFromTap(svg, pt.clientX, pt.clientY);
        Object.assign(ui.draft, t, { touched: true });
        render();
      }
      return true;
    }
    if (action === 'plan-lock') {
      const { ch } = shotChallenge(session, stage, ev);
      lockPlan(ch);
      return true;
    }
    if (action === 'pattern-side') { ui.routeSide = el.dataset.v; render(); return true; }
    if (action === 'pattern-clear') { ui.patternPick = []; render(); return true; }
    if (action === 'pattern-lock') { lockPattern(); return true; }
    if (action === 'pick-ball') {
      const n = Number(el.dataset.n);
      if (!ui.patternPick.includes(n)) ui.patternPick.push(n);
      render();
      return true;
    }
    if (action === 'cal-leg') { ui.calLeg = Number(el.dataset.v); render(); return true; }
    if (action === 'cal-diamond') { ui.calDiamond = Number(el.dataset.v); render(); return true; }
    if (action === 'cal-quick' || action === 'cal-record') {
      const target = ev.nextSpeed;
      let out;
      if (action === 'cal-quick') out = { speed: target, actual: Math.round(target * Number(el.dataset.v) * 100) / 100, quick: el.dataset.v };
      else out = E.calibrationOutcome(target, ui.calLeg, ui.calDiamond);
      ui.calDiamond = null;
      saveSession(E.recordAttempt(session, out));
      render();
      return true;
    }
    if (action === 'play-exit') {
      if (C) { ctx.go(C.exitHref); return true; }
      ctx.go(fromSet ? '#bpset' : session.bossId ? '#career' : session.gameId === 'drills' ? '#drills' : `#game/${session.gameId}`);
      return true;
    }
    return false;
  }

  function onTableTap(target) {
    const ev = evaluate();
    if (ev.mode === 'pattern' && !session.planLocked) {
      const g = target.closest('g.ball.obj-ball');
      if (g && !g.classList.contains('blocker')) {
        const n = Number(g.dataset.n);
        if (!ui.patternPick.includes(n)) ui.patternPick.push(n);
        render();
        return true;
      }
    }
    return false;
  }

  return { render, onAction, onTableTap, get session() { return session; } };
}
