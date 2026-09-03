import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { getMe, updateMyProfile } from "@/lib/me.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { BsButton, BsCard, BsDisplay, BsEyebrow, BsLoading, BsMono, BsWell } from "@/components/bs";

export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({
    meta: [
      { title: "Get set up · Bounty Sounds" },
      {
        name: "description",
        content: "Three quick steps: your name, your TikTok handle, and how you want to get paid.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const navigate = useNavigate();
  const meFn = useServerFn(getMe);
  const updFn = useServerFn(updateMyProfile);
  const { data: me, isLoading, refetch } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [pref, setPref] = useState<"paypal" | "usdc">("paypal");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me?.profile) return;
    setName(me.profile.display_name ?? "");
    setHandle(me.profile.tiktok_handle ?? "");
    if (me.profile.payout_preference === "usdc") setPref("usdc");
    setWallet(me.profile.wallet_address ?? "");
  }, [me?.profile]);

  const done = useMemo(() => {
    const p = me?.profile;
    return {
      profile: Boolean(p?.display_name && p?.tiktok_handle),
      payout: Boolean(p?.payout_preference && (p.payout_preference !== "usdc" || p.wallet_address)),
    };
  }, [me?.profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !handle.trim()) {
      toast.error("Add a name and your TikTok handle.");
      return;
    }
    setBusy(true);
    try {
      await updFn({ data: { display_name: name.trim(), tiktok_handle: handle.trim() } });
      toast.success("Saved.");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const savePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updFn({
        data: {
          payout_preference: pref,
          ...(pref === "usdc" ? { wallet_address: wallet.trim() } : {}),
        },
      });
      toast.success("Payout preference saved.");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bs-surface min-h-screen">
        <SiteHeader />
        <main className="container-board py-16">
          <BsLoading variant="well" label="loading your setup" />
        </main>
      </div>
    );
  }

  const stepsDone = Number(done.profile) + Number(done.payout);

  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />
      <main className="container-board py-10 md:py-14">
        <BsWell className="text-center">
          <BsEyebrow>welcome, clipper</BsEyebrow>
          <BsDisplay as="h1" size="md" className="mt-3">
            Let's get you paid
          </BsDisplay>
          <p className="mx-auto mt-3 max-w-lg text-[var(--color-bs-ink-soft)]">
            Two quick things, then take your first contract off the Bounty Board.
          </p>
          <BsMono className="mt-5 block uppercase text-[var(--color-bs-ink-mute)]">
            step {Math.min(stepsDone + 1, 3)} of 3 · {stepsDone}/2 saved
          </BsMono>
        </BsWell>

        <div className="mx-auto mt-10 grid max-w-2xl gap-5">
          <StepCard n="01" title="Your editor's mark" complete={done.profile}>
            <form onSubmit={saveProfile} className="space-y-3">
              <label className="block">
                <span className="bs-mono uppercase text-[var(--color-bs-ink-mute)]">
                  Display name
                </span>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  className="bs-input mt-1"
                  placeholder="How you show on the leaderboard"
                />
              </label>
              <label className="block">
                <span className="bs-mono uppercase text-[var(--color-bs-ink-mute)]">
                  TikTok handle
                </span>
                <input
                  value={handle}
                  maxLength={60}
                  onChange={(e) => setHandle(e.target.value)}
                  className="bs-input mt-1"
                  placeholder="@yourhandle"
                />
              </label>
              <BsButton type="submit" disabled={busy}>
                Save
              </BsButton>
            </form>
          </StepCard>

          <StepCard n="02" title="How you get paid" complete={done.payout}>
            <form onSubmit={savePayout} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["paypal", "usdc"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPref(p)}
                    aria-pressed={pref === p}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      pref === p
                        ? "border-transparent bg-[var(--color-bs-ink)] text-[var(--color-bs-paper)]"
                        : "border-[var(--color-bs-rule)] text-[var(--color-bs-ink-soft)]"
                    }`}
                  >
                    {p === "paypal" ? "PayPal" : "USDC wallet"}
                  </button>
                ))}
              </div>
              {pref === "usdc" ? (
                <label className="block">
                  <span className="bs-mono uppercase text-[var(--color-bs-ink-mute)]">
                    Wallet address
                  </span>
                  <input
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="bs-input mt-1"
                    placeholder="0x…"
                  />
                </label>
              ) : (
                <p className="text-sm text-[var(--color-bs-ink-soft)]">
                  You'll enter the PayPal email on each delivery, so you can split payouts across
                  accounts.
                </p>
              )}
              <BsButton type="submit" disabled={busy}>
                Save
              </BsButton>
            </form>
          </StepCard>

          <StepCard n="03" title="Take your first contract" complete={false}>
            <p className="text-sm text-[var(--color-bs-ink-soft)]">
              Pick a sound, post your edit, paste the link back. Views get verified and the payout
              follows.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/board" className="bs-btn">
                Open the Bounty Board
              </Link>
              <Link to="/how-it-works" className="bs-btn bs-btn-ghost">
                How payouts work
              </Link>
            </div>
          </StepCard>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="bs-mono uppercase text-[var(--color-bs-ink-mute)] underline underline-offset-4"
          >
            skip to my dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

function StepCard({
  n,
  title,
  complete,
  children,
}: {
  n: string;
  title: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <BsCard variant="flat" className="p-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            complete
              ? "bg-[var(--color-bs-ink)] text-[var(--color-bs-paper)]"
              : "border border-[var(--color-bs-rule)] text-[var(--color-bs-ink-mute)]"
          }`}
        >
          {complete ? <Check className="h-4 w-4" aria-hidden /> : n}
        </span>
        <h2 className="text-lg font-semibold text-[var(--color-bs-ink)]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </BsCard>
  );
}
