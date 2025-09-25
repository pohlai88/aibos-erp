import { type DomainEvent } from './domain-event';

export abstract class AggregateRoot {
  private _version: number = 0;
  private _uncommittedEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._uncommittedEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  public getVersion(): number {
    return this._version;
  }

  public get version(): number {
    return this._version;
  }

  protected setVersion(version: number): void {
    this._version = version;
  }

  public loadFromHistory(events: DomainEvent[], version: number): void {
    events.forEach((event) => {
      this.apply(event);
    });
    this._version = version;
    this._uncommittedEvents = [];
  }

  /* eslint-disable no-unused-vars */
  protected apply(_event: DomainEvent): void {
    // Override in subclasses to handle specific events
    // Parameter is intentionally unused as this is a base class method
  }
  /* eslint-enable no-unused-vars */
}
