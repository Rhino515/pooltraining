/**
 * Create Drill builder (#drillnew, #drillnew/fromsim, #drilledit/<id>).
 * Place the cue ball, object balls and blockers on the true-scale grid table (¼-diamond snap), pick the
 * target ball and pocket(s), drop cue-ball landing zones, set tip / SPEED / scoring / texts, and the route is
 * computed by the Shot Simulator physics. Saves a full challenge object (customDrills.js) that plays exactly
 * like every other drill.
 */
import { renderStageTable, legendHTML } from '../games/stageTable.js';
import { recipeGaugesHTML, whyHTML, setupLineHTML, esc } from '../games/recipe.js';
import { cueBallSVG, tipsFromTap } from '../games/cueBallDiagram.js';
import { contactText } from '../games/text.js';
import { speedMeaning } from '../games/speed.js';
import { toDiamonds, fmtDiamond } from '../games/diamonds.js';
import { BALL_COLORS, POCKETS } from '../tableDiagram.js';
import { POCKET_NAMES } from '../games/geometry.js';
import { SKILL_NAMES } from '../storage.js';
import { CATEGORIES, refreshCustomDrills } from '../drills.js';
import * as CD from '../customDrills.js';
import * as L from '../sim/layouts.js';
import { R } from '../sim/physics.js';
import { DRAFT_KEY } from './simulator.js';
import { lsSet, lsRemove } from '../storage.js';
import { openSheet, closeSheet, toast } from './sheet.js';

const f2 = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const posText = (p) => { const d = toDiamonds(p); return `${fmtDiamond(d.fromHead)} · ${fmtDiamond(d.fromTop)}`; };
const PKEYS = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];
const PSHORT = { TL: 'Top-left', TM: 'Top side', TR: 'Top-right', BL: 'Bottom-left', BM: 'Bottom side', BR: 'Bottom-right' };
export const WIP_KEY = 'poolIQDrillWip';

/** Rebuild a builder state from a full challenge that has no embedded builder (e.g. hand-written JSON) */
export function builderFromChallenge(ch) {
  if (ch.builder) return { ...CD.defaultBuilder(), ...clone(ch.builder), id: ch.id };
  const b = CD.defaultBuilder();
  const sr = ch.scoringRules || {};
  return {
    ...b,
    id: ch.id,
    title: ch.name,
    category: ch.category || b.category,
    skill: Object.keys(ch.skillEffects || {})[0] || b.skill,
    difficulty: ch.difficulty || 2,
    cue: { ...ch.cueBallPosition },
    balls: (ch.ballPositions || []).map((o) => ({ n: o.n, x: o.x, y: o.y })),
    blockers: (ch.blockers || []).map((o) => ({ n: o.n, x: o.x, y: o.y })),
    targetBall: ch.targetBall ?? ch.ballPositions?.[0]?.n,
    pockets: ch.acceptPockets || (ch.targetPocket ? [ch.targetPocket] : []),
    zones: (ch.targetZones || []).filter((z) => z.type === 'rings').map((z) => ({ x: z.x, y: z.y })),
    tip: { vTips: ch.cueContact?.vTips || 0, hTips: ch.cueContact?.hTips || 0 },
    speed: ch.speed || 2,
    instructions: ch.instructions || '',
    goal: ch.goal || '',
    why: ch.whyExplanation?.whyCustom || '',
    scoring: { ...b.scoring, mode: sr.mode === 'zone' || sr.mode === 'stars' ? sr.mode : 'binary', attempts: sr.attempts || ch.attemptCount || 10, made: sr.pass?.made ?? 7, stars: sr.pass?.stars ?? 12, pockets: sr.pass?.pockets ?? 7, requirePocket: sr.requirePocket !== false }
  };
}

