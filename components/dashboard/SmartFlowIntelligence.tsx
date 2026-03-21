'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  STOCK_DATA, CRYPTO_DATA, COMMODITY_DATA, FOREX_DATA,
  type StockInsight, type CryptoInsight, type CommodityInsight, type ForexInsight,
  type Timeframe,
} from '@/lib/smartFlowData'

// ─────────────────────────────────────────────────────────────
//  SmartFlowIntelligence.tsx
//  4-class market intelligence: Saham · Crypto · Commodity · Forex
//  Filter TF · Export CSV · Sort by Confluence · Dark mode toggle
// ─────────────────────────────────────────────────────────────

type AssetClass = 'SAHAM' | 'CRYPTO' | 'COMMODITY' | 'FOREX'
type SortDir    = 'DESC' | 'ASC'

// ─── Shared constants ─────────────────────────────────────────
const TF_TABS: Timeframe[] = ['1D', '7D', '30D', '90D', 'ALL']
const C = {
  cyan:   '#00c3ff', lime:   '#39ff14', gold:   '#ffd700',
  red:    '#ff0062', purple: '#bd93f9', orange: '#ff8c00',
  mag:    '#ff44cc', panel:  '#0a1020', border: '#162035',
  text:   '#c8d8e8', gray:   '#4a6080', dark:   '#04070f',
}

// ─── Helpers ──────────────────────────────────────────────────
function fmtUSD(n: number): string {
  if (Math.abs(n) >= 1e9) return `$${(n/1e9).toFixed(1)}B`
  if (Math.abs(n) >= 1e6) return `$${(n/1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}
function fmtNum(n: number, decimals = 0): string {
  return n >= 0 ? `+${n.toFixed(decimals)}` : n.toFixed(decimals)
}
function scoreColor(s: number): string {
  if (s >= 75) return C.lime
  if (s >= 55) return C.cyan
  if (s >= 40) return C.gold
  if (s >= 25) return C.orange
  return C.red
}
function biasColor(b: string): string {
  if (['BULLISH','ACCUMULATION','INFLOW','BUYING','HAWKISH','RISK-ON'].includes(b)) return C.lime
  if (['BEARISH','DISTRIBUTION','OUTFLOW','SELLING','DOVISH','RISK-OFF'].includes(b)) return C.red
  return C.gold
}
function biasArrow(b: string): string {
  if (['BULLISH','ACCUMULATION','INFLOW','BUYING','HAWKISH'].includes(b)) return '▲'
  if (['BEARISH','DISTRIBUTION','OUTFLOW','SELLING','DOVISH'].includes(b)) return '▼'
  return '●'
}

// ─── Sub-components ───────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray,
      letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>
      {children}
    </div>
  )
}

function ScoreBar({ score, color, label }: { score:number; color:string; label?:string }) {
  return (
    <div>
      {label && <SectionLabel>{label}</SectionLabel>}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, height:6, background:'#162035', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.min(100,score)}%`,
            background:`linear-gradient(90deg,${color}80,${color})`,
            boxShadow:`0 0 8px ${color}60`, borderRadius:3,
            transition:'width 0.6s ease' }} />
        </div>
        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11,
          fontWeight:700, color, minWidth:32, textAlign:'right' }}>{score}</span>
      </div>
    </div>
  )
}

function BiasChip({ bias }: { bias:string }) {
  const col = biasColor(bias)
  const arr = biasArrow(bias)
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      fontFamily:'Space Mono,monospace', fontSize:9, fontWeight:700,
      color:col, letterSpacing:1,
      padding:'2px 8px', borderRadius:3,
      background:`${col}15`, border:`1px solid ${col}40` }}>
      {arr} {bias}
    </span>
  )
}

