-- ==============================================================================
-- APNI ESTATE INTERIORS - PHASE P2: ENTERPRISE EXPANSION MIGRATION
-- Non-destructive, additive migration for Multi-Branch, Approval Workflows,
-- Custom Roles & Permissions, and Company Configuration & Limit Foundations.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTEND ORGANIZATIONS FOR COMPANY CONFIGURATION & CONFIGURABLE LIMITS
-- Non-destructive additive columns with safe nullability
-- ==============================================================================
alter table if exists public.organizations
  add column if not exists company_email text,
  add column if not exists company_phone text,
  add column if not exists website text,
  add column if not exists currency text not null default 'INR',
  add column if not exists financial_year_start text not null default 'April',
  add column if not exists max_users integer check (max_users is null or max_users > 0),
  add column if not exists max_active_projects integer check (max_active_projects is null or max_active_projects > 0),
  add column if not exists max_branches integer check (max_branches is null or max_branches > 0);

-- ==============================================================================
-- 2. BRANCHES TABLE (MULTI-BRANCH MANAGEMENT)
-- ==============================================================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  address text,
  city text,
  state text,
  phone text,
  email text,
  manager_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Branches
drop trigger if exists trg_branches_updated_at on public.branches;
create trigger trg_branches_updated_at 
  before update on public.branches 
  for each row execute function public.set_updated_at();

create index if not exists ifs_branches_org on public.branches(organization_id);
create index if not exists ifs_branches_manager on public.branches(manager_id);
create index if not exists ifs_branches_active on public.branches(is_active);
create unique index if not exists uq_branches_org_name on public.branches(organization_id, name);

-- Branches RLS
alter table public.branches enable row level security;

drop policy if exists "Tenant access on branches" on public.branches;
create policy "Tenant access on branches"
  on public.branches for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- Database-enforced validation trigger: Ensure branch manager belongs to the same organization
create or replace function public.validate_branch_manager_tenant_integrity()
returns trigger as $$
declare
  v_manager_org uuid;
begin
  if new.manager_id is not null then
    select organization_id into v_manager_org from public.profiles where id = new.manager_id;
    if v_manager_org is null or v_manager_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Branch manager must belong to your organization.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_branch_manager on public.branches;
create trigger trg_validate_branch_manager
  before insert or update on public.branches
  for each row execute function public.validate_branch_manager_tenant_integrity();

-- ==============================================================================
-- 3. ADDITIVE BRANCH_ID ON PROFILES & PROJECTS (NULLABLE)
-- Preserves 100% compatibility with existing production data
-- ==============================================================================
alter table if exists public.profiles
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists ifs_profiles_branch on public.profiles(branch_id);

alter table if exists public.projects
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

create index if not exists ifs_projects_branch on public.projects(branch_id);

-- Database-enforced validation trigger: Ensure profile branch belongs to same organization
create or replace function public.validate_profile_branch_tenant_integrity()
returns trigger as $$
declare
  v_branch_org uuid;
begin
  if new.branch_id is not null then
    select organization_id into v_branch_org from public.branches where id = new.branch_id;
    if v_branch_org is null or v_branch_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Assigned branch does not belong to your organization.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_profile_branch on public.profiles;
create trigger trg_validate_profile_branch
  before insert or update on public.profiles
  for each row execute function public.validate_profile_branch_tenant_integrity();

-- Database-enforced validation trigger: Ensure project branch belongs to same organization
create or replace function public.validate_project_branch_tenant_integrity()
returns trigger as $$
declare
  v_branch_org uuid;
begin
  if new.branch_id is not null then
    select organization_id into v_branch_org from public.branches where id = new.branch_id;
    if v_branch_org is null or v_branch_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Assigned branch does not belong to project organization.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_project_branch on public.projects;
create trigger trg_validate_project_branch
  before insert or update on public.projects
  for each row execute function public.validate_project_branch_tenant_integrity();

-- ==============================================================================
-- 4. CUSTOM ROLES & PERMISSIONS TABLES
-- Additive structure preserving standard roles (owner, admin, designer, supervisor, member)
-- ==============================================================================
create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Custom Roles
drop trigger if exists trg_custom_roles_updated_at on public.custom_roles;
create trigger trg_custom_roles_updated_at 
  before update on public.custom_roles 
  for each row execute function public.set_updated_at();

create index if not exists ifs_custom_roles_org on public.custom_roles(organization_id);
create unique index if not exists uq_custom_roles_org_name on public.custom_roles(organization_id, name);

-- Custom Roles RLS
alter table public.custom_roles enable row level security;

drop policy if exists "Tenant access on custom_roles" on public.custom_roles;
create policy "Tenant access on custom_roles"
  on public.custom_roles for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- Custom Role Permissions Table
create table if not exists public.custom_role_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  custom_role_id uuid not null references public.custom_roles(id) on delete cascade,
  permission_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists ifs_crp_org on public.custom_role_permissions(organization_id);
