import { push, replace } from '@zos/router'
import { COLORS } from '../../../shared/core'
import { loadActive, loadHistory } from '../../../shared/storage'
import { text, rect, onTap, pillButton } from '../../../shared/ui'

// Start screen. If a code is still running (app was closed mid-session) it offers to resume it.
Page({
  build() {
    const active = loadActive()
    const col = active ? COLORS.amber : COLORS.red

    text({ x: 90, y: 66, w: 300, h: 30, text: 'CODE BLUE', size: 22, color: COLORS.muted })
    const parts = [
      rect({ x: 130, y: 108, w: 220, h: 220, r: 110, color: col }),
      text({ x: 130, y: 138, w: 220, h: 120, text: active ? 'LANJUT\nCODE' : 'START\nCODE', size: 46, color: COLORS.black, wrap: true }),
      text({ x: 130, y: 258, w: 220, h: 30, text: active ? 'SESI BERJALAN' : 'CPR MULAI', size: 18, color: COLORS.black })
    ]
    // Code screen replaces home so the stack never grows and "back" can't land on a stale page.
    onTap(parts, () => replace({ url: 'page/gt/code/index.page', params: active ? 'resume' : 'new' }))

    pillButton({ x: 104, y: 348, w: 132, h: 46, color: COLORS.gray, text: 'Riwayat (' + loadHistory().length + ')', size: 20 },
      () => push({ url: 'page/gt/history/index.page' }))
    pillButton({ x: 244, y: 348, w: 132, h: 46, color: COLORS.gray, text: 'Credit', size: 20 },
      () => push({ url: 'page/gt/credit/index.page' }))
    text({ x: 110, y: 400, w: 260, h: 44, text: 'Alat bantu timer & pencatatan. Bukan perangkat medis.', size: 14, color: COLORS.muted, wrap: true })
  }
})
