import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ChangeRequest, ChangeRequestEvent, ChangeRequestStatus } from '../types';
import { createShareToken, hashShareToken } from '../utils/shareTokens';

export interface CreateChangeRequestInput {
  organizationId: string;
  projectId: string;
  relatedBOQItemId?: string;
  title: string;
  description: string;
  requestedBy: string;
  additionalQuantity: number;
  unit: string;
  materialCost: number;
  labourCost: number;
  sellingPrice: number;
  gstPercent: number;
  validUntil?: string;
  createdBy: string;
}

function mapRequest(row: any): ChangeRequest {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    project_name: row.projects?.name || row.project_name || '',
    related_boq_item_id: row.related_boq_item_id || undefined,
    title: row.title,
    description: row.description || '',
    requested_by: row.requested_by,
    additional_quantity: Number(row.additional_quantity) || 0,
    unit: row.unit || 'Nos',
    additional_material_cost: Number(row.additional_material_cost) || 0,
    additional_labour_cost: Number(row.additional_labour_cost) || 0,
    selling_price: Number(row.selling_price) || 0,
    gst_percent: Number(row.gst_percent) || 0,
    valid_until: row.valid_until || undefined,
    status: row.status as ChangeRequestStatus,
    decision_at: row.decision_at || undefined,
    decision_comment: row.decision_comment || undefined,
    created_by: row.created_by || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    events: (row.events || row.change_request_events || []).map((event: any, index: number): ChangeRequestEvent => ({
      id: event.id || `${event.action}-${event.created_at}-${index}`,
      action: event.action,
      actor_name: event.actor_name || 'Team member',
      comment: event.comment || undefined,
      details: event.details || undefined,
      created_at: event.created_at
    }))
  };
}

export const changeRequestService = {
  async getChangeRequests(organizationId: string): Promise<ChangeRequest[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('change_requests')
      .select('*, projects(name), change_request_events(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRequest);
  },

  async createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('change_requests')
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId,
        related_boq_item_id: input.relatedBOQItemId || null,
        title: input.title.trim(),
        description: input.description.trim(),
        requested_by: input.requestedBy.trim(),
        additional_quantity: input.additionalQuantity,
        unit: input.unit,
        additional_material_cost: input.materialCost,
        additional_labour_cost: input.labourCost,
        selling_price: input.sellingPrice,
        gst_percent: input.gstPercent,
        valid_until: input.validUntil || null,
        created_by: input.createdBy,
        status: 'draft'
      })
      .select()
      .single();
    if (error) throw error;
    const rows = await this.getChangeRequests(input.organizationId);
    const created = rows.find(request => request.id === data.id);
    if (!created) throw new Error('The change request was saved but could not be reloaded.');
    return created;
  },

  async transition(
    request: ChangeRequest,
    nextStatus: ChangeRequestStatus
  ): Promise<{ request: ChangeRequest; token?: string }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    let token: string | undefined;
    let tokenHash: string | undefined;
    if (nextStatus === 'client_approval') {
      token = createShareToken();
      tokenHash = await hashShareToken(token);
    }
    const { error } = await supabase.rpc('transition_change_request', {
      p_change_request_id: request.id,
      p_new_status: nextStatus,
      p_share_token_hash: tokenHash || null
    });
    if (error) throw error;
    const rows = await this.getChangeRequests(request.organization_id);
    const updated = rows.find(item => item.id === request.id);
    if (!updated) throw new Error('The change request moved forward but could not be reloaded.');
    return { request: updated, token };
  },

  async getSharedChangeRequest(token: string): Promise<ChangeRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('get_shared_change_request', { p_token: token });
    if (error) throw error;
    return mapRequest(data);
  },

  async respondToSharedChangeRequest(
    token: string,
    action: 'approved' | 'rejected' | 'changes_requested',
    comment: string
  ): Promise<ChangeRequest> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('respond_to_shared_change_request', {
      p_token: token,
      p_action: action,
      p_comment: comment.trim() || null
    });
    if (error) throw error;
    return mapRequest(data);
  }
};
