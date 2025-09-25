export interface CycleCountCommand {
  readonly cycleCountId: string;
  readonly sku: string;
  readonly location: string;
  readonly countedQuantity: number;
  readonly reference: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly countedBy: string;
  readonly countedAt: Date;
  readonly notes?: string;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
}
