import { emit } from '../core/event-bus'

let patched = false

export function patchFetch() {
  console.log('[Inspector] patching fetch')
  if (patched || !globalThis.fetch) return
  patched = true

  const original = globalThis.fetch

  globalThis.fetch = async (...args) => {
    console.log('[Inspector] fetch called', { args })
    const start = performance.now()

    try {
      const res = await original(...args)
      console.log('[Inspector] fetch event', {
        url: String(args[0]),
        status: res.status,
        duration: performance.now() - start,
      })
      emit({
        type: 'fetch',
        data: {
          url: String(args[0]),
          status: res.status,
          duration: performance.now() - start,
        },
      })
      return res
    } catch (err) {
      emit({ type: 'error', data: err })
      throw err
    }
  }
}
