/**
 * Ball Pocketing — the printed manual, not a redraw.
 * Each drill's diagram is the table cropped from Andrew's PDF.
 * The description keeps the printed words. The how-to shown on the drill
 * is the level's instruction page itself (pages 2, 8, 14, 21, and 30),
 * one full page per level, not a retyped paragraph.
 * Levels stay 1–5. Rank, cue badges, and XP awards are unchanged.
 * The Drill Sets course lists only these PDF drills, in PDF order.
 */
import { isDrillHidden } from '../drills/hidden.js';

export const BALL_POCKET_LEVELS = [1, 2, 3, 4, 5];
export const BALL_POCKET_NAME = 'Ball Pocketing';

export const BALL_POCKET_TEXT = {
  1: "A. When the cue ball and object ball are on a straight line to the pocket, this is the cue ball graphic that displays how you'll be hitting the cue ball (in this case you'll be using center high, center, and center low).\n\nB. When you first set up a shot (not straight in) you shoot the shot at least twice to determine the path of the cue ball. For example, shoot the shot with center high and mark the path the cue ball takes off the rail with a pool ball. Shoot the shot again and if the cue ball strikes the first ball then this becomes your path (if the cue ball misses the first ball keep shooting until the cue ball strikes one of the path balls). Mark this path with two pool balls - this is the target you need to strike on every shot.\n\nC. This the cue ball clock you'll be using for reference when you're shooting a shot that's not straight in. Start with center high then work your way around the cue ball. After high left you'll then go to center, then slightly below center.\n\nD. This red line represents a straight in shot. You'll be using the red line cue ball graphic for reference.\n\nE. When you see spaces between cue balls (represented by transparent cue balls) this is the distance you'll be placing the next cue ball. For instance, in this example the next cue ball is two pool balls away from the first cue ball.\n\nF. Shoot the shot 5 times successfully before moving on to the next spot on the cue ball clock.\n\nWhen you finish each level, start over but this time reverse each layout:",
  2: "A. When the cue ball and object ball are on a straight line to the pocket, this is the cue ball graphic that displays how you'll be hitting the cue ball (in this case you'll be using center high, center, and center low).\n\nB. When you first set up a shot (not straight in) you shoot the shot at least twice to determine the path of the cue ball. For example, shoot the shot with center high and mark the path of the cue ball with a pool ball. Shoot the shot again and if the cue ball strikes the first ball then this becomes your path (if the cue ball misses the first ball keep shooting until the cue ball strikes one of the path balls). Mark this path with two pool balls - this is the target you need to strike on every shot.\n\nC. This the cue ball clock you'll be using for reference when you're shooting a shot that's not straight in. Start with center high then work your way around the cue ball. After high left you'll then go to center, then slightly below center.\n\nD. This red line represents a straight in shot. You'll be using the red line cue ball graphic for reference.\n\nE. When you see spaces between cue balls (represented by transparent cue balls) this is the distance you'll be placing the next cue ball. For instance, in this example the next cue ball is two pool balls away from the first cue ball.\n\nF. Shoot the shot 5 times successfully before moving on to the next spot on the cue ball clock. If you miss the shot you have to start over\n\nWhen you finish each level, start over but this time reverse each layout:",
  3: "A. When the cue ball and object ball are on a straight line to the pocket, this is the cue ball graphic that displays how you'll be hitting the cue ball (in this case you'll be using center high, center, and center low).\n\nB. When you first set up a shot (not straight in) you shoot the shot at least twice to determine the path of the cue ball. For example, shoot the shot with center high and mark the path of the cue ball with a pool ball. Shoot the shot again and if the cue ball strikes the first ball then this becomes your path (if the cue ball misses the first ball keep shooting until the cue ball strikes one of the path balls). Mark this path with one pool ball - this is the target you need to strike on every shot.\n\nC. This the cue ball clock you'll be using for reference when you're shooting a shot that's not straight in. Start with center high then work your way around the cue ball. After high left you'll then go to center, then slightly below center.\n\nD. This red line represents a straight in shot. You'll be using the red line cue ball graphic for reference.\n\nE. When you see spaces between cue balls (represented by transparent cue balls) this is the distance you'll be placing the next cue ball. For instance, in this example the next cue ball is one pool ball away from the first cue ball.\n\nF. Shoot the shot 7 times successfully before moving on to the next spot on the cue ball clock. If you don't pocket one of your shots then start your run over from zero.\n\nWhen you finish each level, start over but this time reverse each layout:",
  4: "A. When the cue ball and object ball are on a straight line to the pocket, this is the cue ball graphic that displays how you'll be hitting the cue ball (in this case you'll be using center high and center low).\n\nB. When you first set up a shot (not straight in) you shoot the shot at least twice to determine the path of the cue ball. For example, shoot the shot with center high and mark the spot the cue ball stops at with a sticker. Shoot the shot again and if the cue ball ends up within the same area (within two pool balls) then mark this location with four stickers. If your next shot ends up in a different area then mark that area with a sticker. Keep shooting this shot until you get two cue balls ending in the same area, then this becomes your area target\n\nC. This the cue ball clock you'll be using for reference when you're shooting a shot that's not straight in. Start with center high then work your way around the cue ball. After high left you'll then go to center, then slightly below center.\n\nD. This red line represents a straight in shot. You'll be using the red line cue ball graphic for reference.\n\nE. When you see spaces between cue balls (represented by transparent cue balls) this is the distance you'll be placing the next cue ball. For instance, in this example the next cue ball is two pool balls away from the first cue ball.\n\nF. Shoot the shot 10 times successfully before moving on to the next spot on the cue ball clock. If you don't pocket one of your shots then start your run over from zero.\n\nWhen you finish each level, start over but this time reverse each layout:",
  5: "A. When the cue ball and object ball are on a straight line to the pocket, this is the cue ball graphic that displays how you'll be hitting the cue ball (in this case you'll be using center high, center, and center low).\n\nB. When you first set up a shot (not straight in) you shoot the shot at least twice to determine the path of the cue ball. For example, shoot the shot with center high and mark the spot the cue ball stops at with a sticker. Shoot the shot again and if the cue ball ends up within the same area (within two pool balls) then mark this location with four stickers. If your next shot ends up in a different area then mark that area with a sticker. Keep shooting this shot until you get two cue balls ending in the same area, then this becomes your area target\n\nC. This the cue ball clock you'll be using for reference when you're shooting a shot that's not straight in. Start with center high then work your way around the cue ball. After high left you'll then go to center, then slightly below center.\n\nD. This red line represents a straight in shot. You'll be using the red line cue ball graphic for reference.\n\nE. When you see spaces between cue balls (represented by transparent cue balls) this is the distance you'll be placing the next cue ball. For instance, in this example the next cue ball is one pool ball away from the first cue ball.\n\nF. Shoot the shot 20 times successfully before moving on to the next spot on the cue ball clock. If you don't pocket one of your shots then start your run over from zero.\n\nWhen you finish each level, start over but this time reverse each layout:"
};

