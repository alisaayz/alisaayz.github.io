// Coordinates are percentages of the square room artwork, independent of camera zoom.
export const propsInRoom = [
  { id: 'books', label: 'Bookshelf', x: 13, y: 41, w: 14, h: 18 },
  { id: 'photos', label: 'Photo wall', x: 68.5, y: 28.5, w: 26, h: 27, shape: '0 0,100% 42%,100% 100%,0 59%' },
  { id: 'flags', label: 'Pennants', x: 88.5, y: 35.5, w: 10.5, h: 14 },
  { id: 'monitor', label: 'Computer', x: 68, y: 41.6, w: 21, h: 16.2, shape: '0 0,100% 53%,100% 100%,0 47%' },
  { id: 'desk', label: 'Desk', x: 70, y: 50.1, w: 18, h: 8, shape: '10% 0,100% 63%,90% 100%,0 43%' },
  { id: 'golf', label: 'Golf bag', x: 12.4, y: 61, w: 9, h: 20.5 },
  { id: 'beanbag', label: 'Beanbag', x: 30.7, y: 71.7, w: 24, h: 20.8, shape: '21% 5%,59% 0,85% 22%,100% 60%,92% 83%,61% 99%,18% 95%,3% 73%,0 47%' },
  { id: 'record', label: 'Record player', x: 51.1, y: 74.7, w: 13.5, h: 12.4 },
  { id: 'bowls', label: 'Food bowls', x: 84.9, y: 72.8, w: 16.5, h: 9.5, shape: '0 43%,94% 0,100% 57%,4% 100%' },
  { id: 'globe', label: 'Globe', x: 70.2, y: 77.5, w: 9, h: 13.4 },
]
export const catRoutes = [
  [[42,66],[45,64],[39,60],[35,62],[43,65],[51,70],[46,73]],
  [[62,87],[66,85],[75,80],[79,76],[76,73],[71,71],[64,72],[67,82]],
]
export const catActivities = {
  beanbag: { pose: 'sleep', positions: [[27.5,72.5],[33.8,73.4]] },
  desk: { pose: 'desk', positions: [[66.7,50.1],[75.2,52.7]] },
  bowls: { pose: 'eat', positions: [[77,74.1],[92,70.8]] },
}
export function dropTarget(x, y) {
  return ['desk','bowls','beanbag'].find(id => {
    const object = propsInRoom.find(prop => prop.id === id)
    return Math.abs(x-object.x) <= object.w/2+1.5 && Math.abs(y-object.y) <= object.h/2+1.5
  })
}
export function nearestStop(route, x, y) {
  let best = 0
  for (let i = 1; i < route.length; i++) {
    if (Math.hypot(x-route[i][0], y-route[i][1]) < Math.hypot(x-route[best][0], y-route[best][1])) best = i
  }
  return best
}
export const shelfBooks = [
  '#a39373','#777d64','#c19e7c','#e2d4b8','#584d40',
  '#9b725d','#aaac92','#dfc1a0','#526461','#b89f7a',
].map((color, index) => ({ color, title: '', cover: '', height: 66 + ((index * 17) % 33) }))
