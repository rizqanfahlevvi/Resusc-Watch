// Pure session logic shared by all pages. No @zos imports here, so it can be unit-tested in Node.
// A session is event-sourced: every number on screen is derived from `events` (+ `pauses`),
// which keeps undo and delete consistent.

export const CYCLE_MS = 120000
export const PRE_MS = 10000
export const EPI_MS = 180000
export const PAUSE_MS = 10000
export const HOLD_MS = 300
export const TOAST_MS = 5000
export const HISTORY_MAX = 20

export const COLORS = {
  black: 0x000000,
  white: 0xffffff,
  muted: 0x8d98a4,
  chip: 0x161b20,
  track: 0x1b2126,
  panel: 0x11161a,
  gray: 0x262e36,
  cyan: 0x3fc1d9,
  amber: 0xf2b233,
  red: 0xf0524f,
  violet: 0xa68bf5,
  blue: 0x5b9cf2,
  sand: 0xd9a97a,
  green: 0x4cc38a,
  slate: 0x93a1b2,
  toast: 0xf3f5f7,
  advice: 0xf2b233
}

export const DEF = {
  start: { label: 'Start CPR', c: 'cyan' },
  rhythm: { label: 'Rhythm', c: 'cyan' },
  shock: { label: 'Shock', c: 'amber', num: true },
  epi: { label: 'Epinephrine', c: 'red', num: true },
  amio: { label: 'Amiodarone', c: 'violet', num: true },
  lido: { label: 'Lidocaine', c: 'blue', num: true },
  mg: { label: 'MgSO4', c: 'blue', num: true },
  bicarb: { label: 'Bicarbonate', c: 'blue', num: true },
  calcium: { label: 'Calcium', c: 'blue', num: true },
  iv: { label: 'IV access', c: 'sand' },
  io: { label: 'IO access', c: 'sand' },
  sga: { label: 'SGA', c: 'sand' },
  ett: { label: 'ETT', c: 'sand' },
  swap: { label: 'Ganti kompresor', c: 'slate', num: true },
  other: { label: 'Tindakan lain', c: 'slate', num: true },
  rosc: { label: 'ROSC', c: 'green' },
  rearrest: { label: 'Re-arrest', c: 'red' },
  stop: { label: 'Stop', c: 'red' }
}

export const PAGES = [
  { name: 'MAIN', items: [
    { k: 'shock', t: 'Shock' }, { k: 'epi', t: 'Epi' },
    { k: 'amio', t: 'Amio' }, { k: 'swap', t: 'Ganti\nKompresor' }] },
  { name: 'DRUGS', items: [
    { k: 'lido', t: 'Lido' }, { k: 'mg', t: 'MgSO4' },
    { k: 'bicarb', t: 'Bicarb' }, { k: 'calcium', t: 'Calcium' }] },
  { name: 'AIRWAY · ACCESS', items: [
    { k: 'iv', t: 'IV' }, { k: 'io', t: 'IO' },
    { k: 'sga', t: 'SGA' }, { k: 'ett', t: 'ETT' }] },
  { name: 'TEAM · EVENTS', items: [
    { k: 'rhythm', t: 'Rhythm\nCheck' }, { k: 'other', t: 'Tindakan\nLain' },
    { k: 'rosc', t: 'ROSC' }, { k: 'stop', t: 'Stop\nTOD' }] },
  { name: 'LOG', log: true }
]

export const RHYTHMS = [
  { v: 'VF/pVT', c: 'amber', sub: 'SHOCKABLE' },
  { v: 'PEA', c: 'cyan', sub: 'NON-SHOCK' },
  { v: 'Asystole', c: 'cyan', sub: 'NON-SHOCK' },
  { v: 'ROSC', c: 'green', sub: 'NADI +' }
]

export function colorOf(type) {
  return COLORS[(DEF[type] && DEF[type].c) || 'slate']
}

// Blend `hex` over black at `alpha` (0..1); used for dim button fills.
export function dim(hex, alpha) {
  const r = Math.round(((hex >> 16) & 0xff) * alpha)
  const g = Math.round(((hex >> 8) & 0xff) * alpha)
  const b = Math.round((hex & 0xff) * alpha)
  return (r << 16) | (g << 8) | b
}

// ---------- time formats ----------
function pad(n) { return (n < 10 ? '0' : '') + n }

// MM:SS:cc (minutes : seconds : hundredths). Used for the cycle countdown and the log.
export function fmtCC(ms) {
  const neg = ms < 0
  ms = Math.abs(ms)
  const s = Math.floor(ms / 1000)
  const cs = Math.floor((ms % 1000) / 10)
  return (neg ? '+' : '') + pad(Math.floor(s / 60)) + ':' + pad(s % 60) + ':' + pad(cs)
}

// MM:SS. Used for Total, Epi countdown, time since ROSC and durations.
// Countdowns pass `up` so a fresh 3 minutes reads 03:00 instead of 02:59.
export function fmtMS(ms, up) {
  const neg = ms < 0
  ms = Math.abs(ms)
  const s = up && !neg ? Math.ceil(ms / 1000) : Math.floor(ms / 1000)
  return (neg ? '+' : '') + pad(Math.floor(s / 60)) + ':' + pad(s % 60)
}

