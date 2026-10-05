/**
 * Published on-screen words (v14-35).
 *
 * Shipped files stay in git. A row in public.text_overrides replaces that
 * text block for every visitor, signed in or not. Only the owner account
 * can write (RLS on auth email). There is no passcode.
 *
 * The owner edits by holding a text block, or by tapping Edit on a
 * paragraph, heading, or list item. SAVE publishes. USE ORIGINAL deletes
 * the row and the shipped words come back.
 *
 * poolIQDevCopyV1 is only the last good read, so a failed load keeps words
 * already published. It is not a private rename list.
 */
import { lsSet } from '../storage.js';
import { SUPABASE_URL, SUPABASE_KEY } from '../cloud/config.js';
import { getClient, currentUser } from '../cloud/client.js';
import { ownerAccountSignedIn, devModeOn, isOwnerEmail } from './dev.js';
import { openSheet, closeSheet, toast } from '../ui/sheet.js';

export const COPY_KEY = 'poolIQDevCopyV1';
const MAX_TEXT = 2000;
const MAX_KEY = 280;
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);

let items = readStored();
let status = 'idle';
let epoch = 0;
let hintOn = true;
let skipClick = false;
let hold = null;

function readStored() {
  try {
    const o = JSON.parse(ls()?.getItem(COPY_KEY) || 'null');
    if (o && o.schema === 2 && o.items && typeof o.items === 'object') return { ...o.items };
  } catch { /* fall through */ }
  return {};
}
function persist() {
  try { lsSet(COPY_KEY, JSON.stringify({ schema: 2, items })); } catch { /* quota */ }
}
export function loadCopy() {
  return { schema: 2, items: { ...items } };
}
export function textStatus() { return status; }
export function textSignature() {
  return Object.keys(items).sort().map((k) => `${k}\t${items[k]?.text || ''}`).join('\n');
}
export function copyCount() { return Object.keys(items).length; }
export function copyEditing() { return hintOn && copyWritable(); }
export function setCopyEditing(on) { hintOn = !!on; return hintOn; }

function signedInEmail() {
  return String(currentUser()?.email || '').trim().toLowerCase();
}
/** Another account is signed in. They can read published words and cannot edit. */
export function otherAccountSignedIn() {
  const email = signedInEmail();
  return !!email && !isOwnerEmail(email);
}
/** Published words replace shipped words for every visitor. */
export function copyApplies() { return true; }
/** Edit controls exist only for the signed-in owner account with Dev Mode ON. */
export function copyWritable() { return ownerAccountSignedIn() && devModeOn(); }

