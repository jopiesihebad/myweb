import { NextRequest, NextResponse } from 'next/server'

/* ─── Valid alert types — SS BlackBox v6.3.1 (19 utama) ─── */
const VALID_ALERT_TYPES = new Set([
  'GOLD_BUY', 'DOOM_SELL', 'CONWAY_BUY', 'CONWAY_SELL',
  'CONWAY_BORN', 'CONWAY_DIED', 'PM_BUY', 'PM_SELL',
  'BULLISH_LIQ_GRAB', 'BEARISH_LIQ_GRAB', 'BREAKOUT', 'SQZ_RELEASED',
  'PREDATOR_HFT', 'ALPHA_EXIT', 'DIVERGENCE_RISK', 'HIGH_CONFLUENCE',
  'CHoCH_BULL', 'CHoCH_BEAR', 'BOS_BULL', 'BOS_BEAR',
  'OB_TOUCH_BULL', 'OB_TOUCH_BEAR', 'BBP_ENTRY_BUY', 'BBP_ENTRY_SELL',
  'LH_EXIT'
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validasi minimal
    if (!body || !body.ticker || !body.alert_type || !VALID_ALERT_TYPES.has(body.alert_type)) {
      return NextResponse.json({ error: 'Invalid payload or alert type' }, { status: 400 });
    }

    // Log untuk debug (lihat di Vercel logs)
    console.log('Webhook received:', body);

    // Nanti tambah broadcast ke WS server kalau lo punya
    // contoh: global.wsServer?.broadcast(body);

    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
