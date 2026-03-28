import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  POST /api/webhook
//  Unified signal receiver untuk:
//    - SS BlackBox v6.4 LONG script  → direction: "LONG"
//    - SS BlackBox SHORT v1.0        → direction: "SHORT"
//
//  TradingView Alert Setup:
//    LONG  script → Webhook URL: https://stockindexer.com/api/webhook
//    SHORT script → Webhook URL: https://stockindexer.com/api/webhook
//    Header: x-webhook-secret: <WEBHOOK_SECRET>
//
//  Flow:
//    TradingView → POST /api/webhook → validate → broadcast WS
//                                               → forward pieBot
// ─────────────────────────────────────────────────────────────

type Direction = 'LONG' | 'SHORT'
type Tier      = 'S' | 'A' | 'B' | 'C' | 'SKIP'
type Session   = 'NY' | 'LONDON' | 'ASIA' | 'OFF'
type Category  = 'ENTRY' | 'EXIT' | 'INFO'

type SignalPayload = {
  alert_type:    string
  direction:     Direction
  ticker:        string
  close:         number
  cells:         number
  cells_arr:     number[]
  fusion:        number
  grade:         number
  tier:          Tier
  session:       Session
  atr:           number
  sl_price:      number
  tp_price:      number
  squeeze_risk?: boolean
  timestamp:     string
  message:       string
}

type AlertMeta = {
  label:     string
  color:     string
  category:  Category
  direction: Direction | 'BOTH'
  desc:      string
}

