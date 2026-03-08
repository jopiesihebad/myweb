'use client'

import { useEffect, useRef, useState } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import { ALERT_META } from '@/lib/useWebSocket'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type Filter = 'ALL' | 'ENTRY' | 'EXIT' | 'INFO'

type SigRow = {
  id:        number
  time:      string
  typeLabel: string
  typeColor: string
  category:  string
  sym:       string
  price:     string
  sess:      string
  desc:      string
  pnl:       string
  pnlUp:     boolean | null
  isNew:     boolean
}

const SIMULATED: Omit<SigRow, 'id' | 'time' | 'isNew'>[] = [
  { typeLabel: '⚡ CONWAY BUY',  typeColor: '#39ff14', category: 'ENTRY', sym: 'EURUSD',    price: '1.0834',     sess: 'LONDON',   desc: 'BORN · 5/8 cells · Grade 1 · BBP↑ — fresh momentum confirmed',          pnl: '+0',    pnlUp: null  },
  { typeLabel: '★ HIGH CONFL.',  typeColor: '#ffd700', category: 'INFO',  sym: 'XAUUSD',    price: '2,912.40',   sess: 'LONDON',   desc: 'Fusion 21/23 — maximum alignment · all major filters passed',            pnl: '+0',    pnlUp: null  },
  { typeLabel: '⚡ DOOM SELL',   typeColor: '#ff0062', category: 'ENTRY', sym: 'BTCUSDT',   price: '67,174.06',  sess: 'ASIA',     desc: 'BBP Crossunder · VWAP+RSI confirmed · Conway DIED',                      pnl: '+2.1%', pnlUp: true  },
  { typeLabel: '⚠ ALPHA EXIT',  typeColor: '#ff8c00', category: 'EXIT',  sym: 'BTCUSDT',   price: '67,890.00',  sess: 'ASIA',     desc: 'Divergence + momentum loss · reduce exposure now',                       pnl: '—',     pnlUp: null  },
  { typeLabel: '🔴 CONWAY DIED', typeColor: '#ff0062', category: 'EXIT',  sym: 'NQ100',     price: '21,910.00',  sess: 'NEW YORK', desc: 'Cells dropped 5→3 · momentum fading · close or trail stop',             pnl: '−0.8%', pnlUp: false },
  { typeLabel: '⚡ CONWAY BUY',  typeColor: '#39ff14', category: 'ENTRY', sym: 'BBCA.JK',   price: '9,650',      sess: 'IDX',      desc: 'BORN · 7/8 cells · Grade 1 · Ownership cluster detected',               pnl: '+0',    pnlUp: null  },
  { typeLabel: 'CHoCH BULL',     typeColor: '#39ff14', category: 'INFO',  sym: 'EURUSD',    price: '1.0812',     sess: 'PRE-LON',  desc: 'Change of Character confirmed · upside bias active · BOS expected',     pnl: '—',     pnlUp: null  },
  { typeLabel: '⊕ SQZ RELEASED',typeColor: '#bd93f9', category: 'INFO',  sym: 'XAUUSD',    price: '2,891.20',   sess: 'PRE-LON',  desc: 'BB expanded outside KC · volatility expanding · watch for breakout',   pnl: '—',     pnlUp: null  },
  { typeLabel: 'BBP ENTRY BUY',  typeColor: '#39ff14', category: 'ENTRY', sym: 'GBPUSD',    price: '1.2641',     sess: 'LONDON',   desc: 'BBP cross without Conway · Grade 3 signal · manage risk accordingly',   pnl: '+0',    pnlUp: null  },
  { typeLabel: 'OB TOUCH BULL',  typeColor: '#00c3ff', category: 'INFO',  sym: 'ETHUSDT',   price: '3,241.50',   sess: 'ASIA',     desc: 'Bullish OB reaction zone · watch for entry on next bar confirmation',   pnl: '—',     pnlUp: null  },
]

