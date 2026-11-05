<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { shelfBooks } from '../study.js'
import { bookGeometry, shelfRelative, wrap } from '../shelfMotion.js'

const props = defineProps({ webgl: Boolean })
const emit = defineEmits(['measure','draw'])
const strip = ref(null), probe = ref(null), stage = ref(null)
const copies = ref(3)
const books = computed(() => Array.from({ length:shelfBooks.length*copies.value },(_,i) => {
  const index = i % shelfBooks.length
  const book = shelfBooks[index]
  return { ...book, id:i, number:index+1, label:bookLabel(book,index+1), ink:bookInk(book.color) }
}))
function bookInk(color) {
  const levels = color.slice(1).match(/../g).map(channel => {
    const value = Number.parseInt(channel,16)/255
    return value<=.04045 ? value/12.92 : ((value+.055)/1.055)**2.4
  })
  return levels[0]*.2126+levels[1]*.7152+levels[2]*.0722 < .22 ? '#fff5e5' : '#211b16'
}
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
const chosen = ref(1)
const current = computed(() => shelfBooks[chosen.value-1])
const bookLabel = (book, number) => book.title || `Book ${String(number).padStart(2,'0')}`
let nodes = [], lifts = new Float32Array(shelfBooks.length*3), hovered = -1
let height = 300, width = 0, centerX = 0, centerY = 0, surface = 0
let s = shelfBooks.length, target = s, tiltX = 0, tiltY = 0, pointer = null
let frame = 0, lastTime = 0, wheelEnd, observer, drag, ignoreClick = false
function measure() {
  const box = strip.value.getBoundingClientRect()
  height = probe.value.getBoundingClientRect().height
  width = box.width
  centerX = box.left+box.width/2
  centerY = box.top+box.height/2
  const { ws,depth,gap } = bookGeometry(height,0)
  const visibleCycles = Math.ceil((width + 3*depth) / ((ws+gap)*shelfBooks.length))
  copies.value = Math.max(3, 1 + 2*Math.ceil(visibleCycles/2))
  const bottom = (height/2) * 2200 / (2200-depth/2)
  surface = box.top + box.height/2 + bottom
  strip.value.parentElement.style.setProperty('--shelf-top',`${surface}px`)
  stage.value.style.setProperty('--ws',ws+'px')
  stage.value.style.setProperty('--d',depth+'px')
  emit('measure',height)
  requestDraw()
}
function requestDraw() { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(draw) } }
function draw(now) {
  frame = 0
  const dt = Math.min(.05,(now-lastTime)/1000)
  lastTime = now
  const reduced = motion.matches
  const ease = (speed) => reduced ? 1 : 1-Math.exp(-speed*dt)
  if (Math.abs(target-s)<.001) s = target
  else s += (target-s)*ease(11)
  const { depth } = bookGeometry(height,0)
  const mx = pointer ? pointer.x-centerX : 0
  const my = pointer ? pointer.y-centerY : 0
  const cover = Math.abs(mx)<=.55*depth && Math.abs(my)<=.55*height && Math.abs(target-s)<.3
  const tx = pointer && cover ? -my/(height/2)*6 : 0
  const ty = pointer ? (cover ? mx/(.55*depth)*9 : mx/(width || 1)*5) : 0
  tiltX += ((reduced ? 0 : tx)-tiltX)*ease(7)
  tiltY += ((reduced ? 0 : ty)-tiltY)*ease(7)
  let easing = Math.abs(s-target)>.001 || Math.abs(tiltX-(reduced?0:tx))>.01 || Math.abs(tiltY-(reduced?0:ty))>.01
  chosen.value = wrap(Math.round(s),shelfBooks.length)+1
  const layout = nodes.map((node,i) => {
    const r = shelfRelative(i,s,nodes.length)
    const desired = !reduced && i===hovered && Math.abs(r)>.5 ? 1 : 0
    lifts[i] += (desired-lifts[i])*ease(12)
    if (Math.abs(lifts[i]-desired)>.01) easing = true
    const g = bookGeometry(height,r,lifts[i],tiltX,tiltY)
    const visible = Math.abs(g.x)<=width/2+1.5*g.depth
    node.style.visibility = visible ? 'visible' : 'hidden'
    if (visible) {
      node.style.transform = `translate3d(${g.x}px,${g.y}px,${g.z}px) rotateX(${g.rx}deg) rotateY(${g.ry}deg)`
      node.style.zIndex = g.order
      node.style.setProperty('--spine-shade',g.spineShade)
      node.style.setProperty('--cover-shade',g.coverShade)
    }
    return { book:books.value[i], pose:g, visible }
  })
  emit('draw',{ height, surface, books:layout })
  if (easing) frame = requestAnimationFrame(draw)
}
function setHover(index) { hovered=index; requestDraw() }
function turn(index) {
  if (ignoreClick) return
  clearTimeout(wheelEnd)
  target = Math.round(s+shelfRelative(index,s,nodes.length))
  requestDraw()
}
function step(direction) {
  clearTimeout(wheelEnd)
  target = Math.round(target)+direction
  requestDraw()
}
function wheel(event) {
  if (event.ctrlKey) return
  event.preventDefault()
  const delta = Math.abs(event.deltaX)>Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  target += Math.max(-1.5,Math.min(1.5,delta*(event.deltaMode===1 ? 16 : 1)/160))
  requestDraw()
  clearTimeout(wheelEnd)
  wheelEnd=setTimeout(() => { target=Math.round(target); requestDraw() },130)
}
function move(event) {
  if (event.pointerType==='mouse') pointer={ x:event.clientX,y:event.clientY }
  if (drag?.id===event.pointerId) {
    const dx=event.clientX-drag.x
    if (Math.abs(dx)>6 && !drag.moved) {
      drag.moved=true
      strip.value.setPointerCapture(event.pointerId)
    }
    if (drag.moved) target=s=drag.s-dx/(height*(142/840+.03))
  }
  requestDraw()
}
function start(event) {
  if (!event.isPrimary || event.button!==0) return
  clearTimeout(wheelEnd)
  ignoreClick=false
  drag={ id:event.pointerId,x:event.clientX,s,moved:false }
}
function finish(event) {
  if (drag?.id!==event.pointerId) return
  ignoreClick=drag.moved
  drag=null
  if (ignoreClick) { target=Math.round(s); requestDraw() }
}
function leave() { pointer=null; setHover(-1) }
function collectBooks() {
  nodes=[...stage.value.querySelectorAll('.tape')]
  lifts = new Float32Array(nodes.length)
  requestDraw()
}
watch(copies, collectBooks, { flush:'post' })
onMounted(() => {
  collectBooks()
  observer=new ResizeObserver(measure)
  observer.observe(strip.value)
  strip.value.addEventListener('wheel',wheel,{ passive:false })
  measure()
})
onUnmounted(() => {
  observer?.disconnect()
  strip.value?.removeEventListener('wheel',wheel)
  cancelAnimationFrame(frame)
  clearTimeout(wheelEnd)
})
</script>

