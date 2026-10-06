# PKF Shot Making & Center Ball — Source Map

Course route `#pkfsmcb` · storage key `pkfShotMakingCenterBall` · files `js/content/pkfShotMakingCourse.js`,
`js/content/pkfShotMakingAssets.js`, `js/ui/pkfShotMakingPlay.js` · test `scripts/pkfShotMakingCourse.test.mjs`.

Source: PKF Pattern Play, **Chapter Three: Center Ball**. The page JPEGs were copied into `images/pkf-smcb/PKF_CenterBall_PDF_035..058.jpg`
from `/workspace/pkf-smcb-src/` with no changes (the test checks they are byte-identical). Crops are CSS viewports on the original page. Nothing is redrawn.

Course order on Drill Sets: **Fundamentals → Shot Making & Center Ball → Cue Ball Control → Kick → Bank**.

## Page map (from the printed footers)

| PDF | Printed | Notes |
|---|---|---|
| 035 | — | CENTER BALL divider |
| 036 | — | blank insert |
| 037–057 | 23–43 | printed = PDF − 14 |
| 058 | — | blank insert (PDF 058–060 are blank or divider pages; Sliding Cue Ball starts at PDF 061 = printed 44, in Cue Ball Control) |

Captions use the shared CB helper (`citeText` in `pkfCueBallAssets.js`). They show the printed page once:
`Figure 3-31 · PKF page 30 · tap to enlarge`.

## Course shape

11 sections · 82 lessons · 17-item final exam (13 knowledge + 4 physical).

| # | Section | Lessons |
|---|---|---|
| 1 | Center Ball vs Sidespin | 11 |
| 2 | Elevation & Sidespin Variables | 6 |
| 3 | Finding Center | 10 |
| 4 | High Action | 7 |
| 5 | Low Action | 7 |
| 6 | Stop Shot | 11 |
| 7 | Low Action for Position | 6 |
| 8 | Ball Pocketing & Throw | 4 |
| 9 | Combination Throw | 5 |
| 10 | Ball Pocketing Drills | 10 |
| 11 | Automatic Aiming | 5 |

- **Lesson types:** LEARN 23 · CHOOSE CONTACT / ACTION 10 · PREDICT 18 · IDENTIFY 16 · SET UP THIS SHOT 15.
- **Assist levels:** GUIDED 26 · ASSISTED 39 · INDEPENDENT 17. Within each section the level never goes back down.
- **Thresholds (app settings, not PKF):**
  - A section passes at 70% knowledge. The exam passes at 80% overall.
  - Physical drills give up to 3 attempts. PKF's own goal of hitting the target 5 times is shown on the drill text.
- **Physical scoring kinds:**
  - `pocket`: MAKE / MISS.
  - `action`: SHOT MADE + CORRECT ACTION / SHOT MADE + INCORRECT ACTION / SHOT MISSED. Success needs the ball pocketed AND the action PKF describes.
  - `check`: CORRECT ACTION / INCORRECT ACTION. Used where PKF never says to pocket a ball; the pocketing requirement shows as "Not specified in PKF".

## Page-by-page audit

Every numbered page is used. The divider and blank pages are never shown.

