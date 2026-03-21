// ─────────────────────────────────────────────────────────────
//  lib/smartFlowData.ts
//  Smart Flow Intelligence — Dummy Data (realistic & varied)
//  All data is for educational/demonstration purposes only
// ─────────────────────────────────────────────────────────────

export type Timeframe = '1D' | '7D' | '30D' | '90D' | 'ALL'

// ═══════════════════════════════════════════════════════════════
//  SAHAM (IDX + US)
// ═══════════════════════════════════════════════════════════════

export type StockInsight = {
  symbol:        string
  name:          string
  exchange:      'IDX' | 'US'
  ownershipCluster: {
    institutional: number  // %
    retail:        number
    foreign:       number
    govRelated:    number
  }
  netChangeOwnership: Record<Timeframe, { institutional: number; retail: number; foreign: number }>
  smartMoneyScore:    Record<Timeframe, number>  // 0–100
  smartMoneyBias:     'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL'
  insiderActivity: {
    signal:     'BUYING' | 'SELLING' | 'NEUTRAL'
    score:      number
    entities:   { name: string; action: string; shares: number; value: string; date: string }[]
  }
  volumeOwnershipCorr: Record<Timeframe, { volSpike: number; ownershipChange: number; correlation: number }>
  confluenceConway:    Record<Timeframe, number>  // 0–100
}

const TF_SET = ['1D','7D','30D','90D','ALL'] as Timeframe[]
function tf<T>(vals: T[]): Record<Timeframe, T> {
  return Object.fromEntries(TF_SET.map((t,i) => [t, vals[i]])) as Record<Timeframe, T>
}

