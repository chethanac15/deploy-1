-- Additive quotation workflow with auditable client decisions.

create extension if not exists pgcrypto with schema extensions;

alter table public.boq_items
  add column if not exists material_rate numeric check (material_rate is null or material_rate >= 0),
  add column if not exists labour_rate numeric check (labour_rate is null or labour_rate >= 0),
  add column if not exists selling_rate numeric check (selling_rate is null or selling_rate >= 0),
  add column if not exists gst_percent numeric not null default 0
    check (gst_percent >= 0 and gst_percent <= 100),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null;

create table if not exists public.boq_approval_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item_id uuid references public.boq_items(id) on delete set null,
  action text not null check (action in ('approved', 'reopened')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Team member',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_boq_approval_events_project
  on public.boq_approval_events (project_id, created_at desc);
alter table public.boq_approval_events enable row level security;
drop policy if exists "Tenant read boq_approval_events" on public.boq_approval_events;
create policy "Tenant read boq_approval_events"
  on public.boq_approval_events for select
  using (organization_id = public.current_user_org_id());

create or replace function public.audit_boq_approval_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor_name text;
begin
  if old.approved_at is not null
     and (new.item_name, new.description, new.category, new.quantity, new.unit,
          new.rate, new.estimated_cost, new.material_rate, new.labour_rate,
          new.selling_rate, new.gst_percent)
         is distinct from
         (old.item_name, old.description, old.category, old.quantity, old.unit,
          old.rate, old.estimated_cost, old.material_rate, old.labour_rate,
          old.selling_rate, old.gst_percent) then
    new.approved_at := null;
    new.approved_by := null;

    select full_name into v_actor_name from public.profiles where id = auth.uid();
    insert into public.boq_approval_events (
      organization_id, project_id, item_id, action, actor_id, actor_name, details
    ) values (
      old.organization_id, old.project_id, old.id, 'reopened', auth.uid(),
      coalesce(v_actor_name, 'Team member'),
      jsonb_build_object('previous_quantity', old.quantity, 'new_quantity', new.quantity,
                         'previous_rate', old.rate, 'new_rate', new.rate)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_boq_approval_changes on public.boq_items;
create trigger trg_audit_boq_approval_changes
  before update on public.boq_items
  for each row execute function public.audit_boq_approval_changes();

create or replace function public.approve_project_boq(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid := public.current_user_org_id();
  v_actor_name text;
  v_count integer;
  v_total numeric;
begin
  if auth.uid() is null or v_org_id is null then
    raise exception 'Authentication is required to approve a BOQ.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = v_org_id and role in ('owner', 'admin')
  ) then
    raise exception 'Only an owner or admin can approve the project BOQ.';
  end if;
  if not exists (
    select 1 from public.projects
    where id = p_project_id and organization_id = v_org_id
  ) then
    raise exception 'Project not found in your organization.';
  end if;

  update public.boq_items
  set approved_at = now(), approved_by = auth.uid()
  where project_id = p_project_id and organization_id = v_org_id;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'Add at least one BOQ item before approval.';
  end if;

  select coalesce(sum(estimated_cost), 0) into v_total
  from public.boq_items
  where project_id = p_project_id and organization_id = v_org_id;
  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.boq_approval_events (
    organization_id, project_id, action, actor_id, actor_name, details
  ) values (
    v_org_id, p_project_id, 'approved', auth.uid(),
    coalesce(v_actor_name, 'Team member'),
    jsonb_build_object('item_count', v_count, 'estimated_cost', v_total)
  );

  return jsonb_build_object('item_count', v_count, 'estimated_cost', v_total);
end;
$$;
revoke all on function public.approve_project_boq(uuid) from public;
grant execute on function public.approve_project_boq(uuid) to authenticated;

create sequence if not exists public.quotation_number_seq;
grant usage, select on sequence public.quotation_number_seq to authenticated;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  quote_number text not null default (
    'AE-' || to_char(current_date, 'YYYYMM') || '-' ||
    lpad(nextval('public.quotation_number_seq')::text, 5, '0')
  ),
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'approved', 'rejected', 'changes_requested', 'expired')),
  currency text not null default 'INR',
  subtotal numeric not null check (subtotal >= 0),
  gst_amount numeric not null check (gst_amount >= 0),
  total numeric not null check (total >= 0),
  valid_until date,
  terms text not null default '',
  payment_terms text not null default '',
  items jsonb not null default '[]'::jsonb,
  company_snapshot jsonb not null default '{}'::jsonb,
  client_snapshot jsonb not null default '{}'::jsonb,
  project_snapshot jsonb not null default '{}'::jsonb,
  share_token_hash text unique,
  created_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  decision_at timestamptz,
  decision_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quotations_org_project
  on public.quotations (organization_id, project_id, created_at desc);
create index if not exists idx_quotations_org_status
  on public.quotations (organization_id, status);

drop trigger if exists trg_quotations_updated_at on public.quotations;
create trigger trg_quotations_updated_at
  before update on public.quotations
  for each row execute function public.set_updated_at();

alter table public.quotations enable row level security;
drop policy if exists "Tenant access on quotations" on public.quotations;
create policy "Tenant access on quotations"
  on public.quotations for all
  using (organization_id = public.current_user_org_id())
  with check (organization_id = public.current_user_org_id());

create table if not exists public.quotation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  action text not null,
  previous_status text,
  new_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Team member',
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_quotation_events_quotation
  on public.quotation_events (quotation_id, created_at desc);

