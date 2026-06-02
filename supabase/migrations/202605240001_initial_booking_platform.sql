create extension if not exists btree_gist;
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.pitches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches(id) on delete restrict,
  slot_range tstzrange not null,
  slot_start timestamptz generated always as (lower(slot_range)) stored,
  slot_end timestamptz generated always as (upper(slot_range)) stored,
  status text not null check (status in ('PENDING_HOLD', 'CONFIRMED', 'CANCELLED', 'MAINTENANCE')),
  user_id uuid references auth.users(id) on delete set null,
  hold_expires_at timestamptz,
  booking_reference text unique,
  checkout_request_id text unique,
  amount_minor integer check (amount_minor is null or amount_minor > 0),
  payment_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_slot_range_not_empty check (not isempty(slot_range)),
  constraint reservations_hold_expiry_required check (status <> 'PENDING_HOLD' or hold_expires_at is not null),
  constraint reservations_no_overlap exclude using gist (
    pitch_id with =,
    slot_range with &&
  )
  where (status in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE'))
);

create index if not exists reservations_active_horizon_gist_idx
  on public.reservations using gist (pitch_id, slot_range)
  where status <> 'CANCELLED';

create index if not exists reservations_user_created_idx
  on public.reservations (user_id, created_at desc);

create index if not exists reservations_booking_reference_idx
  on public.reservations (booking_reference)
  where booking_reference is not null;

create table if not exists public.webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  payload jsonb not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSED', 'FAILED')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint webhook_inbox_provider_external_unique unique (provider, external_id)
);

create table if not exists public.financial_ledger (
  id uuid not null default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete restrict,
  amount_minor integer not null check (amount_minor > 0),
  type text not null check (type in ('DEBIT', 'CREDIT')),
  provider text not null default 'MPESA',
  external_id text not null,
  recorded_at timestamptz not null default now(),
  primary key (id, recorded_at)
) partition by range (recorded_at);

create table if not exists public.financial_ledger_2026 partition of public.financial_ledger
  for values from ('2026-01-01 00:00:00+00') to ('2027-01-01 00:00:00+00');

create table if not exists public.financial_ledger_2027 partition of public.financial_ledger
  for values from ('2027-01-01 00:00:00+00') to ('2028-01-01 00:00:00+00');

create unique index if not exists financial_ledger_external_id_recorded_idx
  on public.financial_ledger (provider, external_id, recorded_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pitches_touch_updated_at on public.pitches;
create trigger pitches_touch_updated_at
before update on public.pitches
for each row execute function public.touch_updated_at();

drop trigger if exists reservations_touch_updated_at on public.reservations;
create trigger reservations_touch_updated_at
before update on public.reservations
for each row execute function public.touch_updated_at();

create or replace function public.expire_stale_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.reservations
  set status = 'CANCELLED',
      payment_error = coalesce(payment_error, 'Hold expired before payment confirmation.')
  where status = 'PENDING_HOLD'
    and hold_expires_at <= now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.try_hold_reservation_slot(
  p_pitch_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz,
  p_amount_minor integer
)
returns table (
  reservation_id uuid,
  pitch_id uuid,
  slot_start timestamptz,
  slot_end timestamptz,
  status text,
  hold_expires_at timestamptz,
  booking_reference text,
  amount_minor integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reservation public.reservations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  if p_slot_end <= p_slot_start then
    raise exception 'Slot end must be after slot start.' using errcode = '22007';
  end if;

  perform public.expire_stale_holds();

  insert into public.reservations (
    pitch_id,
    slot_range,
    status,
    user_id,
    hold_expires_at,
    booking_reference,
    amount_minor
  )
  values (
    p_pitch_id,
    tstzrange(p_slot_start, p_slot_end, '[)'),
    'PENDING_HOLD',
    v_user_id,
    now() + interval '5 minutes',
    'PB-' || upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12)),
    p_amount_minor
  )
  returning * into v_reservation;

  return query
  select
    v_reservation.id,
    v_reservation.pitch_id,
    lower(v_reservation.slot_range),
    upper(v_reservation.slot_range),
    v_reservation.status,
    v_reservation.hold_expires_at,
    v_reservation.booking_reference,
    v_reservation.amount_minor;
exception
  when exclusion_violation then
    raise exception 'Slot conflict.' using errcode = '23P01';
  when serialization_failure then
    raise exception 'Reservation race detected.' using errcode = '40001';
end;
$$;

