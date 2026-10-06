/**
 * Drill Sets & Exams progress for Profile, and the small completed line on Home.
 * Read-only. Progress comes from exam and course attempt state already saved
 * (Exam I, Skills exams, the other Billiard University exams, Safety Master).
 * No Career XP, rank names, or existing storage keys are changed.
 *
 * Ball Pocketing rank stays off this list. The PDF course is a row of its own
 * (images only, no rank ladder, no Career XP). It appears once a PDF drill
 * has a saved session.
 *
 * RDS (Exam IV) is included only when its stages exist (moreExams.moreMeta order).
 * A single 3-rack set is progress, not a finish. The emblem appears when every
 * level has been passed. If moreExams.rdsProgress is not exported yet, scored stages
 * still count, and the row appears as soon as those stages exist.
 */
import { BU_EXAM_NAME, BU_ORDER, examOf } from './buExam.js';
import { XP } from '../progression/config.js';
import { SKILLS_EXAMS, skillsExamOf } from './buExam2.js';
import * as moreExams from './buMore.js';
import { SAFETY_NAME, SAFETY_ORDER, safetyOf } from './safetyMaster.js';
import { offRailProgress } from './kickingCourse.js';
import { trickProgressRows } from './trickShotCourse.js';
import { ballPocketCourseRow } from './ballPocket.js';
import * as PKF_KICK from './pkfKickingCourse.js';
import * as PKF_BANK from './pkfBankingCourse.js';
import * as PKF_CB from './pkfCueBallCourse.js';
import * as PKF_FUND from './pkfFundamentalsCourse.js';
import * as PKF_SM from './pkfShotMakingCourse.js';
import * as PKF_PP from './pkfPatternPlayCourse.js';
import * as PKF_ADV from './pkfAdvancedPlaySafetyCourse.js';
const { pkfProgressRows } = PKF_KICK;
const { pkfBankProgressRows } = PKF_BANK;
const { pkfCueBallProgressRows } = PKF_CB;
const { pkfFundProgressRows } = PKF_FUND;
const { pkfShotMakingProgressRows } = PKF_SM;
const { pkfPatternPlayProgressRows } = PKF_PP;
const { pkfAdvancedPlaySafetyProgressRows } = PKF_ADV;

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * One completion medal for every finished set. Same leaves, disc, and ribbon.
 * Exams differ only by metal, rim, or a small center mark. The name under it
 * says which one (Exam I, Exam II, RDS, Safety Master). Not a photo.
 */
const SHORT = {
  fundamentals: 'Exam I',
  bachelors: 'Exam II',
  masters: 'Masters',
  doctorate: 'Doctorate',
  advanced: 'Exam III',
  rds: 'RDS',
  ppc: 'Exam V',
  safety: 'Exam VI',
  draw: 'Exam VII',
  follow: 'Exam VIII',
  safetyMaster: 'Safety Master',
  offRail: 'Off the Rail',
  offRailExam: 'Off the Rail Exam',
  trick: 'Trick Shot',
  trickExam: 'Trick Shot Exam',
  ballPocket: 'Ball Pocketing',
  pkfKick: 'PKF Kicking',
  pkfKickExam: 'PKF Kick Exam',
  pkfBank: 'PKF Banking',
  pkfBankExam: 'PKF Bank Exam',
  pkfCueBall: 'PKF Cue Ball',
  pkfCueBallExam: 'PKF CB Exam',
  pkfFund: 'PKF Fundamentals',
  pkfFundExam: 'PKF Fund Exam',
  pkfShotMaking: 'PKF Shot Making',
  pkfShotMakingExam: 'PKF SM Exam',
  pkfPatternPlay: 'PKF Pattern Play',
  pkfPatternPlayExam: 'PKF PP Exam',
  pkfAdvanced: 'PKF Adv Play & Safety',
  pkfAdvancedExam: 'PKF APS Exam'
};

