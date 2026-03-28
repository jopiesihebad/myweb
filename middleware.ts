import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────
//  middleware.ts — runs on every request
//  1. /dashboard/piebot → creator-only HMAC cookie check
//     (no jose dependency — uses native Web Crypto API)
//  2. /dashboard        → Supabase member session check
//  3. Tier gating       → FREE users redirect to upgrade
// ─────────────────────────────────────────────────────────────

const CREATOR_COOKIE = 'creator_session'

// Verify HMAC-signed token using native Web Crypto (Edge compatible)
async function verifyCreatorCookie(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(CREATOR_COOKIE)?.value
  if (!token) return false

  const secret = process.env.CREATOR_JWT_SECRET
  if (!secret || secret.length < 32) return false

  try {
    // Token format: base64(payload).base64(signature)
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return false

    // Import HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payloadB64)
    )
    if (!valid) return false

    // Check expiry from payload
    const payload = JSON.parse(atob(payloadB64))
    if (!payload.exp || Date.now() > payload.exp) return false

    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // ── 1. pieBot creator-only routes ──────────────────────────
  if (path.startsWith('/dashboard/piebot')) {
    // Login page — allow through always
    if (path === '/dashboard/piebot/login') {
      return response
    }
    // All other /dashboard/piebot/* → must have valid creator cookie
    const isCreator = await verifyCreatorCookie(request)
    if (!isCreator) {
      return NextResponse.redirect(new URL('/dashboard/piebot/login', request.url))
    }
    // Creator verified — bypass Supabase check entirely
    return response
  }

  // ── 2. Member dashboard — Supabase auth ────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Protect /dashboard ────────────────────────────────────
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    const tier = (
      user.user_metadata?.tier ??
      user.app_metadata?.tier ??
      'FREE'
    ).toString().toUpperCase()

    if (tier === 'FREE') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('upgrade', 'true')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Redirect logged-in users away from /login ─────────────
  if (path === '/login' && user) {
    const tier = (
      user.user_metadata?.tier ??
      user.app_metadata?.tier ??
      'FREE'
    ).toString().toUpperCase()

    if (tier === 'PRO' || tier === 'ELITE') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
  ],
}
