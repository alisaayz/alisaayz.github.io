<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({ text: { type: String, required: true } })
const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
const tiles = ref([])
const flipMs = 94
const stagger = 45
let frame
function show(text) {
  cancelAnimationFrame(frame)
  const letters = Array.from(text)
  const plans = letters.map((char, index) => ({
    char, start: index * stagger,
    steps: char === ' ' ? [] : [glyphs[(index*7+5)%36], glyphs[(index*11+17)%36], glyphs[(index*13+26)%36], char],
  }))
  if (motion.matches) {
    tiles.value = letters.map(char => ({ current:char, next:char, step:-1, flipping:false }))
    return
  }
  tiles.value = letters.map(() => ({ current:' ', next:' ', step:-1, flipping:false }))
  const start = performance.now()
  function tick(now) {
    let pending = false
    plans.forEach((plan, index) => {
      if (!plan.steps.length) return
      const step = Math.floor((now-start-plan.start)/flipMs)
      const tile = tiles.value[index]
      if (step < plan.steps.length) pending = true
      if (step < 0 || step === tile.step) return
      if (step >= plan.steps.length) {
        if (tile.flipping || tile.current !== plan.char) tiles.value[index] = { current:plan.char, next:plan.char, step, flipping:false }
      } else {
        tiles.value[index] = { current:plan.steps[step-1] || ' ', next:plan.steps[step], step, flipping:true }
      }
    })
    if (pending) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}
const finishForReducedMotion = () => { if (motion.matches) show(props.text) }
onMounted(() => { show(props.text); motion.addEventListener('change',finishForReducedMotion) })
watch(() => props.text,show)
onUnmounted(() => { cancelAnimationFrame(frame); motion.removeEventListener('change',finishForReducedMotion) })
</script>

<template>
  <span class="greeting-board">
    <span class="greeting-accessible">{{ text }}</span>
    <span class="greeting-tiles" aria-hidden="true" :style="{ '--flap-time':flipMs+'ms' }">
      <span v-for="(tile,i) in tiles" :key="i" class="greeting-tile" :class="{ 'greeting-space': text[i] === ' ' }">
        <span class="greeting-half top"><span>{{ tile.next }}</span></span>
        <span class="greeting-half bottom"><span>{{ tile.current }}</span></span>
        <template v-if="tile.flipping">
          <span :key="'a'+tile.step" class="greeting-half top flap-top"><span>{{ tile.current }}</span></span>
          <span :key="'b'+tile.step" class="greeting-half bottom flap-bottom"><span>{{ tile.next }}</span></span>
        </template>
      </span>
    </span>
  </span>
</template>

<style scoped>
.greeting-board { position:relative; display:block; width:100%; container-type:inline-size }
.greeting-accessible { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap }
.greeting-tiles { display:flex; gap:.035em; align-items:center; min-height:1.14em; font-size:min(1em,10.4cqw); letter-spacing:normal; line-height:1; }
.greeting-tile { position:relative; display:block; flex:0 0 .72em; height:1.14em; border-radius:.09em; overflow:hidden; perspective:9em; color:var(--ink); background:var(--soft); box-shadow:0 1px 0 var(--line) }
.greeting-space { flex-basis:.34em; visibility:hidden }
.greeting-tile::after { content:''; position:absolute; z-index:4; inset:50% 0 auto; height:1px; background:color-mix(in srgb,var(--ink) 23%,transparent); pointer-events:none }
.greeting-half { position:absolute; inset-inline:0; height:50%; overflow:hidden; backface-visibility:hidden; }
.greeting-half.top { top:0; background:color-mix(in srgb,var(--paper) 22%,var(--soft)); }
.greeting-half.bottom { bottom:0; background:color-mix(in srgb,var(--ink) 5%,var(--soft)); }
.greeting-half > span { position:absolute; inset-inline:0; height:200%; display:grid; place-items:center; }
.greeting-half.top > span { top:0 }
.greeting-half.bottom > span { bottom:0 }
.flap-top { z-index:3; transform-origin:center bottom; animation:flap-fall var(--flap-time) linear both }
.flap-bottom { z-index:3; transform-origin:center top; animation:flap-land var(--flap-time) linear both }
@keyframes flap-fall { 0% { transform:rotateX(0) } 50%,100% { transform:rotateX(-90deg); filter:brightness(.72) } }
@keyframes flap-land { 0%,50% { transform:rotateX(90deg); filter:brightness(.72) } 100% { transform:rotateX(0) } }
</style>
