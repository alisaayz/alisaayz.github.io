<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Icon from './components/Icon.vue'
import { profile } from './portfolio.js'
import { resume } from './resume.js'
import headshot from './assets/personal/headshot-button-down.png'
import signature from './assets/personal/signature-transparent.png'
import singaporePhoto from './assets/personal/singapore-private.png'
import summerSeries from './assets/personal/summer-series-private.png'
import wildCollage from './assets/personal/travel-grid-private.png'
import onoPhoto from './assets/personal/ono.jpg'
import yuzuPhoto from './assets/personal/yuzu.jpg'
import uclaLogo from './assets/logos/ucla.svg'
import wfuLogo from './assets/logos/wfu.webp'

const pages = [
  { label: 'About Me', hash: 'about' },
  { label: 'Experience', hash: 'experience' },
  { label: 'Education', hash: 'education' },
  { label: 'Projects', hash: 'projects' },
  { label: 'Skills', hash: 'skills' },
  { label: 'Beyond the Resume', hash: 'beyond' },
]
const galleryPhotos = [
  { caption: 'Goldman Sachs Summer Series Asia presentation · Hong Kong, China', alt: 'Alisa presenting at Goldman Sachs Summer Series Asia, with other faces softly blurred', tile: null, src: summerSeries, position: 'center top' },
  { caption: 'Golfing · Furry Creek, Vancouver, Canada', alt: 'Alisa golfing at Furry Creek near Vancouver', tile: 3 },
  { caption: 'Traveling · Eigergletscher, Switzerland', alt: 'Alisa traveling at Eigergletscher in Switzerland', tile: 1 },
  { caption: 'Traveling · Singapore, Singapore', alt: 'Alisa traveling in Singapore by a lily pond and city skyline', tile: null, src: singaporePhoto, position: 'center 30%' },
  { caption: 'Traveling · Shangri-La, China', alt: 'Alisa with arms spread by a lake in Shangri-La City', tile: 0 },
  { caption: 'UCLA beach day orientation · Los Angeles, United States', alt: 'Alisa smiling at UCLA beach day orientation', tile: 2 },
]
const sectionPreviews = {
  experience: { summary: 'Financial modeling, market research, and the business decisions behind my work.', detail: 'York Biotechnology · CICC Alpha · Industrial Securities' },
  education: { summary: 'The coursework shaping my analytical and business toolkit.', detail: 'UCLA Anderson · Wake Forest University' },
  projects: { summary: 'A space for the questions I explore and the projects I build.', detail: 'Coming soon' },
  skills: { summary: 'The tools and methods I use to turn information into insight.', detail: 'Python · SQL · R · Equity research · Business analysis' },
  beyond: { summary: 'A little of life outside work and study.', detail: 'Travel · Hobbies · Ono & Yuzu' },
}
const resumeUrl = `${import.meta.env.BASE_URL}Alisa_Zhu_Resume.pdf`
const pageFromHash = () => {
  const hash = location.hash.slice(1)
  if (hash === 'resume') return 'experience'
  return pages.some(page => page.hash === hash) ? hash : 'about'
}
const activePage = ref(pageFromHash())
const activeIndex = computed(() => pages.findIndex(page => page.hash === activePage.value))
const nextPage = computed(() => pages[activeIndex.value + 1])
const turningTo = ref(null)
let turnTimer, finishTimer
let edgeReadyAt = 0, lastWheelAt = 0, wheelDistance = 0, wheelGestureAllowed = false
let lastNavigationAt = performance.now()
let touchStart = null
function atPageBottom() {
  return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
}
function updateScrollEdge() {
  if (!atPageBottom()) { edgeReadyAt = 0; wheelGestureAllowed = false; wheelDistance = 0 }
  else if (!edgeReadyAt) edgeReadyAt = performance.now()
}
function ignoreGesture(target) {
  return target instanceof Element && !!target.closest('.sidebar, .appearance-control, input, textarea, select')
}
function turnPage() {
  if (!nextPage.value || turningTo.value) return
  turningTo.value = { ...nextPage.value, number: activeIndex.value + 2 }
  const destination = nextPage.value.hash
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  turnTimer = window.setTimeout(async () => {
    navigate(destination, true)
    await nextTick()
    document.getElementById('main-content')?.focus({ preventScroll: true })
    finishTimer = window.setTimeout(() => { turningTo.value = null }, reducedMotion ? 0 : 280)
  }, reducedMotion ? 0 : 300)
}
function handleWheel(event) {
  const now = performance.now()
  const freshGesture = now - lastWheelAt > 240
  lastWheelAt = now
  if (event.ctrlKey || ignoreGesture(event.target) || turningTo.value || now - lastNavigationAt < 900) return
  if (event.deltaY <= 0 || !atPageBottom()) { wheelGestureAllowed = false; wheelDistance = 0; return }
  updateScrollEdge()
  if (freshGesture) {
    wheelDistance = 0
    wheelGestureAllowed = now - edgeReadyAt > 350
  }
  if (!wheelGestureAllowed) return
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1)
  wheelDistance += delta
  if (wheelDistance >= 140) turnPage()
}
function handleTouchStart(event) {
  updateScrollEdge()
  const now = performance.now()
  const point = event.touches.length === 1 ? event.touches[0] : null
  touchStart = point && !ignoreGesture(event.target) && atPageBottom() && now - edgeReadyAt > 350 && now - lastNavigationAt > 900
    ? { x: point.clientX, y: point.clientY } : null
}
function handleTouchEnd(event) {
  const point = event.changedTouches[0]
  if (touchStart && point && touchStart.y - point.clientY > 70 && Math.abs(touchStart.x - point.clientX) < 80) turnPage()
  touchStart = null
}
function cancelTouch() { touchStart = null }
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const themePreference = ref(document.documentElement.dataset.themePreference || 'system')
const isDark = ref(systemTheme.matches)
function syncTheme() {
  isDark.value = themePreference.value === 'system' ? systemTheme.matches : themePreference.value === 'dark'
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark.value ? '#111a27' : '#ffffff')
}
function chooseTheme(preference) {
  themePreference.value = preference
  document.documentElement.dataset.themePreference = preference
  try { localStorage.setItem('portfolio-appearance', preference) } catch { /* The selection still works without storage. */ }
  syncTheme()
}
function navigate(page, duringTurn = false) {
  if (!duringTurn) { clearTimeout(turnTimer); clearTimeout(finishTimer); turningTo.value = null }
  edgeReadyAt = 0
  wheelDistance = 0
  wheelGestureAllowed = false
  touchStart = null
  lastNavigationAt = performance.now()
  activePage.value = page
  history.pushState(null, '', `#${page}`)
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function syncPage() {
  if (location.hash === '#main-content') return
  clearTimeout(turnTimer)
  clearTimeout(finishTimer)
  turningTo.value = null
  activePage.value = pageFromHash()
  edgeReadyAt = 0
  wheelGestureAllowed = false
  lastNavigationAt = performance.now()
  window.scrollTo({ top: 0, behavior: 'instant' })
}
onMounted(() => {
  syncTheme()
  systemTheme.addEventListener('change', syncTheme)
  window.addEventListener('popstate', syncPage)
  window.addEventListener('hashchange', syncPage)
  window.addEventListener('scroll', updateScrollEdge, { passive: true })
  window.addEventListener('wheel', handleWheel, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend', handleTouchEnd, { passive: true })
  window.addEventListener('touchcancel', cancelTouch, { passive: true })
})
onUnmounted(() => {
  systemTheme.removeEventListener('change', syncTheme)
  window.removeEventListener('popstate', syncPage)
  window.removeEventListener('hashchange', syncPage)
  window.removeEventListener('scroll', updateScrollEdge)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('touchcancel', cancelTouch)
  clearTimeout(turnTimer)
  clearTimeout(finishTimer)
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="site-layout">
    <aside class="sidebar" aria-label="Profile and navigation">
      <div class="sidebar-brand">
        <a class="signature-logo" href="#about" aria-label="Alisa Zhu home" @click.prevent="navigate('about')"><img :src="signature" alt="Alisa Zhu signature logo" /></a>
        <h1>{{ profile.name }}</h1>
      </div>
      <nav class="navigation" aria-label="Main navigation">
        <a v-for="(page, index) in pages" :key="page.hash" :href="`#${page.hash}`" :class="{ active: activePage === page.hash }" :aria-current="activePage === page.hash ? 'page' : undefined" @click.prevent="navigate(page.hash)">
          <span class="nav-number" aria-hidden="true">0{{ index + 1 }}</span><span>{{ page.label }}</span>
        </a>
      </nav>
      <div class="sidebar-links">
        <a :href="`mailto:${profile.email}`"><Icon name="mail" /><span><small>Email</small>{{ profile.email }}</span></a>
        <a :href="profile.linkedin" target="_blank" rel="noopener noreferrer"><Icon name="linkedin" /><span><small>LinkedIn</small>alisa-zhu <Icon name="arrow" /></span></a>
        <div class="appearance-control sidebar-appearance">
          <p class="theme-status"><Icon :name="isDark ? 'moon' : 'sun'" /><span>Appearance</span></p>
          <div class="appearance-options" role="group" aria-label="Appearance">
            <button v-for="option in ['system', 'light', 'dark']" :key="option" type="button" :aria-pressed="themePreference === option" @click="chooseTheme(option)">{{ option }}</button>
          </div>
        </div>
      </div>
    </aside>
    <main id="main-content" tabindex="-1">
      <section v-if="activePage === 'about'" class="about-page" aria-label="About Me">
        <div class="hero-copy">
          <p class="eyebrow">Data Analytics <span>•</span> Finance <span>•</span> Technology</p>
          <h2>Turning data into<br>better <em>business decisions.</em></h2>
        </div>
        <div class="hero-visual">
          <div class="headshot-photo"><img :src="headshot" alt="Alisa Zhu headshot" /></div>
        </div>
        <div class="about-story"><p v-for="paragraph in profile.aboutParagraphs" :key="paragraph">{{ paragraph }}</p></div>
      </section>
      <div v-else class="page-content" :key="activePage">
        <header class="page-header"><p class="eyebrow">{{ activePage === 'experience' ? 'Professional journey' : activePage === 'education' ? 'Learning & foundations' : activePage === 'skills' ? 'Tools & expertise' : activePage === 'beyond' ? 'A little more about me' : 'Ideas into practice' }}</p><h2>{{ pages.find(page => page.hash === activePage)?.label }}</h2></header>
        <template v-if="activePage === 'experience'">
          <div class="resume-actions">
            <a class="primary-button" :href="resumeUrl" target="_blank" rel="noopener noreferrer">View Resume <Icon name="arrow" /></a>
            <a class="secondary-button" :href="resumeUrl" download="Alisa_Zhu_Resume.pdf">Download PDF <Icon name="book" /></a>
          </div>
          <section class="section-block">
            <div class="timeline-heading"><span class="icon-box"><Icon name="book" /></span><h3>Professional Experience</h3></div>
            <ol class="timeline resume-timeline">
              <li v-for="experience in resume.experience" :key="experience.company">
                <h4>{{ experience.company }}</h4>
                <p class="resume-meta">{{ experience.location }}</p>
                <div v-for="role in experience.roles" :key="role.title" class="resume-role">
                  <span class="timeline-label">{{ role.title }}</span>
                  <p class="resume-dates">{{ role.dates }}</p>
                </div>
                <div v-for="(group, index) in experience.groups" :key="index" class="resume-achievements">
                  <h5 v-if="group.title">{{ group.title }}</h5>
                  <ul class="resume-bullets"><li v-for="bullet in group.bullets" :key="bullet">{{ bullet }}</li></ul>
                </div>
              </li>
            </ol>
          </section>
        </template>
        <template v-else-if="activePage === 'education'">
          <section class="section-block">
            <div class="timeline-heading"><span class="icon-box"><Icon name="school" /></span><h3>Education</h3></div>
            <ol class="timeline resume-timeline">
              <li v-for="education in resume.education" :key="education.school">
                <div class="education-heading">
                  <span class="school-logo" :class="education.school.startsWith('UCLA') ? 'school-logo-ucla' : 'school-logo-wfu'">
                    <img :src="education.school.startsWith('UCLA') ? uclaLogo : wfuLogo" :alt="education.school.startsWith('UCLA') ? 'UCLA logo' : 'Wake Forest University logo'" />
                  </span>
                  <h4>{{ education.school }}</h4>
                </div>
                <p class="resume-meta">{{ education.location }}</p>
                <span class="timeline-label">{{ education.degree }}</span>
                <p class="resume-dates">{{ education.dates }}</p>
                <div class="education-coursework">
                  <h5 class="education-subheading">Relevant Coursework</h5>
                  <div class="coursework-grid">
                    <section v-for="group in education.courseGroups" :key="group.title" class="coursework-group">
                      <h6>{{ group.title }}</h6>
                      <span v-if="group.status" class="coursework-status">{{ group.status }}</span>
                      <ul class="education-list"><li v-for="course in group.courses" :key="course">{{ course }}</li></ul>
                    </section>
                  </div>
                </div>
                <section v-for="detail in education.details" :key="detail.title" class="education-detail">
                  <h5 class="education-subheading">{{ detail.title }}</h5>
                  <ul class="education-list">
                    <li v-for="item in detail.items" :key="item">{{ item }}</li>
                  </ul>
                </section>
              </li>
            </ol>
          </section>
        </template>
        <template v-else-if="activePage === 'skills'">
          <section class="section-block">
            <div class="timeline-heading"><span class="icon-box"><Icon name="code" /></span><h3>Technical Skills</h3></div>
            <div v-for="skill in resume.skills" :key="skill.category" class="resume-skill-group">
              <h4>{{ skill.category }}</h4>
              <div class="interest-tags"><span v-for="item in skill.items" :key="item">{{ item }}</span></div>
            </div>
          </section>
        </template>
        <section v-else-if="activePage === 'beyond'" class="beyond-page">
          <div class="personal-grid">
            <section class="personal-card"><h3>Languages</h3><dl class="language-list"><div><dt>English</dt><dd>Native</dd></div><div><dt>Chinese</dt><dd>Native</dd></div><div><dt>Spanish</dt><dd>Beginner</dd></div></dl></section>
            <section class="personal-card"><h3>Hobbies</h3><ul class="hobby-grid"><li v-for="hobby in [{ name: 'Golf', symbol: '⛳' }, { name: 'Skiing', symbol: '⛷' }, { name: 'Incense crafting', symbol: '✧' }, { name: 'Surfing', symbol: '≈' }]" :key="hobby.name"><span class="hobby-symbol" aria-hidden="true">{{ hobby.symbol }}</span><span>{{ hobby.name }}</span></li></ul></section>
          </div>
          <section class="wild-section"><h3>In the Wild</h3><div class="captioned-gallery">
            <figure v-for="photo in galleryPhotos" :key="photo.caption" class="gallery-card">
              <div class="gallery-image"><img v-if="photo.tile !== null" :src="wildCollage" :alt="photo.alt" :class="`gallery-tile gallery-tile-${photo.tile}`" loading="lazy" /><img v-else :src="photo.src" :alt="photo.alt" class="gallery-event" :style="{ objectPosition: photo.position }" loading="lazy" /></div>
              <figcaption>{{ photo.caption }}</figcaption>
            </figure>
          </div></section>
          <section class="cat-section"><h3>Meet Ono &amp; Yuzu</h3><div class="cat-grid">
            <figure class="cat-card"><img :src="onoPhoto" alt="Ono, my darker-colored cat, playing on the carpet" loading="lazy" /><figcaption>Ono</figcaption></figure>
            <figure class="cat-card"><img :src="yuzuPhoto" alt="Yuzu, my yellow-colored cat, wearing pink headphones" loading="lazy" /><figcaption>Yuzu</figcaption></figure>
          </div></section>
        </section>
        <section v-else-if="activePage === 'projects'" class="coming-soon">
          <span class="coming-symbol" aria-hidden="true">✧</span>
          <h3>Coming soon</h3>
          <p>New projects will be shared here.</p>
        </section>
      </div>
      <footer class="mobile-appearance-footer">
        <div class="appearance-control">
          <p class="theme-status"><Icon :name="isDark ? 'moon' : 'sun'" /><span>Appearance</span></p>
          <div class="appearance-options" role="group" aria-label="Appearance">
            <button v-for="option in ['system', 'light', 'dark']" :key="option" type="button" :aria-pressed="themePreference === option" @click="chooseTheme(option)">{{ option }}</button>
          </div>
        </div>
      </footer>
      <section v-if="nextPage" class="next-section-preview" :key="`next-${activePage}`" :aria-label="`Next section: ${nextPage.label}`">
        <div class="section-progress" aria-label="Section progress"><span v-for="(page, index) in pages" :key="page.hash" :class="{ complete: index <= activeIndex }" aria-hidden="true"></span><small>{{ activeIndex + 1 }} / {{ pages.length }}</small></div>
        <p class="eyebrow">Next section · 0{{ activeIndex + 2 }}</p>
        <h2>{{ nextPage.label }}</h2>
        <p class="next-summary">{{ sectionPreviews[nextPage.hash].summary }}</p>
        <p class="next-details">{{ sectionPreviews[nextPage.hash].detail }}</p>
        <div class="next-section-actions"><p><span aria-hidden="true">↓</span> Scroll again to enter the next section</p><button class="secondary-button" type="button" @click="turnPage">Continue to {{ nextPage.label }} <Icon name="arrow" /></button></div>
      </section>
      <div v-else class="section-end"><p class="eyebrow">06 / 06 · Beyond the Resume</p><p>Thanks for getting to know me.</p><button class="secondary-button" type="button" @click="navigate('about')">Back to About Me <Icon name="arrow" /></button></div>
    </main>
    <Transition name="page-turn"><div v-if="turningTo" class="page-turn-overlay" role="status" aria-live="polite"><span class="eyebrow">Next section · 0{{ turningTo.number }}</span><p>{{ turningTo.label }}</p><span class="page-turn-line" aria-hidden="true"></span></div></Transition>
  </div>
</template>
