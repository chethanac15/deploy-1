-- ==============================================================================
-- APNI ESTATE INTERIORS - PHASE 6 OPERATIONS & ATOMIC MATERIAL TRANSACTIONS
-- ==============================================================================

-- 1. Additive columns on daily_updates (for enhanced DPR site reporting)
alter table if exists public.daily_updates 
  add column if not exists workers_count integer default 0 check (workers_count >= 0);

alter table if exists public.daily_updates 
  add column if not exists progress integer default 0 check (progress >= 0 and progress <= 100);

-- 2. Atomic Material Stock Transaction RPC
-- Safely processes IN and OUT transactions with row-level locking and negative-stock prevention
create or replace function public.record_material_transaction_atomic(
  p_material_id uuid,
  p_project_id uuid,
  p_room_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_transaction_date date default current_date,
  p_notes text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_mat_org_id uuid;
  v_total_in numeric := 0;
  v_total_out numeric := 0;
  v_available numeric := 0;
  v_tx_id uuid;
  v_new_available numeric := 0;
begin
  -- 1. Authenticate caller and retrieve tenant organization
  v_org_id := public.current_user_org_id();
  if v_org_id is null then
    raise exception 'Unauthorized: No active organization found.';
  end if;

  -- 2. Validate parameters
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.';
  end if;

  if p_transaction_type not in ('in', 'out') then
    raise exception 'Invalid transaction type: must be in or out.';
  end if;

  -- 3. Lock target material row to prevent concurrent race conditions
  select organization_id into v_mat_org_id
  from public.materials
  where id = p_material_id and project_id = p_project_id
  for update;

  if v_mat_org_id is null or v_mat_org_id <> v_org_id then
    raise exception 'Material not found or does not belong to your organization.';
  end if;

  -- 4. Calculate authoritative available quantity from transaction history
  select 
    coalesce(sum(case when transaction_type = 'in' then quantity else 0 end), 0),
    coalesce(sum(case when transaction_type = 'out' then quantity else 0 end), 0)
  into v_total_in, v_total_out
  from public.material_transactions
  where material_id = p_material_id and organization_id = v_org_id;

  v_available := v_total_in - v_total_out;

  -- 5. Strict rejection if requested OUT exceeds available balance
  if p_transaction_type = 'out' and p_quantity > v_available then
    raise exception 'Only % available. Cannot stock out %.', v_available, p_quantity;
  end if;

  -- 6. Insert new transaction record
  insert into public.material_transactions (
    organization_id,
    material_id,
    project_id,
    room_id,
    transaction_type,
    quantity,
    transaction_date,
    notes
  ) values (
    v_org_id,
    p_material_id,
    p_project_id,
    p_room_id,
    p_transaction_type,
    p_quantity,
    coalesce(p_transaction_date, current_date),
    p_notes
  ) returning id into v_tx_id;

  -- 7. Calculate new available balance
  if p_transaction_type = 'in' then
    v_new_available := v_available + p_quantity;
  else
    v_new_available := v_available - p_quantity;
  end if;

  return json_build_object(
    'success', true,
    'transaction_id', v_tx_id,
    'available_quantity', v_new_available
  );
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.record_material_transaction_atomic to authenticated;
