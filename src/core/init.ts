import { connect } from './transport/websocket'
import { on } from './event-bus'
import { patchFetch } from '../patchers/fetch'
import { patchAxios } from '../patchers/axios'
import { createTerminalLogger } from './terminal-logger'


declare global {
  var __INSPECTOR_INITIALIZED__: boolean | undefined
}

function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production'
  }
  return false
}

function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         typeof process.versions !== 'undefined' && 
         typeof process.versions.node !== 'undefined'
}

export function initInspector(config: { endpoint: string; terminal?: boolean }) {

    console.log('[Inspector] initialized')
  if (globalThis.__INSPECTOR_INITIALIZED__) return
  globalThis.__INSPECTOR_INITIALIZED__ = true

  // Só inicializa no servidor (Node.js)
  if (!isNodeEnvironment()) {
    console.log('[Inspector] not in node environment')
    return
  }

  console.log('[Inspector] connecting to endpoint', config.endpoint)
  connect(config.endpoint)

  // Ativa o logger de terminal por padrão em desenvolvimento ou se explicitamente solicitado
  // terminal: undefined ou true = ativa (padrão em dev)
  // terminal: false = desativa
  const shouldEnableTerminal = config.terminal !== false && (
    config.terminal === true || isDevelopment()
  )

  console.log('[Inspector] should enable terminal', shouldEnableTerminal)

  if (shouldEnableTerminal) {
    const logger = createTerminalLogger()
    on(logger)
    // Log inicial para confirmar que o terminal está ativo
    console.log('\x1b[36m%s\x1b[0m', '[Inspector] Terminal logger enabled')
  }

  patchFetch()
  patchAxios()
}