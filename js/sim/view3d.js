/**
 * First-person table view. Same diagram coordinates as the 2D table (x along the length,
 * diagram y becomes z). Camera sits just behind the cue ball, low, like standing at the table.
 * Drawing this never moves the balls.
 */
const f2 = (v) => Math.round(v * 100) / 100;

const BALL_COLORS = {
  cue: '#f4f7fb',
  1: '#f5d76e', 2: '#3b82f6', 3: '#ef4444', 4: '#7c3aed', 5: '#f97316', 6: '#16a34a', 7: '#a16207',
  8: '#14181f',
  9: '#eab308', 10: '#2563eb', 11: '#dc2626', 12: '#6d28d9', 13: '#ea580c', 14: '#15803d', 15: '#854d0e'
};

export function cameraBehind(cue, yaw = 0, pitch = 0) {
  const c = cue || { x: 25, y: 25 };
  const look = { x: Math.min(97, c.x + 46), y: 0.15, z: c.y * 0.28 + 25 * 0.72 };
  let dx = c.x - look.x;
  let dz = c.y - look.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const rx = dx * cy - dz * sy;
  const rz = dx * sy + dz * cy;
  const dist = 14;
  return {
    x: c.x + rx * dist,
    y: 6.4 + pitch,
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

export function project(p, cam, w, h) {
  const b = cam._b || (cam._b = basis(cam));
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  const x = dx * b.rx + dy * b.ry + dz * b.rz;
  const y = dx * b.ux + dy * b.uy + dz * b.uz;
  const z = dx * b.fx + dy * b.fy + dz * b.fz;
  if (z < 0.25) return null;
  const f = (h * 0.62) / Math.tan((28 * Math.PI) / 180);
  return { x: w / 2 + (x / z) * f, y: h * 0.46 - (y / z) * f, z, s: f / z };
}

function useGrad(ctx, factory, fallback) {
  const g = factory();
  if (g && typeof g.addColorStop === 'function') return g;
  return fallback;
}

function poly(ctx, pts, fill) {
  if (!pts || pts.some((pt) => !pt)) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Draw the real balls and rails. `balls` is read only. */
export function drawTable3D(ctx, w, h, { balls, ballR, yaw = 0, pitch = 0 }) {
  const list = balls || [];
  const cue = list.find((b) => b.id === 'cue');
  const cam = cameraBehind(cue, yaw, pitch);
  const sky = useGrad(ctx, () => ctx.createLinearGradient(0, 0, 0, h), '#07080c');
  if (sky !== '#07080c') {
    sky.addColorStop(0, '#2a2118');
    sky.addColorStop(0.28, '#100e0c');
    sky.addColorStop(1, '#05060a');
    ctx.fillStyle = sky;
  } else ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, w, h);

  const P = (x, z, y = 0) => project({ x, y, z }, cam, w, h);
  poly(ctx, [P(-7, -7, -2.2), P(107, -7, -2.2), P(107, 57, -2.2), P(-7, 57, -2.2)], '#2c1a0e');
  poly(ctx, [P(0, 0, 0), P(100, 0, 0), P(100, 50, 0), P(0, 50, 0)], '#0e6b3d');
  poly(ctx, [P(22, 10, 0.02), P(78, 10, 0.02), P(74, 40, 0.02), P(26, 40, 0.02)], '#178f4c');
  // wood rails drawn after the cloth so the far and side rails stay visible
  const rail = (a, b, c, d, fill) => poly(ctx, [P(...a), P(...b), P(...c), P(...d)], fill);
  rail([-4.4, -4.6, 0.3], [104.4, -4.6, 0.3], [104.4, 0, 2.8], [-4.4, 0, 2.8], '#9a6436');
  rail([-4.4, 50, 2.8], [104.4, 50, 2.8], [104.4, 54.6, 0.3], [-4.4, 54.6, 0.3], '#7a4e28');
  rail([-4.6, -4.4, 0], [0, -4.4, 1.9], [0, 54.4, 1.9], [-4.6, 54.4, 0], '#8a5a32');
  rail([100, -4.4, 3.4], [104.6, -4.4, 0.4], [104.6, 54.4, 0.4], [100, 54.4, 3.4], '#6e4524');
  rail([-3.2, -3.2, 1.95], [103.2, -3.2, 1.95], [103.2, -1.1, 1.95], [-3.2, -1.1, 1.95], '#d7a15a');

  const pockets = [[0, 0], [50, 0], [100, 0], [0, 50], [50, 50], [100, 50]];
  const items = [];
  for (const [x, z] of pockets) {
    const p = P(x, z, 0.9);
    const cueP = cue ? project({ x: cue.x, y: ballR, z: cue.y }, cam, w, h) : null;
    if (!p || (cueP && p.z < cueP.z * 0.92)) continue;
    items.push({
      z: p.z + 0.2,
      draw: () => {
        const rad = Math.max(5, 3.15 * p.s);
        ctx.beginPath();
        ctx.fillStyle = '#6b4424';
        ctx.arc(p.x, p.y, rad * 1.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#07080c';
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  ctx.fillStyle = '#f7f4ee';
  const diamond = (x, z) => {
    const p = P(x, z, 1.85);
    if (!p) return;
    const s = Math.max(2.2, 0.85 * p.s);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s);
    ctx.lineTo(p.x + s * 0.72, p.y);
    ctx.lineTo(p.x, p.y + s);
    ctx.lineTo(p.x - s * 0.72, p.y);
    ctx.closePath();
    ctx.fill();
  };
  for (const x of [12.5, 25, 37.5, 62.5, 75, 87.5]) {
    diamond(x, -1.55);
    diamond(x, 51.55);
  }
  for (const z of [12.5, 37.5]) {
    diamond(-1.55, z);
    diamond(101.55, z);
  }

  for (const b of list) {
    const p = project({ x: b.x, y: ballR, z: b.y }, cam, w, h);
    if (!p) continue;
    const rad = Math.max(4, ballR * p.s);
    const id = b.id;
    items.push({
      z: p.z,
      draw: () => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.ellipse(p.x + rad * 0.2, p.y + rad * 0.95, rad * 0.85, rad * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = BALL_COLORS[id] || '#94a3b8';
        ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
        if (Number(id) >= 9) {
          ctx.fillStyle = '#f4f7fb';
          ctx.fillRect(p.x - rad, p.y - rad * 0.42, rad * 2, rad * 0.84);
          ctx.fillStyle = BALL_COLORS[id] || '#94a3b8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad * 0.46, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.beginPath();
        ctx.arc(p.x - rad * 0.32, p.y - rad * 0.36, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (id !== 'cue') {
          ctx.beginPath();
          ctx.fillStyle = '#f7f8fa';
          ctx.arc(p.x, p.y, rad * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#12161c';
          ctx.font = `700 ${Math.max(8, rad * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(id), p.x, p.y + rad * 0.02);
        }
      }
    });
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
  drawCue(ctx, cam, w, h, cue, ballR);
  return { camYaw: f2(yaw) };
}

function drawCue(ctx, cam, w, h, cue, ballR) {
  if (!cue) return;
  const p = project({ x: cue.x, y: ballR * 0.85, z: cue.y }, cam, w, h);
  if (!p) return;
  const rad = Math.max(6, ballR * p.s);
  const sx = w * 0.5;
  const sy = h + 24;
  const dx = p.x - sx;
  const dy = p.y - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = p.x - ux * (rad + 1);
  const tipY = p.y - uy * (rad + 1);
  const ferrule = rad * 0.55;
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#6b3e1e';
  ctx.lineWidth = Math.max(11, rad * 0.55);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tipX - ux * ferrule * 2.4, tipY - uy * ferrule * 2.4);
  ctx.stroke();
  ctx.strokeStyle = '#e7d3a1';
  ctx.lineWidth = Math.max(9, rad * 0.42);
  ctx.beginPath();
  ctx.moveTo(sx + ux * 8, sy + uy * 8);
  ctx.lineTo(tipX - ux * ferrule, tipY - uy * ferrule);
  ctx.stroke();
  ctx.strokeStyle = '#f6f3ec';
  ctx.lineWidth = Math.max(8, rad * 0.36);
  ctx.beginPath();
  ctx.moveTo(tipX - ux * ferrule, tipY - uy * ferrule);
  ctx.lineTo(tipX - ux * rad * 0.16, tipY - uy * rad * 0.16);
  ctx.stroke();
  ctx.strokeStyle = '#3d7ec4';
  ctx.lineWidth = Math.max(7, rad * 0.3);
  ctx.beginPath();
  ctx.moveTo(tipX - ux * rad * 0.16, tipY - uy * rad * 0.16);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.restore();
}
