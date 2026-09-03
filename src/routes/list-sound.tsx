import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { FooterNav } from "@/components/FooterNav";
import { useSession } from "@/lib/session";
import { createSoundListingCheckout, listMySoundListings } from "@/lib/sound-listings.functions";
import { BsBadge, BsButton, BsCard, BsDisplay, BsEyebrow, BsMono } from "@/components/bs";
import { InkDrips } from "@/components/ArtMarks";
import { getAttribution } from "@/lib/attribution";
import { setReturnTo } from "@/lib/return-to";

const LIST_URL = "https://bountysounds.com/list-sound";
const LIST_TITLE =
  "List a Sound, Stream, Keynote, or Podcast for Clipping — $200 / 30 Days | Bounty Sounds";
const LIST_DESC =
  "Get your song, stream, keynote, or podcast in front of TikTok clippers. $200 lists it on Bounty Sounds for a 30-day pay-per-view clipping campaign.";

export const Route = createFileRoute("/list-sound")({
  head: () => ({
    meta: [
      { title: LIST_TITLE },
      { name: "description", content: LIST_DESC },
      { property: "og:title", content: LIST_TITLE },
      { property: "og:description", content: LIST_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: LIST_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: LIST_URL }],
  }),
  validateSearch: (
    s: Record<string, unknown>,
  ): {
    success?: boolean;
    cancelled?: boolean;
    id?: string;
    type?: "stream" | "keynote" | "podcast";
  } => ({
    success: s.success === "1" || s.success === 1 ? true : undefined,
    cancelled: s.cancelled === "1" || s.cancelled === 1 ? true : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
    type:
      s.type === "stream" || s.type === "keynote" || s.type === "podcast"
        ? (s.type as "stream" | "keynote" | "podcast")
        : undefined,
  }),
  component: ListSoundPage,
});