const PAGE = {
  1: { shots: 'SHOTS: 5X - ALLOWED TO MISS', attempts: 5, count: 9 },
  2: { shots: 'SHOTS: 5X - MISS: START OVER', attempts: 5, count: 10 },
  3: { shots: 'SHOTS: 7X - MISS: START OVER', attempts: 7, count: 11 },
  4: { shots: 'SHOTS: 10X - MISS: START OVER', attempts: 10, count: 16 },
  5: { shots: 'SHOTS: 20X - MISS: START OVER', attempts: 20, count: 16 }
};

const DRILLS = BALL_POCKET_LEVELS.flatMap((level) => {
  const page = PAGE[level];
  return Array.from({ length: page.count }, (_, i) => ({
    id: `bp-l${level}-${i + 1}`,
    name: String(i + 1),
    level,
    attempts: page.attempts,
    shots: page.shots
  }));
});

export const BALL_POCKET_ORDER = DRILLS.map((d) => d.id);
const BY_ID = Object.fromEntries(DRILLS.map((d) => [d.id, d]));

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function isBallPocketPdfId(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); }

/** Words on the drill page, then the level's printed how-to. */
export function ballPocketPrint(id) {
  const d = BY_ID[id];
  if (!d) return '';
  const head = `LEVEL ${d.level}\nTARGET:\n${d.shots}\n(red line represents straight in shot)`;
  return `${head}\n\n${BALL_POCKET_TEXT[d.level] || ''}`;
}

