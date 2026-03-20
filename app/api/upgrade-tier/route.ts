import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
//  POST /api/upgrade-tier
//  Called by UTAS (or any payment gateway) after successful payment
//  Sets user tier to PRO or ELITE in Supabase
//
//  Request body:
//  {
//    secret: string        // WEBHOOK_SECRET from env
//    email:  string        // user email
//    tier:   'PRO'|'ELITE'
//    plan:   string        // 'pro_monthly' | 'elite_lifetime'
//    amount: number        // USD
//    ref:    string        // payment reference
//  }
// ─────────────────────────────────────────────────────────────

// Admin client — uses service role key (bypasses RLS)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  let body: {
    secret: string
    email:  string
    tier:   string
    plan?:  string
    amount?: number
    ref?:   string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify webhook secret
  if (body.secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, tier, plan, amount, ref } = body

  if (!email || !tier) {
    return NextResponse.json({ error: 'email and tier required' }, { status: 400 })
  }

  const tierUpper = tier.toUpperCase()
  if (!['PRO', 'ELITE'].includes(tierUpper)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    console.error('[upgrade-tier] listUsers error:', userError)
    return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
  }

  const user = users.users.find(u => u.email === email)
  if (!user) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 })
  }

  // Calculate expiry
  // PRO monthly = 31 days, ELITE = lifetime (null)
  const expiresAt = tierUpper === 'ELITE'
    ? null
    : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

  // Upgrade tier via DB function
  const { error: upgradeError } = await supabase.rpc('upgrade_user_tier', {
    p_user_id:    user.id,
    p_tier:       tierUpper,
    p_expires_at: expiresAt,
  })

  if (upgradeError) {
    console.error('[upgrade-tier] upgrade error:', upgradeError)
    return NextResponse.json({ error: 'Failed to upgrade tier' }, { status: 500 })
  }

  // Log subscription
  await supabase.from('subscriptions').insert({
    user_id:     user.id,
    tier:        tierUpper,
    plan:        plan ?? `${tierUpper.toLowerCase()}_manual`,
    status:      'active',
    amount_usd:  amount ?? null,
    payment_ref: ref ?? null,
    expires_at:  expiresAt,
  })

  console.log(`[upgrade-tier] ✅ ${email} → ${tierUpper} (expires: ${expiresAt ?? 'lifetime'})`)

  return NextResponse.json({
    success:    true,
    user_id:    user.id,
    email,
    tier:       tierUpper,
    expires_at: expiresAt,
  })
}
