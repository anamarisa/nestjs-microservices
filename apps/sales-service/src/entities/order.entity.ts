import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { OrderLine } from './order-line.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_number: string;

  @Column()
  customer_id: string;

  @Column()
  status: string;

  @OneToMany(() => OrderLine, (orderLine) => orderLine.order)
  order_lines: OrderLine[];
}
