-- ─────────────────────────────────────────────────────────────
--  StockIndexer — Supabase Database Schema
--  Jalankan di: Supabase Dashboard → SQL Editor → New Query
--  Urutan: jalankan semua sekaligus (select all → Run)
-- ─────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════
--  1. PROFILES TABLE
--  Extends auth.users dengan tier, preferences, metadata
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT        NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  tier            TEXT        NOT NULL DEFAULT 'FREE' CHECK (tier IN ('FREE', 'PRO', 'ELITE')),
  tier_expires_at TIMESTAMPTZ,                        -- NULL = lifetime (ELITE), set = subscription end
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(UPPER(NEW.raw_user_meta_data->>'tier'), 'FREE')
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ══════════════════════════════════════════════════════════════
--  2. SIGNALS TABLE
--  Stores all SS BlackBox webhook signals
--  Populated by /api/webhook route
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.signals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker          TEXT        NOT NULL,
  alert_type      TEXT        NOT NULL,
  tier            TEXT        CHECK (tier IN ('S', 'A', 'B', 'C')),
  price           NUMERIC,
  sl_price        NUMERIC,
  tp_price        NUMERIC,
  fusion          INT         CHECK (fusion BETWEEN 0 AND 23),
  cells           INT         CHECK (cells BETWEEN 0 AND 8),
  conway_state    TEXT        CHECK (conway_state IN ('born', 'alive', 'died', 'dormant')),
  session         TEXT        CHECK (session IN ('LONDON', 'NY', 'ASIA', 'IDX', 'OFF')),
  asset_class     TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS signals_ticker_idx     ON public.signals(ticker);
CREATE INDEX IF NOT EXISTS signals_created_at_idx ON public.signals(created_at DESC);
CREATE INDEX IF NOT EXISTS signals_tier_idx       ON public.signals(tier);
CREATE INDEX IF NOT EXISTS signals_alert_type_idx ON public.signals(alert_type);


-- ══════════════════════════════════════════════════════════════
--  3. TRADES TABLE
--  pieBot trade journal — synced from soul.md or direct insert
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.trades (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT        UNIQUE,               -- from soul.md row id
  ticker          TEXT        NOT NULL,
  alert_type      TEXT        NOT NULL,
  tier            TEXT        CHECK (tier IN ('S', 'A', 'B', 'C')),
  entry           NUMERIC,
  sl              NUMERIC,
  tp              NUMERIC,
  exit_price      NUMERIC,
  exit_reason     TEXT,                             -- TP_HIT, SL_HIT, LH_EXIT, MANUAL, OPEN
  pnl_r           NUMERIC,                          -- P&L in R multiples
  pnl_usd         NUMERIC,                          -- P&L in USD
  session         TEXT,
  traded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trades_ticker_idx    ON public.trades(ticker);
CREATE INDEX IF NOT EXISTS trades_traded_at_idx ON public.trades(traded_at DESC);
CREATE INDEX IF NOT EXISTS trades_tier_idx      ON public.trades(tier);


-- ══════════════════════════════════════════════════════════════
--  4. SUBSCRIPTIONS TABLE
--  Tracks payment history — populated by UTAS webhook
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier            TEXT        NOT NULL CHECK (tier IN ('PRO', 'ELITE')),
  plan            TEXT        NOT NULL,             -- 'pro_monthly', 'elite_lifetime', etc
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  amount_usd      NUMERIC,
  payment_ref     TEXT,                             -- UTAS / payment gateway reference
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,                      -- NULL = lifetime
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subs_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subs_status_idx  ON public.subscriptions(status);


-- ══════════════════════════════════════════════════════════════
--  5. ROW LEVEL SECURITY (RLS)
--  Users can only read/write their own data
-- ══════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;

-- Profiles: user can only see and edit their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Signals: any authenticated user can read (PRO/ELITE filtered in app)
CREATE POLICY "signals_select_auth" ON public.signals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Signals: only service role can insert (from webhook)
CREATE POLICY "signals_insert_service" ON public.signals
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Trades: any authenticated user can read
CREATE POLICY "trades_select_auth" ON public.trades
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trades: only service role can insert/update
CREATE POLICY "trades_insert_service" ON public.trades
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Subscriptions: user can only see their own
CREATE POLICY "subs_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: only service role can insert (from payment webhook)
CREATE POLICY "subs_insert_service" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ══════════════════════════════════════════════════════════════
--  6. HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Get user tier (used in middleware check)
CREATE OR REPLACE FUNCTION get_user_tier(user_id UUID)
RETURNS TEXT AS $$
  SELECT tier FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Upgrade user tier (called from payment webhook)
CREATE OR REPLACE FUNCTION upgrade_user_tier(
  p_user_id   UUID,
  p_tier      TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update profiles table
  UPDATE public.profiles
  SET
    tier            = p_tier,
    tier_expires_at = p_expires_at,
    updated_at      = NOW()
  WHERE id = p_user_id;

  -- Also update auth.users metadata so middleware can read it
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
    'tier', p_tier,
    'tier_expires_at', p_expires_at
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire PRO subscriptions (run via cron or pg_cron)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS VOID AS $$
BEGIN
  -- Find expired PRO users
  UPDATE public.profiles
  SET tier = 'FREE', updated_at = NOW()
  WHERE
    tier = 'PRO'
    AND tier_expires_at IS NOT NULL
    AND tier_expires_at < NOW();

  -- Sync auth metadata
  UPDATE auth.users u
  SET raw_user_meta_data = raw_user_meta_data || '{"tier": "FREE"}'
  FROM public.profiles p
  WHERE
    u.id = p.id
    AND p.tier = 'FREE'
    AND (u.raw_user_meta_data->>'tier') != 'FREE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
