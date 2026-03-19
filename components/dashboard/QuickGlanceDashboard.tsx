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

// ─── Mock backtest data (pieBot historical) ───────────────────
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

const EQUITY_POINTS = (() => {
  const pts = [{ x: 0, y: 10000 }]
  let eq = 10000
  for (let i = 1; i <= 24; i++) {
    const r = Math.random()
    eq += r > 0.26 ? eq * 0.018 * (1 + Math.random()) : -eq * 0.011
    pts.push({ x: i, y: Math.round(eq) })
  }
  return pts
})()

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

// ─── Main QuickGlance ─────────────────────────────────────────
export default function QuickGlanceDashboard({ activeTicker, onTickerSelect }: {
  activeTicker:   string
  onTickerSelect: (t: string) => void
}) {
  const { signals, assetStates, connected, newSignalIds } = useWS()
  const [chartTicker, setChartTicker] = useState(activeTicker)
  const [showAllSig,  setShowAllSig]  = useState(false)
  const [tradeData,   setTradeData]   = useState<any>(null)

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
      .then(d => setTradeData(d))
      .catch(() => {})
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
          label="PIEBOT WIN RATE"
          value={tradeSummary ? `${tradeSummary.winRate.toFixed(1)}%` : `${BACKTEST.winRate}%`}
          color="#ffd700"
          sub={tradeSummary ? `${tradeSummary.wins}W · ${tradeSummary.losses}L` : 'backtest 2022–2025'}
        />
        <StatBox
          label="TOTAL P&L"
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
        <TradingViewChart symbol={chartTicker} height={420} />
      </div>

      {/* ── Row 3: pieBot Stats + Backtest + Trade Log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 320px', gap: 16 }}>

        {/* pieBot live stats */}
        <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 10, padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg,#bd93f9,#ff44cc)', borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1 }}>
              PIEBOT
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
              OPEN POSITIONS
            </div>
            {recentTrades.filter((t: any) => t.exit_price === null).length === 0 ? (
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#2a3d58' }}>No open trades</div>
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
          <EquityMiniChart points={EQUITY_POINTS} />

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
