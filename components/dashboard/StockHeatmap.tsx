'use client'

import { useState, useCallback } from 'react'
import { useWS } from './WebSocketProvider'
import { PINE_ASSETS } from '@/lib/assetRegistry'
import type { AssetState } from './WebSocketProvider'

// ─────────────────────────────────────────────────────────────
//  StockHeatmap — terinspirasi stockmap.jatevo.ai
//  Treemap visual semua 24 Pine Assets per asset class
//  Color: BORN=lime, ALIVE=cyan, DIED=red, DORMANT=gray
//  Size: proportional to fusion score (bigger = more confluence)
//  Click: select ticker untuk chart
// ─────────────────────────────────────────────────────────────

type ViewMode = 'fusion' | 'state' | 'class'

const CLASS_ORDER  = ['CRYPTO', 'COMMODITY', 'FOREX', 'IDX', 'USA'] as const
const CLASS_COLOR: Record<string, string> = {
  CRYPTO:    '#bd93f9',
  COMMODITY: '#ffd700',
  FOREX:     '#00c3ff',
  IDX:       '#ff8c00',
  USA:       '#39ff14',
}

function stateColor(state: string, opacity = 1): string {
  switch (state) {
    case 'born':    return `rgba(57,255,20,${opacity})`
    case 'alive':   return `rgba(0,195,255,${opacity})`
    case 'died':    return `rgba(255,0,98,${opacity})`
    default:        return `rgba(26,42,64,${opacity})`
  }
}

function stateLabel(state: string): string {
  switch (state) {
    case 'born':  return 'BORN 🟢'
    case 'alive': return 'ALIVE ✦'
    case 'died':  return 'DIED 🔴'
    default:      return 'DORMANT'
  }
}

function fusionColor(fusion: number): string {
  if (fusion >= 18) return '#39ff14'
  if (fusion >= 14) return '#00c3ff'
  if (fusion >= 10) return '#ffd700'
  if (fusion >= 7)  return '#ff8c00'
  return '#2a3d58'
}

type HeatCell = {
  ticker:     string
  name:       string
  assetClass: string
  state:      string
  fusion:     number
  tier:       string | null
  lastClose:  number | null
}

