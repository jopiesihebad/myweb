import { NextRequest, NextResponse } from 'next/server'

/* ─── Alert types — SS BlackBox v6.3.1 (25 total) ─── */
export type AlertType =
  | 'GOLD_BUY'        | 'DOOM_SELL'         | 'CONWAY_BUY'      | 'CONWAY_SELL'
  | 'CONWAY_BORN'     | 'CONWAY_DIED'       | 'PM_BUY'          | 'PM_SELL'
  | 'BULLISH_LIQ_GRAB'| 'BEARISH_LIQ_GRAB' | 'BREAKOUT'        | 'SQZ_RELEASED'
  | 'PREDATOR_HFT'    | 'ALPHA_EXIT'        | 'DIVERGENCE_RISK' | 'HIGH_CONFLUENCE'
  | 'CHoCH_BULL'      | 'CHoCH_BEAR'        | 'BOS_BULL'        | 'BOS_BEAR'
  | 'OB_TOUCH_BULL'   | 'OB_TOUCH_BEAR'    | 'BBP_ENTRY_BUY'   | 'BBP_ENTRY_SELL'
  | 'LH_EXIT'

/* Metadata for each alert — matches lib/useWebSocket.ts exactly */
export const ALERT_META: Record<AlertType, {
  label:    string
  color:    string
  category: 'ENTRY' | 'EXIT' | 'INFO'
  desc:     string
}> = {
  GOLD_BUY:         { label: '⚡ GOLD BUY',        color: '#ffd700', category: 'ENTRY', desc: 'High-confluence gold signal: BBP cross + Conway ALIVE/BORN + VWAP filter' },
  DOOM_SELL:        { label: '⚡ DOOM SELL',        color: '#ff0062', category: 'ENTRY', desc: 'Bearish reversal: BBP crossunder + RSI overbought + Conway dying' },
  CONWAY_BUY:       { label: '⚡ CONWAY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'Conway BORN/ALIVE ≥5 cells + BBP bullish cross confirmed' },
  CONWAY_SELL:      { label: '⚡ CONWAY SELL',      color: '#ff0062', category: 'ENTRY', desc: 'Conway DIED + BBP bearish cross confirmed' },
  CONWAY_BORN:      { label: '🟢 CONWAY BORN',      color: '#39ff14', category: 'INFO',  desc: 'State transition: cells crossed threshold from below (prev<5, curr≥5)' },
  CONWAY_DIED:      { label: '🔴 CONWAY DIED',      color: '#ff0062', category: 'EXIT',  desc: 'State transition: cells dropped below threshold (prev≥5, curr<5) — prepare exit' },
  PM_BUY:           { label: 'PM BUY',              color: '#00c3ff', category: 'ENTRY', desc: 'Momentum buy: PM cross bullish + baseline above BBMC' },
  PM_SELL:          { label: 'PM SELL',             color: '#ff8c00', category: 'ENTRY', desc: 'Momentum sell: PM cross bearish + price below BBMC' },
  BULLISH_LIQ_GRAB: { label: '💧 LIQ GRAB BULL',   color: '#39ff14', category: 'INFO',  desc: 'Bullish liquidity grab: wick below support swept, reversal expected' },
  BEARISH_LIQ_GRAB: { label: '💧 LIQ GRAB BEAR',   color: '#ff0062', category: 'INFO',  desc: 'Bearish liquidity grab: wick above resistance swept, reversal expected' },
  BREAKOUT:         { label: '🚀 BREAKOUT',          color: '#00c3ff', category: 'ENTRY', desc: 'Price breaks key level with volume + SQZ released + Conway positive' },
  SQZ_RELEASED:     { label: '⊕ SQZ RELEASED',     color: '#bd93f9', category: 'INFO',  desc: 'Bollinger Bands expanded outside Keltner Channels — volatility expanding' },
  PREDATOR_HFT:     { label: '🦈 PREDATOR HFT',     color: '#ff8c00', category: 'INFO',  desc: 'High-frequency volume anomaly detected — institutional activity likely' },
  ALPHA_EXIT:       { label: '⚠ ALPHA EXIT',        color: '#ff8c00', category: 'EXIT',  desc: 'Smart money exit signal: divergence + momentum loss + structure break' },
  DIVERGENCE_RISK:  { label: '⚠ DIVERGENCE RISK',  color: '#ff8c00', category: 'EXIT',  desc: 'RSI/momentum diverging from price — trend weakening, reduce exposure' },
  HIGH_CONFLUENCE:  { label: '★ HIGH CONFLUENCE',   color: '#ffd700', category: 'INFO',  desc: 'Fusion score ≥20/23 — maximum alignment across all indicators' },
  CHoCH_BULL:       { label: 'CHoCH BULL',          color: '#39ff14', category: 'INFO',  desc: 'Change of Character bullish: first higher high after downtrend' },
  CHoCH_BEAR:       { label: 'CHoCH BEAR',          color: '#ff0062', category: 'INFO',  desc: 'Change of Character bearish: first lower low after uptrend' },
  BOS_BULL:         { label: 'BOS BULL',            color: '#39ff14', category: 'INFO',  desc: 'Break of Structure bullish: continuation higher high confirmed' },
  BOS_BEAR:         { label: 'BOS BEAR',            color: '#ff0062', category: 'INFO',  desc: 'Break of Structure bearish: continuation lower low confirmed' },
  OB_TOUCH_BULL:    { label: 'OB TOUCH BULL',       color: '#00c3ff', category: 'INFO',  desc: 'Price touching bullish order block — potential demand zone reaction' },
  OB_TOUCH_BEAR:    { label: 'OB TOUCH BEAR',       color: '#ff0062', category: 'INFO',  desc: 'Price touching bearish order block — potential supply zone reaction' },
  BBP_ENTRY_BUY:    { label: 'BBP ENTRY BUY',       color: '#39ff14', category: 'ENTRY', desc: 'BBP crossover buy without Conway filter — Grade 3-4 signal' },
  BBP_ENTRY_SELL:   { label: 'BBP ENTRY SELL',      color: '#ff0062', category: 'ENTRY', desc: 'BBP crossunder sell without Conway filter — Grade 3-4 signal' },
  LH_EXIT:          { label: 'LH EXIT',             color: '#bd93f9', category: 'EXIT',  desc: 'Lower High detected — momentum fading, close partial or full position' },
}

const VALID_ALERT_TYPES = new Set(Object.keys(ALERT_META) as AlertType[])

/* ─── Payload type ──────────────────────────────────── */
export type SignalPayload = {
  ticker:      string
  close:       number
  confluence:  number
  grade:       number
  cells:       number
  session:     string
  filter_mode: string
  atr:         number
  sl_price:    number
  tp_price:    number
  timestamp:   string
  alert_type:  AlertType
  message:     string
}

/* ─── In-memory subscriber registry ────────────────────
   Production: replace with Redis pub/sub or Supabase Realtime
   ──────────────────────────────────────────────────────── */
type Subscriber = (payload: SignalPayload) => void
const subscribers = new Set<Subscriber>()

export function subscribeToSignals(cb: Subscriber): () => void {
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

function broadcast(payload: SignalPayload) {
  subscribers.forEach(cb => { try { cb(payload) } catch {} })
}

/* ─── Validation ────────────────────────────────────── */
function validatePayload(body: unknown): body is SignalPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.ticker      === 'string'  && b.ticker.length > 0                    &&
    typeof b.close       === 'number'  && b.close > 0                             &&
    typeof b.confluence  === 'number'  && b.confluence >= 0 && b.confluence <= 23 &&
    typeof b.grade       === 'number'  && b.grade >= 1 && b.grade <= 5            &&
    typeof b.cells       === 'number'  && b.cells >= 0 && b.cells <= 8            &&
    typeof b.session     === 'string'  && b.session.length > 0                   &&
    typeof b.filter_mode === 'string'  && b.filter_mode.length > 0               &&
    typeof b.atr         === 'number'  && b.atr > 0                               &&
    typeof b.sl_price    === 'number'  && b.sl_price > 0                          &&
    typeof b.tp_price    === 'number'  && b.tp_price > 0                          &&
    typeof b.timestamp   === 'string'  && b.timestamp.length > 0                 &&
    typeof b.alert_type  === 'string'  && VALID_ALERT_TYPES.has(b.alert_type as AlertType) &&
    typeof b.message     === 'string'  && b.message.length > 0
  )
}

