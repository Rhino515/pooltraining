/** KICK ESCAPE — learn to estimate kicks with the mirror method; score by rails used. */
export default {
  id: 'kick',
  name: 'Kick Escape',
  icon: '⤴',
  tagline: '1-rail = 100, 2-rail = 200, 3-rail = 300. Bonuses for kick-safes and kick-pots.',
  primarySkill: 'Kicks',
  kind: 'kick',
  skillEffects: { Kicks: 1, Safeties: 0.3, 'Speed Control': 0.3 },
  scoring: { mode: 'kick', attempts: 5, pass: { hits: 3 } },
  unlock: { game: 'bank', level: 1, label: 'Bank Vault Level 1' },
  stages: [
    { id: 'ke-1', name: 'One-Rail Escape', difficulty: 2, cue: [20, 18], target: [1, 70, 36], rails: ['top'], blockers: [[5, 45, 27]],
      instructions: 'The 5 blocks the direct line. Kick one rail off the top cushion and make a legal hit on the 1.' },
    { id: 'ke-2', name: 'Long One-Rail', difficulty: 3, cue: [14, 40], target: [2, 84, 20], rails: ['top'], blockers: [[3, 49, 30]],
      instructions: 'A long kick the length of the table off the top rail.' },
    { id: 'ke-3', name: 'Short-Rail Kick', difficulty: 4, cue: [62, 14], target: [3, 70, 38], rails: ['right'], blockers: [[7, 66, 26]],
      instructions: 'Use the foot rail: kick off the short cushion back onto the 3.' },
    { id: 'ke-4', name: 'Two-Rail Corner', difficulty: 5, cue: [40, 20], target: [4, 76, 14], rails: ['bottom', 'right'], blockers: [[6, 58, 17], [2, 66, 30], [3, 52, 11]],
      instructions: 'The direct line and both single-cushion kicks are blocked. Kick two rails — bottom rail, then the foot rail — into the 4.' },
    { id: 'ke-5', name: 'Across and Back', difficulty: 6, cue: [8, 25], target: [5, 40, 25], rails: ['top', 'bottom'], blockers: [[1, 31, 25]], scoring: { attempts: 5, pass: { hits: 3 } },
      instructions: 'Two parallel rails: top, then bottom, then onto the 5.' },
    { id: 'ke-6', name: 'Kick and Safe', difficulty: 6, cue: [24, 20], target: [6, 72, 36], rails: ['top'], blockers: [[4, 48, 28]], safeTravel: 11, pass: { hits: 3, bonus: 2 },
      instructions: 'Kick one rail, hit the 6 full and send it into the safe zone near the bottom rail. Two safety bonuses required.' },
    { id: 'ke-7', name: 'Kick to Pocket', difficulty: 7, cue: [42, 16], target: [7, 86, 40], rails: ['bottom'], pocket: 'BR', blockers: [[1, 64, 28]], pass: { hits: 3, bonus: 1 },
      instructions: 'Kick off the bottom rail and cut the 7 into the bottom-right corner. Make at least one.' },
    { id: 'ke-8', name: 'Three-Rail Escape', difficulty: 8, cue: [20, 12], target: [8, 40, 38], rails: ['top', 'right', 'bottom'], blockers: [[3, 32, 26], [5, 20, 30], [9, 50, 30]],
      instructions: 'Boxed in: top rail, foot rail, bottom rail, onto the 8.' },
    { id: 'ke-9', name: 'Speed-Sensitive Kick', difficulty: 9, cue: [54, 36], target: [9, 30, 10], rails: ['bottom', 'left'], blockers: [[2, 42, 23]], safeTravel: 8, speed: 2, pass: { hits: 3, bonus: 2 },
      instructions: 'Two rails into the 9 at exactly SPEED 2.0 so it creeps to the top rail and hides.' }
  ]
};
