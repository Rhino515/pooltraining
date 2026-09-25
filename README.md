# Pool IQ

Pool IQ is a mobile-first PWA for practising billiards on a real table. You play the shots at your table, then tap the result into the phone. It includes:

- 14 Arcade skill games (102 stages in total)
- Boss Battles that gate each Career rank
- Ghost races
- A numeric SPEED system you can calibrate to your own stroke
- A teaching layer on every shot: table diagram, Shot Recipe gauges (Aim View, cue-ball tip, SPEED dial), and a Why This Shot? sheet
- A faint dashed diamond grid on every table diagram, plus a Setup line giving each ball's position in diamonds

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
| Hash router / boot | `js/app.js` (`#home #career #drills #analyze #arcade #profile #settings #ghost #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id> #sim #sim/s=<code> #sim/target #drillnew #drilledit/<id> #content #cimport #cview/<ref> #cplay/<ref>[/<stage>] #cedit/<uid>[/<loc>]`) |
| Challenge data model + geometry | `js/games/geometry.js`, `js/games/builders.js` (position, pot, lag, bank, kick, carom, safety, train) |
| Game content | `js/games/data/*.js` (one file per game plus `bosses.js`), `js/games/registry.js` |
| Engine (pure) | `js/games/engine.js`: sessions, scoring modes (zone, lives, kick, train, stars, binary, sniper, ladder, calibration, pattern), unlocks, PBs, bosses |
| Teaching components | `js/tableDiagram.js` (shared table SVG + diamond grid), `js/games/stageTable.js` (routes/zones), `js/games/recipe.js` (Shot Recipe gauges, Setup line, Why), `js/games/aimView.js` (Aim View maths + SVG), `js/games/diamonds.js` (diamond readout), `js/games/cueBallDiagram.js`, `js/games/coaching.js` (Beginner → Expert) |
| SPEED system | `js/games/speed.js`: SPEED 0.5–5.0 (1.0 = one table length of travel), personal calibration, table size and cloth |
| Screens | `js/ui/play.js` (every game, drill and boss), `js/ui/sheet.js`, `js/dashboard.js`, `js/ghost.js` |
| Career / skills | `js/career.js` (game levels, Ghost wins, Boss Battles), `js/skills.js` (ratings computed from results) |
| Shot Simulator | `js/sim/physics.js` (deterministic ball physics), `js/sim/layouts.js` (racks, random layouts, snap, validation), `js/sim/solver.js` (throw-compensated aim, Find a Shot, shape zones, Target Game), `js/sim/share.js` (URL/JSON share format), `js/sim/library.js` (saved shots + settings), `js/ui/simulator.js` (screen) |
| Create Drill | `js/customDrills.js` (builder model, validation, simulated route, challenge builder, storage, import/export), `js/ui/drillBuilder.js` (screen) |
| Storage | `js/storage.js`: `localStorage` key `poolIQStateV4`, migrated from V3/V2. Old keys are left intact. |
| Data safety | `js/vault.js` + `js/install.js`: IndexedDB mirror of every key, reconcile on load, 3 rolling snapshots, JSON backup/restore, backup reminder, protected storage, Install App. |
| .pooliq content (v10) | `js/content/schema.js` (strict validator + security), `js/content/convert.js` (shot ⇄ challenge ⇄ builder), `js/content/store.js` (My Content + personal progress), `js/content/templates.js` (game templates, rail answers), `js/ui/content.js` (My Content, import, preview, play test, runners), `js/ui/builderContent.js` (builder ⇄ .pooliq), `js/ui/share.js` (Web Share / download). Format: `POOLIQ_CONTENT_SCHEMA.md`; examples: `examples/*.pooliq` (regenerate with `node scripts/make-examples.mjs`). |

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

### Race the Ghost

- **3- to 9-Ball (rotation):**
  - Rule, shown on the setup screen, in-game, and in a RULES sheet: "Run the balls in order: 1, 2, 3 … Miss, foul or shoot out of order = Ghost wins the rack."
  - RUNOUT means every ball went down in order; anything else goes to the Ghost.
  - Beating the N-ball Ghost in a race to 3+ unlocks N+1.
