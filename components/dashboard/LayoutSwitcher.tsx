'use client'

import { ReactNode, useState } from 'react'
import dynamic from 'next/dynamic'
import OwnershipIntelligence from './OwnershipIntelligence'
import SignalExplanation from './SignalExplanation'
import PortfolioRiskDashboard from './PortfolioRiskDashboard'
import { SentimentAnalyzer, BacktestSimulator } from './SentimentAndBacktest'
import WorldIndices from './WorldIndices'
import TradeLog from './TradeLog'
import AffiliateTools from './AffiliateTools'
import QuickGlanceDashboard from './QuickGlanceDashboard'
import StockHeatmap from './StockHeatmap'

const TradingViewChart = dynamic(() => import('./TradingViewChart'), { ssr: false })

export type LayoutType = 'quick' | 'portfolio' | 'signal' | 'ownership' | 'journal' | 'heatmap' | 'tools' | 'minimal'

interface LayoutMeta {
  key:   LayoutType
  label: string
  icon:  string
  desc:  string
  color: string
}

const LAYOUTS: LayoutMeta[] = [
  { key:'quick',     label:'Quick Glance',      icon:'⚡', desc:'Live overview — signals, chart, risk, stats',      color:'#00c3ff' },
  { key:'portfolio', label:'Portfolio',          icon:'◈',  desc:'Risk exposure, correlation, rebalancing',          color:'#ffd700' },
  { key:'signal',    label:'Signal Deep Dive',   icon:'🔱', desc:'All signals, sentiment, news, backtest',           color:'#bd93f9' },
  { key:'ownership', label:'Ownership Intel',    icon:'🏛',  desc:'IDX shareholding — BBCA/BBRI/ANTM/ASII + AI Q&A', color:'#ff44cc' },
  { key:'journal',   label:'Trade Journal',      icon:'📋', desc:'Full pieBot trade log + P&L + CSV export',         color:'#39ff14' },
  { key:'heatmap',   label:'Stock Map',          icon:'🗺',  desc:'Conway heatmap — 24 assets real-time',            color:'#ff8c00' },
  { key:'tools',     label:'Tools & Brokers',    icon:'🔗',  desc:'Exchanges, platforms, trader setup',               color:'#ff8c00' },
  { key:'minimal',   label:'Minimal',            icon:'◯',  desc:'Mobile-optimized compact view',                    color:'#8aa0b8' },
]