create index if not exists ifs_crp_role on public.custom_role_permissions(custom_role_id);
create unique index if not exists uq_crp_role_perm on public.custom_role_permissions(custom_role_id, permission_key);

-- Custom Role Permissions RLS
alter table public.custom_role_permissions enable row level security;

drop policy if exists "Tenant access on custom_role_permissions" on public.custom_role_permissions;
create policy "Tenant access on custom_role_permissions"
  on public.custom_role_permissions for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- Cross-tenant validation trigger on custom_role_permissions: Ensure custom_role belongs to same organization
create or replace function public.validate_crp_tenant_integrity()
returns trigger as $$
declare
  v_role_org uuid;
begin
  select organization_id into v_role_org from public.custom_roles where id = new.custom_role_id;
  if v_role_org is null or v_role_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Custom role does not belong to your organization.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_crp_tenant on public.custom_role_permissions;
create trigger trg_validate_crp_tenant
  before insert or update on public.custom_role_permissions
  for each row execute function public.validate_crp_tenant_integrity();

-- Add custom_role_id to profiles (nullable)
alter table if exists public.profiles
  add column if not exists custom_role_id uuid references public.custom_roles(id) on delete set null;

create index if not exists ifs_profiles_custom_role on public.profiles(custom_role_id);

-- Database-enforced validation trigger: Ensure profile's custom_role belongs to same organization
create or replace function public.validate_profile_custom_role_tenant_integrity()
returns trigger as $$
declare
  v_role_org uuid;
begin
  if new.custom_role_id is not null then
    select organization_id into v_role_org from public.custom_roles where id = new.custom_role_id;
    if v_role_org is null or v_role_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Assigned custom role does not belong to your organization.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_profile_custom_role on public.profiles;
create trigger trg_validate_profile_custom_role
  before insert or update on public.profiles
  for each row execute function public.validate_profile_custom_role_tenant_integrity();

-- Database-enforced privilege escalation protection for custom roles
create or replace function public.protect_custom_role_escalation()
returns trigger as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is null or v_caller_role not in ('owner', 'admin') then
    raise exception 'Unauthorized: Only studio owners and admins can configure custom roles and permissions.';
  end if;
  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_protect_custom_role_admin on public.custom_roles;
create trigger trg_protect_custom_role_admin
  before insert or update or delete on public.custom_roles
  for each row execute function public.protect_custom_role_escalation();

drop trigger if exists trg_protect_crp_admin on public.custom_role_permissions;
create trigger trg_protect_crp_admin
  before insert or update or delete on public.custom_role_permissions
  for each row execute function public.protect_custom_role_escalation();

-- ==============================================================================
-- 5. APPROVAL WORKFLOWS TABLE
-- Practical governance layer for Purchase Orders, Expenses, and Financial Commitments
-- ==============================================================================
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('purchase_order', 'expense')),
  entity_id uuid not null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  title text not null,
  description text,
  amount numeric check (amount is null or amount >= 0),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Approval Requests
drop trigger if exists trg_approvals_updated_at on public.approval_requests;
create trigger trg_approvals_updated_at 
  before update on public.approval_requests 
  for each row execute function public.set_updated_at();

create index if not exists ifs_approvals_org on public.approval_requests(organization_id);
create index if not exists ifs_approvals_status on public.approval_requests(status);
create index if not exists ifs_approvals_entity on public.approval_requests(entity_type, entity_id);
create index if not exists ifs_approvals_requester on public.approval_requests(requested_by);
create index if not exists ifs_approvals_assigned on public.approval_requests(assigned_to);

-- Approval Requests RLS
alter table public.approval_requests enable row level security;

drop policy if exists "Tenant access on approval_requests" on public.approval_requests;
create policy "Tenant access on approval_requests"
  on public.approval_requests for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- Database-enforced validation trigger: Complete cross-tenant, entity ownership, and authorization protection
create or replace function public.check_approval_request_org_integrity()
returns trigger as $$
declare
  v_requester_org uuid;
  v_assigned_org uuid;
  v_reviewed_org uuid;
  v_entity_org uuid;
  v_caller_role text;
  v_caller_id uuid;
