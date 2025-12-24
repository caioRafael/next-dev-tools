import { broadcastToClients, createWebSocketServer } from './websocket-server'
import type { InspectorEvent } from '../type'

let serverInitialized = false
let serverPort = 3001

// Detecta se está no servidor
let isServer = false
try {
  isServer = typeof process !== 'undefined' && process.versions?.node !== undefined
} catch {
  isServer = false
}

export function connect(endpoint: string) {
    // Só funciona no servidor
    if (!isServer) {
        return () => {}
    }

    // Extrai a porta da URL
    try {
        const url = new URL(endpoint)
        const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'wss:' ? 443 : 80)
        if (port && port !== 80 && port !== 443) {
            serverPort = port
        }
    } catch {
        // Se não conseguir parsear, tenta extrair da string
        const match = endpoint.match(/:(\d+)/)
        if (match) {
            serverPort = parseInt(match[1], 10)
        }
    }

    // Cria o servidor WebSocket se ainda não foi criado
    if (!serverInitialized) {
        createWebSocketServer(serverPort)
        serverInitialized = true
    }

    return () => {
        // Cleanup se necessário
    }
}

export function send(event: InspectorEvent) {
    // No servidor, envia para todos os clientes conectados
    if (isServer) {
        broadcastToClients(event)
    }
    // No cliente, não faz nada (o cliente recebe via WebSocket diretamente)
}