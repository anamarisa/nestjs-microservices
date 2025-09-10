import { Controller, Post, Body, Inject, Param, Get } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller()
export class ApiGatewayController {
  constructor(
    @Inject('SALES_SERVICE') private salesClient: ClientProxy,
    @Inject('CUSTOMER_SERVICE') private customerClient: ClientProxy,
  ) {}

  @Post('orders')
  async createOrder(@Body() orderData: any) {
    try {
      console.log('Received order creation request:', orderData);

      const response = await firstValueFrom(
        this.salesClient.send('create_order', orderData).pipe(timeout(10000)), // Timeout 10 detik
      );

      console.log('Order creation response:', response);
      return response;
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get()
  async getAllOrders() {
    try {
      console.log('Received request to get all orders');
      const response = await firstValueFrom(
        this.salesClient.send('get_all_orders', {}).pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.salesClient
          .send('get_order', { order_id: parseInt(id) })
          .pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('customers')
  async createCustomer(@Body() customerData: any) {
    try {
      console.log('Received customer creation request:', customerData);

      const response = await firstValueFrom(
        this.customerClient
          .send('create_customer', customerData)
          .pipe(timeout(10000)),
      );

      console.log('Customer creation response:', response);
      return response;
    } catch (error) {
      return { error: error.message };
    }
  }
}
