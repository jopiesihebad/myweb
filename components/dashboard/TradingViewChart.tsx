'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useWS, type SignalPayload } from './WebSocketProvider'

declare global {
  interface Window { LightweightCharts: any }
}

const TIMEFRAMES = [
  { label:'5m',  value:'5',   minutes:5  },
  { label:'15m', value:'15',  minutes:15 },
  { label:'1H',  value:'60',  minutes:60 },
  { label:'4H',  value:'240', minutes:240},
]

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// Generate mock OHLCV data
function generateCandles(ticker: string, minutes: number, count = 200): CandleData[] {
  const seed = ticker.split('').reduce((s,c) => s + c.charCodeAt(0), 0)
  const basePrice = ticker.startsWith('BTC') ? 83000 : ticker.includes('XAU') ? 2340 : ticker.includes('JK') ? 8500 : 1.08
  const volatility = ticker.startsWith('BTC') ? 0.008 : ticker.includes('XAU') ? 0.003 : 0.002

  const candles: CandleData[] = []
  let price = basePrice
  const now = Math.floor(Date.now() / 1000)
  const interval = minutes * 60

  for (let i = count; i >= 0; i--) {
    const t = now - i * interval
    const o = price
    const rand = (Math.random() - 0.5) * 2
    const h = o + Math.abs(rand * price * volatility * 0.7)
    const l = o - Math.abs(rand * price * volatility * 0.7)
    const c = o + rand * price * volatility
    price = c
    candles.push({ time: t, open: o, high: h, low: l, close: c })
  }
  return candles
}

const SIG_COLORS: Record<string, string> = {
  GOLD_BUY:'#ffd700', DOOM_SELL:'#ff0062', CONWAY_BUY:'#00c3ff',
  CONWAY_SELL:'#ff44cc', CONWAY_BORN:'#39ff14', CONWAY_DIED:'#ff0062',
  BBP_ENTRY_BUY:'#39ff14', BBP_ENTRY_SELL:'#ff8c00',
  LH_EXIT:'#ff8c00', BBP_FALLBACK_EXIT:'#ff0062', ALPHA_EXIT:'#bd93f9',
}

