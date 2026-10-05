/**
 * PKF Cue Ball Control Course — Drill Sets & Exams.
 * Source: PKF Pattern Play / Cue Ball Control, Chapters Three–Six (Center Ball, Sliding Cue Ball,
 * Half Table Pattern Play, Full Table Patterns). Original JPEGs only.
 * Storage key: state.pkfCueBallControl. No Career XP. Not on All / Table Games / Learn.
 */
import { ASSET_MAP, REGIONS, figureHTML, revealFigureHTML, assetOf } from './pkfCueBallAssets.js';

export const COURSE_TITLE = 'PKF Cue Ball Control Course';
export const EXAM_TITLE = 'PKF Cue Ball Control Exam';
export const STORAGE_KEY = 'pkfCueBallControl';
export const HASH = 'pkfcb';
export const KNOWLEDGE_PASS = 0.7;
export const EXAM_PASS = 0.8;
export const ATTEMPTS_MAX = 3;

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const ASSIST = { GUIDED: 'GUIDED', ASSISTED: 'ASSISTED', INDEPENDENT: 'INDEPENDENT' };
export const LTYPE = {
  LEARN: 'LEARN',
  UNDERSTAND: 'UNDERSTAND',
  PREDICT: 'PREDICT THE CUE BALL',
  ACTION: 'CHOOSE THE CUE-BALL ACTION',
  SPEED: 'CHOOSE THE SPEED',
  ZONE: 'FIND THE POSITION ZONE',
  NEXT: 'CHOOSE THE NEXT SHOT',
  PLAN: 'PLAN THE PATTERN',
  SHOOT: 'NOW SHOOT IT'
};

export const SECTIONS = [
  { id: 'center-ball', n: 1, title: 'Center Ball', blurb: 'Center before sidespin, finding center, high action, low action, and stop/slide.', pages: '23–43', stub: false },
  { id: 'sliding-cue-ball', n: 2, title: 'Sliding Cue Ball', blurb: '90° slide path, paper/hand visualization, obstacle drills, slide-first position.', pages: '44–57', stub: false },
  { id: 'half-table', n: 3, title: 'Half Table Patterns', blurb: '3- and 4-ball patterns on one half; center family only; work backward.', pages: '58–84', stub: false },
  { id: 'full-table', n: 4, title: 'Full Table Patterns', blurb: 'Full-table plans, then sidespin, running/reverse english, and pre-shot routine.', pages: '85–136', stub: false }
];

export function sectionById(id) { return SECTIONS.find((s) => s.id === id) || null; }

