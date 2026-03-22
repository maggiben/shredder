import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, BadRequestException } from "@nestjs/common";
import { Prisma } from "@shredder/db";
import type { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("order-processing") private readonly orderQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    if (dto.type === "LIMIT" && dto.limitPrice === undefined) {
      throw new BadRequestException("LIMIT orders require limitPrice");
    }
    const data: Prisma.OrderUncheckedCreateInput = {
      userId,
      symbol: dto.symbol.toUpperCase(),
      side: dto.side,
      type: dto.type,
      quantity: new Prisma.Decimal(dto.quantity),
      status: "PENDING",
    };
    if (dto.limitPrice !== undefined) {
      data.limitPrice = new Prisma.Decimal(dto.limitPrice);
    }
    if (dto.clientOrderId !== undefined) {
      data.clientOrderId = dto.clientOrderId;
    }
    const order = await this.prisma.order.create({ data });
    await this.orderQueue.add("settle-demo", { orderId: order.id });
    return this.serializeOrder(order);
  }

  async listForUser(userId: string) {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((o) => this.serializeOrder(o));
  }

  private serializeOrder(o: {
    id: string;
    userId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: Prisma.Decimal;
    limitPrice: Prisma.Decimal | null;
    status: string;
    clientOrderId: string | null;
    exchangeOrderId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: o.id,
      symbol: o.symbol,
      side: o.side,
      type: o.type,
      quantity: o.quantity.toString(),
      limitPrice: o.limitPrice?.toString() ?? undefined,
      status: o.status,
      clientOrderId: o.clientOrderId ?? undefined,
      exchangeOrderId: o.exchangeOrderId ?? undefined,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
