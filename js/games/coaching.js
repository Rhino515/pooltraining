/**
 * Progressive coaching. Level comes from the player's rating in the game's primary skill,
 * unless overridden in Settings. Controls what the play screen reveals and whether the
 * player must lock in their own plan before seeing Pool IQ's recipe.
 */
export const COACH_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
export const COACH_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

export function levelFromRating(r) {
  if (r < 35) return 'beginner';
  if (r < 60) return 'intermediate';
  if (r < 80) return 'advanced';
  return 'expert';
}

export function coachingLevel(state, game) {
  const o = state.settings?.coaching;
  if (o && o !== 'auto' && COACH_LEVELS.includes(o)) return o;
  const skill = game?.primarySkill;
  return levelFromRating(skill ? state.skills?.[skill] ?? 0 : 0);
}

/** What is visible for a challenge at a coaching level. planRevealed = the player locked an answer. */
export function visibility(level, ch, planRevealed = false) {
  const lagOrKick = ch && (ch.kind === 'lag' || ch.kind === 'kick');
  if (level === 'beginner' || planRevealed) return { cuePath: true, obPath: true, aim: true, zones: true, recipe: true, goalOnly: false, planner: false };
  if (level === 'intermediate') return { cuePath: false, obPath: true, aim: false, zones: true, recipe: true, goalOnly: false, planner: false };
  const goalOnly = level === 'expert' && !!ch?.expertGoal && ((ch.level || 0) % 2 === 0);
  return { cuePath: false, obPath: level === 'advanced' && !goalOnly, aim: false, zones: !goalOnly, recipe: false, goalOnly, planner: true };
}

export const TECHNIQUES = [
  { id: 'stop', label: 'Stop' },
  { id: 'stun', label: 'Stun' },
  { id: 'follow', label: 'Follow' },
  { id: 'draw', label: 'Draw' }
];
export const SPEED_CHOICES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5];
export const RAIL_CHOICES = [0, 1, 2, 3, 4];

export function techniqueGroup(t) {
  if (t === 'stun-run') return 'stun';
  if (t === 'stun-draw') return 'stun';
  if (t === 'lag' || t === 'kick') return 'stun';
  return t || 'stun';
}

/**
 * Compare a locked plan with Pool IQ's recipe.
 * plan: { technique, vTips, hTips, speed, rails }
 * returns [{field, label, yours, poolIQ, verdict: 'match'|'close'|'different', why}]
 */
export function comparePlan(plan, ch, fmt) {
  const why = ch.whyExplanation || {};
  const rows = [];
  const tech = techniqueGroup(ch.technique);
  const pt = plan.technique;
  const techClose = (a, b) => (a === 'stop' && b === 'stun') || (a === 'stun' && b === 'stop') || (ch.technique === 'stun-run' && a === 'follow') || (ch.technique === 'stun-draw' && a === 'draw');
  rows.push({ field: 'technique', label: 'Technique', yours: cap(pt), poolIQ: fmt.technique(ch.technique), verdict: pt === tech ? 'match' : techClose(pt, tech) ? 'close' : 'different', why: techniqueWhy(ch) });
  const dv = Math.abs((plan.vTips ?? 0) - (ch.cueContact?.vTips ?? 0));
  const dh = Math.abs((plan.hTips ?? 0) - (ch.cueContact?.hTips ?? 0));
  const d = Math.hypot(dv, dh);
  rows.push({ field: 'contact', label: 'Cue-ball contact', yours: fmt.contact(plan.vTips ?? 0, plan.hTips ?? 0), poolIQ: fmt.contact(ch.cueContact.vTips, ch.cueContact.hTips), verdict: d <= 0.3 ? 'match' : d <= 0.8 ? 'close' : 'different', why: why.whyContact });
  const eng = ch.english?.hTips || 0;
  const pe = plan.hTips || 0;
  rows.push({ field: 'spin', label: 'English', yours: fmt.english(pe), poolIQ: fmt.english(eng), verdict: Math.abs(pe - eng) <= 0.25 ? 'match' : Math.sign(pe) === Math.sign(eng) && eng !== 0 ? 'close' : 'different', why: why.whySpin });
  const ds = Math.abs((plan.speed ?? 0) - ch.speed);
  rows.push({ field: 'speed', label: 'Speed', yours: fmt.speed(plan.speed), poolIQ: fmt.speed(ch.speed), verdict: ds < 0.01 ? 'match' : ds <= 0.5 ? 'close' : 'different', why: why.whySpeed });
  const rr = ch.route?.rails ?? 0;
  const dr = Math.abs((plan.rails ?? 0) - rr);
  rows.push({ field: 'route', label: 'Route (rails)', yours: `${plan.rails ?? 0} rail${plan.rails === 1 ? '' : 's'}`, poolIQ: ch.route?.text || `${rr} rails`, verdict: dr === 0 ? 'match' : dr === 1 ? 'close' : 'different', why: why.whyRoute });
  const score = rows.reduce((a, r) => a + (r.verdict === 'match' ? 2 : r.verdict === 'close' ? 1 : 0), 0);
  return { rows, score, max: rows.length * 2 };
}

const TECH_WHY = {
  stop: 'A stop shot kills all forward motion on a full hit — the cue ball arrives sliding with no spin and parks where the object ball was.',
  stun: 'Stun means the cue ball arrives sliding (no top or back spin), so after contact it leaves exactly along the tangent line, 90° from the object ball’s path.',
  follow: 'Follow means the cue ball arrives rolling forward; after contact that topspin bends it forward of the tangent line toward the object ball’s direction.',
  draw: 'Draw means the cue ball arrives with backspin; after contact the spin pulls it back behind the tangent line toward the shooter.'
};

function techniqueWhy(ch) {
  const t = techniqueGroup(ch.technique);
  const base = ch.technique === 'stun-run' ? 'Stun-run-through: a trace of topspin, so the cue ball leaves just forward of the tangent line.' : ch.technique === 'stun-draw' ? 'Stun-draw: a trace of backspin, so the cue ball leaves just behind the tangent line.' : TECH_WHY[t] || '';
  const angle = ch.aim?.cutDeg != null ? ` Here the cut is about ${Math.round(ch.aim.cutDeg)}°.` : '';
  return base + angle;
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : '—';
}
