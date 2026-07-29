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
import { createBountyTopUp, requestPayout, listPayoutApprovals, approveAndSendPayout, rejectPayout } from "@/lib/stripe.functions";
import { listAllDisputesStaff, resolveDispute } from "@/lib/disputes.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Check, X, Pencil, Coins, Wallet, Flag } from "lucide-react";
import { BsEmpty, BsLoading } from "@/components/bs";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Bounty Sounds" },
      { name: "description", content: "Post contracts, review deliveries, approve payouts." },
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
    return <Frame><BsLoading label="opening the ledger" variant="well" /></Frame>;
  if (!me?.isStaff)
    return (
      <Frame>
        <div className="text-center">
          <h1 className="font-display text-3xl text-bone">Staff only.</h1>
          <p className="script-note mt-2 text-xl text-bone-soft">
            Request a seal from an admin.
          </p>
          <Link to="/board" className="silver-btn mt-6 inline-flex">Back to the board</Link>
        </div>
      </Frame>
    );

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl text-bone">Admin desk</h1>
            <p className="script-note text-xl text-bone-soft">Post contracts. Review deliveries. Approve payouts.</p>
            <Link to="/analytics" className="mt-2 inline-block text-sm underline underline-offset-4">
              Analytics →
            </Link>
          </div>
          <div className="system-bar">
            <span className="status-dot" />
            admin console · authorized
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <BountiesPanel />
          <SubmissionsPanel />
        </div>
        <PayoutApprovalsPanel />
        <DisputesPanel />
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
    <section className="board-frame relative p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-bone">Contracts</h2>
        <button onClick={() => setEditing(blankBounty)} className="silver-btn">
          <Plus className="h-3.5 w-3.5" /> new notice
        </button>
      </div>
      <ul className="mt-4 divide-y divide-[var(--border)]">
        {data.map((b) => (
          <li key={b.id} className="flex flex-col gap-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="label-cap silver">No. {pad(b.contract_no)}</div>
                <div className="truncate text-bone">{b.title}</div>
                <div className="text-xs text-bone-soft">
                  {b.sound_name} · {b.status} · Pot: <Money cents={(b as any).funded_cash_cents ?? 0} currency={b.currency} />
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
            </div>
            <TopUpControl bountyId={b.id} />
          </li>
        ))}
        {data.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">The wall is bare.</li>
        ) : null}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-6 space-y-4 border-t border-[var(--border)] pt-5">
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
                <option value="per_1k_views">per 100k views</option>
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
          <p className="script-note text-bone-soft">Payment tracked here manually · PayPal/Stripe later.</p>
          <div className="flex gap-2 pt-2">
            <button className="silver-btn">post</button>
            <button type="button" onClick={() => setEditing(null)} className="ink-btn">
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

