// ==============================================================================
// APNI ESTATE INTERIORS - CUSTOM ROLES & ADVANCED PERMISSIONS PAGE (ENTERPRISE)
// Granular capability configuration, custom roles matrix, and staff assignments
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CustomRole, PermissionKey, StaffMember } from '../types';
import { roleService } from '../services/roleService';
import { INITIAL_CUSTOM_ROLES, INITIAL_STAFF_MEMBERS } from '../data/mockData';
import { 
  PERMISSION_DEFINITIONS, 
  DEFAULT_ROLE_PERMISSIONS, 
  getEffectivePermissions 
} from '../lib/permissions';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const RolesPermissionsPage: React.FC = () => {
  const { teamMembers } = useApp();
  const { profile, organization, isDemoMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'roles' | 'assignments' | 'matrix'>('roles');
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    return isDemoMode ? INITIAL_CUSTOM_ROLES : [];
  });
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    return isDemoMode ? INITIAL_STAFF_MEMBERS : teamMembers;
  });
  const [loading, setLoading] = useState<boolean>(!isDemoMode);

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleName, setRoleName] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [roleIsActive, setRoleIsActive] = useState<boolean>(true);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionKey[]>([]);
  const [roleError, setRoleError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Assign role modal
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [assignedRoleId, setAssignedRoleId] = useState<string>('');

  // Group permission definitions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof PERMISSION_DEFINITIONS> = {};
    for (const p of PERMISSION_DEFINITIONS) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, []);

  // Fetch roles on mount
  useEffect(() => {
    if (isDemoMode) {
      setCustomRoles(INITIAL_CUSTOM_ROLES);
      setStaffList(INITIAL_STAFF_MEMBERS);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        if (organization?.id) {
          const roles = await roleService.getCustomRoles(organization.id);
          setCustomRoles(roles);
        }
      } catch (err: any) {
        console.error('[RolesPage] Failed to fetch custom roles:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organization?.id, isDemoMode]);

  // Open Create Role Modal
  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleIsActive(true);
    setSelectedPermissions([
      'projects.view',
      'tasks.manage',
      'documents.manage'
    ]);
    setRoleError('');
    setIsRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const openEditRoleModal = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setRoleIsActive(role.is_active);
    setSelectedPermissions(role.permissions || []);
    setRoleError('');
    setIsRoleModalOpen(true);
  };

  // Toggle permission selection
  const togglePermission = (key: PermissionKey) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Select all or deselect all
  const selectAllPermissions = () => {
    setSelectedPermissions(PERMISSION_DEFINITIONS.map(p => p.key));
  };
  const deselectAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // Save Role
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setRoleError('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    setRoleError('');

    try {
      if (isDemoMode) {
        if (editingRole) {
          setCustomRoles(prev => prev.map(r => r.id === editingRole.id ? {
            ...r,
            name: roleName.trim(),
            description: roleDescription.trim() || undefined,
            is_active: roleIsActive,
            permissions: selectedPermissions
          } : r));
        } else {
          const newRole: CustomRole = {
            id: `role-${Date.now()}`,
            organization_id: 'demo-org',
            name: roleName.trim(),
            description: roleDescription.trim() || undefined,
            is_active: roleIsActive,
            permissions: selectedPermissions,
            user_count: 0,
            created_at: new Date().toISOString()
          };
          setCustomRoles(prev => [...prev, newRole]);
        }
        setIsRoleModalOpen(false);
      } else {
        if (editingRole) {
          const updated = await roleService.updateCustomRole(
            organization?.id || '',
            editingRole.id,
            {
              name: roleName.trim(),
              description: roleDescription.trim() || undefined,
              is_active: roleIsActive,
              permissions: selectedPermissions
            }
          );
          setCustomRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
        } else {
          if (!organization?.id) throw new Error('No active organization.');
          const created = await roleService.createCustomRole(organization.id, {
            name: roleName.trim(),
            description: roleDescription.trim() || undefined,
            is_active: roleIsActive,
            permissions: selectedPermissions
          });
          setCustomRoles(prev => [...prev, created]);
        }
        setIsRoleModalOpen(false);
      }
    } catch (err: any) {
      setRoleError(err.message || 'Failed to save role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (role: CustomRole) => {
    if (!confirm(`Are you sure you want to delete custom role "${role.name}"? Staff assigned to this role will revert to their base role.`)) {
      return;
    }

    try {
      if (isDemoMode) {
        setCustomRoles(prev => prev.filter(r => r.id !== role.id));
        setStaffList(prev => prev.map(s => s.custom_role_id === role.id ? { ...s, custom_role_id: undefined, customRoleName: undefined } : s));
      } else {
        await roleService.deleteCustomRole(role.id);
        setCustomRoles(prev => prev.filter(r => r.id !== role.id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete role');
    }
  };

  // Open Assign Modal
  const openAssignModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setAssignedRoleId(staff.custom_role_id || '');
    setAssignModalOpen(true);
  };

  // Save Staff Role Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    try {
      const targetRole = customRoles.find(r => r.id === assignedRoleId);
      if (isDemoMode) {
        setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? {
          ...s,
          custom_role_id: assignedRoleId || undefined,
          customRoleName: targetRole?.name || undefined
        } : s));
        setAssignModalOpen(false);
      } else {
        await roleService.assignCustomRoleToStaff(selectedStaff.id, assignedRoleId || null);
        setStaffList(prev => prev.map(s => s.id === selectedStaff.id ? {
          ...s,
          custom_role_id: assignedRoleId || undefined,
          customRoleName: targetRole?.name || undefined
        } : s));
        setAssignModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign role');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Enterprise Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-purple-600" />
            <span>Roles & Permissions</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure custom organizational roles, granular capabilities, and assign responsibilities to staff members.
          </p>
        </div>

        {activeTab === 'roles' && (
          <button
            onClick={openCreateRoleModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-900/20 active:scale-[0.98] transition-all cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* Info Card: Fixed Roles vs Custom Roles */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950 leading-relaxed">
          <strong>Built on Non-Destructive Multi-Tenancy:</strong> Standard roles (Owner, Admin, Designer, Supervisor, Member) continue operating as system defaults. Custom roles allow you to tailor specific sets of the 22 real capabilities and assign them to staff. The <strong>Owner</strong> always retains ultimate administrative authority.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Custom Roles ({customRoles.length})
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'assignments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Staff Assignments ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Full Capabilities Matrix
        </button>
      </div>

      {/* 1. Custom Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {customRoles.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No Custom Roles Configured</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Create custom organizational roles such as Senior Project Manager, Quantity Surveyor, or Procurement Controller.
              </p>
              <button
                onClick={openCreateRoleModal}
                className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 shadow-sm"
              >
                Create Custom Role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map(role => (
                <div key={role.id} className="premium-card p-5 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold font-display text-slate-900 truncate">
                          {role.name}
                        </h3>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-1 inline-block">
                          {role.permissions?.length || 0} Capabilities Enabled
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        role.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {role.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {role.description}
                      </p>
                    )}

                    {/* Permissions list chips preview */}
                    <div className="py-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Permission Capabilities:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {role.permissions?.map(perm => (
                          <span key={perm} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleDeleteRole(role)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditRoleModal(role)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Role</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Staff Role Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="premium-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold font-display text-slate-900">
              Staff Roles & Custom Assignments
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              Manage custom authority per staff member
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3">Base System Role</th>
                  <th className="py-2.5 px-3">Assigned Custom Role</th>
                  <th className="py-2.5 px-3">Effective Capabilities</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map(staff => {
                  const isOwner = staff.role === 'owner';
                  const customRole = customRoles.find(r => r.id === staff.custom_role_id);
                  const effective = getEffectivePermissions(
                    { id: staff.id, organization_id: '', full_name: staff.full_name, role: staff.role as any, custom_role_id: staff.custom_role_id } as any,
                    customRoles
                  );

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{staff.full_name}</div>
                        <div className="text-[11px] text-slate-400">{staff.email || 'No email registered'}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isOwner ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {staff.role}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {customRole ? (
                          <span className="font-bold text-purple-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-500" />
                            <span>{customRole.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None (Default {staff.role})</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {isOwner ? 'All 22 Capabilities (Full Studio Control)' : `${effective.length} Capabilities Granted`}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isOwner ? (
                          <span className="text-xs text-slate-400 italic flex items-center justify-end gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openAssignModal(staff)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Assign Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Full Matrix View */}
      {activeTab === 'matrix' && (
        <div className="premium-card p-5 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold font-display text-slate-900">
              Granular Application Capabilities Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of base system tiers against your configured custom roles.
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  {category} Capabilities
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold">
                        <th className="py-2 px-3 w-1/3">Capability</th>
                        <th className="py-2 px-2 text-center">Owner</th>
                        <th className="py-2 px-2 text-center">Admin</th>
                        <th className="py-2 px-2 text-center">Designer</th>
                        <th className="py-2 px-2 text-center">Supervisor</th>
                        {customRoles.map(cr => (
                          <th key={cr.id} className="py-2 px-2 text-center text-purple-700 truncate max-w-[120px]">
                            {cr.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {perms.map(p => (
                        <tr key={p.key} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{p.label}</div>
                            <div className="text-[11px] text-slate-400">{p.description}</div>
                          </td>
                          {/* Owner */}
                          <td className="py-2 px-2 text-center">
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          </td>
                          {/* Admin */}
                          <td className="py-2 px-2 text-center">
                            {DEFAULT_ROLE_PERMISSIONS.admin.includes(p.key) ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Designer */}
                          <td className="py-2 px-2 text-center">
                            {DEFAULT_ROLE_PERMISSIONS.designer.includes(p.key) ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Supervisor */}
                          <td className="py-2 px-2 text-center">
                            {DEFAULT_ROLE_PERMISSIONS.supervisor.includes(p.key) ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {/* Custom Roles */}
                          {customRoles.map(cr => {
                            const has = cr.permissions?.includes(p.key);
                            return (
                              <td key={cr.id} className="py-2 px-2 text-center">
                                {has ? (
                                  <Check className="w-4 h-4 text-purple-600 mx-auto font-bold" />
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? 'Edit Custom Role' : 'Create Custom Role'}
        subtitle="Select exact permissions to bundle into this organizational role."
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          {roleError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{roleError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Project Manager"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Brief explanation of duties and access level..."
                value={roleDescription}
                onChange={e => setRoleDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="roleIsActive"
                checked={roleIsActive}
                onChange={e => setRoleIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
              <label htmlFor="roleIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                Role is active and available for staff assignment
              </label>
            </div>
          </div>

          {/* Permissions Selector */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Grant Permissions ({selectedPermissions.length} selected)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllPermissions}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">
                    {category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map(p => {
                      const isSelected = selectedPermissions.includes(p.key);
                      return (
                        <div
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected 
                              ? 'bg-purple-50/80 border-purple-300 text-purple-950' 
                              : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/70'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold">{p.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Role to Staff Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Custom Role: ${selectedStaff?.full_name}`}
        subtitle="Combine staff base system roles with fine-grained custom roles."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Staff Member:</span>
              <span className="font-bold text-slate-900">{selectedStaff?.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>System Role:</span>
              <span className="font-bold text-slate-900 uppercase">{selectedStaff?.role}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Select Custom Role
            </label>
            <select
              value={assignedRoleId}
              onChange={e => setAssignedRoleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="">-- No Custom Role (Use Default System Role) --</option>
              {customRoles.map(cr => (
                <option key={cr.id} value={cr.id}>
                  {cr.name} ({cr.permissions?.length || 0} permissions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
