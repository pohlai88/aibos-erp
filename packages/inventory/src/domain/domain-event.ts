export abstract class DomainEvent {
  public readonly occurredAt: Date = new Date();

  abstract getEventType(): string;
  abstract getAggregateId(): string;
  abstract getTenantId(): string;
  abstract getOccurredAt(): Date;
}
