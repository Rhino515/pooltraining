# DEV MODE (v11)

DEV MODE is a hidden set of tools for building and testing content on your own device. Open it from **Settings → DEV MODE**.

> **Honesty notice (also shown in the app):** the passcode is a convenience lock on this device only. It is not server security and it does not protect data from anyone who can open the browser's developer tools. Pool IQ has no server, and nothing in DEV MODE is sent anywhere.

## Passcode

- On first use you choose a passcode of at least 4 characters. Only a **salted SHA-256 hash** is stored (`poolIQDevV1 = {salt, hash, autoLockMin, seeded}`), never the passcode itself. The key is backed up like your other data.
- Unlocking lasts for this app session only (it is kept in memory), so a reload locks again.
- **Auto-lock** after 5, 15 or 60 idle minutes (default 15), or only when the app is closed. **LOCK** locks immediately.
- The passcode can be changed only while unlocked. To lose DEV MODE entirely, Reset or restore a backup without the key.
- Users without DEV MODE never see the tools. The routes redirect to the passcode screen while locked.

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

The gate is DEV MODE (`isUnlocked()`). The device passcode still unlocks this phone. The signed-in owner account stays unlocked without typing that passcode. Any other signed-in account stays locked.

**SAVE** (under the table, and again in the bottom row) publishes that drill to Supabase `drill_overrides`. Every visitor reads those rows on load. If a row exists, it replaces the shipped drill for everyone. Only the owner account can write; another account, or Dev Mode unlocked with the passcode alone, cannot publish. The built-in file is not changed. **RESET** drops unsaved edits and does not delete the published row. **EXPORT THIS** downloads the drill as a `.pooliq` file. **IMPORT DRILL** (next to Export) reads that same `.pooliq` file, a JSON object in that shape, or a JSON wrapper with a `drills` array when the array has exactly one drill or one drill whose id is the drill open now. The table updates immediately (balls, lines, pockets, title, description, link, bullseye). Nothing is published until **SAVE**. Leaving the editor or going back without SAVE does not publish and does not wipe the live drill. A file that is not a drill this app understands shows a short error and does not change the table. **REMOVE OBJECT LINE** deletes the object-ball path only. **REMOVE CUE LINE** is the control that deletes the cue path. **EXPORT ALL** downloads phone copies as one JSON file. A new cache (`skipWaiting` + `clients.claim`) reloads an already-open Home Screen app once. It does not reload in a loop.

## On-screen words (v14-8)

While DEV MODE is unlocked, **Hold words to rename** lets you change page titles, nav labels, buttons and other visible copy. The new words are stored in `poolIQDevCopyV1` on this phone. A different signed-in account still sees the original words. Nothing is uploaded.