<template>
  <div class="book-shelf-view" :class="{ 'webgl-books':props.webgl }">
    <div ref="probe" class="shelf-height-probe" aria-hidden="true"></div>
    <div v-if="!props.webgl" class="shelf-plank-fallback" aria-hidden="true"></div>
    <section ref="strip" class="book-shelf-strip" tabindex="0" aria-label="Bookshelf carousel. Use the left and right arrows to turn books."
      @keydown.left.prevent="step(-1)" @keydown.right.prevent="step(1)"
      @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="finish" @lostpointercapture="finish" @pointerleave="leave">
      <div ref="stage" class="shelf-stage" aria-hidden="true">
        <div v-for="book in books" :key="book.id" class="tape" :style="{ '--book-color':book.color, '--book-ink':book.ink }">
          <span class="book-face sp" @pointerenter="setHover(book.id)" @pointerleave="setHover(-1)" @click="turn(book.id)">
            <span>{{ bookLabel(book,book.number) }}</span>
          </span>
          <span class="book-face cv" @pointerenter="setHover(book.id)" @pointerleave="setHover(-1)" @click="turn(book.id)">
            <img v-if="book.cover" :src="book.cover" alt="" draggable="false" />
            <span v-else class="book-cover-label"><small>Study shelf</small>{{ bookLabel(book,book.number) }}</span>
          </span>
        </div>
      </div>
    </section>
    <div class="shelf-navigation">
      <button type="button" aria-label="Previous book" @click="step(-1)">←</button>
      <span aria-live="polite">{{ bookLabel(current,chosen) }} <small>{{ chosen }} / {{ shelfBooks.length }}</small></span>
      <button type="button" aria-label="Next book" @click="step(1)">→</button>
    </div>
  </div>
