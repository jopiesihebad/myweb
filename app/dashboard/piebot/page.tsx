'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────
//  /dashboard/piebot/login — Creator-only login
//  Completely separate from member Supabase auth
//  Submits to /api/creator/auth → sets httpOnly cookie
//  On success → redirect to /dashboard/piebot
// ─────────────────────────────────────────────────────────────

export default function CreatorLogin() {
  const [pw,       setPw]       = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pw || loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/creator/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pw }),
      })

      if (res.ok) {
        router.push('/dashboard/piebot')
        router.refresh()
      } else {
        const data = await res.json()
        setAttempts(a => a + 1)
        setError(data.error ?? 'Authentication failed')
        setPw('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Connection error — try again')
    } finally {
      setLoading(false)
    }
  }

  const BG     = '#04070f'
  const PANEL  = '#080d1a'
  const BORDER = '#162035'
  const CYAN   = '#00c3ff'
  const RED    = '#ff0062'
  const GRAY   = '#4a6080'
  const WHITE  = '#eef4fc'
  const MUTED  = '#c8d8e8'

  return (
    <div style={{
      background: BG,
      minHeight:  '100vh',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'JetBrains Mono,monospace',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${BORDER}40 1px,transparent 1px),linear-gradient(90deg,${BORDER}40 1px,transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 380, padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: WHITE, letterSpacing: -1 }}>
              pieBot
            </span>
            <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: CYAN, border: `1px solid ${CYAN}40`, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>
              PRIVATE
            </span>
          </div>
          <p style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: GRAY, letterSpacing: 1 }}>
            CREATOR ACCESS ONLY
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background:   PANEL,
          border:       `1px solid ${BORDER}`,
          borderRadius: 12,
          padding:      '28px 28px',
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${CYAN},#bd93f9)` }} />

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: 'Space Mono,monospace', fontSize: 9, color: GRAY, letterSpacing: 1.5, display: 'block', marginBottom: 8 }}>
                CREATOR PASSWORD
              </label>
              <input
                ref={inputRef}
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="Enter creator password"
                disabled={loading}
                style={{
                  width:        '100%',
                  padding:      '11px 14px',
                  background:   BG,
                  border:       `1px solid ${error ? RED + '80' : BORDER}`,
                  borderRadius: 6,
                  outline:      'none',
                  fontFamily:   'JetBrains Mono,monospace',
                  fontSize:     13,
                  color:        WHITE,
                  letterSpacing: 1,
                  boxSizing:    'border-box' as const,
                  transition:   'border-color 0.2s',
                  opacity:      loading ? 0.6 : 1,
                }}
                onFocus={e => { e.target.style.borderColor = CYAN + '60' }}
                onBlur={e  => { e.target.style.borderColor = error ? RED + '80' : BORDER }}
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                fontFamily:  'Space Mono,monospace',
                fontSize:    9,
                color:       RED,
                marginBottom: 16,
                padding:     '8px 12px',
                background:  RED + '10',
                border:      `1px solid ${RED}30`,
                borderRadius: 5,
                display:     'flex',
                alignItems:  'center',
                gap:         6,
              }}>
                <span>⚠</span>
                <span>{error}</span>
                {attempts >= 3 && <span style={{ color: GRAY }}>· attempt {attempts}</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !pw}
              style={{
                width:        '100%',
                padding:      '11px',
                background:   loading || !pw ? BORDER : `${CYAN}15`,
                border:       `1px solid ${loading || !pw ? BORDER : CYAN + '60'}`,
                borderRadius: 6,
                color:        loading || !pw ? GRAY : CYAN,
                fontFamily:   'Space Mono,monospace',
                fontSize:     11,
                letterSpacing: 2,
                fontWeight:   700,
                cursor:       loading || !pw ? 'not-allowed' : 'pointer',
                transition:   'all 0.2s',
              }}
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD →'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: '#1e2f4a', letterSpacing: 1 }}>
            Session expires after 12 hours · httpOnly cookie
          </p>
          <a href="/dashboard" style={{ fontFamily: 'Space Mono,monospace', fontSize: 8, color: GRAY, letterSpacing: 1, textDecoration: 'none', marginTop: 8, display: 'block' }}>
            ← Back to member dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
