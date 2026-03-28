import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

// ─────────────────────────────────────────────────────────────
//  POST /api/creator/auth   — Creator login
//  GET  /api/creator/auth   — Verify session
//  DELETE /api/creator/auth — Logout
//
//  Completely isolated from Supabase member auth.
//  Uses httpOnly cookie + JWT signed with CREATOR_JWT_SECRET.
//
//  Required env vars:
//    CREATOR_PASSWORD      — plaintext password (set once, keep secret)
//    CREATOR_JWT_SECRET    — random 32+ char string for JWT signing
//
//  Generate secrets:
//    CREATOR_PASSWORD:   pick a strong passphrase (20+ chars)
//    CREATOR_JWT_SECRET: openssl rand -hex 32
// ─────────────────────────────────────────────────────────────

const COOKIE_NAME    = 'creator_session'
const SESSION_HOURS  = 12   // auto-expire after 12 hours
const RATE_LIMIT_MS  = 2000 // 2 second delay on failed attempt (slow brute force)

function getSecret() {
  const s = process.env.CREATOR_JWT_SECRET
  if (!s || s.length < 32) throw new Error('CREATOR_JWT_SECRET not configured')
  return new TextEncoder().encode(s)
}

async function signSession(): Promise<string> {
  return new SignJWT({ creator: true, v: 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret())
}

async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret())
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

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const correctPw = process.env.CREATOR_PASSWORD
    if (!correctPw) {
      return NextResponse.json({ error: 'Creator auth not configured' }, { status: 503 })
    }

    // Constant-time comparison to prevent timing attacks
    const pwBuf      = Buffer.from(password)
    const correctBuf = Buffer.from(correctPw)
    const match      = pwBuf.length === correctBuf.length &&
                       pwBuf.every((b, i) => b === correctBuf[i])

    if (!match) {
      // Slow down brute force attempts
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Issue JWT session cookie
    const token = await signSession()
    const res   = NextResponse.json({ ok: true })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,           // not accessible from JS
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',       // CSRF protection
      maxAge:   SESSION_HOURS * 3600,
      path:     '/dashboard/piebot',  // scoped to piebot only
    })

    return res

  } catch (err) {
    console.error('[Creator auth] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── GET — Verify current session ─────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ valid: false }, { status: 401 })

  const valid = await verifySession(token)
  if (!valid) return NextResponse.json({ valid: false }, { status: 401 })

  return NextResponse.json({ valid: true })
}

// ── DELETE — Logout ───────────────────────────────────────────
export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}

// ── Helper for middleware ─────────────────────────────────────
export async function verifyCreatorSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifySession(token)
}