export const STOCK_DATA: StockInsight[] = [
  {
    symbol: 'BBCA', name: 'Bank Central Asia', exchange: 'IDX',
    ownershipCluster: { institutional:22, retail:18, foreign:17, govRelated:54 },
    netChangeOwnership: tf([
      { institutional:0.12, retail:-0.08, foreign:0.21 },
      { institutional:0.44, retail:-0.31, foreign:0.82 },
      { institutional:1.21, retail:-0.92, foreign:2.14 },
      { institutional:2.84, retail:-1.73, foreign:4.21 },
      { institutional:5.12, retail:-3.44, foreign:7.88 },
    ]),
    smartMoneyScore: tf([72,68,74,71,69]),
    smartMoneyBias: 'ACCUMULATION',
    insiderActivity: {
      signal:'BUYING', score:78,
      entities:[
        { name:'Dwimuria Investama', action:'BUY', shares:12_500_000, value:'Rp1.2B', date:'2026-03-18' },
        { name:'GIC Singapore',      action:'BUY', shares:4_200_000,  value:'Rp404M', date:'2026-03-15' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:1.8, ownershipChange:0.21, correlation:0.74 },
      { volSpike:2.1, ownershipChange:0.82, correlation:0.81 },
      { volSpike:2.4, ownershipChange:2.14, correlation:0.77 },
      { volSpike:1.9, ownershipChange:4.21, correlation:0.69 },
      { volSpike:2.2, ownershipChange:7.88, correlation:0.72 },
    ]),
    confluenceConway: tf([72,68,74,71,69]),
  },
  {
    symbol: 'BBRI', name: 'Bank Rakyat Indonesia', exchange: 'IDX',
    ownershipCluster: { institutional:15, retail:22, foreign:14, govRelated:53 },
    netChangeOwnership: tf([
      { institutional:-0.08, retail:0.14, foreign:-0.22 },
      { institutional:-0.31, retail:0.52, foreign:-0.84 },
      { institutional:-0.88, retail:1.24, foreign:-2.11 },
      { institutional:-1.54, retail:2.44, foreign:-3.92 },
      { institutional:-2.81, retail:4.11, foreign:-6.44 },
    ]),
    smartMoneyScore: tf([38,42,35,41,39]),
    smartMoneyBias: 'DISTRIBUTION',
    insiderActivity: {
      signal:'SELLING', score:35,
      entities:[
        { name:'Norges Bank', action:'SELL', shares:8_100_000, value:'Rp396M', date:'2026-03-17' },
        { name:'Vanguard Group', action:'REDUCE', shares:3_400_000, value:'Rp166M', date:'2026-03-12' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:2.4, ownershipChange:-0.22, correlation:-0.68 },
      { volSpike:2.8, ownershipChange:-0.84, correlation:-0.72 },
      { volSpike:3.1, ownershipChange:-2.11, correlation:-0.79 },
      { volSpike:2.6, ownershipChange:-3.92, correlation:-0.71 },
      { volSpike:2.9, ownershipChange:-6.44, correlation:-0.75 },
    ]),
    confluenceConway: tf([38,42,35,41,39]),
  },
  {
    symbol: 'ANTM', name: 'Aneka Tambang', exchange: 'IDX',
    ownershipCluster: { institutional:12, retail:21, foreign:4, govRelated:65 },
    netChangeOwnership: tf([
      { institutional:0.31, retail:-0.12, foreign:0.44 },
      { institutional:1.14, retail:-0.44, foreign:1.82 },
      { institutional:2.88, retail:-1.11, foreign:4.21 },
      { institutional:5.44, retail:-2.22, foreign:7.84 },
      { institutional:9.11, retail:-4.88, foreign:12.44 },
    ]),
    smartMoneyScore: tf([81,77,84,79,82]),
    smartMoneyBias: 'ACCUMULATION',
    insiderActivity: {
      signal:'BUYING', score:84,
      entities:[
        { name:'MIND ID (Gov)', action:'BUY', shares:22_000_000, value:'Rp482M', date:'2026-03-19' },
        { name:'Norges Bank', action:'BUY', shares:6_700_000, value:'Rp147M', date:'2026-03-16' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:3.2, ownershipChange:0.44, correlation:0.88 },
      { volSpike:3.8, ownershipChange:1.82, correlation:0.84 },
      { volSpike:4.1, ownershipChange:4.21, correlation:0.91 },
      { volSpike:3.5, ownershipChange:7.84, correlation:0.87 },
      { volSpike:3.9, ownershipChange:12.44, correlation:0.89 },
    ]),
    confluenceConway: tf([81,77,84,79,82]),
  },
  {
    symbol: 'ASII', name: 'Astra International', exchange: 'IDX',
    ownershipCluster: { institutional:14, retail:29, foreign:7, govRelated:50 },
    netChangeOwnership: tf([
      { institutional:0.04, retail:-0.03, foreign:0.08 },
      { institutional:0.18, retail:-0.12, foreign:0.31 },
      { institutional:0.44, retail:-0.28, foreign:0.72 },
      { institutional:0.88, retail:-0.54, foreign:1.44 },
      { institutional:1.54, retail:-0.98, foreign:2.81 },
    ]),
    smartMoneyScore: tf([55,52,58,54,57]),
    smartMoneyBias: 'NEUTRAL',
    insiderActivity: {
      signal:'NEUTRAL', score:52,
      entities:[
        { name:'Jardine Matheson', action:'HOLD', shares:0, value:'No change', date:'2026-03-10' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:1.4, ownershipChange:0.08, correlation:0.42 },
      { volSpike:1.6, ownershipChange:0.31, correlation:0.38 },
      { volSpike:1.8, ownershipChange:0.72, correlation:0.44 },
      { volSpike:1.5, ownershipChange:1.44, correlation:0.41 },
      { volSpike:1.7, ownershipChange:2.81, correlation:0.43 },
    ]),
    confluenceConway: tf([55,52,58,54,57]),
  },
  {
    symbol: 'GOTO', name: 'GoTo Gojek Tokopedia', exchange: 'IDX',
    ownershipCluster: { institutional:31, retail:41, foreign:22, govRelated:6 },
    netChangeOwnership: tf([
      { institutional:-0.44, retail:0.88, foreign:-0.31 },
      { institutional:-1.82, retail:3.21, foreign:-1.24 },
      { institutional:-4.44, retail:7.84, foreign:-3.11 },
      { institutional:-8.11, retail:14.44, foreign:-5.88 },
      { institutional:-14.44, retail:24.11, foreign:-9.81 },
    ]),
    smartMoneyScore: tf([22,18,25,21,20]),
    smartMoneyBias: 'DISTRIBUTION',
    insiderActivity: {
      signal:'SELLING', score:19,
      entities:[
        { name:'SoftBank Vision Fund', action:'SELL', shares:450_000_000, value:'Rp468M', date:'2026-03-18' },
        { name:'Alibaba Group', action:'REDUCE', shares:180_000_000, value:'Rp187M', date:'2026-03-14' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:4.8, ownershipChange:-0.31, correlation:-0.84 },
      { volSpike:5.2, ownershipChange:-1.24, correlation:-0.88 },
      { volSpike:5.8, ownershipChange:-3.11, correlation:-0.91 },
      { volSpike:4.9, ownershipChange:-5.88, correlation:-0.86 },
      { volSpike:5.4, ownershipChange:-9.81, correlation:-0.89 },
    ]),
    confluenceConway: tf([22,18,25,21,20]),
  },
  {
    symbol: 'ADRO', name: 'Adaro Andalan Indonesia', exchange: 'IDX',
    ownershipCluster: { institutional:18, retail:32, foreign:8, govRelated:42 },
    netChangeOwnership: tf([
      { institutional:0.22, retail:-0.18, foreign:0.41 },
      { institutional:0.88, retail:-0.71, foreign:1.64 },
      { institutional:2.11, retail:-1.74, foreign:3.84 },
      { institutional:3.88, retail:-3.11, foreign:6.81 },
      { institutional:6.44, retail:-5.21, foreign:11.24 },
    ]),
    smartMoneyScore: tf([63,59,67,62,65]),
    smartMoneyBias: 'ACCUMULATION',
    insiderActivity: {
      signal:'BUYING', score:67,
      entities:[
        { name:'Garibaldi Thohir (Insider)', action:'BUY', shares:15_000_000, value:'Rp483M', date:'2026-03-17' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:2.1, ownershipChange:0.41, correlation:0.71 },
      { volSpike:2.4, ownershipChange:1.64, correlation:0.74 },
      { volSpike:2.8, ownershipChange:3.84, correlation:0.78 },
      { volSpike:2.2, ownershipChange:6.81, correlation:0.72 },
      { volSpike:2.6, ownershipChange:11.24, correlation:0.75 },
    ]),
    confluenceConway: tf([63,59,67,62,65]),
  },
  {
    symbol: 'UNTR', name: 'United Tractors', exchange: 'IDX',
    ownershipCluster: { institutional:21, retail:28, foreign:11, govRelated:40 },
    netChangeOwnership: tf([
      { institutional:0.18, retail:-0.14, foreign:0.28 },
      { institutional:0.72, retail:-0.54, foreign:1.11 },
      { institutional:1.84, retail:-1.34, foreign:2.74 },
      { institutional:3.44, retail:-2.44, foreign:4.88 },
      { institutional:5.81, retail:-4.11, foreign:7.84 },
    ]),
    smartMoneyScore: tf([69,65,72,68,70]),
    smartMoneyBias: 'ACCUMULATION',
    insiderActivity: {
      signal:'BUYING', score:71,
      entities:[
        { name:'Astra International (Parent)', action:'BUY', shares:9_400_000, value:'Rp2.35B', date:'2026-03-16' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:1.9, ownershipChange:0.28, correlation:0.68 },
      { volSpike:2.2, ownershipChange:1.11, correlation:0.72 },
      { volSpike:2.5, ownershipChange:2.74, correlation:0.76 },
      { volSpike:2.0, ownershipChange:4.88, correlation:0.69 },
      { volSpike:2.3, ownershipChange:7.84, correlation:0.73 },
    ]),
    confluenceConway: tf([69,65,72,68,70]),
  },
  {
    symbol: 'BBNI', name: 'Bank Negara Indonesia', exchange: 'IDX',
    ownershipCluster: { institutional:16, retail:24, foreign:11, govRelated:60 },
    netChangeOwnership: tf([
      { institutional:-0.12, retail:0.22, foreign:-0.18 },
      { institutional:-0.48, retail:0.84, foreign:-0.71 },
      { institutional:-1.14, retail:1.94, foreign:-1.74 },
      { institutional:-2.11, retail:3.44, foreign:-3.21 },
      { institutional:-3.84, retail:5.81, foreign:-5.44 },
    ]),
    smartMoneyScore: tf([44,41,47,43,45]),
    smartMoneyBias: 'NEUTRAL',
    insiderActivity: {
      signal:'NEUTRAL', score:43,
      entities:[
        { name:'Kementerian BUMN', action:'HOLD', shares:0, value:'No change', date:'2026-03-01' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:1.6, ownershipChange:-0.18, correlation:-0.41 },
      { volSpike:1.8, ownershipChange:-0.71, correlation:-0.44 },
      { volSpike:2.0, ownershipChange:-1.74, correlation:-0.48 },
      { volSpike:1.7, ownershipChange:-3.21, correlation:-0.42 },
      { volSpike:1.9, ownershipChange:-5.44, correlation:-0.45 },
    ]),
    confluenceConway: tf([44,41,47,43,45]),
  },
  {
    symbol: 'PGAS', name: 'Perusahaan Gas Negara', exchange: 'IDX',
    ownershipCluster: { institutional:14, retail:26, foreign:6, govRelated:57 },
    netChangeOwnership: tf([
      { institutional:0.08, retail:-0.06, foreign:0.14 },
      { institutional:0.31, retail:-0.24, foreign:0.54 },
      { institutional:0.74, retail:-0.58, foreign:1.24 },
      { institutional:1.44, retail:-1.11, foreign:2.34 },
      { institutional:2.54, retail:-1.94, foreign:3.94 },
    ]),
    smartMoneyScore: tf([57,53,61,56,59]),
    smartMoneyBias: 'NEUTRAL',
    insiderActivity: {
      signal:'NEUTRAL', score:55,
      entities:[
        { name:'Pertamina (Gov)', action:'HOLD', shares:0, value:'No change', date:'2026-02-28' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:1.5, ownershipChange:0.14, correlation:0.51 },
      { volSpike:1.7, ownershipChange:0.54, correlation:0.54 },
      { volSpike:1.9, ownershipChange:1.24, correlation:0.58 },
      { volSpike:1.6, ownershipChange:2.34, correlation:0.52 },
      { volSpike:1.8, ownershipChange:3.94, correlation:0.55 },
    ]),
    confluenceConway: tf([57,53,61,56,59]),
  },
  {
    symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'US',
    ownershipCluster: { institutional:68, retail:24, foreign:5, govRelated:3 },
    netChangeOwnership: tf([
      { institutional:1.24, retail:-0.88, foreign:0.41 },
      { institutional:4.84, retail:-3.44, foreign:1.64 },
      { institutional:11.44, retail:-8.11, foreign:3.84 },
      { institutional:21.84, retail:-14.44, foreign:6.81 },
      { institutional:38.44, retail:-24.11, foreign:11.24 },
    ]),
    smartMoneyScore: tf([88,84,91,87,89]),
    smartMoneyBias: 'ACCUMULATION',
    insiderActivity: {
      signal:'BUYING', score:82,
      entities:[
        { name:'Vanguard Group', action:'BUY', shares:4_200_000, value:'$580M', date:'2026-03-19' },
        { name:'BlackRock', action:'BUY', shares:3_100_000, value:'$428M', date:'2026-03-18' },
        { name:'Jensen Huang (CEO)', action:'HOLD', shares:0, value:'No change', date:'2026-03-01' },
      ]
    },
    volumeOwnershipCorr: tf([
      { volSpike:3.8, ownershipChange:0.41, correlation:0.91 },
      { volSpike:4.2, ownershipChange:1.64, correlation:0.88 },
      { volSpike:4.8, ownershipChange:3.84, correlation:0.94 },
      { volSpike:4.0, ownershipChange:6.81, correlation:0.89 },
      { volSpike:4.4, ownershipChange:11.24, correlation:0.92 },
    ]),
    confluenceConway: tf([88,84,91,87,89]),
  },
]

