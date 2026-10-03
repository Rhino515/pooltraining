# Pool IQ

Pool IQ is a mobile-first PWA for practising billiards on a real table. You play the shots at your table, then tap the result into the phone. It includes:

- 14 Table Games skill games (102 stages in total)
- Boss Battles that gate each Career rank
- Ghost races
- A numeric SPEED system (SPEED n = n table lengths of travel from the start spot, quarter steps, shown as SPEED 1.50) you can calibrate to your own stroke
- A teaching layer on every shot: table diagram, Shot Recipe gauges (Aim View, cue-ball tip, SPEED dial), and a Why This Shot? sheet
- A faint dashed diamond grid on every table diagram, plus a Setup line giving each ball's position in diamonds

- **v12:** a full visual restyle (Poppins type, navy theme, teal cloth with wood rails and white diamond sights, gold/cyan accents, rounded cards, icon nav) and a new app icon
- **v11.1:** Arcade renamed **Table Games**, a clearer SPEED scale with a mini-table diagram, the Three-Lane Speed Exercise drill, a full-path multi-rail aim preview in the Shot Simulator, and clock readings for the cue-ball tip, with a drag-to-set tip picker pop-up
- **v11:** Career ball levels ("Shooter · 7-Ball"), Rank and Lifetime XP, 12 skill levels, Skill Gates, Promotion Tests, a separate Drill Rank, Friends / PvP / tournaments, a local player profile, and a passcode-locked DEV MODE

All content is original. Pass/fail is only ever computed from the results you record. The app has no self-report "I passed" buttons.

## What's new in v14 (changelog)

Shot Simulator simplification. Playing-surface sizes (ball stays 2.25 in): 7 ft is 78×39 in, 8 ft is 88×44 in (the default), 9 ft is 100×50 in. Only the size changes the physics for now; cloth and cushion response can be added on the same calibration module.

