/** DRAW CHALLENGE — exact contact point + numeric speed for every draw distance. */
export default {
  id: 'draw',
  name: 'Draw Challenge',
  icon: '↩',
  tagline: 'From a 4-inch nudge to two-rail power draw — measured, not guessed.',
  primarySkill: 'Cue-Ball Control',
  kind: 'position',
  skillEffects: { 'Cue-Ball Control': 1, 'Speed Control': 0.4, 'Position Play': 0.3 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 7, pockets: 4 } },
  unlock: null,
  stages: [
    { id: 'dr-1', name: 'Short Draw', difficulty: 1, ob: [1, 72, 16], pocket: 'TR', cut: [0, 1, 18], k: -0.5, travel: 4, rings: [6, 4, 2.4], pass: { stars: 6, pockets: 4 },
      instructions: 'Dead straight into the top-right corner from close range. Draw the cue ball back about 4 inches — barely a ball-width past its contact spot.',
      note: { contact: 'Short draw is about a clean, level stroke, not about power.' } },
    { id: 'dr-2', name: 'Draw 6 Inches', difficulty: 2, ob: [2, 68, 34], pocket: 'BR', cut: [0, 1, 24], k: -0.8, travel: 6, rings: [6, 4, 2.4],
      instructions: 'Straight into the bottom-right corner. Bring the cue ball back exactly 6 inches.' },
    { id: 'dr-3', name: 'One Diamond', difficulty: 3, ob: [3, 76, 14], pocket: 'TR', cut: [0, 1, 28], k: -1, travel: 12.5,
      instructions: 'Straight shot at the corner. Draw the cue ball back one full diamond (about 12 inches).' },
    { id: 'dr-4', name: 'Two Diamonds', difficulty: 4, ob: [4, 72, 36], pocket: 'BR', cut: [0, 1, 36], k: -1.25, travel: 25,
      instructions: 'Straight in. Draw back two diamonds — this is where a smooth, accelerating finish matters.' },
    { id: 'dr-5', name: 'Angled Draw', difficulty: 5, ob: [5, 72, 17], pocket: 'TR', cut: [25, -1, 26], k: -1, travel: 20,
      instructions: 'A 25° cut into the top-right corner. The cue ball slides out on the tangent line, then hooks back into the zone.' },
    { id: 'dr-6', name: 'Draw to Rail', difficulty: 5, ob: [6, 50, 40], pocket: 'BM', cut: [0, 1, 14], k: -1.3, travel: 28,
      instructions: 'Straight into the bottom side pocket. Draw the cue ball all the way back and stop it near the top rail.' },
    { id: 'dr-7', name: 'Draw off the Rail', difficulty: 6, ob: [7, 46, 38], pocket: 'BM', cut: [8, 1, 16], k: -1.3, travel: 50,
      instructions: 'Slight cut into the bottom side. Draw back into the top rail and let the cue ball come back off it into the zone.' },
    { id: 'dr-8', name: 'Long Draw', difficulty: 7, ob: [8, 82, 36], pocket: 'BR', cut: [6, -1, 50], k: -1.2, travel: 20,
      instructions: 'Long, nearly straight shot. The spin has to survive 50 inches before it can draw the cue ball back 20.' },
    { id: 'dr-9', name: 'Power Draw Rail Route', difficulty: 9, ob: [9, 80, 14], pocket: 'TR', cut: [32, 1, 36], k: -1.5, travel: 54, rings: [8, 5, 2.8],
      instructions: 'A 32° cut into the corner. Draw hard enough to pull the cue ball back off the bottom rail and up into the zone.',
      note: { speed: 'This is the most stroke in the game — stay relaxed and let the cue accelerate through.' } }
  ]
};
