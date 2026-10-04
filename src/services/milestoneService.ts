import { supabase } from '../lib/supabase';
import { Milestone, MilestoneStatus } from '../types';

export interface CreateMilestoneInput {
  project_id: string;
  title: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  status?: MilestoneStatus;
  progress?: number;
  sort_order?: number;
}

export const milestoneService = {
  /**
   * Fetch all milestones for a project in chronological / sort order
   */
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch milestones:', error);
      throw new Error(`Failed to load milestones: ${error.message}`);
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      organization_id: m.organization_id,
      project_id: m.project_id,
      title: m.title,
      description: m.description || undefined,
      start_date: m.start_date || undefined,
      due_date: m.due_date || undefined,
      status: m.status as MilestoneStatus,
      progress: Math.min(100, Math.max(0, Number(m.progress) || 0)),
      sort_order: Number(m.sort_order) || 0,
      created_at: m.created_at,
      updated_at: m.updated_at
    }));
  },

  /**
   * Create a new milestone
   */
  async createMilestone(input: CreateMilestoneInput): Promise<Milestone> {
    const { data: profile } = await supabase.from('profiles').select('organization_id').single();
    if (!profile?.organization_id) {
      throw new Error('No active organization found.');
    }

    let status = input.status || 'pending';
    let progress = Math.min(100, Math.max(0, input.progress ?? 0));

    if (status === 'completed') {
      progress = 100;
    } else if (progress === 100) {
      status = 'completed';
    }

    const { data, error } = await supabase
      .from('milestones')
      .insert({
        organization_id: profile.organization_id,
        project_id: input.project_id,
        title: input.title.trim(),
        description: input.description || null,
        start_date: input.start_date || null,
        due_date: input.due_date || null,
        status: status,
        progress: progress,
        sort_order: input.sort_order || 0
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create milestone:', error);
      throw new Error(`Failed to create milestone: ${error?.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      title: data.title,
      description: data.description || undefined,
      start_date: data.start_date || undefined,
      due_date: data.due_date || undefined,
      status: data.status as MilestoneStatus,
      progress: Number(data.progress) || 0,
      sort_order: Number(data.sort_order) || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Update milestone progress or details
   */
  async updateMilestone(id: string, updates: Partial<CreateMilestoneInput>): Promise<Milestone> {
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description || null;
    if (updates.start_date !== undefined) payload.start_date = updates.start_date || null;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date || null;
    if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;

    if (updates.status !== undefined) {
      payload.status = updates.status;
      if (updates.status === 'completed') {
        payload.progress = 100;
      }
    }

    if (updates.progress !== undefined) {
      const p = Math.min(100, Math.max(0, Number(updates.progress)));
      payload.progress = p;
      if (p === 100) {
        payload.status = 'completed';
      } else if (p > 0 && (!payload.status || payload.status === 'pending')) {
        payload.status = 'in_progress';
      }
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to update milestone:', error);
      throw new Error(`Failed to update milestone: ${error?.message}`);
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      title: data.title,
      description: data.description || undefined,
      start_date: data.start_date || undefined,
      due_date: data.due_date || undefined,
      status: data.status as MilestoneStatus,
      progress: Number(data.progress) || 0,
      sort_order: Number(data.sort_order) || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Delete milestone
   */
  async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete milestone:', error);
      throw new Error(`Failed to delete milestone: ${error.message}`);
    }
  },

  /**
   * Helper: Calculate project progress deterministically from milestones
   * Returns average progress (0-100), or null if no milestones exist.
   */
  calculateProjectMilestoneProgress(milestones: Milestone[]): number | null {
    if (!milestones || milestones.length === 0) {
      return null;
    }
    const total = milestones.reduce((sum, m) => sum + (Number(m.progress) || 0), 0);
    return Math.round(total / milestones.length);
  }
};
