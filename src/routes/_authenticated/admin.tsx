import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listBountyAccessStaff,
  decideBountyApplication,
  inviteToBounty,
} from "@/lib/access.functions";
import { listAllBountiesStaff, upsertBounty, deleteBounty } from "@/lib/bounties.functions";
import {
  listAllSubmissionsStaff,
  reviewSubmission,
  markPaid,
  verifyViewCount,
  reopenSubmission,
} from "@/lib/submissions.functions";
import { getMe } from "@/lib/me.functions";
import {
  createBountyTopUp,
  requestPayout,
  listPayoutApprovals,
  approveAndSendPayout,
  rejectPayout,
} from "@/lib/stripe.functions";
import { listAllDisputesStaff, resolveDispute } from "@/lib/disputes.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ExternalLink,
  Check,
  X,
  Pencil,
  Coins,
  Wallet,
  Flag,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { BsEmpty, BsLoading } from "@/components/bs";

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { focus?: string; tab?: DeskTab; topup_success?: boolean; topup_cancelled?: boolean } => ({
    focus: typeof search.focus === "string" ? search.focus : undefined,
    tab: TABS.some((t) => t.key === search.tab) ? (search.tab as DeskTab) : undefined,
    // Stripe Checkout returns here after a purse top-up; without these the
    // router drops the params and the round trip ends with no confirmation.
    // The router parses `?topup_success=1` into the NUMBER 1, so accept every
    // truthy spelling rather than just the string.
    topup_success: isTruthyParam(search.topup_success),
    topup_cancelled: isTruthyParam(search.topup_cancelled),
  }),
  head: () => ({
    meta: [
      { title: "Admin · Bounty Sounds" },
      { name: "description", content: "Post contracts, review deliveries, approve payouts." },
    ],
  }),
  component: Admin,
});

function isTruthyParam(v: unknown) {
  return v === 1 || v === "1" || v === true || v === "true";
}
function pad(n: number) {
  return n.toString().padStart(3, "0");
}
function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// The desk is one job at a time: triage deliveries, then move money. Tabs keep
// each queue whole instead of stacking five panels down one scroll.
const TABS = [
  { key: "deliveries", label: "Deliveries" },
  { key: "payouts", label: "Payouts" },
  { key: "contracts", label: "Contracts" },
  { key: "disputes", label: "Disputes" },
] as const;
type DeskTab = (typeof TABS)[number]["key"];

// Deep link from the "approval needed" email: ?focus=<id>&tab=deliveries|payouts
function useFocusRow() {
  const { focus, tab } = Route.useSearch();
  useEffect(() => {
    if (!focus) return;
    const prefix = tab === "payouts" ? "pa-" : tab === "deliveries" ? "sub-" : "";
    const ids = prefix ? [`${prefix}${focus}`] : [`sub-${focus}`, `pa-${focus}`];
    let tries = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const tryFocus = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-amber-400", "transition-shadow");
          setTimeout(
            () => el.classList.remove("ring-2", "ring-amber-400", "transition-shadow"),
            4000,
          );
          if (timer) clearInterval(timer);
          return true;
        }
      }
      // The row may not exist yet while the lists are still loading.
      if (++tries > 40 && timer) clearInterval(timer);
      return false;
    };
    if (!tryFocus()) timer = setInterval(tryFocus, 250);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [focus, tab]);
}

function Admin() {
  useFocusRow();
  const meFn = useServerFn(getMe);
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  if (isLoading)
    return (
      <Frame>
        <BsLoading label="opening the ledger" variant="well" />
      </Frame>
    );
  if (!me?.isStaff)
    return (
      <Frame>
        <div className="text-center">
          <h1 className="font-display text-3xl text-bone">Staff only.</h1>
          <p className="script-note mt-2 text-xl text-bone-soft">Request a seal from an admin.</p>
          <Link to="/board" className="silver-btn mt-6 inline-flex">
            Back to the Bounty Board
          </Link>
        </div>
      </Frame>
    );

  return <AdminDesk />;
}

