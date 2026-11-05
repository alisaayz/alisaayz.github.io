<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { galleryPhotos, wildCollage } from '../gallery.js'
import { catActivities, catRoutes, dropTarget, nearestStop, propsInRoom, shelfBooks } from '../study.js'
import StudyGlobe from './StudyGlobe.vue'
import roomArt from '../assets/study/room.webp'
import './study-room.css'

const emit = defineEmits(['close', 'projects'])
const sprites = import.meta.glob('../assets/study/*-*.webp', { eager: true, query: '?url', import: 'default' })
const sprite = (cat) => sprites[`../assets/study/${cat.name.toLowerCase()}-${cat.pose}.webp`]
const dialog = ref(null), stage = ref(null), closeButton = ref(null), detailBack = ref(null)
const selected = ref(null), photoIndex = ref(null), bookIndex = ref(null)
const currentPhoto = computed(() => galleryPhotos[photoIndex.value])
const currentBook = computed(() => shelfBooks[bookIndex.value])
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
const camera = reactive({ x: 0, y: 0, scale: 1 })
const instantCamera = ref(false)
const zoomPercent = computed(() => Math.round(camera.scale * 100))
const draggingCat = ref(null)
const hoveredCat = ref(null)
const markedDrop = ref(null)
const status = ref('')
const cats = reactive(['Ono','Yuzu'].map((name, i) => ({
  name, x: catRoutes[i][0][0], y: catRoutes[i][0][1], pose: 'walk',
  activity: '', waypoint: 0, facing: i === 0 ? 1 : -1, duration: 0,
})))
let pan, catDrag, timer, previousOverflow, returnTarget
const clamp = (v, low, high) => Math.min(high, Math.max(low, v))
const sceneTransform = computed(() => `translate(-50%, -50%) translate(${camera.x}%, ${camera.y}%) scale(${camera.scale})`)
function resetCamera() {
  instantCamera.value = false
  Object.assign(camera, { x: 0, y: 0, scale: 1 })
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
function wheel(event) { if (!event.ctrlKey && !catDrag) zoom(camera.scale * Math.exp(-Math.sign(event.deltaY)*Math.min(Math.abs(event.deltaY),160)*.0025), event) }
function startPan(event) {
  if (event.button !== 0 || event.target.closest('button') || catDrag || !stage.value) return
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
  if (motion.matches || selected.value || draggingCat.value !== null || cat.activity || hoveredCat.value === i || catDrag?.i === i) return
  const route = catRoutes[i]
  const index = (cat.waypoint + 1) % route.length
  const [x,y] = route[index]
  cat.duration = clamp(Math.hypot(x-cat.x,y-cat.y)*380, 1100, 3800)
  cat.facing = x > cat.x ? -1 : 1
  Object.assign(cat, { x, y, waypoint: index })
}
function placeCat(i, id) {
  const cat = cats[i]
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
  if (event.button !== 0 || pan || catDrag) return
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
  Object.assign(cats[catDrag.i], { x: clamp(x+catDrag.dx,4,96), y: clamp(y+catDrag.dy,10,96), duration: 0 })
  markedDrop.value = dropTarget(x,y)
}
function endCat(event, cancel = false) {
  if (catDrag?.id !== event.pointerId) return
  const { i, moved } = catDrag
  catDrag = null
  draggingCat.value = null
  const target = markedDrop.value
  markedDrop.value = null
  if (moved) placeCat(i, cancel ? cats[i].activity : target)
  else if (!cancel) inspect({ id: cats[i].name, label: cats[i].name, x: cats[i].x, y: cats[i].y-4, cat: i }, event.currentTarget)
}
function inspect(object, trigger) {
  returnTarget = trigger
  selected.value = object
  photoIndex.value = null
  bookIndex.value = null
  instantCamera.value = false
  const scale = object.cat != null ? 2.15 : object.id === 'globe' ? 1.45 : 2.05
  Object.assign(camera, { x: (50-object.x)*scale, y: (50-object.y)*scale, scale })
  nextTick(() => detailBack.value?.focus({ preventScroll: true }))
}
function leaveDetail() {
  selected.value = null
  photoIndex.value = null
  bookIndex.value = null
  resetCamera()
  const target = returnTarget
  nextTick(() => target?.focus({ preventScroll: true }))
}
function escape(event) {
  event.preventDefault()
  if (photoIndex.value !== null) {
    photoIndex.value = null
    nextTick(() => detailBack.value?.focus())
  }
  else if (selected.value) leaveDetail()
  else emit('close')
}
function movePhoto(step) { photoIndex.value = (photoIndex.value + step + galleryPhotos.length) % galleryPhotos.length }
function pinStyle(index) {
  return { left: `${4+index%3*32}%`, top: `${10+Math.floor(index/3)*45}%`, rotate: `${[-5,4,-3,4,-4,5][index]}deg` }
}
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  closeButton.value.focus()
  timer = setInterval(() => { walk(0); walk(1) }, 4600)
})
onUnmounted(() => {
  clearInterval(timer)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <dialog ref="dialog" class="room-dialog" aria-labelledby="room-title" @cancel="escape" @keydown.esc.stop="escape" @close="emit('close')">
    <header class="room-header">
      <div class="room-title"><span>Behind the page</span><h2 id="room-title">The study room</h2></div>
      <button ref="closeButton" class="room-close" type="button" @click="emit('close')" aria-label="Close study room">×</button>
    </header>

    <div class="room-viewport" :class="{ 'is-panning': instantCamera }" @wheel.prevent="wheel"
      @pointerdown="startPan" @pointermove="movePan" @pointerup="stopPan" @pointercancel="stopPan" @lostpointercapture="stopPan">
      <div ref="stage" class="room-stage" :class="{ 'camera-instant': instantCamera }" :style="{ transform: sceneTransform }">
        <img class="room-art" :src="roomArt" alt="Isometric study with bamboo outside glass doors, a white desk, books, and a yellow beanbag" draggable="false" />

        <div class="cork-pins" aria-hidden="true">
          <div v-for="(photo, index) in galleryPhotos" :key="photo.caption" class="cork-print" :style="pinStyle(index)">
            <div class="gallery-image">
              <img v-if="photo.tile !== null" :src="wildCollage" alt="" :class="`gallery-tile gallery-tile-${photo.tile}`" draggable="false" />
              <img v-else :src="photo.src" alt="" class="gallery-event" :style="{ objectPosition: photo.position }" draggable="false" />
            </div>
          </div>
        </div>
        <span class="room-flag flag-ucla" aria-hidden="true">UCLA</span>
        <span class="room-flag flag-wfu" aria-hidden="true">WFU</span>
        <div class="room-globe-prop" aria-hidden="true"><StudyGlobe /></div>
        <div v-if="selected?.id === 'monitor'" class="room-screen" aria-hidden="true"><span>✦</span><strong>Projects</strong></div>

        <button v-for="object in propsInRoom" :key="object.id" type="button" class="room-hotspot"
          :class="{ 'drop-ready': draggingCat !== null && catActivities[object.id], 'drop-active': markedDrop === object.id }"
          :aria-label="object.label"
          :style="{ left: object.x+'%', top: object.y+'%', width: object.w+'%', height: object.h+'%', '--shape': object.shape ? `polygon(${object.shape})` : 'inset(0 round 14%)' }"
          @click="inspect(object, $event.currentTarget)">
          <span class="hotspot-hit" aria-hidden="true"></span>
          <span class="room-tag" aria-hidden="true">{{ object.label }}</span>
        </button>

        <button v-for="(cat,i) in cats" :key="cat.name" class="room-cat" type="button" :aria-label="cat.name"
          :class="[cat.pose, { 'cat-held': draggingCat === i, 'cat-mouse': i === 1 && cat.activity === 'desk' }]"
          :style="{ left: cat.x+'%', top: cat.y+'%', '--facing': cat.facing, '--travel': cat.duration+'ms' }"
          @pointerenter="hoveredCat = i" @pointerleave="hoveredCat = null"
          @pointerdown.stop="startCat($event,i)" @pointermove.stop="moveCat"
          @pointerup.stop="endCat" @pointercancel="endCat($event,true)" @lostpointercapture="endCat($event,true)"
          @click.stop="event => { if (event.detail === 0) inspect({ id: cat.name, label: cat.name, x: cat.x, y: cat.y-4, cat: i }, event.currentTarget) }">
          <img :src="sprite(cat)" alt="" draggable="false" />
          <span class="room-tag" aria-hidden="true">{{ cat.name }}</span>
          <span v-if="cat.pose === 'sleep'" class="cat-effect" aria-hidden="true">{{ cats.every(pet => pet.pose === 'sleep') ? '♡' : 'z' }}</span>
        </button>
      </div>
    </div>

    <footer class="room-controls" v-if="!selected">
      <p><span class="desktop-room-help">Scroll to zoom · Drag to move · Click objects to explore</span><span class="mobile-room-help">Drag to move · Tap objects to explore</span><br>Drag Ono or Yuzu to the beanbag, desk, or bowls.</p>
      <div class="zoom-controls" aria-label="Room zoom">
        <button type="button" aria-label="Zoom out" :disabled="camera.scale <= .75" @click="zoom(camera.scale/1.2)">−</button>
        <button type="button" aria-label="Reset room view" @click="resetCamera">{{ zoomPercent }}%</button>
        <button type="button" aria-label="Zoom in" :disabled="camera.scale >= 3.4" @click="zoom(camera.scale*1.2)">+</button>
      </div>
    </footer>

    <section v-else class="room-detail" :class="`detail-${selected.id.toLowerCase()}`" :aria-label="selected.label">
      <div class="detail-heading"><h3>{{ selected.label }}</h3><button ref="detailBack" type="button" class="detail-back" @click="photoIndex !== null ? (photoIndex = null) : leaveDetail()">← {{ photoIndex !== null ? 'Photos' : 'Room' }}</button></div>
      <div v-if="selected.id === 'monitor'" class="computer-window">
        <p class="computer-bar"><span aria-hidden="true">● ● ●</span> Alisa’s desktop / Projects</p>
        <div class="computer-body"><h4>Projects</h4><p>Coming soon</p><button type="button" @click="emit('projects')">Open Projects page ↗</button></div>
      </div>
      <template v-else-if="selected.id === 'photos'">
        <div v-if="currentPhoto" class="room-photo-viewer">
          <figure><div class="gallery-image">
            <img v-if="currentPhoto.tile !== null" :src="wildCollage" :alt="currentPhoto.alt" :class="`gallery-tile gallery-tile-${currentPhoto.tile}`" />
            <img v-else :src="currentPhoto.src" :alt="currentPhoto.alt" class="gallery-event" :style="{ objectPosition: currentPhoto.position }" />
          </div><figcaption>{{ currentPhoto.caption }}</figcaption></figure>
          <div class="photo-arrows"><button type="button" aria-label="Previous photo" @click="movePhoto(-1)">←</button><span>{{ photoIndex + 1 }} / {{ galleryPhotos.length }}</span><button type="button" aria-label="Next photo" @click="movePhoto(1)">→</button></div>
        </div>
        <div v-else class="room-photo-list">
          <button v-for="(photo,index) in galleryPhotos" :key="photo.caption" type="button" :aria-label="photo.caption" @click="photoIndex=index; nextTick(() => detailBack?.focus())">
            <span class="gallery-image"><img v-if="photo.tile !== null" :src="wildCollage" alt="" :class="`gallery-tile gallery-tile-${photo.tile}`" /><img v-else :src="photo.src" alt="" class="gallery-event" :style="{ objectPosition: photo.position }" /></span>
          </button>
        </div>
      </template>
      <template v-else-if="selected.id === 'books'">
        <div class="book-spines" aria-label="Ten reading list slots">
          <button v-for="(book,i) in shelfBooks" :key="i" type="button" :aria-label="book.title || `Book slot ${i+1}`" :aria-pressed="bookIndex === i"
            :style="{ '--book-color': book.color, '--book-height': book.height+'%' }" @click="bookIndex = i">{{ i + 1 }}</button>
        </div>
        <p v-if="currentBook"><img v-if="currentBook.cover" class="book-cover" :src="currentBook.cover" alt="" />{{ currentBook.title || `Book ${bookIndex + 1} · Coming soon` }}</p>
        <p v-else>Room for ten favorites. Reading list coming soon.</p>
      </template>
      <template v-else-if="selected.id === 'globe'">
        <StudyGlobe interactive />
        <p>Drag to spin, or use the arrow keys. Travel pins are coming later.</p>
      </template>
      <p v-else-if="selected.id === 'golf'">The clubs are ready. Mini golf is for another day.</p>
      <p v-else-if="selected.id === 'record'">A quiet turntable for now. Records are coming later.</p>
      <p v-else-if="selected.id === 'flags'">UCLA Anderson and Wake Forest University.</p>
      <p v-else-if="selected.id === 'beanbag'">A nap spot for one, or a cuddle spot for two.</p>
      <p v-else-if="selected.id === 'desk'">Ono likes the keyboard. Yuzu prefers the mouse.</p>
      <p v-else-if="selected.id === 'bowls'">Drag either cat here for a snack.</p>
      <div v-else-if="selected.cat != null" class="cat-detail-actions">
        <p>Move {{ selected.label }} to:</p>
        <button v-for="id in ['beanbag','desk','bowls','floor']" :key="id" type="button"
          @click="placeCat(selected.cat, id === 'floor' ? null : id); leaveDetail()">{{ ({ beanbag:'Beanbag',desk:'Desk',bowls:'Food bowls',floor:'Floor' })[id] }}</button>
      </div>
    </section>
    <p class="room-status" role="status">{{ status }}</p>
  </dialog>
</template>
