# Pool IQ content files (`.pooliq`) — schema 1.0

A `.pooliq` file is **one strict JSON object** (UTF-8, no comments, no trailing commas) that Pool IQ can import from
**Drills → MY CONTENT → IMPORT CONTENT**. A file holds exactly one piece of content: a **drill**, a **challenge**
(diamond/rail answer or player-solution), a **lesson**, a **game** (skill-game template) or a **pack** (training pack
with ordered stages). Files are **data only** — Pool IQ never runs code from a file.

After import the app shows: **VALIDATE → PREVIEW → PLAY TEST → ADD TO MY CONTENT (install) or DISCARD**. Nothing is
installed until the player taps ADD TO MY CONTENT. Play-test results are never saved.

This document is written so a person *or another AI* can produce valid files. Example files that pass validation are in
[`examples/`](./examples/). Section 16 is a ready-to-paste prompt for an AI.

---

## 1. File header (every file)

| Field | Required | Type | Notes |
|---|---|---|---|
| `format` | **yes** | `"pooliq"` | exactly this string |
| `schemaVersion` | **yes** | `"1.0"` | this app supports up to **1.0** |
| `contentType` | **yes** | `"drill"` \| `"challenge"` \| `"lesson"` \| `"game"` \| `"pack"` | |
| `id` | **yes** | id string | 1–64 chars: letters, digits, `.` `-` `_`; must start with a letter/digit. Same id = same content (see §13 conflicts). |
| `contentVersion` | **yes** | `"1.0"`, `"1.2"`, `"2.0.1"` | your version of this content; shown as installed vs incoming on conflicts |
| `title` | **yes** | text ≤ 80 | |
| `description` | no | text ≤ 2000 | |
| `category` | no | text ≤ 40 | free text, e.g. `"Kicks"`, `"Demo"` |
| `difficulty` | no | integer 1–10 | |
| `skill` | no | one of the skill names below | the main skill trained |
| `attribution` | no | object | `author` (≤80), `sourceName` (≤120), `sourceURL` (http/https only, ≤500), `notes` (≤600). **Optional. Never claim an author you do not know — leave it out.** |
| `careerEligible` | no | boolean | drills only — see §12 |
| `metadata` | no | object | `tags` (≤12 strings ≤30), `created`, `updated` (text ≤40, e.g. `"2026-09-25"`), `language` (≤16), `demo` (bool — shows a DEMO badge), `generator` (≤80, e.g. `"ChatGPT"`) |

Skill names (exact spelling): `Shot Making`, `Cue-Ball Control`, `Position Play`, `Speed Control`, `Banks`, `Kicks`,
`Safeties`, `Pattern Play`.

**Unknown fields are rejected** (with a "did you mean …?" hint) so typos are caught instead of silently ignored.

---

## 2. Coordinate system (canonical form)

All positions use Pool IQ's table coordinates — the same ones the app's table renderer, Shot Simulator and Create Drill
builder use. The **playing surface** (cushion nose to cushion nose) is **100 × 50 units**, drawn with the head rail on
the left.

```
                 top rail  (y = 0)          diamonds along the top/bottom rails: 0 … 8
   x=0        x=12.5  x=25   x=37.5  x=50   x=62.5  x=75   x=87.5  x=100
   TL ●──────────◆──────◆──────◆──────● TM ───◆──────◆──────◆──────────● TR     y=0
   │                                                                          │
   ◆  y=12.5                                                                  ◆
   │                                                                          │
 head rail          +x →  (toward the foot rail)                        foot rail
 (left, x=0)        +y ↓  (toward the bottom rail)                     (right, x=100)
   ◆  y=25                                                                    ◆
   │                                                                          │
   ◆  y=37.5                                                                  ◆
   │                                                                          │
   BL ●──────────◆──────◆──────◆──────● BM ───◆──────◆──────◆──────────● BR     y=50
                 bottom rail (y = 50)       diamonds along the head/foot rails: 0 … 4
```

