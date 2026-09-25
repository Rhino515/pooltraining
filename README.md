# Pool IQ

Pool IQ is a mobile-first PWA for practising billiards on a real table. You play the shots at your table, then tap the result into the phone. It includes:

- 14 Arcade skill games (102 stages in total)
- Boss Battles that gate each Career rank
- Ghost races
- A numeric SPEED system you can calibrate to your own stroke
- A teaching layer on every shot: table diagram, Shot Recipe, cue-ball contact diagram, and a Why This Shot? sheet

All content is original. Pass/fail is only ever computed from the results you record. The app has no self-report "I passed" buttons.

## Run locally

```bash
cd pool-iq
python3 -m http.server 8765
# open http://localhost:8765
```

To deploy, copy the folder to any static host (for example GitHub Pages). All asset paths are relative (`./`).

## What's inside

| Area | Files |
|---|---|
| Hash router / boot | `js/app.js` (`#home #career #drills #analyze #arcade #profile #settings #ghost #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id>`) |
| Challenge data model + geometry | `js/games/geometry.js`, `js/games/builders.js` (position, pot, lag, bank, kick, carom, safety, train) |
| Game content | `js/games/data/*.js` (one file per game plus `bosses.js`), `js/games/registry.js` |
| Engine (pure) | `js/games/engine.js`: sessions, scoring modes (zone, lives, kick, train, stars, binary, sniper, ladder, calibration, pattern), unlocks, PBs, bosses |
| Teaching components | `js/games/stageTable.js` (table SVG), `js/games/recipe.js` (Shot Recipe + Why), `js/games/cueBallDiagram.js`, `js/games/coaching.js` (Beginner → Expert) |
| SPEED system | `js/games/speed.js`: SPEED 0.5–5.0 (1.0 = one table length of travel), personal calibration, table size and cloth |
| Screens | `js/ui/play.js` (every game, drill and boss), `js/ui/sheet.js`, `js/dashboard.js`, `js/ghost.js` |
| Career / skills | `js/career.js` (game levels, Ghost wins, Boss Battles), `js/skills.js` (ratings computed from results) |
| Storage | `js/storage.js`: `localStorage` key `poolIQStateV4`, migrated from V3/V2. Old keys are left intact. |

### Games

| Game | Stages |
|---|---|
| Ghost | 7 (3- to 9-ball) |
| Landing Zone | 10 |
| Draw Challenge | 9 |
| Follow Challenge | 8 |
| Stun Master | 9 |
| Speed Ladder | 9 (calibration + ladder) |
| Bank Vault | 8 + Endless |
| Kick Escape | 9 |
| Position Train | 8 |
| Carom Challenge | 7 |
| Safety Lock | 6 |
| Pattern Puzzle | 5 |
| Pocket Sniper | 8 |
| Rail Runner | 6 |

There are also 9 Boss Battles, one per rank from Club Player to Champion.

### Camera-ready hook

Every attempt is saved with `resultSource: 'manual'`. A future camera module can call `registerResultAdapter({ id, available, verifyAttempt(challenge, outcome) })` from `js/analyze.js`. From then on, the play screen passes each tapped outcome through the adapter before saving it, so the attempt records the adapter's `resultSource`.

## Drill library (ships empty)

The drill library is intentionally empty; your drills go here. The Drills tab shows a clean empty state until drills are added.

Drills use the same challenge data model as the Arcade. Each new drill automatically gets:

- the table diagram
- the Shot Recipe (contact, SPEED chip, aim, route)
- the cue-ball contact diagram
- Why This Shot?
- scoring, history and skill-rating credit

To add drills, put objects in `DRILL_SPECS` in `js/drills.js` or in `extraDrills` in `js/drillsExtra.js`. Each drill plays at `#play/drills/<id>`.

### Template 1: builder spec (recommended)

In this style the geometry, recipe and why-text are computed for you.

```js
{
  id: 'my-stop-1',                  // unique, never reuse a deleted id
  name: 'Stop Shot 1',
  category: 'Stop Shots',           // one of CATEGORIES in js/drills.js
  difficulty: 2,                    // 1–10
  kind: 'position',                 // position | pot | lag | bank | kick | carom | safety | train
  ob: [1, 60, 25],                  // object ball [number, x, y] on the 100×50 table (x: head→foot, y: top→bottom)
  pocket: 'TR',                     // TL TM TR BL BM BR
  cut: [0, 1, 24],                  // [cut°, side ±1, distance] places the cue ball, or use cue: [x, y]
  k: 0,                             // spin at contact: −1.6 heavy draw … 0 stun … +1.4 follow
  travel: 0,                        // cue-ball travel after contact (table units ≈ inches)
  rings: [6, 4, 2],                 // optional target-zone radii for ★ / ★★ / ★★★
  blockers: [[5, 70, 30]],          // optional other balls [number, x, y]
  scoring: { mode: 'zone', attempts: 10, pass: { stars: 15, pockets: 8 } }, // or { mode: 'binary', attempts: 10, pass: { made: 7 } }
  skillEffects: { 'Cue-Ball Control': 1, 'Shot Making': 0.4 },
  instructions: 'How to set the balls up and what to do.',
  note: { speed: 'Optional coaching appended to the auto-generated speed reason.' }
}
```

