import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────
//  middleware.ts — runs on every request
//  1. Refresh Supabase session (keep cookies fresh)
//  2. Protect /dashboard — redirect to /login if no session
//  3. Tier check — FREE users redirected to /login?upgrade=true
// ─────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

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

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ─── Protect /dashboard ───────────────────────────────────
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    // Check tier
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

  // ─── Redirect logged-in users away from /login ────────────
  if (path === '/login' && user) {
    const tier = (
      user.user_metadata?.tier ??
      user.app_metadata?.tier ??
      'FREE'
    ).toString().toUpperCase()

    // Only redirect if they have paid tier
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
