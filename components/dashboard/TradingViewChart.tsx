'use client'

import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  TradingViewChart — Real TradingView Advanced Chart Widget
//  Uses TradingView free embeddable widget (no API key needed)
//  Real OHLCV candles, volume, EMA overlays
// ─────────────────────────────────────────────────────────────

const TV_SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: 'BINANCE:BTCUSDT', ETHUSDT: 'BINANCE:ETHUSDT',
  SOLUSDT: 'BINANCE:SOLUSDT', BNBUSDT: 'BINANCE:BNBUSDT',
  XAUUSD:  'OANDA:XAUUSD',   WTIUSD:  'TVC:USOIL',
  XAGUSD:  'OANDA:XAGUSD',   XCUUSD:  'COMEX:HG1!',
  EURUSD:  'OANDA:EURUSD',   GBPUSD:  'OANDA:GBPUSD',
  USDJPY:  'OANDA:USDJPY',   AUDUSD:  'OANDA:AUDUSD',
  BBCA:    'IDX:BBCA',       BBRI:    'IDX:BBRI',
  ANTM:    'IDX:ANTM',       ASII:    'IDX:ASII',
  NVDA:    'NASDAQ:NVDA',    SPY:     'AMEX:SPY',
  AAPL:    'NASDAQ:AAPL',    TSLA:    'NASDAQ:TSLA',
  META:    'NASDAQ:META',    MSFT:    'NASDAQ:MSFT',
  QQQ:     'NASDAQ:QQQ',    AMD:     'NASDAQ:AMD',
}

const TV_INTERVAL: Record<string, string> = {
  '5':'5', '15':'15', '60':'60', '240':'240', 'D':'D',
}

const TIMEFRAMES = [
  { label:'5m',  value:'5'   },
  { label:'15m', value:'15'  },
  { label:'1H',  value:'60'  },
  { label:'4H',  value:'240' },
  { label:'1D',  value:'D'   },
]

const QUICK_SYMBOLS = [
  { group:'CRYPTO',    color:'#bd93f9', tickers:['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT'] },
  { group:'COMMODITY', color:'#ffd700', tickers:['XAUUSD','WTIUSD','XAGUSD'] },
  { group:'FOREX',     color:'#00c3ff', tickers:['EURUSD','GBPUSD','USDJPY','AUDUSD'] },
  { group:'IDX',       color:'#ff8c00', tickers:['BBCA','BBRI','ANTM','ASII'] },
  { group:'USA',       color:'#39ff14', tickers:['NVDA','AAPL','TSLA','META','MSFT','AMD'] },
]