function Card({ title, icon, children, accentColor = C.cyan }:
  { title:string; icon:string; children:React.ReactNode; accentColor?:string }) {
  return (
    <div style={{ background:C.panel, border:`1px solid ${C.border}`,
      borderRadius:10, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, width:3, bottom:0,
        background:`linear-gradient(180deg,${accentColor},${accentColor}40)` }} />
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontFamily:'Syne,sans-serif', fontSize:11, fontWeight:700,
          color:C.text, letterSpacing:0.5 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Export CSV helper ────────────────────────────────────────
function buildCSV(rows: string[][], headers: string[]): string {
  return [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
}
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href=url; a.download=filename; a.click()
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════
//  SAHAM PANEL
// ═══════════════════════════════════════════════════════════════
function SahamPanel({ tf }: { tf: Timeframe }) {
  const [sort, setSort] = useState<SortDir>('DESC')
  const [symIdx, setSymIdx] = useState(0)

  const sorted = useMemo(() =>
    [...STOCK_DATA].sort((a,b) =>
      sort === 'DESC'
        ? b.confluenceConway[tf] - a.confluenceConway[tf]
        : a.confluenceConway[tf] - b.confluenceConway[tf]
    ), [sort, tf])

  const sym: StockInsight = sorted[symIdx] ?? sorted[0]
  const cc  = sym.confluenceConway[tf]
  const sms = sym.smartMoneyScore[tf]
  const nco = sym.netChangeOwnership[tf]
  const voc = sym.volumeOwnershipCorr[tf]

  function exportCSV() {
    const rows = STOCK_DATA.map(s => [
      s.symbol, s.name, s.exchange,
      s.ownershipCluster.institutional, s.ownershipCluster.retail,
      s.ownershipCluster.foreign, s.ownershipCluster.govRelated,
      s.netChangeOwnership[tf].institutional,
      s.netChangeOwnership[tf].retail,
      s.netChangeOwnership[tf].foreign,
      s.smartMoneyScore[tf], s.smartMoneyBias,
      s.insiderActivity.signal, s.insiderActivity.score,
      s.volumeOwnershipCorr[tf].volSpike,
      s.volumeOwnershipCorr[tf].ownershipChange,
      s.volumeOwnershipCorr[tf].correlation,
      s.confluenceConway[tf],
    ].map(String))
    downloadCSV(buildCSV(rows, [
      'Symbol','Name','Exchange','Institutional%','Retail%','Foreign%','GovRelated%',
      'NetChg_Institutional','NetChg_Retail','NetChg_Foreign',
      'SmartMoneyScore','SmartMoneyBias','InsiderSignal','InsiderScore',
      'VolumeSpike','OwnershipChange','VolOwnCorrelation','ConfluenceConway'
    ]), `smartflow_saham_${tf}_${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      {/* Symbol selector + sort + export */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
          {sorted.map((s, i) => (
            <button key={s.symbol} onClick={() => setSymIdx(i)} style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:9, padding:'3px 8px',
              borderRadius:4, cursor:'pointer',
              background: i===symIdx ? `${scoreColor(s.confluenceConway[tf])}20` : 'transparent',
              border:`1px solid ${i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.border}`,
              color: i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.gray,
              transition:'all 0.15s',
            }}>{s.symbol}</button>
          ))}
        </div>
        <button onClick={() => setSort(s => s==='DESC'?'ASC':'DESC')} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:'transparent', border:`1px solid ${C.border}`, color:C.cyan,
        }}>
          ⇅ CONFLUENCE {sort}
        </button>
        <button onClick={exportCSV} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:`${C.lime}10`, border:`1px solid ${C.lime}40`, color:C.lime,
        }}>↓ CSV</button>
      </div>

      {/* Selected symbol header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16,
        padding:'12px 16px', background:'#0d1628', borderRadius:8, border:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:C.text }}>{sym.symbol}</div>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{sym.name} · {sym.exchange}</div>
        </div>
        <BiasChip bias={sym.smartMoneyBias} />
        <div style={{ marginLeft:'auto' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginBottom:4 }}>CONFLUENCE W/ CONWAY</div>
          <ScoreBar score={cc} color={scoreColor(cc)} />
        </div>
      </div>

      {/* 5 cards grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>

        {/* Ownership Cluster */}
        <Card title="Ownership Cluster Map" icon="🏛" accentColor={C.cyan}>
          {(['institutional','retail','foreign','govRelated'] as const).map(k => {
            const pct = sym.ownershipCluster[k]
            const labels = { institutional:'Institutional', retail:'Retail', foreign:'Foreign', govRelated:'Gov/Related' }
            const colors = { institutional:C.cyan, retail:C.gold, foreign:C.purple, govRelated:C.orange }
            return (
              <div key={k} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{labels[k]}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:700, color:colors[k] }}>{pct}%</span>
                </div>
                <div style={{ height:4, background:'#162035', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:colors[k], borderRadius:2 }} />
                </div>
              </div>
            )
          })}
        </Card>

        {/* Net Change Ownership */}
        <Card title="Net Change Ownership" icon="📊" accentColor={C.purple}>
          <SectionLabel>Timeframe: {tf}</SectionLabel>
          {([
            { label:'Institutional', val:nco.institutional, color:C.cyan },
            { label:'Retail',        val:nco.retail,        color:C.gold },
            { label:'Foreign',       val:nco.foreign,       color:C.purple },
          ]).map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', padding:'6px 8px', marginBottom:4,
              background:'#06090f', borderRadius:4, border:`1px solid ${C.border}` }}>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{r.label}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700,
                color: r.val >= 0 ? C.lime : C.red }}>
                {r.val >= 0 ? '▲ +' : '▼ '}{r.val.toFixed(2)}%
              </span>
            </div>
          ))}
        </Card>

        {/* Smart Money Score */}
        <Card title="Smart Money Accumulation/Distribution" icon="🧠" accentColor={C.lime}>
          <ScoreBar score={sms} color={scoreColor(sms)} label="Smart Money Score" />
          <div style={{ marginTop:12 }}>
            <BiasChip bias={sym.smartMoneyBias} />
          </div>
          <div style={{ marginTop:10, fontFamily:'JetBrains Mono,monospace', fontSize:9, color:C.gray, lineHeight:1.6 }}>
            {sms >= 70 ? 'Strong accumulation pattern detected. Institutional buying pressure elevated.' :
             sms >= 50 ? 'Moderate accumulation signals. Monitor for confirmation.' :
             sms >= 35 ? 'Mixed signals. Distribution and accumulation balanced.' :
             'Distribution phase detected. Smart money reducing exposure.'}
          </div>
        </Card>

        {/* Insider Activity */}
        <Card title="Insider Buying/Selling Detection" icon="🔍" accentColor={
          sym.insiderActivity.signal==='BUYING' ? C.lime :
          sym.insiderActivity.signal==='SELLING' ? C.red : C.gold}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <BiasChip bias={sym.insiderActivity.signal} />
            <ScoreBar score={sym.insiderActivity.score}
              color={sym.insiderActivity.signal==='BUYING' ? C.lime :
                     sym.insiderActivity.signal==='SELLING' ? C.red : C.gold} />
          </div>
          {sym.insiderActivity.entities.map((e, i) => (
            <div key={i} style={{ padding:'6px 8px', background:'#06090f',
              borderRadius:4, marginBottom:4, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:C.text, fontWeight:700 }}>{e.name}</span>
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:9,
                  color: e.action.includes('BUY') ? C.lime : e.action.includes('SELL')||e.action==='REDUCE' ? C.red : C.gold }}>
                  {e.action}
                </span>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                {e.shares > 0 && <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray }}>{e.shares.toLocaleString()} shares</span>}
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray }}>{e.value}</span>
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginLeft:'auto' }}>{e.date}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Volume + Ownership Correlation */}
        <Card title="Volume Spike + Ownership Correlation" icon="📈" accentColor={C.orange}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'Vol Spike', val:`${voc.volSpike.toFixed(1)}x`, color:C.orange },
              { label:'Own Change', val:`${fmtNum(voc.ownershipChange,2)}%`, color:voc.ownershipChange>=0?C.lime:C.red },
              { label:'Correlation', val:voc.correlation.toFixed(2), color:Math.abs(voc.correlation)>=0.7?C.lime:C.gold },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6, padding:'8px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, letterSpacing:1, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:800, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <ScoreBar score={Math.abs(voc.correlation)*100} color={C.orange} label="Correlation Strength" />
          <div style={{ marginTop:8, fontFamily:'JetBrains Mono,monospace', fontSize:9, color:C.gray, lineHeight:1.6 }}>
            {Math.abs(voc.correlation) >= 0.8 ? 'Strong volume-ownership correlation. Volume spikes consistently tied to ownership changes.' :
             Math.abs(voc.correlation) >= 0.6 ? 'Moderate correlation. Volume patterns partially explain ownership shifts.' :
             'Weak correlation. Volume and ownership movements are largely independent.'}
          </div>
        </Card>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  CRYPTO PANEL
// ═══════════════════════════════════════════════════════════════
function CryptoPanel({ tf }: { tf: Timeframe }) {
  const [sort, setSort] = useState<SortDir>('DESC')
  const [symIdx, setSymIdx] = useState(0)

  const sorted = useMemo(() =>
    [...CRYPTO_DATA].sort((a,b) =>
      sort==='DESC'
        ? b.confluenceConway[tf] - a.confluenceConway[tf]
        : a.confluenceConway[tf] - b.confluenceConway[tf]
    ), [sort, tf])

  const sym: CryptoInsight = sorted[symIdx] ?? sorted[0]
  const cc = sym.confluenceConway[tf]
  const wf = sym.whaleFlow[tf]
  const ef = sym.exchangeFlow[tf]
  const lt = sym.largeTransactions[tf]
  const fp = sym.fundingRPnL[tf]

  function exportCSV() {
    const rows = CRYPTO_DATA.map(s => [
      s.symbol, s.name,
      s.whaleFlow[tf].inflow, s.whaleFlow[tf].outflow, s.whaleFlow[tf].netFlow, s.whaleFlow[tf].bias,
      s.exchangeFlow[tf].exchangeInflow, s.exchangeFlow[tf].exchangeOutflow, s.exchangeFlow[tf].netExchange, s.exchangeFlow[tf].pressure,
      s.largeTransactions[tf].count, s.largeTransactions[tf].totalValue, s.largeTransactions[tf].dominantDir,
      s.fundingRPnL[tf].fundingRate, s.fundingRPnL[tf].realizedPnL, s.fundingRPnL[tf].divergence,
      s.confluenceConway[tf],
    ].map(String))
    downloadCSV(buildCSV(rows, [
      'Symbol','Name',
      'WhaleInflow','WhaleOutflow','WhaleNetFlow','WhaleBias',
      'ExchInflow','ExchOutflow','ExchNet','ExchPressure',
      'LargeTxCount','LargeTxTotal','LargeTxDir',
      'FundingRate','RealizedPnL','FundingDivergence',
      'ConfluenceConway'
    ]), `smartflow_crypto_${tf}_${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
          {sorted.map((s, i) => (
            <button key={s.symbol} onClick={() => setSymIdx(i)} style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:9, padding:'3px 8px',
              borderRadius:4, cursor:'pointer',
              background: i===symIdx ? `${scoreColor(s.confluenceConway[tf])}20` : 'transparent',
              border:`1px solid ${i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.border}`,
              color: i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.gray,
            }}>{s.symbol}</button>
          ))}
        </div>
        <button onClick={() => setSort(s => s==='DESC'?'ASC':'DESC')} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:'transparent', border:`1px solid ${C.border}`, color:C.cyan,
        }}>⇅ CONFLUENCE {sort}</button>
        <button onClick={exportCSV} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:`${C.lime}10`, border:`1px solid ${C.lime}40`, color:C.lime,
        }}>↓ CSV</button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16,
        padding:'12px 16px', background:'#0d1628', borderRadius:8, border:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:C.text }}>{sym.symbol}</div>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{sym.name}</div>
        </div>
        <BiasChip bias={wf.bias} />
        <BiasChip bias={fp.divergence} />
        <div style={{ marginLeft:'auto' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginBottom:4 }}>CONFLUENCE W/ CONWAY</div>
          <ScoreBar score={cc} color={scoreColor(cc)} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>

        {/* Whale Flow */}
        <Card title="Whale & Labeled Entity Flow" icon="🐋" accentColor={C.cyan}>
          <SectionLabel>Net Flow · {tf}</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Inflow',   val:fmtUSD(wf.inflow),   color:C.lime },
              { label:'Outflow',  val:fmtUSD(wf.outflow),  color:C.red  },
              { label:'Net',      val:fmtUSD(Math.abs(wf.netFlow)), color:wf.netFlow>=0?C.lime:C.red },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:5, padding:'7px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <BiasChip bias={wf.bias} />
        </Card>

        {/* Exchange Flow */}
        <Card title="Exchange Inflow / Outflow" icon="🏦" accentColor={C.purple}>
          <SectionLabel>Exchange Pressure · {tf}</SectionLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Exchange Inflow',  val:fmtUSD(ef.exchangeInflow),  color:C.red  },
              { label:'Exchange Outflow', val:fmtUSD(ef.exchangeOutflow), color:C.lime },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:5, padding:'7px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>Net Exchange:</span>
            <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700,
              color:ef.netExchange<=0?C.lime:C.red }}>
              {ef.netExchange<=0?'▼ ':'▲ '}{fmtUSD(Math.abs(ef.netExchange))}
            </span>
          </div>
          <div style={{ marginTop:8 }}><BiasChip bias={ef.pressure} /></div>
        </Card>

        {/* Smart Wallets */}
        <Card title="Smart Money Wallet Tracking" icon="💼" accentColor={C.gold}>
          {sym.smartWallets.map((w, i) => (
            <div key={i} style={{ padding:'8px', background:'#06090f', borderRadius:6,
              marginBottom:6, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:700, color:C.text }}>{w.label}</span>
                  <span style={{ marginLeft:6, fontFamily:'Space Mono,monospace', fontSize:7,
                    color:C.gray, padding:'1px 4px', border:`1px solid ${C.border}`, borderRadius:2 }}>{w.type}</span>
                </div>
                <BiasChip bias={w.action} />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                {w.amount !== '0' && w.amount !== '0 BTC' && w.amount !== '0 ETH' && w.amount !== '0 BNB' && (
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.cyan }}>{w.amount}</span>
                )}
                {w.pnlPct !== 0 && (
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:8,
                    color:w.pnlPct>=0?C.lime:C.red }}>
                    Historical PnL: {w.pnlPct>=0?'+':''}{w.pnlPct}%
                  </span>
                )}
                <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginLeft:'auto' }}>{w.lastActive}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Large Transactions */}
        <Card title="Large Transaction Alerts" icon="⚡" accentColor={C.orange}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Tx Count',  val:lt.count.toLocaleString(),  color:C.orange },
              { label:'Total Vol', val:fmtUSD(lt.totalValue),       color:C.orange },
              { label:'Avg Size',  val:fmtUSD(lt.avgSize),          color:C.orange },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:5, padding:'7px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>Dominant Direction:</span>
            <BiasChip bias={lt.dominantDir} />
          </div>
        </Card>

        {/* Funding Rate + PnL Divergence */}
        <Card title="Realized PnL + Funding Rate Divergence" icon="📉" accentColor={C.mag}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Funding Rate', val:`${(fp.fundingRate*100).toFixed(3)}%`,
                color:fp.fundingRate>=0?C.lime:C.red },
              { label:'Realized PnL', val:fmtUSD(Math.abs(fp.realizedPnL)),
                color:fp.realizedPnL>=0?C.lime:C.red },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:5, padding:'7px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>Divergence Signal:</span>
            <BiasChip bias={fp.divergence} />
          </div>
        </Card>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  COMMODITY PANEL
