import {InspectorEvent} from './type'

type Listener = (event: InspectorEvent) => void

const listeners = new Set<Listener>()

export function on(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emit(event: InspectorEvent) {
  for (const listener of listeners) {
    listener(event)
  }
}