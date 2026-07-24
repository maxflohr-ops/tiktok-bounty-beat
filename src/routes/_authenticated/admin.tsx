import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAllBountiesStaff,
  upsertBounty,
  deleteBounty,
} from "@/lib/bounties.functions";
import {
  listPendingSubmissionsStaff,
  reviewSubmission,
} from "@/lib/submissions.functions";
import { getMe } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Check, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Sound Bounties" },
      { name: "description", content: "Create bounties and review editor submissions." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const meFn = useServerFn(getMe);
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  if (isLoading) return <FullPage>Loading…</FullPage>;
  if (!me?.isStaff)
    return (
      <FullPage>
        <div className="text-center">
          <h1 className="font-display text-3xl">Staff access only</h1>
          <p className="mt-2 text-ink-soft">
            Your account isn't a manager or admin yet. Ask an admin to promote you.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Back home
          </Link>
        </div>
      </FullPage>
    );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-editorial py-10">
        <h1 className="font-display text-3xl">Admin</h1>
        <p className="mt-1 text-ink-soft">Create bounties and review submissions.</p>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <BountiesPanel />
          <SubmissionsPanel />
        </div>
      </div>
    </div>
  );
}

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-editorial flex min-h-[60vh] items-center justify-center py-20">
        {children}
      </div>
    </div>
  );
}

type Bounty = {
  id: string;
  title: string;
  description: string;
  sound_name: string;
  tiktok_sound_url: string | null;
  cover_url: string | null;
  reward_points: number;
  reward_cash_cents: number;
  currency: string;
  max_submissions: number | null;
  deadline: string | null;
  status: "draft" | "active" | "closed";
};

function BountiesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllBountiesStaff);
  const upsertFn = useServerFn(upsertBounty);
  const delFn = useServerFn(deleteBounty);
  const { data = [], refetch } = useQuery({ queryKey: ["bountiesStaff"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Partial<Bounty> | null>(null);

  const blank: Partial<Bounty> = {
    title: "",
    description: "",
    sound_name: "",
    tiktok_sound_url: "",
    cover_url: "",
    reward_points: 100,
    reward_cash_cents: 0,
    currency: "USD",
    status: "active",
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await upsertFn({
        data: {
          id: editing.id,
          title: editing.title || "",
          description: editing.description || "",
          sound_name: editing.sound_name || "",
          tiktok_sound_url: editing.tiktok_sound_url || "",
          cover_url: editing.cover_url || "",
          reward_points: Number(editing.reward_points ?? 0),
          reward_cash_cents: Number(editing.reward_cash_cents ?? 0),
          currency: editing.currency || "USD",
          max_submissions: editing.max_submissions ?? null,
          deadline: editing.deadline || null,
          status: (editing.status as "draft" | "active" | "closed") || "active",
        },
      });
      toast.success("Saved.");
      setEditing(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["bounties", "public"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this bounty and all its submissions?")) return;
    await delFn({ data: { id } });
    refetch();
    qc.invalidateQueries({ queryKey: ["bounties", "public"] });
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Bounties</h2>
        <button
          onClick={() => setEditing(blank)}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {data.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="text-sm font-medium">{b.title}</div>
              <div className="text-xs text-ink-soft">
                {b.sound_name} · {b.reward_points} pts · {b.status}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded p-1.5 hover:bg-surface"
                onClick={() => setEditing(b as Bounty)}
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1.5 text-red-600 hover:bg-surface"
                onClick={() => remove(b.id)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {data.length === 0 ? (
          <li className="py-6 text-center text-sm text-ink-soft">No bounties yet.</li>
        ) : null}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-6 space-y-3 border-t border-border pt-5">
          <h3 className="font-display text-lg">{editing.id ? "Edit bounty" : "New bounty"}</h3>
          <Field label="Title">
            <input
              required
              maxLength={120}
              value={editing.title ?? ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Description (brief for editors)">
            <textarea
              required
              maxLength={2000}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={4}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sound name">
              <input
                required
                maxLength={160}
                value={editing.sound_name ?? ""}
                onChange={(e) => setEditing({ ...editing, sound_name: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="TikTok sound URL (optional)">
              <input
                type="url"
                value={editing.tiktok_sound_url ?? ""}
                onChange={(e) => setEditing({ ...editing, tiktok_sound_url: e.target.value })}
                className={input}
              />
            </Field>
          </div>
          <Field label="Cover image URL (optional)">
            <input
              type="url"
              value={editing.cover_url ?? ""}
              onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
              className={input}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Reward points">
              <input
                type="number"
                min={0}
                value={editing.reward_points ?? 0}
                onChange={(e) => setEditing({ ...editing, reward_points: Number(e.target.value) })}
                className={input}
              />
            </Field>
            <Field label="Cash (cents)">
              <input
                type="number"
                min={0}
                value={editing.reward_cash_cents ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, reward_cash_cents: Number(e.target.value) })
                }
                className={input}
              />
            </Field>
            <Field label="Currency">
              <input
                maxLength={3}
                value={editing.currency ?? "USD"}
                onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })}
                className={input}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline (optional)">
              <input
                type="datetime-local"
                value={editing.deadline ? editing.deadline.slice(0, 16) : ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    deadline: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className={input}
              />
            </Field>
            <Field label="Status">
              <select
                value={editing.status ?? "active"}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as Bounty["status"] })
                }
                className={input}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

const input =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-ink-soft">
      {label}
      {children}
    </label>
  );
}

function SubmissionsPanel() {
  const listFn = useServerFn(listPendingSubmissionsStaff);
  const reviewFn = useServerFn(reviewSubmission);
  const { data = [], refetch } = useQuery({
    queryKey: ["pendingSubs"],
    queryFn: () => listFn(),
  });

  const decide = async (
    id: string,
    decision: "approved" | "rejected",
    points: number,
    cash: number,
    notes: string,
  ) => {
    try {
      await reviewFn({
        data: {
          id,
          decision,
          awarded_points: points,
          awarded_cash_cents: cash,
          review_notes: notes,
        },
      });
      toast.success(`Marked as ${decision}.`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-background p-5">
      <h2 className="font-display text-2xl">Submissions</h2>
      <p className="mt-1 text-xs text-ink-soft">Latest first. Auto-check ✓ = URL and handle match.</p>
      <ul className="mt-4 space-y-4">
        {data.map((s) => (
          <SubmissionCard key={s.id} sub={s} onDecide={decide} />
        ))}
        {data.length === 0 ? (
          <li className="py-8 text-center text-sm text-ink-soft">Nothing to review.</li>
        ) : null}
      </ul>
    </section>
  );
}

function SubmissionCard({
  sub,
  onDecide,
}: {
  sub: {
    id: string;
    tiktok_video_url: string;
    tiktok_handle: string;
    oembed_thumbnail: string | null;
    oembed_title: string | null;
    auto_check_passed: boolean;
    auto_check_notes: string | null;
    status: "pending" | "approved" | "rejected";
    bounty: {
      title: string;
      sound_name: string;
      reward_points: number;
      reward_cash_cents: number;
      currency: string;
    } | null;
    editor: { display_name: string | null; tiktok_handle: string | null } | null;
  };
  onDecide: (
    id: string,
    decision: "approved" | "rejected",
    points: number,
    cash: number,
    notes: string,
  ) => void;
}) {
  const [points, setPoints] = useState(sub.bounty?.reward_points ?? 0);
  const [cash, setCash] = useState(sub.bounty?.reward_cash_cents ?? 0);
  const [notes, setNotes] = useState("");

  const disabled = sub.status !== "pending";

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex gap-4">
        {sub.oembed_thumbnail ? (
          <img src={sub.oembed_thumbnail} alt="" className="h-24 w-20 rounded object-cover" />
        ) : (
          <div className="h-24 w-20 rounded bg-surface" />
        )}
        <div className="flex-1">
          <div className="text-xs text-ink-soft">{sub.bounty?.sound_name}</div>
          <div className="font-medium">{sub.bounty?.title}</div>
          <div className="mt-0.5 text-xs text-ink-soft">
            by {sub.editor?.display_name || "Editor"} · @{sub.tiktok_handle}
          </div>
          <a
            href={sub.tiktok_video_url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs underline"
          >
            Open video <ExternalLink className="h-3 w-3" />
          </a>
          <div className="mt-2">
            <span className={sub.auto_check_passed ? "chip-brand" : "chip"}>
              Auto-check {sub.auto_check_passed ? "✓ passed" : "· needs manual check"}
            </span>
            {sub.auto_check_notes ? (
              <p className="mt-1 text-xs text-ink-soft">{sub.auto_check_notes}</p>
            ) : null}
          </div>
        </div>
      </div>

      {!disabled ? (
        <div className="mt-4 grid gap-2 border-t border-border pt-4 md:grid-cols-[1fr_1fr_2fr_auto]">
          <label className="text-xs text-ink-soft">
            Points
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className={input}
            />
          </label>
          <label className="text-xs text-ink-soft">
            Cash (cents)
            <input
              type="number"
              min={0}
              value={cash}
              onChange={(e) => setCash(Number(e.target.value))}
              className={input}
            />
          </label>
          <label className="text-xs text-ink-soft">
            Note to editor
            <input
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              className={input}
              placeholder="Nice work / please add the sound / etc."
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              onClick={() => onDecide(sub.id, "approved", points, cash, notes)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
            <button
              onClick={() => onDecide(sub.id, "rejected", 0, 0, notes)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">Already {sub.status}.</p>
      )}
    </li>
  );
}