// ═══════════════════════════════════════════════════════════════
//  CRYPTO
// ═══════════════════════════════════════════════════════════════

export type CryptoInsight = {
  symbol:     string
  name:       string
  whaleFlow: Record<Timeframe, {
    inflow:   number  // USD
    outflow:  number
    netFlow:  number
    bias:     'INFLOW' | 'OUTFLOW' | 'NEUTRAL'
  }>
  exchangeFlow: Record<Timeframe, {
    exchangeInflow:  number
    exchangeOutflow: number
    netExchange:     number
    pressure:        'SELLING' | 'BUYING' | 'NEUTRAL'
  }>
  smartWallets: {
    label:       string
    type:        'WHALE' | 'INSTITUTION' | 'MINER' | 'EXCHANGE'
    action:      'ACCUMULATING' | 'DISTRIBUTING' | 'HOLDING'
    amount:      string
    pnlPct:      number  // historical PnL of this wallet type
    lastActive:  string
  }[]
  largeTransactions: Record<Timeframe, {
    count:       number
    totalValue:  number  // USD
    avgSize:     number
    dominantDir: 'BUY' | 'SELL' | 'MIXED'
  }>
  fundingRPnL: Record<Timeframe, {
    fundingRate:    number  // %
    realizedPnL:    number  // USD
    unrealizedPnL:  number
    divergence:     'BULLISH' | 'BEARISH' | 'NEUTRAL'
  }>
  confluenceConway: Record<Timeframe, number>
}

