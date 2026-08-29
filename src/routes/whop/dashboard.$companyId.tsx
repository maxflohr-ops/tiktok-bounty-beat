// Whop dashboard view: the funder-facing side inside Whop. Requires admin
// access on the company. WO-1 scope: prove the auth boundary and show the live
// board state; purse posting from here arrives with WO-4.

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listPublicBounties } from "@/lib/bounties.functions";
import { whopDashboardContext } from "@/lib/whop.functions";
import { Money } from "@/components/Money";
import { BsEmpty, BsLoading } from "@/components/bs";

export const Route = createFileRoute("/whop/dashboard/$companyId")({
  component: WhopDashboardPage,
});

function WhopDashboardPage() {
  const { companyId } = Route.useParams();
  const contextFn = useServerFn(whopDashboardContext);
  const listFn = useServerFn(listPublicBounties);

  const auth = useQuery({
    queryKey: ["whop", "dashboard", companyId],
    queryFn: () => contextFn({ data: { companyId } }),
    retry: false,
  });
  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ["bounties", "public"],
    queryFn: () => listFn(),
    enabled: auth.isSuccess && auth.data.accessLevel === "admin",
  });

  if (auth.isPending) return <BsLoading label="Checking your Whop pass…" />;
  if (auth.isError) {
    return <BsEmpty title="Not signed in" body="Open this dashboard from inside Whop." />;
  }
  if (auth.data.accessLevel !== "admin") {
    return <BsEmpty title="Team only" body="This view is for the account's team members." />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-4">
        <p className="label-cap text-bone-soft">Bounty Sounds · funder desk</p>
        <h1 className="font-display text-2xl text-bone">Live contracts</h1>
        <p className="text-xs text-bone-soft">
          Signed in as <span className="font-mono">{auth.data.whopUserId}</span> · admin on{" "}
          <span className="font-mono">{companyId}</span>
        </p>
      </header>

      {isLoading ? (
        <BsLoading label="Fetching contracts…" />
      ) : bounties.length === 0 ? (
        <BsEmpty title="Nothing posted" body="No contracts on the board yet." />
      ) : (
        <ul className="space-y-2">
          {bounties.map((b) => (
            <li
              key={b.id}
              className="flex items-baseline justify-between gap-3 rounded-lg border border-bone/15 bg-paper/5 px-4 py-3"
            >
              <span className="text-sm text-bone">{b.title}</span>
              <span className="shrink-0 text-xs text-bone-soft">
                {b.status} · purse{" "}
                <Money
                  cents={(b as { purse_cents?: number }).purse_cents ?? 0}
                  currency={b.currency}
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-bone-soft">
        Posting a purse from inside Whop lands with purse funding (WO-4).
      </p>
    </div>
  );
}
