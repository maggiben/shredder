-- CreateTable
CREATE TABLE "trading_bot_candles" (
    "id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "open" DECIMAL(28,12) NOT NULL,
    "high" DECIMAL(28,12) NOT NULL,
    "low" DECIMAL(28,12) NOT NULL,
    "close" DECIMAL(28,12) NOT NULL,
    "volume" DECIMAL(28,12) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_bot_candles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_bot_paper_trades" (
    "id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "price" DECIMAL(28,12) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trading_bot_paper_trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trading_bot_candles_bot_id_timestamp_key" ON "trading_bot_candles"("bot_id", "timestamp");

-- CreateIndex
CREATE INDEX "trading_bot_candles_bot_id_timestamp_idx" ON "trading_bot_candles"("bot_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "trading_bot_paper_trades_bot_id_timestamp_idx" ON "trading_bot_paper_trades"("bot_id", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "trading_bot_candles" ADD CONSTRAINT "trading_bot_candles_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "trading_bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_bot_paper_trades" ADD CONSTRAINT "trading_bot_paper_trades_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "trading_bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
