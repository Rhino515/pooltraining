/** BANK VAULT — three lives, banks worth +100, +50 bonus for cue-ball position. Endless mode after the final stage. */
export default {
  id: 'bank',
  name: 'Bank Vault',
  icon: '⟋',
  tagline: '3 lives. Bank = +100, bank + position = +150, miss = lose a life.',
  primarySkill: 'Banks',
  kind: 'bank',
  skillEffects: { Banks: 1, 'Speed Control': 0.3, 'Shot Making': 0.3 },
  scoring: { mode: 'lives', lives: 3, attempts: 6, pass: { made: 4 } },
  unlock: { game: 'landing', level: 2, label: 'Landing Zone Level 2' },
  endless: true,
  stages: [
    { id: 'bv-1', name: 'Short Cross-Side', difficulty: 2, ob: [1, 40, 26], pocket: 'BM', rails: ['top'], cut: [35, 1, 18], pass: { made: 3 },
      instructions: 'The 1 sits just below the center line near the side pockets. Bank it off the top rail back across into the bottom side.' },
    { id: 'bv-2', name: 'Long Cross-Side', difficulty: 3, ob: [2, 30, 28], pocket: 'BM', rails: ['top'], cut: [40, -1, 18],
      instructions: 'Farther from the side pocket, so the angle opens up. Bank off the top rail into the bottom side.' },
    { id: 'bv-3', name: 'Cross-Corner', difficulty: 4, ob: [3, 72, 30], pocket: 'BR', rails: ['top'], cut: [35, 1, 18],
      instructions: 'Bank the 3 off the top rail across into the bottom-right corner.' },
    { id: 'bv-4', name: 'Changing Angles', difficulty: 5, ob: [4, 58, 20], pocket: 'TM', rails: ['bottom'], cut: [40, 1, 18],
      instructions: 'Upside-down version: off the bottom rail into the top side. New angle, same mirror rule.' },
    { id: 'bv-5', name: 'Speed-Control Bank', difficulty: 5, ob: [5, 26, 26], pocket: 'BL', rails: ['top'], cut: [35, 1, 20], speed: 2,
      instructions: 'Cross-corner into the bottom-left. Hit every attempt at exactly SPEED 2.0 — this stage is about repeating the pace.',
      note: { speed: 'Banks are speed-sensitive: the same aim at a different pace lands in a different place.' } },
    { id: 'bv-6', name: 'Bank + Position', difficulty: 6, ob: [6, 62, 22], pocket: 'BM', rails: ['top'], cut: [40, 1, 22], k: 0, travel: 22, position: true, pass: { made: 4, bonus: 2 },
      instructions: 'Bank the 6 into the bottom side AND land the cue ball in the zone. Two position bonuses required.' },
    { id: 'bv-7', name: 'Bank + Draw', difficulty: 7, ob: [7, 38, 22], pocket: 'TM', rails: ['bottom'], cut: [30, 1, 16], k: -1, travel: 16, position: true, pass: { made: 4, bonus: 2 },
      instructions: 'Bank the 7 off the bottom rail into the top side and draw the cue ball back into the zone.' },
    { id: 'bv-8', name: 'Two-Rail Vault', difficulty: 9, ob: [8, 28, 26], pocket: 'TM', rails: ['top', 'bottom'], cut: [35, 1, 18], pass: { made: 3 },
      instructions: 'The vault door: bank the 8 across the table twice — top rail, bottom rail — into the top side pocket.',
      note: { aim: 'With two parallel rails, each crossing adds its own mirror; the aim point is the pocket reflected twice.' } }
  ]
};
