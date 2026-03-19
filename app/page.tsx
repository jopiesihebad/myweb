import Nav           from '@/components/Nav'
import Hero          from '@/components/Hero'
import FaqList       from '@/components/FaqList'
import TickerTape    from '@/components/TickerTape'
import ConwayCards  from '@/components/ConwayCard'
import SignalFeed    from '@/components/SignalFeed'
import EquityChart   from '@/components/EquityChart'
import PricingSection from '@/components/PricingSection'
import WorldIndices  from '@/components/WorldIndices'
import Footer        from '@/components/Footer'
import FadeUp        from '@/components/FadeUp'

/* ─── Static Data ─── */

const PERF_STATS = [
  { lbl:'Win Rate',      val:'74%',   valBig:'74',  valSuf:'%',  valSufSz:'20px', color:'#39ff14', sub:'Conway signal tier — all trades',           delta:'▲ BBP standalone: 81.8%' },
  { lbl:'Profit Factor', val:'1.92',  valBig:'1.92',valSuf:'',   valSufSz:'',     color:'#00c3ff', sub:'Gross profit ÷ gross loss ratio',            delta:'▲ Target threshold: 1.5 — exceeded' },
  { lbl:'Avg R:R',       val:'2.3:1', valBig:'2.3', valSuf:':1', valSufSz:'18px', color:'#ffd700', sub:'SL 1.5× ATR · TP 3× ATR',                   delta:'▲ Average win vs average loss' },
  { lbl:'Max Drawdown',  val:'11%',   valBig:'11',  valSuf:'%',  valSufSz:'20px', color:'#ff8c00', sub:'Worst peak-to-trough period',                delta:'▲ Well below 15% safety threshold' },
  { lbl:'Total Trades',  val:'287',   valBig:'287', valSuf:'',   valSufSz:'',     color:'#eef4fc', sub:'3 years · 1H BTCUSDT · Jan 2022–Dec 2025', delta:'▲ Statistically valid sample size' },
  { lbl:'Expectancy',    val:'+1.4R', valBig:'+1.4',valSuf:'R',  valSufSz:'18px', color:'#39ff14', sub:'Expected value per trade (in R)',            delta:'▲ Positive edge confirmed — not random' },
]

const WR_BARS = [
  { label:'Conway BORN ≥5 cells',   sub:'Best entry — fresh momentum',       pct:82, color:'#39ff14' },
  { label:'Conway ALIVE ≥5 cells',  sub:'Trend continuation mode',           pct:74, color:'#00c3ff' },
  { label:'BBP + Conway filter',    sub:'Crossover with state confirmation',  pct:82, color:'#00b4d8' },
  { label:'GOLD/DOOM (VWAP+RSI)',   sub:'Momentum breakout signals',         pct:65, color:'#ffd700' },
  { label:'BBP Standalone',         sub:'Without Conway filter',             pct:62, color:'#ff8c00' },
  { label:'PM Cross Only',          sub:'No additional filters',             pct:53, color:'#2a3d58' },
]

const HOW_STEPS = [
  { n:'01', icon:'📊', ttl:'Market Scan',   tag:'SS BlackBox v6.4',  desc:'SS BlackBox scans OHLCV data every 1H bar close. 8 Conway cells evaluated simultaneously across weekly trend, baseline, volume, structure, session, and OFI.' },
  { n:'02', icon:'🧬', ttl:'State Decision',tag:'Conway Automaton',   desc:'Conway State Engine computes BORN / ALIVE / DIED / DORMANT. Minimum 5/8 cells required. 23-point Fusion Score determines signal grade from 1 (best) to 5.' },
  { n:'03', icon:'⚡', ttl:'Signal Fire',   tag:'Webhook JSON',       desc:'When conditions align: Conway BORN/ALIVE + BBP Crossover + VWAP + RSI filter + London/NY session, a webhook payload fires to the execution layer.' },
  { n:'04', icon:'🤖', ttl:'Auto Execute',  tag:'Conway.tech',        desc:'Conway Research Automaton receives signal, validates context, places order with ATR-based SL/TP. Position monitored until SS3/BBP exit or Conway DIED.' },
]