export function fmtClock(wall) {
  const d = new Date(wall)
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

export function fmtDate(wall) {
  const d = new Date(wall)
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
}

export function fmtSec(ms) {
  return ms == null ? '—' : (ms / 1000).toFixed(1).replace('.', ',') + ' s'
}

// ---------- session ----------
let seq = 0
export function newId() {
  seq += 1
  return 'e' + Date.now().toString(36) + seq
}

export function newSession(now) {
  return { id: now, wallStart: now, events: [], pauses: [], pauseStart: null }
}

export function addEvent(session, type, t, v) {
  const e = { id: newId(), type, t }
  if (v) e.v = v
  session.events.push(e)
  return e
}

export function removeEvent(session, id) {
  session.events = session.events.filter((e) => e.id !== id)
}

export function derive(events, t) {
  const d = { cprStart: 0, cycleId: 'none', rosc: false, roscAt: 0, lastEpi: null, counts: {}, lastRhythm: null }
  events.forEach((e) => {
    d.counts[e.type] = (d.counts[e.type] || 0) + 1
    if (e.type === 'start' || e.type === 'rearrest' || e.type === 'rhythm') {
      d.cprStart = e.t
      d.cycleId = e.id
      d.rosc = false
    }
    if (e.type === 'rhythm') d.lastRhythm = e.v
    if (e.type === 'rosc') {
      d.rosc = true
      d.roscAt = e.t
    }
    if (e.type === 'epi') d.lastEpi = e
  })
  d.cycleRem = CYCLE_MS - (t - d.cprStart)
  d.epiSince = d.lastEpi ? t - d.lastEpi.t : null
  return d
}

// Display labels with running numbers ("Shock #2"), recomputed so deletes never leave gaps.
export function labels(events) {
  const n = {}
  const out = {}
  events.forEach((e) => {
    n[e.type] = (n[e.type] || 0) + 1
    const def = DEF[e.type] || { label: e.type }
    let l = def.label
    if (e.type === 'rhythm') l = 'Rhythm: ' + e.v
    else if (e.type === 'stop') l = e.v === 'ROSC' ? 'Selesai (ROSC)' : 'Stop · TOD'
    else if (def.num) l += ' #' + n[e.type]
    out[e.id] = l
  })
  return out
}

// Non-blocking advice shown briefly after an entry. Never a dose or an order.
export function advice(e, d) {
  const c = d.counts
  if (e.type === 'rhythm') {
    if (e.v === 'VF/pVT') return 'Shockable → Shock, lanjut CPR'
    return c.epi ? 'Non-shockable → lanjut CPR' : 'Non-shockable → Epi ASAP'
  }
  if (e.type === 'shock') {
    if (c.shock === 2 && !c.epi) return 'Pertimbangkan Epinephrine'
    if (c.shock === 3 && !c.amio) return 'Pertimbangkan Amiodarone'
    if (c.shock === 5 && c.amio === 1) return 'Pertimbangkan Amiodarone ke-2'
  }
  if (e.type === 'epi') return 'Pengingat berikutnya 03:00'
  if (e.type === 'rosc') return 'Post-ROSC care'
  if (e.type === 'rearrest') return 'Siklus CPR baru dimulai'
  return ''
}

// Quality metrics for debriefing, derived from the log and the recorded pauses.
export function metrics(s) {
  const ev = s.events
  const end = s.duration
  let arrest = 0
  let inArrest = true
  let seg = 0
  ev.forEach((e) => {
    if (e.type === 'rosc' && inArrest) { arrest += e.t - seg; inArrest = false }
    if (e.type === 'rearrest' && !inArrest) { seg = e.t; inArrest = true }
  })
  if (inArrest) arrest += end - seg
  const ps = (s.pauses || []).map((p) => p.end - p.start)
  const tot = ps.reduce((a, b) => a + b, 0)
  const first = (type) => {
    const e = ev.filter((x) => x.type === type)[0]
    return e ? e.t : null
  }
  return {
    ccf: arrest > 0 ? Math.max(0, 1 - tot / arrest) : null,
    pauses: ps.length,
    pauseTot: tot,
    pauseAvg: ps.length ? tot / ps.length : null,
    pauseMax: ps.length ? Math.max.apply(null, ps) : null,
    cycles: ev.filter((x) => x.type === 'start' || x.type === 'rhythm' || x.type === 'rearrest').length,
    firstShock: first('shock'),
    firstEpi: first('epi')
  }
}

export function ccfColor(c) {
  if (c == null) return COLORS.slate
  return c >= 0.8 ? COLORS.green : c >= 0.6 ? COLORS.amber : COLORS.red
}

export function finishSession(s, t) {
  const d = derive(s.events, t)
  addEvent(s, 'stop', t, d.rosc ? 'ROSC' : 'TOD')
  s.duration = t
  s.outcome = d.rosc ? 'ROSC' : 'TOD'
  s.pauseStart = null
  return s
}
