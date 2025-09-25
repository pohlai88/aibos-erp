export interface AdjustStockCommand {
  readonly adjustmentId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly adjustmentType: 'INCREASE' | 'DECREASE';
  readonly reason: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly unitCost?: number;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}
