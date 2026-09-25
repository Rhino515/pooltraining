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
const ROUTES = ['#sim', '#home', '#career', '#drills', '#analyze', '#arcade', '#profile', '#stats', '#settings', '#ghost', '#game/landing', '#game/bank', '#game/speed', '#play/landing/lz-1', '#play/speed/sp-cal', '#boss/boss-1', '#ghostmatch'];
for (const r of ROUTES) {
  await go(r);
  const t = await text('#view');
  check(t.trim().length > 20, `route ${r} renders`);
}
await go('#drills');
check(await exists('.drillsEmpty[data-empty="1"]'), 'drills route shows the empty state');
const dt = await text('#view');
check(/No drills yet/.test(dt) && /CREATE YOUR FIRST DRILL/i.test(dt) && (await exists('.drillsEmpty [data-action="drill-create"]')), 'empty state offers Create Drill');
check(!/coming soon/i.test(dt) && !(await exists('.drillCard')), 'no fake "Coming Soon" drill cards');
check(errors.length === 0, `drills route: zero console errors (${errors.length})`);
await shot('14-drills-empty-state');

// ------------------------------------------------------------------------------------------ arcade + table
await go('#arcade');
check((await page.$$('.gameCard[data-game]')).length === 14, '14 arcade game cards');
await shot('01-arcade-hub');
await go('#play/landing/lz-1');
for (const cls of ['obj-ball', 'cue-ball', 'zone-ring', 'cue-path', 'ob-path']) check(await exists(`.playTable svg .${cls}`), `landing table SVG has .${cls}`);
const chip = await text('.recipeRow .gauge-speed b');
check(/^Speed \d\.\d$/.test(chip.trim()) && (await exists('.recipeRow .gauge-speed .speed-dial .sd-needle')), `SPEED dial shown ("${chip.trim()}")`);
await shot('02-landing-zone');
/** Diamond grid, setup readout and aim view on the current play screen */
async function gridReport() {
  return page.evaluate(() => {
    const svg = document.querySelector('.playTable svg');
    const gx = [...svg.querySelectorAll('.diamond-grid .grid-x')].map((l) => +l.getAttribute('x1'));
    const gy = [...svg.querySelectorAll('.diamond-grid .grid-y')].map((l) => +l.getAttribute('y1'));
    const sights = [...svg.querySelectorAll('.diamond-sight')].map((c) => [+c.getAttribute('cx'), +c.getAttribute('cy')]);
    const has = (x, y) => sights.some(([a, b]) => Math.abs(a - x) < 1e-6 && Math.abs(b - y) < 1e-6);
    const aligned = gx.every((x) => x === 50 || (has(x, -3) && has(x, 53))) && gy.every((y) => has(-3, y) && has(103, y));
    const felt = svg.querySelector('rect.felt').getBoundingClientRect();
    const bodies = [...svg.querySelectorAll('.ball-body')];
    const bw = bodies.map((b) => b.getBoundingClientRect().width / felt.width);
    const hit = svg.querySelector('.ball-hit')?.getBoundingClientRect();
    const avR = document.querySelector('.gaugeCard .gauge-aim svg')?.getBoundingClientRect();
    const grid = svg.querySelector('.diamond-grid');
    const firstBall = svg.querySelector('g.ball');
    const under = !!grid && !!firstBall && !!(grid.compareDocumentPosition(firstBall) & Node.DOCUMENT_POSITION_FOLLOWING);
    const su = document.querySelector('.setupLine');
    const bar = document.querySelector('.resultBar')?.getBoundingClientRect();
    const sr = su?.getBoundingClientRect();
    const goal = document.querySelector('.goalLine')?.getBoundingClientRect();
    const av = document.querySelector('.gaugeCard .gauge-aim .aim-view');
    const ar = document.querySelector('.gaugeCard')?.getBoundingClientRect();
    return {
      gx: gx.length, gy: gy.length, aligned, under, op: +getComputedStyle(grid).opacity,
      balls: svg.querySelectorAll('g.ball').length, setup: su ? su.querySelectorAll('.su-ball').length : 0,
      setupVisible: !!sr && sr.height > 10 && sr.bottom <= (bar ? bar.top : innerHeight),
      setupText: su?.innerText || '',
      aimCut: av?.dataset.cut ?? null, aimSide: av?.dataset.side ?? null, aimLabel: document.querySelector('.gauge-aim b')?.innerText || '',
      gaugesVisible: !!ar && ar.bottom <= (bar ? bar.top : innerHeight),
      goalVisible: !!goal && goal.bottom <= (bar ? bar.top : innerHeight),
      noScroll: document.documentElement.scrollHeight <= innerHeight + 1,
      ballR: [...new Set(bodies.map((b) => +b.getAttribute('r')))], ballFrac: Math.max(...bw.map((w) => Math.abs(w - 0.0225))), ballPx: bodies[0]?.getBoundingClientRect().width || 0,
      hitPx: hit?.width || 0, feltPx: felt.width, aimViewPx: avR?.width || 0
    };
  });
}
{
  const g = await gridReport();
  check(g.gx === 7 && g.gy === 3 && g.aligned, `stage: diamond grid 7 + 3 lines aligned with the rail diamonds (${g.gx}+${g.gy})`);
  check(g.under && g.op > 0 && g.op < 0.4, `stage: grid faint (opacity ${g.op}) and under the balls`);
  check(g.setup === g.balls && g.setup >= 2 && g.setupVisible && /2¼ · 1¾/.test(g.setupText), `stage: setup readout shows every ball in diamonds ("${g.setupText.replace(/\s+/g, ' ')}")`);
  check(g.aimCut === '30' && g.aimSide === 'right' && /Right ½/.test(g.aimLabel) && g.gaugesVisible, `stage: Aim View on the 30° cut ("${g.aimLabel}", ${g.aimCut}°, ${g.aimSide})`);
  check(g.goalVisible && g.noScroll, '390×844: table, gauges, instructions and score buttons fit without scrolling');
  check(g.ballR.length === 1 && g.ballR[0] === 1.125 && g.ballFrac < 0.0015, `stage: balls drawn at true scale (r ${g.ballR}, ${g.ballPx.toFixed(1)}px on a ${g.feltPx.toFixed(0)}px playing surface = ${((g.ballPx / g.feltPx) * 100).toFixed(2)}% of length, want 2.25%)`);
  check(g.hitPx >= 2.5 * g.ballPx && g.aimViewPx >= 48, `stage: invisible tap area larger than the ball (${g.hitPx.toFixed(0)}px) and Aim View gauge still large (${g.aimViewPx.toFixed(0)}px)`);
  if (SHOTS) {
    const el = await page.$('.recipeRow');
    await el.screenshot({ path: path.join(SHOTS, '02b-gauge-panel-closeup.png') });
    const t = await page.$('.playTable');
    await t.screenshot({ path: path.join(SHOTS, '02c-grid-closeup.png') });
  }
  await tap('.setupLine');
  await page.waitForSelector('#sheet .setupSheet', { timeout: 3000 });
  const conv = await text('#sheet .setupSheet');
  check(/head rail/.test(conv) && /top rail/.test(conv) && /4 · 2 is the center spot/.test(conv) && (await page.$$('#sheet .su-row')).length === g.balls, 'setup sheet explains the diamond convention and lists every ball');
  await shot('02d-setup-sheet');
  await tap('#sheet [data-action="sheet-close"]');
}
// drill template renders with grid + setup + aim view (library ships empty, so build the README template in-page)
{
  const d = await page.evaluate(async () => {
    const { normalizeDrill } = await import('./js/drills.js');
    const { renderStageTable } = await import('./js/games/stageTable.js');
    const rc = await import('./js/games/recipe.js');
    const t = normalizeDrill({ id: 'e2e-tmpl', name: 'Template', category: 'Stop Shots', difficulty: 2, kind: 'position', ob: [1, 60, 25], pocket: 'TR', cut: [30, 1, 24], k: 0, travel: 0, scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } }, skillEffects: { 'Cue-Ball Control': 1 } });
    const div = document.createElement('div');
    div.id = 'e2eTmpl';
    div.innerHTML = renderStageTable(t, { className: 'table-diagram mini' }) + rc.setupLineHTML(t) + rc.recipeGaugesHTML(t);
    document.body.appendChild(div);
    const r = { grid: div.querySelectorAll('.diamond-grid line').length, setup: div.querySelectorAll('.su-ball').length, aim: div.querySelector('.aim-view')?.dataset.cut, gauges: div.querySelectorAll('.gauge').length };
    div.remove();
    return r;
  });
  check(d.grid === 10 && d.setup === 2 && Math.abs(+d.aim - 30) <= 1 && d.gauges === 3, `drill template: grid (${d.grid} lines), setup (${d.setup} balls), Aim View (${d.aim}°), ${d.gauges} gauges`);
}
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
{
  const g = await gridReport();
  check(g.gx === 7 && g.gy === 3 && g.aligned && g.setup === g.balls && g.aimCut != null, `bank stage: grid, setup readout and Aim View ("${g.aimLabel}")`);
}
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
check(!(await exists('.recipeRow')) && !(await exists('.aim-view[data-cut]')), 'advanced: recipe and Aim View hidden before locking');
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
check(await exists('.recipeRow .gauge-aim .aim-view[data-cut]'), 'advanced: Aim View revealed after locking');
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
{
  const g = await gridReport();
  check(g.gx === 7 && g.gy === 3 && g.aligned && g.under, 'boss shot: diamond grid aligned with the diamonds');
  check(g.setup === g.balls && g.setupVisible, `boss shot: setup readout visible (${g.setupText.replace(/\s+/g, ' ')})`);
  check(g.aimCut != null && g.aimLabel.length > 0 && g.gaugesVisible, `boss shot: Aim View rendered ("${g.aimLabel}", ${g.aimCut}°)`);
  check(g.goalVisible && g.noScroll, 'boss shot: no scrolling needed for the score buttons');
  await shot('11a-boss-shot-grid');
}
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
{
  const g = await gridReport();
  check(g.gx === 7 && g.setupVisible && g.gaugesVisible && g.goalVisible && g.noScroll && g.aimCut != null, '375×667: grid, setup readout, gauges, instructions and score buttons visible without scrolling');
}
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
  const noGrid = [];
  let n = 0;
  const errBefore = errors.length;
  for (const g of all) for (const id of g.stages) {
    await go(`#play/${g.id}/${id}`);
    n++;
    if (!(await exists(`.playScreen[data-stage="${id}"] .playTable svg`))) bad.push(`${g.id}/${id}`);
    else if ((await page.$$('.playTable svg .diamond-grid line')).length !== 10 || !(await exists('.setupLine .su-ball'))) noGrid.push(`${g.id}/${id}`);
  }
  check(bad.length === 0, `all ${n} stages open with a table diagram${bad.length ? ' — missing: ' + bad.join(', ') : ''}`);
  check(noGrid.length === 0, `all stages show the diamond grid and setup readout${noGrid.length ? ' — missing: ' + noGrid.join(', ') : ''}`);
  await go('#play/bank/endless');
  check(await exists('.playScreen .hearts'), 'Bank Vault Endless opens with lives');
  const badB = [];
  for (const b of bosses) { await go(`#bossplay/${b}`); if (!(await exists('.playScreen .bossTrack')) || (await page.$$('.playTable svg .diamond-grid line')).length !== 10) badB.push(b); }
  check(badB.length === 0, `all ${bosses.length} Boss Battles open with the diamond grid${badB.length ? ' — missing: ' + badB.join(', ') : ''}`);
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

