import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  DESTINATION_SALEOR_DB_SCHEMA_NAME,
  MEDIA_TABLE,
  THUMBNAIL_TABLE,
} from '../db.constants';

/**
 * @description -- class to connect with product media table in destination which we use for inserting product media urls directly in database
 */
@Entity({
  schema: DESTINATION_SALEOR_DB_SCHEMA_NAME,
  name: MEDIA_TABLE,
})
export class ProductMedia {
  @PrimaryGeneratedColumn({ type: 'int8' })
  public id?: number;

  @Column({ type: 'int4' })
  public sort_order?: string;

  @Column({ type: 'varchar', length: 100 })
  public image: string;

  @Column({ type: 'varchar', default: 'alt' })
  public alt?: string;

  @Column({ type: 'varchar', length: 100 })
  public type?: string;

  @Column({ type: 'jsonb' })
  public oembed_data?: any;

  @Column({ type: 'int8' })
  public product_id?: string;

  @Column({ type: 'bool' })
  public to_remove?: boolean;
}

/**
 * @description -- class to connect with product thumbnail table in destination which we use for inserting product media urls directly in database
 */
@Entity({
  schema: DESTINATION_SALEOR_DB_SCHEMA_NAME,
  name: THUMBNAIL_TABLE,
})
export class ProductThumbnail {
  @PrimaryGeneratedColumn({ type: 'int8' })
  public id?: number;

  @Column({ type: 'varchar', length: 100 })
  public image: string;

  @Column({ type: 'int4' })
  public product_media_id?: number;

  @Column({ type: 'int4' })
  public size?: number;

  @Column({ type: 'int8' })
  public category_id?: string;

  @Column({ type: 'int8' })
  public collection_id?: string;

  @Column({ type: 'int8' })
  public user_id?: string;
}
