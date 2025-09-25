import { GeneralLedgerEntryEntity } from './general-ledger-entry.entity';
import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany } from 'typeorm';

@Entity('journal_entry')
@Index(['tenantId', 'postingDate'])
@Index(['tenantId', 'reference'])
export class JournalEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'reference', type: 'varchar', length: 255, nullable: true })
  reference?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'posting_date', type: 'date' })
  postingDate!: Date;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'DRAFT',
    enum: ['DRAFT', 'POSTED', 'REVERSED'],
  })
  status!: 'DRAFT' | 'POSTED' | 'REVERSED';

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  // Relationship to general ledger entries
  @OneToMany(() => GeneralLedgerEntryEntity, (gle) => gle.journalId)
  generalLedgerEntries?: GeneralLedgerEntryEntity[];
}
