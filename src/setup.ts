import 'server-only'
import { initInspector } from './core/init'

export function setupInspector(config: { endpoint: string; terminal?: boolean }) {
  initInspector(config)
}
