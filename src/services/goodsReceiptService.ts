import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GoodsReceipt } from '../types';

export interface CreateGoodsReceiptInput {
  purchaseId: string;
  receivedOn: string;
  siteLocation: string;
  notes?: string;
  items: Array<{
    purchaseItemId: string;
    deliveredQuantity: number;
    rejectedQuantity: number;
    actualRate?: number;
  }>;
}

function mapReceipt(row: any): GoodsReceipt {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    purchase_id: row.purchase_id,
    grn_number: row.grn_number,
    received_on: row.received_on,
    site_location: row.site_location,
    notes: row.notes || undefined,
    created_by: row.created_by || undefined,
    created_at: row.created_at,
    items: (row.goods_receipt_items || []).map((item: any) => ({
      id: item.id,
      purchase_item_id: item.purchase_item_id,
      item_name: item.item_name,
      unit: item.unit,
      ordered_quantity: Number(item.ordered_quantity) || 0,
      delivered_quantity: Number(item.delivered_quantity) || 0,
      accepted_quantity: Number(item.accepted_quantity) || 0,
      rejected_quantity: Number(item.rejected_quantity) || 0,
      actual_rate: item.actual_rate === null ? undefined : Number(item.actual_rate)
    }))
  };
}

export const goodsReceiptService = {
  async getGoodsReceipts(purchaseId: string): Promise<GoodsReceipt[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('goods_receipts')
      .select('*, goods_receipt_items(*)')
      .eq('purchase_id', purchaseId)
      .order('received_on', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapReceipt);
  },

  async createGoodsReceipt(input: CreateGoodsReceiptInput): Promise<GoodsReceipt> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const items = input.items.filter(item => item.deliveredQuantity > 0).map(item => ({
      purchase_item_id: item.purchaseItemId,
      delivered_quantity: item.deliveredQuantity,
      rejected_quantity: item.rejectedQuantity,
      actual_rate: item.actualRate ?? null
    }));
    if (!items.length) throw new Error('Enter a delivered quantity for at least one PO line.');

    const { data: receiptId, error: receiptError } = await supabase.rpc('record_goods_receipt', {
      p_purchase_id: input.purchaseId,
      p_received_on: input.receivedOn,
      p_site_location: input.siteLocation.trim(),
      p_notes: input.notes?.trim() || null,
      p_items: items
    });
    if (receiptError) throw receiptError;

    const receipts = await this.getGoodsReceipts(input.purchaseId);
    const receipt = receipts.find(item => item.id === receiptId);
    if (!receipt) throw new Error('The goods receipt was recorded but could not be reloaded.');
    return receipt;
  }
};
