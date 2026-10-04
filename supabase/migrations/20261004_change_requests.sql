-- Auditable change-request workflow with client approval and atomic project updates.

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  related_boq_item_id uuid references public.boq_items(id) on delete set null,
  title text not null,
  description text not null default '',
  requested_by text not null,
  additional_quantity numeric not null check (additional_quantity > 0),
  unit text not null default 'Nos',
  additional_material_cost numeric not null check (additional_material_cost >= 0),
  additional_labour_cost numeric not null check (additional_labour_cost >= 0),
  selling_price numeric not null check (selling_price >= 0),
  gst_percent numeric not null default 0 check (gst_percent >= 0 and gst_percent <= 100),
  valid_until date,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'internal_review', 'client_approval', 'approved', 'rejected')),
  share_token_hash text unique,
  decision_at timestamptz,
  decision_comment text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_change_requests_org_project
  on public.change_requests (organization_id, project_id, created_at desc);
create index if not exists idx_change_requests_status
  on public.change_requests (organization_id, status);

drop trigger if exists trg_change_requests_updated_at on public.change_requests;
create trigger trg_change_requests_updated_at
  before update on public.change_requests
  for each row execute function public.set_updated_at();

alter table public.change_requests enable row level security;
drop policy if exists "Tenant read change_requests" on public.change_requests;
create policy "Tenant read change_requests"
  on public.change_requests for select
  using (organization_id = public.current_user_org_id());
drop policy if exists "Tenant create change_requests" on public.change_requests;
create policy "Tenant create change_requests"
  on public.change_requests for insert
  with check (
    organization_id = public.current_user_org_id()
    and status = 'draft'
    and created_by = auth.uid()
  );

create table if not exists public.change_request_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  action text not null,
  previous_status text,
  new_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Team member',
  comment text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_change_request_events_parent
  on public.change_request_events (change_request_id, created_at desc);
alter table public.change_request_events enable row level security;
drop policy if exists "Tenant read change_request_events" on public.change_request_events;
create policy "Tenant read change_request_events"
  on public.change_request_events for select
  using (organization_id = public.current_user_org_id());

create or replace function public.audit_change_request_change()
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
  insert into public.change_request_events (
    organization_id, change_request_id, action, previous_status, new_status,
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

drop trigger if exists trg_audit_change_request_change on public.change_requests;
create trigger trg_audit_change_request_change
  after insert or update on public.change_requests
  for each row execute function public.audit_change_request_change();

create or replace function public.guard_change_request_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and current_setting('app.change_request_transition', true) is distinct from 'yes' then
    raise exception 'Change request status must be updated through the workflow.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_change_request_transition on public.change_requests;
create trigger trg_guard_change_request_transition
  before update on public.change_requests
  for each row execute function public.guard_change_request_transition();

create or replace function public.transition_change_request(
  p_change_request_id uuid,
  p_new_status text,
  p_share_token_hash text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.change_requests%rowtype;
begin
  select * into v_request
  from public.change_requests
  where id = p_change_request_id
    and organization_id = public.current_user_org_id()
  for update;
  if not found then raise exception 'Change request not found.'; end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and organization_id = v_request.organization_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Only an owner or admin can move a change request through internal review.';
  end if;
  if not (
    (v_request.status = 'draft' and p_new_status = 'submitted')
    or (v_request.status = 'submitted' and p_new_status = 'internal_review')
    or (v_request.status = 'internal_review' and p_new_status = 'client_approval')
    or (v_request.status = 'client_approval' and p_new_status = 'client_approval')
  ) then
    raise exception 'This change request cannot move from % to %.', v_request.status, p_new_status;
  end if;
  if p_new_status = 'client_approval' and
     (p_share_token_hash is null or length(p_share_token_hash) <> 64) then
    raise exception 'A valid secure client approval link is required.';
  end if;
  if p_new_status = 'client_approval' and v_request.valid_until is not null
     and v_request.valid_until < current_date then
    raise exception 'This change request has expired. Create a new request with a future validity date.';
  end if;

  perform set_config('app.change_request_transition', 'yes', true);
  update public.change_requests
  set status = p_new_status,
      share_token_hash = case when p_new_status = 'client_approval' then p_share_token_hash else share_token_hash end
  where id = v_request.id;

  if v_request.status = 'client_approval' then
    insert into public.change_request_events (
      organization_id, change_request_id, action, previous_status, new_status,
      actor_id, actor_name
    ) values (
      v_request.organization_id, v_request.id, 'link_renewed',
      v_request.status, v_request.status, auth.uid(),
      coalesce((select full_name from public.profiles where id = auth.uid()), 'Team member')
    );
  end if;
end;
$$;

create or replace function public.get_shared_change_request(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_request public.change_requests%rowtype;
  v_events jsonb;
begin
  if p_token is null or length(p_token) < 32 then raise exception 'Invalid change-request link.'; end if;
  select * into v_request
  from public.change_requests
  where share_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and status in ('client_approval', 'approved', 'rejected', 'internal_review');
  if not found then raise exception 'Change-request link is invalid or no longer available.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'action', e.action, 'actor_name', e.actor_name, 'comment', e.comment,
    'details', e.details,
    'created_at', e.created_at
  ) order by e.created_at), '[]'::jsonb)
  into v_events
  from public.change_request_events e
  where e.change_request_id = v_request.id;

  return jsonb_build_object(
    'id', v_request.id,
    'project_name', (select name from public.projects where id = v_request.project_id),
    'title', v_request.title,
    'description', v_request.description,
    'requested_by', v_request.requested_by,
    'additional_quantity', v_request.additional_quantity,
    'unit', v_request.unit,
    'additional_material_cost', v_request.additional_material_cost,
    'additional_labour_cost', v_request.additional_labour_cost,
    'selling_price', v_request.selling_price,
    'gst_percent', v_request.gst_percent,
    'status', v_request.status,
    'valid_until', v_request.valid_until,
    'decision_at', v_request.decision_at,
    'decision_comment', v_request.decision_comment,
    'events', v_events
  );