function TopUpControl({ bountyId }: { bountyId: string }) {
  const topUpFn = useServerFn(createBountyTopUp);
  const [amount, setAmount] = useState(100);
  const [busy, setBusy] = useState(false);

  const topUp = async () => {
    setBusy(true);
    try {
      const r = await topUpFn({ data: { bountyId, amountCents: Math.round(amount * 100) } });
      if (r?.url) window.location.href = r.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The bank refused this top-up.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2">
      <span className="label-cap text-bone-soft">top up pot ($)</span>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="dark-input max-w-[100px]"
      />
      <button onClick={topUp} disabled={busy} className="silver-btn">
        <Wallet className="h-3.5 w-3.5" /> top up
      </button>
    </div>
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
    <section className="board-frame relative p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <h2 className="font-display text-2xl text-bone">Awaiting review</h2>
      <p className="script-note text-lg text-bone-soft">Latest first. Auto-check ✓ = URL and handle agree.</p>
      <ul className="mt-4 space-y-4">
        {pending.map((s) => (
          <ReviewCard key={s.id} s={s} onDecide={decide} />
        ))}
        {pending.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">The desk is clear.</li>
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
    <li className="border border-[var(--border)] p-4">
      <div className="flex gap-4">
        {s.oembed_thumbnail ? (
          <img src={s.oembed_thumbnail} alt="" className="h-24 w-20 object-cover" />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center border border-[var(--border)] text-xs text-bone-soft">no thumb</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="label-cap silver">No. {s.bounty?.contract_no != null ? pad(s.bounty.contract_no) : "—"}</div>
          <div className="truncate text-bone">{s.bounty?.title}</div>
          <div className="text-xs text-bone-soft">
            by {s.editor?.display_name || "editor"} · @{s.tiktok_handle}
          </div>
          {s.tiktok_video_url ? (
            <a href={s.tiktok_video_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs italic underline text-bone-soft">
              open clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <div className="mt-2">
            <span className={`label-cap ${s.auto_check_passed ? "silver border border-[var(--gold)]/40 px-2 py-1" : "text-bone-soft"}`}>
              {s.auto_check_passed ? "auto-check ✓" : "needs eyes"}
            </span>
            {s.auto_check_notes ? <p className="mt-1 text-xs text-bone-soft">{s.auto_check_notes}</p> : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_1fr_2fr_auto]">
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
          <button onClick={() => onDecide(s.id, "rejected", 0, 0, notes)} className="ink-btn">
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
  const stripePayFn = useServerFn(requestPayout);
  const qc = useQueryClient();
  const { data = [], refetch } = useQuery({ queryKey: ["allSubs"], queryFn: () => listFn() });
  const [payingId, setPayingId] = useState<string | null>(null);

  const rows = data.filter((s) => s.status === "approved" || s.status === "paid");
  const owed = rows.filter((s) => s.status === "approved").reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);
  const paid = rows.filter((s) => s.status === "paid").reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);

  const payManually = async (id: string) => {
    try { await payFn({ data: { id } }); toast.success("Silver logged."); refetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Payment log refused."); }
  };

  const requestPay = async (id: string) => {
    setPayingId(id);
    try {
      await stripePayFn({ data: { submissionId: id } });
      toast.success("Payout requested — waiting for admin approval.");
      qc.invalidateQueries({ queryKey: ["payoutApprovals"] });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payout request refused.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <section className="board-frame relative mt-10 p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="label-cap silver">Earnings</h2>
          <p className="script-note text-lg text-bone-soft">A running weight of honored contracts.</p>
          <p className="mt-1 text-xs text-bone-soft">Payouts are sent via Stripe to the clipper's linked account.</p>
        </div>
        <div className="flex gap-6 text-right">
          <div><div className="label-cap text-bone-soft">owed</div><div className="font-display text-xl silver">{money(owed)}</div></div>
          <div><div className="label-cap text-bone-soft">paid</div><div className="font-display text-xl silver">{money(paid)}</div></div>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <span className="label-cap silver mr-2">No. {r.bounty?.contract_no != null ? pad(r.bounty.contract_no) : "—"}</span>
              <span className="text-bone">{r.bounty?.title}</span>
              <span className="ml-2 text-bone-soft">to {r.editor?.display_name || "editor"} @{r.tiktok_handle}</span>
              {r.status === "paid" && (r as any).stripe_transfer_id ? (
                <div className="mt-1 text-xs text-bone-soft">
                  transfer: {(r as any).stripe_transfer_id} · paid <Money cents={(r as any).paid_cash_cents ?? r.awarded_cash_cents ?? 0} currency={r.bounty?.currency || "USD"} />
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display silver">{money(r.awarded_cash_cents || 0, r.bounty?.currency || "USD")}</span>
              {r.status === "paid" ? (
                <span className="label-cap silver border border-[var(--gold)]/40 px-2 py-1">paid</span>
              ) : (
                <>
                  <button onClick={() => requestPay(r.id)} disabled={payingId === r.id} className="silver-btn">
                    <Coins className="h-3.5 w-3.5" /> {payingId === r.id ? "requesting…" : "request payout"}
                  </button>
                  <button onClick={() => payManually(r.id)} className="ink-btn">
                    mark paid manually
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">No silver weighed yet.</li>
        ) : null}
      </ul>
    </section>
  );
}

function PayoutApprovalsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPayoutApprovals);
  const approveFn = useServerFn(approveAndSendPayout);
  const rejectFn = useServerFn(rejectPayout);
  const { data = [], refetch } = useQuery({ queryKey: ["payoutApprovals"], queryFn: () => listFn() });
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = data.filter((a: any) => a.status === "pending");
  const recent = data.filter((a: any) => a.status !== "pending").slice(0, 10);

  const decide = async (id: string, kind: "approve" | "reject") => {
    const note = kind === "reject"
      ? (prompt("Reason for rejecting this payout?") ?? "")
      : (prompt("Optional note for approval (leave blank to approve):") ?? "");
    if (kind === "reject" && !note.trim()) { toast.error("Rejections need a reason."); return; }
    if (kind === "approve" && !confirm("Approve and send this payout via Stripe? This moves real money.")) return;
    setBusyId(id);
    try {
      if (kind === "approve") {
        const r = await approveFn({ data: { approvalId: id, note: note || undefined } });
        toast.success(`Sent via Stripe · ${r.transferId}`);
      } else {
        await rejectFn({ data: { approvalId: id, note } });
        toast.success("Payout rejected.");
      }
      refetch();
      qc.invalidateQueries({ queryKey: ["allSubs"] });
      qc.invalidateQueries({ queryKey: ["bountiesStaff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Decision failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="board-frame relative mt-10 p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="label-cap silver">Payout approvals</h2>
          <p className="script-note text-lg text-bone-soft">Every payout requires a second approval.</p>
          <p className="mt-1 text-xs text-bone-soft">Any staff can request. Only admins can approve; approval sends the Stripe transfer.</p>
        </div>
        <div className="text-right">
          <div className="label-cap text-bone-soft">pending</div>
          <div className="font-display text-xl silver">{pending.length}</div>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {pending.map((a: any) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <span className="label-cap silver mr-2">No. {a.submission?.bounty?.contract_no != null ? pad(a.submission.bounty.contract_no) : "—"}</span>
              <span className="text-bone">{a.submission?.bounty?.title}</span>
              <span className="ml-2 text-bone-soft">@{a.submission?.tiktok_handle}</span>
              <div className="mt-1 text-xs text-bone-soft">
                requested by {a.requested_by_name || "staff"} · {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display silver">{money(a.amount_cents, a.currency)}</span>
              <button onClick={() => decide(a.id, "approve")} disabled={busyId === a.id} className="silver-btn">
                <Check className="h-3.5 w-3.5" /> {busyId === a.id ? "working…" : "approve & send"}
              </button>
              <button onClick={() => decide(a.id, "reject")} disabled={busyId === a.id} className="ink-btn">
                <X className="h-3.5 w-3.5" /> reject
              </button>
            </div>
          </li>
        ))}
        {pending.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">No payouts await a seal.</li>
        ) : null}
      </ul>

      {recent.length > 0 ? (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <div className="label-cap text-bone-soft mb-2">Recent decisions</div>
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs text-bone-soft">
                <div className="min-w-0">
                  <span className="label-cap silver mr-2">No. {a.submission?.bounty?.contract_no != null ? pad(a.submission.bounty.contract_no) : "—"}</span>
                  <span className="text-bone">{a.submission?.bounty?.title}</span>
                  <span className="ml-2">@{a.submission?.tiktok_handle}</span>
                  {a.decision_note ? <div className="mt-0.5">note: {a.decision_note}</div> : null}
                  {a.error ? <div className="mt-0.5 text-red-400/80">error: {a.error}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display silver">{money(a.amount_cents, a.currency)}</span>
                  <span className={`label-cap border px-2 py-0.5 ${a.status === "sent" ? "silver border-[var(--gold)]/40" : "border-[var(--border)]"}`}>{a.status}</span>
                  <span>{a.decided_by_name || "—"}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function DisputesPanel() {
  const listFn = useServerFn(listAllDisputesStaff);
  const resolveFn = useServerFn(resolveDispute);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["disputesStaff"], queryFn: () => listFn() });

  const [drafts, setDrafts] = useState<Record<string, { note: string; corrected: string }>>({});
  const upd = (id: string, patch: Partial<{ note: string; corrected: string }>) =>
    setDrafts((s) => ({ ...s, [id]: { note: s[id]?.note ?? "", corrected: s[id]?.corrected ?? "", ...patch } }));

  const act = async (
    id: string,
    decision: "under_review" | "resolved" | "rejected",
  ) => {
    const d = drafts[id] ?? { note: "", corrected: "" };
    try {
      await resolveFn({
        data: {
          id,
          decision,
          reviewer_note: d.note,
          corrected_view_count:
            decision === "resolved" && d.corrected ? Number(d.corrected) : undefined,
        },
      });
      toast.success(
        decision === "resolved"
          ? "Dispute resolved — views corrected if provided."
          : decision === "rejected"
            ? "Dispute rejected."
            : "Marked under review.",
      );
      qc.invalidateQueries({ queryKey: ["disputesStaff"] });
      qc.invalidateQueries({ queryKey: ["submissionsStaff"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  };

  const open = data.filter((d) => d.status === "open" || d.status === "under_review");
  const closed = data.filter((d) => d.status === "resolved" || d.status === "rejected");

  return (
    <section className="board-frame relative mt-8 p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-bone">
          <Flag className="mr-2 inline h-5 w-5 silver" />
          Payout disputes
        </h2>
        <span className="digital-badge-amber">{open.length} awaiting</span>
      </div>

      {open.length === 0 ? (
        <div className="mt-4"><BsEmpty eyebrow="disputes" title="No open disputes." body="Editor-flagged mismatches will land here." /></div>
      ) : (
        <ul className="mt-4 space-y-4">
          {open.map((d) => {
            const s = (d as any).submission;
            const b = s?.bounty;
            const draft = drafts[d.id] ?? { note: "", corrected: "" };
            return (
              <li key={d.id} className="border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="label-cap silver">
                      Dispute · No. {b?.contract_no != null ? String(b.contract_no).padStart(3, "0") : "—"}
                    </div>
                    <div className="font-display text-lg text-bone">{b?.title ?? "—"}</div>
                    <div className="text-xs text-bone-soft">
                      by {(d as any).creator?.display_name || "—"}
                      {(d as any).creator?.tiktok_handle ? ` · @${(d as any).creator.tiktok_handle}` : ""}
                      {" · filed "}
                      {new Date(d.created_at).toLocaleString()}
                    </div>
                    {s?.tiktok_video_url ? (
                      <a
                        href={s.tiktok_video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs italic underline text-bone-soft"
                      >
                        open the clip <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    <p className="mt-2 italic text-bone-soft">“{d.note}”</p>
                    {d.evidence_url ? (
                      <a
                        href={d.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs italic underline text-bone-soft"
                      >
                        evidence <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-bone-soft">
                    <div>
                      recorded views:{" "}
                      <span className="silver">{(s?.view_count ?? 0).toLocaleString()}</span>
                    </div>
                    {d.claimed_view_count != null ? (
                      <div>
                        claimed:{" "}
                        <span className="silver">{d.claimed_view_count.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="mt-1 label-cap silver">
                      {d.status.replace("_", " ")}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]">
                  <textarea
                    rows={2}
                    value={draft.note}
                    onChange={(e) => upd(d.id, { note: e.target.value })}
                    maxLength={2000}
                    placeholder="reviewer note (shared with the creator)"
                    className="dark-input w-full"
                  />
                  <input
                    type="number"
                    min={0}
                    value={draft.corrected}
                    onChange={(e) => upd(d.id, { corrected: e.target.value })}
                    placeholder="corrected views"
                    className="dark-input"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.status === "open" ? (
                    <button
                      onClick={() => act(d.id, "under_review")}
                      className="ink-btn"
                    >
                      mark under review
                    </button>
                  ) : null}
                  <button onClick={() => act(d.id, "resolved")} className="silver-btn">
                    <Check className="h-3.5 w-3.5" /> resolve & correct
                  </button>
                  <button
                    onClick={() => act(d.id, "rejected")}
                    className="ink-btn"
                  >
                    <X className="h-3.5 w-3.5" /> reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 ? (
        <details className="mt-6">
          <summary className="label-cap cursor-pointer text-bone-soft">
            Closed disputes ({closed.length})
          </summary>
          <ul className="mt-3 space-y-2 text-xs text-bone-soft">
            {closed.map((d) => (
              <li key={d.id} className="border border-[var(--border)] p-2">
                <span className="label-cap silver mr-2">{d.status}</span>
                <span className="italic">{d.note}</span>
                {d.reviewer_note ? (
                  <div className="mt-1 italic">note: “{d.reviewer_note}”</div>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
