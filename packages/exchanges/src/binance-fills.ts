import { parseSpotSymbol } from "./spot-symbol.js";

export interface BinanceFillLike {
  readonly price: string;
  readonly qty: string;
  readonly commission?: string;
  readonly commissionAsset?: string;
}

/**
 * Converts each fill's commission to an approximate quote-currency amount using the fill price.
 * Unknown commission assets are counted at face value (conservative for USDT-quoted pairs).
 */
export function commissionQuoteFromBinanceFills(
  symbol: string,
  fills: readonly BinanceFillLike[] | undefined,
): { totalQuote: number; details: readonly { asset: string; amount: number }[] } {
  if (!fills || fills.length === 0) {
    return { totalQuote: 0, details: [] };
  }
  const parsed = parseSpotSymbol(symbol);
  let total = 0;
  const details: { asset: string; amount: number }[] = [];
  for (const f of fills) {
    const comm = f.commission !== undefined ? Number(f.commission) : 0;
    const asset = f.commissionAsset?.toUpperCase() ?? "";
    if (!Number.isFinite(comm) || comm === 0) {
      continue;
    }
    details.push({ asset: asset || "?", amount: comm });
    if (!parsed) {
      total += comm;
      continue;
    }
    const px = Number(f.price);
    if (asset === parsed.quote) {
      total += comm;
    } else if (asset === parsed.base && Number.isFinite(px)) {
      total += comm * px;
    } else {
      total += comm;
    }
  }
  return { totalQuote: total, details };
}
