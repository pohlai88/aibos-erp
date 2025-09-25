/* eslint-disable no-unused-vars */
import { type StockMovement, StockMovementType } from '../domain/stock-movement';
import { ValuationMethod } from '../domain/value-objects/valuation-method';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);

  calculateValuation(
    movements: StockMovement[],
    method: ValuationMethod,
    issueQuantity: number,
  ): number {
    this.logger.log(`Calculating valuation using ${method} method for quantity ${issueQuantity}`);

    switch (method) {
      case ValuationMethod.FIFO:
        return this.calculateFIFOValuation(movements, issueQuantity);
      case ValuationMethod.LIFO:
        return this.calculateLIFOValuation(movements, issueQuantity);
      case ValuationMethod.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverageValuation(movements);
      case ValuationMethod.STANDARD_COST:
        return this.calculateStandardCostValuation(movements);
      case ValuationMethod.MOVING_AVERAGE:
        return this.calculateMovingAverageValuation(movements);
      default:
        throw new Error(`Unsupported valuation method: ${method}`);
    }
  }

  private calculateFIFOValuation(movements: StockMovement[], issueQuantity: number): number {
    const receiptMovements = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let remainingQuantity = issueQuantity;
    let totalCost = 0;

    for (const movement of receiptMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantityFromMovement = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantityFromMovement * movement.unitCost;
      remainingQuantity -= issueQuantityFromMovement;
    }

    if (remainingQuantity > 0) {
      this.logger.warn(
        `Insufficient stock for FIFO calculation. Remaining quantity: ${remainingQuantity}`,
      );
      return 0;
    }

    return totalCost / issueQuantity;
  }

  private calculateLIFOValuation(movements: StockMovement[], issueQuantity: number): number {
    const receiptMovements = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let remainingQuantity = issueQuantity;
    let totalCost = 0;

    for (const movement of receiptMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantityFromMovement = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantityFromMovement * movement.unitCost;
      remainingQuantity -= issueQuantityFromMovement;
    }

    if (remainingQuantity > 0) {
      this.logger.warn(
        `Insufficient stock for LIFO calculation. Remaining quantity: ${remainingQuantity}`,
      );
      return 0;
    }

    return totalCost / issueQuantity;
  }

  private calculateWeightedAverageValuation(movements: StockMovement[]): number {
    const receiptMovements = movements.filter((m) => m.movementType === StockMovementType.RECEIPT);

    if (receiptMovements.length === 0) {
      return 0;
    }

    const totalCost = receiptMovements.reduce(
      (sum, movement) => sum + movement.quantity * movement.unitCost,
      0,
    );
    const totalQuantity = receiptMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  private calculateStandardCostValuation(movements: StockMovement[]): number {
    // Standard cost is typically set by management and doesn't change with movements
    // This would need to be retrieved from a standard cost table
    // For now, we'll use the latest receipt cost as a proxy
    const latestReceipt = movements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestReceipt?.unitCost || 0;
  }

  private calculateMovingAverageValuation(movements: StockMovement[]): number {
    // Moving average recalculates after each receipt
    const sortedMovements = movements.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let totalCost = 0;
    let totalQuantity = 0;

    for (const movement of sortedMovements) {
      if (movement.movementType === StockMovementType.RECEIPT) {
        totalCost += movement.quantity * movement.unitCost;
        totalQuantity += movement.quantity;
      } else if (movement.movementType === StockMovementType.ISSUE) {
        // Issues don't affect the moving average calculation
        continue;
      }
    }

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  calculateTotalValue(movements: StockMovement[], _method: ValuationMethod): number {
    const receiptMovements = movements.filter((m) => m.movementType === StockMovementType.RECEIPT);
    const totalQuantity = receiptMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    if (totalQuantity === 0) {
      return 0;
    }

    const averageCost = this.calculateWeightedAverageValuation(movements);
    return totalQuantity * averageCost;
  }

  calculateAverageCost(movements: StockMovement[], _method: ValuationMethod): number {
    return this.calculateWeightedAverageValuation(movements);
  }
}
