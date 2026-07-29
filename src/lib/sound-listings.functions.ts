import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";

const LISTING_FEE_CENTS = 20000; // $200
const FEATURED_TIER_CENTS = {
  none: 0,
  featured: 100000, // $1,000 / month, pinned #1 on the board
  featured_plus: 250000, // $2,500 / month, pinned + presented-by on the landing ledger
} as const;
const LISTING_DAYS = 30;

function appOrigin() {
  return process.env.NODE_ENV === "production"
    ? "https://www.bountysounds.com"
    : "http://localhost:8080";
}

const listingInput = z.object({
  listing_type: z.enum(["sound", "stream", "keynote", "podcast"]).default("sound"),
  artist_name: z.string().trim().min(1, "Name is required").max(120),
  song_title: z.string().trim().min(1, "Title is required").max(200),
  tiktok_sound_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .refine((v) => /tiktok\.com/i.test(v), "Must be a TikTok sound URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  spotify_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // Streams need a Twitch/YouTube/Kick link; keynote footage can live anywhere
  // watchable (validated per-type in the superRefine below).
  stream_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  stream_at: z.string().datetime({ offset: true }).optional().or(z.literal("").transform(() => undefined)),
  contact_email: z.string().trim().email("Enter a valid email"),
  notes: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  hashtags: z.string().trim().max(400).optional().or(z.literal("").transform(() => undefined)),
  rules: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  featured_tier: z.enum(["none", "featured", "featured_plus"]).default("none"),
  attribution: z
    .object({
      utm_source: z.string().max(200).optional(),
      utm_medium: z.string().max(200).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      gclid: z.string().max(200).optional(),
      ttclid: z.string().max(200).optional(),
      fbclid: z.string().max(200).optional(),
      referrer: z.string().max(300).optional(),
      landing: z.string().max(200).optional(),
      captured_at: z.string().max(40).optional(),
    })
    .optional(),
}).superRefine((d, ctx) => {
  if (d.listing_type === "stream") {
    if (!d.stream_url) {
      ctx.addIssue({ code: "custom", message: "A stream listing needs a channel or VOD link", path: ["stream_url"] });
    } else if (!/twitch\.tv|youtube\.com|youtu\.be|kick\.com/i.test(d.stream_url)) {
      ctx.addIssue({ code: "custom", message: "Use a Twitch, YouTube, or Kick link", path: ["stream_url"] });
    }
  }
  if ((d.listing_type === "keynote" || d.listing_type === "podcast") && !d.stream_url) {
    ctx.addIssue({ code: "custom", message: "This listing needs a footage link", path: ["stream_url"] });
  }
});

// Create a Stripe Checkout session for a $200 / 30-day sound listing.
export const createSoundListingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: listing, error: le } = await supabaseAdmin
      .from("sound_listings")
      .insert({
        user_id: context.userId,
        listing_type: data.listing_type,
        artist_name: data.artist_name,
        song_title: data.song_title,
        tiktok_sound_url: data.tiktok_sound_url ?? null,
        spotify_url: data.spotify_url ?? null,
        stream_url: data.stream_url ?? null,
        stream_at: data.stream_at ?? null,
        contact_email: data.contact_email,
        notes: data.notes ?? null,
        hashtags: data.hashtags ?? null,
        rules: data.rules ?? null,
        featured_requested: data.featured_tier !== "none",
        featured_tier: data.featured_tier,
        amount_cents: LISTING_FEE_CENTS + FEATURED_TIER_CENTS[data.featured_tier],
        currency: "USD",
        status: "pending_payment",
      })
      .select("id")
      .single();
    if (le || !listing) throw new Error(le?.message ?? "Could not create listing.");

    const { getStripe } = await import("@/lib/stripe.server");
    const stripe = getStripe();
    const origin = appOrigin();

    const lineItems = [
      {
        price_data: {
          currency: "usd",
          unit_amount: LISTING_FEE_CENTS,
          product_data: {
            name: `${
              { sound: "Sound", stream: "Stream", keynote: "Keynote", podcast: "Podcast" }[data.listing_type]
            } listing — ${data.song_title} by ${data.artist_name}`,
            description: `30-day campaign listing on Bounty Sounds`,
          },
        },
        quantity: 1,
      },
    ];
    if (data.featured_tier !== "none") {
      lineItems.push({
        price_data: {
          currency: "usd",
          unit_amount: FEATURED_TIER_CENTS[data.featured_tier],
          product_data: {
            name: data.featured_tier === "featured_plus" ? "Featured+ placement — first month" : "Featured placement — first month",
            description:
              data.featured_tier === "featured_plus"
                ? "Pinned #1 with the featured stamp, plus the presented-by line on the landing page"
                : "Pinned #1 on the Bounty Board with the featured stamp",
          },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      metadata: {
        sound_listing_id: listing.id,
        kind: "sound_listing",
        featured: data.featured_tier,
        utm_source: data.attribution?.utm_source ?? "",
        utm_campaign: data.attribution?.utm_campaign ?? "",
      },
      payment_intent_data: {
        metadata: { sound_listing_id: listing.id, kind: "sound_listing" },
      },
      success_url: `${origin}/list-sound?success=1&id=${listing.id}`,
      cancel_url: `${origin}/list-sound?cancelled=1&id=${listing.id}`,
      client_reference_id: listing.id,
    });

    await supabaseAdmin
      .from("sound_listings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", listing.id);

    notifyAsync({
      event: "sound_listing.created",
      actor: data.contact_email,
      reference: `${data.artist_name} — ${data.song_title}`,
      details: {
        listing_id: listing.id,
        listing_type: data.listing_type,
        featured: data.featured_tier,
        amount_cents: LISTING_FEE_CENTS + FEATURED_TIER_CENTS[data.featured_tier],
        tiktok_sound_url: data.tiktok_sound_url ?? null,
        spotify_url: data.spotify_url ?? null,
        stream_url: data.stream_url ?? null,
        stream_at: data.stream_at ?? null,
        hashtags: data.hashtags ?? null,
        rules: data.rules ?? null,
        notes: data.notes ?? null,
        attribution: data.attribution ?? null,
      },
    });

    return { url: session.url, sessionId: session.id, listingId: listing.id };
  });

// List the caller's sound listings.
export const listMySoundListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sound_listings")
      .select("id,listing_type,artist_name,song_title,status,listed_at,expires_at,amount_cents,currency,created_at,tiktok_sound_url,spotify_url,stream_url,stream_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
