/**
 * My Content — .pooliq import → validate → preview → play test → install, plus playing installed content.
 *
 * Routes (app.js):  #content            My Content hub (import button, sections, examples, schema docs)
 *                   #cimport            import error screen (why the file was rejected)
 *                   #cview/<ref>        preview / details (ref = 'pending' for an imported file not yet installed, or an item uid)
 *                   #cplay/<ref>[/<i>]  play (pack stage i). ref 'pending' = PLAY TEST sandbox: nothing is ever saved
 *                   #cedit/<uid>[/<loc>] edit (Create Drill builder in content mode; loc = which shot, e.g. stages.2)
 *
 * Security: imported documents are validated by content/schema.js before anything is shown, and every string
 * from a file goes through esc() (HTML-escaped) — never raw innerHTML. Links: http/https only, rel=noopener.
 * Isolation: content play never calls ctx.commit (Career state untouched); only installed items write their
 * own personal progress (content/store.js, poolIQContentProgressV1).
 */
import { validatePooliq, typeLabel, serialize, fileNameFor, TEMPLATE_NAMES, PHASE_NAMES, LESSON_PHASES, MAX_FILE_BYTES, RAIL_DIAMONDS } from '../content/schema.js';
import * as S from '../content/store.js';
import { shotToChallenge, docFromChallenge, checkedDoc } from '../content/convert.js';
import * as T from '../content/templates.js';
import { renderStageTable, legendHTML } from '../games/stageTable.js';
import { recipeGaugesHTML, recipeCardHTML, whyHTML, setupLineHTML, setupSheetHTML, aimRowHTML, esc } from '../games/recipe.js';
import { cueBallSVG, tipsFromTap } from '../games/cueBallDiagram.js';
import { coachingLevel, visibility, comparePlan, TECHNIQUES, RAIL_CHOICES } from '../games/coaching.js';
import { contactText, englishText, techniqueName } from '../games/text.js';
import { speedLabel, speedMeaning, formatSpeed, SPEED_STEPS } from '../games/speed.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { createPlayScreen } from './play.js';
import { shareOrDownload } from './share.js';
import * as CD from '../customDrills.js';
import { customDrills, refreshCustomDrills, contentDrillId } from '../drills.js';

