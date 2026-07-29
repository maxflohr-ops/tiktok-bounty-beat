import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useSession } from "@/lib/session";
import { createSoundListingCheckout, listMySoundListings } from "@/lib/sound-listings.functions";
import { BsBadge, BsButton, BsCard, BsDisplay, BsEyebrow, BsMono } from "@/components/bs";

const LIST_URL = "https://bountysounds.com/list-sound";
const LIST_TITLE = "List Your Sound for a TikTok Campaign — $200 / 30 Days | Bounty Sounds";
const LIST_DESC = "Get your song in front of TikTok clippers. $200 lists your sound on Bounty Sounds for a 30-day pay-per-view clipping campaign.";

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
  validateSearch: (s: Record<string, unknown>) => ({
    success: s.success === "1" || s.success === 1 ? true : undefined,
    cancelled: s.cancelled === "1" || s.cancelled === 1 ? true : undefined,
    id: typeof s.id === "string" ? s.id : undefined,
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

  const [artist, setArtist] = useState("");
  const [song, setSong] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [spotify, setSpotify] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    try {
      const res = await createFn({
        data: {
          artist_name: artist,
          song_title: song,
          tiktok_sound_url: tiktok || undefined,
          spotify_url: spotify || undefined,
          contact_email: email,
          notes: notes || undefined,
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
          <BsEyebrow>sound listings · $200 / 30 days</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            List your sound for a campaign
          </BsDisplay>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-bs-ink-soft)]">
            A single listing keeps your song on the Bounty Board for thirty days. Editors discover it, take contracts,
            and deliver TikToks using your sound. Every listing is reviewed before it goes live.
          </p>
        </div>

        {search.success ? (
          <BsCard variant="flat" className="mx-auto mt-6 max-w-2xl text-center">
            <BsMono className="uppercase text-[var(--color-bs-ink)]">payment received · listing queued for review</BsMono>
            <p className="mt-1 text-sm text-[var(--color-bs-ink-soft)]">
              We'll review and publish your listing shortly. Watch your inbox.
            </p>
          </BsCard>
        ) : null}
        {search.cancelled ? (
          <BsCard variant="flat" className="mx-auto mt-6 max-w-2xl text-center">
            <BsMono className="uppercase text-[var(--color-bs-ink-mute)]">payment cancelled · your draft is saved below</BsMono>
          </BsCard>
        ) : null}

        {!ready ? null : !user ? (
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="mb-4 text-[var(--color-bs-ink-soft)]">Sign in to list a sound.</p>
            <BsButton onClick={() => navigate({ to: "/auth" })}>sign in</BsButton>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-[2fr,1fr]">
            <form onSubmit={submit}>
              <BsCard variant="flat">
                <BsEyebrow>the notice</BsEyebrow>
                <div className="mt-4 grid gap-4">
                  <Field label="Artist name" required>
                    <input required value={artist} onChange={(e) => setArtist(e.target.value)} className="bs-input" placeholder="Ridgeclub" />
                  </Field>
                  <Field label="Song title" required>
                    <input required value={song} onChange={(e) => setSong(e.target.value)} className="bs-input" placeholder="Do I Clench My Fist" />
                  </Field>
                  <Field label="TikTok sound URL" hint="Optional but strongly recommended">
                    <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="bs-input" placeholder="https://www.tiktok.com/music/..." />
                  </Field>
                  <Field label="Spotify / streaming link" hint="Optional">
                    <input value={spotify} onChange={(e) => setSpotify(e.target.value)} className="bs-input" placeholder="https://open.spotify.com/track/..." />
                  </Field>
                  <Field label="Contact email" required>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bs-input" />
                  </Field>
                  <Field label="Notes for the review team" hint="Genre, sync history, campaign goals, budget…">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bs-input min-h-[100px]" />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--color-bs-rule)] pt-4">
                  <div>
                    <BsEyebrow>listing fee</BsEyebrow>
                    <div className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-bs-ink)]">$200 · 30 days</div>
                  </div>
                  <BsButton type="submit" variant="accent" disabled={busy} aria-busy={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {busy ? "opening checkout…" : "pay & submit"}
                  </BsButton>
                </div>
                <p className="mt-3 text-xs text-[var(--color-bs-ink-mute)]">
                  Secure payment through Stripe. Your listing enters review the moment payment clears.
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
                </ul>

                {mine.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--color-bs-rule)] pt-4">
                    <BsEyebrow>your listings</BsEyebrow>
                    <ul className="mt-3 space-y-3 text-sm">
                      {mine.map((l) => (
                        <li key={l.id} className="border border-[var(--color-bs-rule)] p-3">
                          <div className="font-[var(--font-display)] font-semibold text-[var(--color-bs-ink)]">{l.song_title}</div>
                          <div className="text-xs text-[var(--color-bs-ink-mute)]">{l.artist_name}</div>
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
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <BsEyebrow>
          {label}{required ? " *" : ""}
        </BsEyebrow>
        {hint ? <span className="text-xs text-[var(--color-bs-ink-mute)]">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
