import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import type { InputRow } from '@/lib/financial-model/data';

interface Props {
  row: InputRow;
  baselineValue: number | string;
  dirty: boolean;
  readOnly?: boolean;
  onChange: (value: number | string) => void;
  onReset: () => void;
}

function inputStep(fmt: string): string {
  if (fmt.includes('%')) return '0.001';
  if (fmt.startsWith('$0.00')) return '0.01';
  if (fmt.startsWith('$')) return '1';
  if (fmt.includes('"x"')) return '0.01';
  return 'any';
}

function displayValue(row: InputRow): string {
  return String(row.value);
}

export function EditableInputRow({
  row,
  baselineValue,
  dirty,
  readOnly,
  onChange,
  onReset,
}: Props) {
  const id = useId();
  const [local, setLocal] = useState(displayValue(row));

  // Resync when the external row value changes (scenario switch, reset, etc.)
  useEffect(() => {
    setLocal(displayValue(row));
  }, [row.value]);

  if (readOnly) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 text-sm">
        <span className="text-slate-300">{row.label}</span>
        <div className="font-mono tabular-nums text-slate-100">{displayValue(row)}</div>
      </div>
    );
  }

  const commit = () => {
    if (typeof row.value === 'number') {
      const parsed = parseFloat(local);
      if (Number.isFinite(parsed)) onChange(parsed);
      else setLocal(displayValue(row));
    } else {
      onChange(local);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1.5 text-sm">
      <label htmlFor={id} className="text-slate-300 flex items-center gap-1.5">
        {row.label}
        {dirty ? (
          <span
            aria-label={`differs from baseline (was ${baselineValue})`}
            title={`Baseline: ${baselineValue}`}
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
          />
        ) : null}
      </label>
      <input
        id={id}
        type={typeof row.value === 'number' ? 'number' : 'text'}
        step={inputStep(row.fmt)}
        className="font-mono tabular-nums text-right text-slate-100 bg-slate-900 border border-slate-700 rounded px-2 py-1 w-32"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
      />
      {dirty ? (
        <button
          type="button"
          onClick={onReset}
          aria-label={`Reset ${row.label}`}
          className="text-slate-500 hover:text-slate-200 p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-5" />
      )}
    </div>
  );
}
