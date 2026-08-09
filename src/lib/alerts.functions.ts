import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

// Best-effort abuse brake: max 5 subscribes per IP per hour per instance.
// Not a substitute for double-opt-in (tracked on the roadmap) - it stops
// casual loops, not a distributed attacker.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();
function throttled(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  return false;
}

// Board alerts: "tell me when bounties drop." Public — works signed out.
// Idempotent on email; honest when the table hasn't been migrated yet.
export const subscribeBoardAlerts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        source: z.string().trim().max(60).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const ip =
      getRequest()?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (throttled(ip)) throw new Error("Too many signups from this connection - try again later.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // board_alerts is newer than the generated DB types - cast until regen.
    const { error } = await (supabaseAdmin as any).from("board_alerts").insert({
      email: data.email.toLowerCase(),
      source: data.source ?? "board",
    });
    if (error) {
      if (error.code === "23505") return { ok: true, already: true }; // duplicate = subscribed
      console.error("subscribeBoardAlerts failed:", error.message);
      throw new Error("Could not save that just now — try again in a minute.");
    }
    return { ok: true, already: false };
  });