export const CRYPTO_DATA: CryptoInsight[] = [
  {
    symbol: 'BTCUSDT', name: 'Bitcoin',
    whaleFlow: tf([
      { inflow:284_000_000, outflow:192_000_000, netFlow:92_000_000, bias:'INFLOW' },
      { inflow:1_284_000_000, outflow:842_000_000, netFlow:442_000_000, bias:'INFLOW' },
      { inflow:4_841_000_000, outflow:3_214_000_000, netFlow:1_627_000_000, bias:'INFLOW' },
      { inflow:12_441_000_000, outflow:9_184_000_000, netFlow:3_257_000_000, bias:'INFLOW' },
      { inflow:48_441_000_000, outflow:38_841_000_000, netFlow:9_600_000_000, bias:'INFLOW' },
    ]),
    exchangeFlow: tf([
      { exchangeInflow:1_284_000_000, exchangeOutflow:1_841_000_000, netExchange:-557_000_000, pressure:'BUYING' },
      { exchangeInflow:4_841_000_000, exchangeOutflow:6_284_000_000, netExchange:-1_443_000_000, pressure:'BUYING' },
      { exchangeInflow:14_441_000_000, exchangeOutflow:18_841_000_000, netExchange:-4_400_000_000, pressure:'BUYING' },
      { exchangeInflow:38_441_000_000, exchangeOutflow:44_841_000_000, netExchange:-6_400_000_000, pressure:'BUYING' },
      { exchangeInflow:148_441_000_000, exchangeOutflow:168_841_000_000, netExchange:-20_400_000_000, pressure:'BUYING' },
    ]),
    smartWallets: [
      { label:'MicroStrategy', type:'INSTITUTION', action:'ACCUMULATING', amount:'3,200 BTC', pnlPct:284, lastActive:'2026-03-19' },
      { label:'Whale #1 (1A2B...)', type:'WHALE', action:'ACCUMULATING', amount:'420 BTC', pnlPct:412, lastActive:'2026-03-18' },
      { label:'Coinbase Prime', type:'EXCHANGE', action:'HOLDING', amount:'0 BTC', pnlPct:0, lastActive:'2026-03-17' },
      { label:'BTC Miners Pool', type:'MINER', action:'DISTRIBUTING', amount:'180 BTC', pnlPct:0, lastActive:'2026-03-19' },
    ],
    largeTransactions: tf([
      { count:284, totalValue:2_841_000_000, avgSize:9_862_000, dominantDir:'BUY' },
      { count:1_284, totalValue:12_841_000_000, avgSize:9_844_000, dominantDir:'BUY' },
      { count:4_841, totalValue:48_841_000_000, avgSize:9_817_000, dominantDir:'BUY' },
      { count:11_441, totalValue:114_841_000_000, avgSize:9_811_000, dominantDir:'BUY' },
      { count:44_841, totalValue:448_841_000_000, avgSize:9_807_000, dominantDir:'BUY' },
    ]),
    fundingRPnL: tf([
      { fundingRate:0.012, realizedPnL:284_000_000, unrealizedPnL:184_000_000, divergence:'BULLISH' },
      { fundingRate:0.018, realizedPnL:1_284_000_000, unrealizedPnL:784_000_000, divergence:'BULLISH' },
      { fundingRate:0.024, realizedPnL:4_841_000_000, unrealizedPnL:2_841_000_000, divergence:'BULLISH' },
      { fundingRate:0.031, realizedPnL:11_841_000_000, unrealizedPnL:7_841_000_000, divergence:'BULLISH' },
      { fundingRate:0.041, realizedPnL:48_841_000_000, unrealizedPnL:28_841_000_000, divergence:'BULLISH' },
    ]),
    confluenceConway: tf([78,74,81,77,79]),
  },
  {
    symbol: 'ETHUSDT', name: 'Ethereum',
    whaleFlow: tf([
      { inflow:142_000_000, outflow:198_000_000, netFlow:-56_000_000, bias:'OUTFLOW' },
      { inflow:584_000_000, outflow:784_000_000, netFlow:-200_000_000, bias:'OUTFLOW' },
      { inflow:2_184_000_000, outflow:2_784_000_000, netFlow:-600_000_000, bias:'OUTFLOW' },
      { inflow:7_184_000_000, outflow:8_784_000_000, netFlow:-1_600_000_000, bias:'OUTFLOW' },
      { inflow:28_184_000_000, outflow:32_784_000_000, netFlow:-4_600_000_000, bias:'OUTFLOW' },
    ]),
    exchangeFlow: tf([
      { exchangeInflow:984_000_000, exchangeOutflow:684_000_000, netExchange:300_000_000, pressure:'SELLING' },
      { exchangeInflow:3_984_000_000, exchangeOutflow:2_684_000_000, netExchange:1_300_000_000, pressure:'SELLING' },
      { exchangeInflow:12_984_000_000, exchangeOutflow:8_684_000_000, netExchange:4_300_000_000, pressure:'SELLING' },
      { exchangeInflow:34_984_000_000, exchangeOutflow:22_684_000_000, netExchange:12_300_000_000, pressure:'SELLING' },
      { exchangeInflow:134_984_000_000, exchangeOutflow:82_684_000_000, netExchange:52_300_000_000, pressure:'SELLING' },
    ]),
    smartWallets: [
      { label:'ETH Foundation', type:'INSTITUTION', action:'DISTRIBUTING', amount:'12,400 ETH', pnlPct:184, lastActive:'2026-03-18' },
      { label:'Whale #2 (2C3D...)', type:'WHALE', action:'DISTRIBUTING', amount:'8,200 ETH', pnlPct:221, lastActive:'2026-03-19' },
      { label:'Lido Staking', type:'INSTITUTION', action:'HOLDING', amount:'0 ETH', pnlPct:0, lastActive:'2026-03-17' },
    ],
    largeTransactions: tf([
      { count:184, totalValue:584_000_000, avgSize:3_174_000, dominantDir:'SELL' },
      { count:784, totalValue:2_484_000_000, avgSize:3_168_000, dominantDir:'SELL' },
      { count:2_984, totalValue:9_484_000_000, avgSize:3_179_000, dominantDir:'SELL' },
      { count:7_984, totalValue:25_484_000_000, avgSize:3_192_000, dominantDir:'SELL' },
      { count:31_984, totalValue:101_484_000_000, avgSize:3_172_000, dominantDir:'SELL' },
    ]),
    fundingRPnL: tf([
      { fundingRate:-0.008, realizedPnL:-184_000_000, unrealizedPnL:-84_000_000, divergence:'BEARISH' },
      { fundingRate:-0.014, realizedPnL:-784_000_000, unrealizedPnL:-384_000_000, divergence:'BEARISH' },
      { fundingRate:-0.021, realizedPnL:-2_784_000_000, unrealizedPnL:-1_384_000_000, divergence:'BEARISH' },
      { fundingRate:-0.028, realizedPnL:-7_784_000_000, unrealizedPnL:-3_784_000_000, divergence:'BEARISH' },
      { fundingRate:-0.038, realizedPnL:-28_784_000_000, unrealizedPnL:-14_784_000_000, divergence:'BEARISH' },
    ]),
    confluenceConway: tf([31,28,34,30,32]),
  },
  {
    symbol: 'SOLUSDT', name: 'Solana',
    whaleFlow: tf([
      { inflow:84_000_000, outflow:54_000_000, netFlow:30_000_000, bias:'INFLOW' },
      { inflow:384_000_000, outflow:214_000_000, netFlow:170_000_000, bias:'INFLOW' },
      { inflow:1_484_000_000, outflow:784_000_000, netFlow:700_000_000, bias:'INFLOW' },
      { inflow:4_484_000_000, outflow:2_184_000_000, netFlow:2_300_000_000, bias:'INFLOW' },
      { inflow:18_484_000_000, outflow:8_184_000_000, netFlow:10_300_000_000, bias:'INFLOW' },
    ]),
    exchangeFlow: tf([
      { exchangeInflow:284_000_000, exchangeOutflow:484_000_000, netExchange:-200_000_000, pressure:'BUYING' },
      { exchangeInflow:1_084_000_000, exchangeOutflow:1_884_000_000, netExchange:-800_000_000, pressure:'BUYING' },
      { exchangeInflow:4_084_000_000, exchangeOutflow:6_884_000_000, netExchange:-2_800_000_000, pressure:'BUYING' },
      { exchangeInflow:12_084_000_000, exchangeOutflow:18_884_000_000, netExchange:-6_800_000_000, pressure:'BUYING' },
      { exchangeInflow:48_084_000_000, exchangeOutflow:68_884_000_000, netExchange:-20_800_000_000, pressure:'BUYING' },
    ]),
    smartWallets: [
      { label:'Jump Crypto', type:'INSTITUTION', action:'ACCUMULATING', amount:'284,000 SOL', pnlPct:341, lastActive:'2026-03-19' },
      { label:'Alameda Remnant (3E4F...)', type:'WHALE', action:'DISTRIBUTING', amount:'84,000 SOL', pnlPct:-42, lastActive:'2026-03-17' },
      { label:'Solana Foundation', type:'INSTITUTION', action:'HOLDING', amount:'0', pnlPct:0, lastActive:'2026-03-15' },
    ],
    largeTransactions: tf([
      { count:284, totalValue:284_000_000, avgSize:1_000_000, dominantDir:'BUY' },
      { count:1_284, totalValue:1_284_000_000, avgSize:1_000_000, dominantDir:'BUY' },
      { count:4_884, totalValue:4_884_000_000, avgSize:1_000_000, dominantDir:'BUY' },
      { count:12_884, totalValue:12_884_000_000, avgSize:1_000_000, dominantDir:'BUY' },
      { count:48_884, totalValue:48_884_000_000, avgSize:1_000_000, dominantDir:'BUY' },
    ]),
    fundingRPnL: tf([
      { fundingRate:0.021, realizedPnL:84_000_000, unrealizedPnL:54_000_000, divergence:'BULLISH' },
      { fundingRate:0.028, realizedPnL:384_000_000, unrealizedPnL:224_000_000, divergence:'BULLISH' },
      { fundingRate:0.034, realizedPnL:1_484_000_000, unrealizedPnL:884_000_000, divergence:'BULLISH' },
      { fundingRate:0.041, realizedPnL:4_484_000_000, unrealizedPnL:2_484_000_000, divergence:'BULLISH' },
      { fundingRate:0.054, realizedPnL:18_484_000_000, unrealizedPnL:8_484_000_000, divergence:'BULLISH' },
    ]),
    confluenceConway: tf([74,69,78,73,76]),
  },
  {
    symbol: 'XAUUSD', name: 'Gold / XAUUSD',
    whaleFlow: tf([
      { inflow:184_000_000, outflow:124_000_000, netFlow:60_000_000, bias:'INFLOW' },
      { inflow:784_000_000, outflow:484_000_000, netFlow:300_000_000, bias:'INFLOW' },
      { inflow:2_784_000_000, outflow:1_684_000_000, netFlow:1_100_000_000, bias:'INFLOW' },
      { inflow:8_784_000_000, outflow:4_684_000_000, netFlow:4_100_000_000, bias:'INFLOW' },
      { inflow:34_784_000_000, outflow:18_684_000_000, netFlow:16_100_000_000, bias:'INFLOW' },
    ]),
    exchangeFlow: tf([
      { exchangeInflow:484_000_000, exchangeOutflow:784_000_000, netExchange:-300_000_000, pressure:'BUYING' },
      { exchangeInflow:1_884_000_000, exchangeOutflow:2_984_000_000, netExchange:-1_100_000_000, pressure:'BUYING' },
      { exchangeInflow:7_184_000_000, exchangeOutflow:10_984_000_000, netExchange:-3_800_000_000, pressure:'BUYING' },
      { exchangeInflow:22_184_000_000, exchangeOutflow:32_984_000_000, netExchange:-10_800_000_000, pressure:'BUYING' },
      { exchangeInflow:88_184_000_000, exchangeOutflow:128_984_000_000, netExchange:-40_800_000_000, pressure:'BUYING' },
    ]),
    smartWallets: [
      { label:'Grayscale GBTC', type:'INSTITUTION', action:'ACCUMULATING', amount:'$284M', pnlPct:184, lastActive:'2026-03-19' },
      { label:'BlackRock iShares', type:'INSTITUTION', action:'ACCUMULATING', amount:'$484M', pnlPct:141, lastActive:'2026-03-18' },
    ],
    largeTransactions: tf([
      { count:84, totalValue:184_000_000, avgSize:2_190_000, dominantDir:'BUY' },
      { count:384, totalValue:784_000_000, avgSize:2_042_000, dominantDir:'BUY' },
      { count:1_484, totalValue:2_984_000_000, avgSize:2_010_000, dominantDir:'BUY' },
      { count:4_484, totalValue:8_984_000_000, avgSize:2_003_000, dominantDir:'BUY' },
      { count:18_484, totalValue:36_984_000_000, avgSize:2_001_000, dominantDir:'BUY' },
    ]),
    fundingRPnL: tf([
      { fundingRate:0.004, realizedPnL:84_000_000, unrealizedPnL:44_000_000, divergence:'BULLISH' },
      { fundingRate:0.008, realizedPnL:384_000_000, unrealizedPnL:184_000_000, divergence:'BULLISH' },
      { fundingRate:0.012, realizedPnL:1_484_000_000, unrealizedPnL:684_000_000, divergence:'BULLISH' },
      { fundingRate:0.018, realizedPnL:4_484_000_000, unrealizedPnL:2_084_000_000, divergence:'BULLISH' },
      { fundingRate:0.024, realizedPnL:18_484_000_000, unrealizedPnL:8_084_000_000, divergence:'BULLISH' },
    ]),
    confluenceConway: tf([82,78,86,81,84]),
  },
  {
    symbol: 'BNBUSDT', name: 'BNB',
    whaleFlow: tf([
      { inflow:44_000_000, outflow:62_000_000, netFlow:-18_000_000, bias:'OUTFLOW' },
      { inflow:184_000_000, outflow:244_000_000, netFlow:-60_000_000, bias:'OUTFLOW' },
      { inflow:684_000_000, outflow:884_000_000, netFlow:-200_000_000, bias:'OUTFLOW' },
      { inflow:2_084_000_000, outflow:2_684_000_000, netFlow:-600_000_000, bias:'OUTFLOW' },
      { inflow:8_084_000_000, outflow:10_484_000_000, netFlow:-2_400_000_000, bias:'OUTFLOW' },
    ]),
    exchangeFlow: tf([
      { exchangeInflow:184_000_000, exchangeOutflow:124_000_000, netExchange:60_000_000, pressure:'SELLING' },
      { exchangeInflow:784_000_000, exchangeOutflow:484_000_000, netExchange:300_000_000, pressure:'SELLING' },
      { exchangeInflow:2_984_000_000, exchangeOutflow:1_784_000_000, netExchange:1_200_000_000, pressure:'SELLING' },
      { exchangeInflow:8_984_000_000, exchangeOutflow:5_184_000_000, netExchange:3_800_000_000, pressure:'SELLING' },
      { exchangeInflow:36_984_000_000, exchangeOutflow:20_184_000_000, netExchange:16_800_000_000, pressure:'SELLING' },
    ]),
    smartWallets: [
      { label:'Binance Labs', type:'INSTITUTION', action:'HOLDING', amount:'0 BNB', pnlPct:0, lastActive:'2026-03-15' },
      { label:'CZ Wallet (5G6H...)', type:'WHALE', action:'DISTRIBUTING', amount:'84,000 BNB', pnlPct:1841, lastActive:'2026-03-18' },
    ],
    largeTransactions: tf([
      { count:84, totalValue:84_000_000, avgSize:1_000_000, dominantDir:'SELL' },
      { count:384, totalValue:384_000_000, avgSize:1_000_000, dominantDir:'SELL' },
      { count:1_484, totalValue:1_484_000_000, avgSize:1_000_000, dominantDir:'SELL' },
      { count:4_484, totalValue:4_484_000_000, avgSize:1_000_000, dominantDir:'SELL' },
      { count:18_484, totalValue:18_484_000_000, avgSize:1_000_000, dominantDir:'SELL' },
    ]),
    fundingRPnL: tf([
      { fundingRate:-0.004, realizedPnL:-44_000_000, unrealizedPnL:-24_000_000, divergence:'BEARISH' },
      { fundingRate:-0.008, realizedPnL:-184_000_000, unrealizedPnL:-84_000_000, divergence:'BEARISH' },
      { fundingRate:-0.012, realizedPnL:-684_000_000, unrealizedPnL:-284_000_000, divergence:'BEARISH' },
      { fundingRate:-0.018, realizedPnL:-2_084_000_000, unrealizedPnL:-884_000_000, divergence:'BEARISH' },
      { fundingRate:-0.024, realizedPnL:-8_084_000_000, unrealizedPnL:-3_484_000_000, divergence:'BEARISH' },
    ]),
    confluenceConway: tf([28,24,31,27,29]),
  },
]

