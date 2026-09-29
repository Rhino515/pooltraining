# Friends, PvP and Tournaments (v11)

This part is local-only: everything is saved on this device in `poolIQFriendsV1`. That key is mirrored to IndexedDB, included in snapshots and in **Settings → Back Up**. There are no accounts, no online play and no leaderboards.

**PvP never changes your training progress.** Friend matches don't touch Career rank, Rank XP, Lifetime XP, Drill Rank, skill levels or mastery. The friends modules don't import any XP code, and a verify test enforces this.

## Players

- `#friends` → **ADD PLAYER**. Each player has a name (unique, case-insensitive) and an optional photo (**TAKE PHOTO** uses the camera, **CHOOSE PHOTO** uses your library). Photos are cropped to a square and shrunk to a ~256 px image, stored inline. Players without a photo get a ball badge with their initials.
- **You** are always a player, linked to your local profile (the same id, name and photo as `#me`).
- Removing a player who has match history **archives** them, so the history and head-to-head records are kept. Players without history are deleted.

## Matches

- **New match:** pick two players, the game (8-Ball, 9-Ball, 10-Ball, Straight Pool, Bank Pool, One Pocket, Other), and the race (1–11).
- **Live scoring:** tap **+1 RACK** for the player who won each rack. Hill-hill is highlighted. **UNDO LAST RACK** fixes mistakes, and **ABANDON MATCH** discards a match. The match ends when someone reaches the race. Optional advanced stats: break & runs, dry breaks, fouls, safeties, banks made, kick escapes.
- **Quick score:** enter the final score. The winner must have exactly the race and the loser fewer.
- **Head-to-head** (`#h2h/<a>/<b>`): record, racks, hill-hill matches, the last 10 results and advanced-stat totals.
- **Player profile** (`#friend/<id>`): win/loss, win %, current streak, racks for and against, and records against each opponent.

## Group sessions

A group session is a night of matches with 3 or more players. It keeps a table (wins, racks) and suggests the next pairing: players who haven't met yet, then whoever has played least.

## Tournaments

### Single elimination (2–32 players)

- Players are seeded in the order you pick them, into a standard bracket (1 v 8, 4 v 5, 2 v 7, 3 v 6 …) sized to the next power of two.
- Top seeds get **byes** and advance automatically. Winners advance on their own, and the final winner is crowned **Champion**.
- A result can be cleared only while the next round's match is still unplayed.

### Round robin (3–12 players)

- Everyone plays everyone once, scheduled with the circle method. With an odd number of players, one player has a **BYE** each round.
- Standings order (`PVP.tiebreakers`):
  1. **Wins**
  2. **Head-to-head** wins among the tied players only (mini-table)
  3. **Rack difference** (racks won − racks lost)
  4. **Racks won**
  5. **Name** (alphabetical, so the order is stable)
- The tournament is complete when every match has a result. The top of the standings is the winner.

Every tournament match result is also saved as a normal friend match (with `tournamentId`), so it counts in player records and head-to-head.

## Data model (sync-ready)

```
poolIQFriendsV1 = { schema: 1, players: [{id, name, avatar, isMe, archived, source, createdAt, updatedAt}],
                    matches: [{id, schema, players:[a,b], game, raceTo, score:{[id]:n}, racks:[winnerId...], winner, stats:{[id]:{...}}, sessionId, tournamentId, status, createdAt, endedAt, updatedAt, source, deviceId}],
                    sessions: [...], tournaments: [{id, name, format, playerIds, raceTo, matches:[...], championId, status}] }
```

Ids are UUIDs and every record has `updatedAt`, so a future online service could merge records without renumbering. No online feature is built.
