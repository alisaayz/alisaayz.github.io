<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { galleryPhotos, wildCollage } from '../gallery.js'
import { catProfiles, recordCollection, shelfBooks } from '../study.js'
import StudyGlobe from './StudyGlobe.vue'
import StudyMonitor from './StudyMonitor.vue'
import StudyPennants from './StudyPennants.vue'
import { roomView } from '../studyAssets.js'

const props = defineProps({ object: Object, catArt: String })
const emit = defineEmits(['back'])
const back = ref(null), photoIndex = ref(null), bookIndex = ref(null), trackIndex = ref(null)
const currentPhoto = computed(() => galleryPhotos[photoIndex.value])
const currentBook = computed(() => shelfBooks[bookIndex.value])
const currentTrack = computed(() => recordCollection[trackIndex.value])
const profile = computed(() => catProfiles[props.object.cat])
const tilt = ref({ x: 0, y: 0 })
const reaction = ref(0)
function followPointer(event) {
  if (event.pointerType !== 'mouse') return
  const box = event.currentTarget.getBoundingClientRect()
  tilt.value = { x: ((event.clientX-box.left)/box.width-.5)*16, y: ((event.clientY-box.top)/box.height-.5)*10 }
}
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
      <StudyMonitor v-if="object.id === 'monitor'" :scene="roomView('monitor')" />
      <template v-else-if="object.id === 'photos'">
        <div class="front-cork">
          <img class="in-room-art" :src="roomView('photos')" alt="" />
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
          <img class="in-room-art" :src="roomView('books')" alt="Two oak shelves in the study, each holding five books" />
          <button v-for="(book,index) in shelfBooks" :id="`room-book-${index}`" :key="index" class="shelf-book" type="button"
            :style="{ left: 24.1+index%5*10.05+'%', top: (index<5 ? 20.1 : 52.8)+'%' }"
            :aria-label="book.title || `Book slot ${index+1}`" :tabindex="currentBook ? -1 : 0" @click="openBook(index)">
            <span class="book-tab">{{ book.title || `Book ${index+1}` }}</span>
          </button>
        </div>
        <div v-if="currentBook" class="book-focus">
          <div class="book-jacket" :style="{ backgroundColor: currentBook.color }"><img v-if="currentBook.cover" :src="currentBook.cover" alt="" /><span v-else>{{ currentBook.title || `Book ${bookIndex+1}` }}</span></div>
        </div>
      </template>
      <div v-else-if="object.id === 'record'" class="listening-station">
        <img class="in-room-art" :src="roomView('record')" alt="The turntable on its oak table inside the study" />
        <StudyPennants scene="record" />
        <div class="record-selection">
          <h3>Choose a record</h3>
          <p v-if="!recordCollection.length" class="no-records">No records added yet.</p>
          <ul v-else><li v-for="(track,index) in recordCollection" :key="track.url"><button type="button" :aria-pressed="trackIndex === index" @click="trackIndex=index">{{ track.title }}</button></li></ul>
          <iframe v-if="recordUrl(currentTrack)" :key="currentTrack.url" :src="recordUrl(currentTrack)" :title="`Play ${currentTrack.title} on SoundCloud`" loading="lazy" allow="autoplay"></iframe>
        </div>
      </div>
      <div v-else-if="object.id === 'globe'" class="globe-in-room">
        <img class="in-room-art" :src="roomView('globe')" alt="A globe with an oak base and brass ring inside the study" />
        <StudyPennants scene="globe" />
        <StudyGlobe interactive embedded />
      </div>
      <div v-else-if="profile" class="front-cat-view" :class="`portrait-${object.id.toLowerCase()}`">
        <button type="button" class="cat-portrait" :aria-label="`Play with ${object.label}`"
          :style="{ '--tilt-x': tilt.x+'px', '--tilt-y': tilt.y+'px' }"
          @pointermove="followPointer" @pointerleave="tilt = { x:0,y:0 }" @click="reaction++">
          <span :key="reaction" :class="{ 'cat-reaction': reaction > 0 }"><img :src="catArt" :alt="object.label" draggable="false" /></span>
        </button>
        <div class="cat-profile">
          <h3>{{ object.label }}</h3>
          <p class="cat-chinese-name" lang="zh">{{ profile.chineseName }}</p>
          <ul><li v-for="fact in profile.facts" :key="fact">{{ fact }}</li></ul>
        </div>
      </div>
      <div v-else-if="object.id === 'golf'" class="golf-in-room">
        <img class="in-room-art" :src="roomView('golf')" alt="Olive golf bag beside the bamboo and glass doors inside the study" />
      </div>
    </div>
  </section>
</template>
