import {
  AmbientLight, BoxGeometry, CanvasTexture, CatmullRomCurve3, CylinderGeometry,
  DirectionalLight, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry,
  RepeatWrapping, Scene, SphereGeometry, SRGBColorSpace, TextureLoader, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import globeMap from '../assets/study/world-visited.webp'
import { shelfBooks } from '../study.js'

export const shelfAnchor = [358, 998]
export const recordAnchor = [1274, 2150]
export const globeAnchor = [1760, 2013]

const agedBrass = '#b29362'

function fabricCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(64, 64)
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y*64+x)*4
    const thread = ((x+y)%4 === 0 ? 22 : -14) + 9*Math.sin(x*2.97+y*1.45)
    image.data.fill(128+thread, i, i+3)
    image.data[i+3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function woodTexture(color = '#b5814d') {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (let y = 0; y < canvas.height; y++) {
    const shade = (1 + Math.sin(y * 4.631)) * .08
    ctx.strokeStyle = y % 3 ? `rgba(255,221,174,${shade})` : `rgba(95,52,24,${shade})`
    ctx.beginPath()
    for (let x = 0; x <= canvas.width; x += 16) {
      const grain = y + Math.sin(x * .009 + y * .13) * 1.9 + Math.sin(x * .025 + y * .51) * .7
      if (x === 0) ctx.moveTo(x, grain)
      else ctx.lineTo(x, grain)
    }
    ctx.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function part(group, geometry, material, x, y, z) {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  group.add(mesh)
  return mesh
}

function box(group, material, w, h, d, x, y, z) {
  return part(group, new BoxGeometry(w, h, d), material, x, y, z)
}

function cylinder(group, material, r, h, x, y, z) {
  return part(group, new CylinderGeometry(r, r, h, 80), material, x, y, z)
}

function lathe(group, material, outline, x = 0, y = 0, z = 0) {
  return part(group, new LatheGeometry(outline.map(([r,h]) => new Vector2(r,h)), 72), material, x, y, z)
}

function piping(group, material, points, radius, closed = false) {
  const curve = new CatmullRomCurve3(points.map(point => new Vector3(...point)), closed)
  return part(group, new TubeGeometry(curve, 64, radius, 8, closed), material, 0, 0, 0)
}

function golfBag(fabric) {
  const group = new Group()
  const bumpMap = new CanvasTexture(fabric)
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping
  bumpMap.repeat.set(7, 10)
  const cloth = document.createElement('canvas')
  cloth.width = 128
  cloth.height = 256
  const ctx = cloth.getContext('2d')
  const surface = ctx.createImageData(128,256)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
    const i = (y*128+x)*4
    const light = 236 + 6*Math.sin(x*.31+y*.18) + 5*Math.cos(y*.42-x*.28) + ((x+y)%4===0 ? 7 : -4)
    surface.data.fill(light,i,i+3)
    surface.data[i+3] = 255
  }
  ctx.putImageData(surface,0,0)
  const map = new CanvasTexture(cloth)
  map.colorSpace = SRGBColorSpace
  const canvas = new MeshStandardMaterial({ color:'#88845c', map, bumpMap, bumpScale:1.04, roughness:.97 })
  const pocket = new MeshStandardMaterial({ color:'#918a63', map, bumpMap, bumpScale:.89, roughness:.95 })
  const trim = new MeshStandardMaterial({ color:'#bfa77e', roughness:.75 })
  const webbing = new MeshStandardMaterial({ color:'#50482f', bumpMap, bumpScale:.38, roughness:.94 })
  const inner = new MeshStandardMaterial({ color:'#393a2c', roughness:.9 })
  const hardware = new MeshStandardMaterial({ color:agedBrass, roughness:.46, metalness:.22 })
  const steel = new MeshStandardMaterial({ color:'#bfb7a6', roughness:.34, metalness:.34 })

  lathe(group, canvas, [[0,1],[55,1],[67,5],[74,17],[75,35],[71,52],[69,93],[67,163],[66,237],
    [65,309],[65,352],[68,366],[69,400],[67,417],[62,422],[55,420],[52,411],[52,364],[0,364]])
  lathe(group, inner, [[54,414],[50.7,406],[50.7,366],[0,366]])
  for (const [radius,y,tube,material] of [[66,416,3.5,trim],[67,365,3,trim],[75,36,2.5,webbing]]) {
    part(group, new TorusGeometry(radius,tube,10,72), material, 0, y, 0).rotation.x = Math.PI/2
  }

  const front = new Group()
  front.position.set(12, 116, 65)
  front.rotation.z = -.04
  part(front, new RoundedBoxGeometry(103,143,43,5,18), pocket, 0, 0, 0)
  piping(front, trim, [[-43,53,17],[-30,66,20],[32,66,20],[45,50,19],[45,-51,19],
    [30,-65,20],[-31,-65,20],[-45,-49,18]], 1.85, true)
  part(front, new RoundedBoxGeometry(5,16,3,2,1.4), hardware, -42, 11, 22).rotation.z = -.28
  group.add(front)

  const side = new Group()
  side.position.set(-56, 165, 34)
  side.rotation.set(-.06, -.55, -.14)
  part(side, new RoundedBoxGeometry(50,177,38,4,14), canvas, 0, 0, 0)
  piping(side, trim, [[-20,73,16],[-10,82,18],[11,82,18],[21,70,16],[21,-70,16],
    [11,-81,18],[-11,-81,18],[-21,-70,16]], 1.55, true)
  group.add(side)
  piping(group, webbing, [[-47,349,19],[-69,327,21],[-91,278,20],[-93,212,12],[-77,152,1]], 6)
  piping(group, trim, [[-48,347,24],[-69,326,26],[-91,278,24],[-94,211,16],[-77,153,5]], 1.15)
  const clasp = part(group, new TorusGeometry(8,1.6,8,28), hardware, -52, 341, 30)
  clasp.scale.set(.78,1.2,1)
  piping(group, trim, [[-32,319,56],[-33,275,57],[-32,222,57],[-33,179,59]], .85)

  for (const [x,z,tipX,tipY,tipZ,headAngle] of [
    [-29,9,-48,473,10,.14],[-12,-25,-18,520,-23,.44],[19,-19,24,529,-20,.37],[32,14,54,486,19,.42],
  ]) {
    const shaft = [[x,383,z],[tipX,tipY,tipZ]]
    piping(group, steel, shaft, 3.4)
    piping(group, inner, [[x,377,z],[x+(tipX-x)*.34,383+(tipY-383)*.34,z+(tipZ-z)*.34]], 4.9)
    const head = new Group()
    head.position.set(tipX+(tipX<0?-14:12),tipY+8,tipZ+2)
    head.rotation.set(.12, .23, headAngle*(tipX<0?-1:1))
    if (tipY >= 520) {
      part(head, new SphereGeometry(1, 40, 28), steel, 0, 0, 0).scale.set(28,16,14)
    } else {
      part(head, new RoundedBoxGeometry(54,29,21,5,10), steel, 0, 0, 0)
      for (let line = -2; line <= 2; line++) box(head, inner, 29, .55, .6, 0, line*2.6, 10.5)
    }
    group.add(head)
  }
  return group
}

function turntable(grain) {
  const group = new Group()
  const walnut = new MeshStandardMaterial({ map: grain, color: '#a78d75', roughness: .77 })
  const dark = new MeshStandardMaterial({ color: '#22201d', roughness: .72 })
  const vinyl = new MeshStandardMaterial({ color: '#1c1b19', roughness: .46 })
  const brass = new MeshStandardMaterial({ color: '#d6ac69', roughness: .38, metalness: .18 })
  const metal = new MeshStandardMaterial({ color: '#bfb8a9', roughness: .36, metalness: .18 })
  const glass = new MeshStandardMaterial({ color: '#7f6450', transparent: true, opacity: .22, depthWrite: false, roughness: .33 })

  part(group, new RoundedBoxGeometry(270, 39, 184, 3, 3.5), walnut, 0, 23, 0)
  part(group, new RoundedBoxGeometry(270, 5, 184, 2, 2), dark, 0, 3, 0)
  box(group, walnut, 267, 2, 180, 0, 42, 0)
  for (const x of [-106, 106]) for (const z of [-64, 64]) cylinder(group, dark, 12, 7, x, 2, z)

  cylinder(group, dark, 79, 8, -26, 47, 1)
  cylinder(group, vinyl, 77, 3, -26, 53, 1)
  for (let radius = 30; radius <= 75; radius += 3) {
    const groove = part(group, new TorusGeometry(radius, .22, 4, 80), dark, -26, 54.55, 1)
    groove.rotation.x = Math.PI / 2
  }
  cylinder(group, brass, 23, .4, -26, 55, 1)
  cylinder(group, metal, 2, 5, -26, 57, 1)
  for (const x of [72, 102]) {
    cylinder(group, dark, 8.7, 2, x, 21, 92).rotation.x = Math.PI / 2
    cylinder(group, brass, 7.4, 4, x, 21, 94).rotation.x = Math.PI / 2
  }
  cylinder(group, dark, 8, 5, 105, 44, 63)
  cylinder(group, dark, 12, 9, 104, 47, -53)
  cylinder(group, metal, 5, 9, 104, 53, -53)
  const arm = new CatmullRomCurve3([
    new Vector3(104, 57, -53), new Vector3(99, 59, -15),
    new Vector3(80, 57, 31), new Vector3(48, 55, 48),
  ])
  part(group, new TubeGeometry(arm, 36, 2.2, 8, false), metal, 0, 0, 0)
  box(group, dark, 17, 5, 9, 43, 55, 49).rotation.y = -.37

  const lid = new Group()
  lid.position.set(0, 45, -86)
  lid.rotation.x = -.24
  box(lid, glass, 259, 111, 2, 0, 58, 0)
  const trim = new MeshStandardMaterial({ color: '#85776a', transparent: true, opacity: .78, roughness: .5 })
  for (const x of [-130, 130]) box(lid, trim, 3, 116, 4, x, 58, 0)
  for (const y of [1, 115]) box(lid, trim, 262, 3, 4, 0, y, 0)
  group.add(lid)
  return group
}

function listeningStation(grain, shadow) {
  const group = new Group()
  const tableGrain = woodTexture('#d5ab76')
  const oak = new MeshStandardMaterial({ map:tableGrain, color:'#fff0dc', roughness:.75 })
  const edge = new MeshStandardMaterial({ map:tableGrain, color:'#deb180', roughness:.8 })
  cylinder(group, edge, 151, 162, 0, 81, 0)
  cylinder(group, edge, 256, 20, 0, 170, 0)
  cylinder(group, oak, 254, 5, 0, 181, 0)
  const bevel = part(group, new TorusGeometry(252.5, 2.1, 8, 96), oak, 0, 182, 0)
  bevel.rotation.x = Math.PI / 2
  const contact = part(group, new PlaneGeometry(345, 245), shadow, 9, 183.6, -55)
  contact.rotation.x = -Math.PI / 2
  const player = turntable(grain)
  player.position.set(9, 184, -55)
  group.add(player)
  return group
}

function globeModel(grain) {
  const group = new Group()
  const wood = new MeshStandardMaterial({ map: grain, color:'#b39176', roughness:.7 })
  const brass = new MeshStandardMaterial({ color:agedBrass, roughness:.41, metalness:.22 })
  lathe(group, wood, [[0,0],[34,0],[38,1],[40,3],[40,7],[38,9],[35,10],[0,10]])
  cylinder(group, wood, 10, 41, 0, 22, 0)
  const mount = part(group, new TorusGeometry(86, 3.3, 10, 80, Math.PI), brass, 0, 113, 0)
  mount.rotation.z = -1.96
  const earthMaterial = new MeshStandardMaterial({ color:'#fff2d6', roughness:.82 })
  const axis = new Group()
  axis.position.y = 113
  axis.rotation.z = -.22
  const earth = part(axis, new SphereGeometry(77, 112, 72), earthMaterial, 0, 0, 0)
  group.add(axis)
  return { group, earth, earthMaterial }
}

function shadowMaterial() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const shade = ctx.createRadialGradient(64, 64, 10, 64, 64, 64)
  shade.addColorStop(0, '#52321879')
  shade.addColorStop(.56, '#52321850')
  shade.addColorStop(1, '#52321800')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, 128, 128)
  return new MeshBasicMaterial({ map:new CanvasTexture(canvas), transparent:true, depthWrite:false })
}

