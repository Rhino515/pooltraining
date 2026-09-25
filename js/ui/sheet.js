/** Bottom sheet + toast helpers (single shared sheet element). */
export function openSheet(html, { id = 'sheet', dismissable = true, cls = '' } = {}) {
  let el = document.getElementById('sheet');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sheet';
    document.body.appendChild(el);
  }
  el.className = `sheetWrap show ${cls}`;
  el.dataset.kind = id;
  el.dataset.dismissable = dismissable ? '1' : '0';
  el.innerHTML = `<div class="sheetBackdrop" ${dismissable ? 'data-action="sheet-close"' : ''}></div><div class="sheet card" role="dialog" aria-modal="true">${dismissable ? '<button type="button" class="sheetClose" data-action="sheet-close" aria-label="Close">×</button>' : ''}<div class="sheetGrab"></div>${html}</div>`;
  return el;
}

export function closeSheet() {
  const el = document.getElementById('sheet');
  if (el) {
    el.className = 'sheetWrap';
    el.innerHTML = '';
    el.dataset.kind = '';
  }
}

export function sheetKind() {
  const el = document.getElementById('sheet');
  return el && el.classList.contains('show') ? el.dataset.kind : null;
}

let toastTimer = null;
export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast'), 2200);
}

export const stars = (n, max = 3) => `<span class="stars" data-stars="${n}">${'★'.repeat(n)}<i>${'★'.repeat(Math.max(0, max - n))}</i></span>`;
