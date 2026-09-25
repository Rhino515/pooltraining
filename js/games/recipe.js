/**
 * Shot Recipe components shared by drills, games and bosses:
 * full recipe card, compact recipe strip, WHY THIS SHOT? sheet content, SPEED chip.
 */
import { cueBallSVG, dotPosition, TIP_UNIT } from './cueBallDiagram.js';
import { contactText, englishText, techniqueName, fracTips } from './text.js';
import { aimViewInfo, aimViewSVG, shadeDefs } from './aimView.js';
import { setupBalls, ballName, shortPos, wordsPos, CONVENTION_TEXT } from './diamonds.js';
import { speedLabel, speedMeaning, formatSpeed, calibrationAdvice } from './speed.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function speedChip(speed, cal) {
  const adv = cal ? calibrationAdvice(cal, speed) : null;
  return `<span class="speedChip" data-speed="${formatSpeed(speed)}" title="${esc(speedMeaning(speed))}">${speedLabel(speed)}</span>${adv ? `<small class="calAdvice">${esc(adv)}</small>` : ''}`;
}

export function recipeFields(ch) {
  const cc = ch.cueContact || { vTips: 0, hTips: 0 };
  return {
    technique: techniqueName(ch.technique),
    contact: contactText(cc.vTips, 0),
    english: englishText(ch.english?.hTips || 0, ch.english?.type && ch.english.type !== 'none' ? ch.english.type : null),
    speed: speedLabel(ch.speed),
    speedMeaning: speedMeaning(ch.speed),
    obContact: ch.aim?.label || '—',
    route: ch.route?.text || '—',
    goal: ch.goal || ''
  };
}

/** Full Shot Recipe card */
export function recipeCardHTML(ch, { cal = null, hideAim = false, hideRoute = false } = {}) {
  const r = recipeFields(ch);
  const row = (k, v, cls = '') => `<div class="rc-row ${cls}"><span>${k}</span><b>${v}</b></div>`;
  return `<div class="recipeCard" data-recipe="${esc(ch.id)}">
    <div class="rc-ball">${cueBallSVG(ch.cueContact, { size: 'lg' })}</div>
    <div class="rc-rows">
      <div class="eyebrow">SHOT RECIPE · ${esc(r.technique.toUpperCase())}</div>
      ${row('Cue-ball contact', esc(r.contact))}
      ${row('English', esc(r.english))}
      ${row('Speed', `${speedChip(ch.speed, cal)}<small class="rc-mean">${esc(r.speedMeaning)}</small>`)}
      ${hideAim ? '' : row('Object-ball contact', esc(r.obContact))}
      ${hideAim ? '' : aimRowHTML(ch)}
      ${hideRoute ? '' : row('Route', esc(r.route))}
      ${row('Goal', esc(r.goal), 'rc-goal')}
    </div>
  </div>`;
}

/** Compact strip: mini ball + SPEED chip + OB contact + route chip (tap to expand) */
export function recipeStripHTML(ch, { hideAim = false, hideRoute = false, hidden = false } = {}) {
  if (hidden) {
    return `<button type="button" class="recipeStrip hiddenRecipe" data-action="noop"><span class="rs-q">?</span><span>Recipe hidden — plan your shot below</span></button>`;
  }
  return `<button type="button" class="recipeStrip" data-action="recipe-open" aria-label="Open full shot recipe">
    <span class="rs-ball">${cueBallSVG(ch.cueContact, { size: 'xs' })}</span>
    <span class="rs-chips">
      <span class="speedChip" data-speed="${formatSpeed(ch.speed)}">${speedLabel(ch.speed)}</span>
      ${hideAim || !ch.aim?.short ? '' : `<span class="rs-chip">${esc(ch.aim.short)}</span>`}
      ${hideRoute ? '' : `<span class="rs-chip">${esc(ch.route?.short || '')}</span>`}
      ${ch.english?.hTips ? `<span class="rs-chip eng">${esc(englishText(ch.english.hTips))}</span>` : ''}
    </span>
    <span class="rs-more">▾</span>
  </button>`;
}

// ------------------------------------------------------------------ gauge panel (Aim View · Tip · Speed)
const r2 = (v) => Math.round(v * 100) / 100;
let gUid = 0;

/** Short tip label: "Center", "Top ½ tip", "Draw 1½ tips", "Low Left", "Right ½ tip" */
export function tipLabel(vTips = 0, hTips = 0) {
  const v = Number(vTips) || 0;
  const h = Number(hTips) || 0;
  const tw = (x) => `${fracTips(x)} tip${Math.abs(x) > 1 ? 's' : ''}`;
  if (!v && !h) return 'Center';
  if (!h) return `${v > 0 ? 'Top' : 'Draw'} ${tw(v)}`;
  const side = h > 0 ? 'Right' : 'Left';
  if (!v) return `${side} ${tw(h)}`;
  return `${v > 0 ? 'Top' : 'Low'} ${side}`;
}

