/**
 * Writes the DEMO .pooliq example files in examples/ and validates every one with the app's own validator.
 *   node scripts/make-examples.mjs
 * All examples are clearly labelled DEMO and use simple geometric layouts (straight-in shots and a
 * mirror-reflection route). None of them is, or claims to be, an established training or kicking system.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validatePooliq, serialize } from '../js/content/schema.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const R = 1.125;
const r2 = (v) => Math.round(v * 100) / 100;
const P = (x, y) => ({ x: r2(x), y: r2(y) });
const POCKET = { TL: [-0.45, -0.45], TM: [50, -1.45], TR: [100.45, -0.45], BL: [-0.45, 50.45], BM: [50, 51.45], BR: [100.45, 50.45] };
const DEMO_NOTE = 'DEMO file for the Pool IQ .pooliq format — a simple geometric layout made to show how the app works. It is not an established drill or system.';
const header = (contentType, id, title, extra = {}) => ({ format: 'pooliq', schemaVersion: '1.0', contentType, id, contentVersion: '1.0', title, ...extra });
const meta = (tags = []) => ({ tags: ['demo', ...tags], created: '2026-09-25', language: 'en', demo: true, generator: 'Pool IQ examples' });

/** Straight-in shot: object ball at ob, cue ball `dist` behind it on the ball→pocket line */
function straightIn(n, ob, pocket, dist, { speed = 1.5, technique = 'stop', vTips = 0, follow = 0 } = {}) {
  const [px, py] = POCKET[pocket];
  const L = Math.hypot(px - ob[0], py - ob[1]);
  const d = [(px - ob[0]) / L, (py - ob[1]) / L];
  const cue = P(ob[0] - d[0] * dist, ob[1] - d[1] * dist);
  const ghost = P(ob[0] - d[0] * 2 * R, ob[1] - d[1] * 2 * R);
  const path = [cue, ghost];
  if (follow) path.push(P(ghost.x + d[0] * follow, ghost.y + d[1] * follow));
  return {
    kind: 'pot',
    cueBallPosition: cue,
    ballPositions: [{ n, x: ob[0], y: ob[1] }],
    targetBall: n,
    targetPocket: pocket,
    cueBallPath: path,
    contactIndex: 1,
    objectBallPaths: [{ n, points: [P(ob[0], ob[1]), P(px, py)] }],
    cueContact: { vTips, hTips: 0 },
    technique,
    speed
  };
}

/** Mirror-reflection route off one rail (angle in = angle out, no spin/speed/cushion effects — geometry only) */
function mirror(cue, ob, rail = 'top', n = 1) {
  const railY = rail === 'top' ? 0 : 50;
  const mirrored = [ob[0], 2 * railY - ob[1]];
  const t = (railY - cue[1]) / (mirrored[1] - cue[1]);
  const hit = P(cue[0] + (mirrored[0] - cue[0]) * t, railY);
  const L = Math.hypot(ob[0] - hit.x, ob[1] - hit.y);
  const ghost = P(ob[0] - ((ob[0] - hit.x) / L) * 2 * R, ob[1] - ((ob[1] - hit.y) / L) * 2 * R);
  return {
    shot: {
      kind: 'kick',
      cueBallPosition: P(...cue),
      ballPositions: [{ n, x: ob[0], y: ob[1] }],
      targetBall: n,
      cueBallPath: [P(...cue), hit, ghost],
      contactIndex: 2,
      railContacts: [{ x: hit.x, y: hit.y, rail, by: 'cue' }],
      cueContact: { vTips: 0, hTips: 0 },
      technique: 'kick',
      speed: 2,
      route: { rails: 1, text: `1 rail (${rail})`, short: '1 RAIL' }
    },
    diamond: r2(hit.x / 12.5)
  };
}

const files = {};

