'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const PRO_FEATURES = [
  { t: 'hi',  text: 'Conway live state — all assets (crypto, forex, IDX)' },
  { t: 'hi',  text: 'Real-time signal feed ≤500ms latency' },
  { t: 'hi',  text: 'BBP + Conway alerts via Telegram bot' },
  { t: 'on',  text: 'TradingView webhook config guide' },
  { t: 'on',  text: 'Live win rate tracker dashboard' },
  { t: 'on',  text: 'Chart snapshot on every signal' },
  { t: 'on',  text: '14-day money-back guarantee' },
  { t: 'off', text: 'Conway Automaton bot access (coming)' },
]
const ELITE_FEATURES = [
  { t: 'gold', text: 'Everything in PRO, forever — no renewal' },
  { t: 'gold', text: 'Ownership Intelligence IDX (saham screening)' },
  { t: 'gold', text: 'AI Q&A IDX stocks (pieBot Sovereign)' },
  { t: 'gold', text: 'Portfolio Risk Dashboard' },
  { t: 'gold', text: 'Full Backtest Simulator access' },
  { t: 'gold', text: 'Managed Conway Automaton bot' },
  { t: 'gold', text: 'Priority signal <100ms latency' },
  { t: 'on',   text: '1-on-1 onboarding setup session' },
]
const ENT_FEATURES = [
  { t: 'on', text: 'Everything in ELITE' },
  { t: 'on', text: 'Multi-seat team access (up to 50 users)' },
  { t: 'on', text: 'White-label signal engine' },
  { t: 'on', text: 'Custom webhook integrations' },
  { t: 'on', text: 'Dedicated account manager' },
  { t: 'on', text: 'SLA 99.9% uptime guarantee' },
  { t: 'on', text: 'Custom bot strategy setup' },
]

type FeatItem = { t: string; text: string }

function FeatureList({ items }: { items: FeatItem[] }) {
  return (
    <ul className="pc-features" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
      {items.map((f, i) => (
        <li key={i} className={f.t === 'gold' ? 'gold-f' : f.t === 'on' ? 'on' : f.t === 'hi' ? 'hi' : ''}
          style={{ color: f.t === 'gold' ? '#ffd700' : f.t === 'hi' ? 'var(--white)' : f.t === 'on' ? 'var(--gray)' : 'var(--gray2)' }}>
          {f.text}
        </li>
      ))}
    </ul>
  )
}

const cardAnim = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

