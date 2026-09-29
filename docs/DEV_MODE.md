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
| **Built-in content overrides** (`#devgame/<game>`) | Opens any single-shot Table Games stage in the drill builder. Saving stores an **override layer** in `poolIQDevOverridesV1`; the built-in source files are never edited. Overridden stages show a DEV badge. **RESET TO ORIGINAL** removes one override. Calibration, ladder and train stages can't be edited. |
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
