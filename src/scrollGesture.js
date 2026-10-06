// Accumulate continued scrolling only after the current page reaches its edge.
export function createBoundaryProgress() {
  let amount = 0
  let direction = 0
  return ({ delta = 0, atEdge, blocked = false, threshold = 240 }) => {
    if (blocked || !atEdge) {
      amount = 0
      direction = 0
      return { progress: 0, direction: 0 }
    }
    if (delta) {
      const movement = Math.sign(delta)
      if (movement !== direction) amount = 0
      direction = movement
      amount += Math.abs(delta)
    }
    const progress = Math.min(amount / threshold, 1)
    if (progress === 1) {
      const destination = direction
      amount = 0
      direction = 0
      return { progress, direction: destination }
    }
    return { progress, direction: 0 }
  }
}
