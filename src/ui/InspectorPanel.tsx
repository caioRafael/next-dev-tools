'use client'

import { useState, useMemo, CSSProperties } from 'react'
import { useInspectorEvents } from './useInspectorEvents'
import type { InspectorEvent } from '../core/type'

export interface InspectorPanelProps {
  /**
   * Posição inicial do painel
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /**
   * Número máximo de eventos a manter
   */
  maxEvents?: number
  /**
   * Se true, o painel começa minimizado
   */
  defaultMinimized?: boolean
  /**
   * URL do WebSocket para receber eventos do servidor
   */
  websocketUrl?: string
}

const styles = {
  container: (position: string): CSSProperties => {
    const base: CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      fontSize: '14px',
      lineHeight: '1.5',
    }
    
    const positions: Record<string, Partial<CSSProperties>> = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
    }
    
    return { ...base, ...positions[position] }
  },
  toggleButton: {
    position: 'relative' as const,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  badge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: 600,
    minWidth: '18px',
    textAlign: 'center' as const,
  },
  panel: {
    width: '420px',
    maxWidth: 'calc(100vw - 40px)',
    maxHeight: '600px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitleText: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
  },
  headerCount: {
    background: 'rgba(255, 255, 255, 0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    overflowX: 'auto' as const,
    flexWrap: 'wrap' as const,
  },
  filterButton: (isActive: boolean, color?: string): CSSProperties => ({
    padding: '6px 12px',
    border: `1px solid ${isActive ? 'transparent' : '#e5e7eb'}`,
    borderRadius: '6px',
    background: isActive ? (color || '#667eea') : 'white',
    color: isActive ? 'white' : '#6b7280',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    whiteSpace: 'nowrap' as const,
  }),
  filterCount: (isActive: boolean): CSSProperties => ({
    background: isActive ? 'rgba(255, 255, 255, 0.3)' : '#f3f4f6',
    color: isActive ? 'white' : '#4b5563',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
  }),
  eventsList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px',
    background: '#f9fafb',
  },
  empty: {
    padding: '48px 24px',
    textAlign: 'center' as const,
    color: '#9ca3af',
  },
  emptyText: {
    margin: 0,
  },
  emptyHint: {
    margin: '8px 0 0 0',
    fontSize: '12px',
  },
  event: (borderColor: string): CSSProperties => ({
    background: 'white',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    borderLeft: `3px solid ${borderColor}`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  }),
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  eventType: (color: string): CSSProperties => ({
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.5px',
    color,
    textTransform: 'uppercase' as const,
  }),
  eventTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  eventBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  eventRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
  },
  eventLabel: {
    fontWeight: 600,
    color: '#6b7280',
    minWidth: '60px',
  },
  eventValue: {
    color: '#111827',
    wordBreak: 'break-all' as const,
    flex: 1,
  },
  eventError: {
    color: '#ef4444',
    wordBreak: 'break-all' as const,
    flex: 1,
  },
  eventJson: {
    margin: 0,
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '4px',
    fontSize: '11px',
    overflowX: 'auto' as const,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  },
  statusBadge: (status: number): CSSProperties => ({
    fontWeight: 500,
    color: status >= 400 ? '#ef4444' : status >= 300 ? '#f59e0b' : '#10b981',
  }),
  connectionIndicator: (connected: boolean): CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: connected ? '#10b981' : '#ef4444',
  }),
}