// ------------------------------------------------------------------------------------------ Shot Simulator
{
  const errBefore = errors.length;
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.evaluate(() => { localStorage.removeItem('poolIQSimV1'); });
  await go('#home');
  check(await exists('.simPromo[data-href="#sim"], .simPromo'), 'home shows the Shot Simulator card');
  check(await exists('nav [data-page="sim"]'), 'bottom nav has the Simulator tab');
  await tap('nav [data-page="sim"]');
  await sleep(300);
  check(await exists('.simScreen[data-mode="edit"] #simSvg'), 'Shot Simulator opens in edit mode with the table');
  check(/Shot Simulator/.test(await text('.simHead')), 'screen is titled "Shot Simulator"');
  const simInfo = await page.evaluate(() => ({
    grid: document.querySelectorAll('#simSvg .diamond-grid line').length,
    balls: document.querySelectorAll('#simSvg g.ball').length,
    r: [...document.querySelectorAll('#simSvg g.ball circle.ball-body')].map((c) => +c.getAttribute('r')),
    setup: document.querySelectorAll('#simSetup .su-ball').length,
    aimView: !!document.querySelector('.simAim svg'),
    shoot: document.querySelector('.shootBtn')?.getBoundingClientRect().height || 0,
    sh: document.documentElement.scrollWidth, vw: innerWidth,
  }));
  check(simInfo.grid >= 10 && simInfo.balls >= 2 && simInfo.r.every((r) => r === 1.125) && simInfo.setup === simInfo.balls, `simulator: true-scale balls on the diamond grid with SETUP readout (${simInfo.balls} balls, ${simInfo.grid} grid lines)`);
  check(simInfo.aimView && simInfo.shoot >= 50 && simInfo.sh <= simInfo.vw, `simulator: Aim View, big SHOOT button (${Math.round(simInfo.shoot)}px), no sideways scroll`);
  const tablePt = (x, y) => page.evaluate((x, y) => { const svg = document.querySelector('#simSvg'); const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; }, x, y);
  const simSt = () => page.evaluate(() => { const s = window.PoolIQ.screen; const st = s.state; return { balls: st.balls, shot: st.shot, mode: st.mode, undo: s.undoDepth, redo: s.redoDepth, res: st.res ? { dur: st.res.duration, pocketed: st.res.pocketed } : null, playT: st.playT, playing: st.playing }; });
  // drag the cue ball with a touch-style drag
  let s0 = await simSt();
  const cue0 = s0.balls.find((b) => b.id === 'cue');
  const scroll0 = await page.evaluate(() => scrollY);
  const a = await tablePt(cue0.x, cue0.y);
  const bpt = await tablePt(cue0.x + 6.25, cue0.y + 6.25);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let k = 1; k <= 8; k++) { await page.mouse.move(a.x + ((bpt.x - a.x) * k) / 8, a.y + ((bpt.y - a.y) * k) / 8); await sleep(16); }
  const bubble = await page.$eval('#dragBubble', (e) => e.classList.contains('show') && e.textContent).catch(() => '');
  await page.mouse.up();
  await sleep(200);
  let s1 = await simSt();
  const cue1 = s1.balls.find((b) => b.id === 'cue');
  check(Math.hypot(cue1.x - cue0.x - 6.25, cue1.y - cue0.y - 6.25) < 0.8 && (await page.evaluate(() => scrollY)) === scroll0, `drag moves the cue ball (${cue0.x},${cue0.y} → ${cue1.x},${cue1.y}) without scrolling the page`);
  check(!!bubble && /Cue/.test(bubble), `drag shows a live position bubble ("${bubble}")`);
  check(s1.undo > s0.undo, 'ball move is undoable');
  await tap('[data-action="sim-undo"]');
  let s2 = await simSt();
  check(s2.balls.find((b) => b.id === 'cue').x === cue0.x && s2.redo >= 1, 'undo puts the ball back');
  await tap('[data-action="sim-redo"]');
  s2 = await simSt();
  check(s2.balls.find((b) => b.id === 'cue').x === cue1.x, 'redo re-applies the move');
  // aim: tap the 1-ball → throw-compensated aim at a pocket; nudge
  const ob = s2.balls.find((b) => b.id !== 'cue');
  const obp = await tablePt(ob.x, ob.y);
  await page.mouse.click(obp.x, obp.y);
  await sleep(200);
  const aim1 = (await simSt()).shot.aim;
  const aimTxt = await text('.simAim');
  check(/cut|straight/i.test(aimTxt) && (await exists('#simUnder .aim-ghost')), `tapping a ball aims at it with a ghost ball ("${aimTxt.replace(/\s+/g, ' ').slice(0, 60)}")`);
  await tap('[data-action="sim-nudge"][data-v="1"]');
  const aim2 = (await simSt()).shot.aim;
  check(Math.abs(aim2 - aim1) > 0.05, `nudge fine-tunes the aim (${aim1} → ${aim2})`);
  await page.mouse.click(obp.x, obp.y);
  await sleep(150);
  await page.mouse.click(obp.x, obp.y);
  await sleep(150);
  // speed
  await tap('[data-action="sim-speed"][data-v="0.5"]');
  const spd = (await simSt()).shot.speed;
  check(spd > 0, `speed control (${spd})`);
  await shot('20-sim-edit');
  // shoot
  await tap('.shootBtn');
  check((await simSt()).mode === 'play', 'SHOOT starts the animation');
  await page.waitForFunction(() => { const st = window.PoolIQ.screen.state; return st.mode === 'play' && !st.playing && st.res && st.playT >= st.res.duration - 1e-6; }, { timeout: 20000 }).catch(() => {});
  const played = await simSt();
  check(played.res && played.playT >= played.res.dur - 1e-6, `animation runs to the end (${played.res?.dur.toFixed(2)} s simulated)`);
  const tracks = await page.$$eval('#simTracks polyline.track', (els) => els.map((e) => ({ b: e.dataset.ball, c: getComputedStyle(e).stroke, n: e.getAttribute('points').split(' ').length })));
  check(tracks.length >= 2 && new Set(tracks.map((t) => t.c)).size >= 2 && tracks.every((t) => t.n >= 2), `coloured track lines for each moved ball (${tracks.map((t) => t.b).join(',')})`);
  check(await exists('.simResult[data-done="1"]'), `result panel after the shot ("${(await text('.simResult')).replace(/\s+/g, ' ').slice(0, 70)}")`);
  await shot('21-sim-played');
  await tap('[data-action="sim-tracks"]');
  check((await page.$$('#simTracks polyline.track')).length === 0, 'tracks toggle hides the lines');
  await tap('[data-action="sim-tracks"]');
  check((await page.$$('#simTracks polyline.track')).length >= 2, 'tracks toggle shows them again');
  await tap('[data-action="sim-rate"]');
  await tap('[data-action="sim-replay"]');
  const rp = await simSt();
  check(rp.playT < played.res.dur, 'replay restarts the animation');
  await tap('[data-action="sim-end"]');
  await sleep(150);
  const ended = await simSt();
  check(ended.playT >= played.res.dur - 1e-6, 'skip-to-end jumps to the final position');
  // continue next shot
  const finals = await page.evaluate(() => window.PoolIQ.screen.state.res.final.filter((b) => b.on).map((b) => [b.id, +b.x.toFixed(2), +b.y.toFixed(2)]));
  await tap('[data-action="sim-continue"]');
  const cont = await simSt();
  const same = finals.every(([id, x, y]) => { const b = cont.balls.find((q) => q.id === id); return b && Math.abs(b.x - x) < 0.02 && Math.abs(b.y - y) < 0.02; });
  check(cont.mode === 'edit' && same, `Continue with next shot starts from the end position (${cont.balls.length} balls)`);
  await tap('[data-action="sim-undo"]');
  check((await simSt()).balls.find((b) => b.id === 'cue').x === cue1.x, 'undo after Continue returns to the pre-shot layout');
  // random 9-ball rack via Actions
  await tap('[data-action="sim-actions"]');
  check(await exists('#sheet .actBtn[data-action="sim-rack"][data-g="9"]') && (await exists('#sheet .actBtn[data-action="sim-random"][data-g="10"]')), 'Actions menu lists racks and random layouts');
  await shot('22-sim-actions');
  await tap('#sheet .actBtn[data-action="sim-random"][data-g="9"]');
  const r9 = await simSt();
  const obs = r9.balls.filter((b) => b.id !== 'cue');
  let minGap = 99;
  for (let i = 0; i < r9.balls.length; i++) for (let j = i + 1; j < r9.balls.length; j++) minGap = Math.min(minGap, Math.hypot(r9.balls[i].x - r9.balls[j].x, r9.balls[i].y - r9.balls[j].y));
  check(obs.length === 9 && obs.every((b) => +b.id >= 1 && +b.id <= 9) && minGap >= 2.25, `random 9-ball layout: 9 balls, non-overlapping (min gap ${minGap.toFixed(2)}")`);
  await tap('[data-action="sim-actions"]');
  await tap('#sheet .actBtn[data-action="sim-rack"][data-g="9"]');
  const rk = await simSt();
  check(rk.balls.length === 10, 'racked 9-ball layout');
  await shot('23-sim-9ball-rack');
  // save & reopen
  await tap('[data-action="sim-actions"]');
  await tap('#sheet .actBtn[data-action="sim-save"]');
  await page.$eval('#simSaveName', (e) => { e.value = 'E2E rack'; });
  await tap('#sheet [data-action="sim-save-do"]');
  const lib = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQSimV1')).shots.map((s) => s.name));
  check(lib.includes('E2E rack'), `shot saved to the library (${lib.join(', ')})`);
  await tap('[data-action="sim-actions"]');
  await tap('#sheet .actBtn[data-action="sim-clear"]');
  check((await simSt()).balls.length <= 1, 'Clear table empties the object balls');
  await tap('[data-action="sim-actions"]');
  await tap('#sheet .actBtn[data-action="sim-library"]');
  check(await exists('#sheet .libItem'), 'library sheet lists saved shots');
  await shot('24-sim-library');
  await tap('#sheet .libItem [data-action="lib-open"]');
  check((await simSt()).balls.length === 10, 'opening the saved shot restores the rack');
  // share link
  await tap('[data-action="sim-actions"]');
  await tap('#sheet .actBtn[data-action="sim-share"]');
  await sleep(300);
  const link = await page.evaluate(() => window.PoolIQ.screen.state.lastShareUrl || '');
  check(/#sim\/s=[\w-]+/.test(link), `share link encodes the layout in the URL (${link.length} chars)`);
  await page.evaluate(() => { const sh = document.querySelector('#sheetWrap, .sheetWrap.show'); if (sh) sh.classList.remove('show'); });
  await go('#home');
  await page.evaluate(() => localStorage.removeItem('poolIQSimV1'));
  await page.goto(link.replace(/^https?:\/\/[^/]+\/(pooltraining\/)?/, BASE), { waitUntil: 'networkidle0' });
  await sleep(500);
  const shared = await simSt().catch(() => null);
  check(shared && shared.balls.length === 10 && /#sim$/.test(await page.evaluate(() => location.hash)), 'opening the share link on a fresh device loads the same layout');
  // png / todrill buttons exist
  await tap('[data-action="sim-actions"]');
  check(await exists('#sheet .actBtn[data-action="sim-png"]') && (await exists('#sheet .actBtn[data-action="sim-todrill"]')) && (await exists('#sheet .actBtn[data-action="sim-find"]')), 'Actions: Export PNG, Turn into drill, Find a Shot available');
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  // small phone
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await go('#home');
  await go('#sim');
  await sleep(300);
  const sm = await page.evaluate(() => { const b = document.querySelector('.shootBtn').getBoundingClientRect(); const t = document.querySelector('#simSvg').getBoundingClientRect(); return { bar: b.bottom <= innerHeight + 1, h: b.height, tw: t.right <= innerWidth + 1, sw: document.documentElement.scrollWidth <= innerWidth }; });
  check(sm.bar && sm.h >= 44 && sm.tw && sm.sw, '375×667: simulator table fits, SHOOT bar on screen');
  await shot('25-sim-375');
  await tap('.shootBtn');
  await page.waitForFunction(() => { const st = window.PoolIQ.screen.state; return st.res && !st.playing; }, { timeout: 20000 }).catch(() => {});
  const pb2 = await page.evaluate(() => { const r = [...document.querySelectorAll('.simBar.play button')].map((b) => b.getBoundingClientRect()); return { onScreen: r.every((q) => q.bottom <= innerHeight + 1), minH: Math.min(...r.map((q) => q.height)) }; });
  check(pb2.onScreen && pb2.minH >= 44, `375×667: playback controls on screen, ≥44px (${Math.round(pb2.minH)}px)`);
  await shot('26-sim-375-played');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  check(errors.length === errBefore, `simulator: zero console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ Create Drill
{
  const errBefore = errors.length;
  await go('#drills');
  check(await exists('.createDrill[data-action="drill-create"]'), 'Drills page has a prominent CREATE DRILL button');
  await tap('.createDrill');
  await sleep(300);
  check(await exists('.builderScreen[data-builder="new"] #dbTable svg'), 'Create Drill opens the builder with the table');
  check((await page.$$('#dbTable svg .diamond-grid line')).length >= 10 && (await exists('#dbSetup .su-ball')), 'builder table has the grid and SETUP readout');
  await shot('30-builder');
  // save without title → friendly error
  await tap('[data-action="db-save"]');
  const msg = await text('#dbMsgs');
  check(/title/i.test(msg) && (await exists('.builderScreen')), `validation blocks saving without a title ("${msg.replace(/\s+/g, ' ').slice(0, 60)}")`);
  // add a ball, set title + details
  await tap('[data-action="db-ball"][data-n="2"]');
  await page.$eval('#db-title', (e) => { e.value = 'E2E Stop Shot'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#db-instructions', (e) => { e.value = 'Pocket the 1 and hold the cue ball in the zone.'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.$eval('#db-why', (e) => { e.value = 'Custom coach note from e2e.'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await tap('[data-action="db-zone-add"]');
  check((await page.$$('#dbTable svg .zone-ring')).length >= 1, 'landing zone added with star rings');
  check(await exists('#dbTable svg .cue-path') && (await exists('#dbTable svg .ob-path')), 'builder shows the computed cue and object-ball paths');
  await tap('[data-action="db-preview"]');
  check(await exists('#sheet .previewTable svg'), 'Preview shows how the drill will look');
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  await shot('31-builder-filled');
  await tap('[data-action="db-save"]');
  await sleep(300);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1') || '{"drills":[]}').drills);
  check(saved.length === 1 && saved[0].name === 'E2E Stop Shot' && saved[0].ballPositions.length === 2 && saved[0].cueBallPosition && saved[0].speed && saved[0].scoringRules && saved[0].whyExplanation, 'drill saved in the structured challenge format');
  check(/#drills/.test(await page.evaluate(() => location.hash)) && (await exists(`.drill[data-drill="${saved[0].id}"]`)), 'saved drill appears in the Drills library');
  await shot('32-drills-library');
  // play & score
  await tap(`.drill[data-drill="${saved[0].id}"] [data-action="go"]`);
  await sleep(300);
  const pd = await page.evaluate(() => ({
    grid: document.querySelectorAll('.playTable svg .diamond-grid line').length,
    setup: document.querySelectorAll('.setupLine .su-ball').length,
    gauges: document.querySelectorAll('.gaugeCard .gauge').length,
    aim: !!document.querySelector('.gauge-aim'),
    btns: document.querySelectorAll('.resultBar .rb[data-action="record"]').length,
    fit: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1,
    noScroll: document.documentElement.scrollHeight <= innerHeight + 2,
  }));
  check(pd.grid === 10 && pd.setup >= 3 && pd.gauges === 3 && pd.aim, `custom drill plays with grid, SETUP (${pd.setup}), 3 gauges incl. Aim View`);
  check(pd.btns >= 2 && pd.fit && pd.noScroll, `custom drill: score buttons on screen, no scrolling (${pd.btns} buttons)`);
  await shot('33-custom-drill-play');
  await page.$$eval('[data-action="why-open"]', (els) => els[0]?.click());
  await sleep(200);
  check(/Custom coach note from e2e/.test(await text('#sheet')), 'Why sheet shows the custom coach note');
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  await recordLast(12);
  check(await exists('.resultPanel'), 'scoring the custom drill reaches the result screen');
  const stD = await getState();
  check(!!stD.games?.drills?.stages?.[saved[0].id]?.history?.length, 'custom drill result saved to history');
  await go('#drills');
  check(/Best \d+ pts/.test(await text(`.drill[data-drill="${saved[0].id}"]`)), 'drill card shows the personal best');
  // small phone check of the custom drill
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await go(`#play/drills/${saved[0].id}`);
  await sleep(250);
  if (await exists('.resultPanel')) await tap('[data-action="retry"]').catch(() => {});
  const pdS = await page.evaluate(() => ({ fit: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1, noScroll: document.documentElement.scrollHeight <= innerHeight + 2, aim: !!document.querySelector('.gauge-aim') }));
  check(pdS.fit && pdS.noScroll && pdS.aim, '375×667: custom drill score screen fits without scrolling');
  await shot('34-custom-drill-375');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  // edit
  await go('#drills');
  await tap(`.drill[data-drill="${saved[0].id}"] [data-action="drill-edit"]`);
  await sleep(300);
  check(await exists('.builderScreen[data-builder="edit"]') && (await page.$eval('#db-title', (e) => e.value)) === 'E2E Stop Shot', 'Edit reopens the builder with the drill');
  await page.$eval('#db-title', (e) => { e.value = 'E2E Stop Shot v2'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await tap('[data-action="db-save"]');
  await sleep(300);
  const saved2 = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1')).drills);
  check(saved2.length === 1 && saved2[0].id === saved[0].id && saved2[0].name === 'E2E Stop Shot v2', 'edit saves in place (same id)');
  // duplicate + delete
  await tap(`.drill[data-drill="${saved[0].id}"] [data-action="drill-dup"]`);
  await sleep(200);
  check((await page.$$('.drill[data-custom], .drill .tag.mine')).length === 2, 'Duplicate adds a copy');
  await tap(`.drill[data-drill="${saved[0].id}"] [data-action="drill-del"]`);
  check(/Delete/i.test(await text('#sheet')), 'Delete asks for confirmation');
  await tap('#sheet [data-action="drill-del-do"]');
  await sleep(200);
  const saved3 = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1')).drills);
  check(saved3.length === 1 && !saved3.some((d) => d.id === saved[0].id) && !(await exists(`.drill[data-drill="${saved[0].id}"]`)), 'confirmed delete removes the drill');
  check(errors.length === errBefore, `Create Drill: zero console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ Ghost rules + 8-Ball Ghost
{
  const errBefore = errors.length;
  await inject('s.ghostUnlockFloor = 9; s.activeGhost = null; return s;', '#ghost/3/5');
  const fitG = () => page.evaluate(() => { const bar = document.querySelector('.resultBar')?.getBoundingClientRect(); const rl = document.querySelector('.ruleLine')?.getBoundingClientRect(); const btns = [...document.querySelectorAll('.resultBar button')].map((x) => x.getBoundingClientRect().height); return { ok: !!bar && bar.bottom <= innerHeight + 1 && !!rl && rl.bottom <= bar.top + 1 && document.documentElement.scrollHeight <= innerHeight + 2, minH: Math.min(...btns) }; });
  check(/in order: 1, 2, 3/.test(await text('.ghostSetup .ruleBox')), 'Ghost setup (3-ball) states the numerical-order rule');
  await tap('[data-action="ghost-start"]');
  const r3 = await text('.ruleLine');
  check(/in order: 1, 2, 3\./.test(r3) && /out of order = Ghost wins/.test(r3) && /ALL IN ORDER/.test(await text('.resultBar')), `3-ball in-game rule visible ("${r3.replace(/\s+/g, ' ')}")`);
  let f = await fitG();
  check(f.ok && f.minH >= 44, `390×844: 3-ball rule + score buttons visible without scrolling (${Math.round(f.minH)}px)`);
  await shot('40-ghost-3ball-rules');
  await tap('[data-action="ghost-rules"]');
  check(/lowest number first/.test(await text('#sheet')), 'RULES sheet explains lowest number first');
  await tap('#sheet [data-action="sheet-close"]');
  await go('#ghost/9/5');
  check(/1, 2, 3, 4, 5, 6, 7, 8, 9/.test(await text('.ghostSetup .ruleBox')), 'Ghost setup (9-ball) lists 1…9 in order');
  await tap('[data-action="ghost-start"]');
  check(/1, 2, 3, 4, 5, 6, 7, 8, 9\./.test(await text('.ruleLine')), '9-ball in-game rule lists 1…9 in order');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(200);
  f = await fitG();
  check(f.ok && f.minH >= 44, '375×667: 9-ball rule + score buttons visible without scrolling');
  await shot('41-ghost-9ball-375');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  // 8-Ball Ghost: custom ball count saves and scores
  await go('#ghost');
  await tap('[data-action="ghost-mode"][data-v="eight"]');
  check(await exists('.ghostSetup[data-mode="eight"] .lvlOpt[data-v="pro"]'), '8-Ball Ghost setup shows Beginner / Intermediate / Advanced / Pro / Custom');
  await tap('[data-action="ghost-level"][data-v="custom"]');
  await tap('[data-action="ghost-group"][data-v="4"]');
  await tap('[data-action="ghost-race"][data-v="3"]');
  await shot('42-eight-ghost-setup');
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(300);
  check((await exists('.ghostSetup[data-mode="eight"] .lvlOpt.active[data-v="custom"]')) && (await exists('.ballOpt.active[data-v="4"]')), '8-Ball Ghost ball-count selection is remembered after reload');
  check(/your 4 balls in any order, then the 8 in a called pocket/.test(await text('.ruleBox')), '8-Ball Ghost rules stated plainly on the setup screen');
  await tap('[data-action="ghost-start8"]');
  check(/8-Ball Ghost · 4 \+ 8/.test(await text('.phTitle')) && /any order/.test(await text('.ruleLine')), '8-Ball Ghost match shows the ball count and rule in-game');
  f = await fitG();
  check(f.ok && f.minH >= 44, '390×844: 8-Ball Ghost score buttons visible without scrolling');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  await tap('[data-action="ghost-rack"][data-v="L"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  st = await getState();
  const m8 = st.ghostMatches[st.ghostMatches.length - 1];
  check(m8 && m8.mode === 'eight' && m8.group === 4 && m8.won && m8.you === 3 && (await exists('.ghostMatch[data-over="1"]')), '8-Ball Ghost match scored and saved with its ball count (3–1)');
  await tap('[data-action="ghost-undo"]');
  st = await getState();
  check(!st.ghostMatches.some((m) => m.id === m8.id), '8-Ball Ghost undo reopens the match');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  // Pro
  await go('#ghost');
  await tap('[data-action="ghost-level"][data-v="pro"]');
  check(/you break/i.test(await text('.ruleBox')) && /8 on the break = you win the rack/.test(await text('.ruleBox')), 'Pro setup states the break + house rule');
  await tap('[data-action="ghost-start8"]');
  check(await exists('.ghostMatch[data-phase="break"]') && /Break/.test(await text('.ruleLine')), 'Pro match starts with the break');
  f = await fitG();
  check(f.ok && f.minH >= 44, `390×844: Pro break screen fits without scrolling (${Math.round(f.minH)}px)`);
  await tap('[data-action="ghost-bmade"][data-v="1"]');
  await tap('[data-action="ghost-bmade"][data-v="1"]');
  await shot('43-eight-ghost-pro-break');
  await tap('[data-action="ghost-break"][data-v="ok"]');
  check(await exists('.ghostMatch[data-phase="run"]') && /solids or stripes/.test(await text('.ruleLine')), 'Pro: after the break → ball in hand run-out with open-table rule');
  await tap('[data-action="ghost-undo"]');
  check(await exists('.ghostMatch[data-phase="break"]'), 'Pro: undo returns to the break');
  await tap('[data-action="ghost-break"][data-v="ok"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  await tap('[data-action="ghost-break"][data-v="eight"]');
  await tap('[data-action="ghost-break"][data-v="scratch"]');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(200);
  f = await fitG();
  check(f.ok && f.minH >= 44, '375×667: Pro break screen fits without scrolling');
  await shot('44-eight-ghost-pro-375');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await tap('[data-action="ghost-break"][data-v="ok"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  st = await getState();
  const mp = st.ghostMatches[st.ghostMatches.length - 1];
  check(mp && mp.level === 'pro' && mp.won && mp.breaks.length === 4 && mp.breaks[0].made === 2 && mp.breaks[1].eight && mp.breaks[2].scratch, 'Pro match saved with break log (2 made, 8 on break, scratch)');
  await go('#ghost');
  check(/8-Ball Ghost · Pro/.test(await text('#ghostHistory')), 'Ghost history lists 8-Ball Ghost matches');
  await tap('[data-action="go"][data-href="#sim/eight/pro"]');
  await sleep(400);
  const simBalls = await page.evaluate(() => window.PoolIQ.screen?.state?.balls?.length || 0);
  check(simBalls === 16, `Set up in Shot Simulator opens a 15-ball rack for Pro (${simBalls} balls incl. cue)`);
  check(errors.length === errBefore, `Ghost rules / 8-Ball Ghost: zero console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ service worker + offline
const swOk = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
  return !!reg && !!reg.active;
});
check(swOk, 'service worker registered and active');
const cacheName = await page.evaluate(async () => (await caches.keys()).join(','));
check(/pool-iq-v7/.test(cacheName) && !/pool-iq-v6/.test(cacheName), `cache bumped to v7 (${cacheName})`);
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
