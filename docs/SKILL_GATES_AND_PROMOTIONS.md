# Skill Gates and Promotion Tests (v11)

All values are in `js/progression/config.js` (`GATES`, `PROMOTION`, `SKILL_LEVEL`).

## Skill Gates (inside a rank)

Each rank below Champion has one gate partway up its ball ladder. The gate **holds your ball level** until every foundation is met. Rank XP keeps banking in the meantime, so nothing is lost: the ball jumps as soon as the gate clears. Once a gate is cleared it stays cleared, even if the skill later fades.

A foundation `{skill, passes: N, tier}` means: pass N **different** items that train the skill as a foundation (normalized weight ≥ 0.5) at that tier or harder.

| Rank | Gate at | Foundations |
|---|---|---|
| Rookie | 5-Ball | 1 Beginner pass each: Straight Cueing, Shot Making, Stop, Follow, Draw, Speed Control |
| Club Player | 5-Ball | Stun ×1 Intermediate · Position ×2 Beginner · Speed ×2 Beginner · Stop ×1 Intermediate |
| Shooter | 6-Ball | Banks ×1 Beginner · Draw ×2 Intermediate · Follow ×2 Intermediate · Shot Making ×2 Beginner |
| Competitor | 6-Ball | Kicks ×1 Beginner · Stun ×2 Intermediate · Position ×2 Intermediate |
| Advanced | 6-Ball | Safeties ×1 Intermediate · Shot Making ×2 Advanced · Speed ×1 Advanced |
| Expert | 6-Ball | Pattern ×1 Intermediate · Banks ×2 Intermediate · Kicks ×2 Intermediate |
| Master | 7-Ball | Draw, Follow, Stun, Position ×2 each at Advanced |
| Elite | 7-Ball | Pattern ×2 Advanced · Safeties ×2 Advanced · Banks ×1 Advanced · Kicks ×1 Advanced |
| Pro | 8-Ball | Shot Making ×2 Expert · Position ×2 Expert · Speed ×1 Expert · Pattern ×1 Expert |

Career shows a gate card with each foundation, your progress and a **TRAIN** link to matching items. `#gate` has the full checklist.

## Promotion Tests (between named ranks)

The Promotion Test is **the existing Boss Battle for that rank**: a real sequence of shots scored on the play screen. It unlocks only when **every** item on its checklist is met:

1. **Rank XP full.** You are on the top ball of your current rank, which also means every gate in the rank is cleared.
2. **Skill floors.** Core and secondary skills are at or above the minimum level.
3. **Mastery.** You have enough items at STRONG ⭐⭐ and MASTERED ⭐⭐⭐.
4. **Existing Career requirements.** These are unchanged: Arcade levels, Ghost wins, stars and PBs from `js/career.js`.

| To rank | Core floor | Secondary floor | STRONG+ | MASTERED |
|---|---|---|---|---|
| Club Player | — | — | 0 | 0 |
| Shooter | Rookie 3 | — | 1 | 0 |
| Competitor | Rookie 6 | — | 2 | 0 |
| Advanced | Club Player 1 | Rookie 3 | 4 | 1 |
| Expert | Club Player 6 | Rookie 6 | 6 | 2 |
| Master | Shooter 3 | Club Player 1 | 9 | 4 |
| Elite | Competitor 1 | Club Player 6 | 12 | 6 |
| Pro | Competitor 8 | Shooter 3 | 16 | 9 |
| Champion | Advanced 6 | Competitor 1 | 20 | 12 |

- While the test is locked, Career and the boss screen show **"Promotion Test locked: …"** with the first missing item. `#promo` lists every item with a ✓ or the gap.
- Winning the test promotes you, just as beating the boss always has. The new rank starts at 1-Ball, plus any overflow carry.
- Promotions never go backwards: `rankFloor` and migration keep every rank you have earned.

## Recommended Training

`#training` (also shown on Home and Career) picks 3 skills and suggests items for each. It picks skills blocking your current Skill Gate first, then skills below a Promotion floor, then your weakest skills.
