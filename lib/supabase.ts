import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────
//  Supabase helpers — SSR-safe
//  Browser client: use in 'use client' components
//  Server client: use in Server Components, Route Handlers, middleware
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client (singleton) ──────────────────────────────
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}

// ─── Server client (per-request) ─────────────────────────────
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}

// ─── Tier types ───────────────────────────────────────────────
export type UserTier = 'FREE' | 'PRO' | 'ELITE'

export function getUserTier(user: any): UserTier {
  const tier = user?.user_metadata?.tier
    ?? user?.app_metadata?.tier
    ?? 'FREE'
  const upper = String(tier).toUpperCase()
  if (upper === 'ELITE') return 'ELITE'
  if (upper === 'PRO')   return 'PRO'
  return 'FREE'
}

export const TIER_META: Record<UserTier, {
  label:   string
  color:   string
  canAccessDashboard: boolean
}> = {
  FREE:  { label: 'Free',  color: '#4a6080', canAccessDashboard: false },
  PRO:   { label: 'Pro',   color: '#00c3ff', canAccessDashboard: true  },
  ELITE: { label: 'Elite', color: '#ffd700', canAccessDashboard: true  },
}
