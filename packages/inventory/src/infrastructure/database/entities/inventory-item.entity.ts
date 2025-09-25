import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('inventory_items')
@Index(['sku', 'tenantId'], { unique: true })
export class InventoryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  sku!: string;

  @Column()
  description!: string;

  @Column()
  unitOfMeasure!: string;

  @Column()
  valuationMethod!: string;

  @Column()
  tenantId!: string;

  @Column({ default: 0 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
