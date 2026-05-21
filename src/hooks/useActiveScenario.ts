import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SCENARIO_ID } from '@/lib/financial-model/system-scenarios';

export const ACTIVE_KEY = 'fms-active-scenario';

function readStored(): string {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    return v && v.length > 0 ? v : DEFAULT_SCENARIO_ID;
  } catch {
    return DEFAULT_SCENARIO_ID;
  }
}

export function useActiveScenario() {
  const [activeId, setActiveIdState] = useState<string>(() => readStored());

  useEffect(() => {
    const v = readStored();
    if (v !== activeId) setActiveIdState(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    try {
      if (id === null || id === '') {
        localStorage.removeItem(ACTIVE_KEY);
        setActiveIdState(DEFAULT_SCENARIO_ID);
      } else {
        localStorage.setItem(ACTIVE_KEY, id);
        setActiveIdState(id);
      }
    } catch {
      setActiveIdState(id ?? DEFAULT_SCENARIO_ID);
    }
  }, []);

  return { activeId, setActiveId };
}
