import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyClaims, updateViewCount } from "@/lib/submissions.functions";
import { getMe, updateMyProfile } from "@/lib/me.functions";
import { getMyPayoutMethod, connectStripeAccount, refreshConnectStatus } from "@/lib/stripe.functions";
import { fileDispute, listMyDisputes } from "@/lib/disputes.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, CheckCircle2, Link2, Flag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your contracts · Bounty Sounds" },
      { name: "description", content: "Contracts you've taken and what you've earned." },
    ],
  }),
  component: Dashboard,
});

function pad(n: number) { return n.toString().padStart(3, "0"); }
function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);
}

function Dashboard() {
  const meFn = useServerFn(getMe);
  const claimsFn = useServerFn(listMyClaims);
  const updFn = useServerFn(updateMyProfile);
  const viewsFn = useServerFn(updateViewCount);
  const disputesFn = useServerFn(listMyDisputes);
  const fileFn = useServerFn(fileDispute);
  const { data: me, refetch: refetchMe } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: claims = [], refetch } = useQuery({ queryKey: ["myClaims"], queryFn: () => claimsFn() });
  const { data: disputes = [], refetch: refetchDisputes } = useQuery({ queryKey: ["myDisputes"], queryFn: () => disputesFn() });
  const disputesBySub = useMemo(() => {
    const m: Record<string, typeof disputes> = {};
    for (const d of disputes) (m[d.submission_id] ||= []).push(d);
    return m;
  }, [disputes]);

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
      toast.success("Profile saved.");
      refetchMe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save profile.");
    }
  };

  const ledger = claims.filter((c) => c.status === "approved" || c.status === "paid");
  const silverEarned = ledger.reduce((s, c) => s + (c.awarded_cash_cents || 0), 0);
  const silverPaid = claims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.awarded_cash_cents || 0), 0);
  const pointsEarned = ledger.reduce((s, c) => s + (c.awarded_points || 0), 0);

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 grid gap-8 py-8 md:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl text-bone">Your contracts</h1>
              <p className="script-note text-xl text-bone-soft">Your track record lives here.</p>
            </div>
            <div className="system-bar">
              <span className="status-dot" />
              editor link · connected
            </div>
          </div>

          <PaymentSetup />

          {claims.length === 0 ? (
            <div className="mt-10">
              <BsEmpty
                eyebrow="your contracts"
                title="You've taken nothing yet."
                body="Grab a contract from the board to start earning."
                action={<Link to="/board" className="bs-btn bs-btn-accent">Visit the board</Link>}
                variant="well"
              />
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {claims.map((c) => (
                <ClaimRow
                  key={c.id}
                  claim={c}
                  disputes={disputesBySub[c.id] ?? []}
                  onSaveViews={async (v) => {
                    try { await viewsFn({ data: { submission_id: c.id, view_count: v } }); toast.success("Views logged."); refetch(); }
                    catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
                  }}
                  onFileDispute={async (payload) => {
                    try {
                      await fileFn({ data: { submission_id: c.id, ...payload } });
                      toast.success("Dispute filed — our team will review.");
                      refetchDisputes();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed.");
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="board-frame relative p-5">
            <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
            <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
            <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
            <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
            <h2 className="font-display text-2xl text-bone">Editor's mark</h2>
            <form onSubmit={save} className="mt-3 space-y-4">
              <label className="block">
                <span className="label-cap text-bone-soft">name</span>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="dark-input mt-2" />
              </label>
              <label className="block">
                <span className="label-cap text-bone-soft">tiktok handle</span>
                <div className="mt-2 flex items-center border border-[var(--border)] px-3 py-2">
                  <span className="text-bone-soft">@</span>
                  <input value={handle} maxLength={60} onChange={(e) => setHandle(e.target.value)} className="w-full bg-transparent px-1 text-bone outline-none" />
                </div>
              </label>
              <button className="silver-btn w-full">Save profile</button>
            </form>
          </div>

          <div className="board-frame relative p-5">
            <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
            <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
            <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
            <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
            <h2 className="label-cap silver text-center">Earnings</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 text-center">
              <Metric label="approved" value={money(silverEarned)} />
              <Metric label="paid" value={money(silverPaid)} />
              <Metric label="points" value={String(pointsEarned)} />
              <Metric label="contracts" value={String(claims.length)} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaymentSetup() {
  const getFn = useServerFn(getMyPayoutMethod);
  const connectFn = useServerFn(connectStripeAccount);
  const refreshFn = useServerFn(refreshConnectStatus);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["payoutMethod"], queryFn: () => getFn() });
  const [busy, setBusy] = useState(false);

  const status = data?.stripe_connect_status ?? "not_connected";

  const link = async () => {
    setBusy(true);
    try {
      const r = await connectFn();
      if (r?.url) window.location.href = r.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Stripe refused the request.");
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await refreshFn();
      await refetch();
      toast.success("Status refreshed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh status.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 board-frame relative p-5">
      <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
      <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
      <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
      <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
      <h2 className="font-display text-2xl text-bone">Payment setup</h2>
      {isLoading ? (
        <BsLoading label="loading payout account" variant="inline" />
      ) : status === "enabled" ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="status-dot" />
          <span className="digital-badge">Payouts connected</span>
        </div>
      ) : status === "pending" ? (
        <div className="mt-3 space-y-3">
          <p className="text-bone-soft">Stripe onboarding is incomplete.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={link} disabled={busy} className="silver-btn">
              <Link2 className="h-3.5 w-3.5" /> complete stripe setup
            </button>
            <button onClick={refresh} disabled={busy} className="ink-btn">
              refresh status
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-bone-soft">Link a Stripe account so the board can pay you directly.</p>
          <button onClick={link} disabled={busy} className="silver-btn">
            <Link2 className="h-3.5 w-3.5" /> link stripe account for payouts
          </button>
        </div>
      )}
      <CryptoPayout />
      <p className="mt-3 text-xs text-bone-soft">PayPal support coming soon.</p>
    </div>
  );
}

// USDC payout destination — same self-declared trust model as the PayPal
// email on claims. Wallet connect just fills the address without typos.
function CryptoPayout() {
  const meFn = useServerFn(getMe);
  const saveFn = useServerFn(updateMyProfile);
  const { data: me, refetch } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const saved = me?.profile?.wallet_address as string | null | undefined;

  const connect = async () => {
    const eth = (window as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum;
    if (!eth) {
      toast.error("No wallet extension found — paste your address instead.");
      return;
    }
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) setAddr(accounts[0]);
    } catch {
      toast.error("Wallet connection was declined.");
    }
  };

  const save = async (value: string) => {
    setBusy(true);
    try {
      await saveFn({ data: { wallet_address: value } });
      toast.success(value ? "USDC payout address saved." : "USDC payout address removed.");
      setAddr("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save address.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 border-t border-[var(--border)] pt-4">
      <h3 className="font-display text-lg text-bone">Or get paid in USDC</h3>
      {saved ? (
        <div className="mt-2 space-y-2">
          <p className="break-all text-sm text-bone-soft">
            Payouts can be sent to <span className="text-bone">{saved}</span>
          </p>
          <button onClick={() => save("")} disabled={busy} className="ink-btn">
            remove address
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-bone-soft">
            Connect a wallet or paste an EVM address. USDC payouts are sent manually by the board after approval.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={connect} disabled={busy} className="ink-btn">
              connect wallet
            </button>
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value.trim())}
              placeholder="0x…"
              maxLength={42}
              className="dark-input max-w-xs flex-1"
            />
            <button
              onClick={() => save(addr)}
              disabled={busy || !/^0x[0-9a-fA-F]{40}$/.test(addr)}
              className="silver-btn"
            >
              save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-cap text-bone-soft">{label}</div>
      <div className="mt-1 font-display text-xl silver">{value}</div>
    </div>
  );
}

type Claim = Awaited<ReturnType<typeof listMyClaims>>[number];
type Dispute = Awaited<ReturnType<typeof listMyDisputes>>[number];
type DisputePayload = { claimed_view_count?: number; evidence_url?: string; note: string };

function ClaimRow({
  claim,
  disputes,
  onSaveViews,
  onFileDispute,
}: {
  claim: Claim;
  disputes: Dispute[];
  onSaveViews: (v: number) => void;
  onFileDispute: (payload: DisputePayload) => Promise<void> | void;
}) {
  const b = claim.bounty;
  const [views, setViews] = useState(claim.view_count);
  const canLogViews = b?.payout_type === "per_1k_views";
  const [showDispute, setShowDispute] = useState(false);
  const [dNote, setDNote] = useState("");
  const [dViews, setDViews] = useState<string>("");
  const [dEvidence, setDEvidence] = useState("");
  const openDispute = disputes.find((d) => d.status === "open" || d.status === "under_review");
  const canDispute =
    !openDispute &&
    (claim.status === "submitted" ||
      claim.status === "approved" ||
      claim.status === "paid" ||
      claim.status === "rejected" ||
      (claim.status as string) === "in_review" ||
      (claim.status as string) === "pending");

  return (
    <li className="board-frame border border-[var(--border)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="label-cap silver">
            No. {b?.contract_no != null ? pad(b.contract_no) : "—"}
          </div>
          <div className="font-display text-xl text-bone">{b?.title}</div>
          <div className="mt-0.5 text-sm text-bone-soft">
            {b?.artist_song || b?.sound_name}
            {b?.deadline ? ` · by ${new Date(b.deadline).toLocaleDateString()}` : ""}
          </div>
          {claim.tiktok_video_url ? (
            <a href={claim.tiktok_video_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs italic underline text-bone-soft">
              open the clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="mt-2 text-xs text-bone-soft">No proof delivered yet</div>
          )}
          {claim.review_notes ? (
            <p className="mt-2 italic text-bone-soft">“{claim.review_notes}”</p>
          ) : null}
        </div>
        <div className="text-right">
          {(claim as any).paid_cash_cents > 0 ? (
            <div className="digital-badge">
              <span className="status-dot" />
              Paid: <Money cents={(claim as any).paid_cash_cents} currency={b?.currency ?? "USD"} />
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2">
              <span className="status-dot-amber" />
              <span className="digital-badge-amber">{prettyStatus(claim.status)}</span>
            </div>
          )}
          {claim.awarded_cash_cents > 0 ? (
            <div className="mt-1 font-display text-lg silver">{money(claim.awarded_cash_cents, b?.currency ?? "USD")}</div>
          ) : null}
          {claim.awarded_points > 0 ? (
            <div className="text-xs text-bone-soft">+{claim.awarded_points} pts</div>
          ) : null}
        </div>
      </div>
      {canLogViews ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
          <span className="label-cap text-bone-soft">views</span>
          <input
            type="number"
            min={0}
            value={views}
            onChange={(e) => setViews(Number(e.target.value))}
            className="dark-input max-w-[160px]"
          />
          <button onClick={() => onSaveViews(views)} className="silver-btn">log</button>
          {canDispute ? (
            <button
              type="button"
              onClick={() => setShowDispute((s) => !s)}
              className="ink-btn"
            >
              <Flag className="h-3.5 w-3.5" /> flag view count
            </button>
          ) : null}
        </div>
      ) : canDispute ? (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={() => setShowDispute((s) => !s)}
            className="ink-btn"
          >
            <Flag className="h-3.5 w-3.5" /> dispute payout
          </button>
        </div>
      ) : null}

      {disputes.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-[var(--border)] pt-3">
          {disputes.map((d) => (
            <li key={d.id} className="text-xs text-bone-soft">
              <span className="label-cap silver mr-2">{d.status.replace("_", " ")}</span>
              <span className="italic">{d.note}</span>
              {d.reviewer_note ? (
                <div className="mt-1 italic">reviewer: “{d.reviewer_note}”</div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {showDispute ? (
        <form
          className="mt-3 space-y-2 border-t border-[var(--border)] pt-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (dNote.trim().length < 5) {
              toast.error("Add a short note (5+ characters).");
              return;
            }
            await onFileDispute({
              note: dNote.trim(),
              claimed_view_count: dViews ? Number(dViews) : undefined,
              evidence_url: dEvidence.trim() || undefined,
            });
            setShowDispute(false);
            setDNote("");
            setDViews("");
            setDEvidence("");
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="label-cap text-bone-soft">true view count</span>
              <input
                type="number"
                min={0}
                value={dViews}
                onChange={(e) => setDViews(e.target.value)}
                placeholder="e.g. 128400"
                className="dark-input mt-1"
              />
            </label>
            <label className="block">
              <span className="label-cap text-bone-soft">evidence link (screenshot, analytics)</span>
              <input
                type="url"
                value={dEvidence}
                onChange={(e) => setDEvidence(e.target.value)}
                placeholder="https://…"
                className="dark-input mt-1"
              />
            </label>
          </div>
          <label className="block">
            <span className="label-cap text-bone-soft">note</span>
            <textarea
              value={dNote}
              onChange={(e) => setDNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What is wrong with the recorded view count?"
              className="dark-input mt-1 w-full"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="silver-btn">Request manual review</button>
            <button
              type="button"
              onClick={() => setShowDispute(false)}
              className="ink-btn"
            >
              cancel
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

function prettyStatus(s: string) {
  switch (s) {
    case "claimed": return "active";
    case "submitted":
    case "pending":
    case "in_review": return "in review";
    case "approved": return "honored";
    case "rejected": return "disputed";
    case "paid": return "paid";
    default: return s;
  }
}
