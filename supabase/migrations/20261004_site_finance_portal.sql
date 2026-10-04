-- Contractor bill controls, material wastage audit, and secure read-only client portal.

create table if not exists public.contractor_bills (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  boq_item_id uuid not null references public.boq_items(id) on delete restrict,
  invoice_number text not null,
  invoice_date date not null default current_date,
  billed_quantity numeric not null check (billed_quantity > 0),
  billed_rate numeric not null check (billed_rate > 0),
  amount numeric not null check (amount > 0),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'rejected', 'paid')),
  decision_comment text,
  expense_id uuid references public.expenses(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contractor_bill_amount_matches_qty check (
    abs(amount - billed_quantity * billed_rate) < 0.01
  )
);

create unique index if not exists idx_contractor_bills_unique_invoice
  on public.contractor_bills (organization_id, vendor_id, lower(trim(invoice_number)));
create index if not exists idx_contractor_bills_project
  on public.contractor_bills (organization_id, project_id, created_at desc);

drop trigger if exists trg_contractor_bills_updated_at on public.contractor_bills;
create trigger trg_contractor_bills_updated_at
  before update on public.contractor_bills
  for each row execute function public.set_updated_at();

alter table public.contractor_bills enable row level security;
drop policy if exists "Tenant read contractor bills" on public.contractor_bills;
create policy "Tenant read contractor bills" on public.contractor_bills
  for select using (organization_id = public.current_user_org_id());
drop policy if exists "Tenant create contractor bill drafts" on public.contractor_bills;
create policy "Tenant create contractor bill drafts" on public.contractor_bills
  for insert with check (
    organization_id = public.current_user_org_id()
    and status = 'draft'
    and created_by = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = contractor_bills.project_id
        and p.organization_id = contractor_bills.organization_id
    )
    and exists (
      select 1 from public.vendors v
      where v.id = contractor_bills.vendor_id
        and v.organization_id = contractor_bills.organization_id
    )
    and exists (
      select 1 from public.boq_items b
      where b.id = contractor_bills.boq_item_id
        and b.project_id = contractor_bills.project_id
        and b.organization_id = contractor_bills.organization_id
        and b.approved_at is not null
    )
  );

create table if not exists public.contractor_bill_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contractor_bill_id uuid not null references public.contractor_bills(id) on delete cascade,
  action text not null,
  previous_status text,
  new_status text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  comment text,
  created_at timestamptz not null default now()
);
create index if not exists idx_contractor_bill_events_parent
  on public.contractor_bill_events (contractor_bill_id, created_at);
alter table public.contractor_bill_events enable row level security;
drop policy if exists "Tenant read contractor bill events" on public.contractor_bill_events;
create policy "Tenant read contractor bill events" on public.contractor_bill_events
  for select using (organization_id = public.current_user_org_id());

create or replace function public.audit_contractor_bill_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_name text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select full_name into v_actor_name from public.profiles where id = auth.uid();
  insert into public.contractor_bill_events (
    organization_id, contractor_bill_id, action, previous_status, new_status,
    actor_id, actor_name, comment
  ) values (
    new.organization_id, new.id,
    case when tg_op = 'INSERT' then 'created' else new.status end,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status, auth.uid(),
    coalesce(v_actor_name, 'Team member'),
    case when tg_op = 'UPDATE' and new.decision_comment is distinct from old.decision_comment
      then new.decision_comment else null end
  );
  return new;
end;
$$;
drop trigger if exists trg_audit_contractor_bill_change on public.contractor_bills;
create trigger trg_audit_contractor_bill_change
  after insert or update on public.contractor_bills
  for each row execute function public.audit_contractor_bill_change();

create or replace function public.transition_contractor_bill(
  p_bill_id uuid,
  p_action text,
  p_comment text default null
)
returns public.contractor_bills
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bill public.contractor_bills%rowtype;
  v_boq public.boq_items%rowtype;
  v_role text;
  v_baseline_rate numeric;
  v_prior_quantity numeric;
  v_expense_id uuid;
  v_new_status text;
