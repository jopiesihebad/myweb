'use client'

import { useEffect, useRef, useState } from 'react'
import { useWsSignal } from '@/components/WebSocketProvider'
import { ALERT_META, type Tier } from '@/lib/useWebSocket'
import { cn } from '@/lib/utils'

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
  fusion:    number | null   // renamed from score
  tier:      Tier | null
  desc:      string
  pnl:       string
  pnlUp:     boolean | null
  isNew:     boolean
}

// All tickers use canonical format (no .JK suffix)
const SIMULATED: Omit<SigRow, 'id' | 'time' | 'isNew'>[] = [
  { typeLabel: '⚡ CONWAY BUY', typeColor: '#39ff14', category: 'ENTRY', sym: 'EURUSD',  price: '1.0834',    sess: 'LONDON', fusion: 19, tier: 'A', desc: 'BORN · 5/8 cells · Grade 1 · BBP↑',       pnl: '+0',    pnlUp: null  },
  { typeLabel: 'BBP CROSSOVER', typeColor: '#00c3ff', category: 'INFO',  sym: 'XAUUSD',  price: '2,891.20',  sess: 'LONDON', fusion: 12, tier: 'B', desc: 'BBP Crossover · Conway 6/8 filter active', pnl: '+0',    pnlUp: null  },
  { typeLabel: '⚡ DOOM SELL',  typeColor: '#ff0062', category: 'INFO',  sym: 'BTCUSDT', price: '67,174.06', sess: 'ASIA',   fusion:  8, tier: 'C', desc: 'BBP Crossunder · VWAP+RSI confirmed',      pnl: '+2.1%', pnlUp: true  },
  { typeLabel: '⚠ ALPHA EXIT', typeColor: '#ff8c00', category: 'EXIT',  sym: 'BTCUSDT', price: '67,890.00', sess: 'ASIA',   fusion:  0, tier: null, desc: 'Dump risk · reduce exposure',              pnl: '—',     pnlUp: null  },
  { typeLabel: '🔴 CONWAY DIED',typeColor: '#bd93f9', category: 'EXIT',  sym: 'SOLUSDT', price: '95.10',     sess: 'NY',    fusion:  3, tier: null, desc: 'Cells dropped 5→3 · momentum fading',      pnl: '−0.8%', pnlUp: false },
  { typeLabel: '⚡ CONWAY BUY', typeColor: '#39ff14', category: 'ENTRY', sym: 'BBCA',    price: '9,650',     sess: 'IDX',   fusion: 21, tier: 'A', desc: 'BORN · 7/8 cells · Grade 1',               pnl: '+0',    pnlUp: null  },
  { typeLabel: 'CHoCH BULL',    typeColor: '#39ff14', category: 'INFO',  sym: 'EURUSD',  price: '1.0812',    sess: 'LONDON',fusion:  9, tier: 'B', desc: 'BOS confirmed · upside bias active',       pnl: '—',     pnlUp: null  },
]

