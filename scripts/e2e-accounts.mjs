/**
 * Pool IQ v13 online accounts — end-to-end checks with the Supabase network MOCKED (request interception), so the
 * run never depends on the live project. Imported by scripts/e2e.mjs; also runnable alone:
 *   node scripts/e2e-accounts.mjs [baseUrl] [--shots <dir>]
 *
 * The mock speaks the small slice of the Supabase HTTP API that supabase-js uses here: GoTrue (signup, password
 * token, refresh, user, logout, recover), PostgREST (select / upsert / update with eq filters and row ownership like
 * the real RLS policies) and Storage (avatars upload / public read / remove).
 */
import fs from 'fs';
import path from 'path';

const HOST = 'nqfwlpfyccbqetcyjijf.supabase.co';
const ORIGIN = `https://${HOST}`;
const SITE_URL = 'https://rhino515.github.io/pooltraining/';
const b64u = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

export function createMock() {
  let clock = Date.parse('2026-09-01T12:00:00Z');
  const now = () => new Date((clock += 1000)).toISOString();
  const db = { users: new Map(), tokens: new Map(), profiles: new Map(), saves: new Map(), public_stats: new Map(), objects: new Map() };
  const log = [];
  const uid = () => 'u-' + Math.random().toString(16).slice(2, 10) + '-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padEnd(12, '0');
  function session(u) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const access = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp, iat: exp - 3600, session_id: 's-' + u.id })}.${b64u('mock-signature')}`;
    const refresh = 'r-' + Math.random().toString(36).slice(2);
    db.tokens.set(access, u.id);
    db.tokens.set(refresh, u.id);
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: refresh, user: userJSON(u) };
  }
  const userJSON = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: u.created_at, confirmed_at: u.created_at, created_at: u.created_at, updated_at: u.created_at, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [] });
  function addUser(email, password) {
    const u = { id: uid(), email, password, created_at: now() };
    db.users.set(u.id, u);
    return u;
  }
  const byEmail = (e) => [...db.users.values()].find((u) => u.email === String(e).toLowerCase());
  const OWNER = { profiles: 'id', saves: 'user_id', public_stats: 'user_id' };
  const READ_ALL = { profiles: true, public_stats: true, saves: false };

  function handle(req, rawBody = null) {
    const url = new URL(req.url());
    const method = req.method();
    const h = req.headers();
    const auth = (h.authorization || '').replace(/^Bearer /, '');
    const me = db.tokens.get(auth) || null;
    let body = null;
    try { body = req.postData() ? JSON.parse(req.postData()) : null; } catch { body = null; }
    const p = url.pathname;
    if (method !== 'OPTIONS') log.push({ method, path: p, search: url.search, me, body });
    const json = (status, obj, extra = {}) => ({ status, contentType: 'application/json', body: obj === undefined ? '' : JSON.stringify(obj), headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': '*', ...extra } });
    if (method === 'OPTIONS') return { status: 200, body: '', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' } };
    // ------------------------------------------------ auth
    if (p === '/auth/v1/signup' && method === 'POST') {
      if (!body?.email || String(body.password || '').length < 6) return json(422, { code: 'weak_password', msg: 'Password should be at least 6 characters.' });
      if (byEmail(body.email)) return json(422, { code: 'user_already_exists', msg: 'User already registered' });
      return json(200, session(addUser(String(body.email).toLowerCase(), body.password)));
    }
    if (p === '/auth/v1/token' && method === 'POST') {
      const gt = url.searchParams.get('grant_type');
      if (gt === 'password') {
        const u = byEmail(body?.email);
        if (!u || u.password !== body?.password) return json(400, { code: 'invalid_credentials', error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' });
        return json(200, session(u));
      }
      if (gt === 'refresh_token') {
        const id = db.tokens.get(body?.refresh_token);
        return id ? json(200, session(db.users.get(id))) : json(400, { code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' });
      }
    }
    if (p === '/auth/v1/user' && method === 'GET') return me ? json(200, userJSON(db.users.get(me))) : json(401, { code: 'bad_jwt', msg: 'invalid JWT' });
    if (p === '/auth/v1/user' && method === 'PUT') {
      if (!me) return json(401, { code: 'bad_jwt', msg: 'invalid JWT' });
      const u = db.users.get(me);
      if (body?.password) u.password = body.password;
      return json(200, userJSON(u));
    }
    if (p === '/auth/v1/logout') return { status: 204, body: '', headers: { 'access-control-allow-origin': '*' } };
    if (p === '/auth/v1/recover') return json(200, {});
    // ------------------------------------------------ storage
    const pub = /^\/storage\/v1\/object\/public\/avatars\/(.+)$/.exec(p);
    if (pub && method === 'GET') {
      const o = db.objects.get(decodeURIComponent(pub[1]));
      return o ? { status: 200, contentType: o.type, body: o.bytes, headers: { 'access-control-allow-origin': '*' } } : json(400, { error: 'not_found', message: 'Object not found' });
    }
    const obj = /^\/storage\/v1\/object\/avatars\/(.+)$/.exec(p);
    if (obj && (method === 'POST' || method === 'PUT')) {
      const key = decodeURIComponent(obj[1]);
      if (!me || key.split('/')[0] !== me) return json(403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
      // puppeteer does not expose binary request bodies; store a valid tiny PNG so the photo renders
      const raw = rawBody || req.postData() || '';
      const prev = db.objects.get(key);
      db.objects.set(key, raw.length > 60 ? { type: h['content-type'] || 'image/png', bytes: Buffer.from(raw, 'latin1') } : prev || { type: 'image/png', bytes: TINY_PNG });
      return json(200, { Key: `avatars/${key}`, Id: key });
    }
    if (p === '/storage/v1/object/avatars' && method === 'DELETE') {
      const out = [];
      for (const k of body?.prefixes || []) if (me && k.split('/')[0] === me && db.objects.delete(k)) out.push({ name: k });
      return json(200, out);
    }
    // ------------------------------------------------ rest (RLS-like ownership)
    const rest = /^\/rest\/v1\/(profiles|saves|public_stats)$/.exec(p);
    if (rest) {
      const t = rest[1];
      const own = OWNER[t];
      if (!me) return json(401, { code: '42501', message: 'permission denied' });
      const filters = [...url.searchParams.entries()].filter(([k]) => !['select', 'limit', 'order', 'on_conflict', 'columns'].includes(k)).map(([k, v]) => [k, v.replace(/^eq\./, '')]);
      const visible = [...db[t].values()].filter((r) => READ_ALL[t] || r[own] === me);
      const match = (r) => filters.every(([k, v]) => String(r[k]) === v);
      const wantsObj = /vnd\.pgrst\.object/.test(h.accept || '');
      const out = (rows) => (wantsObj ? (rows.length === 1 ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })) : json(200, rows));
      if (method === 'GET') return out(visible.filter(match));
      if (method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        for (const r of rows) {
          if ((r[own] ?? me) !== me) return json(403, { code: '42501', message: `new row violates row-level security policy for table "${t}"` });
          if (t === 'saves' && r.data?.format !== 'pool-iq-backup') return json(400, { code: '23514', message: 'violates check constraint "saves_backup_format"' });
        }
        const saved = rows.map((r) => { const next = { ...(db[t].get(me) || {}), ...r, [own]: me, updated_at: now() }; db[t].set(me, next); return next; });
        return out(saved);
      }
      if (method === 'PATCH') {
        const rows = [...db[t].values()].filter((r) => r[own] === me && match(r));
        for (const r of rows) Object.assign(r, body, { updated_at: now() });
        return out(rows);
      }
    }
    return json(404, { message: `mock: no route for ${method} ${p}` });
  }
  return { db, log, handle, addUser, session, now, userJSON, TINY_PNG };
}

/** Seed the friends already in the project (their photos live in the mock avatars bucket) */
export function seedFriends(mock) {
  const mkF = (email, name, stats, photo) => {
    const u = mock.addUser(email, 'friendpass');
    const avatar = photo ? `${ORIGIN}/storage/v1/object/public/avatars/${u.id}/avatar?v=1` : null;
    if (photo) mock.db.objects.set(`${u.id}/avatar`, { type: 'image/png', bytes: TINY_PNG });
    mock.db.profiles.set(u.id, { id: u.id, display_name: name, avatar_url: avatar, updated_at: mock.now() });
    mock.db.public_stats.set(u.id, { user_id: u.id, display_name: name, avatar_url: avatar, champion: false, ball: 1, rank_title: null, drill_xp: 0, stars: 0, ghost_matches: 0, ghost_wins: 0, pvp_wins: null, pvp_losses: null, stats: { skills: {}, mastery: { passed: 0, strong: 0, mastered: 0 } }, updated_at: mock.now(), ...stats });
    return u;
  };
  return {
    maya: mkF('maya@example.com', 'Maya', { rank_index: 3, rank_name: 'Contender', ball: 4, rank_title: 'Contender · 4-ball', lifetime_xp: 900, drill_rank: 1, drill_rank_name: 'Chalk Rookie', drill_xp: 40, stars: 30 }, true),
    leo: mkF('leo@example.com', 'Leo', { rank_index: 1, rank_name: 'Apprentice', ball: 2, rank_title: 'Apprentice · 2-ball', lifetime_xp: 50000, drill_rank: 2, drill_rank_name: 'Pattern Player', drill_xp: 300, stars: 12, pvp_wins: 5, pvp_losses: 2 }, false),
    sam: mkF('sam@example.com', 'Sam', { rank_index: 2, rank_name: 'Shooter', ball: 1, lifetime_xp: 100, drill_rank: 5, drill_rank_name: 'Drill Sergeant', drill_xp: 2000, stars: 3, avatar_url: 'https://evil.example/track.png' }, false)
  };
}

export async function runAccounts({ browser, page, BASE, check, sleep, shot, errors }) {
  const mock = createMock();
  const friends = seedFriends(mock);
  const V390 = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  const expected4xx = []; // mock replies the tests ask for on purpose (wrong password …) — Chrome logs them as console errors
  const attach = async (pg) => {
    await pg.setRequestInterception(true);
    pg.on('request', async (req) => {
      try {
        if (req.isInterceptResolutionHandled()) return;
        if (new URL(req.url()).host !== HOST) { await req.continue(); return; }
        await req.respond(mock.handle(req));
      } catch { /* interception already turned off */ }
    });
  };
  const detach = async (pg) => { await pg.setRequestInterception(false); };
  const errBefore = errors.length;
  await page.setViewport(V390);
  await attach(page);
  const go = async (h, pg = page) => { await pg.evaluate((x) => { location.hash = x; }, h); await sleep(300); };
  const tap = async (sel, pg = page) => { await pg.waitForSelector(sel, { timeout: 5000 }); await pg.$eval(sel, (el) => el.click()); await sleep(150); };
  const exists = async (sel, pg = page) => !!(await pg.$(sel));
  const txt = (sel, pg = page) => pg.$eval(sel, (el) => el.innerText).catch(() => '');
  const ready = (pg = page) => pg.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 10000 });
  const typeInto = async (sel, value, pg = page) => { await pg.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, value); };
  const until = async (fn, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(150); } return false; };
  const cleanShot = async (name, pg = page) => { await pg.evaluate(() => document.getElementById('toast')?.classList.remove('show')); if (pg === page) await shot(name); else if (shot.dir) await pg.screenshot({ path: path.join(shot.dir, `${name}.png`) }); };
  const hits = (re) => mock.log.filter((l) => re.test(`${l.method} ${l.path}`)).length;

  // ---------------------------------------------------------------- signed out: works as before, no library, no requests
  await go('#home');
  const libOut = await page.evaluate(() => ({ lib: !!window.supabase || !!document.querySelector('script[data-supabase-lib]') }));
  check(!libOut.lib && mock.log.length === 0, 'v13 signed out: the account library is not loaded and nothing is sent to Supabase');
  await go('#settings');
  check(await exists('[data-card="cloud"][data-cloud="signed-out"] [data-href="#account"]'), 'v13 Settings: ONLINE ACCOUNT · CLOUD SAVE card offers SIGN IN / CREATE ACCOUNT');
  await go('#friends');
  check(await exists('.lbPromo[data-href="#leaderboard"]'), 'v13 Friends links the Friends Leaderboard');
  await go('#profile');
  check(await exists('.chLinks [data-href="#leaderboard"]') && (await exists('.chLinks [data-href="#account"]')), 'v13 Profile links the leaderboard and the online account');
  await go('#leaderboard');
  await sleep(500);
  check(await exists('[data-lb="signed-out"] [data-href="#account"]'), 'v13 leaderboard signed out: explains it needs an account, SIGN IN button');

  // ---------------------------------------------------------------- sign in screen
  await go('#account');
  await page.waitForFunction(() => !!window.supabase, { timeout: 8000 }).catch(() => {});
  const si = await page.evaluate(() => ({ form: !!document.querySelector('form[data-ac-form="signin"]'), email: document.querySelector('#acEmail')?.getAttribute('autocomplete'), pass: document.querySelector('#acPass')?.getAttribute('autocomplete'), type: document.querySelector('#acPass')?.type, tabs: document.querySelectorAll('.acTabs .chip').length, forgot: !!document.querySelector('[data-href="#account/reset"]'), btnH: document.querySelector('[data-ac-submit]')?.getBoundingClientRect().height || 0, sw: document.documentElement.scrollWidth - innerWidth, lib: !!window.supabase?.createClient }));
  check(si.form && si.email === 'username' && si.pass === 'current-password' && si.type === 'password' && si.tabs === 2 && si.forgot, 'v13 sign-in screen: email + password form (password-manager friendly), SIGN IN / CREATE ACCOUNT tabs, Forgot password');
  check(si.btnH >= 48 && si.sw <= 1, `390×844: sign-in button is big (${Math.round(si.btnH)} px), no sideways scroll`);
  check(si.lib, 'v13: the bundled supabase-js UMD build loads on demand (window.supabase.createClient)');
  const libSrc = await page.evaluate(() => document.querySelector('script[data-supabase-lib]')?.getAttribute('src'));
  check(libSrc === './js/vendor/supabase.js', `v13: library served from the app itself, no CDN (${libSrc})`);
  await cleanShot('v13-01-sign-in');
  await tap('[data-ac-submit]');
  check(/Enter your email/.test(await txt('[data-ac-msg]')), 'v13 sign-in: empty form shows a clear message (nothing sent)');
  await typeInto('#acEmail', 'maya@example.com');
  await typeInto('#acPass', 'wrong-pass');
  expected4xx.push(400);
  await tap('[data-ac-submit]');
  await until(async () => /Wrong email or password/.test(await txt('[data-ac-msg]')));
  check(/Wrong email or password/.test(await txt('[data-ac-msg]')), 'v13 sign-in: wrong password → “Wrong email or password.”');

  // ---------------------------------------------------------------- create account (instant, no email confirmation)
  await tap('[data-action="ac-mode"][data-v="signup"]');
  check(await exists('form[data-ac-form="signup"] #acName') && (await page.$eval('#acPass', (e) => e.getAttribute('autocomplete'))) === 'new-password', 'v13 create account form: display name + email + new password');
  await typeInto('#acName', 'Andrew T');
  await typeInto('#acEmail', 'andrew.test@example.com');
  await typeInto('#acPass', 'cue-ball-9');
  await tap('[data-ac-submit]');
  await until(() => exists('[data-account="signed-in"]'), 8000);
  const me = byEmail(mock, 'andrew.test@example.com');
  check(!!me && (await exists('[data-account="signed-in"]')) && /andrew\.test@example\.com/.test(await txt('[data-ac-email]')), 'v13 create account → signed in immediately (email confirmation off)');
  await until(() => mock.db.saves.has(me.id) && mock.db.public_stats.has(me.id) && mock.db.profiles.has(me.id), 8000);
  const firstSave = mock.db.saves.get(me.id);
  check(firstSave && firstSave.data.format === 'pool-iq-backup' && firstSave.data.keys && firstSave.data.keys.poolIQStateV4 && firstSave.device_label === 'iPhone', 'v13 first sign-in with progress on the phone → first cloud save created (pool-iq-backup format, device iPhone)');
  const prof0 = mock.db.profiles.get(me.id);
  check(prof0 && prof0.display_name === 'Andrew T', `v13 profile row synced with the display name (${prof0?.display_name})`);
  const ps0 = mock.db.public_stats.get(me.id);
  check(ps0 && ps0.rank_name && Number.isFinite(ps0.lifetime_xp) && Number.isFinite(ps0.stars) && ps0.drill_rank_name && ps0.pvp_wins === null && ps0.stats.format === 'pool-iq-public-stats' && !('devSeeded' in ps0.stats), `v13 public stats row: ${ps0?.rank_name} ball ${ps0?.ball}, ${ps0?.lifetime_xp} XP, ${ps0?.stars}★, ${ps0?.drill_rank_name}; friend-match record not shared by default`);
  await cleanShot('v13-02-account');

  // ---------------------------------------------------------------- profile edit syncs (name + photo to avatars bucket)
  await go('#me');
  check(/synced to your online account/.test(await txt('.title p')), 'v13 profile screen says name + photo sync to the account when signed in');
  // a real 256 px photo made the same way the app shrinks camera photos (canvas → JPEG data URL)
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#0a6cff'); gr.addColorStop(1, '#f6c453'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#040a12'; g.beginPath(); g.arc(128, 104, 50, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(128, 250, 92, 80, 0, 0, Math.PI * 2); g.fill();
    window.PoolIQ.profile.updateProfile({ avatar: c.toDataURL('image/jpeg', 0.82) });
  });
  await typeInto('#meName', 'Andrew');
  await tap('[data-action="me-save"]');
  await until(() => mock.db.profiles.get(me.id)?.display_name === 'Andrew' && !!mock.db.profiles.get(me.id)?.avatar_url, 8000);
  const prof1 = mock.db.profiles.get(me.id);
  // puppeteer can't read binary request bodies: give the mock bucket the exact photo the app uploaded
  const photo = await page.evaluate(() => window.PoolIQ.profile.getProfile().avatar);
  mock.db.objects.set(`${me.id}/avatar`, { type: 'image/jpeg', bytes: Buffer.from(photo.split(',')[1], 'base64') });
  check(prof1.display_name === 'Andrew' && prof1.avatar_url && prof1.avatar_url.startsWith(`${ORIGIN}/storage/v1/object/public/avatars/${me.id}/avatar`) && mock.db.objects.has(`${me.id}/avatar`), 'v13 profile edit → name + photo synced (photo in avatars/<user id>/avatar, public URL on the profile)');
  await until(() => mock.db.public_stats.get(me.id)?.display_name === 'Andrew', 6000);
  check(mock.db.public_stats.get(me.id)?.display_name === 'Andrew' && !!mock.db.public_stats.get(me.id)?.avatar_url, 'v13 leaderboard row picks up the new name + photo');
  await go('#me');
  await cleanShot('v13-03-profile');

  // ---------------------------------------------------------------- Settings: cloud save card, manual backup
  await go('#settings');
  await page.waitForSelector('[data-card="cloud"][data-cloud="signed-in"]', { timeout: 5000 }).catch(() => {});
  const cc = await page.evaluate(() => ({ email: document.querySelector('[data-cloud-email]')?.textContent, last: document.querySelector('[data-cloud-last]')?.textContent, auto: document.querySelector('[data-cloud-auto]')?.textContent, b: !!document.querySelector('[data-action="cloud-backup"]'), r: !!document.querySelector('[data-action="cloud-restore"]'), lb: !!document.querySelector('[data-card="cloud"] [data-href="#leaderboard"]'), backupBtn: !!document.querySelector('[data-action="backup-now"]') }));
  check(cc.email === 'andrew.test@example.com' && /ago|just now|min/.test(cc.last) && /on · after sessions/.test(cc.auto) && cc.b && cc.r && cc.lb && cc.backupBtn, `v13 Settings cloud card: account, last cloud backup (${cc.last}), automatic backup on, BACK UP TO CLOUD + RESTORE FROM CLOUD + leaderboard (file backup still there)`);
  await page.$eval('[data-card="cloud"]', (el) => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -90));
  await cleanShot('v13-04-cloud-save-settings');
  const t0 = mock.db.saves.get(me.id).updated_at;
  await tap('[data-action="cloud-backup"]');
  await until(() => mock.db.saves.get(me.id).updated_at !== t0);
  check(mock.db.saves.get(me.id).updated_at !== t0, 'v13 BACK UP TO CLOUD uploads the backup');

  // ---------------------------------------------------------------- automatic upload after a session (debounced)
  const upCount = () => mock.log.filter((l) => l.method === 'POST' && l.path === '/rest/v1/saves').length;
  const n0 = upCount();
  await page.evaluate(() => { const s = window.PoolIQ.getState(); const g = s.games.landing = s.games.landing || { stages: {}, pb: {}, sessions: [] }; const r = g.stages['lz-1'] = g.stages['lz-1'] || { passed: false, tries: 0, bestScore: 0, bestStars: 0, history: [] }; r.tries = (r.tries || 0) + 1; window.PoolIQ.commit({ ...s }); });
  await sleep(1200);
  check(upCount() === n0, 'v13 auto backup is debounced (no upload right after the session is saved)');
  await page.evaluate(() => window.PoolIQ.cloud._autoSyncNow());
  await until(() => upCount() > n0);
  check(upCount() === n0 + 1 && mock.db.saves.get(me.id).summary.sessions === JSON.parse(JSON.stringify(mock.db.saves.get(me.id).data.summary)).sessions, 'v13 auto backup uploads once the debounce fires');
  const n1 = upCount();
  await page.evaluate(() => window.PoolIQ.cloud._autoSyncNow());
  await sleep(500);
  check(upCount() === n1, 'v13 auto backup skips when nothing new was played');

  // ---------------------------------------------------------------- another device saved → auto backup pauses, never overwrites
  const other = JSON.parse(JSON.stringify(mock.db.saves.get(me.id)));
  const st = JSON.parse(other.data.keys.poolIQStateV4 ? JSON.stringify(other.data.keys.poolIQStateV4) : '{}');
  st.xp = 4242;
  other.data.keys.poolIQStateV4 = st;
  other.data.summary.xp = 4242;
  other.summary = { ...other.summary, xp: 4242 };
  Object.assign(other, { device_id: 'dev-other-phone', device_label: 'Android phone', local_saved_at: Date.now() + 60000, updated_at: mock.now() });
  mock.db.saves.set(me.id, other);
  await page.evaluate(() => { const s = window.PoolIQ.getState(); s.games.landing.stages['lz-1'].tries += 1; window.PoolIQ.commit({ ...s }); });
  await page.evaluate(() => window.PoolIQ.cloud._autoSyncNow());
  await sleep(600);
  check(mock.db.saves.get(me.id).device_id === 'dev-other-phone' && mock.db.saves.get(me.id).data.keys.poolIQStateV4.xp === 4242, 'v13 cloud save changed on another phone → automatic backup does NOT overwrite it');
  await go('#settings');
  check(await exists('[data-cloud-conflict]') && /paused/.test(await txt('[data-cloud-auto]')), 'v13 Settings shows the other-device warning and “paused”');
  // manual backup asks before replacing
  await tap('[data-action="cloud-backup"]');
  await page.waitForSelector('#sheet[data-kind="cloud-overwrite"]', { timeout: 4000 }).catch(() => {});
  check(await exists('#sheet[data-kind="cloud-overwrite"] [data-action="cloud-backup-force"]') && /Android phone/.test(await txt('#sheet')), 'v13 BACK UP TO CLOUD over a newer other-device save asks first (Replace the cloud save?)');
  await tap('#sheet [data-action="sheet-close"].bigBtn');

  // ---------------------------------------------------------------- restore from cloud: confirm step, snapshot first, replace, reload
  const xpBefore = await page.evaluate(() => window.PoolIQ.getState().xp);
  await tap('[data-action="cloud-restore"]');
  await page.waitForSelector('#sheet[data-kind="cloud-restore"]', { timeout: 5000 }).catch(() => {});
  const rs = await page.evaluate(() => ({ t: document.querySelector('#sheet')?.innerText || '', newer: document.querySelector('#sheet .cmpCol.newer')?.dataset.cmp, go: !!document.querySelector('#sheet [data-action="cloud-restore-do"]') }));
  check(rs.go && /Replace this device/.test(rs.t) && /snapshot/i.test(rs.t) && rs.newer === 'cloud-save' && /Android phone/.test(rs.t), 'v13 RESTORE FROM CLOUD: confirm sheet compares cloud vs this device (cloud marked NEWER) and promises a snapshot first');
  await cleanShot('v13-05-restore-confirm');
  await tap('#sheet [data-action="sheet-close"].bigBtn');
  check((await page.evaluate(() => window.PoolIQ.getState().xp)) === xpBefore, 'v13 cancel leaves this device unchanged');
  await tap('[data-action="cloud-restore"]');
  await page.waitForSelector('#sheet [data-action="cloud-restore-do"]', { timeout: 5000 });
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}), page.$eval('#sheet [data-action="cloud-restore-do"]', (el) => el.click())]);
  await ready();
  await sleep(600);
  const after = await page.evaluate(async () => ({ xp: window.PoolIQ.getState().xp, snaps: (await window.PoolIQ.vault.snapshots()).map((s) => s.reason), toast: document.getElementById('toast')?.textContent || '', signed: window.PoolIQ.cloud.isSignedIn() }));
  check(after.xp === 4242 && after.snaps.includes('Before cloud restore') && /Cloud save restored/.test(after.toast), `v13 restore replaced the data with the cloud save (xp ${after.xp}), a “Before cloud restore” snapshot exists, flash shown`);
  await until(() => page.evaluate(() => window.PoolIQ.cloud.isSignedIn()), 5000);
  await go('#settings');
  await sleep(400);
  check((await page.evaluate(() => window.PoolIQ.cloud.isSignedIn())) && !(await exists('[data-cloud-conflict]')) && !(await exists('#sheet.show')), 'v13 after restore: still signed in, warning cleared, no repeat offer');

  // ---------------------------------------------------------------- new device: sign in → offer to restore (never silent)
  const ctx2 = await browser.createBrowserContext();
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errors.push(`pageerror(p2): ${e.message}`));
  p2.on('console', (m) => { if (m.type() === 'error') errors.push(`console(p2): ${m.text()}`); });
  await p2.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36');
  await p2.setViewport(V390);
  await attach(p2);
  await p2.goto(BASE + 'index.html#account', { waitUntil: 'networkidle0' });
  await ready(p2);
  await p2.waitForSelector('#acEmail', { timeout: 5000 });
  const fresh = await p2.evaluate(() => window.PoolIQ.getState().xp || 0);
  await typeInto('#acEmail', 'andrew.test@example.com', p2);
  await typeInto('#acPass', 'cue-ball-9', p2);
  await tap('[data-ac-submit]', p2);
  await p2.waitForSelector('#sheet[data-kind="cloud-offer"]', { timeout: 8000 }).catch(() => {});
  const of = await p2.evaluate(() => ({ t: document.querySelector('#sheet')?.innerText || '', restore: !!document.querySelector('#sheet [data-action="cloud-restore-ask"]'), keep: !!document.querySelector('#sheet [data-action="cloud-keep-ask"]'), later: !!document.querySelector('#sheet [data-action="cloud-offer-later"]'), xp: window.PoolIQ.getState().xp || 0 }));
  check(of.restore && of.later && !of.keep && /Restore your cloud save/.test(of.t) && of.xp === fresh, 'v13 new device: signing in offers to restore the cloud save (RESTORE / DECIDE LATER) and changes nothing by itself');
  await cleanShot('v13-06-new-device-offer', p2);
  await tap('#sheet [data-action="cloud-offer-later"]', p2);
  check(!(await exists('#sheet.show', p2)) && (await p2.evaluate(() => window.PoolIQ.getState().xp || 0)) === fresh, 'v13 DECIDE LATER closes the offer, local data untouched');
  const saveBefore = mock.db.saves.get(me.id).updated_at;
  await p2.evaluate(() => { const s = window.PoolIQ.getState(); s.xp = (s.xp || 0) + 5; window.PoolIQ.commit({ ...s }); return window.PoolIQ.cloud._autoSyncNow(); });
  await sleep(500);
  check(mock.db.saves.get(me.id).updated_at === saveBefore, 'v13 new device: automatic backup never overwrites the unseen cloud save');
  await go('#settings', p2);
  await tap('[data-action="cloud-restore"]', p2);
  await p2.waitForSelector('#sheet [data-action="cloud-restore-do"]', { timeout: 5000 });
  await Promise.all([p2.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {}), p2.$eval('#sheet [data-action="cloud-restore-do"]', (el) => el.click())]);
  await ready(p2);
  await sleep(500);
  check((await p2.evaluate(() => window.PoolIQ.getState().xp)) === 4242 && (await p2.evaluate(() => window.PoolIQ.profile.getProfile().displayName)) === 'Andrew', 'v13 new device restore: progress and profile arrive from the cloud save');
  await detach(p2);
  await p2.close();
  await ctx2.close();

  // ---------------------------------------------------------------- leaderboard
  await go('#leaderboard');
  await page.waitForSelector('[data-lb="list"]', { timeout: 8000 }).catch(() => {});
  const lb = async () => page.evaluate(() => ({ names: [...document.querySelectorAll('.lbRow .prMain b')].map((b) => b.childNodes[0].textContent.trim()), sort: document.querySelector('[data-lb="list"]')?.dataset.sort, imgs: [...document.querySelectorAll('.lbRow .remoteAvatar img')].map((i) => i.getAttribute('src')), me: !!document.querySelector('.lbRow.me .tag'), sw: document.documentElement.scrollWidth - innerWidth, minH: Math.min(...[...document.querySelectorAll('.lbRow')].map((r) => r.getBoundingClientRect().height)) }));
  let L = await lb();
  check(L.names.length === 4 && L.names.includes('Andrew') && L.me && L.sort === 'xp' && L.names[0] === 'Leo', `v13 leaderboard lists everyone in the project incl. you, default sort Lifetime XP (${L.names.join(', ')})`);
  check(L.imgs.length >= 2 && L.imgs.every((s) => s.startsWith(`${ORIGIN}/storage/v1/object/public/avatars/`)), `v13 leaderboard shows photos from the avatars bucket (${L.imgs.length})`);
  check(!L.imgs.some((s) => /evil\.example/.test(s)) && (await page.evaluate(() => !document.body.innerHTML.includes('evil.example'))), 'v13 leaderboard ignores a photo URL outside the project storage (initials instead)');
  check(L.sw <= 1 && L.minH >= 56, `390×844: leaderboard rows are big (${Math.round(L.minH)} px), no sideways scroll`);
  await cleanShot('v13-07-leaderboard');
  await tap('[data-action="lb-sort"][data-v="career"]');
  L = await lb();
  check(L.sort === 'career' && L.names[0] === 'Maya', `v13 sort by Career rank (${L.names.join(', ')})`);
  await tap('[data-action="lb-sort"][data-v="drill"]');
  L = await lb();
  check(L.sort === 'drill' && L.names[0] === 'Sam', `v13 sort by Drill Rank (${L.names.join(', ')})`);
  await page.evaluate((id) => document.querySelector(`.lbRow[data-id="${id}"]`).click(), friends.leo.id);
  await page.waitForSelector('#sheet[data-kind="player-card"]', { timeout: 4000 }).catch(() => {});
  const pc = await page.evaluate(() => ({ t: document.querySelector('#sheet')?.innerText || '', badges: document.querySelectorAll('#sheet .pcBadges svg').length, pvp: !!document.querySelector('#sheet [data-pc-pvp]') }));
  check(/Leo/.test(pc.t) && /Apprentice/.test(pc.t) && /Pattern Player/.test(pc.t) && /50,000/.test(pc.t) && pc.badges === 2 && pc.pvp && /5–2/.test(pc.t), 'v13 tapping a player opens their profile card (career ball + Drill Rank badges, Lifetime XP, stars, shared win record)');
  await cleanShot('v13-08-player-card');
  await tap('#sheet [data-action="sheet-close"].bigBtn');

  // ---------------------------------------------------------------- optional win record
  await go('#settings');
  await tap('[data-action="cloud-share-wins"]');
  await until(() => mock.db.public_stats.get(me.id)?.pvp_wins !== null && mock.db.public_stats.get(me.id)?.pvp_wins !== undefined);
  check(Number.isInteger(mock.db.public_stats.get(me.id)?.pvp_wins), 'v13 “show my friend-match record” ON → win record added to the leaderboard row');
  await tap('[data-action="cloud-share-wins"]');
  await until(() => mock.db.public_stats.get(me.id)?.pvp_wins === null);
  check(mock.db.public_stats.get(me.id)?.pvp_wins === null, 'v13 switching it OFF removes the win record again');

  // ---------------------------------------------------------------- password reset + recovery link + change password
  await go('#account/reset');
  await typeInto('#acEmail', 'andrew.test@example.com');
  await tap('[data-ac-submit]');
  await until(() => page.evaluate(() => document.querySelector('[data-ac-msg]')?.dataset.acMsg === 'ok'));
  const rec = mock.log.find((l) => l.path === '/auth/v1/recover');
  check(!!rec && rec.body?.email === 'andrew.test@example.com' && decodeURIComponent(rec.search).includes(`redirect_to=${SITE_URL}`) && /reset link is on its way/.test(await txt('[data-ac-msg]')), 'v13 password reset: reset email requested with the site URL as the redirect, confirmation shown');

  // ---------------------------------------------------------------- sign out keeps local data
  await go('#account');
  const xpKeep = await page.evaluate(() => window.PoolIQ.getState().xp);
  await tap('[data-action="ac-signout"]');
  await until(() => exists('[data-account="signed-out"]'));
  check((await exists('[data-account="signed-out"]')) && (await page.evaluate(() => window.PoolIQ.getState().xp)) === xpKeep && !(await page.evaluate(() => Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k)))), 'v13 sign out: back to the sign-in screen, session removed, data on the phone kept');

  // recovery link: #access_token=…&type=recovery → New password screen → updateUser → sign in with it
  const s = mock.session(me);
  await page.goto('about:blank');
  await page.goto(`${BASE}index.html#access_token=${s.access_token}&expires_at=${s.expires_at}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=recovery`, { waitUntil: 'networkidle0' });
  await ready();
  await page.waitForSelector('[data-account="newpass"]', { timeout: 8000 }).catch(() => {});
  check((await exists('[data-account="newpass"]')) && !/access_token/.test(await page.evaluate(() => location.hash)), 'v13 reset link (#access_token … type=recovery) opens the New password screen and the token leaves the URL');
  await typeInto('#acPass', 'new-pass-77');
  await typeInto('#acPass2', 'new-pass-7');
  await tap('[data-ac-submit]');
  check(/don’t match/.test(await txt('[data-ac-msg]')), 'v13 new password: mismatch caught');
  await typeInto('#acPass2', 'new-pass-77');
  await tap('[data-ac-submit]');
  await until(() => me.password === 'new-pass-77');
  check(me.password === 'new-pass-77', 'v13 new password saved to the account');
  await sleep(300);
  await go('#account');
  await tap('[data-action="ac-signout"]').catch(() => {});
  await until(() => exists('[data-account="signed-out"]'));

  // expired link → friendly message on the reset screen
  await page.goto('about:blank');
  await page.goto(`${BASE}index.html#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`, { waitUntil: 'networkidle0' });
  await ready();
  await page.waitForSelector('[data-account="reset"]', { timeout: 8000 }).catch(() => {});
  check((await exists('[data-account="reset"]')) && /expired/.test(await txt('[data-ac-msg]')), 'v13 expired email link → Reset password screen explains and offers a new link');

  // sign back in with the new password, then go offline: the app still boots and works
  await go('#account');
  await typeInto('#acEmail', 'andrew.test@example.com');
  await typeInto('#acPass', 'new-pass-77');
  await tap('[data-ac-submit]');
  await until(() => exists('[data-account="signed-in"]'), 8000);
  check(await exists('[data-account="signed-in"]'), 'v13 sign in with the new password');
  await sleep(800);
  const reqBefore = mock.log.length;
  await page.setOfflineMode(true);
  await page.goto(BASE + 'index.html#home', { waitUntil: 'domcontentloaded' });
  await ready().catch(() => {});
  await sleep(1200);
  const off = await page.evaluate(() => ({ home: document.querySelector('#view')?.innerText.length || 0, lib: !!window.supabase }));
  await go('#leaderboard');
  await sleep(400);
  const offLb = await txt('#view');
  check(off.home > 50 && off.lib && /offline/i.test(offLb) && mock.log.length === reqBefore, 'v13 offline while signed in: app + account library load from the cache, leaderboard says offline, no requests attempted');
  await page.setOfflineMode(false);
  await page.goto(BASE + 'index.html#account', { waitUntil: 'networkidle0' });
  await ready();
  await sleep(600);
  await tap('[data-action="ac-signout"]').catch(() => {});
  await until(() => exists('[data-account="signed-out"]'));
  await go('#home');

  await detach(page);
  // expected 4xx replies (wrong password) are logged by Chrome as "Failed to load resource" — not app errors
  for (let i = errors.length - 1; i >= errBefore; i--) if (/Failed to load resource: the server responded with a status of 400/.test(errors[i]) && expected4xx.length) { errors.splice(i, 1); expected4xx.pop(); }
  const mine = errors.slice(errBefore);
  check(mine.length === 0, `v13 online accounts: zero console errors (${mine.length})`);
  if (mine.length) console.log(mine.join('\n'));
  return mock;
}
function byEmail(mock, e) { return [...mock.db.users.values()].find((u) => u.email === e); }

