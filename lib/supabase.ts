import { createBrowserClient } from '@supabase/ssr'

// ─────────────────────────────────────────────────────────────
//  lib/supabase.ts — Browser client only
//  Gunakan di 'use client' components
//  Server client ada di lib/supabase-server.ts
// ─────────────────────────────────────────────────────────────

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
  label:              string
  color:              string
  canAccessDashboard: boolean
}> = {
  FREE:  { label:'Free',  color:'#4a6080', canAccessDashboard: false },
  PRO:   { label:'Pro',   color:'#00c3ff', canAccessDashboard: true  },
  ELITE: { label:'Elite', color:'#ffd700', canAccessDashboard: true  },
}