export const ACCEPT = '.pooliq,.json,application/json,application/octet-stream,text/plain';
export const EXAMPLES = [
  { file: 'demo-single-drill.pooliq', label: 'Single drill' },
  { file: 'demo-training-pack.pooliq', label: 'Training pack (4 stages)' },
  { file: 'demo-lesson.pooliq', label: 'Lesson (teach → test)' },
  { file: 'demo-gauntlet.pooliq', label: 'Gauntlet skill game' },
  { file: 'demo-diamond-challenge.pooliq', label: 'Diamond / rail answer' },
  { file: 'demo-player-solution.pooliq', label: 'Player-solution challenge' },
  { file: 'pooliq-drill-template.pooliq', label: 'Template (every field)' }
];
const FMT = { technique: techniqueName, contact: contactText, english: (h) => englishText(h), speed: (s) => (s == null ? '—' : speedLabel(s)) };
const SANDBOX_NOTE = 'PLAY TEST — nothing was saved. Career, ratings, history and achievements are unchanged.';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtDate = (t) => (t ? new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

// ------------------------------------------------------------------ pending import (memory only until installed)
let pending = null; // { doc, warnings, fileName }
let importError = null; // { fileName, errors }
export const getPending = () => pending;
export const getImportError = () => importError;
export function clearPending() { pending = null; }

/** Validate text and route to the preview (or the error screen). Never installs anything. */
export function processImport(text, fileName, ctx) {
  const v = validatePooliq(text);
  if (v.ok && v.legacy) {
    try {
      const existing = CD.loadCustomDrills();
      const out = CD.parseDrillImport(text, existing.map((d) => d.id));
      if (!out.drills.length) throw new Error('No drills found in that file.');
      CD.saveCustomDrills([...existing, ...out.drills]);
      refreshCustomDrills();
      toast(`Imported ${out.drills.length} Create Drill drill${out.drills.length > 1 ? 's' : ''} (older Pool IQ format) into My Drills`);
      ctx.go('#content');
    } catch (err) {
      importError = { fileName, errors: ['CANNOT IMPORT — This older Pool IQ drill file could not be read.', String(err.message || err)] };
      ctx.go('#cimport');
    }
    return v;
  }
  if (!v.ok) {
    importError = { fileName, errors: v.errors };
    pending = null;
    ctx.go('#cimport');
    return v;
  }
  pending = { doc: v.doc, warnings: v.warnings, fileName };
  importError = null;
  ctx.go('#cview/pending');
  return v;
}
export async function handleContentFile(file, ctx) {
  if (!file) return;
  if (file.size > MAX_FILE_BYTES) {
    importError = { fileName: file.name, errors: [`CANNOT IMPORT — The file is too large (${Math.round(file.size / 1024)} KB). .pooliq files can be up to ${MAX_FILE_BYTES / 1024} KB.`] };
    ctx.go('#cimport');
    return;
  }
  let text;
  try { text = await file.text(); } catch { text = null; }
  if (text == null) {
    importError = { fileName: file.name, errors: ['CANNOT IMPORT — The file could not be read.'] };
    ctx.go('#cimport');
    return;
  }
  processImport(text, file.name, ctx);
}

function resolve(ref) {
  if (ref === 'pending') return pending ? { ref, doc: pending.doc, sandbox: true, uid: null, warnings: pending.warnings, fileName: pending.fileName, source: 'imported' } : null;
  const it = S.getItem(ref);
  return it ? { ref, doc: it.doc, sandbox: false, uid: it.uid, item: it, source: it.source || 'imported', warnings: [] } : null;
}

// ------------------------------------------------------------------ text helpers
export function passText(sr) {
  if (!sr) return '—';
  if (sr.mode === 'success' || sr.mode === 'binary') return `${sr.pass.made} of ${sr.attempts} successful`;
  if (sr.mode === 'zone') return `${sr.pass.stars}★${sr.requirePocket !== false && sr.pass.pockets ? ` & ${sr.pass.pockets} pots` : ''} in ${sr.attempts} attempts`;
  return `${sr.pass.stars}★ in ${sr.attempts} attempts`;
}
const MODE_TEXT = { success: 'SUCCESS / MISS each attempt', binary: 'MISS / CONTACT ONLY / MADE', zone: 'Pocket + cue-ball zone stars (0–3★)', stars: 'Quality stars 0–3★ (you rate each attempt)' };
const STAGE_TYPE = { lesson: 'Lesson', practice: 'Practice', test: 'Test', final: 'Final challenge' };
const ASK_TEXT = { technique: 'follow / stun / draw', tip: 'tip position', english: 'English (side spin)', speed: 'SPEED', rails: 'number of rails', rail: 'rail', diamond: 'diamond / reference point' };
function badgesHTML(doc, source, extra = '') {
  const b = [];
  b.push(`<span class="tag ${source === 'custom' ? 'mine' : 'imp'}" data-badge="${source === 'custom' ? 'custom' : 'imported'}">${source === 'custom' ? 'CUSTOM' : 'IMPORTED'}</span>`);
  b.push(`<span class="tag">${esc(typeLabel(doc.contentType))}</span>`);
  if (doc.contentType === 'game') b.push(`<span class="tag">${esc(TEMPLATE_NAMES[doc.template])}</span>`);
  b.push(`<span class="tag" data-version="${esc(doc.contentVersion)}">v${esc(doc.contentVersion)}</span>`);
  if (doc.metadata?.demo) b.push('<span class="tag demo">DEMO</span>');
  if (doc.careerEligible && doc.contentType === 'drill') b.push('<span class="tag elig">COUNTS IN HISTORY</span>');
  return `<div class="cBadges">${b.join('')}${extra}</div>`;
}
/** Attribution: plain text; the source link is shown as text + a safe link (http/https validated, rel=noopener) */
function attributionHTML(doc) {
  const a = doc.attribution || {};
  const rows = [];
  if (a.author) rows.push(`<div><span>Author</span><b>${esc(a.author)}</b></div>`);
  if (a.sourceName) rows.push(`<div><span>Source</span><b>${esc(a.sourceName)}</b></div>`);
  if (a.sourceURL && /^https?:\/\//i.test(a.sourceURL)) rows.push(`<div><span>Link</span><b><a href="${esc(a.sourceURL)}" target="_blank" rel="noopener noreferrer nofollow" data-source-url>${esc(a.sourceURL)}</a></b></div>`);
  if (a.notes) rows.push(`<div><span>Notes</span><b>${esc(a.notes)}</b></div>`);
  return `<div class="card cvAttr" data-attribution><div class="eyebrow">SOURCE / ATTRIBUTION</div>${rows.length ? rows.join('') : '<p class="muted small">No author or source given in the file.</p>'}${doc.metadata?.generator ? `<p class="muted small">Made with: ${esc(doc.metadata.generator)}</p>` : ''}</div>`;
}
/** Challenge object for an item shot (id is deterministic per document + item) */
function chFor(doc, item, key, extra = {}) {
  return shotToChallenge(item.shot, { id: `cx-${doc.id}-${key}`, title: extra.title || item.title || doc.title, category: item.category || doc.category, difficulty: item.difficulty || doc.difficulty, skill: item.skill || doc.skill, scoringRules: extra.scoringRules || item.scoringRules, xp: item.xp, skillEffects: item.skillEffects });
}
function firstShot(doc) {
  if (doc.shot) return { item: doc, key: 'root' };
  if (doc.contentType === 'lesson') { const i = doc.steps.findIndex((s) => s.shot); return i >= 0 ? { item: doc.steps[i], key: `step${i}` } : null; }
  if (doc.contentType === 'game') return { item: doc.stages[0], key: 'g0' };
  if (doc.contentType === 'pack') { for (const st of doc.stages) { const f = firstShot(st); if (f) return { item: f.item, key: `${st.id}-${f.key}`, doc: st }; } }
  return null;
}
function itemProgressText(it, prog) {
  const p = prog[it.uid];
  const d = it.doc;
  if (d.contentType === 'pack') return `${S.packPercent(d, p)}% complete · ${d.stages.length} stages`;
  if (!p || !p.plays) return 'Not played yet';
  if (d.contentType === 'game') return `Personal best ${p.best ?? 0} · ${p.plays} play${p.plays === 1 ? '' : 's'}`;
  return `${p.passed ? 'Passed ✓ · ' : ''}Best ${p.best ?? 0} · ${p.plays} play${p.plays === 1 ? '' : 's'}`;
}

// ------------------------------------------------------------------ hub
export function importButtonHTML(label = '⤒ IMPORT CONTENT', cls = 'bigBtn') {
  return `<label class="${cls} fileBtn importBtn" data-import-btn>${label}<input type="file" data-content-input accept="${ACCEPT}" aria-label="Import a .pooliq content file"/></label>`;
}
export function contentHubHTML() {
  const items = S.loadContent();
  const prog = S.loadProgress();
  const customs = customDrills().filter((d) => d.custom && !d.contentUid);
  const card = (it) => {
    const d = it.doc;
    const f = firstShot(d);
    const mini = f ? `<div class="cMini">${renderStageTable(chFor(f.doc || d, f.item, f.key), { className: 'table-diagram micro', showAim: false })}</div>` : '';
    const eligible = d.contentType === 'drill' && d.careerEligible;
    const playHref = eligible ? `#play/drills/${contentDrillId(it.uid)}` : `#cplay/${it.uid}`;
    return `<div class="cItem card" data-content-item="${esc(it.uid)}" data-id="${esc(it.id)}" data-type="${esc(d.contentType)}">
      <div class="cTop">${mini}<div class="cMain">${badgesHTML(d, it.source)}<h3>${esc(d.title)}</h3><small class="muted" data-progress>${esc(itemProgressText(it, prog))}</small></div></div>
      <div class="cActs"><button type="button" class="miniAct go" data-action="go" data-href="${d.contentType === 'pack' ? `#cview/${esc(it.uid)}` : esc(playHref)}">${d.contentType === 'pack' ? 'OPEN' : 'PLAY'}</button><button type="button" class="miniAct" data-action="go" data-href="#cview/${esc(it.uid)}">VIEW</button><button type="button" class="miniAct" data-action="go" data-href="#cedit/${esc(it.uid)}">EDIT</button><button type="button" class="miniAct" data-action="c-export" data-uid="${esc(it.uid)}">EXPORT</button><button type="button" class="miniAct danger" data-action="c-del" data-uid="${esc(it.uid)}">DELETE</button></div></div>`;
  };
  const customCard = (d) => `<div class="cItem card" data-custom-drill="${esc(d.id)}" data-type="drill">
      <div class="cTop"><div class="cMini">${renderStageTable(d, { className: 'table-diagram micro', showAim: false })}</div><div class="cMain"><div class="cBadges"><span class="tag mine" data-badge="custom">CUSTOM</span><span class="tag">Drill</span><span class="tag">${esc(d.category)}</span></div><h3>${esc(d.name)}</h3><small class="muted">Made with Create Drill · counts in your training history</small></div></div>
      <div class="cActs"><button type="button" class="miniAct go" data-action="go" data-href="#play/drills/${esc(d.id)}">PLAY</button><button type="button" class="miniAct" data-action="drill-edit" data-id="${esc(d.id)}">EDIT</button><button type="button" class="miniAct" data-action="c-export-custom" data-id="${esc(d.id)}">EXPORT</button><button type="button" class="miniAct danger" data-action="drill-del" data-id="${esc(d.id)}">DELETE</button></div></div>`;
  const sec = (key, title, list, empty) => `<section class="cSec" data-section="${key}"><h2 class="cSecTitle">${title} <small>${list.length}</small></h2>${list.length ? list.join('') : `<p class="muted small cEmpty">${empty}</p>`}</section>`;
  const drillsL = [...items.filter((i) => i.contentType === 'drill').map(card), ...customs.map(customCard)];
  const packsL = items.filter((i) => i.contentType === 'pack').map(card);
  const lessonsL = items.filter((i) => i.contentType === 'lesson').map(card);
  const gamesL = items.filter((i) => i.contentType === 'game' || i.contentType === 'challenge').map(card);
  return `<div class="title"><span class="eyebrow">DRILLS · MY CONTENT</span><h1>My Content</h1></div>
    <div class="card importCard">
      ${importButtonHTML()}
      <p class="muted small">Pick a <b>.pooliq</b> file from Files, iCloud Drive or Downloads. You'll <b>preview</b> and <b>play-test</b> it first — nothing is installed until you tap ADD TO MY CONTENT.</p>
      <div class="chips cLinks"><button type="button" class="chip" data-action="c-examples">Example files</button><a class="chip" href="./POOLIQ_CONTENT_SCHEMA.md" target="_blank" rel="noopener" data-schema-link>Schema docs</a><button type="button" class="chip" data-action="drill-create">＋ Create drill</button></div>
    </div>
    ${sec('drills', 'MY DRILLS', drillsL, 'No drills yet — import a .pooliq drill or build one with Create Drill.')}
    ${sec('packs', 'TRAINING PACKS', packsL, 'No training packs yet — a pack is one .pooliq file with ordered stages.')}
    ${sec('lessons', 'LESSONS', lessonsL, 'No lessons yet — lessons go Teach → Guided → Solve → Execute → Test.')}
    ${sec('games', 'SKILL GAMES', gamesL, 'No skill games or challenges yet — try the Gauntlet example.')}
    <p class="muted small cFoot">My Content is saved on this device and included in Settings → Back Up. Imported content earns its own personal bests and never changes your Career rank.</p>`;
}
export function importErrorHTML() {
  const e = importError || { fileName: '', errors: ['No file was imported.'] };
  const [head, ...rest] = e.errors;
  return `<div class="title"><span class="eyebrow">IMPORT CONTENT</span><h1>Can't import this file</h1></div>
    <div class="card errCard" data-import-error>
      ${e.fileName ? `<p class="muted small" data-error-file>${esc(e.fileName)}</p>` : ''}
      <p class="errHead">${esc(head)}</p>
      ${rest.length ? `<ul class="errList">${rest.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="muted small">Nothing on this device was changed.</p>
    </div>
    ${importButtonHTML('TRY ANOTHER FILE')}
    <button type="button" class="bigBtn alt" data-action="go" data-href="#content">BACK TO MY CONTENT</button>
    <p class="muted small center"><a href="./POOLIQ_CONTENT_SCHEMA.md" target="_blank" rel="noopener">How .pooliq files work (schema docs)</a></p>`;
}
function examplesSheet() {
  openSheet(`<div class="eyebrow">EXAMPLE .POOLIQ FILES</div><h2 class="sheetTitle">DEMO content</h2>
    <p class="muted small">Simple geometric DEMO layouts that show every engine. <b>TRY</b> opens the preview right away; <b>DOWNLOAD</b> saves the file (then use IMPORT CONTENT).</p>
    <div class="exList">${EXAMPLES.map((x) => `<div class="exRow" data-example="${esc(x.file)}"><div><b>${esc(x.label)}</b><small>${esc(x.file)}</small></div><button type="button" class="miniAct go" data-action="c-try" data-file="${esc(x.file)}">TRY</button><a class="miniAct" href="./examples/${esc(x.file)}" download="${esc(x.file)}">DOWNLOAD</a></div>`).join('')}</div>
    <a class="bigBtn alt" href="./POOLIQ_CONTENT_SCHEMA.md" target="_blank" rel="noopener">SCHEMA DOCS (for authors &amp; AI)</a>
    <button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`, { id: 'examples' });
}

// ------------------------------------------------------------------ shared actions (hub, preview, play)
function exportDoc(doc) {
  const name = fileNameFor(doc);
  shareOrDownload(name, serialize(doc), { title: doc.title }).then((how) => {
    if (how === 'shared') toast(`Shared ${name}`);
    else if (how === 'downloaded') toast(`Saved ${name}`);
    else toast('Export cancelled');
  });
}
function conflictSheet(doc, same, fileName) {
  const inst = same[0];
  openSheet(`<div class="eyebrow">ALREADY IN MY CONTENT</div><h2 class="sheetTitle">“${esc(doc.title)}” is already installed</h2>
    <div class="verCompare" data-conflict><div><span>INSTALLED</span><b data-installed-version>v${esc(inst.contentVersion)}</b><small>${esc(fmtDate(inst.updatedAt || inst.installedAt))}${inst.edited ? ' · edited' : ''}</small></div><div><span>INCOMING</span><b data-incoming-version>v${esc(doc.contentVersion)}</b><small>${esc(fileName || 'imported file')}</small></div></div>
    <p class="muted small">Both use the id <b>${esc(doc.id)}</b>. Nothing is overwritten unless you choose REPLACE${same.length > 1 ? ` (replaces ${same.length} copies)` : ''}.</p>
    <button type="button" class="bigBtn danger" data-action="c-conflict" data-mode="replace">REPLACE INSTALLED</button>
    <button type="button" class="bigBtn" data-action="c-conflict" data-mode="keepBoth">KEEP BOTH</button>
    <button type="button" class="bigBtn alt" data-action="c-conflict" data-mode="cancel">CANCEL</button>`, { id: 'conflict' });
}
function installPending(ctx, mode) {
  if (!pending) { toast('Nothing to install — import a file first'); return; }
  const out = S.installDoc(pending.doc, { mode, source: 'imported' });
  if (out.cancelled) { closeSheet(); toast('Cancelled — nothing was changed'); return; }
  if (out.conflict) { conflictSheet(pending.doc, out.conflict, pending.fileName); return; }
  if (out.error) { closeSheet(); toast(out.error.split('\n')[0]); return; }
  pending = null;
  refreshCustomDrills();
  closeSheet();
  toast(mode === 'replace' ? `Replaced with v${out.item.contentVersion}` : mode === 'keepBoth' ? `Installed as a copy (${out.item.id})` : `“${out.item.title}” added to My Content`);
  ctx.go(`#cview/${out.item.uid}`);
}
export function contentAction(action, el, e, ctx) {
  switch (action) {
    case 'c-install': installPending(ctx); return true;
    case 'c-conflict': installPending(ctx, el.dataset.mode); return true;
    case 'c-discard':
      pending = null;
      toast('Discarded — nothing was installed');
      ctx.go('#content');
      return true;
    case 'c-export': {
      const it = S.getItem(el.dataset.uid);
      if (it) exportDoc(it.doc);
      return true;
    }
    case 'c-export-custom': {
      const ch = CD.loadCustomDrills().find((d) => d.id === el.dataset.id);
      if (!ch) return true;
      try { exportDoc(checkedDoc(docFromChallenge(ch, { title: ch.name, description: ch.builder?.description, attribution: ch.builder?.attribution, contentVersion: ch.builder?.contentVersion }))); } catch (err) { toast(`Export failed: ${err.message}`); }
      return true;
    }
    case 'c-del': {
      const it = S.getItem(el.dataset.uid);
      if (it) openSheet(`<h2 class="sheetTitle">Delete “${esc(it.title)}”?</h2><p class="muted">It is removed from My Content on this device, with its personal bests and progress. Export it first if you might want it back.</p><button type="button" class="bigBtn danger" data-action="c-del-do" data-uid="${esc(it.uid)}">DELETE</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button>`, { id: 'confirm' });
      return true;
    }
    case 'c-del-do':
      S.deleteItem(el.dataset.uid);
      refreshCustomDrills();
      closeSheet();
      toast('Deleted from My Content');
      ctx.go('#content');
      return true;
    case 'c-examples': examplesSheet(); return true;
    case 'c-try': {
      const file = el.dataset.file;
      if (!EXAMPLES.some((x) => x.file === file)) return true;
      closeSheet();
      fetch(`./examples/${file}`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); }).then((t) => processImport(t, file, ctx)).catch((err) => toast(`Could not load the example (${err.message})`));
      return true;
    }
    case 'c-locked': toast('Locked — pass the previous stage first'); return true;
    default: return false;
  }
}

// ------------------------------------------------------------------ preview / details
function factsHTML(ch, item) {
  const f = (k, v, attr = '') => (v ? `<div${attr}><span>${k}</span><b>${esc(v)}</b></div>` : '');
  const sr = ch.scoringRules;
  return `<div class="cvFacts">
    ${f('Goal', ch.goal)}
    ${f('SPEED', `${speedLabel(ch.speed)} — ${speedMeaning(ch.speed)}`, ` data-fact="speed" data-speed="${formatSpeed(ch.speed)}"`)}
    ${f('Tip / contact', `${contactText(ch.cueContact.vTips, ch.cueContact.hTips)} · ${techniqueName(ch.technique)}`)}
    ${f('Spin / English', englishText(ch.english.hTips, ch.english.type))}
    ${ch.aim.fraction != null ? f('Aim / contact', `${ch.aim.label} · ${ch.aim.cutDeg}° cut`) : ''}
    ${f('Route', ch.route?.text)}
    ${item.scoringRules ? `${f('Attempts', String(sr.attempts), ' data-fact="attempts"')}${f('Passing requirement', passText(sr), ' data-fact="pass"')}${f('Scoring', MODE_TEXT[sr.mode])}` : ''}
    ${item.xp != null ? f('XP', String(item.xp)) : ''}
    ${ch.referenceMarkers?.length ? f('Reference points', ch.referenceMarkers.map((m) => `${m.rail} ${Number(m.diamond).toFixed(1)}${m.label ? ` (${m.label})` : ''}`).join(' · ')) : ''}
  </div>
  ${ch.instructions ? `<div class="cvText"><h4>Shooting instructions</h4><p>${esc(ch.instructions)}</p></div>` : ''}
  ${ch.setupInstructions ? `<div class="cvText"><h4>Setup instructions</h4><p>${esc(ch.setupInstructions)}</p></div>` : ''}
  ${ch.hints?.length ? `<div class="cvText"><h4>Hints</h4><ul>${ch.hints.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>` : ''}`;
}
function shotBlockHTML(ch, { hide = false } = {}) {
  return `<div class="playTable cvTable">${renderStageTable(ch, { showCuePath: !hide, showObPath: !hide, showAim: !hide, markers: hide ? 'reference' : 'all' })}</div>
    ${setupLineHTML(ch)}${legendHTML(ch)}
    <div class="recipeRow">${recipeGaugesHTML(ch, { hideAim: hide, hideRoute: hide })}<button type="button" class="whyBtn" data-action="why-open">WHY THIS SHOT?</button></div>`;
}
function packListHTML(r) {
  const d = r.doc;
  const prog = r.uid ? S.progressFor(r.uid) : null;
  const states = S.packStageStates(d, prog);
  const pct = S.packPercent(d, prog);
  return `<div class="packBox" data-pack>
    <div class="packHead"><b>${esc(d.title.toUpperCase())}</b><span data-pack-pct="${pct}">${pct}%</span></div>
    <div class="packBar"><i style="width:${pct}%"></i></div>
    <ol class="stageList">${d.stages.map((s, i) => {
      const st = states[i];
      const playable = r.sandbox || st !== 'locked';
      const best = prog?.stages?.[s.id]?.best;
      return `<li class="stRow ${st}" data-stage-state="${st}" data-stage="${esc(s.id)}"><button type="button" data-action="${playable ? 'go' : 'c-locked'}" data-href="#cplay/${esc(r.ref)}/${i}"><span class="stNum">${i + 1}.</span><span class="stTitle">${esc(s.title)}<small>${esc(STAGE_TYPE[s.stageType] || typeLabel(s.contentType))} · ${esc(s.contentType === 'game' ? TEMPLATE_NAMES[s.template] : typeLabel(s.contentType))}${best != null ? ` · best ${best}` : ''}</small></span><span class="stIcon" aria-label="${st}">${st === 'done' ? '✓' : st === 'open' ? '🔓' : '🔒'}</span></button></li>`;
    }).join('')}</ol>
    ${r.sandbox ? '<p class="muted small">Play Test: every stage can be tried now. After you install the pack, stages unlock in order and your progress is saved.</p>' : ''}
  </div>`;
}
function lessonListHTML(d) {
  return `<ol class="stepList" data-steps="${d.steps.length}">${d.steps.map((s) => `<li><span class="phase ph-${s.phase}">${esc(PHASE_NAMES[s.phase])}</span><b>${esc(s.title)}</b>${s.text ? `<small>${esc(s.text.length > 140 ? `${s.text.slice(0, 140)}…` : s.text)}</small>` : ''}</li>`).join('')}</ol>`;
}
function gameRulesHTML(d) {
  const r = T.gameRules(d);
  const rows = [];
  if (r.lives != null) rows.push(['Lives', `${'❤️'.repeat(r.lives)} (${r.lives})`]);
  if (d.template === 'target') rows.push(['Points per star', r.pointsPerStar]);
  else rows.push(['Points per success', r.pointsPerSuccess]);
  if (r.streakBonus) rows.push(['Streak bonus', `+${r.streakBonus.points} every ${r.streakBonus.every} in a row`]);
  if (r.stageBonus) rows.push(['Completion bonus', `+${r.stageBonus}`]);
  if (r.shots) rows.push(['Shots', r.shots]);
  if (d.template === 'gauntlet') rows.push(['After a miss', r.retry === 'next' ? 'move to the next stage' : 'retry the same stage']);
  if (r.passScore) rows.push(['Pass score', r.passScore]);
  if (d.template === 'quizExecution') rows.push(['Quiz points', r.quizPoints]);
  rows.push(['Stage order', r.order === 'difficulty' ? 'by difficulty' : 'as listed']);
  return `<div class="cvFacts" data-rules>${rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(String(v))}</b></div>`).join('')}</div>
    <ol class="stepList">${T.stageOrder(d).map((i) => d.stages[i]).map((s) => `<li><span class="phase">${s.difficulty ? `LEVEL ${s.difficulty}` : 'STAGE'}</span><b>${esc(s.title)}</b>${s.points != null ? `<small>${s.points} pts</small>` : ''}</li>`).join('')}</ol>`;
}

export function createContentView(ctx, ref) {
  const r = resolve(ref);
  if (!r) return null;
  const ui = { reveal: false, ch: null };
  function body() {
    const d = r.doc;
    const f = firstShot(d);
    ui.ch = f ? chFor(f.doc || d, f.item, f.key) : null;
    if (d.contentType === 'drill') return `${shotBlockHTML(ui.ch)}${factsHTML(ui.ch, d)}`;
    if (d.contentType === 'challenge') {
      const ask = d.ask || (d.answer ? ['rail', 'diamond'] : []);
      return `<div class="cQuestion" data-question><b>${esc(d.question)}</b><small>You'll answer: ${esc(ask.map((a) => ASK_TEXT[a]).join(', '))} — then LOCK ANSWER to see the recommended solution.</small></div>
        ${shotBlockHTML(ui.ch, { hide: !ui.reveal })}
        <button type="button" class="bigBtn alt" data-action="cv-reveal">${ui.reveal ? 'HIDE RECOMMENDED SOLUTION' : 'SHOW RECOMMENDED SOLUTION (spoiler)'}</button>
        ${ui.reveal && d.answer ? `<div class="cvFacts"><div><span>Recommended</span><b>${esc(T.railAnswerText(d.answer))}</b></div><div><span>Tolerance</span><b>pass ±${(d.answer.tolerance?.pass ?? 0.2).toFixed(1)} · close ±${(d.answer.tolerance?.close ?? 0.5).toFixed(1)}</b></div></div>${d.answer.explanation ? `<div class="cvText"><p>${esc(d.answer.explanation)}</p></div>` : ''}` : ''}
        ${ui.reveal ? factsHTML(ui.ch, d) : ''}`;
    }
    if (d.contentType === 'lesson') return `${ui.ch ? shotBlockHTML(ui.ch) : ''}<h3 class="cvH">Lesson steps</h3>${lessonListHTML(d)}`;
    if (d.contentType === 'game') return `<h3 class="cvH">${esc(TEMPLATE_NAMES[d.template])} rules</h3>${gameRulesHTML(d)}<h3 class="cvH">Stage 1</h3>${shotBlockHTML(ui.ch)}`;
    if (d.contentType === 'pack') return packListHTML(r);
    return '';
  }
  function actionsHTML() {
    const d = r.doc;
    if (r.sandbox) {
      return `<div class="cvActs" data-preview-actions>
        <button type="button" class="bigBtn" data-action="go" data-href="#cplay/pending${d.contentType === 'pack' ? '/0' : ''}">▶ PLAY TEST</button>
        <button type="button" class="bigBtn add" data-action="c-install">＋ ADD TO MY CONTENT</button>
        <button type="button" class="bigBtn alt" data-action="c-discard">DISCARD</button></div>`;
    }
    const eligible = d.contentType === 'drill' && d.careerEligible;
    return `<div class="cvActs" data-item-actions>
      ${d.contentType === 'pack' ? '' : `<button type="button" class="bigBtn" data-action="go" data-href="${eligible ? `#play/drills/${contentDrillId(r.uid)}` : `#cplay/${esc(r.uid)}`}">▶ PLAY</button>`}
      <div class="cvRow"><button type="button" class="bigBtn alt" data-action="go" data-href="#cedit/${esc(r.uid)}">EDIT</button><button type="button" class="bigBtn alt" data-action="c-export" data-uid="${esc(r.uid)}">EXPORT</button><button type="button" class="bigBtn alt danger" data-action="c-del" data-uid="${esc(r.uid)}">DELETE</button></div></div>`;
  }
  function render() {
    const d = r.doc;
    ctx.root.innerHTML = `<div class="contentView" data-view="${esc(d.contentType)}" data-ref="${esc(ref)}">
      <div class="cvHead"><button type="button" class="phBack" data-action="go" data-href="#content" aria-label="Back to My Content">‹</button><div><span class="eyebrow">${r.sandbox ? 'PREVIEW · NOT INSTALLED YET' : 'MY CONTENT'}</span><h1 class="cvTitle">${esc(d.title)}</h1></div></div>
      ${badgesHTML(d, r.source)}
      ${d.description ? `<p class="cvDesc">${esc(d.description)}</p>` : ''}
      ${r.sandbox && r.warnings?.length ? `<div class="warnBox small" data-warnings>${r.warnings.map((w) => `<div>⚠ ${esc(w)}</div>`).join('')}</div>` : ''}
      ${actionsHTML()}
      ${body()}
      ${attributionHTML(d)}
      <p class="muted small">id ${esc(d.id)} · schema ${esc(d.schemaVersion)} · version ${esc(d.contentVersion)}${r.item ? ` · installed ${esc(fmtDate(r.item.installedAt))}${r.item.edited ? ' · edited' : ''}` : ''}</p>
    </div>`;
  }
  function onAction(action, el, e) {
    if (action === 'cv-reveal') { ui.reveal = !ui.reveal; render(); return true; }
    if (action === 'why-open' && ui.ch) { openSheet(`<div class="eyebrow">WHY THIS SHOT?</div><h2 class="sheetTitle">${esc(ui.ch.name)}</h2>${aimRowHTML(ui.ch)}${whyHTML(ui.ch)}<h3 class="su-h">Set it up (diamonds)</h3>${setupSheetHTML(ui.ch)}`, { id: 'why' }); return true; }
    if (action === 'recipe-open' && ui.ch) { openSheet(`${recipeCardHTML(ui.ch, { cal: ctx.getState().speedCal })}<button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`, { id: 'recipe' }); return true; }
    if (action === 'setup-open' && ui.ch) { openSheet(`<div class="eyebrow">SETUP · DIAMOND POSITIONS</div><h2 class="sheetTitle">${esc(ui.ch.name)}</h2>${setupSheetHTML(ui.ch)}<button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`, { id: 'setup' }); return true; }
    return contentAction(action, el, e, ctx);
  }
  return { render, onAction, isPage: true };
}

// ------------------------------------------------------------------ play: shared bits
function statsHTML(stats) {
  return `<div class="resultStats">${stats.map(([v, label, attr = '']) => `<div><b${attr}>${esc(String(v))}</b><span>${esc(label)}</span></div>`).join('')}</div>`;
}
function finishHTML({ eyebrow, h1, passed, stats, extra = {}, retry = 'retry', attrs = '' }) {
  return `<div class="playScreen resultScreen"><div class="resultPanel ${passed ? 'pass' : 'fail'}" data-result="${passed ? 'pass' : 'fail'}" data-content-result="1" ${attrs}>
    <div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(h1)}</h1>${statsHTML(stats)}
    ${extra.newBest ? '<p class="pb">★ NEW PERSONAL BEST</p>' : ''}
    ${extra.note ? `<p class="sandboxNote" data-sandbox-note>${esc(extra.note)}</p>` : ''}
    <div class="resultBtns">${(extra.buttons || []).map((b) => `<button type="button" class="bigBtn${b.alt ? ' alt' : ''}" data-action="${esc(b.action)}"${b.href ? ` data-href="${esc(b.href)}"` : ''}>${esc(b.label)}</button>`).join('')}${retry ? `<button type="button" class="bigBtn alt" data-action="${retry}">PLAY AGAIN</button>` : ''}<button type="button" class="bigBtn alt" data-action="go" data-href="${esc(extra.exitHref || '#content')}">DONE</button></div>
  </div></div>`;
}
function headHTML(title, sub, status = '', exit = 'c-exit') {
  return `<div class="playHead"><button type="button" class="phBack" data-action="${exit}" aria-label="Exit">‹</button><div class="phTitle"><small>${esc(title)}</small><b>${esc(sub)}</b></div><div class="phStatus">${status}</div></div>`;
}
function svgPoint(root, e) {
  const svg = root.querySelector('.playTable svg');
  if (!svg || !svg.getScreenCTM()) return null;
  const pt = svg.createSVGPoint();
  const t = e.changedTouches?.[0] || e;
  pt.x = t.clientX;
  pt.y = t.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}
function sheetFor(ctx, a, ch) {
  if (a === 'why-open') openSheet(`<div class="eyebrow">WHY THIS SHOT?</div><h2 class="sheetTitle">${esc(ch.name)}</h2>${aimRowHTML(ch)}${whyHTML(ch)}<h3 class="su-h">Set it up (diamonds)</h3>${setupSheetHTML(ch)}`, { id: 'why' });
  else if (a === 'recipe-open') openSheet(`${recipeCardHTML(ch, { cal: ctx.getState().speedCal })}<button type="button" class="bigBtn alt" data-action="sheet-close">CLOSE</button>`, { id: 'recipe' });
  else if (a === 'setup-open') openSheet(`<div class="eyebrow">SETUP · DIAMOND POSITIONS</div><h2 class="sheetTitle">${esc(ch.name)}</h2>${setupSheetHTML(ch)}<button type="button" class="bigBtn" data-action="sheet-close">GOT IT</button>`, { id: 'setup' });
  else return false;
  return true;
}

/** Drill: the normal play screen, fed the content challenge; results only through env.complete / opts.onFinish */
function drillRunner(ctx, env, item, key, opts = {}) {
  const ch = chFor(env.doc, item, key, { title: item.title, scoringRules: opts.scoringRules });
  return createPlayScreen(ctx, {
    gameId: 'drills',
    stageId: ch.id,
    content: {
      challenge: ch,
      title: `${env.prefix}${opts.title || item.title}`,
      skill: item.skill || env.doc.skill || null,
      coach: opts.coach || null,
      exitHref: env.exitHref,
      onFinish: (ev) => (opts.onFinish || env.complete)({ passed: ev.passed, score: ev.score, summary: { made: ev.made ?? null, stars: ev.stars ?? null, attempts: ev.attemptsTotal } })
    }
  });
}

/**
 * Solve-it-yourself / player-solution / diamond answer:
 *   SOLVE (solution hidden, player picks what `ask` lists) → LOCK ANSWER → REVEAL (player choice vs recommended)
 *   → optional attempts on the normal play screen (manual SUCCESS / MISS) → spec.onResult(result)
 * spec.onResult returns the result-panel extras when attempts were played, or {html} to show a finish panel.
 */
function solveRunner(ctx, env, spec) {
  const ch = spec.ch;
  const ask = spec.ask?.length ? spec.ask : spec.answer ? ['rail', 'diamond'] : ['technique', 'tip', 'speed'];
  const railAsk = ask.includes('rail') || ask.includes('diamond');
  const ui = { phase: 'solve', d: { technique: null, vTips: 0, hTips: 0, touched: false, speed: null, rails: null, eng: null }, pick: null, cmp: null, verdict: null, child: null };
  const ready = () => ask.every((a) => (a === 'technique' ? !!ui.d.technique : a === 'tip' ? ui.d.touched : a === 'english' ? ui.d.eng != null || ui.d.touched : a === 'speed' ? ui.d.speed != null : a === 'rails' ? ui.d.rails != null : ui.pick != null));
  function pickerHTML() {
    const d = ui.d;
    const rows = [];
    if (ask.includes('technique')) rows.push(`<div class="plRow"><span>Technique</span><div class="chips">${TECHNIQUES.map((t) => `<button type="button" class="chip${d.technique === t.id ? ' active' : ''}" data-action="cs-tech" data-v="${t.id}">${t.label}</button>`).join('')}</div></div>`);
    if (ask.includes('english')) rows.push(`<div class="plRow"><span>English</span><div class="chips">${[[-0.5, 'Left'], [0, 'None'], [0.5, 'Right']].map(([h, l]) => `<button type="button" class="chip${d.eng === h ? ' active' : ''}" data-action="cs-eng" data-v="${h}">${l}</button>`).join('')}</div></div>`);
    if (ask.includes('speed')) rows.push(`<div class="plRow"><span>SPEED</span><div class="chips">${SPEED_STEPS.map((s) => `<button type="button" class="chip${d.speed === s ? ' active' : ''}" data-action="cs-speed" data-v="${s}">${formatSpeed(s)}</button>`).join('')}</div></div>`);
    if (ask.includes('rails')) rows.push(`<div class="plRow"><span>Rails</span><div class="chips">${RAIL_CHOICES.map((n) => `<button type="button" class="chip${d.rails === n ? ' active' : ''}" data-action="cs-rails" data-v="${n}">${n}</button>`).join('')}</div></div>`);
    const tip = ask.includes('tip') ? `<div class="plTip"><div class="plBall" data-action="cs-tip">${cueBallSVG(d.touched ? { vTips: d.vTips, hTips: d.hTips } : null, { size: 'sm', interactive: true, id: 'csBall' })}</div><span>Tap the cue ball: tip</span><b data-tip-pick>${d.touched ? esc(contactText(d.vTips, d.hTips)) : '—'}</b></div>` : '';
    if (tip) rows.splice(0, rows.length, `<div class="plSplit">${tip}<div class="plRows">${rows.join('')}</div></div>`);
    if (railAsk) {
      rows.push(`<div class="railPick" data-rail-pick="${ui.pick ? `${ui.pick.rail}:${ui.pick.diamond.toFixed(1)}` : ''}"><button type="button" class="nudge" data-action="cs-step" data-v="-0.1" aria-label="0.1 diamond less" ${ui.pick ? '' : 'disabled'}>−0.1</button><b>${ui.pick ? esc(T.railAnswerText(ui.pick)) : 'Tap the table where the cue ball meets the rail'}</b><button type="button" class="nudge" data-action="cs-step" data-v="0.1" aria-label="0.1 diamond more" ${ui.pick ? '' : 'disabled'}>+0.1</button></div>
        <div class="chips railChips">${['top', 'bottom', 'left', 'right'].map((rl) => `<button type="button" class="chip${ui.pick?.rail === rl ? ' active' : ''}" data-action="cs-rail" data-v="${rl}">${{ top: 'Top rail', bottom: 'Bottom', left: 'Head', right: 'Foot' }[rl]}</button>`).join('')}</div>`);
    }
    return `<div class="planner solvePanel" data-planner="solve">${rows.join('')}</div>`;
  }
  function pins() {
    const p = [];
    if (ui.pick) p.push({ ...ui.pick, kind: 'player', label: ui.phase === 'solve' ? ui.pick.diamond.toFixed(1) : `You ${ui.pick.diamond.toFixed(1)}` });
    if (ui.phase === 'reveal' && spec.answer) p.push({ rail: spec.answer.rail, diamond: spec.answer.diamond, kind: 'answer', label: `Rec ${Number(spec.answer.diamond).toFixed(1)}`, labelShift: ui.pick && ui.pick.rail === spec.answer.rail && Math.abs(ui.pick.diamond - spec.answer.diamond) < 1.2 ? 2.2 : 0 });
    return p;
  }
  function lock() {
    const plan = { technique: ui.d.technique, vTips: ui.d.vTips, hTips: ui.d.eng != null ? ui.d.eng : ui.d.hTips, speed: ui.d.speed, rails: ui.d.rails };
    ui.cmp = T.solutionRows(comparePlan(plan, ch, FMT), ask, ui.pick, spec.answer);
    ui.verdict = spec.answer && railAsk ? T.diamondVerdict(ui.pick, spec.answer) : null;
    ui.phase = 'reveal';
    render();
  }
  function revealHTML() {
    const v = ui.verdict;
    const dia = v ? `<div class="diaReveal ${v.verdict}" data-verdict="${v.verdict}" data-diff="${v.diff ?? ''}">
        <div class="diaCells"><div><span>YOUR ANSWER</span><b data-your>${ui.pick ? ui.pick.diamond.toFixed(1) : '—'}</b><small>${ui.pick ? esc(T.RAIL_WORDS[ui.pick.rail]) : ''}</small></div>
        <div><span>RECOMMENDED</span><b data-rec>${Number(spec.answer.diamond).toFixed(1)}</b><small>${esc(T.RAIL_WORDS[spec.answer.rail])}</small></div>
        <div><span>DIFFERENCE</span><b data-difference>${v.diff != null ? v.diff.toFixed(1) : '—'}</b><small>${v.diff != null ? 'diamonds' : 'other rail'}</small></div></div>
        <p class="diaLine">Your answer: ${ui.pick ? ui.pick.diamond.toFixed(1) : '—'} · Recommended: ${Number(spec.answer.diamond).toFixed(1)} · Difference: ${v.diff != null ? `${v.diff.toFixed(1)} diamonds` : 'different rail'} <em class="vd">${T.VERDICT_TEXT[v.verdict]}</em></p>
        <small class="muted">Pass within ±${v.tol.pass.toFixed(1)} · close within ±${v.tol.close.toFixed(1)} diamonds</small></div>` : '';
    const rows = ui.cmp.rows.filter((row) => row.field !== 'diamond' || !v);
    return `<div class="revealBox" data-reveal>${dia}
      ${rows.length ? `<div class="cmpHeadRow"><span>PLAYER CHOICE</span><span>RECOMMENDED</span></div><div class="compareTable">${rows.map((row) => `<div class="cmpRow ${row.verdict}" data-field="${row.field}" data-verdict="${row.verdict}"><div class="cmpHead"><b>${esc(row.label)}</b><span class="verdict">${row.verdict.toUpperCase()}</span></div><div class="cmpVals"><span>You: ${esc(row.yours)}</span><span>Rec: ${esc(row.poolIQ)}</span></div></div>`).join('')}</div>` : ''}
      ${spec.answer?.explanation ? `<p class="small muted">${esc(spec.answer.explanation)}</p>` : ''}</div>`;
  }
  function render() {
    if (ui.child) return ui.child.render();
    const root = ctx.root;
    const revealed = ui.phase === 'reveal';
    const table = renderStageTable(ch, { showCuePath: revealed, showObPath: revealed, showAim: revealed, showZones: true, markers: revealed ? 'all' : 'reference', diamondNumbers: railAsk, pins: pins() });
    const bar = revealed
      ? `<div class="resultBar n2"><button type="button" class="rb alt" data-action="cs-again"><b>TRY AGAIN</b></button><button type="button" class="rb s3" data-action="cs-next"><b>${spec.scoringRules ? `SHOOT IT · ${spec.scoringRules.attempts} ATTEMPTS` : esc(spec.nextLabel || 'CONTINUE')}</b></button></div>`
      : `<div class="resultBar"><button type="button" class="lockBtn" data-action="cs-lock" ${ready() ? '' : 'disabled'}>${railAsk && ask.length <= 2 ? 'LOCK ANSWER' : 'LOCK MY ANSWER'}</button></div>`;
    root.innerHTML = `<div class="playScreen solveScreen" data-mode="solve" data-phase="${ui.phase}">
      ${headHTML(spec.title, revealed ? 'Your answer vs recommended' : spec.sub || 'Solve it yourself', spec.status || '')}
      <div class="playTable${railAsk && !revealed ? ' tapRail' : ''}" data-tap-table>${table}</div>
      ${setupLineHTML(ch)}
      <div class="playBody">
        <div class="cQuestion small"><b>${esc(spec.question || 'HOW WOULD YOU PLAY THIS SHOT?')}</b>${spec.text && !revealed ? `<small>${esc(spec.text)}</small>` : ''}</div>
        ${revealed ? revealHTML() : pickerHTML()}
        ${revealed ? `<div class="recipeRow">${recipeGaugesHTML(ch)}<button type="button" class="whyBtn" data-action="why-open">WHY THIS SHOT?</button></div>` : ''}
      </div>
      ${bar}
    </div>`;
    const tbl = root.querySelector('[data-tap-table]');
    if (railAsk && !revealed && tbl) {
      tbl.addEventListener('click', (e) => {
        const p = svgPoint(root, e);
        if (!p) return;
        ui.pick = T.tapToRail(p.x, p.y);
        render();
      });
    }
  }
  function onAction(action, el, e) {
    if (ui.child) return ui.child.onAction(action, el, e);
    switch (action) {
      case 'cs-tech': ui.d.technique = el.dataset.v; render(); return true;
      case 'cs-speed': ui.d.speed = Number(el.dataset.v); render(); return true;
      case 'cs-rails': ui.d.rails = Number(el.dataset.v); render(); return true;
      case 'cs-eng': ui.d.eng = Number(el.dataset.v); render(); return true;
      case 'cs-tip': {
        const svg = ctx.root.querySelector('#csBall');
        if (svg && e) { const pt = e.touches?.[0] || e; Object.assign(ui.d, tipsFromTap(svg, pt.clientX, pt.clientY), { touched: true }); render(); }
        return true;
      }
      case 'cs-rail': {
        const rl = el.dataset.v;
        const dm = ui.pick ? Math.min(RAIL_DIAMONDS[rl], ui.pick.diamond) : RAIL_DIAMONDS[rl] / 2;
        ui.pick = { rail: rl, diamond: T.round1(dm) };
        render();
        return true;
      }
      case 'cs-step':
        if (ui.pick) { ui.pick = { rail: ui.pick.rail, diamond: T.round1(clamp(ui.pick.diamond + Number(el.dataset.v), 0, RAIL_DIAMONDS[ui.pick.rail])) }; render(); }
        return true;
      case 'cs-lock': if (ready()) lock(); return true;
      case 'cs-again': ui.phase = 'solve'; ui.cmp = null; ui.verdict = null; render(); return true;
      case 'cs-next': {
        const answerScore = ui.verdict ? (ui.verdict.verdict === 'pass' ? 100 : ui.verdict.verdict === 'close' ? 50 : 0) : Math.round((100 * ui.cmp.score) / Math.max(1, ui.cmp.max));
        const answerOk = ui.verdict ? ui.verdict.verdict === 'pass' : ui.cmp.score >= ui.cmp.max / 2;
        const summary = { verdict: ui.verdict?.verdict ?? null, diff: ui.verdict?.diff ?? null, planScore: ui.cmp.score, planMax: ui.cmp.max };
        if (spec.scoringRules) {
          ui.child = drillRunner(ctx, env, spec.item, spec.key, {
            title: spec.playTitle,
            scoringRules: spec.scoringRules,
            coach: 'beginner',
            onFinish: (res) => spec.onResult({ passed: res.passed, score: res.score + answerScore, summary: { ...summary, ...res.summary } })
          });
          ui.child.render();
        } else {
          const out = spec.onResult({ passed: answerOk, score: answerScore, summary }) || {};
          if (out.html) ctx.root.innerHTML = out.html;
        }
        return true;
      }
      default: return sheetFor(ctx, action, ch);
    }
  }
  return { render, onAction, get phase() { return ui.phase; } };
}

/** Standalone challenge item (diamond or player-solution) */
function challengeRunner(ctx, env, item, key) {
  const ch = chFor(env.doc, item, key);
  const spec = {
    ch, item, key,
    ask: item.ask || (item.challengeType === 'diamond' ? ['rail', 'diamond'] : null),
    answer: item.answer,
    question: item.question,
    scoringRules: item.scoringRules,
    title: `${env.prefix}${item.title}`,
    playTitle: item.title,
    sub: item.challengeType === 'diamond' ? 'Rail answer' : 'Choose your solution',
    nextLabel: 'FINISH',
    onResult: (res) => {
      const extra = env.complete(res);
      if (spec.scoringRules) return extra;
      return { html: finishHTML({ eyebrow: `${env.prefix}${item.title}`, h1: res.passed ? 'PASSED' : 'NOT PASSED', passed: res.passed, stats: [[res.score, 'SCORE', ` data-final-score="${res.score}"`], ...(res.summary?.diff != null ? [[res.summary.diff.toFixed(1), 'DIFFERENCE']] : [])], extra: { ...extra, exitHref: env.exitHref }, retry: 'c-retry' }) };
    }
  };
  let child = solveRunner(ctx, env, spec);
  return {
    render: () => child.render(),
    onAction: (a, el, e) => {
      if (a === 'c-retry' || (a === 'retry' && ctx.root.querySelector('[data-content-result]'))) { child = solveRunner(ctx, env, spec); child.render(); return true; }
      return child.onAction(a, el, e);
    }
  };
}

/** Lesson: TEACH → GUIDED PRACTICE → SOLVE IT YOURSELF → EXECUTE → TEST (steps in file order) */
function lessonRunner(ctx, env, item, key) {
  const steps = item.steps;
  const ui = { i: 0, child: null, results: [], done: false, play: false };
  const phaseBar = () => `<div class="phaseBar" data-phase-bar>${LESSON_PHASES.map((p) => `<span class="${steps[ui.i]?.phase === p ? 'cur' : steps.slice(0, ui.i).some((s) => s.phase === p) ? 'done' : ''}" data-ph="${p}">${esc(PHASE_NAMES[p])}</span>`).join('')}</div>`;
  const stepTitle = () => `${env.prefix}${item.title}`;
  const stepSub = (s) => `${PHASE_NAMES[s.phase]} · step ${ui.i + 1}/${steps.length}`;
  const stepKey = () => `${key}-s${ui.i}`;
  function go(i) {
    ui.child = null;
    ui.play = false;
    ui.i = i;
    if (ui.i >= steps.length) return finish();
    render();
  }
  function finish() {
    ui.done = true;
    const testIdx = steps.map((s, i) => (s.phase === 'test' ? i : -1)).filter((i) => i >= 0);
    const passed = testIdx.length ? testIdx.every((i) => ui.results[i]?.passed) : true;
    const score = ui.results.reduce((a, r) => a + (r?.score || 0), 0);
    const extra = env.complete({ passed, score, summary: { steps: steps.length } });
    ctx.root.innerHTML = finishHTML({ eyebrow: stepTitle(), h1: passed ? 'LESSON COMPLETE' : 'TEST NOT PASSED', passed, stats: [[score, 'SCORE', ` data-final-score="${score}"`], [steps.length, 'STEPS']], extra: { ...extra, exitHref: env.exitHref }, retry: 'cl-restart', attrs: 'data-lesson-done="1"' });
  }
  function stepDone(res) {
    ui.results[ui.i] = res;
    const last = ui.i >= steps.length - 1;
    return { note: env.sandbox ? 'PLAY TEST — step results are not saved.' : null, buttons: [{ label: last ? 'FINISH LESSON ›' : 'NEXT STEP ›', action: 'cl-next' }] };
  }
  function introCard(s, toPlay) {
    const ch = s.shot ? chFor(env.doc, s, stepKey()) : null;
    ctx.root.innerHTML = `<div class="playScreen lessonScreen" data-mode="lesson" data-phase="${s.phase}" data-step="${ui.i}">
      ${headHTML(stepTitle(), stepSub(s))}
      ${phaseBar()}
      ${ch ? `<div class="playTable">${renderStageTable(ch, { markers: 'all' })}</div>${setupLineHTML(ch)}` : ''}
      <div class="playBody">
        <div class="lessonText"><h3>${esc(s.title)}</h3>${s.text ? `<p>${esc(s.text)}</p>` : ''}</div>
        ${ch ? `<div class="recipeRow">${recipeGaugesHTML(ch)}<button type="button" class="whyBtn" data-action="why-open">WHY THIS SHOT?</button></div>` : ''}
      </div>
      <div class="resultBar n2"><button type="button" class="rb alt" data-action="cl-prev" ${ui.i ? '' : 'disabled'}><b>‹ BACK</b></button><button type="button" class="rb s3" data-action="${toPlay ? 'cl-play' : 'cl-next'}"><b>${toPlay ? `START · ${s.scoringRules.attempts} ATTEMPTS` : ui.i >= steps.length - 1 ? 'FINISH LESSON' : 'CONTINUE ›'}</b></button></div>
    </div>`;
  }
  function render() {
    if (ui.done) return;
    if (ui.child) return ui.child.render();
    const s = steps[ui.i];
    const k = stepKey();
    if (s.phase === 'solve') {
      ui.child = solveRunner(ctx, env, {
        ch: chFor(env.doc, s, k), item: s, key: k, ask: s.ask, answer: s.answer, question: s.question || 'SOLVE IT YOURSELF', text: s.text,
        scoringRules: s.scoringRules, title: stepTitle(), playTitle: `${PHASE_NAMES.solve} · ${s.title}`, sub: stepSub(s), nextLabel: ui.i >= steps.length - 1 ? 'FINISH LESSON' : 'NEXT STEP ›',
        onResult: (res) => { if (s.scoringRules) return stepDone(res); ui.results[ui.i] = res; go(ui.i + 1); return {}; }
      });
      return ui.child.render();
    }
    if (s.shot && s.scoringRules && s.phase !== 'teach') {
      if (!ui.play) return introCard(s, true);
      ui.child = drillRunner(ctx, env, s, k, { title: `${PHASE_NAMES[s.phase]} · ${s.title}`, coach: s.phase === 'test' ? null : 'beginner', onFinish: stepDone });
      return ui.child.render();
    }
    return introCard(s, false);
  }
  function onAction(a, el, e) {
    if (a === 'cl-next') { if (!ui.results[ui.i]) ui.results[ui.i] = { passed: true, score: 0 }; go(ui.i + 1); return true; }
    if (a === 'cl-play') { ui.play = true; render(); return true; }
    if (a === 'cl-prev') { go(Math.max(0, ui.i - 1)); return true; }
    if (a === 'cl-restart') { ui.results = []; ui.done = false; go(0); return true; }
    if (ui.child) return ui.child.onAction(a, el, e);
    const s = steps[ui.i];
    return s?.shot ? sheetFor(ctx, a, chFor(env.doc, s, stepKey())) : false;
  }
  return { render, onAction, get stepIndex() { return ui.i; } };
}

/** Skill game templates (gauntlet, target, streak, lives, scoreAttack, multiStage, quizExecution) — see content/templates.js */
function gameRunner(ctx, env, item, key) {
  const doc = item;
  let events = [];
  const ui = { quizPick: null, quizLocked: false, railPick: null, over: false, extra: null, passed: false };
  const G = () => T.replayGame(doc, events);
  function stageCh(g) {
    const st = T.currentStage(doc, g);
    const idx = doc.stages.indexOf(st);
    return { st, ch: shotToChallenge(st.shot, { id: `cx-${env.doc.id}-${key}-g${idx}`, title: st.title, difficulty: st.difficulty, skill: doc.skill, scoringRules: st.scoringRules || { mode: 'success', attempts: 1, pass: { made: 1 } } }) };
  }
  function hearts(g) {
    if (g.lives == null) return '';
    return `<span class="hearts emoji" data-lives="${g.lives}" aria-label="${g.lives} lives left">${'❤️'.repeat(g.lives)}<i>${'🖤'.repeat(Math.max(0, g.livesTotal - g.lives))}</i></span>`;
  }
  function quizHTML(st) {
    const q = st.quiz;
    if (q.answer) {
      let after = '';
      if (ui.quizLocked) {
        const v = T.diamondVerdict(ui.railPick, q.answer);
        after = `<p class="diaLine ${v.verdict}" data-verdict="${v.verdict}">Your answer: ${ui.railPick ? ui.railPick.diamond.toFixed(1) : '—'} · Recommended: ${Number(q.answer.diamond).toFixed(1)} · Difference: ${v.diff != null ? `${v.diff.toFixed(1)} diamonds` : 'different rail'} <em class="vd">${T.VERDICT_TEXT[v.verdict]}</em></p>${q.explanation ? `<small class="muted">${esc(q.explanation)}</small>` : ''}`;
      }
      return `<div class="quizBox" data-quiz="rail"><b>${esc(q.question)}</b><div class="railPick"><b>${ui.railPick ? esc(T.railAnswerText(ui.railPick)) : 'Tap the table where the cue ball meets the rail'}</b></div>${after}</div>`;
    }
    return `<div class="quizBox" data-quiz="choice"><b>${esc(q.question)}</b><div class="quizOpts">${q.options.map((o, i) => `<button type="button" class="quizOpt${ui.quizPick === i ? ' active' : ''}${ui.quizLocked ? (i === q.correct ? ' right' : ui.quizPick === i ? ' wrong' : '') : ''}" data-action="cg-opt" data-i="${i}" ${ui.quizLocked ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>${ui.quizLocked && q.explanation ? `<small class="muted">${esc(q.explanation)}</small>` : ''}</div>`;
  }
  function quizOk(st) {
    const q = st.quiz;
    if (q.answer) return T.diamondVerdict(ui.railPick, q.answer).verdict === 'pass';
    return ui.quizPick === q.correct;
  }
  function render() {
    const g = G();
    if (g.over) return gameOver(g);
    const { st, ch } = stageCh(g);
    const level = coachingLevel(ctx.getState(), { primarySkill: doc.skill || env.doc.skill || null });
    const vis = visibility(level, ch, false);
    const quiz = g.phase === 'quiz';
    const tpl = doc.template;
    const undo = events.length ? '<button type="button" class="rbUndo" data-action="cg-undo" aria-label="Undo last result">↶ Undo</button>' : '';
    let btns;
    if (quiz) btns = `<div class="resultBar"><button type="button" class="lockBtn" data-action="${ui.quizLocked ? 'cg-quiz-go' : 'cg-quiz-lock'}" ${ui.quizLocked || (st.quiz.answer ? ui.railPick : ui.quizPick != null) ? '' : 'disabled'}>${ui.quizLocked ? 'NOW SHOOT IT ›' : 'LOCK ANSWER'}</button></div>`;
    else if (tpl === 'target') btns = `<div class="resultBar tgt">${[0, 1, 2, 3].map((s) => `<button type="button" class="rb ${s ? `s${s}` : 'miss'}" data-action="cg-shot" data-stars="${s}"><b>${s ? '★'.repeat(s) : 'MISS'}</b></button>`).join('')}${undo}</div>`;
    else btns = `<div class="resultBar n2"><button type="button" class="rb miss" data-action="cg-shot" data-ok="0"><b>MISS</b>${g.lives != null ? '<small>−1 life</small>' : ''}</button><button type="button" class="rb s3" data-action="cg-shot" data-ok="1"><b>SUCCESS</b><small>+${st.points ?? g.rules.pointsPerSuccess}</small></button>${undo}</div>`;
    const multi = tpl === 'multiStage' && st.scoringRules ? ` · ${g.stageMade}/${st.scoringRules.pass.made} made · try ${g.stageTries + 1}/${st.scoringRules.attempts}` : '';
    const quizTable = quiz && !ui.quizLocked;
    ctx.root.innerHTML = `<div class="playScreen gameScreen" data-mode="game" data-template="${esc(tpl)}" data-stage-index="${g.pos}" data-phase="${g.phase}">
      ${headHTML(`${env.prefix}${doc.title}`, T.stageLabel(doc, g), `${hearts(g)}<span class="score" data-score="${g.score}">${g.score}</span>`)}
      <div class="playTable${quizTable && st.quiz.answer ? ' tapRail' : ''}" data-tap-table>${renderStageTable(ch, quizTable ? { showCuePath: false, showObPath: false, showAim: false, markers: 'reference', diamondNumbers: !!st.quiz.answer, pins: ui.railPick ? [{ ...ui.railPick, kind: 'player', label: ui.railPick.diamond.toFixed(1) }] : [] } : { showCuePath: vis.cuePath, showObPath: vis.obPath, showAim: vis.aim, markers: 'all' })}</div>
      ${setupLineHTML(ch)}
      <div class="playBody">
        ${quiz ? quizHTML(st) : `<div class="recipeRow">${recipeGaugesHTML(ch, { hideAim: !vis.aim, hideRoute: !vis.cuePath && !vis.obPath })}<button type="button" class="whyBtn" data-action="why-open">WHY THIS SHOT?</button></div>`}
        <div class="goalLine"><span class="coachTag">${esc(st.difficulty ? `LEVEL ${st.difficulty}` : 'STAGE')}</span><p class="goal"><b>${esc(st.title)}</b> — ${esc(ch.goal)}</p></div>
        <div class="progressLine"><span class="muted" data-game-stats>✓ ${g.made} · ✕ ${g.missed} · streak ${g.streak}${multi}</span><span class="muted">${esc(TEMPLATE_NAMES[tpl])}</span></div>
      </div>
      ${btns}
    </div>`;
    const tbl = ctx.root.querySelector('[data-tap-table]');
    if (quizTable && st.quiz.answer && tbl) tbl.addEventListener('click', (e) => { const p = svgPoint(ctx.root, e); if (p) { ui.railPick = T.tapToRail(p.x, p.y); render(); } });
  }
  function gameOver(g) {
    const s = T.gameSummary(doc, g);
    if (!ui.over) {
      ui.over = true;
      ui.passed = g.won;
      ui.extra = env.complete({ passed: g.won, score: g.score, summary: s }) || {};
    }
    const tpl = doc.template;
    const h1 = g.won ? (tpl === 'gauntlet' ? 'GAUNTLET CLEARED' : 'CHALLENGE COMPLETE') : 'GAME OVER';
    const staged = tpl === 'gauntlet' || tpl === 'multiStage' || tpl === 'quizExecution';
    const pb = env.sandbox ? '—' : ui.extra.best ?? s.score;
    ctx.root.innerHTML = finishHTML({
      eyebrow: `${env.prefix}${doc.title}`,
      h1,
      passed: ui.passed,
      attrs: `data-game-over="1" data-reason="${esc(g.reason)}"`,
      stats: [
        [s.score, 'SCORE', ` data-final-score="${s.score}"`],
        [staged ? `${s.stageReached}/${s.stages}` : s.stageReached, 'STAGE REACHED', ` data-stage-reached="${s.stageReached}"`],
        [s.successes, 'SUCCESSFUL SHOTS', ` data-successes="${s.successes}"`],
        [s.misses, 'MISSES', ` data-misses="${s.misses}"`],
        [s.longestStreak, 'LONGEST STREAK', ` data-longest="${s.longestStreak}"`],
        [pb, 'PERSONAL BEST', ` data-pb="${pb}"`]
      ],
      extra: { ...ui.extra, exitHref: env.exitHref },
      retry: 'cg-again'
    });
  }
  function onAction(a, el) {
    switch (a) {
      case 'cg-shot': events = [...events, { t: 'shot', ok: el.dataset.ok === '1', stars: Number(el.dataset.stars || 0) }]; render(); return true;
      case 'cg-undo': if (events.length) { events = events.slice(0, -1); ui.quizLocked = false; ui.quizPick = null; ui.railPick = null; toast('Last result removed'); render(); } return true;
      case 'cg-opt': ui.quizPick = Number(el.dataset.i); render(); return true;
      case 'cg-quiz-lock': ui.quizLocked = true; render(); return true;
      case 'cg-quiz-go': {
        const st = T.currentStage(doc, G());
        events = [...events, { t: 'quiz', ok: quizOk(st) }];
        ui.quizLocked = false; ui.quizPick = null; ui.railPick = null;
        render();
        return true;
      }
      case 'cg-again': events = []; ui.over = false; ui.quizLocked = false; ui.quizPick = null; ui.railPick = null; render(); return true;
      default: return sheetFor(ctx, a, stageCh(G()).ch);
    }
  }
  return { render, onAction, get game() { return G(); }, get events() { return events.slice(); } };
}

function runnerFor(ctx, env, item, key) {
  if (item.contentType === 'drill') return drillRunner(ctx, env, item, key);
  if (item.contentType === 'challenge') return challengeRunner(ctx, env, item, key);
  if (item.contentType === 'lesson') return lessonRunner(ctx, env, item, key);
  if (item.contentType === 'game') return gameRunner(ctx, env, item, key);
  return null;
}

/** #cplay/<ref>[/<stageIdx>] — returns a screen, or { error, redirect } */
export function createContentPlay(ctx, ref, stageArg) {
  const r = resolve(ref);
  if (!r) return { error: 'That content is not available — import the file again.' };
  const d = r.doc;
  let item = d;
  let stageIdx = null;
  if (d.contentType === 'pack') {
    stageIdx = clamp(Math.floor(Number(stageArg) || 0), 0, d.stages.length - 1);
    item = d.stages[stageIdx];
    if (!r.sandbox && S.packStageStates(d, S.progressFor(r.uid))[stageIdx] === 'locked') return { error: 'Locked — pass the previous stage first', redirect: `#cview/${r.uid}` };
  }
  const exitHref = `#cview/${ref}`;
  const env = {
    doc: d,
    sandbox: r.sandbox,
    uid: r.uid,
    prefix: r.sandbox ? 'PLAY TEST · ' : '',
    exitHref,
    complete(res) {
      if (r.sandbox) {
        const buttons = [{ label: '＋ ADD TO MY CONTENT', action: 'c-install' }];
        if (stageIdx != null && stageIdx < d.stages.length - 1) buttons.push({ label: 'NEXT STAGE ›', action: 'go', href: `#cplay/pending/${stageIdx + 1}`, alt: true });
        buttons.push({ label: 'BACK TO PREVIEW', action: 'go', href: exitHref, alt: true });
        return { note: SANDBOX_NOTE, buttons };
      }
      const out = S.recordResult(r.uid, { stageId: stageIdx != null ? item.id : null, passed: !!res.passed, score: res.score, summary: res.summary });
      const best = stageIdx != null ? out.progress.stages[item.id]?.best : out.progress.best;
      const buttons = [];
      if (stageIdx != null) {
        const states = S.packStageStates(d, out.progress);
        if (stageIdx < d.stages.length - 1 && states[stageIdx + 1] !== 'locked') buttons.push({ label: 'NEXT STAGE ›', action: 'go', href: `#cplay/${r.uid}/${stageIdx + 1}` });
        buttons.push({ label: 'PACK PROGRESS', action: 'go', href: exitHref, alt: true });
      }
      return { note: 'Saved to My Content — personal progress only (never Career).', buttons, newBest: out.newBest, best };
    }
  };
  const runner = runnerFor(ctx, env, item, stageIdx != null ? `st${stageIdx}` : 'root');
  if (!runner) return { error: 'Unsupported content' };
  return {
    render: () => runner.render(),
    onAction(a, el, e) {
      if (runner.onAction(a, el, e)) return true;
      if (a === 'c-exit') { ctx.go(exitHref); return true; }
      return contentAction(a, el, e, ctx);
    },
    onTableTap: () => false,
    runner,
    sandbox: r.sandbox
  };
}

// ------------------------------------------------------------------ edit: which shot?  (+ document details)
/** Every item in a document that has a shot, with a locator path */
export function shotItems(doc) {
  const out = [];
  const walk = (it, loc, label) => {
    if (it.shot) out.push({ loc, label, item: it });
    (it.steps || []).forEach((s, i) => walk(s, [...loc, 'steps', i], `${label ? `${label} › ` : ''}${PHASE_NAMES[s.phase]}: ${s.title}`));
    if (it.contentType === 'pack' || it.contentType === 'game') (it.stages || []).forEach((s, i) => walk(s, [...loc, 'stages', i], `${label ? `${label} › ` : ''}${i + 1}. ${s.title}`));
  };
  walk(doc, [], '');
  return out;
}
export function itemAt(doc, loc) {
  let it = doc;
  for (const k of loc) it = it?.[k];
  return it;
}
export const encodeLoc = (loc) => (loc.length ? loc.join('.') : 'root');
export const decodeLoc = (s) => (!s || s === 'root' ? [] : String(s).split('.').map((k) => (/^\d+$/.test(k) ? Number(k) : k)));

export function editListHTML(uid) {
  const it = S.getItem(uid);
  if (!it) return '<p class="muted">That item is no longer installed.</p>';
  const d = it.doc;
  const shots = shotItems(d);
  const a = d.attribution || {};
  const n = (s) => (s.item.shot.ballPositions || []).length;
  return `<div class="contentView" data-edit-list="${esc(uid)}">
    <div class="cvHead"><button type="button" class="phBack" data-action="go" data-href="#cview/${esc(uid)}" aria-label="Back">‹</button><div><span class="eyebrow">EDIT · ${esc(typeLabel(d.contentType).toUpperCase())}</span><h1 class="cvTitle">${esc(d.title)}</h1></div></div>
    <h3 class="cvH">Shots — tap one to move balls, change SPEED, recipe and texts</h3>
    <div class="editShots">${shots.map((s) => `<button type="button" class="editShot" data-action="go" data-href="#cedit/${esc(uid)}/${esc(encodeLoc(s.loc))}"><span>${esc(s.label || d.title)}<small>SPEED ${formatSpeed(s.item.shot.speed)} · ${n(s)} ball${n(s) === 1 ? '' : 's'}</small></span><b>EDIT ›</b></button>`).join('')}</div>
    <div class="card dbSec"><h3>Details</h3>
      <label class="fld"><span>Title</span><input id="ce-title" type="text" maxlength="80" value="${esc(d.title)}"/></label>
      <label class="fld"><span>Description</span><textarea id="ce-description" rows="3" maxlength="2000">${esc(d.description || '')}</textarea></label>
      <div class="dbGrid2"><label class="fld"><span>Content version</span><input id="ce-version" type="text" maxlength="14" value="${esc(d.contentVersion)}" inputmode="decimal"/></label><label class="fld"><span>Category</span><input id="ce-category" type="text" maxlength="40" value="${esc(d.category || '')}"/></label></div>
      <label class="fld"><span>Author <small class="muted">(optional — leave blank if unknown)</small></span><input id="ce-author" type="text" maxlength="80" value="${esc(a.author || '')}"/></label>
      <label class="fld"><span>Source name</span><input id="ce-sourceName" type="text" maxlength="120" value="${esc(a.sourceName || '')}"/></label>
      <label class="fld"><span>Source link (http/https)</span><input id="ce-sourceURL" type="url" maxlength="500" value="${esc(a.sourceURL || '')}"/></label>
      <label class="fld"><span>Notes</span><textarea id="ce-notes" rows="2" maxlength="600">${esc(a.notes || '')}</textarea></label>
      <div class="dbMsgs" id="ceMsgs"></div>
      <button type="button" class="bigBtn" data-action="ce-save-meta" data-uid="${esc(uid)}">SAVE DETAILS</button>
    </div>
    <button type="button" class="bigBtn alt" data-action="c-export" data-uid="${esc(uid)}">EXPORT .POOLIQ</button>
  </div>`;
}
export function saveMetaFromForm(uid) {
  const it = S.getItem(uid);
  if (!it) return { error: 'That item is no longer installed.' };
  const doc = JSON.parse(JSON.stringify(it.doc));
  const val = (id) => (document.getElementById(id)?.value ?? '').trim();
  doc.title = val('ce-title') || doc.title;
  if (val('ce-description')) doc.description = val('ce-description'); else delete doc.description;
  doc.contentVersion = val('ce-version') || doc.contentVersion;
  if (val('ce-category')) doc.category = val('ce-category'); else delete doc.category;
  const at = { author: val('ce-author'), sourceName: val('ce-sourceName'), sourceURL: val('ce-sourceURL'), notes: val('ce-notes') };
  for (const k of Object.keys(at)) if (!at[k]) delete at[k];
  if (Object.keys(at).length) doc.attribution = at; else delete doc.attribution;
  return S.updateItemDoc(uid, doc);
}
