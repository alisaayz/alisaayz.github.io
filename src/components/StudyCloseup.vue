<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { galleryPhotos, wildCollage } from '../gallery.js'
import { recordCollection, shelfBooks } from '../study.js'
import StudyGlobe from './StudyGlobe.vue'
import StudyMonitor from './StudyMonitor.vue'
import StudyPennants from './StudyPennants.vue'
import roomArt from '../assets/study/room.webp'

const props = defineProps({ object: Object, catArt: String })
const emit = defineEmits(['back', 'place-cat'])
const images = import.meta.glob('../assets/study/front-*.webp', { eager:true, query:'?url', import:'default' })
const frontImage = (id) => images[`../assets/study/front-${id}.webp`]
const back = ref(null), photoIndex = ref(null), bookIndex = ref(null), trackIndex = ref(null)
const currentPhoto = computed(() => galleryPhotos[photoIndex.value])
const currentBook = computed(() => shelfBooks[bookIndex.value])
const currentTrack = computed(() => recordCollection[trackIndex.value])
const backLabel = computed(() => photoIndex.value !== null ? 'Photo wall' : bookIndex.value !== null ? 'Bookshelf' : 'Room')
function goBack() {
  if (photoIndex.value !== null) {
    const index = photoIndex.value
    photoIndex.value = null
    nextTick(() => document.getElementById(`room-print-${index}`)?.focus())
  } else if (bookIndex.value !== null) {
    const index = bookIndex.value
    bookIndex.value = null
    nextTick(() => document.getElementById(`room-book-${index}`)?.focus())
  } else emit('back')
}
function openPhoto(index) {
  photoIndex.value = index
  nextTick(() => back.value?.focus({ preventScroll:true }))
}
function openBook(index) {
  bookIndex.value = index
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
onMounted(() => back.value.focus({ preventScroll: true }))
defineExpose({ goBack })
</script>

<template>
  <section class="item-view" :class="`item-${object.id.toLowerCase()}`" :aria-label="object.label">
    <button ref="back" class="item-return" type="button" @click="goBack">← {{ backLabel }}</button>
    <div class="item-scene">
      <StudyMonitor v-if="object.id === 'monitor'" />
      <template v-else-if="object.id === 'photos'">
        <div class="front-cork">
          <svg viewBox="695 180 330 218" preserveAspectRatio="none" aria-hidden="true"><image :href="roomArt" width="1254" height="1254" transform="matrix(1 -.435 0 1 0 303)" /></svg>
          <div class="front-prints">
            <button v-for="(photo,index) in galleryPhotos" :id="`room-print-${index}`" :key="photo.caption" class="front-print"
              :style="{ '--print-angle': [-4,2,-2,3,-3,4][index]+'deg' }" type="button" :aria-label="photo.caption"
              :tabindex="currentPhoto ? -1 : 0" @click="openPhoto(index)">
              <span class="gallery-image"><img v-if="photo.tile !== null" :src="wildCollage" alt="" :class="`gallery-tile gallery-tile-${photo.tile}`" /><img v-else :src="photo.src" alt="" class="gallery-event" :style="{ objectPosition: photo.position }" /></span>
            </button>
          </div>
        </div>
        <div v-if="currentPhoto" class="print-focus" @keydown.left.prevent="changePhoto(-1)" @keydown.right.prevent="changePhoto(1)">
          <button type="button" class="print-arrow" aria-label="Previous photo" @click="changePhoto(-1)">←</button>
          <figure><div class="gallery-image"><img v-if="currentPhoto.tile !== null" :src="wildCollage" :alt="currentPhoto.alt" :class="`gallery-tile gallery-tile-${currentPhoto.tile}`" /><img v-else :src="currentPhoto.src" :alt="currentPhoto.alt" class="gallery-event" :style="{ objectPosition: currentPhoto.position }" /></div><figcaption>{{ currentPhoto.caption }}</figcaption></figure>
          <button type="button" class="print-arrow" aria-label="Next photo" @click="changePhoto(1)">→</button>
        </div>
      </template>
      <template v-else-if="object.id === 'books'">
        <div class="front-shelves">
          <svg viewBox="72 424 181 233" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The two oak shelves and books from the study"><image :href="roomArt" width="1254" height="1254" transform="matrix(1 .455 0 1 0 -44)" /></svg>
          <button v-for="(book,index) in shelfBooks" :id="`room-book-${index}`" :key="index" class="shelf-book" type="button"
            :style="{ left: 16+index%5*12+'%', top: (index<5 ? 7 : 49)+'%' }"
            :aria-label="book.title || `Book slot ${index+1}`" :tabindex="currentBook ? -1 : 0" @click="openBook(index)">
            <span class="book-tab">{{ book.title || `Book ${index+1}` }}</span>
          </button>
        </div>
        <div v-if="currentBook" class="book-focus">
          <div class="book-jacket" :style="{ backgroundColor: currentBook.color }"><img v-if="currentBook.cover" :src="currentBook.cover" alt="" /><span v-else>{{ currentBook.title || `Book ${bookIndex+1}` }}</span></div>
        </div>
      </template>
      <div v-else-if="object.id === 'record'" class="listening-station">
        <img class="record-front" :src="frontImage('record')" alt="The study's turntable and oak table seen from the front" />
        <div class="record-selection">
          <h3>Choose a record</h3>
          <p v-if="!recordCollection.length" class="no-records">No records added yet.</p>
          <ul v-else><li v-for="(track,index) in recordCollection" :key="track.url"><button type="button" :aria-pressed="trackIndex === index" @click="trackIndex=index">{{ track.title }}</button></li></ul>
          <iframe v-if="recordUrl(currentTrack)" :key="currentTrack.url" :src="recordUrl(currentTrack)" :title="`Play ${currentTrack.title} on SoundCloud`" loading="lazy" allow="autoplay"></iframe>
        </div>
      </div>
      <StudyGlobe v-else-if="object.id === 'globe'" interactive />
      <StudyPennants v-else-if="object.id === 'flags'" flat />
      <div v-else-if="object.cat != null" class="front-cat-view">
        <img :src="catArt" :alt="object.label" />
        <div class="cat-detail-actions" :aria-label="`Move ${object.label}`">
          <button v-for="id in ['beanbag','desk','bowls','floor']" :key="id" type="button"
            @click="emit('place-cat',object.cat,id === 'floor' ? null : id)">{{ ({ beanbag:'Beanbag',desk:'Desk',bowls:'Food bowls',floor:'Floor' })[id] }}</button>
        </div>
      </div>
      <img v-else-if="frontImage(object.id)" class="standalone-object" :src="frontImage(object.id)" :alt="object.label" />
    </div>
  </section>
</template>