export default function TradingViewChart({
  symbol: propSymbol,
  height = 420,
}: {
  symbol?: string
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)
  const markerSyncRef = useRef<any[]>([])
  const { signals, tickers } = useWS()

  const [symbol, setSymbol] = useState(propSymbol || 'BTCUSDT')
  const [tf, setTf] = useState('60')
  const [loaded, setLoaded] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null)

  const tfMin = TIMEFRAMES.find(t => t.value === tf)?.minutes || 60

  // Load Lightweight Charts script
  useEffect(() => {
    if (window.LightweightCharts) { setScriptLoaded(true); return }
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js'
    s.onload = () => setScriptLoaded(true)
    document.head.appendChild(s)
  }, [])

  // Init / re-init chart when symbol or TF changes
  const initChart = useCallback(() => {
    if (!scriptLoaded || !containerRef.current || !window.LightweightCharts) return

    // Destroy previous
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
      candleSeriesRef.current = null
    }

    const LC = window.LightweightCharts

    const chart = LC.createChart(containerRef.current, {
      layout: {
        background: { color: '#04070f' },
        textColor: '#4a6080',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#162035' },
        horzLines: { color: '#162035' },
      },
      crosshair: {
        mode: LC.CrosshairMode.Normal,
        vertLine: { color: '#00c3ff40', width: 1, style: 2 },
        horzLine: { color: '#00c3ff40', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: '#162035', textColor: '#4a6080' },
      timeScale: { borderColor: '#162035', timeVisible: true, secondsVisible: false },
      watermark: {
        visible: true,
        fontSize: 28,
        horzAlign: 'center',
        vertAlign: 'center',
        color: '#00c3ff08',
        text: `SS BlackBox v6.3.1`,
      },
    })

    chart.subscribeCrosshairMove((p: any) => {
      if (p?.seriesData) {
        const d = p.seriesData.values().next().value
        if (d) setCrosshairPrice(d.close ?? d.value)
      }
    })

    const candle = chart.addCandlestickSeries({
      upColor: '#39ff14', downColor: '#ff0062',
      borderUpColor: '#39ff14', borderDownColor: '#ff0062',
      wickUpColor: '#39ff1480', wickDownColor: '#ff006280',
    })

    const data = generateCandles(symbol, tfMin)
    candle.setData(data)

    // Add signal markers
    const markers = signals
      .filter(s => s.ticker === symbol)
      .map(sig => ({
        time: Math.floor(new Date(sig.timestamp).getTime() / 1000) as any,
        position: sig.signal.includes('SELL') || sig.signal.includes('EXIT') ? 'aboveBar' : 'belowBar',
        color: SIG_COLORS[sig.signal] || '#00c3ff',
        shape: sig.signal.includes('EXIT') ? 'arrowDown' : sig.signal.includes('SELL') ? 'arrowDown' : 'arrowUp',
        text: sig.signal.replace('_', ' ').replace('ENTRY_', ''),
        size: 1.5,
      }))

    if (markers.length > 0) {
      try { candle.setMarkers(markers) } catch {}
    }

    markerSyncRef.current = markers

    // BBP line (fake ssDown2 level)
    const bbpLine = chart.addLineSeries({
      color: '#00c3ff60',
      lineWidth: 1,
      lineStyle: 2, // dashed
      title: 'BBP/SSL2',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    const lastPrice = data[data.length - 1].close
    bbpLine.setData(data.map(d => ({
      time: d.time,
      value: d.close * (0.985 + Math.sin(d.time / 100000) * 0.005),
    })))

    // VWAP line
    const vwap = chart.addLineSeries({
      color: '#ffd70050',
      lineWidth: 1,
      title: 'VWAP',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    let cumPV = 0, cumV = 0
    vwap.setData(data.map(d => {
      const v = Math.random() * 1000 + 500
      cumPV += ((d.high + d.low + d.close) / 3) * v
      cumV += v
      return { time: d.time, value: cumPV / cumV }
    }))

    chart.timeScale().fitContent()
    chartRef.current = chart
    candleSeriesRef.current = candle
    setLoaded(true)

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)

    return () => { ro.disconnect() }
  }, [scriptLoaded, symbol, tf, signals])

  useEffect(() => { initChart() }, [initChart])

  // Live price update via WebSocket
  useEffect(() => {
    if (!candleSeriesRef.current) return
    const ticker = tickers.find(t => t.symbol === symbol)
    if (!ticker) return
    const now = Math.floor(Date.now() / 1000)
    try {
      candleSeriesRef.current.update({
        time: now,
        open: ticker.price * (1 - Math.random() * 0.001),
        high: ticker.price * (1 + Math.random() * 0.002),
        low:  ticker.price * (1 - Math.random() * 0.002),
        close: ticker.price,
      })
    } catch {}
  }, [tickers, symbol])

  const currentPrice = tickers.find(t => t.symbol === symbol)?.price
  const currentChange = tickers.find(t => t.symbol === symbol)?.changePct

  return (
    <div style={{ background:'#04070f', borderRadius:10, overflow:'hidden', border:'1px solid #162035' }}>
      {/* Chart toolbar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', borderBottom:'1px solid #162035',
        background:'#0a1020', flexWrap:'wrap', gap:6,
      }}>
        {/* Left: symbol + price */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:800, color:'#e8f4f8' }}>
            {symbol}
          </span>
          {currentPrice && (
            <>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700, color:'#e8f4f8' }}>
                {currentPrice.toLocaleString('en-US', {maximumFractionDigits:2})}
              </span>
              <span style={{
                fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:600,
                color: (currentChange||0) >= 0 ? '#39ff14' : '#ff0062',
              }}>
                {(currentChange||0) >= 0 ? '+' : ''}{(currentChange||0).toFixed(2)}%
              </span>
            </>
          )}
          {crosshairPrice && (
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080' }}>
              cursor: {crosshairPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {/* Symbol picker */}
          {['BTCUSDT','XAUUSD','BBCA.JK','ANTM.JK'].map(s => (
            <button key={s} onClick={() => setSymbol(s)} style={{
              fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:0.5,
              padding:'2px 7px', borderRadius:3, cursor:'pointer',
              background: symbol === s ? '#00c3ff20' : 'transparent',
              border: `1px solid ${symbol === s ? '#00c3ff' : '#162035'}`,
              color: symbol === s ? '#00c3ff' : '#4a6080',
            }}>{s.replace('.JK','')}</button>
          ))}

          <div style={{ width:1, height:16, background:'#162035', margin:'0 2px' }} />

          {/* TF picker */}
          {TIMEFRAMES.map(t => (
            <button key={t.value} onClick={() => setTf(t.value)} style={{
              fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:0.5,
              padding:'2px 7px', borderRadius:3, cursor:'pointer',
              background: tf === t.value ? '#ffd70020' : 'transparent',
              border: `1px solid ${tf === t.value ? '#ffd700' : '#162035'}`,
              color: tf === t.value ? '#ffd700' : '#4a6080',
            }}>{t.label}</button>
          ))}

          <div style={{ width:1, height:16, background:'#162035', margin:'0 2px' }} />

          <button onClick={() => setShowVolume(v => !v)} style={{
            fontFamily:'Space Mono,monospace', fontSize:8,
            padding:'2px 7px', borderRadius:3, cursor:'pointer',
            background: showVolume ? '#bd93f920' : 'transparent',
            border: `1px solid ${showVolume ? '#bd93f9' : '#162035'}`,
            color: showVolume ? '#bd93f9' : '#4a6080',
          }}>VOL</button>
        </div>
      </div>

      {/* Chart container */}
      <div style={{ position:'relative' }}>
        {!loaded && (
          <div style={{
            position:'absolute', inset:0, zIndex:5,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'#04070f', flexDirection:'column', gap:8,
          }}>
            <div style={{
              width:40, height:40, borderRadius:'50%',
              border:'2px solid #162035', borderTopColor:'#00c3ff',
              animation:'spin 0.8s linear infinite',
            }} />
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:'#4a6080', letterSpacing:2 }}>
              LOADING CHART...
            </span>
          </div>
        )}
        <div ref={containerRef} style={{ width:'100%', height }} />
      </div>

      {/* Legend bar */}
      <div style={{
        borderTop:'1px solid #162035', padding:'6px 12px',
        display:'flex', gap:12, alignItems:'center', flexWrap:'wrap',
        background:'#0a1020',
      }}>
        {[
          { color:'#00c3ff60', style:'dashed', label:'BBP/SSL2 Line' },
          { color:'#ffd70050', style:'solid',  label:'VWAP' },
          { color:'#39ff14',   style:'arrow',  label:'BUY Signal' },
          { color:'#ff0062',   style:'arrow',  label:'SELL/EXIT Signal' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{
              width:14, height:2,
              background: l.style === 'arrow' ? 'transparent' : l.color,
              borderTop: l.style === 'dashed' ? `1px dashed ${l.color}` : undefined,
            }}>
              {l.style === 'arrow' && <span style={{ fontSize:8, color:l.color }}>▲</span>}
            </div>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontFamily:'Space Mono,monospace', fontSize:8, color:'#4a6080' }}>
          SS BlackBox v6.3.1 Overlays
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}
