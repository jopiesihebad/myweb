'use client'

import { useState, useEffect } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import { ALERT_META, type SignalPayload } from '@/lib/useWebSocket'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const DEFAULT: SignalPayload = {
  ticker: 'XAUUSD', close: 2912.40, confluence: 17, grade: 2, cells: 6,
  session: 'LONDON', filter_mode: 'BBP High Precision', atr: 14.8,
  sl_price: 2891.20, tp_price: 2954.80, timestamp: new Date().toISOString(),
  alert_type: 'CONWAY_BUY',
  message: '⚡ CONWAY BUY | XAUUSD @ 2912.40 | Conway 6/8 | Confluence 17/23 | Grade 2 | Session LONDON',
}

export default function SignalExplanation() {
  const [latest, setLatest] = useState<SignalPayload>(DEFAULT)
  const [flash,  setFlash]  = useState(false)
  const { subscribe } = useWsSignal()

  useEffect(() => {
    return subscribe(payload => {
      setLatest(payload)
      setFlash(true)
      setTimeout(() => setFlash(false), 1200)
    })
  }, [subscribe])

  const meta = ALERT_META[latest.alert_type] ?? { label: latest.alert_type, color: '#5a7090', category: 'INFO' }
  const rr   = latest.sl_price && latest.close
    ? Math.abs((latest.tp_price - latest.close) / (latest.close - latest.sl_price)).toFixed(1)
    : '—'

  const catVariant = meta.category === 'ENTRY' ? 'lime' : meta.category === 'EXIT' ? 'red' : 'purple'

  return (
    <Card
      accent="cyan"
      hoverable
      className={cn(flash && 'border-cyan/60 shadow-[0_0_20px_rgba(0,195,255,0.12)]')}
    >
      <CardHeader>
        <div className="flex justify-between items-start mb-1">
          <CardTitle>Signal Explanation</CardTitle>
          <div className="flex items-center gap-2">
            <div className="ldot" />
            <Badge variant="outline">LIVE</Badge>
          </div>
        </div>
        <p className="text-[10px] tracking-wide" style={{ color: 'var(--gray)' }}>
          Decoding the latest signal in real-time from pieBot
        </p>
      </CardHeader>

      {/* Signal type banner */}
      <div
        className="px-4 py-3 mb-4"
        style={{ background: `${meta.color}11`, border: `1px solid ${meta.color}33` }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-syne text-[15px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          <Badge variant={catVariant}>{meta.category}</Badge>
        </div>
        <span className="text-[10px] mt-1 block" style={{ color: 'var(--gray)' }}>
          {latest.ticker} @ {latest.close.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { l: 'Session',     v: latest.session,                            c: 'var(--gold)'  },
          { l: 'Filter Mode', v: latest.filter_mode,                        c: 'var(--gray)'  },
          { l: 'Conway Cells',v: `${latest.cells} / 8`,                     c: latest.cells >= 5 ? '#39ff14' : '#ff8c00' },
          { l: 'Confluence',  v: `${latest.confluence} / 23`,               c: latest.confluence >= 15 ? '#39ff14' : '#ff8c00' },
          { l: 'Grade',       v: `Grade ${latest.grade}`,                   c: latest.grade <= 2 ? '#39ff14' : 'var(--gray)' },
          { l: 'ATR',         v: latest.atr.toFixed(2),                    c: 'var(--white)' },
          { l: 'Stop Loss',   v: latest.sl_price.toLocaleString('en-US'),  c: '#ff0062'      },
          { l: 'Take Profit', v: latest.tp_price.toLocaleString('en-US'),  c: '#39ff14'      },
          { l: 'R : R',       v: `1 : ${rr}`,                              c: 'var(--gold)'  },
          { l: 'Category',    v: meta.category,                             c: meta.color     },
        ].map(f => (
          <div key={f.l} className="px-3 py-2" style={{ background: 'var(--panel2)' }}>
            <div className="text-[9px] tracking-[1px] mb-[3px]" style={{ color: 'var(--gray)' }}>{f.l}</div>
            <div className="text-[11px] font-space" style={{ color: f.c }}>{f.v}</div>
          </div>
        ))}
      </div>

      <CardContent>
        <div
          className="p-[10px] text-[10px] leading-[1.7]"
          style={{ background: 'var(--panel2)', borderLeft: `3px solid ${meta.color}`, color: 'var(--gray)' }}
        >
          {latest.message}
        </div>
        <p className="mt-[10px] text-[10px]" style={{ color: 'var(--gray2)' }}>
          Received {new Date(latest.timestamp).toLocaleTimeString('en-US', { hour12: false })} UTC
        </p>
      </CardContent>
    </Card>
  )
}