// ── Shared panel ──────────────────────────────────────────────────────────────
function Panel({ children, title, style = {} }: {
  children: ReactNode
  title?:   string
  style?:   React.CSSProperties
}) {
  return (
    <div style={{
      background:   '#0a1020',
      border:       '1px solid #162035',
      borderRadius: 10,
      padding:      '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 1: Quick Glance
//  Session clock · Status · Conway map · Risk · Watch list · DXY/VIX
//  Signal feed + TV Chart · Backtest stats · Trade log preview
// ─────────────────────────────────────────────────────────────────────────────
function QuickGlanceLayout({
  activeTicker,
  onTickerSelect,
}: {
  activeTicker:   string
  onTickerSelect?: (t: string) => void
}) {
  return (
    <QuickGlanceDashboard
      activeTicker={activeTicker}
      onTickerSelect={onTickerSelect ?? (() => {})}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 2: Portfolio First
//  Visual hierarchy:
//  - Top: summary stats bar (total value, risk score, open positions, live signals)
//  - Mid-left: Portfolio Risk full (pie + correlation + bar + rebalancing)
//  - Mid-right: TV Chart → selected ticker + signal badges from assetStates
//  - Bottom-left: Trade Log (P&L audit)
//  - Bottom-right: Affiliate tools + links
// ─────────────────────────────────────────────────────────────────────────────
function PortfolioFirstLayout({
  activeTicker,
  onTickerSelect,
}: {
  activeTicker:   string
  onTickerSelect?: (t: string) => void
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Row 1: Portfolio Risk (full width) ─────────── */}
      {/* Contains: pie chart, correlation heatmap, bar chart, */}
      {/* risk meter, rebalancing suggestions, position table  */}
      <Panel>
        <PortfolioRiskDashboard />
      </Panel>

      {/* ── Row 2: Chart (left, wider) + Signals (right) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16, alignItems:'start' }}>

        {/* Left: TV Chart — shows selected ticker */}
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, padding:'0 4px' }}>
            CHART — click portfolio row or ticker tape to switch
          </div>
          <TradingViewChart height={400} symbol={activeTicker} />
        </div>

        {/* Right: Active signals for portfolio tickers only */}
        <Panel style={{ alignSelf:'start' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
            <span style={{ width:3, height:14, background:'linear-gradient(180deg,#ffd700,#bd93f9)', borderRadius:2, display:'inline-block' }} />
            <span style={{ fontFamily:'Syne,sans-serif', fontSize:12, fontWeight:700, color:'#c8d8e8', letterSpacing:1 }}>
              ACTIVE SIGNALS
            </span>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>portfolio assets</span>
          </div>
          <SignalExplanation />
        </Panel>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 3: Signal Deep Dive
//  TV Chart · All 29 signal types (expandable, tier filter)
//  Sentiment analyzer + AI news scoring · Backtest simulator
//  World indices macro context
//  NO Ownership (moved to own menu)
// ─────────────────────────────────────────────────────────────────────────────
function SignalDeepDiveLayout({ activeTicker }: { activeTicker: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Row 1: Chart full width */}
      <TradingViewChart height={460} symbol={activeTicker} />

      {/* Row 2: Signal Explanation full (all 29 types, tier/cat filter, expandable) */}
      <Panel>
        <SignalExplanation />
      </Panel>

      {/* Row 3: Sentiment + News (left) · Backtest (right) */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
        <Panel>
          <SentimentAnalyzer />
        </Panel>
        <Panel>
          <BacktestSimulator />
        </Panel>
      </div>

      {/* Row 4: World Indices macro context */}
      <Panel>
        <WorldIndices />
      </Panel>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 4: Ownership Intelligence (MANDIRI)
//  Dedicated full-page ownership analysis
//  4-tab: BBCA / BBRI / ANTM / ASII
//  Deep ownership table · Hidden accumulation flag
//  Conglomerate network graph · AI Q&A (Anthropic API)
//  Pie chart distribution
// ─────────────────────────────────────────────────────────────────────────────
function OwnershipLayout() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg,#0a1020,#0d1628)',
        border: '1px solid #ff44cc30',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#eef4fc', marginBottom:4 }}>
            Ownership Intelligence
          </div>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:10, color:'#4a6080' }}>
            IDX shareholding data · Q3 2025 · BBCA · BBRI · ANTM · ASII
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{
            fontFamily:'Space Mono,monospace', fontSize:9, letterSpacing:1,
            color:'#ff44cc', border:'1px solid #ff44cc40',
            background:'#ff44cc10', padding:'2px 8px', borderRadius:4,
          }}>
            IDX DISCLOSURE
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
            AI Q&A powered by Claude
          </span>
        </div>
      </div>

      {/* Ownership Intelligence full component */}
      <Panel>
        <OwnershipIntelligence />
      </Panel>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 5: Trade Journal
//  Full pieBot trade audit trail · Filter by tier/status
//  Summary bar (win rate, P&L, profit factor) · CSV export
// ─────────────────────────────────────────────────────────────────────────────
function TradeJournalLayout() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel>
        <TradeLog />
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout: Tools & Brokers (mandiri)
//  Exchanges, platforms, trader setup, SS BlackBox license CTA
// ─────────────────────────────────────────────────────────────────────────────
function ToolsLayout() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel>
        <AffiliateTools />
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 6: Stock Map (Heatmap)
//  24 assets Conway state heatmap
//  BY STATE / BY FUSION / BY CLASS view modes
//  Click cell → switch active chart ticker
// ─────────────────────────────────────────────────────────────────────────────
function HeatmapLayout({
  activeTicker,
  onTickerSelect,
}: {
  activeTicker:   string
  onTickerSelect?: (t: string) => void
}) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel>
        <StockHeatmap onTickerSelect={onTickerSelect} />
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  Layout 7: Minimal Mobile
//  Tab-based compact view: Signals / Chart / Portfolio / Indices
// ─────────────────────────────────────────────────────────────────────────────
function MinimalMobileLayout({ activeTicker }: { activeTicker: string }) {
  const [tab, setTab] = useState<'signals' | 'chart' | 'portfolio' | 'indices'>('signals')

  const TABS = [
    { key:'signals',   label:'SIGNALS',   icon:'⚡', color:'#ffd700' },
    { key:'chart',     label:'CHART',     icon:'◈',  color:'#00c3ff' },
    { key:'portfolio', label:'PORTFOLIO', icon:'◇',  color:'#bd93f9' },
    { key:'indices',   label:'INDICES',   icon:'◉',  color:'#39ff14' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display:'flex', gap:0, marginBottom:16,
        background:'#0a1020', borderRadius:8, overflow:'hidden',
        border:'1px solid #162035',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            flex:1, padding:'10px 4px', border:'none',
            background: tab === t.key ? `${t.color}20` : 'transparent',
            borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
            fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
            color: tab === t.key ? t.color : '#4a6080',
            cursor:'pointer', transition:'all 0.2s',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'signals'   && <Panel><SignalExplanation /></Panel>}
      {tab === 'chart'     && <TradingViewChart height={320} symbol={activeTicker} />}
      {tab === 'portfolio' && <Panel><PortfolioRiskDashboard /></Panel>}
      {tab === 'indices'   && <Panel><WorldIndices /></Panel>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  LayoutSwitcher — exported
// ─────────────────────────────────────────────────────────────────────────────
export default function LayoutSwitcher({
  activeTicker  = 'BTCUSDT',
  onTickerSelect,
}: {
  activeTicker?:  string
  onTickerSelect?: (t: string) => void
}) {
  const [active, setActive] = useState<LayoutType>('quick')
  const activeLayout = LAYOUTS.find(l => l.key === active)!

  return (
    <div>
      {/* Layout selector bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', background:'#0a1020',
        borderBottom:'1px solid #162035', marginBottom:20,
        borderRadius:'8px 8px 0 0',
        position:'sticky', top:60, zIndex:50,
      }}>
        {/* Active label */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16 }}>{activeLayout.icon}</span>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:activeLayout.color, letterSpacing:0.5 }}>
            {activeLayout.label}
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
            {activeLayout.desc}
          </span>
        </div>

        {/* Tab buttons */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {LAYOUTS.map(l => (
            <button key={l.key} onClick={() => setActive(l.key)} title={l.desc} style={{
              fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
              padding:'4px 10px', borderRadius:4, cursor:'pointer',
              background: active === l.key ? `${l.color}20` : 'transparent',
              border:`1px solid ${active === l.key ? l.color : '#162035'}`,
              color: active === l.key ? l.color : '#4a6080',
              transition:'all 0.2s',
              whiteSpace:'nowrap',
            }}>
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ animation:'fadeUp 0.3s ease', padding:'0 4px' }}>
        {active === 'quick'     && <QuickGlanceLayout     activeTicker={activeTicker} onTickerSelect={onTickerSelect} />}
        {active === 'portfolio' && <PortfolioFirstLayout  activeTicker={activeTicker} onTickerSelect={onTickerSelect} />}
        {active === 'signal'    && <SignalDeepDiveLayout  activeTicker={activeTicker} />}
        {active === 'ownership' && <OwnershipLayout />}
        {active === 'journal'   && <TradeJournalLayout />}
        {active === 'tools'     && <ToolsLayout />}
        {active === 'heatmap'   && <HeatmapLayout         activeTicker={activeTicker} onTickerSelect={onTickerSelect} />}
        {active === 'minimal'   && <MinimalMobileLayout   activeTicker={activeTicker} />}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}
