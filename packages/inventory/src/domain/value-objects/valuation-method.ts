/* eslint-disable no-unused-vars */
export enum ValuationMethod {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  STANDARD_COST = 'STANDARD_COST',
  MOVING_AVERAGE = 'MOVING_AVERAGE',
}

// Individual enum values are available through ValuationMethod enum

export class ValuationMethodValidator {
  static validate(method: string): ValuationMethod {
    const validMethods = Object.values(ValuationMethod);
    if (!validMethods.includes(method as ValuationMethod)) {
      throw new Error(
        `Invalid valuation method: ${method}. Valid methods: ${validMethods.join(', ')}`,
      );
    }
    return method as ValuationMethod;
  }
}
