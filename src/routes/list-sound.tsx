import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useSession } from "@/lib/session";
import { createSoundListingCheckout, listMySoundListings } from "@/lib/sound-listings.functions";

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
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />

      <section className="container-board relative z-10 py-6">
        <div className="board-frame relative p-6 md:p-12">
          <div className="corner-bracket absolute top-3 left-3 border-t-2 border-l-2" />
          <div className="corner-bracket absolute top-3 right-3 border-t-2 border-r-2" />
          <div className="corner-bracket absolute bottom-3 left-3 border-b-2 border-l-2" />
          <div className="corner-bracket absolute bottom-3 right-3 border-b-2 border-r-2" />

          <div className="mb-6 text-center">
            <div className="system-bar mx-auto">
              <span className="status-dot" /> sound listings · $200 / 30 days
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight text-bone md:text-5xl">
              List your sound for a campaign
            </h1>
            <p className="script-note mt-3 text-xl text-silver-glow">
              Post it on the board. Let the clippers cut.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-bone-soft">
              A single listing keeps your song on the board for thirty days. Editors will discover it, take contracts, and
              deliver TikToks using your sound. Every listing is reviewed before it goes live.
            </p>
          </div>

          {search.success ? (
            <div className="mx-auto mb-6 max-w-2xl border border-[var(--neon-cyan)] bg-[var(--wall-2)]/60 p-4 text-center">
              <p className="terminal text-bone">payment received · listing queued for review</p>
              <p className="mt-1 text-sm text-bone-soft">We'll review and publish your listing shortly. Watch your inbox.</p>
            </div>
          ) : null}
          {search.cancelled ? (
            <div className="mx-auto mb-6 max-w-2xl border border-[var(--iron)] bg-[var(--wall-2)]/60 p-4 text-center">
              <p className="terminal text-bone-soft">payment cancelled · your draft is saved below</p>
            </div>
          ) : null}

          {!ready ? null : !user ? (
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-4 text-bone-soft">Sign in to list a sound.</p>
              <button className="silver-btn" onClick={() => navigate({ to: "/auth" })}>
                sign in
              </button>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
              <form onSubmit={submit} className="border border-[var(--iron)] bg-[var(--wall-2)]/50 p-6">
                <h2 className="label-cap mb-4 text-silver">the notice</h2>
                <div className="grid gap-4">
                  <Field label="Artist name" required>
                    <input required value={artist} onChange={(e) => setArtist(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)]" placeholder="Ridgeclub" />
                  </Field>
                  <Field label="Song title" required>
                    <input required value={song} onChange={(e) => setSong(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)]" placeholder="Do I Clench My Fist" />
                  </Field>
                  <Field label="TikTok sound URL" hint="Optional but strongly recommended">
                    <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)]" placeholder="https://www.tiktok.com/music/..." />
                  </Field>
                  <Field label="Spotify / streaming link" hint="Optional">
                    <input value={spotify} onChange={(e) => setSpotify(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)]" placeholder="https://open.spotify.com/track/..." />
                  </Field>
                  <Field label="Contact email" required>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)]" />
                  </Field>
                  <Field label="Notes for the review team" hint="Genre, sync history, campaign goals, budget…">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-[var(--iron)] bg-black/40 px-3 py-2 text-bone placeholder:text-bone-soft/50 focus:outline-none focus:border-[var(--neon-cyan)] min-h-[100px]" />
                  </Field>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--iron)] pt-4">
                  <div>
                    <div className="label-cap text-silver">listing fee</div>
                    <div className="font-display text-2xl text-bone">$200 · 30 days</div>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    aria-busy={busy}
                    className="silver-btn disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {busy ? "opening checkout…" : "pay & submit"}
                    </span>
                  </button>
                </div>
                <p className="mt-3 text-xs text-bone-soft">
                  Secure payment through Stripe. Your listing enters review the moment payment clears.
                </p>
              </form>

              <aside className="border border-[var(--iron)] bg-[var(--wall-2)]/50 p-6">
                <h2 className="label-cap mb-3 text-silver">what you get</h2>
                <ul className="space-y-2 text-sm text-bone-soft">
                  <li>· 30 days on the public board</li>
                  <li>· Contracts editors can claim</li>
                  <li>· TikTok proof reviewed by staff</li>
                  <li>· Payout rules agreed up front</li>
                  <li>· Airtable + email updates on every action</li>
                </ul>

                {mine.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--iron)] pt-4">
                    <h3 className="label-cap mb-3 text-silver">your listings</h3>
                    <ul className="space-y-3 text-sm">
                      {mine.map((l) => (
                        <li key={l.id} className="border border-[var(--border)] p-3">
                          <div className="font-body text-bone">{l.song_title}</div>
                          <div className="text-xs text-bone-soft">{l.artist_name}</div>
                          <div className="terminal mt-1 text-xs text-silver">{l.status.replace(/_/g, " ")}</div>
                          {l.expires_at ? (
                            <div className="text-xs text-bone-soft">until {new Date(l.expires_at).toLocaleDateString()}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="label-cap text-silver">
          {label}{required ? " *" : ""}
        </span>
        {hint ? <span className="text-xs text-bone-soft">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}
