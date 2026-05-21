import { Link } from 'react-router-dom';
import type { InputRow } from '@/lib/financial-model/data';

interface Props {
  row: InputRow;
  liveConfig?: boolean;
}

function formatValue(row: InputRow): string {
  if (typeof row.value !== 'number') return String(row.value);
  if (row.fmt.includes('%')) return `${(row.value * 100).toFixed(2)}%`;
  if (row.fmt.startsWith('$')) return `$${row.value.toLocaleString('en-US')}`;
  if (row.fmt.includes('"x"')) return `${row.value.toFixed(2)}x`;
  return row.value.toString();
}

export function ReadOnlyInputRow({ row, liveConfig }: Props) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 text-sm">
      <div className="flex items-center gap-2 text-slate-300">
        <span>{row.label}</span>
        {liveConfig ? (
          <Link
            to="/admin/system-settings"
            className="text-[10px] uppercase tracking-wider text-teal-400 hover:text-teal-300"
            title="Live config — managed by admin"
          >
            Live · System Settings
          </Link>
        ) : null}
      </div>
      <div className="font-mono tabular-nums text-slate-100">{formatValue(row)}</div>
    </div>
  );
}
