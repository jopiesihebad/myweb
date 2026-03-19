import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  GET /api/indices
//  Fetch live macro indices from Yahoo Finance (free, no key)
//  Cache: 5 minutes
// ─────────────────────────────────────────────────────────────

const SYMBOLS = [
  { symbol: '^GSPC',  name: 'S&P 500',       display: 'SPX',    region: 'USA'    },
  { symbol: '^IXIC',  name: 'Nasdaq',         display: 'NDX',    region: 'USA'    },
  { symbol: 'DX-Y.NYB', name: 'Dollar Index', display: 'DXY',    region: 'GLOBAL' },
  { symbol: '^VIX',   name: 'Volatility',     display: 'VIX',    region: 'GLOBAL' },
  { symbol: '^JKSE',  name: 'IDX Composite',  display: 'IHSG',   region: 'IDX'    },
  { symbol: '^N225',  name: 'Nikkei 225',     display: 'N225',   region: 'ASIA'   },
  { symbol: '^GDAXI', name: 'DAX 40',         display: 'DAX',    region: 'EU'     },
  { symbol: '^HSI',   name: 'Hang Seng',      display: 'HSI',    region: 'ASIA'   },
]

type IndexResult = {
  symbol:    string
  name:      string
  value:     number
  change:    number
  changePct: number
  region:    string
}

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const encoded = encodeURIComponent(symbol)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2d`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockIndexer/1.0)',
        'Accept':     'application/json',
      },
      next: { revalidate: 300 }, // 5 min cache
    })

    if (!res.ok) return null

    const data = await res.json()
    const meta  = data?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price     = meta.regularMarketPrice      ?? meta.previousClose ?? 0
    const prevClose = meta.chartPreviousClose      ?? meta.previousClose ?? price
    const change    = price - prevClose
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0

    return {
      price:     Math.round(price     * 100) / 100,
      change:    Math.round(change    * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
    }
  } catch {
    return null
  }
}

export async function GET() {
  const results: IndexResult[] = []

  // Fetch all concurrently
  const quotes = await Promise.allSettled(
    SYMBOLS.map(s => fetchYahooQuote(s.symbol))
  )

  for (let i = 0; i < SYMBOLS.length; i++) {
    const s     = SYMBOLS[i]
    const quote = quotes[i].status === 'fulfilled' ? quotes[i].value : null

    results.push({
      symbol:    s.display,
      name:      s.name,
      value:     quote?.price     ?? 0,
      change:    quote?.change    ?? 0,
      changePct: quote?.changePct ?? 0,
      region:    s.region,
    })
  }

  // If all failed (network issue), return with flag
  const allFailed = results.every(r => r.value === 0)

  return NextResponse.json({
    indices: results,
    source:  allFailed ? 'unavailable' : 'yahoo_finance',
    lastUpdated: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  })
}
