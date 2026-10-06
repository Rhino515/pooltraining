/**
 * DEV MODE screens (#dev, #devgame/<id>, #devedit/<game>/<stage>, #devkeys). See docs/DEV_MODE.md.
 * The lock is a convenience lock on this device — NOT server security. Every action that changes data takes a
 * snapshot first (env.snapshot captures the data synchronously before the change).
 */
import * as D from '../dev/dev.js';
import * as O from '../dev/overrides.js';
import { GAMES, getGame, stageSpecs, getStage, clearStageCache } from '../games/registry.js';
import * as S from '../content/store.js';
import { APP_VERSION } from '../vault.js';
import { RANK_LADDER, DRILL_RANK } from '../progression/config.js';
import { typeLabel } from '../content/schema.js';
import { openSheet, closeSheet, toast } from './sheet.js';
import { allDrills, displayDrillTitle } from '../drills.js';
import { isDrillHidden } from '../drills/hidden.js';
import { loadDrillEdits } from '../drills/ownerEdits.js';
import * as CP from '../dev/copy.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const HONEST = 'DEV MODE is a convenience lock on this device, not server security: anyone with this phone and browser tools can read or change local data. It keeps test tools out of everyday use.';
const seedSel = { rank: 1, ball: 1, drill: 3 };
const fmtB = (n) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);

export const devUnlocked = () => D.isUnlocked();

