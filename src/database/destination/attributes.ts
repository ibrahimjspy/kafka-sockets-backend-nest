import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saleor.attribute_attributevalue' })
export class AttributeAttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'attribute_id' })
  attributeId: number;

  @Column({ name: 'slug' })
  slug: string;

  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;

  @Column({ name: 'value' })
  value: string;

  @Column({ name: 'content_type', nullable: true })
  contentType: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ name: 'rich_text', type: 'jsonb', nullable: true })
  richText: any;

  @Column({ name: 'boolean', nullable: true })
  boolean: boolean;

  @Column({ name: 'date_time', nullable: true })
  dateTime: Date;

  @Column({ name: 'reference_page_id', nullable: true })
  referencePageId: number;

  @Column({ name: 'reference_product_id', nullable: true })
  referenceProductId: number;

  @Column({ name: 'plain_text', nullable: true })
  plainText: string;

  @Column({ name: 'reference_variant_id', nullable: true })
  referenceVariantId: number;

  @Column({ name: 'external_reference', nullable: true, unique: true })
  externalReference: string;
}