| PDF | Printed | Lessons using this page |
|---|---|---|
| 035 | — | divider (not shown) |
| 036 | — | blank (not shown) |
| 037 | 23 | smcb-intro |
| 038 | 24 | smcb-elevate, smcb-q-line, smcb-left-deflect, smcb-id-deflection, smcb-elevated-firm, smcb-right-veer, smcb-q-level, smx-deflect, smx-center-line |
| 039 | 25 | smcb-long-8, smcb-rule-spin |
| 040 | 26 | smcb-ghost-line, smcb-q-adjust, smcb-swerve, smcb-q-more-angle |
| 041 | 27 | smcb-variables, smcb-q-variables, smcb-q-shaft, smcb-find-center, smcb-q-tip-where, smcb-q-long-straight, smx-level-never, smx-long-straight |
| 042 | 28 | smcb-9drill, smcb-q-9-forward, smcb-q-9-back, smcb-shoot-9drill, smcb-rail-return, smcb-shoot-rail, smx-rail-center |
| 043 | 29 | smcb-shoot-rail-full, smcb-high-action, smcb-q-high-why, smcb-q-tip-part, smx-high-tip |
| 044 | 30 | smcb-high-follow-in, smcb-shoot-high, smcb-high-close, smcb-shoot-high-close, smx-x-high |
| 045 | 31 | smcb-low-action, smcb-q-miscue |
| 046 | 32 | smcb-draw-tips, smcb-q-power-draw, smcb-q-chalk, smx-draw-grip |
| 047 | 33 | smcb-draw-drill, smcb-shoot-draw, smcb-stop-intro, smcb-q-sliding, smcb-stop-diag, smcb-q-follows, smcb-shoot-stop, smx-stop-slide, smx-x-stop |
| 048 | 34 | smcb-stop-physics, smcb-q-less-low |
| 049 | 35 | smcb-shoot-stop-degrees, smcb-q-pocket-bigger, smx-pocket-bigger |
| 050 | 36 | smcb-mosconi, smcb-shoot-mosconi, smcb-min-angles, smcb-q-min-angles, smcb-q-hold |
| 051 | 37 | smcb-massey, smcb-q-massey, smcb-massey-curve |
| 052 | 38 | smcb-throw, smcb-q-throw-dir, smcb-throw-q, smcb-q-overcut, smx-throw-thinner |
| 053 | 39 | smcb-combo, smcb-q-combo-above, smcb-q-combo-pos, smcb-combo-advantage, smcb-q-combo-c, smx-combo-line |
| 054 | 40 | smcb-target-drill, smcb-q-target-why, smcb-shoot-max-high, smcb-shoot-center-target, smx-x-target |
| 055 | 41 | smcb-q-3things, smcb-q-pocket-side, smcb-shoot-tip-above, smcb-shoot-low-target, smx-3things |
| 056 | 42 | smcb-problem, smcb-shoot-problem, smcb-auto-aim, smcb-q-auto-level, smx-auto |
| 057 | 43 | smcb-q-auto-how, smcb-shoot-3sec, smcb-q-next, smx-x-3sec |
| 058 | — | blank (not shown) |

### Unnumbered figures
PKF prints these images without a figure number. They are named by page only, never by a guessed number:
- p23: two diagrams
- p25: one photo
- p29: one photo

The figure numbering skips 3-55, 3-57 and 3-61.

## Lesson mapping (`sourceMapRows()`)

Any arrow (→) next to a figure names the solution region. That region is revealed only after LOCK and is not visible before then. `smx-*` rows are exam items.

