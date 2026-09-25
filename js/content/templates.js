/**
 * Safe, data-driven game templates for .pooliq "game" content (pure — no DOM, no arbitrary logic).
 * A game is replayed from its event list, so undo = replay without the last event and results are deterministic.
 *
 *   events: { t: 'shot', ok: true|false, stars?: 0-3 }   one physical attempt (manual SUCCESS / MISS / stars)
 *           { t: 'quiz', ok: true|false }                quizExecution: answer locked for the current stage
 *
 * Templates
 *   gauntlet      lives ❤️; stages in order; success scores + advances; miss −1 life (retry 'repeat' stays, 'next' moves on);
 *                 clearing the last stage ends the run (or loops if rules.loop) + completion bonus (rules.stageBonus)
 *   lives         survive: every shot moves to the next stage (looping); miss −1 life; lives 0 → game over
 *   streak        one miss ends the run; score = consecutive successes (optional rules.shots cap)
 *   scoreAttack   fixed number of shots (rules.shots, default = stage count); points per success + streak bonus
 *   target        fixed number of shots scored by star rings: stars × pointsPerStar
 *   multiStage    each stage has attempts + pass (scoringRules); pass → next stage; fail → −1 life & retry, lives 0 → over
 *   quizExecution each stage: answer the quiz (quizPoints) then shoot it (pointsPerSuccess); optional lives
 */
import { RAIL_DIAMONDS, DEFAULT_TOLERANCE } from './schema.js';

const DEF = { lives: 3, pointsPerSuccess: 100, pointsPerStar: 50, stageBonus: 0, retry: 'repeat', loop: false, quizPoints: 50, order: 'listed', passScore: 0 };

export function gameRules(doc) {
  const t = doc.template;
  const src = doc.rules || {};
  const r = { ...DEF, ...src };
  const n = doc.stages.length;
  if (t === 'lives') { r.loop = src.loop ?? true; r.retry = 'next'; }
  if (t === 'streak') { r.lives = 1; r.loop = true; r.shots = src.shots ?? null; }
  if (t === 'scoreAttack' || t === 'target') { r.loop = true; r.shots = src.shots ?? n; r.lives = src.lives ?? null; }
  if (t === 'multiStage') { r.lives = src.lives ?? 1; r.loop = false; }
  if (t === 'quizExecution') { r.lives = src.lives ?? null; r.loop = false; }
  return r;
}

/** Stage play order (indices into doc.stages) — listed, or sorted by difficulty (stable) */
export function stageOrder(doc) {
  const idx = doc.stages.map((_, i) => i);
  if ((doc.rules?.order || 'listed') === 'difficulty') idx.sort((a, b) => (doc.stages[a].difficulty ?? 0) - (doc.stages[b].difficulty ?? 0) || a - b);
  return idx;
}

export function newGame(doc) {
  const rules = gameRules(doc);
  return {
    template: doc.template,
    rules,
    order: stageOrder(doc),
    pos: 0,
    round: 1,
    lives: rules.lives,
    livesTotal: rules.lives,
    score: 0,
    made: 0,
    missed: 0,
    streak: 0,
    longest: 0,
    shots: 0,
    stagesCleared: 0,
    stageReached: 1,
    stageMade: 0,
    stageTries: 0,
    quizCorrect: 0,
    phase: doc.template === 'quizExecution' ? 'quiz' : 'shot',
    over: false,
    won: false,
    reason: ''
  };
}

export function currentStage(doc, g) {
  return doc.stages[g.order[Math.min(g.pos, g.order.length - 1)]];
}

function end(g, won, reason) {
  g.over = true;
  g.won = won;
  g.reason = reason;
  g.phase = 'over';
}
function advance(doc, g) {
  g.pos += 1;
  g.stageMade = 0;
  g.stageTries = 0;
  if (g.pos >= g.order.length) {
    if (g.rules.loop) { g.pos = 0; g.round += 1; }
    else {
      g.pos = g.order.length - 1;
      g.score += g.rules.stageBonus || 0;
      end(g, true, 'cleared');
      return;
    }
  }
  g.stageReached = Math.max(g.stageReached, (g.round - 1) * g.order.length + g.pos + 1);
  if (g.template === 'quizExecution') g.phase = 'quiz';
}

