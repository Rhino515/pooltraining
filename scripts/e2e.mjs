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
const dt = await text('#view');
check(await exists('.drill.card[data-drill="three-lane-speed"]') && /Three-Lane Speed Exercise/.test(dt) && !(await exists('.drillsEmpty')), 'drill library shows the built-in Three-Lane Speed Exercise (no empty state)');
check(await exists('[data-action="drill-create"]') && /CREATE DRILL/i.test(dt), 'drill library still offers Create Drill');
check(!/coming soon/i.test(dt), 'no fake "Coming Soon" drill cards');
check(errors.length === 0, `drills route: zero console errors (${errors.length})`);
await shot('14-drills-library');

// ------------------------------------------------------------------------------------------ arcade + table
await go('#arcade');
check((await page.$$('.gameCard[data-game]')).length === 14, '14 Table Games cards');
await shot('01-arcade-hub');
await go('#play/landing/lz-1');
for (const cls of ['obj-ball', 'cue-ball', 'zone-ring', 'cue-path', 'ob-path']) check(await exists(`.playTable svg .${cls}`), `landing table SVG has .${cls}`);
const chip = await text('.recipeRow .gauge-speed b');
check(/^Speed \d\.\d\d$/.test(chip.trim()) && (await exists('.recipeRow .gauge-speed .speed-dial .sd-needle')), `SPEED dial shown ("${chip.trim()}")`);
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
// v11: the boss is the Promotion Test — locked until Rank XP is full and the Rookie Skill Gate is cleared
check(await exists('.promoCard[data-promo="locked"]') && !(await exists('[data-href="#boss/boss-1"][data-action="go"].miniBtn')), 'v11: Promotion Test locked before Rank XP + Skill Gate');
await inject(`s.prog = s.prog || {}; s.prog.rankXpBy = { ...(s.prog.rankXpBy || {}), 0: 1000 }; s.prog.gatesCleared = { ...(s.prog.gatesCleared || {}), 'g-rookie': Date.now() }; return s;`, '#career');
check(await exists('.promoCard[data-promo="unlocked"]'), 'v11: Promotion Test unlocks when every promotion requirement is met');
await shot('v11-promotion-unlocked');
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
    ft: document.querySelector('.simScreen')?.dataset.tableFt,
    sizes: [...document.querySelectorAll('[data-action="sim-size"]')].map((b) => b.dataset.ft).join(','),
    aim: !!document.querySelector('.simAim, [data-action="sim-nudge"]'),
    shoot: document.querySelector('.shootBtn')?.getBoundingClientRect().height || 0,
    sh: document.documentElement.scrollWidth, vw: innerWidth,
    drag: document.querySelector('.simScreen')?.dataset.offsetDrag,
  }));
  const r8 = 1.125 / 0.88;
  check(simInfo.grid >= 10 && simInfo.balls >= 2 && simInfo.ft === '8' && simInfo.sizes === '7,8,9' && simInfo.r.every((r) => Math.abs(r - r8) < 0.03), `simulator: 8 ft table, diamond grid, ball radius follows the bed (${simInfo.r.join(',')})`);
  check(!simInfo.aim && simInfo.drag === '1' && simInfo.shoot >= 44 && simInfo.sh <= simInfo.vw, `simulator: no aim-degree controls, offset drag on, big SHOOT (${Math.round(simInfo.shoot)}px), no sideways scroll`);
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
  const lifted = await page.evaluate((x, y) => { const svg = document.querySelector('#simSvg'); const p = svg.createSVGPoint(); p.x = x; p.y = y - 72; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return { x: q.x, y: q.y }; }, bpt.x, bpt.y);
  const finger = await page.evaluate((x, y) => { const svg = document.querySelector('#simSvg'); const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return { x: q.x, y: q.y }; }, bpt.x, bpt.y);
  check(Math.hypot(cue1.x - cue0.x, cue1.y - cue0.y) > 1 && cue1.y < finger.y - 0.4 && (await page.evaluate(() => scrollY)) === scroll0, `offset drag lifts the cue ball above the finger (${cue0.x},${cue0.y} → ${cue1.x},${cue1.y}; finger ${finger.y.toFixed(1)}, lift target ${lifted.y.toFixed(1)}) without scrolling`);
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
  check((await exists('#simUnder .aim-ghost')) && (await page.$$('[data-action="sim-nudge"]')).length === 0, 'tapping a ball aims at it with a ghost ball, and the degree buttons are gone');
  const felt = await tablePt(12, 40);
  await page.mouse.move(felt.x, felt.y);
  await page.mouse.down();
  await page.mouse.move(felt.x + 48, felt.y - 24);
  await page.mouse.up();
  await sleep(150);
  const aim2 = (await simSt()).shot.aim;
  check(Math.abs(aim2 - aim1) > 0.05, `dragging the felt changes the aim (${aim1} → ${aim2})`);
  await page.mouse.click(obp.x, obp.y);
  await sleep(150);
  await page.mouse.click(obp.x, obp.y);
  await sleep(150);
  // speed
  await tap('[data-action="sim-speed"][data-v="0.25"]');
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
  const pb2 = await page.evaluate(() => { const r = [...document.querySelectorAll('.simBar.play button')].map((b) => b.getBoundingClientRect()); return { onScreen: r.every((q) => q.bottom <= innerHeight + 1), minH: r.length ? Math.min(...r.map((q) => q.height)) : 0, n: r.length, mode: document.querySelector('.simScreen')?.dataset.mode || '' }; });
  check(pb2.onScreen && pb2.minH >= 44, `375×667: playback controls on screen, ≥44px (${Math.round(pb2.minH)}px, ${pb2.n} buttons, mode ${pb2.mode})`);
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
  await tap('[data-action="ghost-break"][data-v="ok"]');
  check(await exists('.ghostMatch[data-phase="run"]') && /solids or stripes/.test(await text('.ruleLine')), 'Pro: after the break → ball in hand run-out with open-table rule');
  await tap('[data-action="ghost-undo"]');
  check(await exists('.ghostMatch[data-phase="break"]'), 'Pro: undo returns to the break');
  await tap('[data-action="ghost-break"][data-v="ok"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  await tap('[data-action="ghost-break"][data-v="eight"]');
  check(/Scratch on the break: take ball in hand and run out, no penalty/.test(await text('.ruleLine')) && /SCRATCHED ON BREAK/.test(await text('.resultBar')) && !/GHOST WINS/.test(await text('.breakBar [data-v="scratch"]')), 'Pro break screen: scratch = ball in hand, no penalty');
  await tap('[data-action="ghost-bmade"][data-v="1"]');
  await tap('[data-action="ghost-break"][data-v="scratch"]');
  const toastClear = () => page.evaluate(() => { const t = document.querySelector('#toast.show'); if (!t) return true; const r = t.getBoundingClientRect(); return [...document.querySelectorAll('.resultBar button, .simBar button')].every((b) => { const q = b.getBoundingClientRect(); return r.bottom <= q.top || r.top >= q.bottom || r.right <= q.left || r.left >= q.right; }); });
  check(await exists('.ghostMatch[data-phase="run"]') && (await text('[data-ghost]')) === '0' && /SCRATCH, BALL IN HAND/.test(await text('.racklog')), 'Pro: SCRATCHED ON BREAK → ball-in-hand run-out, no point to the Ghost');
  check(await toastClear(), 'toast never covers the score buttons');
  await tap('[data-action="ghost-undo"]');
  check(await exists('.ghostMatch[data-phase="break"]') && (await text('[data-bmade]')) === '1', 'Pro: undo after a break scratch returns to the break (made count kept)');
  await tap('[data-action="ghost-break"][data-v="scratch"]');
  await tap('[data-action="ghost-rack"][data-v="L"]');
  check((await text('[data-ghost]')) === '1' && /BREAK SCRATCH/.test(await text('.racklog')), 'Pro: missed run-out after a break scratch = Ghost rack, scratch shown in history');
  check(await toastClear(), 'toast re-positions above the taller break bar (never covers a button)');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(200);
  f = await fitG();
  check(f.ok && f.minH >= 44, '375×667: Pro break screen fits without scrolling');
  check(await toastClear(), '375×667: toast clear of the Pro break buttons');
  await shot('44-eight-ghost-pro-375');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await tap('[data-action="ghost-break"][data-v="ok"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  st = await getState();
  const mp = st.ghostMatches[st.ghostMatches.length - 1];
  check(mp && mp.level === 'pro' && mp.won && mp.breaks.length === 4 && mp.breaks[0].made === 2 && mp.breaks[1].eight && mp.breaks[2].scratch && mp.breaks[2].made === 1 && mp.log[2] === 'L', 'Pro match saved with break log (2 made, 8 on break, scratch + run-out)');
  // rematch right after "Match won — saved": no stale toast over BALL IN HAND
  await tap('[data-action="ghost-again"]');
  check(await exists('.ghostMatch[data-phase="break"]') && !(await exists('#toast.show')) && (await toastClear()), 'new Pro match starts with no stale toast over BALL IN HAND');
  await tap('[data-action="ghost-bmade"][data-v="1"]');
  await tap('[data-action="ghost-bmade"][data-v="1"]');
  await shot('43-eight-ghost-pro-break');
  await go('#ghost');
  check(/8-Ball Ghost · Pro/.test(await text('#ghostHistory')), 'Ghost history lists 8-Ball Ghost matches');
  await tap('[data-action="go"][data-href="#sim/eight/pro"]');
  await sleep(400);
  const simBalls = await page.evaluate(() => window.PoolIQ.screen?.state?.balls?.length || 0);
  check(simBalls === 16, `Set up in Shot Simulator opens a 15-ball rack for Pro (${simBalls} balls incl. cue)`);
  check(errors.length === errBefore, `Ghost rules / 8-Ball Ghost: zero console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ data safety: mirror, backup, restore, reset, install
{
  const errBefore = errors.length;
  const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
  const dl = path.join(SHOTS || '/tmp', `downloads-${Date.now()}`);
  fs.mkdirSync(dl, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const ready = () => page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 8000 });
  const lsData = () => page.evaluate(() => { const o = {}; for (const k of window.PoolIQ.V.DATA_KEYS) { const v = localStorage.getItem(k); if (v != null) o[k] = JSON.parse(v); } return o; });
  const norm = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
  const flush = () => page.evaluate(() => window.PoolIQ.vault.flush());
  const reload = async () => { await page.reload({ waitUntil: 'networkidle0' }); await ready(); await sleep(150); };
  const shotClean = async (name) => { await page.evaluate(() => document.getElementById('toast')?.classList.remove('show')); await shot(name); };
  const withNav = async (sel) => { await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.$eval(sel, (el) => el.click())]); await ready(); await sleep(200); };

  // play something: a Ghost rack
  await inject('s.activeGhost = null; return s;', '#ghost/3/5');
  await ready();
  await tap('[data-action="ghost-mode"][data-v="rotation"]');
  await tap('[data-action="ghost-start"]');
  await tap('[data-action="ghost-rack"][data-v="W"]');
  await flush();
  const played = await lsData();
  check(played.poolIQStateV4.activeGhost?.log?.length === 1 && played.poolIQCustomDrillsV1?.drills?.length >= 1, 'played a Ghost rack (plus custom drills from earlier) — data to protect');
  const mirrored = await page.evaluate(async () => { const m = await window.PoolIQ.vault.getMirror(); return m && Object.fromEntries(Object.entries(m.keys).map(([k, v]) => [k, JSON.parse(v)])); });
  check(mirrored && norm(mirrored) === norm(played), 'every key is mirrored to IndexedDB');

  // wipe localStorage → reload → restored from IndexedDB
  await page.evaluate(() => localStorage.clear());
  await reload();
  let boot = await page.evaluate(() => window.PoolIQ.boot);
  let after = await lsData();
  check(boot?.pick === 'remote' && boot.reason === 'local missing', `localStorage wiped → boot restores from IndexedDB (${boot?.reason})`);
  check(after.poolIQStateV4?.activeGhost?.log?.length === 1 && norm(after.poolIQCustomDrillsV1) === norm(played.poolIQCustomDrillsV1) && norm(after.poolIQSimV1) === norm(played.poolIQSimV1) && after.poolIQStateV4.xp === played.poolIQStateV4.xp && after.poolIQStateV4.ghostMatches.length === played.poolIQStateV4.ghostMatches.length, 'wiped data is back: Ghost match in progress, XP, match history, custom drills, simulator library');
  check(/restored from the on-device safety copy/.test(await text('#toast')), 'user is told the data was restored');
  // corrupt the main save → reload → restored
  await page.evaluate(() => localStorage.setItem('poolIQStateV4', '{"xp": 5, oops'));
  await reload();
  boot = await page.evaluate(() => window.PoolIQ.boot);
  after = await lsData();
  check(boot?.pick === 'remote' && boot.reason === 'local corrupt' && after.poolIQStateV4.xp === played.poolIQStateV4.xp, 'corrupted save → restored from IndexedDB on reload');

  // Settings: storage status
  await go('#settings');
  await sleep(500);
  const ds = await page.evaluate(() => ({ persist: document.querySelector('[data-persist]')?.dataset.persist, est: document.querySelector('[data-estimate]')?.innerText, mir: document.querySelector('[data-mirror]')?.dataset.mirror, last: document.querySelector('[data-lastbackup]')?.innerText, first: document.querySelector('#view .settingsCard')?.dataset.card, note: document.querySelector('.dataCard .tip')?.innerText }));
  check(['on', 'off', 'unsupported'].includes(ds.persist) && /\d/.test(ds.est) && ds.mir === 'on' && ds.last === 'never' && ds.first === 'backup', `Settings shows protected storage (${ds.persist}), usage (${ds.est}), safety copy on, last backup never`);
  check(/Home Screen icon/.test(ds.note) && /separate storage/.test(ds.note), 'Settings note: on iPhone open from the Home Screen icon (Safari tab = separate storage)');
  await shotClean('50-settings-backup');

  // Back Up Now → download (no Web Share with files in desktop Chrome)
  await tap('[data-action="backup-now"]');
  let file = null;
  for (let i = 0; i < 30 && !file; i++) { await sleep(200); file = fs.readdirSync(dl).find((f) => /^PoolIQ-backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)); }
  const backup = file ? JSON.parse(fs.readFileSync(path.join(dl, file), 'utf8')) : null;
  const nowData = await lsData();
  check(!!backup && backup.format === 'pool-iq-backup' && backup.schema >= 1 && backup.appVersion && backup.exportedAt && norm(backup.keys) === norm(nowData), `Back Up Now produces ${file || 'NO FILE'} with schema, app version, timestamp and every key`);
  await sleep(300);
  check((await text('[data-lastbackup]')) === 'today', 'last backup updates to "today"');
  // Web Share with files (iPhone share sheet / Android share) when available
  await page.evaluate(() => {
    navigator.canShare = (d) => !!(d && d.files && d.files.length);
    navigator.share = async (d) => { window.__shared = { name: d.files[0].name, type: d.files[0].type, text: await d.files[0].text() }; };
  });
  await go('#home'); await go('#settings');
  check(await exists('[data-action="backup-download"]'), 'with Web Share available, a "Download file instead" option is offered');
  await tap('[data-action="backup-now"]');
  await sleep(300);
  const shared = await page.evaluate(() => window.__shared);
  check(shared && /^PoolIQ-backup-\d{4}-\d{2}-\d{2}\.json$/.test(shared.name) && shared.type === 'application/json' && JSON.parse(shared.text).format === 'pool-iq-backup', 'Back Up Now uses the share sheet with the JSON file when files can be shared');
  await page.evaluate(() => { navigator.share = async () => { const e = new Error('cancel'); e.name = 'AbortError'; throw e; }; });
  await tap('[data-action="backup-now"]');
  await sleep(250);
  check(/cancelled/.test(await text('#toast')), 'cancelled share is reported (not counted as a backup)');
  await page.evaluate(() => { delete navigator.canShare; delete navigator.share; });

  // change data, then restore the backup
  await go('#ghostmatch');
  await tap('[data-action="ghost-rack"][data-v="L"]');
  await flush();
  const changed = await lsData();
  check(changed.poolIQStateV4.activeGhost.log.length === 2, 'data changed after the backup (another rack)');
  await go('#settings');
  await (await page.$('input[data-restore-input]')).uploadFile(path.join(dl, file));
  await page.waitForSelector('#sheet[data-kind="restore"]', { timeout: 4000 });
  const sumTxt = await text('#sheet');
  check(/Restore this backup/.test(sumTxt) && /SESSIONS/.test(sumTxt) && /GHOST GAMES/.test(sumTxt) && /MY DRILLS/.test(sumTxt) && /SAVED SHOTS/.test(sumTxt) && /RANK/.test(sumTxt) && /saved /.test(sumTxt) && /replaces/.test(sumTxt), 'Restore shows a summary (rank, sessions, games, drills, shots, date) and warns it replaces data');
  await shotClean('51-restore-summary');
  await withNav('#sheet [data-action="restore-do"]');
  const restored = await lsData();
  check(norm(restored.poolIQCustomDrillsV1) === norm(backup.keys.poolIQCustomDrillsV1) && norm(restored.poolIQSimV1) === norm(backup.keys.poolIQSimV1) && restored.poolIQStateV4.activeGhost.log.length === 1 && restored.poolIQStateV4.xp === backup.keys.poolIQStateV4.xp && restored.poolIQStateV4.ghostMatches.length === backup.keys.poolIQStateV4.ghostMatches.length, 'Restore (replace) brings back exactly the backed-up data');
  check(/Backup restored/.test(await text('#toast')), 'toast confirms the restore after reload');
  // invalid file is rejected, nothing changes
  const badPath = path.join(dl, 'not-a-backup.json');
  fs.writeFileSync(badPath, '{"hello": "world"}');
  await go('#settings');
  await (await page.$('input[data-restore-input]')).uploadFile(badPath);
  await page.waitForSelector('#sheet[data-kind="restore-error"]', { timeout: 4000 });
  check(/not a Pool IQ backup/.test(await text('#sheet')) && norm(await lsData()) === norm(restored), 'an invalid file is rejected with a message and nothing changes');
  await tap('#sheet [data-action="sheet-close"]');

  // Restore previous snapshot (undo the restore)
  await tap('[data-action="snap-list"]');
  await page.waitForSelector('#sheet[data-kind="snapshots"] .snapRow', { timeout: 4000 });
  const snapTxt = await text('#sheet');
  check(/Before restore/.test(snapTxt) && (await page.$$('#sheet .snapRow')).length <= 3, `snapshot list shows the auto-snapshot taken before the restore (${(await page.$$('#sheet .snapRow')).length} kept)`);
  await shotClean('52-snapshots');
  const beforeRestoreId = await page.$$eval('#sheet .snapRow', (rows) => rows.find((r) => /Before restore/.test(r.innerText))?.dataset.snap);
  await tap(`#sheet [data-action="snap-pick"][data-id="${beforeRestoreId}"]`);
  check(/replaces/.test(await text('#sheet')) && (await exists('#sheet [data-action="snap-restore-do"]')), 'snapshot restore asks for confirmation');
  await withNav('#sheet [data-action="snap-restore-do"]');
  check((await lsData()).poolIQStateV4.activeGhost.log.length === 2, 'restoring the "Before restore" snapshot undoes the restore');

  // RESET ALL PROGRESS: snapshot + two-step typed confirm, and it stays reset after reload
  await go('#settings');
  await tap('[data-action="reset-all"]');
  check(/STEP 1 OF 2/.test(await text('#sheet')) && /snapshot/.test(await text('#sheet')), 'reset step 1 explains the snapshot');
  await tap('#sheet [data-action="reset-step2"]');
  check(await page.$eval('#resetGo', (b) => b.disabled), 'reset step 2: button disabled until RESET is typed');
  await page.type('#resetType', 'res');
  check(await page.$eval('#resetGo', (b) => b.disabled), 'reset: partial text keeps it disabled');
  await page.type('#resetType', 'et');
  check(!(await page.$eval('#resetGo', (b) => b.disabled)), 'reset: typing RESET (any case) enables it');
  await shotClean('53-reset-confirm');
  const xpBeforeReset = (await lsData()).poolIQStateV4.xp;
  await tap('#resetGo');
  await sleep(600);
  let rs = await lsData();
  check(rs.poolIQStateV4.xp === 0 && rs.poolIQStateV4.ghostMatches.length === 0 && rs.poolIQCustomDrillsV1.drills.length >= 1, 'reset clears progress (custom drills kept)');
  await reload();
  rs = await lsData();
  check(rs.poolIQStateV4.xp === 0 && (await page.evaluate(() => window.PoolIQ.boot.pick)) === 'local', 'a deliberate reset is NOT undone by the IndexedDB mirror on reload');
  const snaps = await page.evaluate(async () => (await window.PoolIQ.vault.snapshots()).map((x) => ({ id: x.id, reason: x.reason, xp: x.summary.xp })));
  check(snaps[0]?.reason === 'Before reset' && snaps[0].xp === xpBeforeReset && snaps.length <= 3, 'reset took a "Before reset" snapshot first (≤3 kept)');
  await go('#settings');
  await tap('[data-action="snap-list"]');
  await page.waitForSelector('#sheet .snapRow');
  await tap(`#sheet [data-action="snap-pick"][data-id="${snaps[0].id}"]`);
  await withNav('#sheet [data-action="snap-restore-do"]');
  check((await lsData()).poolIQStateV4.xp === xpBeforeReset, 'reset undone from the snapshot');

  // Home nudge: >7 days since backup with progress; dismissible
  await page.evaluate(() => { const m = JSON.parse(localStorage.getItem('poolIQMetaV1') || '{}'); m.lastBackupAt = Date.now() - 10 * 86400000; delete m.nudgeDismissedAt; localStorage.setItem('poolIQMetaV1', JSON.stringify(m)); });
  await go('#settings'); await go('#home');
  check(/10 days ago/.test(await text('.backupNudge')), 'Home shows a small backup nudge after 7+ days ("10 days ago")');
  await shotClean('54-home-nudge');
  await tap('.backupNudge [data-action="nudge-dismiss"]');
  check(!(await exists('.backupNudge')), 'nudge dismisses');
  await reload();
  await go('#home');
  check(!(await exists('.backupNudge')) && !(await exists('#sheet.show')), 'dismissed nudge stays away; no modal nag');

  // Install: iPhone Safari → Add to Home Screen steps
  await go('#settings');
  check((await page.$eval('[data-card="install"]', (e) => e.dataset.install)) === 'ios', 'iPhone Safari tab: install card offers Add to Home Screen');
  await tap('[data-card="install"] [data-action="install-app"]');
  check(/Share/.test(await text('#sheet')) && /Add to Home Screen/.test(await text('#sheet')) && (await exists('#sheet [data-install-steps="ios"]')), 'iPhone: install shows Share → Add to Home Screen steps');
  await tap('#sheet [data-action="sheet-close"]');

  // Android Chrome sizes + beforeinstallprompt
  await page.setUserAgent(ANDROID_UA);
  for (const [w, h] of [[412, 915], [360, 800]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w === 412 ? 2.625 : 3, isMobile: true, hasTouch: true });
    await page.evaluate(() => history.replaceState(null, '', '#settings'));
    await reload();
    await sleep(300);
    const lay = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.dataCard .bigBtn, [data-card="install"] .bigBtn')].map((b) => b.getBoundingClientRect());
      return { overflow: document.documentElement.scrollWidth > innerWidth + 1, minH: Math.min(...btns.map((r) => r.height)), install: document.querySelector('[data-card="install"]')?.dataset.install, tip: document.querySelector('.dataCard .tip')?.innerText || '' };
    });
    check(!lay.overflow && lay.minH >= 44 && ['manual', 'prompt'].includes(lay.install) && /Downloads/.test(lay.tip), `Android ${w}×${h}: Settings fits (no sideways scroll), big buttons (${Math.round(lay.minH)}px), Android backup tip`);
    if (w === 412) await shotClean('55-android-settings-412');
    await page.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = async () => { window.__prompted = (window.__prompted || 0) + 1; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
    await sleep(200);
    check((await page.$eval('[data-card="install"]', (e) => e.dataset.install)) === 'prompt' && /INSTALL APP/.test(await text('[data-card="install"]')), `Android ${w}×${h}: beforeinstallprompt turns on the INSTALL APP button`);
    await go('#home');
    check(await exists('.installNudge [data-action="install-app"]'), `Android ${w}×${h}: Home offers Install`);
    await tap('.installNudge [data-action="install-app"]');
    await sleep(200);
    check((await page.evaluate(() => window.__prompted)) === 1, `Android ${w}×${h}: INSTALL calls the browser install prompt`);
    // score screens: no scrolling (Beginner coaching shows the full recipe — the tallest layout)
    await go('#settings');
    await tap('[data-action="set-coach"][data-v="beginner"]');
    await go('#play/landing/lz-1');
    const sc = await page.evaluate(() => ({ bar: Math.round(document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9), sh: document.documentElement.scrollHeight, ih: innerHeight, coach: document.querySelector('.playScreen')?.dataset.coach }));
    check(sc.bar <= sc.ih + 1 && sc.sh <= sc.ih + 2, `Android ${w}×${h}: stage score screen fits without scrolling (${sc.coach}: bar ${sc.bar}, page ${sc.sh}/${sc.ih})`);
    await go('#settings');
    await tap('[data-action="set-coach"][data-v="auto"]');
    await go('#ghostmatch');
    const gm = await page.evaluate(() => ({ fit: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1, noScroll: document.documentElement.scrollHeight <= innerHeight + 2 }));
    check(gm.fit && gm.noScroll, `Android ${w}×${h}: Ghost score screen fits without scrolling`);
    if (w === 360) await shotClean('56-android-ghost-360');
  }
  // installed (display-mode standalone): install UI hidden
  await page.emulateMediaFeatures([{ name: 'display-mode', value: 'standalone' }]).catch(() => {});
  let standalone = await page.evaluate(() => matchMedia('(display-mode: standalone)').matches);
  if (!standalone) await page.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
  await page.evaluate(() => history.replaceState(null, '', '#settings'));
  await reload();
  check((await page.$eval('[data-card="install"]', (e) => e.dataset.install)) === 'installed' && !(await exists('[data-card="install"] [data-action="install-app"]')), `installed app (standalone${standalone ? ' media' : ' flag'}): Install button hidden`);
  await go('#home');
  check(!(await exists('.installNudge')), 'installed app: no install card on Home');
  await page.emulateMediaFeatures([]).catch(() => {});
  // iPhone 375×667 Settings
  await page.setUserAgent(IPHONE_UA);
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await go('#settings');
  const small = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1, minH: Math.min(...[...document.querySelectorAll('.dataCard .bigBtn')].map((b) => b.getBoundingClientRect().height)) }));
  check(!small.overflow && small.minH >= 44, '375×667: Settings backup card fits with big buttons');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  check(errors.length === errBefore, `data safety: zero console errors (${errors.length - errBefore})`);
}

