'use client'

import { useRef, useState } from 'react'
import { useWS, type SignalPayload } from './WebSocketProvider'
import { PINE_ASSETS, formatPrice, type AssetClass } from '@/lib/assetRegistry'
import type { Tier } from '@/lib/useWebSocket'

// ─────────────────────────────────────────────────────────────
//  LiveTickerTape — dashboard version
//  Sources: PINE_ASSETS (24 locked) for display
//  Updates: via WS assetStates from provider
//  Added: tier badge per ticker
// ─────────────────────────────────────────────────────────────

const TIER_COLOR: Record<NonNullable<Tier>, string> = {
  S: '#39ff14', A: '#00c3ff', B: '#ffd700', C: '#ff8c00',
}

const CLASS_COLOR: Record<AssetClass, string> = {
  CRYPTO:    '#bd93f9',
  FOREX:     '#00c3ff',
  COMMODITY: '#ffd700',
  IDX:       '#ff8c00',
  USA:       '#39ff14',
}

function fmt(n: number, decimals = 2) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
  return n.toFixed(Math.max(decimals, n < 1 ? 4 : 2))
}

export default function LiveTickerTape({ onTickerClick }: { onTickerClick?: (symbol: string) => void }) {
  const { assetStates, connected } = useWS()
  const [paused, setPaused] = useState(false)

  // Build display items from PINE_ASSETS + assetStates
  const items = PINE_ASSETS.map(a => {
    const state = assetStates[a.ticker]
    return {
      symbol:      a.ticker,
      name:        a.name,
      assetClass:  a.assetClass,
      price:       state?.lastClose ?? null,
      tier:        state?.tier ?? null,
      cells:       state?.cells ?? 0,
      conwayState: state?.conwayState ?? 'dormant',
      lastSignal:  state?.lastSignal ?? null,
    }
  })

  // Double for seamless scroll
  const doubled = [...items, ...items]

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position:   'relative',
        height:     40,
        overflow:   'hidden',
        background: 'linear-gradient(90deg, #04070f 0%, #0a1020 10%, #0a1020 90%, #04070f 100%)',
        borderBottom: '1px solid #162035',
        display:    'flex',
        alignItems: 'center',
        zIndex:     50,
      }}
    >
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg,#04070f,transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg,#04070f,transparent)', zIndex: 2, pointerEvents: 'none' }} />

      {/* Live indicator */}
      <div style={{ position: 'absolute', left: 12, display: 'flex', alignItems: 'center', gap: 5, zIndex: 3 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: connected ? '#39ff14' : '#ff0062',
          boxShadow:  connected ? '0 0 8px #39ff14' : '0 0 8px #ff0062',
          display: 'inline-block', animation: 'pipPulse 1.5s infinite',
        }} />
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#39ff14', letterSpacing: 2, opacity: 0.7 }}>
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        0,
        whiteSpace: 'nowrap',
        animation:  paused ? 'none' : 'tickerScroll 80s linear infinite',
        willChange: 'transform',
        paddingLeft: 100,
      }}>
        {doubled.map((t, i) => {
          const hasSignal   = !!t.lastSignal
          const isUp        = t.conwayState === 'born' || t.conwayState === 'alive'
          const conwayColor =
            t.conwayState === 'born'    ? '#39ff14' :
            t.conwayState === 'alive'   ? '#00c3ff' :
            t.conwayState === 'died'    ? '#ff0062' : '#4a6080'

          return (
            <div
              key={i}
              onClick={() => onTickerClick?.(t.symbol)}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        8,
                padding:    '0 20px',
                height:     40,
                cursor:     onTickerClick ? 'pointer' : 'default',
                borderRight: '1px solid #162035',
                transition:  'background 0.15s',
              }}
              onMouseEnter={e => { if (onTickerClick) e.currentTarget.style.background = 'rgba(0,195,255,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {/* Ticker + asset class dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: CLASS_COLOR[t.assetClass],
                  opacity: 0.7,
                  display: 'inline-block',
                }} />
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: '#eef4fc' }}>
                  {t.symbol}
                </span>
              </div>

              {/* Price */}
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 10, color: '#8aa0b8' }}>
                {t.price !== null ? formatPrice(t.price, t.symbol) : '—'}
              </span>

              {/* Conway state indicator */}
              <span style={{
                fontSize: 9, padding: '1px 6px',
                color:   conwayColor,
                border:  `1px solid ${conwayColor}40`,
                background: `${conwayColor}10`,
                letterSpacing: 1,
              }}>
                {t.cells}/8
              </span>

              {/* Tier badge — only when signal has fired */}
              {t.tier && (
                <span style={{
                  fontSize: 8, padding: '1px 5px', fontWeight: 700, letterSpacing: 1,
                  color:   TIER_COLOR[t.tier],
                  border:  `1px solid ${TIER_COLOR[t.tier]}60`,
                  background: `${TIER_COLOR[t.tier]}10`,
                }}>
                  {t.tier}
                </span>
              )}

              {/* Signal label */}
              {hasSignal && (
                <span style={{ fontSize: 9, color: isUp ? '#39ff14' : '#ff0062', letterSpacing: 0.5 }}>
                  {t.lastSignal?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
