import { createWidget, widget, align, text_style, event, prop, getAppWidgetSize, setAppWidgetSize } from '@zos/ui'
import { push } from '@zos/router'
import { px } from '@zos/utils'
import { COLORS, dim, derive, fmtMS } from '../shared/core'
import { loadActive } from '../shared/storage'

// Shortcut card on the watch's shortcut-card screen (swipe right from the watch face).
// One tap starts a new code, or resumes the running one. Cards only get click events,
// and coordinates are relative to the card's top-left corner, in device pixels.

const CARD_H = 140 // design px; system allows 20%–60% of screen height

let W = {}
let timer = null
let card = { w: 0, h: 0, radius: 0 }

function label(w, value) { w.setProperty(prop.TEXT, value) }

function refresh() {
  const s = loadActive()
  if (!s) {
    label(W.main, 'START CODE')
    W.main.setProperty(prop.MORE, { color: COLORS.red })
    W.bg.setProperty(prop.MORE, { color: dim(COLORS.red, 0.22) })
    label(W.sub, 'Tap untuk mulai CPR')
    return
  }
  const t = Date.now() - s.wallStart
  const d = derive(s.events, t)
  label(W.main, 'LANJUT CODE')
  W.main.setProperty(prop.MORE, { color: COLORS.amber })
  W.bg.setProperty(prop.MORE, { color: dim(COLORS.amber, 0.22) })
  label(W.sub, 'Total ' + fmtMS(t) + ' · ' + (d.rosc ? 'ROSC' : 'Siklus ' + fmtMS(d.cycleRem, true)))
}

function open() {
  push({ url: 'page/gt/code/index.page', params: loadActive() ? 'resume' : 'new' })
}

AppWidget({
  build() {
    try {
      setAppWidgetSize({ h: px(CARD_H) })
      card = /** @type {any} */ (getAppWidgetSize())
      const w = card.w
      const h = card.h
      const pad = px(22)
      W.bg = createWidget(widget.FILL_RECT, { x: 0, y: 0, w, h, radius: card.radius || px(24), color: dim(COLORS.red, 0.22) })
      W.title = createWidget(widget.TEXT, {
        x: pad, y: px(12), w: w - pad * 2, h: px(28), text: 'CODE BLUE HELPER', text_size: px(18),
        color: COLORS.muted, align_h: align.LEFT, align_v: align.CENTER_V, text_style: text_style.NONE
      })
      W.main = createWidget(widget.TEXT, {
        x: pad, y: px(40), w: w - pad * 2, h: px(56), text: 'START CODE', text_size: px(42),
        color: COLORS.red, align_h: align.LEFT, align_v: align.CENTER_V, text_style: text_style.NONE
      })
      W.sub = createWidget(widget.TEXT, {
        x: pad, y: px(96), w: w - pad * 2, h: px(30), text: '', text_size: px(20),
        color: COLORS.white, align_h: align.LEFT, align_v: align.CENTER_V, text_style: text_style.NONE
      })
      Object.keys(W).forEach((k) => W[k].addEventListener(event.CLICK_UP, open))
      refresh()
    } catch (e) {
      console.log('app-widget build error', e)
    }
  },

  // Timers only run while the card has focus; the system pauses them otherwise.
  onResume() {
    try {
      refresh()
      if (!timer) timer = setInterval(refresh, 1000)
    } catch (e) {
      console.log('app-widget resume error', e)
    }
  },

  onPause() {
    if (timer) clearInterval(timer)
    timer = null
  },

  onDestroy() {
    if (timer) clearInterval(timer)
    timer = null
  }
})
