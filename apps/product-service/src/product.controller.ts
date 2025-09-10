import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('reduce_stock')
  async reduceStock(@Payload() data: { product_id: number; qty: number }) {
    return this.productService.reduceStock(data.product_id, data.qty);
  }

  @MessagePattern('restore_stock')
  async restoreStock(@Payload() data: { product_id: number; qty: number }) {
    return this.productService.restoreStock(data.product_id, data.qty);
  }

  @MessagePattern('get_product')
  async getProduct(@Payload() data: { product_id: number }) {
    return this.productService.findById(data.product_id);
  }
}
