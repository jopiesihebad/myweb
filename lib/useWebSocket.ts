'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export type SignalPayload = {
  ticker:       string
  close:        number
  confluence:   number
  grade:        number
  cells:        number
  session:      string
  filter_mode:  string
  atr:          number
  sl_price:     number
  tp_price:     number
  timestamp:    string
  alert_type:   AlertType
  message:      string
}

export type AlertType =
  | 'GOLD_BUY'        | 'DOOM_SELL'        | 'CONWAY_BUY'     | 'CONWAY_SELL'
  | 'CONWAY_BORN'     | 'CONWAY_DIED'      | 'PM_BUY'         | 'PM_SELL'
  | 'BULLISH_LIQ_GRAB'| 'BEARISH_LIQ_GRAB'| 'BREAKOUT'       | 'SQZ_RELEASED'
  | 'PREDATOR_HFT'    | 'ALPHA_EXIT'       | 'DIVERGENCE_RISK'| 'HIGH_CONFLUENCE'
  | 'CHoCH_BULL'      | 'CHoCH_BEAR'       | 'BOS_BULL'       | 'BOS_BEAR'
  | 'OB_TOUCH_BULL'   | 'OB_TOUCH_BEAR'   | 'BBP_ENTRY_BUY'  | 'BBP_ENTRY_SELL'
  | 'LH_EXIT'

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  onSignal?: (payload: SignalPayload) => void
  reconnectDelay?: number
}

export function useWebSocket({ onSignal, reconnectDelay = 5000 }: UseWebSocketOptions = {}) {
  const ws       = useRef<WebSocket | null>(null)
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted  = useRef(true)
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

/* ─── Alert type → display helpers ─── */
export const ALERT_META: Record<AlertType, { label: string; color: string; category: 'ENTRY'|'EXIT'|'INFO' }> = {
  GOLD_BUY:         { label: '⚡ GOLD BUY',         color: '#ffd700', category: 'ENTRY' },
  DOOM_SELL:        { label: '⚡ DOOM SELL',         color: '#ff0062', category: 'ENTRY' },
  CONWAY_BUY:       { label: '⚡ CONWAY BUY',        color: '#39ff14', category: 'ENTRY' },
  CONWAY_SELL:      { label: '⚡ CONWAY SELL',       color: '#ff0062', category: 'ENTRY' },
  CONWAY_BORN:      { label: '🟢 CONWAY BORN',       color: '#39ff14', category: 'INFO'  },
  CONWAY_DIED:      { label: '🔴 CONWAY DIED',       color: '#ff0062', category: 'EXIT'  },
  PM_BUY:           { label: 'PM BUY',               color: '#00c3ff', category: 'ENTRY' },
  PM_SELL:          { label: 'PM SELL',              color: '#ff8c00', category: 'ENTRY' },
  BULLISH_LIQ_GRAB: { label: '💧 LIQ GRAB BULL',    color: '#39ff14', category: 'INFO'  },
  BEARISH_LIQ_GRAB: { label: '💧 LIQ GRAB BEAR',    color: '#ff0062', category: 'INFO'  },
  BREAKOUT:         { label: '🚀 BREAKOUT',           color: '#00c3ff', category: 'ENTRY' },
  SQZ_RELEASED:     { label: '⊕ SQZ RELEASED',      color: '#bd93f9', category: 'INFO'  },
  PREDATOR_HFT:     { label: '🦈 PREDATOR HFT',      color: '#ff8c00', category: 'INFO'  },
  ALPHA_EXIT:       { label: '⚠ ALPHA EXIT',         color: '#ff8c00', category: 'EXIT'  },
  DIVERGENCE_RISK:  { label: '⚠ DIVERGENCE RISK',   color: '#ff8c00', category: 'EXIT'  },
  HIGH_CONFLUENCE:  { label: '★ HIGH CONFLUENCE',    color: '#ffd700', category: 'INFO'  },
  CHoCH_BULL:       { label: 'CHoCH BULL',           color: '#39ff14', category: 'INFO'  },
  CHoCH_BEAR:       { label: 'CHoCH BEAR',           color: '#ff0062', category: 'INFO'  },
  BOS_BULL:         { label: 'BOS BULL',             color: '#39ff14', category: 'INFO'  },
  BOS_BEAR:         { label: 'BOS BEAR',             color: '#ff0062', category: 'INFO'  },
  OB_TOUCH_BULL:    { label: 'OB TOUCH BULL',        color: '#00c3ff', category: 'INFO'  },
  OB_TOUCH_BEAR:    { label: 'OB TOUCH BEAR',        color: '#ff0062', category: 'INFO'  },
  BBP_ENTRY_BUY:    { label: 'BBP ENTRY BUY',        color: '#39ff14', category: 'ENTRY' },
  BBP_ENTRY_SELL:   { label: 'BBP ENTRY SELL',       color: '#ff0062', category: 'ENTRY' },
  LH_EXIT:          { label: 'LH EXIT',              color: '#bd93f9', category: 'EXIT'  },
}