- Aim-degree readout, degree nudge buttons, the cue-ball route paragraph, the small speed diagram, and the SETUP coordinate line are off the simulator screen.
- TABLE SIZE sticks in the existing simulator settings.
- Dragging a ball draws it above the finger.
- SCAN TABLE is a photo plus a confirm screen. There is no ball detector in this static app, so the screen says "Place the balls to match your photo".
- RUNOUT, a behind-the-cue-ball 3D view of the same positions, full screen, and a random-shot generator that only shows shots the physics pockets.
- Table Games nav icon is a pool table. The app icon is the POOL IQ wordmark.
- Cache `pool-iq-v14-2`, app version 14.
- v14-1: 8-ball runout plays the group (not the 1-ball), shows a breakout for a tied-up ball, 3D is a low view from behind the cue ball, and full screen is the table plus EXIT.
- v14-2: 3D view is a shaded table from behind the cue ball (wood rails, lit cloth, round balls, cue).
- v14-64: Bridges stays under Learn / Fundamentals only, as a photo button cropped from the closed-bridge page. It is not on the Learn home. Cache `pool-iq-v14-64`.
- v14-63: The optional table-game shot timer ticks while it runs and alarms once at zero. Mute quiets it. Friend's turn is off until turned on: Opponent pocketed does not start your clock, Opponent missed does. Cache `pool-iq-v14-63`.
- v14-62: Numbered how-to steps on 8-ball, 9-ball, 10-ball, Loop, Straight Pool, One Pocket, Cribbage, and Bank Pool start collapsed. A plus next to the title opens them and a minus closes them. The rules chips stay up. Cache `pool-iq-v14-62`.
- v14-61: Bridges in Learn and in Fundamentals shows the nine scanned bridge pages, in order. Cache `pool-iq-v14-61`.
- v14-60: Play with Friends lists every Table Games scorekeeper except Ghost (solo). Loop, Straight Pool, One Pocket, and Cribbage open the existing screens. Cache `pool-iq-v14-60`.
- v14-59: 8-ball, 9-ball, and 10-ball have a rules menu for WPA, BCA, APA, and bar. The short numbered how-to follows the set you pick. Cache `pool-iq-v14-59`.
- v14-58: Table games with a long rules paragraph now lead with a short numbered how-to. The full paragraph is one tap away. Cache `pool-iq-v14-58`.
- v14-57: Straight Pool (§7) and One Pocket (§12) scorekeepers from the WPA Rules of Play (effective 2025-09-15), plus Cribbage from the BCA Official Rules and Record Book (1992, pp. 75–76). Not full referees. Cache `pool-iq-v14-57`.
- v14-56: Loop is a Table Games scorekeeper for pool-backwards carom training. Solo score is total shots (lower is better). 1 vs 1 is a race to 8. No Career XP. Cache `pool-iq-v14-56`.
- v14-55: Each Billiard University exam can be restarted. That clears only that exam's sheet and scores, after a confirm. Reset this drill starts the current attempt over without the rest of the sheet. Cache `pool-iq-v14-55`.
- v14-54: Exam II – Skills Masters, Exam III – Advanced Shots, Exam IV – Runout Drill System, Exam V – Placement Pool Challenge, Exam VI – Safety Challenge, Exam VII – Draw Matrix, and Exam VIII – Follow Matrix are on Drill Sets & Exams. Scoring a drill fills that exam's sheet (attempts, yes/no, deductions, racks, or matrix cells). These drills are not on the All list and do not award Career rank. Cache `pool-iq-v14-54`.
- v14-53: Play Against the Ghost is back on Table Games, its own card above the rack counters, linking to the Ghost lobby (3- to 9-ball and 8-Ball Ghost). Play with Friends is a normal horizontal card again. The five rack counters stay. Cache `pool-iq-v14-53`.
- v14-52: Career rank emblems are the old badge again on every rank: gold crown, laurel leaves, gold star, and the CAREER RANK plaque. The ball is the real color for that rank (yellow 1, blue 2, red 3, purple 4, orange 5, green 6, maroon 7, black 8, yellow stripe 9, blue stripe 10), not a black 8-ball with a new number. Home keeps the emblem at 124px so the rest of Home stays visible. Drill Rank, Ball Pocketing, the Drill Sets photo, names, XP, and progression are unchanged. Cache `pool-iq-v14-52`.
- v14-51: Career ranks 8–10 (Elite, Pro, Champion) have the gold crown and the gold laurel leaves again, on the real ball, without the star or the CAREER RANK plaque. Ranks 1–7 stay the plain colored ball. On Home the emblem is the regular size (124px) so the rank card does not fill the screen. Drill Rank, Ball Pocketing, the Drill Sets photo, names, XP, and progression are unchanged. Cache `pool-iq-v14-51`.
- v14-50: Career rank emblems are just the ball. Ranks 1–7 are the colored ball only (no laurel wreath, star, banner, or crown). Elite, Pro, and Champion keep the crown on the ball and nothing else. Colors unchanged: yellow 1, blue 2, red 3, purple 4, orange 5, green 6, maroon 7, black 8, yellow stripe 9, blue stripe 10. Drill Rank, Ball Pocketing, the Drill Sets photo, names, XP, and progression are unchanged. Cache `pool-iq-v14-50`.
- v14-49: Career emblems are the real ball for that rank, in its own color, with the same laurel frame. Rookie is a yellow 1-ball through Master a maroon 7-ball, none of them crowned and none of them a black ball with a new number. Elite stays the black 8. Pro is a yellow-striped 9 and Champion a blue-striped 10, and only those three keep the crown. Numbers sit in a white circle except the black 8, which stays the approved gold circle. Drill Rank, Ball Pocketing, the Drill Sets photo, names, XP, and progression are unchanged. Cache `pool-iq-v14-49`.
- v14-48: Career emblems use the same 8-ball artwork, one ball per rank: Rookie 1 through Champion 10. Balls 1–7 have no crown; Elite, Pro, and Champion (8, 9, and 10) keep that crown. Home, Career, and Profile use the rank’s ball. Drill Rank chalk and Ball Pocketing cues are unchanged. Rank names, XP thresholds, and progression are unchanged. The Drill Sets & Exams card is the new photo (gray shirt, red sleeves), cropped to the same short wide frame so the face, the cue, and the ball stay in view. Cache `pool-iq-v14-48`.
- v14-47: The Drills photo card and the page it opens are named Drill Sets & Exams. The photo is a shorter wide strip (Efren Reyes stays) with a thin border and the name in a small chip. The list is still Exam I, Exam II Bachelors, Exam II Doctorate, and Safety Master. Safety Master drills stay out of All and the shot categories. No Career Rank XP change. Cache `pool-iq-v14-47`.
- v14-46: Drills opens with one Courses photo (Efren Reyes, 2012 World 9-Ball, Vinod Divakaran / Doha Stadium Plus Qatar, Wikimedia Commons). The course list is Exam I, Exam II Bachelors, Exam II Doctorate, and Safety Master. Safety Master drills are only in that course, not in All or the shot categories. Exam drills stay in their categories. No Career Rank XP change. Cache `pool-iq-v14-46`.
- v14-45: Safety Master, its own course on the Drills page with the Billiard University exams (not one of them). 77 drills from the scanned layouts, table photo plus the printed tip circle and lag-to-break bar, full printed paragraph. Also filed in Follow, Banks, Safeties, Kicks, Draw, or Stun. Banks stays shelved except these new bank drills. No Career Rank XP. Finishing the course records an accomplishment. Cache `pool-iq-v14-45`.
- v14-44: Rank-up thresholds are higher. Career and Drill Rank XP needed to rank up is ×3, except the last two ranks on each ladder (Pro and Champion; Drill Master and Drill Legend) which are ×5. Earned XP and award amounts are unchanged. Cache `pool-iq-v14-44`.
- v14-43: Billiard University Exam II – Skills, Bachelors and Doctorate (S1–S10 each). Separate accomplishments. Table photos only. No Career Rank XP. Banks stays shelved except these two bank drills. Cache `pool-iq-v14-43`.
- v14-42: Exam I diagrams are the cropped table photos (F1–F8). The drill maker keeps one ADD button for balls, lines, targets, labels, boxes, and an uploaded diagram. Cache `pool-iq-v14-42`.
- v14-41: Billiard University Exam I – Fundamentals (F1–F8) on the Drills page. Exact exam instructions and scoring. No Career Rank XP. Cache `pool-iq-v14-41`.
- v14-40: Home ranks show a whole chalk cube (blue top, paper sides, one rank number, transparent) and a whole cue, blended into the card. The header wordmark is the installed app icon (silver POOL, gold IQ). Drills no longer lists Full Table with Sidespin. A leading PKF is hidden on drill and category names; ids stay. Cache `pool-iq-v14-40`.
- v14-39: Home matches the ranks mockup. The header wordmark is POOLIQ (silver POOL, blue IQ, no gap) with TRAIN · ANALYZE · LEVEL UP. Career emblem is the crowned 8-ball, Drill Rank is the chalk cube, Ball Pocketing is the cue photo — those replace the old drawings everywhere ranks show. Ball Pocketing stays a level number (no invented name). Career names stay Rookie and the rest. Quick Access photos are crops of that mockup and open the existing pages. Backup on Home uses the existing backup file. Cache `pool-iq-v14-39`.
- v14-38: Drill rank names BALL BANGER, DRILLER, and STUDENT OF THE GAME (thresholds unchanged). Rank 9 drill emblem is an original green chalk cube. Home shows one combined rank card. Table Games keeps the five real-game counters; training modes moved into Drills → Career Drills with the same ids and unlocks. PKF is hidden on drill titles only. Listed pattern, slide, side-spin, tips, safety, and bank categories stay, with their drills removed from the library. Cache `pool-iq-v14-38`.
- v14-37: Ghost play does not add Career Rank XP or move Career rank just because he played. 8-Ball Ghost never does. 9-ball and every other rotation ghost use the same award: Career Rank XP only while that exact ghost task is the next open Career task. A win still completes the task when he reaches it. Drill Rank XP is unchanged. Foundation tasks stay. Cache `pool-iq-v14-37`.
- v14-36: Ghost games won counts the games he won in a set he won. A 3–0 or 3–1 set adds 3, not 1. A lost set adds nothing. 9-ball uses the same counter. Win rate stays sets won. Cache `pool-iq-v14-36`.
- v14-35: Signed in as andrewaphay@gmail.com, Dev Mode is already on. There is no passcode and no unlock step. Other accounts and signed-out use stay locked and do not see editor controls. Hold any words, or tap Edit on a paragraph, heading, or list. Save publishes that text for everyone (public read, owner email write). The shipped file stays in git. Cache `pool-iq-v14-35`.
- v14-34: Deleting a drill removes it from every list, category, search, and play entry for every account. There is no “hidden for everyone” row. The shipped file stays in git. If the deleted-id list fails to load, ids already known stay gone. Cache `pool-iq-v14-34`.
- v14-33: Learn card photos are crops of the mockup. Fundamentals is the bridge over the cue ball on green cloth. How to Play & Rules is the rack with the 8 on blue cloth. Two cards, captions unchanged. Cache `pool-iq-v14-33`.
- v14-32: Learn landing matches the mockup. Gold LEARN title, two photo cards only: a player bridging on Fundamentals, a rack of balls on How to Play & Rules. Captions unchanged. Cache `pool-iq-v14-32`.
- v14-31: Learn how-tos prefer Dr. Dave on billiards.colostate.edu. Bar is common American bar 8-ball from his bar-rules page and June 2025 article, plus the Cornerman sheet he links. Not an official book. Cache `pool-iq-v14-31`.
- v14-30: Learn is two photo cards: Fundamentals, and one How to Play & Rules card. A rule set lists every game that source publishes. How to Play picks a game, then a rule set, then a short sourced how-to. Cache `pool-iq-v14-30`.
- v14-29: Dev Mode can hide a built-in drill for everyone (confirm, then a public deleted-id row). Learn lists Fundamentals, How to Play, and Rules. Table Games adds 8-ball, 9-ball, 10-ball, WPA Bank Pool, and Ultimate Pool USA. Optional timer on 8, 9, 10, and bank. Cache `pool-iq-v14-29`.
- v14-7: while DEV MODE is unlocked, a shipped PKF drill can be corrected on the phone (balls, paths, pocket, tip, speed, technique, title, description, category). The correction overrides that drill id locally. Cache `pool-iq-v14-7`.

