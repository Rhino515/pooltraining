/**
 * Shot Recipe components shared by drills, games and bosses:
 * full recipe card, compact recipe strip, WHY THIS SHOT? sheet content, SPEED chip.
 */
import { cueBallSVG } from './cueBallDiagram.js';
import { contactText, englishText, techniqueName } from './text.js';
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

const WHY_TITLES = { whyContact: 'Why this cue-ball contact', whySpeed: 'Why this speed', whySpin: 'Why this spin', whyRoute: 'Why this route', whyAim: 'Why this aim' };

export function whyHTML(ch) {
  const w = ch.whyExplanation || {};
  const keys = Object.keys(WHY_TITLES).filter((k) => w[k]);
  if (!keys.length) return '<p class="muted">No explanation for this layout.</p>';
  return `<div class="whyList" data-why="${esc(ch.id)}">${keys.map((k) => `<div class="whyItem" data-key="${k}"><h4>${WHY_TITLES[k]}</h4><p>${esc(w[k])}</p></div>`).join('')}</div>`;
}