| # | Lesson id | Type | Assist | Section | Source (printed) | Image (PDF) | Figure / region | Purpose | Concept | Moved from |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | smcb-intro | LEARN | GUIDED | 1. Center Ball vs Sidespin | Page 23 · Figures 3-1, 3-2 | PDF_037 (p23) | page 23 | TEACHING | Center ball before sidespin | cb-intro |
| 2 | smcb-elevate | LEARN | GUIDED | 1. Center Ball vs Sidespin | Page 24 · Figures 3-3, 3-4 | PDF_038 (p24) | page 24 | TEACHING | Center family stays on the shooting line | cb-elevate-center |
| 3 | smcb-q-line | CHOOSE | GUIDED | 1. Center Ball vs Sidespin | Page 24 | PDF_038 (p24) | Figure 3-3 → solution p38-a | QUESTION | Center family stays on the shooting line |  |
| 4 | smcb-left-deflect | PREDICT | GUIDED | 1. Center Ball vs Sidespin | Page 24 · Figures 3-5, 3-6 | PDF_038 (p24) | Figure 3-5 → solution p38-b | QUESTION | Deflection | cb-left-deflect |
| 5 | smcb-id-deflection | IDENTIFY | GUIDED | 1. Center Ball vs Sidespin | Page 24 · Figure 3-6 | PDF_038 (p24) | Figure 3-6 → solution p38-b | QUESTION | Deflection |  |
| 6 | smcb-elevated-firm | LEARN | ASSISTED | 1. Center Ball vs Sidespin | Page 24 · Figures 3-7, 3-8 | PDF_038 (p24) | page 24 | TEACHING | Sidespin with elevation and speed |  |
| 7 | smcb-right-veer | PREDICT | ASSISTED | 1. Center Ball vs Sidespin | Page 25 · Figure 3-9 | PDF_038 (p24) | Figure 3-7 → solution p39-a | QUESTION | Deflection | cb-right-veer |
| 8 | smcb-long-8 | PREDICT | ASSISTED | 1. Center Ball vs Sidespin | Page 25 · Figures 3-10, 3-11 | PDF_039 (p25) | Figure 3-10 → solution p39-b | QUESTION | Sidespin causes misses |  |
| 9 | smcb-rule-spin | IDENTIFY | ASSISTED | 1. Center Ball vs Sidespin | Page 25 · Figures 3-12, 3-13 | PDF_039 (p25) | Figures 3-12, 3-13 → solution p39-c | QUESTION | Deflection direction | cb-rule-spin |
| 10 | smcb-ghost-line | LEARN | ASSISTED | 1. Center Ball vs Sidespin | Pages 25–26 · Figures 3-14, 3-15 | PDF_040 (p26) | Figures 3-14, 3-15 | TEACHING | Sidespin causes misses |  |
| 11 | smcb-q-adjust | CHOOSE | INDEPENDENT | 1. Center Ball vs Sidespin | Page 26 · Figure 3-16 | PDF_040 (p26) | Figure 3-14 → solution p40-b | QUESTION | Adjusting the shooting line for sidespin |  |
| 12 | smcb-q-level | PREDICT | GUIDED | 2. Elevation & Sidespin Variables | Page 26 | PDF_038 (p24) | Figure 3-5 → solution p40-c | QUESTION | Level cue: never returns to the line |  |
| 13 | smcb-swerve | LEARN | GUIDED | 2. Elevation & Sidespin Variables | Pages 26–27 · Figures 3-17, 3-18 | PDF_040 (p26) | page 26 | TEACHING | Elevated cue: returns to the line | cb-swerve |
| 14 | smcb-q-more-angle | PREDICT | ASSISTED | 2. Elevation & Sidespin Variables | Page 27 · Figure 3-19 | PDF_040 (p26) | Figure 3-17 → solution p41-a | QUESTION | Elevated cue: returns to the line |  |
| 15 | smcb-variables | LEARN | ASSISTED | 2. Elevation & Sidespin Variables | Page 27 | PDF_041 (p27) | page 27 | TEACHING | Sidespin variables |  |
| 16 | smcb-q-variables | IDENTIFY | INDEPENDENT | 2. Elevation & Sidespin Variables | Page 27 | PDF_041 (p27) | page 27 → solution p41-var | QUESTION | Sidespin variables |  |
| 17 | smcb-q-shaft | IDENTIFY | INDEPENDENT | 2. Elevation & Sidespin Variables | Page 27 | PDF_041 (p27) | page 27 → solution p41-var | QUESTION | Sidespin variables |  |
| 18 | smcb-find-center | LEARN | GUIDED | 3. Finding Center | Page 27 · Figure 3-20 | PDF_041 (p27) | page 27 | TEACHING | Finding center | cb-find-center |
| 19 | smcb-q-tip-where | IDENTIFY | GUIDED | 3. Finding Center | Page 27 · Figure 3-20 | PDF_041 (p27) | Figure 3-20 → solution p41-b | QUESTION | Finding center |  |
| 20 | smcb-q-long-straight | IDENTIFY | ASSISTED | 3. Finding Center | Page 27 | PDF_041 (p27) | page 27 → solution p41-b | QUESTION | Finding center |  |
| 21 | smcb-9drill | LEARN | ASSISTED | 3. Finding Center | Page 28 · Figures 3-21 to 3-23 | PDF_042 (p28) | page 28 | DRILL | Center-ball drill | cb-stop-9drill |
| 22 | smcb-q-9-forward | PREDICT | ASSISTED | 3. Finding Center | Page 28 | PDF_042 (p28) | Figure 3-22 → solution p42-b | QUESTION | Center-ball drill |  |
| 23 | smcb-q-9-back | PREDICT | ASSISTED | 3. Finding Center | Page 28 | PDF_042 (p28) | Figure 3-22 → solution p42-b | QUESTION | Center-ball drill |  |
| 24 | smcb-shoot-9drill | SHOOT (check) | ASSISTED | 3. Finding Center | Page 28 · Figures 3-21 to 3-23 | PDF_042 (p28) | Figure 3-22 → solution p42-b | PHYSICAL SETUP | Center-ball drill | cb-shoot-center |
| 25 | smcb-rail-return | CHOOSE | ASSISTED | 3. Finding Center | Pages 28–29 · Figures 3-24, 3-25 | PDF_042 (p28) | Figure 3-24 → solution p43-a | QUESTION | Rail-return center drill | cb-rail-return |
| 26 | smcb-shoot-rail | SHOOT (check) | ASSISTED | 3. Finding Center | Page 28 · Figure 3-24 | PDF_042 (p28) | Figure 3-24 → solution p42-c | PHYSICAL SETUP | Rail-return center drill | cb-shoot-center |
| 27 | smcb-shoot-rail-full | SHOOT (check) | INDEPENDENT | 3. Finding Center | Page 29 · Figure 3-26 | PDF_043 (p29) | Figure 3-26 → solution p43-a | PHYSICAL SETUP | Rail-return center drill |  |
| 28 | smcb-high-action | LEARN | GUIDED | 4. High Action | Pages 29–30 · Figures 3-27 to 3-30 | PDF_043 (p29) | page 29 | TEACHING | High action | cb-high-action |
| 29 | smcb-q-high-why | IDENTIFY | GUIDED | 4. High Action | Page 29 · Figure 3-27 | PDF_043 (p29) | Figure 3-27 → solution p43-b | QUESTION | High action |  |
| 30 | smcb-q-tip-part | PREDICT | ASSISTED | 4. High Action | Page 29 · Figures 3-28, 3-29 | PDF_043 (p29) | Figure 3-28 → solution p43-b | QUESTION | High action contact |  |
| 31 | smcb-high-follow-in | CHOOSE | ASSISTED | 4. High Action | Page 30 · Figure 3-31 | PDF_044 (p30) | Figure 3-31 → solution p44-b | QUESTION | High action drill | cb-high-follow-in |
| 32 | smcb-shoot-high | SHOOT (action) | ASSISTED | 4. High Action | Page 30 · Figure 3-31 | PDF_044 (p30) | Figure 3-31 → solution p44-b | PHYSICAL SETUP | High action drill | cb-shoot-high |
| 33 | smcb-high-close | CHOOSE | INDEPENDENT | 4. High Action | Page 30 · Figure 3-32 | PDF_044 (p30) | Figure 3-32 → solution p44-c | QUESTION | High action, abbreviated stroke | cb-high-close |
| 34 | smcb-shoot-high-close | SHOOT (action) | INDEPENDENT | 4. High Action | Page 30 · Figure 3-32 | PDF_044 (p30) | Figure 3-32 → solution p44-c | PHYSICAL SETUP | High action, abbreviated stroke | cb-shoot-high |
| 35 | smcb-low-action | LEARN | GUIDED | 5. Low Action | Page 31 · Figures 3-33 to 3-36 | PDF_045 (p31) | page 31 | TEACHING | Low action | cb-low-action |
| 36 | smcb-q-miscue | IDENTIFY | GUIDED | 5. Low Action | Page 31 · Figure 3-36 | PDF_045 (p31) | Figure 3-36 → solution p45-b | QUESTION | Low action |  |
| 37 | smcb-draw-tips | IDENTIFY | ASSISTED | 5. Low Action | Page 32 | PDF_046 (p32) | page 32 → solution p46-a | QUESTION | Draw-shot checklist | cb-draw-tips |
| 38 | smcb-q-power-draw | CHOOSE | ASSISTED | 5. Low Action | Page 32 · Figure 3-37 | PDF_046 (p32) | Figure 3-37 → solution p46-b | QUESTION | Power draw |  |
| 39 | smcb-q-chalk | IDENTIFY | ASSISTED | 5. Low Action | Page 32 · Figure 3-38 | PDF_046 (p32) | Figure 3-38 → solution p46-c | QUESTION | Draw-shot checklist |  |
| 40 | smcb-draw-drill | LEARN | ASSISTED | 5. Low Action | Pages 32–33 · Figures 3-39, 3-40 | PDF_047 (p33) | page 33 | DRILL | Draw drill | cb-draw-drill |
| 41 | smcb-shoot-draw | SHOOT (check) | INDEPENDENT | 5. Low Action | Page 33 · Figures 3-39, 3-40 | PDF_047 (p33) | Figure 3-39 → solution p47-a | PHYSICAL SETUP | Draw drill |  |
| 42 | smcb-stop-intro | LEARN | GUIDED | 6. Stop Shot | Page 33 · Figure 3-41 | PDF_047 (p33) | page 33 | TEACHING | Stop shot |  |
| 43 | smcb-stop-physics | LEARN | GUIDED | 6. Stop Shot | Pages 33–34 · Figures 3-42 to 3-44 | PDF_048 (p34) | page 34 | TEACHING | Stop shot: sliding at contact | cb-stop-physics |
| 44 | smcb-q-sliding | PREDICT | GUIDED | 6. Stop Shot | Pages 33–34 · Figure 3-42 | PDF_047 (p33) | Figure 3-41 → solution p48-a | QUESTION | Stop shot: sliding at contact |  |
| 45 | smcb-stop-diag | PREDICT | ASSISTED | 6. Stop Shot | Page 34 · Figure 3-44 | PDF_047 (p33) | Figure 3-41 → solution p48-ab | QUESTION | Stop shot adjustments | cb-stop-diag |
| 46 | smcb-q-follows | PREDICT | ASSISTED | 6. Stop Shot | Page 34 · Figure 3-43 | PDF_047 (p33) | Figure 3-41 → solution p48-a | QUESTION | Stop shot adjustments |  |
| 47 | smcb-shoot-stop | SHOOT (check) | ASSISTED | 6. Stop Shot | Pages 33–34 · Figure 3-41 | PDF_047 (p33) | Figure 3-41 → solution p47-b | PHYSICAL SETUP | Stop shot | cb-shoot-stop |
| 48 | smcb-q-less-low | PREDICT | ASSISTED | 6. Stop Shot | Page 34 · Figure 3-45 | PDF_048 (p34) | Figure 3-45 → solution p48-c | QUESTION | Degrees of low |  |
| 49 | smcb-shoot-stop-degrees | SHOOT (check) | ASSISTED | 6. Stop Shot | Pages 34–35 · Figures 3-46, 3-47 | PDF_049 (p35) | Figure 3-46 → solution p49-a | PHYSICAL SETUP | Degrees of low |  |
| 50 | smcb-q-pocket-bigger | IDENTIFY | ASSISTED | 6. Stop Shot | Page 35 · Figures 3-48 to 3-51 | PDF_049 (p35) | Figure 3-48 → solution p49-b | QUESTION | Low action makes the pocket bigger | cb-soft-stop-why |
| 51 | smcb-mosconi | LEARN | ASSISTED | 6. Stop Shot | Page 36 · Figure 3-52 | PDF_050 (p36) | page 36 | DRILL | Stop shot |  |
| 52 | smcb-shoot-mosconi | SHOOT (check) | INDEPENDENT | 6. Stop Shot | Page 36 · Figure 3-52 | PDF_050 (p36) | Figure 3-52 → solution p50-b | PHYSICAL SETUP | Stop shot |  |
| 53 | smcb-min-angles | LEARN | GUIDED | 7. Low Action for Position | Page 36 · Figures 3-53, 3-54 | PDF_050 (p36) | page 36 | TEACHING | Low action minimizes angles |  |
| 54 | smcb-q-min-angles | PREDICT | GUIDED | 7. Low Action for Position | Page 36 · Figure 3-53 | PDF_050 (p36) | Figure 3-53 → solution p50-c | QUESTION | Low action minimizes angles |  |
| 55 | smcb-q-hold | CHOOSE | ASSISTED | 7. Low Action for Position | Page 36 · Figure 3-54 | PDF_050 (p36) | Figure 3-54 → solution p50-c | QUESTION | Low action minimizes angles |  |
| 56 | smcb-massey | LEARN | ASSISTED | 7. Low Action for Position | Page 37 · Figure 3-56 | PDF_051 (p37) | page 37 | TEACHING | Low action changes the cue ball path | cb-massey-stub |
| 57 | smcb-q-massey | PREDICT | ASSISTED | 7. Low Action for Position | Page 37 · Figure 3-56 | PDF_051 (p37) | Unnumbered PKF diagram → solution p51-a | QUESTION | Low action changes the cue ball path |  |
| 58 | smcb-massey-curve | LEARN | INDEPENDENT | 7. Low Action for Position | Page 37 · unnumbered diagram | PDF_051 (p37) | page 37 | REFERENCE | Low action changes the cue ball path |  |
| 59 | smcb-throw | LEARN | GUIDED | 8. Ball Pocketing & Throw | Page 38 · Figure 3-58 | PDF_052 (p38) | page 38 | TEACHING | Throw | cb-throw |
| 60 | smcb-q-throw-dir | PREDICT | GUIDED | 8. Ball Pocketing & Throw | Page 38 · Figure 3-58 | PDF_052 (p38) | Figure 3-58 → solution p52-a | QUESTION | Throw |  |
| 61 | smcb-throw-q | CHOOSE | ASSISTED | 8. Ball Pocketing & Throw | Page 38 · Figure 3-59 | PDF_052 (p38) | Figure 3-59 → solution p52-b | QUESTION | Throw | cb-throw-q |
| 62 | smcb-q-overcut | CHOOSE | INDEPENDENT | 8. Ball Pocketing & Throw | Page 38 · Figure 3-60 | PDF_052 (p38) | Figure 3-60 → solution p52-c | QUESTION | Throw |  |
| 63 | smcb-combo | LEARN | GUIDED | 9. Combination Throw | Page 39 · unnumbered photo, Figures 3-62, 3-63 | PDF_053 (p39) | page 39 | TEACHING | Combination throw |  |
| 64 | smcb-q-combo-above | PREDICT | ASSISTED | 9. Combination Throw | Page 39 · Figure 3-62 | PDF_053 (p39) | Unnumbered PKF photo → solution p53-b | QUESTION | Combination throw |  |
| 65 | smcb-q-combo-pos | CHOOSE | ASSISTED | 9. Combination Throw | Page 39 | PDF_053 (p39) | Unnumbered PKF photo → solution p53-b | QUESTION | Combination throw |  |
| 66 | smcb-combo-advantage | LEARN | ASSISTED | 9. Combination Throw | Page 39 · Figure 3-65 | PDF_053 (p39) | Figure 3-65 → solution p53-c | TEACHING | Combination throw |  |
| 67 | smcb-q-combo-c | PREDICT | INDEPENDENT | 9. Combination Throw | Page 39 · Figure 3-64 | PDF_053 (p39) | Figure 3-64 → solution p53-c | QUESTION | Combination throw |  |
| 68 | smcb-target-drill | LEARN | GUIDED | 10. Ball Pocketing Drills | Page 40 · Figures 3-66 to 3-69 | PDF_054 (p40) | page 40 | DRILL | Ball pocketing drill with a target | cb-path-drill |
| 69 | smcb-q-target-why | IDENTIFY | GUIDED | 10. Ball Pocketing Drills | Page 40 | PDF_054 (p40) | page 40 → solution p54-a | QUESTION | Ball pocketing drill with a target |  |
| 70 | smcb-shoot-max-high | SHOOT (action) | GUIDED | 10. Ball Pocketing Drills | Page 40 · Figures 3-66 to 3-69 | PDF_054 (p40) | Figure 3-66 → solution t54 | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 71 | smcb-q-3things | IDENTIFY | ASSISTED | 10. Ball Pocketing Drills | Page 41 | PDF_055 (p41) | page 41 → solution p55-b | QUESTION | Consistent cue ball path |  |
| 72 | smcb-q-pocket-side | PREDICT | ASSISTED | 10. Ball Pocketing Drills | Page 41 · Figure 3-70 | PDF_055 (p41) | Figure 3-70 → solution p55-a | QUESTION | Consistent cue ball path |  |
| 73 | smcb-shoot-tip-above | SHOOT (action) | ASSISTED | 10. Ball Pocketing Drills | Page 41 · Figure 3-70 | PDF_055 (p41) | Figure 3-70 → solution p55-a | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 74 | smcb-shoot-center-target | SHOOT (action) | INDEPENDENT | 10. Ball Pocketing Drills | Page 41 | PDF_054 (p40) | Figure 3-69 → solution p55-b | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 75 | smcb-shoot-low-target | SHOOT (action) | INDEPENDENT | 10. Ball Pocketing Drills | Page 41 · Figure 3-71 | PDF_055 (p41) | Figure 3-71 → solution p55-c | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 76 | smcb-problem | LEARN | INDEPENDENT | 10. Ball Pocketing Drills | Page 42 · Figures 3-72 to 3-74 | PDF_056 (p42) | page 42 | DRILL | Ball pocketing drill with a target |  |
| 77 | smcb-shoot-problem | SHOOT (action) | INDEPENDENT | 10. Ball Pocketing Drills | Page 42 · Figures 3-73, 3-74 | PDF_056 (p42) | Figure 3-74 → solution p56-a | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 78 | smcb-auto-aim | LEARN | GUIDED | 11. Automatic Aiming | Pages 42–43 | PDF_056 (p42) | page 42 | TEACHING | Automatic aiming | cb-auto-aim |
| 79 | smcb-q-auto-level | IDENTIFY | GUIDED | 11. Automatic Aiming | Page 42 | PDF_056 (p42) | page 42 → solution p56-b | QUESTION | Automatic aiming |  |
| 80 | smcb-q-auto-how | IDENTIFY | ASSISTED | 11. Automatic Aiming | Page 43 | PDF_057 (p43) | page 43 → solution p57-b | QUESTION | Automatic aiming |  |
| 81 | smcb-shoot-3sec | SHOOT (pocket) | INDEPENDENT | 11. Automatic Aiming | Page 43 · unnumbered photo | PDF_057 (p43) | Unnumbered PKF photo → solution p57-b | PHYSICAL SETUP | Automatic aiming |  |
| 82 | smcb-q-next | IDENTIFY | INDEPENDENT | 11. Automatic Aiming | Page 43 | PDF_057 (p43) | page 43 → solution p57-b | QUESTION | Automatic aiming |  |
| 83 | smx-deflect | PREDICT | EXAM | 1. Center Ball vs Sidespin | Page 24 | PDF_038 (p24) | Figure 3-5 → solution p38-b | QUESTION | Deflection | ex-k1 |
| 84 | smx-center-line | CHOOSE | EXAM | 1. Center Ball vs Sidespin | Page 24 | PDF_038 (p24) | Figure 3-3 → solution p38-a | QUESTION | Center family stays on the shooting line |  |
| 85 | smx-level-never | PREDICT | EXAM | 2. Elevation & Sidespin Variables | Page 27 | PDF_041 (p27) | Figure 3-19 → solution p41-a | QUESTION | Level cue: never returns to the line |  |
| 86 | smx-long-straight | IDENTIFY | EXAM | 3. Finding Center | Page 27 | PDF_041 (p27) | Figure 3-20 → solution p41-b | QUESTION | Finding center |  |
| 87 | smx-rail-center | CHOOSE | EXAM | 3. Finding Center | Page 28 | PDF_042 (p28) | Figure 3-24 → solution p43-a | QUESTION | Rail-return center drill | ex-k3 |
| 88 | smx-high-tip | PREDICT | EXAM | 4. High Action | Page 29 | PDF_043 (p29) | Figure 3-28 → solution p43-b | QUESTION | High action contact |  |
| 89 | smx-draw-grip | IDENTIFY | EXAM | 5. Low Action | Page 32 | PDF_046 (p32) | page 32 → solution p46-b | QUESTION | Draw-shot checklist |  |
| 90 | smx-stop-slide | PREDICT | EXAM | 6. Stop Shot | Page 34 | PDF_047 (p33) | Figure 3-41 → solution p48-a | QUESTION | Stop shot: sliding at contact | ex-k2 |
| 91 | smx-pocket-bigger | IDENTIFY | EXAM | 6. Stop Shot | Page 35 | PDF_049 (p35) | Figure 3-48 → solution p49-b | QUESTION | Low action makes the pocket bigger |  |
| 92 | smx-throw-thinner | CHOOSE | EXAM | 8. Ball Pocketing & Throw | Page 38 | PDF_052 (p38) | Figure 3-59 → solution p52-b | QUESTION | Throw |  |
| 93 | smx-combo-line | CHOOSE | EXAM | 9. Combination Throw | Page 39 | PDF_053 (p39) | Unnumbered PKF photo → solution p53-b | QUESTION | Combination throw |  |
| 94 | smx-3things | IDENTIFY | EXAM | 10. Ball Pocketing Drills | Page 41 | PDF_055 (p41) | page 41 → solution p55-b | QUESTION | Consistent cue ball path |  |
| 95 | smx-auto | IDENTIFY | EXAM | 11. Automatic Aiming | Pages 42–43 | PDF_056 (p42) | page 42 → solution p56-b | QUESTION | Automatic aiming |  |
| 96 | smx-x-stop | SHOOT (check) | EXAM | 6. Stop Shot | Pages 33–34 · Figure 3-41 | PDF_047 (p33) | Figure 3-41 → solution p47-b | PHYSICAL SETUP | Stop shot | ex-x1 |
| 97 | smx-x-high | SHOOT (action) | EXAM | 4. High Action | Page 30 · Figure 3-31 | PDF_044 (p30) | Figure 3-31 → solution p44-b | PHYSICAL SETUP | High action drill |  |
| 98 | smx-x-target | SHOOT (action) | EXAM | 10. Ball Pocketing Drills | Page 40 · Figures 3-66 to 3-69 | PDF_054 (p40) | Figure 3-66 → solution t54 | PHYSICAL SETUP | Ball pocketing drill with a target |  |
| 99 | smx-x-3sec | SHOOT (pocket) | EXAM | 11. Automatic Aiming | Page 43 | PDF_057 (p43) | Unnumbered PKF photo → solution p57-b | PHYSICAL SETUP | Automatic aiming |  |

