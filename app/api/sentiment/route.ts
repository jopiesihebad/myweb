import { NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  GET /api/sentiment
//  1. Fetch RSS from Indonesian financial news sources
//  2. Parse top 5 headlines
//  3. Score sentiment via Anthropic API
//  Cache: 30 min (news doesn't change that fast)
// ─────────────────────────────────────────────────────────────

type NewsItem = {
  title:       string
  source:      string
  url:         string
  pubDate:     string
  sentiment:   'BULLISH' | 'BEARISH' | 'NEUTRAL'
  score:       number   // -100 to +100
  impact:      string   // which tickers affected
  summary:     string
}

type SentimentResponse = {
  overallScore:   number        // -100 to +100
  overallLabel:   string        // BULLISH / BEARISH / NEUTRAL
  bullishPct:     number
  bearishPct:     number
  neutralPct:     number
  news:           NewsItem[]
  lastUpdated:    string
  source:         'live' | 'mock'
}

// RSS feeds — Indonesian financial news
const RSS_FEEDS = [
  { url: 'https://www.cnbcindonesia.com/rss',                 source: 'CNBC Indonesia' },
  { url: 'https://bisnis.com/feed',                           source: 'Bisnis.com'     },
  { url: 'https://www.kontan.co.id/rss/investasi',            source: 'Kontan'         },
]

async function fetchRSS(url: string, source: string): Promise<{ title: string; url: string; pubDate: string; source: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'StockIndexer/1.0 RSS Reader' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 1800 }, // 30min cache
    })
    if (!res.ok) return []
    const xml  = await res.text()
    const items: { title: string; url: string; pubDate: string; source: string }[] = []

    // Simple XML parse — grab <item> blocks
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const block   = match[1]
      const title   = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                   || block.match(/<title>(.*?)<\/title>/)?.[1]
                   || ''
      const link    = block.match(/<link>(.*?)<\/link>/)?.[1]
                   || block.match(/<guid>(.*?)<\/guid>/)?.[1]
                   || ''
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString()

      if (title && link) {
        items.push({ title: title.trim(), url: link.trim(), pubDate, source })
      }
      if (items.length >= 3) break
    }
    return items
  } catch {
    return []
  }
}

