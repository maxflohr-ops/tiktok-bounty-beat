import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeBoardAlerts } from "@/lib/alerts.functions";
import { toast } from "sonner";

// One field, one promise: an email when the next purse posts. Signed-in
// editors subscribe with one click on their account email.
export function NotifyForm({ accountEmail }: { accountEmail: string | null }) {
  const subscribeFn = useServerFn(subscribeBoardAlerts);
  const [email, setEmail] = useState(accountEmail ?? "");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await subscribeFn({ data: { email, source: accountEmail ? "board-authed" : "board" } });
      setDone(true);
      toast.success(r.already ? "You're already on the list." : "On the list — you'll hear when a purse posts.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  };
  if (done) return <p className="mt-5 text-sm text-bone-soft">✓ You'll hear the moment a bounty posts.</p>;
  return (
    <form onSubmit={submit} className="mx-auto mt-5 flex max-w-sm items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email for new-bounty alerts"
        className="bone-input flex-1 text-sm"
      />
      <button type="submit" disabled={busy} className="silver-btn whitespace-nowrap text-sm disabled:opacity-60">
        {busy ? "saving…" : "notify me"}
      </button>
    </form>
  );
}
