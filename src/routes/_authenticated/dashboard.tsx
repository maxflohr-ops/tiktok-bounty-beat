import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMySubmissions } from "@/lib/submissions.functions";
import { getMe, updateMyProfile } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Music, ExternalLink, Check, X, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Sound Bounties" },
      { name: "description", content: "Your bounty submissions, points and profile." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const meFn = useServerFn(getMe);
  const subsFn = useServerFn(listMySubmissions);
  const updFn = useServerFn(updateMyProfile);
  const { data: me, refetch: refetchMe } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: subs = [] } = useQuery({ queryKey: ["mySubs"], queryFn: () => subsFn() });

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  useEffect(() => {
    if (me?.profile) {
      setName(me.profile.display_name ?? "");
      setHandle(me.profile.tiktok_handle ?? "");
    }
  }, [me?.profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updFn({ data: { display_name: name, tiktok_handle: handle } });
      toast.success("Profile updated.");
      refetchMe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-editorial grid gap-10 py-10 md:grid-cols-[1fr_320px]">
        <section>
          <h1 className="font-display text-3xl">Your submissions</h1>
          <p className="mt-1 text-ink-soft">Track status and points earned.</p>
          {subs.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <p className="font-display text-xl">Nothing here yet.</p>
              <p className="mt-1 text-sm text-ink-soft">Pick a bounty to submit your first edit.</p>
              <Link
                to="/"
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Browse bounties
              </Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {subs.map((s) => (
                <li key={s.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start gap-4">
                    {s.oembed_thumbnail ? (
                      <img
                        src={s.oembed_thumbnail}
                        alt=""
                        className="h-20 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-16 items-center justify-center rounded bg-surface">
                        <Music className="h-5 w-5 text-ink-soft" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <Music className="h-3 w-3" /> {s.bounty?.sound_name}
                      </div>
                      <div className="font-medium">{s.bounty?.title}</div>
                      <a
                        href={s.tiktok_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
                      >
                        {s.tiktok_video_url} <ExternalLink className="h-3 w-3" />
                      </a>
                      {s.review_notes ? (
                        <p className="mt-1 text-xs text-ink-soft">"{s.review_notes}"</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <StatusBadge status={s.status} />
                      {s.status === "approved" ? (
                        <div className="mt-1 text-xs text-ink-soft">
                          +{s.awarded_points} pts
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <div className="rounded-2xl border border-border bg-background p-5">
            <h2 className="font-display text-xl">Profile</h2>
            <form onSubmit={save} className="mt-4 space-y-3 text-sm">
              <label className="block text-xs font-medium text-ink-soft">
                Display name
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block text-xs font-medium text-ink-soft">
                TikTok handle
                <div className="mt-1 flex items-center rounded-md border border-border bg-background focus-within:border-ink">
                  <span className="pl-3 text-ink-soft">@</span>
                  <input
                    value={handle}
                    maxLength={60}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                  />
                </div>
              </label>
              <button className="w-full rounded-md bg-primary py-2 text-primary-foreground hover:bg-primary/90">
                Save profile
              </button>
            </form>
            <div className="mt-6 rounded-lg bg-surface p-4 text-center">
              <div className="text-xs text-ink-soft">Total points</div>
              <div className="font-display text-3xl">{me?.profile?.points ?? 0}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved")
    return (
      <span className="chip" style={{ background: "#e8f5e9", borderColor: "#a5d6a7" }}>
        <Check className="h-3 w-3" /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="chip" style={{ background: "#fdecea", borderColor: "#f5c6c2" }}>
        <X className="h-3 w-3" /> Rejected
      </span>
    );
  return (
    <span className="chip">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}
