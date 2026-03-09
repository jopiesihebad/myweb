'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/* ─── Prices in IDR (source of truth) ─── */
const PRICES = {
  PRO_IDR:         497_000,
  PRO_IDR_ORIG:    994_000,   // crossed-out original
  ELITE_IDR:     2_999_000,
  ELITE_IDR_ORIG: 5_964_000,  // crossed-out original
}

const FALLBACK_RATE = 16200   // IDR per 1 USD — fallback if API fails

function fmtIDR(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}
function fmtUSD(idr: number, rate: number) {
  const usd = idr / rate
  return '$' + (usd < 10 ? usd.toFixed(2) : Math.round(usd).toLocaleString('en-US'))
}

/* ─── Features ─── */
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
  { t: 'gold', text: 'Ownership Intelligence IDX (stock screening)' },
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
        <li key={i}
          className={f.t === 'gold' ? 'gold-f' : f.t === 'on' ? 'on' : f.t === 'hi' ? 'hi' : ''}
          style={{ color: f.t === 'gold' ? '#ffd700' : f.t === 'hi' ? '#eef4fc' : f.t === 'on' ? '#5a7090' : '#2a3d58' }}>
          {f.text}
        </li>
      ))}
    </ul>
  )
}

/* ─── Price block component ─── */
function PriceBlock({
  idr, idrOrig, rate, rateLoading, color = '#eef4fc', subLabel,
}: {
  idr: number; idrOrig: number; rate: number; rateLoading: boolean
  color?: string; subLabel: string
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Crossed-out original price */}
      <div style={{
        fontSize: '12px', color: '#2a3d58', textDecoration: 'line-through',
        letterSpacing: '0.5px', marginBottom: '4px', fontFamily: '"JetBrains Mono", monospace',
      }}>
        {fmtIDR(idrOrig)}
      </div>

      {/* Main IDR price */}
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: '52px', fontWeight: 800,
        letterSpacing: '-3px', lineHeight: 1, color, marginBottom: '4px',
      }}>
        <span style={{ fontSize: '20px', fontWeight: 400, verticalAlign: 'super', letterSpacing: 0 }}>Rp </span>
        {(idr).toLocaleString('id-ID')}
      </div>

      {/* Sub-label (per bulan / sekali bayar) */}
      <div style={{ fontSize: '11px', color: '#5a7090', marginBottom: '6px' }}>
        {subLabel}
      </div>

      {/* Realtime USD conversion */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: 'rgba(0,195,255,0.05)', border: '1px solid rgba(0,195,255,0.15)',
        padding: '3px 10px', fontSize: '10px', letterSpacing: '0.5px',
      }}>
        <span style={{ color: '#5a7090' }}>≈</span>
        <span style={{ color: '#00c3ff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
          {rateLoading ? '…' : fmtUSD(idr, rate)} USD
        </span>
        {!rateLoading && (
          <span style={{ color: '#2a3d58', fontSize: '9px' }}>
            · live rate
          </span>
        )}
      </div>
    </div>
  )
}

const cardAnim = {
  initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 },
  viewport: { once: true }, transition: { duration: 0.5 },
}

