# PKF Pattern Play — Source Map

Course route `#pkfpattern` · storage key `pkfPatternPlay` · files `js/content/pkfPatternPlayCourse.js`,
`js/content/pkfPatternPlayAssets.js`, `js/ui/pkfPatternPlayPlay.js` · test `scripts/pkfPatternPlayCourse.test.mjs`.

Source: `PKF-Master(2).pdf`, **Chapter Five: HALF TABLE PATTERNS** (printed pages 58–84) and
**Chapter Six: FULL TABLE PATTERNS** (printed pages 85–136), supplied as `PKF_Pattern_Play_Reference_Images.zip`
(84 JPEGs, PDF pages 075–158, plus README.txt). The pack stops before TIPS & TRICKS, and so does the course.
The JPEGs were copied unaltered into `images/pkf-pattern/` (the test checks every file is byte-identical to the zip).
Figures are CSS crops (viewports) on the original page. Nothing is redrawn, recreated or generated.

Course order in the PKF group of Drill Sets & Exams: **Fundamentals → Shot Making & Center Ball → Cue Ball Control →
Pattern Play → Kicking → Banking**. PKF Cue Ball Control is untouched (no code, lesson, exam or migration change, no dedup).

## Page map (from the printed footers)

| PDF | Printed | Notes |
|---|---|---|
| 075 | — | HALF TABLE PATTERNS divider (orange) |
| 076 | — | blank insert |
| 077–103 | 58–84 | printed = PDF − 19 (PDF 077 opens with the Chapter Five banner photo) |
| 104 | — | blank insert |
| 105 | — | FULL TABLE PATTERNS divider (green) |
| 106 | — | blank insert |
| 107–158 | 85–136 | printed = PDF − 22 (PDF 107 opens with the Chapter Six banner photo) |

Captions show the printed page once: `Figure 6-1 · PKF page 85 · tap to enlarge`. Unnumbered figures read
`Unnumbered PKF diagram · PKF page 60 · tap to enlarge` (or `photo`).

## Course shape

9 sections · 180 lessons · 23-item exam (18 knowledge items, of which 12 are planning, + 5 physical).

Section names follow PKF's headings and running text.

| # | Section | Table | Printed pages | Lessons | Table exercises |
|---|---|---|---|---|---|
| 1 | Half Table: Three Ball Patterns | Half table | 58–66 | 30 | 5 |
| 2 | Half Table: Four Ball Patterns | Half table | 66–74 | 23 | 6 |
| 3 | Half Table: Five Ball Patterns | Half table | 74–84 | 27 | 8 |
| 4 | Wagon Wheel | Half table | 84 | 3 | 1 |
| 5 | Full Table: 8-Ball Layouts | Full table | 85–93 | 22 | 4 |
| 6 | Full Table: Balls in Order | Full table | 93–107 | 23 | 4 |
| 7 | Full Table with Sidespin | Full table | 107–118 | 19 | 3 |
| 8 | Pre-Shot Routine | Full table | 118–121 | 6 | 0 |
| 9 | Full Table Patterns from Actual Games | Full table | 121–136 | 27 | 1 |

- **Lesson types:** LEARN 38 · NEXT 12 · WHERE 15 · ROUTE 20 · PROBLEM 21 · RUN 32 · ACTION 29 · SOLVE 4 · SPEED 4 · BUILD 2 · SEQUENCE 3.
- **Assist levels:** GUIDED 36 · ASSISTED 61 · INDEPENDENT 83. Within each section the level never steps back down; in INDEPENDENT patterns the questions come before PKF's pattern is shown.
- **App settings (not PKF rules):** section passes at 70% pattern knowledge; exam passes at 80% overall; 3 attempts per table exercise; the shot-by-shot result buttons.
- **Physical setups:** every NOW RUN THE PATTERN step uses **PKF's original layout image** as the setup. No app coordinates: PKF prints its layouts as diagrams without measurements, so coordinates could not be derived reliably. PKF's own advice to sticker the balls is shown.
- **Shot results:** BALL MADE + POSITION / BALL MADE, POSITION LOST / SHOT MISSED (last shot: BALL MADE / SHOT MISSED), plus WRONG SEQUENCE only on exercises where the order is part of the exercise. Attempt results: PATTERN COMPLETED / PATTERN FAILED — SHOT MISSED / — POSITION LOST / — WRONG SEQUENCE, then RESET / TRY AGAIN.
- **Skip + XP:** every table step has SKIP TABLE STEP (0 Drill XP, practice list, never blocks). Drill XP comes only from recorded table steps (shared `pkfTableStep.js`, same per-drill session formula as the other PKF courses: 135 first try, 75 second try, 0 failed). Skipped exam table items are left out of the execution score.

## Exam

| Exam item | From lesson | Part | Title | Source |
|---|---|---|---|---|
| ppx-p1-last | pp-p1-last | planning | Pattern 1: what do you decide first? | Pages 58–59 · Figures 5-1, 5-2 |
| ppx-p3-route | pp-p3-route | planning | Pattern 3: from the 1 ball | Page 62 · Figures 5-17, 5-18 |
| ppx-p4-solve | pp-p4-solve | planning | Pattern 4: how would you run this? | Pages 63–64 · unnumbered layout, Figures 5-22 to 5-24 |
| ppx-f4-problem | pp-f4-problem | planning | Four ball 4: the problem ball | Page 71 · unnumbered layout, Figure 5-57 |
| ppx-f5-speed | pp-f5-speed | knowledge | Four ball 5: speed on the 1 ball | Pages 73–74 · Figure 5-68 |
| ppx-v1-where | pp-v1-where | planning | Five ball 1: shape on the 3 ball | Page 74 · unnumbered layout, Figures 5-71, 5-72 |
| ppx-v3-stun | pp-v3-stun | knowledge | Five ball 3: an inch or two forward | Pages 79–80 · Figures 5-89, 5-97 |
| ppx-e1-route | pp-e1-route | planning | 6-1: ball in hand on the 5 | Pages 85–86 · Figures 6-1, 6-2, unnumbered photo |
| ppx-e3-build | pp-e3-build | planning | Two solids: build the pattern | Pages 88–89 · unnumbered layout, Figures 6-12, 6-13 |
| ppx-e5-first | pp-e5-first | planning | Three solids: first concern | Page 91 · unnumbered layout |
| ppx-o2-rule | pp-o2-rule | planning | 4 balls in order: end to end | Page 95 · unnumbered layout, Figures 6-42, 6-43 |
| ppx-o4-next | pp-o4-next | planning | 6 balls in order: straight in on the 5 | Page 103 · Figures 6-76 to 6-78 |
| ppx-s-run2 | pp-s-run2 | knowledge | Running english: the 4 ball | Pages 110–111 · Figure 6-107 |
| ppx-s-hold | pp-s-hold | knowledge | Reverse english to hold | Pages 111–112 · Figures 6-109 to 6-111 |
| ppx-s-throw | pp-s-throw | knowledge | Throw | Page 114 · Figures 6-117, 6-118 |
| ppx-r-seq | pp-r-seq | knowledge | The pre-shot questions in order | Page 120 · unnumbered diagram |
| ppx-g3-seq | pp-g3-seq | planning | Game 3: breaking out the 3 | Page 127 · Figures 6-162, 6-163 |
| ppx-g5-where | pp-g5-where | planning | Game 5: the 5 ball to the 6 | Page 134 · Figures 6-197, 6-200 |
| ppx-p1-run | pp-p1-run | physical | Run pattern 1 | Pages 58–60 · Figures 5-1, 5-6 |
| ppx-f2-run | pp-f2-run | physical | Run four ball pattern 2 | Pages 68–69 · Figures 5-41, 5-44 |
| ppx-v2-run | pp-v2-run | physical | Run five ball pattern 2 | Pages 76–77 · unnumbered layout, Figure 5-84 |
| ppx-e1-run | pp-e1-run | physical | 6-1: the 5 ball to the 8 | Pages 85–86 · Figure 6-1, unnumbered photo |
| ppx-o3-run | pp-o3-run | physical | Run the five ball layout | Pages 97–100 · unnumbered layout, Figure 6-57 |

## FLAGGED FOR SOURCE REVIEW

These are kept out of the app UI. The course does not guess on any of them.

1. **Pocket names vs diagram orientation (Chapter Five).** PKF names pockets ("bottom left corner", "top side pocket") as seen in its table photos, which are taken from a different side than the top-down blue layout diagrams. Questions that would ask for a pocket name on a diagram were removed; RUN setups carry a note to match pockets using PKF's photo figures.
2. **Figure 5-79 (C):** the text says "shape on the 3 ball", but the context (five ball pattern 2) means the 5 ball. Quoted as context, not used as an answer.
3. **Unnumbered figures.** PKF skips a figure number wherever an unnumbered layout or photo is printed. The app labels them "Unnumbered PKF diagram/photo" and never cites the missing number:
   - U79a: PDF 79, page 60, diagram at the numbering gap 5-10
   - U82a: PDF 82, page 63, diagram at the numbering gap 5-21
   - U84a: PDF 84, page 65, diagram at the numbering gap 5-29
   - U85a: PDF 85, page 66, diagram at the numbering gap 5-35
   - U88a: PDF 88, page 69, diagram at the numbering gap 5-45
   - U90a: PDF 90, page 71, diagram at the numbering gap 5-56
   - U91a: PDF 91, page 72, photo at the numbering gap 5-61
   - U93a: PDF 93, page 74, photo at the numbering gap 5-69 / 5-70
   - U93b: PDF 93, page 74, diagram at the numbering gap 5-69 / 5-70
   - U95a: PDF 95, page 76, diagram at the numbering gap 5-81
   - U99a: PDF 99, page 80, photo at the numbering gap 5-98 / 5-99
   - U99b: PDF 99, page 80, diagram at the numbering gap 5-98 / 5-99
   - U100a: PDF 100, page 81, photo at the numbering gap 5-104
   - U101a: PDF 101, page 82, diagram at the numbering gap 5-107
   - U108a: PDF 108, page 86, photo at the numbering gap 6-3
   - U108b: PDF 108, page 86, diagram at the numbering gap 6-5
   - U110a: PDF 110, page 88, diagram at the numbering gap 6-11
   - U111a: PDF 111, page 89, diagram at the numbering gap 6-18
   - U113a: PDF 113, page 91, diagram at the numbering gap 6-27
   - U115a: PDF 115, page 93, diagram at the numbering gap 6-35
   - U117a: PDF 117, page 95, diagram at the numbering gap 6-40
   - U119a: PDF 119, page 97, diagram at the numbering gap 6-51
   - U122a: PDF 122, page 100, diagram at the numbering gap 6-64
   - U125a: PDF 125, page 103, diagram at the numbering gap 6-79
   - U130a: PDF 130, page 108, photo at the numbering gap 6-99
   - U135a: PDF 135, page 113, photo at the numbering gap 6-116
   - U137a: PDF 137, page 115, photo at the numbering gap 6-121
   - U138a: PDF 138, page 116, diagram at the numbering gap 6-126
   - U140a: PDF 140, page 118, photo at the numbering gap 6-132
   - U141a: PDF 141, page 119, diagram at the numbering gap 6-134 / 6-135 / 6-136
   - U142a: PDF 142, page 120, diagram at the numbering gap 6-134 / 6-135 / 6-136
   - U142b: PDF 142, page 120, diagram at the numbering gap 6-134 / 6-135 / 6-136
   - U143a: PDF 143, page 121, diagram at the numbering gap 6-139
   - U146a: PDF 146, page 124, diagram at the numbering gap 6-152
   - U147a: PDF 147, page 125, photo at the numbering gap 6-155
   - U148a: PDF 148, page 126, diagram at the numbering gap 6-159
   - U149a: PDF 149, page 127, photo at the numbering gap 6-164
   - U150a: PDF 150, page 128, diagram at the numbering gap 6-169
   - U151a: PDF 151, page 129, photo at the numbering gap 6-175
   - U152a: PDF 152, page 130, photo at the numbering gap 6-180
   - U154a: PDF 154, page 132, diagram at the numbering gap 6-188
4. **Game 3 (8-Ball solids) order** 5 → 4 → 6 → 1 → 2 → 7 → 3 → 8 is assembled across several paragraphs; PKF never prints it as one list.
5. **Game 4 (8-Ball) stripes runout** does not describe every stripe. The wording around the 10-12 combination is unclear and is kept as printed.
6. **No PKF pass criterion** for The Wagon Wheel (PKF: count your strokes) or the marker drill ("near the marker" is not defined). Shown as "Not specified in PKF".
7. **Speeds** are used only where PKF states them: MEDIUM-SOFT = PKF's "between soft and medium"; MEDIUM = PKF's "medium stroke". Elsewhere no speed label is attributed to PKF.
8. **Actual-game layouts (section 9)** have no PKF practice requirement, so they are planning-only (no RUN), except PKF's marker drill. Pattern 5 of the balls-in-order section has no RUN for the same reason.
9. **Pockets not named in PKF's text** are listed on each RUN step as "Not specified in PKF: … (shown in PKF's figures only)" rather than named by the app.
10. **Pages not shown:** dividers and blank inserts (PDF 075, 076, 104, 105, 106) and the chapter banner photos (PDF 077, 107).

