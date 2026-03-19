'use client'

import { useState, useCallback, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface Position {
  symbol: string
  sector: string
  value: number
  pct: number
  signal?: string
  correlation?: Record<string, number>
}

interface HeatCell {
  a: string
  b: string
  corr: number
}

const SECTOR_COLORS: Record<string, string> = {
  'Banking':       '#00c3ff',
  'Technology':    '#bd93f9',
  'Energy':        '#ff8c00',
  'Consumer':      '#39ff14',
  'Property':      '#ffd700',
  'Telco':         '#ff44cc',
  'Mining':        '#ff0062',
  'Infrastructure':'#8aa0b8',
  'Crypto':        '#00ffcc',
  'Commodity':     '#ffd700',
  'Forex':         '#39ff14',
}

const DEFAULT_PORTFOLIO: Position[] = [
  { symbol:'BBCA',    sector:'Banking',    value:25000000, pct:25.0, signal:'CONWAY BUY' },
  { symbol:'BBRI',    sector:'Banking',    value:20000000, pct:20.0, signal:undefined    },
  { symbol:'BTCUSDT', sector:'Crypto',     value:15000000, pct:15.0, signal:undefined    },
  { symbol:'ANTM',    sector:'Mining',     value:12000000, pct:12.0, signal:undefined    },
  { symbol:'XAUUSD',  sector:'Commodity',  value:10000000, pct:10.0, signal:'GOLD BUY'  },
  { symbol:'ASII',    sector:'Consumer',   value:8000000,  pct:8.0,  signal:undefined    },
  { symbol:'NVDA',    sector:'Technology', value:6000000,  pct:6.0,  signal:'CONWAY BUY' },
  { symbol:'EURUSD',  sector:'Forex',      value:4000000,  pct:4.0,  signal:undefined    },
]

const SYMBOLS = ['BBCA','BBRI','BTCUSDT','ANTM','XAUUSD','ASII','NVDA','EURUSD']
const CORR_MATRIX: Record<string, Record<string, number>> = {
  BBCA:    { BBCA:1.00, BBRI:0.87, BTCUSDT:0.12, ANTM:-0.12, XAUUSD:0.08,  ASII:0.45,  NVDA:0.21,  EURUSD:0.05  },
  BBRI:    { BBCA:0.87, BBRI:1.00, BTCUSDT:0.09, ANTM:-0.15, XAUUSD:0.06,  ASII:0.41,  NVDA:0.18,  EURUSD:0.03  },
  BTCUSDT: { BBCA:0.12, BBRI:0.09, BTCUSDT:1.00, ANTM:0.34,  XAUUSD:0.41,  ASII:0.08,  NVDA:0.62,  EURUSD:0.18  },
  ANTM:    { BBCA:-0.12,BBRI:-0.15,BTCUSDT:0.34, ANTM:1.00,  XAUUSD:0.58,  ASII:0.19,  NVDA:0.14,  EURUSD:-0.04 },
  XAUUSD:  { BBCA:0.08, BBRI:0.06, BTCUSDT:0.41, ANTM:0.58,  XAUUSD:1.00,  ASII:0.11,  NVDA:0.09,  EURUSD:0.31  },
  ASII:    { BBCA:0.45, BBRI:0.41, BTCUSDT:0.08, ANTM:0.19,  XAUUSD:0.11,  ASII:1.00,  NVDA:0.28,  EURUSD:0.07  },
  NVDA:    { BBCA:0.21, BBRI:0.18, BTCUSDT:0.62, ANTM:0.14,  XAUUSD:0.09,  ASII:0.28,  NVDA:1.00,  EURUSD:0.14  },
  EURUSD:  { BBCA:0.05, BBRI:0.03, BTCUSDT:0.18, ANTM:-0.04, XAUUSD:0.31,  ASII:0.07,  NVDA:0.14,  EURUSD:1.00  },
}

function corrColor(v: number) {
  if (v >= 0.7)  return '#ff006280'
  if (v >= 0.4)  return '#ff8c0060'
  if (v >= 0.1)  return '#ffd70040'
  if (v >= -0.1) return '#162035'
  if (v >= -0.4) return '#39ff1430'
  return '#39ff1470'
}
function corrTextColor(v: number) {
  if (v >= 0.7)  return '#ff0062'
  if (v >= 0.4)  return '#ff8c00'
  if (v >= 0.1)  return '#ffd700'
  if (v >= -0.1) return '#4a6080'
  return '#39ff14'
}

function RiskMeter({ score }: { score: number }) {
  const pct = score
  const color = score >= 75 ? '#ff0062' : score >= 50 ? '#ff8c00' : score >= 25 ? '#ffd700' : '#39ff14'
  const label = score >= 75 ? 'HIGH RISK' : score >= 50 ? 'MODERATE' : score >= 25 ? 'BALANCED' : 'LOW RISK'
  const angle = -90 + (pct / 100) * 180

  return (
    <div style={{ textAlign:'center', padding:'8px 0' }}>
      <svg viewBox="0 0 200 120" style={{ width:'100%', maxWidth:200, height:'auto' }}>
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#162035" strokeWidth={12} strokeLinecap="round"/>
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={`${pct * 2.51} 251`}
          style={{ filter:`drop-shadow(0 0 6px ${color})` }}
        />
        {/* Needle */}
        <line
          x1={100} y1={100}
          x2={100 + 60 * Math.cos((angle - 90) * Math.PI/180)}
          y2={100 + 60 * Math.sin((angle - 90) * Math.PI/180)}
          stroke={color} strokeWidth={2} strokeLinecap="round"
        />
        <circle cx={100} cy={100} r={5} fill={color} />
        {/* Score */}
        <text x={100} y={82} textAnchor="middle" fill={color}
          fontFamily="JetBrains Mono,monospace" fontSize={22} fontWeight="700">
          {score}
        </text>
        <text x={100} y={96} textAnchor="middle" fill={color}
          fontFamily="Space Mono,monospace" fontSize={8} letterSpacing={1}>
          {label}
        </text>
        {/* Scale labels */}
        {['LOW','MED','HIGH'].map((l,i) => (
          <text key={l} x={[15,92,170][i]} y={115}
            fill="#4a6080" fontFamily="Space Mono,monospace" fontSize={7} textAnchor="middle">
            {l}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function PortfolioRiskDashboard() {
  const [positions, setPositions] = useState<Position[]>(DEFAULT_PORTFOLIO)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pie' | 'heatmap' | 'bar'>('pie')

  const totalValue = positions.reduce((s,p) => s + p.value, 0)
  const riskScore = Math.round(
    positions.reduce((s,p) => {
      if (p.signal === 'DOOM SELL') return s + p.pct * 0.8
      if (p.signal === 'GOLD BUY' || p.signal === 'CONWAY BUY') return s + p.pct * 0.2
      return s + p.pct * 0.5
    }, 0)
  )

  // Sector grouping for pie
  const sectorData = Object.entries(
    positions.reduce((acc, p) => {
      acc[p.sector] = (acc[p.sector] || 0) + p.pct
      return acc
    }, {} as Record<string,number>)
  ).map(([name, value]) => ({ name, value, color: SECTOR_COLORS[name] || '#4a6080' }))

  // Rebalancing suggestions
  const suggestions = [
    positions.some(p => p.sector === 'Banking' && p.pct > 30) && '⚠ Banking overweight >30% — consider trimming BBRI',
    positions.some(p => p.signal === 'DOOM SELL') && '🛑 ANTM DOOM SELL active — reduce or hedge exposure',
    riskScore > 50 && '📊 Portfolio risk elevated — diversify into low-corr assets (XAUUSD, EURUSD)',
    '✅ BBCA CONWAY BUY — consider adding to banking core position',
  ].filter(Boolean) as string[]

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text  = ev.target?.result as string
        const lines = text.split('\n').filter(l => l.trim())
        // Expected CSV: Symbol,Sector,Value,Pct
        const parsed: Position[] = lines.slice(1).map((line, i) => {
          const [symbol, sector, value, pct] = line.split(',').map(s => s.trim().replace(/"/g,''))
          return {
            symbol: symbol || `ASSET${i}`,
            sector: sector || 'Unknown',
            value:  parseFloat(value) || 0,
            pct:    parseFloat(pct)   || 0,
          }
        }).filter(p => p.value > 0)

        if (parsed.length > 0) setPositions(parsed)
      } catch {
        // Keep default if parse fails
      }
      setUploading(false)
      // Reset input so same file can be uploaded again
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }, [])

  const TABS = [
    { key:'pie',     label:'SECTOR EXPOSURE' },
    { key:'heatmap', label:'CORRELATION' },
    { key:'bar',     label:'VALUE BREAKDOWN' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#bd93f9,#39ff14)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Portfolio Risk
          </span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#4a6080' }}>
            IDR {(totalValue/1e6).toFixed(1)}M
          </span>
          <div style={{ display:'flex', gap:6 }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display:'none' }}
            />
            {/* Download CSV template */}
            <button
              onClick={() => {
                const template = `Symbol,Sector,Value,Pct\nBBCA,Banking,25000000,25\nBBRI,Banking,20000000,20\nBTCUSDT,Crypto,15000000,15\n`
                const blob = new Blob([template], { type: 'text/csv' })
                const url  = URL.createObjectURL(blob)
                const a    = document.createElement('a')
                a.href = url; a.download = 'portfolio_template.csv'; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{
                background:'transparent', border:'1px solid #162035', borderRadius:6,
                padding:'5px 10px', fontFamily:'Space Mono,monospace', fontSize:9,
                color:'#4a6080', cursor:'pointer', letterSpacing:1,
              }}
            >
              ↓ TEMPLATE
            </button>
            <button onClick={handleUpload} disabled={uploading} style={{
              background: uploading ? '#162035' : '#bd93f920',
              border:'1px solid #bd93f940', borderRadius:6, padding:'5px 12px',
              fontFamily:'Space Mono,monospace', fontSize:9, color:'#bd93f9',
              cursor: uploading ? 'wait' : 'pointer', letterSpacing:1,
            }}>
              {uploading ? 'PARSING...' : '↑ UPLOAD CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Risk meter + suggestions */}
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:12, marginBottom:16 }}>
        <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, marginBottom:6 }}>
            PORTFOLIO RISK
          </div>
          <RiskMeter score={riskScore} />
        </div>
        <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, marginBottom:8 }}>
            AI REBALANCING SUGGESTIONS
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {suggestions.map((s,i) => (
              <div key={i} style={{
                fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#8aa0b8',
                background:'#04070f', border:'1px solid #162035', borderRadius:5,
                padding:'6px 10px', lineHeight:1.5,
                animation:`fadeUp 0.3s ease ${i*0.1}s both`,
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:10 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
            fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
            padding:'4px 10px', borderRadius:4, cursor:'pointer',
            background: activeTab === t.key ? '#bd93f920' : 'transparent',
            border: `1px solid ${activeTab === t.key ? '#bd93f9' : '#162035'}`,
            color: activeTab === t.key ? '#bd93f9' : '#4a6080',
            transition:'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Charts */}
      <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
        {activeTab === 'pie' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {sectorData.map((d,i) => (
                    <Cell key={i} fill={d.color} stroke={d.color} strokeWidth={0.5}
                      style={{ filter:`drop-shadow(0 0 4px ${d.color}60)` }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background:'#0a1020', border:'1px solid #162035', borderRadius:6, fontFamily:'JetBrains Mono,monospace', fontSize:10 }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {sectorData.map(d => (
                <div key={d.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 4px ${d.color}` }} />
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#8aa0b8' }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:d.color }}>
                    {d.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr>
                  <th style={{ width:60 }} />
                  {SYMBOLS.map(s => (
                    <th key={s} style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', padding:'4px 6px', textAlign:'center', letterSpacing:0.5 }}>
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SYMBOLS.map(row => (
                  <tr key={row}>
                    <td style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', padding:'3px 6px', whiteSpace:'nowrap' }}>
                      {row}
                    </td>
                    {SYMBOLS.map(col => {
                      const v = CORR_MATRIX[row]?.[col] ?? 0
                      return (
                        <td key={col} style={{
                          background: corrColor(v),
                          padding:'6px 8px', textAlign:'center',
                          borderRadius:2, border:'1px solid #04070f',
                        }}>
                          <span style={{
                            fontFamily:'JetBrains Mono,monospace', fontSize:9, fontWeight:700,
                            color: corrTextColor(v),
                          }}>
                            {v === 1 ? '—' : v.toFixed(2)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
              {[
                { label:'≥0.7 HIGH CORR', color:'#ff0062' },
                { label:'0.4–0.7 MED', color:'#ff8c00' },
                { label:'0.1–0.4 LOW', color:'#ffd700' },
                { label:'-0.1–0.1 NEUTRAL', color:'#4a6080' },
                { label:'<-0.1 INVERSE', color:'#39ff14' },
              ].map(l => (
                <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:l.color + '60', border:`1px solid ${l.color}` }} />
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#4a6080', letterSpacing:0.5 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bar' && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={positions.sort((a,b) => b.value - a.value)} margin={{ top:0,right:0,bottom:0,left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
              <XAxis dataKey="symbol" tick={{ fontFamily:'Space Mono,monospace', fontSize:8, fill:'#4a6080' }} />
              <YAxis tick={{ fontFamily:'Space Mono,monospace', fontSize:8, fill:'#4a6080' }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background:'#0a1020', border:'1px solid #162035', borderRadius:6, fontFamily:'JetBrains Mono,monospace', fontSize:10 }}
                formatter={(v: number) => [`IDR ${(v/1e6).toFixed(1)}M`, 'Value']}
              />
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {positions.map((p,i) => (
                  <Cell key={i}
                    fill={p.signal === 'DOOM SELL' ? '#ff0062' : p.signal ? '#39ff14' : '#00c3ff'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Position table */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono,monospace' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #162035' }}>
              {['SYMBOL','SECTOR','VALUE (IDR)','WEIGHT','SIGNAL'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'5px 8px', fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p,i) => {
              const sigColor = p.signal?.includes('SELL') ? '#ff0062' : p.signal ? '#39ff14' : '#4a6080'
              return (
                <tr key={p.symbol}
                  style={{ borderBottom:'1px solid #162035', background: i%2===0 ? 'transparent' : '#0a102015' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#00c3ff08')}
                  onMouseLeave={e => (e.currentTarget.style.background = i%2===0 ? 'transparent' : '#0a102015')}
                >
                  <td style={{ padding:'7px 8px', fontSize:12, fontWeight:700, color:'#e8f4f8' }}>{p.symbol}</td>
                  <td style={{ padding:'7px 8px', fontSize:10, color: SECTOR_COLORS[p.sector] || '#4a6080' }}>{p.sector}</td>
                  <td style={{ padding:'7px 8px', fontSize:11, color:'#8aa0b8' }}>{(p.value/1e6).toFixed(1)}M</td>
                  <td style={{ padding:'7px 8px', fontSize:11, fontWeight:600, color:'#c8d8e8' }}>{p.pct.toFixed(1)}%</td>
                  <td style={{ padding:'7px 8px' }}>
                    {p.signal ? (
                      <span style={{
                        fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:0.5,
                        padding:'2px 6px', borderRadius:3,
                        background:`${sigColor}15`, border:`1px solid ${sigColor}40`,
                        color: sigColor, animation:'pipPulse 2s infinite',
                      }}>⚡ {p.signal}</span>
                    ) : (
                      <span style={{ color:'#1a2a40', fontSize:10 }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes pipPulse {
          0%,100% { opacity:1 } 50% { opacity:0.4 }
        }
      `}</style>
    </div>
  )
}