begin
  v_caller_id := auth.uid();

  -- 1. Immutability & tenant protection on update
  if TG_OP = 'UPDATE' then
    if new.organization_id <> old.organization_id then
      raise exception 'Cross-tenant violation: Cannot change organization of an approval request.';
    end if;

    if old.status in ('approved', 'rejected', 'cancelled') and (
      new.entity_id <> old.entity_id or
      new.entity_type <> old.entity_type or
      new.amount is distinct from old.amount or
      new.requested_by <> old.requested_by
    ) then
      raise exception 'Invalid operation: Cannot modify entity, requester, or amount on an approval request that is already %.', old.status;
    end if;
  end if;

  -- 2. Requester must belong to same organization
  select organization_id into v_requester_org from public.profiles where id = new.requested_by;
  if not found or v_requester_org is null then
    raise exception 'Requester not found: Profile % does not exist.', new.requested_by;
  end if;
  if v_requester_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Requester does not belong to your organization.';
  end if;

  -- 3. Assigned user (if present) must belong to same organization
  if new.assigned_to is not null then
    select organization_id into v_assigned_org from public.profiles where id = new.assigned_to;
    if not found or v_assigned_org is null then
      raise exception 'Assignee not found: Profile % does not exist.', new.assigned_to;
    end if;
    if v_assigned_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Assigned reviewer does not belong to your organization.';
    end if;
  end if;

  -- 4. Reviewer (if present) must belong to same organization
  if new.reviewed_by is not null then
    select organization_id into v_reviewed_org from public.profiles where id = new.reviewed_by;
    if not found or v_reviewed_org is null then
      raise exception 'Reviewer not found: Profile % does not exist.', new.reviewed_by;
    end if;
    if v_reviewed_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Reviewer does not belong to your organization.';
    end if;
  end if;

  -- 5. Entity existence, type validation, and database-level cross-tenant ownership enforcement
  if new.entity_type = 'expense' then
    v_entity_org := null;
    select organization_id into v_entity_org from public.expenses where id = new.entity_id;
    if not found or v_entity_org is null then
      raise exception 'Entity not found: Referenced expense % does not exist.', new.entity_id;
    end if;
    if v_entity_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Referenced expense % does not belong to your organization.', new.entity_id;
    end if;

  elsif new.entity_type = 'purchase_order' then
    v_entity_org := null;
    select organization_id into v_entity_org from public.purchases where id = new.entity_id;
    if not found or v_entity_org is null then
      raise exception 'Entity not found: Referenced purchase order % does not exist.', new.entity_id;
    end if;
    if v_entity_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Referenced purchase order % does not belong to your organization.', new.entity_id;
    end if;

  else
    raise exception 'Unsupported entity type: %. Approval requests only support "expense" and "purchase_order".', new.entity_type;
  end if;

  -- 6. Decision Authorization Protection:
  -- If updating status to approved or rejected, only authorized callers (owner, admin, or assigned_to) can make the decision
  if TG_OP = 'UPDATE' and (new.status in ('approved', 'rejected') and old.status = 'pending') then
    select role into v_caller_role from public.profiles where id = v_caller_id;
    if v_caller_role is null or (v_caller_role not in ('owner', 'admin') and old.assigned_to is distinct from v_caller_id) then
      raise exception 'Unauthorized: Only studio owners, admins, or designated reviewers can approve or reject requests.';
    end if;

    -- Automatically stamp reviewer and timestamp if not already provided
    if new.reviewed_by is null then
      new.reviewed_by := v_caller_id;
    end if;
    if new.reviewed_at is null then
      new.reviewed_at := now();
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Maintain validate_approval_request_integrity as a compatible trigger wrapper
create or replace function public.validate_approval_request_integrity()
returns trigger as $$
begin
  return public.check_approval_request_org_integrity();
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_approval_request on public.approval_requests;
create trigger trg_validate_approval_request
  before insert or update on public.approval_requests
  for each row execute function public.check_approval_request_org_integrity();

-- ==============================================================================
-- 6. SECURE RPC: review_approval_request
-- Atomic decision execution with database authorization and auditing
-- ==============================================================================
create or replace function public.review_approval_request(
  p_request_id uuid,
  p_decision text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
  v_caller_id uuid;
  v_caller_role text;
  v_req record;
begin
  -- 1. Verify caller
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Unauthorized: Authentication required.';
  end if;

  v_org_id := public.current_user_org_id();
  if v_org_id is null then
    raise exception 'Unauthorized: No active organization found.';
  end if;

  -- 2. Validate decision input
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Validation error: Decision must be either "approved" or "rejected".';
  end if;

  -- 3. Retrieve request
  select * into v_req from public.approval_requests 
  where id = p_request_id and organization_id = v_org_id;

  if v_req.id is null then
    raise exception 'Not found: Approval request does not exist in your organization.';
  end if;

  if v_req.status <> 'pending' then
    raise exception 'Invalid operation: Approval request is already %.', v_req.status;
  end if;

  -- 4. Check reviewer role authorization
  select role into v_caller_role from public.profiles where id = v_caller_id;
  if v_caller_role is null or (v_caller_role not in ('owner', 'admin') and v_req.assigned_to is distinct from v_caller_id) then
    raise exception 'Unauthorized: Only studio owners, admins, or designated reviewers can decide on approvals.';
  end if;

  -- 5. Update approval request record
  update public.approval_requests
  set
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = v_caller_id,
    review_notes = p_notes,
    updated_at = now()
  where id = p_request_id and organization_id = v_org_id;

  return json_build_object(
    'success', true,
    'id', p_request_id,
    'status', p_decision,
    'reviewed_by', v_caller_id,
    'reviewed_at', now()
  );
end;
$$;

-- Revoke all permissions from public/anon and grant execute solely to authenticated users
revoke all on function public.review_approval_request(uuid, text, text) from public;
revoke all on function public.review_approval_request(uuid, text, text) from anon;
grant execute on function public.review_approval_request(uuid, text, text) to authenticated;