/** Current level is the first level that is not all bronze-or-better. Level 5 stays current once it is open. */
export function ballPocketStatus(state) {
  const list = ballPocketDrills();
  const passed = (id) => !!state?.games?.drills?.stages?.[id]?.passed;
  const visible = (lv) => list.filter((d) => d.level === lv && !isDrillHidden(d.id));
  let current = 1;
  let complete = true;
  for (const lv of BALL_POCKET_LEVELS) {
    const rows = visible(lv);
    if (!rows.length || rows.every((d) => passed(d.id))) continue;
    current = lv;
    complete = false;
    break;
  }
  if (complete) current = BALL_POCKET_LEVELS[BALL_POCKET_LEVELS.length - 1];
  const rows = visible(current);
  const done = rows.filter((d) => passed(d.id)).length;
  return { current, done, total: rows.length, complete };
}

export function ballPocketDrills() {
  return DRILLS.map((d) => {
    const text = ballPocketPrint(d.id);
    return {
      id: d.id,
      name: d.name,
      levelLabel: `LEVEL ${d.level}`,
      category: 'Ball Pocketing',
      difficulty: d.level,
      level: d.level,
      game: 'drills',
      isDrill: true,
      kind: 'pot',
      pdfTable: `./images/ball-pocket/${d.id}.jpg`,
      pdfHowto: `./images/ball-pocket/howto-l${d.level}.jpg`,
      targetBall: 1,
      attemptCount: d.attempts,
      scoringRules: { mode: 'binary', attempts: d.attempts, pass: { made: 0 } },
      passingRequirement: { made: 0 },
      skillEffects: { 'Shot Making': 1 },
      xp: 40,
      goal: d.shots,
      description: text,
      instructions: text,
      prerequisites: []
    };
  });
}

function courseIds() {
  return BALL_POCKET_ORDER.filter((id) => !isDrillHidden(id));
}

/** Profile row. Null until one PDF drill has a saved session. No Career XP. */
export function ballPocketCourseRow(state) {
  const stages = state?.games?.drills?.stages || {};
  const ids = courseIds();
  const touched = ids.filter((id) => {
    const s = stages[id];
    return !!(s && ((s.tries || 0) > 0 || (s.history || []).length));
  });
  if (!touched.length) return null;
  const done = ids.filter((id) => stages[id]?.passed).length;
  return {
    id: 'ballPocket',
    name: BALL_POCKET_NAME,
    href: '#bpset',
    short: BALL_POCKET_NAME,
    done,
    total: ids.length,
    finished: ids.length > 0 && done === ids.length
  };
}

export function ballPocketBannerHTML() {
  return `<button type="button" class="card simPromo buEntry" data-action="go" data-href="#bpset" data-bp-course="1"><span class="simPromoText"><span class="eyebrow">DRILL SET</span><b>${BALL_POCKET_NAME}</b><small>${BALL_POCKET_ORDER.length} drills in PDF order. Only these drills. Not on the All list. Not the rank ladder.</small></span><span class="simPromoGo">›</span></button>`;
}

export function ballPocketPageHTML(state) {
  const stages = state?.games?.drills?.stages || {};
  const ids = courseIds();
  const nDone = ids.filter((id) => stages[id]?.passed).length;
  let last = 0;
  const rows = ids.map((id, i) => {
    const d = BY_ID[id];
    let head = '';
    if (d.level !== last) {
      last = d.level;
      head = `<h2 class="smSec">LEVEL ${d.level}</h2>`;
    }
    const sc = stages[id];
    const mark = sc?.passed ? ' · done' : '';
    return `${head}<button type="button" class="stageRow card" data-action="go" data-href="#play/drills/${d.id}/set" data-bp-drill="${d.id}"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>LEVEL ${d.level} · ${esc(d.shots)}${mark}</small></span></button>`;
  }).join('');
  const row = ballPocketCourseRow(state);
  const done = row?.finished
    ? `<p class="green">Completed ${BALL_POCKET_NAME}.</p>`
    : `<p class="muted">These are the PDF drills, in order. Saved drills from this category are not in this list. This list does not use the rank ladder.</p><p class="muted small">${nDone} of ${ids.length} passed.</p>`;
  const first = ids[0] || BALL_POCKET_ORDER[0];
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#courses">‹ Drill Sets &amp; Exams</button><span class="eyebrow">DRILL SET</span><h1>${BALL_POCKET_NAME}</h1><p>${ids.length} drills from the manual, in PDF order.</p></div>
    <div class="card">${done}<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${first}/set">START AT THE FIRST DRILL</button></div>
    <div class="stageList" data-bp-list="1">${rows}</div>`;
}
