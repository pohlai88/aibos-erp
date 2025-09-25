import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_movements')
@Index(['sku', 'tenantId'])
@Index(['location', 'tenantId'])
@Index(['timestamp', 'tenantId'])
export class StockMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  movementId!: string;

  @Column()
  sku!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost!: number;

  @Column()
  location!: string;

  @Column()
  movementType!: string;

  @Column()
  reference!: string;

  @Column()
  tenantId!: string;

  @Column({ nullable: true })
  batchNumber?: string;

  @Column({ nullable: true })
  serialNumbers?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ nullable: true })
  countedBy?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  timestamp!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
