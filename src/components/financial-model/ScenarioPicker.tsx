import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  SYSTEM_SCENARIOS,
  isSystemScenarioId,
  findSystemScenario,
} from '@/lib/financial-model/system-scenarios';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

interface Props {
  scenarios: FinancialModelScenario[];
  currentUserId: string | null | undefined;
  activeId: string;
  onChange: (id: string) => void;
}

export function ScenarioPicker({ scenarios, currentUserId, activeId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const ownScenarios = scenarios.filter((s) => s.owner_id === currentUserId);
  const sharedScenarios = scenarios.filter(
    (s) => s.owner_id !== currentUserId && s.is_shared,
  );

  const activeLabel = isSystemScenarioId(activeId)
    ? findSystemScenario(activeId)?.name ?? 'Base'
    : scenarios.find((s) => s.id === activeId)?.name ?? 'Base';

  const pick = (id: string) => {
    setOpen(false);
    onChange(id);
  };

  const renderItem = (id: string, name: string, badge?: string) => (
    <button
      key={id}
      type="button"
      onClick={() => pick(id)}
      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-800 ${
        activeId === id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'
      }`}
    >
      <span className="flex items-center justify-between">
        <span>{name}</span>
        {badge ? (
          <span className="text-[10px] uppercase text-coral-400">{badge}</span>
        ) : null}
      </span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox">
        Scenario: <span className="ml-2 font-semibold">{activeLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
      {open ? (
        <div
          role="listbox"
          className="absolute z-30 top-full mt-1 left-0 w-72 rounded-md border border-slate-700 bg-slate-900 shadow-lg py-2"
        >
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">
            System
          </div>
          {SYSTEM_SCENARIOS.map((s) => renderItem(s.id, s.name))}
          {ownScenarios.length > 0 ? (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-800">
                Mine
              </div>
              {ownScenarios.map((s) => renderItem(s.id, s.name))}
            </>
          ) : null}
          {sharedScenarios.length > 0 ? (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-800">
                Shared
              </div>
              {sharedScenarios.map((s) => renderItem(s.id, s.name, 'shared'))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
