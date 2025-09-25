import { type DomainEvent } from '../../domain/domain-event';

/* eslint-disable no-unused-vars */
export interface EventStore {
  append(_aggregateId: string, _events: DomainEvent[], _expectedVersion: number): Promise<void>;
  getEvents(_aggregateId: string): Promise<DomainEvent[]>;
  getEventsByTenant(_tenantId: string): Promise<DomainEvent[]>;
}
/* eslint-enable no-unused-vars */