const STACK_LAYERS = [
  { n:'Layer 01', color:'#00c3ff', id:'SS BlackBox v6.4',     platform:'TradingView · Pine Script v6',  desc:'8-cell Conway engine · 23-point confluence · BBP + PM entry signals · CHoCH/BOS · Order Blocks · FVG · Session filter · Webhook output', status:'● LIVE',       statusC:'#39ff14', arrow:'↓ webhook JSON'      },
  { n:'Layer 02', color:'#39ff14', id:'Conway Automaton',     platform:'conway.tech · Ethereum Base',   desc:'Autonomous execution brain · ETH wallet identity · Genesis prompt trading rules · Think→Act→Observe loop · Self-funded from profit · On-chain audit log', status:'◌ Integrating', statusC:'#ffd700', arrow:'↓ confidence query'  },
  { n:'Layer 03', color:'#ffd700', id:'DeepNode AI',          platform:'deepnode.ai · Base L2',         desc:'Multi-model AI confidence verification · PoWR reward for accurate signals · On-chain signal validation · 98% task success rate · <$0.01 per query', status:'◇ Q2 2026',    statusC:'#bd93f9', arrow:'↓ execute order'     },
  { n:'Layer 04', color:'#bd93f9', id:'Exchange API',         platform:'Binance · Bybit · OKX',         desc:'Order placement · ATR-based SL/TP · Position monitoring · USDC profit settlement back to Automaton wallet · Full trade history log', status:'● LIVE',       statusC:'#39ff14', arrow:'' },
]

const FAQ_ITEMS = [
  { q:'What is the Conway Automaton state engine?', a:"The Conway Automaton is an 8-cell binary state system that evaluates market conditions each bar close. Each cell represents a specific market condition (weekly trend, volume, session, etc). When 5 or more cells are LIVE simultaneously, the engine enters BORN or ALIVE state and permits trade entries. Below threshold = DORMANT = no trades." },
  { q:'Is the win rate real or backtested?',        a:"All performance numbers shown are from a genuine Pine Script backtest on BTCUSDT 1H data from January 2022 to December 2025. Commission of 0.05% per side and 2 ticks slippage are included. The 81.8% figure is from a live chart scan of 22 BBP signals — raw, unfiltered, as they appeared on the chart." },
  { q:'Do I need to know coding to use this?',     a:"No. The PRO plan includes pre-configured TradingView alert templates and webhook setup guides. The ELITE plan includes full 1-on-1 setup support. You need a TradingView Pro+ account and an exchange account — that's it." },
  { q:'What is Conway Research Automaton?',        a:"Conway Research (conway.tech) is an autonomous AI agent platform that executes tasks 24/7, manages its own Ethereum wallet, and pays for compute from revenue earned. We're integrating it as the execution brain for StockIndexer's bot." },
  { q:'What happens during DORMANT state?',        a:"Nothing. The bot skips all entry signals when Conway is DORMANT (less than 5/8 cells LIVE). This is intentional — not trading is a valid strategy. Capital preservation is the primary objective." },
  { q:'Is this financial advice?',                 a:"No. StockIndexer provides signal intelligence tools and educational content. All trading signals are for informational and research purposes only. Past backtest performance does not guarantee future results. Always start with paper trading." },
]