// 1. Single drill -----------------------------------------------------------------------------
{
  const shot = straightIn(1, [50, 12.5], 'TM', 22.5, { speed: 1.5, technique: 'stop', vTips: -0.25 });
  files['demo-single-drill.pooliq'] = {
    ...header('drill', 'demo-straight-in-stop', 'DEMO · Straight-In Stop Shot', {
      description: `${DEMO_NOTE} Pocket the 1 straight into the top side pocket and stop the cue ball.`,
      category: 'Demo',
      difficulty: 1,
      skill: 'Shot Making',
      attribution: { author: 'Pool IQ (demo content)', notes: 'Example file shipped with Pool IQ to demonstrate importing.' },
      metadata: meta(['drill'])
    }),
    shot: {
      ...shot,
      targetZones: [{ x: shot.cueBallPath[1].x, y: shot.cueBallPath[1].y, rings: [{ r: 2.5, stars: 3 }, { r: 4.5, stars: 2 }, { r: 7, stars: 1 }], label: 'STOP' }],
      goal: 'Pocket the 1 in the top side pocket and stop the cue ball where the 1 was.',
      instructions: 'DEMO: set the 1 one diamond below the top side pocket and the cue ball straight behind it. Shoot a stop shot.',
      setupInstructions: '1 ball: 4 diamonds from the head rail, 1 diamond down. Cue ball: 4 diamonds from the head rail, 2.8 diamonds down.',
      whyExplanation: { whyCustom: 'This DEMO drill exists to show a .pooliq drill: layout, recipe, SPEED and scoring all come from the file.', whySpeed: 'SPEED 1.5 is a gentle pace on the Pool IQ scale — enough to reach the pocket firmly.' },
      hints: ['Keep the cue level.', 'Watch the cue ball stop on the spot.']
    },
    scoringRules: { mode: 'success', attempts: 10, pass: { made: 7 } },
    xp: 40,
    skillEffects: { 'Shot Making': 1 }
  };
}

// 2. Diamond / rail answer challenge -----------------------------------------------------------
const M = mirror([25, 25], [75, 25]);
files['demo-diamond-challenge.pooliq'] = {
  ...header('challenge', 'demo-mirror-diamond', 'DEMO · Mirror Line Rail Point', {
    description: `${DEMO_NOTE} Pure mirror geometry: with the cue ball and the 1 the same distance from the top rail, the mirror line meets the rail halfway between them.`,
    category: 'Demo',
    difficulty: 2,
    skill: 'Kicks',
    attribution: { author: 'Pool IQ (demo content)' },
    metadata: meta(['challenge', 'diamond'])
  }),
  challengeType: 'diamond',
  question: 'WHERE SHOULD THE CUE BALL CONTACT THE RAIL?',
  shot: {
    ...M.shot,
    referenceMarkers: [{ rail: 'top', diamond: M.diamond, label: `${M.diamond.toFixed(1)}`, kind: 'aim' }],
    goal: 'Kick off the top rail and hit the 1.',
    instructions: 'DEMO: cue ball 2 diamonds from the head rail, the 1 six diamonds from the head rail, both 2 diamonds down. Tap the top rail where the cue ball should hit it, lock your answer, then shoot it.',
    whyExplanation: { whyRoute: 'Mirror geometry only: reflect the 1 across the top rail and aim at the reflection. Real cushions, spin and speed change the rebound — this DEMO ignores them.' }
  },
  answer: { rail: 'top', diamond: M.diamond, tolerance: { pass: 0.2, close: 0.5 }, explanation: 'Both balls are 2 diamonds from the top rail, so the mirror line crosses the rail halfway between them: diamond 4.0 (geometry only, DEMO).' },
  scoringRules: { mode: 'success', attempts: 5, pass: { made: 3 } }
};

