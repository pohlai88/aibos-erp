import type { AdjustStockCommand } from '../commands/adjust-stock-command';
import type { CycleCountCommand } from '../commands/cycle-count-command';
import type { IssueStockCommand } from '../commands/issue-stock-command';
import type { ReceiveStockCommand } from '../commands/receive-stock-command';
import type { TransferStockCommand } from '../commands/transfer-stock-command';

import { CycleCountEvent } from '../events/cycle-count-event';
import { StockAdjustmentEvent } from '../events/stock-adjustment-event';
import { StockIssuedEvent } from '../events/stock-issued-event';
import { StockReceivedEvent } from '../events/stock-received-event';
import { StockTransferEvent } from '../events/stock-transfer-event';
import { StockMovement, StockMovementType } from './stock-movement';
import { ValuationMethod } from './value-objects/valuation-method';
import { AggregateRoot, type DomainEvent } from '@aibos/eventsourcing';

export class InventoryItem extends AggregateRoot {
  private sku: string;
  private description: string;
  private unitOfMeasure: string;
  private valuationMethod: ValuationMethod;
  private stockMovements: StockMovement[] = [];
  private currentStock: Map<string, number> = new Map(); // location -> quantity

  constructor(
    id: string,
    sku: string,
    description: string,
    unitOfMeasure: string,
    valuationMethod: ValuationMethod,
    tenantId: string,
    version: number = 0,
  ) {
    super(id, version);
    this.sku = sku;
    this.description = description;
    this.unitOfMeasure = unitOfMeasure;
    this.valuationMethod = valuationMethod;
  }

  public receiveStock(command: ReceiveStockCommand): void {
    this.validateStockReceipt(command);

    const movement = new StockMovement(
      command.movementId,
      command.quantity,
      command.unitCost,
      command.location,
      StockMovementType.RECEIPT,
      command.reference,
    );

    this.stockMovements.push(movement);

    this.addEvent(
      new StockReceivedEvent(
        this.sku,
        command.quantity,
        command.unitCost,
        command.location,
        command.reference,
        command.tenantId,
        this.getVersion() + 1,
        command.batchNumber,
        command.expiryDate,
        command.serialNumbers,
      ),
    );
  }

  public issueStock(command: IssueStockCommand): void {
    this.validateStockIssue(command);

    const issueCost = this.calculateIssueCost(command);
    const movement = new StockMovement(
      command.movementId,
      command.quantity,
      issueCost,
      command.location,
      StockMovementType.ISSUE,
      command.reference,
    );

    this.stockMovements.push(movement);

    this.addEvent(
      new StockIssuedEvent(
        this.sku,
        command.quantity,
        issueCost,
        command.location,
        command.reference,
        command.tenantId,
        this.getVersion() + 1,
        command.batchNumber,
        command.serialNumbers,
      ),
    );
  }

