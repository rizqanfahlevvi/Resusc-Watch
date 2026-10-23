import { push, replace } from '@zos/router'
import { COLORS, derive, metrics, ccfColor, fmtMS, fmtClock } from '../../../shared/core'
import { findSession } from '../../../shared/storage'
import { text, pillButton } from '../../../shared/ui'

let sessionId = null

Page({
  onInit(params) {
    sessionId = params
  },

  build() {
    const s = findSession(sessionId)
    if (!s) {
      text({ x: 60, y: 200, w: 360, h: 40, text: 'Sesi tidak ditemukan', size: 22, color: COLORS.muted })
      pillButton({ x: 176, y: 260, w: 128, h: 50, color: COLORS.gray, text: 'Selesai' }, () => replace({ url: 'page/gt/home/index.page' }))
      return
    }
    const c = derive(s.events, s.duration).counts
    const m = metrics(s)
    const rosc = s.outcome === 'ROSC'

    text({ x: 90, y: 74, w: 300, h: 30, text: 'SESI SELESAI', size: 20, color: COLORS.muted })
    text({ x: 60, y: 104, w: 360, h: 74, text: fmtMS(s.duration), size: 62 })
    text({ x: 60, y: 178, w: 360, h: 36, text: rosc ? 'ROSC' : 'TOD ' + fmtClock(s.wallStart + s.duration).slice(0, 5), size: 28, color: rosc ? COLORS.green : COLORS.red })

    const stats = [
      [String(c.shock || 0), 'Shock', COLORS.white],
      [String(c.epi || 0), 'Epi', COLORS.white],
      [m.ccf == null ? '—' : Math.round(m.ccf * 100) + '%', 'CPR fraction', ccfColor(m.ccf)]
    ]
    stats.forEach((st, i) => {
      const x = 80 + i * 110
      text({ x, y: 226, w: 100, h: 42, text: st[0], size: 34, color: st[2] })
      text({ x: x - 10, y: 266, w: 120, h: 24, text: st[1], size: 16, color: COLORS.muted })
    })

    pillButton({ x: 92, y: 320, w: 160, h: 50, color: COLORS.gray, text: 'Detail & log' },
      () => push({ url: 'page/gt/detail/index.page', params: String(s.id) }))
    pillButton({ x: 260, y: 320, w: 128, h: 50, color: COLORS.gray, text: 'Selesai' },
      () => replace({ url: 'page/gt/home/index.page' }))
  }
})
