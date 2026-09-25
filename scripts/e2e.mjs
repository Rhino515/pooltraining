/**
 * Pool IQ end-to-end test (real Chrome, iPhone-sized, touch enabled).
 *
 *   python3 -m http.server 8765 --directory .        # serve the app (any static server works)
 *   node scripts/e2e.mjs [baseUrl] [--shots <dir>]    # default baseUrl http://localhost:8765/
 *
 * Needs puppeteer-core and a Chrome/Chromium binary. puppeteer-core is looked up in:
 *   $PUPPETEER_DIR, ./node_modules, ../tooling/node_modules, /workspace/tooling/node_modules
 * Chrome: $CHROME_PATH, /usr/bin/google-chrome, /usr/bin/chromium, /usr/bin/chromium-browser
 * Every check prints PASS/FAIL; the process exits 1 if anything fails.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const shotsIdx = args.indexOf('--shots');
const SHOTS = shotsIdx >= 0 ? args[shotsIdx + 1] : null;
const BASE = (args.find((a, i) => !a.startsWith('--') && i !== shotsIdx + 1) || 'http://localhost:8765/').replace(/\/?$/, '/');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

function loadPuppeteer() {
  const here = path.dirname(new URL(import.meta.url).pathname);
  const dirs = [process.env.PUPPETEER_DIR, path.join(here, '..', 'node_modules'), path.join(here, '..', '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean);
  for (const d of dirs) {
    try {
      return createRequire(path.join(d, 'x.js'))('puppeteer-core');
    } catch {}
  }
  throw new Error('puppeteer-core not found — npm i puppeteer-core somewhere outside the project and set PUPPETEER_DIR');
}
const puppeteer = loadPuppeteer();
const CHROME = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && fs.existsSync(p));

const results = [];
function check(cond, msg) {
  results.push({ ok: !!cond, msg });
  console.log(`${cond ? 'PASS' : 'FAIL'}: ${msg}`);
}

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setUserAgent(IPHONE_UA);
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await page.evaluateOnNewDocument(() => {
  window.__rejections = 0;
  window.addEventListener('unhandledrejection', () => { window.__rejections++; });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function go(hash) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await sleep(250);
}
async function tap(sel) {
  await page.waitForSelector(sel, { timeout: 4000 });
  await page.$eval(sel, (el) => el.click());
  await sleep(120);
}
async function record(i, times = 1) {
  for (let k = 0; k < times; k++) {
    const done = await page.$('.resultPanel');
    if (done) break;
    await tap(`.resultBar .rb[data-action="record"][data-i="${i}"]`);
  }
}
async function recordLast(times) {
  for (let k = 0; k < times; k++) {
    if (await page.$('.resultPanel')) break;
    await page.$$eval('.resultBar .rb[data-action="record"]', (els) => els[els.length - 1].click());
    await sleep(120);
  }
}
const text = (sel) => page.$eval(sel, (el) => el.innerText).catch(() => '');
const exists = async (sel) => !!(await page.$(sel));
const getState = () => page.evaluate(() => JSON.parse(localStorage.getItem('poolIQStateV4') || 'null'));
/** Modify the saved state in the page, then reload so the app re-reads it */
async function inject(fnSrc, hash) {
  await page.evaluate((src) => {
    const s = JSON.parse(localStorage.getItem('poolIQStateV4'));
    const fn = new Function('s', src);
    localStorage.setItem('poolIQStateV4', JSON.stringify(fn(s) || s));
  }, fnSrc);
  if (hash) await page.evaluate((h) => { history.replaceState(null, '', h); }, hash);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(250);
}
async function shot(name, full = false) {
  if (!SHOTS) return;
  await sleep(200);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full });
}
/** Build injection source that passes the first n stages of a game (stage ids read from the registry in-page) */
async function passFirst(game, n, hash) {
  const ids = await page.evaluate(async (g, k) => (await import('./js/games/registry.js')).stageSpecs(g).slice(0, k).map((s) => s.id), game, n);
  await inject(`s.games = s.games || {}; const g = s.games['${game}'] = s.games['${game}'] || { stages: {}, pb: {}, sessions: [] };
    for (const id of ${JSON.stringify(ids)}) g.stages[id] = { passed: true, tries: 1, bestScore: 500, bestStars: 2, lastDate: new Date().toISOString(), history: [] };
    return s;`, hash);
}

