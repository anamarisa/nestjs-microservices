import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CustomerModule } from './customer.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CustomerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://rabbitmq:5672'],
        queue: 'customer_queue',
        persistent: true,
        retryAttempts: 20,
        retryDelay: 5000,
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  await app.listen();
  console.log('Customer Microservice is listening');
}
bootstrap();
