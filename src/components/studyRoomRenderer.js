import { CanvasTexture, MathUtils, Matrix4, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, WebGLRenderer } from 'three'
import { createStudyModels, globeAnchor, recordAnchor, shelfAnchor } from './studyModels.js'

const CAMERA_ARCS = {
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

export function createRoomRenderer(canvas, stage, image, patches, onVisibility) {
  const context = canvas.getContext('webgl2', {
    alpha: true, antialias: true, depth: true, stencil: false,
  })
  if (!context) return null
  const renderer = new WebGLRenderer({ canvas, context, alpha: true })
  renderer.autoClear = false
  renderer.setClearColor(0, 0)

  const art = document.createElement('canvas')
  art.width = image.naturalWidth
  art.height = image.naturalHeight
  const artContext = art.getContext('2d')
  artContext.drawImage(image, 0, 0)
  artContext.drawImage(patches, 0, 0, art.width, art.height)
  const texture = new CanvasTexture(art)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy())
  texture.needsUpdate = true
  const geometry = new PlaneGeometry(100, 100, 80, 80)
  const vertices = geometry.attributes.position
  for (let i = 0; i < vertices.count; i++) {
    vertices.setZ(i, roomDepth(vertices.getX(i) + 50, 50 - vertices.getY(i)))
  }
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false })
  material.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      vec4 source = texture2D(map, vMapUv);
      vec2 texel = 1.0 / vec2(textureSize(map, 0));
      float magnified = 1.0 - smoothstep(0.35, 0.9, max(length(dFdx(vMapUv) / texel), length(dFdy(vMapUv) / texel)));
      vec3 nearby = (texture2D(map, vMapUv + vec2(texel.x, 0.0)).rgb +
        texture2D(map, vMapUv - vec2(texel.x, 0.0)).rgb +
        texture2D(map, vMapUv + vec2(0.0, texel.y)).rgb +
        texture2D(map, vMapUv - vec2(0.0, texel.y)).rgb) * 0.25;
      diffuseColor *= vec4(clamp(source.rgb + (source.rgb - nearby) * magnified * 0.4 * smoothstep(0.8, 1.0, source.a), 0.0, 1.0), source.a);
    `)
  }
  const scene = new Scene()
  const roomMesh = new Mesh(geometry, material)
  roomMesh.frustumCulled = false
  scene.add(roomMesh)
  const camera = new OrthographicCamera(-50, 50, 50, -50, .1, 300)
  const propCamera = new OrthographicCamera(-1, 1, 1, -1, 1, 5000)
  propCamera.position.z = 2400
  const bookCamera = new PerspectiveCamera(1, 1, 1, 4000)
  bookCamera.position.z = 2200
  const models = createStudyModels(() => invalidate())
  const viewportTransform = new Matrix4(), stageTransform = new Matrix4()
  const translation = new Matrix4(), scaleMatrix = new Matrix4()
  let frame = 0, lost = false, disposed = false, subject, lastSubject, shelfLayout
  let width = 0, height = 0, dpr = 0, movingUntil = 0, focusStart = -Infinity
  let yaw = 0, pitch = 0, shelfAmount = 0, recordAmount = 0
  let startShelf = 0, startRecord = 0, arcYaw = 0, arcPitch = 0
  let globeAngle = 0, globeVisible = false

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return false
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3, Math.sqrt(10_000_000 / (w * h)))
    if (width === w && height === h && dpr === ratio) return true
    width = w
    height = h
    dpr = ratio
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    Object.assign(propCamera, { left:-w/2, right:w/2, top:h/2, bottom:-h/2 })
    propCamera.updateProjectionMatrix()
    bookCamera.aspect = w/h
    bookCamera.fov = MathUtils.radToDeg(2 * Math.atan(h / (2 * bookCamera.position.z)))
    bookCamera.updateProjectionMatrix()
    return true
  }

  function draw() {
    if (!resize()) return
    const size = stage.offsetWidth
    const left = stage.offsetLeft + size/2, top = stage.offsetTop + size/2
    const css = new DOMMatrix(getComputedStyle(stage).transform)
    function artPoint(x, y) {
      const point = css.transformPoint({ x:(x / 2508 - .5) * size, y:(y / 2508 - .5) * size })
      return { x:left + point.x / point.w - width/2, y:height/2 - top - point.y / point.w }
    }
    const pixelScale = (x, y) => (artPoint(x+20,y).x - artPoint(x-20,y).x) / 40

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
    // Project the moving room directly into the viewport buffer. The DOM uses
    // the same transform for focus, hit areas, and the live monitor.
    stageTransform.fromArray(css.toFloat64Array())
    viewportTransform.makeTranslation(-1, 1, 0)
      .multiply(scaleMatrix.makeScale(2/width, -2/height, 1))
      .multiply(translation.makeTranslation(left, top, 0))
      .multiply(stageTransform)
      .multiply(scaleMatrix.makeScale(size/2, -size/2, 1))
    camera.projectionMatrix.premultiply(viewportTransform)
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
    renderer.clear()
    renderer.render(scene, camera)

    const recordPoint = artPoint(...recordAnchor)
    const recordScale = pixelScale(...recordAnchor)
    models.record.position.set(recordPoint.x, recordPoint.y, 0)
    models.record.scale.setScalar(recordScale)
    models.record.rotation.set(.58*(1-recordAmount), -.42*(1-recordAmount), .10*(1-recordAmount), 'ZXY')
    models.recordShadow.position.set(recordPoint.x, recordPoint.y - 6*recordScale, 0)
    models.recordShadow.scale.set(350*recordScale, (120 - 72*recordAmount)*recordScale, 1)

    const globePoint = artPoint(...globeAnchor)
    const globeScale = pixelScale(...globeAnchor)
    globeVisible = Math.abs(globePoint.x) < width/2 + 95*globeScale && Math.abs(globePoint.y) < height/2 + 200*globeScale
    models.globe.group.visible = globeVisible
    models.globe.group.position.set(globePoint.x, globePoint.y, 0)
    models.globe.group.scale.setScalar(globeScale)
    models.globe.earth.rotation.y = -globeAngle
    models.globeShadow.visible = globeVisible
    models.globeShadow.position.set(globePoint.x, globePoint.y, 0)
    models.globeShadow.scale.set(124*globeScale, 33*globeScale, 1)

    const shelfScale = pixelScale(...shelfAnchor)
    const shelfTop = shelfLayout?.surface ?? height * .71
    const extension = MathUtils.smoothstep(shelfAmount, .32, 1)
    models.shelves.forEach(({ group, plank, rowBooks }, row) => {
      const point = artPoint(322, 981 + row*194)
      group.visible = row === 0 || shelfAmount < .8
      rowBooks.visible = shelfAmount < .54
      const extend = row === 0 ? extension : 0
      group.position.set(MathUtils.lerp(point.x, 0, extend), MathUtils.lerp(point.y, height/2 - shelfTop, extend), -70)
      group.rotation.set(.46*(1-extend), .75*(1-extend), .03*(1-extend), 'ZXY')
      group.scale.setScalar(shelfScale)
      const thickness = MathUtils.lerp(22, Math.max(14, (shelfLayout?.height ?? 280)*.059)/shelfScale, extend)
      plank.scale.set(MathUtils.lerp(362, (width+80)/shelfScale, extend), thickness, 102)
      plank.position.y = -thickness/2
    })
    models.shelfShadow.visible = extension > .6
    models.shelfShadow.position.set(0, height/2-shelfTop-22, 0)
    models.shelfShadow.scale.set(width*2.1, 44, 1)
    renderer.render(models.shadows, propCamera)
    renderer.clearDepth()
    renderer.render(models.scene, propCamera)
    const bookOpacity = MathUtils.smoothstep(shelfAmount, .62, .97)
    models.drawBooks(shelfLayout, bookOpacity)
    if (shelfLayout && bookOpacity) {
      renderer.clearDepth()
      renderer.render(models.booksScene, bookCamera)
    }
  }

  function tick(now) {
    frame = 0
    const t = Math.min(1, (now - focusStart) / 660)
    const mix = 1 - (1 - t) ** 3
    const arc = t === 1 ? 0 : Math.sin(Math.PI * mix)
    yaw = arcYaw * arc
    pitch = arcPitch * arc
    shelfAmount = MathUtils.lerp(startShelf, subject === 'books' ? 1 : 0, mix)
    recordAmount = MathUtils.lerp(startRecord, subject === 'record' ? 1 : 0, mix)
    draw()
    if (now < movingUntil || t < 1) invalidate()
  }

  function invalidate(duration = 0) {
    if (lost || disposed) return
    movingUntil = Math.max(movingUntil, performance.now() + duration)
    if (!frame) frame = requestAnimationFrame(tick)
  }

  function focus(id, immediate = false) {
    const arc = CAMERA_ARCS[id ?? lastSubject] || [0, 0]
    arcYaw = arc[0]
    arcPitch = arc[1]
    lastSubject = id
    subject = id
    startShelf = shelfAmount
    startRecord = recordAmount
    focusStart = immediate ? -Infinity : performance.now()
    if (immediate && !lost) { cancelAnimationFrame(frame); tick(performance.now()) }
    else invalidate()
  }

  function setShelf(layout) { shelfLayout = layout; invalidate() }
  function setGlobeAngle(angle) { globeAngle = angle; if (globeVisible) invalidate() }

  function onLost(event) {
    event.preventDefault()
    lost = true
    cancelAnimationFrame(frame)
    frame = 0
    yaw = 0
    pitch = 0
    onVisibility(false)
  }
  function onRestored() {
    if (disposed) return
    lost = false
    tick(performance.now())
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
    models.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { focus, invalidate, setShelf, setGlobeAngle, dispose }
}
