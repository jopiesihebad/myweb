'use client'

import { useState } from 'react'

type FaqItem = { q: string; a: string }

export default function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            background: 'var(--panel)',
            border: `1px solid ${open === i ? 'var(--border2)' : 'var(--border)'}`,
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 22px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '16px',
              fontFamily: 'JetBrains Mono,monospace',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--white)', lineHeight: 1.5 }}>{item.q}</span>
            <span style={{ color: open === i ? 'var(--cyan)' : 'var(--gray)', flexShrink: 0, fontSize: '16px', transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 22px 18px', fontSize: '12px', color: 'var(--gray)', lineHeight: 1.8, borderTop: '1px solid var(--border)' }}>
              <p style={{ marginTop: '14px' }}>{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
