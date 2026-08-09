import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
