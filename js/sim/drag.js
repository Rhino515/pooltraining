/**
 * Offset drag: while a finger is down on a ball, draw that ball above the fingertip
 * so the finger does not cover it. Cue ball and object balls use the same clearance.
 */
export const FINGER_CLEARANCE_PX = 72;
/** Screen point the ball should follow (straight above the finger). */
export function offsetDragPoint(clientX, clientY, clearance = FINGER_CLEARANCE_PX) {
  return { x: clientX, y: clientY - clearance };
}
