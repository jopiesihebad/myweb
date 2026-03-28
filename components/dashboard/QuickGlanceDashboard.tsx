'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useWS } from './WebSocketProvider'
import { ALERT_META, TIER_META, type SignalPayload, type Tier } from '@/lib/useWebSocket'
import { PINE_ASSETS } from '@/lib/assetRegistry'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), { ssr: false })

// ─── Colors ──────────────────────────────────────────────────
const TIER_COLOR: Record<NonNullable<Tier>, string> = {
  S: '#39ff14', A: '#00c3ff', B: '#ffd700', C: '#ff8c00',
}
const STATE_COLOR: Record<string, string> = {
  born: '#39ff14', alive: '#00c3ff', died: '#ff0062', dormant: '#2a3d58',
}

// ─── Backtest reference data ──────────────────────────────────
const BACKTEST = {
  winRate:       74.1,
  profitFactor:  1.92,
  expectancy:    1.4,
  maxDD:         11.2,
  totalTrades:   287,
  avgRR:         2.3,
  sharpe:        1.84,
  period:        'Jan 2022–Dec 2025 · BTCUSDT 1H',
}



// ─── Signal Row ───────────────────────────────────────────────
function SignalRow({ sig, isNew, onSelect }: {
  sig: SignalPayload
  isNew: boolean
  onSelect: (ticker: string) => void
}) {
  const meta      = ALERT_META[sig.alert_type]
  const tierMeta  = sig.tier ? TIER_META[sig.tier] : null
  const color     = meta?.color ?? '#4a6080'
  const isEntry   = meta?.category === 'ENTRY'
  const ago = (() => {
    const d = Date.now() - new Date(sig.timestamp).getTime()
    if (d < 60000)   return `${Math.floor(d/1000)}s`
    if (d < 3600000) return `${Math.floor(d/60000)}m`
    return `${Math.floor(d/3600000)}h`
  })()

  return (
    <div
      onClick={() => onSelect(sig.ticker)}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 70px 70px 1fr 50px',
        gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid #0d1830',
        borderLeft: `2px solid ${isNew ? color : 'transparent'}`,
        background: isNew ? `${color}08` : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s',
        animation: isNew ? 'newGlow 2s ease-out' : 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#0d1830')}
      onMouseLeave={e => (e.currentTarget.style.background = isNew ? `${color}08` : 'transparent')}
    >
      {/* Alert type */}
      <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color, fontWeight: 700, letterSpacing: 0.5, alignSelf: 'center' }}>
        {meta?.label ?? sig.alert_type.replace(/_/g,' ')}
      </span>

      {/* Ticker */}
      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#eef4fc', fontWeight: 700, alignSelf: 'center' }}>
        {sig.ticker}
      </span>

      {/* Tier + Fusion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignSelf: 'center' }}>
        {sig.tier && (
          <span style={{
            fontSize: 8, padding: '1px 5px', letterSpacing: 1, fontWeight: 700,
            color: TIER_COLOR[sig.tier], border: `1px solid ${TIER_COLOR[sig.tier]}60`,
            background: `${TIER_COLOR[sig.tier]}10`, display: 'inline-block',
          }}>
            TIER {sig.tier}
          </span>
        )}
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080' }}>
          {sig.fusion}/23
        </span>
      </div>

      {/* SL/TP if entry */}
      <div style={{ alignSelf: 'center' }}>
        {isEntry && sig.sl_price > 0 ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#ff006280' }}>
              SL {sig.sl_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#39ff1480' }}>
              TP {sig.tp_price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#2a3d58' }}>
            {sig.session}
          </span>
        )}
      </div>

      {/* Time */}
      <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', textAlign: 'right', alignSelf: 'center' }}>
        {ago}
      </span>
    </div>
  )
}

