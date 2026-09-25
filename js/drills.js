/**
 * Pool IQ drill library.
 *
 * The library ships EMPTY on purpose — Andrew will add his own drills. Every drill uses the same
 * reusable challenge data model as the Arcade games, so a new drill automatically gets the table
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
  'Runouts'
];

/** Author drills here. Intentionally empty — no sample content ships. */
const DRILL_SPECS = [];

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
    for (const spec of [...DRILL_SPECS, ...extraDrills]) {
      try {
        built.push(normalizeDrill(spec));
      } catch (e) {
        console.warn('Pool IQ: skipped invalid drill', spec && spec.id, e);
      }
    }
  }
  return built;
}

export const drills = buildAll();

export function getDrillById(id) {
  return drills.find((d) => d.id === id) || null;
}

export function drillsByCategory() {
  const out = {};
  for (const d of drills) (out[d.category] ||= []).push(d);
  return out;
}

export function isDrillUnlocked(drill, state) {
  const pre = drill.prerequisites || [];
  return pre.every((id) => state.games?.drills?.stages?.[id]?.passed);
}

export default drills;
