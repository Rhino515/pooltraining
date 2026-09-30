/**
 * Local renames for on-screen words (page titles, nav labels, buttons, other visible copy).
 * Shipped files do not change. A different signed-in account does not see these renames.
 */
import { dataWritten } from '../storage.js';
import { currentUser } from '../cloud/client.js';
import { isUnlocked, isOwnerEmail } from './dev.js';
import { openSheet, closeSheet, toast } from '../ui/sheet.js';

export const COPY_KEY = 'poolIQDevCopyV1';
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);
let editing = false;
let skipClick = false;

export function loadCopy() {
  try {
    const o = JSON.parse(ls()?.getItem(COPY_KEY) || 'null');
    if (o && typeof o.items === 'object' && o.items) return { schema: 1, items: o.items };
  } catch { /* fall through */ }
  return { schema: 1, items: {} };
}
export function saveCopy(o) {
  try {
    ls()?.setItem(COPY_KEY, JSON.stringify({ schema: 1, items: o.items || {} }));
    dataWritten(COPY_KEY);
  } catch { /* quota */ }
  return o;
}
export function copyCount() { return Object.keys(loadCopy().items).length; }
export function copyEditing() { return editing; }
export function setCopyEditing(on) { editing = !!on; return editing; }

function signedInEmail() {
  return String(currentUser()?.email || '').trim().toLowerCase();
}
/** Another account is signed in — hide and refuse word renames. */
export function otherAccountSignedIn() {
  const email = signedInEmail();
  return !!email && !isOwnerEmail(email);
}
/**
 * Apply saved words for the owner account, or on this phone while Dev Mode is unlocked and nobody else is signed in.
 * A friend's signed-in session always sees the shipped words.
 */
export function copyApplies() {
  if (otherAccountSignedIn()) return false;
  if (isOwnerEmail(signedInEmail())) return true;
  return isUnlocked();
}
export function copyWritable() {
  return isUnlocked() && !otherAccountSignedIn();
}

function shippedText(node) {
  if (node.__shipped == null) node.__shipped = node.textContent;
  return node.__shipped;
}
function routeOf(el) {
  if (el.closest('nav')) return 'nav';
  if (el.closest('header')) return 'header';
  const h = (typeof location !== 'undefined' ? location.hash : '') || '#home';
  return (h.replace(/^#/, '').split('/')[0] || 'home');
}
/** Stable key from the shipped words, so a rename still matches after the next render. */
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
  return `${routeOf(el)}|${bits.join('<')}|${shipped}`.slice(0, 240);
}

function looksLikeWords(s) {
  const t = String(s || '').trim();
  return t.length > 0 && t.length <= 240 && /[A-Za-z]/.test(t);
}

/** Replace shipped words inside root. Text nodes only — never HTML. */
export function applyCopy(root) {
  if (!root) return;
  const allow = copyApplies();
  const items = allow ? loadCopy().items : {};
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea,input,noscript,[data-copy-ui]')) continue;
    const raw = shippedText(node);
    const trimmed = raw.trim();
    if (!looksLikeWords(trimmed)) continue;
    const key = copyKey(node, trimmed);
    if (!key) continue;
    parent.setAttribute('data-copy-key', key);
    const next = allow ? items[key]?.text : null;
    if (typeof next === 'string') {
      const padL = raw.match(/^\s*/)?.[0] || '';
      const padR = raw.match(/\s*$/)?.[0] || '';
      node.textContent = padL + next + padR;
    } else if (node.textContent !== raw) node.textContent = raw;
  }
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

function openRename(node) {
  const raw = shippedText(node);
  const trimmed = raw.trim();
  const key = copyKey(node, trimmed);
  const cur = loadCopy().items[key]?.text ?? node.textContent.trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  openSheet(`<div data-copy-ui><div class="eyebrow">RENAME</div><h2 class="sheetTitle">On-screen words</h2><p class="muted small">Saved on this phone only. A different signed-in account still sees the original.</p><label class="fld"><span>Words</span><textarea id="copyText" rows="3" maxlength="240">${esc(cur)}</textarea></label><button type="button" class="bigBtn" data-action="dev-copy-save" data-key="${esc(key)}">SAVE WORDS</button><button type="button" class="bigBtn alt" data-action="dev-copy-clear" data-key="${esc(key)}">USE ORIGINAL</button><button type="button" class="bigBtn alt" data-action="sheet-close">CANCEL</button></div>`, { id: 'copy-rename' });
}

export function onCopyPointerDown(e) {
  if (!editing || !copyWritable()) return;
  if (e.target?.closest?.('input,textarea,select,[data-copy-ui],.sheetWrap')) return;
  const node = textFromEvent(e);
  if (!node) return;
  const start = { x: e.clientX, y: e.clientY, node };
  const timer = setTimeout(() => {
    hold = null;
    skipClick = true;
    openRename(start.node);
  }, 550);
  hold = { timer, ...start };
}
let hold = null;
export function onCopyPointerMove(e) {
  if (!hold) return;
  if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 14) {
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

export function saveCopyText(key, text) {
  if (!copyWritable()) return { error: 'DEV MODE is locked' };
  const t = String(text ?? '').trim().slice(0, 240);
  if (!t) return { error: 'Words cannot be empty' };
  if (/[<>]/.test(t)) return { error: 'Plain words only' };
  const o = loadCopy();
  o.items[key] = { text: t, at: Date.now() };
  saveCopy(o);
  return { ok: true };
}
export function clearCopyKey(key) {
  if (!copyWritable()) return { error: 'DEV MODE is locked' };
  const o = loadCopy();
  delete o.items[key];
  saveCopy(o);
  return { ok: true };
}
export function resetAllCopy() {
  if (!copyWritable()) return { error: 'DEV MODE is locked' };
  saveCopy({ schema: 1, items: {} });
  return { ok: true };
}

export function copyBarHTML() {
  if (!editing || !copyWritable()) return '';
  return `<div class="copyBar" data-copy-ui><span>Hold any words to rename</span><button type="button" class="bigBtn alt" data-action="dev-copy-off">DONE</button></div>`;
}
export function finishRename(ok) {
  closeSheet();
  if (ok) toast('Words saved on this phone');
}