const STYLES = {
  fundamentals: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'star' },
  bachelors: { disc: '#f8e3a4', rim: '#6e5420', rimW: 2.2, inner: '#fffaf0', innerW: 0.7, leaf: '#ecd08a', ribbon: '#d4b06a', ribbon2: '#b8924a', ink: '#6e5420', mark: 'ring' },
  masters: { disc: '#e0b03a', rim: '#4a320c', rimW: 1.7, inner: '#f6d78a', innerW: 1.5, leaf: '#c9963a', ribbon: '#a97822', ribbon2: '#8a6418', ink: '#4a320c', mark: 'dot' },
  doctorate: { disc: '#f3d07a', rim: '#8a6a28', rimW: 2.6, inner: '#fff1c8', innerW: 0.6, leaf: '#e8c56a', ribbon: '#c9a04a', ribbon2: '#a88840', ink: '#6a4e16', mark: 'bar' },
  advanced: { disc: '#d7a441', rim: '#f3e2b0', rimW: 1.6, inner: '#fff6d4', innerW: 0.8, leaf: '#c4923a', ribbon: '#b8862a', ribbon2: '#8a6418', ink: '#5c4310', mark: 'star' },
  rds: { disc: '#f6c453', rim: '#fff6d4', rimW: 2.1, inner: '#7a5814', innerW: 0.8, leaf: '#e8c56a', ribbon: '#d4a84b', ribbon2: '#c9922a', ink: '#7a5814', mark: 'ring' },
  ppc: { disc: '#c9922a', rim: '#5a3e10', rimW: 1.8, inner: '#f0d48a', innerW: 1.3, leaf: '#b8862a', ribbon: '#8a5a14', ribbon2: '#6e4810', ink: '#3d2c0c', mark: 'dot' },
  safety: { disc: '#ffe7a8', rim: '#a88840', rimW: 1.4, inner: '#fffaf0', innerW: 1.1, leaf: '#f0d48a', ribbon: '#e2b14a', ribbon2: '#c9922a', ink: '#8a6418', mark: 'bar' },
  draw: { disc: '#e8c36a', rim: '#3d2c0c', rimW: 2.4, inner: '#fff6d4', innerW: 0.7, leaf: '#d4a84b', ribbon: '#a97822', ribbon2: '#7a5814', ink: '#3d2c0c', mark: 'star' },
  follow: { disc: '#f0d090', rim: '#9a7428', rimW: 1.3, inner: '#7a5814', innerW: 1.4, leaf: '#e2c07a', ribbon: '#c9a04a', ribbon2: '#a88840', ink: '#6e5420', mark: 'ring' },
  offRail: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'rail' },
  offRailExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'flag' },
  trick: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'trio' },
  trickExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'zmark' },
  pkfKick: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkf' },
  pkfKickExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfx' },
  pkfBank: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfb' },
  pkfBankExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfbx' },
  pkfCueBall: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfc' },
  pkfCueBallExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfcx' },
  pkfFund: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkff' },
  pkfFundExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkffx' },
  pkfShotMaking: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfs' },
  pkfShotMakingExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfsx' },
  pkfPatternPlay: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfp' },
  pkfPatternPlayExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfpx' },
  pkfAdvanced: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfa' },
  pkfAdvancedExam: { disc: '#f6c453', rim: '#7a5814', rimW: 1.5, inner: '#fff6d4', innerW: 0.9, leaf: '#e2b14a', ribbon: '#c9922a', ribbon2: '#a97822', ink: '#7a5814', mark: 'pkfax' },
  safetyMaster: { disc: '#f6c453', rim: '#fff1c8', rimW: 2.5, inner: '#a97822', innerW: 0.9, leaf: '#e8c56a', ribbon: '#c9922a', ribbon2: '#e2b14a', ink: '#7a5814', mark: 'dot' },
  ballPocket: { disc: '#f6c453', rim: '#fff1c8', rimW: 2.5, inner: '#a97822', innerW: 0.9, leaf: '#e8c56a', ribbon: '#c9922a', ribbon2: '#e2b14a', ink: '#7a5814', mark: 'dot' }
};

