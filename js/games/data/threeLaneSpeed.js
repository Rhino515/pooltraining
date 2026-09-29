/**
 * THREE-LANE SPEED EXERCISE — built-in drill (v11.1), shown in the Drills library and next to the Speed Ladder.
 * Inspired by Ron the Pool Student's ICA cue-ball speed exercise (original Pool IQ wording and layout).
 *
 * Three parallel lanes along the length of the table; every lane starts on the first diamond at your end.
 * Left lane SPEED 1.50, center lane SPEED 2.50, right lane SPEED 3.00 — each target circle sits where the
 * Pool IQ speed rule puts the stop (n table lengths of total travel from the start spot).
 * Scoring works exactly like the Speed Ladder lags: tap where the ball stopped (bullseye / middle / outer /
 * missed short or long), 5 attempts per lane, pass with 7★ in every lane (the Speed Ladder's 5-shot / 7★ rule).
 * Everything is built with the shared lag builder, so the diagram, Shot Recipe and Why sheet come for free.
 */
import { buildLag } from '../builders.js';
import { formatSpeed, speedMeaning, speedPath, ORD } from '../speed.js';

export const THREE_LANE_ID = 'three-lane-speed';
export const LANE_ATTEMPTS = 5;
export const LANE_PASS_STARS = 7;
export const CREDIT = "Inspired by Ron the Pool Student's ICA cue-ball speed exercise.";

// "Left" / "right" as seen by the shooter standing at the head end (left of the diagram) looking up the table.
const LANES = [
  { key: 'left', name: 'Left lane', y: 12.5, speed: 1.5 },
  { key: 'center', name: 'Center lane', y: 25, speed: 2.5 },
  { key: 'right', name: 'Right lane', y: 37.5, speed: 3 }
];

const SKILLS = { 'Speed Control': 1, 'Position Play': 0.3 };
const SCORING = { mode: 'zone', attempts: LANE_ATTEMPTS * LANES.length, requirePocket: false, lanes: LANES.length, perLane: LANE_ATTEMPTS, pass: { stars: LANE_PASS_STARS * LANES.length, starsPerLane: LANE_PASS_STARS } };

function laneChallenge(l, i) {
  const label = `${l.name} · SPEED ${formatSpeed(l.speed)}`;
  const c = buildLag({
    id: `${THREE_LANE_ID}-${l.key}`,
    name: `Three-Lane Speed · ${label}`,
    speed: l.speed,
    cue: [12.5, l.y],
    dir: [1, 0],
    zoneType: 'rings',
    difficulty: 3,
    goal: `Stop the cue ball inside the circle on the ${ORD[Math.round(speedPath(l.speed).diamond)]} diamond from your end.`,
    instructions: `Place the cue ball on the first diamond at your end, in the ${l.name.toLowerCase()}. Centre-ball hit, stroke straight up the lane. ${LANE_ATTEMPTS} attempts, then move to the next lane. After each shot tap where the ball stopped: bullseye, middle, outer ring, or missed (short / long). ${CREDIT}`
  }, { game: 'drills', scoring: SCORING, skillEffects: SKILLS });
  c.targetZones = c.targetZones.map((z) => ({ ...z, label: formatSpeed(l.speed) }));
  c.lane = { index: i, count: LANES.length, key: l.key, label, attempts: LANE_ATTEMPTS };
  c.game = 'drills';
  c.isDrill = true;
  c.category = 'Speed Control';
  c.scoringRules = SCORING;
  c.attemptCount = SCORING.attempts;
  c.passingRequirement = SCORING.pass;
  c.skillEffects = SKILLS;
  return c;
}

/** Full challenge object for the drill library (lanes[] are swapped in per attempt by the engine) */
export function threeLaneSpeedDrill() {
  const lanes = LANES.map(laneChallenge);
  const base = lanes[1];
  return {
    ...base,
    id: THREE_LANE_ID,
    name: 'Three-Lane Speed Exercise',
    category: 'Speed Control',
    difficulty: 3,
    builtin: true,
    credit: CREDIT,
    speed: 2.5,
    lanes,
    laneOverlay: lanes.map((c) => ({ key: c.lane.key, start: c.cueBallPosition, path: c.cueBallPath, speed: c.speed })),
    targetZones: lanes.map((c) => c.targetZones[0]),
    railContacts: [],
    goal: 'Three lanes from the first diamond: SPEED 1.50, 2.50 and 3.00. Stop the cue ball in each target circle.',
    instructions: `Set three cue-ball start spots on the first diamond at your end: left, center and right lane. Left lane SPEED 1.50: ${speedMeaning(1.5)}. Center lane SPEED 2.50: ${speedMeaning(2.5)}. Right lane SPEED 3.00: ${speedMeaning(3)}. Centre-ball hit. ${LANE_ATTEMPTS} attempts per lane; pass with ${LANE_PASS_STARS}★ in every lane. ${CREDIT}`,
    scoringRules: SCORING,
    attemptCount: SCORING.attempts,
    passingRequirement: SCORING.pass,
    skillEffects: SKILLS,
    xp: 150
  };
}
