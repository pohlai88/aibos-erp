import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'exchange_rates' })
@Index(['fromCurrency', 'toCurrency', 'date'], { unique: true })
@Index(['date'])
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 3 })
  fromCurrency!: string;

  @Column({ type: 'varchar', length: 3 })
  toCurrency!: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  rate!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 50, default: 'API' })
  source!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
