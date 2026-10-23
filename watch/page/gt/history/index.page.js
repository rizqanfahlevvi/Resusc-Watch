import { push, back } from '@zos/router'
import { COLORS, fmtMS, fmtDate } from '../../../shared/core'
import { loadHistory } from '../../../shared/storage'
import { text, rect, listRow, pillButton } from '../../../shared/ui'

Page({
  build() {
    const h = loadHistory()
    text({ x: 90, y: 50, w: 300, h: 30, text: 'RIWAYAT', size: 22, color: COLORS.muted })
    pillButton({ x: 176, y: 84, w: 128, h: 38, color: COLORS.gray, text: '‹ Kembali', size: 18 }, () => back())

    if (!h.length) {
      text({ x: 70, y: 200, w: 340, h: 40, text: 'Belum ada sesi tersimpan', size: 20, color: COLORS.muted })
      return
    }
    let y = 136
    h.forEach((s) => {
      const col = s.outcome === 'ROSC' ? COLORS.green : COLORS.red
      listRow({
        x: 70, y, w: 340, accent: col, big: fmtMS(s.duration), title: s.outcome,
        sub: fmtDate(s.wallStart) + ' · ' + s.events.length + ' event',
        onTap: () => push({ url: 'page/gt/detail/index.page', params: String(s.id) })
      })
      y += 56
    })
    rect({ x: 0, y: y + 120, w: 10, h: 10, color: COLORS.black })
  }
})
