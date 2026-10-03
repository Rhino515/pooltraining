/**
 * Plus/minus for the numbered how-to on table-game screens (v14-62).
 * The last open/closed choice is stored on the existing poolIQRuleSet object.
 * That is not a new storage key, and it is not career state or XP.
 */
import { lsSet } from '../storage.js';

export const RULE_KEY = 'poolIQRuleSet';
const RULE_SETS = ['wpa', 'bca', 'apa', 'bar'];

export function readRulePrefs() {
  const base = { 8: 'wpa', 9: 'wpa', 10: 'wpa', open: false };
  try {
    const raw = JSON.parse(localStorage.getItem(RULE_KEY) || '');
    if (!raw || typeof raw !== 'object') return base;
    for (const id of ['8', '9', '10']) {
      if (RULE_SETS.includes(raw[id])) base[id] = raw[id];
    }
    base.open = raw.open === true;
  } catch { /* stay collapsed */ }
  return base;
}

export function writeRulePrefs(prefs) {
  const cur = readRulePrefs();
  const next = {
    8: RULE_SETS.includes(prefs[8]) ? prefs[8] : cur[8],
    9: RULE_SETS.includes(prefs[9]) ? prefs[9] : cur[9],
    10: RULE_SETS.includes(prefs[10]) ? prefs[10] : cur[10],
    open: prefs.open === true
  };
  lsSet(RULE_KEY, JSON.stringify(next));
  return next;
}

export function stepsAreOpen() {
  return readRulePrefs().open === true;
}

export function toggleStepsOpen() {
  const cur = readRulePrefs();
  cur.open = !cur.open;
  writeRulePrefs(cur);
  return cur.open;
}

export function stepToggleBtn(action, open) {
  const act = String(action || '').replace(/[^a-z0-9-]/g, '');
  const sign = open ? '−' : '+';
  const label = open ? 'Hide the numbered steps' : 'Show the numbered steps';
  return `<button type="button" class="stepToggle" data-action="${act}" aria-expanded="${open ? 'true' : 'false'}" aria-label="${label}">${sign}</button>`;
}
