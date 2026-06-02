import type { Pitch, Reservation } from "@/types/booking";

interface CachedAvailability {
  pitches: Pitch[];
  reservations: Reservation[];
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function supabaseRest<T>(path: string, revalidateSeconds: number): Promise<T> {
  const response = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/${path}`, {
    headers: {
      apikey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      Authorization: `Bearer ${env("NEXT_PUBLIC_SUPABASE_ANON_KEY")}`
    },
    next: { revalidate: revalidateSeconds }
  });

  if (!response.ok) {
    throw new Error(`Supabase search fetch failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export async function getCachedMarketplaceAvailability(day: string, revalidateSeconds = 15): Promise<CachedAvailability> {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [pitches, reservations] = await Promise.all([
    supabaseRest<Pitch[]>("pitches?select=id,name,is_active&is_active=eq.true&order=name.asc", revalidateSeconds),
    supabaseRest<Reservation[]>(
      [
        "reservations?select=id,pitch_id,user_id,slot_start,slot_end,status,hold_expires_at,booking_reference,checkout_request_id,amount_minor,created_at,updated_at",
        "status=in.(PENDING_HOLD,CONFIRMED,MAINTENANCE)",
        `slot_start=lt.${encodeURIComponent(end.toISOString())}`,
        `slot_end=gt.${encodeURIComponent(start.toISOString())}`
      ].join("&"),
      revalidateSeconds
    )
  ]);

  return { pitches, reservations };
}
