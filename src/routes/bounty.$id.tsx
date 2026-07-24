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
import { useSession } from "@/lib/session";
import { getMe } from "@/lib/me.functions";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bounty/$id")({
  head: () => ({
    meta: [
      { title: "Contract · THE BOARD" },
      { name: "description", content: "Take the contract. Deliver proof. Be paid in silver." },
    ],
  }),
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
  const [clipUrl, setClipUrl] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (me?.profile?.tiktok_handle) setHandle(me.profile.tiktok_handle);
  }, [me?.profile?.tiktok_handle]);

  const take = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setBusy(true);
    try {
      await claimFn({ data: { bounty_id: id, tiktok_handle: handle } });
      toast.success("Contract taken. Deliver proof before the deadline.");
      refetchClaims(); refetchBounties();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not take the contract.");
    } finally { setBusy(false); }
  };

  const deliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myClaim) return;
    setBusy(true);
    try {
      const r = await deliverFn({ data: { submission_id: myClaim.id, clip_url: clipUrl } });
      toast.success(r.auto_check_passed
        ? "Proof delivered. Auto-verified — awaiting the harbormaster."
        : "Proof delivered. Awaiting the harbormaster.");
      setClipUrl("");
      refetchClaims();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery refused.");
    } finally { setBusy(false); }
  };

  if (!bounty) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-board py-20 text-center">
          <p className="script-note text-3xl text-silver-glow">no such contract on the board.</p>
          <Link to="/" className="silver-btn mt-6 inline-flex">back to the board</Link>
        </div>
      </div>
    );
  }

  const reward =
    bounty.payout_type === "per_1k_views"
      ? `${money(bounty.reward_cash_cents, bounty.currency) ?? "silver"} per 1,000 views`
      : bounty.reward_cash_cents > 0
        ? `${money(bounty.reward_cash_cents, bounty.currency)} per approved clip`
        : `${bounty.reward_points} pts per approved clip`;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board py-8">
        <Link to="/" className="label-cap inline-flex items-center gap-2 text-bone-soft hover:text-bone">
          <ArrowLeft className="h-3.5 w-3.5" /> back to the board
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[1.35fr_1fr]">
          <article className="contract contract-nail relative">
            <span className="water-stain" style={{ top: 60, left: -20, width: 160, height: 120 }} />
            <div className="rule-double" />
            <div className="mt-2 flex items-center justify-between">
              <span className="label-cap">C O N T R A C T</span>
              <span className="label-cap">No. {pad(bounty.contract_no)}</span>
            </div>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink">{bounty.title}</h1>
            {bounty.artist_song ? (
              <p className="mt-1 italic text-ink-soft">for &ldquo;{bounty.artist_song}&rdquo;</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm italic text-ink-soft">
              <span>sound · {bounty.sound_name}</span>
              <span>platform · {bounty.platform_target}</span>
              {bounty.deadline ? (
                <span>deadline · {new Date(bounty.deadline).toLocaleString()}</span>
              ) : null}
              {bounty.max_submissions ? <span>cap · {bounty.max_submissions} clips</span> : null}
            </div>

            <div className="mt-6 border-t border-ink/25 pt-4">
              <div className="label-cap silver">B R I E F</div>
              <p className="mt-2 whitespace-pre-wrap italic leading-relaxed">{bounty.description}</p>
            </div>

            <div className="mt-6 grid gap-4 border-t border-ink/25 pt-4 sm:grid-cols-2">
              <div>
                <div className="label-cap silver">R E W A R D</div>
                <p className="mt-1 font-display text-lg silver">{reward}</p>
              </div>
              <div>
                <div className="label-cap silver">A S S E T S</div>
                {bounty.source_assets_url ? (
                  <a
                    href={bounty.source_assets_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 italic underline"
                  >
                    view source pack <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="mt-1 italic text-ink-soft">provided on take</p>
                )}
                {bounty.tiktok_sound_url ? (
                  <div className="mt-1">
                    <a
                      href={bounty.tiktok_sound_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 italic underline"
                    >
                      sound page <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rule-dbl-b mt-8" />
            <p className="script-note mt-3 text-center">
              signed by the harbormaster · posted on the board.
            </p>
          </article>

          <aside className="rounded border border-border/60 p-6">
            <h2 className="font-display text-2xl text-bone">The take</h2>
            {!user ? (
              <>
                <p className="mt-3 italic text-bone-soft">
                  Sign the ledger to take this contract.
                </p>
                <Link to="/auth" className="silver-btn mt-5 w-full">sign the ledger</Link>
              </>
            ) : !myClaim ? (
              <form onSubmit={take} className="mt-4 space-y-4">
                <label className="block">
                  <span className="label-cap text-bone-soft">your handle</span>
                  <div className="mt-2 flex items-center border border-border/60 px-3 py-2">
                    <span className="text-bone-soft">@</span>
                    <input
                      required
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      maxLength={60}
                      className="w-full bg-transparent px-1 text-bone outline-none placeholder:italic placeholder:text-bone-soft/60"
                      placeholder="yourname"
                    />
                  </div>
                </label>
                <button disabled={busy} className="silver-btn w-full">
                  {busy ? "taking…" : "take the contract"}
                </button>
                <p className="script-note text-center text-lg text-silver-glow">
                  the board keeps a record.
                </p>
              </form>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="border border-border/60 p-3 text-sm">
                  <div className="label-cap text-silver">status</div>
                  <div className="mt-1 font-display text-lg text-bone">{prettyStatus(myClaim.status)}</div>
                  {myClaim.review_notes ? (
                    <p className="mt-1 italic text-bone-soft">&ldquo;{myClaim.review_notes}&rdquo;</p>
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
                      />
                    </label>
                    <button disabled={busy} className="silver-btn w-full">
                      {busy ? "delivering…" : "deliver proof"}
                    </button>
                  </form>
                ) : (["submitted", "pending", "in_review"] as string[]).includes(myClaim.status as string) ? (
                  <p className="italic text-bone-soft">
                    Proof delivered. The harbormaster will honor or dispute the contract shortly.
                  </p>
                ) : myClaim.status === "approved" ? (
                  <p className="italic text-bone-soft">
                    Approved. Awaiting payment in silver.
                  </p>
                ) : myClaim.status === "paid" ? (
                  <p className="italic text-silver-glow">
                    Paid in silver. Well cut.
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
    case "approved": return "honored — awaiting silver";
    case "rejected": return "disputed — you may re-deliver";
    case "paid": return "paid in silver";
    default: return s;
  }
}