export default function Page() {
  return (
    <>
      <Nav />

      {/* ─── HERO ─── */}
      <Hero />

      {/* ─── TICKER ─── */}
      <TickerTape />

      {/* ─── LIVE DASHBOARD ─── */}
      <section className="sec" id="live">
        <div className="sec-eyebrow">Conway Automaton — Live State Engine</div>
        <h2 className="sec-h">Real-Time<br />Market Intelligence</h2>
        <p className="sec-p">8-cell Conway state computed every bar close. Hover any card to inspect all 8 cells live. Covering crypto, forex, commodities, and IDX stocks.</p>
        <div style={{ maxWidth: '360px' }}>
          <ConwayCards />
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── SIGNAL FEED ─── */}
      <section className="sec">
        <div className="sec-eyebrow">Live Signal Stream</div>
        <h2 className="sec-h">Every Signal.<br />Every Bar Close.</h2>
        <p className="sec-p">Real-time event log across all monitored assets. Filter by signal type. New signals inject automatically every 8 seconds from pieBot.</p>
        <SignalFeed />
      </section>

      <div className="divider"><hr /></div>

      {/* ─── PERFORMANCE ─── */}
      <section className="sec" id="performance">
        <div className="sec-eyebrow">Verified Backtest — BTCUSDT 1H · 2022–2025</div>
        <h2 className="sec-h">Numbers That<br />Don&apos;t Lie.</h2>
        <p className="sec-p">All metrics from SS BlackBox v6.4 backtest engine. 287 trades · 3 years · commission 0.05% included. No curve fitting.</p>
        <div className="perf-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
          <div>
            <div className="stats-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--border)' }}>
              {PERF_STATS.map(s => (
                <FadeUp key={s.lbl}>
                  <div className="sbox">
                    <div style={{ fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '10px' }}>{s.lbl}</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '40px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, marginBottom: '4px', color: s.color }}>
                      {s.valBig}<span style={{ fontSize: s.valSufSz || '40px', color: 'var(--gray)' }}>{s.valSuf}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--gray)' }}>{s.sub}</div>
                    <div style={{ fontSize: '10px', marginTop: '6px', color: '#39ff14' }}>{s.delta}</div>
                  </div>
                </FadeUp>
              ))}
            </div>
            {/* Win rate bars */}
            <FadeUp delay={0.1}>
              <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '20px', marginTop: '16px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '16px' }}>Win Rate by Signal Tier</div>
                {WR_BARS.map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--gray)', width: '160px', flexShrink: 0, lineHeight: 1.4 }}>
                      {b.label}<br /><span style={{ fontSize: '9px', color: b.color }}>{b.sub}</span>
                    </span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border2)', position: 'relative' }}>
                      <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, transition: 'width 1.2s ease' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--white)', width: '36px', textAlign: 'right', fontFamily: 'Space Mono,monospace' }}>{b.pct}%</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
          <FadeUp delay={0.2}>
            <EquityChart />
          </FadeUp>
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── HOW IT WORKS ─── */}
      <section className="sec">
        <div className="sec-eyebrow">System Overview</div>
        <h2 className="sec-h">How It Works.</h2>
        <p className="sec-p">Four steps from raw price data to autonomous trade execution.</p>
        <div className="hiw-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, background: 'var(--border)' }}>
          {HOW_STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={i * 0.1}>
              <div className="hiw-step" style={{ background: 'var(--panel)', padding: '32px 24px', position: 'relative' }}>
                {i < HOW_STEPS.length - 1 && <span style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--border2)', fontSize: '18px', zIndex: 2 }}>→</span>}
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '48px', fontWeight: 800, color: 'var(--border2)', lineHeight: 1, marginBottom: '14px', letterSpacing: '-3px' }}>{s.n}</div>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{s.icon}</div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.3px' }}>{s.ttl}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray)', lineHeight: 1.7 }}>{s.desc}</div>
                <div style={{ display: 'inline-block', marginTop: '12px', fontSize: '9px', letterSpacing: '2px', padding: '3px 8px', border: '1px solid var(--border2)', color: 'var(--gray)' }}>{s.tag}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── CONWAY EXPLAINER ─── */}
      <section className="sec" id="conway">
        <div className="sec-eyebrow">The Engine — Conway State Explained</div>
        <h2 className="sec-h">8 Cells.<br />One Decision.</h2>
        <p className="sec-p">Each cell is a binary condition. The total live count determines market state. No guesswork. No discretion.</p>
        <div className="cell-explainer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
          <FadeUp>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '16px' }}>Cell Definitions — Current State: EURUSD</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    {n:'C0',name:'Weekly Trend', cond:'EMA 20 > EMA 50',        on:true },
                    {n:'C1',name:'Baseline',     cond:'Close > BBMC HMA 60',    on:true },
                    {n:'C2',name:'SQZ Released', cond:'BB outside KC',           on:true },
                    {n:'C3',name:'Volume OK',    cond:'Vol > SMA20 × 1.1',      on:true },
                    {n:'C4',name:'Predator HFT', cond:'Vol ratio > 100%',       on:true },
                    {n:'C5',name:'CHoCH / BOS',  cond:'Structure aligned',       on:false},
                    {n:'C6',name:'Session',      cond:'London or NY active',     on:true },
                    {n:'C7',name:'OFI',          cond:'Z-score > 0.5',           on:false},
                  ].map(c => (
                    <tr key={c.n} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--cyan)', fontWeight: 700, width: '50px' }}>{c.n}</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--white)' }}>{c.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '10px', color: 'var(--gray)' }}>{c.cond}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '9px', padding: '2px 8px', background: c.on ? 'rgba(57,255,20,0.1)' : 'rgba(90,112,144,0.1)', color: c.on ? '#39ff14' : 'var(--gray2)', border: `1px solid ${c.on ? 'rgba(57,255,20,0.3)' : 'var(--border2)'}` }}>
                          {c.on ? 'LIVE ✓' : 'DEAD ✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '14px 12px', background: 'var(--panel2)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--gray)' }}>Total LIVE cells</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#39ff14' }}>6 / 8 — BORN 🟢</span>
              </div>
            </div>
          </FadeUp>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { state:'born',    emoji:'🟢', name:'BORN',    color:'#39ff14', desc:"Previous bar <threshold, current bar ≥threshold. Fresh momentum emerging. Best entry signal — highest probability trade.", wr:'Est. Win Rate: 76–82%', wrC:'#39ff14' },
              { state:'alive',   emoji:'✦',  name:'ALIVE',   color:'#00c3ff', desc:"Both bars ≥threshold. Trend running. Hold open positions, add on retest. No new entry unless BBP cross occurs.", wr:'Est. Win Rate: 72–76%', wrC:'#39ff14' },
              { state:'died',    emoji:'🔴', name:'DIED',    color:'#ff0062', desc:"Previous bar ≥threshold, current bar <threshold. Momentum fading. Prepare to exit. Bot begins monitoring exit triggers.", wr:'Action: Prepare exit', wrC:'#ff8c00' },
              { state:'dormant', emoji:'○',  name:'DORMANT', color:'#5a7090', desc:"Both bars <threshold. No confluence. Bot skips all entries. Patience is profitability — not trading is a valid position.", wr:'Action: Skip all entries', wrC:'#5a7090' },
            ].map(s => (
              <FadeUp key={s.state} delay={0.1}>
                <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: s.color }} />
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.emoji}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px', marginBottom: '4px', color: s.color }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray)', lineHeight: 1.6 }}>{s.desc}</div>
                  <div style={{ marginTop: '8px', fontSize: '10px' }}>{s.wr.split(':')[0]}: <span style={{ color: s.wrC }}>{s.wr.split(':')[1]}</span></div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── BOT STATUS ─── */}
      <section className="sec" id="bot">
        <div className="sec-eyebrow">Autonomous Bot — Live Status</div>
        <h2 className="sec-h">The Bot Is<br />Always Watching.</h2>
        <p className="sec-p">Conway Research Automaton running 24/7. Self-funded. Self-monitoring. Transparent on-chain audit log.</p>
        <div className="bot-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Bot Alpha card */}
          <FadeUp>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#39ff14,#00c3ff)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Conway Bot Alpha</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '2px', color: '#39ff14', textTransform: 'uppercase' }}><div className="ldot" /> Paper Trading</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '20px' }}>
                {[{l:'P&L Today',v:'+2.3%',c:true},{l:'P&L Month',v:'+8.7%',c:true},{l:'Drawdown',v:'−1.2%',c:null},{l:'Win Rate',v:'78%',c:true},{l:'Trades',v:'14',c:null},{l:'Cells',v:'5/8',c:null,gc:'#ffd700'}].map(m => (
                  <div key={m.l} style={{ background: 'var(--panel2)', padding: '12px' }}>
                    <div style={{ fontSize: '9px', color: 'var(--gray)', letterSpacing: '1px', marginBottom: '4px' }}>{m.l}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Space Mono,monospace', color: m.gc ?? (m.c === true ? '#39ff14' : m.c === false ? '#ff0062' : 'var(--white)') }}>{m.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--panel2)', border: '1px solid var(--border)', padding: '12px 16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px' }}>
                  <span style={{ color: 'var(--white)', fontWeight: 700 }}>XAUUSD</span>
                  <span style={{ color: '#39ff14' }}>▲ LONG</span>
                </div>
                {[['Entry Price','2,891.20','var(--white)'],['Current P&L','+21.20 (+0.73%)','#39ff14'],['Stop Loss','2,843.60 (−1.65%)','#ff0062'],['Take Profit','2,954.80 (+2.20%)','#39ff14'],['Exit Condition','SS3 cross / DIED','var(--white)']].map(r => (
                  <div key={r[0] as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--gray)' }}>{r[0]}</span>
                    <span style={{ color: r[2] as string, fontFamily: 'Space Mono,monospace' }}>{r[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', marginBottom: '8px', textTransform: 'uppercase' }}>Activity Log</div>
              <div style={{ background: 'var(--bg2)', padding: '14px', fontSize: '10px', lineHeight: 1.8, maxHeight: '160px', overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace' }}>
                {([
                  { t:'17:14', parts:[
                    { txt:'Signal received: ', c:'#5a7090' },
                    { txt:'EURUSD CONWAY BUY', c:'#00c3ff' },
                    { txt:' · evaluating...', c:'#5a7090' },
                  ]},
                  { t:'17:14', parts:[
                    { txt:'Conway cells: ', c:'#5a7090' },
                    { txt:'6/8 BORN', c:'#39ff14' },
                    { txt:' · filter passed', c:'#5a7090' },
                  ]},
                  { t:'17:14', parts:[
                    { txt:'Max positions reached · skipping EURUSD entry', c:'#5a7090' },
                  ]},
                  { t:'16:58', parts:[
                    { txt:'BBP Crossover detected: ', c:'#5a7090' },
                    { txt:'XAUUSD @ 2,891.20', c:'#00c3ff' },
                  ]},
                  { t:'16:58', parts:[
                    { txt:'Order placed: ', c:'#5a7090' },
                    { txt:'LONG XAUUSD', c:'#5a7090' },
                    { txt:' · qty 0.035 oz', c:'#39ff14' },
                  ]},
                  { t:'16:30', parts:[
                    { txt:'London session open · ', c:'#5a7090' },
                    { txt:'prime window activated', c:'#00c3ff' },
                  ]},
                  { t:'14:02', parts:[
                    { txt:'Position closed: ', c:'#5a7090' },
                    { txt:'BTCUSDT · +2.1%', c:'#39ff14' },
                    { txt:' · Conway DIED signal', c:'#ff0062' },
                  ]},
                ] as { t: string; parts: { txt: string; c: string }[] }[]).map(({ t, parts }, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '2px' }}>
                    <span style={{ color: '#2a3d58', flexShrink: 0 }}>{t}</span>
                    <span>
                      {parts.map((p, j) => (
                        <span key={j} style={{ color: p.c }}>{p.txt}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
          {/* System health */}
          <FadeUp delay={0.1}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#39ff14,#00c3ff)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: 700 }}>System Health</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '2px', color: '#39ff14', textTransform: 'uppercase' }}><div className="ldot" /> All Systems Go</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {[['TradingView Webhook','● Connected','#39ff14'],['Exchange API (Binance)','● Connected','#39ff14'],['Conway Research Automaton','◌ Integrating','#ffd700'],['DeepNode AI Layer','◇ Q2 2026','#bd93f9'],['Webhook Latency','< 280ms avg','#39ff14'],['Uptime (30 days)','99.94%','#39ff14']].map(r => (
                  <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '10px 14px', background: 'var(--panel2)' }}>
                    <span style={{ color: 'var(--gray)' }}>{r[0]}</span>
                    <span style={{ color: r[2] }}>{r[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--panel2)', padding: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', marginBottom: '12px', textTransform: 'uppercase' }}>Risk Limits</div>
                {[['Risk per trade','1.0%','var(--white)'],['Max daily loss','3.0% — OK','#39ff14'],['Max drawdown limit','15% — OK','#39ff14'],['Max open positions','1 / 1','var(--white)']].map(r => (
                  <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--gray)' }}>{r[0]}</span>
                    <span style={{ color: r[2] }}>{r[1]}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--gray)', lineHeight: 1.7, padding: '14px', border: '1px solid var(--border)' }}>
                ⚠ Paper trading mode active. All positions are simulated with real market prices. No real funds at risk until backtest validation is complete.
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── STACK ─── */}
      <section className="sec" id="stack">
        <div className="sec-eyebrow">Architecture</div>
        <h2 className="sec-h">The Full Stack.</h2>
        <p className="sec-p">Four layers of intelligence. One autonomous organism that sees, decides, acts, and learns.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '800px' }}>
          {STACK_LAYERS.map((l, i) => (
            <div key={l.n}>
              <FadeUp delay={i * 0.1}>
                <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '24px', alignItems: 'center', padding: '22px 28px', position: 'relative', transition: 'border-color 0.3s' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', padding: '4px 10px', fontWeight: 700, background: l.color, color: 'var(--bg)' }}>{l.n}</div>
                  <div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px', color: l.color }}>{l.id}</div>
                    <div style={{ fontSize: '9px', letterSpacing: '2px', color: 'var(--gray)', marginTop: '3px' }}>{l.platform}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--gray)', lineHeight: 1.7 }}>{l.desc}</div>
                  <div style={{ fontSize: '9px', letterSpacing: '1px', padding: '4px 12px', textAlign: 'center', whiteSpace: 'nowrap', color: l.statusC, border: `1px solid ${l.statusC}22`, background: `${l.statusC}11` }}>{l.status}</div>
                </div>
              </FadeUp>
              {l.arrow && <div style={{ textAlign: 'center', padding: '4px 0', color: 'var(--border2)', fontSize: '18px' }}>{l.arrow}</div>}
            </div>
          ))}
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── MACRO INDICES ─── */}
      <section className="sec">
        <div className="sec-eyebrow">Market Context</div>
        <h2 className="sec-h">Global Indices.</h2>
        <p className="sec-p">Macro market context — not part of signal universe, but useful for broader context.</p>
        <div style={{ maxWidth: '800px' }}>
          <WorldIndices />
        </div>
      </section>

      <div className="divider"><hr /></div>

      {/* ─── PRICING ─── */}
      <div id="pricing">
        <PricingSection />
      </div>

      <div className="divider"><hr /></div>

      {/* ─── FAQ ─── */}
      <section className="sec">
        <div className="sec-eyebrow">Questions</div>
        <h2 className="sec-h">FAQ.</h2>
        <p className="sec-p">The honest answers.</p>
        <FaqList items={FAQ_ITEMS} />
      </section>

      {/* ─── CTA BANNER ─── */}
      <div style={{ position: 'relative', zIndex: 1, background: 'var(--panel)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 50% 50%,rgba(0,195,255,0.07),transparent)' }} />
        <div className="cta-inner" style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '10px' }}>
              The market doesn&apos;t wait.<br />
              <span style={{ color: 'var(--cyan)' }}>Your signals should be live.</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gray)' }}>14-day money-back guarantee. No risk, full access from day one.</p>
          </div>
          <div className="cta-actions" style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
            <a href="https://utas.stockindexer.com/checkout/pro" target="_blank" rel="noreferrer" className="btn-cta-primary">🚀 Start 14-Day Trial</a>
            <a href="#pricing" className="btn-cta-secondary">View All Plans →</a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}


