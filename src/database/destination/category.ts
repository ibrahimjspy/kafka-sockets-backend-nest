import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  CATEGORY_TABLE,
  DESTINATION_SALEOR_DB_SCHEMA_NAME,
} from '../db.constants';

@Entity(CATEGORY_TABLE, { schema: DESTINATION_SALEOR_DB_SCHEMA_NAME })
export class ProductCategory {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('varchar', { name: 'name', length: 250 })
  name: string;

  @Column('varchar', { name: 'slug', unique: true, length: 255 })
  slug: string;

  @Column('jsonb', { name: 'description', nullable: true })
  description: object | null;

  @Column('integer', { name: 'lft' })
  lft: number;

  @Column('integer', { name: 'rght' })
  rght: number;

  @Column('integer', { name: 'tree_id' })
  treeId: number;

  @Column('integer', { name: 'level' })
  level: number;

  @Column('integer', { name: 'parent_id', nullable: true })
  parentId: number | null;

  @Column('varchar', { name: 'background_image', nullable: true, length: 100 })
  backgroundImage: string | null;

  @Column('varchar', { name: 'seo_description', nullable: true, length: 300 })
  seoDescription: string | null;

  @Column('varchar', { name: 'seo_title', nullable: true, length: 70 })
  seoTitle: string | null;

  @Column('varchar', { name: 'background_image_alt', length: 128 })
  backgroundImageAlt: string;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: object | null;

  @Column('jsonb', { name: 'private_metadata', nullable: true })
  privateMetadata: object | null;

  @Column('text', { name: 'description_plaintext' })
  descriptionPlaintext: string;
}
