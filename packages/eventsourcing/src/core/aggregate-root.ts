import type { DomainEvent } from "./domain-event";

/**
 * Base class for aggregate roots in the Event Sourcing system
 */
export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  private version: number = 0;
  protected id: string;

  constructor(id: string, version: number = 0) {
    this.id = id;
    this.version = version;
  }

  /**
   * Get the aggregate ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the current version
   */
  public getVersion(): number {
    return this.version;
  }

  /**
   * Get uncommitted events
   */
  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  /**
   * Mark events as committed
   */
  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  /**
   * Add a new domain event
   */
  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
    this.apply(event);
    this.version++;
  }

  /**
   * Apply an event to the aggregate state
   * Must be implemented by subclasses
   */
  protected abstract apply(event: DomainEvent): void;

  /**
   * Load aggregate from events
   */
  public static fromEvents<T extends AggregateRoot>(
    this: new (id: string, version: number) => T,
    id: string,
    events: DomainEvent[],
  ): T {
    const aggregate = new this(id, 0);

    for (const event of events) {
      aggregate.apply(event);
      (aggregate as unknown as { version: number }).version = event.version;
    }

    return aggregate;
  }

  /**
   * Check if aggregate has uncommitted events
   */
  public hasUncommittedEvents(): boolean {
    return this.uncommittedEvents.length > 0;
  }

  /**
   * Get the number of uncommitted events
   */
  public getUncommittedEventCount(): number {
    return this.uncommittedEvents.length;
  }
}
