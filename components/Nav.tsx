'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#live',        label: 'Live'       },
  { href: '#performance', label: 'Performance'},
  { href: '#pricing',     label: 'Pricing'    },
  { href: '/indicator',   label: 'Indicator'  },
  { href: '/dashboard',   label: 'Dashboard'  },
]

const CELL_PATTERNS = [
  [1,0,0,1],[0,1,1,0],[1,1,0,0],[0,0,1,1],
  [1,0,1,0],[0,1,0,1],[1,1,1,0],[0,1,1,1],
]

export default function Nav() {
  const [pattern, setPattern] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPattern(p => (p + 1) % CELL_PATTERNS.length), 900)
    return () => clearInterval(id)
  }, [])

  const cells = CELL_PATTERNS[pattern]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '60px',
      background: 'rgba(4,7,15,0.9)', backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
          gap: '3px', padding: '5px', width: '30px', height: '30px',
          border: '1px solid rgba(0,195,255,0.4)',
        }}>
          {cells.map((on, i) => (
            <div key={i} style={{
              background: 'var(--cyan)',
              opacity: on ? 1 : 0.12,
              transition: 'opacity 0.4s',
            }} />
          ))}
        </div>
        <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', color: 'var(--white)' }}>
          Stock<em style={{ color: 'var(--cyan)', fontStyle: 'normal' }}>Indexer</em>
        </span>
      </Link>

      {/* Center nav */}
      <ul className="nav-center" style={{ display: 'flex', gap: '28px', listStyle: 'none' }}>
        {NAV_LINKS.map(l => (
          <li key={l.href}>
            <Link href={l.href} style={{
              fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase',
              color: 'var(--gray)', textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray)')}
            >{l.label}</Link>
          </li>
        ))}
      </ul>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="nav-badge" style={{
          fontSize: '9px', letterSpacing: '2px', padding: '4px 10px',
          border: '1px solid rgba(57,255,20,0.35)', color: 'var(--lime)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div className="ldot" /> 6 assets live
        </div>
        <a href="/dashboard" style={{
          fontSize: '10px', letterSpacing: '1.5px', padding: '6px 14px',
          border: '1px solid rgba(0,195,255,0.3)', color: 'var(--cyan)',
          textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,195,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Member Login
        </a>
        <a
          href="https://utas.stockindexer.com/checkout/pro"
          target="_blank" rel="noreferrer"
          className="nav-btn"
        >
          Start Free Trial
        </a>
      </div>
    </nav>
  )
}
