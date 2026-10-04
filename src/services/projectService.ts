import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Project, ProjectStatus, ProjectType } from '../types';

// Map database snake_case status to frontend display status
export function mapDbStatusToDisplay(status: string): ProjectStatus {
  switch (status?.toLowerCase()) {
    case 'needs_attention': return 'Needs Attention';
    case 'budget_alert': return 'Budget Alert';
    case 'delayed': return 'Delayed';
    case 'completed': return 'Completed';
    case 'on_track':
    default:
      return 'On Track';
  }
}

export function mapDisplayStatusToDb(status: ProjectStatus): string {
  switch (status) {
    case 'Needs Attention': return 'needs_attention';
    case 'Budget Alert': return 'budget_alert';
    case 'Delayed': return 'delayed';
    case 'Completed': return 'completed';
    case 'On Track':
    default:
      return 'on_track';
  }
}

export function mapDbProjectTypeToDisplay(type: string): ProjectType {
  switch (type?.toLowerCase()) {
    case 'commercial': return 'Commercial';
    case 'hospitality': return 'Hospitality';
    case 'retail': return 'Retail';
    case 'residential':
    default:
      return 'Residential';
  }
}

export const projectService = {
  async getProjects(organizationId?: string): Promise<Project[]> {
    if (!isSupabaseConfigured) return [];
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, name, phone, email),
        rooms(*),
        expenses(id, amount, category)
      `)
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((p: any) => {
      const totalSpent = (p.expenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
      const budget = Number(p.budget) || 0;
      
      return {
        id: p.id,
        organization_id: p.organization_id,
        client_id: p.client_id,
        name: p.name,
        client: p.client?.name || 'Private Client',
        clientPhone: p.client?.phone || '',
        location: p.location || 'Site Location',
        city: p.location || 'Mumbai',
        type: mapDbProjectTypeToDisplay(p.project_type),
        budget,
        spent: totalSpent,
        progress: Number(p.progress) || 0,
        status: mapDbStatusToDisplay(p.status),
        startDate: p.start_date || new Date().toISOString().split('T')[0],
        deadline: p.deadline || new Date().toISOString().split('T')[0],
        coverImage: p.cover_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        contract_value: p.contract_value ? Number(p.contract_value) : undefined,
        description: p.description || '',
        rooms: p.rooms || [],
        categoryBudgets: [
          { category: 'Materials', allocated: Math.round(budget * 0.45), spent: 0 },
          { category: 'Labour', allocated: Math.round(budget * 0.25), spent: 0 },
          { category: 'Furniture', allocated: Math.round(budget * 0.15), spent: 0 },
          { category: 'Electrical', allocated: Math.round(budget * 0.08), spent: 0 },
          { category: 'Miscellaneous', allocated: Math.round(budget * 0.07), spent: 0 },
        ],
        notes: [],
        photos: []
      };
    });
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (!isSupabaseConfigured) return null;
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        rooms(*),
        expenses(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const totalSpent = (data.expenses || []).reduce((acc: number, e: any) => acc + (Number(e.amount) || 0), 0);
    const budget = Number(data.budget) || 0;

    return {
      id: data.id,
      organization_id: data.organization_id,
      client_id: data.client_id,
      name: data.name,
      client: data.client?.name || 'Private Client',
      clientPhone: data.client?.phone || '',
      location: data.location || 'Site Location',
      city: data.location || 'Mumbai',
      type: mapDbProjectTypeToDisplay(data.project_type),
      budget,
      spent: totalSpent,
      progress: Number(data.progress) || 0,
      status: mapDbStatusToDisplay(data.status),
      startDate: data.start_date || new Date().toISOString().split('T')[0],
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      coverImage: data.cover_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      contract_value: data.contract_value ? Number(data.contract_value) : undefined,
      description: data.description || '',
      rooms: data.rooms || [],
      categoryBudgets: [
        { category: 'Materials', allocated: Math.round(budget * 0.45), spent: 0 },
        { category: 'Labour', allocated: Math.round(budget * 0.25), spent: 0 },
        { category: 'Furniture', allocated: Math.round(budget * 0.15), spent: 0 },
        { category: 'Electrical', allocated: Math.round(budget * 0.08), spent: 0 },
        { category: 'Miscellaneous', allocated: Math.round(budget * 0.07), spent: 0 },
      ],
      notes: [],
      photos: []
    };
  },

  async createProject(params: {
    organization_id: string;
    client_id?: string;
    name: string;
    location?: string;
    project_type?: string;
    budget: number;
    contract_value?: number;
    start_date?: string;
    deadline?: string;
    description?: string;
    cover_image_url?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        organization_id: params.organization_id,
        client_id: params.client_id || null,
        name: params.name.trim(),
        location: params.location?.trim() || null,
        project_type: params.project_type?.toLowerCase() || 'residential',
        budget: Number(params.budget) || 0,
        contract_value: params.contract_value ? Number(params.contract_value) : null,
        start_date: params.start_date || null,
        deadline: params.deadline || null,
        progress: 0,
        status: 'on_track',
        description: params.description?.trim() || null,
        cover_image_url: params.cover_image_url || null
      })
      .select(`
        *,
        client:clients(id, name, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: {
    name?: string;
    client_id?: string;
    location?: string;
    project_type?: string;
    budget?: number;
    contract_value?: number;
    start_date?: string;
    deadline?: string;
    progress?: number;
    status?: ProjectStatus;
    description?: string;
    cover_image_url?: string;
  }): Promise<any> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.client_id !== undefined) payload.client_id = updates.client_id || null;
    if (updates.location !== undefined) payload.location = updates.location?.trim() || null;
    if (updates.project_type !== undefined) payload.project_type = updates.project_type.toLowerCase();
    if (updates.budget !== undefined) payload.budget = Number(updates.budget) || 0;
    if (updates.contract_value !== undefined) payload.contract_value = updates.contract_value ? Number(updates.contract_value) : null;
    if (updates.start_date !== undefined) payload.start_date = updates.start_date;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;
    if (updates.progress !== undefined) payload.progress = Math.min(100, Math.max(0, Number(updates.progress) || 0));
    if (updates.status !== undefined) payload.status = mapDisplayStatusToDb(updates.status);
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.cover_image_url !== undefined) payload.cover_image_url = updates.cover_image_url;

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, phone)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
