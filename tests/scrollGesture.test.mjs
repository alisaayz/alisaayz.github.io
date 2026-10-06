import test from 'node:test'
import assert from 'node:assert/strict'
import { createBoundaryGesture } from '../src/scrollGesture.js'

test('the stroke reaching the bottom stops there, including its momentum', () => {
  const stroke = createBoundaryGesture()
  assert.equal(stroke({ delta: 30, time: 0, atEdge: false }), 0)
  for (const [time, delta] of [[16, 24], [32, 18], [48, 10], [64, 4], [80, 1]]) {
    assert.equal(stroke({ delta, time, atEdge: true }), 0)
  }
})
test('one gentle second stroke advances without a cursor change', () => {
  const stroke = createBoundaryGesture()
  stroke({ delta: 20, time: 0, atEdge: false })
  stroke({ delta: 3, time: 16, atEdge: true })
  assert.equal(stroke({ delta: 1, time: 120, atEdge: true }), 1)
})
test('a new trackpad push is detected while the old momentum still emits events', () => {
  const stroke = createBoundaryGesture()
  stroke({ delta: 30, time: 0, atEdge: false })
  for (const [time, delta] of [[16, 20], [32, 12], [48, 4], [64, 1]]) {
    assert.equal(stroke({ delta, time, atEdge: true }), 0)
  }
  assert.equal(stroke({ delta: 8, time: 80, atEdge: true }), 1)
})
test('the same boundary behavior works upward', () => {
  const stroke = createBoundaryGesture()
  stroke({ delta: -20, time: 0, atEdge: false })
  assert.equal(stroke({ delta: -10, time: 16, atEdge: true }), 0)
  assert.equal(stroke({ delta: -2, time: 120, atEdge: true }), -1)
})
test('animation and non-boundary scrolling cannot change sections', () => {
  const stroke = createBoundaryGesture()
  assert.equal(stroke({ delta: 20, time: 0, atEdge: true, blocked: true }), 0)
  assert.equal(stroke({ delta: 20, time: 200, atEdge: false }), 0)
})
