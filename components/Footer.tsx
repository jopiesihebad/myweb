'use client'

export default function Footer() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)' }}>
      {/* Disclaimer */}
      <div style={{ background: 'rgba(255,140,0,0.03)', borderTop: '1px solid rgba(255,140,0,0.12)', borderBottom: '1px solid rgba(255,140,0,0.12)', padding: '10px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,140,0,0.6)', letterSpacing: '0.5px', lineHeight: 1.6 }}>
          ⚠ Past signal performance is not a guarantee of future results. Trading involves significant risk — only use capital you can afford to lose. All signals are educational and informational, not financial advice. Not a trading robot. No auto-execution.
        </p>
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', padding: '14px 48px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--panel2)' }}>
        {[
          { icon: '⚙️', text: 'Powered by UTAS Checkout' },
          { icon: '🔱', text: 'SS BlackBox v6.4 Phantom' },
          { icon: '🏦', text: 'Ownership Intelligence IDX' },
          { icon: '🛡️', text: 'Garansi 14 Hari' },
          { icon: '⚡', text: 'pieBot Signal Advisor' },
        ].map((b, i, arr) => (
          <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '9px', color: 'var(--gray)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <span>{b.icon}</span> {b.text}
            </div>
            {i < arr.length - 1 && <span style={{ color: 'var(--border2)', fontSize: '12px', marginLeft: '10px' }}>|</span>}
          </div>
        ))}
      </div>

      {/* Main footer grid */}
      <div className="footer-inner" style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px', display: 'grid', gridTemplateColumns: '280px 1fr auto', gap: '48px' }}>
        {/* Brand */}
        <div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '20px', marginBottom: '8px', display: 'block', color: 'var(--white)' }}>
            Stock<em style={{ color: 'var(--cyan)', fontStyle: 'normal' }}>Indexer</em>
          </span>
          <p style={{ fontSize: '11px', color: 'var(--gray)', lineHeight: 1.7, maxWidth: '220px', marginTop: '8px' }}>
            The Conway Signal Intelligence Platform for independent traders. Transparent. Data-driven. Your execution.
          </p>
          {/* Affiliate teaser */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(189,147,249,0.03)', border: '1px solid rgba(189,147,249,0.1)', marginTop: '16px' }}>
            <span style={{ fontSize: '14px' }}>💸</span>
            <span style={{ fontSize: '10px', color: 'var(--gray)', letterSpacing: '0.3px' }}>
              Mau dapat komisi tiap sale?{' '}
              <a href="https://utas.stockindexer.com/affiliate" target="_blank" rel="noreferrer"
                style={{ color: '#bd93f9', textDecoration: 'none', borderBottom: '1px solid rgba(189,147,249,0.25)', transition: 'all 0.2s' }}>
                Daftar Affiliate StockIndexer
              </a>
            </span>
            <span style={{ fontSize: '9px', color: '#bd93f9', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginLeft: 'auto', whiteSpace: 'nowrap' }}>35% COMMISSION</span>
          </div>
        </div>

        {/* Links */}
        <div className="f-links" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {[
            { title: 'Platform', links: [
              { label: 'Live Dashboard',    href: '/dashboard'     },
              { label: 'Signal Feed',       href: '/#live'         },
              { label: 'Indicator License', href: '/indicator'     },
              { label: 'Signal Status',     href: '/#signal-status' },
            ]},
            { title: 'Resources', links: [
              { label: 'API Reference',    href: '/api/webhook'    },
              { label: 'Webhook Setup',    href: '/indicator'      },
              { label: 'Pricing',          href: '/#pricing'       },
              { label: 'FAQ',              href: '/#faq'           },
            ]},
            { title: 'Company', links: [
              { label: 'About',            href: '/#conway'        },
              { label: 'Affiliate',        href: 'https://utas.stockindexer.com/affiliate' },
              { label: 'HargaTerbaik',     href: 'https://hargaterbaik.com' },
              { label: 'Contact',          href: 'mailto:enterprise@stockindexer.com' },
            ]},
          ].map(col => (
            <div key={col.title} className="f-col">
              <div style={{ fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gray2)', marginBottom: '14px' }}>{col.title}</div>
              {col.links.map(l => (
                <a key={l.label} href={l.href}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
                  style={{ display: 'block', fontSize: '11px', color: 'var(--gray)', textDecoration: 'none', marginBottom: '8px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
                >{l.label}</a>
              ))}
            </div>
          ))}
        </div>

        {/* Right: social + copy */}
        <div className="f-right" style={{ textAlign: 'right' }}>
          <div className="f-social" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '16px' }}>
            {[
              { icon: '𝕏',  href: 'https://x.com/stockindexer'               },
              { icon: 'TG', href: 'https://t.me/stockindexer_signals'         },
              { icon: 'DC', href: 'https://discord.gg/stockindexer'           },
            ].map(s => (
              <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                style={{ width: '32px', height: '32px', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='var(--cyan)'; (e.currentTarget as HTMLAnchorElement).style.color='var(--cyan)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLAnchorElement).style.color='var(--gray)' }}
              >{s.icon}</a>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--gray2)', lineHeight: 1.7 }}>
            Powered by SS BlackBox v6.4<br />
            Conway Automaton Engine<br />
            Ownership Intelligence IDX<br />
            © 2026 StockIndexer.com
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="f-bottom" style={{ borderTop: '1px solid var(--border)', padding: '16px 48px', maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '10px', color: 'var(--gray2)' }}>Not financial advice. For educational and research purposes only. Past performance ≠ future results.</p>
        <p style={{ fontSize: '10px', color: 'var(--gray2)' }}>Privacy Policy · Terms · Risk Disclosure · Refund Policy</p>
      </div>
    </footer>
  )
}
