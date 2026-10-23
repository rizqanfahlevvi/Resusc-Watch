// Run with: node --test test/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  fmtCC, fmtMS, fmtSec, derive, labels, advice, metrics, newSession, addEvent, removeEvent,
  finishSession, dim, CYCLE_MS, EPI_MS
} from '../shared/core.js'

test('time formats', () => {
  assert.equal(fmtCC(102370), '01:42:37')
  assert.equal(fmtCC(-12400), '+00:12:40')
  assert.equal(fmtMS(522000), '08:42')
  assert.equal(fmtMS(EPI_MS, true), '03:00')
  assert.equal(fmtMS(EPI_MS - 1, true), '03:00')
  assert.equal(fmtMS(EPI_MS - 1001, true), '02:59')
  assert.equal(fmtMS(-12000), '+00:12')
  assert.equal(fmtMS(75 * 60000 + 12000), '75:12')
  assert.equal(fmtSec(8400), '8,4 s')
  assert.equal(fmtSec(null), '—')
})

test('cycle restarts on rhythm and re-arrest, not on shock', () => {
  const s = newSession(0)
  addEvent(s, 'start', 0)
  addEvent(s, 'shock', 30000)
  let d = derive(s.events, 60000)
  assert.equal(d.cycleRem, CYCLE_MS - 60000)
  addEvent(s, 'rhythm', 125000, 'VF/pVT')
  d = derive(s.events, 130000)
  assert.equal(d.cycleRem, CYCLE_MS - 5000)
  addEvent(s, 'rosc', 200000)
  d = derive(s.events, 210000)
  assert.equal(d.rosc, true)
  addEvent(s, 'rearrest', 300000)
  d = derive(s.events, 301000)
  assert.equal(d.rosc, false)
  assert.equal(d.cycleRem, CYCLE_MS - 1000)
})

test('epi countdown follows the last dose and undo', () => {
  const s = newSession(0)
  addEvent(s, 'start', 0)
  addEvent(s, 'epi', 10000)
  const e2 = addEvent(s, 'epi', 200000)
  assert.equal(derive(s.events, 210000).epiSince, 10000)
  removeEvent(s, e2.id)
  assert.equal(derive(s.events, 210000).epiSince, 200000)
})

test('labels renumber after delete', () => {
  const s = newSession(0)
  addEvent(s, 'start', 0)
  const a = addEvent(s, 'shock', 1)
  const b = addEvent(s, 'shock', 2)
  assert.equal(labels(s.events)[b.id], 'Shock #2')
  removeEvent(s, a.id)
  assert.equal(labels(s.events)[b.id], 'Shock #1')
})

test('advice', () => {
  const s = newSession(0)
  addEvent(s, 'start', 0)
  const r = addEvent(s, 'rhythm', 1, 'PEA')
  assert.equal(advice(r, derive(s.events, 1)), 'Non-shockable → Epi ASAP')
  addEvent(s, 'shock', 2)
  addEvent(s, 'shock', 3)
  const sh = addEvent(s, 'shock', 4)
  assert.equal(advice(sh, derive(s.events, 4)), 'Pertimbangkan Amiodarone')
})

test('metrics: CPR fraction excludes ROSC time', () => {
  const s = newSession(0)
  addEvent(s, 'start', 0)
  addEvent(s, 'shock', 60000)
  addEvent(s, 'epi', 90000)
  s.pauses.push({ start: 120000, end: 128000 })
  addEvent(s, 'rhythm', 128000, 'VF/pVT')
  addEvent(s, 'rosc', 200000)
  finishSession(s, 400000)
  const m = metrics(s)
  assert.equal(s.outcome, 'ROSC')
  assert.equal(Math.round(m.ccf * 100), 96) // 8 s pause over 200 s of arrest
  assert.equal(m.pauseMax, 8000)
  assert.equal(m.cycles, 2)
  assert.equal(m.firstShock, 60000)
  assert.equal(m.firstEpi, 90000)
})

test('dim blends towards black', () => {
  assert.equal(dim(0xffffff, 0), 0)
  assert.equal(dim(0xff0000, 0.5), 0x800000)
})
