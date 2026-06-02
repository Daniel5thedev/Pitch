export type ReservationStatus = "PENDING_HOLD" | "CONFIRMED" | "CANCELLED" | "MAINTENANCE";

export type SlotStatus = 
  | "OPEN" 
  | ReservationStatus 
  | "OPTIMISTIC_HOLD" 
  | "PARENT_BOOKED" 
  | "CHILD_BOOKED" 
  | "PARENT_SELECTED" 
  | "CHILD_SELECTED";

export interface Pitch {
  id: string;
  name: string;
  is_active: boolean;
  parent_id?: string | null;
}

export interface Reservation {
  id: string;
  pitch_id: string;
  user_id: string | null;
  slot_start: string;
  slot_end: string;
  status: ReservationStatus;
  hold_expires_at: string | null;
  booking_reference: string | null;
  checkout_request_id: string | null;
  amount_minor: number | null;
  payment_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarSlot {
  id: string;
  pitchId: string;
  pitchName: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  reservationId?: string;
  holdExpiresAt?: string | null;
  bookingReference?: string | null;
  ownedByCurrentUser?: boolean;
}

export interface HoldResult {
  reservation_id: string;
  pitch_id: string;
  slot_start: string;
  slot_end: string;
  status: "PENDING_HOLD";
  hold_expires_at: string;
  booking_reference: string;
  amount_minor: number;
}

export interface PaymentFailure {
  message: string;
  code?: string;
}
