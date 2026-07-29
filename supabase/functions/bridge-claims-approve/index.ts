// copula → bountysounds: copula's human moderation passed — mark the claim
// payout-eligible. Only approved claims are ever swept for payout; this human
// gate is the bridge's fraud filter, so nothing else flips a claim to approved.
//
// Body: { copulaClipId: string }

import { adminClient, json, readSignedJson } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const body = await readSignedJson(req);
  if (body instanceof Response) return body;

  const copulaClipId = typeof body.copulaClipId === "string" ? body.copulaClipId.trim() : "";
  if (!copulaClipId) return json(400, { error: "copulaClipId is required" });

  const supabase = adminClient();
  const { data: claim, error: ce } = await supabase
    .from("bounty_claims")
    .select("id,status")
    .eq("copula_clip_id", copulaClipId)
    .maybeSingle();
  if (ce) return json(500, { error: ce.message });
  if (!claim) return json(404, { error: "unknown clip" });

  // Only move submitted → approved; paying/paid claims stay as they are.
  if (claim.status !== "submitted") {
    return json(200, { claimId: claim.id, status: claim.status, unchanged: true });
  }

  const { error } = await supabase
    .from("bounty_claims")
    .update({ status: "approved" })
    .eq("id", claim.id);
  if (error) return json(500, { error: error.message });
  return json(200, { claimId: claim.id, status: "approved" });
});