/** 3D cue ball with a cyan contact dot (dot uses the same tip scale as the detailed diagram) */
export function tipGaugeSVG(contact) {
  const uid = `tg${++gUid}`;
  const v = Number(contact?.vTips) || 0;
  const h = Number(contact?.hTips) || 0;
  const p = dotPosition(v, h);
  let s = `<svg class="cb-diagram tip-gauge" viewBox="0 0 100 100" role="img" aria-label="Cue-ball tip: ${esc(contactText(v, h))}">`;
  s += `<defs><radialGradient id="cw${uid}" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e8eff4"/><stop offset=".85" stop-color="#b6c5cf"/><stop offset="1" stop-color="#8397a5"/></radialGradient>${shadeDefs(uid)}</defs>`;
  s += `<circle cx="50" cy="50" r="48.5" fill="#07131e" stroke="#1f5a74" stroke-width="1.5"/>`;
  s += `<circle cx="50" cy="50" r="44" fill="url(#cw${uid})"/>`;
  s += `<circle class="cb-ring" cx="50" cy="50" r="${TIP_UNIT}" fill="none" stroke="#8aa0ae" stroke-width="0.7" stroke-dasharray="2 2" opacity="0.7"/>`;
  s += `<ellipse cx="34" cy="30" rx="11" ry="6.5" fill="#fff" opacity="0.65" transform="rotate(-30 34 30)"/>`;
  s += `<circle class="cb-dot" data-vtips="${v}" data-htips="${h}" cx="${r2(p.x)}" cy="${r2(p.y)}" r="8.5" fill="#19c8ff" stroke="#05111b" stroke-width="2.2"/>`;
  s += `<circle cx="${r2(p.x - 2.4)}" cy="${r2(p.y - 2.6)}" r="2.2" fill="#dff8ff" opacity="0.8"/>`;
  return s + `</svg>`;
}