// ─── Equity mini-chart (SVG) ──────────────────────────────────
function EquityMiniChart({ points }: { points: { x: number; y: number }[] }) {
  const w = 280, h = 80
  const minY = Math.min(...points.map(p => p.y))
  const maxY = Math.max(...points.map(p => p.y))
  const maxX = points.length - 1
  const px = (x: number) => (x / maxX) * w
  const py = (y: number) => h - ((y - minY) / (maxY - minY || 1)) * (h - 8) - 4
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.x)} ${py(p.y)}`).join(' ')
  const fill = `${path} L ${px(maxX)} ${h} L 0 ${h} Z`
  const last  = points[points.length - 1]
  const first = points[0]
  const isUp  = last.y > first.y

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80 }}>
      <defs>
        <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={isUp ? '#39ff14' : '#ff0062'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isUp ? '#39ff14' : '#ff0062'} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#eq-grad)" />
      <path d={path} stroke={isUp ? '#39ff14' : '#ff0062'} strokeWidth="1.5" fill="none" />
      {/* Start + end labels */}
      <text x="2" y={py(first.y) - 3} fontSize="8" fill="#4a6080" fontFamily="Space Mono">
        ${(first.y / 1000).toFixed(0)}k
      </text>
      <text x={w - 2} y={py(last.y) - 3} fontSize="8" fill={isUp ? '#39ff14' : '#ff0062'}
        fontFamily="Space Mono" textAnchor="end">
        ${(last.y / 1000).toFixed(1)}k
      </text>
    </svg>
  )
}

// ─── Stat box ─────────────────────────────────────────────────
function StatBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#0a1020', border: `1px solid ${color}20`, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#2a3d58', marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  )
}



// ─── Session Clock Strip ─────────────────────────────────────────────────────
function SessionClockStrip() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Not yet mounted — render skeleton
  if (!now) return (
    <div style={{
      background:'#0a1020', border:'1px solid #162035', borderRadius:10,
      padding:'10px 16px', height:52,
      display:'flex', alignItems:'center',
    }}>
      <span style={{ fontFamily:'Space Mono,monospace', fontSize:13, color:'#2a3d58', letterSpacing:1 }}>
        ··:··:·· UTC
      </span>
    </div>
  )

  const utcH   = now.getUTCHours()
  const utcM   = now.getUTCMinutes()
  const utcS   = now.getUTCSeconds()
  const utcMin = utcH * 60 + utcM

  // Session windows (UTC minutes)
  const SESSIONS = [
    { name:'ASIA',   start:0,    end:480,  color:'#ff8c00', flag:'🌏' },
    { name:'IDX',    start:90,   end:480,  color:'#ffd700', flag:'🇮🇩' },
    { name:'LONDON', start:420,  end:960,  color:'#39ff14', flag:'🇬🇧' },
    { name:'NY',     start:720,  end:1260, color:'#00c3ff', flag:'🗽' },
  ]

  // Next session start
  const getNextSession = () => {
    const upcoming = SESSIONS
      .map(s => {
        const startMin = s.start > utcMin ? s.start : s.start + 1440
        return { ...s, minsUntil: startMin - utcMin }
      })
      .filter(s => !( utcMin >= s.start && utcMin < s.end ))
      .sort((a, b) => a.minsUntil - b.minsUntil)
    return upcoming[0] ?? null
  }

  const nextSession = getNextSession()
  const countdown = nextSession ? (() => {
    const total = nextSession.minsUntil * 60 - utcS
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return h > 0
      ? `${h}h ${m.toString().padStart(2,'0')}m`
      : `${m}:${s.toString().padStart(2,'0')}`
  })() : null

  const utcStr = `${utcH.toString().padStart(2,'0')}:${utcM.toString().padStart(2,'0')}:${utcS.toString().padStart(2,'0')} UTC`

  return (
    <div style={{
      background:'#0a1020', border:'1px solid #162035', borderRadius:10,
      padding:'10px 16px', display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:12, flexWrap:'wrap',
    }}>
      {/* UTC Clock */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:13, fontWeight:700, color:'#eef4fc', letterSpacing:1 }}>
          {utcStr}
        </span>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1 }}>
          WIB {((utcH + 7) % 24).toString().padStart(2,'0')}:{utcM.toString().padStart(2,'0')}
        </span>
      </div>

      {/* Session badges */}
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {SESSIONS.map(s => {
          const isActive = utcMin >= s.start && utcMin < s.end
          const pct = isActive
            ? Math.round(((utcMin - s.start) / (s.end - s.start)) * 100)
            : 0
          return (
            <div key={s.name} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:2,
              padding:'4px 10px',
              background: isActive ? `${s.color}15` : 'transparent',
              border:`1px solid ${isActive ? s.color : '#162035'}`,
              borderRadius:6,
              transition:'all 0.5s',
              minWidth:68,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ fontSize:10 }}>{s.flag}</span>
                <span style={{
                  fontFamily:'Space Mono,monospace', fontSize:9, fontWeight:700,
                  color: isActive ? s.color : '#4a6080', letterSpacing:1,
                }}>
                  {s.name}
                </span>
                {isActive && (
                  <div style={{
                    width:5, height:5, borderRadius:'50%',
                    background: s.color,
                    boxShadow:`0 0 6px ${s.color}`,
                    animation:'pipPulse 1.5s infinite',
                  }} />
                )}
              </div>
              {/* Progress bar — how far into session */}
              {isActive && (
                <div style={{ width:'100%', height:2, background:'#162035', borderRadius:1, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:s.color, borderRadius:1, transition:'width 60s linear' }} />
                </div>
              )}
              {!isActive && (
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#2a3d58' }}>CLOSED</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Next session countdown */}
      {nextSession && (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>NEXT:</span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:nextSession.color, fontWeight:700 }}>
            {nextSession.flag} {nextSession.name}
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
            in {countdown}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── DXY + VIX Strip ─────────────────────────────────────────────────────────
function DxyVixStrip() {
  type MacroItem = { value: number; change: number; changePct: number }
  const [dxy,  setDxy]  = useState<MacroItem | null>(null)
  const [vix,  setVix]  = useState<MacroItem | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function fetchMacro() {
      try {
        const res = await fetch('/api/indices')
        if (!res.ok) return
        const data = await res.json()
        const indices: any[] = data.indices ?? []
        const dxyData = indices.find((i: any) => i.symbol === 'DXY')
        const vixData = indices.find((i: any) => i.symbol === 'VIX')
        if (dxyData?.value) setDxy(dxyData)
        if (vixData?.value) setVix(vixData)
      } catch {}
      finally { setLoaded(true) }
    }
    fetchMacro()
    const id = setInterval(fetchMacro, 300000) // refresh 5 min
    return () => clearInterval(id)
  }, [])

  // DXY interpretation
  const dxyBias = !dxy ? null
    : dxy.changePct > 0.3  ? { label:'USD STRONG', color:'#ff0062', hint:'Risk-off · Crypto/EM bearish' }
    : dxy.changePct < -0.3 ? { label:'USD WEAK',   color:'#39ff14', hint:'Risk-on · Crypto/EM bullish' }
    : { label:'USD NEUTRAL', color:'#ffd700', hint:'No directional bias' }

  // VIX interpretation
  const vixLevel = !vix ? null
    : vix.value > 25 ? { label:'HIGH FEAR',    color:'#ff0062', hint:'Volatility elevated · reduce size' }
    : vix.value > 18 ? { label:'CAUTIOUS',     color:'#ffd700', hint:'Moderate uncertainty' }
    : { label:'CALM MARKET', color:'#39ff14', hint:'Low vol · trend-following favorable' }

  const Macro = ({ label, value, changePct, bias, unit = '' }: {
    label: string; value: number | null; changePct: number | null
    bias: { label: string; color: string; hint: string } | null; unit?: string
  }) => (
    <div style={{
      flex:1, background:'#0a1020', border:`1px solid ${bias?.color ?? '#162035'}20`,
      borderRadius:10, padding:'12px 16px',
      borderLeft:`3px solid ${bias?.color ?? '#162035'}`,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:2 }}>
          {label}
        </span>
        {bias && (
          <span style={{
            fontFamily:'Space Mono,monospace', fontSize:8, fontWeight:700,
            color: bias.color, letterSpacing:1,
            padding:'1px 6px', border:`1px solid ${bias.color}40`,
            background:`${bias.color}10`,
          }}>
            {bias.label}
          </span>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4 }}>
        <span style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#eef4fc', lineHeight:1 }}>
          {value !== null ? value.toFixed(2) : loaded ? '—' : '···'}
        </span>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color: (changePct ?? 0) >= 0 ? '#39ff14' : '#ff0062' }}>
          {changePct !== null ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` : ''}
        </span>
      </div>
      {bias && (
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
          {bias.hint}
        </span>
      )}
    </div>
  )

  return (
    <div style={{ display:'flex', gap:12 }}>
      <Macro
        label="DXY — DOLLAR INDEX"
        value={dxy?.value ?? null}
        changePct={dxy?.changePct ?? null}
        bias={dxyBias}
      />
      <Macro
        label="VIX — FEAR INDEX"
        value={vix?.value ?? null}
        changePct={vix?.changePct ?? null}
        bias={vixLevel}
      />
    </div>
  )
}