const INITIAL_ROWS: SigRow[] = [
  { id: 1,  time: '17:14:23', typeLabel: '⚡ CONWAY BUY',   typeColor: '#39ff14', category: 'ENTRY', sym: 'EURUSD',    price: '1.0834',    sess: 'LONDON',   desc: 'BORN · 5/8 cells · Grade 1 · BBP↑ — fresh momentum confirmed',        pnl: '+0',    pnlUp: null,  isNew: false },
  { id: 2,  time: '17:02:11', typeLabel: '★ HIGH CONFL.',   typeColor: '#ffd700', category: 'INFO',  sym: 'XAUUSD',    price: '2,912.40',  sess: 'LONDON',   desc: 'Fusion 21/23 — maximum alignment · all major filters passed',          pnl: '—',     pnlUp: null,  isNew: false },
  { id: 3,  time: '16:58:01', typeLabel: '🟢 CONWAY BORN',  typeColor: '#39ff14', category: 'INFO',  sym: 'XAUUSD',    price: '2,891.20',  sess: 'LONDON',   desc: 'State: DORMANT→BORN · 6/8 cells live · Fusion 17/23',                  pnl: '—',     pnlUp: null,  isNew: false },
  { id: 4,  time: '16:30:00', typeLabel: '🇬🇧 LONDON',      typeColor: '#00c3ff', category: 'INFO',  sym: 'ALL PAIRS', price: '—',         sess: 'OPEN',     desc: 'London session open — prime signal window started (16:00–19:00 UTC)',   pnl: '—',     pnlUp: null,  isNew: false },
  { id: 5,  time: '15:44:12', typeLabel: 'BOS BULL',         typeColor: '#39ff14', category: 'INFO',  sym: 'EURUSD',    price: '1.0812',    sess: 'PRE-LON',  desc: 'Break of Structure confirmed · higher high printed · upside bias',      pnl: '—',     pnlUp: null,  isNew: false },
  { id: 6,  time: '14:00:11', typeLabel: '⚡ DOOM SELL',    typeColor: '#ff0062', category: 'ENTRY', sym: 'BTCUSDT',   price: '67,174.06', sess: 'ASIA',     desc: 'BBP Crossunder · VWAP+RSI confirmed · Conway DIED · Grade 2',          pnl: '+2.1%', pnlUp: true,  isNew: false },
  { id: 7,  time: '13:15:44', typeLabel: '⚠ ALPHA EXIT',   typeColor: '#ff8c00', category: 'EXIT',  sym: 'BTCUSDT',   price: '67,890.00', sess: 'ASIA',     desc: 'Dump risk confirmed · momentum divergence · reduce exposure now',       pnl: '—',     pnlUp: null,  isNew: false },
  { id: 8,  time: '12:01:05', typeLabel: '🔴 CONWAY DIED',  typeColor: '#ff0062', category: 'EXIT',  sym: 'NQ100',     price: '21,910.00', sess: 'NEW YORK', desc: 'Cells dropped 5→3 · momentum fading · trail stop or exit',             pnl: '−0.8%', pnlUp: false, isNew: false },
  { id: 9,  time: '12:00:05', typeLabel: '🗽 NY OPEN',      typeColor: '#00c3ff', category: 'INFO',  sym: 'ALL PAIRS', price: '—',         sess: 'OPEN',     desc: 'New York session — highest volume window, widest range signals',       pnl: '—',     pnlUp: null,  isNew: false },
  { id: 10, time: '11:22:33', typeLabel: '⚡ GOLD BUY',     typeColor: '#ffd700', category: 'ENTRY', sym: 'XAUUSD',    price: '2,879.60',  sess: 'LONDON',   desc: 'GOLD BUY · Conway 6/8 · Confluence 18/23 · Grade 2 · ATR SL set',     pnl: '+1.4%', pnlUp: true,  isNew: false },
]

let idSeq = 200

function nowStr() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
}

const FILTER_TABS: { label: string; value: Filter }[] = [
  { label: 'ALL',   value: 'ALL'   },
  { label: 'ENTRY', value: 'ENTRY' },
  { label: 'EXIT',  value: 'EXIT'  },
  { label: 'INFO',  value: 'INFO'  },
]

