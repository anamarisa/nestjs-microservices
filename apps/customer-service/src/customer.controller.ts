import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('create_customer')
  async createCustomer(
    @Payload()
    data: CreateCustomerDto,
  ) {
    console.log('customer data', data);
    return this.customerService.createCustomer(data);
  }

  @MessagePattern('validate_customer')
  async validateCustomer(@Payload() data: { customer_id: string }) {
    return this.customerService.validateCustomer(data.customer_id);
  }

  @MessagePattern('get_customer')
  async getCustomer(@Payload() data: { customer_id: string }) {
    return this.customerService.findOne(data.customer_id);
  }
}
