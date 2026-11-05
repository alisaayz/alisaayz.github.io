<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { shelfBooks } from '../study.js'
import { bookGeometry, bookRowGeometry } from '../shelfMotion.js'

const props = defineProps({ webgl: Boolean })
const emit = defineEmits(['draw'])
const view = ref(null), probe = ref(null)
const rows = [
  { name: 'Top shelf', books: shelfBooks.slice(0, 5) },
  { name: 'Bottom shelf', books: shelfBooks.slice(5, 10) },
].map((row, rowIndex) => ({
  ...row,
  books: row.books.map((book, index) => {
    const id = rowIndex*5+index
    return { ...book, id, number:id+1, label:book.title || `Book ${String(id+1).padStart(2,'0')}`, ink:bookInk(book.color) }
  }),
  position: 2,
  target: 2,
  hovered: -1,
  lifts: Array(5).fill(0),
}))

function bookInk(color) {
  const levels = color.slice(1).match(/../g).map(channel => {
    const value = Number.parseInt(channel,16)/255
    return value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4
  })
  return levels[0]*.2126+levels[1]*.7152+levels[2]*.0722 < .22 ? '#fff5e5' : '#211b16'
}

const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
const chosen = ref([2, 2])
const perspective = 2200
let height, viewportCenter, frame, lastTime, observer

function measure() {
  height = probe.value.getBoundingClientRect().height
  const viewport = view.value.getBoundingClientRect()
  viewportCenter = viewport.height/2
  const { ws, depth } = bookGeometry(height,0)
  for (const row of rows) {
    const box = row.strip.getBoundingClientRect()
    row.top = box.top - viewport.top
    row.centerY = row.top + box.height/2
    row.surface = viewportCenter + (row.centerY + height/2 - viewportCenter)*perspective/(perspective-depth/2)
    row.strip.style.perspectiveOrigin = `50% ${viewportCenter-row.top}px`
    row.strip.style.setProperty('--ws',ws+'px')
    row.strip.style.setProperty('--d',depth+'px')
    view.value.style.setProperty('--shelf-top-'+row.index,row.surface+'px')
  }
  requestDraw()
}

function positionControl(control, row, pose) {
  const angle = pose.ry*Math.PI/180
  const sin = Math.sin(angle), cos = Math.cos(angle)
  const center = row.centerY+pose.y-viewportCenter
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity
  for (const x of [-pose.ws/2, pose.ws/2]) for (const z of [-pose.depth/2, pose.depth/2]) {
    const scale = perspective/(perspective-pose.z+x*sin-z*cos)
    const edge = (pose.x+x*cos+z*sin)*scale
    left = Math.min(left,edge)
    right = Math.max(right,edge)
    top = Math.min(top,viewportCenter+(center-height/2)*scale-row.top)
    bottom = Math.max(bottom,viewportCenter+(center+height/2)*scale-row.top)
  }
  Object.assign(control.style, {
    left:`calc(50% + ${left}px)`, top:top+'px', width:(right-left)+'px', height:(bottom-top)+'px', zIndex:pose.order,
  })
}

function requestDraw() {
  if (frame) return
  lastTime = performance.now()
  frame = requestAnimationFrame(draw)
}

function draw(now) {
  frame = 0
  const dt = Math.min(.05,(now-lastTime)/1000)
  lastTime = now
  const reduced = motion.matches
  const ease = speed => reduced ? 1 : 1-Math.exp(-speed*dt)
  let moving = false
  const layout = rows.map(row => {
    if (Math.abs(row.target-row.position)<.001) row.position = row.target
    else row.position += (row.target-row.position)*ease(11)
    if (Math.abs(row.target-row.position)>.001) moving = true
    row.lifts.forEach((lift,index) => {
      const target = !reduced && index===row.hovered && index!==row.target ? 1 : 0
      row.lifts[index] = lift+(target-lift)*ease(12)
      if (Math.abs(row.lifts[index]-target)>.01) moving = true
    })
    const poses = bookRowGeometry(height,row.position,row.lifts)
    const books = poses.map((pose,index) => {
      const node = row.nodes[index]
      node.style.transform = `translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotateY(${pose.ry}deg)`
      node.style.zIndex = pose.order
      node.style.setProperty('--spine-shade',pose.spineShade)
      node.style.setProperty('--cover-shade',pose.coverShade)
      positionControl(row.controls[index],row,pose)
      return { book:row.books[index], pose }
    })
    return { centerY:row.centerY, surface:row.surface, books }
  })
  emit('draw',{ height, width:height*1.74, rows:layout })
  if (moving) frame = requestAnimationFrame(draw)
}

function hover(row, index) {
  row.hovered = index
  requestDraw()
}

function turn(row, index) {
  row.target = index
  chosen.value[row.index] = index
  requestDraw()
}

function step(row, direction, event) {
  const index = Math.min(row.books.length-1,Math.max(0,row.target+direction))
  turn(row,index)
  if (event.target.closest('.book-control')) row.controls[index].focus({ preventScroll:true })
}

