-- ==============================================================================
-- APNI ESTATE INTERIORS - PHASE P0: BASIC EXPANSION & ENTITLEMENTS FOUNDATION
-- Non-destructive, additive migration for Leads, Tasks, Documents & Storage
-- ==============================================================================

-- 1. Extend Organizations Plan Tier Check Constraint safely
alter table public.organizations drop constraint if exists organizations_plan_check;
alter table public.organizations add constraint organizations_plan_check 
  check (plan in ('starter', 'studio', 'pro', 'basic', 'professional', 'enterprise'));

-- 2. Extend Profiles Role Check Constraint safely & enforce privilege escalation protection
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('owner', 'designer', 'supervisor', 'admin', 'member'));

create or replace function public.prevent_self_role_escalation()
returns trigger as $$
declare
  v_caller_role text;
begin
  -- If role is not being modified, allow regular profile updates (e.g. name, phone, avatar)
  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Check the authenticated caller's profile role
  select role into v_caller_role
  from public.profiles
  where id = auth.uid();

  -- Only owners and admins can modify roles
  if v_caller_role is null or v_caller_role not in ('owner', 'admin') then
    raise exception 'Unauthorized: Only studio owners and admins can modify team roles.';
  end if;

  -- Protect owner role: Only existing owners can assign or modify the owner role
  if (old.role = 'owner' or new.role = 'owner') and v_caller_role <> 'owner' then
    raise exception 'Unauthorized: Only studio owners can assign or modify the owner role.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_self_role_escalation();

-- 3. Additive columns for Organization Settings
alter table public.organizations 
  add column if not exists logo_url text,
  add column if not exists gst_number text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists pincode text;

-- ==============================================================================
-- 3. LEADS TABLE (SALES CRM)
-- ==============================================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  source text default 'Instagram',
  requirement text,
  estimated_budget numeric default 0 check (estimated_budget >= 0),
  status text not null default 'new' check (status in ('new', 'contacted', 'site_visit_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost')),
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  converted_client_id uuid references public.clients(id) on delete set null,
  converted_project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Leads
drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();

create index if not exists ifs_leads_org on public.leads(organization_id);
create index if not exists ifs_leads_status on public.leads(status);
create index if not exists ifs_leads_assigned on public.leads(assigned_to);

-- Leads RLS
alter table public.leads enable row level security;

drop policy if exists "Tenant access on leads" on public.leads;
create policy "Tenant access on leads"
  on public.leads for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 4. TASKS TABLE (TEAM & PROJECT TASK ASSIGNMENTS)
-- ==============================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Tasks
drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create index if not exists ifs_tasks_org on public.tasks(organization_id);
create index if not exists ifs_tasks_project on public.tasks(project_id);
create index if not exists ifs_tasks_assigned on public.tasks(assigned_to);
create index if not exists ifs_tasks_status on public.tasks(status);

-- Tasks RLS
alter table public.tasks enable row level security;

drop policy if exists "Tenant access on tasks" on public.tasks;
create policy "Tenant access on tasks"
  on public.tasks for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 5. DOCUMENTS TABLE (CENTRAL BLUEPRINT & CONTRACT VAULT)
-- ==============================================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  category text not null default 'Contract' check (category in ('Proposal', 'Contract', 'Moodboard', 'Drawing', 'Estimate', 'Site Plan', 'Invoice', 'Other')),
  file_name text not null,
  file_size integer not null default 0,
  file_type text,
  storage_path text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Documents
drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

create index if not exists ifs_documents_org on public.documents(organization_id);
create index if not exists ifs_documents_project on public.documents(project_id);
create index if not exists ifs_documents_category on public.documents(category);

-- Documents RLS
alter table public.documents enable row level security;

drop policy if exists "Tenant access on documents" on public.documents;
create policy "Tenant access on documents"
  on public.documents for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 6. PRIVATE STORAGE BUCKET & RLS POLICIES FOR DOCUMENTS
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  26214400, -- 25 MB limit
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/acad',
    'application/x-dwg',
    'application/dxf',
    'image/vnd.dwg'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400;

-- Storage Policies
drop policy if exists "Tenant Select Documents" on storage.objects;
create policy "Tenant Select Documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );

drop policy if exists "Tenant Insert Documents" on storage.objects;
create policy "Tenant Insert Documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );

drop policy if exists "Tenant Delete Documents" on storage.objects;
create policy "Tenant Delete Documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (public.current_user_org_id())::text
  );
