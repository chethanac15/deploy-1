import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Room } from '../types';

export const roomService = {
  async getRooms(projectId: string, organizationId?: string): Promise<Room[]> {
    if (!isSupabaseConfigured) return [];
    
    let query = supabase
      .from('rooms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      organization_id: r.organization_id,
      project_id: r.project_id,
      name: r.name,
      room_type: r.room_type || 'Custom',
      budget: Number(r.budget) || 0,
      progress: Number(r.progress) || 0,
      notes: r.notes || '',
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  },

  async createRoom(roomData: {
    organization_id: string;
    project_id: string;
    name: string;
    room_type?: string;
    budget?: number;
    progress?: number;
    notes?: string;
  }): Promise<Room> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        organization_id: roomData.organization_id,
        project_id: roomData.project_id,
        name: roomData.name.trim(),
        room_type: roomData.room_type || 'Living Room',
        budget: Number(roomData.budget) || 0,
        progress: Number(roomData.progress) || 0,
        notes: roomData.notes?.trim() || null
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      name: data.name,
      room_type: data.room_type,
      budget: Number(data.budget) || 0,
      progress: Number(data.progress) || 0,
      notes: data.notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateRoom(id: string, updates: {
    name?: string;
    room_type?: string;
    budget?: number;
    progress?: number;
    notes?: string;
  }): Promise<Room> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.room_type !== undefined) payload.room_type = updates.room_type;
    if (updates.budget !== undefined) payload.budget = Number(updates.budget) || 0;
    if (updates.progress !== undefined) payload.progress = Math.min(100, Math.max(0, Number(updates.progress) || 0));
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

    const { data, error } = await supabase
      .from('rooms')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      name: data.name,
      room_type: data.room_type,
      budget: Number(data.budget) || 0,
      progress: Number(data.progress) || 0,
      notes: data.notes || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteRoom(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
