/**
 * Pool IQ Shot Simulator — deterministic time-stepped billiards physics (pure, no DOM).
 *
 * Units: table inches (100 × 50 playing surface, cushion nose to cushion nose), seconds.
 * Frame: x → foot rail (right), y → bottom rail (down), z → INTO the slate (right-handed).
 * Each ball: position (x,y), velocity (vx,vy), angular velocity (wx,wy,wz).
 *
 * Model (standard textbook billiards physics, simplified — this is an APPROXIMATION of a real table):
 *  - Cue strike: level cue, impulse through the tip offset → speed V along the aim line plus
 *    top/back spin (5·V·b / 2R²) and side spin (5·V·a / 2R²). Side english squirts the ball a little
 *    off the aim line (≈1.2° per tip). No elevation, so no massé/swerve and no jump shots.
 *  - Cloth: sliding friction (μs) until the contact point stops slipping, then rolling resistance (μr).
 *    Sliding → rolling happens exactly when the slip reaches zero (natural roll = 5/7 of a stun speed).
 *    Side spin decays on its own and does not curve the ball.
 *  - Ball–ball: impulse along the line of centres with restitution 0.95, plus a friction impulse at the
 *    contact that depends on the slip speed (≈ Alciatore's measured ball–ball friction curve) — this gives
 *    cut-induced and spin-induced throw and a little spin transfer.
 *  - Cushions: segments ending at real pocket jaws. Restitution falls with impact speed; friction at the
 *    contact transfers side spin into the rebound (running / reverse english) and trims the ball's spin.
 *  - Pockets: corner mouth ≈ 4.5", side ≈ 5", with angled facings. A ball drops once its centre passes the
 *    pocket shelf; balls that hit a jaw point or facing rebound (rattle) — they are not auto-pocketed.
 *  - Deterministic: fixed rules, adaptive step based on the fastest ball (≤ 0.12 R per step → no tunnelling).
 */
import { BALL_RADIUS, POCKETS } from '../tableDiagram.js';

export const R = BALL_RADIUS; // 1.125 in
export const G = 386.09; // in/s²
export const MU_SLIDE = 0.2;
export const MU_ROLL = 0.0105;
export const MU_SPIN = 0.012; // side-spin decay
export const MU_CUSHION = 0.2;
export const E_BALL = 0.95;
export const TIP = 0.443 * R; // one cue-tip width of offset (matches the tip diagram: 19.5 of 44)
export const MAX_TIPS_V = 1.5;
export const MAX_TIPS_H = 1.5;
export const SQUIRT_DEG_PER_TIP = 1.2;
const I_FACTOR = 2.5 / (R * R); // 1/I per unit mass = 5 / (2 m R²)
const STOP_V = 0.03; // in/s
const LEN_UNITS = 100 - 2 * R; // centre travel for one table length (end rail to end rail)

/** Cushion restitution as a function of normal impact speed (in/s) */
export function cushionE(vn) {
  return Math.max(0.75, Math.min(0.93, 0.93 - 0.0005 * vn));
}
/** Share of the ball's roll into the cushion that survives the impact (the nose contacts above the equator and trims it) */
export const CUSHION_ROLL_KEEP = 0.2;
/** Ball–ball friction vs slip speed (in/s → m/s), after Alciatore's fit */
export function ballFriction(vSlip) {
  const v = vSlip * 0.0254;
  return 0.00995 + 0.108 * Math.exp(-1.088 * v);
}

