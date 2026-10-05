# DEV MODE (v11)

Only **andrewaphay@gmail.com** can use DEV MODE. There is no passcode.

Other accounts and signed-out use stay locked. They do not see the Settings entry, the switch, or editor controls.

## ON / OFF switch (v14-92)

**Settings → DEV MODE** has an **ON / OFF** switch (also at the top of the `#dev` screen). It shows only while the owner account is signed in. It is saved on this device in `poolIQDevV1` (`on`). It starts **ON**.

- **ON**: every edit button shows (drill EDIT, on-screen words Edit, owner Delete, DEV TOOLS). Every locked drill, level and stage opens: Drill Sets (Off the Rail levels and exam, Trick Shot levels and exam, Rack Dropping levels), Ball Pocketing levels, Career Drills stages and Endless, and My Content pack stages. A locked item opens as a **DEV PREVIEW**: it plays normally but saves nothing (no score, no stats, no XP, no unlock). Items you have already unlocked play normally and save normally.
- **OFF**: no edit buttons anywhere. Locks work exactly as for every player until you pass them.

The gate is `isUnlocked()` in `js/dev/dev.js`: owner email **and** the switch ON. Course screens ask `devBypass()` in `js/dev/gate.js` (wired to `isUnlocked()` by `app.js`). Boss battles / promotion tests stay locked (they promote your Career rank). Career XP, scoring and unlock rules are unchanged.

## No passcode

- Signing in as the owner account is the only way in.
- A passcode cannot unlock the tools. There is no passcode screen.

## Tools

| Tool | What it does |
|---|---|
| **Built-in content overrides** (`#devgame/<game>`, `#devdrills`) | Opens any built-in drill or Table Games stage in the phone editor. Title, description, and the table (when it has balls) save as a local override. Shipped files are not edited. **RESET TO ORIGINAL** removes one override. |
| **Export overrides** | Downloads every override as one `.pooliq` pack (stage ids `ov--<game>--<stage>`). Importing that pack in DEV MODE applies the overrides again. |
| **My Content without restrictions** | While unlocked, pack stages are all playable (no unlock order) and installed content can be edited. |
| **Mark content official / eligible** | Sets `metadata.official`, `careerEligible` and `rankXpEligible` on installed content. The content is still validated. |
| **Seed test progression** | Jump to any Career rank and ball, Champion, or any Drill Rank to check screens. The seeded state is **flagged DEV** (a banner shows on every screen, and public stats show `devSeeded: true`). Your real data is stashed first. |
| **Restore my real progress** | Puts back the stashed real data (the test state is snapshotted first). Your passcode and overrides are kept. |
| **Clear caches** | Clears the service-worker caches and the stage cache. Your data is not touched. |
| **Storage key viewer** (`#devkeys`) | Lists every localStorage key with its size and a short read-only preview. The passcode hash is hidden. |
| **Version / cache info** | Shows the app version, cache name, schema version and progression version. |

## Safety

- **Every DEV action takes a vault snapshot first** ("Before DEV …"). You can undo any of them from **Settings → Restore previous snapshot**.
- Overrides and DEV settings are saved in their own keys. They are mirrored to IndexedDB, included in snapshots and in **Back Up** files.
- Seeded states never touch your real stash. Starting a second seed keeps the original real data.

## Files

- `js/dev/dev.js`: passcode, auto-lock, seeding, override pack export/import, storage keys.
- `js/dev/overrides.js`: the override layer (`stage:<game>:<stage>` → `.pooliq` doc).
- `js/ui/dev.js`: screens.
- `js/games/registry.js`: applies overrides when stages are built (`clearStageCache()`).

## Built-in drill corrections (v14-7)

While DEV MODE is **unlocked**, opening a shipped PKF drill shows **EDIT**. That editor is not on drill cards, and it is not rendered at all while DEV MODE is locked — a signed-in friend does not see it.

The gate is the owner account (`isUnlocked()`). It is true only while andrewaphay@gmail.com is signed in. There is no passcode. Any other account stays locked.

**SAVE** (under the table, and again in the bottom row) publishes that drill to Supabase `drill_overrides`. Every visitor reads those rows on load. If a row exists, it replaces the shipped drill for everyone. Only the owner account can write; another account, or Dev Mode unlocked with the passcode alone, cannot publish. The built-in file is not changed. **RESET** drops unsaved edits and does not delete the published row. **EXPORT THIS** downloads the drill as a `.pooliq` file. **IMPORT DRILL** (next to Export) reads that same `.pooliq` file, a JSON object in that shape, or a JSON wrapper with a `drills` array when the array has exactly one drill or one drill whose id is the drill open now. The table updates immediately (balls, lines, pockets, title, description, link, bullseye). Nothing is published until **SAVE**. Leaving the editor or going back without SAVE does not publish and does not wipe the live drill. A file that is not a drill this app understands shows a short error and does not change the table. **REMOVE OBJECT LINE** deletes the object-ball path only. **REMOVE CUE LINE** is the control that deletes the cue path. **EXPORT ALL** downloads phone copies as one JSON file. A new cache (`skipWaiting` + `clients.claim`) reloads an already-open Home Screen app once. It does not reload in a loop.

## On-screen words (v14-35)

While the owner account is signed in, hold any visible words, or tap **Edit** on a paragraph, heading, or list item (a rules paragraph included). **SAVE** writes `public.text_overrides`. Every visitor reads that row. The shipped file stays in git. **USE ORIGINAL** deletes the row. Another account cannot write. There is no passcode. `poolIQDevCopyV1` is only the last good read, so a failed load keeps words already published.