export default function StockHeatmap({ onTickerSelect }: { onTickerSelect?: (ticker: string) => void }) {
  const { assetStates } = useWS()
  const [viewMode,      setViewMode]      = useState<ViewMode>('state')
  const [hoveredCell,   setHoveredCell]   = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  // Build cells from PINE_ASSETS + assetStates
  const allCells: HeatCell[] = PINE_ASSETS.map(a => {
    const s: AssetState | undefined = assetStates[a.ticker]
    return {
      ticker:     a.ticker,
      name:       a.name,
      assetClass: a.assetClass,
      state:      s?.conwayState ?? 'dormant',
      fusion:     s?.fusion      ?? 0,
      tier:       s?.tier        ?? null,
      lastClose:  s?.lastClose   ?? null,
    }
  })

  const classes = selectedClass
    ? CLASS_ORDER.filter(c => c === selectedClass)
    : CLASS_ORDER

  // Stats
  const totalBorn    = allCells.filter(c => c.state === 'born').length
  const totalAlive   = allCells.filter(c => c.state === 'alive').length
  const totalDied    = allCells.filter(c => c.state === 'died').length
  const totalDormant = allCells.filter(c => c.state === 'dormant').length
  const avgFusion    = Math.round(allCells.reduce((s, c) => s + c.fusion, 0) / allCells.length)

  const getCellBg = useCallback((cell: HeatCell): string => {
    if (viewMode === 'state')   return stateColor(cell.state, cell.state === 'dormant' ? 0.3 : 0.15)
    if (viewMode === 'fusion')  return `rgba(${cell.fusion >= 14 ? '57,255,20' : cell.fusion >= 10 ? '255,215,0' : '42,61,88'},${Math.max(0.08, cell.fusion / 23 * 0.4)})`
    return `${CLASS_COLOR[cell.assetClass]}15`
  }, [viewMode])

  const getCellBorder = useCallback((cell: HeatCell, isHovered: boolean): string => {
    const base = viewMode === 'state'  ? stateColor(cell.state, 0.6)
               : viewMode === 'fusion' ? fusionColor(cell.fusion) + '80'
               : CLASS_COLOR[cell.assetClass] + '60'
    return isHovered ? base : (cell.state === 'dormant' ? '#1e2e4a' : base)
  }, [viewMode])

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 3, height: 16, background: 'linear-gradient(180deg,#39ff14,#00c3ff)', borderRadius: 2, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 13, fontWeight: 700, color: '#c8d8e8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Stock Heatmap
          </span>
          <span style={{ fontSize: 9, color: '#4a6080', fontFamily: 'Space Mono,monospace', letterSpacing: 1 }}>
            24 assets · SS BlackBox v6.4
          </span>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { key: 'state',  label: 'BY STATE'  },
            { key: 'fusion', label: 'BY FUSION'  },
            { key: 'class',  label: 'BY CLASS'   },
          ] as { key: ViewMode; label: string }[]).map(m => (
            <button key={m.key} onClick={() => setViewMode(m.key)} style={{
              padding: '3px 10px', fontSize: 9, letterSpacing: 1,
              fontFamily: 'Space Mono,monospace', cursor: 'pointer', borderRadius: 3,
              background: viewMode === m.key ? '#00c3ff20' : 'transparent',
              border: `1px solid ${viewMode === m.key ? '#00c3ff' : '#162035'}`,
              color: viewMode === m.key ? '#00c3ff' : '#4a6080',
              transition: 'all 0.15s',
            }}>{m.label}</button>
          ))}
        </div>
      </div>

      {/* Summary stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 16 }}>
        {[
          { label: 'BORN',    count: totalBorn,    color: '#39ff14' },
          { label: 'ALIVE',   count: totalAlive,   color: '#00c3ff' },
          { label: 'DIED',    count: totalDied,    color: '#ff0062' },
          { label: 'DORMANT', count: totalDormant, color: '#2a3d58' },
          { label: 'AVG FUSION', count: avgFusion, color: fusionColor(avgFusion), suffix: '/23' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0a1020', border: `1px solid ${s.color}30`, borderRadius: 6, padding: '6px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#4a6080', letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.count}{(s as any).suffix ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* Class filter pills */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedClass(null)} style={{
          padding: '2px 10px', fontSize: 9, letterSpacing: 1,
          fontFamily: 'Space Mono,monospace', cursor: 'pointer', borderRadius: 20,
          background: !selectedClass ? '#ffffff20' : 'transparent',
          border: `1px solid ${!selectedClass ? '#4a6080' : '#162035'}`,
          color: !selectedClass ? '#c8d8e8' : '#4a6080',
        }}>ALL</button>
        {CLASS_ORDER.map(cls => (
          <button key={cls} onClick={() => setSelectedClass(selectedClass === cls ? null : cls)} style={{
            padding: '2px 10px', fontSize: 9, letterSpacing: 1,
            fontFamily: 'Space Mono,monospace', cursor: 'pointer', borderRadius: 20,
            background: selectedClass === cls ? `${CLASS_COLOR[cls]}20` : 'transparent',
            border: `1px solid ${selectedClass === cls ? CLASS_COLOR[cls] : '#162035'}`,
            color: selectedClass === cls ? CLASS_COLOR[cls] : '#4a6080',
          }}>{cls}</button>
        ))}
      </div>

      {/* Heatmap grid — per class */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {classes.map(cls => {
          const cells = allCells
            .filter(c => c.assetClass === cls)
            .sort((a, b) => {
              // BORN first, then ALIVE, then DIED, then DORMANT; within same state sort by fusion desc
              const order = { born: 0, alive: 1, died: 2, dormant: 3 }
              const oa = order[a.state as keyof typeof order] ?? 3
              const ob = order[b.state as keyof typeof order] ?? 3
              if (oa !== ob) return oa - ob
              return b.fusion - a.fusion
            })

          return (
            <div key={cls}>
              {/* Class label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CLASS_COLOR[cls] }} />
                <span style={{ fontSize: 9, letterSpacing: 2, color: CLASS_COLOR[cls], fontFamily: 'Space Mono,monospace', fontWeight: 700 }}>
                  {cls}
                </span>
                <span style={{ fontSize: 8, color: '#2a3d58' }}>
                  {cells.filter(c => c.state === 'born' || c.state === 'alive').length}/{cells.length} active
                </span>
              </div>

              {/* Cells grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 5 }}>
                {cells.map(cell => {
                  const isHov = hoveredCell === cell.ticker
                  // Size based on fusion (relative within class)
                  const maxFusion = Math.max(...cells.map(c => c.fusion), 1)
                  const relSize   = 0.7 + (cell.fusion / maxFusion) * 0.3

                  return (
                    <div
                      key={cell.ticker}
                      onClick={() => onTickerSelect?.(cell.ticker)}
                      onMouseEnter={() => setHoveredCell(cell.ticker)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        background:    getCellBg(cell),
                        border:        `1px solid ${getCellBorder(cell, isHov)}`,
                        borderRadius:  6,
                        padding:       '8px 10px',
                        cursor:        'pointer',
                        transition:    'all 0.15s',
                        boxShadow:     isHov && cell.state !== 'dormant'
                          ? `0 0 12px ${stateColor(cell.state, 0.4)}`
                          : 'none',
                        transform:     isHov ? 'scale(1.02)' : 'scale(1)',
                        opacity:       cell.state === 'dormant' ? 0.6 : 1,
                      }}
                    >
                      {/* Ticker */}
                      <div style={{
                        fontFamily: 'JetBrains Mono,monospace',
                        fontSize:   Math.round(10 * relSize),
                        fontWeight: 700,
                        color:      cell.state === 'dormant' ? '#4a6080' : '#eef4fc',
                        marginBottom: 3,
                        letterSpacing: -0.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {cell.ticker}
                      </div>

                      {/* Fusion bar */}
                      <div style={{ height: 3, background: '#0d1830', borderRadius: 2, marginBottom: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(cell.fusion / 23) * 100}%`,
                          background: fusionColor(cell.fusion),
                          borderRadius: 2,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>

                      {/* State + fusion */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: 7, letterSpacing: 0.5,
                          color: stateColor(cell.state, 1).replace('rgba', 'rgba').replace(',1)', ',0.9)'),
                          fontFamily: 'Space Mono,monospace',
                        }}>
                          {stateLabel(cell.state)}
                        </span>
                        <span style={{ fontSize: 9, color: fusionColor(cell.fusion), fontFamily: 'Space Mono,monospace', fontWeight: 700 }}>
                          {cell.fusion}
                        </span>
                      </div>

                      {/* Tier badge */}
                      {cell.tier && (
                        <div style={{
                          marginTop: 4, fontSize: 7, padding: '1px 4px',
                          color: cell.tier === 'S' ? '#39ff14' : cell.tier === 'A' ? '#00c3ff' : cell.tier === 'B' ? '#ffd700' : '#ff8c00',
                          border: `1px solid currentColor`, display: 'inline-block', letterSpacing: 1,
                          opacity: 0.8,
                        }}>
                          T{cell.tier}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #162035' }}>
        <span style={{ fontSize: 9, color: '#4a6080', fontFamily: 'Space Mono,monospace', letterSpacing: 1 }}>LEGEND:</span>
        {[
          { color: '#39ff14', label: 'BORN — fresh momentum' },
          { color: '#00c3ff', label: 'ALIVE — trending'      },
          { color: '#ff0062', label: 'DIED — fading'         },
          { color: '#2a3d58', label: 'DORMANT — flat'        },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 9, color: '#4a6080', fontFamily: 'Space Mono,monospace' }}>{l.label}</span>
          </div>
        ))}
        {onTickerSelect && (
          <span style={{ fontSize: 9, color: '#2a3d58', fontFamily: 'Space Mono,monospace', marginLeft: 'auto' }}>
            Click cell → open chart
          </span>
        )}
      </div>
    </div>
  )
}