onMounted(() => {
  view.value.querySelectorAll('.book-shelf-strip').forEach((strip,index) => {
    Object.assign(rows[index],{
      index, strip, nodes:[...strip.querySelectorAll('.tape')], controls:[...strip.querySelectorAll('.book-control')],
    })
  })
  observer = new ResizeObserver(measure)
  observer.observe(view.value)
  measure()
})
onUnmounted(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div ref="view" class="book-shelf-view" :class="{ 'webgl-books':props.webgl }">
    <div ref="probe" class="shelf-height-probe" aria-hidden="true"></div>
    <template v-for="(row,index) in rows" :key="row.name">
      <div v-if="!props.webgl" class="shelf-plank-fallback" :style="{ top:`var(--shelf-top-${index})` }" aria-hidden="true"></div>
      <section class="book-shelf-strip" :class="{ 'lower-shelf':index===1 }" :aria-label="row.name"
        @keydown.left.prevent="step(row,-1,$event)" @keydown.right.prevent="step(row,1,$event)">
        <div class="shelf-stage" aria-hidden="true">
          <div v-for="book in row.books" :key="book.id" class="tape" :style="{ '--book-color':book.color, '--book-ink':book.ink }">
            <span class="book-face sp"><span>{{ book.label }}</span></span>
            <span class="book-face cv">
              <img v-if="book.cover" :src="book.cover" alt="" draggable="false" />
              <span v-else class="book-cover-label"><small>Study shelf</small>{{ book.label }}</span>
            </span>
          </div>
        </div>
        <button v-for="(book,bookIndex) in row.books" :key="book.id" type="button" class="book-control"
          :aria-label="book.label" :aria-pressed="chosen[index]===bookIndex"
          @pointerenter="hover(row,bookIndex)" @pointerleave="hover(row,-1)" @click="turn(row,bookIndex)" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.book-shelf-view {
  --H:min(32dvh,50vw,272px);
  --row-gap:clamp(24px,5dvh,48px);
  --row-step:calc(var(--H) + var(--row-gap));
  position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:5;
}
.shelf-height-probe { position:absolute; left:-9999px; height:var(--H); width:1px; visibility:hidden; }
.book-shelf-strip {
  position:absolute; inset:calc(50% - var(--row-step)/2 - var(--H)/2 - 12px) 0 auto;
  height:calc(var(--H) + 24px); perspective:2200px; user-select:none;
}
.book-shelf-strip.lower-shelf { top:calc(50% + var(--row-step)/2 - var(--H)/2 - 12px); }
.shelf-plank-fallback {
  position:absolute; left:50%; width:calc(var(--H)*1.74); translate:-50% 0;
  height:max(10px,calc(var(--H)*.066)); border-top:1px solid #d8aa78;
  background:linear-gradient(#b9824c,#906035); box-shadow:0 12px 16px #3f241f45;
}
.shelf-stage,.tape { position:absolute; width:0; height:0; transform-style:preserve-3d; }
.shelf-stage { top:50%; left:50%; }
.tape { will-change:transform; }
.book-control { position:absolute; border:0; padding:0; background:transparent; pointer-events:auto; cursor:pointer; }
.book-control:focus-visible { outline:2px solid #4a563a; outline-offset:2px; }
.book-face { position:absolute; top:calc(-1 * var(--H)/2); height:var(--H); backface-visibility:hidden; border-radius:2px; overflow:hidden; cursor:pointer; color:var(--book-ink); background:linear-gradient(100deg,#fff2d719,transparent 45%,#19140f27),var(--book-color); }
.book-face::after { content:''; position:absolute; inset:0; background:#000; pointer-events:none; }
.sp { width:var(--ws); left:calc(-1 * var(--ws)/2); transform:translateZ(calc(var(--d)/2)); display:grid; place-items:center; border-inline:1px solid #241b173c; }
.sp::after { opacity:var(--spine-shade,0); }
.sp > span { writing-mode:vertical-rl; transform:rotate(180deg); font:650 clamp(10px,1.8dvh,15px)/1 var(--sans); letter-spacing:.07em; }
.cv { width:var(--d); left:calc(-1 * var(--d)/2); transform:rotateY(90deg) translateZ(calc(var(--ws)/2)); box-shadow:0 30px 60px -28px #14100a8c; display:grid; place-items:center; }
.cv::after { opacity:var(--cover-shade,.5); }
.cv img { display:block; width:100%; height:100%; object-fit:cover; pointer-events:none; }
.book-cover-label { display:grid; place-items:center; gap:.7em; margin:8%; min-height:72%; width:82%; border:1px solid #f9ead69e; text-align:center; font:650 clamp(13px,2.6dvh,22px)/1.2 var(--sans); pointer-events:none; }
.book-cover-label small { font:500 .48em/1.2 var(--mono); text-transform:uppercase; letter-spacing:.14em; align-self:end; }
.webgl-books .book-face { opacity:0; }
@media(max-height:420px) { .book-shelf-view { --H:min(27dvh,50vw,272px); } }
</style>
