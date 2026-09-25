# Shot Simulator ↔ Billiard Shot Studio: feature parity

**Reference:** *Billiard Shot Studio*, "Pool table simulator", iOS, v2.0.0 (App Store id6504303931).

**Sources:**
- the App Store listing: description, What's New, version history and reviews
- billiardshotstudio.com

**Researched:** 25 Sep 2026.

Pool IQ matches the reference **functionally**. The screens, artwork, icons, wording and code are all original to Pool IQ; the only things taken from the reference are the feature ideas. Everything below is paraphrased.

Status key:
- ✅ implemented
- ➕ implemented and extended
- ⛔ not feasible in a PWA / not applicable, with the reason given

## Version history, as researched

| Version | Date | Theme of the release (paraphrased) | Pool IQ |
|---|---|---|---|
| 1.0 | 22 Sep 2024 | First release | ✅ see below |
| 1.0.1 | — | Maintenance release | n/a |
| 1.1.0 | — | Feature update (the listing's notes are brief; features folded into the tables below) | ✅ |
| 1.2.0 | — | Feature update (as above) | ✅ |
| 1.2.1 | — | Maintenance release | n/a |
| 2.0.0 | 6 Nov 2025 | Continue with the next shot after an animation; random 8/9/10-ball layout generator; redesigned simulator | ✅ both headline items |

## 1. Pool Simulator

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Realistic table with balls you can place | Shared true-scale renderer (100 × 50 playing surface, R = 1.125). Balls 1–15 + cue: drag to move, tray to add/remove, ¼-diamond snap, live position bubble, SETUP readout in diamonds | ➕ |
| Aim the cue ball | Drag the felt to aim. Tap a ball to aim at it (throw-compensated, tap again for the next pocket). Tap a pocket to aim the last ball there. ±1° / ±0.1° nudges, angle readout, ghost ball, Aim View gauge, tangent line | ➕ |
| Choose the tip position (spin) | Contact-diagram tip picker, ±1.5 tips vertical and horizontal. Squirt is modelled | ✅ |
| Choose the shot speed | SPEED 0.3–7 on Pool IQ's table-length scale (Speed N ≈ N lengths), with the personal calibration optional | ➕ |
| Physics simulation of the shot | Deterministic time-stepped physics: slide → roll, spin, throw, cushions, pocket jaws. See the README for the model and its limits | ✅ |
| Animated result with ball paths | Animation with a per-ball coloured track | ✅ |
| Step through the animation / analyse positions | Replay, pause, step to the next event (collision, rail, pocket), skip to end, ¼× – 2× speed, tracks on/off. Result summary: first ball hit, balls pocketed, cue-ball rails, final position | ➕ |
| **Continue with the next shot at the end of an animation** (v2.0.0) | "CONTINUE ▶" keeps the balls where they stopped; after a scratch the cue ball is in hand on the head spot; undoable | ✅ |
| **Generate random 8-ball, 9-ball and 10-ball layouts** (v2.0.0) | Random run-out layouts for 8/9/10-ball: legal, non-overlapping, clear of the pockets; for 8-ball the cue ball starts in the kitchen. Also *racked* 8/9/10-ball layouts (break practice) | ➕ |
| Analyse angles | Aim readout (fullness + cut angle), ghost ball, tangent line, object-ball line to the pocket, measure tool (distance in diamonds + angle) | ✅ |

## 2. Shot Designer

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Set up solids / stripes / 8-ball | Any of balls 1–15 from the tray. Stripes are drawn as stripes. Rack/random presets | ✅ |
| Flip a shot (mirror) | Actions → Flip ends / Flip sides (mirrors the balls, aim and drawings) | ✅ |
| Undo / redo | Header undo/redo covers ball moves, adds/removes, aim/tip/speed (coalesced), racks, clear, continue, drawings | ✅ |
| Shape / position zone with a maximum cut angle | "Zone" toggle shades where the cue ball can land for an easy next shot, limited by the *max cut* setting (30–75°) | ✅ |
| Export an image of the shot | Actions → Export image: PNG of the table with tracks and drawings, via the share sheet if available, otherwise a download | ✅ |
| Annotations / drawing (mentioned in reviews) | Draw mode: arrows, lines, circles, text labels, measure; 4 colours; erase, clear; saved with shots and share links | ✅ |

## 3. Shot Library

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Save shots | Save with a name, notes and a collection; update an existing shot or save as new | ✅ |
| Collections: create / rename / delete | Collection chips with + Collection, rename and delete (deleting moves the shots to *My Shots*, so nothing is lost) | ✅ |
| Move shots between collections | Shot ⋯ menu → Collection | ✅ |
| Favourite, rename, duplicate, delete | Star toggle; ⋯ menu offers rename, notes, duplicate, delete (with confirm) | ✅ |
| Notes per shot | Notes field; shown in the list | ✅ |
| Sort and filter | Sort by newest / oldest / name / most balls; favourites filter; search names & notes | ✅ |
| Share shots | Share link (the layout is in the URL hash, so it opens on any device); Web Share API when available, otherwise the link is copied/shown; JSON export/import | ➕ |

## 4. Find a Shot

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Pick a target spot → the app finds the shot | Actions → Find a Shot, then tap the target. The search simulates every open pot × tip × SPEED (throw-compensated aim) and lists the best 4 by distance from the target, with recipe and pocket. "Load best & shoot" | ✅ |
| Speed vs precision of the search (setting) | Settings → Find a Shot: *Speed* (quick, ~800 simulations) or *Precision* (thorough, ~3,200 + refinement). There is a progress bar and Cancel | ✅ |

## 5. Target Game

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Random shot; pot the ball and land on the target before time runs out | Actions → Target Game (or `#sim/target`): 5 rounds, 60 s per round. Each round is a random cue + object ball, with a target taken from the end of a real simulated shot (so it is always reachable). Pot + land for 0–3 stars (rings at 3.5 / 6.5 / 10"). Totals, and your best score is saved | ✅ |

## 6. Settings

| Reference feature | Pool IQ implementation | Status |
|---|---|---|
| Tangent line on/off | ✅ Settings → Tangent & object-ball lines | ✅ |
| Hide/show paths | ✅ Settings → Ball tracks, plus the Tracks toggle in playback | ✅ |
| Grid full / half / off | ✅ Settings → Grid (half adds half-diamond lines) | ✅ |
| Find-a-shot precision | ✅ Speed / Precision | ✅ |
| Max cut angle for shape zones | ✅ 30° / 45° / 60° / 75° | ✅ |
| (extra) ¼-diamond snap, playback speed, use my SPEED calibration | ✅ | ➕ |

## 7. Pool IQ extras beyond the reference

- **Turn into drill:** opens *Create Drill* prefilled with the layout, target ball/pocket, tip, SPEED and a zone where the cue ball stopped.
- **Recipe language shared with the rest of Pool IQ:** SPEED numbers, tip diagram, Aim View, diamond SETUP.
- **Offline:** works offline (service worker) and installs to the home screen.

## Not feasible or not applicable

| Reference item | Why not |
|---|---|
| Integration with a third-party scoring/league app (reviews mention a named partner) | Needs that vendor's private API and account linking. A static PWA on GitHub Pages has no server and no licence to that API. Share links and JSON export cover moving shots between devices |
| Subscriptions / in-app purchases | Pool IQ is free and has no accounts |
| Native iOS share extensions, iCloud sync of the library | A PWA can't use iCloud. The library lives in `localStorage` on the device; use Export JSON / Share link to move or back it up. Web Share API is used where Safari supports it |
| Cue elevation (massé / jump) | The reference doesn't offer it either (a review asked for vertical-axis cueing). Pool IQ's physics has no elevated-cue model, so none is shown |
| Pixel-identical physics to the reference | Its engine isn't public. Pool IQ uses its own documented model, tested for stun, draw/follow, 30° natural-roll deflection, rail mirroring, energy loss and SPEED calibration |
