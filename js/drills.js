/**
 * Pool IQ drill library.
 *
 * The library ships only the drills Andrew asked for (v11.1: Three-Lane Speed Exercise) — he adds his own.
 * Every drill uses the same reusable challenge data model as the Table Games, so a new drill automatically gets the table
 * diagram, Shot Recipe card, cue-ball contact diagram, SPEED chip, Why This Shot? sheet and scoring.
 *
 * HOW TO ADD A DRILL
 * Add objects to DRILL_SPECS below (or to drillsExtra.js). Two styles are supported:
 *
 * 1) Builder spec (recommended — geometry, recipe and why-text are computed for you):
 *    {
 *      id: 'my-stop-1', name: 'Stop Shot 1', category: 'Stop Shots', difficulty: 2,
 *      kind: 'position',                 // position | pot | bank | kick | carom | safety | train | lag
 *      ob: [1, 60, 25], pocket: 'TR',    // numbered ball [n, x, y] on the 100×50 table, target pocket
 *      cut: [0, 1, 24],                  // [cut degrees, side ±1, distance] places the cue ball (or cue: [x, y])
 *      k: 0, travel: 0,                  // spin at contact (-1.6 draw … +1.4 follow) and cue-ball travel after contact
 *      scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } },
 *      skillEffects: { 'Cue-Ball Control': 1 },
 *      instructions: 'Set up…', note: { speed: 'extra coaching appended to the speed reason' }
 *    }
 *
 * 2) Full challenge object (for hand-drawn layouts). Required fields:
 *    id, name, category, difficulty, ballPositions [{n,x,y}], cueBallPosition {x,y}, targetPocket,
 *    targetZones [{type:'rings',x,y,rings:[{r,stars}]}], cueBallPath [{x,y}…], contactIndex,
 *    objectBallPath [{x,y}…], railContacts [{x,y,rail}], cueContact {vTips,hTips}, english {hTips,type},
 *    speed (Pool IQ SPEED number), aim {fraction,label,short,cutDeg}, route {rails,text,short},
 *    instructions, goal, whyExplanation {whyContact,whySpeed,whySpin,whyRoute,whyAim},
 *    scoringRules {mode, attempts, pass}, attemptCount, passingRequirement, skillEffects, xp.
 *
 * Scoring modes available to drills: 'binary' (made/miss), 'zone' (pocket + 0–3 stars), 'stars' (0–3 quality).
 */
import { extraDrills } from './drillsExtra.js';
import { buildChallenge } from './games/builders.js';
import { loadCustomDrills } from './customDrills.js';
import { loadContent } from './content/store.js';
import { shotToChallenge } from './content/convert.js';
import { threeLaneSpeedDrill } from './games/data/threeLaneSpeed.js';
import { pkfDrillChallenges } from './content/pkfBuiltins.js';
import { ballPocketDrills } from './content/ballPocket.js';
import { buDrills, isBuId, examInstructions, BU_CREDIT } from './content/buExam.js';
import { buSkillsDrills, isSkillsId, skillsText, SKILLS_CREDIT, SKILLS_BANK_IDS } from './content/buExam2.js';
import { buMoreDrills, isMoreId } from './content/buMore.js';
import { safetyDrills, isSafetyId, safetyText } from './content/safetyMaster.js';
import { applyDrillEdit } from './drills/ownerEdits.js';
import { isDrillHidden } from './drills/hidden.js';

export const CATEGORIES = [
  'Shot Making',
  'Stop Shots',
  'Follow',
  'Draw',
  'Stun',
  'Speed Control',
  'Cue-Ball Position',
  'Cut Shots',
  'Rail Position',
  'Pattern Play',
  'Banks',
  'Kicks',
  'Safeties',
  'Runouts',
  'PKF · Cue Ball Control',
  'PKF · Center Ball',
  'PKF · Sliding Cue Ball',
  'PKF · Half Table Patterns',
  'PKF · Full Table Patterns',
  'PKF · Full Table with Sidespin',
  'PKF · Tips & Tricks · Safeties',
  'Ball Pocketing'
];