// ═══════════════════════════════════════════════════════════════
//  COMMODITY
// ═══════════════════════════════════════════════════════════════

export type CommodityInsight = {
  symbol:  string
  name:    string
  unit:    string
  cftcPositioning: Record<Timeframe, {
    hedgeFundsNet:    number  // contracts
    commercialsNet:   number
    smallTradersNet:  number
    bias:             'BULLISH' | 'BEARISH' | 'NEUTRAL'
  }>
  weeklyNetChange: Record<Timeframe, { hedgeFunds: number; commercials: number }>
  producerHedging: Record<Timeframe, {
    hedgingRatio:  number  // 0–100%
    bias:          'INCREASING' | 'DECREASING' | 'STABLE'
    signalStr:     number  // 0–100 (how strongly producers are hedging)
  }>
  supplyRisk: {
    score:   number  // 0–100
    factors: { factor: string; impact: 'HIGH' | 'MEDIUM' | 'LOW'; detail: string }[]
  }
  seasonal: Record<Timeframe, {
    historicalBias:  'BULLISH' | 'BEARISH' | 'NEUTRAL'
    avgReturn:       number  // %
    consistency:     number  // 0–100
  }>
  macroCorr: {
    dxy:          number  // -1 to 1
    interestRate: number
    inflation:    number
    overall:      'BULLISH' | 'BEARISH' | 'NEUTRAL'
  }
  confluenceConway: Record<Timeframe, number>
}

