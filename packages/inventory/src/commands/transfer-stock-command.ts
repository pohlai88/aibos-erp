export interface TransferStockCommand {
  readonly transferId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly fromLocation: string;
  readonly toLocation: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly reason?: string;
}
