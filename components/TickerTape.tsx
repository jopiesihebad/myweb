'use client'

import { useEffect, useState } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import type { SignalPayload, Tier } from '@/lib/useWebSocket'
import { PINE_ASSETS, formatPrice } from '@/lib/assetRegistry'

type TickerItem = {
  sym:   string
  price: string
  chg:   string
  up:    boolean
  state: string
  cells: number
  tier:  Tier | null
}

// Tier badge colors
const TIER_COLOR: Record<NonNullable<Tier>, string> = {
  S: '#39ff14',
  A: '#00c3ff',
  B: '#ffd700',
  C: '#ff8c00',
}

const STATE_STYLE: Record<string, React.CSSProperties> = {
  born:    { background: 'rgba(57,255,20,0.12)',  color: '#39ff14', border: '1px solid rgba(57,255,20,0.25)'  },
  alive:   { background: 'rgba(0,195,255,0.12)',  color: '#00c3ff', border: '1px solid rgba(0,195,255,0.25)'  },
  dormant: { background: 'rgba(90,112,144,0.12)', color: '#5a7090', border: '1px solid #1e2e4a'               },
  died:    { background: 'rgba(255,0,98,0.12)',   color: '#ff0062', border: '1px solid rgba(255,0,98,0.25)'   },
}

function deriveState(payload: SignalPayload, current: string): string {
  const t = payload.alert_type
  if (t === 'CONWAY_BORN')                                          return 'born'
  if (t === 'CONWAY_BUY' || t === 'GOLD_BUY' || t === 'PM_BUY')   return 'alive'
  if (t === 'CONWAY_DIED' || t === 'ALPHA_EXIT' || t === 'LH_EXIT') return 'died'
  if (t === 'CONWAY_SELL' || t === 'DOOM_SELL')                     return 'dormant'
  return current
}

function stateLabel(state: string, cells: number): string {
  const suffix =
    state === 'born'    ? ' BORN 🟢' :
    state === 'alive'   ? ' ALIVE ✦' :
    state === 'died'    ? ' DIED 🔴' :
    ' DORMANT ○'
  return `${cells}/8${suffix}`
}

// Build initial tickers from PINE_ASSETS (24 locked)
const INITIAL_TICKERS: TickerItem[] = PINE_ASSETS.map(a => ({
  sym:   a.ticker,
  price: '—',
  chg:   '—',
  up:    false,
  state: 'dormant',
  cells: 0,
  tier:  null,
}))

export default function TickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS)
  const { subscribe } = useWsSignal()

  useEffect(() => {
    return subscribe((payload: SignalPayload) => {
      setTickers(prev => prev.map(t => {
        if (t.sym !== payload.ticker) return t
        const newState = deriveState(payload, t.state)
        const asset    = PINE_ASSETS.find(a => a.ticker === payload.ticker)
        return {
          ...t,
          price: formatPrice(payload.close, payload.ticker),
          up:    payload.alert_type.includes('BUY') ||
                 payload.alert_type.includes('BULL') ||
                 payload.alert_type === 'BREAKOUT',
          state: newState,
          cells: payload.cells,
          tier:  payload.tier,
        }
      }))
    })
  }, [subscribe])

  const ALL = [...tickers, ...tickers]

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      background: 'rgba(10,16,32,0.95)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden', padding: '11px 0',
    }}>
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(90deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(-90deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div className="ticker-track">
        {ALL.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 24px', fontSize: '11px', whiteSpace: 'nowrap',
            borderRight: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--white)', fontWeight: 700, letterSpacing: '0.5px' }}>{t.sym}</span>
            <span style={{ color: 'var(--gray)', fontFamily: 'Space Mono,monospace' }}>{t.price}</span>
            <span style={{ color: t.up ? '#39ff14' : '#ff0062' }}>{t.chg}</span>
            {/* Conway state badge */}
            <span style={{ fontSize: '9px', padding: '2px 7px', letterSpacing: '1px', ...STATE_STYLE[t.state] }}>
              {stateLabel(t.state, t.cells)}
            </span>
            {/* Tier badge — only shown when signal has fired */}
            {t.tier && (
              <span style={{
                fontSize: '8px', padding: '2px 6px', letterSpacing: '1px',
                border: `1px solid ${TIER_COLOR[t.tier]}60`,
                color: TIER_COLOR[t.tier],
                background: `${TIER_COLOR[t.tier]}10`,
                fontWeight: 700,
              }}>
                {t.tier}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
