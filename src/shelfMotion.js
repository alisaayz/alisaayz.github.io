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
    spineShade: .55*openness,
    coverShade: .5*(1-openness),
    order: Math.round(100-Math.abs(relative)*4),
  }
}

export function bookRowGeometry(height, selection, lifts, tiltX = 0, tiltY = 0) {
  const poses = lifts.map((lift, index) => bookGeometry(height, index-selection, lift, tiltX, tiltY))
  const halfWidth = pose => {
    const angle = pose.ry * Math.PI / 180
    return (pose.ws*Math.abs(Math.cos(angle)) + pose.depth*Math.abs(Math.sin(angle))) / 2
  }
  const left = Math.min(...poses.map(pose => pose.x-halfWidth(pose)))
  const right = Math.max(...poses.map(pose => pose.x+halfWidth(pose)))
  const center = (left+right)/2
  return poses.map(pose => ({ ...pose, x:pose.x-center }))
}
