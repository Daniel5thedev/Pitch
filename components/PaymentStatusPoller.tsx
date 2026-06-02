"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useReservationTimer } from "@/hooks/useReservationTimer";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import type { PaymentFailure, Reservation } from "@/types/booking";

interface PaymentStatusPollerProps {
  reservationId: string;
  bookingReference: string;
  checkoutRequestId: string;
  holdExpiresAt: string;
  onConfirmed: (reservation: Reservation) => void;
  onFailure: (failure: PaymentFailure) => void;
  onExpired: () => void;
  onReturnToHold: () => void;
}

const BACKOFF_INTERVALS = [2000, 4000, 8000, 16000];

export function PaymentStatusPoller({
  reservationId,
  bookingReference,
  checkoutRequestId,
  holdExpiresAt,
  onConfirmed,
  onFailure,
  onExpired,
  onReturnToHold
}: PaymentStatusPollerProps) {
  const [message, setMessage] = useState("Awaiting M-Pesa Callback Receipt");
  const [logs, setLogs] = useState<string[]>([
    "Initialising transaction channel...",
    "Listening on Postgres changes for reservation...",
    "Checkout STK push sent successfully."
  ]);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [failed, setFailed] = useState<PaymentFailure | null>(null);
  const stoppedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const addLog = (text: string) => {
    setLogs(curr => [...curr.slice(-3), text]);
  };

  const timer = useReservationTimer({
    expiresAt: holdExpiresAt,
    onExpire: () => {
      if (!stoppedRef.current && !confirmedReservation) {
        stoppedRef.current = true;
        onExpired();
      }
    }
  });

  const clearScheduledPoll = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resolveConfirmed = useCallback((reservation: Reservation) => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    clearScheduledPoll();
    setConfirmedReservation(reservation);
    setMessage("Payment Confirmed!");
    addLog("Receipt validated. Booking officially active.");
    window.setTimeout(() => onConfirmed(reservation), 2000); // 2 seconds to admire the checkmark!
  }, [clearScheduledPoll, onConfirmed]);

  const resolveFailed = useCallback((failure: PaymentFailure) => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    clearScheduledPoll();
    setFailed(failure);
    onFailure(failure);
  }, [clearScheduledPoll, onFailure]);

  const inspectReservation = useCallback((reservation: Reservation | null) => {
    if (!reservation) return;
    if (reservation.id !== reservationId) return;

    if (reservation.status === "CONFIRMED") {
      resolveConfirmed(reservation);
      return;
    }
    if (reservation.status === "CANCELLED") {
      resolveFailed({
        message: reservation.payment_error || "Transaction was cancelled or declined. Please check details and try again.",
        code: "PAYMENT_CANCELLED"
      });
    }
  }, [reservationId, resolveConfirmed, resolveFailed]);

  const realtime = useSupabaseRealtime({
    bookingReference,
    onReservationChange: (_event, reservation) => {
      addLog("Realtime broadcast update captured.");
      inspectReservation(reservation);
    }
  });

  const poll = useCallback(async () => {
    if (stoppedRef.current) return;
    const supabase = getSupabaseBrowserClient();
    
    addLog(`Performing check attempt #${attemptRef.current + 1}...`);
    
    const { data, error } = await supabase
      .from("reservations")
      .select("id,pitch_id,user_id,slot_start,slot_end,status,hold_expires_at,booking_reference,checkout_request_id,amount_minor,payment_error,created_at,updated_at")
      .eq("id", reservationId)
      .eq("booking_reference", bookingReference)
      .single();

    if (!error && data) {
      inspectReservation(data as Reservation);
    }

    if (stoppedRef.current) return;
    const interval = BACKOFF_INTERVALS[Math.min(attemptRef.current, BACKOFF_INTERVALS.length - 1)];
    attemptRef.current += 1;
    
    if (attemptRef.current > 2) {
      setMessage("Awaiting payment network response. Do not close.");
    }
    
    timeoutRef.current = window.setTimeout(poll, interval);
  }, [bookingReference, inspectReservation, reservationId]);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(poll, BACKOFF_INTERVALS[0]);
    return () => {
      stoppedRef.current = true;
      clearScheduledPoll();
    };
  }, [clearScheduledPoll, poll]);

  // 1. Success with self-drawing SVG checkmark
  if (confirmedReservation) {
    return (
      <section className="rounded-2xl glass-panel-glow border-green-electric/25 p-8 text-center shadow-xl animate-scale-in">
        {/* Self-drawing green checkmark */}
        <div className="mx-auto h-20 w-20 flex items-center justify-center">
          <svg className="h-16 w-16 text-[#00FF87] text-glow-green" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="25" stroke="#00FF87" strokeWidth="2.5" fill="none">
              <animate attributeName="stroke-dasharray" from="0 157" to="157 157" dur="0.6s" fill="freeze" />
            </circle>
            <path d="M14 27l7.5 7.5 16.5-16.5" stroke="#00FF87" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="stroke-dashoffset" from="50" to="0" dur="0.4s" begin="0.6s" fill="freeze" />
              <animate attributeName="stroke-dasharray" from="50" to="50" dur="0.4s" begin="0.6s" fill="freeze" />
            </path>
          </svg>
        </div>
        <h2 className="mt-4 font-heading text-2xl uppercase tracking-wider text-white-soft">Payment Confirmed</h2>
        <p className="text-xs text-[#00FF87] text-glow-green font-heading uppercase tracking-widest mt-1">Securing Voucher...</p>
        
        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-[#0A0F2C]/60 border border-cyan-blue/15 p-4 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-muted font-heading uppercase">Voucher Code</span>
            <strong className="text-white-soft tracking-wider font-mono">{bookingReference}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-muted font-heading uppercase">STK Request ID</span>
            <strong className="text-white-soft tracking-wider font-mono text-right truncate max-w-[150px]">{checkoutRequestId.slice(0, 16)}...</strong>
          </div>
        </div>
      </section>
    );
  }

  // 2. Clear error state (friendly, orange warning, simple action button)
  if (failed) {
    return (
      <section className="rounded-2xl glass-panel border-orange/20 p-6 shadow-xl animate-fade-in text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange/15 border border-orange/20 mb-4">
          <AlertCircle className="h-6 w-6 text-orange text-glow-orange" />
        </div>
        <h2 className="font-heading text-xl uppercase tracking-wider text-white-soft">Payment Not Completed</h2>
        <p className="mt-2 text-xs text-gray-muted leading-relaxed max-w-xs mx-auto">
          {failed.message}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onReturnToHold}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-orange hover:bg-orange/90 text-white font-heading text-xs uppercase tracking-widest transition"
          >
            <RotateCcw className="h-4 w-4" />
            Retry checkout details
          </button>
        </div>
      </section>
    );
  }

  // 3. Pending loading / polling state (with custom spinner styled with green/cyan)
  return (
    <section className="rounded-2xl glass-panel border-cyan-blue/10 p-6 shadow-2xl animate-slide-up text-center">
      
      {/* Custom spinner styled with green & cyan */}
      <div className="relative mx-auto h-16 w-16 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-blue/10" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#00FF87] border-r-[#60EFFF] animate-spin" style={{ animationDuration: '0.8s' }} />
        <ShieldCheck className="h-6 w-6 text-[#60EFFF] text-glow-cyan animate-pulse" />
      </div>

      <h2 className="font-heading text-xl uppercase tracking-wider text-white-soft">{message}</h2>
      <p className="mt-2 text-xs text-gray-muted leading-relaxed max-w-xs mx-auto">
        Please verify the STK Push prompt on your handset and input your M-Pesa PIN.
      </p>

      {/* Timer Badge */}
      <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-orange/15 border border-orange/20 px-4 py-2 text-xs font-heading uppercase tracking-widest text-orange text-glow-orange">
        <span>Hold Expires In:</span>
        <span className="font-bold tabular-nums">{timer.formatted}</span>
      </div>

      {/* Live Sync Log Dashboard */}
      <div className="mt-6 border border-cyan-blue/10 bg-[#0A0F2C]/80 rounded-xl p-3 text-left font-mono text-[9px] text-gray-muted space-y-1">
        <div className="flex justify-between border-b border-cyan-blue/5 pb-1 mb-1.5 font-heading font-bold text-[8px] uppercase tracking-widest">
          <span>Realtime Listen log</span>
          <span className="text-[#60EFFF]">{realtime.connected ? "connected" : "syncing..."}</span>
        </div>
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-1.5 items-center">
            <span className="text-glow-cyan text-[#60EFFF] font-bold">&gt;</span>
            <span className="truncate">{log}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
