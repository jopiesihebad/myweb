'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  /indicator — SS BlackBox Phantom Standalone License Page
//  Layer 2 monetization: sell indicator access separately
//  from stockindexer signal subscription
// ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    key:     'explorer',
    name:    'EXPLORER',
    price:   29,
    period:  '/month',
    annual:  249,
    color:   '#00c3ff',
    popular: false,
    features: [
      'SS BlackBox Phantom on TradingView',
      'Conway Automaton state engine (8 cells)',
      'BBP crossover entry signals',
      'All 25 alert types — copy-paste ready',
      'Session filter (Asia / London / NY)',
      'Auto-update all future versions',
      'Basic setup guide (PDF)',
    ],
    cta: 'Start Explorer',
    href: '/checkout/indicator-explorer',
  },
  {
    key:     'operator',
    name:    'OPERATOR',
    price:   59,
    period:  '/month',
    annual:  499,
    color:   '#ffd700',
    popular: true,
    features: [
      'Everything in Explorer',
      'Webhook JSON templates (29 signal types)',
      'Compatible with OKX, Binance, 3Commas',
      'Parameter tuning guide per asset class',
      'Priority update access',
      'Discord community #indicator-users',
      'Video walkthrough (1H setup to live)',
    ],
    cta: 'Start Operator',
    href: '/checkout/indicator-operator',
  },
  {
    key:     'architect',
    name:    'ARCHITECT',
    price:   149,
    period:  'one-time',
    annual:  null,
    color:   '#39ff14',
    popular: false,
    features: [
      'Everything in Operator (lifetime)',
      '1-hour technical consultation via Telegram',
      'Custom parameter recommendation',
      'Priority Telegram support',
      'Early access: all future modules',
      'Founding Member on-chain badge',
    ],
    cta: 'Get Architect',
    href: '/checkout/indicator-architect',
  },
]

const FAQS = [
  {
    q: 'What is the difference between SS BlackBox and stockindexer PRO?',
    a: 'Stockindexer PRO means you receive ready-made signals — no setup required. SS BlackBox license means you get the indicator itself on your TradingView account to run on your own charts and setups. Different audiences, different use cases.',
  },
  {
    q: 'Do I need a paid TradingView plan?',
    a: 'Yes — you need at least TradingView Pro to use custom webhook alerts. The indicator itself works on any plan, but to fire alerts to your bot or phone, Pro ($14.95/mo) is the minimum.',
  },
  {
    q: 'What assets can I use it on?',
    a: 'Any asset available on TradingView — crypto, forex, stocks, indices, commodities. The indicator is asset-agnostic. Default parameters are tuned for 1H crypto and IDX stocks.',
  },
  {
    q: 'Can I automate trading with this indicator?',
    a: 'Yes — the Operator tier includes webhook JSON templates compatible with OKX, Binance, 3Commas, and Alertatron. You wire TradingView alert → webhook → your bot. Full setup guide included.',
  },
  {
    q: 'Is this the same indicator powering stockindexer signals?',
    a: 'Yes — SS BlackBox Phantom v6.4 is the exact indicator we use to monitor 24 assets across 3 TradingView tabs and generate all signals on stockindexer.com.',
  },
]

