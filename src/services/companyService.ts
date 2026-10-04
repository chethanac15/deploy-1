// ==============================================================================
// APNI ESTATE INTERIORS - COMPANY SETTINGS & COMMERCIAL CONFIGURATION SERVICE
// Multi-tenant company profile, billing preferences, and commercial limit foundations
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CompanySettings } from '../types';

export const companyService = {
  /**
   * Fetch company configuration from current organization
   */
  async getCompanySettings(organizationId?: string): Promise<CompanySettings | null> {
    if (!isSupabaseConfigured || !organizationId) return null;

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('[CompanyService] Error fetching organization:', error);
      throw error;
    }

    if (!data) return null;

    return {
      name: data.name || '',
      company_email: data.company_email || '',
      company_phone: data.company_phone || '',
      website: data.website || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      gst_number: data.gst_number || '',
      currency: data.currency || 'INR',
      financial_year_start: data.financial_year_start || 'April',
      logo_url: data.logo_url || '',
      max_users: data.max_users ?? null,
      max_active_projects: data.max_active_projects ?? null,
      max_branches: data.max_branches ?? null
    };
  },

  /**
   * Update company configuration in organization record
   */
  async updateCompanySettings(
    organizationId: string,
    settings: Partial<CompanySettings>
  ): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (settings.name !== undefined) payload.name = settings.name.trim();
    if (settings.company_email !== undefined) payload.company_email = settings.company_email.trim() || null;
    if (settings.company_phone !== undefined) payload.company_phone = settings.company_phone.trim() || null;
    if (settings.website !== undefined) payload.website = settings.website.trim() || null;
    if (settings.address !== undefined) payload.address = settings.address.trim() || null;
    if (settings.city !== undefined) payload.city = settings.city.trim() || null;
    if (settings.state !== undefined) payload.state = settings.state.trim() || null;
    if (settings.pincode !== undefined) payload.pincode = settings.pincode.trim() || null;
    if (settings.gst_number !== undefined) payload.gst_number = settings.gst_number.trim() || null;
    if (settings.currency !== undefined) payload.currency = settings.currency;
    if (settings.financial_year_start !== undefined) payload.financial_year_start = settings.financial_year_start;
    if (settings.logo_url !== undefined) payload.logo_url = settings.logo_url.trim() || null;

    const { error } = await supabase
      .from('organizations')
      .update(payload)
      .eq('id', organizationId);

    if (error) throw error;
  }
};