begin
  select b.role into v_role
  from public.profiles b
  where b.id = auth.uid()
    and b.organization_id = public.current_user_org_id();

  select * into v_bill
  from public.contractor_bills
  where id = p_bill_id
    and organization_id = public.current_user_org_id()
  for update;
  if not found then raise exception 'Contractor bill not found.'; end if;

  if p_action = 'submit' and v_bill.status = 'draft' then
    if nullif(trim(v_bill.invoice_number), '') is null then
      raise exception 'An invoice number is required before submission.';
    end if;
    select * into v_boq
    from public.boq_items
    where id = v_bill.boq_item_id
      and project_id = v_bill.project_id
      and organization_id = v_bill.organization_id
    for update;
    if not found or v_boq.approved_at is null then
      raise exception 'The bill must reference an approved BOQ item in this project.';
    end if;
    v_baseline_rate := case
      when v_boq.material_rate is not null or v_boq.labour_rate is not null
        then coalesce(v_boq.material_rate, 0) + coalesce(v_boq.labour_rate, 0)
      else v_boq.rate
    end;
    if v_baseline_rate <= 0 or v_bill.billed_rate > v_baseline_rate * 1.10 then
      raise exception 'Billed rate exceeds the BOQ cost rate by more than the 10%% validation tolerance.';
    end if;
    select coalesce(sum(billed_quantity), 0) into v_prior_quantity
    from public.contractor_bills
    where boq_item_id = v_bill.boq_item_id
      and id <> v_bill.id
      and status in ('submitted', 'approved', 'paid');
    if v_prior_quantity + v_bill.billed_quantity > v_boq.quantity then
      raise exception 'Cumulative submitted and approved bills cannot exceed the approved BOQ quantity (%).',
        v_boq.quantity;
    end if;
    v_new_status := 'submitted';
  elsif p_action in ('approve', 'reject') and v_bill.status = 'submitted' then
    if v_role is null or v_role not in ('owner', 'admin', 'supervisor') then
      raise exception 'Only an owner, admin, or supervisor can review contractor bills.';
    end if;
    if p_action = 'reject' and nullif(trim(p_comment), '') is null then
      raise exception 'A reason is required when rejecting a contractor bill.';
    end if;
    if p_action = 'approve' then
      insert into public.expenses (
        organization_id, project_id, vendor_id, title, category, amount, vendor,
        expense_date, payment_status, notes
      ) values (
        v_bill.organization_id, v_bill.project_id, v_bill.vendor_id,
        'Contractor bill ' || v_bill.invoice_number, 'Labour', v_bill.amount,
        (select name from public.vendors where id = v_bill.vendor_id),
        v_bill.invoice_date, 'pending',
        'Approved contractor bill; bill id: ' || v_bill.id::text
      ) returning id into v_expense_id;
      v_new_status := 'approved';
    else
      v_new_status := 'rejected';
    end if;
  elsif p_action = 'mark_paid' and v_bill.status = 'approved' then
    if v_role is null or v_role not in ('owner', 'admin') then
      raise exception 'Only an owner or admin can mark a contractor bill as paid.';
    end if;
    if v_bill.expense_id is null then
      raise exception 'The approved contractor bill has no linked expense to mark as paid.';
    end if;
    update public.expenses
    set payment_status = 'paid'
    where id = v_bill.expense_id;
    v_new_status := 'paid';
  else
    raise exception 'Action % is not allowed for a bill in status %.', p_action, v_bill.status;
  end if;

  update public.contractor_bills
  set status = v_new_status,
      decision_comment = case when p_action in ('approve', 'reject') then nullif(trim(p_comment), '') else decision_comment end,
      expense_id = coalesce(v_expense_id, expense_id)
  where id = v_bill.id
  returning * into v_bill;
  return v_bill;
end;
$$;

revoke all on function public.transition_contractor_bill(uuid, text, text) from public;
grant execute on function public.transition_contractor_bill(uuid, text, text) to authenticated;

