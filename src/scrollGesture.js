// Recognize a new scroll stroke at a page edge without relying on cursor position.
export function createBoundaryGesture() {
  let lastTime = -Infinity
  let lastDirection = 0
  let edgeDirection = 0
  let peak = 0
  let floor = Infinity
  let decayed = false
  function resetEdge(direction, magnitude) {
    edgeDirection = direction
    peak = magnitude
    floor = magnitude
    decayed = false
  }
  return ({ delta, time, atEdge, blocked = false }) => {
    if (!delta) return 0
    const direction = Math.sign(delta)
    const magnitude = Math.abs(delta)
    const fresh = time - lastTime > 90 || direction !== lastDirection
    lastTime = time
    lastDirection = direction
    if (blocked || !atEdge) {
      resetEdge(0, magnitude)
      return 0
    }
    if (fresh) {
      resetEdge(0, magnitude)
      return direction
    }
    // The stroke that reaches the edge pauses there. Follow its momentum tail.
    if (edgeDirection !== direction) {
      resetEdge(direction, magnitude)
      return 0
    }
    // A renewed push after deceleration is a second stroke even if the old
    // momentum tail never stopped sending events between the two strokes.
    if (decayed && magnitude > floor + 4 && magnitude > floor * 1.8) {
      resetEdge(0, magnitude)
      return direction
    }
    peak = Math.max(peak, magnitude)
    floor = Math.min(floor, magnitude)
    if (magnitude < peak * 0.6) decayed = true
    return 0
  }
}
