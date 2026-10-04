import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Quotation, QuotationEvent, QuotationLine, QuotationStatus } from '../types';
import { createShareToken, hashShareToken } from '../utils/shareTokens';

export interface CreateQuotationInput {
  organizationId: string;
  projectId: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  projectName: string;
  projectLocation: string;
  companySnapshot: Record<string, string>;
  clientSnapshot: Record<string, string>;
  projectSnapshot: Record<string, string>;
  items: QuotationLine[];
  validUntil?: string;
  terms: string;
  paymentTerms: string;
  createdBy?: string;
}

function mapQuotation(row: any): Quotation {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    client_id: row.client_id || undefined,
    project_name: row.project_snapshot?.name || '',
    client_name: row.client_snapshot?.name || '',
    client_email: row.client_snapshot?.email || undefined,
    client_phone: row.client_snapshot?.phone || undefined,
    quote_number: row.quote_number,
    status: row.status as QuotationStatus,
    currency: row.currency || 'INR',
    subtotal: Number(row.subtotal) || 0,
    gst_amount: Number(row.gst_amount) || 0,
    total: Number(row.total) || 0,
    valid_until: row.valid_until || undefined,
    terms: row.terms || '',
    payment_terms: row.payment_terms || '',
    items: Array.isArray(row.items) ? row.items : [],
    company_snapshot: row.company_snapshot || {},
    client_snapshot: row.client_snapshot || {},
    project_snapshot: row.project_snapshot || {},
    share_token_hash: row.share_token_hash || undefined,
    created_by: row.created_by || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    sent_at: row.sent_at || undefined,
    decision_at: row.decision_at || undefined,
    decision_comment: row.decision_comment || undefined,
    events: (row.events || row.quotation_events || []).map((event: any): QuotationEvent => ({
      id: event.id,
      action: event.action,
      actor_name: event.actor_name,
      comment: event.comment || undefined,
      created_at: event.created_at
    }))
  };
}

export const quotationService = {
  async getQuotations(organizationId: string): Promise<Quotation[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('quotations')
      .select('*, quotation_events(*)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapQuotation);
  },

  async createQuotation(input: CreateQuotationInput): Promise<Quotation> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (!input.items.length) throw new Error('Add at least one BOQ item before creating a quotation.');

    const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = input.items.reduce((sum, item) => sum + item.gst_amount, 0);
    const total = subtotal + gstAmount;
    if (![subtotal, gstAmount, total].every(Number.isFinite)) {
      throw new Error('Quotation totals are invalid. Check the BOQ quantities and rates.');
    }

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId,
        client_id: input.clientId || null,
        currency: 'INR',
        subtotal,
        gst_amount: gstAmount,
        total,
        valid_until: input.validUntil || null,
        terms: input.terms.trim(),
        payment_terms: input.paymentTerms.trim(),
        items: input.items,
        company_snapshot: input.companySnapshot,
        client_snapshot: input.clientSnapshot,
        project_snapshot: input.projectSnapshot,
        created_by: input.createdBy || null
      })
      .select()
      .single();
    if (error) throw error;

    const quotes = await this.getQuotations(input.organizationId);
    const created = quotes.find(quote => quote.id === data.id);
    if (!created) throw new Error('The quotation was saved but could not be reloaded.');
    return created;
  },

  async sendQuotation(quotation: Quotation): Promise<{ quote: Quotation; token: string }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (quotation.status !== 'draft') throw new Error('Only draft quotations can be sent.');

    const token = createShareToken();
    const tokenHash = await hashShareToken(token);
    const { error } = await supabase
      .from('quotations')
      .update({ status: 'sent', share_token_hash: tokenHash, sent_at: new Date().toISOString() })
      .eq('id', quotation.id)
      .eq('status', 'draft')
      .select('id')
      .single();
    if (error) throw error;

    const quotes = await this.getQuotations(quotation.organization_id);
    const sentQuote = quotes.find(item => item.id === quotation.id);
    if (!sentQuote) throw new Error('The quotation was sent but could not be reloaded.');
    return { quote: sentQuote, token };
  },

  async renewShareLink(quotation: Quotation): Promise<string> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (quotation.status !== 'sent') throw new Error('Only quotations awaiting client response can get a new link.');
    const token = createShareToken();
    const tokenHash = await hashShareToken(token);
    const { error } = await supabase.rpc('renew_quotation_share_link', {
      p_quotation_id: quotation.id,
      p_token_hash: tokenHash
    });
    if (error) throw error;
    return token;
  },

  async getSharedQuotation(token: string): Promise<Quotation> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('get_shared_quotation', { p_token: token });
    if (error) throw error;
    return mapQuotation(data);
  },

  async respondToSharedQuotation(
    token: string,
    action: Extract<QuotationStatus, 'approved' | 'rejected' | 'changes_requested'>,
    comment: string
  ): Promise<Quotation> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('respond_to_shared_quotation', {
      p_token: token,
      p_action: action,
      p_comment: comment.trim() || null
    });
    if (error) throw error;
    return mapQuotation(data);
  }
};
