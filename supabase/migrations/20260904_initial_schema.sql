-- ==============================================================================
-- APNI ESTATE INTERIORS - SUPABASE INITIAL DATABASE SCHEMA & MULTI-TENANCY RLS
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- 2.1 Organizations (Tenants)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid, -- Linked to auth.users after profile creation
  subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'expired', 'cancelled')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '15 days'),
  plan text default 'studio' check (plan in ('starter', 'studio', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 Profiles (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  role text not null default 'owner' check (role in ('owner', 'designer', 'supervisor')),
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.3 Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  location text,
  project_type text default 'residential' check (project_type in ('residential', 'commercial', 'hospitality', 'retail', 'other')),
  budget numeric not null default 0 check (budget >= 0),
  contract_value numeric check (contract_value is null or contract_value >= 0),
  start_date date,
  deadline date,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  status text not null default 'on_track' check (status in ('on_track', 'needs_attention', 'budget_alert', 'delayed', 'completed')),
  description text,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.5 Rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  room_type text,
  budget numeric not null default 0 check (budget >= 0),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.6 BOQ Items
create table if not exists public.boq_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  item_name text not null,
  description text,
  category text,
  quantity numeric not null default 1 check (quantity >= 0),
  unit text default 'units',
  rate numeric not null default 0 check (rate >= 0),
  estimated_cost numeric not null default 0 check (estimated_cost >= 0),
  actual_cost numeric check (actual_cost is null or actual_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.7 Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  category text not null,
  amount numeric not null check (amount >= 0),
  vendor text,
  expense_date date not null default current_date,
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'partially_paid')),
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.8 Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  category text,
  unit text default 'pcs',
  quantity_ordered numeric not null default 0 check (quantity_ordered >= 0),
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.9 Material Transactions (In/Out site tracking)
create table if not exists public.material_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  transaction_type text not null check (transaction_type in ('in', 'out')),
  quantity numeric not null check (quantity > 0),
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- 2.10 Milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'delayed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.11 Daily Updates / DPR
create table if not exists public.daily_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  update_date date not null default current_date,
  work_completed text,
  work_pending text,
  issues text,
  next_day_tasks text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.12 Project Photos
create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  daily_update_id uuid references public.daily_updates(id) on delete set null,
  category text default 'site_progress',
  caption text,
  storage_path text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2.13 Calendar Events
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  event_type text default 'site_visit',
  event_date timestamptz not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 3. APPLY UPDATED_AT TRIGGERS
-- ==============================================================================
create trigger trg_organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
create trigger trg_boq_items_updated_at before update on public.boq_items for each row execute function public.set_updated_at();
create trigger trg_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger trg_materials_updated_at before update on public.materials for each row execute function public.set_updated_at();
create trigger trg_milestones_updated_at before update on public.milestones for each row execute function public.set_updated_at();
create trigger trg_daily_updates_updated_at before update on public.daily_updates for each row execute function public.set_updated_at();
create trigger trg_calendar_events_updated_at before update on public.calendar_events for each row execute function public.set_updated_at();

-- ==============================================================================
-- 4. PERFORMANCE & FOREIGN KEY INDEXES
-- ==============================================================================
create index ifs_profiles_org on public.profiles(organization_id);
create index ifs_clients_org on public.clients(organization_id);
create index ifs_projects_org on public.projects(organization_id);
create index ifs_projects_client on public.projects(client_id);
create index ifs_rooms_project on public.rooms(project_id);
create index ifs_rooms_org on public.rooms(organization_id);
create index ifs_boq_project on public.boq_items(project_id);
create index ifs_boq_room on public.boq_items(room_id);
create index ifs_expenses_project on public.expenses(project_id);
create index ifs_expenses_org on public.expenses(organization_id);
create index ifs_expenses_date on public.expenses(expense_date);
create index ifs_materials_project on public.materials(project_id);
create index ifs_mat_tx_mat on public.material_transactions(material_id);
create index ifs_mat_tx_project on public.material_transactions(project_id);
create index ifs_milestones_project on public.milestones(project_id);
create index ifs_daily_updates_project on public.daily_updates(project_id);
create index ifs_project_photos_project on public.project_photos(project_id);
create index ifs_calendar_events_org_date on public.calendar_events(organization_id, event_date);
create index ifs_org_trial_ends on public.organizations(trial_ends_at);

-- ==============================================================================
-- 5. SECURE RLS HELPER FUNCTION (Prevents Recursive Policy Queries)
-- ==============================================================================
create or replace function public.current_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$;

-- ==============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================

-- Enable RLS on all tenant tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.boq_items enable row level security;
alter table public.expenses enable row level security;
alter table public.materials enable row level security;
alter table public.material_transactions enable row level security;
alter table public.milestones enable row level security;
alter table public.daily_updates enable row level security;
alter table public.project_photos enable row level security;
alter table public.calendar_events enable row level security;

-- 6.1 Organizations Policies
create policy "Users can view their own organization"
  on public.organizations for select
  using (id = public.current_user_org_id());

create policy "Organization owners can update their organization"
  on public.organizations for update
  using (id = public.current_user_org_id());

-- 6.2 Profiles Policies
create policy "Users can view profiles in their organization"
  on public.profiles for select
  using (organization_id = public.current_user_org_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- 6.3 Clients Policies
create policy "Tenant access on clients"
  on public.clients for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.4 Projects Policies
create policy "Tenant access on projects"
  on public.projects for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.5 Rooms Policies
create policy "Tenant access on rooms"
  on public.rooms for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.6 BOQ Items Policies
create policy "Tenant access on boq_items"
  on public.boq_items for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.7 Expenses Policies
create policy "Tenant access on expenses"
  on public.expenses for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.8 Materials Policies
create policy "Tenant access on materials"
  on public.materials for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.9 Material Transactions Policies
create policy "Tenant access on material_transactions"
  on public.material_transactions for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.10 Milestones Policies
create policy "Tenant access on milestones"
  on public.milestones for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.11 Daily Updates Policies
create policy "Tenant access on daily_updates"
  on public.daily_updates for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.12 Project Photos Policies
create policy "Tenant access on project_photos"
  on public.project_photos for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- 6.13 Calendar Events Policies
create policy "Tenant access on calendar_events"
  on public.calendar_events for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 7. ATOMIC SIGNUP & TRIAL BOOTSTRAP RPC FUNCTION
-- ==============================================================================
create or replace function public.create_trial_organization(
  org_name text,
  full_name text,
  phone text default null,
  plan_name text default 'studio'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_org_id uuid;
  v_trial_start timestamptz := now();
  v_trial_end timestamptz := now() + interval '15 days';
begin
  -- Grab authenticated user ID from context
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: User must be signed in to create an organization.';
  end if;

  -- 1. Create Organization with 15-day Trial
  insert into public.organizations (
    name,
    owner_user_id,
    subscription_status,
    trial_started_at,
    trial_ends_at,
    plan
  ) values (
    coalesce(nullif(trim(org_name), ''), 'My Interior Studio'),
    v_user_id,
    'trial',
    v_trial_start,
    v_trial_end,
    coalesce(plan_name, 'studio')
  ) returning id into v_org_id;

  -- 2. Create / Upsert Profile as Owner
  insert into public.profiles (
    id,
    organization_id,
    full_name,
    role,
    phone
  ) values (
    v_user_id,
    v_org_id,
    coalesce(nullif(trim(full_name), ''), 'Studio Owner'),
    'owner',
    phone
  )
  on conflict (id) do update set
    organization_id = v_org_id,
    full_name = excluded.full_name,
    phone = excluded.phone,
    role = 'owner';

  -- Return created tenant payload
  return json_build_object(
    'organization_id', v_org_id,
    'user_id', v_user_id,
    'plan', plan_name,
    'trial_ends_at', v_trial_end
  );
end;
$$;

-- Grant execution permission to authenticated users
grant execute on function public.create_trial_organization to authenticated;

-- ==============================================================================
-- 8. STORAGE BUCKET PREPARATION & RLS (For Receipts, Photos, Documents)
-- ==============================================================================
-- Storage buckets can be created in the Supabase Dashboard:
-- 1. 'receipts' (Private)
-- 2. 'project-photos' (Private or Public with cache)
-- 3. 'documents' (Private)
--
-- Tenant-scoped storage path convention: "<organization_id>/<project_id>/<filename>"
