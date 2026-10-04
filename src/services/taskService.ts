// ==============================================================================
// APNI ESTATE INTERIORS - TASK SERVICE (TEAM ASSIGNMENTS & PROJECT EXECUTION)
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Task, TaskPriority, TaskStatus } from '../types';

export interface CreateTaskInput {
  organization_id: string;
  project_id?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  project_id?: string;
  title?: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export const DB_TASK_STATUS_TO_UI: Record<string, TaskStatus> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const UI_TASK_STATUS_TO_DB: Record<string, string> = {
  'To Do': 'todo',
  'In Progress': 'in_progress',
  'Completed': 'completed',
  'Cancelled': 'cancelled'
};

export const DB_TASK_PRIORITY_TO_UI: Record<string, TaskPriority> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

export const UI_TASK_PRIORITY_TO_DB: Record<string, string> = {
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high',
  'Urgent': 'urgent'
};

export const taskService = {
  async getTasks(params?: { projectId?: string; organizationId?: string }): Promise<Task[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        ),
        assigned_profile:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (params?.organizationId) {
      query = query.eq('organization_id', params.organizationId);
    }
    if (params?.projectId) {
      query = query.eq('project_id', params.projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      organization_id: item.organization_id,
      project_id: item.project_id,
      projectId: item.project_id,
      projectName: item.projects?.name || undefined,
      title: item.title,
      description: item.description || '',
      assigned_to: item.assigned_to,
      assigned_staff_name: item.assigned_profile?.full_name,
      due_date: item.due_date,
      dueDate: item.due_date,
      priority: DB_TASK_PRIORITY_TO_UI[item.priority] || 'Medium',
      status: DB_TASK_STATUS_TO_UI[item.status] || 'To Do',
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const dbStatus = UI_TASK_STATUS_TO_DB[input.status || 'To Do'] || 'todo';
    const dbPriority = UI_TASK_PRIORITY_TO_DB[input.priority || 'Medium'] || 'medium';

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: input.organization_id,
        project_id: input.project_id || null,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        assigned_to: input.assigned_to || null,
        due_date: input.due_date || null,
        priority: dbPriority,
        status: dbStatus
      })
      .select(`
        *,
        projects (
          id,
          name
        ),
        assigned_profile:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      projectId: data.project_id,
      projectName: data.projects?.name || undefined,
      title: data.title,
      description: data.description || '',
      assigned_to: data.assigned_to,
      assigned_staff_name: data.assigned_profile?.full_name,
      due_date: data.due_date,
      dueDate: data.due_date,
      priority: DB_TASK_PRIORITY_TO_UI[data.priority] || 'Medium',
      status: DB_TASK_STATUS_TO_UI[data.status] || 'To Do',
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.project_id !== undefined) payload.project_id = updates.project_id || null;
    if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to || null;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date || null;
    if (updates.priority !== undefined) {
      payload.priority = UI_TASK_PRIORITY_TO_DB[updates.priority] || updates.priority.toLowerCase();
    }
    if (updates.status !== undefined) {
      payload.status = UI_TASK_STATUS_TO_DB[updates.status] || updates.status.toLowerCase();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        projects (
          id,
          name
        ),
        assigned_profile:profiles!tasks_assigned_to_fkey(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      project_id: data.project_id,
      projectId: data.project_id,
      projectName: data.projects?.name || undefined,
      title: data.title,
      description: data.description || '',
      assigned_to: data.assigned_to,
      assigned_staff_name: data.assigned_profile?.full_name,
      due_date: data.due_date,
      dueDate: data.due_date,
      priority: DB_TASK_PRIORITY_TO_UI[data.priority] || 'Medium',
      status: DB_TASK_STATUS_TO_UI[data.status] || 'To Do',
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteTask(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
