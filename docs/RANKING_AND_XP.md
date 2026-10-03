# Ranking and XP (v11)

Every number on this page comes from `js/progression/config.js`, which is the only place balancing values are kept. If you change a value there, the app, the tests and this page's formulas all follow it. The tables below show the current defaults.

## Three progressions

| Progression | What it measures | Earned from | Shown |
|---|---|---|---|
| **Career** (Rookie … Champion) | Your overall training rank | Table Games stages, built-in / Create Drill drills, rank-eligible installed `.pooliq` content, a ghost match only while that ghost task is the one he is on, Boss Battles | Home, Career, Profile header (ball badge) |
| **Drill Rank** (BALL BANGER … Drill Legend) | Your drill work only | Built-in drills, Create Drill drills, rank-eligible installed `.pooliq` content | Top of the Drills tab and Profile (square chalk badge, visually distinct) |
| **Skill levels** (12 skills) | How well you have shown each skill | The same sessions as Career, weighted by the skills each item trains | Career → Skill Breakdown, Home |

**Friends / PvP matches never affect any of these.** The same goes for Play Test and preview of content you have not installed yet. There are tests for both.

## Career ranks and ball levels

Career keeps the existing rank names and requirements (`js/career.js`). v11 adds **ball levels** inside each rank, so a title reads *"Shooter · 7-Ball"*.

| # | Rank | Balls | Rank XP per ball | Rank XP total |
|---|---|---|---|---|
| 0 | Rookie | 10 | 300 | 3,000 |
| 1 | Club Player | 10 | 450 | 4,500 |
| 2 | Shooter | 11 | 600 | 6,600 |
| 3 | Competitor | 11 | 750 | 8,250 |
| 4 | Advanced | 12 | 900 | 10,800 |
| 5 | Expert | 12 | 1,050 | 12,600 |
| 6 | Master | 13 | 1,200 | 15,600 |
| 7 | Elite | 14 | 1,350 | 18,900 |
| 8 | Pro | 15 | 2,500 | 37,500 |
| 9 | **Champion** | — | — | **MAX RANK** |

