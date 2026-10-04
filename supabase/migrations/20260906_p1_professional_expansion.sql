-- ==============================================================================
-- APNI ESTATE INTERIORS - PHASE P1: PROFESSIONAL PLAN EXPANSION
-- Non-destructive, additive migration for Vendors, Client Payments, Purchases & Atomic Procurement
-- ==============================================================================

-- 1. Additive column on Expenses: vendor_id (preserving existing free-text vendor)
alter table if exists public.expenses
  add column if not exists vendor_id uuid;

-- ==============================================================================
-- 2. VENDORS TABLE (SUPPLIERS, CONTRACTORS, FABRICATORS)
-- ==============================================================================
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  category text not null default 'Materials' check (category in (
    'Materials', 'Furniture', 'Electrical', 'Plumbing', 'Civil', 
    'Hardware', 'Fabric', 'Lighting', 'Glass', 'Paint', 'Other'
  )),
  gst_number text,
  rating numeric default 5 check (rating >= 1 and rating <= 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Foreign key on expenses -> vendors
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_expenses_vendor_id' and table_name = 'expenses'
  ) then
    alter table public.expenses
      add constraint fk_expenses_vendor_id foreign key (vendor_id) references public.vendors(id) on delete set null;
  end if;
end $$;

-- Triggers & Indexes for Vendors
drop trigger if exists trg_vendors_updated_at on public.vendors;
create trigger trg_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();

create index if not exists ifs_vendors_org on public.vendors(organization_id);
create index if not exists ifs_vendors_category on public.vendors(category);
create index if not exists ifs_expenses_vendor_id on public.expenses(vendor_id);

-- Vendors RLS
alter table public.vendors enable row level security;

drop policy if exists "Tenant access on vendors" on public.vendors;
create policy "Tenant access on vendors"
  on public.vendors for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 3. CLIENT PAYMENTS TABLE (SCHEDULED & RECEIVED CLIENT REVENUE)
-- ==============================================================================
create table if not exists public.client_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  amount numeric not null check (amount >= 0),
  due_date date not null default current_date,
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  paid_date date,
  status text not null default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'overdue')),
  payment_method text,
  payment_reference text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Client Payments
drop trigger if exists trg_client_payments_updated_at on public.client_payments;
create trigger trg_client_payments_updated_at before update on public.client_payments for each row execute function public.set_updated_at();

create index if not exists ifs_client_payments_org on public.client_payments(organization_id);
create index if not exists ifs_client_payments_project on public.client_payments(project_id);
create index if not exists ifs_client_payments_client on public.client_payments(client_id);
create index if not exists ifs_client_payments_status on public.client_payments(status);
create index if not exists ifs_client_payments_due on public.client_payments(due_date);

-- Client Payments RLS
alter table public.client_payments enable row level security;

drop policy if exists "Tenant access on client_payments" on public.client_payments;
create policy "Tenant access on client_payments"
  on public.client_payments for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 4. PURCHASES TABLE (PURCHASE ORDERS & PROCUREMENT)
