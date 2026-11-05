<script setup>
import { onMounted, onUnmounted, ref, useId } from 'vue'
import mapUrl from '../assets/study/world-relief.webp'

const props = defineProps({ interactive: Boolean, embedded: Boolean, webgl: Boolean })
const emit = defineEmits(['rotate'])
const globe = ref(null)
const size = 256
const metal = useId(), wood = useId(), shade = useId()
let frame, drag, paint, angle = 0, timestamp = 0
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
let alive = true
onMounted(() => {
  const map = new Image()
  map.onload = () => {
    if (!alive) return
    const texture = document.createElement('canvas')
    angle = (props.embedded ? -.08 : .15) * map.width
    texture.width = map.width
    texture.height = map.height
    const source = texture.getContext('2d', { willReadFrequently: true })
    const context = globe.value.getContext('2d')
    if (!source || !context) return
    source.drawImage(map, 0, 0)
    const texels = source.getImageData(0, 0, map.width, map.height).data
    const sphere = context.createImageData(size, size)
    const pixels = []
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const x = (col + .5) / (size / 2) - 1
        const y = 1 - (row + .5) / (size / 2)
        const radius = Math.hypot(x,y)
        if (radius >= 1) continue
        const z = Math.sqrt(1 - radius*radius)
        const light = Math.max(0, -.45*x + .50*y + .74*z)
        const latitude = Math.asin(y*.966 + z*.259)
        const longitude = Math.atan2(x, z*.966 - y*.259)
        pixels.push({
          out: (row * size + col) * 4,
          u: (longitude / (2 * Math.PI) + .5) * map.width,
          v: Math.min(map.height - 1, Math.floor((.5 - latitude / Math.PI) * map.height)) * map.width,
          light: .51 + light*.58 + z*.035,
          glow: Math.pow(light,13)*15,
          alpha: Math.min(255,(1-radius)*size*160),
        })
      }
    }
    paint = () => {
      emit('rotate', angle / map.width * 2 * Math.PI)
      if (props.webgl) return
      for (const pixel of pixels) {
        const u = ((Math.floor(pixel.u + angle) % map.width) + map.width) % map.width
        const index = (pixel.v + u) * 4
        for (let c = 0; c < 3; c++) sphere.data[pixel.out + c] = texels[index + c] * pixel.light + pixel.glow
        sphere.data[pixel.out + 3] = pixel.alpha
      }
      context.putImageData(sphere, 0, 0)
    }
    paint()
    const tick = (now) => {
      if (now - timestamp >= 50) {
        if (!drag && !motion.matches) {
          angle += Math.min(now - timestamp, 75) * .003 * map.width / 720
          paint()
        }
        timestamp = now
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }
  map.src = mapUrl
})
onUnmounted(() => { alive = false; cancelAnimationFrame(frame) })
function start(event) {
  if (!props.interactive || event.button !== 0) return
  drag = { id: event.pointerId, x: event.clientX }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function move(event) {
  if (drag?.id !== event.pointerId) return
  angle -= (event.clientX - drag.x) * 2
  drag.x = event.clientX
  paint?.()
}
function end(event) { if (drag?.id === event.pointerId) drag = null }
function spin(direction) { angle += direction * 23; paint?.() }
</script>

<template>
  <div class="study-globe" :class="{ 'globe-interactive': interactive, 'globe-embedded': embedded }">
    <svg v-if="!embedded && !webgl" class="globe-mount" viewBox="0 0 200 248" aria-hidden="true">
      <defs>
        <linearGradient :id="metal" x2="1" y2="1"><stop stop-color="#6d4d30"/><stop offset=".35" stop-color="#d5b275"/><stop offset=".57" stop-color="#f0d39a"/><stop offset=".8" stop-color="#a17849"/><stop offset="1" stop-color="#65432a"/></linearGradient>
        <linearGradient :id="wood" x2="1" y2=".2"><stop stop-color="#7e5134"/><stop offset=".34" stop-color="#bf9261"/><stop offset=".65" stop-color="#a17146"/><stop offset="1" stop-color="#694329"/></linearGradient>
        <radialGradient :id="shade"><stop stop-color="#573b26" stop-opacity=".42"/><stop offset="1" stop-color="#573b26" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="102" cy="237" rx="72" ry="11" :fill="`url(#${shade})`" />
      <path d="M51 221c0-8 22-13 49-13s49 5 49 13v8c0 8-22 14-49 14s-49-6-49-14z" :fill="`url(#${wood})`" />
      <ellipse cx="100" cy="221" rx="49" ry="13" fill="#c89d6b" />
      <path d="M89 168h22v28c0 10 5 18 13 22-11 6-37 6-48 0 9-5 13-12 13-22z" :fill="`url(#${wood})`" />
      <path d="M100 194c51 0 93-41 93-93s-42-93-93-93" fill="none" :stroke="`url(#${metal})`" stroke-width="8" stroke-linecap="round" transform="rotate(-23 100 101)" />
    </svg>
    <canvas ref="globe" :width="size" :height="size" :class="{ 'globe-webgl-hit':webgl }"
      :aria-label="interactive ? 'Globe. Use left and right arrow keys to turn it.' : undefined"
      :aria-hidden="interactive ? undefined : 'true'" :tabindex="interactive ? 0 : undefined"
      @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end"
      @keydown.left.prevent="spin(-1)" @keydown.right.prevent="spin(1)" />
  </div>
</template>
