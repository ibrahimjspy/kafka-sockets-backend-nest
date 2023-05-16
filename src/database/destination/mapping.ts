import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import {
  DESTINATION_CDC_SERVICE_DB_SCHEMA_NAME,
  SYNC_PRODUCTS_TABLE,
} from '../db.constants';

/**
 * @description -- class to connect with product category table in destination which we use for inserting product media urls directly in database
 */
@Entity({
  schema: DESTINATION_CDC_SERVICE_DB_SCHEMA_NAME,
  name: SYNC_PRODUCTS_TABLE,
})
export class SyncMappings {
  @PrimaryGeneratedColumn({ type: 'int8' })
  public id?: number;

  @Column({ type: 'varchar' })
  public old_product_id: string;

  @Column({ type: 'varchar' })
  public new_product_id?: string;

  @Column({ type: 'varchar' })
  public event_type?: string;
}
