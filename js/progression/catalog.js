/**
 * Progression catalog — maps every piece of trainable content to { tier, skill weights, mastery rule, XP metadata }.
 * Built-in Table Games stages/bosses/Ghost use the central rules in config.js (GAME_SKILLS, STRAIGHT_RULE, overrides,
 * TIER_BY_DIFFICULTY). Drills, Create Drill drills and .pooliq content expose their own metadata (difficulty, skills,
 * primarySkill, secondarySkills, skillWeights, baseXP, mastery, rankXpEligible) — the ranking engine never hard-codes content.
 *
 * Item keys (stable, stored in progression records):
 *   arcade:<game>:<stage> · boss:<bossId> · bshot:<bossId>:<i> · ghost:<balls> · ghost8:<level> · drill:<drillId> · content:<uid>[:<stageId>]
 */
import { GAMES, getGame, BOSSES, stageSpecs } from '../games/registry.js';
import { GAME_SKILLS, STRAIGHT_RULE, STAGE_SKILL_OVERRIDES, MASTERY, TECHNIQUE_SKILL, LEGACY_SKILL_MAP, XP, SKILL_IDS, tierOfDifficulty, toSkillId, TIERS } from './config.js';

/** technique word for a raw builder spec (stage / boss shot) */
export function specTechnique(spec = {}) {
  if (spec.technique) return spec.technique;
  const k = spec.k;
  if (k == null || spec.kind === 'lag' || spec.kind === 'kick' || spec.kind === 'bank') return null;
  if (k <= -0.3) return 'draw';
  if (k >= 0.3) return 'follow';
  return spec.travel === 0 ? 'stop' : 'stun';
}

/** Normalize a weights object: known skills only, top weight = 1, tiny weights dropped */
export function normalizeWeights(w) {
  const out = {};
  const max = Math.max(0, ...Object.values(w).map((v) => Number(v) || 0));
  if (!max) return out;
  for (const [k, v] of Object.entries(w)) {
    const n = (Number(v) || 0) / max;
    if (SKILL_IDS.includes(k) && n >= 0.05) out[k] = Math.round(n * 100) / 100;
  }
  return out;
}

function applyTemplate(tpl, technique) {
  const w = {};
  for (const [k, v] of Object.entries(tpl || {})) {
    if (k === '_tech') {
      const s = TECHNIQUE_SKILL[technique];
      if (s) w[s] = Math.max(w[s] || 0, v);
      if (technique === 'stun-draw') w.draw = Math.max(w.draw || 0, v * 0.5);
    } else w[k] = Math.max(w[k] || 0, v);
  }
  return w;
}
function addStraight(w, kind, cutDeg) {
  if (cutDeg != null && cutDeg <= STRAIGHT_RULE.maxCutDeg && STRAIGHT_RULE.kinds.includes(kind)) w.straight = Math.max(w.straight || 0, STRAIGHT_RULE.weight);
  return w;
}

/** Legacy skillEffects ({'Cue-Ball Control': 1, 'Shot Making': 0.5}) → v11 weights */
export function weightsFromLegacy(eff = {}, technique = null) {
  const w = {};
  for (const [name, val] of Object.entries(eff || {})) {
    let id = LEGACY_SKILL_MAP[name] === '@technique' ? TECHNIQUE_SKILL[technique] || 'stun' : toSkillId(name);
    if (id) w[id] = Math.max(w[id] || 0, Math.abs(Number(val) || 0));
  }
  return w;
}

/** v11 metadata (from .pooliq or drill objects): skillWeights > primary/secondary/skills > legacy skillEffects */
export function weightsFromMeta(pq = {}, legacy = {}, technique = null) {
  if (pq.skillWeights && Object.keys(pq.skillWeights).length) {
    const w = {};
    for (const [k, v] of Object.entries(pq.skillWeights)) { const id = toSkillId(k); if (id) w[id] = Number(v) || 0; }
    if (Object.keys(w).length) return w;
  }
  const p = toSkillId(pq.primarySkill);
  if (p || (pq.skills || []).length || (pq.secondarySkills || []).length) {
    const w = {};
    for (const s of pq.skills || []) { const id = toSkillId(s); if (id) w[id] = 0.5; }
    for (const s of pq.secondarySkills || []) { const id = toSkillId(s); if (id) w[id] = 0.5; }
    if (p) w[p] = 1;
    return w;
  }
  return weightsFromLegacy(legacy, technique);
}

