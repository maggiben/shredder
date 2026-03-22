export interface Position {
  readonly symbol: string;
  readonly quantity: number;
  readonly averageEntryPrice: number;
}

export interface PortfolioState {
  readonly cash: number;
  readonly positions: readonly Position[];
  /** Optional mark-to-market equity if known */
  readonly equity?: number;
}