function centerMark(kind, ink) {
  if (kind === 'star') return `<path fill="${ink}" d="M32 21.4 33.6 25.3 37.8 25.7 34.6 28.5 35.5 32.6 32 30.5 28.5 32.6 29.4 28.5 26.2 25.7 30.4 25.3Z"/>`;
  if (kind === 'ring') return `<circle cx="32" cy="28" r="3.4" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
  if (kind === 'dot') return `<circle cx="32" cy="28" r="2.6" fill="${ink}"/>`;
  if (kind === 'bar') return `<rect x="27" y="26.6" width="10" height="2.7" rx="1.2" fill="${ink}"/>`;
  if (kind === 'rail') return `<path d="M26.2 30.8h11.6M32 30.8 27.6 25.2" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'flag') return `<path d="M28.2 24.2h7.2v4.6h-4.2v6.4h-3z" fill="${ink}"/>`;
  if (kind === 'trio') return `<circle cx="26.5" cy="28" r="1.7" fill="${ink}"/><circle cx="32" cy="28" r="1.7" fill="${ink}"/><circle cx="37.5" cy="28" r="1.7" fill="${ink}"/>`;
  if (kind === 'zmark') return `<path d="M26.4 24.6h7.2L26.4 31.4h7.2" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'pkf') return `<path d="M26.5 31.2 32 24.4 37.5 31.2Z" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="32" cy="28.2" r="1.5" fill="${ink}"/>`;
  if (kind === 'pkfb') return `<path d="M26.2 23.6h11.6M27.6 31.6 32 23.6 36.4 31.6" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'pkfbx') return `<path d="M26.2 23.6h11.6M27.6 31.6 32 23.6 36.4 31.6M29.4 28.4h5.2" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'pkff') return `<path d="M32 23.4v8.2M27.2 31.6h9.6" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`;
  if (kind === 'pkffx') return `<path d="M32 23.4v8.2M27.2 31.6h9.6" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/><circle cx="32" cy="23.6" r="1.6" fill="${ink}"/>`;
  if (kind === 'pkfs') return `<circle cx="32" cy="28" r="4.2" fill="none" stroke="${ink}" stroke-width="1.6"/><circle cx="32" cy="28" r="1.4" fill="${ink}"/>`;
  if (kind === 'pkfsx') return `<circle cx="32" cy="28" r="4.2" fill="none" stroke="${ink}" stroke-width="1.6"/><circle cx="32" cy="28" r="1.4" fill="${ink}"/><path d="M32 21.6v2.2M32 32.2v2.2" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (kind === 'pkfp') return `<circle cx="27.4" cy="31" r="1.6" fill="${ink}"/><circle cx="32" cy="25" r="1.6" fill="${ink}"/><circle cx="36.6" cy="31" r="1.6" fill="${ink}"/><path d="M28.4 29.6 31 26.4M33 26.4l2.6 3.2" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>`;
  if (kind === 'pkfpx') return `<circle cx="27.4" cy="31" r="1.6" fill="${ink}"/><circle cx="32" cy="25" r="1.6" fill="${ink}"/><circle cx="36.6" cy="31" r="1.6" fill="${ink}"/><path d="M28.4 29.6 31 26.4M33 26.4l2.6 3.2M29.2 31h5.6" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linecap="round"/>`;
  if (kind === 'pkfa') return `<path d="M32 23.2 36.6 25v3.6c0 2.8-2 4.6-4.6 5.6-2.6-1-4.6-2.8-4.6-5.6V25Z" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="32" cy="28.4" r="1.4" fill="${ink}"/>`;
  if (kind === 'pkfax') return `<path d="M32 23.2 36.6 25v3.6c0 2.8-2 4.6-4.6 5.6-2.6-1-4.6-2.8-4.6-5.6V25Z" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M29.6 28.4h4.8" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`;
  if (kind === 'pkfx') return `<path d="M27 24.8h10M32 24.8v8.4" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`;
  return '';
}