create or replace function public.assign_mpesa_checkout(
  p_reservation_id uuid,
  p_booking_reference text,
  p_checkout_request_id text
)
returns table (
  reservation_id uuid,
  booking_reference text,
  checkout_request_id text,
  hold_expires_at timestamptz,
  amount_minor integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_reservation public.reservations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required.' using errcode = '28000';
  end if;

  perform public.expire_stale_holds();

  update public.reservations
  set checkout_request_id = p_checkout_request_id
  where id = p_reservation_id
    and booking_reference = p_booking_reference
    and user_id = v_user_id
    and status = 'PENDING_HOLD'
    and hold_expires_at > now()
  returning * into v_reservation;

  if not found then
    raise exception 'Active reservation hold not found.' using errcode = 'P0002';
  end if;

  return query
  select v_reservation.id, v_reservation.booking_reference, v_reservation.checkout_request_id, v_reservation.hold_expires_at, v_reservation.amount_minor;
end;
$$;

create or replace function public.process_mpesa_webhook(
  p_external_id text,
  p_payload jsonb,
  p_success boolean,
  p_result_message text,
  p_amount_minor integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inbox public.webhook_inbox%rowtype;
  v_reservation public.reservations%rowtype;
begin
  insert into public.webhook_inbox(provider, external_id, payload, status)
  values ('MPESA', p_external_id, p_payload, 'PENDING')
  on conflict (provider, external_id) do update
    set payload = excluded.payload
  returning * into v_inbox;

  select *
  into v_inbox
  from public.webhook_inbox
  where provider = 'MPESA'
    and external_id = p_external_id
  for update;

  if v_inbox.status = 'PROCESSED' then
    return jsonb_build_object('status', 'duplicate_ignored', 'external_id', p_external_id);
  end if;

  select *
  into v_reservation
  from public.reservations
  where checkout_request_id = p_external_id
  for update;

  if not found then
    update public.webhook_inbox
    set status = 'FAILED',
        error_message = 'Reservation not found for checkout request.',
        processed_at = now()
    where id = v_inbox.id;
    return jsonb_build_object('status', 'failed', 'reason', 'reservation_not_found');
  end if;

  if p_success then
    update public.reservations
    set status = 'CONFIRMED',
        payment_error = null
    where id = v_reservation.id
      and status = 'PENDING_HOLD'
    returning * into v_reservation;

    if not found then
      update public.webhook_inbox
      set status = 'FAILED',
          error_message = 'Reservation was no longer payable.',
          processed_at = now()
      where id = v_inbox.id;
      return jsonb_build_object('status', 'failed', 'reason', 'reservation_not_payable');
    end if;

    insert into public.financial_ledger(reservation_id, amount_minor, type, provider, external_id)
    values (v_reservation.id, coalesce(p_amount_minor, v_reservation.amount_minor), 'CREDIT', 'MPESA', p_external_id);
  else
    update public.reservations
    set status = 'CANCELLED',
        payment_error = coalesce(p_result_message, 'Payment was not completed.')
    where id = v_reservation.id
      and status = 'PENDING_HOLD';
  end if;

  update public.webhook_inbox
  set status = 'PROCESSED',
      processed_at = now(),
      error_message = null
  where id = v_inbox.id;

  return jsonb_build_object('status', 'processed', 'reservation_id', v_reservation.id);
exception
  when serialization_failure or deadlock_detected or lock_not_available then
    update public.webhook_inbox
    set status = 'FAILED',
        error_message = sqlerrm,
        processed_at = now()
    where provider = 'MPESA'
      and external_id = p_external_id;
    return jsonb_build_object('status', 'retry_required', 'external_id', p_external_id);
end;
$$;

alter table public.pitches enable row level security;
alter table public.reservations enable row level security;
alter table public.webhook_inbox enable row level security;
alter table public.financial_ledger enable row level security;

drop policy if exists "Public can view active pitches" on public.pitches;
create policy "Public can view active pitches"
on public.pitches for select
using (is_active = true);

drop policy if exists "Customers can read own reservations" on public.reservations;
create policy "Customers can read own reservations"
on public.reservations for select
using (user_id = auth.uid());

drop policy if exists "Authenticated users can observe active reservation occupancy" on public.reservations;
create policy "Authenticated users can observe active reservation occupancy"
on public.reservations for select
using (auth.uid() is not null and status in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE'));

drop policy if exists "Customers can create own pending holds" on public.reservations;
create policy "Customers can create own pending holds"
on public.reservations for insert
with check (user_id = auth.uid() and status = 'PENDING_HOLD');

drop policy if exists "Customers can cancel own pending holds" on public.reservations;
create policy "Customers can cancel own pending holds"
on public.reservations for update
using (user_id = auth.uid() and status = 'PENDING_HOLD')
with check (user_id = auth.uid() and status = 'CANCELLED');

revoke all on public.webhook_inbox from anon, authenticated;
revoke all on public.financial_ledger from anon, authenticated;
grant select on public.pitches to anon, authenticated;
grant select, insert, update on public.reservations to authenticated;
grant execute on function public.try_hold_reservation_slot(uuid, timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.assign_mpesa_checkout(uuid, text, text) to authenticated;
revoke execute on function public.process_mpesa_webhook(text, jsonb, boolean, text, integer) from anon, authenticated;

alter publication supabase_realtime add table public.reservations;