/**
 * Author drills here. The library ships drills Andrew asked for (no sample content):
 * v11.1 — the Three-Lane Speed Exercise (js/games/data/threeLaneSpeed.js), also linked from the Speed Ladder.
 * v14-6 — 117 PKF drills from content/pkf/*.pooliq (categories as written in each file).
 */
const DRILL_SPECS = [threeLaneSpeedDrill()];

const DEFAULT_SCORING = { mode: 'binary', attempts: 10, pass: { made: 7 } };

/** Turn a drill spec into a full challenge object (or pass a full object through). */
export function normalizeDrill(spec) {
  const isFull = Array.isArray(spec.ballPositions) && spec.cueBallPosition;
  const ch = isFull
    ? { attemptCount: spec.scoringRules?.attempts || 10, passingRequirement: spec.scoringRules?.pass || {}, scoringRules: DEFAULT_SCORING, blockers: [], warnings: [], ...spec }
    : buildChallenge({ scoring: DEFAULT_SCORING, ...spec }, { game: 'drills', scoring: spec.scoring || DEFAULT_SCORING, skillEffects: spec.skillEffects || {} });
  ch.game = 'drills';
  ch.isDrill = true;
  ch.category = spec.category || ch.category || 'Shot Making';
  ch.prerequisites = spec.prerequisites || [];
  return ch;
}

let built = null;
function buildAll() {
  if (!built) {
    built = [];
    for (const spec of [...DRILL_SPECS, ...extraDrills, ...pkfDrillChallenges()]) {
      try {
        built.push(normalizeDrill(spec));
      } catch (e) {
        if (spec && String(spec.id || '').startsWith('pkf-')) throw e;
        console.warn('Pool IQ: skipped invalid drill', spec && spec.id, e);
      }
    }
  }
  return built;
}

/** Built-in library */
export const drills = buildAll();

// Custom drills made with Create Drill live in localStorage and are merged in at load.
let customCache = null;
export function customDrills() {
  if (!customCache) {
    customCache = [];
    for (const c of loadCustomDrills()) {
      try {
        const d = normalizeDrill(c);
        d.custom = true;
        customCache.push(d);
      } catch (e) {
        console.warn('Pool IQ: skipped invalid custom drill', c && c.id, e);
      }
    }
    // Installed .pooliq drills that are explicitly careerEligible join the library (history, skills, XP like
    // custom drills; never rank). Everything else in My Content only earns personal content progress.
    for (const it of loadContent()) {
      if (it.contentType !== 'drill' || it.doc?.careerEligible !== true) continue;
      try {
        const d = normalizeDrill(contentDrillChallenge(it));
        d.contentUid = it.uid;
        d.imported = it.source !== 'custom';
        customCache.push(d);
      } catch (e) {
        console.warn('Pool IQ: skipped invalid content drill', it && it.id, e);
      }
    }
  }
  return customCache;
}
/** Call after saving / deleting / importing custom drills */
/** Library id for a career-eligible My Content drill */
export const contentDrillId = (uid) => `pq-${uid}`;
export function contentDrillChallenge(it) {
  const d = it.doc;
  return shotToChallenge(d.shot, { id: contentDrillId(it.uid), title: d.title, category: d.category || 'Imported', difficulty: d.difficulty, skill: d.skill, scoringRules: d.scoringRules, xp: d.xp, skillEffects: d.skillEffects });
}
export function refreshCustomDrills() {
  customCache = null;
}
function sealSafety(ch) {
  if (!ch || !isSafetyId(ch.id)) return ch;
  const next = {
    ...ch,
    xp: 0,
    safetyMaster: true,
    prerequisites: [],
    instructions: safetyText(ch.id) || ch.instructions,
    pq: { ...(ch.pq || {}), rankXpEligible: false }
  };
  delete next.level;
  delete next.speed;
  return next;
}
function sealBu(ch) {
  if (!ch || (!isBuId(ch.id) && !isSkillsId(ch.id))) return ch;
  const next = {
    ...ch,
    xp: 0,
    buExam: true,
    prerequisites: [],
    credit: ch.credit || (isSkillsId(ch.id) ? SKILLS_CREDIT : BU_CREDIT),
    instructions: examInstructions(ch.id) || skillsText(ch.id) || ch.instructions,
    pq: { ...(ch.pq || {}), rankXpEligible: false }
  };
  delete next.level;
  delete next.speed;
  return next;
}
function collectDrills() {
  const base = drills.map((d) => sealBu(applyDrillEdit(d)));
  const pocket = ballPocketDrills().filter((c) => !base.some((d) => d.id === c.id));
  const bu = buDrills().map((d) => sealBu(applyDrillEdit(d))).filter((c) => !base.some((d) => d.id === c.id) && !pocket.some((d) => d.id === c.id));
  const skills = buSkillsDrills().map((d) => sealBu(applyDrillEdit(d))).filter((c) => !base.some((d) => d.id === c.id) && !pocket.some((d) => d.id === c.id) && !bu.some((d) => d.id === c.id));
  const more = buMoreDrills().map((d) => applyDrillEdit(d)).filter((c) => !base.some((d) => d.id === c.id) && !pocket.some((d) => d.id === c.id) && !bu.some((d) => d.id === c.id) && !skills.some((d) => d.id === c.id));
  const safety = safetyDrills().map((d) => sealSafety(applyDrillEdit(d))).filter((c) => !base.some((d) => d.id === c.id) && !pocket.some((d) => d.id === c.id) && !bu.some((d) => d.id === c.id) && !skills.some((d) => d.id === c.id) && !more.some((d) => d.id === c.id));
  const custom = customDrills().filter((c) => !base.some((d) => d.id === c.id) && !pocket.some((d) => d.id === c.id) && !bu.some((d) => d.id === c.id) && !skills.some((d) => d.id === c.id) && !more.some((d) => d.id === c.id) && !safety.some((d) => d.id === c.id));
  return [...base, ...pocket, ...bu, ...skills, ...more, ...safety, ...custom];
}
/** Ids that exist in the library, including ones deleted for everyone. History keeps these. */
export function knownDrillIds() {
  return collectDrills().map((d) => d.id);
}
/** Built-in + custom drills, minus drills deleted for everyone. Custom ids start with "cd-". */
/** Display only. Stored titles, ids and .pooliq metadata keep the PKF prefix. */
export function displayDrillTitle(name) {
  return String(name ?? '').replace(/^\s*PKF\b[\s·:\-–—]*/i, '');
}