export function masteryFor(mode, override) {
  const d = MASTERY.byMode[mode] || MASTERY.default;
  const o = override || {};
  return { strong: o.strong ?? d.strong, mastered: o.mastered ?? d.mastered };
}

function primaryOf(w) {
  return Object.entries(w).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
function finish(item) {
  item.weights = normalizeWeights(item.weights);
  item.primary = primaryOf(item.weights);
  if (!item.mastery) item.mastery = masteryFor(item.mode);
  return item;
}

// ------------------------------------------------------------------ built-in content
export function stageItem(gameId, spec, index = 0) {
  const def = getGame(gameId);
  const kind = spec.kind || def.kind;
  const technique = specTechnique({ ...spec, kind });
  const mode = kind === 'calibration' || kind === 'ladder' ? kind : spec.scoring?.mode || def.scoring?.mode || 'binary';
  const w = addStraight(applyTemplate(GAME_SKILLS[gameId] || def.skillEffects, technique), kind, Array.isArray(spec.cut) ? spec.cut[0] : null);
  Object.assign(w, STAGE_SKILL_OVERRIDES[`${gameId}:${spec.id}`] || {});
  return finish({ key: `arcade:${gameId}:${spec.id}`, source: 'arcade', gameId, stageId: spec.id, name: `${def.name} · ${spec.name}`, short: spec.name, level: index + 1, tier: tierOfDifficulty(spec.difficulty), difficulty: spec.difficulty, weights: w, mode, technique, rankXpEligible: true, drillRank: false, href: `#play/${gameId}/${spec.id}` });
}

export function bossShotItem(boss, shot, i) {
  const spec = shot.spec || {};
  const technique = specTechnique(spec);
  const w = weightsFromLegacy({ [shot.skill]: 1 }, technique);
  addStraight(w, spec.kind, Array.isArray(spec.cut) ? spec.cut[0] : null);
  return finish({ key: `bshot:${boss.id}:${i}`, source: 'bshot', bossId: boss.id, name: `${boss.name} · ${shot.title}`, short: shot.title, tier: XP.bossTierByRank[boss.rank] || 'pro', weights: w, mode: shot.mode === 'zone' ? 'zone' : 'binary', technique, rankXpEligible: false, drillRank: false, href: `#boss/${boss.id}` });
}
export function bossItem(boss) {
  const w = {};
  for (const [i, s] of boss.shots.entries()) for (const [k, v] of Object.entries(bossShotItem(boss, s, i).weights)) w[k] = Math.max(w[k] || 0, v * 0.5);
  return finish({ key: `boss:${boss.id}`, source: 'boss', bossId: boss.id, name: `Promotion Test · ${boss.name}`, short: boss.name, tier: XP.bossTierByRank[boss.rank] || 'pro', weights: w, mode: 'boss', rankXpEligible: true, drillRank: false, href: `#boss/${boss.id}`, noSkill: true });
}
export function ghostItem(balls) {
  return finish({ key: `ghost:${balls}`, source: 'ghost', name: `${balls}-Ball Ghost`, short: `${balls}-Ball Ghost`, tier: XP.ghost.tierByBalls[balls] || 'pro', weights: { ...GAME_SKILLS.ghost }, mode: 'ghost', rankXpEligible: true, drillRank: false, href: `#ghost/${balls}/5` });
}
export function ghost8Item(level, group = 3) {
  const k = level === 'custom' ? `custom${group <= 3 ? 3 : group <= 5 ? 5 : 7}` : level;
  return finish({ key: `ghost8:${level}${level === 'custom' ? group : ''}`, source: 'ghost', name: `8-Ball Ghost · ${level === 'custom' ? `${group} + 8` : level[0].toUpperCase() + level.slice(1)}`, short: '8-Ball Ghost', tier: XP.ghost.tierByEight[k] || 'intermediate', weights: { ...GAME_SKILLS.ghost, position: 0.6 }, mode: 'ghost', rankXpEligible: true, drillRank: false, href: '#ghost/eight' });
}

// ------------------------------------------------------------------ drills + content
/** Drill library item (built-in, Create Drill "cd-…", or career-eligible .pooliq drill "pq-…") */
export function drillItem(d) {
  const pq = d.pq || {};
  const custom = !!d.custom && !d.contentUid;
  const w = weightsFromMeta(pq, d.skillEffects, d.technique);
  addStraight(w, d.kind, d.aim?.cutDeg);
  const mode = d.scoringRules?.mode || 'binary';
  return finish({ key: `drill:${d.id}`, source: d.contentUid ? 'content' : custom ? 'custom' : 'drill', drillId: d.id, name: d.name, short: d.name, tier: tierOfDifficulty(d.difficulty), difficulty: d.difficulty, weights: Object.keys(w).length ? w : { shotMaking: 1 }, mode, technique: d.technique, mastery: masteryFor(mode, pq.mastery), baseXP: pq.baseXP ?? null, rankXpEligible: pq.rankXpEligible !== false, drillRank: true, category: d.category, href: `#play/drills/${d.id}` });
}
/** An installed .pooliq item (or pack stage) played from My Content. Earns only when rankXpEligible/careerEligible. */
export function contentItem(it, stage = null) {
  const d = it.doc || {};
  const src = stage || d;
  const pq = { ...pqOf(d), ...(stage ? pqOf(stage) : {}) };
  const technique = src.shot?.technique || null;
  const legacy = src.skillEffects || (src.skill ? { [src.skill]: 1 } : d.skill ? { [d.skill]: 1 } : {});
  const w = weightsFromMeta(pq, legacy, technique);
  const mode = src.scoringRules?.mode || 'success';
  const eligible = d.rankXpEligible === true || (stage ? stage.rankXpEligible === true : false) || d.careerEligible === true;
  return finish({ key: `content:${it.uid}${stage ? `:${stage.id}` : ''}`, source: 'content', uid: it.uid, name: stage ? `${d.title} · ${stage.title}` : d.title, short: stage ? stage.title : d.title, tier: tierOfDifficulty(src.difficulty ?? d.difficulty ?? 2), difficulty: src.difficulty ?? d.difficulty, weights: Object.keys(w).length ? w : { shotMaking: 1 }, mode, technique, mastery: masteryFor(mode, pq.mastery), baseXP: pq.baseXP ?? null, rankXpEligible: eligible && pq.rankXpEligible !== false, drillRank: eligible, category: d.category, href: `#cview/${it.uid}` });
}
export function pqOf(o = {}) {
  const out = {};
  for (const k of ['primarySkill', 'secondarySkills', 'skills', 'skillWeights', 'baseXP', 'mastery', 'rankXpEligible']) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

// ------------------------------------------------------------------ the built-in universe (denominator for skill ratings)
let builtin = null;
export function builtinItems() {
  if (builtin) return builtin;
  const list = [];
  for (const g of GAMES) {
    if (g.special) continue;
    stageSpecs(g.id).forEach((s, i) => list.push(stageItem(g.id, s, i)));
  }
  for (const b of BOSSES) b.shots.forEach((s, i) => list.push(bossShotItem(b, s, i)));
  for (let n = 3; n <= 9; n++) list.push(ghostItem(n));
  builtin = list;
  return list;
}
export function builtinByKey(key) {
  return builtinItems().find((x) => x.key === key) || null;
}
export function arcadeItem(gameId, stageId) {
  return builtinByKey(`arcade:${gameId}:${stageId}`);
}
export { TIERS };
