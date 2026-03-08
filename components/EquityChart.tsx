'use client'

import { useEffect, useRef } from 'react'

const PTS = [
  0,2,-1,4,8,6,10,7,12,15,11,18,14,20,16,22,19,24,21,26,23,28,25,30,
  27,32,29,35,33,38,36,40,38,42,40,45,43,47,46,50,48,52,50,55,53,57,
  56,60,58,62,60,65,63,67,66,70,68,72,70,75,73,78,76,80,78,83,81,86,
  84,88,87,91,90,94,93,97,96,100,98,103,101,106,104,109,107,112,110,115,
  113,118,116,121,119,124,122,127,125,130,128,133,131,136,134,139,137,
  142,140,145,143,148,146,151,149,155,152,158,155,161,158,164,162,168,
  165,171,168,174,171,178,174,181,177,184,180,187,183,190,186,192,
]

export default function EquityChart() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth || 340
    const H = 180
    canvas.width  = W
    canvas.height = H

    const min = Math.min(...PTS)
    const max = Math.max(...PTS)
    const pad = 12

    const toX = (i: number) => pad + (i / (PTS.length - 1)) * (W - pad * 2)
    const toY = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2)

    // gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(57,255,20,0.18)')
    grad.addColorStop(1, 'rgba(57,255,20,0)')
    ctx.beginPath()
    ctx.moveTo(toX(0), H)
    PTS.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(PTS.length - 1), H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // line
    ctx.beginPath()
    PTS.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.strokeStyle = '#39ff14'
    ctx.lineWidth   = 1.5
    ctx.stroke()

    // end dot
    ctx.beginPath()
    ctx.arc(toX(PTS.length - 1), toY(PTS[PTS.length - 1]), 4, 0, Math.PI * 2)
    ctx.fillStyle = '#39ff14'
    ctx.fill()
  }, [])

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--white)', lineHeight: 1.4 }}>
          Equity Curve<br />(Backtest 2022–2025)
        </div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: 800, color: '#39ff14', letterSpacing: '-1px' }}>+192%</div>
      </div>
      <canvas ref={ref} style={{ width: '100%', height: '180px', display: 'block' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
        {[
          { l: 'Start Capital', v: '$10,000',  c: 'var(--white)' },
          { l: 'End Capital',   v: '$29,200',  c: '#39ff14'      },
          { l: 'Best Month',    v: '+18.4%',   c: '#39ff14'      },
          { l: 'Worst Month',   v: '−6.2%',    c: '#ff0062'      },
        ].map(m => (
          <div key={m.l} style={{ background: 'var(--panel2)', padding: '10px 14px' }}>
            <div style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px', marginBottom: '3px' }}>{m.l}</div>
            <div style={{ fontSize: '13px', color: m.c, fontFamily: 'Space Mono,monospace' }}>{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
