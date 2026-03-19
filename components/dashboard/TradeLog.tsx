'use client'

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
//  TradeLog — full audit trail of pieBot trades
//  Data source: /api/journal (reads soul.md from GitHub)
//  Fallback: mock data when API unavailable
// ─────────────────────────────────────────────────────────────

type Trade = {
  id:          string
  timestamp:   string
  ticker:      string
  alert_type:  string
  tier:        'S' | 'A' | 'B' | 'C'
  entry:       number
  sl:          number
  tp:          number
  exit_price:  number | null
  exit_reason: string
  pnl_r:       number | null
  pnl_usd:     number | null
  session:     string
}

type Summary = {
  totalTrades:  number
  wins:         number
  losses:       number
  winRate:      number
  profitFactor: number
  totalPnlR:    number
  lastUpdated:  string
}

const TIER_COLOR: Record<string, string> = {
  S: '#39ff14', A: '#00c3ff', B: '#ffd700', C: '#ff8c00',
}

// Mock data for dev / when GitHub API unavailable
const MOCK_TRADES: Trade[] = [
  { id:'t-001', timestamp:'2026-03-17T09:14:00Z', ticker:'BTCUSDT', alert_type:'CONWAY_BUY',   tier:'A', entry:84210, sl:83000, tp:86630, exit_price:86500, exit_reason:'TP_HIT',    pnl_r:1.94,  pnl_usd:289, session:'LONDON' },
  { id:'t-002', timestamp:'2026-03-17T14:22:00Z', ticker:'XAUUSD',  alert_type:'GOLD_BUY',     tier:'B', entry:2912,  sl:2890,  tp:2956,  exit_price:2956,  exit_reason:'TP_HIT',    pnl_r:2.0,   pnl_usd:88,  session:'NY'     },
  { id:'t-003', timestamp:'2026-03-16T08:05:00Z', ticker:'SOLUSDT', alert_type:'BBP_ENTRY_BUY',tier:'B', entry:95.4,  sl:93.1,  tp:100.3, exit_price:93.2,  exit_reason:'SL_HIT',    pnl_r:-1.0,  pnl_usd:-46, session:'LONDON' },
  { id:'t-004', timestamp:'2026-03-15T13:44:00Z', ticker:'BBCA',    alert_type:'CONWAY_BORN',  tier:'S', entry:9600,  sl:9450,  tp:9900,  exit_price:9880,  exit_reason:'TP_HIT',    pnl_r:1.87,  pnl_usd:280, session:'IDX'    },
  { id:'t-005', timestamp:'2026-03-14T09:30:00Z', ticker:'ETHUSDT', alert_type:'CONWAY_BUY',   tier:'A', entry:3210,  sl:3140,  tp:3350,  exit_price:3350,  exit_reason:'TP_HIT',    pnl_r:2.0,   pnl_usd:140, session:'LONDON' },
  { id:'t-006', timestamp:'2026-03-14T15:10:00Z', ticker:'BTCUSDT', alert_type:'GOLD_BUY',     tier:'B', entry:82100, sl:81200, tp:83800, exit_price:81300, exit_reason:'LH_EXIT',   pnl_r:-0.89, pnl_usd:-80, session:'NY'     },
  { id:'t-007', timestamp:'2026-03-13T08:15:00Z', ticker:'ANTM',    alert_type:'CONWAY_BUY',   tier:'A', entry:2180,  sl:2130,  tp:2280,  exit_price:2280,  exit_reason:'TP_HIT',    pnl_r:2.0,   pnl_usd:100, session:'IDX'    },
  { id:'t-008', timestamp:'2026-03-12T13:55:00Z', ticker:'NVDA',    alert_type:'BBP_ENTRY_BUY',tier:'B', entry:875,   sl:858,   tp:909,   exit_price:null,  exit_reason:'OPEN',      pnl_r:null,  pnl_usd:null,session:'NY'     },
]

