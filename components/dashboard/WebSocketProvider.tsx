'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  ALERT_META,
  TIER_META,
  type AlertType,
  type SignalPayload,
  type Tier,
  type Session,
  type WsStatus,
  ENTRY_ALERT_TYPES,
} from '@/lib/useWebSocket'
import { PINE_ASSETS, DASHBOARD_ASSETS, type Asset } from '@/lib/assetRegistry'

// ─────────────────────────────────────────────────────────────
//  dashboard/WebSocketProvider.tsx — UNIFIED SCHEMA v6.4
//  Uses locked SignalPayload from lib/useWebSocket.ts
//  DEV_MODE=true → uses mock simulation
//  DEV_MODE=false → real WebSocket from NEXT_PUBLIC_WS_URL
// ─────────────────────────────────────────────────────────────

const DEV_MODE = process.env.NODE_ENV === 'development'

// ─── Asset state ──────────────────────────────────────────────
export type ConwayState = 'born' | 'alive' | 'dormant' | 'died'

export type AssetState = {
  ticker:      string
  assetClass:  Asset['assetClass']
  conwayState: ConwayState
  cells:       number
  cells_arr:   number[]
  fusion:      number
  tier:        Tier | null
  lastSignal:  AlertType | null
  lastClose:   number | null
  lastUpdate:  string | null
}

function deriveConwayState(alertType: AlertType, current: ConwayState): ConwayState {
  if (alertType === 'CONWAY_BORN')                                                         return 'born'
  if (alertType === 'CONWAY_BUY' || alertType === 'GOLD_BUY' || alertType === 'PM_BUY')   return 'alive'
  if (alertType === 'CONWAY_DIED' || alertType === 'ALPHA_EXIT')                           return 'died'
  if (alertType === 'CONWAY_SELL' || alertType === 'DOOM_SELL')                            return 'dormant'
  if (alertType === 'BBP_ENTRY_BUY' || alertType === 'BREAKOUT')
    return current === 'dormant' ? 'alive' : current
  return current
}

function buildInitialStates(): Record<string, AssetState> {
  const map: Record<string, AssetState> = {}
  // Init all PINE + DASHBOARD assets as dormant
  const allAssets = [
    ...PINE_ASSETS,
    ...Object.values(DASHBOARD_ASSETS).flat(),
  ]
  const seen = new Set<string>()
  for (const a of allAssets) {
    if (seen.has(a.ticker)) continue
    seen.add(a.ticker)
    map[a.ticker] = {
      ticker: a.ticker, assetClass: a.assetClass,
      conwayState: 'dormant', cells: 0, cells_arr: [0,0,0,0,0,0,0,0],
      fusion: 0, tier: null, lastSignal: null, lastClose: null, lastUpdate: null,
    }
  }
  return map
}

// ─── Context ──────────────────────────────────────────────────
interface WSContextValue {
  status:      WsStatus
  connected:   boolean   // convenience alias
  lastSignal:  SignalPayload | null
  signals:     SignalPayload[]
  assetStates: Record<string, AssetState>
  newSignalIds: Set<string>
  clearNewId:  (id: string) => void
  subscribe:   (cb: (p: SignalPayload) => void) => () => void
}

const WSContext = createContext<WSContextValue>({
  status: 'disconnected', connected: false,
  lastSignal: null, signals: [], assetStates: buildInitialStates(),
  newSignalIds: new Set(), clearNewId: () => {}, subscribe: () => () => {},
})

export const useWS = () => useContext(WSContext)

// ─── DEV mock data (PINE_ASSETS tickers only) ─────────────────
const MOCK_TICKERS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BBCA', 'BBRI', 'ANTM', 'NVDA', 'XAUUSD',
]

const MOCK_ALERT_TYPES: AlertType[] = [
  'CONWAY_BUY', 'GOLD_BUY', 'BBP_ENTRY_BUY', 'LH_EXIT', 'CONWAY_BORN',
  'BREAKOUT', 'HIGH_CONFLUENCE', 'DIVERGENCE_RISK',
]

function makeMockSignal(overrides: Partial<SignalPayload> = {}): SignalPayload {
  const ticker    = MOCK_TICKERS[Math.floor(Math.random() * MOCK_TICKERS.length)]
  const alertType = MOCK_ALERT_TYPES[Math.floor(Math.random() * MOCK_ALERT_TYPES.length)]
  const isEntry   = ENTRY_ALERT_TYPES.has(alertType)
  const close     = ticker.includes('BTC') ? 85000 + Math.random() * 5000
                  : ticker.includes('ETH') ? 3200  + Math.random() * 200
                  : ticker.includes('SOL') ? 90    + Math.random() * 20
                  : ticker === 'XAUUSD'    ? 2900  + Math.random() * 100
                  : ticker === 'NVDA'      ? 850   + Math.random() * 50
                  : 9000 + Math.random() * 1000
  const atr       = close * 0.009
  const cells     = Math.floor(Math.random() * 4) + 3
  const cells_arr = Array.from({ length: 8 }, (_, i) => i < cells ? 1 : 0) as number[]
  const fusion    = Math.floor(Math.random() * 14) + 8
  const grade     = fusion >= 18 ? 1 : fusion >= 14 ? 2 : fusion >= 10 ? 3 : fusion >= 7 ? 4 : 5
  const tier: Tier= alertType === 'CONWAY_BORN' ? 'S'
                  : alertType === 'CONWAY_BUY'  ? 'A'
                  : cells >= 5 ? 'B' : 'C'
  const asset     = PINE_ASSETS.find(a => a.ticker === ticker)

  return {
    alert_type: alertType, ticker,
    close:    Math.round(close * 100) / 100,
    cells, cells_arr, fusion, grade, tier,
    session:   'LONDON' as Session,
    atr:       isEntry ? Math.round(atr * 100) / 100 : 0,
    sl_price:  isEntry ? Math.round((close - atr * 1.5) * 100) / 100 : 0,
    tp_price:  isEntry ? Math.round((close + atr * 3.0) * 100) / 100 : 0,
    timestamp: new Date().toISOString(),
    message:   `${alertType} on ${ticker} | Fusion:${fusion}/23 | Conway:${cells}/8 | Session:LONDON`,
    ...overrides,
  }
}