export const COMMODITY_DATA: CommodityInsight[] = [
  {
    symbol: 'XAUUSD', name: 'Gold', unit: 'USD/oz',
    cftcPositioning: tf([
      { hedgeFundsNet:284_000, commercialsNet:-184_000, smallTradersNet:-100_000, bias:'BULLISH' },
      { hedgeFundsNet:312_000, commercialsNet:-201_000, smallTradersNet:-111_000, bias:'BULLISH' },
      { hedgeFundsNet:341_000, commercialsNet:-221_000, smallTradersNet:-120_000, bias:'BULLISH' },
      { hedgeFundsNet:298_000, commercialsNet:-194_000, smallTradersNet:-104_000, bias:'BULLISH' },
      { hedgeFundsNet:271_000, commercialsNet:-174_000, smallTradersNet:-97_000, bias:'BULLISH' },
    ]),
    weeklyNetChange: tf([
      { hedgeFunds:+12_000, commercials:-8_000 },
      { hedgeFunds:+28_000, commercials:-17_000 },
      { hedgeFunds:+57_000, commercials:-37_000 },
      { hedgeFunds:+14_000, commercials:-10_000 },
      { hedgeFunds:-13_000, commercials:+9_000 },
    ]),
    producerHedging: tf([
      { hedgingRatio:72, bias:'INCREASING', signalStr:78 },
      { hedgingRatio:74, bias:'INCREASING', signalStr:81 },
      { hedgingRatio:68, bias:'STABLE', signalStr:72 },
      { hedgingRatio:71, bias:'INCREASING', signalStr:76 },
      { hedgingRatio:65, bias:'STABLE', signalStr:68 },
    ]),
    supplyRisk: {
      score:42,
      factors:[
        { factor:'Geopolitical tensions (Middle East)', impact:'HIGH', detail:'Central bank buying accelerating' },
        { factor:'USD weakness trend', impact:'MEDIUM', detail:'DXY -3.2% YTD supporting gold' },
        { factor:'Mining output stable', impact:'LOW', detail:'South Africa, Australia production normal' },
      ]
    },
    seasonal: tf([
      { historicalBias:'BULLISH', avgReturn:1.4, consistency:68 },
      { historicalBias:'BULLISH', avgReturn:3.8, consistency:72 },
      { historicalBias:'BULLISH', avgReturn:7.2, consistency:71 },
      { historicalBias:'BULLISH', avgReturn:12.4, consistency:74 },
      { historicalBias:'BULLISH', avgReturn:8.1, consistency:69 },
    ]),
    macroCorr:{ dxy:-0.84, interestRate:-0.61, inflation:0.72, overall:'BULLISH' },
    confluenceConway: tf([84,80,88,83,86]),
  },
  {
    symbol: 'WTIUSD', name: 'WTI Crude Oil', unit: 'USD/bbl',
    cftcPositioning: tf([
      { hedgeFundsNet:184_000, commercialsNet:-284_000, smallTradersNet:100_000, bias:'NEUTRAL' },
      { hedgeFundsNet:164_000, commercialsNet:-264_000, smallTradersNet:100_000, bias:'NEUTRAL' },
      { hedgeFundsNet:148_000, commercialsNet:-244_000, smallTradersNet:96_000, bias:'BEARISH' },
      { hedgeFundsNet:198_000, commercialsNet:-294_000, smallTradersNet:96_000, bias:'NEUTRAL' },
      { hedgeFundsNet:214_000, commercialsNet:-314_000, smallTradersNet:100_000, bias:'BULLISH' },
    ]),
    weeklyNetChange: tf([
      { hedgeFunds:-8_000, commercials:+5_000 },
      { hedgeFunds:-20_000, commercials:+14_000 },
      { hedgeFunds:-36_000, commercials:+40_000 },
      { hedgeFunds:-16_000, commercials:+10_000 },
      { hedgeFunds:+30_000, commercials:-20_000 },
    ]),
    producerHedging: tf([
      { hedgingRatio:58, bias:'DECREASING', signalStr:44 },
      { hedgingRatio:54, bias:'DECREASING', signalStr:40 },
      { hedgingRatio:48, bias:'DECREASING', signalStr:35 },
      { hedgingRatio:62, bias:'STABLE', signalStr:51 },
      { hedgingRatio:71, bias:'INCREASING', signalStr:62 },
    ]),
    supplyRisk:{
      score:68,
      factors:[
        { factor:'OPEC+ production cuts', impact:'HIGH', detail:'Saudi Arabia extending voluntary cuts' },
        { factor:'US shale output growth', impact:'MEDIUM', detail:'Permian Basin adding 0.4M bpd' },
        { factor:'Red Sea shipping disruption', impact:'HIGH', detail:'Freight costs +28% since Nov 2025' },
      ]
    },
    seasonal: tf([
      { historicalBias:'BEARISH', avgReturn:-1.8, consistency:54 },
      { historicalBias:'BEARISH', avgReturn:-3.2, consistency:58 },
      { historicalBias:'NEUTRAL', avgReturn:0.4, consistency:48 },
      { historicalBias:'BULLISH', avgReturn:4.1, consistency:61 },
      { historicalBias:'NEUTRAL', avgReturn:1.2, consistency:52 },
    ]),
    macroCorr:{ dxy:-0.44, interestRate:-0.28, inflation:0.84, overall:'NEUTRAL' },
    confluenceConway: tf([48,44,51,47,50]),
  },
  {
    symbol: 'XAGUSD', name: 'Silver', unit: 'USD/oz',
    cftcPositioning: tf([
      { hedgeFundsNet:84_000, commercialsNet:-124_000, smallTradersNet:40_000, bias:'BULLISH' },
      { hedgeFundsNet:94_000, commercialsNet:-134_000, smallTradersNet:40_000, bias:'BULLISH' },
      { hedgeFundsNet:104_000, commercialsNet:-148_000, smallTradersNet:44_000, bias:'BULLISH' },
      { hedgeFundsNet:88_000, commercialsNet:-124_000, smallTradersNet:36_000, bias:'BULLISH' },
      { hedgeFundsNet:78_000, commercialsNet:-112_000, smallTradersNet:34_000, bias:'NEUTRAL' },
    ]),
    weeklyNetChange: tf([
      { hedgeFunds:+8_000, commercials:-6_000 },
      { hedgeFunds:+20_000, commercials:-14_000 },
      { hedgeFunds:+26_000, commercials:-24_000 },
      { hedgeFunds:+10_000, commercials:-12_000 },
      { hedgeFunds:-10_000, commercials:+8_000 },
    ]),
    producerHedging: tf([
      { hedgingRatio:64, bias:'INCREASING', signalStr:69 },
      { hedgingRatio:68, bias:'INCREASING', signalStr:74 },
      { hedgingRatio:61, bias:'STABLE', signalStr:65 },
      { hedgingRatio:65, bias:'INCREASING', signalStr:70 },
      { hedgingRatio:58, bias:'STABLE', signalStr:61 },
    ]),
    supplyRisk:{
      score:38,
      factors:[
        { factor:'Industrial demand (solar panels)', impact:'HIGH', detail:'Silver demand from solar sector +24% YoY' },
        { factor:'Mining output Mexico', impact:'MEDIUM', detail:'Fresnillo production stable' },
        { factor:'Gold/Silver ratio elevated', impact:'MEDIUM', detail:'Ratio at 88x — silver historically undervalued' },
      ]
    },
    seasonal: tf([
      { historicalBias:'BULLISH', avgReturn:2.1, consistency:64 },
      { historicalBias:'BULLISH', avgReturn:4.8, consistency:68 },
      { historicalBias:'BULLISH', avgReturn:9.4, consistency:66 },
      { historicalBias:'BULLISH', avgReturn:15.8, consistency:71 },
      { historicalBias:'BULLISH', avgReturn:11.2, consistency:67 },
    ]),
    macroCorr:{ dxy:-0.71, interestRate:-0.48, inflation:0.81, overall:'BULLISH' },
    confluenceConway: tf([71,67,75,70,73]),
  },
  {
    symbol: 'XCUUSD', name: 'Copper', unit: 'USD/lb',
    cftcPositioning: tf([
      { hedgeFundsNet:44_000, commercialsNet:-84_000, smallTradersNet:40_000, bias:'NEUTRAL' },
      { hedgeFundsNet:38_000, commercialsNet:-74_000, smallTradersNet:36_000, bias:'NEUTRAL' },
      { hedgeFundsNet:28_000, commercialsNet:-58_000, smallTradersNet:30_000, bias:'BEARISH' },
      { hedgeFundsNet:54_000, commercialsNet:-94_000, smallTradersNet:40_000, bias:'BULLISH' },
      { hedgeFundsNet:64_000, commercialsNet:-108_000, smallTradersNet:44_000, bias:'BULLISH' },
    ]),
    weeklyNetChange: tf([
      { hedgeFunds:-4_000, commercials:+3_000 },
      { hedgeFunds:-16_000, commercials:+10_000 },
      { hedgeFunds:-16_000, commercials:+26_000 },
      { hedgeFunds:+26_000, commercials:-16_000 },
      { hedgeFunds:+20_000, commercials:-14_000 },
    ]),
    producerHedging: tf([
      { hedgingRatio:48, bias:'STABLE', signalStr:52 },
      { hedgingRatio:44, bias:'DECREASING', signalStr:47 },
      { hedgingRatio:38, bias:'DECREASING', signalStr:41 },
      { hedgingRatio:54, bias:'INCREASING', signalStr:58 },
      { hedgingRatio:62, bias:'INCREASING', signalStr:66 },
    ]),
    supplyRisk:{
      score:54,
      factors:[
        { factor:'Chile mining strikes', impact:'HIGH', detail:'Codelco production down 8% Q1 2026' },
        { factor:'EV demand growth', impact:'HIGH', detail:'Copper demand from EVs +31% YoY' },
        { factor:'China slowdown', impact:'MEDIUM', detail:'Property sector weakness reducing demand' },
      ]
    },
    seasonal: tf([
      { historicalBias:'NEUTRAL', avgReturn:0.8, consistency:51 },
      { historicalBias:'BULLISH', avgReturn:2.4, consistency:58 },
      { historicalBias:'BULLISH', avgReturn:5.8, consistency:62 },
      { historicalBias:'BULLISH', avgReturn:8.4, consistency:64 },
      { historicalBias:'NEUTRAL', avgReturn:1.4, consistency:54 },
    ]),
    macroCorr:{ dxy:-0.54, interestRate:-0.31, inflation:0.64, overall:'NEUTRAL' },
    confluenceConway: tf([54,50,58,53,56]),
  },
]

