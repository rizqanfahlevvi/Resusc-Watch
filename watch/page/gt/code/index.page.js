import { onGesture, offGesture, GESTURE_LEFT, GESTURE_RIGHT, GESTURE_UP, GESTURE_DOWN } from '@zos/interaction'
import {
  setPageBrightTime, resetPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff,
  pausePalmScreenOff, resetPalmScreenOff, setWakeUpRelaunch
} from '@zos/display'
import { replace } from '@zos/router'
import { prop } from '@zos/ui'
import { px } from '@zos/utils'
import {
  COLORS, PAGES, RHYTHMS, DEF, CYCLE_MS, PRE_MS, EPI_MS, PAUSE_MS, HOLD_MS, TOAST_MS,
  colorOf, dim, fmtCC, fmtMS, fmtClock, derive, labels, advice, newSession, addEvent, removeEvent, finishSession
} from '../../../shared/core'
import { loadActive, saveActive, clearActive, pushHistory } from '../../../shared/storage'
import { vibrate, stopVibrate } from '../../../shared/vibrate'
import { text, rect, frame, arc, show, setText, setColor, onTap, onPress, listRow, pillButton } from '../../../shared/ui'

// Main code screen. Widgets are created once in build() and then only shown/hidden or updated,
// which is cheaper on the watch than deleting and recreating them.

const LOG_ROWS = 4
const TICK_MS = 50

const S = {
  session: null,
  page: 0,
  overlay: null, // null | 'rhythm' | 'confirm'
  toast: null, // { id, adv, until }
  hintUntil: 0,
  hold: null,
  fired: {},
  logOff: 0,
  onYes: null,
  timer: null,
  cache: {}
}
const W = { grid: [], rows: [], dots: [], rhythm: [], ov: [], confirm: [] }

function now() { return Date.now() - S.session.wallStart }
function persist() { saveActive(S.session) }

// Only touch a widget when its value really changes.
function put(key, w, value, apply) {
  if (S.cache[key] === value) return
  S.cache[key] = value
  apply(w, value)
}
function group(list, visible) { list.forEach((w) => show(w, visible)) }

function cell(i, top) {
  return { x: 84 + (i % 2) * 161, y: top + Math.floor(i / 2) * 114, w: 151, h: 104 }
}

// ---------- build ----------
function buildHeader() {
  W.track = arc({ x: 6, y: 6, w: 468, h: 468, start: 0, end: 360, color: COLORS.track, lw: 14 })
  // Angles: -90 is 12 o'clock on Zepp OS ARC. Progress shrinks clockwise as the cycle runs down.
  W.ring = arc({ x: 6, y: 6, w: 468, h: 468, start: -90, end: 270, color: COLORS.cyan, lw: 14 })
  W.lbl = text({ x: 90, y: 40, w: 300, h: 30, text: 'CYCLE', size: 22, color: COLORS.muted })
  W.big = text({ x: 50, y: 68, w: 380, h: 72, text: '02:00:00', size: 62 })
  W.totalBg = rect({ x: 100, y: 142, w: 136, h: 34, r: 17, color: COLORS.chip })
  W.total = text({ x: 100, y: 142, w: 136, h: 34, text: 'TOTAL 00:00', size: 22 })
  W.epiBg = rect({ x: 244, y: 142, w: 136, h: 34, r: 17, color: COLORS.chip })
  W.epi = text({ x: 244, y: 142, w: 136, h: 34, text: 'EPI —', size: 22 })
}

function buildGrid() {
  for (let i = 0; i < 4; i++) {
    const c = cell(i, 188)
    const b = {
      bg: rect({ x: c.x, y: c.y, w: c.w, h: c.h, r: 24, color: COLORS.panel }),
      border: frame({ x: c.x, y: c.y, w: c.w, h: c.h, r: 24, lw: 3, color: COLORS.slate }),
      label: text({ x: c.x + 4, y: c.y, w: c.w - 8, h: c.h, text: '', size: 26, wrap: true }),
      count: text({ x: c.x, y: i < 2 ? c.y + 4 : c.y + c.h - 26, w: c.w, h: 22, text: '', size: 16 })
    }
    b.all = [b.bg, b.border, b.label, b.count]
    onPress(b.all, () => startHold(i), () => endHold(i), () => cancelHold(false))
    W.grid.push(b)
  }
}

