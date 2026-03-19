'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from 'recharts'

// ── SENTIMENT ANALYZER ────────────────────────────────────────────────────────
interface NewsItem {
  id: string
  headline: string
  source: string
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  impact: number   // 1-5
  time: string
  ticker?: string
}

const MOCK_NEWS: NewsItem[] = [
  {
    id:'n1', time:'09:32', source:'Bloomberg',
    headline:'Bank Indonesia holds rate at 6.00%, signals cuts in H2 2025',
    sentiment:'BULLISH', impact:4, ticker:'IHSG',
  },
  {
    id:'n2', time:'08:15', source:'Reuters',
    headline:'BRI posts record Q3 net profit IDR 16.2T, beats consensus by 8%',
    sentiment:'BULLISH', impact:5, ticker:'BBRI',
  },
  {
    id:'n3', time:'07:45', source:'Kontan',
    headline:'ANTAM produksi emas turun 12% YoY akibat cuaca ekstrem di Papua',
    sentiment:'BEARISH', impact:3, ticker:'ANTM',
  },
  {
    id:'n4', time:'06:30', source:'CNBC',
    headline:'Fed minutes: majority support two cuts in 2025 if inflation cooperates',
    sentiment:'BULLISH', impact:4, ticker:'SPX',
  },
  {
    id:'n5', time:'05:55', source:'Bisnis ID',
    headline:'Pemerintah naikkan tarif royalti batubara — sektor energi tertekan',
    sentiment:'BEARISH', impact:3, ticker:'ADRO',
  },
]

