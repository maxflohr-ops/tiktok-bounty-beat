import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listAllBountiesStaff,
  upsertBounty,
  deleteBounty,
} from "@/lib/bounties.functions";
import {
  listAllSubmissionsStaff,
  reviewSubmission,
  markPaid,
} from "@/lib/submissions.functions";
import { getMe } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Check, X, Pencil, Coins } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Harbormaster · THE BOARD" },
      { name: "description", content: "Post contracts, honor or dispute deliveries, pay in silver." },
    ],
  }),
  component: Admin,
});

function pad(n: number) { return n.toString().padStart(3, "0"); }
function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
}

function Admin() {
  const meFn = useServerFn(getMe);
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  if (isLoading)
    return <Frame><p className="script-note text-2xl text-silver-glow">consulting the ledger…</p></Frame>;
  if (!me?.isStaff)
    return (
      <Frame>
        <div className="text-center">
          <h1 className="font-display text-3xl text-bone">Only the harbormaster may post.</h1>
          <p className="script-note mt-2 text-xl text-silver-glow">
            request a seal from an admin.
          </p>
          <Link to="/" className="silver-btn mt-6 inline-flex">back to the board</Link>
        </div>
      </Frame>
    );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board py-8">
        <h1 className="font-display text-4xl text-bone">Harbormaster's desk</h1>
        <p className="script-note text-xl text-silver-glow">post the contracts. honor the true. pay in silver.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <BountiesPanel />
          <SubmissionsPanel />
        </div>
        <Ledger />
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board flex min-h-[60vh] items-center justify-center py-20">{children}</div>
    </div>
  );
}

type Bounty = Awaited<ReturnType<typeof listAllBountiesStaff>>[number];

const blankBounty: Partial<Bounty> = {
  title: "",
  description: "",
  sound_name: "",
  artist_song: "",
  tiktok_sound_url: "",
  source_assets_url: "",
  cover_url: "",
  reward_points: 100,
  reward_cash_cents: 0,
  currency: "USD",
  payout_type: "flat",
  platform_target: "tiktok",
  max_submissions: 5,
  status: "active",
};

function BountiesPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllBountiesStaff);
  const upsertFn = useServerFn(upsertBounty);
  const delFn = useServerFn(deleteBounty);
  const { data = [], refetch } = useQuery({ queryKey: ["bountiesStaff"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Partial<Bounty> | null>(null);

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
          artist_song: editing.artist_song ?? "",
          tiktok_sound_url: editing.tiktok_sound_url ?? "",
          source_assets_url: editing.source_assets_url ?? "",
          cover_url: editing.cover_url ?? "",
          reward_points: Number(editing.reward_points ?? 0),
          reward_cash_cents: Number(editing.reward_cash_cents ?? 0),
          currency: editing.currency || "USD",
          payout_type: (editing.payout_type ?? "flat") as "flat" | "per_1k_views",
          platform_target: (editing.platform_target ?? "tiktok") as "tiktok" | "reels" | "shorts",
          max_submissions: editing.max_submissions ?? null,
          deadline: editing.deadline || null,
          status: (editing.status ?? "active") as "draft" | "active" | "claimed" | "in_review" | "fulfilled" | "expired" | "closed",
        },
      });
      toast.success("Posted to the board.");
      setEditing(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["bounties", "public"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The board refused this notice.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Tear down this contract and all its claims?")) return;
    await delFn({ data: { id } });
    refetch();
    qc.invalidateQueries({ queryKey: ["bounties", "public"] });
  };

  return (
    <section className="border border-border/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-bone">Contracts</h2>
        <button onClick={() => setEditing(blankBounty)} className="silver-btn">
          <Plus className="h-3.5 w-3.5" /> new notice
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border/40">
        {data.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="label-cap silver">No. {pad(b.contract_no)}</div>
              <div className="truncate text-bone">{b.title}</div>
              <div className="text-xs italic text-bone-soft">
                {b.sound_name} · {b.status}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="rounded p-2 text-bone-soft hover:text-bone" onClick={() => setEditing(b)} title="edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded p-2 text-bone-soft hover:text-bone" onClick={() => remove(b.id)} title="delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {data.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-silver-glow">the wall is bare.</li>
        ) : null}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-6 space-y-4 border-t border-border/40 pt-5">
          <h3 className="font-display text-xl text-bone">{editing.id ? "Amend contract" : "Post a new contract"}</h3>
          <Field label="title">
            <input required maxLength={120} value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="dark-input" />
          </Field>
          <Field label="brief (what the clip should do)">
            <textarea required rows={4} maxLength={2000} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="dark-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="artist / song"><input maxLength={200} value={editing.artist_song ?? ""} onChange={(e) => setEditing({ ...editing, artist_song: e.target.value })} className="dark-input" /></Field>
            <Field label="sound name"><input required maxLength={160} value={editing.sound_name ?? ""} onChange={(e) => setEditing({ ...editing, sound_name: e.target.value })} className="dark-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="sound URL"><input type="url" value={editing.tiktok_sound_url ?? ""} onChange={(e) => setEditing({ ...editing, tiktok_sound_url: e.target.value })} className="dark-input" /></Field>
            <Field label="source assets URL"><input type="url" value={editing.source_assets_url ?? ""} onChange={(e) => setEditing({ ...editing, source_assets_url: e.target.value })} className="dark-input" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="platform">
              <select value={editing.platform_target ?? "tiktok"} onChange={(e) => setEditing({ ...editing, platform_target: e.target.value as Bounty["platform_target"] })} className="dark-input">
                <option value="tiktok">tiktok</option>
                <option value="reels">reels</option>
                <option value="shorts">shorts</option>
              </select>
            </Field>
            <Field label="payout">
              <select value={editing.payout_type ?? "flat"} onChange={(e) => setEditing({ ...editing, payout_type: e.target.value as Bounty["payout_type"] })} className="dark-input">
                <option value="flat">flat / clip</option>
                <option value="per_1k_views">per 1k views</option>
              </select>
            </Field>
            <Field label="cap (max clips)">
              <input type="number" min={1} value={editing.max_submissions ?? 5} onChange={(e) => setEditing({ ...editing, max_submissions: Number(e.target.value) })} className="dark-input" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="cash (cents)"><input type="number" min={0} value={editing.reward_cash_cents ?? 0} onChange={(e) => setEditing({ ...editing, reward_cash_cents: Number(e.target.value) })} className="dark-input" /></Field>
            <Field label="points"><input type="number" min={0} value={editing.reward_points ?? 0} onChange={(e) => setEditing({ ...editing, reward_points: Number(e.target.value) })} className="dark-input" /></Field>
            <Field label="currency"><input maxLength={3} value={editing.currency ?? "USD"} onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })} className="dark-input" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="deadline">
              <input type="datetime-local" value={editing.deadline ? editing.deadline.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })} className="dark-input" />
            </Field>
            <Field label="status">
              <select value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value as Bounty["status"] })} className="dark-input">
                <option value="active">active (open)</option>
                <option value="draft">draft</option>
                <option value="in_review">in review</option>
                <option value="fulfilled">fulfilled</option>
                <option value="expired">expired</option>
                <option value="closed">closed</option>
              </select>
            </Field>
          </div>
          <p className="script-note text-silver-glow">payment tracked here manually · PayPal/Stripe later.</p>
          <div className="flex gap-2 pt-2">
            <button className="silver-btn">post</button>
            <button type="button" onClick={() => setEditing(null)} className="ink-btn border-border/60 text-bone-soft hover:bg-bone/10">
              cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-cap text-bone-soft">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

type Sub = Awaited<ReturnType<typeof listAllSubmissionsStaff>>[number];

function SubmissionsPanel() {
  const listFn = useServerFn(listAllSubmissionsStaff);
  const reviewFn = useServerFn(reviewSubmission);
  const { data = [], refetch } = useQuery({ queryKey: ["allSubs"], queryFn: () => listFn() });

  const pending = data.filter((s) => { const st = s.status as string; return st === "submitted" || st === "pending" || st === "in_review"; });

  const decide = async (id: string, decision: "approved" | "rejected", points: number, cash: number, notes: string) => {
    try {
      await reviewFn({ data: { id, decision, awarded_points: points, awarded_cash_cents: cash, review_notes: notes } });
      toast.success(decision === "approved" ? "Contract honored." : "Contract disputed.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The board refused this ruling.");
    }
  };

  return (
    <section className="border border-border/60 p-5">
      <h2 className="font-display text-2xl text-bone">Awaiting the harbormaster</h2>
      <p className="script-note text-lg text-silver-glow">latest first. auto-check ✓ = URL and handle agree.</p>
      <ul className="mt-4 space-y-4">
        {pending.map((s) => (
          <ReviewCard key={s.id} s={s} onDecide={decide} />
        ))}
        {pending.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-silver-glow">the desk is clear.</li>
        ) : null}
      </ul>
    </section>
  );
}

