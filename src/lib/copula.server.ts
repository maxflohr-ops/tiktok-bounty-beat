// Outbound bridge: bountysounds → copula. Signs the raw body with
// BRIDGE_SHARED_SECRET (same HMAC-SHA256 scheme copula uses inbound).
// Server-only — import lazily from server functions.

import { createHmac } from "node:crypto";

export type CopulaPayout = {
  copulaClipId: string;
  verifiedViews: number;
  paidCents: number;
  idempotencyKey: string;
};

// Tells copula a payout landed so the fan sees cash + the trusted view count.
// Best-effort: a failed notify never un-pays the claim; the idempotencyKey
// (claim id) makes retries safe.
export async function notifyCopulaPayout(payload: CopulaPayout): Promise<boolean> {
  const base = process.env.COPULA_BASE_URL;
  const secret = process.env.BRIDGE_SHARED_SECRET;
  if (!base || !secret) return false;

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/bridge/payouts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bridge-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