export default function SignalFeed() {
  const [rows,   setRows]   = useState<SigRow[]>(INITIAL_ROWS)
  const [filter, setFilter] = useState<Filter>('ALL')
  const simIdx = useRef(0)

  /* ── Consume WS from global provider ── */
  const { subscribe } = useWsSignal()

  useEffect(() => {
    return subscribe(payload => {
      const meta = ALERT_META[payload.alert_type] ?? { label: payload.alert_type, color: '#5a7090', category: 'INFO' }
      const newRow: SigRow = {
        id:        ++idSeq,
        time:      nowStr(),
        typeLabel: meta.label,
        typeColor: meta.color,
        category:  meta.category,
        sym:       payload.ticker,
        price:     payload.close.toLocaleString('en-US', { maximumFractionDigits: 2 }),
        sess:      payload.session,
        desc:      payload.message,
        pnl:       '+0',
        pnlUp:     null,
        isNew:     true,
      }
      setRows(prev => [newRow, ...prev].slice(0, 25))
      setTimeout(() => {
        setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, isNew: false } : r))
      }, 3000)
    })
  }, [subscribe])

  /* ── Simulated feed every 8s ── */
  useEffect(() => {
    const id = setInterval(() => {
      const s = SIMULATED[simIdx.current % SIMULATED.length]
      simIdx.current++
      const newRow: SigRow = { ...s, id: ++idSeq, time: nowStr(), isNew: true }
      setRows(prev => [newRow, ...prev].slice(0, 25))
      setTimeout(() => {
        setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, isNew: false } : r))
      }, 3000)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const visible = filter === 'ALL' ? rows : rows.filter(r => r.category === filter)

  const countByFilter = (f: Filter) =>
    f === 'ALL' ? rows.length : rows.filter(r => r.category === f).length

  return (
    <div className="border border-border overflow-hidden" style={{ background: 'var(--panel)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between flex-wrap gap-3 px-5 py-3 border-b border-border"
        style={{ background: 'var(--panel2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="ldot" />
          <span className="text-[10px] tracking-[2px] uppercase text-white font-bold">
            Signal Stream
          </span>
          <span className="text-[9px] text-gray tracking-wide">
            — Every bar close · All assets · Live
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex items-center gap-[5px] px-[10px] py-[3px]',
                'font-mono text-[9px] tracking-[1px] uppercase transition-all duration-150',
                filter === tab.value
                  ? 'border border-cyan text-cyan'
                  : 'border border-border2 text-gray hover:border-gray hover:text-white',
              )}
            >
              {tab.label}
              <span className={cn(
                'text-[8px] px-[5px] py-[1px]',
                filter === tab.value ? 'bg-[rgba(0,195,255,0.15)] text-cyan' : 'bg-[rgba(90,112,144,0.15)] text-gray',
              )}>
                {countByFilter(tab.value)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Column headers ── */}
      <div
        className="sig-row text-[9px] tracking-[1.5px] uppercase border-b border-border"
        style={{ color: 'var(--gray2)', background: 'var(--bg2)', padding: '7px 20px' }}
      >
        <span>Time</span>
        <span>Signal</span>
        <span>Symbol</span>
        <span>Price</span>
        <span className="sig-sess">Session</span>
        <span className="sig-desc">Description</span>
        <span className="sig-pnl" style={{ textAlign: 'right' }}>P&amp;L</span>
      </div>

      {/* ── Rows ── */}
      {visible.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[11px]" style={{ color: 'var(--gray)' }}>
          No {filter} signals yet. Waiting for next bar close…
        </div>
      ) : (
        visible.map(r => (
          <div
            key={r.id}
            className={cn(
              'sig-row',
              r.isNew && 'highlight new-signal',
            )}
          >
            <span className="text-[9px] font-space" style={{ color: 'var(--gray)' }}>{r.time}</span>
            <span className="font-bold text-[10px] tracking-[0.5px]" style={{ color: r.typeColor }}>{r.typeLabel}</span>
            <span className="font-bold tracking-[0.5px] text-white">{r.sym}</span>
            <span className="text-[10px] font-space" style={{ color: 'var(--gray)' }}>{r.price}</span>
            <span className="sig-sess text-[9px] px-[7px] py-[2px]" style={{ color: 'var(--gold)', border: '1px solid rgba(255,215,0,0.2)' }}>{r.sess}</span>
            <span className="sig-desc text-[10px]" style={{ color: 'var(--gray2)' }}>{r.desc}</span>
            <span
              className="sig-pnl text-[10px] font-space"
              style={{
                textAlign: 'right',
                color: r.pnlUp === true ? '#39ff14' : r.pnlUp === false ? '#ff0062' : 'var(--gray)',
              }}
            >
              {r.pnl}
            </span>
          </div>
        ))
      )}

      {/* ── Footer ── */}
      <div className="flex justify-between items-center px-5 py-[10px] border-t border-border">
        <span className="text-[10px]" style={{ color: 'var(--gray)' }}>
          Showing <strong style={{ color: 'var(--white)' }}>{visible.length}</strong> of{' '}
          <strong style={{ color: 'var(--white)' }}>{rows.length}</strong> signals today
          {filter !== 'ALL' && (
            <Badge variant="gray" className="ml-2">{filter}</Badge>
          )}
        </span>
        <button
          className="text-[10px] tracking-[1px] transition-colors duration-150 font-mono"
          style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--cyan)')}
        >
          Load more ↓
        </button>
      </div>
    </div>
  )
}