## Cue Ball Control inventory: classification before the move

| Class | Lessons / exam items | Result |
|---|---|---|
| CENTER BALL (Ch.3, printed 23–43) | 26 `cb-*` lessons; exam ex-k1, ex-k2, ex-k3, ex-x1 | **Moved** to this course and removed from Cue Ball Control |
| SLIDING CUE BALL (Ch.4) | `sl-*`; ex-k4, ex-k5, ex-x2 | Stays in Cue Ball Control (section 1) |
| PATTERN PLAY (Ch.5–6) | `ht-*`, `ft-*`; ex-k6..k10, ex-x3, ex-x4 | Stays in Cue Ball Control (sections 2–3) |
| Later cue ball control topics | none | — |

- **Borderline case:** ex-k2 ("stop shot = sliding cue ball") uses the word sliding, but its source is the Ch.3 stop-shot pages (p33). It moved as `smx-stop-slide`.
- **Removed copy:** the old CB copy said "Elevate 45°", which PKF never says. That line is gone.
- **Leftover data:** the old CB "center-ball" REGIONS entries and `images/pkf-cb/*037..057*` stay in place. Nothing uses them; deleting them would only break old bookmarks to the images.

**Cue Ball Control after the move:**
- 3 sections, 41 lessons, 10-item exam.
- 12 lessons have a **Prerequisite skill** card (REVIEW SKILL → `#pkfsmcb/lesson/<id>`):
  - sl-intro and sl-shoot-gate → stop shot
  - ht-intro, ht-spin-limit, ht-shoot-3, ft-intro, ft-no-side and ft-shoot-simple → center family / elevation
  - ht-draw-vs-roll and ft-high-vs-draw → low action
  - ft-sidespin-intro → swerve
  - ft-avoid-side → finding center
