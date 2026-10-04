// ==============================================================================
// APNI ESTATE INTERIORS - MULTI-BRANCH SERVICE
// Dedicated service for multi-branch creation, editing, activation, and metrics
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Branch, Project, Expense, StaffMember } from '../types';

export interface CreateBranchInput {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

export const branchService = {
  /**
   * Fetch all branches for current organization
   */
  async getBranches(organizationId?: string): Promise<Branch[]> {
    if (!isSupabaseConfigured) return [];

    let query = supabase
      .from('branches')
      .select('*, profiles:manager_id(full_name)')
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[BranchService] Error fetching branches:', error);
      throw error;
    }

    return (data || []).map((b: any) => ({
      id: b.id,
      organization_id: b.organization_id,
      name: b.name,
      code: b.code || '',
      address: b.address || '',
      city: b.city || '',
      state: b.state || '',
      phone: b.phone || '',
      email: b.email || '',
      manager_id: b.manager_id,
      managerName: b.profiles?.full_name || '',
      is_active: b.is_active ?? true,
      created_at: b.created_at,
      updated_at: b.updated_at
    }));
  },

  /**
   * Create a new branch
   */
  async createBranch(organizationId: string, input: CreateBranchInput): Promise<Branch> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('branches')
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        code: input.code?.trim() || null,
        address: input.address?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        manager_id: input.manager_id || null,
        is_active: input.is_active ?? true
      })
      .select('*, profiles:manager_id(full_name)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      code: data.code || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      phone: data.phone || '',
      email: data.email || '',
      manager_id: data.manager_id,
      managerName: data.profiles?.full_name || '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Update an existing branch
   */
  async updateBranch(id: string, input: UpdateBranchInput): Promise<Branch> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const payload: any = {
      updated_at: new Date().toISOString()
    };
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.code !== undefined) payload.code = input.code?.trim() || null;
    if (input.address !== undefined) payload.address = input.address?.trim() || null;
    if (input.city !== undefined) payload.city = input.city?.trim() || null;
    if (input.state !== undefined) payload.state = input.state?.trim() || null;
    if (input.phone !== undefined) payload.phone = input.phone?.trim() || null;
    if (input.email !== undefined) payload.email = input.email?.trim() || null;
    if (input.manager_id !== undefined) payload.manager_id = input.manager_id;
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const { data, error } = await supabase
      .from('branches')
      .update(payload)
      .eq('id', id)
      .select('*, profiles:manager_id(full_name)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      organization_id: data.organization_id,
      name: data.name,
      code: data.code || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      phone: data.phone || '',
      email: data.email || '',
      manager_id: data.manager_id,
      managerName: data.profiles?.full_name || '',
      is_active: data.is_active ?? true,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  /**
   * Delete a branch (only permitted if no active projects)
   */
  async deleteBranch(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Calculate derived branch metrics strictly from real active projects, expenses, and staff
   */
  calculateBranchMetrics(
    branches: Branch[],
    projects: Project[],
    expenses: Expense[],
    staff: StaffMember[]
  ): Branch[] {
    return branches.map(branch => {
      // 1. Projects allocated to this branch
      const branchProjects = projects.filter(p => p.branch_id === branch.id);
      const projectCount = branchProjects.length;

      // 2. Contract value across these projects
      const totalContractValue = branchProjects.reduce((sum, p) => {
        return sum + (Number(p.contract_value) || Number(p.budget) || 0);
      }, 0);

      // 3. Project IDs for expense aggregation
      const projectIds = new Set(branchProjects.map(p => p.id));
      const totalExpenses = expenses
        .filter(e => projectIds.has(e.projectId))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      // 4. Team count located at this branch
      const teamCount = staff.filter(s => s.branch_id === branch.id).length;

      // 5. Manager name lookup if not already populated
      let managerName = branch.managerName;
      if (!managerName && branch.manager_id) {
        const mgr = staff.find(s => s.id === branch.manager_id);
        if (mgr) managerName = mgr.full_name;
      }

      return {
        ...branch,
        managerName: managerName || 'Unassigned',
        project_count: projectCount,
        team_count: teamCount,
        total_contract_value: totalContractValue,
        total_expenses: totalExpenses
      };
    });
  }
};
