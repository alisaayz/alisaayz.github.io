import test from 'node:test'
import assert from 'node:assert/strict'
import { bookGeometry, shelfRelative } from '../src/shelfMotion.js'

test('the same nearest book is centered through the cyclic seam', () => {
  assert.equal(shelfRelative(0,30,30),0)
  assert.ok(Math.abs(shelfRelative(0,29.9,30)-.1)<1e-9)
  assert.ok(Math.abs(shelfRelative(0,30.1,30)+.1)<1e-9)
})
test('the active book makes space for its cover and neighbours stay evenly spaced', () => {
  const active=bookGeometry(300,0)
  const neighbour=bookGeometry(300,1)
  const next=bookGeometry(300,2)
  assert.equal(active.ry,-90)
  assert.ok(neighbour.ry === 0)
  assert.ok(neighbour.x>(active.depth+active.ws)/2)
  assert.ok(Math.abs(next.x-neighbour.x-active.ws-active.gap)<1e-9)
})
test('moving between books turns two covers smoothly without a position jump', () => {
  assert.equal(bookGeometry(300,.5).openness,.5)
  assert.equal(bookGeometry(300,-.5).openness,.5)
  assert.ok(Math.abs(bookGeometry(300,1-1e-6).x-bookGeometry(300,1+1e-6).x)<.001)
})
