// ==============================================================================
// APNI ESTATE INTERIORS - CLIENT PAYMENT SERVICE
// Client milestone receivables, paid revenue tracking, and overdue calculations
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ClientPayment, ClientPaymentStatus } from '../types';

export interface CreatePaymentInput {
  project_id: string;
  client_id?: string;
  title: string;
  amount: number;
  due_date: string;
  paid_amount?: number;
  paid_date?: string;
  status?: ClientPaymentStatus;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}

const DB_STATUS_MAP: Record<string, ClientPaymentStatus> = {
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue'
};

const APP_STATUS_MAP: Record<string, string> = {
  'Pending': 'pending',
  'Partially Paid': 'partially_paid',
  'Paid': 'paid',
  'Overdue': 'overdue',
  'pending': 'pending',
  'partially_paid': 'partially_paid',
  'partial': 'partially_paid',
  'paid': 'paid',
  'overdue': 'overdue'
};

export const paymentService = {
  async getPayments(organizationId?: string, projectId?: string): Promise<ClientPayment[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('client_payments')
      .select('*, projects(name), clients(name)')
      .order('due_date', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const todayStr = new Date().toISOString().split('T')[0];

    return (data || []).map((p: any) => {
      const dbStatus = p.status ? DB_STATUS_MAP[p.status] || 'Pending' : 'Pending';
      const amount = Number(p.amount) || 0;
      const paidAmount = Number(p.paid_amount) || 0;
      const isPastDue = p.due_date && p.due_date < todayStr;
      
      // Derive dynamic status: if not fully paid and past due, treat as Overdue
      let computedStatus: ClientPaymentStatus = dbStatus;
      if (paidAmount >= amount && amount > 0) {
        computedStatus = 'Paid';
      } else if (paidAmount > 0 && paidAmount < amount) {
        computedStatus = isPastDue ? 'Overdue' : 'Partially Paid';
      } else if (isPastDue && paidAmount < amount) {
        computedStatus = 'Overdue';
      }

      return {
        id: p.id,
        organization_id: p.organization_id,
        project_id: p.project_id,
        projectName: p.projects?.name || '',
        client_id: p.client_id || undefined,
        clientName: p.clients?.name || '',
        title: p.title,
        amount,
        due_date: p.due_date || todayStr,
        paid_amount: paidAmount,
        paid_date: p.paid_date || undefined,
        status: computedStatus,
        payment_method: p.payment_method || '',
        payment_reference: p.payment_reference || '',
        notes: p.notes || '',
        created_by: p.created_by || undefined,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    });
  },

  async createPayment(organizationId: string, input: CreatePaymentInput): Promise<ClientPayment> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const amount = Number(input.amount) || 0;
    const paidAmount = Number(input.paid_amount) || 0;
    
    // Auto-determine status if not explicitly given
    let derivedStatus: ClientPaymentStatus = input.status || 'Pending';
    if (!input.status) {
      if (paidAmount >= amount && amount > 0) {
        derivedStatus = 'Paid';
      } else if (paidAmount > 0) {
        derivedStatus = 'Partially Paid';
      }
    }

    const { data, error } = await supabase
      .from('client_payments')
      .insert({
        organization_id: organizationId,
        project_id: input.project_id,
        client_id: input.client_id || null,
        title: input.title.trim(),
        amount,
        due_date: input.due_date,
        paid_amount: paidAmount,
        paid_date: input.paid_date || (paidAmount > 0 ? new Date().toISOString().split('T')[0] : null),
        status: APP_STATUS_MAP[derivedStatus] || 'pending',
        payment_method: input.payment_method?.trim() || null,
        payment_reference: input.payment_reference?.trim() || null,
        notes: input.notes?.trim() || null
      })
      .select('*, projects(name), clients(name)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      projectName: data.projects?.name || '',
      client_id: data.client_id || undefined,
      clientName: data.clients?.name || '',
      title: data.title,
      amount: Number(data.amount) || 0,
      due_date: data.due_date,
      paid_amount: Number(data.paid_amount) || 0,
      paid_date: data.paid_date || undefined,
      status: derivedStatus,
      payment_method: data.payment_method || '',
      payment_reference: data.payment_reference || '',
      notes: data.notes || '',
      created_by: data.created_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updatePayment(paymentId: string, input: Partial<CreatePaymentInput>): Promise<ClientPayment> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (input.project_id !== undefined) updatePayload.project_id = input.project_id;
    if (input.client_id !== undefined) updatePayload.client_id = input.client_id || null;
    if (input.title !== undefined) updatePayload.title = input.title.trim();
    if (input.amount !== undefined) updatePayload.amount = Number(input.amount);
    if (input.due_date !== undefined) updatePayload.due_date = input.due_date;
    if (input.paid_amount !== undefined) updatePayload.paid_amount = Number(input.paid_amount);
    if (input.paid_date !== undefined) updatePayload.paid_date = input.paid_date || null;
    if (input.status !== undefined) updatePayload.status = APP_STATUS_MAP[input.status] || 'pending';
    if (input.payment_method !== undefined) updatePayload.payment_method = input.payment_method?.trim() || null;
    if (input.payment_reference !== undefined) updatePayload.payment_reference = input.payment_reference?.trim() || null;
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;

    const { data, error } = await supabase
      .from('client_payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .select('*, projects(name), clients(name)')
      .single();

    if (error) throw error;

    const dbStatus = data.status ? DB_STATUS_MAP[data.status] || 'Pending' : 'Pending';

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      projectName: data.projects?.name || '',
      client_id: data.client_id || undefined,
      clientName: data.clients?.name || '',
      title: data.title,
      amount: Number(data.amount) || 0,
      due_date: data.due_date,
      paid_amount: Number(data.paid_amount) || 0,
      paid_date: data.paid_date || undefined,
      status: dbStatus,
      payment_method: data.payment_method || '',
      payment_reference: data.payment_reference || '',
      notes: data.notes || '',
      created_by: data.created_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deletePayment(paymentId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('client_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  }
};
