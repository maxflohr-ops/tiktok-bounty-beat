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
      { title: "Your contracts · THE BOARD" },
      { name: "description", content: "Contracts you've taken and silver you've earned." },
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
  const { data: me, refetch: refetchMe } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: claims = [], refetch } = useQuery({ queryKey: ["myClaims"], queryFn: () => claimsFn() });

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
      toast.success("Profile marked in the ledger.");
      refetchMe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ledger refused the change.");
    }
  };

  const ledger = claims.filter((c) => c.status === "approved" || c.status === "paid");
  const silverEarned = ledger.reduce((s, c) => s + (c.awarded_cash_cents || 0), 0);
  const silverPaid = claims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.awarded_cash_cents || 0), 0);
  const pointsEarned = ledger.reduce((s, c) => s + (c.awarded_points || 0), 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board grid gap-8 py-8 md:grid-cols-[1fr_320px]">
        <section>
          <h1 className="font-display text-4xl text-bone">Your contracts</h1>
          <p className="script-note text-xl text-silver-glow">the board remembers.</p>

          <PaymentSetup />

          {claims.length === 0 ? (
            <div className="mt-10 border border-dashed border-border/60 p-10 text-center">
              <p className="script-note text-3xl text-silver-glow">
                you've taken nothing. the board notices.
              </p>
              <Link to="/" className="silver-btn mt-6 inline-flex">visit the board</Link>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {claims.map((c) => (
                <ClaimRow key={c.id} claim={c} onSaveViews={async (v) => {
                  try { await viewsFn({ data: { submission_id: c.id, view_count: v } }); toast.success("Views logged."); refetch(); }
                  catch (err) { toast.error(err instanceof Error ? err.message : "Failed."); }
                }} />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-border/60 p-5">
            <h2 className="font-display text-2xl text-bone">Editor's mark</h2>
            <form onSubmit={save} className="mt-3 space-y-4">
              <label className="block">
                <span className="label-cap text-bone-soft">name</span>
                <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="dark-input mt-2" />
              </label>
              <label className="block">
                <span className="label-cap text-bone-soft">tiktok handle</span>
                <div className="mt-2 flex items-center border border-border/60 px-3 py-2">
                  <span className="text-bone-soft">@</span>
                  <input value={handle} maxLength={60} onChange={(e) => setHandle(e.target.value)} className="w-full bg-transparent px-1 text-bone outline-none" />
                </div>
              </label>
              <button className="silver-btn w-full">mark the ledger</button>
            </form>
          </div>

          <div className="border border-border/60 p-5">
            <h2 className="label-cap silver text-center">Paid in silver</h2>
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
    <div className="mt-6 border border-border/60 p-5">
      <h2 className="font-display text-2xl text-bone">Payment setup</h2>
      {isLoading ? (
        <p className="mt-2 italic text-bone-soft">consulting the harbor bank…</p>
      ) : status === "enabled" ? (
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 silver" />
          <span className="label-cap silver">payouts connected</span>
        </div>
      ) : status === "pending" ? (
        <div className="mt-3 space-y-3">
          <p className="italic text-bone-soft">Stripe onboarding is incomplete.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={link} disabled={busy} className="silver-btn">
              <Link2 className="h-3.5 w-3.5" /> complete stripe setup
            </button>
            <button onClick={refresh} disabled={busy} className="ink-btn border-border/60 text-bone-soft hover:bg-bone/10">
              refresh status
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="italic text-bone-soft">Link a Stripe account so the board can pay you in silver directly.</p>
          <button onClick={link} disabled={busy} className="silver-btn">
            <Link2 className="h-3.5 w-3.5" /> link stripe account for payouts
          </button>
        </div>
      )}
      <p className="mt-3 text-xs italic text-bone-soft">PayPal support coming soon.</p>
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

function ClaimRow({ claim, onSaveViews }: { claim: Claim; onSaveViews: (v: number) => void }) {
  const b = claim.bounty;
  const [views, setViews] = useState(claim.view_count);
  const canLogViews = b?.payout_type === "per_1k_views";
  return (
    <li className="border border-border/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="label-cap silver">
            No. {b?.contract_no != null ? pad(b.contract_no) : "—"}
          </div>
          <div className="font-display text-xl text-bone">{b?.title}</div>
          <div className="mt-0.5 text-sm italic text-bone-soft">
            {b?.artist_song || b?.sound_name}
            {b?.deadline ? ` · by ${new Date(b.deadline).toLocaleDateString()}` : ""}
          </div>
          {claim.tiktok_video_url ? (
            <a href={claim.tiktok_video_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs italic underline text-bone-soft">
              open the clip <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <div className="mt-2 text-xs italic text-bone-soft">no proof delivered yet</div>
          )}
          {claim.review_notes ? (
            <p className="mt-2 italic text-bone-soft">&ldquo;{claim.review_notes}&rdquo;</p>
          ) : null}
        </div>
        <div className="text-right">
          {(claim as any).paid_cash_cents > 0 ? (
            <div className="label-cap silver border border-silver/40 inline-block px-2 py-1">
              Paid: <Money cents={(claim as any).paid_cash_cents} currency={b?.currency ?? "USD"} />
            </div>
          ) : (
            <div className="label-cap silver">{prettyStatus(claim.status)}</div>
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
        <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
          <span className="label-cap text-bone-soft">views</span>
          <input
            type="number"
            min={0}
            value={views}
            onChange={(e) => setViews(Number(e.target.value))}
            className="dark-input max-w-[160px]"
          />
          <button onClick={() => onSaveViews(views)} className="silver-btn">log</button>
        </div>
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
