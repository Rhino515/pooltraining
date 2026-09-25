/**
 * Regenerate the Shot Simulator SPEED table after changing physics constants:
 *   node scripts/gen-speed-table.mjs
 * Prints [lengths, launch speed in/s] pairs (bisection on simulated center-ball lags from the head rail).
 * Paste the output into SPEED_TABLE in js/sim/physics.js. verify.mjs checks the table still matches the physics.
 */
const P = await import('../js/sim/physics.js');
const t = P.buildSpeedTable();
console.log(JSON.stringify(t.map(([l, v]) => [l, Math.round(v * 1000) / 1000])));
