"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { CheckCircle2, Loader2, Phone, ShieldCheck, TimerReset, ArrowLeft, Landmark, Zap } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useReservationTimer } from "@/hooks/useReservationTimer";
import { PaymentStatusPoller } from "@/components/PaymentStatusPoller";
import type { HoldResult, PaymentFailure, Reservation } from "@/types/booking";

interface CheckoutWizardProps {
  hold: HoldResult;
  onExpiredRedirect: () => void;
  onConfirmed?: (reservation: Reservation) => void;
  onCancel?: () => void;
}

type CheckoutState = "HOLD_ACTIVE" | "SUBMITTING_PAYMENT" | "WAITING_FOR_CONFIRMATION" | "CONFIRMED" | "FAILED" | "EXPIRED";

function normalizeKenyanPhone(input: string): string {
  const trimmed = input.trim().replace(/[\s().-]/g, "");
  if (/^\+2547\d{8}$/.test(trimmed) || /^\+2541\d{8}$/.test(trimmed)) return trimmed;
  if (/^254(7|1)\d{8}$/.test(trimmed)) return `+${trimmed}`;
  if (/^0(7|1)\d{8}$/.test(trimmed)) return `+254${trimmed.slice(1)}`;
  if (/^(7|1)\d{8}$/.test(trimmed)) return `+254${trimmed}`;
  throw new Error("Enter a valid Safaricom number, for example 0712345678.");
}

