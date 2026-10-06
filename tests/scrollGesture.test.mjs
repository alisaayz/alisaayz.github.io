import test from 'node:test'
import assert from 'node:assert/strict'
import { createBoundaryProgress } from '../src/scrollGesture.js'

test('normal page scrolling does not fill the boundary progress', () => {
  const scroll = createBoundaryProgress()
  assert.equal(scroll({delta:1000, atEdge:false}).progress, 0)
})
test('continued scrolling fills the bar and advances with no pause or new stroke', () => {
  const scroll = createBoundaryProgress()
  assert.equal(scroll({delta:200, atEdge:true}).progress, 1/3)
  assert.equal(scroll({delta:200, atEdge:true}).direction, 0)
  assert.deepEqual(scroll({delta:200, atEdge:true}), {progress:1,direction:1})
})
test('upward scrolling advances to the previous page', () => {
  const scroll = createBoundaryProgress()
  assert.deepEqual(scroll({delta:-600, atEdge:true}), {progress:1,direction:-1})
})
test('moving away from the boundary clears partial progress', () => {
  const scroll = createBoundaryProgress()
  scroll({delta:120,atEdge:true})
  scroll({delta:-20,atEdge:false})
  assert.equal(scroll({delta:200,atEdge:true}).progress,1/3)
})
test('a touch drag fills the progress within a single swipe', () => {
  const scroll = createBoundaryProgress()
  scroll({delta:100,atEdge:true,threshold:220})
  assert.deepEqual(scroll({delta:120,atEdge:true,threshold:220}),{progress:1,direction:1})
})
test('animation and terminal sections do not accumulate progress', () => {
  const scroll = createBoundaryProgress()
  scroll({delta:120,atEdge:true})
  assert.deepEqual(scroll({delta:240,atEdge:true,blocked:true}),{progress:0,direction:0})
})
