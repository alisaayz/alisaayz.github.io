<script setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Icon from './components/Icon.vue'
import SplitFlapGreeting from './components/SplitFlapGreeting.vue'
import { galleryPhotos, wildCollage } from './gallery.js'
import { profile } from './portfolio.js'
import { resume } from './resume.js'
import { featuredProjects } from './projects.js'
import { preloadArt, roomArt } from './studyAssets.js'
import signature from './assets/personal/signature-transparent.png'
import onoPhoto from './assets/personal/ono.jpg'
import yuzuPhoto from './assets/personal/yuzu.jpg'
import uclaLogo from './assets/logos/ucla-seal.svg'
import wfuLogo from './assets/logos/wfu-seal.webp'

const pages = [
  { label: 'About Me', hash: 'about' },
  { label: 'Experience', hash: 'experience', title: 'Professional Journey' },
  { label: 'Education', hash: 'education', title: 'Learning & Foundations' },
  { label: 'Projects', hash: 'projects', title: 'Ideas Into Practice' },
  { label: 'Skills', hash: 'skills', title: 'Tools & Expertise' },
  { label: 'Beyond the Resume', hash: 'beyond', title: 'A Little More About Me' },
]
const resumeUrl = `${import.meta.env.BASE_URL}Alisa_Zhu_Resume.pdf`
const pageFromHash = () => {
  const hash = location.hash.slice(1)
  if (hash === 'resume') return 'experience'
  return pages.some(page => page.hash === hash) ? hash : 'about'
}
const activePage = ref(pageFromHash())
const pageIndex = computed(() => pages.findIndex(page => page.hash === activePage.value))
const pageInfo = computed(() => pages[pageIndex.value])
const skillDialog = ref(null)
const selectedSkill = ref('')
const skillProjects = computed(() => featuredProjects.filter(project => project.tools.includes(selectedSkill.value)))
const skillExperience = computed(() => resume.experience.filter(experience => experience.skills?.includes(selectedSkill.value)))
const usedSkills = new Set([
  ...featuredProjects.flatMap(project => project.tools),
  ...resume.experience.flatMap(experience => experience.skills ?? []),
])
function showSkill(skill) {
  selectedSkill.value = skill
  skillDialog.value.showModal()
}
async function showSkillExample(page, id) {
  skillDialog.value.close()
  await navigate(page)
  const item = document.getElementById(id)
  item?.scrollIntoView({ block:'center' })
  item?.focus({ preventScroll:true })
}
const loadStudy = () => import('./components/StudyRoom.vue')
const StudyRoom = defineAsyncComponent(loadStudy)
function warmStudy() {
  preloadArt(roomArt, 'auto')
  loadStudy().catch(() => {})
}
const roomOpen = ref(false)
const corner = ref(null)
async function closeRoom() {
  roomOpen.value = false
  await nextTick()
  corner.value?.focus({ preventScroll: true })
}
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const themePreference = ref(document.documentElement.dataset.themePreference || 'system')
const isDark = ref(systemTheme.matches)
function syncTheme() {
  isDark.value = themePreference.value === 'system' ? systemTheme.matches : themePreference.value === 'dark'
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark.value ? '#202a34' : '#f8fafb')
}
function chooseTheme(preference) {
  themePreference.value = preference
  document.documentElement.dataset.themePreference = preference
  try { localStorage.setItem('portfolio-appearance', preference) } catch { /* The selection still works without storage. */ }
  syncTheme()
}
async function navigate(page) {
  roomOpen.value = false
  activePage.value = page
  if (location.hash !== `#${page}`) history.pushState(null, '', `#${page}`)
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'instant' })
  document.getElementById('main-content')?.focus({ preventScroll: true })
}
function syncPage() {
  if (location.hash === '#main-content') return
  roomOpen.value = false
  activePage.value = pageFromHash()
}
onMounted(() => {
  syncTheme()
  if (!navigator.connection?.saveData) {
    if (window.requestIdleCallback) window.requestIdleCallback(warmStudy, { timeout:1500 })
    else window.setTimeout(warmStudy,900)
  }
  systemTheme.addEventListener('change', syncTheme)
  window.addEventListener('popstate', syncPage)
  window.addEventListener('hashchange', syncPage)
})
onUnmounted(() => {
  systemTheme.removeEventListener('change', syncTheme)
  window.removeEventListener('popstate', syncPage)
  window.removeEventListener('hashchange', syncPage)
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="site-layout">
    <aside class="sidebar" aria-label="Profile and navigation">
      <h1 class="sidebar-brand"><img class="signature-logo" :src="signature" :alt="profile.name" /></h1>
      <nav class="navigation" aria-label="Main navigation">
        <a v-for="(page, index) in pages" :key="page.hash" :href="`#${page.hash}`" :class="{ active: activePage === page.hash }" :aria-current="activePage === page.hash ? 'page' : undefined" @click.prevent="navigate(page.hash)">
          <span class="nav-number" aria-hidden="true">0{{ index + 1 }}</span><span>{{ page.label }}</span>
        </a>
      </nav>
      <div class="sidebar-links">
        <a :href="`mailto:${profile.email}`"><Icon name="mail" /><span><small>Email</small>{{ profile.email }}</span></a>
        <a :href="profile.github" target="_blank" rel="noopener noreferrer" aria-label="GitHub: alisaayz"><Icon name="github" /><span>GitHub <Icon name="arrow" /></span></a>
        <a :href="profile.linkedin" target="_blank" rel="noopener noreferrer"><Icon name="linkedin" /><span>LinkedIn <Icon name="arrow" /></span></a>
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
          <p class="eyebrow">01 <span>/</span> About Me</p>
          <h2><SplitFlapGreeting text="Hi, I'm Alisa" /></h2>
        </div>
        <div class="hero-description">
          <p class="about-tagline">Turning data into better business decisions.</p>
          <p class="about-meta"><span>Data Analytics · Finance</span><span class="meta-divider" aria-hidden="true"> · </span><span>Technology · Healthcare</span></p>
        </div>
        <div class="about-story">
          <section v-for="part in profile.aboutSections" :key="part.heading">
            <h3>{{ part.heading }}</h3>
            <p>{{ part.body }}</p>
          </section>
        </div>
      </section>
      <div v-else class="page-content" :key="activePage">
        <header class="page-header">
          <p class="eyebrow">0{{ pageIndex + 1 }} / {{ pageInfo.label }}</p>
          <h2>{{ pageInfo.title }}</h2>
        </header>
        <template v-if="activePage === 'experience'">
          <div class="resume-actions">
            <a class="primary-button" :href="resumeUrl" target="_blank" rel="noopener noreferrer">View Resume <Icon name="arrow" /></a>
            <a class="secondary-button" :href="resumeUrl" download="Alisa_Zhu_Resume.pdf">Download PDF <Icon name="book" /></a>
          </div>
          <section class="section-block">
            <ol class="timeline resume-timeline">
              <li v-for="experience in resume.experience" :id="experience.id" :key="experience.id" tabindex="-1">
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
            <ol class="timeline resume-timeline">
              <li v-for="education in resume.education" :key="education.school">
                <div class="education-heading">
                  <span class="school-logo" :class="education.school.startsWith('UCLA') ? 'school-logo-ucla' : 'school-logo-wfu'">
                    <img :src="education.school.startsWith('UCLA') ? uclaLogo : wfuLogo" :alt="education.school.startsWith('UCLA') ? 'UCLA campus seal' : 'Wake Forest University seal'" />
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
            <p class="skill-hint">Select a skill with an arrow to see related projects and work experience.</p>
            <div v-for="skill in resume.skills" :key="skill.category" class="resume-skill-group">
              <h4>{{ skill.category }}</h4>
              <div class="interest-tags">
                <template v-for="item in skill.items" :key="item">
                  <button v-if="usedSkills.has(item)" type="button" aria-haspopup="dialog" @click="showSkill(item)">{{ item }} <Icon name="arrow" /></button>
                  <span v-else>{{ item }}</span>
                </template>
              </div>
            </div>
          </section>
        </template>
        <section v-else-if="activePage === 'beyond'" class="beyond-page">
          <div class="personal-grid">
            <section class="personal-card"><h3>Languages</h3><dl class="language-list"><div><dt>English</dt><dd>Native</dd></div><div><dt>Chinese</dt><dd>Native</dd></div><div><dt>Spanish</dt><dd>Beginner</dd></div></dl></section>
            <section class="personal-card"><h3>Hobbies</h3><ul class="hobby-grid"><li v-for="hobby in [{ name: 'Golf', symbol: '⛳️' }, { name: 'Skiing', symbol: '⛷️' }, { name: 'Incense crafting', symbol: '🕯️' }, { name: 'Surfing', symbol: '🏄' }]" :key="hobby.name"><span class="hobby-symbol" aria-hidden="true">{{ hobby.symbol }}</span><span>{{ hobby.name }}</span></li></ul></section>
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
        <section v-else-if="activePage === 'projects'" class="project-list" aria-label="Selected projects">
          <article v-for="project in featuredProjects" :id="project.id" :key="project.id" tabindex="-1">
            <h3>{{ project.title }}</h3>
            <p v-if="project.status" class="project-status">{{ project.status }}</p>
            <p>{{ project.summary }}</p>
            <ul class="project-tools" aria-label="Skills used"><li v-for="tool in project.tools" :key="tool">{{ tool }}</li></ul>
            <a v-if="project.url" :href="project.url" target="_blank" rel="noopener noreferrer">{{ project.link }} <Icon name="arrow" /></a>
          </article>
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
    </main>
  </div>
  <button ref="corner" class="page-fold" type="button" aria-label="Open the study room" aria-haspopup="dialog" :aria-expanded="roomOpen" @pointerenter="warmStudy" @focus="warmStudy" @click="roomOpen = true">
    <svg class="fold-art" viewBox="0 0 176 132" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="fold-reveal" x2="22%" y2="100%">
          <stop stop-color="#405e78" />
          <stop offset="1" stop-color="#253d53" />
        </linearGradient>
        <linearGradient id="fold-paper" x1="35%" y1="78%" x2="69%" y2="31%">
          <stop stop-color="#c9d9e6" />
          <stop offset=".5" stop-color="#91acc2" />
          <stop offset="1" stop-color="#5d7b96" />
        </linearGradient>
      </defs>
      <path class="fold-reveal" fill="url(#fold-reveal)" d="M 24 0 H 176 V 118 C 141 65 83 25 24 0 Z" />
      <path class="fold-paper" fill="url(#fold-paper)" d="M 24 0 C 83 25 141 65 176 118 C 149 90 123 79 97 73 C 107 50 70 21 24 0 Z" />
    </svg>
    <span class="fold-label" aria-hidden="true"><span>Study Room</span><span class="fold-demo">demo</span></span>
  </button>
  <dialog ref="skillDialog" class="skill-dialog" aria-labelledby="skill-dialog-title">
    <div class="skill-dialog-header">
      <h2 id="skill-dialog-title">{{ selectedSkill }}</h2>
      <form method="dialog"><button type="submit" aria-label="Close skill examples">×</button></form>
    </div>
    <section v-if="skillProjects.length" class="skill-examples">
      <h3>Projects</h3>
      <ul>
        <li v-for="project in skillProjects" :key="project.id">
          <button type="button" @click="showSkillExample('projects', project.id)">{{ project.title }} <Icon name="arrow" /></button>
        </li>
      </ul>
    </section>
    <section v-if="skillExperience.length" class="skill-examples">
      <h3>Work Experience</h3>
      <ul>
        <li v-for="experience in skillExperience" :key="experience.id">
          <button type="button" @click="showSkillExample('experience', experience.id)">{{ experience.company }} <Icon name="arrow" /></button>
        </li>
      </ul>
    </section>
  </dialog>
  <StudyRoom v-if="roomOpen" @close="closeRoom" />
</template>
