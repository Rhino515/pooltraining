/**
 * SPEED LADDER — calibrate your stroke to the Pool IQ Speed scale, then climb it.
 * v11.1: SPEED n = n table lengths of total travel from where the cue ball starts. Every lag starts on the
 * first diamond at your end (x = 12.5), the standard start the speed sentences are written for.
 * Stage ids never change (saved progress is keyed by them); names and texts follow the new meanings.
 */
import { speedMeaning } from '../speed.js';

const M = (s) => `${speedMeaning(s)}.`;

export default {
  id: 'speed',
  name: 'Speed Ladder',
  icon: '⇶',
  tagline: 'Calibrate SPEED 1.00–3.00 on your table, hit stop zones, then climb the ladder.',
  primarySkill: 'Speed Control',
  kind: 'lag',
  skillEffects: { 'Speed Control': 1, 'Position Play': 0.3 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 3 }, requirePocket: false },
  unlock: null,
  stages: [
    { id: 'sp-cal', kind: 'calibration', name: 'Calibration', difficulty: 1, speeds: [1, 1.5, 2, 2.5, 3],
      instructions: 'Start the cue ball on the first diamond at your end, shoot each speed with a centre hit and record where it actually stopped. Pool IQ learns your stroke and table.' },
    { id: 'sp-1', name: 'SPEED 1.00 — Kiss the Far Rail', difficulty: 1, speed: 1, cue: [12.5, 25],
      instructions: `From the first diamond: ${M(1)}` },
    { id: 'sp-2', name: 'SPEED 1.50 — Back to the 3rd Diamond', difficulty: 2, speed: 1.5, cue: [12.5, 18],
      instructions: `From the first diamond: ${M(1.5)}` },
    { id: 'sp-3', name: 'SPEED 2.00 — Home Again', difficulty: 3, speed: 2, cue: [12.5, 32],
      instructions: `From the first diamond: ${M(2)} The cue ball should die where it started.` },
    { id: 'sp-4', name: 'SPEED 2.50 — Out Again', difficulty: 4, speed: 2.5, cue: [12.5, 14],
      instructions: `From the first diamond: ${M(2.5)}` },
    { id: 'sp-5', name: 'SPEED 3.00 — Far Rail Again', difficulty: 5, speed: 3, cue: [12.5, 36],
      instructions: `From the first diamond: ${M(3)}` },
    { id: 'sp-6', name: 'Angled SPEED 2.00', difficulty: 5, speed: 2, cue: [12.5, 10], dir: [1, 0.3], zoneType: 'rings',
      instructions: 'Same SPEED 2.00 stroke on a diagonal route that uses several cushions. Same number, different path.',
      note: { speed: 'Angled routes lose a little more pace per cushion; feel how the same number still lands in the zone.' } },
    { id: 'sp-7', name: 'SPEED 3.50 — Power Control', difficulty: 7, speed: 3.5, cue: [12.5, 25], bands: [10, 5, 2.5],
      instructions: `The firmest controlled stroke in the ladder. ${M(3.5)} Stop it inside a tight band.` },
    { id: 'sp-ladder', kind: 'ladder', name: 'Ladder Climb', difficulty: 6, rungs: [1, 1.5, 2, 2.5, 3, 3.5, 4], shots: 12,
      instructions: 'Climb from SPEED 1.00 to 4.00. Land a lag in its zone (2★ or better) to climb a rung; miss and you drop one. Reach the top within 12 shots.' }
  ]
};
