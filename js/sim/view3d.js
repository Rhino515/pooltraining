/**
 * First-person table. Same diagram coordinates as 2D (x along the length,
 * diagram y becomes z). Camera sits just behind the cue ball. Drawing never
 * moves the balls. Shaded canvas projection, not a photo.
 */
const f2 = (v) => Math.round(v * 100) / 100;

const BALL_COLORS = {
  cue: '#f3f6f8',
  1: '#f0d34a', 2: '#2f6fe0', 3: '#e23b3b', 4: '#6d38c9', 5: '#f08a2a', 6: '#1e9a45', 7: '#8a4b12',
  8: '#16191e',
  9: '#e2b423', 10: '#2457c9', 11: '#c42828', 12: '#5b27b0', 13: '#d86a18', 14: '#147a38', 15: '#7a3e0c'
};

function rgb(hex) {
  const h = String(hex).replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(hex, toward, t) {
  const a = rgb(hex);
  const b = rgb(toward);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function cameraBehind(cue, yaw = 0, pitch = 0) {
  const c = cue || { x: 25, y: 25 };
  const look = { x: Math.min(92, c.x + 42), y: 0.55, z: c.y * 0.35 + 25 * 0.65 };
  let dx = c.x - look.x;
  let dz = c.y - look.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const rx = dx * cy - dz * sy;
  const rz = dx * sy + dz * cy;
  const dist = 11.5;
  return {
    x: c.x + rx * dist,
    y: 8.4 + pitch * 0.35,
    z: c.y + rz * dist,
    look,
    yaw,
    pitch
  };
}

function basis(cam) {
  let fx = cam.look.x - cam.x;
  let fy = cam.look.y - cam.y;
  let fz = cam.look.z - cam.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz;
  let rz = fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  const ux = -rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy;
  return { fx, fy, fz, rx, ry: 0, rz, ux, uy, uz };
}

function toCam(p, cam) {
  const b = cam._b || (cam._b = basis(cam));
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  return {
    x: dx * b.rx + dy * b.ry + dz * b.rz,
    y: dx * b.ux + dy * b.uy + dz * b.uz,
    z: dx * b.fx + dy * b.fy + dz * b.fz
  };
}

function projCS(p, w, h) {
  const f = h * 0.58;
  return { x: w / 2 + (p.x / p.z) * f, y: h * 0.30 - (p.y / p.z) * f, z: p.z, s: f / p.z };
}

export function project(p, cam, w, h) {
  const cs = toCam(p, cam);
  if (cs.z < 0.25) return null;
  return projCS(cs, w, h);
}

function clipZ(poly, near) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a.z >= near;
    const bin = b.z >= near;
    if (ain && bin) out.push(b);
    else if (ain && !bin) {
      const t = (near - a.z) / (b.z - a.z || 1e-6);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: near });
    } else if (!ain && bin) {
      const t = (near - a.z) / (b.z - a.z || 1e-6);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: near });
      out.push(b);
    }
  }
  return out;
}

function gradOk(g) {
  return g && typeof g.addColorStop === 'function';
}

