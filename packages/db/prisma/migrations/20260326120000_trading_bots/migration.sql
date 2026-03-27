-- CreateEnum
CREATE TYPE "TradingBotStatus" AS ENUM ('STOPPED', 'STARTING', 'RUNNING', 'ERROR');

-- CreateTable
CREATE TABLE "trading_bots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TradingBotStatus" NOT NULL DEFAULT 'STOPPED',
    "config" JSONB NOT NULL,
    "process_pid" INTEGER,
    "last_tick_at" TIMESTAMP(3),
    "last_output" JSONB,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_bots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trading_bots_user_id_idx" ON "trading_bots"("user_id");

-- CreateIndex
CREATE INDEX "trading_bots_status_idx" ON "trading_bots"("status");

-- AddForeignKey
ALTER TABLE "trading_bots" ADD CONSTRAINT "trading_bots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
