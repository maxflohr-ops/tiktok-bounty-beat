import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { getMe } from "@/lib/me.functions";
import { getAdminAnalytics } from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Bounty Sounds" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnalyticsPage,
});

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function ago(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <p className="label-cap">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-bone-soft">{sub}</p> : null}
    </div>
  );
}

// Single-series horizontal bars: identity from row labels, magnitude from length.
function StatusBars({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return (
    <div className="space-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3" title={`${k}: ${v}`}>
          <span className="truncate text-xs text-bone-soft">{k.replace(/_/g, " ")}</span>
          <div className="h-4 rounded-[4px] bg-[var(--wall-2)]">
            <div className="h-4 rounded-[4px] bg-[#1d1d1f]" style={{ width: `${Math.max(2, (v / max) * 100)}%` }} />
          </div>
          <span className="text-right text-xs font-semibold tabular-nums">{v}</span>
        </div>
      ))}
      {rows.length === 0 ? <p className="text-sm text-bone-soft">No data yet.</p> : null}
    </div>
  );
}

// Mini daily bar chart — one measure per chart (small multiples, one axis).
function DayBars({ days, field, label }: { days: { day: string; claims: number; deliveries: number }[]; field: "claims" | "deliveries"; label: string }) {
  const max = Math.max(1, ...days.map((d) => d[field]));
  const total = days.reduce((a, d) => a + d[field], 0);
  return (
    <div className="rounded-2xl bg-white p-6">
      <div className="flex items-baseline justify-between">
        <p className="label-cap">{label} · 30 days</p>
        <p className="text-sm font-semibold tabular-nums">{total}</p>
      </div>
      <div className="mt-4 flex h-16 items-end gap-[2px]">
        {days.map((d) => (
          <div
            key={d.day}
            title={`${d.day}: ${d[field]}`}
            className="min-w-0 flex-1 rounded-t-[3px] bg-[#1d1d1f]"
            style={{ height: `${Math.max(d[field] > 0 ? 8 : 2, (d[field] / max) * 100)}%`, opacity: d[field] > 0 ? 1 : 0.12 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-bone-soft">
        <span>{days[0]?.day.slice(5)}</span>
        <span>{days[days.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const meFn = useServerFn(getMe);
  const analyticsFn = useServerFn(getAdminAnalytics);
  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data, isLoading } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: () => analyticsFn(),
    enabled: !!me?.isStaff,
    refetchInterval: 60_000,
  });

  if (meLoading) return <Frame><p className="text-bone-soft">loading…</p></Frame>;
  if (!me?.isStaff)
    return (
      <Frame>
        <h1 className="text-3xl font-semibold">Staff only.</h1>
        <p className="mt-2 text-bone-soft">This page requires an admin account.</p>
        <Link to="/board" className="silver-btn mt-6 inline-flex">Back to the board</Link>
      </Frame>
    );

  const t = data?.totals;

  return (
    <div className="min-h-screen bg-[var(--wall-2)]">
      <SiteHeader />
      <div className="container-board py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-cap">Admin</p>
            <h1 className="mt-1 text-4xl font-semibold">Analytics</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-bone-soft">
            {data ? <span>updated {ago(data.generated_at)}</span> : null}
            <Link to="/admin" className="ink-btn">Admin desk</Link>
          </div>
        </div>

        {isLoading || !t ? (
          <p className="mt-10 text-bone-soft">crunching…</p>
        ) : (
          <>
            {/* Money + reach */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Paid out" value={money(t.paid_cents)} sub={`${money(t.awarded_cents - t.paid_cents)} approved, unpaid`} />
              <Tile label="Funded pots" value={money(t.funded_cents)} sub={`${t.bounties} contracts total`} />
              <Tile label="Verified views" value={compact(t.views_verified)} sub={`${compact(t.views_reported)} self-reported`} />
              <Tile label="Listing revenue" value={money(t.listing_revenue_cents)} sub={`${t.listings} listings`} />
            </div>

            {/* People + pipeline */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="People" value={String(t.users)} sub={`${t.editors_active} have claimed a contract`} />
              <Tile label="Deliveries" value={String(t.submissions)} sub={`${t.auto_check_passed} auto-verified`} />
              <Tile label="Open disputes" value={String(t.disputes_open)} />
              <Tile label="Live contracts" value={String(t.bounties_by_status["active"] ?? 0)} sub={`${t.bounties_by_status["fulfilled"] ?? 0} fulfilled`} />
            </div>

            {/* Activity small multiples */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DayBars days={data.days} field="claims" label="Claims" />
              <DayBars days={data.days} field="deliveries" label="Deliveries" />
            </div>

            {/* Pipelines */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-6">
                <p className="label-cap">Submission pipeline</p>
                <div className="mt-4"><StatusBars data={t.submissions_by_status} /></div>
              </div>
              <div className="rounded-2xl bg-white p-6">
                <p className="label-cap">Contracts by status</p>
                <div className="mt-4"><StatusBars data={t.bounties_by_status} /></div>
              </div>
            </div>

            {/* People table */}
            <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-6">
              <p className="label-cap">Everyone on the platform</p>
              <table className="mt-4 w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-xs text-bone-soft">
                    <th className="py-2 pr-3 font-medium">Person</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Joined</th>
                    <th className="py-2 pr-3 font-medium">Last seen</th>
                    <th className="py-2 pr-3 text-right font-medium">Claims</th>
                    <th className="py-2 pr-3 text-right font-medium">Delivered</th>
                    <th className="py-2 pr-3 text-right font-medium">Approved</th>
                    <th className="py-2 pr-3 text-right font-medium">Views</th>
                    <th className="py-2 pr-3 text-right font-medium">Earned</th>
                    <th className="py-2 text-right font-medium">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium">{p.name ?? "—"}</span>
                        {p.handle ? <span className="ml-2 text-bone-soft">@{p.handle}</span> : null}
                      </td>
                      <td className="py-2.5 pr-3 text-bone-soft">
                        {p.email ?? "—"}
                        {p.wallet ? (
                          <span className="mt-0.5 block font-mono text-[10px]" title={p.wallet}>
                            usdc {p.wallet.slice(0, 6)}…{p.wallet.slice(-4)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 text-bone-soft">{ago(p.joined)}</td>
                      <td className="py-2.5 pr-3 text-bone-soft">{ago(p.last_seen)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{p.claims}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{p.delivered}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{p.approved}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{compact(p.views)}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{money(p.earned_cents)}</td>
                      <td className="py-2.5 text-right tabular-nums">{money(p.paid_cents)}</td>
                    </tr>
                  ))}
                  {data.people.length === 0 ? (
                    <tr><td colSpan={10} className="py-6 text-center text-bone-soft">No people yet.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Recent activity */}
            <div className="mt-4 rounded-2xl bg-white p-6">
              <p className="label-cap">Recent activity</p>
              <ul className="mt-4 divide-y divide-[var(--border)] text-sm">
                {data.recent.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span>
                      <span className="font-medium">@{r.handle}</span>{" "}
                      <span className="text-bone-soft">{r.kind}</span>{" "}
                      <span className="text-bone-soft">· {r.bounty}</span>
                    </span>
                    <span className="text-xs text-bone-soft">{ago(r.at as string)} · {r.status.replace(/_/g, " ")}</span>
                  </li>
                ))}
                {data.recent.length === 0 ? <li className="py-4 text-bone-soft">Quiet so far.</li> : null}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container-board py-20 text-center">{children}</div>
    </div>
  );
}