create table if not exists public.material_wastage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete restrict,
  material_transaction_id uuid not null unique references public.material_transactions(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  reason text not null,
  wastage_date date not null default current_date,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_material_wastage_project
  on public.material_wastage (organization_id, project_id, wastage_date desc);
alter table public.material_wastage enable row level security;
drop policy if exists "Tenant read material wastage" on public.material_wastage;
create policy "Tenant read material wastage" on public.material_wastage
  for select using (organization_id = public.current_user_org_id());

create or replace function public.record_material_wastage(
  p_material_id uuid,
  p_quantity numeric,
  p_reason text,
  p_wastage_date date default current_date
)
returns public.material_wastage
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_material public.materials%rowtype;
  v_available numeric;
  v_transaction_id uuid;
  v_wastage public.material_wastage%rowtype;
  v_role text;
begin
  select role into v_role from public.profiles
  where id = auth.uid() and organization_id = public.current_user_org_id();
  if v_role is null or v_role not in ('owner', 'admin', 'supervisor') then
    raise exception 'Only an owner, admin, or supervisor can record material wastage.';
  end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Wastage quantity must be greater than zero.'; end if;
  if nullif(trim(p_reason), '') is null then raise exception 'A reason is required to record material wastage.'; end if;

  select * into v_material from public.materials
  where id = p_material_id and organization_id = public.current_user_org_id()
  for update;
  if not found then raise exception 'Material not found in your organization.'; end if;

  select coalesce(sum(case when transaction_type = 'in' then quantity else -quantity end), 0)
    into v_available
  from public.material_transactions
  where material_id = v_material.id;
  if p_quantity > v_available then
    raise exception 'Only % % is available; wastage cannot exceed stock on hand.',
      v_available, coalesce(v_material.unit, 'units');
  end if;

  insert into public.material_transactions (
    organization_id, material_id, project_id, room_id, transaction_type,
    quantity, transaction_date, notes
  ) values (
    v_material.organization_id, v_material.id, v_material.project_id,
    v_material.room_id, 'out', p_quantity, coalesce(p_wastage_date, current_date),
    'Wastage: ' || trim(p_reason)
  ) returning id into v_transaction_id;

  insert into public.material_wastage (
    organization_id, project_id, material_id, material_transaction_id,
    quantity, reason, wastage_date, recorded_by
  ) values (
    v_material.organization_id, v_material.project_id, v_material.id,
    v_transaction_id, p_quantity, trim(p_reason), coalesce(p_wastage_date, current_date), auth.uid()
  ) returning * into v_wastage;
  return v_wastage;
end;
$$;
revoke all on function public.record_material_wastage(uuid, numeric, text, date) from public;
grant execute on function public.record_material_wastage(uuid, numeric, text, date) to authenticated;

create table if not exists public.client_portal_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_client_portal_links_token
  on public.client_portal_links (token_hash) where revoked_at is null;
alter table public.client_portal_links enable row level security;
drop policy if exists "Tenant read client portal links" on public.client_portal_links;
create policy "Tenant read client portal links" on public.client_portal_links
  for select using (organization_id = public.current_user_org_id());

create table if not exists public.client_portal_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  caption text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_client_portal_media_project
  on public.client_portal_media (organization_id, project_id, created_at desc);
alter table public.client_portal_media enable row level security;
drop policy if exists "Tenant read client portal media" on public.client_portal_media;
create policy "Tenant read client portal media" on public.client_portal_media
  for select using (organization_id = public.current_user_org_id());
drop policy if exists "Tenant add client portal media" on public.client_portal_media;
create policy "Tenant add client portal media" on public.client_portal_media
  for insert with check (
    organization_id = public.current_user_org_id()
    and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid()
        and profile.organization_id = client_portal_media.organization_id
        and profile.role in ('owner', 'admin', 'supervisor')
    )
    and exists (
      select 1 from public.projects p
      where p.id = client_portal_media.project_id
        and p.organization_id = client_portal_media.organization_id
    )
    and storage_path like client_portal_media.organization_id::text || '/' ||
      client_portal_media.project_id::text || '/%'
  );
drop policy if exists "Tenant delete client portal media" on public.client_portal_media;
create policy "Tenant delete client portal media" on public.client_portal_media
  for delete using (
    organization_id = public.current_user_org_id()
    and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid()
        and profile.organization_id = client_portal_media.organization_id
        and profile.role in ('owner', 'admin', 'supervisor')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-portal-media', 'client-portal-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Tenant upload client portal media" on storage.objects;
create policy "Tenant upload client portal media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-portal-media'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
    and (storage.foldername(name))[2] is not null
    and exists (
      select 1 from public.projects project
      join public.profiles profile on profile.organization_id = project.organization_id
      where project.id::text = (storage.foldername(name))[2]
        and project.organization_id = public.current_user_org_id()
        and profile.id = auth.uid()
        and profile.role in ('owner', 'admin', 'supervisor')
    )
  );
drop policy if exists "Tenant delete client portal media objects" on storage.objects;
create policy "Tenant delete client portal media objects" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-portal-media'
    and (storage.foldername(name))[1] = public.current_user_org_id()::text
    and exists (
      select 1 from public.profiles profile
      where profile.id = auth.uid()
        and profile.organization_id = public.current_user_org_id()
        and profile.role in ('owner', 'admin', 'supervisor')
    )
  );

