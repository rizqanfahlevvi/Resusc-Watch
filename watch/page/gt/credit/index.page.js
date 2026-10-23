import { back } from '@zos/router'
import { COLORS } from '../../../shared/core'
import { text, pillButton } from '../../../shared/ui'

Page({
  build() {
    text({ x: 90, y: 70, w: 300, h: 28, text: 'CREDIT', size: 20, color: COLORS.muted })
    text({ x: 60, y: 104, w: 360, h: 110, text: 'Code Blue\nHelper', size: 48, color: COLORS.cyan, wrap: true })
    text({ x: 90, y: 214, w: 300, h: 24, text: 'v0.1', size: 17, color: COLORS.muted })
    text({ x: 90, y: 252, w: 300, h: 22, text: 'CREDIT BY', size: 16, color: COLORS.muted })
    text({ x: 60, y: 274, w: 360, h: 40, text: '@rizqanfahlevvi', size: 30 })
    text({ x: 110, y: 322, w: 260, h: 40, text: 'Alat bantu timer & pencatatan. Bukan perangkat medis.', size: 14, color: COLORS.muted, wrap: true })
    pillButton({ x: 176, y: 372, w: 128, h: 44, color: COLORS.gray, text: '‹ Kembali', size: 20 }, () => back())
  }
})
