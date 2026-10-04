// ==============================================================================
// APNI ESTATE INTERIORS - LEAD SERVICE (CRM PIPELINE & CONVERSION ENGINE)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lead, Client } from '../types';

export interface CreateLeadInput {
  organization_id: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  requirement?: string;
  estimated_budget?: number;
  status?: string;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateLeadInput {
  name?: string;
  phone?: string;
  email?: string;
  source?: string;
  requirement?: string;
  estimated_budget?: number;
  status?: string;
  notes?: string;
  assigned_to?: string;
}

// Convert between UI Title Case and DB lowercase status values
export const DB_STATUS_TO_UI: Record<string, any> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit_scheduled: 'Site Visit Scheduled',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost'
};

export const UI_STATUS_TO_DB: Record<string, string> = {
  'New': 'new',
  'Contacted': 'contacted',
  'Site Visit Scheduled': 'site_visit_scheduled',
  'Proposal Sent': 'proposal_sent',
  'Negotiation': 'negotiation',
  'Won': 'won',
  'Lost': 'lost'
};

export const leadService = {
  async getLeads(organizationId?: string): Promise<Lead[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('leads')
      .select(`
        *,
        assigned_profile:profiles!leads_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      name: item.name,
      phone: item.phone || '',
      email: item.email || '',
      source: item.source || 'Instagram',
      requirement: item.requirement || '',
      estimated_budget: Number(item.estimated_budget) || 0,
      status: DB_STATUS_TO_UI[item.status] || 'New',
      notes: item.notes || '',
      assigned_to: item.assigned_to,
      assigned_staff_name: item.assigned_profile?.full_name,
      converted_client_id: item.converted_client_id,
      converted_project_id: item.converted_project_id,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async createLead(input: CreateLeadInput): Promise<Lead> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const dbStatus = UI_STATUS_TO_DB[input.status || 'New'] || input.status?.toLowerCase() || 'new';

    const { data, error } = await supabase
      .from('leads')
      .insert({
        organization_id: input.organization_id,
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        source: input.source?.trim() || 'Instagram',
        requirement: input.requirement?.trim() || null,
        estimated_budget: Number(input.estimated_budget) || 0,
        status: dbStatus,
        notes: input.notes?.trim() || null,
        assigned_to: input.assigned_to || null
      })
      .select(`
        *,
        assigned_profile:profiles!leads_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      source: data.source || 'Instagram',
      requirement: data.requirement || '',
      estimated_budget: Number(data.estimated_budget) || 0,
      status: DB_STATUS_TO_UI[data.status] || 'New',
      notes: data.notes || '',
      assigned_to: data.assigned_to,
      assigned_staff_name: data.assigned_profile?.full_name,
      converted_client_id: data.converted_client_id,
      converted_project_id: data.converted_project_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateLead(id: string, updates: UpdateLeadInput): Promise<Lead> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone?.trim() || null;
    if (updates.email !== undefined) payload.email = updates.email?.trim() || null;
    if (updates.source !== undefined) payload.source = updates.source?.trim() || null;
    if (updates.requirement !== undefined) payload.requirement = updates.requirement?.trim() || null;
    if (updates.estimated_budget !== undefined) payload.estimated_budget = Number(updates.estimated_budget) || 0;
    if (updates.status !== undefined) {
      payload.status = UI_STATUS_TO_DB[updates.status] || updates.status.toLowerCase();
    }
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to || null;

    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        assigned_profile:profiles!leads_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      source: data.source || 'Instagram',
      requirement: data.requirement || '',
      estimated_budget: Number(data.estimated_budget) || 0,
      status: DB_STATUS_TO_UI[data.status] || 'New',
      notes: data.notes || '',
      assigned_to: data.assigned_to,
      assigned_staff_name: data.assigned_profile?.full_name,
      converted_client_id: data.converted_client_id,
      converted_project_id: data.converted_project_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteLead(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Safe Lead -> Client conversion workflow
   * Creates real Client record, links converted_client_id, and sets status to Won
   */
  async convertToClient(leadId: string, organizationId: string): Promise<{ client: Client; updatedLead: Lead }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Fetch current lead
    const { data: leadData, error: fetchErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchErr || !leadData) throw new Error('Lead not found.');

    if (leadData.converted_client_id) {
      throw new Error('This lead has already been converted to a client.');
    }

    // 2. Insert Client record
    const { data: clientData, error: clientErr } = await supabase
      .from('clients')
      .insert({
        organization_id: organizationId,
        name: leadData.name.trim(),
        phone: leadData.phone?.trim() || null,
        email: leadData.email?.trim() || null,
        notes: `Converted from Lead (Requirement: ${leadData.requirement || 'N/A'}. Source: ${leadData.source || 'Direct'})${leadData.notes ? `\n\nNotes: ${leadData.notes}` : ''}`
      })
      .select()
      .single();

    if (clientErr) throw clientErr;

    // 3. Update Lead status to won and link converted_client_id
    const { data: updatedLeadData, error: updateLeadErr } = await supabase
      .from('leads')
      .update({
        status: 'won',
        converted_client_id: clientData.id
      })
      .eq('id', leadId)
      .select()
      .single();

    if (updateLeadErr) throw updateLeadErr;

    const mappedClient: Client = {
      id: clientData.id,
      organization_id: clientData.organization_id,
      name: clientData.name,
      phone: clientData.phone || '',
      email: clientData.email || '',
      address: clientData.address || '',
      notes: clientData.notes || '',
      created_at: clientData.created_at,
      updated_at: clientData.updated_at
    };

    const mappedLead: Lead = {
      id: updatedLeadData.id,
      organization_id: updatedLeadData.organization_id,
      name: updatedLeadData.name,
      phone: updatedLeadData.phone || '',
      email: updatedLeadData.email || '',
      source: updatedLeadData.source || 'Instagram',
      requirement: updatedLeadData.requirement || '',
      estimated_budget: Number(updatedLeadData.estimated_budget) || 0,
      status: 'Won',
      notes: updatedLeadData.notes || '',
      assigned_to: updatedLeadData.assigned_to,
      converted_client_id: clientData.id,
      created_at: updatedLeadData.created_at,
      updated_at: updatedLeadData.updated_at
    };

    return { client: mappedClient, updatedLead: mappedLead };
  }
};
