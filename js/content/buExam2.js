/**
 * Billiard University Exam II – Skills, Bachelors and Doctorate (Dr. Dave).
 * Two separate courses, ten drills each (S1–S10). S3 and S4 are one drill with three layouts.
 * Diagrams are cropped table photos in images/bu/. Career Rank XP is never awarded.
 * Exam completion is stored on state.buExamSkillsB / state.buExamSkillsD, not on state.buExam
 * (Exam I). Opening a drill, or playing it from its category, does not finish the exam.
 * Source: Billiard University / Dr. Dave, billiarduniversity.org. No BU logo.
 */
import { challengeFromPkfDoc } from './pkfBuiltins.js';
import { validatePooliq } from './schema.js';

export const SKILLS_CREDIT = 'Billiard University / Dr. Dave — billiarduniversity.org';

const B_ORDER = ['bu-bs1','bu-bs2','bu-bs3','bu-bs4','bu-bs5','bu-bs6','bu-bs7','bu-bs8','bu-bs9','bu-bs10'];
const D_ORDER = ['bu-ds1','bu-ds2','bu-ds3','bu-ds4','bu-ds5','bu-ds6','bu-ds7','bu-ds8','bu-ds9','bu-ds10'];

export const SKILLS_EXAMS = {
  bachelors: {
    level: 'bachelors',
    name: 'Exam II – Skills, Bachelors',
    order: B_ORDER,
    stateKey: 'buExamSkillsB',
    href: '#buexam/bachelors',
    start: 'bu-bs1'
  },
  doctorate: {
    level: 'doctorate',
    name: 'Exam II – Skills, Doctorate',
    order: D_ORDER,
    stateKey: 'buExamSkillsD',
    href: '#buexam/doctorate',
    start: 'bu-ds1'
  }
};

/** Bank drills that must stay visible while the Banks category remains shelved for old PKF drills. */
export const SKILLS_BANK_IDS = ['bu-bs7', 'bu-ds7'];

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function bullet(s) { return `• ${s}`; }

const S1 = `Instructions:
${bullet('Pocket the balls in rotation (i.e., in numerical order) in any pockets without scratching or contacting any of the remaining balls.')}
${bullet('If you disturb a ball while pocketing one, the one pocketed counts, but the run ends.')}
${bullet('Shoot the drill twice and use the higher score of the two attempts.')}`;

const S2 = `Instructions:
${bullet('Do the drill twice, shooting the balls in any order, and use the higher score of the two attempts.')}
${bullet('You are not allowed to scratch, shoot combinations, or disturb any of the remaining balls.')}`;

const S3_COMMON = `Instructions:
${bullet('Attempt and score all three layouts. Then add the two lowest scores.')}
${bullet('You receive 1 point for each ball pocketed legally (w/o scratching) under 9-ball “rotation” rules, always hitting the lowest-numbered ball first.')}
${bullet('If the 9-ball is pocketed early (e.g., with a combo or carom shot), you must still pocket the remaining balls in rotation.')}`;

const S3_DOC_L3 = `${bullet('You must get shape on the 7 and 9 by going off three or four rails from the 6 and 8. If you don’t go off three or four rails, the run stops but you get credit if the 6 or 8 is pocketed.')}`;

const S4 = `Instructions:
${bullet('Attempt and score all three layouts. Then add the two lowest scores.')}
${bullet('You receive 1 point for each ball pocketed legally (w/o scratching) before a miss.')}
${bullet('You are allowed to contact the obstacle balls.')}`;

const S5 = `Instructions:
${bullet('Take two attempts from each CB position, getting 1 point for each successful snooker, where the OB is hidden from the CB with no direct path of contact between the balls.')}
${bullet('The 1 ball may not be pocketed.')}
${bullet('You are allowed to contact the balls in the obstacle cluster, but all of them must remain within or overlapping the target.')}
${bullet('The rectangular target can be printed and cut out from a template on the website. It is an 8.5”x11” sheet of paper with the center removed, leaving a 1” border.')}`;

const S6B = `Instructions:
${bullet('Kick at each OB off the same long rail (as shown), with the CB in the same starting position for each kick, getting 1 point for each successful and legal shot (i.e., no scratch, ball to rail).')}`;

