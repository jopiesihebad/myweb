'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ALERT_META, type AlertType, type SignalPayload, type WsStatus } from '@/lib/useWebSocket'

/* ─── Context shape ─────────────────────────────────── */
interface WsContextValue {
  status:    WsStatus
  latest:    SignalPayload | null
  /** Subscribe to incoming signals. Returns unsubscribe fn. */
  subscribe: (cb: (payload: SignalPayload) => void) => () => void
}

const WsContext = createContext<WsContextValue>({
  status:    'disconnected',
  latest:    null,
  subscribe: () => () => {},
})

/* ─── Provider ──────────────────────────────────────── */
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws          = useRef<WebSocket | null>(null)
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted     = useRef(true)
  const subscribers = useRef<Set<(p: SignalPayload) => void>>(new Set())

  const [status, setStatus] = useState<WsStatus>('disconnected')
  const [latest, setLatest] = useState<SignalPayload | null>(null)

  const broadcast = useCallback((payload: SignalPayload) => {
    setLatest(payload)
    subscribers.current.forEach(cb => { try { cb(payload) } catch {} })
  }, [])

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL
    if (!url || !mounted.current) return

    setStatus('connecting')
    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        if (!mounted.current) return
        setStatus('connected')
      }

      ws.current.onmessage = (e: MessageEvent) => {
        if (!mounted.current) return
        try {
          const payload = JSON.parse(e.data as string) as SignalPayload
          // Enrich with ALERT_META if available
          const meta = ALERT_META[payload.alert_type as AlertType]
          if (meta) broadcast(payload)
          else broadcast(payload) // pass through unknown types too
        } catch {
          console.warn('[WS] Invalid JSON:', e.data)
        }
      }

      ws.current.onerror  = () => { if (mounted.current) setStatus('error') }

      ws.current.onclose  = () => {
        if (!mounted.current) return
        setStatus('disconnected')
        timer.current = setTimeout(connect, 5000)
      }
    } catch {
      setStatus('error')
      timer.current = setTimeout(connect, 5000)
    }
  }, [broadcast])

  useEffect(() => {
    mounted.current = true
    connect()
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      ws.current?.close()
    }
  }, [connect])

  const subscribe = useCallback((cb: (p: SignalPayload) => void) => {
    subscribers.current.add(cb)
    return () => { subscribers.current.delete(cb) }
  }, [])

  return (
    <WsContext.Provider value={{ status, latest, subscribe }}>
      {children}
    </WsContext.Provider>
  )
}

/* ─── Consumer hook ─────────────────────────────────── */
/**
 * Use inside any client component to receive real-time signals.
 *
 * @example
 * const { status, latest } = useWsSignal()
 *
 * // Or subscribe to every signal:
 * const { subscribe } = useWsSignal()
 * useEffect(() => subscribe(payload => console.log(payload)), [subscribe])
 */
export function useWsSignal() {
  return useContext(WsContext)
}