## Physical patterns (sequence and route as PKF states them)

| Lesson | Section | Balls / shots | PKF sequence and cue ball route (as PKF states it) | Not specified in PKF |
|---|---|---|---|---|
| pp-p1-run | Half Table: Three Ball Patterns | 3 shots | 1. 1 ball in the side pocket → cue ball off the side rail to the angle on the 2 ball (figure 5-6)<br>2. 2 ball, rolled in → cue ball to the position area for the 3 ball (figures 5-2, 5-3)<br>3. 3 ball in the bottom left corner pocket | Speed (PKF: soft roll on the 1 ball) |
| pp-p2-run | Half Table: Three Ball Patterns | 3 shots | 1. 1 ball (thin slice, center ball) → cue ball to the angle on the 2 ball (figures 5-11, 5-13)<br>2. 2 ball, rolled in → cue ball to position on the 3 ball (figure 5-14)<br>3. 3 ball in the top right corner pocket | Pockets for the 1 and 2 balls (shown in PKF’s figures only) |
| pp-p3-run | Half Table: Three Ball Patterns | 3 shots | 1. 1 ball → cue ball off the rail, above the 2 ball pocket line (figure 5-18)<br>2. 2 ball in the side pocket → cue ball toward the end rail for the 3 ball (figure 5-19)<br>3. 3 ball in the bottom right corner pocket | Pocket for the 1 ball (shown in PKF’s figure only); Speed on the 1 ball |
| pp-p4-run | Half Table: Three Ball Patterns | 3 shots | 1. 1 ball, low spin → cue ball off both side rails into the position area for the 2 ball (figures 5-26, 5-27)<br>2. 2 ball in the top side pocket → cue ball off the side rail for the 3 ball (figure 5-28)<br>3. 3 ball in the bottom right corner pocket | Pocket for the 1 ball (shown in PKF’s figure only) |
| pp-p5-run | Half Table: Three Ball Patterns | 3 shots | 1. 1 ball, extremely thin, just above center, soft → the highlighted area for the 2 ball (figure 5-31)<br>2. 2 ball, very soft, center or a little above → softly off the side rail near the 3 ball (figure 5-32)<br>3. 3 ball in the top right corner pocket | Pockets for the 1 and 2 balls (shown in PKF’s figures only) |
| pp-f1-run | Half Table: Four Ball Patterns | 4 shots | 1. 1 ball → off the side rail to the correct side of the 2 ball pocket line (figure 5-39)<br>2. 2 ball, sliding cue ball → near the 3 ball pocket line (figures 5-37, 5-40)<br>3. 3 ball, roll forward → position on the 4 ball (figure 5-36)<br>4. 4 ball in the top right corner pocket | Pockets for the 1, 2 and 3 balls (shown in PKF’s figures only) |
| pp-f2-run | Half Table: Four Ball Patterns | 4 shots | 1. 1 ball → float to the angle on the 2 ball, not too close to the 2 ball pocket line (figure 5-44)<br>2. 2 ball, a hair of roll → past the 4 ball to the end rail (figure 5-43)<br>3. 3 ball, just above center → to the other side rail for the 4 ball (figure 5-42)<br>4. 4 ball in the bottom right corner pocket | Pockets for the 1 and 2 balls (shown in PKF’s figures only) |
| pp-f3-key | Half Table: Four Ball Patterns | 1 shot | 1. 1 ball → cue ball as close as possible to the end rail | How close counts as “near the end rail” (your judgement) |
| pp-f3-run | Half Table: Four Ball Patterns | 4 shots | 1. 1 ball → near the end rail<br>2. 2 ball, rolled in → off the side rail to near the 3 ball pocket line (figure 5-47)<br>3. 3 ball, stop the cue ball → shape on the 4 ball (figure 5-46)<br>4. 4 ball in the top right corner pocket | Pockets for the 2 and 3 balls (shown in PKF’s figures only) |
| pp-f4-run | Half Table: Four Ball Patterns | 4 shots | 1. 1 ball, maximum high → off the end rail to near the 2 ball pocket line (figure 5-60)<br>2. 2 ball in the bottom left corner → stop or draw a little for the 3 ball (figure 5-62)<br>3. 3 ball → slide up table (A) or draw to the side rail (B) for the 4 ball (figure 5-58)<br>4. 4 ball in the bottom right corner pocket | Pockets for the 1 and 3 balls (shown in PKF’s figures only) |
| pp-f5-run | Half Table: Four Ball Patterns | 4 shots | 1. 1 ball, below center, between soft and medium → off the other side rail, straight in on the 2 (figure 5-68)<br>2. 2 ball → follow past the 3 ball pocket line (figure 5-66)<br>3. 3 ball → cue ball toward the side rail for the 4 ball (figure 5-65)<br>4. 4 ball in the bottom left corner pocket | Pockets for the 1, 2 and 3 balls (shown in PKF’s figures only) |
| pp-v1-run | Half Table: Five Ball Patterns | 5 shots | 1. 1 ball in the bottom right corner, just below center → left side of the 2 ball pocket line (figure 5-75)<br>2. 2 ball, small amount of roll → the 3 ball area up the rail (figure 5-77)<br>3. 3 ball, draw back → above the 4 ball pocket line (figure 5-80)<br>4. 4 ball in the left side pocket → shape on the 5 ball (figure 5-71)<br>5. 5 ball | Pockets for the 2, 3 and 5 balls (shown in PKF’s figures only) |
| pp-v2-key | Half Table: Five Ball Patterns | 1 shot | 1. 1 ball in the side pocket, high action → right below the 2 ball pocket line | — |
| pp-v2-run | Half Table: Five Ball Patterns | 5 shots | 1. 1 ball in the side pocket, high action → right below the 2 ball pocket line (figure 5-84)<br>2. 2 ball, roll forward → the angle on the 3 ball (figure 5-83)<br>3. 3 ball in the corner → the 4 ball area (figure 5-82)<br>4. 4 ball in the bottom right corner → near the 4 ball pocket line for the 5 (figure 5-87)<br>5. 5 ball | Pockets for the 2 and 5 balls (shown in PKF’s figures only) |
| pp-v3-drill | Half Table: Five Ball Patterns | 1 shot | 1. Object ball pocketed → cue ball rolls forward a couple of inches | Exact distances; Pocket (PKF’s example is the 3 ball in figure 5-89) |
| pp-v3-run | Half Table: Five Ball Patterns | 5 shots | 1. 1 ball → above the 2 ball pocket line (figure 5-91)<br>2. 2 ball, sliding cue ball → around the 5 ball to the side rail for the 3 (figure 5-96)<br>3. 3 ball in the top left corner, stun follow → an inch or two forward (figure 5-89)<br>4. 4 ball in the top side pocket, rolled in → shape on the 5 (figure 5-90)<br>5. 5 ball | Pockets for the 1, 2 and 5 balls (shown in PKF’s figures only) |
| pp-v4-key | Half Table: Five Ball Patterns | 1 shot | 1. 1 ball in the top left corner, sliding cue ball → across the 2 ball pocket line, near the 2 ball | — |
| pp-v4-run | Half Table: Five Ball Patterns | 5 shots | 1. 1 ball in the top left corner, sliding → near the 2 ball, across its pocket line (figure 5-102)<br>2. 2 ball, rolling → off the side rail, just below the 3 ball pocket line (figures 5-101, 5-103)<br>3. 3 ball in the top right corner, maximum high → the 4 ball (figure 5-100)<br>4. 4 ball → draw back (small angle) or off the other side rail (figures 5-105, 5-106)<br>5. 5 ball | Pockets for the 2, 4 and 5 balls (shown in PKF’s figures only) |
| pp-v5-run | Half Table: Five Ball Patterns | 5 shots | 1. 1 ball → slight angle on the 2 ball (figure 5-109 or 5-110)<br>2. 2 ball, sliding → the rail target, above the 3 ball pocket line (figure 5-112)<br>3. 3 ball in the side pocket → off the end rail and back up for the 4 (figure 5-114)<br>4. 4 ball, sliding → straight up table for the 5 (figure 5-115)<br>5. 5 ball | Pockets for the 2, 4 and 5 balls (shown in PKF’s figures only) |
| pp-ww-run | Wagon Wheel | 1 shot | 1. Object ball in the side pocket → cue ball strikes the target ball | A pass mark: PKF only says to count your strokes; Number of target balls (as in figure 5-116) |
| pp-e1-run | Full Table: 8-Ball Layouts | 2 shots | 1. 5 ball, about ten percent of it, just above center, soft → cue ball between the first and second diamond of the far side rail, position on the 8<br>2. 8 ball | Pocket for the 8 ball (shown in PKF’s figures only) |
| pp-e2-drill | Full Table: 8-Ball Layouts | 1 shot | 1. Object ball pocketed → cue ball goes around the blocker ball | Where the cue ball must finish beyond the blocker |
| pp-e3-run | Full Table: 8-Ball Layouts | 3 shots (order scored) | 1. 3 ball in the lower right corner, sliding → the position area for the 7 ball (figure 6-13)<br>2. 7 ball, soft rolling → the correct side of the 8 ball (figures 6-12, 6-14)<br>3. 8 ball | Pockets for the 7 and 8 balls (shown in PKF’s figures only) |
| pp-e5-drill | Full Table: 8-Ball Layouts | 1 shot | 1. 1 ball in the side pocket, draw → side rail near the second diamond | — |
| pp-o1-key | Full Table: Balls in Order | 1 shot | 1. 1 ball, high action → off the side rail to the target, into the area for the 2 ball | Pocket for the 1 ball (shown in PKF’s figure only) |
| pp-o2-key | Full Table: Balls in Order | 1 shot | 1. 1 ball in the top left corner, a little above center → side rail target, near the end rail, below the 2 ball line | — |
| pp-o3-run | Full Table: Balls in Order | 5 shots | 1. 1 ball in the side, high action → on or very close to the 2 ball line (figure 6-57)<br>2. 2 ball, rolled in → two rails for the 3 ball (figure 6-55)<br>3. 3 ball → back toward the other end rail for the 4 (figure 6-60)<br>4. 4 ball → two rails for the 5 (figures 6-53, 6-63)<br>5. 5 ball | Pockets for the 2, 3, 4 and 5 balls (shown in PKF’s figures only) |
| pp-o4-key | Full Table: Balls in Order | 1 shot | 1. 4 ball in the side, a little low spin → toward the side rail into the position area for the 5 ball | Exact distances |
| pp-s-throwdrill | Full Table with Sidespin | 1 shot | 1. Object ball thrown into the corner pocket with minimal cue ball movement | — |
| pp-s-tworail | Full Table with Sidespin | 1 shot | 1. Object ball pocketed, high right → two rails to the target | Object ball and cue ball placement as drawn in PKF’s figure only |
| pp-s-overdrill | Full Table with Sidespin | 1 shot | 1. Object ball pocketed over the ball, low right → two rails to the target | Object ball and cue ball placement as drawn in PKF’s figure only |
| pp-m-run | Full Table Patterns from Actual Games | 5 shots (order scored) | 1. Marker for the 3, then the 1 and 2 → near the marker<br>2. Marker for the 5, then the 3 and 4 → near the marker<br>3. Marker for the 7, then the 5 and 6 → near the marker<br>4. Marker for the 9, then the 7 and 8 → near the marker<br>5. 9 ball | How close counts as “near the marker” (PKF doesn’t say) |


## Page-by-page audit

Every numbered page is used. Divider and blank pages are never shown. Number of balls, ball positions and cue-ball
positions come from the original image on each page (no measurements are printed). Action, speed and pockets are
recorded only where PKF's text states them (see the lessons and the physical pattern table above).

