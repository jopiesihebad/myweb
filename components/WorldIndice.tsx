'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  WorldIndices — MACRO INDICES only
//  These are NOT in Pine Script (not part of 24 locked assets)
//  — they provide broader market context only.
//
//  Removed from original: XAUUSD, BTCUSDT, EURUSD, BBCA.JK
//  (all now covered by Conway Cards which get live WS updates)
// ─────────────────────────────────────────────────────────────

type IndexItem = {
  sym:    string
  name:   string
  price:  string
  chg:    string
  chgPct: string
  up:     boolean
  region: string
}

const INITIAL: IndexItem[] = [
  { sym: 'SPX500',    name: 'S&P 500',      price: '5,791.23',  chg: '+12.4',  chgPct: '+0.21%', up: true,  region: 'USA'    },
  { sym: 'NQ100',     name: 'Nasdaq 100',   price: '21,843.00', chg: '−96.8',  chgPct: '−0.44%', up: false, region: 'USA'    },
  { sym: 'DXY',       name: 'Dollar Index', price: '104.82',    chg: '+0.24',  chgPct: '+0.23%', up: true,  region: 'GLOBAL' },
  { sym: 'VIX',       name: 'Volatility',   price: '18.43',     chg: '−1.12',  chgPct: '−5.73%', up: false, region: 'GLOBAL' },
  { sym: 'IHSG',      name: 'IDX Composite',price: '6,841.20',  chg: '+42.3',  chgPct: '+0.62%', up: true,  region: 'IDX'    },
  { sym: 'N225',      name: 'Nikkei 225',   price: '38,921.00', chg: '−134.6', chgPct: '−0.34%', up: false, region: 'ASIA'   },
  { sym: 'DAX',       name: 'DAX 40',       price: '22,104.50', chg: '+88.1',  chgPct: '+0.40%', up: true,  region: 'EU'     },
  { sym: 'HSI',       name: 'Hang Seng',    price: '23,441.00', chg: '+201.4', chgPct: '+0.87%', up: true,  region: 'ASIA'   },
]

const REGION_COLOR: Record<string, string> = {
  USA:    '#00c3ff',
  GLOBAL: '#bd93f9',
  IDX:    '#ff8c00',
  ASIA:   '#ffd700',
  EU:     '#39ff14',
}

export default function WorldIndices() {
  const [indices] = useState<IndexItem[]>(INITIAL)

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--panel2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="ldot" /> MACRO INDICES
        </div>
        <span style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px' }}>Market context only</span>
      </div>

      {/* Rows */}
      {indices.map(idx => (
        <div
          key={idx.sym}
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 110px 80px 45px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
            transition: 'background 0.15s',
            cursor: 'default',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,195,255,0.02)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--white)' }}>{idx.sym}</span>
          <span style={{ fontSize: '10px', color: 'var(--gray)' }}>{idx.name}</span>
          <span style={{
            fontFamily: 'Space Mono,monospace', fontSize: '11px',
            color: 'var(--white)', textAlign: 'right',
          }}>{idx.price}</span>
          <span style={{
            fontSize: '10px', color: idx.up ? '#39ff14' : '#ff0062',
            textAlign: 'right', fontFamily: 'Space Mono,monospace',
          }}>{idx.chg}</span>
          {/* Region badge */}
          <div style={{
            fontSize: '8px', letterSpacing: '1px', textAlign: 'center',
            padding: '2px 5px',
            color: REGION_COLOR[idx.region] ?? '#5a7090',
            border: `1px solid ${REGION_COLOR[idx.region] ?? '#1e2e4a'}40`,
            background: `${REGION_COLOR[idx.region] ?? '#5a7090'}10`,
          }}>
            {idx.region}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div style={{ padding: '8px 16px', fontSize: '9px', color: '#2a3d58', letterSpacing: '1px' }}>
        Macro context · Not part of SS BlackBox signal universe
      </div>
    </div>
  )
}
