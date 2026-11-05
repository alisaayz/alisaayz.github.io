export const wrap = (value, length) => ((value % length) + length) % length

export function shelfRelative(index, scroll, length) {
  return wrap(index-scroll+length/2,length)-length/2
}

export function bookGeometry(height, relative, lift = 0, tiltX = 0, tiltY = 0) {
  const ws = height*142/840
  const depth = height*474/900
  const gap = height*.03
  const ramp = Math.abs(relative) < 1
    ? (relative + Math.sin(Math.PI*relative)/Math.PI)/2
    : Math.sign(relative)*.5
  const x = Math.max(0,1-Math.abs(relative))
  const openness = x*x*(3-2*x)
  return {
    ws, depth, gap, openness,
    x: relative*(ws+gap)+(depth-ws+1.6*gap)*ramp,
    y: -openness*.025*height-lift*.045*height,
    z: openness*.2*height,
    rx: tiltX*openness,
    ry: (-90+tiltY)*openness,
    rz: -4.5*openness,
    spineShade: .55*openness,
    coverShade: .5*(1-openness),
    order: Math.round(100-Math.abs(relative)*4),
  }
}
