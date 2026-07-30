import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { boardLedger } from "@/lib/bounties.functions";
import { FLAGS } from "@/lib/flags";

// Live board ledger. Ships dark: FLAGS.ledger defaults OFF, and even when
// ON the hard guard below means an empty board renders nothing here —
// never a row of zeros.

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function useLedger() {
  const fn = useServerFn(boardLedger);
  return useQuery({
    queryKey: ["board-ledger"],
    queryFn: () => fn(),
    enabled: FLAGS.ledger,
    retry: false,
    staleTime: 60_000,
  });
}

export function LedgerCard() {
  const { data } = useLedger();
  if (!FLAGS.ledger) return null;
  if (!data || data.open_count === 0) return null; // empty board shows nothing
  return (
    <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--color-bs-rule)] bg-[var(--color-bs-rule)] sm:grid-cols-4">
      <LedgerFigure label="open bounties" value={String(data.open_count)} />
      <LedgerFigure label="purse posted" value={money(data.total_purse_cents)} />
      <LedgerFigure label="largest open purse" value={money(data.largest_purse_cents)} />
      <LedgerFigure
        label="last capture"
        value={data.last_capture ? money(data.last_capture.amount_cents) : "—"}
        sub={
          data.last_capture
            ? new Date(data.last_capture.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : undefined
        }
      />
    </div>
  );
}

function LedgerFigure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[var(--color-bs-paper)] px-4 py-4 text-center">
      <div className="font-[var(--font-display)] text-xl font-bold tabular-nums text-[var(--color-bs-ink)]">
        {value}
        {sub ? <span className="ml-1 text-xs font-normal text-[var(--color-bs-ink-mute)]">{sub}</span> : null}
      </div>
      <div className="bs-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-bs-ink-mute)]">{label}</div>
    </div>
  );
}

// Compact header figures: open count + total purse. Same flag, same guard.
export function HeaderLedger() {
  const { data } = useLedger();
  if (!FLAGS.ledger) return null;
  if (!data || data.open_count === 0) return null;
  return (
    <span className="bs-mono ml-1 hidden text-[11px] uppercase tracking-wide text-[var(--color-bs-ink-mute)] lg:inline">
      {data.open_count} open · {money(data.total_purse_cents)} posted
    </span>
  );
}