const ALERT_META: Record<string, AlertMeta> = {
  // ── LONG ENTRY ──────────────────────────────────────────────
  GOLD_BUY:               { label:'⚡ GOLD BUY',            color:'#ffd700', category:'ENTRY', direction:'LONG',  desc:'PM cross + VWAP + RSI' },
  CONWAY_BUY:             { label:'⚡ CONWAY BUY',          color:'#39ff14', category:'ENTRY', direction:'LONG',  desc:'Conway ALIVE ≥5 + conf_buy — Tier A' },
  CONWAY_BORN:            { label:'🟢 CONWAY BORN',         color:'#39ff14', category:'ENTRY', direction:'LONG',  desc:'Conway just ALIVE + conf_buy — Tier S' },
  PM_BUY:                 { label:'PM BUY',                 color:'#00c3ff', category:'ENTRY', direction:'LONG',  desc:'PM crossover entry' },
  BBP_ENTRY_BUY:          { label:'BBP ENTRY BUY',          color:'#39ff14', category:'ENTRY', direction:'LONG',  desc:'BBP crossover — Tier B/C' },
  // ── LONG EXIT ───────────────────────────────────────────────
  LH_EXIT:                { label:'⚠ LH EXIT',             color:'#bd93f9', category:'EXIT',  direction:'LONG',  desc:'Lower High + Conway weakening' },
  CONWAY_DIED:            { label:'🔴 CONWAY DIED',         color:'#ff0062', category:'EXIT',  direction:'LONG',  desc:'Conway dropped — exit long' },
  ALPHA_EXIT:             { label:'⚠ ALPHA EXIT',           color:'#ff8c00', category:'EXIT',  direction:'LONG',  desc:'Vol drop + neg price-vol corr' },
  // ── SHORT ENTRY ─────────────────────────────────────────────
  DOOM_SELL:              { label:'⚡ DOOM SELL',           color:'#ff0062', category:'ENTRY', direction:'SHORT', desc:'PM cross + VWAP + RSI — short entry' },
  CONWAY_SELL:            { label:'⚡ CONWAY SELL',         color:'#ff0062', category:'ENTRY', direction:'SHORT', desc:'Conway ALIVE ≥3 + conf_sell — Tier A' },
  CONWAY_BORN_SHORT:      { label:'🔴 CONWAY BORN SHORT',  color:'#ff0062', category:'ENTRY', direction:'SHORT', desc:'Bearish Conway ALIVE — Tier S' },
  FLIP_SHORT_D1C:         { label:'🔄 FLIP SHORT D1C',     color:'#ff44cc', category:'ENTRY', direction:'SHORT', desc:'LH + BBP SELL2 confirm — close long, open short' },
  BBP_ENTRY_SELL:         { label:'BBP ENTRY SELL',         color:'#ff0062', category:'ENTRY', direction:'SHORT', desc:'BBP crossunder short — Tier B/C' },
  // ── SHORT EXIT ──────────────────────────────────────────────
  HL_EXIT_SHORT:          { label:'⚠ HL EXIT SHORT',       color:'#39ff14', category:'EXIT',  direction:'SHORT', desc:'Higher Low formed — exit short' },
  BBP_COVER_SHORT:        { label:'BBP COVER SHORT',        color:'#39ff14', category:'EXIT',  direction:'SHORT', desc:'BBP crossover fallback — cover short' },
  CONWAY_DIED_SHORT:      { label:'🟢 CONWAY DIED SHORT',  color:'#39ff14', category:'EXIT',  direction:'SHORT', desc:'Bearish Conway died — exit short' },
  SQUEEZE_WARNING:        { label:'⚠️ SQUEEZE WARNING',    color:'#ffd700', category:'EXIT',  direction:'SHORT', desc:'OFI spike — squeeze risk, consider cover' },
  // ── INFO BOTH ───────────────────────────────────────────────
  BULLISH_LIQ_GRAB:       { label:'💧 LIQ GRAB BULL',      color:'#39ff14', category:'INFO',  direction:'BOTH',  desc:'Wick below support swept' },
  BEARISH_LIQ_GRAB:       { label:'💧 LIQ GRAB BEAR',      color:'#ff0062', category:'INFO',  direction:'BOTH',  desc:'Wick above resistance swept' },
  BREAKOUT:               { label:'🚀 BREAKOUT',            color:'#00c3ff', category:'INFO',  direction:'LONG',  desc:'Price breaks resistance with volume' },
  BREAKDOWN:              { label:'📉 BREAKDOWN',           color:'#ff0062', category:'INFO',  direction:'SHORT', desc:'Price breaks support with volume' },
  SQZ_RELEASED:           { label:'⊕ SQZ RELEASED',        color:'#bd93f9', category:'INFO',  direction:'BOTH',  desc:'Volatility expanding' },
  PREDATOR_HFT:           { label:'🦈 PREDATOR HFT',       color:'#ff8c00', category:'INFO',  direction:'BOTH',  desc:'HFT volume anomaly' },
  DIVERGENCE_RISK:        { label:'⚠ DIVERGENCE RISK',    color:'#ff8c00', category:'INFO',  direction:'LONG',  desc:'RSI diverging from price' },
  BEARISH_DIV_SHORT:      { label:'📉 BEARISH DIV',        color:'#ff0062', category:'INFO',  direction:'SHORT', desc:'Price HH + RSI LH — short confirm' },
  BULLISH_DIV_EXIT_SHORT: { label:'📈 BULLISH DIV EXIT',   color:'#39ff14', category:'INFO',  direction:'SHORT', desc:'Price LL + RSI HL — exit short warning' },
  HIGH_CONFLUENCE:        { label:'★ HIGH CONFLUENCE',     color:'#ffd700', category:'INFO',  direction:'LONG',  desc:'Fusion ≥18/23 Grade 1-2' },
  HIGH_CONFLUENCE_SHORT:  { label:'★ HIGH CONF SHORT',     color:'#ff0062', category:'INFO',  direction:'SHORT', desc:'Short fusion ≥17/21 Grade 1-2' },
  CHoCH_BULL:             { label:'CHoCH BULL',             color:'#39ff14', category:'INFO',  direction:'LONG',  desc:'Change of Character bullish' },
  CHoCH_BEAR:             { label:'CHoCH BEAR',             color:'#ff0062', category:'INFO',  direction:'BOTH',  desc:'Change of Character bearish' },
  CHoCH_BULL_EXIT_SHORT:  { label:'CHoCH BULL EXIT',        color:'#39ff14', category:'INFO',  direction:'SHORT', desc:'Bullish CHoCH — exit short warning' },
  BOS_BULL:               { label:'BOS BULL',               color:'#39ff14', category:'INFO',  direction:'LONG',  desc:'Break of Structure bullish' },
  BOS_BEAR:               { label:'BOS BEAR',               color:'#ff0062', category:'INFO',  direction:'BOTH',  desc:'Break of Structure bearish' },
  BOS_BULL_EXIT_SHORT:    { label:'BOS BULL EXIT',          color:'#39ff14', category:'INFO',  direction:'SHORT', desc:'Bullish BOS — exit short warning' },
  OB_TOUCH_BULL:          { label:'OB TOUCH BULL',          color:'#00c3ff', category:'INFO',  direction:'LONG',  desc:'Bullish order block touch' },
  OB_TOUCH_BEAR:          { label:'OB TOUCH BEAR',          color:'#ff0062', category:'INFO',  direction:'BOTH',  desc:'Bearish order block touch' },
  OB_TOUCH_BULL_EXIT:     { label:'OB BULL EXIT SHORT',     color:'#39ff14', category:'INFO',  direction:'SHORT', desc:'Bullish OB — exit short warning' },
  ALPHA_SHORT:            { label:'⚡ ALPHA SHORT',         color:'#ff0062', category:'INFO',  direction:'SHORT', desc:'Price below EMA20 + vol divergence' },
  PM_SELL:                { label:'PM SELL',                color:'#ff8c00', category:'INFO',  direction:'BOTH',  desc:'PM crossunder context' },
  LONDON_OPEN:            { label:'🇬🇧 LONDON OPEN',         color:'#39ff14', category:'INFO',  direction:'BOTH',  desc:'London session started' },
  NEW_YORK_OPEN:          { label:'🗽 NEW YORK OPEN',        color:'#00c3ff', category:'INFO',  direction:'BOTH',  desc:'New York session started' },
  BBP_CROSSOVER:          { label:'BBP CROSSOVER',          color:'#39ff14', category:'INFO',  direction:'LONG',  desc:'Raw BBP crossover' },
  BBP_CROSSUNDER:         { label:'BBP CROSSUNDER',         color:'#ff0062', category:'INFO',  direction:'LONG',  desc:'Raw BBP crossunder' },
  BBP_CROSSUNDER_SHORT:   { label:'BBP CROSSUNDER SHORT',   color:'#ff0062', category:'INFO',  direction:'SHORT', desc:'BBP crossunder from SHORT script' },
  BBP_CROSSOVER_COVER:    { label:'BBP CROSSOVER COVER',    color:'#39ff14', category:'INFO',  direction:'SHORT', desc:'BBP crossover — potential cover' },
}

