"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ReservationTimerOptions {
  expiresAt: string | null;
  onExpire?: () => void;
  tickMs?: number;
}

export function useReservationTimer({ expiresAt, onExpire, tickMs = 250 }: ReservationTimerOptions) {
  const [remainingMs, setRemainingMs] = useState(0);
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
  }, [expiresAt]);

  useEffect(() => {
    firedRef.current = false;
    setRemainingMs(calculateRemaining());

    if (!expiresAt) return undefined;

    const interval = window.setInterval(() => {
      const next = calculateRemaining();
      setRemainingMs(next);

      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current?.();
      }
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [calculateRemaining, expiresAt, tickMs]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return useMemo(() => ({
    remainingMs,
    expired: Boolean(expiresAt) && remainingMs <= 0,
    formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  }), [expiresAt, minutes, remainingMs, seconds]);
}