// ─── Conway Mini-Heatmap ─────────────────────────────────────────────────────
function ConwayMiniHeatmap() {
  const { assetStates } = useWS()
  const CLASS_ORDER = ['CRYPTO', 'COMMODITY', 'FOREX', 'IDX', 'USA'] as const
  const CLASS_COLOR: Record<string, string> = {
    CRYPTO:'#bd93f9', COMMODITY:'#ffd700', FOREX:'#00c3ff', IDX:'#ff8c00', USA:'#39ff14',
  }
  const STATE_BG: Record<string, string> = {
    born:'#39ff14', alive:'#00c3ff', died:'#ff0062', dormant:'#1a2a40',
  }
  const STATE_GLOW: Record<string, string> = {
    born:'0 0 6px #39ff1480', alive:'0 0 4px #00c3ff60', died:'0 0 4px #ff006260', dormant:'none',
  }
  return (
    <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:3, height:14, background:'linear-gradient(180deg,#00c3ff,#39ff14)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#c8d8e8', letterSpacing:1 }}>CONWAY MAP</span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>24 assets</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {([['born','#39ff14'],['alive','#00c3ff'],['died','#ff0062'],['dormant','#1a2a40']] as [string,string][]).map(([s,col]) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:6, height:6, borderRadius:1, background:col }} />
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#4a6080' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {CLASS_ORDER.map(cls => {
          const classAssets = PINE_ASSETS.filter(a => a.assetClass === cls)
          return (
            <div key={cls} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:CLASS_COLOR[cls], letterSpacing:1, width:56, flexShrink:0 }}>
                {cls}
              </span>
              <div style={{ display:'flex', gap:4 }}>
                {classAssets.map(a => {
                  const s = assetStates[a.ticker]
                  const state = s?.conwayState ?? 'dormant'
                  return (
                    <div key={a.ticker} title={`${a.ticker} · ${state.toUpperCase()} · ${s?.cells ?? 0}/8 cells · ${s?.fusion ?? 0}/23 fusion`} style={{
                      width: state === 'born' ? 14 : 10,
                      height: state === 'born' ? 14 : 10,
                      borderRadius:2, background:STATE_BG[state],
                      boxShadow:STATE_GLOW[state],
                      transition:'all 0.4s ease',
                      animation: state === 'born' ? 'pipPulse 1.5s infinite' : 'none',
                      flexShrink:0,
                    }} />
                  )
                })}
              </div>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#2a3d58', marginLeft:4 }}>
                {classAssets.filter(a => ['born','alive'].includes(assetStates[a.ticker]?.conwayState ?? '')).length}/{classAssets.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Risk Meter ───────────────────────────────────────────────────────────────
function RiskMeter({ openTrades }: { openTrades: any[] }) {
  const MAX_DAILY_RISK = 6
  const TIER_RISK: Record<string, number> = { S:3.0, A:2.0, B:1.0, C:0.5 }
  const usedRisk = openTrades.reduce((sum, t) => sum + (TIER_RISK[t.tier] ?? 1.0), 0)
  const usedPct  = Math.min((usedRisk / MAX_DAILY_RISK) * 100, 100)
  const remaining = Math.max(MAX_DAILY_RISK - usedRisk, 0)
  const color = usedPct >= 80 ? '#ff0062' : usedPct >= 50 ? '#ffd700' : '#39ff14'
  const label = usedPct >= 80 ? 'HIGH RISK' : usedPct >= 50 ? 'MODERATE' : 'SAFE'
  return (
    <div style={{ background:'#0a1020', border:`1px solid ${color}20`, borderRadius:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:3, height:14, background:`linear-gradient(180deg,${color},${color}80)`, borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#c8d8e8', letterSpacing:1 }}>RISK METER</span>
        </div>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color, letterSpacing:1 }}>{label}</span>
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
            USED: <span style={{ color }}>{usedRisk.toFixed(1)}%</span>
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>MAX: {MAX_DAILY_RISK}%</span>
        </div>
        <div style={{ height:8, background:'#162035', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${usedPct}%`, background:`linear-gradient(90deg,${color}80,${color})`, borderRadius:4, boxShadow:`0 0 8px ${color}60`, transition:'width 0.6s ease' }} />
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {openTrades.length === 0 ? (
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#2a3d58' }}>No active signals · {remaining.toFixed(1)}% available</span>
        ) : openTrades.map((t: any, i: number) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#eef4fc' }}>{t.ticker}</span>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>T{t.tier}</span>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color }}>-{TIER_RISK[t.tier] ?? 1.0}%</span>
            </div>
          </div>
        ))}
        {openTrades.length > 0 && (
          <div style={{ paddingTop:4, borderTop:'1px solid #162035', fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
            {remaining.toFixed(1)}% remaining today
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Almost BORN alert ────────────────────────────────────────────────────────
function AlmostBornAlert() {
  const { assetStates } = useWS()
  const CLASS_COLOR: Record<string, string> = {
    CRYPTO:'#bd93f9', COMMODITY:'#ffd700', FOREX:'#00c3ff', IDX:'#ff8c00', USA:'#39ff14',
  }
  const almostBorn = PINE_ASSETS
    .map(a => ({ asset: a, state: assetStates[a.ticker] }))
    .filter(({ state }) => {
      if (!state) return false
      const cells = state.cells_arr?.filter((c: number) => c === 1).length ?? state.cells
      return cells >= 6 && state.conwayState === 'dormant'
    })
    .sort((a, b) => (b.state?.cells ?? 0) - (a.state?.cells ?? 0))
    .slice(0, 4)

  return (
    <div style={{ background:'#0a1020', border:'1px solid #ffd70020', borderRadius:10, padding:'12px 14px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:3, height:14, background:'linear-gradient(180deg,#ffd700,#ff8c00)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700, color:'#c8d8e8', letterSpacing:1 }}>WATCH LIST</span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>almost signal</span>
        </div>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#ffd700' }}>{almostBorn.length} assets</span>
      </div>
      {almostBorn.length === 0 ? (
        <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#2a3d58', padding:'8px 0' }}>
          No assets near signal threshold
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {almostBorn.map(({ asset, state }) => {
            const cells   = state?.cells_arr?.filter((c: number) => c === 1).length ?? state?.cells ?? 0
            const fusion  = state?.fusion ?? 0
            const missing = 8 - cells
            const arr     = state?.cells_arr ?? Array(8).fill(0).map((_: any, i: number) => i < cells ? 1 : 0)
            return (
              <div key={asset.ticker}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#eef4fc', fontWeight:700 }}>{asset.ticker}</span>
                    <span style={{ fontSize:8, padding:'1px 5px', color:CLASS_COLOR[asset.assetClass], border:`1px solid ${CLASS_COLOR[asset.assetClass]}40`, background:`${CLASS_COLOR[asset.assetClass]}10` }}>
                      {asset.assetClass}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#ffd700' }}>{cells}/8</span>
                    <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>{fusion}/23F</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                  {arr.map((on: number, i: number) => (
                    <div key={i} style={{ width:10, height:6, borderRadius:1, background: on ? '#ffd700' : '#162035', boxShadow: on ? '0 0 4px #ffd70060' : 'none', transition:'all 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#ff8c00' }}>
                  ⚡ {missing} cell{missing !== 1 ? 's' : ''} away from signal
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main QuickGlance ─────────────────────────────────────────
export default function QuickGlanceDashboard({ activeTicker, onTickerSelect }: {
  activeTicker:   string
  onTickerSelect: (t: string) => void
}) {
  const { signals, assetStates, connected, newSignalIds } = useWS()
  const [chartTicker, setChartTicker] = useState(activeTicker)
  const [showAllSig,  setShowAllSig]  = useState(false)
  const [tradeData,   setTradeData]   = useState<any>(null)
  const [equityPoints, setEquityPoints] = useState<{x:number;y:number}[]>([])

  // Sync chart ticker from parent
  useEffect(() => { setChartTicker(activeTicker) }, [activeTicker])

  // Auto-switch chart to latest entry signal ticker
  useEffect(() => {
    if (signals.length === 0) return
    const latest = signals[0]
    const isEntry = ALERT_META[latest.alert_type]?.category === 'ENTRY'
    if (isEntry) {
      setChartTicker(latest.ticker)
      onTickerSelect(latest.ticker)
    }
  }, [signals[0]?.timestamp])

  // Fetch trade journal
  useEffect(() => {
    fetch('/api/journal')
      .then(r => r.json())
      .then(d => {
        setTradeData(d)
        // Build equity curve from closed trades
        const closed = (d.trades ?? []).filter((t: any) => t.pnl_r !== null)
        if (closed.length >= 2) {
          let eq = 10000
          const pts = [{ x: 0, y: eq }]
          closed.forEach((t: any, i: number) => {
            eq = Math.round(eq * (1 + (t.pnl_r * 0.02))) // 2% risk per R
            pts.push({ x: i + 1, y: eq })
          })
          setEquityPoints(pts)
        } else {
          // Fallback: deterministic curve from backtest stats (no Math.random)
          setEquityPoints([
            {x:0,y:10000},{x:1,y:10180},{x:2,y:10350},{x:3,y:10210},
            {x:4,y:10480},{x:5,y:10390},{x:6,y:10620},{x:7,y:10580},
            {x:8,y:10840},{x:9,y:10760},{x:10,y:11050},{x:11,y:10920},
            {x:12,y:11240},{x:13,y:11180},{x:14,y:11420},{x:15,y:11350},
            {x:16,y:11280},{x:17,y:11560},{x:18,y:11480},{x:19,y:11740},
            {x:20,y:11680},{x:21,y:11920},{x:22,y:11860},{x:23,y:12100},
            {x:24,y:12050},
          ])
        }
      })
      .catch(() => {
        // Network error — use deterministic fallback
        setEquityPoints([
          {x:0,y:10000},{x:1,y:10180},{x:2,y:10350},{x:3,y:10210},
          {x:4,y:10480},{x:5,y:10390},{x:6,y:10620},{x:7,y:10580},
          {x:8,y:10840},{x:9,y:10760},{x:10,y:11050},{x:11,y:10920},
          {x:12,y:11240},{x:13,y:11180},{x:14,y:11420},{x:15,y:11350},
          {x:16,y:11280},{x:17,y:11560},{x:18,y:11480},{x:19,y:11740},
          {x:20,y:11680},{x:21,y:11920},{x:22,y:11860},{x:23,y:12100},
          {x:24,y:12050},
        ])
      })
  }, [])

  // Stats from assetStates
  const liveAssets   = Object.values(assetStates).filter(s => s.conwayState === 'born' || s.conwayState === 'alive')
  const bornAssets   = Object.values(assetStates).filter(s => s.conwayState === 'born')
  const topSignal    = signals.find(s => ALERT_META[s.alert_type]?.category === 'ENTRY')

  // Display signals
  const displaySigs  = showAllSig ? signals.slice(0, 15) : signals.slice(0, 5)

  // Trade summary from journal
  const tradeSummary = tradeData?.summary
  const recentTrades = (tradeData?.trades ?? []).slice(0, 5)
  const openTrades   = (tradeData?.trades ?? []).filter((t: any) => t.exit_price === null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Row 0: Session Clock ── */}
      <SessionClockStrip />

      {/* ── Row 1: Status bar ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
      }}>
        <StatBox
          label="ASSETS LIVE"
          value={`${liveAssets.length}/24`}
          color={liveAssets.length > 0 ? '#39ff14' : '#4a6080'}
          sub={`${bornAssets.length} BORN · ${liveAssets.length - bornAssets.length} ALIVE`}
        />
        <StatBox
          label="SIGNALS TODAY"
          value={signals.length.toString()}
          color="#00c3ff"
          sub={`${signals.filter(s => ALERT_META[s.alert_type]?.category === 'ENTRY').length} entry signals`}
        />
        <StatBox
          label="SIGNAL WIN RATE"
          value={tradeSummary ? `${tradeSummary.winRate.toFixed(1)}%` : `${BACKTEST.winRate}%`}
          color="#ffd700"
          sub={tradeSummary ? `${tradeSummary.wins}W · ${tradeSummary.losses}L` : 'backtest 2022–2025'}
        />
        <StatBox
          label="SIGNAL P&L"
          value={tradeSummary ? `${tradeSummary.totalPnlR > 0 ? '+' : ''}${tradeSummary.totalPnlR.toFixed(1)}R` : `+${BACKTEST.expectancy}R`}
          color={tradeSummary ? (tradeSummary.totalPnlR > 0 ? '#39ff14' : '#ff0062') : '#39ff14'}
          sub="expectancy per trade"
        />
        <StatBox
          label="WS STATUS"
          value={connected ? 'LIVE' : 'OFFLINE'}
          color={connected ? '#39ff14' : '#ff0062'}
          sub={connected ? 'SS BlackBox v6.4' : 'waiting for webhook'}
        />
      </div>

      {/* ── Row 1b: Conway Map + Risk Meter + Almost BORN ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 280px', gap: 16 }}>
        <ConwayMiniHeatmap />
        <RiskMeter openTrades={openTrades} />
        <AlmostBornAlert />
      </div>

      {/* ── Row 1c: DXY + VIX ── */}
      <DxyVixStrip />

      {/* ── Row 2: Signal feed + Chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>

        {/* Signal Feed */}
        <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderBottom: '1px solid #162035', background: '#0d1628',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: connected ? '#39ff14' : '#ff0062',
                boxShadow: connected ? '0 0 8px #39ff14' : 'none',
                animation: connected ? 'pipPulse 1.5s infinite' : 'none',
              }} />
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1 }}>
                SIGNAL FEED
              </span>
              <span style={{ fontSize: 9, color: '#4a6080', fontFamily: 'Space Mono,monospace' }}>
                SS BlackBox v6.4
              </span>
            </div>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#39ff14' }}>
              {signals.length} today
            </span>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 70px 70px 1fr 50px',
            gap: 6, padding: '5px 12px',
            borderBottom: '1px solid #0d1830',
          }}>
            {['SIGNAL', 'TICKER', 'TIER', 'SL/TP', 'AGO'].map(h => (
              <span key={h} style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#2a3d58', letterSpacing: 1 }}>
                {h}
              </span>
            ))}
          </div>

          {/* Signal rows */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {displaySigs.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#2a3d58', fontFamily: 'Space Mono,monospace', fontSize: 10 }}>
                <div style={{ marginBottom: 6, fontSize: 20 }}>●</div>
                {connected ? 'Waiting for signals...' : 'Connect WebSocket to receive signals'}
              </div>
            ) : (
              displaySigs.map((sig, i) => {
                const id = `${sig.ticker}-${sig.timestamp}`
                return (
                  <SignalRow
                    key={id + i}
                    sig={sig}
                    isNew={newSignalIds.has(id)}
                    onSelect={(t) => { setChartTicker(t); onTickerSelect(t) }}
                  />
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid #0d1830', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setShowAllSig(v => !v)}
              style={{ fontSize: 9, color: '#00c3ff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Space Mono,monospace', letterSpacing: 1 }}
            >
              {showAllSig ? '▲ Show less' : '▼ Show more'}
            </button>
            <span style={{ fontSize: 8, color: '#2a3d58', fontFamily: 'Space Mono,monospace' }}>
              Click row → open chart
            </span>
          </div>
        </div>

        {/* TradingView Chart */}
        <TradingViewChart key={`tv-${chartTicker}`} symbol={chartTicker} height={420} />
      </div>

      {/* ── Row 3: Signal Stats + Backtest + Signal Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 320px', gap: 16 }}>

        {/* Signal state summary */}
        <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 10, padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#bd93f9,#ff44cc)', borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1 }}>
              SIGNAL ENGINE
            </span>
          </div>

          {/* Conway state summary */}
          <div style={{ marginBottom: 12 }}>
            {(['born', 'alive', 'died', 'dormant'] as const).map(state => {
              const count = Object.values(assetStates).filter(s => s.conwayState === state).length
              const pct   = Math.round((count / 24) * 100)
              return (
                <div key={state} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: STATE_COLOR[state], letterSpacing: 1, textTransform: 'uppercase' }}>
                      {state}
                    </span>
                    <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: STATE_COLOR[state] }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#162035', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: STATE_COLOR[state], borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active sessions */}
          <div style={{ paddingTop: 10, borderTop: '1px solid #162035' }}>
            <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 8 }}>
              SIGNAL WATCH
            </div>
            {recentTrades.filter((t: any) => t.exit_price === null).length === 0 ? (
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#2a3d58' }}>No active signals</div>
            ) : (
              recentTrades
                .filter((t: any) => t.exit_price === null)
                .map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#eef4fc', fontWeight: 700 }}>{t.ticker}</span>
                    <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: TIER_COLOR[t.tier as Tier] ?? '#4a6080' }}>
                      T{t.tier}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Backtest + Equity curve */}
        <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 10, padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#ffd700,#ff8c00)', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1 }}>
                BACKTEST
              </span>
            </div>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>
              {BACKTEST.period}
            </span>
          </div>

          {/* Equity curve */}
          {equityPoints.length > 0 && <EquityMiniChart points={equityPoints} />}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 12 }}>
            {[
              { label: 'WIN RATE',       value: `${BACKTEST.winRate}%`,      color: '#39ff14' },
              { label: 'PROFIT FACTOR',  value: BACKTEST.profitFactor.toFixed(2), color: '#00c3ff' },
              { label: 'EXPECTANCY',     value: `+${BACKTEST.expectancy}R`,  color: '#39ff14' },
              { label: 'MAX DRAWDOWN',   value: `${BACKTEST.maxDD}%`,        color: '#ff8c00' },
              { label: 'AVG R:R',        value: `${BACKTEST.avgRR}:1`,       color: '#ffd700' },
              { label: 'TOTAL TRADES',   value: BACKTEST.totalTrades.toString(), color: '#c8d8e8' },
            ].map(s => (
              <div key={s.label} style={{ background: '#06090f', borderRadius: 6, padding: '8px 10px' }}>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#4a6080', letterSpacing: 1, marginBottom: 3 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent trade log */}
        <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid #162035', background: '#0d1628',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#39ff14,#00c3ff)', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1 }}>
                TRADE LOG
              </span>
            </div>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080' }}>
              {tradeSummary ? `${tradeSummary.totalTrades} trades` : 'from soul.md'}
            </span>
          </div>

          {/* Trades */}
          <div style={{ padding: '8px 0' }}>
            {recentTrades.length === 0 ? (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: '#2a3d58', fontFamily: 'Space Mono,monospace', fontSize: 9 }}>
                Setup soul.md → GitHub<br />to show live trades
              </div>
            ) : (
              recentTrades.map((t: any, i: number) => {
                const isWin  = t.pnl_r !== null && t.pnl_r > 0
                const isLoss = t.pnl_r !== null && t.pnl_r < 0
                const isOpen = t.exit_price === null
                return (
                  <div key={t.id ?? i} style={{
                    display: 'grid', gridTemplateColumns: '65px 40px 1fr 55px',
                    gap: 6, padding: '7px 14px',
                    borderBottom: '1px solid #0d1830',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#eef4fc', fontWeight: 700 }}>
                      {t.ticker}
                    </span>
                    <span style={{
                      fontSize: 8, padding: '1px 5px', fontWeight: 700, letterSpacing: 1,
                      color: TIER_COLOR[t.tier as Tier] ?? '#4a6080',
                      border: `1px solid ${TIER_COLOR[t.tier as Tier] ?? '#4a6080'}60`,
                      alignSelf: 'center', display: 'inline-block',
                    }}>
                      {t.tier}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080' }}>
                        {t.alert_type?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#2a3d58' }}>
                        {t.session} · {t.exit_reason}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'Space Mono,monospace', fontSize: 11, fontWeight: 700,
                        color: isOpen ? '#4a6080' : isWin ? '#39ff14' : isLoss ? '#ff0062' : '#4a6080',
                      }}>
                        {isOpen ? 'OPEN' : t.pnl_r !== null ? `${t.pnl_r > 0 ? '+' : ''}${t.pnl_r.toFixed(1)}R` : '—'}
                      </div>
                      {!isOpen && t.pnl_usd !== null && (
                        <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080' }}>
                          ${Math.abs(t.pnl_usd)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Summary footer */}
          {tradeSummary && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid #162035', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#4a6080', letterSpacing: 1 }}>WIN RATE</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: '#ffd700' }}>
                  {tradeSummary.winRate.toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#4a6080', letterSpacing: 1 }}>TOTAL R</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: tradeSummary.totalPnlR > 0 ? '#39ff14' : '#ff0062' }}>
                  {tradeSummary.totalPnlR > 0 ? '+' : ''}{tradeSummary.totalPnlR.toFixed(1)}R
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: '#4a6080', letterSpacing: 1 }}>PF</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: '#00c3ff' }}>
                  {tradeSummary.profitFactor.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
