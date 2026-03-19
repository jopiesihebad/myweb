'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Tier } from '@/lib/useWebSocket'
import type { AssetClass } from '@/lib/assetRegistry'
import { useWsSignal, type AssetState, type ConwayState } from '@/components/WebSocketProvider'
import { PINE_ASSETS } from '@/lib/assetRegistry'

export type ConwayCardData = {
  sym:        string
  tf:         string
  price:      string
  chg:        string
  up:         boolean
  state:      ConwayState
  cells:      (0 | 1)[]    // 8-element
  fusion:     number
  grade:      string
  tier:       Tier | null
  assetClass: AssetClass
  details:    { name: string; on: boolean }[]
}

// ─── Style maps ───────────────────────────────────────────────
const BADGE_STYLE: Record<ConwayState, React.CSSProperties> = {
  born:    { color: '#39ff14', borderColor: 'rgba(57,255,20,0.4)',  background: 'rgba(57,255,20,0.06)'  },
  alive:   { color: '#00c3ff', borderColor: 'rgba(0,195,255,0.4)',  background: 'rgba(0,195,255,0.06)'  },
  dormant: { color: '#5a7090', borderColor: '#1e2e4a',              background: 'transparent'           },
  died:    { color: '#ff0062', borderColor: 'rgba(255,0,98,0.4)',   background: 'rgba(255,0,98,0.06)'   },
}
const BADGE_LABEL: Record<ConwayState, string> = {
  born: 'BORN 🟢', alive: 'ALIVE ✦', dormant: 'DORMANT ○', died: 'DIED 🔴',
}
const FUSION_COLOR: Record<ConwayState, string> = {
  born: '#39ff14', alive: '#00c3ff', dormant: '#5a7090', died: '#ff0062',
}

// Tier badge colors
const TIER_COLOR: Record<NonNullable<Tier>, string> = {
  S: '#39ff14',
  A: '#00c3ff',
  B: '#ffd700',
  C: '#ff8c00',
}

// Asset class badge colors
const CLASS_COLOR: Record<AssetClass, string> = {
  CRYPTO:    '#bd93f9',
  FOREX:     '#00c3ff',
  COMMODITY: '#ffd700',
  IDX:       '#ff8c00',
  USA:       '#39ff14',
}

// One card per asset class — 5 classes = 5 rotating slots
const CLASS_ORDER: AssetClass[] = ['CRYPTO', 'COMMODITY', 'FOREX', 'IDX', 'USA']

// Build default card data from assetState
function buildCardData(state: AssetState): ConwayCardData {
  const asset = PINE_ASSETS.find(a => a.ticker === state.ticker)
  const cellArr = state.cells_arr.length === 8 ? state.cells_arr : [0,0,0,0,0,0,0,0]
  const gradeNum = state.fusion >= 18 ? 1 : state.fusion >= 14 ? 2 : state.fusion >= 10 ? 3 : state.fusion >= 7 ? 4 : 5
  return {
    sym:        state.ticker,
    tf:         '1H',
    price:      state.lastClose?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—',
    chg:        '—',
    up:         state.conwayState === 'born' || state.conwayState === 'alive',
    state:      state.conwayState,
    cells:      cellArr as (0 | 1)[],
    fusion:     state.fusion,
    grade:      `GRADE ${gradeNum}`,
    tier:       state.tier,
    assetClass: state.assetClass,
    details: [
      { name: 'Weekly Trend',  on: cellArr[0] === 1 },
      { name: 'Baseline',      on: cellArr[1] === 1 },
      { name: 'SQZ Released',  on: cellArr[2] === 1 },
      { name: 'Volume',        on: cellArr[3] === 1 },
      { name: 'Predator',      on: cellArr[4] === 1 },
      { name: 'Structure',     on: cellArr[5] === 1 },
      { name: 'Prime Session', on: cellArr[6] === 1 },
      { name: 'OFI Aligned',   on: cellArr[7] === 1 },
    ],
  }
}

