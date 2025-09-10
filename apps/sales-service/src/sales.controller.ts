import { Controller, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCustomerEvent } from './create-customer.event';

@Controller('sales')
export class SalesController {
  constructor(private readonly SalesService: SalesService) {}

  @Get()
  async getSalesOrder() {
    return this.SalesService.getSalesOrder();
  }

  @Get(':id')
  async getOrderDetail(@Param('id') id: number) {
    return this.SalesService.getOrderDetail(id);
  }

  @EventPattern('customer_created')
  async handleCustomerCreated(@Payload() data: any) {
    console.log('sales controller event:', data);
    return this.SalesService.handleCustomerCreated(data);
  }

  @MessagePattern('create_order')
  async createOrder(
    @Payload()
    data: {
      customer_id: string;
      order_number: string;
      items: Array<{ product_id: number; qty: number }>;
    },
  ) {
    console.log('sales data', data);
    console.log('creating order...');
    return this.SalesService.createOrder(data);
  }

  @MessagePattern('get_order')
  async getOrder(@Payload() data: { order_id: number }) {
    return this.SalesService.getOrder(data.order_id);
  }

  @MessagePattern('get_all_orders')
  async getAllOrders() {
    return this.SalesService.getAllOrders();
  }
}
