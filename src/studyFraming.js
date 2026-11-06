const artworkSize = 2508
const monitorWidth = 425
const monitorHeight = monitorWidth * 9 / 16
const monitorLeft = 1490, monitorRight = monitorLeft + monitorWidth
const monitorBottomLeft = 1052, monitorBottomRight = 1228
export const roomFloorPitch = 28.5 * Math.PI / 180
export const closeupFloorPitch = Math.PI / 6
export const golfAnchor = [314, 1767]
export const golfFrame = {
  x: golfAnchor[0] / artworkSize * 100,
  y: (golfAnchor[1] - 280) / artworkSize * 100,
  width: 224 / artworkSize,
  height: 576 / artworkSize,
}
export const leftWallEdge = [[123, 726], [1254, 153]]
const rightWallEdge = [[1254, 153], [2379, 724]]

function wallFace(edge, left, top, width, height) {
  const [[x1, y1], [x2, y2]] = edge
  const rise = width * (y2 - y1) / (x2 - x1)
  return [[left, top], [left + width, top + rise], [left + width, top + rise + height], [left, top + height]]
}
const shelfWallFace = wallFace(leftWallEdge, 226, 1058, 264, 21)

export const monitorFrame = {
  x: (monitorLeft + monitorRight) / 2 / artworkSize * 100,
  y: (monitorBottomLeft + monitorBottomRight - monitorHeight) / 2 / artworkSize * 100,
  spread: monitorWidth / artworkSize,
}

// Front faces measured in the room artwork, clockwise from the upper left.
const faces = {
  monitor: [
    [monitorLeft, monitorBottomLeft - monitorHeight],
    [monitorRight, monitorBottomRight - monitorHeight],
    [monitorRight, monitorBottomRight],
    [monitorLeft, monitorBottomLeft],
  ],
  photos: wallFace(rightWallEdge, 1390, 330, 650, 388),
  books: shelfWallFace,
  golf: shelfWallFace,
}

function artworkPlane(corners, size) {
  const [a, b, c, d] = corners.map(([x, y]) => [x * size / artworkSize, y * size / artworkSize])
  const width = (b[0] - a[0] + c[0] - d[0]) / 2
  const height = (d[1] - a[1] + c[1] - b[1]) / 2
  const ux = b[0] - c[0], uy = b[1] - c[1]
  const vx = d[0] - c[0], vy = d[1] - c[1]
  const dx = a[0] - b[0] + c[0] - d[0]
  const dy = a[1] - b[1] + c[1] - d[1]
  const det = ux * vy - uy * vx
  const g = (dx * vy - dy * vx) / det
  const h = (ux * dy - uy * dx) / det
  const toArtwork = new DOMMatrix([
    (b[0] * (1 + g) - a[0]) / width, (b[1] * (1 + g) - a[1]) / width, 0, g / width,
    (d[0] * (1 + h) - a[0]) / height, (d[1] * (1 + h) - a[1]) / height, 0, h / height,
    0, 0, 1, 0,
    a[0], a[1], 0, 1,
  ])
  return { width, height, toArtwork }
}

export function frontFacingMatrix(id, size) {
  if (id === 'record' || id === 'globe') {
    return new DOMMatrix().scale(1, Math.sin(closeupFloorPitch) / Math.sin(roomFloorPitch))
  }
  if (!faces[id]) return new DOMMatrix()
  const { toArtwork, width, height } = artworkPlane(faces[id], size)
  // Keep coordinates relative to the stage's center, its CSS transform origin.
  return new DOMMatrix().translate(-width / 2, -height / 2)
    .multiply(toArtwork.inverse()).translate(size / 2, size / 2)
}

export function roomFaceStyle(id, size) {
  if (!size) return { visibility: 'hidden' }
  const { width, height, toArtwork } = artworkPlane(faces[id], size)
  return { width: `${width}px`, height: `${height}px`, transform: toArtwork.toString() }
}