// ------------------------------------------------------------------------------------------ boot
await page.goto(BASE + 'index.html', { waitUntil: 'networkidle0' });
await page.evaluate(() => { localStorage.clear(); });
await page.reload({ waitUntil: 'networkidle0' });
check(await exists('#view'), 'app boots');
await inject(`s.settings.coaching = 'beginner'; return s;`, '#home');

// ------------------------------------------------------------------------------------------ routes
const ROUTES = ['#home', '#career', '#drills', '#analyze', '#arcade', '#profile', '#stats', '#settings', '#ghost', '#game/landing', '#game/bank', '#game/speed', '#play/landing/lz-1', '#play/speed/sp-cal', '#boss/boss-1', '#ghostmatch'];
for (const r of ROUTES) {
  await go(r);
  const t = await text('#view');
  check(t.trim().length > 20, `route ${r} renders`);
}
await go('#drills');
check(await exists('.drillsEmpty[data-empty="1"]'), 'drills route shows the empty state');
const dt = await text('#view');
check(/No drills loaded yet/.test(dt) && /Your drills will appear here once added/.test(dt), 'empty-state copy');
check(!/coming soon/i.test(dt) && !(await exists('.drillCard')), 'no fake "Coming Soon" drill cards');
check(errors.length === 0, `drills route: zero console errors (${errors.length})`);
await shot('14-drills-empty-state');

// ------------------------------------------------------------------------------------------ arcade + table
await go('#arcade');
check((await page.$$('.gameCard[data-game]')).length === 14, '14 arcade game cards');
await shot('01-arcade-hub');
await go('#play/landing/lz-1');
for (const cls of ['obj-ball', 'cue-ball', 'zone-ring', 'cue-path', 'ob-path']) check(await exists(`.playTable svg .${cls}`), `landing table SVG has .${cls}`);
const chip = await text('.recipeRow .speedChip, .speedChip');
check(/^SPEED \d\.\d$/.test(chip.trim()), `SPEED chip shown ("${chip.trim()}")`);
await shot('02-landing-zone');
// layout at 390x844
const layout = await page.evaluate(() => {
  const bar = document.querySelector('.resultBar').getBoundingClientRect();
  const btns = [...document.querySelectorAll('.resultBar .rb')].map((b) => b.getBoundingClientRect());
  const svg = document.querySelector('.playTable svg').getBoundingClientRect();
  return { barBottom: bar.bottom, vh: innerHeight, minH: Math.min(...btns.map((b) => b.height)), svgRight: svg.right, vw: innerWidth, scrollW: document.documentElement.scrollWidth };
});
check(layout.barBottom <= layout.vh + 1 && layout.minH >= 44, `390×844: result bar on screen, buttons ≥44px (${Math.round(layout.minH)}px)`);
check(layout.svgRight <= layout.vw + 1 && layout.scrollW <= layout.vw, '390×844: table fits, no horizontal scroll');

// contact dot for a known recipe (draw stage 1)
await go('#play/draw/dr-1');
const dr = await page.evaluate(async () => {
  const reg = await import('./js/games/registry.js');
  const st = reg.getStages('draw')[0];
  const dot = document.querySelector('.recipeRow .cb-dot, .cb-dot');
  return { v: st.cueContact.vTips, h: st.cueContact.hTips, cx: +dot?.getAttribute('cx'), cy: +dot?.getAttribute('cy'), id: st.id };
});
if (dr.id !== 'dr-1') { await go(`#play/draw/${dr.id}`); }
check(Math.abs(dr.cx - (50 + dr.h * 19.5)) < 0.6 && Math.abs(dr.cy - (50 - dr.v * 19.5)) < 0.6 && dr.v < 0, `contact dot at the recipe's tips (v ${dr.v}, h ${dr.h} → ${dr.cx},${dr.cy})`);
await shot('05-draw-stage');
// Why sheet differs between stages
await tap('.whyBtn');
await page.waitForSelector('#sheet .whyList', { timeout: 3000 });
const why1 = await text('#sheet .whyList');
await shot('09-why-sheet-open');
await tap('#sheet [data-action="sheet-close"]');
await go('#play/landing/lz-1');
await tap('.whyBtn');
await page.waitForSelector('#sheet .whyList', { timeout: 3000 });
const why2 = await text('#sheet .whyList');
check(why1.length > 80 && why2.length > 80 && why1 !== why2, 'Why This Shot? shows different text on two stages');
await tap('#sheet [data-action="sheet-close"]');

