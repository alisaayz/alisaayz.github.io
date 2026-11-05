import test from 'node:test'
import assert from 'node:assert/strict'
import { bookGeometry, bookRowGeometry } from '../src/shelfMotion.js'

test('five books keep their order and stay on the shelf when either end opens', () => {
  const height = 240
  for (const selected of [0, 2, 4]) {
    const row = bookRowGeometry(height, selected, Array(5).fill(0))
    assert.equal(row.length, 5)
    assert.deepEqual(row.map(book => book.openness), row.map((_, i) => i === selected ? 1 : 0))
    assert.ok(row.every((book,i) => i === 0 || book.x > row[i-1].x))
    assert.ok(row.every(book => Math.abs(book.x)+(book.openness ? book.depth : book.ws)/2 < height*.87))
  }
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
