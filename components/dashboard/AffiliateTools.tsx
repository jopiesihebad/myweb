'use client'

// ─────────────────────────────────────────────────────────────
//  AffiliateTools — "Tools & Brokers" dashboard section
//  Layer 1 monetization: affiliate links to brokers + platforms
//  All links use UTM tracking: utm_source=stockindexer
// ─────────────────────────────────────────────────────────────

const EXCHANGES = [
  {
    name:    'OKX',
    desc:    'Primary trading venue · Spot + futures · Fast execution',
    tag:     'RECOMMENDED',
    tagClr:  '#39ff14',
    url:     'https://okx.com/join/stockindexer',
    logo:    '◈',
    color:   '#00c3ff',
    note:    'pieBot-compatible · Market + limit orders',
  },
  {
    name:    'Binance',
    desc:    'Largest global exchange · Deepest liquidity',
    tag:     'HIGH LIQUIDITY',
    tagClr:  '#ffd700',
    url:     'https://accounts.binance.com/register?ref=stockindexer',
    logo:    '◆',
    color:   '#ffd700',
    note:    'Best for BTC/ETH/SOL/BNB pairs',
  },
  {
    name:    'Indodax',
    desc:    'Largest IDR exchange in Indonesia · Ideal for IDR onramp',
    tag:     'IDR ONRAMP',
    tagClr:  '#ff8c00',
    url:     'https://indodax.com/?ref=stockindexer',
    logo:    '◉',
    color:   '#ff8c00',
    note:    'Best for Indonesian traders, IDR deposit',
  },
]

const PLATFORMS = [
  {
    name:    'TradingView',
    desc:    'Required for SS BlackBox indicator · Chart analysis',
    tag:     'REQUIRED',
    tagClr:  '#ff0062',
    url:     'https://tradingview.com/?aff_id=stockindexer',
    logo:    '📊',
    color:   '#00c3ff',
    note:    'Pro plan needed for webhook alerts',
  },
  {
    name:    '3Commas',
    desc:    'Automate signals into trades · DCA & grid bots',
    tag:     'AUTOMATION',
    tagClr:  '#bd93f9',
    url:     'https://3commas.io/?c=stockindexer',
    logo:    '🤖',
    color:   '#bd93f9',
    note:    '25% recurring commission for referrals',
  },
]

const TRADER_SETUP = [
  { name: 'Monitor Stand',    price: 'Rp 185.000', url: 'https://hargaterbaik.com/trader-setup/monitor-stand'    },
  { name: 'Mechanical Keyboard TKL', price: 'Rp 315.000', url: 'https://hargaterbaik.com/trader-setup/keyboard' },
  { name: 'Blue Light Glasses', price: 'Rp 89.000', url: 'https://hargaterbaik.com/trader-setup/glasses'        },
  { name: 'Desk Mat XL',      price: 'Rp 129.000', url: 'https://hargaterbaik.com/trader-setup/deskmat'         },
]