function ListSoundPage() {
  const { user, loading } = useSession();
  const ready = !loading;
  const navigate = useNavigate();
  const search = useSearch({ from: "/list-sound" });
  const createFn = useServerFn(createSoundListingCheckout);
  const listFn = useServerFn(listMySoundListings);

  const { data: mine = [], refetch } = useQuery({
    queryKey: ["my-sound-listings", user?.id],
    queryFn: () => listFn(),
    enabled: !!user,
  });

  const [kind, setKind] = useState<"sound" | "stream" | "keynote" | "podcast">(
    search.type ?? "sound",
  );
  const [when, setWhen] = useState<"upcoming" | "previous">("upcoming");
  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [spotify, setSpotify] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [streamAt, setStreamAt] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [rules, setRules] = useState("");
  const [featuredTier, setFeaturedTier] = useState<"none" | "featured" | "featured_plus">("none");
  const [campaignAccess, setCampaignAccess] = useState<
    "public" | "private_invite" | "private_apply"
  >("public");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReturnTo(window.location.pathname + window.location.search);
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const res = await createFn({
        data: {
          listing_type: kind,
          artist_name: artist,
          song_title: song,
          tiktok_sound_url: kind === "sound" ? tiktok || undefined : undefined,
          spotify_url: kind === "sound" ? spotify || undefined : undefined,
          stream_url: kind !== "sound" ? streamUrl || undefined : undefined,
          stream_at:
            kind !== "sound" && when === "upcoming" && streamAt
              ? new Date(streamAt).toISOString()
              : undefined,
          contact_email: email,
          notes: notes || undefined,
          hashtags: hashtags || undefined,
          rules: rules || undefined,
          featured_tier: featuredTier,
          campaign_access: campaignAccess,
          attribution: getAttribution() ?? undefined,
        },
      });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        toast.error("Could not open checkout.");
        setBusy(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit listing.");
      setBusy(false);
      refetch();
    }
  };

  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />

      <section className="container-board relative py-10">
        <div className="mx-auto max-w-3xl text-center">
          <BsEyebrow>listings · $200 / 30 days</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            List a sound, stream, keynote — or podcast
          </BsDisplay>
          <InkDrips className="mx-auto -mt-1 w-44 opacity-50" />
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-bs-ink-soft)]">
            Thirty days on the Bounty Board. Editors take contracts and deliver TikToks cut from
            your footage — upcoming or already out.{" "}
            <a
              href="/for-artists"
              className="tap-inline underline underline-offset-2 hover:text-[var(--color-bs-ink)]"
            >
              the full breakdown →
            </a>
          </p>
        </div>

        {search.success ? (
          <BsCard variant="flat" className="mx-auto mt-6 max-w-2xl text-center">
            <BsMono className="uppercase text-[var(--color-bs-ink)]">
              payment received · listing queued for review
            </BsMono>
            <p className="mt-1 text-sm text-[var(--color-bs-ink-soft)]">
              We'll review and publish your listing shortly. Watch your inbox.
            </p>
          </BsCard>
        ) : null}
        {search.cancelled ? (
          <BsCard variant="flat" className="mx-auto mt-6 max-w-2xl text-center">
            <BsMono className="uppercase text-[var(--color-bs-ink-mute)]">
              payment cancelled · your draft is saved below
            </BsMono>
          </BsCard>
        ) : null}

        {!ready ? null : !user ? (
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="mb-4 text-[var(--color-bs-ink-soft)]">Sign in to list your campaign.</p>
            <BsButton
              onClick={() => {
                setReturnTo(window.location.pathname + window.location.search);
                navigate({ to: "/auth" });
              }}
            >
              sign in
            </BsButton>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-[2fr,1fr]">
            <form onSubmit={submit}>
              <BsCard variant="flat">
                <div className="flex items-center justify-between">
                  <BsEyebrow>the notice</BsEyebrow>
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Listing type">
                    {(["sound", "stream", "keynote", "podcast"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={kind === k}
                        onClick={() => setKind(k)}
                        className={
                          kind === k
                            ? "bs-btn px-4 py-1.5 text-xs"
                            : "bs-btn bs-btn-ghost px-4 py-1.5 text-xs"
                        }
                      >
                        {k === "sound"
                          ? "a sound"
                          : k === "stream"
                            ? "a livestream"
                            : k === "keynote"
                              ? "a keynote"
                              : "a podcast"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-4">
                  <Field
                    label={
                      kind === "sound"
                        ? "Artist name"
                        : kind === "stream"
                          ? "Streamer name"
                          : kind === "keynote"
                            ? "Speaker or company"
                            : "Podcast or host"
                    }
                    required
                  >
                    <input
                      required
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="bs-input"
                      placeholder={
                        kind === "sound"
                          ? "Ridgeclub"
                          : kind === "stream"
                            ? "ebbionline"
                            : kind === "keynote"
                              ? "Meridian"
                              : "The Grind Show"
                      }
                    />
                  </Field>
                  <Field
                    label={
                      kind === "sound"
                        ? "Song title"
                        : kind === "stream"
                          ? "Stream title"
                          : kind === "keynote"
                            ? "Keynote title"
                            : "Episode title"
                    }
                    required
                  >
                    <input
                      required
                      value={song}
                      onChange={(e) => setSong(e.target.value)}
                      className="bs-input"
                      placeholder={
                        kind === "sound"
                          ? "Do I Clench My Fist"
                          : kind === "stream"
                            ? "Thursday variety stream"
                            : kind === "keynote"
                              ? "Developer Keynote '26"
                              : "Ep. 41 — the comeback"
                      }
                    />
                  </Field>
                  {kind === "sound" ? (
                    <>
                      <Field label="TikTok sound URL" hint="Optional but strongly recommended">
                        <input
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          className="bs-input"
                          placeholder="https://www.tiktok.com/music/..."
                        />
                      </Field>
                      <Field label="Spotify / streaming link" hint="Optional">
                        <input
                          value={spotify}
                          onChange={(e) => setSpotify(e.target.value)}
                          className="bs-input"
                          placeholder="https://open.spotify.com/track/..."
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field
                        label={kind === "stream" ? "Channel or VOD link" : "Footage link"}
                        required
                        hint={
                          kind === "stream"
                            ? "Twitch, YouTube, or Kick"
                            : "YouTube, Spotify, Drive — anywhere clippers can watch it"
                        }
                      >
                        <input
                          required
                          value={streamUrl}
                          onChange={(e) => setStreamUrl(e.target.value)}
                          className="bs-input"
                          placeholder={
                            kind === "stream"
                              ? "https://twitch.tv/ebbionline"
                              : "https://youtube.com/watch?v=…"
                          }
                        />
                      </Field>
                      <Field label="When">
                        <div className="flex flex-wrap items-center gap-2">
                          {(["upcoming", "previous"] as const).map((w) => (
                            <button
                              key={w}
                              type="button"
                              aria-pressed={when === w}
                              onClick={() => setWhen(w)}
                              className={
                                when === w
                                  ? "bs-btn px-4 py-1.5 text-xs"
                                  : "bs-btn bs-btn-ghost px-4 py-1.5 text-xs"
                              }
                            >
                              {w === "upcoming"
                                ? kind === "stream"
                                  ? "upcoming stream"
                                  : kind === "keynote"
                                    ? "upcoming keynote"
                                    : "upcoming episode"
                                : kind === "stream"
                                  ? "previous stream / VOD"
                                  : "already out"}
                            </button>
                          ))}
                          {when === "upcoming" ? (
                            <input
                              type="datetime-local"
                              value={streamAt}
                              onChange={(e) => setStreamAt(e.target.value)}
                              className="bs-input w-auto"
                              aria-label="Stream date and time"
                            />
                          ) : null}
                        </div>
                      </Field>
                    </>
                  )}
                  <Field label="Campaign hashtags" hint="Clippers put these in their captions">
                    <input
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      className="bs-input"
                      placeholder="#yoursound #yourname"
                    />
                  </Field>
                  <Field label="Campaign rules" hint="Shown to every clipper before they post">
                    <textarea
                      value={rules}
                      onChange={(e) => setRules(e.target.value)}
                      className="bs-input min-h-[80px]"
                      placeholder="9:16 only. Subtitles on. No logo overlays. Keep the drop at full volume…"
                    />
                  </Field>
                  <Field label="Contact email" required>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bs-input"
                    />
                  </Field>
                  <Field
                    label="Notes for the review team"
                    hint={
                      kind === "sound"
                        ? "Genre, sync history, campaign goals, budget…"
                        : "Which moments to cut, what to avoid, budget…"
                    }
                  >
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bs-input min-h-[100px]"
                    />
                  </Field>
                </div>

                <fieldset className="mt-6 border border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)] p-4">
                  <legend className="px-1 font-[var(--font-display)] text-sm font-semibold text-[var(--color-bs-ink)]">
                    Campaign access
                  </legend>
                  {(
                    [
                      { v: "public", label: "Public", sub: "Any verified editor can claim it." },
                      {
                        v: "private_invite",
                        label: "Private — invite only",
                        sub: "Only creators you invite can submit clips.",
                      },
                      {
                        v: "private_apply",
                        label: "Private — creators apply",
                        sub: "Editors pitch first; you approve who gets in.",
                      },
                    ] as const
                  ).map((o) => (
                    <label key={o.v} className="flex cursor-pointer items-start gap-3 py-2">
                      <input
                        type="radio"
                        name="campaign-access"
                        checked={campaignAccess === o.v}
                        onChange={() => setCampaignAccess(o.v)}
                        className="mt-1 h-4 w-4 accent-[var(--color-bs-accent)]"
                      />
                      <span>
                        <span className="font-[var(--font-display)] font-semibold text-[var(--color-bs-ink)]">
                          {o.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-[var(--color-bs-ink-soft)]">
                          {o.sub}
                        </span>
                      </span>
                    </label>
                  ))}
                  <p className="mt-1 border-t border-[var(--color-bs-rule)] pt-2 text-xs text-[var(--color-bs-ink-mute)]">
                    Pricing is the same either way.
                  </p>
                </fieldset>

                <fieldset className="mt-6 border border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)] p-4">
                  <legend className="px-1 font-[var(--font-display)] text-sm font-semibold text-[var(--color-bs-ink)]">
                    Placement
                  </legend>
                  {(
                    [
                      {
                        v: "none",
                        label: "Standard listing",
                        sub: "On the board with everything else.",
                      },
                      {
                        v: "featured",
                        label: "Featured — $1,000 / month",
                        sub: "Pinned #1 with the featured stamp. First month billed now.",
                      },
                      {
                        v: "featured_plus",
                        label: "Featured+ — $2,500 / month",
                        sub: "Pinned #1, plus the presented-by line on the front page. First month billed now.",
                      },
                    ] as const
                  ).map((o) => (
                    <label key={o.v} className="flex cursor-pointer items-start gap-3 py-2">
                      <input
                        type="radio"
                        name="placement"
                        checked={featuredTier === o.v}
                        onChange={() => setFeaturedTier(o.v)}
                        className="mt-1 h-4 w-4 accent-[var(--color-bs-accent)]"
                      />
                      <span>
                        <span className="font-[var(--font-display)] font-semibold text-[var(--color-bs-ink)]">
                          {o.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-[var(--color-bs-ink-soft)]">
                          {o.sub}
                        </span>
                      </span>
                    </label>
                  ))}
                  <p className="mt-1 border-t border-[var(--color-bs-rule)] pt-2 text-xs text-[var(--color-bs-ink-mute)]">
                    bigger than featured?{" "}
                    <a
                      href="/api/go/florra"
                      target="_blank"
                      rel="noreferrer"
                      className="tap-inline underline underline-offset-2 hover:text-[var(--color-bs-ink)]"
                    >
                      florra.club
                    </a>
                  </p>
                </fieldset>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--color-bs-rule)] pt-4">
                  <div>
                    <BsEyebrow>due today</BsEyebrow>
                    <div className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-bs-ink)]">
                      {featuredTier === "featured_plus"
                        ? "$2,700"
                        : featuredTier === "featured"
                          ? "$1,200"
                          : "$200"}{" "}
                      · 30 days
                    </div>
                  </div>
                  <BsButton type="submit" variant="accent" disabled={busy} aria-busy={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {busy ? "opening checkout…" : "pay & submit"}
                  </BsButton>
                </div>
                <p className="mt-3 text-xs text-[var(--color-bs-ink-mute)]">
                  Secure payment through Stripe. Your listing enters review the moment payment
                  clears.
                </p>
              </BsCard>
            </form>

            <aside>
              <BsCard variant="flat">
                <BsEyebrow>what you get</BsEyebrow>
                <ul className="mt-3 space-y-2 text-sm text-[var(--color-bs-ink-soft)]">
                  <li>· 30 days on the public board</li>
                  <li>· Contracts editors can claim</li>
                  <li>· TikTok proof reviewed by staff</li>
                  <li>· Payout rules agreed up front</li>
                  <li>· Airtable + email updates on every action</li>
                  <li>· Optional: featured slot, pinned #1 — $1,000/mo</li>
                </ul>

                {mine.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--color-bs-rule)] pt-4">
                    <BsEyebrow>your listings</BsEyebrow>
                    <ul className="mt-3 space-y-3 text-sm">
                      {mine.map((l) => (
                        <li key={l.id} className="border border-[var(--color-bs-rule)] p-3">
                          <div className="font-[var(--font-display)] font-semibold text-[var(--color-bs-ink)]">
                            {l.song_title}
                          </div>
                          <div className="text-xs text-[var(--color-bs-ink-mute)]">
                            {l.artist_name}
                          </div>
                          <BsBadge className="mt-2">{l.status.replace(/_/g, " ")}</BsBadge>
                          {l.expires_at ? (
                            <div className="mt-1 text-xs text-[var(--color-bs-ink-mute)]">
                              until {new Date(l.expires_at).toLocaleDateString()}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </BsCard>
            </aside>
          </div>
        )}
      </section>

      <footer className="border-t border-[var(--color-bs-rule)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-[var(--color-bs-ink-mute)]">
          <FooterNav />
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <BsEyebrow>
          {label}
          {required ? " *" : ""}
        </BsEyebrow>
        {hint ? <span className="text-xs text-[var(--color-bs-ink-mute)]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
