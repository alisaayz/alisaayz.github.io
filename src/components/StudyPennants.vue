<script setup>
import ucla from '../assets/logos/ucla-seal.svg'
import wake from '../assets/logos/wfu-shield.webp'
defineProps({ scene: { type: String, default:'overview' } })
</script>

<template>
  <div class="study-pennants" :class="`pennants-${scene}`" aria-hidden="true">
    <img class="study-pennant pennant-ucla" :src="ucla" alt="" />
    <img class="study-pennant pennant-wfu" :src="wake" alt="" />
  </div>
</template>