export default function TradingViewChart({
  symbol: propSymbol,
  height = 500,
}: {
  symbol?: string
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [symbol, setSymbol] = useState(propSymbol || 'BTCUSDT')
  const [tf,     setTf]     = useState('60')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  // Sync from parent (LiveTickerTape click)
  useEffect(() => {
    if (propSymbol && propSymbol !== symbol) setSymbol(propSymbol)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSymbol])

  // Reload widget when symbol/tf changes — debounced to avoid iframe contentWindow error
  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget immediately
    containerRef.current.innerHTML = ''

    // Debounce: give browser time to fully unmount previous iframe
    const timer = setTimeout(() => {
      if (!containerRef.current) return

      const tvSymbol = TV_SYMBOL_MAP[symbol] || `BINANCE:${symbol}`
      const interval = TV_INTERVAL[tf] || '60'

      const container = document.createElement('div')
      container.className = 'tradingview-widget-container'
      container.style.cssText = 'height:100%;width:100%'

      const widget = document.createElement('div')
      widget.className = 'tradingview-widget-container__widget'
      widget.style.cssText = 'height:calc(100% - 32px);width:100%'
      container.appendChild(widget)

      const script = document.createElement('script')
      script.type  = 'text/javascript'
      script.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.async = true
      script.innerHTML = JSON.stringify({
      autosize:          true,
      symbol:            tvSymbol,
      interval,
      timezone:          'Asia/Jakarta',
      theme:             'dark',
      style:             '1',
      locale:            'en',
      enable_publishing: false,
      hide_top_toolbar:  false,
      save_image:        true,
      calendar:          false,
      backgroundColor:   '#04070f',
      gridColor:         'rgba(0,195,255,0.04)',
      overrides: {
        'mainSeriesProperties.candleStyle.upColor':         '#39ff14',
        'mainSeriesProperties.candleStyle.downColor':       '#ff0062',
        'mainSeriesProperties.candleStyle.wickUpColor':     '#39ff1460',
        'mainSeriesProperties.candleStyle.wickDownColor':   '#ff006260',
        'mainSeriesProperties.candleStyle.borderUpColor':   '#39ff14',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ff0062',
        'paneProperties.background':                        '#04070f',
        'paneProperties.backgroundType':                    'solid',
        'paneProperties.vertGridProperties.color':          'rgba(0,195,255,0.04)',
        'paneProperties.horzGridProperties.color':          'rgba(0,195,255,0.04)',
        'scalesProperties.textColor':                       '#4a6080',
        'scalesProperties.backgroundColor':                 '#04070f',
      },
      studies: ['Volume@tv-basicstudies'],
      studies_overrides: {
        'volume.volume.color.0': '#ff006240',
        'volume.volume.color.1': '#39ff1440',
      },
    })

      container.appendChild(script)
      containerRef.current.appendChild(container)
    }, 150) // 150ms debounce

    return () => {
      clearTimeout(timer)
      // Delay cleanup to let TV widget finish its own teardown
      setTimeout(() => {
        if (containerRef.current) containerRef.current.innerHTML = ''
      }, 50)
    }
  }, [symbol, tf])

  const tvSymbol   = TV_SYMBOL_MAP[symbol] || symbol
  const assetGroup = QUICK_SYMBOLS.find(g => g.tickers.includes(symbol))

  return (
    <div style={{ background:'#04070f', borderRadius:10, overflow:'hidden', border:'1px solid #162035' }}>

      {/* Toolbar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', borderBottom:'1px solid #162035',
        background:'#0a1020', flexWrap:'wrap', gap:6,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:'#eef4fc' }}>
            {symbol}
          </span>
          <span style={{ fontSize:9, color:'#4a6080', fontFamily:'Space Mono,monospace' }}>
            {tvSymbol}
          </span>
          {assetGroup && (
            <span style={{
              fontSize:7, padding:'1px 6px', letterSpacing:1,
              color: assetGroup.color,
              border:`1px solid ${assetGroup.color}40`,
              background:`${assetGroup.color}10`,
            }}>
              {assetGroup.group}
            </span>
          )}
          <span style={{ fontSize:8, color:'#2a3d58', fontFamily:'Space Mono,monospace' }}>
            · real-time via TradingView
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {TIMEFRAMES.map(t => (
            <button key={t.value} onClick={() => setTf(t.value)} style={{
              fontFamily:'Space Mono,monospace', fontSize:8,
              padding:'2px 7px', borderRadius:3, cursor:'pointer',
              background: tf === t.value ? '#ffd70020' : 'transparent',
              border:`1px solid ${tf === t.value ? '#ffd700' : '#162035'}`,
              color: tf === t.value ? '#ffd700' : '#4a6080',
              transition:'all 0.15s',
            }}>{t.label}</button>
          ))}
          <div style={{ width:1, height:14, background:'#162035', margin:'0 2px' }} />
          <a
            href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
            target="_blank" rel="noreferrer"
            style={{
              fontFamily:'Space Mono,monospace', fontSize:8,
              padding:'2px 8px', borderRadius:3,
              border:'1px solid #162035', color:'#4a6080',
              textDecoration:'none', transition:'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='#00c3ff'; e.currentTarget.style.borderColor='#00c3ff40' }}
            onMouseLeave={e => { e.currentTarget.style.color='#4a6080'; e.currentTarget.style.borderColor='#162035' }}
          >
            ↗ TV
          </a>
        </div>
      </div>

      {/* Symbol quick-picker */}
      <div style={{
        display:'flex', borderBottom:'1px solid #162035',
        background:'#06090f', overflowX:'auto',
        scrollbarWidth:'none',
      }}>
        {QUICK_SYMBOLS.map(g => (
          <div key={g.group} style={{ display:'flex', flexShrink:0 }}>
            <button
              onClick={() => setActiveGroup(activeGroup === g.group ? null : g.group)}
              style={{
                padding:'5px 10px', fontSize:8, letterSpacing:1,
                fontFamily:'Space Mono,monospace', cursor:'pointer',
                background: (activeGroup === g.group || assetGroup?.group === g.group) ? `${g.color}12` : 'transparent',
                border:'none',
                borderRight:'1px solid #162035',
                borderBottom: assetGroup?.group === g.group ? `2px solid ${g.color}` : '2px solid transparent',
                color: assetGroup?.group === g.group ? g.color : '#4a6080',
                fontWeight: assetGroup?.group === g.group ? 700 : 400,
                whiteSpace:'nowrap',
              }}>
              {g.group}
            </button>
            {(activeGroup === g.group || assetGroup?.group === g.group) && g.tickers.map(t => (
              <button key={t} onClick={() => setSymbol(t)} style={{
                padding:'5px 8px', fontSize:8,
                fontFamily:'JetBrains Mono,monospace', cursor:'pointer',
                background: symbol === t ? `${g.color}18` : 'transparent',
                border:'none',
                borderRight:'1px solid #0d1830',
                borderBottom: symbol === t ? `2px solid ${g.color}` : '2px solid transparent',
                color: symbol === t ? g.color : '#5a7090',
                whiteSpace:'nowrap',
                transition:'all 0.1s',
              }}>
                {t}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Widget container */}
      <div style={{ position:'relative' }}>
        <div ref={containerRef} style={{ height, width:'100%' }} />
        {/* TV widget takes ~1-2s to load — show subtle loading state */}
        <style>{`
          .tv-loading-shimmer {
            position: absolute; inset: 0;
            background: linear-gradient(90deg, #04070f 25%, #0a1020 50%, #04070f 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            pointer-events: none;
            z-index: 1;
          }
          @keyframes shimmer {
            0%   { background-position: 200% 0 }
            100% { background-position: -200% 0 }
          }
        `}</style>
      </div>

      {/* Footer */}
      <div style={{
        padding:'4px 12px', fontSize:8, color:'#1e2e4a',
        fontFamily:'Space Mono,monospace', letterSpacing:1,
        borderTop:'1px solid #0d1830',
        display:'flex', justifyContent:'space-between',
      }}>
        <span>TradingView real-time chart · SS BlackBox v6.4 signals via WebSocket</span>
        <span>WIB (UTC+7)</span>
      </div>
    </div>
  )
}
