<script setup>
import { useId } from 'vue'
import ucla from '../assets/logos/ucla.svg'
import wake from '../assets/logos/wfu.webp'
defineProps({ scene: { type: String, default: 'overview' } })
const ink = useId()
</script>

<template>
  <div class="study-pennants" :class="`pennants-${scene}`" aria-hidden="true">
    <img class="study-pennant pennant-ucla" :src="ucla" alt="" />
    <svg class="study-pennant pennant-wfu" viewBox="280 55 360 260">
      <defs><filter :id="ink" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .87  0 0 0 0 .72  0 0 0 0 .44  -.9 -1.25 -.25 0 2.37" /></filter></defs>
      <image :href="wake" width="900" height="377" :filter="`url(#${ink})`" />
    </svg>
  </div>
</template>
