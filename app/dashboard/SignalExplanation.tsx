'use client'

import { useState } from 'react'
import { useWS, type SignalPayload } from './WebSocketProvider'
import { ALERT_META, TIER_META, type AlertType, type Tier } from '@/lib/useWebSocket'

// ─────────────────────────────────────────────────────────────
//  Signal Explanation — unified to locked schema v6.4
//  alert_type replaces signal
//  fusion replaces score/confluence
//  tier replaces signal_tier (only S/A/B/C — no B+)
//  cells_arr[] replaces integer cells for display
// ─────────────────────────────────────────────────────────────

// Extended signal config — synced with canonical ALERT_META (29 types)
const SIG_CONFIG: Record<AlertType, {
  icon:     string
  category: 'entry' | 'exit' | 'structure' | 'hft' | 'info'
  desc:     string
}> = {
  GOLD_BUY:         { icon: '⚡', category: 'entry',     desc: 'PM crossover + close > VWAP + RSI 50–85. Confirmed multi-factor long entry — no Conway gate required.' },
  DOOM_SELL:        { icon: '💀', category: 'info',      desc: 'Bearish confluence signal. LONG-only system — use only as exit confirmation.' },
  CONWAY_BUY:       { icon: '⚡', category: 'entry',     desc: 'PM crossover + VWAP + RSI + Conway ALIVE ≥5/8 cells. Tier A — high-conviction long entry.' },
  CONWAY_SELL:      { icon: '⚡', category: 'info',      desc: 'Conway bearish. LONG-only system ignores for entry.' },
  CONWAY_BORN:      { icon: '🟢', category: 'entry',     desc: 'Conway automaton just turned ALIVE + conf_buy fired on same bar. Tier S — maximum conviction entry.' },
  CONWAY_DIED:      { icon: '🔴', category: 'exit',      desc: 'Conway state dropped below threshold. Cells fell under minimum — exit or pause all positions immediately.' },
  PM_BUY:           { icon: '◇', category: 'entry',     desc: 'PM crossover without full confluence gate. Tier B entry — proceed with standard risk sizing.' },
  PM_SELL:          { icon: '◇', category: 'info',      desc: 'PM crossunder. LONG-only system ignores for new entries.' },
  BULLISH_LIQ_GRAB: { icon: '🎯', category: 'hft',      desc: 'Bullish liquidity grab. Wick below EQL swept, recovered above. Smart money stops absorbed — watch for reversal.' },
  BEARISH_LIQ_GRAB: { icon: '🎯', category: 'hft',      desc: 'Bearish liquidity grab. Wick above EQH swept, rejected. Smart money buyside liquidity swept.' },
  BREAKOUT:         { icon: '🚀', category: 'structure', desc: 'Close above resistance with volume confirmation. Watch for Conway to reach ≥5/8 before entering.' },
  SQZ_RELEASED:     { icon: '💥', category: 'info',      desc: 'Squeeze momentum released. Bollinger Bands expanded outside Keltner — volatility expanding, move incoming.' },
  PREDATOR_HFT:     { icon: '🔱', category: 'hft',      desc: 'Predator Meter spike — aggressive institutional order flow detected. Expect above-average volatility.' },
  ALPHA_EXIT:       { icon: '🔮', category: 'exit',      desc: 'Smart money exit signal. Volume drop + negative price-volume correlation — momentum exhaustion.' },
  DIVERGENCE_RISK:  { icon: '⚠',  category: 'hft',      desc: 'Divergence Shield alert. RSI diverging from price — trend weakening, reduce position size or prepare exit.' },
  HIGH_CONFLUENCE:  { icon: '★',  category: 'info',      desc: 'Fusion score ≥18/23 — Grade 1-2 alignment across all indicators. Strong momentum environment.' },
  CHoCH_BULL:       { icon: '↗',  category: 'structure', desc: 'Change of Character — bullish. First higher high after downtrend. Market structure shift to bullish bias.' },
  CHoCH_BEAR:       { icon: '↙',  category: 'structure', desc: 'Change of Character — bearish. First lower low after uptrend. Potential trend reversal.' },
  BOS_BULL:         { icon: '↗',  category: 'structure', desc: 'Break of Structure — bullish. Continuation higher high with volume confirmed. Trend acceleration.' },
  BOS_BEAR:         { icon: '↙',  category: 'structure', desc: 'Break of Structure — bearish. Continuation lower low confirmed.' },
  OB_TOUCH_BULL:    { icon: '◈',  category: 'hft',      desc: 'Price touching bullish Order Block. High-probability demand zone from prior displacement move. Watch for bounce.' },
  OB_TOUCH_BEAR:    { icon: '◈',  category: 'hft',      desc: 'Price touching bearish Order Block. Supply zone — watch for reversal or rejection candle.' },
  BBP_ENTRY_BUY:    { icon: '▲',  category: 'entry',    desc: 'BBP crossover entry. Tier B (cells≥5) or Tier C (cells<5). Gate: VWAP + RSI + optionally Conway.' },
  BBP_ENTRY_SELL:   { icon: '▼',  category: 'exit',     desc: 'BBP crossunder. LONG-only system — treat as exit/confirmation signal only.' },
  LH_EXIT:          { icon: '⚠',  category: 'exit',     desc: 'Early warning exit. Lower High formed + Conway weakening + retrace ≥1×ATR. Hybrid exit priority 1 of 2.' },
  LONDON_OPEN:      { icon: '🇬🇧', category: 'info',     desc: 'London session started. Prime liquidity window — expect increased volatility and tighter spreads.' },
  NEW_YORK_OPEN:    { icon: '🗽', category: 'info',      desc: 'New York session started. Highest volume window — strongest signal confirmation zone.' },
  BBP_CROSSOVER:    { icon: '↑',  category: 'info',      desc: 'Raw BBP crossover without full gate. Informational — watch for Conway confirmation before entry.' },
  BBP_CROSSUNDER:   { icon: '↓',  category: 'info',      desc: 'Raw BBP crossunder. Potential exit signal — check LH EXIT first before acting.' },
}

