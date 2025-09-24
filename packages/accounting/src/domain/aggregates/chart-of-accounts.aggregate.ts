import type { CreateAccountCommand } from '../commands/accounting.commands';
import type { DomainEvent } from '../events/domain-events';

import { AccountCreatedEvent } from '../events/domain-events';

export abstract class AggregateRoot {
  private uncommittedEvents: DomainEvent[] = [];
  protected version: number = 0;

  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
    this.apply(event);
    this.version++;
  }

  protected abstract apply(event: DomainEvent): void;

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  public getVersion(): number {
    return this.version;
  }

  public loadFromHistory(event: DomainEvent): void {
    this.apply(event);
    this.version = event.version;
  }
}

export class ChartOfAccounts extends AggregateRoot {
  private accounts: Map<
    string,
    {
      accountCode: string;
      accountName: string;
      accountType: string;
      parentAccountCode?: string;
      tenantId: string;
    }
  > = new Map();

  constructor(private readonly tenantId: string) {
    super();
  }

  public createAccount(command: CreateAccountCommand): void {
    this.validateAccountCreation(command);

    this.addEvent(
      new AccountCreatedEvent(
        command.accountCode,
        command.accountName,
        command.accountType,
        command.parentAccountCode,
        command.tenantId,
        this.version + 1,
        new Date(),
        undefined, // correlationId
        undefined, // causationId
        command.userId,
      ),
    );
  }

  private validateAccountCreation(command: CreateAccountCommand): void {
    if (this.accounts.has(command.accountCode)) {
      throw new Error('Account code already exists');
    }

    if (command.parentAccountCode && !this.accounts.has(command.parentAccountCode)) {
      throw new Error('Parent account does not exist');
    }
  }

  protected apply(event: DomainEvent): void {
    if (event instanceof AccountCreatedEvent) {
      this.accounts.set(event.accountCode, {
        accountCode: event.accountCode,
        accountName: event.accountName,
        accountType: event.accountType,
        parentAccountCode: event.parentAccountCode,
        tenantId: event.tenantId,
      });
    }
  }
}
