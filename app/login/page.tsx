'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient, getUserTier } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
//  /login — StockIndexer member login
//  • Email + password
//  • Google OAuth
//  • Remember me
//  • Forgot password (sends reset email)
//  • Upgrade prompt for FREE users
// ─────────────────────────────────────────────────────────────

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  const upgradeMode  = searchParams.get('upgrade') === 'true'
  const redirectTo   = searchParams.get('redirect') || '/dashboard'
  const errorParam   = searchParams.get('error')

  type Mode = 'login' | 'forgot'
  const [mode,       setMode]       = useState<Mode>('login')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [remember,   setRemember]   = useState(true)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(errorParam ?? '')
  const [message,    setMessage]    = useState('')
  const [showPass,   setShowPass]   = useState(false)

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const tier = getUserTier(user)
      if (tier === 'PRO' || tier === 'ELITE') {
        router.replace('/dashboard')
      }
    })
  }, [])

  // Email + password login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email atau password salah. Coba lagi.'
        : err.message
      )
      setLoading(false)
      return
    }

    const tier = getUserTier(data.user)

    if (tier === 'FREE') {
      await supabase.auth.signOut()
      setError('Akun kamu belum berlangganan. Pilih plan PRO atau ELITE untuk akses dashboard.')
      setLoading(false)
      return
    }

    router.replace(redirectTo)
  }

  // Google OAuth
  async function handleGoogle() {
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    }
    // If success, browser redirects to Google — no need to setLoading(false)
  }

  // Forgot password
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })

    if (err) {
      setError(err.message)
    } else {
      setMessage(`Reset link dikirim ke ${email}. Cek inbox (dan folder spam).`)
    }
    setLoading(false)
  }

  return (
    <div style={{
      background:  '#04070f',
      minHeight:   '100vh',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
      fontFamily:  '"JetBrains Mono", monospace',
      padding:     '24px',
      position:    'relative',
      overflow:    'hidden',
    }}>

      {/* Background orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', width:600, height:600, top:'-200px', left:'-200px', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,195,255,0.06),transparent 70%)', filter:'blur(60px)' }} />
        <div style={{ position:'absolute', width:400, height:400, bottom:'-100px', right:'-100px', borderRadius:'50%', background:'radial-gradient(circle,rgba(57,255,20,0.04),transparent 70%)', filter:'blur(60px)' }} />
      </div>

      {/* Scanlines */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,195,255,0.008) 3px,rgba(0,195,255,0.008) 4px)',
      }} />

      {/* Card */}
      <div style={{
        position:     'relative',
        zIndex:       1,
        width:        '100%',
        maxWidth:     420,
        background:   '#0a1020',
        border:       '1px solid #162035',
        borderRadius: 16,
        padding:      '36px 32px',
        boxShadow:    '0 0 60px rgba(0,195,255,0.08)',
      }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <a href="/" style={{ textDecoration:'none' }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#eef4fc', letterSpacing:-0.5 }}>
              Stock<span style={{ color:'#00c3ff' }}>Indexer</span>
            </div>
          </a>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:2, marginTop:4 }}>
            SS BLACKBOX v6.4 · MEMBER AREA
          </div>
        </div>

        {/* Upgrade banner */}
        {upgradeMode && (
          <div style={{
            background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:20,
          }}>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#ffd700', fontWeight:700, letterSpacing:1, marginBottom:4 }}>
              ⚡ UPGRADE REQUIRED
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#8aa0b8', lineHeight:1.6 }}>
              Dashboard membutuhkan plan PRO atau ELITE.
            </div>
            <a href="/#pricing" style={{
              display:'inline-block', marginTop:8,
              fontFamily:'Space Mono,monospace', fontSize:9,
              color:'#ffd700', letterSpacing:1,
              borderBottom:'1px solid rgba(255,215,0,0.4)',
              textDecoration:'none',
            }}>
              Lihat paket harga →
            </a>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background:'rgba(255,0,98,0.08)', border:'1px solid rgba(255,0,98,0.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:16,
            fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#ff0062', lineHeight:1.6,
          }}>
            {error}
          </div>
        )}

        {/* Success message */}
        {message && (
          <div style={{
            background:'rgba(57,255,20,0.08)', border:'1px solid rgba(57,255,20,0.3)',
            borderRadius:8, padding:'10px 14px', marginBottom:16,
            fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#39ff14', lineHeight:1.6,
          }}>
            {message}
          </div>
        )}

        {/* ── LOGIN MODE ── */}
        {mode === 'login' && (
          <>
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width:'100%', padding:'11px 0',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                background:'#0d1628', border:'1px solid #2a3d58',
                borderRadius:8, cursor:'pointer',
                fontFamily:'JetBrains Mono,monospace', fontSize:13, color:'#c8d8e8',
                transition:'all 0.2s', marginBottom:16,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00c3ff60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a3d58'}
            >
              {/* Google icon */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Lanjutkan dengan Google
            </button>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:'#162035' }} />
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#2a3d58', letterSpacing:1 }}>
                ATAU
              </span>
              <div style={{ flex:1, height:1, background:'#162035' }} />
            </div>

            {/* Email + Password form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1, display:'block', marginBottom:6 }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="kamu@email.com"
                  style={{
                    width:'100%', padding:'10px 12px',
                    background:'#04070f', border:'1px solid #162035',
                    borderRadius:8, outline:'none',
                    fontFamily:'JetBrains Mono,monospace', fontSize:13, color:'#eef4fc',
                    transition:'border-color 0.2s',
                    boxSizing:'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c3ff60'}
                  onBlur={e  => e.currentTarget.style.borderColor = '#162035'}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1, display:'block', marginBottom:6 }}>
                  PASSWORD
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width:'100%', padding:'10px 40px 10px 12px',
                      background:'#04070f', border:'1px solid #162035',
                      borderRadius:8, outline:'none',
                      fontFamily:'JetBrains Mono,monospace', fontSize:13, color:'#eef4fc',
                      transition:'border-color 0.2s',
                      boxSizing:'border-box',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#00c3ff60'}
                    onBlur={e  => e.currentTarget.style.borderColor = '#162035'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    color:'#4a6080', fontSize:12, padding:0,
                  }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <div
                    onClick={() => setRemember(v => !v)}
                    style={{
                      width:16, height:16, borderRadius:3,
                      border:`1px solid ${remember ? '#00c3ff' : '#2a3d58'}`,
                      background: remember ? '#00c3ff20' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                  >
                    {remember && <span style={{ color:'#00c3ff', fontSize:10 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
                    Ingat saya
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
                  style={{
                    background:'none', border:'none', cursor:'pointer',
                    fontFamily:'Space Mono,monospace', fontSize:9,
                    color:'#4a6080', letterSpacing:0.5,
                    textDecoration:'underline',
                  }}
                >
                  Lupa password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width:'100%', padding:'12px 0',
                  background: loading ? '#162035' : 'linear-gradient(135deg,#00c3ff20,#00c3ff10)',
                  border:`1px solid ${loading ? '#162035' : '#00c3ff'}`,
                  borderRadius:8, cursor: loading ? 'wait' : 'pointer',
                  fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700,
                  color: loading ? '#4a6080' : '#00c3ff',
                  letterSpacing:0.5, transition:'all 0.2s',
                }}
              >
                {loading ? 'Memproses...' : 'Masuk ke Dashboard →'}
              </button>
            </form>

            {/* CTA ke pricing */}
            <div style={{ textAlign:'center', marginTop:20 }}>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
                Belum punya akun?{' '}
              </span>
              <a href="/#pricing" style={{
                fontFamily:'Space Mono,monospace', fontSize:9,
                color:'#00c3ff', textDecoration:'none',
                borderBottom:'1px solid rgba(0,195,255,0.3)',
              }}>
                Lihat paket →
              </a>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD MODE ── */}
        {mode === 'forgot' && (
          <>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, color:'#eef4fc', marginBottom:6 }}>
                Reset Password
              </div>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#8aa0b8', lineHeight:1.6 }}>
                Masukkan email yang terdaftar. Kami akan kirimkan link reset.
              </div>
            </div>

            <form onSubmit={handleForgot}>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:1, display:'block', marginBottom:6 }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="kamu@email.com"
                  style={{
                    width:'100%', padding:'10px 12px',
                    background:'#04070f', border:'1px solid #162035',
                    borderRadius:8, outline:'none',
                    fontFamily:'JetBrains Mono,monospace', fontSize:13, color:'#eef4fc',
                    boxSizing:'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#00c3ff60'}
                  onBlur={e  => e.currentTarget.style.borderColor = '#162035'}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width:'100%', padding:'12px 0',
                  background: loading ? '#162035' : '#00c3ff15',
                  border:`1px solid ${loading ? '#162035' : '#00c3ff'}`,
                  borderRadius:8, cursor: loading ? 'wait' : 'pointer',
                  fontFamily:'Space Mono,monospace', fontSize:11, fontWeight:700,
                  color: loading ? '#4a6080' : '#00c3ff',
                  letterSpacing:1, transition:'all 0.2s', marginBottom:12,
                }}
              >
                {loading ? 'Mengirim...' : 'KIRIM RESET LINK'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage('') }}
                style={{
                  width:'100%', padding:'8px 0',
                  background:'transparent', border:'1px solid #162035',
                  borderRadius:8, cursor:'pointer',
                  fontFamily:'Space Mono,monospace', fontSize:9,
                  color:'#4a6080', letterSpacing:1,
                }}
              >
                ← Kembali ke login
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div style={{
          marginTop:24, paddingTop:16, borderTop:'1px solid #162035',
          textAlign:'center',
          fontFamily:'Space Mono,monospace', fontSize:8, color:'#2a3d58', letterSpacing:0.5,
        }}>
          © StockIndexer.com · Powered by SS BlackBox v6.4
        </div>
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 15
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ background:'#04070f', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'Space Mono,monospace', fontSize:11, color:'#4a6080' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
