const artworkSize = 2508

// Front faces measured in the room artwork, clockwise from the upper left.
const faces = {
  monitor: [[1446, 855], [1953, 1072], [1953, 1238], [1446, 1029]],
  photos: [[1389, 372], [2047, 660], [2047, 1064], [1388, 785]],
  books: [[226, 1058], [490, 938], [490, 959], [226, 1079]],
  record: [[1119, 1956], [1364, 1991], [1364, 2033], [1119, 1998]],
  golf: [[260, 1397], [386, 1397], [390, 1774], [264, 1774]],
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