// ═══════════════════════════════════════════════════════════════
//  FOREX
// ═══════════════════════════════════════════════════════════════

export type ForexInsight = {
  symbol:    string
  name:      string
  base:      string
  quote:     string
  cftcBIS: Record<Timeframe, {
    leveragedFundsNet:  number  // contracts
    assetManagersNet:   number
    centralBankBias:    'HAWKISH' | 'DOVISH' | 'NEUTRAL'
    overallBias:        'BULLISH' | 'BEARISH' | 'NEUTRAL'  // for base currency
  }>
  carryTrade: Record<Timeframe, {
    interestDiff:  number  // % annualized
    carryScore:    number  // 0–100
    flowBias:      'INFLOW' | 'OUTFLOW' | 'NEUTRAL'
    riskAppetite:  'RISK-ON' | 'RISK-OFF' | 'NEUTRAL'
  }>
  leveragedVsAssetMgr: Record<Timeframe, {
    leveragedPos:  number  // net % long
    assetMgrPos:   number
    divergence:    'BULLISH' | 'BEARISH' | 'NEUTRAL'
    divergenceStr: number  // 0–100
  }>
  centralBankSignal: {
    bank:        string
    lastAction:  string
    nextMeeting: string
    signal:      'HAWKISH' | 'DOVISH' | 'NEUTRAL'
    score:       number  // 0–100 (100 = very hawkish)
    commentary:  string
  }
  sentimentVsPrice: Record<Timeframe, {
    sentimentScore:  number  // 0–100 (50=neutral)
    priceChange:     number  // %
    divergence:      'BULLISH' | 'BEARISH' | 'NEUTRAL'  // signal divergence gives
    divergenceStr:   number  // 0–100
  }>
  confluenceConway: Record<Timeframe, number>
}

