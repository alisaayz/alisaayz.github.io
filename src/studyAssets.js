import roomArt from './assets/study/room-books.webp'
const views = import.meta.glob('./assets/study/view-*.webp', { eager:true, query:'?url', import:'default' })
export const roomView = (id) => views[`./assets/study/view-${id}.webp`]
export { roomArt }
const warmed = new Map()

export function preloadArt(url, priority = 'low') {
  if (!url || warmed.has(url)) return
  const image = new Image()
  image.fetchPriority = priority
  image.src = url
  warmed.set(url,image)
  image.decode().catch(() => warmed.delete(url))
}
export function preloadRoomViews() { Object.values(views).forEach(url => preloadArt(url)) }
