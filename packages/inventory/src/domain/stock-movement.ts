/* eslint-disable no-unused-vars */
export enum StockMovementType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  CYCLE_COUNT = 'CYCLE_COUNT',
}

// Individual enum values are available through StockMovementType enum

export class StockMovement {
  constructor(
    public readonly movementId: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly location: string,
    public readonly movementType: StockMovementType,
    public readonly reference: string,
    public readonly timestamp: Date = new Date(),
  ) {
    this.validateMovement();
  }

  private validateMovement(): void {
    if (this.quantity <= 0) {
      throw new Error('Movement quantity must be positive');
    }
    if (this.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    if (!this.location || this.location.trim() === '') {
      throw new Error('Location is required');
    }
    if (!this.reference || this.reference.trim() === '') {
      throw new Error('Reference is required');
    }
  }
}