export default function PricingSection() {
  return (
    <>
      {/* ── Guarantee bar (top) ── */}
      <div className="guarantee-bar" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '16px' }}>🛡️</span>
        <span style={{ fontSize: '11px', color: 'var(--gray)', letterSpacing: '0.3px' }}>
          <strong style={{ color: 'var(--white)' }}>Garansi Uang Kembali 14 Hari</strong> — Tidak puas dalam 14 hari pertama? Refund penuh, tanpa pertanyaan.
        </span>
        <a href="#" style={{ fontSize: '9px', color: 'var(--cyan)', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(0,195,255,0.3)', paddingBottom: '1px' }}>
          Baca kebijakan refund →
        </a>
      </div>

      {/* ── Pricing section ── */}
      <div className="sec" id="pricing" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sec-eyebrow">Access Tiers</div>
        <h2 className="sec-h">Choose Your<br />Intelligence Level.</h2>
        <p className="sec-p">All plans include transparent win rate tracking, verified backtest results, and real-time BBP signals. Garansi 14 hari uang kembali.</p>

        {/* 3-card grid */}
        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>

          {/* PRO */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0 }}
            className="pc feat" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-1px', right: '24px' }}>
              <Badge variant="cyan">Most Popular</Badge>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '14px' }}>PRO</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '52px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, marginBottom: '2px' }}>
              <span style={{ fontSize: '18px', color: 'var(--gray)', verticalAlign: 'super' }}>Rp</span>497.000
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', marginBottom: '4px' }}>per bulan · cancel kapan saja</div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', marginBottom: '24px' }}>≈ <span style={{ color: 'var(--white)' }}>$49 USD</span> / month</div>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />
            <FeatureList items={PRO_FEATURES} />
            <Button
              variant="default"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/pro','_blank')}
              style={{ width: '100%', justifyContent: 'center', clipPath: 'none' }}
            >
              🚀 MULAI 14 HARI GRATIS
            </Button>
          </motion.div>

          {/* ELITE */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.1 }}
            style={{ background: 'var(--panel)', border: '1px solid rgba(255,215,0,0.3)', backgroundImage: 'linear-gradient(160deg,rgba(255,215,0,0.03) 0%,var(--panel) 60%)', padding: '32px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s,transform 0.3s' }}
            whileHover={{ y: -4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,var(--gold),var(--orange))' }} />
            <div style={{ position: 'absolute', top: '-1px', right: '24px' }}>
              <Badge variant="gold">⭐ LIFETIME</Badge>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '14px' }}>ELITE</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '52px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, marginBottom: '2px', color: 'var(--gold)' }}>
              <span style={{ fontSize: '18px', fontWeight: 400, verticalAlign: 'super' }}>Rp</span>2.999.000
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', marginBottom: '4px' }}>SEKALI BAYAR — akses selamanya <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '10px' }}>Rp 5.964.000</span></div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', marginBottom: '24px' }}>≈ <span style={{ color: 'var(--gold)' }}>$249 USD</span> one-time</div>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />
            <FeatureList items={ELITE_FEATURES} />
            <Button
              variant="gold"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/elite','_blank')}
              style={{ width: '100%', justifyContent: 'center', background: 'var(--gold)', color: 'var(--bg)', border: 'none' }}
            >
              💎 BELI ELITE LIFETIME →
            </Button>
          </motion.div>

          {/* ENTERPRISE */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.2 }}
            className="pc" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '14px' }}>ENTERPRISE</div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '38px', fontWeight: 800, color: 'var(--gray)', marginBottom: '2px' }}>Custom</div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', marginBottom: '28px' }}>Hubungi sales untuk harga khusus</div>
            <div style={{ height: '1px', background: 'var(--border)', marginBottom: '20px' }} />
            <FeatureList items={ENT_FEATURES} />
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('https://t.me/stockindexer_support','_blank')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Hubungi Sales →
            </Button>
            <p style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '10px' }}>
              Email <a href="mailto:enterprise@stockindexer.com" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>enterprise@stockindexer.com</a>
            </p>
          </motion.div>
        </div>

        {/* ── USDC Bonus Box ── */}
        <div className="usdc-box" style={{ marginBottom: '28px' }}>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '28px', alignItems: 'center' }}>
            <div style={{ fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(57,255,20,0.4))' }}>💎</div>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--white)' }}>
                Bayar Pakai <span style={{ color: '#39ff14' }}>USDC</span> — Diskon 10–12%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', lineHeight: 1.8, marginBottom: '14px' }}>
                Hemat lebih banyak dengan membayar langsung pakai USDC. Proses instan, tanpa biaya transfer bank, konfirmasi 2 menit.
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {['① Pilih plan di atas','② Pilih "USDC" di checkout UTAS','③ Transfer ke alamat wallet','④ Konfirmasi otomatis · akses langsung'].map(s => (
                  <div key={s} style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.18)', padding: '5px 12px', fontSize: '10px', color: '#39ff14', letterSpacing: '0.5px' }}>{s}</div>
                ))}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', padding: '4px 12px', fontSize: '10px', color: '#39ff14', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                ⚡ USDC DISCOUNT: PRO 10% OFF · ELITE 12% OFF
              </div>
            </div>
          </div>
        </div>

        {/* ── Payment methods bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', padding: '16px 48px', background: 'var(--panel2)', border: '1px solid var(--border)', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gray)', marginRight: '4px' }}>Metode Pembayaran:</span>
          {[
            { l: '⊞ QRIS', extra: { borderColor: 'rgba(189,147,249,0.25)', color: '#bd93f9' } },
            { l: 'DANA' }, { l: 'OVO' }, { l: 'GoPay' },
            { l: 'VA BNI/BRI/Mandiri' }, { l: 'Alfamart / Indomaret' },
            { l: '⬡ USDC', extra: { borderColor: 'rgba(57,255,20,0.25)', color: '#39ff14' } },
          ].map(p => (
            <span key={p.l} style={{ fontSize: '9px', letterSpacing: '1px', padding: '4px 10px', border: '1px solid var(--border2)', color: 'var(--gray)', transition: 'all 0.2s', ...p.extra }}>
              {p.l}
            </span>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--gray)', marginTop: '8px', letterSpacing: '0.5px' }}>
          Semua pembayaran diproses via <strong style={{ color: 'var(--white)' }}>UTAS</strong> — checkout terenkripsi dan aman.
        </p>
      </div>

      {/* ── Guarantee bar (bottom) ── */}
      <div className="guarantee-bar" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '16px' }}>🛡️</span>
        <span style={{ fontSize: '11px', color: 'var(--gray)' }}>
          <strong style={{ color: 'var(--white)' }}>14-Day Money-Back Guarantee</strong> — Not satisfied? Full refund, no questions asked.
        </span>
        <a href="#" style={{ fontSize: '9px', color: 'var(--cyan)', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(0,195,255,0.3)', paddingBottom: '1px' }}>Read policy →</a>
      </div>
    </>
  )
}
