'use client'

import { useState, useEffect } from 'react'

type IndexItem = {
  symbol: string; name: string; value: number
  change: number; changePct: number; region: string
}

const REGION_COLOR: Record<string, string> = {
  USA:'#00c3ff', GLOBAL:'#bd93f9', IDX:'#ff8c00', ASIA:'#ffd700', EU:'#39ff14',
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

export default function WorldIndices() {
  const [indices, setIndices] = useState<IndexItem[]>(FALLBACK)
  const [source,  setSource]  = useState<'live'|'fallback'>('fallback')

  useEffect(() => {
    fetch('/api/indices')
      .then(r => r.json())
      .then(data => {
        if (data.indices?.length && data.source !== 'unavailable') {
          const merged = data.indices.map((d: IndexItem, i: number) => ({
            ...FALLBACK[i], ...d,
            value:     d.value !== 0 ? d.value     : FALLBACK[i]?.value,
            change:    d.value !== 0 ? d.change     : FALLBACK[i]?.change,
            changePct: d.value !== 0 ? d.changePct  : FALLBACK[i]?.changePct,
          }))
          setIndices(merged)
          setSource('live')
        }
      }).catch(() => {})
  }, [])

  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border)', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--panel2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'var(--white)', display:'flex', alignItems:'center', gap:'8px' }}>
          <div className="ldot" /> MACRO INDICES
        </div>
        <span style={{ fontSize:'9px', color: source === 'live' ? '#39ff14' : 'var(--gray)', letterSpacing:'1px' }}>
          {source === 'live' ? '● LIVE' : '○ Cached'} · Yahoo Finance
        </span>
      </div>

      {indices.map(idx => {
        const isUp = idx.changePct >= 0
        const rc   = REGION_COLOR[idx.region] ?? '#5a7090'
        return (
          <div key={idx.symbol} style={{ display:'grid', gridTemplateColumns:'90px 1fr 110px 80px 45px', padding:'10px 16px', borderBottom:'1px solid var(--border)', alignItems:'center', transition:'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,195,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontWeight:700, fontSize:'11px', color:'var(--white)' }}>{idx.symbol}</span>
            <span style={{ fontSize:'10px', color:'var(--gray)' }}>{idx.name}</span>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:'11px', color:'var(--white)', textAlign:'right' }}>
              {idx.value > 0 ? idx.value.toLocaleString('en-US', { maximumFractionDigits:2 }) : '—'}
            </span>
            <span style={{ fontSize:'10px', color: isUp ? '#39ff14' : '#ff0062', textAlign:'right', fontFamily:'Space Mono,monospace' }}>
              {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
            </span>
            <div style={{ fontSize:'8px', letterSpacing:'1px', textAlign:'center', padding:'2px 4px', color:rc, border:`1px solid ${rc}40`, background:`${rc}10` }}>
              {idx.region}
            </div>
          </div>
        )
      })}
      <div style={{ padding:'8px 16px', fontSize:'9px', color:'#2a3d58', letterSpacing:'1px' }}>
        Macro context · Source: Yahoo Finance
      </div>
    </div>
  )
}
