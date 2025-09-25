/* eslint-disable no-unused-vars */
import type { EventStore } from '../infrastructure/event-store/event-store';
import type { BatchTrackingService } from './batch-tracking.service';

import { Injectable, Logger } from '@nestjs/common';

export interface ExpiryAlert {
  readonly batchId: string;
  readonly sku: string;
  readonly batchNumber: string;
  readonly expiryDate: Date;
  readonly daysToExpiry: number;
  readonly quantity: number;
  readonly location: string;
  readonly alertLevel: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface ExpiryReport {
  readonly totalBatches: number;
  readonly expiringSoon: number;
  readonly expired: number;
  readonly totalValue: number;
  readonly alerts: ExpiryAlert[];
}

@Injectable()
export class ExpiryTrackingService {
  private readonly logger = new Logger(ExpiryTrackingService.name);

  constructor(
    private readonly _eventStore: EventStore,
    private readonly _batchTrackingService: BatchTrackingService,
  ) {}

  async getExpiryAlerts(tenantId: string, daysAhead: number = 30): Promise<ExpiryAlert[]> {
    this.logger.log(`Getting expiry alerts for ${daysAhead} days ahead`);

    const expiringBatches = await this._batchTrackingService.getExpiringItems(daysAhead, tenantId);

    return expiringBatches.map(
      (batch: {
        batchId: string;
        sku: string;
        batchNumber: string;
        expiryDate: Date;
        daysToExpiry: number;
        quantity: number;
        location: string;
      }) => ({
        batchId: batch.batchId,
        sku: batch.sku,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysToExpiry: batch.daysToExpiry,
        quantity: batch.quantity,
        location: batch.location,
        alertLevel: this.determineAlertLevel(batch.daysToExpiry),
      }),
    );
  }

  async getExpiryReport(tenantId: string): Promise<ExpiryReport> {
    this.logger.log(`Generating expiry report for tenant: ${tenantId}`);

    const allBatches = await this._batchTrackingService.getAllBatches(tenantId);
    const alerts = await this.getExpiryAlerts(tenantId, 30);

    const expiringSoon = alerts.filter(
      (alert) => alert.alertLevel === 'WARNING' || alert.alertLevel === 'CRITICAL',
    ).length;
    const expired = allBatches.filter((batch) => batch.isExpired()).length;
    const totalValue = allBatches.reduce((sum, batch) => sum + batch.quantity * 10, 0); // Mock unit cost

    return {
      totalBatches: allBatches.length,
      expiringSoon,
      expired,
      totalValue,
      alerts,
    };
  }

  async getExpiredBatches(tenantId: string): Promise<
    Array<{
      batchId: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      daysExpired: number;
      quantity: number;
      location: string;
    }>
  > {
    this.logger.log(`Getting expired batches for tenant: ${tenantId}`);

    const allBatches = await this._batchTrackingService.getAllBatches(tenantId);
    const today = new Date();

    return allBatches
      .filter((batch) => batch.isExpired())
      .map((batch) => ({
        batchId: batch.batchId,
        sku: batch.sku,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysExpired: Math.ceil((today.getTime() - batch.expiryDate.getTime()) / (1000 * 3600 * 24)),
        quantity: batch.quantity,
        location: batch.location,
      }));
  }

  async getExpiringSoonBatches(
    tenantId: string,
    daysAhead: number = 30,
  ): Promise<
    Array<{
      batchId: string;
      sku: string;
      batchNumber: string;
      expiryDate: Date;
      daysToExpiry: number;
      quantity: number;
      location: string;
    }>
  > {
    this.logger.log(`Getting batches expiring within ${daysAhead} days`);

    return await this._batchTrackingService.getExpiringItems(daysAhead, tenantId);
  }

  async scheduleExpiryNotifications(tenantId: string): Promise<void> {
    this.logger.log(`Scheduling expiry notifications for tenant: ${tenantId}`);

    const alerts = await this.getExpiryAlerts(tenantId, 30);

    for (const alert of alerts) {
      if (alert.alertLevel === 'CRITICAL') {
        await this.sendCriticalExpiryNotification(alert, tenantId);
      } else if (alert.alertLevel === 'WARNING') {
        await this.sendWarningExpiryNotification(alert, tenantId);
      }
    }
  }

  private determineAlertLevel(daysToExpiry: number): 'CRITICAL' | 'WARNING' | 'INFO' {
    if (daysToExpiry <= 7) return 'CRITICAL';
    if (daysToExpiry <= 30) return 'WARNING';
    return 'INFO';
  }

  private async sendCriticalExpiryNotification(
    alert: ExpiryAlert,
    _tenantId: string,
  ): Promise<void> {
    this.logger.warn(`CRITICAL: Batch ${alert.batchNumber} expires in ${alert.daysToExpiry} days`);
    // Implementation would send email/SMS notifications
  }

  private async sendWarningExpiryNotification(
    alert: ExpiryAlert,
    _tenantId: string,
  ): Promise<void> {
    this.logger.warn(`WARNING: Batch ${alert.batchNumber} expires in ${alert.daysToExpiry} days`);
    // Implementation would send email notifications
  }
}
