/** Common Binance spot quote assets, longest first for suffix matching. */
const QUOTE_SUFFIXES_DESC = [
  "FDUSD",
  "USDT",
  "USDC",
  "BUSD",
  "TUSD",
  "USDP",
  "EUR",
  "GBP",
  "TRY",
  "BIDR",
  "BRL",
  "UAH",
  "RUB",
  "PLN",
  "RON",
  "BTC",
  "ETH",
  "BNB",
] as const;

/**
 * Best-effort parse of a Binance-style spot symbol into base + quote (e.g. BTCUSDT → BTC, USDT).
 */
export function parseSpotSymbol(symbol: string): { base: string; quote: string } | null {
  const s = symbol.replace("/", "").toUpperCase();
  for (const q of QUOTE_SUFFIXES_DESC) {
    if (s.endsWith(q) && s.length > q.length) {
      return { base: s.slice(0, -q.length), quote: q };
    }
  }
  return null;
}