export const FOREX_DATA: ForexInsight[] = [
  {
    symbol: 'EURUSD', name: 'EUR/USD', base:'EUR', quote:'USD',
    cftcBIS: tf([
      { leveragedFundsNet:84_000, assetManagersNet:124_000, centralBankBias:'DOVISH', overallBias:'BULLISH' },
      { leveragedFundsNet:94_000, assetManagersNet:134_000, centralBankBias:'DOVISH', overallBias:'BULLISH' },
      { leveragedFundsNet:108_000, assetManagersNet:148_000, centralBankBias:'NEUTRAL', overallBias:'BULLISH' },
      { leveragedFundsNet:84_000, assetManagersNet:114_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:64_000, assetManagersNet:94_000, centralBankBias:'HAWKISH', overallBias:'NEUTRAL' },
    ]),
    carryTrade: tf([
      { interestDiff:-1.8, carryScore:28, flowBias:'OUTFLOW', riskAppetite:'RISK-OFF' },
      { interestDiff:-1.8, carryScore:28, flowBias:'OUTFLOW', riskAppetite:'RISK-OFF' },
      { interestDiff:-1.6, carryScore:32, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:-1.4, carryScore:36, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:-0.8, carryScore:42, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
    ]),
    leveragedVsAssetMgr: tf([
      { leveragedPos:58, assetMgrPos:62, divergence:'NEUTRAL', divergenceStr:18 },
      { leveragedPos:61, assetMgrPos:64, divergence:'NEUTRAL', divergenceStr:14 },
      { leveragedPos:67, assetMgrPos:71, divergence:'BULLISH', divergenceStr:28 },
      { leveragedPos:54, assetMgrPos:58, divergence:'NEUTRAL', divergenceStr:21 },
      { leveragedPos:44, assetMgrPos:52, divergence:'BEARISH', divergenceStr:34 },
    ]),
    centralBankSignal:{
      bank:'ECB', lastAction:'Rate hold at 2.75% — Feb 2026',
      nextMeeting:'April 10, 2026', signal:'DOVISH', score:38,
      commentary:'ECB signals potential cut in Q2 2026 as inflation approaches 2% target. Lagarde speech March 15 hinted at easing bias.',
    },
    sentimentVsPrice: tf([
      { sentimentScore:62, priceChange:0.34, divergence:'NEUTRAL', divergenceStr:12 },
      { sentimentScore:64, priceChange:1.24, divergence:'BULLISH', divergenceStr:24 },
      { sentimentScore:68, priceChange:2.84, divergence:'BULLISH', divergenceStr:31 },
      { sentimentScore:58, priceChange:1.14, divergence:'NEUTRAL', divergenceStr:18 },
      { sentimentScore:52, priceChange:-0.84, divergence:'BEARISH', divergenceStr:28 },
    ]),
    confluenceConway: tf([62,58,66,61,64]),
  },
  {
    symbol: 'USDJPY', name: 'USD/JPY', base:'USD', quote:'JPY',
    cftcBIS: tf([
      { leveragedFundsNet:-84_000, assetManagersNet:-124_000, centralBankBias:'HAWKISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-94_000, assetManagersNet:-134_000, centralBankBias:'HAWKISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-108_000, assetManagersNet:-154_000, centralBankBias:'HAWKISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-74_000, assetManagersNet:-108_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:-54_000, assetManagersNet:-84_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
    ]),
    carryTrade: tf([
      { interestDiff:3.8, carryScore:72, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:3.6, carryScore:68, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:3.2, carryScore:61, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:4.1, carryScore:78, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:4.8, carryScore:84, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
    ]),
    leveragedVsAssetMgr: tf([
      { leveragedPos:28, assetMgrPos:34, divergence:'BEARISH', divergenceStr:42 },
      { leveragedPos:24, assetMgrPos:31, divergence:'BEARISH', divergenceStr:48 },
      { leveragedPos:18, assetMgrPos:24, divergence:'BEARISH', divergenceStr:58 },
      { leveragedPos:34, assetMgrPos:41, divergence:'BEARISH', divergenceStr:34 },
      { leveragedPos:42, assetMgrPos:51, divergence:'NEUTRAL', divergenceStr:24 },
    ]),
    centralBankSignal:{
      bank:'BOJ', lastAction:'Rate hike to 0.75% — Jan 2026',
      nextMeeting:'April 30, 2026', signal:'HAWKISH', score:72,
      commentary:'BOJ signals further normalization. Ueda comments suggest 2 more hikes possible in 2026. Intervention risk elevated above 155.',
    },
    sentimentVsPrice: tf([
      { sentimentScore:32, priceChange:-0.84, divergence:'BEARISH', divergenceStr:44 },
      { sentimentScore:28, priceChange:-2.14, divergence:'BEARISH', divergenceStr:51 },
      { sentimentScore:24, priceChange:-4.84, divergence:'BEARISH', divergenceStr:61 },
      { sentimentScore:38, priceChange:-1.84, divergence:'BEARISH', divergenceStr:38 },
      { sentimentScore:48, priceChange:0.84, divergence:'NEUTRAL', divergenceStr:24 },
    ]),
    confluenceConway: tf([38,34,41,37,40]),
  },
  {
    symbol: 'GBPUSD', name: 'GBP/USD', base:'GBP', quote:'USD',
    cftcBIS: tf([
      { leveragedFundsNet:44_000, assetManagersNet:64_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:48_000, assetManagersNet:68_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:54_000, assetManagersNet:78_000, centralBankBias:'DOVISH', overallBias:'NEUTRAL' },
      { leveragedFundsNet:38_000, assetManagersNet:54_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:28_000, assetManagersNet:44_000, centralBankBias:'HAWKISH', overallBias:'BEARISH' },
    ]),
    carryTrade: tf([
      { interestDiff:0.4, carryScore:52, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:0.4, carryScore:52, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:0.2, carryScore:49, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:0.6, carryScore:54, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:1.1, carryScore:58, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
    ]),
    leveragedVsAssetMgr: tf([
      { leveragedPos:54, assetMgrPos:58, divergence:'NEUTRAL', divergenceStr:16 },
      { leveragedPos:56, assetMgrPos:61, divergence:'NEUTRAL', divergenceStr:18 },
      { leveragedPos:61, assetMgrPos:68, divergence:'BULLISH', divergenceStr:26 },
      { leveragedPos:48, assetMgrPos:52, divergence:'NEUTRAL', divergenceStr:14 },
      { leveragedPos:38, assetMgrPos:46, divergence:'BEARISH', divergenceStr:28 },
    ]),
    centralBankSignal:{
      bank:'BOE', lastAction:'Rate hold at 4.75% — Feb 2026',
      nextMeeting:'May 8, 2026', signal:'NEUTRAL', score:51,
      commentary:'BOE split vote 5-4 for hold. Bailey signals data-dependency. UK inflation at 2.8% remains above target.',
    },
    sentimentVsPrice: tf([
      { sentimentScore:54, priceChange:0.18, divergence:'NEUTRAL', divergenceStr:8 },
      { sentimentScore:56, priceChange:0.84, divergence:'NEUTRAL', divergenceStr:12 },
      { sentimentScore:61, priceChange:1.84, divergence:'BULLISH', divergenceStr:22 },
      { sentimentScore:48, priceChange:0.44, divergence:'NEUTRAL', divergenceStr:16 },
      { sentimentScore:42, priceChange:-0.84, divergence:'BEARISH', divergenceStr:24 },
    ]),
    confluenceConway: tf([52,48,56,51,54]),
  },
  {
    symbol: 'AUDUSD', name: 'AUD/USD', base:'AUD', quote:'USD',
    cftcBIS: tf([
      { leveragedFundsNet:-44_000, assetManagersNet:-34_000, centralBankBias:'DOVISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-54_000, assetManagersNet:-44_000, centralBankBias:'DOVISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-68_000, assetManagersNet:-54_000, centralBankBias:'DOVISH', overallBias:'BEARISH' },
      { leveragedFundsNet:-34_000, assetManagersNet:-24_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
      { leveragedFundsNet:-14_000, assetManagersNet:-8_000, centralBankBias:'NEUTRAL', overallBias:'NEUTRAL' },
    ]),
    carryTrade: tf([
      { interestDiff:0.6, carryScore:54, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:0.4, carryScore:51, flowBias:'NEUTRAL', riskAppetite:'NEUTRAL' },
      { interestDiff:0.1, carryScore:47, flowBias:'OUTFLOW', riskAppetite:'RISK-OFF' },
      { interestDiff:0.8, carryScore:56, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
      { interestDiff:1.4, carryScore:61, flowBias:'INFLOW', riskAppetite:'RISK-ON' },
    ]),
    leveragedVsAssetMgr: tf([
      { leveragedPos:38, assetMgrPos:44, divergence:'BEARISH', divergenceStr:24 },
      { leveragedPos:32, assetMgrPos:38, divergence:'BEARISH', divergenceStr:28 },
      { leveragedPos:24, assetMgrPos:32, divergence:'BEARISH', divergenceStr:34 },
      { leveragedPos:46, assetMgrPos:52, divergence:'NEUTRAL', divergenceStr:18 },
      { leveragedPos:58, assetMgrPos:64, divergence:'NEUTRAL', divergenceStr:14 },
    ]),
    centralBankSignal:{
      bank:'RBA', lastAction:'Rate cut to 4.1% — Feb 2026',
      nextMeeting:'April 1, 2026', signal:'DOVISH', score:34,
      commentary:'RBA commenced easing cycle. Bullock signals gradual approach — 2-3 more cuts expected through 2026. AUD under pressure.',
    },
    sentimentVsPrice: tf([
      { sentimentScore:38, priceChange:-0.44, divergence:'BEARISH', divergenceStr:28 },
      { sentimentScore:34, priceChange:-1.24, divergence:'BEARISH', divergenceStr:34 },
      { sentimentScore:28, priceChange:-2.84, divergence:'BEARISH', divergenceStr:41 },
      { sentimentScore:44, priceChange:-0.84, divergence:'BEARISH', divergenceStr:24 },
      { sentimentScore:54, priceChange:0.84, divergence:'NEUTRAL', divergenceStr:16 },
    ]),
    confluenceConway: tf([34,30,38,33,36]),
  },
]
