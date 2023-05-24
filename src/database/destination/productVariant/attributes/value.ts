import { PRODUCT_VARIANT_ATTRIBUTE_VALUE_TABLE } from 'src/database/db.constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: PRODUCT_VARIANT_ATTRIBUTE_VALUE_TABLE })
export class AttributeAssignedVariantAttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;

  @Column({ name: 'value_id' })
  valueId: number;
}
