import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MaterialWastage } from '../types';

function mapWastage(row: any): MaterialWastage {
  return {
    id: row.id,
    organization_id: row.organization_id,
    project_id: row.project_id,
    material_id: row.material_id,
    material_name: row.materials?.name || row.material_name || '',
    material_unit: row.materials?.unit || row.material_unit || 'units',
    material_transaction_id: row.material_transaction_id,
    quantity: Number(row.quantity) || 0,
    reason: row.reason,
    wastage_date: row.wastage_date,
    recorded_by: row.recorded_by || undefined,
    recorded_by_name: row.profiles?.full_name || row.recorded_by_name || undefined,
    created_at: row.created_at
  };
}

export const wastageService = {
  async getWastage(projectId: string): Promise<MaterialWastage[]> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('material_wastage')
      .select('*, materials(name, unit), profiles(full_name)')
      .eq('project_id', projectId)
      .order('wastage_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapWastage);
  },

  async recordWastage(input: {
    materialId: string;
    quantity: number;
    reason: string;
    wastageDate: string;
  }): Promise<MaterialWastage> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      throw new Error('Wastage quantity must be greater than zero.');
    }
    if (!input.reason.trim()) throw new Error('A reason is required to record wastage.');
    const { data, error } = await supabase.rpc('record_material_wastage', {
      p_material_id: input.materialId,
      p_quantity: input.quantity,
      p_reason: input.reason.trim(),
      p_wastage_date: input.wastageDate
    });
    if (error) throw error;
    return mapWastage(data);
  }
};
