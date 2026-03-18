import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  POST /api/webhook  —  SS BlackBox v6.4 signal receiver
//  2-tier validation:
//    ENTRY alerts  → strict  (sl_price/tp_price/atr > 0 required)
//    INFO/EXIT     → relaxed (sl_price/tp_price/atr may be 0)
// ─────────────────────────────────────────────────────────────

type AlertType =
  | 'GOLD_BUY'         | 'DOOM_SELL'         | 'CONWAY_BUY'      | 'CONWAY_SELL'
  | 'CONWAY_BORN'      | 'CONWAY_DIED'       | 'PM_BUY'          | 'PM_SELL'
  | 'BULLISH_LIQ_GRAB' | 'BEARISH_LIQ_GRAB' | 'BREAKOUT'        | 'SQZ_RELEASED'
  | 'PREDATOR_HFT'     | 'ALPHA_EXIT'        | 'DIVERGENCE_RISK' | 'HIGH_CONFLUENCE'
  | 'CHoCH_BULL'       | 'CHoCH_BEAR'        | 'BOS_BULL'        | 'BOS_BEAR'
  | 'OB_TOUCH_BULL'    | 'OB_TOUCH_BEAR'     | 'BBP_ENTRY_BUY'   | 'BBP_ENTRY_SELL'
  | 'LH_EXIT'
  | 'LONDON_OPEN'      | 'NEW_YORK_OPEN'     | 'BBP_CROSSOVER'   | 'BBP_CROSSUNDER'

type Tier    = 'S' | 'A' | 'B' | 'C'
type Session = 'NY' | 'LONDON' | 'ASIA' | 'OFF'

type SignalPayload = {
  alert_type: AlertType
  ticker:     string
  close:      number
  cells:      number
  cells_arr:  number[]
  fusion:     number
  grade:      number
  tier:       Tier
  session:    Session
  atr:        number
  sl_price:   number
  tp_price:   number
  timestamp:  string
  message:    string
}