// ------------------------------------------------------------------ table geometry
const CORNER_JAW = 3.22; // jaw point distance from the nose-line corner → 4.55" mouth
const SIDE_JAW = 2.55; // half mouth of the side pockets → 5.1" mouth
const FACING_LEN = 2.3;
function facingDir(along, outward, angDeg) {
  const a = (angDeg * Math.PI) / 180;
  return { x: Math.cos(a) * along.x + Math.sin(a) * outward.x, y: Math.cos(a) * along.y + Math.sin(a) * outward.y };
}
function buildSegments() {
  const segs = [];
  const seg = (ax, ay, bx, by, kind, rail) => segs.push({ ax, ay, bx, by, kind, rail });
  const fac = (jx, jy, along, outward, ang, rail) => {
    const d = facingDir(along, outward, ang);
    seg(jx, jy, jx + d.x * FACING_LEN, jy + d.y * FACING_LEN, 'jaw', rail);
  };
  const C = CORNER_JAW;
  const S = SIDE_JAW;
  // long rails (top y=0, bottom y=50), split by the side pockets
  for (const [y, out, rail] of [[0, { x: 0, y: -1 }, 'top'], [50, { x: 0, y: 1 }, 'bottom']]) {
    seg(C, y, 50 - S, y, 'rail', rail);
    seg(50 + S, y, 100 - C, y, 'rail', rail);
    fac(C, y, { x: 1, y: 0 }, out, 142, rail); // corner facings point back toward the corner
    fac(100 - C, y, { x: -1, y: 0 }, out, 142, rail);
    fac(50 - S, y, { x: -1, y: 0 }, out, 104, rail); // side facings
    fac(50 + S, y, { x: 1, y: 0 }, out, 104, rail);
  }
  for (const [x, out, rail] of [[0, { x: -1, y: 0 }, 'left'], [100, { x: 1, y: 0 }, 'right']]) {
    seg(x, C, x, 50 - C, 'rail', rail);
    fac(x, C, { x: 0, y: 1 }, out, 142, rail);
    fac(x, 50 - C, { x: 0, y: -1 }, out, 142, rail);
  }
  return segs;
}
export const SEGMENTS = buildSegments();
/** Physics pockets: drop point = drawn pocket centre; the ball falls once its centre is within dropR */
export const PHYS_POCKETS = Object.entries(POCKETS).map(([k, p]) => ({ key: k, x: p.x, y: p.y, dropR: k === 'TM' || k === 'BM' ? 1.05 : 1.6 }));
export const JAWS = { corner: CORNER_JAW, side: SIDE_JAW };

// ------------------------------------------------------------------ helpers
const hyp = (x, y, z = 0) => Math.sqrt(x * x + y * y + z * z);
export function isCue(id) {
  return id === 'cue' || id === 0 || id === '0';
}
/** Deep copy of a layout into simulation balls */
function makeBalls(layout) {
  return layout.map((b) => ({ id: isCue(b.id) ? 'cue' : Number(b.id), x: +b.x, y: +b.y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, pocket: null, rolling: true }));
}
export function ballEnergy(b) {
  // per unit mass: ½v² + ½·(2/5)R²·|ω|²
  return 0.5 * (b.vx * b.vx + b.vy * b.vy) + 0.2 * R * R * (b.wx * b.wx + b.wy * b.wy + b.wz * b.wz);
}
export function totalEnergy(balls) {
  let e = 0;
  for (const b of balls) if (b.on) e += ballEnergy(b);
  return e;
}
const DT_MAX = 1 / 120;
const STEP_FRAC = 0.2;

function slip(b) {
  // contact-point velocity with the cloth: v + ω × (R ẑ) = (vx + R·wy, vy − R·wx)
  return { x: b.vx + R * b.wy, y: b.vy - R * b.wx };
}

/** Advance one ball's velocity/spin by cloth friction over dt; returns the distance-weighted average velocity */
function frictionStep(b, dt) {
  const v0x = b.vx;
  const v0y = b.vy;
  let t = dt;
  const u = slip(b);
  const us = hyp(u.x, u.y);
  if (us > 1e-9) {
    b.rolling = false;
    const tRoll = (2 * us) / (7 * MU_SLIDE * G);
    const ts = Math.min(t, tRoll);
    const ux = u.x / us;
    const uy = u.y / us;
    const a = MU_SLIDE * G;
    b.vx -= a * ux * ts;
    b.vy -= a * uy * ts;
    const al = (5 * a) / (2 * R);
    b.wx += al * uy * ts;
    b.wy += -al * ux * ts;
    t -= ts;
    if (ts >= tRoll - 1e-12) {
      // exactly rolling now
      b.wy = -b.vx / R;
      b.wx = b.vy / R;
      b.rolling = true;
    }
  } else b.rolling = true;
  if (t > 0 && b.rolling) {
    const v = hyp(b.vx, b.vy);
    const dv = MU_ROLL * G * t;
    if (v <= dv) {
      b.vx = 0;
      b.vy = 0;
    } else {
      b.vx -= (b.vx / v) * dv;
      b.vy -= (b.vy / v) * dv;
    }
    b.wy = -b.vx / R;
    b.wx = b.vy / R;
  }
  // side spin decays on its own
  if (b.wz) {
    const dz = ((5 * MU_SPIN * G) / (2 * R)) * dt;
    b.wz = Math.abs(b.wz) <= dz ? 0 : b.wz - Math.sign(b.wz) * dz;
  }
  if (b.rolling && b.vx * b.vx + b.vy * b.vy < STOP_V * STOP_V) {
    b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0;
  }
  return { x: (v0x + b.vx) / 2, y: (v0y + b.vy) / 2 };
}

