import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicBounties } from "@/lib/bounties.functions";
import { submitEntry } from "@/lib/submissions.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { useSession } from "@/lib/session";
import { getMe } from "@/lib/me.functions";
import { Music, Trophy, Coins, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bounty/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Bounty · ${params.id.slice(0, 6)} — Sound Bounties` },
      { name: "description", content: "Submit your TikTok edit for this bounty." },
    ],
  }),
  component: BountyDetail,
});

function money(cents: number, currency = "USD") {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

function BountyDetail() {
  const { id } = Route.useParams();
  const listFn = useServerFn(listPublicBounties);
  const submitFn = useServerFn(submitEntry);
  const meFn = useServerFn(getMe);
  const { user } = useSession();
  const navigate = useNavigate();

  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
  });
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });
  const bounty = bounties.find((b) => b.id === id);

  const [url, setUrl] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (me?.profile?.tiktok_handle) setHandle(me.profile.tiktok_handle);
  }, [me?.profile?.tiktok_handle]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const r = await submitFn({ data: { bounty_id: id, tiktok_video_url: url, tiktok_handle: handle } });
      toast.success(
        r.auto_check_passed
          ? "Submitted! Your video was auto-verified — pending final approval."
          : "Submitted! Awaiting review.",
      );
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  };

  if (!bounty) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-editorial py-20 text-center">
          <p className="font-display text-2xl">Bounty not found or no longer active.</p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Back to bounties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-editorial py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> All bounties
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <article>
            {bounty.cover_url ? (
              <img
                src={bounty.cover_url}
                alt=""
                className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover"
              />
            ) : null}
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Music className="h-4 w-4" /> {bounty.sound_name}
              {bounty.tiktok_sound_url ? (
                <a
                  href={bounty.tiktok_sound_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline"
                >
                  Sound page <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
            <h1 className="mt-2 font-display text-4xl leading-tight">{bounty.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {bounty.reward_points > 0 ? (
                <span className="chip">
                  <Trophy className="h-3 w-3" />
                  {bounty.reward_points} pts
                </span>
              ) : null}
              {bounty.reward_cash_cents > 0 ? (
                <span className="chip-brand">
                  <Coins className="h-3 w-3" />
                  {money(bounty.reward_cash_cents, bounty.currency)}
                </span>
              ) : null}
              {bounty.deadline ? (
                <span className="chip">
                  <Clock className="h-3 w-3" />
                  by {new Date(bounty.deadline).toLocaleDateString()}
                </span>
              ) : null}
            </div>
            <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-ink">
              {bounty.description}
            </p>
          </article>

          <aside className="rounded-2xl border border-border bg-background p-6 md:sticky md:top-24 md:self-start">
            <h2 className="font-display text-2xl">Submit your edit</h2>
            {!user ? (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Sign in as an editor to claim this bounty.
                </p>
                <Link
                  to="/auth"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sign in to submit
                </Link>
              </>
            ) : (
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <label className="block text-xs font-medium text-ink-soft">
                  Your TikTok video URL
                  <input
                    required
                    type="url"
                    value={url}
                    placeholder="https://www.tiktok.com/@you/video/..."
                    onChange={(e) => setUrl(e.target.value)}
                    maxLength={500}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                </label>
                <label className="block text-xs font-medium text-ink-soft">
                  Your TikTok handle
                  <div className="mt-1 flex items-center rounded-md border border-border bg-background focus-within:border-ink">
                    <span className="pl-3 text-ink-soft">@</span>
                    <input
                      required
                      value={handle}
                      maxLength={60}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                    />
                  </div>
                </label>
                <button
                  disabled={busy}
                  className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {busy ? "Submitting…" : "Submit for review"}
                </button>
                <p className="text-xs text-ink-soft">
                  We'll auto-verify the URL and handle instantly. A staff member confirms the
                  sound was used before points are awarded.
                </p>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
