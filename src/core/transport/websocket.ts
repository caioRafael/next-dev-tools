import { emit } from "../event-bus";

let socket: WebSocket | null = null
const pendingEvents: unknown[] = []

export function connect(endpoint: string) {
    try {
        socket = new WebSocket(endpoint)

        socket.onopen = () => {
            console.log('[Inspector] WebSocket connected')
            // Envia eventos pendentes
            while (pendingEvents.length > 0) {
                const event = pendingEvents.shift()
                if (event && socket?.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify(event))
                }
            }
        }

        socket.onerror = (error) => {
            console.error('[Inspector] WebSocket error:', error)
        }

        socket.onclose = () => {
            console.log('[Inspector] WebSocket closed')
            socket = null
        }
    } catch (error) {
        console.error('[Inspector] Failed to connect WebSocket:', error)
    }

    return () => socket?.close()
}

export function send(event: unknown) {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event))
    } else {
        // Armazena eventos pendentes se o socket não estiver pronto
        pendingEvents.push(event)
    }
}