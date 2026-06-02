-- =====================================================================
-- KAHAWA SPORT ARENA - COMPLETE DATABASE SETUP SCRIPT
-- =====================================================================
-- This script creates the database schema, tables, relationships,
-- functions, triggers, security policies, and seed data for the
-- real-time football pitch booking platform.
-- Run this in the Supabase SQL Editor.
-- =====================================================================

-- Clean up existing resources (optional, run from scratch)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists wallet_transactions_update_balance on public.wallet_transactions;
drop trigger if exists enforce_pitch_relationships_overlap on public.reservations;
drop trigger if exists pitches_touch_updated_at on public.pitches;
drop trigger if exists reservations_touch_updated_at on public.reservations;
drop trigger if exists profiles_touch_updated_at on public.profiles;
drop trigger if exists wallets_touch_updated_at on public.wallets;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_wallet_balance() cascade;
drop function if exists public.check_pitch_relationship_overlap() cascade;
drop function if exists public.expire_stale_holds() cascade;
drop function if exists public.try_hold_reservation_slot(uuid, timestamptz, timestamptz, integer) cascade;
drop function if exists public.assign_mpesa_checkout(uuid, text, text) cascade;
drop function if exists public.process_mpesa_webhook(text, jsonb, boolean, text, integer) cascade;
drop function if exists public.touch_updated_at() cascade;

drop table if exists public.wallet_transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.profiles cascade;
drop table if exists public.financial_ledger cascade;
drop table if exists public.webhook_inbox cascade;
drop table if exists public.reservations cascade;
drop table if exists public.pitches cascade;

-- Enable PostgreSQL extensions
create extension if not exists btree_gist;
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 1. PITCHES TABLE (Self-referencing parent_id to support split layouts)
create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.pitches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. USER PROFILES TABLE (Associated with Supabase Auth users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. DIGITAL WALLETS TABLE (Stores refund balances)
create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_minor integer not null default 0 check (balance_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. WALLET TRANSACTIONS LEDGER (Credits and Debits)
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_minor integer not null, -- positive for credit/refund, negative for payment debits
  type text not null check (type in ('REFUND', 'PAYMENT', 'TOPUP')),
  reference_id uuid, -- e.g. reservation_id
  created_at timestamptz not null default now()
);

-- 5. RESERVATIONS TABLE (Master schedule with slot exclusions)
create table public.reservations (
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

-- 6. WEBHOOK INBOX (Saves raw callbacks for M-Pesa network reliability)
create table public.webhook_inbox (
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

-- 7. FINANCIAL LEDGER (Record of absolute payments)
create table public.financial_ledger (
  id uuid not null default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete restrict,
  amount_minor integer not null check (amount_minor > 0),
  type text not null check (type in ('DEBIT', 'CREDIT')),
  provider text not null default 'MPESA',
  external_id text not null,
  recorded_at timestamptz not null default now(),
  primary key (id, recorded_at)
) partition by range (recorded_at);

-- Create ledger partitions
create table public.financial_ledger_2026 partition of public.financial_ledger
  for values from ('2026-01-01 00:00:00+00') to ('2027-01-01 00:00:00+00');

create table public.financial_ledger_2027 partition of public.financial_ledger
  for values from ('2027-01-01 00:00:00+00') to ('2028-01-01 00:00:00+00');


-- =====================================================================
-- INDEXES & PERFORMANCE OPTIMISATIONS
-- =====================================================================
create index if not exists reservations_active_horizon_gist_idx
  on public.reservations using gist (pitch_id, slot_range)
  where status <> 'CANCELLED';

create index if not exists reservations_user_created_idx
  on public.reservations (user_id, created_at desc);

create index if not exists reservations_booking_reference_idx
  on public.reservations (booking_reference)
  where booking_reference is not null;

create index if not exists reservations_status_hold_expiry_idx
  on public.reservations (status, hold_expires_at)
  where status = 'PENDING_HOLD';

create index if not exists webhook_inbox_retry_idx
  on public.webhook_inbox (status, created_at)
  where status = 'FAILED';

create index if not exists financial_ledger_reservation_recorded_idx
  on public.financial_ledger (reservation_id, recorded_at desc);

create unique index if not exists financial_ledger_external_id_recorded_idx
  on public.financial_ledger (provider, external_id, recorded_at);


-- =====================================================================
-- TRIGGER FUNCTIONS & BUSINESS RULE ENFORCEMENT
-- =====================================================================

-- Updated_at helper trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pitches_touch_updated_at before update on public.pitches for each row execute function public.touch_updated_at();
create trigger reservations_touch_updated_at before update on public.reservations for each row execute function public.touch_updated_at();
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
create trigger wallets_touch_updated_at before update on public.wallets for each row execute function public.touch_updated_at();

-- Wallet balance auto-updater
create or replace function public.update_wallet_balance()
returns trigger language plpgsql security definer as $$
begin
  insert into public.wallets (user_id, balance_minor)
  values (NEW.user_id, NEW.amount_minor)
  on conflict (user_id) do update
  set balance_minor = public.wallets.balance_minor + NEW.amount_minor,
      updated_at = now();
  return NEW;
end;
$$;

create trigger wallet_transactions_update_balance
after insert on public.wallet_transactions
for each row execute function public.update_wallet_balance();

-- Auth handler: Auto-creates Profiles & Wallets on User Signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Captain ' || upper(substr(new.id::text, 1, 4))),
    new.raw_user_meta_data->>'phone_number'
  );

  insert into public.wallets (user_id, balance_minor)
  values (new.id, 0);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- PHYSICAL PITCH SPLITTING RELATIONSHIP OVERLAP ENFORCER
-- Ensures child pitches block parents and parent pitches block children.
create or replace function public.check_pitch_relationship_overlap()
returns trigger language plpgsql security definer as $$
declare
  v_conflict_ref text;
begin
  if NEW.status not in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE') then
    return NEW;
  end if;

  select r.booking_reference into v_conflict_ref
  from public.reservations r
  join public.pitches p_r on p_r.id = r.pitch_id
  join public.pitches p_new on p_new.id = NEW.pitch_id
  where r.status in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE')
    and r.id <> coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and r.slot_range && NEW.slot_range
    and (
      p_r.parent_id = NEW.pitch_id -- NEW is parent of reservation r
      or
      p_new.parent_id = r.pitch_id -- NEW is child of reservation r
    )
  limit 1;

  if v_conflict_ref is not null then
    raise exception 'Conflict: Slot overlaps with active reservation (%) on a physically overlapping layout.', v_conflict_ref
      using errcode = '23P01';
  end if;

  return NEW;
end;
$$;

create trigger enforce_pitch_relationships_overlap
before insert or update on public.reservations
for each row execute function public.check_pitch_relationship_overlap();


-- =====================================================================
-- EXPLICIT SYSTEM APIS (RPCs)
-- =====================================================================

-- Clean up stale reservation holds
create or replace function public.expire_stale_holds()
returns integer language plpgsql security definer set search_path = public as $$
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

-- Create hold on open slots
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
) language plpgsql security definer set search_path = public as $$
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

-- Tethers checkout request token to reservation hold
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
) language plpgsql security definer set search_path = public as $$
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


