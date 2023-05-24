import {
  PRODUCT_CHANNEL_LISTING_TABLE,
  DESTINATION_SALEOR_DB_SCHEMA_NAME,
} from 'src/database/db.constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({
  name: PRODUCT_CHANNEL_LISTING_TABLE,
  schema: DESTINATION_SALEOR_DB_SCHEMA_NAME,
})
export class ProductProductChannelListing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date;

  @Column({ type: 'boolean' })
  is_published: boolean;

  @Column({ type: 'int' })
  channel_id: number;

  @Column({ type: 'int' })
  product_id: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: true })
  discounted_price_amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'boolean' })
  visible_in_listings: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  available_for_purchase_at: Date;
}