/** Apply one event (mutates a copy; returns the new game state) */
export function applyEvent(doc, g0, ev) {
  const g = { ...g0 };
  if (g.over) return g;
  const R = g.rules;
  if (ev.t === 'quiz') {
    if (g.phase !== 'quiz') return g;
    if (ev.ok) { g.score += R.quizPoints; g.quizCorrect += 1; }
    g.phase = 'shot';
    return g;
  }
  if (ev.t !== 'shot' || g.phase !== 'shot') return g;
  const st = currentStage(doc, g);
  const stars = Math.max(0, Math.min(3, Number(ev.stars) || 0));
  const ok = g.template === 'target' ? stars > 0 : !!ev.ok;
  g.shots += 1;
  if (ok) {
    g.made += 1;
    g.streak += 1;
    g.longest = Math.max(g.longest, g.streak);
    g.score += g.template === 'target' ? stars * R.pointsPerStar : st.points ?? R.pointsPerSuccess;
    if (R.streakBonus && g.streak % R.streakBonus.every === 0) g.score += R.streakBonus.points;
  } else {
    g.missed += 1;
    g.streak = 0;
  }
  const loseLife = () => { if (g.lives != null) g.lives = Math.max(0, g.lives - 1); return g.lives === 0; };
  switch (g.template) {
    case 'gauntlet':
      if (ok) { g.stagesCleared += 1; advance(doc, g); }
      else if (loseLife()) end(g, false, 'lives');
      else if (R.retry === 'next') advance(doc, g);
      break;
    case 'lives':
      if (ok) g.stagesCleared += 1;
      if (!ok && loseLife()) end(g, false, 'lives');
      else advance(doc, g);
      break;
    case 'streak':
      if (!ok) end(g, g.longest > 0, 'miss');
      else { g.stagesCleared += 1; advance(doc, g); if (!g.over && R.shots && g.shots >= R.shots) end(g, true, 'shots'); }
      break;
    case 'scoreAttack':
    case 'target':
      if (ok) g.stagesCleared += 1;
      if (!ok && loseLife()) { end(g, false, 'lives'); break; }
      if (g.shots >= R.shots) end(g, g.score >= (R.passScore || 0), 'shots');
      else advance(doc, g);
      break;
    case 'multiStage': {
      const sr = st.scoringRules || { attempts: 1, pass: { made: 1 } };
      g.stageTries += 1;
      if (ok) g.stageMade += 1;
      const need = sr.pass.made ?? 1;
      if (g.stageMade >= need) { g.stagesCleared += 1; advance(doc, g); }
      else if (sr.attempts - g.stageTries < need - g.stageMade) {
        if (loseLife()) end(g, false, 'stage');
        else { g.stageMade = 0; g.stageTries = 0; }
      }
      break;
    }
    case 'quizExecution':
      if (ok) g.stagesCleared += 1;
      if (!ok && loseLife()) end(g, false, 'lives');
      else advance(doc, g);
      break;
    default:
      end(g, false, 'unsupported');
  }
  return g;
}

export function replayGame(doc, events) {
  let g = newGame(doc);
  for (const e of events || []) g = applyEvent(doc, g, e);
  return g;
}

/** GAME OVER numbers */
export function gameSummary(doc, g) {
  return { score: g.score, stageReached: g.stageReached, stages: doc.stages.length, round: g.round, successes: g.made, misses: g.missed, longestStreak: g.longest, shots: g.shots, won: g.won, reason: g.reason, lives: g.lives, quizCorrect: g.quizCorrect };
}

/** Header text for the current stage */
export function stageLabel(doc, g) {
  const n = doc.stages.length;
  if (g.template === 'scoreAttack' || g.template === 'target' || (g.template === 'streak' && g.rules.shots)) return `SHOT ${Math.min(g.shots + 1, g.rules.shots)} / ${g.rules.shots}`;
  if (g.template === 'lives' || g.template === 'streak') return `SHOT ${g.shots + 1}`;
  return `STAGE ${g.pos + 1} / ${n}${g.round > 1 ? ` · ROUND ${g.round}` : ''}`;
}

// ------------------------------------------------------------------ diamond / rail answer challenges
const snap = (v, step = 0.1) => Math.round(v / step) * step;
export const round1 = (v) => Math.round(v * 10) / 10;
/** Table point (from a tap) → nearest rail + diamond, snapped to 0.1 diamond */
export function tapToRail(x, y) {
  const d = { top: Math.abs(y), bottom: Math.abs(50 - y), left: Math.abs(x), right: Math.abs(100 - x) };
  const rail = Object.keys(d).reduce((a, b) => (d[b] < d[a] ? b : a));
  const along = rail === 'top' || rail === 'bottom' ? x : y;
  const diamond = round1(Math.max(0, Math.min(RAIL_DIAMONDS[rail], snap(along / 12.5))));
  return { rail, diamond };
}
/** Compare the player's rail answer to the file's recommended answer */
export function diamondVerdict(player, answer) {
  const tol = { ...DEFAULT_TOLERANCE, ...(answer.tolerance || {}) };
  if (!player || player.rail !== answer.rail) return { verdict: 'miss', diff: null, sameRail: false, tol };
  const diff = Math.round(Math.abs(player.diamond - answer.diamond) * 100) / 100;
  const verdict = diff <= tol.pass + 1e-9 ? 'pass' : diff <= tol.close + 1e-9 ? 'close' : 'miss';
  return { verdict, diff, sameRail: true, tol };
}
export const VERDICT_TEXT = { pass: 'PASS', close: 'CLOSE', miss: 'MISS' };
export const RAIL_WORDS = { top: 'Top rail', bottom: 'Bottom rail', left: 'Head rail (left)', right: 'Foot rail (right)' };
export function railAnswerText(a) {
  return a ? `${RAIL_WORDS[a.rail]} · ${round1(a.diamond).toFixed(1)}` : '—';
}

// ------------------------------------------------------------------ player-solution comparison
/** comparePlan() rows (coaching.js) filtered to what the content asks, plus a rail/diamond row */
export const ASK_ROW = { technique: 'technique', tip: 'contact', english: 'spin', speed: 'speed', rails: 'route' };
export function solutionRows(cmp, ask, railPick, answer) {
  const rows = cmp.rows.filter((r) => ask.some((a) => ASK_ROW[a] === r.field));
  if ((ask.includes('rail') || ask.includes('diamond')) && answer) {
    const v = diamondVerdict(railPick, answer);
    const d = v.diff != null ? ` (±${v.diff.toFixed(1)})` : '';
    rows.push({ field: 'diamond', label: ask.includes('diamond') ? 'Rail / diamond' : 'Rail', yours: railPick ? railAnswerText(railPick) : '—', poolIQ: railAnswerText(answer) + d, verdict: v.verdict === 'pass' ? 'match' : v.verdict === 'close' ? 'close' : 'different', why: answer.explanation || '' });
  }
  const score = rows.reduce((a, r) => a + (r.verdict === 'match' ? 2 : r.verdict === 'close' ? 1 : 0), 0);
  return { rows, score, max: rows.length * 2 };
}
