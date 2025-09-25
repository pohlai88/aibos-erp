import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('stock_levels')
@Index(['sku', 'location', 'tenantId'], { unique: true })
export class StockLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sku!: string;

  @Column()
  location!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalValue!: number;

  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
