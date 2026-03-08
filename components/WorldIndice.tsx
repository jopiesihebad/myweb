'use client'

import { useEffect, useState } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import type { SignalPayload } from '@/lib/useWebSocket'

type IndexItem = {
  sym: string; name: string; price: string; chg: string; chgPct: string; up: boolean; session: string
}

const INITIAL: IndexItem[] = [
  { sym: 'SPX500',  name: 'S&P 500',      price: '5,791.23', chg: '+12.4',  chgPct: '+0.21%', up: true,  session: 'NEW YORK' },
  { sym: 'NQ100',   name: 'Nasdaq 100',   price: '21,843.00',chg: '−96.8',  chgPct: '−0.44%', up: false, session: 'NEW YORK' },
  { sym: 'XAUUSD',  name: 'Gold Spot',    price: '2,912.40', chg: '+23.6',  chgPct: '+0.82%', up: true,  session: 'LONDON'   },
  { sym: 'BTCUSDT', name: 'Bitcoin',      price: '66,491.94',chg: '−101.4', chgPct: '−0.15%', up: false, session: 'CRYPTO'   },
  { sym: 'EURUSD',  name: 'EUR/USD',      price: '1.0834',   chg: '+0.002', chgPct: '+0.21%', up: true,  session: 'LONDON'   },
  { sym: 'USDJPY',  name: 'USD/JPY',      price: '149.82',   chg: '−0.50',  chgPct: '−0.33%', up: false, session: 'TOKYO'    },
  { sym: 'BBCA.JK', name: 'BBCA IDX',    price: '9,650',    chg: '+100',   chgPct: '+1.05%', up: true,  session: 'IDX'      },
  { sym: 'DXY',     name: 'Dollar Index', price: '104.82',   chg: '+0.24',  chgPct: '+0.23%', up: true,  session: 'GLOBAL'   },
]

export default function WorldIndices() {
  const [indices, setIndices] = useState<IndexItem[]>(INITIAL)
  const { subscribe } = useWsSignal()

  useEffect(() => {
    return subscribe((payload: SignalPayload) => {
      setIndices(prev => prev.map(idx => {
        if (idx.sym !== payload.ticker) return idx
        return {
          ...idx,
          price: payload.close.toLocaleString('en-US', { maximumFractionDigits: 2 }),
          up:    payload.alert_type.includes('BUY') || payload.alert_type.includes('BULL') || payload.alert_type === 'BREAKOUT',
        }
      }))
    })
  }, [subscribe])

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="ldot" /> World Indices — Live
        </div>
        <span style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px' }}>Updates via WebSocket</span>
      </div>
      {indices.map(idx => (
        <div key={idx.sym}
          style={{ display: 'grid', gridTemplateColumns: '110px 1fr 110px 80px 70px', padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center', transition: 'background 0.15s', cursor: 'default' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,195,255,0.02)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--white)' }}>{idx.sym}</span>
          <span style={{ fontSize: '10px', color: 'var(--gray)' }}>{idx.name}</span>
          <span style={{ fontFamily: 'Space Mono,monospace', fontSize: '11px', color: 'var(--white)', textAlign: 'right' }}>{idx.price}</span>
          <span style={{ fontSize: '10px', color: idx.up ? '#39ff14' : '#ff0062', textAlign: 'right', fontFamily: 'Space Mono,monospace' }}>{idx.chg}</span>
          <span style={{ fontSize: '9px', color: idx.up ? '#39ff14' : '#ff0062', textAlign: 'right', fontWeight: 700 }}>{idx.chgPct}</span>
        </div>
      ))}
    </div>
  )
}
