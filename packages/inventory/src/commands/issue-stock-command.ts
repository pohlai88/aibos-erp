export interface IssueStockCommand {
  readonly movementId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}
