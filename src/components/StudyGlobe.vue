<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import mapUrl from '../assets/study/world.svg'

const props = defineProps({ interactive: Boolean })
const globe = ref(null)
const size = 144
let frame, drag, paint, angle = 110, timestamp = 0
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
let alive = true
onMounted(() => {
  const map = new Image()
  map.onload = () => {
    if (!alive) return
    const texture = document.createElement('canvas')
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
        if (x*x + y*y >= 1) continue
        const z = Math.sqrt(1 - x*x - y*y)
        const latitude = Math.asin(y*.966 + z*.259)
        const longitude = Math.atan2(x, z*.966 - y*.259)
        pixels.push({
          out: (row * size + col) * 4,
          u: (longitude / (2 * Math.PI) + .5) * map.width,
          v: Math.min(map.height - 1, Math.floor((.5 - latitude / Math.PI) * map.height)) * map.width,
          light: Math.min(1.17, .62 + Math.max(0, -.35*x + .47*y + .82*z)*.51),
        })
      }
    }
    paint = () => {
      for (const pixel of pixels) {
        const u = ((Math.floor(pixel.u + angle) % map.width) + map.width) % map.width
        const index = (pixel.v + u) * 4
        for (let c = 0; c < 3; c++) sphere.data[pixel.out + c] = texels[index + c] * pixel.light
        sphere.data[pixel.out + 3] = 255
      }
      context.putImageData(sphere, 0, 0)
    }
    paint()
    const tick = (now) => {
      if (now - timestamp >= 50) {
        if (!drag && !motion.matches) {
          angle += Math.min(now - timestamp, 75) * .003
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
  <div class="study-globe" :class="{ 'globe-interactive': interactive }">
    <canvas ref="globe" :width="size" :height="size"
      :aria-label="interactive ? 'Globe. Use left and right arrow keys to turn it.' : undefined"
      :aria-hidden="interactive ? undefined : 'true'" :tabindex="interactive ? 0 : undefined"
      @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end"
      @keydown.left.prevent="spin(-1)" @keydown.right.prevent="spin(1)" />
  </div>
</template>