// ------------------------------------------------------------------------------------------ fail / pass / unlock / PB
await go('#play/landing/lz-1');
await record(0, 12);
check((await page.$eval('.resultPanel', (e) => e.dataset.result).catch(() => null)) === 'fail', 'all misses → FAILED result');
let st = await getState();
check(st.games.landing.stages['lz-1'].passed === false && st.games.landing.stages['lz-1'].history.length === 1, 'failed attempt saved to history');
await go('#play/landing/lz-2');
check(!(await exists('.playScreen[data-stage="lz-2"]')), 'fail does NOT unlock the next stage');
await go('#play/landing/lz-1');
await record(4, 12);
check((await page.$eval('.resultPanel', (e) => e.dataset.result).catch(() => null)) === 'pass', 'bullseyes → PASSED result');
check(await exists('.resultPanel [data-unlocked="1"]'), 'result panel announces the unlock');
st = await getState();
const pb = st.games.landing.pb.highScore;
await go('#play/landing/lz-2');
check(await exists('.playScreen[data-stage="lz-2"]'), 'pass unlocks the next stage');
// in-progress session survives reload
await record(1, 2);
await page.reload({ waitUntil: 'networkidle0' });
await sleep(300);
const resumed = await page.$$eval('.attemptDots i.partial, .attemptDots i.hit', (els) => els.length).catch(() => 0);
check(resumed === 2, `in-progress session resumes after reload (${resumed} attempts)`);
await page.reload({ waitUntil: 'networkidle0' });
st = await getState();
check(pb > 0 && st.games.landing.pb.highScore === pb, `PB persists after reload (${pb})`);
await go('#game/landing');
check((await text('#view')).includes(String(pb)), 'PB shown in the game lobby');

// ------------------------------------------------------------------------------------------ ghost
await go('#ghost/3/3');
await tap('[data-action="ghost-start"]');
await tap('[data-action="ghost-rack"][data-v="W"]');
check((await text('[data-you]')) === '1', 'ghost: player score increments');
await tap('[data-action="ghost-rack"][data-v="L"]');
check((await text('[data-ghost]')) === '1', 'ghost: ghost score increments');
await tap('[data-action="ghost-rack"][data-v="W"]');
await tap('[data-action="ghost-rack"][data-v="W"]');
check(await exists('.ghostMatch[data-over="1"] .resultPanel[data-result="pass"]'), 'ghost: match ends at race to 3');
st = await getState();
check(st.ghostMatches.length === 1 && st.ghostMatches[0].won, 'ghost: match saved to history');
await shot('08-ghost-match');
await tap('[data-action="ghost-undo"]');
st = await getState();
check(st.ghostMatches.length === 0 && (await exists('.ghostMatch[data-over="0"]')), 'ghost: undo after match end reopens it and removes it from history');
await tap('[data-action="ghost-rack"][data-v="W"]');
st = await getState();
check(st.ghostMatches.length === 1, 'ghost: re-finished match saved once');
await go('#ghost');
check(/3-Ball|3 ball|W\b|won/i.test(await text('#view')), 'ghost lobby shows history');

// ------------------------------------------------------------------------------------------ bank lives
await passFirst('landing', 2, '#play/bank/bv-1');
check(await exists('.playScreen[data-game="bank"]'), 'Bank Vault opens after Landing Zone level 2');
const lives0 = +(await page.$eval('.hearts', (e) => e.dataset.lives));
await shot('03-bank-vault');
await record(0, 1);
const lives1 = +(await page.$eval('.hearts', (e) => e.dataset.lives));
check(lives1 === lives0 - 1, `bank: miss costs a life (${lives0} → ${lives1})`);
await record(0, 5);
check((await page.$eval('.resultPanel', (e) => e.dataset.result).catch(() => null)) === 'fail', 'bank: out of lives = game over');

// ------------------------------------------------------------------------------------------ kick + train + calibration screenshots
await passFirst('bank', 1, '#play/kick/ke-1');
check(await exists('.playScreen[data-game="kick"] .playTable svg .cue-path'), 'Kick Escape opens with a kick route');
await shot('04-kick-escape');
await go('#play/speed/sp-cal');
check(await exists('.speedChip.big') && (await page.$$('.rulerTick')).length >= 9, 'speed calibration screen with diamond ruler');
await shot('06-speed-calibration');
await passFirst('landing', 3, '#play/train/pt-1');
check(await exists('.playScreen[data-game="train"]'), 'Position Train opens');
await record(2, 2);
const m2 = +(await page.$eval('.mult', (e) => e.dataset.mult));
check(m2 === 3, `train: multiplier rises with zones (×${m2})`);
await shot('07-position-train');
await record(1, 1);
const m3 = +(await page.$eval('.mult', (e) => e.dataset.mult).catch(() => 0));
check(m3 === 1, `train: multiplier resets on a zone miss (×${m3})`);

