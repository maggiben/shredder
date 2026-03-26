import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger, Optional } from "@nestjs/common";
import { Job } from "bullmq";
import type { Order, OrderResult } from "@shredder/core";
import { Prisma } from "@shredder/db";
import type { Exchange } from "@shredder/exchanges";
import { BINANCE_EXCHANGE } from "../exchanges/exchange.tokens";
import { PrismaService } from "../prisma/prisma.service";

@Processor("order-processing")
export class OrderProcessor extends WorkerHost {
  private readonly log = new Logger(OrderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(BINANCE_EXCHANGE) private readonly exchange: Exchange | null,
  ) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<void> {
    const orderId = job.data.orderId;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "PENDING") {
      return;
    }
    if (order.type === "LIMIT" && order.limitPrice === null) {
      this.log.warn(`Order ${orderId} LIMIT without price — skipping auto-fill`);
      return;
    }

    if (this.exchange) {
      await this.settleViaBinance(this.exchange, order);
      return;
    }

    await this.settleDemo(order);
  }

  private async resolveTradeFeeQuote(
    exchange: Exchange,
    orderSymbol: string,
    fillPx: number,
    result: OrderResult,
  ): Promise<Prisma.Decimal | undefined> {
    if (result.commissionQuote !== undefined && result.commissionQuote > 0) {
      return new Prisma.Decimal(result.commissionQuote);
    }
    if (result.filledQuantity > 0 && fillPx > 0) {
      try {
        const tf = await exchange.getTradeFee(orderSymbol);
        const n = result.filledQuantity * fillPx;
        return new Prisma.Decimal(n * tf.takerRate);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private async demoTradeFeeQuote(order: {
    symbol: string;
    quantity: Prisma.Decimal;
    price: Prisma.Decimal;
  }): Promise<Prisma.Decimal | undefined> {
    const px = Number(order.price);
    const qty = Number(order.quantity);
    if (this.exchange) {
      try {
        const tf = await this.exchange.getTradeFee(order.symbol);
        return new Prisma.Decimal(qty * px * tf.takerRate);
      } catch {
        return undefined;
      }
    }
    const r = Number(process.env["DEMO_TAKER_FEE_RATE"] ?? "0.001");
    const rate = Number.isFinite(r) ? r : 0.001;
    return new Prisma.Decimal(qty * px * rate);
  }

  private prismaOrderToCore(order: {
    id: string;
    symbol: string;
    side: string;
    type: string;
    quantity: Prisma.Decimal;
    limitPrice: Prisma.Decimal | null;
    clientOrderId: string | null;
  }): Order {
    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as Order["side"],
      type: order.type as Order["type"],
      quantity: Number(order.quantity),
      ...(order.limitPrice != null ? { limitPrice: Number(order.limitPrice) } : {}),
      ...(order.clientOrderId != null ? { clientOrderId: order.clientOrderId } : {}),
    };
  }

  private async settleViaBinance(
    exchange: Exchange,
    order: {
      id: string;
      symbol: string;
      side: string;
      type: string;
      quantity: Prisma.Decimal;
      limitPrice: Prisma.Decimal | null;
      clientOrderId: string | null;
    },
  ): Promise<void> {
    const core = this.prismaOrderToCore(order);
    try {
      const result = await exchange.placeOrder(core);
      const fillPx =
        result.averageFillPrice ??
        (order.limitPrice != null ? Number(order.limitPrice) : undefined);
      const feeDec =
        fillPx !== undefined
          ? await this.resolveTradeFeeQuote(exchange, order.symbol, fillPx, result)
          : undefined;
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: result.status,
            exchangeOrderId: result.orderId,
          },
        });
        if (result.filledQuantity > 0 && fillPx !== undefined) {
          await tx.trade.create({
            data: {
              orderId: order.id,
              symbol: order.symbol,
              side: order.side,
              quantity: new Prisma.Decimal(result.filledQuantity),
              price: new Prisma.Decimal(fillPx),
              ...(feeDec !== undefined ? { fee: feeDec } : {}),
            },
          });
        } else if (result.filledQuantity > 0) {
          this.log.warn(
            `Order ${order.id} filled qty ${String(result.filledQuantity)} but no price — trade row skipped`,
          );
        }
      });
      this.log.log(`Binance order ${order.id} → ${result.status} (exchange ${result.orderId})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.log.error(`Binance placeOrder failed for ${order.id}: ${msg}`);
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "REJECTED" },
      });
    }
  }

  private async settleDemo(order: {
    id: string;
    symbol: string;
    side: string;
    quantity: Prisma.Decimal;
    limitPrice: Prisma.Decimal | null;
  }): Promise<void> {
    const price = order.limitPrice ?? new Prisma.Decimal("1");
    const fee = await this.demoTradeFeeQuote({
      symbol: order.symbol,
      quantity: order.quantity,
      price,
    });
    await this.prisma.$transaction([
      this.prisma.trade.create({
        data: {
          orderId: order.id,
          symbol: order.symbol,
          side: order.side,
          quantity: order.quantity,
          price,
          ...(fee !== undefined ? { fee } : {}),
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: "FILLED" },
      }),
    ]);
    this.log.log(`Demo-filled order ${order.id} at ${price.toString()}`);
  }
}