function buildLog() {
  for (let r = 0; r < LOG_ROWS; r++) {
    W.rows.push(listRow({ x: 84, y: 188 + r * 56, w: 312, accent: COLORS.slate, big: '', title: '', onTap: () => askDelete(r) }))
  }
  W.empty = text({ x: 84, y: 250, w: 312, h: 40, text: 'Belum ada event', size: 20, color: COLORS.muted })
}

function buildDots() {
  for (let i = 0; i < PAGES.length; i++) W.dots.push(rect({ x: 0, y: 414, w: 8, h: 8, r: 4, color: COLORS.gray }))
  W.pname = text({ x: 120, y: 426, w: 240, h: 24, text: '', size: 16, color: COLORS.muted })
}

function buildToast() {
  // Whole pill is the undo target so it can be hit with gloves on.
  W.toastBg = rect({ x: 92, y: 140, w: 296, h: 38, r: 19, color: COLORS.toast })
  W.toastTxt = text({ x: 108, y: 140, w: 182, h: 38, text: '', size: 20, color: COLORS.black, left: true })
  W.chip = rect({ x: 292, y: 143, w: 92, h: 32, r: 16, color: COLORS.black })
  W.chipTxt = text({ x: 292, y: 143, w: 92, h: 32, text: 'UNDO', size: 18 })
  W.toast = [W.toastBg, W.toastTxt, W.chip, W.chipTxt]
  onTap(W.toast, undoToast)
}

function buildRhythm() {
  W.rhythm.push(rect({ x: 0, y: 0, w: 480, h: 480, color: COLORS.black }))
  W.rhythm.push(text({ x: 90, y: 30, w: 300, h: 26, text: 'RHYTHM CHECK', size: 18, color: COLORS.muted }))
  W.pause = text({ x: 90, y: 58, w: 300, h: 50, text: 'JEDA 00:00', size: 40 })
  W.rhythm.push(W.pause)
  RHYTHMS.forEach((r, i) => {
    const c = cell(i, 116)
    const col = COLORS[r.c]
    const parts = [
      rect({ x: c.x, y: c.y, w: c.w, h: c.h, r: 24, color: dim(col, 0.22) }),
      frame({ x: c.x, y: c.y, w: c.w, h: c.h, r: 24, lw: 3, color: col }),
      text({ x: c.x, y: c.y + 14, w: c.w, h: 44, text: r.v, size: 28 }),
      text({ x: c.x, y: c.y + 60, w: c.w, h: 24, text: r.sub, size: 15, color: COLORS.muted })
    ]
    onTap(parts, () => pickRhythm(i))
    parts.forEach((p) => W.rhythm.push(p))
  })
  pillButton({ x: 180, y: 372, w: 120, h: 46, color: COLORS.gray, text: 'Tutup' }, () => { closeRhythm(); persist() })
    .all.forEach((p) => W.rhythm.push(p))
}

function buildConfirm() {
  W.confirm.push(rect({ x: 0, y: 0, w: 480, h: 480, color: COLORS.black }))
  W.cq = text({ x: 60, y: 130, w: 360, h: 96, text: '', size: 34, wrap: true })
  W.cs = text({ x: 60, y: 226, w: 360, h: 40, text: '', size: 20, color: COLORS.muted, wrap: true })
  W.confirm.push(W.cq, W.cs)
  const no = pillButton({ x: 104, y: 282, w: 128, h: 64, color: COLORS.gray, text: 'Batal', size: 26 }, hideConfirm)
  W.yes = pillButton({ x: 248, y: 282, w: 128, h: 64, color: COLORS.red, text: 'Stop', size: 26, textColor: COLORS.black }, () => {
    const fn = S.onYes
    hideConfirm()
    if (fn) fn()
  })
  no.all.concat(W.yes.all).forEach((p) => W.confirm.push(p))
}

// ---------- page / grid ----------
function goPage(p) {
  const next = Math.max(0, Math.min(PAGES.length - 1, p))
  if (next === S.page) return
  S.page = next
  S.logOff = 0
  renderPage()
}

function renderPage() {
  const isLog = !!PAGES[S.page].log
  W.grid.forEach((b) => group(b.all, !isLog))
  if (isLog) refreshLog()
  else {
    W.rows.forEach((r) => group(r.all, false))
    show(W.empty, false)
    refreshGrid()
  }
  // Page dots: the active one is a wider pill.
  let x = 240 - ((PAGES.length - 1) * 15 + 20) / 2
  W.dots.forEach((dot, i) => {
    const on = i === S.page
    dot.setProperty(prop.MORE, { x: px(x), y: px(414), w: px(on ? 20 : 8), h: px(8), color: on ? COLORS.white : COLORS.gray })
    x += (on ? 20 : 8) + 7
  })
  refreshPageName()
}

