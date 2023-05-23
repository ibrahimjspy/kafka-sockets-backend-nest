import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saleor.attribute_assignedproductattributevalue' })
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