export default function AffiliateTools() {
  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
        <span style={{ width:3, height:16, background:'linear-gradient(180deg,#00c3ff,#bd93f9)', borderRadius:2, display:'inline-block' }} />
        <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#c8d8e8', letterSpacing:1, textTransform:'uppercase' }}>
          Tools & Brokers
        </span>
        <span style={{ fontSize:9, color:'#4a6080', fontFamily:'Space Mono,monospace', letterSpacing:1 }}>
          Compatible with SS BlackBox signals
        </span>
      </div>

      {/* Exchanges */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:'#4a6080', marginBottom:10 }}>EXCHANGES</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {EXCHANGES.map(ex => (
            <a key={ex.name} href={ex.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:'none', display:'block' }}>
              <div style={{
                background:'#0a1020', border:`1px solid ${ex.color}30`,
                borderRadius:8, padding:'12px 16px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                transition:'all 0.15s', cursor:'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${ex.color}80`; (e.currentTarget as HTMLDivElement).style.background = '#0d1830' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${ex.color}30`; (e.currentTarget as HTMLDivElement).style.background = '#0a1020' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:20, width:32, textAlign:'center', color:ex.color }}>{ex.logo}</span>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#eef4fc' }}>{ex.name}</span>
                      <span style={{ fontSize:8, letterSpacing:1, padding:'1px 6px', color:ex.tagClr, border:`1px solid ${ex.tagClr}40`, background:`${ex.tagClr}10` }}>
                        {ex.tag}
                      </span>
                    </div>
                    <div style={{ fontSize:10, color:'#8aa0b8' }}>{ex.desc}</div>
                    <div style={{ fontSize:9, color:'#4a6080', marginTop:2 }}>{ex.note}</div>
                  </div>
                </div>
                <span style={{ fontSize:16, color:ex.color, flexShrink:0 }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:'#4a6080', marginBottom:10 }}>PLATFORMS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {PLATFORMS.map(pl => (
            <a key={pl.name} href={pl.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:'none', display:'block' }}>
              <div style={{
                background:'#0a1020', border:`1px solid ${pl.color}30`,
                borderRadius:8, padding:'12px 16px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                transition:'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${pl.color}80`; (e.currentTarget as HTMLDivElement).style.background = '#0d1830' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${pl.color}30`; (e.currentTarget as HTMLDivElement).style.background = '#0a1020' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:20, width:32, textAlign:'center' }}>{pl.logo}</span>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontFamily:'Syne,sans-serif', fontSize:13, fontWeight:700, color:'#eef4fc' }}>{pl.name}</span>
                      <span style={{ fontSize:8, letterSpacing:1, padding:'1px 6px', color:pl.tagClr, border:`1px solid ${pl.tagClr}40`, background:`${pl.tagClr}10` }}>
                        {pl.tag}
                      </span>
                    </div>
                    <div style={{ fontSize:10, color:'#8aa0b8' }}>{pl.desc}</div>
                    <div style={{ fontSize:9, color:'#4a6080', marginTop:2 }}>{pl.note}</div>
                  </div>
                </div>
                <span style={{ fontSize:16, color:pl.color, flexShrink:0 }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Trader Setup — cross-sell hargaterbaik */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:9, letterSpacing:2, color:'#4a6080' }}>TRADER SETUP</div>
          <a href="https://hargaterbaik.com/trader-setup" target="_blank" rel="noopener noreferrer"
            style={{ fontSize:9, color:'#00c3ff', textDecoration:'none', letterSpacing:1 }}>
            View all at hargaterbaik.com ↗
          </a>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {TRADER_SETUP.map(item => (
            <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:'none' }}>
              <div style={{
                background:'#0a1020', border:'1px solid #162035',
                borderRadius:8, padding:'10px 14px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                transition:'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid #00c3ff40'; (e.currentTarget as HTMLDivElement).style.background = '#0d1830' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid #162035'; (e.currentTarget as HTMLDivElement).style.background = '#0a1020' }}
              >
                <span style={{ fontSize:11, color:'#8aa0b8' }}>{item.name}</span>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'#ffd700', fontFamily:'Space Mono,monospace' }}>{item.price}</div>
                  <div style={{ fontSize:8, color:'#00c3ff' }}>Best price ↗</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* SS BlackBox license CTA */}
        <a href="/indicator" style={{ textDecoration:'none', display:'block', marginTop:16 }}>
          <div style={{
            background:'linear-gradient(135deg, #0a1020, #0d1830)',
            border:'1px solid #ffd70040',
            borderRadius:8, padding:'14px 16px',
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#ffd700', fontFamily:'Syne,sans-serif', marginBottom:3 }}>
                ⚡ SS BlackBox Standalone License
              </div>
              <div style={{ fontSize:10, color:'#8aa0b8' }}>
                Run the indicator on your own TradingView charts
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#eef4fc', fontFamily:'Syne,sans-serif' }}>from $29<span style={{ fontSize:10, color:'#4a6080' }}>/mo</span></div>
              <div style={{ fontSize:9, color:'#ffd700' }}>View plans →</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
