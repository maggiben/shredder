import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const rows = await this.prisma.trade.findMany({
      where: { order: { userId } },
      orderBy: { executedAt: "desc" },
      take: 500,
      include: { order: true },
    });
    return rows.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity.toString(),
      price: t.price.toString(),
      fee: t.fee?.toString(),
      executedAt: t.executedAt.toISOString(),
    }));
  }
}
