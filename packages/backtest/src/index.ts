export { aggregateSignals } from "./aggregate.js";
export {
  runBacktest,
  type BacktestParams,
  type BacktestResult,
  type BacktestTrade,
} from "./engine.js";
export {
  runSimulationLedger,
  type SimulationLedgerAction,
  type SimulationLedgerResult,
  type SimulationLedgerRow,
  type SimulationSignalStats,
} from "./simulation.js";
export {
  buildSimulationMetrics,
  parseRoundTrips,
  type BuildSimulationMetricsInput,
  type ClosedRoundTrip,
  type SimulationMetrics,
} from "./simulation-metrics.js";
