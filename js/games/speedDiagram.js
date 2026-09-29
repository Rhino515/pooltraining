/**
 * Mini-table diagram for a SPEED number (v11.1): where a straight centre-ball lag from the standard start
 * spot (first diamond at your end) travels and stops. Each leg of the back-and-forth route is drawn on its
 * own line so the path reads at a glance: START ball → numbered cushion turns → STOP ring.
 * Pure string SVG, no DOM — used by the Shot Recipe, the simulator speed readout and the speed drills.
 */
import { speedPath, formatSpeed, speedMeaning, START_DIAMOND, ORD } from './speed.js';

const f = (v) => Math.round(v * 100) / 100;
const R = 1.125;
const X = (d) => Math.max(R, Math.min(100 - R, d * 12.5));

/** Geometry of the drawn route: legs with y levels, turn points and the stop spot (exported for tests) */
export function speedDiagramGeometry(s, start = START_DIAMOND) {
  const p = speedPath(s, start);
  const legs = p.rails + 1;
  const top = 11;
  const bottom = 39;
  const yOf = (k) => (legs === 1 ? 25 : top + (k * (bottom - top)) / (legs - 1));
  const pts = [];
  const turns = [];
  let x = X(start);
  pts.push({ x, y: yOf(0) });
  for (let k = 0; k < p.rails; k++) {
    const rx = k % 2 === 0 ? 100 - R : R; // even turns at the far rail, odd at your end rail
    pts.push({ x: rx, y: yOf(k) });
    pts.push({ x: rx, y: yOf(k + 1) });
    turns.push({ n: k + 1, x: rx, y: (yOf(k) + yOf(k + 1)) / 2, far: k % 2 === 0 });
    x = rx;
  }
  const end = { x: X(p.diamond), y: yOf(legs - 1) };
  pts.push(end);
  return { path: p, legs, pts, turns, end, start: { x: X(start), y: yOf(0) } };
}

/**
 * @param {number} s SPEED
 * @param {{caption?:boolean, className?:string}} opt caption adds the one-sentence meaning under the table
 */