function refreshPageName() {
  const p = PAGES[S.page]
  let name = p.name
  if (p.log) {
    const n = S.session.events.length
    name = n > LOG_ROWS ? 'LOG · ' + (S.logOff + 1) + '-' + Math.min(n, S.logOff + LOG_ROWS) + '/' + n : 'LOG'
  }
  setText(W.pname, name)
}

function refreshGrid() {
  const p = PAGES[S.page]
  if (p.log) return
  const d = derive(S.session.events, now())
  p.items.forEach((it, i) => {
    const b = W.grid[i]
    let label = it.t
    let col = colorOf(it.k)
    if (it.k === 'rosc' && d.rosc) { label = 'Re-\narrest'; col = COLORS.red }
    const solid = it.k === 'stop'
    b.fill = solid ? col : dim(col, 0.22)
    b.pressed = solid ? dim(col, 0.7) : dim(col, 0.55)
    setColor(b.bg, b.fill)
    setColor(b.border, col)
    setText(b.label, label)
    setColor(b.label, solid ? COLORS.black : COLORS.white)
    const n = DEF[it.k] && DEF[it.k].num ? d.counts[it.k] || 0 : 0
    setText(b.count, n ? '×' + n : '')
    setColor(b.count, col)
  })
}

function refreshLog() {
  if (!PAGES[S.page].log) return
  const evs = S.session.events.slice().reverse()
  const L = labels(S.session.events)
  S.logOff = Math.max(0, Math.min(S.logOff, Math.max(0, evs.length - LOG_ROWS)))
  W.rows.forEach((row, r) => {
    const e = evs[S.logOff + r]
    row.event = e || null
    group(row.all, !!e)
    if (!e) return
    setColor(row.stripe, colorOf(e.type))
    setText(row.big, fmtCC(e.t))
    setText(row.title, L[e.id])
    setText(row.sub, fmtClock(S.session.wallStart + e.t))
  })
  show(W.empty, evs.length === 0)
  refreshPageName()
}

// ---------- hold to log ----------
function startHold(i) {
  if (S.overlay || PAGES[S.page].log) return
  cancelHold(false)
  const b = W.grid[i]
  const k = PAGES[S.page].items[i].k
  setColor(b.bg, b.pressed)
  S.hold = {
    i,
    timer: setTimeout(() => {
      S.hold = null
      setColor(b.bg, b.fill)
      vibrate('tick')
      act(k)
    }, HOLD_MS)
  }
}
function endHold(i) {
  if (S.hold && S.hold.i === i) cancelHold(true)
}
function cancelHold(early) {
  if (!S.hold) return
  clearTimeout(S.hold.timer)
  const b = W.grid[S.hold.i]
  setColor(b.bg, b.fill)
  S.hold = null
  if (early) S.hintUntil = Date.now() + 1500
}

// ---------- actions ----------
function act(k) {
  const d = derive(S.session.events, now())
  if (k === 'rhythm') return openRhythm()
  if (k === 'stop') return askStop()
  if (k === 'rosc') return log(d.rosc ? 'rearrest' : 'rosc')
  log(k)
}

function log(type, v) {
  const e = addEvent(S.session, type, now(), v)
  persist()
  const d = derive(S.session.events, now())
  showToast(e, advice(e, d))
  refreshGrid()
  refreshLog()
}

function showToast(e, adv) {
  S.toast = { id: e.id, adv, until: Date.now() + (adv ? TOAST_MS + 1500 : TOAST_MS) }
  setText(W.toastTxt, '✓ ' + labels(S.session.events)[e.id])
  group([W.totalBg, W.total, W.epiBg, W.epi], false)
  group(W.toast, true)
}
function hideToast() {
  S.toast = null
  group(W.toast, false)
  group([W.totalBg, W.total, W.epiBg, W.epi], true)
}
function undoToast() {
  if (!S.toast || S.overlay) return
  removeEvent(S.session, S.toast.id)
  persist()
  hideToast()
  refreshGrid()
  refreshLog()
}

