/**
 * Geometry checks shared by verify.mjs (and handy for authoring new stages or drills).
 * geometryProblems(challenge, label) -> list of human-readable problems (empty = OK).
 */
import * as G from '../js/games/geometry.js';

const R = G.R;
const C = G.CUSHION;
export const POCK = G.POCKET_XY;
const TOL = 0.35;
export const inside = (p) => p.x >= C.minX - TOL && p.x <= C.maxX + TOL && p.y >= C.minY - TOL && p.y <= C.maxY + TOL;
export const nearPocket = (p) => Math.min(...Object.values(POCK).map((q) => G.dist(p, q)));
/** A cushion contact is in the jaws if it is within 5 units of a corner (along the rail) or 4 units of a side-pocket centre */
export function inJaws(p) {
  const onLong = Math.abs(p.y - C.minY) < 0.3 || Math.abs(p.y - C.maxY) < 0.3;
  const along = onLong ? Math.min(p.x - C.minX, C.maxX - p.x) : Math.min(p.y - C.minY, C.maxY - p.y);
  if (along < 5) return true;
  return onLong && Math.abs(p.x - 50) < 4;
}
const pts = (a) => (a || []).map((p) => ({ x: p.x, y: p.y }));

/** Returns a list of geometry problems for one challenge (label = where it lives) */
export function geometryProblems(ch, label) {
  const out = [];
  if (!ch || !ch.cueBallPosition) return out;
  const balls = [...(ch.ballPositions || []), ...(ch.blockers || [])].map((b) => ({ n: b.n, x: b.x, y: b.y }));
  const cue = ch.cueBallPosition;
  const all = [{ n: 'cue', ...cue }, ...balls];
  // balls on the table, not in pockets, not overlapping
  for (const b of all) {
    if (!G.ballOnTable(b)) out.push(`${label}: ball ${b.n} off the playing surface (${b.x},${b.y})`);
    if (nearPocket(b) < 4) out.push(`${label}: ball ${b.n} sits in a pocket (${nearPocket(b).toFixed(1)} from the centre)`);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (G.dist(all[i], all[j]) < 2 * R - 0.05) out.push(`${label}: balls ${all[i].n} & ${all[j].n} overlap`);
  // paths inside the table (a final point may drop into the target pocket)
  const checkPath = (p, name, pocketKey) => {
    p.forEach((q, i) => {
      if (inside(q)) return;
      const last = i === p.length - 1;
      if (last && pocketKey && G.dist(q, POCK[pocketKey]) < 1.5) return;
      out.push(`${label}: ${name} point ${i} outside the table (${q.x},${q.y})`);
    });
  };
  const cp = pts(ch.cueBallPath);
  checkPath(cp, 'cue path', null);
  const obPaths = (ch.objectBallPaths && ch.objectBallPaths.length ? ch.objectBallPaths : ch.objectBallPath?.length ? [{ n: ch.targetBall, points: ch.objectBallPath }] : []);
  for (const op of obPaths) {
    const p = pts(op.points);
    const pocket = op.pocket || (op.n === ch.targetBall ? ch.targetPocket : null) || ch.targetPocket;
    checkPath(p, `OB ${op.n} path`, pocket);
  }
  // some object-ball route ends at the target pocket (combinations: the last ball in the chain)
  if (ch.targetPocket && obPaths.length && ch.kind !== 'safety' && ch.kind !== 'lag') {
    const ends = obPaths.map((op) => op.points[op.points.length - 1]).filter(Boolean);
    const best = Math.min(...ends.map((e) => G.dist(e, POCK[ch.targetPocket])));
    if (best > 1.5) out.push(`${label}: no object-ball route ends in pocket ${ch.targetPocket} (closest ${best.toFixed(1)})`);
  }
  // rail contacts on cushion lines, not inside pocket mouths
  for (const rc of ch.railContacts || []) {
    const on = Math.abs(rc.x - C.minX) < 0.3 || Math.abs(rc.x - C.maxX) < 0.3 || Math.abs(rc.y - C.minY) < 0.3 || Math.abs(rc.y - C.maxY) < 0.3;
    if (!on) out.push(`${label}: rail contact (${rc.x},${rc.y}) not on a cushion line`);
    if (inJaws(rc)) out.push(`${label}: rail contact (${rc.x},${rc.y}) inside a pocket mouth`);
  }
  // mirror reflections: angle in = angle out
  for (const rf of ch.reflectionCheck || []) {
    const p = pts(rf.points);
    let ri = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const rail = G.railOf(p[i], 0.3);
      if (!rail) continue;
      const [a, b] = G.reflectionAngles(p[i - 1], p[i], p[i + 1], rail);
      const legMin = Math.min(G.dist(p[i - 1], p[i]), G.dist(p[i], p[i + 1]));
      const tol = 1 + (0.15 / Math.max(legMin, 1)) * 57.3; // allow 0.1-unit coordinate rounding
      if (Math.abs(a - b) > tol) out.push(`${label}: reflection at rail ${rail} ${a.toFixed(1)}° in vs ${b.toFixed(1)}° out`);
      ri++;
    }
  }
  // target zones inside the table
  for (const z of ch.targetZones || []) {
    if (z.type === 'rings' && !inside({ x: z.x, y: z.y })) out.push(`${label}: zone centre (${z.x},${z.y}) outside the table`);
    if (z.type === 'band' && (z.center < C.minX || z.center > C.maxX)) out.push(`${label}: band zone outside the table`);
  }
  // cue ball's approach does not pass through other balls
  const approach = cp.slice(0, (ch.contactIndex ?? cp.length - 1) + 1);
  const others = balls.filter((b) => b.n !== ch.targetBall);
  for (let i = 0; i < approach.length - 1; i++) {
    for (const b of others) {
      const d = G.distToSegment(b, approach[i], approach[i + 1]);
      if (d < 2 * R - 0.1) out.push(`${label}: cue ball's approach passes through ball ${b.n} (clearance ${d.toFixed(2)})`);
    }
  }
  // after contact: the cue ball's route must not run through balls (carom target excepted)
  const after = cp.slice(ch.contactIndex ?? cp.length - 1);
  const afterOthers = others.filter((b) => b.n !== ch.caromTarget);
  for (let i = 0; i < after.length - 1; i++) for (const b of afterOthers) {
    const d = G.distToSegment(b, after[i], after[i + 1]);
    if (d < 2 * R - 0.25) out.push(`${label}: cue route after contact runs through ball ${b.n} (clearance ${d.toFixed(2)})`);
  }
  // object-ball routes don't run through other balls
  for (const op of obPaths) {
    const p = pts(op.points);
    const skip = new Set([op.n, ch.caromTarget]);
    for (let i = 0; i < p.length - 1; i++) for (const b of balls) {
      if (skip.has(b.n)) continue;
      const d = G.distToSegment(b, p[i], p[i + 1]);
      if (d < 2 * R - 0.1) out.push(`${label}: OB ${op.n} route runs through ball ${b.n} (clearance ${d.toFixed(2)})`);
    }
  }
  // kick blockers really block the direct line to the target
  if (ch.kind === 'kick' && (ch.blockers || []).length) {
    const t = balls.find((b) => b.n === ch.targetBall);
    const blocked = ch.blockers.some((b) => G.distToSegment(b, cue, t) < 2 * R);
    if (!blocked) out.push(`${label}: kick blockers leave the direct line open`);
  }
  return out;
}