export function CheckoutWizard({ hold, onExpiredRedirect, onConfirmed, onCancel }: CheckoutWizardProps) {
  const [phone, setPhone] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [state, setState] = useState<CheckoutState>("HOLD_ACTIVE");
  const [failure, setFailure] = useState<PaymentFailure | null>(null);

  const locked = state === "SUBMITTING_PAYMENT" || state === "WAITING_FOR_CONFIRMATION" || state === "CONFIRMED" || state === "EXPIRED";

  // Pre-fill phone from Captain Settings
  useEffect(() => {
    const saved = window.localStorage.getItem("kahawa-prefill-phone") || "";
    if (saved) {
      setPhone(saved);
    }
  }, []);

  const timer = useReservationTimer({
    expiresAt: hold.hold_expires_at,
    onExpire: () => {
      setState("EXPIRED");
    }
  });

  // Calculate circular progress metrics (5 minutes = 300,000ms)
  const totalHoldMs = 5 * 60 * 1000;
  const percentLeft = Math.max(0, Math.min(100, (timer.remainingMs / totalHoldMs) * 100));
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // 251.32
  const strokeDashoffset = circumference - (percentLeft / 100) * circumference;

  const isUrgent = timer.remainingMs < 60 * 1000; // Less than 60 seconds

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0
    }).format(hold.amount_minor / 100);
  }, [hold.amount_minor]);

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked || timer.expired) return;

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeKenyanPhone(phone);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enter a valid Safaricom number.");
      return;
    }

    setFailure(null);
    setState("SUBMITTING_PAYMENT");

    // Save phone number prefill locally for faster next bookings
    window.localStorage.setItem("kahawa-prefill-phone", phone);

    // LOCAL DEMO MODE: If reservation is a mock hold, skip external network call
    const isMock = hold.reservation_id.startsWith("mock-res");
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network STK Push trigger
      setCheckoutRequestId(`mock-checkout-${Math.random().toString(36).substr(2, 9)}`);
      setState("WAITING_FOR_CONFIRMATION");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      setState("HOLD_ACTIVE");
      toast.error("Please sign in again before paying.");
      return;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mpesa-stk-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session.access_token}`
      },
      body: JSON.stringify({
        reservation_id: hold.reservation_id,
        phone_number: normalizedPhone,
        booking_reference: hold.booking_reference
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.checkout_request_id) {
      setState("HOLD_ACTIVE");
      toast.error(payload.error ?? "We could not start the payment request. Please try again.");
      return;
    }

    setCheckoutRequestId(String(payload.checkout_request_id));
    setState("WAITING_FOR_CONFIRMATION");
  };

  const handleFailure = (nextFailure: PaymentFailure) => {
    setFailure(nextFailure);
    setState("FAILED");
  };

  const resetAfterFailure = () => {
    setFailure(null);
    setCheckoutRequestId(null);
    setState("HOLD_ACTIVE");
  };

  const handleConfirmed = (reservation: Reservation) => {
    setState("CONFIRMED");
    onConfirmed?.(reservation);
  };

  // 1. Expired state rendering (Modal)
  if (state === "EXPIRED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-md rounded-2xl glass-panel p-8 text-center border-orange/40 shadow-[0_0_50px_rgba(255,107,44,0.15)] animate-slide-up">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange/10 mb-4 border border-orange/20">
            <TimerReset className="h-7 w-7 text-orange text-glow-orange animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="font-heading text-2xl uppercase tracking-wider text-white-soft">Hold Expired</h2>
          <p className="mt-3 text-sm text-gray-muted leading-relaxed">
            The exclusive 5-minute checkout reservation hold ended. The slot has been released back to other Captains.
          </p>
          <button
            type="button"
            onClick={onExpiredRedirect}
            className="mt-6 w-full h-11 rounded-xl btn-electric font-heading uppercase tracking-widest text-sm"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  // 2. Waiting for confirmation
  if (state === "WAITING_FOR_CONFIRMATION" && checkoutRequestId) {
    return (
      <div className="max-w-md mx-auto">
        <PaymentStatusPoller
          reservationId={hold.reservation_id}
          bookingReference={hold.booking_reference}
          checkoutRequestId={checkoutRequestId}
          holdExpiresAt={hold.hold_expires_at}
          onConfirmed={handleConfirmed}
          onFailure={handleFailure}
          onExpired={() => setState("EXPIRED")}
          onReturnToHold={resetAfterFailure}
        />
      </div>
    );
  }

  // 3. Confirmed state rendering
  if (state === "CONFIRMED") {
    return (
      <section className="max-w-md mx-auto rounded-2xl glass-panel-glow border-green-electric/25 p-8 text-center shadow-xl animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 mb-4">
          <CheckCircle2 className="h-9 w-9 text-[#00FF87] text-glow-green" />
        </div>
        <h2 className="font-heading text-2xl uppercase tracking-wider text-white-soft">Booking Secured!</h2>
        <p className="mt-2 text-sm text-gray-muted">Your pitch booking is locked in. Get ready for kickoff!</p>
        <div className="mt-6 p-4 rounded-xl bg-[#0A0F2C]/60 border border-cyan-blue/15 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-muted font-heading uppercase">Voucher Code</span>
            <strong className="text-white-soft tracking-wider font-mono">{hold.booking_reference}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-muted font-heading uppercase">Receipt Status</span>
            <strong className="text-[#00FF87] text-glow-green font-heading uppercase">Processed</strong>
          </div>
        </div>
        <button
          onClick={onExpiredRedirect}
          className="mt-6 w-full h-11 rounded-xl btn-electric font-heading uppercase tracking-widest text-sm"
        >
          View Live Board
        </button>
      </section>
    );
  }

  // 4. Default active hold checkout wizard view
  return (
    <section className="max-w-xl mx-auto rounded-2xl glass-panel border-cyan-blue/10 shadow-2xl overflow-hidden animate-slide-up">
      
      {/* Timer Bar & Title */}
      <div className="flex flex-col gap-4 border-b border-cyan-blue/10 bg-[#1a1f3a]/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-wider text-white-soft flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#60EFFF] text-glow-cyan" />
            Complete Checkout
          </h2>
          <p className="text-xs text-gray-muted font-mono tracking-wider mt-0.5">Reference: {hold.booking_reference}</p>
        </div>

        {/* Circular Progress Timer */}
        <div className="flex items-center gap-4 bg-navy-deep px-4 py-2.5 rounded-xl border border-cyan-blue/10">
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="circular-timer-svg absolute h-full w-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-navy-panel/80 fill-transparent"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`fill-transparent transition-all duration-300 ${isUrgent ? "stroke-red-500 text-red-500 animate-pulse-glow" : "stroke-orange"}`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className={`font-heading text-xs font-bold tabular-nums z-10 ${isUrgent ? "text-red-500 animate-pulse" : "text-orange text-glow-orange"}`}>
              {timer.formatted}
            </span>
          </div>
          <div className="text-left">
            <span className="block text-[9px] uppercase tracking-wider text-gray-muted font-heading">Hold Expiry</span>
            <span className={`text-xs font-bold font-heading uppercase ${isUrgent ? "text-red-500" : "text-white-soft"}`}>
              {isUrgent ? "HURRY - Exiting" : "Guaranteed Hold"}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={submitPayment} className="space-y-6 p-6">
        
        {/* Cost Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-navy-deep/80 border border-cyan-blue/10 p-4">
            <span className="text-[10px] font-heading uppercase tracking-wider text-gray-muted">Required Deposit</span>
            <strong className="mt-1.5 block text-2xl text-[#00FF87] font-heading font-extrabold text-glow-green tabular-nums">
              {formattedAmount}
            </strong>
          </div>
          <div className="rounded-xl bg-navy-deep/80 border border-cyan-blue/10 p-4 flex flex-col justify-center">
            <span className="text-[10px] font-heading uppercase tracking-wider text-gray-muted">Lock State</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Zap className="h-4 w-4 text-orange text-glow-orange" />
              <strong className="text-white-soft font-heading uppercase text-sm">Hold Secured</strong>
            </div>
          </div>
        </div>

        {failure ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
            <p>{failure.message}</p>
          </div>
        ) : null}

        {/* Input Panel */}
        <div className="space-y-2">
          <label className="block text-xs font-heading uppercase tracking-widest text-gray-muted">
            Safaricom M-Pesa Number
          </label>
          <div className="flex h-12 items-center gap-3 rounded-xl bg-navy-deep/80 border border-cyan-blue/15 px-4 focus-within:border-[#60EFFF] focus-within:ring-1 focus-within:ring-[#60EFFF]/30 transition duration-300">
            <Phone className="h-5 w-5 text-gray-muted" />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={locked}
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 0712345678"
              className="min-w-0 flex-1 bg-transparent text-sm text-white-soft outline-none placeholder:text-gray-muted/40 disabled:text-gray-muted"
            />
          </div>
          <p className="text-[10px] text-gray-muted italic leading-relaxed">
            Enter your Safaricom mobile number. Clicking Pay fires an STK Push PIN prompt to your handset.
          </p>
        </div>

        {/* Checkout Wizard Actions */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={failure ? resetAfterFailure : onCancel}
            disabled={state === "SUBMITTING_PAYMENT"}
            className="h-12 flex items-center justify-center gap-2 rounded-xl border border-cyan-blue/15 px-5 font-heading text-xs uppercase tracking-widest text-white-soft hover:bg-[#1a1f3a]/80 active:scale-98 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="h-4 w-4" />
            {failure ? "Change Details" : "Cancel Reservation"}
          </button>
          
          <button
            type="submit"
            disabled={locked || timer.expired}
            className="h-12 flex items-center justify-center gap-2 rounded-xl btn-electric px-6 font-heading text-xs uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
          >
            {state === "SUBMITTING_PAYMENT" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-navy-deep" />
                Triggering PIN Prompt...
              </>
            ) : (
              <>
                <Landmark className="h-4 w-4 text-navy-deep" />
                Pay via M-Pesa
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
