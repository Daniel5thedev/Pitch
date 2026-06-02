"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Reservation } from "@/types/booking";

type ReservationRealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseReservationRealtimeOptions {
  pitchIds?: string[];
  userId?: string;
  bookingReference?: string;
  onReservationChange?: (event: ReservationRealtimeEvent, reservation: Reservation | null, previous: Reservation | null) => void;
}

function mapReservation(row: Record<string, unknown> | null): Reservation | null {
  if (!row) return null;
  const slotRange = String(row.slot_range ?? "");
  const rangeMatch = slotRange.match(/^\["?([^",]+)"?,"?([^"\])]+)"?\)$/);

  return {
    id: String(row.id),
    pitch_id: String(row.pitch_id),
    user_id: row.user_id ? String(row.user_id) : null,
    slot_start: String(row.slot_start ?? rangeMatch?.[1] ?? ""),
    slot_end: String(row.slot_end ?? rangeMatch?.[2] ?? ""),
    status: row.status as Reservation["status"],
    hold_expires_at: row.hold_expires_at ? String(row.hold_expires_at) : null,
    booking_reference: row.booking_reference ? String(row.booking_reference) : null,
    checkout_request_id: row.checkout_request_id ? String(row.checkout_request_id) : null,
    amount_minor: typeof row.amount_minor === "number" ? row.amount_minor : Number(row.amount_minor ?? 0),
    payment_error: row.payment_error ? String(row.payment_error) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? "")
  };
}

function buildFilter(options: UseReservationRealtimeOptions): string | undefined {
  if (options.bookingReference) return `booking_reference=eq.${options.bookingReference}`;
  if (options.userId) return `user_id=eq.${options.userId}`;
  if (options.pitchIds?.length === 1) return `pitch_id=eq.${options.pitchIds[0]}`;
  return undefined;
}

export function useSupabaseRealtime(options: UseReservationRealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const callbackRef = useRef(options.onReservationChange);

  useEffect(() => {
    callbackRef.current = options.onReservationChange;
  }, [options.onReservationChange]);

  useEffect(() => {
    const supabase: SupabaseClient = getSupabaseBrowserClient();
    const channelName = [
      "reservations",
      options.bookingReference ?? "all",
      options.userId ?? "public",
      options.pitchIds?.join("-") ?? "pitches"
    ].join(":");

    const channel = supabase.channel(channelName);
    const filter = buildFilter(options);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reservations",
        ...(filter ? { filter } : {})
      },
      (payload) => {
        const current = mapReservation(payload.new as Record<string, unknown> | null);
        const previous = mapReservation(payload.old as Record<string, unknown> | null);
        const reservation = current ?? previous;

        if (options.pitchIds?.length && reservation && !options.pitchIds.includes(reservation.pitch_id)) {
          return;
        }

        callbackRef.current?.(payload.eventType as ReservationRealtimeEvent, current, previous);
      }
    );

    channel.subscribe((status, err) => {
      setConnected(status === "SUBSCRIBED");
      setLastError(err?.message ?? null);
    });

    return () => {
      void supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [options.bookingReference, options.userId, options.pitchIds?.join("|")]);

  return { connected, lastError };
}