/** Resolve a ball–ball impact (i → j normal) */
function collideBalls(bi, bj) {
  let nx = bj.x - bi.x;
  let ny = bj.y - bi.y;
  const d = hyp(nx, ny) || 1;
  nx /= d;
  ny /= d;
  const vn = (bi.vx - bj.vx) * nx + (bi.vy - bj.vy) * ny;
  if (vn <= 0) return 0;
  const Jn = ((1 + E_BALL) * vn) / 2; // per unit mass
  // contact slip (pre-impact): vi − vj + R(ωi + ωj) × n
  const wx = bi.wx + bj.wx;
  const wy = bi.wy + bj.wy;
  const wz = bi.wz + bj.wz;
  // (w × n) with n = (nx, ny, 0): (wy·0 − wz·ny, wz·nx − wx·0, wx·ny − wy·nx)
  let sx = bi.vx - bj.vx + R * (-wz * ny);
  let sy = bi.vy - bj.vy + R * (wz * nx);
  let sz = R * (wx * ny - wy * nx);
  const sn = sx * nx + sy * ny;
  sx -= sn * nx;
  sy -= sn * ny;
  const s = hyp(sx, sy, sz);
  bi.vx -= Jn * nx;
  bi.vy -= Jn * ny;
  bj.vx += Jn * nx;
  bj.vy += Jn * ny;
  if (s > 1e-9) {
    const Jt = Math.min(ballFriction(s) * Jn, s / 7);
    const jx = (-Jt * sx) / s;
    const jy = (-Jt * sy) / s;
    const jz = (-Jt * sz) / s;
    bi.vx += jx;
    bi.vy += jy;
    bj.vx -= jx;
    bj.vy -= jy;
    // Δω = (R n × J) / I for both balls
    const tx = R * (ny * jz - 0 * jy);
    const ty = R * (0 * jx - nx * jz);
    const tz = R * (nx * jy - ny * jx);
    bi.wx += tx * I_FACTOR; bi.wy += ty * I_FACTOR; bi.wz += tz * I_FACTOR;
    bj.wx += tx * I_FACTOR; bj.wy += ty * I_FACTOR; bj.wz += tz * I_FACTOR;
  }
  bi.rolling = false;
  bj.rolling = false;
  return vn;
}

/** Resolve a cushion/jaw impact; n = unit normal from the contact point to the ball centre */
function collideCushion(b, nx, ny) {
  const vn = -(b.vx * nx + b.vy * ny);
  if (vn <= 0) return 0;
  const e = cushionE(vn);
  const Jn = (1 + e) * vn;
  // contact at r = −R n: slip = v + ω × (−R n)
  let sx = b.vx - R * (-b.wz * ny);
  let sy = b.vy - R * (b.wz * nx);
  let sz = -R * (b.wx * ny - b.wy * nx);
  const sn = sx * nx + sy * ny;
  sx -= sn * nx;
  sy -= sn * ny;
  const s = hyp(sx, sy, sz);
  b.vx += Jn * nx;
  b.vy += Jn * ny;
  if (s > 1e-9) {
    const Jt = Math.min(MU_CUSHION * Jn, s / 3.5);
    const jx = (-Jt * sx) / s;
    const jy = (-Jt * sy) / s;
    const jz = (-Jt * sz) / s;
    b.vx += jx;
    b.vy += jy;
    // Δω = (−R n × J) / I
    b.wx += -R * (ny * jz) * I_FACTOR;
    b.wy += -R * (-nx * jz) * I_FACTOR;
    b.wz += -R * (nx * jy - ny * jx) * I_FACTOR;
  }
  // nose-height effect: most of the roll toward the cushion is killed at impact
  const sx0 = -R * b.wy;
  const sy0 = R * b.wx;
  const sN = sx0 * nx + sy0 * ny;
  if (sN < 0) {
    const k = (1 - CUSHION_ROLL_KEEP) * sN;
    b.wy = -(sx0 - k * nx) / R;
    b.wx = (sy0 - k * ny) / R;
  }
  b.rolling = false;
  return vn;
}

