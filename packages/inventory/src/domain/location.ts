import { type LocationType } from './warehouse';

export interface Location {
  readonly locationId: string;
  readonly locationCode: string;
  readonly locationName: string;
  readonly capacity: number;
  readonly currentCapacity: number;
  readonly locationType: LocationType;
  readonly warehouseId: string;
  readonly zoneId?: string;
  readonly isActive: boolean;
  readonly tenantId: string;
}

export interface LocationUtilization {
  readonly locationId: string;
  readonly locationCode: string;
  readonly currentCapacity: number;
  readonly maxCapacity: number;
  readonly utilizationPercentage: number;
  readonly items: LocationItem[];
}

export interface LocationItem {
  readonly sku: string;
  readonly quantity: number;
  readonly value: number;
}

export interface LocationCapacityReport {
  readonly warehouseId: string;
  readonly totalLocations: number;
  readonly totalCapacity: number;
  readonly usedCapacity: number;
  readonly availableCapacity: number;
  readonly utilizationPercentage: number;
  readonly locations: LocationUtilization[];
}

export interface LocationUtilizationReport {
  readonly warehouseId: string;
  readonly warehouseName: string;
  readonly warehouseCode: string;
  readonly totalCapacity: number;
  readonly usedCapacity: number;
  readonly utilizationPercentage: number;
  readonly locations: LocationUtilization[];
}
