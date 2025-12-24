import { emit } from '../core/event-bus'

let patched = false
const patchedInstances = new WeakSet()

function applyPatch(axios: any) {
  if (!axios || !axios.interceptors) {
    return false
  }

  // Evita aplicar patch múltiplas vezes na mesma instância
  if (patchedInstances.has(axios)) {
    return true
  }

  // Adiciona interceptors
  axios.interceptors.request.use((config: any) => {
    console.log('[Inspector] axios request', config?.url || config)
    if (!config.meta) {
      config.meta = { start: performance.now() }
    }
    return config
  })

  axios.interceptors.response.use(
    (res: any) => {
      console.log('[Inspector] axios response', res.config?.url)
      const startTime = res.config?.meta?.start || performance.now()
      const duration = performance.now() - startTime
      
      console.log('[Inspector] axios event', {
        url: res.config?.url,
        status: res.status,
        duration,
      })
      
      emit({
        type: 'axios',
        data: {
          url: res.config?.url || 'unknown',
          status: res.status,
          duration,
        },
      })
      return res
    },
    (err: any) => {
      console.log('[Inspector] axios error', err?.config?.url || err)
      emit({ type: 'error', data: err })
      return Promise.reject(err)
    }
  )

  patchedInstances.add(axios)
  return true
}

function patchAxiosModule() {
  // Patche todas as instâncias possíveis do axios no cache de módulos
  if (typeof require !== 'undefined' && require.cache) {
    try {
      const axiosPath = require.resolve('axios')
      const axiosModule = require.cache[axiosPath]
      
      if (axiosModule && axiosModule.exports) {
        // Patche a exportação padrão
        if (axiosModule.exports.default) {
          applyPatch(axiosModule.exports.default)
        }
        // Patche a exportação nomeada
        if (axiosModule.exports !== axiosModule.exports.default) {
          applyPatch(axiosModule.exports)
        }
        // Patche também axios.create se existir
        if (axiosModule.exports.create && typeof axiosModule.exports.create === 'function') {
          const originalCreate = axiosModule.exports.create
          axiosModule.exports.create = function(...args: any[]) {
            const instance = originalCreate.apply(this, args)
            applyPatch(instance)
            return instance
          }
        }
      }
    } catch (err) {
      // Ignora erro
    }
  }
}

function patchAxiosInstance(axios: any) {
  if (!axios) return false
  
  let patched = false
  
  // Patche a instância padrão se tiver interceptors
  if (axios.interceptors) {
    patched = applyPatch(axios) || patched
  }
  
  // Patche axios.create para garantir que novas instâncias também sejam patchadas
  if (typeof axios.create === 'function') {
    const originalCreate = axios.create
    axios.create = function(...args: any[]) {
      const instance = originalCreate.apply(this, args)
      if (instance && instance.interceptors) {
        applyPatch(instance)
      }
      return instance
    }
    patched = true
  }
  
  return patched
}

export function patchAxios() {
  console.log('[Inspector] patching axios')
  if (patched) {
    console.log('[Inspector] axios already patched')
    return
  }

  let success = false

  // Método 1: Patche o módulo diretamente no cache (mais confiável)
  patchAxiosModule()

  // Método 2: Tenta obter via require
  if (typeof require !== 'undefined') {
    try {
      const axios = require('axios')
      const instance = axios.default || axios
      if (patchAxiosInstance(instance)) {
        success = true
      }
    } catch (err) {
      // Ignora erro
    }
  }

  // Método 3: Tenta import dinâmico (ESM) - importante para Next.js
  import('axios').then((axiosModule) => {
    const instance = axiosModule.default || axiosModule
    if (instance) {
      if (patchAxiosInstance(instance)) {
        success = true
        if (!patched) {
          patched = true
          console.log('[Inspector] axios patched successfully (async)')
        }
      }
    }
  }).catch((err) => {
    console.log('[Inspector] axios async import failed', err.message)
  })

  if (success) {
    patched = true
    console.log('[Inspector] axios patched successfully (sync)')
  } else {
    // Mesmo que não tenha conseguido patchear agora, tenta novamente depois
    setTimeout(() => {
      if (!patched) {
        patchAxios()
      }
    }, 100)
  }
}