const INITIAL_ROWS: SigRow[] = [
  { id: 1, time: '17:20:01', typeLabel: '⚡ CONWAY BUY',  typeColor: '#39ff14', category: 'ENTRY', sym: 'BBCA',    price: '9,650',     sess: 'IDX',    fusion: 21, tier: 'A',  desc: 'BORN · 7/8 cells · Grade 1 · BBP↑', pnl: '+0',    pnlUp: null,  isNew: false },
  { id: 2, time: '17:18:44', typeLabel: '🇬🇧 LONDON OPEN',typeColor: '#39ff14', category: 'INFO',  sym: 'ALL',     price: '—',         sess: 'LONDON', fusion: null,tier: null, desc: 'London session active — prime window started',     pnl: '—',     pnlUp: null,  isNew: false },
  { id: 3, time: '17:15:00', typeLabel: 'BBP CROSSOVER',  typeColor: '#00c3ff', category: 'INFO',  sym: 'BBCA',    price: '9,600',     sess: 'IDX',    fusion: 14, tier: 'B',  desc: 'BBP Crossover confirmed · Conway 7/8 filter passed', pnl: '+0',    pnlUp: null,  isNew: false },
  { id: 4, time: '17:14:23', typeLabel: '⚡ CONWAY BUY',  typeColor: '#39ff14', category: 'ENTRY', sym: 'EURUSD',  price: '1.0834',    sess: 'LONDON', fusion: 19, tier: 'A',  desc: 'BORN · 5/8 cells · Grade 1 · BBP↑', pnl: '+0',    pnlUp: null,  isNew: false },
  { id: 5, time: '16:58:01', typeLabel: 'BBP CROSSOVER',  typeColor: '#00c3ff', category: 'INFO',  sym: 'XAUUSD',  price: '2,891.20',  sess: 'LONDON', fusion: 12, tier: 'B',  desc: 'BBP Crossover · Conway 6/8 filter active', pnl: '+0',    pnlUp: true,  isNew: false },
  { id: 6, time: '16:30:00', typeLabel: '🇬🇧 LONDON OPEN',typeColor: '#39ff14', category: 'INFO',  sym: 'ALL',     price: '—',         sess: 'OPEN',   fusion: null,tier: null, desc: 'London session open — prime window started', pnl: '—',     pnlUp: null,  isNew: false },
  { id: 7, time: '15:44:12', typeLabel: 'BOS BULL',       typeColor: '#39ff14', category: 'INFO',  sym: 'EURUSD',  price: '1.0812',    sess: 'LONDON', fusion:  9, tier: 'B',  desc: 'Break of Structure confirmed · upside bias', pnl: '—',     pnlUp: null,  isNew: false },
  { id: 8, time: '14:00:11', typeLabel: '⚡ GOLD BUY',    typeColor: '#ffd700', category: 'ENTRY', sym: 'BTCUSDT', price: '67,174.06', sess: 'ASIA',   fusion: 16, tier: 'B',  desc: 'PM cross + VWAP + RSI confirmed', pnl: '+2.1%', pnlUp: true,  isNew: false },
  { id: 9, time: '13:15:44', typeLabel: '⚠ ALPHA EXIT',  typeColor: '#ff8c00', category: 'EXIT',  sym: 'BTCUSDT', price: '67,890.00', sess: 'ASIA',   fusion:  0, tier: null, desc: 'Dump risk · reduce exposure', pnl: '—',     pnlUp: null,  isNew: false },
  { id:10, time: '12:01:05', typeLabel: '🔴 CONWAY DIED', typeColor: '#bd93f9', category: 'EXIT',  sym: 'SOLUSDT', price: '95.10',     sess: 'NY',     fusion:  3, tier: null, desc: 'Cells dropped 5→3 · momentum fading', pnl: '−0.8%', pnlUp: false, isNew: false },
  { id:11, time: '12:00:05', typeLabel: '🗽 NY OPEN',     typeColor: '#00c3ff', category: 'INFO',  sym: 'ALL',     price: '—',         sess: 'OPEN',   fusion: null,tier: null, desc: 'New York session — highest volume window', pnl: '—',     pnlUp: null,  isNew: false },
]

const TIER_COLOR: Record<NonNullable<Tier>, string> = {
  S: '#39ff14', A: '#00c3ff', B: '#ffd700', C: '#ff8c00',
}

let idSeq = 200

function nowStr() {
  const d = new Date()
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')
}

function todayStr() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '3px 10px', fontSize: '9px', letterSpacing: '1px',
        textTransform: 'uppercase' as const,
        fontFamily: '"JetBrains Mono", monospace', fontWeight: 700,
        cursor: 'pointer', background: 'transparent',
        border: `1px solid ${active ? '#00c3ff' : hov ? '#5a7090' : '#1e2e4a'}`,
        color: active ? '#00c3ff' : hov ? '#eef4fc' : '#5a7090',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

