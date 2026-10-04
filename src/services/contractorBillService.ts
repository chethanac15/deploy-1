import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ContractorBill, ContractorBillStatus } from '../types';

export interface CreateContractorBillInput {
  organizationId: string;
  projectId: string;
  vendorId: string;
  boqItemId: string;
  invoiceNumber: string;
  invoiceDate: string;
  billedQuantity: number;
  billedRate: number;
  createdBy: string;
}

function mapBill(row: any): ContractorBill {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    project_name: row.projects?.name || '',
    vendor_id: row.vendor_id,
    vendor_name: row.vendors?.name || '',
    boq_item_id: row.boq_item_id,
    boq_item_name: row.boq_items?.item_name || '',
    invoice_number: row.invoice_number,
    invoice_date: row.invoice_date,
    billed_quantity: Number(row.billed_quantity),
    billed_rate: Number(row.billed_rate),
    amount: Number(row.amount),
    status: row.status as ContractorBillStatus,
    decision_comment: row.decision_comment || undefined,
    expense_id: row.expense_id || undefined,
    created_by: row.created_by || undefined,
    created_at: row.created_at,
    events: (row.contractor_bill_events || []).map((event: any) => ({
      id: event.id,
      action: event.action,
      previous_status: event.previous_status || undefined,
      new_status: event.new_status,
      actor_name: event.actor_name || 'Team member',
      comment: event.comment || undefined,
      created_at: event.created_at
    }))
  };
}

const BILL_SELECT = '*, projects(name), vendors(name), boq_items(item_name), contractor_bill_events(*)';

export const contractorBillService = {
  async getBills(organizationId: string): Promise<ContractorBill[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('contractor_bills')
      .select(BILL_SELECT)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapBill);
  },

  async createBill(input: CreateContractorBillInput): Promise<ContractorBill> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const invoiceNumber = input.invoiceNumber.trim();
    if (!invoiceNumber) throw new Error('Invoice number is required.');
    if (!Number.isFinite(input.billedQuantity) || input.billedQuantity <= 0 ||
        !Number.isFinite(input.billedRate) || input.billedRate <= 0) {
      throw new Error('Billed quantity and rate must be greater than zero.');
    }
    const { data, error } = await supabase
      .from('contractor_bills')
      .insert({
        organization_id: input.organizationId,
        project_id: input.projectId,
        vendor_id: input.vendorId,
        boq_item_id: input.boqItemId,
        invoice_number: invoiceNumber,
        invoice_date: input.invoiceDate,
        billed_quantity: input.billedQuantity,
        billed_rate: input.billedRate,
        amount: input.billedQuantity * input.billedRate,
        created_by: input.createdBy,
        status: 'draft'
      })
      .select('id')
      .single();
    if (error) throw error;
    const bills = await this.getBills(input.organizationId);
    const created = bills.find(bill => bill.id === data.id);
    if (!created) throw new Error('The contractor bill was saved but could not be reloaded.');
    return created;
  },

  async transition(
    bill: ContractorBill,
    action: 'submit' | 'approve' | 'reject' | 'mark_paid',
    comment = ''
  ): Promise<ContractorBill> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { error } = await supabase.rpc('transition_contractor_bill', {
      p_bill_id: bill.id,
      p_action: action,
      p_comment: comment.trim() || null
    });
    if (error) throw error;
    const bills = await this.getBills(bill.organization_id);
    const updated = bills.find(item => item.id === bill.id);
    if (!updated) throw new Error('The bill status changed but it could not be reloaded.');
    return updated;
  }
};
