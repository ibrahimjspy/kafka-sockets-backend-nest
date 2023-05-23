import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'saleor.attribute_assignedvariantattribute' })
export class AttributeAssignedVariantAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'variant_id' })
  variantId: number;

  @Column({ name: 'assignment_id' })
  assignmentId: number;
}