const ALERT_META: Record<AlertType, { label: string; color: string; category: 'ENTRY'|'EXIT'|'INFO'; desc: string }> = {
  GOLD_BUY:         { label: '⚡ GOLD BUY',        color: '#ffd700', category: 'ENTRY', desc: 'High-confluence gold signal: PM cross + VWAP + RSI — no Conway gate' },
  DOOM_SELL:        { label: '⚡ DOOM SELL',        color: '#ff0062', category: 'INFO',  desc: 'Bearish confluence — LONG-only system ignores for entry' },
  CONWAY_BUY:       { label: '⚡ CONWAY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'Conway ALIVE ≥5 cells + PM cross + VWAP + RSI — Tier A' },
  CONWAY_SELL:      { label: '⚡ CONWAY SELL',      color: '#ff0062', category: 'INFO',  desc: 'Conway bearish — LONG-only system ignores for entry' },
  CONWAY_BORN:      { label: '🟢 CONWAY BORN',      color: '#39ff14', category: 'ENTRY', desc: 'Conway just turned ALIVE + conf_buy — Tier S, max conviction' },
  CONWAY_DIED:      { label: '🔴 CONWAY DIED',      color: '#ff0062', category: 'EXIT',  desc: 'Conway cells dropped below threshold — exit or pause positions' },
  PM_BUY:           { label: 'PM BUY',              color: '#00c3ff', category: 'ENTRY', desc: 'Momentum buy: PM crossover without full confluence gate' },
  PM_SELL:          { label: 'PM SELL',             color: '#ff8c00', category: 'INFO',  desc: 'Momentum sell — LONG-only system ignores for entry' },
  BULLISH_LIQ_GRAB: { label: '💧 LIQ GRAB BULL',   color: '#39ff14', category: 'INFO',  desc: 'Bullish liquidity grab: wick below support swept, reversal expected' },
  BEARISH_LIQ_GRAB: { label: '💧 LIQ GRAB BEAR',   color: '#ff0062', category: 'INFO',  desc: 'Bearish liquidity grab: wick above resistance swept, rejection expected' },
  BREAKOUT:         { label: '🚀 BREAKOUT',          color: '#00c3ff', category: 'INFO',  desc: 'Price breaks key resistance with volume — watch for Conway confirmation' },
  SQZ_RELEASED:     { label: '⊕ SQZ RELEASED',     color: '#bd93f9', category: 'INFO',  desc: 'Bollinger Bands expanded outside Keltner Channels — volatility expanding' },
  PREDATOR_HFT:     { label: '🦈 PREDATOR HFT',     color: '#ff8c00', category: 'INFO',  desc: 'High-frequency volume anomaly — institutional activity likely' },
  ALPHA_EXIT:       { label: '⚠ ALPHA EXIT',        color: '#ff8c00', category: 'EXIT',  desc: 'Smart money exit: vol drop + negative price-volume correlation' },
  DIVERGENCE_RISK:  { label: '⚠ DIVERGENCE RISK',  color: '#ff8c00', category: 'EXIT',  desc: 'RSI diverging from price — trend weakening, reduce exposure' },
  HIGH_CONFLUENCE:  { label: '★ HIGH CONFLUENCE',   color: '#ffd700', category: 'INFO',  desc: 'Fusion score ≥18/23 — Grade 1-2 alignment across all indicators' },
  CHoCH_BULL:       { label: 'CHoCH BULL',          color: '#39ff14', category: 'INFO',  desc: 'Change of Character bullish: first higher high after downtrend' },
  CHoCH_BEAR:       { label: 'CHoCH BEAR',          color: '#ff0062', category: 'INFO',  desc: 'Change of Character bearish: first lower low after uptrend' },
  BOS_BULL:         { label: 'BOS BULL',            color: '#39ff14', category: 'INFO',  desc: 'Break of Structure bullish: continuation higher high confirmed' },
  BOS_BEAR:         { label: 'BOS BEAR',            color: '#ff0062', category: 'INFO',  desc: 'Break of Structure bearish: continuation lower low confirmed' },
  OB_TOUCH_BULL:    { label: 'OB TOUCH BULL',       color: '#00c3ff', category: 'INFO',  desc: 'Price touching bullish order block — potential demand zone reaction' },
  OB_TOUCH_BEAR:    { label: 'OB TOUCH BEAR',       color: '#ff0062', category: 'INFO',  desc: 'Price touching bearish order block — potential supply zone reaction' },
  BBP_ENTRY_BUY:    { label: 'BBP ENTRY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'BBP crossover entry — Tier B (cells≥5) or Tier C (cells<5)' },
  BBP_ENTRY_SELL:   { label: 'BBP ENTRY SELL',      color: '#ff0062', category: 'INFO',  desc: 'BBP crossunder — LONG-only system treats as exit signal only' },
  LH_EXIT:          { label: '⚠ LH EXIT',           color: '#bd93f9', category: 'EXIT',  desc: 'Lower High formed + Conway weakening — early warning, consider closing' },
  LONDON_OPEN:      { label: '🇬🇧 LONDON OPEN',      color: '#39ff14', category: 'INFO',  desc: 'London session started — prime liquidity window' },
  NEW_YORK_OPEN:    { label: '🗽 NEW YORK OPEN',     color: '#00c3ff', category: 'INFO',  desc: 'New York session started — highest volume window' },
  BBP_CROSSOVER:    { label: 'BBP CROSSOVER',       color: '#39ff14', category: 'INFO',  desc: 'Raw BBP crossover — watch for confirmation' },
  BBP_CROSSUNDER:   { label: 'BBP CROSSUNDER',      color: '#ff0062', category: 'INFO',  desc: 'Raw BBP crossunder — potential exit signal' },
}

const ENTRY_ALERT_TYPES = new Set<AlertType>([
  'GOLD_BUY', 'CONWAY_BUY', 'CONWAY_BORN', 'PM_BUY', 'BBP_ENTRY_BUY',
])
const VALID_ALERT_TYPES = new Set(Object.keys(ALERT_META) as AlertType[])
const VALID_TIERS       = new Set<string>(['S', 'A', 'B', 'C'])
const VALID_SESSIONS    = new Set<string>(['NY', 'LONDON', 'ASIA', 'OFF'])

// ─── 2-tier validation ────────────────────────────────────────
function validatePayload(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object')
    return { valid: false, error: 'Payload must be a JSON object' }

  const b = body as Record<string, unknown>

  if (typeof b.alert_type !== 'string' || !VALID_ALERT_TYPES.has(b.alert_type as AlertType))
    return { valid: false, error: `Invalid alert_type: "${b.alert_type}"` }
  if (typeof b.ticker !== 'string' || b.ticker.length === 0)
    return { valid: false, error: 'ticker must be a non-empty string' }
  if (typeof b.close !== 'number' || b.close <= 0)
    return { valid: false, error: 'close must be a number > 0' }
  if (typeof b.cells !== 'number' || b.cells < 0 || b.cells > 8)
    return { valid: false, error: 'cells must be integer 0-8' }
  if (!Array.isArray(b.cells_arr) || (b.cells_arr as unknown[]).length !== 8)
    return { valid: false, error: 'cells_arr must be an 8-element array' }
  if (typeof b.fusion !== 'number' || b.fusion < 0 || b.fusion > 23)
    return { valid: false, error: 'fusion must be number 0-23' }
  if (typeof b.grade !== 'number' || b.grade < 1 || b.grade > 5)
    return { valid: false, error: 'grade must be integer 1-5' }
  if (typeof b.tier !== 'string' || !VALID_TIERS.has(b.tier))
    return { valid: false, error: `tier must be S|A|B|C, got "${b.tier}"` }
  if (typeof b.session !== 'string' || !VALID_SESSIONS.has(b.session))
    return { valid: false, error: `session must be NY|LONDON|ASIA|OFF, got "${b.session}"` }
  if (typeof b.atr !== 'number' || b.atr < 0)
    return { valid: false, error: 'atr must be number >= 0' }
  if (typeof b.sl_price !== 'number' || b.sl_price < 0)
    return { valid: false, error: 'sl_price must be number >= 0' }
  if (typeof b.tp_price !== 'number' || b.tp_price < 0)
    return { valid: false, error: 'tp_price must be number >= 0' }
  if (typeof b.timestamp !== 'string' || b.timestamp.length === 0)
    return { valid: false, error: 'timestamp must be a non-empty string' }
  if (typeof b.message !== 'string' || b.message.length === 0)
    return { valid: false, error: 'message must be a non-empty string' }

  // ENTRY-only: sl/tp/atr must be > 0
  const alertType = b.alert_type as AlertType
  if (ENTRY_ALERT_TYPES.has(alertType)) {
    if ((b.atr as number) <= 0)
      return { valid: false, error: `ENTRY signal ${alertType} requires atr > 0` }
    if ((b.sl_price as number) <= 0)
      return { valid: false, error: `ENTRY signal ${alertType} requires sl_price > 0` }
    if ((b.tp_price as number) <= 0)
      return { valid: false, error: `ENTRY signal ${alertType} requires tp_price > 0` }
  }

  return { valid: true }
}

// ─── In-memory WS broadcast (replace with Redis/Supabase in prod) ─
declare global {
  // eslint-disable-next-line no-var
  var __wsClients: Set<(payload: SignalPayload) => void> | undefined
}
if (!global.__wsClients) global.__wsClients = new Set()

export function registerWsClient(cb: (p: SignalPayload) => void) {
  global.__wsClients!.add(cb)
  return () => global.__wsClients!.delete(cb)
}

function broadcastToClients(payload: SignalPayload) {
  global.__wsClients?.forEach(cb => {
    try { cb(payload) } catch { /* ignore per-client errors */ }
  })
}

// ─── pieBot forward (non-blocking, non-fatal) ─────────────────
async function forwardToPieBot(payload: SignalPayload): Promise<void> {
  const url    = process.env.PIEBOT_WEBHOOK_URL
  const secret = process.env.WEBHOOK_SECRET
  if (!url) return
  try {
    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret ?? '' },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    })
    if (!res.ok) console.warn('[Webhook] pieBot forward failed:', res.status)
  } catch (err) {
    console.warn('[Webhook] pieBot forward error (non-fatal):', err)
  }
}