// 3. Player-solution challenge ------------------------------------------------------------------
{
  const shot = straightIn(2, [75, 37.5], 'BR', 22.5, { speed: 2, technique: 'follow', vTips: 0.5, follow: 9 });
  const end = shot.cueBallPath[2];
  files['demo-player-solution.pooliq'] = {
    ...header('challenge', 'demo-follow-solution', 'DEMO · Choose the Recipe (Follow)', {
      description: `${DEMO_NOTE} Decide technique, tip and SPEED, lock your answer, compare with the recommended recipe from this file, then shoot it.`,
      category: 'Demo',
      difficulty: 2,
      skill: 'Cue-Ball Control',
      attribution: { author: 'Pool IQ (demo content)' },
      metadata: meta(['challenge', 'solution'])
    }),
    challengeType: 'solution',
    question: 'HOW WOULD YOU PLAY THIS SHOT?',
    ask: ['technique', 'tip', 'speed'],
    shot: {
      ...shot,
      targetZones: [{ x: end.x, y: end.y, rings: [{ r: 2.5, stars: 3 }, { r: 4.5, stars: 2 }, { r: 6.5, stars: 1 }] }],
      goal: 'Pocket the 2 in the bottom-right corner and follow forward into the zone.',
      instructions: 'DEMO: straight-in shot to the bottom-right corner. Choose how you would play it, lock your answer, then shoot 5 attempts.',
      whyExplanation: { whyContact: 'In this DEMO the recommended contact is half a tip above centre so the cue ball rolls forward after contact.', whySpeed: 'SPEED 2 in this DEMO: enough pace to pocket the ball and roll a short distance forward.' }
    },
    scoringRules: { mode: 'success', attempts: 5, pass: { made: 3 } }
  };
}

// 4. Lesson ------------------------------------------------------------------------------------
{
  const s = M.shot;
  const refOnly = { ...s, referenceMarkers: [{ rail: 'top', diamond: M.diamond, label: 'mirror point', kind: 'aim' }] };
  files['demo-lesson.pooliq'] = {
    ...header('lesson', 'demo-mirror-lesson', 'DEMO · Lesson Flow: The Mirror Line', {
      description: `${DEMO_NOTE} Walks through every lesson phase: TEACH → GUIDED PRACTICE → SOLVE IT YOURSELF → EXECUTE → TEST.`,
      category: 'Demo',
      difficulty: 2,
      skill: 'Kicks',
      attribution: { author: 'Pool IQ (demo content)' },
      metadata: meta(['lesson'])
    }),
    steps: [
      { phase: 'teach', title: 'The mirror idea (geometry only)', text: 'This DEMO lesson uses plain mirror geometry: reflect the object ball across the rail and aim at the reflection. With both balls the same distance from the rail, the route touches the rail halfway between them. Real tables add spin, speed and cushion effects, which this demo ignores.', shot: refOnly },
      { phase: 'guided', title: 'Guided: follow the drawn route', text: 'The route and the rail point are shown. Set it up and shoot it.', shot: refOnly, scoringRules: { mode: 'success', attempts: 3, pass: { made: 1 } } },
      { phase: 'solve', title: 'Solve it yourself', text: 'The balls moved closer together. Where does the cue ball hit the top rail? Choose the rail point and SPEED, then lock your answer.', question: 'WHERE SHOULD THE CUE BALL CONTACT THE RAIL?', ask: ['rail', 'diamond', 'speed'], shot: mirror([37.5, 25], [62.5, 25]).shot, answer: { rail: 'top', diamond: 4, tolerance: { pass: 0.2, close: 0.5 }, explanation: 'Same distance from the rail, so the point is halfway between the balls: 4.0 (geometry only).' } },
      { phase: 'execute', title: 'Execute', text: 'Shoot the route you just solved.', shot: mirror([37.5, 25], [62.5, 25]).shot, scoringRules: { mode: 'success', attempts: 5, pass: { made: 2 } } },
      { phase: 'test', title: 'Test', text: 'Final test: hit the 1 off the top rail.', shot: s, scoringRules: { mode: 'success', attempts: 10, pass: { made: 5 } } }
    ]
  };
}

