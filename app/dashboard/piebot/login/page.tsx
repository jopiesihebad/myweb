'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────
//  pieBot Private Dashboard — /dashboard/piebot
//  PRIVATE: Only accessible by creator (ELITE tier)
//  Shows: Bot status, positions, equity curve, calendar journal
//  All trade data from Supabase piebot_trades table
//  Falls back to mock data if Supabase unavailable
// ─────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────
type BotMode    = 'PAPER' | 'LIVE'
type BotStatus  = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'EMERGENCY_STOP'
type PosState   = 'FLAT' | 'LONG' | 'SHORT' | 'CLOSING'
type Direction  = 'LONG' | 'SHORT'
type BiasState  = 'BULLISH' | 'BEARISH' | 'NEUTRAL'

type Position = {
  ticker:       string
  state:        PosState
  direction?:   Direction
  entry?:       number
  current?:     number
  sl?:          number
  tp?:          number
  unrealPnl?:   number
  unrealR?:     number
  durationMin?: number
  signal?:      string
  tier?:        string
  bias4h:       BiasState
  cells?:       number
  lastSignal?:  string
}

type Trade = {
  id:          string
  ticker:      string
  direction:   Direction
  entry_price: number
  exit_price:  number | null
  sl_price:    number
  tp_price:    number
  entry_signal: string
  exit_signal:  string | null
  entry_time:   string
  exit_time:    string | null
  leverage:     number
  tier:         string
  pnl_usd:      number | null
  r_realized:   number | null
  cells:        number
  fusion:       number
  timeframe:    string
  session:      string
  mode:         BotMode
  skip_reason?: string
  is_skip?:     boolean
}

type SignalLog = {
  id:        string
  time:      string
  type:      'RECEIVED' | 'EXECUTED' | 'SKIPPED' | 'EXIT' | 'HEARTBEAT' | 'ERROR'
  message:   string
  ticker?:   string
  direction?: string
  detail?:   string
}

type DayStats = {
  date:        string
  trades:      number
  wins:        number
  losses:      number
  totalR:      number
  totalUsd:    number
  bestTrade?:  string
  sessions:    string[]
  signals:     string[]
}

type Heartbeat = {
  timestamp:     string
  open_positions: number
  daily_pnl:     number
  paper_capital: number
  status:        BotStatus
}

// ── Colors ────────────────────────────────────────────────────
const C = {
  bg:      '#04070f',
  panel:   '#080d1a',
  panel2:  '#0a1020',
  border:  '#162035',
  border2: '#1e2f4a',
  cyan:    '#00c3ff',
  lime:    '#39ff14',
  gold:    '#ffd700',
  red:     '#ff0062',
  orange:  '#ff8c00',
  purple:  '#bd93f9',
  mag:     '#ff44cc',
  gray:    '#4a6080',
  gray2:   '#2a3d58',
  white:   '#eef4fc',
  muted:   '#c8d8e8',
}

const TIER_COLOR: Record<string, string> = {
  S: C.lime, A: C.cyan, B: C.gold, C: C.orange,
}

const ASSETS = ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'SOLUSDT']

// ── Mock data ─────────────────────────────────────────────────
const MOCK_POSITIONS: Position[] = [
  { ticker:'BTCUSDT', state:'SHORT',  direction:'SHORT', entry:71234, current:70100, sl:72850, tp:69134, unrealPnl:892, unrealR:1.27, durationMin:262, signal:'DOOM_SELL', tier:'A', bias4h:'BEARISH', cells:4, lastSignal:'13:42' },
  { ticker:'ETHUSDT', state:'FLAT',   bias4h:'NEUTRAL',  lastSignal:'2h ago' },
  { ticker:'XAUUSD',  state:'LONG',   direction:'LONG',  entry:2891, current:2918, sl:2843, tp:2954, unrealPnl:127, unrealR:0.56, durationMin:88, signal:'CONWAY_BUY', tier:'A', bias4h:'BULLISH', cells:6, lastSignal:'10:15' },
  { ticker:'SOLUSDT', state:'FLAT',   bias4h:'BEARISH',  lastSignal:'5h ago' },
]