const S6D = `Instructions:
${bullet('Shots 1-4: Kick at each OB off the same long rail (as shown), with the CB in the same starting position for each kick, getting 1 point for each successful and legal shot (i.e., no scratch, ball to rail).')}
${bullet('Shots 5,6: With CB in hand on each shot, kick off any two rails at the 1 ball and the 3 ball.')}
${bullet('Shot 7: With CB in hand, kick off any three rails at the 2 ball.')}`;

const S7D = `Instructions:
${bullet('Bank the OB cross corner from each of the 7 CB positions.')}
${bullet('You receive 1 point for each bank pocketed legally (w/o scratching).')}`;

const S7B = `Instructions:
${bullet('With CB in hand for each shot, bank each ball cross side.')}
${bullet('You receive 1 point for each bank pocketed legally (w/o scratching).')}`;

const S8 = `Instructions:
${bullet('Pocket each OB from the indicated CB position without scratching.')}`;

const S9D = `Instructions:
${bullet('You get 1 point for each successful shot (CB pocketed, no obstacle-ball contact) of 7 attempts.')}
${bullet('You should try both types of shots during practice, and use your most reliable skill during the exam.')}`;

const S9B = `Instructions:
${bullet('You get 1 point for each successful shot (OB pocketed, no obstacle-ball contact) of 3 attempts.')}
${bullet('You are allowed to scratch.')}
${bullet('You should try both types of shots during practice, and use your most reliable skill during the exam.')}`;

const S10_BODY = `Instructions:
${bullet('Break three times and score each break, awarding 1 point for each of the following:')}
a.) no scratch.
b.) no scratch, and the CB not driven to a cushion.
c.) no scratch, and the center of the CB remains within the center 4-diamond target zone during the entire break.
d.) no scratch and 1 or more balls pocketed.
e.) no scratch and 3 or more OBs either pocketed and/or driven above the head string.`;

const S10_SCORE = `score = median # of points (middle value) of the three individual rack scores (5 max)`;

export const S10_CHECKS = [
  'a.) no scratch.',
  'b.) no scratch, and the CB not driven to a cushion.',
  'c.) no scratch, and the center of the CB remains within the center 4-diamond target zone during the entire break.',
  'd.) no scratch and 1 or more balls pocketed.',
  'e.) no scratch and 3 or more OBs either pocketed and/or driven above the head string.'
];

function scoreLine(s) { return `\n\n${s}`; }

const TEXT = {
  'bu-bs1': `${S1}${scoreLine('score = # of balls pocketed legally (without a scratch) before a miss or ball contact (4 max)')}`,
  'bu-ds1': `${S1}${scoreLine('score = # of balls pocketed legally (without a scratch) before a miss or ball contact (10 max)')}`,
  'bu-bs2': `${S2}${scoreLine('score = # of balls pocketed legally (without a scratch) before a miss or ball contact (7 max)')}`,
  'bu-ds2': `${S2}${scoreLine('score = # of balls pocketed legally (without a scratch) before a miss or ball contact (15 max)')}`,
  'bu-bs3': `${S3_COMMON}${scoreLine('score = lowest score + 2nd lowest score (10 max)')}`,
  'bu-ds3': `${S3_COMMON}\nLayout 3:\n${S3_DOC_L3}${scoreLine('score = lowest score + 2nd lowest score (14 max)')}`,
  'bu-bs4': `${S4}${scoreLine('score = lowest score + 2nd lowest score (10 max)')}`,
  'bu-ds4': `${S4}${scoreLine('score = lowest score + 2nd lowest score (14 max)')}`,
  'bu-bs5': `${S5}${scoreLine('score = # of successful attempts (6 max)')}`,
  'bu-ds5': `${S5}${scoreLine('score = # of successful attempts (14 max)')}`,
  'bu-bs6': `${S6B}${scoreLine('score = # of successful kicks (3 max)')}`,
  'bu-ds6': `${S6D}${scoreLine('score = # of successful kicks (7 max)')}`,
  'bu-bs7': `${S7B}${scoreLine('score = # of successful banks (3 max)')}`,
  'bu-ds7': `${S7D}${scoreLine('score = # of successful banks (7 max)')}`,
  'bu-bs8': `${S8}${scoreLine('score = # of successful shots (3 max)')}`,
  'bu-ds8': `${S8}${scoreLine('score = # of successful shots (7 max)')}`,
  'bu-bs9': `${S9B}${scoreLine('score = # of successful attempts (3 max)')}`,
  'bu-ds9': `${S9D}${scoreLine('score = # of successful attempts (7 max)')}`,
  'bu-bs10': `${S10_BODY}\n${bullet('Throw out the best and worst scores of the three breaks.')}${scoreLine(S10_SCORE)}`,
  'bu-ds10': `${S10_BODY}\n${bullet('Throw out the best and worst scores of the three individual break scores.')}${scoreLine(S10_SCORE)}`
};

