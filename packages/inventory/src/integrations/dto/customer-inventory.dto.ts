import type { CustomerTier, OpportunityStage } from '../interfaces/crm.interface';

import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CustomerInventoryItemDto {
  @IsString()
  sku!: string;

  @IsString()
  description!: string;

  @IsNumber()
  availableQuantity!: number;

  @IsNumber()
  reservedQuantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  customerPrice!: number;

  @IsNumber()
  discountPercentage!: number;

  @IsNumber()
  leadTime!: number;

  @IsString()
  location!: string;
}

export class CustomerInventoryViewDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  customerName!: string;

  @IsEnum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
  customerTier!: CustomerTier;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerInventoryItemDto)
  inventoryItems!: CustomerInventoryItemDto[];

  @IsNumber()
  totalValue!: number;

  @IsDateString()
  lastUpdated!: string;

  @IsUUID()
  tenantId!: string;
}

export class CustomerPricingUpdateDto {
  @IsString()
  sku!: string;

  @IsNumber()
  customerPrice!: number;

  @IsNumber()
  discountPercentage!: number;
}

export class CreditImpactDto {
  @IsUUID()
  customerId!: string;

  @IsString()
  sku!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  totalValue!: number;

  @IsNumber()
  creditLimit!: number;

  @IsNumber()
  currentCreditUsed!: number;

  @IsNumber()
  availableCredit!: number;

  @IsNumber()
  creditImpact!: number;

  @IsNumber()
  canProcessOrder!: number; // boolean as number for DTO
}

export class OpportunityItemDto {
  @IsString()
  sku!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsString()
  location!: string;
}

export class SalesOpportunityDto {
  @IsUUID()
  opportunityId!: string;

  @IsUUID()
  customerId!: string;

  @IsUUID()
  salesRepId!: string;

  @IsEnum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
  stage!: OpportunityStage;

  @IsNumber()
  probability!: number;

  @IsDateString()
  expectedCloseDate!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunityItemDto)
  items!: OpportunityItemDto[];

  @IsUUID()
  tenantId!: string;
}