function ReviewCard({
  s,
  onDecide,
}: {
  s: Sub;
  onDecide: (id: string, decision: "approved" | "rejected", points: number, cash: number, notes: string) => void;
}) {
  const [points, setPoints] = useState(s.bounty?.reward_points ?? 0);
  const [cash, setCash] = useState(s.bounty?.reward_cash_cents ?? 0);
  const [notes, setNotes] = useState("");
  return (
    <li className="border border-border/60 p-4">
      <div className="flex gap-4">
        {s.oembed_thumbnail ? (
          <img src={s.oembed_thumbnail} alt="" className="h-24 w-20 object-cover" />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center border border-border/40 text-xs italic text-bone-soft">no thumb</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="label-cap silver">No. {s.bounty?.contract_no != null ? pad(s.bounty.contract_no) : "—"}</div>
          <div className="truncate text-bone">{s.bounty?.title}</div>
          <div className="text-xs italic text-bone-soft">
            by {s.editor?.display_name || "editor"} · @{s.tiktok_handle}
          </div>
          {s.tiktok_video_url ? (
            <a href={s.tiktok_video_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs italic underline text-bone-soft">
              open clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <div className="mt-2">
            <span className={`label-cap ${s.auto_check_passed ? "silver border border-silver/40 px-2 py-1" : "text-bone-soft"}`}>
              {s.auto_check_passed ? "auto-check ✓" : "needs eyes"}
            </span>
            {s.auto_check_notes ? <p className="mt-1 text-xs italic text-bone-soft">{s.auto_check_notes}</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 border-t border-border/40 pt-4 md:grid-cols-[1fr_1fr_2fr_auto]">
        <label className="block">
          <span className="label-cap text-bone-soft">points</span>
          <input type="number" min={0} value={points} onChange={(e) => setPoints(Number(e.target.value))} className="dark-input mt-1" />
        </label>
        <label className="block">
          <span className="label-cap text-bone-soft">cash (cents)</span>
          <input type="number" min={0} value={cash} onChange={(e) => setCash(Number(e.target.value))} className="dark-input mt-1" />
        </label>
        <label className="block">
          <span className="label-cap text-bone-soft">note</span>
          <input value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} className="dark-input mt-1" placeholder="well cut / re-cut with a wider crop / …" />
        </label>
        <div className="flex items-end gap-2">
          <button onClick={() => onDecide(s.id, "approved", points, cash, notes)} className="silver-btn">
            <Check className="h-4 w-4" /> honor
          </button>
          <button onClick={() => onDecide(s.id, "rejected", 0, 0, notes)} className="ink-btn border-border/60 text-bone-soft hover:bg-bone/10">
            <X className="h-4 w-4" /> dispute
          </button>
        </div>
      </div>
    </li>
  );
}

function Ledger() {
  const listFn = useServerFn(listAllSubmissionsStaff);
  const payFn = useServerFn(markPaid);
  const { data = [], refetch } = useQuery({ queryKey: ["allSubs"], queryFn: () => listFn() });

  const rows = data.filter((s) => s.status === "approved" || s.status === "paid");
  const owed = rows.filter((s) => s.status === "approved").reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);
  const paid = rows.filter((s) => s.status === "paid").reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);

  const pay = async (id: string) => {
    try { await payFn({ data: { id } }); toast.success("Silver logged."); refetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Payment log refused."); }
  };

  return (
    <section className="mt-10 border border-border/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="label-cap silver">P A I D &nbsp; I N &nbsp; S I L V E R</h2>
          <p className="script-note text-lg text-silver-glow">a running weight of honored contracts.</p>
        </div>
        <div className="flex gap-6 text-right">
          <div><div className="label-cap text-bone-soft">owed</div><div className="font-display text-xl silver">{money(owed)}</div></div>
          <div><div className="label-cap text-bone-soft">paid</div><div className="font-display text-xl silver">{money(paid)}</div></div>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-border/40">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <span className="label-cap silver mr-2">No. {r.bounty?.contract_no != null ? pad(r.bounty.contract_no) : "—"}</span>
              <span className="text-bone">{r.bounty?.title}</span>
              <span className="ml-2 italic text-bone-soft">to {r.editor?.display_name || "editor"} @{r.tiktok_handle}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display silver">{money(r.awarded_cash_cents || 0, r.bounty?.currency || "USD")}</span>
              {r.status === "paid" ? (
                <span className="label-cap silver border border-silver/40 px-2 py-1">paid</span>
              ) : (
                <button onClick={() => pay(r.id)} className="silver-btn">
                  <Coins className="h-3.5 w-3.5" /> mark paid
                </button>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-silver-glow">no silver weighed yet.</li>
        ) : null}
      </ul>
    </section>
  );
}
