# pieBot Soul — Trade Journal

## Genesis

pieBot adalah autonomous trading agent berbasis SS BlackBox v6.4.
Journal ini adalah audit trail lengkap semua keputusan dan trade.

---

## [TRADE LOG]

Format kolom (jangan ubah header):
| timestamp | ticker | alert_type | tier | entry | sl | tp | exit_price | exit_reason | pnl_r | pnl_usd | session |

Keterangan:
- timestamp : ISO 8601 (2026-03-17T09:14:00Z)
- tier      : S / A / B / C
- exit_price: — jika masih open
- exit_reason: TP_HIT / SL_HIT / LH_EXIT / ALPHA_EXIT / MANUAL / OPEN
- pnl_r     : angka desimal, negatif jika loss (contoh: 1.94 atau -1.0)
- pnl_usd   : integer USD, negatif jika loss

| timestamp | ticker | alert_type | tier | entry | sl | tp | exit_price | exit_reason | pnl_r | pnl_usd | session |
|-----------|--------|-----------|------|-------|-----|-----|-----------|-------------|-------|---------|---------|
| 2026-03-17T09:14:00Z | BTCUSDT | CONWAY_BUY | A | 84210 | 83000 | 86630 | 86500 | TP_HIT | 1.94 | 289 | LONDON |
| 2026-03-17T14:22:00Z | XAUUSD | GOLD_BUY | B | 2912 | 2890 | 2956 | 2956 | TP_HIT | 2.0 | 88 | NY |
| 2026-03-16T08:05:00Z | SOLUSDT | BBP_ENTRY_BUY | B | 95.4 | 93.1 | 100.3 | 93.2 | SL_HIT | -1.0 | -46 | LONDON |
| 2026-03-15T13:44:00Z | BBCA | CONWAY_BORN | S | 9600 | 9450 | 9900 | 9880 | TP_HIT | 1.87 | 280 | IDX |
| 2026-03-14T09:30:00Z | ETHUSDT | CONWAY_BUY | A | 3210 | 3140 | 3350 | 3350 | TP_HIT | 2.0 | 140 | LONDON |
| 2026-03-14T15:10:00Z | BTCUSDT | GOLD_BUY | B | 82100 | 81200 | 83800 | 81300 | LH_EXIT | -0.89 | -80 | NY |
| 2026-03-13T08:15:00Z | ANTM | CONWAY_BUY | A | 2180 | 2130 | 2280 | 2280 | TP_HIT | 2.0 | 100 | IDX |
| 2026-03-12T13:55:00Z | NVDA | BBP_ENTRY_BUY | B | 875 | 858 | 909 | — | OPEN | — | — | NY |

---

## [NOTES]

Catatan harian pieBot. Format bebas di bawah ini.

### 2026-03-17
- BTC CONWAY_BUY Tier A fired at London open. Fusion 19/23. Took trade, TP hit +1.94R.
- XAUUSD GOLD_BUY Tier B. Clean entry above VWAP. TP hit.
- No IDX signals today — Conway dormant across BBCA/BBRI/ANTM/ASII.

### 2026-03-16
- SOL BBP entry failed. LH formed after entry, exited at SL. Normal loss within plan.
- Market consolidating. No forced entries.

### 2026-03-15
- BBCA CONWAY_BORN Tier S — highest conviction signal. 7/8 cells, Fusion 21.
- Took full 3% risk. TP hit +1.87R.

---

## [CONFIG]

```
risk_per_trade_S: 3.0%
risk_per_trade_A: 2.0%
risk_per_trade_B: 1.0%
risk_per_trade_C: 0.5%
max_concurrent_trades: 3
allowed_sessions: LONDON, NY, IDX
blackout_periods: ASIA (high spread)
```