- The Cue Ball Control home page shows a "Prerequisite course" card that links here.

## Migration (`migrateFromCueBall`; pure, idempotent, runs at boot and on render)

| Old CB lesson | New lesson(s) |
|---|---|
| cb-intro | smcb-intro |
| cb-elevate-center | smcb-elevate |
| cb-left-deflect | smcb-left-deflect |
| cb-right-veer | smcb-right-veer |
| cb-rule-spin | smcb-rule-spin |
| cb-swerve | smcb-swerve |
| cb-find-center | smcb-find-center |
| cb-stop-9drill | smcb-9drill |
| cb-rail-return | smcb-rail-return |
| cb-shoot-center | smcb-shoot-9drill, smcb-shoot-rail |
| cb-high-action | smcb-high-action |
| cb-high-follow-in | smcb-high-follow-in |
| cb-high-close | smcb-high-close |
| cb-shoot-high | smcb-shoot-high, smcb-shoot-high-close |
| cb-low-action | smcb-low-action |
| cb-draw-tips | smcb-draw-tips |
| cb-draw-drill | smcb-draw-drill |
| cb-stop-physics | smcb-stop-physics |
| cb-stop-diag | smcb-stop-diag |
| cb-soft-stop-why | smcb-q-pocket-bigger |
| cb-shoot-stop | smcb-shoot-stop |
| cb-throw | smcb-throw |
| cb-throw-q | smcb-throw-q |
| cb-path-drill | smcb-target-drill |
| cb-auto-aim | smcb-auto-aim |
| cb-massey-stub | smcb-massey |