## What's new in v13 (changelog)

**Free online accounts** for a small group of friends, on Supabase's free tier. The app is still the static GitHub
Pages site and still works fully signed out and offline. Details: [docs/ONLINE_ACCOUNTS.md](docs/ONLINE_ACCOUNTS.md).

- **Sign in with email + password** (no magic links — they open in Safari instead of the installed iPhone app).
  Create account, sign in, sign out, forgot password and change password. Email confirmation is off, so an account
  works the moment it's created. The official supabase-js v2 UMD build is bundled in `js/vendor/` (no CDN, precached,
  so it loads offline too) and is only loaded when an account is actually used.
- **Profile sync**: the existing local profile (name + photo) syncs to a `profiles` table. Photos go in a public
  `avatars` storage bucket, still the same small 256×256 photos the app already makes.
- **Cloud save**: one private JSON backup per account in the existing v9 backup format (`saves`). Automatic upload
  ~20 s after a session, plus **Back Up to Cloud** and **Restore from Cloud** in Settings. On a new phone, signing in
  offers to restore — local data is never overwritten without a confirm step, and a snapshot is taken first.
- **Friends leaderboard** (`#leaderboard`, linked from Friends and Profile): everyone in the project, with photos,
  sortable by Lifetime XP, Career rank or Drill Rank. Tap a player for their public profile card. The numbers come
  from the existing public stats export (Career rank and ball level, Drill Rank, Lifetime XP, stars, Ghost record;
  the friend-match record only if the player switches it on in Settings).
- **Security**: row-level security on every table, owner-only writes, owner-only avatar uploads. The SQL (no secrets)
  is `supabase/schema.sql`.
- Cache `pool-iq-v13`, app version 13.

## What's new in v12 (changelog)


A visual restyle only: no features, routes, data or storage keys changed.

- **Font: Poppins** (400/500/600/700/800), bundled in `fonts/` as Latin subset WOFF2 files (~8 KB each) so it works offline. Poppins is licensed under the **SIL Open Font License 1.1**; the licence text is in `fonts/OFL.txt`. Big titles use small caps, so the text itself (copy/paste, screen readers, tests) keeps its normal case.
- **Theme:** deep navy background, rounded dark cards with thin borders, gold eyebrows and titles, cyan/blue accents, blue gradient primary buttons, red MISS / blue MADE result bar, circle attempt dots, a gear icon in the header, an arrow back button and a bottom nav with SVG icons (active tab raised in a card).
- **Tables:** every table diagram and the SPEED mini diagram now use teal cloth, a wood-grain rail with a dark cushion edge, white diamond-shaped sights, deep pockets with a rim and shaded balls. Gradient ids are unique per diagram, so several tables on one page never clash. Stage lists show a small thumbnail of each stage's table layout.
- **App icon:** new icon in the same style (POOL IQ wordmark over a mini table: wood rail, white diamonds, teal cloth, a dashed cue-ball bank line to the 1 ball): `icons/icon-192.png`, `icon-512.png`, `maskable-192.png`, `maskable-512.png` (safe-zone padded), `apple-touch-icon.png` (180), `favicon-32.png` and `favicon.svg`. Masters are in `icons/src/` (`scripts/make-icons.py` builds them, `scripts/render-icons.mjs` rasterises them).
- Game screens still fit a 375×667 phone without scrolling; controls keep their ≥ 44 px touch targets.
- **Versions:** `APP_VERSION` 12, service worker cache `pool-iq-v12` (fonts and favicons are precached).

