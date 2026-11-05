<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { galleryPhotos, wildCollage } from '../gallery.js'
import { catProfiles, recordCollection } from '../study.js'
import StudyBookshelf from './StudyBookshelf.vue'

const props = defineProps({ object: Object, webgl: Boolean })
const emit = defineEmits(['back','measure-shelf','draw-shelf'])
const back = ref(null), photoIndex = ref(null), trackIndex = ref(null)
const currentPhoto = computed(() => galleryPhotos[photoIndex.value])
const currentTrack = computed(() => recordCollection[trackIndex.value])
const profile = computed(() => catProfiles[props.object.cat])
function goBack() {
  if (photoIndex.value !== null) {
    const index = photoIndex.value
    photoIndex.value = null
    nextTick(() => document.getElementById(`room-print-${index}`)?.focus())
  } else emit('back')
}
function openPhoto(index) {
  photoIndex.value = index
  nextTick(() => back.value?.focus({ preventScroll:true }))
}
function changePhoto(offset) { photoIndex.value = (photoIndex.value + offset + galleryPhotos.length) % galleryPhotos.length }
function recordUrl(track) {
  try {
    const url = new URL(track?.url)
    if (url.protocol !== 'https:' || url.hostname !== 'soundcloud.com') return ''
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&auto_play=false&show_comments=false&show_reposts=false&color=%2367654b`
  } catch { return '' }
}
onMounted(() => back.value.focus({ preventScroll:true }))
defineExpose({ goBack,openPhoto })
</script>

<template>
  <section class="room-inspection" :aria-label="object.label">
    <button ref="back" class="item-return" type="button" @click="goBack">← {{ currentPhoto ? 'Photo wall' : 'Room' }}</button>
    <StudyBookshelf v-if="object.id==='books'" :webgl="webgl" @measure="emit('measure-shelf',$event)" @draw="emit('draw-shelf',$event)" />
    <div v-if="currentPhoto" class="print-focus" @keydown.left.prevent="changePhoto(-1)" @keydown.right.prevent="changePhoto(1)">
      <button type="button" class="print-arrow" aria-label="Previous photo" @click="changePhoto(-1)">←</button>
      <figure><div class="gallery-image"><img v-if="currentPhoto.tile !== null" :src="wildCollage" :alt="currentPhoto.alt" :class="`gallery-tile gallery-tile-${currentPhoto.tile}`" /><img v-else :src="currentPhoto.src" :alt="currentPhoto.alt" class="gallery-event" :style="{ objectPosition: currentPhoto.position }" /></div><figcaption>{{ currentPhoto.caption }}</figcaption></figure>
      <button type="button" class="print-arrow" aria-label="Next photo" @click="changePhoto(1)">→</button>
    </div>
    <div v-else-if="object.id==='record'" class="record-selection in-scene-panel">
      <h3>Choose a record</h3>
      <p v-if="!recordCollection.length" class="no-records">No records added yet.</p>
      <ul v-else><li v-for="(track,index) in recordCollection" :key="track.url"><button type="button" :aria-pressed="trackIndex===index" @click="trackIndex=index">{{ track.title }}</button></li></ul>
      <iframe v-if="recordUrl(currentTrack)" :key="currentTrack.url" :src="recordUrl(currentTrack)" :title="`Play ${currentTrack.title} on SoundCloud`" loading="lazy" allow="autoplay"></iframe>
    </div>
    <div v-else-if="profile" class="cat-profile in-scene-panel">
      <h3>{{ object.label }}</h3>
      <p class="cat-chinese-name" lang="zh">{{ profile.chineseName }}</p>
      <ul><li v-for="fact in profile.facts" :key="fact">{{ fact }}</li></ul>
    </div>
  </section>
</template>
