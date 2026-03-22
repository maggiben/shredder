import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { OrderProcessor } from "./order.processor";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [BullModule.registerQueue({ name: "order-processing" })],
  controllers: [OrdersController],
  providers: [OrdersService, OrderProcessor],
})
export class OrdersModule {}
