// Inventory Service Exports
export * from './domain/inventory-item';
export * from './domain/stock-movement';
export * from './domain/value-objects/valuation-method';
export * from './commands/receive-stock-command';
export * from './commands/issue-stock-command';
export * from './commands/transfer-stock-command';
export * from './commands/adjust-stock-command';
export * from './commands/cycle-count-command';
export * from './events/stock-received-event';
export * from './events/stock-issued-event';
export * from './events/stock-transfer-event';
export * from './events/stock-adjustment-event';
export * from './events/cycle-count-event';
export * from './services/inventory.service';
export * from './services/inventory-query.service';
export * from './services/valuation.service';
export * from './services/inventory-reporting.service';
export * from './domain/interfaces/repositories.interface';
export * from './infrastructure/resilience/circuit-breaker';
export * from './projections/inventory-projection';
export * from './projections/projection-repositories.interface';
export * from './projections/inventory-projection-handler';
export { StockLevelProjection } from './projections/stock-level-projection';
export * from './controllers/inventory.controller';
export * from './controllers/inventory-operations.controller';
export * from './infrastructure/database/entities/inventory-item.entity';
export * from './infrastructure/database/entities/stock-level.entity';
export * from './infrastructure/database/entities/stock-movement.entity';
export * from './infrastructure/database/repositories/inventory.repository';
export * from './infrastructure/database/repositories/stock-level.repository';

// Procurement Integration Exports
export * from './integrations/procurement-integration.service';
export * from './integrations/vendor-integration.service';
export * from './integrations/interfaces/procurement.interface';
export * from './integrations/dto/goods-receipt.dto';
export * from './integrations/dto/vendor-data.dto';
export * from './events/goods-receipt-processed-event';
export * from './events/vendor-inventory-updated-event';

// Warehouse Management Exports
export * from './services/warehouse-management.service';
export * from './domain/warehouse';
export * from './domain/location';

// Batch Tracking Exports
export * from './services/batch-tracking.service';
export * from './domain/batch';
export * from './domain/serial-number';

// Serial Number Management Exports
export * from './services/serial-number-management.service';

// Reconciliation Exports
export * from './services/reconciliation.service';
export * from './domain/reconciliation';

// Expiry Tracking Exports
export * from './services/expiry-tracking.service';

// Reservation Management Exports
export * from './services/reservation-management.service';
export * from './domain/stock-reservation';
export * from './exceptions/insufficient-stock-error';
export * from './exceptions/business-rule-violation';
export * from './domain/aggregate-root';
export * from './domain/domain-event';

// Manufacturing Integration Exports
export * from './services/bom-management.service';
export * from './services/production-order.service';
export * from './services/work-center-management.service';
export * from './domain/bill-of-materials';
export * from './domain/production-order';
export * from './domain/work-center';

// Quality Management Exports
export * from './integrations/quality-integration.service';
export * from './services/ncr-management.service';
export * from './domain/quality-inspection';
export * from './domain/non-conformance-report';

// CRM Integration Exports
export * from './integrations/crm-integration.service';
export * from './integrations/sales-pipeline-integration.service';
export * from './services/customer-inventory.service';
export * from './integrations/interfaces/crm.interface';
export * from './integrations/dto/customer-inventory.dto';
export * from './domain/customer';
export * from './domain/sales-opportunity';

// Order Management Integration Exports
export * from './integrations/order-management-integration.service';
export * from './services/order-fulfillment.service';
export * from './domain/order';
export * from './domain/fulfillment';

// Backorder Management Exports
export * from './services/backorder-management.service';
export * from './domain/backorder';

// Order-Inventory Synchronization Exports
export * from './services/order-inventory-sync.service';

// Domain Events Exports
export * from './events/customer-events';
export * from './events/sales-opportunity-events';
export * from './events/order-events';