function AdminDesk() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  // Deliveries is the default queue; the approval email deep-links carry
  // ?tab= so the focused row is already on screen when useFocusRow runs.
  const active: DeskTab = tab ?? "deliveries";
  const setTab = (next: DeskTab) =>
    navigate({ to: "/admin", search: (prev) => ({ ...prev, tab: next }), replace: true });

  const counts = useDeskCounts();

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-bone md:text-4xl">Admin desk</h1>
            <p className="script-note hidden text-xl text-bone-soft md:block">
              Verify the views. Honor the clip. Send the money.
            </p>
            <Link
              to="/analytics"
              className="mt-1 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4 md:mt-2 md:min-h-0"
            >
              Analytics &rarr;
            </Link>
          </div>
          <div className="system-bar hidden md:flex">
            <span className="status-dot" />
            admin console &middot; authorized
          </div>
        </div>

        <TopUpReturnNotice />
        <DeskSummary counts={counts} />

        <nav
          aria-label="Desk sections"
          className="mt-4 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:mt-6 md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((t) => {
            const n = counts[t.key];
            const on = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => setTab(t.key)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  on
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--border)] text-bone-soft hover:border-[var(--ink)] hover:text-bone"
                }`}
              >
                {t.label}
                {n > 0 ? (
                  <span
                    className={`inline-flex min-w-[1.4rem] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      on ? "bg-white/20 text-white" : "bg-[var(--paper-shade)] text-ink"
                    }`}
                  >
                    {n}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-6">
          {active === "deliveries" ? <SubmissionsPanel /> : null}
          {active === "payouts" ? (
            <div className="space-y-8">
              <PayoutApprovalsPanel />
              <Ledger />
            </div>
          ) : null}
          {active === "contracts" ? <BountiesPanel /> : null}
          {active === "disputes" ? <DisputesPanel /> : null}
        </div>
      </div>
    </div>
  );
}

// One place that knows what is waiting, so the tabs and the summary agree.
// Same query keys as the panels, so React Query serves both from one fetch.
function useDeskCounts() {
  const subsFn = useServerFn(listAllSubmissionsStaff);
  const approvalsFn = useServerFn(listPayoutApprovals);
  const disputesFn = useServerFn(listAllDisputesStaff);
  const { data: subs = [] } = useQuery({ queryKey: ["allSubs"], queryFn: () => subsFn() });
  const { data: approvals = [] } = useQuery({
    queryKey: ["payoutApprovals"],
    queryFn: () => approvalsFn(),
    // Money waiting on a second pair of eyes should surface without a reload.
    refetchInterval: 60_000,
  });
  const { data: disputes = [] } = useQuery({
    queryKey: ["disputesStaff"],
    queryFn: () => disputesFn(),
  });

  const deliveries = subs.filter((x) => {
    const st = x.status as string;
    return st === "submitted" || st === "pending" || st === "in_review";
  }).length;
  const payouts = (approvals as any[]).filter((a) => a.status === "pending").length;
  const openDisputes = (disputes as any[]).filter(
    (d) => d.status === "open" || d.status === "under_review",
  ).length;
  const owed = subs
    .filter((x) => x.status === "approved")
    .reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);
  const paid = subs
    .filter((x) => x.status === "paid")
    .reduce((a, r) => a + ((r as any).paid_cash_cents ?? r.awarded_cash_cents ?? 0), 0);

  return { deliveries, payouts, contracts: 0, disputes: openDisputes, owed, paid };
}

function DeskSummary({ counts }: { counts: ReturnType<typeof useDeskCounts> }) {
  // Short labels so nothing wraps to a second line in a narrow column.
  const items = [
    {
      short: "review",
      label: "awaiting review",
      value: String(counts.deliveries),
      tone: counts.deliveries > 0,
    },
    {
      short: "approve",
      label: "payouts to approve",
      value: String(counts.payouts),
      tone: counts.payouts > 0,
    },
    { short: "owed", label: "owed to clippers", value: money(counts.owed), tone: false },
    { short: "paid", label: "paid out", value: money(counts.paid), tone: false },
  ];
  return (
    <dl className="mt-4 grid grid-cols-4 border border-[var(--border)] bg-[var(--paper)] md:mt-6 md:gap-3 md:border-0 md:bg-transparent">
      {items.map((i, idx) => (
        <div
          key={i.label}
          className={`px-2 py-2.5 text-center md:border md:border-[var(--border)] md:bg-[var(--paper)] md:p-4 md:text-left ${
            idx > 0 ? "border-l border-[var(--border)] md:border-l" : ""
          }`}
        >
          <dt className="label-cap text-[10px] leading-tight text-bone-soft md:text-xs">
            <span className="md:hidden">{i.short}</span>
            <span className="hidden md:inline">{i.label}</span>
          </dt>
          <dd
            className={`mt-0.5 font-display text-base leading-tight md:mt-1 md:text-2xl ${
              i.tone ? "text-[var(--color-bs-crimson)]" : "text-ink"
            }`}
          >
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Stripe Checkout sends the admin back here after a purse top-up. Previously
// the params were dropped on the floor: no confirmation, and the purse figures
// on screen stayed stale until a manual reload.
function TopUpReturnNotice() {
  const { topup_success, topup_cancelled } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!topup_success && !topup_cancelled) return;
    if (topup_success) {
      qc.invalidateQueries({ queryKey: ["bountiesStaff"] });
      toast.success("Purse topped up. The new balance is on the contract.");
    }
    // Clear the params so a refresh does not replay the banner.
    const t = setTimeout(
      () =>
        navigate({
          to: "/admin",
          search: (prev) => ({ ...prev, topup_success: undefined, topup_cancelled: undefined }),
          replace: true,
        }),
      6000,
    );
    return () => clearTimeout(t);
  }, [topup_success, topup_cancelled, qc, navigate]);

  if (!topup_success && !topup_cancelled) return null;
  return (
    <div
      role="status"
      className={`mt-6 flex items-start gap-3 border p-4 ${
        topup_success
          ? "border-[var(--color-bs-accent)] bg-[var(--color-bs-accent-soft)]"
          : "border-[var(--border)] bg-[var(--paper-shade)]"
      }`}
    >
      {topup_success ? (
        <Check className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <div>
        <p className="font-display text-lg text-ink">
          {topup_success ? "Top-up received." : "Top-up cancelled."}
        </p>
        <p className="text-sm text-ink-soft">
          {topup_success
            ? "Stripe confirmed the payment and the purse now carries it. Open Contracts to see the new balance."
            : "Nothing was charged. The purse is unchanged."}
        </p>
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board flex min-h-[60vh] items-center justify-center py-20">
        {children}
      </div>
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
          platform_target: (editing.platform_target ?? "tiktok") as "tiktok" | "shorts",
          max_submissions: editing.max_submissions ?? null,
          counting_days: Number((editing as any).counting_days ?? 14),
          max_clips_per_editor: Number((editing as any).max_clips_per_editor ?? 15),
          deadline: editing.deadline || null,
          featured_until: (editing as any).featured_until || null,
          featured_plus: Boolean((editing as any).featured_plus),
          hashtags: (editing as any).hashtags ?? [],
          rules: (editing as any).rules || null,
          visibility: ((editing as any).visibility ?? "public") as "public" | "private",
          access_mode: (((editing as any).visibility ?? "public") === "private"
            ? ((editing as any).access_mode ?? "invite")
            : null) as "invite" | "apply" | null,
          status: (editing.status ?? "active") as
            "draft" | "active" | "claimed" | "in_review" | "fulfilled" | "expired" | "closed",
        },
      });
      toast.success("Posted to the Bounty Board.");
      setEditing(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["bounties", "public"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The Bounty Board refused this notice.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Tear down this contract and all its claims?")) return;
    await delFn({ data: { id } });
    refetch();
    qc.invalidateQueries({ queryKey: ["bounties", "public"] });
  };

  return (
    <section className="board-frame relative p-3 md:p-5">
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
                  {(b as any).visibility === "private"
                    ? `private · ${(b as any).access_mode === "apply" ? "apply" : "invite only"} · `
                    : ""}
                  {b.sound_name} · {b.status} · Purse:{" "}
                  <Money cents={(b as any).funded_cash_cents ?? 0} currency={b.currency} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded p-2 text-bone-soft hover:text-bone"
                  onClick={() => setEditing(b)}
                  title="edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded p-2 text-bone-soft hover:text-bone"
                  onClick={() => remove(b.id)}
                  title="delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <TopUpControl bountyId={b.id} />
            {(b as any).visibility === "private" ? (
              <AccessPanel
                bountyId={b.id}
                mode={((b as any).access_mode ?? "invite") as "invite" | "apply"}
              />
            ) : null}
          </li>
        ))}
        {data.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">The wall is bare.</li>
        ) : null}
      </ul>

      {editing ? (
        <form onSubmit={save} className="mt-6 space-y-4 border-t border-[var(--border)] pt-5">
          <h3 className="font-display text-xl text-bone">
            {editing.id ? "Amend contract" : "Post a new contract"}
          </h3>
          <Field label="title">
            <input
              required
              maxLength={120}
              value={editing.title ?? ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="dark-input"
            />
          </Field>
          <Field label="brief (what the clip should do)">
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="dark-input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="artist / song">
              <input
                maxLength={200}
                value={editing.artist_song ?? ""}
                onChange={(e) => setEditing({ ...editing, artist_song: e.target.value })}
                className="dark-input"
              />
            </Field>
            <Field label="sound name">
              <input
                required
                maxLength={160}
                value={editing.sound_name ?? ""}
                onChange={(e) => setEditing({ ...editing, sound_name: e.target.value })}
                className="dark-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="sound URL">
              <input
                type="url"
                value={editing.tiktok_sound_url ?? ""}
                onChange={(e) => setEditing({ ...editing, tiktok_sound_url: e.target.value })}
                className="dark-input"
              />
            </Field>
            <Field label="source assets URL">
              <input
                type="url"
                value={editing.source_assets_url ?? ""}
                onChange={(e) => setEditing({ ...editing, source_assets_url: e.target.value })}
                className="dark-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="platform">
              <select
                value={editing.platform_target ?? "tiktok"}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    platform_target: e.target.value as Bounty["platform_target"],
                  })
                }
                className="dark-input"
              >
                <option value="tiktok">tiktok</option>
                <option value="shorts">shorts</option>
              </select>
            </Field>
            <Field label="payout">
              <select
                value={editing.payout_type ?? "flat"}
                onChange={(e) =>
                  setEditing({ ...editing, payout_type: e.target.value as Bounty["payout_type"] })
                }
                className="dark-input"
              >
                <option value="flat">flat / clip</option>
                <option value="per_1k_views">per 100k views</option>
              </select>
            </Field>
            <Field label="cap (max clips)">
              <input
                type="number"
                min={1}
                value={editing.max_submissions ?? 5}
                onChange={(e) =>
                  setEditing({ ...editing, max_submissions: Number(e.target.value) })
                }
                className="dark-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="cash (cents)">
              <input
                type="number"
                min={0}
                value={editing.reward_cash_cents ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, reward_cash_cents: Number(e.target.value) })
                }
                className="dark-input"
              />
            </Field>
            <Field label="points">
              <input
                type="number"
                min={0}
                value={editing.reward_points ?? 0}
                onChange={(e) => setEditing({ ...editing, reward_points: Number(e.target.value) })}
                className="dark-input"
              />
            </Field>
            <Field label="currency">
              <input
                maxLength={3}
                value={editing.currency ?? "USD"}
                onChange={(e) => setEditing({ ...editing, currency: e.target.value.toUpperCase() })}
                className="dark-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="deadline">
              <input
                type="datetime-local"
                value={editing.deadline ? editing.deadline.slice(0, 16) : ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    deadline: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="dark-input"
              />
            </Field>
            <Field label="featured until ($1k/mo slot)">
              <input
                type="datetime-local"
                value={
                  (editing as any).featured_until
                    ? (editing as any).featured_until.slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    featured_until: e.target.value ? new Date(e.target.value).toISOString() : null,
                  } as any)
                }
                className="dark-input"
              />
            </Field>
            <Field label="counting window (days per clip)">
              <input
                type="number"
                min={1}
                max={90}
                value={(editing as any).counting_days ?? 14}
                onChange={(e) =>
                  setEditing({ ...editing, counting_days: Number(e.target.value) } as any)
                }
                className="dark-input"
              />
            </Field>
            <Field label="max clips per editor">
              <input
                type="number"
                min={1}
                max={50}
                value={(editing as any).max_clips_per_editor ?? 15}
                onChange={(e) =>
                  setEditing({ ...editing, max_clips_per_editor: Number(e.target.value) } as any)
                }
                className="dark-input"
              />
            </Field>
            <Field label="featured+ ($2.5k/mo · presented-by)">
              <label className="flex items-center gap-2 py-2 text-sm text-bone-soft">
                <input
                  type="checkbox"
                  checked={Boolean((editing as any).featured_plus)}
                  onChange={(e) =>
                    setEditing({ ...editing, featured_plus: e.target.checked } as any)
                  }
                />
                presented-by line on the front page
              </label>
            </Field>
            <Field label="status">
              <select
                value={editing.status ?? "active"}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as Bounty["status"] })
                }
                className="dark-input"
              >
                <option value="active">active (open)</option>
                <option value="draft">draft</option>
                <option value="in_review">in review</option>
                <option value="fulfilled">fulfilled</option>
                <option value="expired">expired</option>
                <option value="closed">closed</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="campaign access">
              <select
                value={(editing as any).visibility ?? "public"}
                onChange={(e) => setEditing({ ...editing, visibility: e.target.value } as any)}
                className="dark-input"
              >
                <option value="public">public — anyone can claim</option>
                <option value="private">private — restricted</option>
              </select>
            </Field>
            {((editing as any).visibility ?? "public") === "private" ? (
              <Field label="access mode">
                <select
                  value={(editing as any).access_mode ?? "invite"}
                  onChange={(e) => setEditing({ ...editing, access_mode: e.target.value } as any)}
                  className="dark-input"
                >
                  <option value="invite">invite only</option>
                  <option value="apply">creators apply</option>
                </select>
              </Field>
            ) : null}
          </div>
          <Field label="campaign hashtags (space or comma separated)">
            <input
              value={((editing as any).hashtags ?? []).map((t: string) => `#${t}`).join(" ")}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  hashtags: e.target.value
                    .split(/[\s,]+/)
                    .map((t) => t.replace(/^#/, "").toLowerCase())
                    .filter((t) => /^[a-z0-9_]{2,40}$/.test(t))
                    .slice(0, 10),
                } as any)
              }
              className="dark-input"
              placeholder="#yoursound #yourname"
            />
          </Field>
          <Field label="campaign rules (clippers see these in a dropdown)">
            <textarea
              value={(editing as any).rules ?? ""}
              onChange={(e) => setEditing({ ...editing, rules: e.target.value } as any)}
              className="dark-input min-h-[80px]"
              placeholder="9:16 only. Subtitles on. No logo overlays…"
            />
          </Field>
          <p className="script-note text-bone-soft">
            Payment tracked here manually · PayPal/Stripe later.
          </p>
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
      <span className="label-cap text-bone-soft">top up purse ($)</span>
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

