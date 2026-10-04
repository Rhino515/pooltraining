/**
 * Drill Sets & Exams progress for Profile, and the small completed line on Home.
 * Read-only. Progress comes from exam and course attempt state already saved
 * (Exam I, Skills exams, the other Billiard University exams, Safety Master).
 * No Career XP, rank names, or existing storage keys are changed.
 *
 * Ball Pocketing is a rank of its own. It is not a row on Drill Sets & Exams,
 * so it is not listed here.
 *
 * RDS (Exam IV) is included only when its stages exist (moreExams.moreMeta order).
 * A single 3-rack set is progress, not a finish. The emblem appears when every
 * level has been passed. If moreExams.rdsProgress is not exported yet, scored stages
 * still count, and the row appears as soon as those stages exist.
 */
import { BU_EXAM_NAME, BU_ORDER, examOf } from './buExam.js';
import { SKILLS_EXAMS, skillsExamOf } from './buExam2.js';
import * as moreExams from './buMore.js';
import { SAFETY_NAME, SAFETY_ORDER, safetyOf } from './safetyMaster.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Short gold marks. Distinct shape per set. Not a photo. */
const LOOK = {
  fundamentals: { short: 'Exam I', mark: 'round' },
  bachelors: { short: 'Bach.', mark: 'shield' },
  masters: { short: 'Mast.', mark: 'diamond' },
  doctorate: { short: 'Doct.', mark: 'hex' },
  advanced: { short: 'Adv.', mark: 'square' },
  rds: { short: 'RDS', mark: 'notch' },
  ppc: { short: 'Place', mark: 'tag' },
  safety: { short: 'Safe', mark: 'crest' },
  draw: { short: 'Draw', mark: 'pill' },
  follow: { short: 'Follow', mark: 'point' },
  safetyMaster: { short: 'S.Mast', mark: 'ribbon' }
};

const MARK_SVG = {
  round: '<circle cx="8" cy="8" r="5.2" fill="none" stroke="#f6c453" stroke-width="1.6"/>',
  shield: '<path d="M8 1.8 13.2 4v4.2c0 3.2-2.1 5.2-5.2 6.2C4.9 13.4 2.8 11.4 2.8 8.2V4Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  diamond: '<path d="M8 1.8 14 8 8 14.2 2 8Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  hex: '<path d="M8 1.6 13.4 4.6v6.8L8 14.4 2.6 11.4V4.6Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  square: '<rect x="2.4" y="2.4" width="11.2" height="11.2" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  notch: '<path d="M8 1.6 9.7 6h4.6l-3.7 2.8 1.4 4.6L8 10.6 4 13.4l1.4-4.6L1.7 6h4.6Z" fill="#f6c453"/>',
  tag: '<path d="M2.2 3.2h7.2L14 8l-4.6 4.8H2.2Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  crest: '<circle cx="8" cy="8" r="5.4" fill="none" stroke="#f6c453" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="#f6c453"/>',
  pill: '<rect x="1.6" y="4.2" width="12.8" height="7.6" rx="3.8" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  point: '<path d="M8 1.8 14.2 13.6H1.8Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>',
  ribbon: '<path d="M3 2h10v9.2L8 14.2 3 11.2Z" fill="none" stroke="#f6c453" stroke-width="1.4"/>'
};

function look(id, name) {
  if (LOOK[id]) return LOOK[id];
  const short = String(name || id).split(/[–—-]/)[0].trim().slice(0, 10) || String(id);
  return { short, mark: 'round' };
}

function hasScore(row) {
  return !!(row && Number.isFinite(Number(row.score)));
}

/** One started exam or course. Null when nothing has been scored. */
function fromScores({ id, name, href, order, scores }) {
  const ids = Array.isArray(order) ? order : [];
  const total = ids.length;
  if (!total) return null;
  const bag = scores && typeof scores === 'object' ? scores : {};
  const filled = ids.filter((k) => hasScore(bag[k])).length;
  if (!filled) return null;
  const done = ids.filter((k) => hasScore(bag[k]) && !bag[k].open).length;
  const { short, mark } = look(id, name);
  return { id, name, href, short, mark, done, total, finished: done === total };
}

