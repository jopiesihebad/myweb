import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  GET /api/journal
//  Reads soul.md from private GitHub repo, parses [TRADE LOG]
//  markdown table, returns structured trades + summary.
//  Cache: 24h revalidation
//  Fallback: returns empty trades if GitHub unavailable
// ─────────────────────────────────────────────────────────────

type Tier = 'S' | 'A' | 'B' | 'C'

type Trade = {
  id:          string
  timestamp:   string
  ticker:      string
  alert_type:  string
  tier:        Tier
  entry:       number
  sl:          number
  tp:          number
  exit_price:  number | null
  exit_reason: string
  pnl_r:       number | null
  pnl_usd:     number | null
  session:     string
}

type Summary = {
  totalTrades:  number
  wins:         number
  losses:       number
  winRate:      number
  profitFactor: number
  totalPnlR:    number
  lastUpdated:  string
}

// Expected soul.md trade log table format:
// | timestamp | ticker | alert_type | tier | entry | sl | tp | exit_price | exit_reason | pnl_r | pnl_usd | session |
// | 2026-03-17T09:14:00Z | BTCUSDT | CONWAY_BUY | A | 84210 | 83000 | 86630 | 86500 | TP_HIT | 1.94 | 289 | LONDON |

function parseTradeLog(content: string): Trade[] {
  const trades: Trade[] = []

  // Find [TRADE LOG] section
  const logStart = content.indexOf('[TRADE LOG]')
  if (logStart === -1) return trades

  const logSection = content.slice(logStart)
  const lines = logSection.split('\n')

  let inTable = false
  let headerParsed = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Start of table
    if (trimmed.startsWith('|') && !inTable) {
      inTable = true
    }

    if (!inTable) continue

    // Skip header and separator rows
    if (!trimmed.startsWith('|')) break
    if (trimmed.replace(/[\|\s\-]/g, '') === '') continue

    if (!headerParsed) {
      headerParsed = true
      continue // skip header row
    }

    // Parse data row
    const cols = trimmed
      .split('|')
      .map(c => c.trim())
      .filter(c => c.length > 0)

    if (cols.length < 10) continue

    try {
      const pnl_r_raw   = parseFloat(cols[9])
      const pnl_usd_raw = parseFloat(cols[10])
      const exit_raw    = cols[7]

      trades.push({
        id:          `trade-${trades.length + 1}`,
        timestamp:   cols[0],
        ticker:      cols[1],
        alert_type:  cols[2],
        tier:        (cols[3] as Tier) || 'B',
        entry:       parseFloat(cols[4]) || 0,
        sl:          parseFloat(cols[5]) || 0,
        tp:          parseFloat(cols[6]) || 0,
        exit_price:  exit_raw === '—' || exit_raw === '' ? null : parseFloat(exit_raw),
        exit_reason: cols[8] || 'OPEN',
        pnl_r:       isNaN(pnl_r_raw)   ? null : pnl_r_raw,
        pnl_usd:     isNaN(pnl_usd_raw) ? null : pnl_usd_raw,
        session:     cols[11] || 'NY',
      })
    } catch {
      // Skip malformed rows
    }
  }

  return trades
}

function calcSummary(trades: Trade[]): Summary {
  const closed = trades.filter(t => t.pnl_r !== null)
  const wins   = closed.filter(t => t.pnl_r! > 0)
  const losses = closed.filter(t => t.pnl_r! < 0)

  const grossWin  = wins.reduce((s, t)   => s + t.pnl_r!, 0)
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl_r!), 0)

  return {
    totalTrades:  trades.length,
    wins:         wins.length,
    losses:       losses.length,
    winRate:      closed.length > 0 ? (wins.length / closed.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0,
    totalPnlR:    closed.reduce((s, t) => s + t.pnl_r!, 0),
    lastUpdated:  new Date().toISOString(),
  }
}

async function fetchSoulMd(): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN
  const repo  = process.env.GITHUB_REPO   // format: "username/repo-name"

  if (!token || !repo) return null

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/soul.md`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept:        'application/vnd.github.v3.raw',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 86400 }, // cache 24h
      }
    )

    if (!res.ok) {
      console.warn('[Journal] GitHub fetch failed:', res.status)
      return null
    }

    return await res.text()
  } catch (err) {
    console.warn('[Journal] GitHub fetch error:', err)
    return null
  }
}

export async function GET() {
  try {
    const soulMd = await fetchSoulMd()

    if (!soulMd) {
      // GitHub not configured or unavailable — return empty
      return NextResponse.json({
        trades:  [],
        summary: {
          totalTrades: 0, wins: 0, losses: 0,
          winRate: 0, profitFactor: 0, totalPnlR: 0,
          lastUpdated: new Date().toISOString(),
        },
        source: 'unavailable',
        note:   'Set GITHUB_TOKEN and GITHUB_REPO env vars to enable live trade log',
      }, {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=300' },
      })
    }

    const trades  = parseTradeLog(soulMd)
    const summary = calcSummary(trades)

    return NextResponse.json({
      trades,
      summary,
      source: 'github',
      count:  trades.length,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=86400' },
    })

  } catch (err) {
    console.error('[Journal] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
