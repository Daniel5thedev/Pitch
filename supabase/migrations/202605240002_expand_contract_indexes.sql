create index if not exists reservations_status_hold_expiry_idx
  on public.reservations (status, hold_expires_at)
  where status = 'PENDING_HOLD';

create index if not exists webhook_inbox_retry_idx
  on public.webhook_inbox (status, created_at)
  where status = 'FAILED';

create index if not exists financial_ledger_reservation_recorded_idx
  on public.financial_ledger (reservation_id, recorded_at desc);
