'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  WorldIndices — dashboard version
//  Static macro indices (not part of Pine Script 24 assets)
//  Provides broader market context only
// ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1000)  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toFixed(2)
}

type IndexItem = {
  symbol:    string
  name:      string
  value:     number
  change:    number
  changePct: number
}

const INDEX_META: Record<string, { flag: string; region: string; color: string }> = {
  SPX:    { flag: '🇺🇸', region: 'US',     color: '#00c3ff' },
  NDX:    { flag: '🇺🇸', region: 'US',     color: '#bd93f9' },
  DXY:    { flag: '🌐',  region: 'GLOBAL', color: '#ffd700' },
  VIX:    { flag: '📊',  region: 'GLOBAL', color: '#ff8c00' },
  JKSE:   { flag: '🇮🇩', region: 'IDX',    color: '#39ff14' },
  NI225:  { flag: '🇯🇵', region: 'ASIA',   color: '#ff8c00' },
  DAX:    { flag: '🇩🇪', region: 'EU',     color: '#ffd700' },
  HSI:    { flag: '🇭🇰', region: 'ASIA',   color: '#ff44cc' },
}

const INITIAL: IndexItem[] = [
  { symbol: 'SPX',   name: 'S&P 500',       value: 5791.23,  change: 12.4,   changePct: 0.21  },
  { symbol: 'NDX',   name: 'Nasdaq 100',    value: 21843.00, change: -96.8,  changePct: -0.44 },
  { symbol: 'DXY',   name: 'Dollar Index',  value: 104.82,   change: 0.24,   changePct: 0.23  },
  { symbol: 'VIX',   name: 'Volatility',    value: 18.43,    change: -1.12,  changePct: -5.73 },
  { symbol: 'JKSE',  name: 'IDX Composite', value: 6841.20,  change: 42.3,   changePct: 0.62  },
  { symbol: 'NI225', name: 'Nikkei 225',    value: 38921.00, change: -134.6, changePct: -0.34 },
  { symbol: 'DAX',   name: 'DAX 40',        value: 22104.50, change: 88.1,   changePct: 0.40  },
  { symbol: 'HSI',   name: 'Hang Seng',     value: 23441.00, change: 201.4,  changePct: 0.87  },
]

export default function WorldIndices() {
  const [indices]  = useState<IndexItem[]>(INITIAL)
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section style={{ padding: '0 0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#00c3ff,#bd93f9)', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Macro Indices
          </span>
        </div>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#4a6080', letterSpacing: 2 }}>
          Context only
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {indices.map(idx => {
          const meta = INDEX_META[idx.symbol] || { flag: '🌐', region: '', color: '#00c3ff' }
          const isUp  = idx.changePct >= 0
          const isHov = hovered === idx.symbol

          return (
            <div
              key={idx.symbol}
              onMouseEnter={() => setHovered(idx.symbol)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background:  isHov ? '#0d1830' : '#0a1020',
                border:      `1px solid ${isHov ? meta.color + '60' : '#162035'}`,
                borderRadius: 8,
                padding:     '10px 12px',
                cursor:      'default',
                transition:  'all 0.2s',
                boxShadow:   isHov ? `0 0 16px ${meta.color}25` : 'none',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12 }}>{meta.flag}</span>
                    <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: meta.color, letterSpacing: 1.5, fontWeight: 700 }}>
                      {idx.symbol}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: '#4a6080', marginTop: 2 }}>
                    {idx.name}
                  </div>
                </div>
                <div style={{
                  background:   isUp ? '#39ff1415' : '#ff006215',
                  border:       `1px solid ${isUp ? '#39ff1440' : '#ff006240'}`,
                  borderRadius: 4, padding: '2px 5px',
                  fontFamily:   'JetBrains Mono,monospace', fontSize: 9,
                  color:        isUp ? '#39ff14' : '#ff0062', fontWeight: 700,
                }}>
                  {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                </div>
              </div>

              {/* Value */}
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 15, fontWeight: 700, color: '#e8f4f8', letterSpacing: -0.5, lineHeight: 1, marginBottom: 4 }}>
                {fmt(idx.value)}
              </div>

              {/* Change */}
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: isUp ? '#39ff14cc' : '#ff0062cc', display: 'flex', gap: 3 }}>
                <span>{isUp ? '▲' : '▼'}</span>
                <span>{isUp ? '+' : ''}{fmt(idx.change)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
