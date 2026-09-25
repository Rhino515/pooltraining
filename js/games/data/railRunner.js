/** RAIL RUNNER — position routes that use the cushions: one, two, three rails and around the table. Teaches rail speed and spin. */
export default {
  id: 'rail',
  name: 'Rail Runner',
  icon: '⟲',
  tagline: 'Send the cue ball off 1, 2, 3 and 4 rails into the rings. Speed and spin decide the route.',
  primarySkill: 'Cue-Ball Control',
  kind: 'position',
  skillEffects: { 'Cue-Ball Control': 1, 'Position Play': 0.6, 'Speed Control': 0.6 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 7, pockets: 4 } },
  unlock: { game: 'landing', level: 4, label: 'Landing Zone Level 4' },
  stages: [
    { id: 'rr-1', name: 'One-Rail Crossing', difficulty: 3, ob: [1, 30, 12], pocket: 'TL', cut: [50, -1, 12], k: 0, travel: 44,
      instructions: 'Stun the 1 into the top-left corner; the cue ball slides across the table on the tangent line, meets the bottom rail near the head string and bounces up into the zone.',
      note: { speed: 'One rail costs roughly 40% of the cue ball’s pace, which is already inside the number.' } },
    { id: 'rr-2', name: 'Two-Rail Return', difficulty: 4, ob: [2, 40, 40], pocket: 'BM', cut: [45, -1, 24], k: 1, travel: 92,
      instructions: 'Follow the 2 into the bottom side pocket; the cue ball rolls up-table to the top rail, then the foot rail, and comes back into the foot-end zone.' },
    { id: 'rr-3', name: 'Three-Rail Loop', difficulty: 6, ob: [3, 76, 30], pocket: 'BR', cut: [45, 1, 24], k: 1, travel: 132,
      instructions: 'Cut the 3 into the bottom-right corner and send the cue ball three rails — bottom, top, bottom — the length of the table to the head-end zone.' },
    { id: 'rr-4', name: 'Around the Table', difficulty: 8, ob: [4, 70, 36], pocket: 'BR', cut: [45, -1, 24], k: 1, travel: 156,
      instructions: 'The full tour: four cushions around the table to the top-left zone. Commit to SPEED 4.0.',
      note: { route: 'Around-the-table routes are wide targets for direction but narrow for pace — watch where the cue ball dies, not where it goes.' } },
    { id: 'rr-5', name: 'Running English Swing', difficulty: 6, ob: [5, 62, 40], pocket: 'BM', cut: [45, 1, 24], k: 1, travel: 92, english: { tips: 1, type: 'running' },
      instructions: 'Pocket the 5 in the bottom side with follow and running english so the cue ball swings off two rails to the head end.' },
    { id: 'rr-6', name: 'Reverse Hold-Up', difficulty: 7, ob: [6, 40, 10], pocket: 'TM', cut: [45, -1, 24], k: 1, travel: 68, english: { tips: 1, type: 'reverse' }, pass: { stars: 8, pockets: 4 },
      instructions: 'Reverse english shortens the rebound: pocket the 6 in the top side and hold the cue ball up off two rails in the bottom-left zone.',
      note: { spin: 'Reverse english is the “brake” for rail routes — it keeps the cue ball from running long into the corner.' } }
  ]
};
