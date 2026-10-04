import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus } from '../lib/supabase';
import { Profile, Organization, SubscriptionStatus, PlanTier, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (mode: boolean) => void;
  
  // Trial Entitlement
  trialStatus: SubscriptionStatus;
  isTrialExpired: boolean;
  daysRemaining: number;
  
  // Auth Operations
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    studioName: string;
    phone?: string;
    plan?: PlanTier;
  }) => Promise<{ requiresEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    // Demo mode NEVER has startup authority for fresh visitors.
    // Only restore if explicitly initiated within the current active tab session.
    try {
      return sessionStorage.getItem('apni_estate_demo_session') === 'true';
    } catch {
      return false;
    }
  });

  const setIsDemoMode = useCallback((mode: boolean) => {
    try {
      if (mode) {
        sessionStorage.setItem('apni_estate_demo_session', 'true');
      } else {
        sessionStorage.removeItem('apni_estate_demo_session');
      }
    } catch (e) {
      console.warn('[Auth] SessionStorage access error:', e);
    }
    setIsDemoModeState(mode);
  }, []);

  // Fetch or bootstrap profile & organization
  const loadProfileAndOrg = useCallback(async (userId: string, userMetadata?: any) => {
    try {
      if (!isSupabaseConfigured) return;

      // 1. Fetch profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. If profile is missing (e.g. initial login after signup confirmation or manual registration), bootstrap organization idempotently
      if (!profileData) {
        try {
          const studioName = userMetadata?.studio_name?.trim() || (userMetadata?.full_name?.trim() ? `${userMetadata.full_name.trim()}'s Studio` : 'My Interior Studio');
          const fullName = userMetadata?.full_name?.trim() || userMetadata?.name?.trim() || 'Studio Owner';
          const phone = userMetadata?.phone?.trim() || null;
          const planName = userMetadata?.plan || 'studio';

          await supabase.rpc('create_trial_organization', {
            org_name: studioName,
            full_name: fullName,
            phone: phone,
            plan_name: planName
          });

          const { data: createdProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          profileData = createdProfile;
        } catch (bootstrapErr) {
          console.error('[Auth] Bootstrap error:', bootstrapErr);
        }
      }

      if (profileData) {
        setProfile(profileData as Profile);

        // Fetch organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .maybeSingle();

        if (orgData) {
          setOrganization(orgData as Organization);
        }
      }
    } catch (err) {
      console.error('[Auth] Error loading profile/org:', err);
    }
  }, []);

  // Initialize Session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }

        if (initialSession?.user) {
          if (isMounted) setIsDemoMode(false);
          await loadProfileAndOrg(initialSession.user.id, initialSession.user.user_metadata);
        }
      } catch (err) {
        console.error('[Auth] Session initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setIsDemoMode(false);
        await loadProfileAndOrg(currentSession.user.id, currentSession.user.user_metadata);
      } else {
        setProfile(null);
        setOrganization(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfileAndOrg]);

  // Dynamic Trial Calculation from authoritative database organization record
  const trialCalculations = useMemo(() => {
    if (isDemoMode || !organization) {
      // In demo mode or before org load, provide active trial simulation
      return {
        trialStatus: 'trial' as SubscriptionStatus,
        isTrialExpired: false,
        daysRemaining: 15
      };
    }

    const status = organization.subscription_status || 'trial';
    
    // Active subscription has unlimited access
    if (status === 'active') {
      return {
        trialStatus: 'active' as SubscriptionStatus,
        isTrialExpired: false,
        daysRemaining: 365
      };
    }

    // Expired or cancelled directly blocked
    if (status === 'expired' || status === 'cancelled') {
      return {
        trialStatus: status,
        isTrialExpired: true,
        daysRemaining: 0
      };
    }

    // Trial status calculation based on trial_ends_at
    const trialEnd = new Date(organization.trial_ends_at).getTime();
    const now = Date.now();
    const diffMs = trialEnd - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = diffMs <= 0;

    return {
      trialStatus: isExpired ? ('expired' as SubscriptionStatus) : ('trial' as SubscriptionStatus),
      isTrialExpired: isExpired,
      daysRemaining
    };
  }, [organization, isDemoMode]);

  // Sign Up
  const signUp = async (params: {
    email: string;
    password: string;
    fullName: string;
    studioName: string;
    phone?: string;
    plan?: PlanTier;
  }): Promise<{ requiresEmailVerification: boolean }> => {
    if (!isSupabaseConfigured) {
      throw new Error(`Supabase configuration missing in environment (${getSupabaseConfigStatus()}).`);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
            studio_name: params.studioName.trim(),
            phone: params.phone?.trim() || null,
            plan: params.plan || 'studio'
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create account.');

      // CASE A: User has immediate session
      if (data.session && data.user) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoMode(false);
        try {
          await supabase.rpc('create_trial_organization', {
            org_name: params.studioName.trim(),
            full_name: params.fullName.trim(),
            phone: params.phone?.trim() || null,
            plan_name: params.plan || 'studio'
          });
        } catch (rpcErr) {
          console.error('[Auth] RPC creation error on signup:', rpcErr);
        }
        await loadProfileAndOrg(data.user.id, data.user.user_metadata);
        return { requiresEmailVerification: false };
      }

      // CASE B: Email confirmation required
      return { requiresEmailVerification: true };
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const signIn = async (email: string, password: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error(`Supabase configuration missing in environment (${getSupabaseConfigStatus()}).`);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        setIsDemoMode(false);
        await loadProfileAndOrg(data.user.id, data.user.user_metadata);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      setOrganization(null);
      setIsDemoMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email: string): Promise<void> => {
    if (!isSupabaseConfigured) {
      throw new Error(`Supabase configuration missing in environment (${getSupabaseConfigStatus()}).`);
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  };

  // Refresh Profile
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      await loadProfileAndOrg(user.id);
    }
  };

  const isAuthenticated = Boolean(user && session);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        loading,
        isAuthenticated,
        isDemoMode,
        setIsDemoMode,
        trialStatus: trialCalculations.trialStatus,
        isTrialExpired: trialCalculations.isTrialExpired,
        daysRemaining: trialCalculations.daysRemaining,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
