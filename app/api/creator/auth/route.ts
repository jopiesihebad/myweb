import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  POST   /api/creator/auth   — Creator login
//  GET    /api/creator/auth   — Verify session
//  DELETE /api/creator/auth   — Logout
//
//  Uses native Web Crypto API (no jose dependency).
//  Token format: base64(payload).base64(HMAC-SHA256 signature)
//
//  Required env vars:
//    CREATOR_PASSWORD    — strong passphrase 20+ chars
//    CREATOR_JWT_SECRET  — openssl rand -hex 32
// ─────────────────────────────────────────────────────────────

const COOKIE_NAME   = 'creator_session'
const SESSION_HOURS = 12
const RATE_LIMIT_MS = 2000

function getSecret(): string {
  const s = process.env.CREATOR_JWT_SECRET
  if (!s || s.length < 32) throw new Error('CREATOR_JWT_SECRET not configured')
  return s
}

async function signToken(): Promise<string> {
  const secret  = getSecret()
  const payload = btoa(JSON.stringify({
    creator: true,
    v:       1,
    iat:     Date.now(),
    exp:     Date.now() + SESSION_HOURS * 3_600_000,
  }))

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))

  return `${payload}.${sig}`
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return false

    const secret = getSecret()
    const key    = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    const valid    = await crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(payloadB64)
    )
    if (!valid) return false

    const payload = JSON.parse(atob(payloadB64))
    if (!payload.exp || Date.now() > payload.exp) return false

    return true
  } catch {
    return false
  }
}

// ── POST — Login ──────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()
    const { password } = body as { password?: string }

    if (!password || typeof password !== 'string')
      return NextResponse.json({ error: 'Password required' }, { status: 400 })

    const correctPw = process.env.CREATOR_PASSWORD
    if (!correctPw)
      return NextResponse.json({ error: 'Creator auth not configured' }, { status: 503 })

    // Constant-time comparison
    const pwBuf      = Buffer.from(password)
    const correctBuf = Buffer.from(correctPw)
    const match = pwBuf.length === correctBuf.length &&
                  pwBuf.every((b, i) => b === correctBuf[i])

    if (!match) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await signToken()
    const res   = NextResponse.json({ ok: true })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   SESSION_HOURS * 3600,
      path:     '/dashboard/piebot',
    })

    return res
  } catch (err) {
    console.error('[Creator auth] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── GET — Verify session ──────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ valid: false }, { status: 401 })
  const valid = await verifyToken(token)
  return NextResponse.json({ valid }, { status: valid ? 200 : 401 })
}

// ── DELETE — Logout ───────────────────────────────────────────
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
