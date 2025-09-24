import type { TaxAccountsMap } from './tax-line-calculator.service';

import { Injectable } from '@nestjs/common';

@Injectable()
export class DefaultTaxAccountsMap implements TaxAccountsMap {
  constructor(
    private readonly defaults: {
      output: string; // e.g., '2201-VAT-OUTPUT'
      input: string; // e.g., '1205-VAT-INPUT'
      whtPay: string; // e.g., '2210-WHT-PAYABLE'
      whtRecv: string; // e.g., '1210-WHT-RECEIVABLE'
    } = {
      output: '2201-VAT-OUTPUT',
      input: '1205-VAT-INPUT',
      whtPay: '2210-WHT-PAYABLE',
      whtRecv: '1210-WHT-RECEIVABLE',
    },
  ) {}

  outputTaxLiability(_country: string, _taxCode: string): string {
    return this.defaults.output;
  }
  inputTaxRecoverable(_country: string, _taxCode: string): string {
    return this.defaults.input;
  }
  withholdingPayable(_country: string, _taxCode: string): string {
    return this.defaults.whtPay;
  }
  withholdingReceivable(_country: string, _taxCode: string): string {
    return this.defaults.whtRecv;
  }
}
