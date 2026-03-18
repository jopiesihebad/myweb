'use client'

import { useWS } from './WebSocketProvider'
import { useState } from 'react'

function fmt(n: number) {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1000)  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n.toFixed(2)
}

const INDEX_META: Record<string, { flag: string; region: string; color: string }> = {
  SPX:    { flag: '🇺🇸', region: 'US',  color: '#00c3ff' },
  NDX:    { flag: '🇺🇸', region: 'US',  color: '#bd93f9' },
  DJI:    { flag: '🇺🇸', region: 'US',  color: '#00c3ff' },
  NI225:  { flag: '🇯🇵', region: 'JP',  color: '#ff8c00' },
  DAX:    { flag: '🇩🇪', region: 'EU',  color: '#ffd700' },
  HSI:    { flag: '🇭🇰', region: 'HK',  color: '#ff44cc' },
  SHCOMP: { flag: '🇨🇳', region: 'CN',  color: '#ff8c00' },
  JKSE:   { flag: '🇮🇩', region: 'ID',  color: '#39ff14' },
}

export default function WorldIndices() {
  const { indices } = useWS()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <section style={{ padding: '0 0 4px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#00c3ff,#bd93f9)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            World Indices
          </span>
        </div>
        <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#39ff14', letterSpacing:2, opacity:0.7 }}>
          ● LIVE
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
      }}>
        {indices.map(idx => {
          const meta = INDEX_META[idx.symbol] || { flag:'🌐', region:'', color:'#00c3ff' }
          const isUp = idx.changePct >= 0
          const isHov = hovered === idx.symbol
          const hasSignal = !!idx.signal
          const signalIsBuy = idx.signal?.includes('BUY')

          return (
            <div
              key={idx.symbol}
              onMouseEnter={() => setHovered(idx.symbol)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHov ? '#0d1830' : '#0a1020',
                border: `1px solid ${isHov ? meta.color + '60' : '#162035'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'default',
                transition: 'all 0.2s',
                boxShadow: isHov ? `0 0 16px ${meta.color}25` : 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Signal accent bar */}
              {hasSignal && (
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:2,
                  background: signalIsBuy
                    ? 'linear-gradient(90deg, #39ff14, transparent)'
                    : 'linear-gradient(90deg, #ff0062, transparent)',
                  animation: 'scanPulse 2s infinite',
                }} />
              )}

              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:13 }}>{meta.flag}</span>
                    <span style={{
                      fontFamily:'Space Mono,monospace',
                      fontSize:9,
                      color: meta.color,
                      letterSpacing:1.5,
                      fontWeight:700,
                    }}>
                      {idx.symbol}
                    </span>
                  </div>
                  <div style={{
                    fontFamily:'JetBrains Mono,monospace',
                    fontSize:9,
                    color:'#4a6080',
                    marginTop:2,
                    letterSpacing:0.3,
                  }}>
                    {idx.name}
                  </div>
                </div>

                {/* Mini change badge */}
                <div style={{
                  background: isUp ? '#39ff1415' : '#ff006215',
                  border: `1px solid ${isUp ? '#39ff1440' : '#ff006240'}`,
                  borderRadius:4,
                  padding:'2px 5px',
                  fontFamily:'JetBrains Mono,monospace',
                  fontSize:9,
                  color: isUp ? '#39ff14' : '#ff0062',
                  fontWeight:700,
                  whiteSpace:'nowrap',
                }}>
                  {isUp ? '+' : ''}{idx.changePct.toFixed(2)}%
                </div>
              </div>

              {/* Value */}
              <div style={{
                fontFamily:'JetBrains Mono,monospace',
                fontSize:16,
                fontWeight:700,
                color:'#e8f4f8',
                letterSpacing:-0.5,
                lineHeight:1,
                marginBottom:4,
              }}>
                {fmt(idx.value)}
              </div>

              {/* Change */}
              <div style={{
                fontFamily:'JetBrains Mono,monospace',
                fontSize:10,
                color: isUp ? '#39ff14cc' : '#ff0062cc',
                display:'flex',
                alignItems:'center',
                gap:3,
              }}>
                <span>{isUp ? '▲' : '▼'}</span>
                <span>{isUp ? '+' : ''}{fmt(idx.change)}</span>
              </div>

              {/* Signal badge */}
              {hasSignal && (
                <div style={{
                  marginTop:6,
                  fontFamily:'Space Mono,monospace',
                  fontSize:8,
                  fontWeight:700,
                  letterSpacing:0.5,
                  padding:'2px 6px',
                  borderRadius:3,
                  background: signalIsBuy ? '#39ff1420' : '#ff006220',
                  border: `1px solid ${signalIsBuy ? '#39ff14' : '#ff0062'}`,
                  color: signalIsBuy ? '#39ff14' : '#ff0062',
                  display:'inline-block',
                  animation:'pipPulse 2s infinite',
                }}>
                  ⚡ {idx.signal}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes scanPulse {
          0%,100% { opacity:1 } 50% { opacity:0.4 }
        }
        @keyframes pipPulse {
          0%,100% { opacity:1 } 50% { opacity:0.5 }
        }
        @media (max-width: 768px) {
          .world-indices-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </section>
  )
}
