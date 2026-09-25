/** POCKET SNIPER — pure pocketing. Lives, a streak multiplier (×1 → ×5) and a high score. Ghost-ball overlays on cuts. */
export default {
  id: 'sniper',
  name: 'Pocket Sniper',
  icon: '⌖',
  tagline: '3 lives, streak multiplier up to ×5. Every second pot in a row adds ×1.',
  primarySkill: 'Shot Making',
  kind: 'pot',
  skillEffects: { 'Shot Making': 1 },
  scoring: { mode: 'sniper', lives: 3, attempts: 10, pass: { made: 7 } },
  unlock: null,
  stages: [
    { id: 'ps-1', name: 'Dead Straight', difficulty: 1, ob: [1, 70, 30], pocket: 'BR', cut: [0, 1, 26], pass: { made: 6 },
      instructions: 'Straight in to the bottom-right corner. Ten shots, three lives — set the cue ball back in the same spot each time.' },
    { id: 'ps-2', name: 'Small Cut', difficulty: 2, ob: [2, 64, 16], pocket: 'TR', cut: [12, 1, 26],
      instructions: 'A thin slice off full: about a 12° cut into the top-right corner.' },
    { id: 'ps-3', name: 'Half-Ball Cut', difficulty: 3, ob: [3, 30, 14], pocket: 'TL', cut: [30, -1, 26],
      instructions: 'The classic half-ball hit: aim the cue ball’s centre at the edge of the 3.',
      note: { aim: 'Half-ball is the one cut you can aim by sight alone — centre of the cue ball at the edge of the object ball.' } },
    { id: 'ps-4', name: 'Thin Cut', difficulty: 5, ob: [4, 84, 38], pocket: 'BR', cut: [60, 1, 22],
      instructions: 'A 60° cut. Trust the ghost ball; the contact point is almost out of sight.' },
    { id: 'ps-5', name: 'Long Green', difficulty: 5, ob: [5, 78, 36], pocket: 'BR', cut: [8, -1, 60],
      instructions: 'Length of the table with a small angle. A smooth stroke beats a hard one.' },
    { id: 'ps-6', name: 'Down the Rail', difficulty: 6, ob: [6, 64, 6.4], pocket: 'TR', cut: [14, 1, 30],
      instructions: 'The 6 is close to the top rail. Pocket it along the cushion into the top-right corner.',
      note: { aim: 'On a rail ball, contacting the rail and the ball at the same time is fine — hitting the rail first is not.' } },
    { id: 'ps-7', name: 'Back Cut', difficulty: 7, ob: [7, 22, 36], pocket: 'BL', cut: [50, 1, 24],
      instructions: 'The cue ball sits "behind" the pocket line — a 50° back cut into the bottom-left corner.' },
    { id: 'ps-8', name: 'Tight Side Entry', difficulty: 8, ob: [8, 36, 38], pocket: 'BM', cut: [25, 1, 24], pass: { made: 6 },
      instructions: 'The 8 approaches the bottom side pocket at a steep angle, so the opening is smaller than it looks.',
      note: { aim: 'Side pockets reject balls arriving at a shallow angle to the rail; this one comes in at only about 36° to the rail, so the far jaw is the danger — aim at the centre of the opening, not the near point.' } }
  ]
};