- Your **ball** is set by the Rank XP banked in your current rank: `ball = min(balls, 1 + floor(rankXp / ballXp))`, capped by any uncleared Skill Gate (see [SKILL_GATES_AND_PROMOTIONS.md](SKILL_GATES_AND_PROMOTIONS.md)).
- **Rank XP never promotes by itself.** Promotion needs a full rank, every Skill Gate, the skill floors and mastery counts, the existing Career requirements, and a win in the Promotion Test (that rank's Boss Battle).
- **Overflow:** Rank XP earned after a rank is full carries into the next rank, up to 25% of that rank's total (`XP.overflowCarry`).
- **Champion is the max rank.** It has no balls. Rank XP stops (awards show `MAX RANK`), but **Lifetime XP keeps counting**. The Champion stats screen (`#champion`) replaces the spec's "Master stats" screen. It shows Lifetime XP, sessions, items completed / strong / mastered, perfect runs, first clears, PBs, Ghost record, bosses beaten, training time, Drill Rank and skill levels.
- Rank names, ball counts and XP per ball are all in `RANK_LADDER`. The UI and tests read from it, so you can change the structure without touching code.

## Two XP totals

- **Lifetime XP** is permanent and never goes down. It counts everything, including repeats (at reduced value), participation and XP earned at Champion.
- **Rank XP** fills the balls of your current rank. It is limited by tier caps, mastered-repeat rules and the same-day limits.

## Session XP formula

`applyAward()` in `js/progression/award.js` runs once for each finished, recorded session.

1. **Performance ratio** (0–1) comes from the session: shots made / attempts, zone stars, lives left, kick contacts and so on. A passed session counts as at least 0.6 (`passFloor`). A failed session never counts above 0.69 (`failCap`).
2. **Base XP by tier:** Beginner 40 · Intermediate 60 · Advanced 90 · Expert 130 · Pro 180. Boss Battles are ×2. A ghost match uses `clamp(race/5, 0.6, 1.8)` for Career Rank XP only while that ghost task is the next open Career task (8-Ball Ghost never is). Drill Rank XP does not come from Ghost.
3. **Performance curve** (the fraction of base XP you earn):

   | Ratio ≥ | 0.6 | 0.7 | 0.8 | 0.9 | 1.0 |
   |---|---|---|---|---|---|
   | Factor | 0.25 | 0.5 | 0.75 | 0.9 | 1.0 |

   Below 0.6 you earn 0 Rank XP and 5 Lifetime XP for participation.
4. **Bonuses** (× base): first clear +1.0, perfect session +0.25, personal best (passed and better than your best) +0.25.
5. **Anti-farming:**
   - Item already STRONG ⭐⭐: ×0.6.
   - Item already MASTERED ⭐⭐⭐: Rank XP ×0.1, Lifetime ×0.5. The award shows a `MASTERED REPEAT` flag.
   - Same item on the same day: the first 3 sessions are full value, and each one after that is ×0.5.
6. **Tier caps** (the total Career Rank XP a tier can ever give): Beginner 5,000 · Intermediate 9,000 · Advanced 14,000 · Expert 20,000 · Pro unlimited. Once a tier is full, its sessions still earn Lifetime XP. Career shows the tier as **MAXED** and points you to harder content.
7. **Create Drill drills** count at most as **Intermediate** for Career Rank XP, because self-authored difficulty can't be verified.

Every award is stored in `prog.events`, newest first, with flags (`FIRST CLEAR`, `PERSONAL BEST`, `PERFECT`, `MASTERED REPEAT`, `BEGINNER XP MAXED`, `BALL UP`, `GATE CLEARED`, `PROMOTED`, `MAX RANK`). The result screens show these awards.

## Mastery (per item)

| Stars | Label | Rule |
|---|---|---|
| — | NOT PASSED | — |
| ⭐ | PASSED | The item's own pass rule |
| ⭐⭐ | STRONG | Best passed performance ≥ `strong` (default 0.9 for make/miss modes, so 9/10) |
| ⭐⭐⭐ | MASTERED | Best passed performance ≥ `mastered` (default 1.0, so 10/10) |

Each scoring mode has its own defaults in `MASTERY.byMode`. `.pooliq` files can override them with `"mastery": {"strong": 0.8, "mastered": 0.9}`.

## Skill levels

There are 12 skills. Core: Straight Cueing, Shot Making, Stop, Follow, Draw, Stun, Speed Control, Position Play. Secondary: Banks, Kicks, Safeties, Pattern Play. Each Table Games game maps to skill weights (`GAME_SKILLS`, with per-stage overrides), and one session trains every skill the item weights.

```
rating(skill) = Σ weight × tierPoints × credit(mastery) × recency  /  Σ weight × tierPoints   (over content that trains the skill)
level         = Career ladder step at rating^0.85, capped by the hardest tier with a PASSED foundation item
```

- The level shows as **"<Career rank> <ball>"**, for example *"Draw: Shooter 5"*. Skills you haven't played show *Not rated yet*.
- Recency: full credit for 45 days, then a slow fade to a floor of 0.75 by 180 days.
- A skill reaches Champion only with a rating ≥ 0.95 plus a mastered Pro item.

## Drill Rank (separate from Career)

Drill Rank is earned only from **built-in drills, Create Drill drills and rank-eligible installed `.pooliq` content** (`DRILL_RANK.sources`). Table Games stages, Ghost matches, Boss Battles, PvP and Play Test never count. Drill XP uses the same session formula, including first clear, PB and the anti-farming reductions. Each rank needs **all** of its thresholds:

| # | Drill Rank | Drill XP | Passed drills | Strong ⭐⭐ | Mastered ⭐⭐⭐ | Skill categories |
|---|---|---|---|---|---|---|
| 1 | BALL BANGER | 0 | 0 | 0 | 0 | 0 |
| 2 | Grinder | 900 | 3 | 0 | 0 | 0 |
| 3 | DRILLER | 3,000 | 6 | 2 | 0 | 0 |
| 4 | STUDENT OF THE GAME | 7,500 | 10 | 4 | 1 | 2 |
| 5 | Precision Player | 15,000 | 15 | 7 | 3 | 3 |
| 6 | Drill Sergeant | 27,000 | 20 | 10 | 6 | 4 |
| 7 | Drill Master | 75,000 | 28 | 15 | 10 | 5 |
| 8 | Drill Legend | 125,000 | 36 | 22 | 16 | 6 |

"Skill categories" is the number of different primary skills among your passed drills. Because the counts are required alongside XP, you can't reach a rank by repeating one drill. A mastered drill also gives very little Drill XP on repeats.

## Migration from v10 (automatic, one time, never demotes)

`js/progression/migrate.js` runs at startup when `state.prog` is missing or older than `PROGRESSION_VERSION`. A vault snapshot ("Before v11 progression update") is taken first.

1. It replays your saved history in date order: Table Games stage history, drill history, Ghost matches and Boss Battles. This fills Lifetime XP, item mastery, skill records and Drill XP.
2. **It never demotes.** You keep your current Career rank (`rankIndex`/`rankFloor`). Ranks below it are marked complete. Your current rank gets the Rank XP left over from the replay, capped at that rank's total.
3. Lifetime XP is at least your old v10 XP total (kept as `prog.legacyXp`).
4. The migration is idempotent: running it again is a no-op. Fresh installs and data resets get an empty `prog` straight away, with no migration and no snapshot.

## Clean hooks (Learn / Runout Coach)

- **Item descriptors** (`js/progression/catalog.js`) have keys by source: `arcade:`, `drill:`, `boss:`, `ghost:`, `bshot:`, `content:<uid>[:stage]`. A future source (lessons, a runout coach) only needs a new descriptor `{key, source, tier, weights, mode, mastery, rankXpEligible, drillRank}` passed to `applyAward()`.
- `XP.sourceMult` and `DRILL_RANK.sources` decide how much a new source counts and whether it counts toward Drill Rank.
- `recommendedTraining()` (`js/progression/rank.js`) ranks your weakest skills and suggests items. New sources show up automatically once they have descriptors.

## Where to look in the app

- `#career`: ball badge, Rank XP bar, tier caps, Skill Gate card, Promotion Test card.
- `#gate`, `#promo`: checklists.
- `#skills`, `#skill/<id>`: breakdown per skill.
- `#training`: recommended items.
- `#drillrank`: Drill Rank thresholds.
- `#champion`: Champion stats.
- `#me/stats`: your stats plus the exportable public-stats summary.
