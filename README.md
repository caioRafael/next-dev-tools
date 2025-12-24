# Next Dev Tools

Biblioteca para inspecionar e monitorar eventos em aplicações Next.js, incluindo requisições fetch, axios, server actions e erros.

## Funcionalidades

- 🔍 Monitoramento de requisições Fetch
- 📡 Monitoramento de requisições Axios
- 🎯 Server Actions tracking
- ❌ Error tracking
- 🖥️ Terminal logger com formatação colorida
- 🔌 WebSocket transport para eventos em tempo real

## Instalação

```bash
npm install next-dev-tools
```

## Uso Básico

### Next.js 13+ (App Router)

Crie um arquivo `instrumentation.ts` na raiz do seu projeto:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupInspector } = await import('next-dev-tools')
    
    setupInspector({
      endpoint: 'ws://localhost:3001',
      terminal: true  // Ativa o logger no terminal (padrão em dev)
    })
  }
}
```

E habilite no `next.config.js`:

```javascript
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

## Configuração

```typescript
setupInspector({
  endpoint: 'ws://localhost:3001',  // Endpoint WebSocket (opcional)
  terminal: true                     // Ativa terminal logger (padrão em dev)
})
```

### Opções

- `endpoint` (string): Endpoint WebSocket para enviar eventos
- `terminal` (boolean): Ativa/desativa o logger no terminal
  - `undefined` ou `true`: Ativa em desenvolvimento, desativa em produção
  - `false`: Desativa completamente

## Aplicando Interceptor Manualmente no Axios

Se o patch automático do axios não funcionar (por exemplo, quando o axios é importado antes do inspector ser inicializado), você pode aplicar o interceptor manualmente:

```typescript
import axios from 'axios'
import { applyAxiosInterceptor } from 'next-dev-tools'

// Crie sua instância do axios
const api = axios.create({
  baseURL: 'https://api.example.com'
})

// Aplique o interceptor
const removeInterceptor = applyAxiosInterceptor(api, {
  sendToWebSocket: true  // Opcional: envia eventos para WebSocket
})

// Use normalmente
api.get('/users').then(response => {
  console.log(response.data)
})

// Para remover o interceptor (opcional)
// removeInterceptor()
```

### Parâmetros de `applyAxiosInterceptor`

- `axiosInstance`: Instância do axios (retornada por `axios.create()` ou `axios` padrão)
- `config` (opcional):
  - `sendToWebSocket` (boolean): Se `true`, envia eventos diretamente para o WebSocket além do event-bus

### Retorno

A função retorna uma função para remover os interceptors quando necessário.

## Testando a Biblioteca

### Usando a aplicação de exemplo

1. **Build da biblioteca**:
   ```bash
   npm run build
   ```

2. **Setup e execução da aplicação de exemplo**:
   ```bash
   cd example
   ./setup.sh
   npm run dev
   ```

3. **Ou use o script de teste**:
   ```bash
   npm run test:example
   ```

4. Abra http://localhost:3000 e use os botões para testar diferentes tipos de eventos

5. Veja os eventos formatados no terminal do servidor Next.js

Veja mais detalhes em [example/README.md](./example/README.md)

## Componente UI Flutuante

A biblioteca inclui um componente React de UI flutuante que exibe os eventos em tempo real na aplicação.

**⚠️ Requisito:**
- WebSocket URL para comunicação servidor ↔ cliente

O componente usa estilos inline e não requer Tailwind CSS ou outras dependências de estilo.

```tsx
'use client'

import { InspectorPanel } from 'next-dev-tools'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <InspectorPanel 
        position="bottom-right"
        maxEvents={100}
        defaultMinimized={false}
        websocketUrl="ws://localhost:3001" // Mesma URL usada no setupInspector
      />
    </>
  )
}
```

**Importante:** O `websocketUrl` deve ser a mesma URL configurada no `setupInspector` do servidor. Os eventos são enviados do servidor para o cliente via WebSocket.


### Props do InspectorPanel

- `position` (`'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`): Posição do painel na tela (padrão: `'bottom-right'`)
- `maxEvents` (`number`): Número máximo de eventos a manter (padrão: `100`)
- `defaultMinimized` (`boolean`): Se `true`, o painel começa minimizado (padrão: `false`)

### Hook useInspectorEvents

Você também pode usar o hook diretamente para criar sua própria UI:

```tsx
import { useInspectorEvents } from 'next-dev-tools'

function MyCustomInspector() {
  const { events, clearEvents } = useInspectorEvents(50)
  
  return (
    <div>
      {events.map(event => (
        <div key={event.id}>{event.type}</div>
      ))}
    </div>
  )
}
```

## Exemplo de Saída no Terminal

```
[Inspector] Terminal logger enabled
[14:23:45.123] FETCH 200 45ms https://api.example.com/data
[14:23:45.456] AXIOS 200 120ms https://api.example.com/users
[14:23:45.789] ERROR Network request failed
```

## Desenvolvimento

```bash
# Build
npm run build

# Watch mode
npm run watch

# Testar com aplicação de exemplo
npm run test:example
```

## Estrutura

```
src/
  core/
    event-bus.ts        # Sistema de eventos
    init.ts             # Inicialização
    terminal-logger.ts  # Logger para terminal
    transport/          # Transportes (WebSocket)
  patchers/
    fetch.ts            # Patch para fetch
    axios.ts            # Patch para axios
  setup.ts              # Setup principal
```

## Licença

ISC

