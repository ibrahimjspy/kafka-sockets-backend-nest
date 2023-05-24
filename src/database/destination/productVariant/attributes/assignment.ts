import { PRODUCT_VARIANT_ATTRIBUTE_ASSIGNED_TABLE } from 'src/database/db.constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: PRODUCT_VARIANT_ATTRIBUTE_ASSIGNED_TABLE })
export class AttributeAssignedVariantAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'variant_id' })
  variantId: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;
}