- **Origin** `(0, 0)` = the top-left corner of the cloth (where the head rail meets the top rail, at the TL pocket).
- **x** grows to the right along the length: `0` = head rail, `100` = foot rail.
- **y** grows downward across the width: `0` = top rail, `50` = bottom rail.
- **1 diamond = 12.5 units** (8 diamond spaces along the length, 4 across).
- **Ball radius = 1.125 units** (true scale: 2¼″ ball on a 100″ × 50″ 9-ft playing surface). A ball *centre* must be at
  least 1.125 from every cushion: `1.125 ≤ x ≤ 98.875`, `1.125 ≤ y ≤ 48.875`. Two ball centres must be ≥ 2.25 apart.
- **Pocket ids**: `TL` (0,0) · `TM` (50,0) · `TR` (100,0) · `BL` (0,50) · `BM` (50,50) · `BR` (100,50).
- **Rail ids**: `top` (y=0), `bottom` (y=50), `left` (= head rail, x=0), `right` (= foot rail, x=100).
- The app's **SETUP readout** is `x / 12.5` (diamonds from the head rail, 0–8) then `y / 12.5` (diamonds down from the
  top rail, 0–4), rounded to ¼ diamond. Example: a ball at `{"x": 50, "y": 12.5}` reads **4 · 1**.

**Diamond shorthand.** Any point may instead be written `{"dx": 4, "dy": 1}` (diamonds). It is converted on import to
`{"x": dx × 12.5, "y": dy × 12.5}` and exported in canonical `{x, y}` form. Do not mix `x`/`y` with `dx`/`dy` in one point.

**Rail + diamond positions** (answers, reference markers) are written `{"rail": "top", "diamond": 2.5}`: top/bottom rails
count 0–8 from the head rail (left); left/right rails count 0–4 from the top rail.

---

## 3. The shot object (layout + recipe) — used by every content type

A `shot` describes one table layout and how to play it. It maps 1:1 to Pool IQ's Shot Recipe panel.

| Field | Req. | Type / range | Meaning |
|---|---|---|---|
| `cueBallPosition` | **yes** | point | exactly **one** cue ball |
| `speed` | **yes** | 0.5–5 in steps of 0.5 | Pool IQ **SPEED** (see §4) |
| `ballPositions` | no | ≤15 × `{"n":1-15,"x","y"}` | numbered object balls; each number once |
| `blockers` | no | ≤15 × `{"n","x","y"}` | balls that are in the way (drawn with a red ring); numbers must not repeat object balls |
| `targetBall` | no | 1–15 | must be one of `ballPositions` |
| `targetPocket` | no | pocket id | |
| `acceptPockets` | no | pocket ids | other pockets that also count; must include `targetPocket` |
| `targetZones` | no | ≤8 zones | cue-ball landing zones (§6) |
| `cueBallPath` | no | 2–200 path points | cue-ball route, starting at the cue ball (§5) |
| `contactIndex` | no | integer ≥1 | index in `cueBallPath` where the cue ball meets the object ball (ghost ball); default 1 |
| `ghost` | no | point | explicit ghost-ball position (else taken from `cueBallPath[contactIndex]`) |
| `objectBallPaths` | no | ≤15 × `{"n", "points":[…]}` | object-ball routes (≥2 points each) |
| `objectBallPath` | no | path | shorthand for the target ball's path (converted to `objectBallPaths`) |
| `railContacts` | no | ≤20 × `{"x","y","rail","by","order"}` | where a ball touches a rail (◆ on the table). `by`: `"cue"` (default) or `"ob"`; `order` 1–20 optional. The point must be within 2.5 units of that rail line. |
| `referenceMarkers` | no | ≤20 × `{"rail","diamond","label","kind"}` | diamond / reference pins drawn on the rail. `kind`: `reference` (default), `aim`, `contact`, `target`; `label` ≤24 |
| `cueContact` | no | `{"vTips": -1.5…1.5, "hTips": -1…1}` | tip position in **¼-tip steps**. `vTips` + = above centre (follow), − = below (draw). `hTips` + = right English, − = left. Default centre `{0,0}`. |
| `english` | no | `{"type": "none"\|"left"\|"right"\|"running"\|"reverse"}` | label for the side spin; if you add `hTips` here it must equal `cueContact.hTips` |
| `technique` | no | `stop` `stun` `follow` `draw` `stun-run` `stun-draw` `lag` `bank` `kick` | shown in the recipe; auto-derived from the tip if omitted |
| `kind` | no | `pot` `position` `bank` `kick` `carom` `safety` `lag` | |
| `aim` | no | `{"fraction":0-1, "label", "short", "cutDeg":0-90}` | overrides the Aim View (ghost-ball overlap). Usually omit: Pool IQ computes it from `cueBallPath`/`ghost` and the object ball (e.g. "Right ½ · 30° cut"). |
| `route` | no | `{"rails":0-10, "text", "short"}` | route label override; usually derived from `railContacts` |
| `goal` | no | text ≤240 | one-line goal shown on the play screen |
| `instructions` | no | text ≤1500 | shooting instructions |
| `setupInstructions` | no | text ≤1500 | how to place the balls |
| `whyExplanation` | no | object | **Why This Shot?** texts (≤1500 each): `whyCustom` (shown first), `whyContact`, `whySpeed`, `whySpin`, `whyRoute`, `whyAim` |
| `hints` | no | ≤10 texts ≤300 | |

