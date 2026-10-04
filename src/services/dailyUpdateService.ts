import { supabase } from '../lib/supabase';
import { DailyUpdate } from '../types';

export interface CreateDailyUpdateInput {
  project_id: string;
  update_date?: string;
  work_completed: string;
  work_pending?: string;
  issues?: string;
  next_day_tasks?: string;
  workers_count?: number;
  progress?: number;
}

export const dailyUpdateService = {
  /**
   * Fetch all daily updates for a project (ordered newest first)
   */
  async getDailyUpdates(projectId: string): Promise<DailyUpdate[]> {
    const { data, error } = await supabase
      .from('daily_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('update_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch daily updates:', error);
      throw new Error(`Failed to load daily updates: ${error.message}`);
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      organization_id: u.organization_id,
      project_id: u.project_id,
      update_date: u.update_date,
      work_completed: u.work_completed || undefined,
      work_pending: u.work_pending || undefined,
      issues: u.issues || undefined,
      next_day_tasks: u.next_day_tasks || undefined,
      workers_count: u.workers_count !== undefined && u.workers_count !== null ? Number(u.workers_count) : undefined,
      progress: u.progress !== undefined && u.progress !== null ? Number(u.progress) : undefined,
      created_by: u.created_by || undefined,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
  },

  /**
   * Create a new daily progress report
   */
  async createDailyUpdate(input: CreateDailyUpdateInput): Promise<DailyUpdate> {
    if (!input.work_completed || !input.work_completed.trim()) {
      throw new Error('Work completed description is required for daily update.');
    }

    const { data: profile } = await supabase.from('profiles').select('id, organization_id').single();
    if (!profile?.organization_id) {
      throw new Error('No active organization found.');
    }

    const payload: Record<string, any> = {
      organization_id: profile.organization_id,
      project_id: input.project_id,
      update_date: input.update_date || new Date().toISOString().split('T')[0],
      work_completed: input.work_completed.trim(),
      work_pending: input.work_pending ? input.work_pending.trim() : null,
      issues: input.issues ? input.issues.trim() : null,
      next_day_tasks: input.next_day_tasks ? input.next_day_tasks.trim() : null,
      created_by: profile.id
    };

    if (input.workers_count !== undefined) payload.workers_count = Math.max(0, input.workers_count);
    if (input.progress !== undefined) payload.progress = Math.min(100, Math.max(0, input.progress));

    const { data, error } = await supabase
      .from('daily_updates')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create daily update:', error);
      throw new Error(`Failed to create daily update: ${error?.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      update_date: data.update_date,
      work_completed: data.work_completed || undefined,
      work_pending: data.work_pending || undefined,
      issues: data.issues || undefined,
      next_day_tasks: data.next_day_tasks || undefined,
      workers_count: data.workers_count !== undefined && data.workers_count !== null ? Number(data.workers_count) : undefined,
      progress: data.progress !== undefined && data.progress !== null ? Number(data.progress) : undefined,
      created_by: data.created_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Update an existing daily progress report
   */
  async updateDailyUpdate(id: string, updates: Partial<CreateDailyUpdateInput>): Promise<DailyUpdate> {
    const payload: Record<string, any> = {};
    if (updates.update_date !== undefined) payload.update_date = updates.update_date;
    if (updates.work_completed !== undefined) payload.work_completed = updates.work_completed.trim();
    if (updates.work_pending !== undefined) payload.work_pending = updates.work_pending ? updates.work_pending.trim() : null;
    if (updates.issues !== undefined) payload.issues = updates.issues ? updates.issues.trim() : null;
    if (updates.next_day_tasks !== undefined) payload.next_day_tasks = updates.next_day_tasks ? updates.next_day_tasks.trim() : null;
    if (updates.workers_count !== undefined) payload.workers_count = Math.max(0, updates.workers_count);
    if (updates.progress !== undefined) payload.progress = Math.min(100, Math.max(0, updates.progress));

    const { data, error } = await supabase
      .from('daily_updates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update daily update:', error);
      throw new Error(`Failed to update daily update: ${error?.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      update_date: data.update_date,
      work_completed: data.work_completed || undefined,
      work_pending: data.work_pending || undefined,
      issues: data.issues || undefined,
      next_day_tasks: data.next_day_tasks || undefined,
      workers_count: data.workers_count !== undefined && data.workers_count !== null ? Number(data.workers_count) : undefined,
      progress: data.progress !== undefined && data.progress !== null ? Number(data.progress) : undefined,
      created_by: data.created_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Delete daily update
   */
  async deleteDailyUpdate(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_updates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete daily update:', error);
      throw new Error(`Failed to delete daily update: ${error.message}`);
    }
  }
};
