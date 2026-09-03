import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPublicBounties } from "@/lib/bounties.functions";
import { SiteHeader } from "@/components/SiteHeader";
import {
  BsBadge,
  BsButton,
  BsCard,
  BsDisplay,
  BsEyebrow,
  BsMarker,
  BsMono,
  BsWell,
} from "@/components/bs";
import { formatPerViewRate } from "@/lib/rate";
import { setReturnTo } from "@/lib/return-to";
import { useNavigate } from "@tanstack/react-router";

const CANONICAL = "https://bountysounds.com/join";
const TITLE = "Join Bounty Sounds — Get Paid to Clip TikToks";
const DESCRIPTION =
  "Join the clipper community. Claim a music bounty, post your edit, and get paid per verified view via PayPal or USDC. Free to join, no application.";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: JoinPage,
});

const STEPS = [
  {
    n: "01",
    title: "Take a contract",
    body: "Pick a sound off the Bounty Board. First come, first served — no application, no interview.",
  },
  {
    n: "02",
    title: "Post your edit",
    body: "Cut it your way on your own TikTok, using the campaign's sound. Keep the hashtags on the contract.",
  },
  {
    n: "03",
    title: "Deliver proof",
    body: "Paste the link back here with your handle and payout email. Views count for the contract window.",
  },
  {
    n: "04",
    title: "Get paid",
    body: "Views get verified, payout hits your PayPal or USDC wallet. Points stack on the leaderboard.",
  },
];

function JoinPage() {
  const navigate = useNavigate();
  const listFn = useServerFn(listPublicBounties);
  const { data: bounties = [] } = useQuery({
    queryKey: ["publicBounties"],
    queryFn: () => listFn(),
  });
  const live = bounties.filter((b) => b.status === "active").slice(0, 3);

  const start = () => {
    setReturnTo("/start");
    navigate({ to: "/auth" });
  };

  return (
    <div className="bs-surface min-h-screen">
      <SiteHeader />

      <main className="container-board py-10 md:py-16">
        <BsWell className="text-center">
          <BsEyebrow>invitation · clippers only</BsEyebrow>
          <BsDisplay as="h1" size="lg" className="mt-3">
            You already make the edits. Start getting paid for them.
          </BsDisplay>
          <p className="mx-auto mt-4 max-w-xl text-[var(--color-bs-ink-soft)]">
            Bounty Sounds is where artists post money on their sounds and editors cash in per
            verified view. Free to join. Nothing to pitch. Claim a contract and post.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <BsButton size="lg" onClick={start}>
              Join and claim a bounty
            </BsButton>
            <Link to="/board" className="bs-btn bs-btn-ghost px-7 py-4 text-sm">
              See open bounties
            </Link>
          </div>
          <p className="mt-5">
            <BsMarker>paid in verified views</BsMarker>
          </p>
        </BsWell>

        <section className="mt-14">
          <BsEyebrow>how it runs</BsEyebrow>
          <BsDisplay as="h2" size="sm" className="mt-2">
            Four steps, start to payout
          </BsDisplay>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <BsCard key={s.n} className="p-5">
                <BsMono className="uppercase text-[var(--color-bs-ink-mute)]">{s.n}</BsMono>
                <h3 className="mt-2 text-lg font-semibold text-[var(--color-bs-ink)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">{s.body}</p>
              </BsCard>
            ))}
          </div>
        </section>

        {live.length > 0 ? (
          <section className="mt-14">
            <BsEyebrow>open right now</BsEyebrow>
            <BsDisplay as="h2" size="sm" className="mt-2">
              Contracts you could take today
            </BsDisplay>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {live.map((b) => (
                <li key={b.id}>
                  <Link to="/bounty/$id" params={{ id: b.id }} className="block">
                    <BsCard className="h-full p-5">
                      <BsBadge variant="live">live</BsBadge>
                      <h3 className="mt-3 text-lg font-semibold text-[var(--color-bs-ink)]">
                        {b.title}
                      </h3>
                      {b.artist_song ? (
                        <p className="mt-1 text-sm text-[var(--color-bs-ink-soft)]">
                          {b.artist_song}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm font-medium text-[var(--color-bs-ink)]">
                        {b.payout_type === "per_1k_views"
                          ? formatPerViewRate(b.reward_cash_cents, b.currency ?? "USD")
                          : "flat per approved clip"}
                      </p>
                    </BsCard>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14">
          <BsEyebrow>the fine print, plainly</BsEyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <BsCard variant="flat" className="p-5">
              <h3 className="text-base font-semibold text-[var(--color-bs-ink)]">
                It costs you nothing
              </h3>
              <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">
                No fee, no subscription, no revenue share on your own account.
              </p>
            </BsCard>
            <BsCard variant="flat" className="p-5">
              <h3 className="text-base font-semibold text-[var(--color-bs-ink)]">
                You keep your account
              </h3>
              <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">
                Post from your own TikTok. We only need the handle to verify the clip is yours.
              </p>
            </BsCard>
            <BsCard variant="flat" className="p-5">
              <h3 className="text-base font-semibold text-[var(--color-bs-ink)]">
                Views are verified
              </h3>
              <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">
                Counts are checked against the live post before a payout is approved. Mismatch? File
                a dispute.
              </p>
            </BsCard>
          </div>
        </section>

        <div className="mt-14">
          <BsWell className="text-center">
            <BsDisplay as="h2" size="sm">
              Ready when you are
            </BsDisplay>
            <p className="mx-auto mt-3 max-w-md text-[var(--color-bs-ink-soft)]">
              Sign in, set your handle and payout, take your first contract. Two minutes.
            </p>
            <div className="mt-6 flex justify-center">
              <BsButton size="lg" onClick={start}>
                Create my clipper account
              </BsButton>
            </div>
          </BsWell>
        </div>
      </main>
    </div>
  );
}
