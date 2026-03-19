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

const TradingViewChart = dynamic(() => import('./TradingViewChart'), { ssr: false })

export type LayoutType = 'quick' | 'portfolio' | 'signal' | 'journal' | 'minimal'

interface LayoutMeta {
  key: LayoutType
  label: string
  icon: string
  desc: string
  color: string
}

const LAYOUTS: LayoutMeta[] = [
  { key:'quick',     label:'Quick Glance',     icon:'⚡', desc:'Overview + chart + top signals',         color:'#00c3ff' },
  { key:'portfolio', label:'Portfolio First',  icon:'◈',  desc:'Portfolio risk + ownership + signals',   color:'#ffd700' },
  { key:'signal',    label:'Signal Deep Dive', icon:'🔱', desc:'Full signal breakdown + backtest',        color:'#bd93f9' },
  { key:'journal',   label:'Trade Journal',    icon:'📋', desc:'Full trade log + P&L history',           color:'#39ff14' },
  { key:'minimal',   label:'Minimal Mobile',   icon:'◯',  desc:'Clean mobile-optimized view',            color:'#ff8c00' },
]

// ── Shared panel wrapper ──────────────────────────────────────────────────────
function Panel({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:'#0a1020',
      border:'1px solid #162035',
      borderRadius:10,
      padding:'16px 18px',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Layout 1: Quick Glance ────────────────────────────────────────────────────
function QuickGlanceLayout({ activeTicker }: { activeTicker: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* World indices */}
      <Panel>
        <WorldIndices />
      </Panel>

      {/* Chart (full width) */}
      <TradingViewChart height={380} symbol={activeTicker} />

      {/* 2-col: Signals + Sentiment + Tools */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
        <Panel>
          <SignalExplanation />
        </Panel>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Panel>
            <SentimentAnalyzer />
          </Panel>
          <Panel>
            <AffiliateTools />
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Layout 2: Portfolio First ─────────────────────────────────────────────────
function PortfolioFirstLayout({ activeTicker }: { activeTicker: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Portfolio full width */}
      <Panel>
        <PortfolioRiskDashboard />
      </Panel>

      {/* 2-col: Ownership + Chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Panel>
          <OwnershipIntelligence />
        </Panel>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <TradingViewChart height={340} symbol={activeTicker} />
          <Panel>
            <SignalExplanation />
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Layout 3: Signal Deep Dive ────────────────────────────────────────────────
function SignalDeepDiveLayout({ activeTicker }: { activeTicker: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Chart */}
      <TradingViewChart height={420} symbol={activeTicker} />

      {/* Signals full width */}
      <Panel>
        <SignalExplanation />
      </Panel>

      {/* 3-col: Backtest + Sentiment + Indices */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <Panel>
          <BacktestSimulator />
        </Panel>
        <Panel>
          <SentimentAnalyzer />
        </Panel>
        <Panel>
          <WorldIndices />
        </Panel>
      </div>
    </div>
  )
}

// ── Layout 4: Trade Journal ───────────────────────────────────────────────────
function TradeJournalLayout() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel>
        <TradeLog />
      </Panel>
    </div>
  )
}

// ── Layout 5: Minimal Mobile ──────────────────────────────────────────────────
function MinimalMobileLayout({ activeTicker }: { activeTicker: string }) {
  const [activeSection, setActiveSection] = useState<'signals' | 'chart' | 'portfolio' | 'indices'>('signals')
  const TABS = [
    { key:'signals',   label:'SIGNALS',   icon:'⚡', color:'#ffd700'  },
    { key:'chart',     label:'CHART',     icon:'◈',  color:'#00c3ff'  },
    { key:'portfolio', label:'PORTFOLIO', icon:'◇',  color:'#bd93f9'  },
    { key:'indices',   label:'INDICES',   icon:'◉',  color:'#39ff14'  },
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
          <button key={t.key}
            onClick={() => setActiveSection(t.key as any)}
            style={{
              flex:1, padding:'10px 4px', border:'none',
              background: activeSection === t.key ? `${t.color}20` : 'transparent',
              borderBottom: activeSection === t.key ? `2px solid ${t.color}` : '2px solid transparent',
              fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
              color: activeSection === t.key ? t.color : '#4a6080',
              cursor:'pointer', transition:'all 0.2s',
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {activeSection === 'signals' && (
        <Panel>
          <SignalExplanation />
        </Panel>
      )}
      {activeSection === 'chart' && (
        <TradingViewChart height={320} symbol={activeTicker} />
      )}
      {activeSection === 'portfolio' && (
        <Panel>
          <PortfolioRiskDashboard />
        </Panel>
      )}
      {activeSection === 'indices' && (
        <Panel>
          <WorldIndices />
        </Panel>
      )}
    </div>
  )
}

// ── LayoutSwitcher (exported) ─────────────────────────────────────────────────
export default function LayoutSwitcher({ activeTicker = 'BTCUSDT' }: { activeTicker?: string }) {
  const [active, setActive] = useState<LayoutType>('quick')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const activeLayout = LAYOUTS.find(l => l.key === active)!

  return (
    <div>
      {/* Layout selector bar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', background:'#0a1020',
        borderBottom:'1px solid #162035', marginBottom:20,
        borderRadius:'8px 8px 0 0',
        position:'sticky', top:0, zIndex:40,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16 }}>{activeLayout.icon}</span>
          <span style={{
            fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700,
            color: activeLayout.color, letterSpacing:0.5,
          }}>
            {activeLayout.label}
          </span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
            {activeLayout.desc}
          </span>
        </div>

        {/* Layout toggle — desktop */}
        <div style={{ display:'flex', gap:4 }}>
          {LAYOUTS.map(l => (
            <button key={l.key}
              onClick={() => setActive(l.key)}
              title={l.desc}
              style={{
                fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
                padding:'4px 10px', borderRadius:4, cursor:'pointer',
                background: active === l.key ? `${l.color}20` : 'transparent',
                border: `1px solid ${active === l.key ? l.color : '#162035'}`,
                color: active === l.key ? l.color : '#4a6080',
                transition:'all 0.2s',
              }}>
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ animation:'fadeUp 0.3s ease', padding:'0 4px' }}>
        {active === 'quick'     && <QuickGlanceLayout activeTicker={activeTicker} />}
        {active === 'portfolio' && <PortfolioFirstLayout activeTicker={activeTicker} />}
        {active === 'signal'    && <SignalDeepDiveLayout activeTicker={activeTicker} />}
        {active === 'journal'   && <TradeJournalLayout />}
        {active === 'minimal'   && <MinimalMobileLayout activeTicker={activeTicker} />}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @media (max-width: 768px) {
          .layout-toggle-desktop { display: none !important; }
        }
      `}</style>
    </div>
  )
}
