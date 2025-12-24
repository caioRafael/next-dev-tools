import { InspectorEvent } from './type'

type Color = 'reset' | 'bright' | 'dim' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'

const colors: Record<Color, string> = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function colorize(text: string, color: Color): string {
  return `${colors[color]}${text}${colors.reset}`
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${Math.round(ms * 1000)}μs`
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatStatus(status: number): string {
  if (status >= 200 && status < 300) {
    return colorize(status.toString(), 'green')
  }
  if (status >= 300 && status < 400) {
    return colorize(status.toString(), 'yellow')
  }
  if (status >= 400) {
    return colorize(status.toString(), 'red')
  }
  return colorize(status.toString(), 'white')
}

function formatEvent(event: InspectorEvent): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  const timestamp = `${timeStr}.${ms}`

  const timePrefix = colorize(`[${timestamp}]`, 'dim')

  switch (event.type) {
    case 'fetch': {
      const { url, status, duration } = event.data
      const typeLabel = colorize('FETCH', 'cyan')
      const statusLabel = formatStatus(status)
      const durationLabel = colorize(formatDuration(duration), duration > 1000 ? 'yellow' : 'dim')
      return `${timePrefix} ${typeLabel} ${statusLabel} ${durationLabel} ${url}`
    }

    case 'axios': {
      const { url, status, duration } = event.data
      const typeLabel = colorize('AXIOS', 'magenta')
      const statusLabel = formatStatus(status)
      const durationLabel = colorize(formatDuration(duration), duration > 1000 ? 'yellow' : 'dim')
      return `${timePrefix} ${typeLabel} ${statusLabel} ${durationLabel} ${url}`
    }

    case 'server-action': {
      const typeLabel = colorize('ACTION', 'blue')
      const dataStr = JSON.stringify(event.data, null, 2)
      return `${timePrefix} ${typeLabel} ${dataStr}`
    }

    case 'error': {
      const typeLabel = colorize('ERROR', 'red')
      const errorStr = event.data instanceof Error 
        ? event.data.message 
        : JSON.stringify(event.data, null, 2)
      return `${timePrefix} ${typeLabel} ${errorStr}`
    }
  }
}

function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         typeof process.versions !== 'undefined' && 
         typeof process.versions.node !== 'undefined'
}

export function createTerminalLogger() {
  // Só funciona no ambiente Node.js (servidor)
  if (!isNodeEnvironment()) {
    return () => {} // No-op no browser
  }

  return (event: InspectorEvent) => {
    console.log(formatEvent(event))
  }
}