create or replace function public.create_client_portal_link(
  p_project_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_project public.projects%rowtype;
  v_role text;
begin
  select role into v_role from public.profiles
  where id = auth.uid() and organization_id = public.current_user_org_id();
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only an owner or admin can create or rotate client portal access.';
  end if;
  if p_token_hash is null or length(p_token_hash) <> 64 then raise exception 'A valid secure portal token is required.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '366 days' then
    raise exception 'Portal expiry must be in the future and within one year.';
  end if;
  select * into v_project from public.projects
  where id = p_project_id and organization_id = public.current_user_org_id();
  if not found then raise exception 'Project not found in your organization.'; end if;
  insert into public.client_portal_links (
    organization_id, project_id, token_hash, expires_at, revoked_at, created_by
  ) values (
    v_project.organization_id, v_project.id, p_token_hash, p_expires_at, null, auth.uid()
  )
  on conflict (project_id) do update set
    token_hash = excluded.token_hash,
    expires_at = excluded.expires_at,
    revoked_at = null,
    created_by = excluded.created_by,
    created_at = now();
end;
$$;

create or replace function public.revoke_client_portal_link(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles
  where id = auth.uid() and organization_id = public.current_user_org_id();
  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception 'Only an owner or admin can revoke client portal access.';
  end if;
  update public.client_portal_links set revoked_at = now()
  where project_id = p_project_id and organization_id = public.current_user_org_id();
end;
$$;

create or replace function public.get_shared_client_portal(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_link public.client_portal_links%rowtype;
  v_result jsonb;
begin
  if p_token is null or length(p_token) < 32 then raise exception 'Invalid client portal link.'; end if;
  select * into v_link from public.client_portal_links
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and revoked_at is null and expires_at > now();
  if not found then raise exception 'This client portal link is invalid, expired, or revoked.'; end if;

  select jsonb_build_object(
    'project', jsonb_build_object(
      'name', p.name,
      'location', p.location,
      'project_type', p.project_type,
      'status', p.status,
      'start_date', p.start_date,
      'deadline', p.deadline,
      'contract_value', p.contract_value,
      'progress', coalesce((
        select round(avg(m.progress))
        from public.milestones m
        where m.project_id = p.id and m.organization_id = p.organization_id
      ), p.progress)
    ),
    'expires_at', v_link.expires_at,
    'milestones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', m.title, 'due_date', m.due_date,
        'status', m.status, 'progress', m.progress
      ) order by m.sort_order, m.due_date)
      from public.milestones m where m.project_id = p.id
        and m.organization_id = p.organization_id
    ), '[]'::jsonb),
    'updates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'update_date', d.update_date,
        'work_completed', d.work_completed,
        'next_day_tasks', d.next_day_tasks,
        'progress', d.progress
      ) order by d.update_date desc, d.created_at desc)
      from (
        select * from public.daily_updates
        where project_id = p.id and organization_id = p.organization_id
        order by update_date desc, created_at desc limit 20
      ) d
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'title', cp.title, 'amount', cp.amount,
        'paid_amount', cp.paid_amount, 'due_date', cp.due_date,
        'status', case
          when cp.amount > 0 and cp.paid_amount >= cp.amount then 'paid'
          when cp.due_date < current_date and cp.paid_amount < cp.amount then 'overdue'
          else cp.status
        end
      ) order by cp.due_date)
      from public.client_payments cp
      where cp.project_id = p.id and cp.organization_id = p.organization_id
    ), '[]'::jsonb),
    'media', coalesce((
      select jsonb_agg(jsonb_build_object(
        'storage_path', cm.storage_path, 'caption', cm.caption, 'created_at', cm.created_at
      ) order by cm.created_at desc)
      from public.client_portal_media cm
      where cm.project_id = p.id and cm.organization_id = p.organization_id
    ), '[]'::jsonb)
  ) into v_result
  from public.projects p
  where p.id = v_link.project_id and p.organization_id = v_link.organization_id;
  if v_result is null then raise exception 'The client project is no longer available.'; end if;
  return v_result;
end;
$$;

revoke all on function public.create_client_portal_link(uuid, text, timestamptz) from public;
revoke all on function public.revoke_client_portal_link(uuid) from public;
revoke all on function public.get_shared_client_portal(text) from public;
grant execute on function public.create_client_portal_link(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_client_portal_link(uuid) to authenticated;
grant execute on function public.get_shared_client_portal(text) to anon, authenticated;
