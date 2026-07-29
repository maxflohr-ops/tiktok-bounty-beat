// copula → bountysounds: publish (or update) a copula direction as a contract.
// Upserts on bounties.copula_brief_id, so re-sends are idempotent.
//
// Body: {
//   copulaBriefId: string,        // required, stable per brief
//   artistSlug: string,           // required, future multi-tenant key
//   title: string,                // required
//   description?: string,
//   soundName?: string,
//   tiktokSoundUrl?: string,
//   sourceAssetsUrl?: string,
//   rewardCashCents?: number,     // cents per 100k verified views
//   deadline?: string,            // ISO timestamp
// }

import { adminClient, json, readSignedJson } from "../_shared/bridge.ts";

Deno.serve(async (req) => {
  const body = await readSignedJson(req);
  if (body instanceof Response) return body;

  const copulaBriefId = typeof body.copulaBriefId === "string" ? body.copulaBriefId.trim() : "";
  const artistSlug = typeof body.artistSlug === "string" ? body.artistSlug.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!copulaBriefId || !artistSlug || !title) {
    return json(400, { error: "copulaBriefId, artistSlug, and title are required" });
  }
  const reward = Number.isInteger(body.rewardCashCents) && (body.rewardCashCents as number) >= 0
    ? (body.rewardCashCents as number)
    : 0;

  const supabase = adminClient();
  const row = {
    copula_brief_id: copulaBriefId,
    artist_slug: artistSlug,
    title,
    description: typeof body.description === "string" ? body.description : "",
    sound_name: typeof body.soundName === "string" && body.soundName ? body.soundName : title,
    tiktok_sound_url: typeof body.tiktokSoundUrl === "string" ? body.tiktokSoundUrl : null,
    source_assets_url: typeof body.sourceAssetsUrl === "string" ? body.sourceAssetsUrl : null,
    reward_cash_cents: reward,
    payout_type: "per_1k_views", // rate semantics: cents per 100k verified views
    platform_target: "tiktok",
    deadline: typeof body.deadline === "string" ? body.deadline : null,
    status: "active",
  };

  const { data, error } = await supabase
    .from("bounties")
    .upsert(row, { onConflict: "copula_brief_id" })
    .select("id,contract_no")
    .single();
  if (error) return json(500, { error: error.message });
  return json(200, { bountyId: data.id, contractNo: data.contract_no });
});
