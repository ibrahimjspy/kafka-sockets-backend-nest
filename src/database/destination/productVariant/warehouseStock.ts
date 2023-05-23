import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('saleor.warehouse_stock')
export class WarehouseStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  quantity: number;

  @Column({ nullable: false })
  product_variant_id: number;

  @Column({ nullable: false })
  warehouse_id: string;

  @Column({ nullable: false })
  quantity_allocated: number;
}