</template>

<style scoped>
.book-shelf-view { --H:clamp(145px,min(52dvh,79vw),380px); position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:5; }
.shelf-height-probe { position:absolute; left:-9999px; height:var(--H); width:1px; visibility:hidden; }
.book-shelf-strip { position:absolute; left:0; width:100%; top:calc(50% - var(--H) / 2 - 40px); height:calc(var(--H) + 80px); perspective:2200px; perspective-origin:50% 50%; touch-action:pan-y; pointer-events:auto; cursor:grab; user-select:none; }
.webgl-books .book-face { opacity:0; }
.shelf-plank-fallback { position:absolute; inset:var(--shelf-top) -40px auto; height:max(14px,calc(var(--H)*.075)); border-top:1px solid #d8aa78; background:linear-gradient(#b9824c,#906035); box-shadow:0 12px 16px #3f241f45; }
.book-shelf-strip:active { cursor:grabbing }
.shelf-stage,.tape { position:absolute; width:0; height:0; transform-style:preserve-3d; }
.shelf-stage { top:50%; left:50%; }
.tape { will-change:transform; visibility:hidden; }
.book-face { position:absolute; top:calc(-1 * var(--H)/2); height:var(--H); backface-visibility:hidden; border-radius:2px; overflow:hidden; cursor:pointer; color:var(--book-ink); background:linear-gradient(100deg,#fff2d719,transparent 45%,#19140f27),var(--book-color); }
.book-face::after { content:''; position:absolute; inset:0; background:#000; pointer-events:none; }
.sp { width:var(--ws); left:calc(-1 * var(--ws)/2); transform:translateZ(calc(var(--d)/2)); display:grid; place-items:center; border-inline:1px solid #241b173c; }
.sp::after { opacity:var(--spine-shade,0); }
.sp > span { writing-mode:vertical-rl; transform:rotate(180deg); font:650 clamp(10px,2.1dvh,16px)/1 var(--sans); letter-spacing:.07em; }
.cv { width:var(--d); left:calc(-1 * var(--d)/2); transform:rotateY(90deg) translateZ(calc(var(--ws)/2)); box-shadow:0 30px 60px -28px #14100a8c; display:grid; place-items:center; }
.cv::after { opacity:var(--cover-shade,.5); }
.cv img { display:block; width:100%; height:100%; object-fit:cover; pointer-events:none; }
.book-cover-label { display:grid; place-items:center; gap:.7em; margin:8%; min-height:72%; width:82%; border:1px solid #f9ead69e; text-align:center; font:650 clamp(16px,3.4dvh,28px)/1.2 var(--sans); pointer-events:none; }
.book-cover-label small { font:500 .48em/1.2 var(--mono); text-transform:uppercase; letter-spacing:.14em; align-self:end; }
.shelf-navigation { position:absolute; left:50%; transform:translateX(-50%); bottom:clamp(10px,4dvh,36px); display:flex; align-items:center; gap:10px; pointer-events:auto; white-space:nowrap; color:#2c241d; }
.shelf-navigation span,.shelf-navigation button { background:#f8efe1; border:1px solid #b9a48a; border-radius:6px; padding:6px 10px; }
.shelf-navigation small { color:#6b5140; margin-left:5px; }
@media(max-height:420px) { .book-shelf-view { --H:42dvh; } }
</style>
