import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAsync } from "@/lib/notify.server";

const LISTING_FEE_CENTS = 20000; // $200
const LISTING_DAYS = 30;

function appOrigin() {
  return process.env.NODE_ENV === "production"
    ? "https://www.bountysounds.com"
    : "http://localhost:8080";
}

const listingInput = z.object({
  artist_name: z.string().trim().min(1, "Artist name is required").max(120),
  song_title: z.string().trim().min(1, "Song title is required").max(200),
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
  contact_email: z.string().trim().email("Enter a valid email"),
  notes: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
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
        artist_name: data.artist_name,
        song_title: data.song_title,
        tiktok_sound_url: data.tiktok_sound_url ?? null,
        spotify_url: data.spotify_url ?? null,
        contact_email: data.contact_email,
        notes: data.notes ?? null,
        amount_cents: LISTING_FEE_CENTS,
        currency: "USD",
        status: "pending_payment",
      })
      .select("id")
      .single();
    if (le || !listing) throw new Error(le?.message ?? "Could not create listing.");

    const { getStripe } = await import("@/lib/stripe.server");
    const stripe = getStripe();
    const origin = appOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: LISTING_FEE_CENTS,
            product_data: {
              name: `Sound listing — ${data.song_title} by ${data.artist_name}`,
              description: `30-day campaign listing on THE BOARD`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        sound_listing_id: listing.id,
        kind: "sound_listing",
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
        amount_cents: LISTING_FEE_CENTS,
        tiktok_sound_url: data.tiktok_sound_url ?? null,
        spotify_url: data.spotify_url ?? null,
        notes: data.notes ?? null,
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
      .select("id,artist_name,song_title,status,listed_at,expires_at,amount_cents,currency,created_at,tiktok_sound_url,spotify_url")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
