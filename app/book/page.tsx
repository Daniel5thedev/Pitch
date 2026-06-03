import { BookingPage } from "@/components/BookingPage";
import type { Pitch, Reservation } from "@/types/booking";

const today = new Date().toISOString().slice(0, 10);

const fallbackPitches: Pitch[] = [
  { id: "riverside-11s", name: "Riverside Grand (11-a-side)", is_active: true, parent_id: null },
  { id: "riverside-5s-a", name: "Riverside Pitch A (5-a-side)", is_active: true, parent_id: "riverside-11s" },
  { id: "riverside-5s-b", name: "Riverside Pitch B (5-a-side)", is_active: true, parent_id: "riverside-11s" },
  { id: "kilimani-7s", name: "Kilimani Arena (7-a-side)", is_active: true, parent_id: null }
];

const fallbackReservations: Reservation[] = [];

export default function BookPage() {
  return (
    <BookingPage
      initialPitches={fallbackPitches}
      initialReservations={fallbackReservations}
      day={today}
      amountMinor={150000}
    />
  );
}
