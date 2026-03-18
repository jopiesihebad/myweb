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
import { ALERT_META, type AlertType, type SignalPayload, type Tier, type WsStatus } from '@/lib/useWebSocket'
import { PINE_ASSETS, type Asset } from '@/lib/assetRegistry'

// ─── Asset state per ticker ───────────────────────────────────
export type ConwayState = 'born' | 'alive' | 'dormant' | 'died'

export type AssetState = {
  ticker:       string
  assetClass:   Asset['assetClass']
  conwayState:  ConwayState
  cells:        number             // 0-8
  cells_arr:    number[]           // 8-element
  fusion:       number             // 0-23
  tier:         Tier | null
  lastSignal:   AlertType | null
  lastClose:    number | null
  lastUpdate:   string | null      // ISO timestamp
}

// Derive ConwayState from alert_type
function deriveConwayState(alertType: AlertType, current: ConwayState): ConwayState {
  if (alertType === 'CONWAY_BORN')                                                       return 'born'
  if (alertType === 'CONWAY_BUY' || alertType === 'GOLD_BUY' || alertType === 'PM_BUY') return 'alive'
  if (alertType === 'CONWAY_DIED' || alertType === 'ALPHA_EXIT')                         return 'died'
  if (alertType === 'CONWAY_SELL' || alertType === 'DOOM_SELL')                          return 'dormant'
  if (alertType === 'BBP_ENTRY_BUY' || alertType === 'BREAKOUT')                         return current === 'dormant' ? 'alive' : current
  return current
}

// Build initial assetStates from PINE_ASSETS (24 locked assets, DORMANT default)
function buildInitialStates(): Record<string, AssetState> {
  const map: Record<string, AssetState> = {}
  for (const a of PINE_ASSETS) {
    map[a.ticker] = {
      ticker:      a.ticker,
      assetClass:  a.assetClass,
      conwayState: 'dormant',
      cells:       0,
      cells_arr:   [0, 0, 0, 0, 0, 0, 0, 0],
      fusion:      0,
      tier:        null,
      lastSignal:  null,
      lastClose:   null,
      lastUpdate:  null,
    }
  }
  return map
}

// ─── Context shape ────────────────────────────────────────────
interface WsContextValue {
  status:      WsStatus
  latest:      SignalPayload | null
  assetStates: Record<string, AssetState>
  subscribe:   (cb: (payload: SignalPayload) => void) => () => void
}

const WsContext = createContext<WsContextValue>({
  status:      'disconnected',
  latest:      null,
  assetStates: buildInitialStates(),
  subscribe:   () => () => {},
})

// ─── Provider ─────────────────────────────────────────────────
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws          = useRef<WebSocket | null>(null)
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted     = useRef(true)
  const subscribers = useRef<Set<(p: SignalPayload) => void>>(new Set())

  const [status,      setStatus]      = useState<WsStatus>('disconnected')
  const [latest,      setLatest]      = useState<SignalPayload | null>(null)
  const [assetStates, setAssetStates] = useState<Record<string, AssetState>>(buildInitialStates)

  const broadcast = useCallback((payload: SignalPayload) => {
    setLatest(payload)

    // Update assetStates for the incoming ticker
    setAssetStates(prev => {
      const existing = prev[payload.ticker]
      // Accept updates for any known Pine asset or new ticker
      const asset = PINE_ASSETS.find(a => a.ticker === payload.ticker)
      const prevState = existing ?? {
        ticker:      payload.ticker,
        assetClass:  asset?.assetClass ?? 'CRYPTO',
        conwayState: 'dormant' as ConwayState,
        cells:       0,
        cells_arr:   [0, 0, 0, 0, 0, 0, 0, 0],
        fusion:      0,
        tier:        null,
        lastSignal:  null,
        lastClose:   null,
        lastUpdate:  null,
      }
      const newConwayState = deriveConwayState(payload.alert_type, prevState.conwayState)
      return {
        ...prev,
        [payload.ticker]: {
          ...prevState,
          conwayState: newConwayState,
          cells:       payload.cells,
          cells_arr:   payload.cells_arr ?? prevState.cells_arr,
          fusion:      payload.fusion,
          tier:        payload.tier,
          lastSignal:  payload.alert_type,
          lastClose:   payload.close,
          lastUpdate:  payload.timestamp,
        },
      }
    })

    // Notify all subscribers
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
          const meta = ALERT_META[payload.alert_type as AlertType]
          if (meta) broadcast(payload)
          else broadcast(payload)
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
    <WsContext.Provider value={{ status, latest, assetStates, subscribe }}>
      {children}
    </WsContext.Provider>
  )
}

// ─── Consumer hooks ───────────────────────────────────────────
export function useWsSignal() {
  return useContext(WsContext)
}

export function useAssetState(ticker: string): AssetState | null {
  const { assetStates } = useContext(WsContext)
  return assetStates[ticker] ?? null
}