**Shot Recipe mapping.** The three gauges on the play screen come from the shot: **Aim View** = `aim` or the geometry of
`cueBallPath[contactIndex]`/`ghost` vs `targetBall` (sin-θ offset label like "Right ½ · 30° cut"); **Tip** =
`cueContact` (+ `technique`, `english`); **SPEED** dial = `speed`. At Advanced/Expert coaching the Aim View stays hidden
until the player locks an answer (progressive coaching).

**Camera-ready.** `cueBallPosition`, `ballPositions`, `blockers`, `targetBall`, `targetPocket` and `targetZones` are the
complete expected layout, so a future camera result source can compare expected vs detected positions.

---

## 4. SPEED

`speed` uses Pool IQ's numeric **SPEED** scale (the same one the player calibrates in Settings): **SPEED n ≈ n table
lengths of total cue-ball travel** on a clear table. Allowed values: `0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`.

| SPEED | Meaning |
|---|---|
| 0.5 | half a table length — dies around the side pockets |
| 1 | one table length — just reaches the far rail |
| 1.5 | far rail and back to the side pockets |
| 2 | two lengths — far rail and back to the starting end |
| 3 | three lengths |
| 5 | five lengths — top of the controlled range |

Any other number (e.g. `1.7`, `6`, `"medium"`) is rejected: `SPEED 1.7 is not on the Pool IQ SPEED scale (0.5–5.0 in steps of 0.5)`.

---

## 5. Paths and rail contacts

- A **path** is a list of points (2–200). Path points may go up to 3 units past the cushion (−3…103, −3…53) so a
  path can end *in* a pocket.
- `cueBallPath[0]` should be the cue ball position (warning otherwise). `cueBallPath[contactIndex]` is the ghost-ball
  position where the cue ball contacts the object ball. Points after it are the cue ball's route after contact.
- For a rail bounce, put a path point at the ball centre when it touches the cushion (1.125 from the rail line), and add a
  `railContacts` entry at the cushion (e.g. `{"x": 50, "y": 0, "rail": "top", "by": "cue"}`).
- `objectBallPaths` start at the object ball and usually end at the pocket centre (e.g. `{"x": 50, "y": -1.45}` for TM).
- Paths are **given by the file** — Pool IQ does not invent kick or bank systems. (In the builder you can also let the
  Shot Simulator physics compute the route for a simple pot.)

---

## 6. Target zones

```json
{ "x": 62.5, "y": 25, "rings": [ {"r": 3.5, "stars": 3}, {"r": 6.5, "stars": 2}, {"r": 10, "stars": 1} ], "label": "CB" }
```
- Circle zone: centre point (`x`,`y` or `dx`,`dy`) + 1–3 `rings` (`r` 0.5–30 units, `stars` 1–3). Each star value once;
  more stars = smaller ring. `label` ≤12. Optional `"type": "rings"`.
- Band zone (a strip across the table): `{"type": "band", "center": 75, "rings": [{"r": 2, "stars": 3}, …]}` — `center`
  is an x value; ring `r` is the half-width.
- `"zone"` scoring needs at least one zone.

---

## 7. Scoring (`scoringRules`)

```json
{ "mode": "success", "attempts": 10, "pass": { "made": 7 } }
```
| mode | Each attempt the player taps | `pass` needs |
|---|---|---|
| `success` | **MISS / SUCCESS** | `made` (1…attempts) |
| `binary` | MISS / CONTACT ONLY / MADE | `made` (1…attempts) |
| `zone` | missed / pocketed / 1–3★ by where the cue ball stops | `stars` (0…3×attempts) and `pockets` (0…attempts) unless `"requirePocket": false` |
| `stars` | 0–3★ quality rating | `stars` (0…3×attempts) |