// ─── POST /api/webhook ────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const secret = req.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    if (!body?.ticker || !body?.alert_type)
      return NextResponse.json(
        { error: 'Invalid payload: ticker and alert_type are required' },
        { status: 400 }
      )

    const { valid, error } = validatePayload(body)
    if (!valid)
      return NextResponse.json({ error, valid_alert_types: [...VALID_ALERT_TYPES] }, { status: 422 })

    const payload = body as SignalPayload
    const meta    = ALERT_META[payload.alert_type]
    const isEntry = ENTRY_ALERT_TYPES.has(payload.alert_type)

    console.log('[Webhook] Signal received:', {
      alert:   payload.alert_type,
      label:   meta.label,
      tier:    payload.tier,
      ticker:  payload.ticker,
      close:   payload.close,
      cells:   `${payload.cells}/8`,
      fusion:  `${payload.fusion}/23`,
      session: payload.session,
      sl:      isEntry ? payload.sl_price : 'n/a',
      tp:      isEntry ? payload.tp_price : 'n/a',
      ts:      payload.timestamp,
    })

    broadcastToClients(payload)
    forwardToPieBot(payload)   // fire-and-forget

    return NextResponse.json({
      ok:       true,
      alert:    payload.alert_type,
      label:    meta.label,
      category: meta.category,
      tier:     payload.tier,
      ticker:   payload.ticker,
      fusion:   payload.fusion,
      ts:       payload.timestamp,
    }, { status: 200 })

  } catch (err) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── GET /api/webhook — health + docs ────────────────────────
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status:  'online',
    version: 'SS BlackBox v6.4',
    endpoint: 'POST /api/webhook',
    auth:     'Header: x-webhook-secret: <WEBHOOK_SECRET>',
    validation_tiers: {
      ENTRY: 'sl_price/tp_price/atr must be > 0',
      INFO_EXIT: 'sl_price/tp_price/atr may be 0',
    },
    entry_alert_types: [...ENTRY_ALERT_TYPES],
    all_alert_types:   [...VALID_ALERT_TYPES],
    example_entry: {
      alert_type: 'CONWAY_BUY', ticker: 'BTCUSDT', close: 91234.56,
      cells: 6, cells_arr: [1,1,1,1,0,1,1,0], fusion: 19, grade: 2,
      tier: 'A', session: 'LONDON', atr: 820.50, sl_price: 90412.00,
      tp_price: 93500.00, timestamp: '2026-03-18T10:00:00Z',
      message: 'CONWAY_BUY on BTCUSDT | Fusion:19/23 | Conway:6/8 | Session:LONDON',
    },
    example_info: {
      alert_type: 'BREAKOUT', ticker: 'ETHUSDT', close: 3450.00,
      cells: 4, cells_arr: [1,0,1,1,0,0,1,0], fusion: 11, grade: 3,
      tier: 'B', session: 'NY', atr: 0, sl_price: 0, tp_price: 0,
      timestamp: '2026-03-18T14:30:00Z',
      message: 'BREAKOUT on ETHUSDT | Fusion:11/23 | Conway:4/8 | Session:NY',
    },
  })
}