  private validateStockReceipt(command: ReceiveStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Stock receipt quantity must be positive');
    }
    if (command.unitCost < 0) {
      throw new Error('Unit cost cannot be negative');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for stock receipt');
    }
  }

  private validateStockIssue(command: IssueStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Stock issue quantity must be positive');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for stock issue');
    }

    const currentStockAtLocation = this.currentStock.get(command.location) || 0;
    if (currentStockAtLocation < command.quantity) {
      throw new Error(
        `Insufficient stock at location ${command.location}. Available: ${currentStockAtLocation}, Required: ${command.quantity}`,
      );
    }
  }

  private calculateIssueCost(command: IssueStockCommand): number {
    switch (this.valuationMethod) {
      case ValuationMethod.FIFO:
        return this.calculateFIFOCost(command.quantity);
      case ValuationMethod.LIFO:
        return this.calculateLIFOCost(command.quantity);
      case ValuationMethod.WEIGHTED_AVERAGE:
        return this.calculateWeightedAverageCost();
      default:
        throw new Error('Invalid valuation method');
    }
  }

  private calculateFIFOCost(quantity: number): number {
    // Implementation for FIFO cost calculation
    const sortedMovements = this.stockMovements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let remainingQuantity = quantity;
    let totalCost = 0;

    for (const movement of sortedMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return totalCost / quantity;
  }

  private calculateLIFOCost(quantity: number): number {
    // Implementation for LIFO cost calculation
    const sortedMovements = this.stockMovements
      .filter((m) => m.movementType === StockMovementType.RECEIPT)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    let remainingQuantity = quantity;
    let totalCost = 0;

    for (const movement of sortedMovements) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = movement.quantity;
      const issueQuantity = Math.min(remainingQuantity, availableQuantity);

      totalCost += issueQuantity * movement.unitCost;
      remainingQuantity -= issueQuantity;
    }

    return totalCost / quantity;
  }

  private calculateWeightedAverageCost(): number {
    const receiptMovements = this.stockMovements.filter(
      (m) => m.movementType === StockMovementType.RECEIPT,
    );

    if (receiptMovements.length === 0) {
      return 0;
    }

    const totalCost = receiptMovements.reduce(
      (sum, movement) => sum + movement.quantity * movement.unitCost,
      0,
    );
    const totalQuantity = receiptMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    return totalCost / totalQuantity;
  }

  private updateCurrentStock(location: string, quantityChange: number): void {
    const currentQuantity = this.currentStock.get(location) || 0;
    this.currentStock.set(location, currentQuantity + quantityChange);
  }

  // Advanced Operations
  public transferStock(command: TransferStockCommand): void {
    this.validateStockTransfer(command);

    const transferCost = this.calculateTransferCost(command);

    // Create issue movement from source location
    const issueMovement = new StockMovement(
      command.transferId,
      command.quantity,
      transferCost,
      command.fromLocation,
      StockMovementType.ISSUE,
      command.reference,
    );

    // Create receipt movement to destination location
    const receiptMovement = new StockMovement(
      command.transferId,
      command.quantity,
      transferCost,
      command.toLocation,
      StockMovementType.RECEIPT,
      command.reference,
    );

    this.stockMovements.push(issueMovement, receiptMovement);

    this.addEvent(
      new StockTransferEvent(
        this.sku,
        command.quantity,
        command.fromLocation,
        command.toLocation,
        command.reference,
        command.tenantId,
        this.getVersion() + 1,
        transferCost,
        command.batchNumber,
        command.serialNumbers,
        command.reason,
      ),
    );
  }

  public adjustStock(command: AdjustStockCommand): void {
    this.validateStockAdjustment(command);

    const adjustmentQuantity =
      command.adjustmentType === 'INCREASE' ? command.quantity : -command.quantity;
    const unitCost = command.unitCost || this.calculateWeightedAverageCost();

    const movement = new StockMovement(
      command.adjustmentId,
      Math.abs(adjustmentQuantity),
      unitCost,
      command.location,
      StockMovementType.ADJUSTMENT,
      command.reference,
    );

    this.stockMovements.push(movement);

    this.addEvent(
      new StockAdjustmentEvent(
        this.sku,
        command.quantity,
        command.location,
        command.adjustmentType,
        command.reason,
        command.reference,
        command.tenantId,
        this.getVersion() + 1,
        unitCost,
        command.batchNumber,
        command.serialNumbers,
      ),
    );
  }

  public performCycleCount(command: CycleCountCommand): void {
    this.validateCycleCount(command);

    const currentStockAtLocation = this.currentStock.get(command.location) || 0;
    const variance = command.countedQuantity - currentStockAtLocation;

    if (variance !== 0) {
      // Create adjustment movement for the variance
      const adjustmentType = variance > 0 ? 'INCREASE' : 'DECREASE';
      const adjustmentQuantity = Math.abs(variance);
      const unitCost = this.calculateWeightedAverageCost();

      const movement = new StockMovement(
        command.cycleCountId,
        adjustmentQuantity,
        unitCost,
        command.location,
        StockMovementType.CYCLE_COUNT,
        command.reference,
      );

      this.stockMovements.push(movement);

      this.addEvent(
        new StockAdjustmentEvent(
          this.sku,
          adjustmentQuantity,
          command.location,
          adjustmentType,
          `Cycle count variance: ${variance > 0 ? '+' : ''}${variance}`,
          command.reference,
          command.tenantId,
          this.getVersion() + 1,
          unitCost,
          command.batchNumber,
          command.serialNumbers,
        ),
      );
    }

    // Always record the cycle count event
    this.addEvent(
      new CycleCountEvent(
        this.sku,
        command.location,
        command.countedQuantity,
        command.reference,
        command.tenantId,
        this.getVersion() + 1,
        command.countedBy,
        command.countedAt,
        command.notes,
        command.batchNumber,
        command.serialNumbers,
      ),
    );
  }

  private validateStockTransfer(command: TransferStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Transfer quantity must be positive');
    }
    if (command.fromLocation === command.toLocation) {
      throw new Error('Source and destination locations cannot be the same');
    }

    const currentStockAtSource = this.currentStock.get(command.fromLocation) || 0;
    if (currentStockAtSource < command.quantity) {
      throw new Error(
        `Insufficient stock at source location ${command.fromLocation}. Available: ${currentStockAtSource}, Required: ${command.quantity}`,
      );
    }
  }

  private validateStockAdjustment(command: AdjustStockCommand): void {
    if (command.quantity <= 0) {
      throw new Error('Adjustment quantity must be positive');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for stock adjustment');
    }
    if (!command.reason || command.reason.trim() === '') {
      throw new Error('Reason is required for stock adjustment');
    }
  }

  private validateCycleCount(command: CycleCountCommand): void {
    if (command.countedQuantity < 0) {
      throw new Error('Counted quantity cannot be negative');
    }
    if (!command.location || command.location.trim() === '') {
      throw new Error('Location is required for cycle count');
    }
    if (!command.countedBy || command.countedBy.trim() === '') {
      throw new Error('Counter name is required for cycle count');
    }
  }

  private calculateTransferCost(command: TransferStockCommand): number {
    // Use the same valuation method as issue operations
    return this.calculateIssueCost({
      movementId: command.transferId,
      sku: command.sku,
      quantity: command.quantity,
      location: command.fromLocation,
      reference: command.reference,
      tenantId: command.tenantId,
      userId: command.userId,
    } as IssueStockCommand);
  }

  // Getters
  public getSku(): string {
    return this.sku;
  }
  public getDescription(): string {
    return this.description;
  }
  public getUnitOfMeasure(): string {
    return this.unitOfMeasure;
  }
  public getValuationMethod(): ValuationMethod {
    return this.valuationMethod;
  }
  public getCurrentStock(): Map<string, number> {
    return new Map(this.currentStock);
  }
  public getStockMovements(): StockMovement[] {
    return [...this.stockMovements];
  }

  public getUnitCost(): number {
    return this.calculateWeightedAverageCost();
  }

  public getAvailableStock(): number {
    let total = 0;
    for (const quantity of this.currentStock.values()) {
      total += quantity;
    }
    return total;
  }

  public getReservedStock(): number {
    // For now, return 0 as we don't have reservation tracking yet
    return 0;
  }

  public getTotalStock(): number {
    return this.getAvailableStock();
  }

  public reserveStock(quantity: number, location: string): void {
    const currentQuantity = this.currentStock.get(location) || 0;
    if (currentQuantity < quantity) {
      throw new Error(`Insufficient stock at location ${location}`);
    }
    // For now, just log the reservation
    console.log(`Reserved ${quantity} units of ${this.sku} at ${location}`);
  }

  protected apply(event: DomainEvent): void {
    if (event instanceof StockReceivedEvent) {
      this.updateCurrentStock(event.location, event.quantity);
    } else if (event instanceof StockIssuedEvent) {
      this.updateCurrentStock(event.location, -event.quantity);
    } else if (event instanceof StockTransferEvent) {
      this.updateCurrentStock(event.fromLocation, -event.quantity);
      this.updateCurrentStock(event.toLocation, event.quantity);
    } else if (event instanceof StockAdjustmentEvent) {
      const quantityChange = event.adjustmentType === 'INCREASE' ? event.quantity : -event.quantity;
      this.updateCurrentStock(event.location, quantityChange);
    }
    // Note: CycleCountEvent doesn't change stock levels directly - it only records the count
  }
}