function closestOnSeg(px, py, s) {
  const dx = s.bx - s.ax;
  const dy = s.by - s.ay;
  const L2 = dx * dx + dy * dy;
  let t = ((px - s.ax) * dx + (py - s.ay) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  return { x: s.ax + dx * t, y: s.ay + dy * t, t };
}

// ------------------------------------------------------------------ cue strike
/**
 * Initial cue-ball state from a level stroke.
 * @param {number} aimDeg aim direction, degrees (0 = toward the foot rail/+x, 90 = toward the top rail)
 * @param {number} V cue-ball speed in in/s
 * @param {number} vTips vertical tip offset (+ follow, − draw), in tip widths
 * @param {number} hTips horizontal tip offset (+ right english), in tip widths
 */
export function strike(aimDeg, V, vTips = 0, hTips = 0) {
  const vt = Math.max(-MAX_TIPS_V, Math.min(MAX_TIPS_V, vTips));
  const ht = Math.max(-MAX_TIPS_H, Math.min(MAX_TIPS_H, hTips));
  // squirt: the cue ball deflects opposite the english
  const a0 = (aimDeg * Math.PI) / 180;
  const sq = (ht * SQUIRT_DEG_PER_TIP * Math.PI) / 180;
  const ang = a0 + sq; // +y is down, so aim angle measured with y up: direction (cos, −sin)
  const dx = Math.cos(ang);
  const dy = -Math.sin(ang);
  const b = vt * TIP;
  const a = ht * TIP;
  const k = (5 * V) / (2 * R * R);
  return { vx: V * dx, vy: V * dy, wx: k * b * dy, wy: -k * b * dx, wz: -k * a };
}
export const aimVector = (aimDeg) => ({ x: Math.cos((aimDeg * Math.PI) / 180), y: -Math.sin((aimDeg * Math.PI) / 180) });
export const aimFromVector = (dx, dy) => { let a = (Math.atan2(-dy, dx) * 180) / Math.PI; if (a < 0) a += 360; return a; };

// ------------------------------------------------------------------ simulation
/**
 * Run a shot to rest.
 * @param {Array<{id,x,y}>} layout balls ('cue' + numbers)
 * @param {{aim:number, speed?:number, V?:number, vTips?:number, hTips?:number}} shot
 * @param {{maxTime?:number, frameDt?:number, record?:boolean, stopAfterFirstHit?:boolean, initial?:object}} opt
 */
export function simulate(layout, shot, opt = {}) {
  const balls = makeBalls(layout);
  const cue = balls.find((b) => b.id === 'cue');
  const maxTime = opt.maxTime || 40;
  const frameDt = opt.frameDt || 1 / 60;
  const record = opt.record !== false;
  const events = [];
  const frames = [];
  const energy = [];
  if (opt.initial) {
    for (const [id, st] of Object.entries(opt.initial)) {
      const b = balls.find((q) => String(q.id) === String(id));
      if (b) Object.assign(b, st, { rolling: false });
    }
  } else if (cue && shot) {
    const V = shot.V != null ? shot.V : speedToV0(shot.speed ?? 2);
    Object.assign(cue, strike(shot.aim || 0, V, shot.vTips || 0, shot.hTips || 0), { rolling: false });
  }
  const snap = (t) => {
    frames.push({ t, p: balls.map((b) => (b.on ? [b.x, b.y] : null)) });
    energy.push(totalEnergy(balls));
  };
  let t = 0;
  let nextFrame = 0;
  if (record) { snap(0); nextFrame = frameDt; }
  const dist = new Map();
  for (const b of balls) dist.set(b.id, 0);
  let firstHit = null;
  let steps = 0;
  while (t < maxTime) {
    let vmax = 0;
    let any = false;
    for (const b of balls) {
      if (!b.on) continue;
      if (b.vx === 0 && b.vy === 0 && b.rolling) continue;
      const u = slip(b);
      const v = hyp(b.vx, b.vy);
      if (v > STOP_V || (!b.rolling && hyp(u.x, u.y) > STOP_V)) any = true;
      vmax = Math.max(vmax, v);
    }
    if (!any) break;
    // friction is integrated exactly within a step, so the step only has to keep collisions/pockets precise
    const dt = Math.min(DT_MAX, (STEP_FRAC * R) / Math.max(vmax, 1e-6));
    // 1) cloth friction + move
    for (const b of balls) {
      if (!b.on) continue;
      if (b.vx === 0 && b.vy === 0 && b.rolling) { if (b.wz) frictionStep(b, dt); continue; }
      const va = frictionStep(b, dt);
      b.x += va.x * dt;
      b.y += va.y * dt;
      dist.set(b.id, dist.get(b.id) + hyp(va.x, va.y) * dt);
    }
    // 2) ball–ball contacts (back off to the exact touch, resolve, move on)
    for (let pass = 0; pass < 8; pass++) {
      let hit = false;
      for (let i = 0; i < balls.length; i++) {
        const bi = balls[i];
        if (!bi.on) continue;
        // every pair with at least one moving ball, once: from the moving ball (lower index if both move)
        if (bi.vx === 0 && bi.vy === 0) continue;
        for (let j = 0; j < balls.length; j++) {
          if (j === i) continue;
          const bj = balls[j];
          if (!bj.on) continue;
          if (j < i && (bj.vx !== 0 || bj.vy !== 0)) continue;
          const dx = bj.x - bi.x;
          const dy = bj.y - bi.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= 4 * R * R) continue;
          const rvx = bj.vx - bi.vx;
          const rvy = bj.vy - bi.vy;
          const pv = dx * rvx + dy * rvy;
          if (pv >= 0) continue; // separating or resting
          const a = rvx * rvx + rvy * rvy;
          const disc = pv * pv - a * (d2 - 4 * R * R);
          const back = Math.min(dt * 2, Math.max(0, (pv + Math.sqrt(Math.max(0, disc))) / a));
          bi.x -= bi.vx * back; bi.y -= bi.vy * back;
          bj.x -= bj.vx * back; bj.y -= bj.vy * back;
          const vn = collideBalls(bi, bj);
          bi.x += bi.vx * back; bi.y += bi.vy * back;
          bj.x += bj.vx * back; bj.y += bj.vy * back;
          if (vn > 0) {
            hit = true;
            const ev = { t: t + dt - back, type: 'ball', a: bi.id, b: bj.id, x: (bi.x + bj.x) / 2, y: (bi.y + bj.y) / 2, v: vn };
            events.push(ev);
            if (!firstHit && (bi.id === 'cue' || bj.id === 'cue')) {
              firstHit = { ...ev, ob: bi.id === 'cue' ? bj.id : bi.id, cueAt: bi.id === 'cue' ? { x: bi.x - bi.vx * back, y: bi.y - bi.vy * back } : { x: bj.x - bj.vx * back, y: bj.y - bj.vy * back } };
            }
          }
        }
      }
      if (!hit) break;
    }
    // 3) cushions and jaws
    for (const b of balls) {
      if (!b.on || (b.vx === 0 && b.vy === 0)) continue;
      if (b.x > R + 0.4 && b.x < 100 - R - 0.4 && b.y > R + 0.4 && b.y < 50 - R - 0.4) continue;
      for (const s of SEGMENTS) {
        const c = closestOnSeg(b.x, b.y, s);
        let nx = b.x - c.x;
        let ny = b.y - c.y;
        const d = hyp(nx, ny);
        if (d >= R || d < 1e-9) continue;
        nx /= d;
        ny /= d;
        const vn = -(b.vx * nx + b.vy * ny);
        if (vn <= 0) continue;
        // back off along v to the touch point, resolve, move forward the same time
        const back = Math.min(dt * 2, (R - d) / vn);
        b.x -= b.vx * back; b.y -= b.vy * back;
        const v = collideCushion(b, nx, ny);
        b.x += b.vx * back; b.y += b.vy * back;
        if (v > 0) events.push({ t: t + dt - back, type: s.kind === 'jaw' ? 'jaw' : 'cushion', ball: b.id, rail: s.rail, x: c.x + nx * R, y: c.y + ny * R, v });
      }
    }
    // 4) pockets
    for (const b of balls) {
      if (!b.on || (b.vx === 0 && b.vy === 0)) continue;
      let pk = null;
      for (const p of PHYS_POCKETS) if (hyp(b.x - p.x, b.y - p.y) < p.dropR) { pk = p; break; }
      if (!pk && (b.x < -0.25 || b.x > 100.25 || b.y < -0.25 || b.y > 50.25)) {
        // deep in a pocket throat (only reachable through a mouth) → drops in the nearest pocket
        const behind = Math.max(-b.x, b.x - 100, -b.y, b.y - 50);
        if (behind > 1.2) pk = PHYS_POCKETS.reduce((a, p) => (hyp(b.x - p.x, b.y - p.y) < hyp(b.x - a.x, b.y - a.y) ? p : a));
      }
      if (pk) {
        b.on = false;
        b.pocket = pk.key;
        b.vx = b.vy = b.wx = b.wy = b.wz = 0;
        events.push({ t: t + dt, type: 'pocket', ball: b.id, pocket: pk.key, x: b.x, y: b.y });
      }
    }
    t += dt;
    steps++;
    if (record) while (t >= nextFrame) { snap(nextFrame); nextFrame += frameDt; }
    if (opt.stopAfterFirstHit && firstHit && t - firstHit.t > (opt.afterHit || 0.02)) break;
  }
  for (const b of balls) if (b.on && b.rolling && hyp(b.vx, b.vy) <= STOP_V) { b.vx = b.vy = 0; b.wx = b.wy = 0; }
  if (record) snap(t);
  const final = balls.map((b) => ({ id: b.id, x: b.x, y: b.y, on: b.on, pocket: b.pocket, vx: b.vx, vy: b.vy }));
  return {
    ids: balls.map((b) => b.id),
    frames,
    energy,
    events,
    final,
    duration: t,
    steps,
    firstHit,
    distance: Object.fromEntries(dist),
    pocketed: balls.filter((b) => !b.on).map((b) => ({ id: b.id, pocket: b.pocket })),
    scratch: !!(cue && !cue.on)
  };
}

