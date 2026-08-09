import { createFileRoute } from "@tanstack/react-router";

// The programmatic door for posting a bounty — built for AI agents.
// GET  → self-describing usage doc (JSON)
// POST → authenticated: create a listing + return the Stripe Checkout URL.
//        Auth is a Supabase access token from /auth/v1/token (same account
//        system as the site — agents sign up at /auth like anyone else).
// The purse is posted separately after the listing is paid, same as the
// web flow. Listing goes live once Checkout completes.

const USAGE = {
  name: "Bounty Sounds — public listings API",
  post: {
    url: "/api/public/occ/listings",
    auth: "Authorization: Bearer <supabase access_token> (create an account via the site or /auth/v1/signup; sign in via /auth/v1/token?grant_type=password)",
    content_type: "application/json",
    body: {
      listing_type: "sound | stream | keynote | podcast (default sound)",
      artist_name: "string, required",
      song_title: "string, required (campaign title for non-sound types)",
      tiktok_sound_url: "TikTok sound URL (sound listings)",
      spotify_url: "optional",
      stream_url: "Twitch/YouTube/Kick link — required for stream/keynote/podcast",
      stream_at: "ISO datetime, optional",
      contact_email: "string, required",
      notes: "brief for clippers, optional",
      hashtags: "comma-separated, optional",
      rules: "the don'ts, optional",
      featured_tier: "none | featured | featured_plus (default none)",
      campaign_access: "public | private_invite | private_apply (default public)",
    },
    response: {
      checkout_url: "complete payment here — the listing goes live after Checkout",
      listing_id: "uuid",
    },
    pricing: "listing $200 / 30 days; featured tiers extra; the purse is posted separately at your rate",
  },
  feed: "/api/public/occ/contracts",
  guide: "/llms.txt",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export const Route = createFileRoute("/api/public/occ/listings")({
  server: {
    handlers: {
      GET: async () => json(USAGE),
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer /i, "");
        if (!token || token.split(".").length !== 3)
          return json({ error: "unauthorized", hint: USAGE.post.auth }, 401);

        const { createClient } = await import("@supabase/supabase-js");
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)
          return json({ error: "listings API temporarily unavailable" }, 503);
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: authError } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub as string | undefined;
        if (authError || !userId)
          return json({ error: "unauthorized", hint: USAGE.post.auth }, 401);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid JSON body", usage: USAGE.post.body }, 400);
        }

        const { listingInput, createListingWithCheckout } = await import(
          "@/lib/sound-listings.functions"
        );
        const parsed = listingInput.safeParse(body);
        if (!parsed.success)
          return json(
            {
              error: "validation failed",
              issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
              usage: USAGE.post.body,
            },
            422,
          );

        try {
          const result = await createListingWithCheckout(parsed.data, userId);
          return json(
            {
              ok: true,
              listing_id: result.listingId,
              checkout_url: result.url,
              next: "Complete payment at checkout_url. The listing reviews and posts after payment; the purse is posted separately at your rate.",
            },
            201,
          );
        } catch (err) {
          return json({ error: err instanceof Error ? err.message : "listing failed" }, 500);
        }
      },
    },
  },
});