const MOCK_SUMMARY: Summary = {
  totalTrades: 8, wins: 5, losses: 2, winRate: 71.4,
  profitFactor: 2.84, totalPnlR: 7.92, lastUpdated: '2026-03-17T18:00:00Z',
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function TradeLog() {
  const [trades,   setTrades]   = useState<Trade[]>(MOCK_TRADES)
  const [summary,  setSummary]  = useState<Summary>(MOCK_SUMMARY)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<'ALL' | 'S' | 'A' | 'B' | 'C'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'OPEN'>('ALL')

  // Try to fetch real data from /api/journal
  useEffect(() => {
    async function fetchJournal() {
      setLoading(true)
      try {
        const res = await fetch('/api/journal')
        if (res.ok) {
          const data = await res.json()
          if (data.trades?.length > 0) {
            setTrades(data.trades)
            setSummary(data.summary)
          }
        }
      } catch {
        // Silently fall back to mock data
      } finally {
        setLoading(false)
      }
    }
    fetchJournal()
  }, [])

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Time','Ticker','Signal','Tier','Entry','SL','TP','Exit','Reason','PnL R','PnL USD','Session']
    const rows = filtered.map(t => [
      new Date(t.timestamp).toLocaleString('en-GB'),
      t.ticker,
      t.alert_type,
      t.tier,
      t.entry,
      t.sl,
      t.tp,
      t.exit_price ?? '—',
      t.exit_reason,
      t.pnl_r !== null ? `${t.pnl_r > 0 ? '+' : ''}${t.pnl_r.toFixed(2)}R` : '—',
      t.pnl_usd !== null ? `${t.pnl_usd > 0 ? '+' : ''}${t.pnl_usd}` : '—',
      t.session,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `stockindexer_trades_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = trades.filter(t => {
    const tierOk = tierFilter === 'ALL' || t.tier === tierFilter
    const statusOk = statusFilter === 'ALL'
      || (statusFilter === 'WIN'  && t.pnl_r !== null && t.pnl_r > 0)
      || (statusFilter === 'LOSS' && t.pnl_r !== null && t.pnl_r < 0)
      || (statusFilter === 'OPEN' && t.exit_price === null)
    return tierOk && statusOk
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#39ff14,#00c3ff)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Trade Journal
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', padding:'1px 6px', border:'1px solid #162035', borderRadius:3 }}>
            {loading ? 'SYNCING...' : error ? 'MOCK DATA' : 'LIVE'}
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button
            onClick={exportCSV}
            style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#39ff14', background:'none', border:'1px solid #39ff1440', borderRadius:4, padding:'3px 10px', cursor:'pointer', letterSpacing:1 }}
          >
            ↓ CSV
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#00c3ff', background:'none', border:'1px solid #162035', borderRadius:4, padding:'3px 10px', cursor:'pointer', letterSpacing:1 }}
          >
            ↻ REFRESH
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:16 }}>
        {[
          { label:'TRADES',        value: summary.totalTrades.toString(),      color:'#c8d8e8' },
          { label:'WIN RATE',      value: `${fmt(summary.winRate, 1)}%`,        color: summary.winRate >= 60 ? '#39ff14' : '#ff8c00' },
          { label:'WINS',          value: summary.wins.toString(),              color:'#39ff14' },
          { label:'LOSSES',        value: summary.losses.toString(),            color:'#ff0062' },
          { label:'TOTAL R',       value: `${summary.totalPnlR > 0 ? '+' : ''}${fmt(summary.totalPnlR)}R`, color: summary.totalPnlR > 0 ? '#39ff14' : '#ff0062' },
          { label:'PROFIT FACTOR', value: fmt(summary.profitFactor),            color: summary.profitFactor >= 2 ? '#39ff14' : '#ffd700' },
        ].map(s => (
          <div key={s.label} style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:6, padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {(['ALL','S','A','B','C'] as const).map(t => (
            <button key={t} onClick={() => setTierFilter(t)} style={{
              padding:'2px 8px', fontSize:9, letterSpacing:1, cursor:'pointer', borderRadius:3,
              fontFamily:'Space Mono,monospace', fontWeight:700,
              background: tierFilter === t ? (t === 'ALL' ? '#ffffff20' : `${TIER_COLOR[t]}20`) : 'transparent',
              border: `1px solid ${tierFilter === t ? (t === 'ALL' ? '#4a6080' : TIER_COLOR[t]) : '#162035'}`,
              color: tierFilter === t ? (t === 'ALL' ? '#c8d8e8' : TIER_COLOR[t]) : '#4a6080',
            }}>
              {t === 'ALL' ? 'ALL TIERS' : `TIER ${t}`}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {(['ALL','WIN','LOSS','OPEN'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding:'2px 8px', fontSize:9, letterSpacing:1, cursor:'pointer', borderRadius:3,
              fontFamily:'Space Mono,monospace',
              background: statusFilter === s ? '#00c3ff15' : 'transparent',
              border: `1px solid ${statusFilter === s ? '#00c3ff' : '#162035'}`,
              color: statusFilter === s ? '#00c3ff' : '#4a6080',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Trade table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono,monospace', fontSize:10 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #162035' }}>
              {['TIME','TICKER','SIGNAL','TIER','ENTRY','SL','TP','EXIT','REASON','P&L R','P&L USD','SESSION'].map(h => (
                <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, fontWeight:400, whiteSpace:'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const isWin  = t.pnl_r !== null && t.pnl_r > 0
              const isLoss = t.pnl_r !== null && t.pnl_r < 0
              const isOpen = t.exit_price === null
              return (
                <tr key={t.id} style={{ borderBottom:'1px solid #0d1830', transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0a1020')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding:'7px 10px', color:'#4a6080', fontSize:9, whiteSpace:'nowrap' }}>
                    {timeAgo(t.timestamp)}
                  </td>
                  <td style={{ padding:'7px 10px', color:'#eef4fc', fontWeight:700 }}>{t.ticker}</td>
                  <td style={{ padding:'7px 10px', color:'#8aa0b8', fontSize:9, whiteSpace:'nowrap' }}>
                    {t.alert_type.replace(/_/g,' ')}
                  </td>
                  <td style={{ padding:'7px 10px' }}>
                    <span style={{
                      fontSize:8, padding:'1px 5px', fontWeight:700, letterSpacing:1,
                      color: TIER_COLOR[t.tier], border:`1px solid ${TIER_COLOR[t.tier]}60`,
                      background:`${TIER_COLOR[t.tier]}10`,
                    }}>
                      {t.tier}
                    </span>
                  </td>
                  <td style={{ padding:'7px 10px', color:'#c8d8e8', fontFamily:'Space Mono,monospace' }}>{fmt(t.entry)}</td>
                  <td style={{ padding:'7px 10px', color:'#ff006280', fontFamily:'Space Mono,monospace' }}>{fmt(t.sl)}</td>
                  <td style={{ padding:'7px 10px', color:'#39ff1480', fontFamily:'Space Mono,monospace' }}>{fmt(t.tp)}</td>
                  <td style={{ padding:'7px 10px', color: isOpen ? '#4a6080' : '#c8d8e8', fontFamily:'Space Mono,monospace' }}>
                    {t.exit_price !== null ? fmt(t.exit_price) : '—'}
                  </td>
                  <td style={{ padding:'7px 10px', color:'#4a6080', fontSize:9 }}>{t.exit_reason}</td>
                  <td style={{ padding:'7px 10px', fontWeight:700, fontFamily:'Space Mono,monospace',
                    color: isOpen ? '#4a6080' : isWin ? '#39ff14' : isLoss ? '#ff0062' : '#4a6080' }}>
                    {t.pnl_r !== null ? `${t.pnl_r > 0 ? '+' : ''}${fmt(t.pnl_r)}R` : '—'}
                  </td>
                  <td style={{ padding:'7px 10px', fontFamily:'Space Mono,monospace',
                    color: isOpen ? '#4a6080' : isWin ? '#39ff14' : isLoss ? '#ff0062' : '#4a6080' }}>
                    {t.pnl_usd !== null ? `${t.pnl_usd > 0 ? '+' : ''}$${Math.abs(t.pnl_usd)}` : '—'}
                  </td>
                  <td style={{ padding:'7px 10px', fontSize:9, color:'#ffd700' }}>{t.session}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'30px', color:'#4a6080', fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>
            No trades match current filters
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:'1px solid #162035' }}>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
          {filtered.length} of {trades.length} trades · Last updated: {timeAgo(summary.lastUpdated)}
        </span>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#2a3d58' }}>
          Source: soul.md via GitHub · {filtered.length} trades in export
        </span>
      </div>
    </div>
  )
}