// ═══════════════════════════════════════════════════════════════
function CommodityPanel({ tf }: { tf: Timeframe }) {
  const [sort, setSort] = useState<SortDir>('DESC')
  const [symIdx, setSymIdx] = useState(0)

  const sorted = useMemo(() =>
    [...COMMODITY_DATA].sort((a,b) =>
      sort==='DESC'
        ? b.confluenceConway[tf] - a.confluenceConway[tf]
        : a.confluenceConway[tf] - b.confluenceConway[tf]
    ), [sort, tf])

  const sym: CommodityInsight = sorted[symIdx] ?? sorted[0]
  const cc   = sym.confluenceConway[tf]
  const cftc = sym.cftcPositioning[tf]
  const wkly = sym.weeklyNetChange[tf]
  const prod = sym.producerHedging[tf]
  const seas = sym.seasonal[tf]

  function exportCSV() {
    const rows = COMMODITY_DATA.map(s => [
      s.symbol, s.name, s.unit,
      s.cftcPositioning[tf].hedgeFundsNet, s.cftcPositioning[tf].commercialsNet,
      s.cftcPositioning[tf].smallTradersNet, s.cftcPositioning[tf].bias,
      s.weeklyNetChange[tf].hedgeFunds, s.weeklyNetChange[tf].commercials,
      s.producerHedging[tf].hedgingRatio, s.producerHedging[tf].bias, s.producerHedging[tf].signalStr,
      s.supplyRisk.score,
      s.seasonal[tf].historicalBias, s.seasonal[tf].avgReturn, s.seasonal[tf].consistency,
      s.macroCorr.dxy, s.macroCorr.interestRate, s.macroCorr.inflation, s.macroCorr.overall,
      s.confluenceConway[tf],
    ].map(String))
    downloadCSV(buildCSV(rows, [
      'Symbol','Name','Unit',
      'CFTC_HedgeFunds','CFTC_Commercials','CFTC_SmallTraders','CFTC_Bias',
      'WeeklyChg_HedgeFunds','WeeklyChg_Commercials',
      'ProducerHedgingRatio','ProducerHedgingBias','ProducerSignalStr',
      'SupplyRiskScore',
      'SeasonalBias','SeasonalAvgReturn','SeasonalConsistency',
      'MacroCorr_DXY','MacroCorr_InterestRate','MacroCorr_Inflation','MacroOverall',
      'ConfluenceConway'
    ]), `smartflow_commodity_${tf}_${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
          {sorted.map((s, i) => (
            <button key={s.symbol} onClick={() => setSymIdx(i)} style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:9, padding:'3px 8px',
              borderRadius:4, cursor:'pointer',
              background: i===symIdx ? `${scoreColor(s.confluenceConway[tf])}20` : 'transparent',
              border:`1px solid ${i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.border}`,
              color: i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.gray,
            }}>{s.symbol}</button>
          ))}
        </div>
        <button onClick={() => setSort(s => s==='DESC'?'ASC':'DESC')} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:'transparent', border:`1px solid ${C.border}`, color:C.cyan,
        }}>⇅ CONFLUENCE {sort}</button>
        <button onClick={exportCSV} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:`${C.lime}10`, border:`1px solid ${C.lime}40`, color:C.lime,
        }}>↓ CSV</button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16,
        padding:'12px 16px', background:'#0d1628', borderRadius:8, border:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:C.text }}>{sym.symbol}</div>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{sym.name} · {sym.unit}</div>
        </div>
        <BiasChip bias={cftc.bias} />
        <BiasChip bias={sym.macroCorr.overall} />
        <div style={{ marginLeft:'auto' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginBottom:4 }}>CONFLUENCE W/ CONWAY</div>
          <ScoreBar score={cc} color={scoreColor(cc)} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>

        {/* CFTC Positioning */}
        <Card title="CFTC Positioning" icon="📋" accentColor={C.cyan}>
          <SectionLabel>Net contracts · {tf}</SectionLabel>
          {[
            { label:'Hedge Funds',   val:cftc.hedgeFundsNet,   color:C.cyan },
            { label:'Commercials',   val:cftc.commercialsNet,  color:C.orange },
            { label:'Small Traders', val:cftc.smallTradersNet, color:C.gray },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', padding:'6px 8px', marginBottom:4,
              background:'#06090f', borderRadius:4, border:`1px solid ${C.border}` }}>
              <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{r.label}</span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700,
                color: r.val>=0?r.color:C.red }}>
                {r.val>=0?'+':''}{r.val.toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{ marginTop:8 }}><BiasChip bias={cftc.bias} /></div>
        </Card>

        {/* Weekly Net Change */}
        <Card title="Weekly Net Positioning Change" icon="📅" accentColor={C.purple}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { label:'Hedge Funds Chg',  val:wkly.hedgeFunds,  color:C.cyan },
              { label:'Commercials Chg',  val:wkly.commercials, color:C.orange },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6,
                padding:'10px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
                  color:s.val>=0?C.lime:C.red }}>
                  {s.val>=0?'+':''}{s.val.toLocaleString()}
                </div>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray }}>contracts</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Producer Hedging */}
        <Card title="Producer Hedging Behavior" icon="🏭" accentColor={C.gold}>
          <ScoreBar score={prod.signalStr} color={C.gold} label="Hedging Signal Strength" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
            <div style={{ background:'#06090f', borderRadius:6, padding:'8px', textAlign:'center' }}>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>HEDGING RATIO</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:C.gold }}>{prod.hedgingRatio}%</div>
            </div>
            <div style={{ background:'#06090f', borderRadius:6, padding:'8px', textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' }}>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:4 }}>TREND</div>
              <BiasChip bias={prod.bias} />
            </div>
          </div>
        </Card>

        {/* Supply Risk */}
        <Card title="Supply Disruption Risk Score" icon="⚠️" accentColor={
          sym.supplyRisk.score>=70?C.red:sym.supplyRisk.score>=45?C.orange:C.lime}>
          <ScoreBar score={sym.supplyRisk.score}
            color={sym.supplyRisk.score>=70?C.red:sym.supplyRisk.score>=45?C.orange:C.lime}
            label="Supply Risk Score" />
          <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
            {sym.supplyRisk.factors.map((f, i) => (
              <div key={i} style={{ padding:'7px 9px', background:'#06090f',
                borderRadius:5, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:C.text }}>{f.factor}</span>
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:8,
                    color:f.impact==='HIGH'?C.red:f.impact==='MEDIUM'?C.orange:C.lime,
                    padding:'1px 5px', border:`1px solid ${f.impact==='HIGH'?C.red:f.impact==='MEDIUM'?C.orange:C.lime}40`,
                    borderRadius:2 }}>{f.impact}</span>
                </div>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray }}>{f.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Seasonal Pattern */}
        <Card title="Seasonal Pattern Analysis" icon="🌊" accentColor={C.mag}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Avg Return',    val:`${seas.avgReturn>=0?'+':''}${seas.avgReturn.toFixed(1)}%`, color:seas.avgReturn>=0?C.lime:C.red },
              { label:'Consistency',   val:`${seas.consistency}%`,  color:scoreColor(seas.consistency) },
              { label:'Bias',          val:seas.historicalBias,     color:biasColor(seas.historicalBias) },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:5, padding:'7px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <ScoreBar score={seas.consistency} color={C.mag} label="Seasonal Consistency Score" />
        </Card>

        {/* Macro Correlation */}
        <Card title="Macro Correlation Score" icon="🌐" accentColor={C.orange}>
          <SectionLabel>Correlation vs key macro drivers</SectionLabel>
          {[
            { label:'vs DXY (Dollar Index)', val:sym.macroCorr.dxy, desc:sym.macroCorr.dxy<0?'Inverse':'Direct' },
            { label:'vs Interest Rate',      val:sym.macroCorr.interestRate, desc:sym.macroCorr.interestRate<0?'Inverse':'Direct' },
            { label:'vs Inflation',          val:sym.macroCorr.inflation, desc:sym.macroCorr.inflation>0?'Direct hedge':'Inverse' },
          ].map(r => {
            const abs = Math.abs(r.val)
            const col = abs>=0.7?C.lime:abs>=0.4?C.gold:C.gray
            return (
              <div key={r.label} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{r.label}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:col }}>
                    {r.val>=0?'+':''}{r.val.toFixed(2)}
                  </span>
                </div>
                <div style={{ height:4, background:'#162035', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${abs*100}%`, background:col, borderRadius:2 }} />
                </div>
              </div>
            )
          })}
          <div style={{ marginTop:8 }}><BiasChip bias={sym.macroCorr.overall} /></div>
        </Card>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  FOREX PANEL