- **8-Ball Ghost:**
  - Levels: Beginner (3 + 8), Intermediate (5 + 8), Advanced (7 + 8, ball in hand, no break), Pro (full rack, you break), and Custom (1–7 balls + the 8). Your choice is remembered (`poolIQGhostPreset`).
  - Rules: ball in hand, pocket your group in any order, then the 8 in a called pocket. Miss, scratch or 8 early = Ghost wins the rack.
  - **Pro** has a break step:
    - log balls made on the break (optional)
    - house rules: 8 on the break = you win the rack. Scratch on the break: take ball in hand and run out, no penalty (re-spot as needed; **SCRATCHED ON BREAK** goes straight to the run-out and the scratch is noted in the rack history)
    - then **BALL IN HAND ›**: the table is open (pick solids or stripes), ball in hand anywhere, run your 7 + the 8
    - Undo steps back through the run-out → break → previous rack (including a break scratch)
  - Races 3/5/7/9, history and stats per level.
  - "Set up in Shot Simulator" (`#sim/eight/<n|pro>`) builds a matching random layout, or a 15-ball rack for Pro.
  - 8-Ball Ghost wins count as general Ghost wins and feed Pattern Play once played. They never satisfy an "N-Ball Ghost" career requirement.

### True-scale table

Table diagrams use a 100 × 50 unit playing surface measured cushion nose to cushion nose (1 unit = 1 inch on a 9-ft table). Balls are drawn at true size: radius 1.125 (a 2.25" ball), so a ball is 2.25% of the length and 4.5% of the width. That makes it easy to see which diamond line a ball sits on. The cushions, wood rails and diamond sights are drawn outside the playing surface (`VIEWBOX` = `-4.6 -4.6 109.2 59.2`). Pockets sit at the cushion corners, and side pockets just behind the long cushions, with holes about two ball diameters wide.

The ball size is one constant, `BALL_RADIUS` in `js/tableDiagram.js`. Geometry (`geometry.R`, cushion lines, ghost-ball offsets, clearance checks) and the Aim View maths all use it, so the clearance rules follow the real ball size, not the drawing size. Each ball also has a larger invisible hit circle for taps. The Aim View gauge is a separate close-up and stays large.

### Diamond grid and Setup readout

Every table diagram (stages, boss shots, drills, previews) draws thin dashed lines from each diamond sight across the felt: 7 along the long axis and 3 along the short axis, one diamond (12.5 table units) apart. They sit under the zones, paths and balls.

The **Setup** line under the table lists every ball as `first · second`, computed from the ball coordinates and rounded to the nearest ¼ diamond:

- first = diamonds from the **head rail** (the left end of the diagram, 0–8)
- second = diamonds from the **top rail** (0–4)

The readout is taken from the ball centre. A ball frozen to a cushion has its centre one radius (1.125 units, about 0.09 diamond) off the nose, so it reads as on that rail (0 or 8, 0 or 4). So `4 · 2` is the center spot, `2 · 2` the head spot and `6 · 2` the foot spot. Tap the Setup line to see this explanation and the list in words. The same list is at the bottom of the Why sheet.

### Shot Recipe gauges

The recipe card shows three round gauges:

1. **Aim View** shows the object ball as seen from behind the cue ball, with the ghost cue ball overlapping it. θ is the angle between the cue ball's final approach (cue → ghost, or last rail → ghost on a kick) and the ghost → object-ball line. The sideways offset is sin θ × one ball diameter and the fullness is 1 − sin θ. Hitting the right side of the object ball sends it left. The label reads like "Right ½ · 30° cut". The gauge is left out when there is no object ball (lags). Intermediate coaching shows "?" in its place, and Advanced/Expert hide it until the plan is locked.
2. **Tip** shows a shaded cue ball with the contact dot, labelled e.g. "Draw 1½ tips". Tap it for the full recipe.
3. **Speed dial** shows the needle on Pool IQ's SPEED 0.5–5.0 scale.

### Camera-ready hook

Every attempt is saved with `resultSource: 'manual'`. A future camera module can call `registerResultAdapter({ id, available, verifyAttempt(challenge, outcome) })` from `js/analyze.js`. From then on, the play screen passes each tapped outcome through the adapter before saving it, so the attempt records the adapter's `resultSource`.

## Shot Simulator (`#sim`)

A pool-table simulator for planning and studying shots. It is a **physics approximation**, and the UI says so. Use it to learn patterns, not as a guarantee of what the real table will do.

- **Table:** the shared true-scale renderer (100 × 50 playing surface, ball radius 1.125, diamond grid full/half/off). The SETUP readout lists every ball in diamonds.
- **Placing balls:** drag a ball to move it (optional ¼-diamond snap, live position bubble, page never scrolls while dragging). Tap the tray to add or remove balls 1–15.
- **Aiming:** drag the felt to aim, or tap an object ball to aim at it (tap again to cycle pockets, throw-compensated). You can also tap a pocket to aim the last ball there. ±1° / ±0.1° nudge buttons, aim readout, ghost ball, Aim View gauge, tangent line.
- **Cue:** tip position uses the contact diagram (±1.5 tips, squirt included). SPEED 0.3–7 on Pool IQ's scale (Speed N ≈ N table lengths of centre-ball travel), with optional personal calibration.
- **Playback:** SHOOT animates the shot and draws coloured tracks per ball. Controls: replay, pause/play, step to the next event, skip to end, ¼×/½×/1×/2× speed, tracks on/off. The result summary covers the first ball hit, balls pocketed, cue-ball rails, where it stopped, and scratches.
- **Continue:** "Continue ▶" plays the next shot from where the balls stopped; after a scratch the cue ball is in hand on the head spot. Undo/redo cover every layout, aim, tip, speed and continue step. "Reset to start" restores the starting layout.
- **Actions menu:**
  - 8/9/10-ball racks, and random 8/9/10-ball run-out layouts (legal, non-overlapping)
  - clear, reset, flip ends/sides
  - Find a Shot: tap where the cue ball should finish; it searches pockets × tip × SPEED in the simulator and lists the best four
  - Shape zone: where the cue ball can land for an easy next shot, within the max-cut setting
  - Target Game: 5 rounds, 60 s each; pot the ball and land on the target for stars; best score saved
  - Save to the shot library: named, with notes, collections, favourites, search/sort, rename, move, duplicate, delete
  - Share link, JSON export/import, PNG image export
  - Turn into drill: opens Create Drill prefilled
  - Settings
- **Drawing:** arrows, lines, circles, text labels, and a measure tool (distance in diamonds plus angle), in 4 colours. Erase and clear.

### Physics model (`js/sim/physics.js`)

- **Time step:** adaptive, each ball moves ≤ 0.2 R per step, capped at 1/120 s. Friction is integrated exactly within a step: sliding friction (μ 0.2) until the contact point stops slipping, then rolling resistance (μ 0.0105), plus side-spin decay.
- **Ball–ball:** each collision is backed off to the exact moment of touch. It is nearly elastic (e 0.95), with a speed-dependent ball–ball friction impulse. That impulse produces cut-induced and spin-induced throw and transfers spin.
- **Cushions:** speed-dependent restitution (0.93 → 0.75 as impact speed rises). Cushion friction lets side spin change the rebound angle and kills part of the roll.
- **Pockets:** real mouth geometry; corner and side jaws are angled segments. A ball can hit a facing and rattle out, or drop once past the drop radius.
- **Cue strike:** the tip offset sets top/back spin and side spin. Squirt is 1.2° per tip.
- **SPEED:** `SPEED_TABLE` maps SPEED → launch speed by simulating centre-ball lags, so Speed 1 travels exactly one table length. Regenerate it with `node scripts/gen-speed-table.mjs` after changing constants; `verify.mjs` fails if it goes stale.
- **Deterministic:** the same layout and shot always give the same result.
- **Not modelled:** cue elevation (massé/jump), swerve/curve from side spin, cloth wear, humidity, ball-to-ball differences, and table roll. Cushion and jaw responses are simplified.

### Share format

The share link is `#sim/s=<code>`. `<code>` is base64url JSON: `{v:1, b:[[id (0 = cue), x, y]…], a: aim°, s: SPEED, t:[vTips, hTips], n:[drawings], m: name}`. Opening the link loads the layout on any device. JSON files use `{format:'pool-iq-shot', version:1, shots:[…]}`.

## Create Drill (`#drillnew`, `#drilledit/<id>`)

The Drills tab has a **＋ CREATE DRILL** button, which also appears in the empty state. The builder offers:

- **Layout:** cue ball, object balls 1–15 and blocker balls, placed by dragging on the true-scale grid table with ¼-diamond snap (or nudge buttons). The SETUP readout updates live.
- **Target:** the target ball, plus one or more accepted pockets (★ marks the main one). You can tap a pocket on the table to choose it.
- **Cue-ball zones:** add a zone, or "zone where the cue ball stops". Zones use the star-ring system (S/M/L) and can be dragged.
- **Recipe:** tip position, SPEED, an aim fine-tune (± on top of the automatic throw-compensated aim), and "show cue route". The route is computed by the simulator: cue path, object-ball path and rail contacts, with warnings if the simulated shot misses, scratches or lands outside the zone.
- **Details:** title, category, skill trained (the 8 career skills), level 1–5, instructions, goal, and a coach's note shown first in Why This Shot? (automatic Why texts are added too).
- **Scoring:** pocket + zone stars / made-miss / quality stars, attempts, pass criteria, and "pocket required".
- **Preview, Save:** saving validates (title, balls on the table, no overlaps, duplicate numbers, pocket chosen, zone present when needed) with friendly messages.

Saved drills use the same challenge data model as Template 2 below. They are stored under `localStorage` key `poolIQCustomDrillsV1` and merged with the built-in library at load (`allDrills()`), so they play exactly like every other drill: grid table, SETUP, 3-gauge recipe with Aim View, Why sheet, large score buttons, history, PBs and coaching levels.

Drill cards have Edit / Duplicate / History / Export / Delete (with confirm) buttons. You can also export all drills or import a file. Drill files use `{format:'pool-iq-drills', version:1, drills:[challenge…]}`; imported ids that clash are re-numbered. Custom drill results feed skill ratings once played. Career ranks still depend only on games, Ghost and bosses.

## Drill library (ships empty)

The built-in drill library is intentionally empty. Build drills in the app with **Create Drill** (above), or add them in code as described here. The Drills tab shows a clean empty state with a Create Drill button until drills exist.

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

## My Content and .pooliq files (v10)

**Drills tab → MY CONTENT** (`#content`). Tap **IMPORT CONTENT** and pick a `.pooliq` file from Files, iCloud Drive or Downloads. The flow is: validate → **preview** (`#cview/pending`, same table, Shot Recipe and SPEED as normal play) → **PLAY TEST** (`#cplay/pending`, normal play screen, nothing saved) → **ADD TO MY CONTENT** or **DISCARD**. Nothing is installed until you choose to add it.

- Content types: `drill`, `challenge` (diamond / rail answer, player solution), `lesson` (Teach → Guided → Solve it yourself → Execute → Test), `game` (gauntlet, target, streak, lives, scoreAttack, multiStage, quizExecution) and `pack` (ordered stages, locks, progress %).
- The format is strict JSON and data only. Files are capped at 512 KB. Unknown keys, script-like strings, prototype keys and non-http(s) URLs are rejected, and all text is rendered as text. The full reference, written so another AI can generate valid files, is in `POOLIQ_CONTENT_SCHEMA.md`.
- Installed items live in `poolIQContentV1` and personal bests and progress in `poolIQContentProgressV1`. Both are mirrored, snapshotted and backed up like every other key. Imported content never changes Career, ratings, history or achievements.
- If an item with the same id is already installed, you choose **REPLACE / KEEP BOTH / CANCEL** (installed vs incoming `contentVersion` shown). **EDIT** opens the visual builder in content mode. **EXPORT** shares a `.pooliq` file (or downloads it); the round trip is lossless.
- Old Create Drill JSON exports still import (into My Drills).

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
- diamond grid: 10 lines, aligned with the rail sights, drawn under the balls, on every stage, boss shot and the drill template
- true-scale balls: every stage, boss shot, the drill template and the Analyze demo draw balls at r = 1.125. Ghost balls are the same size, every ball has a larger hit area, and pockets are to scale
- diamond readout: corners, spots, ¼ rounding, balls frozen to a rail, every ball on every stage and boss shot
- Aim View maths: straight-in = Full, 30° = ½, 48.6° = ¼, the correct side, and agreement with the dashed object-ball path and the recipe cut angle on every shot
- scoring and unlock rules
- lives and multipliers
- Ghost undo after the match ends
- Career ticks and boss pass/fail with weak skills
- skill ratings
- V3 → V4 migration, including archiving deleted drill ids
- Shot Simulator physics:
  - SPEED calibration (Speed N = N lengths; table not stale)
  - straight-in stun stops on the contact spot
  - follow/draw
  - 30° half-ball natural-roll deflection
  - rail rebound ≈ mirror, side-spin effect
  - restitution vs speed
  - energy never increases, no tunnelling at SPEED 7
  - pocketing and jaw rattles
  - determinism, break spread
  - throw-compensated aim, Find a Shot, Target Game
- racks/random layouts: legal and non-overlapping (240 layouts)
- snap and validation, share-link round-trip, shot library CRUD
- Create Drill:
  - validation messages
  - builder → challenge → save → `allDrills()` → render
  - skills (unplayed drills never lower ratings; played ones count), rank unaffected
  - export/import/duplicate/delete
- Ghost: order-rule text for 3- and 9-ball (setup, in-game, sheet); 8-Ball Ghost presets/custom count, scoring, undo, XP, general-vs-N-ball career credit, skills; Pro break flow + house rules (8 on the break wins, break scratch = ball in hand, no penalty) + undo; simulator layouts
- data safety: every persisted key is mirrored (and every writer notifies the mirror); localStorage wiped / corrupted → restored from IndexedDB; single corrupt key repaired; newer-wins both ways; an empty/default state never overwrites a good copy (a deliberate reset may); snapshot rotation (3 kept, spaced out, none of empty data); backup export → import round trip restores every key identically (career, custom drills, sim shots, preset, draft) and snapshots what it replaces; old V3/V2 saves and older backup schemas migrate; invalid files rejected; reminder rules; Android manifest + icons
- service worker precaches every module (v9)

### e2e (real Chrome, iPhone 390×844 / 375×667 and Android Chrome 412×915 / 360×800, touch)

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
- true-scale balls on screen (2.25% of the playing length), tap area, Aim View size
- the diamond grid, Setup readout and Aim View on a stage, a bank stage, a boss shot and the drill template
- layout at 390×844 and 375×667 (table, gauges, instructions and score buttons fit without scrolling)
- Shot Simulator:
  - drag a ball without page scroll, undo/redo
  - tap-to-aim, nudge, speed
  - shoot → animation completes, per-ball coloured tracks, tracks toggle, replay, skip to end
  - Continue with next shot
  - random 9-ball and racked layouts
  - save and reopen from the library
  - share link opened on a fresh device
  - 375×667 layout
- Create Drill:
  - validation
  - build, zone, computed route, preview, save
  - appears in the library; play with grid/SETUP/Aim View, Why coach note, score to the result screen, PB on the card
  - edit in place, duplicate, delete with confirm
  - no scrolling on score screens at both sizes
- Ghost: order rule visible for 3-ball and 9-ball; 8-Ball Ghost custom count remembered after reload, scored and saved, undo; Pro break → ball in hand → run-out, SCRATCHED ON BREAK → ball in hand (no Ghost point) + undo, break log saved, no stale toast over the buttons; Set up in Shot Simulator; no scrolling at 390×844 and 375×667
- data safety: play a rack → wipe localStorage → reload → everything restored from IndexedDB (also after corrupting the save); Settings shows protected storage / usage / safety copy / last backup; Back Up Now downloads `PoolIQ-backup-YYYY-MM-DD.json` with every key (and uses the share sheet when files can be shared; a cancelled share isn't counted); Restore from Backup shows the summary and restores exactly; invalid file rejected; Restore previous snapshot undoes a restore; RESET ALL PROGRESS is two-step + typed, takes a snapshot, isn't undone by the mirror, and can be undone from the snapshot; Home backup nudge after 7+ days, dismissible; Install: iPhone steps, Android `beforeinstallprompt` → INSTALL APP, hidden when standalone; Android 412×915 and 360×800 Settings + score screens without scrolling
- My Content: entry point; accept list; bad, malicious (`<script>`, `onerror=`, `javascript:`, `__proto__`), schema 3.0, oversized and non-JSON files rejected with readable errors; preview (same renderer, recipe, SPEED, attempts, attribution); PLAY TEST isolation (every official key byte-for-byte unchanged); install + reload; conflict CANCEL / KEEP BOTH / REPLACE; installed play → personal progress only; builder edit (touch drag, SPEED, instructions, marker, inputs ≥ 16px); Web Share export + download fallback + lossless re-import; delete with confirm; pack locks + progress %; lesson solve → lock → reveal; gauntlet hearts / game over / PB persistence; diamond answer tap / 0.1 nudge / difference / tolerance; player-solution comparison; Advanced coaching on imported drills; legacy v9 drill export import; backup / mirror include content; every play screen fits without scrolling at 375×667, 412×915 and 360×800
- service worker (cache v10) and offline reload

## Storage

- `localStorage` key `poolIQStateV4`. It migrates from `poolIQStateV3` and `poolIQStateV2`, and the old keys are left intact as backups.
- The in-progress session (`activeSession`) and Ghost match (`activeGhost`) are saved after every tap, so a reload resumes play.
- Shot Simulator: `poolIQSimV1` (current table, saved shots, collections, settings, Target Game best). Create Drill: `poolIQCustomDrillsV1` (custom drills), `poolIQDrillWip` (unsaved builder work), `poolIQDrillDraft` (simulator → drill hand-off). These are new keys, so existing saves are untouched.
- My Content (v10): `poolIQContentV1` (installed .pooliq documents) and `poolIQContentProgressV1` (personal bests, pack stage progress). These are new keys; nothing existing is migrated or rewritten.
- Ghost setup: `poolIQGhostPreset`. Vault bookkeeping (save sequence, last backup, dismissed tips, protected-storage result): `poolIQMetaV1`.
- IndexedDB (`poolIQ_idb` / `blobs`, helpers `idbPut`/`idbGet`/`idbDelete` in `js/storage.js`) holds the safety copy and snapshots — see Data safety below.

## Data safety (`js/vault.js`, Settings → Protect your history)

History must never be lost, on iPhone or Android.

- **Every key is mirrored.** All ten data keys (`poolIQStateV4`, legacy `poolIQStateV3`/`V2`, `poolIQCustomDrillsV1`, `poolIQSimV1`, `poolIQGhostPreset`, `poolIQDrillWip`, `poolIQDrillDraft`, `poolIQContentV1`, `poolIQContentProgressV1`) are copied to IndexedDB (`mirror:current`) shortly after every save and when the app is hidden/closed. Each write bumps a save sequence + `savedAt` timestamp in `poolIQMetaV1`.
- **On load** the app picks the good copy before anything renders: missing or corrupt localStorage → restored from IndexedDB (and a corrupt single key is repaired); a missing IndexedDB copy is rebuilt from localStorage; otherwise the newer `savedAt` wins. A good copy is **never** replaced by an empty/default state — only a deliberate RESET or restore may do that.
- **Snapshots:** the last 3 are kept in IndexedDB (`mirror:snapshots`): one automatically at most every 6 hours of use, plus one right before any reset or restore. Settings → **Restore previous snapshot** (with confirm; the replaced data becomes a snapshot too).
- **Backup file:** Settings → **Back Up Now** makes one `PoolIQ-backup-YYYY-MM-DD.json` (`format: "pool-iq-backup"`, `schema`, `appVersion`, `exportedAt`, `summary`, `keys`). It uses the Web Share API with the file when the browser allows it (iPhone share sheet → Save to Files / iCloud Drive), otherwise a download (Android Chrome → Downloads, then share to Drive if you like). A **Download file instead** button appears when sharing is available.
- **Restore from Backup** reads a `.json`, validates it, shows rank / sessions / Ghost games / custom drills / saved shots / date, and replaces everything only after **Restore (replace my data)**. Current data is snapshotted first. Old saves (bare V2/V3/V4 state files, older backup schemas) go through the normal migration.
- **Protected storage:** `navigator.storage.persist()` is requested at start-up (and again on the first tap if refused); Settings shows ON / OFF / not supported and `navigator.storage.estimate()` usage.
- **Reminder:** Settings shows “Last backup: never / N days ago”; Home shows a small dismissible card when there's real progress (3+ sessions, matches, drills or shots) and no backup for 7+ days. No modal.
- **RESET ALL PROGRESS** is two steps plus typing `RESET`, and takes a snapshot first.
- **Install:** manifest has `id`, `start_url`/`scope` `./` (= `/pooltraining/` on GitHub Pages), `display: standalone`, theme/background colours, 192 + 512 `any` and `maskable` PNGs, plus a 180 px `apple-touch-icon`. Settings (and Home, dismissible) offer **Install App**: Android/Chrome uses `beforeinstallprompt`; iPhone Safari shows Share → Add to Home Screen steps; hidden when running installed.

**Limits:** there is no cloud sync — the backup file is the off-device copy. Deleting the app / home-screen icon, “Clear website data”, or a factory reset wipes both localStorage and IndexedDB, and a Safari tab and the Home Screen app keep separate storage on iPhone. Safari may also clear storage of a site you haven't opened in a while if it isn't added to the Home Screen.
