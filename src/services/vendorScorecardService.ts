import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface VendorScorecard {
  vendor_id: string;
  order_count: number;
  project_count: number;
  total_purchase_value: number;
  average_unit_price: number;
  comparable_price_score: number;
  quality_score: number;
  average_delivery_delay_days: number;
  delivery_score: number;
  rejected_quantity: number;
  overall_score: number;
}

export const vendorScorecardService = {
  async getScorecards(): Promise<VendorScorecard[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.rpc('get_vendor_scorecards');
    if (error) throw error;
    return (data || []).map((row: any) => ({
      vendor_id: row.vendor_id,
      order_count: Number(row.order_count) || 0,
      project_count: Number(row.project_count) || 0,
      total_purchase_value: Number(row.total_purchase_value) || 0,
      average_unit_price: Number(row.average_unit_price) || 0,
      comparable_price_score: Number(row.comparable_price_score) || 0,
      quality_score: Number(row.quality_score) || 0,
      average_delivery_delay_days: Number(row.average_delivery_delay_days) || 0,
      delivery_score: Number(row.delivery_score) || 0,
      rejected_quantity: Number(row.rejected_quantity) || 0,
      overall_score: Number(row.overall_score) || 0
    }));
  }
};
