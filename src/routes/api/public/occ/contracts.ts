import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/occ/contracts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const unavailable = () =>
          new Response(JSON.stringify({ error: "feed temporarily unavailable" }), {
            status: 503,
            headers: { "content-type": "application/json; charset=utf-8" },
          });

        const { bountyToOcc } = await import("@/lib/occ");

        let list: any[];
        const counts = new Map<string, { claims: number; approved: number }>();
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Scrub banned names before serving — the feed must never carry a
          // listing the board would refuse to show.
          const { purgeBannedListings } = await import("@/lib/bounties.functions");
          await purgeBannedListings(supabaseAdmin);
          const { data: bounties, error } = await supabaseAdmin
            .from("bounties")
            .select(
              "id,contract_no,title,description,sound_name,tiktok_sound_url,cover_url,artist_song,source_assets_url,reward_points,reward_cash_cents,currency,payout_type,platform_target,max_submissions,deadline,status,created_at,funded_cash_cents",
            )
            .neq("status", "draft")
            .order("contract_no", { ascending: false });
          if (error) return unavailable();

          list = bounties ?? [];
          if (list.length > 0) {
            const { data: subs } = await supabaseAdmin
              .from("submissions")
              .select("bounty_id,status")
              .in(
                "bounty_id",
                list.map((b) => b.id),
              );
            for (const s of subs ?? []) {
              const row = counts.get(s.bounty_id) ?? { claims: 0, approved: 0 };
              row.claims += 1;
              if (s.status === "approved" || s.status === "paid") row.approved += 1;
              counts.set(s.bounty_id, row);
            }
          }
        } catch {
          return unavailable();
        }

        const origin = new URL(request.url).origin;
        const contracts = list
          .map((b) =>
            bountyToOcc(
              {
                ...b,
                claims_count: counts.get(b.id)?.claims ?? 0,
                approved_count: counts.get(b.id)?.approved ?? 0,
              },
              origin,
            ),
          )
          .filter(Boolean);

        const body = {
          format: "open-clipping-contract",
          occ_version: "0.1",
          schema:
            "https://raw.githubusercontent.com/maxflohr-ops/tiktok-bounty-beat/main/occ/spec/contract.schema.json",
          generated_at: new Date().toISOString(),
          count: contracts.length,
          contracts,
        };
        return new Response(JSON.stringify(body, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
