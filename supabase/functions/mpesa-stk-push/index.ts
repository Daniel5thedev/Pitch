import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type HoldResponse = {
  reservation_id: string;
  pitch_id?: string;
  slot_start?: string;
  slot_end?: string;
  status?: string;
  hold_expires_at: string;
  booking_reference: string;
  amount_minor: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return Deno.env.get(name) || fallback;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function normalizeKenyanPhone(input: string): string {
  const compact = input.trim().replace(/[\s().-]/g, "");
  if (/^\+254(7|1)\d{8}$/.test(compact)) return compact.slice(1);
  if (/^254(7|1)\d{8}$/.test(compact)) return compact;
  if (/^0(7|1)\d{8}$/.test(compact)) return `254${compact.slice(1)}`;
  if (/^(7|1)\d{8}$/.test(compact)) return `254${compact}`;
  throw new Error("Enter a valid Safaricom number.");
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getDarajaAccessToken(): Promise<string> {
  const key = env("MPESA_CONSUMER_KEY");
  const secret = env("MPESA_CONSUMER_SECRET");
  const baseUrl = env("MPESA_BASE_URL").replace(/\/$/, "");
  const credentials = btoa(`${key}:${secret}`);

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.errorMessage ?? "Unable to authenticate with M-Pesa.");
  }
  return String(payload.access_token);
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const supabaseAnonKey = env("SUPABASE_ANON_KEY");
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Sign in before starting payment." }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "Your session expired. Please sign in again." }, 401);
    }

    const body = await request.json();
    const phoneNumber = normalizeKenyanPhone(String(body.phone_number ?? ""));

    let hold: HoldResponse;
    if (body.reservation_id && body.booking_reference) {
      const checkoutSeed = `${body.reservation_id}:${body.booking_reference}:${Date.now()}`;
      const checkoutRequestId = `LOCAL-${await hmacHex(env("MPESA_CALLBACK_SECRET"), checkoutSeed).then((token) => token.slice(0, 24).toUpperCase())}`;
      const { data, error } = await supabase.rpc("assign_mpesa_checkout", {
        p_reservation_id: body.reservation_id,
        p_booking_reference: body.booking_reference,
        p_checkout_request_id: checkoutRequestId
      });
      if (error) return json({ error: error.message }, 409);
      hold = Array.isArray(data) ? data[0] as HoldResponse : data as HoldResponse;
      hold.reservation_id = String(body.reservation_id);
    } else {
      const { data, error } = await supabase.rpc("try_hold_reservation_slot", {
        p_pitch_id: body.pitch_id,
        p_slot_start: body.slot_start,
        p_slot_end: body.slot_end,
        p_amount_minor: Number(body.amount_minor)
      });
      if (error) return json({ error: error.message }, error.code === "23P01" ? 409 : 400);
      hold = Array.isArray(data) ? data[0] as HoldResponse : data as HoldResponse;
    }

    const shortCode = env("MPESA_SHORTCODE");
    const passkey = env("MPESA_PASSKEY");
    const baseUrl = env("MPESA_BASE_URL").replace(/\/$/, "");
    const callbackBaseUrl = env("MPESA_CALLBACK_BASE_URL").replace(/\/$/, "");
    const timestamp = formatTimestamp(new Date());
    const password = btoa(`${shortCode}${passkey}${timestamp}`);
    const callbackToken = await hmacHex(env("MPESA_CALLBACK_SECRET"), `${hold.reservation_id}:${hold.booking_reference}`);
    const token = await getDarajaAccessToken();

    const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: optionalEnv("MPESA_TRANSACTION_TYPE", "CustomerPayBillOnline"),
        Amount: Math.round(hold.amount_minor / 100),
        PartyA: phoneNumber,
        PartyB: shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${callbackBaseUrl}/functions/v1/mpesa-webhook?token=${callbackToken}`,
        AccountReference: hold.booking_reference,
        TransactionDesc: `Pitch booking ${hold.booking_reference}`
      })
    });

    const stkPayload = await stkResponse.json();
    if (!stkResponse.ok || !stkPayload.CheckoutRequestID) {
      return json({
        error: stkPayload.errorMessage ?? stkPayload.ResponseDescription ?? "M-Pesa could not start the payment request."
      }, 502);
    }

    const { error: assignRealCheckoutError } = await supabase.rpc("assign_mpesa_checkout", {
      p_reservation_id: hold.reservation_id,
      p_booking_reference: hold.booking_reference,
      p_checkout_request_id: String(stkPayload.CheckoutRequestID)
    });

    if (assignRealCheckoutError) {
      return json({ error: assignRealCheckoutError.message }, 409);
    }

    return json({
      reservation_id: hold.reservation_id,
      booking_reference: hold.booking_reference,
      checkout_request_id: String(stkPayload.CheckoutRequestID),
      merchant_request_id: String(stkPayload.MerchantRequestID ?? ""),
      customer_message: String(stkPayload.CustomerMessage ?? "Check your phone to complete payment.")
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Payment request failed." }, 500);
  }
});