`attempts` is 1–50. Rules: `pass.made ≤ attempts`, `pass.stars ≤ 3 × attempts`, whole positive numbers only.
Drills also accept `xp` (0–1000), `skillEffects` (`{"Kicks": 1, "Speed Control": 0.3}` — values 0–1, skill names from §1)
and `prerequisites` (list of ids, informational).

Scoring is **manual** (the player taps the result). The app's camera adapter / result-source architecture is unchanged; a
future camera source can report the same results.

---

## 8. Content types

### 8.1 `drill` — one layout, attempts, pass requirement
Required: header + `shot` + `scoringRules`. Optional: `xp`, `skillEffects`, `prerequisites`, `careerEligible`.
Plays exactly like Pool IQ's built-in drill screen: *DRILL TITLE · Attempt 1 of 10 · [TABLE] · SUCCESS / MISS*.
See [`examples/demo-single-drill.pooliq`](./examples/demo-single-drill.pooliq).

### 8.2 `challenge` — the player works out the answer first
Required: `challengeType`, `question` (≤240), `shot`. Optional: `answer`, `ask`, `scoringRules`.

- **`"challengeType": "diamond"`** (rail / diamond answer). Requires `answer`:
  ```json
  "question": "WHERE SHOULD THE CUE BALL CONTACT THE RAIL?",
  "answer": { "rail": "top", "diamond": 4.0, "tolerance": { "pass": 0.2, "close": 0.5 }, "explanation": "…" }
  ```
  The player taps the rail on the table (snaps to 0.1 diamond, fine-tune ±0.1), taps **LOCK ANSWER**, and sees
  *Your answer: 3.8 · Recommended: 4.0 · Difference: 0.2 diamonds* with **PASS** (|diff| ≤ pass), **CLOSE**
  (≤ close) or **MISS** (more, or a different rail). Default tolerance: pass 0.2, close 0.5 (pass 0–2, close 0–4,
  close ≥ pass). **The recommended answer always comes from the file** — Pool IQ does not calculate kick systems.
- **`"challengeType": "solution"`** (player solution). Requires `ask` — what the player must choose, any of:
  `technique` (stop/stun/follow/draw), `tip` (tap the cue ball), `english`, `speed`, `rails` (number of rails),
  `rail` + `diamond` (tap a rail point; needs `answer`). **LOCK MY ANSWER** reveals a *PLAYER CHOICE vs RECOMMENDED*
  comparison taken from the shot (`technique`, `cueContact`, `english`, `speed`, `railContacts`, `answer`).
- If `scoringRules` is present the player then physically shoots it (manual SUCCESS/MISS attempts); the result screen
  combines the answer score and the attempts.

See [`examples/demo-diamond-challenge.pooliq`](./examples/demo-diamond-challenge.pooliq) and
[`examples/demo-player-solution.pooliq`](./examples/demo-player-solution.pooliq).

### 8.3 `lesson` — TEACH → GUIDED PRACTICE → SOLVE IT YOURSELF → EXECUTE → TEST
Required: `steps` (1–40), each `{ "phase", "title" (≤80), … }`:

| phase | Shows | Needs |
|---|---|---|
| `teach` | explanation `text` (≤3000) + optional table diagram with route, diamonds, tip, SPEED | `text` or `shot` |
| `guided` | the full solution visible (beginner coaching); optional attempts | `shot`; `scoringRules` for attempts |
| `solve` | solution hidden; player chooses what `ask` lists (and/or taps a rail/diamond), **LOCK ANSWER** reveals the recommended solution | `shot`, `ask`; `answer` if asking rail/diamond; `question` optional; `scoringRules` optional |
| `execute` | shoot it with the recipe visible | `shot`; `scoringRules` for attempts |
| `test` | shoot it with normal coaching; **passing all test steps passes the lesson** | `shot`, `scoringRules` |

Put phases in that order (a warning is shown otherwise). See [`examples/demo-lesson.pooliq`](./examples/demo-lesson.pooliq).

