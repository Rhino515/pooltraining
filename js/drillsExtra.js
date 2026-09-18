/**
 * Expanded popular-practice curriculum (original names/instructions).
 * Merged into drills.js — keep IDs unique.
 */
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

const POS = [
  { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
  { id: 'pocketed', label: 'POCKETED BUT MISSED POSITION', weight: 0.5 },
  { id: 'miss', label: 'MISSED SHOT', weight: 0 }
];

function aim(a, b, c) {
  return { points: [a, b, c], dashed: true };
}

export const extraDrills = [
  // ── Shot Making ladders ──────────────────────────────────
  D({
    id: 'sm-short-straight',
    name: 'Short Straight Pocketing I',
    category: 'Shot Making',
    difficulty: 1,
    purpose: 'Own easy short straights at soft speed.',
    setup: 'OB one diamond from corner; CB close on the line.',
    attempts: 12,
    passNeed: 11,
    instructions: 'Pocket the 1 short-straight into TR. Soft speed only. Reset every shot.',
    tip: 'Center · soft · quiet eyes',
    xp: 70,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 70, y: 18 }, { id: 1, x: 85, y: 10 }],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'sm-medium-straight',
    name: 'Medium Straight Pocketing II',
    category: 'Shot Making',
    difficulty: 2,
    purpose: 'Bridge the gap between short and long straights.',
    setup: 'Mid-table straight into the corner.',
    attempts: 10,
    passNeed: 8,
    prerequisites: ['sm-short-straight'],
    instructions: 'Pocket the 2 medium-straight into TR. Same layout every attempt.',
    tip: 'Center · medium · stay down',
    xp: 90,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 32 }, { id: 2, x: 62, y: 18 }],
      targetPocket: 'TR',
      paths: [aim({ x: 35, y: 32 }, { x: 62, y: 18 }, { x: 97, y: 3 })]
    }
  }),
  D({
    id: 'sm-long-straight',
    name: 'Long Straight Pocketing III',
    category: 'Shot Making',
    difficulty: 5,
    purpose: 'Hold the line on full-table straights.',
    setup: 'Near head string to far corner.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['sm-medium-straight', 'sm-straight-2'],
    instructions: 'Long straight the 3 into BR. No body english — trust the tip.',
    tip: 'Center · soft-medium · full follow-through',
    xp: 130,
    skillEffects: { 'Shot Making': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 18, y: 12 }, { id: 3, x: 72, y: 38 }],
      targetPocket: 'BR'
    }
  }),
  D({
    id: 'sm-center-table',
    name: 'Center-Table Window Shots',
    category: 'Shot Making',
    difficulty: 3,
    purpose: 'Pocket from open center without a rail reference.',
    setup: 'Both balls in open center; cut/straight mix into TM.',
    attempts: 10,
    passNeed: 7,
    instructions: 'Pocket the 4 into the top side. Center-table aim only — no rail to lean on.',
    tip: 'See contact point · medium',
    xp: 100,
    skillEffects: { 'Shot Making': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 38, y: 32 }, { id: 4, x: 52, y: 22 }],
      targetPocket: 'TM'
    }
  }),
  D({
    id: 'sm-long-rail',
    name: 'Long-Rail Parallel Shots',
    category: 'Shot Making',
    difficulty: 4,
    purpose: 'Shoot along the long rail without freezing up.',
    setup: 'OB near long rail; CB parallel-ish to BR.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['sm-hanging-1'],
    instructions: 'Pocket the rail-side 5 into BR. Keep cue level over the rail.',
    tip: 'Center · don’t elevate · soft-medium',
    xp: 115,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 42 }, { id: 5, x: 72, y: 44 }],
      targetPocket: 'BR'
    }
  }),
  D({
    id: 'sm-combo-intro',
    name: 'Simple Combo Intro',
    category: 'Shot Making',
    difficulty: 4,
    purpose: 'Learn a dead combo line without overcomplicating.',
    setup: '1 frozen-ish on 2 line into corner; CB easy.',
    attempts: 8,
    passNeed: 5,
    instructions: 'Combo the 1 into the 2 so the 2 goes TR. Both must be legal; count success when 2 is pocketed.',
    tip: 'Aim the 1 as if pocketing into the 2 · soft',
    xp: 120,
    skillEffects: { 'Shot Making': 5, 'Pattern Play': 3 },
    diagram: {
      balls: [
        { id: 'cue', x: 25, y: 35 },
        { id: 1, x: 48, y: 28 },
        { id: 2, x: 70, y: 16 }
      ],
      targetPocket: 'TR',
      paths: [aim({ x: 25, y: 35 }, { x: 48, y: 28 }, { x: 70, y: 16 })]
    }
  }),
  D({
    id: 'sm-frozen-ob',
    name: 'Near-Frozen Object Ball',
    category: 'Shot Making',
    difficulty: 5,
    purpose: 'Pocket nearly frozen rail balls cleanly.',
    setup: 'OB nearly frozen on long rail near corner.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['rail-frozen'],
    instructions: 'Pocket the near-frozen 6 into TR. Avoid the double-kiss panic — soft commit.',
    tip: 'Aim slightly out · soft · level cue',
    xp: 125,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 50, y: 28 }, { id: 6, x: 92, y: 8 }],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'sm-progressive-set',
    name: 'Progressive Straight Set',
    category: 'Shot Making',
    difficulty: 4,
    purpose: 'Popular straight ladder: short → mid → long in one session.',
    setup: 'Three marked distances; rotate attempts 1–2 short, 3–6 mid, 7–10 long.',
    attempts: 10,
    passNeed: 7,
    prerequisites: ['sm-medium-straight'],
    instructions: 'Attempts 1–2: short straight TR. 3–6: medium. 7–10: long. Count each make. Use diagram mid layout as the default reset, adjust distance by feel for short/long.',
    tip: 'Same stroke tempo · only change distance',
    xp: 130,
    skillEffects: { 'Shot Making': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 30 }, { id: 1, x: 58, y: 18 }],
      targetPocket: 'TR'
    }
  }),

  // ── Stop ladder extensions ───────────────────────────────
  D({
    id: 'stop-short',
    name: 'Stop Shot Short I',
    category: 'Stop Shots',
    difficulty: 1,
    purpose: 'Dead stop on a one-diamond gap.',
    setup: 'Very short CB–OB gap, straight to corner.',
    attempts: 10,
    passNeed: 8,
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket and stop inside the zone at the OB start.',
    tip: 'Firm center stun · short stroke',
    xp: 80,
    skillEffects: { 'Cue-Ball Control': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 45, y: 28 }, { id: 2, x: 62, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 62, y: 18, r: 5.5 }
    }
  }),
  D({
    id: 'stop-long-iv',
    name: 'Stop Shot Distance IV',
    category: 'Stop Shots',
    difficulty: 7,
    purpose: 'Hold stop on near table-length stun.',
    setup: 'Long stun line into far corner.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['stop-3'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Long stop into TR. Full CB must finish in the OB zone.',
    tip: 'True stun · compact · no scoop',
    xp: 160,
    skillEffects: { 'Cue-Ball Control': 8, 'Speed Control': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 12, y: 42 }, { id: 5, x: 75, y: 12 }],
      targetPocket: 'TR',
      zone: { x: 75, y: 12, r: 7 }
    }
  }),

  // ── Stun extensions ──────────────────────────────────────
  D({
    id: 'stun-through',
    name: 'Stun Through I',
    category: 'Stun',
    difficulty: 4,
    purpose: 'Slide CB through the contact line into a forward zone.',
    setup: 'Slight angle; stun-through zone past OB.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['stun-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; stun through so CB finishes in the forward zone (not a soft roll-off).',
    tip: 'Firm center · abbreviated finish',
    xp: 120,
    skillEffects: { 'Cue-Ball Control': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 36 }, { id: 3, x: 52, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 62, y: 28, r: 6.5 },
      arrows: [{ from: { x: 52, y: 22 }, to: { x: 60, y: 27 } }]
    }
  }),
  D({
    id: 'stun-side',
    name: 'Stun to Side II',
    category: 'Stun',
    difficulty: 5,
    purpose: 'Use stun to send CB to a side-rail window.',
    setup: 'Half-ball cut; side zone on long rail.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['stun-through'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Cut into TL; stun CB into the right-side zone.',
    tip: 'Watch the tangent line · firm stun',
    xp: 130,
    skillEffects: { 'Cue-Ball Control': 6, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 55, y: 36 }, { id: 4, x: 32, y: 18 }],
      targetPocket: 'TL',
      zone: { x: 88, y: 30, r: 7 }
    }
  }),

  // ── Follow extensions ────────────────────────────────────
  D({
    id: 'follow-soft',
    name: 'Soft Follow I',
    category: 'Follow',
    difficulty: 2,
    purpose: 'Inch the CB forward with soft roll.',
    setup: 'Short straight; small zone just past OB.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Soft pocket into TR; CB rolls only into the near follow zone.',
    tip: '½ tip high · soft · don’t force',
    xp: 90,
    skillEffects: { 'Cue-Ball Control': 5, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 32 }, { id: 3, x: 58, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 68, y: 14, r: 5.5 }
    }
  }),
  D({
    id: 'follow-firm',
    name: 'Firm Follow II',
    category: 'Follow',
    difficulty: 4,
    purpose: 'Cover distance with firm follow without scratching.',
    setup: 'Straight follow into a deep forward zone.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['follow-soft', 'follow-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Firm follow into TR; land in the deep zone near the foot rail.',
    tip: '1 tip high · firm-medium · smooth',
    xp: 120,
    skillEffects: { 'Cue-Ball Control': 5, 'Speed Control': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 34 }, { id: 6, x: 48, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 82, y: 18, r: 7 }
    }
  }),
  D({
    id: 'follow-around',
    name: 'Follow Around III',
    category: 'Follow',
    difficulty: 6,
    purpose: 'Follow with a mild turn toward a side zone.',
    setup: 'Slight cut + follow into opposite-side window.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['follow-firm', 'follow-2'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; CB follows around into the bottom-center zone.',
    tip: '¾ tip high · natural roll · light running if needed',
    xp: 145,
    skillEffects: { 'Position Play': 6, 'Cue-Ball Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 28 }, { id: 5, x: 52, y: 16 }],
      targetPocket: 'TR',
      zone: { x: 55, y: 38, r: 7 },
      arrows: [{ from: { x: 52, y: 16 }, to: { x: 55, y: 35 } }]
    }
  }),

  // ── Draw extensions ──────────────────────────────────────
  D({
    id: 'draw-short-i',
    name: 'Draw Short I',
    category: 'Draw',
    difficulty: 2,
    purpose: 'Pull CB a few inches with control.',
    setup: 'Close gap; small draw zone behind.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; short draw into the near zone.',
    tip: '1 tip low · smooth · level',
    xp: 95,
    skillEffects: { 'Cue-Ball Control': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 42, y: 30 }, { id: 4, x: 58, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 36, y: 34, r: 5.5 }
    }
  }),
  D({
    id: 'draw-medium-ii',
    name: 'Draw Medium II',
    category: 'Draw',
    difficulty: 4,
    purpose: 'Medium draw distance without losing the pocket.',
    setup: 'Medium gap; center-back zone.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['draw-short-i', 'draw-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Draw into the mid-table zone after pocketing TR.',
    tip: '1–1.5 tips low · accelerate',
    xp: 120,
    skillEffects: { 'Cue-Ball Control': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 38, y: 34 }, { id: 7, x: 60, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 32, y: 28, r: 7 }
    }
  }),
  D({
    id: 'draw-long-iii',
    name: 'Draw Long III',
    category: 'Draw',
    difficulty: 7,
    purpose: 'Long draw window under control.',
    setup: 'Longer gap; deep head-string zone.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['draw-medium-ii', 'draw-3'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Deep draw into the head-area zone. Pocket first — then distance.',
    tip: 'Low · accelerate · keep cue level',
    xp: 165,
    skillEffects: { 'Cue-Ball Control': 8 },
    diagram: {
      balls: [{ id: 'cue', x: 45, y: 30 }, { id: 5, x: 72, y: 14 }],
      targetPocket: 'TR',
      zone: { x: 16, y: 30, r: 8 }
    }
  }),
  D({
    id: 'draw-side-line',
    name: 'Draw to Side-Pocket Line',
    category: 'Draw',
    difficulty: 6,
    purpose: 'Draw CB onto a side-pocket shooting line.',
    setup: 'Cut/draw into a zone aligned with TM.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['draw-angle'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; draw onto the side-pocket line zone near center.',
    tip: 'Low tip · don’t lose aim line',
    xp: 145,
    skillEffects: { 'Cue-Ball Control': 6, 'Position Play': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 38 }, { id: 2, x: 55, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 50, y: 32, r: 6.5 }
    }
  }),
  D({
    id: 'draw-back-by-back',
    name: 'Back-by-Back Draw Zones',
    category: 'Draw',
    difficulty: 5,
    purpose: 'Stacked draw targets — land short then deep on alternating tries.',
    setup: 'Same shot; odd attempts = near zone, even = far zone (use near zone as scored target — judge deep by personal mark beyond it).',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['draw-medium-ii'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Odd attempts: draw into the marked near zone. Even attempts: draw past it toward the head string (still count full success if you clearly beat the near zone deep without scratching). Pocket required every time.',
    tip: 'Same aim · change only stroke length',
    xp: 140,
    skillEffects: { 'Cue-Ball Control': 7, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 32 }, { id: 6, x: 62, y: 18 }],
      targetPocket: 'TR',
      zone: { x: 30, y: 36, r: 6 }
    }
  }),

  // ── Speed Control extensions ─────────────────────────────
  D({
    id: 'speed-lag-rail',
    name: 'Lag to Rail',
    category: 'Speed Control',
    difficulty: 2,
    purpose: 'Lag CB to kiss the foot rail and settle nearby.',
    setup: 'CB on head string; target zone at foot rail.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'TOUCHED RAIL BUT OUT OF ZONE', weight: 0.5 },
      { id: 'miss', label: 'SCRATCH OR WILD', weight: 0 }
    ],
    instructions: 'From head string, lag to the foot-rail zone. No object ball.',
    tip: 'Center · pendulum · feel the weight',
    xp: 90,
    skillEffects: { 'Speed Control': 8 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 25 }],
      zone: { x: 90, y: 25, r: 7 },
      arrows: [{ from: { x: 28, y: 25 }, to: { x: 85, y: 25 } }]
    }
  }),
  D({
    id: 'speed-lag-diamond',
    name: 'Lag to Diamond Mark',
    category: 'Speed Control',
    difficulty: 3,
    purpose: 'Stop near a chosen diamond without a rail crash.',
    setup: 'Lag from head string to a mid-foot diamond zone.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['speed-lag-rail', 'speed-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Roll CB into the diamond zone near the foot end (not necessarily rail-tight).',
    tip: 'Center · softer than rail lag',
    xp: 100,
    skillEffects: { 'Speed Control': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 30 }],
      zone: { x: 78, y: 18, r: 7 }
    }
  }),
  D({
    id: 'speed-two-speed',
    name: 'Two-Speed Position Drill',
    category: 'Speed Control',
    difficulty: 5,
    purpose: 'Same pocket line, two intentional finish speeds.',
    setup: 'Follow shot; odd = soft zone, even = firm zone (one zone marked — alternate depth).',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['speed-3'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket with follow. Odd attempts: finish in the marked soft zone. Even: overrun it to a personal firmer mark past the zone without scratching — still require a pocket. Score full when you clearly hit the intended speed plan.',
    tip: 'Change only stroke length',
    xp: 135,
    skillEffects: { 'Speed Control': 8, 'Position Play': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 24, y: 34 }, { id: 1, x: 48, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 65, y: 16, r: 6.5 }
    }
  }),

  // ── CB Position / Rail ───────────────────────────────────
  D({
    id: 'cbpos-natural',
    name: 'Natural Angle Position',
    category: 'Cue-Ball Position',
    difficulty: 3,
    purpose: 'Use the natural tangent/follow path into shape.',
    setup: 'Mild cut; natural zone without english.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; land in the natural-angle zone with center-ball only.',
    tip: 'No english · trust the line',
    xp: 110,
    skillEffects: { 'Position Play': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 38 }, { id: 2, x: 52, y: 22 }],
      targetPocket: 'TR',
      zone: { x: 58, y: 34, r: 7 }
    }
  }),
  D({
    id: 'cbpos-hold',
    name: 'Hold / Kill English Intro',
    category: 'Cue-Ball Position',
    difficulty: 5,
    purpose: 'Light inside to shorten CB travel (intro only).',
    setup: 'Cut that overruns without a touch of hold.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cbpos-natural', 'cbpos-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Cut into TL. Use a hint of inside/hold so CB dies in the near zone — not past it.',
    tip: '¼ tip inside max · medium · don’t overspin',
    xp: 130,
    skillEffects: { 'Position Play': 6, 'Cue-Ball Control': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 58, y: 36 }, { id: 3, x: 32, y: 18 }],
      targetPocket: 'TL',
      zone: { x: 45, y: 30, r: 6.5 }
    }
  }),
  D({
    id: 'cbpos-opposite',
    name: 'Opposite Corner Shape Zone',
    category: 'Cue-Ball Position',
    difficulty: 6,
    purpose: 'Send CB toward opposite-corner shape.',
    setup: 'Pocket near corner; zone toward far opposite area.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['cbpos-2'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; finish in the opposite (bottom-left) shape zone.',
    tip: 'Plan rail use · controlled speed',
    xp: 145,
    skillEffects: { 'Position Play': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 22 }, { id: 6, x: 60, y: 14 }],
      targetPocket: 'TR',
      zone: { x: 22, y: 40, r: 7 }
    }
  }),
  D({
    id: 'rail-first-finish',
    name: 'Rail-First Position Finish',
    category: 'Rail Position',
    difficulty: 5,
    purpose: 'Bounce CB off a rail first, then settle in zone.',
    setup: 'Natural one-rail route into center zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['rail-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TR; CB must touch a rail before finishing in the center zone.',
    tip: 'Medium · running english light',
    xp: 135,
    skillEffects: { 'Position Play': 6, 'Speed Control': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 25, y: 30 }, { id: 4, x: 50, y: 16 }],
      targetPocket: 'TR',
      zone: { x: 48, y: 28, r: 7 },
      arrows: [
        { from: { x: 50, y: 16 }, to: { x: 70, y: 42 } },
        { from: { x: 70, y: 42 }, to: { x: 50, y: 30 } }
      ]
    }
  }),
  D({
    id: 'rail-center-park',
    name: 'Park Center off Rail',
    category: 'Rail Position',
    difficulty: 4,
    purpose: 'Leave CB centerish after a rail kiss.',
    setup: 'Side pocket shot; rail then center.',
    attempts: 10,
    passNeed: 6,
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket into TM; CB comes off a long rail into the center zone.',
    tip: 'Soft-medium · center face',
    xp: 120,
    skillEffects: { 'Position Play': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 35, y: 38 }, { id: 1, x: 50, y: 24 }],
      targetPocket: 'TM',
      zone: { x: 55, y: 28, r: 7 }
    }
  }),

  // ── Cut ladders ──────────────────────────────────────────
  D({
    id: 'cut-30',
    name: '30° Cut Ladder I',
    category: 'Cut Shots',
    difficulty: 3,
    purpose: 'Repeatable ~30° cut pocketing.',
    setup: 'Fixed ~30° geometry to corner.',
    attempts: 10,
    passNeed: 7,
    scoringType: 'binary',
    instructions: 'Cut the 5 into TR at the diagrammed ~30° angle. Reset exactly.',
    tip: 'Center · soft-medium · see the edge',
    xp: 105,
    skillEffects: { 'Shot Making': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 38, y: 38 }, { id: 5, x: 60, y: 20 }],
      targetPocket: 'TR',
      paths: [aim({ x: 38, y: 38 }, { x: 60, y: 20 }, { x: 97, y: 3 })]
    }
  }),
  D({
    id: 'cut-45',
    name: '45° Cut Ladder II',
    category: 'Cut Shots',
    difficulty: 5,
    purpose: 'Own the half-ball / ~45° reference.',
    setup: '~45° cut to corner.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cut-30', 'cut-2'],
    scoringType: 'binary',
    instructions: 'Cut the 6 into TL at ~45°. Same speed each attempt.',
    tip: 'Ghost ball · commit',
    xp: 125,
    skillEffects: { 'Shot Making': 7 },
    diagram: {
      balls: [{ id: 'cue', x: 62, y: 36 }, { id: 6, x: 35, y: 18 }],
      targetPocket: 'TL'
    }
  }),
  D({
    id: 'cut-thin-iii',
    name: 'Thin Cut Ladder III',
    category: 'Cut Shots',
    difficulty: 7,
    purpose: 'Very thin cuts without deceleration.',
    setup: 'Thin cut to corner from wide angle.',
    attempts: 10,
    passNeed: 5,
    prerequisites: ['cut-45', 'cut-3'],
    scoringType: 'binary',
    instructions: 'Thin-cut the 1 into TR. Soft speed; full stroke.',
    tip: 'See the thin edge · soft · follow through',
    xp: 155,
    skillEffects: { 'Shot Making': 8 },
    diagram: {
      balls: [{ id: 'cue', x: 28, y: 42 }, { id: 1, x: 55, y: 16 }],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'cut-stop',
    name: 'Cut + Stop',
    category: 'Cut Shots',
    difficulty: 5,
    purpose: 'Cut and hold stun near the contact.',
    setup: '30° cut with stop zone at OB.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cut-30', 'stop-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Cut into TR and stop/stun CB inside the zone.',
    tip: 'Firm stun · don’t add follow',
    xp: 130,
    skillEffects: { 'Shot Making': 4, 'Cue-Ball Control': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 36, y: 38 }, { id: 2, x: 58, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 58, y: 22, r: 6 }
    }
  }),
  D({
    id: 'cut-follow',
    name: 'Cut + Follow',
    category: 'Cut Shots',
    difficulty: 5,
    purpose: 'Cut while rolling forward into shape.',
    setup: 'Cut + follow zone past the tangent.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['cut-30', 'follow-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Cut into TR; follow into the marked zone.',
    tip: '½ tip high · medium',
    xp: 130,
    skillEffects: { 'Shot Making': 4, 'Position Play': 5 },
    diagram: {
      balls: [{ id: 'cue', x: 32, y: 38 }, { id: 3, x: 55, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 68, y: 28, r: 7 }
    }
  }),
  D({
    id: 'cut-draw',
    name: 'Cut + Draw',
    category: 'Cut Shots',
    difficulty: 6,
    purpose: 'Cut and draw CB back to a window.',
    setup: 'Cut + draw zone behind.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['cut-45', 'draw-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Cut into TL; draw into the center-left zone.',
    tip: 'Low tip · protect the cut line',
    xp: 145,
    skillEffects: { 'Shot Making': 4, 'Cue-Ball Control': 6 },
    diagram: {
      balls: [{ id: 'cue', x: 60, y: 36 }, { id: 4, x: 35, y: 18 }],
      targetPocket: 'TL',
      zone: { x: 48, y: 32, r: 7 }
    }
  }),

  // ── Pattern / Runout expansions ──────────────────────────
  D({
    id: 'pattern-4ball',
    name: 'Four-Ball Pattern Map',
    category: 'Pattern Play',
    difficulty: 6,
    purpose: 'Map a 4-ball route and nail the first leave.',
    setup: 'Four balls; score first shot shape only.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['pattern-2'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket 1 into TR into the zone that starts 2→3→8. Call the order aloud.',
    tip: 'Key ball before first stroke',
    xp: 150,
    skillEffects: { 'Pattern Play': 8 },
    diagram: {
      balls: [
        { id: 'cue', x: 18, y: 38 },
        { id: 1, x: 40, y: 20 },
        { id: 2, x: 58, y: 32 },
        { id: 3, x: 72, y: 14 },
        { id: 8, x: 88, y: 36 }
      ],
      targetPocket: 'TR',
      zone: { x: 48, y: 30, r: 7 }
    }
  }),
  D({
    id: 'pattern-key-ii',
    name: 'Key Ball Shape II',
    category: 'Pattern Play',
    difficulty: 5,
    purpose: 'Leave a precise key-ball angle for the 8.',
    setup: 'Last two; zone is the key-ball window.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['pattern-1', 'run-3'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Pocket 2 into BR; land in the key zone for a natural 8 into TR.',
    tip: 'Under-hit the 2',
    xp: 145,
    skillEffects: { 'Pattern Play': 6, 'Position Play': 5 },
    diagram: {
      balls: [
        { id: 'cue', x: 28, y: 18 },
        { id: 2, x: 52, y: 34 },
        { id: 8, x: 82, y: 14 }
      ],
      targetPocket: 'BR',
      zone: { x: 65, y: 26, r: 6 }
    }
  }),
  D({
    id: 'run-4ball',
    name: 'Four-Ball Runout',
    category: 'Runouts',
    difficulty: 5,
    purpose: 'Clear a 4-ball layout from BIH.',
    setup: '1–2–3–8 as diagrammed; BIH behind head string.',
    attempts: 6,
    passNeed: 3,
    prerequisites: ['run-1', 'pattern-1'],
    scoringType: 'binary',
    instructions: 'From BIH, clear all four without a miss. Any miss ends the attempt.',
    tip: 'Simple order · never early 8',
    xp: 160,
    skillEffects: { 'Pattern Play': 7, 'Shot Making': 3 },
    diagram: {
      balls: [
        { id: 'cue', x: 20, y: 25 },
        { id: 1, x: 42, y: 18 },
        { id: 2, x: 58, y: 34 },
        { id: 3, x: 72, y: 16 },
        { id: 8, x: 88, y: 30 }
      ],
      targetPocket: 'TR'
    }
  }),
  D({
    id: 'run-last3-8ball',
    name: 'Last-Three 8-Ball Pattern',
    category: 'Runouts',
    difficulty: 6,
    purpose: 'Original last-3 solids/stripes-style finish pattern.',
    setup: 'Three “your” balls + 8; BIH; must end on 8.',
    attempts: 5,
    passNeed: 3,
    prerequisites: ['run-4ball', 'pattern-3'],
    scoringType: 'binary',
    instructions: 'Clear 1, 2, 3 then 8. Miss or early 8 = fail. Plan the key ball before shooting.',
    tip: 'Key ball → 8 window first',
    xp: 175,
    skillEffects: { 'Pattern Play': 8, 'Position Play': 4 },
    diagram: {
      balls: [
        { id: 'cue', x: 18, y: 30 },
        { id: 1, x: 36, y: 16 },
        { id: 2, x: 50, y: 36 },
        { id: 3, x: 68, y: 20 },
        { id: 8, x: 85, y: 40 }
      ],
      targetPocket: 'BR'
    }
  }),
  D({
    id: 'run-ghost-mini',
    name: 'Ghost-Style Mini Runout',
    category: 'Runouts',
    difficulty: 4,
    purpose: 'Popular ghost practice: BIH, run a small rack, miss = ghost wins attempt.',
    setup: 'Three balls; BIH; one miss fails the attempt.',
    attempts: 6,
    passNeed: 4,
    prerequisites: ['run-1'],
    scoringType: 'binary',
    instructions: 'Ball in hand. Run all three. Treat each miss like losing a ghost rack — attempt fails.',
    tip: 'High-percentage first ball',
    xp: 140,
    skillEffects: { 'Pattern Play': 6, 'Shot Making': 4 },
    diagram: {
      balls: [
        { id: 'cue', x: 22, y: 28 },
        { id: 1, x: 48, y: 20 },
        { id: 2, x: 65, y: 36 },
        { id: 3, x: 82, y: 14 }
      ],
      targetPocket: 'TR'
    }
  }),

  // ── Banks expansions ─────────────────────────────────────
  D({
    id: 'bank-long-rail',
    name: 'Long-Rail Bank',
    category: 'Banks',
    difficulty: 6,
    purpose: 'Bank along / across using the long rail.',
    setup: 'Long-rail bank into near corner.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['bank-1'],
    scoringType: 'binary',
    instructions: 'Bank the 4 long-rail into TL. Keep one speed for the set.',
    tip: 'Center · medium · diamond mirror',
    xp: 150,
    skillEffects: { Banks: 7 },
    diagram: {
      balls: [{ id: 'cue', x: 70, y: 35 }, { id: 4, x: 55, y: 22 }],
      targetPocket: 'TL',
      paths: [
        {
          points: [
            { x: 70, y: 35 },
            { x: 55, y: 22 },
            { x: 30, y: 3 },
            { x: 4, y: 4 }
          ]
        }
      ]
    }
  }),
  D({
    id: 'bank-position',
    name: 'Bank + Simple Position',
    category: 'Banks',
    difficulty: 7,
    purpose: 'Make the bank and leave a basic CB zone.',
    setup: 'Cross-corner bank with a generous CB zone.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['bank-2', 'cbpos-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Bank the 5 into BR and finish CB in the center zone. Made bank outside zone = partial.',
    tip: 'Center face · don’t add fancy spin yet',
    xp: 170,
    skillEffects: { Banks: 6, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 24, y: 36 }, { id: 5, x: 48, y: 22 }],
      targetPocket: 'BR',
      zone: { x: 50, y: 32, r: 8 }
    }
  }),

  // ── Kicks expansions ─────────────────────────────────────
  D({
    id: 'kick-pocket-easy',
    name: 'Kick to Pocket I',
    category: 'Kicks',
    difficulty: 5,
    purpose: 'Easier one-rail kick that pockets.',
    setup: 'Friendly one-rail kick line into side/corner.',
    attempts: 8,
    passNeed: 4,
    prerequisites: ['kick-1'],
    scoringType: 'binary',
    instructions: 'One-rail kick the 2 into TM. Made ball required.',
    tip: 'Pick a diamond · medium · center',
    xp: 140,
    skillEffects: { Kicks: 7 },
    diagram: {
      balls: [{ id: 'cue', x: 22, y: 38 }, { id: 2, x: 58, y: 28 }],
      targetPocket: 'TM',
      paths: [
        {
          points: [
            { x: 22, y: 38 },
            { x: 40, y: 3 },
            { x: 58, y: 28 },
            { x: 50, y: 3 }
          ],
          color: '#ffc75b'
        }
      ]
    }
  }),
  D({
    id: 'kick-two-rail-ii',
    name: 'Two-Rail Kick II',
    category: 'Kicks',
    difficulty: 7,
    purpose: 'Harder two-rail contact after the intro.',
    setup: 'Longer two-rail path to OB.',
    attempts: 8,
    passNeed: 3,
    prerequisites: ['kick-2'],
    scoringType: 'binary',
    instructions: 'Two-rail kick to contact the 6. Contact = success.',
    tip: 'Same speed · note second-rail mark',
    xp: 165,
    skillEffects: { Kicks: 8 },
    diagram: {
      balls: [{ id: 'cue', x: 18, y: 18 }, { id: 6, x: 78, y: 38 }],
      paths: [
        {
          points: [
            { x: 18, y: 18 },
            { x: 55, y: 3 },
            { x: 96, y: 28 },
            { x: 78, y: 38 }
          ],
          color: '#ffc75b'
        }
      ]
    }
  }),

  // ── Safeties expansions ──────────────────────────────────
  D({
    id: 'safe-hide',
    name: 'Hide Behind Ball Safety',
    category: 'Safeties',
    difficulty: 4,
    purpose: 'Distance + hide concept using a single blocker line.',
    setup: 'Thin hit; CB to far zone “behind” OB line.',
    attempts: 10,
    passNeed: 6,
    prerequisites: ['safe-1'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'LEGAL HIT BUT BAD LEAVE', weight: 0.5 },
      { id: 'miss', label: 'FOUL / NO CONTACT', weight: 0 }
    ],
    instructions: 'Legal thin contact on the 3; CB finishes in the hide zone near the head rail. Do not pocket the 3.',
    tip: 'Feather thin · think distance first',
    xp: 125,
    skillEffects: { Safeties: 7 },
    diagram: {
      balls: [{ id: 'cue', x: 58, y: 28 }, { id: 3, x: 72, y: 20 }],
      zone: { x: 16, y: 38, r: 8 }
    }
  }),
  D({
    id: 'safe-one-rail',
    name: 'One-Rail Safety II',
    category: 'Safeties',
    difficulty: 5,
    purpose: 'Send CB to a rail hide after legal contact.',
    setup: 'Nudge OB; CB to rail zone.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['safe-2'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — IN TARGET ZONE', weight: 1 },
      { id: 'pocketed', label: 'LEGAL HIT BUT BAD LEAVE', weight: 0.5 },
      { id: 'miss', label: 'FOUL / NO CONTACT', weight: 0 }
    ],
    instructions: 'Legal contact; CB finishes in the long-rail hide zone.',
    tip: 'Soft stun · rail first in your mind',
    xp: 140,
    skillEffects: { Safeties: 7, 'Cue-Ball Control': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 40, y: 24 }, { id: 5, x: 55, y: 20 }],
      zone: { x: 88, y: 35, r: 7 }
    }
  }),
  D({
    id: 'safe-two-way-ii',
    name: 'Two-Way Decision Drill II',
    category: 'Safeties',
    difficulty: 7,
    purpose: 'Choose aggressiveness vs safe out on a tougher cut.',
    setup: 'Harder cut with a clear safe miss window.',
    attempts: 8,
    passNeed: 5,
    prerequisites: ['safe-3'],
    scoringType: 'position',
    outcomes: [
      { id: 'zone', label: 'SUCCESS — SAFE WINDOW / OR MAKE', weight: 1 },
      { id: 'pocketed', label: 'OPEN MISS (BAD)', weight: 0 },
      { id: 'miss', label: 'FOUL', weight: 0 }
    ],
    instructions: 'Try the cut to TL. A make counts full. A miss must leave CB in the safe zone — otherwise score miss/open.',
    tip: 'Bias speed to the safe side',
    xp: 160,
    skillEffects: { Safeties: 7, 'Shot Making': 3 },
    diagram: {
      balls: [{ id: 'cue', x: 65, y: 38 }, { id: 3, x: 30, y: 16 }],
      targetPocket: 'TL',
      zone: { x: 78, y: 42, r: 7 }
    }
  }),

  // ── CB control ladder (popular standard equivalent) ──────
  D({
    id: 'cb-control-ladder',
    name: 'Cue-Ball Control Ladder',
    category: 'Cue-Ball Position',
    difficulty: 4,
    purpose: 'Popular CB ladder: stop / follow / draw on one pocket line.',
    setup: 'Same straight pocket; rotate stop, follow, draw targets.',
    attempts: 9,
    passNeed: 6,
    prerequisites: ['stop-1', 'follow-1', 'draw-1'],
    scoringType: 'position',
    outcomes: POS,
    instructions: 'Attempts 1–3: stop in OB zone. 4–6: follow into far zone (use follow aim — land near foot). 7–9: draw into near head zone. Diagram shows stop zone; adjust CB finish target by attempt block.',
    tip: 'Same aim line · only change tip height & speed',
    xp: 140,
    skillEffects: { 'Cue-Ball Control': 8, 'Position Play': 4 },
    diagram: {
      balls: [{ id: 'cue', x: 30, y: 34 }, { id: 2, x: 55, y: 20 }],
      targetPocket: 'TR',
      zone: { x: 55, y: 20, r: 6 }
    }
  })
];
