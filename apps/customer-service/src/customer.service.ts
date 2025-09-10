import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreateCustomerEvent } from './create-customer.event';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @Inject('CUSTOMER_PUBLISHER') private customerClient: ClientProxy,
  ) {}

  async createCustomer(dto: CreateCustomerDto) {
    const customer = this.customerRepository.create(dto);
    const savedCustomer = await this.customerRepository.save(customer);

    console.log('Emitting create_customer event:', savedCustomer);
    this.customerClient.emit('customer_created', savedCustomer);

    return savedCustomer;
  }

  async validateCustomer(customerId: string): Promise<{ exists: boolean }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    return { exists: !!customer };
  }

  async findOne(customerId: string): Promise<Customer | null> {
    const customer = this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }
}