### 8.4 `game` — safe skill-game templates
Required: `template`, `stages` (1–60). Optional: `rules`. Each stage:
`{ "id", "title", "shot", "difficulty"?: 1-10, "points"?: int, "scoringRules"?, "quiz"? }`.

Games are **data-driven templates** — a file can only choose a template and set numbers; it cannot add logic.

| template | How it plays | Ends |
|---|---|---|
| `gauntlet` | ❤️ lives; stages in order of increasing difficulty; SUCCESS scores `points` (or `pointsPerSuccess`) and advances; MISS loses a life and (`retry: "repeat"`) replays the stage or (`"next"`) moves on | lives = 0 → **GAME OVER**; last stage cleared → **GAUNTLET CLEARED** + `stageBonus` (or loops if `loop: true`) |
| `lives` | every shot moves to the next stage (loops); a miss costs a life | lives = 0 |
| `streak` | one miss ends the run; score = successes in a row | first miss (or `shots` reached) |
| `scoreAttack` | fixed number of `shots` (default = number of stages), points per success + streak bonus | shots used; passed if score ≥ `passScore` |
| `target` | fixed `shots`, each rated 0–3★ by the stage's target zone; score = stars × `pointsPerStar` | shots used |
| `multiStage` | each stage has its own `scoringRules` (`success`/`binary`, e.g. 3 of 5); pass → next stage; fail → lose a life and retry | lives = 0 (default 1) or all stages passed |
| `quizExecution` | each stage: answer the `quiz` first (multiple choice `options` + `correct` index, or a rail `answer`), then shoot it | all stages played (or lives = 0 if `lives` set) |

`rules` (all optional): `lives` 1–10 (default 3), `pointsPerSuccess` (100), `pointsPerStar` (50),
`streakBonus` `{ "every": 2-50, "points" }`, `stageBonus`, `retry` (`repeat`|`next`), `shots` 1–200, `loop` (bool),
`passScore`, `quizPoints` (50), `order` (`listed` | `difficulty`).

The GAME OVER screen shows **Score, Stage reached, Successful shots, Misses, Longest streak, Personal best**. Personal
bests are saved per installed game (never in Career). See [`examples/demo-gauntlet.pooliq`](./examples/demo-gauntlet.pooliq).

### 8.5 `pack` — training pack with ordered stages
Required: `stages` (1–40). Optional: `unlockMode` (`sequential` default | `open`). Each stage is a drill, challenge, lesson
or game *without* the file header, plus:

| Stage field | Req. | Notes |
|---|---|---|
| `id` | **yes** | unique within the pack |
| `title` | **yes** | |
| `contentType` | **yes** | `drill` \| `challenge` \| `lesson` \| `game` — then that type's fields (`shot`, `scoringRules`, `steps`, `template`, …) |
| `stageType` | no | `lesson` \| `practice` \| `test` \| `final` (label) |
| `requires` | no | ids of **earlier** stages that must be passed to unlock this one (overrides `unlockMode`) |
| `description`, `category`, `difficulty`, `skill` | no | |

Locking: with `sequential`, stage N unlocks when stage N−1 is passed; `open` unlocks all; `requires` lists explicit
prerequisites. The pack page shows ✓ passed / 🔓 open / 🔒 locked and a progress %:

```
DEMO · STRAIGHT-IN BASICS                         50%
1. Introduction        ✓
2. Guided practice     ✓
3. Rail-point test     🔓
4. Final challenge     🔒
```
In **Play Test** every stage can be tried; after installing, locks apply and results are saved.
See [`examples/demo-training-pack.pooliq`](./examples/demo-training-pack.pooliq).

---

## 9. Every field in one file

[`examples/pooliq-drill-template.pooliq`](./examples/pooliq-drill-template.pooliq) is a valid drill that uses **every
drill and shot field** (JSON has no comments — this document is the field reference). Copy it and change values.

---

## 10. Validation (what is checked, and the messages you will see)

Pool IQ validates the whole file **before** showing anything. Problems are listed together, each with the path of the
field, for example `shot.ballPositions[1]: must be a ball {"n": 1, "x": …, "y": …}`.