const LONG_ENTRY_TYPES  = new Set(['GOLD_BUY','CONWAY_BUY','CONWAY_BORN','PM_BUY','BBP_ENTRY_BUY'])
const SHORT_ENTRY_TYPES = new Set(['DOOM_SELL','CONWAY_SELL','CONWAY_BORN_SHORT','FLIP_SHORT_D1C','BBP_ENTRY_SELL'])
const LONG_EXIT_TYPES   = new Set(['LH_EXIT','CONWAY_DIED','ALPHA_EXIT'])
const SHORT_EXIT_TYPES  = new Set(['HL_EXIT_SHORT','BBP_COVER_SHORT','CONWAY_DIED_SHORT','SQUEEZE_WARNING'])

// ─── Infer direction (LONG script tidak kirim field direction) ─
function inferDirection(b: Record<string, unknown>): Direction {
  if (b.direction === 'SHORT') return 'SHORT'
  return 'LONG'
}

// ─── Validate ─────────────────────────────────────────────────
function validatePayload(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object')
    return { valid: false, error: 'Payload must be a JSON object' }
  const b = body as Record<string, unknown>
  if (typeof b.alert_type !== 'string' || !b.alert_type)
    return { valid: false, error: 'alert_type is required' }
  if (typeof b.ticker !== 'string' || !b.ticker)
    return { valid: false, error: 'ticker is required' }
  if (typeof b.close !== 'number' || b.close <= 0)
    return { valid: false, error: 'close must be > 0' }
  if (typeof b.cells !== 'number' || b.cells < 0 || b.cells > 8)
    return { valid: false, error: 'cells must be 0-8' }
  if (!Array.isArray(b.cells_arr) || (b.cells_arr as unknown[]).length !== 8)
    return { valid: false, error: 'cells_arr must be 8-element array' }
  if (typeof b.fusion !== 'number' || b.fusion < 0)
    return { valid: false, error: 'fusion must be >= 0' }
  if (typeof b.grade !== 'number' || b.grade < 1 || b.grade > 5)
    return { valid: false, error: 'grade must be 1-5' }
  if (typeof b.tier !== 'string' || !['S','A','B','C','SKIP'].includes(b.tier))
    return { valid: false, error: 'tier must be S|A|B|C|SKIP' }
  if (typeof b.session !== 'string' || !['NY','LONDON','ASIA','OFF'].includes(b.session))
    return { valid: false, error: 'session must be NY|LONDON|ASIA|OFF' }
  if (typeof b.atr !== 'number' || b.atr < 0)
    return { valid: false, error: 'atr must be >= 0' }
  if (typeof b.sl_price !== 'number' || b.sl_price < 0)
    return { valid: false, error: 'sl_price must be >= 0' }
  if (typeof b.tp_price !== 'number' || b.tp_price < 0)
    return { valid: false, error: 'tp_price must be >= 0' }
  if (typeof b.timestamp !== 'string' || !b.timestamp)
    return { valid: false, error: 'timestamp is required' }
  if (typeof b.message !== 'string' || !b.message)
    return { valid: false, error: 'message is required' }
  // Entry signals butuh sl/tp/atr > 0
  const dir   = inferDirection(b)
  const alert = b.alert_type as string
  const isEntry = dir === 'LONG' ? LONG_ENTRY_TYPES.has(alert) : SHORT_ENTRY_TYPES.has(alert)
  if (isEntry) {
    if ((b.atr as number) <= 0)      return { valid: false, error: `ENTRY ${alert} requires atr > 0` }
    if ((b.sl_price as number) <= 0) return { valid: false, error: `ENTRY ${alert} requires sl_price > 0` }
    if ((b.tp_price as number) <= 0) return { valid: false, error: `ENTRY ${alert} requires tp_price > 0` }
  }
  return { valid: true }
}