export function createDrillBuilder(ctx, { editId = null, fromSim = false, existing = null } = {}) {
  let b;
  if (existing) b = builderFromChallenge(existing);
  else if (fromSim) {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { d = null; }
    b = { ...CD.defaultBuilder(), ...(d || {}) };
    if (d && !d.zones?.length) b.scoring = { ...b.scoring, mode: 'binary' };
    else if (d) b.scoring = { ...b.scoring, mode: 'zone' };
    delete b.fromSim;
  } else b = CD.defaultBuilder();
  const ui = { sel: null, snap: true, dirty: false, preview: null, route: null, msgs: { errors: [], warnings: [] }, showErrors: false };
  let drag = null;
  let destroyed = false;

  function selItem() {
    const s = ui.sel;
    if (!s) return null;
    if (s.type === 'cue') return b.cue;
    if (s.type === 'ball') return b.balls.find((o) => o.n === s.n);
    if (s.type === 'blocker') return b.blockers.find((o) => o.n === s.n);
    if (s.type === 'zone') return b.zones[s.i];
    return null;
  }
  function usedNumbers() {
    return new Set([...b.balls.map((o) => o.n), ...b.blockers.map((o) => o.n)]);
  }
  function allPoints(exclude) {
    const out = [];
    if (b.cue && exclude !== b.cue) out.push(b.cue);
    for (const o of [...b.balls, ...b.blockers]) if (o !== exclude) out.push(o);
    return out;
  }

  /** Build the preview challenge; tolerant of incomplete layouts */
  function build() {
    ui.route = null;
    const canRoute = b.cue && b.balls.some((o) => o.n === b.targetBall) && b.pockets.length && !L.validateLayout(CD.builderLayout(b).map((x) => ({ ...x, id: x.blocker ? `x${x.id}` : x.id }))).length;
    if (canRoute) {
      try {
        ui.route = CD.computeRoute(b);
        ui.preview = CD.buildCustomDrill({ ...b, title: b.title || 'Untitled drill' }, { id: b.id || 'cd-preview', route: ui.route });
      } catch (e) {
        console.warn('Pool IQ: drill preview failed', e);
        ui.preview = null;
      }
    } else ui.preview = null;
    if (!ui.preview) {
      ui.preview = {
        id: 'cd-preview', name: b.title || 'Untitled drill', kind: 'position',
        ballPositions: b.balls.map((o) => ({ ...o })), blockers: b.blockers.map((o) => ({ ...o })), cueBallPosition: b.cue ? { ...b.cue } : null,
        targetPocket: b.pockets[0] || null,
        targetZones: b.zones.map((z) => ({ type: 'rings', x: z.x, y: z.y, rings: sizes().map((r, i) => ({ r, stars: i + 1 })) })),
        cueBallPath: [], objectBallPaths: [], railContacts: []
      };
    }
    ui.msgs = CD.validateBuilder(b, ui.route);
    lsSet(WIP_KEY, JSON.stringify({ editId, b }));
  }
  const sizes = () => CD.ZONE_SIZES[b.zoneSize] || CD.ZONE_SIZES.M;

  // ------------------------------------------------------------------ table
  function tableSVG() {
    const ch = ui.preview;
    let svg = renderStageTable(ch, { className: 'table-diagram builder-svg' });
    let extra = '';
    for (const k of b.pockets.slice(1)) {
      const p = POCKETS[k];
      extra += `<circle class="alt-pocket" data-pocket="${k}" cx="${p.x}" cy="${p.y}" r="${p.r + 0.9}" fill="none" stroke="#55e5ff" stroke-width="0.35" stroke-dasharray="0.8 0.6" opacity="0.8"/>`;
    }
    b.zones.forEach((z, i) => { extra += `<circle class="zone-handle" data-zone="${i}" cx="${f2(z.x)}" cy="${f2(z.y)}" r="0.7" fill="#55e5ff" stroke="#062a32" stroke-width="0.2"/>`; });
    if (ui.route?.cueEnd) extra += `<circle class="sim-end" cx="${f2(ui.route.cueEnd.x)}" cy="${f2(ui.route.cueEnd.y)}" r="${R}" fill="none" stroke="#f4fbff" stroke-width="0.22" stroke-dasharray="0.4 0.3" opacity="0.8"/>`;
    const it = selItem();
    if (it) extra += `<circle class="sel-ring" cx="${f2(it.x)}" cy="${f2(it.y)}" r="${ui.sel.type === 'zone' ? 1.6 : R + 0.55}" fill="none" stroke="#ffc75b" stroke-width="0.32"/>`;
    if (ui.snap) {
      // faint ¼-diamond dots help with snapping
      let dots = '<g class="snap-dots" fill="#cdeefa" opacity="0.22" pointer-events="none">';
      for (let x = 3.125; x < 100; x += 3.125) for (let y = 3.125; y < 50; y += 3.125) dots += `<circle cx="${x}" cy="${y}" r="0.14"/>`;
      extra = dots + '</g>' + extra;
    }
    return svg.replace(/<\/svg>$/, `${extra}</svg>`);
  }

  // ------------------------------------------------------------------ panel
  const section = (title, body, id = '') => `<section class="dbSec"${id ? ` id="${id}"` : ''}><h3>${title}</h3>${body}</section>`;
  function ballChips() {
    const used = usedNumbers();
    return Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
      const isBall = b.balls.some((o) => o.n === n);
      const isBlk = b.blockers.some((o) => o.n === n);
      return `<button type="button" class="trayBall${isBall ? ' on' : ''}${isBlk ? ' on blk' : ''}${n >= 9 ? ' stripe' : ''}" data-action="db-ball" data-n="${n}" style="--c:${BALL_COLORS[n]}" aria-label="Ball ${n}${isBall ? ' (on table)' : isBlk ? ' (blocker)' : ''}" ${!isBall && !isBlk && used.has(n) ? 'disabled' : ''}><i>${n}</i></button>`;
    }).join('');
  }
  function selPad() {
    const it = selItem();
    if (!it) return '<p class="muted small hint">Drag balls and zones on the table. Tap one to select it for fine moves.</p>';
    const name = ui.sel.type === 'cue' ? 'Cue ball' : ui.sel.type === 'ball' ? `${ui.sel.n}-ball` : ui.sel.type === 'blocker' ? `Blocker ${ui.sel.n}` : `Zone ${ui.sel.i + 1}`;
    return `<div class="simSel"><span class="selName"><b>${esc(name)}</b><small>${posText(it)}</small></span>
      <div class="nudgePad"><button type="button" class="nudge" data-action="db-nudge" data-dx="-1" data-dy="0" aria-label="Move left">←</button><button type="button" class="nudge" data-action="db-nudge" data-dx="0" data-dy="-1" aria-label="Move up">↑</button><button type="button" class="nudge" data-action="db-nudge" data-dx="0" data-dy="1" aria-label="Move down">↓</button><button type="button" class="nudge" data-action="db-nudge" data-dx="1" data-dy="0" aria-label="Move right">→</button></div>
      ${ui.sel.type === 'cue' ? '' : `<button type="button" class="nudge danger" data-action="db-remove">Remove</button>`}</div>`;
  }
  function simStatus() {
    const r = ui.route;
    if (!r) return '<p class="simStatus muted">Place the cue ball, a target ball and choose a pocket to see the simulated route.</p>';
    const bits = [];
    bits.push(r.made ? `<b class="green">✓ The ${b.targetBall} drops in the ${esc(PSHORT[r.madeInto])}</b>` : `<b class="gold">✕ The ${b.targetBall} doesn't drop${r.rattled ? ' (rattles)' : ''}</b>`);
    if (r.scratch) bits.push('<b class="red">scratch</b>');
    else if (r.cueEnd) bits.push(`cue ball stops at ${posText(r.cueEnd)}${b.zones.length && r.zoneMiss != null ? ` — ${r.zoneMiss < 3.5 ? 'inside the 3★ ring' : `${Math.round(r.zoneMiss)}" from the zone`}` : ''}`);
    return `<p class="simStatus" data-made="${r.made ? 1 : 0}">${bits.join(' · ')} <small class="muted">(simulated — an approximation)</small></p>`;
  }
  function panelHTML() {
    const sc = b.scoring;
    const num = (id, v, min, max, label) => `<label class="numFld"><span>${label}</span><span class="stepper"><button type="button" class="nudge" data-action="db-step" data-k="${id}" data-v="-1" aria-label="Less">−</button><input type="number" id="db-${id}" data-k="${id}" min="${min}" max="${max}" value="${v}" inputmode="numeric"/><button type="button" class="nudge" data-action="db-step" data-k="${id}" data-v="1" aria-label="More">+</button></span></label>`;
    return [
      section('1 · Layout', `<div class="dbRow"><span class="lbl">Object balls</span><div class="simTray dbTray">${ballChips()}</div></div>
        <div class="chips"><button type="button" class="chip" data-action="db-blocker">+ Blocker ball</button><button type="button" class="chip${ui.snap ? ' active' : ''}" data-action="db-snap">Snap to ¼ diamond: ${ui.snap ? 'on' : 'off'}</button>${b.cue ? '' : '<button type="button" class="chip" data-action="db-cue">+ Cue ball</button>'}</div>
        ${selPad()}
        <div class="dbRow"><span class="lbl">Target ball</span><div class="chips">${b.balls.length ? b.balls.map((o) => `<button type="button" class="chip${b.targetBall === o.n ? ' active' : ''}" data-action="db-target" data-n="${o.n}">${o.n}</button>`).join('') : '<span class="muted small">add an object ball first</span>'}</div></div>
        <div class="dbRow"><span class="lbl">Target pocket(s)</span><div class="chips">${PKEYS.map((k) => `<button type="button" class="chip${b.pockets.includes(k) ? ' active' : ''}" data-action="db-pocket" data-k="${k}">${b.pockets[0] === k ? '★ ' : ''}${PSHORT[k]}</button>`).join('')}</div><small class="muted">Tap a pocket on the table to target it, or pick several here — ★ is the main pocket the route aims at; the others also count as made.</small></div>`, 'dbLayout'),
      section('2 · Cue-ball zones', `<div class="chips"><button type="button" class="chip" data-action="db-zone-add">+ Add zone</button><button type="button" class="chip" data-action="db-zone-end" ${ui.route?.cueEnd ? '' : 'disabled'}>Zone where the cue ball stops</button>${b.zones.length ? '<button type="button" class="chip" data-action="db-zone-clear">Remove all zones</button>' : ''}</div>
        <div class="dbRow"><span class="lbl">Ring size</span><div class="chips">${Object.keys(CD.ZONE_SIZES).map((k) => `<button type="button" class="chip${b.zoneSize === k ? ' active' : ''}" data-action="db-zsize" data-k="${k}">${k === 'S' ? 'Small' : k === 'M' ? 'Medium' : 'Large'} (3★ ${CD.ZONE_SIZES[k][2]}")</button>`).join('')}</div></div>
        <small class="muted">${b.zones.length ? `${b.zones.length} zone${b.zones.length > 1 ? 's' : ''} — drag the dot in the middle to move one.` : 'No zone: the drill is scored on the pot only (or quality stars).'}</small>`, 'dbZones'),
      section('3 · Shot recipe', `<div class="simTipSpeed"><button type="button" class="simTip" data-action="db-tip" aria-label="Cue-ball tip">${cueBallSVG(b.tip, { size: 'sm', interactive: true, id: 'dbTipBall' })}<small>${esc(contactText(b.tip.vTips, b.tip.hTips))}</small></button>
        <div class="simSpeed"><div class="spRow"><button type="button" class="spBtn" data-action="db-speed" data-v="-0.5" aria-label="Slower">−</button><b data-speed="${b.speed.toFixed(1)}">SPEED ${b.speed.toFixed(1)}</b><button type="button" class="spBtn" data-action="db-speed" data-v="0.5" aria-label="Faster">+</button></div><small>${esc(speedMeaning(b.speed))}</small></div></div>
        <div class="dbRow"><span class="lbl">Aim</span><div class="chips"><button type="button" class="chip" data-action="db-aim" data-v="-0.5">−0.5°</button><button type="button" class="chip" data-action="db-aim" data-v="-0.1">−0.1°</button><span class="aimOff">${b.aimOffset ? `${b.aimOffset > 0 ? '+' : ''}${f2(b.aimOffset)}° from auto` : 'auto (throw-compensated)'}</span><button type="button" class="chip" data-action="db-aim" data-v="0.1">+0.1°</button><button type="button" class="chip" data-action="db-aim" data-v="0.5">+0.5°</button></div></div>
        <div class="chips"><button type="button" class="chip${b.showRoute !== false ? ' active' : ''}" data-action="db-route">Show cue-ball route: ${b.showRoute !== false ? 'on' : 'off'}</button></div>
        ${simStatus()}`, 'dbRecipe'),
      section('4 · Details', `<label class="fld"><span>Title</span><input id="db-title" type="text" maxlength="60" value="${esc(b.title)}" placeholder="e.g. Draw to the side rail"/></label>
        <div class="dbGrid2"><label class="fld"><span>Category</span><select id="db-category">${CATEGORIES.map((c) => `<option${b.category === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="fld"><span>Skill trained</span><select id="db-skill">${SKILL_NAMES.map((c) => `<option${b.skill === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label></div>
        <div class="dbRow"><span class="lbl">Level</span><div class="chips">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="chip${Number(b.difficulty) === n ? ' active' : ''}" data-action="db-level" data-v="${n}">Level ${n}</button>`).join('')}</div></div>
        <label class="fld"><span>Instructions <small class="muted">(optional — auto text if blank)</small></span><textarea id="db-instructions" rows="3" maxlength="600">${esc(b.instructions)}</textarea></label>
        <label class="fld"><span>Goal <small class="muted">(optional)</small></span><input id="db-goal" type="text" maxlength="140" value="${esc(b.goal)}"/></label>
        <label class="fld"><span>Why This Shot? — coach's note <small class="muted">(shown first in the Why sheet)</small></span><textarea id="db-why" rows="3" maxlength="600">${esc(b.why)}</textarea></label>`, 'dbDetails'),
      section('5 · Scoring', `<div class="chips">${CD.SCORING_MODES.map((m) => `<button type="button" class="chip${sc.mode === m.id ? ' active' : ''}" data-action="db-mode" data-v="${m.id}">${m.label}</button>`).join('')}</div>
        <div class="dbGrid2">${num('attempts', sc.attempts, 1, 50, 'Attempts')}
        ${sc.mode === 'binary' ? num('made', sc.made, 1, sc.attempts, 'Made to pass') : num('stars', sc.stars, 1, sc.attempts * 3, 'Stars to pass')}
        ${sc.mode === 'zone' && sc.requirePocket !== false ? num('pockets', sc.pockets, 0, sc.attempts, 'Pots to pass') : ''}</div>
        ${sc.mode === 'zone' ? `<div class="chips"><button type="button" class="chip${sc.requirePocket !== false ? ' active' : ''}" data-action="db-reqpot">Must pocket the ball: ${sc.requirePocket !== false ? 'yes' : 'no'}</button></div>` : ''}
        <small class="muted">${sc.mode === 'zone' ? 'Each attempt: missed / pocketed / 1–3★ by where the cue ball stops.' : sc.mode === 'stars' ? 'Each attempt is rated 0–3★ by you.' : 'Each attempt: miss / contact only / made.'}</small>`, 'dbScoring'),
      msgsHTML()
    ].join('');
  }
  function msgsHTML() {
    const m = ui.msgs;
    if (!m.errors.length && !m.warnings.length) return '<div class="dbMsgs ok" id="dbMsgs"><b class="green">✓ Ready to save</b></div>';
    return `<div class="dbMsgs${ui.showErrors && m.errors.length ? ' show' : ''}" id="dbMsgs">${m.errors.map((e) => `<p class="err">• ${esc(e)}</p>`).join('')}${m.warnings.map((w) => `<p class="warn">⚠ ${esc(w)}</p>`).join('')}</div>`;
  }
  function headHTML() {
    return `<div class="playHead"><button type="button" class="phBack" data-action="db-exit" aria-label="Back">‹</button><div class="phTitle"><small>DRILLS</small><b>${editId ? 'Edit Drill' : 'Create Drill'}</b></div><div class="phStatus"><button type="button" class="hBtn act" data-action="db-preview">Preview</button></div></div>`;
  }

  // ------------------------------------------------------------------ render
  function render() {
    if (destroyed) return;
    build();
    ctx.root.innerHTML = `<div class="playScreen builderScreen" data-builder="${editId ? 'edit' : 'new'}">
      ${headHTML()}
      <div class="playTable builderTable" id="dbTable">${tableSVG()}<div class="dragBubble" id="dragBubble"></div></div>
      <div id="dbSetup">${ui.preview.cueBallPosition ? setupLineHTML(ui.preview) : ''}</div>
      <div class="builderBody" id="dbPanel">${panelHTML()}</div>
      <div class="resultBar n2 dbBar"><button type="button" class="rb alt" data-action="db-preview"><b>PREVIEW</b></button><button type="button" class="rb s3" data-action="db-save"><b>SAVE DRILL</b></button></div>
    </div>`;
    bindTable();
    bindFields();
  }
  function refresh() {
    if (destroyed) return;
    const t = ctx.root.querySelector('#dbTable');
    if (!t) return render();
    build();
    t.innerHTML = `${tableSVG()}<div class="dragBubble" id="dragBubble"></div>`;
    ctx.root.querySelector('#dbSetup').innerHTML = ui.preview.cueBallPosition ? setupLineHTML(ui.preview) : '';
    const scrollY = window.scrollY;
    ctx.root.querySelector('#dbPanel').innerHTML = panelHTML();
    bindFields();
    window.scrollTo(0, scrollY);
  }
  function refreshMsgs() {
    ui.msgs = CD.validateBuilder(b, ui.route);
    const m = ctx.root.querySelector('#dbMsgs');
    if (m) m.outerHTML = msgsHTML();
  }
  function bindFields() {
    const root = ctx.root;
    const txt = { 'db-title': 'title', 'db-instructions': 'instructions', 'db-goal': 'goal', 'db-why': 'why' };
    for (const [id, k] of Object.entries(txt)) {
      const el = root.querySelector(`#${id}`);
      if (el) el.addEventListener('input', () => { b[k] = el.value; ui.dirty = true; refreshMsgs(); lsSet(WIP_KEY, JSON.stringify({ editId, b })); });
    }
    for (const [id, k] of [['db-category', 'category'], ['db-skill', 'skill']]) {
      const el = root.querySelector(`#${id}`);
      if (el) el.addEventListener('change', () => { b[k] = el.value; ui.dirty = true; });
    }
    root.querySelectorAll('.numFld input').forEach((el) => {
      el.addEventListener('change', () => { b.scoring[el.dataset.k] = Math.round(Number(el.value) || 0); ui.dirty = true; refresh(); });
    });
  }

  // ------------------------------------------------------------------ table input
  function toTable(e) {
    const svg = ctx.root.querySelector('#dbTable svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }
  function hit(p) {
    let best = null;
    let bd = 3.2;
    const consider = (item, sel) => { const d = Math.hypot(item.x - p.x, item.y - p.y); if (d < bd) { bd = d; best = { item, sel }; } };
    if (b.cue) consider(b.cue, { type: 'cue' });
    for (const o of b.balls) consider(o, { type: 'ball', n: o.n });
    for (const o of b.blockers) consider(o, { type: 'blocker', n: o.n });
    if (!best) { bd = 3.2; b.zones.forEach((z, i) => consider(z, { type: 'zone', i })); }
    return best;
  }
  function pocketAt(p) {
    for (const [k, pk] of Object.entries(POCKETS)) if (Math.hypot(pk.x - p.x, pk.y - p.y) < pk.r + 1.6) return k;
    return null;
  }
  function bindTable() {
    const t = ctx.root.querySelector('#dbTable');
    t.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = toTable(e);
      try { t.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const h = hit(p);
      drag = h ? { ...h, from: { x: h.item.x, y: h.item.y }, ox: h.item.x - p.x, oy: h.item.y - p.y, sx: e.clientX, sy: e.clientY, moved: false } : { pocket: pocketAt(p), sx: e.clientX, sy: e.clientY };
    });
    t.addEventListener('pointermove', (e) => {
      if (!drag || !drag.item) return;
      e.preventDefault();
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
      drag.moved = true;
      const p = toTable(e);
      let q = L.clampToTable({ x: p.x + drag.ox, y: p.y + drag.oy });
      if (ui.snap) q = L.snapPoint(q);
      drag.to = q;
      const svg = ctx.root.querySelector('#dbTable svg');
      let g = null;
      if (drag.sel.type === 'cue') g = svg.querySelector('g.ball[data-n="cue"]');
      else if (drag.sel.type !== 'zone') g = svg.querySelector(`g.ball[data-n="${drag.sel.n}"]`);
      else g = svg.querySelector(`.zone-handle[data-zone="${drag.sel.i}"]`);
      if (g) g.setAttribute('transform', `translate(${f2(q.x - drag.from.x)} ${f2(q.y - drag.from.y)})`);
      const bub = ctx.root.querySelector('#dragBubble');
      if (bub) {
        const rect = t.getBoundingClientRect();
        bub.textContent = posText(q);
        bub.style.left = `${Math.max(44, Math.min(rect.width - 44, e.clientX - rect.left))}px`;
        bub.style.top = `${Math.max(0, e.clientY - rect.top - 60)}px`;
        bub.classList.add('show');
      }
    });
    const end = () => {
      const d = drag;
      drag = null;
      if (!d) return;
      if (!d.item) {
        if (d.pocket) tablePocket(d.pocket);
        else ui.sel = null;
        refresh();
        return;
      }
      ui.sel = d.sel;
      if (d.moved && d.to) {
        let q = d.to;
        if (d.sel.type !== 'zone') q = L.freeSpot(allPoints(d.item), q);
        d.item.x = f2(q.x);
        d.item.y = f2(q.y);
        ui.dirty = true;
      }
      refresh();
    };
    t.addEventListener('pointerup', end);
    t.addEventListener('pointercancel', () => { drag = null; refresh(); });
  }
  /** Table tap: that pocket becomes the (single) target pocket */
  function tablePocket(k) {
    b.pockets = [k];
    ui.dirty = true;
  }
  /** Chip tap: add / remove a pocket; the first one in the list is the main pocket the route aims at */
  function togglePocket(k) {
    b.pockets = b.pockets.includes(k) ? b.pockets.filter((x) => x !== k) : [...b.pockets, k];
    ui.dirty = true;
  }

  // ------------------------------------------------------------------ preview + save
  function previewSheet() {
    build();
    const ch = ui.preview;
    const m = ui.msgs;
    const sr = ch.scoringRules;
    const passText = !sr ? '' : sr.mode === 'zone' ? `${sr.pass.stars}★${sr.requirePocket !== false ? ` & ${sr.pass.pockets} pots` : ''} in ${sr.attempts} attempts` : sr.mode === 'stars' ? `${sr.pass.stars}★ in ${sr.attempts} attempts` : `${sr.pass.made} of ${sr.attempts} made`;
    openSheet(`<div class="eyebrow">PREVIEW · HOW IT WILL PLAY</div><h2 class="sheetTitle">${esc(ch.name)}</h2>
      <div class="previewTable">${renderStageTable(ch)}</div>${ch.cueBallPosition ? setupLineHTML(ch) : ''}${ch.cueContact ? legendHTML(ch) : ''}
      ${ch.cueContact ? `<div class="recipeRow">${recipeGaugesHTML(ch)}</div>` : ''}
      <p class="goal">${esc(ch.goal || '')}</p>${passText ? `<p class="muted small">Pass: ${esc(passText)} · Level ${ch.difficulty || b.difficulty}</p>` : ''}
      ${ch.whyExplanation ? `<h3>Why this shot?</h3>${whyHTML(ch)}` : ''}
      ${m.errors.length ? `<div class="dbMsgs show">${m.errors.map((e) => `<p class="err">• ${esc(e)}</p>`).join('')}</div>` : ''}
      <button type="button" class="bigBtn" data-action="db-save">SAVE DRILL</button><button type="button" class="bigBtn alt" data-action="sheet-close">KEEP EDITING</button>`, { id: 'dbpreview' });
  }
  function save() {
    build();
    const m = ui.msgs;
    if (m.errors.length) {
      ui.showErrors = true;
      closeSheet();
      refresh();
      toast(m.errors[0]);
      ctx.root.querySelector('#dbMsgs')?.scrollIntoView({ block: 'center' });
      return;
    }
    const prev = editId ? CD.loadCustomDrills().find((d) => d.id === editId) : null;
    const ch = CD.buildCustomDrill({ ...b, created: prev?.created }, { id: editId || null, route: ui.route });
    CD.upsertCustomDrill(ch);
    refreshCustomDrills();
    lsRemove(WIP_KEY); lsRemove(DRAFT_KEY);
    ui.dirty = false;
    closeSheet();
    toast(editId ? `Saved changes to “${ch.name}”` : `“${ch.name}” added to your drill library`);
    ctx.go('#drills');
  }

  // ------------------------------------------------------------------ actions
  function nudge(dx, dy) {
    const it = selItem();
    if (!it) return;
    const step = ui.snap ? L.QUARTER : 0.25;
    let q = L.clampToTable({ x: it.x + dx * step, y: it.y + dy * step });
    if (ui.snap) q = L.snapPoint(q);
    if (ui.sel.type !== 'zone' && allPoints(it).some((o) => Math.hypot(o.x - q.x, o.y - q.y) < 2 * R - 0.001)) { toast('Blocked by another ball'); return; }
    it.x = f2(q.x);
    it.y = f2(q.y);
    ui.dirty = true;
    refresh();
  }
  function addSpot(pref) {
    const q = L.freeSpot(allPoints(null), pref);
    return ui.snap ? L.freeSpot(allPoints(null), L.snapPoint(q)) : q;
  }
  function onAction(a, el, e) {
    if (!a.startsWith('db-')) return false;
    switch (a) {
      case 'db-exit':
        if (ui.dirty) {
          openSheet(`<h2 class="sheetTitle">Leave without saving?</h2><p class="muted">Your changes to this drill will be lost.</p><button type="button" class="bigBtn danger" data-action="db-exit-do">LEAVE</button><button type="button" class="bigBtn alt" data-action="sheet-close">KEEP EDITING</button>`, { id: 'confirm' });
          return true;
        }
        ctx.go('#drills');
        return true;
      case 'db-exit-do':
        ui.dirty = false;
        lsRemove(WIP_KEY);
        closeSheet();
        ctx.go('#drills');
        return true;
      case 'db-preview': previewSheet(); return true;
      case 'db-save': save(); return true;
      case 'db-ball': {
        const n = Number(el.dataset.n);
        const inBalls = b.balls.find((o) => o.n === n);
        const inBlk = b.blockers.find((o) => o.n === n);
        if (inBalls || inBlk) {
          const sel = { type: inBalls ? 'ball' : 'blocker', n };
          if (ui.sel && ui.sel.type === sel.type && ui.sel.n === n) {
            // second tap removes it
            b.balls = b.balls.filter((o) => o.n !== n);
            b.blockers = b.blockers.filter((o) => o.n !== n);
            if (b.targetBall === n) b.targetBall = b.balls[0]?.n ?? null;
            ui.sel = null;
          } else ui.sel = sel;
        } else {
          const q = addSpot({ x: 62.5 + ((n * 7) % 25) - 12, y: 25 + ((n * 5) % 16) - 8 });
          b.balls.push({ n, x: f2(q.x), y: f2(q.y) });
          if (!b.balls.some((o) => o.n === b.targetBall)) b.targetBall = n;
          ui.sel = { type: 'ball', n };
        }
        ui.dirty = true;
        refresh();
        return true;
      }
      case 'db-blocker': {
        const used = usedNumbers();
        const n = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].find((x) => !used.has(x));
        if (!n) { toast('All 15 numbers are in use'); return true; }
        const q = addSpot({ x: 50, y: 25 });
        b.blockers.push({ n, x: f2(q.x), y: f2(q.y) });
        ui.sel = { type: 'blocker', n };
        ui.dirty = true;
        refresh();
        toast(`Blocker added (drawn with a red ring) — drag it into place`);
        return true;
      }
      case 'db-cue': { const q = addSpot({ x: 25, y: 25 }); b.cue = { x: f2(q.x), y: f2(q.y) }; ui.sel = { type: 'cue' }; ui.dirty = true; refresh(); return true; }
      case 'db-snap': ui.snap = !ui.snap; refresh(); return true;
      case 'db-nudge': nudge(Number(el.dataset.dx), Number(el.dataset.dy)); return true;
      case 'db-remove': {
        const s = ui.sel;
        if (!s) return true;
        if (s.type === 'ball') { b.balls = b.balls.filter((o) => o.n !== s.n); if (b.targetBall === s.n) b.targetBall = b.balls[0]?.n ?? null; }
        if (s.type === 'blocker') b.blockers = b.blockers.filter((o) => o.n !== s.n);
        if (s.type === 'zone') b.zones.splice(s.i, 1);
        ui.sel = null;
        ui.dirty = true;
        refresh();
        return true;
      }
      case 'db-target': b.targetBall = Number(el.dataset.n); ui.dirty = true; refresh(); return true;
      case 'db-pocket': togglePocket(el.dataset.k); refresh(); return true;
      case 'db-zone-add': {
        const base = ui.route?.cueEnd || { x: 37.5, y: 25 };
        b.zones.push({ x: f2(Math.min(90, Math.max(10, base.x))), y: f2(Math.min(40, Math.max(10, base.y))) });
        ui.sel = { type: 'zone', i: b.zones.length - 1 };
        if (b.scoring.mode !== 'zone') b.scoring = { ...b.scoring, mode: 'zone' };
        ui.dirty = true;
        refresh();
        return true;
      }
      case 'db-zone-end':
        if (ui.route?.cueEnd) {
          const z = { x: ui.route.cueEnd.x, y: ui.route.cueEnd.y };
          if (ui.sel?.type === 'zone') b.zones[ui.sel.i] = z;
          else { b.zones.push(z); ui.sel = { type: 'zone', i: b.zones.length - 1 }; }
          if (b.scoring.mode !== 'zone') b.scoring = { ...b.scoring, mode: 'zone' };
          ui.dirty = true;
          refresh();
        }
        return true;
      case 'db-zone-clear': b.zones = []; if (b.scoring.mode === 'zone') b.scoring = { ...b.scoring, mode: 'binary' }; ui.sel = null; ui.dirty = true; refresh(); return true;
      case 'db-zsize': b.zoneSize = el.dataset.k; ui.dirty = true; refresh(); return true;
      case 'db-tip': {
        const svg = ctx.root.querySelector('#dbTipBall');
        if (svg && e) { b.tip = tipsFromTap(svg, e.clientX, e.clientY); ui.dirty = true; refresh(); }
        return true;
      }
      case 'db-speed': b.speed = Math.max(0.5, Math.min(5, Math.round((b.speed + Number(el.dataset.v)) * 2) / 2)); ui.dirty = true; refresh(); return true;
      case 'db-aim': b.aimOffset = Math.max(-5, Math.min(5, Math.round(((Number(b.aimOffset) || 0) + Number(el.dataset.v)) * 100) / 100)); ui.dirty = true; refresh(); return true;
      case 'db-route': b.showRoute = b.showRoute === false; ui.dirty = true; refresh(); return true;
      case 'db-level': b.difficulty = Number(el.dataset.v); ui.dirty = true; refresh(); return true;
      case 'db-mode': b.scoring = { ...b.scoring, mode: el.dataset.v }; ui.dirty = true; refresh(); return true;
      case 'db-reqpot': b.scoring = { ...b.scoring, requirePocket: b.scoring.requirePocket === false }; ui.dirty = true; refresh(); return true;
      case 'db-step': {
        const k = el.dataset.k;
        const max = k === 'attempts' ? 50 : k === 'stars' ? b.scoring.attempts * 3 : b.scoring.attempts;
        const min = k === 'pockets' ? 0 : 1;
        b.scoring[k] = Math.max(min, Math.min(max, (Number(b.scoring[k]) || 0) + Number(el.dataset.v)));
        if (k === 'attempts') {
          b.scoring.made = Math.min(b.scoring.made, b.scoring.attempts);
          b.scoring.pockets = Math.min(b.scoring.pockets, b.scoring.attempts);
          b.scoring.stars = Math.min(b.scoring.stars, b.scoring.attempts * 3);
        }
        ui.dirty = true;
        refresh();
        return true;
      }
      default:
        return false;
    }
  }

  return {
    render,
    onAction,
    destroy() { destroyed = true; },
    get builder() { return b; },
    get isDirty() { return ui.dirty; }
  };
}
