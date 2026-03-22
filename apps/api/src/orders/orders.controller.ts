import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

type AuthedRequest = Request & { user: { userId: string; email: string } };

@Controller("orders")
@UseGuards(AuthGuard("jwt"))
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.orders.listForUser(req.user.userId);
  }

  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.userId, dto);
  }
}