| PDF | Image | Printed | PKF section | Figures on the page | Type | Concepts | Lessons (figure / solution) | Lessons citing the page |
|---|---|---|---|---|---|---|---|---|
| 075 | PKF_PatternPlay_PDF_075.jpg | — | — | — | HALF TABLE PATTERNS divider (not shown) | — | — | — |
| 076 | PKF_PatternPlay_PDF_076.jpg | — | — | — | blank insert (not shown) | — | — | — |
| 077 | PKF_PatternPlay_PDF_077.jpg | 58 | Half Table: Three Ball Patterns | 5-1 | explanation, example, exercise Chapter banner photo (not used). | Half table rules; Work backwards from the last ball; Half table runout | pp-ht-rules, pp-ht-cross, pp-p1-last, pp-p1-run, ppx-p1-last, ppx-p1-run | pp-p1-learn |
| 078 | PKF_PatternPlay_PDF_078.jpg | 59 | Half Table: Three Ball Patterns | 5-2, 5-3, 5-4, 5-5, 5-6 | example, exercise | Work backwards from the last ball; Let the angles do the work; Use a rail instead of perfect speed; Half table runout | pp-p1-last, pp-p1-where2, pp-p1-route, pp-p1-learn, pp-p1-run, ppx-p1-last, ppx-p1-run | — |
| 079 | PKF_PatternPlay_PDF_079.jpg | 60 | Half Table: Three Ball Patterns | 5-7, 5-8, 5-9, U79a (unnumbered) | example, exercise | Angle on the object ball; Thin cut on a hanging ball; Half table runout; Work backwards from the last ball | pp-p1-rail, pp-p1-ab, pp-p2-last, pp-p2-action, pp-p2-run | pp-p1-learn, pp-p1-run, pp-p2-learn, ppx-p1-run |
| 080 | PKF_PatternPlay_PDF_080.jpg | 61 | Half Table: Three Ball Patterns | 5-11, 5-12, 5-13, 5-14 | example, exercise | Thin cut on a hanging ball; Sidespin makes position less precise; High action off the rail; Half table runout | pp-p2-last, pp-p2-amateur, pp-p2-action, pp-p2-flat, pp-p2-learn, pp-p2-run | — |
| 081 | PKF_PatternPlay_PDF_081.jpg | 62 | Half Table: Three Ball Patterns | 5-15, 5-16, 5-17, 5-18 | example, exercise | Correct side of the pocket line; Use a rail instead of perfect speed; Half table runout | pp-p3-where, pp-p3-route, pp-p3-run, ppx-p3-route | pp-p3-learn |
| 082 | PKF_PatternPlay_PDF_082.jpg | 63 | Half Table: Three Ball Patterns | 5-19, 5-20, U82a (unnumbered), 5-22 | example, exercise | Sliding vs rolling cue ball; Correct side of the pocket line; Choose the pocket with the bigger window; Half table runout | pp-p3-close, pp-p3-learn, pp-p4-solve, pp-p4-run, ppx-p4-solve | pp-p3-where, pp-p3-run, pp-p4-learn |
| 083 | PKF_PatternPlay_PDF_083.jpg | 64 | Half Table: Three Ball Patterns | 5-23, 5-24, 5-25, 5-26, 5-27 | example, exercise | Choose the pocket with the bigger window; Two rails for a greater margin of error; Low spin on the two-rail shot; Half table runout | pp-p4-solve, pp-p4-route, pp-p4-low, pp-p4-learn, pp-p4-run, ppx-p4-solve | — |
| 084 | PKF_PatternPlay_PDF_084.jpg | 65 | Half Table: Three Ball Patterns | 5-28, U84a (unnumbered), 5-30, 5-31 | example, exercise | Speed depends on the angle; Natural position instead of forcing; Half table runout; Choose the pocket with the bigger window | pp-p4-speed, pp-p5-solve, pp-p5-run | pp-p4-learn, pp-p4-run, pp-p5-learn |
| 085 | PKF_PatternPlay_PDF_085.jpg | 66 | Half Table: Three Ball Patterns | 5-32, 5-33, 5-34, U85a (unnumbered) | example, exercise | Don’t play for flatter angles; Natural position instead of forcing; Use a rail instead of perfect speed; Half table runout; Sliding cue ball; Work backwards from the last ball | pp-p5-flat, pp-p5-learn, pp-f1-route, pp-f1-run | pp-p5-solve, pp-p5-run, pp-f1-action, pp-f1-learn |
| 086 | PKF_PatternPlay_PDF_086.jpg | 67 | Half Table: Four Ball Patterns | 5-36, 5-37, 5-38, 5-39, 5-40 | example, exercise | Use a rail instead of perfect speed; Sliding cue ball; Work backwards from the last ball; Half table runout | pp-f1-route, pp-f1-action, pp-f1-learn, pp-f1-run | — |
| 087 | PKF_PatternPlay_PDF_087.jpg | 68 | Half Table: Four Ball Patterns | 5-41, 5-43, 5-42, 5-44 | example, exercise | Least effort position; A hair of roll changes the path; Plan around a hanging ball; Half table runout | pp-f2-where, pp-f2-roll, pp-f2-learn, pp-f2-run, ppx-f2-run | — |
| 088 | PKF_PatternPlay_PDF_088.jpg | 69 | Half Table: Four Ball Patterns | U88a (unnumbered), 5-46, 5-47, 5-48 | example, drill, exercise | Work backwards from the last ball; Know several shots; Key shot drill; Half table runout; Plan around a hanging ball; Angle does the work | pp-f3-next, pp-f3-learn, pp-f3-key, pp-f3-run | pp-f2-learn, pp-f2-run, pp-f3-angle, ppx-f2-run |
| 089 | PKF_PatternPlay_PDF_089.jpg | 70 | Half Table: Four Ball Patterns | 5-49, 5-50, 5-51, 5-52, 5-53 | example, drill, exercise | Angle does the work; Sliding vs rolling cue ball; Key shot drill; Know several shots; Half table runout | pp-f3-angle, pp-f3-roll, pp-f3-key | pp-f3-learn, pp-f3-run |
| 090 | PKF_PatternPlay_PDF_090.jpg | 71 | Half Table: Four Ball Patterns | 5-54, 5-55, U90a (unnumbered), 5-57, 5-58 | example, exercise | Find the problem ball; Use a rail instead of perfect speed; Half table runout; Know several shots | pp-f4-problem, pp-f4-route, pp-f4-run, ppx-f4-problem | pp-f3-learn, pp-f4-learn |
| 091 | PKF_PatternPlay_PDF_091.jpg | 72 | Half Table: Four Ball Patterns | 5-59, 5-60, U91a (unnumbered), 5-62, 5-63 | example, exercise | Use a rail instead of perfect speed; Don’t overdo position; Find the problem ball; Half table runout | pp-f4-route, pp-f4-next, pp-f4-learn, pp-f4-run | — |
| 092 | PKF_PatternPlay_PDF_092.jpg | 73 | Half Table: Four Ball Patterns | 5-64, 5-65, 5-66, 5-67, 5-68 | example, exercise | Angle does the work; Half table runout | pp-f5-solve, pp-f5-speed, pp-f5-learn, pp-f5-run, ppx-f5-speed | — |
| 093 | PKF_PatternPlay_PDF_093.jpg | 74 | Half Table: Four Ball Patterns | U93a (unnumbered), U93b (unnumbered), 5-71, 5-72 | example, exercise | Correct side of the pocket line; Sliding cue ball path; Half table runout; Angle does the work | pp-v1-where, pp-v1-ghost, pp-v1-run, ppx-v1-where | pp-f5-speed, pp-f5-learn, pp-f5-run, pp-v1-learn, ppx-f5-speed |
| 094 | PKF_PatternPlay_PDF_094.jpg | 75 | Half Table: Five Ball Patterns | 5-73, 5-74, 5-75, 5-76, 5-77 | example, exercise | Sliding cue ball path; A hair of roll changes the path; Correct side of the pocket line; Half table runout | pp-v1-ghost, pp-v1-roll, pp-v1-learn, pp-v1-run | — |
| 095 | PKF_PatternPlay_PDF_095.jpg | 76 | Half Table: Five Ball Patterns | 5-78, 5-79, 5-80, U95a (unnumbered) | example, exercise | Sliding vs rolling cue ball; High action off the rail; Half table runout; Correct side of the pocket line | pp-v1-tip, pp-v2-route, pp-v2-run, ppx-v2-run | pp-v1-learn, pp-v1-run, pp-v2-learn |
| 096 | PKF_PatternPlay_PDF_096.jpg | 77 | Half Table: Five Ball Patterns | 5-82, 5-83, 5-84, 5-85, 5-86, 5-87 | example, drill, exercise | High action off the rail; Correct side of the pocket line; Key shot drill; Half table runout | pp-v2-route, pp-v2-where, pp-v2-learn, pp-v2-key, pp-v2-run, ppx-v2-run | — |
| 097 | PKF_PatternPlay_PDF_097.jpg | 78 | Half Table: Five Ball Patterns | 5-88, 5-89, 5-90, 5-91, 5-92 | example, drill, exercise | Play for the bigger window; Use a rail instead of perfect speed; Stun follow; Half table runout | pp-v3-where, pp-v3-ways, pp-v3-stun, pp-v3-drill, pp-v3-run, ppx-v3-stun | pp-v3-learn |
| 098 | PKF_PatternPlay_PDF_098.jpg | 79 | Half Table: Five Ball Patterns | 5-93, 5-94, 5-95, 5-96 | example, exercise | Use a rail instead of perfect speed; Play for the bigger window; Half table runout; Stun follow | pp-v3-ways, pp-v3-learn, pp-v3-run | pp-v3-stun, ppx-v3-stun |
| 099 | PKF_PatternPlay_PDF_099.jpg | 80 | Half Table: Five Ball Patterns | 5-97, U99a (unnumbered), U99b (unnumbered), 5-100 | example, drill, exercise | Stun follow; Correct side of the pocket line; Half table runout; Play for the bigger window | pp-v3-stun, pp-v3-speed, pp-v3-drill, pp-v4-where, pp-v4-run, ppx-v3-stun | pp-v3-learn, pp-v3-run, pp-v4-learn |
| 100 | PKF_PatternPlay_PDF_100.jpg | 81 | Half Table: Five Ball Patterns | 5-101, 5-102, 5-103, U100a (unnumbered) | example, drill, exercise | Use a rail instead of perfect speed; Correct side of the pocket line; Key shot drill; Half table runout | pp-v4-route, pp-v4-learn, pp-v4-key, pp-v4-run | — |
| 101 | PKF_PatternPlay_PDF_101.jpg | 82 | Half Table: Five Ball Patterns | 5-105, 5-106, U101a (unnumbered), 5-108, 5-109 | example, exercise | Sliding cue ball path; Half table runout; Correct side of the pocket line; Find and remove problem shots | pp-v5-solve, pp-v5-run | pp-v4-learn, pp-v4-run, pp-v5-learn |
| 102 | PKF_PatternPlay_PDF_102.jpg | 83 | Half Table: Five Ball Patterns | 5-110, 5-111, 5-112, 5-113, 5-114 | example, exercise | Use a rail instead of perfect speed; Find and remove problem shots; Half table runout | pp-v5-route, pp-v5-learn, pp-v5-run | — |
| 103 | PKF_PatternPlay_PDF_103.jpg | 84 | Half Table: Five Ball Patterns | 5-115, 5-116, 5-117 | explanation, example, drill, exercise | Wagon Wheel drill; Find and remove problem shots; Half table runout | pp-ww-learn, pp-ww-next, pp-ww-run | pp-v5-learn, pp-v5-run |
| 104 | PKF_PatternPlay_PDF_104.jpg | — | — | — | blank insert (not shown) | — | — | — |
| 105 | PKF_PatternPlay_PDF_105.jpg | — | — | — | FULL TABLE PATTERNS divider (not shown) | — | — | — |
| 106 | PKF_PatternPlay_PDF_106.jpg | — | — | — | blank insert (not shown) | — | — | — |
| 107 | PKF_PatternPlay_PDF_107.jpg | 85 | Full Table: 8-Ball Layouts | 6-1, 6-2 | explanation, example, exercise Chapter banner photo (not used). | Full table pattern play; Cue ball close for a precise hit | pp-e-intro, pp-e1-route, pp-e1-run, ppx-e1-route, ppx-e1-run | — |
| 108 | PKF_PatternPlay_PDF_108.jpg | 86 | Full Table: 8-Ball Layouts | U108a (unnumbered), 6-4, U108b (unnumbered) | example, exercise | Cue ball close for a precise hit; Sliding cue ball path as a reference | pp-e1-route, pp-e1-thin, pp-e1-run, pp-e2-route, ppx-e1-route, ppx-e1-run | — |
| 109 | PKF_PatternPlay_PDF_109.jpg | 87 | Full Table: 8-Ball Layouts | 6-6, 6-7, 6-8, 6-9 | example, drill | Sliding cue ball path as a reference | pp-e2-route, pp-e2-action, pp-e2-drill | — |
| 110 | PKF_PatternPlay_PDF_110.jpg | 88 | Full Table: 8-Ball Layouts | 6-10, U110a (unnumbered), 6-12, 6-13 | example, drill, exercise | Sliding cue ball path as a reference; Find the ball that gets you on the 8; Full table runout; Sliding vs rolling cue ball | pp-e2-drill, pp-e3-build, pp-e3-learn, pp-e3-run, ppx-e3-build | pp-e3-action |
| 111 | PKF_PatternPlay_PDF_111.jpg | 89 | Full Table: 8-Ball Layouts | 6-14, 6-15, 6-16, 6-17, U111a (unnumbered) | example, exercise | Sliding vs rolling cue ball; Angle changes the rolling path; Stun follow; More than one runout; Find the ball that gets you on the 8; Full table runout | pp-e3-action, pp-e3-angle, pp-e3-stun, pp-e4-seq | pp-e3-build, pp-e3-learn, pp-e3-run, pp-e4-learn, ppx-e3-build |
| 112 | PKF_PatternPlay_PDF_112.jpg | 90 | Full Table: 8-Ball Layouts | 6-19, 6-20, 6-21, 6-22, 6-23 | example | More than one runout; Danger areas | pp-e4-seq, pp-e4-danger | pp-e4-learn |
| 113 | PKF_PatternPlay_PDF_113.jpg | 91 | Full Table: 8-Ball Layouts | 6-24, 6-25, 6-26, U113a (unnumbered) | example | Stun follow; More than one runout; Find the ball that gets you on the 8; Pick a pattern that is easy to repeat; Sliding cue ball path as a reference | pp-e4-stun, pp-e4-learn, pp-e5-first, pp-e5-build, ppx-e5-first | pp-e4-seq, pp-e5-action, pp-e5-learn |
| 114 | PKF_PatternPlay_PDF_114.jpg | 92 | Full Table: 8-Ball Layouts | 6-28, 6-29, 6-30, 6-31 | example | Find the ball that gets you on the 8; Sliding cue ball path as a reference; Pick a pattern that is easy to repeat | pp-e5-first, pp-e5-action, pp-e5-learn, ppx-e5-first | pp-e5-build |
| 115 | PKF_PatternPlay_PDF_115.jpg | 93 | Full Table: 8-Ball Layouts | 6-32, 6-33, 6-34, U115a (unnumbered) | example, drill | Pick a pattern that is easy to repeat; Key shot drill; Use a rail instead of perfect speed; Sliding cue ball path | pp-e5-build, pp-e5-drill, pp-o1-route, pp-o1-key | pp-e5-learn, pp-o1-learn |
| 116 | PKF_PatternPlay_PDF_116.jpg | 94 | Full Table: Balls in Order | 6-36, 6-37, 6-38, 6-39 | example, drill | Use a rail instead of perfect speed; Sliding cue ball; Sliding cue ball path; Key shot drill | pp-o1-route, pp-o1-action, pp-o1-learn, pp-o1-key | — |
| 117 | PKF_PatternPlay_PDF_117.jpg | 95 | Full Table: Balls in Order | U117a (unnumbered), 6-41, 6-42, 6-43 | example | Study the sliding path first; Middle of the position area | pp-o2-rule, pp-o2-where, pp-o2-learn, ppx-o2-rule | — |
| 118 | PKF_PatternPlay_PDF_118.jpg | 96 | Full Table: Balls in Order | 6-44, 6-45, 6-46, 6-47, 6-48 | example, drill | Middle of the position area; Key shot drill; Sliding vs rolling cue ball; Study the sliding path first | pp-o2-where, pp-o2-key | pp-o2-problem, pp-o2-learn |
| 119 | PKF_PatternPlay_PDF_119.jpg | 97 | Full Table: Balls in Order | 6-49, 6-50, U119a (unnumbered), 6-52, 6-53 | example, exercise | Sliding vs rolling cue ball; Angles on a ball near a pocket; Full table runout; Study the sliding path first | pp-o2-problem, pp-o3-where, pp-o3-run, ppx-o3-run | pp-o2-learn, pp-o3-learn |
| 120 | PKF_PatternPlay_PDF_120.jpg | 98 | Full Table: Balls in Order | 6-54, 6-55, 6-56, 6-57, 6-58 | example, exercise | Stun follow; Angles on a ball near a pocket; Full table runout | pp-o3-stun, pp-o3-learn, pp-o3-run, ppx-o3-run | pp-o3-where |
| 121 | PKF_PatternPlay_PDF_121.jpg | 99 | Full Table: Balls in Order | 6-59, 6-60, 6-61, 6-62 | example, exercise | Stun follow; Sliding before rolling; Angles on a ball near a pocket; Full table runout | pp-o3-stun, pp-o3-lower | pp-o3-learn, pp-o3-run, ppx-o3-run |
| 122 | PKF_PatternPlay_PDF_122.jpg | 100 | Full Table: Balls in Order | 6-63, U122a (unnumbered), 6-65, 6-66 | example, exercise | Find the problem ball; Low spin widens the window; Angles on a ball near a pocket; Full table runout; Roll it in, or use the sliding path | pp-o4-problem, pp-o4-action | pp-o3-learn, pp-o3-run, pp-o4-learn, ppx-o3-run |
| 123 | PKF_PatternPlay_PDF_123.jpg | 101 | Full Table: Balls in Order | 6-67, 6-68, 6-69, 6-70 | example | Roll it in, or use the sliding path | pp-o4-learn | — |
| 124 | PKF_PatternPlay_PDF_124.jpg | 102 | Full Table: Balls in Order | 6-71, 6-72, 6-73, 6-74, 6-75 | example, drill | Low spin widens the window; Roll it in, or use the sliding path | pp-o4-action, pp-o4-key | pp-o4-learn |
| 125 | PKF_PatternPlay_PDF_125.jpg | 103 | Full Table: Balls in Order | 6-76, 6-77, 6-78, U125a (unnumbered) | example | Don’t leave yourself too close; Find the problem ball; Roll it in, or use the sliding path; Rolling cue ball shots | pp-o4-next, pp-o5-problem, ppx-o4-next | pp-o4-learn, pp-o5-learn |
| 126 | PKF_PatternPlay_PDF_126.jpg | 104 | Full Table: Balls in Order | 6-80, 6-81, 6-82, 6-83, 6-84 | example | Find the problem ball; Angle does the work; Rolling cue ball shots | pp-o5-problem, pp-o5-route | pp-o5-learn |
| 127 | PKF_PatternPlay_PDF_127.jpg | 105 | Full Table: Balls in Order | 6-85, 6-86, 6-87, 6-88 | example | Rolling cue ball shots; Travel along the position line | pp-o5-learn | pp-o5-where |
| 128 | PKF_PatternPlay_PDF_128.jpg | 106 | Full Table: Balls in Order | 6-89, 6-90, 6-91, 6-92, 6-93 | example | Travel along the position line; Rolling cue ball shots | pp-o5-where | pp-o5-learn |
| 129 | PKF_PatternPlay_PDF_129.jpg | 107 | Full Table: Balls in Order | 6-94, 6-95, 6-96 | explanation, example | Sidespin, speed and elevation; When to avoid sidespin; Rolling cue ball shots | pp-s-intro, pp-s-over | pp-o5-learn |
| 130 | PKF_PatternPlay_PDF_130.jpg | 108 | Full Table with Sidespin | 6-97, 6-98, U130a (unnumbered), 6-100 | example | When to avoid sidespin; Deceleration | pp-s-rail, pp-s-decel | — |
| 131 | PKF_PatternPlay_PDF_131.jpg | 109 | Full Table with Sidespin | 6-101, 6-102, 6-103 | example | When to avoid sidespin; Running english | pp-s-worth, pp-s-path | — |
| 132 | PKF_PatternPlay_PDF_132.jpg | 110 | Full Table with Sidespin | 6-104, 6-105, 6-106 | explanation, example | Running english | pp-s-path, pp-s-running, pp-s-run1 | pp-s-run2, ppx-s-run2 |
| 133 | PKF_PatternPlay_PDF_133.jpg | 111 | Full Table with Sidespin | 6-107, 6-108, 6-109, 6-110 | explanation, example | Running english; Reverse english | pp-s-run2, ppx-s-run2 | pp-s-running, pp-s-hold, ppx-s-hold |
| 134 | PKF_PatternPlay_PDF_134.jpg | 112 | Full Table with Sidespin | 6-111, 6-112 | example | Reverse english | pp-s-hold, ppx-s-hold | — |
| 135 | PKF_PatternPlay_PDF_135.jpg | 113 | Full Table with Sidespin | 6-113, 6-114, 6-115, U135a (unnumbered) | example | Running english | pp-s-draw | — |
| 136 | PKF_PatternPlay_PDF_136.jpg | 114 | Full Table with Sidespin | 6-117, 6-118, 6-119 | explanation, example | Throw | pp-s-throw, pp-s-kill, ppx-s-throw | — |
| 137 | PKF_PatternPlay_PDF_137.jpg | 115 | Full Table with Sidespin | 6-120, U137a (unnumbered), 6-122 | explanation, drill | Throw | pp-s-throwdrill | pp-s-kill |
| 138 | PKF_PatternPlay_PDF_138.jpg | 116 | Full Table with Sidespin | 6-123, 6-124, 6-125, U138a (unnumbered) | example | Sidespin, speed and elevation | pp-s-curve | — |
| 139 | PKF_PatternPlay_PDF_139.jpg | 117 | Full Table with Sidespin | 6-127, 6-128, 6-129, 6-130 | explanation, example, drill | Throw; Typical sidespin shots | pp-s-frozen, pp-s-typical, pp-s-tworail | — |
| 140 | PKF_PatternPlay_PDF_140.jpg | 118 | Full Table with Sidespin | 6-131, U140a (unnumbered) | explanation, example, drill | Typical sidespin shots; Pre-shot routine | pp-s-overdrill | pp-s-typical, pp-r-intro, pp-r-plan |
| 141 | PKF_PatternPlay_PDF_141.jpg | 119 | Pre-Shot Routine | 6-133, U141a (unnumbered) | explanation, example | Pre-shot routine | pp-r-intro, pp-r-plan, pp-r-doubt | — |
| 142 | PKF_PatternPlay_PDF_142.jpg | 120 | Pre-Shot Routine | U142a (unnumbered), U142b (unnumbered) | explanation, example | Visualization | pp-r-visual, pp-r-seq, ppx-r-seq | — |
| 143 | PKF_PatternPlay_PDF_143.jpg | 121 | Pre-Shot Routine | 6-137, 6-138, U143a (unnumbered) | example | Pre-shot routine; Rails when the path is blocked; Actual game runout | pp-r-pause, pp-g1-route | pp-g1-learn |
| 144 | PKF_PatternPlay_PDF_144.jpg | 122 | Full Table Patterns from Actual Games | 6-140, 6-141, 6-142, 6-143, 6-144 | example | Rails when the path is blocked; Pocket lines; Actual game runout | pp-g1-route, pp-g1-where | pp-g1-learn |
| 145 | PKF_PatternPlay_PDF_145.jpg | 123 | Full Table Patterns from Actual Games | 6-145, 6-146, 6-147, 6-148, 6-149 | example | Stun follow with sidespin; Pocket lines; Actual game runout | pp-g1-action | pp-g1-where, pp-g1-learn |
| 146 | PKF_PatternPlay_PDF_146.jpg | 124 | Full Table Patterns from Actual Games | 6-150, 6-151, U146a (unnumbered), 6-153, 6-154 | example | Feel for the rolling cue ball; Actual game runout; Find the problem ball | pp-g1-seven, pp-g1-learn, pp-g2-problem, pp-g2-learn | — |
| 147 | PKF_PatternPlay_PDF_147.jpg | 125 | Full Table Patterns from Actual Games | U147a (unnumbered), 6-156, 6-157 | example | Rolling path first, then sidespin; Power makes the pocket smaller; Safer position area; Actual game runout | pp-g2-action, pp-g2-speed | pp-g2-where, pp-g2-learn |
| 148 | PKF_PatternPlay_PDF_148.jpg | 126 | Full Table Patterns from Actual Games | 6-158, U148a (unnumbered), 6-160, 6-161 | example | Safer position area; Find the problem ball; Sliding path as a reference; Actual game runout | pp-g2-where, pp-g3-problem, pp-g3-action | pp-g2-learn, pp-g3-learn |
| 149 | PKF_PatternPlay_PDF_149.jpg | 127 | Full Table Patterns from Actual Games | 6-162, 6-163, U149a (unnumbered), 6-165, 6-166 | example | Insurance ball; Actual game runout | pp-g3-seq, pp-g3-route, pp-g3-learn, ppx-g3-seq | — |
| 150 | PKF_PatternPlay_PDF_150.jpg | 128 | Full Table Patterns from Actual Games | 6-167, 6-168, U150a (unnumbered), 6-170 | example | Choosing a group; Attack the hardest problem first; Actual game runout | pp-g4-choose, pp-g4-first | pp-g3-learn, pp-g4-learn |
| 151 | PKF_PatternPlay_PDF_151.jpg | 129 | Full Table Patterns from Actual Games | 6-171, 6-172, 6-173, 6-174, U151a (unnumbered) | example | Attack the hardest problem first; Guarantee a shot; Choosing a group; Actual game runout | pp-g4-first, pp-g4-combo | pp-g4-choose, pp-g4-learn |
| 152 | PKF_PatternPlay_PDF_152.jpg | 130 | Full Table Patterns from Actual Games | 6-176, 6-177, 6-178, 6-179, U152a (unnumbered) | example | Actual game runout | pp-g4-learn | — |
| 153 | PKF_PatternPlay_PDF_153.jpg | 131 | Full Table Patterns from Actual Games | 6-181, 6-182, 6-183, 6-184, 6-185 | example | Reverse english; Actual game runout | pp-g4-six | pp-g4-learn |
| 154 | PKF_PatternPlay_PDF_154.jpg | 132 | Full Table Patterns from Actual Games | 6-186, 6-187, U154a (unnumbered), 6-189, 6-190 | example | Rails for a bigger window; Actual game runout | pp-g5-route | pp-g4-learn, pp-g5-learn |
| 155 | PKF_PatternPlay_PDF_155.jpg | 133 | Full Table Patterns from Actual Games | 6-191, 6-192, 6-193, 6-194, 6-195 | example | Rails for a bigger window; Low spin widens the angle; Actual game runout | pp-g5-route, pp-g5-action | pp-g5-learn |
| 156 | PKF_PatternPlay_PDF_156.jpg | 134 | Full Table Patterns from Actual Games | 6-196, 6-197, 6-198, 6-199, 6-200 | example | Middle of the position area; Actual game runout | pp-g5-where, ppx-g5-where | pp-g5-learn |
| 157 | PKF_PatternPlay_PDF_157.jpg | 135 | Full Table Patterns from Actual Games | 6-201, 6-202, 6-203, 6-204, 6-205 | explanation, example, exercise | Actual game runout; Marker drill | pp-g5-learn, pp-m-learn, pp-m-next, pp-m-run | — |
| 158 | PKF_PatternPlay_PDF_158.jpg | 136 | Full Table Patterns from Actual Games | 6-206, 6-207, 6-208, 6-209 | explanation, exercise | Marker drill | — | pp-m-learn, pp-m-run |


