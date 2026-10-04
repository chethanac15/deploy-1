-- Transactional goods receipts tied to existing purchase order lines.

alter table public.purchase_items
  add column if not exists received_quantity numeric not null default 0
    check (received_quantity >= 0),
  add column if not exists rejected_quantity numeric not null default 0
    check (rejected_quantity >= 0);

create table if not exists public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete restrict,
  grn_number text not null,
  received_on date not null default current_date,
  site_location text not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, grn_number)
);

create table if not exists public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  goods_receipt_id uuid not null references public.goods_receipts(id) on delete cascade,
  purchase_item_id uuid not null references public.purchase_items(id) on delete restrict,
  item_name text not null,
  unit text not null,
  ordered_quantity numeric not null check (ordered_quantity > 0),
  delivered_quantity numeric not null check (delivered_quantity > 0),
  accepted_quantity numeric not null check (accepted_quantity >= 0),
  rejected_quantity numeric not null check (rejected_quantity >= 0),
  actual_rate numeric check (actual_rate is null or actual_rate >= 0),
  created_at timestamptz not null default now(),
  check (accepted_quantity + rejected_quantity = delivered_quantity)
);

create index if not exists idx_goods_receipts_purchase
  on public.goods_receipts (purchase_id, received_on desc);
create index if not exists idx_goods_receipts_project
  on public.goods_receipts (organization_id, project_id, received_on desc);
create index if not exists idx_goods_receipt_items_receipt
  on public.goods_receipt_items (goods_receipt_id);

alter table public.goods_receipts enable row level security;
alter table public.goods_receipt_items enable row level security;
drop policy if exists "Tenant read goods_receipts" on public.goods_receipts;
create policy "Tenant read goods_receipts"
  on public.goods_receipts for select
  using (organization_id = public.current_user_org_id());
drop policy if exists "Tenant read goods_receipt_items" on public.goods_receipt_items;
create policy "Tenant read goods_receipt_items"
  on public.goods_receipt_items for select
  using (organization_id = public.current_user_org_id());

create or replace function public.prevent_received_purchase_line_edit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.goods_receipt_items
    where purchase_item_id = old.id
  ) and current_setting('app.recording_goods_receipt', true) is distinct from 'yes' then
    raise exception 'A purchase order line with a goods receipt is immutable.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_received_purchase_line_edit on public.purchase_items;
create trigger trg_prevent_received_purchase_line_edit
  before update or delete on public.purchase_items
  for each row execute function public.prevent_received_purchase_line_edit();

create or replace function public.prevent_received_purchase_header_edit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.goods_receipts where purchase_id = old.id) then
    if (new.project_id, new.vendor_id, new.po_number, new.order_date, new.total_amount)
       is distinct from
       (old.project_id, old.vendor_id, old.po_number, old.order_date, old.total_amount) then
      raise exception 'Core purchase order details cannot change after a goods receipt.';
    end if;
    if new.status is distinct from old.status
       and (current_setting('app.recording_goods_receipt', true) is distinct from 'yes'
            or new.status not in ('partially_received', 'received')) then
      raise exception 'Purchase receipt status is maintained by the goods receipt workflow.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_received_purchase_header_edit on public.purchases;
create trigger trg_prevent_received_purchase_header_edit
  before update on public.purchases
  for each row execute function public.prevent_received_purchase_header_edit();

