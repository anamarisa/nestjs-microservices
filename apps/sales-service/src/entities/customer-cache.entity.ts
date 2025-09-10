import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('customers_cache')
export class CustomerCache {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;
}
