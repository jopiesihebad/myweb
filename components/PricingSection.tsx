'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/* ─── Prices in IDR (source of truth) ─── */
const PRICES = {
  STARTER_IDR:       149_000,
  STARTER_IDR_ORIG:  199_000,
  STARTER_ANN:     1_342_000,   // 149K × 12 × 0.75
  PRO_IDR:           349_000,
  PRO_IDR_ORIG:      499_000,
  PRO_ANN:         3_141_000,   // 349K × 12 × 0.75
  ELITE_IDR:       2_799_000,
  ELITE_IDR_ORIG:  3_999_000,
}

const FALLBACK_RATE = 16200

function fmtIDR(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function fmtIDRShort(n: number) {
  const k = n / 1000
  const kStr = k % 1 === 0 ? k.toFixed(0) : k.toLocaleString('id-ID', { maximumFractionDigits: 3 })
  return kStr + 'K'
}
function fmtUSD(idr: number, rate: number) {
  const usd = idr / rate
  return '$' + (usd < 10 ? usd.toFixed(2) : Math.round(usd).toLocaleString('en-US'))
}

/* ─── Features ─── */
const STARTER_FEATURES = [
  { t: 'hi',  text: 'Conway Signal Intelligence — 5 pair monitoring' },
  { t: 'hi',  text: 'State monitoring: BORN / ALIVE / DIED / DORMANT' },
  { t: 'hi',  text: 'Confluence Score real-time (5 pairs)' },
  { t: 'on',  text: 'Daily Signal Feed via dashboard' },
  { t: 'on',  text: 'Session clock: ASIA / LONDON / NY / IDX' },
  { t: 'on',  text: 'World Indices & DXY/VIX macro strip' },
  { t: 'off', text: 'Historical signal data (Pro only)' },
  { t: 'off', text: 'Full 24-asset monitoring (Pro only)' },
]

const PRO_FEATURES = [
  { t: 'hi',  text: 'All Starter features included' },
  { t: 'hi',  text: 'Full 24 assets: crypto, IDX stocks, forex, commodities' },
  { t: 'hi',  text: 'Full dashboard: Signal Deep Dive, Stock Map, Portfolio' },
  { t: 'hi',  text: 'Historical signal data + performance report' },
  { t: 'on',  text: 'Ownership Intelligence: BBCA/BBRI/ANTM/ASII + AI Q&A' },
  { t: 'on',  text: 'Sentiment & News AI Scoring — powered by Claude AI' },
  { t: 'on',  text: 'Daily Risk Meter + Watch List (almost signal alerts)' },
  { t: 'on',  text: 'Signal Tracking Journal + CSV export' },
]

const ELITE_FEATURES = [
  { t: 'gold', text: 'All Pro features — forever, no renewal needed' },
  { t: 'gold', text: '🔮 EXCLUSIVE: SS BlackBox Phantom Private Version (TradingView invite-only)' },
  { t: 'gold', text: 'Lifetime automatic updates — all future versions included' },
  { t: 'gold', text: 'Priority support — response ≤4 hours on business days' },
  { t: 'gold', text: 'Early access to new features before other tiers' },
  { t: 'gold', text: 'Exclusive Elite badge in dashboard' },
  { t: 'on',   text: 'Onboarding session for TradingView indicator setup' },
]

type FeatItem = { t: string; text: string }

function FeatureList({ items }: { items: FeatItem[] }) {
  return (
    <ul className="pc-features" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
      {items.map((f, i) => (
        <li key={i}
          className={f.t === 'gold' ? 'gold-f' : f.t === 'on' ? 'on' : f.t === 'hi' ? 'hi' : ''}
          style={{ color: f.t === 'gold' ? '#ffd700' : f.t === 'hi' ? '#eef4fc' : f.t === 'on' ? '#5a7090' : '#2a3d58', fontSize: f.t === 'gold' ? '12px' : undefined }}>
          {f.text}
        </li>
      ))}
    </ul>
  )
}

function PriceBlock({
  idr, idrOrig, rate, rateLoading, color = '#eef4fc', subLabel, annLabel,
}: {
  idr: number; idrOrig: number; rate: number; rateLoading: boolean
  color?: string; subLabel: string; annLabel?: string
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '12px', color: '#2a3d58', textDecoration: 'line-through', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: '"JetBrains Mono", monospace' }}>
        {fmtIDR(idrOrig)}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '64px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, color, marginBottom: '4px' }}>
        <span style={{ fontSize: '20px', fontWeight: 400, verticalAlign: 'super', letterSpacing: 0 }}>Rp </span>
        {fmtIDRShort(idr)}
      </div>
      <div style={{ fontSize: '11px', color: '#5a7090', marginBottom: '4px' }}>{subLabel}</div>
      {annLabel && (
        <div style={{ fontSize: '10px', color: '#39ff14', marginBottom: '6px', letterSpacing: '0.3px' }}>
          📅 Annual: {annLabel} <span style={{ color: '#2a6040' }}>(save 25%)</span>
        </div>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,195,255,0.05)', border: '1px solid rgba(0,195,255,0.15)', padding: '3px 10px', fontSize: '10px', letterSpacing: '0.5px' }}>
        <span style={{ color: '#5a7090' }}>≈</span>
        <span style={{ color: '#00c3ff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
          {rateLoading ? '…' : fmtUSD(idr, rate)} USD
        </span>
        {!rateLoading && <span style={{ color: '#2a3d58', fontSize: '9px' }}>· live rate</span>}
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

  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=IDR')
        const data = await res.json() as { rates: { IDR: number }; date: string }
        if (!cancelled && data?.rates?.IDR) {
          setRate(data.rates.IDR)
          setRateTs(data.date)
        }
      } catch { /* keep fallback */ }
      finally { if (!cancelled) setLoading(false) }
    }
    fetchRate()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      {/* ── Disclaimer bar (top) ── */}
      <div className="guarantee-bar" style={{ position: 'relative', zIndex: 1 }}>
        <span style={{ fontSize: '16px' }}>⚠️</span>
        <span style={{ fontSize: '11px', color: '#5a7090', letterSpacing: '0.3px' }}>
          <strong style={{ color: '#eef4fc' }}>Intelligence Tools Platform — Not a Trading Robot.</strong>{' '}
          All signals are informational. Execution is 100% manual by user. No profit guarantees.
        </span>
        <a href="#faq" style={{ fontSize: '9px', color: '#00c3ff', letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(0,195,255,0.3)', paddingBottom: '1px' }}>
          Baca FAQ →
        </a>
      </div>

      {/* ── Pricing section ── */}
      <div className="sec" id="pricing" style={{ position: 'relative', zIndex: 1 }}>
        <div className="sec-eyebrow">Choose Your Intelligence Level</div>
        <h2 className="sec-h">Access Signals.<br />You Decide.</h2>
        <p className="sec-p">
          Pure subscription — no performance fees, no managed accounts, no profit sharing.
          All trade execution is done independently by users on OJK-licensed exchanges.
          {rateTs && (
            <span style={{ display: 'block', marginTop: '6px', fontSize: '10px', color: '#2a3d58' }}>
              USD rate updated: {rateTs} · 1 USD = Rp {Math.round(rate).toLocaleString('id-ID')}
            </span>
          )}
        </p>

        {/* 3-card grid */}
        <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>

          {/* STARTER */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0 }}
            className="pc feat" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#5a7090', marginBottom: '14px' }}>STARTER</div>

            <PriceBlock
              idr={PRICES.STARTER_IDR}
              idrOrig={PRICES.STARTER_IDR_ORIG}
              rate={rate}
              rateLoading={rateLoading}
              color="#eef4fc"
              subLabel="per month · cancel anytime"
              annLabel={fmtIDR(PRICES.STARTER_ANN) + '/thn'}
            />

            <div style={{ height: '1px', background: '#162035', marginBottom: '20px' }} />
            <FeatureList items={STARTER_FEATURES} />
            <Button
              variant="default"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/starter', '_blank')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              ⚡ START STARTER
            </Button>
          </motion.div>

          {/* PRO */}
          <motion.div {...cardAnim} transition={{ ...cardAnim.transition, delay: 0.05 }}
            className="pc feat" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-1px', right: '24px' }}>
              <Badge variant="cyan">Paling Populer</Badge>
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: '#5a7090', marginBottom: '14px' }}>PRO</div>

            <PriceBlock
              idr={PRICES.PRO_IDR}
              idrOrig={PRICES.PRO_IDR_ORIG}
              rate={rate}
              rateLoading={rateLoading}
              color="#00c3ff"
              subLabel="per month · cancel anytime"
              annLabel={fmtIDR(PRICES.PRO_ANN) + '/thn'}
            />

            <div style={{ height: '1px', background: '#162035', marginBottom: '20px' }} />
            <FeatureList items={PRO_FEATURES} />
            <Button
              variant="default"
              size="lg"
              onClick={() => window.open('https://utas.stockindexer.com/checkout/pro', '_blank')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              🚀 START PRO
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
              subLabel="one-time payment · lifetime access"
            />

            {/* Elite exclusive callout */}
            <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', padding: '10px 12px', marginBottom: '16px', fontSize: '10px', color: '#ffd700', lineHeight: 1.7 }}>
              🔮 <strong>Invite-Only:</strong> SS BlackBox Phantom Private Version on TradingView — exclusively for Elite members. Not sold separately.
            </div>

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
                Instant processing, no bank transfer fees, 2-minute confirmation.
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {['① Select a plan above', '② Choose "USDC" at UTAS checkout', '③ Transfer to wallet address', '④ Access activated instantly'].map(s => (
                  <div key={s} style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.18)', padding: '5px 12px', fontSize: '10px', color: '#39ff14', letterSpacing: '0.5px' }}>{s}</div>
                ))}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', padding: '4px 12px', fontSize: '10px', color: '#39ff14', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                ⚡ USDC DISCOUNT: STARTER 10% · PRO 10% · ELITE 12%
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
          All payments processed via <strong style={{ color: '#eef4fc' }}>UTAS</strong> — secure and encrypted checkout.
        </p>

        {/* ── Disclaimer box ── */}
        <div style={{ marginTop: '20px', padding: '14px 18px', background: 'rgba(255,0,98,0.04)', border: '1px solid rgba(255,0,98,0.15)', fontSize: '10px', color: '#5a7090', lineHeight: 1.8, letterSpacing: '0.3px' }}>
          <strong style={{ color: '#ff6080' }}>DISCLAIMER:</strong> Subscription provides access to intelligence tools and signal feed —
          not a guarantee of profit or specific trading results. No performance fees.
          All trading decisions and execution are the sole responsibility of the subscriber on
          OJK/BAPPEBTI-licensed exchanges. Trading involves risk of loss. Promo prices are time-limited.
          Annual plans are billed in full at the start of the period.
        </div>
      </div>
    </>
  )
}