export default function IndicatorPage() {
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main style={{
      background: '#04070f',
      color: '#c8d8e8',
      fontFamily: '"JetBrains Mono", monospace',
      minHeight: '100vh',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1px solid #162035',
        background: '#04070fee', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href="/" style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#00c3ff', textDecoration: 'none', letterSpacing: -0.5 }}>
          STOCK<span style={{ color: '#39ff14' }}>INDEXER</span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: 11, color: '#4a6080', textDecoration: 'none', letterSpacing: 1 }}>DASHBOARD</a>
          <a href="/#pricing" style={{ fontSize: 11, color: '#4a6080', textDecoration: 'none', letterSpacing: 1 }}>SIGNALS</a>
          <a href="/indicator" style={{ fontSize: 11, color: '#00c3ff', textDecoration: 'none', letterSpacing: 1 }}>INDICATOR</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 0 60px' }}>
          <div style={{
            display: 'inline-block', fontSize: 10, letterSpacing: 3,
            color: '#ffd700', border: '1px solid #ffd70030',
            background: '#ffd70010', padding: '4px 14px', borderRadius: 20, marginBottom: 24,
          }}>
            SS BLACKBOX PHANTOM v6.4 — STANDALONE LICENSE
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
            The indicator<br />
            <span style={{ color: '#00c3ff' }}>behind the signals</span>
          </h1>
          <p style={{ fontSize: 13, color: '#8aa0b8', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 32px', fontFamily: '"JetBrains Mono", monospace' }}>
            SS BlackBox Phantom is the exact indicator we use to monitor 24 assets across crypto,
            forex, IDX, and US stocks — generating all signals on stockindexer.com.
            Now available as a standalone TradingView license.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 48, flexWrap: 'wrap' }}>
            {[
              { label: '8-CELL CONWAY ENGINE', value: '8/8' },
              { label: 'SIGNAL TYPES',          value: '29'  },
              { label: 'ASSET CLASSES',         value: '5'   },
              { label: 'ALERT PRECISION',       value: 'Tier S→C' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#00c3ff', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a6080', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Chart preview placeholder */}
          <div style={{
            background: '#0a1020', border: '1px solid #162035',
            borderRadius: 12, padding: '20px', marginBottom: 16,
            maxWidth: 800, margin: '0 auto 48px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 12 }}>
              BTCUSDT 1H — CONWAY AUTOMATON + BBP SIGNALS
            </div>
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a3d58', fontSize: 11 }}>
              [ TradingView chart embed — add your chart screenshot here ]
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'CONWAY BORN', color: '#39ff14' },
                { label: 'CONWAY BUY',  color: '#00c3ff' },
                { label: 'GOLD BUY',    color: '#ffd700' },
                { label: 'BBP ENTRY',   color: '#bd93f9' },
                { label: 'LH EXIT',     color: '#ff8c00' },
              ].map(b => (
                <span key={b.label} style={{
                  fontSize: 9, padding: '2px 8px', letterSpacing: 1,
                  color: b.color, border: `1px solid ${b.color}40`,
                  background: `${b.color}10`,
                }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 11, color: billingAnnual ? '#4a6080' : '#c8d8e8' }}>Monthly</span>
          <button
            onClick={() => setBillingAnnual(b => !b)}
            style={{
              width: 48, height: 26, borderRadius: 13,
              background: billingAnnual ? '#39ff1440' : '#162035',
              border: `1px solid ${billingAnnual ? '#39ff14' : '#2a3d58'}`,
              cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: billingAnnual ? 24 : 4,
              width: 18, height: 18, borderRadius: '50%',
              background: billingAnnual ? '#39ff14' : '#4a6080',
              transition: 'all 0.2s',
            }} />
          </button>
          <span style={{ fontSize: 11, color: billingAnnual ? '#c8d8e8' : '#4a6080' }}>
            Annual <span style={{ color: '#39ff14', fontSize: 9 }}>SAVE ~30%</span>
          </span>
        </div>

        {/* Pricing cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 80 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              background: plan.popular ? '#0d1830' : '#0a1020',
              border: `1px solid ${plan.popular ? plan.color : '#162035'}`,
              borderRadius: 12, padding: '28px 24px',
              position: 'relative',
              boxShadow: plan.popular ? `0 0 40px ${plan.color}20` : 'none',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#04070f',
                  fontSize: 9, fontWeight: 700, letterSpacing: 2,
                  padding: '3px 14px', borderRadius: 20,
                }}>
                  MOST POPULAR
                </div>
              )}

              {/* Plan name */}
              <div style={{ fontSize: 10, letterSpacing: 3, color: plan.color, marginBottom: 8 }}>
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 42, fontWeight: 800, color: '#eef4fc', lineHeight: 1 }}>
                  ${billingAnnual && plan.annual ? Math.round(plan.annual / 12) : plan.price}
                </span>
                <span style={{ fontSize: 11, color: '#4a6080', marginLeft: 4 }}>
                  {plan.period === 'one-time' ? 'one-time' : '/month'}
                </span>
                {billingAnnual && plan.annual && (
                  <div style={{ fontSize: 10, color: '#39ff14', marginTop: 4 }}>
                    ${plan.annual}/year billed annually
                  </div>
                )}
              </div>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 11, color: '#8aa0b8', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a href={plan.href} style={{
                display: 'block', textAlign: 'center', padding: '10px 0',
                background: plan.popular ? plan.color : 'transparent',
                border: `1px solid ${plan.color}`,
                borderRadius: 6, color: plan.popular ? '#04070f' : plan.color,
                fontSize: 11, fontWeight: 700, letterSpacing: 1,
                textDecoration: 'none', transition: 'all 0.2s',
                fontFamily: 'Space Mono,monospace',
              }}>
                {plan.cta} →
              </a>
            </div>
          ))}
        </section>

        {/* Comparison: Indicator vs Signal Subscription */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 32, color: '#eef4fc' }}>
            Indicator vs Signal Subscription
          </h2>
          <div style={{ background: '#0a1020', border: '1px solid #162035', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid #162035' }}>
              {['', 'SS BlackBox License', 'Stockindexer PRO'].map((h, i) => (
                <div key={i} style={{ padding: '14px 20px', fontSize: 10, letterSpacing: 2, color: i === 0 ? '#4a6080' : '#c8d8e8', fontWeight: 700, background: i > 0 ? '#0d1830' : 'transparent' }}>
                  {h}
                </div>
              ))}
            </div>
            {[
              ['You set up on TradingView yourself',   '✓', '✗'],
              ['Ready-made signals, no setup needed',  '✗', '✓'],
              ['Full indicator customization',         '✓', '✗'],
              ['Telegram signal notifications',        '✗', '✓'],
              ['Use on any asset on TradingView',      '✓', '✗'],
              ['24 curated assets monitored for you',  '✗', '✓'],
              ['Webhook automation templates',         '✓ (Operator)', '✗'],
              ['VIP Telegram community',               '✓ (Operator)', '✓'],
            ].map(([feature, left, right], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', borderBottom: '1px solid #0d1830' }}>
                <div style={{ padding: '12px 20px', fontSize: 11, color: '#8aa0b8' }}>{feature}</div>
                <div style={{ padding: '12px 20px', fontSize: 11, color: left.startsWith('✓') ? '#39ff14' : '#2a3d58', textAlign: 'center' }}>{left}</div>
                <div style={{ padding: '12px 20px', fontSize: 11, color: right.startsWith('✓') ? '#39ff14' : '#2a3d58', textAlign: 'center' }}>{right}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 32, color: '#eef4fc' }}>
            FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 700, margin: '0 auto' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: '#0a1020', border: `1px solid ${openFaq === i ? '#00c3ff40' : '#162035'}`, borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 18px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#c8d8e8', fontFamily: '"JetBrains Mono", monospace' }}>{faq.q}</span>
                  <span style={{ color: '#00c3ff', flexShrink: 0, fontSize: 14 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 18px 14px', fontSize: 11, color: '#8aa0b8', lineHeight: 1.8, borderTop: '1px solid #162035', paddingTop: 12 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section style={{
          background: 'linear-gradient(135deg, #0a1020 0%, #0d1830 100%)',
          border: '1px solid #00c3ff30',
          borderRadius: 16, padding: '48px 40px',
          textAlign: 'center', marginBottom: 80,
          boxShadow: '0 0 60px #00c3ff10',
        }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: '#eef4fc', marginBottom: 12 }}>
            Want signals instead?
          </div>
          <p style={{ fontSize: 12, color: '#8aa0b8', marginBottom: 28, lineHeight: 1.8 }}>
            Skip the setup. Let pieBot handle everything — receive ready-made signals<br />
            directly on Telegram with entry, SL, and TP pre-calculated.
          </p>
          <a href="/#pricing" style={{
            display: 'inline-block', padding: '12px 32px',
            background: '#00c3ff20', border: '1px solid #00c3ff',
            color: '#00c3ff', borderRadius: 8, fontSize: 12,
            fontWeight: 700, textDecoration: 'none', letterSpacing: 1,
            fontFamily: 'Space Mono,monospace',
          }}>
            See Signal Plans →
          </a>
        </section>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #162035', padding: '24px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: '#2a3d58', letterSpacing: 1 }}>
          © StockIndexer.com · SS BlackBox Phantom is proprietary. Not for redistribution.
        </p>
      </footer>
    </main>
  )
}