export function speedDiagramSVG(s, opt = {}) {
  const g = speedDiagramGeometry(s);
  const label = formatSpeed(s);
  const meaning = speedMeaning(s);
  let svg = `<svg class="${opt.className || 'speed-mini'}" data-speed-diagram="${label}" data-rails="${g.path.rails}" data-stop-diamond="${g.path.diamond}" viewBox="-5 -9 110 69" role="img" aria-label="SPEED ${label}: ${meaning.replace(/"/g, '')}">`;
  // table: wood, felt, pockets, diamonds, side-pocket line
  // v12 look: wood rails with a light bevel, teal cloth-covered cushion, teal cloth, white diamond sights
  svg += `<rect class="sm-wood" x="-4.5" y="-4.5" width="109" height="59" rx="3" fill="#57301a" stroke="#1a0c05" stroke-width="0.6"/>`;
  svg += `<rect x="-3.9" y="-3.9" width="107.8" height="57.8" rx="2.6" fill="none" stroke="#c98a57" stroke-opacity="0.3" stroke-width="0.3"/>`;
  svg += `<rect x="-1.3" y="-1.3" width="102.6" height="52.6" rx="0.6" fill="#045466" stroke="#1a0c05" stroke-width="0.5"/>`;
  svg += `<rect class="sm-felt" x="0" y="0" width="100" height="50" fill="#066b83" stroke="#02303b" stroke-width="0.4"/>`;
  for (const [px, py] of [[0, 0], [50, -0.6], [100, 0], [0, 50], [50, 50.6], [100, 50]]) svg += `<circle cx="${px}" cy="${py}" r="2.4" fill="#000" stroke="#2c1a0e" stroke-width="0.4"/>`;
  for (let d = 1; d < 8; d++) {
    if (d === 4) continue;
    for (const y of [-2.9, 52.9]) svg += `<path class="sm-diamond" d="M${d * 12.5} ${y - 0.95} L${d * 12.5 + 0.6} ${y} L${d * 12.5} ${y + 0.95} L${d * 12.5 - 0.6} ${y} Z" fill="#f4f6fb"/>`;
  }
  svg += `<line x1="50" y1="0" x2="50" y2="50" stroke="#e8fbff" stroke-width="0.35" stroke-dasharray="1.2 1.2" opacity="0.45"/>`;
  svg += `<line x1="${X(g.path.start)}" y1="0" x2="${X(g.path.start)}" y2="50" stroke="#ffd34d" stroke-width="0.3" stroke-dasharray="0.8 1" opacity="0.5"/>`;
  // route
  const d = g.pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join(' ');
  svg += `<path class="sm-route" d="${d}" fill="none" stroke="#f4fbff" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"/>`;
  // arrowhead on the last leg
  const a = g.pts[g.pts.length - 2];
  const b = g.end;
  const dir = Math.sign(b.x - a.x) || 1;
  if (Math.abs(b.x - a.x) > 3) svg += `<polygon points="${f(b.x - dir * 0.2)},${f(b.y)} ${f(b.x - dir * 3)},${f(b.y - 1.8)} ${f(b.x - dir * 3)},${f(b.y + 1.8)}" fill="#f4fbff"/>`;
  // numbered cushion turns
  for (const t of g.turns) {
    const cx = t.far ? 100 - 3.4 : 3.4;
    svg += `<g class="sm-turn" data-turn="${t.n}"><circle cx="${f(cx)}" cy="${f(t.y)}" r="2.3" fill="#19b8ff" stroke="#062a32" stroke-width="0.4"/><text x="${f(cx)}" y="${f(t.y + 1.25)}" text-anchor="middle" font-size="3.4" font-weight="900" fill="#fff" font-family="Poppins,system-ui,sans-serif">${t.n}</text></g>`;
  }
  // start ball + stop ring
  svg += `<circle class="sm-start" cx="${f(g.start.x)}" cy="${f(g.start.y)}" r="2" fill="#f7fbff" stroke="#062a32" stroke-width="0.4"/>`;
  svg += `<g class="sm-stop"><circle cx="${f(b.x)}" cy="${f(b.y)}" r="4.2" fill="rgba(255,199,91,.28)" stroke="#ffc75b" stroke-width="0.8"/><circle cx="${f(b.x)}" cy="${f(b.y)}" r="1.2" fill="#ffc75b"/></g>`;
  // diamond numbers counted from YOUR end rail (the same count the speed meaning uses)
  for (let n = 1; n < 8; n++) {
    const hit = Math.abs(g.path.diamond - n) < 0.15;
    svg += `<text class="sm-dnum${hit ? ' sm-dnum-stop' : ''}" x="${n * 12.5}" y="48.6" text-anchor="middle" font-size="${hit ? 3.4 : 2.8}" font-weight="${hit ? 900 : 700}" fill="${hit ? '#ffc75b' : '#d6eef5'}" opacity="${hit ? 1 : 0.7}" font-family="Poppins,system-ui,sans-serif">${n}</text>`;
  }
  // labels above / below the table
  const dn = Math.round(g.path.diamond);
  const stopTxt = Math.abs(g.path.diamond - dn) < 0.15 && dn >= 1 && dn <= 7 ? `STOP · ${ORD[dn]} diamond` : 'STOP';
  const stopLx = Math.max(22, Math.min(78, b.x));
  svg += `<text class="sm-stop-label" x="${f(stopLx)}" y="58.6" text-anchor="middle" font-size="3.9" font-weight="900" fill="#ffc75b" font-family="Poppins,system-ui,sans-serif">${stopTxt}</text>`;
  svg += `<text x="${f(Math.max(7, g.start.x))}" y="-5.6" text-anchor="middle" font-size="3.6" font-weight="800" fill="#f4fbff" font-family="Poppins,system-ui,sans-serif">START</text>`;
  svg += `<text x="50" y="-5.6" text-anchor="middle" font-size="3.2" font-weight="700" fill="#9fc3d3" font-family="Poppins,system-ui,sans-serif">side pockets</text>`;
  svg += `<text x="99" y="-5.6" text-anchor="end" font-size="3.2" font-weight="700" fill="#9fc3d3" font-family="Poppins,system-ui,sans-serif">far rail</text>`;
  svg += `<text x="1" y="58.6" text-anchor="start" font-size="3.2" font-weight="700" fill="#9fc3d3" font-family="Poppins,system-ui,sans-serif">${stopLx - stopTxt.length * 1.1 < 10 ? '' : 'you'}</text>`;
  svg += `</svg>`;
  if (!opt.caption) return svg;
  return `<figure class="speedExplain" data-speed-explain="${label}">${svg}<figcaption><b>SPEED ${label}</b> ${meaning}.</figcaption></figure>`;
}

/** Explainer block: sentence + diagram + the scale definition (used in recipe sheet, sim help and speed drills) */
export function speedExplainHTML(s, { note = true, compact = false } = {}) {
  const label = formatSpeed(s);
  return `<div class="speedExplain${compact ? ' compact' : ''}" data-speed-explain="${label}">
    <div class="se-text"><span class="speedChip" data-speed="${label}">SPEED ${label}</span><b class="se-mean">${speedMeaning(s)}.</b></div>
    ${speedDiagramSVG(s)}
    ${note ? '<small class="muted se-note">SPEED n = n table lengths of total travel from where the cue ball starts (shown from the first diamond at your end). Diamonds are counted from your end rail. Real cushions soak up a little pace, so most balls finish slightly shorter.</small>' : ''}
  </div>`;
}