export function skillsText(id) { return TEXT[id] || ''; }

const CAT = {
  1: 'Shot Making',
  2: 'Cut Shots',
  3: 'Pattern Play',
  4: 'Pattern Play',
  5: 'Safeties',
  6: 'Kicks',
  7: 'Banks',
  8: 'Shot Making',
  9: 'Shot Making',
  10: 'Shot Making'
};

const NAMES = {
  1: 'S1 – Line of Balls Drill',
  2: 'S2 – Rail Cut Shot Drill',
  3: 'S3 – 9-Ball Pattern Drills',
  4: 'S4 – 8-Ball Pattern Drills',
  5: 'S5 – Hide-Behind-Target Safety Drill',
  6: 'S6 – Kick Shot Drill',
  7: 'S7 – Bank Shot Drill',
  8: 'S8 – Elevated Cue Drill',
  9: 'S9 – Jump or Massé Drill',
  10: 'S10 – Break Drill'
};

function spec(level, n) {
  const prefix = level === 'bachelors' ? 'bu-bs' : 'bu-ds';
  const id = `${prefix}${n}`;
  const doc = level === 'doctorate';
  const base = {
    id, n, level,
    category: CAT[n],
    name: `${NAMES[n]} (${doc ? 'Doctorate' : 'Bachelors'})`,
    buttons: ['POCKETED', 'MISS']
  };
  if (n === 1) return { ...base, kind: 'best2', max: doc ? 10 : 4, buttons: ['POCKETED', 'MISS OR CONTACT'] };
  if (n === 2) return { ...base, kind: 'best2', max: doc ? 15 : 7, buttons: ['POCKETED', 'MISS OR CONTACT'] };
  if (n === 3) return { ...base, kind: 'twoLow', max: doc ? 14 : 10, per: 9, layouts: 3 };
  if (n === 4) return { ...base, kind: 'twoLow', max: doc ? 14 : 10, per: 9, layouts: 3 };
  if (n === 5) return { ...base, kind: 'hits', max: doc ? 14 : 6, attempts: doc ? 14 : 6, pair: 2, positions: doc ? 7 : 3, buttons: ['SNOOKER', 'MISS'] };
  if (n === 6) return { ...base, kind: 'hits', max: doc ? 7 : 3, attempts: doc ? 7 : 3, buttons: ['LEGAL KICK', 'MISS'] };
  if (n === 7) return { ...base, kind: 'hits', max: doc ? 7 : 3, attempts: doc ? 7 : 3, buttons: ['BANKED', 'MISS OR SCRATCH'] };
  if (n === 8) return { ...base, kind: 'hits', max: doc ? 7 : 3, attempts: doc ? 7 : 3, buttons: ['POCKETED', 'MISS OR SCRATCH'] };
  if (n === 9) return { ...base, kind: 'hits', max: doc ? 7 : 3, attempts: doc ? 7 : 3, buttons: ['SUCCESS', 'MISS'] };
  return { ...base, kind: 'median3', max: 5, attempts: 3, buttons: [] };
}

const SPECS = {};
for (const level of ['bachelors', 'doctorate']) {
  for (let n = 1; n <= 10; n++) {
    const s = spec(level, n);
    SPECS[s.id] = s;
  }
}

export function isSkillsId(id) { return Object.prototype.hasOwnProperty.call(SPECS, id); }
export function skillsMeta(id) {
  const s = SPECS[id];
  if (!s) return null;
  const order = SKILLS_EXAMS[s.level].order;
  const i = order.indexOf(id);
  return { ...s, index: i, next: i >= 0 && i < order.length - 1 ? order[i + 1] : null, exam: SKILLS_EXAMS[s.level] };
}

