import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InputSectionMeta } from './sectionMeta';
import { sectionKeys } from './sectionMeta';

interface Props {
  section: InputSectionMeta;
  dirtyKeys: Set<string>;
  onResetSection?: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function InputSectionAccordion({
  section,
  dirtyKeys,
  onResetSection,
  defaultOpen,
  children,
}: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const keys = sectionKeys(section.id);
  const sectionDirty = keys.filter((k) => dirtyKeys.has(k)).length;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 mb-3">
      <div className="flex items-center justify-between gap-3 px-2 py-1 hover:bg-slate-800/50 rounded-t-lg">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 flex-1 text-left px-2 py-2"
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <span className="font-medium text-slate-100">{section.title}</span>
          {sectionDirty > 0 ? (
            <span className="text-xs text-amber-400">{sectionDirty} differ ●</span>
          ) : null}
        </button>
        {sectionDirty > 0 && onResetSection ? (
          <Button variant="ghost" size="sm" onClick={onResetSection}>
            Reset section
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">{section.description}</p>
          <div>{children}</div>
        </div>
      ) : null}
    </div>
  );
}
