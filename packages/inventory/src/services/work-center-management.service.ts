import type { EventStore } from '../infrastructure/event-store/event-store';

import {
  WorkCenter,
  type CreateWorkCenterCommand,
  type UpdateWorkCenterCapacityCommand,
  type WorkCenterUtilizationReport,
} from '../domain/work-center';
import { Injectable, type Logger } from '@nestjs/common';

export class InsufficientCapacityError extends Error {
  public override readonly name = 'InsufficientCapacityError' as const;

  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCapacityError';
  }
}

const METHOD_NOT_IMPLEMENTED = 'Method not implemented';

@Injectable()
export class WorkCenterManagementService {
  /* eslint-disable no-unused-vars */
  constructor(
    private readonly _eventStore: EventStore,
    private readonly _logger: Logger,
  ) {}
  /* eslint-enable no-unused-vars */

  async createWorkCenter(command: CreateWorkCenterCommand): Promise<void> {
    this._logger.log(`Creating work center: ${command.workCenterCode}`);

    const workCenter = new WorkCenter(
      command.workCenterId,
      command.workCenterName,
      command.workCenterCode,
      command.capacity,
      0, // currentLoad
      command.efficiency,
      true, // isActive
      command.tenantId,
    );

    await this._eventStore.append(
      `work-center-${command.workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async updateWorkCenterCapacity(command: UpdateWorkCenterCapacityCommand): Promise<void> {
    this._logger.log(`Updating work center capacity: ${command.workCenterId}`);

    const workCenter = await this.loadWorkCenter(command.workCenterId, command.tenantId);
    workCenter.updateCapacity(command.capacity);

    await this._eventStore.append(
      `work-center-${command.workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async allocateCapacity(
    workCenterId: string,
    requiredCapacity: number,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Allocating capacity ${requiredCapacity} to work center: ${workCenterId}`);

    const workCenter = await this.loadWorkCenter(workCenterId, tenantId);

    try {
      workCenter.allocateCapacity(requiredCapacity);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Insufficient work center capacity')) {
        throw new InsufficientCapacityError(error.message);
      }
      throw error;
    }

    await this._eventStore.append(
      `work-center-${workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async releaseCapacity(
    workCenterId: string,
    releasedCapacity: number,
    tenantId: string,
  ): Promise<void> {
    this._logger.log(`Releasing capacity ${releasedCapacity} from work center: ${workCenterId}`);

    const workCenter = await this.loadWorkCenter(workCenterId, tenantId);
    workCenter.releaseCapacity(releasedCapacity);

    await this._eventStore.append(
      `work-center-${workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async activateWorkCenter(workCenterId: string, tenantId: string): Promise<void> {
    this._logger.log(`Activating work center: ${workCenterId}`);

    const workCenter = await this.loadWorkCenter(workCenterId, tenantId);
    workCenter.activate();

    await this._eventStore.append(
      `work-center-${workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async deactivateWorkCenter(workCenterId: string, tenantId: string): Promise<void> {
    this._logger.log(`Deactivating work center: ${workCenterId}`);

    const workCenter = await this.loadWorkCenter(workCenterId, tenantId);
    workCenter.deactivate();

    await this._eventStore.append(
      `work-center-${workCenterId}`,
      workCenter.getUncommittedEvents(),
      workCenter.getVersion(),
    );

    workCenter.markEventsAsCommitted();
  }

  async getWorkCenter(workCenterId: string, tenantId: string): Promise<WorkCenter> {
    return this.loadWorkCenter(workCenterId, tenantId);
  }

  async getWorkCenterUtilization(tenantId: string): Promise<WorkCenterUtilizationReport[]> {
    const workCenters = await this.getAllWorkCenters(tenantId);

    return workCenters.map((wc) => ({
      workCenterId: wc.workCenterId,
      workCenterCode: wc.workCenterCode,
      capacity: wc.capacity,
      currentLoad: wc.currentLoad,
      utilizationPercentage: wc.getUtilizationPercentage(),
      availableCapacity: wc.getAvailableCapacity(),
      efficiency: wc.efficiency,
    }));
  }

  async getAvailableWorkCenters(requiredCapacity: number, tenantId: string): Promise<WorkCenter[]> {
    const workCenters = await this.getAllWorkCenters(tenantId);

    return workCenters.filter((wc) => wc.isActive && wc.getAvailableCapacity() >= requiredCapacity);
  }

  /* eslint-disable no-unused-vars */
  private async loadWorkCenter(_workCenterId: string, _tenantId: string): Promise<WorkCenter> {
    // Implementation for loading work center from event store
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */

  /* eslint-disable no-unused-vars */
  private async getAllWorkCenters(_tenantId: string): Promise<WorkCenter[]> {
    // Implementation for getting all work centers
    throw new Error(METHOD_NOT_IMPLEMENTED);
  }
  /* eslint-enable no-unused-vars */
}