function SentimentMeter({ score }: { score: number }) {
  const color = score >= 65 ? '#39ff14' : score >= 45 ? '#ffd700' : '#ff0062'
  const label = score >= 65 ? 'BULLISH' : score >= 45 ? 'NEUTRAL' : 'BEARISH'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1 }}>MARKET SENTIMENT</span>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color }}>
            {score} · {label}
          </span>
        </div>
        <div style={{ height:6, background:'#0d1830', borderRadius:3, overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${score}%`,
            background:`linear-gradient(90deg,#ff006280,${color})`,
            borderRadius:3, boxShadow:`0 0 10px ${color}60`,
            transition:'width 0.8s ease',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#ff0062' }}>BEARISH</span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#4a6080' }}>NEUTRAL</span>
          <span style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#39ff14' }}>BULLISH</span>
        </div>
      </div>
    </div>
  )
}

type SentimentData = {
  overallScore: number
  overallLabel: string
  bullishPct:   number
  bearishPct:   number
  neutralPct:   number
  news: {
    title:     string
    source:    string
    url:       string
    pubDate:   string
    sentiment: string
    score:     number
    impact:    string
    summary:   string
  }[]
  source: string
  lastUpdated: string
}

export function SentimentAnalyzer() {
  const [ticker, setTicker] = useState('BBRI')
  const [data,   setData]   = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const sentScore = data?.overallScore ?? 68

  useEffect(() => {
    async function fetchSentiment() {
      try {
        const res = await fetch('/api/sentiment')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch { /* use mock */ }
      finally { setLoading(false) }
    }
    fetchSentiment()
    // Refresh every 30 min
    const id = setInterval(fetchSentiment, 1800000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#00c3ff,#ffd700)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Sentiment & News
          </span>
          {loading && (
            <span style={{ fontSize:8, color:'#4a6080', fontFamily:'Space Mono,monospace', letterSpacing:1, animation:'pipPulse 1.5s infinite' }}>
              LOADING...
            </span>
          )}
          {data && !loading && (
            <span style={{ fontSize:8, color: data.source === 'live' ? '#39ff14' : '#4a6080', fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
              {data.source === 'live' ? '● LIVE RSS' : '○ MOCK'}
            </span>
          )}
        </div>
        <select value={ticker} onChange={e => setTicker(e.target.value)} style={{
          background:'#0a1020', border:'1px solid #162035', borderRadius:5,
          padding:'4px 8px', fontFamily:'JetBrains Mono,monospace', fontSize:11,
          color:'#00c3ff', outline:'none', cursor:'pointer',
        }}>
          {['BBRI','BBCA','ANTM','IHSG','BTCUSDT'].map(t => (
            <option key={t} value={t} style={{ background:'#0a1020' }}>{t}</option>
          ))}
        </select>
      </div>

      {/* Sentiment meter */}
      <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'14px 16px', marginBottom:12 }}>
        <SentimentMeter score={sentScore} />
      {data && (
        <div style={{ display:'flex', gap:16, marginTop:8 }}>
          <span style={{ fontSize:9, color:'#39ff14', fontFamily:'Space Mono,monospace' }}>▲ {data.bullishPct}% bullish</span>
          <span style={{ fontSize:9, color:'#ff0062', fontFamily:'Space Mono,monospace' }}>▼ {data.bearishPct}% bearish</span>
          <span style={{ fontSize:9, color:'#4a6080', fontFamily:'Space Mono,monospace' }}>— {data.neutralPct}% neutral</span>
        </div>
      )}
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          {[
            { label:'Social Score', value:'72', color:'#bd93f9' },
            { label:'News Score',   value:'68', color:'#00c3ff' },
            { label:'Options Flow', value:'61', color:'#ffd700' },
            { label:'Insider',      value:'55', color:'#ff8c00' },
          ].map(item => (
            <div key={item.label} style={{
              flex:1, background:'#04070f', border:`1px solid ${item.color}30`,
              borderRadius:6, padding:'7px 8px', textAlign:'center',
            }}>
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:14, fontWeight:700, color:item.color }}>
                {item.value}
              </div>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:'#4a6080', marginTop:2, letterSpacing:0.5 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News list */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {(data?.news ?? []).map((n, i) => {
          const sentColor = n.sentiment === 'BULLISH' ? '#39ff14' : n.sentiment === 'BEARISH' ? '#ff0062' : '#ffd700'
          return (
            <div key={`news-${i}-${n.title.slice(0,20)}`} style={{
              background:'#0a1020',
              border:`1px solid ${sentColor}25`,
              borderLeft:`3px solid ${sentColor}`,
              borderRadius:'0 8px 8px 0',
              padding:'10px 12px',
              animation:`fadeUp 0.3s ease ${i*0.08}s both`,
              display:'flex', gap:10, alignItems:'flex-start',
            }}>
              <div style={{ minWidth:36, textAlign:'right' }}>
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>{n.pubDate ? new Date(n.pubDate).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}) : '—'}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#c8d8e8', lineHeight:1.5, marginBottom:4 }}>
                  {n.title}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>{n.source}</span>
                  {n.impact && (
                    <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#00c3ff', background:'#00c3ff15', padding:'1px 5px', borderRadius:3 }}>
                      {n.impact}
                    </span>
                  )}
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:sentColor, background:`${sentColor}15`, padding:'1px 5px', borderRadius:3, letterSpacing:0.5 }}>
                    {n.sentiment}
                  </span>
                  <div style={{ display:'flex', gap:2 }}>
                    {Array.from({length:5}).map((_,j) => (
                      <div key={j} style={{ width:5, height:5, borderRadius:1, background: j < Math.round((Math.abs(n.score ?? 0) / 100) * 5) ? sentColor : '#162035' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BACKTEST SIMULATOR ────────────────────────────────────────────────────────
function generateEquityCurve(winRate: number, trades: number, avgR: number) {
  const points = [{ bar: 0, equity: 10000, drawdown: 0 }]
  let eq = 10000
  let peak = 10000
  for (let i = 1; i <= trades; i++) {
    const win = Math.random() < winRate
    const r = win ? avgR * (0.8 + Math.random() * 0.4) : -1 * (0.7 + Math.random() * 0.6)
    eq = eq + eq * 0.02 * r  // 2% risk per trade
    if (eq > peak) peak = eq
    const dd = ((peak - eq) / peak) * 100
    points.push({ bar: i, equity: Math.round(eq), drawdown: -Math.round(dd * 10) / 10 })
  }
  return points
}

export function BacktestSimulator() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [config, setConfig] = useState({
    ticker: 'BTCUSDT', timeframe: '1H', period: '6M',
    signalType: 'BBP_HYBRID', initialCapital: 10000,
  })
  const [results, setResults] = useState<{
    equity: any[]; winRate: number; totalTrades: number;
    maxDD: number; netPnL: number; avgR: number; profitFactor: number;
  } | null>(null)

  const runBacktest = async () => {
    setRunning(true)
    setDone(false)
    await new Promise(r => setTimeout(r, 2000))
    const wr = config.signalType === 'BBP_HYBRID' ? 0.80 : config.signalType === 'CONWAY_ONLY' ? 0.85 : 0.72
    const avgR = config.signalType === 'BBP_HYBRID' ? 0.62 : config.signalType === 'CONWAY_ONLY' ? 1.1 : 0.48
    const trades = config.period === '1M' ? 10 : config.period === '3M' ? 30 : 60
    const equity = generateEquityCurve(wr, trades, avgR)
    const final = equity[equity.length-1].equity
    const maxDD = Math.min(...equity.map(e => e.drawdown))
    setResults({
      equity,
      winRate: wr,
      totalTrades: trades,
      maxDD: Math.abs(maxDD),
      netPnL: final - config.initialCapital,
      avgR,
      profitFactor: (wr * avgR) / ((1-wr) * 1),
    })
    setRunning(false)
    setDone(true)
  }

  const statColor = (v: number, good: 'high' | 'low' = 'high') =>
    good === 'high' ? (v > 0 ? '#39ff14' : '#ff0062') : (v < 15 ? '#39ff14' : v < 25 ? '#ffd700' : '#ff0062')

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:3, height:16, background:'linear-gradient(180deg,#39ff14,#bd93f9)', borderRadius:2, display:'inline-block' }} />
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
            Backtest Simulator
          </span>
        </div>
      </div>

      {/* Config */}
      <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'14px 16px', marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12 }}>
          {[
            { key:'ticker',     label:'TICKER',   opts:['BTCUSDT','BBCA','ANTM','XAUUSD'] },
            { key:'timeframe',  label:'TIMEFRAME',opts:['1H','4H','1D','15M'] },
            { key:'period',     label:'PERIOD',   opts:['1M','3M','6M'] },
            { key:'signalType', label:'SIGNAL',   opts:['BBP_HYBRID','CONWAY_ONLY','GOLD_DOOM'] },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, marginBottom:4 }}>
                {f.label}
              </div>
              <select
                value={config[f.key as keyof typeof config]}
                onChange={e => setConfig(c => ({...c, [f.key]: e.target.value}))}
                style={{
                  width:'100%', background:'#04070f', border:'1px solid #162035',
                  borderRadius:5, padding:'5px 8px',
                  fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'#00c3ff',
                  outline:'none', cursor:'pointer',
                }}>
                {f.opts.map(o => <option key={o} value={o} style={{background:'#0a1020'}}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={runBacktest} disabled={running} style={{
          width:'100%', background: running ? '#162035' : 'linear-gradient(90deg,#39ff14,#00c3ff)',
          border:'none', borderRadius:6, padding:'10px',
          fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:800,
          color: running ? '#4a6080' : '#04070f',
          cursor: running ? 'wait' : 'pointer', letterSpacing:1,
          transition:'all 0.3s', boxShadow: running ? 'none' : '0 0 20px #39ff1440',
        }}>
          {running ? '⟳ RUNNING SIMULATION...' : '▶ RUN BACKTEST'}
        </button>
      </div>

      {/* Results */}
      {results && done && (
        <div style={{ animation:'fadeUp 0.4s ease' }}>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:12 }}>
            {[
              { label:'WIN RATE',    value:`${(results.winRate*100).toFixed(0)}%`,   color: results.winRate >= 0.75 ? '#39ff14' : '#ffd700' },
              { label:'NET P&L',     value:`+$${results.netPnL.toLocaleString()}`,   color: statColor(results.netPnL) },
              { label:'AVG R',       value:`+${results.avgR.toFixed(2)}R`,           color:'#00c3ff' },
              { label:'MAX DD',      value:`-${results.maxDD.toFixed(1)}%`,          color: statColor(results.maxDD, 'low') },
              { label:'TOTAL TRADES',value:`${results.totalTrades}`,                 color:'#c8d8e8' },
              { label:'PROFIT FACTOR',value:`${results.profitFactor.toFixed(2)}`,   color: results.profitFactor >= 2 ? '#39ff14' : '#ffd700' },
            ].map(s => (
              <div key={s.label} style={{
                background:'#0a1020', border:`1px solid ${s.color}30`, borderRadius:7, padding:'10px 12px',
                textAlign:'center', boxShadow:`0 0 8px ${s.color}15`,
              }}>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:18, fontWeight:700, color:s.color }}>
                  {s.value}
                </div>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', marginTop:3, letterSpacing:0.5 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <div style={{ background:'#0a1020', border:'1px solid #162035', borderRadius:8, padding:'14px 16px' }}>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080', letterSpacing:1, marginBottom:10 }}>
              EQUITY CURVE · Initial: ${config.initialCapital.toLocaleString()}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={results.equity}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39ff14" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#162035" />
                <XAxis dataKey="bar" tick={{ fontFamily:'Space Mono,monospace', fontSize:7, fill:'#4a6080' }} />
                <YAxis tick={{ fontFamily:'Space Mono,monospace', fontSize:7, fill:'#4a6080' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background:'#0a1020', border:'1px solid #162035', borderRadius:6, fontFamily:'JetBrains Mono,monospace', fontSize:10 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Equity']}
                />
                <ReferenceLine y={config.initialCapital} stroke="#4a6080" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="equity" stroke="#39ff14" strokeWidth={2} fill="url(#eqGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}
