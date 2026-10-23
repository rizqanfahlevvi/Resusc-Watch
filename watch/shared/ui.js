import { createWidget, widget, align, prop, text_style, event } from '@zos/ui'
import { px } from '@zos/utils'
import { COLORS } from './core'

// Layout is drawn on a 480 px design canvas (designWidth in app.json); px() scales to the real screen.

export function text(o) {
  return createWidget(widget.TEXT, {
    x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h),
    text: o.text || '',
    text_size: px(o.size || 24),
    color: o.color == null ? COLORS.white : o.color,
    align_h: o.left ? align.LEFT : align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: o.wrap ? text_style.WRAP : text_style.NONE
  })
}

export function rect(o) {
  return createWidget(widget.FILL_RECT, {
    x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h),
    radius: px(o.r || 0), angle: 0, color: o.color
  })
}

export function frame(o) {
  return createWidget(widget.STROKE_RECT, {
    x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h),
    radius: px(o.r || 0), line_width: px(o.lw || 2), angle: 0, color: o.color
  })
}

export function arc(o) {
  return createWidget(widget.ARC, {
    x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h),
    start_angle: o.start, end_angle: o.end, color: o.color, line_width: px(o.lw)
  })
}

export function show(w, visible) {
  w.setProperty(prop.VISIBLE, !!visible)
}

export function setText(w, value) {
  w.setProperty(prop.TEXT, value)
}

export function setColor(w, color) {
  w.setProperty(prop.MORE, { color })
}

// A plain tap on any of the given widgets (rect + its labels act as one target).
export function onTap(widgets, fn) {
  widgets.forEach((w) => w.addEventListener(event.CLICK_UP, fn))
}

// Press / release / slide-off on any of the given widgets.
export function onPress(widgets, down, up, out) {
  widgets.forEach((w) => {
    w.addEventListener(event.CLICK_DOWN, down)
    w.addEventListener(event.CLICK_UP, up)
    w.addEventListener(event.MOVE_OUT, out)
  })
}

// List row used by the log, history and detail screens: accent stripe, big value, title + small subtitle.
export function listRow(o) {
  const bg = rect({ x: o.x, y: o.y, w: o.w, h: 50, r: 12, color: COLORS.panel })
  const stripe = rect({ x: o.x, y: o.y, w: 6, h: 50, r: 3, color: o.accent })
  const big = text({ x: o.x + 12, y: o.y, w: 100, h: 50, text: o.big, size: 22, color: o.bigColor == null ? COLORS.white : o.bigColor, left: true })
  const title = text({ x: o.x + 114, y: o.y + 2, w: o.w - 120, h: 28, text: o.title, size: 20, left: true })
  const sub = text({ x: o.x + 114, y: o.y + 28, w: o.w - 120, h: 18, text: o.sub || '', size: 14, color: COLORS.muted, left: true })
  const all = [bg, stripe, big, title, sub]
  if (o.onTap) onTap(all, o.onTap)
  return { bg, stripe, big, title, sub, all }
}

// Pill-shaped tappable button: rect + centered label. Returns { bg, label, all }.
export function pillButton(o, fn) {
  const bg = rect({ x: o.x, y: o.y, w: o.w, h: o.h, r: o.h / 2, color: o.color })
  const label = text({ x: o.x, y: o.y, w: o.w, h: o.h, text: o.text, size: o.size || 22, color: o.textColor })
  const all = [bg, label]
  if (fn) onTap(all, fn)
  return { bg, label, all }
}