## What's new in v11.1 (changelog)

- **Arcade is now "Table Games"** everywhere you see it: bottom nav, headings, back buttons, home action, Career requirement text ("Earn 240 Table Games stars"), Profile and DEV MODE text, and the docs. Internal route ids and storage keys are unchanged (`#arcade` still works, `#tablegames` is an alias, `arcade:` item keys are kept).
- **SPEED scale fix.** SPEED n = n table lengths of **total cue-ball travel measured from where the cue ball starts** (Andrew's reference: Ron the Pool Student's ICA cue-ball speed exercise; standard start on the first diamond at your end). Quarter steps (0.25) are allowed everywhere and every speed shows two decimals, like the ICA indicator: `SPEED 1.50`. Each speed has one plain meaning that names the stop diamond counted from your end rail:

| SPEED | Centre-ball lag from the first diamond |
|---|---|
| 0.25 | Rolls up the table. Stops on the 3rd diamond from your end, just before it reaches the side pockets. |
| 0.50 | Rolls up the table. Stops on the 5th diamond from your end, just past the side pockets. |
| 0.75 | Rolls up the table. Stops on the 7th diamond from your end, 1 diamond short of the far rail. |
| 1.00 | Up to the far rail and back. Stops on the 7th diamond from your end, 1 diamond off the far rail. |
| 1.25 | Up to the far rail and back. Stops on the 5th diamond from your end, just before it reaches the side pockets. |
| 1.50 | Up to the far rail and back. Stops on the 3rd diamond from your end, just past the side pockets on the way back to you. |
| 1.75 | Up to the far rail and back. Stops on the 1st diamond from your end, back on the start spot. |
| 2.00 | Up, back off your end rail, and out again. Stops on the 1st diamond from your end, right back on the start spot. |
| 2.25 | Up, back off your end rail, and out again. Stops on the 3rd diamond from your end, just before it reaches the side pockets. |
| 2.50 | Up, back off your end rail, and out again. Stops on the 5th diamond from your end, just past the side pockets. |
| 2.75 | Up, back off your end rail, and out again. Stops on the 7th diamond from your end, 1 diamond short of the far rail. |
| 3.00 | Up and back, then up and back again. Stops on the 7th diamond from your end, 1 diamond off the far rail. |
| 3.25 | Up and back, then up and back again. Stops on the 5th diamond from your end, just before it reaches the side pockets. |
| 3.50 | Up and back, then up and back again. Stops on the 3rd diamond from your end, just past the side pockets on the way back to you. |
| 3.75 | Up and back, then up and back again. Stops on the 1st diamond from your end, back on the start spot. |
| 4.00 | Up and back twice, then out again. Stops on the 1st diamond from your end, right back on the start spot. |
| 4.25 | Up and back twice, then out again. Stops on the 3rd diamond from your end, just before it reaches the side pockets. |
| 4.50 | Up and back twice, then out again. Stops on the 5th diamond from your end, just past the side pockets. |
| 4.75 | Up and back twice, then out again. Stops on the 7th diamond from your end, 1 diamond short of the far rail. |
| 5.00 | Up and back twice, then up and back again. Stops on the 7th diamond from your end, 1 diamond off the far rail. |

  - A **mini-table diagram** (START ball, numbered cushion turns, numbered diamonds, `STOP · 3rd diamond` marker) sits next to the meaning in the Shot Recipe, the simulator speed readout, the speed drills, calibration and Create Drill.
  - Updated everywhere speed appears: `js/games/speed.js`, the simulator's `SPEED_TABLE` (recalibrated to lags from the first diamond; every quarter step stops on the diamond its meaning names), Shot Recipe tooltip and dial (ticks every 0.25), calibration texts, Speed Ladder names/texts (all lags now start on the first diamond; "SPEED 1.50 — Back to the 3rd Diamond"), coaching planner choices (every quarter step 0.50–5.00), geometry rounding (quarter steps, so a few stage recipes moved by 0.25), Create Drill ±0.25 stepper and "why this speed" texts. `.pooliq` files accept 0.25 steps; old 0.5-step files are unchanged and still valid.
  - Saved calibration data keeps working (old keys such as `"2.0"` are read and appended to; quarter steps get keys like `"1.25"`).