function medalSVG(style) {
  const s = style || STYLES.fundamentals;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="${s.ribbon}" d="M24 38 18 58 32 50V38Z"/><path fill="${s.ribbon2}" d="M40 38 46 58 32 50V38Z"/><g fill="${s.leaf}"><ellipse cx="16" cy="22" rx="3.4" ry="6.4" transform="rotate(-48 16 22)"/><ellipse cx="12.5" cy="31" rx="3.4" ry="6.4" transform="rotate(-12 12.5 31)"/><ellipse cx="15.5" cy="40" rx="3.2" ry="5.8" transform="rotate(24 15.5 40)"/><ellipse cx="48" cy="22" rx="3.4" ry="6.4" transform="rotate(48 48 22)"/><ellipse cx="51.5" cy="31" rx="3.4" ry="6.4" transform="rotate(12 51.5 31)"/><ellipse cx="48.5" cy="40" rx="3.2" ry="5.8" transform="rotate(-24 48.5 40)"/></g><circle cx="32" cy="28" r="13.2" fill="${s.disc}" stroke="${s.rim}" stroke-width="${s.rimW}"/><circle cx="32" cy="28" r="9.2" fill="none" stroke="${s.inner}" stroke-width="${s.innerW}"/><path d="M24.5 23.2c2.2-3.2 6.2-4.6 10-3.2" fill="none" stroke="#fff6d8" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>${centerMark(s.mark, s.ink)}</svg>`;
}

function shortName(id, name) {
  if (SHORT[id]) return SHORT[id];
  const raw = String(name || id).trim();
  const parts = raw.split(/\s*[–—]\s*/);
  if (parts.length > 1 && /^exam\b/i.test(parts[0])) {
    const rest = parts[1].replace(/^skills,?\s*/i, '').trim();
    if (rest && !/^exam$/i.test(rest)) return rest.slice(0, 18);
  }
  const paren = raw.match(/\(([^)]+)\)/);
  if (paren && paren[1]) return paren[1].slice(0, 18);
  const head = (parts[0] || raw).trim();
  if (/^exam$/i.test(head)) return String(id).slice(0, 18);
  return head.slice(0, 18) || String(id);
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
  const short = shortName(id, name);
  return { id, name, href, short, done, total, finished: done === total };
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
  const short = shortName(exam.key, exam.name);
  return {
    id: exam.key,
    name: exam.name,
    href: exam.href,
    short,
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
  const pocket = ballPocketCourseRow(state);
  if (pocket) rows.push(pocket);
  for (const row of offRailProgress(state)) rows.push(row);
  for (const row of trickProgressRows(state)) rows.push(row);
  for (const row of pkfProgressRows(state)) rows.push(row);
  for (const row of pkfBankProgressRows(state)) rows.push(row);
  for (const row of pkfCueBallProgressRows(state)) rows.push(row);
  for (const row of pkfFundProgressRows(state)) rows.push(row);
  for (const row of pkfShotMakingProgressRows(state)) rows.push(row);
  for (const row of pkfPatternPlayProgressRows(state)) rows.push(row);
  for (const row of pkfAdvancedPlaySafetyProgressRows(state)) rows.push(row);
  return rows;
}

export function setEmblemHTML(row) {
  return `<span class="setEmblem" data-set-emblem="${esc(row.id)}" title="${esc(row.name)}">${medalSVG(STYLES[row.id])}<b>${esc(row.short)}</b></span>`;
}

function meterHTML(row) {
  const pct = row.total ? Math.max(0, Math.min(100, Math.round((row.done / row.total) * 100))) : 0;
  return `<span class="setMeter"><span class="setBar" role="progressbar" aria-valuemin="0" aria-valuemax="${row.total}" aria-valuenow="${row.done}" aria-valuetext="${row.done} of ${row.total}"><span style="width:${pct}%"></span></span><small>${row.done} / ${row.total}</small></span>`;
}

/** v14-114: PKF course + exam rows (they live in Learn > Fundamentals); everything else is a Drill Sets & Exams row. */
const PKF_ROW_IDS = new Set(['pkfFund', 'pkfFundExam', 'pkfShotMaking', 'pkfShotMakingExam', 'pkfCueBall', 'pkfCueBallExam', 'pkfPatternPlay', 'pkfPatternPlayExam', 'pkfAdvanced', 'pkfAdvancedExam', 'pkfKick', 'pkfKickExam', 'pkfBank', 'pkfBankExam']);
export const isPkfRow = (row) => PKF_ROW_IDS.has(row.id);
/** Started BU / Other sets and exams (Drill Sets & Exams page only). */
export function readDrillSetProgress(state) { return readSetProgress(state).filter((r) => !isPkfRow(r)); }
/** Started PKF courses and exams (Learn > Fundamentals). */
export function readPkfProgress(state) { return readSetProgress(state).filter(isPkfRow); }

const progRowHTML = (row, note = '') => `<button type="button" class="setProgRow${row.finished ? ' is-done' : ''}" data-set="${esc(row.id)}" data-set-done="${row.finished ? 1 : 0}" data-action="go" data-href="${esc(row.href)}"><span class="setName">${esc(row.name)}</span>${row.finished ? setEmblemHTML(row) : ''}${meterHTML(row)}${note}</button>`;

/**
 * v14-116: the one-time course bonus note. Earned (flag with XP) → "✓ Course bonus +300 XP".
 * Not finished and never flagged → a muted "Course bonus +300 XP" (what finishing pays).
 * Finished before the bonus existed (flag without XP) → nothing.
 */
export function courseBonusNoteHTML(state, row, { todo = false } = {}) {
  if (!row || isPkfRow(row)) return '';
  const flag = (state?.prog?.courseBonus || {})[row.id];
  const amt = XP.courseCompleteBonus;
  if (flag && flag.xp > 0) return `<span class="courseBonusNote" data-course-bonus="${esc(row.id)}">✓ Course bonus +${flag.xp} XP</span>`;
  if (!flag && !row.finished && todo) return `<span class="courseBonusNote is-todo" data-course-bonus-todo="${esc(row.id)}">Course bonus +${amt} XP</span>`;
  return '';
}

/** Profile box. Always present. Rows only for BU / Other sets or exams already started (PKF is in the Learn · PKF box). */
export function setProgressBoxHTML(state) {
  const rows = readDrillSetProgress(state);
  const body = rows.length ? rows.map((r) => progRowHTML(r, courseBonusNoteHTML(state, r))).join('') : '<p class="muted small setNone">No set or exam started.</p>';
  return `<div class="card setProgressCard" data-set-progress><h3>Drill Sets &amp; Exams</h3>${body}</div>`;
}

/** v14-114: Profile "Learn · PKF" box. Always present. Same rows, meters and emblems as before, for started PKF courses and exams. */
export function pkfProgressBoxHTML(state) {
  const rows = readPkfProgress(state);
  const body = rows.length ? rows.map((r) => progRowHTML(r)).join('') : '<p class="muted small setNone">No PKF course started. Find them in Learn › Fundamentals.</p>';
  return `<div class="card setProgressCard pkfProgressCard" data-pkf-progress><h3><span class="eyebrow">LEARN</span> PKF Courses &amp; Exams</h3>${body}</div>`;
}

/** Home ranks card only. Empty string until at least one set, exam or PKF course is fully finished. Drill sets and PKF get their own line. */
export function completedSetsLineHTML(state) {
  const done = readSetProgress(state).filter((row) => row.finished);
  const sets = done.filter((r) => !isPkfRow(r)), pkf = done.filter(isPkfRow);
  const line = (key, label, list) => (list.length ? `<span class="hrSets" data-${key}><span class="hrSetsLabel">${label}</span><span class="hrSetsMarks">${list.map((row) => setEmblemHTML(row)).join('')}</span></span>` : '');
  return line('set-emblems', 'Drill sets and exams completed', sets) + line('pkf-emblems', 'Learn · PKF courses completed', pkf);
}

// ------------------------------------------------------------------------------ v14-114: PKF curriculum progress (Learn > Fundamentals)
/**
 * The 7 PKF courses in curriculum order. Reads the same saved course state and the same
 * progress rows (and so the same finish / emblem rules) as Profile and Home. No new storage, no XP.
 */
const PKF_CURRICULUM = [
  { key: 'pkffund', courseId: 'pkfFund', examId: 'pkfFundExam', mod: PKF_FUND, rows: pkfFundProgressRows, store: PKF_FUND.courseOf },
  { key: 'pkfsmcb', courseId: 'pkfShotMaking', examId: 'pkfShotMakingExam', mod: PKF_SM, rows: pkfShotMakingProgressRows, store: PKF_SM.courseOf },
  { key: 'pkfcb', courseId: 'pkfCueBall', examId: 'pkfCueBallExam', mod: PKF_CB, rows: pkfCueBallProgressRows, store: PKF_CB.courseOf },
  { key: 'pkfpattern', courseId: 'pkfPatternPlay', examId: 'pkfPatternPlayExam', mod: PKF_PP, rows: pkfPatternPlayProgressRows, store: PKF_PP.courseOf },
  { key: 'pkfadv', courseId: 'pkfAdvanced', examId: 'pkfAdvancedExam', mod: PKF_ADV, rows: pkfAdvancedPlaySafetyProgressRows, store: PKF_ADV.courseOf },
  { key: 'pkfkick', courseId: 'pkfKick', examId: 'pkfKickExam', mod: PKF_KICK, rows: pkfProgressRows, store: PKF_KICK.pkfOf },
  { key: 'pkfbank', courseId: 'pkfBank', examId: 'pkfBankExam', mod: PKF_BANK, rows: pkfBankProgressRows, store: PKF_BANK.bankOf }
];

/** One status object per PKF course (course + its exam), in curriculum order. */
export function pkfCurriculumStatus(state) {
  return PKF_CURRICULUM.map((c) => {
    const rows = c.rows(state) || [];
    const total = typeof c.mod.playableSectionCount === 'function' ? c.mod.playableSectionCount() : c.mod.SECTIONS.length;
    const course = rows.find((r) => r.id === c.courseId) || { id: c.courseId, name: c.mod.COURSE_TITLE, href: `#${c.key}`, short: SHORT[c.courseId] || c.mod.COURSE_TITLE, done: 0, total, finished: false };
    const examRow = rows.find((r) => r.id === c.examId) || null;
    const saved = c.store(state || {});
    const ex = saved?.exam || {};
    return {
      key: c.key,
      course: { ...course, started: rows.some((r) => r.id === c.courseId) },
      exam: {
        id: c.examId,
        name: c.mod.EXAM_TITLE,
        short: examRow?.short || SHORT[c.examId] || c.mod.EXAM_TITLE,
        unlocked: !!c.mod.examUnlocked(state || {}),
        passed: !!ex.passed,
        attempts: ex.attempts || 0,
        best: ex.attempts || ex.passed ? (ex.bestOverall || 0) : null,
        row: examRow
      }
    };
  });
}

