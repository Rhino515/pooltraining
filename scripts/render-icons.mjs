/**
 * Rasterise the v12 icon masters (icons/src/*.svg, made by scripts/make-icons.py) to the PNG sizes the
 * manifest / index.html use, with headless Chrome. puppeteer-core is looked up like scripts/e2e.mjs does.
 *   node scripts/render-icons.mjs
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
let puppeteer;
for (const d of [process.env.PUPPETEER_DIR, path.join(root, 'node_modules'), path.join(root, '..', 'tooling', 'node_modules'), '/workspace/tooling/node_modules'].filter(Boolean)) {
  try { puppeteer = createRequire(path.join(d, 'x.js'))('puppeteer-core'); break; } catch {}
}
if (!puppeteer) throw new Error('puppeteer-core not found (set PUPPETEER_DIR)');
const CHROME = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && fs.existsSync(p));
const out = path.join(root, 'icons');
const jobs = [['any', 192, 'icon-192.png'], ['any', 512, 'icon-512.png'], ['maskable', 192, 'maskable-192.png'], ['maskable', 512, 'maskable-512.png'], ['apple', 180, 'apple-touch-icon.png'], ['favicon', 32, 'favicon-32.png']];
const b = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'], headless: 'new' });
try {
  const p = await b.newPage();
  for (const [k, s, name] of jobs) {
    await p.setViewport({ width: s, height: s, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(path.join(root, 'icons', 'src', `${k}.svg`), 'utf8');
    await p.setContent(`<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${s}" height="${s}" style="display:block"></body></html>`);
    await p.waitForFunction(() => document.images[0].complete);
    await p.screenshot({ path: `${out}/${name}`, omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
} finally { await b.close(); }
console.log('rendered');
