'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  Locked payload schema — SS BlackBox v6.4
//  Must match make_json() output in Pine Script exactly
// ─────────────────────────────────────────────────────────────

export type SignalPayload = {
  alert_type:  AlertType
  ticker:      string
  close:       number        // number, NOT string
  cells:       number        // integer 0-8
  cells_arr:   number[]      // 8-element array [cell0..cell7]
  fusion:      number        // renamed from confluence/score
  grade:       number        // integer 1-5
  tier:        Tier          // 'S'|'A'|'B'|'C'
  session:     Session       // 'NY'|'LONDON'|'ASIA'|'OFF'
  atr:         number        // 0 for INFO/EXIT alerts
  sl_price:    number        // 0 for INFO/EXIT alerts
  tp_price:    number        // 0 for INFO/EXIT alerts
  timestamp:   string        // ISO 8601
  message:     string
}

export type AlertType =
  | 'GOLD_BUY'         | 'DOOM_SELL'         | 'CONWAY_BUY'      | 'CONWAY_SELL'
  | 'CONWAY_BORN'      | 'CONWAY_DIED'       | 'PM_BUY'          | 'PM_SELL'
  | 'BULLISH_LIQ_GRAB' | 'BEARISH_LIQ_GRAB' | 'BREAKOUT'        | 'SQZ_RELEASED'
  | 'PREDATOR_HFT'     | 'ALPHA_EXIT'        | 'DIVERGENCE_RISK' | 'HIGH_CONFLUENCE'
  | 'CHoCH_BULL'       | 'CHoCH_BEAR'        | 'BOS_BULL'        | 'BOS_BEAR'
  | 'OB_TOUCH_BULL'    | 'OB_TOUCH_BEAR'     | 'BBP_ENTRY_BUY'   | 'BBP_ENTRY_SELL'
  | 'LH_EXIT'
  | 'LONDON_OPEN'      | 'NEW_YORK_OPEN'     | 'BBP_CROSSOVER'   | 'BBP_CROSSUNDER'

export type Tier    = 'S' | 'A' | 'B' | 'C'
export type Session = 'NY' | 'LONDON' | 'ASIA' | 'OFF'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// 2-tier validation classification
export const ENTRY_ALERT_TYPES = new Set<AlertType>([
  'GOLD_BUY', 'CONWAY_BUY', 'CONWAY_BORN', 'PM_BUY', 'BBP_ENTRY_BUY',
])

export function isEntryAlert(type: AlertType): boolean {
  return ENTRY_ALERT_TYPES.has(type)
}

interface UseWebSocketOptions {
  onSignal?:       (payload: SignalPayload) => void
  reconnectDelay?: number
}