// ------------------------------------------------------------------------------------------ advanced lock / reveal
await go('#settings');
await tap('[data-action="set-coach"][data-v="advanced"]');
await go('#play/landing/lz-1');
check(await exists('.planner[data-planner="1"]'), 'advanced: planner shown');
check(!(await exists('.recipeRow')), 'advanced: recipe hidden before locking');
const lockDisabled = await page.$eval('.lockBtn', (e) => e.disabled);
check(lockDisabled, 'advanced: LOCK disabled until the plan is complete');
await tap('[data-action="plan-tech"]');
await tap('[data-action="plan-speed"][data-v="2"]');
await tap('[data-action="plan-rails"][data-v="0"]');
{
  const box = await (await page.$('.plBall svg')).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); // centre ball
  await sleep(150);
}
await shot('10a-advanced-plan');
await tap('.lockBtn:not([disabled])');
await page.waitForSelector('#sheet .cmpRow', { timeout: 3000 });
check((await page.$$('#sheet .cmpRow[data-verdict]')).length === 5, 'advanced: lock shows 5-row comparison');
await shot('10-advanced-reveal');
await tap('#sheet [data-action="sheet-close"]');
check(await exists('.recipeRow'), 'advanced: recipe revealed after locking');
await go('#settings');
await tap('[data-action="set-coach"][data-v="beginner"]');

// ------------------------------------------------------------------------------------------ skills before career/boss
await go('#profile');
const skillsA = await page.$$eval('.skill[data-skill] b', (els) => els.map((e) => +e.innerText));
check(skillsA.some((v) => v > 0), 'profile skill ratings rise from recorded results');
check(await exists('.recCard'), 'profile shows recommendations');
await page.$eval('.recCard', (e) => e.scrollIntoView({ block: 'center' }));
await shot('12-profile-recommendations');

// ------------------------------------------------------------------------------------------ career + boss
await go('#career');
const met0 = (await page.$$('[data-met="1"]')).length;
await passFirst('sniper', 2);
await passFirst('speed', 2, '#career');
const met1 = (await page.$$('[data-met="1"]')).length;
check(met1 > met0, `career checklist ticks from results (${met0} → ${met1})`);
check(await exists('[data-href="#boss/boss-1"]'), 'boss unlocked once other requirements are met');
await go('#home');
check(/Boss Battle unlocked/i.test(await text('#view')), 'home next-up points at the boss');
await go('#career');
await shot('13-career-next-up');
await go('#boss/boss-1');
const btnTexts = await page.$$eval('#view button, #view a', (els) => els.map((e) => e.innerText.toUpperCase()));
check(!btnTexts.some((t) => /I PASSED|MARK PASS|PASS TEST|PROMOTE ME/.test(t)), 'boss page has no self-report pass button');
await go('#bossplay/boss-1');
check(await exists('.playScreen') && (await exists('.bossTrack')), 'boss battle starts');
await record(1, 1);
await shot('11-boss-battle');
await tap('.rbUndo');
await record(0, 20);
check((await page.$eval('.resultPanel', (e) => e.dataset.result).catch(() => null)) === 'fail', 'boss: all misses → FAILED');
const weak = await page.$eval('.weakBox', (e) => e.dataset.weak).catch(() => '');
check(weak.length > 0, `boss: failing lists weak skills (${weak})`);
st = await getState();
check(st.rankIndex === 0, 'boss fail does not promote');
await tap('[data-action="retry"]');
await recordLast(20);
check((await page.$eval('.resultPanel', (e) => e.dataset.result).catch(() => null)) === 'pass', 'boss: perfect run → PASSED');
check(/PROMOTED TO/i.test(await text('.resultPanel')), 'boss pass shows promotion');
await shot('11b-boss-passed');
st = await getState();
check(st.rankIndex === 1, 'rank is now Club Player');
await go('#profile');
const skillsB = await page.$$eval('.skill[data-skill] b', (els) => els.map((e) => +e.innerText));
check(skillsB.reduce((a, b) => a + b, 0) > skillsA.reduce((a, b) => a + b, 0), 'skill ratings change after more results');

