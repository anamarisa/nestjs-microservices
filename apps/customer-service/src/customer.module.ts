import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'customer-db',
      port: 5432,
      username: 'postgres',
      password: 'altindo@123',
      database: 'customer',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
      retryAttempts: 10,
      retryDelay: 3000,
    }),
    TypeOrmModule.forFeature([Customer]),
    ClientsModule.register([
      {
        name: 'CUSTOMER_PUBLISHER',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://rabbitmq:5672'],
          exchange: 'customer_exchange',
          exchangeType: 'fanout',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