const GRADE_COLORS: Record<number, string> = {
  1: '#39ff14', 2: '#00c3ff', 3: '#ffd700', 4: '#ff8c00', 5: '#ff0062',
}
const GRADE_LABELS: Record<number, string> = {
  1: 'GRADE 1 — ELITE', 2: 'GRADE 2 — STRONG', 3: 'GRADE 3 — VALID',
  4: 'GRADE 4 — WEAK',  5: 'GRADE 5 — SKIP',
}

// ─── ConwayCells using cells_arr[] ───────────────────────────
function ConwayCells({ cells_arr, cells, conwayState }: {
  cells_arr: number[]
  cells:     number
  conwayState: string
}) {
  const arr = cells_arr.length === 8 ? cells_arr : Array.from({ length: 8 }, (_, i) => i < cells ? 1 : 0)
  const stateColor =
    conwayState === 'born'    ? '#39ff14' :
    conwayState === 'alive'   ? '#00c3ff' :
    conwayState === 'died'    ? '#ff0062' : '#4a6080'

  const stateLabel =
    conwayState === 'born'    ? 'BORN 🟢' :
    conwayState === 'alive'   ? 'ALIVE ✦' :
    conwayState === 'died'    ? 'DIED 🔴' : 'DORMANT ○'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {arr.map((on, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background:  on ? stateColor : '#1a2a40',
            border:      `1px solid ${on ? stateColor + 'cc' : '#162035'}`,
            boxShadow:   on ? `0 0 6px ${stateColor}80` : 'none',
            animation:   on && conwayState === 'alive' ? 'pipPulse 2s infinite' : 'none',
            animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
      <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: stateColor, letterSpacing: 1 }}>
        {cells}/8 {stateLabel}
      </span>
    </div>
  )
}

