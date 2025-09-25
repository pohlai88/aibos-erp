import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class ExchangeRatesUniquePerDay1700000000000 implements MigrationInterface {
  name = 'ExchangeRatesUniquePerDay1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_exchangerates_from_to_date
      ON exchange_rates (from_currency, to_currency, date)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS ix_exchangerates_date
      ON exchange_rates (date)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ix_exchangerates_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS ux_exchangerates_from_to_date`);
  }
}
