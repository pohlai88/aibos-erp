import {
  StockReservation,
  type ReservationSummary,
  type ReservationReport,
} from '../domain/stock-reservation';
import { InsufficientStockError } from '../exceptions/insufficient-stock-error';
import { type EventStore } from '../infrastructure/event-store/event-store';
import { type InventoryService } from './inventory.service';
import { Injectable, type Logger } from '@nestjs/common';

const METHOD_NOT_IMPLEMENTED = 'Method not implemented';

@Injectable()
export class ReservationManagementService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _inventoryService: InventoryService,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async reserveStock(command: ReserveStockCommand): Promise<void> {
    // Validate available stock
    const availableStock = await this._inventoryService.getAvailableStock(
      command.sku,
      command.location,
      command.tenantId,
    );

    if (availableStock < command.quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for reservation. Available: ${availableStock}, Required: ${command.quantity}`,
      );
    }

    const reservation = new StockReservation(
      command.reservationId,
      command.sku,
      command.quantity,
      command.location,
      command.orderId,
      command.customerId,
      command.reservedUntil,
      command.tenantId,
    );

    await this._eventStore.append(
      `reservation-${command.reservationId}`,
      reservation.getUncommittedEvents(),
      reservation.getVersion(),
    );

    reservation.markEventsAsCommitted();
    this._logger.log(
      `Reserved ${command.quantity} units of ${command.sku} for order ${command.orderId}`,
    );
  }

  async releaseReservation(reservationId: string, tenantId: string): Promise<void> {
    const reservation = await this.loadReservation(reservationId, tenantId);
    reservation.releaseReservation();

    await this._eventStore.append(
      `reservation-${reservationId}`,
      reservation.getUncommittedEvents(),
      reservation.getVersion(),
    );

    reservation.markEventsAsCommitted();
    this._logger.log(`Released reservation: ${reservationId}`);
  }

  async extendReservation(command: ExtendReservationCommand): Promise<void> {
    const reservation = await this.loadReservation(command.reservationId, command.tenantId);
    reservation.extendReservation(command.newExpiryDate);

    await this._eventStore.append(
      `reservation-${command.reservationId}`,
      reservation.getUncommittedEvents(),
      reservation.getVersion(),
    );

    reservation.markEventsAsCommitted();
    this._logger.log(
      `Extended reservation: ${command.reservationId} until ${command.newExpiryDate}`,
    );
  }

  async getReservedStock(sku: string, location: string, tenantId: string): Promise<number> {
    const reservations = await this.getActiveReservations(sku, location, tenantId);
    return reservations.reduce((total, reservation) => total + reservation.quantity, 0);
  }

  async getReservationSummary(
    reservationId: string,
    tenantId: string,
  ): Promise<ReservationSummary> {
    const reservation = await this.loadReservation(reservationId, tenantId);

    return {
      reservationId: reservation.reservationId,
      sku: reservation.sku,
      quantity: reservation.quantity,
      location: reservation.location,
      orderId: reservation.orderId,
      customerId: reservation.customerId,
      reservedUntil: reservation.reservedUntil,
      daysUntilExpiry: reservation.getDaysUntilExpiry(),
      isExpired: reservation.isExpired(),
      isExpiringSoon: reservation.isExpiringSoon(7), // 7 days ahead
    };
  }

  async getReservationReport(tenantId: string): Promise<ReservationReport> {
    const reservations = await this.getAllReservations(tenantId);
    const activeReservations = reservations.filter((r) => !r.isExpired());
    const expiredReservations = reservations.filter((r) => r.isExpired());
    const expiringSoonReservations = reservations.filter((r) => r.isExpiringSoon(7));

    // Calculate total reserved value
    const totalReservedValue = await this.calculateTotalReservedValue(reservations);

    // Group by SKU
    const reservationsBySku = await this.groupReservationsBySku(reservations);

    return {
      totalReservations: reservations.length,
      activeReservations: activeReservations.length,
      expiredReservations: expiredReservations.length,
      expiringSoonReservations: expiringSoonReservations.length,
      totalReservedValue,
      reservationsBySku,
    };
  }

  async getExpiringReservations(
    daysAhead: number,
    tenantId: string,
  ): Promise<ReservationSummary[]> {
    const reservations = await this.getAllReservations(tenantId);

    return reservations
      .filter((r) => r.isExpiringSoon(daysAhead))
      .map((r) => ({
        reservationId: r.reservationId,
        sku: r.sku,
        quantity: r.quantity,
        location: r.location,
        orderId: r.orderId,
        customerId: r.customerId,
        reservedUntil: r.reservedUntil,
        daysUntilExpiry: r.getDaysUntilExpiry(),
        isExpired: r.isExpired(),
        isExpiringSoon: r.isExpiringSoon(daysAhead),
      }));
  }

  async releaseOrderReservations(orderId: string, tenantId: string): Promise<void> {
    const reservations = await this.getReservationsByOrder(orderId, tenantId);

    for (const reservation of reservations) {
      await this.releaseReservation(reservation.reservationId, tenantId);
    }

    this._logger.log(`Released all reservations for order: ${orderId}`);
  }

  private async loadReservation(
    reservationId: string,
    tenantId: string,
  ): Promise<StockReservation> {
    // For now, return mock data - in production this would load from event store
    const reservation = new StockReservation(
      reservationId,
      'SKU-001',
      100,
      'WAREHOUSE-A',
      'order-001',
      'customer-001',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // expires tomorrow
      tenantId,
    );

    // Mark as committed since we're loading from "event store"
    reservation.markEventsAsCommitted();

    return reservation;
  }

  private async getActiveReservations(
    sku: string,
    location: string,
    tenantId: string,
  ): Promise<StockReservation[]> {
    // For now, return mock data - in production this would query the database
    const reservations: StockReservation[] = [];

    // Create some mock active reservations
    const reservation1 = new StockReservation(
      `reservation-${sku}-001`,
      sku,
      50,
      location,
      'order-001',
      'customer-001',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // expires tomorrow
      tenantId,
    );
    reservation1.markEventsAsCommitted();
    reservations.push(reservation1);

    const reservation2 = new StockReservation(
      `reservation-${sku}-002`,
      sku,
      25,
      location,
      'order-002',
      'customer-002',
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // expires in 2 days
      tenantId,
    );
    reservation2.markEventsAsCommitted();
    reservations.push(reservation2);

    return reservations;
  }

  /* eslint-disable no-unused-vars */
  private async getAllReservations(_tenantId: string): Promise<StockReservation[]> {
    // Implementation for getting all reservations
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getReservationsByOrder(
    _orderId: string,
    _tenantId: string,
  ): Promise<StockReservation[]> {
    // Implementation for getting reservations by order
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async calculateTotalReservedValue(_reservations: StockReservation[]): Promise<number> {
    // Implementation for calculating total reserved value
    return 0;
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async groupReservationsBySku(_reservations: StockReservation[]): Promise<
    Array<{
      sku: string;
      reservedQuantity: number;
      reservedValue: number;
    }>
  > {
    // Implementation for grouping reservations by SKU
    return [];
  }
  /* eslint-enable no-unused-vars */
}

export interface ReserveStockCommand {
  readonly reservationId: string;
  readonly sku: string;
  readonly quantity: number;
  readonly location: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly reservedUntil: Date;
  readonly tenantId: string;
}

export interface ExtendReservationCommand {
  readonly reservationId: string;
  readonly newExpiryDate: Date;
  readonly tenantId: string;
}
