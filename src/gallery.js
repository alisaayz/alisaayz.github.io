import headshot from './assets/personal/headshot-2026.webp'
import eigergletscherPhoto from './assets/personal/eigergletscher-retouched.jpg'
import summerSeries from './assets/personal/summer-series-private.webp'
import wildCollage from './assets/personal/travel-grid-private.webp'

export { wildCollage }
export const galleryPhotos = [
  { caption: 'My LinkedIn face.', alt: 'Professional headshot of Alisa Zhu', tile: null, src: headshot, position: 'center 22%' },
  { caption: 'Goldman Sachs Summer Series Asia presentation · Hong Kong, China', alt: 'Alisa presenting at Goldman Sachs Summer Series Asia, with other faces softly blurred', tile: null, src: summerSeries, position: 'center top' },
  { caption: 'Golfing · Furry Creek, Vancouver, Canada', alt: 'Alisa golfing at Furry Creek near Vancouver', tile: 3 },
  { caption: 'Traveling · Eigergletscher, Switzerland', alt: 'Alisa traveling at Eigergletscher in Switzerland', tile: null, src: eigergletscherPhoto, position: 'center' },
  { caption: 'Traveling · Shangri-La, China', alt: 'Alisa with arms spread by a lake in Shangri-La City', tile: 0 },
  { caption: 'UCLA beach day orientation · Los Angeles, United States', alt: 'Alisa smiling at UCLA beach day orientation', tile: 2 },
]