// 5. Gauntlet ----------------------------------------------------------------------------------
{
  const stages = [
    ['s1', 'Short straight-in', 1, 9, 100],
    ['s2', 'Medium straight-in', 2, 18, 150],
    ['s3', 'Long straight-in', 3, 30, 200],
    ['s4', 'Corner, medium', 4, 25, 250],
    ['s5', 'Corner, long', 5, 45, 300]
  ].map(([id, title, difficulty, dist, points], i) => {
    const shot = i < 3 ? straightIn(1, [50, 6.25], 'TM', dist - 2.25 < 0 ? 9 : dist, { speed: 1 + i * 0.5 }) : straightIn(1, [87.5, 6.25], 'TR', dist, { speed: 2 + (i - 3) * 0.5 });
    return { id, title: `DEMO · ${title}`, difficulty, points, shot: { ...shot, goal: `Pocket the 1 (${title.toLowerCase()}).` } };
  });
  files['demo-gauntlet.pooliq'] = {
    ...header('game', 'demo-straight-gauntlet', 'DEMO · Straight-In Gauntlet', {
      description: `${DEMO_NOTE} GAUNTLET template: 3 lives, five straight-in stages of increasing distance. A make scores and moves on; a miss costs a life and you retry the stage.`,
      category: 'Demo',
      difficulty: 3,
      skill: 'Shot Making',
      attribution: { author: 'Pool IQ (demo content)' },
      metadata: meta(['game', 'gauntlet'])
    }),
    template: 'gauntlet',
    rules: { lives: 3, pointsPerSuccess: 100, streakBonus: { every: 3, points: 50 }, stageBonus: 500, retry: 'repeat', order: 'listed' },
    stages
  };
}

// 6. Training pack -----------------------------------------------------------------------------
{
  const drill = files['demo-single-drill.pooliq'];
  const gauntlet = files['demo-gauntlet.pooliq'];
  const dia = files['demo-diamond-challenge.pooliq'];
  files['demo-training-pack.pooliq'] = {
    ...header('pack', 'demo-straight-in-pack', 'DEMO · STRAIGHT-IN BASICS', {
      description: `${DEMO_NOTE} A multi-stage pack: introduction lesson, practice drill, a rail-point test and a final score-attack challenge. Stages unlock in order.`,
      category: 'Demo',
      difficulty: 2,
      attribution: { author: 'Pool IQ (demo content)' },
      metadata: meta(['pack'])
    }),
    unlockMode: 'sequential',
    stages: [
      { id: 'intro', title: 'Introduction', stageType: 'lesson', contentType: 'lesson', steps: [{ phase: 'teach', title: 'How this DEMO pack works', text: 'Each stage unlocks when you pass the one before it. Your progress is saved in My Content and never changes your Career rank.', shot: drill.shot }] },
      { id: 'practice', title: 'Guided Straight-In', stageType: 'practice', contentType: 'drill', skill: 'Shot Making', shot: drill.shot, scoringRules: { mode: 'success', attempts: 5, pass: { made: 3 } } },
      { id: 'rail-test', title: 'Rail Point Test', stageType: 'test', contentType: 'challenge', challengeType: 'diamond', question: dia.question, shot: dia.shot, answer: dia.answer },
      { id: 'final', title: 'Final Challenge', stageType: 'final', contentType: 'game', requires: ['practice', 'rail-test'], template: 'scoreAttack', rules: { shots: 5, pointsPerSuccess: 100, streakBonus: { every: 2, points: 50 }, passScore: 300 }, stages: gauntlet.stages.slice(0, 3) }
    ]
  };
}

