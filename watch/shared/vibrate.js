import {
  Vibrator,
  VIBRATOR_SCENE_SHORT_MIDDLE,
  VIBRATOR_SCENE_SHORT_STRONG,
  VIBRATOR_SCENE_DURATION,
  VIBRATOR_SCENE_DURATION_LONG
} from '@zos/sensor'

// Each reminder has its own rhythm so it can be told apart without looking.
// Steps are [scene, delay before this step in ms]; sequenced with setTimeout so it works on API 3.0
// (scene arrays in Vibrator.start need 3.6).
const PATTERNS = {
  tick: [[VIBRATOR_SCENE_SHORT_MIDDLE, 0]], // entry logged
  pre: [[VIBRATOR_SCENE_DURATION, 0]], // 10 s before rhythm check: 1x
  cycle: [[VIBRATOR_SCENE_DURATION, 0], [VIBRATOR_SCENE_DURATION, 900]], // cycle over: 2x long
  epi: [[VIBRATOR_SCENE_SHORT_STRONG, 0], [VIBRATOR_SCENE_SHORT_STRONG, 250], [VIBRATOR_SCENE_SHORT_STRONG, 250]], // epi due: 3x short
  pause: [[VIBRATOR_SCENE_DURATION_LONG, 0]] // hands-off >= 10 s: 1x very long
}

let vibrator = null
let timers = []

function get() {
  if (!vibrator) vibrator = new Vibrator()
  return vibrator
}

export function vibrate(name) {
  const steps = PATTERNS[name]
  if (!steps) return
  timers.forEach((t) => clearTimeout(t))
  timers = []
  let at = 0
  steps.forEach(([mode, delay]) => {
    at += delay
    timers.push(setTimeout(() => {
      try {
        const v = get()
        v.stop()
        v.start({ mode })
      } catch (e) {
        console.log('vibrate failed', e)
      }
    }, at))
  })
}

export function stopVibrate() {
  timers.forEach((t) => clearTimeout(t))
  timers = []
  try { if (vibrator) vibrator.stop() } catch (e) {}
}
