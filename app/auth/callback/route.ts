import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────
//  GET /auth/callback
//  Handles Supabase OAuth redirect (Google) and magic links
//  Exchanges code for session, then redirects based on tier
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/dashboard'
  const error    = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDesc)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDesc ?? error)}`
    )
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] Exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const user = data.session?.user
    const tier = (
      user?.user_metadata?.tier ??
      user?.app_metadata?.tier ??
      'FREE'
    ).toString().toUpperCase()

    // FREE users → back to login with upgrade prompt
    if (tier === 'FREE') {
      return NextResponse.redirect(`${origin}/login?upgrade=true`)
    }

    // PRO/ELITE → go to dashboard (or intended page)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