// ─── WebSocket broadcast ──────────────────────────────────────
declare global { var __wsClients: Set<(p: SignalPayload) => void> | undefined }
if (!global.__wsClients) global.__wsClients = new Set()
export function registerWsClient(cb: (p: SignalPayload) => void) {
  global.__wsClients!.add(cb)
  return () => global.__wsClients!.delete(cb)
}
function broadcastToClients(payload: SignalPayload) {
  global.__wsClients?.forEach(cb => { try { cb(payload) } catch {} })
}

// ─── Forward ke pieBot ────────────────────────────────────────
async function forwardToPieBot(payload: SignalPayload): Promise<void> {
  const url    = process.env.PIEBOT_WEBHOOK_URL
  const secret = process.env.WEBHOOK_SECRET
  if (!url) return
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'x-webhook-secret': secret ?? '',
        'x-signal-dir':     payload.direction,
      },
      body:   JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) console.warn('[Webhook] pieBot forward failed:', res.status)
  } catch (err) {
    console.warn('[Webhook] pieBot forward error (non-fatal):', err)
  }
}

// ─── POST /api/webhook ────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth: cek header ATAU query param ?secret=xxx
    // TradingView tidak support custom header → pakai query param di Webhook URL
    const headerSecret = req.headers.get('x-webhook-secret')
    const querySecret  = req.nextUrl.searchParams.get('secret')
    const secret       = headerSecret ?? querySecret
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    if (!body || typeof body !== 'object')
      return NextResponse.json({ error: 'Payload must be JSON object' }, { status: 400 })

    const b = body as Record<string, unknown>
    if (!b.ticker || !b.alert_type)
      return NextResponse.json({ error: 'ticker and alert_type are required' }, { status: 400 })

    const { valid, error } = validatePayload(body)
    if (!valid) return NextResponse.json({ error }, { status: 422 })

    const direction = inferDirection(b)
    const payload: SignalPayload = { ...(b as unknown as SignalPayload), direction }

    const alertStr = payload.alert_type
    const meta     = ALERT_META[alertStr] ?? { label: alertStr, color:'#fff', category:'INFO' as Category, direction, desc:'' }
    const isEntry  = direction === 'LONG' ? LONG_ENTRY_TYPES.has(alertStr) : SHORT_ENTRY_TYPES.has(alertStr)
    const isExit   = direction === 'LONG' ? LONG_EXIT_TYPES.has(alertStr)  : SHORT_EXIT_TYPES.has(alertStr)
    const category: Category = isEntry ? 'ENTRY' : isExit ? 'EXIT' : 'INFO'

    console.log(`[Webhook] ${direction} ${category}:`, {
      alert: alertStr, tier: payload.tier, ticker: payload.ticker,
      close: payload.close, cells: `${payload.cells}/8`,
      fusion: payload.fusion, session: payload.session,
      sl: isEntry ? payload.sl_price : 'n/a',
      tp: isEntry ? payload.tp_price : 'n/a',
      squeeze: payload.squeeze_risk ?? 'n/a',
    })

    broadcastToClients(payload)
    forwardToPieBot(payload)

    return NextResponse.json({
      ok: true, direction, alert: alertStr, label: meta.label,
      category, tier: payload.tier, ticker: payload.ticker,
      fusion: payload.fusion, cells: payload.cells, ts: payload.timestamp,
    }, { status: 200 })

  } catch (err) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── GET /api/webhook — health + setup guide ─────────────────
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status:  'online',
    version: 'unified v2.0 — LONG + SHORT',
    endpoint: 'POST https://stockindexer.com/api/webhook',

    tradingview_setup: {
      note: 'Pakai 1 URL yang sama untuk LONG dan SHORT script',
      webhook_url: 'https://stockindexer.com/api/webhook',
      webhook_url_format: 'https://stockindexer.com/api/webhook?secret=<WEBHOOK_SECRET>',
      note_header: 'TradingView tidak support custom header — gunakan query param ?secret= di URL',
      tradingview_whitelist_ips: ['52.89.214.238','34.212.75.30','54.218.53.128','52.32.178.7'],
      long_script: {
        name: 'SS BlackBox v6.4 — CONWAY AUTOMATON',
        condition: 'alert() function calls',
        note: 'LONG script tidak kirim direction field — auto set ke LONG',
      },
      short_script: {
        name: 'SS BlackBox SHORT v1.0 — CONWAY AUTOMATON',
        condition: 'alert() function calls',
        note: 'SHORT script selalu kirim direction:"SHORT"',
      },
    },

    piebot_routing: {
      header: 'x-signal-dir: LONG | SHORT',
      field:  'payload.direction: "LONG" | "SHORT"',
      long_entry:  [...LONG_ENTRY_TYPES],
      long_exit:   [...LONG_EXIT_TYPES],
      short_entry: [...SHORT_ENTRY_TYPES],
      short_exit:  [...SHORT_EXIT_TYPES],
    },

    example_long_entry: {
      alert_type:'CONWAY_BUY', direction:'LONG', ticker:'BTCUSDT', close:91234.56,
      cells:6, cells_arr:[1,1,1,1,0,1,1,0], fusion:19, grade:2, tier:'A',
      session:'LONDON', atr:820.50, sl_price:90412.00, tp_price:93500.00,
      timestamp:'2026-03-25T10:00:00Z',
      message:'CONWAY_BUY on BTCUSDT | Fusion:19/23 | Conway:6/8 | Session:LONDON',
    },
    example_short_entry: {
      alert_type:'DOOM_SELL', direction:'SHORT', ticker:'BTCUSDT', close:71234.56,
      cells:4, cells_arr:[0,0,1,1,0,1,1,0], fusion:13, grade:2, tier:'A',
      session:'NY', atr:720.50, sl_price:72800.00, tp_price:69000.00,
      squeeze_risk:false, timestamp:'2026-03-25T14:00:00Z',
      message:'DOOM_SELL SHORT on BTCUSDT | Fusion:13/21 | Conway:4/8 | Session:NY',
    },
    example_flip: {
      alert_type:'FLIP_SHORT_D1C', direction:'SHORT', ticker:'BTCUSDT', close:71000.00,
      cells:4, cells_arr:[0,0,1,1,0,1,1,0], fusion:12, grade:3, tier:'A',
      session:'LONDON', atr:700.00, sl_price:72500.00, tp_price:68500.00,
      squeeze_risk:false, timestamp:'2026-03-25T09:00:00Z',
      message:'FLIP_SHORT_D1C SHORT on BTCUSDT | Fusion:12/21 | Conway:4/8 | Session:LONDON',
    },
  })
}
