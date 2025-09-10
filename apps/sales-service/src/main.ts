import { NestFactory } from '@nestjs/core';
import { SalesModule } from './sales.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(SalesModule);

  // Connect RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://rabbitmq:5672'],
      queue: 'sales_queue',
      queueOptions: {
        durable: true,
      },
      exchange: 'customer_exchange',
      exchangeType: 'fanout',
    },
  });

  // Start both
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('✅ Sales service is running on HTTP (3000) + RabbitMQ');
}
bootstrap();
