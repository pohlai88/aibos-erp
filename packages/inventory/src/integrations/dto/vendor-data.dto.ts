import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';

export class PriceBreakDto {
  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsDateString()
  effectiveDate!: string;
}

export class VendorInventoryDataDto {
  @IsString()
  vendorId!: string;

  @IsString()
  sku!: string;

  @IsString()
  vendorSku!: string;

  @IsString()
  vendorName!: string;

  @IsNumber()
  leadTime!: number; // days

  @IsNumber()
  minimumOrderQuantity!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceBreakDto)
  priceBreaks!: PriceBreakDto[];

  @IsBoolean()
  isActive!: boolean;

  @IsString()
  tenantId!: string;
}

export class VendorPricingUpdateDto {
  @IsString()
  sku!: string;

  @IsNumber()
  customerPrice!: number;

  @IsNumber()
  discountPercentage!: number;
}

export class VendorInventoryUpdateDto {
  @IsString()
  sku!: string;

  @IsString()
  vendorId!: string;

  @IsString()
  vendorSku!: string;

  @IsString()
  vendorName!: string;

  @IsNumber()
  leadTime!: number;

  @IsNumber()
  minimumOrderQuantity!: number;

  @IsString()
  tenantId!: string;
}
