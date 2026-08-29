// Whop experience view: the clipper-facing board inside the Whop iframe.
// Auth: whopExperienceContext verifies the proxy-injected x-whop-user-token on
// the server and checks access to this experience. No token → the server fn
// 401s and the shell renders a denial — never a redirect to web login.
// Bounties come from the exact same listPublicBounties query as the web board.

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { whopExperienceContext } from "@/lib/whop.functions";
import { Money } from "@/components/Money";
import { BsEmpty, BsLoading } from "@/components/bs";
import { formatPerViewRate } from "@/lib/rate";
import { WhopExternalLink } from "@/components/whop/WhopExternalLink";

export const Route = createFileRoute("/whop/experiences/$experienceId")({
  component: WhopExperiencePage,
});

function WhopExperiencePage() {
  const { experienceId } = Route.useParams();
  const contextFn = useServerFn(whopExperienceContext);
  const listFn = useServerFn(listPublicBounties);

  const auth = useQuery({
    queryKey: ["whop", "experience", experienceId],
    queryFn: () => contextFn({ data: { experienceId } }),
    retry: false,
  });
  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    enabled: auth.isSuccess && auth.data.hasAccess,
  });

  if (auth.isPending) return <BsLoading label="Checking your Whop pass…" />;
  if (auth.isError) {
    return (
      <BsEmpty
        title="Not signed in"
        body="Open this app from inside Whop — the board needs your Whop pass to seat you."
      />
    );
  }
  if (!auth.data.hasAccess) {
    return <BsEmpty title="No access" body="This experience isn't on your Whop pass." />;
  }

  const open = bounties.filter(
    (b) => b.status !== "expired" && b.status !== "fulfilled" && b.status !== "closed",
  );

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-4">
        <p className="label-cap text-bone-soft">Bounty Sounds</p>
        <h1 className="font-display text-2xl text-bone">The Board</h1>
        <p className="text-xs text-bone-soft">
          Signed in as <span className="font-mono">{auth.data.whopUserId}</span> ·{" "}
          {auth.data.accessLevel}
        </p>
      </header>

      {isLoading ? (
        <BsLoading label="Fetching live contracts…" />
      ) : open.length === 0 ? (
        <BsEmpty title="Board's dry" body="No live purses right now. Check back soon." />
      ) : (
        <ul className="space-y-3">
          {open.map((b) => (
            <li key={b.id} className="rounded-lg border border-bone/15 bg-paper/5 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg text-bone">{b.title}</h2>
                <span className="shrink-0 text-sm text-bone">
                  {b.payout_type === "per_1k_views" ? (
                    formatPerViewRate(b.reward_cash_cents, b.currency)
                  ) : (
                    <Money cents={b.reward_cash_cents} currency={b.currency} />
                  )}
                </span>
              </div>
              <p className="mt-1 text-sm text-bone-soft">{b.sound_name}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-bone-soft">
                <span>
                  {b.deadline ? `ends ${new Date(b.deadline).toLocaleDateString()}` : "open-ended"}
                </span>
                {b.tiktok_sound_url ? (
                  <WhopExternalLink url={b.tiktok_sound_url}>official sound ↗</WhopExternalLink>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-bone-soft">
        Seize &amp; submit from inside Whop lands with identity crossover (next work order).
      </p>
    </div>
  );
}
