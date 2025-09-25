import {
  ValuationMethod,
  ValuationMethodValidator,
} from '../domain/value-objects/valuation-method';
import { describe, it, expect } from 'vitest';

describe('ValuationMethod', () => {
  describe('enum values', () => {
    it('should have correct FIFO value', () => {
      expect(ValuationMethod.FIFO).toBe('FIFO');
    });

    it('should have correct LIFO value', () => {
      expect(ValuationMethod.LIFO).toBe('LIFO');
    });

    it('should have correct WEIGHTED_AVERAGE value', () => {
      expect(ValuationMethod.WEIGHTED_AVERAGE).toBe('WEIGHTED_AVERAGE');
    });

    it('should have correct STANDARD_COST value', () => {
      expect(ValuationMethod.STANDARD_COST).toBe('STANDARD_COST');
    });

    it('should have correct MOVING_AVERAGE value', () => {
      expect(ValuationMethod.MOVING_AVERAGE).toBe('MOVING_AVERAGE');
    });
  });

  describe('ValuationMethodValidator', () => {
    it('should validate FIFO method', () => {
      const result = ValuationMethodValidator.validate('FIFO');
      expect(result).toBe(ValuationMethod.FIFO);
    });

    it('should validate LIFO method', () => {
      const result = ValuationMethodValidator.validate('LIFO');
      expect(result).toBe(ValuationMethod.LIFO);
    });

    it('should validate WEIGHTED_AVERAGE method', () => {
      const result = ValuationMethodValidator.validate('WEIGHTED_AVERAGE');
      expect(result).toBe(ValuationMethod.WEIGHTED_AVERAGE);
    });

    it('should validate STANDARD_COST method', () => {
      const result = ValuationMethodValidator.validate('STANDARD_COST');
      expect(result).toBe(ValuationMethod.STANDARD_COST);
    });

    it('should validate MOVING_AVERAGE method', () => {
      const result = ValuationMethodValidator.validate('MOVING_AVERAGE');
      expect(result).toBe(ValuationMethod.MOVING_AVERAGE);
    });

    it('should throw error for invalid method', () => {
      expect(() => {
        ValuationMethodValidator.validate('INVALID_METHOD');
      }).toThrow(
        'Invalid valuation method: INVALID_METHOD. Valid methods: FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => {
        ValuationMethodValidator.validate('');
      }).toThrow(
        'Invalid valuation method: . Valid methods: FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE',
      );
    });

    it('should throw error for null', () => {
      expect(() => {
        ValuationMethodValidator.validate(null as any);
      }).toThrow(
        'Invalid valuation method: null. Valid methods: FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE',
      );
    });

    it('should throw error for undefined', () => {
      expect(() => {
        ValuationMethodValidator.validate(undefined as any);
      }).toThrow(
        'Invalid valuation method: undefined. Valid methods: FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE',
      );
    });

    it('should be case sensitive', () => {
      expect(() => {
        ValuationMethodValidator.validate('fifo');
      }).toThrow(
        'Invalid valuation method: fifo. Valid methods: FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST, MOVING_AVERAGE',
      );
    });
  });
});
