import { back } from '@zos/router'
import { COLORS, PAUSE_MS, metrics, ccfColor, labels, colorOf, fmtCC, fmtMS, fmtSec, fmtClock, fmtDate } from '../../../shared/core'
import { findSession } from '../../../shared/storage'
import { text, rect, listRow, pillButton } from '../../../shared/ui'

// Quality metrics + full log of one finished session. Content is taller than the screen,
// so the page uses the default free vertical scroll.
let sessionId = null

Page({
  onInit(params) {
    sessionId = params
  },

  build() {
    const s = findSession(sessionId)
    text({ x: 90, y: 40, w: 300, h: 30, text: s ? fmtDate(s.wallStart) : 'Sesi tidak ditemukan', size: 20, color: COLORS.muted })
    pillButton({ x: 176, y: 74, w: 128, h: 38, color: COLORS.gray, text: '‹ Kembali', size: 18 }, () => back())
    if (!s) return

    const m = metrics(s)
    const long = (v) => (v != null && v >= PAUSE_MS ? COLORS.red : COLORS.cyan)
    const rows = [
      [m.ccf == null ? '—' : Math.round(m.ccf * 100) + '%', 'CPR fraction', 'Target ≥ 80%', ccfColor(m.ccf)],
      [fmtSec(m.pauseAvg), 'Jeda rata-rata', m.pauses + ' jeda · total ' + fmtSec(m.pauseTot), long(m.pauseAvg)],
      [fmtSec(m.pauseMax), 'Jeda terlama', 'Target < 10 s', long(m.pauseMax)],
      [String(m.cycles), 'Siklus CPR', 'Jumlah siklus dimulai', COLORS.slate],
      [m.firstShock == null ? '—' : fmtMS(m.firstShock), 'Time to 1st shock', 'Sejak Start CPR', COLORS.amber],
      [m.firstEpi == null ? '—' : fmtMS(m.firstEpi), 'Time to 1st epi', 'Sejak Start CPR', COLORS.red]
    ]

    let y = 124
    text({ x: 70, y, w: 340, h: 26, text: 'KUALITAS RESUSITASI', size: 16, color: COLORS.muted })
    y += 30
    rows.forEach((r) => {
      listRow({ x: 70, y, w: 340, accent: r[3], big: r[0], bigColor: r[3], title: r[1], sub: r[2] })
      y += 56
    })

    y += 8
    text({ x: 70, y, w: 340, h: 26, text: 'LOG', size: 16, color: COLORS.muted })
    y += 30
    const L = labels(s.events)
    s.events.slice().reverse().forEach((e) => {
      listRow({ x: 70, y, w: 340, accent: colorOf(e.type), big: fmtCC(e.t), title: L[e.id], sub: fmtClock(s.wallStart + e.t) })
      y += 56
    })
    // Bottom spacer so the last row can scroll above the round edge.
    rect({ x: 0, y: y + 120, w: 10, h: 10, color: COLORS.black })
  }
})