const MOCK_TRADES: Trade[] = [
  { id:'t-001', ticker:'BTCUSDT', direction:'SHORT', entry_price:71234, exit_price:null,  sl_price:72850, tp_price:69134, entry_signal:'DOOM_SELL', exit_signal:null,         entry_time:'2026-03-28T10:42:00Z', exit_time:null,                   leverage:5, tier:'A', pnl_usd:null,  r_realized:null,  cells:4, fusion:13, timeframe:'60',  session:'LONDON', mode:'PAPER' },
  { id:'t-002', ticker:'XAUUSD',  direction:'LONG',  entry_price:2891,  exit_price:null,  sl_price:2843,  tp_price:2954,  entry_signal:'CONWAY_BUY', exit_signal:null,         entry_time:'2026-03-28T07:15:00Z', exit_time:null,                   leverage:5, tier:'A', pnl_usd:null,  r_realized:null,  cells:6, fusion:19, timeframe:'60',  session:'LONDON', mode:'PAPER' },
  { id:'t-003', ticker:'ETHUSDT', direction:'LONG',  entry_price:3210,  exit_price:3350,  sl_price:3140,  tp_price:3350,  entry_signal:'CONWAY_BUY', exit_signal:'TP_HIT',     entry_time:'2026-03-27T09:30:00Z', exit_time:'2026-03-27T14:22:00Z', leverage:5, tier:'A', pnl_usd:140,   r_realized:2.0,   cells:5, fusion:17, timeframe:'60',  session:'LONDON', mode:'PAPER' },
  { id:'t-004', ticker:'BTCUSDT', direction:'LONG',  entry_price:69400, exit_price:71200, sl_price:68500, tp_price:71800, entry_signal:'GOLD_BUY',   exit_signal:'LH_EXIT',    entry_time:'2026-03-26T08:00:00Z', exit_time:'2026-03-27T06:10:00Z', leverage:3, tier:'B', pnl_usd:289,   r_realized:2.0,   cells:5, fusion:14, timeframe:'240', session:'NY',     mode:'PAPER' },
  { id:'t-005', ticker:'SOLUSDT', direction:'LONG',  entry_price:95.4,  exit_price:93.1,  sl_price:93.1,  tp_price:100.3, entry_signal:'BBP_ENTRY_BUY', exit_signal:'SL_HIT', entry_time:'2026-03-25T13:00:00Z', exit_time:'2026-03-25T18:45:00Z', leverage:3, tier:'B', pnl_usd:-46,   r_realized:-1.0,  cells:3, fusion:9,  timeframe:'60',  session:'NY',     mode:'PAPER' },
  { id:'t-006', ticker:'XAUUSD',  direction:'SHORT', entry_price:2912,  exit_price:2956,  sl_price:2843,  tp_price:2956,  entry_signal:'DOOM_SELL',  exit_signal:'TP_HIT',     entry_time:'2026-03-24T07:00:00Z', exit_time:'2026-03-24T11:30:00Z', leverage:5, tier:'A', pnl_usd:88,    r_realized:2.0,   cells:4, fusion:13, timeframe:'60',  session:'LONDON', mode:'PAPER' },
  { id:'s-001', ticker:'SOLUSDT', direction:'LONG',  entry_price:0,     exit_price:null,  sl_price:0,     tp_price:0,     entry_signal:'BBP_ENTRY_BUY', exit_signal:null,      entry_time:'2026-03-28T11:55:00Z', exit_time:null,                   leverage:0, tier:'B', pnl_usd:null,  r_realized:null,  cells:3, fusion:9,  timeframe:'15',  session:'NY',     mode:'PAPER', is_skip:true, skip_reason:'4H bias BEARISH — counter-trend LONG blocked' },
]

const MOCK_LOGS: SignalLog[] = [
  { id:'l-1', time:'14:22', type:'HEARTBEAT', message:'3 positions open · Daily PnL +$1,019 · Status ACTIVE' },
  { id:'l-2', time:'13:55', type:'SKIPPED',   message:'BBP_ENTRY_BUY SOLUSDT 15M', ticker:'SOLUSDT', direction:'LONG', detail:'4H bias BEARISH — counter-trend LONG blocked' },
  { id:'l-3', time:'13:42', type:'EXECUTED',  message:'DOOM_SELL SHORT BTCUSDT @ $71,234', ticker:'BTCUSDT', direction:'SHORT', detail:'SL $72,850 · TP $69,134 · Tier A 5x' },
  { id:'l-4', time:'13:42', type:'RECEIVED',  message:'DOOM_SELL BTCUSDT 1H · R:R 1.87 ✓ · Squeeze false ✓' },
  { id:'l-5', time:'10:15', type:'EXECUTED',  message:'CONWAY_BUY LONG XAUUSD @ $2,891', ticker:'XAUUSD', direction:'LONG', detail:'SL $2,843 · TP $2,954 · Tier A 5x' },
  { id:'l-6', time:'09:00', type:'HEARTBEAT', message:'1 position open · Daily PnL +$127 · Status ACTIVE' },
]

function buildEquityPoints(trades: Trade[], startCapital: number) {
  let equity = startCapital
  const points: { date: string; equity: number; trade?: Trade }[] = [
    { date: '2026-03-24', equity }
  ]
  const closed = trades
    .filter(t => !t.is_skip && t.exit_time && t.pnl_usd !== null)
    .sort((a, b) => new Date(a.exit_time!).getTime() - new Date(b.exit_time!).getTime())
  for (const t of closed) {
    equity += (t.pnl_usd ?? 0)
    points.push({ date: t.exit_time!.slice(0, 10), equity, trade: t })
  }
  return points
}

function buildCalendar(trades: Trade[]) {
  const days: Record<string, DayStats> = {}
  trades.filter(t => !t.is_skip && t.exit_time).forEach(t => {
    const d = t.exit_time!.slice(0, 10)
    if (!days[d]) days[d] = { date: d, trades: 0, wins: 0, losses: 0, totalR: 0, totalUsd: 0, sessions: [], signals: [] }
    days[d].trades++
    if ((t.r_realized ?? 0) > 0) days[d].wins++
    if ((t.r_realized ?? 0) < 0) days[d].losses++
    days[d].totalR   += t.r_realized ?? 0
    days[d].totalUsd += t.pnl_usd ?? 0
    if (!days[d].sessions.includes(t.session)) days[d].sessions.push(t.session)
    if (!days[d].signals.includes(t.entry_signal)) days[d].signals.push(t.entry_signal)
  })
  return days
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  return { offset, daysInMonth }
}