// 7. Template: every supported drill field ------------------------------------------------------
{
  const shot = straightIn(3, [62.5, 25], 'TR', 20, { speed: 3, technique: 'draw', vTips: -1 });
  // straight draw back along the shot line to the bottom rail, then off it (simple reflection, DEMO geometry)
  const g = shot.cueBallPath[1];
  const back = [shot.cueBallPosition.x - g.x, shot.cueBallPosition.y - g.y];
  const L = Math.hypot(...back);
  const u = [back[0] / L, back[1] / L];
  const t = (50 - R - g.y) / u[1];
  const hit = P(g.x + u[0] * t, 50 - R);
  const end = P(hit.x + u[0] * 6, hit.y - u[1] * 6);
  files['pooliq-drill-template.pooliq'] = {
    ...header('drill', 'template-every-field', 'DEMO · Template With Every Field', {
      description: 'TEMPLATE / DEMO: shows every supported field of a single-drill .pooliq file. Copy it, change the values, keep the field names. Field-by-field documentation is in POOLIQ_CONTENT_SCHEMA.md.',
      category: 'Demo',
      difficulty: 3,
      skill: 'Position Play',
      attribution: { author: 'Your name here', sourceName: 'Where the idea came from (optional)', sourceURL: 'https://example.com/', notes: 'Attribution is optional. Leave author out when unknown — never guess.' },
      careerEligible: false,
      metadata: { tags: ['template', 'demo'], created: '2026-09-25', updated: '2026-09-25', language: 'en', demo: true, generator: 'hand-written' }
    }),
    shot: {
      ...shot,
      kind: 'position',
      ballPositions: [...shot.ballPositions, { n: 9, x: 12.5, y: 37.5 }],
      blockers: [{ n: 8, x: 81.25, y: 37.5 }],
      acceptPockets: ['TR'],
      ghost: g,
      targetZones: [
        { type: 'rings', x: end.x, y: end.y, rings: [{ r: 2.5, stars: 3 }, { r: 4.5, stars: 2 }, { r: 6.5, stars: 1 }], label: 'FOR 9' },
        { type: 'band', center: 37.5, rings: [{ r: 3, stars: 2 }, { r: 6, stars: 1 }] }
      ],
      cueBallPath: [shot.cueBallPosition, g, hit, end],
      railContacts: [{ x: hit.x, y: 50, rail: 'bottom', by: 'cue', order: 1 }],
      referenceMarkers: [{ rail: 'bottom', diamond: 3, label: 'ref 3', kind: 'reference' }],
      english: { type: 'none' },
      aim: { fraction: 1, label: 'Full ball', short: 'FULL', cutDeg: 0 },
      route: { rails: 1, text: '1 rail (bottom)', short: '1 RAIL' },
      goal: 'Pocket the 3 in the top-right corner and draw the cue ball off the bottom rail into the zone for the 9.',
      instructions: 'Shooting instructions shown on the play screen.',
      setupInstructions: 'Setup instructions (optional) — the SETUP diamond readout is generated from the coordinates automatically.',
      whyExplanation: { whyCustom: "Coach's note.", whyContact: 'Why this cue-ball contact.', whySpeed: 'Why this SPEED.', whySpin: 'Why this spin.', whyRoute: 'Why this route.', whyAim: 'Why this aim.' },
      hints: ['Hint 1', 'Hint 2']
    },
    scoringRules: { mode: 'zone', attempts: 10, pass: { stars: 12, pockets: 7 }, requirePocket: true },
    xp: 60,
    skillEffects: { 'Position Play': 1, 'Shot Making': 0.5 },
    prerequisites: ['demo-straight-in-stop']
  };
}

let bad = 0;
for (const [name, doc] of Object.entries(files)) {
  const v = validatePooliq(JSON.stringify(doc));
  if (!v.ok) { bad++; console.error(`✗ ${name}\n  ${v.errors.join('\n  ')}`); continue; }
  writeFileSync(join(ROOT, 'examples', name), `${serialize(doc)}\n`);
  console.log(`✓ ${name}${v.warnings.length ? `  (warnings: ${v.warnings.join('; ')})` : ''}`);
}
process.exit(bad ? 1 : 0);