// Every delivered clip an admin might need to open, whatever became of it.
// Rejected work used to vanish from the desk the moment it was disputed,
// which is precisely when a clipper appeals and someone has to look again.
const DELIVERY_FILTERS = [
  { key: "all", label: "All" },
  { key: "queue", label: "Awaiting review" },
  { key: "failed", label: "Failed auto-check" },
  { key: "rejected", label: "Rejected" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
] as const;
type DeliveryFilter = (typeof DELIVERY_FILTERS)[number]["key"];

const AWAITING = new Set(["submitted", "pending", "in_review"]);

function statusTone(status: string) {
  if (status === "paid" || status === "approved") return "border-[var(--gold)]/40 silver";
  if (status === "rejected")
    return "border-[var(--color-bs-crimson)] text-[var(--color-bs-crimson)]";
  return "border-[var(--border)] text-bone-soft";
}

function SubmissionsPanel() {
  const listFn = useServerFn(listAllSubmissionsStaff);
  const reviewFn = useServerFn(reviewSubmission);
  const { data = [], refetch } = useQuery({ queryKey: ["allSubs"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<DeliveryFilter>("queue");

  const pending = data.filter((s) => AWAITING.has(s.status as string));
  // A delivery is anything the editor actually posted a link for. Claims with
  // no URL yet are not clips and would only pad the list.
  const delivered = data.filter((s) => Boolean(s.tiktok_video_url));

  const shown = (() => {
    switch (filter) {
      case "queue":
        return pending;
      case "failed":
        return delivered.filter((s) => !s.auto_check_passed);
      case "rejected":
        return delivered.filter((s) => s.status === "rejected");
      case "approved":
        return delivered.filter((s) => s.status === "approved");
      case "paid":
        return delivered.filter((s) => s.status === "paid");
      default:
        return delivered;
    }
  })();

  const countFor = (k: DeliveryFilter) => {
    switch (k) {
      case "queue":
        return pending.length;
      case "failed":
        return delivered.filter((s) => !s.auto_check_passed).length;
      case "rejected":
        return delivered.filter((s) => s.status === "rejected").length;
      case "approved":
        return delivered.filter((s) => s.status === "approved").length;
      case "paid":
        return delivered.filter((s) => s.status === "paid").length;
      default:
        return delivered.length;
    }
  };

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
      toast.success(decision === "approved" ? "Contract honored." : "Contract disputed.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The Bounty Board refused this ruling.");
    }
  };

  return (
    <section className="board-frame relative p-3 md:p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <h2 className="font-display text-xl text-bone md:text-2xl">Deliveries</h2>
      <p className="script-note hidden text-lg text-bone-soft md:block">
        Every clip stays openable — including the ones that failed the check or were turned down.
      </p>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {DELIVERY_FILTERS.map((f) => {
          const n = countFor(f.key);
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                on
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--border)] text-bone-soft hover:border-[var(--ink)] hover:text-bone"
              }`}
            >
              {f.label}
              <span className={on ? "text-white/70" : "text-bone-soft"}>{n}</span>
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-4">
        {shown.map((s) =>
          AWAITING.has(s.status as string) ? (
            <ReviewCard key={s.id} s={s} onDecide={decide} onVerified={refetch} />
          ) : (
            <DeliveryRow key={s.id} s={s} onReopened={refetch} />
          ),
        )}
        {shown.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">
            {filter === "queue" ? "The desk is clear." : "Nothing here."}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

// Read-only record of a clip that has already been decided. The point is that
// the video is still one click away, with the reason it went the way it did.
function DeliveryRow({ s, onReopened }: { s: Sub; onReopened: () => void }) {
  const reopenFn = useServerFn(reopenSubmission);
  const [reopening, setReopening] = useState(false);
  const status = s.status as string;
  const paid = ((s as any).paid_cash_cents ?? 0) > 0 || Boolean((s as any).stripe_transfer_id);

  const reopen = async () => {
    const reason = prompt("Why is this going back to review?");
    if (!reason?.trim()) return;
    setReopening(true);
    try {
      await reopenFn({ data: { id: s.id, reason: reason.trim() } });
      toast.success("Back in the review queue.");
      onReopened();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reopen this delivery.");
    } finally {
      setReopening(false);
    }
  };
  const verified = (s as any).verified_view_count as number | null | undefined;
  const reported = (s as any).view_count as number | null | undefined;
  const currency = s.bounty?.currency || "USD";
  return (
    <li id={`sub-${s.id}`} className="border border-[var(--border)] p-4">
      <div className="flex gap-4">
        {s.oembed_thumbnail ? (
          <img src={s.oembed_thumbnail} alt="" className="h-24 w-20 object-cover" />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center border border-[var(--border)] text-center text-xs text-bone-soft">
            no thumb
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-cap silver">
              No. {s.bounty?.contract_no != null ? pad(s.bounty.contract_no) : "—"}
            </span>
            <span className={`label-cap border px-2 py-0.5 ${statusTone(status)}`}>{status}</span>
            <span
              className={`label-cap ${s.auto_check_passed ? "text-bone-soft" : "text-[var(--color-bs-crimson)]"}`}
            >
              {s.auto_check_passed ? "auto-check ✓" : "auto-check ✗"}
            </span>
          </div>
          <div className="mt-1 line-clamp-2 text-bone md:truncate">{s.bounty?.title}</div>
          <div className="text-xs text-bone-soft">
            by {s.editor?.display_name || "editor"} · @{s.tiktok_handle}
          </div>
          <div className="mt-1 text-xs text-bone-soft">
            {verified != null
              ? `${verified.toLocaleString()} verified views`
              : reported != null
                ? `${reported.toLocaleString()} reported, unverified`
                : "no view count"}
            {s.awarded_cash_cents ? ` · awarded ${money(s.awarded_cash_cents, currency)}` : ""}
            {(s as any).paid_cash_cents
              ? ` · paid ${money((s as any).paid_cash_cents, currency)}`
              : ""}
          </div>
          {s.auto_check_notes ? (
            <p className="mt-1 text-xs text-bone-soft">check: {s.auto_check_notes}</p>
          ) : null}
          {s.review_notes ? (
            <p className="mt-1 text-xs text-bone-soft">ruling: {s.review_notes}</p>
          ) : null}
          {s.tiktok_video_url ? (
            <a
              href={s.tiktok_video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs italic underline text-bone-soft hover:text-bone"
            >
              open clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {status === "rejected" && !paid ? (
            <div className="mt-3">
              <button type="button" onClick={reopen} disabled={reopening} className="ink-btn">
                <RefreshCw className="h-3.5 w-3.5" />{" "}
                {reopening ? "reopening…" : "reopen for review"}
              </button>
              <p className="mt-1 text-xs text-bone-soft">
                Puts it back in the queue so it can be ruled on again — for an appeal you agree
                with.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

// Per-view payouts are computed from the STAFF-verified view count, never the
// editor's self-reported number — reviewSubmission refuses to approve one
// until that figure exists. The desk therefore has to capture it here, or the
// whole per-view side of the board is un-payable.
function payoutForViews(views: number, ratePer100k: number) {
  return Math.floor((views * ratePer100k) / 100000);
}

function ReviewCard({
  s,
  onDecide,
  onVerified,
}: {
  s: Sub;
  onDecide: (
    id: string,
    decision: "approved" | "rejected",
    points: number,
    cash: number,
    notes: string,
  ) => void;
  onVerified: () => void;
}) {
  const verifyFn = useServerFn(verifyViewCount);
  const perView = s.bounty?.payout_type === "per_1k_views";
  const rate = s.bounty?.reward_cash_cents ?? 0;
  const currency = s.bounty?.currency || "USD";
  const verified = (s as any).verified_view_count as number | null | undefined;
  const selfReported = (s as any).view_count as number | null | undefined;

  const [points, setPoints] = useState(s.bounty?.reward_points ?? 0);
  // Money is entered in dollars. The old cents-only field made a $187.50
  // payout read as 18750, one slip away from a 100x overpayment.
  const [dollars, setDollars] = useState<string>(() => {
    if (perView) return verified != null ? (payoutForViews(verified, rate) / 100).toFixed(2) : "";
    return ((s.bounty?.reward_cash_cents ?? 0) / 100).toFixed(2);
  });
  const [views, setViews] = useState<string>(
    verified != null ? String(verified) : selfReported != null ? String(selfReported) : "",
  );
  const [notes, setNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const cash = Math.round((Number(dollars) || 0) * 100);
  const pendingViews = Number(views) || 0;
  const previewCents = perView ? payoutForViews(pendingViews, rate) : cash;
  const needsVerification = perView && verified == null;

  const verify = async () => {
    if (!Number.isFinite(pendingViews) || pendingViews < 0) {
      toast.error("Enter the verified view count first.");
      return;
    }
    setVerifying(true);
    try {
      await verifyFn({
        data: { submission_id: s.id, verified_view_count: Math.round(pendingViews) },
      });
      setDollars((payoutForViews(Math.round(pendingViews), rate) / 100).toFixed(2));
      toast.success(`Verified ${Math.round(pendingViews).toLocaleString()} views.`);
      onVerified();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record that view count.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <li id={`sub-${s.id}`} className="border border-[var(--border)] p-4">
      <div className="flex gap-4">
        {s.oembed_thumbnail ? (
          <img src={s.oembed_thumbnail} alt="" className="h-24 w-20 object-cover" />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center border border-[var(--border)] text-xs text-bone-soft">
            no thumb
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="label-cap silver">
            No. {s.bounty?.contract_no != null ? pad(s.bounty.contract_no) : "—"}
          </div>
          <div className="line-clamp-2 text-bone md:truncate">{s.bounty?.title}</div>
          {(s as any).counting_ends_at && perView ? (
            <div className="mt-0.5 text-xs text-bone-soft">
              {new Date((s as any).counting_ends_at).getTime() > Date.now()
                ? `counting window open — closes ${new Date((s as any).counting_ends_at).toLocaleDateString()} (verify views after)`
                : `window closed ${new Date((s as any).counting_ends_at).toLocaleDateString()} — ready to verify + approve`}
            </div>
          ) : null}
          <div className="text-xs text-bone-soft">
            by {s.editor?.display_name || "editor"} · @{s.tiktok_handle}
          </div>
          {s.tiktok_video_url ? (
            <a
              href={s.tiktok_video_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs italic underline text-bone-soft"
            >
              open clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <div className="mt-2">
            <span
              className={`label-cap ${s.auto_check_passed ? "silver border border-[var(--gold)]/40 px-2 py-1" : "text-bone-soft"}`}
            >
              {s.auto_check_passed ? "auto-check ✓" : "needs eyes"}
            </span>
            {s.auto_check_notes ? (
              <p className="mt-1 text-xs text-bone-soft">{s.auto_check_notes}</p>
            ) : null}
          </div>
        </div>
      </div>

      {perView ? (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="label-cap text-bone-soft">verified views</span>
              <input
                type="number"
                min={0}
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="dark-input mt-1 max-w-[160px]"
                placeholder="e.g. 250000"
              />
            </label>
            <button type="button" onClick={verify} disabled={verifying} className="silver-btn">
              <Eye className="h-3.5 w-3.5" />{" "}
              {verifying ? "recording…" : verified != null ? "re-verify" : "verify views"}
            </button>
            <div className="text-sm text-bone-soft">
              <div>
                rate {money(rate, currency)} per 100k →{" "}
                <span className="font-display text-ink">{money(previewCents, currency)}</span>
              </div>
              <div className="text-xs">
                {verified != null
                  ? `verified ${verified.toLocaleString()}`
                  : selfReported != null
                    ? `editor reported ${selfReported.toLocaleString()} — not yet verified`
                    : "no view count on file yet"}
              </div>
            </div>
          </div>
          {needsVerification ? (
            <p className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--color-bs-crimson)]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Verify the view count before honoring — a per-view payout cannot be approved without
              it.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4 md:grid-cols-[1fr_1fr_2fr_auto]">
        <label className="block">
          <span className="label-cap text-bone-soft">points</span>
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="dark-input mt-1"
          />
        </label>
        <label className="block">
          <span className="label-cap text-bone-soft">payout ({currency})</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            className="dark-input mt-1"
            placeholder="0.00"
          />
        </label>
        <label className="block">
          <span className="label-cap text-bone-soft">note</span>
          <input
            value={notes}
            maxLength={1000}
            onChange={(e) => setNotes(e.target.value)}
            className="dark-input mt-1"
            placeholder="well cut / re-cut with a wider crop / …"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            onClick={() => onDecide(s.id, "approved", points, cash, notes)}
            disabled={needsVerification}
            title={needsVerification ? "Verify the view count first" : undefined}
            className="silver-btn disabled:opacity-40"
          >
            <Check className="h-4 w-4" /> honor {cash > 0 ? money(cash, currency) : ""}
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
  const owed = rows
    .filter((s) => s.status === "approved")
    .reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);
  const paid = rows
    .filter((s) => s.status === "paid")
    .reduce((a, r) => a + (r.awarded_cash_cents || 0), 0);

  const payManually = async (id: string) => {
    try {
      await payFn({ data: { id } });
      toast.success("Silver logged.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment log refused.");
    }
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
          <p className="script-note text-lg text-bone-soft">
            A running weight of honored contracts.
          </p>
          <p className="mt-1 text-xs text-bone-soft">
            Payouts are sent via Stripe to the clipper's linked account.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div className="label-cap text-bone-soft">owed</div>
            <div className="font-display text-xl silver">{money(owed)}</div>
          </div>
          <div>
            <div className="label-cap text-bone-soft">paid</div>
            <div className="font-display text-xl silver">{money(paid)}</div>
          </div>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <span className="label-cap silver mr-2">
                No. {r.bounty?.contract_no != null ? pad(r.bounty.contract_no) : "—"}
              </span>
              <span className="text-bone">{r.bounty?.title}</span>
              <span className="ml-2 text-bone-soft">
                to {r.editor?.display_name || "editor"} @{r.tiktok_handle}
              </span>
              {r.status === "paid" && (r as any).stripe_transfer_id ? (
                <div className="mt-1 text-xs text-bone-soft">
                  transfer: {(r as any).stripe_transfer_id} · paid{" "}
                  <Money
                    cents={(r as any).paid_cash_cents ?? r.awarded_cash_cents ?? 0}
                    currency={r.bounty?.currency || "USD"}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display silver">
                {money(r.awarded_cash_cents || 0, r.bounty?.currency || "USD")}
              </span>
              {r.status === "paid" ? (
                <span className="label-cap silver border border-[var(--gold)]/40 px-2 py-1">
                  paid
                </span>
              ) : (
                <>
                  <button
                    onClick={() => requestPay(r.id)}
                    disabled={payingId === r.id}
                    className="silver-btn"
                  >
                    <Coins className="h-3.5 w-3.5" />{" "}
                    {payingId === r.id ? "requesting…" : "request payout"}
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
          <li className="script-note py-6 text-center text-xl text-bone-soft">
            No silver weighed yet.
          </li>
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
  const { data = [], refetch } = useQuery({
    queryKey: ["payoutApprovals"],
    queryFn: () => listFn(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = data.filter((a: any) => a.status === "pending");
  const recent = data.filter((a: any) => a.status !== "pending").slice(0, 10);

  // Sending a Stripe transfer is irreversible, so it gets a real confirmation
  // step showing exactly who and how much - not a browser prompt().
  const [ask, setAsk] = useState<{ id: string; kind: "approve" | "reject"; row: any } | null>(null);

  const decide = async (id: string, kind: "approve" | "reject", note: string) => {
    if (kind === "reject" && !note.trim()) {
      toast.error("Rejections need a reason.");
      return;
    }
    setAsk(null);
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
          <p className="script-note text-lg text-bone-soft">
            Every payout requires a second approval.
          </p>
          <p className="mt-1 text-xs text-bone-soft">
            Any staff can request. Only admins can approve; approval sends the Stripe transfer.
          </p>
        </div>
        <div className="text-right">
          <div className="label-cap text-bone-soft">pending</div>
          <div className="font-display text-xl silver">{pending.length}</div>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-[var(--border)]">
        {pending.map((a: any) => (
          <li
            key={a.id}
            id={`pa-${a.id}`}
            className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          >
            <div className="min-w-0">
              <span className="label-cap silver mr-2">
                No.{" "}
                {a.submission?.bounty?.contract_no != null
                  ? pad(a.submission.bounty.contract_no)
                  : "—"}
              </span>
              <span className="text-bone">{a.submission?.bounty?.title}</span>
              <span className="ml-2 text-bone-soft">@{a.submission?.tiktok_handle}</span>
              <div className="mt-1 text-xs text-bone-soft">
                requested by {a.requested_by_name || "staff"} ·{" "}
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display silver">{money(a.amount_cents, a.currency)}</span>
              <button
                onClick={() => setAsk({ id: a.id, kind: "approve", row: a })}
                disabled={busyId === a.id}
                className="silver-btn"
              >
                <Check className="h-3.5 w-3.5" /> {busyId === a.id ? "working…" : "approve & send"}
              </button>
              <button
                onClick={() => setAsk({ id: a.id, kind: "reject", row: a })}
                disabled={busyId === a.id}
                className="ink-btn"
              >
                <X className="h-3.5 w-3.5" /> reject
              </button>
            </div>
          </li>
        ))}
        {pending.length === 0 ? (
          <li className="script-note py-6 text-center text-xl text-bone-soft">
            No payouts await a seal.
          </li>
        ) : null}
      </ul>

      {recent.length > 0 ? (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <div className="label-cap text-bone-soft mb-2">Recent decisions</div>
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((a: any) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs text-bone-soft"
              >
                <div className="min-w-0">
                  <span className="label-cap silver mr-2">
                    No.{" "}
                    {a.submission?.bounty?.contract_no != null
                      ? pad(a.submission.bounty.contract_no)
                      : "—"}
                  </span>
                  <span className="text-bone">{a.submission?.bounty?.title}</span>
                  <span className="ml-2">@{a.submission?.tiktok_handle}</span>
                  {a.decision_note ? <div className="mt-0.5">note: {a.decision_note}</div> : null}
                  {a.error ? <div className="mt-0.5 text-red-400/80">error: {a.error}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display silver">{money(a.amount_cents, a.currency)}</span>
                  <span
                    className={`label-cap border px-2 py-0.5 ${a.status === "sent" ? "silver border-[var(--gold)]/40" : "border-[var(--border)]"}`}
                  >
                    {a.status}
                  </span>
                  <span>{a.decided_by_name || "—"}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ask ? (
        <PayoutDecisionDialog
          kind={ask.kind}
          row={ask.row}
          busy={busyId === ask.id}
          onCancel={() => setAsk(null)}
          onConfirm={(note) => decide(ask.id, ask.kind, note)}
        />
      ) : null}
    </section>
  );
}

// Explicit confirmation for money leaving the account: names the clipper, the
// contract, and the exact amount, and makes a rejection state its reason.
function PayoutDecisionDialog({
  kind,
  row,
  busy,
  onCancel,
  onConfirm,
}: {
  kind: "approve" | "reject";
  row: any;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const approving = kind === "approve";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={approving ? "Approve and send payout" : "Reject payout"}
      className="bs-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bs-dialog w-full max-w-md border border-[var(--border)] bg-[var(--paper)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl text-ink">
          {approving ? "Send this payout?" : "Reject this payout?"}
        </h3>
        <dl className="mt-4 space-y-1 text-sm text-ink-soft">
          <div className="flex justify-between gap-4">
            <dt>Amount</dt>
            <dd className="font-display text-lg text-ink">
              {money(row.amount_cents, row.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Clipper</dt>
            <dd>@{row.submission?.tiktok_handle ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Contract</dt>
            <dd className="truncate text-right">{row.submission?.bounty?.title ?? "—"}</dd>
          </div>
        </dl>
        {approving ? (
          <p className="mt-4 inline-flex items-start gap-2 text-xs text-[var(--color-bs-crimson)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This sends a real Stripe transfer. It cannot be undone from the desk.
          </p>
        ) : null}
        <label className="mt-4 block">
          <span className="label-cap text-bone-soft">
            {approving ? "note (optional)" : "reason (required)"}
          </span>
          <textarea
            autoFocus
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            className="dark-input mt-1 w-full"
            placeholder={
              approving ? "verified against the live clip" : "why this payout is not going out"
            }
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="ink-btn">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            disabled={busy || (!approving && !note.trim())}
            className="silver-btn disabled:opacity-40"
          >
            {busy
              ? "working…"
              : approving
                ? `Send ${money(row.amount_cents, row.currency)}`
                : "Reject payout"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DisputesPanel() {
  const listFn = useServerFn(listAllDisputesStaff);
  const resolveFn = useServerFn(resolveDispute);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["disputesStaff"], queryFn: () => listFn() });

  const [drafts, setDrafts] = useState<Record<string, { note: string; corrected: string }>>({});
  const upd = (id: string, patch: Partial<{ note: string; corrected: string }>) =>
    setDrafts((s) => ({
      ...s,
      [id]: { note: s[id]?.note ?? "", corrected: s[id]?.corrected ?? "", ...patch },
    }));

  const act = async (id: string, decision: "under_review" | "resolved" | "rejected") => {
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
        <div className="mt-4">
          <BsEmpty
            eyebrow="disputes"
            title="No open disputes."
            body="Editor-flagged mismatches will land here."
          />
        </div>
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
                      Dispute · No.{" "}
                      {b?.contract_no != null ? String(b.contract_no).padStart(3, "0") : "—"}
                    </div>
                    <div className="font-display text-lg text-bone">{b?.title ?? "—"}</div>
                    <div className="text-xs text-bone-soft">
                      by {(d as any).creator?.display_name || "—"}
                      {(d as any).creator?.tiktok_handle
                        ? ` · @${(d as any).creator.tiktok_handle}`
                        : ""}
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
                    <div className="mt-1 label-cap silver">{d.status.replace("_", " ")}</div>
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
                    <button onClick={() => act(d.id, "under_review")} className="ink-btn">
                      mark under review
                    </button>
                  ) : null}
                  <button onClick={() => act(d.id, "resolved")} className="silver-btn">
                    <Check className="h-3.5 w-3.5" /> resolve & correct
                  </button>
                  <button onClick={() => act(d.id, "rejected")} className="ink-btn">
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

function AccessPanel({ bountyId, mode }: { bountyId: string; mode: "invite" | "apply" }) {
  const listFn = useServerFn(listBountyAccessStaff);
  const decideFn = useServerFn(decideBountyApplication);
  const inviteFn = useServerFn(inviteToBounty);
  const { data = [], refetch } = useQuery({
    queryKey: ["bountyAccessStaff"],
    queryFn: () => listFn(),
  });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = (data as any[]).filter((r) => r.bounty_id === bountyId);
  const applications = rows.filter((r) => r.status === "applied");
  const decided = rows.filter((r) => r.status !== "applied");

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await decideFn({ data: { id, decision } });
      toast.success(
        decision === "approved" ? "Approved — creator notified." : "Rejected — creator notified.",
      );
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record that decision.");
    }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await inviteFn({ data: { bounty_id: bountyId, email } });
      toast.success("Invite sent.");
      setEmail("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send that invite.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-[var(--border)] p-3">
      <div className="label-cap silver">private access</div>

      {mode === "apply" ? (
        <div className="mt-2">
          <div className="text-xs text-bone-soft">
            {applications.length === 0
              ? "No applications waiting."
              : `${applications.length} awaiting review`}
          </div>
          <ul className="mt-2 space-y-2">
            {applications.map((r) => (
              <li key={r.id} className="border border-[var(--border)] p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-bone">
                    @{r.tiktok_handle ?? "—"}
                    {r.display_name ? ` · ${r.display_name}` : ""}
                  </span>
                  <span className="terminal text-[10px] text-bone-soft">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.message ? <p className="mt-1 italic text-bone-soft">“{r.message}”</p> : null}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => decide(r.id, "approved")}
                    className="silver-btn px-3 py-1 text-xs"
                  >
                    approve
                  </button>
                  <button
                    onClick={() => decide(r.id, "rejected")}
                    className="ink-btn px-3 py-1 text-xs"
                  >
                    reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={invite} className="mt-3 flex gap-2">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="invite a creator by email"
          className="dark-input flex-1"
          disabled={busy}
        />
        <button className="silver-btn px-3 py-1 text-xs" disabled={busy}>
          {busy ? "sending…" : "invite"}
        </button>
      </form>

      {decided.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-bone-soft">
          {decided.map((r) => (
            <li key={r.id}>
              {r.invited_email ?? r.display_name ?? r.tiktok_handle ?? r.user_id} — {r.status}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