async function scoreWithAI(headlines: { title: string; source: string }[], apiKey: string): Promise<NewsItem[]> {
  const prompt = `Kamu adalah analis pasar saham Indonesia. Analisis headline berita berikut dan beri skor sentimen untuk pasar IDX dan crypto.

Headlines:
${headlines.map((h, i) => `${i + 1}. [${h.source}] ${h.title}`).join('\n')}

Untuk setiap headline, berikan dalam format JSON array:
[
  {
    "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
    "score": angka -100 sampai +100,
    "impact": "ticker/sektor yang terdampak, contoh: BBCA, IDX, BTC",
    "summary": "1 kalimat penjelasan dampak ke pasar"
  }
]

Hanya output JSON array, tidak ada teks lain.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error('AI API failed')
  const data = await res.json()
  const text = data.content?.[0]?.text ?? '[]'

  try {
    const scores = JSON.parse(text.replace(/```json|```/g, '').trim())
    return headlines.map((h, i) => ({
      title:     h.title,
      source:    h.source,
      url:       '',
      pubDate:   new Date().toISOString(),
      sentiment: scores[i]?.sentiment ?? 'NEUTRAL',
      score:     scores[i]?.score     ?? 0,
      impact:    scores[i]?.impact    ?? 'IDX',
      summary:   scores[i]?.summary   ?? '',
    }))
  } catch {
    return headlines.map(h => ({
      title: h.title, source: h.source, url: '', pubDate: new Date().toISOString(),
      sentiment: 'NEUTRAL' as const, score: 0, impact: 'IDX', summary: '',
    }))
  }
}

// Mock fallback when no API key
function mockSentiment(): SentimentResponse {
  return {
    overallScore: 24,
    overallLabel: 'BULLISH',
    bullishPct: 60,
    bearishPct: 20,
    neutralPct: 20,
    source: 'mock',
    lastUpdated: new Date().toISOString(),
    news: [
      { title: 'BI Rate Dipertahankan 5.75%, Pasar Menyambut Positif', source: 'CNBC Indonesia', url: '#', pubDate: new Date().toISOString(), sentiment: 'BULLISH', score: 65, impact: 'IHSG, BBCA, BBRI', summary: 'Kebijakan BI yang dovish mendukung sektor perbankan dan properti.' },
      { title: 'Harga Nikel Naik 3.2% di LME, ANTM Menguat', source: 'Bisnis.com', url: '#', pubDate: new Date().toISOString(), sentiment: 'BULLISH', score: 72, impact: 'ANTM, INCO', summary: 'Kenaikan harga nikel global berdampak positif langsung ke emiten pertambangan.' },
      { title: 'The Fed Sinyal Pemangkasan Suku Bunga Q2 2026', source: 'Kontan', url: '#', pubDate: new Date().toISOString(), sentiment: 'BULLISH', score: 58, impact: 'BTC, ETH, IHSG', summary: 'Ekspektasi rate cut mendorong risk-on di aset kripto dan pasar berkembang.' },
      { title: 'Rupiah Melemah ke Rp 16.450 per USD', source: 'CNBC Indonesia', url: '#', pubDate: new Date().toISOString(), sentiment: 'BEARISH', score: -45, impact: 'ASII, importir', summary: 'Pelemahan rupiah menekan emiten dengan utang USD dan bahan baku impor.' },
      { title: 'IHSG Konsolidasi di 6.800, Volume Rendah', source: 'Bisnis.com', url: '#', pubDate: new Date().toISOString(), sentiment: 'NEUTRAL', score: 5, impact: 'IHSG', summary: 'Pasar bergerak sideways menunggu katalis dari data ekonomi AS.' },
    ],
  }
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // Without API key, return mock
  if (!apiKey) {
    return NextResponse.json(mockSentiment(), {
      headers: { 'Cache-Control': 'public, max-age=1800' },
    })
  }

  try {
    // Fetch RSS from all sources concurrently
    const allFeeds = await Promise.allSettled(
      RSS_FEEDS.map(f => fetchRSS(f.url, f.source))
    )

    const rawHeadlines = allFeeds
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .slice(0, 5)

    if (rawHeadlines.length === 0) {
      return NextResponse.json(mockSentiment(), {
        headers: { 'Cache-Control': 'public, max-age=300' },
      })
    }

    // Score with AI
    const scoredNews = await scoreWithAI(
      rawHeadlines.map(h => ({ title: h.title, source: h.source })),
      apiKey
    )

    // Merge URLs back
    scoredNews.forEach((n, i) => { n.url = rawHeadlines[i]?.url ?? '#'; n.pubDate = rawHeadlines[i]?.pubDate ?? n.pubDate })

    // Calculate overall
    const avg = Math.round(scoredNews.reduce((s, n) => s + n.score, 0) / scoredNews.length)
    const bullishPct = Math.round(scoredNews.filter(n => n.score > 20).length / scoredNews.length * 100)
    const bearishPct = Math.round(scoredNews.filter(n => n.score < -20).length / scoredNews.length * 100)

    const result: SentimentResponse = {
      overallScore: avg,
      overallLabel: avg > 20 ? 'BULLISH' : avg < -20 ? 'BEARISH' : 'NEUTRAL',
      bullishPct,
      bearishPct,
      neutralPct: 100 - bullishPct - bearishPct,
      news: scoredNews,
      lastUpdated: new Date().toISOString(),
      source: 'live',
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=1800' },
    })

  } catch (err) {
    console.error('[sentiment] Error:', err)
    return NextResponse.json(mockSentiment(), {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  }
}
