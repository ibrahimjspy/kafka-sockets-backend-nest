import { PRODUCT_ATTRIBUTE_VALUE_TABLE } from 'src/database/db.constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: PRODUCT_ATTRIBUTE_VALUE_TABLE })
export class AttributeAssignedProductAttributeValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sort_order', nullable: true })
  sortOrder: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;

  @Column({ name: 'value_id' })
  valueId: number;
}