## lessonId → source mapping

Purpose values: TEACHING / QUESTION / SOLUTION / PHYSICAL SETUP / REFERENCE / PATTERN. When a question's figure is also
PKF's answer figure, the comparison opens PKF's full original page (`t<pdf>`). Figures that print the answer are hidden
until LOCK.

| lessonId | type | assist | sourceImage | sourcePage | sourceFigure | PKF section | crop (x, y, w, h) | pattern | purpose | solution / comparison image |
|---|---|---|---|---|---|---|---|---|---|---|
| pp-ht-rules | LEARN | GUIDED | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | rules | TEACHING | — |
| pp-ht-cross | NEXT | GUIDED | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | rules | QUESTION | page 58 (p. 58) |
| pp-p1-last | NEXT | GUIDED | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | ht3-1 | QUESTION | Figure 5-2 (p. 59) |
| pp-p1-where2 | WHERE | GUIDED | PKF_PatternPlay_PDF_078.jpg | 59 | Figure 5-2 | Half Table: Three Ball Patterns | 0.076, 0.232, 0.422, 0.189 | ht3-1 | QUESTION | Figure 5-3 (p. 59) |
| pp-p1-route | ROUTE | GUIDED | PKF_PatternPlay_PDF_078.jpg | 59 | Figure 5-3 | Half Table: Three Ball Patterns | 0.503, 0.232, 0.422, 0.189 | ht3-1 | QUESTION | Figure 5-6 (p. 59) |
| pp-p1-rail | PROBLEM | GUIDED | PKF_PatternPlay_PDF_079.jpg | 60 | Figure 5-7 | Half Table: Three Ball Patterns | 0.076, 0.174, 0.422, 0.189 | ht3-1 | QUESTION | Figure 5-8 (p. 60) |
| pp-p1-ab | PROBLEM | GUIDED | PKF_PatternPlay_PDF_079.jpg | 60 | Figure 5-9 | Half Table: Three Ball Patterns | 0.462, 0.393, 0.463, 0.206 | ht3-1 | QUESTION | page 60 (p. 60) |
| pp-p1-learn | LEARN | GUIDED | PKF_PatternPlay_PDF_078.jpg | 59 | Figure 5-6 | Half Table: Three Ball Patterns | 0.445, 0.737, 0.480, 0.212 | ht3-1 | PATTERN | — |
| pp-p1-run | RUN | GUIDED | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | ht3-1 | PHYSICAL SETUP | Figure 5-6 (p. 59) |
| pp-p2-last | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_079.jpg | 60 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.628, 0.595, 0.238 | ht3-2 | QUESTION | Figure 5-11 (p. 61) |
| pp-p2-amateur | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_080.jpg | 61 | Figure 5-12 | Half Table: Three Ball Patterns | 0.503, 0.151, 0.422, 0.189 | ht3-2 | QUESTION | page 61 (p. 61) |
| pp-p2-action | ACTION | ASSISTED | PKF_PatternPlay_PDF_079.jpg | 60 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.628, 0.595, 0.238 | ht3-2 | QUESTION | Figure 5-13 (p. 61) |
| pp-p2-flat | ACTION | ASSISTED | PKF_PatternPlay_PDF_080.jpg | 61 | Figure 5-11 | Half Table: Three Ball Patterns | 0.076, 0.151, 0.422, 0.189 | ht3-2 | QUESTION | Figure 5-14 (p. 61) |
| pp-p2-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_080.jpg | 61 | Figure 5-13 | Half Table: Three Ball Patterns | 0.076, 0.404, 0.488, 0.218 | ht3-2 | PATTERN | — |
| pp-p2-run | RUN | ASSISTED | PKF_PatternPlay_PDF_079.jpg | 60 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.628, 0.595, 0.238 | ht3-2 | PHYSICAL SETUP | Figure 5-13 (p. 61) |
| pp-p3-where | WHERE | ASSISTED | PKF_PatternPlay_PDF_081.jpg | 62 | Figure 5-15 | Half Table: Three Ball Patterns | 0.068, 0.071, 0.504, 0.218 | ht3-3 | QUESTION | Figure 5-16 (p. 62) |
| pp-p3-route | ROUTE | ASSISTED | PKF_PatternPlay_PDF_081.jpg | 62 | Figure 5-15 | Half Table: Three Ball Patterns | 0.068, 0.071, 0.504, 0.218 | ht3-3 | QUESTION | Figure 5-18 (p. 62) |
| pp-p3-close | ACTION | ASSISTED | PKF_PatternPlay_PDF_082.jpg | 63 | Figure 5-20 | Half Table: Three Ball Patterns | 0.503, 0.209, 0.431, 0.189 | ht3-3 | QUESTION | page 63 (p. 63) |
| pp-p3-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_082.jpg | 63 | Figure 5-19 | Half Table: Three Ball Patterns | 0.068, 0.209, 0.431, 0.189 | ht3-3 | PATTERN | — |
| pp-p3-run | RUN | ASSISTED | PKF_PatternPlay_PDF_081.jpg | 62 | Figure 5-15 | Half Table: Three Ball Patterns | 0.068, 0.071, 0.504, 0.218 | ht3-3 | PHYSICAL SETUP | Figure 5-18 (p. 62) |
| pp-p4-solve | SOLVE | INDEPENDENT | PKF_PatternPlay_PDF_082.jpg | 63 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.433, 0.562, 0.221 | ht3-4 | QUESTION | Figure 5-24 (p. 64) |
| pp-p4-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_083.jpg | 64 | Figure 5-24 | Half Table: Three Ball Patterns | 0.503, 0.209, 0.431, 0.189 | ht3-4 | QUESTION | Figure 5-26 (p. 64) |
| pp-p4-low | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_083.jpg | 64 | Figure 5-27 | Half Table: Three Ball Patterns | 0.511, 0.772, 0.414, 0.183 | ht3-4 | QUESTION | page 64 (p. 64) |
| pp-p4-speed | SPEED | INDEPENDENT | PKF_PatternPlay_PDF_084.jpg | 65 | Figure 5-28 | Half Table: Three Ball Patterns | 0.445, 0.071, 0.488, 0.212 | ht3-4 | QUESTION | page 65 (p. 65) |
| pp-p4-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_083.jpg | 64 | Figure 5-26 | Half Table: Three Ball Patterns | 0.503, 0.571, 0.422, 0.189 | ht3-4 | PATTERN | — |
| pp-p4-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_082.jpg | 63 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.433, 0.562, 0.221 | ht3-4 | PHYSICAL SETUP | Figure 5-26 (p. 64) |
| pp-p5-solve | SOLVE | INDEPENDENT | PKF_PatternPlay_PDF_084.jpg | 65 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.068, 0.312, 0.504, 0.198 | ht3-5 | QUESTION | Figure 5-31 (p. 65) |
| pp-p5-flat | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_085.jpg | 66 | Figure 5-34 | Half Table: Three Ball Patterns | 0.454, 0.433, 0.472, 0.206 | ht3-5 | QUESTION | page 66 (p. 66) |
| pp-p5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_085.jpg | 66 | Figure 5-32 | Half Table: Three Ball Patterns | 0.076, 0.174, 0.422, 0.189 | ht3-5 | PATTERN | — |
| pp-p5-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_084.jpg | 65 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.068, 0.312, 0.504, 0.198 | ht3-5 | PHYSICAL SETUP | Figure 5-31 (p. 65) |
| pp-f1-route | ROUTE | GUIDED | PKF_PatternPlay_PDF_085.jpg | 66 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.076, 0.674, 0.496, 0.198 | ht4-1 | QUESTION | Figure 5-39 (p. 67) |
| pp-f1-action | ACTION | GUIDED | PKF_PatternPlay_PDF_086.jpg | 67 | Figure 5-36 | Half Table: Four Ball Patterns | 0.076, 0.094, 0.422, 0.189 | ht4-1 | QUESTION | Figure 5-40 (p. 67) |
| pp-f1-learn | LEARN | GUIDED | PKF_PatternPlay_PDF_086.jpg | 67 | Figure 5-39 | Half Table: Four Ball Patterns | 0.503, 0.536, 0.422, 0.189 | ht4-1 | PATTERN | — |
| pp-f1-run | RUN | GUIDED | PKF_PatternPlay_PDF_085.jpg | 66 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.076, 0.674, 0.496, 0.198 | ht4-1 | PHYSICAL SETUP | Figure 5-39 (p. 67) |
| pp-f2-where | WHERE | GUIDED | PKF_PatternPlay_PDF_087.jpg | 68 | Figure 5-41 | Half Table: Four Ball Patterns | 0.421, 0.048, 0.504, 0.218 | ht4-2 | QUESTION | Figure 5-42 (p. 68) |
| pp-f2-roll | ACTION | ASSISTED | PKF_PatternPlay_PDF_087.jpg | 68 | Figure 5-43 | Half Table: Four Ball Patterns | 0.503, 0.450, 0.422, 0.195 | ht4-2 | QUESTION | page 68 (p. 68) |
| pp-f2-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_087.jpg | 68 | Figure 5-44 | Half Table: Four Ball Patterns | 0.404, 0.726, 0.521, 0.229 | ht4-2 | PATTERN | — |
| pp-f2-run | RUN | ASSISTED | PKF_PatternPlay_PDF_087.jpg | 68 | Figure 5-41 | Half Table: Four Ball Patterns | 0.421, 0.048, 0.504, 0.218 | ht4-2 | PHYSICAL SETUP | Figure 5-44 (p. 68) |
| pp-f3-next | NEXT | ASSISTED | PKF_PatternPlay_PDF_088.jpg | 69 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.404, 0.168, 0.521, 0.203 | ht4-3 | QUESTION | Figure 5-46 (p. 69) |
| pp-f3-angle | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_089.jpg | 70 | Figure 5-50 | Half Table: Four Ball Patterns | 0.503, 0.214, 0.431, 0.195 | ht4-3 | QUESTION | page 70 (p. 70) |
| pp-f3-roll | ACTION | ASSISTED | PKF_PatternPlay_PDF_089.jpg | 70 | Figure 5-53 | Half Table: Four Ball Patterns | 0.495, 0.691, 0.431, 0.189 | ht4-3 | QUESTION | page 70 (p. 70) |
| pp-f3-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_088.jpg | 69 | Figure 5-48 | Half Table: Four Ball Patterns | 0.445, 0.737, 0.488, 0.206 | ht4-3 | PATTERN | — |
| pp-f3-key | RUN | ASSISTED | PKF_PatternPlay_PDF_088.jpg | 69 | Figure 5-48 | Half Table: Four Ball Patterns | 0.445, 0.737, 0.488, 0.206 | ht4-3 | PHYSICAL SETUP | Figure 5-51 (p. 70) |
| pp-f3-run | RUN | ASSISTED | PKF_PatternPlay_PDF_088.jpg | 69 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.404, 0.168, 0.521, 0.203 | ht4-3 | PHYSICAL SETUP | Figure 5-47 (p. 69) |
| pp-f4-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_090.jpg | 71 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.404, 0.329, 0.521, 0.203 | ht4-4 | QUESTION | Figure 5-57 (p. 71) |
| pp-f4-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_090.jpg | 71 | Figure 5-57 | Half Table: Four Ball Patterns | 0.076, 0.691, 0.422, 0.189 | ht4-4 | QUESTION | Figure 5-60 (p. 72) |
| pp-f4-next | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_091.jpg | 72 | Figure 5-62 | Half Table: Four Ball Patterns | 0.068, 0.714, 0.431, 0.189 | ht4-4 | QUESTION | page 72 (p. 72) |
| pp-f4-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_091.jpg | 72 | Figure 5-60 | Half Table: Four Ball Patterns | 0.503, 0.174, 0.422, 0.189 | ht4-4 | PATTERN | — |
| pp-f4-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_090.jpg | 71 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.404, 0.329, 0.521, 0.203 | ht4-4 | PHYSICAL SETUP | Figure 5-60 (p. 72) |
| pp-f5-solve | SOLVE | INDEPENDENT | PKF_PatternPlay_PDF_092.jpg | 73 | Figure 5-64 | Half Table: Four Ball Patterns | 0.429, 0.048, 0.496, 0.218 | ht4-5 | QUESTION | Figure 5-68 (p. 73) |
| pp-f5-speed | SPEED | INDEPENDENT | PKF_PatternPlay_PDF_092.jpg | 73 | Figure 5-64 | Half Table: Four Ball Patterns | 0.429, 0.048, 0.496, 0.218 | ht4-5 | QUESTION | Figure 5-68 (p. 73) |
| pp-f5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_092.jpg | 73 | Figure 5-68 | Half Table: Four Ball Patterns | 0.462, 0.749, 0.472, 0.206 | ht4-5 | PATTERN | — |
| pp-f5-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_092.jpg | 73 | Figure 5-64 | Half Table: Four Ball Patterns | 0.429, 0.048, 0.496, 0.218 | ht4-5 | PHYSICAL SETUP | Figure 5-68 (p. 73) |
| pp-v1-where | WHERE | GUIDED | PKF_PatternPlay_PDF_093.jpg | 74 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.232, 0.521, 0.203 | ht5-1 | QUESTION | Figure 5-72 (p. 74) |
| pp-v1-ghost | ROUTE | GUIDED | PKF_PatternPlay_PDF_093.jpg | 74 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.232, 0.521, 0.203 | ht5-1 | QUESTION | Figure 5-74 (p. 75) |
| pp-v1-roll | ACTION | ASSISTED | PKF_PatternPlay_PDF_094.jpg | 75 | Figure 5-77 | Half Table: Five Ball Patterns | 0.084, 0.657, 0.529, 0.229 | ht5-1 | QUESTION | page 75 (p. 75) |
| pp-v1-tip | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_095.jpg | 76 | Figure 5-79 | Half Table: Five Ball Patterns | 0.495, 0.191, 0.431, 0.189 | ht5-1 | QUESTION | Figure 5-80 (p. 76) |
| pp-v1-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_094.jpg | 75 | Figure 5-75 | Half Table: Five Ball Patterns | 0.076, 0.416, 0.422, 0.195 | ht5-1 | PATTERN | — |
| pp-v1-run | RUN | ASSISTED | PKF_PatternPlay_PDF_093.jpg | 74 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.232, 0.521, 0.203 | ht5-1 | PHYSICAL SETUP | Figure 5-75 (p. 75) |
| pp-v2-route | ROUTE | ASSISTED | PKF_PatternPlay_PDF_095.jpg | 76 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.651, 0.488, 0.192 | ht5-2 | QUESTION | Figure 5-84 (p. 77) |
| pp-v2-where | WHERE | ASSISTED | PKF_PatternPlay_PDF_096.jpg | 77 | Figure 5-83 | Half Table: Five Ball Patterns | 0.503, 0.053, 0.431, 0.183 | ht5-2 | QUESTION | Figure 5-86 (p. 77) |
| pp-v2-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_096.jpg | 77 | Figure 5-84 | Half Table: Five Ball Patterns | 0.076, 0.433, 0.422, 0.189 | ht5-2 | PATTERN | — |
| pp-v2-key | RUN | ASSISTED | PKF_PatternPlay_PDF_096.jpg | 77 | Figure 5-85 | Half Table: Five Ball Patterns | 0.503, 0.439, 0.414, 0.183 | ht5-2 | PHYSICAL SETUP | Figure 5-84 (p. 77) |
| pp-v2-run | RUN | ASSISTED | PKF_PatternPlay_PDF_095.jpg | 76 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.651, 0.488, 0.192 | ht5-2 | PHYSICAL SETUP | Figure 5-84 (p. 77) |
| pp-v3-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_097.jpg | 78 | Figure 5-88 | Half Table: Five Ball Patterns | 0.076, 0.048, 0.546, 0.235 | ht5-3 | QUESTION | Figure 5-91 (p. 78) |
| pp-v3-ways | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_097.jpg | 78 | Figure 5-91 | Half Table: Five Ball Patterns | 0.076, 0.651, 0.422, 0.195 | ht5-3 | QUESTION | Figure 5-94 (p. 79) |
| pp-v3-stun | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_097.jpg | 78 | Figure 5-89 | Half Table: Five Ball Patterns | 0.076, 0.352, 0.422, 0.189 | ht5-3 | QUESTION | Figure 5-97 (p. 80) |
| pp-v3-speed | SPEED | INDEPENDENT | PKF_PatternPlay_PDF_099.jpg | 80 | Figure 5-97 | Half Table: Five Ball Patterns | 0.503, 0.088, 0.422, 0.189 | ht5-3 | QUESTION | page 80 (p. 80) |
| pp-v3-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_098.jpg | 79 | Figure 5-96 | Half Table: Five Ball Patterns | 0.076, 0.709, 0.546, 0.235 | ht5-3 | PATTERN | — |
| pp-v3-drill | RUN | INDEPENDENT | PKF_PatternPlay_PDF_099.jpg | 80 | Figure 5-97 | Half Table: Five Ball Patterns | 0.503, 0.088, 0.422, 0.189 | ht5-3 | PHYSICAL SETUP | Figure 5-89 (p. 78) |
| pp-v3-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_097.jpg | 78 | Figure 5-88 | Half Table: Five Ball Patterns | 0.076, 0.048, 0.546, 0.235 | ht5-3 | PHYSICAL SETUP | Figure 5-94 (p. 79) |
| pp-v4-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_099.jpg | 80 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.068, 0.530, 0.496, 0.192 | ht5-4 | QUESTION | Figure 5-100 (p. 80) |
| pp-v4-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_100.jpg | 81 | Figure 5-101 | Half Table: Five Ball Patterns | 0.076, 0.071, 0.496, 0.212 | ht5-4 | QUESTION | page 81 (p. 81) |
| pp-v4-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_100.jpg | 81 | Figure 5-102 | Half Table: Five Ball Patterns | 0.470, 0.289, 0.455, 0.200 | ht5-4 | PATTERN | — |
| pp-v4-key | RUN | INDEPENDENT | PKF_PatternPlay_PDF_100.jpg | 81 | Figure 5-102 | Half Table: Five Ball Patterns | 0.470, 0.289, 0.455, 0.200 | ht5-4 | PHYSICAL SETUP | Figure 5-103 (p. 81) |
| pp-v4-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_099.jpg | 80 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.068, 0.530, 0.496, 0.192 | ht5-4 | PHYSICAL SETUP | Figure 5-102 (p. 81) |
| pp-v5-solve | SOLVE | INDEPENDENT | PKF_PatternPlay_PDF_101.jpg | 82 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.388, 0.329, 0.537, 0.209 | ht5-5 | QUESTION | Figure 5-108 (p. 82) |
| pp-v5-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_102.jpg | 83 | Figure 5-113 | Half Table: Five Ball Patterns | 0.503, 0.513, 0.431, 0.189 | ht5-5 | QUESTION | Figure 5-114 (p. 83) |
| pp-v5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_102.jpg | 83 | Figure 5-112 | Half Table: Five Ball Patterns | 0.076, 0.513, 0.422, 0.189 | ht5-5 | PATTERN | — |
| pp-v5-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_101.jpg | 82 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.388, 0.329, 0.537, 0.209 | ht5-5 | PHYSICAL SETUP | Figure 5-110 (p. 83) |
| pp-ww-learn | LEARN | GUIDED | PKF_PatternPlay_PDF_103.jpg | 84 | Figure 5-116 | Wagon Wheel | 0.076, 0.507, 0.488, 0.218 | wagon | TEACHING | — |
| pp-ww-next | NEXT | ASSISTED | PKF_PatternPlay_PDF_103.jpg | 84 | Figure 5-116 | Wagon Wheel | 0.076, 0.507, 0.488, 0.218 | wagon | QUESTION | Figure 5-117 (p. 84) |
| pp-ww-run | RUN | ASSISTED | PKF_PatternPlay_PDF_103.jpg | 84 | Figure 5-116 | Wagon Wheel | 0.076, 0.507, 0.488, 0.218 | wagon | PHYSICAL SETUP | Figure 5-117 (p. 84) |
| pp-e-intro | LEARN | GUIDED | PKF_PatternPlay_PDF_107.jpg | 85 | Figure 6-1 | Full Table: 8-Ball Layouts | 0.076, 0.772, 0.422, 0.183 | ft-intro | TEACHING | — |
| pp-e1-route | ROUTE | GUIDED | PKF_PatternPlay_PDF_107.jpg | 85 | Figure 6-1 | Full Table: 8-Ball Layouts | 0.076, 0.772, 0.422, 0.183 | ft-6-1 | QUESTION | Unnumbered PKF photo (p. 86) |
| pp-e1-thin | PROBLEM | GUIDED | PKF_PatternPlay_PDF_108.jpg | 86 | Figure 6-4 | Full Table: 8-Ball Layouts | 0.470, 0.301, 0.455, 0.195 | ft-6-1 | QUESTION | page 86 (p. 86) |
| pp-e1-run | RUN | GUIDED | PKF_PatternPlay_PDF_107.jpg | 85 | Figure 6-1 | Full Table: 8-Ball Layouts | 0.076, 0.772, 0.422, 0.183 | ft-6-1 | PHYSICAL SETUP | Unnumbered PKF photo (p. 86) |
| pp-e2-route | ROUTE | ASSISTED | PKF_PatternPlay_PDF_108.jpg | 86 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.355, 0.726, 0.570, 0.226 | ft-3-8 | QUESTION | Figure 6-8 (p. 87) |
| pp-e2-action | ACTION | ASSISTED | PKF_PatternPlay_PDF_109.jpg | 87 | Figure 6-9 | Full Table: 8-Ball Layouts | 0.076, 0.726, 0.513, 0.229 | ft-3-8 | QUESTION | page 87 (p. 87) |
| pp-e2-drill | RUN | ASSISTED | PKF_PatternPlay_PDF_110.jpg | 88 | Figure 6-10 | Full Table: 8-Ball Layouts | 0.076, 0.053, 0.513, 0.223 | ft-3-8 | PHYSICAL SETUP | Figure 6-9 (p. 87) |
| pp-e3-build | BUILD | ASSISTED | PKF_PatternPlay_PDF_110.jpg | 88 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.331, 0.312, 0.595, 0.232 | ft-3-7-8 | QUESTION | Figure 6-13 (p. 88) |
| pp-e3-action | ACTION | ASSISTED | PKF_PatternPlay_PDF_111.jpg | 89 | Figure 6-14 | Full Table: 8-Ball Layouts | 0.076, 0.191, 0.422, 0.189 | ft-3-7-8 | QUESTION | page 89 (p. 89) |
| pp-e3-angle | ROUTE | ASSISTED | PKF_PatternPlay_PDF_111.jpg | 89 | Figure 6-15 | Full Table: 8-Ball Layouts | 0.503, 0.191, 0.422, 0.189 | ft-3-7-8 | QUESTION | Figure 6-16 (p. 89) |
| pp-e3-stun | ACTION | ASSISTED | PKF_PatternPlay_PDF_111.jpg | 89 | Figure 6-17 | Full Table: 8-Ball Layouts | 0.503, 0.530, 0.422, 0.189 | ft-3-7-8 | QUESTION | page 89 (p. 89) |
| pp-e3-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_110.jpg | 88 | Figure 6-12 | Full Table: 8-Ball Layouts | 0.076, 0.709, 0.422, 0.195 | ft-3-7-8 | PATTERN | — |
| pp-e3-run | RUN | ASSISTED | PKF_PatternPlay_PDF_110.jpg | 88 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.331, 0.312, 0.595, 0.232 | ft-3-7-8 | PHYSICAL SETUP | Figure 6-13 (p. 88) |
| pp-e4-seq | SEQUENCE | ASSISTED | PKF_PatternPlay_PDF_111.jpg | 89 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.404, 0.749, 0.521, 0.203 | ft-5-2-8 | QUESTION | Figure 6-23 (p. 90) |
| pp-e4-danger | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_112.jpg | 90 | Figure 6-21 | Full Table: 8-Ball Layouts | 0.076, 0.513, 0.422, 0.189 | ft-5-2-8 | QUESTION | page 90 (p. 90) |
| pp-e4-stun | ACTION | ASSISTED | PKF_PatternPlay_PDF_113.jpg | 91 | Figure 6-26 | Full Table: 8-Ball Layouts | 0.503, 0.393, 0.431, 0.189 | ft-5-2-8 | QUESTION | page 91 (p. 91) |
| pp-e4-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_113.jpg | 91 | Figure 6-24 | Full Table: 8-Ball Layouts | 0.511, 0.065, 0.422, 0.189 | ft-5-2-8 | PATTERN | — |
| pp-e5-first | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_113.jpg | 91 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.076, 0.628, 0.595, 0.232 | ft-2-3-1-8 | QUESTION | Figure 6-28 (p. 92) |
| pp-e5-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_114.jpg | 92 | Figure 6-28 | Full Table: 8-Ball Layouts | 0.396, 0.053, 0.529, 0.229 | ft-2-3-1-8 | QUESTION | page 92 (p. 92) |
| pp-e5-build | BUILD | INDEPENDENT | PKF_PatternPlay_PDF_113.jpg | 91 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.076, 0.628, 0.595, 0.232 | ft-2-3-1-8 | QUESTION | Figure 6-32 (p. 93) |
| pp-e5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_114.jpg | 92 | Figure 6-30 | Full Table: 8-Ball Layouts | 0.076, 0.674, 0.422, 0.189 | ft-2-3-1-8 | PATTERN | — |
| pp-e5-drill | RUN | INDEPENDENT | PKF_PatternPlay_PDF_115.jpg | 93 | Figure 6-34 | Full Table: 8-Ball Layouts | 0.076, 0.347, 0.496, 0.223 | ft-2-3-1-8 | PHYSICAL SETUP | Figure 6-33 (p. 93) |
| pp-o1-route | ROUTE | GUIDED | PKF_PatternPlay_PDF_115.jpg | 93 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.076, 0.674, 0.521, 0.203 | ft-o3 | QUESTION | Figure 6-38 (p. 94) |
| pp-o1-action | ACTION | GUIDED | PKF_PatternPlay_PDF_116.jpg | 94 | Figure 6-36 | Full Table: Balls in Order | 0.076, 0.111, 0.414, 0.189 | ft-o3 | QUESTION | Figure 6-39 (p. 94) |
| pp-o1-learn | LEARN | GUIDED | PKF_PatternPlay_PDF_116.jpg | 94 | Figure 6-38 | Full Table: Balls in Order | 0.084, 0.393, 0.587, 0.246 | ft-o3 | PATTERN | — |
| pp-o1-key | RUN | GUIDED | PKF_PatternPlay_PDF_115.jpg | 93 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.076, 0.674, 0.521, 0.203 | ft-o3 | PHYSICAL SETUP | Figure 6-38 (p. 94) |
| pp-o2-rule | ROUTE | GUIDED | PKF_PatternPlay_PDF_117.jpg | 95 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.404, 0.071, 0.521, 0.209 | ft-o4 | QUESTION | Figure 6-43 (p. 95) |
| pp-o2-where | WHERE | ASSISTED | PKF_PatternPlay_PDF_117.jpg | 95 | Figure 6-41 | Full Table: Balls in Order | 0.076, 0.456, 0.414, 0.189 | ft-o4 | QUESTION | Figure 6-46 (p. 96) |
| pp-o2-problem | PROBLEM | ASSISTED | PKF_PatternPlay_PDF_119.jpg | 97 | Figure 6-50 | Full Table: Balls in Order | 0.503, 0.157, 0.422, 0.189 | ft-o4 | QUESTION | page 97 (p. 97) |
| pp-o2-learn | LEARN | ASSISTED | PKF_PatternPlay_PDF_117.jpg | 95 | Figure 6-43 | Full Table: Balls in Order | 0.076, 0.732, 0.496, 0.218 | ft-o4 | PATTERN | — |
| pp-o2-key | RUN | ASSISTED | PKF_PatternPlay_PDF_118.jpg | 96 | Figure 6-44 | Full Table: Balls in Order | 0.076, 0.174, 0.422, 0.189 | ft-o4 | PHYSICAL SETUP | Figure 6-45 (p. 96) |
| pp-o3-where | WHERE | ASSISTED | PKF_PatternPlay_PDF_119.jpg | 97 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.347, 0.381, 0.578, 0.226 | ft-o5 | QUESTION | Figure 6-53 (p. 97) |
| pp-o3-stun | ACTION | ASSISTED | PKF_PatternPlay_PDF_120.jpg | 98 | Figure 6-58 | Full Table: Balls in Order | 0.503, 0.760, 0.422, 0.189 | ft-o5 | QUESTION | Figure 6-59 (p. 99) |
| pp-o3-lower | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_121.jpg | 99 | Figure 6-61 | Full Table: Balls in Order | 0.076, 0.433, 0.463, 0.206 | ft-o5 | QUESTION | page 99 (p. 99) |
| pp-o3-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_120.jpg | 98 | Figure 6-57 | Full Table: Balls in Order | 0.076, 0.760, 0.422, 0.189 | ft-o5 | PATTERN | — |
| pp-o3-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_119.jpg | 97 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.347, 0.381, 0.578, 0.226 | ft-o5 | PHYSICAL SETUP | Figure 6-57 (p. 98) |
| pp-o4-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_122.jpg | 100 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.347, 0.306, 0.578, 0.226 | ft-o6 | QUESTION | Figure 6-65 (p. 100) |
| pp-o4-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_122.jpg | 100 | Figure 6-66 | Full Table: Balls in Order | 0.503, 0.714, 0.422, 0.189 | ft-o6 | QUESTION | Figure 6-75 (p. 102) |
| pp-o4-next | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_125.jpg | 103 | Figure 6-76 | Full Table: Balls in Order | 0.076, 0.134, 0.422, 0.189 | ft-o6 | QUESTION | Figure 6-78 (p. 103) |
| pp-o4-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_123.jpg | 101 | Figure 6-69 | Full Table: Balls in Order | 0.076, 0.634, 0.422, 0.189 | ft-o6 | PATTERN | — |
| pp-o4-key | RUN | INDEPENDENT | PKF_PatternPlay_PDF_124.jpg | 102 | Figure 6-75 | Full Table: Balls in Order | 0.084, 0.691, 0.587, 0.252 | ft-o6 | PHYSICAL SETUP | Figure 6-74 (p. 102) |
| pp-o5-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_125.jpg | 103 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.076, 0.668, 0.587, 0.232 | ft-o7 | QUESTION | Figure 6-81 (p. 104) |
| pp-o5-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_126.jpg | 104 | Figure 6-82 | Full Table: Balls in Order | 0.076, 0.473, 0.422, 0.189 | ft-o7 | QUESTION | Figure 6-83 (p. 104) |
| pp-o5-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_128.jpg | 106 | Figure 6-89 | Full Table: Balls in Order | 0.076, 0.168, 0.422, 0.195 | ft-o7 | QUESTION | Figure 6-91 (p. 106) |
| pp-o5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_127.jpg | 105 | Figure 6-88 | Full Table: Balls in Order | 0.084, 0.691, 0.578, 0.252 | ft-o7 | PATTERN | — |
| pp-s-intro | LEARN | GUIDED | PKF_PatternPlay_PDF_129.jpg | 107 | Figure 6-94 | Full Table with Sidespin | 0.084, 0.237, 0.562, 0.246 | ss-intro | TEACHING | — |
| pp-s-over | PROBLEM | GUIDED | PKF_PatternPlay_PDF_129.jpg | 107 | Figure 6-95 | Full Table with Sidespin | 0.076, 0.714, 0.422, 0.189 | ss-over | QUESTION | Figure 6-96 (p. 107) |
| pp-s-rail | ACTION | GUIDED | PKF_PatternPlay_PDF_130.jpg | 108 | Figure 6-97 | Full Table with Sidespin | 0.076, 0.191, 0.422, 0.183 | ss-rail | QUESTION | Figure 6-98 (p. 108) |
| pp-s-decel | PROBLEM | GUIDED | PKF_PatternPlay_PDF_130.jpg | 108 | Figure 6-100 | Full Table with Sidespin | 0.084, 0.720, 0.513, 0.223 | ss-decel | QUESTION | page 108 (p. 108) |
| pp-s-worth | ACTION | GUIDED | PKF_PatternPlay_PDF_131.jpg | 109 | Figure 6-101 | Full Table with Sidespin | 0.076, 0.134, 0.472, 0.212 | ss-worth | QUESTION | Figure 6-102 (p. 109) |
| pp-s-path | ROUTE | GUIDED | PKF_PatternPlay_PDF_131.jpg | 109 | Figure 6-103 | Full Table with Sidespin | 0.076, 0.732, 0.496, 0.223 | ss-path | QUESTION | Figure 6-104 (p. 110) |
| pp-s-running | LEARN | GUIDED | PKF_PatternPlay_PDF_132.jpg | 110 | Figure 6-105 | Full Table with Sidespin | 0.445, 0.433, 0.480, 0.212 | ss-running | TEACHING | — |
| pp-s-run1 | NEXT | ASSISTED | PKF_PatternPlay_PDF_132.jpg | 110 | Figure 6-105 | Full Table with Sidespin | 0.445, 0.433, 0.480, 0.212 | ss-running | QUESTION | page 110 (p. 110) |
| pp-s-run2 | NEXT | ASSISTED | PKF_PatternPlay_PDF_133.jpg | 111 | Figure 6-107 | Full Table with Sidespin | 0.076, 0.237, 0.422, 0.189 | ss-running | QUESTION | page 111 (p. 111) |
| pp-s-hold | ACTION | ASSISTED | PKF_PatternPlay_PDF_134.jpg | 112 | Figure 6-111 | Full Table with Sidespin | 0.084, 0.134, 0.554, 0.246 | ss-reverse | QUESTION | page 112 (p. 112) |
| pp-s-draw | ACTION | ASSISTED | PKF_PatternPlay_PDF_135.jpg | 113 | Figure 6-113 | Full Table with Sidespin | 0.084, 0.140, 0.562, 0.241 | ss-draw | QUESTION | Figure 6-115 (p. 113) |
| pp-s-throw | ACTION | ASSISTED | PKF_PatternPlay_PDF_136.jpg | 114 | Figure 6-117 | Full Table with Sidespin | 0.076, 0.174, 0.513, 0.229 | ss-throw | QUESTION | Figure 6-118 (p. 114) |
| pp-s-kill | LEARN | ASSISTED | PKF_PatternPlay_PDF_136.jpg | 114 | Figure 6-119 | Full Table with Sidespin | 0.076, 0.691, 0.603, 0.252 | ss-throw | TEACHING | — |
| pp-s-throwdrill | RUN | ASSISTED | PKF_PatternPlay_PDF_137.jpg | 115 | Unnumbered PKF photo | Full Table with Sidespin | 0.413, 0.433, 0.513, 0.198 | ss-throw | PHYSICAL SETUP | — |
| pp-s-curve | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_138.jpg | 116 | Figure 6-123 | Full Table with Sidespin | 0.076, 0.151, 0.422, 0.189 | ss-curve | QUESTION | Figure 6-124 (p. 116) |
| pp-s-frozen | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_139.jpg | 117 | Figure 6-127 | Full Table with Sidespin | 0.470, 0.071, 0.455, 0.206 | ss-frozen | QUESTION | Figure 6-128 (p. 117) |
| pp-s-typical | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_139.jpg | 117 | Figure 6-129 | Full Table with Sidespin | 0.076, 0.755, 0.422, 0.189 | ss-typical | TEACHING | — |
| pp-s-tworail | RUN | INDEPENDENT | PKF_PatternPlay_PDF_139.jpg | 117 | Figure 6-129 | Full Table with Sidespin | 0.076, 0.755, 0.422, 0.189 | ss-typical | PHYSICAL SETUP | — |
| pp-s-overdrill | RUN | INDEPENDENT | PKF_PatternPlay_PDF_140.jpg | 118 | Figure 6-131 | Full Table with Sidespin | 0.076, 0.105, 0.546, 0.235 | ss-typical | PHYSICAL SETUP | — |
| pp-r-intro | LEARN | GUIDED | PKF_PatternPlay_PDF_141.jpg | 119 | Figure 6-133 | Pre-Shot Routine | 0.429, 0.053, 0.488, 0.212 | ps-intro | TEACHING | — |
| pp-r-plan | NEXT | GUIDED | PKF_PatternPlay_PDF_141.jpg | 119 | Figure 6-133 | Pre-Shot Routine | 0.429, 0.053, 0.488, 0.212 | ps-intro | QUESTION | — |
| pp-r-doubt | NEXT | GUIDED | PKF_PatternPlay_PDF_141.jpg | 119 | Unnumbered PKF diagram | Pre-Shot Routine | 0.191, 0.594, 0.619, 0.244 | ps-doubt | QUESTION | — |
| pp-r-visual | LEARN | ASSISTED | PKF_PatternPlay_PDF_142.jpg | 120 | Unnumbered PKF diagram | Pre-Shot Routine | 0.396, 0.059, 0.529, 0.209 | ps-visual | TEACHING | — |
| pp-r-seq | SEQUENCE | ASSISTED | PKF_PatternPlay_PDF_142.jpg | 120 | Unnumbered PKF diagram | Pre-Shot Routine | 0.175, 0.525, 0.660, 0.261 | ps-seq | QUESTION | — |
| pp-r-pause | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_143.jpg | 121 | Figure 6-137 | Pre-Shot Routine | 0.076, 0.232, 0.422, 0.189 | ps-pause | QUESTION | Figure 6-138 (p. 121) |
| pp-g1-route | ROUTE | ASSISTED | PKF_PatternPlay_PDF_143.jpg | 121 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.158, 0.674, 0.685, 0.267 | g1 | QUESTION | Figure 6-141 (p. 122) |
| pp-g1-where | WHERE | ASSISTED | PKF_PatternPlay_PDF_144.jpg | 122 | Figure 6-143 | Full Table Patterns from Actual Games | 0.076, 0.709, 0.422, 0.195 | g1 | QUESTION | Figure 6-144 (p. 122) |
| pp-g1-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_145.jpg | 123 | Figure 6-147 | Full Table Patterns from Actual Games | 0.380, 0.393, 0.546, 0.241 | g1 | QUESTION | Figure 6-148 (p. 123) |
| pp-g1-seven | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_146.jpg | 124 | Figure 6-150 | Full Table Patterns from Actual Games | 0.076, 0.174, 0.422, 0.189 | g1 | QUESTION | page 124 (p. 124) |
| pp-g1-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_146.jpg | 124 | Figure 6-151 | Full Table Patterns from Actual Games | 0.495, 0.168, 0.439, 0.195 | g1 | PATTERN | — |
| pp-g2-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_146.jpg | 124 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.084, 0.393, 0.570, 0.221 | g2 | QUESTION | Figure 6-153 (p. 124) |
| pp-g2-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_147.jpg | 125 | Unnumbered PKF photo | Full Table Patterns from Actual Games | 0.076, 0.145, 0.488, 0.198 | g2 | QUESTION | — |
| pp-g2-speed | SPEED | INDEPENDENT | PKF_PatternPlay_PDF_147.jpg | 125 | Figure 6-156 | Full Table Patterns from Actual Games | 0.413, 0.375, 0.513, 0.229 | g2 | QUESTION | — |
| pp-g2-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_148.jpg | 126 | Figure 6-158 | Full Table Patterns from Actual Games | 0.068, 0.088, 0.496, 0.212 | g2 | QUESTION | page 126 (p. 126) |
| pp-g2-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_146.jpg | 124 | Figure 6-154 | Full Table Patterns from Actual Games | 0.511, 0.772, 0.406, 0.183 | g2 | PATTERN | — |
| pp-g3-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_148.jpg | 126 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.076, 0.352, 0.546, 0.215 | g3 | QUESTION | — |
| pp-g3-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_148.jpg | 126 | Figure 6-160 | Full Table Patterns from Actual Games | 0.076, 0.755, 0.422, 0.189 | g3 | QUESTION | Figure 6-161 (p. 126) |
| pp-g3-seq | SEQUENCE | INDEPENDENT | PKF_PatternPlay_PDF_149.jpg | 127 | Figure 6-162 | Full Table Patterns from Actual Games | 0.068, 0.174, 0.431, 0.189 | g3 | QUESTION | Figure 6-163 (p. 127) |
| pp-g3-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_149.jpg | 127 | Figure 6-163 | Full Table Patterns from Actual Games | 0.503, 0.174, 0.422, 0.189 | g3 | QUESTION | Unnumbered PKF photo (p. 127) |
| pp-g3-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_149.jpg | 127 | Figure 6-166 | Full Table Patterns from Actual Games | 0.495, 0.766, 0.414, 0.189 | g3 | PATTERN | — |
| pp-g4-choose | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_150.jpg | 128 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.068, 0.427, 0.603, 0.238 | g4 | QUESTION | Figure 6-170 (p. 128) |
| pp-g4-first | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_150.jpg | 128 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.068, 0.427, 0.603, 0.238 | g4 | QUESTION | Figure 6-171 (p. 129) |
| pp-g4-combo | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_151.jpg | 129 | Figure 6-173 | Full Table Patterns from Actual Games | 0.076, 0.594, 0.422, 0.189 | g4 | QUESTION | Figure 6-174 (p. 129) |
| pp-g4-six | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_153.jpg | 131 | Figure 6-184 | Full Table Patterns from Actual Games | 0.076, 0.732, 0.422, 0.195 | g4 | QUESTION | page 131 (p. 131) |
| pp-g4-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_152.jpg | 130 | Figure 6-177 | Full Table Patterns from Actual Games | 0.076, 0.272, 0.447, 0.195 | g4 | PATTERN | — |
| pp-g5-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_154.jpg | 132 | Unnumbered PKF diagram | Full Table Patterns from Actual Games | 0.068, 0.329, 0.603, 0.232 | g5 | QUESTION | Figure 6-193 (p. 133) |
| pp-g5-action | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_155.jpg | 133 | Figure 6-195 | Full Table Patterns from Actual Games | 0.503, 0.634, 0.422, 0.183 | g5 | QUESTION | page 133 (p. 133) |
| pp-g5-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_156.jpg | 134 | Figure 6-197 | Full Table Patterns from Actual Games | 0.503, 0.145, 0.422, 0.189 | g5 | QUESTION | Figure 6-200 (p. 134) |
| pp-g5-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_157.jpg | 135 | Figure 6-201 | Full Table Patterns from Actual Games | 0.076, 0.168, 0.422, 0.195 | g5 | PATTERN | — |
| pp-m-learn | LEARN | INDEPENDENT | PKF_PatternPlay_PDF_157.jpg | 135 | Figure 6-203 | Full Table Patterns from Actual Games | 0.076, 0.387, 0.472, 0.206 | marker | TEACHING | — |
| pp-m-next | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_157.jpg | 135 | Figure 6-203 | Full Table Patterns from Actual Games | 0.076, 0.387, 0.472, 0.206 | marker | QUESTION | — |
| pp-m-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_157.jpg | 135 | Figure 6-203 | Full Table Patterns from Actual Games | 0.076, 0.387, 0.472, 0.206 | marker | PHYSICAL SETUP | — |
| ppx-p1-last | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | ht3-1 | QUESTION | Figure 5-2 (p. 59) |
| ppx-p3-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_081.jpg | 62 | Figure 5-15 | Half Table: Three Ball Patterns | 0.068, 0.071, 0.504, 0.218 | ht3-3 | QUESTION | Figure 5-18 (p. 62) |
| ppx-p4-solve | SOLVE | INDEPENDENT | PKF_PatternPlay_PDF_082.jpg | 63 | Unnumbered PKF diagram | Half Table: Three Ball Patterns | 0.076, 0.433, 0.562, 0.221 | ht3-4 | QUESTION | Figure 5-24 (p. 64) |
| ppx-f4-problem | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_090.jpg | 71 | Unnumbered PKF diagram | Half Table: Four Ball Patterns | 0.404, 0.329, 0.521, 0.203 | ht4-4 | QUESTION | Figure 5-57 (p. 71) |
| ppx-f5-speed | SPEED | INDEPENDENT | PKF_PatternPlay_PDF_092.jpg | 73 | Figure 5-64 | Half Table: Four Ball Patterns | 0.429, 0.048, 0.496, 0.218 | ht4-5 | QUESTION | Figure 5-68 (p. 73) |
| ppx-v1-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_093.jpg | 74 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.232, 0.521, 0.203 | ht5-1 | QUESTION | Figure 5-72 (p. 74) |
| ppx-v3-stun | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_097.jpg | 78 | Figure 5-89 | Half Table: Five Ball Patterns | 0.076, 0.352, 0.422, 0.189 | ht5-3 | QUESTION | Figure 5-97 (p. 80) |
| ppx-e1-route | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_107.jpg | 85 | Figure 6-1 | Full Table: 8-Ball Layouts | 0.076, 0.772, 0.422, 0.183 | ft-6-1 | QUESTION | Unnumbered PKF photo (p. 86) |
| ppx-e3-build | BUILD | INDEPENDENT | PKF_PatternPlay_PDF_110.jpg | 88 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.331, 0.312, 0.595, 0.232 | ft-3-7-8 | QUESTION | Figure 6-13 (p. 88) |
| ppx-e5-first | PROBLEM | INDEPENDENT | PKF_PatternPlay_PDF_113.jpg | 91 | Unnumbered PKF diagram | Full Table: 8-Ball Layouts | 0.076, 0.628, 0.595, 0.232 | ft-2-3-1-8 | QUESTION | Figure 6-28 (p. 92) |
| ppx-o2-rule | ROUTE | INDEPENDENT | PKF_PatternPlay_PDF_117.jpg | 95 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.404, 0.071, 0.521, 0.209 | ft-o4 | QUESTION | Figure 6-43 (p. 95) |
| ppx-o4-next | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_125.jpg | 103 | Figure 6-76 | Full Table: Balls in Order | 0.076, 0.134, 0.422, 0.189 | ft-o6 | QUESTION | Figure 6-78 (p. 103) |
| ppx-s-run2 | NEXT | INDEPENDENT | PKF_PatternPlay_PDF_133.jpg | 111 | Figure 6-107 | Full Table with Sidespin | 0.076, 0.237, 0.422, 0.189 | ss-running | QUESTION | page 111 (p. 111) |
| ppx-s-hold | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_134.jpg | 112 | Figure 6-111 | Full Table with Sidespin | 0.084, 0.134, 0.554, 0.246 | ss-reverse | QUESTION | page 112 (p. 112) |
| ppx-s-throw | ACTION | INDEPENDENT | PKF_PatternPlay_PDF_136.jpg | 114 | Figure 6-117 | Full Table with Sidespin | 0.076, 0.174, 0.513, 0.229 | ss-throw | QUESTION | Figure 6-118 (p. 114) |
| ppx-r-seq | SEQUENCE | INDEPENDENT | PKF_PatternPlay_PDF_142.jpg | 120 | Unnumbered PKF diagram | Pre-Shot Routine | 0.175, 0.525, 0.660, 0.261 | ps-seq | QUESTION | — |
| ppx-g3-seq | SEQUENCE | INDEPENDENT | PKF_PatternPlay_PDF_149.jpg | 127 | Figure 6-162 | Full Table Patterns from Actual Games | 0.068, 0.174, 0.431, 0.189 | g3 | QUESTION | Figure 6-163 (p. 127) |
| ppx-g5-where | WHERE | INDEPENDENT | PKF_PatternPlay_PDF_156.jpg | 134 | Figure 6-197 | Full Table Patterns from Actual Games | 0.503, 0.145, 0.422, 0.189 | g5 | QUESTION | Figure 6-200 (p. 134) |
| ppx-p1-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_077.jpg | 58 | Figure 5-1 | Half Table: Three Ball Patterns | 0.068, 0.726, 0.521, 0.229 | ht3-1 | PHYSICAL SETUP | Figure 5-6 (p. 59) |
| ppx-f2-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_087.jpg | 68 | Figure 5-41 | Half Table: Four Ball Patterns | 0.421, 0.048, 0.504, 0.218 | ht4-2 | PHYSICAL SETUP | Figure 5-44 (p. 68) |
| ppx-v2-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_095.jpg | 76 | Unnumbered PKF diagram | Half Table: Five Ball Patterns | 0.076, 0.651, 0.488, 0.192 | ht5-2 | PHYSICAL SETUP | Figure 5-84 (p. 77) |
| ppx-e1-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_107.jpg | 85 | Figure 6-1 | Full Table: 8-Ball Layouts | 0.076, 0.772, 0.422, 0.183 | ft-6-1 | PHYSICAL SETUP | Unnumbered PKF photo (p. 86) |
| ppx-o3-run | RUN | INDEPENDENT | PKF_PatternPlay_PDF_119.jpg | 97 | Unnumbered PKF diagram | Full Table: Balls in Order | 0.347, 0.381, 0.578, 0.226 | ft-o5 | PHYSICAL SETUP | Figure 6-57 (p. 98) |