Bank drills use `rails: ['top']`. Kick drills use `cue: [x, y]`, `target: [n, x, y]` and `rails: [...]`. The builders in `js/games/builders.js` document every kind.

### Template 2: full challenge object

Use this style for hand-drawn layouts. These fields are required:

```js
{
  id, name, category, difficulty,
  ballPositions: [{ n: 1, x: 60, y: 25 }], cueBallPosition: { x: 36, y: 25 },
  targetBall: 1, targetPocket: 'TR',
  targetZones: [{ type: 'rings', x: 60, y: 25, rings: [{ r: 6, stars: 1 }, { r: 4, stars: 2 }, { r: 2, stars: 3 }] }],
  cueBallPath: [{ x: 36, y: 25 }, { x: 54.4, y: 25 }], contactIndex: 1,
  objectBallPath: [{ x: 60, y: 25 }, { x: 97.5, y: 2.5 }], railContacts: [],   // [{ x, y, rail: 'top'|'bottom'|'left'|'right' }]
  cueContact: { vTips: 0, hTips: 0 }, english: { hTips: 0, type: 'none' },
  speed: 1.5,                                         // Pool IQ SPEED number
  aim: { fraction: 1, label: 'Full hit', short: 'FULL', cutDeg: 0 },
  route: { rails: 0, text: 'Direct (no rail)', short: 'DIRECT' },
  instructions, goal,
  whyExplanation: { whyContact, whySpeed, whySpin, whyRoute, whyAim },
  scoringRules: { mode: 'binary', attempts: 10, pass: { made: 7 } },
  attemptCount: 10, passingRequirement: { made: 7 }, skillEffects: { 'Shot Making': 1 }, xp: 100
}
```

Before shipping new drills, run `node scripts/verify.mjs`. It applies the same geometry checks to every drill that it applies to the Arcade stages. You can also call `geometryProblems(challenge)` from `scripts/geometryCheck.mjs` directly.

## Career

A rank's requirements are Arcade game levels, Ghost wins and that rank's Boss Battle; some higher ranks also require star totals or PBs. When every non-boss requirement is met, the boss unlocks. Beating the boss is the only way to promote, and XP never promotes by itself.

Ranks earned before V4 are preserved through `rankFloor`. Saved results for drills that no longer exist are moved to `state.drillArchive` at startup and never read again.

## Tests

### verify (Node 18+, no dependencies)

```bash
node scripts/verify.mjs          # add --quiet to print only failures and the summary
```

It checks:

- the drill library (0 drills is valid)
- stage and boss-shot geometry:
  - paths stay inside the table
  - rail contacts sit on the cushion lines and outside pocket jaws
  - angle in = angle out
  - object-ball routes end in the pocket
  - zones are inside the table
  - balls don't overlap and none sit in pockets
  - cue-ball and object-ball lines are clear
  - kick blockers really block
- why-text is unique per stage
- scoring and unlock rules
- lives and multipliers
- Ghost undo after the match ends
- Career ticks and boss pass/fail with weak skills
- skill ratings
- V3 → V4 migration, including archiving deleted drill ids

### e2e (real Chrome, iPhone 390×844, touch)

```bash
# 1. serve the app
python3 -m http.server 8765 --directory pool-iq &
# 2. install puppeteer-core OUTSIDE the project (keep node_modules out of pool-iq)
mkdir -p ../tooling && (cd ../tooling && npm i puppeteer-core)
# 3. run (optionally save screenshots)
node pool-iq/scripts/e2e.mjs http://localhost:8765/ --shots ./shots
```

The script looks for puppeteer-core in `$PUPPETEER_DIR`, `./node_modules`, `../tooling/node_modules` and `/workspace/tooling/node_modules`. It uses Chrome from `$CHROME_PATH` or the usual Linux paths. Every check prints PASS/FAIL, and the script exits non-zero on any failure or console error.

It covers:

- every route, including the drills empty state
- the table SVG elements, contact dot position and SPEED chip
- Why sheets differing between stages
- fail and pass unlock rules, PB persistence and session resume after reload
- Ghost undo after the match ends
- Bank lives and the Train multiplier
- Advanced lock/reveal
- Career ticks
- Boss pass/fail and promotion
- skill changes
- layout at 390×844 and 375×667
- service worker and offline reload

## Storage

- `localStorage` key `poolIQStateV4`. It migrates from `poolIQStateV3` and `poolIQStateV2`, and the old keys are left intact as backups.
- The in-progress session (`activeSession`) and Ghost match (`activeGhost`) are saved after every tap, so a reload resumes play.
- IndexedDB helpers (`idbPut`/`idbGet`) are reserved for future camera captures.
