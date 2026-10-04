<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import Icon from './components/Icon.vue'
import { profile, interests, projects, posts } from './portfolio.js'
import { resume } from './resume.js'
const pages = ['About', 'Resume', 'Portfolio', 'Blog', 'Contact']
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
const filter = ref('All')
const categories = ['All', 'Analytics', 'Visualization', 'Machine learning']
const visibleProjects = computed(() => projects.filter(p => filter.value === 'All' || p.category === filter.value))
const selected = ref(null)
const modal = ref(null)
const copyStatus = ref('')
let timer
function navigate(page) {
  activePage.value = page
  history.pushState(null, '', `#${page.toLowerCase()}`)
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function syncPage() {
  if (location.hash === '#main-content') return
  activePage.value = pageFromHash()
}
async function openItem(item) { selected.value = item; await nextTick(); modal.value.showModal() }
async function copyLink() {
  try { await navigator.clipboard.writeText(profile.github); copyStatus.value = 'Profile link copied.' }
  catch { copyStatus.value = 'Please copy the profile link above.' }
  clearTimeout(timer); timer = setTimeout(() => { copyStatus.value = '' }, 4000)
}
onMounted(() => window.addEventListener('popstate', syncPage))
onUnmounted(() => { window.removeEventListener('popstate', syncPage); clearTimeout(timer) })
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
          <li v-if="profile.phone"><span class="icon-box"><Icon name="phone" /></span><div><span class="eyebrow">Phone</span><a :href="`tel:${profile.phone}`">{{ profile.phone }}</a></div></li>
          <li><span class="icon-box"><Icon name="location" /></span><div><span class="eyebrow">Location</span><a :href="profile.location.url" target="_blank" rel="noopener noreferrer">{{ profile.location.street }}<br>{{ profile.location.city }}</a></div></li>
          <li><span class="icon-box"><Icon name="school" /></span><div><span class="eyebrow">Education</span><span>UCLA Anderson<br>School of Management</span></div></li>
          <li><span class="icon-box"><Icon name="chart" /></span><div><span class="eyebrow">Program</span><span>Master of Science in<br>Business Analytics</span></div></li>
          <li><span class="icon-box"><Icon name="github" /></span><div><span class="eyebrow">GitHub</span><a :href="profile.github" target="_blank" rel="noopener noreferrer">{{ profile.handle }}</a></div></li>
        </ul>
        <div class="divider"></div><a class="sidebar-cta" href="#contact" @click.prevent="navigate('Contact')">Let’s connect <Icon name="arrow" /></a><p class="sidebar-note">A little about me.<br>A collection of what I’m exploring.</p>
      </div>
    </aside>
    <main id="main-content" class="content-panel panel" tabindex="-1">
      <nav class="navigation" aria-label="Main navigation"><a v-for="page in pages" :key="page" :href="`#${page.toLowerCase()}`" :class="{ active: activePage === page }" :aria-current="activePage === page ? 'page' : undefined" @click.prevent="navigate(page)">{{ page }}</a></nav>
      <div class="page-content" :key="activePage">
        <header class="page-header"><h2>{{ activePage === 'About' ? 'About Me' : activePage }}</h2><span class="title-rule"></span></header>
        <template v-if="activePage === 'About'">
          <div class="intro-copy"><p v-for="paragraph in profile.bio" :key="paragraph">{{ paragraph }}</p></div>
          <section class="section-block"><h3>What I’m Exploring</h3><div class="services-grid"><article v-for="interest in interests" :key="interest.title" class="service-card"><Icon :name="interest.icon" /><div><h4>{{ interest.title }}</h4><p>{{ interest.description }}</p></div></article></div></section>
          <section class="section-block"><div class="section-heading"><h3>Project Gallery</h3><a href="#portfolio" @click.prevent="navigate('Portfolio')">View all <Icon name="arrow" /></a></div><div class="projects-grid featured-grid"><button v-for="project in projects.slice(0, 2)" :key="project.title" class="project-card" @click="openItem(project)"><div class="project-art" :class="project.art"><div class="art-window"><span class="art-kicker">{{ project.kicker }}</span><strong>{{ project.wordmark }}</strong><span class="art-lines"></span><span class="art-orbit"></span></div><span class="project-open"><Icon name="arrow" /></span></div><h4>{{ project.title }}</h4><p>{{ project.category }} · Sample project</p></button></div></section>
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
        <template v-else-if="activePage === 'Portfolio'">
          <p class="page-description">A space for exploring data, asking questions, and sharing discoveries.</p><p class="sample-note"><span></span>Sample projects · Real work will be added here.</p>
          <div class="filters" aria-label="Filter projects"><button v-for="category in categories" :key="category" :class="{ active: filter === category }" :aria-pressed="filter === category" @click="filter = category">{{ category }}</button></div>
          <div class="projects-grid"><button v-for="project in visibleProjects" :key="project.title" class="project-card" @click="openItem(project)"><div class="project-art" :class="project.art"><div class="art-window"><span class="art-kicker">{{ project.kicker }}</span><strong>{{ project.wordmark }}</strong><span class="art-lines"></span><span class="art-orbit"></span></div><span class="project-open"><Icon name="arrow" /></span></div><h4>{{ project.title }}</h4><p>{{ project.category }}</p></button></div><p class="result-count" aria-live="polite">{{ visibleProjects.length }} sample projects</p>
        </template>
        <template v-else-if="activePage === 'Blog'">
          <p class="page-description">Notes on analytics, ideas, and the things learned along the way.</p><p class="sample-note"><span></span>Sample articles · A starting point for future writing.</p>
          <div class="blog-grid"><button v-for="post in posts" :key="post.title" class="blog-card" @click="openItem(post)"><div class="blog-art" :class="post.art"><span>{{ post.visual }}</span><Icon name="sparkle" /></div><div class="blog-copy"><span class="eyebrow">{{ post.category }} · Sample article</span><h3>{{ post.title }}</h3><p>{{ post.description }}</p><span class="read-story">Read story <Icon name="arrow" /></span></div></button></div>
        </template>
        <template v-else>
          <p class="page-description">Good things start with a conversation.</p><div class="contact-hero"><div class="contact-symbol"><Icon name="chat" /></div><span class="eyebrow">Ideas. Questions. New perspectives.</span><h3>Let’s connect<br>and <em>explore.</em></h3><p>Have a question or an idea to share? Send me an email — I’d love to hear from you.</p><a class="primary-button" :href="`mailto:${profile.email}`"><Icon name="mail" /> Send me an email <Icon name="arrow" /></a></div>
          <div class="contact-link-card"><div><span class="eyebrow">Email</span><a :href="`mailto:${profile.email}`">{{ profile.email }}</a></div><Icon name="mail" /></div>
          <div class="contact-link-card"><div><span class="eyebrow">Location · {{ profile.location.school }}</span><a :href="profile.location.url" target="_blank" rel="noopener noreferrer">{{ profile.location.street }}<br>{{ profile.location.city }}</a></div><Icon name="location" /></div>
          <div class="contact-link-card"><div><span class="eyebrow">GitHub profile</span><a :href="profile.github" target="_blank" rel="noopener noreferrer">github.com/{{ profile.handle }}</a></div><button class="icon-button" aria-label="Copy GitHub profile link" @click="copyLink"><Icon name="copy" /></button></div><p class="copy-status" role="status">{{ copyStatus }}</p>
        </template>
      </div><footer class="page-footer"><span>Made with curiosity & care.</span><span>Alisa Zhu <span class="footer-dot">•</span> Portfolio</span></footer>
    </main>
  </div>
  <dialog ref="modal" class="detail-modal" aria-labelledby="detail-title" @click="event => { if (event.target === modal) modal.close() }"><template v-if="selected"><button class="icon-button modal-close" aria-label="Close details" @click="modal.close()"><Icon name="close" /></button><span class="eyebrow">{{ selected.category }} · Sample content</span><h2 id="detail-title">{{ selected.title }}</h2><span class="title-rule"></span><p>{{ selected.description }}</p><p v-for="paragraph in selected.body.split('\n\n')" :key="paragraph">{{ paragraph }}</p><div v-if="selected.tags" class="interest-tags"><span v-for="tag in selected.tags" :key="tag">{{ tag }}</span></div><button class="text-button" @click="modal.close()">Back to exploring <Icon name="arrow" /></button></template></dialog>
</template>
