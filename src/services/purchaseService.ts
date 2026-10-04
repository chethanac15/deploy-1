// ==============================================================================
// APNI ESTATE INTERIORS - PURCHASE ORDER & PROCUREMENT SERVICE
// Atomic multi-item purchase management, derived line/PO totals & vendor integration
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Purchase, PurchaseItem, PurchaseStatus, PurchasePaymentStatus } from '../types';

export interface CreatePurchaseInput {
  id?: string;
  project_id: string;
  vendor_id: string;
  po_number?: string;
  order_date: string;
  expected_delivery?: string;
  status?: PurchaseStatus;
  payment_status?: PurchasePaymentStatus;
  notes?: string;
  items: Array<{
    item_name: string;
    description?: string;
    quantity: number;
    unit: string;
    rate: number;
  }>;
}

const DB_STATUS_MAP: Record<string, PurchaseStatus> = {
  draft: 'Draft',
  ordered: 'Ordered',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled'
};

const APP_STATUS_MAP: Record<string, string> = {
  'Draft': 'draft',
  'Ordered': 'ordered',
  'Partially Received': 'partially_received',
  'Received': 'received',
  'Delivered': 'received',
  'Cancelled': 'cancelled',
  'draft': 'draft',
  'ordered': 'ordered',
  'partially_received': 'partially_received',
  'received': 'received',
  'delivered': 'received',
  'cancelled': 'cancelled'
};

const DB_PAYMENT_MAP: Record<string, PurchasePaymentStatus> = {
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid'
};

const APP_PAYMENT_MAP: Record<string, string> = {
  'Pending': 'pending',
  'Partially Paid': 'partially_paid',
  'Paid': 'paid',
  'Unpaid': 'pending',
  'pending': 'pending',
  'partially_paid': 'partially_paid',
  'partial': 'partially_paid',
  'paid': 'paid',
  'unpaid': 'pending'
};

