/** FOLLOW CHALLENGE — controlled forward roll from inches to multi-rail routes. */
export default {
  id: 'follow',
  name: 'Follow Challenge',
  icon: '↪',
  tagline: 'Roll it the exact distance — short, one diamond, rails, and around.',
  primarySkill: 'Cue-Ball Control',
  kind: 'position',
  skillEffects: { 'Cue-Ball Control': 1, 'Speed Control': 0.5, 'Position Play': 0.3 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 7, pockets: 4 } },
  unlock: null,
  stages: [
    { id: 'fo-1', name: 'Short Follow', difficulty: 1, ob: [1, 70, 30], pocket: 'BR', cut: [3, 1, 20], k: 0.8, travel: 11, rings: [6, 4, 2.4], pass: { stars: 6, pockets: 4 },
      instructions: 'Almost straight at the bottom-right corner. Follow the cue ball just past the spot the 1 left — about 6 inches beyond it.' },
    { id: 'fo-2', name: 'One-Diamond Follow', difficulty: 2, ob: [2, 58, 34], pocket: 'BR', cut: [4, -1, 24], k: 1, travel: 12.5,
      instructions: 'Follow forward exactly one diamond. The pocket is far enough away that a smooth roll is safe.' },
    { id: 'fo-3', name: 'Two-Diamond Follow', difficulty: 3, ob: [3, 54, 18], pocket: 'TR', cut: [5, 1, 24], k: 1.1, travel: 25,
      instructions: 'Nearly straight toward the top-right corner. Follow two full diamonds and stop before the pocket.' },
    { id: 'fo-4', name: 'Follow into Zone', difficulty: 4, ob: [4, 64, 32], pocket: 'BR', cut: [25, -1, 26], k: 1, travel: 28,
      instructions: 'A 25° cut into the bottom-right corner. The rolling cue ball bends forward off the tangent line into the zone.' },
    { id: 'fo-5', name: 'Rail Follow', difficulty: 5, ob: [5, 44, 12], pocket: 'TM', cut: [20, 1, 24], k: 1, travel: 26,
      instructions: 'Cut the 5 into the top side, follow into the top rail and let the cue ball come back off it into the zone.' },
    { id: 'fo-6', name: 'Two-Rail Follow', difficulty: 6, ob: [6, 82, 20], pocket: 'TR', cut: [35, 1, 26], k: 0.9, travel: 80,
      instructions: 'Cut the 6 into the top-right corner and follow two rails back up-table.' },
    { id: 'fo-7', name: 'Natural Angle', difficulty: 6, ob: [7, 60, 30], pocket: 'BR', cut: [30, -1, 30], k: 1, travel: 29,
      instructions: 'A true half-ball hit into the bottom-right corner. The rolling cue ball deflects about 30° off its aim line into the zone.' },
    { id: 'fo-8', name: 'Around the Table', difficulty: 8, ob: [8, 84, 32], pocket: 'BR', cut: [35, -1, 30], k: 1.2, travel: 110, rings: [8, 5, 2.8],
      instructions: 'Pocket the 8 in the corner and follow two rails around the table to the head half.',
      note: { route: 'The first rail decides the whole route — watch the contact point, not the zone, while you stroke.' } }
  ]
};