// Rhythm check = hands-off time. Pauses are stored apart from events so undoing a rhythm entry keeps the real pause.
function openRhythm() {
  cancelHold(false)
  S.overlay = 'rhythm'
  S.session.pauseStart = now()
  persist()
  S.cache.pause = null
  group(W.rhythm, true)
}
function closeRhythm() {
  if (S.session.pauseStart != null) S.session.pauses.push({ start: S.session.pauseStart, end: now() })
  S.session.pauseStart = null
  S.overlay = null
  group(W.rhythm, false)
}
function pickRhythm(i) {
  const r = RHYTHMS[i]
  closeRhythm()
  S.page = 0
  renderPage()
  if (r.v === 'ROSC') log('rosc')
  else log('rhythm', r.v)
}

function confirmDialog(o) {
  cancelHold(false)
  S.overlay = 'confirm'
  S.onYes = o.onYes
  setText(W.cq, o.q)
  setText(W.cs, o.s)
  setText(W.yes.label, o.yes)
  setColor(W.yes.bg, o.color)
  group(W.confirm, true)
}
function hideConfirm() {
  S.overlay = null
  S.onYes = null
  group(W.confirm, false)
}

function askStop() {
  const d = derive(S.session.events, now())
  confirmDialog({
    q: d.rosc ? 'Akhiri sesi?' : 'Stop resusitasi?',
    s: d.rosc ? 'Status akhir: ROSC' : 'Waktu TOD dicatat sekarang',
    yes: 'Stop',
    color: d.rosc ? COLORS.green : COLORS.red,
    onYes: doStop
  })
}
function doStop() {
  finishSession(S.session, now())
  pushHistory(S.session)
  clearActive()
  replace({ url: 'page/gt/summary/index.page', params: String(S.session.id) })
}

function askDelete(r) {
  const e = W.rows[r].event
  if (!e || e.type === 'start' || S.overlay) return
  confirmDialog({
    q: 'Hapus event ini?',
    s: labels(S.session.events)[e.id] + ' · ' + fmtCC(e.t),
    yes: 'Hapus',
    color: COLORS.red,
    onYes: () => {
      removeEvent(S.session, e.id)
      persist()
      refreshGrid()
      refreshLog()
    }
  })
}

// ---------- tick ----------
function tick() {
  const t = now()
  const d = derive(S.session.events, t)

  put('total', W.total, 'TOTAL ' + fmtMS(t), setText)
  if (d.lastEpi) {
    const rem = EPI_MS - d.epiSince
    const due = rem <= 0 && !d.rosc
    put('epi', W.epi, rem <= 0 ? 'EPI DUE ' + fmtMS(rem) : 'EPI ' + fmtMS(rem, true), setText)
    put('epiBg', W.epiBg, due ? COLORS.red : COLORS.chip, setColor)
    put('epiFg', W.epi, due ? COLORS.black : COLORS.white, setColor)
  } else {
    put('epi', W.epi, 'EPI —', setText)
    put('epiBg', W.epiBg, COLORS.chip, setColor)
    put('epiFg', W.epi, COLORS.white, setColor)
  }

  let label
  if (d.rosc) {
    label = 'ROSC'
    put('big', W.big, fmtMS(t - d.roscAt), setText)
    put('bigFg', W.big, COLORS.green, setColor)
    put('ring', W.ring, 'rosc', () => W.ring.setProperty(prop.MORE, { start_angle: -90, end_angle: 270, color: COLORS.green }))
  } else {
    const rem = d.cycleRem
    label = rem <= 0 ? 'RHYTHM CHECK' : 'CYCLE'
    put('big', W.big, fmtCC(rem), setText)
    put('bigFg', W.big, rem <= 0 ? COLORS.red : COLORS.white, setColor)
    // Overtime blinks the ring red at 1 Hz.
    const blink = rem <= 0 && Math.floor(-rem / 500) % 2 === 1
    const col = rem <= 0 ? (blink ? COLORS.track : COLORS.red) : rem <= PRE_MS ? COLORS.amber : COLORS.cyan
    const end = Math.round(-90 + (360 * Math.max(0, rem)) / CYCLE_MS)
    put('ring', W.ring, end + ':' + col, () => W.ring.setProperty(prop.MORE, { start_angle: -90, end_angle: end, color: col }))

    if (rem <= PRE_MS && rem > 0 && !S.fired[d.cycleId + 'pre']) { S.fired[d.cycleId + 'pre'] = 1; vibrate('pre') }
    if (rem <= 0 && !S.fired[d.cycleId + 'end']) {
      S.fired[d.cycleId + 'pre'] = 1
      S.fired[d.cycleId + 'end'] = 1
      vibrate('cycle')
      // Cycle end opens the rhythm picker by itself.
      if (!S.overlay) openRhythm()
    }
    if (d.lastEpi && d.epiSince >= EPI_MS && !S.fired['epi' + d.lastEpi.id]) {
      S.fired['epi' + d.lastEpi.id] = 1
      vibrate('epi')
    }
  }

  if (S.overlay === 'rhythm' && S.session.pauseStart != null) {
    const pz = t - S.session.pauseStart
    put('pause', W.pause, 'JEDA ' + fmtMS(pz), setText)
    put('pauseFg', W.pause, pz >= PAUSE_MS ? COLORS.red : COLORS.white, setColor)
    if (pz >= PAUSE_MS && !S.fired['pause' + S.session.pauseStart]) {
      S.fired['pause' + S.session.pauseStart] = 1
      vibrate('pause')
    }
  }

  if (S.toast && Date.now() > S.toast.until) hideToast()

  // The small label line above the timer briefly carries the hold hint or the advice.
  let lblColor = COLORS.muted
  if (Date.now() < S.hintUntil) { label = 'Tahan untuk mencatat'; lblColor = COLORS.advice }
  else if (S.toast && S.toast.adv) { label = S.toast.adv; lblColor = COLORS.advice }
  put('lbl', W.lbl, label, setText)
  put('lblFg', W.lbl, lblColor, setColor)
}