export const SPEED_MIN = 0.5;
export const SPEED_MAX = 5;
/** Needle angle in degrees (0 = straight up, −135 … +135) for a SPEED value */
export function speedAngle(speed) {
  const v = Math.max(SPEED_MIN, Math.min(SPEED_MAX, Number(speed) || SPEED_MIN));
  return -135 + ((v - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 270;
}
const polar = (deg, rad) => ({ x: 50 + rad * Math.sin((deg * Math.PI) / 180), y: 50 - rad * Math.cos((deg * Math.PI) / 180) });
function arcPath(a0, a1, rad) {
  const p0 = polar(a0, rad);
  const p1 = polar(a1, rad);
  return `M${r2(p0.x)} ${r2(p0.y)} A${rad} ${rad} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${r2(p1.x)} ${r2(p1.y)}`;
}

/** Round speed dial: coloured arc over Pool IQ's numeric SPEED scale (0.5–5.0) and a needle */
export function speedDialSVG(speed) {
  const a = speedAngle(speed);
  const tip = polar(a, 33);
  let s = `<svg class="speed-dial" viewBox="0 0 100 100" role="img" aria-label="${esc(speedLabel(speed))}" data-angle="${r2(a)}">`;
  s += `<defs><radialGradient id="sdf${++gUid}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#eef6fa"/><stop offset=".8" stop-color="#c9d7df"/><stop offset="1" stop-color="#8ea3b1"/></radialGradient></defs>`;
  s += `<circle cx="50" cy="50" r="48.5" fill="#07131e" stroke="#1f5a74" stroke-width="1.5"/>`;
  s += `<circle cx="50" cy="50" r="44" fill="url(#sdf${gUid})"/>`;
  s += `<path d="${arcPath(-135, -15, 36)}" stroke="#19b8ff" stroke-width="6" fill="none" stroke-linecap="round"/>`; // SPEED 0.5–2.5
  s += `<path d="${arcPath(-15, 75, 36)}" stroke="#ffc75b" stroke-width="6" fill="none"/>`; // 2.5–4
  s += `<path d="${arcPath(75, 135, 36)}" stroke="#ff5f7e" stroke-width="6" fill="none" stroke-linecap="round"/>`; // 4–5
  for (let v = 1; v <= 5; v++) {
    const o = polar(speedAngle(v), 30);
    const i = polar(speedAngle(v), 25.5);
    s += `<line x1="${r2(i.x)}" y1="${r2(i.y)}" x2="${r2(o.x)}" y2="${r2(o.y)}" stroke="#35505f" stroke-width="1.6"/>`;
  }
  s += `<text x="50" y="80" text-anchor="middle" font-size="15" font-weight="900" fill="#0b2635" font-family="system-ui,sans-serif">${esc(formatSpeed(speed))}</text>`;
  s += `<line class="sd-needle" x1="50" y1="50" x2="${r2(tip.x)}" y2="${r2(tip.y)}" stroke="#0b1723" stroke-width="3.2" stroke-linecap="round"/>`;
  s += `<circle cx="50" cy="50" r="5" fill="#0b1723"/><circle cx="50" cy="50" r="2" fill="#55e5ff"/>`;
  return s + `</svg>`;
}

const titleCase = (t) => String(t || '').toLowerCase().replace(/^./, (c) => c.toUpperCase());

/**
 * Shot Recipe gauge card: Aim View · Cue-ball tip · Speed dial.
 * hideAim → the aim gauge shows a "?" (coaching hides it); no verifiable aim (lag, no OB) → the aim gauge is omitted.
 */
export function recipeGaugesHTML(ch, { hideAim = false, hideRoute = false } = {}) {
  const cc = ch.cueContact || { vTips: 0, hTips: 0 };
  const info = aimViewInfo(ch);
  const cells = [];
  if (info && hideAim) {
    cells.push(`<button type="button" class="gauge gauge-aim hiddenAim" data-action="noop" data-aim="hidden">${aimViewSVG(null, { hidden: true })}<b>Your aim</b><small>plan it</small></button>`);
  } else if (info) {
    cells.push(`<button type="button" class="gauge gauge-aim" data-action="why-open" data-aim="${esc(info.label)}" data-cut="${info.deg}" data-side="${info.side}" aria-label="${esc(info.plain)}">${aimViewSVG(info)}<b>${esc(info.label)}</b><small>${info.deg}° cut</small></button>`);
  }
  cells.push(`<button type="button" class="gauge gauge-tip" data-action="recipe-open" aria-label="Cue-ball tip ${esc(contactText(cc.vTips, cc.hTips))}">${tipGaugeSVG(cc)}<b>${esc(tipLabel(cc.vTips, cc.hTips))}</b><small>${esc(techniqueName(ch.technique))}</small></button>`);
  cells.push(`<button type="button" class="gauge gauge-speed" data-action="recipe-open" data-speed="${formatSpeed(ch.speed)}" aria-label="${esc(speedLabel(ch.speed))}">${speedDialSVG(ch.speed)}<b>Speed ${formatSpeed(ch.speed)}</b><small>${hideRoute ? '&nbsp;' : esc(titleCase(ch.route?.short || ''))}</small></button>`);
  return `<div class="gaugeCard n${cells.length}" data-gauges="${cells.length}">${cells.join('')}</div>`;
}

/** Aim View row for the full recipe card / Why sheet */
export function aimRowHTML(ch) {
  const info = aimViewInfo(ch);
  if (!info) return '';
  return `<div class="aimRow" data-cut="${info.deg}" data-side="${info.side}">${aimViewSVG(info, { size: 'lg' })}<div><span>AIM VIEW · looking down the cue</span><b>${esc(info.label)} · ${info.deg}° cut</b><small>${esc(info.plain)}. The dashed ball is where your cue ball must be at contact; cover ${Math.round(info.fullness * 100)}% of the ${info.ob.n}.${info.afterRail ? ' Measured on the last leg after the rail.' : ''}</small></div></div>`;
}

// ------------------------------------------------------------------ setup readout (diamond positions)
/** Compact one-line setup strip for the play screen */
export function setupLineHTML(ch) {
  const balls = setupBalls(ch);
  if (!balls.length) return '';
  const items = balls.map((b) => `<span class="su-ball" data-ball="${esc(b.id)}" data-head="${b.fromHead}" data-top="${b.fromTop}"><i class="su-dot${b.id === 'cue' ? ' cue' : ''}" style="--c:${b.id === 'cue' ? '#f5f7fa' : ballColor(b.id)}">${b.id === 'cue' ? '' : esc(b.id)}</i>${esc(shortPos(b))}</span>`).join('');
  return `<button type="button" class="setupLine" data-action="setup-open" aria-label="Ball setup in diamonds"><span class="su-label"><b>SETUP</b><small>head · top ⓘ</small></span><span class="su-items">${items}</span></button>`;
}

/** Setup sheet body: convention in plain words + every ball */
export function setupSheetHTML(ch) {
  const balls = setupBalls(ch);
  return `<div class="setupSheet"><p class="su-conv">${esc(CONVENTION_TEXT)}</p><div class="su-list">${balls.map((b) => `<div class="su-row" data-ball="${esc(b.id)}"><b>${esc(ballName(b.id))}${b.blocker ? ' (blocker)' : ''}</b><span class="su-num">${esc(shortPos(b))}</span><small>${esc(wordsPos(b))}</small></div>`).join('')}</div></div>`;
}

import { BALL_COLORS } from '../tableDiagram.js';
const ballColor = (n) => BALL_COLORS[Number(n)] || '#94a3b8';

const WHY_TITLES = { whyContact: 'Why this cue-ball contact', whySpeed: 'Why this speed', whySpin: 'Why this spin', whyRoute: 'Why this route', whyAim: 'Why this aim' };

export function whyHTML(ch) {
  const w = ch.whyExplanation || {};
  const keys = Object.keys(WHY_TITLES).filter((k) => w[k]);
  if (!keys.length) return '<p class="muted">No explanation for this layout.</p>';
  return `<div class="whyList" data-why="${esc(ch.id)}">${keys.map((k) => `<div class="whyItem" data-key="${k}"><h4>${WHY_TITLES[k]}</h4><p>${esc(w[k])}</p></div>`).join('')}</div>`;
}
