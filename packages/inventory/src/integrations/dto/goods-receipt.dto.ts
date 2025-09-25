import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';

export class GRNItemDto {
  @IsString()
  sku!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitCost!: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsString()
  location!: string;
}

export class GoodsReceiptNoteDto {
  @IsUUID()
  grnId!: string;

  @IsString()
  purchaseOrderId!: string;

  @IsString()
  vendorId!: string;

  @IsDateString()
  receivedDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GRNItemDto)
  items!: GRNItemDto[];

  @IsString()
  tenantId!: string;

  @IsString()
  userId!: string;
}

export class PurchaseOrderValidationDto {
  @IsString()
  poId!: string;

  @IsString()
  sku!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  tenantId!: string;
}

export class GRNProcessingResultDto {
  @IsUUID()
  grnId!: string;

  @IsString()
  status!: 'SUCCESS' | 'PARTIAL' | 'FAILED';

  @IsNumber()
  processedItems!: number;

  @IsNumber()
  totalItems!: number;

  @IsArray()
  @IsString({ each: true })
  errors!: string[];

  @IsDateString()
  processedAt!: string;
}
