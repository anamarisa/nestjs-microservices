import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async reduceStock(
    productId: number,
    qty: number,
  ): Promise<{ success: boolean; message?: string }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (product.stock < qty) {
      return { success: false, message: 'Insufficient stock' };
    }

    product.stock -= qty;
    await this.productRepository.save(product);

    return { success: true };
  }

  async restoreStock(
    productId: number,
    qty: number,
  ): Promise<{ success: boolean; message?: string }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    product.stock += qty;
    await this.productRepository.save(product);

    return { success: true };
  }

  async findById(productId: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    return product;
  }
}
