import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  dirtyCount: number;
  scenarioName: string;
  onShowDiff: () => void;
  onResetAll: () => void;
}

export function DriftBanner({ dirtyCount, scenarioName, onShowDiff, onResetAll }: Props) {
  if (dirtyCount === 0) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 mb-4"
    >
      <div className="flex items-center gap-2 text-sm text-amber-100">
        <AlertCircle className="h-4 w-4 text-amber-300" aria-hidden="true" />
        Editing <strong className="font-semibold">{scenarioName}</strong> — {dirtyCount} input
        {dirtyCount === 1 ? '' : 's'} differ from baseline.
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onShowDiff}>
          Show diff
        </Button>
        <Button variant="outline" size="sm" onClick={onResetAll}>
          Reset all
        </Button>
      </div>
    </div>
  );
}
