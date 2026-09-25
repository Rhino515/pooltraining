/** PATTERN PUZZLE — plan the order before you shoot, then compare with Pool IQ's pattern and play it out. Open-table (any order). */
export default {
  id: 'pattern',
  name: 'Pattern Puzzle',
  icon: '⌗',
  tagline: 'Tap the balls in the order you would run them, lock your plan, then see Pool IQ’s pattern and why.',
  primarySkill: 'Pattern Play',
  kind: 'train',
  skillEffects: { 'Pattern Play': 1, 'Position Play': 0.5 },
  scoring: { mode: 'pattern', attempts: 3, pass: { runs: 1 } },
  unlock: { game: 'train', level: 2, label: 'Position Train Level 2' },
  stages: [
    { id: 'pp-1', name: 'Three-Ball Warm-Up', difficulty: 3, cue: [30, 25],
      steps: [{ ob: [3, 42, 16], pocket: 'TL', family: 'any' }, { ob: [1, 62, 30], pocket: 'BR', family: 'any' }, { ob: [2, 82, 16], pocket: 'TR' }],
      decoyOrder: [1, 2, 3],
      patternWhy: [
        'Start with the 3: it is the only ball with a short, easy angle from where the cue ball sits, and it sits in the path you would need later.',
        'The 1 next, into the bottom-right: a small cut that naturally sends the cue ball up-table toward the last ball.',
        'Finish on the 2 near the top-right corner — the ball closest to a pocket is the best "key" ball to end on, because almost any position works.',
        'Numerical order (1-2-3) would need a long, thin first shot and a cross-table trip back; this order keeps every cue-ball move short.'
      ] },
    { id: 'pp-2', name: 'Clear the Lane', difficulty: 4, cue: [20, 30],
      steps: [{ ob: [2, 34, 38], pocket: 'BL', family: 'any' }, { ob: [4, 52, 16], pocket: 'TM', family: 'any' }, { ob: [1, 70, 34], pocket: 'BR', family: 'any' }, { ob: [3, 86, 20], pocket: 'TR' }],
      decoyOrder: [1, 2, 3, 4],
      patternWhy: [
        'The 2 first: it is close to the bottom-left corner and removing it early opens the cue ball’s lane across the table.',
        'The 4 in the top side pocket uses the middle of the table, the place where the cue ball has the most room to move.',
        'The 1 and the 3 are both at the foot end — play them last, working toward the end rail so the cue ball never has to travel back.',
        'Rule of thumb shown here: clear balls near the cue ball first and work in one direction; don’t criss-cross the table.'
      ] },
    { id: 'pp-3', name: 'Rail-Ball Trap', difficulty: 5, cue: [50, 24],
      steps: [{ ob: [5, 60, 40], pocket: 'BR', family: 'any' }, { ob: [2, 80, 30], pocket: 'TR', family: 'any' }, { ob: [1, 70, 8], pocket: 'TL', family: 'any' }, { ob: [4, 34, 12], pocket: 'TL', family: 'any' }, { ob: [3, 22, 34], pocket: 'BL' }],
      decoyOrder: [1, 2, 3, 4, 5],
      patternWhy: [
        'The 5 near the bottom rail is the problem ball — it only goes in one pocket, so plan it while the table still gives options.',
        'From there the 2 and the 1 at the foot end keep the cue ball moving in one smooth loop.',
        'The 1 frozen near the top rail is played down the rail to the far corner, a straight-in rail shot rather than a thin cut.',
        'End with the 4 and 3 near the head end: two easy balls close together make a forgiving finish.',
        'Playing 1-2-3 in order would force a cross-table trip after every ball and leave the 5 for last, stuck on the rail.'
      ] },
    { id: 'pp-4', name: 'Break the Cluster Line', difficulty: 7, cue: [26, 22],
      steps: [{ ob: [6, 38, 30], pocket: 'BL', family: 'any' }, { ob: [3, 44, 14], pocket: 'TM', family: 'any' }, { ob: [1, 64, 34], pocket: 'BR', family: 'any' }, { ob: [5, 80, 28], pocket: 'BR', family: 'any' }, { ob: [2, 70, 11], pocket: 'TR' }],
      decoyOrder: [1, 2, 3, 5, 6],
      patternWhy: [
        'The 6 is in the cue ball’s way to everything else — pocket it first so later routes are open.',
        'The 3 in the top side is a “transition ball” that brings the cue ball from the head end to the middle.',
        'The 1 and 5 both want the bottom-right corner; play the 1 first so the cue ball does not have to pass the 5.',
        'The 2 near the top-right pocket is the natural finishing ball: reachable from almost anywhere.'
      ] },
    { id: 'pp-5', name: 'Six-Ball Blueprint', difficulty: 9, cue: [24, 26],
      steps: [{ ob: [4, 36, 18], pocket: 'TL', family: 'any' }, { ob: [1, 30, 38], pocket: 'BL', family: 'any' }, { ob: [6, 52, 33], pocket: 'BM', family: 'any' }, { ob: [2, 72, 16], pocket: 'TR', family: 'any' }, { ob: [5, 86, 36], pocket: 'BR', family: 'any' }, { ob: [3, 60, 10], pocket: 'TM' }],
      decoyOrder: [1, 2, 3, 4, 5, 6],
      patternWhy: [
        'Six balls, all six pockets: the pattern clears the head end first (the 4 and the 1), then works up the table.',
        'The 6 in the bottom side is the bridge ball that carries the cue ball from the head end to the foot end.',
        'The 2 and 5 at the foot end are played top then bottom so the cue ball crosses the table once instead of twice.',
        'The 3 by the top side pocket is saved for last — side-pocket balls near the rail are easy from a wide range of angles.',
        'Numerical order would start with a long shot on the 1 away from the cue ball and cross the table after almost every ball.'
      ] }
  ]
};
