/**
 * DEV MODE (Settings → DEV MODE). A CONVENIENCE LOCK ON THIS DEVICE — NOT SERVER SECURITY: anyone with the phone
 * and browser dev tools can read or change local data. It only keeps test tools out of everyday use.
 *
 *   • no passcode. The signed-in owner account (andrewaphay@gmail.com) is already the dev.
 *     Any other account, and signed-out use, stays locked. There is no unlock step.
 *   • content overrides (js/dev/overrides.js), exported/re-imported as a .pooliq pack (stage ids ov--<game>--<stage>)
 *   • seeded test progression (flagged state.devSeed, excluded from public stats) and "restore my real progress"
 * Every dev action takes a vault snapshot first (done by app.js / ui/dev.js).
 */
import { dataWritten } from '../storage.js';
import { RANK_LADDER, DRILL_RANK, SKILLS, PROGRESSION_VERSION } from '../progression/config.js';
import { ensureProg, rankTotal, CHAMPION_INDEX } from '../progression/award.js';
import { GATES } from '../progression/config.js';
import { loadOverrides, saveOverrides, parseOverrideId, stageOverrideId, isEditableSpec } from './overrides.js';
import { FORMAT, SCHEMA_VERSION, validatePooliq } from '../content/schema.js';
import { docFromChallenge } from '../content/convert.js';
import { currentUser } from '../cloud/client.js';

export const DEV_KEY = 'poolIQDevV1';
export const MIN_PASSCODE = 4;
export const AUTO_LOCK_OPTIONS = [0, 5, 15, 60]; // minutes idle; 0 = only when the app is closed / LOCK
const ls = () => (typeof localStorage !== 'undefined' ? localStorage : null);