// ---------------------------------------------------------------- standalone runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createRequire } = await import('module');
  const args = process.argv.slice(2);
  const si = args.indexOf('--shots');
  const SHOTS = si >= 0 ? args[si + 1] : null;
  const BASE = (args.find((a, i) => !a.startsWith('--') && i !== si + 1) || 'http://localhost:8765/').replace(/\/?$/, '/');
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const here = path.dirname(new URL(import.meta.url).pathname);
  let puppeteer;
  for (const d of [process.env.PUPPETEER_DIR, path.join(here, '..', 'node_modules'), path.join(here, '..', '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean)) { try { puppeteer = createRequire(path.join(d, 'x.js'))('puppeteer-core'); break; } catch {} }
  const CHROME = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && fs.existsSync(p));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1');
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const results = [];
  const check = (ok, msg) => { results.push({ ok: !!ok, msg }); console.log(`${ok ? 'PASS' : 'FAIL'}: ${msg}`); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shot = async (name) => { if (SHOTS) { await sleep(200); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  shot.dir = SHOTS;
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  // some progress so the first sign-in has something to back up
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('poolIQStateV4') || 'null'); if (s) { s.games = s.games || {}; s.games.landing = { stages: { 'lz-1': { passed: true, tries: 2, bestScore: 400, bestStars: 2, history: [] } }, pb: {}, sessions: [] }; localStorage.setItem('poolIQStateV4', JSON.stringify(s)); } });
  await page.reload({ waitUntil: 'networkidle0' });
  try { await runAccounts({ browser, page, BASE, check, sleep, shot, errors }); } catch (e) { check(false, `crashed: ${e.stack || e.message}`); }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n--- accounts e2e ---\n${results.length - failed.length}/${results.length} passed · console errors: ${errors.length}`);
  process.exit(failed.length ? 1 : 0);
}
