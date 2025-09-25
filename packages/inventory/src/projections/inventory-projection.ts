export interface InventoryProjection {
  readonly sku: string;
  readonly description: string;
  readonly unitOfMeasure: string;
  readonly valuationMethod: string;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly averageCost: number;
  readonly lastUpdated: Date;
  readonly tenantId: string;
}

export interface StockLevelProjection {
  readonly sku: string;
  readonly location: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly totalValue: number;
  readonly lastMovement: Date;
  readonly tenantId: string;
}

export interface StockMovementProjection {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly movementType: string;
  readonly reference: string;
  readonly timestamp: Date;
  readonly tenantId: string;
}

export interface InventorySummaryProjection {
  readonly totalItems: number;
  readonly totalStock: number;
  readonly totalValue: number;
  readonly lowStockItems: number;
  readonly outOfStockItems: number;
  readonly lastUpdated: Date;
  readonly tenantId: string;
}
