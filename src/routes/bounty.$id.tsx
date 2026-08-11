import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicBounties } from "@/lib/bounties.functions";
import {
  getBountyTeaser,
  getMyBountyAccess,
  applyToBounty,
  listMyPrivateBounties,
} from "@/lib/access.functions";
import {
  claimContract,
  deliverProof,
  listMyClaims,
} from "@/lib/submissions.functions";
import { listBountyClips } from "@/lib/bounties.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { PARTNERS, partnerGoHref } from "@/lib/partners";
import { setReturnTo } from "@/lib/return-to";
import { Money } from "@/components/Money";
import { formatPerViewRate } from "@/lib/rate";
import { useSession } from "@/lib/session";
import { getMe } from "@/lib/me.functions";
import { soundLinks } from "@/lib/sound-links";

import { ArrowLeft, ExternalLink, Loader2, Lock } from "lucide-react";
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
// Serial in the style of a note: district letter + 8 digits, star suffix on featured runs.
function serial(n: number, star = false) { return `B ${n.toString().padStart(8, "0")}${star ? " ★" : ""}`; }
function money(cents: number, currency = "USD") {
  if (!cents) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

function BountyDetail() {
  const { id } = Route.useParams();
  const listFn = useServerFn(listPublicBounties);
  const privateListFn = useServerFn(listMyPrivateBounties);
  const teaserFn = useServerFn(getBountyTeaser);
  const myAccessFn = useServerFn(getMyBountyAccess);
  const applyFn = useServerFn(applyToBounty);
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
  const clipsFn = useServerFn(listBountyClips);
  const { data: bountyClips = [] } = useQuery({
    queryKey: ["bountyClips", id],
    queryFn: () => clipsFn({ data: { bounty_id: id } }),
    retry: false,
  });

  const { data: privateBounties = [] } = useQuery({
    queryKey: ["bounties", "mine-private", user?.id],
    queryFn: () => privateListFn(),
    enabled: !!user,
  });
  const { data: teaser } = useQuery({
    queryKey: ["bountyTeaser", id],
    queryFn: () => teaserFn({ data: { bounty_id: id } }),
  });
  const { data: access, refetch: refetchAccess } = useQuery({
    queryKey: ["bountyAccess", id, user?.id],
    queryFn: () => myAccessFn({ data: { bounty_id: id } }),
    enabled: !!user,
  });

  const [pitch, setPitch] = useState("");
  const [applyHandle, setApplyHandle] = useState("");
  const [applyBusy, setApplyBusy] = useState(false);

  const bounty =
    bounties.find((b) => b.id === id) ??
    (privateBounties.find((b) => (b as { id: string }).id === id) as
      | (typeof bounties)[number]
      | undefined);
  const myClaimsHere = myClaims.filter((c) => c.bounty_id === id);
  const wallet = me?.profile?.wallet_address ?? null;

  const [handle, setHandle] = useState("");
  const [paypal, setPaypal] = useState("");
  const [clipUrls, setClipUrls] = useState<Record<string, string>>({});
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [clips, setClips] = useState(1);
  const [deliverBusyId, setDeliverBusyId] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ tiktok_handle?: string; paypal_email?: string }>({});
  const [touched, setTouched] = useState<{ tiktok_handle?: boolean; paypal_email?: boolean }>({});
  useEffect(() => {
    if (me?.profile?.tiktok_handle) setHandle(me.profile.tiktok_handle);
  }, [me?.profile?.tiktok_handle]);
  useEffect(() => {
    const first = myClaimsHere[0];
    if (first?.tiktok_handle) setHandle((h) => h || first.tiktok_handle);
    if (first?.paypal_email) setPaypal((pp) => pp || first.paypal_email!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myClaimsHere.length]);

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReturnTo(`/bounty/${id}`); navigate({ to: "/auth" }); return; }
    setApplyBusy(true);
    try {
      await applyFn({ data: { bounty_id: id, message: pitch, tiktok_handle: applyHandle } });
      toast.success("Application sent. You'll hear back once it's reviewed.");
      refetchAccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your application.");
    } finally { setApplyBusy(false); }
  };

  const take = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReturnTo(`/bounty/${id}`); navigate({ to: "/auth" }); return; }
    if (clips < 1) { toast.error("Pick at least one clip slot."); return; }
    const { validateClaimFields } = await import("@/lib/claim-validation");
    const check = validateClaimFields({ tiktok_handle: handle, paypal_email: paypal, paypalOptional: Boolean(wallet) });
    setTouched({ tiktok_handle: true, paypal_email: true });
    if (!check.ok) { setFieldErrors(check.errors); return; }
    setFieldErrors({});
    setClaimBusy(true);
    try {
      await claimFn({ data: { bounty_id: id, tiktok_handle: check.data.tiktok_handle, paypal_email: check.data.paypal_email || undefined, clips } });
      toast.success(clips === 1 ? "Slot claimed. Deliver proof before the deadline." : `${clips} slots claimed. Deliver each clip before the deadline.`);
      setClips(1);
      refetchClaims(); refetchBounties();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not seize this bounty.");
    } finally { setClaimBusy(false); }
  };

  const validateField = async (field: "tiktok_handle" | "paypal_email", value: string) => {
    const mod = await import("@/lib/claim-validation");
    const msg = field === "tiktok_handle" ? mod.validateTiktokHandle(value) : mod.validatePaypalEmail(value);
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };


  const deliver = async (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    const url = clipUrls[submissionId] ?? "";
    if (!url) return;
    setDeliverBusyId(submissionId);
    try {
      const r = await deliverFn({ data: { submission_id: submissionId, clip_url: url } });
      const ends = (r as { counting_ends_at?: string | null }).counting_ends_at;
      toast.success(
        `Proof delivered${r.auto_check_passed ? " — auto-verified" : ""}. ${
          ends ? `Counting window open until ${new Date(ends).toLocaleDateString()}.` : "Awaiting review."
        }`,
      );
      setClipUrls((m) => ({ ...m, [submissionId]: "" }));
      setReplacing((m) => ({ ...m, [submissionId]: false }));
      refetchClaims();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery refused.");
    } finally { setDeliverBusyId(null); }
  };

  const accessStatus = access?.status ?? null;
  const hasAccess = ["invited", "accepted", "approved"].includes(accessStatus ?? "");

  if (!bounty) {
    // A private campaign the viewer can't (yet) enter — teaser + locked state.
    if (teaser && (teaser as any).visibility === "private") {
      return (
        <LockedCampaign
          teaser={teaser as any}
          accessStatus={accessStatus}
          signedIn={!!user}
          pitch={pitch}
          setPitch={setPitch}
          handle={applyHandle}
          setHandle={setApplyHandle}
          busy={applyBusy}
          onApply={submitApplication}
          onSignIn={() => { setReturnTo(`/bounty/${id}`); navigate({ to: "/auth" }); }}
        />
      );
    }
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container-board py-20 text-center">
          <p className="script-note text-3xl text-bone-soft">No such contract on the Bounty Board.</p>
          <Link to="/board" className="silver-btn mt-6 inline-flex">Back to the Bounty Board</Link>
        </div>
      </div>
    );
  }

  const reward =
    bounty.payout_type === "per_1k_views"
      ? formatPerViewRate(bounty.reward_cash_cents, bounty.currency)
      : bounty.reward_cash_cents > 0
        ? `${money(bounty.reward_cash_cents, bounty.currency)} per approved delivery`
        : `${bounty.reward_points} pts per approved delivery`;

  // Star note: featured contracts carry the ★ suffix, like a replacement bill's serial.
  const isStarNote = Boolean(
    (bounty as any).featured_plus ||
      ((bounty as any).featured_until && new Date((bounty as any).featured_until) > new Date()),
  );

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 py-8">
        <div className="flex items-center justify-between">
          <Link to="/board" className="label-cap inline-flex items-center gap-2 text-bone-soft hover:text-bone">
            <ArrowLeft className="h-3.5 w-3.5" /> back to the Bounty Board
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
                <span className="flex items-center gap-2">
                  <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--ink)] font-display text-[11px] leading-none text-ink opacity-70">B</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">Contract</span>
                </span>
                <span className="terminal text-[10px] tracking-[0.15em] text-[var(--color-bs-accent)]">
                  {serial(bounty.contract_no, isStarNote)}
                </span>
              </div>
              <p className="mt-1 text-[7px] font-bold uppercase leading-tight tracking-[0.14em] text-ink-soft">
                This contract is good for all verified views, public and posted
              </p>
            </div>

            <h1 className="[font-family:var(--font-brand)] text-3xl font-semibold leading-tight text-ink md:text-4xl">{bounty.title}</h1>
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

            {((bounty as any).hashtags ?? []).length > 0 ? (
              <div className="mt-4">
                <div className="label-cap text-ink-soft">Caption tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {((bounty as any).hashtags as string[]).map((t) => (
                    <span key={t} className="border border-[var(--paper-dark)] px-2 py-0.5 font-body text-sm text-ink">
                      #{t}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-soft">Put these in your caption — they count toward verification.</p>
              </div>
            ) : null}

            {(bounty as any).rules ? (
              <details className="mt-4 border border-[var(--paper-dark)]">
                <summary className="cursor-pointer select-none px-3 py-2 font-display text-ink hover:bg-black/5">
                  Campaign rules ▾
                </summary>
                <p className="whitespace-pre-wrap border-t border-[var(--paper-dark)] px-3 py-3 font-body text-sm leading-relaxed text-ink-soft">
                  {(bounty as any).rules}
                </p>
              </details>
            ) : null}

            <div className="mt-6 grid gap-4 border-t border-[var(--paper-dark)] pt-4 sm:grid-cols-2">
              <div>
                <div className="label-cap text-ink-soft">Reward</div>
                <p className="mt-1 [font-family:var(--font-brand)] text-lg font-semibold text-ink">{reward}</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {(bounty as any).purse_cents > 0 ? (
                    <>
                      Purse: <Money cents={(bounty as any).purse_cents} currency={bounty.currency} />
                      {(bounty as any).paid_out_cents > 0 ? (
                        <> · <Money cents={(bounty as any).paid_out_cents} currency={bounty.currency} /> paid out</>
                      ) : null}
                    </>
                  ) : (
                    "purse dry"
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
                {soundLinks(bounty as any).length > 0 ? (
                  <div className="mt-3">
                    <div className="label-cap text-ink-soft">Sound links</div>
                    <ul className="mt-1 space-y-1">
                      {soundLinks(bounty as any).map((l) => (
                        <li key={l.platform}>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-body text-ink underline"
                          >
                            {l.label} <ExternalLink className="h-3 w-3" />
                          </a>
                          {!l.exact ? <span className="ml-1 text-xs text-ink-soft">auto-matched</span> : null}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-ink-soft">
                      Post with this exact sound on whichever platform you're cutting for.
                    </p>
                  </div>
                ) : null}
                <div className="mt-3">
                  <div className="label-cap text-ink-soft">Campaign logo</div>
                  <p className="mt-1 text-xs text-ink-soft">
                    Every delivered clip must carry the campaign logo overlay.
                  </p>
                  {(bounty as any).logo_pack_url ? (
                    <a
                      href={(bounty as any).logo_pack_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-body text-ink underline"
                    >
                      download the logo pack <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <p className="mt-1 font-body text-xs italic text-ink-soft">logo pack link landing here shortly</p>
                  )}
                </div>
              </div>
            </div>


            <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
              <div className="label-cap text-ink-soft">Clipper toolkit</div>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {Object.entries(PARTNERS).filter(([, p]) => p.kit !== false).map(([id, p]) => (
                  <li key={id}>
                    <a
                      href={partnerGoHref(id)}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      className="inline-flex items-center gap-1 text-ink underline"
                    >
                      {p.name.toLowerCase()} <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    — {p.blurb}
                  </li>
                ))}
                {bounty.tiktok_sound_url ? (
                  <li>
                    then swap in{" "}
                    <a href={bounty.tiktok_sound_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink underline">
                      the contract's sound <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    before you post
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
              <div className="label-cap text-ink-soft">Send it to your community</div>
              <p className="mt-1 text-xs text-ink-soft">
                Running this campaign? Drop it in your Discord, subreddit, or group chat — every clipper it recruits cuts for your purse.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const tags = (((bounty as any).hashtags ?? []) as string[]).map((t) => `#${t}`).join(" ");
                    const url = `https://bountysounds.com/bounty/${bounty.id}`;
                    const text = `Clipping bounty: ${bounty.title} — ${reward}. Post a TikTok${tags ? ` with ${tags}` : " with the sound"} and verified views pay out. ${url}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      toast.success("Copied — paste it anywhere your fans hang out.");
                    } catch {
                      toast.error("Couldn't copy. Long-press the page URL instead.");
                    }
                  }}
                  className="ink-btn px-4 py-1.5 text-xs"
                >
                  copy the callout
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Clipping bounty: ${bounty.title} — ${reward}. Verified views pay out.`)}&url=${encodeURIComponent(`https://bountysounds.com/bounty/${bounty.id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ink-btn px-4 py-1.5 text-xs"
                >
                  post on X
                </a>
                <a
                  href={`https://www.reddit.com/submit?url=${encodeURIComponent(`https://bountysounds.com/bounty/${bounty.id}`)}&title=${encodeURIComponent(`Clipping bounty: ${bounty.title} — ${reward}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ink-btn px-4 py-1.5 text-xs"
                >
                  post to reddit
                </a>
              </div>
            </div>

            {/* Every clip riding on this bounty - delivered, counting, captured */}
            <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
              <div className="label-cap text-ink-soft">Clips on this bounty · {bountyClips.length}</div>
              {bountyClips.length === 0 ? (
                <p className="mt-1 text-xs italic text-ink-soft">No clips delivered yet — the purse is untouched.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[var(--paper-dark)]">
                  {bountyClips.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <a
                        href={c.tiktok_video_url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-body text-ink underline"
                      >
                        @{c.tiktok_handle} <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className="flex items-center gap-3 text-xs text-ink-soft">
                        <span className="tabular-nums">
                          {(c.verified_view_count ?? c.view_count ?? 0) > 0
                            ? `${(c.verified_view_count ?? c.view_count ?? 0).toLocaleString()} views${c.verified_view_count != null ? " ✓" : ""}`
                            : "views pending"}
                        </span>
                        <span className="digital-badge">
                          {c.status === "paid"
                            ? "captured"
                            : c.status === "approved"
                              ? "approved"
                              : c.counting_ends_at && new Date(c.counting_ends_at).getTime() > Date.now()
                                ? `counting until ${new Date(c.counting_ends_at).toLocaleDateString()}`
                                : "in review"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="script-note mt-8 text-center text-base text-ink-soft">
              Good to the bearer for verified views, payable from the posted purse.
            </p>

            {/* Series + signature, set like the officer pair on a note */}
            <div className="mt-4 flex items-end justify-between">
              <span className="terminal text-[8px] uppercase tracking-[0.14em] text-ink-soft">
                Series
                <br />
                2026
              </span>
              <span className="text-right">
                <span className="script-note block text-xl leading-none text-ink">Bounty Sounds</span>
                <span className="block text-[8px] italic text-ink-soft">Keeper of the Purse.</span>
              </span>
            </div>

            <span aria-hidden className="terminal absolute bottom-2 left-3 text-[8px] tracking-[0.15em] text-[var(--color-bs-accent)] opacity-80">
              {serial(bounty.contract_no, isStarNote)}
            </span>
            <span aria-hidden className="terminal absolute bottom-2 right-3 text-[8px] text-ink-soft opacity-50">
              FW B 26
            </span>
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
            {(bounty as any).visibility === "private" && hasAccess ? (
              <div className="mb-3 inline-flex items-center gap-2 border border-[var(--color-bs-accent)] px-2 py-1 terminal text-[10px] uppercase tracking-[0.15em] text-[var(--color-bs-accent)]">
                <Lock className="h-3 w-3" /> private campaign — you're in
              </div>
            ) : null}
            {!user ? (
              <>
                <p className="mt-3 text-bone-soft">
                  Sign in to take this contract.
                </p>
                <Link
                  to="/auth"
                  className="silver-btn mt-5 w-full"
                  onClick={() => setReturnTo(`/bounty/${id}`)}
                >
                  sign in
                </Link>
              </>
            ) : (
              <div className="mt-4 space-y-4">
                {myClaimsHere.length > 0 ? (
                  <>
                    <ul className="space-y-3">
                      {myClaimsHere.map((c, idx) => (
                        <li key={c.id} className="border border-[var(--border)] p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="label-cap text-bone-soft">clip {idx + 1}</span>
                            <span className="digital-badge">{prettyStatus(c.status)}</span>
                          </div>
                          {c.review_notes ? (
                            <p className="mt-2 italic text-bone-soft">“{c.review_notes}”</p>
                          ) : null}
                          {c.counting_ends_at && bounty.payout_type === "per_1k_views" ? (
                            <p className="mt-2 text-xs text-bone-soft">
                              {new Date(c.counting_ends_at).getTime() > Date.now()
                                ? `counting window closes ${new Date(c.counting_ends_at).toLocaleDateString()}`
                                : `counting closed ${new Date(c.counting_ends_at).toLocaleDateString()} — payout at review`}
                              {typeof c.view_count === "number" && c.view_count > 0
                                ? ` · ${c.view_count.toLocaleString()} views ≈ $${(Math.floor((c.view_count * bounty.reward_cash_cents) / 100000) / 100).toFixed(2)}`
                                : ""}
                            </p>
                          ) : null}

                          {c.status === "claimed" || c.status === "rejected" || replacing[c.id] ? (
                            <form onSubmit={(e) => deliver(e, c.id)} className="mt-3 space-y-2">
                              <input
                                required
                                type="url"
                                value={clipUrls[c.id] ?? ""}
                                onChange={(e) => setClipUrls((m) => ({ ...m, [c.id]: e.target.value }))}
                                placeholder={
                                  bounty.platform_target === "tiktok"
                                    ? "https://www.tiktok.com/@you/video/…"
                                    : "paste your posted clip's URL"
                                }
                                maxLength={500}
                                className="dark-input"
                                disabled={deliverBusyId === c.id}
                              />
                              <button
                                type="submit"
                                disabled={deliverBusyId === c.id}
                                aria-busy={deliverBusyId === c.id}
                                className="silver-btn w-full disabled:opacity-60"
                              >
                                <span className="inline-flex items-center justify-center gap-2">
                                  {deliverBusyId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                  {deliverBusyId === c.id ? "delivering…" : replacing[c.id] ? "replace the link" : "deliver proof"}
                                </span>
                              </button>
                            </form>
                          ) : (["submitted", "pending", "in_review"] as string[]).includes(c.status as string) ? (
                            <p className="mt-2 text-xs text-bone-soft">
                              In review — payout follows the close of the counting window, usually within days.{" "}
                              <button
                                type="button"
                                onClick={() => setReplacing((m) => ({ ...m, [c.id]: true }))}
                                className="underline hover:text-bone"
                              >
                                wrong link? replace it
                              </button>
                            </p>
                          ) : c.status === "approved" ? (
                            <p className="mt-2 text-xs text-bone-soft">Approved. Payout on the way.</p>
                          ) : c.status === "paid" ? (
                            <p className="mt-2 text-xs text-silver-glow">Paid out. Nice work.</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                      {myClaimsHere.length > 1 ? (
                        <p className="mt-2 text-right text-xs text-bone-soft">
                          combined across your {myClaimsHere.length} clips:{" "}
                          <span className="tabular-nums text-bone">
                            {myClaimsHere.reduce((a, c) => a + (c.view_count ?? 0), 0).toLocaleString()} views
                          </span>{" "}
                          — views stack; they cash together.
                        </p>
                      ) : null}

                    {(() => {
                      const maxClips = Math.min(15, (bounty as any).max_clips_per_editor ?? 15);
                      const remaining = maxClips - myClaimsHere.length;
                      if (remaining <= 0)
                        return <p className="text-xs text-bone-soft">You hold the max of {maxClips} clips on this contract.</p>;
                      return (
                        <form onSubmit={take} className="flex items-center justify-between gap-3 border border-[var(--border)] p-3">
                          <SlotStepper value={clips} setValue={setClips} max={remaining} />
                          <button type="submit" disabled={claimBusy || clips < 1} className="silver-btn disabled:opacity-60">
                            {claimBusy ? "claiming…" : `claim ${clips} more`}
                          </button>
                        </form>
                      );
                    })()}

                    <p className="text-center">
                      <Link to="/submit" className="terminal text-[10px] text-bone-soft underline hover:text-bone">
                        report your view counts on the submit page →
                      </Link>
                    </p>
                  </>
                ) : (
                  <form onSubmit={take} noValidate className="space-y-4">
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
                      <span className="label-cap text-bone-soft">
                        your paypal{wallet ? " (optional — wallet on file)" : ""}
                      </span>
                      <input
                        required={!wallet}
                        type="email"
                        value={paypal}
                        onChange={(e) => {
                          setPaypal(e.target.value);
                          if (touched.paypal_email && e.target.value) validateField("paypal_email", e.target.value);
                        }}
                        onBlur={(e) => {
                          setTouched((t) => ({ ...t, paypal_email: true }));
                          if (e.target.value || !wallet) validateField("paypal_email", e.target.value);
                        }}
                        maxLength={160}
                        aria-invalid={!!(touched.paypal_email && fieldErrors.paypal_email)}
                        aria-describedby="paypal-email-error"
                        className={`dark-input mt-2 ${
                          touched.paypal_email && fieldErrors.paypal_email ? "border-red-500" : ""
                        }`}
                        placeholder={wallet ? `leave blank to get paid at ${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "you@paypal.com"}
                        disabled={claimBusy}
                      />
                      {touched.paypal_email && fieldErrors.paypal_email && (
                        <p id="paypal-email-error" role="alert" className="mt-1 text-xs text-red-400">
                          {fieldErrors.paypal_email}
                        </p>
                      )}
                      {!wallet ? (
                        <p className="mt-1 text-xs text-bone-soft">
                          No PayPal?{" "}
                          <Link to="/dashboard" className="underline hover:text-bone">connect a USDC wallet</Link>{" "}
                          and claim without one.
                        </p>
                      ) : null}
                    </label>

                    <div className="flex items-center justify-between border border-[var(--border)] p-3">
                      <span className="label-cap text-bone-soft">clips</span>
                      <SlotStepper
                        value={clips}
                        setValue={setClips}
                        max={Math.min(15, (bounty as any).max_clips_per_editor ?? 15)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={claimBusy || clips < 1}
                      aria-busy={claimBusy}
                      className="silver-btn w-full disabled:opacity-60"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {claimBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {claimBusy ? "taking contract…" : clips === 1 ? "seize this bounty" : `take ${clips} clip slots`}
                      </span>
                    </button>
                    <p className="text-center text-xs text-bone-soft">
                      Each clip's views count for {(bounty as any).counting_days ?? 14} days after delivery, then pay out pro-rata.
                    </p>
                    <p className="script-note text-center text-lg text-bone-soft">
                      The Bounty Board keeps a record.
                    </p>
                    <p className="text-center">
                      <Link to="/how-it-works" className="terminal text-[10px] text-bone-soft underline hover:text-bone">
                        first contract? how it works
                      </Link>
                    </p>
                  </form>
                )}
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
    case "approved": return "approved — payout pending";
    case "rejected": return "disputed — you may re-deliver";
    case "paid": return "paid out";
    default: return s;
  }
}

function SlotStepper({ value, setValue, max }: { value: number; setValue: (n: number) => void; max: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="fewer clips"
        onClick={() => setValue(Math.max(0, value - 1))}
        className="ink-btn px-3 py-1"
      >
        −
      </button>
      <span className="w-6 text-center font-display text-lg text-bone tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="more clips"
        onClick={() => setValue(Math.min(max, value + 1))}
        className="ink-btn px-3 py-1"
      >
        +
      </button>
    </span>
  );
}

type Teaser = {
  id: string;
  contract_no: number;
  title: string;
  sound_name: string;
  artist_song: string | null;
  reward_points: number;
  reward_cash_cents: number;
  currency: string;
  payout_type: string;
  platform_target: string;
  deadline: string | null;
  access_mode: "invite" | "apply" | null;
  rules: string | null;
};

function LockedCampaign({
  teaser, accessStatus, signedIn, pitch, setPitch, handle, setHandle, busy, onApply, onSignIn,
}: {
  teaser: Teaser;
  accessStatus: string | null;
  signedIn: boolean;
  pitch: string;
  setPitch: (v: string) => void;
  handle: string;
  setHandle: (v: string) => void;
  busy: boolean;
  onApply: (e: React.FormEvent) => void;
  onSignIn: () => void;
}) {
  const reward =
    teaser.payout_type === "per_1k_views"
      ? formatPerViewRate(teaser.reward_cash_cents, teaser.currency)
      : teaser.reward_cash_cents > 0
        ? `${money(teaser.reward_cash_cents, teaser.currency)} per approved delivery`
        : `${teaser.reward_points} pts per approved delivery`;

  return (
    <div className="relative min-h-screen">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <SiteHeader />
      <div className="container-board relative z-10 py-8">
        <div className="flex items-center justify-between">
          <Link to="/board" className="label-cap inline-flex items-center gap-2 text-bone-soft hover:text-bone">
            <ArrowLeft className="h-3.5 w-3.5" /> back to the Bounty Board
          </Link>
          <div className="system-bar">
            <span className="status-dot" />
            contract view · restricted
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          <article className="contract contract-nail holo-glow relative">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--paper-dark)] pb-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--wax-red)]">
                <Lock className="h-3 w-3" /> Private contract
              </span>
              <span className="terminal text-[10px] tracking-[0.15em] text-[var(--color-bs-accent)]">
                {serial(teaser.contract_no)}
              </span>
            </div>

            <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">{teaser.title}</h1>
            {teaser.artist_song ? <p className="mt-1 font-body italic text-ink-soft">for “{teaser.artist_song}”</p> : null}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
              <span>sound · {teaser.sound_name}</span>
              <span>platform · {teaser.platform_target}</span>
              {teaser.deadline ? <span>deadline · {new Date(teaser.deadline).toLocaleDateString()}</span> : null}
            </div>

            <div className="mt-6 border-t border-[var(--paper-dark)] pt-4">
              <div className="label-cap text-ink-soft">Reward</div>
              <p className="mt-1 [font-family:var(--font-brand)] text-lg font-semibold text-ink">{reward}</p>
            </div>

            {teaser.rules ? (
              <div className="mt-4 border-t border-[var(--paper-dark)] pt-4">
                <div className="label-cap text-ink-soft">Rules · preview</div>
                <p className="mt-1 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink-soft">{teaser.rules}</p>
              </div>
            ) : null}
          </article>

          <aside className="board-frame relative mt-6 p-5 md:p-6">
            <div className="corner-bracket absolute top-2 left-2 border-t-2 border-l-2" />
            <div className="corner-bracket absolute top-2 right-2 border-t-2 border-r-2" />
            <div className="corner-bracket absolute bottom-2 left-2 border-b-2 border-l-2" />
            <div className="corner-bracket absolute bottom-2 right-2 border-b-2 border-r-2" />

            {accessStatus === "applied" ? (
              <>
                <h2 className="font-display text-2xl text-bone">Application pending review</h2>
                <p className="mt-2 text-bone-soft">
                  Your pitch is with the campaign owner. We'll email you the moment it's decided.
                </p>
              </>
            ) : accessStatus === "rejected" ? (
              <>
                <h2 className="font-display text-2xl text-bone">Not accepted</h2>
                <p className="mt-2 text-bone-soft">
                  This campaign passed on your application. There's plenty else on the board.
                </p>
                <Link to="/board" className="silver-btn mt-5 w-full">browse open contracts</Link>
              </>
            ) : teaser.access_mode === "invite" ? (
              <>
                <h2 className="font-display text-2xl text-bone">Invite-only campaign</h2>
                <p className="mt-2 text-bone-soft">
                  This contract is locked to invited clippers. If you were promised a seat, sign in with the email you
                  were invited on.
                </p>
                {!signedIn ? (
                  <button type="button" onClick={onSignIn} className="silver-btn mt-5 w-full">sign in</button>
                ) : null}
                <Link to="/board" className="ink-btn mt-3 block w-full text-center">back to the public board</Link>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl text-bone">Apply to this campaign</h2>
                <p className="mt-2 text-sm text-bone-soft">
                  Private campaign — the owner reviews every clipper before slots open.
                </p>
                {!signedIn ? (
                  <button type="button" onClick={onSignIn} className="silver-btn mt-5 w-full">sign in to apply</button>
                ) : (
                  <form onSubmit={onApply} className="mt-4 space-y-4">
                    <label className="block">
                      <span className="label-cap text-bone-soft">your tiktok</span>
                      <div className="mt-2 flex items-center border border-[var(--border)] px-3 py-2">
                        <span className="text-bone-soft">@</span>
                        <input
                          required
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          maxLength={60}
                          disabled={busy}
                          placeholder="yourname"
                          className="w-full bg-transparent px-1 text-bone outline-none placeholder:italic placeholder:text-bone-soft/60"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="label-cap text-bone-soft">your pitch</span>
                      <textarea
                        required
                        rows={4}
                        minLength={10}
                        maxLength={1000}
                        value={pitch}
                        onChange={(e) => setPitch(e.target.value)}
                        disabled={busy}
                        placeholder="what you cut, your usual numbers, why this sound"
                        className="dark-input mt-2 resize-y"
                      />
                    </label>
                    <button type="submit" disabled={busy} aria-busy={busy} className="silver-btn w-full disabled:opacity-60">
                      <span className="inline-flex items-center justify-center gap-2">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {busy ? "sending…" : "apply to this campaign"}
                      </span>
                    </button>
                  </form>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