// ------------------------------------------------------------------------------------------ small phone
await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await go('#play/landing/lz-2');
const small = await page.evaluate(() => {
  const bar = document.querySelector('.resultBar')?.getBoundingClientRect();
  const btns = [...document.querySelectorAll('.resultBar .rb')].map((b) => b.getBoundingClientRect());
  return { ok: !!bar, bottom: bar?.bottom, vh: innerHeight, minH: Math.min(...btns.map((b) => b.height)), scrollW: document.documentElement.scrollWidth, vw: innerWidth };
});
check(small.ok && small.bottom <= small.vh + 1 && small.minH >= 44 && small.scrollW <= small.vw, `375×667: result bar visible, buttons ≥44px, no sideways scroll`);
await shot('15-play-375x667');
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

// ------------------------------------------------------------------------------------------ every stage + boss renders
{
  const all = await page.evaluate(async () => {
    const reg = await import('./js/games/registry.js');
    return reg.GAMES.filter((g) => g.id !== 'ghost').map((g) => ({ id: g.id, stages: reg.stageSpecs(g.id).map((s) => s.id) }));
  });
  const bosses = await page.evaluate(async () => (await import('./js/games/registry.js')).BOSSES.map((b) => b.id));
  await inject(`const all = ${JSON.stringify(all)};
    for (const g of all) { s.games[g.id] = s.games[g.id] || { stages: {}, pb: {}, sessions: [] }; for (const id of g.stages) s.games[g.id].stages[id] = { passed: true, tries: 1, bestScore: 100, bestStars: 1, lastDate: new Date().toISOString(), history: [] }; }
    s.bosses = s.bosses || {}; for (const b of ${JSON.stringify(bosses)}) s.bosses[b] = { passed: true, tries: 1, history: [] };
    s.activeSession = null; return s;`, '#arcade');
  const bad = [];
  let n = 0;
  const errBefore = errors.length;
  for (const g of all) for (const id of g.stages) {
    await go(`#play/${g.id}/${id}`);
    n++;
    if (!(await exists(`.playScreen[data-stage="${id}"] .playTable svg`))) bad.push(`${g.id}/${id}`);
  }
  check(bad.length === 0, `all ${n} stages open with a table diagram${bad.length ? ' — missing: ' + bad.join(', ') : ''}`);
  await go('#play/bank/endless');
  check(await exists('.playScreen .hearts'), 'Bank Vault Endless opens with lives');
  const badB = [];
  for (const b of bosses) { await go(`#bossplay/${b}`); if (!(await exists('.playScreen .bossTrack'))) badB.push(b); }
  check(badB.length === 0, `all ${bosses.length} Boss Battles open${badB.length ? ' — missing: ' + badB.join(', ') : ''}`);
  await go('#play/pattern/pp-1');
  check(await exists('.planner[data-planner="pattern"]'), 'Pattern Puzzle starts in planning mode');
  await shot('16-pattern-puzzle');
  await go('#settings');
  await tap('[data-action="set-coach"][data-v="expert"]');
  await go('#play/landing/lz-2');
  check(await exists('.playScreen[data-coach="expert"] .planner'), 'Expert coaching renders the planner');
  await go('#settings');
  await tap('[data-action="set-coach"][data-v="auto"]');
  check(errors.length === errBefore, `stage sweep: no console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ service worker + offline
const swOk = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
  return !!reg && !!reg.active;
});
check(swOk, 'service worker registered and active');
const cacheName = await page.evaluate(async () => (await caches.keys()).join(','));
check(/pool-iq-v4/.test(cacheName), `cache bumped (${cacheName})`);
await page.setOfflineMode(true);
await page.goto(BASE + 'index.html#arcade', { waitUntil: 'domcontentloaded' });
await sleep(800);
check((await page.$$('.gameCard')).length === 14, 'offline reload still renders the Arcade');
await page.setOfflineMode(false);

// ------------------------------------------------------------------------------------------ errors
const rej = await page.evaluate(() => window.__rejections || 0);
check(errors.length === 0, `zero console errors / page errors (${errors.length})`);
check(rej === 0, `zero unhandled promise rejections (${rej})`);
if (errors.length) console.log(errors.join('\n'));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n--- e2e summary ---\n${results.length - failed.length}/${results.length} passed · console errors: ${errors.length}`);
if (failed.length) { console.log('FAILED:\n' + failed.map((f) => ' - ' + f.msg).join('\n')); process.exit(1); }
console.log('ALL E2E CHECKS PASSED');
