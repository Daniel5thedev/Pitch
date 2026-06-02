import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mpesa-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
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

function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

function callback(payload: Record<string, unknown>): Record<string, unknown> {
  const body = payload.Body as Record<string, unknown> | undefined;
  const stkCallback = body?.stkCallback as Record<string, unknown> | undefined;
  if (!stkCallback) throw new Error("Invalid M-Pesa callback payload.");
  return stkCallback;
}

function callbackItems(stkCallback: Record<string, unknown>): Record<string, unknown> {
  const metadata = stkCallback.CallbackMetadata as Record<string, unknown> | undefined;
  const items = Array.isArray(metadata?.Item) ? metadata.Item as Array<Record<string, unknown>> : [];
  return items.reduce<Record<string, unknown>>((accumulator, item) => {
    if (typeof item.Name === "string") accumulator[item.Name] = item.Value;
    return accumulator;
  }, {});
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  let payload: Record<string, unknown> = {};
  let externalId = "UNKNOWN";

  try {
    const rawBody = await request.text();
    payload = JSON.parse(rawBody) as Record<string, unknown>;
    const stkCallback = callback(payload);
    externalId = String(stkCallback.CheckoutRequestID ?? "");

    if (!externalId) {
      return json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" }, 400);
    }

    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false }
    });

    const { data: reservationLookup } = await supabase
      .from("reservations")
      .select("id,booking_reference")
      .eq("checkout_request_id", externalId)
      .maybeSingle();

    const url = new URL(request.url);
    const suppliedToken = url.searchParams.get("token") ?? request.headers.get("x-mpesa-signature") ?? "";
    const staticToken = Deno.env.get("MPESA_CALLBACK_TOKEN");
    const expectedToken = staticToken || (reservationLookup?.id && reservationLookup.booking_reference
      ? await hmacHex(env("MPESA_CALLBACK_SECRET"), `${reservationLookup.id}:${reservationLookup.booking_reference}`)
      : "");

    if (!expectedToken || !suppliedToken || !timingSafeEqual(suppliedToken, expectedToken)) {
      return json({ ResultCode: 1, ResultDesc: "Invalid callback signature" }, 401);
    }

    const resultCode = Number(stkCallback.ResultCode);
    const resultMessage = String(stkCallback.ResultDesc ?? "");
    const items = callbackItems(stkCallback);
    const amount = Number(items.Amount ?? 0);
    const amountMinor = Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;

    const { error } = await supabase.rpc("process_mpesa_webhook", {
      p_external_id: externalId,
      p_payload: payload,
      p_success: resultCode === 0,
      p_result_message: resultMessage,
      p_amount_minor: amountMinor
    });

    if (error) {
      return json({ ResultCode: 1, ResultDesc: error.message }, 500);
    }

    return json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    try {
      const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false }
      });
      await supabase.from("webhook_inbox").upsert({
        provider: "MPESA",
        external_id: externalId,
        payload,
        status: "FAILED",
        error_message: error instanceof Error ? error.message : "Webhook processing failed."
      }, { onConflict: "provider,external_id" });
    } catch {
      return json({ ResultCode: 1, ResultDesc: "Webhook processing failed and could not be persisted." }, 500);
    }

    return json({
      ResultCode: 1,
      ResultDesc: error instanceof Error ? error.message : "Webhook processing failed."
    }, 500);
  }
});