function head(sub) {
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="${sub ? '#dev' : '#settings'}">‹ ${sub ? 'DEV MODE' : 'Settings'}</button><span class="eyebrow devEyebrow">DEV MODE${sub ? ` · ${esc(sub)}` : ''}</span><h1>${sub ? esc(sub) : 'Dev Mode'}</h1></div>`;
}
/**
 * The Dev Mode ON/OFF switch. Rendered only for the signed-in owner account (andrewaphay@gmail.com);
 * every other account and signed-out use get an empty string, so the switch never shows for them.
 * The action is "devmode-set" (not "dev-…") so it still works while Dev Mode is OFF.
 */
export function devSwitchHTML() {
  if (!D.ownerAccountSignedIn()) return '';
  const on = D.devModeOn();
  return `<div class="devSwitch" data-dev-switch="${on ? 'on' : 'off'}">
      <div class="chips" role="group" aria-label="Dev Mode">
        <button type="button" class="chip${on ? ' active' : ''}" data-action="devmode-set" data-v="on" aria-pressed="${on ? 'true' : 'false'}">ON</button>
        <button type="button" class="chip${on ? '' : ' active'}" data-action="devmode-set" data-v="off" aria-pressed="${on ? 'false' : 'true'}">OFF</button>
      </div>
      <p class="muted small">${on
        ? 'ON: edit buttons show, and every locked drill, level and stage opens as a DEV PREVIEW. Previews do not save results, so XP and unlocks do not change.'
        : 'OFF: no edit buttons. Locked drills, levels and stages stay locked until you pass them.'}</p>
    </div>`;
}
function gate() {
  if (D.ownerAccountSignedIn()) {
    return `${head()}<div class="card devCard devGate" data-dev-state="off"><div class="eyebrow">DEV MODE IS OFF</div>${devSwitchHTML()}</div>`;
  }
  return `${head()}<div class="card devCard devGate" data-dev-state="locked"><div class="eyebrow">LOCKED</div><p class="muted small">Dev tools are only on the owner account. There is no passcode and no unlock step.</p></div>`;
}

export function renderDev(state) {
  if (!D.isUnlocked()) return gate();
  const ov = Object.values(O.loadOverrides().items);
  const items = S.loadContent();
  return `${head()}
    <div class="card devCard" data-dev-state="unlocked"><div class="eyebrow">DEV MODE IS ON</div><p class="muted small" data-owner-account>This account is the dev. There is no passcode.</p>${devSwitchHTML()}</div>
    ${state.devSeed ? `<div class="card devBanner" data-dev-seed>TEST STATE ACTIVE · ${esc(state.devSeed.label)}<button type="button" class="bigBtn" data-action="dev-restore-real">RESTORE MY REAL PROGRESS</button><small class="muted">Anything played while the test state is active is discarded when you restore.</small></div>` : ''}
    <h2>Edit built-in content</h2>
    <div class="card devCard"><p class="muted small">Edits stay on this phone. Shipped files do not change. RESET brings the original back. Open any built-in drill or stage: rename the title and description, and drag balls when the table has them.</p>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#devdrills">BUILT-IN DRILLS</button>
      <div class="devGames">${GAMES.filter((g) => !g.special).map((g) => { const n = ov.filter((o) => o.id.startsWith(`stage:${g.id}:`)).length; return `<button type="button" class="chip" data-action="go" data-href="#devgame/${g.id}">${g.icon} ${esc(g.name)}${n ? ` <b class="gold">${n}</b>` : ''}</button>`; }).join('')}</div>
      <div class="kv"><span>Overrides</span><b data-override-count="${ov.length}">${ov.length}</b></div>
      <button type="button" class="bigBtn alt" data-action="dev-export" ${ov.length ? '' : 'disabled'}>EXPORT OVERRIDES (.pooliq pack)</button>
      <label class="bigBtn alt fileBtn">IMPORT OVERRIDES<input type="file" accept=".pooliq,.json,application/json" data-dev-import aria-label="Import an overrides pack"/></label></div>
    <h2>My Content (unrestricted)</h2>
    <div class="card devCard"><p class="muted small">While unlocked, pack stages can be played in any order. Mark imported content official / eligible to test how it counts.</p>
      ${items.length ? items.map((it) => { const d = it.doc; return `<div class="devItem" data-dev-item="${esc(it.uid)}"><div><b>${esc(displayDrillTitle(it.title))}</b><small class="muted">${esc(typeLabel(d.contentType))}${d.metadata?.official ? ' · OFFICIAL' : ''}</small></div><div class="chips"><button type="button" class="chip${d.careerEligible ? ' active' : ''}" data-action="dev-mark" data-uid="${esc(it.uid)}" data-k="careerEligible">Career-eligible</button><button type="button" class="chip${d.rankXpEligible ? ' active' : ''}" data-action="dev-mark" data-uid="${esc(it.uid)}" data-k="rankXpEligible">Rank XP</button><button type="button" class="chip${d.metadata?.official ? ' active' : ''}" data-action="dev-mark" data-uid="${esc(it.uid)}" data-k="official">Official</button><button type="button" class="chip" data-action="go" data-href="#cedit/${esc(it.uid)}">Edit</button><button type="button" class="chip danger" data-action="dev-del-content" data-uid="${esc(it.uid)}">Delete</button></div></div>`; }).join('') : '<p class="muted">No installed content.</p>'}
      <button type="button" class="bigBtn alt" data-action="go" data-href="#content">OPEN MY CONTENT</button></div>
    <h2>On-screen words</h2>
    <div class="card devCard" data-copy-panel><p class="muted small">Hold any words, or tap Edit on a paragraph, heading, or list. Save publishes for everyone. The shipped file stays. Another account cannot edit.</p>
      <div class="kv"><span>Published</span><b>${CP.copyCount()}</b></div>
      ${Object.entries(CP.loadCopy().items).slice(0, 12).map(([k, v]) => `<div class="devItem"><div><b>${esc(v.text)}</b></div><button type="button" class="miniAct danger" data-action="dev-copy-clear" data-key="${esc(k)}">USE ORIGINAL</button></div>`).join('')}
      <button type="button" class="bigBtn alt" data-action="dev-copy-reset" ${CP.copyCount() ? '' : 'disabled'}>RESET ALL WORDS</button></div>
    <h2>Test progression</h2>
    <div class="card devCard"><p class="muted small">Jump to a test state. It is flagged DEV (banner shown, excluded from public stats). Your real data is stashed first — RESTORE MY REAL PROGRESS brings it back.</p>
      <div class="eyebrow">CAREER RANK</div><div class="chips">${RANK_LADDER.names.map((n, i) => `<button type="button" class="chip${seedSel.rank === i ? ' active' : ''}" data-action="dev-seed-rank" data-v="${i}">${esc(n)}</button>`).join('')}</div>
      ${RANK_LADDER.balls[seedSel.rank] ? `<div class="eyebrow">BALL</div><div class="chips">${Array.from({ length: RANK_LADDER.balls[seedSel.rank] }, (_, i) => i + 1).map((b) => `<button type="button" class="chip${seedSel.ball === b ? ' active' : ''}" data-action="dev-seed-ball" data-v="${b}">${b}</button>`).join('')}</div>` : ''}
      <button type="button" class="bigBtn alt" data-action="dev-seed" data-what="rank">SEED CAREER RANK</button>
      <div class="eyebrow">DRILL RANK</div><div class="chips">${DRILL_RANK.ranks.map((r, i) => `<button type="button" class="chip${seedSel.drill === i + 1 ? ' active' : ''}" data-action="dev-seed-drill" data-v="${i + 1}">${i + 1} ${esc(r.name)}</button>`).join('')}</div>
      <button type="button" class="bigBtn alt" data-action="dev-seed" data-what="drill">SEED DRILL RANK</button></div>
    <h2>Tools</h2>
    <div class="card devCard">
      <div class="kv"><span>App version</span><b>v${esc(APP_VERSION)}</b></div>
      <div class="kv"><span>Service worker caches</span><b data-cache-names>…</b></div>
      <button type="button" class="bigBtn alt" data-action="dev-clear-caches">CLEAR CACHES & RELOAD</button>
      <button type="button" class="bigBtn alt" data-action="go" data-href="#devkeys">VIEW STORAGE KEYS</button></div>`;
}
/** Fill async info (cache names) after render */
export async function fillDev() {
  const el = document.querySelector('[data-cache-names]');
  if (!el) return;
  try { const k = typeof caches !== 'undefined' ? await caches.keys() : []; el.textContent = k.length ? k.join(', ') : 'none'; } catch { el.textContent = 'not available'; }
}
export function renderDevGame(gameId) {
  if (!D.isUnlocked()) return gate();
  const g = getGame(gameId);
  if (!g || g.special) return `${head('Edit')}<p class="muted">Unknown game.</p>`;
  const specs = stageSpecs(gameId);
  return `${head(g.name)}<div class="stageList">${specs.map((s, i) => {
    const id = O.stageOverrideId(gameId, s.id);
    const has = !!O.getOverride(id);
    const ch = getStage(gameId, s.id);
    const balls = !!(ch?.cueBallPosition || ch?.ballPositions?.length);
    return `<div class="stageRow card devStage${has ? ' overridden' : ''}" data-dev-stage="${esc(s.id)}" data-overridden="${has ? 1 : 0}"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(ch?.name || s.name)}</b><small>${has ? '<span class="tag gold">OVERRIDDEN</span> ' : ''}${esc(id)}${balls ? '' : ' · text only'}</small></span><span class="srSide devBtns"><button type="button" class="miniAct" data-action="go" data-href="#devedit/${gameId}/${esc(s.id)}">EDIT</button>${has ? `<button type="button" class="miniAct danger" data-action="dev-reset" data-id="${esc(id)}" data-game="${gameId}">RESET TO ORIGINAL</button>` : ''}<button type="button" class="miniAct" data-action="go" data-href="#play/${gameId}/${esc(s.id)}">PLAY</button></span></div>`;
  }).join('')}</div>`;
}
export function renderDevKeys() {
  if (!D.isUnlocked()) return gate();
  const keys = D.storageKeys();
  return `${head('Storage keys')}<div class="card devCard" data-dev-keys>${keys.map((k) => `<details class="devKey"><summary><b>${esc(k.key)}</b><small>${fmtB(k.bytes)}</small></summary><pre class="jsonBox">${esc(k.key === D.DEV_KEY ? '(passcode hash hidden)' : k.preview)}${k.preview.length >= 160 ? '…' : ''}</pre></details>`).join('')}<p class="muted small">localStorage keys on this device (${keys.length}). Data keys are mirrored to IndexedDB and included in backups.</p></div>`;
}

/** Content-mode options for the builder when editing a built-in stage (#devedit) */
export function devEditOptions(gameId, stageId, env) {
  if (!D.isUnlocked()) return null;
  const g = getGame(gameId);
  const spec = stageSpecs(gameId).find((s) => s.id === stageId);
  if (!g || !spec || !O.isEditableSpec(spec, spec.kind || g.kind)) return null;
  const id = O.stageOverrideId(gameId, stageId);
  const ov = O.getOverride(id);
  clearStageCache(gameId);
  const ch = getStage(gameId, stageId);
  let doc;
  try { doc = D.editDocForStage(ch, ov); } catch (e) { return { error: String(e.message || e) }; }
  return {
    uid: `dev-${gameId}-${stageId}`,
    loc: [],
    doc,
    item: doc,
    label: 'DEV OVERRIDE',
    exitHref: `#devgame/${gameId}`,
    onSave(newDoc) {
      env.snapshot(`Before DEV override: ${ch.name}`);
      const out = O.setOverride(id, newDoc);
      clearStageCache(gameId);
      return out;
    }
  };
}