// ------------------------------------------------------------------ SPEED scale
/** Table lengths travelled by a lone center-ball lag from the head rail at cue-ball speed V */
export function lagLengths(V) {
  const r = simulate([{ id: 'cue', x: R + 0.05, y: 25 }], { aim: 0, V }, { record: false, maxTime: 60 });
  return r.distance.cue / LEN_UNITS;
}
/** Precomputed by scripts/gen-speed-table.mjs: [table lengths, cue-ball launch speed in/s] */
const SPEED_TABLE = [[0,0],[0.25,19.228],[0.5,27.192],[0.75,33.304],[1,38.467],[1.25,48.3],[1.5,56.597],[1.75,63.923],[2,70.572],[2.25,84.084],[2.5,96.133],[2.75,107.152],[3,117.397],[3.25,138.85],[3.5,158.708],[3.75,176.47],[4,185.739],[4.25,206.964],[4.5,228.431],[4.75,247.093],[5,258.51],[5.25,285.912],[5.5,315.773],[5.75,343.707],[6,361.558],[6.25,400.577],[6.5,438.807],[6.75,474.615],[7,497.648],[7.25,548.129],[7.5,597.683],[7.75,644.264],[8,674.417]];
let speedTable = null;
export function buildSpeedTable() {
  // V for lengths 0, 0.25 … 8 by bisection on the simulated lag (includes rail losses)
  const out = [[0, 0]];
  let lo = 0;
  for (let L = 0.25; L <= 8.001; L += 0.25) {
    let a = lo;
    let b = Math.max(lo * 1.6, 40);
    while (lagLengths(b) < L) b *= 1.5;
    for (let i = 0; i < 34; i++) {
      const m = (a + b) / 2;
      if (lagLengths(m) < L) a = m; else b = m;
    }
    lo = (a + b) / 2;
    out.push([L, lo]);
  }
  return out;
}
/** Cue-ball launch speed (in/s) for Pool IQ SPEED s (s table lengths of center-ball travel) */
export function speedToV0(s) {
  if (!speedTable) speedTable = SPEED_TABLE || buildSpeedTable();
  const v = Math.max(0, Math.min(8, Number(s) || 0));
  const i = Math.min(speedTable.length - 2, Math.floor(v / 0.25));
  const [l0, v0] = speedTable[i];
  const [l1, v1] = speedTable[i + 1];
  return v0 + ((v - l0) / (l1 - l0)) * (v1 - v0);
}
/** Inverse: SPEED number for a launch speed */
export function v0ToSpeed(V) {
  if (!speedTable) speedTable = SPEED_TABLE || buildSpeedTable();
  for (let i = 0; i < speedTable.length - 1; i++) {
    const [l0, v0] = speedTable[i];
    const [l1, v1] = speedTable[i + 1];
    if (V <= v1) return l0 + ((V - v0) / (v1 - v0)) * (l1 - l0);
  }
  return 8;
}
export const SPEED_MAX = 7;
export const LENGTH_UNITS = LEN_UNITS;

