import {InspectorEvent} from './type'
import { send } from './transport/websocket'

type Listener = (event: InspectorEvent) => void

const listeners = new Set<Listener>()

export function on(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emit(event: InspectorEvent) {
  // Notifica listeners locais
  for (const listener of listeners) {
    listener(event)
  }
  
  // Envia para WebSocket (para comunicação servidor -> cliente)
  send(event)
}