import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

const DESTINATION_DB_SCHEMA_NAME = 'saleor';
const DESTINATION_MEDIA_TABLE_NAME = 'product_productmedia';
@Entity({
  schema: DESTINATION_DB_SCHEMA_NAME,
  name: DESTINATION_MEDIA_TABLE_NAME,
})
export class ProductMedia {
  @PrimaryGeneratedColumn({ type: 'int8' })
  public id!: number;

  @Column({ type: 'int4' })
  public sort_order: string;

  @Column({ type: 'varchar', length: 100 })
  public image: string;

  @Column({ type: 'varchar', default: 'alt' })
  public alt: string;

  @Column({ type: 'varchar', length: 100 })
  public type: string;

  @Column({ type: 'jsonb' })
  public oembed_data: any;

  @Column({ type: 'int8' })
  public product_id: string;
}
