<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import savedReadme from '../assets/study/portfolio-risk-readme.html?raw'

const owner = 'alisaayz'
const fallback = { name: 'portfolio-risk', default_branch: 'main' }
const project = ref(fallback)
const readme = ref('')
const loading = ref(true)
const controller = new AbortController()
const allowed = new Set('article section div h1 h2 h3 h4 h5 h6 p ul ol li dl dt dd strong em b i del s blockquote pre code table thead tbody tfoot tr th td details summary br hr kbd samp sub sup a img'.split(' '))
const blocked = new Set(['script','style','iframe','object','embed','svg','math','form','template','input'])
function repoUrl(repo) { return `https://github.com/${owner}/${repo.name}` }
function sanitize(html, repo) {
  const input = document.createElement('template')
  input.innerHTML = html
  const output = document.createElement('div')
  const branch = encodeURIComponent(repo.default_branch)
  const web = `${repoUrl(repo)}/blob/${branch}/`
  const raw = `https://raw.githubusercontent.com/${owner}/${repo.name}/${branch}/`
  function transfer(source, target) {
    for (const node of source.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) { target.append(document.createTextNode(node.textContent)); continue }
      if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.localName)) continue
      const tag = node.localName
      if (!allowed.has(tag)) { transfer(node,target); continue }
      if (tag === 'a' && node.classList.contains('anchor')) continue
      const element = document.createElement(tag)
      if (tag === 'a' || tag === 'img') {
        const key = tag === 'a' ? 'href' : 'src'
        const value = node.getAttribute(key)
        if (!value) continue
        try {
          const url = new URL(value, tag === 'a' ? web : raw)
          if (url.protocol !== 'https:' || url.username || url.password) continue
          if (tag === 'img' && !['raw.githubusercontent.com','user-images.githubusercontent.com','private-user-images.githubusercontent.com','github.com','camo.githubusercontent.com'].includes(url.hostname)) continue
          element.setAttribute(key,url.href)
        } catch { continue }
        if (tag === 'a') { element.target = '_blank'; element.rel = 'noopener noreferrer' }
        else { element.alt = node.getAttribute('alt') || ''; element.loading = 'lazy'; element.referrerPolicy = 'no-referrer' }
      }
      if (tag === 'details' && node.hasAttribute('open')) element.open = true
      transfer(node,element)
      target.append(element)
    }
  }
  transfer(input.content,output)
  return output.innerHTML
}
onMounted(async () => {
  readme.value = sanitize(savedReadme, fallback)
  const timer = setTimeout(() => controller.abort(), 4500)
  try {
    const list = await fetch(`https://api.github.com/users/${owner}/repos?sort=created&direction=desc&per_page=30`, { signal: controller.signal })
    const repos = list.ok ? await list.json() : []
    const latest = repos.find(repo => repo.name !== owner && !repo.name.endsWith('.github.io') && !repo.fork && !repo.archived && !repo.private) || fallback
    const response = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(latest.name)}/readme`, {
      headers: { Accept: 'application/vnd.github.html+json' }, signal: controller.signal,
    })
    if (!response.ok) return
    const html = await response.text()
    if (!/^\s*</.test(html)) return
    const cleaned = sanitize(html, latest)
    if (cleaned.trim()) { readme.value = cleaned; project.value = latest }
  } catch { /* Keep the bundled project readable when GitHub is unavailable. */ }
  finally { clearTimeout(timer); loading.value = false }
})
onUnmounted(() => controller.abort())
</script>

<template>
    <div class="monitor-browser">
      <div class="monitor-address"><span aria-hidden="true">● ● ●</span><a :href="repoUrl(project)" target="_blank" rel="noopener noreferrer">{{ owner }}/{{ project.name }} ↗</a></div>
      <div class="monitor-readme" tabindex="0" role="region" aria-label="GitHub README" :aria-busy="loading">
        <article v-if="readme" v-html="readme"></article>
      </div>
    </div>
</template>