// ─── Fusion bar (renamed from Grade bar) ─────────────────────
function FusionBar({ fusion, grade }: { fusion: number; grade: number }) {
  const pct   = Math.min((fusion / 23) * 100, 100)
  const color = GRADE_COLORS[grade] || '#4a6080'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#4a6080', letterSpacing: 1 }}>
          FUSION SCORE
        </span>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color, fontWeight: 700 }}>
          {fusion}/23 · {GRADE_LABELS[grade] || ''}
        </span>
      </div>
      <div style={{ height: 4, background: '#0d1830', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: 2, boxShadow: `0 0 8px ${color}60`,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Signal card ──────────────────────────────────────────────
function SignalCard({ sig, isNew }: { sig: SignalPayload; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const meta   = ALERT_META[sig.alert_type]
  const cfg    = SIG_CONFIG[sig.alert_type]
  const color  = meta?.color  ?? '#00c3ff'
  const bg     = `${color}15`
  const icon   = cfg?.icon    ?? '●'

  const tierMeta  = sig.tier ? TIER_META[sig.tier] : null
  const tierColor = tierMeta?.color ?? '#4a6080'

  const isEntry   = meta?.category === 'ENTRY'
  const isExit    = meta?.category === 'EXIT'

  const conwayState =
    sig.cells >= 5 && (sig.alert_type === 'CONWAY_BORN')  ? 'born'    :
    sig.cells >= 5 && (sig.alert_type === 'CONWAY_BUY')   ? 'alive'   :
    sig.alert_type === 'CONWAY_DIED'                       ? 'died'    : 'dormant'

  const ago = (() => {
    const diff = Date.now() - new Date(sig.timestamp).getTime()
    if (diff < 60000)   return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  })()

  const rrRatio = isEntry && sig.sl_price > 0 && sig.close > sig.sl_price
    ? ((sig.tp_price - sig.close) / (sig.close - sig.sl_price)).toFixed(2)
    : null

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background:    expanded ? '#0d1830' : bg,
        border:        `1px solid ${isNew ? color : color + '40'}`,
        borderRadius:  10,
        padding:       '14px 16px',
        cursor:        'pointer',
        transition:    'all 0.3s',
        boxShadow:     isNew ? `0 0 20px ${color}40` : 'none',
        animation:     isNew ? 'newSignalGlow 1s ease-out' : 'none',
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Category stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '10px 0 0 10px' }} />

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 800, color, letterSpacing: 0.5 }}>
                {meta?.label ?? sig.alert_type}
              </span>
              {sig.tier && (
                <span style={{
                  fontFamily: 'Space Mono,monospace', fontSize: 9, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 3,
                  border: `1px solid ${tierColor}`, color: tierColor, background: `${tierColor}15`,
                  letterSpacing: 1,
                }}>
                  TIER {sig.tier}
                </span>
              )}
              <span style={{
                fontFamily: 'Space Mono,monospace', fontSize: 9,
                padding: '1px 5px', borderRadius: 3,
                background: '#162035', color: '#4a6080', border: '1px solid #1e2f4a',
              }}>
                {(cfg?.category ?? 'info').toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#4a6080', marginTop: 2 }}>
              {sig.ticker} · {sig.session} session · {ago}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 16, fontWeight: 700, color: '#e8f4f8' }}>
            {sig.close.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', marginTop: 2 }}>
            {expanded ? '▲ collapse' : '▼ expand'}
          </div>
        </div>
      </div>

      {/* Conway cells — uses cells_arr[] */}
      <div style={{ paddingLeft: 4, marginBottom: 10 }}>
        <ConwayCells cells_arr={sig.cells_arr} cells={sig.cells} conwayState={conwayState} />
      </div>

      {/* Fusion bar */}
      <div style={{ paddingLeft: 4 }}>
        <FusionBar fusion={sig.fusion} grade={sig.grade} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 14, paddingLeft: 4, borderTop: '1px solid #162035', paddingTop: 12, animation: 'fadeUp 0.2s ease' }}>
          <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#8aa0b8', lineHeight: 1.7, marginBottom: 12 }}>
            {cfg?.desc ?? 'No description available.'}
          </p>

          {/* SL / Entry / TP — only for ENTRY signals with valid prices */}
          {isEntry && sig.sl_price > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'STOP LOSS',    value: sig.sl_price, color: '#ff0062' },
                { label: 'ENTRY',        value: sig.close,    color },
                { label: 'TAKE PROFIT',  value: sig.tp_price, color: '#39ff14' },
              ].map(item => (
                <div key={item.label} style={{ background: '#0a1020', border: `1px solid ${item.color}30`, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700, color: item.color }}>
                    {item.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Extra info row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {sig.atr > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>ATR:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#8aa0b8' }}>{sig.atr.toFixed(2)}</span>
              </div>
            )}
            {rrRatio && (
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>R:R:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#39ff14' }}>{rrRatio}:1</span>
              </div>
            )}
            {tierMeta && (
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>EST WR:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: tierMeta.color }}>~{tierMeta.wrEst}%</span>
              </div>
            )}
            {tierMeta && (
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>RISK:</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: tierMeta.color }}>{tierMeta.riskPct}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────
export default function SignalExplanation() {
  const { signals, newSignalIds } = useWS()
  const [catFilter,  setCatFilter]  = useState<'all' | 'entry' | 'exit' | 'structure' | 'hft' | 'info'>('all')
  const [tierFilter, setTierFilter] = useState<'all' | Tier>('all')

  const filtered = signals.filter(sig => {
    const cfg  = SIG_CONFIG[sig.alert_type]
    const meta = ALERT_META[sig.alert_type]
    const cat  = cfg?.category ?? 'info'
    const catMatch  = catFilter === 'all' || cat === catFilter
    const tierMatch = tierFilter === 'all' || sig.tier === tierFilter
    return catMatch && tierMatch
  })

  const CATS = [
    { key: 'all',       label: 'ALL'       },
    { key: 'entry',     label: 'ENTRY'     },
    { key: 'exit',      label: 'EXIT'      },
    { key: 'structure', label: 'STRUCTURE' },
    { key: 'hft',       label: 'HFT'       },
    { key: 'info',      label: 'INFO'      },
  ]

  const TIERS: { key: 'all' | Tier; label: string; color: string }[] = [
    { key: 'all', label: 'ALL TIERS', color: '#4a6080' },
    { key: 'S',   label: 'TIER S',    color: '#39ff14' },
    { key: 'A',   label: 'TIER A',    color: '#00c3ff' },
    { key: 'B',   label: 'TIER B',    color: '#ffd700' },
    { key: 'C',   label: 'TIER C',    color: '#ff8c00' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#ffd700,#ff8c00)', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Signal Engine
          </span>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: '#ffd700', background: '#ffd70015', border: '1px solid #ffd70040', padding: '1px 6px', borderRadius: 3 }}>
            SS BlackBox v6.4
          </span>
        </div>
        <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: '#39ff14', letterSpacing: 2, animation: 'pipPulse 1.5s infinite' }}>
          ● {signals.length} SIGNALS
        </span>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c.key}
            onClick={() => setCatFilter(c.key as typeof catFilter)}
            style={{
              fontFamily: 'Space Mono,monospace', fontSize: 9, letterSpacing: 1,
              padding: '3px 10px', borderRadius: 4,
              background: catFilter === c.key ? '#00c3ff20' : 'transparent',
              border: `1px solid ${catFilter === c.key ? '#00c3ff' : '#162035'}`,
              color: catFilter === c.key ? '#00c3ff' : '#4a6080',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Tier filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TIERS.map(t => (
          <button key={t.key}
            onClick={() => setTierFilter(t.key)}
            style={{
              fontFamily: 'Space Mono,monospace', fontSize: 8, letterSpacing: 1,
              padding: '2px 8px', borderRadius: 3,
              background: tierFilter === t.key ? t.color + '20' : 'transparent',
              border: `1px solid ${tierFilter === t.key ? t.color : '#162035'}`,
              color: tierFilter === t.key ? t.color : '#4a6080',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Signal list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#4a6080', border: '1px dashed #162035', borderRadius: 10 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>●</div>
            Waiting for signals...
            <div style={{ fontSize: 10, marginTop: 4, animation: 'pipPulse 1.5s infinite' }}>
              monitoring SS BlackBox v6.4_
            </div>
          </div>
        ) : (
          filtered.map((sig, i) => {
            const id = `${sig.ticker}-${sig.timestamp}`
            return <SignalCard key={id + i} sig={sig} isNew={newSignalIds.has(id)} />
          })
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pipPulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes newSignalGlow { 0% { box-shadow: 0 0 30px #00c3ff80 } 100% { box-shadow: none } }
      `}</style>
    </div>
  )
}
