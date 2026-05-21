import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { EXPENSES, type ExpenseRow } from '@/lib/financial-model/data';

interface Props {
  /** Effective expenses (baseline merged with overrides). When omitted, uses canonical EXPENSES. */
  expenses?: ExpenseRow[];
  /** Dirty expense keys (`category|item`) — drives section dot + per-row dot. */
  dirtyExpenseKeys?: Set<string>;
  readOnly?: boolean;
  onAmountChange?: (category: string, item: string, amount: number) => void;
  onResetAmount?: (category: string, item: string) => void;
}

export function ExpenseSection({
  expenses,
  dirtyExpenseKeys,
  readOnly,
  onAmountChange,
  onResetAmount,
}: Props) {
  const [open, setOpen] = useState(false);
  const rows = expenses ?? EXPENSES;
  const dirty = dirtyExpenseKeys ?? new Set<string>();
  const dirtyCount = dirty.size;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <span className="font-medium text-slate-100">Expenses</span>
          {dirtyCount > 0 ? (
            <span className="text-xs text-amber-400">{dirtyCount} differ ●</span>
          ) : null}
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">
            {rows.length} line items across {new Set(rows.map((e) => e.category)).size} categories.
            {readOnly ? ' Read-only view.' : ' Amount is editable; category/item/frequency/timing are not.'}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-1 pr-2">Category</th>
                  <th className="text-left py-1 pr-2">Item</th>
                  <th className="text-right py-1 px-2">Amount</th>
                  <th className="text-left py-1 px-2">Freq</th>
                  <th className="text-right py-1 px-2">Start</th>
                  <th className="text-right py-1 pl-2">End</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {rows.map((e) => {
                  const key = `${e.category}|${e.item}`;
                  const rowDirty = dirty.has(key);
                  return (
                    <tr key={key} className="border-t border-slate-800">
                      <td className="py-1 pr-2 text-slate-400">{e.category}</td>
                      <td className="py-1 pr-2">
                        <span className="flex items-center gap-1.5">
                          {e.item}
                          {rowDirty ? (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                          ) : null}
                        </span>
                      </td>
                      <td className="py-1 text-right tabular-nums">
                        {readOnly ? (
                          <span>${e.amount.toLocaleString()}</span>
                        ) : (
                          <input
                            type="number"
                            className="font-mono tabular-nums text-right text-slate-100 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 w-24"
                            defaultValue={e.amount}
                            onBlur={(ev) => {
                              const v = parseFloat(ev.target.value);
                              if (Number.isFinite(v)) onAmountChange?.(e.category, e.item, v);
                            }}
                          />
                        )}
                      </td>
                      <td className="py-1 px-2">{e.frequency}</td>
                      <td className="py-1 text-right tabular-nums px-2">{e.startMo}</td>
                      <td className="py-1 text-right tabular-nums pl-2">{e.endMo}</td>
                      <td>
                        {!readOnly && rowDirty ? (
                          <button
                            type="button"
                            onClick={() => onResetAmount?.(e.category, e.item)}
                            aria-label={`Reset ${e.item}`}
                            className="text-slate-500 hover:text-slate-200 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
