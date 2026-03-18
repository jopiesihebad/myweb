'use client'

import { useState, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────
interface Investor {
  id: string
  name: string
  type: 'CP' | 'ID' | 'IB' | 'MF' | 'FRG'
  origin: 'LOCAL' | 'FOREIGN'
  pct: number
  shares: number
  change: number    // % change from previous period
  hidden: boolean   // suspected hidden accumulation (crossing 1% unreported)
  affiliation?: string
  lastUpdated: string
}

interface NetworkNode {
  id: string
  label: string
  type: 'holding' | 'subsidiary' | 'investee' | 'person'
  x: number
  y: number
  size: number
  color: string
}

interface NetworkEdge {
  from: string
  to: string
  pct: number
  color: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_OWNERSHIP: Investor[] = [
  { id:'inv-01', name:'Pemerintah RI / Kementerian BUMN', type:'CP', origin:'LOCAL',   pct:53.19, shares:217200000000, change:0,     hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-02', name:'BlackRock Inc.',                   type:'FRG', origin:'FOREIGN', pct:5.84,  shares:23840000000, change:0.21,  hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-03', name:'Vanguard Group Inc.',              type:'MF',  origin:'FOREIGN', pct:3.12,  shares:12740000000, change:-0.08, hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-04', name:'Danareksa Investment Management',  type:'MF',  origin:'LOCAL',   pct:2.87,  shares:11710000000, change:0.15,  hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-05', name:'PT Taspen (Persero)',               type:'ID',  origin:'LOCAL',   pct:2.41,  shares:9840000000,  change:0.03,  hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-06', name:'Government of Singapore (GIC)',    type:'FRG', origin:'FOREIGN', pct:1.94,  shares:7920000000,  change:0.44,  hidden:true,  affiliation:'GIC Direct Investments', lastUpdated:'2025-09-30' },
  { id:'inv-07', name:'Eastspring Investments',           type:'MF',  origin:'FOREIGN', pct:1.62,  shares:6610000000,  change:-0.12, hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-08', name:'PT Asuransi Jiwa Manulife',        type:'IB',  origin:'LOCAL',   pct:1.31,  shares:5340000000,  change:0.07,  hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-09', name:'Norges Bank Investment Mgmt',      type:'FRG', origin:'FOREIGN', pct:1.18,  shares:4810000000,  change:0.31,  hidden:true,  lastUpdated:'2025-09-30' },
  { id:'inv-10', name:'PT Bahana TCW Investment Mgmt',    type:'MF',  origin:'LOCAL',   pct:0.94,  shares:3840000000,  change:0.09,  hidden:false, lastUpdated:'2025-09-30' },
  { id:'inv-11', name:'Public Float / Others',            type:'ID',  origin:'LOCAL',   pct:25.58, shares:104390000000,change:0,     hidden:false, lastUpdated:'2025-09-30' },
]

const NETWORK_NODES: NetworkNode[] = [
  { id:'bbri', label:'BBRI', type:'investee', x:300, y:200, size:40, color:'#00c3ff' },
  { id:'govt', label:'Gov RI', type:'holding', x:180, y:80, size:50, color:'#ffd700' },
  { id:'bri', label:'PT BRI', type:'subsidiary', x:420, y:80, size:30, color:'#39ff14' },
  { id:'agro', label:'BRI Agro', type:'subsidiary', x:180, y:320, size:25, color:'#39ff14' },
  { id:'bri-ins', label:'BRI Insurance', type:'subsidiary', x:420, y:320, size:25, color:'#39ff14' },
  { id:'blackrock', label:'BlackRock', type:'holding', x:80, y:200, size:30, color:'#bd93f9' },
  { id:'vanguard', label:'Vanguard', type:'holding', x:520, y:200, size:25, color:'#ff44cc' },
]

const NETWORK_EDGES: NetworkEdge[] = [
  { from:'govt', to:'bbri', pct:53.19, color:'#ffd700' },
  { from:'bri',  to:'bbri', pct:100,   color:'#39ff14' },
  { from:'bbri', to:'agro', pct:87,    color:'#39ff14' },
  { from:'bbri', to:'bri-ins', pct:65, color:'#39ff14' },
  { from:'blackrock', to:'bbri', pct:5.84, color:'#bd93f9' },
  { from:'vanguard',  to:'bbri', pct:3.12, color:'#ff44cc' },
]

const TYPE_META: Record<string, { label:string; color:string }> = {
  CP:  { label:'Corporate',  color:'#ffd700' },
  ID:  { label:'Individual', color:'#00c3ff' },
  IB:  { label:'Institution',color:'#bd93f9' },
  MF:  { label:'Mutual Fund',color:'#39ff14' },
  FRG: { label:'Foreign',    color:'#ff44cc' },
}

const MOCK_QA: Record<string, string> = {
  'pemegang saham terbesar bbri': '**Pemegang saham terbesar BBRI** adalah **Pemerintah RI / Kementerian BUMN** dengan kepemilikan **53.19%** (217.2 miliar saham). Kepemilikan ini tidak berubah sejak Q3 2024. Pemerintah mempertahankan kendali mayoritas sebagai bagian dari strategi BUMN strategis.\n\n*Sumber: IDX disclosure Q3 2025 · Terakhir diperbarui: 30 Sep 2025*',
  'foreign ownership bbri': '**Total foreign ownership BBRI: 13.7%** — didominasi oleh BlackRock Inc. (5.84%), Vanguard Group (3.12%), GIC Singapore (1.94%), dan Norges Bank (1.18%). Ada **2 investor asing** yang diduga mengakumulasi tersembunyi (melebihi 1% tanpa laporan resmi). Foreign ownership turun 0.8% dari Q2 ke Q3 2025.\n\n*Catatan: GIC Singapore dan Norges Bank terdeteksi flag tersembunyi.*',
  'hidden accumulation': '**2 investor terdeteksi akumulasi tersembunyi:**\n1. **GIC Direct Investments** (afiliasi Gov Singapore) — pembelian bertahap melalui beberapa entitas berbeda total +0.44% di Q3 2025\n2. **Norges Bank** — akumulasi +0.31% melalui nominee accounts\n\n*Metode deteksi: crossing 1% reporting threshold berulang kali di bawah limit, multiple custodian accounts, pola pembelian incremental.*',
}

function ConglomerateGraph({ nodes, edges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) {
  const [hovNode, setHovNode] = useState<string | null>(null)
  const width = 600, height = 400

  return (
    <div style={{ background:'#04070f', borderRadius:8, overflow:'hidden', border:'1px solid #162035' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width:'100%', height:260 }}>
        <defs>
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {Array.from({length:20}).map((_,i) => (
          <line key={`h${i}`} x1={0} y1={i*20} x2={width} y2={i*20} stroke="#162035" strokeWidth={0.5} />
        ))}
        {Array.from({length:30}).map((_,i) => (
          <line key={`v${i}`} x1={i*20} y1={0} x2={i*20} y2={height} stroke="#162035" strokeWidth={0.5} />
        ))}

        {/* Edges */}
        {edges.map((e,i) => {
          const from = nodes.find(n => n.id === e.from)
          const to   = nodes.find(n => n.id === e.to)
          if (!from || !to) return null
          const isHov = hovNode === e.from || hovNode === e.to
          return (
            <g key={i}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={e.color}
                strokeWidth={isHov ? 2 : 1}
                opacity={isHov ? 0.8 : 0.3}
                strokeDasharray={e.pct < 50 ? "4 4" : undefined}
              />
              {/* Percentage label at midpoint */}
              <text
                x={(from.x + to.x)/2} y={(from.y + to.y)/2 - 5}
                fill={e.color} fontSize={9} textAnchor="middle"
                fontFamily="Space Mono,monospace" opacity={isHov ? 1 : 0.5}
              >
                {e.pct}%
              </text>
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isHov = hovNode === node.id
          return (
            <g key={node.id}
              onMouseEnter={() => setHovNode(node.id)}
              onMouseLeave={() => setHovNode(null)}
              style={{ cursor:'pointer' }}
            >
              <circle
                cx={node.x} cy={node.y} r={node.size}
                fill={`${node.color}15`}
                stroke={node.color}
                strokeWidth={isHov ? 2 : 1}
                filter={isHov ? "url(#glow-cyan)" : undefined}
              />
              <text
                x={node.x} y={node.y + 4}
                fill={node.color} fontSize={10} textAnchor="middle"
                fontFamily="JetBrains Mono,monospace" fontWeight="700"
              >
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OwnershipIntelligence() {
  const [ticker, setTicker] = useState('BBRI')
  const [inputTicker, setInputTicker] = useState('BBRI')
  const [originFilter, setOriginFilter] = useState<'ALL' | 'LOCAL' | 'FOREIGN'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CP' | 'ID' | 'IB' | 'MF' | 'FRG'>('ALL')
  const [showGraph, setShowGraph] = useState(false)
  const [qaInput, setQaInput] = useState('')
  const [qaAnswer, setQaAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [sortKey, setSortKey] = useState<'pct' | 'change'>('pct')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const handleQA = useCallback(async () => {
    if (!qaInput.trim()) return
    setQaLoading(true)
    setQaAnswer('')
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1200))
    const key = qaInput.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim()
    const found = Object.entries(MOCK_QA).find(([k]) => key.includes(k) || k.includes(key.split(' ')[0]))
    setQaAnswer(found ? found[1] : `Tidak ditemukan data untuk "${qaInput}". Coba: "pemegang saham terbesar BBRI", "foreign ownership BBRI", atau "hidden accumulation".`)
    setQaLoading(false)
  }, [qaInput])

  const filtered = MOCK_OWNERSHIP
    .filter(inv => {
      if (originFilter !== 'ALL' && inv.origin !== originFilter) return false
      if (typeFilter !== 'ALL' && inv.type !== typeFilter) return false
      return true
    })
    .sort((a,b) => {
      const mul = sortDir === 'desc' ? -1 : 1
      return (a[sortKey] - b[sortKey]) * mul
    })

  // Pie data
  const pieData = filtered.slice(0,6).map(inv => ({
    name: inv.name.split(' ').slice(0,3).join(' '),
    value: inv.pct,
    color: TYPE_META[inv.type]?.color || '#4a6080',
  }))

  const TYPE_BTNS = ['ALL','CP','ID','IB','MF','FRG'] as const
  const ORIGIN_BTNS = ['ALL','LOCAL','FOREIGN'] as const

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#ffd700,#ff44cc)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Ownership Intelligence
          </span>
          <span style={{
            fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
            padding:'1px 6px', borderRadius:3, background:'#ffd70015',
            border:'1px solid #ffd70040', color:'#ffd700',
          }}>
            IDX DISCLOSURE
          </span>
        </div>

        {/* Ticker search */}
        <div style={{ display:'flex', gap:6 }}>
          <input
            value={inputTicker}
            onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && setTicker(inputTicker)}
            placeholder="BBRI"
            style={{
              background:'#0a1020', border:'1px solid #162035',
              borderRadius:6, padding:'5px 10px',
              fontFamily:'JetBrains Mono,monospace', fontSize:12,
              color:'#00c3ff', width:80, outline:'none',
            }}
          />
          <button onClick={() => setTicker(inputTicker)} style={{
            background:'#00c3ff20', border:'1px solid #00c3ff',
            borderRadius:6, padding:'5px 12px',
            fontFamily:'Space Mono,monospace', fontSize:10,
            color:'#00c3ff', cursor:'pointer', letterSpacing:1,
          }}>
            LOAD
          </button>
        </div>
      </div>

      {/* Current ticker info */}
      <div style={{
        background:'#00c3ff10', border:'1px solid #00c3ff30',
        borderRadius:8, padding:'10px 14px', marginBottom:14,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
      }}>
        <div>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:'#00c3ff' }}>{ticker}.JK</span>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#4a6080', marginLeft:10 }}>
            PT Bank Rakyat Indonesia (Persero) Tbk
          </span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:'#ffd700' }}>53.19%</div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1 }}>GOV OWNED</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:'#ff44cc' }}>13.70%</div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1 }}>FOREIGN</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:'#ff8c00' }}>2</div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#ff8c00', letterSpacing:1, animation:'pipPulse 2s infinite' }}>HIDDEN⚑</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:4 }}>
          {ORIGIN_BTNS.map(o => (
            <button key={o} onClick={() => setOriginFilter(o)} style={{
              fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
              padding:'3px 8px', borderRadius:3, cursor:'pointer',
              background: originFilter === o ? '#00c3ff20' : 'transparent',
              border: `1px solid ${originFilter === o ? '#00c3ff' : '#162035'}`,
              color: originFilter === o ? '#00c3ff' : '#4a6080',
              transition:'all 0.2s',
            }}>{o}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {TYPE_BTNS.map(t => {
            const meta = TYPE_META[t] || { color:'#4a6080', label:'ALL' }
            return (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
                padding:'3px 8px', borderRadius:3, cursor:'pointer',
                background: typeFilter === t ? `${meta.color}20` : 'transparent',
                border: `1px solid ${typeFilter === t ? meta.color : '#162035'}`,
                color: typeFilter === t ? meta.color : '#4a6080',
                transition:'all 0.2s',
              }}>{t}</button>
            )
          })}
        </div>
      </div>

      {/* Deep Ownership Table */}
      <div style={{ overflowX:'auto', marginBottom:16 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'JetBrains Mono,monospace' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #162035' }}>
              {[
                { key:'name',   label:'INVESTOR NAME',  sortable:false },
                { key:'type',   label:'TYPE',           sortable:false },
                { key:'origin', label:'ORIGIN',         sortable:false },
                { key:'pct',    label:'%',              sortable:true  },
                { key:'change', label:'Δ%',             sortable:true  },
                { key:'shares', label:'SHARES',         sortable:false },
                { key:'hidden', label:'FLAG',           sortable:false },
              ].map(col => (
                <th key={col.key}
                  onClick={() => {
                    if (!col.sortable) return
                    if (sortKey === col.key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                    else { setSortKey(col.key as any); setSortDir('desc') }
                  }}
                  style={{
                    textAlign:'left', padding:'6px 8px',
                    fontFamily:'Space Mono,monospace', fontSize:8,
                    color:'#4a6080', letterSpacing:1, fontWeight:400,
                    cursor: col.sortable ? 'pointer' : 'default',
                    whiteSpace:'nowrap',
                  }}>
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span style={{ marginLeft:4, color:'#00c3ff' }}>
                      {sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const typeMeta = TYPE_META[inv.type] || { color:'#4a6080', label:inv.type }
              const isUp = inv.change >= 0
              return (
                <tr key={inv.id}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : '#0a102015',
                    borderBottom:'1px solid #162035',
                    transition:'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#00c3ff08')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#0a102015')}
                >
                  <td style={{ padding:'8px 8px', fontSize:11, color:'#c8d8e8', maxWidth:200 }}>
                    <div>{inv.name}</div>
                    {inv.affiliation && (
                      <div style={{ fontSize:9, color:'#4a6080', marginTop:2 }}>↳ {inv.affiliation}</div>
                    )}
                  </td>
                  <td style={{ padding:'8px 8px' }}>
                    <span style={{
                      fontSize:9, padding:'2px 6px', borderRadius:3,
                      background:`${typeMeta.color}15`, border:`1px solid ${typeMeta.color}40`,
                      color: typeMeta.color, fontFamily:'Space Mono,monospace', letterSpacing:0.5,
                    }}>{inv.type}</span>
                  </td>
                  <td style={{ padding:'8px 8px', fontSize:9, color: inv.origin === 'FOREIGN' ? '#ff44cc' : '#39ff14', fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
                    {inv.origin}
                  </td>
                  <td style={{ padding:'8px 8px', fontSize:13, fontWeight:700, color:'#e8f4f8' }}>
                    {inv.pct.toFixed(2)}%
                  </td>
                  <td style={{ padding:'8px 8px', fontSize:11, color: inv.change === 0 ? '#4a6080' : isUp ? '#39ff14' : '#ff0062', fontWeight:600 }}>
                    {inv.change === 0 ? '—' : `${isUp ? '+' : ''}${inv.change.toFixed(2)}%`}
                  </td>
                  <td style={{ padding:'8px 8px', fontSize:10, color:'#4a6080' }}>
                    {(inv.shares / 1e9).toFixed(2)}B
                  </td>
                  <td style={{ padding:'8px 8px' }}>
                    {inv.hidden && (
                      <span style={{
                        fontFamily:'Space Mono,monospace', fontSize:8,
                        color:'#ff8c00', background:'#ff8c0015',
                        border:'1px solid #ff8c0040', borderRadius:3,
                        padding:'1px 5px', animation:'pipPulse 2s infinite',
                      }}>
                        ⚑ HIDDEN
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom section: Pie + Graph toggle + AI Q&A */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>

        {/* Pie chart */}
        <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1, marginBottom:10 }}>
            OWNERSHIP DISTRIBUTION
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                innerRadius={40} outerRadius={70}
                dataKey="value" paddingAngle={2}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke={entry.color} strokeWidth={0.5} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background:'#0a1020', border:'1px solid #162035', borderRadius:6, fontFamily:'JetBrains Mono,monospace', fontSize:10 }}
                formatter={(v: number) => [`${v.toFixed(2)}%`, 'Ownership']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:d.color }} />
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
                  {d.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Graph toggle */}
        <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'12px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1 }}>
              CONGLOMERATE GRAPH
            </span>
            <button onClick={() => setShowGraph(!showGraph)} style={{
              background: showGraph ? '#00c3ff20' : 'transparent',
              border:'1px solid #00c3ff40', borderRadius:4, padding:'2px 8px',
              fontFamily:'Space Mono,monospace', fontSize:8, color:'#00c3ff',
              cursor:'pointer', letterSpacing:1,
            }}>
              {showGraph ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {showGraph
            ? <ConglomerateGraph nodes={NETWORK_NODES} edges={NETWORK_EDGES} />
            : (
              <div style={{
                height:160, display:'flex', alignItems:'center', justifyContent:'center',
                border:'1px dashed #162035', borderRadius:6,
                fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#4a6080',
                flexDirection:'column', gap:6,
              }}>
                <span style={{ fontSize:20 }}>◉</span>
                <span>Click SHOW to load</span>
                <span style={{ fontSize:9, color:'#1a2a40' }}>Conglomerate network for {ticker}</span>
              </div>
            )
          }
        </div>
      </div>

      {/* AI Q&A */}
      <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'14px 16px' }}>
        <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1, marginBottom:10 }}>
          AI OWNERSHIP Q&A
        </div>
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          <input
            value={qaInput}
            onChange={e => setQaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQA()}
            placeholder="Siapa pemegang saham terbesar BBRI?"
            style={{
              flex:1, background:'#04070f', border:'1px solid #162035',
              borderRadius:6, padding:'8px 12px',
              fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#e8f4f8',
              outline:'none',
            }}
            onFocus={e => (e.target.style.borderColor = '#00c3ff')}
            onBlur={e => (e.target.style.borderColor = '#162035')}
          />
          <button onClick={handleQA} disabled={qaLoading} style={{
            background: qaLoading ? '#162035' : '#00c3ff',
            border:'none', borderRadius:6, padding:'8px 16px',
            fontFamily:'Space Mono,monospace', fontSize:10, color:'#04070f',
            cursor: qaLoading ? 'wait' : 'pointer', fontWeight:700,
            letterSpacing:1, transition:'all 0.2s',
          }}>
            {qaLoading ? '...' : 'ASK'}
          </button>
        </div>

        {/* Quick suggestions */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
          {['pemegang saham terbesar BBRI', 'foreign ownership BBRI', 'hidden accumulation'].map(s => (
            <button key={s} onClick={() => { setQaInput(s); }} style={{
              background:'#162035', border:'1px solid #1e2f4a',
              borderRadius:12, padding:'3px 10px',
              fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'#4a6080',
              cursor:'pointer', transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#00c3ff50'; e.currentTarget.style.color='#00c3ff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#1e2f4a'; e.currentTarget.style.color='#4a6080' }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Answer */}
        {qaAnswer && (
          <div style={{
            background:'#04070f', border:'1px solid #00c3ff30',
            borderRadius:6, padding:'12px 14px',
            fontFamily:'JetBrains Mono,monospace', fontSize:11,
            color:'#8aa0b8', lineHeight:1.8,
            animation:'fadeUp 0.3s ease',
            whiteSpace:'pre-line',
          }}>
            <span style={{ color:'#00c3ff', marginRight:8 }}>▶</span>
            {qaAnswer.replace(/\*\*(.*?)\*\*/g, '$1')}
          </div>
        )}

        {qaLoading && (
          <div style={{
            fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#4a6080',
            padding:'12px 0', display:'flex', alignItems:'center', gap:8,
          }}>
            <span style={{ animation:'pipPulse 0.8s infinite' }}>●●●</span>
            <span>Analyzing ownership data...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(6px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes pipPulse {
          0%,100% { opacity:1 } 50% { opacity:0.3 }
        }
      `}</style>
    </div>
  )
}