export default function SignalFeed() {
  const [rows,   setRows]   = useState<SigRow[]>(INITIAL_ROWS)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [today,  setToday]  = useState('')
  const simIdx = useRef(0)

  useEffect(() => { setToday(todayStr()) }, [])

  // Real signals from WS
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
        fusion:    payload.fusion,
        tier:      payload.tier,
        desc:      payload.message,
        pnl:       '+0',
        pnlUp:     null,
        isNew:     true,
      }
      setRows(prev => [newRow, ...prev].slice(0, 25))
      setTimeout(() => setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, isNew: false } : r)), 3000)
    })
  }, [subscribe])

  // Simulated feed every 8s
  useEffect(() => {
    const id = setInterval(() => {
      const s = SIMULATED[simIdx.current % SIMULATED.length]
      simIdx.current++
      const newRow: SigRow = { ...s, id: ++idSeq, time: nowStr(), isNew: true }
      setRows(prev => [newRow, ...prev].slice(0, 25))
      setTimeout(() => setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, isNew: false } : r)), 3000)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const visible = filter === 'ALL' ? rows : rows.filter(r => r.category === filter)

  return (
    <div style={{ background: '#0a1020', border: '1px solid #162035', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 20px', borderBottom: '1px solid #162035',
        background: '#0e1628', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="ldot" />
          <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#eef4fc', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
            Signal Stream{today ? ` — ${today}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'ENTRY', 'EXIT', 'INFO'] as Filter[]).map(f => (
            <FilterBtn key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
      </div>

      {/* Signal rows */}
      {visible.map(r => (
        <div
          key={r.id}
          className={cn('sig-row', r.isNew && 'highlight')}
          style={r.isNew ? { borderLeft: '2px solid #00c3ff' } : {}}
        >
          <span style={{ color: '#5a7090', fontSize: '9px', fontFamily: '"Space Mono", monospace' }}>{r.time}</span>
          <span style={{ color: r.typeColor, fontWeight: 700, fontSize: '10px', letterSpacing: '0.5px' }}>{r.typeLabel}</span>
          <span style={{ color: '#eef4fc', fontWeight: 700, letterSpacing: '0.5px' }}>{r.sym}</span>
          <span style={{ color: '#5a7090', fontFamily: '"Space Mono", monospace', fontSize: '10px' }}>{r.price}</span>
          <span className="sig-sess" style={{ fontSize: '9px', padding: '2px 7px', color: '#ffd700', border: '1px solid rgba(255,215,0,0.2)' }}>{r.sess}</span>
          {/* Fusion score — renamed from Score */}
          <span style={{ fontSize: '9px', color: r.fusion !== null ? '#bd93f9' : '#2a3d58', fontFamily: '"Space Mono", monospace' }}>
            {r.fusion !== null ? `${r.fusion}/23` : '—'}
          </span>
          {/* Tier badge */}
          {r.tier ? (
            <span style={{
              fontSize: '8px', padding: '2px 6px', letterSpacing: '1px',
              border: `1px solid ${TIER_COLOR[r.tier]}60`,
              color: TIER_COLOR[r.tier],
              background: `${TIER_COLOR[r.tier]}10`,
              fontWeight: 700,
            }}>
              {r.tier}
            </span>
          ) : (
            <span style={{ color: '#2a3d58', fontSize: '9px' }}>—</span>
          )}
          <span className="sig-desc" style={{ color: '#2a3d58', fontSize: '10px' }}>{r.desc}</span>
          <span className="sig-pnl" style={{
            fontSize: '10px', fontFamily: '"Space Mono", monospace', textAlign: 'right',
            color: r.pnlUp === true ? '#39ff14' : r.pnlUp === false ? '#ff0062' : '#5a7090',
          }}>{r.pnl}</span>
        </div>
      ))}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #162035' }}>
        <span style={{ fontSize: '10px', color: '#5a7090' }}>
          Showing {visible.length} of {rows.length} signals today
        </span>
        <button
          style={{ fontSize: '10px', letterSpacing: '1px', color: '#00c3ff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#00e5ff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#00c3ff')}
        >
          Load more ↓
        </button>
      </div>
    </div>
  )
}
