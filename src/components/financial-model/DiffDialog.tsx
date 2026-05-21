import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DiffEntry {
  key: string;
  label: string;
  baseline: number | string;
  current: number | string;
}

export interface ExpenseDiffEntry {
  category: string;
  item: string;
  baseline: number;
  current: number;
}

interface Props {
  open: boolean;
  diffs: DiffEntry[];
  expenseDiffs: ExpenseDiffEntry[];
  onClose: () => void;
  onResetField: (key: string) => void;
  onResetExpense: (category: string, item: string) => void;
}

function formatValue(v: number | string): string {
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1) return v.toLocaleString();
    return String(v);
  }
  return v;
}

export function DiffDialog({
  open,
  diffs,
  expenseDiffs,
  onClose,
  onResetField,
  onResetExpense,
}: Props) {
  if (!open) return null;

  const empty = diffs.length === 0 && expenseDiffs.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-dialog-title"
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="diff-dialog-title" className="text-lg font-semibold text-white">
            Differences from baseline
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {empty ? (
          <p className="text-slate-400 text-sm">No differences.</p>
        ) : null}

        {diffs.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 pr-3">Input</th>
                <th className="text-right py-2 px-3">Baseline</th>
                <th className="text-right py-2 px-3">Current</th>
                <th className="text-right py-2 pl-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {diffs.map((d) => (
                <tr key={d.key} className="border-b border-slate-800">
                  <td className="py-2 pr-3">{d.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                    {formatValue(d.baseline)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-300">
                    {formatValue(d.current)}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onResetField(d.key)}
                      aria-label={`Reset ${d.label}`}
                      className="text-slate-500 hover:text-slate-200 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {expenseDiffs.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 pr-3">Expense</th>
                <th className="text-right py-2 px-3">Baseline</th>
                <th className="text-right py-2 px-3">Current</th>
                <th className="text-right py-2 pl-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {expenseDiffs.map((d) => (
                <tr key={`${d.category}|${d.item}`} className="border-b border-slate-800">
                  <td className="py-2 pr-3">
                    {d.category} — {d.item}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                    ${d.baseline.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-300">
                    ${d.current.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onResetExpense(d.category, d.item)}
                      aria-label={`Reset ${d.item}`}
                      className="text-slate-500 hover:text-slate-200 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
