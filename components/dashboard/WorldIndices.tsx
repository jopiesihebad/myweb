'use client'

import { useState, useEffect } from 'react'

type IndexItem = {
  symbol:    string
  name:      string
  value:     number
  change:    number
  changePct: number
  region:    string
}

const REGION_COLOR: Record<string, string> = {
  USA:    '#00c3ff',
  GLOBAL: '#bd93f9',
  IDX:    '#ff8c00',
  ASIA:   '#ffd700',
  EU:     '#39ff14',
}

const FALLBACK: IndexItem[] = [
  { symbol:'SPX',  name:'S&P 500',      value:5791.23,  change:12.4,   changePct:0.21,  region:'USA'    },
  { symbol:'NDX',  name:'Nasdaq',        value:21843.00, change:-96.8,  changePct:-0.44, region:'USA'    },
  { symbol:'DXY',  name:'Dollar Index',  value:104.82,   change:0.24,   changePct:0.23,  region:'GLOBAL' },
  { symbol:'VIX',  name:'Volatility',    value:18.43,    change:-1.12,  changePct:-5.73, region:'GLOBAL' },
  { symbol:'IHSG', name:'IDX Composite', value:6841.20,  change:42.3,   changePct:0.62,  region:'IDX'    },
  { symbol:'N225', name:'Nikkei 225',    value:38921.00, change:-134.6, changePct:-0.34, region:'ASIA'   },
  { symbol:'DAX',  name:'DAX 40',        value:22104.50, change:88.1,   changePct:0.40,  region:'EU'     },
  { symbol:'HSI',  name:'Hang Seng',     value:23441.00, change:201.4,  changePct:0.87,  region:'ASIA'   },
]

function fmt(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1000)  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toFixed(2)
}

export default function WorldIndices() {
  const [indices,  setIndices]  = useState<IndexItem[]>(FALLBACK)
  const [loading,  setLoading]  = useState(true)
  const [source,   setSource]   = useState<'live' | 'fallback'>('fallback')
  const [lastUpd,  setLastUpd]  = useState<string | null>(null)
  const [hovered,  setHovered]  = useState<string | null>(null)

  const fetchIndices = async () => {
    try {
      const res = await fetch('/api/indices')
      if (!res.ok) return
      const data = await res.json()
      if (data.indices?.length > 0 && data.source !== 'unavailable') {
        // Merge with fallback for any zeros
        const merged = data.indices.map((d: IndexItem, i: number) => ({
          ...FALLBACK[i],
          ...d,
          value:     d.value     !== 0 ? d.value     : FALLBACK[i]?.value,
          change:    d.value     !== 0 ? d.change     : FALLBACK[i]?.change,
          changePct: d.value     !== 0 ? d.changePct  : FALLBACK[i]?.changePct,
        }))
        setIndices(merged)
        setSource('live')
        setLastUpd(data.lastUpdated)
      }
    } catch { /* keep fallback */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchIndices()
    // Refresh every 5 min
    const id = setInterval(fetchIndices, 300000)
    return () => clearInterval(id)
  }, [])

  return (
    <section style={{ padding:'0 0 4px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#00c3ff,#bd93f9)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Macro Indices
          </span>
          <span style={{
            fontSize:8, padding:'1px 6px', letterSpacing:1,
            color:      source === 'live' ? '#39ff14' : '#4a6080',
            border:    `1px solid ${source === 'live' ? '#39ff1440' : '#162035'}`,
            fontFamily:'Space Mono,monospace',
          }}>
            {loading ? 'LOADING...' : source === 'live' ? '● LIVE' : '○ CACHED'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {lastUpd && (
            <span style={{ fontSize:8, color:'#2a3d58', fontFamily:'Space Mono,monospace' }}>
              {new Date(lastUpd).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })} WIB
            </span>
          )}
          <button
            onClick={fetchIndices}
            style={{ fontSize:8, color:'#4a6080', background:'none', border:'none', cursor:'pointer', fontFamily:'Space Mono,monospace', padding:'2px 6px' }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {indices.map(idx => {
          const isUp  = idx.changePct >= 0
          const isHov = hovered === idx.symbol
          const rc    = REGION_COLOR[idx.region] || '#4a6080'

          return (
            <div
              key={idx.symbol}
              onMouseEnter={() => setHovered(idx.symbol)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background:   isHov ? '#0d1830' : '#0a1020',
                border:      `1px solid ${isHov ? rc + '60' : '#162035'}`,
                borderRadius: 8,
                padding:      '10px 12px',
                cursor:       'default',
                transition:   'all 0.2s',
                boxShadow:    isHov ? `0 0 16px ${rc}25` : 'none',
              }}
            >
              {/* Top */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                    <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:rc, letterSpacing:1.5, fontWeight:700 }}>
                      {idx.symbol}
                    </span>
                    <span style={{ fontSize:7, padding:'1px 4px', color:rc, border:`1px solid ${rc}30`, background:`${rc}10` }}>
                      {idx.region}
                    </span>
                  </div>
                  <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#4a6080' }}>
                    {idx.name}
                  </div>
                </div>
                <div style={{
                  background: isUp ? '#39ff1415' : '#ff006215',
                  border:    `1px solid ${isUp ? '#39ff1440' : '#ff006240'}`,
                  borderRadius: 4, padding:'2px 5px',
                  fontFamily:'JetBrains Mono,monospace', fontSize:9,
                  color: isUp ? '#39ff14' : '#ff0062', fontWeight:700,
                }}>
                  {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                </div>
              </div>

              {/* Value */}
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15, fontWeight:700, color:'#e8f4f8', letterSpacing:-0.5, lineHeight:1, marginBottom:4 }}>
                {idx.value > 0 ? fmt(idx.value) : '—'}
              </div>

              {/* Change */}
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color: isUp ? '#39ff14cc' : '#ff0062cc', display:'flex', gap:3 }}>
                <span>{isUp ? '▲' : '▼'}</span>
                <span>{isUp ? '+' : ''}{fmt(Math.abs(idx.change))}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop:8, fontSize:8, color:'#1e2e4a', fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
        Source: Yahoo Finance · Macro context only · Not part of signal universe
      </div>
    </section>
  )
}