-- =====================================================================
-- MOBILE MONEY SAFETY MAILBOX IMPLEMENTATION (process_mpesa_webhook)
-- =====================================================================
create or replace function public.process_mpesa_webhook(
  p_external_id text,
  p_payload jsonb,
  p_success boolean,
  p_result_message text,
  p_amount_minor integer
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_inbox public.webhook_inbox%rowtype;
  v_reservation public.reservations%rowtype;
  v_overlapping_ref text;
begin
  -- 1. LOCK WEBHOOK IN WEBHOOK INBOX (Ensures no webhook double-processing)
  insert into public.webhook_inbox(provider, external_id, payload, status)
  values ('MPESA', p_external_id, p_payload, 'PENDING')
  on conflict (provider, external_id) do update
    set payload = excluded.payload
  returning * into v_inbox;

  select * into v_inbox from public.webhook_inbox
  where provider = 'MPESA' and external_id = p_external_id
  for update;

  if v_inbox.status = 'PROCESSED' then
    return jsonb_build_object('status', 'duplicate_ignored', 'external_id', p_external_id);
  end if;

  -- 2. FETCH AND LOCK RESERVATION ROW
  select * into v_reservation from public.reservations
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

  -- 3. PROCESS THE PAYMENT RECEIPT
  if p_success then
    -- Record incoming receipt in ledger
    insert into public.financial_ledger(reservation_id, amount_minor, type, provider, external_id)
    values (v_reservation.id, coalesce(p_amount_minor, v_reservation.amount_minor), 'CREDIT', 'MPESA', p_external_id);

    -- Try to validate and confirm the reservation
    update public.reservations
    set status = 'CONFIRMED',
        payment_error = null
    where id = v_reservation.id
      and status = 'PENDING_HOLD'
    returning * into v_reservation;

    -- CASE 2: WEBHOOK CAME LATE (timer expired but slot is still open)
    if not found and v_reservation.status = 'CANCELLED' then
      
      -- Check if any other booking occupies the same pitch or related layouts
      select r.booking_reference into v_overlapping_ref
      from public.reservations r
      join public.pitches p_r on p_r.id = r.pitch_id
      join public.pitches p_v on p_v.id = v_reservation.pitch_id
      where r.status in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE')
        and r.slot_range && v_reservation.slot_range
        and r.id <> v_reservation.id
        and (
          r.pitch_id = v_reservation.pitch_id
          or p_r.parent_id = v_reservation.pitch_id
          or p_v.parent_id = r.pitch_id
        )
      limit 1;

      if v_overlapping_ref is null then
        -- Revive the cancelled hold and confirm the reservation!
        update public.reservations
        set status = 'CONFIRMED',
            payment_error = null
        where id = v_reservation.id;
        
        update public.webhook_inbox
        set status = 'PROCESSED', processed_at = now()
        where id = v_inbox.id;
        
        return jsonb_build_object('status', 'revived_and_confirmed', 'reservation_id', v_reservation.id);
      else
        -- CASE 3: DOUBLE BOOKING DETECTED (another captain claimed it)
        -- Keep reservation as CANCELLED, but issue credit refund to user's wallet
        update public.reservations
        set payment_error = 'Slot claimed by another team. Funds refunded to wallet.'
        where id = v_reservation.id;

        -- Record wallet transaction refund
        insert into public.wallet_transactions (user_id, amount_minor, type, reference_id)
        values (v_reservation.user_id, coalesce(p_amount_minor, v_reservation.amount_minor), 'REFUND', v_reservation.id);

        update public.webhook_inbox
        set status = 'PROCESSED', processed_at = now()
        where id = v_inbox.id;

        return jsonb_build_object('status', 'slot_taken_refunded', 'reservation_id', v_reservation.id);
      end if;
    end if;

  else
    -- Webhook reports payment failed/cancelled by user
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
    where provider = 'MPESA' and external_id = p_external_id;
    return jsonb_build_object('status', 'retry_required', 'external_id', p_external_id);
end;
$$;


-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
alter table public.pitches enable row level security;
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.reservations enable row level security;
alter table public.webhook_inbox enable row level security;
alter table public.financial_ledger enable row level security;

-- 1. Pitches Policies
create policy "Public can view active pitches"
  on public.pitches for select using (is_active = true);

-- 2. Profiles Policies
create policy "Profiles are readable by owner"
  on public.profiles for select using (id = auth.uid());

create policy "Profiles can be updated by owner"
  on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Profiles can be created by owner"
  on public.profiles for insert with check (id = auth.uid());

-- 3. Wallets Policies
create policy "Wallets are readable by owner"
  on public.wallets for select using (user_id = auth.uid());

-- 4. Wallet Transactions Policies
create policy "Wallet transactions readable by owner"
  on public.wallet_transactions for select using (user_id = auth.uid());

-- 5. Reservations Policies
create policy "Customers can read own reservations"
  on public.reservations for select using (user_id = auth.uid());

create policy "Authenticated users can observe active reservation occupancy"
  on public.reservations for select
  using (auth.uid() is not null and status in ('PENDING_HOLD', 'CONFIRMED', 'MAINTENANCE'));

create policy "Customers can create own pending holds"
  on public.reservations for insert
  with check (user_id = auth.uid() and status = 'PENDING_HOLD');

create policy "Customers can cancel own pending holds"
  on public.reservations for update
  using (user_id = auth.uid() and status = 'PENDING_HOLD')
  with check (user_id = auth.uid() and status = 'CANCELLED');

-- Restrict access to ledger/webhooks
revoke all on public.webhook_inbox from anon, authenticated;
revoke all on public.financial_ledger from anon, authenticated;
grant select on public.pitches to anon, authenticated;
grant select, insert, update on public.reservations to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.wallets to authenticated;
grant select on public.wallet_transactions to authenticated;

-- Grant execution rights
grant execute on function public.try_hold_reservation_slot(uuid, timestamptz, timestamptz, integer) to authenticated;
grant execute on function public.assign_mpesa_checkout(uuid, text, text) to authenticated;
revoke execute on function public.process_mpesa_webhook(text, jsonb, boolean, text, integer) from anon, authenticated;


-- =====================================================================
-- SUPABASE REALTIME CONFIGURATION
-- =====================================================================
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.wallets;
alter publication supabase_realtime add table public.wallet_transactions;


-- =====================================================================
-- SEED DATA - MULTIPLE PITCHES WITH SPLIT RELATIONSHIPS
-- =====================================================================

-- Seed 1: Wembley Complex Layout (11-a-side split into two 5-a-side wings)
insert into public.pitches (id, name, parent_id, is_active) values
  ('d1111111-1111-1111-1111-111111111111', 'Kahawa Wembley Grand (11-a-side)', null, true),
  ('d2222222-2222-2222-2222-222222222222', 'Wembley East Wing (5-a-side)', 'd1111111-1111-1111-1111-111111111111', true),
  ('d3333333-3333-3333-3333-333333333333', 'Wembley West Wing (5-a-side)', 'd1111111-1111-1111-1111-111111111111', true);

-- Seed 2: Camp Nou Arena (Independent 7-a-side pitch)
insert into public.pitches (id, name, parent_id, is_active) values
  ('d4444444-4444-4444-4444-444444444444', 'Kahawa Camp Nou (7-a-side)', null, true);
