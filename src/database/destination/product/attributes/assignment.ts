import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saleor.attribute_assignedproductattribute' })
export class AttributeAssignedProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;
}
