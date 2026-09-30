/**
 * Built-in drills Andrew deletes for everyone (v14-34).
 *
 * A row in public.drill_hidden is a drill id. Every visitor reads the list.
 * Only the owner account can insert or delete a row (RLS). The shipped file
 * stays in git. A deleted id is absent from every list, category, search,
 * and play entry. There is no "hidden" row.
 *
 * Ids already known (this session, or the phone copy of the last good read)
 * stay deleted when the list cannot be loaded. A failed read never clears them.
 */
import { SUPABASE_URL, SUPABASE_KEY } from '../cloud/config.js';
import { getClient, currentUser } from '../cloud/client.js';
import { ownerAccountSignedIn } from '../dev/dev.js';
import { lsSet } from '../storage.js';

export const HIDDEN_KEY = 'poolIQDrillHiddenV1';

let hidden = readStored();
let status = 'idle';
let epoch = 0;

export function hiddenStatus() { return status; }
export function isDrillHidden(id) { return hidden.has(id); }
export function hiddenSignature() { return [...hidden].sort().join('\n'); }

function readStored() {
  try {
    const o = JSON.parse(localStorage.getItem(HIDDEN_KEY) || 'null');
    const ids = o && Array.isArray(o.ids) ? o.ids : [];
    return new Set(ids.filter((id) => typeof id === 'string' && id));
  } catch {
    return new Set();
  }
}

function persist() {
  lsSet(HIDDEN_KEY, JSON.stringify({ ids: [...hidden] }));
}

function idsFrom(rows) {
  const next = new Set();
  for (const row of rows || []) {
    if (row && typeof row.drill_id === 'string' && row.drill_id) next.add(row.drill_id);
  }
  return next;
}

export async function loadHiddenDrills() {
  const seen = epoch;
  status = 'loading';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/drill_hidden?select=drill_id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
      signal: ctrl.signal
    });
    if (!res.ok) { status = 'unreachable'; return { error: 'unreachable', status: res.status }; }
    const rows = await res.json();
    if (!Array.isArray(rows)) { status = 'unreachable'; return { error: 'unreachable' }; }
    const next = idsFrom(rows);
    if (seen !== epoch) {
      // A delete landed while this read was in flight. Do not drop that id.
      for (const id of next) hidden.add(id);
    } else {
      hidden = next;
    }
    persist();
    status = 'ready';
    return { ok: true, count: hidden.size };
  } catch {
    // Keep every id already known. A failed read must not put a deleted drill back.
    status = 'unreachable';
    return { error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/** Delete one built-in drill for every visitor. Does not write if this is not the owner account. */
export async function hideDrill(id) {
  const drillId = String(id || '').slice(0, 80);
  if (!drillId) return { error: 'Nothing to delete' };
  if (!ownerAccountSignedIn()) return { error: 'Sign in as the owner account to delete this drill. Nothing was changed.' };
  const user = currentUser();
  if (!user?.id) return { error: 'Sign in as the owner account to delete this drill. Nothing was changed.' };
  try {
    const c = await getClient();
    const { error } = await c.from('drill_hidden').upsert(
      { drill_id: drillId, updated_by: user.id },
      { onConflict: 'drill_id' }
    );
    if (error) {
      const msg = String(error.message || error.code || '');
      if (/row-level|permission|42501|401|403|PGRST/i.test(msg)) return { error: 'Only the owner account can delete. Nothing was changed.' };
      return { error: 'Could not publish the delete. The drill is still visible.' };
    }
  } catch {
    return { error: 'Could not reach the server. Nothing was deleted.' };
  }
  hidden.add(drillId);
  epoch += 1;
  status = 'ready';
  persist();
  return { ok: true, id: drillId };
}