// ── Sub-components ────────────────────────────────────────────

function Mono({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: 'JetBrains Mono,monospace', ...style }}>{children}</span>
}

function Label({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: C.gray, ...style }}>{children}</span>
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', ...style }}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, sub, accent = C.cyan }: { icon?: string; title: string; sub?: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ width: 3, height: 14, background: accent, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>{title}</span>
      {sub && <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: C.gray }}>{sub}</span>}
    </div>
  )
}

// Position card per asset
function PositionCard({ pos }: { pos: Position }) {
  const isOpen  = pos.state !== 'FLAT' && pos.state !== 'CLOSING'
  const dirCol  = pos.direction === 'LONG' ? C.lime : pos.direction === 'SHORT' ? C.red : C.gray
  const stateCol = pos.state === 'LONG' ? C.lime : pos.state === 'SHORT' ? C.red : pos.state === 'CLOSING' ? C.orange : C.gray2
  const biasCol  = pos.bias4h === 'BULLISH' ? C.lime : pos.bias4h === 'BEARISH' ? C.red : C.gray
  const pnlPos   = (pos.unrealPnl ?? 0) >= 0

  return (
    <Card style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stateCol, opacity: isOpen ? 1 : 0.3 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: C.white }}>{pos.ticker}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
            <span style={{ fontSize: 8, padding: '1px 6px', background: `${stateCol}20`, border: `1px solid ${stateCol}60`, color: stateCol, fontFamily: 'Space Mono,monospace', letterSpacing: 1 }}>
              {pos.state}
            </span>
            {pos.tier && <span style={{ fontSize: 8, padding: '1px 6px', background: `${TIER_COLOR[pos.tier] ?? C.gray}20`, border: `1px solid ${TIER_COLOR[pos.tier] ?? C.gray}60`, color: TIER_COLOR[pos.tier] ?? C.gray, fontFamily: 'Space Mono,monospace' }}>T{pos.tier}</span>}
          </div>
        </div>
        {isOpen && pos.unrealPnl !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 15, fontWeight: 700, color: pnlPos ? C.lime : C.red }}>
              {pnlPos ? '+' : ''}${Math.abs(pos.unrealPnl).toFixed(0)}
            </div>
            <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: pnlPos ? C.lime : C.red }}>
              {pnlPos ? '+' : ''}{pos.unrealR?.toFixed(2)}R
            </div>
          </div>
        )}
      </div>

      {isOpen ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            ['Entry', `$${pos.entry?.toLocaleString()}`, C.muted],
            ['Current', `$${pos.current?.toLocaleString()}`, dirCol],
            ['SL', `$${pos.sl?.toLocaleString()}`, C.red],
            ['TP', `$${pos.tp?.toLocaleString()}`, C.lime],
          ].map(([l, v, c]) => (
            <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <Label>{l as string}</Label>
              <Mono style={{ fontSize: 10, color: c as string }}>{v as string}</Mono>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2, paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
            <Label>Duration</Label>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: C.gray }}>
              {pos.durationMin ? `${Math.floor(pos.durationMin / 60)}h ${pos.durationMin % 60}m` : '—'}
            </span>
          </div>
          {pos.signal && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <Label>Signal</Label>
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: C.purple }}>{pos.signal}</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Label>4H Bias</Label>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: biasCol }}>{pos.bias4h}</span>
          </div>
          {pos.cells !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Label>Conway</Label>
              <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: C.muted }}>{pos.cells}/8</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Label>Last signal</Label>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: C.gray2 }}>{pos.lastSignal ?? '—'}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

