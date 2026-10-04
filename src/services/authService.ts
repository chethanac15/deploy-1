import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, Organization } from '../types';

export const authService = {
  async getCurrentSession() {
    if (!isSupabaseConfigured) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentProfile(): Promise<{ profile: Profile | null; organization: Organization | null }> {
    if (!isSupabaseConfigured) return { profile: null, organization: null };
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { profile: null, organization: null };

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return { profile: null, organization: null };

    // Fetch organization
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single();

    return { profile, organization };
  },

  async registerTrialStudio(params: {
    email: string;
    password: string;
    fullName: string;
    studioName: string;
    phone?: string;
    plan?: 'starter' | 'studio' | 'pro';
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          studio_name: params.studioName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user.');

    // 2. Call secure atomic database bootstrap function
    const { data: bootstrapData, error: rpcError } = await supabase.rpc('create_trial_organization', {
      org_name: params.studioName,
      full_name: params.fullName,
      phone: params.phone || null,
      plan_name: params.plan || 'studio'
    });

    if (rpcError) throw rpcError;
    return { user: authData.user, bootstrap: bootstrapData };
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