alter table public.quotation_events enable row level security;
drop policy if exists "Tenant access on quotation_events" on public.quotation_events;
create policy "Tenant read quotation_events"
  on public.quotation_events for select
  using (organization_id = public.current_user_org_id());

create or replace function public.guard_quotation_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if old.status = 'draft' and new.status = 'sent' and auth.uid() is not null then
    return new;
  end if;
  if old.status = 'sent'
     and new.status in ('approved', 'rejected', 'changes_requested')
     and current_setting('app.shared_quote_decision', true) = 'yes' then
    return new;
  end if;
  raise exception 'Quotation decisions must be submitted through the client approval link.';
end;
$$;

drop trigger if exists trg_guard_quotation_status_change on public.quotations;
create trigger trg_guard_quotation_status_change
  before update on public.quotations
  for each row execute function public.guard_quotation_status_change();

create or replace function public.audit_quotation_change()
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

  select full_name into v_actor_name
  from public.profiles
  where id = auth.uid();

  insert into public.quotation_events (
    organization_id, quotation_id, action, previous_status, new_status,
    actor_id, actor_name, comment
  ) values (
    new.organization_id, new.id,
    case when tg_op = 'INSERT' then 'created' else new.status end,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status, auth.uid(),
    coalesce(v_actor_name, case when auth.uid() is null then 'Client' else 'Team member' end),
    case when tg_op = 'UPDATE' and new.decision_comment is distinct from old.decision_comment
      then new.decision_comment else null end
  );
  return new;
end;
$$;

drop trigger if exists trg_audit_quotation_change on public.quotations;
create trigger trg_audit_quotation_change
  after insert or update on public.quotations
  for each row execute function public.audit_quotation_change();

create or replace function public.get_shared_quotation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_quote public.quotations%rowtype;
  v_events jsonb;
begin
  if p_token is null or length(p_token) < 32 then
    raise exception 'Invalid quotation link.';
  end if;

  select * into v_quote
  from public.quotations q
  where q.share_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and q.status in ('sent', 'approved', 'rejected', 'changes_requested', 'expired');

  if not found then
    raise exception 'Quotation link is invalid or no longer available.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'action', e.action,
    'actor_name', e.actor_name,
    'comment', e.comment,
    'created_at', e.created_at
  ) order by e.created_at), '[]'::jsonb)
  into v_events
  from public.quotation_events e
  where e.quotation_id = v_quote.id;

  return jsonb_build_object(
    'id', v_quote.id,
    'quote_number', v_quote.quote_number,
    'status', v_quote.status,
    'currency', v_quote.currency,
    'subtotal', v_quote.subtotal,
    'gst_amount', v_quote.gst_amount,
    'total', v_quote.total,
    'valid_until', v_quote.valid_until,
    'terms', v_quote.terms,
    'payment_terms', v_quote.payment_terms,
    'items', v_quote.items,
    'company_snapshot', v_quote.company_snapshot,
    'client_snapshot', v_quote.client_snapshot,
    'project_snapshot', v_quote.project_snapshot,
    'decision_at', v_quote.decision_at,
    'decision_comment', v_quote.decision_comment,
    'events', v_events
  );
end;
$$;

create or replace function public.respond_to_shared_quotation(
  p_token text,
  p_action text,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_quote public.quotations%rowtype;
  v_status text;
begin
  if p_token is null or length(p_token) < 32 then
    raise exception 'Invalid quotation link.';
  end if;
  if p_action not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'Unsupported quotation decision.';
  end if;
  if p_action = 'changes_requested' and nullif(trim(p_comment), '') is null then
    raise exception 'Add a comment describing the requested changes.';
  end if;

  select * into v_quote
  from public.quotations q
  where q.share_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found or v_quote.status <> 'sent' then
    raise exception 'This quotation is no longer awaiting a response.';
  end if;
  if v_quote.valid_until is not null and v_quote.valid_until < current_date then
    raise exception 'This quotation has expired.';
  end if;

  v_status := p_action;
  perform set_config('app.shared_quote_decision', 'yes', true);
  update public.quotations
  set status = v_status,
      decision_at = now(),
      decision_comment = nullif(trim(p_comment), '')
  where id = v_quote.id;

  return public.get_shared_quotation(p_token);
end;
$$;

create or replace function public.renew_quotation_share_link(p_quotation_id uuid, p_token_hash text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote public.quotations%rowtype;
  v_actor_name text;
begin
  select * into v_quote
  from public.quotations q
  where q.id = p_quotation_id
    and q.organization_id = public.current_user_org_id()
  for update;
  if not found or v_quote.status <> 'sent' then
    raise exception 'Only a quotation awaiting client response can get a new link.';
  end if;
  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'Invalid secure link token.';
  end if;

  update public.quotations
  set share_token_hash = p_token_hash
  where id = v_quote.id;

  select full_name into v_actor_name from public.profiles where id = auth.uid();
  insert into public.quotation_events (
    organization_id, quotation_id, action, previous_status, new_status,
    actor_id, actor_name
  ) values (
    v_quote.organization_id, v_quote.id, 'link_renewed', v_quote.status,
    v_quote.status, auth.uid(), coalesce(v_actor_name, 'Team member')
  );
end;
$$;

revoke all on function public.get_shared_quotation(text) from public;
revoke all on function public.respond_to_shared_quotation(text, text, text) from public;
revoke all on function public.renew_quotation_share_link(uuid, text) from public;
grant execute on function public.get_shared_quotation(text) to anon, authenticated;
grant execute on function public.respond_to_shared_quotation(text, text, text) to anon, authenticated;
grant execute on function public.renew_quotation_share_link(uuid, text) to authenticated;