-- ==============================================================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  po_number text not null,
  order_date date not null default current_date,
  expected_delivery date,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'partially_received', 'received', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'partially_paid', 'paid')),
  notes text,
  total_amount numeric not null default 0 check (total_amount >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Purchases
drop trigger if exists trg_purchases_updated_at on public.purchases;
create trigger trg_purchases_updated_at before update on public.purchases for each row execute function public.set_updated_at();

create index if not exists ifs_purchases_org on public.purchases(organization_id);
create index if not exists ifs_purchases_project on public.purchases(project_id);
create index if not exists ifs_purchases_vendor on public.purchases(vendor_id);
create index if not exists ifs_purchases_status on public.purchases(status);
create index if not exists ifs_purchases_date on public.purchases(order_date);
create unique index if not exists uq_purchases_org_po on public.purchases(organization_id, po_number);

-- Purchases RLS
alter table public.purchases enable row level security;

drop policy if exists "Tenant access on purchases" on public.purchases;
create policy "Tenant access on purchases"
  on public.purchases for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 5. PURCHASE ITEMS TABLE (LINE ITEMS & DERIVED TOTALS)
-- ==============================================================================
create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  item_name text not null,
  description text,
  quantity numeric not null default 1 check (quantity > 0),
  unit text not null default 'pcs',
  rate numeric not null default 0 check (rate >= 0),
  total numeric not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Triggers & Indexes for Purchase Items
drop trigger if exists trg_purchase_items_updated_at on public.purchase_items;
create trigger trg_purchase_items_updated_at before update on public.purchase_items for each row execute function public.set_updated_at();

-- Database-enforced line item total calculation trigger (guarantees total = quantity * rate for all writes)
create or replace function public.calculate_purchase_item_total()
returns trigger as $$
begin
  if new.quantity is null or new.quantity <= 0 then
    raise exception 'Validation error: Quantity must be strictly greater than zero.';
  end if;
  if new.rate is null or new.rate < 0 then
    raise exception 'Validation error: Rate cannot be negative.';
  end if;
  new.total := round(new.quantity * new.rate, 2);
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_calculate_purchase_item_total on public.purchase_items;
create trigger trg_calculate_purchase_item_total
  before insert or update on public.purchase_items
  for each row execute function public.calculate_purchase_item_total();

create index if not exists ifs_purchase_items_org on public.purchase_items(organization_id);
create index if not exists ifs_purchase_items_purchase on public.purchase_items(purchase_id);

-- Purchase Items RLS
alter table public.purchase_items enable row level security;

drop policy if exists "Tenant access on purchase_items" on public.purchase_items;
create policy "Tenant access on purchase_items"
  on public.purchase_items for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

-- ==============================================================================
-- 6. CROSS-TENANT RELATIONSHIP INTEGRITY VALIDATION TRIGGERS
-- Ensures child and related foreign keys belong strictly to the same organization_id
-- ==============================================================================

-- 6.1 Validate Client Payment relationships
create or replace function public.validate_client_payment_tenant_integrity()
returns trigger as $$
declare
  v_proj_org uuid;
  v_client_org uuid;
begin
  -- Validate Project belongs to same org
  select organization_id into v_proj_org from public.projects where id = new.project_id;
  if v_proj_org is null or v_proj_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Project does not belong to your organization.';
  end if;

  -- Validate Client (if specified) belongs to same org
  if new.client_id is not null then
    select organization_id into v_client_org from public.clients where id = new.client_id;
    if v_client_org is null or v_client_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Client does not belong to your organization.';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_client_payment_tenant on public.client_payments;
create trigger trg_validate_client_payment_tenant
  before insert or update on public.client_payments
  for each row execute function public.validate_client_payment_tenant_integrity();

-- 6.2 Validate Purchase relationships
create or replace function public.validate_purchase_tenant_integrity()
returns trigger as $$
declare
  v_proj_org uuid;
  v_vendor_org uuid;
begin
  -- Validate Project belongs to same org
  select organization_id into v_proj_org from public.projects where id = new.project_id;
  if v_proj_org is null or v_proj_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Project does not belong to your organization.';
  end if;

  -- Validate Vendor belongs to same org
  select organization_id into v_vendor_org from public.vendors where id = new.vendor_id;
  if v_vendor_org is null or v_vendor_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Vendor does not belong to your organization.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_purchase_tenant on public.purchases;
create trigger trg_validate_purchase_tenant
  before insert or update on public.purchases
  for each row execute function public.validate_purchase_tenant_integrity();

-- 6.3 Validate Purchase Item relationships
create or replace function public.validate_purchase_item_tenant_integrity()
returns trigger as $$
declare
  v_purchase_org uuid;
begin
  -- Validate parent Purchase belongs to same org
  select organization_id into v_purchase_org from public.purchases where id = new.purchase_id;
  if v_purchase_org is null or v_purchase_org <> new.organization_id then
    raise exception 'Cross-tenant violation: Purchase Order does not belong to your organization.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_purchase_item_tenant on public.purchase_items;
create trigger trg_validate_purchase_item_tenant
  before insert or update on public.purchase_items
  for each row execute function public.validate_purchase_item_tenant_integrity();

-- 6.4 Validate Expense Vendor relationship (if vendor_id provided)
create or replace function public.validate_expense_vendor_tenant_integrity()
returns trigger as $$
declare
  v_vendor_org uuid;
begin
  if new.vendor_id is not null then
    select organization_id into v_vendor_org from public.vendors where id = new.vendor_id;
    if v_vendor_org is null or v_vendor_org <> new.organization_id then
      raise exception 'Cross-tenant violation: Vendor does not belong to your organization.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_validate_expense_vendor_tenant on public.expenses;
create trigger trg_validate_expense_vendor_tenant
  before insert or update on public.expenses
  for each row execute function public.validate_expense_vendor_tenant_integrity();

-- ==============================================================================
-- 7. ATOMIC TRANSACTIONAL PURCHASE RPC
-- Ensures header + all items are written atomically and server calculates total_amount
-- ==============================================================================
create or replace function public.save_purchase_order_atomic(
  p_purchase jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
  v_purchase_id uuid;
  v_existing_org uuid;
  v_proj_org uuid;
  v_vendor_org uuid;
  v_is_update boolean := false;
  v_item record;
  v_calculated_total numeric := 0;
  v_item_total numeric := 0;
  v_quantity numeric;
  v_rate numeric;
begin
  -- 1. Authenticate caller and retrieve tenant organization
  v_org_id := public.current_user_org_id();
  if v_org_id is null then
    raise exception 'Unauthorized: No active organization profile found.';
  end if;

  -- 2. Validate and authorize purchase ID (if updating existing purchase)
  if p_purchase ? 'id' and (p_purchase->>'id') is not null and (p_purchase->>'id') <> '' then
    begin
      v_purchase_id := (p_purchase->>'id')::uuid;
    exception when others then
      raise exception 'Invalid format: Purchase ID must be a valid UUID.';
    end;

    -- Look up existing purchase ownership
    select organization_id into v_existing_org from public.purchases where id = v_purchase_id;
    if v_existing_org is null then
      raise exception 'Invalid operation: Specified purchase order does not exist.';
    end if;
    if v_existing_org <> v_org_id then
      raise exception 'Unauthorized: Purchase order does not belong to your organization.';
    end if;
    v_is_update := true;
  else
    v_purchase_id := gen_random_uuid();
    v_is_update := false;
  end if;

  -- 3. Verify Project and Vendor belong to authenticated organization before any mutation
  if (p_purchase->>'project_id') is null or (p_purchase->>'vendor_id') is null then
    raise exception 'Validation error: Project ID and Vendor ID are required.';
  end if;

  select organization_id into v_proj_org from public.projects where id = (p_purchase->>'project_id')::uuid;
  if v_proj_org is null or v_proj_org <> v_org_id then
    raise exception 'Cross-tenant violation: Project does not belong to your organization.';
  end if;

  select organization_id into v_vendor_org from public.vendors where id = (p_purchase->>'vendor_id')::uuid;
  if v_vendor_org is null or v_vendor_org <> v_org_id then
    raise exception 'Cross-tenant violation: Vendor does not belong to your organization.';
  end if;

  -- 4. Upsert / Update Purchase Header
  if v_is_update then
    update public.purchases
    set
      project_id = (p_purchase->>'project_id')::uuid,
      vendor_id = (p_purchase->>'vendor_id')::uuid,
      po_number = coalesce(p_purchase->>'po_number', po_number),
      order_date = coalesce((p_purchase->>'order_date')::date, order_date),
      expected_delivery = (p_purchase->>'expected_delivery')::date,
      status = coalesce(p_purchase->>'status', status),
      payment_status = coalesce(p_purchase->>'payment_status', payment_status),
      notes = p_purchase->>'notes',
      updated_at = now()
    where id = v_purchase_id and organization_id = v_org_id;
  else
    insert into public.purchases (
      id,
      organization_id,
      project_id,
      vendor_id,
      po_number,
      order_date,
      expected_delivery,
      status,
      payment_status,
      notes,
      total_amount,
      created_by
    ) values (
      v_purchase_id,
      v_org_id,
      (p_purchase->>'project_id')::uuid,
      (p_purchase->>'vendor_id')::uuid,
      coalesce(p_purchase->>'po_number', 'PO-' || to_char(now(), 'YYYYMMDD-HH24MISS')),
      coalesce((p_purchase->>'order_date')::date, current_date),
      (p_purchase->>'expected_delivery')::date,
      coalesce(p_purchase->>'status', 'draft'),
      coalesce(p_purchase->>'payment_status', 'pending'),
      p_purchase->>'notes',
      0,
      auth.uid()
    );
  end if;

  -- 5. Delete and replace line items atomically (ownership verified)
  delete from public.purchase_items 
  where purchase_id = v_purchase_id and organization_id = v_org_id;

  if p_items is not null and jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
    for v_item in select * from jsonb_to_recordset(p_items) as x(
      item_name text,
      description text,
      quantity numeric,
      unit text,
      rate numeric
    )
    loop
      v_quantity := coalesce(v_item.quantity, 1);
      v_rate := coalesce(v_item.rate, 0);

      if v_quantity <= 0 or v_rate < 0 then
        raise exception 'Validation error: Line item quantity must be strictly > 0 and rate >= 0.';
      end if;

      v_item_total := round(v_quantity * v_rate, 2);
      v_calculated_total := v_calculated_total + v_item_total;

      insert into public.purchase_items (
        organization_id,
        purchase_id,
        item_name,
        description,
        quantity,
        unit,
        rate,
        total
      ) values (
        v_org_id,
        v_purchase_id,
        coalesce(v_item.item_name, 'Material Item'),
        v_item.description,
        v_quantity,
        coalesce(v_item.unit, 'pcs'),
        v_rate,
        v_item_total
      );
    end loop;
  end if;

  -- 6. Update purchase header with authoritative server-calculated total
  update public.purchases
  set total_amount = v_calculated_total
  where id = v_purchase_id and organization_id = v_org_id;

  -- 7. Return composite result
  return json_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'total_amount', v_calculated_total
  );
end;
$$;

-- Explicitly revoke from public/anon and grant execute solely to authenticated users
revoke all on function public.save_purchase_order_atomic(jsonb, jsonb) from public;
revoke all on function public.save_purchase_order_atomic(jsonb, jsonb) from anon;
grant execute on function public.save_purchase_order_atomic(jsonb, jsonb) to authenticated;