function bookTexture(book, spine, fabric) {
  const canvas = document.createElement('canvas')
  canvas.width = spine ? 180 : 540
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = book.color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const light = ctx.createLinearGradient(0, 0, canvas.width, 0)
  light.addColorStop(0, '#fff1d038')
  light.addColorStop(.48, '#fff1d000')
  light.addColorStop(1, '#1d160d34')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = 'soft-light'
  ctx.globalAlpha = .32
  ctx.fillStyle = ctx.createPattern(fabric, 'repeat')
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = book.ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (spine) {
    ctx.translate(90, 512)
    ctx.rotate(-Math.PI / 2)
    ctx.font = '650 46px system-ui'
    ctx.fillText(book.label, 0, 0, 900)
  } else {
    ctx.strokeStyle = '#fff2d8a8'
    ctx.lineWidth = 3
    ctx.strokeRect(42, 105, 456, 814)
    ctx.font = '500 25px monospace'
    ctx.fillText('S T U D Y   S H E L F', 270, 447)
    ctx.font = '700 63px system-ui'
    ctx.fillText(book.label, 270, 677, 410)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function createStudyModels(requestDraw) {
  const scene = new Scene()
  const shadows = new Scene()
  const booksScene = new Scene()
  const grain = woodTexture()
  const fabric = fabricCanvas()
  const oak = new MeshStandardMaterial({ map: grain, roughness: .82 })
  const shelves = [0, 1].map(row => {
    const group = new Group()
    const plank = part(group, new RoundedBoxGeometry(1, 1, 1, 2, .018), oak, 0, 0, 0)
    const rowBooks = new Group()
    shelfBooks.slice(row*5, row*5+5).forEach((book,i) => {
      const cover = new MeshStandardMaterial({ color:book.color, roughness:.91 })
      const pages = new MeshStandardMaterial({ color:'#ded0b5', roughness:.95 })
      const height = book.height * 1.26
      box(rowBooks, [cover,pages,pages,pages,cover,cover], 41, height, 68, (i-2)*46, height/2, -9)
    })
    group.add(rowBooks)
    scene.add(group)
    return { group, plank, rowBooks }
  })
  const shadow = shadowMaterial()
  const record = listeningStation(grain, shadow)
  const recordShadow = part(shadows, new PlaneGeometry(1, 1), shadow, 0, 0, 0)
  const shelfShadows = shelves.map(() => part(shadows, new PlaneGeometry(1, 1), shadow, 0, 0, 0))
  const globeShadow = part(shadows, new PlaneGeometry(1, 1), shadow, 0, 0, 0)
  const golfShadow = part(shadows, new PlaneGeometry(1, 1), shadow, 0, 0, 0)
  const globe = globeModel(grain)
  const golf = golfBag(fabric)
  const sun = new DirectionalLight('#fff3df', 2.35)
  sun.position.set(-3, 6, 8)
  const fill = new DirectionalLight('#f6dec2', .36)
  fill.position.set(4, 2, -4)
  scene.add(record, globe.group, golf, sun, fill, new AmbientLight('#fff7eb', 1.46))
  const bookBox = new BoxGeometry(1, 1, 1)
  const paper = new MeshBasicMaterial({ color: '#d8c6a8' })
  const books = [], appearances = new Map()
  let disposed = false
  new TextureLoader().load(globeMap, texture => {
    if (disposed) { texture.dispose(); return }
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 4
    globe.earthMaterial.map = texture
    globe.earthMaterial.needsUpdate = true
    requestDraw()
  })

  function appearance(book) {
    if (appearances.has(book.number)) return appearances.get(book.number)
    const spine = new MeshBasicMaterial({ map: bookTexture(book, true, fabric) })
    const cover = new MeshBasicMaterial({ map: bookTexture(book, false, fabric) })
    const back = new MeshBasicMaterial({ color: book.color })
    const materials = [cover, paper, paper, paper, spine, back]
    appearances.set(book.number, materials)
    if (book.cover) new TextureLoader().load(book.cover, texture => {
      if (disposed) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      cover.map.dispose()
      cover.map = texture
      requestDraw()
    })
    return materials
  }

  function drawBooks(layout, opacity, viewportHeight) {
    books.forEach(mesh => { mesh.visible = false })
    if (!layout || !opacity) return
    for (const row of layout.rows) for (const { book, pose } of row.books) {
      let mesh = books[book.id]
      if (!mesh) {
        mesh = books[book.id] = new Mesh(bookBox, appearance(book))
        booksScene.add(mesh)
      }
      mesh.visible = true
      mesh.scale.set(pose.ws, layout.height, pose.depth)
      mesh.position.set(pose.x, viewportHeight/2-row.centerY-pose.y, pose.z)
      mesh.rotation.set(-pose.rx * Math.PI / 180, pose.ry * Math.PI / 180, 0)
    }
    for (const materials of appearances.values()) for (const material of materials) {
      material.transparent = opacity < 1
      material.opacity = opacity
    }
  }

  function dispose() {
    disposed = true
    const geometries = new Set([bookBox]), materials = new Set([paper]), textures = new Set([grain])
    for (const root of [scene, shadows, booksScene]) root.traverse(node => {
      if (!node.isMesh) return
      geometries.add(node.geometry)
      for (const material of [].concat(node.material)) materials.add(material)
    })
    for (const appearance of appearances.values()) for (const material of appearance) materials.add(material)
    for (const material of materials) {
      if (material.map) textures.add(material.map)
      if (material.bumpMap) textures.add(material.bumpMap)
      material.dispose()
    }
    for (const geometry of geometries) geometry.dispose()
    for (const texture of textures) texture.dispose()
  }
  return { scene, shadows, booksScene, shelves, record, recordShadow, shelfShadows, globe, globeShadow, golf, golfShadow, drawBooks, dispose }
}
