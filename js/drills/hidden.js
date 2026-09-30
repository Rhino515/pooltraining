/**
 * Built-in drills Andrew hides from everyone (v14-29).
 *
 * A row in public.drill_hidden is a drill id. Every visitor reads the list.
 * Only the owner account can insert or delete a row (RLS). The shipped file
 * stays in git. A custom drill is not a row here; it is removed on this phone.
 */
import { SUPABASE_URL, SUPABASE_KEY } from '../cloud/config.js';
import { getClient, currentUser } from '../cloud/client.js';
import { ownerAccountSignedIn } from '../dev/dev.js';

let hidden = new Set();
let status = 'idle';

export function hiddenStatus() { return status; }
export function isDrillHidden(id) { return hidden.has(id); }
export function hiddenSignature() { return [...hidden].sort().join('\n'); }

function remember(rows) {
  const next = new Set();
  for (const row of rows || []) {
    if (row && typeof row.drill_id === 'string' && row.drill_id) next.add(row.drill_id);
  }
  hidden = next;
}

export async function loadHiddenDrills() {
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
    remember(rows);
    status = 'ready';
    return { ok: true, count: hidden.size };
  } catch {
    status = 'unreachable';
    return { error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/** Hide one built-in drill for every visitor. Does not write if this is not the owner account. */
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
  status = 'ready';
  return { ok: true, id: drillId };
}
