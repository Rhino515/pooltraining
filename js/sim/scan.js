/**
 * Scan Table.
 *
 * There is no ball detector in this static PWA (no server, no vision library, no paid API).
 * detectBalls() is the plug-in point: it returns available:false until a real detector exists.
 * The screen must say "Place the balls to match your photo" and must not claim anything was detected.
 *
 * perspectiveWarp() is a real manual 4-corner straighten (two affine triangles). It only runs
 * after the user drags the corners. It does not find the table by itself.
 */

export const SCAN_PLACE_LABEL = 'Place the balls to match your photo';

/** Future detector hook. Today it never returns balls. */
export async function detectBalls(_image) {
  return { available: false, balls: null, label: SCAN_PLACE_LABEL };
}

function solve3(m, d) {
  // m is 3x3 row-major, d length 3. Cramer's rule.
  const det = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  const A = [m[0], m[1], m[2]];
  const B = [m[3], m[4], m[5]];
  const C = [m[6], m[7], m[8]];
  const D0 = det(A, B, C) || 1e-9;
  const dx = [d[0], d[1], d[2]];
  return [det(dx, B, C) / D0, det(A, dx, C) / D0, det(A, B, dx) / D0];
}

/** Map triangle src → dst and draw the image through it. */
function drawTri(ctx, img, src, dst) {
  const sm = [src[0].x, src[0].y, 1, src[1].x, src[1].y, 1, src[2].x, src[2].y, 1];
  const ax = solve3(sm, [dst[0].x, dst[1].x, dst[2].x]);
  const ay = solve3(sm, [dst[0].y, dst[1].y, dst[2].y]);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dst[0].x, dst[0].y);
  ctx.lineTo(dst[1].x, dst[1].y);
  ctx.lineTo(dst[2].x, dst[2].y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(ax[0], ay[0], ax[1], ay[1], ax[2], ay[2]);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/**
 * Warp `img` so the user's 4 corners (TL, TR, BR, BL, in image pixels) become a 2:1 rectangle.
 * Returns a canvas, or null if corners are missing.
 */
export function perspectiveWarp(img, corners, width = 600) {
  if (!img || !corners || corners.length !== 4) return null;
  const height = Math.round(width / 2);
  const dst = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawTri(ctx, img, [corners[0], corners[1], corners[2]], [dst[0], dst[1], dst[2]]);
  drawTri(ctx, img, [corners[0], corners[2], corners[3]], [dst[0], dst[2], dst[3]]);
  return canvas;
}

/** Default corners: a margin inside the photo, TL TR BR BL. */
export function defaultCorners(w, h) {
  const m = 0.08;
  return [
    { x: w * m, y: h * m },
    { x: w * (1 - m), y: h * m },
    { x: w * (1 - m), y: h * (1 - m) },
    { x: w * m, y: h * (1 - m) }
  ];
}