export function InspectorPanel({
  position = 'bottom-right',
  maxEvents = 100,
  defaultMinimized = false,
  websocketUrl,
}: InspectorPanelProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized)
  const [filter, setFilter] = useState<InspectorEvent['type'] | 'all'>('all')
  const { events, clearEvents, isConnected } = useInspectorEvents({
    maxEvents,
    websocketUrl,
  })

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events
    return events.filter((event) => event.type === filter)
  }, [events, filter])

  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: events.length,
      fetch: 0,
      axios: 0,
      'server-action': 0,
      error: 0,
    }
    events.forEach((event) => {
      const type = event.type as keyof typeof counts
      if (counts[type] !== undefined) {
        counts[type] = (counts[type] || 0) + 1
      }
    })
    return counts
  }, [events])

  const getEventTypeColor = (type: InspectorEvent['type']) => {
    switch (type) {
      case 'fetch':
        return '#06b6d4'
      case 'axios':
        return '#a855f7'
      case 'server-action':
        return '#3b82f6'
      case 'error':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${Math.round(ms * 1000)}μs`
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${timeStr}.${ms}`
  }

  return (
    <div style={styles.container(position)}>
      {/* Botão flutuante quando minimizado */}
      {isMinimized && (
        <button
          style={styles.toggleButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onClick={() => setIsMinimized(false)}
          title="Abrir Inspector"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {events.length > 0 && (
            <span style={styles.badge}>{events.length}</span>
          )}
        </button>
      )}

      {/* Painel expandido */}
      {!isMinimized && (
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>
              <h3 style={styles.headerTitleText}>Inspector</h3>
              {events.length > 0 && (
                <span style={styles.headerCount}>{events.length}</span>
              )}
              {websocketUrl && (
                <span
                  style={styles.connectionIndicator(isConnected)}
                  title={isConnected ? 'Conectado' : 'Desconectado'}
                />
              )}
            </div>
            <div style={styles.headerActions}>
              <button
                style={{
                  ...styles.iconButton,
                  opacity: events.length === 0 ? 0.5 : 1,
                  cursor: events.length === 0 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (events.length > 0) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onClick={clearEvents}
                title="Limpar eventos"
                disabled={events.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
              <button
                style={styles.iconButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onClick={() => setIsMinimized(true)}
                title="Minimizar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div style={styles.filters}>
            {(['all', 'fetch', 'axios', 'server-action', 'error'] as const).map(
              (type) => {
                const count = eventCounts[type] || 0
                const isActive = filter === type
                const colorType = type === 'all' ? 'fetch' : type
                return (
                  <button
                    key={type}
                    style={styles.filterButton(isActive, getEventTypeColor(colorType))}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#f9fafb'
                        e.currentTarget.style.borderColor = '#d1d5db'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.borderColor = '#e5e7eb'
                      }
                    }}
                    onClick={() => setFilter(type)}
                  >
                    {type === 'all' ? 'Todos' : type}
                    {count > 0 && (
                      <span style={styles.filterCount(isActive)}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              }
            )}
          </div>

          {/* Lista de eventos */}
          <div style={styles.eventsList}>
            {filteredEvents.length === 0 ? (
              <div style={styles.empty}>
                <p style={styles.emptyText}>Nenhum evento ainda</p>
                <p style={styles.emptyHint}>
                  Faça requisições para ver os eventos aqui
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    ...styles.event(getEventTypeColor(event.type)),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={styles.eventHeader}>
                    <span style={styles.eventType(getEventTypeColor(event.type))}>
                      {event.type.toUpperCase()}
                    </span>
                    <span style={styles.eventTime}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <div style={styles.eventBody}>
                    {event.type === 'fetch' || event.type === 'axios' ? (
                      <>
                        <div style={styles.eventRow}>
                          <span style={styles.eventLabel}>URL:</span>
                          <span style={styles.eventValue}>
                            {event.data.url || 'unknown'}
                          </span>
                        </div>
                        <div style={styles.eventRow}>
                          <span style={styles.eventLabel}>Status:</span>
                          <span style={styles.statusBadge(event.data.status)}>
                            {event.data.status}
                          </span>
                        </div>
                        {event.data.duration !== undefined && (
                          <div style={styles.eventRow}>
                            <span style={styles.eventLabel}>
                              Duração:
                            </span>
                            <span style={styles.eventValue}>
                              {formatDuration(event.data.duration)}
                            </span>
                          </div>
                        )}
                        {event.data.method && (
                          <div style={styles.eventRow}>
                            <span style={styles.eventLabel}>Método:</span>
                            <span style={styles.eventValue}>
                              {event.data.method}
                            </span>
                          </div>
                        )}
                      </>
                    ) : event.type === 'error' ? (
                      <div style={styles.eventRow}>
                        <span style={styles.eventLabel}>Erro:</span>
                        <span style={styles.eventError}>
                          {event.data.message || JSON.stringify(event.data)}
                        </span>
                      </div>
                    ) : (
                      <div style={styles.eventRow}>
                        <pre style={styles.eventJson}>
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
