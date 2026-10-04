// ==============================================================================
// APNI ESTATE INTERIORS - APPROVAL WORKFLOW SERVICE
// Additive workflow layer for Purchase Orders, Expenses, and Financial Commitments
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ApprovalRequest, ApprovalEntityType, ApprovalStatus } from '../types';

export interface CreateApprovalInput {
  entity_type: ApprovalEntityType;
  entity_id: string;
  requested_by: string;
  assigned_to?: string;
  title: string;
  description?: string;
  amount?: number;
}

export const approvalService = {
  /**
   * Fetch all approval requests for the organization
   */
  async getApprovalRequests(organizationId?: string): Promise<ApprovalRequest[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('approval_requests')
      .select(`
        *,
        requester:requested_by(full_name),
        assignee:assigned_to(full_name),
        reviewer:reviewed_by(full_name)
      `)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[ApprovalService] Error fetching requests:', error);
      throw error;
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      organization_id: r.organization_id,
      entity_type: r.entity_type as ApprovalEntityType,
      entity_id: r.entity_id,
      requested_by: r.requested_by,
      requesterName: r.requester?.full_name || 'Team Member',
      assigned_to: r.assigned_to,
      assigneeName: r.assignee?.full_name || 'Unassigned',
      status: r.status as ApprovalStatus,
      title: r.title,
      description: r.description || '',
      amount: r.amount !== null ? Number(r.amount) : undefined,
      requested_at: r.requested_at || r.created_at,
      reviewed_at: r.reviewed_at,
      reviewed_by: r.reviewed_by,
      reviewerName: r.reviewer?.full_name || '',
      review_notes: r.review_notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  },

  /**
   * Submit an entity for approval
   */
  async createApprovalRequest(organizationId: string, input: CreateApprovalInput): Promise<ApprovalRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        organization_id: organizationId,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        requested_by: input.requested_by,
        assigned_to: input.assigned_to || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        amount: input.amount ?? null,
        status: 'pending'
      })
      .select(`
        *,
        requester:requested_by(full_name),
        assignee:assigned_to(full_name)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      entity_type: data.entity_type as ApprovalEntityType,
      entity_id: data.entity_id,
      requested_by: data.requested_by,
      requesterName: data.requester?.full_name || 'Team Member',
      assigned_to: data.assigned_to,
      assigneeName: data.assignee?.full_name || 'Unassigned',
      status: data.status as ApprovalStatus,
      title: data.title,
      description: data.description || '',
      amount: data.amount !== null ? Number(data.amount) : undefined,
      requested_at: data.requested_at,
      reviewed_at: data.reviewed_at,
      reviewed_by: data.reviewed_by,
      reviewerName: '',
      review_notes: data.review_notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Process an approval decision using database-authorized RPC
   */
  async reviewApprovalRequest(
    requestId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. First attempt secure RPC review_approval_request
    try {
      const { error: rpcError } = await supabase.rpc('review_approval_request', {
        p_request_id: requestId,
        p_decision: decision,
        p_notes: notes?.trim() || null
      });

      if (!rpcError) return;
      console.warn('[ApprovalService] RPC fallback to direct update:', rpcError.message);
    } catch (e) {
      console.warn('[ApprovalService] RPC call exception, attempting fallback:', e);
    }

    // 2. Fallback direct update (guarded by database RLS & trigger)
    const { error: updateError } = await supabase
      .from('approval_requests')
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id || null,
        review_notes: notes?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
  },

  /**
   * Cancel an existing pending request
   */
  async cancelApprovalRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('approval_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;
  }
};
