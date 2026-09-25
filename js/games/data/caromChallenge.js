/** CAROM CHALLENGE — billiard-style contacts, caroms off the tangent line, combos and kisses. */
export default {
  id: 'carom',
  name: 'Carom Challenge',
  icon: '⚆',
  tagline: 'Numbered contact order on every layout. Read the tangent line, then send the cue ball where it has to go.',
  primarySkill: 'Cue-Ball Control',
  kind: 'carom',
  skillEffects: { 'Cue-Ball Control': 1, 'Shot Making': 0.5, 'Pattern Play': 0.3 },
  scoring: { mode: 'binary', attempts: 5, pass: { made: 3 } },
  unlock: { game: 'stun', level: 3, label: 'Stun Master Level 3' },
  stages: [
    { id: 'ca-1', name: 'Tangent Carom', difficulty: 3, variant: 'cb', family: 'stun', cue: [22, 34], ob1: [1, 46, 26], ob2: [2], caromCut: [40, -1], ob2Travel: 16,
      instructions: 'Stun the cue ball off the 1 so it slides along the tangent line and taps the 2. Contact order: ① the 1, ② the 2.',
      note: { route: 'A stun carom is the easiest to read: lay your cue across the 1 at the contact point and that is the carom line.' } },
    { id: 'ca-2', name: 'Natural-Angle Carom', difficulty: 4, variant: 'cb', family: 'follow', cue: [18, 16], ob1: [3, 40, 22], ob2: [4], caromCut: [30, 1], ob2Travel: 18,
      instructions: 'Half-ball hit with a rolling cue ball: it bends forward onto the 30° line and hits the 4.' },
    { id: 'ca-3', name: 'Draw Carom', difficulty: 5, variant: 'cb', family: 'draw', cue: [72, 14], ob1: [5, 54, 22], ob2: [6], caromCut: [35, 1], ob2Travel: 14,
      instructions: 'Draw the cue ball back off the 5 to carom into the 6 behind the tangent line.' },
    { id: 'ca-4', name: 'Rail-First Carom', difficulty: 6, variant: 'rail', rail: 'top', family: 'stun', cue: [20, 30], ob1: [7, 48, 20], ob2: [1], caromCut: [40, 1], ob2Travel: 14,
      instructions: 'Go to the top rail first, then glance the 7, then carom into the 1. Contact order: ① rail, ② the 7, ③ the 1.' },
    { id: 'ca-5', name: 'Two-Ball Combo', difficulty: 6, variant: 'combo', cue: [30, 30], ob1: [2, 52, 24], ob2: [3, 72, 14], pocket: 'TR',
      instructions: 'Combination: hit the 2 into the 3 and drop the 3 in the top-right corner.',
      note: { speed: 'Combos punish over-hitting — the pocket accepts a gently arriving ball that is a hair off line.' } },
    { id: 'ca-6', name: 'Kiss Shot', difficulty: 7, variant: 'kiss', cue: [26, 16], ob1: [4, 46, 26], ob2: [5, 62, 36], pocket: 'BR',
      instructions: 'Kiss: send the 4 into the 5 so it glances off along the 5\'s tangent line into the bottom-right corner.' },
    { id: 'ca-7', name: 'Long Follow Carom', difficulty: 8, variant: 'cb', family: 'follow', cue: [16, 36], ob1: [6, 36, 30], ob2: [7], caromCut: [45, -1], ob2Travel: 40,
      instructions: 'A thick-ish cut on the 6 with full follow: the cue ball bends forward, travels the length of the carom line and must reach the 7. ① the 6, ② the 7.' }
  ]
};