export function useWebSocket({ onSignal, reconnectDelay = 5000 }: UseWebSocketOptions = {}) {
  const ws      = useRef<WebSocket | null>(null)
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(true)
  const [status, setStatus] = useState<WsStatus>('disconnected')

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL
    if (!url || !mounted.current) return

    setStatus('connecting')

    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        if (!mounted.current) return
        setStatus('connected')
        console.log('[WS] Connected to', url)
      }

      ws.current.onmessage = (event: MessageEvent) => {
        if (!mounted.current) return
        try {
          const payload: SignalPayload = JSON.parse(event.data as string)
          onSignal?.(payload)
        } catch {
          console.warn('[WS] Invalid JSON payload:', event.data)
        }
      }

      ws.current.onerror = () => {
        if (!mounted.current) return
        setStatus('error')
      }

      ws.current.onclose = () => {
        if (!mounted.current) return
        setStatus('disconnected')
        console.log(`[WS] Disconnected. Reconnecting in ${reconnectDelay}ms…`)
        timer.current = setTimeout(connect, reconnectDelay)
      }
    } catch (err) {
      console.error('[WS] Failed to connect:', err)
      setStatus('error')
      timer.current = setTimeout(connect, reconnectDelay)
    }
  }, [onSignal, reconnectDelay])

  useEffect(() => {
    mounted.current = true
    connect()
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((data: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { status, send }
}

// ─── Alert type → display metadata ───────────────────────────
export const ALERT_META: Record<AlertType, {
  label:    string
  color:    string
  category: 'ENTRY' | 'EXIT' | 'INFO'
  desc:     string
}> = {
  GOLD_BUY:         { label: '⚡ GOLD BUY',        color: '#ffd700', category: 'ENTRY', desc: 'High-confluence gold signal: PM cross + VWAP + RSI — no Conway gate' },
  DOOM_SELL:        { label: '⚡ DOOM SELL',        color: '#ff0062', category: 'INFO',  desc: 'Bearish confluence signal — LONG-only system ignores for entry' },
  CONWAY_BUY:       { label: '⚡ CONWAY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'Conway ALIVE ≥5 cells + PM cross + VWAP + RSI — Tier A' },
  CONWAY_SELL:      { label: '⚡ CONWAY SELL',      color: '#ff0062', category: 'INFO',  desc: 'Conway bearish — LONG-only system ignores for entry' },
  CONWAY_BORN:      { label: '🟢 CONWAY BORN',      color: '#39ff14', category: 'ENTRY', desc: 'Conway just turned ALIVE + conf_buy — Tier S, max conviction' },
  CONWAY_DIED:      { label: '🔴 CONWAY DIED',      color: '#ff0062', category: 'EXIT',  desc: 'Conway cells dropped below threshold — exit or pause positions' },
  PM_BUY:           { label: 'PM BUY',              color: '#00c3ff', category: 'ENTRY', desc: 'Momentum buy: PM crossover without full confluence gate' },
  PM_SELL:          { label: 'PM SELL',             color: '#ff8c00', category: 'INFO',  desc: 'Momentum sell — LONG-only system ignores for entry' },
  BULLISH_LIQ_GRAB: { label: '💧 LIQ GRAB BULL',   color: '#39ff14', category: 'INFO',  desc: 'Bullish liquidity grab: wick below support swept, reversal expected' },
  BEARISH_LIQ_GRAB: { label: '💧 LIQ GRAB BEAR',   color: '#ff0062', category: 'INFO',  desc: 'Bearish liquidity grab: wick above resistance swept, reversal expected' },
  BREAKOUT:         { label: '🚀 BREAKOUT',          color: '#00c3ff', category: 'INFO',  desc: 'Price breaks key resistance with volume — watch for Conway confirmation' },
  SQZ_RELEASED:     { label: '⊕ SQZ RELEASED',     color: '#bd93f9', category: 'INFO',  desc: 'Bollinger Bands expanded outside Keltner Channels — volatility expanding' },
  PREDATOR_HFT:     { label: '🦈 PREDATOR HFT',     color: '#ff8c00', category: 'INFO',  desc: 'High-frequency volume anomaly — institutional activity likely' },
  ALPHA_EXIT:       { label: '⚠ ALPHA EXIT',        color: '#ff8c00', category: 'EXIT',  desc: 'Smart money exit: vol drop + negative price-volume correlation' },
  DIVERGENCE_RISK:  { label: '⚠ DIVERGENCE RISK',  color: '#ff8c00', category: 'EXIT',  desc: 'RSI diverging from price — trend weakening, reduce exposure' },
  HIGH_CONFLUENCE:  { label: '★ HIGH CONFLUENCE',   color: '#ffd700', category: 'INFO',  desc: 'Fusion score ≥18/23 — Grade 1-2 alignment across all indicators' },
  CHoCH_BULL:       { label: 'CHoCH BULL',          color: '#39ff14', category: 'INFO',  desc: 'Change of Character bullish: first higher high after downtrend' },
  CHoCH_BEAR:       { label: 'CHoCH BEAR',          color: '#ff0062', category: 'INFO',  desc: 'Change of Character bearish: first lower low after uptrend' },
  BOS_BULL:         { label: 'BOS BULL',            color: '#39ff14', category: 'INFO',  desc: 'Break of Structure bullish: continuation higher high confirmed' },
  BOS_BEAR:         { label: 'BOS BEAR',            color: '#ff0062', category: 'INFO',  desc: 'Break of Structure bearish: continuation lower low confirmed' },
  OB_TOUCH_BULL:    { label: 'OB TOUCH BULL',       color: '#00c3ff', category: 'INFO',  desc: 'Price touching bullish order block — potential demand zone reaction' },
  OB_TOUCH_BEAR:    { label: 'OB TOUCH BEAR',       color: '#ff0062', category: 'INFO',  desc: 'Price touching bearish order block — potential supply zone reaction' },
  BBP_ENTRY_BUY:    { label: 'BBP ENTRY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'BBP crossover entry — Tier B (cells≥5) or Tier C (cells<5)' },
  BBP_ENTRY_SELL:   { label: 'BBP ENTRY SELL',      color: '#ff0062', category: 'INFO',  desc: 'BBP crossunder — LONG-only system treats as exit signal only' },
  LH_EXIT:          { label: '⚠ LH EXIT',           color: '#bd93f9', category: 'EXIT',  desc: 'Lower High formed + Conway weakening — early warning, consider closing' },
  LONDON_OPEN:      { label: '🇬🇧 LONDON OPEN',      color: '#39ff14', category: 'INFO',  desc: 'London session started — prime liquidity window' },
  NEW_YORK_OPEN:    { label: '🗽 NEW YORK OPEN',     color: '#00c3ff', category: 'INFO',  desc: 'New York session started — highest volume window' },
  BBP_CROSSOVER:    { label: 'BBP CROSSOVER',       color: '#39ff14', category: 'INFO',  desc: 'Raw BBP crossover without full gate — watch for confirmation' },
  BBP_CROSSUNDER:   { label: 'BBP CROSSUNDER',      color: '#ff0062', category: 'INFO',  desc: 'Raw BBP crossunder — potential exit signal' },
}

// ─── Tier display helpers ─────────────────────────────────────
export const TIER_META: Record<Tier, {
  color:   string
  label:   string
  riskPct: number
  wrEst:   number
}> = {
  S: { color: '#39ff14', label: 'Tier S', riskPct: 3.0, wrEst: 87 },
  A: { color: '#00c3ff', label: 'Tier A', riskPct: 2.0, wrEst: 83 },
  B: { color: '#ffd700', label: 'Tier B', riskPct: 1.0, wrEst: 79 },
  C: { color: '#ff8c00', label: 'Tier C', riskPct: 0.5, wrEst: 60 },
}
