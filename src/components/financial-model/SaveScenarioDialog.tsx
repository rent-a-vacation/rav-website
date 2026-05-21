import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  initialName: string;
  initialShared: boolean;
  onSubmit: (payload: { name: string; isShared: boolean }) => void;
  onCancel: () => void;
}

export function SaveScenarioDialog({
  open,
  title,
  initialName,
  initialShared,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialName);
  const [isShared, setShared] = useState(initialShared);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setShared(initialShared);
    }
  }, [open, initialName, initialShared]);

  if (!open) return null;

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 80;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="save-dialog-title" className="text-lg font-semibold text-white mb-4">
          {title}
        </h2>
        <label htmlFor="scenario-name" className="block text-sm text-slate-300 mb-1">
          Name
        </label>
        <input
          id="scenario-name"
          autoFocus
          maxLength={80}
          className="w-full text-slate-100 bg-slate-800 border border-slate-700 rounded px-2 py-1 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-300 mb-6">
          <input
            type="checkbox"
            aria-label="Share read-only with RAV team"
            checked={isShared}
            onChange={(e) => setShared(e.target.checked)}
          />
          Share read-only with RAV team
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit({ name: trimmed, isShared })}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