// ------------------------------------------------------------------ prediction helpers
/** First ball the cue ball would touch travelling straight along the aim (no curve), or the cushion point */
export function predictContact(layout, aimDeg) {
  const cue = layout.find((b) => isCue(b.id));
  if (!cue) return null;
  const d = aimVector(aimDeg);
  let best = null;
  for (const b of layout) {
    if (isCue(b.id)) continue;
    const ox = b.x - cue.x;
    const oy = b.y - cue.y;
    const along = ox * d.x + oy * d.y;
    if (along <= 0) continue;
    const perp2 = ox * ox + oy * oy - along * along;
    if (perp2 >= 4 * R * R) continue;
    const s = along - Math.sqrt(4 * R * R - perp2);
    if (s < -1e-6) continue;
    if (!best || s < best.s) best = { s, ball: b, ghost: { x: cue.x + d.x * s, y: cue.y + d.y * s } };
  }
  if (best) {
    const n = { x: best.ball.x - best.ghost.x, y: best.ball.y - best.ghost.y };
    const nl = hyp(n.x, n.y) || 1;
    const on = { x: n.x / nl, y: n.y / nl };
    const cut = (Math.acos(Math.max(-1, Math.min(1, on.x * d.x + on.y * d.y))) * 180) / Math.PI;
    // tangent line direction (stun): perpendicular to the line of centres, on the side the cue ball is heading
    const cross = d.x * on.y - d.y * on.x;
    const tan = cross > 0 ? { x: on.y, y: -on.x } : { x: -on.y, y: on.x };
    return { type: 'ball', ...best, obDir: on, cut, tangent: tan };
  }
  // cushion hit point (ball centre on the cushion line)
  let s = Infinity;
  if (d.x > 1e-9) s = Math.min(s, (100 - R - cue.x) / d.x);
  if (d.x < -1e-9) s = Math.min(s, (R - cue.x) / d.x);
  if (d.y > 1e-9) s = Math.min(s, (50 - R - cue.y) / d.y);
  if (d.y < -1e-9) s = Math.min(s, (R - cue.y) / d.y);
  return { type: 'rail', s, point: { x: cue.x + d.x * s, y: cue.y + d.y * s } };
}

