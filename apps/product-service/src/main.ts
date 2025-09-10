import { NestFactory } from '@nestjs/core';
import { ProductServiceModule } from './product.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://rabbitmq:5672'],
        queue: 'product_queue',
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
  console.log('Product Microservice is listening');
}
bootstrap();
