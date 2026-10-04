<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import Icon from './components/Icon.vue'
import { profile, interests } from './portfolio.js'
import { resume } from './resume.js'
const pages = ['About', 'Resume']
const resumeUrl = `${import.meta.env.BASE_URL}Alisa_Zhu_Resume.pdf`
const pageFromHash = () => pages.find(page => page.toLowerCase() === location.hash.slice(1)) || 'About'
const activePage = ref(pageFromHash())
const detailsOpen = ref(false)
const isDark = ref(document.documentElement.dataset.theme !== 'light')
function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark.value ? '#1e1e1f' : '#ffffff')
  try { localStorage.setItem('portfolio-theme', theme) } catch { /* The switch still works when storage is unavailable. */ }
}
function navigate(page) {
  activePage.value = page
  history.pushState(null, '', `#${page.toLowerCase()}`)
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function syncPage() {
  if (location.hash === '#main-content') return
  activePage.value = pageFromHash()
}
onMounted(() => window.addEventListener('popstate', syncPage))
onUnmounted(() => window.removeEventListener('popstate', syncPage))
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="portfolio-layout">
    <aside class="profile-panel panel" aria-label="Profile">
      <button class="contact-toggle" :aria-label="detailsOpen ? 'Hide details' : 'Show details'" :aria-expanded="detailsOpen" aria-controls="profile-details" @click="detailsOpen = !detailsOpen"><span>{{ detailsOpen ? 'Hide details' : 'Show details' }}</span><Icon name="chevron" /></button>
      <div class="profile-intro"><div class="avatar" aria-hidden="true"><span>{{ profile.initials }}</span><i></i></div><div><h1>{{ profile.name }}</h1><p class="role-badge">{{ profile.role }}</p></div></div>
      <div class="theme-control">
        <span :class="{ selected: !isDark }">Light</span>
        <button class="theme-switch" type="button" role="switch" aria-label="Dark mode" :aria-checked="isDark" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          <span class="theme-thumb"><Icon :name="isDark ? 'moon' : 'sun'" /></span>
        </button>
        <span :class="{ selected: isDark }">Dark</span>
      </div>
      <div id="profile-details" class="profile-details" :class="{ expanded: detailsOpen }">
        <div class="divider"></div>
        <ul class="contact-list">
          <li><span class="icon-box"><Icon name="mail" /></span><div><span class="eyebrow">Email</span><a :href="`mailto:${profile.email}`">{{ profile.email }}</a></div></li>
          <li><span class="icon-box"><Icon name="linkedin" /></span><div><span class="eyebrow">LinkedIn</span><a :href="profile.linkedin" target="_blank" rel="noopener noreferrer">linkedin.com/in/alisa-zhu/</a></div></li>
          <li v-if="profile.phone"><span class="icon-box"><Icon name="phone" /></span><div><span class="eyebrow">Phone</span><a :href="`tel:${profile.phone}`">{{ profile.phone }}</a></div></li>
          <li><span class="icon-box"><Icon name="school" /></span><div><span class="eyebrow">Education</span><span>MSBA at UCLA Anderson</span></div></li>
          <li><span class="icon-box"><Icon name="github" /></span><div><span class="eyebrow">GitHub</span><a :href="profile.github" target="_blank" rel="noopener noreferrer">{{ profile.handle }}</a></div></li>
        </ul>
        <div class="divider"></div><p class="sidebar-note">A little about me.<br>A collection of what I’m exploring.</p>
      </div>
    </aside>
    <main id="main-content" class="content-panel panel" tabindex="-1">
      <nav class="navigation" aria-label="Main navigation"><a v-for="page in pages" :key="page" :href="`#${page.toLowerCase()}`" :class="{ active: activePage === page }" :aria-current="activePage === page ? 'page' : undefined" @click.prevent="navigate(page)">{{ page }}</a></nav>
      <div class="page-content" :key="activePage">
        <header class="page-header"><h2>{{ activePage === 'About' ? 'About Me' : activePage }}</h2><span class="title-rule"></span></header>
        <template v-if="activePage === 'About'">
          <div class="intro-copy"><p v-for="paragraph in profile.bio" :key="paragraph">{{ paragraph }}</p></div>
          <section class="section-block"><h3>What I’m Exploring</h3><div class="services-grid"><article v-for="interest in interests" :key="interest.title" class="service-card"><Icon :name="interest.icon" /><div><h4>{{ interest.title }}</h4><p>{{ interest.description }}</p></div></article></div></section>
          <section class="section-block journey-card"><Icon name="school" /><div><span class="eyebrow">The next chapter</span><h4>UCLA Anderson School of Management</h4><p>Master of Science in Business Analytics</p></div></section>
        </template>
        <template v-else-if="activePage === 'Resume'">
          <div class="resume-actions">
            <a class="primary-button" :href="resumeUrl" target="_blank" rel="noopener noreferrer">View Resume <Icon name="arrow" /></a>
            <a class="primary-button" :href="resumeUrl" download="Alisa_Zhu_Resume.pdf">Download Resume <Icon name="book" /></a>
          </div>
          <section class="section-block resume-intro" aria-label="Professional summary">
            <h3>{{ resume.name }}</h3>
            <p class="resume-title">{{ resume.title }}</p>
            <div class="resume-contact">
              <a :href="`mailto:${resume.email}`">{{ resume.email }}</a>
              <a href="tel:+13366080388">{{ resume.phone }}</a>
              <a :href="resume.linkedin" target="_blank" rel="noopener noreferrer">LinkedIn <Icon name="arrow" /></a>
            </div>
            <p class="resume-meta">{{ resume.location }}</p>
            <p class="resume-meta">{{ resume.workAuthorization }}</p>
            <p class="page-description resume-summary">{{ resume.summary }}</p>
          </section>
          <section class="section-block">
            <div class="timeline-heading"><span class="icon-box"><Icon name="school" /></span><h3>Education</h3></div>
            <ol class="timeline resume-timeline">
              <li v-for="education in resume.education" :key="education.school">
                <h4>{{ education.school }}</h4>
                <p class="resume-meta">{{ education.location }}</p>
                <span class="timeline-label">{{ education.degree }}</span>
                <p class="resume-dates">{{ education.dates }}</p>
                <p class="resume-coursework"><strong>Coursework:</strong> {{ education.courses }}</p>
              </li>
            </ol>
          </section>
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
          <section class="section-block">
            <div class="timeline-heading"><span class="icon-box"><Icon name="code" /></span><h3>Technical Skills</h3></div>
            <div v-for="skill in resume.skills" :key="skill.category" class="resume-skill-group">
              <h4>{{ skill.category }}</h4>
              <div class="interest-tags"><span v-for="item in skill.items" :key="item">{{ item }}</span></div>
            </div>
          </section>
        </template>
      </div><footer class="page-footer"><span>Made with curiosity & care.</span><span>Alisa Zhu <span class="footer-dot">•</span> Portfolio</span></footer>
    </main>
  </div>
</template>
