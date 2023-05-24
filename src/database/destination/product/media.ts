import {
  DESTINATION_SALEOR_DB_SCHEMA_NAME,
  MEDIA_TABLE,
} from 'src/database/db.constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: MEDIA_TABLE, schema: DESTINATION_SALEOR_DB_SCHEMA_NAME })
export class ProductProductMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  sort_order: number;

  @Column({ nullable: true })
  image: string;

  @Column()
  alt: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  external_url: string;

  @Column('jsonb')
  oembed_data: any;

  @Column()
  product_id: number;

  @Column({ default: false })
  to_remove: boolean;
}
