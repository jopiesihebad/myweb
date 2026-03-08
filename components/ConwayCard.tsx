'use client'

import { useEffect, useRef } from 'react'

export type ConwayState = 'born' | 'alive' | 'dormant' | 'died'

export type ConwayCardData = {
  sym:     string
  tf:      string
  price:   string
  chg:     string
  up:      boolean
  state:   ConwayState
  cells:   (0|1)[]   // 8 booleans
  fusion:  number
  grade:   string
  details: { name: string; on: boolean }[]
}

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

export default function ConwayCard({ d }: { d: ConwayCardData }) {
  const pipRefs = useRef<(HTMLDivElement|null)[]>([])

  /* ── pip pulse animation ── */
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
    <div className={`cw-card ${d.state}`} style={{ position: 'relative' }}>
      {/* cell detail hover overlay */}
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

      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: 800 }}>{d.sym}</div>
          <div style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px', marginTop: '2px' }}>{d.tf}</div>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid', ...BADGE_STYLE[d.state] }}>
          {BADGE_LABEL[d.state]}
        </div>
      </div>

      {/* price */}
      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '26px', fontWeight: 400, letterSpacing: '-1px', lineHeight: 1 }}>{d.price}</div>
      <div style={{ fontSize: '11px', margin: '6px 0 18px', color: d.up ? '#39ff14' : '#ff0062' }}>{d.chg}</div>

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
          {['Weekly','SQZ','Session','OFI'].map(l => (
            <span key={l} style={{ fontSize: '8px', color: 'var(--gray2)', letterSpacing: '0.5px', textAlign: 'center' }}>{l}</span>
          ))}
        </div>
      </div>

      {/* bottom row */}
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