/* ─── POST /api/webhook ─────────────────────────────── */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!validatePayload(body)) {
    return NextResponse.json({
      error: 'Invalid payload',
      required_fields: {
        ticker:      'string (symbol, e.g. BTCUSDT)',
        close:       'number > 0',
        confluence:  'number 0–23',
        grade:       'number 1–5',
        cells:       'number 0–8',
        session:     'string (NY | LONDON | ASIA | IDX)',
        filter_mode: 'string',
        atr:         'number > 0',
        sl_price:    'number > 0',
        tp_price:    'number > 0',
        timestamp:   'ISO 8601 string',
        alert_type:  `one of: ${[...VALID_ALERT_TYPES].join(' | ')}`,
        message:     'string',
      },
    }, { status: 422 })
  }

  // Enrich payload with meta
  const meta = ALERT_META[body.alert_type]

  broadcast(body)

  console.log('[Webhook]', {
    alert:     body.alert_type,
    label:     meta.label,
    category:  meta.category,
    ticker:    body.ticker,
    close:     body.close,
    cells:     `${body.cells}/8`,
    grade:     body.grade,
    confluence:`${body.confluence}/23`,
    session:   body.session,
    ts:        body.timestamp,
  })

  return NextResponse.json({
    ok:        true,
    alert:     body.alert_type,
    label:     meta.label,
    category:  meta.category,
    ticker:    body.ticker,
    ts:        body.timestamp,
  }, { status: 200 })
}

/* ─── GET /api/webhook — health + docs ─────────────── */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status:    'online',
    version:   'SS BlackBox v6.3.1',
    endpoint:  'POST /api/webhook',
    auth:      'Header: x-webhook-secret: <WEBHOOK_SECRET>',
    alerts:    Object.entries(ALERT_META).map(([type, meta]) => ({
      type,
      label:    meta.label,
      color:    meta.color,
      category: meta.category,
      desc:     meta.desc,
    })),
    example_payload: {
      ticker:      'BTCUSDT',
      close:       91234.56,
      confluence:  18,
      grade:       2,
      cells:       6,
      session:     'NY',
      filter_mode: 'BBP High Precision',
      atr:         820.5,
      sl_price:    90412.0,
      tp_price:    93500.0,
      timestamp:   '2026-03-08T08:22:00Z',
      alert_type:  'GOLD_BUY',
      message:     '⚡ GOLD BUY | BTCUSDT @ 91234.56 | Conway 6/8 | Confluence 18/23 | Grade 2 | Session NY',
    },
  })
}
