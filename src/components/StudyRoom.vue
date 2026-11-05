<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { galleryPhotos, wildCollage } from '../gallery.js'
import { catActivities, catRoutes, dropTarget, nearestStop, roomCloseups, shelfBooks } from '../study.js'
import StudyGlobe from './StudyGlobe.vue'
import StudyCloseup from './StudyCloseup.vue'
import StudyMonitor from './StudyMonitor.vue'
import StudyPennants from './StudyPennants.vue'
import { roomArt } from '../studyAssets.js'
import { frontFacingMatrix, roomFaceStyle } from '../studyFraming.js'
import './study-room.css'

const emit = defineEmits(['close'])
const sprites = import.meta.glob(['../assets/study/ono-*.webp','../assets/study/yuzu-*.webp'], { eager: true, query: '?url', import: 'default' })
const stride = (cat) => sprites[`../assets/study/${cat.name.toLowerCase()}-stride.webp`]
const sprite = (cat) => sprites[`../assets/study/${cat.name.toLowerCase()}-${cat.pose}.webp`]
const dialog = ref(null), stage = ref(null), closeButton = ref(null), closeup = ref(null)
const selected = ref(null)
const returning = ref(false)
const artReady = ref(false)
const webglReady = ref(false)
const artCanvas = ref(null)
let artRenderer, startingRenderer = false, roomDisposed = false
const entryKey = 'portfolio-study-entered'
const introOpen = ref(true)
const entryButton = ref(null)
try { introOpen.value = localStorage.getItem(entryKey) !== 'yes' } catch { /* The room still works without storage. */ }
async function roomLoaded({ currentTarget: image }) {
  artReady.value = true
  if (startingRenderer) return
  startingRenderer = true
  try {
    const { createRoomRenderer } = await import('./studyRoomRenderer.js')
    if (roomDisposed || !artCanvas.value) return
    artRenderer = createRoomRenderer(artCanvas.value, image, visible => { webglReady.value = visible })
    if (!artRenderer) return
    artRenderer.focus(selected.value?.id, true)
    webglReady.value = true
  } catch {
    // The same art and room controls remain usable without WebGL.
    artRenderer?.dispose()
    artRenderer = undefined
  }
}
function enterRoom() {
  introOpen.value = false
  try { localStorage.setItem(entryKey,'yes') } catch { /* Continue without saving. */ }
  nextTick(() => closeButton.value?.focus({ preventScroll:true }))
}
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
watch(selected, object => artRenderer?.focus(object?.id, motion.matches))
const neutralProjection = new DOMMatrix().toString()
const camera = reactive({ x: 0, y: 0, scale: 1, projection: neutralProjection })
const stageSize = ref(0)
const corkStyle = computed(() => roomFaceStyle('photos', stageSize.value))
const monitorStyle = computed(() => ({ ...roomFaceStyle('monitor', stageSize.value), '--screen-scale': camera.scale }))
let shelfHeight = 0, resizeRoom
const instantCamera = ref(false)
const zoomPercent = computed(() => Math.round(camera.scale * 100))
const draggingCat = ref(null)
const hoveredCat = ref(null)
const status = ref('')
const cats = reactive(['Ono','Yuzu'].map((name, i) => ({
  name, x: catRoutes[i][0][0], y: catRoutes[i][0][1], pose: 'walk',
  activity: '', waypoint: 0, facing: i === 0 ? 1 : -1, duration: 0, walking: false,
})))
let pan, catDrag, timer, previousOverflow, returnTarget, previousCamera
const stepTimers = []
const clamp = (v, low, high) => Math.min(high, Math.max(low, v))
const sceneTransform = computed(() => `translate(-50%, -50%) translate(${camera.x}%, ${camera.y}%) scale(${camera.scale}) ${camera.projection}`)
function resetCamera() {
  instantCamera.value = false
  Object.assign(camera, { x: 0, y: 0, scale: 1, projection: neutralProjection })
}
function zoom(next, event) {
  const scale = clamp(next, .75, 3.4)
  if (!stage.value || scale === camera.scale) return
  instantCamera.value = Boolean(event)
  if (event) {
    const box = stage.value.getBoundingClientRect()
    const ratio = scale / camera.scale
    camera.x = clamp(camera.x - ((event.clientX-box.left)/box.width-.5)*100*camera.scale*(ratio-1), -130, 130)
    camera.y = clamp(camera.y - ((event.clientY-box.top)/box.height-.5)*100*camera.scale*(ratio-1), -130, 130)
  }
  camera.scale = scale
}
function wheel(event) { if (!selected.value && !event.ctrlKey && !catDrag) zoom(camera.scale * Math.exp(-Math.sign(event.deltaY)*Math.min(Math.abs(event.deltaY),160)*.0025), event) }
function startPan(event) {
  if (selected.value || event.button !== 0 || event.target.closest('button') || catDrag || !stage.value) return
  pan = { id: event.pointerId, x: event.clientX, y: event.clientY }
  instantCamera.value = true
  event.currentTarget.setPointerCapture(event.pointerId)
}
function movePan(event) {
  if (pan?.id !== event.pointerId) return
  const size = stage.value.offsetWidth || 1
  camera.x = clamp(camera.x + (event.clientX-pan.x)*100/size, -130, 130)
  camera.y = clamp(camera.y + (event.clientY-pan.y)*100/size, -130, 130)
  Object.assign(pan, { x: event.clientX, y: event.clientY })
}
function stopPan(event) { if (pan?.id === event.pointerId) pan = null }
function worldPoint(clientX, clientY) {
  const box = stage.value.getBoundingClientRect()
  return [(clientX-box.left)*100/box.width, (clientY-box.top)*100/box.height]
}
function walk(i) {
  const cat = cats[i]
  if (motion.matches || introOpen.value || selected.value || draggingCat.value !== null || cat.activity || hoveredCat.value === i || catDrag?.i === i) return
  const route = catRoutes[i]
  const index = (cat.waypoint + 1) % route.length
  const [x,y] = route[index]
  cat.duration = clamp(Math.hypot(x-cat.x,y-cat.y)*380, 1100, 3800)
  cat.facing = x > cat.x ? -1 : 1
  Object.assign(cat, { x, y, waypoint: index, walking: true })
  clearTimeout(stepTimers[i])
  stepTimers[i] = setTimeout(() => { cat.walking = false },cat.duration)
}
function placeCat(i, id) {
  const cat = cats[i]
  clearTimeout(stepTimers[i])
  cat.walking = false
  if (!id) {
    const route = catRoutes[i]
    const waypoint = nearestStop(route,cat.x,cat.y)
    Object.assign(cat,{ x: route[waypoint][0], y: route[waypoint][1], waypoint, pose: 'walk', activity: '', duration: 220 })
    status.value = `${cat.name} is exploring.`
    return
  }
  const activity = catActivities[id]
  const [x,y] = activity.positions[i]
  Object.assign(cat,{ x, y, pose: activity.pose, activity: id, duration: 240, facing: i === 0 && (id === 'beanbag' || id === 'bowls') ? -1 : 1 })
  if (id === 'beanbag' && cats.every(pet => pet.activity === id)) status.value = 'Ono and Yuzu are cuddling.'
  else if (id === 'beanbag') status.value = `${cat.name} is napping.`
  else if (id === 'desk') status.value = i === 0 ? 'Ono is sitting on the keyboard.' : 'Yuzu is playing with the mouse.'
  else if (cats.every(pet => pet.activity === 'bowls')) status.value = 'Ono and Yuzu are eating.'
  else status.value = `${cat.name} is eating.`
}
function startCat(event, i) {
  if (selected.value || event.button !== 0 || pan || catDrag) return
  const box = event.currentTarget.getBoundingClientRect()
  const [x,y] = worldPoint(box.left+box.width/2, box.top+box.height*.84)
  const [pointerX,pointerY] = worldPoint(event.clientX,event.clientY)
  catDrag = { i, id: event.pointerId, x: event.clientX, y: event.clientY, dx: x-pointerX, dy: y-pointerY, moved: false }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function moveCat(event) {
  if (catDrag?.id !== event.pointerId) return
  if (!catDrag.moved && Math.hypot(event.clientX-catDrag.x,event.clientY-catDrag.y) < 5) return
  catDrag.moved = true
  draggingCat.value = catDrag.i
  const [x,y] = worldPoint(event.clientX,event.clientY)
  Object.assign(cats[catDrag.i], { x: clamp(x+catDrag.dx,4,96), y: clamp(y+catDrag.dy,10,96), duration: 0, walking: false })
}
function endCat(event, cancel = false) {
  if (catDrag?.id !== event.pointerId) return
  const { i, moved } = catDrag
  catDrag = null
  draggingCat.value = null
  if (moved) placeCat(i, cancel ? cats[i].activity : dropTarget(...worldPoint(event.clientX,event.clientY)))
  else if (!cancel) inspect({ id: cats[i].name, label: cats[i].name, x: cats[i].x, y: cats[i].y-4, cat: i }, event.currentTarget)
}
function clickCat(event,i) {
  if (selected.value?.cat === i) {
    if (!motion.matches) event.currentTarget.animate([
      { translate:'0 0', scale:1 }, { translate:'0 -12%', scale:1.08 }, { translate:'0 0', scale:1 },
    ],{ duration:440,easing:'ease-out' })
  } else if (!selected.value && event.detail === 0) {
    inspect({ id:cats[i].name, label:cats[i].name, x:cats[i].x, y:cats[i].y-4, cat:i },event.currentTarget)
  }
}
function inspect(object, trigger) {
  if (returning.value) return
  returnTarget = trigger
  previousCamera = { ...camera }
  selected.value = object
  instantCamera.value = false
  frameObject()
}
// Reframe the existing stage around the object's anchor. Wall-mounted objects
// are straightened in the same coordinate space as their live controls.
function frameObject() {
  const object = selected.value
  if (!object || !stage.value) return
  const node = stage.value
  const { clientWidth:w, clientHeight:h } = node.parentElement
  const size = node.offsetWidth || 1
  const settings = {
    books: { x:12.75, y:39.8, spread:.14, fraction:w<=650?.91:.57 },
    monitor: { x:67.8, y:41.42, spread:.206, fraction:.83 },
    photos: { x:68.8, y:28.8, spread:.26, fraction:.73 },
    record: { x:51.1, y:76.4, spread:.155, fraction:.43, cx:w>650?.39:.50, cy:w>650?.52:.44 },
    golf: { x:12.4, y:61, spread:.15, fraction:.37 },
    globe: { x:70.2, y:77.1, spread:.09, fraction:.32 },
  }[object.id] || { x:object.x, y:object.y, spread:.12, fraction:.34, cy:w>650?.50:.42, cx:w>650?.39:.5 }
  const { x,y,spread,fraction,cx=.5,cy=.52 } = settings
  const scale = Math.min(8.2, Math.min(w*fraction,h*({ books:1.06, monitor:1.5 }[object.id] || .82))/(size*spread))
  const bookHeight = shelfHeight || Math.max(145,Math.min(h*.52,w*.79,380))
  const targetY = object.id==='books' ? h/2+bookHeight/2 : h*cy
  const projection = frontFacingMatrix(object.id, size)
  const anchor = projection.transformPoint({ x: (x-50)*size/100, y: (y-50)*size/100 })
  Object.assign(camera, {
    x:(w*cx-node.offsetLeft-scale*anchor.x/anchor.w)*100/size,
    y:(targetY-node.offsetTop-scale*anchor.y/anchor.w)*100/size,
    scale, projection: projection.toString(),
  })
}
function measureShelf(value) {
  shelfHeight=value
  if (selected.value?.id==='books') frameObject()
}
function previewPhoto(index) { if (selected.value?.id==='photos') closeup.value?.openPhoto(index) }
function measureRoom() {
  stageSize.value = stage.value.offsetWidth
  frameObject()
}
function resetRoomObserver() {
  measureRoom()
  resizeRoom = new ResizeObserver(measureRoom)
  resizeRoom.observe(stage.value.parentElement)
  resizeRoom.observe(stage.value)
}
function leaveDetail() {
  returning.value = true
  selected.value = null
  instantCamera.value = false
  Object.assign(camera, previousCamera || { x: 0, y: 0, scale: 1, projection: neutralProjection })
}
function finishReturn() {
  returning.value = false
  nextTick(() => returnTarget?.focus({ preventScroll: true }))
}
function escape(event) {
  event.preventDefault()
  if (selected.value) closeup.value?.goBack()
  else if (!returning.value) emit('close')
}
function pinStyle(index) {
  return { left: `${6+index%3*31}%`, top: `${12+Math.floor(index/3)*43}%`, rotate: `${[-5,4,-3,4,-4,5][index]}deg` }
}
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  resetRoomObserver()
  const initialFocus = introOpen.value ? entryButton.value : closeButton.value
  initialFocus?.focus()
  timer = setInterval(() => { walk(0); walk(1) }, 4600)
})
onUnmounted(() => {
  roomDisposed = true
  artRenderer?.dispose()
  clearInterval(timer)
  resizeRoom?.disconnect()
  stepTimers.forEach(clearTimeout)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <dialog ref="dialog" class="room-dialog" aria-labelledby="room-title" @cancel="escape" @keydown.esc.stop="escape" @close="emit('close')">
    <header class="room-header" :inert="introOpen">
      <div class="room-title"><span>Behind the page</span><h2 id="room-title">The study room</h2></div>
      <button v-if="!selected && !returning" ref="closeButton" class="room-close" type="button" @click="emit('close')" aria-label="Close study room">×</button>
    </header>

    <div class="room-viewport" :inert="returning || introOpen" :class="{ 'is-panning': instantCamera }" @wheel="event => { if (!selected && !event.ctrlKey) { event.preventDefault(); wheel(event) } }"
      @pointerdown="startPan" @pointermove="movePan" @pointerup="stopPan" @pointercancel="stopPan" @lostpointercapture="stopPan">
      <div ref="stage" class="room-stage" :class="{ 'camera-instant': instantCamera, 'art-ready': artReady, 'art-webgl': webglReady }" :style="{ transform: sceneTransform }">
        <img class="room-art" :src="roomArt" alt="Isometric study with bamboo outside glass doors, a white desk, books, and a yellow beanbag" draggable="false" @load="roomLoaded" />
        <canvas ref="artCanvas" class="room-art room-art-canvas" aria-hidden="true"></canvas>
        <div v-if="selected?.id !== 'books'" class="overview-books" aria-hidden="true">
          <div v-for="row in 2" :key="row" class="overview-book-row" :class="'book-row-'+row">
            <span v-for="(book,i) in shelfBooks.slice((row-1)*5,row*5)" :key="i" :style="{ '--book-color':book.color }"></span>
          </div>
        </div>

        <div class="cork-pins" :class="{ 'cork-active':selected?.id === 'photos' }" :style="corkStyle" :inert="selected?.id !== 'photos'">
          <button v-for="(photo, index) in galleryPhotos" :id="`room-print-${index}`" :key="photo.caption" type="button" :aria-label="photo.caption" class="cork-print" :style="pinStyle(index)" @click="previewPhoto(index)">
            <div class="gallery-image">
              <img v-if="photo.tile !== null" :src="wildCollage" alt="" :class="`gallery-tile gallery-tile-${photo.tile}`" draggable="false" />
              <img v-else :src="photo.src" alt="" class="gallery-event" :style="{ objectPosition: photo.position }" draggable="false" />
            </div>
          </button>
        </div>
        <StudyPennants />
        <div class="room-globe-prop" :class="{ 'globe-active':selected?.id==='globe' }"><StudyGlobe :interactive="selected?.id==='globe'" /></div>
        <div v-if="selected?.id==='monitor'" class="room-live-monitor" :style="monitorStyle"><StudyMonitor /></div>

        <button v-for="object in roomCloseups" v-show="!selected" :key="object.id" type="button" class="room-hotspot"
          :aria-label="object.label"
          :style="{ left: object.x+'%', top: object.y+'%', width: object.w+'%', height: object.h+'%', '--shape': object.shape ? `polygon(${object.shape})` : 'inset(0 round 14%)' }"
          @click="inspect(object, $event.currentTarget)">
          <span class="hotspot-hit" aria-hidden="true"></span>
          <span class="room-tag" aria-hidden="true">{{ object.label }}</span>
        </button>

        <button v-for="(cat,i) in cats" :key="cat.name" class="room-cat" type="button" :aria-label="selected?.cat === i ? 'Play with '+cat.name : cat.name" :inert="!!selected && selected.cat !== i"
          :class="[cat.pose, { 'cat-held': draggingCat === i, 'cat-inspected':selected?.cat === i, 'cat-mouse': i === 1 && cat.activity === 'desk', 'cat-keyboard': i === 0 && cat.activity === 'desk', 'cat-walking': cat.walking }]"
          :style="{ left: cat.x+'%', top: cat.y+'%', '--facing': cat.facing, '--travel': cat.duration+'ms' }"
          @pointerenter="hoveredCat = i" @pointerleave="hoveredCat = null"
          @pointerdown.stop="startCat($event,i)" @pointermove.stop="moveCat"
          @pointerup.stop="endCat" @pointercancel="endCat($event,true)" @lostpointercapture="endCat($event,true)"
          @click.stop="clickCat($event,i)">
          <span v-if="cat.pose === 'walk'" class="cat-stride" aria-hidden="true" :style="{ backgroundImage: `url(${stride(cat)})` }"></span>
          <img v-else :src="sprite(cat)" alt="" draggable="false" />
          <span class="room-tag" aria-hidden="true">{{ cat.name }}</span>
          <span v-if="cat.pose === 'sleep'" class="cat-effect" aria-hidden="true">{{ cats.every(pet => pet.pose === 'sleep') ? '♡' : 'z' }}</span>
        </button>
      </div>
    </div>

    <footer class="room-controls" v-if="!selected && !returning && !introOpen">
      <p><span class="desktop-room-help">Scroll to zoom · Drag to move · Click objects to explore</span><span class="mobile-room-help">Drag to move · Tap objects to explore</span><br>Drag Ono or Yuzu to the beanbag, desk, or bowls.</p>
      <div class="zoom-controls" aria-label="Room zoom">
        <button type="button" aria-label="Zoom out" :disabled="camera.scale <= .75" @click="zoom(camera.scale/1.2)">−</button>
        <button type="button" aria-label="Reset room view" @click="resetCamera">{{ zoomPercent }}%</button>
        <button type="button" aria-label="Zoom in" :disabled="camera.scale >= 3.4" @click="zoom(camera.scale*1.2)">+</button>
      </div>
    </footer>

    <Transition name="room-angle" @after-leave="finishReturn">
      <StudyCloseup v-if="selected" ref="closeup" :object="selected"
        @measure-shelf="measureShelf"
        @back="leaveDetail" />
    </Transition>
    <div v-if="introOpen" class="room-intro">
      <div>
        <button ref="entryButton" type="button" @click="enterRoom">Enter the study</button>
        <p><span class="desktop-room-help">Scroll to zoom · Drag to move</span><span class="mobile-room-help">Drag to move · Use +/− to zoom</span><br>Explore objects and move Ono &amp; Yuzu.</p>
      </div>
    </div>
    <p class="room-status" role="status">{{ status }}</p>
  </dialog>
</template>