create or replace function public.record_goods_receipt(
  p_purchase_id uuid,
  p_received_on date,
  p_site_location text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid := public.current_user_org_id();
  v_purchase public.purchases%rowtype;
  v_line public.purchase_items%rowtype;
  v_input record;
  v_receipt_id uuid;
  v_grn_number text;
  v_has_line boolean := false;
  v_all_received boolean := true;
  v_has_received boolean := false;
  v_delivered numeric;
  v_rejected numeric;
  v_accepted numeric;
  v_remaining numeric;
begin
  if auth.uid() is null or v_org_id is null then
    raise exception 'Authentication is required to record a goods receipt.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = v_org_id
      and role in ('owner', 'admin', 'supervisor')
  ) then
    raise exception 'Only an owner, admin, or site supervisor can record a goods receipt.';
  end if;
  if nullif(trim(p_site_location), '') is null then
    raise exception 'Site or delivery location is required.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one purchase order line to the receipt.';
  end if;

  select * into v_purchase
  from public.purchases
  where id = p_purchase_id and organization_id = v_org_id
  for update;
  if not found then
    raise exception 'Purchase order not found in your organization.';
  end if;
  if v_purchase.status not in ('ordered', 'partially_received') then
    raise exception 'Only ordered or partially received purchase orders can receive goods.';
  end if;

  v_grn_number := 'GRN-' || to_char(coalesce(p_received_on, current_date), 'YYYYMMDD') ||
    '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.goods_receipts (
    organization_id, project_id, purchase_id, grn_number, received_on,
    site_location, notes, created_by
  ) values (
    v_org_id, v_purchase.project_id, v_purchase.id, v_grn_number,
    coalesce(p_received_on, current_date), trim(p_site_location),
    nullif(trim(p_notes), ''), auth.uid()
  ) returning id into v_receipt_id;

  perform set_config('app.recording_goods_receipt', 'yes', true);
  for v_input in
    select * from jsonb_to_recordset(p_items) as x(
      purchase_item_id uuid,
      delivered_quantity numeric,
      rejected_quantity numeric,
      actual_rate numeric
    )
  loop
    v_has_line := true;
    v_delivered := coalesce(v_input.delivered_quantity, 0);
    v_rejected := coalesce(v_input.rejected_quantity, 0);
    if v_delivered <= 0 or v_rejected < 0 or v_rejected > v_delivered then
      raise exception 'Delivered quantity must be positive and rejected quantity cannot exceed delivered quantity.';
    end if;
    if v_input.actual_rate is not null and v_input.actual_rate < 0 then
      raise exception 'Actual unit rate cannot be negative.';
    end if;

    select * into v_line
    from public.purchase_items
    where id = v_input.purchase_item_id
      and purchase_id = v_purchase.id
      and organization_id = v_org_id
    for update;
    if not found then
      raise exception 'A selected line does not belong to this purchase order.';
    end if;

    v_accepted := v_delivered - v_rejected;
    v_remaining := v_line.quantity - v_line.received_quantity;
    if v_accepted > v_remaining then
      raise exception 'Accepted quantity for "%" exceeds the remaining ordered quantity (% %).',
        v_line.item_name, v_remaining, v_line.unit;
    end if;

    insert into public.goods_receipt_items (
      organization_id, goods_receipt_id, purchase_item_id, item_name, unit,
      ordered_quantity, delivered_quantity, accepted_quantity, rejected_quantity, actual_rate
    ) values (
      v_org_id, v_receipt_id, v_line.id, v_line.item_name, v_line.unit,
      v_line.quantity, v_delivered, v_accepted, v_rejected, v_input.actual_rate
    );

    update public.purchase_items
    set received_quantity = received_quantity + v_accepted,
        rejected_quantity = rejected_quantity + v_rejected
    where id = v_line.id;
  end loop;

  if not v_has_line then
    raise exception 'Add at least one purchase order line to the receipt.';
  end if;

  select bool_and(pi.received_quantity >= pi.quantity),
         bool_or(pi.received_quantity > 0)
  into v_all_received, v_has_received
  from public.purchase_items pi
  where pi.purchase_id = v_purchase.id;

  update public.purchases
  set status = case
    when coalesce(v_all_received, false) then 'received'
    when coalesce(v_has_received, false) then 'partially_received'
    else status
  end
  where id = v_purchase.id;

  return v_receipt_id;
end;
$$;

revoke all on function public.record_goods_receipt(uuid, date, text, text, jsonb) from public;
grant execute on function public.record_goods_receipt(uuid, date, text, text, jsonb) to authenticated;