// Empty initial signals — populated in useEffect (client-only) to avoid hydration mismatch
const INITIAL_SIGNALS: SignalPayload[] = []

// ─── Provider ─────────────────────────────────────────────────
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws          = useRef<WebSocket | null>(null)
  const timer       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted     = useRef(true)
  const subscribers = useRef<Set<(p: SignalPayload) => void>>(new Set())

  const [status,       setStatus]       = useState<WsStatus>('disconnected')
  const [signals,      setSignals]      = useState<SignalPayload[]>(INITIAL_SIGNALS)
  const [assetStates,  setAssetStates]  = useState<Record<string, AssetState>>(buildInitialStates)
  const [newSignalIds, setNewSignalIds] = useState<Set<string>>(new Set())

  const clearNewId = useCallback((id: string) => {
    setNewSignalIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }, [])

  const handleSignal = useCallback((payload: SignalPayload) => {
    const id = `${payload.ticker}-${payload.timestamp}`

    // Update signals list
    setSignals(prev => [payload, ...prev].slice(0, 50))

    // Update assetStates
    setAssetStates(prev => {
      const existing   = prev[payload.ticker]
      const asset      = PINE_ASSETS.find(a => a.ticker === payload.ticker)
      const prevState  = existing ?? {
        ticker: payload.ticker, assetClass: asset?.assetClass ?? 'CRYPTO',
        conwayState: 'dormant' as ConwayState, cells: 0, cells_arr: [0,0,0,0,0,0,0,0],
        fusion: 0, tier: null, lastSignal: null, lastClose: null, lastUpdate: null,
      }
      return {
        ...prev,
        [payload.ticker]: {
          ...prevState,
          conwayState: deriveConwayState(payload.alert_type, prevState.conwayState),
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

    // Highlight new signal briefly
    setNewSignalIds(prev => new Set([...prev, id]))
    setTimeout(() => clearNewId(id), 3000)

    // Notify subscribers
    subscribers.current.forEach(cb => { try { cb(payload) } catch {} })
  }, [clearNewId])

  // Real WebSocket connection
  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL
    if (!url || !mounted.current || DEV_MODE) return

    setStatus('connecting')
    try {
      ws.current = new WebSocket(url)
      ws.current.onopen    = () => { if (mounted.current) setStatus('connected') }
      ws.current.onmessage = (e: MessageEvent) => {
        if (!mounted.current) return
        try {
          const payload = JSON.parse(e.data as string) as SignalPayload
          handleSignal(payload)
        } catch { console.warn('[WS Dashboard] Invalid JSON:', e.data) }
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
  }, [handleSignal])

  useEffect(() => {
    mounted.current = true

    if (DEV_MODE) {
      // Populate initial mock signals client-side only (avoids hydration mismatch)
      const initSignals: SignalPayload[] = [
        makeMockSignal({ alert_type: 'CONWAY_BUY',   ticker: 'BTCUSDT', cells: 6, fusion: 19, tier: 'A' }),
        makeMockSignal({ alert_type: 'GOLD_BUY',      ticker: 'BBCA',   cells: 7, fusion: 21, tier: 'A' }),
        makeMockSignal({ alert_type: 'LH_EXIT',       ticker: 'ANTM',   cells: 3, fusion:  8, tier: 'C', atr: 0, sl_price: 0, tp_price: 0 }),
        makeMockSignal({ alert_type: 'BBP_ENTRY_BUY', ticker: 'SOLUSDT',cells: 5, fusion: 14, tier: 'B' }),
        makeMockSignal({ alert_type: 'CONWAY_BORN',   ticker: 'XAUUSD', cells: 6, fusion: 20, tier: 'S' }),
      ]
      setSignals(initSignals)
      initSignals.forEach(s => handleSignal(s))

      // Simulate connected + periodic mock signals
      setStatus('connected')
      const interval = setInterval(() => {
        if (Math.random() > 0.6) handleSignal(makeMockSignal())
      }, 12000)
      return () => { mounted.current = false; clearInterval(interval) }
    }

    connect()
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      ws.current?.close()
    }
  }, [connect, handleSignal])

  const subscribe = useCallback((cb: (p: SignalPayload) => void) => {
    subscribers.current.add(cb)
    return () => { subscribers.current.delete(cb) }
  }, [])

  const lastSignal = signals[0] ?? null

  return (
    <WSContext.Provider value={{
      status,
      connected: status === 'connected',
      lastSignal,
      signals,
      assetStates,
      newSignalIds,
      clearNewId,
      subscribe,
    }}>
      {children}
    </WSContext.Provider>
  )
}

// Re-export types needed by dashboard components
export type { SignalPayload, AlertType, Tier, Session }
export { ALERT_META, TIER_META, ENTRY_ALERT_TYPES }
