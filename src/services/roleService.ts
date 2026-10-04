// ==============================================================================
// APNI ESTATE INTERIORS - CUSTOM ROLES & PERMISSIONS SERVICE
// Additive management of granular custom roles and staff assignments
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CustomRole, PermissionKey, StaffMember } from '../types';

export interface CreateCustomRoleInput {
  name: string;
  description?: string;
  permissions: PermissionKey[];
  is_active?: boolean;
}

export interface UpdateCustomRoleInput {
  name?: string;
  description?: string;
  permissions?: PermissionKey[];
  is_active?: boolean;
}

export const roleService = {
  /**
   * Fetch all custom roles and their assigned permission keys
   */
  async getCustomRoles(organizationId?: string): Promise<CustomRole[]> {
    if (!isSupabaseConfigured) return [];

    let roleQuery = supabase
      .from('custom_roles')
      .select('*')
      .order('name', { ascending: true });

    if (organizationId) {
      roleQuery = roleQuery.eq('organization_id', organizationId);
    }

    const { data: rolesData, error: rolesError } = await roleQuery;
    if (rolesError) {
      console.error('[RoleService] Error fetching roles:', rolesError);
      throw rolesError;
    }

    if (!rolesData || rolesData.length === 0) return [];

    // Fetch permissions for all fetched roles
    const roleIds = rolesData.map((r: any) => r.id);
    const { data: permsData, error: permsError } = await supabase
      .from('custom_role_permissions')
      .select('custom_role_id, permission_key')
      .in('custom_role_id', roleIds);

    if (permsError) {
      console.error('[RoleService] Error fetching role permissions:', permsError);
      throw permsError;
    }

    // Group permissions by custom_role_id
    const permMap: Record<string, PermissionKey[]> = {};
    for (const p of permsData || []) {
      if (!permMap[p.custom_role_id]) permMap[p.custom_role_id] = [];
      permMap[p.custom_role_id].push(p.permission_key as PermissionKey);
    }

    // Fetch user counts with this role
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('custom_role_id')
      .in('custom_role_id', roleIds);

    const userCountMap: Record<string, number> = {};
    for (const prof of profilesData || []) {
      if (prof.custom_role_id) {
        userCountMap[prof.custom_role_id] = (userCountMap[prof.custom_role_id] || 0) + 1;
      }
    }

    return rolesData.map((r: any) => ({
      id: r.id,
      organization_id: r.organization_id,
      name: r.name,
      description: r.description || '',
      is_active: r.is_active ?? true,
      permissions: permMap[r.id] || [],
      user_count: userCountMap[r.id] || 0,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  },

  /**
   * Create a new custom role with its associated permissions
   */
  async createCustomRole(organizationId: string, input: CreateCustomRoleInput): Promise<CustomRole> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Insert role record
    const { data: roleData, error: roleError } = await supabase
      .from('custom_roles')
      .insert({
        organization_id: organizationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        is_active: input.is_active ?? true
      })
      .select()
      .single();

    if (roleError) throw roleError;

    // 2. Insert permissions
    if (input.permissions && input.permissions.length > 0) {
      const permInserts = input.permissions.map(perm => ({
        organization_id: organizationId,
        custom_role_id: roleData.id,
        permission_key: perm
      }));

      const { error: permError } = await supabase
        .from('custom_role_permissions')
        .insert(permInserts);

      if (permError) {
        console.error('[RoleService] Error inserting permissions:', permError);
      }
    }

    return {
      id: roleData.id,
      organization_id: roleData.organization_id,
      name: roleData.name,
      description: roleData.description || '',
      is_active: roleData.is_active,
      permissions: input.permissions || [],
      user_count: 0,
      created_at: roleData.created_at,
      updated_at: roleData.updated_at
    };
  },

  /**
   * Update an existing custom role and refresh its permissions
   */
  async updateCustomRole(
    organizationId: string,
    roleId: string,
    input: UpdateCustomRoleInput
  ): Promise<CustomRole> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    // 1. Update role record
    const payload: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const { data: roleData, error: roleError } = await supabase
      .from('custom_roles')
      .update(payload)
      .eq('id', roleId)
      .select()
      .single();

    if (roleError) throw roleError;

    // 2. If permissions were passed, replace them
    if (input.permissions !== undefined) {
      // Delete existing
      await supabase
        .from('custom_role_permissions')
        .delete()
        .eq('custom_role_id', roleId);

      // Insert new
      if (input.permissions.length > 0) {
        const permInserts = input.permissions.map(perm => ({
          organization_id: organizationId,
          custom_role_id: roleId,
          permission_key: perm
        }));

        await supabase
          .from('custom_role_permissions')
          .insert(permInserts);
      }
    }

    return {
      id: roleData.id,
      organization_id: roleData.organization_id,
      name: roleData.name,
      description: roleData.description || '',
      is_active: roleData.is_active,
      permissions: input.permissions || [],
      created_at: roleData.created_at,
      updated_at: roleData.updated_at
    };
  },

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleId: string): Promise<void> {
    if (!isSupabaseConfigured) return;

    // Any assigned users will have their custom_role_id set to null automatically by ON DELETE SET NULL
    const { error } = await supabase
      .from('custom_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
  },

  /**
   * Assign or unassign a custom role to a team profile
   */
  async assignCustomRoleToStaff(
    profileId: string,
    customRoleId: string | null
  ): Promise<void> {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        custom_role_id: customRoleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) throw error;
  }
};
