import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Money } from "@/components/Money";
import { getMe } from "@/lib/me.functions";
import { listMyClaims, deliverProof, updateViewCount } from "@/lib/submissions.functions";
import { listPublicBounties } from "@/lib/bounties.functions";
import { ExternalLink, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({
    meta: [
      { title: "Cash In · THE BOARD" },
      {
        name: "description",
        content:
          "Paste your posted TikTok to deliver proof against a claimed contract and cash in your bounty.",
      },
      { property: "og:title", content: "Cash In · THE BOARD" },
      {
        property: "og:description",
        content: "Deliver proof of your TikTok clip and be paid in crowns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubmitPage,
});

const TIKTOK_URL = /^https?:\/\/((www|vm|vt|m)\.)?tiktok\.com\/.+/i;
function pad(n: number) {
  return n.toString().padStart(3, "0");
}

function SubmitPage() {
  const meFn = useServerFn(getMe);
  const claimsFn = useServerFn(listMyClaims);
  const bountiesFn = useServerFn(listPublicBounties);
  const deliverFn = useServerFn(deliverProof);
  const viewsFn = useServerFn(updateViewCount);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: claims = [], refetch } = useQuery({
    queryKey: ["myClaims"],
    queryFn: () => claimsFn(),
  });
  const { data: bounties = [] } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => bountiesFn(),
  });

  const [url, setUrl] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewsDraft, setViewsDraft] = useState<Record<string, string>>({});

  const openClaims = useMemo(
    () =>
      claims.filter(
        (c: any) => c.status === "claimed" || c.status === "rejected",
      ),
    [claims],
  );
  const inFlight = useMemo(
    () =>
      claims.filter((c: any) =>
        ["submitted", "pending", "in_review", "approved", "paid"].includes(c.status),
      ),
    [claims],
  );

  useEffect(() => {
    if (!selectedId && openClaims.length === 1) setSelectedId(openClaims[0].id);
  }, [openClaims, selectedId]);

  const urlValid = TIKTOK_URL.test(url.trim());

  const deliver = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = selectedId;
    if (!id) {
      toast.error("Pick which contract this clip is for.");
      return;
    }
    if (!urlValid) {
      toast.error("That doesn't look like a TikTok URL.");
      return;
    }
    setBusyId(id);
    try {
      const r = await deliverFn({ data: { submission_id: id, clip_url: url.trim() } });
      toast.success(
        r.auto_check_passed
          ? "Proof delivered. Auto-verified — awaiting the harbormaster."
          : "Proof delivered. Awaiting the harbormaster.",
      );
      setUrl("");
      setSelectedId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery refused.");
    } finally {
      setBusyId(null);
    }
  };

  const saveViews = async (subId: string) => {
    const raw = viewsDraft[subId];
    if (!raw) return;
    const n = Number(raw.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Views must be a number.");
      return;
    }
    setBusyId(subId);
    try {
      await viewsFn({ data: { submission_id: subId, view_count: n } });
      toast.success("View count updated.");
      setViewsDraft((d) => ({ ...d, [subId]: "" }));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusyId(null);
    }
  };

  const bountyOf = (bountyId: string) =>
    bounties.find((b: any) => b.id === bountyId) as any;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board py-8">
        <div className="mx-auto max-w-3xl">
          <span className="label-cap silver">Delivery Office</span>
          <h1 className="mt-2 font-display text-4xl text-bone">Cash in your contract</h1>
          <p className="mt-2 italic text-bone-soft">
            Paste your posted TikTok URL. The board matches it to your open contract,
            confirms the handle by eye, and the harbormaster honors the pot.
          </p>
          {me?.profile?.tiktok_handle ? (
            <p className="mt-2 text-sm text-bone-soft">
              posting as{" "}
              <span className="text-bone">@{me.profile.tiktok_handle}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-bone-soft">
              set your TikTok handle in{" "}
              <Link to="/dashboard" className="underline">the dashboard</Link>{" "}
              before delivering.
            </p>
          )}

          <form
            onSubmit={deliver}
            className="mt-6 board-frame p-5"
          >
            <label className="block">
              <span className="label-cap text-bone-soft">tiktok clip url</span>
              <div className="mt-2 flex items-center gap-2 border border-[var(--border)] px-3 py-2">
                <Link2 className="h-4 w-4 text-bone-soft" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@you/video/…"
                  maxLength={500}
                  className="w-full bg-transparent text-bone outline-none placeholder:italic placeholder:text-bone-soft/60"
                />
              </div>
              {url && !urlValid ? (
                <p className="mt-1 text-xs italic text-bone-soft">
                  must be a tiktok.com link
                </p>
              ) : null}
            </label>

            {openClaims.length === 0 ? (
              <div className="mt-4 border border-[var(--border)] p-3 text-sm italic text-bone-soft">
                you have no open contracts.{" "}
                <Link to="/" className="underline">
                  take one from the board
                </Link>{" "}
                first.
              </div>
            ) : (
              <fieldset className="mt-4">
                <legend className="label-cap text-bone-soft">
                  deliver against
                </legend>
                <div className="mt-2 grid gap-2">
                  {openClaims.map((c: any) => {
                    const b = c.bounty ?? bountyOf(c.bounty_id);
                    const picked = selectedId === c.id;
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-start gap-3 border p-3 transition ${
                          picked
                            ? "border-[var(--gold)] bg-[var(--wall)]/40"
                            : "border-[var(--border)] hover:border-bone-soft"
                        }`}
                      >
                        <input
                          type="radio"
                          name="claim"
                          className="mt-1"
                          checked={picked}
                          onChange={() => setSelectedId(c.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="font-display text-bone">
                              {b?.title ?? "contract"}
                            </span>
                            {b?.contract_no ? (
                              <span className="label-cap text-silver">
                                No. {pad(b.contract_no)}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-xs italic text-bone-soft">
                            {b?.artist_song ? <>“{b.artist_song}” · </> : null}
                            sound {b?.sound_name} · claimed as{" "}
                            @{c.tiktok_handle}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <button
              disabled={busyId === selectedId && !!busyId}
              className="silver-btn mt-5 w-full disabled:opacity-60"
            >
              {busyId ? "delivering…" : "deliver proof"}
            </button>
            <p className="script-note mt-3 text-center text-bone-soft">
              The harbormaster reviews every delivery before silver is released.
            </p>
          </form>

          {inFlight.length > 0 ? (
            <section className="mt-10">
              <div className="rule-double" />
              <h2 className="mt-4 font-display text-2xl text-bone">
                Deliveries in flight
              </h2>
              <div className="mt-4 space-y-3">
                {inFlight.map((c: any) => {
                  const b = c.bounty ?? bountyOf(c.bounty_id);
                  const isPer1k = b?.payout_type === "per_1k_views";
                  return (
                    <div
                      key={c.id}
                      className="board-frame p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <div className="font-display text-bone">
                            {b?.title ?? "contract"}
                          </div>
                          <div className="text-xs italic text-bone-soft">
                            {b?.contract_no ? <>No. {pad(b.contract_no)} · </> : null}
                            {statusLabel(c.status)}
                          </div>
                        </div>
                        {c.tiktok_video_url ? (
                          <a
                            href={c.tiktok_video_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs italic underline text-bone-soft"
                          >
                            view clip <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>

                      {c.auto_check_notes ? (
                        <p className="mt-2 text-xs italic text-bone-soft">
                          {c.auto_check_notes}
                        </p>
                      ) : null}

                      {c.paid_cash_cents > 0 ? (
                        <p className="mt-2 text-sm text-bone-soft">
                          paid{" "}
                          <Money
                            cents={c.paid_cash_cents}
                            currency={b?.currency ?? "USD"}
                          />
                        </p>
                      ) : c.awarded_cash_cents > 0 ? (
                        <p className="mt-2 text-sm text-bone">
                          award pending —{" "}
                          <Money
                            cents={c.awarded_cash_cents}
                            currency={b?.currency ?? "USD"}
                          />
                        </p>
                      ) : null}

                      {isPer1k &&
                      (c.status === "submitted" ||
                        c.status === "pending" ||
                        c.status === "in_review" ||
                        c.status === "approved") ? (
                        <div className="mt-3 flex flex-wrap items-end gap-2">
                          <label className="block">
                            <span className="label-cap text-bone-soft">
                              current views
                            </span>
                            <input
                              inputMode="numeric"
                              placeholder={String(c.view_count ?? 0)}
                              value={viewsDraft[c.id] ?? ""}
                              onChange={(e) =>
                                setViewsDraft((d) => ({
                                  ...d,
                                  [c.id]: e.target.value,
                                }))
                              }
                              className="dark-input mt-1 w-40"
                              maxLength={12}
                            />
                          </label>
                          <button
                            type="button"
                            disabled={busyId === c.id}
                            onClick={() => saveViews(c.id)}
                            className="silver-btn"
                          >
                            update
                          </button>
                          <span className="text-xs italic text-bone-soft">
                            logged: {(c.view_count ?? 0).toLocaleString()}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case "submitted":
    case "pending":
    case "in_review":
      return "in review";
    case "approved":
      return "honored — awaiting crowns";
    case "paid":
      return "paid in crowns";
    case "rejected":
      return "disputed — re-deliver";
    case "claimed":
      return "active";
    default:
      return s;
  }
}