// ------------------------------------------------------------------------------------------ My Content: .pooliq import / preview / play test / install
{
  const errBefore = errors.length;
  const EXD = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'examples');
  const ex = (f) => path.join(EXD, f);
  const exJSON = (f) => JSON.parse(fs.readFileSync(ex(f), 'utf8'));
  const tmp = path.join(SHOTS || '/tmp', `pooliq-tmp-${Date.now()}`);
  fs.mkdirSync(tmp, { recursive: true });
  const writeTmp = (name, data) => { const p = path.join(tmp, name); fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data, null, 2)); return p; };
  const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
  const ready = () => page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 8000 });
  const reload = async () => { await page.reload({ waitUntil: 'networkidle0' }); await ready(); await sleep(200); };
  const shotC = async (name) => { await page.evaluate(() => { document.getElementById('toast')?.classList.remove('show'); }); await shot(name); };
  const hideSheet = () => page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  const hash = () => page.evaluate(() => location.hash);
  const items = () => page.evaluate(() => JSON.parse(localStorage.getItem('poolIQContentV1') || 'null')?.items || []);
  const progress = () => page.evaluate(() => JSON.parse(localStorage.getItem('poolIQContentProgressV1') || 'null'));
  const norm = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
  /** every official Pool IQ key (Career/state, ratings, history, Ghost, custom drills, simulator, calibration live in these) — everything except My Content's own keys and the vault's bookkeeping */
  const OWN = ['poolIQContentV1', 'poolIQContentProgressV1', 'poolIQMetaV1'];
  const official = () => page.evaluate((own) => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^poolIQ/i.test(k) && !own.includes(k)) o[k] = localStorage.getItem(k); } for (const k of window.PoolIQ.V.DATA_KEYS) if (!own.includes(k)) o[k] = localStorage.getItem(k); return JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]])); }, OWN);
  const upload = async (file) => {
    await go('#home');
    await go('#content');
    const inp = await page.$('input[data-content-input]');
    await inp.uploadFile(file);
    await page.waitForFunction(() => /#cview\/pending|#cimport|#content$/.test(location.hash) && !/#home/.test(location.hash), { timeout: 5000 }).catch(() => {});
    await sleep(350);
  };
  const svgToScreen = (sel, x, y) => page.evaluate((s, px, py) => { const svg = document.querySelector(s); const pt = svg.createSVGPoint(); pt.x = px; pt.y = py; const q = pt.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; }, sel, x, y);
  const layout = () => page.evaluate(() => {
    const bar = document.querySelector('.resultBar')?.getBoundingClientRect();
    const svg = document.querySelector('.playTable svg')?.getBoundingClientRect();
    const taps = [...document.querySelectorAll('.resultBar button:not(.rbUndo), .phBack, .lockBtn, .resultBtns .bigBtn')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect()).map((r) => Math.min(r.height, r.width));
    return { bar: bar ? Math.round(bar.bottom) : 9e9, sh: document.documentElement.scrollHeight, ih: innerHeight, iw: innerWidth, ow: document.documentElement.scrollWidth, table: svg ? Math.round(svg.width) : 0, minTap: taps.length ? Math.round(Math.min(...taps)) : 0 };
  });
  const fits = (l) => l.bar <= l.ih + 1 && l.sh <= l.ih + 2 && l.ow <= l.iw + 1;
  const lstr = (l) => `bar ${l.bar}, page ${l.sh}/${l.ih}, width ${l.ow}/${l.iw}, table ${l.table}px, min tap ${l.minTap}px`;
  const recordN = async (n) => { for (let k = 0; k < n; k++) { if (await exists('.resultPanel')) break; await page.$$eval('.resultBar .rb[data-action="record"]', (els) => els[els.length - 1].click()); await sleep(110); } };
  const recordMiss = async (n) => { for (let k = 0; k < n; k++) { if (await exists('.resultPanel')) break; await page.$$eval('.resultBar .rb[data-action="record"]', (els) => els[0].click()); await sleep(110); } };

  await page.setUserAgent(IPHONE_UA);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.evaluate(() => history.replaceState(null, '', '#settings'));
  await reload();
  await tap('[data-action="set-coach"][data-v="beginner"]');
  await go('#drills');

  // ---- entry point + existing data
  const legacyBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1') || '{"drills":[]}').drills);
  const stateBefore = await getState();
  check(await exists('.myContentBtn[data-href="#content"]'), 'Drills tab has a MY CONTENT button');
  await tap('.myContentBtn');
  await sleep(250);
  check(/#content$/.test(await hash()) && (await page.$$('.cSec[data-section]')).length === 4 && ['drills', 'packs', 'lessons', 'games'].every(Boolean), 'MY CONTENT opens with My Drills / Training Packs / Lessons / Skill Games');
  const secs = await page.$$eval('.cSec[data-section]', (els) => els.map((e) => e.dataset.section).join(','));
  check(secs === 'drills,packs,lessons,games', `My Content sections in order (${secs})`);
  const acc = await page.$eval('input[data-content-input]', (e) => e.accept);
  check(['.pooliq', '.json', 'application/json', 'application/octet-stream', 'text/plain'].every((a) => acc.split(',').includes(a)), `file input accept list includes .pooliq, .json, application/json, octet-stream, text/plain (iOS Files won't grey out .pooliq): ${acc}`);
  const ib = await page.$eval('[data-import-btn]', (e) => ({ h: e.getBoundingClientRect().height, t: e.innerText }));
  check(ib.h >= 44 && /IMPORT CONTENT/.test(ib.t), `big IMPORT CONTENT button (${Math.round(ib.h)}px)`);
  const customCards = (await page.$$('[data-custom-drill] [data-badge="custom"]')).length;
  check(legacyBefore.length >= 1 && customCards === legacyBefore.filter((d) => d.custom !== false).length, `existing Create Drill drills (v9 data) still listed in My Drills with a CUSTOM badge (${customCards})`);
  check(!/coming soon/i.test(await text('#view')), 'My Content has no "Coming Soon" placeholders');
  const hubL = await layout();
  check(hubL.ow <= hubL.iw + 1, 'My Content: no sideways scroll at 390×844');
  await tap('[data-action="c-examples"]');
  check((await page.$$('#sheet .exRow[data-example]')).length === 7 && (await page.$$('#sheet a[download][href^="./examples/"]')).length === 7 && (await exists('#sheet a[href="./POOLIQ_CONTENT_SCHEMA.md"][rel="noopener"]')), 'Example files sheet: 7 downloadable DEMO files + schema docs link');
  await hideSheet();
  const OFF0 = await official();

  // ---- invalid / malicious files → readable error screen, nothing installed
  const base = exJSON('demo-single-drill.pooliq');
  const bad = JSON.parse(JSON.stringify(base));
  bad.shot.speed = 1.7;
  bad.shot.ballPositions.push({ n: 1, x: 120, y: 10 });
  bad.scoringRules = { mode: 'success', attempts: 3, pass: { made: 5 } };
  await upload(writeTmp('bad-values.pooliq', bad));
  const errTxt = await text('[data-import-error]');
  check(/#cimport$/.test(await hash()) && /CANNOT IMPORT/.test(await text('[data-import-error] .errHead')) && (await page.$$('[data-import-error] .errList li')).length >= 3, `invalid file → CANNOT IMPORT screen with a readable list (${(await page.$$('[data-import-error] .errList li')).length} problems)`);
  check(/speed/i.test(errTxt) && /1/.test(errTxt) && /Nothing on this device was changed/.test(errTxt), 'error list names the problems (SPEED, ball, pass) and says nothing changed');
  await shotC('60-import-error');
  const evil = JSON.parse(JSON.stringify(base));
  evil.title = 'Nice drill<script>window.__pwned=1</script>';
  evil.description = '<img src=x onerror="window.__pwned=2">';
  evil.attribution.sourceURL = 'javascript:window.__pwned=3';
  await upload(writeTmp('evil-script.pooliq', evil));
  const evilOut = await page.evaluate(() => ({ h: location.hash, pwned: window.__pwned, scripts: document.querySelectorAll('#view script, #view img[onerror], #view iframe').length, txt: document.querySelector('[data-import-error]')?.innerText || '' }));
  check(/#cimport$/.test(evilOut.h) && !evilOut.pwned && evilOut.scripts === 0 && /not allowed|script|unsafe/i.test(evilOut.txt), 'malicious file (<script>, onerror=, javascript: URL) rejected; nothing executed or injected');
  await upload(writeTmp('evil-proto.pooliq', JSON.stringify(base).replace('"metadata":{', '"metadata":{"__proto__":{"polluted":"yes"},').replace('"shot":{', '"shot":{"constructor":{"prototype":{"polluted2":1}},')));
  const proto = await page.evaluate(() => ({ h: location.hash, p: ({}).polluted, p2: ({}).polluted2, txt: document.querySelector('[data-import-error]')?.innerText || '' }));
  check(/#cimport$/.test(proto.h) && proto.p === undefined && proto.p2 === undefined && /__proto__|constructor|not allowed/i.test(proto.txt), 'prototype-pollution keys (__proto__, constructor/prototype) rejected; Object.prototype untouched');
  await upload(writeTmp('future.pooliq', { ...base, schemaVersion: '3.0' }));
  check(/CANNOT IMPORT — This file uses Pool IQ schema 3\.0\. Your version supports up to 1\.0\./.test(await text('[data-import-error] .errHead')), 'schema 3.0 → "CANNOT IMPORT — This file uses Pool IQ schema 3.0. Your version supports up to 1.0."');
  await upload(writeTmp('huge.pooliq', JSON.stringify({ ...base, notes: 'x'.repeat(600 * 1024) })));
  check(/too large/i.test(await text('[data-import-error] .errHead')), 'oversized file (600 KB) rejected before parsing');
  await upload(writeTmp('garbage.pooliq', 'this is { not json'));
  check(/CANNOT IMPORT/.test(await text('[data-import-error] .errHead')) && /JSON/i.test(await text('[data-import-error]')), 'non-JSON file → understandable error');
  await upload(writeTmp('unknown-type.pooliq', { ...base, contentType: 'macro' }));
  check(/Unknown contentType "macro"/.test(await text('[data-import-error]')), 'unknown content type rejected ("Unknown contentType … Supported: …")');
  check((await items()).length === 0 && (await official()) === OFF0, 'after all rejected files: nothing installed, official data unchanged');
  check(errors.length === errBefore, `import errors: zero console errors (${errors.length - errBefore})`);

  // ---- valid drill → preview (same renderer) → play test (sandbox)
  await upload(ex('demo-single-drill.pooliq'));
  const pv = await page.evaluate(() => ({
    h: location.hash,
    view: document.querySelector('.contentView')?.dataset.view,
    imported: !!document.querySelector('[data-badge="imported"]'),
    demo: /DEMO/.test(document.querySelector('.cvTitle')?.innerText || ''),
    grid: document.querySelectorAll('.cvTable svg .diamond-grid line').length,
    balls: document.querySelectorAll('.cvTable svg .obj-ball').length,
    cue: !!document.querySelector('.cvTable svg .cue-ball'),
    paths: !!document.querySelector('.cvTable svg .cue-path') && !!document.querySelector('.cvTable svg .ob-path'),
    zones: document.querySelectorAll('.cvTable svg .zone-ring').length,
    gauges: document.querySelectorAll('.recipeRow .gaugeCard .gauge').length,
    setup: document.querySelectorAll('.setupLine .su-ball').length,
    speed: document.querySelector('[data-fact="speed"]')?.dataset.speed,
    attempts: document.querySelector('[data-fact="attempts"]')?.innerText || '',
    pass: document.querySelector('[data-fact="pass"]')?.innerText || '',
    why: !!document.querySelector('.recipeRow [data-action="why-open"]'),
    attr: document.querySelector('[data-attribution]')?.innerText || '',
    acts: [...document.querySelectorAll('[data-preview-actions] .bigBtn')].map((b) => b.innerText.trim()).join('|'),
    table: Math.round(document.querySelector('.cvTable svg')?.getBoundingClientRect().width || 0)
  }));
  check(/#cview\/pending$/.test(pv.h) && pv.view === 'drill' && pv.imported && pv.demo, 'valid drill file → PREVIEW (not installed) with IMPORTED badge and DEMO title');
  check(pv.grid === 10 && pv.balls >= 1 && pv.cue && pv.paths && pv.zones >= 1 && pv.setup >= 2, `preview uses the normal table renderer: diamond grid, balls, paths, target zone, SETUP readout (${pv.balls} balls, ${pv.zones} rings)`);
  check(pv.gauges === 3 && pv.speed === '1.50' && /10/.test(pv.attempts) && /\d/.test(pv.pass) && pv.why, `preview shows Shot Recipe (3 gauges), SPEED ${pv.speed}, attempts, pass requirement, Why This Shot?`);
  check(/Pool IQ \(demo content\)/.test(pv.attr) && /PLAY TEST/.test(pv.acts) && /ADD TO MY CONTENT/.test(pv.acts) && /DISCARD/.test(pv.acts), 'preview shows attribution and PLAY TEST / ADD TO MY CONTENT / DISCARD');
  check(pv.table >= 360, `preview table diagram is large (${pv.table}px wide)`);
  check((await items()).length === 0, 'import did NOT install anything yet');
  await shotC('61-preview-drill');
  await tap('.recipeRow [data-action="why-open"]');
  check(/WHY THIS SHOT/i.test(await text('#sheet')), 'Why This Shot? opens from the preview');
  await hideSheet();
  await tap('[data-preview-actions] [data-href="#cplay/pending"]');
  await sleep(300);
  const pt = await page.evaluate(() => ({ title: document.querySelector('.playHead')?.innerText || '', btns: [...document.querySelectorAll('.resultBar .rb[data-action="record"]')].map((b) => b.innerText.replace(/\s+/g, ' ').trim()), grid: document.querySelectorAll('.playTable svg .diamond-grid line').length, gauges: document.querySelectorAll('.gaugeCard .gauge').length }));
  check(/PLAY TEST/.test(pt.title) && /Attempt 1 of 10/i.test(pt.title) && pt.btns.some((b) => /SUCCESS/.test(b)) && pt.btns.some((b) => /MISS/.test(b)), `PLAY TEST uses the normal play screen ("${pt.title.replace(/\s+/g, ' ').slice(0, 70)}", ${pt.btns.join(' / ')})`);
  check(pt.grid === 10 && pt.gauges === 3, 'play test: table grid + Shot Recipe gauges');
  const ptL = await layout();
  check(fits(ptL) && ptL.minTap >= 44 && ptL.table >= 350, `play test fits 390×844 without scrolling; tap targets ≥ 44px (${lstr(ptL)})`);
  await shotC('62-play-test');
  await recordN(7);
  await recordMiss(3);
  const sb = await page.evaluate(() => ({ res: !!document.querySelector('[data-content-result]'), note: document.querySelector('[data-sandbox-note]')?.innerText || '', add: !!document.querySelector('.resultBtns [data-action="c-install"]') }));
  check(sb.res && /nothing was saved/i.test(sb.note) && sb.add, 'play test result: "PLAY TEST — nothing was saved" + ADD TO MY CONTENT');
  await shotC('63-play-test-result');
  const stateAfterPT = await getState();
  check((await official()) === OFF0 && (await items()).length === 0 && (await progress()) == null, 'PLAY TEST isolation: every official key (Career, XP, ratings, history, Ghost, drills, settings, calibration) byte-for-byte unchanged; nothing installed; no progress saved');
  check(stateAfterPT.xp === stateBefore.xp && norm(stateAfterPT.games) === norm(stateBefore.games), `play test earned no XP / history (xp ${stateAfterPT.xp})`);

  // ---- install from the result screen; persists across reload
  await tap('.resultBtns [data-action="c-install"]');
  await sleep(300);
  let its = await items();
  const drillUid = its[0]?.uid;
  check(its.length === 1 && its[0].id === 'demo-straight-in-stop' && its[0].source === 'imported' && /#cview\//.test(await hash()) && !(await hash()).includes('pending'), 'ADD TO MY CONTENT installs it (own storage key poolIQContentV1) and opens it');
  await reload();
  await go('#content');
  check((await items()).length === 1 && (await exists(`.cSec[data-section="drills"] .cItem[data-content-item="${drillUid}"] [data-badge="imported"]`)), 'installed drill persists across reload; listed in My Drills with IMPORTED badge');
  check((await official()) === OFF0, 'installing touched no official key');

  // ---- same-id conflict: CANCEL / KEEP BOTH / REPLACE (never silent overwrite), versions shown
  await upload(ex('demo-single-drill.pooliq'));
  await tap('[data-preview-actions] [data-action="c-install"]');
  await page.waitForSelector('#sheet [data-conflict]', { timeout: 4000 });
  const cv1 = await page.evaluate(() => ({ inst: document.querySelector('[data-installed-version]')?.innerText, inc: document.querySelector('[data-incoming-version]')?.innerText, btns: [...document.querySelectorAll('#sheet [data-action="c-conflict"]')].map((b) => b.dataset.mode).join(',') }));
  check(cv1.inst === 'v1.0' && cv1.inc === 'v1.0' && cv1.btns === 'replace,keepBoth,cancel', `same id → conflict dialog REPLACE / KEEP BOTH / CANCEL with installed ${cv1.inst} vs incoming ${cv1.inc}`);
  await tap('#sheet [data-action="c-conflict"][data-mode="cancel"]');
  check((await items()).length === 1 && norm((await items())[0].doc) === norm(its[0].doc), 'CANCEL: nothing changed');
  const v12 = { ...exJSON('demo-single-drill.pooliq'), contentVersion: '1.2', title: 'DEMO · Straight-In Stop Shot (v1.2)' };
  const v12Path = writeTmp('demo-single-drill-v12.pooliq', v12);
  await upload(v12Path);
  await tap('[data-preview-actions] [data-action="c-install"]');
  await page.waitForSelector('#sheet [data-conflict]', { timeout: 4000 });
  check((await text('[data-installed-version]')) === 'v1.0' && (await text('[data-incoming-version]')) === 'v1.2', 'conflict shows installed v1.0 vs incoming v1.2');
  await shotC('64-conflict');
  await tap('#sheet [data-action="c-conflict"][data-mode="keepBoth"]');
  its = await items();
  check(its.length === 2 && its.some((i) => i.id === 'demo-straight-in-stop' && i.contentVersion === '1.0') && its.some((i) => i.id !== 'demo-straight-in-stop' && i.contentVersion === '1.2'), `KEEP BOTH: original kept, copy installed with a new id (${its.map((i) => `${i.id}@${i.contentVersion}`).join(', ')})`);
  await upload(v12Path);
  await tap('[data-preview-actions] [data-action="c-install"]');
  await page.waitForSelector('#sheet [data-conflict]', { timeout: 4000 });
  await tap('#sheet [data-action="c-conflict"][data-mode="replace"]');
  its = await items();
  const orig = its.find((i) => i.id === 'demo-straight-in-stop');
  check(its.length === 2 && orig?.contentVersion === '1.2' && orig.uid === drillUid && /v1\.2/.test(orig.doc.title), 'REPLACE: the installed item is updated to v1.2 in place (same slot), copy untouched');

  // ---- installed drill: plays like normal; personal progress only (never Career)
  await go(`#cview/${drillUid}`);
  await tap('[data-item-actions] [data-href^="#cplay/"]');
  await sleep(300);
  check(!/PLAY TEST/.test(await text('.playHead')) && (await exists('.resultBar .rb[data-action="record"]')), 'installed drill plays on the normal play screen');
  await recordN(10);
  const ir = await page.evaluate(() => document.querySelector('[data-sandbox-note]')?.innerText || '');
  const pr = await progress();
  check(/personal progress only/.test(ir) && pr?.[drillUid]?.plays === 1 && pr[drillUid].best > 0, `installed play saved to My Content progress (best ${pr?.[drillUid]?.best}) — "${ir}"`);
  check((await official()) === OFF0, 'installed (not career-eligible) content never changes Career / XP / history keys');

  // ---- edit imported content in the builder (touch drag, SPEED, instructions, marker) and save
  await go(`#cview/${drillUid}`);
  await tap('[data-item-actions] [data-href^="#cedit/"]');
  await sleep(400);
  check(await exists('.builderScreen[data-builder="content"] #dbTable svg'), 'EDIT opens the visual builder in content mode');
  const fonts = await page.$$eval('.builderScreen input, .builderScreen textarea, .builderScreen select', (els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
  check(fonts.length >= 8 && Math.min(...fonts) >= 16, `builder inputs use font-size ≥ 16px (no iOS zoom): ${fonts.length} inputs, min ${Math.min(...fonts)}px`);
  const bFields = await page.evaluate(() => ['db-title', 'db-instructions', 'db-why'].every((id) => document.getElementById(id)) && !!document.querySelector('[data-action="db-speed"]') && !!document.querySelector('[data-action="db-tool"][data-v="marker"]') && !!document.querySelector('[data-action="db-tech"]') && !!document.querySelector('[data-action="db-eng"]'));
  check(bFields, 'builder has title, instructions, Why, SPEED, technique, English and table tools (paths, rails, markers)');
  const sp0 = await page.$eval('[data-speed]', (e) => e.dataset.speed);
  await tap('[data-action="db-speed"][data-v="-0.25"]');
  await tap('[data-action="db-speed"][data-v="-0.25"]');
  const sp1 = await page.$eval('#dbPanel [data-speed], .builderScreen b[data-speed]', (e) => e.dataset.speed);
  check(sp0 === '1.50' && sp1 === '1.00', `SPEED changed ${sp0} → ${sp1}`);
  await page.$eval('#db-instructions', (e) => { e.value = 'Edited on my phone: stop the cue ball dead.'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  const b0 = await page.evaluate(() => { const b = window.PoolIQ.screen.builder; const o = b.balls.find((x) => x.n === 1); return { x: o.x, y: o.y }; });
  const bb = await page.$eval('#dbTable svg g.ball[data-n="1"]', (g) => { const r = g.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.touchscreen.touchStart(bb.x, bb.y);
  for (let k = 1; k <= 6; k++) { await page.touchscreen.touchMove(bb.x + k * 8, bb.y + k * 5); await sleep(20); }
  await page.touchscreen.touchEnd();
  await sleep(300);
  const b1 = await page.evaluate(() => { const b = window.PoolIQ.screen.builder; const o = b.balls.find((x) => x.n === 1); return { x: o.x, y: o.y }; });
  check(Math.abs(b1.x - b0.x) > 2 && Math.abs(b1.y - b0.y) > 1, `touch drag moves the 1-ball (${b0.x},${b0.y} → ${b1.x},${b1.y})`);
  await tap('[data-action="db-tool"][data-v="marker"]');
  const mk = await svgToScreen('#dbTable svg', 25, 0.4);
  await page.touchscreen.tap(mk.x, mk.y);
  await sleep(250);
  const markers = await page.evaluate(() => window.PoolIQ.screen.builder.markers || []);
  check(markers.length === 1 && markers[0].rail === 'top' && Math.abs(markers[0].diamond - 2) < 0.15, `marker tool: tapping the top rail adds a diamond reference point (${markers.map((m) => `${m.rail} ${m.diamond}`).join(', ')})`);
  await tap('[data-action="db-tool"][data-v="move"]');
  const bl = await layout();
  check(bl.ow <= bl.iw + 1 && bl.table >= 350, `builder fits the width with a large table (${lstr(bl)})`);
  await shotC('65-builder-content');
  await tap('.dbBar [data-action="db-save"]');
  await sleep(400);
  its = await items();
  const ed = its.find((i) => i.uid === drillUid);
  check(new RegExp(`#cview/${drillUid}$`).test(await hash()) && ed.edited && ed.doc.shot.speed === 1 && /Edited on my phone/.test(ed.doc.shot.instructions) && ed.doc.shot.referenceMarkers?.length === 1 && Math.abs(ed.doc.shot.ballPositions.find((x) => x.n === 1).x - b1.x) < 0.01, 'SAVE TO MY CONTENT: imported drill updated (SPEED 1.0, instructions, moved ball, marker) and marked edited');
  check(ed.doc.id === 'demo-straight-in-stop' && ed.doc.contentVersion === '1.2' && ed.doc.attribution?.author === 'Pool IQ (demo content)', 'edit keeps id, version and attribution');

  // ---- export (Web Share with a File) → re-import round trip is lossless
  await page.evaluate(() => {
    navigator.canShare = (d) => !!(d && d.files && d.files.length);
    navigator.share = async (d) => { window.__shared = { name: d.files[0].name, type: d.files[0].type, text: await d.files[0].text() }; };
  });
  await tap('[data-item-actions] [data-action="c-export"]');
  await sleep(400);
  const shared = await page.evaluate(() => window.__shared);
  check(shared && /\.pooliq$/.test(shared.name) && JSON.parse(shared.text).format === 'pooliq', `EXPORT uses the share sheet with a .pooliq File (${shared?.name}, ${shared?.type})`);
  const rtPath = writeTmp(shared?.name || 'rt.pooliq', shared?.text || '{}');
  await page.evaluate(() => { delete navigator.canShare; delete navigator.share; });
  await upload(rtPath);
  const pend = await page.evaluate(() => window.PoolIQ.content.getPending()?.doc);
  check(/#cview\/pending$/.test(await hash()) && norm(pend) === norm(ed.doc), 'export → re-import round trip is lossless (identical document)');
  await tap('[data-preview-actions] [data-action="c-discard"]');
  check((await items()).length === 2 && /#content$/.test(await hash()), 'DISCARD installs nothing');
  // download fallback when files can't be shared
  const dl = path.join(tmp, 'dl');
  fs.mkdirSync(dl, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl });
  await tap(`.cItem[data-content-item="${drillUid}"] [data-action="c-export"]`);
  let dlf = null;
  for (let i = 0; i < 30 && !dlf; i++) { await sleep(200); dlf = fs.readdirSync(dl).find((f) => /\.pooliq$/.test(f)); }
  check(!!dlf && norm(JSON.parse(fs.readFileSync(path.join(dl, dlf), 'utf8'))) === norm(ed.doc), `no Web Share → EXPORT downloads ${dlf || 'NOTHING'} (same document)`);

  // ---- delete with confirmation
  const copyUid = its.find((i) => i.uid !== drillUid).uid;
  await go('#content');
  await tap(`.cItem[data-content-item="${copyUid}"] [data-action="c-del"]`);
  check(/Delete/.test(await text('#sheet')) && (await exists('#sheet [data-action="c-del-do"]')), 'DELETE asks for confirmation');
  await tap('#sheet [data-action="sheet-close"]');
  check((await items()).length === 2, 'cancel keeps it');
  await tap(`.cItem[data-content-item="${copyUid}"] [data-action="c-del"]`);
  await tap('#sheet [data-action="c-del-do"]');
  check((await items()).length === 1 && !(await exists(`.cItem[data-content-item="${copyUid}"]`)), 'confirmed DELETE removes the item');
  check(errors.length === errBefore, `import / preview / install / edit / export: zero console errors (${errors.length - errBefore})`);

  // ---- training pack: ordered stages, locks, progress %
  await upload(ex('demo-training-pack.pooliq'));
  check((await page.$$('.stRow[data-stage-state]')).length === 4 && (await page.$$('.stRow button[data-action="go"]')).length === 4, 'pack preview lists 4 ordered stages; all playable in PLAY TEST');
  await tap('[data-preview-actions] [data-action="c-install"]');
  await sleep(300);
  const packUid = (await items()).find((i) => i.contentType === 'pack')?.uid;
  const states = () => page.$$eval('.stRow[data-stage-state]', (els) => els.map((e) => e.dataset.stageState).join(','));
  check((await states()) === 'open,locked,locked,locked' && (await text('.packHead')).includes('0%'), `installed pack: stage 1 open, the rest locked 🔒 (${await states()})`);
  await shotC('66-pack-locked');
  await tap('.stRow[data-stage-state="locked"] button');
  check(/Locked/.test(await text('#toast')) && new RegExp(`#cview/${packUid}$`).test(await hash()), 'tapping a locked stage explains it and stays put');
  await go(`#cplay/${packUid}/3`);
  await sleep(300);
  check(new RegExp(`#cview/${packUid}$`).test(await hash()), 'deep link to a locked stage redirects back to the pack');
  await tap('.stRow[data-stage-state="open"] button');
  await sleep(250);
  check(await exists('.lessonScreen[data-phase="teach"]'), 'stage 1 (lesson) opens in TEACH');
  await tap('[data-action="cl-next"]');
  check(await exists('[data-lesson-done]'), 'stage 1 complete');
  await tap(`.resultBtns [data-href="#cview/${packUid}"]`);
  await sleep(250);
  check((await states()) === 'done,open,locked,locked' && (await page.$eval('[data-pack-pct]', (e) => e.dataset.packPct)) === '25', `after stage 1: ✓ done, stage 2 🔓, pack 25% (${await states()})`);
  await tap('.stRow[data-stage-state="open"] button');
  await sleep(250);
  await recordN(5);
  check(await exists('[data-content-result][data-result="pass"]'), 'stage 2 drill passed');
  await go(`#cview/${packUid}`);
  check((await states()) === 'done,done,open,locked' && (await page.$eval('[data-pack-pct]', (e) => e.dataset.packPct)) === '50', `after stage 2: 50%, final challenge still locked until stage 3 (${await states()})`);
  await reload();
  check((await states()) === 'done,done,open,locked', 'pack progress persists across reload');
  await shotC('67-pack-progress');

  // ---- lesson: TEACH → GUIDED → SOLVE (hidden) → LOCK → REVEAL
  await upload(ex('demo-lesson.pooliq'));
  check((await page.$$('.stepList li')).length === 5, 'lesson preview lists its 5 steps');
  await tap('[data-preview-actions] [data-href="#cplay/pending"]');
  await sleep(250);
  check(await exists('.lessonScreen[data-phase="teach"] .phaseBar [data-ph="solve"]'), 'lesson opens in TEACH with the TEACH → GUIDED → SOLVE → EXECUTE → TEST bar');
  await shotC('68-lesson-teach');
  await tap('[data-action="cl-next"]');
  check(await exists('.lessonScreen[data-phase="guided"] [data-action="cl-play"]'), 'GUIDED PRACTICE step shows the route and a START button');
  await tap('[data-action="cl-play"]');
  await sleep(200);
  await recordN(3);
  await tap('.resultBtns [data-action="cl-next"]');
  await sleep(200);
  const solveHidden = await page.evaluate(() => ({ solve: !!document.querySelector('.solveScreen[data-phase="solve"]'), cuePath: !!document.querySelector('.playTable svg .cue-path'), lock: document.querySelector('[data-action="cs-lock"]')?.disabled }));
  check(solveHidden.solve && !solveHidden.cuePath && solveHidden.lock === true, 'SOLVE IT YOURSELF hides the solution; LOCK disabled until answered');
  const tp = await svgToScreen('.playTable svg', 50, 0.4);
  await page.touchscreen.tap(tp.x, tp.y);
  await sleep(200);
  await tap('[data-action="cs-speed"][data-v="2"]');
  check(!(await page.$eval('[data-action="cs-lock"]', (b) => b.disabled)), 'answer picked (rail tap + SPEED) → LOCK enabled');
  await tap('[data-action="cs-lock"]');
  const lr = await page.evaluate(() => ({ reveal: !!document.querySelector('.solveScreen[data-phase="reveal"] .revealBox'), dia: document.querySelector('.diaReveal')?.dataset.verdict, speedRow: !!document.querySelector('.cmpRow[data-field="speed"]'), path: !!document.querySelector('.playTable svg .cue-path') }));
  check(lr.reveal && lr.dia === 'pass' && lr.speedRow && lr.path, `LOCK ANSWER reveals the recommended solution: diamond verdict ${lr.dia}, SPEED comparison, route drawn`);
  await shotC('69-lesson-reveal');
  await tap('[data-action="cs-next"]');
  check(await exists('.lessonScreen[data-phase="execute"]'), 'lesson moves on to EXECUTE');
  check((await official()) === OFF0, 'lesson play test changed no official key');

  // ---- gauntlet: hearts, lives decrement, game over, personal best
  const gDoc = exJSON('demo-gauntlet.pooliq');
  await upload(ex('demo-gauntlet.pooliq'));
  check(/lives/i.test(await text('[data-rules]')) && /❤️/.test(await text('[data-rules]')), 'gauntlet preview shows its rules (lives ❤️, points, bonus, retry)');
  await tap('[data-preview-actions] [data-action="c-install"]');
  await sleep(250);
  const gUid = (await items()).find((i) => i.contentType === 'game')?.uid;
  await tap('[data-item-actions] [data-href^="#cplay/"]');
  await sleep(250);
  const lives = () => page.$eval('.hearts[data-lives]', (e) => Number(e.dataset.lives)).catch(() => null);
  const score = () => page.$eval('.score[data-score]', (e) => Number(e.dataset.score)).catch(() => null);
  check((await exists('.gameScreen[data-template="gauntlet"]')) && (await lives()) === gDoc.rules.lives, `gauntlet starts with ${gDoc.rules.lives} hearts`);
  await tap('[data-action="cg-shot"][data-ok="1"]');
  check((await score()) === gDoc.rules.pointsPerSuccess && (await page.$eval('.gameScreen', (e) => e.dataset.stageIndex)) === '1', `SUCCESS scores ${gDoc.rules.pointsPerSuccess} and advances to stage 2`);
  await tap('[data-action="cg-shot"][data-ok="0"]');
  check((await lives()) === gDoc.rules.lives - 1, `MISS loses a life (${await lives()} left)`);
  const gl = await layout();
  check(fits(gl) && gl.minTap >= 44, `gauntlet screen fits 390×844 without scrolling (${lstr(gl)})`);
  await shotC('70-gauntlet-hearts');
  await tap('[data-action="cg-shot"][data-ok="0"]');
  await tap('[data-action="cg-shot"][data-ok="0"]');
  const go1 = await page.evaluate(() => { const g = (k) => document.querySelector(`[data-${k}]`)?.getAttribute(`data-${k}`); return { over: !!document.querySelector('[data-game-over]'), h1: document.querySelector('.resultPanel h1')?.innerText, score: g('final-score'), stage: g('stage-reached'), succ: g('successes'), miss: g('misses'), longest: g('longest'), pb: g('pb') }; });
  check(go1.over && go1.h1 === 'GAME OVER' && go1.score === String(gDoc.rules.pointsPerSuccess) && go1.stage === '2' && go1.succ === '1' && go1.miss === '3' && go1.longest === '1' && go1.pb === String(gDoc.rules.pointsPerSuccess), `lives 0 → GAME OVER with Score ${go1.score}, Stage ${go1.stage}, Successes ${go1.succ}, Misses ${go1.miss}, Longest streak ${go1.longest}, PB ${go1.pb}`);
  await shotC('71-gauntlet-game-over');
  await tap('.resultBtns [data-action="cg-again"]');
  check((await lives()) === gDoc.rules.lives && (await score()) === 0, 'PLAY AGAIN resets hearts and score');
  for (let k = 0; k < 3; k++) await tap('[data-action="cg-shot"][data-ok="1"]');
  for (let k = 0; k < 3; k++) { if (await exists('[data-game-over]')) break; await tap('[data-action="cg-shot"][data-ok="0"]'); }
  const pb2 = Number(await page.$eval('[data-pb]', (e) => e.dataset.pb));
  check(pb2 > gDoc.rules.pointsPerSuccess && /NEW PERSONAL BEST/.test(await text('.resultPanel')), `better run → NEW PERSONAL BEST (${pb2})`);
  await reload();
  check((await progress())?.[gUid]?.best === pb2 && (await progress())[gUid].plays === 2, 'gauntlet personal best persists across reload (My Content progress)');
  check((await official()) === OFF0, 'gauntlet results never touched Career / official keys');

  // ---- diamond answer challenge: tap rail, 0.1 steps, lock, difference + tolerance
  await upload(ex('demo-diamond-challenge.pooliq'));
  check(/WHERE SHOULD THE CUE BALL CONTACT THE RAIL/.test(await text('[data-question]')), 'diamond challenge preview shows the question (solution hidden behind a spoiler button)');
  await tap('[data-preview-actions] [data-href="#cplay/pending"]');
  await sleep(250);
  check((await exists('.solveScreen[data-phase="solve"] .playTable.tapRail')) && (await page.$eval('[data-action="cs-lock"]', (b) => b.disabled)), 'diamond challenge: tap-the-rail table, LOCK disabled until a point is picked');
  const dp = await svgToScreen('.playTable svg', 45, 0.4);
  await page.touchscreen.tap(dp.x, dp.y);
  await sleep(200);
  const pick1 = await page.$eval('[data-rail-pick]', (e) => e.dataset.railPick);
  await tap('[data-action="cs-step"][data-v="-0.1"]');
  const pick2 = await page.$eval('[data-rail-pick]', (e) => e.dataset.railPick);
  check(pick1 === 'top:3.6' && pick2 === 'top:3.5', `tap on the top rail snaps to 0.1 diamond (${pick1}); −0.1 nudges to ${pick2}`);
  await tap('[data-action="cs-lock"]');
  const dr = await page.evaluate(() => ({ v: document.querySelector('.diaReveal')?.dataset.verdict, diff: document.querySelector('.diaReveal')?.dataset.diff, your: document.querySelector('[data-your]')?.innerText, rec: document.querySelector('[data-rec]')?.innerText, line: document.querySelector('.diaLine')?.innerText || '' }));
  check(dr.your === '3.5' && dr.rec === '4.0' && Math.abs(Number(dr.diff) - 0.5) < 1e-9 && dr.v === 'close' && /Your answer: 3\.5 · Recommended: 4\.0 · Difference: 0\.5 diamonds/.test(dr.line), `reveal: YOUR ANSWER ${dr.your} / RECOMMENDED ${dr.rec} / DIFFERENCE ${dr.diff} → ${dr.v} (tolerance pass ±0.2, close ±0.5)`);
  const dl2 = await layout();
  check(dl2.bar <= dl2.ih + 1 && dl2.ow <= dl2.iw + 1, `diamond reveal: buttons on screen, no sideways scroll (${lstr(dl2)})`);
  check(await page.evaluate(() => [...document.querySelectorAll('.diaReveal, .diaLine, .cmpRow')].every((e) => getComputedStyle(e).position === 'static' && e.getBoundingClientRect().top > document.querySelector('.playTable').getBoundingClientRect().bottom - 1)), 'reveal boxes sit below the table (a "close" verdict never floats over it)');
  await shotC('72-diamond-reveal');
  await tap('[data-action="cs-again"]');
  const dp2 = await svgToScreen('.playTable svg', 50, 0.4);
  await page.touchscreen.tap(dp2.x, dp2.y);
  await sleep(150);
  await tap('[data-action="cs-lock"]');
  check((await page.$eval('.diaReveal', (e) => e.dataset.verdict)) === 'pass', 'TRY AGAIN → exact answer 4.0 → PASS');
  await tap('[data-action="cs-next"]');
  await sleep(200);
  check(/Attempt 1 of 5/.test(await text('.playHead')) && (await exists('.resultBar .rb[data-action="record"]')), 'then SHOOT IT: manual SUCCESS / MISS attempts on the normal play screen');
  await recordN(5);
  check(await exists('[data-sandbox-note]'), 'diamond challenge play test finishes with the sandbox note');

  // ---- player-solution challenge: choose technique / tip / SPEED, lock, compare
  await upload(ex('demo-player-solution.pooliq'));
  await tap('[data-preview-actions] [data-href="#cplay/pending"]');
  await sleep(250);
  await tap('[data-action="cs-tech"][data-v="draw"]');
  const cb = await page.$eval('#csBall', (s) => { const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.3 }; });
  await page.touchscreen.tap(cb.x, cb.y);
  await sleep(150);
  await tap('[data-action="cs-speed"][data-v="2"]');
  const tipTxt = await text('[data-tip-pick]');
  check(/above/.test(tipTxt), `tap on the upper cue ball picks a follow tip ("${tipTxt}")`);
  const psL = await layout();
  check(fits(psL), `player-solution picker fits 390×844 (${lstr(psL)})`);
  await shotC('73-solution-pick');
  await tap('[data-action="cs-lock"]');
  const cmp = await page.evaluate(() => ({ head: document.querySelector('.cmpHeadRow')?.innerText.replace(/\s+/g, ' '), rows: [...document.querySelectorAll('.cmpRow[data-field]')].map((r) => `${r.dataset.field}:${r.dataset.verdict}`) }));
  check(/PLAYER CHOICE/.test(cmp.head) && /RECOMMENDED/.test(cmp.head) && cmp.rows.length === 3 && cmp.rows.some((r) => /^technique:/.test(r) && !/:match$/.test(r)) && cmp.rows.some((r) => /^speed:match$/.test(r)), `LOCK MY ANSWER → PLAYER CHOICE vs RECOMMENDED (${cmp.rows.join(', ')})`);
  check(await page.evaluate(() => [...document.querySelectorAll('.cmpRow')].every((e) => getComputedStyle(e).position === 'static' && e.getBoundingClientRect().top > document.querySelector('.playTable').getBoundingClientRect().bottom - 1)), 'comparison rows (incl. CLOSE verdicts) laid out below the table');
  await shotC('74-solution-compare');
  await tap('[data-action="cs-next"]');
  await sleep(200);
  check((await exists('.playScreen .resultBar .rb[data-action="record"]')) && /Attempt 1 of 5/.test(await text('.playHead')), 'then the player physically attempts it: manual SUCCESS / MISS');
  await recordN(5);
  check(await exists('[data-sandbox-note]') && (await official()) === OFF0, 'player-solution play test: sandbox, official keys unchanged');

  // ---- legacy (v9) Create Drill export still imports; backup includes the new keys
  const legacyText = await page.evaluate(async () => { const m = await import('./js/customDrills.js'); return m.exportDrills(m.loadCustomDrills()); });
  const customN0 = (await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1')).drills)).length;
  await upload(writeTmp('my-drills-v9.json', legacyText));
  const customN1 = (await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1')).drills)).length;
  check(/#content$/.test(await hash()) && customN1 === customN0 * 2 && /older Pool IQ format/.test(await text('#toast')), `older Create Drill export (v9 JSON) still imports into My Drills (${customN0} → ${customN1})`);
  const legacyNow = await page.evaluate(() => JSON.parse(localStorage.getItem('poolIQCustomDrillsV1')).drills);
  check(legacyBefore.every((d) => norm(legacyNow.find((x) => x.id === d.id)) === norm(d)), 'existing custom drills untouched by the migration/import');
  const stNow = await getState();
  check(stNow.xp === stateBefore.xp && norm(stNow.games) === norm(stateBefore.games) && norm(stNow.ghostMatches) === norm(stateBefore.ghostMatches) && norm(stNow.settings) === norm(stateBefore.settings), 'v9 data intact after all content work: Career XP, game history, Ghost history, settings');
  await go(`#play/drills/${legacyBefore[0].id}`);
  await sleep(250);
  check(await exists('.playScreen .playTable svg'), 'old custom drill still plays');
  const bk = await page.evaluate(() => JSON.parse(window.PoolIQ.backupPayload().text));
  const nItems = (await items()).length;
  check(!!bk.keys.poolIQContentV1 && !!bk.keys.poolIQContentProgressV1 && bk.keys.poolIQContentV1.items.length === nItems && bk.summary?.content === nItems, `Back Up file includes My Content + content progress keys; its summary counts ${bk.summary?.content} content items`);
  const mir = await page.evaluate(async () => { await window.PoolIQ.vault.flush(); const m = await window.PoolIQ.vault.getMirror(); return m && m.keys; });
  check(mir && mir.poolIQContentV1 === (await page.evaluate(() => localStorage.getItem('poolIQContentV1'))) && mir.poolIQContentProgressV1 === (await page.evaluate(() => localStorage.getItem('poolIQContentProgressV1'))), 'My Content keys are mirrored to IndexedDB');
  const parsed = await page.evaluate(() => { const b = window.PoolIQ.V.parseBackup(window.PoolIQ.backupPayload().text); return { content: b.summary.content, has: typeof b.keys.poolIQContentV1 === 'string' && typeof b.keys.poolIQContentProgressV1 === 'string' }; });
  check(parsed.has && parsed.content === nItems, `restore reads the content keys back and its summary shows MY CONTENT ${parsed.content}`);
  await page.evaluate(() => localStorage.clear());
  await reload();
  check((await items()).length === nItems, 'localStorage wiped → My Content restored from the IndexedDB safety copy on reload');

  // ---- progressive coaching still applies to imported drills (Advanced: plan + LOCK before the recipe / Aim View)
  await go('#settings');
  await tap('[data-action="set-coach"][data-v="advanced"]');
  await upload(ex('demo-single-drill.pooliq'));
  await go('#cplay/pending');
  await sleep(250);
  check((await exists('.planner[data-planner="1"]')) && !(await exists('.recipeRow .gauge-aim .aim-view[data-cut]')) && (await page.$eval('.lockBtn', (e) => e.disabled)), 'Advanced coaching: imported drill hides the recipe / Aim View behind the plan + LOCK MY ANSWER');
  await tap('[data-action="plan-tech"][data-v="stop"]');
  await tap('[data-action="plan-speed"][data-v="1.5"]');
  await tap('[data-action="plan-rails"][data-v="0"]');
  { const box = await (await page.$('.plBall svg')).boundingBox(); await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.6); await sleep(150); }
  await tap('.lockBtn:not([disabled])');
  await page.waitForSelector('#sheet .cmpRow', { timeout: 3000 });
  check((await page.$$('#sheet .cmpRow[data-verdict]')).length >= 4, 'Advanced: LOCK shows the PLAYER vs Pool IQ comparison for the imported shot');
  await hideSheet();
  check((await exists('.recipeRow .gauge-aim .aim-view[data-cut]')) && (await exists('.resultBar .rb[data-action="record"]')), 'Advanced: after locking, Aim View + SUCCESS / MISS appear');
  await go('#settings');
  await tap('[data-action="set-coach"][data-v="beginner"]');

  // ---- My Content list screenshot + hub checks
  await go('#content');
  const hubCounts = await page.$$eval('.cSec[data-section]', (els) => els.map((e) => `${e.dataset.section}:${e.querySelectorAll('.cItem').length}`).join(','));
  check(/packs:1/.test(hubCounts) && /games:1/.test(hubCounts) && /drills:\d+/.test(hubCounts), `My Content lists items by section (${hubCounts})`);
  const hubTap = await page.evaluate(() => Math.min(...[...document.querySelectorAll('.cItem .miniAct, [data-import-btn]')].map((e) => e.getBoundingClientRect().height)));
  check(hubTap >= 44, `My Content action buttons ≥ 44px tall (${Math.round(hubTap)}px)`);
  await shotC('75-my-content');
  await go('#home');
  await go(`#cedit/${packUid}`);
  const el = await page.evaluate(() => ({ list: !!document.querySelector('[data-edit-list]'), shots: document.querySelectorAll('.editShot').length, fonts: [...document.querySelectorAll('#view input, #view textarea, #view select')].filter((e) => e.type !== 'file').map((e) => parseFloat(getComputedStyle(e).fontSize)) }));
  check(el.list && el.shots >= 3 && Math.min(...el.fonts) >= 16, `EDIT on a pack: details form (inputs ≥ 16px) + every shot is editable (${el.shots})`);
  await page.$eval('#ce-version', (e) => { e.value = '1.1'; });
  await tap('[data-action="ce-save-meta"]');
  check((await items()).find((i) => i.uid === packUid)?.contentVersion === '1.1', 'pack details save (version 1.1)');

  // ---- phone sizes: play screens fit without scrolling
  const screens = [['drill play test', ex('demo-single-drill.pooliq'), '#cplay/pending'], ['gauntlet', ex('demo-gauntlet.pooliq'), '#cplay/pending'], ['diamond challenge', ex('demo-diamond-challenge.pooliq'), '#cplay/pending'], ['lesson', ex('demo-lesson.pooliq'), '#cplay/pending'], ['player solution', ex('demo-player-solution.pooliq'), '#cplay/pending']];
  for (const [ua, w, h, tag] of [[IPHONE_UA, 375, 667, 'iPhone'], [ANDROID_UA, 412, 915, 'Android'], [ANDROID_UA, 360, 800, 'Android']]) {
    await page.setUserAgent(ua);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w === 412 ? 2.625 : w === 375 ? 2 : 3, isMobile: true, hasTouch: true });
    await page.evaluate(() => history.replaceState(null, '', '#content'));
    await reload();
    const hl = await layout();
    check(hl.ow <= hl.iw + 1, `${tag} ${w}×${h}: My Content has no sideways scroll`);
    for (const [name, file, href] of screens) {
      await upload(file);
      await go(href);
      await sleep(250);
      const l = await layout();
      check(fits(l) && l.minTap >= 44 && l.table >= w - 40, `${tag} ${w}×${h}: ${name} fits without scrolling, big table + buttons (${lstr(l)})`);
      if (w === 375 && name === 'gauntlet') await shotC('76-gauntlet-375');
      if (w === 412 && name === 'diamond challenge') await shotC('77-diamond-android-412');
    }
    await upload(ex('demo-single-drill.pooliq'));
    const pl = await layout();
    check(pl.ow <= pl.iw + 1, `${tag} ${w}×${h}: preview has no sideways scroll`);
    if (w === 375) await shotC('78-preview-375');
  }
  await page.setUserAgent(IPHONE_UA);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.evaluate(() => history.replaceState(null, '', '#content'));
  await reload();
  check(errors.length === errBefore, `My Content: zero console errors (${errors.length - errBefore})`);
  if (errors.length > errBefore) console.log(errors.slice(errBefore).join('\n'));
}

// ------------------------------------------------------------------------------------------ v11: progression, profile, friends, DEV MODE
{
  const errBefore = errors.length;
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const shotV = async (name, full = true) => { if (SHOTS) { await sleep(200); await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: full }); } };
  const val = async (sel, v) => { await page.waitForSelector(sel, { timeout: 4000 }); await page.$eval(sel, (el, x) => { el.value = x; el.dispatchEvent(new Event('input', { bubbles: true })); }, v); };
  const P = (fn, ...a) => page.evaluate(fn, ...a);

  // Career header / Promotion / Skill Gate / Drill Rank / skills
  await go('#career');
  check(await exists('.careerHead[data-ball] .ballBadge'), 'v11 career: ball badge header');
  check(/·\s*\d+-Ball/.test(await text('[data-rank-title]')), `v11 career: rank title shows the ball level (${await text('[data-rank-title]')})`);
  check(await exists('[data-tier-caps] .tcRow[data-tier="beginner"]'), 'v11 career: tier caps shown');
  check(await exists('.promoCard[data-promo]'), 'v11 career: Promotion Test card');
  await shotV('v11-01-career');
  await go('#promo');
  check((await page.$$('.checkRow')).length > 3, 'v11 promo: full checklist with ✅/❌ rows');
  await shotV('v11-02-promotion-locked');
  await go('#gate/g-club');
  check(await exists('[data-gate-page="g-club"] .checkRow'), 'v11 gate: Skill Gate screen lists foundations');
  await shotV('v11-03-skill-gate');
  await go('#skills');
  check((await page.$$('.skillRow[data-skill]')).length === 12, 'v11 skills: 12-skill breakdown');
  await shotV('v11-04-skill-breakdown');
  await go('#skill/draw');
  check(await exists('[data-skill-page="draw"]'), 'v11 skill detail page');
  await go('#training');
  check(await exists('.recCard .bigBtn[data-href]'), 'v11 recommended training has GO buttons into real content');
  await shotV('v11-05-recommended');
  await go('#drills');
  check(await exists('.drillRankCard[data-drill-rank]'), 'v11 drills: Drill Rank card at the top of the Drills tab');
  await go('#drillrank');
  check((await page.$$('.drRow')).length === 8, 'v11 drill rank page lists 8 ranks');
  await shotV('v11-06-drill-rank');
  const progA = await P(() => JSON.parse(localStorage.getItem('poolIQStateV4')).prog);
  check(progA && progA.v >= 1 && progA.lifetimeXp > 0, `v11: progression state saved (lifetime ${progA && progA.lifetimeXp})`);

  // Result screen XP line
  await go('#play/landing/lz-1');
  await recordLast(12);
  check(await exists('.resultPanel [data-award]'), 'v11 result screen shows +XP line');
  await shotV('v11-07-result-xp', false);

  // Local player profile: name + photo (file input with capture), shown on Profile
  await go('#me');
  check(await exists('input[type=file][data-avatar-input="me"][capture]'), 'profile: TAKE PHOTO input uses capture');
  await val('#meName', 'Andrew');
  await tap('[data-action="me-save"]');
  const photo = '/tmp/pooliq-e2e-photo.png';
  await page.screenshot({ path: photo, clip: { x: 0, y: 0, width: 390, height: 300 } });
  const inp = await page.$('input[type=file][data-avatar-input="me"]:not([capture])');
  await inp.uploadFile(photo);
  await page.waitForFunction(() => { const p = JSON.parse(localStorage.getItem('poolIQProfileV1') || '{}'); return typeof p.avatar === 'string'; }, { timeout: 6000 }).catch(() => {});
  const prof = await P(() => JSON.parse(localStorage.getItem('poolIQProfileV1') || '{}'));
  check(prof.displayName === 'Andrew' && /^[0-9a-f-]{36}$/.test(prof.id) && prof.updatedAt > 0, 'profile: name saved with a stable UUID + updatedAt');
  check(typeof prof.avatar === 'string' && /^data:image\/(webp|jpeg);base64,/.test(prof.avatar) && prof.avatar.length < 90 * 1024, `profile: photo stored as a small data URL (${prof.avatar ? Math.round(prof.avatar.length / 1024) : 0} KB)`);
  const dim = await P((src) => new Promise((r) => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([0, 0]); i.src = src; }), prof.avatar || '');
  check(dim[0] === 256 && dim[1] === 256, `profile: photo cropped square + downscaled to 256px (${dim.join('×')})`);
  await go('#profile');
  check(await exists('.profileHead [data-avatar="photo"] img') && /Andrew/.test(await text('[data-player-name]')), 'profile header shows photo + name');
  check(await exists('.profileHead .ballBadge') && await exists('.profileHead .drillBadge'), 'profile header shows Career ball badge + Drill Rank');
  await shotV('v11-08-profile');
  await go('#me/stats');
  const pub = JSON.parse(await text('[data-public-stats] .jsonBox'));
  check(pub.format === 'pool-iq-public-stats' && pub.profileId === prof.id && pub.career && pub.drillRank && pub.skills, 'profile: exportable public stats summary');
  const bk = await P(() => window.PoolIQ.backupPayload().obj);
  check(!!bk.keys?.poolIQProfileV1, 'profile key is included in backups');

  // Friends / PvP
  const lifeBefore = (await getState()).prog.lifetimeXp;
  await go('#friends');
  for (const n of ['Mike', 'Sam', 'Jess']) {
    await tap('[data-action="fr-add"]');
    await val('#frName', n);
    await tap('[data-action="fr-save"]');
    await sleep(150);
  }
  check((await page.$$('.playerRow')).length === 4, 'friends: me + 3 players listed');
  await shotV('v11-09-friends');
  const mike = await P(() => JSON.parse(localStorage.getItem('poolIQFriendsV1')).players.find((p) => p.name === 'Mike').id);
  const meP = await P(() => JSON.parse(localStorage.getItem('poolIQFriendsV1')).players.find((p) => p.isMe).id);
  check(meP === prof.id, 'friends: the phone owner player uses the profile id');
  await go(`#friend/${mike}`);
  await tap('[data-action="fr-match-vs"]');
  await tap('[data-action="fr-race"][data-v="2"]');
  await tap('[data-action="fr-start"]');
  await tap(`[data-action="fr-rack"][data-id="${meP}"]`);
  await tap(`[data-action="fr-rack"][data-id="${mike}"]`);
  check(/HILL-HILL/.test(await text('#view')), 'friends: live match shows hill-hill');
  await tap(`[data-action="fr-rack"][data-id="${meP}"]`);
  await shotV('v11-10-live-match', false);
  await tap('[data-action="fr-save-match"]');
  await sleep(200);
  check((await text('[data-h2h-a]')) === '1' && (await text('[data-h2h-b]')) === '0', 'friends: head-to-head updates after a match');
  await shotV('v11-11-h2h');
  // group session
  await go('#friends');
  await tap('[data-action="fr-session-new"]');
  await tap('#sheet [data-action="fr-race"][data-v="3"]');
  await tap('[data-action="fr-session-start"]');
  await sleep(200);
  check(await exists('[data-session-table]') && await exists('[data-next-pair]'), 'friends: group session with table + next pairing');
  await tap('[data-action="fr-session-quick"]');
  await val('#qsA', '3'); await val('#qsB', '1');
  await tap('[data-action="fr-quick-save"]');
  await sleep(200);
  check(/1–0/.test(await text('[data-session-table]')), 'friends: session table counts the result');
  await shotV('v11-12-group-session');
  // single elimination (4 players)
  await go('#tnew');
  await tap('[data-action="fr-format"][data-v="single"]');
  await tap('[data-action="fr-race"][data-v="3"]');
  await tap('[data-action="fr-t-create"]');
  await sleep(200);
  check(await exists('[data-bracket] .tMatch'), 'tournament: bracket rendered');
  for (let k = 0; k < 3; k++) {
    const b = await page.$('[data-action="fr-t-score"]');
    if (!b) break;
    await P(() => document.querySelector('[data-action="fr-t-score"]').click()); await sleep(200);
    await val('#qsA', '3'); await val('#qsB', String(k));
    await tap('[data-action="fr-quick-save"]');
    await sleep(250);
  }
  check(await exists('[data-champion]'), 'tournament: single elimination crowns a champion');
  await shotV('v11-13-bracket');
  // round robin (3 players → BYE rotation)
  await go('#tnew');
  await tap('[data-action="fr-format"][data-v="roundrobin"]');
  await P(() => { document.querySelectorAll('#pickMany .pickP.active')[0]?.click(); });
  await tap('[data-action="fr-t-create"]');
  await sleep(200);
  let rrN = 0;
  for (let k = 0; k < 6; k++) {
    const b = await page.$('[data-action="fr-t-score"]');
    if (!b) break;
    await P(() => document.querySelector('[data-action="fr-t-score"]').click()); await sleep(200);
    await val('#qsA', '3'); await val('#qsB', '2');
    await tap('[data-action="fr-quick-save"]');
    await sleep(250); rrN++;
  }
  check(rrN === 3 && await exists('[data-standings] .stRowT[data-place="1"]') && await exists('[data-champion]'), `tournament: round robin standings + winner (${rrN} matches)`);
  await shotV('v11-14-round-robin');
  const lifeAfter = (await getState()).prog.lifetimeXp;
  check(lifeAfter === lifeBefore, 'PvP never changes training XP / ranks');
  const fr = await P(() => JSON.parse(localStorage.getItem('poolIQFriendsV1')));
  check(fr.matches.length >= 8 && fr.matches.filter((m) => m.tournamentId).length >= 6, `friends: tournament results are normal match records (${fr.matches.length})`);

  // DEV MODE
  await go('#settings');
  check(await exists('[data-card="dev"]'), 'settings shows DEV MODE entry');
  await go('#dev');
  check(await exists('[data-dev-state="setup"]'), 'dev: first use asks for a passcode');
  check(/not server security/i.test(await text('#view')), 'dev: honest "convenience lock" notice');
  await val('#devPass1', 'cue1234'); await val('#devPass2', 'cue1234');
  await tap('[data-action="dev-set"]');
  await page.waitForSelector('[data-dev-state="unlocked"]', { timeout: 5000 }).catch(() => {});
  const devRec = await P(() => JSON.parse(localStorage.getItem('poolIQDevV1') || '{}'));
  check(/^[0-9a-f]{64}$/.test(devRec.hash || '') && devRec.salt && !JSON.stringify(devRec).includes('cue1234'), 'dev: only a salted SHA-256 hash is stored');
  await tap('[data-action="dev-lock"]');
  check(await exists('[data-dev-state="locked"]'), 'dev: LOCK locks');
  await val('#devPass', 'wrong-code');
  await tap('[data-action="dev-unlock"]');
  await sleep(300);
  check(await exists('[data-dev-state="locked"]'), 'dev: wrong passcode rejected');
  await val('#devPass', 'cue1234');
  await tap('[data-action="dev-unlock"]');
  await page.waitForSelector('[data-dev-state="unlocked"]', { timeout: 5000 }).catch(() => {});
  check(await exists('[data-dev-state="unlocked"]'), 'dev: correct passcode unlocks');
  await shotV('v11-15-dev-mode');
  // override a built-in stage with the builder, then reset
  await go('#devedit/landing/lz-1');
  check(await exists('[data-drill-fix]'), 'dev: built-in stage opens in the owner editor');
  await tap('[data-action="df-save"]');
  await sleep(300);
  const ov = await P(() => JSON.parse(localStorage.getItem('poolIQDevOverridesV1') || '{}'));
  check(!!ov.items?.['stage:landing:lz-1'], 'dev: override saved in its own key');
  await go('#devgame/landing');
  check(await exists('[data-dev-stage="lz-1"][data-overridden="1"]'), 'dev: stage marked OVERRIDDEN');
  const exported = await P(async () => (await import('./js/dev/dev.js')).exportOverridesPack());
  check(exported.count === 1 && exported.doc.contentType === 'pack', 'dev: overrides export as a .pooliq pack');
  await tap('[data-action="dev-reset"][data-id="stage:landing:lz-1"]');
  check(await exists('[data-dev-stage="lz-1"][data-overridden="0"]'), 'dev: RESET TO ORIGINAL removes the override');
  const reimp = await P(async (doc) => { const D = await import('./js/dev/dev.js'); const r = D.importOverridesPack(JSON.stringify(doc)); (await import('./js/games/registry.js')).clearStageCache(); return r.applied; }, exported.doc);
  check(reimp === 1, 'dev: overrides pack re-imports');
  await P(async () => { (await import('./js/dev/overrides.js')).removeOverride('stage:landing:lz-1'); (await import('./js/games/registry.js')).clearStageCache(); });
  // seed a test state (Champion) and restore the real progress
  const realRank = (await getState()).rankIndex;
  await go('#dev');
  await tap('[data-action="dev-seed-rank"][data-v="9"]');
  await tap('[data-action="dev-seed"][data-what="rank"]');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('poolIQStateV4')).rankIndex === 9, { timeout: 6000 }).catch(() => {});
  const seeded = await getState();
  check(seeded.rankIndex === 9 && seeded.devSeed, 'dev: seeded Champion test state (flagged DEV)');
  await go('#champion');
  check(await exists('[data-champion-stats]') && /MAX RANK/.test(await text('#view')), 'Champion (max rank) stats screen');
  await shotV('v11-16-champion');
  await go('#career');
  await shotV('v11-17-career-champion');
  await go('#dev');
  await tap('[data-action="dev-restore-real"]');
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1' && !JSON.parse(localStorage.getItem('poolIQStateV4')).devSeed, { timeout: 10000 }).catch(() => {});
  await sleep(400);
  const restored = await getState();
  check(restored.rankIndex === realRank && !restored.devSeed, `dev: RESTORE MY REAL PROGRESS brings the real rank back (${restored.rankIndex})`);
  check(!!(await P(() => localStorage.getItem('poolIQDevV1'))), 'dev: passcode survives the restore');

  // new screens: no sideways scroll at 4 phone sizes
  for (const [w, h] of [[390, 844], [375, 667], [412, 915], [360, 800]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const bad = [];
    for (const r of ['#home', '#career', '#promo', '#gate/g-club', '#skills', '#training', '#champion', '#drillrank', '#drills', '#profile', '#me', '#me/stats', '#friends', '#fmatch/new', '#tnew', `#friend/${mike}`, `#h2h/${meP}/${mike}`, '#dev', '#settings']) {
      await go(r);
      const o = await P(() => document.documentElement.scrollWidth - innerWidth);
      if (o > 1) bad.push(`${r}:${o}`);
    }
    check(!bad.length, `v11 screens ${w}×${h}: no sideways scroll ${bad.join(' ')}`);
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  check(errors.length === errBefore, `v11 screens: zero console errors (${errors.length - errBefore})`);
  if (errors.length > errBefore) console.log(errors.slice(errBefore).join('\n'));
}

// ------------------------------------------------------------------------------------------ v11.1
{
  const errBefore = errors.length;
  const V390 = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  await page.setViewport(V390);
  const simSt = () => page.evaluate(() => { const st = window.PoolIQ.screen.state; return { balls: st.balls, shot: st.shot, mode: st.mode, game: !!st.game, res: st.res ? { dur: st.res.duration, final: st.res.final } : null, playT: st.playT, playing: st.playing }; });
  const simLink = (balls, shot) => page.evaluate(async (balls, shot) => '#sim/s=' + (await import('./js/sim/share.js')).encodeState({ balls, shot, annotations: [] }), balls, shot);
  async function openSim(balls, shot) {
    await page.evaluate(() => { let d = {}; try { d = JSON.parse(localStorage.getItem('poolIQSimV1') || '{}'); } catch { d = {}; } d.settings = { ...(d.settings || {}), tableFt: 9 }; localStorage.setItem('poolIQSimV1', JSON.stringify(d)); });
    await go('#home');
    await go(await simLink(balls, shot));
    await page.waitForSelector('.simScreen[data-mode="edit"] #simSvg', { timeout: 5000 }).catch(() => {});
    await page.waitForSelector('#simPreview .pv-path.pv-cue', { timeout: 5000 }).catch(() => {});
    await sleep(250);
    await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.classList.remove('show'); });
  }
  const pvInfo = () => page.evaluate(() => ({
    cue: document.querySelectorAll('#simPreview .pv-path.pv-cue').length,
    ob: document.querySelectorAll('#simPreview .pv-path.pv-ob').length,
    railsCue: [...document.querySelectorAll('#simPreview .pv-rail.pv-rail-cue')].map((g) => +g.dataset.n),
    railsOb: document.querySelectorAll('#simPreview .pv-rail.pv-rail-ob').length,
    tags: [...document.querySelectorAll('#simPreview .pv-tag')].map((g) => g.dataset.tag),
    ends: [...document.querySelectorAll('#simPreview .pv-end')].map((g) => ({ ball: g.dataset.ball, end: g.dataset.end, pocket: g.dataset.pocket || null, x: +g.dataset.x, y: +g.dataset.y })),
    pts: document.querySelector('#simPreview .pv-path.pv-cue')?.getAttribute('points') || '',
    label: document.querySelector('.simSpeed .spRow b')?.textContent.trim(),
    summary: document.querySelector('#pvSummary')?.textContent.trim() || '',
    stub: document.querySelectorAll('#simSvg .rail-preview').length,
    labelFont: (() => { const t = document.querySelector('#simPreview .pv-rail text'); if (!t) return 0; return t.getBoundingClientRect().height; })()
  }));

  // 1. Table Games rename
  await go('#home');
  const navInfo = await page.evaluate(() => { const b = document.querySelector('nav [data-page="arcade"]'); const sp = b.querySelector('span'); const r = sp.getBoundingClientRect(); const br = b.getBoundingClientRect(); return { txt: sp.textContent, fits: sp.scrollWidth <= sp.clientWidth + 1 && r.left >= br.left - 1 && r.right <= br.right + 1, navTxt: document.querySelector('nav').innerText }; });
  check(navInfo.txt === 'Table Games' && !/Arcade/.test(navInfo.navTxt) && navInfo.fits, `bottom nav tab reads "Table Games" and fits its button (${navInfo.txt})`);
  const homeTxt = await text('#view');
  check(/Table Games/.test(homeTxt) && !/Arcade/.test(homeTxt), 'home screen says Table Games, never Arcade');
  await go('#tablegames');
  await sleep(150);
  const tgTxt = await text('#view');
  check((await page.$$('.gameCard[data-game]')).length === 14 && /TABLE GAMES/.test(tgTxt) && !/Arcade/.test(tgTxt), '#tablegames alias opens the Table Games hub (14 games, no "Arcade")');
  check(await page.$eval('nav [data-page="arcade"]', (b) => b.classList.contains('active')), 'Table Games tab is highlighted on #tablegames');
  await go('#arcade');
  await shot('v111-01-nav-table-games');
  await go('#game/speed');
  const lobbyTxt = await text('#view');
  check(/‹ Table Games/.test(lobbyTxt) && !/Arcade/.test(lobbyTxt), 'game lobby back button says "‹ Table Games"');
  for (const r of ['#career', '#profile', '#settings', '#drillrank', '#skills', '#ghost']) {
    await go(r);
    const t = await text('#view');
    if (/Arcade/.test(t)) check(false, `${r} still shows "Arcade"`);
  }
  check(true, 'career, profile, settings, drill rank, skills and ghost screens never show "Arcade"');

  // 2. speed meanings + mini diagram on the Speed Ladder play screen
  const M = await page.evaluate(async () => { const s = await import('./js/games/speed.js'); return { m15: s.speedMeaning(1.5), m25: s.speedMeaning(2.5), m3: s.speedMeaning(3), m7: s.speedMeaning(7) }; });
  await go('#play/speed/sp-2');
  await sleep(200);
  const sx = await page.evaluate(() => { const e = document.querySelector('.speedExplain[data-speed-explain="1.50"]'); const svg = e?.querySelector('svg.speed-mini'); return { txt: e?.innerText || '', stop: svg?.dataset.stopDiamond, label: svg?.querySelector('.sm-stop-label')?.textContent, w: svg?.getBoundingClientRect().width || 0, noScroll: document.documentElement.scrollHeight <= innerHeight + 2, bar: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1, name: document.querySelector('#view').innerText }; });
  check(sx.txt.includes(M.m15) && sx.stop === '3' && sx.label === 'STOP · 3rd diamond' && sx.w >= 90, `Speed Ladder SPEED 1.50: plain meaning + mini diagram with STOP · 3rd diamond ("${M.m15}")`);
  check(/Back to the 3rd Diamond/.test(sx.name), 'Speed Ladder stage name follows the new meaning');
  check(sx.noScroll && sx.bar, '390×844: speed stage with the mini diagram still fits without scrolling');
  await shot('v111-04-speed-explain-diagram');
  // recipe card (Why sheet / recipe) shows the meaning + diagram + tip clock
  await go('#play/landing/lz-1');
  const gTip = await page.evaluate(() => { const g = document.querySelector('.recipeRow .gauge-tip, .recipeRow .gauge:nth-child(2)'); const b = g?.querySelector('b'); const c = g?.querySelector('[data-tip-clock]'); return { clock: c?.textContent || '', under: !!(b && c && c.getBoundingClientRect().top >= b.getBoundingClientRect().bottom - 1) }; });
  check(/o'clock|^Center$/.test(gTip.clock) && gTip.under, `Shot Recipe tip gauge: clock reading under the tip text ("${gTip.clock}")`);
  await page.$eval('.recipeRow .gauge-speed', (e) => e.click());
  await sleep(350);
  const rc = await page.evaluate(() => ({ diag: !!document.querySelector('#sheet [data-speed-diagram]'), clock: document.querySelector('#sheet [data-tip-clock]')?.textContent || '', mean: document.querySelector('#sheet .rc-mean')?.textContent || '' }));
  check(rc.diag && rc.clock && /Stops/.test(rc.mean), `Shot Recipe card: speed meaning + mini diagram + tip clock ("${rc.clock}")`);
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  // 3. Shot Simulator: full-path preview at SPEED 7, markers, match with SHOOT
  const potLayout = [{ id: 'cue', x: 30, y: 30 }, { id: 1, x: 62.5, y: 18.75 }];
  const potAim = await page.evaluate(async () => (await import('./js/sim/physics.js')).ghostAim({ x: 30, y: 30 }, { x: 62.5, y: 18.75 }, 'TR').aim);
  await openSim(potLayout, { aim: potAim, speed: 7, vTips: 0, hTips: 0 });
  let pv = await pvInfo();
  check(pv.label === 'SPEED 7.00', `simulator speed readout uses two decimals (${pv.label})`);
  check(pv.cue === 1 && pv.ob === 1 && pv.railsCue.length >= 3 && pv.railsCue.every((n, i) => n === i + 1), `SPEED 7 preview: full cue-ball path through ${pv.railsCue.length} numbered rails (${pv.railsCue.join(',')}) + object-ball path`);
  check(pv.tags.includes('POCKET') && pv.ends.some((e) => e.ball === '1' && e.end === 'pocket' && e.pocket === 'TR') && pv.tags.some((t) => t === 'STOP'), `preview end markers: POCKET on the 1 (TR), STOP for the cue ball (${pv.tags.join(', ')})`);
  check(pv.stub === 0 && /pocket/i.test(pv.summary), `preview replaces the old first-rail stub; summary "${pv.summary}"`);
  check(pv.labelFont >= 7, `rail numbers are readable on a phone (${pv.labelFont.toFixed(1)} px tall)`);
  const spMean = await page.evaluate(() => ({ m: document.querySelector('.simSpeed .spMean')?.textContent || '', d: !!document.querySelector('#simSpeedDiagram'), tip: document.querySelector('.simTip [data-tip-clock]')?.textContent, sum: document.querySelector('#pvSummary')?.textContent || '' }));
  check(!spMean.m && !spMean.d && /pocket|rail|cue/i.test(spMean.sum), 'simulator: route paragraph and mini speed diagram are gone; preview summary stays for the path');
  check(spMean.tip === 'Center', `simulator tip clock: "Center" for a centre hit (${spMean.tip})`);
  await shot('v111-02-sim-speed7-preview');
  // preview == SHOOT
  const before = pv.ends;
  await tap('.shootBtn');
  await page.waitForFunction(() => { const st = window.PoolIQ.screen.state; return st.mode === 'play' && st.res; }, { timeout: 8000 }).catch(() => {});
  await tap('[data-action="sim-end"]').catch(() => {});
  await sleep(250);
  const shotRes = await simSt();
  const mism = [];
  for (const e of before) {
    const f = shotRes.res?.final.find((b) => String(b.id) === e.ball);
    if (!f) { mism.push(`${e.ball}: missing`); continue; }
    if (e.end === 'pocket') { if (f.on || f.pocket !== e.pocket) mism.push(`${e.ball}: preview ${e.pocket}, shot ${f.pocket || 'on table'}`); }
    else if (!f.on || Math.hypot(f.x - e.x, f.y - e.y) > 0.02) mism.push(`${e.ball}: preview ${e.x},${e.y} vs shot ${f.x.toFixed(2)},${f.y.toFixed(2)}`);
  }
  check(before.length >= 2 && mism.length === 0, `SHOOT ends exactly where the preview said (${before.map((e) => `${e.ball}→${e.end === 'pocket' ? e.pocket : `${e.x},${e.y}`}`).join(' ')}) ${mism.join('; ')}`);
  check(!(await exists('#simPreview .pv-path')), 'preview is hidden while the shot plays');
  // SPEED 7 toward a rail with no object ball: multi-rail kick, STOP/SCRATCH marker, and a second match check
  await openSim([{ id: 'cue', x: 25, y: 25 }], { aim: 60, speed: 7, vTips: 0, hTips: 0 });
  pv = await pvInfo();
  check(pv.railsCue.length >= 4 && pv.tags.length === 1 && /STOP|SCRATCH/.test(pv.tags[0]), `SPEED 7 into a rail: ${pv.railsCue.length} numbered rails and a ${pv.tags[0]} marker`);
  const kickEnd = pv.ends[0];
  await tap('.shootBtn');
  await page.waitForFunction(() => { const st = window.PoolIQ.screen.state; return st.mode === 'play' && st.res; }, { timeout: 8000 }).catch(() => {});
  const kickRes = (await simSt()).res?.final.find((b) => b.id === 'cue');
  check(kickRes && (kickEnd.end === 'pocket' ? kickRes.pocket === kickEnd.pocket : Math.hypot(kickRes.x - kickEnd.x, kickRes.y - kickEnd.y) < 0.02), `multi-rail kick: SHOOT final cue position matches the preview (${kickEnd.x},${kickEnd.y})`);
  // live updates: aim, speed and spin all redraw the path
  await openSim(potLayout, { aim: potAim, speed: 7, vTips: 0, hTips: 0 });
  const p0 = (await pvInfo()).pts;
  await tap('[data-action="sim-speed"][data-v="-0.25"]');
  await sleep(300);
  const p1 = await pvInfo();
  check(p1.label === 'SPEED 6.75' && p1.pts && p1.pts !== p0, `preview redraws live when SPEED changes (7.00 → ${p1.label})`);
  const cueNow = (await simSt()).balls.find((b) => b.id === 'cue');
  const ap = await page.evaluate((x, y) => { const svg = document.querySelector('#simSvg'); const p = svg.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; }, cueNow.x + 15, cueNow.y + 6);
  await page.mouse.move(ap.x, ap.y);
  await page.mouse.down();
  await page.mouse.move(ap.x + 50, ap.y + 18);
  await page.mouse.up();
  await sleep(300);
  const p2 = (await pvInfo()).pts;
  check(p2 && p2 !== p1.pts, 'preview redraws live when the aim changes');
  await openSim(potLayout, { aim: potAim, speed: 7, vTips: 0.5, hTips: 0.5 });
  const p3 = await pvInfo();
  const tipC = await page.evaluate(() => { const b = document.querySelector('.simTip small[data-tip]'); const c = document.querySelector('.simTip [data-tip-clock]'); return { t: b?.textContent, c: c?.textContent, under: !!(b && c && c.getBoundingClientRect().top >= b.getBoundingClientRect().bottom - 1) }; });
  check(p3.pts && p3.pts !== p0, 'preview changes with spin (top-right tip vs centre)');
  check(tipC.c === "1:30 o'clock" && tipC.under, `simulator tip clock under the tip text ("${tipC.t}" → "${tipC.c}")`);
  await shot('v111-03-tip-clock-sim');
  // smooth: many rapid changes are throttled (no long tasks piling up)
  const tRapid = await page.evaluate(async () => { const t0 = performance.now(); const up = document.querySelector('[data-action="sim-speed"][data-v="0.25"]'); const dn = document.querySelector('[data-action="sim-speed"][data-v="-0.25"]'); for (let i = 0; i < 12; i++) (i % 2 ? dn : up).click(); await new Promise((r) => setTimeout(r, 400)); return performance.now() - t0; });
  check(tRapid < 2500 && (await exists('#simPreview .pv-path.pv-cue')), `12 rapid speed changes stay responsive (${Math.round(tRapid)} ms incl. 400 ms settle)`);
  // tip picker pop-up: open, drag (touch + mouse), live values + preview, miscue limit, Center, Done, tap outside — 4 sizes
  const pickInfo = () => page.evaluate(() => {
    const p = document.querySelector('#tipPicker');
    if (!p) return null;
    const r = p.getBoundingClientRect();
    const ball = p.querySelector('.tipPopBall').getBoundingClientRect();
    const hit = p.querySelector('.tp-hit').getBoundingClientRect();
    const small = document.querySelector('.simTip svg, .builderScreen .simTip svg')?.getBoundingClientRect();
    return {
      v: +p.dataset.vtips, h: +p.dataset.htips, label: p.querySelector('[data-tip-label]').textContent, clock: p.querySelector('[data-tip-clock]').textContent, off: p.querySelector('[data-tip-offsets]').textContent,
      inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, ballW: ball.width, vw: innerWidth, hit: Math.min(hit.width, hit.height),
      btn: Math.min(...[...p.querySelectorAll('.tpBtns button')].map((b) => b.getBoundingClientRect().height)),
      textBelow: p.querySelector('.tpText').getBoundingClientRect().top >= ball.bottom - 1 && p.querySelector('.tpBtns').getBoundingClientRect().top >= p.querySelector('.tpText').getBoundingClientRect().bottom - 1,
      near: small ? Math.hypot((r.left + r.right) / 2 - (small.left + small.right) / 2, Math.min(Math.abs(r.bottom - small.top), Math.abs(r.top - small.bottom))) < 260 : true,
      ballBox: { x: ball.left, y: ball.top, w: ball.width, h: ball.height }
    };
  });
  const tipPx = (b, v, h) => ({ x: b.x + ((50 + h * 19.5 + 6) / 112) * b.w, y: b.y + ((50 - v * 19.5 + 6) / 112) * b.h });
  async function dragTip(b, from, to, mode) {
    const a = tipPx(b, from[0], from[1]);
    const z = tipPx(b, to[0], to[1]);
    if (mode === 'touch') {
      await page.touchscreen.touchStart(a.x, a.y);
      for (let k = 1; k <= 10; k++) { await page.touchscreen.touchMove(a.x + ((z.x - a.x) * k) / 10, a.y + ((z.y - a.y) * k) / 10); await sleep(16); }
      await page.touchscreen.touchEnd();
    } else {
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      for (let k = 1; k <= 10; k++) { await page.mouse.move(a.x + ((z.x - a.x) * k) / 10, a.y + ((z.y - a.y) * k) / 10); await sleep(16); }
      await page.mouse.up();
    }
    await sleep(220);
  }
  for (const [w, h] of [[390, 844], [375, 667], [412, 915], [360, 800]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w === 412 ? 2.625 : w === 375 ? 2 : 3, isMobile: true, hasTouch: true });
    await openSim(potLayout, { aim: potAim, speed: 7, vTips: 0, hTips: 0 });
    const pts0 = (await pvInfo()).pts;
    await tap('.simTip[data-action="sim-tip"]');
    await page.waitForSelector('#tipPicker', { timeout: 3000 }).catch(() => {});
    let pi = await pickInfo();
    check(!!pi && pi.inView && pi.near && pi.ballW >= 0.26 * w && pi.ballW <= 0.4 * w && pi.textBelow, `${w}×${h}: tip picker opens as a compact pop-up by the cue ball (ball ${Math.round(pi?.ballW)} px ≈ ${Math.round((100 * (pi?.ballW || 0)) / w)}% of the width), text + buttons below`);
    check(pi && pi.hit >= 44 && pi.btn >= 44, `${w}×${h}: drag dot hit area ${Math.round(pi?.hit)} px, Center / Done ${Math.round(pi?.btn)} px (≥ 44)`);
    await dragTip(pi.ballBox, [0, 0], [1, 1], w === 390 ? 'mouse' : 'touch');
    pi = await pickInfo();
    const live = await pvInfo();
    const stTip = (await simSt()).shot;
    check(pi.v === 1 && pi.h === 1 && pi.label === 'Top Right' && pi.clock === "1:30 o'clock" && pi.off === '↑ 1 · → 1 tips', `${w}×${h}: dragging the dot (${w === 390 ? 'mouse' : 'touch'}) to top right updates the text live ("${pi.label}", "${pi.clock}", "${pi.off}")`);
    check(stTip.vTips === 1 && stTip.hTips === 1 && live.pts && live.pts !== pts0, `${w}×${h}: the shot and the full-path preview update live while the pop-up is open`);
    if (w === 390) await shot('v111-09-tip-picker-popup');
    await dragTip(pi.ballBox, [1, 1], [3, 3], w === 390 ? 'touch' : 'mouse');
    pi = await pickInfo();
    check(Math.hypot(pi.v, pi.h) <= 1.5 + 1e-9 && pi.v > 0 && pi.h > 0, `${w}×${h}: dragging past the edge stops at the miscue limit (${pi.v}, ${pi.h})`);
    await tap('#tipPicker [data-tip-center]');
    pi = await pickInfo();
    check(pi.v === 0 && pi.h === 0 && pi.clock === 'Center', `${w}×${h}: CENTER resets the tip`);
    await dragTip(pi.ballBox, [0, 0], [-1, 0], 'touch');
    await tap('#tipPicker [data-tip-done]');
    const afterDone = await page.evaluate(() => ({ open: !!document.querySelector('#tipPicker'), back: !!document.querySelector('.tipPopBackdrop'), clock: document.querySelector('.simTip [data-tip-clock]')?.textContent }));
    check(!afterDone.open && !afterDone.back && afterDone.clock === "6:00 o'clock" && (await simSt()).shot.vTips === -1, `${w}×${h}: DONE closes the pop-up and keeps the tip (${afterDone.clock})`);
    await tap('.simTip[data-action="sim-tip"]');
    await page.waitForSelector('#tipPicker', { timeout: 3000 }).catch(() => {});
    const outside = await page.evaluate(() => { const r = document.querySelector('#tipPicker').getBoundingClientRect(); return { x: 12, y: r.top > innerHeight / 2 ? 40 : innerHeight - 40 }; });
    await page.mouse.click(outside.x, outside.y);
    await sleep(200);
    const afterOut = await page.evaluate(() => !!document.querySelector('#tipPicker') || !!document.querySelector('.tipPopBackdrop'));
    const s2 = await simSt();
    check(!afterOut && s2.shot.vTips === -1 && s2.mode === 'edit', `${w}×${h}: tapping outside closes the pop-up without touching the table`);
  }
  await page.setViewport(V390);
  // drill builder uses the same pop-up (side spin limited to ±1 tip)
  await go('#drillnew');
  await sleep(400);
  await tap('[data-action="db-tip"]');
  await page.waitForSelector('#tipPicker', { timeout: 3000 }).catch(() => {});
  let pb = await pickInfo();
  check(!!pb && pb.inView, 'Create Drill: tapping the small cue ball opens the tip pop-up');
  if (pb) {
    await dragTip(pb.ballBox, [0, 0], [0, 2], 'touch');
    pb = await pickInfo();
    await tap('#tipPicker [data-tip-done]');
    const dbTxt = await page.evaluate(() => document.querySelector('.builderScreen .simTip [data-tip-clock], .simTip [data-tip-clock]')?.textContent);
    check(pb.h === 1 && pb.v === 0 && dbTxt === "3:00 o'clock" && !(await exists('#tipPicker')), `Create Drill: drag sets the tip (side spin capped at 1 tip → ${pb.h}), DONE applies it ("${dbTxt}")`);
  }
  await go('#home');
  // hidden during the Target Game (it would give the answer away)
  await go('#sim/target');
  await sleep(500);
  const tg = await simSt().catch(() => null);
  check(tg && tg.game && !(await exists('#simPreview .pv-path')), 'full-path preview is hidden in the Target Game');
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  await go('#home');

  // 4. Three-Lane Speed Exercise
  await go('#drills');
  const card = await page.evaluate(() => { const c = document.querySelector('.drill.card[data-drill="three-lane-speed"]'); return { txt: c?.innerText || '', chips: c ? [...c.querySelectorAll('.laneChips .speedChip')].map((e) => e.textContent) : [] }; });
  check(card.chips.join() === 'SPEED 1.50,SPEED 2.50,SPEED 3.00' && /Inspired by Ron the Pool Student's ICA cue-ball speed exercise\./.test(card.txt), `drill card: lane speeds ${card.chips.join(' / ')} + credit`);
  await go('#game/speed');
  check(await exists('[data-three-lane] [data-href="#play/drills/three-lane-speed"]'), 'Speed Ladder page links the Three-Lane Speed Exercise');
  await tap('[data-three-lane] [data-href="#play/drills/three-lane-speed"]');
  await sleep(300);
  const laneInfo = async () => page.evaluate(() => ({
    lane: document.querySelector('.laneTag')?.dataset.lane, laneTxt: document.querySelector('.laneTag')?.innerText || '',
    ex: document.querySelector('.speedExplain')?.dataset.speedExplain, mean: document.querySelector('.speedExplain .se-mean')?.textContent || '',
    starts: document.querySelectorAll('.playTable svg .lane-start').length + document.querySelectorAll('.playTable svg .cue-ball').length,
    labels: [...document.querySelectorAll('.playTable svg .lane-label')].map((t) => t.textContent),
    btns: [...document.querySelectorAll('.resultBar .rb')].map((b) => b.innerText.replace(/\s+/g, ' ')),
    noScroll: document.documentElement.scrollHeight <= innerHeight + 2, bar: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1,
    minTap: Math.min(...[...document.querySelectorAll('.resultBar .rb')].map((b) => b.getBoundingClientRect().height)),
    view: document.querySelector('#view').innerText
  }));
  let li = await laneInfo();
  check(li.lane === '1' && /Left lane · SPEED 1\.50/.test(li.laneTxt) && li.ex === '1.50' && li.mean.includes(M.m15.slice(0, 40)), `Three-Lane drill opens on lane 1 of 3: left lane SPEED 1.50 with its plain meaning`);
  check(li.starts >= 3 && li.labels.join() === '1.50,2.50,3.00', `table shows 3 lane start spots on the first diamond and target circles 1.50 / 2.50 / 3.00`);
  check(li.btns.length === 4 && /MISSED ZONE/.test(li.btns[0]) && /BULLSEYE/.test(li.btns[3]) && li.minTap >= 44, `manual scoring like the Speed Ladder (${li.btns.join(' | ')}), big buttons (${Math.round(li.minTap)} px)`);
  check(li.noScroll && li.bar, '390×844: Three-Lane screen fits without scrolling');
  check(/Inspired by Ron the Pool Student/.test(li.view) || (await page.evaluate(() => /Inspired by Ron the Pool Student/.test(document.body.innerHTML))), 'credit line reachable from the drill screen');
  await shot('v111-05-three-lane-exercise');
  for (let i = 0; i < 5; i++) await record(2);
  li = await laneInfo();
  check(li.lane === '2' && /Center lane · SPEED 2\.50/.test(li.laneTxt) && li.ex === '2.50' && li.mean.includes(M.m25.slice(0, 40)), 'after 5 attempts the drill moves to lane 2 (center, SPEED 2.50)');
  for (let i = 0; i < 5; i++) await record(2);
  li = await laneInfo();
  check(li.lane === '3' && /Right lane · SPEED 3\.00/.test(li.laneTxt) && li.ex === '3.00', 'then lane 3 (right, SPEED 3.00)');
  await shot('v111-06-three-lane-lane3');
  for (let i = 0; i < 5; i++) await record(i < 3 ? 2 : 1);
  await sleep(300);
  const tlDone = await page.evaluate(() => ({ panel: !!document.querySelector('.resultPanel'), txt: document.querySelector('.resultPanel')?.innerText || '' }));
  const stTL = await getState();
  const recTL = stTL.games?.drills?.stages?.['three-lane-speed'];
  check(tlDone.panel && /PASS/i.test(tlDone.txt) && recTL?.passed, `15 attempts → PASSED (8★ in lane 3 ≥ 7★)`);
  check((stTL.prog?.drillXp || 0) > 0 && (stTL.prog?.lifetimeXp || 0) > 0 && !!stTL.prog?.items?.['drill:three-lane-speed'], `earns Drill XP (${stTL.prog?.drillXp}) and Lifetime XP; mastery item recorded`);
  await shot('v111-07-three-lane-result');

  // 5. four phone sizes: no sideways scroll, nav label fits, Three-Lane + speed stage fit, 0 console errors
  for (const [w, h] of [[390, 844], [375, 667], [412, 915], [360, 800]]) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: w === 412 ? 2.625 : w === 375 ? 2 : 3, isMobile: true, hasTouch: true });
    const bad = [];
    for (const r of ['#home', '#arcade', '#tablegames', '#game/speed', '#drills', '#play/speed/sp-2', '#play/drills/three-lane-speed', '#play/landing/lz-1']) {
      await go(r);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (o > 1) bad.push(`${r}:${o}`);
    }
    await go('#home');
    const nav = await page.evaluate(() => [...document.querySelectorAll('nav button span')].every((sp) => { const r = sp.getBoundingClientRect(); const b = sp.parentElement.getBoundingClientRect(); return sp.scrollWidth <= sp.clientWidth + 1 && r.left >= b.left - 1 && r.right <= b.right + 1; }));
    await go('#play/drills/three-lane-speed');
    const fit = await page.evaluate(() => ({ noScroll: document.documentElement.scrollHeight <= innerHeight + 2, bar: (document.querySelector('.resultBar')?.getBoundingClientRect().bottom || 9e9) <= innerHeight + 1, diag: (document.querySelector('.speedExplain svg')?.getBoundingClientRect().width || 0) }));
    if (w !== 390) await shot(`v111-08-three-lane-${w}x${h}`);
    await openSim(potLayout, { aim: potAim, speed: 7, vTips: 0, hTips: 0 });
    const simOk = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth - innerWidth, pv: document.querySelectorAll('#simPreview .pv-rail').length, shoot: document.querySelector('.shootBtn')?.getBoundingClientRect().height || 0 }));
    check(!bad.length && nav, `${w}×${h}: v11.1 screens have no sideways scroll and every nav label fits ${bad.join(' ')}`);
    check(fit.noScroll && fit.bar && fit.diag >= 80, `${w}×${h}: Three-Lane screen (lane tag, meaning, mini diagram, score buttons) fits without scrolling`);
    check(simOk.sw <= 1 && simOk.pv >= 3 && simOk.shoot >= 44, `${w}×${h}: simulator SPEED 7 preview renders (${simOk.pv} rail labels), no sideways scroll`);
  }
  await page.setViewport(V390);
  await go('#home');
  check(errors.length === errBefore, `v11.1 checks: zero console errors (${errors.length - errBefore})`);
  if (errors.length > errBefore) console.log(errors.slice(errBefore).join('\n'));
}

// ------------------------------------------------------------------------------------------ v13 online accounts (Supabase mocked)
{
  const { runAccounts } = await import('./e2e-accounts.mjs');
  shot.dir = SHOTS;
  try { await runAccounts({ browser, page, BASE, check, sleep, shot, errors }); } catch (e) { check(false, `v13 accounts section crashed: ${e.message}`); console.log(e.stack); }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
}

// ------------------------------------------------------------------------------------------ v14 simulator tools
{
  const errBefore = errors.length;
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(() => { document.querySelectorAll('.sheetWrap').forEach((e) => e.classList.remove('show')); localStorage.removeItem('poolIQSimV1'); });
  await go('#sim');
  await sleep(250);
  await shot('v14-sim-clean');
  const gone = await page.evaluate(() => ({
    aim: !!document.querySelector('.simAim, [data-action="sim-nudge"], #simSpeedDiagram, .spMean'),
    setup: document.querySelectorAll('#simSetup .su-ball').length,
    scan: !!document.querySelector('[data-action="sim-scan"]'),
    cap: document.querySelector('#simScanFile')?.getAttribute('capture'),
    run: !!document.querySelector('[data-action="sim-runout"]'),
    view: !!document.querySelector('[data-action="sim-3d"]'),
    full: !!document.querySelector('[data-action="sim-full"]'),
    rand: !!document.querySelector('[data-action="sim-rand"]'),
    ico: document.querySelector('nav [data-page="arcade"] svg')?.innerHTML || ''
  }));
  check(!gone.aim && gone.setup === 0 && gone.scan && gone.cap === 'environment' && gone.run && !gone.view && gone.full && gone.rand, 'v14-5c: simulator has scan, runout, full screen and random shot, and no 3D view button');
  check(!/M7\.4 6\.6/.test(gone.ico) && /rect/.test(gone.ico), 'v14: Table Games nav icon is a table, not the controller');
  await tap('[data-action="sim-full"]');
  await sleep(150);
  const fs = await page.evaluate(() => {
    const hide = (el) => !el || getComputedStyle(el).display === 'none';
    return {
      on: document.body.classList.contains('sim-full'),
      exit: !!document.querySelector('.fullExit'),
      shoot: !!document.querySelector('.shootBtn'),
      size: !!document.querySelector('.tsBtn'),
      tip: !!document.querySelector('.simTip'),
      tray: !!document.querySelector('.simTray'),
      nav: hide(document.querySelector('nav')),
      head: hide(document.querySelector('header'))
    };
  });
  check(fs.on && fs.exit && !fs.shoot && !fs.size && !fs.tip && !fs.tray && fs.nav && fs.head, 'v14-1: full screen is the table and an EXIT button only');
  await shot('v14-fullscreen');
  await tap('[data-action="sim-full"]');
  await tap('[data-action="sim-runout"]');
  await sleep(200);
  const games = await page.evaluate(() => [...document.querySelectorAll('[data-action="sim-run-game"]')].map((b) => b.dataset.g).join(','));
  check(games === '8,9,10', 'v14: runout asks 8-ball, 9-ball, 10-ball');
  await shot('v14-runout');
  await page.evaluate(() => {
    const s = window.PoolIQ.screen.state;
    s.balls = [
      { id: 'cue', x: 28, y: 25 },
      { id: 1, x: 18, y: 10 }, { id: 2, x: 20.2, y: 11.2 },
      { id: 4, x: 62, y: 25 }, { id: 8, x: 78, y: 36 }, { id: 9, x: 40, y: 12 }
    ];
  });
  await tap('[data-action="sim-run-game"][data-g="8"]');
  await sleep(200);
  if (await page.$('[data-action="sim-run-group"][data-g="solids"]')) await tap('[data-action="sim-run-group"][data-g="solids"]');
  await page.waitForSelector('[data-run-step]', { timeout: 8000 });
  const planTxt = await page.evaluate(() => ({
    step: document.querySelector('.runStep')?.textContent || '',
    note: document.querySelector('[data-runout-note]')?.textContent || ''
  }));
  check(planTxt.step.length > 0 && !/^1-ball/.test(planTxt.step) && !/1-ball/.test(planTxt.note), `v14-1: 8-ball plan is not "pocket the 1" (${planTxt.step} / ${planTxt.note})`);
  await shot('v14-runout-plan');
  await tap('[data-action="sim-run-close"]');
  await tap('[data-action="sim-rand"]');
  await sleep(200);
  const types = await page.evaluate(() => [...document.querySelectorAll('[data-action="sim-rand-type"]')].map((b) => b.dataset.v).join(','));
  check(types === 'straight,bank1,bank2,kick1,kick2,kick3,kick4', `v14: random shot types match the physics (${types})`);
  await shot('v14-random');
  await page.evaluate(() => document.querySelector('.sheetWrap')?.classList.remove('show'));
  check(errors.length === errBefore, `v14 screens: zero console errors (${errors.length - errBefore})`);
  if (errors.length > errBefore) console.log(errors.slice(errBefore).join('\\n'));
}

// ------------------------------------------------------------------------------------------ service worker + offline
const swOk = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
  return !!reg && !!reg.active;
});
check(swOk, 'service worker registered and active');
const cacheName = await page.evaluate(async () => (await caches.keys()).join(','));
check(/pool-iq-v14-8/.test(cacheName) && !/pool-iq-v10|pool-iq-v11|pool-iq-v12|pool-iq-v13|pool-iq-v14-5b|pool-iq-v14-5c/.test(cacheName), `cache bumped to pool-iq-v14-8 (${cacheName})`);
check(await page.evaluate(async () => !!(await caches.match('./js/vendor/supabase.js'))), 'v13: the supabase-js file is precached for offline use');
await page.setOfflineMode(true);
await page.goto(BASE + 'index.html#arcade', { waitUntil: 'domcontentloaded' });
await sleep(800);
check((await page.$$('.gameCard')).length === 14, 'offline reload still renders Table Games');
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
