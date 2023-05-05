import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  DESTINATION_SHOP_PRODUCT_VARIANT_MAPPING_TABLE_NAME,
  DESTINATION_SHOP_SERVICE_DB_SCHEMA_NAME,
} from '../db.constants';

/**
 * @description -- class to connect with product variant shop mapping  table in destination which we use for inserting product media urls directly in database
 */
@Entity({
  schema: DESTINATION_SHOP_SERVICE_DB_SCHEMA_NAME,
  name: DESTINATION_SHOP_PRODUCT_VARIANT_MAPPING_TABLE_NAME,
})
export class ProductVariantShopMapping {
  @PrimaryGeneratedColumn({ type: 'int8' })
  public id?: number;

  @Column({ type: 'varchar', length: 100 })
  public product_variant_id: string;

  @Column({ type: 'varchar', length: 100 })
  public shop_id: string;

  @Column({ type: 'varchar', length: 100 })
  public product_id: string;

  @Column({ type: 'varchar' })
  public category_id?: string;
}
