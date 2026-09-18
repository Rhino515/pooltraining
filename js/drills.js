/**
 * Pool IQ original curriculum — 99 original drills across progressive categories.
 * NO proprietary third-party drill content.
 */
import { renderTableDiagram } from './tableDiagram.js';
import { extraDrills } from './drillsExtra.js';

function D(partial) {
  return {
    attempts: 10,
    passNeed: 7,
    scoringType: 'binary',
    prerequisites: [],
    xp: 100,
    skillEffects: {},
    outcomes: null,
    ...partial
  };
}

/** Helper: path from cue through OB toward pocket */
function aimPath(cue, ob, pocket) {
  return { points: [cue, ob, pocket], dashed: true };
}

export const CATEGORIES = [
  'Shot Making',
  'Stop Shots',
  'Follow',
  'Draw',
  'Stun',
  'Speed Control',
  'Cue-Ball Position',
  'Cut Shots',
  'Rail Position',
  'Pattern Play',
  'Banks',
  'Kicks',
  'Safeties',
  'Runouts'
];

const baseDrills = [
  // ── Shot Making ──────────────────────────────────────────
  D({
    id: 'sm-straight-1',
    name: 'Center-Table Straight',
    category: 'Shot Making',
    difficulty: 1,
    purpose: 'Build a repeatable center-ball pocketing stroke.',
    setup: 'Object ball on center spot; cue ball on the diagonal toward the foot-left area.',
    attempts: 10,
    passNeed: 8,
    instructions: 'Pocket the 1 in the top-right corner. Reset the exact layout after every shot. Count only clean pocketed balls — no rail first.',
    tip: 'Center ball • medium speed • quiet eyes on the object ball',
    scoringType: 'binary',
    xp: 80,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 38 }, { id: 1, x: 50, y: 25 }],
      targetPocket: 'TR',
      paths: [aimPath({ x: 22, y: 38 }, { x: 50, y: 25 }, { x: 97, y: 3 })]
    }
  }),
  D({
    id: 'sm-straight-2',
    name: 'Long Straight Rails',
    category: 'Shot Making',
    difficulty: 3,
    purpose: 'Pocket long straights without steering.',
    setup: 'Object ball near foot rail center; cue ball near head string center.',
    attempts: 10,
    passNeed: 7,
    prerequisites: ['sm-straight-1'],
    instructions: 'Pocket the 2 in the bottom-right corner on a long straight line. Focus on a smooth follow-through.',
    tip: 'Center ball • soft-medium • stay down through contact',
    scoringType: 'binary',
    xp: 100,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 25 }, { id: 2, x: 72, y: 25 }],
      targetPocket: 'BR',
      paths: [aimPath({ x: 28, y: 25 }, { x: 72, y: 25 }, { x: 97, y: 47 })]
    }
  }),
  D({
    id: 'sm-hanging-1',
    name: 'Hanging Ball Drill',
    category: 'Shot Making',
    difficulty: 1,
    purpose: 'Eliminate easy misses under light pressure.',
    setup: 'Object ball frozen ½ diamond off the corner jaw; cue ball mid-table.',
    attempts: 12,
    passNeed: 11,
    instructions: 'Pocket the hanging 3. Treat each attempt as a money ball — no rushed strokes.',
    tip: 'Center • soft • commit to the line',
    scoringType: 'binary',
    xp: 70,
    skillEffects: { 'Shot Making': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 45, y: 30 }, { id: 3, x: 90, y: 8 }],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'sm-thin-cut-intro',
    name: 'Thin Cut Intro',
    category: 'Shot Making',
    difficulty: 4,
    purpose: 'See thin edges without overcutting.',
    setup: 'Object ball near side; cue ball creating ~15° cut to corner.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['sm-straight-1'],
    instructions: 'Cut the 4 into the top-left corner. Misses that overcut count as fail — learn the edge.',
    tip: 'Center ball • soft speed • aim the edge you see',
    scoringType: 'binary',
    xp: 110,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 55, y: 35 }, { id: 4, x: 30, y: 18 }],
      targetPocket: 'TL',
      paths: [aimPath({ x: 55, y: 35 }, { x: 30, y: 18 }, { x: 3, y: 3 })]
    }
  }),

  // ── Stop Shots ───────────────────────────────────────────
  D({
    id: 'stop-1',
    name: 'Stop Shot Foundation',
    category: 'Stop Shots',
    difficulty: 2,
    purpose: 'Leave the cue ball dead on short stop shots.',
    setup: '1-diamond gap between CB and OB on a straight line to the corner.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 2 and stop the cue ball inside the blue zone (OB starting area). Full ball must finish in the zone.',
    tip: 'Firm center-ball stun • no follow-through lift',
    xp: 100,
    skillEffects: { 'Cue-Ball Control': 7, 'Speed Control': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 35 }, { id: 2, x: 55, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 55, y: 22, r: 6 },
      paths: [aimPath({ x: 30, y: 35 }, { x: 55, y: 22 }, { x: 97, y: 3 })],
      arrows: []
    }
  }),
  D({
    id: 'stop-2',
    name: 'Medium Stop Distance',
    category: 'Stop Shots',
    difficulty: 4,
    purpose: 'Hold stop as distance grows.',
    setup: 'Two-diamond CB–OB separation, straight into corner.',
    attempts: 10,
    passNeed: 7,
    prerequisites: ['stop-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket and stop inside the zone. Use a slightly firmer stun stroke.',
    tip: 'Center • firm-medium • accelerate through',
    xp: 120,
    skillEffects: { 'Cue-Ball Control': 6, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 20, y: 38 }, { id: 3, x: 58, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 58, y: 20, r: 6.5 }
    }
  }),
  D({
    id: 'stop-3',
    name: 'Stop Across the Table',
    category: 'Stop Shots',
    difficulty: 6,
    purpose: 'Stop on longer stun lines under pressure.',
    setup: 'Nearly full-table straight stop into the far corner.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['stop-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Long stop into TR. Zone is centered on the OB start.',
    tip: 'True stun • compact stroke • no scoop',
    xp: 140,
    skillEffects: { 'Cue-Ball Control': 7, 'Shot Making': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 15, y: 40 }, { id: 5, x: 70, y: 15 }],
      targetPocket: 'TR',
      zone: { x: 70, y: 15, r: 7 }
    }
  }),

  // ── Follow ───────────────────────────────────────────────
  D({
    id: 'follow-1',
    name: 'Natural Follow Zone',
    category: 'Follow',
    difficulty: 2,
    purpose: 'Send CB forward a controlled distance after a straight pocket.',
    setup: 'Straight shot; target zone one diamond past the OB.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 3 and follow into the blue zone beyond the object ball.',
    tip: '½–1 tip above center • medium speed',
    xp: 100,
    skillEffects: { 'Cue-Ball Control': 5, 'Position Play': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 36 }, { id: 3, x: 48, y: 24 }],
      targetPocket: 'TR',
      zone: { x: 68, y: 14, r: 7 },
      arrows: [{ from: { x: 48, y: 24 }, to: { x: 64, y: 16 } }]
    }
  }),
  D({
    id: 'follow-2',
    name: 'Follow for Side Angle',
    category: 'Follow',
    difficulty: 4,
    purpose: 'Follow forward while collecting a mild angle.',
    setup: 'Slight cut; follow zone near center for next-ball shape.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['follow-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TR and finish in the center-table zone.',
    tip: '¾ tip high • controlled follow • don’t force draw',
    xp: 120,
    skillEffects: { 'Position Play': 6, 'Cue-Ball Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 40 }, { id: 6, x: 52, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 55, y: 32, r: 7 },
      arrows: [{ from: { x: 52, y: 22 }, to: { x: 55, y: 30 } }]
    }
  }),
  D({
    id: 'follow-3',
    name: 'Two-Rail Follow Idea',
    category: 'Follow',
    difficulty: 6,
    purpose: 'Use follow speed to travel toward a distant zone.',
    setup: 'Straight-ish follow that drifts CB toward the side rail zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['follow-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket and let CB roll into the lower-side zone. Touching a rail then entering the zone is OK.',
    tip: '1 tip high • medium-firm • smooth',
    xp: 140,
    skillEffects: { 'Position Play': 7, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 20, y: 28 }, { id: 4, x: 50, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 75, y: 38, r: 8 },
      arrows: [{ from: { x: 50, y: 18 }, to: { x: 72, y: 36 } }]
    }
  }),

  // ── Draw ─────────────────────────────────────────────────
  D({
    id: 'draw-1',
    name: 'Short Draw Zone',
    category: 'Draw',
    difficulty: 3,
    purpose: 'Pull CB back a controlled short distance.',
    setup: 'Close straight shot; draw zone behind CB start.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 4 and draw back into the blue zone near the original CB.',
    tip: '1 tip below center • smooth acceleration • level cue',
    xp: 110,
    skillEffects: { 'Cue-Ball Control': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 34 }, { id: 4, x: 55, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 28, y: 38, r: 7 },
      arrows: [{ from: { x: 55, y: 22 }, to: { x: 32, y: 36 } }]
    }
  }),
  D({
    id: 'draw-2',
    name: 'Draw to Center',
    category: 'Draw',
    difficulty: 5,
    purpose: 'Draw CB into a center-table window.',
    setup: 'Medium draw with zone at table center.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['draw-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TR and draw into the center zone.',
    tip: '1–1.5 tips low • medium • don’t scoop',
    xp: 130,
    skillEffects: { 'Cue-Ball Control': 6, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 36 }, { id: 7, x: 62, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 48, y: 25, r: 7 },
      arrows: [{ from: { x: 62, y: 20 }, to: { x: 50, y: 24 } }]
    }
  }),
  D({
    id: 'draw-3',
    name: 'Power Draw Window',
    category: 'Draw',
    difficulty: 7,
    purpose: 'Longer draw without losing the pocket.',
    setup: 'Longer CB–OB gap; deep draw zone near head string.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['draw-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket and draw deep into the head-area zone.',
    tip: 'Low tip • accelerate • keep cue as level as possible',
    xp: 160,
    skillEffects: { 'Cue-Ball Control': 8, 'Shot Making': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 42, y: 32 }, { id: 5, x: 68, y: 16 }],
      targetPocket: 'TR',
      zone: { x: 20, y: 28, r: 8 },
      arrows: [{ from: { x: 68, y: 16 }, to: { x: 24, y: 28 } }]
    }
  }),

  // ── Stun ─────────────────────────────────────────────────
  D({
    id: 'stun-1',
    name: 'Stun Across Line',
    category: 'Stun',
    difficulty: 3,
    purpose: 'Use stun to slide CB sideways after a cut.',
    setup: 'Half-ball cut; stun zone offline of the tangent.',
    attempts: 10,
    passNeed: 6,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Cut the 2 into TL. Stun so CB slides into the marked zone (near the natural tangent).',
    tip: 'Center / slight below • firm stun',
    xp: 110,
    skillEffects: { 'Cue-Ball Control': 6, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 60, y: 35 }, { id: 2, x: 35, y: 20 }],
      targetPocket: 'TL',
      zone: { x: 48, y: 32, r: 7 },
      arrows: [{ from: { x: 35, y: 20 }, to: { x: 46, y: 30 } }]
    }
  }),
  D({
    id: 'stun-2',
    name: 'Stun Run-Through Control',
    category: 'Stun',
    difficulty: 5,
    purpose: 'Distinguish stun slide from soft follow.',
    setup: 'Straight-ish cut; zone requires near-dead stun, not roll.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['stun-1', 'stop-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TR; CB must finish in the short stun zone — not past it.',
    tip: 'True stun • firm • abbreviated finish',
    xp: 130,
    skillEffects: { 'Cue-Ball Control': 6, 'Speed Control': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 38 }, { id: 6, x: 55, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 58, y: 30, r: 6.5 }
    }
  }),

  // ── Speed Control ────────────────────────────────────────
  D({
    id: 'speed-1',
    name: 'Lag Speed Ladder',
    category: 'Speed Control',
    difficulty: 2,
    purpose: 'Leave CB inside a soft landing zone without pocketing pressure.',
    setup: 'Cue ball on head string; send it to a foot-rail zone and stop.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'TOO HARD / TOO SOFT (OUTSIDE ZONE)', weight: 0.5 },
      { id: 'miss', label: 'SCRATCH OR WILD', weight: 0 }
    ],
    instructions: 'From the head string, roll the cue ball into the foot-end zone. No object ball. Count zone finishes only as full success.',
    tip: 'Center • pendulum stroke • feel the weight',
    xp: 90,
    skillEffects: { 'Speed Control': 8 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 25 }],
      zone: { x: 82, y: 25, r: 8 },
      arrows: [{ from: { x: 28, y: 25 }, to: { x: 75, y: 25 } }],
      targetPocket: null
    }
  }),
  D({
    id: 'speed-2',
    name: 'Soft Pocket Speed',
    category: 'Speed Control',
    difficulty: 3,
    purpose: 'Pocket without overrunning shape.',
    setup: 'Easy straight; CB must stay inside a near-OB zone after a soft make.',
    attempts: 10,
    passNeed: 7,
    prerequisites: ['speed-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Softly pocket the 1. CB should barely travel — finish in the zone around the contact point.',
    tip: 'Center • soft • quiet tip',
    xp: 100,
    skillEffects: { 'Speed Control': 6, 'Shot Making': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 30 }, { id: 1, x: 62, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 60, y: 20, r: 6 }
    }
  }),
  D({
    id: 'speed-3',
    name: 'Three-Speed Window',
    category: 'Speed Control',
    difficulty: 5,
    purpose: 'Hit the same shot at three intentional speeds into one zone family.',
    setup: 'Follow shot where only correct speed lands in zone.',
    attempts: 9,
    passNeed: 6,
    prerequisites: ['speed-2', 'follow-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket with follow. Only finishes inside the zone count full. Alternate soft / medium / firm attempts.',
    tip: 'Same aim • change only stroke length',
    xp: 130,
    skillEffects: { 'Speed Control': 8, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 24, y: 34 }, { id: 8, x: 48, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 70, y: 18, r: 7 }
    }
  }),

  // ── Cue-Ball Position ────────────────────────────────────
  D({
    id: 'cbpos-1',
    name: 'One-Zone Shape',
    category: 'Cue-Ball Position',
    difficulty: 3,
    purpose: 'Leave CB in a simple next-ball window.',
    setup: 'Pocket OB; land in zone for a natural next angle.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 2 into TR and leave CB in the center-right zone.',
    tip: 'Slight follow • medium • plan the leave before you shoot',
    xp: 110,
    skillEffects: { 'Position Play': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 38 }, { id: 2, x: 50, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 62, y: 32, r: 7 }
    }
  }),
  D({
    id: 'cbpos-2',
    name: 'Hold the Line',
    category: 'Cue-Ball Position',
    difficulty: 5,
    purpose: 'Avoid overrunning a narrow position corridor.',
    setup: 'Cut shot with a narrow rectangular-feeling zone near side rail.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cbpos-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Cut into TL; CB must settle in the side-rail zone without scratching.',
    tip: 'Stun-follow mix • trust the tangent',
    xp: 130,
    skillEffects: { 'Position Play': 7, 'Cue-Ball Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 55, y: 36 }, { id: 3, x: 28, y: 18 }],
      targetPocket: 'TL',
      zone: { x: 42, y: 40, r: 6.5 }
    }
  }),
  D({
    id: 'cbpos-3',
    name: 'Two-Zone Choice',
    category: 'Cue-Ball Position',
    difficulty: 6,
    purpose: 'Choose the correct side of the OB for shape.',
    setup: 'Shot allows two leaves; only the marked zone scores.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['cbpos-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into BR. Only the upper zone counts — finishing below it is a position miss.',
    tip: 'Inside english lightly or natural stun — pick one plan',
    xp: 150,
    skillEffects: { 'Position Play': 8 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 20 }, { id: 9, x: 60, y: 32 }],
      targetPocket: 'BR',
      zone: { x: 72, y: 18, r: 7 }
    }
  }),

  // ── Cut Shots ────────────────────────────────────────────
  D({
    id: 'cut-1',
    name: 'Quarter-Ball Cuts',
    category: 'Cut Shots',
    difficulty: 3,
    purpose: 'Consistent quarter-ball pocketing.',
    setup: 'Fixed quarter-ball geometry to the corner.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'binary',
    instructions: 'Cut the 5 into TR using the diagram angle. Reset precisely each time.',
    tip: 'Center ball • soft-medium • see the contact point',
    xp: 100,
    skillEffects: { 'Shot Making': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 40 }, { id: 5, x: 58, y: 22 }],
      targetPocket: 'TR',
      paths: [aimPath({ x: 35, y: 40 }, { x: 58, y: 22 }, { x: 97, y: 3 })]
    }
  }),
  D({
    id: 'cut-2',
    name: 'Half-Ball Accuracy',
    category: 'Cut Shots',
    difficulty: 4,
    purpose: 'Own the half-ball contact as a reference.',
    setup: 'Classic half-ball cut to side or corner.',
    attempts: 10,
    passNeed: 7,
    prerequisites: ['cut-1'],
    scoringType: 'binary',
    instructions: 'Half-ball cut the 6 into the top side pocket (TM).',
    tip: 'Center • aim ghost-ball center • trust it',
    xp: 110,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 38 }, { id: 6, x: 50, y: 22 }],
      targetPocket: 'TM',
      paths: [aimPath({ x: 28, y: 38 }, { x: 50, y: 22 }, { x: 50, y: 2 })]
    }
  }),
  D({
    id: 'cut-3',
    name: 'Wide Angle Cuts',
    category: 'Cut Shots',
    difficulty: 6,
    purpose: 'Make thin-ish cuts without deceleration.',
    setup: 'Wide cut to corner from near the rail.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cut-2'],
    scoringType: 'binary',
    instructions: 'Wide-cut the 1 into TL. Commit — no last-second steering.',
    tip: 'Soft center • full follow-through',
    xp: 140,
    skillEffects: { 'Shot Making': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 70, y: 40 }, { id: 1, x: 40, y: 16 }],
      targetPocket: 'TL'
    }
  }),
  D({
    id: 'cut-4',
    name: 'Rail Cut Floaters',
    category: 'Cut Shots',
    difficulty: 5,
    purpose: 'Cut balls near a rail without freezing up.',
    setup: 'OB near long rail; cut to corner.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cut-1'],
    scoringType: 'binary',
    instructions: 'Cut the rail-side 3 into BR. Keep a level cue.',
    tip: 'Center • medium • ignore the rail fear',
    xp: 120,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 28 }, { id: 3, x: 75, y: 42 }],
      targetPocket: 'BR'
    }
  }),

  // ── Rail Position ────────────────────────────────────────
  D({
    id: 'rail-1',
    name: 'Leave on the Rail',
    category: 'Rail Position',
    difficulty: 4,
    purpose: 'Park CB near a rail for the next shot.',
    setup: 'Pocket OB; target zone hugs the long rail.',
    attempts: 10,
    passNeed: 6,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TR and finish in the bottom-rail zone.',
    tip: 'Soft stun or slight draw • don’t overspin',
    xp: 120,
    skillEffects: { 'Position Play': 5, 'Cue-Ball Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 30 }, { id: 2, x: 55, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 60, y: 42, r: 7 }
    }
  }),
  D({
    id: 'rail-2',
    name: 'Off the Rail Comeback',
    category: 'Rail Position',
    difficulty: 5,
    purpose: 'Play CB off one rail into a center zone.',
    setup: 'Natural one-rail route into zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['rail-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TL; send CB off the bottom rail into the center zone.',
    tip: 'Running english lightly • medium speed',
    xp: 140,
    skillEffects: { 'Position Play': 6, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 55, y: 32 }, { id: 4, x: 28, y: 16 }],
      targetPocket: 'TL',
      zone: { x: 50, y: 25, r: 7 },
      arrows: [{ from: { x: 28, y: 16 }, to: { x: 48, y: 42 } }, { from: { x: 48, y: 42 }, to: { x: 50, y: 28 } }]
    }
  }),

  // ── Pattern Play ─────────────────────────────────────────
  D({
    id: 'pattern-1',
    name: 'Two-Ball Pattern',
    category: 'Pattern Play',
    difficulty: 3,
    purpose: 'Plan leave from ball A to ball B.',
    setup: 'Two object balls; pocket first with zone that sets up second.',
    attempts: 8,
    passNeed: 5,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 1 into TR. Land in the zone that gives a natural line on the 2 into BR. (You do not shoot the 2 in this drill.)',
    tip: 'Think two shots ahead • soft follow',
    xp: 120,
    skillEffects: { 'Pattern Play': 7, 'Position Play': 4 },
    diagram: {
      balls: [
        { id: 'cue', x: 20, y: 36 },
        { id: 1, x: 48, y: 20 },
        { id: 2, x: 78, y: 38 }
      ],
      targetPocket: 'TR',
      zone: { x: 58, y: 30, r: 7 }
    }
  }),
  D({
    id: 'pattern-2',
    name: 'Three-Ball Sequence Map',
    category: 'Pattern Play',
    difficulty: 5,
    purpose: 'Identify the key ball and correct first leave.',
    setup: 'Three balls; only first shot scored with shape zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['pattern-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket the 1. Zone sets you for 2 then 3 as marked. Call your pattern before shooting.',
    tip: 'Key ball first in your head • then cue ball path',
    xp: 140,
    skillEffects: { 'Pattern Play': 8 },
    diagram: {
      balls: [
        { id: 'cue', x: 18, y: 40 },
        { id: 1, x: 42, y: 22 },
        { id: 2, x: 65, y: 35 },
        { id: 3, x: 85, y: 12 }
      ],
      targetPocket: 'TR',
      zone: { x: 50, y: 32, r: 7 }
    }
  }),
  D({
    id: 'pattern-3',
    name: 'Avoid the Trap Angle',
    category: 'Pattern Play',
    difficulty: 6,
    purpose: 'Refuse the easy leave that dies on the next ball.',
    setup: 'Tempting wrong side vs correct zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['pattern-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket 1 into TM. Only the high-side zone keeps the 2 makeable — low side is a trap.',
    tip: 'Position > highlight reel pocket speed',
    xp: 150,
    skillEffects: { 'Pattern Play': 7, 'Position Play': 5 },
    diagram: {
      balls: [
        { id: 'cue', x: 30, y: 38 },
        { id: 1, x: 50, y: 22 },
        { id: 2, x: 78, y: 28 }
      ],
      targetPocket: 'TM',
      zone: { x: 42, y: 18, r: 6.5 }
    }
  }),

  // ── Banks ────────────────────────────────────────────────
  D({
    id: 'bank-1',
    name: 'Cross-Corner Bank',
    category: 'Banks',
    difficulty: 4,
    purpose: 'Bank OB cross-corner with center ball.',
    setup: 'Classic cross-corner bank geometry.',
    attempts: 10,
    passNeed: 5,
    scoringType: 'binary',
    instructions: 'Bank the 5 cross-corner into BR. Same speed every attempt once you find it.',
    tip: 'Center ball • medium • mirror the diamonds',
    xp: 120,
    skillEffects: { Banks: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 38 }, { id: 5, x: 48, y: 22 }],
      targetPocket: 'BR',
      paths: [
        {
          points: [
            { x: 25, y: 38 },
            { x: 48, y: 22 },
            { x: 72, y: 3 },
            { x: 96, y: 46 }
          ]
        }
      ]
    }
  }),
  D({
    id: 'bank-2',
    name: 'Cross-Side Bank',
    category: 'Banks',
    difficulty: 5,
    purpose: 'Bank into the opposite side pocket.',
    setup: 'Cross-side into BM or TM.',
    attempts: 10,
    passNeed: 5,
    prerequisites: ['bank-1'],
    scoringType: 'binary',
    instructions: 'Bank the 3 into BM. Track where you miss and adjust one diamond at a time.',
    tip: 'Center • consistent speed beats fancy english',
    xp: 130,
    skillEffects: { Banks: 7 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 20 }, { id: 3, x: 50, y: 28 }],
      targetPocket: 'BM',
      paths: [
        {
          points: [
            { x: 22, y: 20 },
            { x: 50, y: 28 },
            { x: 78, y: 48 },
            { x: 50, y: 48 }
          ]
        }
      ]
    }
  }),
  D({
    id: 'bank-3',
    name: 'Short Rail Bank',
    category: 'Banks',
    difficulty: 6,
    purpose: 'Short-rail banks under control.',
    setup: 'OB near short rail; bank to near corner.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['bank-2'],
    scoringType: 'binary',
    instructions: 'Bank the 2 short-rail into TL.',
    tip: 'Softer than you think • center face',
    xp: 150,
    skillEffects: { Banks: 7, 'Shot Making': 2 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 30 }, { id: 2, x: 85, y: 25 }],
      targetPocket: 'TL'
    }
  }),

  // ── Kicks ────────────────────────────────────────────────
  D({
    id: 'kick-1',
    name: 'One-Rail Kick Contact',
    category: 'Kicks',
    difficulty: 3,
    purpose: 'Make legal first contact via one rail.',
    setup: 'OB frozen or near rail; kick path shown.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'binary',
    instructions: 'Kick one rail to contact the 6. Pocketing not required — first contact counts.',
    tip: 'Diamond system • medium • center ball',
    xp: 110,
    skillEffects: { Kicks: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 20, y: 38 }, { id: 6, x: 78, y: 14 }],
      targetPocket: 'TM',
      paths: [
        {
          points: [
            { x: 20, y: 38 },
            { x: 50, y: 3 },
            { x: 78, y: 14 }
          ],
          color: '#ffc75b'
        }
      ]
    }
  }),
  D({
    id: 'kick-2',
    name: 'Two-Rail Kick Line',
    category: 'Kicks',
    difficulty: 6,
    purpose: 'Track a simple two-rail kick to contact.',
    setup: 'Two-rail path to OB.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['kick-1'],
    scoringType: 'binary',
    instructions: 'Two-rail kick to contact the 4. Contact = success.',
    tip: 'Same speed every try • note the second-rail mark',
    xp: 150,
    skillEffects: { Kicks: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 22 }, { id: 4, x: 70, y: 36 }],
      paths: [
        {
          points: [
            { x: 22, y: 22 },
            { x: 50, y: 3 },
            { x: 96, y: 25 },
            { x: 70, y: 36 }
          ],
          color: '#ffc75b'
        }
      ]
    }
  }),
  D({
    id: 'kick-3',
    name: 'Kick to Pocket',
    category: 'Kicks',
    difficulty: 7,
    purpose: 'Kick the OB into a called pocket.',
    setup: 'One-rail kick that also pockets.',
    attempts: 8,
    passNeed: 3,
    prerequisites: ['kick-2'],
    scoringType: 'binary',
    instructions: 'Kick the 8 into TR off one rail. Made ball required.',
    tip: 'Commit to a diamond • don’t steer mid-stroke',
    xp: 170,
    skillEffects: { Kicks: 7, Banks: 3 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 40 }, { id: 8, x: 55, y: 28 }],
      targetPocket: 'TR'
    }
  }),

  // ── Safeties ─────────────────────────────────────────────
  D({
    id: 'safe-1',
    name: 'Distance Safety',
    category: 'Safeties',
    difficulty: 3,
    purpose: 'Hide CB distance while contacting OB legally.',
    setup: 'Thin contact; CB finishes in far zone, OB near rail.',
    attempts: 10,
    passNeed: 6,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'LEGAL HIT BUT BAD LEAVE', weight: 0.5 },
      { id: 'miss', label: 'FOUL / NO CONTACT', weight: 0 }
    ],
    instructions: 'Thin the 2 legally and roll CB into the distant head-string zone. Do not pocket the 2.',
    tip: 'Very soft • thin edge • think two cues of distance',
    xp: 120,
    skillEffects: { Safeties: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 55, y: 30 }, { id: 2, x: 70, y: 22 }],
      zone: { x: 18, y: 35, r: 8 },
      arrows: [{ from: { x: 55, y: 30 }, to: { x: 22, y: 34 } }]
    }
  }),
  D({
    id: 'safe-2',
    name: 'One-Rail Hide',
    category: 'Safeties',
    difficulty: 5,
    purpose: 'Use a rail to hide CB behind a blocker concept (single OB).',
    setup: 'Send CB to rail zone while nudging OB to short rail.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['safe-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'LEGAL HIT BUT BAD LEAVE', weight: 0.5 },
      { id: 'miss', label: 'FOUL / NO CONTACT', weight: 0 }
    ],
    instructions: 'Legal contact; CB must finish in the bottom-rail hide zone. Pocketing OB fails the intent (score as pocketed/partial).',
    tip: 'Soft stun • plan the CB rail first',
    xp: 140,
    skillEffects: { Safeties: 7, 'Cue-Ball Control': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 25 }, { id: 5, x: 58, y: 20 }],
      zone: { x: 50, y: 44, r: 7 }
    }
  }),
  D({
    id: 'safe-3',
    name: 'Two-Way Shot Safety',
    category: 'Safeties',
    difficulty: 6,
    purpose: 'Shoot a makeable shot that still has a safe out.',
    setup: 'Aggressive cut with safety zone if you miss thin.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['safe-2', 'cut-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'MADE BALL (ALSO OK — COUNT FULL)', weight: 1 },
      { id: 'miss', label: 'OPEN TABLE / FOUL', weight: 0 }
    ],
    instructions: 'Try to cut the 3 into TL. If it misses, CB should still finish in the safe zone. Made ball OR safe zone = full success for this drill.',
    tip: 'Bias speed to the safe side of the miss',
    xp: 150,
    skillEffects: { Safeties: 6, 'Shot Making': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 60, y: 36 }, { id: 3, x: 32, y: 18 }],
      targetPocket: 'TL',
      zone: { x: 75, y: 40, r: 7 }
    }
  }),

  // ── Runouts ──────────────────────────────────────────────
  D({
    id: 'run-1',
    name: 'Three-Ball Runout',
    category: 'Runouts',
    difficulty: 4,
    purpose: 'Clear a simple 3-ball rack from ball in hand.',
    setup: 'Place 1, 2, 8 as diagrammed; ball in hand behind head string to start.',
    attempts: 6,
    passNeed: 4,
    scoringType: 'binary',
    instructions: 'From ball in hand, run 1–2–8 without a miss. Any miss ends the attempt as FAIL. Success = full clear.',
    tip: 'Simple pattern • never risk the 8 early',
    xp: 140,
    skillEffects: { 'Pattern Play': 6, 'Shot Making': 4 },
    prerequisites: ['pattern-1', 'sm-straight-1'],
    diagram: {
      balls: [
        { id: 'cue', x: 22, y: 25 },
        { id: 1, x: 45, y: 20 },
        { id: 2, x: 62, y: 35 },
        { id: 8, x: 80, y: 15 }
      ],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'run-2',
    name: 'Five-Ball Runout',
    category: 'Runouts',
    difficulty: 6,
    purpose: 'Manage a denser 5-ball layout.',
    setup: 'Five balls as shown; BIH behind head string.',
    attempts: 5,
    passNeed: 3,
    prerequisites: ['run-1', 'pattern-2'],
    scoringType: 'binary',
    instructions: 'Clear all five without a miss. Plan the 8 (or last ball) before you shoot the first.',
    tip: 'Key ball • stay on the high-percentage side',
    xp: 180,
    skillEffects: { 'Pattern Play': 8, 'Position Play': 5 },
    diagram: {
      balls: [
        { id: 'cue', x: 20, y: 28 },
        { id: 1, x: 40, y: 18 },
        { id: 2, x: 52, y: 32 },
        { id: 3, x: 68, y: 16 },
        { id: 4, x: 75, y: 38 },
        { id: 8, x: 88, y: 22 }
      ],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'run-3',
    name: 'Pressure 8 Finish',
    category: 'Runouts',
    difficulty: 5,
    purpose: 'Finish the 8 under a locked shape requirement.',
    setup: 'Last two balls; must shape from 2 to 8 zone then call make.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['cbpos-1', 'sm-hanging-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — SHAPE ON 8 (IN ZONE)', weight: 1 },
      { id: 'pocketed', label: 'MADE 2 BUT BAD 8 ANGLE', weight: 0.5 },
      { id: 'miss', label: 'MISSED 2', weight: 0 }
    ],
    instructions: 'Pocket the 2 into BR and land in the zone for a straightish 8 into TR. (Pocketing the 8 is practice after the scored shot.)',
    tip: 'Die the speed on the 2 • straight 8 is free',
    xp: 150,
    skillEffects: { 'Pattern Play': 5, 'Position Play': 6 },
    diagram: {
      balls: [
        { id: 'cue', x: 30, y: 20 },
        { id: 2, x: 55, y: 35 },
        { id: 8, x: 82, y: 12 }
      ],
      targetPocket: 'BR',
      zone: { x: 68, y: 28, r: 7 }
    }
  }),

  // Extra progressive drills to exceed 40 and fill gaps
  D({
    id: 'sm-side-pocket',
    name: 'Side Pocket Straights',
    category: 'Shot Making',
    difficulty: 2,
    purpose: 'Trust the side pocket on straight-ish lines.',
    setup: 'OB center; CB for side pocket.',
    attempts: 10,
    passNeed: 8,
    scoringType: 'binary',
    instructions: 'Pocket the 2 into TM. Reset every shot.',
    tip: 'Center • medium • don’t peek',
    xp: 90,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 50, y: 40 }, { id: 2, x: 50, y: 22 }],
      targetPocket: 'TM'
    }
  }),
  D({
    id: 'follow-rail-catch',
    name: 'Follow Catch on Rail',
    category: 'Follow',
    difficulty: 5,
    purpose: 'Follow into a rail-side window.',
    setup: 'Follow zone along long rail.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['follow-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into TR; follow into the right-rail zone.',
    tip: '¾ tip high • don’t over-hit',
    xp: 125,
    skillEffects: { 'Position Play': 5, 'Cue-Ball Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 32 }, { id: 6, x: 55, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 88, y: 28, r: 7 }
    }
  }),
  D({
    id: 'draw-angle',
    name: 'Draw with Angle',
    category: 'Draw',
    difficulty: 6,
    purpose: 'Draw while cutting — control both pocket and path.',
    setup: 'Cut + draw into zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['draw-1', 'cut-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Cut the 4 into TL and draw CB into the center-left zone.',
    tip: 'Low tip • don’t lose the cut line',
    xp: 145,
    skillEffects: { 'Cue-Ball Control': 6, 'Shot Making': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 58, y: 36 }, { id: 4, x: 35, y: 20 }],
      targetPocket: 'TL',
      zone: { x: 40, y: 32, r: 7 }
    }
  }),
  D({
    id: 'stun-rail',
    name: 'Stun Off Rail Line',
    category: 'Stun',
    difficulty: 6,
    purpose: 'Stun along a line that kisses toward a rail zone.',
    setup: 'Stun cut; zone near opposite rail.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['stun-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Stun-cut into TR; CB slides to the bottom-rail zone.',
    tip: 'Pure stun • firm • watch the tangent',
    xp: 145,
    skillEffects: { 'Cue-Ball Control': 6, 'Position Play': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 28 }, { id: 7, x: 55, y: 16 }],
      targetPocket: 'TR',
      zone: { x: 48, y: 42, r: 7 }
    }
  }),
  D({
    id: 'speed-rail-lag',
    name: 'Rail Lag Touch',
    category: 'Speed Control',
    difficulty: 4,
    purpose: 'Lag CB to a rail zone after contacting OB softly.',
    setup: 'Soft stun/follow into rail zone.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['speed-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket into BM; CB finishes in the head-rail-side zone.',
    tip: 'Touch speed • center',
    xp: 115,
    skillEffects: { 'Speed Control': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 50, y: 18 }, { id: 1, x: 50, y: 32 }],
      targetPocket: 'BM',
      zone: { x: 22, y: 12, r: 7 }
    }
  }),
  D({
    id: 'cbpos-keyball',
    name: 'Key-Ball Window',
    category: 'Cue-Ball Position',
    difficulty: 7,
    purpose: 'Leave a precise window on the key ball.',
    setup: 'Shape zone is small near the key ball.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['cbpos-3', 'pattern-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
      { id: 'miss', label: 'MISSED SHOT', weight: 0 }
    ],
    instructions: 'Pocket 1 into TR into the tight zone for the 8.',
    tip: 'Under-hit beats overhit here',
    xp: 170,
    skillEffects: { 'Position Play': 8, 'Pattern Play': 4 },
    diagram: {
      balls: [
        { id: 'cue', x: 22, y: 36 },
        { id: 1, x: 48, y: 20 },
        { id: 8, x: 82, y: 40 }
      ],
      targetPocket: 'TR',
      zone: { x: 70, y: 28, r: 5.5 }
    }
  }),
  D({
    id: 'rail-frozen',
    name: 'Frozen Rail Shot',
    category: 'Rail Position',
    difficulty: 6,
    purpose: 'Pocket a near-frozen rail ball cleanly.',
    setup: 'OB near-frozen on long rail.',
    attempts: 10,
    passNeed: 6,
    scoringType: 'binary',
    instructions: 'Pocket the rail 5 into BR. Keep cue level; avoid double-kiss panic.',
    tip: 'Aim slightly out • soft-medium',
    xp: 135,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 45, y: 22 }, { id: 5, x: 80, y: 45 }],
      targetPocket: 'BR'
    }
  }),
  D({
    id: 'bank-speed',
    name: 'Bank Speed Consistency',
    category: 'Banks',
    difficulty: 7,
    purpose: 'Same bank line at match speed.',
    setup: 'Repeat bank-1 geometry under firmer pace.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['bank-1'],
    scoringType: 'binary',
    instructions: 'Cross-corner bank the 5 into BR at a firm match speed. No baby hits.',
    tip: 'Firm center • one speed for the set',
    xp: 160,
    skillEffects: { Banks: 6, 'Speed Control': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 24, y: 36 }, { id: 5, x: 50, y: 24 }],
      targetPocket: 'BR'
    }
  }),
  D({
    id: 'safe-freeze',
    name: 'Freeze Safety Idea',
    category: 'Safeties',
    difficulty: 7,
    purpose: 'Roll to a near-freeze on OB or rail.',
    setup: 'Soft roll to finish in zone touching/near OB line.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['safe-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'LEGAL BUT NOT FROZEN WINDOW', weight: 0.5 },
      { id: 'miss', label: 'FOUL / OPEN HIT', weight: 0 }
    ],
    instructions: 'Contact the 2 softly and finish CB in the freeze window zone beside it.',
    tip: 'Feather speed • center',
    xp: 160,
    skillEffects: { Safeties: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 30 }, { id: 2, x: 60, y: 25 }],
      zone: { x: 56, y: 28, r: 5 }
    }
  }),
  D({
    id: 'run-bi-h-clear',
    name: 'BIH Clear Ladder',
    category: 'Runouts',
    difficulty: 7,
    purpose: 'From BIH, clear a messy middle layout.',
    setup: 'Six balls; BIH; no miss allowed per attempt.',
    attempts: 4,
    passNeed: 2,
    prerequisites: ['run-2'],
    scoringType: 'binary',
    instructions: 'Ball in hand. Clear all six balls. Any miss = attempt failed.',
    tip: 'Break the cluster early with an easy ball',
    xp: 200,
    skillEffects: { 'Pattern Play': 9, 'Shot Making': 4 },
    diagram: {
      balls: [
        { id: 'cue', x: 18, y: 25 },
        { id: 1, x: 38, y: 18 },
        { id: 2, x: 48, y: 30 },
        { id: 3, x: 58, y: 16 },
        { id: 4, x: 66, y: 36 },
        { id: 5, x: 78, y: 22 },
        { id: 8, x: 88, y: 40 }
      ],
      targetPocket: 'TR'
    }
  })
];

// Merge expanded popular-practice pack
export const drills = [...baseDrills, ...extraDrills];

export function getDrillById(id) {
  return drills.find((d) => d.id === id) || null;
}

export function drillsByCategory() {
  const map = {};
  for (const c of CATEGORIES) map[c] = [];
  for (const d of drills) {
    if (!map[d.category]) map[d.category] = [];
    map[d.category].push(d);
  }
  return map;
}

export function isDrillUnlocked(drill, state) {
  if (!drill.prerequisites || !drill.prerequisites.length) return true;
  return drill.prerequisites.every((pid) => state.results[pid]?.passed);
}

export function renderDrillMini(drill, compact = true) {
  return renderTableDiagram(drill.diagram || { balls: [] }, {
    compact,
    className: compact ? 'table-diagram mini' : 'table-diagram'
  });
}

export default drills;