end;
$$;

create or replace function public.respond_to_shared_change_request(
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
  v_request public.change_requests%rowtype;
  v_new_status text;
  v_project public.projects%rowtype;
  v_material_rate numeric;
  v_labour_rate numeric;
  v_selling_rate numeric;
  v_gst_amount numeric;
  v_total_cost numeric;
  v_new_contract numeric;
  v_new_budget numeric;
begin
  if p_token is null or length(p_token) < 32 then raise exception 'Invalid change-request link.'; end if;
  if p_action not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'Unsupported change-request decision.';
  end if;
  if p_action = 'changes_requested' and nullif(trim(p_comment), '') is null then
    raise exception 'Add a comment describing the requested changes.';
  end if;

  select * into v_request
  from public.change_requests
  where share_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;
  if not found or v_request.status <> 'client_approval' then
    raise exception 'This change request is no longer awaiting client approval.';
  end if;
  if v_request.valid_until is not null and v_request.valid_until < current_date then
    raise exception 'This change request has expired.';
  end if;

  v_new_status := case when p_action = 'changes_requested' then 'internal_review' else p_action end;
  perform set_config('app.change_request_transition', 'yes', true);
  update public.change_requests
  set status = v_new_status,
      decision_at = now(),
      decision_comment = nullif(trim(p_comment), '')
  where id = v_request.id;

  if p_action = 'approved' then
    select * into v_project
    from public.projects
    where id = v_request.project_id
      and organization_id = v_request.organization_id
    for update;
    if not found then raise exception 'Project not found for this change request.'; end if;

    v_material_rate := v_request.additional_material_cost / v_request.additional_quantity;
    v_labour_rate := v_request.additional_labour_cost / v_request.additional_quantity;
    v_selling_rate := v_request.selling_price / v_request.additional_quantity;
    v_gst_amount := v_request.selling_price * v_request.gst_percent / 100;
    v_total_cost := v_request.additional_material_cost + v_request.additional_labour_cost;
    v_new_contract := coalesce(v_project.contract_value, v_project.budget, 0) +
      v_request.selling_price + v_gst_amount;
    v_new_budget := coalesce(v_project.budget, 0) + v_total_cost;

    insert into public.boq_items (
      organization_id, project_id, room_id, item_name, description, category,
      quantity, unit, rate, estimated_cost, material_rate, labour_rate,
      selling_rate, gst_percent, approved_at
    ) values (
      v_request.organization_id, v_request.project_id,
      (select room_id from public.boq_items where id = v_request.related_boq_item_id),
      'Change: ' || v_request.title, v_request.description, 'Change Work',
      v_request.additional_quantity, v_request.unit,
      v_total_cost / v_request.additional_quantity,
      v_total_cost,
      v_material_rate, v_labour_rate, v_selling_rate, v_request.gst_percent, now()
    );

    update public.projects
    set contract_value = v_new_contract,
        budget = v_new_budget
    where id = v_project.id;

    insert into public.change_request_events (
      organization_id, change_request_id, action, previous_status, new_status,
      actor_name, comment, details
    ) values (
      v_request.organization_id, v_request.id, 'project_financials_updated',
      'client_approval', 'approved', 'Client', nullif(trim(p_comment), ''),
      jsonb_build_object(
        'previous_contract_value', coalesce(v_project.contract_value, v_project.budget, 0),
        'new_contract_value', v_new_contract,
        'previous_budget', v_project.budget,
        'new_budget', v_new_budget,
        'boq_cost_added', v_total_cost,
        'revenue_added', v_request.selling_price + v_gst_amount
      )
    );
  end if;

  return public.get_shared_change_request(p_token);
end;
$$;

revoke all on function public.transition_change_request(uuid, text, text) from public;
revoke all on function public.get_shared_change_request(text) from public;
revoke all on function public.respond_to_shared_change_request(text, text, text) from public;
grant execute on function public.transition_change_request(uuid, text, text) to authenticated;
grant execute on function public.get_shared_change_request(text) to anon, authenticated;
grant execute on function public.respond_to_shared_change_request(text, text, text) to anon, authenticated;
