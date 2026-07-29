// copula → bountysounds: a fan submitted a clip against a brief's contract.
// Idempotent on bounty_claims.copula_clip_id — re-sends return the same claim.
//
// Body: {
//   copulaBriefId: string,   // which contract (bounties.copula_brief_id)
//   copulaUserId: string,    // the fan, in copula's ID space
//   copulaClipId: string,    // unique per clip
//   clipUrl: string,
// }

import { adminClient, json, readSignedJson } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const body = await readSignedJson(req);
  if (body instanceof Response) return body;

  const copulaBriefId = typeof body.copulaBriefId === "string" ? body.copulaBriefId.trim() : "";
  const copulaUserId = typeof body.copulaUserId === "string" ? body.copulaUserId.trim() : "";
  const copulaClipId = typeof body.copulaClipId === "string" ? body.copulaClipId.trim() : "";
  const clipUrl = typeof body.clipUrl === "string" ? body.clipUrl.trim() : "";
  if (!copulaBriefId || !copulaUserId || !copulaClipId || !clipUrl) {
    return json(400, { error: "copulaBriefId, copulaUserId, copulaClipId, and clipUrl are required" });
  }

  const supabase = adminClient();
  const { data: bounty, error: be } = await supabase
    .from("bounties")
    .select("id")
    .eq("copula_brief_id", copulaBriefId)
    .single();
  if (be || !bounty) return json(404, { error: "no contract for that brief" });

  const { data: existing } = await supabase
    .from("bounty_claims")
    .select("id,status")
    .eq("copula_clip_id", copulaClipId)
    .maybeSingle();
  if (existing) return json(200, { claimId: existing.id, status: existing.status, duplicate: true });

  const { data, error } = await supabase
    .from("bounty_claims")
    .insert({
      bounty_id: bounty.id,
      copula_user_id: copulaUserId,
      copula_clip_id: copulaClipId,
      clip_url: clipUrl,
    })
    .select("id,status")
    .single();
  if (error) return json(500, { error: error.message });
  return json(201, { claimId: data.id, status: data.status });
});
