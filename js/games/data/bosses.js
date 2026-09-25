/**
 * BOSS BATTLES — one per Career rank. Each shot is a full challenge (table + recipe + why) with its own pass criteria.
 * Pass/fail is computed only from recorded shot results. Failing lists the skills that let you down.
 */
const pos = (skill, title, spec, attempts = 3, need = 4) => ({ skill, title, spec: { kind: 'position', ...spec }, mode: 'zone', attempts, need });
const bin = (skill, title, spec, attempts = 3, need = 2, madeLabel) => ({ skill, title, spec, mode: 'binary', attempts, need, madeLabel });

export default {
  list: [
    { id: 'boss-1', rank: 1, name: 'The Gatekeeper', intro: 'Four basics: pot, stop, roll and a speed lag.',
      shots: [
        bin('Shot Making', 'Straight Pot', { kind: 'pot', ob: [1, 58, 20], pocket: 'TR', cut: [0, 1, 28] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Stop Shot', { ob: [2, 64, 32], pocket: 'BR', cut: [0, 1, 20], k: 0, travel: 0, technique: 'stop', rings: [6, 4, 2] }, 3, 4),
        pos('Position Play', 'Natural Roll', { ob: [3, 36, 16], pocket: 'TL', cut: [30, -1, 26], k: 1, travel: 22 }, 3, 3),
        bin('Speed Control', 'SPEED 2.0 Lag', { kind: 'lag', speed: 2, cue: [5, 28] }, 3, 2, 'IN THE ZONE')
      ] },
    { id: 'boss-2', rank: 2, name: 'Cut Throat', intro: 'Cuts, a follow and a draw, plus one bank.',
      shots: [
        bin('Shot Making', 'Half-Ball Cut', { kind: 'pot', ob: [4, 72, 14], pocket: 'TR', cut: [30, 1, 24] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Follow Forward', { ob: [5, 60, 36], pocket: 'BR', cut: [10, -1, 24], k: 1, travel: 16 }, 3, 3),
        pos('Cue-Ball Control', 'Draw Back', { ob: [6, 40, 34], pocket: 'BL', cut: [8, 1, 20], k: -1, travel: 18 }, 3, 3),
        bin('Banks', 'Cross-Side Bank', { kind: 'bank', ob: [7, 42, 22], pocket: 'TM', rails: ['bottom'], cut: [30, -1, 18] }, 3, 1, 'BANK MADE'),
        bin('Speed Control', 'SPEED 1.5 Lag', { kind: 'lag', speed: 1.5, cue: [5, 20] }, 3, 2, 'IN THE ZONE')
      ] },
    { id: 'boss-3', rank: 3, name: 'The Grinder', intro: 'Stun control, a kick, a safety and position.',
      shots: [
        bin('Shot Making', 'Long Pot', { kind: 'pot', ob: [1, 80, 32], pocket: 'BR', cut: [12, 1, 54] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Stun Across', { ob: [2, 54, 14], pocket: 'TM', cut: [30, 1, 24], k: 0, travel: 20 }, 3, 3),
        pos('Position Play', 'One-Rail Shape', { ob: [3, 70, 12], pocket: 'TR', cut: [35, -1, 24], k: 0.6, travel: 40 }, 3, 3),
        bin('Kicks', 'One-Rail Kick', { kind: 'kick', cue: [22, 34], target: [4, 66, 34], rails: ['top'], blockers: [[9, 44, 34]] }, 3, 2, 'LEGAL HIT'),
        bin('Safeties', 'Simple Hide', { kind: 'safety', cue: [26, 26], ob: [5, 42, 24], obZone: [82, 16], cueZone: [40, 33], k: 0, travel: 8, autoBlock: [[8, 0.18]] }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Speed Control', 'SPEED 2.5 Lag', { kind: 'lag', speed: 2.5, cue: [5, 34] }, 3, 2, 'IN THE ZONE')
      ] },
    { id: 'boss-4', rank: 4, name: 'Table Captain', intro: 'Seven shots across banks, kicks, safeties and a short runout.',
      shots: [
        bin('Shot Making', 'Thin Cut', { kind: 'pot', ob: [6, 20, 12], pocket: 'TL', cut: [55, 1, 22] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Two-Diamond Draw', { ob: [7, 70, 25], pocket: 'TR', cut: [5, 1, 18], k: -1.2, travel: 24 }, 3, 3),
        pos('Position Play', 'Two-Rail Route', { ob: [1, 66, 30], pocket: 'BR', cut: [40, -1, 26], k: 0.8, travel: 64 }, 3, 3),
        bin('Banks', 'Cross-Corner Bank', { kind: 'bank', ob: [2, 30, 22], pocket: 'TL', rails: ['bottom'], cut: [30, 1, 18] }, 3, 1, 'BANK MADE'),
        bin('Kicks', 'Short-Rail Kick', { kind: 'kick', cue: [58, 36], target: [3, 74, 14], rails: ['right'], blockers: [[5, 66, 25]] }, 3, 2, 'LEGAL HIT'),
        bin('Safeties', 'Rail Freeze', { kind: 'safety', cue: [36, 16], ob: [4, 54, 28], obZone: [66, 43.6], cueZone: [58, 8], k: -0.5, travel: 18 }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Pattern Play', 'Three-Ball Run', { kind: 'train', cue: [26, 22], steps: [{ ob: [1, 38, 14], pocket: 'TL', family: 'any' }, { ob: [2, 58, 32], pocket: 'BR', family: 'any' }, { ob: [3, 80, 18], pocket: 'TR' }] }, 3, 1, 'RAN OUT')
      ] },
    { id: 'boss-5', rank: 5, name: 'Expert Promotion Boss', intro: 'Shotmaking, Draw, Follow, Stun, Position, Bank, Kick, Safety — then a final runout.',
      shots: [
        bin('Shot Making', 'Shotmaking: Back Cut', { kind: 'pot', ob: [5, 78, 36], pocket: 'BR', cut: [45, -1, 24] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Draw: One Diamond', { ob: [6, 62, 20], pocket: 'TR', cut: [12, 1, 22], k: -1, travel: 14 }, 3, 4),
        pos('Cue-Ball Control', 'Follow: Into the Rings', { ob: [7, 34, 34], pocket: 'BL', cut: [12, 1, 24], k: 1, travel: 18 }, 3, 4),
        pos('Cue-Ball Control', 'Stun: Tangent Line', { ob: [8, 46, 36], pocket: 'BM', cut: [35, -1, 24], k: 0, travel: 18 }, 3, 4),
        pos('Position Play', 'Position: Two Rails', { ob: [1, 24, 12], pocket: 'TL', cut: [40, 1, 26], k: 0.8, travel: 70 }, 3, 4),
        bin('Banks', 'Bank: Long Cross-Side', { kind: 'bank', ob: [2, 66, 28], pocket: 'BM', rails: ['top'], cut: [35, -1, 18] }, 3, 1, 'BANK MADE'),
        bin('Kicks', 'Kick: Two Rails', { kind: 'kick', cue: [36, 30], target: [3, 74, 36], rails: ['top', 'right'], blockers: [[4, 56, 33]] }, 3, 1, 'LEGAL HIT'),
        bin('Safeties', 'Safety: Hide It', { kind: 'safety', cue: [64, 30], ob: [9, 50, 26], obZone: [16, 14], cueZone: [52, 37], k: 0, travel: 10, autoBlock: [[6, 0.2]] }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Pattern Play', 'Final Runout: Four Balls', { kind: 'train', cue: [22, 28], steps: [{ ob: [1, 34, 38], pocket: 'BL', family: 'any' }, { ob: [2, 52, 14], pocket: 'TM', family: 'any' }, { ob: [3, 72, 30], pocket: 'BR', family: 'any' }, { ob: [4, 84, 16], pocket: 'TR' }] }, 3, 1, 'RAN OUT')
      ] },
    { id: 'boss-6', rank: 6, name: 'The Master Class', intro: 'Tighter zones and two-way shots.',
      shots: [
        bin('Shot Making', 'Rail Cut', { kind: 'pot', ob: [2, 30, 43.6], pocket: 'BL', cut: [20, -1, 30] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Stun-Draw', { ob: [3, 58, 30], pocket: 'BR', cut: [30, 1, 22], k: -0.35, travel: 16, technique: 'stun-draw', rings: [7, 4.5, 2.5] }, 3, 4),
        pos('Position Play', 'Three-Rail Tour', { ob: [4, 20, 36], pocket: 'BL', cut: [40, -1, 26], k: 0.8, travel: 120 }, 3, 4),
        pos('Speed Control', 'Soft Touch', { ob: [5, 74, 16], pocket: 'TR', cut: [20, 1, 20], k: 0.6, travel: 6, rings: [5, 3.5, 2] }, 3, 4),
        bin('Banks', 'Bank + Position', { kind: 'bank', ob: [6, 36, 28], pocket: 'BM', rails: ['top'], cut: [35, 1, 20], k: 0, travel: 20, position: true }, 3, 1, 'BANK + ZONE'),
        bin('Kicks', 'Kick and Safe', { kind: 'kick', cue: [72, 30], target: [7, 30, 14], rails: ['bottom'], blockers: [[1, 51, 22]], safeTravel: 10 }, 3, 1, 'HIT + SAFE'),
        bin('Safeties', 'Distance Safety', { kind: 'safety', cue: [20, 30], ob: [8, 14, 22], obZone: [8, 12], cueZone: [86, 30], k: 0.4, travel: 80 }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Pattern Play', 'Five-Ball Runout', { kind: 'train', cue: [20, 25], steps: [{ ob: [1, 32, 14], pocket: 'TL', family: 'any' }, { ob: [2, 46, 36], pocket: 'BM', family: 'any' }, { ob: [3, 66, 20], pocket: 'TR', family: 'any' }, { ob: [4, 80, 38], pocket: 'BR', family: 'any' }, { ob: [5, 58, 12], pocket: 'TM' }] }, 2, 1, 'RAN OUT')
      ] },
    { id: 'boss-7', rank: 7, name: 'Elite Gauntlet', intro: 'Eight shots, most with a single chance to recover.',
      shots: [
        bin('Shot Making', 'Long Thin Cut', { kind: 'pot', ob: [3, 80, 14], pocket: 'TR', cut: [50, 1, 40] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Power Draw', { ob: [4, 72, 30], pocket: 'BR', cut: [15, 1, 26], k: -1.3, travel: 40 }, 3, 4),
        pos('Position Play', 'Needle Route', { ob: [5, 46, 12], pocket: 'TM', cut: [30, 1, 26], k: 0.5, travel: 40, blockers: [[1, 70, 12], [2, 70, 29]], rings: [7, 4.5, 2.5] }, 3, 4),
        pos('Speed Control', 'Three-Rail Pace', { ob: [6, 80, 14], pocket: 'TR', cut: [38, 1, 26], k: 0.7, travel: 130, rings: [8, 5, 2.5] }, 3, 4),
        bin('Banks', 'Two-Rail Bank', { kind: 'bank', ob: [7, 66, 30], pocket: 'BM', rails: ['bottom', 'top'], cut: [30, 1, 18] }, 3, 1, 'BANK MADE'),
        bin('Kicks', 'Kick to Pocket', { kind: 'kick', cue: [40, 36], target: [8, 84, 12], rails: ['top'], pocket: 'TR', blockers: [[2, 62, 24]] }, 3, 1, 'KICK POCKET'),
        bin('Safeties', 'Thin Hook', { kind: 'safety', cue: [80, 34], ob: [9, 50, 38], obZone: [40, 43], cueZone: [26, 12], k: 0.8, travel: 44, autoBlock: [[1, 0.25, -3], [5, 0.25, 3]] }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Pattern Play', 'Six-Ball Runout', { kind: 'train', cue: [22, 26], steps: [{ ob: [1, 34, 34], pocket: 'BL', family: 'any' }, { ob: [2, 30, 12], pocket: 'TL', family: 'any' }, { ob: [3, 50, 18], pocket: 'TM', family: 'any' }, { ob: [4, 70, 34], pocket: 'BR', family: 'any' }, { ob: [5, 86, 18], pocket: 'TR', family: 'any' }, { ob: [6, 54, 38], pocket: 'BM' }] }, 2, 1, 'RAN OUT')
      ] },
    { id: 'boss-8', rank: 8, name: 'The Pro Tour', intro: 'Nine stations; all but one must be passed.', passShots: 8,
      shots: [
        bin('Shot Making', 'Back Cut Down the Rail', { kind: 'pot', ob: [4, 20, 6.4], pocket: 'TL', cut: [35, 1, 26] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Draw Off the Rail', { ob: [5, 84, 40], pocket: 'BR', cut: [8, -1, 22], k: -1, travel: 20 }, 3, 5),
        pos('Cue-Ball Control', 'Stun-Run-Through', { ob: [6, 50, 34], pocket: 'BM', cut: [30, 1, 24], k: 0.25, travel: 24, technique: 'stun-run', rings: [7, 4.5, 2.5] }, 3, 5),
        pos('Position Play', 'Sidespin Rail Route', { ob: [7, 70, 38], pocket: 'BR', cut: [30, 1, 28], k: 0.3, travel: 34, english: { tips: 1, type: 'running' } }, 3, 5),
        pos('Speed Control', 'Dead Weight', { ob: [8, 30, 22], pocket: 'TL', cut: [20, -1, 22], k: 0.6, travel: 8, rings: [5, 3.5, 2] }, 3, 5),
        bin('Banks', 'Speed Bank', { kind: 'bank', ob: [1, 76, 26], pocket: 'BR', rails: ['top'], cut: [30, -1, 18], speed: 2 }, 3, 2, 'BANK MADE'),
        bin('Kicks', 'Three-Rail Kick', { kind: 'kick', cue: [62, 10], target: [2, 56, 36], rails: ['bottom', 'left', 'top'], blockers: [[9, 59, 23]] }, 3, 1, 'LEGAL HIT'),
        bin('Safeties', 'Lock-Up', { kind: 'safety', cue: [42, 16], ob: [3, 32, 22], obZone: [10, 40], cueZone: [30, 8], k: -1, travel: 10, autoBlock: [[5, 0.22, 3], [6, 0.3, 8.5]] }, 3, 2, 'LOCKED'),
        bin('Pattern Play', 'Pattern Runout', { kind: 'train', cue: [30, 25], steps: [{ ob: [1, 22, 38], pocket: 'BL', family: 'any' }, { ob: [2, 20, 14], pocket: 'TL', family: 'any' }, { ob: [3, 56, 30], pocket: 'BR', family: 'any' }, { ob: [4, 76, 14], pocket: 'TR', family: 'any' }, { ob: [5, 60, 42], pocket: 'BM', family: 'any' }, { ob: [6, 48, 12], pocket: 'TM' }] }, 2, 1, 'RAN OUT')
      ] },
    { id: 'boss-9', rank: 9, name: 'Champion’s Final', intro: 'The last test. Every station must be passed.',
      shots: [
        bin('Shot Making', 'Long Rail Cut', { kind: 'pot', ob: [5, 84, 43.6], pocket: 'BR', cut: [12, 1, 60] }, 3, 2, 'POCKETED'),
        pos('Cue-Ball Control', 'Long Draw', { ob: [6, 66, 25], pocket: 'TR', cut: [3, 1, 36], k: -1.4, travel: 30 }, 3, 6),
        pos('Cue-Ball Control', 'Follow Two Rails', { ob: [7, 22, 36], pocket: 'BL', cut: [35, 1, 26], k: 1, travel: 70, rings: [7, 4.5, 2.5] }, 3, 6),
        pos('Position Play', 'Traffic Position', { ob: [8, 62, 16], pocket: 'TR', cut: [25, -1, 26], k: -0.8, travel: 22, blockers: [[1, 48, 36], [2, 70, 34]], rings: [7, 4.5, 2.5] }, 3, 6),
        pos('Speed Control', 'Around-the-Table Pace', { ob: [3, 70, 36], pocket: 'BR', cut: [48, -1, 24], k: 1, travel: 172, rings: [8, 5, 2.5] }, 3, 5),
        bin('Banks', 'Bank + Draw Position', { kind: 'bank', ob: [4, 60, 22], pocket: 'TM', rails: ['bottom'], cut: [30, -1, 16], k: -1, travel: 14, position: true }, 3, 2, 'BANK + ZONE'),
        bin('Kicks', 'Speed Kick-Safe', { kind: 'kick', cue: [26, 20], target: [9, 64, 38], rails: ['top', 'right'], blockers: [[6, 46, 29]], safeTravel: 8, speed: 2 }, 3, 1, 'HIT + SAFE'),
        bin('Safeties', 'Two-Way Contain', { kind: 'safety', cue: [74, 14], ob: [2, 56, 20], obZone: [34, 43.6], cueZone: [58, 8], k: -1, travel: 11, autoBlock: [[8, 0.15]] }, 3, 2, 'TOUGH OR LOCKED'),
        bin('Pattern Play', 'Championship Runout', { kind: 'train', cue: 'auto', steps: [{ ob: [1, 64, 32], pocket: 'BR', family: 'any' }, { ob: [2, 70, 12], pocket: 'TR', family: 'any' }, { ob: [3, 48, 17], pocket: 'TM', family: 'any' }, { ob: [4, 28, 34], pocket: 'BL', family: 'any' }, { ob: [5, 14, 14], pocket: 'TL', family: 'any' }, { ob: [6, 40, 40], pocket: 'BM' }] }, 2, 1, 'RAN OUT')
      ] }
  ]
};
