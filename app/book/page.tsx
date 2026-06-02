import { BookingPage } from "@/components/BookingPage";
import { getCachedMarketplaceAvailability } from "@/lib/booking/search";
import type { Pitch, Reservation } from "@/types/booking";

const today = new Date().toISOString().slice(0, 10);

const fallbackPitches: Pitch[] = [
  { id: "riverside-11s", name: "Riverside Grand (11-a-side)", is_active: true, parent_id: null },
  { id: "riverside-5s-a", name: "Riverside Pitch A (5-a-side)", is_active: true, parent_id: "riverside-11s" },
  { id: "riverside-5s-b", name: "Riverside Pitch B (5-a-side)", is_active: true, parent_id: "riverside-11s" },
  { id: "kilimani-7s", name: "Kilimani Arena (7-a-side)", is_active: true, parent_id: null }
];

const fallbackReservations: Reservation[] = [];

export default async function BookPage() {
  let initialPitches = fallbackPitches;
  let initialReservations = fallbackReservations;

  try {
    const availability = await getCachedMarketplaceAvailability(today, 15);
    if (availability.pitches.length) {
      initialPitches = availability.pitches;
      initialReservations = availability.reservations;
    }
  } catch (error) {
    // Fallback to local demo data when Supabase is not configured.
  }

  return (
    <BookingPage
      initialPitches={initialPitches}
      initialReservations={initialReservations}
      day={today}
      amountMinor={150000}
    />
  );
}
