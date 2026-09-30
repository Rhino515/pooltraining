/**
 * Built-in PKF drills — the .pooliq documents in pkfLibrary.js, turned into challenge
 * objects with the same converter My Content uses. Text, ids, categories and attribution
 * stay as written in the files.
 */
import { PKF_DOCS } from './pkfLibrary.js';
import { validatePooliq } from './schema.js';
import { shotToChallenge } from './convert.js';

/** Challenge for one validated PKF .pooliq document. Used for the shipped library and for a local override of the same id. */
export function challengeFromPkfDoc(d) {
  const ch = shotToChallenge(d.shot, {
    id: d.id,
    title: d.title,
    category: d.category,
    difficulty: d.difficulty,
    skill: d.skill,
    scoringRules: d.scoringRules,
    xp: d.xp,
    skillEffects: d.skillEffects
  });
  ch.builtin = true;
  ch.imported = false;
  ch.isDrill = true;
  ch.description = d.description || '';
  ch.contentVersion = d.contentVersion;
  ch.careerEligible = d.careerEligible === true;
  if (d.attribution) ch.attribution = d.attribution;
  if (d.metadata) ch.metadata = d.metadata;
  const a = d.attribution || {};
  const credit = [a.sourceName, a.author].filter(Boolean).join(' — ');
  if (credit) ch.credit = credit;
  ch.pq = d.careerEligible === true ? { rankXpEligible: true } : {};
  ch.prerequisites = d.prerequisites || [];
  return ch;
}

export function pkfDrillChallenges() {
  const failed = [];
  const out = [];
  for (const raw of PKF_DOCS) {
    const id = raw && raw.id;
    let text;
    try { text = JSON.stringify(raw); }
    catch (e) { failed.push(`${id || '?'}: ${e.message || e}`); continue; }
    const r = validatePooliq(text);
    if (!r.ok) { failed.push(`${id || '?'}: ${r.errors.join(' | ')}`); continue; }
    out.push(challengeFromPkfDoc(r.doc));
  }
  if (failed.length) {
    throw new Error(`PKF drill file failed to parse (${failed.length}):\n${failed.join('\n')}`);
  }
  return out;
}