export default function PricingSection() {
  const [rate, setRate]           = useState(FALLBACK_RATE)
  const [rateLoading, setLoading] = useState(true)
  const [rateTs, setRateTs]       = useState<string | null>(null)

  /* Fetch live IDR/USD rate once on mount */
  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        // frankfurter.app — free, no API key, ~4h cache
        const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR')
        const data = await res.json() as { rates: { IDR: number }; date: string }
        if (!cancelled && data?.rates?.IDR) {
          setRate(data.rates.IDR)
          setRateTs(data.date)
        }
      } catch {
        // keep FALLBACK_RATE silently
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRate()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      {/* ── Guarantee bar (top) ── */}
      <div className="guarantee-bar" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '16px' }}>🛡️</span>
        <span style={{ fontSize: '11px', color: '#5a7090', letterSpacing: '0.3px' }}>
          <strong style={{ color: '#eef4fc' }}>14-Day Money-Back Guarantee</strong> — Not satisfied in the first 14 days? Full refund, no questions asked.
        </span>
        <a href="#" style={{ fontSize: '9px', color: '#00c3ff', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(0,195,255,0.3)', paddingBottom: '1px' }}>
          Read refund policy →
        </a>
      </div>

      {/* ── Pricing section ── */}
      <div className="sec" id="pricing" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sec-eyebrow">Access Tiers</div>
        <h2 className="sec-h">Choose Your<br />Intelligence Level.</h2>
        <p className="sec-p">
          All plans include transparent win rate tracking, verified backtest results, and real-time BBP signals.
          14-day money-back guarantee on all plans.
          {rateTs && (
            <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', color: '#2a3d58' }}>
              USD conversion rate updated: {rateTs} · 1 USD = Rp {Math.round(rate).toLocaleString('id-ID')}
            </span>
          )}
        </p>

        {/* 3-card grid */}
        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>

          {/* PRO */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0 }}
            className="pc feat" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-1px', right: '24px' }}>
              <Badge variant="cyan">Most Popular</Badge>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#5a7090', marginBottom: '14px' }}>PRO</div>

            <PriceBlock
              idr={PRICES.PRO_IDR}
              idrOrig={PRICES.PRO_IDR_ORIG}
              rate={rate}
              rateLoading={rateLoading}
              color="#eef4fc"
              subLabel="per bulan · cancel anytime"
            />

            <div style={{ height: '1px', background: '#162035', marginBottom: '20px' }} />
            <FeatureList items={PRO_FEATURES} />
            <Button
              variant="default"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/pro', '_blank')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              🚀 START 14-DAY FREE TRIAL
            </Button>
          </motion.div>

          {/* ELITE */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.1 }}
            style={{
              background: '#0a1020', border: '1px solid rgba(255,215,0,0.3)',
              backgroundImage: 'linear-gradient(160deg,rgba(255,215,0,0.03) 0%,#0a1020 60%)',
              padding: '32px', position: 'relative', overflow: 'hidden',
              transition: 'border-color 0.3s,transform 0.3s',
            }}
            whileHover={{ y: -4 }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#ffd700,#ff8c00)' }} />
            <div style={{ position: 'absolute', top: '-1px', right: '24px' }}>
              <Badge variant="gold">⭐ LIFETIME</Badge>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#ffd700', marginBottom: '14px' }}>ELITE</div>

            <PriceBlock
              idr={PRICES.ELITE_IDR}
              idrOrig={PRICES.ELITE_IDR_ORIG}
              rate={rate}
              rateLoading={rateLoading}
              color="#ffd700"
              subLabel="sekali bayar · lifetime access"
            />

            <div style={{ height: '1px', background: '#162035', marginBottom: '20px' }} />
            <FeatureList items={ELITE_FEATURES} />
            <Button
              variant="gold"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/elite', '_blank')}
              style={{ width: '100%', justifyContent: 'center', background: '#ffd700', color: '#04070f', border: 'none' }}
            >
              💎 GET ELITE LIFETIME →
            </Button>
          </motion.div>

          {/* ENTERPRISE */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.2 }}
            className="pc" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#5a7090', marginBottom: '14px' }}>ENTERPRISE</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '38px', fontWeight: 800, color: '#5a7090', marginBottom: '2px' }}>Custom</div>
            <div style={{ fontSize: '11px', color: '#5a7090', marginBottom: '28px' }}>contact sales for custom pricing</div>
            <div style={{ height: '1px', background: '#162035', marginBottom: '20px' }} />
            <FeatureList items={ENT_FEATURES} />
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('https://t.me/stockindexer_support', '_blank')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              CONTACT SALES →
            </Button>
            <p style={{ fontSize: '10px', color: '#5a7090', marginTop: '10px' }}>
              Or email <a href="mailto:enterprise@stockindexer.com" style={{ color: '#00c3ff', textDecoration: 'none' }}>enterprise@stockindexer.com</a>
            </p>
          </motion.div>
        </div>

        {/* ── USDC Bonus Box ── */}
        <div className="usdc-box" style={{ marginBottom: '28px' }}>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '28px', alignItems: 'center' }}>
            <div style={{ fontSize: '36px', filter: 'drop-shadow(0 0 10px rgba(57,255,20,0.4))' }}>💎</div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: '#eef4fc' }}>
                Pay with <span style={{ color: '#39ff14' }}>USDC</span> — Save 10–12%
              </div>
              <div style={{ fontSize: '11px', color: '#5a7090', lineHeight: 1.8, marginBottom: '14px' }}>
                Save more by paying directly with USDC. Instant processing, no bank transfer fees, 2-minute confirmation.
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {['① Choose plan above', '② Select "USDC" at UTAS checkout', '③ Transfer to wallet address', '④ Auto-confirmed · instant access'].map(s => (
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', padding: '16px 48px', background: '#0e1628', border: '1px solid #162035', marginBottom: '8px' }}>
          <span style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#5a7090', marginRight: '4px' }}>Payment Methods:</span>
          {([
            { l: '⊞ QRIS', extra: { borderColor: 'rgba(189,147,249,0.25)', color: '#bd93f9' } },
            { l: 'DANA' }, { l: 'OVO' }, { l: 'GoPay' },
            { l: 'VA BNI/BRI/Mandiri' }, { l: 'Alfamart / Indomaret' },
            { l: '⬡ USDC', extra: { borderColor: 'rgba(57,255,20,0.25)', color: '#39ff14' } },
          ] as { l: string; extra?: React.CSSProperties }[]).map(p => (
            <span key={p.l} style={{ fontSize: '9px', letterSpacing: '1px', padding: '4px 10px', border: '1px solid #1e2e4a', color: '#5a7090', transition: 'all 0.2s', ...p.extra }}>
              {p.l}
            </span>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '10px', color: '#5a7090', marginTop: '8px', letterSpacing: '0.5px' }}>
          All payments processed via <strong style={{ color: '#eef4fc' }}>UTAS</strong> — encrypted and secure checkout.
        </p>
      </div>

      {/* ── Guarantee bar (bottom) ── */}
      <div className="guarantee-bar" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '16px' }}>🛡️</span>
        <span style={{ fontSize: '11px', color: '#5a7090' }}>
          <strong style={{ color: '#eef4fc' }}>14-Day Money-Back Guarantee</strong> — Not satisfied? Full refund, no questions asked.
        </span>
        <a href="#" style={{ fontSize: '9px', color: '#00c3ff', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(0,195,255,0.3)', paddingBottom: '1px' }}>
          Read policy →
        </a>
      </div>
    </>
  )
}
