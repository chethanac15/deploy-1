import { supabase } from '../lib/supabase';
import { Material, MaterialTransaction } from '../types';

export interface CreateMaterialInput {
  project_id: string;
  room_id?: string;
  name: string;
  category?: string;
  unit?: string;
  quantity_ordered?: number;
  minimum_stock?: number;
  initial_quantity?: number;
  notes?: string;
}

export interface CreateMaterialTransactionInput {
  material_id: string;
  project_id: string;
  room_id?: string;
  transaction_type: 'in' | 'out';
  quantity: number;
  transaction_date?: string;
  notes?: string;
}

export interface MaterialStockSummary {
  material_id: string;
  total_in: number;
  total_out: number;
  available: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export const materialService = {
  /**
   * Fetch all materials for a given project
   */
  async getMaterials(projectId: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch materials:', error);
      throw new Error(`Failed to load materials: ${error.message}`);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      organization_id: m.organization_id,
      project_id: m.project_id,
      room_id: m.room_id || undefined,
      name: m.name,
      category: m.category || undefined,
      unit: m.unit || 'pcs',
      quantity_ordered: Number(m.quantity_ordered) || 0,
      minimum_stock: Number(m.minimum_stock) || 0,
      notes: m.notes || undefined,
      created_at: m.created_at,
      updated_at: m.updated_at
    }));
  },

  /**
   * Create a new material, optionally recording initial opening stock
   */
  async createMaterial(input: CreateMaterialInput): Promise<{ material: Material; initialTransaction?: MaterialTransaction }> {
    const { data: profile } = await supabase.from('profiles').select('organization_id').single();
    if (!profile?.organization_id) {
      throw new Error('No active organization found. Please sign in again.');
    }

    const { data: newMat, error: matErr } = await supabase
      .from('materials')
      .insert({
        organization_id: profile.organization_id,
        project_id: input.project_id,
        room_id: input.room_id || null,
        name: input.name.trim(),
        category: input.category || null,
        unit: input.unit || 'pcs',
        quantity_ordered: input.quantity_ordered || 0,
        minimum_stock: input.minimum_stock || 0,
        notes: input.notes || null
      })
      .select()
      .single();

    if (matErr || !newMat) {
      console.error('Failed to create material:', matErr);
      throw new Error(`Failed to create material: ${matErr?.message}`);
    }

    const material: Material = {
      id: newMat.id,
      organization_id: newMat.organization_id,
      project_id: newMat.project_id,
      room_id: newMat.room_id || undefined,
      name: newMat.name,
      category: newMat.category || undefined,
      unit: newMat.unit,
      quantity_ordered: Number(newMat.quantity_ordered) || 0,
      minimum_stock: Number(newMat.minimum_stock) || 0,
      notes: newMat.notes || undefined,
      created_at: newMat.created_at,
      updated_at: newMat.updated_at
    };

    let initialTransaction: MaterialTransaction | undefined;

    // If an initial opening stock is supplied (> 0), record it as the first IN transaction
    if (input.initial_quantity && input.initial_quantity > 0) {
      try {
        initialTransaction = await this.createTransaction({
          material_id: material.id,
          project_id: material.project_id,
          room_id: material.room_id,
          transaction_type: 'in',
          quantity: input.initial_quantity,
          transaction_date: new Date().toISOString().split('T')[0],
          notes: 'Initial / Opening Stock'
        });
      } catch (txErr) {
        console.warn('Initial stock transaction creation failed:', txErr);
      }
    }

    return { material, initialTransaction };
  },

  /**
   * Update material details
   */
  async updateMaterial(id: string, updates: Partial<CreateMaterialInput>): Promise<Material> {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.category !== undefined) payload.category = updates.category || null;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.quantity_ordered !== undefined) payload.quantity_ordered = updates.quantity_ordered;
    if (updates.minimum_stock !== undefined) payload.minimum_stock = updates.minimum_stock;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;
    if (updates.room_id !== undefined) payload.room_id = updates.room_id || null;

    const { data, error } = await supabase
      .from('materials')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update material:', error);
      throw new Error(`Failed to update material: ${error?.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      room_id: data.room_id || undefined,
      name: data.name,
      category: data.category || undefined,
      unit: data.unit,
      quantity_ordered: Number(data.quantity_ordered) || 0,
      minimum_stock: Number(data.minimum_stock) || 0,
      notes: data.notes || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Delete material with safeguard against deleting if transactions exist
   */
  async deleteMaterial(id: string): Promise<void> {
    // Check for existing transactions
    const { count, error: countErr } = await supabase
      .from('material_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('material_id', id);

    if (countErr) {
      console.error('Failed to check transactions:', countErr);
      throw new Error(`Unable to verify material transactions: ${countErr.message}`);
    }

    if (count && count > 0) {
      throw new Error('Cannot delete material with existing stock transaction history. Use Stock OUT to adjust balance.');
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete material:', error);
      throw new Error(`Failed to delete material: ${error.message}`);
    }
  },

  /**
   * Fetch all material transactions for a given project
   */
  async getMaterialTransactions(projectId: string): Promise<MaterialTransaction[]> {
    const { data, error } = await supabase
      .from('material_transactions')
      .select('*')
      .eq('project_id', projectId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch material transactions:', error);
      throw new Error(`Failed to load transactions: ${error.message}`);
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      organization_id: t.organization_id,
      material_id: t.material_id,
      project_id: t.project_id,
      room_id: t.room_id || undefined,
      transaction_type: t.transaction_type as 'in' | 'out',
      quantity: Number(t.quantity),
      transaction_date: t.transaction_date,
      notes: t.notes || undefined,
      created_at: t.created_at
    }));
  },

  /**
   * Record a Stock IN or Stock OUT transaction atomically
   */
  async createTransaction(input: CreateMaterialTransactionInput): Promise<MaterialTransaction> {
    if (!input.quantity || input.quantity <= 0) {
      throw new Error('Transaction quantity must be greater than zero.');
    }

    const { data: profile } = await supabase.from('profiles').select('organization_id').single();
    if (!profile?.organization_id) {
      throw new Error('No active organization found.');
    }

    // Attempt PostgreSQL Atomic RPC first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('record_material_transaction_atomic', {
      p_material_id: input.material_id,
      p_project_id: input.project_id,
      p_room_id: input.room_id || null,
      p_transaction_type: input.transaction_type,
      p_quantity: input.quantity,
      p_transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
      p_notes: input.notes || null
    });

    if (!rpcError && rpcResult?.transaction_id) {
      return {
        id: rpcResult.transaction_id,
        organization_id: profile.organization_id,
        material_id: input.material_id,
        project_id: input.project_id,
        room_id: input.room_id || undefined,
        transaction_type: input.transaction_type,
        quantity: input.quantity,
        transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
        notes: input.notes || undefined,
        created_at: new Date().toISOString()
      };
    }

    // Fallback: If RPC is not available, execute client-verified database transaction
    if (rpcError && rpcError.message.includes('Only') && rpcError.message.includes('available')) {
      throw new Error(rpcError.message);
    }

    // Calculate current available stock
    const { data: existingTx, error: txFetchErr } = await supabase
      .from('material_transactions')
      .select('transaction_type, quantity')
      .eq('material_id', input.material_id);

    if (txFetchErr) {
      throw new Error(`Failed to calculate current stock: ${txFetchErr.message}`);
    }

    let totalIn = 0;
    let totalOut = 0;
    for (const tx of existingTx || []) {
      if (tx.transaction_type === 'in') totalIn += Number(tx.quantity);
      if (tx.transaction_type === 'out') totalOut += Number(tx.quantity);
    }
    const currentAvailable = totalIn - totalOut;

    if (input.transaction_type === 'out' && input.quantity > currentAvailable) {
      throw new Error(`Only ${currentAvailable} available. Cannot stock out ${input.quantity}.`);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('material_transactions')
      .insert({
        organization_id: profile.organization_id,
        material_id: input.material_id,
        project_id: input.project_id,
        room_id: input.room_id || null,
        transaction_type: input.transaction_type,
        quantity: input.quantity,
        transaction_date: input.transaction_date || new Date().toISOString().split('T')[0],
        notes: input.notes || null
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      throw new Error(`Failed to record stock transaction: ${insertErr?.message}`);
    }

    return {
      id: inserted.id,
      organization_id: inserted.organization_id,
      material_id: inserted.material_id,
      project_id: inserted.project_id,
      room_id: inserted.room_id || undefined,
      transaction_type: inserted.transaction_type as 'in' | 'out',
      quantity: Number(inserted.quantity),
      transaction_date: inserted.transaction_date,
      notes: inserted.notes || undefined,
      created_at: inserted.created_at
    };
  },

  /**
   * Helper: Calculate available stock from a list of transactions
   */
  calculateStock(materialId: string, transactions: MaterialTransaction[], minimumStock = 0): MaterialStockSummary {
    const matTx = transactions.filter(t => t.material_id === materialId);
    let total_in = 0;
    let total_out = 0;

    for (const t of matTx) {
      if (t.transaction_type === 'in') total_in += t.quantity;
      if (t.transaction_type === 'out') total_out += t.quantity;
    }

    const available = total_in - total_out;
    const is_out_of_stock = available <= 0;
    const is_low_stock = !is_out_of_stock && minimumStock > 0 && available <= minimumStock;

    return {
      material_id: materialId,
      total_in,
      total_out,
      available,
      is_low_stock,
      is_out_of_stock
    };
  }
};
