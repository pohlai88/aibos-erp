export interface ReceiveStockCommand {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly expiryDate?: Date;
  readonly serialNumbers?: string[];
}
