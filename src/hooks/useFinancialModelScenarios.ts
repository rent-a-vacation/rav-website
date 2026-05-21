import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ExpenseOverride {
  category: string;
  item: string;
  amount?: number;
}

export interface FinancialModelScenario {
  id: string;
  owner_id: string;
  name: string;
  multiplier: 'Conservative' | 'Base' | 'Optimistic';
  overrides: Record<string, number | string>;
  expense_overrides: ExpenseOverride[];
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScenarioInsert {
  name: string;
  multiplier: 'Conservative' | 'Base' | 'Optimistic';
  overrides: Record<string, number | string>;
  expense_overrides: ExpenseOverride[];
  is_shared: boolean;
}

export interface ScenarioUpdate {
  name?: string;
  multiplier?: 'Conservative' | 'Base' | 'Optimistic';
  overrides?: Record<string, number | string>;
  expense_overrides?: ExpenseOverride[];
  is_shared?: boolean;
}

const QUERY_KEY = ['financial-model-scenarios'] as const;
const TABLE = 'financial_model_scenarios';

export function useFinancialModelScenarios() {
  const qc = useQueryClient();

  const list = useQuery<FinancialModelScenario[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as FinancialModelScenario[];
    },
    staleTime: 30_000,
  });

  const createMut = useMutation<FinancialModelScenario, Error, ScenarioInsert>({
    mutationFn: async (insert) => {
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp.user?.id;
      if (!userId) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...insert, owner_id: userId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FinancialModelScenario;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMut = useMutation<
    FinancialModelScenario,
    Error,
    { id: string; patch: ScenarioUpdate }
  >({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FinancialModelScenario;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMut = useMutation<boolean, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    scenarios: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    create: (insert: ScenarioInsert) => createMut.mutateAsync(insert),
    update: (id: string, patch: ScenarioUpdate) => updateMut.mutateAsync({ id, patch }),
    remove: (id: string) => deleteMut.mutateAsync(id),
  };
}