- **New drill: Three-Lane Speed Exercise** (Drills → Speed Control, also linked from the Speed Ladder page). Three lanes up the table, each cue ball on the first diamond at your end: left SPEED 1.50 (3rd diamond, just past the side pockets on the way back), center SPEED 2.50 (5th diamond, just past the side pockets on the way out again), right SPEED 3.00 (7th diamond, 1 diamond off the far rail). Centre-ball hit, Speed Ladder scoring (tap bullseye / middle / outer / missed short or long), 5 attempts per lane, pass with 7★ in every lane. Earns Lifetime XP, Drill XP and Drill Rank. Inspired by Ron the Pool Student's ICA cue-ball speed exercise.
- **Shot Simulator full-path aim preview.** The simulator's own physics runs headlessly at the chosen SPEED and tip and draws the complete path of the cue ball (white dashes) and every ball it moves (object ball gold dots, others thin in their colour) through every rail bounce. Rail contacts are numbered 1, 2, 3…; the end is marked with a highlighted pocket + **POCKET** tag (or **SCRATCH** for the cue ball), or an end ring with **STOP** / **MISS**. It updates live as aim, speed or spin change (throttled to 80 ms, capped at 40,000 physics steps) and its final positions are exactly what SHOOT produces (`verify.mjs` and e2e both check this). Hidden during the Target Game; Settings → Full-path preview turns it off.
- **Tip clock.** Under the tip text ("Top Right", "Draw 1 tip") the simulator's cue-ball panel, the Shot Recipe gauge, the recipe card, the planner and Create Drill show a clock reading, e.g. "1:30 o'clock", or "Center" (reuses `tipClockLabel()` from `js/games/recipe.js`).
- **Cue-ball tip picker pop-up.** Tap the small cue-ball image in the Shot Simulator or Create Drill and a compact popover opens right next to it: a cue ball about 30% of the screen width (≈120 px on a 390 px phone) whose contact dot you press and drag (touch or mouse, Pointer Events; the dot has a ≥ 44 px hit area). The value stays on a ¼-tip grid inside the miscue limit (1½ tips from centre, dashed red circle; Create Drill also keeps side spin within ±1 tip like the `.pooliq` schema). Under the ball: the live tip text ("Top Right"), the clock reading ("1:30 o'clock") and the exact offsets ("↑ 1 · → 1 tips"), then CENTER and a big DONE button; tapping outside or Escape also closes it. In the simulator the full-path preview follows the drag live. Quarter tips now read "¼ / ¾" instead of being rounded to "½".
- **Speed drill screens** (Speed Ladder lags and the Three-Lane exercise) show the lane, the plain speed meaning and the mini diagram in one compact block in place of the goal line, so they still fit a 375×667 phone without scrolling. The Three-Lane table shows all three lanes and target circles with the current lane highlighted.
- **Versions:** `APP_VERSION` 11.1, service worker cache `pool-iq-v11-1`. No storage keys changed.

## What's new in v11 (changelog)

