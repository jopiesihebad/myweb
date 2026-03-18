// ─────────────────────────────────────────────────────────────
//  lib/assetRegistry.ts  —  SS BlackBox Asset Registry
//  PINE_ASSETS  : 24 locked assets (3 TradingView tabs)
//  DASHBOARD_ASSETS : expanded registry per asset class
//  ASSET_REGISTRY   : full combined registry
// ─────────────────────────────────────────────────────────────

export type AssetClass = 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'IDX' | 'USA'

export type Asset = {
  ticker:    string          // canonical ticker (e.g. "BTCUSDT", "BBCA")
  name:      string          // display name
  assetClass: AssetClass
  exchange:  string          // exchange prefix for TradingView (e.g. "BINANCE", "IDX")
  precision: number          // decimal places for price display
  priceFmt:  'crypto' | 'forex' | 'stock' | 'commodity'
}

// ─── PINE SCRIPT TABS (LOCKED — DO NOT CHANGE) ───────────────
// Tab 1: Crypto + Commodity (8 assets)
// Tab 2: Forex + IDX        (8 assets)
// Tab 3: USA Stocks         (8 assets)

export const PINE_ASSETS: Asset[] = [
  // TAB 1 — CRYPTO + COMMODITY
  { ticker: 'BTCUSDT',  name: 'Bitcoin',        assetClass: 'CRYPTO',    exchange: 'BINANCE', precision: 2,  priceFmt: 'crypto'    },
  { ticker: 'ETHUSDT',  name: 'Ethereum',        assetClass: 'CRYPTO',    exchange: 'BINANCE', precision: 2,  priceFmt: 'crypto'    },
  { ticker: 'SOLUSDT',  name: 'Solana',          assetClass: 'CRYPTO',    exchange: 'BINANCE', precision: 2,  priceFmt: 'crypto'    },
  { ticker: 'BNBUSDT',  name: 'BNB',             assetClass: 'CRYPTO',    exchange: 'BINANCE', precision: 2,  priceFmt: 'crypto'    },
  { ticker: 'XAUUSD',   name: 'Gold',            assetClass: 'COMMODITY', exchange: 'OANDA',   precision: 2,  priceFmt: 'commodity' },
  { ticker: 'WTIUSD',   name: 'WTI Crude Oil',   assetClass: 'COMMODITY', exchange: 'OANDA',   precision: 2,  priceFmt: 'commodity' },
  { ticker: 'XAGUSD',   name: 'Silver',          assetClass: 'COMMODITY', exchange: 'OANDA',   precision: 4,  priceFmt: 'commodity' },
  { ticker: 'XCUUSD',   name: 'Copper',          assetClass: 'COMMODITY', exchange: 'OANDA',   precision: 4,  priceFmt: 'commodity' },
  // TAB 2 — FOREX + IDX
  { ticker: 'EURUSD',   name: 'Euro / USD',      assetClass: 'FOREX',     exchange: 'OANDA',   precision: 5,  priceFmt: 'forex'     },
  { ticker: 'GBPUSD',   name: 'GBP / USD',       assetClass: 'FOREX',     exchange: 'OANDA',   precision: 5,  priceFmt: 'forex'     },
  { ticker: 'USDJPY',   name: 'USD / JPY',        assetClass: 'FOREX',     exchange: 'OANDA',   precision: 3,  priceFmt: 'forex'     },
  { ticker: 'AUDUSD',   name: 'AUD / USD',        assetClass: 'FOREX',     exchange: 'OANDA',   precision: 5,  priceFmt: 'forex'     },
  { ticker: 'BBCA',     name: 'Bank BCA',         assetClass: 'IDX',       exchange: 'IDX',     precision: 0,  priceFmt: 'stock'     },
  { ticker: 'BBRI',     name: 'Bank BRI',         assetClass: 'IDX',       exchange: 'IDX',     precision: 0,  priceFmt: 'stock'     },
  { ticker: 'ANTM',     name: 'Aneka Tambang',    assetClass: 'IDX',       exchange: 'IDX',     precision: 0,  priceFmt: 'stock'     },
  { ticker: 'ASII',     name: 'Astra International', assetClass: 'IDX',   exchange: 'IDX',     precision: 0,  priceFmt: 'stock'     },
  // TAB 3 — USA
  { ticker: 'NVDA',     name: 'NVIDIA',           assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'SPY',      name: 'S&P 500 ETF',      assetClass: 'USA',       exchange: 'AMEX',    precision: 2,  priceFmt: 'stock'     },
  { ticker: 'AAPL',     name: 'Apple',            assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'TSLA',     name: 'Tesla',            assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'META',     name: 'Meta Platforms',   assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'MSFT',     name: 'Microsoft',        assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'QQQ',      name: 'Nasdaq 100 ETF',   assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
  { ticker: 'AMD',      name: 'AMD',              assetClass: 'USA',       exchange: 'NASDAQ',  precision: 2,  priceFmt: 'stock'     },
]

// ─── DASHBOARD EXPANDED ASSETS (per class) ───────────────────

const IDX_ASSETS: Asset[] = [
  { ticker: 'BBCA',  name: 'Bank BCA',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BBRI',  name: 'Bank BRI',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BMRI',  name: 'Bank Mandiri',          assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BBNI',  name: 'Bank BNI',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BBTN',  name: 'Bank BTN',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BRIS',  name: 'Bank BSI',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ANTM',  name: 'Aneka Tambang',         assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'PTBA',  name: 'Bukit Asam',           assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'INCO',  name: 'Vale Indonesia',        assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ADRO',  name: 'Adaro Energy',          assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'HRUM',  name: 'Harum Energy',          assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ITMG',  name: 'Indo Tambangraya',      assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'MDKA',  name: 'Merdeka Copper Gold',   assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'AMMN',  name: 'Amman Mineral',         assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ASII',  name: 'Astra International',   assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ICBP',  name: 'Indofood CBP',          assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'INDF',  name: 'Indofood',              assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'UNVR',  name: 'Unilever Indonesia',    assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'KLBF',  name: 'Kalbe Farma',           assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'CPIN',  name: 'Charoen Pokphand',      assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'MAPI',  name: 'Mitra Adiperkasa',      assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'UNTR',  name: 'United Tractors',       assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'TLKM',  name: 'Telkom Indonesia',      assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'EXCL',  name: 'XL Axiata',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'TOWR',  name: 'Sarana Menara',         assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'BREN',  name: 'Barito Renewables',     assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'TPIA',  name: 'Chandra Asri',          assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'PGAS',  name: 'Perusahaan Gas Negara', assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'ARTO',  name: 'Bank Jago',             assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
  { ticker: 'GOTO',  name: 'GoTo Gojek Tokopedia',  assetClass: 'IDX', exchange: 'IDX', precision: 0, priceFmt: 'stock' },
]

const USA_ASSETS: Asset[] = [
  { ticker: 'NVDA',  name: 'NVIDIA',            assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'AAPL',  name: 'Apple',             assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'TSLA',  name: 'Tesla',             assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'MSFT',  name: 'Microsoft',         assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'AMZN',  name: 'Amazon',            assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'META',  name: 'Meta Platforms',    assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet',          assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'AMD',   name: 'AMD',               assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'SPY',   name: 'S&P 500 ETF',       assetClass: 'USA', exchange: 'AMEX',   precision: 2, priceFmt: 'stock' },
  { ticker: 'QQQ',   name: 'Nasdaq 100 ETF',    assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'IWM',   name: 'Russell 2000 ETF',  assetClass: 'USA', exchange: 'AMEX',   precision: 2, priceFmt: 'stock' },
  { ticker: 'JPM',   name: 'JPMorgan Chase',    assetClass: 'USA', exchange: 'NYSE',   precision: 2, priceFmt: 'stock' },
  { ticker: 'COIN',  name: 'Coinbase',          assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'PLTR',  name: 'Palantir',          assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'NFLX',  name: 'Netflix',           assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'AVGO',  name: 'Broadcom',          assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
  { ticker: 'TSM',   name: 'TSMC',              assetClass: 'USA', exchange: 'NYSE',   precision: 2, priceFmt: 'stock' },
  { ticker: 'INTC',  name: 'Intel',             assetClass: 'USA', exchange: 'NASDAQ', precision: 2, priceFmt: 'stock' },
]

const CRYPTO_ASSETS: Asset[] = [
  { ticker: 'BTCUSDT',  name: 'Bitcoin',      assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'ETHUSDT',  name: 'Ethereum',     assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'XRPUSDT',  name: 'XRP',          assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 4, priceFmt: 'crypto' },
  { ticker: 'SOLUSDT',  name: 'Solana',       assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'BNBUSDT',  name: 'BNB',          assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'DOGEUSDT', name: 'Dogecoin',     assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 5, priceFmt: 'crypto' },
  { ticker: 'ADAUSDT',  name: 'Cardano',      assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 4, priceFmt: 'crypto' },
  { ticker: 'AVAXUSDT', name: 'Avalanche',    assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'LINKUSDT', name: 'Chainlink',    assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 3, priceFmt: 'crypto' },
  { ticker: 'DOTUSDT',  name: 'Polkadot',     assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 3, priceFmt: 'crypto' },
  { ticker: 'LTCUSDT',  name: 'Litecoin',     assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 2, priceFmt: 'crypto' },
  { ticker: 'NEARUSDT', name: 'NEAR Protocol', assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 3, priceFmt: 'crypto' },
  { ticker: 'SUIUSDT',  name: 'Sui',          assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 4, priceFmt: 'crypto' },
  { ticker: 'PEPEUSDT', name: 'Pepe',         assetClass: 'CRYPTO', exchange: 'BINANCE', precision: 8, priceFmt: 'crypto' },
]

const FOREX_ASSETS: Asset[] = [
  { ticker: 'EURUSD', name: 'Euro / USD',       assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'USDJPY', name: 'USD / JPY',         assetClass: 'FOREX', exchange: 'OANDA', precision: 3, priceFmt: 'forex' },
  { ticker: 'GBPUSD', name: 'GBP / USD',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'AUDUSD', name: 'AUD / USD',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'USDCAD', name: 'USD / CAD',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'USDCHF', name: 'USD / CHF',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'NZDUSD', name: 'NZD / USD',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'EURJPY', name: 'EUR / JPY',         assetClass: 'FOREX', exchange: 'OANDA', precision: 3, priceFmt: 'forex' },
  { ticker: 'GBPJPY', name: 'GBP / JPY',         assetClass: 'FOREX', exchange: 'OANDA', precision: 3, priceFmt: 'forex' },
  { ticker: 'EURGBP', name: 'EUR / GBP',         assetClass: 'FOREX', exchange: 'OANDA', precision: 5, priceFmt: 'forex' },
  { ticker: 'AUDJPY', name: 'AUD / JPY',         assetClass: 'FOREX', exchange: 'OANDA', precision: 3, priceFmt: 'forex' },
  { ticker: 'USDIDR', name: 'USD / IDR',         assetClass: 'FOREX', exchange: 'OANDA', precision: 2, priceFmt: 'forex' },
]

const COMMODITY_ASSETS: Asset[] = [
  { ticker: 'XAUUSD',      name: 'Gold',          assetClass: 'COMMODITY', exchange: 'OANDA', precision: 2, priceFmt: 'commodity' },
  { ticker: 'XAGUSD',      name: 'Silver',        assetClass: 'COMMODITY', exchange: 'OANDA', precision: 4, priceFmt: 'commodity' },
  { ticker: 'WTIUSD',      name: 'WTI Crude Oil', assetClass: 'COMMODITY', exchange: 'OANDA', precision: 2, priceFmt: 'commodity' },
  { ticker: 'BRENTUSD',    name: 'Brent Crude',   assetClass: 'COMMODITY', exchange: 'OANDA', precision: 2, priceFmt: 'commodity' },
  { ticker: 'NATURALGAS',  name: 'Natural Gas',   assetClass: 'COMMODITY', exchange: 'NYMEX', precision: 3, priceFmt: 'commodity' },
  { ticker: 'XCUUSD',      name: 'Copper',        assetClass: 'COMMODITY', exchange: 'OANDA', precision: 4, priceFmt: 'commodity' },
  { ticker: 'XPTUSD',      name: 'Platinum',      assetClass: 'COMMODITY', exchange: 'OANDA', precision: 2, priceFmt: 'commodity' },
  { ticker: 'NICKELUSD',   name: 'Nickel',        assetClass: 'COMMODITY', exchange: 'LME',   precision: 2, priceFmt: 'commodity' },
]

// ─── COMBINED REGISTRIES ──────────────────────────────────────

export const DASHBOARD_ASSETS: Record<AssetClass, Asset[]> = {
  CRYPTO:    CRYPTO_ASSETS,
  FOREX:     FOREX_ASSETS,
  COMMODITY: COMMODITY_ASSETS,
  IDX:       IDX_ASSETS,
  USA:       USA_ASSETS,
}

// Full deduplicated registry (Pine assets + dashboard extras)
const _allTickers = new Set<string>()
export const ASSET_REGISTRY: Asset[] = [
  ...PINE_ASSETS,
  ...CRYPTO_ASSETS,
  ...FOREX_ASSETS,
  ...COMMODITY_ASSETS,
  ...IDX_ASSETS,
  ...USA_ASSETS,
].filter(a => {
  if (_allTickers.has(a.ticker)) return false
  _allTickers.add(a.ticker)
  return true
})

// ─── LOOKUP HELPERS ───────────────────────────────────────────

export function getAsset(ticker: string): Asset | undefined {
  return ASSET_REGISTRY.find(a => a.ticker === ticker)
}

export function getAssetsByClass(cls: AssetClass): Asset[] {
  return DASHBOARD_ASSETS[cls] ?? []
}

export function isPineAsset(ticker: string): boolean {
  return PINE_ASSETS.some(a => a.ticker === ticker)
}

// Format price according to asset precision
export function formatPrice(price: number, ticker: string): string {
  const asset = getAsset(ticker)
  const precision = asset?.precision ?? 2
  return price.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}
