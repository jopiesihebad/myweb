'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' },
})

export default function Hero() {
  return (
    <div className="hero-grid" style={{
      position: 'relative', zIndex: 1, minHeight: '100vh',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px',
      alignItems: 'center', padding: '80px 48px 60px',
      maxWidth: '1440px', margin: '0 auto',
    }}>
      {/* ── LEFT ── */}
      <div>
        <motion.div {...fade(0.1)} style={{ marginBottom: '28px' }}>
          <Badge variant="outline" style={{ borderColor: 'var(--border2)', color: 'var(--cyan)' }}>
            <div className="ldot" style={{ marginRight: '8px' }} />
            SS BlackBox v6.3.1 — Conway Automaton Engine
          </Badge>
        </motion.div>

        <h1 style={{
          fontFamily: 'Syne,sans-serif', fontSize: 'clamp(52px,6.5vw,100px)',
          fontWeight: 800, lineHeight: 0.88, letterSpacing: '-4px', marginBottom: '28px',
        }}>
          <motion.span {...fade(0.15)} style={{ display: 'block', color: 'var(--white)' }}>SIGNAL.</motion.span>
          <motion.span {...fade(0.30)} style={{ display: 'block', color: 'transparent', WebkitTextStroke: '1.5px var(--cyan)' }}>DECIDE.</motion.span>
          <motion.span {...fade(0.45)} style={{ display: 'block', color: 'var(--cyan)' }}>EXECUTE.</motion.span>
        </h1>

        <motion.p {...fade(0.6)} style={{
          fontSize: '13px', lineHeight: 1.9, color: 'var(--gray)',
          maxWidth: '480px', marginBottom: '32px',
        }}>
          The world&apos;s first <strong style={{ color: 'var(--white)' }}>Conway Automaton</strong> signal intelligence platform.<br />
          8-cell state engine × 23-point confluence × autonomous execution.<br />
          <strong style={{ color: 'var(--white)' }}>Not a prediction. A verified system.</strong>
        </motion.p>

        {/* ── CTA BUTTONS ── */}
        <motion.div {...fade(0.75)} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <Button
            variant="default"
            size="lg"
            onClick={() => window.open('https://utas.stockindexer.com/checkout/pro', '_blank')}
            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
          >
            🚀 MULAI 14 HARI GRATIS
          </Button>
          <Button
            variant="gold"
            size="lg"
            onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }}
          >
            💎 LIHAT PRICING &amp; ELITE →
          </Button>
        </motion.div>

        {/* ── SOCIAL PROOF ── */}
        <motion.div {...fade(0.9)} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          flexWrap: 'wrap', marginTop: '4px',
        }}>
          {[
            { hl: '1.450+', text: 'member aktif' },
            null,
            { hl: '68%',    text: 'win rate rata-rata' },
            null,
            { hl: '+18.4%', text: 'pieBot profit bulan lalu' },
          ].map((item, i) =>
            item === null
              ? <span key={i} style={{ color: 'var(--border2)', fontSize: '12px' }}>•</span>
              : (
                <span key={i} style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '1px' }}>
                  <span style={{ color: 'var(--lime)', fontWeight: 700 }}>{item.hl}</span>
                  {' '}{item.text}
                </span>
              )
          )}
        </motion.div>
      </div>

      {/* ── RIGHT: TERMINAL ── */}
      <motion.div
        className="hero-terminal"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,var(--cyan),var(--lime),var(--gold))' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--panel2)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
          <span style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--gray)', marginLeft: '8px' }}>
            conway_engine.pine — bar_close 17:00 UTC+7
          </span>
        </div>
        <div style={{ padding: '20px', fontSize: '11px', lineHeight: 1.9, fontFamily: 'JetBrains Mono,monospace' }}>
          {[
            { p: '▸', cmd: 'conway.scan(BTCUSDT, 1H)', out: null },
            { out: '  cell[0] weekly_trend',  val: '  DEAD  (bearish)',   vc: '#ff0062' },
            { out: '  cell[1] baseline',      val: '    DEAD  (below BBMC)', vc: '#ff0062' },
            { out: '  cell[2] sqz_released',  val: '  LIVE  ✓',          vc: '#39ff14' },
            { out: '  cell[3] volume',        val: '      DEAD  (thin)',  vc: '#ff0062' },
            { out: '  cell[4] predator',      val: '    DEAD  (stagnant)',vc: '#ff0062' },
            { out: '  cell[5] structure',     val: '   DEAD  (no BOS)',   vc: '#ff0062' },
            { out: '  cell[6] session',       val: '     LIVE  (London) ✓', vc: '#39ff14' },
            { out: '  cell[7] ofi',           val: '         DEAD  (neutral)', vc: '#ff0062' },
            null,
            { p: '▸', cmd: 'conway.state()', out: null },
            { out: '  live_cells',    val: '    2 / 8',        vc: '#ff8c00' },
            { out: '  state',         val: '         ○ DORMANT', vc: '#ff0062' },
            { out: '  fusion_score',  val: '  9 / 23  [GRADE 4]', vc: '#ff8c00' },
            { out: '  signal',        val: '        ✗ NO ENTRY — skip', vc: '#ff0062' },
            null,
          ].map((line, i) => {
            if (line === null) return <div key={i} style={{ height: '8px' }} />
            return (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                {line.p && <span style={{ color: 'var(--cyan)' }}>{line.p}</span>}
                {line.cmd && <span style={{ color: 'var(--white)' }}>{line.cmd}</span>}
                {line.out && <span style={{ color: 'var(--gray)' }}>{line.out}</span>}
                {line.val && <span style={{ color: line.vc }}>{line.val}</span>}
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
            <span style={{ color: 'var(--cyan)' }}>▸</span>
            <span style={{ color: '#39ff14' }}>bot.status</span>
            <span style={{ color: 'var(--gray)' }}> → IDLE — waiting for BORN/ALIVE ≥5</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--cyan)' }}>▸</span>
            <span className="term-cursor" />
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--border)', marginTop: '1px' }}>
          {[
            { v: '81.8%', l: 'BBP Win Rate',    c: '#39ff14' },
            { v: '287',   l: 'Backtest Trades',  c: '#00c3ff' },
            { v: '1.92',  l: 'Profit Factor',    c: '#ffd700' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--panel2)', padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: 800, letterSpacing: '-1px', color: s.c }}>{s.v}</div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray)', marginTop: '2px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
