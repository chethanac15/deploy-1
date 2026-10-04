// ==============================================================================
// APNI ESTATE INTERIORS - ROLE-BASED ACCESS CONTROL (RBAC) & CUSTOM PERMISSIONS
// Centralized permissions matrix for UI authorization & operation capability checks
// ==============================================================================

import { UserRole, Profile, CustomRole, PermissionKey, PermissionDefinition } from '../types';

export type AppFeature = 
  | 'projects'
  | 'clients'
  | 'leads'
  | 'tasks'
  | 'documents'
  | 'boq'
  | 'expenses'
  | 'budget'
  | 'materials'
  | 'dpr'
  | 'photos'
  | 'vendors'
  | 'payments'
  | 'purchases'
  | 'profitability'
  | 'reports'
  | 'team'
  | 'settings'
  | 'management'
  | 'branches'
  | 'approvals'
  | 'roles'
  | 'export';

export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'manage_roles'
  | 'view_financials'
  | 'manage_procurement'
  | 'export_data';

// ==============================================================================
// CENTRALIZED GRANULAR PERMISSION DEFINITIONS
// ==============================================================================
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Projects
  { key: 'projects.view', label: 'View Projects', category: 'Projects', description: 'Access studio projects list, details, and site overviews.' },
  { key: 'projects.manage', label: 'Manage Projects', category: 'Projects', description: 'Create, edit, archive, and update project metadata.' },
  { key: 'boq.manage', label: 'BOQ Estimation', category: 'Projects', description: 'Build and modify Bill of Quantities line items and rates.' },

  // Sales & CRM
  { key: 'clients.view', label: 'View Clients', category: 'Sales', description: 'Access client directory and contact information.' },
  { key: 'clients.manage', label: 'Manage Clients', category: 'Sales', description: 'Add and update client details, records, and scopes.' },
  { key: 'leads.manage', label: 'Leads & Pipeline', category: 'Sales', description: 'Manage sales leads, stages, follow-ups, and conversions.' },

  // Finance & Ledger
  { key: 'expenses.view', label: 'View Expenses', category: 'Finance', description: 'See project cost expenditures, bills, and payment records.' },
  { key: 'expenses.manage', label: 'Manage Expenses', category: 'Finance', description: 'Record new project expenses, upload receipts, and edit costs.' },
  { key: 'payments.view', label: 'View Client Payments', category: 'Finance', description: 'View client milestone schedules and payment status.' },
  { key: 'payments.manage', label: 'Manage Client Payments', category: 'Finance', description: 'Create milestone schedules and record received client funds.' },

  // Procurement & Vendors
  { key: 'vendors.manage', label: 'Vendor Directory', category: 'Procurement', description: 'Manage suppliers, contractors, fabricators, and GST details.' },
  { key: 'purchases.manage', label: 'Purchase Orders', category: 'Procurement', description: 'Create, edit, and send vendor procurement purchase orders.' },
  { key: 'materials.manage', label: 'Material Inventory', category: 'Procurement', description: 'Track stock IN/OUT transactions and site material usage.' },

  // Site & Operations
  { key: 'tasks.manage', label: 'Task Assignments', category: 'Site & Ops', description: 'Create, assign, and update team deliverables.' },
  { key: 'documents.manage', label: 'Document Vault', category: 'Site & Ops', description: 'Upload and organize site CAD drawings, contracts, and renders.' },

  // Governance & Approvals
  { key: 'approvals.request', label: 'Submit Approvals', category: 'Governance', description: 'Submit purchase orders and expenses for managerial review.' },
  { key: 'approvals.review', label: 'Approve & Reject', category: 'Governance', description: 'Authorize or reject pending financial items and commitments.' },

  // Administration & Analytics
  { key: 'reports.view', label: 'Management Reports', category: 'Administration', description: 'Access business analytics, profitability, and receivables.' },
  { key: 'branches.manage', label: 'Branch Management', category: 'Administration', description: 'Configure studio branch offices, managers, and allocations.' },
  { key: 'team.manage', label: 'Team Administration', category: 'Administration', description: 'Invite staff members and assign roles and custom permissions.' },
  { key: 'settings.manage', label: 'Company Settings', category: 'Administration', description: 'Update studio profile, billing details, and company defaults.' },
  { key: 'exports.manage', label: 'Enterprise Data Export', category: 'Administration', description: 'Export client, project, and financial datasets to CSV / JSON.' }
];

// Default permissions for fixed roles
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  owner: [
    'projects.view', 'projects.manage', 'clients.view', 'clients.manage', 'leads.manage', 'boq.manage',
    'expenses.view', 'expenses.manage', 'payments.view', 'payments.manage', 'vendors.manage', 'purchases.manage',
    'materials.manage', 'tasks.manage', 'documents.manage', 'reports.view', 'approvals.request', 'approvals.review',
    'branches.manage', 'team.manage', 'settings.manage', 'exports.manage'
  ],
  admin: [
    'projects.view', 'projects.manage', 'clients.view', 'clients.manage', 'leads.manage', 'boq.manage',
    'expenses.view', 'expenses.manage', 'payments.view', 'payments.manage', 'vendors.manage', 'purchases.manage',
    'materials.manage', 'tasks.manage', 'documents.manage', 'reports.view', 'approvals.request', 'approvals.review',
    'branches.manage', 'team.manage', 'settings.manage', 'exports.manage'
  ],
  designer: [
    'projects.view', 'projects.manage', 'clients.view', 'leads.manage', 'boq.manage',
    'vendors.manage', 'purchases.manage', 'materials.manage', 'tasks.manage', 'documents.manage',
    'approvals.request'
  ],
  supervisor: [
    'projects.view', 'materials.manage', 'tasks.manage', 'documents.manage',
    'approvals.request'
  ],
  member: [
    'projects.view', 'tasks.manage', 'documents.manage'
  ]
};

