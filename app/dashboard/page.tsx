'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { WebSocketProvider, useWS } from '@/components/dashboard/WebSocketProvider'
import LiveTickerTape from '@/components/dashboard/LiveTickerTape'
import LayoutSwitcher from '@/components/dashboard/LayoutSwitcher'

// ── Global style constants ─────────────────────────────────────────────────────
const BG_MAIN  = '#04070f'
const BG_PANEL = '#0a1020'
const BG_BORDER= '#162035'
const C_CYAN   = '#00c3ff'
const C_LIME   = '#39ff14'
const C_GOLD   = '#ffd700'
const C_RED    = '#ff0062'
const C_ORANGE = '#ff8c00'
const C_PURPLE = '#bd93f9'
const C_MAG    = '#ff44cc'

// ── Global CSS injected once ───────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${BG_MAIN}; color: #c8d8e8; font-family: 'JetBrains Mono', monospace; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${BG_MAIN}; }
  ::-webkit-scrollbar-thumb { background: #162035; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C_CYAN}40; }
  * { scrollbar-width: thin; scrollbar-color: #162035 ${BG_MAIN}; }
  ::selection { background: ${C_CYAN}30; color: ${C_CYAN}; }

  /* Scanlines overlay */
  .scanlines::after {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0, 195, 255, 0.008) 3px,
      rgba(0, 195, 255, 0.008) 4px
    );
    pointer-events: none;
    z-index: 9998;
  }

  /* Noise texture */
  .noise-overlay::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9997;
  }

  /* Grid background */
  .grid-bg {
    background-image:
      linear-gradient(rgba(0,195,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,195,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Cursor blink */
  .cursor-blink::after {
    content: '▋';
    animation: cursorBlink 1s step-end infinite;
    color: ${C_CYAN};
    margin-left: 2px;
  }
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }

  /* Pip pulse */
  @keyframes pipPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  /* Fade up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  /* Orb float */
  @keyframes orbFloat {
    0%, 100% { transform: translateY(0) scale(1); }
    50%       { transform: translateY(-20px) scale(1.05); }
  }

  /* New data glow */
  @keyframes newGlow {
    0%   { box-shadow: 0 0 24px ${C_CYAN}80; }
    100% { box-shadow: none; }
  }
`

// ── Top nav bar ────────────────────────────────────────────────────────────────
function TopNav({ onTickerClick }: { onTickerClick: (s: string) => void }) {
  const { connected, lastSignal } = useWS()
  const [time, setTime] = useState('')
  const [sessions, setSessions] = useState<{ name: string; color: string; active: boolean }[]>([])

  useEffect(() => {
    const update = () => {
      const now  = new Date()
      const utc  = now.toUTCString().split(' ')[4]
      const hour = now.getUTCHours()
      const min  = now.getUTCMinutes()
      const utcMins = hour * 60 + min

      setTime(`${utc} UTC`)

      // Session windows (UTC)
      // ASIA:   00:00–08:00
      // LONDON: 07:00–16:00
      // NY:     12:00–21:00
      // IDX:    Mon–Fri 01:30–08:00 UTC (approx WIB 08:30–15:00)
      setSessions([
        { name: 'ASIA',   color: '#ff8c00', active: utcMins >= 0   && utcMins < 480  },
        { name: 'LONDON', color: '#39ff14', active: utcMins >= 420  && utcMins < 960  },
        { name: 'NY',     color: '#00c3ff', active: utcMins >= 720  && utcMins < 1260 },
        { name: 'IDX',    color: '#ffd700', active: utcMins >= 90   && utcMins < 480  },
      ])
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: `${BG_MAIN}ee`,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${BG_BORDER}`,
    }}>
      {/* Main nav row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52,
        maxWidth: 1800, margin: '0 auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Animated orb logo */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${C_CYAN}, #0040a0)`,
            boxShadow: `0 0 16px ${C_CYAN}60`,
            animation: 'orbFloat 4s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 17, fontWeight: 800,
              background: `linear-gradient(135deg, ${C_CYAN}, ${C_LIME})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 0.5,
              lineHeight: 1.1,
            }}>
              stockindexer
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 8, color: '#4a6080', letterSpacing: 1.5,
            }}>
              SS BLACKBOX v6.4
            </div>
          </div>
        </div>

        {/* Center: signal flash */}
        {lastSignal && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#ffd70010', border: '1px solid #ffd70030',
            borderRadius: 20, padding: '4px 14px',
            animation: 'pipPulse 2s infinite',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C_GOLD, boxShadow: `0 0 6px ${C_GOLD}`, display: 'inline-block' }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: C_GOLD, letterSpacing: 1 }}>
              {lastSignal.alert_type.replace(/_/g,' ')} · {lastSignal.ticker} · {lastSignal.close.toLocaleString('en-US',{maximumFractionDigits:2})}
            </span>
          </div>
        )}

        {/* Right: status + time + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Session Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* UTC time */}
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#4a6080', letterSpacing: 1 }}>
              {time}
            </div>
            {/* Session indicators */}
            <div style={{ display: 'flex', gap: 4 }}>
              {sessions.map(s => (
                <span key={s.name} style={{
                  fontSize: 8, padding: '1px 5px', letterSpacing: 1,
                  fontFamily: 'Space Mono, monospace', fontWeight: 700,
                  color:      s.active ? s.color : '#2a3d58',
                  border:     `1px solid ${s.active ? s.color + '60' : '#162035'}`,
                  background: s.active ? `${s.color}10` : 'transparent',
                  opacity:    s.active ? 1 : 0.5,
                  animation:  s.active ? 'pipPulse 2s infinite' : 'none',
                }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          {/* WS status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: connected ? C_LIME : C_RED,
              boxShadow: `0 0 8px ${connected ? C_LIME : C_RED}`,
              display: 'inline-block',
              animation: connected ? 'pipPulse 2s infinite' : 'none',
            }} />
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: connected ? C_LIME : C_RED, letterSpacing: 1 }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Nav links */}
          {[
            { label: 'DASHBOARD',  href: '/dashboard'  },
            { label: 'SIGNALS',    href: '/#live'       },
            { label: 'PORTFOLIO',  href: '/dashboard'   },
            { label: 'INDICATOR',  href: '/indicator'   },
          ].map(link => (
            <a key={link.label} href={link.href} style={{
              fontFamily: 'Space Mono, monospace', fontSize: 9,
              letterSpacing: 1, padding: '4px 10px', borderRadius: 4,
              background: link.label === 'DASHBOARD' ? `${C_CYAN}15` : 'transparent',
              border: `1px solid ${link.label === 'DASHBOARD' ? C_CYAN + '60' : 'transparent'}`,
              color: link.label === 'DASHBOARD' ? C_CYAN : '#4a6080',
              cursor: 'pointer', transition: 'all 0.2s',
              textDecoration: 'none',
            }}
              onMouseEnter={e => {
                if (link.label !== 'DASHBOARD') {
                  e.currentTarget.style.color = C_CYAN
                  e.currentTarget.style.border = `1px solid ${C_CYAN}40`
                }
              }}
              onMouseLeave={e => {
                if (link.label !== 'DASHBOARD') {
                  e.currentTarget.style.color = '#4a6080'
                  e.currentTarget.style.border = '1px solid transparent'
                }
              }}
            >
              {link.label}
            </a>
          ))}

          {/* Member badge */}
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: 9,
            padding: '4px 10px', borderRadius: 4,
            background: `${C_GOLD}20`, border: `1px solid ${C_GOLD}60`,
            color: C_GOLD, letterSpacing: 1,
          }}>
            ELITE
          </div>
        </div>
      </div>

      {/* Ticker tape */}
      <LiveTickerTape onTickerClick={onTickerClick} />
    </nav>
  )
}

// ── Background orbs ────────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[
        { x:'10%',  y:'20%', color: C_CYAN,   delay:'0s',   size:400 },
        { x:'80%',  y:'60%', color: C_PURPLE, delay:'2s',   size:350 },
        { x:'50%',  y:'85%', color: C_LIME,   delay:'3.5s', size:300 },
        { x:'90%',  y:'10%', color: C_GOLD,   delay:'1.5s', size:250 },
        { x:'5%',   y:'70%', color: C_MAG,    delay:'4s',   size:280 },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: orb.x, top: orb.y,
          width: orb.size, height: orb.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.color}08 0%, transparent 70%)`,
          filter: `blur(60px)`,
          animation: `orbFloat ${6 + i}s ease-in-out infinite`,
          animationDelay: orb.delay,
          transform: 'translate(-50%, -50%)',
        }} />
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
function DashboardContent() {
  const [activeTicker, setActiveTicker] = useState('BTCUSDT')

  return (
    <div className="scanlines noise-overlay grid-bg" style={{
      minHeight: '100vh',
      background: BG_MAIN,
      position: 'relative',
    }}>
      <BackgroundOrbs />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <TopNav onTickerClick={setActiveTicker} />

        <main style={{
          maxWidth: 1800,
          margin: '0 auto',
          padding: '20px 20px 60px',
        }}>
          {/* Page header */}
          <div style={{ marginBottom: 20, animation: 'fadeUp 0.5s ease' }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 26, fontWeight: 800,
              background: `linear-gradient(135deg, ${C_CYAN} 0%, ${C_LIME} 60%, ${C_GOLD} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: -0.5,
              lineHeight: 1.2,
              marginBottom: 6,
            }}>
              Member Dashboard
            </h1>
            <p style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 10, color: '#4a6080', letterSpacing: 1,
            }}>
              SS BlackBox Phantom v6.4 · Conway Automaton Edition · Real-time Signals
            </p>
          </div>

          {/* Layout switcher + all panels */}
          <LayoutSwitcher activeTicker={activeTicker} />
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${BG_BORDER}`,
        padding: '16px 20px',
        background: BG_PANEL,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: 1800, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1 }}>
            © 2026 stockindexer.com · SS BlackBox Phantom v6.4 · Conway Automaton
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {['DISCLAIMER', 'TERMS', 'PRIVACY', 'DOCS'].map(l => (
              <span key={l} style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1, cursor: 'pointer' }}>
                {l}
              </span>
            ))}
          </div>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, color: `${C_LIME}60`, letterSpacing: 1 }}>
            ● SYSTEM OPERATIONAL
          </span>
        </div>
      </footer>
    </div>
  )
}

// ── Root export with providers ─────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <WebSocketProvider>
        <DashboardContent />
      </WebSocketProvider>
    </>
  )
}
