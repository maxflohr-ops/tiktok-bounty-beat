// WO-2 identity crossover. Two rules, both fail-closed:
//
// 1. First time a verified Whop user opens the app, register a whop_identities
//    row keyed by whop_user_id. Registration is not linking — profile_id stays
//    NULL until an explicit link.
// 2. Linking requires BOTH credentials on the same request: a valid Supabase
//    session (Authorization bearer, attached by the global client middleware)
//    AND a valid Whop user token (x-whop-user-token, verified server-side).
//    No email matching of any kind — current Whop docs expose a user's email
//    only to the user themself (`me` + email-read scope), so there is nothing
//    trustworthy to match on, and silent merges are forbidden anyway.
//
// whop_identities is service-role only; every access goes through these fns.

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireWhopAuth } from "@/lib/whop-auth-middleware";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";

type IdentityRow = {
  whop_user_id: string;
  profile_id: string | null;
  whop_kyc_status: string;
  whop_payout_method_id: string | null;
};

async function identityTable() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table absent from generated types until next regen
  return (supabaseAdmin as unknown as { from(t: string): any }).from("whop_identities");
}

const IDENTITY_COLS = "whop_user_id,profile_id,whop_kyc_status,whop_payout_method_id";

// Register (or fetch) the identity row for the verified Whop user.
// Idempotent: re-opens return the same row; nothing is ever merged here.
export const ensureWhopIdentity = createServerFn({ method: "GET" })
  .middleware([requireWhopAuth])
  .handler(async ({ context }) => {
    const table = await identityTable();
    const { error: insertError } = await table.insert({ whop_user_id: context.whopUserId });
    // 23505 = row already exists — the expected case after the first open.
    if (insertError && insertError.code !== "23505") throw new Error(insertError.message);

    const { data, error } = await table
      .select(IDENTITY_COLS)
      .eq("whop_user_id", context.whopUserId)
      .single();
    if (error || !data) throw new Error(error?.message ?? "Identity row missing.");
    const row = data as IdentityRow;
    return {
      whopUserId: row.whop_user_id,
      linked: row.profile_id !== null,
      kycStatus: row.whop_kyc_status,
    };
  });

// Explicit, audited link. Requires a live Supabase session (middleware) and a
// valid Whop token on the same request. Collisions fail closed on both sides:
// an identity linked to someone else, or a profile already holding another
// identity, is an error — never a merge.
export const linkWhopIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const request = getRequest();
    const { verifyWhopUserToken } = await import("@/lib/whop.server");
    const verified = request?.headers ? await verifyWhopUserToken(request.headers) : null;
    if (!verified) {
      throw new Error("Open this page inside Whop so your Whop pass can be verified.");
    }

    const table = await identityTable();
    const { data: existingRaw } = await table
      .select(IDENTITY_COLS)
      .eq("whop_user_id", verified.userId)
      .maybeSingle();
    const existing = existingRaw as IdentityRow | null;

    if (existing?.profile_id) {
      if (existing.profile_id === context.userId) {
        return { linked: true, whopUserId: verified.userId, alreadyLinked: true };
      }
      throw new Error("This Whop account is already linked to a different Bounty Sounds account.");
    }

    const patch = {
      profile_id: context.userId,
      linked_at: new Date().toISOString(),
      linked_via: "dual_auth",
    };
    const { error } = existing
      ? await table.update(patch).eq("whop_user_id", verified.userId).is("profile_id", null)
      : await table.insert({ whop_user_id: verified.userId, ...patch });
    if (error) {
      // unique(profile_id) violation: this Bounty Sounds account already holds
      // a different Whop identity. Fail closed and say so.
      if (error.code === "23505") {
        throw new Error(
          "Your Bounty Sounds account is already linked to a different Whop account.",
        );
      }
      throw new Error(error.message);
    }

    notifyAsync({
      event: "whop.identity.linked",
      actor: (context.claims as { email?: string })?.email ?? context.userId,
      reference: verified.userId,
      details: { profile_id: context.userId, linked_via: "dual_auth" },
    });
    return { linked: true, whopUserId: verified.userId, alreadyLinked: false };
  });
