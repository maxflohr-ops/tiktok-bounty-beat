import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCESS_OK = ["invited", "accepted", "approved"] as const;

export type AccessRow = {
  id: string;
  bounty_id: string;
  user_id: string | null;
  status: string;
  message: string | null;
  tiktok_handle: string | null;
  invited_email: string | null;
  created_at: string;
  decided_at: string | null;
};

/**
 * Server-side gate for private campaigns. Throws a clear error when the caller
 * may not submit against this bounty. Public bounties always pass.
 */
export async function assertBountyAccess(
  supabase: SupabaseClient,
  bountyId: string,
  userId: string,
  bounty?: { visibility?: string | null; access_mode?: string | null } | null,
): Promise<void> {
  let b = bounty;
  if (!b) {
    const { data } = await supabase
      .from("bounties")
      .select("visibility,access_mode")
      .eq("id", bountyId)
      .single();
    b = data as { visibility?: string | null; access_mode?: string | null } | null;
  }
  if (!b || (b.visibility ?? "public") !== "private") return;

  const { data: access } = await supabase
    .from("bounty_access")
    .select("status")
    .eq("bounty_id", bountyId)
    .eq("user_id", userId)
    .maybeSingle();

  const status = access?.status ?? null;
  if (status && (ACCESS_OK as readonly string[]).includes(status)) return;

  if (status === "applied")
    throw new Error("Your application to this private campaign is still under review.");
  if (status === "rejected")
    throw new Error("Your application to this private campaign was not accepted.");
  throw new Error(
    b.access_mode === "apply"
      ? "This is a private campaign — apply first and wait for approval before claiming."
      : "This is a private, invite-only campaign.",
  );
}
