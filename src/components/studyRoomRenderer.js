import { MathUtils, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, SRGBColorSpace, Texture, WebGLRenderer } from 'three'

const VIEWS = {
  books: [-.19, -.065], golf: [-.16, -.095], monitor: [.18, -.045],
  photos: [.19, -.055], record: [-.09, -.15], globe: [.10, -.12],
  Ono: [-.08, -.13], Yuzu: [.08, -.13],
}

// Keep the artwork under the live controls fixed as the rest of the room turns.
const REGISTRATION = [
  [12.75, 39.8, 8, 12],  // shelves
  [67.8, 42.5, 15, 14], // monitor and desk
  [68.8, 29, 17, 12],   // corkboard and pennants
  [51.1, 77.4, 8, 7],   // turntable
  [12.4, 61, 6, 9],     // golf bag
  [70.2, 77.1, 7, 8],   // globe
]

function roomDepth(x, y) {
  const side = Math.abs(x - 50)
  const seam = 48 + .49 * side
  const wall = .46 * side + .44 * (seam - y)
  const floor = .9 * (y - 48)
  const height = MathUtils.lerp(wall, floor, MathUtils.smoothstep(y, seam - 3, seam + 3))
  const register = Math.min(...REGISTRATION.map(([u, v, w, h]) =>
    MathUtils.smoothstep(Math.hypot((x-u)/w, (y-v)/h), .85, 1.65),
  ))
  return .19 * (height - 15) * register
}

export function createRoomRenderer(canvas, image, onVisibility) {
  const context = canvas.getContext('webgl2', {
    alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
  })
  if (!context) return null
  const renderer = new WebGLRenderer({ canvas, context, alpha: true })
  const resolution = Math.min(image.naturalWidth, renderer.capabilities.maxTextureSize, 2508)
  renderer.setSize(resolution, resolution, false)
  renderer.setClearColor(0, 0)

  const texture = new Texture(image)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
  texture.needsUpdate = true
  const geometry = new PlaneGeometry(100, 100, 80, 80)
  const vertices = geometry.attributes.position
  for (let i = 0; i < vertices.count; i++) {
    vertices.setZ(i, roomDepth(vertices.getX(i) + 50, 50 - vertices.getY(i)))
  }
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  const scene = new Scene()
  scene.add(new Mesh(geometry, material))
  const camera = new OrthographicCamera(-50, 50, 50, -50, .1, 300)
  let yaw = 0, pitch = 0, frame = 0, lost = false, disposed = false

  function draw() {
    const radius = 120
    camera.position.set(radius * Math.sin(yaw) * Math.cos(pitch), radius * Math.sin(pitch), radius * Math.cos(yaw) * Math.cos(pitch))
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()
    // Cancel foreshortening at z=0, where the DOM controls are registered.
    // The relief itself still shifts under the orthographic camera.
    const basis = camera.matrixWorld.elements
    const a = basis[0], b = basis[1], c = basis[4], d = basis[5]
    const scale = .02 / (a*d-b*c)
    const projection = camera.projectionMatrix.elements
    projection[0] = d*scale
    projection[4] = -b*scale
    projection[1] = -c*scale
    projection[5] = a*scale
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    renderer.render(scene, camera)
  }

  function focus(id, immediate = false) {
    cancelAnimationFrame(frame)
    const [nextYaw, nextPitch] = VIEWS[id] || [0, 0]
    if (immediate || lost) {
      yaw = nextYaw
      pitch = nextPitch
      if (!lost) draw()
      return
    }
    const startYaw = yaw, startPitch = pitch, start = performance.now()
    function step(now) {
      const t = Math.min(1, (now - start) / 660)
      const mix = 1 - (1 - t) ** 3
      yaw = MathUtils.lerp(startYaw, nextYaw, mix)
      pitch = MathUtils.lerp(startPitch, nextPitch, mix)
      draw()
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  function onLost(event) {
    event.preventDefault()
    lost = true
    cancelAnimationFrame(frame)
    onVisibility(false)
  }
  function onRestored() {
    if (disposed) return
    lost = false
    draw()
    onVisibility(true)
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  function dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
    geometry.dispose()
    material.dispose()
    texture.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { focus, dispose }
}