/**
 * Returns the effective set of permissions for a user profile.
 * Owner always has all permissions.
 * If user has a custom role assigned, custom role permissions are evaluated.
 * Otherwise, default fixed role permissions are used.
 */
export function getEffectivePermissions(profile: Profile | null, customRoles: CustomRole[] = []): PermissionKey[] {
  if (!profile) return DEFAULT_ROLE_PERMISSIONS.owner; // Fallback for unconfigured or demo
  if (profile.role === 'owner') return DEFAULT_ROLE_PERMISSIONS.owner;

  if (profile.custom_role_id) {
    const customRole = customRoles.find(r => r.id === profile.custom_role_id);
    if (customRole && customRole.is_active) {
      return customRole.permissions;
    }
  }

  return DEFAULT_ROLE_PERMISSIONS[profile.role] || DEFAULT_ROLE_PERMISSIONS.member;
}

/**
 * Checks if a profile has a specific granular permission.
 */
export function hasPermission(
  profile: Profile | null,
  permission: PermissionKey,
  customRoles: CustomRole[] = []
): boolean {
  if (!profile) return true;
  if (profile.role === 'owner') return true;
  const effective = getEffectivePermissions(profile, customRoles);
  return effective.includes(permission);
}

// ==============================================================================
// BACKWARD-COMPATIBLE HELPER FUNCTIONS
// ==============================================================================

const ROLE_PERMISSIONS: Record<UserRole, {
  accessibleFeatures: AppFeature[];
  canViewFinancials: boolean;
  canManageProcurement: boolean;
  canManageTeam: boolean;
  canDeleteCoreRecords: boolean;
}> = {
  owner: {
    accessibleFeatures: [
      'projects', 'clients', 'leads', 'tasks', 'documents', 'boq', 'expenses',
      'budget', 'materials', 'dpr', 'photos', 'vendors', 'payments', 'purchases',
      'profitability', 'reports', 'team', 'settings', 'management', 'branches', 'approvals', 'roles', 'export'
    ],
    canViewFinancials: true,
    canManageProcurement: true,
    canManageTeam: true,
    canDeleteCoreRecords: true
  },
  admin: {
    accessibleFeatures: [
      'projects', 'clients', 'leads', 'tasks', 'documents', 'boq', 'expenses',
      'budget', 'materials', 'dpr', 'photos', 'vendors', 'payments', 'purchases',
      'profitability', 'reports', 'team', 'settings', 'management', 'branches', 'approvals', 'roles', 'export'
    ],
    canViewFinancials: true,
    canManageProcurement: true,
    canManageTeam: true,
    canDeleteCoreRecords: true
  },
  designer: {
    accessibleFeatures: [
      'projects', 'clients', 'leads', 'tasks', 'documents', 'boq',
      'materials', 'dpr', 'photos', 'vendors', 'purchases', 'team', 'settings'
    ],
    canViewFinancials: false,
    canManageProcurement: true,
    canManageTeam: false,
    canDeleteCoreRecords: false
  },
  supervisor: {
    accessibleFeatures: [
      'projects', 'tasks', 'documents', 'materials', 'dpr', 'photos',
      'purchases', 'team', 'settings'
    ],
    canViewFinancials: false,
    canManageProcurement: false,
    canManageTeam: false,
    canDeleteCoreRecords: false
  },
  member: {
    accessibleFeatures: [
      'projects', 'tasks', 'documents', 'dpr', 'photos', 'team', 'settings'
    ],
    canViewFinancials: false,
    canManageProcurement: false,
    canManageTeam: false,
    canDeleteCoreRecords: false
  }
};

export function canAccessFeature(role: UserRole | string | undefined, feature: AppFeature): boolean {
  if (!role) return true;
  const config = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.member;
  return config.accessibleFeatures.includes(feature);
}

export function canViewFinancials(role: UserRole | string | undefined): boolean {
  if (!role) return true;
  const config = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.member;
  return config.canViewFinancials;
}

export function canManageProcurement(role: UserRole | string | undefined): boolean {
  if (!role) return true;
  const config = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.member;
  return config.canManageProcurement;
}

export function canManageTeam(role: UserRole | string | undefined): boolean {
  if (!role) return true;
  const config = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.member;
  return config.canManageTeam;
}

export function canDeleteEntity(role: UserRole | string | undefined): boolean {
  if (!role) return true;
  const config = ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS.member;
  return config.canDeleteCoreRecords;
}
