// Shared helpers for the copula bridge edge functions.
// Every inbound call is HMAC-SHA256 signed over the raw request body with
// BRIDGE_SHARED_SECRET (hex signature in the x-bridge-signature header).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const enc = new TextEncoder();

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function verifySignature(rawBody: string, signatureHex: string | null): Promise<boolean> {
  const secret = Deno.env.get("BRIDGE_SHARED_SECRET");
  if (!secret || !signatureHex) return false;
  const given = hexToBytes(signatureHex.trim());
  if (!given) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(rawBody)));
  return timingSafeEqual(expected, given);
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Reads the raw body once, verifies the signature, parses JSON.
// Returns a Response on failure, or the parsed payload on success.
export async function readSignedJson(req: Request): Promise<Response | Record<string, unknown>> {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const raw = await req.text();
  const ok = await verifySignature(raw, req.headers.get("x-bridge-signature"));
  if (!ok) return json(401, { error: "bad signature" });
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return json(400, { error: "object body required" });
    return parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "invalid JSON" });
  }
}
