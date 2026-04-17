import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface AccountManager {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

/** Fetch the current user's assigned account manager (Business owners only) */
export function useMyAccountManager() {
  const { user } = useAuth();

  return useQuery<AccountManager | null>({
    queryKey: ['account-manager', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get the account_manager_id from the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_manager_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.account_manager_id) return null;

      // Fetch the manager's profile
      const { data: manager, error: managerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', profile.account_manager_id)
        .single();

      if (managerError) throw managerError;
      return manager as AccountManager;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}
