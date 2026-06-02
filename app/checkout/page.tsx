"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutWizard } from "@/components/CheckoutWizard";
import type { HoldResult } from "@/types/booking";

export default function CheckoutPage() {
  const router = useRouter();
  const [hold, setHold] = useState<HoldResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("kahawa-current-hold");
    if (raw) {
      try {
        setHold(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem("kahawa-current-hold");
      }
    }
    setHydrated(true);
  }, []);

  const clearHold = () => {
    window.localStorage.removeItem("kahawa-current-hold");
  };

  const redirectHome = () => {
    clearHold();
    router.push("/");
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto max-w-6xl px-4">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-700">Kahawa Sport Arena</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Checkout</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Complete payment for your held pitch. If the hold expires or you cancel, you can return to the marketplace.
            </p>
          </div>
          <button
            type="button"
            onClick={redirectHome}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to marketplace
          </button>
        </header>

        {hold ? (
          <CheckoutWizard
            hold={hold}
            onExpiredRedirect={redirectHome}
            onCancel={redirectHome}
            onConfirmed={() => {
              clearHold();
            }}
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">No held slot found</h2>
            <p className="mt-3 text-sm text-slate-600">
              There is no active hold saved. Please return to the marketplace and select an open slot.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={redirectHome}
                className="inline-flex h-11 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
              >
                Return to marketplace
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