export function renderDevDrills() {
  if (!D.isUnlocked()) return gate();
  const list = allDrills().filter((d) => d && !d.custom && !d.contentUid && !isDrillHidden(d.id));
  const edits = new Set(Object.keys(loadDrillEdits().items));
  return `${head('Drills')}<p class="muted small">Built-in drills that are still in the app. A deleted drill is not listed. EDIT opens the phone editor.</p><div class="stageList">${list.map((d, i) => {
    const has = edits.has(d.id);
    return `<div class="stageRow card devStage${has ? ' overridden' : ''}" data-dev-drill="${esc(d.id)}" data-overridden="${has ? 1 : 0}"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(displayDrillTitle(d.name))}</b><small>${has ? '<span class="tag gold">SAVED ON THIS PHONE</span> ' : ''}${esc(displayDrillTitle(d.category || ''))}</small></span><span class="srSide devBtns"><button type="button" class="miniAct" data-action="go" data-href="#drillfix/${esc(d.id)}">EDIT</button></span></div>`;
  }).join('')}</div>`;
}

export function devAction(a, el, env) {
  if (!a.startsWith('dev-')) return false;
  if (!D.isUnlocked()) { toast('DEV MODE is locked'); env.rerender(); return true; }
  D.touch();
  switch (a) {
    case 'dev-reset': {
      env.snapshot('Before DEV reset override');
      O.removeOverride(el.dataset.id);
      clearStageCache(el.dataset.game);
      toast('Reset to the original');
      env.rerender();
      return true;
    }
    case 'dev-export': {
      const out = D.exportOverridesPack();
      if (out.error) { toast(out.error); return true; }
      env.downloadFile(`${out.doc.id}.pooliq`, JSON.stringify(out.doc, null, 2));
      toast(`Exported ${out.count} override${out.count === 1 ? '' : 's'}`);
      return true;
    }
    case 'dev-mark': {
      const it = S.getItem(el.dataset.uid);
      if (!it) return true;
      const k = el.dataset.k;
      const cur = k === 'official' ? !!it.doc.metadata?.official : !!it.doc[k];
      env.snapshot('Before DEV mark content');
      const r = S.updateItemDoc(it.uid, D.markContentDoc(it.doc, { [k]: !cur }));
      if (r.error) toast(r.error.split('\n')[0]); else toast(`${it.title}: ${k} ${!cur ? 'ON' : 'OFF'}`);
      env.afterContentChange();
      env.rerender();
      return true;
    }
    case 'dev-del-content': {
      env.snapshot('Before DEV delete content');
      S.deleteItem(el.dataset.uid);
      env.afterContentChange();
      toast('Deleted');
      env.rerender();
      return true;
    }
    case 'dev-seed-rank': seedSel.rank = Number(el.dataset.v); seedSel.ball = 1; env.rerender(); return true;
    case 'dev-seed-ball': seedSel.ball = Number(el.dataset.v); env.rerender(); return true;
    case 'dev-seed-drill': seedSel.drill = Number(el.dataset.v); env.rerender(); return true;
    case 'dev-seed': {
      const opts = el.dataset.what === 'drill' ? { drillRank: seedSel.drill } : { rank: seedSel.rank, ball: seedSel.ball };
      env.seed(opts);
      return true;
    }
    case 'dev-restore-real': env.restoreReal(); return true;
    case 'dev-clear-caches': env.clearCaches(); return true;
    case 'dev-copy-open':
      CP.openCopyEditor(el.dataset.key, el.dataset.shipped || '', el.dataset.shown || '');
      return true;
    case 'dev-copy-save': {
      CP.saveCopyText(el.dataset.key, document.getElementById('copyText')?.value || '').then((r) => {
        if (r.error) { toast(r.error); return; }
        CP.finishRename(true);
        env.rerender();
      });
      return true;
    }
    case 'dev-copy-clear': {
      CP.clearCopyKey(el.dataset.key).then((r) => {
        if (r.error) { toast(r.error); return; }
        CP.finishRename(false);
        toast('Original words restored');
        env.rerender();
      });
      return true;
    }
    case 'dev-copy-reset': {
      CP.resetAllCopy().then((r) => {
        if (r.error) { toast(r.error); return; }
        toast('All published words restored');
        env.rerender();
      });
      return true;
    }
    default: return false;
  }
}
/** DEV import (file input) */
export async function onDevImportFile(file, env) {
  if (!D.isUnlocked()) { toast('DEV MODE is locked'); return; }
  env.snapshot('Before DEV import overrides');
  const r = D.importOverridesPack(await file.text(), { stageExists: (g, s) => !!stageSpecs(g).find((x) => x.id === s) });
  if (r.error) { toast(r.error); return; }
  clearStageCache();
  toast(`Imported ${r.applied} override${r.applied === 1 ? '' : 's'}${r.skipped.length ? ` · ${r.skipped.length} skipped` : ''}`);
  env.rerender();
}