- **Career ball levels.** Each Career rank (Rookie … Pro) has 10–15 ball levels filled by **Rank XP**, for example *Shooter · 7-Ball*. **Champion** is the max rank: Rank XP stops, Lifetime XP continues, and it has its own stats screen. The rank names, requirements and Boss Battles are unchanged. See [docs/RANKING_AND_XP.md](docs/RANKING_AND_XP.md).
- **XP formula.** XP depends on difficulty tier and performance, with bonuses for first clears, PBs and perfect sessions. Repeating mastered items or grinding the same item on one day earns less, and each tier has a Rank XP cap (shown as MAXED). **Lifetime XP** is permanent.
- **Mastery per item:** PASSED ⭐ / STRONG ⭐⭐ / MASTERED ⭐⭐⭐, shown on Table Games stages, drills and content.
- **12 skill levels** (Straight Cueing … Pattern Play), each shown as "<rank> <ball>". One session trains several skills by weight. Skill Breakdown and Recommended Training screens are included.
- **Skill Gates** hold your ball inside a rank until foundations are passed. **Promotion Tests** (the rank's Boss Battle) unlock only with full Rank XP, cleared gates, skill floors, mastery counts and the existing Career requirements. See [docs/SKILL_GATES_AND_PROMOTIONS.md](docs/SKILL_GATES_AND_PROMOTIONS.md).
- **Drill Rank** (BALL BANGER → Drill Legend) is separate from Career. It is earned only from built-in drills, Create Drill drills and rank-eligible installed `.pooliq` content. It never comes from Play Test, Table Games, Ghost or PvP.
- **Friends / PvP:** players with photos, live rack-by-rack scoring (hill-hill, undo, advanced stats), quick scores, head-to-head, group sessions, single-elimination brackets (seeding, byes) and round robins (documented tiebreakers). PvP never changes training progress. See [docs/FRIENDS_AND_TOURNAMENTS.md](docs/FRIENDS_AND_TOURNAMENTS.md).
- **Local player profile** (`#me`): display name, photo (take or choose, cropped to a 256 px square), Career ball badge plus Drill Rank on the Profile header, and a stats page with an exportable **public stats** summary. It is sync-ready (stable UUID, `updatedAt`), but no online features are built.
- **DEV MODE** (Settings → DEV MODE, passcode stored as a salted SHA-256 hash) has built-in stage overrides, an overrides pack export, unrestricted My Content, mark official/eligible, seeded test progression with restore, cache tools and a storage key viewer. Every action snapshots first. See [docs/DEV_MODE.md](docs/DEV_MODE.md).
- **`.pooliq` optional fields:** `rankXpEligible`, `baseXP`, `primarySkill`, `secondarySkills`, `skills`, `skillWeights`, `mastery`, `metadata.official`, and tier words for `difficulty`. v10 files are unchanged and still valid.
- **Migration:** runs automatically and once, with a snapshot first. It replays saved history into XP and mastery and **never demotes**.
- **Storage:** new keys `poolIQFriendsV1`, `poolIQProfileV1`, `poolIQDevV1` and `poolIQDevOverridesV1` are all mirrored, snapshotted and backed up. Service worker cache `pool-iq-v11`.


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
| Hash router / boot | `js/app.js` (`#home #career #drills #analyze #arcade (alias #tablegames, shown as Table Games) #profile #settings #ghost #gate #promo #skills #skill/<id> #training #champion #drillrank #friends #friend/<id> #h2h/<a>/<b> #fmatch #fsession/<id> #tourney/<id> #tnew #me #me/stats #dev #devgame/<id> #devedit/<game>/<stage> #devkeys #game/<id> #play/<game>/<stage> #boss/<id> #bossplay/<id> #sim #sim/s=<code> #sim/target #drillnew #drilledit/<id> #content #cimport #cview/<ref> #cplay/<ref>[/<stage>] #cedit/<uid>[/<loc>]`) |
| Challenge data model + geometry | `js/games/geometry.js`, `js/games/builders.js` (position, pot, lag, bank, kick, carom, safety, train) |
| Game content | `js/games/data/*.js` (one file per game plus `bosses.js`), `js/games/registry.js` |
| Engine (pure) | `js/games/engine.js`: sessions, scoring modes (zone, lives, kick, train, stars, binary, sniper, ladder, calibration, pattern), unlocks, PBs, bosses |
| Teaching components | `js/tableDiagram.js` (shared table SVG + diamond grid), `js/games/stageTable.js` (routes/zones), `js/games/recipe.js` (Shot Recipe gauges, Setup line, Why), `js/games/aimView.js` (Aim View maths + SVG), `js/games/diamonds.js` (diamond readout), `js/games/cueBallDiagram.js`, `js/games/coaching.js` (Beginner → Expert) |
| SPEED system | `js/games/speed.js`: SPEED 0.25–5.00 in quarter steps (SPEED n = n table lengths of total travel from where the cue ball starts), plain meanings, personal calibration, table size and cloth; `js/games/speedDiagram.js`: mini-table speed diagram |
| Screens | `js/ui/play.js` (every game, drill and boss), `js/ui/sheet.js`, `js/dashboard.js`, `js/ghost.js` |
| Career / skills | `js/career.js` (game levels, Ghost wins, Boss Battles), `js/skills.js` (ratings computed from results) |
| Shot Simulator | `js/sim/physics.js` (deterministic ball physics), `js/sim/layouts.js` (racks, random layouts, snap, validation), `js/sim/solver.js` (throw-compensated aim, Find a Shot, shape zones, Target Game), `js/sim/share.js` (URL/JSON share format), `js/sim/library.js` (saved shots + settings), `js/ui/simulator.js` (screen) |
| Create Drill | `js/customDrills.js` (builder model, validation, simulated route, challenge builder, storage, import/export), `js/ui/drillBuilder.js` (screen) |
| Progression (v11) | `js/progression/config.js` (every number), `award.js` (session XP + mastery), `rank.js` (career / gates / promotion / Drill Rank / training / Champion), `skillLevels.js`, `catalog.js` (item descriptors), `sessions.js`, `migrate.js`, `badge.js` (ball / Drill Rank badges, avatars), `js/ui/progression.js` |
| Friends / PvP (v11) | `js/friends/model.js` (players, matches, H2H, sessions), `js/friends/tournament.js` (brackets, round robin, standings), `js/ui/friends.js` |
| Profile (v11) | `js/profile.js` (local profile, photo crop, public stats), `js/ui/me.js` |
| DEV MODE (v11) | `js/dev/dev.js`, `js/dev/overrides.js`, `js/ui/dev.js` |
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
  - Every level is a full 15-ball rack. Difficulty is ball-in-hand takes after the break: Beginner 5, Intermediate 3, Advanced 2, Pro 0. Ball in hand on the break does not count. Your choice is remembered (`poolIQGhostPreset`).
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
3. **Speed dial** shows the needle on Pool IQ's SPEED 0.5–5.0 scale (ticks every 0.25). The recipe card adds the plain speed meaning and the mini-table diagram; the tip rows add the clock reading ("1:30 o'clock").

### Camera-ready hook

Every attempt is saved with `resultSource: 'manual'`. A future camera module can call `registerResultAdapter({ id, available, verifyAttempt(challenge, outcome) })` from `js/analyze.js`. From then on, the play screen passes each tapped outcome through the adapter before saving it, so the attempt records the adapter's `resultSource`.

## Shot Simulator (`#sim`)

A pool-table simulator for planning and studying shots. It is a **physics approximation**, and the UI says so. Use it to learn patterns, not as a guarantee of what the real table will do.

- **Table:** the shared true-scale renderer (100 × 50 playing surface, ball radius 1.125, diamond grid full/half/off). The SETUP readout lists every ball in diamonds.
- **Placing balls:** drag a ball to move it (optional ¼-diamond snap, live position bubble, page never scrolls while dragging). Tap the tray to add or remove balls 1–15.
- **Aiming:** drag the felt to aim, or tap an object ball to aim at it (tap again to cycle pockets, throw-compensated). You can also tap a pocket to aim the last ball there. ±1° / ±0.1° nudge buttons, aim readout, ghost ball, Aim View gauge, tangent line.
- **Cue:** tip position uses the contact diagram (±1.5 tips, squirt included). SPEED 0.30–7.00 on Pool IQ's scale (SPEED n = n table lengths of total travel from where the cue ball starts), ±0.25 buttons, plain meaning + mini-table diagram, with optional personal calibration. Under the tip text a clock reading ("1:30 o'clock" / "Center"). Tap the small cue ball to open the drag-to-set tip pop-up.
- **Full-path aim preview (v11.1):** the real physics runs ahead at the current SPEED and tip; every ball's full path through every rail is drawn with numbered rail contacts and a POCKET / SCRATCH / STOP / MISS end marker. It matches SHOOT exactly (`js/sim/preview.js`).
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
- **SPEED:** `SPEED_TABLE` maps SPEED → launch speed by simulating centre-ball lags, so SPEED n is exactly n table lengths of travel for a lag starting on the first diamond (x = 12.5). Regenerate it with `node scripts/gen-speed-table.mjs` after changing constants; `verify.mjs` fails if it goes stale.
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

## Drill library

The built-in library holds the **Three-Lane Speed Exercise** (`js/games/data/threeLaneSpeed.js`, v11.1). Build more in the app with **Create Drill** (above), or add them in code as described here.

Drills use the same challenge data model as the Table Games. Each new drill automatically gets:

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

Before shipping new drills, run `node scripts/verify.mjs`. It applies the same geometry checks to every drill that it applies to the Table Games stages. You can also call `geometryProblems(challenge)` from `scripts/geometryCheck.mjs` directly.

## My Content and .pooliq files (v10)

**Drills tab → MY CONTENT** (`#content`). Tap **IMPORT CONTENT** and pick a `.pooliq` file from Files, iCloud Drive or Downloads. The flow is: validate → **preview** (`#cview/pending`, same table, Shot Recipe and SPEED as normal play) → **PLAY TEST** (`#cplay/pending`, normal play screen, nothing saved) → **ADD TO MY CONTENT** or **DISCARD**. Nothing is installed until you choose to add it.

- Content types: `drill`, `challenge` (diamond / rail answer, player solution), `lesson` (Teach → Guided → Solve it yourself → Execute → Test), `game` (gauntlet, target, streak, lives, scoreAttack, multiStage, quizExecution) and `pack` (ordered stages, locks, progress %).
- The format is strict JSON and data only. Files are capped at 512 KB. Unknown keys, script-like strings, prototype keys and non-http(s) URLs are rejected, and all text is rendered as text. The full reference, written so another AI can generate valid files, is in `POOLIQ_CONTENT_SCHEMA.md`.
- Installed items live in `poolIQContentV1` and personal bests and progress in `poolIQContentProgressV1`. Both are mirrored, snapshotted and backed up like every other key. Imported content never changes Career, ratings, history or achievements.
- If an item with the same id is already installed, you choose **REPLACE / KEEP BOTH / CANCEL** (installed vs incoming `contentVersion` shown). **EDIT** opens the visual builder in content mode. **EXPORT** shares a `.pooliq` file (or downloads it); the round trip is lossless.
- Old Create Drill JSON exports still import (into My Drills).

## Career

A rank's requirements are Table Games levels, Ghost wins and that rank's Boss Battle; some higher ranks also require star totals or PBs. From v11 the boss is the rank's **Promotion Test**. It unlocks when every non-boss requirement is met **and** the rank's Rank XP is full (top ball, Skill Gates cleared), skill floors are reached and enough items are STRONG/MASTERED. Beating the boss is the only way to promote, and XP never promotes by itself. Details: [docs/RANKING_AND_XP.md](docs/RANKING_AND_XP.md) and [docs/SKILL_GATES_AND_PROMOTIONS.md](docs/SKILL_GATES_AND_PROMOTIONS.md).

## Online accounts (v13)

Optional, and the app is unchanged without one. Settings → **Online account · Cloud save** (or Profile → Online
Account): create an account or sign in with email and password, back up to the cloud, restore on a new phone, and
open the **Friends Leaderboard**. Setup, what's stored where, and how to reset a friend's password:
[docs/ONLINE_ACCOUNTS.md](docs/ONLINE_ACCOUNTS.md).

## Local player profile (v11)

- `#me` (Profile → EDIT, or Settings → Profile): set a display name and a photo. **TAKE PHOTO** opens the camera (`<input type="file" accept="image/*" capture="user">`) and **CHOOSE PHOTO** opens your library. The image is centre-cropped to a square and downscaled to 256×256 WebP (JPEG fallback) as a data URL of at most ~90 KB. Without a photo the avatar is a ball badge with your initials.
- The Profile and Career headers show your photo, name, Career ball badge and Drill Rank badge. `#me/stats` shows your training stats plus the **public stats** object, which you can save as a file.
- Stored in `poolIQProfileV1 = {schema, id (UUID), displayName, avatar, createdAt, updatedAt}`. It is mirrored, snapshotted and backed up. You are the "me" player in Friends, with the same id and photo.
- **Sync-ready, not synced.** `publicStats()` (`js/profile.js`) returns `{format: 'pool-iq-public-stats', schema, profileId, displayName, generatedAt, profileUpdatedAt, career {rank, ball, title, champion, lifetimeXp}, drillRank, mastery, skills, ghost, devSeeded}`. That is a clean summary a future account service (Supabase/Firebase) could upload for accounts and leaderboards. It has no PvP data, and DEV-seeded states are flagged. No online features and no leaderboards exist in the app.

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
  - SPEED calibration (SPEED n = n lengths from the first diamond; table not stale)
  - v11.1: every speed meaning names the diamond the simulator and the mini diagram stop on; quarter steps in the schema; old calibration keys; Three-Lane drill lanes, per-lane pass rule and Drill XP; full-path preview final positions identical to SHOOT (SPEED 7 multi-rail kick, spin, pot, break); tip clock; tip picker limits (miscue circle, ¼ grid, ±1 side spin in Create Drill); quarter-tip wording; no user-visible "Arcade" text
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
- service worker precaches every module (cache `pool-iq-v11`)
- **v11 progression:** ball from Rank XP, gate hold/release, Rank XP never promotes, first clear / PB / perfect bonuses, mastered-repeat and same-day reductions, fail cap, participation, tier caps (MAXED), Create Drill tier limit, Champion (MAX RANK, Rank XP stops, Lifetime continues, stats), overflow carry, multi-skill XP and skill-level rise, "<rank> <ball>" labels, mastery thresholds, gate latching, promotion checklist, `.pooliq` progression metadata (tier words, weights, base XP, unknown-skill error, v10 files still valid), Play Test never awards
- **Drill Rank:** 8 names, thresholds, XP alone is not enough, mastered-repeat anti-farming, Table Games/Ghost/PvP never count
- **Migration:** runs once, idempotent, never demotes, Lifetime XP ≥ old XP, history replayed
- **Friends / tournaments:** duplicates, live scoring, hill-hill, final-score rules, H2H, player stats, archive on remove, group session pairing, seed order, byes, auto-advance, champion, clear rules, round-robin schedule and tiebreakers
- **Profile:** stable UUID, name cleaning, updatedAt, unsafe/oversized photo rejected, public stats shape
- **DEV MODE:** salted hash only, lock / wrong / unlock / auto-lock / no change while locked, overrides apply / reset / export / re-import, editable-stage rules, mark official, seeded progression flags, stash + restore real progress with snapshot, vault keys and v10/v11 backups

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
- v11.1: "Table Games" nav label fits at all 4 sizes, `#tablegames` alias, no "Arcade" text on the main screens; Speed Ladder / Recipe / simulator speed meaning + mini diagram (`STOP · 3rd diamond`); SPEED 7 full-path preview with numbered rails, POCKET / STOP markers, live redraw on aim / SPEED / spin, and SHOOT ending exactly where the preview said (pot + multi-rail kick); preview hidden in the Target Game; tip clock under the tip text (simulator + Shot Recipe); tip picker pop-up at 390×844, 375×667, 412×915 and 360×800 (compact ≈30%-width ball near the small cue ball, ≥ 44 px dot hit area, touch + mouse drag, live text / clock / offsets / preview, miscue limit, CENTER, DONE, tap outside) and in Create Drill; Three-Lane Speed Exercise (3 lanes, lane switching, per-lane pass, Drill XP) fitting without scrolling at all 4 sizes; zero console errors
- **v11:** Career ball badge, gate, Promotion Test locked → unlocked, Skill Breakdown, Recommended Training, Drill Rank, result-screen XP lines; profile name + photo upload (256×256) + public stats + backup key; Friends: players, live match to hill-hill, H2H, group session, single-elimination champion, round robin; PvP doesn't change XP; DEV MODE passcode / hash / lock / override save / export / reset / re-import / seed Champion / restore real; no sideways overflow at 4 phone sizes; zero console errors
- service worker (cache v11) and offline reload

## Storage

- `localStorage` key `poolIQStateV4`. It migrates from `poolIQStateV3` and `poolIQStateV2`, and the old keys are left intact as backups.
- The in-progress session (`activeSession`) and Ghost match (`activeGhost`) are saved after every tap, so a reload resumes play.
- Shot Simulator: `poolIQSimV1` (current table, saved shots, collections, settings, Target Game best). Create Drill: `poolIQCustomDrillsV1` (custom drills), `poolIQDrillWip` (unsaved builder work), `poolIQDrillDraft` (simulator → drill hand-off). These are new keys, so existing saves are untouched.
- My Content (v10): `poolIQContentV1` (installed .pooliq documents) and `poolIQContentProgressV1` (personal bests, pack stage progress). These are new keys; nothing existing is migrated or rewritten.
- v11: `poolIQStateV4.prog` (progression: Rank/Lifetime/Drill XP, item mastery, gates, events), `poolIQFriendsV1` (players, matches, sessions, tournaments), `poolIQProfileV1` (local profile), `poolIQDevV1` (DEV passcode hash + settings), `poolIQDevOverridesV1` (DEV stage overrides). All are new keys or additive fields.
- Ghost setup: `poolIQGhostPreset`. Vault bookkeeping (save sequence, last backup, dismissed tips, protected-storage result): `poolIQMetaV1`.
- IndexedDB (`poolIQ_idb` / `blobs`, helpers `idbPut`/`idbGet`/`idbDelete` in `js/storage.js`) holds the safety copy and snapshots — see Data safety below.

## Data safety (`js/vault.js`, Settings → Protect your history)

History must never be lost, on iPhone or Android.

- **Every key is mirrored.** All data keys (`poolIQStateV4`, legacy `poolIQStateV3`/`V2`, `poolIQCustomDrillsV1`, `poolIQSimV1`, `poolIQGhostPreset`, `poolIQDrillWip`, `poolIQDrillDraft`, `poolIQContentV1`, `poolIQContentProgressV1`, and in v11 `poolIQFriendsV1`, `poolIQProfileV1`, `poolIQDevV1`, `poolIQDevOverridesV1`) are copied to IndexedDB (`mirror:current`) shortly after every save and when the app is hidden/closed. Each write bumps a save sequence + `savedAt` timestamp in `poolIQMetaV1`.
- **On load** the app picks the good copy before anything renders: missing or corrupt localStorage → restored from IndexedDB (and a corrupt single key is repaired); a missing IndexedDB copy is rebuilt from localStorage; otherwise the newer `savedAt` wins. A good copy is **never** replaced by an empty/default state — only a deliberate RESET or restore may do that.
- **Snapshots:** the last 3 are kept in IndexedDB (`mirror:snapshots`): one automatically at most every 6 hours of use, plus one right before any reset or restore. Settings → **Restore previous snapshot** (with confirm; the replaced data becomes a snapshot too).
- **Backup file:** Settings → **Back Up Now** makes one `PoolIQ-backup-YYYY-MM-DD.json` (`format: "pool-iq-backup"`, `schema`, `appVersion`, `exportedAt`, `summary`, `keys`). It uses the Web Share API with the file when the browser allows it (iPhone share sheet → Save to Files / iCloud Drive), otherwise a download (Android Chrome → Downloads, then share to Drive if you like). A **Download file instead** button appears when sharing is available.
- **Restore from Backup** reads a `.json`, validates it, shows rank / sessions / Ghost games / custom drills / saved shots / date, and replaces everything only after **Restore (replace my data)**. Current data is snapshotted first. Old saves (bare V2/V3/V4 state files, older backup schemas) go through the normal migration.
- **Protected storage:** `navigator.storage.persist()` is requested at start-up (and again on the first tap if refused); Settings shows ON / OFF / not supported and `navigator.storage.estimate()` usage.
- **Reminder:** Settings shows “Last backup: never / N days ago”; Home shows a small dismissible card when there's real progress (3+ sessions, matches, drills or shots) and no backup for 7+ days. No modal.
- **RESET ALL PROGRESS** is two steps plus typing `RESET`, and takes a snapshot first.
- **Install:** manifest has `id`, `start_url`/`scope` `./` (= `/pooltraining/` on GitHub Pages), `display: standalone`, theme/background colours, 192 + 512 `any` and `maskable` PNGs, plus a 180 px `apple-touch-icon`. Settings (and Home, dismissible) offer **Install App**: Android/Chrome uses `beforeinstallprompt`; iPhone Safari shows Share → Add to Home Screen steps; hidden when running installed.

**Limits:** there is no cloud sync — the backup file is the off-device copy. Deleting the app / home-screen icon, “Clear website data”, or a factory reset wipes both localStorage and IndexedDB, and a Safari tab and the Home Screen app keep separate storage on iPhone. Safari may also clear storage of a site you haven't opened in a while if it isn't added to the Home Screen.
