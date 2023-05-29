import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { WAREHOUSE_TABLE } from '../db.constants';

@Entity({ name: WAREHOUSE_TABLE })
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 250 })
  name: string;

  @Column({ name: 'email', length: 254 })
  email: string;

  @Column({ name: 'address_id', type: 'int' })
  addressId: number;

  @Column({ name: 'slug', length: 255, unique: true })
  slug: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'private_metadata', type: 'jsonb', nullable: true })
  privateMetadata: Record<string, any>;

  @Column({ name: 'click_and_collect_option', length: 30 })
  clickAndCollectOption: string;

  @Column({ name: 'is_private', type: 'boolean' })
  isPrivate: boolean;

  @Column({
    name: 'external_reference',
    length: 250,
    nullable: true,
    unique: true,
  })
  externalReference: string;
}