export const LESSONS = [
  {"id": "cb-intro", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Center before sidespin", "src": "Page 23 · Figures 3-1, 3-2", "prompt": "Read the center-ball introduction and figures 3-1 and 3-2.", "explain": "PKF: \"If you can't control the cue ball without sidespin, you'll never control the cue ball with sidespin.\" Before position fundamentals with sidespin, understand center ball versus spin, cue angles, and speeds. Figure 3-1: center ball with a fairly level cue. Figure 3-2: without sidespin the cue ball travels straight down the shooting line."},
  {"id": "cb-elevate-center", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Elevate with no sidespin", "src": "Page 24 · Figures 3-3, 3-4", "prompt": "Study figures 3-3 and 3-4.", "explain": "PKF elevates the cue and shoots below center with no sidespin (figure 3-3); the cue ball stays on the shooting line (figure 3-4). As long as you shoot center, center low, or center high, the cue ball stays on the shooting line regardless of cue elevation."},
  {"id": "cb-left-deflect", "section": "center-ball", "type": "PREDICT THE CUE BALL", "assist": "GUIDED", "title": "Left sidespin deflection", "src": "Page 24 · Figures 3-5, 3-6", "prompt": "With a level cue, PKF strikes the cue ball with left sidespin. Which way does the cue ball leave the shooting line?", "explain": "PKF: striking the cue ball on the left side pushes it to the right of the shooting line. This is referred to as deflection.", "hint": "PKF: striking the left side pushes the cue ball the other way. This is deflection.", "choices": [["right", "To the right of the shooting line"], ["left", "To the left of the shooting line"], ["straight", "It stays on the shooting line"], ["back", "It draws straight back"]], "answer": "right"},
  {"id": "cb-right-veer", "section": "center-ball", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Right spin + elevation", "src": "Page 25 · Figure 3-9", "prompt": "Elevated cue with right spin: which way does the cue ball veer off the shooting line?", "explain": "PKF: striking with right spin and an elevated cue stick causes the cue ball to veer off the shooting line to the left.", "hint": "PKF pairs each side of spin with the opposite veer.", "choices": [["left", "To the left"], ["right", "To the right"], ["straight", "Stays straight"], ["up", "Lifts off the cloth"]], "answer": "left"},
  {"id": "cb-rule-spin", "section": "center-ball", "type": "UNDERSTAND", "assist": "ASSISTED", "title": "Left vs right spin rule", "src": "Page 26", "prompt": "According to PKF, left spin and right spin each push the cue ball which way relative to the shooting line?", "explain": "PKF: left spin causes the cue ball to veer to the right of the shooting line; right spin causes it to veer to the left.", "hint": "Each side pushes the ball the opposite way.", "choices": [["opp", "Left → veers right; right → veers left"], ["same", "Left → veers left; right → veers right"], ["level-only", "Only matters with a level cue"], ["none", "Sidespin never leaves the line"]], "answer": "opp"},
  {"id": "cb-swerve", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Elevation brings it back", "src": "Page 26–27 · Figures 3-17 to 3-19", "prompt": "Read how elevation with sidespin differs from a level cue.", "explain": "With a level cue and sidespin, the cue ball is pushed off the shooting line and never returns. With an elevated cue and sidespin, it is pushed off but returns toward the line and may cross it. Variables PKF lists: distance to the object ball, speed, cue elevation, amount of sidespin, and shaft type (low-deflection shafts minimize deflection)."},
  {"id": "cb-find-center", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Finding Center", "src": "Page 27 · Figure 3-20", "prompt": "Study Finding Center and figure 3-20.", "explain": "Many players (including pros) place the tip slightly left or right of true center. In figure 3-20 the tip looks like center but is center-left. Unintentional sidespin is a primary reason players miss long straight-in shots."},
  {"id": "cb-stop-9drill", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "9-ball stop / slide drill", "src": "Page 28 · Figures 3-22, 3-23", "prompt": "Read the reinforcement-label stop drill.", "explain": "Use reinforcement labels so balls go back to the same spots. Place an object ball about a diamond from the corner pocket; place the 9-ball about a quarter-diamond behind it on the pocket line with the number 9 on top. Strike center so the 9 slides and stops on the object ball. If it spins after contact you hit center-right or center-left; rolling forward means above center; spinning backward means below center. Success: it stops with the 9 still on top."},
  {"id": "cb-rail-return", "section": "center-ball", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "ASSISTED", "title": "Rail-return center check", "src": "Page 28–29 · Figures 3-24, 3-25", "prompt": "Cue ball across from the second diamond on the long rail, shot straight at that diamond. What tip action does PKF want so the ball returns to the tip?", "explain": "PKF: shoot center ball straight at the second diamond so the ball banks and returns to the tip. If it does not return to the tip, you added sidespin (figure 3-25 shows accidental left spin angling off).", "hint": "The drill finds accidental sidespin.", "choices": [["center", "Center ball"], ["left", "Left sidespin"], ["right", "Right sidespin"], ["high", "Maximum high"]], "answer": "center"},
  {"id": "cb-shoot-center", "section": "center-ball", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot the center-finding drills", "src": "Page 28–29", "prompt": "Set up PKF's center drills: (1) 9-ball a quarter-diamond behind an object ball one diamond from the corner—center hit so the 9 stops; (2) cue ball across from the second diamond—bank back to the tip. Mark the result.", "explain": "PKF: center hit stops with the 9 on top; rail return to the tip means no accidental sidespin.", "shoot": true},
  {"id": "cb-high-action", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "High Action", "src": "Page 29–30 · Figures 3-27 to 3-30", "prompt": "Read High Action and figures 3-29 / 3-30.", "explain": "High action means striking easier but getting more forward action. From the player's view the tip can look high while a side view shows near-center contact (figures 3-28 / 3-29). Aiming higher so the bottom of the tip contacts well above center (figure 3-30) creates more revolutions and extra energy to move the cue ball."},
  {"id": "cb-high-follow-in", "section": "center-ball", "type": "FIND THE POSITION ZONE", "assist": "ASSISTED", "title": "High-action follow-in goal", "src": "Page 30 · Figure 3-31", "prompt": "Object ball near the corner; cue ball about a half-diamond away on the pocket line. What is the drill goal with high action?", "explain": "PKF: pocket the object ball and follow the cue ball into the same pocket, with a nice soft stroke using high action. See how softly you can strike and still follow in.", "hint": "PKF wants more than just pocketing the object ball.", "choices": [["follow-in", "Pocket the object ball and follow the cue ball into the same pocket"], ["stop", "Stop the cue ball dead"], ["draw", "Draw three diamonds"], ["rail", "Send the cue ball to the opposite long rail only"]], "answer": "follow-in"},
  {"id": "cb-high-close", "section": "center-ball", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "ASSISTED", "title": "Close-range high action", "src": "Page 30 · Figure 3-32", "prompt": "Cue ball about one ball from the object ball for the same follow-in. What does PKF say to do to avoid a double hit?", "explain": "PKF: use an abbreviated forward stroke, grip slightly tighter than normal, short forward stroke, and strike with maximum high.", "hint": "Stroke length changes when the balls are that close.", "choices": [["abbrev", "Abbreviated forward stroke with maximum high"], ["long", "Long follow-through at soft speed"], ["draw", "Maximum low draw"], ["side", "Inside sidespin"]], "answer": "abbrev"},
  {"id": "cb-shoot-high", "section": "center-ball", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot the high-action follow-ins", "src": "Page 30", "prompt": "Set up figures 3-31 and 3-32. Soft high-action follow-in from half a diamond, then from about one ball away with an abbreviated stroke. Success: object ball pocketed and cue ball follows in.", "explain": "PKF: soft stroke with high action; close range needs abbreviated forward stroke and maximum high.", "shoot": true, "position": true},
  {"id": "cb-low-action", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Low Action", "src": "Page 31 · Figures 3-33 to 3-36", "prompt": "Read Low Action.", "explain": "Many players miss finesse draw because from their view the tip looks low while a side view shows near-center contact (figures 3-34 / 3-35), giving little draw. True low action strikes much lower (figure 3-36) for more revolutions. Figure 3-33: pocket the last stripe and draw back to the highlighted area for the 8—soft speed with low action to control speed."},
  {"id": "cb-draw-tips", "section": "center-ball", "type": "UNDERSTAND", "assist": "ASSISTED", "title": "Effective draw tips", "src": "Page 32", "prompt": "Which set matches PKF's effective-draw tips?", "explain": "PKF: light grip pressure kept through the stroke; accelerate through the cue ball; keep the cue as level as possible; keep the head still. Tightening the grip right before impact causes miscues or weak draw. For power draw, aim slightly less than maximum low and use a bigger stroke.", "hint": "Grip, acceleration, cue level, and head stillness.", "choices": [["pkf", "Light grip, accelerate through, level cue, still head"], ["tight", "Tighten the grip at impact for more spin"], ["elevate", "Elevate 45° for every draw"], ["side", "Add sidespin whenever drawing"]], "answer": "pkf"},
  {"id": "cb-draw-drill", "section": "center-ball", "type": "LEARN", "assist": "ASSISTED", "title": "Diamond draw drill", "src": "Page 33 · Figures 3-39, 3-40", "prompt": "Read the diamond draw drill.", "explain": "Figure 3-39: cue ball at the second diamond, object ball at the first—draw back to the second diamond; then two, then three. Progress by moving the cue ball farther from the object ball (figure 3-40). PKF: the draw shot is one of the most important and toughest to master."},
  {"id": "cb-stop-physics", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Stop shot & sliding", "src": "Page 33–34 · Figures 3-41 to 3-44", "prompt": "Read the stop-shot physics.", "explain": "For a stop, the cue ball must be sliding at impact—low spin ends right before contact. Figure 3-42: low spin ends, then sliding into the 1 → stop. Figure 3-43: low spin ends too early → rolling → slight follow. Figure 3-44: low spin lasts to impact → draws back. Soft stop with maximum low: object ball ~1 diamond from the corner, cue ~½ diamond behind (figure 3-41)."},
  {"id": "cb-stop-diag", "section": "center-ball", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "If the cue ball draws back…", "src": "Page 34", "prompt": "On the stop-shot drill, the cue ball draws back after contact. What does PKF say to adjust?", "explain": "PKF: if the cue ball draws back, reduce your speed (low spin lasted the whole distance). If it slightly follows, you did not have enough low spin.", "hint": "Compare figures 3-42 and 3-44.", "choices": [["reduce", "Reduce your speed"], ["more-low", "Hit even lower and harder"], ["sidespin", "Add left spin"], ["elevate", "Elevate the cue"]], "answer": "reduce"},
  {"id": "cb-soft-stop-why", "section": "center-ball", "type": "UNDERSTAND", "assist": "ASSISTED", "title": "Why soft stop with max low", "src": "Page 35", "prompt": "Why does PKF value soft stop shots with maximum low on tight pockets?", "explain": "PKF: soft stop with maximum low makes the pocket play bigger—the object ball can hit the rail near the pocket and still go in. Firm speed rattles out more easily.", "hint": "Think about how hard the object ball hits the pocket jaws.", "choices": [["bigger", "Soft speed makes the pocket play bigger"], ["harder", "You must shoot firm to hold the cue ball"], ["spin", "You need sidespin for every stop"], ["bank", "It only matters on bank shots"]], "answer": "bigger"},
  {"id": "cb-shoot-stop", "section": "center-ball", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot the soft stop drill", "src": "Page 33–36", "prompt": "Set up figure 3-41 / the Mosconi-style straight stop: object ball toward the corner, cue ball on the line. Use maximum low and see how softly you can stop the cue ball. Success: object ball pocketed and cue ball stopped (position achieved).", "explain": "PKF: maximum low; if the cue ball draws back, reduce speed; if it follows, add low spin or reduce distance.", "shoot": true, "position": true},
  {"id": "cb-throw", "section": "center-ball", "type": "LEARN", "assist": "ASSISTED", "title": "Throw without sidespin", "src": "Page 38 · Figures 3-58 to 3-60", "prompt": "Read the throw examples.", "explain": "With center / center-low / center-high (no sidespin), the object ball is thrown slightly in the direction the cue ball is traveling. PKF: aim a little thinner than normal so throw carries the ball into the pocket center."},
  {"id": "cb-throw-q", "section": "center-ball", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "INDEPENDENT", "title": "Compensate for throw", "src": "Page 38", "prompt": "On a cut with no sidespin, how does PKF say to aim relative to pocket center because of throw?", "explain": "PKF: aim a little thinner than normal so throw redirects the object ball into the center of the pocket.", "choices": [["thinner", "Aim a little thinner than normal"], ["thicker", "Aim much fuller"], ["center-only", "Always aim dead center and ignore throw"], ["english", "Add outside english every time"]], "answer": "thinner"},
  {"id": "cb-path-drill", "section": "center-ball", "type": "LEARN", "assist": "ASSISTED", "title": "True cue-ball path drill", "src": "Page 40–41 · Figures 3-66 to 3-71", "prompt": "Read the sticker path drill.", "explain": "Line up cue-ball stickers; strike maximum high hard enough for the cue ball to reach both side rails; pocket the object ball in the center of the pocket; mark the rail path and build a target between two marker balls. Consistency needs: same tip spot, same part of the pocket, same speed. Maximum low widens the path further."},
  {"id": "cb-auto-aim", "section": "center-ball", "type": "LEARN", "assist": "INDEPENDENT", "title": "Automatic aiming", "src": "Page 42–43", "prompt": "Read Automatic Aiming.", "explain": "PKF: training builds aiming at a subconscious level so top players run racks without overthinking. Conscious training, subconscious performance. A described drill: throw balls out and pocket any ball within three seconds of being down—to force trusting the stroke. Next comes placing the cue ball exactly where you want for position."},
  {"id": "cb-massey-stub", "section": "center-ball", "type": "LEARN", "assist": "GUIDED", "title": "Needs source review", "src": "Page 37 · Mike Massey's Low Action", "prompt": "FLAG FOR SOURCE REVIEW", "explain": "Mike Massey's Low Action (curve / path-change examples on page 37) needs a closer figure-by-figure pass before graded predict/action items are added. Incomplete stub—does not block unlocks.", "incomplete": true},
  {"id": "sl-intro", "section": "sliding-cue-ball", "type": "LEARN", "assist": "GUIDED", "title": "Sliding cue ball", "src": "Page 44 · Figures 4-1, 4-2", "prompt": "Read the sliding cue ball introduction.", "explain": "PKF: the sliding cue ball separates strong players—it lets you know where the cue ball goes after contact. Sliding means not rolling and no low spin at impact. Full hit → complete stop. Angled hit → leaves at a 90° angle to the object-ball path (figures 4-1, 4-2)."},
  {"id": "sl-90", "section": "sliding-cue-ball", "type": "PREDICT THE CUE BALL", "assist": "GUIDED", "title": "90° after a slide", "src": "Page 44–45 · Figures 4-2 to 4-4", "prompt": "A sliding cue ball strikes the object ball at an angle. Relative to the pocket line / object-ball path, where does the cue ball leave?", "explain": "PKF: if the cue ball is sliding when it strikes an object ball at an angle, it leaves at a 90 degree angle.", "hint": "PKF states a single angle.", "choices": [["90", "At a 90° angle to the object-ball path"], ["45", "At a 45° angle"], ["0", "Straight along the pocket line"], ["180", "Straight back toward the shooter"]], "answer": "90"},
  {"id": "sl-paper", "section": "sliding-cue-ball", "type": "LEARN", "assist": "GUIDED", "title": "Paper & L-hand visualization", "src": "Page 46 · Figures 4-9 to 4-13", "prompt": "Read the paper and hand methods.", "explain": "Place paper under the object ball with the long edge on the pocket line. A sliding cue ball travels parallel to the top edge (figures 4-9 / 4-10). Across the paper (A) means the cue ball was rolling; away from the top edge (B) means low spin (figure 4-12). Hand method: thumb toward the pocket, forefinger shows the 90° slide path (figure 4-13)."},
  {"id": "sl-path-a", "section": "sliding-cue-ball", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Path across the paper", "src": "Page 46 · Figure 4-12", "prompt": "On the side-pocket paper drill, the cue ball travels across the paper (path A). What does PKF say that means?", "explain": "PKF: if the cue ball travels across the paper (A), it was rolling when it struck the object ball.", "hint": "Compare sliding vs rolling vs low spin.", "choices": [["rolling", "The cue ball was rolling"], ["sliding", "It was a pure slide"], ["draw", "It had low spin"], ["massé", "It was a massé"]], "answer": "rolling"},
  {"id": "sl-path-b", "section": "sliding-cue-ball", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Path away from the paper edge", "src": "Page 46 · Figure 4-12", "prompt": "The cue ball moves away from the top edge of the paper (path B). What spin state does PKF assign?", "explain": "PKF: moving away from the top edge of the paper means the cue ball had low spin.", "choices": [["low", "Low spin (draw)"], ["rolling", "Rolling / follow"], ["sliding", "Pure slide"], ["left", "Left sidespin only"]], "answer": "low"},
  {"id": "sl-obstacle", "section": "sliding-cue-ball", "type": "LEARN", "assist": "GUIDED", "title": "Obstacle-rail slide drill", "src": "Page 47 · Figures 4-14 to 4-17", "prompt": "Read the obstacle drill.", "explain": "Object ball ~1 diamond from the corner; cue at a slight angle. Find the 90° slide path with the cue stick (and paper). Mark the rail; place obstacle balls ~two ball-widths on either side. Goal: pocket the object ball with a sliding cue ball so the cue ball hits between the obstacles. Hit the near obstacle → rolling; far obstacle → low spin. Practice medium, then soft to land between them; then increase cue distance."},
  {"id": "sl-obstacle-q", "section": "sliding-cue-ball", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "ASSISTED", "title": "Hit the near obstacle ball", "src": "Page 47", "prompt": "In the rail obstacle drill you hit the obstacle closer to the pocket. What does PKF say that means?", "explain": "PKF: hitting the first obstacle ball (closer to the pocket) means the cue ball was rolling when it struck the object ball.", "hint": "Near pocket vs far from pocket.", "choices": [["rolling", "Cue ball was rolling"], ["draw", "Cue ball had low spin"], ["perfect", "Perfect slide"], ["side", "Too much sidespin"]], "answer": "rolling"},
  {"id": "sl-shoot-gate", "section": "sliding-cue-ball", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot the slide gate drill", "src": "Page 47", "prompt": "Set up figures 4-14 to 4-17. Pocket the object ball with a sliding cue ball so the cue ball hits the rail between the obstacle balls. Success: shot made and position (gate) achieved.", "explain": "PKF: near obstacle → rolling; far obstacle → low spin; between them → sliding.", "shoot": true, "position": true},
  {"id": "sl-find-first", "section": "sliding-cue-ball", "type": "UNDERSTAND", "assist": "ASSISTED", "title": "Find the slide path first", "src": "Page 53 · Figures 4-28, 4-29", "prompt": "In the 8-ball example (3 to get to the 8), what do strong players do first according to PKF?", "explain": "PKF: strong players find the sliding cue ball path first, then decide what adjustments (for example roll instead of slide) are needed for position—as in figures 4-28 / 4-29 where slide heads to a corner (A) but roll goes to the side rail for the 8 (B).", "hint": "Before choosing roll vs slide.", "choices": [["slide-first", "Find the sliding path first, then adjust"], ["always-roll", "Always roll the cue ball"], ["ignore", "Ignore the pocket line"], ["side-first", "Pick sidespin before the path"]], "answer": "slide-first"},
  {"id": "sl-zone", "section": "sliding-cue-ball", "type": "FIND THE POSITION ZONE", "assist": "INDEPENDENT", "title": "Slide vs roll for the 8", "src": "Page 53 · Figure 4-29", "prompt": "Visualized slide path heads toward the bottom-left corner (A). Which cue-ball state does PKF say sends the ball toward the side rail for the 8 (B)?", "explain": "PKF: if the cue ball is rolling by the time it strikes the 3, it travels toward the side rail and ends up in good position for the 8 (B).", "choices": [["rolling", "Rolling cue ball"], ["sliding", "Pure sliding cue ball"], ["max-low", "Maximum low held to the rail"], ["jump", "Jump cue"]], "answer": "rolling"},
  {"id": "sl-pattern-next", "section": "sliding-cue-ball", "type": "CHOOSE THE NEXT SHOT", "assist": "ASSISTED", "title": "1→2→3→4 slide pattern", "src": "Page 45 · Figures 4-5 to 4-8", "prompt": "In the multi-ball slide demonstration (figures 4-5 to 4-8), after pocketing the 1 with a 90° slide for position, which ball is next in PKF's sequence?", "explain": "PKF walks 1 (side pocket) → 2 (corner) → 3 (corner) → 4 (corner), each using the 90° sliding path for the next position.", "hint": "Follow the numbered balls in the photos.", "choices": [["2", "The 2 ball"], ["3", "The 3 ball"], ["8", "The 8 ball"], ["9", "The 9 ball"]], "answer": "2"},
  {"id": "sl-shoot-pattern", "section": "sliding-cue-ball", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot a short slide pattern", "src": "Page 45", "prompt": "Set up a short pattern like figures 4-5 to 4-8. Use sliding cue ball paths for position from ball to ball. Success: complete the pattern with each next-ball position achieved.", "explain": "PKF: visualize the pocket line, then the 90° slide, for each shot.", "shoot": true, "position": true, "pattern": true},
  {"id": "ht-intro", "section": "half-table", "type": "LEARN", "assist": "GUIDED", "title": "Half table pattern play", "src": "Page 58 / Chapter Five intro", "prompt": "Read the half-table rules.", "explain": "PKF: \"The game becomes effortless when you let the angles do the work.\" Start with three-ball patterns using only center, center low, and center high. Pocket into any of the six pockets but the cue ball must stay on one half of the table. Decide pockets before shooting. If the cue ball crosses the halfway point, start the run over. Use stickers and repeat patterns."},
  {"id": "ht-rule", "section": "half-table", "type": "UNDERSTAND", "assist": "GUIDED", "title": "Half-table constraint", "src": "Chapter Five intro", "prompt": "What happens if the cue ball crosses the halfway point during a half-table pattern?", "explain": "PKF: if the cue ball crosses the halfway point you have to start the run over.", "hint": "PKF removes the safety net on purpose.", "choices": [["restart", "Start the run over"], ["ok", "It is fine if you still make the balls"], ["scratch", "It is scored as a scratch only"], ["side", "You must use sidespin next"]], "answer": "restart"},
  {"id": "ht-spin-limit", "section": "half-table", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "GUIDED", "title": "Allowed tip actions", "src": "Chapter Five intro", "prompt": "For these half-table patterns, which tip actions does PKF allow at the start?", "explain": "PKF: only center, center low, and center high.", "choices": [["c-cl-ch", "Center, center low, and center high"], ["any", "Any english including left/right"], ["draw-only", "Maximum low only"], ["follow-only", "Maximum high only"]], "answer": "c-cl-ch"},
  {"id": "ht-work-back", "section": "half-table", "type": "LEARN", "assist": "GUIDED", "title": "Work backward from the last ball", "src": "Page 72 · Figures 5-36 to 5-39", "prompt": "Read how PKF plans the 1→2 angle.", "explain": "Know the angle needed on the 2 (figure 5-37: correct side of the 2-ball pocket line so a slide reaches the position area). Then find the easiest way from the 1. Following across the line (figure 5-38) needs excellent speed (short A / long B risk). Many strong players prefer going off the side rail to the position area (figure 5-39)."},
  {"id": "ht-route", "section": "half-table", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Preferred 1→2 route", "src": "Page 72 · Figures 5-38, 5-39", "prompt": "For getting the angle on the 2 from the 1, which method does PKF say many strong players prefer?", "explain": "PKF: many strong players prefer going off the side rail toward the position area (figure 5-39) rather than following across the 2-ball pocket line with no rail (figure 5-38).", "hint": "Compare follow-across vs rail.", "choices": [["rail", "Off the side rail to the position area"], ["no-rail", "Follow across the pocket line with no rail"], ["scratch", "Scratch in the side on purpose"], ["jump", "Jump over the 2"]], "answer": "rail"},
  {"id": "ht-draw-vs-roll", "section": "half-table", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "ASSISTED", "title": "Draw vs roll on Pattern 4", "src": "Page 68 · Figures 5-20 to 5-23", "prompt": "On the pattern where a rolling cue ball leaves a long tough 2, what cue-ball action does PKF show to get closer to the 2?", "explain": "PKF: using draw brings the cue ball closer to the 2 for an easier shot (figures 5-22 / 5-23), versus a rolling leave that is long and difficult (figure 5-21).", "choices": [["draw", "Draw"], ["roll", "Keep rolling forward"], ["left", "Left sidespin only"], ["jump", "Jump cue"]], "answer": "draw"},
  {"id": "ht-next-2", "section": "half-table", "type": "CHOOSE THE NEXT SHOT", "assist": "ASSISTED", "title": "Next ball after the 1", "src": "Half-table 3-ball patterns", "prompt": "In PKF's three-ball half-table patterns (1, 2, 3), after you pocket the 1 into the planned pocket, which ball is next?", "explain": "PKF patterns run 1 then 2 then 3; pockets are chosen before the run starts.", "choices": [["2", "The 2 ball"], ["3", "The 3 ball"], ["8", "The 8 ball"], ["any", "Any remaining ball"]], "answer": "2"},
  {"id": "ht-plan-3", "section": "half-table", "type": "PLAN THE PATTERN", "assist": "ASSISTED", "title": "Plan a 3-ball half-table run", "src": "Chapter Five · 3-ball patterns", "prompt": "Build the ordered plan PKF uses for a basic half-table 3-ball: ball order, and cue-ball action family allowed.", "explain": "PKF: decide pockets first; run 1→2→3; cue ball stays on one half; tip actions center / center-low / center-high only.", "plan": {"steps": [{"id": "order", "label": "Ball order", "choices": [["123", "1 then 2 then 3"], ["321", "3 then 2 then 1"], ["213", "2 then 1 then 3"]], "answer": "123"}, {"id": "actions", "label": "Allowed actions", "choices": [["c", "Center / center-low / center-high only"], ["side", "Left and right spin allowed"], ["any", "Any action"]], "answer": "c"}, {"id": "half", "label": "Cue-ball rule", "choices": [["stay", "Must stay on one half of the table"], ["full", "May use the whole table"], ["scratch", "Must scratch after the 2"]], "answer": "stay"}]}},
  {"id": "ht-four-intro", "section": "half-table", "type": "LEARN", "assist": "ASSISTED", "title": "Four-ball half-table patterns", "src": "Pages 72–82 · First–Fourth four-ball patterns", "prompt": "Read the four-ball pattern approach.", "explain": "PKF adds four-ball half-table patterns. Work backward from the last ball to set the angle on each prior ball. Sliding, follow, and draw routes are compared to the same position window (for example figure 5-46 routes A follow / B slide / C draw). Land in a position window, not a single point."},
  {"id": "ht-routes-abc", "section": "half-table", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "Three routes to the end rail", "src": "Page 74 · Figure 5-46", "prompt": "Figure 5-46 shows three cue-ball routes to the same end-rail area after the 2. Which label does PKF give the draw route?", "explain": "PKF figure 5-46: Route A follow, Route B sliding ball, Route C draw.", "choices": [["C", "Route C"], ["A", "Route A"], ["B", "Route B"], ["none", "None of them is draw"]], "answer": "C"},
  {"id": "ht-shoot-3", "section": "half-table", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot a 3-ball half-table pattern", "src": "Chapter Five", "prompt": "Stick three balls on one half of the table. Decide pockets first. Run 1→2→3 with center / center-low / center-high only; keep the cue ball on that half. Success: pattern completed with positions achieved.", "explain": "PKF: if the cue ball crosses halfway, start over. Repeat with stickers.", "shoot": true, "position": true, "pattern": true},
  {"id": "ht-shoot-4", "section": "half-table", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot a 4-ball half-table pattern", "src": "Pages 72–82", "prompt": "Set up one of PKF's four-ball half-table patterns. Work backward for angles. Success: full pattern with each position window achieved.", "explain": "PKF: position windows; choose slide / follow / draw to match the window.", "shoot": true, "position": true, "pattern": true},
  {"id": "ht-wagon", "section": "half-table", "type": "LEARN", "assist": "INDEPENDENT", "title": "Wagon Wheel drill", "src": "Page 89 · Figures 5-113 to 5-115", "prompt": "Read the Wagon Wheel drill.", "explain": "PKF Wagon Wheel: object ball in the center; cue ball from multiple points around it to practice sending the object ball to all six pockets and reading the resulting cue-ball paths."},
  {"id": "ft-intro", "section": "full-table", "type": "LEARN", "assist": "GUIDED", "title": "Full table pattern play", "src": "Page 93 · Figures 6-1, 6-2", "prompt": "Read the full-table introduction.", "explain": "PKF: learn winning game plans in 8-Ball and 9-Ball. Start with simple layouts (one solid and the 8) using only center, center low, and center high—no left or right spin yet. Figure 6-1: ball in hand on the 5 by the corner; find the best way to the 8. Several position routes exist."},
  {"id": "ft-no-side", "section": "full-table", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "GUIDED", "title": "Early full-table spin rule", "src": "Page 93", "prompt": "On the first full-table layouts, which spin does PKF forbid?", "explain": "PKF: you can't use left or right spin—only center, center low, and center high.", "choices": [["lr", "Left or right spin"], ["high", "Center high"], ["low", "Center low"], ["center", "Center"]], "answer": "lr"},
  {"id": "ft-slide-ref", "section": "full-table", "type": "LEARN", "assist": "GUIDED", "title": "Slide path as reference", "src": "Page 95 · Figures 6-7 to 6-9", "prompt": "Read how PKF uses the slide path with a touch of low.", "explain": "PKF uses the sliding path as a reference, then a small amount of low spin to pull the cue ball toward the end rail into the position zone—especially when blockers sit on the natural slide (figures 6-8 / 6-9)."},
  {"id": "ft-follow-vs-slide", "section": "full-table", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Slide too far left", "src": "Page 96 · Figure 6-12", "prompt": "Path A (sliding) goes too far left of the position zone for the 8. What adjustment does PKF show as path B?", "explain": "PKF: path B uses a little follow to guide the cue ball into position zone A.", "hint": "A little forward roll.", "choices": [["follow", "A little follow"], ["more-draw", "More low spin"], ["left", "Hard left spin"], ["jump", "Jump the blocker"]], "answer": "follow"},
  {"id": "ft-high-vs-draw", "section": "full-table", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "ASSISTED", "title": "High action vs draw leave", "src": "Page 98 · Figures 6-17 to 6-20", "prompt": "To bring the cue ball back toward the bottom rail for the 3 after the 2, which action does PKF demonstrate?", "explain": "PKF shows a draw shot on the 2 to bring the cue ball back toward the bottom rail for the 3 (figures 6-19 / 6-20, low center).", "choices": [["draw", "Draw (low center)"], ["max-high", "Maximum high follow only"], ["stun-only", "Stun with no spin ever"], ["right", "Right spin only"]], "answer": "draw"},
  {"id": "ft-plan-5-8", "section": "full-table", "type": "PLAN THE PATTERN", "assist": "ASSISTED", "title": "Plan 5 → 8 (ball in hand)", "src": "Page 93 · Figure 6-1", "prompt": "Ball in hand on the 5 by the corner; get to the 8. Lock a plan that matches PKF's early full-table rules.", "explain": "PKF: pocket the 5, get position on the 8, using only center / center-low / center-high—no left or right spin. Several routes can work; pick a center-family action and a clear position goal on the 8.", "plan": {"steps": [{"id": "first", "label": "First ball", "choices": [["5", "5 ball"], ["8", "8 ball first"], ["any", "Any solid"]], "answer": "5"}, {"id": "next", "label": "Next ball", "choices": [["8", "8 ball"], ["9", "9 ball"], ["1", "1 ball"]], "answer": "8"}, {"id": "spin", "label": "Spin family", "choices": [["center", "Center / center-low / center-high only"], ["side", "Left or right spin OK"], ["masse", "Massé required"]], "answer": "center"}]}},
  {"id": "ft-shoot-simple", "section": "full-table", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot 5 → 8 (no sidespin)", "src": "Page 93", "prompt": "Ball in hand on the 5 near the corner as in figure 6-1. Pocket the 5 and get position on the 8 using only center / center-low / center-high. Success: both balls with position achieved on the 8.", "explain": "PKF: several routes exist; no left or right spin on these early layouts.", "shoot": true, "position": true, "pattern": true},
  {"id": "ft-sidespin-intro", "section": "full-table", "type": "LEARN", "assist": "GUIDED", "title": "Full table with sidespin", "src": "Page 115", "prompt": "Read the sidespin transition.", "explain": "After center-ball positioning and slide/roll feel, PKF introduces full-table patterns with sidespin. Elevation plus sidespin may return to—or cross—the shooting line (massé-like). Example: hidden behind half a ball on the 8, aim along the shooting line just missing the blocker; elevated 45° with left spin—the cue ball first moves right (A) then across the line to the 8."},
  {"id": "ft-avoid-side", "section": "full-table", "type": "UNDERSTAND", "assist": "ASSISTED", "title": "Unnecessary sidespin", "src": "Page 116", "prompt": "What does PKF warn against when a center-ball or stun path already reaches the zone?", "explain": "PKF warns against using sidespin when a center-ball or stun shot is sufficient—unnecessary or accidental sidespin misses shots or ruins position.", "choices": [["avoid", "Avoid unnecessary sidespin"], ["always", "Always add sidespin for style"], ["never-stun", "Never use stun"], ["elevate", "Always elevate 45°"]], "answer": "avoid"},
  {"id": "ft-running", "section": "full-table", "type": "PREDICT THE CUE BALL", "assist": "ASSISTED", "title": "Running english path", "src": "Page 118–119 · Figures 6-105, 6-109", "prompt": "Running english off the rails does what to the cue-ball path compared with no spin, per PKF?", "explain": "PKF: running english widens the angle off the rails so the cue ball travels around the table for position (e.g. figure 6-109), versus reverse english which narrows the rebound (figure 6-112).", "hint": "Widens travel around the table.", "choices": [["widen", "Widens the rail angle / helps travel around the table"], ["narrow", "Always narrows every rail angle"], ["stop", "Stops the cue ball dead"], ["jump", "Makes the cue ball jump"]], "answer": "widen"},
  {"id": "ft-reverse", "section": "full-table", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "Reverse english contrast", "src": "Page 120 · Figure 6-112", "prompt": "Same 13→8 layout as the running-english example, but with reverse (left) spin. What happens off the first rail per PKF?", "explain": "PKF: with reverse english the cue ball hits the bottom rail and reflects at a much narrower angle, heading toward the right side rail instead of traveling around the table.", "choices": [["narrow", "Narrower rebound; does not travel around the table"], ["same", "Identical path to running english"], ["scratch", "Always scratches"], ["stop", "Stops on the rail"]], "answer": "narrow"},
  {"id": "ft-preshot", "section": "full-table", "type": "LEARN", "assist": "ASSISTED", "title": "Pre-shot routine", "src": "Page 126", "prompt": "Read PKF's pre-shot questions.", "explain": "PKF pre-shot routine questions: Which side has problem balls? What is the pattern? Where are danger zones? What is the last ball before the 9? What speed and spin are needed? Practice raised-bridge sidespin shots (figure 6-131) because they are commonly missed."},
  {"id": "ft-plan-9", "section": "full-table", "type": "PLAN THE PATTERN", "assist": "INDEPENDENT", "title": "Plan from a 9-ball layout", "src": "Page 127 · Figure 6-133", "prompt": "On a full 9-ball layout, lock a first-transition plan in PKF's spirit: identify the first ball and that you must choose speed/spin for the correct side of the next ball.", "explain": "PKF walks planning the 1→2 transition—including soft shot with reverse english when needed to stay on the correct side of the 2.", "plan": {"steps": [{"id": "open", "label": "Open on", "choices": [["1", "The 1 ball"], ["9", "The 9 first"], ["random", "Any ball"]], "answer": "1"}, {"id": "goal", "label": "First position goal", "choices": [["side2", "Correct side of the 2 for the next shot"], ["scratch", "Scratch after the 1"], ["9early", "Shape on the 9 immediately"]], "answer": "side2"}, {"id": "think", "label": "Before shooting", "choices": [["routine", "Run the pre-shot questions (pattern, dangers, speed/spin)"], ["fire", "Shoot within one second always"], ["ignore", "Ignore problem balls"]], "answer": "routine"}]}},
  {"id": "ft-shoot-4", "section": "full-table", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot a 4-ball full-table pattern", "src": "Pages 101–106", "prompt": "Set up a 4-ball full-table pattern from the chapter. Use slide / follow / draw as PKF shows for each window. Success: pattern completed with positions achieved.", "explain": "PKF: evaluate paths A/B/C; soft rolling when it holds the window; high action when you must force a rail.", "shoot": true, "position": true, "pattern": true},
  {"id": "ft-shoot-side", "section": "full-table", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Shoot a running-english position", "src": "Pages 118–119", "prompt": "Set up a running-english position shot like figure 6-109 (object ball near the corner, travel around the table for the next ball). Success: shot made and position achieved.", "explain": "PKF: running english widens rail angles; reverse narrows them—pick the spin that matches the needed path.", "shoot": true, "position": true},
  {"id": "ft-cluster-stub", "section": "full-table", "type": "LEARN", "assist": "GUIDED", "title": "Needs source review", "src": "Pages 134–136 · cluster / 8-ball breakout plans", "prompt": "FLAG FOR SOURCE REVIEW", "explain": "Late-chapter 8-ball cluster breakouts and multi-zone plans (figures 6-160 to 6-171) need a dedicated figure audit before graded plan items. Incomplete stub—does not block unlocks.", "incomplete": true}
].map((l) => ({ choices: null, answer: null, incomplete: false, shoot: false, position: false, pattern: false, hint: '', plan: null, ...l }));

export const EXAM_ITEMS = [
  {"id": "ex-k1", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "Left spin deflection", "src": "Page 24", "prompt": "Level cue, left sidespin: which way does the cue ball leave the shooting line?", "explain": "PKF: left side pushes the cue ball to the right (deflection).", "choices": [["right", "Right"], ["left", "Left"], ["straight", "Straight"], ["up", "Jumps"]], "answer": "right"},
  {"id": "ex-k2", "type": "UNDERSTAND", "assist": "INDEPENDENT", "title": "Stop needs sliding", "src": "Page 34", "prompt": "For a stop shot, when must low spin end relative to contact?", "explain": "PKF: low spin ends right before contact so the cue ball is sliding at impact.", "choices": [["before", "Right before contact"], ["after", "After contact"], ["never", "Never use low spin"], ["at-tip", "Only at the tip of the cue"]], "answer": "before"},
  {"id": "ex-k3", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "INDEPENDENT", "title": "Center-finding rail drill", "src": "Page 28", "prompt": "Second-diamond rail return drill: which tip action?", "explain": "PKF: center ball so it returns to the tip.", "choices": [["center", "Center"], ["left", "Left"], ["right", "Right"], ["high", "Max high"]], "answer": "center"},
  {"id": "ex-k4", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "90° slide", "src": "Page 44", "prompt": "Sliding cue ball, angled hit: leave angle vs object-ball path?", "explain": "PKF: 90 degrees.", "choices": [["90", "90°"], ["45", "45°"], ["0", "0°"], ["30", "30°"]], "answer": "90"},
  {"id": "ex-k5", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "Across the paper", "src": "Page 46", "prompt": "Cue ball path across the paper (A) means?", "explain": "PKF: the cue ball was rolling.", "choices": [["rolling", "Rolling"], ["slide", "Sliding"], ["draw", "Low spin"], ["jump", "Jump"]], "answer": "rolling"},
  {"id": "ex-k6", "type": "UNDERSTAND", "assist": "INDEPENDENT", "title": "Half-table restart", "src": "Chapter Five", "prompt": "Cue ball crosses the halfway point—what happens?", "explain": "PKF: start the run over.", "choices": [["restart", "Start over"], ["ok", "Continue"], ["foul", "Opponent ball in hand only"], ["win", "Automatic win"]], "answer": "restart"},
  {"id": "ex-k7", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "INDEPENDENT", "title": "Half-table allowed actions", "src": "Chapter Five", "prompt": "Allowed tip actions on early half-table patterns?", "explain": "Center, center low, center high.", "choices": [["c", "Center / center-low / center-high"], ["side", "Any sidespin"], ["masse", "Massé only"], ["jump", "Jump only"]], "answer": "c"},
  {"id": "ex-k8", "type": "CHOOSE THE CUE-BALL ACTION", "assist": "INDEPENDENT", "title": "Early full-table ban", "src": "Page 93", "prompt": "Forbidden on the first full-table layouts?", "explain": "No left or right spin.", "choices": [["lr", "Left or right spin"], ["high", "Center high"], ["low", "Center low"], ["center", "Center"]], "answer": "lr"},
  {"id": "ex-k9", "type": "PREDICT THE CUE BALL", "assist": "INDEPENDENT", "title": "Running english", "src": "Page 119", "prompt": "Running english off rails tends to…", "explain": "Widen angles so the cue ball travels around the table.", "choices": [["widen", "Widen travel around the table"], ["stop", "Stop the cue ball"], ["narrow-always", "Always narrow every angle"], ["scratch", "Force a scratch"]], "answer": "widen"},
  {"id": "ex-k10", "type": "CHOOSE THE NEXT SHOT", "assist": "INDEPENDENT", "title": "Pattern order", "src": "Half-table", "prompt": "In a 1-2-3 half-table pattern, ball after the 1?", "explain": "The 2 ball.", "choices": [["2", "2"], ["3", "3"], ["8", "8"], ["9", "9"]], "answer": "2"},
  {"id": "ex-x1", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Soft stop with position", "src": "Page 33–36", "prompt": "Straight stop drill with maximum low. Success: make + stop (position).", "explain": "Physical: made + position.", "shoot": true, "position": true},
  {"id": "ex-x2", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Slide gate", "src": "Page 47", "prompt": "Obstacle-rail slide drill. Success: make + gate position.", "explain": "Physical: made + position.", "shoot": true, "position": true},
  {"id": "ex-x3", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Half-table 3-ball", "src": "Chapter Five", "prompt": "3-ball half-table run. Success: pattern + positions.", "explain": "Physical pattern.", "shoot": true, "position": true, "pattern": true},
  {"id": "ex-x4", "type": "NOW SHOOT IT", "assist": "INDEPENDENT", "title": "Full-table 5→8", "src": "Page 93", "prompt": "5 to 8, no sidespin. Success: both with position on 8.", "explain": "Physical pattern.", "shoot": true, "position": true, "pattern": true}
].map((l) => ({ choices: null, answer: null, shoot: false, position: false, pattern: false, assist: ASSIST.INDEPENDENT, hint: '', plan: null, ...l }));

export function lessonsFor(sectionId) { return LESSONS.filter((l) => l.section === sectionId); }
export function lessonById(id) { return LESSONS.find((l) => l.id === id) || EXAM_ITEMS.find((l) => l.id === id) || null; }

export function blank() {
  return {
    sections: {},
    current: null,
    exam: { attempts: 0, passed: false, bestKnowledge: 0, bestExecution: 0, bestPosition: 0, bestPattern: 0, bestOverall: 0, history: [], weak: {} },
    stats: { knowledgeCorrect: 0, knowledgeWrong: 0, executionMake: 0, executionMiss: 0, positionOk: 0, positionMiss: 0, firstTry: 0, secondTry: 0, thirdTry: 0, failed: 0 }
  };
}

export function courseOf(state) {
  const raw = state?.[STORAGE_KEY];
  if (!raw || typeof raw !== 'object') return blank();
  return {
    ...blank(),
    ...raw,
    sections: raw.sections && typeof raw.sections === 'object' ? raw.sections : {},
    exam: { ...blank().exam, ...(raw.exam || {}) },
    stats: { ...blank().stats, ...(raw.stats || {}) },
    current: raw.current || null
  };
}

function put(state, course) { return { ...state, [STORAGE_KEY]: course }; }

export function sectionRecord(course, id) { return course.sections?.[id] || null; }
export function sectionPassed(course, id) { const r = sectionRecord(course, id); return !!(r && r.passed); }

export function sectionUnlocked(state, sectionId, { dev = false } = {}) {
  if (dev) return true;
  const course = courseOf(state);
  const idx = SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return false;
  for (let i = 0; i < idx; i++) {
    const s = SECTIONS[i];
    if (s.stub) continue;
    if (!sectionPassed(course, s.id)) return false;
  }
  return true;
}

export function examUnlocked(state, { dev = false } = {}) {
  if (dev) return true;
  const course = courseOf(state);
  return SECTIONS.filter((s) => !s.stub).every((s) => sectionPassed(course, s.id));
}

export function knowledgeLessons(sectionId) {
  return lessonsFor(sectionId).filter((l) => !l.shoot && !l.incomplete && (l.answer != null || l.plan));
}

function emptyItem() {
  return { locked: false, choice: null, correct: null, revealed: false, execution: null, attempts: [], done: false, hint: false, planChoices: {} };
}

function freshRun(ids, extra) {
  const items = {};
  for (const id of ids) items[id] = emptyItem();
  return { cursor: 0, view: 0, phase: 'play', order: [...ids], items, ...extra };
}

export function startSection(state, sectionId) {
  if (!sectionUnlocked(state, sectionId)) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (cur && !cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  course.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId });
  return put(state, course);
}

export function startExam(state) {
  if (!examUnlocked(state)) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (cur && !cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  course.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam' });
  return put(state, course);
}

export function previewSection(state, sectionId, restart = false) {
  const list = lessonsFor(sectionId);
  if (!list.length) return state;
  const course = courseOf(state);
  const cur = course.current;
  if (!restart && cur && cur.dev && cur.mode === 'section' && cur.sectionId === sectionId) return state;
  course.current = freshRun(list.map((l) => l.id), { mode: 'section', sectionId, dev: true, parent: 'section' });
  return put(state, course);
}

export function previewExam(state, restart = false) {
  const course = courseOf(state);
  const cur = course.current;
  if (!restart && cur && cur.dev && (cur.mode === 'exam' || cur.parent === 'exam')) return state;
  course.current = freshRun(EXAM_ITEMS.map((l) => l.id), { mode: 'exam', dev: true, parent: 'exam' });
  return put(state, course);
}

function liveItem(course) {
  const cur = course.current;
  if (!cur || cur.phase !== 'play') return null;
  const id = cur.order[cur.cursor];
  return { cur, id, lesson: lessonById(id), it: cur.items[id] };
}

export function selectChoice(state, choice) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || x.it.done) return state;
  if (!x.lesson?.choices?.some((c) => c[0] === String(choice))) return state;
  x.it.choice = String(choice);
  return put(state, course);
}

export function selectPlanStep(state, stepId, choice) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || x.it.done) return state;
  const plan = x.lesson?.plan;
  if (!plan?.steps?.some((s) => s.id === stepId && s.choices.some((c) => c[0] === String(choice)))) return state;
  x.it.planChoices = { ...(x.it.planChoices || {}), [stepId]: String(choice) };
  return put(state, course);
}

export function showHint(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || !x.lesson?.hint) return state;
  x.it.hint = true;
  return put(state, course);
}

export function lockAnswer(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.locked || x.it.done) return state;
  const { cur, lesson, it } = x;
  if (lesson?.plan) {
    const steps = lesson.plan.steps || [];
    if (!steps.every((s) => it.planChoices?.[s.id] != null)) return state;
    it.locked = true;
    it.correct = steps.every((s) => String(it.planChoices[s.id]) === String(s.answer));
    it.revealed = true;
    it.done = true;
    if (!cur.dev) {
      if (it.correct) course.stats.knowledgeCorrect += 1;
      else course.stats.knowledgeWrong += 1;
    }
    return put(state, course);
  }
  if (lesson?.answer == null) return state;
  if (it.choice == null || it.choice === '') return state;
  it.locked = true;
  it.correct = String(it.choice) === String(lesson.answer);
  it.revealed = true;
  if (!cur.dev) {
    if (it.correct) course.stats.knowledgeCorrect += 1;
    else course.stats.knowledgeWrong += 1;
  }
  if (!lesson.shoot) it.done = true;
  return put(state, course);
}

/** Physical result: makePos | makeMissPos | miss. Three attempts; success needs makePos when position is part of the drill. */
export function markExecution(state, result) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done) return state;
  const { cur, lesson, it } = x;
  if (!lesson?.shoot) return state;
  if (lesson.answer != null && !it.locked) return state;
  const needPos = !!lesson.position;
  let tag = result;
  if (result === 'make' || result === 'success') tag = needPos ? 'makePos' : 'makePos';
  if (result === 'make-miss-pos') tag = 'makeMissPos';
  if (result === 'miss') tag = 'miss';
  if (!['makePos', 'makeMissPos', 'miss'].includes(tag)) return state;
  if (it.attempts.length >= 3) return state;
  it.attempts = [...it.attempts, tag];
  it.revealed = true;
  const success = tag === 'makePos';
  const done = success || it.attempts.length >= 3;
  if (done) {
    it.done = true;
    it.execution = success ? 'make' : 'miss';
    if (!cur.dev) {
      if (success) {
        course.stats.executionMake += 1;
        if (needPos) course.stats.positionOk += 1;
        const n = it.attempts.length;
        if (n === 1) course.stats.firstTry += 1;
        else if (n === 2) course.stats.secondTry += 1;
        else course.stats.thirdTry += 1;
      } else {
        course.stats.executionMiss += 1;
        course.stats.failed += 1;
        if (needPos && it.attempts.some((a) => a === 'makeMissPos')) course.stats.positionMiss += 1;
      }
    }
  }
  return put(state, course);
}

export function acknowledgeLearn(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it || x.it.done) return state;
  if (x.lesson?.answer != null || x.lesson?.shoot || x.lesson?.plan) return state;
  x.it.locked = true;
  x.it.revealed = true;
  x.it.done = true;
  return put(state, course);
}

export function nextLesson(state) {
  const course = courseOf(state);
  const x = liveItem(course);
  if (!x || !x.it?.done) return state;
  const cur = x.cur;
  if (cur.cursor >= cur.order.length - 1) return finishRun(state);
  cur.cursor += 1;
  cur.view = cur.cursor;
  return put(state, course);
}

export function viewLesson(state, i) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur) return state;
  cur.view = Math.max(0, Math.min(cur.cursor, Number(i) || 0));
  return put(state, course);
}

function finishRun(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur) return state;
  let kOk = 0, kTot = 0, xOk = 0, xTot = 0, pOk = 0, pTot = 0, planOk = 0, planTot = 0;
  const missed = [];
  const missedPos = [];
  const weak = { ...(course.exam.weak || {}) };
  for (const id of cur.order) {
    const lesson = lessonById(id);
    const it = cur.items[id];
    if (!lesson || !it) continue;
    if (lesson.answer != null || lesson.plan) {
      kTot += 1;
      if (lesson.plan) { planTot += 1; if (it.correct) planOk += 1; }
      if (it.correct) kOk += 1;
      else {
        missed.push(id);
        if (cur.mode === 'exam') weak[lesson.title || id] = (weak[lesson.title || id] || 0) + 1;
      }
    }
    if (lesson.shoot && it.execution) {
      xTot += 1;
      if (it.execution === 'make') xOk += 1;
      else missedPos.push(id);
      if (lesson.position) {
        pTot += 1;
        if (it.attempts?.some((a) => a === 'makePos')) pOk += 1;
      }
    }
  }
  const kRate = kTot ? kOk / kTot : 1;
  const xRate = xTot ? xOk / xTot : 1;
  const pRate = pTot ? pOk / pTot : 1;
  const planRate = planTot ? planOk / planTot : 1;
  const overall = (kTot + xTot) ? (kOk + xOk) / (kTot + xTot) : 0;
  const review = cur.parent === 'review' || cur.parent === 'review-pos';
  const sectionPass = kTot ? kRate >= KNOWLEDGE_PASS : true;
  const examPass = overall >= EXAM_PASS;
  cur.phase = 'results';
  cur.summary = { kOk, kTot, xOk, xTot, pOk, pTot, planOk, planTot, kRate, xRate, pRate, planRate, overall, missed, missedPos, review, passed: review ? (cur.parent === 'review-pos' ? xOk === xTot : kOk === kTot) : (cur.mode === 'section' ? sectionPass : examPass) };
  if (cur.dev || review) return put(state, course);
  if (cur.mode === 'section') {
    const prev = course.sections[cur.sectionId] || { knowledgeCorrect: 0, knowledgeTotal: 0, executionMake: 0, executionMiss: 0, positionOk: 0, positionMiss: 0, passed: false, bestKnowledge: 0, attempts: 0, missed: [], missedPos: [] };
    prev.attempts = (prev.attempts || 0) + 1;
    prev.knowledgeCorrect = kOk;
    prev.knowledgeTotal = kTot;
    prev.executionMake = (prev.executionMake || 0) + xOk;
    prev.executionMiss = (prev.executionMiss || 0) + (xTot - xOk);
    prev.positionOk = (prev.positionOk || 0) + pOk;
    prev.positionMiss = (prev.positionMiss || 0) + (pTot - pOk);
    prev.bestKnowledge = Math.max(prev.bestKnowledge || 0, kRate);
    prev.missed = missed;
    prev.missedPos = missedPos;
    if (sectionPass) prev.passed = true;
    course.sections[cur.sectionId] = prev;
  } else {
    course.exam.attempts += 1;
    course.exam.bestKnowledge = Math.max(course.exam.bestKnowledge || 0, kRate);
    course.exam.bestExecution = Math.max(course.exam.bestExecution || 0, xRate);
    course.exam.bestPosition = Math.max(course.exam.bestPosition || 0, pRate);
    course.exam.bestPattern = Math.max(course.exam.bestPattern || 0, planRate);
    course.exam.bestOverall = Math.max(course.exam.bestOverall || 0, overall);
    if (examPass) course.exam.passed = true;
    course.exam.weak = weak;
    course.exam.history = [...(course.exam.history || []), {
      at: new Date().toISOString(),
      knowledge: Math.round(kRate * 100),
      execution: Math.round(xRate * 100),
      position: Math.round(pRate * 100),
      pattern: Math.round(planRate * 100),
      overall: Math.round(overall * 100),
      passed: examPass
    }].slice(-20);
  }
  return put(state, course);
}

export function retryCurrent(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur) return state;
  if (cur.dev) {
    if (cur.mode === 'exam' || cur.parent === 'exam') return previewExam(state, true);
    return previewSection(state, cur.sectionId, true);
  }
  course.current = null;
  const cleared = put(state, course);
  if (cur.mode === 'exam') return startExam(cleared);
  return startSection(cleared, cur.sectionId);
}

export function reviewMissed(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur?.summary?.missed?.length) return state;
  course.current = freshRun(cur.summary.missed, { mode: cur.mode, sectionId: cur.sectionId, parent: 'review', dev: !!cur.dev });
  return put(state, course);
}

export function reviewMissedPositions(state) {
  const course = courseOf(state);
  const cur = course.current;
  if (!cur?.summary?.missedPos?.length) return state;
  course.current = freshRun(cur.summary.missedPos, { mode: cur.mode, sectionId: cur.sectionId, parent: 'review-pos', dev: !!cur.dev });
  return put(state, course);
}

export function passedSectionCount(course) { return SECTIONS.filter((s) => !s.stub && sectionPassed(course, s.id)).length; }
export function playableSectionCount() { return SECTIONS.filter((s) => !s.stub).length; }

export function pkfCueBallProgressRows(state) {
  const course = courseOf(state);
  const rows = [];
  const started = !!((course.current && !course.current.dev) || Object.keys(course.sections).length);
  if (started) {
    const done = passedSectionCount(course);
    const total = playableSectionCount();
    rows.push({ id: 'pkfCueBall', name: COURSE_TITLE, href: '#pkfcb', short: 'PKF Cue Ball', done, total, finished: done >= total });
  }
  const examStarted = !!(course.exam?.attempts || course.exam?.passed || (course.current && !course.current.dev && course.current.mode === 'exam'));
  if (examStarted) {
    rows.push({ id: 'pkfCueBallExam', name: EXAM_TITLE, href: '#pkfcb/exam', short: 'PKF CB Exam', done: course.exam.passed ? 1 : 0, total: 1, finished: !!course.exam.passed });
  }
  return rows;
}

export function pkfCueBallBannersHTML(state, { dev = false } = {}) {
  const real = examUnlocked(state || {});
  const open = real || dev;
  const n = playableSectionCount();
  const course = `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfcb" data-pkfcb="course"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${esc(COURSE_TITLE)}</b><small>${n} sections from PKF Pattern Play: center ball, slide paths, half-table and full-table patterns. Lock answers, then shoot for position on your table.</small></span><span class="simPromoGo">›</span></button>`;
  const exam = open
    ? `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#pkfcb/exam" data-pkfcb="exam"${real ? '' : ' data-dev-open="1"'}><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Knowledge + table execution. Pass at ${Math.round(EXAM_PASS * 100)}%.${real ? '' : ' Dev preview.'}</small></span><span class="simPromoGo">›</span></button>`
    : `<div class="card simPromo buEntry is-locked" data-pkfcb="exam" data-pkfcb-locked="1"><span class="simPromoText"><span class="eyebrow">EXAM</span><b>${esc(EXAM_TITLE)}</b><small>Locked until all sections are passed.</small></span></div>`;
  return course + exam;
}

export function lessonTypeCounts() {
  const bag = {};
  for (const l of LESSONS) {
    const k = l.incomplete ? 'INCOMPLETE' : (l.type || 'OTHER');
    bag[k] = (bag[k] || 0) + 1;
  }
  return bag;
}

export function assistCounts() {
  const bag = {};
  for (const l of LESSONS) if (!l.incomplete) bag[l.assist] = (bag[l.assist] || 0) + 1;
  return bag;
}

export { figureHTML, revealFigureHTML, assetOf, ASSET_MAP, REGIONS };

export function auditCourse() {
  const problems = [];
  const ids = new Set();
  for (const l of [...LESSONS, ...EXAM_ITEMS]) {
    if (ids.has(l.id)) problems.push(`duplicate id ${l.id}`);
    ids.add(l.id);
    if (!ASSET_MAP[l.id] || !assetOf(l.id)) problems.push(`missing asset ${l.id}`);
    if (!l.src) problems.push(`missing source citation ${l.id}`);
    if (l.answer != null && !(l.choices || []).some((c) => c[0] === l.answer)) problems.push(`answer not in choices ${l.id}`);
    if ((l.answer != null || l.plan) && !l.incomplete && !assetOf(l.id)?.reveal && !ASSET_MAP[l.id]?.textOnlyUntilLock) {
      // text-only may reveal same fig
    }
    if (l.choices && new Set(l.choices.map((c) => c[0])).size !== l.choices.length) problems.push(`duplicate choice ${l.id}`);
    if (l.shoot && l.answer != null) problems.push(`shoot item with a graded answer ${l.id}`);
    if (l.plan) {
      for (const s of l.plan.steps || []) {
        if (!(s.choices || []).some((c) => c[0] === s.answer)) problems.push(`plan step answer missing ${l.id}.${s.id}`);
      }
    }
  }
  for (const l of LESSONS) if (!sectionById(l.section)) problems.push(`bad section ${l.id}`);
  for (const s of SECTIONS) if (!lessonsFor(s.id).length) problems.push(`empty section ${s.id}`);
  if (problems.length) throw new Error(problems.join('; '));
  return { lessons: LESSONS.length, exam: EXAM_ITEMS.length, sections: SECTIONS.length, assets: Object.keys(ASSET_MAP).length };
}

auditCourse();
