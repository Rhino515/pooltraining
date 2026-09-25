/** STUN MASTER — stop, stun, tangent lines, and the in-between shots. Zones shrink as you advance. */
export default {
  id: 'stun',
  name: 'Stun Master',
  icon: '⊥',
  tagline: 'Kill the spin at contact. Master the tangent line, then bend it on purpose.',
  primarySkill: 'Cue-Ball Control',
  kind: 'position',
  skillEffects: { 'Cue-Ball Control': 1, 'Shot Making': 0.3, 'Position Play': 0.3 },
  scoring: { mode: 'zone', attempts: 5, pass: { stars: 7, pockets: 4 } },
  unlock: null,
  stages: [
    { id: 'st-1', name: 'Stop Shot', difficulty: 1, ob: [1, 70, 20], pocket: 'TR', cut: [0, 1, 18], k: 0, travel: 0, family: 'stun', rings: [9, 6, 3], pass: { stars: 6, pockets: 4 },
      instructions: 'Straight into the top-right corner. The cue ball should stop dead on the spot where the 1 was.' },
    { id: 'st-2', name: 'Long Stop', difficulty: 3, ob: [2, 74, 36], pocket: 'BR', cut: [0, 1, 44], k: 0, travel: 0, family: 'stun', rings: [8, 5.5, 3],
      instructions: 'Same stop, now from 44 inches. The cue ball has to still be sliding when it arrives.' },
    { id: 'st-3', name: 'Small-Angle Stun', difficulty: 3, ob: [3, 70, 16], pocket: 'TR', cut: [12, 1, 24], k: 0, travel: 8, family: 'stun', rings: [8, 5.5, 3],
      instructions: 'A 12° cut. Stun it and the cue ball slides a short way out along the tangent line.' },
    { id: 'st-4', name: 'Stun Left', difficulty: 4, ob: [4, 70, 22], pocket: 'TR', cut: [30, -1, 22], k: 0, travel: 14, family: 'stun', rings: [8, 5, 2.8],
      instructions: 'Half-ball cut. The cue ball peels off to the left of the shot line, exactly 90° from the 4\'s path.' },
    { id: 'st-5', name: 'Stun Right', difficulty: 4, ob: [5, 64, 22], pocket: 'TR', cut: [30, 1, 26], k: 0, travel: 20, family: 'stun', rings: [8, 5, 2.8],
      instructions: 'Mirror image of Stun Left: same cut from the other side, cue ball peels off to the right.' },
    { id: 'st-6', name: 'Forty-Five Degrees', difficulty: 5, ob: [6, 34, 36], pocket: 'BL', cut: [45, 1, 24], k: 0, travel: 24, family: 'stun', rings: [7, 4.5, 2.5],
      instructions: 'A 45° cut into the bottom-left corner. Stun keeps the cue ball on the tangent line even at this angle.' },
    { id: 'st-7', name: 'Stun-Run-Through', difficulty: 6, ob: [7, 70, 18], pocket: 'TR', cut: [20, 1, 26], k: 0.3, travel: 20, technique: 'stun-run', vTips: 0.5, rings: [7, 4.5, 2.5],
      instructions: 'Just a trace of forward roll: the cue ball leaves near the tangent line and drifts slightly forward of it.' },
    { id: 'st-8', name: 'Stun-Draw', difficulty: 6, ob: [8, 70, 34], pocket: 'BR', cut: [20, -1, 26], k: -0.35, travel: 16, technique: 'stun-draw', vTips: -0.5, rings: [7, 4.5, 2.5],
      instructions: 'A little leftover backspin: the cue ball starts on the tangent line and eases just behind it.' },
    { id: 'st-9', name: 'Stun off the Rail', difficulty: 8, ob: [9, 28, 10], pocket: 'TL', cut: [40, 1, 24], k: 0, travel: 48, family: 'stun', rings: [6, 4, 2.2],
      instructions: 'Cut the 9 into the top-left corner. The stunned cue ball crosses to the bottom rail and comes off it into small rings.' }
  ]
};
