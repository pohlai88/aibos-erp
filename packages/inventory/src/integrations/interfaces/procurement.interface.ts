export interface GoodsReceiptNote {
  readonly grnId: string;
  readonly purchaseOrderId: string;
  readonly vendorId: string;
  readonly receivedDate: Date;
  readonly items: GRNItem[];
  readonly tenantId: string;
  readonly userId: string;
}

export interface GRNItem {
  readonly sku: string;
  readonly quantity: number;
  readonly unitCost: number;
  readonly batchNumber?: string;
  readonly serialNumbers?: string[];
  readonly expiryDate?: Date;
  readonly location: string;
}

export interface PurchaseOrderValidation {
  readonly poId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly tenantId: string;
  readonly isValid: boolean;
  readonly availableStock: number;
  readonly shortfall?: number;
}

export interface VendorInventoryData {
  readonly vendorId: string;
  readonly sku: string;
  readonly vendorSku: string;
  readonly vendorName: string;
  readonly leadTime: number; // days
  readonly minimumOrderQuantity: number;
  readonly priceBreaks: PriceBreak[];
  readonly isActive: boolean;
  readonly tenantId: string;
}

export interface PriceBreak {
  readonly quantity: number;
  readonly unitPrice: number;
  readonly effectiveDate: Date;
}

export interface GRNProcessingResult {
  readonly grnId: string;
  readonly status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  readonly processedItems: number;
  readonly totalItems: number;
  readonly errors: string[];
  readonly processedAt: Date;
}
