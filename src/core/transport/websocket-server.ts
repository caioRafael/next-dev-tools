import { WebSocketServer, WebSocket } from 'ws'
import type { InspectorEvent } from '../type'

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

export function createWebSocketServer(port: number = 3001) {
  if (wss) {
    console.log(`[Inspector] WebSocket server already running on port ${port}`)
    return wss
  }

  try {
    wss = new WebSocketServer({ port })

    wss.on('listening', () => {
      console.log(`[Inspector] WebSocket server listening on ws://localhost:${port}`)
    })

    wss.on('connection', (ws: WebSocket) => {
      console.log('[Inspector] Client connected to WebSocket server')
      clients.add(ws)

      ws.on('close', () => {
        console.log('[Inspector] Client disconnected from WebSocket server')
        clients.delete(ws)
      })

      ws.on('error', (error) => {
        console.error('[Inspector] WebSocket client error:', error)
        clients.delete(ws)
      })
    })

    wss.on('error', (error) => {
      console.error('[Inspector] WebSocket server error:', error)
    })

    return wss
  } catch (error) {
    console.error('[Inspector] Failed to create WebSocket server:', error)
    return null
  }
}

export function broadcastToClients(event: InspectorEvent) {
  if (clients.size === 0) return

  const message = JSON.stringify(event)
  let disconnected = 0

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message)
      } catch (error) {
        console.error('[Inspector] Error sending to client:', error)
        disconnected++
      }
    } else {
      disconnected++
    }
  })

  // Remove clientes desconectados
  if (disconnected > 0) {
    clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) {
        clients.delete(client)
      }
    })
  }
}

export function closeWebSocketServer() {
  if (wss) {
    clients.forEach((client) => {
      client.close()
    })
    clients.clear()
    wss.close()
    wss = null
    console.log('[Inspector] WebSocket server closed')
  }
}