| Check | Example message |
|---|---|
| Newer schema | `CANNOT IMPORT — This file uses Pool IQ schema 3.0. Your version supports up to 1.0.` |
| Not JSON / empty / too big | `CANNOT IMPORT — This is not a valid .pooliq file: it is not valid JSON (…)` · `The file is too large (600 KB). .pooliq files can be up to 512 KB.` |
| Wrong `format` | `CANNOT IMPORT — This is not a Pool IQ content file (the "format" field must be "pooliq").` |
| Unknown content type | `CANNOT IMPORT — Unknown contentType "video". Supported: drill, pack, lesson, game, challenge.` |
| Unknown field | `shot.cueBall: unknown field (did you mean "cueBallPosition"?)` |
| Off the table | `shot.ballPositions[0]: is off the table (x 104, y 20; the playing surface is x 0–100, y 0–50)` |
| Ball in the cushion | `the cue ball at (0.5, 20) overlaps the cushion — a ball centre must be 1.125 or more from every rail` |
| Overlapping balls | `ball 1 and ball 2 overlap (centres 1.20 apart, need at least 2.25)` |
| Ball numbers | `must be a whole number from 1 to 15` · `ball 3 is used twice — every ball number (1–15) can appear only once` |
| Cue ball | `must be ONE point {"x": …, "y": …} — a layout has exactly one cue ball` · `the cue ball goes in cueBallPosition, not in the numbered balls` |
| SPEED | `SPEED 1.7 is not on the Pool IQ SPEED scale (0.5–5.0 in steps of 0.5)` |
| Tip | `must be in ¼-tip steps (e.g. 0, 0.25, 0.5, 1)` |
| Zones | `each star value (1, 2, 3) can be used only once` · `"zone" scoring needs at least one target zone in shot.targetZones` |
| Scoring | `pass.made: must be between 1 and the number of attempts (10)` · `attempts: must be a whole number from 1 to 50` |
| Templates | `template: must be one of: gauntlet, target, streak, lives, scoreAttack, multiStage, quizExecution` |
| Answers | `the top rail runs 0–8 diamonds` · `"close" must be at least as large as "pass"` |
| Packs | `"intro" must be the id of an EARLIER stage` · `duplicate stage id "s1"` |
| Limits | ≤512 KB, ≤25 000 values, nesting ≤14 levels, any text ≤4000 characters, list sizes as in the tables |

Warnings (import still allowed) are shown on the preview, e.g. a path that does not start at the cue ball.

Older Pool IQ **Create Drill exports** (`"format": "pool-iq-drills"`) are still accepted by IMPORT CONTENT and go into
My Drills. Pool IQ **backup files** are rejected here (restore them from Settings).

---

## 11. Security rules (why a file can be rejected)

`.pooliq` files are **data only**. On import Pool IQ:
- parses strict JSON only (never `eval`, never runs scripts, never loads remote code, CSS, fonts or images);
- rejects any text containing markup or code: HTML tags (`<script`, `<iframe`, `<img` …), `javascript:` / `vbscript:` /
  `data:` URLs, event-handler attributes (`onclick=`, `onerror=` …), HTML character codes (`&#60;`), escaped markup,
  `eval(`, `new Function(`, `document.cookie`, CSS `expression(` / `url(` / `@import`;
- rejects the keys `__proto__`, `constructor`, `prototype` anywhere (prototype pollution);
- rejects unknown fields, caps file size, depth, number of values, text length and list lengths;
- shows all text as plain text (HTML-escaped), and `sourceURL` only as an http/https link opened with `rel="noopener"`;
- never changes your data when a file is rejected ("Nothing on this device was changed.").

---

## 12. Career, progress and play test

- **Play Test** (before installing) runs the content on the normal play screens but saves **nothing**: Career, ratings,
  rank, achievements, training history and Ghost records are untouched.
- **Installed** content saves its own progress (plays, passed, personal bests, pack stage progress) in My Content only.
  It never changes Career rank.
- `"careerEligible": true` (drills only) lets an installed drill also appear in the Drills library and count in the
  normal training history / skill ratings like a Create Drill drill. It still never awards rank. Default: not eligible.
- Everything installed is saved on the device, mirrored to the on-device safety copy and included in **Settings → Back
  Up** files.

---

## 13. Versioning and conflicts

- `schemaVersion` is the file format version (this app: **1.0**). Files with a higher major/minor version are refused
  with a clear message; future Pool IQ versions will keep reading 1.0 files.