/** Progress block inside a PKF course card: where the player is, a bar + percent, and the emblem once finished. */
export function pkfCourseProgressHTML(item) {
  const c = item.course;
  const pct = c.total ? Math.max(0, Math.min(100, Math.round((c.done / c.total) * 100))) : 0;
  const where = c.finished ? `Complete · ${c.done} of ${c.total} sections` : c.done || c.started ? `In progress · ${c.done} of ${c.total} sections passed` : `Not started · ${c.total} sections`;
  return `<span class="pkfProg${c.finished ? ' is-done' : ''}" data-pkf-prog="${esc(c.id)}" data-pkf-done="${c.done}" data-pkf-total="${c.total}"><span class="pkfProgTop"><span class="pkfProgWhere">${esc(where)}</span><b class="pkfProgPct">${pct}%</b></span>${meterHTML(c)}${c.finished ? setEmblemHTML(c) : ''}</span>`;
}

/** Status block inside a PKF exam card: locked / unlocked, passed, best score, and the exam emblem once passed. */
export function pkfExamProgressHTML(item) {
  const e = item.exam;
  const best = e.best == null ? '' : ` · Best ${Math.round(e.best * 100)}%`;
  const state = e.passed ? 'passed' : e.unlocked ? (e.attempts ? 'tried' : 'open') : 'locked';
  const text = e.passed ? `Passed${best}` : e.unlocked ? (e.attempts ? `Not passed yet${best} · ${e.attempts} attempt${e.attempts === 1 ? '' : 's'}` : 'Unlocked · not taken yet') : `Locked · ${item.course.done} of ${item.course.total} sections passed`;
  const emblem = e.passed ? setEmblemHTML(e.row || { id: e.id, name: e.name, short: e.short }) : '';
  return `<span class="pkfProg pkfExamProg is-${state}" data-pkf-exam="${esc(e.id)}" data-pkf-exam-state="${state}"><span class="pkfProgTop"><span class="pkfProgWhere">${e.passed ? '✓ ' : e.unlocked ? '' : '🔒 '}${esc(text)}</span></span>${emblem}</span>`;
}
