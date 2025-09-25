import { useAccounting } from '../hooks/useAccounting';
import {
  JournalEntry,
  type TJournalEntry,
  type TJournalEntryLine,
} from '@aibos/accounting-contracts';
import { cn } from '@aibos/ui';
import * as React from 'react';

type Properties = {
  tenantId: string;
  className?: string;
        onPosted?: (id: string) => void;
  /** Optional default currency (e.g., "MYR") */
  defaultCurrency?: string;
};

export function JournalEntryForm({
  tenantId,
  className,
  onPosted,
  defaultCurrency = 'MYR',
}: Properties): JSX.Element {
  const { loading, error, postJournalEntry } = useAccounting();
  const [lines, setLines] = React.useState<TJournalEntryLine[]>([
    { accountId: '', amount: { currency: defaultCurrency, amount: 0 } },
    { accountId: '', amount: { currency: defaultCurrency, amount: 0 } },
  ]);
  const [desc, setDesc] = React.useState('');
  const [ref, setReference] = React.useState('');

  const updateLine = (index: number, patch: Partial<TJournalEntryLine>): void => {
    setLines((ls) => ls.map((l, index_) => (index_ === index ? { ...l, ...patch } : l)));
  };

  const addLine = (): void =>
    setLines((ls) => [...ls, { accountId: '', amount: { currency: defaultCurrency, amount: 0 } }]);
  const removeLine = (index: number): void =>
    setLines((ls) => ls.filter((_, index_) => index_ !== index));

  const onSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const payload: TJournalEntry = {
      tenantId,
      postedBy: 'current-user', // replace at integration
      postingDate: new Date().toISOString(),
      description: desc || undefined,
      reference: ref || undefined,
      lines,
    };
    const parsed = JournalEntry.safeParse(payload);
    if (!parsed.success) {
      console.error(parsed.error.issues.map((issue) => issue.message).join('\n'));
      return;
    }
    const { id } = await postJournalEntry(parsed.data);
    onPosted?.(id);
  };

  return (
    <form className={cn('w-full space-y-4', className)} onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Reference</label>
        <input
          className="w-full rounded border p-2"
          value={ref}
          onChange={(event) => setReference(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border p-2"
          value={desc}
          onChange={(event) => setDesc(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Lines</div>
        {lines.map((l, index) => (
          <div key={index} className="grid grid-cols-12 gap-2">
            <input
              className="col-span-5 rounded border p-2"
              placeholder="Account ID"
              value={l.accountId}
              onChange={(event) => updateLine(index, { accountId: event.target.value })}
            />
            <input
              className="col-span-3 rounded border p-2"
              placeholder="Amount (use + for Debit, - for Credit)"
              type="number"
              value={l.amount.amount}
              onChange={(event) =>
                updateLine(index, { amount: { ...l.amount, amount: Number(event.target.value) } })
              }
            />
            <input
              className="col-span-2 rounded border p-2"
              placeholder="Currency"
              value={l.amount.currency}
              onChange={(event) =>
                updateLine(index, {
                  amount: { ...l.amount, currency: event.target.value.toUpperCase() },
                })
              }
            />
            <button
              type="button"
              className="col-span-2 rounded border p-2"
              onClick={() => removeLine(index)}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="rounded border p-2" onClick={addLine}>
          Add line
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Posting...' : 'Post Journal Entry'}
      </button>
    </form>
  );
}
