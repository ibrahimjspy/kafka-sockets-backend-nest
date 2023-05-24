import { PRODUCT_ATTRIBUTE_ASSIGNED_TABLE } from 'src/database/db.constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: PRODUCT_ATTRIBUTE_ASSIGNED_TABLE })
export class AttributeAssignedProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;
}
