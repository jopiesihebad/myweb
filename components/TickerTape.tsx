'use client'

import { useEffect, useState } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import type { SignalPayload } from '@/lib/useWebSocket'

type TickerItem = {
  sym: string; price: string; chg: string; up: boolean; state: string; label: string
}

const INITIAL_TICKERS: TickerItem[] = [
  { sym: 'BTCUSDT',  price: '66,491.94', chg: '▼ −0.15%', up: false, state: 'dormant', label: '2/8 DORMANT'  },
  { sym: 'XAUUSD',   price: '2,912.40',  chg: '▲ +0.82%', up: true,  state: 'alive',   label: '6/8 ALIVE'    },
  { sym: 'EURUSD',   price: '1.0834',    chg: '▲ +0.21%', up: true,  state: 'born',    label: '5/8 BORN 🟢'  },
  { sym: 'NQ100',    price: '21,843.00', chg: '▼ −0.44%', up: false, state: 'dormant', label: '3/8 DORMANT'  },
  { sym: 'BBCA.JK',  price: '9,650',     chg: '▲ +1.05%', up: true,  state: 'born',    label: '7/8 BORN 🟢'  },
  { sym: 'ETHUSDT',  price: '3,241.50',  chg: '▲ +1.10%', up: true,  state: 'alive',   label: '5/8 ALIVE'    },
  { sym: 'SPX500',   price: '5,791.23',  chg: '▼ −0.08%', up: false, state: 'died',    label: '4/8 DIED 🔴'  },
  { sym: 'TLKM.JK',  price: '3,420',     chg: '▼ −0.58%', up: false, state: 'dormant', label: '3/8 DORMANT'  },
  { sym: 'GBPUSD',   price: '1.2641',    chg: '▲ +0.14%', up: true,  state: 'born',    label: '5/8 BORN 🟢'  },
  { sym: 'USDJPY',   price: '149.82',    chg: '▼ −0.33%', up: false, state: 'dormant', label: '2/8 DORMANT'  },
]

const STATE_STYLE: Record<string, React.CSSProperties> = {
  born:    { background: 'rgba(57,255,20,0.12)',  color: '#39ff14', border: '1px solid rgba(57,255,20,0.25)'  },
  alive:   { background: 'rgba(0,195,255,0.12)',  color: '#00c3ff', border: '1px solid rgba(0,195,255,0.25)'  },
  dormant: { background: 'rgba(90,112,144,0.12)', color: '#5a7090', border: '1px solid #1e2e4a'               },
  died:    { background: 'rgba(255,0,98,0.12)',   color: '#ff0062', border: '1px solid rgba(255,0,98,0.25)'   },
}

function deriveState(payload: SignalPayload, current: string): string {
  const t = payload.alert_type
  if (t === 'CONWAY_BORN' || t === 'CONWAY_BUY' || t === 'GOLD_BUY' || t === 'BBP_ENTRY_BUY' || t === 'PM_BUY' || t === 'BREAKOUT') return 'born'
  if (t === 'CONWAY_DIED' || t === 'DOOM_SELL'  || t === 'ALPHA_EXIT' || t === 'LH_EXIT')                                             return 'died'
  if (t === 'CONWAY_SELL' || t === 'BBP_ENTRY_SELL' || t === 'PM_SELL')                                                               return 'dormant'
  return current
}

export default function TickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS)
  const { subscribe } = useWsSignal()

  useEffect(() => {
    return subscribe((payload: SignalPayload) => {
      setTickers(prev => prev.map(t => {
        if (t.sym !== payload.ticker) return t
        const newState = deriveState(payload, t.state)
        const cells = payload.cells ?? parseInt(t.label)
        const stateLabel = newState.toUpperCase() + (newState === 'born' ? ' 🟢' : newState === 'died' ? ' 🔴' : '')
        return {
          ...t,
          price: payload.close.toLocaleString('en-US', { maximumFractionDigits: 2 }),
          up:    payload.alert_type.includes('BUY') || payload.alert_type.includes('BULL') || payload.alert_type === 'BREAKOUT',
          state: newState,
          label: `${cells}/8 ${stateLabel}`,
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
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(90deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(-90deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div className="ticker-track">
        {ALL.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '0 28px', fontSize: '11px', whiteSpace: 'nowrap',
            borderRight: '1px solid var(--border)',
          }}>
            <span style={{ color: 'var(--white)', fontWeight: 700, letterSpacing: '0.5px' }}>{t.sym}</span>
            <span style={{ color: 'var(--gray)', fontFamily: 'Space Mono,monospace' }}>{t.price}</span>
            <span style={{ color: t.up ? '#39ff14' : '#ff0062' }}>{t.chg}</span>
            <span style={{ fontSize: '9px', padding: '2px 7px', letterSpacing: '1px', ...STATE_STYLE[t.state] }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