function path(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function paintFace(ctx, pts, fill) {
  path(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** A world quad, clipped to the near plane. */
function quad(cam, w, h, world, near) {
  const clipped = clipZ(world.map((p) => toCam(p, cam)), near);
  if (clipped.length < 3) return null;
  const scr = clipped.map((p) => projCS(p, w, h));
  const z = clipped.reduce((s, p) => s + p.z, 0) / clipped.length;
  return { scr, z };
}

function woodGradient(ctx, pts, a, b) {
  const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[2].x, pts[2].y);
  if (!gradOk(g)) return a;
  g.addColorStop(0, b);
  g.addColorStop(0.45, a);
  g.addColorStop(1, mix(a, '#1a0c04', 0.35));
  return g;
}

export function drawTable3D(ctx, w, h, { balls, ballR, yaw = 0, pitch = 0 }) {
  const list = balls || [];
  const cue = list.find((b) => b.id === 'cue') || list[0];
  const cam = cameraBehind(cue, yaw, pitch);
  const near = 0.45;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  if (gradOk(sky)) {
    sky.addColorStop(0, '#1c140e');
    sky.addColorStop(0.22, '#0c0d10');
    sky.addColorStop(1, '#050608');
    ctx.fillStyle = sky;
  } else ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, w, h);
  const lamp = ctx.createRadialGradient(w * 0.5, h * 0.08, 8, w * 0.5, h * 0.2, h * 0.55);
  if (gradOk(lamp)) {
    lamp.addColorStop(0, 'rgba(255, 196, 120, .20)');
    lamp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, w, h);
  }

  const P = (x, z, y) => ({ x, y, z });
  const faces = [];
  const add = (world, fill, kind) => {
    const q = quad(cam, w, h, world, near);
    if (q) faces.push({ ...q, fill, kind });
  };

  // Outer apron only. A full underside slab projects over the cloth and hides it.
  add([P(-4.4, -4.6, -2.4), P(104.4, -4.6, -2.4), P(104.4, -4.6, 0.2), P(-4.4, -4.6, 0.2)], '#3a2414', 'wood');
  add([P(-4.4, 54.6, -2.4), P(104.4, 54.6, -2.4), P(104.4, 54.6, 0.2), P(-4.4, 54.6, 0.2)], '#2e1c10', 'wood');
  add([P(-4.6, -4.4, -2.4), P(-4.6, 54.4, -2.4), P(-4.6, 54.4, 0.2), P(-4.6, -4.4, 0.2)], '#342012', 'wood');
  add([P(104.6, -4.4, -2.4), P(104.6, 54.4, -2.4), P(104.6, 54.4, 0.2), P(104.6, -4.4, 0.2)], '#26160c', 'wood');

  // Cloth first so rails sit on top of the edge.
  const cloth = quad(cam, w, h, [P(0, 0, 0), P(100, 0, 0), P(100, 50, 0), P(0, 50, 0)], near);
  if (cloth) {
    path(ctx, cloth.scr);
    ctx.save();
    ctx.clip();
    const cx = cloth.scr.reduce((s, p) => s + p.x, 0) / cloth.scr.length;
    const cy = cloth.scr.reduce((s, p) => s + p.y, 0) / cloth.scr.length;
    let reach = 0;
    for (const p of cloth.scr) reach = Math.max(reach, Math.hypot(p.x - cx, p.y - cy));
    const felt = ctx.createRadialGradient(cx, cy - reach * 0.28, reach * 0.04, cx, cy - reach * 0.05, reach * 0.38);
    if (gradOk(felt)) {
      felt.addColorStop(0, '#8af59a');
      felt.addColorStop(0.28, '#1e9844');
      felt.addColorStop(0.62, '#0b5a2e');
      felt.addColorStop(1, '#02180c');
      ctx.fillStyle = felt;
    } else ctx.fillStyle = '#12743c';
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const x = cx + (hash(i) - 0.5) * reach * 2;
      const y = cy + (hash(i + 40) - 0.5) * reach * 2;
      ctx.strokeStyle = hash(i + 7) > 0.55 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.1)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y + 11);
      ctx.stroke();
    }
    const spot = ctx.createRadialGradient(cx, cy - reach * 0.05, reach * 0.08, cx, cy, reach * 0.95);
    if (gradOk(spot)) {
      spot.addColorStop(0, 'rgba(210, 255, 200, .22)');
      spot.addColorStop(0.45, 'rgba(0,0,0,0)');
      spot.addColorStop(1, 'rgba(0, 20, 8, .55)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  // Beveled rails. Gaps leave the pocket mouths open.
  const railRun = (x0, x1, zSign) => {
    const zIn = zSign < 0 ? 0 : 50;
    const zNose = zIn + zSign * 0.7;
    const zBev = zIn + zSign * 1.55;
    const zOut = zIn + zSign * 3.55;
    const zApr = zIn + zSign * 4.15;
    const segs = 4;
    for (let s = 0; s < segs; s++) {
      const a = x0 + (x1 - x0) * (s / segs);
      const b = x0 + (x1 - x0) * ((s + 1) / segs);
      add([P(a, zApr, -1.6), P(b, zApr, -1.6), P(b, zOut, 2.15), P(a, zOut, 2.15)], zSign < 0 ? '#5c3418' : '#4a2a12', 'wood');
      add([P(a, zOut, 2.15), P(b, zOut, 2.15), P(b, zBev, 2.85), P(a, zBev, 2.85)], '#c49255', 'woodLight');
      add([P(a, zBev, 2.85), P(b, zBev, 2.85), P(b, zNose, 1.25), P(a, zNose, 1.25)], '#8d5a30', 'wood');
      add([P(a, zNose, 1.25), P(b, zNose, 1.25), P(b, zIn, 0.05), P(a, zIn, 0.05)], '#1c6b38', 'rubber');
    }
  };
  const endRun = (z0, z1, xSign) => {
    const xIn = xSign < 0 ? 0 : 100;
    const xNose = xIn + xSign * 0.7;
    const xBev = xIn + xSign * 1.55;
    const xOut = xIn + xSign * 3.55;
    const xApr = xIn + xSign * 4.15;
    add([P(xApr, z0, -1.6), P(xApr, z1, -1.6), P(xOut, z1, 2.15), P(xOut, z0, 2.15)], '#3f2612', 'wood');
    add([P(xOut, z0, 2.15), P(xOut, z1, 2.15), P(xBev, z1, 2.85), P(xBev, z0, 2.85)], '#b6844c', 'woodLight');
    add([P(xBev, z0, 2.85), P(xBev, z1, 2.85), P(xNose, z1, 1.25), P(xNose, z0, 1.25)], '#7a4e28', 'wood');
    add([P(xNose, z0, 1.25), P(xNose, z1, 1.25), P(xIn, z1, 0.05), P(xIn, z0, 0.05)], '#165e32', 'rubber');
  };
  railRun(4, 46, -1);
  railRun(54, 96, -1);
  railRun(4, 46, 1);
  railRun(54, 96, 1);
  endRun(4, 22, -1);
  endRun(28, 46, -1);
  endRun(4, 22, 1);
  endRun(28, 46, 1);

  // Soft shadow where the cushions meet the cloth.
  const shade = (world) => {
    const q = quad(cam, w, h, world, near);
    if (!q) return;
    paintFace(ctx, q.scr, 'rgba(0, 20, 8, .32)');
  };
  shade([P(2, 0.2, 0.03), P(98, 0.2, 0.03), P(98, 4.2, 0.03), P(2, 4.2, 0.03)]);
  shade([P(2, 49.8, 0.03), P(98, 49.8, 0.03), P(98, 45.8, 0.03), P(2, 45.8, 0.03)]);
  shade([P(0.2, 2, 0.03), P(4.5, 2, 0.03), P(4.5, 48, 0.03), P(0.2, 48, 0.03)]);
  shade([P(99.8, 2, 0.03), P(95.5, 2, 0.03), P(95.5, 48, 0.03), P(99.8, 48, 0.03)]);

  faces.sort((a, b) => b.z - a.z);
  for (const f of faces) {
    let fill = f.fill;
    if (f.kind === 'wood' || f.kind === 'woodLight') fill = woodGradient(ctx, f.scr, f.fill, f.kind === 'woodLight' ? '#e7c48a' : mix(f.fill, '#e7c48a', 0.35));
    if (f.kind === 'rubber') fill = woodGradient(ctx, f.scr, '#145c30', '#1e7a40');
    paintFace(ctx, f.scr, fill);
    if (f.kind === 'woodLight' && f.scr.length >= 4) {
      ctx.save();
      path(ctx, f.scr);
      ctx.clip();
      ctx.strokeStyle = 'rgba(80, 40, 12, .28)';
      ctx.lineWidth = 1;
      const a = f.scr[0];
      const b = f.scr[1];
      const c = f.scr[2];
      const d = f.scr[f.scr.length - 1];
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        ctx.beginPath();
        ctx.moveTo(a.x + (d.x - a.x) * t, a.y + (d.y - a.y) * t);
        ctx.lineTo(b.x + (c.x - b.x) * t, b.y + (c.y - b.y) * t);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Pocket holes with a leather rim and a darker throat.
  const pockets = [[-0.4, -0.4], [50, -1.5], [100.4, -0.4], [-0.4, 50.4], [50, 51.5], [100.4, 50.4]];
  for (const [x, z] of pockets) {
    const top = project({ x, y: 1.35, z }, cam, w, h);
    const deep = project({ x, y: -1.1, z }, cam, w, h);
    if (!top) continue;
    const rad = Math.max(7, 2.15 * top.s);
    ctx.beginPath();
    ctx.fillStyle = '#5a3418';
    ctx.ellipse(top.x, top.y, rad * 1.28, rad * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#07080a';
    ctx.ellipse(top.x, top.y, rad * 0.92, rad * 0.66, 0, 0, Math.PI * 2);
    ctx.fill();
    if (deep) {
      ctx.beginPath();
      ctx.fillStyle = '#000';
      ctx.ellipse(deep.x, deep.y + rad * 0.15, rad * 0.55, rad * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(220, 180, 120, .45)';
    ctx.lineWidth = Math.max(1, rad * 0.08);
    ctx.ellipse(top.x, top.y - rad * 0.08, rad * 0.92, rad * 0.66, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  ctx.fillStyle = '#f4efe6';
  const diamondAt = (x, z) => {
    const p = project({ x, y: 2.9, z }, cam, w, h);
    if (!p) return;
    const s = Math.max(2.4, 0.72 * p.s);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s * 0.62, p.y);
    ctx.lineTo(p.x, p.y + s * 0.72);
    ctx.lineTo(p.x - s * 0.62, p.y);
    ctx.closePath();
    ctx.fill();
  };
  for (const x of [12.5, 25, 37.5, 62.5, 75, 87.5]) {
    diamondAt(x, -1.7);
    diamondAt(x, 51.7);
  }
  for (const z of [12.5, 37.5]) {
    diamondAt(-1.7, z);
    diamondAt(101.7, z);
  }

  const sprites = [];
  for (const b of list) {
    const p = project({ x: b.x, y: ballR, z: b.y }, cam, w, h);
    const sh = project({ x: b.x, y: 0.02, z: b.y }, cam, w, h);
    if (!p) continue;
    sprites.push({ b, p, sh, rad: Math.max(3.5, ballR * p.s) });
  }
  sprites.sort((a, b) => b.p.z - a.p.z);
  if (cue) drawCue(ctx, cam, w, h, cue, ballR);
  for (const s of sprites) drawBall(ctx, s);

  const vig = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.5, h * 0.75);
  if (gradOk(vig)) {
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
  return { camYaw: f2(yaw) };
}

function drawBall(ctx, s) {
  const { b, p, sh, rad } = s;
  const id = b.id;
  const color = BALL_COLORS[id] || '#94a3b8';
  if (sh) {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,.38)';
    ctx.ellipse(sh.x, sh.y, rad * 0.92, rad * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createRadialGradient(p.x - rad * 0.38, p.y - rad * 0.42, rad * 0.05, p.x + rad * 0.1, p.y + rad * 0.15, rad);
  if (gradOk(body)) {
    body.addColorStop(0, mix(color, '#ffffff', id === 'cue' ? 0.55 : 0.7));
    body.addColorStop(0.22, mix(color, '#ffffff', 0.18));
    body.addColorStop(0.58, color);
    body.addColorStop(1, mix(color, id === 'cue' ? '#9aa3ad' : '#000000', id === 'cue' ? 0.55 : 0.5));
    ctx.fillStyle = body;
  } else ctx.fillStyle = color;
  ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  if (Number(id) >= 9) {
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(p.x - rad, p.y - rad * 0.4, rad * 2, rad * 0.8);
    const cap = ctx.createRadialGradient(p.x - rad * 0.2, p.y - rad * 0.2, rad * 0.05, p.x, p.y, rad * 0.48);
    if (gradOk(cap)) {
      cap.addColorStop(0, mix(color, '#ffffff', 0.35));
      cap.addColorStop(1, color);
      ctx.fillStyle = cap;
    } else ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad * 0.46, 0, Math.PI * 2);
    ctx.fill();
  }
  const shade = ctx.createRadialGradient(p.x - rad * 0.2, p.y - rad * 0.3, rad * 0.2, p.x, p.y, rad);
  if (gradOk(shade)) {
    shade.addColorStop(0, 'rgba(255,255,255,0)');
    shade.addColorStop(0.72, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = shade;
    ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.ellipse(p.x - rad * 0.32, p.y - rad * 0.36, rad * 0.16, rad * 0.09, -0.7, 0, Math.PI * 2);
  ctx.fill();
  if (id !== 'cue') {
    ctx.beginPath();
    ctx.fillStyle = id === 8 ? '#f4f6f8' : '#f7f8fa';
    ctx.arc(p.x, p.y, rad * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14181e';
    ctx.font = `700 ${Math.max(8, rad * 0.46)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(id), p.x, p.y + rad * 0.02);
  }
}

function drawCue(ctx, cam, w, h, cue, ballR) {
  const p = project({ x: cue.x, y: ballR * 0.72, z: cue.y }, cam, w, h);
  if (!p) return;
  const rad = Math.max(8, ballR * p.s);
  const tx = p.x;
  const ty = p.y + rad * 0.72;
  const bx = w * 0.5;
  const by = h - 1;
  let dx = tx - bx;
  let dy = ty - by;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  const px = -dy;
  const py = dx;
  const tipW = Math.max(5.5, rad * 0.13);
  const buttW = tipW * 2.15;
  const ferrule = Math.max(16, rad * 0.55);
  const sx = tx - dx * ferrule;
  const sy = ty - dy * ferrule;
  const side = ctx.createLinearGradient(bx + px * buttW, by + py * buttW, bx - px * buttW, by - py * buttW);
  let shaft = '#d7b072';
  if (gradOk(side)) {
    side.addColorStop(0, '#3d220c');
    side.addColorStop(0.22, '#a56b32');
    side.addColorStop(0.48, '#f3ddb0');
    side.addColorStop(0.62, '#e2be7a');
    side.addColorStop(1, '#3a200c');
    shaft = side;
  }
  const buttW2 = buttW;
  const neck = tipW * 0.95;
  ctx.beginPath();
  ctx.moveTo(bx + px * buttW2, by + py * buttW2);
  ctx.lineTo(bx - px * buttW2, by - py * buttW2);
  ctx.lineTo(sx - px * neck, sy - py * neck);
  ctx.lineTo(sx + px * neck, sy + py * neck);
  ctx.closePath();
  ctx.fillStyle = shaft;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + px * buttW2 * 0.08, by + py * buttW2 * 0.08);
  ctx.lineTo(sx + px * neck * 0.05, sy + py * neck * 0.05);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = Math.max(1.5, tipW * 0.18);
  ctx.stroke();
  const fer = Math.max(18, rad * 0.42);
  const fx = tx - dx * fer;
  const fy = ty - dy * fer;
  ctx.beginPath();
  ctx.moveTo(sx + px * neck, sy + py * neck);
  ctx.lineTo(sx - px * neck, sy - py * neck);
  ctx.lineTo(fx - px * neck * 0.82, fy - py * neck * 0.82);
  ctx.lineTo(fx + px * neck * 0.82, fy + py * neck * 0.82);
  ctx.closePath();
  ctx.fillStyle = '#f6f3ec';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx + px * neck * 0.78, fy + py * neck * 0.78);
  ctx.lineTo(fx - px * neck * 0.78, fy - py * neck * 0.78);
  ctx.lineTo(tx - px * neck * 0.62, ty - py * neck * 0.62);
  ctx.lineTo(tx + px * neck * 0.62, ty + py * neck * 0.62);
  ctx.closePath();
  ctx.fillStyle = '#2c78d0';
  ctx.fill();
}
