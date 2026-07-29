import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicBounties } from "@/lib/bounties.functions";
import {
  claimContract,
  deliverProof,
  listMyClaims,
} from "@/lib/submissions.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { useSession } from "@/lib/session";
import { getMe } from "@/lib/me.functions";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bounty/$id")({
  head: ({ params }) => {
    const url = `https://bountysounds.com/bounty/${params.id}`;
    const title = "Clipping contract — Bounty Sounds";
    const desc = "Take this TikTok clipping contract on Bounty Sounds. Post an edit using the artist's sound, deliver proof, and get paid per verified view.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: BountyDetail,
});

function pad(n: number) { return n.toString().padStart(3, "0"); }
function money(cents: number, currency = "USD") {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function BountyDetail() {
  const { id } = Route.useParams();
  const listFn = useServerFn(listPublicBounties);
  const meFn = useServerFn(getMe);
  const myClaimsFn = useServerFn(listMyClaims);
  const claimFn = useServerFn(claimContract);
  const deliverFn = useServerFn(deliverProof);
  const { user } = useSession();
  const navigate = useNavigate();

  const { data: bounties = [], refetch: refetchBounties } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
  });
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });
  const { data: myClaims = [], refetch: refetchClaims } = useQuery({
    queryKey: ["myClaims"],
    queryFn: () => myClaimsFn(),
    enabled: !!user,
  });

  const bounty = bounties.find((b) => b.id === id);
  const myClaim = myClaims.find((c) => c.bounty_id === id);

  const [handle, setHandle] = useState("");
  const [paypal, setPaypal] = useState("");
  const [clipUrl, setClipUrl] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [deliverBusy, setDeliverBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ tiktok_handle?: string; paypal_email?: string }>({});
  const [touched, setTouched] = useState<{ tiktok_handle?: boolean; paypal_email?: boolean }>({});
  useEffect(() => {
    if (me?.profile?.tiktok_handle) setHandle(me.profile.tiktok_handle);
  }, [me?.profile?.tiktok_handle]);

  const take = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    const { validateClaimFields } = await import("@/lib/claim-validation");
    const check = validateClaimFields({ tiktok_handle: handle, paypal_email: paypal });
    setTouched({ tiktok_handle: true, paypal_email: true });
    if (!check.ok) { setFieldErrors(check.errors); return; }
    setFieldErrors({});
    setClaimBusy(true);
    try {
      await claimFn({ data: { bounty_id: id, tiktok_handle: check.data.tiktok_handle, paypal_email: check.data.paypal_email } });
      toast.success("Contract taken. Deliver proof before the deadline.");
      refetchClaims(); refetchBounties();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not take the contract.");
    } finally { setClaimBusy(false); }
  };

  const validateField = async (field: "tiktok_handle" | "paypal_email", value: string) => {
    const mod = await import("@/lib/claim-validation");
    const msg = field === "tiktok_handle" ? mod.validateTiktokHandle(value) : mod.validatePaypalEmail(value);
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };


  const deliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClaim) return;
    setDeliverBusy(true);
    try {
      const r = await deliverFn({ data: { submission_id: myClaim.id, clip_url: clipUrl } });
      toast.success(r.auto_check_passed
        ? "Proof delivered. Auto-verified — awaiting the harbormaster."
        : "Proof delivered. Awaiting the harbormaster.");
      setClipUrl("");
      refetchClaims();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery refused.");
    } finally { setDeliverBusy(false); }
  };

  if (!bounty) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-board py-20 text-center">
          <p className="script-note text-3xl text-bone-soft">No such contract on the board.</p>
          <Link to="/" className="silver-btn mt-6 inline-flex">Back to the board</Link>
        </div>
      </div>
    );
  }

  const reward =
    bounty.payout_type === "per_1k_views"
      ? `${money(bounty.reward_cash_cents, bounty.currency) ?? "—"} per 100,000 views`
      : bounty.reward_cash_cents > 0
        ? `${money(bounty.reward_cash_cents, bounty.currency)} per approved clip`
        : `${bounty.reward_points} pts per approved clip`;

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="label-cap inline-flex items-center gap-2 text-bone-soft hover:text-bone">
            <ArrowLeft className="h-3.5 w-3.5" /> back to the board
          </Link>
          <div className="system-bar">
            <span className="status-dot" />
            contract view · active
          </div>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-[1.35fr_1fr]">
          <article className="contract contract-nail holo-glow relative">
            <span className="water-stain" style={{ top: 60, left: -20, width: 160, height: 120 }} />

            <div className="mb-3 border-b border-[var(--paper-dark)] pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">Contract</span>
                <span className="label-cap text-ink-soft">No. {pad(bounty.contract_no)}</span>
              </div>
            </div>

            <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">{bounty.title}</h1>
            {bounty.artist_song ? (
              <p className="mt-1 font-body italic text-ink-soft">for “{bounty.artist_song}”</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
              <span>sound · {bounty.sound_name}</span>
              <span>platform · {bounty.platform_target}</span>
              {bounty.deadline ? (
                <span>deadline · {new Date(bounty.deadline).toLocaleString()}</span>
              ) : null}
              {bounty.max_submissions ? <span>cap · {bounty.max_submissions} clips</span> : null}
            </div>

            <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
              <div className="label-cap text-ink-soft">Brief</div>
              <p className="mt-2 whitespace-pre-wrap font-body leading-relaxed text-ink-soft">{bounty.description}</p>
            </div>

            <div className="mt-6 grid gap-4 border-t border-[var(--paper-dark)] pt-4 sm:grid-cols-2">
              <div>
                <div className="label-cap text-ink-soft">Reward</div>
                <p className="mt-1 font-display text-lg text-ink">{reward}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {(bounty as any).funded_cash_cents > 0 ? (
                    <>Pot: <Money cents={(bounty as any).funded_cash_cents} currency={bounty.currency} /></>
                  ) : (
                    "pot empty"
                  )}
                </p>
              </div>
              <div>
                <div className="label-cap text-ink-soft">Assets</div>
                {bounty.source_assets_url ? (
                  <a
                    href={bounty.source_assets_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-body italic text-ink underline"
                  >
                    view source pack <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="mt-1 font-body italic text-ink-soft">provided on take</p>
                )}
                {bounty.tiktok_sound_url ? (
                  <div className="mt-1">
                    <a
                      href={bounty.tiktok_sound_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-body italic text-ink underline"
                    >
                      sound page <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="script-note mt-8 text-center text-base text-ink-soft">
              Signed by the harbormaster · posted on the board.
            </p>
          </article>

          <aside className="board-frame relative p-5 md:p-6">
            <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
            <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
            <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
            <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl text-bone">The take</h2>
              <span className="terminal text-[10px] text-bone-soft">ID: #{pad(bounty.contract_no)}</span>
            </div>
            {!user ? (
              <>
                <p className="mt-3 text-bone-soft">
                  Sign the ledger to take this contract.
                </p>
                <Link to="/auth" className="silver-btn mt-5 w-full">sign the ledger</Link>
              </>
            ) : !myClaim ? (
              <form onSubmit={take} noValidate className="mt-4 space-y-4">
                <label className="block">
                  <span className="label-cap text-bone-soft">your tiktok</span>
                  <div
                    className={`mt-2 flex items-center border px-3 py-2 ${
                      touched.tiktok_handle && fieldErrors.tiktok_handle
                        ? "border-red-500"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span className="text-bone-soft">@</span>
                    <input
                      required
                      value={handle}
                      onChange={(e) => {
                        setHandle(e.target.value);
                        if (touched.tiktok_handle) validateField("tiktok_handle", e.target.value);
                      }}
                      onBlur={(e) => {
                        setTouched((t) => ({ ...t, tiktok_handle: true }));
                        validateField("tiktok_handle", e.target.value);
                      }}
                      maxLength={60}
                      aria-invalid={!!(touched.tiktok_handle && fieldErrors.tiktok_handle)}
                      aria-describedby="tiktok-handle-error"
                      className="w-full bg-transparent px-1 text-bone outline-none placeholder:italic placeholder:text-bone-soft/60"
                      placeholder="yourname"
                      disabled={claimBusy}
                    />
                  </div>
                  {touched.tiktok_handle && fieldErrors.tiktok_handle && (
                    <p id="tiktok-handle-error" role="alert" className="mt-1 text-xs text-red-400">
                      {fieldErrors.tiktok_handle}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="label-cap text-bone-soft">your paypal</span>
                  <input
                    required
                    type="email"
                    value={paypal}
                    onChange={(e) => {
                      setPaypal(e.target.value);
                      if (touched.paypal_email) validateField("paypal_email", e.target.value);
                    }}
                    onBlur={(e) => {
                      setTouched((t) => ({ ...t, paypal_email: true }));
                      validateField("paypal_email", e.target.value);
                    }}
                    maxLength={160}
                    aria-invalid={!!(touched.paypal_email && fieldErrors.paypal_email)}
                    aria-describedby="paypal-email-error"
                    className={`dark-input mt-2 ${
                      touched.paypal_email && fieldErrors.paypal_email ? "border-red-500" : ""
                    }`}
                    placeholder="you@paypal.com"
                    disabled={claimBusy}
                  />
                  {touched.paypal_email && fieldErrors.paypal_email && (
                    <p id="paypal-email-error" role="alert" className="mt-1 text-xs text-red-400">
                      {fieldErrors.paypal_email}
                    </p>
                  )}
                </label>
                <button
                  type="submit"
                  disabled={claimBusy}
                  aria-busy={claimBusy}
                  className="silver-btn w-full disabled:opacity-60"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {claimBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {claimBusy ? "taking contract…" : "take the contract"}
                  </span>
                </button>
                <p className="script-note text-center text-lg text-bone-soft">
                  The board keeps a record.
                </p>
              </form>

            ) : (
              <div className="mt-4 space-y-4">
                <div className="border border-[var(--border)] p-3 text-sm">
                  <div className="label-cap text-bone-soft">status</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="status-dot" />
                    <span className="digital-badge">{prettyStatus(myClaim.status)}</span>
                  </div>
                  {myClaim.review_notes ? (
                    <p className="mt-2 italic text-bone-soft">“{myClaim.review_notes}”</p>
                  ) : null}
                </div>

                {(myClaim.status === "claimed" || myClaim.status === "rejected") ? (
                  <form onSubmit={deliver} className="space-y-3">
                    <label className="block">
                      <span className="label-cap text-bone-soft">clip url</span>
                      <input
                        required
                        type="url"
                        value={clipUrl}
                        onChange={(e) => setClipUrl(e.target.value)}
                        placeholder={
                          bounty.platform_target === "tiktok"
                            ? "https://www.tiktok.com/@you/video/…"
                            : "paste your posted clip's URL"
                        }
                        maxLength={500}
                        className="dark-input mt-2"
                        disabled={deliverBusy}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={deliverBusy}
                      aria-busy={deliverBusy}
                      className="silver-btn w-full disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {deliverBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {deliverBusy ? "delivering…" : "deliver proof"}
                      </span>
                    </button>
                  </form>
                ) : (["submitted", "pending", "in_review"] as string[]).includes(myClaim.status as string) ? (
                  <p className="text-bone-soft">
                    Proof delivered. The harbormaster will honor or dispute the contract shortly.
                  </p>
                ) : myClaim.status === "approved" ? (
                  <p className="text-bone-soft">
                    Approved. Awaiting payment in crowns.
                  </p>
                ) : myClaim.status === "paid" ? (
                  <p className="text-silver-glow">
                    Paid in crowns. Well cut.
                  </p>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function prettyStatus(s: string) {
  switch (s) {
    case "claimed": return "active — deliver proof";
    case "submitted":
    case "pending":
    case "in_review": return "in review";
    case "approved": return "honored — awaiting crowns";
    case "rejected": return "disputed — you may re-deliver";
    case "paid": return "paid in crowns";
    default: return s;
  }
}
