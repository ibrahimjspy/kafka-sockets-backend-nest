import { PRODUCT_VARIANT_CHANNEL_LISTING_TABLE } from 'src/database/db.constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity(PRODUCT_VARIANT_CHANNEL_LISTING_TABLE)
export class ProductProductVariantChannelListing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  currency: string;

  @Column({ nullable: true, type: 'numeric', precision: 12, scale: 3 })
  price_amount: number;

  @Column({ nullable: false })
  channel_id: number;

  @Column({ nullable: false })
  variant_id: number;

  @Column({ nullable: true, type: 'numeric', precision: 12, scale: 3 })
  cost_price_amount: number;

  @Column({ nullable: true })
  preorder_quantity_threshold: number;
}