create or replace function public.get_vendor_scorecards()
returns table (
  vendor_id uuid,
  order_count bigint,
  project_count bigint,
  total_purchase_value numeric,
  average_unit_price numeric,
  comparable_price_score numeric,
  quality_score numeric,
  average_delivery_delay_days numeric,
  delivery_score numeric,
  rejected_quantity numeric,
  overall_score numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with scoped_vendors as (
    select v.id, v.rating
    from public.vendors v
    where v.organization_id = public.current_user_org_id()
  ),
  vendor_items as (
    select p.vendor_id,
           lower(trim(pi.item_name)) as item_key,
           lower(trim(pi.unit)) as unit_key,
           avg(pi.rate) as average_rate
    from public.purchases p
    join public.purchase_items pi on pi.purchase_id = p.id
    where p.organization_id = public.current_user_org_id()
      and p.status in ('ordered', 'partially_received', 'received')
    group by p.vendor_id, lower(trim(pi.item_name)), lower(trim(pi.unit))
  ),
  comparable_items as (
    select own.vendor_id,
           own.average_rate,
           avg(other.average_rate) as competitor_average
    from vendor_items own
    join vendor_items other
      on other.item_key = own.item_key
     and other.unit_key = own.unit_key
     and other.vendor_id <> own.vendor_id
    group by own.vendor_id, own.item_key, own.unit_key, own.average_rate
  ),
  price_scores as (
    select vendor_id,
           avg(least(100, competitor_average / nullif(average_rate, 0) * 100)) as score,
           avg(average_rate) as average_unit_price
    from comparable_items
    group by vendor_id
  ),
  all_prices as (
    select vendor_id, avg(average_rate) as average_unit_price
    from vendor_items
    group by vendor_id
  ),
  orders as (
    select p.vendor_id,
           count(*) as order_count,
           count(distinct p.project_id) as project_count,
           sum(p.total_amount) as total_purchase_value
    from public.purchases p
    where p.organization_id = public.current_user_org_id()
      and p.status <> 'cancelled'
    group by p.vendor_id
  ),
  delivery as (
    select p.vendor_id,
           avg(greatest(0, last_receipt.received_on - p.expected_delivery)) as average_delay
    from public.purchases p
    join lateral (
      select max(gr.received_on) as received_on
      from public.goods_receipts gr
      where gr.purchase_id = p.id
        and gr.organization_id = public.current_user_org_id()
    ) last_receipt on last_receipt.received_on is not null
    where p.organization_id = public.current_user_org_id()
      and p.status = 'received'
      and p.expected_delivery is not null
    group by p.vendor_id
  ),
  rejects as (
    select p.vendor_id,
           coalesce(sum(gri.rejected_quantity), 0) as rejected_quantity,
           coalesce(sum(gri.delivered_quantity), 0) as delivered_quantity
    from public.purchases p
    join public.goods_receipts gr on gr.purchase_id = p.id
    join public.goods_receipt_items gri on gri.goods_receipt_id = gr.id
    where p.organization_id = public.current_user_org_id()
    group by p.vendor_id
  ),
  score_parts as (
    select v.id as vendor_id,
           coalesce(ps.score, 50)::numeric as price_score,
           greatest(0, least(100,
             coalesce(v.rating, 2.5) * 20 -
             coalesce(r.rejected_quantity / nullif(r.delivered_quantity, 0) * 100, 0)
           ))::numeric as quality_score,
           coalesce(d.average_delay, 0)::numeric as average_delay,
           case when d.average_delay is null then 50::numeric
                else greatest(0, 100 - d.average_delay * 5)::numeric
           end as delivery_score
    from scoped_vendors v
    left join price_scores ps on ps.vendor_id = v.id
    left join delivery d on d.vendor_id = v.id
    left join rejects r on r.vendor_id = v.id
  )
  select v.id,
         coalesce(o.order_count, 0),
         coalesce(o.project_count, 0),
         coalesce(o.total_purchase_value, 0)::numeric,
         coalesce(ap.average_unit_price, 0)::numeric,
         round(sp.price_score, 1),
         round(sp.quality_score, 1),
         round(sp.average_delay, 1),
         round(sp.delivery_score, 1),
         coalesce(r.rejected_quantity, 0)::numeric,
         round(sp.price_score * 0.4 + sp.quality_score * 0.3 + sp.delivery_score * 0.3, 1)
  from scoped_vendors v
  join score_parts sp on sp.vendor_id = v.id
  left join orders o on o.vendor_id = v.id
  left join all_prices ap on ap.vendor_id = v.id
  left join rejects r on r.vendor_id = v.id
  order by v.id;
$$;

revoke all on function public.get_vendor_scorecards() from public;
grant execute on function public.get_vendor_scorecards() to authenticated;
