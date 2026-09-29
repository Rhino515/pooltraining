/**
 * First-person table view. Same diagram coordinates as the 2D table (x along the length,
 * diagram y becomes z). The camera starts behind the cue ball and can orbit a little.
 * Drawing this never moves the balls.
 */
const f2 = (v) => Math.round(v * 100) / 100;

export function cameraBehind(cue, yaw = 0, pitch = 0) {
  const c = cue || { x: 25, y: 25 };
  const look = { x: c.x * 0.42 + 50 * 0.58, y: 0.4, z: c.y * 0.42 + 25 * 0.58 };
  let dx = c.x - look.x;
  let dz = c.y - look.z;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const rx = dx * cy - dz * sy;
  const rz = dx * sy + dz * cy;
  const dist = 34;
  return {
    x: c.x + rx * dist,
    y: 14 + pitch,
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
  // right = forward × worldUp (world up is +y)
  let rx = fy * 0 - fz * 1;
  let ry = fz * 0 - fx * 0;
  let rz = fx * 1 - fy * 0;
  // forward × up = (fy*0 - fz*1, fz*0 - fx*0, fx*1 - fy*0) = (-fz, 0, fx)
  rx = -fz; ry = 0; rz = fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  // up = right × forward
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;
  return { fx, fy, fz, rx, ry, rz, ux, uy, uz };
}

export function project(p, cam, w, h) {
  const b = cam._b || (cam._b = basis(cam));
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  const x = dx * b.rx + dy * b.ry + dz * b.rz;
  const y = dx * b.ux + dy * b.uy + dz * b.uz;
  const z = dx * b.fx + dy * b.fy + dz * b.fz;
  if (z < 0.4) return null;
  const f = (h * 0.5) / Math.tan((42 * Math.PI) / 180);
  return { x: w / 2 + (x / z) * f, y: h / 2 - (y / z) * f, z, s: f / z };
}

function ballFill(id) {
  const colors = { cue: '#f5f7fa', 1: '#f5d76e', 2: '#3b82f6', 3: '#ef4444', 4: '#7c3aed', 5: '#f97316', 6: '#16a34a', 7: '#a16207', 8: '#d7dde6', 9: '#eab308', 10: '#2563eb', 11: '#dc2626', 12: '#6d28d9', 13: '#ea580c', 14: '#15803d', 15: '#c4a574' };
  return colors[id] || '#94a3b8';
}

/** Draw the real balls and rails. `balls` is read only. */
export function drawTable3D(ctx, w, h, { balls, ballR, yaw = 0, pitch = 0 }) {
  const cue = (balls || []).find((b) => b.id === 'cue');
  const cam = cameraBehind(cue, yaw, pitch);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#071018';
  ctx.fillRect(0, 0, w, h);
  const corner = (x, z, y = 0) => project({ x, y, z }, cam, w, h);
  const felt = [corner(0, 0), corner(100, 0), corner(100, 50), corner(0, 50)];
  const rail = [corner(-3.2, -3.2, 1.6), corner(103.2, -3.2, 1.6), corner(103.2, 53.2, 1.6), corner(-3.2, 53.2, 1.6)];
  const feltBot = [corner(0, 0, -1.2), corner(100, 0, -1.2), corner(100, 50, -1.2), corner(0, 50, -1.2)];
  function poly(pts, fill, stroke) {
    if (pts.some((p) => !p)) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  poly(rail, '#4a2915', '#2a160c');
  poly(feltBot, '#023844');
  poly(felt, '#066b83', '#9fe7f2');
  // diamonds along the far and near long rails, in the same 12.5 grid as 2D
  ctx.fillStyle = '#f4f6fb';
  for (const x of [12.5, 25, 37.5, 62.5, 75, 87.5]) {
    for (const z of [-1.3, 51.3]) {
      const p = corner(x, z, 1.7);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, 1.1 * p.s), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const pockets = [[0, 0], [50, 0], [100, 0], [0, 50], [50, 50], [100, 50]];
  const items = [];
  for (const [x, z] of pockets) {
    const p = corner(x, z, 0.2);
    if (p) items.push({ z: p.z, draw: () => { ctx.beginPath(); ctx.fillStyle = '#05070a'; ctx.arc(p.x, p.y, Math.max(4, 2.3 * p.s), 0, Math.PI * 2); ctx.fill(); } });
  }
  for (const b of balls || []) {
    const p = project({ x: b.x, y: ballR, z: b.y }, cam, w, h);
    if (!p) continue;
    const rad = Math.max(3, ballR * p.s);
    items.push({
      z: p.z,
      draw: () => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.ellipse(p.x + rad * 0.15, p.y + rad * 0.85, rad * 0.9, rad * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = ballFill(b.id);
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.arc(p.x - rad * 0.28, p.y - rad * 0.32, rad * 0.28, 0, Math.PI * 2);
        ctx.fill();
        if (b.id !== 'cue') {
          ctx.fillStyle = '#0b1218';
          ctx.font = `700 ${Math.max(8, rad * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(b.id), p.x, p.y + rad * 0.05);
        }
      }
    });
  }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) it.draw();
  ctx.fillStyle = '#c5d0dc';
  ctx.font = '600 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Behind the cue ball', 12, 18);
  return { camYaw: f2(yaw) };
}
