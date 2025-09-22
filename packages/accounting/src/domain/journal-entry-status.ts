export enum JournalEntryStatus {
  DRAFT = 'Draft',
  POSTED = 'Posted',
  REVERSED = 'Reversed',
}

export class JournalEntryStatusValidator {
  public static validateTransition(
    fromStatus: JournalEntryStatus,
    toStatus: JournalEntryStatus,
  ): void {
    const validTransitions = new Map<JournalEntryStatus, JournalEntryStatus[]>([
      [JournalEntryStatus.DRAFT, [JournalEntryStatus.POSTED, JournalEntryStatus.DRAFT]],
      [JournalEntryStatus.POSTED, [JournalEntryStatus.REVERSED]],
      [JournalEntryStatus.REVERSED, []], // Cannot transition from reversed
    ]);

    const allowedTransitions = validTransitions.get(fromStatus);
    if (!allowedTransitions?.includes(toStatus)) {
      throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`);
    }
  }

  public static canPost(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.DRAFT;
  }

  public static canReverse(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.POSTED;
  }

  public static isFinal(status: JournalEntryStatus): boolean {
    return status === JournalEntryStatus.REVERSED;
  }
}
