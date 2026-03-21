import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { setSentryUser } from '@/lib/sentry';
import { identifyUser as identifyPostHogUser, resetUser as resetPostHogUser, trackEvent } from '@/lib/posthog';
import type { AppRole, Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  // Auth methods
  signUp: (email: string, password: string, fullName?: string, accountType?: string, referralCode?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  resendVerificationEmail: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  clearPasswordRecovery: () => void;
  // Role checks
  hasRole: (role: AppRole) => boolean;
  isRavTeam: () => boolean;
  isRavAdmin: () => boolean;
  isPropertyOwner: () => boolean;
  isRenter: () => boolean;
  isEmailVerified: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  };

  // Fetch user roles
  const fetchRoles = async (userId: string): Promise<AppRole[]> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data?.map((r: any) => r.role as AppRole) || [];
    } catch (err) {
      console.error('Roles fetch error:', err);
      return [];
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Detect password recovery flow so we can redirect to /reset-password
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            const [userProfile, userRoles] = await Promise.all([
              fetchProfile(currentSession.user.id),
              fetchRoles(currentSession.user.id),
            ]);
            setProfile(userProfile);
            setRoles(userRoles);
            setSentryUser(currentSession.user.id, userRoles[0]);
            identifyPostHogUser(currentSession.user.id, {
              role: userRoles[0] || 'none',
              membership_tier: userProfile?.membership_tier || 'free',
              account_type: userProfile?.account_type || 'unknown',
            });
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setSentryUser(null);
          resetPostHogUser();
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(existingSession.user);
        
        Promise.all([
          fetchProfile(existingSession.user.id),
          fetchRoles(existingSession.user.id),
        ]).then(([userProfile, userRoles]) => {
          setProfile(userProfile);
          setRoles(userRoles);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  // Auth methods
  const signUp = async (email: string, password: string, fullName?: string, accountType?: string, referralCode?: string) => {
    const metadata: Record<string, unknown> = {
      full_name: fullName,
      account_type: accountType || 'renter',
      terms_accepted_at: new Date().toISOString(),
      age_verified: true,
    };
    if (referralCode) {
      metadata.referral_code = referralCode;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    // Track signup event
    if (!error && data.user?.id) {
      trackEvent('signup_completed', {
        account_type: accountType || 'renter',
        has_referral_code: !!referralCode,
      });
    }
    // Record referral if code provided and signup succeeded
    if (!error && referralCode && data.user?.id) {
      supabase.rpc("record_referral", {
        p_referral_code: referralCode,
        p_new_user_id: data.user.id,
      }).catch(() => {}); // fire-and-forget
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) return { error: { message: 'No email address found' } as AuthError };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const clearPasswordRecovery = () => setIsPasswordRecovery(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  // Role check helpers
  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isRavTeam = (): boolean => {
    return roles.some((r) => ['rav_owner', 'rav_admin', 'rav_staff'].includes(r));
  };

  const isRavAdmin = (): boolean => hasRole('rav_admin') || hasRole('rav_owner');

  const isPropertyOwner = (): boolean => hasRole('property_owner');

  const isRenter = (): boolean => hasRole('renter');

  const isEmailVerified = (): boolean => {
    if (!user) return false;
    // Google OAuth users are always verified
    if (user.app_metadata?.provider === 'google') return true;
    return user.email_confirmed_at != null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isConfigured,
        isPasswordRecovery,
        signUp,
        signIn,
        signInWithGoogle,
        resetPasswordForEmail,
        resendVerificationEmail,
        signOut,
        clearPasswordRecovery,
        hasRole,
        isRavTeam,
        isRavAdmin,
        isPropertyOwner,
        isRenter,
        isEmailVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