- **Exam items:** ex-k1 → smx-deflect · ex-k2 → smx-stop-slide · ex-k3 → smx-rail-center · ex-x1 → smx-x-stop.
- **Completed lessons:** CB lessons that were done are marked done here. Knowledge correct and total counts carry over per section.
- **Missed items:** missed concepts go to REVIEW MISSED CONCEPTS. Missed positions or shots go to PRACTICE MISSED SHOTS.
- **Old section pass:** if the old Center Ball section was passed, all sections here are unlocked.
- **In-progress CB run:** its results override the migrated section data. The run is then parked as `pkfCueBallControl.legacyCurrent`, and the CB `current` is cleared so CB never resumes on an id that no longer exists.
- **Not migrated:** weak-area titles are copied. Exam scores are not, so the new exam has to be earned.
- **Old data:** the old CB data stays in storage; nothing is deleted.

## Duplication check
- The test asserts that no lesson or exam id is shared with Cue Ball Control or Fundamentals (`pkfFund*`).
- It also checks that every moved CB id is gone from Cue Ball Control, that Cue Ball Control cites no printed page below 44, and that this course cites only printed pages 23–43.
- Fundamentals files were not touched.

## Flags for source review
1. **Drills where PKF never says to pocket a ball** use the `check` kind with "Not specified in PKF": 9-ball (3-22), rail return (3-24/3-26), draw (3-39), stop shot (3-41/3-46) and Mosconi (3-52).
   - The 3-39 draw drill is ambiguous: PKF only says "draw back to the second diamond".
2. **Target count:** PKF's goal of 5 target hits differs from the app's 3-attempt setting. Both are shown.
3. **Massey drill:** the "third diamond" rail is not specified by PKF.
4. **Figure numbering:** see Unnumbered figures above (3-55, 3-57 and 3-61 are missing; p23, p25 and p29 have unnumbered images).
5. **Removed claim:** "Elevate 45°" in the old CB copy was invented and has been dropped.

`auditCourse()` returns no problems.