export function skillsImages(id) {
  if (/^bu-[bd]s[34]$/.test(id)) return [1, 2, 3].map((n) => `./images/bu/${id}-${n}.png`);
  return [`./images/bu/${id}.png`];
}

function docFor(s) {
  const text = TEXT[s.id];
  const goal = text.split('\n\n').pop().slice(0, 240);
  return {
    format: 'pooliq',
    schemaVersion: '1.0',
    contentType: 'drill',
    id: s.id,
    contentVersion: '1.0',
    title: s.name,
    description: goal,
    category: s.category,
    difficulty: 2,
    skill: ['Cut Shots'].includes(s.category) ? 'Shot Making' : s.category,
    rankXpEligible: false,
    attribution: { sourceName: 'Billiard University', author: 'Dr. Dave', sourceURL: 'https://billiarduniversity.org' },
    shot: {
      kind: 'pot',
      speed: 2,
      cueContact: { vTips: 0, hTips: 0 },
      cueBallPosition: { x: 25, y: 12.5 },
      ballPositions: [{ n: 1, x: 75, y: 25 }],
      targetBall: 1,
      instructions: text.slice(0, 1500),
      goal
    },
    scoringRules: { mode: 'binary', attempts: s.attempts || (s.kind === 'twoLow' ? 3 : 2), pass: { made: 1 } },
    xp: 0,
    skillEffects: { [['Cut Shots'].includes(s.category) ? 'Shot Making' : s.category]: 1 }
  };
}

let docsCache = null;
export function buSkillsDocs() {
  if (!docsCache) {
    docsCache = Object.values(SPECS).map(docFor);
    for (const d of docsCache) {
      const v = validatePooliq(JSON.stringify(d));
      if (!v.ok) throw new Error(`BU skills ${d.id}: ${v.errors.join(' | ')}`);
    }
  }
  return docsCache;
}

let drillsCache = null;
export function buSkillsDrills() {
  if (!drillsCache) {
    drillsCache = buSkillsDocs().map((raw) => {
      const v = validatePooliq(JSON.stringify(raw));
      const ch = challengeFromPkfDoc(v.doc);
      delete ch.level;
      delete ch.speed;
      const meta = skillsMeta(ch.id);
      ch.buExam = true;
      ch.buSkills = meta.level;
      ch.xp = 0;
      ch.pq = { rankXpEligible: false };
      ch.prerequisites = [];
      ch.credit = SKILLS_CREDIT;
      ch.instructions = TEXT[ch.id];
      ch.layouts = skillsImages(ch.id);
      ch.goal = raw.description;
      return ch;
    });
  }
  return drillsCache;
}

export function newSkillsRun(id) {
  return { step: 0, tally: 0, values: [], checks: [0, 0, 0, 0, 0], done: false, score: null, shots: 0, log: [] };
}

function finishBest(next, meta) {
  const need = meta.kind === 'best2' ? 2 : 3;
  if (next.values.length < need) return;
  next.done = true;
  if (meta.kind === 'best2') next.score = Math.max(...next.values);
  else {
    const s = [...next.values].sort((a, b) => a - b);
    next.score = Math.min(meta.max, s[0] + s[1]);
  }
}

export function skillsApply(id, run, action) {
  const meta = skillsMeta(id);
  const next = { ...run, values: run.values.slice(), checks: run.checks.slice(), log: run.log.slice() };
  if (next.done || !meta) return next;
  if (meta.kind === 'median3') {
    if (action.type === 'box') {
      const i = action.i;
      if (i < 0 || i > 4) return next;
      next.checks[i] = next.checks[i] ? 0 : 1;
      next.log.push({ type: 'box', i });
      return next;
    }
    if (action.type === 'break') {
      const pts = next.checks.reduce((a, b) => a + b, 0);
      next.values.push(pts);
      next.checks = [0, 0, 0, 0, 0];
      next.shots += 1;
      next.log.push({ type: 'break' });
      if (next.values.length >= 3) {
        const s = [...next.values].sort((a, b) => a - b);
        next.score = s[1];
        next.done = true;
      }
      return next;
    }
    return next;
  }
  if (meta.kind === 'best2' || meta.kind === 'twoLow') {
    const cap = meta.kind === 'best2' ? meta.max : meta.per;
    if (action.ok) {
      next.tally += 1;
      next.shots += 1;
      next.log.push({ type: 'hit', ok: 1 });
      if (next.tally >= cap) {
        next.values.push(next.tally);
        next.tally = 0;
        next.step += 1;
        finishBest(next, meta);
      }
    } else {
      next.shots += 1;
      next.log.push({ type: 'hit', ok: 0 });
      next.values.push(next.tally);
      next.tally = 0;
      next.step += 1;
      finishBest(next, meta);
    }
    return next;
  }
  next.shots += 1;
  if (action.ok) next.tally += 1;
  next.log.push({ type: 'hit', ok: action.ok ? 1 : 0 });
  next.step += 1;
  if (next.step >= meta.attempts) {
    next.done = true;
    next.score = next.tally;
  }
  return next;
}

