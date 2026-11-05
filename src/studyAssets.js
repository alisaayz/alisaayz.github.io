import roomArt from './assets/study/room-monitor-ready.webp'
import roomObjectPlates from './assets/study/room-object-clean-plates.webp'
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

export async function loadRoomObjectPlates() {
  preloadArt(roomObjectPlates)
  const image = warmed.get(roomObjectPlates)
  await image.decode()
  return image
}
