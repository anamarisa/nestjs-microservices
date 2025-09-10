import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderLine } from './entities/order-line.entity';
import { firstValueFrom } from 'rxjs';
import { CustomerCache } from './entities/customer-cache.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderLine)
    private orderLineRepository: Repository<OrderLine>,
    @InjectRepository(CustomerCache)
    private customerCacheRepository: Repository<CustomerCache>,
    @Inject('CUSTOMER_SERVICE') private customerClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private productClient: ClientProxy,
  ) {}

  async onModuleInit() {
    try {
      await this.customerClient.connect();
      await this.productClient.connect();
      this.logger.log('Connected to RabbitMQ services');
      this.logger.log('Listening for create_customer events');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
    }
  }

  async handleCustomerCreated(data: any) {
    console.log('RAW EVENT DATA:', JSON.stringify(data, null, 2));
    try {
      console.log('Received customer created event:', data);
      await this.customerCacheRepository.save({
        id: data.id,
        name: data.name,
        email: data.email,
      });
      console.log('Customer saved to cache successfully');
    } catch (error) {
      console.error('Error saving customer to cache:', error);
    }
  }

  async getSalesOrder() {
    return this.orderRepository.find();
  }

  async getOrderDetail(id: number) {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['order_lines'],
    });
  }

  async createOrder(data: {
    customer_id: string;
    order_number: string;
    items: Array<{ product_id: number; qty: number; price?: number }>;
  }) {
    this.logger.log(`Creating order for customer ${data.customer_id}`);

    // Validate customer via customer service
    this.logger.log(`Validating customer ${data.customer_id}`);
    const customerExists = await firstValueFrom(
      this.customerClient.send('validate_customer', {
        customer_id: data.customer_id,
      }),
    );

    // this.logger.log(`validating customer ${data.customer_id}`);
    // // const customerExists = await this.customerCacheRepository.findOne({
    // //   where: { id: data.customer_id },
    // // });

    if (!customerExists) {
      this.logger.error(`Customer ${data.customer_id} not found`);
      throw new Error('Customer not found');
    }

    // Kurangi stok untuk setiap item
    for (const item of data.items) {
      this.logger.log(
        `Reducing stock for product ${item.product_id}, quantity ${item.qty}`,
      );
      const stockReduced = await firstValueFrom(
        this.productClient.send('reduce_stock', {
          product_id: item.product_id,
          qty: item.qty,
        }),
      );

      if (!stockReduced.success) {
        this.logger.error(
          `Failed to reduce stock for product ${item.product_id}: ${stockReduced.message}`,
        );

        // Restore stock untuk items yang sudah diproses
        for (const processedItem of data.items.slice(
          0,
          data.items.indexOf(item),
        )) {
          this.logger.log(
            `Restoring stock for product ${processedItem.product_id}`,
          );
          await firstValueFrom(
            this.productClient.send('restore_stock', {
              product_id: processedItem.product_id,
              qty: processedItem.qty,
            }),
          );
        }
        throw new Error(stockReduced.message);
      }
    }

    try {
      // Buat order
      const order = this.orderRepository.create({
        order_number: data.order_number,
        customer_id: data.customer_id,
        status: 'created',
      });

      const savedOrder = await this.orderRepository.save(order);
      this.logger.log(`Order ${savedOrder.id} created successfully`);

      // Buat order lines dengan harga default jika tidak disediakan
      const orderLines = data.items.map((item) =>
        this.orderLineRepository.create({
          order: savedOrder,
          product_id: item.product_id,
          qty: item.qty,
          price: item.price || 0, // Default price jika tidak disediakan
        }),
      );

      await this.orderLineRepository.save(orderLines);
      this.logger.log(`Order lines created for order ${savedOrder.id}`);

      return {
        success: true,
        order: {
          id: savedOrder.id,
          order_number: savedOrder.order_number,
          customer_id: savedOrder.customer_id,
          status: savedOrder.status,
          items: orderLines,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);

      // Restore stock jika order creation gagal
      for (const item of data.items) {
        this.logger.log(
          `Restoring stock for product ${item.product_id} due to order creation failure`,
        );
        await firstValueFrom(
          this.productClient.send('restore_stock', {
            product_id: item.product_id,
            qty: item.qty,
          }),
        );
      }
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['order_lines'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['order_lines'],
    });
  }
}