export function undoSkills(id, run) {
  if (!run?.log?.length) return newSkillsRun(id);
  const log = run.log.slice(0, -1);
  let cur = newSkillsRun(id);
  for (const step of log) {
    if (step.type === 'box') cur = skillsApply(id, cur, { type: 'box', i: step.i });
    else if (step.type === 'break') cur = skillsApply(id, cur, { type: 'break' });
    else cur = skillsApply(id, cur, { type: 'hit', ok: !!step.ok });
  }
  return cur;
}

export function skillsButtons(id) {
  return skillsMeta(id)?.buttons || ['SUCCESS', 'MISS'];
}

export function skillsStatus(id, run) {
  const m = skillsMeta(id);
  if (!m) return '';
  if (run.done) {
    if (m.kind === 'best2') return `Higher score ${run.score} / ${m.max} (attempts ${run.values.join(' and ')})`;
    if (m.kind === 'twoLow') {
      const s = [...run.values].sort((a, b) => a - b);
      return `Two lowest ${s[0]} + ${s[1]} = ${run.score} / ${m.max}`;
    }
    if (m.kind === 'median3') {
      const s = [...run.values].sort((a, b) => a - b);
      return `Breaks ${run.values.join(', ')} · median ${run.score} / ${m.max}`;
    }
    return `Score ${run.score} / ${m.max}`;
  }
  if (m.kind === 'best2') {
    const prev = run.values.length ? ` · attempt ${run.values.length} scored ${run.values[run.values.length - 1]}` : '';
    return `Attempt ${run.values.length + 1} of 2 · balls this attempt ${run.tally}${prev}`;
  }
  if (m.kind === 'twoLow') {
    const done = run.values.length ? ` · layouts scored ${run.values.join(', ')}` : '';
    return `Layout ${Math.min(run.step + 1, 3)} of 3 · balls this layout ${run.tally}${done}`;
  }
  if (m.kind === 'median3') {
    const on = run.checks.reduce((a, b) => a + b, 0);
    return `Break ${run.values.length + 1} of 3 · points checked ${on}${run.values.length ? ` · scored ${run.values.join(', ')}` : ''}`;
  }
  if (m.pair) {
    const pos = Math.floor(run.step / m.pair) + 1;
    const att = (run.step % m.pair) + 1;
    return `CB position ${pos} of ${m.positions} · attempt ${att} of ${m.pair} · successful ${run.tally}`;
  }
  if (m.n === 6 && m.level === 'doctorate') {
    const labels = [
      'same CB, one long rail',
      'same CB, one long rail',
      'same CB, one long rail',
      'same CB, one long rail',
      '1 ball, any two rails, CB in hand',
      '3 ball, any two rails, CB in hand',
      '2 ball, any three rails, CB in hand'
    ];
    return `Shot ${run.step + 1} of 7 · ${labels[run.step] || ''} · successful ${run.tally}`;
  }
  if (m.n === 7 && m.level === 'doctorate') return `CB position ${run.step + 1} of 7 · successful ${run.tally}`;
  if (m.n === 7) return `Ball ${run.step + 1} of 3 · successful ${run.tally}`;
  return `Shot ${run.step + 1} of ${m.attempts} · successful ${run.tally}`;
}

function emptyExam() { return { scores: {}, completed: null }; }
export function skillsExamOf(state, level) {
  const key = SKILLS_EXAMS[level]?.stateKey;
  const e = key ? state?.[key] : null;
  if (!e || typeof e !== 'object') return emptyExam();
  return { scores: { ...(e.scores || {}) }, completed: e.completed || null };
}