- `contentVersion` is *your* version of the content. When a file with the same `id` is already installed, Pool IQ shows
  **INSTALLED v1.0 vs INCOMING v1.2** and asks **REPLACE / KEEP BOTH / CANCEL** — it never silently overwrites.
  KEEP BOTH installs the new one with a new id (`…-2`) and "(copy)" in the title.
- Definitions are **deterministic and portable**: a file contains no player save data, so two players who import the
  same file get exactly the same challenge (useful for future head-to-head play).

---

## 14. Editing and exporting in the app

- **EDIT** opens the Create Drill builder on the item's shot: drag balls (touch), add/remove numbered balls and blockers,
  change target pocket and zones, draw the cue-ball and object-ball paths by tapping, mark rail contacts and diamond
  markers, set tip / English / technique / SPEED / aim, texts, attempts, pass requirement, category, difficulty and
  attribution, then **SAVE** (to My Content) or **EXPORT .pooliq**.
- **EXPORT** uses the phone's share sheet with a `.pooliq` file (falls back to a download). The file contains everything
  needed to import it on another phone; export → import is lossless.
- Create Drill drills can be exported as `.pooliq` too (EXPORT on the My Content card or in the builder).

---

## 15. Minimal valid files

```json
{
  "format": "pooliq", "schemaVersion": "1.0", "contentType": "drill",
  "id": "my-first-drill", "contentVersion": "1.0", "title": "Straight-in stop shot",
  "shot": {
    "cueBallPosition": { "x": 50, "y": 35 },
    "ballPositions": [ { "n": 1, "x": 50, "y": 12.5 } ],
    "targetBall": 1, "targetPocket": "TM",
    "cueContact": { "vTips": -0.25, "hTips": 0 }, "speed": 1.5,
    "instructions": "Pocket the 1 in the top side pocket and stop the cue ball."
  },
  "scoringRules": { "mode": "success", "attempts": 10, "pass": { "made": 7 } }
}
```

```json
{
  "format": "pooliq", "schemaVersion": "1.0", "contentType": "challenge",
  "id": "my-rail-question", "contentVersion": "1.0", "title": "Rail point question",
  "challengeType": "diamond", "question": "WHERE SHOULD THE CUE BALL CONTACT THE RAIL?",
  "shot": { "cueBallPosition": { "dx": 2, "dy": 2 }, "ballPositions": [ { "n": 1, "dx": 6, "dy": 2 } ], "speed": 2 },
  "answer": { "rail": "top", "diamond": 4.0 }
}
```

---

## 16. Prompt for an AI (copy, then describe your content)

> You are writing a **Pool IQ `.pooliq` file** (strict JSON, schema 1.0). Follow POOLIQ_CONTENT_SCHEMA.md exactly.
> Output **only** the JSON object — no comments, no trailing commas, no markdown.
> Rules: `format` = "pooliq", `schemaVersion` = "1.0"; choose `contentType` drill | challenge | lesson | game | pack;
> `id` = lowercase-with-dashes; `contentVersion` = "1.0". Table coordinates: x 0 (head rail, left) → 100 (foot rail),
> y 0 (top rail) → 50 (bottom rail); 1 diamond = 12.5; ball centres between 1.125 and 98.875 (x) / 48.875 (y), at least
> 2.25 apart; pockets TL TM TR BL BM BR; rails top bottom left right; you may write points as {"dx","dy"} in diamonds.
> Exactly one `cueBallPosition`; numbered balls 1–15, each once. `speed` ∈ {0.5,1,…,5} (Pool IQ SPEED = table lengths of
> cue-ball travel). `cueContact` vTips −1.5…1.5, hTips −1…1 in ¼ steps. Scoring: {"mode":"success","attempts":N,
> "pass":{"made":M}} with 1 ≤ M ≤ N ≤ 50. Only use the fields listed in the schema. Plain text only — no HTML, links other
> than one http/https `attribution.sourceURL`, or code. Do **not** invent named systems or claim an author; if the content
> is illustrative, say so in the description; leave `attribution.author` out when unknown. Rail/diamond answers and paths
> must be the values the content author intends — describe geometry simply.
> Content: **[describe the drill / lesson / pack / game here]**

Then import the file in Pool IQ (Drills → MY CONTENT → IMPORT CONTENT). If anything is wrong, the error list names the
exact field to fix — paste it back to the AI.