/** Aim angle that sends the cue ball's centre to point p */
export function aimAt(cue, p) {
  return aimFromVector(p.x - cue.x, p.y - cue.y);
}
/** Ghost-ball aim for ob → pocket (no throw compensation) */
export function ghostAim(cue, ob, pocketKey) {
  const pk = PHYS_POCKETS.find((p) => p.key === pocketKey);
  const dx = pk.x - ob.x;
  const dy = pk.y - ob.y;
  const l = hyp(dx, dy) || 1;
  const ghost = { x: ob.x - (dx / l) * 2 * R, y: ob.y - (dy / l) * 2 * R };
  return { aim: aimAt(cue, ghost), ghost };
}

/** Summary of a finished simulation for UI copy */
export function describeResult(res) {
  const names = { TL: 'top-left corner', TM: 'top side', TR: 'top-right corner', BL: 'bottom-left corner', BM: 'bottom side', BR: 'bottom-right corner' };
  const pots = res.pocketed.filter((p) => p.id !== 'cue').map((p) => `${p.id} in the ${names[p.pocket]}`);
  const rails = res.events.filter((e) => e.type === 'cushion' && e.ball === 'cue').length;
  return { pots, rails, scratch: res.scratch, firstHit: res.firstHit?.ob ?? null };
}
