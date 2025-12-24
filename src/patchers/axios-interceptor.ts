import { emit } from '../core/event-bus'
import { send } from '../core/transport/websocket'
import type { InspectorEvent } from '../core/type'

export interface AxiosInterceptorConfig {
  /**
   * Se true, envia eventos para o WebSocket além do event-bus
   */
  sendToWebSocket?: boolean
}

/**
 * Aplica interceptors do inspector em uma instância do axios
 * 
 * @example
 * ```typescript
 * import axios from 'axios'
 * import { applyAxiosInterceptor } from 'next-dev-tools'
 * 
 * const api = axios.create({ baseURL: 'https://api.example.com' })
 * applyAxiosInterceptor(api)
 * ```
 */
export function applyAxiosInterceptor(
  axiosInstance: any,
  config?: AxiosInterceptorConfig
): () => void {
  if (!axiosInstance || !axiosInstance.interceptors) {
    throw new Error('Invalid axios instance: interceptors not available')
  }

  const sendToWebSocket = config?.sendToWebSocket ?? false

  // Request interceptor
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (requestConfig: any) => {
      console.log('[Inspector] axios request', requestConfig?.method?.toUpperCase() || 'GET', requestConfig?.url, requestConfig)
      if (!requestConfig.meta) {
        requestConfig.meta = { start: performance.now() }
      }
      return requestConfig
    },
    (error: any) => {
      console.log('[Inspector] axios request error', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response: any) => {
      const startTime = response.config?.meta?.start || performance.now()
      const duration = performance.now() - startTime

      console.log('[Inspector] axios response', response.config?.method?.toUpperCase() || 'GET', response.config?.url, {
        status: response.status,
        duration,
      })

      const event: InspectorEvent = {
        type: 'axios',
        data: {
          url: response.config?.url || 'unknown',
          status: response.status,
          duration,
          method: response.config?.method?.toUpperCase() || 'GET',
          baseURL: response.config?.baseURL,
        },
      }

      // Emite para o event-bus (que já envia para listeners como terminal logger)
      emit(event)

      // Envia para WebSocket se configurado
      if (sendToWebSocket) {
        send(event)
      }

      return response
    },
    (error: any) => {
      const startTime = error.config?.meta?.start || performance.now()
      const duration = performance.now() - startTime

      console.log('[Inspector] axios error', error.config?.method?.toUpperCase() || 'GET', error.config?.url, {
        message: error.message,
        status: error.response?.status,
        duration,
      })

      const errorEvent: InspectorEvent = {
        type: 'error',
        data: {
          message: error.message,
          url: error.config?.url || 'unknown',
          status: error.response?.status,
          duration,
          method: error.config?.method?.toUpperCase() || 'GET',
          baseURL: error.config?.baseURL,
        },
      }

      // Emite para o event-bus
      emit(errorEvent)

      // Envia para WebSocket se configurado
      if (sendToWebSocket) {
        send(errorEvent)
      }

      return Promise.reject(error)
    }
  )

  // Retorna função para remover os interceptors
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId)
    axiosInstance.interceptors.response.eject(responseInterceptorId)
  }
}
