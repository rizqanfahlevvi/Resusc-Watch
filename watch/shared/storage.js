import { localStorage } from '@zos/storage'
import { HISTORY_MAX } from './core'

// The running session is saved on every change, so a crash or an accidental exit can resume it.
const ACTIVE = 'cbh.active'
const HISTORY = 'cbh.history'

function read(key, fallback) {
  try {
    // Typed as void in @zeppos/device-types, but it returns the stored value.
    const raw = /** @type {any} */ (localStorage.getItem(key, ''))
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.log('storage write failed', key, e)
  }
}

export function loadActive() { return read(ACTIVE, null) }
export function saveActive(session) { write(ACTIVE, session) }
export function clearActive() {
  try { localStorage.removeItem(ACTIVE) } catch (e) {}
}

export function loadHistory() { return read(HISTORY, []) }
export function findSession(id) {
  return loadHistory().filter((s) => String(s.id) === String(id))[0] || null
}
export function pushHistory(session) {
  const h = loadHistory()
  h.unshift(session)
  write(HISTORY, h.slice(0, HISTORY_MAX))
}
