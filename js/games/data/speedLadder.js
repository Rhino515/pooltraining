/** SPEED LADDER — calibrate your stroke to the Pool IQ Speed scale, then climb it. */
export default {
  id: 'speed',
  name: 'Speed Ladder',
  icon: '⇶',
  tagline: 'Calibrate SPEED 1–3 on your table, hit stop zones, then climb the ladder.',
  primarySkill: 'Speed Control',
  kind: 'lag',
  skillEffects: { 'Speed Control': 1, 'Position Play': 0.3 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 7 }, requirePocket: false },
  unlock: null,
  stages: [
    { id: 'sp-cal', kind: 'calibration', name: 'Calibration', difficulty: 1, speeds: [1, 1.5, 2, 2.5, 3],
      instructions: 'Shoot the cue ball from the head rail at each speed and record where it actually stopped. Pool IQ learns your stroke and table.' },
    { id: 'sp-1', name: 'SPEED 1.0 — Far Rail', difficulty: 1, speed: 1, cue: [5, 25], pass: { stars: 6 },
      instructions: 'From against the head rail, roll the cue ball just to the far rail. Touching it softly is the bullseye.' },
    { id: 'sp-2', name: 'SPEED 1.5 — Back to the Sides', difficulty: 2, speed: 1.5, cue: [5, 18],
      instructions: 'Far rail and halfway back — stop the cue ball level with the side pockets.' },
    { id: 'sp-3', name: 'SPEED 2.0 — Home Again', difficulty: 3, speed: 2, cue: [5, 32],
      instructions: 'Down and back: the cue ball should die near the head rail where it started.' },
    { id: 'sp-4', name: 'SPEED 2.5 — Out Again', difficulty: 4, speed: 2.5, cue: [5, 14],
      instructions: 'Two and a half lengths: home rail, then out to the side pockets again.' },
    { id: 'sp-5', name: 'SPEED 3.0 — Three Lengths', difficulty: 5, speed: 3, cue: [5, 36],
      instructions: 'Three full lengths, finishing at the far rail after two rebounds.' },
    { id: 'sp-6', name: 'Angled SPEED 2.0', difficulty: 5, speed: 2, cue: [5, 10], dir: [1, 0.3], zoneType: 'rings',
      instructions: 'Same SPEED 2.0 stroke on a diagonal route that uses two cushions. Same number, different path.',
      note: { speed: 'Angled routes lose a little more pace per cushion; feel how the same number still lands in the zone.' } },
    { id: 'sp-7', name: 'SPEED 3.5 — Power Control', difficulty: 7, speed: 3.5, cue: [5, 25], bands: [10, 5, 2.5],
      instructions: 'The firmest controlled stroke in the ladder: three and a half lengths and still stop in a tight band.' },
    { id: 'sp-ladder', kind: 'ladder', name: 'Ladder Climb', difficulty: 6, rungs: [1, 1.5, 2, 2.5, 3, 3.5, 4], shots: 12,
      instructions: 'Climb from SPEED 1.0 to 4.0. Land a lag in its zone (2★ or better) to climb a rung; miss and you drop one. Reach the top within 12 shots.' }
  ]
};