function rdsRow(state, exam) {
  const meta = typeof moreExams.moreMeta === 'function' ? moreExams.moreMeta(exam.start) : null;
  const order = meta?.order || [];
  const total = order.length;
  if (!total) return null;
  const e = moreExams.moreExamOf(state, exam.key);
  const scores = e.scores || {};
  const hasSets = Array.isArray(e.sets) && e.sets.length > 0;
  const hasCols = Array.isArray(e.cols) && e.cols.length > 0;
  const hasScores = order.some((k) => hasScore(scores[k]));
  if (!hasSets && !hasCols && !hasScores) return null;
  let done = 0;
  if (typeof moreExams.rdsProgress === 'function') {
    const prog = moreExams.rdsProgress(e);
    const passed = prog?.passed;
    while (done < total && passed && passed.has(done + 1)) done += 1;
  } else {
    done = order.filter((k) => hasScore(scores[k]) && !scores[k].open).length;
  }
  const { short, mark } = look(exam.key, exam.name);
  return {
    id: exam.key,
    name: exam.name,
    href: exam.href,
    short,
    mark,
    done,
    total,
    finished: done >= total
  };
}

/** Started sets and exams, in Drill Sets & Exams order. */
export function readSetProgress(state) {
  const rows = [];
  const exam = examOf(state);
  const first = fromScores({
    id: 'fundamentals',
    name: BU_EXAM_NAME,
    href: '#buexam',
    order: BU_ORDER,
    scores: exam.scores
  });
  if (first) rows.push(first);
  for (const item of Object.values(SKILLS_EXAMS)) {
    const saved = skillsExamOf(state, item.level);
    const row = fromScores({
      id: item.level,
      name: item.name,
      href: item.href,
      order: item.order,
      scores: saved.scores
    });
    if (row) rows.push(row);
  }
  for (const item of Object.values(moreExams.MORE_EXAMS || {})) {
    if (item.key === 'rds') {
      const row = rdsRow(state, item);
      if (row) rows.push(row);
      continue;
    }
    const meta = typeof moreExams.moreMeta === 'function' ? moreExams.moreMeta(item.start) : null;
    const saved = moreExams.moreExamOf(state, item.key);
    const row = fromScores({
      id: item.key,
      name: item.name,
      href: item.href,
      order: meta?.order || [],
      scores: saved.scores
    });
    if (row) rows.push(row);
  }
  const safety = safetyOf(state);
  const course = fromScores({
    id: 'safetyMaster',
    name: SAFETY_NAME,
    href: '#safety',
    order: SAFETY_ORDER,
    scores: safety.scores
  });
  if (course) rows.push(course);
  return rows;
}

export function setEmblemHTML(row) {
  const svg = MARK_SVG[row.mark] || MARK_SVG.round;
  return `<span class="setEmblem" data-mark="${esc(row.mark)}" data-set-emblem="${esc(row.id)}" title="${esc(row.name)}"><svg viewBox="0 0 16 16" aria-hidden="true">${svg}</svg><b>${esc(row.short)}</b></span>`;
}

function meterHTML(row) {
  const pct = row.total ? Math.max(0, Math.min(100, Math.round((row.done / row.total) * 100))) : 0;
  return `<span class="setMeter"><span class="setBar" role="progressbar" aria-valuemin="0" aria-valuemax="${row.total}" aria-valuenow="${row.done}" aria-valuetext="${row.done} of ${row.total}"><span style="width:${pct}%"></span></span><small>${row.done} / ${row.total}</small></span>`;
}

/** Profile box. Always present. Rows only for sets or exams already started. */
export function setProgressBoxHTML(state) {
  const rows = readSetProgress(state);
  const body = rows.length
    ? rows.map((row) => `<button type="button" class="setProgRow${row.finished ? ' is-done' : ''}" data-set="${esc(row.id)}" data-set-done="${row.finished ? 1 : 0}" data-action="go" data-href="${esc(row.href)}"><span class="setName">${esc(row.name)}</span>${row.finished ? setEmblemHTML(row) : ''}${meterHTML(row)}</button>`).join('')
    : '<p class="muted small setNone">No set or exam started.</p>';
  return `<div class="card setProgressCard" data-set-progress><h3>Drill Sets &amp; Exams</h3>${body}</div>`;
}

/** Home ranks card only. Empty string until at least one set or exam is fully finished. */
export function completedSetsLineHTML(state) {
  const done = readSetProgress(state).filter((row) => row.finished);
  if (!done.length) return '';
  return `<span class="hrSets" data-set-emblems><span class="hrSetsLabel">Drill sets and exams completed</span><span class="hrSetsMarks">${done.map((row) => setEmblemHTML(row)).join('')}</span></span>`;
}

