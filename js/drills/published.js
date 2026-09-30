/**
 * Published drill overrides (v14-26).
 *
 * A phone cannot git-push the static site. SAVE writes one row in Supabase
 * public.drill_overrides. Every visitor reads those rows on load. If a row
 * exists, it replaces the shipped drill. Import and leaving the editor do not
 * write a row.
 *
 * Writes are allowed only for the owner account (RLS on auth email). A Dev
 * Mode passcode on someone else's phone cannot publish.
 */
import { SUPABASE_URL, SUPABASE_KEY } from '../cloud/config.js';
import { getClient, currentUser } from '../cloud/client.js';
import { ownerAccountSignedIn } from '../dev/dev.js';
import { validatePooliq } from '../content/schema.js';

let published = new Map();
let status = 'idle'; // idle | loading | ready | unreachable

export function publishedStatus() { return status; }
export function publishedDoc(id) {
  const doc = published.get(id);
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
}
export function publishedSignature() {
  return [...published.entries()]
    .map(([id, doc]) => `${id}\t${doc.title || ''}\t${doc.metadata?.updated || ''}`)
    .sort()
    .join('\n');
}

function remember(rows) {
  const next = new Map();
  for (const row of rows) {
    if (!row || typeof row.drill_id !== 'string' || !row.doc || typeof row.doc !== 'object') continue;
    let v;
    try { v = validatePooliq(JSON.stringify(row.doc)); } catch { continue; }
    if (!v.ok || !v.doc || v.doc.contentType !== 'drill' || v.doc.id !== row.drill_id) continue;
    next.set(row.drill_id, v.doc);
  }
  published = next;
}

/** Public read. Failure leaves the map unchanged and marks the server unreachable. */
export async function loadPublishedDrills() {
  status = 'loading';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/drill_overrides?select=drill_id,doc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
      signal: ctrl.signal
    });
    if (!res.ok) { status = 'unreachable'; return { error: 'unreachable', status: res.status }; }
    const rows = await res.json();
    if (!Array.isArray(rows)) { status = 'unreachable'; return { error: 'unreachable' }; }
    remember(rows);
    status = 'ready';
    return { ok: true, count: published.size };
  } catch {
    status = 'unreachable';
    return { error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Publish one drill for every visitor. Does not write the row if the account
 * is not the owner, or if the server cannot be reached. Callers must not
 * fall back to a phone-only save.
 */
export async function publishDrill(id, doc) {
  if (!ownerAccountSignedIn()) return { error: 'Sign in as the owner account to publish this drill. Nothing was changed.' };
  const user = currentUser();
  if (!user?.id) return { error: 'Sign in as the owner account to publish this drill. Nothing was changed.' };
  let copy;
  try { copy = JSON.parse(JSON.stringify(doc)); } catch { return { error: 'Nothing to save' }; }
  copy.id = id;
  copy.format = 'pooliq';
  copy.contentType = 'drill';
  let v;
  try { v = validatePooliq(JSON.stringify(copy)); } catch { return { error: 'Nothing to save' }; }
  if (!v.ok) return { error: v.errors.slice(0, 4).join('\n') };
  if (v.doc.id !== id) return { error: 'The drill id cannot change' };
  try {
    const c = await getClient();
    const { error } = await c.from('drill_overrides').upsert(
      { drill_id: id, doc: v.doc, updated_by: user.id },
      { onConflict: 'drill_id' }
    );
    if (error) {
      const msg = String(error.message || error.code || '');
      if (/row-level|permission|42501|401|403/i.test(msg)) return { error: 'Only the owner account can publish. Nothing was changed.' };
      return { error: 'Could not publish. The live drill was not changed.' };
    }
  } catch {
    return { error: 'Could not reach the server. Nothing was published, and the live drill was not changed.' };
  }
  published.set(id, v.doc);
  status = 'ready';
  return { ok: true, doc: JSON.parse(JSON.stringify(v.doc)) };
}
