/**
 * Shot Simulator sharing: compact URL-hash links (#sim/s=…) and JSON files. Pure (no DOM).
 * Link payload: base64url(JSON {v:1, b:[[id,x,y]…], a:aim, s:speed, t:[vTips,hTips], n:annotations, m:name})
 */
export const SHARE_VERSION = 1;
export const FILE_FORMAT = 'pool-iq-shot';

const r2 = (v) => Math.round(v * 100) / 100;

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === 'function' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** state: {balls:[{id,x,y}], shot:{aim,speed,vTips,hTips}, annotations:[…], name} */
export function encodeState(state) {
  const o = { v: SHARE_VERSION, b: (state.balls || []).map((b) => [b.id === 'cue' ? 0 : b.id, r2(b.x), r2(b.y)]) };
  if (state.shot) {
    o.a = Math.round((state.shot.aim ?? 0) * 1000) / 1000;
    o.s = r2(state.shot.speed ?? 2);
    o.t = [r2(state.shot.vTips ?? 0), r2(state.shot.hTips ?? 0)];
  }
  if (state.annotations && state.annotations.length) o.n = state.annotations.map(compactAnno);
  if (state.name) o.m = String(state.name).slice(0, 60);
  return b64urlEncode(JSON.stringify(o));
}
function compactAnno(a) {
  const o = { k: a.kind, c: a.color, p: (a.points || []).map((p) => [r2(p.x), r2(p.y)]) };
  if (a.text) o.x = String(a.text).slice(0, 40);
  return o;
}

export function decodeState(code) {
  let o;
  try { o = JSON.parse(b64urlDecode(String(code || '').trim())); } catch { throw new Error('That share link is damaged or incomplete.'); }
  if (!o || o.v !== SHARE_VERSION || !Array.isArray(o.b)) throw new Error('That share link is not a Pool IQ shot.');
  const balls = [];
  const seen = new Set();
  for (const e of o.b) {
    if (!Array.isArray(e) || e.length < 3) continue;
    const id = e[0] === 0 || e[0] === 'cue' ? 'cue' : Number(e[0]);
    if (id !== 'cue' && !(id >= 1 && id <= 15)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    balls.push({ id, x: Number(e[1]), y: Number(e[2]) });
  }
  const out = { balls };
  if (o.a != null) out.shot = { aim: Number(o.a) || 0, speed: Number(o.s) || 2, vTips: Number(o.t?.[0]) || 0, hTips: Number(o.t?.[1]) || 0 };
  out.annotations = Array.isArray(o.n) ? o.n.map((a) => ({ kind: a.k, color: a.c, text: a.x || '', points: (a.p || []).map(([x, y]) => ({ x, y })) })) : [];
  if (o.m) out.name = String(o.m);
  return out;
}

export function shareLink(baseUrl, state) {
  const base = String(baseUrl).split('#')[0];
  return `${base}#sim/s=${encodeState(state)}`;
}
/** Pull the code out of a full link or a bare "#sim/s=…" hash */
export function codeFromLink(link) {
  const m = String(link || '').match(/#?sim\/s=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/** JSON file for export (one or many saved shots) */
export function exportFile(shots) {
  return JSON.stringify({ format: FILE_FORMAT, version: 1, exported: new Date().toISOString(), shots }, null, 2);
}
export function importFile(text) {
  let o;
  try { o = JSON.parse(text); } catch { throw new Error('That file is not valid JSON.'); }
  if (!o || o.format !== FILE_FORMAT || !Array.isArray(o.shots)) throw new Error('That file is not a Pool IQ shot export.');
  return o.shots.filter((s) => s && Array.isArray(s.balls));
}