export const purchaseService = {
  async getPurchases(organizationId?: string, projectId?: string): Promise<Purchase[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('purchases')
      .select('*, projects(name), vendors(name), purchase_items(*)')
      .order('order_date', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch purchases:', error);
      throw error;
    }

    return (data || []).map((p: any) => {
      const items: PurchaseItem[] = (p.purchase_items || []).map((it: any) => ({
        id: it.id,
        purchase_id: it.purchase_id,
        organization_id: it.organization_id,
        item_name: it.item_name,
        description: it.description || '',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'pcs',
        rate: Number(it.rate) || 0,
        total: Number(it.total) || ((Number(it.quantity) || 1) * (Number(it.rate) || 0)),
        received_quantity: Number(it.received_quantity) || 0,
        rejected_quantity: Number(it.rejected_quantity) || 0,
        created_at: it.created_at,
        updated_at: it.updated_at
      }));

      // Calculate or verify derived total
      const derivedTotal = items.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0);

      return {
        id: p.id,
        organization_id: p.organization_id,
        project_id: p.project_id,
        projectName: p.projects?.name || '',
        vendor_id: p.vendor_id,
        vendorName: p.vendors?.name || '',
        po_number: p.po_number,
        order_date: p.order_date,
        expected_delivery: p.expected_delivery || undefined,
        status: DB_STATUS_MAP[p.status] || 'Draft',
        payment_status: DB_PAYMENT_MAP[p.payment_status] || 'Pending',
        notes: p.notes || '',
        total_amount: items.length > 0 ? derivedTotal : (Number(p.total_amount) || 0),
        items,
        created_by: p.created_by || undefined,
        created_at: p.created_at,
        updated_at: p.updated_at
      };
    });
  },

  async savePurchaseOrder(organizationId: string, input: CreatePurchaseInput): Promise<Purchase> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    if (input.id) {
      const { data: existingLines, error: linesError } = await supabase
        .from('purchase_items')
        .select('received_quantity, rejected_quantity')
        .eq('purchase_id', input.id);
      if (linesError) throw linesError;
      if ((existingLines || []).some(line =>
        Number(line.received_quantity) > 0 || Number(line.rejected_quantity) > 0
      )) {
        throw new Error('This purchase order cannot be edited after goods have been received. Create a follow-up PO for any replacement or additional quantities.');
      }
    }

    const cleanItems = (input.items || []).map(it => ({
      item_name: it.item_name.trim(),
      description: it.description?.trim() || null,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'pcs',
      rate: Number(it.rate) || 0
    }));

    // Try transactional atomic RPC first
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('save_purchase_order_atomic', {
        p_purchase: {
          id: input.id || null,
          project_id: input.project_id,
          vendor_id: input.vendor_id,
          po_number: input.po_number || null,
          order_date: input.order_date,
          expected_delivery: input.expected_delivery || null,
          status: APP_STATUS_MAP[input.status || 'Draft'],
          payment_status: APP_PAYMENT_MAP[input.payment_status || 'Pending'],
          notes: input.notes?.trim() || null
        },
        p_items: cleanItems
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        const purchases = await this.getPurchases(organizationId, input.project_id);
        const created = purchases.find(p => p.id === rpcRes.purchase_id);
        if (created) return created;
      }
    } catch (e) {
      console.warn('Atomic RPC save_purchase_order_atomic not yet executed in database, falling back to manual tables.', e);
    }

    // Fallback: Direct table operations
    let purchaseId = input.id;
    const derivedTotal = cleanItems.reduce((acc, it) => acc + (it.quantity * it.rate), 0);

    if (purchaseId) {
      const { error: updErr } = await supabase
        .from('purchases')
        .update({
          project_id: input.project_id,
          vendor_id: input.vendor_id,
          po_number: input.po_number,
          order_date: input.order_date,
          expected_delivery: input.expected_delivery || null,
          status: APP_STATUS_MAP[input.status || 'Draft'],
          payment_status: APP_PAYMENT_MAP[input.payment_status || 'Pending'],
          notes: input.notes?.trim() || null,
          total_amount: derivedTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId);

      if (updErr) throw updErr;

      // Delete existing items
      await supabase.from('purchase_items').delete().eq('purchase_id', purchaseId);
    } else {
      const { data: newP, error: insErr } = await supabase
        .from('purchases')
        .insert({
          organization_id: organizationId,
          project_id: input.project_id,
          vendor_id: input.vendor_id,
          po_number: input.po_number || `PO-${Date.now().toString().slice(-6)}`,
          order_date: input.order_date,
          expected_delivery: input.expected_delivery || null,
          status: APP_STATUS_MAP[input.status || 'Draft'],
          payment_status: APP_PAYMENT_MAP[input.payment_status || 'Pending'],
          notes: input.notes?.trim() || null,
          total_amount: derivedTotal
        })
        .select()
        .single();

      if (insErr) throw insErr;
      purchaseId = newP.id;
    }

    // Insert line items
    if (cleanItems.length > 0 && purchaseId) {
      const itemRows = cleanItems.map(it => ({
        organization_id: organizationId,
        purchase_id: purchaseId,
        item_name: it.item_name,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        rate: it.rate,
        total: it.quantity * it.rate
      }));

      const { error: itemsErr } = await supabase
        .from('purchase_items')
        .insert(itemRows);

      if (itemsErr) throw itemsErr;
    }

    const purchases = await this.getPurchases(organizationId, input.project_id);
    const result = purchases.find(p => p.id === purchaseId);
    if (!result) throw new Error('Failed to retrieve saved purchase order.');
    return result;
  },

  async deletePurchase(purchaseId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: existingLines, error: linesError } = await supabase
      .from('purchase_items')
      .select('received_quantity, rejected_quantity')
      .eq('purchase_id', purchaseId);
    if (linesError) throw linesError;
    if ((existingLines || []).some(line =>
      Number(line.received_quantity) > 0 || Number(line.rejected_quantity) > 0
    )) {
      throw new Error('This purchase order cannot be deleted after goods have been received. Preserve its receipt and procurement history.');
    }

    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchaseId);

    if (error) throw error;
  }
};