// On resume, alerts that are already in the past must not all fire at once.
function markPastAlerts() {
  const t = now()
  const d = derive(S.session.events, t)
  if (d.cycleRem <= PRE_MS) S.fired[d.cycleId + 'pre'] = 1
  if (d.cycleRem <= 0) S.fired[d.cycleId + 'end'] = 1
  if (d.lastEpi && d.epiSince >= EPI_MS) S.fired['epi' + d.lastEpi.id] = 1
  if (S.session.pauseStart != null && t - S.session.pauseStart >= PAUSE_MS) S.fired['pause' + S.session.pauseStart] = 1
}

Page({
  onInit(params) {
    const resume = params === 'resume' ? loadActive() : null
    S.session = resume || newSession(Date.now())
    S.page = 0
    S.overlay = null
    S.toast = null
    S.fired = {}
    S.cache = {}
    if (!resume) {
      addEvent(S.session, 'start', 0)
      persist()
    }
    markPastAlerts()

    // Keep the screen on and the app in front for the whole code.
    setPageBrightTime({ brightTime: 2147483000 })
    pauseDropWristScreenOff({ duration: 0 })
    pausePalmScreenOff({ duration: 0 })
    setWakeUpRelaunch({ relaunch: true })
  },

  build() {
    buildHeader()
    buildGrid()
    buildLog()
    buildDots()
    buildToast()
    buildRhythm()
    buildConfirm()

    group(W.toast, false)
    group(W.rhythm, false)
    group(W.confirm, false)
    renderPage()
    if (S.session.pauseStart != null) {
      S.overlay = 'rhythm'
      group(W.rhythm, true)
    }

    // Own swipe handling: the header stays put, and a swipe right can never close the app mid-code.
    onGesture({
      callback: (ev) => {
        if (S.overlay) return true
        cancelHold(false)
        if (ev === GESTURE_LEFT) goPage(S.page + 1)
        else if (ev === GESTURE_RIGHT) goPage(S.page - 1)
        else if (PAGES[S.page].log && ev === GESTURE_UP) { S.logOff += LOG_ROWS; refreshLog() }
        else if (PAGES[S.page].log && ev === GESTURE_DOWN) { S.logOff = Math.max(0, S.logOff - LOG_ROWS); refreshLog() }
        return true
      }
    })

    tick()
    S.timer = setInterval(tick, TICK_MS)
  },

  onDestroy() {
    if (S.timer) clearInterval(S.timer)
    S.timer = null
    cancelHold(false)
    offGesture()
    stopVibrate()
    if (S.session && !S.session.outcome) persist()
    resetPageBrightTime()
    resetDropWristScreenOff()
    resetPalmScreenOff()
    setWakeUpRelaunch({ relaunch: false })
  }
})
