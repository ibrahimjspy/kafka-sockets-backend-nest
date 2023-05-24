import { WAREHOUSE_STOCK_TABLE } from 'src/database/db.constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(WAREHOUSE_STOCK_TABLE)
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