/** Shown nowhere in Drills. The drills stay shelved (ids kept, not returned to the library). */
export const HIDDEN_DRILL_CATEGORIES = new Set([
  'PKF · Full Table with Sidespin',
  'PKF · Full Table with Side Spin'
]);

/**
 * These categories stay listed, but their drills are not in the library.
 * The drill objects and ids remain (knownDrillIds) so saved history is not archived or reset.
 */
export const SHELVED_CATEGORIES = new Set([
  'PKF · Sliding Cue Ball',
  'PKF · Half Table Patterns',
  'PKF · Full Table Patterns',
  'PKF · Full Table with Sidespin',
  'PKF · Tips & Tricks · Safeties',
  'Banks'
]);

export function allDrills() {
  return collectDrills().filter((d) => {
    // Safety Master drills stay in the course only. The data remains (knownDrillIds, getDrillById).
    if (isSafetyId(d.id) || isMoreId(d.id) || String(d.id).startsWith('bu-ms')) return false;
    if (!(d.custom || !isDrillHidden(d.id))) return false;
    if (d.custom || d.contentUid) return true;
    if (!SHELVED_CATEGORIES.has(d.category)) return true;
    return SKILLS_BANK_IDS.includes(d.id);
  });
}

export function getDrillById(id) {
  const pool = (isSafetyId(id) || isMoreId(id) || String(id).startsWith('bu-ms')) ? collectDrills() : allDrills();
  const d = pool.find((x) => x.id === id) || null;
  if (d && !d.custom && isDrillHidden(d.id)) return null;
  return d;
}

export function drillsByCategory() {
  const out = {};
  for (const d of allDrills()) {
    if (!d.custom && isDrillHidden(d.id)) continue;
    (out[d.category] ||= []).push(d);
  }
  return out;
}

export function isDrillUnlocked(drill, state) {
  const pre = drill.prerequisites || [];
  return pre.every((id) => state.games?.drills?.stages?.[id]?.passed);
}

export default drills;