// Equity Curve SVG
function EquityCurve({ points, capital }: { points: { date: string; equity: number; trade?: Trade }[]; capital: number }) {
  const [hover, setHover] = useState<number | null>(null)
  if (points.length < 2) return <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray, fontSize: 11 }}>No closed trades yet</div>

  const W = 800, H = 160, PAD = { t: 12, r: 16, b: 28, l: 52 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b

  const values   = points.map(p => p.equity)
  const minV     = Math.min(...values, capital) * 0.995
  const maxV     = Math.max(...values, capital) * 1.005
  const range    = maxV - minV || 1

  const x = (i: number) => PAD.l + (i / (points.length - 1)) * iW
  const y = (v: number) => PAD.t + iH - ((v - minV) / range) * iH

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.equity).toFixed(1)}`).join(' ')
  const areaD = pathD + ` L${x(points.length - 1)},${(PAD.t + iH).toFixed(1)} L${PAD.l},${(PAD.t + iH).toFixed(1)} Z`

  // Drawdown area
  let peak = points[0].equity
  const ddPath = points.map((p, i) => {
    if (p.equity > peak) peak = p.equity
    return { x: x(i), yTop: y(peak), yBot: y(p.equity), dd: peak - p.equity }
  })

  const breakY  = y(capital)
  const currentE = points[points.length - 1].equity
  const totalPnl = currentE - capital
  const pnlPos   = totalPnl >= 0

  // Y axis ticks
  const ticks = Array.from({ length: 4 }, (_, i) => minV + (range * i) / 3)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div><Label>Start</Label> <Mono style={{ fontSize: 11, color: C.muted }}>${capital.toLocaleString()}</Mono></div>
          <div><Label>Current</Label> <Mono style={{ fontSize: 11, color: pnlPos ? C.lime : C.red }}>${currentE.toFixed(0)}</Mono></div>
          <div><Label>Total</Label> <Mono style={{ fontSize: 11, color: pnlPos ? C.lime : C.red }}>{pnlPos ? '+' : ''}${totalPnl.toFixed(0)} ({((totalPnl / capital) * 100).toFixed(1)}%)</Mono></div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 20, height: 2, background: C.cyan, display: 'inline-block' }} /><Label>Equity</Label></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 20, height: 2, background: `${C.red}60`, display: 'inline-block', borderTop: `2px dashed ${C.red}` }} /><Label>Drawdown</Label></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 20, height: 1, background: C.gray2, display: 'inline-block', borderTop: `1px dashed ${C.gray2}` }} /><Label>Breakeven</Label></span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.cyan} stopOpacity="0.25" />
            <stop offset="100%" stopColor={C.cyan} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.red} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.red} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Y axis ticks */}
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} stroke={C.border} strokeWidth={0.5} strokeDasharray="4,4" />
            <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" fontSize={8} fill={C.gray} fontFamily="Space Mono,monospace">${(v / 1).toFixed(0)}</text>
          </g>
        ))}

        {/* Breakeven line */}
        <line x1={PAD.l} y1={breakY} x2={W - PAD.r} y2={breakY} stroke={C.gray2} strokeWidth={1} strokeDasharray="6,4" />

        {/* Drawdown area */}
        {ddPath.map((p, i) => i === 0 ? null : (
          <rect key={i} x={ddPath[i - 1].x} y={Math.min(p.yTop, ddPath[i-1].yTop)} width={p.x - ddPath[i-1].x} height={Math.max(0, Math.abs(p.yBot - Math.min(p.yTop, ddPath[i-1].yTop)))} fill="url(#ddGrad)" />
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#eqGrad)" />

        {/* Equity line */}
        <path d={pathD} fill="none" stroke={C.cyan} strokeWidth={2} strokeLinejoin="round" />

        {/* Trade dots */}
        {points.map((p, i) => {
          if (!p.trade) return null
          const win = (p.trade.r_realized ?? 0) > 0
          return (
            <circle key={i} cx={x(i)} cy={y(p.equity)} r={4}
              fill={win ? C.lime : C.red} stroke={C.panel} strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
            />
          )
        })}

        {/* Current dot */}
        <circle cx={x(points.length - 1)} cy={y(currentE)} r={5} fill={C.cyan} stroke={C.panel} strokeWidth={2} />

        {/* X axis dates */}
        {[0, Math.floor(points.length / 2), points.length - 1].map(i => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={8} fill={C.gray} fontFamily="Space Mono,monospace">
            {points[i].date.slice(5)}
          </text>
        ))}

        {/* Hover tooltip */}
        {hover !== null && points[hover]?.trade && (() => {
          const p  = points[hover]
          const t  = p.trade!
          const tx = Math.min(x(hover), W - 140)
          const ty = Math.max(y(p.equity) - 60, PAD.t)
          const win = (t.r_realized ?? 0) > 0
          return (
            <g>
              <rect x={tx} y={ty} width={130} height={52} rx={4} fill={C.panel2} stroke={C.border} strokeWidth={1} />
              <text x={tx + 6} y={ty + 13}  fontSize={8} fill={C.muted} fontFamily="Space Mono,monospace">{t.ticker} {t.direction}</text>
              <text x={tx + 6} y={ty + 25}  fontSize={8} fill={win ? C.lime : C.red} fontFamily="Space Mono,monospace">{win ? '+' : ''}{t.r_realized?.toFixed(2)}R  ${t.pnl_usd ? (t.pnl_usd > 0 ? '+' : '') + t.pnl_usd : '—'}</text>
              <text x={tx + 6} y={ty + 37}  fontSize={7} fill={C.gray} fontFamily="Space Mono,monospace">{t.exit_signal ?? '—'}</text>
              <text x={tx + 6} y={ty + 48}  fontSize={7} fill={C.gray2} fontFamily="Space Mono,monospace">Eq: ${p.equity.toFixed(0)}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// Calendar Journal
function CalendarJournal({ trades }: { trades: Trade[] }) {
  const today    = new Date()
  const [viewY,  setViewY]  = useState(today.getFullYear())
  const [viewM,  setViewM]  = useState(today.getMonth())
  const [selDay, setSelDay] = useState<string | null>(null)

  const dayStats   = buildCalendar(trades)
  const { offset, daysInMonth } = getMonthDays(viewY, viewM)

  const monthKey = `${viewY}-${String(viewM + 1).padStart(2, '0')}`
  const monthDays = Object.values(dayStats).filter(d => d.date.startsWith(monthKey))
  const monthTrades = monthDays.reduce((a, d) => a + d.trades, 0)
  const monthR      = monthDays.reduce((a, d) => a + d.totalR, 0)
  const monthUsd    = monthDays.reduce((a, d) => a + d.totalUsd, 0)
  const monthWins   = monthDays.reduce((a, d) => a + d.wins, 0)
  const monthLosses = monthDays.reduce((a, d) => a + d.losses, 0)

  const prevMonth = () => { if (viewM === 0) { setViewY(y => y - 1); setViewM(11) } else setViewM(m => m - 1) }
  const nextMonth = () => { if (viewM === 11) { setViewY(y => y + 1); setViewM(0) } else setViewM(m => m + 1) }

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  const selStats = selDay ? dayStats[selDay] : null

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.gray, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: 10 }}>←</button>
        <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: C.muted }}>{MONTH_NAMES[viewM]} {viewY}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.gray, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: 10 }}>→</button>
      </div>

      {/* DOW headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
        {DOW.map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'Space Mono,monospace', fontSize: 8, color: C.gray, letterSpacing: 1, padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {/* Empty cells for offset */}
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day  = i + 1
          const dateStr = `${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const stats   = dayStats[dateStr]
          const isToday = dateStr === today.toISOString().slice(0, 10)
          const isSel   = selDay === dateStr
          const hasData = !!stats && stats.trades > 0

          let bg = C.panel2
          let borderCol = C.border
          let textCol   = C.gray2

          if (hasData) {
            if (stats.totalR > 0) {
              bg = `${C.lime}12`; borderCol = `${C.lime}40`; textCol = C.muted
            } else if (stats.totalR < 0) {
              bg = `${C.red}12`; borderCol = `${C.red}40`; textCol = C.muted
            } else {
              bg = `${C.gold}10`; borderCol = `${C.gold}40`; textCol = C.muted
            }
          }
          if (isToday) borderCol = C.cyan
          if (isSel)   borderCol = C.purple

          return (
            <div
              key={day}
              onClick={() => setSelDay(isSel ? null : dateStr)}
              style={{
                background: bg,
                border: `1px solid ${borderCol}`,
                borderRadius: 6,
                padding: '6px 4px',
                minHeight: 52,
                cursor: hasData ? 'pointer' : 'default',
                transition: 'border-color 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: isToday ? C.cyan : textCol }}>{day}</div>
              {hasData && (
                <>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, fontWeight: 700, color: stats.totalR >= 0 ? C.lime : C.red }}>
                    {stats.totalR >= 0 ? '+' : ''}{stats.totalR.toFixed(1)}R
                  </div>
                  <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: C.gray }}>
                    {stats.wins}W·{stats.losses}L
                  </div>
                </>
              )}
              {!hasData && day <= today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear() && (
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 7, color: C.gray2 }}>—</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Monthly summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
        {[
          { l: 'Trades',    v: monthTrades.toString(),                         c: C.muted },
          { l: 'Win Rate',  v: monthTrades ? `${((monthWins / monthTrades) * 100).toFixed(0)}%` : '—', c: monthWins > monthLosses ? C.lime : C.red },
          { l: 'Wins',      v: monthWins.toString(),                           c: C.lime  },
          { l: 'Total R',   v: monthR >= 0 ? `+${monthR.toFixed(1)}R` : `${monthR.toFixed(1)}R`, c: monthR >= 0 ? C.lime : C.red },
          { l: 'P&L',       v: monthUsd >= 0 ? `+$${monthUsd.toFixed(0)}` : `-$${Math.abs(monthUsd).toFixed(0)}`, c: monthUsd >= 0 ? C.lime : C.red },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center', background: C.panel2, borderRadius: 6, padding: '8px 4px' }}>
            <Label style={{ display: 'block', marginBottom: 4 }}>{s.l}</Label>
            <Mono style={{ fontSize: 13, fontWeight: 700, color: s.c }}>{s.v}</Mono>
          </div>
        ))}
      </div>

      {/* Day drill-down */}
      {selStats && (
        <div style={{ marginTop: 12, background: `${C.purple}10`, border: `1px solid ${C.purple}40`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: C.purple }}>{selDay}</span>
            <button onClick={() => setSelDay(null)} style={{ background: 'none', border: 'none', color: C.gray, cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { l: 'Trades',   v: selStats.trades.toString() },
              { l: 'Wins',     v: `${selStats.wins}W / ${selStats.losses}L` },
              { l: 'Total R',  v: `${selStats.totalR >= 0 ? '+' : ''}${selStats.totalR.toFixed(2)}R`, c: selStats.totalR >= 0 ? C.lime : C.red },
              { l: 'P&L',      v: `${selStats.totalUsd >= 0 ? '+' : ''}$${selStats.totalUsd.toFixed(0)}`, c: selStats.totalUsd >= 0 ? C.lime : C.red },
              { l: 'Sessions', v: selStats.sessions.join(' · ') || '—' },
              { l: 'Signals',  v: selStats.signals.slice(0,2).join(', ') || '—' },
            ].map(s => (
              <div key={s.l}>
                <Label style={{ display: 'block', marginBottom: 2 }}>{s.l}</Label>
                <Mono style={{ fontSize: 10, color: (s as any).c ?? C.muted }}>{s.v}</Mono>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Signal Feed
function SignalFeed({ logs }: { logs: SignalLog[] }) {
  const typeStyle = {
    RECEIVED:  { col: C.cyan,   icon: '→' },
    EXECUTED:  { col: C.lime,   icon: '✓' },
    SKIPPED:   { col: C.orange, icon: '⊘' },
    EXIT:      { col: C.purple, icon: '←' },
    HEARTBEAT: { col: C.gray,   icon: '♡' },
    ERROR:     { col: C.red,    icon: '!' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 220, overflowY: 'auto' }}>
      {logs.map(log => {
        const s = typeStyle[log.type]
        return (
          <div key={log.id} style={{ display: 'flex', gap: 8, padding: '6px 8px', background: `${s.col}08`, borderLeft: `2px solid ${s.col}50`, borderRadius: '0 4px 4px 0', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: C.gray2, flexShrink: 0, marginTop: 1 }}>{log.time}</span>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: s.col, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <div>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.muted }}>{log.message}</span>
              {log.detail && <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: C.gray, marginTop: 2 }}>{log.detail}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Trade History table
function TradeHistory({ trades }: { trades: Trade[] }) {
  const all = [...trades].sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime()).slice(0, 15)

  function fmt(n: number) { return n > 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : n.toFixed(2) }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Time','Ticker','Dir','Signal','Tier','TF','Entry','Exit','R','P&L','Reason/Skip'].map(h => (
              <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontFamily: 'Space Mono,monospace', fontSize: 7, color: C.gray, letterSpacing: 1, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {all.map(t => {
            const win  = (t.r_realized ?? 0) > 0
            const open = !t.exit_time
            const skip = t.is_skip
            const rowBg = skip ? `${C.orange}06` : 'transparent'
            return (
              <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}22`, background: rowBg }}
                onMouseEnter={e => (e.currentTarget.style.background = skip ? `${C.orange}10` : `${C.panel2}`)}
                onMouseLeave={e => (e.currentTarget.style.background = rowBg)}
              >
                <td style={{ padding: '6px 8px', color: C.gray, fontSize: 8, whiteSpace: 'nowrap' }}>
                  {new Date(t.entry_time).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                </td>
                <td style={{ padding: '6px 8px', color: C.white, fontWeight: 700 }}>{t.ticker}</td>
                <td style={{ padding: '6px 8px', color: t.direction === 'LONG' ? C.lime : C.red, fontWeight: 700 }}>{skip ? '—' : t.direction}</td>
                <td style={{ padding: '6px 8px', color: C.gray, fontSize: 8, whiteSpace: 'nowrap' }}>{t.entry_signal.replace(/_/g,' ')}</td>
                <td style={{ padding: '6px 8px' }}>
                  {!skip && <span style={{ fontSize: 7, padding: '1px 4px', color: TIER_COLOR[t.tier] ?? C.gray, border: `1px solid ${TIER_COLOR[t.tier] ?? C.gray}50` }}>{t.tier}</span>}
                </td>
                <td style={{ padding: '6px 8px', color: C.gray, fontSize: 8 }}>{t.timeframe === '240' ? '4H' : t.timeframe === '60' ? '1H' : '15M'}</td>
                <td style={{ padding: '6px 8px', color: C.muted, whiteSpace: 'nowrap' }}>{skip ? '—' : `$${fmt(t.entry_price)}`}</td>
                <td style={{ padding: '6px 8px', color: open ? C.gray : C.muted, whiteSpace: 'nowrap' }}>{open || skip ? (open ? 'OPEN' : '—') : `$${fmt(t.exit_price!)}`}</td>
                <td style={{ padding: '6px 8px', fontWeight: 700, color: skip ? C.orange : open ? C.gray : win ? C.lime : C.red, whiteSpace: 'nowrap' }}>
                  {skip ? 'SKIP' : open ? '—' : `${win ? '+' : ''}${t.r_realized?.toFixed(2)}R`}
                </td>
                <td style={{ padding: '6px 8px', color: skip ? C.orange : open ? C.gray : win ? C.lime : C.red, whiteSpace: 'nowrap' }}>
                  {skip ? '—' : open ? '—' : `${t.pnl_usd! > 0 ? '+' : ''}$${Math.abs(t.pnl_usd!).toFixed(0)}`}
                </td>
                <td style={{ padding: '6px 8px', color: C.gray, fontSize: 8, maxWidth: 180 }}>
                  {skip ? (t.skip_reason ?? '—') : (t.exit_signal?.replace(/_/g,' ') ?? (open ? 'position open' : '—'))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function PieBotDashboard() {
  const [positions,   setPositions]   = useState<Position[]>(MOCK_POSITIONS)
  const [trades,      setTrades]      = useState<Trade[]>(MOCK_TRADES)
  const [logs,        setLogs]        = useState<SignalLog[]>(MOCK_LOGS)
  const [heartbeat,   setHeartbeat]   = useState<Heartbeat | null>(null)
  const [botStatus,   setBotStatus]   = useState<BotStatus>('ONLINE')
  const [botMode,     setBotMode]     = useState<BotMode>('PAPER')
  const [capital]                     = useState(500)
  const [uptime,      setUptime]      = useState('14h 32m')
  const [dailyPnl,    setDailyPnl]    = useState(1019)
  const [showConfirm, setShowConfirm] = useState(false)
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null)

  // Init Supabase
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    supabaseRef.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    if (!supabaseRef.current) return
    try {
      const { data: tradeData } = await supabaseRef.current
        .from('piebot_trades')
        .select('*')
        .order('entry_time', { ascending: false })
        .limit(100)
      if (tradeData?.length) setTrades(tradeData as Trade[])

      const { data: hbData } = await supabaseRef.current
        .from('piebot_heartbeat')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      if (hbData) {
        setHeartbeat(hbData as Heartbeat)
        setBotStatus(hbData.status)
        setDailyPnl(hbData.daily_pnl)
      }
    } catch {
      // Silently use mock data
    }
  }, [])

  const handleEmergencyStop = async () => {
    setShowConfirm(false)
    setBotStatus('EMERGENCY_STOP')
    try {
      await fetch('/api/piebot/emergency-stop', { method: 'POST' })
    } catch { /* log locally */ }
  }

  const handleResume = async () => {
    setBotStatus('ONLINE')
    try {
      await fetch('/api/piebot/resume', { method: 'POST' })
    } catch { /* log locally */ }
  }

  const handleLogout = async () => {
    await fetch('/api/creator/auth', { method: 'DELETE' })
    window.location.href = '/dashboard/piebot/login'
  }

  const equityPoints  = buildEquityPoints(trades, capital)
  const closedTrades  = trades.filter(t => !t.is_skip && t.exit_time && t.r_realized !== null)
  const openTrades    = trades.filter(t => !t.is_skip && !t.exit_time)
  const skipTrades    = trades.filter(t => t.is_skip)
  const wins          = closedTrades.filter(t => (t.r_realized ?? 0) > 0).length
  const losses        = closedTrades.filter(t => (t.r_realized ?? 0) < 0).length
  const totalR        = closedTrades.reduce((a, t) => a + (t.r_realized ?? 0), 0)
  const winRate       = closedTrades.length ? (wins / closedTrades.length) * 100 : 0
  const grossWin      = closedTrades.filter(t => (t.r_realized ?? 0) > 0).reduce((a, t) => a + (t.r_realized ?? 0), 0)
  const grossLoss     = Math.abs(closedTrades.filter(t => (t.r_realized ?? 0) < 0).reduce((a, t) => a + (t.r_realized ?? 0), 0))
  const profitFactor  = grossLoss > 0 ? grossWin / grossLoss : grossWin
  const skipRate      = (trades.length > 0) ? (skipTrades.length / (trades.length)) * 100 : 0

  const statusColor   = { ONLINE: C.lime, OFFLINE: C.gray, ERROR: C.red, EMERGENCY_STOP: C.orange }[botStatus]
  const dailyPct      = (dailyPnl / capital) * 100
  const drawdownPct   = (dailyPct / 3) * 100  // 3% = max

  const BG = '#04070f'

  return (
    <div style={{ background: BG, minHeight: '100vh', padding: '0 0 40px 0', fontFamily: 'JetBrains Mono,monospace' }}>

      {/* ── Top Status Bar ──────────────────────────────────── */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Bot identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color: C.white, letterSpacing: -0.5 }}>pieBot</span>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: statusColor, border: `1px solid ${statusColor}40`, padding: '1px 7px', borderRadius: 3, letterSpacing: 1 }}>{botStatus}</span>
          </div>
          {/* Mode badge */}
          <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: botMode === 'PAPER' ? C.gold : C.lime, border: `1px solid ${botMode === 'PAPER' ? C.gold : C.lime}40`, padding: '2px 8px', borderRadius: 3 }}>
            {botMode === 'PAPER' ? '● PAPER MODE' : '● LIVE MODE'}
          </span>
          {/* Uptime */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Label>Uptime</Label>
            <Mono style={{ fontSize: 11, color: C.muted }}>{uptime}</Mono>
          </div>
          {/* Last heartbeat */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Label>Last HB</Label>
            <Mono style={{ fontSize: 11, color: C.gray }}>2m ago</Mono>
          </div>
          {/* Daily PnL mini */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <Label>Today</Label>
            <Mono style={{ fontSize: 11, color: dailyPnl >= 0 ? C.lime : C.red }}>
              {dailyPnl >= 0 ? '+' : ''}${dailyPnl.toFixed(0)} ({dailyPct >= 0 ? '+' : ''}{dailyPct.toFixed(1)}%)
            </Mono>
          </div>
        </div>

        {/* Emergency controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {botStatus !== 'EMERGENCY_STOP' ? (
            <button onClick={() => setShowConfirm(true)} style={{
              fontFamily: 'Space Mono,monospace', fontSize: 9, letterSpacing: 1,
              padding: '5px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 700,
              background: `${C.red}15`, border: `1px solid ${C.red}60`, color: C.red,
            }}>
              ⛔ EMERGENCY STOP
            </button>
          ) : (
            <button onClick={handleResume} style={{
              fontFamily: 'Space Mono,monospace', fontSize: 9, letterSpacing: 1,
              padding: '5px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 700,
              background: `${C.lime}15`, border: `1px solid ${C.lime}60`, color: C.lime,
            }}>
              ↺ RESUME BOT
            </button>
          )}
          <button onClick={loadData} style={{
            fontFamily: 'Space Mono,monospace', fontSize: 9, color: C.gray,
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 4,
            padding: '5px 10px', cursor: 'pointer',
          }}>↻</button>
          <button onClick={handleLogout} style={{
            fontFamily: 'Space Mono,monospace', fontSize: 9, color: C.gray,
            background: 'none', border: `1px solid ${C.border}`, borderRadius: 4,
            padding: '5px 10px', cursor: 'pointer', letterSpacing: 1,
          }}>LOGOUT</button>
        </div>
      </div>

      {/* Emergency stop confirmation modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.panel, border: `1px solid ${C.red}60`, borderRadius: 12, padding: '28px 32px', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⛔</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 8 }}>Emergency Stop</div>
            <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 10, color: C.gray, lineHeight: 1.7, marginBottom: 24 }}>
              This will immediately close ALL open positions and halt all signal processing. This action cannot be undone automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowConfirm(false)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.gray, padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: 10 }}>Cancel</button>
              <button onClick={handleEmergencyStop} style={{ background: `${C.red}20`, border: `1px solid ${C.red}`, color: C.red, padding: '8px 20px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Mono,monospace', fontSize: 10, fontWeight: 700 }}>Confirm Stop</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────── */}
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Row 1: Position Cards + Daily PnL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 220px', gap: 12 }}>
          {positions.map(p => <PositionCard key={p.ticker} pos={p} />)}

          {/* Daily PnL meter */}
          <Card>
            <CardHeader title="DAILY P&L" accent={dailyPnl >= 0 ? C.lime : C.red} />
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: dailyPnl >= 0 ? C.lime : C.red, letterSpacing: -1 }}>
                {dailyPnl >= 0 ? '+' : ''}${Math.abs(dailyPnl).toFixed(0)}
              </div>
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 10, color: dailyPnl >= 0 ? C.lime : C.red, marginTop: 2 }}>
                {dailyPct >= 0 ? '+' : ''}{dailyPct.toFixed(2)}%
              </div>
            </div>
            {/* Drawdown progress bar */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Label>Daily limit</Label>
                <Label style={{ color: drawdownPct > 80 ? C.red : drawdownPct > 60 ? C.orange : C.gray }}>{dailyPct.toFixed(1)}% / 3%</Label>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(Math.abs(drawdownPct), 100)}%`,
                  background: drawdownPct > 80 ? C.red : drawdownPct > 60 ? C.orange : C.lime,
                  borderRadius: 3,
                  transition: 'width 0.5s, background 0.3s',
                }} />
              </div>
            </div>
            <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              {[
                { l: 'Open',  v: openTrades.length.toString(), c: C.cyan },
                { l: 'Closed today', v: closedTrades.filter(t => t.exit_time?.startsWith(new Date().toISOString().slice(0,10))).length.toString(), c: C.muted },
                { l: 'Capital', v: `$${capital}`, c: C.gray },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Label>{s.l}</Label>
                  <Mono style={{ fontSize: 10, color: s.c }}>{s.v}</Mono>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 2: Signal Feed + Performance Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>
          <Card>
            <CardHeader icon="⚡" title="SIGNAL FEED" sub="real-time" accent={C.cyan} />
            <SignalFeed logs={logs} />
          </Card>

          <Card>
            <CardHeader icon="◈" title="PERFORMANCE" sub={`${closedTrades.length} closed trades`} accent={C.gold} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'Win Rate',      v: `${winRate.toFixed(1)}%`,          c: winRate >= 60 ? C.lime : C.orange },
                { l: 'Profit Factor', v: profitFactor.toFixed(2),            c: profitFactor >= 2 ? C.lime : C.gold },
                { l: 'Total R',       v: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(1)}R`, c: totalR >= 0 ? C.lime : C.red },
                { l: 'W / L',         v: `${wins}W / ${losses}L`,           c: C.muted },
              ].map(s => (
                <div key={s.l} style={{ background: C.panel2, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <Label style={{ display: 'block', marginBottom: 4 }}>{s.l}</Label>
                  <Mono style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</Mono>
                </div>
              ))}
            </div>
            {/* Skip rate */}
            <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Label>Skip Rate</Label>
                <Mono style={{ fontSize: 10, color: skipRate > 40 ? C.orange : C.gray }}>{skipRate.toFixed(0)}% ({skipTrades.length} skipped)</Mono>
              </div>
              {/* Skip reasons mini */}
              {[
                { l: 'R:R < 1.5',    count: skipTrades.filter(t => t.skip_reason?.includes('R:R')).length },
                { l: '4H Bias',      count: skipTrades.filter(t => t.skip_reason?.includes('bias')).length },
                { l: 'Squeeze Risk', count: skipTrades.filter(t => t.skip_reason?.includes('squeeze')).length },
              ].map(s => {
                const pct = skipTrades.length ? (s.count / skipTrades.length) * 100 : 0
                return (
                  <div key={s.l} style={{ marginBottom: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Label>{s.l}</Label>
                      <Label style={{ color: C.muted }}>{s.count}</Label>
                    </div>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: C.orange, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Row 3: Equity Curve */}
        <Card>
          <CardHeader icon="📈" title="EQUITY CURVE" sub={`paper trading · start $${capital}`} accent={C.cyan} />
          <EquityCurve points={equityPoints} capital={capital} />
        </Card>

        {/* Row 4: Calendar Journal */}
        <Card>
          <CardHeader icon="📅" title="CALENDAR JOURNAL" sub="click any day for drill-down" accent={C.purple} />
          <CalendarJournal trades={trades} />
        </Card>

        {/* Row 5: Trade History */}
        <Card>
          <CardHeader icon="📋" title="TRADE + SKIP LOG" sub="last 15 entries · orange = skipped" accent={C.mag} />
          <TradeHistory trades={trades} />
        </Card>

      </div>
    </div>
  )
}