export function loadDev() {
  try {
    const d = JSON.parse(ls()?.getItem(DEV_KEY) || 'null');
    if (d && typeof d === 'object') return { schema: 1, autoLockMin: 15, seeded: null, ...d };
  } catch { /* fall through */ }
  return { schema: 1, salt: null, hash: null, createdAt: null, autoLockMin: 15, seeded: null };
}
export function saveDev(d) {
  try { ls()?.setItem(DEV_KEY, JSON.stringify({ ...d, schema: 1 })); dataWritten(DEV_KEY); } catch { /* quota */ }
  return d;
}
export const hasPasscode = () => { const d = loadDev(); return !!(d.hash && d.salt); };

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
function subtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('This browser cannot hash the passcode (needs a secure https page)');
  return c;
}
export async function hashPasscode(code, salt) {
  const data = new TextEncoder().encode(`pool-iq-dev:${salt}:${code}`);
  return hex(await subtle().subtle.digest('SHA-256', data));
}
export function newSalt() {
  const b = new Uint8Array(16);
  subtle().getRandomValues(b);
  return hex(b);
}
// constant-time-ish compare (it is a local lock, but no reason to be sloppy)
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && [...a].reduce((x, ch, i) => x | (ch.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

// ------------------------------------------------------------------ session (memory only)
const session = { unlocked: false, last: 0 };
export async function setPasscode() {
  return { error: 'Dev Mode does not use a passcode. Sign in as the owner account.' };
}
export async function unlock() {
  return { error: 'Dev Mode does not use a passcode. Sign in as the owner account.' };
}
export function lock() { session.unlocked = false; session.last = 0; }
/** The owner account is the dev. Any other address is not. */
export function isOwnerEmail(email) {
  return String(email || '').trim().toLowerCase() === 'andrewaphay@gmail.com';
}
export function ownerAccountSignedIn() {
  return isOwnerEmail(currentUser()?.email);
}
/** True only while the owner account is signed in. A passcode cannot unlock this. */
export function isUnlocked() {
  return ownerAccountSignedIn();
}
/** Activity keeps the auto-lock timer fresh */
export function touch(now = Date.now()) { if (isUnlocked(now)) session.last = now; }
export function setAutoLock(min) {
  const m = AUTO_LOCK_OPTIONS.includes(Number(min)) ? Number(min) : 15;
  saveDev({ ...loadDev(), autoLockMin: m });
  return m;
}

// ------------------------------------------------------------------ seeded test progression
/** Pure: a copy of state jumped to Career rank r / ball b (and optionally Drill Rank n), flagged DEV */
export function seedProgression(state, { rank = null, ball = 1, drillRank = null, now = Date.now() } = {}) {
  const s = JSON.parse(JSON.stringify(state));
  const prog = ensureProg(s);
  prog.v = PROGRESSION_VERSION;
  const parts = [];
  if (rank != null) {
    const r = Math.max(0, Math.min(RANK_LADDER.names.length - 1, Math.round(rank)));
    const balls = RANK_LADDER.balls[r] || 0;
    const b = r >= CHAMPION_INDEX ? 0 : Math.max(1, Math.min(balls, Math.round(ball) || 1));
    s.rankIndex = r;
    s.rankFloor = r;
    s.bosses = Object.fromEntries(Object.entries(s.bosses || {}).filter(([id]) => { const n = Number(String(id).replace(/\D/g, '')); return !n || n <= r; }));
    prog.rankXpBy = {};
    let life = 0;
    for (let k = 0; k < r && k < CHAMPION_INDEX; k++) { prog.rankXpBy[k] = rankTotal(k); life += rankTotal(k); }
    if (r < CHAMPION_INDEX) { prog.rankXpBy[r] = (b - 1) * RANK_LADDER.ballXp[r]; life += prog.rankXpBy[r]; }
    prog.carry = 0;
    prog.rankSeen = r;
    prog.gatesCleared = {};
    for (const g of GATES) if (g.rank < r || (g.rank === r && g.ball < b)) prog.gatesCleared[g.id] = now;
    prog.lifetimeXp = Math.max(prog.lifetimeXp || 0, life);
    prog.championAt = r >= CHAMPION_INDEX ? now : null;
    parts.push(r >= CHAMPION_INDEX ? `${RANK_LADDER.names[r]} (max)` : `${RANK_LADDER.names[r]} · ${b}-Ball`);
  }
  if (drillRank != null) {
    const n = Math.max(1, Math.min(DRILL_RANK.ranks.length, Math.round(drillRank)));
    const req = DRILL_RANK.ranks[n - 1];
    for (const k of Object.keys(prog.items)) if (k.startsWith('drill:dev-seed-')) delete prog.items[k];
    const total = req.passed;
    const cats = SKILLS.map((x) => x.id);
    for (let i = 0; i < total; i++) {
      const stars = i < req.mastered ? 3 : i < req.strong ? 2 : 1;
      const key = `drill:dev-seed-${i + 1}`;
      const primary = cats[i % Math.max(1, req.categories || 1)];
      prog.items[key] = { key, name: `DEV seed drill ${i + 1}`, src: 'drill', tier: 'intermediate', w: { [primary]: 1 }, primary, mode: 'success', m: { strong: 0.85, mastered: 0.95 }, cat: null, dr: true, attempts: 1, passes: 1, best: stars === 3 ? 1 : stars === 2 ? 0.9 : 0.7, bestPassed: stars === 3 ? 1 : stars === 2 ? 0.9 : 0.7, bestScore: 0, recent: [], stars, firstClearAt: now, lastAt: now, pbAt: null, day: null, dayN: 0, dev: true };
    }
    prog.drillXp = req.xp;
    parts.push(`Drill Rank ${n} ${req.name}`);
  }
  prog.dev = true;
  s.prog = prog;
  s.devSeed = { at: now, label: parts.join(' + ') || 'DEV test state' };
  return s;
}

// ------------------------------------------------------------------ overrides ⇄ .pooliq pack
const OV_STAGE_RE = /^ov--([a-z0-9_]+)--([A-Za-z0-9._-]+)$/;
export const packStageId = (gameId, stageId) => `ov--${gameId}--${stageId}`.slice(0, 64);
/** All overrides as one .pooliq training pack (stage ids ov--<game>--<stage>) */
export function exportOverridesPack(now = Date.now()) {
  const items = Object.values(loadOverrides().items);
  if (!items.length) return { error: 'No overrides to export yet' };
  const stages = [];
  for (const rec of items) {
    const p = parseOverrideId(rec.id);
    if (!p || !rec.doc?.shot) continue;
    const d = rec.doc;
    const st = { id: packStageId(p.gameId, p.stageId), title: String(d.title || p.stageId).slice(0, 80), stageType: 'practice', contentType: 'drill' };
    for (const k of ['description', 'category', 'difficulty', 'skill']) if (d[k] !== undefined) st[k] = d[k];
    st.shot = d.shot;
    st.scoringRules = d.scoringRules || { mode: 'success', attempts: 10, pass: { made: 7 } };
    stages.push(st);
  }
  const doc = { format: FORMAT, schemaVersion: SCHEMA_VERSION, contentType: 'pack', id: `pool-iq-dev-overrides-${new Date(now).toISOString().slice(0, 10)}`, contentVersion: '1.0', title: 'Pool IQ DEV overrides', description: 'Built-in stage edits made in DEV MODE. Re-import from Settings → DEV MODE → Import overrides to apply them on another device.', category: 'Dev', metadata: { generator: 'Pool IQ DEV MODE', created: new Date(now).toISOString() }, unlockMode: 'open', stages };
  const v = validatePooliq(JSON.stringify(doc));
  if (!v.ok) return { error: v.errors.slice(0, 3).join(' · ') };
  return { doc: v.doc, count: stages.length };
}
/** Re-import an overrides pack: every ov--<game>--<stage> drill stage becomes an override again */
export function importOverridesPack(text, { stageExists = () => true, now = Date.now() } = {}) {
  const v = validatePooliq(text);
  if (!v.ok) return { error: v.errors.slice(0, 3).join(' · ') || 'Not a valid .pooliq file' };
  const d = v.doc;
  if (d.contentType !== 'pack') return { error: 'Pick an overrides pack (.pooliq training pack exported from DEV MODE)' };
  const o = loadOverrides();
  let applied = 0;
  const skipped = [];
  for (const st of d.stages) {
    const m = OV_STAGE_RE.exec(st.id);
    if (!m || st.contentType !== 'drill' || !stageExists(m[1], m[2])) { skipped.push(st.id); continue; }
    const id = stageOverrideId(m[1], m[2]);
    const doc = { format: FORMAT, schemaVersion: SCHEMA_VERSION, contentType: 'drill', id: `ov-${m[1]}-${m[2]}`.slice(0, 64), contentVersion: '1.0', title: st.title };
    for (const k of ['description', 'category', 'difficulty', 'skill']) if (st[k] !== undefined) doc[k] = st[k];
    doc.shot = st.shot;
    doc.scoringRules = st.scoringRules;
    o.items[id] = { id, doc, updatedAt: now, createdAt: o.items[id]?.createdAt || now, imported: true };
    applied++;
  }
  saveOverrides(o);
  return { applied, skipped };
}
/** The .pooliq drill doc the builder edits for a built-in stage (current override or the original) */
export function editDocForStage(ch, override = null) {
  if (override?.doc) return JSON.parse(JSON.stringify(override.doc));
  const doc = docFromChallenge(ch, { id: `ov-${ch.game}-${ch.id}`, title: ch.name, metadata: { generator: 'Pool IQ DEV MODE' } });
  // game-specific scoring (lives, kick, sniper…) is kept by the override layer; give the builder a valid stand-in
  const sr = doc.scoringRules;
  const pass = Object.fromEntries(Object.entries(sr.pass || {}).filter(([k, v]) => ['made', 'stars', 'pockets'].includes(k) && Number.isInteger(v)));
  if (!Object.keys(pass).length) pass[sr.mode === 'zone' || sr.mode === 'stars' ? 'stars' : 'made'] = Math.max(1, Math.ceil((sr.attempts || 10) * 0.7));
  doc.scoringRules = { ...sr, pass };
  return doc;
}
export { isEditableSpec };

// ------------------------------------------------------------------ mark imported content official / eligible (testing)
export function markContentDoc(doc, { careerEligible, rankXpEligible, official }) {
  const d = JSON.parse(JSON.stringify(doc));
  if (careerEligible !== undefined) { if (careerEligible) d.careerEligible = true; else delete d.careerEligible; }
  if (rankXpEligible !== undefined) { if (rankXpEligible) d.rankXpEligible = true; else delete d.rankXpEligible; }
  if (official !== undefined) { d.metadata = { ...(d.metadata || {}) }; if (official) d.metadata.official = true; else delete d.metadata.official; }
  return d;
}

// ------------------------------------------------------------------ storage viewer
export function storageKeys(kv = ls()) {
  const out = [];
  if (!kv) return out;
  for (let i = 0; i < kv.length; i++) {
    const k = kv.key(i);
    if (!k) continue;
    const v = kv.getItem(k) || '';
    out.push({ key: k, bytes: v.length * 2, preview: v.slice(0, 160) });
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}
