// ==============================================================================
// APNI ESTATE INTERIORS - TEAM & STAFF SERVICE
// Multi-tenant profile listing & role management.
// Safe client architecture: No service_role key, real organization RLS.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StaffMember, UserRole } from '../types';

export const teamService = {
  async getTeamMembers(organizationId?: string): Promise<StaffMember[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      full_name: item.full_name,
      role: item.role as UserRole,
      phone: item.phone || '',
      avatar_url: item.avatar_url,
      status: 'Active' as const,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async updateMemberRole(profileId: string, newRole: UserRole): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (error) throw error;
  }
};