// ─── Single card display ──────────────────────────────────────
function CardDisplay({ d, pinned, onPin }: { d: ConwayCardData; pinned: boolean; onPin: () => void }) {
  const pipRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = []
    pipRefs.current.forEach((pip, i) => {
      if (!pip || !d.cells[i]) return
      const id = setInterval(() => {
        if (pip) pip.style.opacity = pip.style.opacity === '0.35' ? '1' : '0.35'
      }, 400 + Math.random() * 400)
      intervals.push(id)
    })
    return () => intervals.forEach(clearInterval)
  }, [d.cells])

  return (
    <div
      className={`cw-card ${d.state}`}
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={onPin}
      title={pinned ? 'Click to unpin' : 'Click to pin this card'}
    >
      {/* Pin indicator */}
      {pinned && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '8px', letterSpacing: '1.5px', color: '#00c3ff', opacity: 0.7 }}>
          ◉ PINNED
        </div>
      )}

      {/* Cell detail hover overlay */}
      <div className="cell-detail">
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', marginBottom: '8px', textTransform: 'uppercase' }}>
          {d.sym} · Cell Breakdown
        </div>
        {d.details.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
            <span style={{ color: 'var(--gray)' }}>Cell {i} · {c.name}</span>
            <span style={{ color: c.on ? '#39ff14' : '#2a3d58' }}>{c.on ? 'LIVE ✓' : 'DEAD ✗'}</span>
          </div>
        ))}
        <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '9px', color: 'var(--gray)', letterSpacing: '2px' }}>ESC</div>
      </div>

      {/* Top row: sym + badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800 }}>{d.sym}</div>
          <div style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px', marginTop: '2px' }}>{d.tf}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          {/* Conway state badge */}
          <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '3px 9px', border: '1px solid', ...BADGE_STYLE[d.state] }}>
            {BADGE_LABEL[d.state]}
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {/* Asset class badge */}
            <div style={{
              fontSize: '8px', letterSpacing: '1.5px', padding: '2px 7px',
              border: `1px solid ${CLASS_COLOR[d.assetClass]}40`,
              color: CLASS_COLOR[d.assetClass],
              background: `${CLASS_COLOR[d.assetClass]}10`,
            }}>
              {d.assetClass}
            </div>
            {/* Tier badge */}
            {d.tier && (
              <div style={{
                fontSize: '8px', letterSpacing: '1.5px', padding: '2px 7px',
                border: `1px solid ${TIER_COLOR[d.tier]}60`,
                color: TIER_COLOR[d.tier],
                background: `${TIER_COLOR[d.tier]}10`,
                fontWeight: 700,
              }}>
                TIER {d.tier}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '26px', fontWeight: 400, letterSpacing: '-1px', lineHeight: 1 }}>{d.price}</div>
      <div style={{ fontSize: '11px', margin: '6px 0 16px', color: d.up ? '#39ff14' : '#ff0062' }}>{d.chg}</div>

      {/* 8 pips */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '3px', marginBottom: '5px' }}>
          {d.cells.map((on, i) => (
            <div
              key={i}
              ref={el => { pipRefs.current[i] = el }}
              className={`pip${on ? (d.state === 'born' ? ' on born-pip' : ' on') : ''}`}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2px' }}>
          {['Weekly', 'SQZ', 'Session', 'OFI'].map(l => (
            <span key={l} style={{ fontSize: '8px', color: 'var(--gray2)', letterSpacing: '0.5px', textAlign: 'center' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '1px' }}>{d.grade}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: 800, color: FUSION_COLOR[d.state], letterSpacing: '-1px', lineHeight: 1 }}>{d.fusion}</div>
          <div style={{ fontSize: '9px', color: 'var(--gray)' }}>/ 23 FUSION</div>
        </div>
      </div>
    </div>
  )
}

// ─── ConwayCards — 5 rolling cards (one per asset class) ─────
// - Auto-rolls every 8s unless pinned
// - Each slot shows the "best" (highest fusion) asset for that class
export default function ConwayCards() {
  const { assetStates } = useWsSignal()
  const [pinnedClass, setPinnedClass] = useState<AssetClass | null>(null)
  const [activeClass, setActiveClass] = useState<AssetClass>('CRYPTO')
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-roll every 8s unless pinned
  useEffect(() => {
    if (pinnedClass) {
      if (rollTimer.current) clearInterval(rollTimer.current)
      return
    }
    rollTimer.current = setInterval(() => {
      setActiveClass(prev => {
        const idx = CLASS_ORDER.indexOf(prev)
        return CLASS_ORDER[(idx + 1) % CLASS_ORDER.length]
      })
    }, 8000)
    return () => { if (rollTimer.current) clearInterval(rollTimer.current) }
  }, [pinnedClass])

  // For each class, pick highest-fusion Pine asset
  const getBestForClass = useCallback((cls: AssetClass): AssetState | null => {
    const classAssets = PINE_ASSETS.filter(a => a.assetClass === cls)
    let best: AssetState | null = null
    for (const a of classAssets) {
      const s = assetStates[a.ticker]
      if (!s) continue
      if (!best || s.fusion > best.fusion) best = s
    }
    return best
  }, [assetStates])

  const handlePin = useCallback((cls: AssetClass) => {
    if (pinnedClass === cls) {
      setPinnedClass(null) // unpin
    } else {
      setPinnedClass(cls)
      setActiveClass(cls)
    }
  }, [pinnedClass])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Class selector tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {CLASS_ORDER.map(cls => {
          const isActive = activeClass === cls
          const isPinned = pinnedClass === cls
          return (
            <button
              key={cls}
              onClick={() => {
                setActiveClass(cls)
                if (pinnedClass !== cls) setPinnedClass(null)
              }}
              style={{
                padding: '3px 10px',
                fontSize: '9px',
                letterSpacing: '1.5px',
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 700,
                cursor: 'pointer',
                background: isActive ? `${CLASS_COLOR[cls]}15` : 'transparent',
                border: `1px solid ${isActive ? CLASS_COLOR[cls] : '#1e2e4a'}`,
                color: isActive ? CLASS_COLOR[cls] : '#5a7090',
                transition: 'all 0.15s',
              }}
            >
              {cls}{isPinned ? ' ◉' : ''}
            </button>
          )
        })}
        <div style={{ fontSize: '9px', color: '#5a7090', alignSelf: 'center', marginLeft: '4px' }}>
          {pinnedClass ? '● PINNED' : '○ AUTO-ROLL 8s'}
        </div>
      </div>

      {/* Active card */}
      {(() => {
        const state = getBestForClass(activeClass)
        if (!state) {
          // Fallback placeholder
          const asset = PINE_ASSETS.find(a => a.assetClass === activeClass)
          if (!asset) return null
          const placeholder: AssetState = {
            ticker: asset.ticker, assetClass: activeClass,
            conwayState: 'dormant', cells: 0, cells_arr: [0,0,0,0,0,0,0,0],
            fusion: 0, tier: null, lastSignal: null, lastClose: null, lastUpdate: null,
          }
          return (
            <CardDisplay
              key={activeClass}
              d={buildCardData(placeholder)}
              pinned={pinnedClass === activeClass}
              onPin={() => handlePin(activeClass)}
            />
          )
        }
        return (
          <CardDisplay
            key={activeClass + state.ticker}
            d={buildCardData(state)}
            pinned={pinnedClass === activeClass}
            onPin={() => handlePin(activeClass)}
          />
        )
      })()}
    </div>
  )
}


// ─── ConwayAllCards — 5 cards, each rolling independently ────
// Each card = 1 asset class, cycles through its assets every 8s
// Assets sorted: active signals first (BORN→ALIVE→DIED→DORMANT), then fusion desc
export function ConwayAllCards() {
  const { assetStates } = useWsSignal()

  const [indices, setIndices] = useState<Record<AssetClass, number>>(
    () => Object.fromEntries(CLASS_ORDER.map(cls => [cls, 0])) as Record<AssetClass, number>
  )

  useEffect(() => {
    const id = setInterval(() => {
      setIndices(prev => {
        const next = { ...prev }
        for (const cls of CLASS_ORDER) {
          const total = PINE_ASSETS.filter(a => a.assetClass === cls).length
          next[cls] = (prev[cls] + 1) % total
        }
        return next
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
      {CLASS_ORDER.map(cls => {
        const classAssets = PINE_ASSETS
          .filter(a => a.assetClass === cls)
          .sort((a, b) => {
            const sa = assetStates[a.ticker]
            const sb = assetStates[b.ticker]
            const stateOrder = (s: AssetState | undefined) =>
              !s ? 3 : s.conwayState === 'born' ? 0 : s.conwayState === 'alive' ? 1 : s.conwayState === 'died' ? 2 : 3
            const oa = stateOrder(sa), ob = stateOrder(sb)
            if (oa !== ob) return oa - ob
            return (sb?.fusion ?? 0) - (sa?.fusion ?? 0)
          })

        const idx   = indices[cls] % classAssets.length
        const asset = classAssets[idx]
        const state = asset ? assetStates[asset.ticker] : undefined

        const cardState: AssetState = state ?? {
          ticker:      asset?.ticker ?? cls,
          assetClass:  cls,
          conwayState: 'dormant',
          cells:       0,
          cells_arr:   [0,0,0,0,0,0,0,0],
          fusion:      0,
          tier:        null,
          lastSignal:  null,
          lastClose:   null,
          lastUpdate:  null,
        }

        return (
          <div key={cls} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Pagination dots — one per asset in class */}
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
              {classAssets.map((a, i) => {
                const s    = assetStates[a.ticker]
                const isActive = i === idx
                const dotColor =
                  s?.conwayState === 'born'  ? '#39ff14' :
                  s?.conwayState === 'alive' ? '#00c3ff' :
                  s?.conwayState === 'died'  ? '#ff0062' : '#1e2e4a'
                return (
                  <div key={a.ticker} title={a.ticker} style={{
                    width:        isActive ? 16 : 6,
                    height:       6,
                    borderRadius: 3,
                    background:   isActive ? dotColor : '#1e2e4a',
                    transition:   'all 0.4s ease',
                  }} />
                )
              })}
            </div>

            <CardDisplay
              d={buildCardData(cardState)}
              pinned={false}
              onPin={() => {}}
            />

            {/* Ticker + position counter */}
            <div style={{ textAlign: 'center', fontSize: '8px', color: '#2a3d58', letterSpacing: '1px', fontFamily: 'Space Mono,monospace' }}>
              {asset?.ticker} · {idx + 1}/{classAssets.length}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Also export single card for direct use
export { CardDisplay }
