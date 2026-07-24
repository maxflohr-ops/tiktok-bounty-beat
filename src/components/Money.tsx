export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function Money({ cents, currency = "USD" }: { cents: number; currency?: string }) {
  return <>{formatMoney(cents, currency)}</>;
}