function shippedText(node) {
  if (node.__shipped == null) node.__shipped = node.textContent;
  return node.__shipped;
}
function routeOf(el) {
  if (el.closest && el.closest('nav')) return 'nav';
  if (el.closest && el.closest('header')) return 'header';
  const h = (typeof location !== 'undefined' ? location.hash : '') || '#home';
  return (h.replace(/^#/, '').split('/')[0] || 'home');
}
function fnv(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
/** Stable key from the shipped words, so a published edit still matches after the next render. */
export function copyKey(node, shipped) {
  const el = node.parentElement;
  if (!el) return '';
  const bits = [];
  let p = el;
  for (let i = 0; i < 4 && p && p !== document.body; i++) {
    let b = p.tagName.toLowerCase();
    if (p.id) b += '#' + p.id;
    const da = p.getAttribute('data-action');
    const dh = p.getAttribute('data-href');
    const dp = p.getAttribute('data-page');
    if (da) b += '@' + da;
    if (dh) b += '>' + dh;
    if (dp) b += '~' + dp;
    const idx = p.parentElement ? [...p.parentElement.children].indexOf(p) : 0;
    b += ':' + idx;
    bits.push(b);
    p = p.parentElement;
  }
  const full = `${routeOf(el)}|${bits.join('<')}|${shipped}`;
  return `${routeOf(el)}|${bits.join('<')}|${fnv(full)}|${String(shipped).slice(0, 48)}`.slice(0, MAX_KEY);
}

function looksLikeWords(s) {
  const t = String(s || '').trim();
  return t.length > 0 && t.length <= MAX_TEXT && /[A-Za-z]/.test(t);
}
function cleanText(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return { error: 'Words cannot be empty' };
  if (t.length > MAX_TEXT) return { error: 'That is too long' };
  if (/[<>]/.test(t)) return { error: 'Plain words only' };
  return { text: t };
}

function remember(rows, seen) {
  const next = {};
  for (const row of rows || []) {
    if (!row || typeof row.copy_key !== 'string' || typeof row.body !== 'string') continue;
    const c = cleanText(row.body);
    if (c.error || row.copy_key.length < 1 || row.copy_key.length > MAX_KEY) continue;
    next[row.copy_key] = { text: c.text, at: Date.now() };
  }
  if (seen !== epoch) {
    items = { ...next, ...items };
  } else {
    items = next;
  }
  persist();
}

/** Public read. A failed load keeps words already known. It does not clear them. */
export async function loadPublishedText() {
  const seen = epoch;
  status = 'loading';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/text_overrides?select=copy_key,body`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
      signal: ctrl.signal
    });
    if (!res.ok) { status = 'unreachable'; return { error: 'unreachable', status: res.status }; }
    const rows = await res.json();
    if (!Array.isArray(rows)) { status = 'unreachable'; return { error: 'unreachable' }; }
    remember(rows, seen);
    status = 'ready';
    return { ok: true, count: Object.keys(items).length };
  } catch {
    status = 'unreachable';
    return { error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function openCopyEditor(key, shipped, shown) {
  if (!copyWritable()) return;
  const cur = items[key]?.text ?? shown ?? shipped ?? '';
  openSheet(`<div data-copy-ui><div class="eyebrow">EDIT TEXT</div><h2 class="sheetTitle">On-screen words</h2><p class="muted small">Save publishes these words for everyone. The shipped file is not changed. Only this account can save. There is no passcode.</p><label class="fld"><span>Words</span><textarea id="copyText" rows="8" maxlength="${MAX_TEXT}">${esc(cur)}</textarea></label><button type="button" class="bigBtn" data-action="dev-copy-save" data-key="${esc(key)}">SAVE</button><button type="button" class="bigBtn alt" data-action="dev-copy-clear" data-key="${esc(key)}">USE ORIGINAL</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button></div>`, { id: 'copy-rename' });
}

function ensurePen(parent, key, shipped, shown) {
  if (!parent || !document.createElement) return null;
  const tag = parent.tagName;
  if (!/^(P|H1|H2|H3|H4|LI)$/.test(tag || '')) return null;
  if (parent.closest('button,a,nav,[data-copy-ui]')) return null;
  let btn = [...parent.querySelectorAll(':scope > button[data-copy-pen]')].find((b) => b.dataset.key === key);
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copyPen';
    btn.dataset.copyPen = '1';
    btn.dataset.action = 'dev-copy-open';
    btn.textContent = 'Edit';
    btn.setAttribute('data-copy-ui', '');
    parent.appendChild(btn);
  }
  btn.dataset.key = key;
  btn.dataset.shipped = shipped;
  btn.dataset.shown = shown;
  return btn;
}

/** Replace shipped words inside root. Text nodes only — never HTML. */
export function applyCopy(root) {
  if (!root || typeof document === 'undefined' || typeof document.createTreeWalker !== 'function') return;
  const writable = copyWritable();
  const map = items;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  const pens = new Set();
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea,input,noscript,svg,[data-copy-ui]')) continue;
    const raw = shippedText(node);
    const trimmed = raw.trim();
    if (!looksLikeWords(trimmed)) continue;
    const key = copyKey(node, trimmed);
    if (!key) continue;
    parent.setAttribute('data-copy-key', key);
    const next = map[key]?.text;
    let shown = trimmed;
    if (typeof next === 'string') {
      const padL = raw.match(/^\s*/)?.[0] || '';
      const padR = raw.match(/\s*$/)?.[0] || '';
      node.textContent = padL + next + padR;
      shown = next;
    } else if (node.textContent !== raw) node.textContent = raw;
    if (writable) {
      const pen = ensurePen(parent, key, trimmed, shown);
      if (pen) pens.add(pen);
    }
  }
  root.querySelectorAll?.('button[data-copy-pen]')?.forEach((b) => { if (!writable || !pens.has(b)) b.remove(); });
}

function textFromEvent(e) {
  const el = e.target?.closest?.('h1,h2,h3,h4,p,span,small,button,a,label,li,b,em,summary,div');
  if (!el || el.closest('[data-copy-ui],.sheetWrap,input,textarea,select')) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const shipped = (n.__shipped != null ? n.__shipped : n.textContent).trim();
    if (looksLikeWords(shipped)) return n;
  }
  return null;
}

export function onCopyPointerDown(e) {
  if (!copyWritable()) return;
  if (e.target?.closest?.('input,textarea,select,[data-copy-ui],.sheetWrap')) return;
  const node = textFromEvent(e);
  if (!node) return;
  const start = { x: e.clientX, y: e.clientY, node };
  const timer = setTimeout(() => {
    hold = null;
    skipClick = true;
    const raw = shippedText(start.node);
    const trimmed = raw.trim();
    const key = copyKey(start.node, trimmed);
    if (key) openCopyEditor(key, trimmed, start.node.textContent.trim());
  }, 550);
  hold = { timer, ...start };
}
export function onCopyPointerMove(e) {
  if (!hold) return;
  if (Math.hypot((e.clientX || 0) - hold.x, (e.clientY || 0) - hold.y) > 14) {
    clearTimeout(hold.timer);
    hold = null;
  }
}
export function onCopyPointerUp() {
  if (!hold) return;
  clearTimeout(hold.timer);
  hold = null;
}
export function consumeCopyClick(e) {
  if (!skipClick) return false;
  skipClick = false;
  e.preventDefault();
  e.stopPropagation();
  return true;
}

async function writeRow(key, text) {
  if (!copyWritable()) return { error: 'Turn on Dev Mode on the owner account to edit. Nothing was changed.' };
  const user = currentUser();
  if (!user?.id) return { error: 'Sign in as the owner account to edit. Nothing was changed.' };
  const k = String(key || '');
  if (k.length < 1 || k.length > MAX_KEY) return { error: 'That text cannot be edited' };
  const c = cleanText(text);
  if (c.error) return c;
  try {
    const client = await getClient();
    const { error } = await client.from('text_overrides').upsert(
      { copy_key: k, body: c.text, updated_by: user.id },
      { onConflict: 'copy_key' }
    );
    if (error) {
      const msg = String(error.message || error.code || '');
      if (/row-level|permission|42501|401|403/i.test(msg)) return { error: 'Only the owner account can publish. Nothing was changed.' };
      return { error: 'Could not publish. The live words were not changed.' };
    }
  } catch {
    return { error: 'Could not reach the server. Nothing was published.' };
  }
  epoch++;
  items = { ...items, [k]: { text: c.text, at: Date.now() } };
  persist();
  return { ok: true, text: c.text };
}

export function publishCopyText(key, text) { return writeRow(key, text); }
export function saveCopyText(key, text) { return writeRow(key, text); }

export async function clearCopyKey(key) {
  if (!copyWritable()) return { error: 'Turn on Dev Mode on the owner account to edit. Nothing was changed.' };
  const user = currentUser();
  if (!user?.id) return { error: 'Sign in as the owner account to edit. Nothing was changed.' };
  const k = String(key || '');
  if (!k) return { error: 'That text cannot be edited' };
  try {
    const client = await getClient();
    const { error } = await client.from('text_overrides').delete().eq('copy_key', k);
    if (error) {
      const msg = String(error.message || error.code || '');
      if (/row-level|permission|42501|401|403/i.test(msg)) return { error: 'Only the owner account can publish. Nothing was changed.' };
      return { error: 'Could not restore the original. The live words were not changed.' };
    }
  } catch {
    return { error: 'Could not reach the server. Nothing was changed.' };
  }
  epoch++;
  const next = { ...items };
  delete next[k];
  items = next;
  persist();
  return { ok: true };
}
export async function resetAllCopy() {
  if (!copyWritable()) return { error: 'Turn on Dev Mode on the owner account to edit. Nothing was changed.' };
  const user = currentUser();
  if (!user?.id) return { error: 'Sign in as the owner account to edit. Nothing was changed.' };
  try {
    const client = await getClient();
    const { error } = await client.from('text_overrides').delete().neq('copy_key', '');
    if (error) return { error: 'Could not restore the originals. The live words were not changed.' };
  } catch {
    return { error: 'Could not reach the server. Nothing was changed.' };
  }
  epoch++;
  items = {};
  persist();
  return { ok: true };
}

export function copyBarHTML() {
  if (!copyEditing()) return '';
  return `<div class="copyBar" data-copy-ui><span>Hold any words to edit, or tap Edit. Save publishes for everyone.</span><button type="button" class="bigBtn alt" data-action="dev-copy-off">HIDE</button></div>`;
}
export function finishRename(ok) {
  closeSheet();
  if (ok) toast('Published for everyone');
}
