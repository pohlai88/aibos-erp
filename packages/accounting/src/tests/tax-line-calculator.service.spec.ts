import { DefaultTaxAccountsMap } from '../services/tax-account.mapper';
import {
  TaxLineCalculatorService,
  type TaxableLineInput,
} from '../services/tax-line-calculator.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock TaxComplianceService
class FakeTaxService {
  calculateTax = vi.fn();
}

describe('TaxLineCalculatorService', () => {
  let svc: TaxLineCalculatorService;
  let tax: FakeTaxService;
  const DEFAULT_ACCOUNTS = {
    output: '2201-VAT-OUTPUT',
    input: '1205-VAT-INPUT',
    whtPay: '2210-WHT-PAYABLE',
    whtRecv: '1210-WHT-RECEIVABLE',
  };
  const map = new DefaultTaxAccountsMap(DEFAULT_ACCOUNTS);

  beforeEach(() => {
    tax = new FakeTaxService();
    svc = new TaxLineCalculatorService(tax as any, map);
  });

  it('SALE VAT 10% exclusive: outputs liability credit and AR control debit', async () => {
    tax.calculateTax.mockReturnValue({
      taxLines: [
        {
          taxCode: 'VAT10',
          taxAmount: 10,
          jurisdiction: 'SG',
          isRecoverable: false,
          taxType: 'OUTPUT',
          taxableAmount: 100,
          description: 'VAT 10%',
        },
      ],
      totalTaxAmount: 10,
      totalTaxableAmount: 100,
      totalRecoverableTax: 0,
      totalNonRecoverableTax: 10,
      jurisdiction: 'SG',
      currency: 'USD',
    });

    const line: TaxableLineInput = {
      accountCode: '4000-SALES',
      side: 'CREDIT',
      amount: 100,
      currency: 'USD',
      flow: 'SALE',
      controlAccountCode: '1100-AR',
      country: 'SG',
      taxType: 'VAT',
      isInclusive: false,
      date: new Date(),
    };

    const res = await svc.buildTaxLines([line]);
    // Expect two lines: credit VAT output 10; debit AR 10
    expect(res).toEqual([
      {
        accountCode: DEFAULT_ACCOUNTS.output,
        debitAmount: 0,
        creditAmount: 10,
        memo: expect.stringContaining('Output tax'),
      },
      {
        accountCode: '1100-AR',
        debitAmount: 10,
        creditAmount: 0,
        memo: expect.stringContaining('AR control'),
      },
    ]);
  });

  it('PURCHASE VAT 10% exclusive: inputs recoverable debit and AP control credit', async () => {
    tax.calculateTax.mockReturnValue({
      taxLines: [
        {
          taxCode: 'SST-10%',
          taxAmount: 10,
          jurisdiction: 'MY',
          isRecoverable: false,
          taxType: 'INPUT',
          taxableAmount: 100,
          description: 'SST 10%',
        },
      ],
      totalTaxAmount: 10,
      totalTaxableAmount: 100,
      totalRecoverableTax: 0,
      totalNonRecoverableTax: 10,
      jurisdiction: 'MY',
      currency: 'USD',
    });

    const line: TaxableLineInput = {
      accountCode: '5000-EXP',
      side: 'DEBIT',
      amount: 100,
      currency: 'USD',
      flow: 'PURCHASE',
      controlAccountCode: '2100-AP',
      country: 'MY',
      taxType: 'SST',
      isInclusive: false,
      date: new Date(),
    };

    const res = await svc.buildTaxLines([line]);
    expect(res).toEqual([
      {
        accountCode: DEFAULT_ACCOUNTS.input,
        debitAmount: 10,
        creditAmount: 0,
        memo: expect.stringContaining('Input tax'),
      },
      {
        accountCode: '2100-AP',
        debitAmount: 0,
        creditAmount: 10,
        memo: expect.stringContaining('AP control'),
      },
    ]);
  });

  it('PURCHASE with WHT 2%: debit AP control, credit WHT payable', async () => {
    tax.calculateTax.mockReturnValue({
      taxLines: [
        {
          taxCode: 'WHT-2%',
          taxAmount: 2,
          jurisdiction: 'TH',
          isRecoverable: false,
          taxType: 'INPUT',
          taxableAmount: 100,
          description: 'WHT 2%',
        },
      ],
      totalTaxAmount: 2,
      totalTaxableAmount: 100,
      totalRecoverableTax: 0,
      totalNonRecoverableTax: 2,
      jurisdiction: 'TH',
      currency: 'USD',
    });

    const line: TaxableLineInput = {
      accountCode: '5000-SERVICES',
      side: 'DEBIT',
      amount: 100,
      currency: 'USD',
      flow: 'PURCHASE',
      controlAccountCode: '2100-AP',
      country: 'TH',
      taxType: 'WHT',
      isInclusive: false,
      date: new Date(),
    };

    const res = await svc.buildTaxLines([line]);
    expect(res).toEqual([
      {
        accountCode: DEFAULT_ACCOUNTS.input,
        debitAmount: 2,
        creditAmount: 0,
        memo: 'Input tax WHT-2%',
      },
      {
        accountCode: '2100-AP',
        debitAmount: 0,
        creditAmount: 2,
        memo: 'AP control tax WHT-2%',
      },
    ]);
  });
});
