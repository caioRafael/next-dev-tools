import { useEffect, useState, useCallback } from 'react'
import type { InspectorEvent } from '../core/type'

export type InspectorEventWithId = InspectorEvent & {
  id: string
  timestamp: number
}

interface UseInspectorEventsOptions {
  maxEvents?: number
  websocketUrl?: string
}

export function useInspectorEvents(options: UseInspectorEventsOptions | number = {}) {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 100
  const websocketUrl = typeof options === 'object' ? options.websocketUrl : undefined
  
  const [events, setEvents] = useState<InspectorEventWithId[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Se não há WebSocket URL, tenta usar o event-bus local (apenas funciona no mesmo contexto)
    if (!websocketUrl) {
      // No cliente, precisamos de WebSocket. Se não fornecido, não funciona.
      console.warn('[Inspector] WebSocket URL não fornecida. Eventos não serão recebidos no cliente.')
      return
    }

    let socket: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectWebSocket = () => {
      try {
        socket = new WebSocket(websocketUrl!)

        socket.onopen = () => {
          console.log('[Inspector] WebSocket connected (client)')
          setIsConnected(true)
        }

        socket.onmessage = (event) => {
          try {
            const inspectorEvent: InspectorEvent = JSON.parse(event.data)
            setEvents((prev) => {
              const newEvent: InspectorEventWithId = {
                ...inspectorEvent,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: Date.now(),
              }
              const updated = [newEvent, ...prev]
              return updated.slice(0, maxEvents)
            })
          } catch (error) {
            console.error('[Inspector] Error parsing WebSocket message:', error)
          }
        }

        socket.onerror = (error) => {
          console.error('[Inspector] WebSocket error:', error)
          setIsConnected(false)
        }

        socket.onclose = () => {
          console.log('[Inspector] WebSocket closed')
          setIsConnected(false)
          socket = null
          
          // Reconecta após 3 segundos
          reconnectTimeout = setTimeout(() => {
            connectWebSocket()
          }, 3000)
        }
      } catch (error) {
        console.error('[Inspector] Failed to connect WebSocket:', error)
        setIsConnected(false)
      }
    }

    connectWebSocket()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [websocketUrl, maxEvents])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { events, clearEvents, isConnected }
}
