"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, Lock, Timer, Info, Sparkles, Filter, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useFeatureFlags } from "@/components/FeatureFlags";
import type { CalendarSlot, HoldResult, Pitch, Reservation, SlotStatus } from "@/types/booking";

interface BookingCalendarProps {
  initialPitches: Pitch[];
  initialReservations?: Reservation[];
  day: string;
  openHour?: number;
  closeHour?: number;
  slotMinutes?: number;
  amountMinor: number;
  onHoldCreated: (hold: HoldResult) => void;
  currentUserId?: string;
}

const LOCKED_STATUSES: SlotStatus[] = [
  "PENDING_HOLD",
  "CONFIRMED",
  "MAINTENANCE",
  "PARENT_BOOKED",
  "CHILD_BOOKED",
  "PARENT_SELECTED",
  "CHILD_SELECTED"
];

function isoAt(day: string, hour: number, minute: number) {
  const date = new Date(`${day}T00:00:00.000`);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function slotId(pitchId: string, startsAt: string) {
  return `${pitchId}:${startsAt}`;
}

function overlaps(slotStart: string, slotEnd: string, reservation: Reservation) {
  const start = new Date(slotStart).getTime();
  const end = new Date(slotEnd).getTime();
  const reservationStart = new Date(reservation.slot_start).getTime();
  const reservationEnd = new Date(reservation.slot_end).getTime();
  return start < reservationEnd && reservationStart < end;
}

function statusLabel(status: SlotStatus) {
  if (status === "OPEN") return "Available";
  if (status === "OPTIMISTIC_HOLD") return "Holding...";
  if (status === "PENDING_HOLD") return "Held";
  if (status === "CONFIRMED") return "Booked";
  if (status === "MAINTENANCE") return "Blocked";
  if (status === "PARENT_BOOKED") return "Locked (11s Occupied)";
  if (status === "CHILD_BOOKED") return "Partially Occupied";
  if (status === "PARENT_SELECTED") return "Locked (11s Selected)";
  if (status === "CHILD_SELECTED") return "Partially Selected";
  return "Closed";
}

export function BookingCalendar({
  initialPitches,
  initialReservations = [],
  day,
  openHour = 6,
  closeHour = 22,
  slotMinutes = 60,
  amountMinor,
  onHoldCreated,
  currentUserId
}: BookingCalendarProps) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [optimisticSlotId, setOptimisticSlotId] = useState<string | null>(null);
  const [pitchFilter, setPitchFilter] = useState<"ALL" | "LARGE" | "SMALL">("ALL");
  const [isPending, startTransition] = useTransition();
  const { isEnabled } = useFeatureFlags();

  const pitchIds = useMemo(() => initialPitches.map((pitch) => pitch.id), [initialPitches]);
  const [liveConnected] = useState(true);

  useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);

  const timeLabels = useMemo(() => {
    const labels: { label: string; startsAt: string; endsAt: string }[] = [];
    for (let hour = openHour; hour < closeHour; hour += slotMinutes / 60) {
      const wholeHour = Math.floor(hour);
      const minute = Math.round((hour - wholeHour) * 60);
      const startsAt = isoAt(day, wholeHour, minute);
      const end = new Date(startsAt);
      end.setMinutes(end.getMinutes() + slotMinutes);
      labels.push({
        label: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(startsAt)),
        startsAt,
        endsAt: end.toISOString()
      });
    }
    return labels;
  }, [closeHour, day, openHour, slotMinutes]);

  const slots = useMemo(() => {
    const next = new Map<string, CalendarSlot>();

    // Pass 1: Set database reservations & holds
    for (const pitch of initialPitches) {
      for (const time of timeLabels) {
        const id = slotId(pitch.id, time.startsAt);
        const reservation = reservations.find((item) => item.pitch_id === pitch.id && item.status !== "CANCELLED" && overlaps(time.startsAt, time.endsAt, item));
        
        // Client-side hold check to see if a hold has expired locally
        const isHoldExpired = reservation?.status === "PENDING_HOLD" && reservation.hold_expires_at && new Date(reservation.hold_expires_at).getTime() <= Date.now();
        
        const status = optimisticSlotId === id ? "OPTIMISTIC_HOLD" : (reservation && !isHoldExpired ? reservation.status : "OPEN");
        next.set(id, {
          id,
          pitchId: pitch.id,
          pitchName: pitch.name,
          startsAt: time.startsAt,
          endsAt: time.endsAt,
          status,
          reservationId: reservation?.id,
          holdExpiresAt: reservation?.hold_expires_at ?? null,
          bookingReference: reservation?.booking_reference ?? null,
          ownedByCurrentUser: Boolean(currentUserId && reservation?.user_id === currentUserId)
        });
      }
    }

    // Pass 2: Apply physical relationships (Parent-Child overrides)
    for (const pitch of initialPitches) {
      for (const time of timeLabels) {
        const id = slotId(pitch.id, time.startsAt);
        const currentSlot = next.get(id)!;

        if (currentSlot.status === "OPEN") {
          // If this is a child pitch, check if parent is booked/held
          if (pitch.parent_id) {
            const parentSlotId = slotId(pitch.parent_id, time.startsAt);
            const parentSlot = next.get(parentSlotId);
            if (parentSlot && (parentSlot.status === "CONFIRMED" || parentSlot.status === "PENDING_HOLD" || parentSlot.status === "OPTIMISTIC_HOLD" || parentSlot.status === "MAINTENANCE")) {
              currentSlot.status = "PARENT_BOOKED";
            }
          }

          // If this is a parent pitch, check if any child is booked/held
          const childPitches = initialPitches.filter(p => p.parent_id === pitch.id);
          if (childPitches.length > 0) {
            const isAnyChildBooked = childPitches.some(child => {
              const childSlotId = slotId(child.id, time.startsAt);
              const childSlot = next.get(childSlotId);
              return childSlot && (childSlot.status === "CONFIRMED" || childSlot.status === "PENDING_HOLD" || childSlot.status === "OPTIMISTIC_HOLD" || childSlot.status === "MAINTENANCE");
            });
            if (isAnyChildBooked) {
              currentSlot.status = "CHILD_BOOKED";
            }
          }
        }
      }
    }

    // Pass 3: Apply active user selections (UI preview lock)
    if (selectedSlotId) {
      const selectedSlot = next.get(selectedSlotId);
      if (selectedSlot) {
        const selectedTime = selectedSlot.startsAt;
        const selectedPitch = initialPitches.find(p => p.id === selectedSlot.pitchId);

        if (selectedPitch) {
          // If user selected a child pitch slot, the parent pitch slot at the same time is locked
          if (selectedPitch.parent_id) {
            const parentSlotId = slotId(selectedPitch.parent_id, selectedTime);
            const parentSlot = next.get(parentSlotId);
            if (parentSlot && parentSlot.status === "OPEN") {
              parentSlot.status = "CHILD_SELECTED";
            }
          }

          // If user selected a parent pitch slot, all child pitch slots at the same time are locked
          const childPitches = initialPitches.filter(p => p.parent_id === selectedPitch.id);
          for (const child of childPitches) {
            const childSlotId = slotId(child.id, selectedTime);
            const childSlot = next.get(childSlotId);
            if (childSlot && childSlot.status === "OPEN") {
              childSlot.status = "PARENT_SELECTED";
            }
          }
        }
      }
    }

    return next;
  }, [currentUserId, initialPitches, optimisticSlotId, reservations, timeLabels, selectedSlotId]);

  const selectedSlot = selectedSlotId ? slots.get(selectedSlotId) ?? null : null;
  const canHoldSelected = selectedSlot?.status === "OPEN";

  const selectSlot = (slot: CalendarSlot) => {
    if (LOCKED_STATUSES.includes(slot.status) && !slot.ownedByCurrentUser) return;
    setSelectedSlotId(slot.id);
  };

  const holdSlot = () => {
    if (!selectedSlot || !canHoldSelected) return;

    setOptimisticSlotId(selectedSlot.id);
    startTransition(() => {
      const mockHold: HoldResult = {
        reservation_id: `mock-res-${Math.random().toString(36).substr(2, 9)}`,
        pitch_id: selectedSlot.pitchId,
        slot_start: selectedSlot.startsAt,
        slot_end: selectedSlot.endsAt,
        status: "PENDING_HOLD",
        hold_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        booking_reference: `PB-MOCK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        amount_minor: amountMinor
      };

      const mockReservation: Reservation = {
        id: mockHold.reservation_id,
        pitch_id: mockHold.pitch_id,
        user_id: currentUserId || "mock-user",
        slot_start: mockHold.slot_start,
        slot_end: mockHold.slot_end,
        status: "PENDING_HOLD",
        hold_expires_at: mockHold.hold_expires_at,
        booking_reference: mockHold.booking_reference,
        checkout_request_id: `mock-checkout-${Math.random().toString(36).substr(2, 9)}`,
        amount_minor: mockHold.amount_minor,
        payment_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setReservations(curr => [...curr, mockReservation]);
      setOptimisticSlotId(null);
      toast.success("Hold created locally. Proceed to checkout.");
      onHoldCreated(mockHold);
    });
  };

  // Filter pitches
  const filteredPitches = useMemo(() => {
    return initialPitches.filter(pitch => {
      const isParent = initialPitches.some(p => p.parent_id === pitch.id);
      if (pitchFilter === "LARGE") return isParent;
      if (pitchFilter === "SMALL") return pitch.parent_id !== null && pitch.parent_id !== undefined;
      return true;
    });
  }, [initialPitches, pitchFilter]);

  if (!initialPitches.length) {
    return (
      <section className="rounded-2xl glass-panel p-8 text-center border border-orange/20 animate-fade-in">
        <Info className="mx-auto h-12 w-12 text-[#FF6B2C] mb-4 text-glow-orange animate-bounce" />
        <h3 className="font-heading text-lg uppercase tracking-wider text-white-soft">No active pitches</h3>
        <p className="mt-2 text-xs text-gray-muted max-w-sm mx-auto">
          We couldn't load any fields for this sports complex. Check back soon or contact support.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full overflow-hidden rounded-2xl glass-panel border border-cyan-blue/10 shadow-2xl animate-slide-up">
      
      {/* Calendar Header with filters & sync status */}
      <div className="flex flex-col gap-4 border-b border-cyan-blue/10 bg-[#1a1f3a]/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg uppercase tracking-wider text-white-soft flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00FF87] animate-pulse" />
            Live Broadcast Grid
          </h2>
          <p className="text-xs text-gray-muted font-heading uppercase tracking-widest mt-0.5">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(`${day}T00:00:00`))}
          </p>
        </div>

        {/* Pitch Size Filters */}
        <div className="flex items-center gap-1.5 bg-navy-deep p-1 rounded-xl border border-cyan-blue/10">
          <button
            onClick={() => setPitchFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-heading uppercase tracking-wider rounded-lg transition-all ${pitchFilter === "ALL" ? "bg-[#60EFFF] text-[#0A0F2C] font-bold" : "text-gray-muted hover:text-white-soft"}`}
          >
            All
          </button>
          <button
            onClick={() => setPitchFilter("LARGE")}
            className={`px-3 py-1.5 text-xs font-heading uppercase tracking-wider rounded-lg transition-all ${pitchFilter === "LARGE" ? "bg-[#60EFFF] text-[#0A0F2C] font-bold" : "text-gray-muted hover:text-white-soft"}`}
          >
            11-a-side
          </button>
          <button
            onClick={() => setPitchFilter("SMALL")}
            className={`px-3 py-1.5 text-xs font-heading uppercase tracking-wider rounded-lg transition-all ${pitchFilter === "SMALL" ? "bg-[#60EFFF] text-[#0A0F2C] font-bold" : "text-gray-muted hover:text-white-soft"}`}
          >
            5-a-side
          </button>
        </div>

        {/* Live Demo Status */}
        <div className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#00FF87]" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF87]" />
          </span>
          <span className="text-[#00FF87]">
            Live Demo Mode Active
          </span>
        </div>
      </div>

      {isEnabled("experimental_search_rank") ? (
        <div className="border-b border-cyan-blue/10 bg-[#60EFFF]/10 px-6 py-2 text-xs font-heading uppercase tracking-wider text-[#60EFFF]">
          🚀 Smart Pitch Ordering active for this account.
        </div>
      ) : null}

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[850px]"
          style={{ gridTemplateColumns: `200px repeat(${timeLabels.length}, minmax(110px, 1fr))` }}
        >
          {/* Header Row */}
          <div className="sticky left-0 z-10 border-b border-r border-cyan-blue/10 bg-[#121630] p-4 text-[10px] font-heading font-bold uppercase tracking-widest text-gray-muted">
            Pitch Layout
          </div>
          {timeLabels.map((time) => (
            <div key={time.startsAt} className="border-b border-cyan-blue/10 bg-[#121630]/60 p-4 text-center font-heading text-xs font-bold uppercase tracking-wider text-gray-muted">
              {time.label}
            </div>
          ))}

          {/* Pitches Rows */}
          {filteredPitches.map((pitch) => {
            const isParent = initialPitches.some(p => p.parent_id === pitch.id);
            const pitchTypeBadge = isParent ? "11-a-side" : "5-a-side";

            return (
              <div key={pitch.id} className="contents group">
                
                {/* Row Header Label */}
                <div className="sticky left-0 z-10 flex h-20 flex-col justify-center border-b border-r border-cyan-blue/10 bg-[#1a1f3a] p-4 font-heading text-sm font-semibold transition group-hover:bg-[#1a1f3a]/90">
                  <span className="text-white-soft tracking-wide">{pitch.name}</span>
                  <span className={`inline-block w-fit mt-1.5 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${isParent ? "bg-[#60EFFF]/15 text-[#60EFFF] border border-[#60EFFF]/30" : "bg-[#00FF87]/15 text-[#00FF87] border border-[#00FF87]/30"}`}>
                    {pitchTypeBadge}
                  </span>
                </div>

                {/* Grid Cells */}
                {timeLabels.map((time) => {
                  const slot = slots.get(slotId(pitch.id, time.startsAt));
                  const status = slot?.status ?? "OPEN";
                  const locked = LOCKED_STATUSES.includes(status) && !slot?.ownedByCurrentUser;
                  const selected = selectedSlotId === slot?.id;

                  // Dynamic color styles
                  let cellClasses = "";
                  let statusText = statusLabel(status);

                  if (status === "OPEN") {
                    cellClasses = "bg-[#0A0F2C]/30 text-[#00FF87] border-cyan-blue/5 hover:bg-[#00FF87]/10 hover:border-[#00FF87]/40 hover:text-white-soft";
                  } else if (status === "OPTIMISTIC_HOLD") {
                    cellClasses = "bg-[#FF6B2C]/20 text-[#FF6B2C] border-[#FF6B2C]/30 cursor-wait";
                  } else if (slot?.ownedByCurrentUser) {
                    cellClasses = "bg-[#60EFFF]/20 text-[#60EFFF] border-[#60EFFF]/40 text-glow-cyan animate-pulse-glow";
                    statusText = "Your Hold";
                  } else if (status === "PENDING_HOLD") {
                    cellClasses = "bg-[#FF6B2C]/10 text-[#FF6B2C]/70 border-orange/10 opacity-70 cursor-not-allowed";
                  } else if (status === "CONFIRMED") {
                    cellClasses = "bg-[#121630]/60 text-gray-muted border-cyan-blue/5 opacity-50 cursor-not-allowed";
                  } else if (status === "PARENT_BOOKED") {
                    cellClasses = "bg-[#121630]/30 text-gray-muted/40 border-cyan-blue/5 opacity-30 cursor-not-allowed";
                  } else if (status === "CHILD_BOOKED") {
                    cellClasses = "bg-[#FF6B2C]/5 text-[#FF6B2C]/50 border-orange/5 opacity-60 cursor-not-allowed";
                  } else if (status === "PARENT_SELECTED") {
                    cellClasses = "bg-[#121630]/20 text-gray-muted/50 border-cyan-blue/5 opacity-40 cursor-not-allowed";
                  } else if (status === "CHILD_SELECTED") {
                    cellClasses = "bg-[#60EFFF]/5 text-[#60EFFF]/50 border-cyan-blue/5 opacity-60 cursor-not-allowed";
                  } else {
                    cellClasses = "bg-[#121630]/60 text-gray-muted border-cyan-blue/5 opacity-50 cursor-not-allowed";
                  }

                  return (
                    <button
                      key={`${pitch.id}-${time.startsAt}`}
                      type="button"
                      disabled={!slot || locked || isPending}
                      onClick={() => slot && selectSlot(slot)}
                      className={`h-20 border-b border-r border-cyan-blue/10 px-3 flex flex-col items-center justify-center gap-1.5 font-heading text-[10px] uppercase font-bold tracking-widest transition-all duration-300 ${cellClasses} ${selected ? "ring-2 ring-inset ring-[#60EFFF] bg-[#60EFFF]/10 border-[#60EFFF]/60 shadow-[0_0_15px_rgba(96,239,255,0.2)]" : ""} disabled:cursor-not-allowed`}
                      aria-label={`${pitch.name} ${time.label} ${statusLabel(status)}`}
                    >
                      <span className="flex items-center gap-1">
                        {status === "OPEN" ? (
                          <Unlock className="h-3 w-3 text-[#00FF87]" />
                        ) : status === "OPTIMISTIC_HOLD" ? (
                          <Loader2 className="h-3 w-3 animate-spin text-[#FF6B2C]" />
                        ) : slot?.ownedByCurrentUser ? (
                          <Timer className="h-3 w-3 text-[#60EFFF] animate-pulse" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {statusText}
                      </span>
                      {/* Sub-label for specific relations */}
                      {status === "PARENT_BOOKED" && <span className="text-[8px] text-glow-orange lowercase font-sans opacity-70">11s occupied</span>}
                      {status === "CHILD_BOOKED" && <span className="text-[8px] text-glow-orange lowercase font-sans opacity-70">splits active</span>}
                      {status === "PARENT_SELECTED" && <span className="text-[8px] text-[#60EFFF] lowercase font-sans opacity-70">11s selected</span>}
                      {status === "CHILD_SELECTED" && <span className="text-[8px] text-[#60EFFF] lowercase font-sans opacity-70">split selected</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Selected Slot Actions */}
      <div className="flex flex-col gap-4 border-t border-cyan-blue/10 bg-[#121630]/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Slot Info text */}
        <div className="min-h-10 text-xs sm:text-sm text-gray-muted font-heading uppercase tracking-wider flex items-center gap-3">
          {selectedSlot ? (
            <div className="flex items-center gap-2 text-white-soft">
              <span className="h-2 w-2 rounded-full bg-[#60EFFF] text-glow-cyan" />
              <span>
                Selected <strong className="text-[#60EFFF] font-bold">{selectedSlot.pitchName}</strong> from{" "}
                <strong className="text-white-soft font-bold">
                  {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(selectedSlot.startsAt))}
                </strong>
                {" to "}
                <strong className="text-white-soft font-bold">
                  {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(selectedSlot.endsAt))}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-ping text-glow-green" />
              <span>Choose an open slot to begin Captain hold</span>
            </div>
          )}

          {false ? (
            <span className="ml-3 inline-flex items-center gap-1.5 text-[#FF6B2C] text-glow-orange">
              <AlertTriangle className="h-4 w-4 text-glow-orange" />
              Syncing retrying...
            </span>
          ) : null}
        </div>

        {/* Hold Button */}
        <button
          type="button"
          disabled={!canHoldSelected || isPending}
          onClick={holdSlot}
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl btn-electric px-6 font-heading text-sm uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Timer className="h-4 w-4" />
          )}
          Lock Slot (5m Hold)
        </button>
      </div>
    </section>
  );
}

export function BookingCalendarSkeleton({ rows = 4, columns = 16 }: { rows?: number; columns?: number }) {
  return (
    <section className="w-full overflow-hidden rounded-2xl glass-panel border border-cyan-blue/10 shadow-2xl">
      <div className="h-[73px] border-b border-cyan-blue/10 bg-[#121630] animate-pulse" />
      <div className="overflow-hidden">
        <div className="grid min-w-[850px]" style={{ gridTemplateColumns: `200px repeat(${columns}, minmax(110px, 1fr))` }}>
          {Array.from({ length: (rows + 1) * (columns + 1) }).map((_, index) => (
            <div key={index} className="h-20 border-b border-r border-cyan-blue/5 bg-[#0A0F2C]/30 flex items-center justify-center">
              <div className="w-16 h-3 bg-[#1a1f3a] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-[65px] border-t border-cyan-blue/10 bg-[#121630]/30 animate-pulse" />
    </section>
  );
}