// ═══════════════════════════════════════════════════════════════
function ForexPanel({ tf }: { tf: Timeframe }) {
  const [sort, setSort] = useState<SortDir>('DESC')
  const [symIdx, setSymIdx] = useState(0)

  const sorted = useMemo(() =>
    [...FOREX_DATA].sort((a,b) =>
      sort==='DESC'
        ? b.confluenceConway[tf] - a.confluenceConway[tf]
        : a.confluenceConway[tf] - b.confluenceConway[tf]
    ), [sort, tf])

  const sym: ForexInsight = sorted[symIdx] ?? sorted[0]
  const cc   = sym.confluenceConway[tf]
  const cftc = sym.cftcBIS[tf]
  const carr = sym.carryTrade[tf]
  const lv   = sym.leveragedVsAssetMgr[tf]
  const svp  = sym.sentimentVsPrice[tf]
  const cb   = sym.centralBankSignal

  function exportCSV() {
    const rows = FOREX_DATA.map(s => [
      s.symbol, s.name, s.base, s.quote,
      s.cftcBIS[tf].leveragedFundsNet, s.cftcBIS[tf].assetManagersNet,
      s.cftcBIS[tf].centralBankBias, s.cftcBIS[tf].overallBias,
      s.carryTrade[tf].interestDiff, s.carryTrade[tf].carryScore,
      s.carryTrade[tf].flowBias, s.carryTrade[tf].riskAppetite,
      s.leveragedVsAssetMgr[tf].leveragedPos, s.leveragedVsAssetMgr[tf].assetMgrPos,
      s.leveragedVsAssetMgr[tf].divergence, s.leveragedVsAssetMgr[tf].divergenceStr,
      s.centralBankSignal.bank, s.centralBankSignal.signal, s.centralBankSignal.score,
      s.sentimentVsPrice[tf].sentimentScore, s.sentimentVsPrice[tf].priceChange,
      s.sentimentVsPrice[tf].divergence, s.sentimentVsPrice[tf].divergenceStr,
      s.confluenceConway[tf],
    ].map(String))
    downloadCSV(buildCSV(rows, [
      'Symbol','Name','Base','Quote',
      'CFTC_LeveragedFunds','CFTC_AssetManagers','CB_Bias','Overall_Bias',
      'CarryInterestDiff','CarryScore','CarryFlowBias','RiskAppetite',
      'LeveragedPos%','AssetMgrPos%','LV_Divergence','LV_DivStr',
      'CentralBank','CB_Signal','CB_Score',
      'SentimentScore','PriceChange%','SentPriceDivergence','SentDivStr',
      'ConfluenceConway'
    ]), `smartflow_forex_${tf}_${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', flex:1 }}>
          {sorted.map((s, i) => (
            <button key={s.symbol} onClick={() => setSymIdx(i)} style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:9, padding:'3px 8px',
              borderRadius:4, cursor:'pointer',
              background: i===symIdx ? `${scoreColor(s.confluenceConway[tf])}20` : 'transparent',
              border:`1px solid ${i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.border}`,
              color: i===symIdx ? scoreColor(s.confluenceConway[tf]) : C.gray,
            }}>{s.symbol}</button>
          ))}
        </div>
        <button onClick={() => setSort(s => s==='DESC'?'ASC':'DESC')} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:'transparent', border:`1px solid ${C.border}`, color:C.cyan,
        }}>⇅ CONFLUENCE {sort}</button>
        <button onClick={exportCSV} style={{
          fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
          borderRadius:4, cursor:'pointer',
          background:`${C.lime}10`, border:`1px solid ${C.lime}40`, color:C.lime,
        }}>↓ CSV</button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16,
        padding:'12px 16px', background:'#0d1628', borderRadius:8, border:`1px solid ${C.border}` }}>
        <div>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:800, color:C.text }}>{sym.symbol}</div>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:9, color:C.gray }}>{sym.name}</div>
        </div>
        <BiasChip bias={cftc.overallBias} />
        <BiasChip bias={carr.riskAppetite} />
        <div style={{ marginLeft:'auto' }}>
          <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginBottom:4 }}>CONFLUENCE W/ CONWAY</div>
          <ScoreBar score={cc} color={scoreColor(cc)} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>

        {/* CFTC + BIS */}
        <Card title="CFTC + BIS Bank Positioning" icon="🏦" accentColor={C.cyan}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
            {[
              { label:'Leveraged Funds', val:cftc.leveragedFundsNet.toLocaleString(), color:C.cyan },
              { label:'Asset Managers',  val:cftc.assetManagersNet.toLocaleString(),  color:C.purple },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6, padding:'9px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, fontWeight:700,
                  color: Number(s.val.replace(',',''))>=0?s.color:C.red }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <BiasChip bias={cftc.centralBankBias} />
            <BiasChip bias={cftc.overallBias} />
          </div>
        </Card>

        {/* Carry Trade */}
        <Card title="Carry Trade Flow" icon="💱" accentColor={C.gold}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Interest Diff',  val:`${carr.interestDiff>=0?'+':''}${carr.interestDiff.toFixed(1)}%`, color:carr.interestDiff>=0?C.lime:C.red },
              { label:'Carry Score',    val:carr.carryScore, isScore:true },
            ].map((s:any) => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6, padding:'9px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
                  color:s.isScore?scoreColor(s.val):s.color }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <BiasChip bias={carr.flowBias} />
            <BiasChip bias={carr.riskAppetite} />
          </div>
        </Card>

        {/* Leveraged vs Asset Managers */}
        <Card title="Leveraged Funds vs Asset Managers Divergence" icon="⚖️" accentColor={C.purple}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Leveraged Funds Net Long', val:`${lv.leveragedPos}%`, color:C.cyan },
              { label:'Asset Managers Net Long',  val:`${lv.assetMgrPos}%`,  color:C.purple },
            ].map(s => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6, padding:'9px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <ScoreBar score={lv.divergenceStr} color={biasColor(lv.divergence)} label="Divergence Strength" />
          <div style={{ marginTop:8 }}><BiasChip bias={lv.divergence} /></div>
        </Card>

        {/* Central Bank Intervention */}
        <Card title="Central Bank Intervention Signals" icon="🏛" accentColor={
          cb.signal==='HAWKISH'?C.lime:cb.signal==='DOVISH'?C.red:C.gold}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:800, color:C.text }}>{cb.bank}</div>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray }}>{cb.lastAction}</div>
            </div>
            <BiasChip bias={cb.signal} />
          </div>
          <ScoreBar score={cb.score}
            color={cb.score>=60?C.lime:cb.score>=40?C.gold:C.red}
            label="Hawkishness Score (0=dovish, 100=hawkish)" />
          <div style={{ marginTop:10, padding:'8px 10px', background:'#06090f',
            borderRadius:5, border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, marginBottom:4 }}>
              Next Meeting: {cb.nextMeeting}
            </div>
            <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:C.text, lineHeight:1.6 }}>
              {cb.commentary}
            </div>
          </div>
        </Card>

        {/* Sentiment vs Price Divergence */}
        <Card title="Sentiment vs Price Action Divergence" icon="🎯" accentColor={C.orange}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            {[
              { label:'Sentiment Score', val:svp.sentimentScore, isScore:true },
              { label:'Price Change',    val:`${svp.priceChange>=0?'+':''}${svp.priceChange.toFixed(2)}%`,
                color:svp.priceChange>=0?C.lime:C.red },
            ].map((s:any) => (
              <div key={s.label} style={{ background:'#06090f', borderRadius:6, padding:'9px', textAlign:'center' }}>
                <div style={{ fontFamily:'Space Mono,monospace', fontSize:7, color:C.gray, marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800,
                  color:s.isScore?scoreColor(s.val):s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
          <ScoreBar score={svp.divergenceStr} color={biasColor(svp.divergence)} label="Divergence Strength" />
          <div style={{ marginTop:8, display:'flex', gap:8 }}>
            <BiasChip bias={svp.divergence} />
          </div>
          <div style={{ marginTop:8, fontFamily:'JetBrains Mono,monospace', fontSize:9, color:C.gray, lineHeight:1.5 }}>
            {svp.divergenceStr >= 40
              ? `Strong ${svp.divergence} divergence — sentiment and price are moving in opposite directions, suggesting potential reversal.`
              : `Weak divergence — sentiment and price action broadly aligned.`}
          </div>
        </Card>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
export default function SmartFlowIntelligence() {
  const [activeClass, setActiveClass]   = useState<AssetClass>('SAHAM')
  const [tf, setTf]                     = useState<Timeframe>('7D')
  const [darkMode, setDarkMode]         = useState(false)

  // Load dark mode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sfi-darkmode')
      if (saved === 'true') setDarkMode(true)
    } catch {}
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => {
      const next = !d
      try { localStorage.setItem('sfi-darkmode', String(next)) } catch {}
      return next
    })
  }, [])

  const dm = darkMode
    ? { bg:'#000000', panel:'#0a0a0a', border:'#1a1a1a', text:'#ffffff' }
    : { bg:C.dark, panel:C.panel, border:C.border, text:C.text }

  const CLASS_TABS: { key: AssetClass; label: string; icon: string; color: string }[] = [
    { key:'SAHAM',     label:'Saham',     icon:'📈', color:C.cyan   },
    { key:'CRYPTO',    label:'Crypto',    icon:'₿',  color:C.purple },
    { key:'COMMODITY', label:'Commodity', icon:'🥇', color:C.gold   },
    { key:'FOREX',     label:'Forex',     icon:'💱', color:C.lime   },
  ]

  return (
    <div style={{ background:dm.bg, borderRadius:12, overflow:'hidden',
      border:`1px solid ${dm.border}`, fontFamily:'JetBrains Mono,monospace' }}>

      {/* ── Header ── */}
      <div style={{ padding:'14px 18px', background:dm.panel,
        borderBottom:`1px solid ${dm.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:20,
            background:`linear-gradient(180deg,${C.cyan},${C.lime})`, borderRadius:2 }} />
          <div>
            <div style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:800,
              color:dm.text, letterSpacing:0.5 }}>Smart Flow Intelligence</div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray, letterSpacing:1 }}>
              4-class market intelligence · Conway Signal Platform
            </div>
          </div>
          <div style={{ padding:'2px 8px', background:`${C.lime}15`,
            border:`1px solid ${C.lime}40`, borderRadius:4 }}>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:7,
              color:C.lime, letterSpacing:1 }}>● LIVE</span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* TF tabs */}
          <div style={{ display:'flex', gap:3 }}>
            {TF_TABS.map(t => (
              <button key={t} onClick={() => setTf(t)} style={{
                fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 8px',
                borderRadius:4, cursor:'pointer',
                background: tf===t ? `${C.cyan}20` : 'transparent',
                border:`1px solid ${tf===t ? C.cyan : dm.border}`,
                color: tf===t ? C.cyan : C.gray,
                transition:'all 0.15s',
              }}>{t}</button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button onClick={toggleDarkMode} style={{
            display:'flex', alignItems:'center', gap:5,
            fontFamily:'Space Mono,monospace', fontSize:8, padding:'3px 10px',
            borderRadius:4, cursor:'pointer',
            background: darkMode ? '#ffffff20' : '#00000020',
            border:`1px solid ${dm.border}`,
            color:dm.text, transition:'all 0.2s',
          }}>
            {darkMode ? '☀️ LIGHT' : '🌙 DARK'}
          </button>
        </div>
      </div>

      {/* ── Asset class tabs ── */}
      <div style={{ display:'flex', background:dm.panel,
        borderBottom:`1px solid ${dm.border}` }}>
        {CLASS_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveClass(t.key)} style={{
            flex:1, padding:'10px 4px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            background: activeClass===t.key ? `${t.color}12` : 'transparent',
            border:'none',
            borderBottom: activeClass===t.key ? `2px solid ${t.color}` : '2px solid transparent',
            cursor:'pointer', transition:'all 0.2s',
          }}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            <span style={{ fontFamily:'Space Mono,monospace', fontSize:8, letterSpacing:1,
              color: activeClass===t.key ? t.color : C.gray }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ padding:'16px', background:dm.bg,
        animation:'fadeUp 0.3s ease' }}>
        {activeClass === 'SAHAM'     && <SahamPanel     tf={tf} />}
        {activeClass === 'CRYPTO'    && <CryptoPanel    tf={tf} />}
        {activeClass === 'COMMODITY' && <CommodityPanel tf={tf} />}
        {activeClass === 'FOREX'     && <ForexPanel     tf={tf} />}
      </div>

      {/* ── Footer disclaimer ── */}
      <div style={{ padding:'8px 18px', background:dm.panel,
        borderTop:`1px solid ${dm.border}`,
        fontFamily:'Space Mono,monospace', fontSize:8, color:C.gray,
        display:'flex', justifyContent:'space-between', letterSpacing:0.3 }}>
        <span>All data is for informational reference only — not financial advice. Manual execution by user only.</span>
        <span>SS BlackBox v6.4 · Conway Signal Intelligence Platform</span>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