export function withSkillsScore(state, id, score, max) {
  const meta = skillsMeta(id);
  if (!meta) return state;
  const key = meta.exam.stateKey;
  const e = skillsExamOf(state, meta.level);
  const prev = e.scores[id];
  e.scores[id] = { score, max, at: new Date().toISOString(), ...(prev && prev.score > score ? { best: prev.score } : {}) };
  if (prev && prev.score > score) e.scores[id].score = prev.score;
  const done = meta.exam.order.every((k) => e.scores[k] && Number.isFinite(e.scores[k].score));
  if (done) {
    e.completed = {
      name: meta.exam.name,
      at: e.completed?.at || new Date().toISOString(),
      credit: SKILLS_CREDIT,
      scores: meta.exam.order.map((k) => ({ id: k, score: e.scores[k].score, max: e.scores[k].max }))
    };
  }
  return { ...state, [key]: e };
}

export function skillsAccomplishmentHTML(state) {
  return ['bachelors', 'doctorate'].map((level) => {
    const exam = SKILLS_EXAMS[level];
    const e = skillsExamOf(state, level);
    if (!e.completed) return '';
    const rows = e.completed.scores.map((s) => {
      const n = skillsMeta(s.id)?.n;
      return `<span>S${n} ${s.score}/${s.max}</span>`;
    }).join('');
    const total = e.completed.scores.reduce((a, s) => a + s.score, 0);
    const max = e.completed.scores.reduce((a, s) => a + s.max, 0);
    return `<div class="card" data-bu-exam="done" data-skills-exam="${level}"><div class="eyebrow">BILLIARD UNIVERSITY</div><h3>${esc(exam.name)}</h3><p>Completed. ${total} / ${max}</p><p class="muted small buScores">${rows}</p><small class="muted credit">${esc(SKILLS_CREDIT)}</small></div>`;
  }).join('');
}

export function skillsExamPageHTML(state, level) {
  const exam = SKILLS_EXAMS[level];
  if (!exam) return '';
  const e = skillsExamOf(state, level);
  const rows = exam.order.map((id, i) => {
    const d = buSkillsDrills().find((x) => x.id === id);
    const sc = e.scores[id];
    const cat = String(d.category || '').replace(/^\s*PKF\b[\s·:\-–—]*/i, '');
    return `<button type="button" class="stageRow card" data-action="go" data-href="#play/drills/${id}/exam"><span class="srNum">${i + 1}</span><span class="srMain"><b>${esc(d.name)}</b><small>${esc(cat)}${sc ? ` · exam ${sc.score}/${sc.max}` : ''}</small></span></button>`;
  }).join('');
  const done = e.completed
    ? `<p class="green">Completed ${esc(exam.name)}. Scores stay in your profile.</p>`
    : '<p class="muted">Finish all ten under this exam’s rules to record the accomplishment. Opening a drill is not enough. Playing a drill from its category does not count. This does not change Career rank or Ball Pocketing level.</p>';
  return `<div class="title"><button type="button" class="linkish back" data-action="go" data-href="#drills">‹ Drills</button><span class="eyebrow">BILLIARD UNIVERSITY</span><h1>${esc(exam.name)}</h1><p>Dr. Dave’s Exam II. Ten drills, S1 through S10, in order. S3 and S4 each include three layouts. ${esc(SKILLS_CREDIT)}</p></div>
    <div class="card">${done}<button type="button" class="bigBtn" data-action="go" data-href="#play/drills/${exam.start}/exam">START AT S1</button></div>
    <div class="stageList" data-bu-list="1" data-skills-exam="${level}">${rows}</div>`;
}

export function skillsBannersHTML() {
  return ['bachelors', 'doctorate'].map((level) => {
    const exam = SKILLS_EXAMS[level];
    return `<button type="button" class="card simPromo buEntry" data-action="go" data-href="${exam.href}" data-bu-entry="1" data-skills-exam="${level}"><span class="simPromoText"><span class="eyebrow">BILLIARD UNIVERSITY</span><b>${esc(exam.name)}</b><small>S1–S10 · Dr. Dave. Also in each drill’s category. Not a Career rank.</small></span><span class="simPromoGo">›</span></button>`;
  }).join('');
}
